(function () {
  var config = window.SECUREONE_CHATBASE_CONFIG || {};
  var botId = config.botId || 'c3OrETioT9kPdS7UgpQA2';
  var domain = config.domain || 'www.chatbase.co';
  var debug = !!config.debug;

  function log() {
    if (!debug || !window.console || typeof window.console.log !== 'function') {
      return;
    }
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[chatbase-loader]');
    window.console.log.apply(window.console, args);
  }

  if (!botId || botId === 'YOUR_CHATBASE_BOT_ID') {
    log('No botId configured.');
    return;
  }

  if (window.__bbChatbaseLoaded || window.__bbChatbaseLoading) {
    log('Skipped duplicate initialization.');
    return;
  }

  function injectChatbase() {
    if (window.__bbChatbaseLoaded || window.__bbChatbaseLoading) {
      return;
    }

    window.__bbChatbaseLoading = true;

    window.embeddedChatbotConfig = {
      chatbotId: botId,
      domain: domain
    };

    var script = document.createElement('script');
    script.src = 'https://www.chatbase.co/embed.min.js';
    script.defer = true;
    script.setAttribute('chatbotId', botId);
    script.setAttribute('domain', domain);

    script.onload = function () {
      window.__bbChatbaseLoaded = true;
      window.__bbChatbaseLoading = false;
      log('Chatbase embed script loaded.');
    };

    script.onerror = function () {
      window.__bbChatbaseLoading = false;
      log('Failed to load Chatbase embed script.');
    };

    if (document.body) {
      document.body.appendChild(script);
    } else if (document.head) {
      document.head.appendChild(script);
    } else {
      window.__bbChatbaseLoading = false;
      log('No document head/body available for script injection.');
      return;
    }

    log('Injecting Chatbase with botId:', botId);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectChatbase);
  } else {
    injectChatbase();
  }
})();
