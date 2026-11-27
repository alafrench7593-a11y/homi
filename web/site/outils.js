/* Outils gratuits HOMI : checklist (mémorisée sur l'appareil) et répartition de la charge mentale (calcul local). */
(function () {
  var store = { get: function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } } };
  var cl = document.querySelector('[data-checklist]');
  if (cl) {
    var key = 'homi.site.checklist.v1', saved = store.get(key) || {}, boxes = cl.querySelectorAll('input[type=checkbox]'), core = cl.querySelectorAll('.cl-group:not([data-optional]) input[type=checkbox]'), out = document.querySelector('[data-cl-progress]');
    var render = function () { var n = 0; core.forEach(function (b) { if (b.checked) n++; }); if (out) out.textContent = n + ' sur ' + core.length + ' prêts'; };
    boxes.forEach(function (b) { b.checked = !!saved[b.id]; b.addEventListener('change', function () { saved[b.id] = b.checked; store.set(key, saved); render(); }); });
    render();
    var pr = document.querySelector('[data-print]'); if (pr) pr.addEventListener('click', function () { window.print(); });
    var rs = document.querySelector('[data-cl-reset]'); if (rs) rs.addEventListener('click', function () { if (!window.confirm('Décocher toute la liste ? Vos coches seront effacées.')) return; saved = {}; store.set(key, saved); boxes.forEach(function (b) { b.checked = false; }); render(); });
  }
  var ml = document.querySelector('[data-mentalload]');
  if (ml) {
    var res = document.querySelector('[data-ml-result]');
    var calc = function () {
      var t = { think: { me: 0, other: 0 }, do: { me: 0, other: 0 } }, answered = 0, status = document.querySelector('[data-ml-status]'), rows = ml.querySelectorAll('[data-dom]');
      rows.forEach(function (r) { ['think', 'do'].forEach(function (k) { var v = (r.querySelector('select[data-k="' + k + '"]') || {}).value; if (!v) return; if (k === 'think' && v !== 'none') answered++; if (v === 'me') t[k].me += 1; else if (v === 'other') t[k].other += 1; else if (v === 'both') { t[k].me += .5; t[k].other += .5; } }); });
      var pct = function (o) { var s = o.me + o.other; return s ? Math.round(o.me / s * 100) : null; };
      var a = pct(t.think), b = pct(t.do);
      if (answered < 3 || a === null) { res.hidden = true; if (status) status.textContent = 'Répondez à au moins 3 domaines (hors « Personne ») pour voir le résultat.'; return; }
      if (status) status.innerHTML = 'Résultat prêt : vous portez ' + a + ' % de l’anticipation. <a href="#resultat">Voir le détail</a>';
      res.hidden = false;
      res.querySelector('[data-ml-think]').textContent = a + ' %'; res.querySelector('[data-ml-do]').textContent = (b === null ? '—' : b + ' %');
      res.querySelector('[data-ml-bar-think]').style.transform = 'scaleX(' + a / 100 + ')'; res.querySelector('[data-ml-bar-do]').style.transform = 'scaleX(' + (b || 0) / 100 + ')';
      res.querySelector('[data-ml-msg]').textContent = a >= 60 ? 'Vous portez l’essentiel de l’anticipation. Choisir un ou deux domaines à confier entièrement à l’autre parent (y penser ET le faire) allège plus qu’un partage tâche par tâche.' : a <= 40 ? 'L’autre parent porte l’essentiel de l’anticipation. Prenez un domaine entier en charge, de l’anticipation à la réalisation.' : 'L’anticipation est assez partagée. Un point de dix minutes chaque semaine aide à la garder ainsi.';
    };
    ml.addEventListener('change', calc);
  }
})();
