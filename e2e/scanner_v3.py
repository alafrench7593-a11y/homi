"""
Outil pilote « Scanner » (refonte v3, assistant en 4 étapes), démo web, petit écran 320 × 568.
Sur le web la caméra n'existe pas : saisie du code-barres et codes du catalogue de démonstration.
Vérifie : accueil (point focal « Nouvelle analyse ») → assistant Identifier / Confirmer / Pour qui / Préciser ; clavier
ouvert (fenêtre réduite de 260 px, comme un clavier) : le bouton principal reste visible ; retour à l'étape précédente
(flèche ronde, segment de progression, flèche de l'en-tête) en CONSERVANT la saisie ; analyse réelle enregistrée puis
fiche résultat (verdict en point focal, tuiles réelles) ; produit inconnu explicite ; historique (surface mate,
sélecteur) → fiche via morph → retour ; comparaison lisible (tableau) ; alertes de rappel gratuites ; texte agrandi
1,3 sans débordement horizontal ; Réduire les animations (étape et fiche affichées immédiatement) ; captures clair /
sombre × Turquoise / Crépuscule (deviceScaleFactor 2).
Usage :
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/homi-p3/dist
  python3 e2e/spa_server.py /tmp/homi-p3/dist 8951 &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8951 E2E_SHOTS=/tmp/homi-p3/shots python3 e2e/scanner_v3.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import glob, json, os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import PREMIUM_ON  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8951')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/homi-p3/shots')
EXE = os.environ.get('PW_CHROMIUM') or None
if EXE and os.path.isdir(EXE):
    EXE = (glob.glob(os.path.join(EXE, '**', 'chrome'), recursive=True) or [EXE])[0]
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
W, H, KB = 320, 568, 260

ZOOM_TEXT = """() => { for (const el of document.querySelectorAll('div[dir], span, div')) {
  if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
  const cs = getComputedStyle(el); const fs = parseFloat(cs.fontSize); if (!fs || el.dataset.z) continue;
  el.dataset.z = '1'; el.style.fontSize = (fs * 1.3) + 'px'; const lh = parseFloat(cs.lineHeight); if (lh) el.style.lineHeight = (lh * 1.3) + 'px'; } }"""
APPEARANCE = """(p) => { const ui = JSON.parse(localStorage.getItem('toietmoi.ui') || '{"state":{},"version":0}'); ui.state.themePreference = p.theme; ui.state.palettePreference = p.palette;
  if (ui.state.appearanceOwner) { ui.state.appearanceByUser = ui.state.appearanceByUser || {}; ui.state.appearanceByUser[ui.state.appearanceOwner] = { theme: p.theme, palette: p.palette }; }
  localStorage.setItem('toietmoi.ui', JSON.stringify(ui)); }"""


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def shot(pg, name):
    pg.wait_for_timeout(500)
    pg.screenshot(path=f'{SHOTS}/{name}.png')


def no_hscroll(pg):
    return pg.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1")


def in_view(pg, t):
    b = tid(pg, t).bounding_box()
    vp = pg.viewport_size
    return bool(b) and b['y'] >= 0 and b['y'] + b['height'] <= vp['height'] + 1 and b['x'] >= 0 and b['x'] + b['width'] <= vp['width'] + 1


def disabled(pg, t):
    return tid(pg, t).get_attribute('aria-disabled') == 'true'


def keyboard_open(pg, field):
    """Champ actif + fenêtre réduite de la hauteur d'un clavier : le bouton principal doit rester visible."""
    tid(pg, field).click(); pg.wait_for_timeout(150)
    pg.set_viewport_size({'width': W, 'height': H - KB}); pg.wait_for_timeout(500)


def keyboard_close(pg):
    pg.set_viewport_size({'width': W, 'height': H}); pg.wait_for_timeout(400)


def start(pg):
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate(PREMIUM_ON); pg.goto(B + '/'); pg.wait_for_timeout(3000)


