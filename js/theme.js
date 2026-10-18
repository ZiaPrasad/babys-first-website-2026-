/* Day ("Pastel Morning Tea") and night ("Deep Starlight") themes. The initial theme is set in <head>. */
(function () {
  'use strict';
  var K = (window.Kiki = window.Kiki || {});
  var root = document.documentElement;
  var KEY = 'kiki-theme';
  var meta = document.querySelector('meta[name="theme-color"]');
  var btn = document.getElementById('theme-toggle');

  var COLORS = { day: '#f3ebcf', night: '#14102a' };

  function current() { return root.dataset.theme === 'night' ? 'night' : 'day'; }

  function reflect(t) {
    if (meta) meta.setAttribute('content', COLORS[t]);
    if (btn) btn.setAttribute('aria-checked', String(t === 'night'));
    if (K.audio) K.audio.setTheme(t);
  }

  function set(t, quiet) {
    root.dataset.theme = t;
    try { localStorage.setItem(KEY, t); } catch (e) {}
    reflect(t);
    if (!quiet && K.audio) K.audio.sfx.theme(t);
    if (!quiet && K.dust) K.dust.burst(btn.getBoundingClientRect().left + 20, btn.getBoundingClientRect().top + 20, 'stars', 14);
  }

  K.theme = { current: current, set: set };

  reflect(current());
  if (btn) btn.addEventListener('click', function () { set(current() === 'night' ? 'day' : 'night'); });
})();
