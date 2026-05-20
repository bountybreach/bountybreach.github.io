(function () {

  // ── Stat strip ──────────────────────────────────────────────────────────────
  function createStatStrip() {
    var s = document.createElement('section');
    s.className = 'bb-stat-strip';
    s.setAttribute('aria-label', 'Key security testing metrics');
    s.innerHTML =
      '<div class="stat-item"><span class="stat-num">SAST + SCA<br>+ Secrets + DAST</span><span class="stat-label">Four scan types in one platform</span></div>' +
      '<div class="stat-item"><span class="stat-num">Manual-first</span><span class="stat-label">Pentest approach, not just automated noise</span></div>' +
      '<div class="stat-item"><span class="stat-num">Retest included</span><span class="stat-label">We verify fixes — not just hand off reports</span></div>' +
      '<div class="stat-item"><span class="stat-num">Self-hosted or SaaS</span><span class="stat-label">You choose where your data lives</span></div>';
    return s;
  }

  // ── Persona section ──────────────────────────────────────────────────────────
  function createPersonaSection() {
    var s = document.createElement('section');
    s.className = 'bb-persona-section';
    s.setAttribute('aria-label', 'Who SecureOne and BountyBreach help');
    s.innerHTML =
      '<h2>Built for the teams that own security outcomes</h2>' +
      '<p class="section-subtitle">Whether you lead security, run the pipeline, or ship the code — we fit where you already work.</p>' +
      '<div class="persona-tabs">' +
        '<button class="persona-tab active" data-persona="ciso" type="button">Security Leaders</button>' +
        '<button class="persona-tab" data-persona="eng" type="button">Engineering Teams</button>' +
        '<button class="persona-tab" data-persona="devsecops" type="button">DevSecOps</button>' +
      '</div>' +
      '<div class="persona-panel active" id="persona-ciso">' +
        '<h3>Cut risk. Prove it. Get out of the way of delivery.</h3>' +
        '<ul>' +
          '<li>Unified dashboard — SAST, SCA, Secrets, DAST, and pentest findings in one place</li>' +
          '<li>Policy gates in CI/CD so builds fail on critical findings without manual review</li>' +
          '<li>Pentest-as-a-Service with retest included — know fixes actually work</li>' +
          '<li>OWASP-mapped reports your auditors and customers can read</li>' +
        '</ul>' +
        '<a class="btn btn-primary" href="offensive-security.html">See Managed Pentest Options</a>' +
      '</div>' +
      '<div class="persona-panel" id="persona-eng">' +
        '<h3>Ship faster with security findings that actually make sense.</h3>' +
        '<ul>' +
          '<li>PR and commit-level scans catch issues before they merge</li>' +
          '<li>Semgrep (SAST), Snyk (SCA), Gitleaks (Secrets) — tools your team already knows</li>' +
          '<li>Scan agent runs inside your environment, no data leaves your network</li>' +
          '<li>Remediation context alongside the finding — not just a CVE ID</li>' +
        '</ul>' +
        '<a class="btn btn-primary" href="features.html">See All Features</a>' +
      '</div>' +
      '<div class="persona-panel" id="persona-devsecops">' +
        '<h3>Security that runs with your pipeline, not against it.</h3>' +
        '<ul>' +
          '<li>Jenkins integration with SecureOne pipeline script — drop in and go</li>' +
          '<li>Configurable fail/warn thresholds per severity level</li>' +
          '<li>Scan agent with token-based auth — fits air-gapped and private networks</li>' +
          '<li>GitHub App connection or credential auth — however your team prefers</li>' +
        '</ul>' +
        '<a class="btn btn-primary" href="integrations.html">See Integrations</a>' +
      '</div>';
    return s;
  }

  // ── Proof strip ────────────────────────────────────────────────────────────────
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

  // ── Testimonials ──────────────────────────────────────────────────────────────
  function createTestimonials() {
    var s = document.createElement('section');
    s.className = 'bb-testimonials';
    s.setAttribute('aria-label', 'Customer feedback');
    s.innerHTML =
      '<h2>What teams say after working with us</h2>' +
      '<div class="testimonial-grid">' +
        '<blockquote class="testimonial-card">' +
          '<p>"We needed a pentest before our enterprise deal closed. BountyBreach delivered a report our customer\'s security team actually read and trusted — findings were real, clearly explained, and the retest confirmed everything was fixed."</p>' +
          '<footer>— CTO, SaaS startup (Series A)</footer>' +
        '</blockquote>' +
        '<blockquote class="testimonial-card">' +
          '<p>"SecureOne was the first scanner that surfaced broken object-level authorization issues in our API that our other tools completely missed. The DAST scan caught runtime behavior our static analysis couldn\'t see."</p>' +
          '<footer>— Lead Engineer, API-first product company</footer>' +
        '</blockquote>' +
        '<blockquote class="testimonial-card">' +
          '<p>"Setting up the scan agent took less than 30 minutes. We now block high-severity findings in Jenkins before they can merge — something we\'d been trying to do with other tools for months."</p>' +
          '<footer>— DevSecOps Engineer, fintech team</footer>' +
        '</blockquote>' +
      '</div>';
    return s;
  }

  // ── Sectors ───────────────────────────────────────────────────────────────────
  function createSectorsSection() {
    var s = document.createElement('section');
    s.className = 'bb-sectors';
    s.setAttribute('aria-label', 'Industries served');
    s.innerHTML =
      '<h2>Teams across industries rely on SecureOne</h2>' +
      '<p class="section-subtitle">From pre-launch startups to fintech and healthcare — application security that fits your compliance and delivery requirements.</p>' +
      '<div class="sectors-grid">' +
        '<div class="sector-card"><h3>Fintech &amp; Payments</h3><p>PCI-DSS scoped findings, API auth testing, and secrets detection for teams handling financial data.</p></div>' +
        '<div class="sector-card"><h3>Healthcare &amp; Health Tech</h3><p>PHI-aware testing approach, HIPAA-relevant reporting, and audit-ready pentest documentation.</p></div>' +
        '<div class="sector-card"><h3>SaaS &amp; Cloud Products</h3><p>Multi-tenant security review, CI/CD-integrated scanning, and continuous coverage as features ship.</p></div>' +
        '<div class="sector-card"><h3>Enterprise Software</h3><p>Air-gapped self-hosted deployment, scan agent control, and OWASP-mapped enterprise security reporting.</p></div>' +
      '</div>';
    return s;
  }

  // ── Insights teaser ───────────────────────────────────────────────────────────
  function createInsightsTeaser() {
    var s = document.createElement('section');
    s.className = 'bb-insights-teaser';
    s.setAttribute('aria-label', 'Security insights and resources');
    s.innerHTML =
      '<h2>Security insights worth reading</h2>' +
      '<p class="section-subtitle">Practical guides, attack breakdowns, and remediation walkthroughs from the BountyBreach research team.</p>' +
      '<div class="insights-grid">' +
        '<a class="insight-card" href="security-insights.html">' +
          '<span class="insight-tag">GUIDE</span>' +
          '<h3>OWASP Top 10 for API security — what we actually find in the wild</h3>' +
          '<p>Broken object-level auth, excessive data exposure, and mass assignment show up in almost every API test we run. Here\'s what they look like.</p>' +
        '</a>' +
        '<a class="insight-card" href="sample-report.html">' +
          '<span class="insight-tag">SAMPLE REPORT</span>' +
          '<h3>What a real pentest report looks like</h3>' +
          '<p>An anonymized report from a web application assessment — findings, severity, evidence, and remediation steps.</p>' +
        '</a>' +
        '<a class="insight-card" href="secureone-clarity.html">' +
          '<span class="insight-tag">EXPLAINER</span>' +
          '<h3>Automated scanning vs. manual pentesting — and why you need both</h3>' +
          '<p>SecureOne catches what it can find at scale. Manual pentesters find what requires context and creativity.</p>' +
        '</a>' +
      '</div>' +
      '<div class="hero-actions" style="margin-top:18px;">' +
        '<a class="btn btn-secondary" href="security-insights.html">View All Resources</a>' +
      '</div>';
    return s;
  }

  // ── Hero upgrade ─────────────────────────────────────────────────────────────
  function upgradeHero() {
    var hero = document.querySelector('.hero#overview .hero-copy');
    if (!hero) return;

    var tag = hero.querySelector('.tag');
    var heading = hero.querySelector('h1');
    var desc = hero.querySelector('p');
    var actions = hero.querySelector('.hero-actions');

    if (tag) tag.textContent = 'Automated Scanning + Manual Pentesting';
    if (heading) heading.textContent = 'Find security issues before attackers do — in code, pipelines, and live apps.';
    if (desc) desc.textContent = 'BountyBreach combines SecureOne\'s automated SAST, SCA, Secrets, and DAST scanning with hands-on penetration testing. One platform, one team, full coverage.';

    if (actions && !actions.querySelector('[data-bb-services]')) {
      var servicesLink = document.createElement('a');
      servicesLink.className = 'btn btn-secondary';
      servicesLink.href = 'offensive-security.html';
      servicesLink.textContent = 'View Pentest Services';
      servicesLink.setAttribute('data-bb-services', '1');
      actions.appendChild(servicesLink);
    }
  }

  // ── Announcement bar ──────────────────────────────────────────────────────────
  function injectAnnouncementBar() {
    if (document.querySelector('.bb-announce-bar')) return;
    var bar = document.createElement('div');
    bar.className = 'bb-announce-bar';
    bar.innerHTML = '🔐 <strong>New:</strong> Pentest-as-a-Service with retest included — <a href="offensive-security.html">book a free consultation →</a>';
    var header = document.querySelector('header');
    if (header) {
      header.insertAdjacentElement('beforebegin', bar);
    } else {
      document.body.insertBefore(bar, document.body.firstChild);
    }
  }

  // ── Persona tab behavior ─────────────────────────────────────────────────────
  function initPersonaTabs() {
    var tabs = document.querySelectorAll('.persona-tab');
    var panels = document.querySelectorAll('.persona-panel');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-persona');
        tabs.forEach(function (t) { t.classList.remove('active'); });
        panels.forEach(function (p) { p.classList.remove('active'); });
        tab.classList.add('active');
        var panel = document.getElementById('persona-' + target);
        if (panel) panel.classList.add('active');
      });
    });
  }

  // ── Assembly ──────────────────────────────────────────────────────────────────
  function injectSections() {
    var main = document.querySelector('main.container');
    var heroSection = document.querySelector('.hero#overview');
    if (!main || !heroSection) return;

    if (!main.querySelector('.bb-stat-strip')) {
      heroSection.insertAdjacentElement('afterend', createStatStrip());
    }

    var statStrip = main.querySelector('.bb-stat-strip');
    if (statStrip && !main.querySelector('.bb-persona-section')) {
      statStrip.insertAdjacentElement('afterend', createPersonaSection());
      initPersonaTabs();
    }

    var personaSection = main.querySelector('.bb-persona-section');
    if (personaSection && !main.querySelector('.bb-proof-strip')) {
      personaSection.insertAdjacentElement('afterend', createProofSection());
    }

    var proofStrip = main.querySelector('.bb-proof-strip');
    if (proofStrip && !main.querySelector('.bb-testimonials')) {
      proofStrip.insertAdjacentElement('afterend', createTestimonials());
    }

    var testimonials = main.querySelector('.bb-testimonials');
    if (testimonials && !main.querySelector('.bb-sectors')) {
      testimonials.insertAdjacentElement('afterend', createSectorsSection());
    }

    var lastSection = main.querySelector('section:last-of-type');
    if (lastSection && !main.querySelector('.bb-insights-teaser')) {
      lastSection.insertAdjacentElement('beforebegin', createInsightsTeaser());
    }
  }

  function init() {
    var path = window.location.pathname;
    if (!/\/index\.html$/.test(path) && path !== '/' && path !== '') return;
    injectAnnouncementBar();
    upgradeHero();
    injectSections();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
