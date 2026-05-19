(function () {
  var config = window.SECUREONE_MARKETING_CONFIG || {};
  var ga4Id = config.ga4Id || 'G-EXTMGBL6S9';
  var clarityProjectId = config.clarityProjectId || 'wtece0dqmq';
  var consentStorageKey = 'bb_consent_mode_choice_v1';
  var hasLoadedClarity = false;

  var isGa4Configured = /^G-[A-Z0-9]+$/i.test(ga4Id) && ga4Id !== 'G-XXXXXXXXXX';
  var isClarityConfigured = !!clarityProjectId && clarityProjectId !== 'CLARITY_PROJECT_ID';

  function ensureGtagStub() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
  }

  function getConsentChoice() {
    return localStorage.getItem(consentStorageKey);
  }

  function applyConsentMode(consentChoice) {
    if (typeof window.gtag !== 'function') {
      return;
    }

    var isGranted = consentChoice === 'granted';
    window.gtag('consent', 'update', {
      analytics_storage: isGranted ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }

  function applyDefaultConsentMode() {
    if (typeof window.gtag !== 'function') {
      return;
    }

    var consentChoice = getConsentChoice();
    if (consentChoice === 'granted') {
      applyConsentMode('granted');
      return;
    }

    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }

  function loadGa4(measurementId) {
    ensureGtagStub();

    var gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    document.head.appendChild(gaScript);

    applyDefaultConsentMode();

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      anonymize_ip: true,
      page_title: document.title,
      page_path: window.location.pathname + window.location.search
    });
  }

  function loadClarity(projectId) {
    if (hasLoadedClarity || window.__bbClarityLoaded) {
      hasLoadedClarity = true;
      return;
    }

    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', projectId);

    hasLoadedClarity = true;
    window.__bbClarityLoaded = true;
  }

  function trackEvent(eventName, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
  }

  function getCurrentPagePath() {
    return window.location.pathname + window.location.search;
  }

  function setupNavClickTracking() {
    var navLinks = document.querySelectorAll('header nav a');
    if (!navLinks.length) {
      return;
    }

    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        trackEvent('nav_click', {
          link_text: (link.textContent || '').trim(),
          link_url: link.getAttribute('href') || '',
          page_path: getCurrentPagePath()
        });
      });
    });
  }

  function setupVideoPlayTracking() {
    var videos = document.querySelectorAll('video');
    if (!videos.length) {
      return;
    }

    videos.forEach(function (video, index) {
      video.addEventListener('play', function () {
        if (video.dataset.marketingPlayTracked === '1') {
          return;
        }

        var sourceEl = video.querySelector('source');
        var source = video.currentSrc || (sourceEl ? sourceEl.getAttribute('src') : '') || '';
        var videoName = video.id || video.getAttribute('aria-label') || ('video_' + (index + 1));

        trackEvent('video_play_started', {
          video_name: videoName,
          video_src: source,
          page_path: getCurrentPagePath()
        });

        video.dataset.marketingPlayTracked = '1';
      });
    });
  }

  function buildStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '.bb-consent-banner {',
      '  position: fixed;',
      '  left: 16px;',
      '  right: 16px;',
      '  bottom: 16px;',
      '  z-index: 10000;',
      '  max-width: 780px;',
      '  margin: 0 auto;',
      '  border-radius: 14px;',
      '  border: 1px solid #31569b;',
      '  background: linear-gradient(165deg, rgba(9, 18, 44, 0.98), rgba(6, 14, 34, 0.98));',
      '  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);',
      '  padding: 14px 16px;',
      '}',
      '.bb-consent-banner.bb-consent-hidden {',
      '  display: none;',
      '}',
      '.bb-consent-manage-btn {',
      '  position: fixed;',
      '  left: 16px;',
      '  bottom: 16px;',
      '  z-index: 9999;',
      '  border: 1px solid #31569b;',
      '  border-radius: 999px;',
      '  background: rgba(12, 24, 56, 0.92);',
      '  color: #e9efff;',
      '  padding: 9px 12px;',
      '  font-size: 12px;',
      '  font-weight: 600;',
      '  cursor: pointer;',
      '  box-shadow: 0 10px 28px rgba(0,0,0,0.35);',
      '}',
      '.bb-consent-manage-btn.bb-consent-hidden {',
      '  display: none !important;',
      '}',
      '.bb-consent-manage-btn:hover {',
      '  border-color: #4ec9ff;',
      '}',
      '.bb-consent-title {',
      '  margin: 0 0 6px;',
      '  color: #ffffff;',
      '  font-size: 14px;',
      '}',
      '.bb-consent-text {',
      '  margin: 0 0 10px;',
      '  color: #cfddff;',
      '  font-size: 12px;',
      '  line-height: 1.5;',
      '}',
      '.bb-consent-actions {',
      '  display: flex;',
      '  gap: 8px;',
      '  flex-wrap: wrap;',
      '}',
      '.bb-consent-btn {',
      '  border: 1px solid #31569b;',
      '  border-radius: 8px;',
      '  padding: 8px 10px;',
      '  font-size: 12px;',
      '  cursor: pointer;',
      '  font-weight: 600;',
      '}',
      '.bb-consent-btn-primary {',
      '  color: #06142f;',
      '  border: none;',
      '  background: linear-gradient(135deg, #4ec9ff, #7ed3ff);',
      '}',
      '.bb-consent-btn-secondary {',
      '  color: #e9efff;',
      '  background: rgba(17, 31, 67, 0.6);',
      '}',
      '.bb-contact-cta-launcher {',
      '  position: fixed;',
      '  right: 18px;',
      '  bottom: 18px;',
      '  z-index: 9997;',
      '  border: 1px solid #31569b;',
      '  border-radius: 999px;',
      '  background: rgba(12, 24, 56, 0.92);',
      '  color: #e9efff;',
      '  padding: 10px 14px;',
      '  font-size: 13px;',
      '  font-weight: 600;',
      '  cursor: pointer;',
      '  box-shadow: 0 10px 28px rgba(0,0,0,0.35);',
      '}',
      '.bb-contact-cta-launcher:hover {',
      '  border-color: #4ec9ff;',
      '}',
      '.bb-contact-cta-panel {',
      '  position: fixed;',
      '  right: 18px;',
      '  bottom: 70px;',
      '  width: min(360px, calc(100vw - 28px));',
      '  max-height: 82vh;',
      '  overflow: auto;',
      '  z-index: 9998;',
      '  background: linear-gradient(165deg, rgba(9, 18, 44, 0.98), rgba(6, 14, 34, 0.98));',
      '  border: 1px solid #263f76;',
      '  border-radius: 14px;',
      '  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);',
      '}',
      '.bb-contact-cta-hidden { display: none !important; }',
      '.bb-contact-cta-header {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 10px;',
      '  padding: 12px 14px;',
      '  border-bottom: 1px solid #263f76;',
      '}',
      '.bb-contact-cta-title {',
      '  margin: 0;',
      '  font-size: 14px;',
      '  color: #ffffff;',
      '}',
      '.bb-contact-cta-close {',
      '  border: none;',
      '  background: transparent;',
      '  color: #a7b8de;',
      '  font-size: 21px;',
      '  line-height: 1;',
      '  cursor: pointer;',
      '}',
      '.bb-contact-cta-close:hover { color: #4ec9ff; }',
      '.bb-contact-cta-body { padding: 12px 14px 14px; }',
      '.bb-contact-cta-body p {',
      '  margin: 0 0 10px;',
      '  color: #cfddff;',
      '  font-size: 12px;',
      '  line-height: 1.5;',
      '}',
      '.bb-contact-cta-form { display: grid; gap: 8px; }',
      '.bb-contact-cta-form input, .bb-contact-cta-form textarea, .bb-contact-cta-form select {',
      '  width: 100%;',
      '  border: 1px solid #31569b;',
      '  background: rgba(17, 31, 67, 0.6);',
      '  color: #e9efff;',
      '  border-radius: 8px;',
      '  padding: 9px 10px;',
      '  font-size: 12px;',
      '  font-family: inherit;',
      '}',
      '.bb-contact-cta-form textarea { min-height: 86px; resize: vertical; }',
      '.bb-contact-cta-submit {',
      '  border: none;',
      '  border-radius: 9px;',
      '  color: #06142f;',
      '  background: linear-gradient(135deg, #4ec9ff, #7ed3ff);',
      '  box-shadow: 0 8px 26px rgba(78, 201, 255, 0.35);',
      '  padding: 10px 12px;',
      '  font-size: 12px;',
      '  font-weight: 700;',
      '  cursor: pointer;',
      '}',
      '@media (max-width: 700px) {',
      '  .bb-consent-banner { left: 10px; right: 10px; bottom: 10px; }',
      '  .bb-consent-manage-btn { left: 10px; bottom: 10px; }',
      '  .bb-contact-cta-launcher { right: 10px; bottom: 10px; }',
      '  .bb-contact-cta-panel { right: 10px; bottom: 58px; width: calc(100vw - 20px); }',
      '}'
    ].join('\n');

    document.head.appendChild(style);
  }

  function createConsentBanner() {
    var existingChoice = getConsentChoice();

    var banner = document.createElement('div');
    banner.className = 'bb-consent-banner' + ((existingChoice === 'granted' || existingChoice === 'denied') ? ' bb-consent-hidden' : '');
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie and analytics consent');

    banner.innerHTML = [
      '<h3 class="bb-consent-title">Cookie & Analytics Consent</h3>',
      '<p class="bb-consent-text">We use analytics to understand traffic and improve the site. You can accept or reject non-essential tracking.</p>',
      '<div class="bb-consent-actions">',
      '  <button type="button" class="bb-consent-btn bb-consent-btn-primary" data-consent="granted">Accept All</button>',
      '  <button type="button" class="bb-consent-btn bb-consent-btn-secondary" data-consent="denied">Reject Non-Essential</button>',
      '</div>'
    ].join('');

    var manageBtn = document.createElement('button');
    manageBtn.type = 'button';
    manageBtn.className = 'bb-consent-manage-btn' + ((existingChoice === 'granted' || existingChoice === 'denied') ? '' : ' bb-consent-hidden');
    manageBtn.textContent = 'Privacy settings';
    manageBtn.setAttribute('aria-label', 'Open privacy settings');

    function showBannerFromSettings() {
      banner.classList.remove('bb-consent-hidden');
      manageBtn.classList.add('bb-consent-hidden');
      trackEvent('consent_settings_opened', {
        page_path: getCurrentPagePath()
      });
    }

    function handleConsentChoice(choice) {
      localStorage.setItem(consentStorageKey, choice);
      applyConsentMode(choice);

      if (choice === 'granted' && isClarityConfigured) {
        loadClarity(clarityProjectId);
      }

      trackEvent('consent_choice_updated', {
        consent_choice: choice,
        page_path: getCurrentPagePath()
      });

      banner.classList.add('bb-consent-hidden');
      manageBtn.classList.remove('bb-consent-hidden');
    }

    banner.addEventListener('click', function (event) {
      var target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      var choice = target.getAttribute('data-consent');
      if (choice !== 'granted' && choice !== 'denied') {
        return;
      }

      handleConsentChoice(choice);
    });

    manageBtn.addEventListener('click', function () {
      showBannerFromSettings();
    });

    document.body.appendChild(banner);
    document.body.appendChild(manageBtn);
  }

  function createContactCta() {
    var launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'bb-contact-cta-launcher';
    launcher.textContent = 'Contact Us';
    launcher.setAttribute('aria-label', 'Open contact form CTA');

    var panel = document.createElement('aside');
    panel.className = 'bb-contact-cta-panel';
    panel.setAttribute('aria-label', 'Contact form call-to-action');

    panel.innerHTML = [
      '<div class="bb-contact-cta-header">',
      '  <h3 class="bb-contact-cta-title">Talk to SecureOne Team</h3>',
      '  <button type="button" class="bb-contact-cta-close" aria-label="Close contact CTA">&times;</button>',
      '</div>',
      '<div class="bb-contact-cta-body">',
      '  <p>Request a demo, support, or enterprise onboarding. We usually respond quickly.</p>',
      '  <form class="bb-contact-cta-form" action="https://formsubmit.co/support@bountybreach.com" method="POST">',
      '    <input type="hidden" name="_subject" value="New CTA Contact Request from bountybreach.com">',
      '    <input type="hidden" name="_template" value="table">',
      '    <input type="hidden" name="_next" value="https://bountybreach.com/contact.html?submitted=true">',
      '    <input type="text" name="_honey" style="display:none">',
      '    <input name="name" type="text" placeholder="Full Name" required>',
      '    <input name="email" type="email" placeholder="Work Email" required>',
      '    <input name="company" type="text" placeholder="Company" required>',
      '    <select name="topic" required>',
      '      <option value="" disabled selected>Request Type</option>',
      '      <option>Product Demo</option>',
      '      <option>Technical Support</option>',
      '      <option>Enterprise Rollout</option>',
      '      <option>Partnership</option>',
      '    </select>',
      '    <textarea name="message" placeholder="Tell us what you need." required></textarea>',
      '    <button class="bb-contact-cta-submit" type="submit">Send Request</button>',
      '  </form>',
      '</div>'
    ].join('');

    var closeBtn = panel.querySelector('.bb-contact-cta-close');
    var form = panel.querySelector('.bb-contact-cta-form');
    var storageKey = 'bb_contact_cta_closed';
    var isClosed = sessionStorage.getItem(storageKey) === '1';

    if (isClosed) {
      panel.classList.add('bb-contact-cta-hidden');
      trackEvent('contact_cta_launcher_visible', {
        page_path: getCurrentPagePath()
      });
    } else {
      launcher.classList.add('bb-contact-cta-hidden');
      trackEvent('contact_cta_impression', {
        page_path: getCurrentPagePath()
      });
    }

    closeBtn.addEventListener('click', function () {
      panel.classList.add('bb-contact-cta-hidden');
      launcher.classList.remove('bb-contact-cta-hidden');
      sessionStorage.setItem(storageKey, '1');

      trackEvent('contact_cta_closed', {
        page_path: getCurrentPagePath()
      });
    });

    launcher.addEventListener('click', function () {
      panel.classList.remove('bb-contact-cta-hidden');
      launcher.classList.add('bb-contact-cta-hidden');
      sessionStorage.removeItem(storageKey);

      trackEvent('contact_cta_opened', {
        page_path: getCurrentPagePath()
      });
    });

    if (form) {
      form.addEventListener('submit', function () {
        var topic = form.querySelector('select[name="topic"]');
        trackEvent('contact_cta_submitted', {
          request_type: topic ? topic.value : '',
          page_path: getCurrentPagePath()
        });
      });
    }

    document.body.appendChild(panel);
    document.body.appendChild(launcher);
  }

  function init() {
    buildStyles();

    ensureGtagStub();
    applyDefaultConsentMode();

    if (isGa4Configured) {
      loadGa4(ga4Id);
    }

    if (isClarityConfigured && getConsentChoice() === 'granted') {
      loadClarity(clarityProjectId);
    }

    createConsentBanner();

    createContactCta();
    setupNavClickTracking();
    setupVideoPlayTracking();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
