/* Responsive personality ("chaos mode").
   Kiki notices how big her room is: a live "your window" readout, a remark whenever the window crosses into a new size,
   and a giggling, wobbling scramble if you drag the window edge around quickly. Height-only changes (the phone URL bar
   sliding in and out while you scroll) are ignored on purpose. */
(function () {
  'use strict';
  var K = (window.Kiki = window.Kiki || {});
  var root = document.documentElement;

  var SIZES = [
    { max: 480, id: 'pocket', label: 'pocket-sized', line: 'A pocket-sized room. Very snug.' },
    { max: 760, id: 'teacup', label: 'teacup-sized', line: 'A teacup-sized window. I fit perfectly!' },
    { max: 1100, id: 'cozy', label: 'cozy-sized', line: 'Nice and cozy in here.' },
    { max: Infinity, id: 'hall', label: 'loom-hall-sized', line: 'So much space! Time to weave something big.' }
  ];
  var labels = document.querySelectorAll('.vp'), badge = document.querySelector('.vp-badge');
  var cur = null, lastW = window.innerWidth, hits = [], quietUntil = 0, saidUntil = 0, wobbleT = 0, sayT = 0, raf = 0;

  function sizeFor(w) { for (var i = 0; i < SIZES.length; i++) if (w <= SIZES[i].max) return SIZES[i]; return SIZES[SIZES.length - 1]; }

  function write() {
    var dims = window.innerWidth + '×' + window.innerHeight;
    Array.prototype.forEach.call(labels, function (el) { el.textContent = dims + ', ' + cur.label; });
    if (badge) badge.textContent = 'window ' + dims;
  }

  function apply(initial) {
    var s = sizeFor(window.innerWidth), changed = s !== cur;
    cur = s; root.dataset.size = s.id; write();
    if (changed && !initial && Date.now() > saidUntil && !document.body.classList.contains('is-splash')) {
      clearTimeout(sayT);
      sayT = setTimeout(function () { K.toast('Kiki: ' + s.line, 3200); K.audio.sfx.squeak(); }, 450);
    }
  }

  function chaos() {
    clearTimeout(sayT); saidUntil = Date.now() + 3500; // the big moment wins over small "new size" remarks
    K.toast('Kiki: Wheee! The whole room is stretching!', 3200);
    K.audio.sfx.giggle();
    var w = window.innerWidth, h = window.innerHeight;
    K.dust.burst(w / 2, h / 3, 'confetti', 46, { speed: 420, up: 200 });
    K.dust.burst(w * 0.2, h * 0.5, 'stars', 14);
    K.dust.burst(w * 0.8, h * 0.5, 'stars', 14);
  }

  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) { if (!raf) raf = requestAnimationFrame(function () { raf = 0; write(); }); return; }
    lastW = window.innerWidth;
    if (!raf) raf = requestAnimationFrame(function () { raf = 0; apply(false); });
    root.classList.add('is-resizing');
    clearTimeout(wobbleT);
    wobbleT = setTimeout(function () { root.classList.remove('is-resizing'); }, 500);
    var now = Date.now();
    hits = hits.filter(function (t) { return now - t < 1500; });
    hits.push(now);
    if (hits.length >= 10 && now > quietUntil && !document.body.classList.contains('is-splash')) { quietUntil = now + 8000; hits = []; chaos(); }
  });

  apply(true);
})();
