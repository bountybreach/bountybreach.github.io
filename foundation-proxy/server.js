import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';

dotenv.config();

const app = express();
app.disable('x-powered-by');

const port = Number(process.env.PORT || 9091);
const foundationBaseUrl = (process.env.BB_PROXY_FOUNDATION_BASE_URL || '').replace(/\/$/, '');
const foundationToken = process.env.BB_PROXY_FOUNDATION_TOKEN || '';
const tenantId = process.env.BB_PROXY_TENANT_ID || 'public';
const role = process.env.BB_PROXY_ROLE || 'analyst';
const upstreamAgentId = (process.env.BB_PROXY_AGENT_ID || '').trim();
const requestTimeoutMs = Number(process.env.BB_PROXY_TIMEOUT_MS || 20000);
const authTimeoutMs = Number(process.env.BB_PROXY_AUTH_TIMEOUT_MS || Math.min(requestTimeoutMs, 15000));
const chatTimeoutMs = Number(process.env.BB_PROXY_CHAT_TIMEOUT_MS || Math.max(requestTimeoutMs, 120000));
const bodyLimit = process.env.BB_PROXY_BODY_LIMIT || '256kb';
const allowedOrigins = (process.env.BB_PROXY_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedAgents = (process.env.BB_PROXY_ALLOWED_AGENTS || '')
  .split(',')
  .map((agent) => agent.trim())
  .filter(Boolean);

if (!foundationBaseUrl) {
  throw new Error('Missing required env var BB_PROXY_FOUNDATION_BASE_URL');
}

if (!foundationToken) {
  throw new Error('Missing required env var BB_PROXY_FOUNDATION_TOKEN');
}

if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs < 1000) {
  throw new Error('Invalid BB_PROXY_TIMEOUT_MS. Use a number >= 1000');
}

if (!Number.isFinite(authTimeoutMs) || authTimeoutMs < 1000) {
  throw new Error('Invalid BB_PROXY_AUTH_TIMEOUT_MS. Use a number >= 1000');
}

if (!Number.isFinite(chatTimeoutMs) || chatTimeoutMs < 1000) {
  throw new Error('Invalid BB_PROXY_CHAT_TIMEOUT_MS. Use a number >= 1000');
}

app.use((req, res, next) => {
  const requestId = req.header('x-request-id') || randomUUID();
  const startedAt = Date.now();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'no-referrer');

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.info(
      `[foundation-proxy] ${req.method} ${req.path} status=${res.statusCode} req_id=${requestId} duration_ms=${durationMs}`
    );
  });

  next();
});

if (allowedOrigins.length > 0) {
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error('CORS origin not allowed'));
      },
      methods: ['POST', 'GET', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'x-request-id',
        'x-user-id',
        'x-tenant-id',
        'x-role',
        'authorization',
        'x-api-key',
      ],
      optionsSuccessStatus: 204,
      maxAge: 86400,
    })
  );
}

app.use(express.json({ limit: bodyLimit }));

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'foundation-proxy',
  });
});

app.get('/ready', (_req, res) => {
  res.status(200).json({
    status: 'ready',
    upstream: foundationBaseUrl,
    upstream_agent_id: upstreamAgentId || null,
    token_configured: Boolean(foundationToken),
    agent_restrictions_enabled: allowedAgents.length > 0,
  });
});

