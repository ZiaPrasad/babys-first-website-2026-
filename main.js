/* Kiki's Loom Room: vanilla JS, no dependencies */
(() => {
'use strict';

// ---------- config ----------
const CONFIG = {
  // Optional: paste a Formspree/Basin/etc. endpoint here to receive "Starlight Weave" requests.
  formEndpoint: ''
};

// ---------- helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k, d) { try { const v = localStorage.getItem('kiki.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('kiki.' + k, JSON.stringify(v)); } catch { /* private mode */ } }
};
const root = document.documentElement;

// ---------- toast / bubble ----------
let toastT;
function toast(msg, ms = 3200) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, ms);
}
let bubbleT;
function say(msg, ms = 2600) {
  const b = $('#bubble'); b.textContent = msg; b.hidden = false;
  clearTimeout(bubbleT); bubbleT = setTimeout(() => { b.hidden = true; }, ms);
}

// ---------- odometer ----------
const ODO_DIGITS = 6;
let threads = store.get('threads', 0);
function buildOdo() {
  const o = $('#odo'); o.textContent = '';
  for (let i = 0; i < ODO_DIGITS; i++) {
    const d = document.createElement('div'); d.className = 'd';
    const col = document.createElement('i');
    for (let n = 0; n < 10; n++) { const b = document.createElement('b'); b.textContent = n; col.appendChild(b); }
    d.appendChild(col); o.appendChild(d);
  }
  renderOdo();
}
function renderOdo() {
  const s = String(clamp(threads, 0, 10 ** ODO_DIGITS - 1)).padStart(ODO_DIGITS, '0');
  $$('#odo .d i').forEach((col, i) => { col.style.transform = `translateY(${-36 * Number(s[i])}px)`; });
  $('#odo').setAttribute('aria-label', `Threads woven: ${threads}`);
}
function bump(n = 1) { threads += n; store.set('threads', threads); renderOdo(); }

// ---------- audio (Web Audio synth, muted by default) ----------
const sound = { on: false, ctx: null, master: null, timers: [] };
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
function ensureCtx() {
  if (sound.ctx) return sound.ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  sound.ctx = new AC();
  sound.master = sound.ctx.createGain(); sound.master.gain.value = .8;
  sound.master.connect(sound.ctx.destination);
  return sound.ctx;
}
function tone(freq, { dur = .9, gain = .08, type = 'triangle', delay = 0 } = {}) {
  if (!sound.on || !sound.ctx) return;
  const t = sound.ctx.currentTime + delay;
  const o = sound.ctx.createOscillator(), g = sound.ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .015);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(sound.master); o.start(t); o.stop(t + dur + .05);
}
const chime = () => tone(pick(SCALE), { dur: .7, gain: .07 });
const sparkleSound = () => [0, .09, .18, .27].forEach((d, i) => tone(SCALE[i + 2], { dur: .6, gain: .06, delay: d }));
function cricket() {
  if (!sound.on) return;
  for (let i = 0; i < 3; i++) tone(4300, { dur: .06, gain: .012, type: 'sine', delay: i * .09 });
}
let noteIdx = 2;
function lullabyNote() {
  noteIdx = clamp(noteIdx + pick([-2, -1, -1, 1, 1, 2]), 0, SCALE.length - 1);
  tone(SCALE[noteIdx] / 2, { dur: 1.6, gain: .05 });
}
function startAmbient() {
  stopAmbient();
  sound.timers.push(setInterval(cricket, 1700), setInterval(lullabyNote, 2100));
}
function stopAmbient() { sound.timers.forEach(clearInterval); sound.timers = []; }
function setSound(on) {
  if (on && !ensureCtx()) { toast('Sound is not supported in this browser.'); return; }
  sound.on = on;
  if (on) { sound.ctx.resume(); startAmbient(); chime(); } else stopAmbient();
  const b = $('#soundBtn');
  b.setAttribute('aria-pressed', String(on));
  b.setAttribute('aria-label', on ? 'Sound is on. Turn sound off' : 'Sound is off. Turn sound on');
  $('span', b).textContent = on ? '🔊' : '🔇';
  const v = $('#vSneeze'); if (v) v.muted = !on;
}
$('#soundBtn').addEventListener('click', () => setSound(!sound.on));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopAmbient(); else if (sound.on) startAmbient();
});
// click sounds on buttons
document.addEventListener('click', e => {
  if (e.target.closest('.btn,.chip,.tbtn,.pt')) chime();
});

