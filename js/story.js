/* Scroll story: a golden thread is stitched down the page as you scroll, with a needle riding its tip.
   Each scene plays its little animation once, when it first comes into view. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var track = $('story-track');
  if (!track) return;

  var svg = $('thread-svg'), path = $('thread'), ghost = $('thread-ghost'), needle = $('needle');
  var scenes = Array.prototype.slice.call(track.querySelectorAll('.scene'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var length = 0, ticking = false;

  function layout() {
    var tr = track.getBoundingClientRect();
    var w = Math.round(tr.width), h = Math.round(tr.height);
    if (!w || !h) return;
    svg.setAttribute('width', w); svg.setAttribute('height', h);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

    var nodes = scenes.map(function (s) {
      var r = s.querySelector('.scene__node').getBoundingClientRect();
      return { x: r.left + r.width / 2 - tr.left, y: r.top + r.height / 2 - tr.top };
    });
    var amp = w < 700 ? 8 : 26, d = 'M' + nodes[0].x + ' 0 L' + nodes[0].x + ' ' + (nodes[0].y - 40);
    var prev = { x: nodes[0].x, y: nodes[0].y - 40 };
    nodes.forEach(function (n, i) {
      var dir = i % 2 ? -1 : 1, my = prev.y + (n.y - prev.y) / 2;
      d += ' C' + (prev.x + amp * dir) + ' ' + my + ' ' + (n.x - amp * dir) + ' ' + my + ' ' + n.x + ' ' + n.y;
      prev = n;
    });
    d += ' L' + prev.x + ' ' + h;
    path.setAttribute('d', d); ghost.setAttribute('d', d);
    length = path.getTotalLength();
    path.style.strokeDasharray = length + ' ' + length;
    update();
  }

  function update() {
    ticking = false;
    if (!length) return;
    var tr = track.getBoundingClientRect();
    var p = reduce.matches ? 1 : Math.max(0, Math.min(1, (window.innerHeight * 0.55 - tr.top) / tr.height));
    path.style.strokeDashoffset = length * (1 - p);
    var pt = path.getPointAtLength(length * p);
    needle.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ') rotate(' + (p * 1080) + ')');
    needle.style.opacity = p > 0.004 ? 1 : 0;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', layout);
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(track);
  window.addEventListener('load', layout);
  layout();

  if (reduce.matches || !('IntersectionObserver' in window)) {
    scenes.forEach(function (s) { s.classList.add('is-active'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-active'); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    scenes.forEach(function (s) { io.observe(s); });
  }
})();
