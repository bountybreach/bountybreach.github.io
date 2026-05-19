(function () {
  var config = window.SECUREONE_CHATBASE_CONFIG || {};
  var botId = config.botId || 'YOUR_CHATBASE_BOT_ID';
  var domain = config.domain || 'www.chatbase.co';

  if (!botId || botId === 'YOUR_CHATBASE_BOT_ID') {
    return;
  }

  if (window.__bbChatbaseLoaded) {
    return;
  }

  window.embeddedChatbotConfig = {
    chatbotId: botId,
    domain: domain
  };

  var script = document.createElement('script');
  script.src = 'https://www.chatbase.co/embed.min.js';
  script.defer = true;
  script.setAttribute('chatbotId', botId);
  script.setAttribute('domain', domain);

  document.body.appendChild(script);
  window.__bbChatbaseLoaded = true;
})();
