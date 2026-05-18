# CTA Guide System for SecureOne Website

## Overview

The **CTA Guide System** provides interactive, non-intrusive guides that walk visitors through recommended website flows. It helps customers understand what SecureOne offers and guides them through key decision points without modifying any existing HTML.

## Features

✅ **Non-intrusive** — No changes to existing HTML or CSS  
✅ **Smart Detection** — Automatically shows relevant guides based on visitor behavior  
✅ **Multi-step Flows** — Sequential tooltips guide users through complete journeys  
✅ **State Management** — Tracks guide progress in localStorage  
✅ **Responsive Design** — Works seamlessly on desktop and mobile  
✅ **Customizable** — Easy to add new guides and flows  
✅ **User Control** — Visitors can dismiss, skip, or restart guides anytime  

## Installation

### 1. Add Scripts to Your HTML Header (Optional)

To enable the guide system on all pages, add these lines to `<head>` before `</head>`:

```html
<!-- CTA Guide System -->
<link rel="stylesheet" href="cta-guide.css">
<script defer src="cta-guide.js"></script>
```

Or, add to specific pages where you want guides:

```html
<head>
  <!-- Other head content -->
  <link rel="stylesheet" href="cta-guide.css">
</head>
<body>
  <!-- Page content -->
  
  <!-- At end of body, before </body> -->
  <script src="cta-guide.js" defer></script>
</body>
```

### 2. No Additional Configuration Needed

The system auto-initializes on page load and automatically detects which guide is appropriate for the visitor.

## Included Guides

### 1. **Home Exploration Guide**
- **Target:** First-time visitors on homepage
- **Trigger:** After viewing homepage
- **Steps:** Introduce SecureOne → Navigate to Features
- **Goal:** Get visitors interested in core capabilities

### 2. **Get Started Guide**
- **Target:** Visitors ready to try the platform
- **Trigger:** After 3+ pages visited
- **Steps:** Choose between SaaS → Cloud trial OR Self-Host → Docs
- **Goal:** Convert interest into action

### 3. **Deployment Guide**
- **Target:** Visitors on Deployment page
- **Trigger:** Auto-trigger on `deployment.html`
- **Steps:** Explain deployment models → Show architecture → Compare options
- **Goal:** Educate on deployment choices

### 4. **Pricing Guide**
- **Target:** Visitors on Pricing page
- **Trigger:** Auto-trigger on `pricing.html`
- **Steps:** Introduce pricing models → Review plans → CTA
- **Goal:** Clarify pricing and help choose a plan

### 5. **Demo Guide**
- **Target:** Visitors on Demo page
- **Trigger:** Auto-trigger on `demo.html`
- **Steps:** Introduce demo library → Show scan modes → Watch videos
- **Goal:** Guide video exploration

### 6. **Integrations Guide**
- **Target:** Visitors on Integrations page
- **Trigger:** Auto-trigger on `integrations.html`
- **Steps:** Introduce ecosystems → Show platforms → Link to docs
- **Goal:** Show integration breadth and next steps

### 7. **Documentation Guide**
- **Target:** Visitors on Docs/Guides page
- **Trigger:** Auto-trigger on `docs.html`
- **Steps:** Welcome to docs → Highlight user guides → CTA
- **Goal:** Help find the right documentation

## Recommended Customer Flows

```
┌─ Homepage ─┐
│  (Hero)    │
└─────┬──────┘
      ▼
  [Explore Features?]
      ▼
  Features Page (learns about SAST, SCA, etc.)
      ▼
  Compare / Integrations / Deployment (educational)
      ▼
  Ready to Get Started Guide Triggers
      ▼
  ┌─────────────────────┐
  │ Choose Path:        │
  │ • Try SaaS (Cloud)  │
  │ • Self-Host (Docs)  │
  └─────────────────────┘
      ▼
  [Login / Setup]
```

## JavaScript API

If you want to control guides programmatically, use these methods:

