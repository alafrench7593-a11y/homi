/* Page /contact/ : envoi direct seulement si un service serveur est configuré au build (data-endpoint) ; sinon le bouton
   ouvre la messagerie avec un e-mail pré-rempli vers homixyz@gmail.com. « Message reçu » n'apparaît QUE sur réponse
   serveur { ok: true } : jamais en cas d'échec. Aucune donnée envoyée à un outil de mesure ou de publicité. */
(function () {
  var f = document.getElementById('contact'); if (!f) return;
  var endpoint = (f.dataset.endpoint || '').trim();
  var live = /^https:\/\//.test(endpoint);
  var err = f.querySelector('.contact-error');
  var done = document.querySelector('.contact-done');
  var mail = f.querySelector('[data-mail]');
  var note = f.querySelector('[data-mode-note]');
  var TO = 'homixyz@gmail.com';
  function val(n) { return (f.elements[n] && f.elements[n].value || '').trim(); }
  function mailto() {
    var subject = '[' + val('category') + '] ' + (val('subject') || 'Demande');
    var body = val('message') + '\n\n— ' + (val('name') || '') + (val('email') ? ' <' + val('email') + '>' : '');
    return 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }
  function sync() { mail.href = mailto(); }
  f.addEventListener('input', sync); f.addEventListener('change', sync); sync();
  if (!live) {
    f.querySelector('[type="submit"]').hidden = true;
    note.textContent = 'Le bouton ouvre votre messagerie avec votre message déjà rédigé. Vous pouvez aussi écrire directement à ' + TO + '.';
    f.addEventListener('submit', function (e) { e.preventDefault(); location.href = mailto(); });
    return;
  }
  note.textContent = 'Envoi sécurisé. Vous pouvez aussi utiliser votre messagerie.';
  f.addEventListener('submit', function (e) {
    e.preventDefault(); err.hidden = true;
    if (!f.checkValidity()) { err.textContent = 'Complétez les champs et acceptez le traitement de votre demande.'; err.hidden = false; return; }
    var btn = f.querySelector('[type="submit"]'); btn.disabled = true; btn.textContent = 'Envoi…';
    fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      category: val('category'), name: val('name'), email: val('email'), subject: val('subject'), message: val('message'),
      website: val('website'), consent: f.elements.consent.checked }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || 'send'); }); })
      .then(function () { f.hidden = true; done.hidden = false; done.focus(); })
      .catch(function () { err.textContent = 'Le message n’est pas parti. Réessayez, ou utilisez « Ouvrir ma messagerie ».'; err.hidden = false; })
      .then(function () { btn.disabled = false; btn.textContent = 'Envoyer'; });
  });
})();
