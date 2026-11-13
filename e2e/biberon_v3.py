"""
Biberon (refonte v3, outil à données), démo web, petit écran 320 × 568 — parcours complet :
  entrée (/bottle, ligne → écran de l'enfant par la transition carte → détail)
  → session : Démarrer → Pause → Reprendre, la commande ronde reste AU MÊME ENDROIT (boîte englobante identique)
  → arrière-plan simulé (onglet masqué, horloge avancée de 12 min 34 s, minuteurs JavaScript à l'arrêt) puis retour :
    le temps affiché est EXACT (recalculé depuis l'horodatage enregistré)
  → Terminer : récapitulatif dans le panneau du bas, double appui sur Enregistrer = un seul biberon, résultat réel
  → synthèse : période Aujourd'hui / 7 jours (libellé et micrographique changent ensemble), tuile → historique
  → historique (vue semaine ouverte depuis la tuile), état vide d'un jour sans biberon
  → doseur de mesurettes (commande ronde, compte, « C'est le compte »)
Puis : texte agrandi 1,3 sans débordement horizontal, Réduire les animations (session utilisable, aucun écran à moitié
apparu), captures clair / sombre × Turquoise / Crépuscule (deviceScaleFactor 2).
Usage :
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/homi-p2/dist
  python3 e2e/spa_server.py /tmp/homi-p2/dist 8941 &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8941 E2E_SHOTS=/tmp/homi-p2/shots python3 e2e/biberon_v3.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import glob, json, os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import PREMIUM_ON  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8941')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/homi-p2/shots')
EXE = os.environ.get('PW_CHROMIUM') or None
if EXE and os.path.isdir(EXE):
    EXE = (glob.glob(os.path.join(EXE, '**', 'chrome'), recursive=True) or [EXE])[0]
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []

ZOOM_TEXT = """() => { for (const el of document.querySelectorAll('div[dir], span, div')) {
  if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
  const cs = getComputedStyle(el); const fs = parseFloat(cs.fontSize); if (!fs || el.dataset.z) continue;
  el.dataset.z = '1'; el.style.fontSize = (fs * 1.3) + 'px'; const lh = parseFloat(cs.lineHeight); if (lh) el.style.lineHeight = (lh * 1.3) + 'px'; } }"""
SCROLLER = """() => { const els = [...document.querySelectorAll('div')].filter((e) => { const s = getComputedStyle(e); return (s.overflowY === 'auto' || s.overflowY === 'scroll') && e.scrollHeight > e.clientHeight + 4 && e.getBoundingClientRect().height > 300; });
  return els.length ? els[els.length - 1] : null; }"""
VISIBILITY = """(v) => { if (!window.__visPatched) { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => window.__vis || 'visible' });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => (window.__vis || 'visible') === 'hidden' }); window.__visPatched = true; }
  window.__vis = v; document.dispatchEvent(new Event('visibilitychange')); }"""
# Le fantôme de la transition carte → détail a-t-il été affiché (au moins une image) ?
WATCH_GHOST = """() => { window.__ghost = false; if (window.__ghostObs) window.__ghostObs.disconnect();
  window.__ghostObs = new MutationObserver(() => { if (document.querySelector('[data-testid="morph-ghost"]')) window.__ghost = true; });
  window.__ghostObs.observe(document.body, { childList: true, subtree: true }); }"""
APPEARANCE = """(p) => { const ui = JSON.parse(localStorage.getItem('toietmoi.ui') || '{"state":{},"version":0}'); ui.state.themePreference = p.theme; ui.state.palettePreference = p.palette;
  if (ui.state.appearanceOwner) { ui.state.appearanceByUser = ui.state.appearanceByUser || {}; ui.state.appearanceByUser[ui.state.appearanceOwner] = { theme: p.theme, palette: p.palette }; }
  localStorage.setItem('toietmoi.ui', JSON.stringify(ui)); }"""


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def state(pg):
    return pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.demo.v1'))")


def shot(pg, name, full=False):
    pg.wait_for_timeout(500)
    pg.screenshot(path=f'{SHOTS}/{name}.png', full_page=full)


def no_hscroll(pg):
    return pg.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1")


def start(pg):
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate(PREMIUM_ON)


def lina_of(pg):
    return next(c for c in state(pg)['tables']['children'] if c['first_name'] == 'Lina')['id']


def reset_running(pg, child):
    pg.evaluate("(c) => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables.bottles = (s.tables.bottles || []).filter((b) => !(b.child_id === c && b.in_progress)); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }", child)


def orb(pg):
    o = tid(pg, 'bottle-session-primary')
    return o.get_attribute('aria-label'), o.bounding_box()


def expected_seconds(pg, child):
    """Secondes attendues, calculées dans la page (horloge simulée) depuis la ligne enregistrée."""
    return pg.evaluate("""(c) => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const b = s.tables.bottles.find((x) => x.child_id === c && x.in_progress);
      if (!b) return -1; const end = b.paused_at ? Date.parse(b.paused_at) : Date.now(); return Math.floor((end - Date.parse(b.started_at)) / 1000) - (b.paused_seconds || 0); }""", child)


def clock_seconds(txt):
    parts = [int(x) for x in txt.strip().split(':')]
    return parts[-1] + 60 * parts[-2] + (3600 * parts[-3] if len(parts) == 3 else 0)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)
    ctx = b.new_context(viewport={'width': 320, 'height': 568}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'Failed to load resource' not in m.text and 'sb.fake.test' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    pg.clock.install()
    start(pg)
    lina = lina_of(pg)
    reset_running(pg, lina)

    # 1. Entrée : liste mate, ligne → écran de l'enfant (transition carte → détail)
    pg.goto(B + '/bottle'); pg.wait_for_timeout(3000)
    R['1_liste_lignes_enfants'] = tid(pg, f'bottle-row-{lina}').count() > 0 and tid(pg, 'bottle-children').count() > 0
    shot(pg, '01-liste')
    pg.evaluate(WATCH_GHOST)
    tid(pg, f'bottle-row-{lina}').click(); pg.wait_for_timeout(600)
    R['1_morph_fantome_visible'] = pg.evaluate('() => window.__ghost')
    pg.wait_for_timeout(2000)
    R['1_ecran_enfant'] = f'/bottle/{lina}' in pg.url and tid(pg, 'bottle-session').count() > 0
    box = tid(pg, 'bottle-session-primary').bounding_box()
    R['1_commande_ronde_visible_sans_defiler'] = bool(box) and box['y'] + box['height'] <= 568 and abs(box['width'] - box['height']) < 1
    shot(pg, '02-enfant-repos')

    # 2. Démarrer → Pause → Reprendre : même emplacement
    lab0, b0 = orb(pg)
    tid(pg, 'bottle-session-primary').click(); pg.wait_for_timeout(1500)
    lab1, b1 = orb(pg)
    R['2_demarre'] = lab0 == 'Démarrer' and lab1 == 'Pause' and 'En cours' in tid(pg, 'bottle-session-state').inner_text()
    R['2_ligne_en_cours_enregistree'] = expected_seconds(pg, lina) >= 0
    pg.clock.run_for(3000); pg.wait_for_timeout(300)
    t_run = tid(pg, 'bottle-session-clock').inner_text()
    R['2_chiffres_avancent'] = clock_seconds(t_run) >= 2
    shot(pg, '03-en-cours')
    tid(pg, 'bottle-session-primary').click(); pg.wait_for_timeout(1500)
    lab2, b2 = orb(pg)
    tid(pg, 'bottle-session-primary').click(); pg.wait_for_timeout(1500)
    lab3, b3 = orb(pg)
    R['2_pause_puis_reprendre'] = lab2 == 'Reprendre' and lab3 == 'Pause'
    R['2_meme_emplacement'] = all(bx and abs(bx['x'] - b0['x']) < 0.5 and abs(bx['y'] - b0['y']) < 0.5 and abs(bx['width'] - b0['width']) < 0.5 for bx in [b1, b2, b3])
    R['2_chiffres_tabulaires'] = pg.evaluate("() => getComputedStyle(document.querySelector('[data-testid=\"bottle-session-clock\"]')).fontVariantNumeric.includes('tabular-nums')")

    # 3. Arrière-plan simulé : horloge avancée de 12 min 34 s, minuteurs à l'arrêt, puis retour
    pg.clock.pause_at((pg.evaluate('() => Date.now()') + 1000) / 1000)
    before = tid(pg, 'bottle-session-clock').inner_text()
    pg.evaluate(VISIBILITY, 'hidden')
    pg.clock.set_system_time((pg.evaluate('() => Date.now()') + 754_000) / 1000)
    pg.wait_for_timeout(300)
    R['3_rien_ne_bouge_en_arriere_plan'] = tid(pg, 'bottle-session-clock').inner_text() == before
    pg.evaluate(VISIBILITY, 'visible'); pg.wait_for_timeout(400)
    shown = clock_seconds(tid(pg, 'bottle-session-clock').inner_text())
    exp = expected_seconds(pg, lina)
    R['3_temps_exact_au_retour'] = exp >= 754 and abs(shown - exp) <= 1
    R['_3_detail'] = f'affiché {shown} s, attendu {exp} s'
    pg.clock.resume()
    shot(pg, '04-retour-arriere-plan')

    # 4. Terminer : récapitulatif (panneau du bas), double appui = un seul enregistrement, résultat réel
    n_before = len([x for x in state(pg)['tables']['bottles'] if x['child_id'] == lina and not x.get('in_progress')])
    tid(pg, 'bottle-session-finish').click(); pg.wait_for_timeout(1200)
    R['4_recapitulatif_ouvert'] = tid(pg, 'bottle-recap-save').count() > 0
    pg.locator('[data-testid="bottle-recap-consumed"]').filter(visible=True).first.fill('90')
    shot(pg, '05-recapitulatif')
    save = tid(pg, 'bottle-recap-save')
    save.dblclick()
    pg.wait_for_timeout(2500)
    rows = [x for x in state(pg)['tables']['bottles'] if x['child_id'] == lina]
    R['4_un_seul_enregistrement'] = len([x for x in rows if not x.get('in_progress')]) == n_before + 1 and not any(x.get('in_progress') for x in rows)
    R['4_resultat_reel'] = '90 ml bus' in tid(pg, 'bottle-session').inner_text() and 'Enregistré' in tid(pg, 'bottle-session-state').inner_text() and tid(pg, 'bottle-session-result').count() > 0
    lab4, b4 = orb(pg)
    R['4_commande_revenue_meme_place'] = lab4 == 'Démarrer' and bool(b4) and abs(b4['x'] - b0['x']) < 0.5
    shot(pg, '06-resultat')

    # 5. Synthèse : période ; libellé + micrographique changent ensemble ; tuile → historique
    tiles = tid(pg, 'bottle-stats')
    tiles.scroll_into_view_if_needed(); pg.wait_for_timeout(300)
    lab_day = tid(pg, 'bottle-stats-count').get_attribute('aria-label') or ''
    sp_day = tiles.locator('[data-testid="sparkline"]').count()
    shot(pg, '07-tuiles-jour')
    tid(pg, 'bottle-stats-week').click(); pg.wait_for_timeout(700)
    lab_week = tid(pg, 'bottle-stats-count').get_attribute('aria-label') or ''
    sp_week = tiles.locator('[data-testid="sparkline"]').count()
    R['5_periode_libelle'] = 'aujourd’hui' in lab_day and '7 derniers jours' in lab_week
    R['_5_detail'] = f'jour: {lab_day} ({sp_day} micro) / semaine: {lab_week} ({sp_week} micro)'
    week_days = len({x['at'][:10] for x in state(pg)['tables']['bottles'] if x['child_id'] == lina})
    R['5_micrographique_seulement_si_donnees'] = (sp_week >= 1) == (week_days >= 2)
    shot(pg, '08-tuiles-semaine')
    pg.evaluate(WATCH_GHOST)
    tid(pg, 'bottle-stats-count').click(); pg.wait_for_timeout(600)
    R['5_tuile_morph'] = pg.evaluate('() => window.__ghost')
    pg.wait_for_timeout(2000)
    R['5_historique_semaine'] = '/bottle/history' in pg.url and 'view=week' in pg.url and tid(pg, 'bottle-history-week').count() > 0
    shot(pg, '09-historique-semaine')
    tid(pg, 'bottle-history-stats-day').click(); pg.wait_for_timeout(600)
    R['5_historique_lignes_mates'] = pg.locator('[data-testid^="bottle-history-row-"]').count() >= 1
    shot(pg, '10-historique-jour')
    # un jour sans biberon : état vide explicite
    empty_day = None
    for i in range(6, 0, -1):
        tid(pg, f'bottle-history-day-{i}').click(); pg.wait_for_timeout(500)
        if 'Aucun biberon' in pg.inner_text('body') and pg.locator('[data-testid^="bottle-history-row-"]').filter(visible=True).count() == 0:
            empty_day = i
            break
    R['5_etat_vide_jour'] = empty_day is not None or week_days >= 7
    if empty_day is not None:
        shot(pg, '11-historique-jour-vide')

    # 6. Doseur de mesurettes : commande ronde, compte exact
    pg.goto(B + '/bottle/scoops'); pg.wait_for_timeout(2500)
    tid(pg, 'sc-ratio').fill('30'); tid(pg, 'sc-water').fill('150'); pg.wait_for_timeout(500)
    R['6_resultat_tuile'] = '5' in tid(pg, 'sc-result').inner_text()
    tap = tid(pg, 'sc-tap')
    tb = tap.bounding_box()
    R['6_commande_ronde'] = bool(tb) and abs(tb['width'] - tb['height']) < 1
    for _ in range(5):
        tap.click(); pg.wait_for_timeout(120)
    R['6_compte_atteint'] = '5 / 5' in tid(pg, 'sc-count').inner_text() and 'C’est le compte' in tid(pg, 'sc-status').inner_text()
    shot(pg, '12-mesurettes')
    tid(pg, 'sc-water').fill('160'); pg.wait_for_timeout(400)
    R['6_pas_d_arrondi'] = 'ne tombe pas juste' in pg.inner_text('body')

    # 7. Texte agrandi 1,3 : aucun débordement horizontal
    for path, name in [('/bottle', '13-zoom-liste'), (f'/bottle/{lina}', '14-zoom-enfant'), (f'/bottle/history?child={lina}', '15-zoom-historique'), ('/bottle/scoops', '16-zoom-mesurettes')]:
        pg.goto(B + path); pg.wait_for_timeout(2800)
        pg.evaluate(ZOOM_TEXT); pg.wait_for_timeout(500)
        R[f'7_zoom_1_3_sans_debordement_{name[3:]}'] = no_hscroll(pg)
        shot(pg, name)
    ctx.close()

    # 8. Réduire les animations : pas de fantôme, session utilisable
    ctx2 = b.new_context(viewport={'width': 320, 'height': 568}, locale='fr-FR', timezone_id='Europe/Paris', reduced_motion='reduce')
    pg2 = ctx2.new_page()
    pg2.on('pageerror', lambda e: errs.append('PAGE2 ' + str(e)[:200]))
    start(pg2)
    lina2 = lina_of(pg2)
    reset_running(pg2, lina2)
    pg2.goto(B + '/bottle'); pg2.wait_for_timeout(2500)
    pg2.evaluate(WATCH_GHOST)
    tid(pg2, f'bottle-row-{lina2}').click(); pg2.wait_for_timeout(600)
    R['8_reduit_aucun_fantome'] = not pg2.evaluate('() => window.__ghost')
    pg2.wait_for_timeout(1500)
    _, rb0 = orb(pg2)
    tid(pg2, 'bottle-session-primary').click(); pg2.wait_for_timeout(1200)
    lab, rb1 = orb(pg2)
    R['8_reduit_session'] = lab == 'Pause' and bool(rb1) and abs(rb1['y'] - rb0['y']) < 0.5
    op = pg2.evaluate("() => { const e = document.querySelector('[data-testid=\"bottle-session\"]'); let n = e, o = 1; while (n) { o *= parseFloat(getComputedStyle(n).opacity || '1'); n = n.parentElement; } return o; }")
    R['8_reduit_ecran_entier'] = op > 0.99
    tid(pg2, 'bottle-session-finish').click(); pg2.wait_for_timeout(800)
    tid(pg2, 'bottle-recap-save').click(); pg2.wait_for_timeout(1800)
    R['8_reduit_enregistre'] = 'Enregistré' in tid(pg2, 'bottle-session-state').inner_text()
    shot(pg2, '17-reduit')
    ctx2.close()

    # 9. Captures : clair / sombre × Turquoise / Crépuscule (deviceScaleFactor 2, 320 × 568)
    for theme in ['dark', 'light']:
        for pal in ['turquoise', 'crepuscule']:
            c3 = b.new_context(viewport={'width': 320, 'height': 568}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2)
            p3 = c3.new_page()
            p3.on('pageerror', lambda e: errs.append('PAGE3 ' + str(e)[:200]))
            start(p3)
            p3.evaluate(APPEARANCE, {'theme': theme, 'palette': pal})
            l3 = lina_of(p3)
            for path, name in [('/bottle', 'liste'), (f'/bottle/{l3}', 'enfant'), (f'/bottle/history?child={l3}', 'historique'), ('/bottle/scoops', 'mesurettes')]:
                p3.goto(B + path); p3.wait_for_timeout(3200)
                p3.screenshot(path=f'{SHOTS}/{theme}-{pal}-{name}.png', full_page=False)
                if name in ('enfant', 'historique'):
                    for k, y in [(2, 560), (3, 1120)]:
                        p3.evaluate(f"(y) => {{ const e = ({SCROLLER})(); if (e) e.scrollTop = y; }}", y); p3.wait_for_timeout(500)
                        p3.screenshot(path=f'{SHOTS}/{theme}-{pal}-{name}-{k}.png')
            c3.close()
    b.close()

R['erreurs'] = errs[:8]
print(json.dumps(R, ensure_ascii=False, indent=1))
sys.exit(0 if all(v for k, v in R.items() if k != 'erreurs' and not k.startswith('_')) and not errs else 1)
