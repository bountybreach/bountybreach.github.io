(function () {
  if (window.__bbFoundationBotLoaded) {
    return;
  }

  window.__bbFoundationBotLoaded = true;

  var config = window.BOUNTYBREACH_FOUNDATION_BOT_CONFIG || {};
  var storageKey = 'bb-foundation-bot-user-id';
  var suggestions = [
    'Explain a SQL injection finding in simple terms',
    'Search recent remediation steps for leaked secrets',
    'Summarize how to fix an exposed S3 bucket',
    'Draft a short remediation plan for a critical CVE'
  ];

  function createUserId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    return 'web-' + Math.random().toString(36).slice(2, 10);
  }

  function getUserId() {
    try {
      var existing = window.localStorage.getItem(storageKey);
      if (existing) {
        return existing;
      }

      var created = createUserId();
      window.localStorage.setItem(storageKey, created);
      return created;
    } catch (error) {
      return createUserId();
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatText(value) {
    return escapeHtml(value).replace(/\n/g, '<br>');
  }

  function appendMessage(container, role, content) {
    var item = document.createElement('div');
    item.className = 'bb-foundation-bot__message bb-foundation-bot__message--' + role;

    var bubble = document.createElement('div');
    bubble.className = 'bb-foundation-bot__bubble';
    bubble.innerHTML = formatText(content);

    item.appendChild(bubble);
    container.appendChild(item);
    container.scrollTop = container.scrollHeight;
  }

  function setBusy(elements, isBusy) {
    elements.input.disabled = isBusy;
    elements.send.disabled = isBusy;
    elements.agent.disabled = isBusy;
    elements.status.textContent = isBusy ? 'Thinking…' : 'Ready';
  }

  function buildSetupMessage() {
    return 'Bot setup incomplete. Configure `window.BOUNTYBREACH_FOUNDATION_BOT_CONFIG.endpoint` to connect this widget to BountyBreach AI Foundation.';
  }

  function getRequestEndpoints() {
    var endpoints = [];

    if (typeof config.endpoint === 'string' && config.endpoint.trim()) {
      endpoints.push(config.endpoint.trim());
    }

    if (Array.isArray(config.fallbackEndpoints)) {
      config.fallbackEndpoints.forEach(function (item) {
        if (typeof item === 'string' && item.trim()) {
          endpoints.push(item.trim());
        }
      });
    }

    return endpoints.filter(function (value, index, list) {
      return list.indexOf(value) === index;
    });
  }

  async function sendMessage(elements) {
    var message = elements.input.value.trim();
    if (!message) {
      return;
    }

    appendMessage(elements.messages, 'user', message);
    elements.input.value = '';
    setBusy(elements, true);

    var endpoints = getRequestEndpoints();
    if (endpoints.length === 0) {
      appendMessage(elements.messages, 'assistant', buildSetupMessage());
      setBusy(elements, false);
      return;
    }

    try {
      var userId = getUserId();
      var lastError = null;
      var payload = {};
      var response = null;

      for (var index = 0; index < endpoints.length; index += 1) {
        var endpoint = endpoints[index];
        var headers = {
          'Content-Type': 'application/json',
          'x-tenant-id': config.tenantId || 'public',
          'x-role': config.role || 'analyst',
          'x-user-id': userId
        };

        if (config.token) {
          headers.Authorization = 'Bearer ' + config.token;
          headers['x-api-key'] = config.token;
        }

        try {
          response = await window.fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              message: message,
              agent: elements.agent.value,
              context: {
                tenant_id: config.tenantId || 'public',
                user_id: userId
              }
            })
          });
        } catch (networkError) {
          lastError = networkError;
          continue;
        }

        payload = await response.json().catch(function () {
          return {};
        });

        if (response.ok) {
          break;
        }

        var isServerError = response.status >= 500;
        if (isServerError && index < endpoints.length - 1) {
          lastError = new Error(payload.detail || payload.message || 'Foundation bot request failed.');
          lastError.status = response.status;
          continue;
        }

        var requestError = new Error(payload.detail || payload.message || 'Foundation bot request failed.');
        requestError.status = response.status;
        throw requestError;
      }

      if (!response || !response.ok) {
        throw lastError || new Error('Foundation bot request failed.');
      }

      appendMessage(elements.messages, 'assistant', payload.response || 'No response received.');
      elements.status.textContent = payload.metadata && payload.metadata.model
        ? 'Ready · ' + payload.metadata.model
        : 'Ready';
    } catch (error) {
      var isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      var statusCode = typeof error.status === 'number' ? error.status : 0;
      var errorMessage = (error && error.message) ? error.message : 'Foundation bot request failed.';
      var lowerMessage = errorMessage.toLowerCase();
      var isAuthError = statusCode === 401 || statusCode === 403 || lowerMessage.indexOf('invalid api key') !== -1 || lowerMessage.indexOf('unauthorized') !== -1;
      var isReachabilityError = statusCode === 0 || statusCode === 502 || statusCode === 503 || statusCode === 504 || lowerMessage.indexOf('failed to fetch') !== -1 || lowerMessage.indexOf('timeout') !== -1;

      if (isAuthError) {
        appendMessage(elements.messages, 'assistant', 'Authentication to AI Foundation failed. ' + errorMessage + ' Verify the managed API key configured in `foundation-proxy` (`BB_PROXY_FOUNDATION_TOKEN`) is the full raw key value and still active.');
      } else {
        var hint = (isLocalHost && isReachabilityError)
          ? ' Start `foundation-proxy` on 9091 or run AI Foundation on 8100, then retry.'
          : '';
        appendMessage(elements.messages, 'assistant', 'I could not reach the AI Foundation right now. ' + errorMessage + hint);
      }
      elements.status.textContent = 'Connection issue';
    } finally {
      setBusy(elements, false);
      elements.input.focus();
    }
  }

  function mountBot() {
    if (!config.enableOnMobile && window.innerWidth < 768) {
      return;
    }

    var root = document.createElement('div');
    root.className = 'bb-foundation-bot';
    root.innerHTML = [
      '<button type="button" class="bb-foundation-bot__launcher" aria-expanded="false" aria-controls="bb-foundation-bot-panel">',
      '  <span class="bb-foundation-bot__launcher-badge">AI</span>',
      '  <span>' + escapeHtml(config.launcherLabel || 'AI Analyst') + '</span>',
      '</button>',
      '<section id="bb-foundation-bot-panel" class="bb-foundation-bot__panel" hidden>',
      '  <div class="bb-foundation-bot__panel-header">',
      '    <div>',
      '      <strong>' + escapeHtml(config.title || 'BountyBreach AI Analyst') + '</strong>',
      '      <div class="bb-foundation-bot__subtitle">' + escapeHtml(config.subtitle || 'Powered by AI Foundation') + '</div>',
      '    </div>',
      '    <button type="button" class="bb-foundation-bot__close" aria-label="Close AI bot">×</button>',
      '  </div>',
      '  <div class="bb-foundation-bot__toolbar">',
      '    <label class="bb-foundation-bot__label" for="bb-foundation-bot-agent">Agent</label>',
      '    <select id="bb-foundation-bot-agent" class="bb-foundation-bot__select"></select>',
      '    <span class="bb-foundation-bot__status">Ready</span>',
      '  </div>',
      '  <div class="bb-foundation-bot__messages"></div>',
      '  <div class="bb-foundation-bot__suggestions"></div>',
      '  <form class="bb-foundation-bot__composer">',
      '    <textarea rows="3" placeholder="Ask BountyBreach AI Foundation…"></textarea>',
      '    <button type="submit">Send</button>',
      '  </form>',
      '</section>'
    ].join('');

    document.body.appendChild(root);

    var launcher = root.querySelector('.bb-foundation-bot__launcher');
    var panel = root.querySelector('.bb-foundation-bot__panel');
    var closeButton = root.querySelector('.bb-foundation-bot__close');
    var agent = root.querySelector('.bb-foundation-bot__select');
    var messages = root.querySelector('.bb-foundation-bot__messages');
    var suggestionsRoot = root.querySelector('.bb-foundation-bot__suggestions');
    var composer = root.querySelector('.bb-foundation-bot__composer');
    var input = composer.querySelector('textarea');
    var send = composer.querySelector('button');
    var status = root.querySelector('.bb-foundation-bot__status');

    (config.agents || []).forEach(function (item) {
      var option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      option.selected = item.value === (config.defaultAgent || 'explainer-agent');
      agent.appendChild(option);
    });

    suggestions.forEach(function (suggestion) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'bb-foundation-bot__chip';
      button.textContent = suggestion;
      button.addEventListener('click', function () {
        input.value = suggestion;
        input.focus();
      });
      suggestionsRoot.appendChild(button);
    });

    appendMessage(
      messages,
      'assistant',
      config.welcomeMessage || 'Ask about vulnerabilities, remediation, reports, or security findings.'
    );

    function openPanel() {
      panel.hidden = false;
      launcher.setAttribute('aria-expanded', 'true');
      input.focus();
    }

    function closePanel() {
      panel.hidden = true;
      launcher.setAttribute('aria-expanded', 'false');
    }

    launcher.addEventListener('click', function () {
      if (panel.hidden) {
        openPanel();
      } else {
        closePanel();
      }
    });

    closeButton.addEventListener('click', closePanel);

    composer.addEventListener('submit', function (event) {
      event.preventDefault();
      sendMessage({
        input: input,
        send: send,
        agent: agent,
        messages: messages,
        status: status
      });
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        composer.requestSubmit();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountBot);
  } else {
    mountBot();
  }
})();
