/* Kiki's Loom Room in WebGL (Three.js, loaded lazily). Low-poly, flat-shaded, a bit wonky on purpose.
   v2: a roomier composition (Kiki centre, loom behind-left, yarn in front, tea + lantern right), a damped orbit camera
   (drag, wheel, pinch, arrows, on-screen buttons), draggable yarn that Kiki chases, speech bubbles, and gentle life. */
import * as THREE from './vendor/three.module.min.js';

export function start(o) {
  var K = o.K, canvas = o.canvas, small = o.small, reduce = o.reduce;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !small, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 2));
  var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
  var M = function (c, e, ei) { return new THREE.MeshLambertMaterial({ color: c, flatShading: true, emissive: e || 0x000000, emissiveIntensity: ei || 0 }); };
  var pick = [], kick = {}, hovered = null, i;
  var HOME = new THREE.Vector3(0.1, 0, 0.35);   // where Kiki stands
  var LOOK = new THREE.Vector3(0, 1.05, -0.35); // what the camera looks at
  function named(g, n, label) { g.userData.name = n; g.userData.label = label; pick.push(g); scene.add(g); return g; }
  function hit(g, r, x, y, z) { var m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); m.position.set(x || 0, y || 0, z || 0); g.add(m); return m; }
  function noRay(sp) { sp.raycast = function () {}; return sp; }
  function canvasTex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
  function glowTex(col) { return canvasTex(64, 64, function (x) { var g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }); }
  function sprite(tex, s, op) { var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: op == null ? 1 : op, fog: false })); sp.scale.set(s, s, 1); return noRay(sp); }
  var GOLD = glowTex('rgba(255,215,120,1)'), WARM = glowTex('rgba(255,224,150,1)'), PINK = glowTex('rgba(255,190,230,1)'), WHITE = glowTex('rgba(255,255,255,.9)');

  /* ---- lights & theme: moonlight from above, warm lamp near the tea, a pink-ish pool around the yarn ---- */
  var hemi = new THREE.HemisphereLight(0xc9b8ff, 0x3a2a5a, 1.0), moonL = new THREE.DirectionalLight(0xbccaee, 0.9); moonL.position.set(-4, 8, 5);
  scene.add(hemi, moonL); scene.fog = new THREE.Fog(0x1b1438, 10, 30);
  var lamp = null, yarnLamp = null;
  if (!small) {
    lamp = new THREE.PointLight(0xffd98a, 16, 10, 1.5); lamp.position.set(3.3, 2.3, -2.2); scene.add(lamp);
    yarnLamp = new THREE.PointLight(0xffb8e4, 7, 7, 1.6); yarnLamp.position.set(1.6, 1.6, 2.0); scene.add(yarnLamp);
  }
  var night = true;
  function theme() {
    night = document.documentElement.dataset.theme === 'night';
    var bg = night ? 0x1b1438 : 0xe9dcc4; scene.background = new THREE.Color(bg); scene.fog.color.set(bg);
    hemi.intensity = night ? 0.9 : 1.5; moonL.intensity = night ? 0.85 : 0.55; if (lamp) lamp.intensity = night ? 16 : 6; if (yarnLamp) yarnLamp.intensity = night ? 7 : 2.5;
  }
  theme(); var tmo = new MutationObserver(theme); tmo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---- room shell: round plum wall with stitched stars (the near side is see-through, like a dollhouse), floor, rug ---- */
  var wallTex = canvasTex(1024, 256, function (x, w, h) {
    var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3a2c6c'); g.addColorStop(1, '#5a4896'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (var n = 0; n < 110; n++) { x.fillStyle = n % 3 ? '#f6d98a' : '#d9c8ff'; var px = Math.random() * w, py = Math.random() * h * 0.78, r = 1 + Math.random() * 2.4; x.fillRect(px, py, r, r); }
    x.strokeStyle = '#a995d8'; x.setLineDash([10, 7]); x.lineWidth = 2; x.strokeRect(0, h - 26, w, 1);
    x.strokeStyle = 'rgba(169,149,216,.35)'; x.setLineDash([4, 8]); for (var k = 0; k < w; k += 128) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, h - 26); x.stroke(); }
  });
  var wall = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 5.6, small ? 16 : 28, 1, true), new THREE.MeshBasicMaterial({ map: wallTex, side: THREE.BackSide }));
  wall.position.y = 2.8; scene.add(wall);
  var floor = new THREE.Mesh(new THREE.CircleGeometry(7, 32), M(0x5a4690)); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  var rugTex = canvasTex(256, 256, function (x, w) {
    x.fillStyle = '#d9b8ee'; x.fillRect(0, 0, w, w); [[124, '#eaa8a4'], [96, '#f6ecd2'], [68, '#a995d8'], [38, '#f0c96a']].forEach(function (r) { x.fillStyle = r[1]; x.beginPath(); x.arc(128, 128, r[0], 0, 7); x.fill(); });
    x.strokeStyle = '#3b2d63'; x.setLineDash([6, 5]); x.lineWidth = 2; [126, 100, 72].forEach(function (r) { x.beginPath(); x.arc(128, 128, r, 0, 7); x.stroke(); });
  });
  var rug = new THREE.Mesh(new THREE.CircleGeometry(4.3, 32), new THREE.MeshLambertMaterial({ map: rugTex })); rug.rotation.x = -Math.PI / 2; rug.position.y = 0.01; rug.rotation.z = 0.15; scene.add(rug);
  var pool = new THREE.Mesh(new THREE.CircleGeometry(3.4, 24), new THREE.MeshBasicMaterial({ map: WARM, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0.1, 0.03, 0.3); pool.raycast = function () {}; scene.add(pool);

  /* ---- the loom: behind-left, secondary focal point ---- */
  var woodM = M(0xc99a63), loom = new THREE.Group(), COLS = 9, ROWS = 12, woven = 3, weave = null;
  [[-1.1, 0], [1.1, 0]].forEach(function (p) { var b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 0.25), woodM); b.position.set(p[0], 1.6, 0); loom.add(b); });
  [0.35, 3.1].forEach(function (y) { var b = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 0.3), woodM); b.position.set(0, y, 0); loom.add(b); });
  var feet = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 1.1), woodM); feet.position.set(-1.1, 0.06, 0); loom.add(feet); var feet2 = feet.clone(); feet2.position.x = 1.1; loom.add(feet2);
  var pts = []; for (i = 0; i < 14; i++) { var wx = -0.95 + i * 0.146; pts.push(wx, 0.45, 0.02, wx, 3.0, 0.02); }
  var wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  var warpMat = new THREE.LineBasicMaterial({ color: 0xf6e6b0 }), warpLines = new THREE.LineSegments(wg, warpMat); loom.add(warpLines);
  var bc = document.createElement('canvas'); bc.width = COLS * 16; bc.height = ROWS * 16; var bx = bc.getContext('2d'), btex = new THREE.CanvasTexture(bc); btex.colorSpace = THREE.SRGBColorSpace;
  function mood() { var ch = document.querySelector('#loom-moods [aria-checked="true"]'), id = ch ? ch.dataset.id : 'sleepy'; return (K.moods || []).filter(function (m) { return m.id === id; })[0]; }
  var blanket = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.4), new THREE.MeshBasicMaterial({ map: btex, side: THREE.DoubleSide, transparent: true })); blanket.position.set(0, 1.55, 0.03); loom.add(blanket);
  var glowStrip = sprite(GOLD, 2.6, 0.5); glowStrip.position.set(0, 0.5, 0.2); loom.add(glowStrip);
  var shuttle = new THREE.Group(); shuttle.add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.09), M(0xf0c96a, 0xf0b040, 0.9))); var shg = sprite(GOLD, 0.9, 0.9); shuttle.add(shg); shuttle.visible = false; loom.add(shuttle);
  function paint() {
    var m = mood() || { colors: ['#a995d8', '#bccaee', '#f6ecd2', '#eaa8a4'], pattern: function (c, r) { return (c + r) % 4; } };
    bx.clearRect(0, 0, bc.width, bc.height);
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var y = ROWS - 1 - r, done = r < woven || (weave && r === woven && c < Math.floor(weave.p * COLS));
      if (!done) { bx.fillStyle = 'rgba(255,230,170,0.2)'; bx.fillRect(c * 16 + 6, y * 16 + 6, 3, 3); continue; }
      bx.fillStyle = m.colors[m.pattern(c, r)]; bx.fillRect(c * 16, y * 16, 15, 15);
    }
    btex.needsUpdate = true;
  }
  paint(); loom.position.set(-3.0, 0, -2.0); loom.rotation.y = 0.62; loom.scale.setScalar(1.12); named(loom, 'loom', "Kiki's loom"); hit(loom, 1.7, 0, 1.6, 0.3);
  var moodBox = document.getElementById('loom-moods'); if (moodBox) moodBox.addEventListener('click', function () { setTimeout(paint, 0); });

  /* ---- yarn: foreground, draggable. The first ball is the "chase" ball (lavender-pink with glowing stars). ---- */
  var yarns = [], OBST = [[-3.0, -2.0, 1.5], [2.9, -2.0, 0.75], [-2.3, 1.7, 0.5]];
  var YD = [{ c: '#d6a8ec', r: 0.62, p: [2.0, 1.75], stars: true }, { c: '#eaa8a4', r: 0.42, p: [3.15, 0.45] }, { c: '#f0c96a', r: 0.32, p: [0.55, 3.0] }];
  YD.forEach(function (d) {
    var t = canvasTex(128, 128, function (x, w) {
      x.fillStyle = d.c; x.fillRect(0, 0, w, w); x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 5; for (var n = -128; n < 256; n += 16) { x.beginPath(); x.moveTo(n, 0); x.lineTo(n + 128, 128); x.stroke(); }
      x.strokeStyle = 'rgba(80,50,130,.22)'; x.lineWidth = 3; for (n = -128; n < 256; n += 16) { x.beginPath(); x.moveTo(n + 8, 0); x.lineTo(n + 136, 128); x.stroke(); }
      if (d.stars) { x.fillStyle = '#fff1a8'; for (n = 0; n < 7; n++) { var px = 14 + (n * 37) % 100, py = 12 + (n * 53) % 100; x.beginPath(); for (var q = 0; q < 10; q++) { var a = q * Math.PI / 5 - Math.PI / 2, rr = q % 2 ? 4 : 9; x[q ? 'lineTo' : 'moveTo'](px + Math.cos(a) * rr, py + Math.sin(a) * rr); } x.fill(); } }
    });
    var g = new THREE.Group(), s = new THREE.Mesh(new THREE.SphereGeometry(d.r, 10, 8), new THREE.MeshLambertMaterial({ map: t, flatShading: true, emissive: d.stars ? 0xd070c0 : new THREE.Color(d.c), emissiveIntensity: d.stars ? 0.3 : 0.22 }));
    s.position.y = d.r; g.add(s); g.userData.ball = s; g.userData.r = d.r;
    if (d.stars) { var yg = sprite(PINK, d.r * 4.2, 0.45); yg.position.y = d.r; g.add(yg); g.userData.gl = yg; }
    g.position.set(d.p[0], 0, d.p[1]); g.userData.home = g.position.clone(); g.userData.vx = 0; g.userData.vz = 0; g.userData.vy = 0; g.userData.held = false;
    hit(g, d.r * 1.35, 0, d.r, 0); yarns.push(g); named(g, 'yarn', 'A ball of yarn');
  });
  var activeY = yarns[0];

  /* the glowing thread from the yarn back to Kiki (rebuilt each frame; cheap) */
  var TN = 22, tpos = new Float32Array(TN * 3), tgeo = new THREE.BufferGeometry(); tgeo.setAttribute('position', new THREE.BufferAttribute(tpos, 3));
  var tline = new THREE.Line(tgeo, new THREE.LineBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.95, fog: false })); tline.frustumCulled = false; tline.raycast = function () {}; scene.add(tline);
  var tbeads = new THREE.Points(tgeo, new THREE.PointsMaterial({ map: GOLD, size: small ? 0.5 : 0.42, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); tbeads.frustumCulled = false; tbeads.raycast = function () {}; scene.add(tbeads);
  var tA = new THREE.Vector3(), tB = new THREE.Vector3();
  function threadUpdate(t) {
    var y = activeY.position, sag = 0.2 + Math.min(0.5, tA.set(y.x - kikiG.position.x, 0, y.z - kikiG.position.z).length() * 0.12);
    tA.set(kikiG.position.x + 0.35, 0.55 + kikiG.position.y, kikiG.position.z + 0.15); tB.set(y.x, y.y + activeY.userData.r, y.z);
    for (var n = 0; n < TN; n++) { var u = n / (TN - 1); tpos[n * 3] = tA.x + (tB.x - tA.x) * u; tpos[n * 3 + 1] = tA.y + (tB.y - tA.y) * u - Math.sin(u * Math.PI) * sag * (0.9 + (reduce ? 0 : Math.sin(t * 2 + u * 5) * 0.12)); tpos[n * 3 + 2] = tA.z + (tB.z - tA.z) * u; }
    tgeo.attributes.position.needsUpdate = true;
  }

  /* ---- needles in a pin-ball: low, front-left ---- */
  var nd = new THREE.Group(), nb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), M(0xd98f9a)); nb.position.y = 0.3; nd.add(nb);
  [0.35, -0.35].forEach(function (a) { var n = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.7, 5), M(0xe8cfa0)); n.position.y = 0.98; n.rotation.z = a; nd.add(n); var k = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), M(0xf0c96a)); k.position.set(-Math.sin(a) * 0.85, 0.98 + Math.cos(a) * 0.85, 0); nd.add(k); });
  nd.position.set(-2.3, 0, 1.7); named(nd, 'needles', 'Tiny needles'); hit(nd, 0.9, 0, 0.8, 0);

  /* ---- fallen stars: spread out as atmosphere ---- */
  var sh = new THREE.Shape(); for (i = 0; i < 10; i++) { var a = i * Math.PI / 5 + Math.PI / 2, r = i % 2 ? 0.17 : 0.4; sh[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } sh.closePath();
  var starGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: false }), stars = [];
  [[1.1, 0.2, -1.5, 0.5], [-1.5, 0.14, -0.7, 0.36], [-3.9, 0.16, 0.9, 0.42]].forEach(function (d, n) {
    var g = new THREE.Group(), st = new THREE.Mesh(starGeo, M(0xf6d98a, 0xf0b040, 0.9)); st.scale.setScalar(d[3] / 0.4 * 1.1); g.add(st);
    var gl = sprite(GOLD, 1.9, 0.8); g.add(gl); g.userData.gl = gl; g.userData.st = st; g.userData.base = 1.9;
    g.position.set(d[0], d[1] + 0.12, d[2]); g.rotation.set(-1.2, 0, n); stars.push(g); named(g, 'star', 'A fallen star'); hit(g, 0.65, 0, 0, 0.05);
  });

  /* ---- star-tea on a little stool: back-right ---- */
  var stool = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.52, 0.78, 8), M(0xc99a63)); stool.position.set(2.9, 0.39, -2.0); scene.add(stool);
  var cup = new THREE.Group(), prof = [[0, 0], [0.32, 0], [0.44, 0.1], [0.5, 0.4], [0.5, 0.48]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
  var cm = new THREE.Mesh(new THREE.LatheGeometry(prof, 12), new THREE.MeshLambertMaterial({ color: 0xf6ecd2, flatShading: true, side: THREE.DoubleSide })); cup.add(cm);
  var tea = new THREE.Mesh(new THREE.CircleGeometry(0.46, 12), new THREE.MeshBasicMaterial({ color: 0xe8b86a })); tea.rotation.x = -Math.PI / 2; tea.position.y = 0.4; cup.add(tea);
  var handle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 5, 8), M(0xf6ecd2)); handle.position.set(0.55, 0.26, 0); cup.add(handle);
  var saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.62, 0.05, 10), M(0xbccaee)); saucer.position.y = 0.0; cup.add(saucer);
  var steam = []; for (i = 0; i < 3; i++) { var sp = sprite(WHITE, 0.55, 0); sp.userData.o = i / 3; steam.push(sp); cup.add(sp); }
  cup.position.set(2.9, 0.8, -2.0); hit(cup, 0.8, 0.1, 0.4, 0); named(cup, 'tea', 'A cup of star-tea');

  /* ---- Kiki: the real cut-out artwork as a billboard, centre of the rug, with a soft halo ---- */
  var kikiG = new THREE.Group(), kikiSp = null, KH = 2.5, kAsp = 0.83, kt = { wob: 0, hop: 0, x: HOME.x, z: HOME.z, state: 'home', t: 0, lastPull: -99, said: 0 };
  var halo = sprite(WARM, 4.6, 0.26); halo.position.y = 1.25; kikiG.add(halo);
  new THREE.TextureLoader().load('assets/kiki.png', function (t) {
    t.colorSpace = THREE.SRGBColorSpace; kAsp = t.image.width / t.image.height;
    kikiSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, alphaTest: 0.05 })); kikiSp.scale.set(KH * kAsp, KH, 1); kikiSp.position.y = KH / 2; noRay(kikiSp); kikiG.add(kikiSp);
  });
  var shadow = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16), new THREE.MeshBasicMaterial({ color: 0x1b1438, transparent: true, opacity: 0.4, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.025; shadow.raycast = function () {}; kikiG.add(shadow);
  kikiG.position.copy(HOME); named(kikiG, 'kiki', 'Kiki'); hit(kikiG, 0.95, 0, 1.15, 0);

  /* ---- hanging lantern (back-right) and hanging moon (back-centre): both swing from the wall top ---- */
  var lantP = new THREE.Group(), lant = new THREE.Group();
  var lb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe3a0 })); lant.add(lb);
  var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.3, 0.14, 8), M(0xc99a63)); cap.position.y = 0.34; lant.add(cap);
  var lglow = sprite(WARM, 2.4, 0.7); lant.add(lglow);
  var chain = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.7, 4), new THREE.MeshBasicMaterial({ color: 0xbbaadd })); chain.position.y = 1.7; lant.add(chain); lant.position.y = -2.9; lantP.add(lant);
  lantP.position.set(3.7, 5.4, -2.7); hit(lantP, 0.65, 0, -2.9, 0); named(lantP, 'lantern', "Kiki's lantern");
  var moonP = new THREE.Group(), moon = new THREE.Group();
  var crescent = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.15, 5, 16, 4.2), M(0xf6ecd2, 0xf6ecd2, 0.7)); crescent.rotation.z = 0.9; moon.add(crescent);
  var mglow = sprite(WARM, 3.2, 0.4); moon.add(mglow);
  var mstr = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.9, 4), new THREE.MeshBasicMaterial({ color: 0xbbaadd })); mstr.position.y = 0.95; moon.add(mstr);
  moon.position.y = -2.1; moonP.add(moon); moonP.position.set(0.3, 5.4, -4.6); hit(moonP, 0.95, 0, -2.1, 0); named(moonP, 'moon', 'The hanging moon');

  /* ---- glowing threads on the floor linking the objects (home positions, so they stay put) ---- */
  var threads = [], tc = [0xf0c96a, 0xeaa8a4, 0xa995d8], H = function (g) { return g.position.clone(); };
  var chainPts = [H(loom), H(nd), HOME.clone(), yarns[0].userData.home, yarns[1].userData.home, new THREE.Vector3(2.9, 0, -2.0), stars[0].position, loom.position];
  for (i = 0; i < chainPts.length - 1; i++) {
    var A = chainPts[i].clone().setY(0.07), B = chainPts[i + 1].clone().setY(0.07), Mid = A.clone().lerp(B, 0.5); Mid.y = 0.34 + (i % 3) * 0.1; Mid.x += (i % 2 ? 0.35 : -0.35);
    var curve = new THREE.CatmullRomCurve3([A, Mid, B]), seg = small ? 12 : 24;
    var tube = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, 0.03, 4), new THREE.MeshBasicMaterial({ color: tc[i % 3], transparent: true, opacity: 0.85, fog: false })); tube.raycast = function () {};
    threads.push(tube); scene.add(tube);
    if (!small) { var halo2 = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, 0.075, 4), new THREE.MeshBasicMaterial({ color: tc[i % 3], transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); halo2.raycast = function () {}; scene.add(halo2); }
  }

  /* ---- floating starlight ---- */
  var N = reduce ? 16 : small ? 34 : 90, pp = new Float32Array(N * 3), pv = [];
  for (i = 0; i < N; i++) { var ang = Math.random() * 6.283, rd = Math.sqrt(Math.random()) * 6; pp[i * 3] = Math.cos(ang) * rd; pp[i * 3 + 1] = Math.random() * 5; pp[i * 3 + 2] = Math.sin(ang) * rd; pv.push(0.08 + Math.random() * 0.2); }
  var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  var motes = new THREE.Points(pg, new THREE.PointsMaterial({ map: GOLD, size: small ? 0.32 : 0.26, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); motes.raycast = function () {}; scene.add(motes);

  /* ---- camera: damped orbit. T = where the visitor wants it, C = where it is. ---- */
  var C = { th: 0.32, ph: 1.18, rad: 14, tx: LOOK.x, ty: LOOK.y, tz: LOOK.z }, T = Object.assign({}, C);
  var base = 9.5, homePh = 1.18, minR = 4.2, maxR = 15, PH_MIN = 0.38, PH_MAX = 1.46, idle = 0, retTimer = 0, introDone = false;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function place() { cam.position.set(C.tx + C.rad * Math.sin(C.ph) * Math.sin(C.th), Math.max(0.35, C.ty + C.rad * Math.cos(C.ph)), C.tz + C.rad * Math.sin(C.ph) * Math.cos(C.th)); cam.lookAt(C.tx, C.ty, C.tz); }
  function touched() { idle = 0; clearTimeout(retTimer); }
  function limits() { T.ph = clamp(T.ph, PH_MIN, PH_MAX); T.rad = clamp(T.rad, minR, maxR); T.tx = clamp(T.tx, -3, 3); T.tz = clamp(T.tz, -3, 3); T.ty = clamp(T.ty, 0.5, 2.2); }
  function fit() {
    var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; var asp = w / h, portrait = asp < 1.1;
    cam.fov = portrait ? 56 : 48; cam.aspect = asp; cam.updateProjectionMatrix();
    var tv = Math.tan(cam.fov * Math.PI / 360), th_ = tv * asp, ext = portrait ? 4.4 : 5.2;
    base = clamp(Math.max(ext / th_, 3.6 / tv) + 1.1, 7.5, 16); maxR = base * 1.5; minR = 4.2;
    scene.fog.near = base * 1.15; scene.fog.far = base * 3.4;
    homePh = portrait ? 1.0 : 1.18; LOOK.y = portrait ? 0.55 : 1.05;
    if (!introDone) { T.rad = base; T.ph = homePh; T.ty = LOOK.y; if (reduce) { C.rad = base; C.th = T.th = 0.32; C.ph = homePh; C.ty = LOOK.y; } }
  }

  /* ---- input: one pointer orbits (or drags yarn), two pointers pinch, wheel zooms, arrows turn ---- */
  var ptrs = {}, nptr = 0, drag = null, pinch = null, moved = 0, yDrag = null, keys = {};
  var ray = new THREE.Raycaster(), v2 = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hp = new THREE.Vector3();
  function setRay(e) { var r = canvas.getBoundingClientRect(); v2.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(v2, cam); }
  function at(e) { setRay(e); var h = ray.intersectObjects(pick, true); if (!h.length) return null; var n = h[0].object; while (n && !n.userData.name) n = n.parent; return n; }
  function dist2() { var k = Object.keys(ptrs); return Math.hypot(ptrs[k[0]].x - ptrs[k[1]].x, ptrs[k[0]].y - ptrs[k[1]].y); }
  canvas.addEventListener('pointerdown', function (e) {
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; nptr = Object.keys(ptrs).length; touched(); try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
    if (nptr === 2) { pinch = { d: dist2(), r: T.rad }; drag = null; if (yDrag) { releaseYarn(false); } return; }
    moved = 0; var n = at(e);
    if (n && n.userData.name === 'yarn') { yDrag = { g: n, sx: e.clientX, sy: e.clientY, hist: [] }; n.userData.held = true; activeY = n; setChase(n); canvas.style.cursor = 'grabbing'; }
    else drag = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointermove', function (e) {
    var p = ptrs[e.pointerId];
    if (p) { var dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; }
    if (pinch && nptr === 2) { var d = dist2(); if (d > 8) { T.rad = pinch.r * pinch.d / d; limits(); } moved = 99; return; }
    if (yDrag) {
      moved += Math.abs(e.clientX - yDrag.sx) + Math.abs(e.clientY - yDrag.sy) > 6 ? 99 : 0;
      if (moved > 6) { setRay(e); plane.constant = -yDrag.g.userData.r; if (ray.ray.intersectPlane(plane, hp)) { var l = Math.hypot(hp.x, hp.z), m = Math.min(l, 4.9) / (l || 1); yDrag.g.position.x = hp.x * m; yDrag.g.position.z = hp.z * m; yDrag.g.position.y = 0.15; yDrag.hist.push({ x: yDrag.g.position.x, z: yDrag.g.position.z, t: performance.now() }); if (yDrag.hist.length > 6) yDrag.hist.shift(); } }
      return;
    }
    if (drag && p) { moved += Math.abs(dx) + Math.abs(dy); T.th -= dx * 0.0065; if (e.pointerType !== 'touch') T.ph = T.ph - dy * 0.005; limits(); }
    else if (e.pointerType === 'mouse' && !nptr) hover(e);
  });
  function endPtr(e, cancel) {
    var had = ptrs[e.pointerId]; delete ptrs[e.pointerId]; nptr = Object.keys(ptrs).length; if (!had) return;
    if (pinch) { if (nptr < 2) pinch = null; drag = null; return; }
    if (yDrag) { releaseYarn(moved < 6 && !cancel, cancel && moved < 6); return; }
    if (drag && moved < 6 && !cancel) tap(e); drag = null;
  }
  canvas.addEventListener('pointerup', function (e) { endPtr(e, false); });
  canvas.addEventListener('pointercancel', function (e) { endPtr(e, true); });
  canvas.addEventListener('pointerleave', function () { if (!nptr) o.tip.hidden = true; });
  canvas.addEventListener('wheel', function (e) {
    var dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1), want = T.rad * Math.exp(dy * 0.0013);
    // at the end of the zoom range let the page scroll instead of trapping it
    if (!e.ctrlKey && ((dy > 0 && T.rad >= maxR - 0.01) || (dy < 0 && T.rad <= minR + 0.01))) return;
    e.preventDefault(); touched(); T.rad = want; limits();
  }, { passive: false });
  canvas.addEventListener('keydown', function (e) {
    var k = e.key; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_', 'PageUp', 'PageDown', 'Home'].indexOf(k) < 0) return;
    e.preventDefault(); touched(); if (k === 'Home') { reset(); return; } keys[k] = e.shiftKey ? 'pan' : 1;
    if (k === '+' || k === '=' || k === 'PageUp') { T.rad *= 0.88; limits(); } else if (k === '-' || k === '_' || k === 'PageDown') { T.rad *= 1.14; limits(); }
  });
  canvas.addEventListener('keyup', function (e) { delete keys[e.key]; });
  canvas.addEventListener('blur', function () { keys = {}; });
  function keyStep(dt) {
    var f = dt * 1.5, p; if (!Object.keys(keys).length) return; touched();
    if (keys.ArrowLeft) { if (keys.ArrowLeft === 'pan') { T.tx -= Math.cos(C.th) * dt * 2.4; T.tz += Math.sin(C.th) * dt * 2.4; } else T.th += f; }
    if (keys.ArrowRight) { if (keys.ArrowRight === 'pan') { T.tx += Math.cos(C.th) * dt * 2.4; T.tz -= Math.sin(C.th) * dt * 2.4; } else T.th -= f; }
    if (keys.ArrowUp) { if (keys.ArrowUp === 'pan') T.ty += dt * 1.6; else T.ph -= f * 0.7; }
    if (keys.ArrowDown) { if (keys.ArrowDown === 'pan') T.ty -= dt * 1.6; else T.ph += f * 0.7; }
    limits();
  }
  function reset() { touched(); T.th = 0.32; T.ph = homePh; T.rad = base; T.tx = LOOK.x; T.ty = LOOK.y; T.tz = LOOK.z; }
  function cam_(a) {   // on-screen buttons
    touched(); if (a === 'left') T.th += 0.28; else if (a === 'right') T.th -= 0.28; else if (a === 'up') T.ph -= 0.12; else if (a === 'down') T.ph += 0.12; else if (a === 'in') T.rad *= 0.85; else if (a === 'out') T.rad *= 1.18; else if (a === 'reset') reset(); limits();
  }

  /* ---- hover / tap ---- */
  function hover(e) {
    var n = at(e); hovered = n; canvas.style.cursor = n ? (n.userData.name === 'yarn' ? 'grab' : 'pointer') : 'grab';
    if (n) { var r = canvas.getBoundingClientRect(); o.tip.hidden = false; o.tip.textContent = n.userData.label; o.tip.style.left = (e.clientX - r.left + 14) + 'px'; o.tip.style.top = (e.clientY - r.top + 10) + 'px'; } else o.tip.hidden = true;
  }
  function tap(e) { var n = at(e); if (n) act(n.userData.name, e.clientX, e.clientY, n); }

  /* ---- speech bubble that follows what was clicked ---- */
  var sayObj = null, sayDy = 1, sayTimer = 0, sv = new THREE.Vector3(), BUB = { kiki: 2.9, loom: 3.9, yarn: 1.7, needles: 2.1, star: 1.0, tea: 1.3, lantern: 0.8, moon: 1.0 };
  function say(text, g, name, ms) {
    var el = o.say; if (!el) return; el.textContent = text; el.hidden = false; el.classList.remove('is-on'); void el.offsetWidth; el.classList.add('is-on');
    sayObj = g; sayDy = BUB[name] || 1.2; clearTimeout(sayTimer); sayTimer = setTimeout(function () { sayObj = null; el.classList.remove('is-on'); setTimeout(function () { if (!sayObj) el.hidden = true; }, 300); }, ms || 3000); placeSay();
  }
  function placeSay() {
    if (!sayObj || !o.say) return; sayObj.getWorldPosition(sv); sv.y += sayDy; sv.project(cam);
    var w = canvas.clientWidth, h = canvas.clientHeight, x = (sv.x * 0.5 + 0.5) * w, y = (-sv.y * 0.5 + 0.5) * h;
    x = clamp(x, 90, w - 90); y = clamp(y, 56, h - 70); o.say.style.left = x + 'px'; o.say.style.top = y + 'px';
  }

  function anchorOf(g, name) { return name === 'lantern' ? lant : name === 'moon' ? moon : g; }

  /* ---- what each thing says ---- */
  var said = {}, noNudge = false;
  var LINES = {
    loom: ['click, clack... one more row of blanket.', 'the warp threads hum when they are happy.', 'it is almost finished! ...it is never finished.'],
    yarn: ['hehe... wait for me!', 'careful, it wants to be chased.', 'that one is my favourite purple.'],
    needles: ['tiny needles. very important.', 'twirl twirl. they do that when they are excited.'],
    star: ['this one fell from very far away...', 'it is humming. it likes you.', 'do not tell the sky I borrowed it.'],
    tea: ["careful, it's still warm!", 'two honey drops and a pinch of stardust.'],
    lantern: ['my little work light.', 'it flickers when I am thinking.'],
    moon: ['shhh... bedtime soon.', 'it keeps watch while I weave.'],
    kiki: ['eep! hello. I did not see you come in.', 'you can ask me things, you know. in the chat.', 'my ears went warm.']
  };
  function act(name, cx, cy, node) {
    var g = node || pick.filter(function (p) { return p.userData.name === name; })[0]; if (!g) return;
    var first = !said[name]; var n = (said[name] = (said[name] || 0) + 1), line = LINES[name][(n - 1) % LINES[name].length];
    kick[name] = { t: 0, g: g }; o.note.textContent = line; say(line, anchorOf(g, name), name, name === 'yarn' ? 3400 : 2800);
    var s = K.audio.sfx;
    if (name === 'loom') { s.bonk(); setTimeout(function () { s.pluck(7); }, 120); startWeave(); K.cozy.add('loom'); }
    else if (name === 'star') { s.sparkle(6); }
    else if (name === 'kiki') { s.giggle(); }
    else if (name === 'tea') { s.pluck(5); }
    else if (name === 'yarn') { s.squeak(); pull(g); K.cozy.add('yarn'); }
    else if (name === 'lantern') { s.pluck(3); } else if (name === 'moon') { s.pluck(2); } else { s.pluck(4 + n % 5); }
    if (!noNudge && name !== 'loom' && name !== 'yarn' && name !== 'kiki') nudge(g, name);
    var r = canvas.getBoundingClientRect(), x = cx != null ? cx : r.left + r.width / 2, y = cy != null ? cy : r.top + r.height / 2;
    K.dust.burst(x, y, 'stars', small ? 8 : 16, { speed: 200 });
    if (first && K.chat) K.chat.kikiSays('(In the Loom Room) ' + line);
    if (name === 'kiki' && n === 2 && K.chat) K.chat.kikiSays('Want to hear how I got here? \u2192 scroll up to the story, or just ask me.');
  }
  function nudge(g, name) {   // a small camera glance toward what was touched, then ease back
    if (reduce) return; var p = anchorOf(g, name).getWorldPosition(new THREE.Vector3()); touched();
    T.tx = clamp(p.x * 0.45, -2.2, 2.2); T.tz = clamp(p.z * 0.45 - 0.2, -2.2, 1.5); T.ty = clamp(p.y * 0.25 + 1.05, 0.9, 1.9); T.rad = Math.max(minR + 1, Math.min(T.rad, base * 0.82));
    retTimer = setTimeout(function () { T.tx = LOOK.x; T.ty = LOOK.y; T.tz = LOOK.z; T.rad = Math.max(T.rad, base * 0.92); }, 2600);
  }
  function focus(name) {
    var g = pick.filter(function (p) { return p.userData.name === name; })[0]; if (!g) return;
    var p = anchorOf(g, name).getWorldPosition(new THREE.Vector3()); touched();
    T.th = Math.atan2(p.x, p.z + 4) + 0.2; T.tx = p.x * 0.8; T.tz = p.z * 0.8; T.ty = clamp(p.y + 0.9, 0.9, 2.4); T.rad = Math.max(minR + 0.8, base * 0.62); T.ph = 1.15; kick[name] = { t: 0, g: g };
    retTimer = setTimeout(function () { T.tx = LOOK.x * 0.5 + T.tx * 0.5; T.tz = LOOK.z * 0.5 + T.tz * 0.5; T.ty = LOOK.y; }, 6000);
  }

  /* ---- yarn physics + Kiki chasing it ---- */
  function setChase(y) { kt.state = 'chase'; kt.t = 0; kt.target = y; }
  function releaseYarn(tapped, quiet) {
    var d = yDrag, g = d.g; yDrag = null; g.userData.held = false; canvas.style.cursor = 'grab'; if (quiet) return;
    if (tapped) { act('yarn', d.sx, d.sy, g); return; }
    var now = performance.now(), f = null; for (var q = 0; q < d.hist.length; q++) if (now - d.hist[q].t < 120) { f = d.hist[q]; break; }
    if (f && now - f.t > 8) { var dt = (now - f.t) / 1000; g.userData.vx = clamp((g.position.x - f.x) / dt, -9, 9); g.userData.vz = clamp((g.position.z - f.z) / dt, -9, 9); }
    g.userData.vy = 2.2; if (o.onChase) o.onChase('drag'); K.audio.sfx.pluck(5); K.cozy.add('yarn'); setChase(g);
    if (!said.drag) { said.drag = 1; say('wheee! wait for me!', kikiG, 'kiki', 2600); o.note.textContent = 'wheee! wait for me!'; }
  }
  function pull(g) {   // tap = a hop and a roll away from Kiki; the chase artwork pops up
    activeY = g; var u = g.userData, dx = g.position.x - kikiG.position.x, dz = g.position.z - kikiG.position.z, l = Math.hypot(dx, dz) || 1, a = Math.atan2(dz, dx) + (Math.random() - 0.5) * 1.1;
    var tx = Math.cos(a), tz = Math.sin(a); if (Math.hypot(g.position.x + tx * 2, g.position.z + tz * 2) > 4.6) { tx = -g.position.x / (Math.hypot(g.position.x, g.position.z) || 1); tz = -g.position.z / (Math.hypot(g.position.x, g.position.z) || 1); }
    u.vx = tx * 4.6; u.vz = tz * 4.6; u.vy = 3.2; setChase(g); kt.lastPull = clock.elapsedTime; if (o.onChase) o.onChase('pull');
  }
  function physics(dt) {
    yarns.forEach(function (g) {
      var u = g.userData; if (u.held) { u.vx = u.vz = 0; return; }
      g.position.x += u.vx * dt; g.position.z += u.vz * dt;
      if (u.vy || g.position.y > 0) { u.vy -= 11 * dt; g.position.y += u.vy * dt; if (g.position.y <= 0) { g.position.y = 0; if (u.vy < -1.6) { u.vy = -u.vy * 0.38; K.audio.sfx.bounce(Math.min(1, -u.vy / 4)); } else u.vy = 0; } }
      var f = Math.pow(0.18, dt); if (g.position.y <= 0.001) { u.vx *= f; u.vz *= f; }
      var sp = Math.hypot(u.vx, u.vz); if (sp < 0.06) { u.vx = u.vz = 0; }
      var d = Math.hypot(g.position.x, g.position.z); if (d > 4.9) { var nx = g.position.x / d, nz = g.position.z / d, dot = u.vx * nx + u.vz * nz; if (dot > 0) { u.vx -= 1.7 * dot * nx; u.vz -= 1.7 * dot * nz; } g.position.x = nx * 4.9; g.position.z = nz * 4.9; }
      OBST.forEach(function (ob) { var ox = g.position.x - ob[0], oz = g.position.z - ob[1], od = Math.hypot(ox, oz), min = ob[2] + u.r; if (od < min) { var nx = ox / (od || 1), nz = oz / (od || 1), dot = u.vx * nx + u.vz * nz; if (dot < 0) { u.vx -= 1.6 * dot * nx; u.vz -= 1.6 * dot * nz; } g.position.x = ob[0] + nx * min; g.position.z = ob[1] + nz * min; } });
      if (!reduce || sp > 0.1) { u.ball.rotation.x += u.vz * dt / u.r; u.ball.rotation.z -= u.vx * dt / u.r; }
    });
  }
  function kikiStep(dt, t) {
    var tgt = kt.target, state = kt.state; kt.t += dt; kt.hop = 0; var moving = false;
    var gx = HOME.x, gz = HOME.z;
    if (state === 'chase' && tgt) {
      var yx = tgt.position.x, yz = tgt.position.z, dx = yx - kt.x, dz = yz - kt.z, d = Math.hypot(dx, dz), stopAt = 1.25;
      if (d > stopAt) { gx = yx - dx / d * stopAt; gz = yz - dz / d * stopAt; }
      else { gx = kt.x; gz = kt.z; var calm = Math.hypot(tgt.userData.vx, tgt.userData.vz) < 0.4 && !tgt.userData.held; if (calm && kt.t > 0.7) { kt.state = 'tangled'; kt.t = 0; pounce(); } }
    } else if (state === 'tangled') {
      gx = kt.x; gz = kt.z; if (kt.t > 5.5) { kt.state = 'home'; kt.t = 0; }
    } else { if (kt.t > 0.2) { gx = HOME.x; gz = HOME.z; } }
    var ddx = gx - kt.x, ddz = gz - kt.z, dd = Math.hypot(ddx, ddz), sp = (reduce ? 5 : 2.9) * dt;
    if (dd > 0.02) { var s = Math.min(sp, dd); kt.x += ddx / dd * s; kt.z += ddz / dd * s; moving = dd > 0.06; kt.face = Math.sign(ddx) || kt.face || 1; }
    kikiG.position.x = kt.x; kikiG.position.z = kt.z;
    var hopY = 0; if (!reduce) { if (moving) hopY = Math.abs(Math.sin(t * 11)) * 0.16; if (kt.pounce > 0) { kt.pounce -= dt; hopY += Math.sin(Math.max(0, kt.pounce) / 0.6 * Math.PI) * 0.55; } }
    kikiG.position.y = hopY; kt.moving = moving;
  }
  function pounce() {
    kt.pounce = 0.6; K.audio.sfx.giggle(); say('oh no... you got me tangled!', kikiG, 'kiki', 3200); o.note.textContent = 'oh no... you got me tangled!'; K.dust.burst(canvas.getBoundingClientRect().left + canvas.clientWidth / 2, canvas.getBoundingClientRect().top + canvas.clientHeight * 0.55, 'stars', small ? 6 : 12, { speed: 150 });
  }

  /* ---- loom weaving animation: a glowing shuttle sweeps a new row across ---- */
  function startWeave() {
    if (weave) return; if (woven >= ROWS) { woven = 3; paint(); }
    if (reduce) { woven++; paint(); return; }
    weave = { p: 0, t: 0 }; shuttle.visible = true;
  }
  function weaveStep(dt) {
    if (!weave) return; weave.t += dt; weave.p = Math.min(1, weave.t / 1.05); var rowY = 0.35 + 0.02 + (woven + 0.5) * (2.4 / ROWS) * 0.99 + 0.0;
    shuttle.position.set(-0.95 + 1.9 * weave.p, 0.35 + (woven + 0.5) * (2.4 / ROWS) + 0.0, 0.16); shuttle.position.y = 1.55 - 1.2 + (woven + 0.5) * (2.4 / ROWS);
    warpMat.color.setHex(weave.p < 1 ? 0xffe9a0 : 0xf6e6b0); paint();
    if (weave.p >= 1) { woven++; weave = null; shuttle.visible = false; warpMat.color.setHex(0xf6e6b0); paint(); }
  }

  /* ---- loop ---- */
  var clock = new THREE.Clock(), visible = true, raf = 0, dead = false, tmp = new THREE.Vector3();
  function size() { var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); fit(); }
  new ResizeObserver(size).observe(canvas); size();
  new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible && !raf && !dead) loop(); }, { threshold: 0.02 }).observe(canvas);
  /* cinematic start: begin a little wide and to the side, then settle into the composition */
  if (!reduce) { C.th = -0.6; C.rad = base * 1.3; C.ph = homePh - 0.18; C.ty = LOOK.y; }
  T.th = 0.32; T.ph = homePh; T.rad = base; T.ty = LOOK.y;
  setTimeout(function () { introDone = true; }, 2500);
  function loop() {
    raf = 0; if (dead || !visible || document.hidden) return; raf = requestAnimationFrame(loop);
    var dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime; idle += dt;
    keyStep(dt);
    if (!reduce && idle > 7 && !nptr && !yDrag && introDone) T.th += dt * 0.035;
    var k = 1 - Math.pow(reduce ? 0.00002 : 0.0006, dt); ['th', 'ph', 'rad', 'tx', 'ty', 'tz'].forEach(function (a) { C[a] += (T[a] - C[a]) * k; });
    place(); physics(dt); kikiStep(dt, t); weaveStep(dt); threadUpdate(t); placeSay();
    if (!reduce) {
      var b = Math.sin(t * 1.8) * 0.014;
      if (kikiSp) { kikiSp.scale.set(KH * kAsp * (1 - b), KH * (1 + b), 1); kikiSp.position.y = KH * (1 + b) / 2; kikiSp.material.rotation = Math.sin(t * 0.9) * 0.025 + (kt.moving ? Math.sin(t * 11) * 0.05 : 0) + (kt.state === 'tangled' ? Math.sin(t * 14) * 0.07 * Math.max(0, 1 - kt.t / 1.5) : 0); }
      halo.material.opacity = 0.22 + Math.sin(t * 1.3) * 0.05; shadow.scale.setScalar(1 - kikiG.position.y * 0.6);
      stars.forEach(function (s, i) { var p = 0.55 + Math.sin(t * 1.8 + i * 1.7) * 0.25; s.userData.gl.material.opacity = p; });
      lantP.rotation.z = Math.sin(t * 0.7) * 0.035; moonP.rotation.z = Math.sin(t * 0.5 + 1) * 0.06;
      var fl = 0.82 + Math.sin(t * 9.3) * 0.06 + Math.sin(t * 23.1) * 0.05 + Math.sin(t * 3.7) * 0.05; lglow.material.opacity = 0.55 * fl + 0.1; lglow.scale.setScalar(2.4 * (0.94 + fl * 0.08)); if (lamp) lamp.intensity = (night ? 16 : 6) * (0.85 + (fl - 0.82) * 1.4);
      threads.forEach(function (m, i) { m.material.opacity = 0.62 + Math.sin(t * 1.4 + i * 0.9) * 0.25; });
      if (activeY.userData.gl) activeY.userData.gl.material.opacity = 0.4 + Math.sin(t * 2.1) * 0.12;
      yarns[0].userData.ball.scale.setScalar(1 + Math.sin(t * 1.6) * 0.012);
      yarns.forEach(function (g, i) { if (!g.userData.held && Math.hypot(g.userData.vx, g.userData.vz) < 0.05 && g.position.y < 0.01) g.rotation.z = Math.sin(t * 0.9 + i * 2) * 0.05; });
      steam.forEach(function (s) { var p = (t * 0.25 + s.userData.o) % 1; s.position.set(Math.sin(p * 6) * 0.08, 0.55 + p * 0.9, 0); s.material.opacity = Math.sin(p * Math.PI) * 0.45; });
      var a = pg.attributes.position; for (var i = 0; i < N; i++) { var y = a.getY(i) + pv[i] * dt; if (y > 5.2) y = 0; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t * 0.7 + i) * 0.0025); } a.needsUpdate = true;
      mglow.material.opacity = 0.32 + Math.sin(t * 0.8) * 0.08;
    }
    Object.keys(kick).forEach(function (n) {
      var q = kick[n]; q.t += dt; var e = Math.max(0, 1 - q.t / 0.9), g = q.g, w = Math.sin(q.t * 22) * e;
      if (n === 'loom') { loom.rotation.y = 0.62 + w * 0.05; loom.position.y = Math.abs(w) * 0.04; }
      else if (n === 'needles') { g.rotation.y = q.t * 12 * e; g.position.y = Math.abs(w) * 0.1; }
      else if (n === 'star') { g.userData.gl.scale.setScalar(g.userData.base + e * 2.4); g.userData.st.rotation.z = q.t * 6 * e; }
      else if (n === 'tea') { g.rotation.z = w * 0.08; steam.forEach(function (s) { s.scale.setScalar(0.55 + e * 0.6); }); }
      else if (n === 'kiki') { if (!kt.pounce && !kt.moving) g.position.y = Math.abs(Math.sin(q.t * 10)) * 0.5 * e; }
      else if (n === 'lantern') { g.rotation.z = Math.sin(q.t * 7) * 0.25 * e; lglow.scale.setScalar(2.4 + e * 1.2); }
      else if (n === 'moon') { g.rotation.z = Math.sin(q.t * 5) * 0.3 * e; mglow.scale.setScalar(3.2 + e * 1.4); }
      if (q.t > 0.9) { delete kick[n]; if (n === 'loom') { loom.position.y = 0; loom.rotation.y = 0.62; } if (n === 'star') g.userData.gl.scale.setScalar(g.userData.base); if (n === 'tea') g.rotation.z = 0; if (n === 'lantern' || n === 'moon') g.rotation.z = 0; if (n === 'needles') g.position.y = 0; if (n === 'kiki' && !kt.moving) g.position.y = 0; }
    });
    renderer.render(scene, cam);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && !raf && visible && !dead) loop(); });
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); dead = true; if (o.onLost) o.onLost(); });
  place(); loop();
  return {
    act: function (n, quiet) { var g = pick.filter(function (p) { return p.userData.name === n; })[0]; noNudge = !!quiet; if (g) act(n, null, null, n === 'yarn' ? yarns[0] : g); noNudge = false; },
    focus: focus, cam: cam_,
    pull: function () { act('yarn', null, null, yarns[0]); },
    dispose: function () { dead = true; tmo.disconnect(); renderer.dispose(); }
  };
}
