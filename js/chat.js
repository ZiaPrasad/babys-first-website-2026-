/* Talk to Kiki: a hand-written character system (no API, no keys, nothing leaves the browser).
   Intent matching by keyword score, several replies per topic, a little memory, and links into the story and the 3D room. */
(function () {
  'use strict';
  var K = (window.Kiki = window.Kiki || {});
  var $ = function (id) { return document.getElementById(id); };
  var log = $('chat-log'), form = $('chat-form'), input = $('chat-input'), chips = $('chat-chips'), status = $('chat-status');
  if (!log) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var name = '', asked = {}, turns = 0, busy = false;
  try { name = localStorage.getItem('kiki-friend') || ''; } catch (e) {}

  var STORY = ['story-1', 'story-2', 'story-3', 'story-4', 'story-5'];
  var T = [
    { id: 'weave', k: ['weave', 'weaving', 'weaves', 'make', 'blanket', 'do for', 'your job', 'work'], r: [
      'I... um. I weave blankets out of starlight. Fallen stars give off a thread if you hum to them very softly, and I knit it up so nobody in the forest is cold.',
      'Night-blankets! Sleepy ones, brave ones, giggly ones. You can try the blanket loom up above if you want to see how the colours go.'], go: 'loom' },
    { id: 'live', k: ['live', 'home', 'house', 'where are', 'tree', 'teacup'], r: [
      'I live at the top of the Observatory Tree. I sleep in a teacup lined with velvet moss. It is very small. It is perfect.',
      'Up high, past the owl-window and the lantern. If you click the little tree-room in the story, that is where I climbed to.'], story: 3 },
    { id: 'first', k: ['first star', 'found', 'fallen star first', 'how did you start', 'story', 'begin', 'began', 'cold star', 'glow'], r: [
      'It was so cold, the first one. Lying in the moss and nobody had noticed. So I wrapped it in yarn, the way you would a friend... and then it started to glow.',
      'I did not know yarn could shine until that night. I just did not want it to be alone.'], story: 1 },
    { id: 'whyc', k: ['why collect', 'collect', 'why do you', 'fallen stars', 'stars'], r: [
      'They are not really lost, I think. They just fell asleep in the wrong place. I keep them warm until they are ready to glow again.',
      'Collecting is a big word. I mostly just... keep them company. They hum.'], room: 'star' },
    { id: 'loomroom', k: ['loom room', 'workspace', 'your room', 'show me the room', 'take me', 'visit your room'], r: [
      'The Loom Room is where I work! There is my loom, three yarn balls, two needles, a star in a jar-ish thing, and tea. Want me to open it for you?',
      'It is a bit messy. I like it messy. Press the button above and you can walk around it.'], room: 'enter' },
    { id: 'fav', k: ['favorite', 'favourite', 'like best', 'love most', 'fave'], r: [
      'Hmm. Yarn. No, tea. No... the sound the loom makes when it is almost finished. That one.',
      'The warm part of a blanket right after it is done. Everyone goes quiet.'], room: 'tea' },
    { id: 'bed', k: ['bedtime', 'bed time', 'sleep', 'lullaby', 'tell me a story', 'a story', 'story time', 'tuck', 'goodnight', 'good night', 'sleepy'], r: [
      'Okay, a very small one. Once there was a star who was afraid of the dark, which is silly, because stars make the dark pretty. A tiny mouse told her so, and wrapped her in purple yarn, and they both fell asleep. The end. Sleep well.',
      'Close your eyes, and I will count the stars slowly. One... two... oh, that one is yawning. Three...'], wish: true },
    { id: 'sneeze', k: ['sneeze', 'achoo', 'sneezing', 'cold'], r: [
      'Oh! When I sneeze, tiny shooting stars come out. It is embarrassing. They go everywhere. Try tugging my scarf three times, but... be gentle.',
      'Ah... ah... no. Not now. Maybe if you tug my scarf.'], sneeze: true },
    { id: 'scarf', k: ['scarf', 'knot'], r: ['My scarf is spun from moonlight. I keep spare thread in the pockets. Do not tell the Elder.'] },
    { id: 'elder', k: ['elder', 'owl', 'teacher', 'master'], r: ['The Elder Weaver sees everything from the tree. She said I had the hands for it. I think about that a lot.'], story: 3 },
    { id: 'tea', k: ['tea', 'drink', 'honey', 'cup'], r: ['Star-tea has honey drops and a pinch of stardust. Steep it for exactly long enough. You can brew some in the projects, or look at my cup in the room.'], room: 'tea' },
    { id: 'yarn', k: ['yarn', 'ball', 'string', 'thread'], r: ['Yarn is love, a bit. Sometimes I curl up into a ball when I am startled, and then I look like yarn too. Try the playpen!'], play: true },
    { id: 'who', k: ['who are you', 'your name', 'what are you', 'who is kiki', 'are you real', 'are you ai', 'robot', 'human'], r: [
      'I am Kiki, a baby Moon-Mouseling. I am an apprentice weaver. I am also, um, a little website, so I only know what is written in me. But I try very hard.'] },
    { id: 'hi', k: ['hello', 'hi', 'hey', 'hiya', 'good evening', 'good morning'], r: ['Oh! Hello. I am glad you came.', 'Hi... hi. You can ask me anything. Even small things.'] },
    { id: 'thanks', k: ['thank', 'thanks', 'cute', 'sweet', 'love you', 'adorable', 'nice'], r: ['Eep. Th-thank you. My ears went warm.', 'You are very kind. I am going to hide in my scarf for a second. I am still listening!'] },
    { id: 'bye', k: ['bye', 'goodbye', 'see you', 'leaving', 'gotta go'], r: ['Okay. Come back tonight? I will leave the lantern on.'] },
    { id: 'help', k: ['help', 'what can i ask', 'what can you'], r: ['You can ask what I weave, where I live, about my first star, or for a bedtime story. Or press one of the little buttons.'] }
  ];
  var FALLBACK = [
    'Hmm. I am not sure I understand that one... can you ask it a little smaller? I like questions about stars, yarn and sleeping.',
    'I thought about that very hard and my ears drooped. Try asking about my loom, my first star, or a bedtime story?',
    'That is a big question for a baby mouse! Ask me where I live, or what I weave?'
  ];
  var CHIPS = ['What do you weave?', 'Where do you live?', 'Tell me about your first star.', "What's your favorite thing?", 'Why do you collect fallen stars?', 'What is the Loom Room?', 'Tell me a bedtime story.', 'What happens when you sneeze?'];

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function bubble(who, html, extra) {
    var p = document.createElement('div');
    p.className = 'msg msg--' + who; p.innerHTML = '<p>' + html + '</p>' + (extra || '');
    log.appendChild(p); log.scrollTop = log.scrollHeight; return p;
  }
  function act(label, fn) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'chip chip--act'; b.textContent = label;
    b.addEventListener('click', fn); return b;
  }
  function goto(id) { if (K.nav) K.nav.go(id); else { var el = $(id); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); } }
  function pick(a, key) { asked[key] = ((asked[key] || 0) + 1); return a[(asked[key] - 1) % a.length]; }

  /* Whole-word matching ("weaver" must not match "weave", "history" must not match "hi"); phrases match as text. */
  function find(text) {
    var clean = text.toLowerCase().replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim(), words = clean.split(' '), padded = ' ' + clean + ' ', best = null, bs = 0;
    T.forEach(function (it) {
      var s = 0;
      it.k.forEach(function (w) {
        if (w.indexOf(' ') > -1) { if (padded.indexOf(' ' + w + ' ') > -1 || padded.indexOf(' ' + w) > -1) s += w.length + 6; }
        else if (words.indexOf(w) > -1 || words.indexOf(w + 's') > -1) s += w.length;
      });
      if (s > bs) { bs = s; best = it; }
    });
    return best;
  }

  function reply(text) {
    var nm = text.match(/(?:my name is|i am|i'm|call me)\s+([a-z]{2,16})\b/i);
    if (nm && !/^(a|an|the|so|very|just|here|not|sleepy|tired)$/i.test(nm[1])) {
      name = nm[1][0].toUpperCase() + nm[1].slice(1).toLowerCase();
      try { localStorage.setItem('kiki-friend', name); } catch (e) {}
      return { t: 'Hello, ' + name + '. That is a very good name. I will remember it, I have a scarf pocket for it.' };
    }
    var it = find(text);
    if (!it) return { t: FALLBACK[turns % FALLBACK.length] };
    var t = pick(it.r, it.id);
    if (name && turns % 3 === 2) t = name + ', ' + t.charAt(0).toLowerCase() + t.slice(1);
    return { t: t, it: it };
  }

  function actions(it) {
    var wrap = document.createElement('div'); wrap.className = 'msg__acts';
    if (it.story) wrap.appendChild(act('Read this part of my story \u2192', function () { K.immersive && K.immersive.goto(it.story); }));
    if (it.room === 'enter') wrap.appendChild(act('Open the 3D Loom Room \u2192', function () { K.room && K.room.open(); }));
    else if (it.room) wrap.appendChild(act('Find it in the 3D Loom Room \u2192', function () { K.room && K.room.open(it.room); }));
    if (it.go === 'loom') wrap.appendChild(act('Try my Blanket Loom \u2192', function () { goto('loom'); }));
    if (it.wish) wrap.appendChild(act('Leave a wish \u2192 Contact', function () { goto('wish'); }));
    if (it.play) wrap.appendChild(act('Go to the Yarn Playpen \u2192', function () { goto('play'); }));
    if (it.sneeze) wrap.appendChild(act('Back to Kiki to boop her nose \u2191', function () { goto('top'); }));
    return wrap.childNodes.length ? wrap : null;
  }

  function ask(text) {
    text = text.trim(); if (!text || busy) return;
    busy = true; turns++;
    bubble('me', esc(text));
    K.cozy && K.cozy.add('chat');
    status.textContent = 'is thinking...';
    var r = reply(text), wait = reduce ? 0 : Math.min(1400, 450 + r.t.length * 7);
    setTimeout(function () {
      var m = bubble('kiki', esc(r.t)); status.textContent = 'is here, a little shy';
      var a = r.it && actions(r.it); if (a) { m.appendChild(a); log.scrollTop = log.scrollHeight; }
      K.audio && K.audio.sfx.pluck(4 + (turns % 4) * 2);
      if (K.hero && r.t.length < 90) K.hero.say(r.t, 3200);
      if (r.it && r.it.sneeze) setTimeout(function () { var s = $('spot-scarf'); if (s) { s.click(); s.click(); s.click(); } }, 500);
      busy = false;
    }, wait);
  }

  /* Public hooks so the rest of the world can make Kiki speak. */
  K.chat = {
    ask: function (q) { $('chat').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); ask(q); },
    kikiSays: function (t) { bubble('kiki', esc(t)); }
  };

  CHIPS.forEach(function (q) { var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = q; b.addEventListener('click', function () { ask(q); }); chips.appendChild(b); });
  form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; ask(v); input.focus(); });
  bubble('kiki', name ? 'Oh, ' + esc(name) + '! You came back. What shall we talk about?' : 'Oh... hello. I am Kiki. You can ask me things. Small things are best.');
})();