### Methods

```javascript
// Access the guide instance
window.ctaGuide

// Start a specific guide
window.ctaGuide.startGuide('homeExploration');

// Restart all guides (clear state)
window.ctaGuide.restart();

// Disable guides
window.ctaGuide.disable();

// Enable guides
window.ctaGuide.enable();

// Check if guide is completed
const isComplete = window.ctaGuide.isGuideCompleted('pricingGuide');

// Get current page
const page = window.ctaGuide.getCurrentPage();
```

### Examples

```javascript
// Manually start the pricing guide
document.getElementById('pricing-btn').addEventListener('click', () => {
  window.ctaGuide.startGuide('pricingGuide');
});

// Check if visitor completed deployment guide
if (window.ctaGuide.isGuideCompleted('deploymentGuide')) {
  console.log('Visitor completed deployment guide!');
}

// Reset all guide state
document.getElementById('reset-btn').addEventListener('click', () => {
  if (confirm('Reset all guides?')) {
    window.ctaGuide.restart();
  }
});
```

## Customization

### Adding New Guides

Edit `cta-guide.js`, find the `loadGuidesConfig()` method, and add a new guide object:

```javascript
myCustomGuide: {
  id: 'myCustomGuide',
  name: 'My Custom Guide',
  description: 'Guide description',
  targetPage: 'my-page.html', // or null for any page
  condition: () => {
    // Return true if this guide should show
    return this.state.pagesVisited >= 2;
  },
  steps: [
    {
      element: '.my-element', // CSS selector (optional)
      title: 'Step Title',
      description: 'Step description text',
      position: 'bottom', // top, bottom, left, right, center
      action: 'next' // next, navigate, choice, complete
      // target: 'url' // Required if action is 'navigate'
    },
    // More steps...
  ]
}
```

### Styling

Edit `cta-guide.css` to customize:
- Colors, fonts, spacing
- Animation timing
- Responsive breakpoints
- Dark mode colors

## Files Included

- **cta-guide.js** — Main guide engine (auto-initializes)
- **cta-guide.css** — Guide styles (responsive, dark mode support)
- **CTA-GUIDE-README.md** — This documentation (optional)

## Storage

Guides use browser localStorage to track:
- Pages visited
- Guides completed
- Guides dismissed
- Last page visited

**Storage Key:** `secureone_cta_guide_state`

Clear localStorage to reset guide state:
```javascript
localStorage.removeItem('secureone_cta_guide_state');
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

The guide system includes:
- Keyboard navigation (Tab, Enter, Esc)
- ARIA labels on interactive elements
- Focus management
- High contrast support
- Screen reader friendly

## Performance

- **Lazy Initialization** — Guides load on demand
- **Minimal Overhead** — ~8KB (JS + CSS combined)
- **No Dependencies** — Pure vanilla JavaScript
- **localStorage Only** — No external API calls

## Troubleshooting

### Guides Not Showing
1. Check browser console for errors
2. Verify `cta-guide.js` and `cta-guide.css` are loaded
3. Check localStorage is enabled
4. Verify condition logic in guide config

### Guides Keep Reappearing
1. Guides reset if localStorage is cleared
2. Check browser privacy settings
3. Try disabling and re-enabling: `window.ctaGuide.disable(); window.ctaGuide.enable();`

### Tooltip Positioning Issues
1. Verify target element exists and is visible
2. Check z-index conflicts with other elements
3. Element should not have `position: relative` with low z-index

## Future Enhancements

Potential features:
- Analytics/tracking of guide completions
- A/B testing different guide flows
- Guided tours for specific features
- Integration with CRM/analytics tools
- Multi-language support
- Video embeds in guide steps

## Support

For issues or feature requests, check the guide JavaScript implementation or contact the development team.

---

**Version:** 1.0  
**Last Updated:** May 2026  
**License:** Proprietary (SecureOne / BountyBreach)
