/* The wish form lives in a cloud-shaped dialog.
   To get wishes in your inbox, set window.KIKI_FORM_ENDPOINT in index.html (for example a Formspree URL). */
(function () {
  'use strict';
  var K = (window.Kiki = window.Kiki || {});
  var $ = function (id) { return document.getElementById(id); };
  var dlg = $('wish-dialog'), form = $('wish-form'), done = $('wf-done');
  if (!dlg || typeof dlg.showModal !== 'function') {
    // Very old browser without <dialog>: fall back to a plain mail link instead of a broken button.
    var b = $('open-wish');
    if (b) b.addEventListener('click', function () { K.toast('Your browser is too old for the wish cloud. Try a newer one.'); });
    return;
  }

  var mood = K.radioGroup($('wf-moods'), K.moods, 'sleepy');
  var fields = {
    name: { el: $('wf-name'), err: $('wf-name-err'), msg: 'Add your name so Kiki knows who to weave for.', ok: function (v) { return v.trim().length >= 2; } },
    email: { el: $('wf-email'), err: $('wf-email-err'), msg: 'Enter an email like name@example.com so Kiki can reply.', ok: function (v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()); } },
    wish: { el: $('wf-wish'), err: $('wf-wish-err'), msg: 'Write a few words about your wish or the blanket you need.', ok: function (v) { return v.trim().length >= 5; } }
  };
  var status = $('wf-status'), send = $('wf-send'), count = $('wf-count');

  function open() {
    form.hidden = false; done.hidden = true; status.textContent = '';
    dlg.showModal();
    K.audio.sfx.chime(true);
  }
  function close() { if (dlg.open) dlg.close(); }

  $('open-wish').addEventListener('click', open);
  $('wf-cancel').addEventListener('click', close);
  $('wf-close').addEventListener('click', close);
  $('wf-again').addEventListener('click', function () {
    form.reset(); count.textContent = '0'; mood.select('sleepy', false);
    form.hidden = false; done.hidden = true; fields.name.el.focus();
  });
  // clicking the dimmed backdrop closes the cloud
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });

  $('wf-wish').addEventListener('input', function (e) { count.textContent = e.target.value.length; });

  function check(f, show) {
    var good = f.ok(f.el.value);
    f.el.setAttribute('aria-invalid', String(!good));
    if (show || good) { f.err.hidden = good; f.err.textContent = good ? '' : f.msg; }
    if (!good && show) f.el.setAttribute('aria-describedby', f.err.id); else f.el.removeAttribute('aria-describedby');
    return good;
  }
  Object.keys(fields).forEach(function (n) {
    fields[n].el.addEventListener('blur', function () { if (fields[n].el.value) check(fields[n], true); });
    fields[n].el.addEventListener('input', function () { if (fields[n].el.getAttribute('aria-invalid') === 'true') check(fields[n], true); });
  });

  function deliver(data) {
    var ep = window.KIKI_FORM_ENDPOINT;
    if (!ep) { if (window.console) console.info('Wish (no endpoint set, not sent):', data); return Promise.resolve(); }
    return fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
      .then(function (res) { if (!res.ok) throw new Error('bad status ' + res.status); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    Object.keys(fields).forEach(function (n) { if (!check(fields[n], true) && !firstBad) firstBad = fields[n]; });
    if (firstBad) { firstBad.el.focus(); K.audio.sfx.bonk(); status.textContent = 'A few things need fixing before Kiki can start weaving.'; return; }

    status.textContent = 'Sending your wish...';
    send.disabled = true;
    deliver({
      name: fields.name.el.value.trim(), email: fields.email.el.value.trim(),
      mood: mood.value(), wish: fields.wish.el.value.trim()
    }).then(function () {
      status.textContent = '';
      form.hidden = true; done.hidden = false;
      $('wf-done-title').focus();
      K.audio.sfx.chime(true); setTimeout(function () { K.audio.sfx.sparkle(9); }, 300);
      var r = dlg.getBoundingClientRect();
      K.dust.burst(r.left + r.width / 2, r.top + r.height / 2, 'stars', 36, { speed: 360, up: 160 });
    }).catch(function () {
      status.textContent = 'Your wish did not send. Check your connection, then press Send my wish again.';
      K.audio.sfx.bonk();
    }).then(function () { send.disabled = false; });
  });
})();
