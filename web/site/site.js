/* HOMI — page publique : chapitres, correction de la sieste reprise dans le relais, recherche d'outils réelle. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');

  // ------------------------------------------------------------ lien d'ambassadeur : ?ref=CODE gardé 60 jours sur l'appareil
  // (la web app le PROPOSE après l'inscription ; rien n'est appliqué sans la personne)
  try {
    var ref = new URLSearchParams(location.search).get('ref');
    var code = ref ? ref.replace(/[^A-Za-z0-9]/g, '').toUpperCase() : '';
    if (/^[A-Z0-9]{4,16}$/.test(code)) localStorage.setItem('homi.ref', JSON.stringify({ code: code, at: Date.now() }));
  } catch (e) { /* stockage indisponible : le code se saisit à la main */ }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------ mouvement (jamais bloquant : contenu présent sans JS)
  if (!reduce) doc.classList.add('motion');
  var io = !reduce && 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px' }) : null;
  document.querySelectorAll('.lines').forEach(function (el) {
    // titre du premier écran : révélé tout de suite (pas d'intro qui bloque)
    if (!io || el.closest('.hero')) { requestAnimationFrame(function () { el.classList.add('in'); }); return; }
    io.observe(el);
  });
  document.querySelectorAll('.chapter:not(.hero) .wrap > *:not(.display):not(.story-phone), .story-steps > .fine, .hero-copy > *:not(h1)').forEach(function (el) {
    if (!io || el.closest('.hero')) return;
    el.classList.add('reveal'); io.observe(el);
  });

  // parallaxe des sphères chromées + ombre de la barre
  var orbs = Array.prototype.slice.call(document.querySelectorAll('.orb'));
  var nav = document.querySelector('.nav-bar');
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      if (!reduce) orbs.forEach(function (o) { o.style.transform = 'translate3d(0,' + (y * parseFloat(o.dataset.depth || 0)).toFixed(1) + 'px,0)'; });
      if (nav) nav.style.boxShadow = y > 12 ? '0 14px 40px rgba(20,20,30,.16)' : '';
      var bar = document.querySelector('[data-progress]');
      if (bar) { var max = document.documentElement.scrollHeight - window.innerHeight; bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')'; }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // téléphone du premier écran : léger relief au pointeur (souris uniquement)
  var tilt = document.querySelector('[data-tilt]');
  if (tilt && !reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('pointermove', function (e) {
      var rx = (e.clientY / window.innerHeight - .5) * -6, ry = (e.clientX / window.innerWidth - .5) * 8;
      tilt.style.transform = 'perspective(1200px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    });
  }

  // l'app : l'étape au centre de l'écran choisit l'écran affiché dans le téléphone
  var steps = Array.prototype.slice.call(document.querySelectorAll('[data-step]'));
  var screens = Array.prototype.slice.call(document.querySelectorAll('[data-screen]'));
  function show(i) {
    screens.forEach(function (sc) { sc.classList.toggle('is-on', sc.dataset.screen === String(i)); });
    steps.forEach(function (st) { st.classList.toggle('is-on', st.dataset.step === String(i)); });
  }
  if (steps.length && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) show(e.target.dataset.step); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (st) { so.observe(st); });
    show(0);
  }

  // ------------------------------------------------------------ sieste de Léa : 13:10 → 14:35 (1 h 25), corrigée à 14:20 (1 h 10)
  var START = 13 * 60 + 10, END = 14 * 60 + 35, FIXED_END = 14 * 60 + 20, MORNING = 45;
  var state = { end: END };
  var dur = function (m) { var h = Math.floor(m / 60), r = m % 60; return h ? h + ' h ' + (r < 10 ? '0' + r : r) : r + ' min'; };
  var clock = function (m) { var h = Math.floor(m / 60), r = m % 60; return (h < 10 ? '0' : '') + h + ':' + (r < 10 ? '0' : '') + r; };
  var clockH = function (m) { var h = Math.floor(m / 60), r = m % 60; return h + ' h ' + (r < 10 ? '0' + r : r); };

  function setAll(name, text, flash) {
    document.querySelectorAll('[data-bind="' + name + '"]').forEach(function (el) {
      if (el.textContent === text) return;
      el.textContent = text;
      if (flash && !reduce) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
    });
  }
  function render(flash) {
    var nap = state.end - START;
    setAll('nap', dur(nap), flash);
    setAll('napEnd', clock(state.end), flash);
    setAll('napEndH', clockH(state.end), flash);
    setAll('total', dur(nap + MORNING), flash);
    var fixed = state.end === FIXED_END;
    var delta = document.querySelector('[data-bind="delta"]');
    if (delta) { delta.textContent = fixed ? '−15 min' : ' '; delta.classList.toggle('on', fixed); }
    var sleep = document.querySelector('[data-sleep]');
    if (sleep) sleep.setAttribute('data-state', fixed ? 'fixed' : 'initial');
    setAll('relaySync', fixed ? 'Mis à jour depuis le journal : la sieste corrigée (1 h 10) est déjà dans le résumé.' : 'Les chiffres viennent du journal : corrige-les là-haut, ils changent ici.', flash);
  }

  // Chiffres qui défilent (1 h 25 → 1 h 10, 2 h 10 → 1 h 55) pendant que le segment se raccourcit
  var animating = false;
  function animateTo(target) {
    if (animating || state.end === target) return;
    if (reduce) { state.end = target; render(false); announce(); return; }
    animating = true;
    var from = state.end, t0 = performance.now(), D = 900;
    var sleep = document.querySelector('[data-sleep]');
    if (sleep) sleep.setAttribute('data-state', target === FIXED_END ? 'fixed' : 'initial');
    (function step(now) {
      var k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
      state.end = Math.round(from + (target - from) * e);
      var nap = state.end - START;
      setAll('nap', dur(nap));
      setAll('napEnd', clock(state.end));
      setAll('total', dur(nap + MORNING));
      if (k < 1) requestAnimationFrame(step);
      else { state.end = target; animating = false; render(true); announce(); }
    })(t0);
  }
  function announce() {
    var live = document.querySelector('[data-live]');
    if (live) live.textContent = state.end === FIXED_END
      ? 'Sieste corrigée : 1 h 10, de 13 h 10 à 14 h 20. Total des siestes : 1 h 55, soit 15 minutes de moins. Le résumé pour Julien est à jour.'
      : 'Sieste revenue à 1 h 25, de 13 h 10 à 14 h 35. Total des siestes : 2 h 10.';
  }
  var correct = document.querySelector('[data-correct]');
  var undo = document.querySelector('[data-undo]');
  if (correct && undo) {
    // doubles appuis : un seul effet (bouton désactivé une fois la correction faite)
    correct.addEventListener('click', function () {
      if (state.end === FIXED_END) return;
      animateTo(FIXED_END);
      correct.disabled = true; correct.setAttribute('aria-pressed', 'true'); correct.textContent = 'Corrigé : réveil à 14 h 20';
      undo.hidden = false;
    });
    undo.addEventListener('click', function () {
      if (state.end === END) return;
      animateTo(END);
      correct.disabled = false; correct.setAttribute('aria-pressed', 'false'); correct.textContent = 'Corriger la fin : 14 h 20';
      undo.hidden = true;
      correct.focus();
    });
  }
  render(false);

  // ------------------------------------------------------------ recherche d'outils (moteur de l'application)
  // Cartes d'outils : la vraie web app (connexion si besoin, puis l'outil pour l'enfant affiché)
  var toolHref = function (id) { return '/outil/' + encodeURIComponent(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function card(r) {
    return '<a class="result" href="' + toolHref(r.entry) + '" data-tool="' + esc(r.entry) + '">' +
      '<span class="result-ico" aria-hidden="true">' + esc(r.label.charAt(0)) + '</span>' +
      '<span class="result-txt"><b>Ouvrir ' + esc(r.label) + '</b><span>' + esc(r.sub) + '</span></span>' +
      '<span class="result-go" aria-hidden="true">→</span></a>';
  }
  function withTools(fn) {
    if (window.homiTools) return fn(window.homiTools);
    var tries = 0, iv = setInterval(function () { if (window.homiTools || ++tries > 100) { clearInterval(iv); if (window.homiTools) fn(window.homiTools); } }, 50);
  }
  var form = document.querySelector('[data-ask]');
  var input = document.getElementById('ask-input');
  var out = document.getElementById('ask-results');
  var timer = null;
  function run(q) {
    withTools(function (api) {
      if (!q.trim()) { out.innerHTML = ''; return; }
      var res = api.search(q);
      out.innerHTML = res.results.length
        ? res.results.slice(0, 3).map(card).join('')
        : '<p class="empty">Aucun outil ne correspond vraiment. Explore par besoin juste en dessous.</p>';
    });
  }
  if (form && input && out) {
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { run(input.value); }, 120); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      run(input.value);
      var first = out.querySelector('a.result');
      if (first) first.focus();
    });
    document.querySelectorAll('[data-example]').forEach(function (b) {
      b.addEventListener('click', function () { input.value = b.textContent; run(input.value); });
    });
  }

  // ------------------------------------------------------------ exploration par besoin / par étape
  function groups(list, open) {
    return list.map(function (g, i) {
      return '<details class="group"' + (open && i === 0 ? ' open' : '') + '><summary><span>' + esc(g.title) + '</span><span class="count">' + (g.count || g.items.length) + ' outils</span></summary><ul>' +
        g.items.map(function (t) { return '<li><a href="' + toolHref(t.entry) + '"><b>' + esc(t.label) + '</b><span>' + esc(t.sub) + '</span></a></li>'; }).join('') + '</ul></details>';
    }).join('');
  }
  withTools(function (api) {
    document.querySelectorAll('[data-bind="toolCount"]').forEach(function (el) { el.textContent = String(api.count); });
    var need = document.querySelector('[data-panel="need"]');
    var stage = document.querySelector('[data-panel="stage"]');
    if (need) need.innerHTML = groups(api.categories(), true);
    if (stage) stage.innerHTML = groups(api.stages(), false);
    var mq = document.querySelector('[data-marquee]');
    if (mq) {
      var names = [];
      api.categories().forEach(function (g) { g.items.forEach(function (t) { if (names.indexOf(t.label) < 0) names.push(t.label); }); });
      var row = names.slice(0, 28).map(function (n) { return '<span>' + esc(n) + '</span>'; }).join('');
      mq.innerHTML = row + row;
    }
  });
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function select(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); select(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]); }
    });
  });
})();
