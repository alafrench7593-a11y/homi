/*
 * Détecteur de débordement / rognage / troncature (audit 09, UX et accessibilité) — exécuté dans la page (Playwright).
 * Deux fonctions exposées sur `window` :
 *
 *  - `__homiTextScale(k)` : SIMULE la taille de texte du téléphone sur le web. React Native multiplie la taille et
 *    l'interligne de chaque texte par `min(fontScale, maxFontSizeMultiplier)` ; react-native-web l'ignore. Le
 *    composant `Text` (src/components/ui.tsx) et les commandes partagées publient leur plafond dans `data-fsmax` ;
 *    ici chaque texte est agrandi de `min(k, plafond le plus proche)` (sans plafond : `k`, comme sur le téléphone).
 *    Un texte imbriqué qui hérite de la taille de son parent n'est pas agrandi deux fois. Les champs de saisie
 *    (input, textarea) sont agrandis aussi. Réappliqué à chaque appel (rendu React entre deux appels).
 *
 *  - `__homiDetect()` : pour chaque texte VISIBLE de l'écran actif, compare sa boîte
 *      1. au viewport (texte hors de l'écran à gauche ou à droite) ;
 *      2. à chaque ancêtre qui ROGNE (overflow hidden/clip, ou défilement vertical pour l'axe horizontal) :
 *         un texte dont la boîte dépasse celle d'un conteneur rogneur est coupé à l'écran, même si
 *         `document.scrollWidth` ne bouge pas (c'est ce que les E2E pilotes ne voyaient pas) ;
 *      3. à sa propre boîte (mot trop long qui sort de la ligne, `scrollWidth > clientWidth`) ;
 *      4. troncature (`…` / line-clamp) non déclarée volontaire (`data-truncate="intentional"`) ;
 *      5. libellé de bouton qui sort du bouton, bouton hors de l'écran, cible tactile < 44 px (hors liens dans
 *         le texte) ;
 *    et renvoie la liste des constats { kind, text, ... } (dédoublonnée).
 *    Les conteneurs qui défilent horizontalement (carrousels, puces) sont exemptés sur l'axe horizontal ; le
 *    défilement vertical, lui, est normal (seul l'axe horizontal y est contrôlé).
 */
