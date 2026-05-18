(function () {
  var quickSteps = [
    {
      title: 'Connect GitHub in minutes.',
      description: 'Link repositories, branches, and pull requests so every change is ready for security scanning.'
    },
    {
      title: 'Run SAST, SCA, Secrets, and DAST.',
      description: 'SecureOne executes core AppSec checks from a single control plane and unifies findings instantly.'
    },
    {
      title: 'Gate Jenkins builds with policy.',
      description: 'Use CI/CD thresholds to fail high-risk builds and ship with clear, actionable risk visibility.'
    }
  ];

  var rotateMs = 2500;
  var currentIndex = 0;
  var intervalId = null;

  function setStep(index) {
    var titleNode = document.getElementById('quickCtaTitle');
    var descNode = document.getElementById('quickCtaDesc');
    var pillNodes = document.querySelectorAll('#quickCtaPills .quick-pill');

    if (!titleNode || !descNode || pillNodes.length === 0) {
      return;
    }

    currentIndex = index % quickSteps.length;
    var step = quickSteps[currentIndex];
    titleNode.textContent = step.title;
    descNode.textContent = step.description;

    pillNodes.forEach(function (pill, pillIndex) {
      pill.classList.toggle('active', pillIndex === currentIndex);
    });
  }

  function startRotation() {
    stopRotation();
    intervalId = window.setInterval(function () {
      setStep((currentIndex + 1) % quickSteps.length);
    }, rotateMs);
  }

  function stopRotation() {
    if (intervalId) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  function setupPills() {
    var pillsWrap = document.getElementById('quickCtaPills');
    if (!pillsWrap) {
      return;
    }

    pillsWrap.addEventListener('click', function (event) {
      var target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (!target.classList.contains('quick-pill')) {
        return;
      }

      var stepIndex = Number(target.getAttribute('data-step'));
      if (Number.isNaN(stepIndex)) {
        return;
      }

      setStep(stepIndex);
      startRotation();
    });
  }

  function tryAutoplayVideo() {
    var video = document.getElementById('quickCtaVideo');
    if (!(video instanceof HTMLVideoElement)) {
      return;
    }

    video.muted = true;
    video.playsInline = true;

    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        video.controls = true;
      });
    }
  }

  function init() {
    if (!document.getElementById('quick-cta')) {
      return;
    }

    setStep(0);
    setupPills();
    startRotation();
    tryAutoplayVideo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