def scans(pg):
    return pg.evaluate("() => (JSON.parse(localStorage.getItem('toietmoi.demo.v1')).tables.product_scans || [])")


def progress(pg):
    return tid(pg, 'scan-progress').inner_text()


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)
    ctx = b.new_context(viewport={'width': W, 'height': H}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2)
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'Failed to load resource' not in m.text and 'sb.fake.test' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    start(pg)
    n0 = len(scans(pg))

    # 1. Entrée : accueil du scanner, point focal visible
    pg.goto(B + '/scanner'); pg.wait_for_timeout(2500)
    R['accueil_focal_visible'] = in_view(pg, 'scanner-new')
    shot(pg, '01-accueil')
    tid(pg, 'scanner-entry-product').click(); pg.wait_for_timeout(2000)
    R['assistant_etape_1'] = '/scanner/product' in pg.url and 'Étape 1 sur 4' in progress(pg)
    R['rechercher_desactive_vide'] = disabled(pg, 'scan-search')

    # 2. Saisie, clavier ouvert : bouton principal visible
    keyboard_open(pg, 'scan-query')
    pg.keyboard.type('0000000000062'); pg.wait_for_timeout(300)
    R['clavier_bouton_visible_etape1'] = in_view(pg, 'scan-search') and not disabled(pg, 'scan-search')
    shot(pg, '02-identifier-clavier')
    keyboard_close(pg)
    tid(pg, 'scan-search').click(); pg.wait_for_timeout(1500)
    R['etape_confirmer'] = tid(pg, 'scan-step-confirm').count() > 0 and 'Étape 2 sur 4' in progress(pg)
    R['produit_preselectionne'] = tid(pg, 'scan-candidate-0').get_attribute('aria-checked') == 'true'
    R['bouton_confirmer_visible'] = in_view(pg, 'scan-confirm')
    shot(pg, '03-confirmer')

    # 3. Retour (flèche ronde) : la saisie est conservée
    tid(pg, 'scan-prev').click(); pg.wait_for_timeout(800)
    R['retour_conserve_code'] = tid(pg, 'scan-query').input_value() == '0000000000062' and 'Étape 1 sur 4' in progress(pg)
    tid(pg, 'scan-search').click(); pg.wait_for_timeout(1500)
    pg.evaluate("() => { const e = [...document.querySelectorAll('[data-testid=\"scan-scroll\"]')].pop(); if (e) e.scrollTop = 10 ** 6; }"); pg.wait_for_timeout(300)
    tid(pg, 'scan-confirm').click(); pg.wait_for_timeout(900)
    R['nouvelle_etape_en_haut'] = in_view(pg, 'scan-progress')
    R['etape_pour_qui'] = tid(pg, 'scan-step-profile').count() > 0 and 'Étape 3 sur 4' in progress(pg)
    tid(pg, 'scan-profile-baby').click(); pg.wait_for_timeout(300)
    R['continuer_desactive_sans_age'] = disabled(pg, 'scan-next')
    keyboard_open(pg, 'scan-age')
    pg.keyboard.type('6'); pg.wait_for_timeout(300)
    R['clavier_bouton_visible_etape3'] = in_view(pg, 'scan-next') and not disabled(pg, 'scan-next')
    shot(pg, '04-pour-qui-clavier')
    keyboard_close(pg)
    tid(pg, 'scan-allergies').fill('lait de vache'); pg.wait_for_timeout(200)
    tid(pg, 'scan-next').click(); pg.wait_for_timeout(900)
    R['etape_preciser'] = tid(pg, 'scan-step-details').count() > 0 and 'Étape 4 sur 4' in progress(pg)
    R['ingredients_base_produit'] = len(tid(pg, 'scan-ingredients').input_value()) > 0
    tid(pg, 'scan-ingredients').fill('')
    keyboard_open(pg, 'scan-ingredients')
    pg.keyboard.type('Aqua, Glycerin, Parfum'); pg.wait_for_timeout(300)
    R['clavier_bouton_visible_etape4'] = in_view(pg, 'scan-analyse')
    shot(pg, '05-preciser-clavier')
    keyboard_close(pg)

    # 4. Flèche de l'en-tête : étape précédente, saisie conservée ; segment de progression : retour au début
    pg.locator('[aria-label="Retour"]').filter(visible=True).first.click(); pg.wait_for_timeout(900)
    R['fleche_entete_etape_precedente'] = '/scanner/product' in pg.url and tid(pg, 'scan-step-profile').count() > 0
    R['retour_conserve_age_allergies'] = tid(pg, 'scan-age').input_value() == '6' and tid(pg, 'scan-allergies').input_value() == 'lait de vache'
    tid(pg, 'scan-next').click(); pg.wait_for_timeout(900)
    R['retour_conserve_ingredients'] = tid(pg, 'scan-ingredients').input_value() == 'Aqua, Glycerin, Parfum'
    tid(pg, 'scan-progress-seg-0').click(); pg.wait_for_timeout(900)
    R['progression_retour_etape1'] = tid(pg, 'scan-step-identify').count() > 0 and tid(pg, 'scan-query').input_value() == '0000000000062'
    tid(pg, 'scan-search').click(); pg.wait_for_timeout(1500)
    tid(pg, 'scan-confirm').click(); pg.wait_for_timeout(900)
    tid(pg, 'scan-next').click(); pg.wait_for_timeout(900)
    R['meme_produit_precisions_conservees'] = tid(pg, 'scan-ingredients').input_value() == 'Aqua, Glycerin, Parfum'

    # 5. Action : analyse réelle enregistrée → fiche résultat (verdict, tuiles)
    tid(pg, 'scan-analyse').click(); pg.wait_for_timeout(3500)
    rid = pg.url.rstrip('/').split('/')[-1]
    saved = [s for s in scans(pg) if s['id'] == rid]
    R['analyse_enregistree'] = '/scanner/result/' in pg.url and len(scans(pg)) == n0 + 1 and bool(saved) and bool(saved[0].get('verdict'))
    R['resultat_verdict_focal'] = tid(pg, 'scan-verdict').count() > 0 and in_view(pg, 'scan-verdict') is not None
    R['tuiles_resultat'] = all(tid(pg, f'scan-tile-{k}').count() > 0 for k in ['allergens', 'watch', 'recalls', 'source'])
    body = pg.inner_text('body')
    R['tuile_source_datee'] = 'Source vérifiée le' in body
    R['aucune_note'] = '/100' not in body and '/ 100' not in body
    shot(pg, '06-resultat')
    tid(pg, 'scan-tiles').scroll_into_view_if_needed(); shot(pg, '07-resultat-tuiles')

    # 6. Produit inconnu : explicite, il faut le nommer
    pg.goto(B + '/scanner/product'); pg.wait_for_timeout(2500)
    tid(pg, 'scan-query').fill('4006381333931'); pg.wait_for_timeout(200)
    tid(pg, 'scan-search').click(); pg.wait_for_timeout(1500)
    R['produit_inconnu_explicite'] = tid(pg, 'scan-unknown').count() > 0 and 'Code-barres lu : 4006381333931' in tid(pg, 'scan-unknown').inner_text()
    R['inconnu_bouton_desactive'] = disabled(pg, 'scan-confirm')
    shot(pg, '08-inconnu')
    tid(pg, 'scan-manual-name').fill('Surligneur'); pg.wait_for_timeout(300)
    # 320 px : le libellé complet ne tient pas sur une ligne → libellé court « Continuer » (audit 09) ; le lecteur
    # d'écran lit toujours « Continuer avec ce nom »
    btn = tid(pg, 'scan-confirm')
    R['inconnu_nomme_active'] = (not disabled(pg, 'scan-confirm') and (btn.get_attribute('aria-label') or '') == 'Continuer avec ce nom'
                                 and btn.inner_text().strip() in ('Continuer avec ce nom', 'Continuer'))

    # 7. Aliment (démo) jusqu'au résultat
    pg.goto(B + '/scanner/food'); pg.wait_for_timeout(2500)
    tid(pg, 'scan-demo-0000000000024').click(); pg.wait_for_timeout(1500)
    tid(pg, 'scan-confirm').click(); pg.wait_for_timeout(900)
    tid(pg, 'scan-profile-pregnant').click(); pg.wait_for_timeout(300)
    tid(pg, 'scan-next').click(); pg.wait_for_timeout(900)
    shot(pg, '09-aliment-questions')
    tid(pg, 'scan-analyse').click(); pg.wait_for_timeout(3500)
    R['aliment_resultat'] = '/scanner/result/' in pg.url and tid(pg, 'scan-tile-watch').count() > 0
    shot(pg, '10-aliment-resultat')

    # 8. Historique (mate, sélecteur) → fiche (morph) → retour
    pg.goto(B + '/scanner/history'); pg.wait_for_timeout(2800)
    R['historique_ligne'] = tid(pg, f'scan-row-{rid}').count() > 0
    tid(pg, 'scan-filter-food').click(); pg.wait_for_timeout(500)
    R['filtre_aliments'] = tid(pg, f'scan-row-{rid}').count() == 0 and tid(pg, 'scan-filter-food').get_attribute('aria-checked') == 'true'
    tid(pg, 'scan-filter-all').click(); pg.wait_for_timeout(500)
    shot(pg, '11-historique')
    tid(pg, f'scan-open-{rid}').click(); pg.wait_for_timeout(250)
    shot(pg, '12-morph-en-cours')
    pg.wait_for_timeout(1500)
    R['historique_vers_fiche'] = f'/scanner/result/{rid}' in pg.url and tid(pg, 'scan-verdict').count() > 0
    pg.go_back(); pg.wait_for_timeout(1800)
    R['retour_historique'] = '/scanner/history' in pg.url and tid(pg, f'scan-row-{rid}').count() > 0

    # 9. Comparaison lisible
    pg.goto(B + '/scanner/compare'); pg.wait_for_timeout(2500)
    picks = pg.locator('[data-testid^="compare-pick-"]').filter(visible=True)
    picks.first.click(); pg.wait_for_timeout(600)
    pg.locator('[data-testid^="compare-pick-"]').filter(visible=True).first.click(); pg.wait_for_timeout(1500)
    R['comparaison_tableau'] = tid(pg, 'compare-table').count() > 0 and tid(pg, 'compare-row-for').count() > 0
    shot(pg, '13-comparaison')
    tid(pg, 'compare-table').scroll_into_view_if_needed(); shot(pg, '14-comparaison-tableau')

    # 10. Alertes de rappel officielles, gratuites
    pg.goto(B + '/scanner/recalls'); pg.wait_for_timeout(2500)
    R['rappels_accessibles'] = in_view(pg, 'rc-check') and 'Premium' not in tid(pg, 'rc-check').inner_text()
    tid(pg, 'rc-check').click(); pg.wait_for_timeout(1500)
    shot(pg, '15-rappels')

    # 11. Texte agrandi 1,3 : aucun débordement horizontal
    for path, name in [('/scanner', 'accueil'), ('/scanner/product', 'assistant'), (f'/scanner/result/{rid}', 'resultat'), ('/scanner/history', 'historique'), ('/scanner/compare', 'comparaison')]:
        pg.goto(B + path); pg.wait_for_timeout(2500)
        pg.evaluate(ZOOM_TEXT); pg.wait_for_timeout(500)
        R[f'zoom_1_3_{name}'] = no_hscroll(pg)
        if name == 'assistant':
            R['zoom_1_3_bouton_visible'] = in_view(pg, 'scan-search')
        shot(pg, f'16-zoom-{name}')
    ctx.close()

    # 12. Réduire les animations : étape et fiche affichées immédiatement, sans fantôme
    ctx2 = b.new_context(viewport={'width': W, 'height': H}, locale='fr-FR', timezone_id='Europe/Paris', reduced_motion='reduce', device_scale_factor=2)
    pg2 = ctx2.new_page()
    pg2.on('pageerror', lambda e: errs.append('PAGE2 ' + str(e)[:200]))
    start(pg2)
    pg2.goto(B + '/scanner/product'); pg2.wait_for_timeout(2500)
    tid(pg2, 'scan-demo-0000000000062').click(); pg2.wait_for_timeout(500)
    op = pg2.evaluate("() => { const e = [...document.querySelectorAll('[data-testid=\"scan-step-confirm\"]')].pop(); return e ? getComputedStyle(e).opacity + '|' + getComputedStyle(e).transform : ''; }")
    R['reduit_etape_immediate'] = op.startswith('1|') and ('none' in op or 'matrix(1, 0, 0, 1, 0, 0)' in op)
    shot(pg2, '17-reduit-confirmer')
    tid(pg2, 'scan-confirm').click(); pg2.wait_for_timeout(600)
    tid(pg2, 'scan-profile-adult').click(); pg2.wait_for_timeout(200)
    tid(pg2, 'scan-next').click(); pg2.wait_for_timeout(600)
    tid(pg2, 'scan-analyse').click(); pg2.wait_for_timeout(3000)
    pg2.goto(B + '/scanner/history'); pg2.wait_for_timeout(2500)
    first = pg2.locator('[data-testid^="scan-open-"]').filter(visible=True).first
    first.click(); pg2.wait_for_timeout(200)
    sc = pg2.evaluate("() => { const e = [...document.querySelectorAll('[data-testid=\"scan-result-scene\"]')].pop(); return e ? getComputedStyle(e).opacity : '0'; }")
    R['reduit_fiche_immediate'] = sc == '1'
    ctx2.close()

    # 13. Captures clair / sombre × Turquoise / Crépuscule (390 × 844, deviceScaleFactor 2)
    c3 = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2)
    p3 = c3.new_page()
    p3.on('pageerror', lambda e: errs.append('PAGE3 ' + str(e)[:200]))
    start(p3)
    p3.goto(B + '/scanner/product'); p3.wait_for_timeout(2500)
    tid(p3, 'scan-demo-0000000000079').click(); p3.wait_for_timeout(1500)
    tid(p3, 'scan-confirm').click(); p3.wait_for_timeout(800)
    tid(p3, 'scan-profile-adult').click() if tid(p3, 'scan-profile-adult').count() else None
    tid(p3, 'scan-next').click(); p3.wait_for_timeout(800)
    tid(p3, 'scan-analyse').click(); p3.wait_for_timeout(3500)
    rid3 = p3.url.rstrip('/').split('/')[-1]
    for theme, pal in [('light', 'turquoise'), ('dark', 'turquoise'), ('light', 'crepuscule'), ('dark', 'crepuscule')]:
        p3.evaluate(APPEARANCE, {'theme': theme, 'palette': pal})
        for path, name in [('/scanner', 'accueil'), ('/scanner/product', 'assistant'), (f'/scanner/result/{rid3}', 'resultat'), ('/scanner/history', 'historique'), ('/scanner/compare', 'comparaison')]:
            p3.goto(B + path); p3.wait_for_timeout(2800)
            p3.screenshot(path=f'{SHOTS}/{theme}-{pal}-{name}.png')
        p3.goto(B + f'/scanner/result/{rid3}'); p3.wait_for_timeout(2500)
        tid(p3, 'scan-tiles').scroll_into_view_if_needed(); p3.wait_for_timeout(400)
        p3.screenshot(path=f'{SHOTS}/{theme}-{pal}-tuiles.png')
    c3.close()
    b.close()

R['erreurs'] = errs[:8]
print(json.dumps(R, ensure_ascii=False, indent=1))
sys.exit(0 if all(v for k, v in R.items() if k != 'erreurs') and not errs else 1)