(() => {
  const TEXT_SEL = 'div[dir="auto"], span[dir="auto"], input, textarea';
  const hasOwnText = (el) => {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return true;
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return true;
    return false;
  };
  const capOf = (el) => {
    const c = el.closest('[data-fsmax]');
    const v = c ? parseFloat(c.getAttribute('data-fsmax')) : NaN;
    return Number.isFinite(v) && v > 0 ? v : Infinity;
  };

  window.__homiTextScale = (k) => {
    window.__homiK = k;
    const els = [...document.querySelectorAll(TEXT_SEL)];
    for (const el of els) {
      if (!hasOwnText(el) && !el.querySelector('[dir="auto"]') && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') continue;
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      if (!fs) continue;
      const applied = el.dataset.fsapplied;
      // déjà agrandi et non réécrit par React : rien à faire
      if (applied && el.style.fontSize === applied) continue;
      const parent = el.parentElement && el.parentElement.closest('[dir="auto"]');
      if (parent && parent.dataset.fsapplied && Math.abs(parseFloat(getComputedStyle(parent).fontSize) - fs) < 0.01 && !el.style.fontSize) {
        continue; // hérite de la taille (déjà agrandie) de son parent
      }
      const f = Math.min(k, capOf(el));
      if (f === 1) continue;
      const lh = parseFloat(cs.lineHeight);
      el.style.fontSize = (fs * f).toFixed(2) + 'px';
      if (lh) el.style.lineHeight = (lh * f).toFixed(2) + 'px';
      el.dataset.fsapplied = el.style.fontSize;
    }
  };

  window.__homiDetect = (opts = {}) => {
    const W = window.innerWidth, H = window.innerHeight, out = [];
    const minTouch = opts.minTouch ?? 44;
    const hiddenCache = new Map();
    const hidden = (el) => {
      for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
        if (hiddenCache.has(e)) { if (hiddenCache.get(e)) return true; continue; }
        const cs = getComputedStyle(e);
        const h = cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05 || e.getAttribute('aria-hidden') === 'true';
        hiddenCache.set(e, h);
        if (h) return true;
      }
      return false;
    };
    const visible = (el) => { const r = el.getBoundingClientRect(); return r.width >= 1 && r.height >= 1 && r.bottom > 0 && r.top < H && !hidden(el); };
    const label = (el) => ((el.innerText || el.value || el.getAttribute('aria-label') || '') + '').replace(/\s+/g, ' ').trim().slice(0, 70);
    const where = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) }; };
    // Ancêtres qui rognent : axe horizontal (hidden/clip/auto/scroll) ; axe vertical (hidden/clip seulement)
    // Au-delà d'une zone qui défile verticalement, le rognage vertical des ancêtres est normal (c'est la fenêtre de
    // la zone qui défile) : seul l'axe horizontal reste contrôlé.
    const clippers = (el) => {
      const res = [];
      let vScroll = false;
      for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
        const cs = getComputedStyle(e);
        const ox = cs.overflowX, oy = cs.overflowY;
        const hScroll = (ox === 'auto' || ox === 'scroll') && e.scrollWidth > e.clientWidth + 1;
        if (hScroll) return { list: res, hScroll: true };
        if (ox !== 'visible' || oy === 'hidden' || oy === 'clip') res.push({ e, x: ox !== 'visible', y: !vScroll && (oy === 'hidden' || oy === 'clip') });
        if (oy === 'auto' || oy === 'scroll') vScroll = true;
      }
      return { list: res, hScroll: false };
    };
    // Mot coupé au milieu (sans trait d'union du mot lui-même) : un mot dont les rectangles tombent sur deux lignes
    const brokenWord = (el) => {
      for (const n of el.childNodes) {
        if (n.nodeType !== 3) continue;
        const txt = n.textContent;
        const re = /[^\s\u00a0]{4,}/g;
        let m;
        while ((m = re.exec(txt))) {
          const r = document.createRange();
          r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
          const rects = [...r.getClientRects()].filter((q) => q.width > 0.5);
          if (rects.length > 1 && Math.abs(rects[0].top - rects[rects.length - 1].top) > 2) {
            const cut = m[0];
            if (!/[-\u2010]/.test(cut)) return cut;
          }
        }
      }
      return null;
    };
    const intentional = (el) => !!el.closest('[data-truncate="intentional"]');
    // Césure typographique (hyphens:auto, avec trait d'union) admise dans le texte courant ; jamais dans un titre,
    // un onglet, un choix ou le bouton principal (« Plu-tôt bien »)
    const strictBreak = (el) => getComputedStyle(el).hyphens !== 'auto' || !!el.closest('[role="heading"],[role="tab"],[role="radio"],[data-testid="screen-footer"]');
    // Texte recouvert par un AUTRE écran de la pile de navigation : ignoré (il n'est pas à l'écran)
    const covered = (el) => {
      const r = el.getBoundingClientRect();
      const x = Math.min(W - 1, Math.max(0, r.left + Math.min(r.width / 2, 20))), y = Math.min(H - 1, Math.max(0, r.top + Math.min(r.height / 2, 10)));
      const hit = document.elementFromPoint(x, y);
      if (!hit || hit === el || el.contains(hit) || hit.contains(el)) return false;
      const scr = (n) => n.closest('[data-testid="screen-scroll"],[data-testid="screen-header"]');
      const a = scr(hit), b = scr(el);
      return !!a && !!b && a !== b && !a.contains(el) && !b.contains(hit) && a.parentElement !== b.parentElement;
    };

    // 1-4. Textes
    for (const el of document.querySelectorAll(TEXT_SEL)) {
      if (!hasOwnText(el) || !visible(el) || covered(el)) continue;
      if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA' && !el.innerText.trim()) continue;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const { list, hScroll } = clippers(el);
      if (!hScroll && (r.left < -1 || r.right > W + 1)) { out.push({ kind: 'texte_hors_ecran', text: label(el), ...where(el) }); continue; }
      let clipped = null;
      for (const c of list) {
        const cr = c.e.getBoundingClientRect();
        if (cr.width < 2 || cr.height < 2) { clipped = null; break; } // conteneur replié (accordéon fermé) : texte invisible, pas rogné
        if (!hScroll && c.x && (r.left < cr.left - 1.5 || r.right > cr.right + 1.5)) { clipped = { axe: 'horizontal', c: cr }; break; }
        // vertical : seulement si le texte est PARTIELLEMENT visible (entièrement caché = repli voulu)
        if (c.y && r.bottom > cr.top + 2 && r.top < cr.bottom - 2 && (r.top < cr.top - 1.5 || r.bottom > cr.bottom + 1.5)) {
          // un conteneur qui défile verticalement plus haut (ScrollView) n'est pas un rognage
          clipped = { axe: 'vertical', c: cr }; break;
        }
      }
      if (clipped && !intentional(el)) { out.push({ kind: 'texte_rogne', axe: clipped.axe, text: label(el), ...where(el), conteneur: { x: Math.round(clipped.c.left), r: Math.round(clipped.c.right), y: Math.round(clipped.c.top), b: Math.round(clipped.c.bottom) } }); continue; }
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') continue;
      const clamp = cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
      const ellipsis = cs.textOverflow === 'ellipsis';
      if ((clamp || ellipsis) && (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2)) {
        out.push({ kind: intentional(el) ? 'troncature_volontaire' : 'texte_tronque', text: label(el), ...where(el) });
        continue;
      }
      if (el.scrollWidth > el.clientWidth + 2 && cs.overflowX !== 'auto' && cs.overflowX !== 'scroll') out.push({ kind: 'texte_deborde_sa_boite', text: label(el), ...where(el) });
      const bw = strictBreak(el) ? brokenWord(el) : null;
      if (bw) out.push({ kind: 'mot_coupe', text: bw + ' <- ' + label(el).slice(0, 40), ...where(el) });
    }

    // 5. Boutons, onglets, interrupteurs, choix
    for (const b of document.querySelectorAll('[role="button"], button, [role="tab"], [role="switch"], [role="radio"], [role="checkbox"], a[href]')) {
      if (!visible(b)) continue;
      const br = b.getBoundingClientRect();
      const { hScroll } = clippers(b);
      if (!hScroll && (br.right > W + 1 || br.left < -1)) out.push({ kind: 'bouton_hors_ecran', text: label(b), ...where(b) });
      for (const t of b.querySelectorAll('div[dir="auto"]')) {
        if (!visible(t)) continue;
        const tr = t.getBoundingClientRect();
        if (tr.right > br.right + 2 || tr.left < br.left - 2 || tr.bottom > br.bottom + 2 || tr.top < br.top - 2) { out.push({ kind: 'libelle_hors_bouton', text: label(t) }); break; }
      }
      // cible tactile (les liens au fil du texte en sont dispensés, WCAG 2.5.8 « inline »)
      const inline = b.tagName === 'A' && b.closest('[dir="auto"]') && b.closest('[dir="auto"]') !== b;
      if (!inline && b.getAttribute('aria-disabled') !== 'true' && (br.width < minTouch - 0.5 || br.height < minTouch - 0.5)) {
        // < 24 px : sous le minimum WCAG 2.5.8 (bloquant) ; < 44 px : sous la cible iOS / Material (à revoir)
        const tiny = br.width < 23.5 || br.height < 23.5;
        out.push({ kind: tiny ? 'cible_tactile_trop_petite' : 'cible_tactile_petite', text: label(b) || b.getAttribute('data-testid') || '?', w: Math.round(br.width), h: Math.round(br.height) });
      }
    }

    // 6. Bouton principal d'écran (pied de Screen, `miniapp-action`) : libellé sur une seule ligne
    const mains = new Set([...document.querySelectorAll('[data-testid="screen-footer"] [role="button"], [data-testid="miniapp-action"]')]);
    for (const id of opts.mainActions || []) for (const b of document.querySelectorAll(`[data-testid="${id}"]`)) mains.add(b);
    {
      for (const b of mains) {
        if (!visible(b)) continue;
        const t = b.querySelector('div[dir="auto"]');
        if (!t) continue;
        const lh = parseFloat(getComputedStyle(t).lineHeight) || 22;
        if (b.getBoundingClientRect().width < 160) continue; // bouton secondaire du pied (retour) : non concerné
        if (t.getBoundingClientRect().height > lh * 1.5) out.push({ kind: 'bouton_principal_2_lignes', text: label(t) });
      }
    }
    const seen = new Set();
    return out.filter((o) => { const k = o.kind + '|' + o.text; if (seen.has(k)) return false; seen.add(k); return true; });
  };
})();
