# Foundation Proxy (Production)

This service is the production reverse proxy for the site chatbot.

It keeps `BB_AI` credentials on the server and forwards browser chat traffic to the AI Foundation upstream endpoint.

## Endpoints

- `GET /health`
- `GET /ready`
- `GET /upstream/auth-check`
- `POST /api/v1/ai/chat`

## Environment

Copy `.env.example` to `.env` and set production values:

- `PORT`: proxy listen port (default `9091`)
- `BB_PROXY_FOUNDATION_BASE_URL`: upstream foundation base URL (required)
- `BB_PROXY_FOUNDATION_TOKEN`: upstream bearer token (required)
- `BB_PROXY_TENANT_ID`: tenant header/context value (default `public`)
- `BB_PROXY_ROLE`: role header value (default `analyst`)
- `BB_PROXY_AGENT_ID`: optional upstream agent ID/UUID override; when set, proxy always routes chat to this agent
- `BB_PROXY_ALLOWED_ORIGINS`: comma-separated CORS allowlist
- `BB_PROXY_ALLOWED_AGENTS`: optional comma-separated allowed agent IDs
- `BB_PROXY_TIMEOUT_MS`: upstream timeout in milliseconds (default `20000`)
- `BB_PROXY_BODY_LIMIT`: JSON body size limit (default `256kb`)

## Local run

```bash
cp .env.example .env
npm install
export BB_PROXY_FOUNDATION_BASE_URL="http://127.0.0.1:8100"
export BB_PROXY_FOUNDATION_TOKEN="yrjdKmkEPV5SUu2k"
export BB_PROXY_AGENT_ID="<agent-uuid-from-control-panel>"
npm run start
```

Local expectation:
- AI Foundation runs on `http://127.0.0.1:8100`
- Proxy runs on `http://127.0.0.1:9091`
- Website bot targets proxy first and falls back to direct foundation endpoint on localhost.

## Managed key + agent UUID workflow

1. In AI Foundation control panel, create an agent and copy its `Agent UUID` value.
2. In API Keys page, generate a key for that same agent and copy the **raw key** shown once.
3. Set proxy env:
	- `BB_PROXY_FOUNDATION_TOKEN=<raw_api_key>`
	- `BB_PROXY_AGENT_ID=<agent_uuid>`
4. Restart proxy.

If `/api/v1/ai/chat` returns `Invalid API key`, verify the token is the full raw key (not preview/masked value) and the key is active/not expired.

## Production notes

1. Deploy this service behind your website domain and route `/api/v1/ai/chat` to it.
2. Keep `token` empty in `foundation-bot-config.js` so browser code never carries secrets.
3. For local dev, set `BB_PROXY_FOUNDATION_TOKEN` to your foundation API key. In this repo, the default is currently `yrjdKmkEPV5SUu2k` (or set `BB_AI_DEFAULT_API_KEY` in foundation config).
4. Restrict `BB_PROXY_ALLOWED_ORIGINS` to trusted domains.
5. Rotate `BB_PROXY_FOUNDATION_TOKEN` regularly in non-dev environments.
6. Put TLS and standard ingress protections in front of this proxy.

## Auth check

Use this endpoint to confirm the proxy can authenticate to the foundation without exposing the token:

```bash
curl http://127.0.0.1:9091/upstream/auth-check
```
