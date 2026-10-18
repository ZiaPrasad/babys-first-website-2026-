/* Hero: playable title, tilt, Kiki's reactions, and two hidden secrets.
     Secret 1  Click Kiki's scarf 3 times: the star knot comes loose and she sneezes shooting stars.
     Secret 2  Boop Kiki's nose 4 times fast: she curls into a yarn ball. */
(function () {
  'use strict';
  var K = (window.Kiki = window.Kiki || {});
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function pick(a) { return a[(Math.random() * a.length) | 0]; }

  /* ---------- shared helpers: secrets + toast ---------- */
  var SKEY = 'kiki-secrets', found = {}, secretCbs = [];
  try { found = JSON.parse(localStorage.getItem(SKEY) || '{}') || {}; } catch (e) { found = {}; }
  K.secrets = {
    total: 2,
    count: function () { return Object.keys(found).length; },
    add: function (id) {
      if (found[id]) return false;
      found[id] = 1;
      try { localStorage.setItem(SKEY, JSON.stringify(found)); } catch (e) {}
      secretCbs.forEach(function (fn) { fn(); });
      return true;
    },
    onChange: function (fn) { secretCbs.push(fn); }
  };

  var toastEl = $('toast'), toastTimer = 0;
  K.toast = function (msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, ms || 4200);
  };

  /* ---------- playable title: each letter is a music-box key ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.kiki-word span'), function (l) {
    function jig() {
      l.classList.remove('is-jig'); void l.offsetWidth; l.classList.add('is-jig');
      K.audio.sfx.pluck(+l.dataset.note);
    }
    l.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') jig(); });
    l.addEventListener('pointerdown', jig);
  });

  /* ---------- stage: video layers, speech bubble, tilt ---------- */
  var stage = $('stage'), tilt = $('tilt'), screen = $('screen'), bubble = $('bubble');
  var vid = { idle: $('vid-idle'), happy: $('vid-happy'), sneeze: $('vid-sneeze') };
  var bubbleTimer = 0, curling = false, busy = false;

  function say(text, ms) {
    bubble.textContent = text;
    bubble.classList.add('is-on');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.classList.remove('is-on'); }, ms || 2600);
  }

  function react(name) {
    var v = vid[name];
    if (!v) return;
    ['happy', 'sneeze'].forEach(function (k) { if (k !== name) vid[k].classList.remove('is-on'); });
    try { v.currentTime = 0; } catch (e) {}
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
    v.classList.add('is-on');
    v.onended = function () { v.classList.remove('is-on'); };
  }

  function center(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // Idle loop: still frame for people who prefer reduced motion, and paused when off-screen.
  if (reduce.matches) { vid.idle.removeAttribute('autoplay'); vid.idle.pause(); }
  else if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var p;
      if (entries[0].isIntersecting) { p = vid.idle.play(); if (p && p.catch) p.catch(function () {}); }
      else vid.idle.pause();
    }, { threshold: 0.05 }).observe(stage);
  }

  // Tilt toward the pointer. A finger drag does the same on touch screens.
  function setTilt(x, y) {
    tilt.style.setProperty('--rx', (y * -7).toFixed(2) + 'deg');
    tilt.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
  }
  if (!reduce.matches) {
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      setTilt(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
    });
    stage.addEventListener('pointerleave', function () { setTilt(0, 0); });
  }

  /* ---------- face: boops, and the yarn-ball curl ---------- */
  var face = $('spot-face'), boops = [];
  var BOOP_LINES = ['Hehe, boop!', 'Eep!', 'That is my nose!', 'Boop received.', 'Again? Okay.'];
  face.setAttribute('data-silent', '');

  function curl() {
    curling = true;
    screen.classList.add('is-curled');
    say('...I am not here.', 2300);
    K.audio.sfx.pop();
    setTimeout(function () {
      screen.classList.remove('is-curled');
      K.audio.sfx.pop();
      say('Okay. It is safe now.', 1800);
      curling = false;
      if (K.secrets.add('curl')) K.toast('Secret found: the Yarn Ball Curl (' + K.secrets.count() + ' of ' + K.secrets.total + ')');
    }, 2500);
  }

  face.addEventListener('click', function () {
    if (curling || busy) return;
    var now = Date.now();
    boops = boops.filter(function (t) { return now - t < 3200; });
    boops.push(now);
    if (boops.length >= 4) { boops = []; curl(); return; }
    say(pick(BOOP_LINES));
    K.audio.sfx.squeak();
    react('happy');
    var c = center(face);
    K.dust.burst(c.x, c.y, 'stars', 8, { speed: 150 });
  });

  /* ---------- scarf: the Easter egg ---------- */
  var scarf = $('spot-scarf'), tugs = 0, tugTimer = 0;
  scarf.setAttribute('data-silent', '');

  function nudge() {
    screen.classList.remove('is-nudge'); void screen.offsetWidth; screen.classList.add('is-nudge');
  }

  function starKnot() {
    busy = true;
    say('Is that a giant star knot? Oh, oh...', 1700);
    K.audio.sfx.pluck(2);
    // The clip inhales at ~0.7s and sneezes at ~1.0s, so the sound starts 0.3s after the video.
    setTimeout(function () { react('sneeze'); }, 350);
    setTimeout(function () { K.audio.sfx.sneeze(); }, 650);
    setTimeout(function () {
      var c = center(screen);
      K.dust.burst(c.x, c.y - 30, 'confetti', 70, { speed: 480, up: 280 });
      K.dust.burst(c.x, c.y - 30, 'yarn', 22, { speed: 380, up: 220 });
      say('Achoo! Sorry, that was star dust.', 2600);
    }, 1450);
    setTimeout(function () {
      busy = false;
      if (K.secrets.add('knot')) K.toast('Secret found: the Star Knot (' + K.secrets.count() + ' of ' + K.secrets.total + ')');
    }, 3300);
  }

  scarf.addEventListener('click', function () {
    if (busy || curling) return;
    clearTimeout(tugTimer);
    tugTimer = setTimeout(function () { tugs = 0; }, 6000);
    tugs++;
    nudge();
    if (tugs === 1) { say('Is my thread coming loose?'); K.audio.sfx.pluck(4); }
    else if (tugs === 2) { say('That tickles!'); K.audio.sfx.giggle(); }
    else { tugs = 0; starKnot(); }
  });

  /* ---------- buttons and greetings ---------- */
  var HI = ['Hi! You found me.', 'Hello! Mind the yarn.', 'Oh! Hi hi hi.', 'Welcome to the Loom Room.'];
  $('say-hi').addEventListener('click', function () {
    if (curling || busy) return;
    say(pick(HI), 2600);
    K.audio.sfx.giggle();
    react('happy');
  });

  K.hero = {
    say: say,
    welcome: function (visit) {
      say(visit <= 1 ? 'Oh! A visitor. I am Kiki.' : 'Welcome back! This is visit number ' + visit + '.', 3400);
      react('happy');
    }
  };
})();
