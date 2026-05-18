/**
 * CTA Guide System
 * Guides customers through recommended website flows
 * Non-intrusive: Does not modify existing page content
 */

class CTAGuide {
  constructor(config = {}) {
    this.config = {
      storageKey: 'secureone_cta_guide_state',
      autoStartThreshold: 0, // Pages visited before auto-start
      showDismissOption: true,
      animationDuration: 300,
      ...config
    };
    this.state = this.loadState();
    this.currentGuide = null;
    this.currentStep = 0;
    this.guidesConfig = {};
    this.init();
  }

  init() {
    this.loadGuidesConfig();
    window.addEventListener('load', () => this.determineFlow());
  }

  loadState() {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      return stored ? JSON.parse(stored) : {
        guidesStarted: [],
        guidesCompleted: [],
        lastPage: null,
        pagesVisited: 0,
        dismissedGuides: []
      };
    } catch (e) {
      return {
        guidesStarted: [],
        guidesCompleted: [],
        lastPage: null,
        pagesVisited: 0,
        dismissedGuides: []
      };
    }
  }

  saveState() {
    localStorage.setItem(this.config.storageKey, JSON.stringify(this.state));
  }

  loadGuidesConfig() {
    // Define guide flows based on user journey
    this.guidesConfig = {
      // Flow 1: First-time visitor on homepage
      homeExploration: {
        id: 'homeExploration',
        name: 'Explore SecureOne Features',
        description: 'Learn what SecureOne can do for your security',
        targetPage: 'index.html',
        condition: () => this.state.pagesVisited < 3 && !this.isPageInHistory('features.html'),
        steps: [
          {
            element: '.hero h1',
            title: 'Welcome to SecureOne',
            description: 'A modern application security platform built for DevSecOps teams. Let\'s explore what makes SecureOne powerful.',
            position: 'bottom',
            action: 'next'
          },
          {
            element: '[href="features.html"]',
            title: 'Explore Core Features',
            description: 'Check out our key capabilities: SAST, SCA, Secrets detection, and more.',
            position: 'bottom',
            action: 'navigate',
            target: 'features.html'
          }
        ]
      },

      // Flow 2: Visitor ready to try the platform
      getStarted: {
        id: 'getStarted',
        name: 'Get Started with SecureOne',
        description: 'Quick path to try the platform',
        targetPage: null, // Can trigger from any page
        condition: () => this.state.pagesVisited >= 3 && !this.isGuideCompleted('getStarted'),
        steps: [
          {
            title: 'Ready to Get Started?',
            description: 'You can try SecureOne in two ways:',
            position: 'center',
            action: 'choice'
          },
          {
            element: '[href*="login"]',
            title: 'Option 1: Try SaaS (Cloud)',
            description: 'Instant access to the fully managed platform. No installation needed.',
            position: 'bottom',
            action: 'navigate',
            target: 'https://secureone.bountybreach.com/auth/login'
          },
          {
            element: '[href="docs.html"]',
            title: 'Option 2: Self-Host',
            description: 'Download and run SecureOne on your own infrastructure for complete control.',
            position: 'bottom',
            action: 'navigate',
            target: 'docs.html'
          }
        ]
      },

      // Flow 3: Learning about deployment
      deploymentGuide: {
        id: 'deploymentGuide',
        name: 'Understand Deployment Options',
        description: 'Learn about SaaS, Self-Hosted, and Distributed deployment models',
        targetPage: 'deployment.html',
        condition: () => !this.isGuideCompleted('deploymentGuide') && this.getCurrentPage() === 'deployment.html',
        steps: [
          {
            element: '.hero h1',
            title: 'Deployment Models',
            description: 'SecureOne offers three deployment models to fit your infrastructure needs.',
            position: 'bottom',
            action: 'next'
          },
          {
            element: '.deployment-image, .deployment-diagram',
            title: 'Architecture Overview',
            description: 'This diagram shows how SecureOne components communicate. Click through to see each model.',
            position: 'bottom',
            action: 'next'
          },
          {
            element: '.deployment-grid, .featured-model',
            title: 'Compare Your Options',
            description: 'Review each deployment model to find the best fit for your organization.',
            position: 'bottom',
            action: 'next'
          },
          {
            title: 'Next Step',
            description: 'Ready to deploy? Visit our Docs or contact Sales to discuss your setup.',
            position: 'center',
            action: 'choice'
          }
        ]
      },

      // Flow 4: Pricing and plan selection
      pricingGuide: {
        id: 'pricingGuide',
        name: 'Choose Your Plan',
        description: 'Find the pricing and plan that works for you',
        targetPage: 'pricing.html',
        condition: () => !this.isGuideCompleted('pricingGuide') && this.getCurrentPage() === 'pricing.html',
        steps: [
          {
            element: '.page-hero h1',
            title: 'Choose How You Run SecureOne',
            description: 'We support SaaS (cloud), Self-Hosted (on-premise), and Managed Services deployments.',
            position: 'bottom',
            action: 'next'
          },
          {
            element: '.plan-card, [class*="plan"]',
            title: 'Compare Plans',
            description: 'Each plan includes full access to SAST, SCA, Secrets, DAST, and Pen Testing capabilities.',
            position: 'bottom',
            action: 'next'
          },
          {
            title: 'Next Steps',
            description: 'Click on your chosen plan\'s button to get started or contact Sales for custom arrangements.',
            position: 'center',
            action: 'complete'
          }
        ]
      },

      // Flow 5: Demo and video learning
      demoGuide: {
        id: 'demoGuide',
        name: 'Watch Demo Videos',
        description: 'Learn through guided video walkthroughs',
        targetPage: 'demo.html',
        condition: () => !this.isGuideCompleted('demoGuide') && this.getCurrentPage() === 'demo.html',
        steps: [
          {
            title: 'Demo Library',
            description: 'Browse organized video walkthroughs for Self-Managed, Agent Scan, and CI/CD Scan modes.',
            position: 'center',
            action: 'next'
          },
          {
            element: '.scan-mode-tab',
            title: 'Choose a Scan Mode',
            description: 'Select a tab to see how SecureOne works in your use case.',
            position: 'bottom',
            action: 'next'
          },
          {
            element: '.demo-card',
            title: 'Watch the Videos',
            description: 'Each video walks through specific steps. Click play to get started.',
            position: 'bottom',
            action: 'complete'
          }
        ]
      },

      // Flow 6: Integration setup
      integrationsGuide: {
        id: 'integrationsGuide',
        name: 'Connect Your Tools',
        description: 'Integrate SecureOne with GitHub, Jenkins, and more',
        targetPage: 'integrations.html',
        condition: () => !this.isGuideCompleted('integrationsGuide') && this.getCurrentPage() === 'integrations.html',
        steps: [
          {
            element: '.hero h1',
            title: 'Integration Ecosystem',
            description: 'SecureOne integrates with your existing tools and workflows.',
            position: 'bottom',
            action: 'next'
          },
          {
            element: '[class*="integration"], .grid',
            title: 'Supported Platforms',
            description: 'We support GitHub, GitLab, Jenkins, CI/CD pipelines, and more.',
            position: 'bottom',
            action: 'next'
          },
          {
            title: 'Get Integration Docs',
            description: 'Visit our Docs for detailed integration setup guides.',
            position: 'center',
            action: 'navigate',
            target: 'docs.html'
          }
        ]
      },

      // Flow 7: Documentation and guides
      docsGuide: {
        id: 'docsGuide',
        name: 'Explore Documentation',
        description: 'Find guides, setup instructions, and API references',
        targetPage: 'docs.html',
        condition: () => !this.isGuideCompleted('docsGuide') && this.getCurrentPage() === 'docs.html',
        steps: [
          {
            title: 'Documentation Hub',
            description: 'Find everything you need: setup guides, user guides, API docs, and FAQs.',
            position: 'center',
            action: 'next'
          },
          {
            element: '[href*="guide"], .guide-nav',
            title: 'Step-by-Step Guides',
            description: 'Our user guides walk you through first scan, integrations, and troubleshooting.',
            position: 'bottom',
            action: 'next'
          },
          {
            title: 'Ready to Set Up?',
            description: 'Visit the User Guides section or contact Support for personalized help.',
            position: 'center',
            action: 'complete'
          }
        ]
      }
    };
  }

  determineFlow() {
    const currentPage = this.getCurrentPage();
    
    // Track page visits
    this.state.pagesVisited++;
    this.state.lastPage = currentPage;
    this.saveState();

    // Check for active guide on current page
    for (const [guideId, guide] of Object.entries(this.guidesConfig)) {
      if (guide.condition && guide.condition()) {
        this.startGuide(guideId);
        return;
      }
    }

    // Check if user dismissed all guides
    if (this.state.dismissedGuides.length >= Object.keys(this.guidesConfig).length) {
      this.showReactivationOption();
    }
  }

  startGuide(guideId) {
    const guide = this.guidesConfig[guideId];
    if (!guide || this.isGuideStarted(guideId)) {
      return;
    }

    this.currentGuide = guide;
    this.currentStep = 0;
    this.state.guidesStarted.push(guideId);
    this.saveState();

    this.showStep();
  }

  showStep() {
    if (!this.currentGuide) return;

    const step = this.currentGuide.steps[this.currentStep];
    if (!step) {
      this.completeGuide();
      return;
    }

    // Remove previous overlay
    this.removeOverlay();

    // Create new overlay
    const overlay = this.createOverlay(step);
    document.body.appendChild(overlay);

    // Handle step actions
    this.handleStepAction(step);
  }

  createOverlay(step) {
    const overlay = document.createElement('div');
    overlay.className = 'cta-guide-overlay';
    overlay.id = 'cta-guide-overlay';

    const tooltip = document.createElement('div');
    tooltip.className = `cta-guide-tooltip cta-position-${step.position || 'bottom'}`;

    let content = `
      <div class="cta-guide-header">
        <h3>${step.title}</h3>
        <button class="cta-guide-close" aria-label="Close guide">&times;</button>
      </div>
      <div class="cta-guide-body">
        <p>${step.description}</p>
      </div>
      <div class="cta-guide-footer">
        <div class="cta-guide-progress">
          Step ${this.currentStep + 1} of ${this.currentGuide.steps.length}
        </div>
        <div class="cta-guide-actions">
    `;

    if (step.action === 'next') {
      content += `
        <button class="cta-btn cta-btn-secondary" id="cta-prev">← Previous</button>
        <button class="cta-btn cta-btn-primary" id="cta-next">Next →</button>
      `;
    } else if (step.action === 'navigate') {
      content += `
        <button class="cta-btn cta-btn-secondary" id="cta-skip">Skip</button>
        <a href="${step.target}" class="cta-btn cta-btn-primary" id="cta-navigate">Continue →</a>
      `;
    } else if (step.action === 'choice') {
      content += `
        <button class="cta-btn cta-btn-secondary" id="cta-dismiss">Not Now</button>
      `;
    } else if (step.action === 'complete') {
      content += `
        <button class="cta-btn cta-btn-secondary" id="cta-dismiss">Dismiss</button>
        <button class="cta-btn cta-btn-primary" id="cta-complete">Got It!</button>
      `;
    }

    content += `
        </div>
      </div>
    `;

    tooltip.innerHTML = content;

    // Position tooltip near element if specified
    if (step.element) {
      const element = document.querySelector(step.element);
      if (element) {
        this.positionTooltip(tooltip, element, step.position);
        element.classList.add('cta-guide-highlight');
      }
    }

    overlay.appendChild(tooltip);

    // Event listeners
    overlay.querySelector('.cta-guide-close').addEventListener('click', () => this.dismissGuide());
    const nextBtn = overlay.querySelector('#cta-next');
    const prevBtn = overlay.querySelector('#cta-prev');
    const skipBtn = overlay.querySelector('#cta-skip');
    const dismissBtn = overlay.querySelector('#cta-dismiss');
    const completeBtn = overlay.querySelector('#cta-complete');

    if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
    if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
    if (skipBtn) skipBtn.addEventListener('click', () => this.dismissGuide());
    if (dismissBtn) dismissBtn.addEventListener('click', () => this.dismissGuide());
    if (completeBtn) completeBtn.addEventListener('click', () => this.completeGuide());

    return overlay;
  }

  positionTooltip(tooltip, element, position = 'bottom') {
    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const gap = 16;

      let top = rect.bottom + gap;
      let left = rect.left + (rect.width - tooltipRect.width) / 2;

      if (position === 'top') {
        top = rect.top - gap - tooltipRect.height;
      } else if (position === 'left') {
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.left - gap - tooltipRect.width;
      } else if (position === 'right') {
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.right + gap;
      }

      // Clamp to viewport
      left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
      top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));

      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    }, 0);
  }

  handleStepAction(step) {
    // Action-specific handling
  }

  nextStep() {
    this.currentStep++;
    this.showStep();
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showStep();
    }
  }

  completeGuide() {
    if (this.currentGuide) {
      const guideId = this.currentGuide.id;
      if (!this.isGuideCompleted(guideId)) {
        this.state.guidesCompleted.push(guideId);
      }
      this.state.guidesStarted = this.state.guidesStarted.filter(g => g !== guideId);
    }
    this.saveState();
    this.removeOverlay();
    this.currentGuide = null;
    this.showCompletionMessage();
  }

  dismissGuide() {
    if (this.currentGuide) {
      const guideId = this.currentGuide.id;
      if (!this.state.dismissedGuides.includes(guideId)) {
        this.state.dismissedGuides.push(guideId);
      }
      this.state.guidesStarted = this.state.guidesStarted.filter(g => g !== guideId);
    }
    this.saveState();
    this.removeOverlay();
    this.currentGuide = null;
  }

  showCompletionMessage() {
    const message = document.createElement('div');
    message.className = 'cta-guide-message cta-guide-success';
    message.innerHTML = `
      <span>✓ Guide complete! Great job exploring SecureOne.</span>
      <button class="cta-btn cta-btn-small">Dismiss</button>
    `;
    document.body.appendChild(message);

    message.querySelector('button').addEventListener('click', () => message.remove());
    setTimeout(() => message.remove(), 4000);
  }

  showReactivationOption() {
    // Optional: Show button to restart guides
    if (!document.getElementById('cta-restart-guides')) {
      const btn = document.createElement('button');
      btn.id = 'cta-restart-guides';
      btn.className = 'cta-guide-restart-btn';
      btn.textContent = '? Guide Me';
      btn.title = 'Restart guides';
      btn.addEventListener('click', () => {
        this.state.dismissedGuides = [];
        this.saveState();
        location.reload();
      });
      document.body.appendChild(btn);
    }
  }

  removeOverlay() {
    const overlay = document.getElementById('cta-guide-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), this.config.animationDuration);
    }
    document.querySelectorAll('.cta-guide-highlight').forEach(el => {
      el.classList.remove('cta-guide-highlight');
    });
  }

  isGuideStarted(guideId) {
    return this.state.guidesStarted.includes(guideId);
  }

  isGuideCompleted(guideId) {
    return this.state.guidesCompleted.includes(guideId);
  }

  isPageInHistory(pageName) {
    // Simplified check - in real app, track full page history
    return false;
  }

  getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop() || 'index.html';
  }

  // Public API methods
  restart() {
    this.state = {
      guidesStarted: [],
      guidesCompleted: [],
      lastPage: null,
      pagesVisited: 0,
      dismissedGuides: []
    };
    this.saveState();
    location.reload();
  }

  disable() {
    localStorage.setItem(this.config.storageKey + '_disabled', 'true');
    this.removeOverlay();
  }

  enable() {
    localStorage.removeItem(this.config.storageKey + '_disabled');
    location.reload();
  }
}

// Auto-initialize on page load if not disabled
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('secureone_cta_guide_state_disabled')) {
      window.ctaGuide = new CTAGuide();
    }
  });
} else {
  if (!localStorage.getItem('secureone_cta_guide_state_disabled')) {
    window.ctaGuide = new CTAGuide();
  }
}
