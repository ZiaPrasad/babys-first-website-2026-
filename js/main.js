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
  function showSecrets() { $('secrets').textContent = 'Little secrets found: ' + K.secrets.count() + ' of ' + K.secrets.total; }
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
    // leave keyboard focus at the very top so the first Tab reaches the skip link and the section menu
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
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

  /* ---------- navigation: smooth scroll, "you are here", and the compact menu ---------- */
  var topbar = $('topbar'), navEl = $('topnav'), toggle = $('nav-toggle'), scrim = $('nav-scrim');
  var ORDER = ['top', 'sheet', 'projects', 'story', 'room', 'play', 'bedtime', 'wish'];
  var NAMES = { top: 'home', sheet: 'about', projects: 'my stuff', story: 'my story', room: 'loom room', play: 'yarn play', bedtime: 'bedtime', wish: 'contact' };
  var navLinks = {};
  Array.prototype.forEach.call(navEl.querySelectorAll('a'), function (a) { navLinks[a.getAttribute('href').slice(1)] = a; });

  function go(id) {
    var el = $(id); if (!el) return;
    var y = id === 'top' ? 0 : Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - topbar.offsetHeight - 10);
    window.scrollTo({ top: y, behavior: reduce.matches ? 'auto' : 'smooth' });
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
  K.nav = { go: go };

  // Every in-page link ("See what I'm making", "Walk into my Loom Room", the menu...) glides to its section and moves keyboard focus there.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var id = a.getAttribute('href').slice(1);
    if (!id || !$(id)) return;
    e.preventDefault(); go(id);
    if (a.classList.contains('btn') && K.audio) K.audio.sfx.pluck(6);
  });

  var navTick = 0, curId = '';
  function here() {
    var probe = topbar.offsetHeight + window.innerHeight * 0.28, cur = 'top';
    ORDER.forEach(function (id) { var el = $(id); if (el && el.getBoundingClientRect().top <= probe) cur = id; });
    if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4) cur = 'wish';
    if (cur === curId) return;
    curId = cur;
    Object.keys(navLinks).forEach(function (k) { if (k === cur) navLinks[k].setAttribute('aria-current', 'location'); else navLinks[k].removeAttribute('aria-current'); });
    $('nav-here').textContent = NAMES[cur];
  }
  function queueHere() { if (!navTick) navTick = requestAnimationFrame(function () { navTick = 0; here(); }); }
  window.addEventListener('scroll', queueHere, { passive: true });
  window.addEventListener('resize', queueHere);
  here();

  (function menu() {
    function set(open, refocus) {
      navEl.classList.toggle('is-open', open); scrim.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      // while the sheet is open the page behind it can't be tabbed into
      [$('main'), document.querySelector('.footer'), document.querySelector('.marquee'), document.querySelector('.topbar__logo'), $('sound-toggle'), $('theme-toggle')].forEach(function (el) { if (el) el.inert = open; });
      if (open) { var cur = navEl.querySelector('[aria-current]') || navEl.querySelector('a'); if (cur) cur.focus({ preventScroll: true }); }
      else if (refocus) toggle.focus({ preventScroll: true });
    }
    toggle.addEventListener('click', function () { set(!navEl.classList.contains('is-open'), false); });
    scrim.addEventListener('click', function () { set(false, true); });
    navEl.addEventListener('click', function (e) { if (e.target.closest('a')) set(false, false); });
    document.addEventListener('keydown', function (e) {
      if (!navEl.classList.contains('is-open')) return;
      if (e.key === 'Escape') { set(false, true); return; }
      if (e.key !== 'Tab') return;
      var f = Array.prototype.slice.call(navEl.querySelectorAll('a')).concat([toggle]);   // the sheet's links, then the Menu button that closes it
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
    window.matchMedia('(min-width: 1241px)').addEventListener('change', function (m) { if (m.matches) set(false, false); });
  })();
})();
