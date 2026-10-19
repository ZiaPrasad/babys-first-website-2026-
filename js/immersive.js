/* Immersive story: parallax art, drifting motes, scene tints, tappable memories, and links to Kiki's chat. */
(function () {
  'use strict';
  var K = (window.Kiki = window.Kiki || {});
  var track = document.getElementById('story-track');
  if (!track) return;
  var scenes = Array.prototype.slice.call(track.querySelectorAll('.scene'));
  var rm = window.matchMedia('(prefers-reduced-motion: reduce)');
  var small = window.matchMedia('(max-width: 700px)');
  var MEM = [
    { tag: 'Touch the star', say: 'It was so cold. I could feel it through the yarn.', ask: 'Tell me about your first star.' },
    { tag: 'Pet the glow', say: 'Look. It is glowing back at me.', ask: 'Why do you collect fallen stars?' },
    { tag: 'Wave at the Elder', say: 'The Elder always pretends she is not watching. She is.', ask: 'Where do you live?' },
    { tag: 'Pull the thread', say: 'Click, clack. That is the best sound.', ask: 'What do you weave?' },
    { tag: 'Tuck her in', say: 'Shh. Almost asleep. Come visit my room?', ask: 'Tell me a bedtime story.' }
  ];
  var COLS = ['#7a8fd8', '#f0c96a', '#8a6fd0', '#d98f9a', '#4c4a9a'];

  scenes.forEach(function (sc, i) {
    var art = sc.querySelector('.scene__art'), m = MEM[i];
    art.classList.add('is-deep');
    if (!rm.matches) {
      var n = small.matches ? 5 : 11, box = document.createElement('div'); box.className = 'motes'; box.setAttribute('aria-hidden', 'true');
      for (var j = 0; j < n; j++) {
        var s = document.createElement('i'); s.style.left = (Math.random() * 96) + '%'; s.style.animationDuration = (7 + Math.random() * 8) + 's';
        s.style.animationDelay = (-Math.random() * 12) + 's'; s.style.setProperty('--d', (Math.random() * 30 - 15).toFixed(0) + 'px'); box.appendChild(s);
      }
      art.appendChild(box);
    }
    var bar = document.createElement('div'); bar.className = 'scene__acts';
    var tag = document.createElement('button'); tag.type = 'button'; tag.className = 'chip'; tag.textContent = '\u2726 ' + m.tag;
    var ask = document.createElement('button'); ask.type = 'button'; ask.className = 'chip chip--ghost'; ask.textContent = 'Ask Kiki about this';
    var cap = document.createElement('p'); cap.className = 'scene__say'; cap.setAttribute('aria-live', 'polite');
    bar.appendChild(tag); bar.appendChild(ask); sc.querySelector('.scene__text').appendChild(bar); sc.querySelector('.scene__text').appendChild(cap);
    function poke(x, y) {
      cap.textContent = '\u201C' + m.say + '\u201D';
      K.audio.sfx.pluck([4, 7, 9, 5, 2][i]); K.dust.burst(x, y, 'stars', 14, { speed: 220 });
      art.classList.remove('is-poked'); void art.offsetWidth; art.classList.add('is-poked');
      if (K.hero) K.hero.say(m.say, 2600);
    }
    tag.addEventListener('click', function () { var r = tag.getBoundingClientRect(); poke(r.left + 20, r.top); });
    art.addEventListener('pointerdown', function (e) { poke(e.clientX, e.clientY); });
    ask.addEventListener('click', function () { K.chat && K.chat.ask(m.ask); });
  });

  /* scroll-linked: art drifts against the text, track tint follows the active scene */
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = innerHeight, best = 0, bd = 1e9;
    scenes.forEach(function (sc, i) {
      var r = sc.getBoundingClientRect(), mid = r.top + r.height / 2, off = (mid - vh / 2) / vh;
      if (Math.abs(off) < bd) { bd = Math.abs(off); best = i; }
      if (rm.matches || r.bottom < -100 || r.top > vh + 100) return;
      var img = sc.querySelector('.scene__art img');
      img.style.transform = 'translate3d(0,' + (off * -22).toFixed(1) + 'px,0) scale(1.1)';
      sc.querySelector('.scene__text').style.transform = 'translate3d(0,' + (off * 14).toFixed(1) + 'px,0)';
    });
    track.style.setProperty('--tint', COLS[best]);
    track.dataset.scene = best + 1;
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); frame();

  K.immersive = { goto: function (n) {
    var sc = scenes[n - 1]; if (!sc) return;
    sc.scrollIntoView({ behavior: rm.matches ? 'auto' : 'smooth', block: 'center' });
  } };
})();
