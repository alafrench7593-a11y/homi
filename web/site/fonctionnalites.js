/* Page /fonctionnalites/ : filtre par étape de vie + recherche avec le MÊME moteur que l'application
   (window.homiTools, /site/search.js), sans IA ni réseau. Le catalogue est déjà dans le HTML (indexable). */
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('.feat-item'));
  var cats = Array.prototype.slice.call(document.querySelectorAll('.feat-cat'));
  var q = document.getElementById('feat-q');
  var count = document.getElementById('feat-count');
  var none = document.getElementById('feat-none');
  var stage = 'all';
  var hits = null;
  function apply() {
    var n = 0;
    items.forEach(function (li) {
      var okStage = stage === 'all' || (' ' + li.dataset.stages + ' ').indexOf(' ' + stage + ' ') >= 0;
      var okSearch = !hits || hits.indexOf(li.dataset.id) >= 0;
      li.hidden = !(okStage && okSearch);
      if (!li.hidden) n++;
    });
    cats.forEach(function (c) { c.hidden = !c.querySelector('.feat-item:not([hidden])'); });
    count.textContent = n + (n > 1 ? ' outils' : ' outil');
    none.hidden = n > 0;
  }
  Array.prototype.forEach.call(document.querySelectorAll('.feat-chips button'), function (b) {
    b.addEventListener('click', function () {
      stage = b.dataset.stage;
      Array.prototype.forEach.call(document.querySelectorAll('.feat-chips button'), function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      apply();
    });
  });
  var timer;
  q && q.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var v = q.value.trim();
      if (!v || !window.homiTools) { hits = null; return apply(); }
      // moteur de l'app (synonymes, fautes courantes) puis repli sur le texte des cartes
      var r = window.homiTools.search(v);
      var ids = (r.results || []).map(function (t) { return t.id; });
      var low = v.toLowerCase();
      items.forEach(function (li) { if (li.textContent.toLowerCase().indexOf(low) >= 0 && ids.indexOf(li.dataset.id) < 0) ids.push(li.dataset.id); });
      hits = ids;
      apply();
    }, 120);
  });
  // liens du menu : /fonctionnalites/#etape=pregnancy ou #q=sommeil
  function fromHash() {
    var h = new URLSearchParams((location.hash || '').replace(/^#/, ''));
    var e = h.get('etape'), qq = h.get('q');
    if (e) { var btn = document.querySelector('.feat-chips button[data-stage="' + e + '"]'); if (btn) btn.click(); }
    if (qq && q) { q.value = qq; q.dispatchEvent(new Event('input')); }
    if (e || qq) { var cat = document.getElementById('catalogue'); cat && cat.scrollIntoView({ block: 'start' }); }
  }
  window.addEventListener('hashchange', fromHash);
  apply();
  if (window.homiTools) fromHash(); else window.addEventListener('load', fromHash);
})();