// ---------- FX canvas: sparkle trail + confetti ----------
const cv = $('#fx'), cx = cv.getContext('2d');
let parts = [], fxRun = false, W = 0, H = 0;
function sizeFx() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
sizeFx(); addEventListener('resize', sizeFx);
function thread(x, y, len, rot, w) {
  const dx = Math.cos(rot), dy = Math.sin(rot);
  cx.lineWidth = w; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(x, y);
  cx.quadraticCurveTo(x + dx * len * .5 - dy * len * .35, y + dy * len * .5 + dx * len * .35, x + dx * len, y + dy * len);
  cx.stroke();
}
function shardShape(x, y, p) {
  cx.beginPath();
  p.poly.forEach((q, i) => { const px = x + Math.cos(q[0] + p.rot) * q[1] * p.r, py = y + Math.sin(q[0] + p.rot) * q[1] * p.r; i ? cx.lineTo(px, py) : cx.moveTo(px, py); });
  cx.closePath(); cx.fill();
}
function spawn(x, y, kind) {
  if (kind === 'trail') parts.push({ x, y, vx: rand(-.4, .4), vy: rand(.2, .9), life: 1, decay: rand(.018, .03), r: rand(4, 8), rot: rand(0, 6.28), c: pick(['#ffe27a', '#f2c14e', '#fff3b0', '#c9bdf0', '#f4b9c8']), k: 'thread', knot: Math.random() < .35 });
  else parts.push({ x, y, vx: rand(-5, 5), vy: rand(-8, -1), g: .22, life: 1, decay: rand(.008, .014), r: rand(5, 9), rot: rand(0, 6.28), vr: rand(-.2, .2), c: pick(['#a99ad6', '#f4b9c8', '#ffe27a', '#c9bdf0', '#9be3c6']), k: kind === 'yarn' ? 'yarn' : pick(['thread', 'thread', 'shard', 'knot']), knot: Math.random() < .5,
    poly: [0, 1, 2, 3, 4].map(i => [i * 1.26 + rand(-.3, .3), rand(.6, 1.2)]) });
  if (!fxRun) { fxRun = true; requestAnimationFrame(tick); }
}
function burst(x, y, n = 36, kind = 'conf') { if (reduceMotion) n = Math.min(n, 8); for (let i = 0; i < n; i++) spawn(x, y, kind); }
function tick() {
  cx.clearRect(0, 0, W, H);
  parts = parts.filter(p => p.life > 0 && p.y < H + 20);
  for (const p of parts) {
    p.x += p.vx; p.y += p.vy; if (p.g) p.vy += p.g; p.life -= p.decay; p.rot += p.vr || .03;
    cx.globalAlpha = clamp(p.life, 0, 1); cx.fillStyle = p.c; cx.strokeStyle = p.c;
    if (p.k === 'thread') { thread(p.x, p.y, p.r * 2.4, p.rot, 2); if (p.knot) { cx.beginPath(); cx.arc(p.x, p.y, 1.8, 0, 6.3); cx.fill(); } }
    else if (p.k === 'yarn') { cx.lineWidth = 2; cx.beginPath(); cx.arc(p.x, p.y, p.r, p.rot, p.rot + 4); cx.stroke(); }
    else if (p.k === 'shard') shardShape(p.x, p.y, p);
    else { cx.lineWidth = 2; cx.beginPath(); cx.arc(p.x, p.y, p.r * .38, 0, 6.3); cx.stroke(); cx.beginPath(); cx.arc(p.x, p.y, 1.2, 0, 6.3); cx.fill(); }
  }
  cx.globalAlpha = 1;
  if (parts.length) requestAnimationFrame(tick); else { fxRun = false; cx.clearRect(0, 0, W, H); }
}
let lastTrail = 0;
function trail(e) {
  if (reduceMotion) return;
  const now = performance.now(); if (now - lastTrail < 28) return; lastTrail = now;
  spawn(e.clientX, e.clientY, 'trail');
}
addEventListener('pointermove', trail, { passive: true });

