"""
« Découvrir HOMI » (/discover) dans un navigateur réel : première ouverture → ouverture → chapitre → catalogue →
trois démos (rejouer, lien vers la vraie destination, retour à la même tuile), Précédent / Suivant / Passer /
Commencer, relance depuis Réglages, données de démo isolées, Réduire les animations ; captures clair / sombre
(deviceScaleFactor 2). Vidéo (webm) de l'ouverture : e2e/decouvrir_homi_video.js (Playwright Node).

  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/discover/dist
  python3 e2e/spa_server.py /tmp/discover/dist 19347 &
  NAV_URL=http://127.0.0.1:19347 PW_CHROMIUM=/opt/pw-browsers/chromium python3 e2e/decouvrir_homi.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, time
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:19347')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/discover/shots')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
CHROMIUM = os.environ.get('PW_CHROMIUM')
TID = lambda t: f'[data-testid="{t}"]'


def ctx_for(p, reduce=False, dark=False):
    b = p.chromium.launch(executable_path=CHROMIUM) if CHROMIUM else p.chromium.launch()
    opts = dict(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='fr-FR', timezone_id='Europe/Paris',
                reduced_motion='reduce' if reduce else 'no-preference', color_scheme='dark' if dark else 'light')
    ctx = b.new_context(**opts)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    return b, ctx, pg


def wait_url(pg, pred, timeout):
    t = time.time()
    while time.time() - t < timeout:
        if pred(pg.url): return time.time() - t
        pg.wait_for_timeout(50)
    return None


def visible(pg, sel):
    loc = pg.locator(sel)
    return loc.count() > 0 and loc.first.is_visible()


def click(pg, tid):
    pg.locator(TID(tid)).first.click()


def body_text(pg):
    return pg.locator('body').inner_text()


def run(p):
    # ------------------------------------------------------------------ 1. première ouverture (clair) + vidéo de l'ouverture
    b, ctx, pg = ctx_for(p)
    pg.goto(B + '/')
    R['premiere_ouverture_vers_discover'] = wait_url(pg, lambda u: '/discover' in u, 8) is not None
    pg.wait_for_selector(TID('discover-opening'), timeout=8000)
    pg.wait_for_timeout(900)
    pg.screenshot(path=f'{SHOTS}/clair-01-ouverture-mot.png')
    pg.wait_for_timeout(1500)
    pg.screenshot(path=f'{SHOTS}/clair-02-ouverture-panneau.png')
    pg.wait_for_timeout(3200)
    pg.screenshot(path=f'{SHOTS}/clair-03-ouverture-scenes.png')
    txt = body_text(pg)
    R['ouverture_trois_scenes'] = all(s in txt for s in ['Semaine 24', 'Biberons du jour', 'Sam s’en occupe'])
    R['boutons_toujours_la'] = all(visible(pg, TID(t)) for t in ['discover-skip', 'discover-catalog', 'discover-prev', 'discover-next'])
    R['marquee_vue'] = json.loads(pg.evaluate("() => localStorage.getItem('toietmoi.ui')") or '{}').get('state', {}).get('cinematicSeen') is True
    # chapitres : Suivant, geste horizontal, Précédent
    click(pg, 'discover-next'); pg.wait_for_timeout(700)
    R['chapitre_cycle'] = visible(pg, TID('discover-chapter-cycle'))
    pg.wait_for_timeout(2200)
    pg.screenshot(path=f'{SHOTS}/clair-04-chapitre-cycle.png')
    box = pg.locator(TID('discover-stage')).bounding_box()
    pg.mouse.move(box['x'] + box['width'] * 0.8, box['y'] + 120); pg.mouse.down()
    for i in range(8): pg.mouse.move(box['x'] + box['width'] * (0.8 - 0.07 * (i + 1)), box['y'] + 122, steps=2)
    pg.mouse.up(); pg.wait_for_timeout(700)
    R['geste_vers_grossesse'] = visible(pg, TID('discover-chapter-pregnancy'))
    if not R['geste_vers_grossesse']: click(pg, 'discover-next'); pg.wait_for_timeout(600)
    click(pg, 'discover-prev'); pg.wait_for_timeout(600)
    R['precedent'] = visible(pg, TID('discover-chapter-cycle'))
    for _ in range(5): click(pg, 'discover-next'); pg.wait_for_timeout(450)
    R['chapitre_famille'] = visible(pg, TID('discover-chapter-family'))
    pg.wait_for_timeout(2400)
    pg.screenshot(path=f'{SHOTS}/clair-05-chapitre-famille.png')
    for _ in range(3): click(pg, 'discover-next'); pg.wait_for_timeout(450)
    R['fin_phrase'] = 'La vie de famille, dès les premiers battements.' in body_text(pg) and visible(pg, TID('discover-start'))
    pg.screenshot(path=f'{SHOTS}/clair-06-fin.png')
    b.close()

    # ------------------------------------------------------------------ 2. catalogue et trois démos (sans compte)
    b, ctx, pg = ctx_for(p)
    pg.goto(B + '/'); wait_url(pg, lambda u: '/discover' in u, 8); pg.wait_for_timeout(600)
    click(pg, 'discover-catalog')
    R['catalogue_ouvert'] = wait_url(pg, lambda u: '/discover/tools' in u, 5) is not None
    pg.wait_for_timeout(1200)
    R['catalogue_144_tuiles'] = pg.locator('[data-testid^="discover-tile-"]').count() == 144
    pg.screenshot(path=f'{SHOTS}/clair-07-catalogue.png')
    demos = [('baby_bottle', '5 biberons'), ('family_tasks', 'Fait par Sam'), ('ask', 'Une réponse arrive')]
    for key, expected in demos:
        tile = pg.locator(TID(f'discover-tile-{key}')).first
        tile.scroll_into_view_if_needed(); pg.wait_for_timeout(250)
        y0 = tile.bounding_box()['y']
        tile.click()
        R[f'demo_{key}_ouverte'] = wait_url(pg, lambda u: f'/discover/tool/{key}' in u, 5) is not None
        pg.wait_for_timeout(160)
        if key == 'baby_bottle': pg.screenshot(path=f'{SHOTS}/clair-08-morph-tuile.png')
        pg.wait_for_timeout(2600)
        R[f'demo_{key}_resultat'] = expected in body_text(pg)
        R[f'demo_{key}_acces'] = visible(pg, TID('discover-access'))
        R[f'demo_{key}_lien'] = visible(pg, TID('discover-tool-link'))
        if key == 'baby_bottle': pg.screenshot(path=f'{SHOTS}/clair-09-demo-biberon.png')
        click(pg, 'discover-replay'); pg.wait_for_timeout(250)
        R[f'demo_{key}_rejouer_doigt'] = visible(pg, TID('demo-finger'))
        pg.wait_for_timeout(2400)
        R[f'demo_{key}_rejoue_resultat'] = expected in body_text(pg)
        if key == 'family_tasks': pg.screenshot(path=f'{SHOTS}/clair-10-demo-taches.png')
        pg.go_back(); wait_url(pg, lambda u: u.rstrip('/').endswith('/discover/tools'), 5); pg.wait_for_timeout(700)
        y1 = pg.locator(TID(f'discover-tile-{key}')).first.bounding_box()['y']
        R[f'demo_{key}_retour_meme_position'] = abs(y1 - y0) < 4
    # Suivant / Précédent entre démos
    pg.locator(TID('discover-tile-family_missions')).first.click(); wait_url(pg, lambda u: 'family_missions' in u, 5); pg.wait_for_timeout(800)
    u0 = pg.locator(TID('discover-tool-usage')).first.inner_text()
    click(pg, 'discover-tool-next'); pg.wait_for_timeout(500)
    u1 = pg.locator(TID('discover-tool-usage')).first.inner_text()
    click(pg, 'discover-tool-prev'); pg.wait_for_timeout(500)
    u2 = pg.locator(TID('discover-tool-usage')).first.inner_text()
    R['demo_suivant_precedent'] = u0 != u1 and u2 == u0
    pg.go_back(); wait_url(pg, lambda u: u.rstrip('/').endswith('/discover/tools'), 5); pg.wait_for_timeout(500)
    click(pg, 'discover-catalog-start')
    R['commencer_premiere_ouverture'] = wait_url(pg, lambda u: '/intro' in u or '/welcome' in u, 6) is not None
    pg.goto(B + '/'); pg.wait_for_timeout(2500)
    R['pas_rejouee_a_l_ouverture'] = '/discover' not in pg.url
    b.close()

    # « Passer »
    b, ctx, pg = ctx_for(p)
    pg.goto(B + '/'); wait_url(pg, lambda u: '/discover' in u, 8); pg.wait_for_timeout(400)
    t = time.time(); click(pg, 'discover-skip')
    R['passer_rapide'] = wait_url(pg, lambda u: '/discover' not in u, 3) is not None and time.time() - t < 2
    b.close()

    # ------------------------------------------------------------------ 3. relance depuis Réglages (démonstration sans compte), lien réel, isolation
    b, ctx, pg = ctx_for(p)
    pg.goto(B + '/discover'); pg.wait_for_timeout(500)
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.ui') || '{\"state\":{},\"version\":0}'); s.state.cinematicSeen = true; s.state.introSeen = true; localStorage.setItem('toietmoi.ui', JSON.stringify(s)); }")
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_role('button', name='Découvrir sans compte').click(); pg.wait_for_timeout(4000)
    pg.goto(B + '/settings'); pg.wait_for_timeout(2500)
    row = pg.locator(TID('settings-discover')).first
    row.scroll_into_view_if_needed()
    R['reglages_ligne_decouvrir'] = row.is_visible() and 'Découvrir HOMI' in row.inner_text()
    pg.screenshot(path=f'{SHOTS}/clair-11-reglages.png')
    demo_before = pg.evaluate("() => localStorage.getItem('toietmoi.demo.v1')")
    row.click()
    R['relance_depuis_reglages'] = wait_url(pg, lambda u: '/discover' in u and 'replay=1' in u, 5) is not None
    pg.wait_for_timeout(1500)
    click(pg, 'discover-catalog'); wait_url(pg, lambda u: '/discover/tools' in u, 5); pg.wait_for_timeout(800)
    pg.locator(TID('discover-tile-family_missions')).first.click(); wait_url(pg, lambda u: 'family_missions' in u, 5); pg.wait_for_timeout(2600)
    click(pg, 'discover-replay'); pg.wait_for_timeout(200)
    pg.locator(TID('demo-target')).first.click(); pg.wait_for_timeout(500)
    R['geste_reel_applique'] = 'Sam s’en occupe' in body_text(pg)
    demo_after = pg.evaluate("() => localStorage.getItem('toietmoi.demo.v1')")
    R['demonstration_du_foyer_intacte'] = demo_before is not None and demo_before == demo_after
    click(pg, 'discover-tool-link')
    R['lien_vraie_destination'] = wait_url(pg, lambda u: u.split('?')[0].rstrip('/').endswith('/family/missions'), 5) is not None
    pg.go_back(); wait_url(pg, lambda u: '/discover/tool/' in u, 5); pg.wait_for_timeout(500)
    pg.go_back(); wait_url(pg, lambda u: u.split('?')[0].rstrip('/').endswith('/discover/tools'), 5); pg.wait_for_timeout(500)
    click(pg, 'discover-catalog-start')
    R['commencer_relance_retour_reglages'] = wait_url(pg, lambda u: u.split('?')[0].rstrip('/').endswith('/settings'), 5) is not None
    b.close()

    # ------------------------------------------------------------------ 4. Réduire les animations
    b, ctx, pg = ctx_for(p, reduce=True)
    pg.goto(B + '/'); wait_url(pg, lambda u: '/discover' in u, 8)
    pg.wait_for_selector(TID('discover-opening'), timeout=8000); pg.wait_for_timeout(150)
    txt = body_text(pg)
    R['reduit_ouverture_complete_tout_de_suite'] = all(s in txt for s in ['Semaine 24', 'Biberons du jour', 'Sam s’en occupe', 'Une seule app pour toute la famille.'])
    pg.screenshot(path=f'{SHOTS}/reduit-01-ouverture.png')
    click(pg, 'discover-next'); pg.wait_for_timeout(120)
    R['reduit_chapitre_direct'] = visible(pg, TID('discover-chapter-cycle'))
    R['reduit_sans_doigt'] = pg.locator(TID('demo-finger')).count() == 0
    pg.goto(B + '/discover/tool/family_stocks'); pg.wait_for_timeout(1500)
    R['reduit_demo_resultat_immediat'] = 'Ajouté à la liste de courses' in body_text(pg) and pg.locator(TID('demo-finger')).count() == 0
    click(pg, 'discover-replay'); pg.wait_for_timeout(150)
    R['reduit_rejouer_consigne'] = visible(pg, TID('demo-wait-hint'))
    pg.locator(TID('demo-target')).first.click(); pg.wait_for_timeout(200)
    R['reduit_geste_applique'] = 'Ajouté à la liste de courses' in body_text(pg) and not visible(pg, TID('demo-wait-hint'))
    pg.screenshot(path=f'{SHOTS}/reduit-02-demo.png')
    b.close()

    # ------------------------------------------------------------------ 5. sombre
    b, ctx, pg = ctx_for(p, dark=True)
    pg.goto(B + '/'); wait_url(pg, lambda u: '/discover' in u, 8); pg.wait_for_timeout(6000)
    pg.screenshot(path=f'{SHOTS}/sombre-01-ouverture.png')
    for _ in range(6): click(pg, 'discover-next'); pg.wait_for_timeout(450)
    pg.wait_for_timeout(2400)
    pg.screenshot(path=f'{SHOTS}/sombre-02-chapitre-famille.png')
    click(pg, 'discover-catalog'); wait_url(pg, lambda u: '/discover/tools' in u, 5); pg.wait_for_timeout(1200)
    pg.screenshot(path=f'{SHOTS}/sombre-03-catalogue.png')
    pg.locator(TID('discover-tile-scan_product')).first.click(); wait_url(pg, lambda u: 'scan_product' in u, 5); pg.wait_for_timeout(2800)
    R['sombre_demo_scanner'] = 'Convient' in body_text(pg)
    pg.screenshot(path=f'{SHOTS}/sombre-04-demo-scanner.png')
    pg.goto(B + '/discover/tool/kid_mood'); pg.wait_for_timeout(3200)
    pg.screenshot(path=f'{SHOTS}/sombre-05-demo-humeur.png')
    for _ in range(3): click(pg, 'discover-tool-next'); pg.wait_for_timeout(300)
    b.close()


with sync_playwright() as p:
    try:
        run(p)
    except Exception as e:  # le rapport s'affiche toujours, avec l'étape qui a échoué
        R['exception'] = str(e)[:300]
R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
