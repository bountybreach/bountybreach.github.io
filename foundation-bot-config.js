(function () {
  var isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  var existingConfig = window.BOUNTYBREACH_FOUNDATION_BOT_CONFIG || {};
  var localProxyHost = String(window.BB_FOUNDATION_LOCAL_PROXY_HOST || 'localhost').trim();
  var localFoundationHost = String(window.BB_FOUNDATION_LOCAL_FOUNDATION_HOST || '127.0.0.1').trim();
  var localProxyPort = String(window.BB_FOUNDATION_LOCAL_PROXY_PORT || '9091').trim();
  var localFoundationPort = String(window.BB_FOUNDATION_LOCAL_FOUNDATION_PORT || '8100').trim();
  var defaultLocalProxyEndpoint = 'http://' + localProxyHost + ':' + localProxyPort + '/api/v1/ai/chat';
  var defaultLocalFoundationEndpoint = 'http://' + localFoundationHost + ':' + localFoundationPort + '/api/v1/ai/chat';

  // Optional runtime endpoint overrides for local development.
  // Example:
  // window.BB_FOUNDATION_LOCAL_PROXY_HOST = 'localhost';
  // window.BB_FOUNDATION_LOCAL_FOUNDATION_HOST = '127.0.0.1';
  // window.BB_FOUNDATION_LOCAL_PROXY_ENDPOINT = 'http://127.0.0.1:9091/api/v1/ai/chat';
  // window.BB_FOUNDATION_LOCAL_FOUNDATION_ENDPOINT = 'http://127.0.0.1:8100/api/v1/ai/chat';
  var localProxyEndpoint = (window.BB_FOUNDATION_LOCAL_PROXY_ENDPOINT || defaultLocalProxyEndpoint).trim();
  var localFoundationEndpoint = (window.BB_FOUNDATION_LOCAL_FOUNDATION_ENDPOINT || defaultLocalFoundationEndpoint).trim();
  // Set this from the Agent Control Panel value shown as "Agent UUID".
  // Example (in page before this script): window.BB_FOUNDATION_AGENT_UUID = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
  var configuredAgentUuid = (window.BB_FOUNDATION_AGENT_UUID || '').trim();

  // Optional local dev token only when bypassing proxy auth.
  // Example: window.BB_FOUNDATION_LOCAL_TOKEN = 'bbak_xxx';
  var localDevToken = (window.BB_FOUNDATION_LOCAL_TOKEN || '').trim();
  var defaultAgents = configuredAgentUuid
    ? [{ value: configuredAgentUuid, label: 'Configured Agent' }]
    : [
        { value: 'explainer-agent', label: 'Explainer' },
        { value: 'search-agent', label: 'Search' },
        { value: 'reporting-agent', label: 'Reporting' },
        { value: 'remediation-agent', label: 'Remediation' }
      ];

  window.BOUNTYBREACH_FOUNDATION_BOT_CONFIG = Object.assign(
    {
      endpoint: isLocalHost ? localProxyEndpoint : '/api/v1/ai/chat',
      fallbackEndpoints: isLocalHost ? [localFoundationEndpoint] : [],
      token: isLocalHost ? localDevToken : '',
      useProxyAuth: true,
      tenantId: 'public',
      role: 'analyst',
      defaultAgent: configuredAgentUuid || 'explainer-agent',
      title: 'BountyBreach AI Analyst',
      subtitle: 'Powered by AI Foundation',
      launcherLabel: 'AI Analyst',
      welcomeMessage: 'Ask about vulnerabilities, remediation, reports, or security findings.',
      enableOnMobile: true,
      agents: defaultAgents
    },
    existingConfig
  );
})();