// ---------- theme ----------
function setTheme(t, silent) {
  root.dataset.theme = t;
  store.set('theme', t);
  const b = $('#themeBtn'), night = t === 'night';
  b.setAttribute('aria-pressed', String(night));
  b.setAttribute('aria-label', night ? 'Switch to day mode' : 'Switch to night mode');
  $('span', b).textContent = night ? '☕' : '🕯️';
  $('meta[name=theme-color]').setAttribute('content', night ? '#1c1a3d' : '#efe6cf');
  $('#status').textContent = night ? 'Kiki is sleepy… and weaving ~' : 'Kiki is awake ~';
  if (!silent) { say(night ? 'Ooh, the stars are out…' : 'Good morning! Tea time.'); burst(innerWidth / 2, 120, 14, 'trail'); sparkleSound(); }
}
$('#themeBtn').addEventListener('click', () => setTheme(root.dataset.theme === 'day' ? 'night' : 'day'));
{
  const saved = store.get('theme', null), h = new Date().getHours();
  setTheme(saved || (h >= 19 || h < 6 ? 'night' : 'day'), true);
}

// ---------- visitor memory + greeting ----------
const mem = Object.assign({ name: '', visits: 0, last: 0, egg: false }, store.get('mem', {}));
const prevVisit = mem.last;
mem.visits += 1; mem.last = Date.now(); store.set('mem', mem);
function ago(ms) {
  const m = ms / 6e4;
  if (m < 2) return 'just a moment';
  if (m < 60) return `${Math.round(m)} minutes`;
  const h = m / 60; if (h < 36) return `${Math.round(h)} hour${Math.round(h) === 1 ? '' : 's'}`;
  const d = Math.round(h / 24); return `${d} day${d === 1 ? '' : 's'}`;
}
function greeting() {
  const n = mem.name;
  if (mem.visits <= 1) return "Oh! A visitor! I'm Kiki. What should I call you? Tell me in the chat 💬";
  const gap = ago(Date.now() - prevVisit);
  const lines = [
    `Welcome back${n ? ', ' + n : ''}! It's been ${gap}. I finished a new quilt while you were away.`,
    `${n ? n + '! ' : ''}You came back! That's visit number ${mem.visits}. My scarf is extra fluffy today.`,
    `Hello again${n ? ', ' + n : ''}. I saved you the warm corner of the loom.`
  ];
  return lines[mem.visits % lines.length] + (mem.egg ? ' (I remember you found my scarf secret ~)' : '');
}
$('#greet').textContent = greeting();

