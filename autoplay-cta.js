(function () {
  var orderedGuideScreenshots = [
    'screenshots/Screenshot%202026-05-08%20at%2011.08.38%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.09.08%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.09.53%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.10.01%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.10.10%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.10.19%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.10.26%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.10.38%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.10.46%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.10.59%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.11.18%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.11.27%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.11.35%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.11.44%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.11.59%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.12.09%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.12.17%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.12.28%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.12.40%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.12.59%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.13.11%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.13.25%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.13.45%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.13.53%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.14.06%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.14.19%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.14.33%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.14.43%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.14.54%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.15.11%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.15.21%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.15.41%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.16.12%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.16.31%E2%80%AFPM.png',
    'screenshots/Screenshot%202026-05-08%20at%2011.16.56%E2%80%AFPM.png'
  ];

  function stepLabel(index) {
    return 'Step ' + String(index + 1).padStart(2, '0') + ' of ' + String(orderedGuideScreenshots.length).padStart(2, '0');
  }

  function updateSlide(container, images, index) {
    var image = container.querySelector('[data-autoplay-cta-image]');
    var caption = container.querySelector('[data-autoplay-cta-caption]');
    var counter = container.querySelector('[data-autoplay-cta-counter]');
    if (!image || !caption || !counter) {
      return;
    }

    image.src = images[index];
    image.alt = 'SecureOne guide screenshot ' + (index + 1);
    caption.textContent = stepLabel(index);
    counter.textContent = stepLabel(index);
  }

  function initSlider(container) {
    if (!container || container.dataset.autoplayCtaReady === '1') {
      return;
    }

    var images = orderedGuideScreenshots.slice();
    if (!images.length) {
      return;
    }

    var intervalValue = Number(container.getAttribute('data-autoplay-interval') || '2800');
    var autoplayInterval = Number.isFinite(intervalValue) && intervalValue > 500 ? intervalValue : 2800;
    var currentIndex = 0;
    var timerId = null;

    container.innerHTML =
      '<figure class="autoplay-cta-slide">' +
        '<img data-autoplay-cta-image loading="lazy" alt="SecureOne guide screenshot 1">' +
        '<figcaption data-autoplay-cta-caption></figcaption>' +
      '</figure>' +
      '<div class="autoplay-cta-controls">' +
        '<button type="button" class="autoplay-cta-btn" data-autoplay-cta-prev aria-label="Previous screenshot">←</button>' +
        '<span class="autoplay-cta-counter" data-autoplay-cta-counter></span>' +
        '<button type="button" class="autoplay-cta-btn" data-autoplay-cta-next aria-label="Next screenshot">→</button>' +
      '</div>';

    function move(delta) {
      currentIndex = (currentIndex + delta + images.length) % images.length;
      updateSlide(container, images, currentIndex);
    }

    function startAuto() {
      stopAuto();
      timerId = window.setInterval(function () {
        move(1);
      }, autoplayInterval);
    }

    function stopAuto() {
      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    }

    var prevButton = container.querySelector('[data-autoplay-cta-prev]');
    var nextButton = container.querySelector('[data-autoplay-cta-next]');

    if (prevButton) {
      prevButton.addEventListener('click', function () {
        move(-1);
        startAuto();
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', function () {
        move(1);
        startAuto();
      });
    }

    container.addEventListener('mouseenter', stopAuto);
    container.addEventListener('mouseleave', startAuto);
    container.addEventListener('focusin', stopAuto);
    container.addEventListener('focusout', startAuto);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopAuto();
      } else {
        startAuto();
      }
    });

    updateSlide(container, images, currentIndex);
    startAuto();
    container.dataset.autoplayCtaReady = '1';
  }

  function initAutoplayCtas() {
    var nodes = document.querySelectorAll('[data-autoplay-cta]');
    if (!nodes.length) {
      return;
    }
    nodes.forEach(initSlider);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoplayCtas);
  } else {
    initAutoplayCtas();
  }
})();