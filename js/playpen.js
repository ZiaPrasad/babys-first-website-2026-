/* Playtime: drag the yarn ball, Kiki chases it. A small physics loop that only runs while the pen is on screen.
   Mouse, touch and keyboard all work. After three pounces with nobody playing, Kiki dozes off. */
(function () {
  'use strict';
  var K = (window.Kiki = window.Kiki || {});
  var $ = function (id) { return document.getElementById(id); };
  var pen = $('pen'), ball = $('pen-ball'), kiki = $('pen-kiki'), thread = $('pen-thread-path'), zzz = $('pen-zzz');
  if (!pen) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var BALL = 54, KW = 112, FLOOR = 26, GRAV = 1900, GAP = 78, SPEED = 190;
  var W = 0, H = 0, floorY = 0, raf = 0, last = 0, visible = false, ready = false;
  var s = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, held: false, ox: 0, oy: 0 };
  var k = { x: 0, dir: 1, walking: false, cool: 0.8, pounces: 0 };
  var hist = [];

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function measure() {
    W = pen.clientWidth; H = pen.clientHeight;
    if (!W || !H) return;
    floorY = H - FLOOR - BALL + 8;
    if (!ready) { s.x = W * 0.66; s.y = floorY; k.x = W * 0.18; ready = true; }
    s.x = clamp(s.x, 0, W - BALL); s.y = Math.min(s.y, floorY); k.x = clamp(k.x, 0, W - KW);
    render();
  }

  function wake() {
    k.pounces = 0; k.cool = Math.max(k.cool, 0.4);
    kiki.classList.remove('is-sleepy'); zzz.classList.remove('is-on');
    if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }

  function pounce(dir) {
    k.cool = 1.7; k.pounces++;
    kiki.classList.remove('is-pounce'); void kiki.offsetWidth; kiki.classList.add('is-pounce');
    K.audio.sfx.squeak();
    s.vx = dir * 320; s.vy = -480;
    var r = pen.getBoundingClientRect();
    K.dust.burst(r.left + s.x + BALL / 2, r.top + s.y, 'stars', 6, { speed: 120 });
    if (k.pounces >= 3) {
      setTimeout(function () {
        if (k.pounces >= 3 && !s.held) { kiki.classList.add('is-sleepy'); zzz.classList.add('is-on'); }
      }, 1800);
    }
  }

  function update(dt) {
    if (!s.held) {
      s.vy += GRAV * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.y >= floorY) {
        s.y = floorY;
        if (s.vy > 180) { K.audio.sfx.bounce(Math.min(1, s.vy / 900)); s.vy = -s.vy * 0.42; } else s.vy = 0;
        s.vx *= Math.pow(0.25, dt);
        if (Math.abs(s.vx) < 4) s.vx = 0;
      }
      if (s.x < 0) { s.x = 0; s.vx = Math.abs(s.vx) * 0.5; }
      if (s.x > W - BALL) { s.x = W - BALL; s.vx = -Math.abs(s.vx) * 0.5; }
      s.rot += (s.vx * dt) / (BALL / 2) * 57.3;
    }

    var bx = s.x + BALL / 2, kx = k.x + KW / 2, d = bx - kx, ad = Math.abs(d), dir = d >= 0 ? 1 : -1;
    var moving = s.held || Math.abs(s.vx) > 30 || Math.abs(s.vy) > 80;
    k.cool = Math.max(0, k.cool - dt);
    k.walking = false;
    if (ad > GAP + 6) {
      k.x += dir * Math.min(SPEED * dt, ad - GAP); k.dir = dir; k.walking = true;
    } else if (ad < GAP - 16 && !s.held) {
      k.x -= dir * Math.min(SPEED * dt, GAP - ad); k.dir = -dir; k.walking = true;
    } else if (!moving && k.cool === 0 && k.pounces < 3 && !reduce.matches) {
      pounce(dir);
    }
    k.x = clamp(k.x, 0, W - KW);
  }

  function render() {
    ball.style.transform = 'translate(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px) rotate(' + s.rot.toFixed(1) + 'deg)';
    kiki.style.translate = k.x.toFixed(1) + 'px 0';
    kiki.classList.toggle('is-walk', k.walking && !reduce.matches);
    kiki.style.setProperty('--tilt', (k.walking ? k.dir * 4 : 0) + 'deg');
    zzz.style.translate = (k.x + KW - 8).toFixed(1) + 'px 0';
    // the thread sags between a peg at the left edge and the ball
    var ax = 8, ay = H - FLOOR + 4, bx = s.x + BALL / 2, by = s.y + BALL / 2;
    var sag = clamp(46 - Math.abs(bx - ax) * 0.04, 10, 46);
    thread.setAttribute('d', 'M' + ax + ' ' + ay + ' Q' + ((ax + bx) / 2) + ' ' + (Math.max(ay, by) + sag) + ' ' + bx + ' ' + by);
  }

  function frame(ts) {
    raf = 0;
    var dt = Math.min(0.04, (ts - last) / 1000 || 0.016); last = ts;
    update(dt); render();
    if (visible) raf = requestAnimationFrame(frame);
  }

  /* ---- input ---- */
  function point(e) { var r = pen.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

  ball.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    try { ball.setPointerCapture(e.pointerId); } catch (err) {}
    var p = point(e);
    s.held = true; s.ox = p.x - s.x; s.oy = p.y - s.y; s.vx = 0; s.vy = 0; hist = [];
    ball.classList.add('is-held'); wake(); K.audio.sfx.pluck(7);
  });
  ball.addEventListener('pointermove', function (e) {
    if (!s.held) return;
    var p = point(e);
    s.x = clamp(p.x - s.ox, 0, W - BALL); s.y = clamp(p.y - s.oy, 0, floorY);
    hist.push({ x: s.x, y: s.y, t: performance.now() });
    if (hist.length > 8) hist.shift();
  });
  function release() {
    if (!s.held) return;
    s.held = false; ball.classList.remove('is-held');
    var now = performance.now(), first = null, i;
    for (i = 0; i < hist.length; i++) { if (now - hist[i].t < 110) { first = hist[i]; break; } }
    if (first && now - first.t > 8) {
      var dt = (now - first.t) / 1000;
      s.vx = clamp((s.x - first.x) / dt, -1400, 1400); s.vy = clamp((s.y - first.y) / dt, -1400, 1400);
    }
    K.audio.sfx.pluck(4); wake();
  }
  ball.addEventListener('pointerup', release);
  ball.addEventListener('pointercancel', release);

  ball.addEventListener('keydown', function (e) {
    var handled = true;
    if (e.key === 'ArrowLeft') s.vx = -440;
    else if (e.key === 'ArrowRight') s.vx = 440;
    else if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') s.vy = -780;
    else handled = false;
    if (handled) { e.preventDefault(); K.audio.sfx.pluck(6); wake(); }
  });

  // Tap or click the floor: the ball hops toward that spot.
  pen.addEventListener('click', function (e) {
    if (e.target.closest('.pen__ball')) return;
    var p = point(e);
    s.vx = clamp((p.x - (s.x + BALL / 2)) * 2.2, -900, 900); s.vy = -400;
    K.audio.sfx.pluck(3); wake();
  });

  /* ---- run only while visible ---- */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) { measure(); if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0.05 }).observe(pen);
  } else { visible = true; measure(); raf = requestAnimationFrame(frame); }

  window.addEventListener('resize', measure);
  measure();
})();