// ---------- hero: cursor reaction, wink, scarf easter egg ----------
const stage = $('#stage'), tilt = $('#tilt');
let tiltRaf = 0, tx = 0, ty = 0;
function onMove(e) {
  const r = stage.getBoundingClientRect();
  tx = clamp((e.clientX - (r.left + r.width / 2)) / (innerWidth / 2), -1, 1);
  ty = clamp((e.clientY - (r.top + r.height / 2)) / (innerHeight / 2), -1, 1);
  if (!tiltRaf) tiltRaf = requestAnimationFrame(() => { tiltRaf = 0; tilt.style.setProperty('--rx', tx.toFixed(2)); tilt.style.setProperty('--ry', ty.toFixed(2)); });
}
if (!reduceMotion) addEventListener('pointermove', onMove, { passive: true });
const vIdle = $('#vIdle'), vWink = $('#vWink'), vSneeze = $('#vSneeze');
function playOver(v) {
  v.currentTime = 0; v.classList.add('show');
  const done = () => { v.classList.remove('show'); v.removeEventListener('ended', done); };
  v.addEventListener('ended', done);
  v.play().catch(() => v.classList.remove('show'));
}
stage.addEventListener('pointerdown', e => {
  if (e.target.closest('#scarf')) return;
  const r = stage.getBoundingClientRect(); tilt.style.setProperty('--rx', ((e.clientX - r.left) / r.width * 2 - 1).toFixed(2));
  if (root.dataset.theme === 'day') playOver(vWink); else say('*sleepy blink*');
  if (root.dataset.theme === 'day') say(pick(['Hehe, hi!', '*wink*', 'You found me!']));
  burst(e.clientX, e.clientY, 8, 'trail'); bump();
});
let scarfN = 0, scarfT;
const scarfLines = ['Is my thread coming loose?', 'That tickles!'];
$('#scarf').addEventListener('click', e => {
  e.stopPropagation();
  clearTimeout(scarfT); scarfT = setTimeout(() => { scarfN = 0; }, 5000);
  scarfN++; bump();
  if (scarfN < 3) { say(scarfLines[scarfN - 1], 2200); burst(e.clientX, e.clientY, 6, 'trail'); return; }
  scarfN = 0;
  say('Achoo! ✨ The giant star knot came undone!', 4200);
  if (root.dataset.theme === 'day') playOver(vSneeze); else stage.classList.add('curl');
  setTimeout(() => stage.classList.remove('curl'), 900);
  const r = stage.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height * .45, 70, 'conf');
  burst(r.left + r.width / 2, r.top + r.height * .5, 14, 'yarn');
  sparkleSound(); bump(5);
  toast('🎉 You found Kiki\'s secret! Threads +5');
  if (!mem.egg) { mem.egg = true; store.set('mem', mem); }
  $('#status').textContent = 'Kiki sneezed a star ~';
});

// ---------- story scroll ----------
{
  const track = $('#track'), scenes = $$('.scene-frame .scene'), caps = $$('#caps .cap'), dots = $$('#sdots i');
  let cur = -1, raf = 0;
  function update() {
    raf = 0;
    const r = track.getBoundingClientRect();
    const span = Math.max(1, r.height - innerHeight * .8);
    const p = clamp(-r.top / span, 0, .9999);
    const i = Math.floor(p * scenes.length);
    if (i === cur) return; cur = i;
    scenes.forEach((s, k) => s.classList.toggle('on', k === i));
    caps.forEach((s, k) => s.classList.toggle('on', k === i));
    dots.forEach((s, k) => s.classList.toggle('on', k === i));
    $('#scrollhint').style.visibility = i === 0 ? 'visible' : 'hidden';
  }
  const req = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); update();
}

// ---------- project 1: blanket loom ----------
{
  const grid = $('#loomGrid'), msg = $('#loomMsg');
  const COLORS = { calm: '#59c3e0', dreamy: '#c78bf2', snug: '#ff9d5c' };
  let mood = 'calm', n = 0;
  grid.setAttribute('role', 'group');
  for (let i = 0; i < 48; i++) {
    const b = document.createElement('button'); b.type = 'button';
    b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', `Square ${i + 1}`);
    grid.appendChild(b);
  }
  const upd = () => {
    msg.textContent = n >= 24 ? `A ${mood} blanket! Kiki approves ~` : `${n} thread${n === 1 ? '' : 's'} woven`;
  };
  grid.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const on = !b.classList.contains('on');
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    b.style.setProperty('--c', COLORS[mood]);
    n += on ? 1 : -1; if (on) bump();
    if (n === 24 && on) { sparkleSound(); toast('Kiki: "That one is perfect for rainy-day naps."'); }
    upd();
  });
  $$('.moods .chip').forEach(c => c.addEventListener('click', () => {
    mood = c.dataset.mood;
    $$('.moods .chip').forEach(x => x.classList.toggle('on', x === c));
    $$('#loomGrid .on').forEach(b => b.style.setProperty('--c', COLORS[mood]));
    upd();
  }));
  $('#loomClear').addEventListener('click', () => {
    $$('#loomGrid button').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
    n = 0; upd();
  });
}

