/* Kiki's sound: everything is synthesized with the Web Audio API (no audio files).
   - a generative music-box lullaby that never loops exactly
   - night crickets / day birdsong
   - small effects for clicks, giggles, sneezes and chimes
   One master gain handles mute, and the choice is remembered. */
(function () {
  'use strict';
  var K = (window.Kiki = window.Kiki || {});
  var KEY = 'kiki-sound';

  var ctx = null, master = null, bus = null, amb = null;
  var muted = false, started = false, theme = 'day';
  var musicTimer = 0, ambTimer = 0, nextT = 0, step = 0, deg = 5;
  var listeners = [];

  var PENTA = [0, 2, 4, 7, 9]; // C major pentatonic: every note sounds gentle together
  function semis(d) { var o = Math.floor(d / 5), i = ((d % 5) + 5) % 5; return PENTA[i] + 12 * o; }
  function freq(s) { return 261.63 * Math.pow(2, s / 12); }
  function degFreq(d) { return freq(semis(d)); }

  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function load() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);

    // Instruments go through a soft echo so single notes feel like a music box in a big room.
    bus = ctx.createGain();
    var delay = ctx.createDelay(1); delay.delayTime.value = 0.3;
    var fb = ctx.createGain(); fb.gain.value = 0.34;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    var wet = ctx.createGain(); wet.gain.value = 0.38;
    bus.connect(master);
    bus.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(wet); wet.connect(master);

    amb = ctx.createGain(); amb.gain.value = 1; amb.connect(master);
    return ctx;
  }

  function live() { return ctx && !muted && ctx.state !== 'closed'; }

  /* ---- voices ---- */
  function bell(f, when, vel, dur) {
    var o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain();
    o1.type = 'sine'; o2.type = 'triangle';
    o1.frequency.value = f; o2.frequency.value = f * 2.01;
    g2.gain.value = 0.22;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vel, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(bus);
    o1.start(when); o2.start(when);
    o1.stop(when + dur + 0.05); o2.stop(when + dur + 0.05);
  }

  function glide(f0, f1, dur, type, vel, when, out) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, when);
    o.frequency.exponentialRampToValueAtTime(f1, when + dur);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vel, when + Math.min(0.015, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(out || bus);
    o.start(when); o.stop(when + dur + 0.05);
  }

  function noise(dur) {
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource(); src.buffer = buf; return src;
  }

  /* ---- generative lullaby ---- */
  var ROOTS = [-12, -15, -17, -12]; // C, A, G, C (low)
  var CHANCE = [0.95, 0.3, 0.6, 0.45, 0.3, 0.55];
  var PULSE = 0.46;

  function scheduleMusic() {
    if (!ctx || muted) return;
    while (nextT < ctx.currentTime + 0.8) {
      var bar = Math.floor(step / 6) % 4, beat = step % 6;
      if (beat === 0) bell(freq(ROOTS[bar]), nextT, 0.13, 2.6);
      if (beat === 3 && bar % 2 === 0) bell(freq(ROOTS[bar] + 7), nextT, 0.07, 1.8);
      if (Math.random() < CHANCE[beat]) {
        var moves = [-2, -1, -1, 0, 1, 1, 2];
        deg = Math.max(1, Math.min(8, deg + moves[(Math.random() * moves.length) | 0]));
        bell(degFreq(deg), nextT, 0.1 + Math.random() * 0.04, 1.7);
      }
      nextT += PULSE; step++;
    }
  }
  function startMusic() {
    if (musicTimer || !ctx) return;
    nextT = ctx.currentTime + 0.1;
    scheduleMusic();
    musicTimer = setInterval(scheduleMusic, 250);
  }
  function stopMusic() { clearInterval(musicTimer); musicTimer = 0; }

  /* ---- ambience: crickets by night, birds by day ---- */
  function ambience() {
    clearTimeout(ambTimer);
    if (!ctx || muted) return;
    var t = ctx.currentTime + 0.03, i;
    if (theme === 'night') {
      var f = 3800 + Math.random() * 700, n = 3 + ((Math.random() * 3) | 0);
      for (i = 0; i < n; i++) {
        var w = t + i * 0.075, o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, w);
        g.gain.linearRampToValueAtTime(0.03, w + 0.014);
        g.gain.linearRampToValueAtTime(0, w + 0.055);
        o.connect(g); g.connect(amb); o.start(w); o.stop(w + 0.07);
      }
      ambTimer = setTimeout(ambience, 450 + Math.random() * 1500);
    } else {
      var b = 1700 + Math.random() * 900;
      glide(b, b * 1.45, 0.11, 'sine', 0.035, t, amb);
      glide(b * 1.45, b * 1.1, 0.12, 'sine', 0.03, t + 0.12, amb);
      if (Math.random() < 0.5) glide(b * 1.2, b * 1.6, 0.09, 'sine', 0.028, t + 0.28, amb);
      ambTimer = setTimeout(ambience, 2200 + Math.random() * 3800);
    }
  }
  function stopAmbience() { clearTimeout(ambTimer); ambTimer = 0; }

  /* ---- sound effects ---- */
  var sfx = {
    tick: function () {
      if (!live()) return;
      glide(760, 420, 0.05, 'triangle', 0.07, ctx.currentTime);
    },
    pluck: function (d) {
      if (!live()) return;
      bell(degFreq(d == null ? 5 : d), ctx.currentTime, 0.2, 1.2);
    },
    chime: function (up) {
      if (!live()) return;
      var t = ctx.currentTime, seq = up === false ? [9, 7, 4, 2] : [2, 4, 7, 9];
      for (var i = 0; i < seq.length; i++) bell(degFreq(seq[i] + 3), t + i * 0.1, 0.17, 1.4);
    },
    sparkle: function (n) {
      if (!live()) return;
      var t = ctx.currentTime;
      n = n || 7;
      for (var i = 0; i < n; i++) bell(degFreq(8 + ((Math.random() * 7) | 0)), t + i * 0.055, 0.08, 0.9);
    },
    squeak: function () {
      if (!live()) return;
      var t = ctx.currentTime;
      glide(880, 1500, 0.09, 'sine', 0.09, t);
      glide(1250, 1800, 0.1, 'sine', 0.08, t + 0.11);
    },
    giggle: function () {
      if (!live()) return;
      var t = ctx.currentTime;
      for (var i = 0; i < 4; i++) glide(1000 + (i % 2) * 260, 1300 + (i % 2) * 260, 0.07, 'sine', 0.07, t + i * 0.1);
    },
    pop: function () {
      if (!live()) return;
      glide(720, 130, 0.13, 'sine', 0.16, ctx.currentTime);
    },
    bonk: function () {
      if (!live()) return;
      glide(200, 120, 0.14, 'triangle', 0.14, ctx.currentTime);
    },
    bubble: function () {
      if (!live()) return;
      var f = 320 + Math.random() * 260;
      glide(f, f * 2, 0.07, 'sine', 0.05, ctx.currentTime);
    },
    gulp: function () {
      if (!live()) return;
      var t = ctx.currentTime;
      glide(300, 160, 0.12, 'sine', 0.12, t);
      glide(260, 140, 0.14, 'sine', 0.1, t + 0.15);
    },
    bounce: function (strength) {
      if (!live()) return;
      glide(260, 140, 0.09, 'sine', Math.min(0.14, 0.04 + (strength || 0.5) * 0.1), ctx.currentTime);
    },
    theme: function (t) {
      if (!live()) return;
      sfx.chime(t !== 'night');
    },
    sneeze: function () {
      if (!live()) return;
      var t = ctx.currentTime;
      // "ahh..." a rising breathy inhale
      var n1 = noise(0.5), bp1 = ctx.createBiquadFilter(), g1 = ctx.createGain();
      bp1.type = 'bandpass'; bp1.Q.value = 2.2;
      bp1.frequency.setValueAtTime(700, t); bp1.frequency.exponentialRampToValueAtTime(1500, t + 0.5);
      g1.gain.setValueAtTime(0.0001, t); g1.gain.exponentialRampToValueAtTime(0.16, t + 0.45); g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.52);
      n1.connect(bp1); bp1.connect(g1); g1.connect(bus); n1.start(t); n1.stop(t + 0.55);
      glide(520, 900, 0.5, 'sine', 0.05, t, bus);
      // "choo!" a short burst plus a soft thump
      var t2 = t + 0.66, n2 = noise(0.22), bp2 = ctx.createBiquadFilter(), g2 = ctx.createGain();
      bp2.type = 'bandpass'; bp2.frequency.value = 1900; bp2.Q.value = 0.8;
      g2.gain.setValueAtTime(0.0001, t2); g2.gain.exponentialRampToValueAtTime(0.28, t2 + 0.012); g2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.2);
      n2.connect(bp2); bp2.connect(g2); g2.connect(bus); n2.start(t2); n2.stop(t2 + 0.24);
      glide(230, 80, 0.16, 'sine', 0.2, t2, bus);
      // ...and the shooting stars it throws out
      for (var i = 0; i < 9; i++) bell(degFreq(7 + ((Math.random() * 8) | 0)), t2 + 0.1 + i * 0.06, 0.09, 1.0);
    }
  };

  /* ---- public API ---- */
  function setMuted(m, silent) {
    muted = !!m;
    save(muted ? 'off' : 'on');
    if (ctx) {
      master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.04);
      if (muted) { stopMusic(); stopAmbience(); }
      else { ctx.resume && ctx.resume(); startMusic(); ambience(); }
    }
    listeners.forEach(function (fn) { fn(muted); });
    if (!muted && !silent) { ensure(); sfx.chime(true); }
  }

  K.audio = {
    sfx: sfx,
    /* Called from the Enter button: browsers only allow sound after a click or tap. */
    start: function (soundOn) {
      muted = !soundOn;
      save(muted ? 'off' : 'on');
      started = true;
      var c = ensure();
      if (c) {
        if (c.resume) c.resume();
        if (!muted) { startMusic(); ambience(); setTimeout(function () { sfx.chime(true); }, 80); }
      }
      listeners.forEach(function (fn) { fn(muted); });
    },
    toggle: function () { if (!started) return; setMuted(!muted); },
    isMuted: function () { return muted; },
    savedPreference: function () { return load(); },
    onChange: function (fn) { listeners.push(fn); },
    setTheme: function (t) {
      theme = t;
      if (ctx && !muted) { stopAmbience(); ambience(); }
    }
  };

  // Save battery and stay polite: pause the whole audio graph when the tab is hidden.
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) { if (ctx.suspend) ctx.suspend(); }
    else if (!muted && ctx.resume) ctx.resume();
  });

  // Soft click sound on every button and link. Anything with data-silent plays its own sound instead.
  document.addEventListener('pointerdown', function (e) {
    var el = e.target.closest && e.target.closest('button, a, .chip, [role="switch"]');
    if (!el || el.hasAttribute('data-silent') || el.disabled) return;
    sfx.tick();
  });
})();
