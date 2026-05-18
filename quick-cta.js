(function () {
  var quickSteps = [
    {
      title: 'SAST: static code vulnerability checks.',
      description: 'Analyze source code patterns before merge to catch unsafe logic and insecure coding patterns early.',
      video: 'secureone/demo/executions_scan_mode/self_managed/Self_manage_Semgrep_SAST_Semgrep_WebGoat.mov'
    },
    {
      title: 'SCA: dependency and package risk.',
      description: 'Detect known CVEs and licensing issues in third-party libraries used by your application.',
      video: 'secureone/demo/executions_scan_mode/self_managed/Self_manage_Snyk_SCA_WebGoat.mov'
    },
    {
      title: 'Secrets: keys and credentials exposure.',
      description: 'Find leaked API tokens, passwords, and sensitive keys before code reaches production.',
      video: 'secureone/demo/executions_scan_mode/self_managed/Self_manage_scan_GitLeaks_Secret_WebGoat.mov'
    },
    {
      title: 'DAST: runtime attack-surface validation.',
      description: 'Assess running application behavior and endpoint risks to expose exploitable runtime weaknesses.',
      video: 'secureone/demo/executions_scan_mode/self_managed/Self_Managed_ALL_Scan_OverView.mov'
    },
    {
      title: 'Scan Agent setup with tokens.',
      description: 'Configure agent registration, tool images, and licensing to prepare automated scan execution.',
      video: 'secureone/demo/executions_scan_mode/ci_cd_scan/SecureOne_Jenkins_Scan_Agent_SetUp.mov'
    },
    {
      title: 'CI/CD setup in Jenkins.',
      description: 'Wire SecureOne into Jenkins jobs so every pipeline run triggers policy-driven security checks.',
      video: 'secureone/demo/executions_scan_mode/ci_cd_scan/SecureOne_Scan_Agent_Jenkins_Job_SetUp_Part_One.mov'
    },
    {
      title: 'Scan results and pipeline status.',
      description: 'View execution outcomes, policy impact, and final scan status to decide release confidence.',
      video: 'secureone/demo/executions_scan_mode/ci_cd_scan/SecureOne_Scan_Agent_Jenkins_Scan_Status.mov'
    }
  ];

  var rotateMs = 4500;
  var currentIndex = 0;
  var intervalId = null;

  function setStep(index) {
    var titleNode = document.getElementById('quickCtaTitle');
    var descNode = document.getElementById('quickCtaDesc');
    var pillNodes = document.querySelectorAll('#quickCtaPills .quick-pill');
    var video = document.getElementById('quickCtaVideo');

    if (!titleNode || !descNode || pillNodes.length === 0 || !(video instanceof HTMLVideoElement)) {
      return;
    }

    currentIndex = ((index % quickSteps.length) + quickSteps.length) % quickSteps.length;
    var step = quickSteps[currentIndex];
    titleNode.textContent = step.title;
    descNode.textContent = step.description;

    if (video.getAttribute('src') !== step.video) {
      video.setAttribute('src', step.video);
      video.load();
    }
    tryAutoplayVideo();

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
    var cta = document.getElementById('quick-cta');
    if (!cta) {
      return;
    }

    document.body.classList.add('has-quick-cta');

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