// ---------- project 2: stitch the Sky Needle (constellation) ----------
{
  const NS = 'http://www.w3.org/2000/svg';
  const pts = $('#cdPts'), lines = $('#cdLines'), msg = $('#cdMsg'), svg = $('#cdSvg');
  const BASE = [[36, 182], [92, 130], [146, 80], [196, 36], [214, 106], [150, 152]];
  const N = BASE.length;
  let next = 1, coords = [];
  function mk(tag, attrs) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function line(a, b) { lines.appendChild(mk('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1] })); }
  function reset() {
    pts.textContent = ''; lines.textContent = ''; next = 1;
    const flip = Math.random() < .5;
    coords = BASE.map(c => [(flip ? 240 - c[0] : c[0]) + rand(-5, 5), c[1] + rand(-5, 5)]);
    coords.forEach((c, i) => {
      const g = mk('g', { class: 'pt', tabindex: '0', role: 'button', 'aria-label': `Dot ${i + 1}`, transform: `translate(${c[0].toFixed(1)} ${c[1].toFixed(1)})` });
      g.appendChild(mk('circle', { r: 13, fill: '#c9bdf0' }));
      const t = mk('text', { 'text-anchor': 'middle', y: 4 }); t.textContent = i + 1; g.appendChild(t);
      const hit = () => tap(i, g);
      g.addEventListener('click', hit);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hit(); } });
      pts.appendChild(g);
    });
    msg.textContent = 'Start at dot 1';
  }
  function tap(i, g) {
    if (next > N) return;
    if (i + 1 !== next) { g.classList.remove('shake'); void g.getBoundingClientRect(); g.classList.add('shake'); msg.textContent = `Not that one. Try dot ${next}`; return; }
    g.classList.add('done'); bump();
    if (next > 1) line(coords[next - 2], coords[i]);
    if (next === N) {
      const [x, y] = coords[N - 1];
      lines.appendChild(mk('path', { d: `M${x} ${y} q16 14 4 28 q-12 10 -22 0`, stroke: '#c9bdf0', 'stroke-dasharray': '0' }));
      msg.textContent = 'The Sky Needle! Kiki stitched it into the night ~'; sparkleSound();
      toast('~ Constellation complete: "The Sky Needle"');
      const r = svg.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 30, 'trail');
    } else msg.textContent = `Nice. Now dot ${next + 1}`;
    next++;
  }
  $('#cdReset').addEventListener('click', reset);
  reset();
}

