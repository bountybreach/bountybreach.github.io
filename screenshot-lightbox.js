(function () {
  var overlay = null;
  var overlayImage = null;
  var overlayCaption = null;
  var lastActiveElement = null;

  function buildOverlay() {
    if (overlay) {
      return overlay;
    }

    overlay = document.createElement('div');
    overlay.className = 'screenshot-lightbox';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div class="screenshot-lightbox-panel" role="dialog" aria-modal="true" aria-label="Expanded screenshot viewer">' +
        '<button type="button" class="screenshot-lightbox-close" aria-label="Minimize screenshot">Minimize</button>' +
        '<button type="button" class="screenshot-lightbox-x" aria-label="Close screenshot">×</button>' +
        '<img class="screenshot-lightbox-image" alt="Expanded screenshot">' +
        '<div class="screenshot-lightbox-caption"></div>' +
      '</div>';

    overlayImage = overlay.querySelector('.screenshot-lightbox-image');
    overlayCaption = overlay.querySelector('.screenshot-lightbox-caption');

    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) {
        closeOverlay();
      }
    });

    overlay.querySelector('.screenshot-lightbox-close').addEventListener('click', closeOverlay);
    overlay.querySelector('.screenshot-lightbox-x').addEventListener('click', closeOverlay);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && overlay && overlay.classList.contains('is-open')) {
        closeOverlay();
      }
    });

    document.body.appendChild(overlay);
    return overlay;
  }

  function openOverlay(image) {
    if (!image || !image.getAttribute('src')) {
      return;
    }

    lastActiveElement = document.activeElement;
    buildOverlay();
    overlayImage.src = image.getAttribute('src');
    overlayImage.alt = image.getAttribute('alt') || 'Expanded screenshot';
    overlayCaption.textContent = image.getAttribute('alt') || 'Screenshot';
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('screenshot-lightbox-open');
    overlay.querySelector('.screenshot-lightbox-close').focus();
  }

  function closeOverlay() {
    if (!overlay) {
      return;
    }

    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('screenshot-lightbox-open');
    overlayImage.removeAttribute('src');
    overlayImage.alt = 'Expanded screenshot';
    overlayCaption.textContent = '';

    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  }

  function enhanceImage(image) {
    if (!image || image.dataset.lightboxReady === '1') {
      return;
    }

    image.dataset.lightboxReady = '1';
    image.setAttribute('role', 'button');
    image.setAttribute('tabindex', '0');
    image.setAttribute('aria-label', 'Expand screenshot');

    image.addEventListener('click', function () {
      openOverlay(image);
    });

    image.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openOverlay(image);
      }
    });
  }

  function initLightbox() {
    var images = document.querySelectorAll(
      '.guide-shot-card img, .autoplay-cta-viewer img, img[data-lightbox="screenshot"]'
    );

    images.forEach(enhanceImage);

    document.addEventListener('click', function (event) {
      var image = event.target.closest('.guide-shot-card img, .autoplay-cta-viewer img, img[data-lightbox="screenshot"]');
      if (image) {
        enhanceImage(image);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLightbox);
  } else {
    initLightbox();
  }
})();