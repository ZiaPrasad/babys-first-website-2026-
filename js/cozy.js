/* Kiki's cozy level + her messy little work list.
   Five things a visitor can finish each make Kiki 20% cozier, and each one also ticks the matching line on her list:
     blanket loom re-threaded  -> "Finish moon blanket"
     constellation connected   -> "Stitch Little Bear"
     star-tea brewed           -> "Brew star-tea"
     a secret found            -> "Find missing golden thread"
     yarn thrown or pulled     -> "Don't fall asleep at the loom"
   Nothing is scored or ranked. It is just Kiki's mood, remembered in this browser. */
(function () {
  'use strict';
  var K = (window.Kiki = window.Kiki || {});
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var ITEMS = [
    { id: 'loom', t: 'Finish moon blanket', done: 'done! it came out so soft', says: 'Ooh, a fresh blanket. Look how soft it is.', target: 'loom' },
    { id: 'star', t: 'Stitch Little Bear', done: 'his ears are wonky. I love them', says: 'The little bear is stitched up. He looks proud.', target: 'constellation' },
    { id: 'tea', t: 'Brew star-tea', done: 'brewed. maybe too much honey', says: 'Warm tea, warm paws. Thank you.', target: 'tea' },
    { id: 'secret', t: 'Find missing golden thread', done: 'it was in my scarf the whole time!', says: 'My golden thread! It was in my scarf. Of course it was.', target: null },
    { id: 'yarn', t: "Don't fall asleep at the loom", done: 'still awake. mostly.', says: 'Chasing yarn keeps me awake. Mostly.', target: 'play' }
  ];
  var STEP = 100 / ITEMS.length;
  var MOODS = [
    [0, 'still chilly', 'I get cozier when you try my things.'],
    [20, 'warming up', 'Ah, a little warmer already.'],
    [40, 'getting snug', 'Snug. My ears stopped being cold.'],
    [60, 'properly cozy', 'Cozy! I might hum.'],
    [80, 'toasty', 'Toasty paws. One more thing and I will be a puddle.'],
    [100, 'all warmed up', 'Kiki is officially super cozy.']
  ];
  var KEY = 'kiki-cozy-v2';
  var done = {}, list = $('todo'), fill = $('cozy-fill'), bar = $('cozy-bar');
  try { done = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { done = {}; }
  ITEMS.forEach(function (it) { if (done[it.id] !== 1) delete done[it.id]; });

  list.innerHTML = ITEMS.map(function (it) {
    return '<li data-id="' + it.id + '"><span class="todo__box" aria-hidden="true"></span>' +
      '<span class="todo__txt"><span class="todo__t">' + it.t + '</span><span class="todo__sr sr"> (not done yet)</span>' +
      '<span class="todo__note" aria-hidden="true">' + it.done + '</span></span></li>';
  }).join('');

  function pct() { return Math.round(Object.keys(done).length * STEP); }
  function mood(p) { var m = MOODS[0]; MOODS.forEach(function (x) { if (p >= x[0]) m = x; }); return m; }

  function render(justId) {
    var p = pct(), m = mood(p);
    fill.style.width = p + '%';
    bar.setAttribute('aria-valuenow', p); bar.setAttribute('aria-valuetext', p + ' percent cozy, ' + m[1]);
    $('cozy-pct').textContent = p + '%'; $('cozy-level').textContent = m[1];
    $('cozy-say').textContent = m[2];
    $('cozy-max').hidden = p < 100; $('cozy-say').hidden = p >= 100;
    $('cozy').classList.toggle('is-max', p >= 100);
    var hc = $('hero-cozy');
    if (hc) { hc.textContent = p + '% · ' + m[1].toLowerCase(); hc.setAttribute('aria-label', "Kiki's cozy level: " + p + ' percent, ' + m[1].toLowerCase() + '. See her cozy notes in the Loom Room'); }
    ITEMS.forEach(function (it) {
      var li = list.querySelector('[data-id="' + it.id + '"]'), on = !!done[it.id];
      li.classList.toggle('is-done', on);
      li.querySelector('.todo__sr').textContent = on ? ' (done)' : ' (not done yet)';
      li.querySelector('.todo__note').setAttribute('aria-hidden', on ? 'false' : 'true');
      var pt = $('cozy-patches').querySelector('[data-id="' + it.id + '"]');
      if (pt) { pt.classList.toggle('is-on', on); if (justId === it.id) restart(pt, 'is-new'); }
      if (justId === it.id) restart(li, 'is-new');
    });
    if (justId) { restart($('cozy-pct'), 'is-bump'); restart($('cozy'), 'is-glow'); if (hc) restart(hc, 'is-bump'); }
    document.body.style.setProperty('--cozy', p / 100);
  }
  function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  function add(id) {
    var it = ITEMS.filter(function (x) { return x.id === id; })[0];
    if (!it || done[id]) return;
    done[id] = 1;
    try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {}
    render(id);
    var w = it.target && $(it.target); if (w && w.classList.contains('project')) restart(w, 'is-pulse');
    var p = pct();
    if (p >= 100) {
      K.toast('✦ MAXIMUM COZY ✦  Kiki is officially super cozy.', 4200);
      setTimeout(function () {
        K.audio.sfx.chime(true);
        if (K.dust && !reduce.matches) K.dust.burst(innerWidth / 2, innerHeight / 2, 'stars', 30, { speed: 340, up: 120 });
        if (K.hero) K.hero.say('I am so cozy. Thank you for staying.', 4200);
        if (K.chat) K.chat.kikiSays('I am officially super cozy. Thank you for staying a while.');
      }, 700);
    } else {
      // a secret already shows its own "found" toast first, so Kiki's reaction follows it
      setTimeout(function () { K.toast('Kiki: ' + it.says + '  (cozy level ' + pct() + '%)', 3400); }, id === 'secret' ? 2800 : 0);
    }
  }
  K.cozy = { add: add, percent: pct };

  /* Watch the rest of the page without editing those features. */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : e.target.parentNode;
    if (t.closest('#loom-moods .chip, #loom-shuffle, #blanket .cell')) add('loom');
  });

  /* Yarn counts once it has actually been thrown (released) or rolled with the keyboard, not on first touch. */
  var ball = $('pen-ball');
  if (ball) {
    ball.addEventListener('pointerup', function () { add('yarn'); });
    ball.addEventListener('keydown', function (e) { if (/^(Arrow(Left|Right|Up)| |Enter)$/.test(e.key)) add('yarn'); });
  }
  var cp = $('chase-pull'); if (cp) cp.addEventListener('click', function () { add('yarn'); });

  /* Tea counts when a brew has finished steeping (the Sip button becomes available). */
  var sip = $('tea-sip');
  if (sip && window.MutationObserver) new MutationObserver(function () { if (!sip.disabled) add('tea'); }).observe(sip, { attributes: true, attributeFilter: ['disabled'] });

  K.secrets.onChange(function () { add('secret'); });

  var svg = $('constellation-svg');
  if (svg && window.MutationObserver) new MutationObserver(function () { if (svg.querySelector('.cface')) add('star'); }).observe(svg, { childList: true, subtree: true });

  render();
})();