// ---------- project 3: star-tea steeper ----------
{
  let honey = 0, dust = 0, steeping = false;
  const msg = $('#teaMsg'), top = $('#teaTop'), fill = $('#steepFill'), steam = $('#steam'), dustG = $('#dust');
  const NS = 'http://www.w3.org/2000/svg';
  const tint = () => {
    const t = clamp(honey / 5, 0, 1), s = clamp(dust / 5, 0, 1);
    top.setAttribute('fill', honey + dust === 0 ? '#e8dff7' : `rgb(${Math.round(197 + 40 * t - 30 * s)},${Math.round(143 + 40 * t)},${Math.round(90 + 90 * s)})`);
  };
  function add(kind) {
    if (steeping) return;
    if (kind === 'h') honey = Math.min(5, honey + 1); else {
      dust = Math.min(5, dust + 1);
      const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', rand(85, 155)); c.setAttribute('cy', rand(74, 118)); c.setAttribute('r', 2); c.setAttribute('fill', '#fff3b0'); dustG.appendChild(c);
    }
    $('#nHoney').textContent = honey; $('#nDust').textContent = dust; tint(); bump();
    msg.textContent = 'Ready when you are. Press Steep.';
  }
  $('#addHoney').addEventListener('click', () => add('h'));
  $('#addDust').addEventListener('click', () => add('d'));
  $('#steep').addEventListener('click', () => {
    if (steeping) return;
    if (honey + dust === 0) { msg.textContent = 'Just warm water? Kiki is polite about it. Try adding something.'; return; }
    steeping = true; msg.textContent = 'Steeping… 🫖'; steam.classList.remove('on'); void steam.getBoundingClientRect(); steam.classList.add('on');
    const t0 = performance.now(), D = 3000;
    (function step(now) {
      const p = clamp((now - t0) / D, 0, 1); fill.style.width = (p * 100) + '%';
      if (p < 1) return requestAnimationFrame(step);
      steeping = false;
      const name = honey > dust ? 'Honey Moon Milk' : dust > honey ? 'Stardust Lullaby Tea' : 'Starlit Honey Brew';
      msg.textContent = `${name} is ready ~ Sleep tight.`; sparkleSound(); bump(2);
      const r = $('.cup').getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 40, 14, 'trail');
      honey = dust = 0; $('#nHoney').textContent = 0; $('#nDust').textContent = 0; dustG.textContent = ''; tint(); setTimeout(() => { fill.style.width = '0'; }, 1200);
    })(t0);
  });
}

