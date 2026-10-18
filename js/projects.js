/* Three project toys: The Blanket Loom, Constellation Connect-the-Dots, Warm Milk & Star-Tea Steeper. */
(function () {
  'use strict';
  var K = (window.Kiki = window.Kiki || {});
  var $ = function (id) { return document.getElementById(id); };
  var NS = 'http://www.w3.org/2000/svg';

  function svgEl(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function center(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

  /* A small accessible radio group of chips (arrow keys move the choice). Also used by the wish form. */
  K.radioGroup = function (box, items, initial, onChange) {
    var btns = [];
    function select(id, user) {
      btns.forEach(function (b) {
        var on = b.dataset.id === id;
        b.setAttribute('aria-checked', String(on));
        b.tabIndex = on ? 0 : -1;
        b.classList.toggle('is-on', on);
      });
      if (onChange) onChange(id, !!user);
    }
    items.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.setAttribute('role', 'radio');
      b.textContent = it.label; b.dataset.id = it.id;
      b.addEventListener('click', function () { select(it.id, true); });
      box.appendChild(b); btns.push(b);
    });
    box.setAttribute('role', 'radiogroup');
    box.addEventListener('keydown', function (e) {
      var i = btns.findIndex(function (b) { return b.getAttribute('aria-checked') === 'true'; }), n;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % btns.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + btns.length) % btns.length;
      else return;
      e.preventDefault(); select(items[n].id, true); btns[n].focus();
    });
    select(initial, false);
    return {
      select: select,
      value: function () { var b = btns.filter(function (x) { return x.getAttribute('aria-checked') === 'true'; })[0]; return b ? b.dataset.id : initial; }
    };
  };

  /* ====================== 1. The Blanket Loom ====================== */
  function hash(c, r) { var x = Math.sin(c * 127.1 + r * 311.7) * 43758.5453; return x - Math.floor(x); }

  var MOODS = [
    { id: 'sleepy', label: 'Sleepy', colors: ['#a995d8', '#bccaee', '#f6ecd2', '#eaa8a4'], notes: [0, 2, 4], note: 'Slow diagonal stripes in lilac and powder blue, for nights that should end early.', pattern: function (c, r) { return (c + r) % 4; } },
    { id: 'dreamy', label: 'Dreamy', colors: ['#7f8fd8', '#a995d8', '#d9b8ee', '#f4d6ef'], notes: [2, 4, 7], note: 'Rolling waves from deep blue to pink, for floating off slowly.', pattern: function (c, r) { return Math.floor((Math.sin(c * 0.85 + r * 0.55) + 1) * 1.99); } },
    { id: 'brave', label: 'Brave', colors: ['#e9b949', '#eaa8a4', '#3b2d63', '#f6ecd2'], notes: [4, 7, 9], note: 'Bold gold and plum checks, for nights with a thunderstorm in them.', pattern: function (c, r) { var big = ((c >> 1) + (r >> 1)) % 2, alt = (c + r) % 2; return big ? alt : 2 + alt; } },
    { id: 'giggly', label: 'Giggly', colors: ['#f4c3c0', '#f6d98a', '#bccaee', '#c9e3c1'], notes: [7, 9, 12], note: 'Scattered confetti squares, for nights full of whispered jokes.', pattern: function (c, r) { return Math.floor(hash(c, r) * 4); } }
  ];
  K.moods = MOODS;

  (function loom() {
    var blanket = $('blanket'), noteEl = $('loom-note');
    if (!blanket) return;
    var COLS = 9, ROWS = 6, cells = [], idx = [], mood = MOODS[0];

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var cell = document.createElement('i');
        cell.className = 'cell'; cell.dataset.c = c; cell.dataset.r = r;
        cell.style.setProperty('--d', ((c + r) * 38) + 'ms');
        blanket.appendChild(cell); cells.push(cell); idx.push(0);
      }
    }

    function paint() { cells.forEach(function (cell, i) { cell.style.backgroundColor = mood.colors[idx[i]]; }); }
    function replay() { blanket.classList.remove('is-weaving'); void blanket.offsetWidth; blanket.classList.add('is-weaving'); }

    function setMood(id, user) {
      mood = MOODS.filter(function (m) { return m.id === id; })[0] || MOODS[0];
      cells.forEach(function (cell, i) { idx[i] = mood.pattern(+cell.dataset.c, +cell.dataset.r) % 4; });
      paint(); replay();
      blanket.setAttribute('aria-label', 'Woven blanket pattern for a ' + mood.label.toLowerCase() + ' night');
      noteEl.textContent = mood.note;
      if (user) {
        mood.notes.forEach(function (n, i) { setTimeout(function () { K.audio.sfx.pluck(n + 3); }, i * 110); });
        var c = center(blanket); K.dust.burst(c.x, c.y, 'stars', 12, { speed: 200 });
      }
    }

    var group = K.radioGroup($('loom-moods'), MOODS, 'sleepy', setMood);

    blanket.addEventListener('click', function (e) {
      var cell = e.target.closest('.cell');
      if (!cell) return;
      var i = cells.indexOf(cell);
      idx[i] = (idx[i] + 1) % 4;
      cell.style.backgroundColor = mood.colors[idx[i]];
      cell.classList.remove('is-pop'); void cell.offsetWidth; cell.classList.add('is-pop');
      K.audio.sfx.pluck(+cell.dataset.c % 9);
    });

    $('loom-shuffle').addEventListener('click', function () {
      for (var i = 0; i < idx.length; i++) idx[i] = (Math.random() * 4) | 0;
      paint(); replay(); K.audio.sfx.sparkle(5);
      noteEl.textContent = 'A one-of-a-kind ' + mood.label.toLowerCase() + ' blanket, rethreaded by you.';
    });

    group.select('sleepy', false);
  })();

  /* ====================== 2. Constellation Connect-the-Dots ====================== */
  (function constellation() {
    var svg = $('constellation-svg'), noteEl = $('const-note');
    if (!svg) return;
    var PTS = [[44, 64], [66, 20], [112, 56], [160, 48], [208, 56], [254, 20], [276, 64], [260, 130], [214, 178], [160, 196], [106, 178], [60, 130]];
    var next = 0, done = false, dots = [], lineLayer, fillLayer, faceLayer;

    function line(a, b) {
      var len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      var l = svgEl('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'cline' }, lineLayer);
      l.style.strokeDasharray = len; l.style.strokeDashoffset = len;
      requestAnimationFrame(function () { requestAnimationFrame(function () { l.style.strokeDashoffset = 0; }); });
    }

    function refreshNext() {
      dots.forEach(function (d, i) { d.classList.toggle('is-next', !done && i === next); });
    }

    function finish() {
      done = true;
      line(PTS[PTS.length - 1], PTS[0]);
      svgEl('polygon', { points: PTS.map(function (p) { return p.join(','); }).join(' '), class: 'cfill' }, fillLayer);
      [[125, 112], [195, 112], [160, 142]].forEach(function (p, i) {
        var s = svgEl('circle', { cx: p[0], cy: p[1], r: i === 2 ? 5 : 4, class: 'cface' }, faceLayer);
        s.style.animationDelay = (i * 0.15) + 's';
      });
      noteEl.textContent = 'You wove "The Sleepy Mouse". It keeps watch over the forest while everyone sleeps.';
      refreshNext();
      K.audio.sfx.chime(true); setTimeout(function () { K.audio.sfx.sparkle(9); }, 380);
      var c = center(svg); K.dust.burst(c.x, c.y, 'stars', 30, { speed: 300 });
    }

    function hit(i) {
      if (done) return;
      var d = dots[i];
      if (i === next) {
        if (next > 0) line(PTS[next - 1], PTS[next]);
        d.classList.add('is-done');
        K.audio.sfx.pluck(next % 9);
        next++;
        if (next === PTS.length) finish();
        else { noteEl.textContent = 'Nice. Now star ' + (next + 1) + '.'; refreshNext(); }
      } else if (!d.classList.contains('is-done')) {
        d.classList.remove('is-shake'); void d.getBoundingClientRect(); d.classList.add('is-shake');
        K.audio.sfx.bonk();
        noteEl.textContent = 'Not that one. Look for star ' + (next + 1) + '.';
      }
    }

    function build() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      next = 0; done = false; dots = [];
      fillLayer = svgEl('g', {}, svg); lineLayer = svgEl('g', {}, svg); faceLayer = svgEl('g', {}, svg);
      var dotLayer = svgEl('g', {}, svg);
      PTS.forEach(function (p, i) {
        var g = svgEl('g', { class: 'cdot', tabindex: 0, role: 'button', 'aria-label': 'Star ' + (i + 1) }, dotLayer);
        svgEl('circle', { cx: p[0], cy: p[1], r: 17, class: 'cdot__hit' }, g);
        svgEl('circle', { cx: p[0], cy: p[1], r: 12, class: 'cdot__ring' }, g);
        svgEl('circle', { cx: p[0], cy: p[1], r: 5, class: 'cdot__core' }, g);
        var t = svgEl('text', { x: p[0], y: p[1] + (p[1] > 100 ? 25 : -13), class: 'cdot__num', 'text-anchor': 'middle' }, g);
        t.textContent = i + 1;
        g.addEventListener('click', function () { hit(i); });
        g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hit(i); } });
        dots.push(g);
      });
      noteEl.textContent = 'Start with star 1.';
      refreshNext();
    }

    $('const-reset').addEventListener('click', build);
    build();
  })();

  /* ====================== 3. Warm Milk & Star-Tea Steeper ====================== */
  (function tea() {
    var liquid = $('liquid'), glitter = $('glitter'), bubbles = $('bubbles'), steam = $('steam'), cup = $('cup');
    if (!liquid) return;
    var noteEl = $('tea-note'), fill = $('brew-fill'), steepBtn = $('tea-steep'), sipBtn = $('tea-sip');
    var INGR = [
      { id: 'stardust', label: 'Stardust', color: [190, 165, 245] },
      { id: 'honey', label: 'Honey drops', color: [242, 176, 60] },
      { id: 'milk', label: 'Moon milk', color: [252, 244, 230] }
    ];
    var BASE = [226, 200, 150];
    var RECIPES = {
      '': ['Warm water', 'Plain, but warm. Add something.'],
      'stardust': ['Twinkle Tea', 'Light, fizzy and a little bit sparkly.'],
      'honey': ['Honey Hush', 'Sweet enough to quiet a whole forest.'],
      'milk': ['Moon Milk', 'Soft, creamy and very sleepy.'],
      'stardust+honey': ['Shooting-Star Sweetie', 'Sweet, with a sparkle on top.'],
      'stardust+milk': ['Milky Way Latte', 'Creamy, with stars swirling in.'],
      'honey+milk': ['Golden Goodnight', 'Warm honey milk. The classic.'],
      'stardust+honey+milk': ['The Full Starlight', "Kiki's own recipe: sweet, creamy and glittering."]
    };
    var TOP = 62, SPAN = 104; // inside the cup: y 62 to 166
    var chosen = {}, level = 0.6, brewed = false, steeping = false, bubbleTimer = 0, steepTimer = 0;

    function key() { return INGR.filter(function (i) { return chosen[i.id]; }).map(function (i) { return i.id; }).join('+'); }
    function setLevel(l) {
      level = Math.max(0, Math.min(1, l));
      // the liquid rect is fixed; sliding it down empties the cup (smoothly, via a CSS transition)
      liquid.style.transform = 'translateY(' + ((1 - level) * SPAN + 4).toFixed(1) + 'px)';
      glitter.style.opacity = level < 0.08 ? 0 : 1;
    }
    function mix() {
      var sel = INGR.filter(function (i) { return chosen[i.id]; }), n = sel.length + 1, rgb = [0, 0, 0];
      [BASE].concat(sel.map(function (i) { return i.color; })).forEach(function (c) { for (var k = 0; k < 3; k++) rgb[k] += c[k] / n; });
      liquid.style.fill = 'rgb(' + rgb.map(Math.round).join(',') + ')';
    }
    function drawGlitter() {
      glitter.innerHTML = '';
      if (!chosen.stardust) return;
      for (var i = 0; i < 9; i++) {
        var s = svgEl('circle', { cx: 60 + Math.random() * 120, cy: TOP + 30 + Math.random() * 70, r: 1.4 + Math.random() * 1.6, class: 'glit' }, glitter);
        s.style.animationDelay = (Math.random() * 2) + 's';
      }
    }
    function summary() {
      var names = INGR.filter(function (i) { return chosen[i.id]; }).map(function (i) { return i.label.toLowerCase(); });
      return names.length ? 'Added ' + names.join(', ') + '. Ready to steep.' : 'Plain warm water. Add something.';
    }
    function reset() {
      brewed = false; steam.classList.remove('is-hot'); sipBtn.disabled = true;
      setLevel(0.6); fill.style.transition = 'none'; fill.style.width = '0%';
    }

    var chipBox = $('tea-chips');
    INGR.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = it.label; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        if (steeping) return;
        chosen[it.id] = !chosen[it.id];
        b.setAttribute('aria-pressed', String(!!chosen[it.id])); b.classList.toggle('is-on', !!chosen[it.id]);
        mix(); drawGlitter(); reset(); noteEl.textContent = summary();
        K.audio.sfx.pluck(INGR.indexOf(it) * 2 + 2);
      });
      chipBox.appendChild(b);
    });

    function bubble() {
      var b = svgEl('circle', { cx: 60 + Math.random() * 120, cy: TOP + SPAN * (1 - level) + 40 + Math.random() * 30, r: 2 + Math.random() * 3.5, class: 'bub' }, bubbles);
      setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 1200);
      K.audio.sfx.bubble();
    }

    steepBtn.addEventListener('click', function () {
      if (steeping) return;
      steeping = true; steepBtn.disabled = true; sipBtn.disabled = true; steam.classList.remove('is-hot');
      noteEl.textContent = 'Steeping...';
      setLevel(0.85);
      fill.style.transition = 'none'; fill.style.width = '0%'; void fill.offsetWidth;
      fill.style.transition = 'width 3.6s linear'; fill.style.width = '100%';
      bubbleTimer = setInterval(bubble, 240);
      steepTimer = setTimeout(function () {
        clearInterval(bubbleTimer);
        steeping = false; brewed = true; steepBtn.disabled = false; sipBtn.disabled = false;
        steam.classList.add('is-hot');
        var r = RECIPES[key()];
        noteEl.textContent = r[0] + '. ' + r[1];
        K.audio.sfx.chime(true);
        var c = center(cup); K.dust.burst(c.x, c.y - 20, 'stars', 16, { speed: 220 });
      }, 3700);
    });

    function sip() {
      if (!brewed || level <= 0.05) return;
      K.audio.sfx.gulp();
      setLevel(level - 0.28);
      if (level <= 0.05) {
        setLevel(0); brewed = false; sipBtn.disabled = true; steam.classList.remove('is-hot');
        noteEl.textContent = 'All gone. Time for bed.';
        K.audio.sfx.chime(false);
      } else {
        noteEl.textContent = pickLine();
      }
    }
    function pickLine() { var L = ['Mmm. Warm.', 'Cozy all the way down.', 'One more sip.', 'Sleepy already...']; return L[(Math.random() * L.length) | 0]; }
    sipBtn.addEventListener('click', sip);
    cup.addEventListener('click', sip);

    mix(); setLevel(0.6);
  })();
})();
