/* Loom Room loader: the 3D code (and Three.js) only downloads when a visitor steps inside.
   Also runs the "Kiki's Yarn Chase" moments: the artwork pops up whenever the yarn is pulled, in 3D or from the card. */
(function () {
  'use strict';
  var K = (window.Kiki = window.Kiki || {});
  var $ = function (id) { return document.getElementById(id); };
  var api = null, loading = null, failed = false, rm = window.matchMedia('(prefers-reduced-motion: reduce)');
  var note = $('room-note'), things = $('room-things');
  var TEXT = {
    loom: 'The loom hums. Tap it in 3D and it weaves another row of the blanket.',
    yarn: 'Yarn balls. They roll, they bounce, they unravel a little. Drag one and Kiki gives chase.',
    needles: 'tiny needles. very important.',
    star: 'this one fell from very far away...',
    tea: "careful, it's still warm!",
    lantern: 'my little work light.',
    moon: 'shhh... bedtime soon.',
    kiki: 'Kiki, standing very still because you are looking at her.'
  };

  function webgl() { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } }
  function fallback(msg) {
    failed = true; $('room-cta').hidden = false; $('room-enter').hidden = true; $('room-sub').textContent = msg;
    $('room-canvas').hidden = true; $('room-poster').hidden = false; $('room-ctl').hidden = true; $('room-hint').hidden = true; loading = null; api = null;
  }
  function toView(block) { var v = $('room-view'); if (v) v.scrollIntoView({ behavior: rm.matches ? 'auto' : 'smooth', block: block || 'start' }); }
  function viewVisible() { var r = $('room-view').getBoundingClientRect(), h = innerHeight; return r.top > -r.height * 0.25 && r.bottom < h + r.height * 0.25 && Math.min(r.bottom, h) - Math.max(r.top, 0) > r.height * 0.55; }

  /* ---- the chase artwork: a polaroid pops into the room, and the card below plays its run-in ---- */
  var chaseT = 0, cardT = 0;
  function chase() {
    var fig = $('room-chase'), card = $('yarn-chase');
    if (fig) { fig.classList.add('is-on'); clearTimeout(chaseT); chaseT = setTimeout(function () { fig.classList.remove('is-on'); }, 4200); }
    if (card) { card.classList.remove('is-chasing'); void card.offsetWidth; card.classList.add('is-chasing'); clearTimeout(cardT); cardT = setTimeout(function () { card.classList.remove('is-chasing'); }, 3600); }
  }

  function open(focus, opts) {
    opts = opts || {};
    toView('start');
    if (api) { if (focus && focus !== true) api.focus(focus); if (opts.pull) setTimeout(function () { api && api.pull(); }, 500); return Promise.resolve(); }
    if (loading) return loading;
    if (!webgl()) { fallback('This browser cannot show WebGL, so the 3D room stays a picture. The list of things below still works, and Kiki is in the chat.'); if (opts.pull) { chase(); note.textContent = 'hehe... wait for me!'; } return Promise.resolve(); }
    $('room-enter').disabled = true; $('room-sub').textContent = 'Lighting the lantern...';
    var small = innerWidth < 700 || matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4;
    loading = import('./room3d.js').then(function (m) {
      $('room-canvas').hidden = false; $('room-tip').hidden = true; $('room-cta').hidden = true; $('room-poster').hidden = true;
      $('room-ctl').hidden = false; $('room-hint').hidden = false; $('room-hint').classList.remove('is-faded');
      api = m.start({ K: K, canvas: $('room-canvas'), tip: $('room-tip'), say: $('room-say'), note: note, small: small, reduce: rm.matches, onChase: chase, onLost: function () { fallback('The 3D room fell asleep (the graphics context was lost). Reload to wake it.'); } });
      note.textContent = 'Tap the loom, the yarn, the star, the tea... or Kiki. Drag the yarn and see what happens.';
      K.audio.sfx.chime(true);
      if (focus && focus !== true) setTimeout(function () { api && api.focus(focus); }, 900);
      if (opts.pull) setTimeout(function () { api && api.pull(); }, 1700);
      $('room-canvas').focus({ preventScroll: true });
    }).catch(function () { fallback('The 3D room could not load just now. The picture and the chat still work.'); });
    return loading;
  }

  /* Pull Kiki's yarn from anywhere on the page. */
  function pull() {
    if (api) { if (!viewVisible()) toView('start'); api.pull(); return; }
    if (failed || !webgl()) { chase(); note.textContent = 'hehe... wait for me!'; return; }
    open('yarn', { pull: true });
  }
  K.room = { open: open, pull: pull, chase: chase };

  $('room-enter').addEventListener('click', function () { open(); });
  $('room-poster').addEventListener('click', function () { open(); });
  var cp = $('chase-pull'); if (cp) cp.addEventListener('click', pull);
  var pn = $('pen-next-btn'); if (pn) pn.addEventListener('click', function () { open('yarn', { pull: true }); });
  var bs = $('bed-story'); if (bs) bs.addEventListener('click', function () { K.chat && K.chat.ask('Tell me a bedtime story.'); });
  var pr = $('pen-to-room'); if (pr) pr.addEventListener('click', function () { open('yarn', { pull: true }); });

  /* Keyboard/screen-reader route to the same reactions as clicking in 3D. */
  things.addEventListener('click', function (e) {
    var b = e.target.closest('[data-thing]'); if (!b) return;
    var n = b.dataset.thing;
    if (api) { if (!viewVisible()) toView('start'); api.focus(n); api.act(n, true); }
    else { note.textContent = TEXT[n]; if (n === 'yarn') chase(); open(n); }
  });

  /* On-screen camera buttons (big touch targets); hold to keep turning. */
  var ctl = $('room-ctl'), hold = 0, holdT = 0;
  function stopHold() { clearTimeout(holdT); clearInterval(hold); hold = 0; }
  if (ctl) {
    ctl.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('[data-cam]'); if (!b || !api) return; var a = b.dataset.cam; e.preventDefault(); api.cam(a); b.dataset.fired = '1';
      if (a !== 'reset') { stopHold(); holdT = setTimeout(function () { hold = setInterval(function () { api && api.cam(a); }, 110); }, 380); }
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { ctl.addEventListener(ev, stopHold); });
    ctl.addEventListener('click', function (e) { var b = e.target.closest('[data-cam]'); if (!b || !api) return; if (b.dataset.fired) { delete b.dataset.fired; return; } api.cam(b.dataset.cam); });
  }
  var cv = $('room-canvas'); if (cv) cv.addEventListener('pointerdown', function () { var h = $('room-hint'); if (h) h.classList.add('is-faded'); }, { once: true });

  /* Projects → 3D: each toy gets a doorway to its object in the room. */
  [['loom', 'loom', 'Find my loom in the 3D Loom Room'], ['constellation', 'star', 'Find my fallen star in the 3D Loom Room'], ['tea', 'tea', 'Find my tea cup in the 3D Loom Room']].forEach(function (p) {
    var art = $(p[0]); if (!art) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn--small btn--soft project__door'; b.textContent = p[2] + ' \u2192';
    b.addEventListener('click', function () { open(p[1]); });
    (art.querySelector('.project__body') || art).appendChild(b);
  });
})();