// ---------- Kiki Messenger (rule-based chat) ----------
{
  const msgs = $('#msgs'), form = $('#chatForm'), input = $('#chatIn'), chips = $('#chips');
  const nm = () => mem.name || 'friend';
  const R = [
    [/\b(hi|hello|hey|hiya|yo|howdy)\b/i, () => [`Hi ${nm()}! *waves a tiny paw*`, `Oh, hello ${nm()}! You startled me a little. In a nice way.`]],
    [/(my name is|call me|i am called|name'?s)\s+([a-z][a-z'-]{0,20})/i, (m) => { mem.name = m[2][0].toUpperCase() + m[2].slice(1); store.set('mem', mem); return [`${mem.name}! That's a lovely name. I'll stitch it into my memory-thread.`]; }],
    [/what do you (do|make|weave)|your (job|work)|occupation|profession/i, () => ["I spin beam-threads from fallen stars and weave them into glowing night-blankets, so every creature in the forest feels safe when it's cold."]],
    [/where.*(live|home|work)|loom room|observatory/i, () => ["I work in the Loom Room at the top of the Observatory Tree. I sleep in a hollowed teacup lined with velvet moss. Very snug."]],
    [/scarf/i, () => ["It's spun from moonlight! It has secret pockets for spare glowing thread. Please don't tickle it… 3 times is too many. 🤭"]],
    [/sneez|achoo|spark/i, () => ["Achoo! ✨ Sorry. My sneezes come out as tiny glittery shooting stars. They're harmless, I promise."]],
    [/tea|milk|drink|honey|cup/i, () => ["Star-tea is my favourite: warm milk, one honey drop, a pinch of stardust. Try the steeper in the projects!"]],
    [/star|moon|sky|constellation/i, () => ["Fallen stars are always a little cold at first. You wrap them in yarn and they warm right up. Just like people."]],
    [/yarn|knit|thread|loom|blanket|weav/i, () => ["Blankets are woven in moods: calm, dreamy or snug. Try the Blanket Loom above. I'm very meticulous about my yarn."]],
    [/elder/i, () => ["The Elder Weaver noticed my first glowing star-yarn from her hollow in the great tree. She says my stitches are 'promising'. I blushed into a yarn ball."]],
    [/firefl|needle|bug/i, () => ["I try to catch fireflies with my tiny wooden needles. I have never caught one. They're too sparkly and I'm too giggly."]],
    [/secret|easter|hidden/i, () => ["A secret? …Maybe don't tell anyone, but my scarf has a giant star knot in it. Poke it three times. 🤫"]],
    [/colou?r|favou?rite/i, () => ["Lavender, always. Then moonlight-gold. Then the pink of a sunset cloud."]],
    [/how are you|how.*feel|you ok|you okay/i, () => [`I'm cozy, ${nm()}. Warm tea, soft yarn. How are you?`]],
    [/\b(sad|cold|lonely|scared|tired|anxious|cry|bad day)\b/i, () => [`Oh ${nm()}… come here. You can have the warm end of my scarf. Cold nights end, I promise. 🧣`]],
    [/\b(sleep|goodnight|good night|night|bed|bye|goodbye)\b/i, () => [`Goodnight ${nm()}. I'll weave you a calm one. Sweet dreams ~`, `Sleep tight, ${nm()}. The stars are on watch.`]],
    [/thank/i, () => ["You're so welcome! Thank you for visiting. It makes the Loom Room glow."]],
    [/joke|funny/i, () => ["Why did the star go to knitting class? To learn how to hang by a thread! …I'll see myself out. *rolls into a yarn ball*"]],
    [/hire|commission|custom|order|request|work with/i, () => ["Oh! A custom blanket? Tap the pink cloud button at the bottom, tell me the sleep mood and your wish, and I'll get weaving ~"]],
    [/real|robot|\bai\b|bot|human/i, () => ["I'm an invented character, made by a human with a little AI help for the pictures. The loom and the stars are all pretend, but the coziness is real."]],
    [/age|old|baby/i, () => ["I'm a baby Moon-Mouseling. Very young, very fluffy, still learning to weave straight lines."]],
    [/love|cute|adorable|sweet/i, () => ["*hides face in scarf* …thank you. Now I'm all pink. 💗"]],
    [/who are you|what are you|what'?s your name|\babout (you|yourself)\b|introduce/i, () => ["I'm Kiki, a baby Moon-Mouseling and apprentice Starlight Weaver. I live at the top of the Observatory Tree."]],
    [/help|what can i ask|\?$/i, () => ["You can ask about my loom, my scarf, my tea, my secrets, or just say goodnight. I'm shy but I like questions."]]
  ];
  const FALL = ["Hmm, I didn't quite catch that. My ears are big but my thread-of-thought slipped. Ask me about my loom?", "*tilts head* I'm still learning words. Try asking about my scarf, my tea or the stars!", "That's a lovely thought. Want to hear about my blanket loom or my secret?"];
  function add(text, who) {
    const d = document.createElement('div'); d.className = 'm ' + who; d.textContent = text; msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight; return d;
  }
  function reply(text) {
    const typing = add('Kiki is typing…', 'k t');
    setTimeout(() => {
      typing.remove();
      let out = null;
      for (const [re, fn] of R) { const m = text.match(re); if (m) { out = pick(fn(m)); break; } }
      add(out || pick(FALL), 'k'); chime();
    }, rand(500, 950));
  }
  function send(text) {
    text = text.trim().slice(0, 140); if (!text) return;
    add(text, 'u'); bump(); reply(text);
  }
  form.addEventListener('submit', e => { e.preventDefault(); send(input.value); input.value = ''; });
  ['Who are you?', 'What do you weave?', 'Tell me a secret', 'I\'m cold', 'Goodnight'].forEach(t => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = t;
    b.addEventListener('click', () => send(t)); chips.appendChild(b);
  });
  add(mem.visits > 1 && mem.name ? `Hi ${mem.name}! You're back 💜 What shall we chat about?` : "Hi! I'm Kiki. Ask me anything, or tell me your name (try “my name is …”).", 'k');
  $('#openChat').addEventListener('click', () => { $('#chat').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); setTimeout(() => input.focus({ preventScroll: true }), 600); });
}

