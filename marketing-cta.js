(function () {
  var config = window.SECUREONE_MARKETING_CONFIG || {};
  var ga4Id = config.ga4Id || 'G-XXXXXXXXXX';
  var clarityProjectId = config.clarityProjectId || 'CLARITY_PROJECT_ID';

  var isGa4Configured = /^G-[A-Z0-9]+$/i.test(ga4Id) && ga4Id !== 'G-XXXXXXXXXX';
  var isClarityConfigured = !!clarityProjectId && clarityProjectId !== 'CLARITY_PROJECT_ID';

  function loadGa4(measurementId) {
    var gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      anonymize_ip: true,
      page_title: document.title,
      page_path: window.location.pathname + window.location.search
    });
  }

  function loadClarity(projectId) {
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
      '  .bb-contact-cta-launcher { right: 10px; bottom: 10px; }',
      '  .bb-contact-cta-panel { right: 10px; bottom: 58px; width: calc(100vw - 20px); }',
      '}'
    ].join('\n');

    document.head.appendChild(style);
  }

  function createContactCta() {
    buildStyles();

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
    if (isGa4Configured) {
      loadGa4(ga4Id);
    }

    if (isClarityConfigured) {
      loadClarity(clarityProjectId);
    }

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
