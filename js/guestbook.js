/* The Wish Wall: a persistent guestbook backed by a Supabase table (free tier is plenty).
   It stays completely hidden until window.KIKI_GUESTBOOK is filled in (see README), so a visitor never sees a broken form. */
(function () {
  'use strict';
  var K = (window.Kiki = window.Kiki || {});
  var $ = function (id) { return document.getElementById(id); };
  var cfg = window.KIKI_GUESTBOOK, sec = $('wall');
  if (!sec || !cfg || !cfg.url || !cfg.anonKey) return;
  sec.hidden = false;

  var base = cfg.url.replace(/\/$/, '') + '/rest/v1/' + (cfg.table || 'guestbook');
  var auth = { apikey: cfg.anonKey, Authorization: 'Bearer ' + cfg.anonKey };
  var list = $('wall-notes'), form = $('wall-form'), msg = $('gb-msg'), nameEl = $('gb-name');
  var err = $('gb-err'), status = $('gb-status'), send = $('gb-send'), count = $('gb-count');
  var COOLDOWN = 30000, LAST = 'kiki-gb-last';

  function fmt(iso) {
    var d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function note(row, i) {
    var li = document.createElement('li'), who = document.createElement('strong'), p = document.createElement('p'), t = document.createElement('time');
    li.className = 'note'; li.style.setProperty('--r', ((i % 5) - 2) * 0.9 + 'deg');
    who.textContent = row.name || 'A friend';
    p.textContent = row.message; // textContent only: visitor text is never treated as HTML
    t.textContent = fmt(row.created_at);
    li.appendChild(who); li.appendChild(p); li.appendChild(t);
    return li;
  }

  function render(rows) {
    list.textContent = '';
    if (!rows.length) {
      var e = document.createElement('li'); e.className = 'wall__empty';
      e.textContent = 'No stars on the wall yet. Be the first to leave one.';
      list.appendChild(e); return;
    }
    rows.forEach(function (r, i) { list.appendChild(note(r, i)); });
  }

  function load() {
    fetch(base + '?select=name,message,created_at&order=created_at.desc&limit=30', { headers: auth })
      .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.json(); })
      .then(render)
      .catch(function () {
        list.textContent = '';
        var e = document.createElement('li'); e.className = 'wall__empty';
        e.textContent = 'Kiki could not load the wall. Check your connection and refresh the page.';
        list.appendChild(e);
      });
  }

  msg.addEventListener('input', function () { count.textContent = msg.value.length; if (!err.hidden) err.hidden = true; });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = msg.value.trim(), name = nameEl.value.trim().slice(0, 40);
    if (text.length < 2) {
      err.textContent = 'Write at least a couple of words so Kiki has something to read.'; err.hidden = false;
      msg.setAttribute('aria-invalid', 'true'); msg.focus(); K.audio.sfx.bonk(); return;
    }
    msg.removeAttribute('aria-invalid');
    if ($('gb-site').value) { status.textContent = 'Your star is on the wall.'; form.reset(); return; } // honeypot: bots fill hidden fields
    var wait = 0;
    try { wait = COOLDOWN - (Date.now() - parseInt(localStorage.getItem(LAST) || '0', 10)); } catch (x) {}
    if (wait > 0) { status.textContent = 'Kiki needs a moment. Try again in ' + Math.ceil(wait / 1000) + ' seconds.'; return; }

    status.textContent = 'Hanging your star...'; send.disabled = true;
    fetch(base, {
      method: 'POST',
      headers: { apikey: auth.apikey, Authorization: auth.Authorization, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ name: name || null, message: text.slice(0, 140) })
    }).then(function (r) {
      if (!r.ok) throw new Error('status ' + r.status);
      try { localStorage.setItem(LAST, String(Date.now())); } catch (x) {}
      var empty = list.querySelector('.wall__empty'); if (empty) list.removeChild(empty);
      list.insertBefore(note({ name: name, message: text, created_at: new Date().toISOString() }, 0), list.firstChild);
      form.reset(); count.textContent = '0';
      status.textContent = 'Your star is on the wall.';
      K.audio.sfx.chime(true);
      var r2 = send.getBoundingClientRect(); K.dust.burst(r2.left + r2.width / 2, r2.top, 'stars', 22, { speed: 300, up: 120 });
    }).catch(function () {
      status.textContent = 'Your star did not make it onto the wall. Check your connection, then press Leave a star again.';
      K.audio.sfx.bonk();
    }).then(function () { send.disabled = false; });
  });

  load();
})();