// ---------- yarn toy + Kiki follower ----------
{
  const yarn = $('#yarn'), fol = $('#follower');
  let fx = -60, fy = innerHeight - 80, tx2 = fx, ty2 = fy, running = false, idleT, dragging = false, ox = 0, oy = 0;
  function loop() {
    fx += (tx2 - fx) * .07; fy += (ty2 - fy) * .07;
    const dx = tx2 - fx, dy = ty2 - fy;
    fol.style.transform = `translate(${fx.toFixed(1)}px,${fy.toFixed(1)}px) rotate(${(dx * .05).toFixed(1)}deg)`;
    if (Math.abs(dx) + Math.abs(dy) > .6 && !reduceMotion) requestAnimationFrame(loop); else { running = false; fol.style.transform = `translate(${tx2}px,${ty2}px)`; }
  }
  function target() {
    const r = yarn.getBoundingClientRect();
    tx2 = clamp(r.left - 56, 4, innerWidth - 56); ty2 = clamp(r.top + 2, 4, innerHeight - 56);
    fol.classList.add('on'); clearTimeout(idleT);
    idleT = setTimeout(() => { fol.classList.remove('on'); fx = -60; fy = innerHeight - 80; }, 9000);
    if (!running) { running = true; requestAnimationFrame(loop); }
  }
  yarn.addEventListener('pointerdown', e => {
    dragging = true; yarn.setPointerCapture(e.pointerId);
    const r = yarn.getBoundingClientRect(); ox = e.clientX - r.left; oy = e.clientY - r.top;
    chime();
  });
  yarn.addEventListener('pointermove', e => {
    if (!dragging) return;
    yarn.style.left = clamp(e.clientX - ox, 0, innerWidth - 56) + 'px';
    yarn.style.top = clamp(e.clientY - oy, 0, innerHeight - 56) + 'px';
    yarn.style.right = 'auto'; yarn.style.bottom = 'auto';
    target();
  });
  const end = () => { if (dragging) { dragging = false; bump(); } };
  yarn.addEventListener('pointerup', end); yarn.addEventListener('pointercancel', end);
  yarn.addEventListener('click', () => { if (!fol.classList.contains('on')) target(); });
  yarn.addEventListener('keydown', e => {
    const step = 40; let m = true; const r = yarn.getBoundingClientRect();
    if (e.key === 'ArrowLeft') yarn.style.left = clamp(r.left - step, 0, innerWidth - 56) + 'px';
    else if (e.key === 'ArrowRight') yarn.style.left = clamp(r.left + step, 0, innerWidth - 56) + 'px';
    else if (e.key === 'ArrowUp') yarn.style.top = clamp(r.top - step, 0, innerHeight - 56) + 'px';
    else if (e.key === 'ArrowDown') yarn.style.top = clamp(r.top + step, 0, innerHeight - 56) + 'px';
    else m = false;
    if (m) { e.preventDefault(); yarn.style.right = 'auto'; yarn.style.bottom = 'auto'; target(); }
  });
}

// ---------- CTA form ----------
{
  const dlg = $('#formDlg'), f = $('#wishForm'), msg = $('#formMsg');
  $('#openForm').addEventListener('click', () => {
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    $('input', f).focus();
  });
  $('#closeForm').addEventListener('click', () => dlg.close ? dlg.close() : dlg.removeAttribute('open'));
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(f));
    const wishes = store.get('wishes', []); wishes.push({ ...data, at: Date.now() }); store.set('wishes', wishes.slice(-20));
    if (!mem.name) { mem.name = String(data.name).slice(0, 24); store.set('mem', mem); }
    let sent = false;
    if (CONFIG.formEndpoint) {
      try { const r = await fetch(CONFIG.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) }); sent = r.ok; } catch { sent = false; }
    }
    msg.textContent = sent ? 'Sent! Kiki is already threading her needle ~' : 'Kiki tucked your wish into her scarf pocket (saved on this device) ~';
    burst(innerWidth / 2, innerHeight / 2, 40, 'conf'); sparkleSound(); bump(3);
    setTimeout(() => { if (dlg.close) dlg.close(); f.reset(); msg.textContent = ''; }, 2400);
  });
}

buildOdo();
// keep video playing when tab returns (some mobiles pause)
document.addEventListener('visibilitychange', () => { if (!document.hidden) vIdle.play().catch(() => {}); });
})();
