(function () {
  function createProofSection() {
    var section = document.createElement('section');
    section.className = 'bb-proof-strip';
    section.setAttribute('aria-label', 'BountyBreach trust and conversion section');
    section.innerHTML =
      '<span class="tag">Offensive Security Services</span>' +
      '<h2>Hands-on security testing for teams that ship fast</h2>' +
      '<p class="section-subtitle">We test web apps, APIs, mobile apps, and source code with a manual-first approach, then help your team fix what matters first.</p>' +
      '<div class="proof-grid">' +
        '<div class="proof-card"><h3>Who We Work With</h3><p>Startup founders, SaaS engineering teams, and product companies preparing for customer security reviews.</p></div>' +
        '<div class="proof-card"><h3>What We Usually Find</h3><p>Broken auth, IDOR, SSRF, insecure secrets handling, and API authorization gaps.</p></div>' +
        '<div class="proof-card"><h3>What You Get</h3><p>A clear report, practical remediation steps, and a retest once fixes are in place.</p></div>' +
        '<div class="proof-card"><h3>How We Test</h3><p>Manual testing first, supported by tooling. Mapped to OWASP and PTES where relevant.</p></div>' +
      '</div>' +
      '<div class="hero-actions">' +
        '<a class="btn btn-primary" href="offensive-security.html">Book Free Consultation</a>' +
        '<a class="btn btn-secondary" href="sample-report.html">Request Sample Report</a>' +
        '<a class="btn btn-secondary" href="secureone-clarity.html">What is SecureOne?</a>' +
      '</div>';
    return section;
  }

  function upgradeHero() {
    var hero = document.querySelector('.hero#overview .hero-copy');
    if (!hero) {
      return;
    }

    var tag = hero.querySelector('.tag');
    var heading = hero.querySelector('h1');
    var desc = hero.querySelector('p');
    var actions = hero.querySelector('.hero-actions');

    if (tag) {
      tag.textContent = 'Offensive Security for Startups and SaaS Teams';
    }
    if (heading) {
      heading.textContent = 'We find security issues before they become incidents.';
    }
    if (desc) {
      desc.textContent = 'BountyBreach runs practical penetration tests and code reviews for web, API, and mobile apps, then works with your team to close findings quickly.';
    }
    if (actions && !actions.querySelector('[data-bb-services]')) {
      var servicesLink = document.createElement('a');
      servicesLink.className = 'btn btn-secondary';
      servicesLink.href = 'offensive-security.html';
      servicesLink.textContent = 'View Service Scope';
      servicesLink.setAttribute('data-bb-services', '1');
      actions.appendChild(servicesLink);
    }
  }

  function injectProofSection() {
    var main = document.querySelector('main.container');
    var heroSection = document.querySelector('.hero#overview');
    if (!main || !heroSection || main.querySelector('.bb-proof-strip')) {
      return;
    }

    heroSection.insertAdjacentElement('afterend', createProofSection());
  }

  function init() {
    if (!/\/index\.html$/.test(window.location.pathname) && window.location.pathname !== '/' && window.location.pathname !== '') {
      return;
    }

    upgradeHero();
    injectProofSection();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
