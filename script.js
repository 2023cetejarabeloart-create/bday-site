/* ------------------------------------------------------------
   Happy Birthday, Love
   Act I → Act II → Act III
   ------------------------------------------------------------ */
(function () {
  'use strict';

  var landing   = document.getElementById('landing');
  var stage     = document.getElementById('stage');
  var after     = document.getElementById('after');
  var film      = document.getElementById('film');
  var playBtn   = document.getElementById('playBtn');
  var closeBtn  = document.getElementById('closeBtn');
  var replayBtn = document.getElementById('replayBtn');
  var frame     = document.getElementById('frame');
  var veil      = document.getElementById('veil');
  var bar       = document.getElementById('bar');
  var pauseHint = document.getElementById('pauseHint');
  var petals    = document.getElementById('petals');
  var strip     = document.getElementById('strip');
  var swipe     = document.getElementById('swipe');
  var lightbox  = document.getElementById('lightbox');
  var lightImg  = document.getElementById('lightboxImg');

  var reduce   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hintUsed = false;
  var warmed   = false;
  var started  = false;

  var scenes = { landing: landing, stage: stage, after: after };

  function show(name) {
    Object.keys(scenes).forEach(function (key) {
      var el = scenes[key];
      var on = key === name;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-hidden', on ? 'false' : 'true');
      if (!on) el.classList.remove('is-revealed');
    });

    petals.classList.toggle('is-hidden', name === 'stage');

    var target = scenes[name];
    var revealed = false;

    function doReveal() {
      if (revealed) return;
      revealed = true;
      target.classList.add('is-revealed');
    }

    /* two frames: let the hidden state render before transitioning in,
       plus a timer fallback in case rAF is throttled */
    requestAnimationFrame(function () {
      requestAnimationFrame(doReveal);
    });
    window.setTimeout(doReveal, 350);
  }

  /* ── preload: start pulling the film once she's had a moment ── */
  function warm() {
    if (warmed || started) return;
    warmed = true;
    try {
      film.preload = 'auto';
      film.load();
    } catch (e) { /* nothing we can do */ }
  }
  window.setTimeout(warm, 1500);

  /* ── the play action (must stay synchronous for iOS audio) ──── */
  function startFilm() {
    started = true;
    if (!warmed) { warmed = true; try { film.preload = 'auto'; } catch (e) {} }

    try { film.currentTime = 0; } catch (e) {}

    var promise = null;
    try { promise = film.play(); } catch (e) {}

    show('stage');
    veil.classList.add('is-on');
    pauseHint.classList.remove('is-on');

    if (promise && typeof promise.catch === 'function') {
      promise.catch(function () {
        /* Autoplay blocked — drop the veil so the frame is tappable */
        veil.classList.remove('is-on');
      });
    }
  }

  playBtn.addEventListener('click', startFilm);
  replayBtn.addEventListener('click', startFilm);

  /* ── video state ───────────────────────────────────────────── */
  film.addEventListener('playing', function () {
    veil.classList.remove('is-on');
    if (hintUsed) return;
    hintUsed = true;
    window.setTimeout(function () { pauseHint.classList.add('is-on'); }, 450);
    window.setTimeout(function () { pauseHint.classList.remove('is-on'); }, 4000);
  });

  film.addEventListener('waiting', function () { veil.classList.add('is-on'); });
  film.addEventListener('canplay', function () {
    if (!film.paused) veil.classList.remove('is-on');
  });
  film.addEventListener('loadeddata', function () { veil.classList.remove('is-on'); });

  film.addEventListener('timeupdate', function () {
    if (!film.duration) return;
    var pct = (film.currentTime / film.duration) * 100;
    bar.style.width = pct.toFixed(2) + '%';
  });

  film.addEventListener('ended', function () {
    bar.style.width = '100%';
    pauseHint.classList.remove('is-on');
    window.setTimeout(function () { show('after'); }, 420);
    window.setTimeout(function () {
      try { film.pause(); film.currentTime = 0; } catch (e) {}
      bar.style.width = '0%';
    }, 1600);
  });

  film.addEventListener('error', function () {
    veil.classList.remove('is-on');
  });

  /* ── tap the frame to pause / resume ───────────────────────── */
  frame.addEventListener('click', function () {
    if (film.paused) {
      var p = film.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    } else {
      film.pause();
      pauseHint.classList.remove('is-on');
    }
  });

  /* ── close ─────────────────────────────────────────────────── */
  closeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    try { film.pause(); } catch (err) {}
    pauseHint.classList.remove('is-on');
    veil.classList.remove('is-on');
    show('landing');
  });

  /* ── gallery ───────────────────────────────────────────────── */
  if (strip) {
    strip.addEventListener('scroll', function () {
      if (strip.scrollLeft > 10) swipe.style.opacity = '0';
    }, { passive: true });

    strip.addEventListener('click', function (e) {
      var card = e.target.closest('.polaroid');
      if (!card) return;
      var img = card.querySelector('img');
      if (!img) return;
      lightImg.src = img.currentSrc || img.src;
      lightbox.classList.add('is-on');
      lightbox.setAttribute('aria-hidden', 'false');
    });
  }

  lightbox.addEventListener('click', function () {
    lightbox.classList.remove('is-on');
    lightbox.setAttribute('aria-hidden', 'true');
    window.setTimeout(function () { lightImg.src = ''; }, 400);
  });

  /* ── petals ────────────────────────────────────────────────── */
  (function makePetals() {
    if (reduce || !petals) return;
    var count = window.innerWidth < 430 ? 9 : 13;
    for (var i = 0; i < count; i++) {
      var p = document.createElement('i');
      var size = 7 + Math.random() * 11;
      p.className = 'petal';
      p.style.left = (Math.random() * 100).toFixed(2) + '%';
      p.style.width = size.toFixed(1) + 'px';
      p.style.height = (size * 1.15).toFixed(1) + 'px';
      p.style.setProperty('--dx', (Math.random() * 90 - 45).toFixed(0) + 'px');
      p.style.setProperty('--o', (0.16 + Math.random() * 0.3).toFixed(2));
      p.style.animationDuration = (17 + Math.random() * 15).toFixed(1) + 's';
      p.style.animationDelay = (-Math.random() * 26).toFixed(1) + 's';
      petals.appendChild(p);
    }
  })();

  /* ── quiet deep links, handy for testing ───────────────────── */
  if (location.hash === '#after') show('after');
  else if (location.hash === '#stage') show('stage');
  else show('landing');

})();
