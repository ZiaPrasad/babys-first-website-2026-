/* Cursor stardust trail plus bursts (stars, confetti, yarn) on one fixed canvas.
   The canvas only animates while something is on screen, so it costs nothing at rest. */
(function () {
  'use strict';
  var K = (window.Kiki = window.Kiki || {});
  var canvas = document.getElementById('dust');
  if (!canvas || !canvas.getContext) return;
  var g = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var W = 0, H = 0, raf = 0;
  var parts = [], trail = [];
  var lastSpawn = { x: -999, y: -999 };
  var MAX = 260;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function palette(kind) {
    var night = document.documentElement.dataset.theme === 'night';
    if (kind === 'confetti') return ['#f6d98a', '#eaa8a4', '#a995d8', '#bccaee', '#ffffff'];
    if (kind === 'yarn') return ['#a995d8', '#eaa8a4', '#bccaee'];
    return night ? ['#f6d98a', '#ffe9a8', '#ffffff', '#c9bcf0'] : ['#e9b949', '#d98f9a', '#a995d8', '#f2cf7a'];
  }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }

  function add(p) { if (parts.length < MAX) parts.push(p); }

  function spawn(x, y, kind, o) {
    o = o || {};
    var cols = palette(kind);
    if (kind === 'trail') {
      add({ trail: true, k: 'star', x: x + (Math.random() - 0.5) * 8, y: y + (Math.random() - 0.5) * 8, vx: (Math.random() - 0.5) * 24, vy: 10 + Math.random() * 26, life: 0, max: 0.7 + Math.random() * 0.5, size: 2 + Math.random() * 3.5, c: pick(cols), rot: Math.random() * 3, vr: (Math.random() - 0.5) * 3, grav: 30 });
      return;
    }
    var speed = o.speed || 220;
    var a = Math.random() * Math.PI * 2, s = speed * (0.35 + Math.random() * 0.75);
    var base = { x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up || 0), life: 0, c: pick(cols), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12 };
    if (kind === 'confetti') { base.k = 'rect'; base.size = 5 + Math.random() * 5; base.max = 1.4 + Math.random() * 0.8; base.grav = 520; base.drag = 0.4; }
    else if (kind === 'yarn') { base.k = 'yarn'; base.size = 9 + Math.random() * 10; base.max = 1.3 + Math.random() * 0.7; base.grav = 380; base.drag = 0.5; }
    else { base.k = 'star'; base.size = 3 + Math.random() * 5; base.max = 0.8 + Math.random() * 0.6; base.grav = 140; base.drag = 0.8; }
    add(base);
  }

  function burst(x, y, kind, count, o) {
    var n = count || 16;
    if (reduce.matches) n = Math.min(n, 6);
    for (var i = 0; i < n; i++) spawn(x, y, kind || 'stars', o);
    run();
  }

  function sparkle(x, y, r, rot) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.beginPath();
    g.moveTo(0, -r); g.quadraticCurveTo(r * 0.18, -r * 0.18, r, 0); g.quadraticCurveTo(r * 0.18, r * 0.18, 0, r);
    g.quadraticCurveTo(-r * 0.18, r * 0.18, -r, 0); g.quadraticCurveTo(-r * 0.18, -r * 0.18, 0, -r);
    g.fill(); g.restore();
  }

  var last = 0;
  function frame(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    g.clearRect(0, 0, W, H);

    // glowing thread following the pointer
    var now = performance.now(), i;
    while (trail.length && now - trail[0].t > 420) trail.shift();
    if (trail.length > 2) {
      var night = document.documentElement.dataset.theme === 'night';
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (i = 1; i < trail.length; i++) {
        var age = (now - trail[i].t) / 420, a = Math.max(0, 1 - age);
        g.strokeStyle = night ? 'rgba(246,217,138,' + (a * 0.85) + ')' : 'rgba(217,143,154,' + (a * 0.8) + ')';
        g.lineWidth = 1 + a * 2.6;
        g.beginPath(); g.moveTo(trail[i - 1].x, trail[i - 1].y); g.lineTo(trail[i].x, trail[i].y); g.stroke();
      }
    }

    for (i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life += dt;
      if (p.life >= p.max) { parts.splice(i, 1); continue; }
      var d = p.drag ? Math.exp(-p.drag * dt) : 1;
      p.vx *= d; p.vy = p.vy * d + (p.grav || 0) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      var t = p.life / p.max, alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      g.globalAlpha = Math.max(0, alpha); g.fillStyle = p.c; g.strokeStyle = p.c;
      if (p.k === 'star') {
        var tw = 0.75 + 0.25 * Math.sin(p.life * 22 + p.rot);
        sparkle(p.x, p.y, p.size * tw, p.rot * 0.2);
      } else if (p.k === 'rect') {
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); g.restore();
      } else {
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.lineWidth = 2.4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-p.size / 2, 0); g.bezierCurveTo(-p.size / 4, -p.size / 2, p.size / 4, p.size / 2, p.size / 2, 0); g.stroke(); g.restore();
      }
      g.globalAlpha = 1;
    }

    if (parts.length || trail.length) raf = requestAnimationFrame(frame);
    else { raf = 0; g.clearRect(0, 0, W, H); }
  }
  function run() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  /* The trail is a mouse/pen effect. Touch never makes trail particles, and the thread and
     sparkles stop the moment the pointer leaves the window, the tab hides or the window loses focus. */
  var inside = false;
  function leave() {
    inside = false; trail.length = 0; lastSpawn.x = lastSpawn.y = -999;
    for (var i = 0; i < parts.length; i++) {          // let the last few sparkles fade out fast
      var p = parts[i];
      if (p.trail) p.max = Math.min(p.max, p.life + 0.18);
    }
    if (parts.length) run();                           // otherwise nothing is left and the loop is already idle
  }
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch' || reduce.matches || document.body.classList.contains('is-splash')) return;
    inside = true;
    trail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (trail.length > 40) trail.shift();
    var dx = e.clientX - lastSpawn.x, dy = e.clientY - lastSpawn.y;
    if (dx * dx + dy * dy > 150) {
      spawn(e.clientX, e.clientY, 'trail');
      lastSpawn.x = e.clientX; lastSpawn.y = e.clientY;
    }
    run();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', leave, { passive: true });
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) leave(); }, { passive: true });
  window.addEventListener('blur', leave);
  document.addEventListener('visibilitychange', function () { if (document.hidden) leave(); });
  window.addEventListener('pagehide', leave);

  // A tiny puff on every mouse click (taps on touch screens stay quiet).
  window.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch' || document.body.classList.contains('is-splash')) return;
    burst(e.clientX, e.clientY, 'stars', 6, { speed: 110 });
  }, { passive: true });

  K.dust = { burst: burst };
})();