app.get('/upstream/auth-check', async (_req, res) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), authTimeoutMs);

  try {
    const upstreamResponse = await fetch(`${foundationBaseUrl}/v1/audit`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${foundationToken}`,
        'x-api-key': foundationToken,
        'x-tenant-id': tenantId,
        'x-role': 'admin',
        'x-user-id': 'proxy-auth-check',
      },
      signal: controller.signal,
    });

    if (upstreamResponse.ok) {
      return res.status(200).json({
        status: 'ok',
        upstream: 'auth_valid',
      });
    }

    if (upstreamResponse.status === 401) {
      return res.status(401).json({
        status: 'error',
        detail: 'Invalid upstream API key.',
      });
    }

    if (upstreamResponse.status === 403) {
      return res.status(403).json({
        status: 'error',
        detail: 'Upstream API key is valid, but the role or tenant is not allowed.',
      });
    }

    return res.status(502).json({
      status: 'error',
      detail: 'Upstream auth check failed.',
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({
        status: 'error',
        detail: 'Upstream auth check timed out. This does not indicate invalid credentials.',
      });
    }

    return res.status(502).json({
      status: 'error',
      detail: 'Unable to reach upstream auth check endpoint.',
    });
  } finally {
    clearTimeout(timeout);
  }
});

app.post('/api/v1/ai/chat', async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const requestedAgent = typeof req.body?.agent === 'string' ? req.body.agent.trim() : '';
  const upstreamAgent = upstreamAgentId || requestedAgent;
  const userId = typeof req.body?.context?.user_id === 'string' ? req.body.context.user_id.trim() : '';

  if (!message || !upstreamAgent || !userId) {
    return res.status(400).json({
      detail: 'Invalid payload. Required fields: message, agent, context.user_id',
      request_id: req.requestId,
    });
  }

  if (message.length > 8000 || upstreamAgent.length > 180 || userId.length > 256) {
    return res.status(400).json({
      detail: 'Payload exceeds allowed length limits.',
      request_id: req.requestId,
    });
  }

  const allowlistAgent = upstreamAgentId ? upstreamAgent : requestedAgent;
  if (allowedAgents.length > 0 && !allowedAgents.includes(allowlistAgent)) {
    return res.status(400).json({
      detail: 'Unsupported agent.',
      request_id: req.requestId,
    });
  }

  const upstreamPayload = {
    message,
    agent: upstreamAgent,
    context: {
      tenant_id: tenantId,
      user_id: userId,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), chatTimeoutMs);

  try {
    const upstreamResponse = await fetch(`${foundationBaseUrl}/api/v1/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${foundationToken}`,
        'x-api-key': foundationToken,
        'x-tenant-id': tenantId,
        'x-role': role,
        'x-user-id': userId,
        'x-request-id': req.requestId,
      },
      body: JSON.stringify(upstreamPayload),
      signal: controller.signal,
    });

    const responseText = await upstreamResponse.text();
    let responseBody = {};

    if (responseText) {
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = { detail: responseText };
      }
    }

    if (!upstreamResponse.ok) {
      if (upstreamResponse.status === 401) {
        return res.status(401).json({
          detail: 'Invalid API key from upstream. Set BB_PROXY_FOUNDATION_TOKEN to the full raw key from AI Foundation API Keys (not the preview).',
          request_id: req.requestId,
        });
      }
      return res.status(upstreamResponse.status).json({
        detail: responseBody.detail || responseBody.message || 'Foundation upstream request failed.',
        request_id: req.requestId,
      });
    }

    return res.status(200).json(responseBody);
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({
        detail: 'Upstream LLM response is taking longer than expected. The request timed out while waiting.',
        request_id: req.requestId,
      });
    }

    console.error('[foundation-proxy] upstream error', {
      request_id: req.requestId,
      message: error.message,
    });

    return res.status(502).json({
      detail: 'Failed to reach AI Foundation upstream service.',
      request_id: req.requestId,
    });
  } finally {
    clearTimeout(timeout);
  }
});

app.use((error, req, res, _next) => {
  if (error && error.message === 'CORS origin not allowed') {
    return res.status(403).json({
      detail: 'Origin not allowed by CORS policy.',
      request_id: req.requestId,
    });
  }

  if (error && error.type === 'entity.parse.failed') {
    return res.status(400).json({
      detail: 'Request body must be valid JSON.',
      request_id: req.requestId,
    });
  }

  console.error('[foundation-proxy] unhandled error', {
    request_id: req.requestId,
    message: error && error.message ? error.message : 'Unknown error',
  });

  return res.status(500).json({
    detail: 'Internal proxy error.',
    request_id: req.requestId,
  });
});

app.listen(port, () => {
  console.log(`[foundation-proxy] listening on http://127.0.0.1:${port}`);
});
