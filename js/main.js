/* Page wiring: the sky, the enter screen, sound toggle, nav highlight, stats, quirks and the visit counter. */
(function () {
  'use strict';
  var K = (window.Kiki = window.Kiki || {});
  var $ = function (id) { return document.getElementById(id); };
  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- sky: twinkling stars at night, drifting clouds by day ---------- */
  (function sky() {
    var box = $('sky'), i, el;
    for (i = 0; i < 70; i++) {
      el = document.createElement('span');
      el.className = 'sky__star';
      el.style.left = (Math.random() * 100) + '%';
      el.style.top = (Math.random() * 100) + '%';
      var sz = 1 + Math.random() * 2.6;
      el.style.width = el.style.height = sz + 'px';
      el.style.animationDelay = (-Math.random() * 6) + 's';
      el.style.animationDuration = (3 + Math.random() * 4) + 's';
      box.appendChild(el);
    }
    for (i = 0; i < 4; i++) {
      el = document.createElement('span');
      el.className = 'sky__cloud';
      el.style.top = (6 + i * 22 + Math.random() * 8) + '%';
      el.style.animationDuration = (90 + Math.random() * 70) + 's';
      el.style.animationDelay = (-Math.random() * 120) + 's';
      el.style.setProperty('--s', (0.7 + Math.random() * 0.8).toFixed(2));
      box.appendChild(el);
    }
  })();

  /* ---------- visit counter (kept in this browser only) ---------- */
  var visits = 1;
  try {
    visits = parseInt(localStorage.getItem('kiki-visits') || '0', 10) || 0;
    if (!sessionStorage.getItem('kiki-counted')) { visits++; localStorage.setItem('kiki-visits', String(visits)); sessionStorage.setItem('kiki-counted', '1'); }
    visits = Math.max(1, visits);
  } catch (e) { visits = 1; }

  (function odometer() {
    var box = $('odometer'), DIGITS = 6, strips = [], i, j;
    for (i = 0; i < DIGITS; i++) {
      var d = document.createElement('span'), strip = document.createElement('span');
      d.className = 'od'; strip.className = 'od__strip';
      for (j = 0; j < 10; j++) { var n = document.createElement('i'); n.textContent = j; strip.appendChild(n); }
      d.appendChild(strip); box.appendChild(d); strips.push(strip);
    }
    var text = String(visits).padStart(DIGITS, '0').slice(-DIGITS);
    box.setAttribute('aria-label', 'You have visited ' + visits + (visits === 1 ? ' time' : ' times'));
    function roll() {
      strips.forEach(function (s, idx) {
        s.style.transitionDelay = (idx * 120) + 'ms';
        s.style.transform = 'translateY(' + (-text[idx] * 10) + '%)';
      });
    }
    if (!('IntersectionObserver' in window) || reduce.matches) { strips.forEach(function (s) { s.style.transition = 'none'; }); roll(); }
    else {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { roll(); io.disconnect(); } }, { threshold: 0.6 });
      io.observe(box);
    }
  })();

  /* ---------- secrets counter in the footer ---------- */
  function showSecrets() { $('secrets').textContent = 'Secrets found: ' + K.secrets.count() + ' of ' + K.secrets.total; }
  showSecrets(); K.secrets.onChange(showSecrets);

  /* ---------- sound toggle ---------- */
  var soundBtn = $('sound-toggle');
  function reflectSound(muted) {
    soundBtn.setAttribute('aria-checked', String(!muted));
    soundBtn.classList.toggle('is-off', muted);
  }
  K.audio.onChange(reflectSound);
  soundBtn.addEventListener('click', function () { K.audio.toggle(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'm' && e.key !== 'M') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (body.classList.contains('is-splash')) return;
    K.audio.toggle();
  });

  /* ---------- enter screen ---------- */
  var splash = $('splash'), shell = [document.querySelector('.topbar'), document.querySelector('.marquee'), $('main'), document.querySelector('.footer')];
  shell.forEach(function (el) { if (el) el.inert = true; });
  var wantsQuiet = K.audio.savedPreference() === 'off';
  (wantsQuiet ? $('enter-quiet') : $('enter-sound')).focus({ preventScroll: true });

  function enter(withSound) {
    K.audio.start(withSound);
    splash.classList.add('is-leaving');
    body.classList.remove('is-splash');
    shell.forEach(function (el) { if (el) el.inert = false; });
    setTimeout(function () { splash.hidden = true; }, 600);
    $('main').focus({ preventScroll: true });
    setTimeout(function () { K.hero.welcome(visits); }, 900);
  }
  $('enter-sound').addEventListener('click', function () { enter(true); });
  $('enter-quiet').addEventListener('click', function () { enter(false); });
  // Keep Tab inside the enter screen while it is open.
  splash.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var f = Array.prototype.slice.call(splash.querySelectorAll('button'));
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- stat bars fill when seen; quirks are tiny toys ---------- */
  if ('IntersectionObserver' in window && !reduce.matches) {
    var mio = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { $('meters').classList.add('is-in'); mio.disconnect(); }
    }, { threshold: 0.4 });
    mio.observe($('meters'));
  } else { $('meters').classList.add('is-in'); }

  Array.prototype.forEach.call(document.querySelectorAll('.quirk'), function (q) {
    q.setAttribute('data-silent', '');
    q.addEventListener('click', function () {
      K.audio.sfx.pluck(+q.dataset.note);
      var r = q.getBoundingClientRect();
      K.dust.burst(r.left + r.width / 2, r.top + r.height / 2, 'stars', 10, { speed: 170 });
      q.classList.remove('is-wiggle'); void q.offsetWidth; q.classList.add('is-wiggle');
    });
  });

  /* ---------- nav: mark the section you are in ---------- */
  if ('IntersectionObserver' in window) {
    var links = {};
    Array.prototype.forEach.call(document.querySelectorAll('.topbar__nav a'), function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var nio = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        var a = links[e.target.id];
        if (!a) return;
        if (e.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(links).forEach(function (id) { var s = $(id); if (s) nio.observe(s); });
  }
})();
