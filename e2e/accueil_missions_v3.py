"""
Tranche intégrée « Accueil + détail + Missions » (16/11/2026), démo web, petit écran 320 × 568.
Vérifie : la prochaine action en point focal visible sans défiler ; prénoms partout (jamais « Coparent ») ; terminer une
tâche par la case à cocher (serveur émulé « fait », statut « Fait », puis la ligne rejoint la fin de l'agenda) ; ouvrir un
détail depuis une ligne et revenir à la MÊME position de défilement (et la même ligne) ; la barre du bas ne masque pas le
dernier contenu ; créer une mission en étapes (le retour conserve la saisie) ; l'accepter côté Sam (« Demandée par
Camille », « Camille vous demande ») ; stocks d'exemple non vides ; pastille démo compacte ; texte agrandi 1,3 sans
débordement horizontal ; Réduire les animations ; captures clair / sombre (deviceScaleFactor 2).
Usage :
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/homi-tr/dist
  python3 e2e/spa_server.py /tmp/homi-tr/dist 8911 &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8911 E2E_SHOTS=/tmp/homi-tr/v3 python3 e2e/accueil_missions_v3.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import glob, json, os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import PREMIUM_ON  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8911')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/homi-tr/v3')
EXE = os.environ.get('PW_CHROMIUM') or None
if EXE and os.path.isdir(EXE):
    EXE = (glob.glob(os.path.join(EXE, '**', 'chrome'), recursive=True) or [EXE])[0]
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
BATH = 'Donner le bain de Lina'
PICKUP = 'Récupérer Lina à la crèche'
KIBBLE = 'Acheter des croquettes'

# Texte agrandi : chaque texte rendu passe à 130 % (taille et interlignage), comme un réglage d'accessibilité
ZOOM_TEXT = """() => { for (const el of document.querySelectorAll('div[dir], span, div')) {
  if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
  const cs = getComputedStyle(el); const fs = parseFloat(cs.fontSize); if (!fs || el.dataset.z) continue;
  el.dataset.z = '1'; el.style.fontSize = (fs * 1.3) + 'px'; const lh = parseFloat(cs.lineHeight); if (lh) el.style.lineHeight = (lh * 1.3) + 'px'; } }"""
SCROLLER = """() => { const els = [...document.querySelectorAll('div')].filter((e) => { const s = getComputedStyle(e); return (s.overflowY === 'auto' || s.overflowY === 'scroll') && e.scrollHeight > e.clientHeight + 4 && e.getBoundingClientRect().height > 300; });
  return els.length ? els[els.length - 1] : null; }"""


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def shot(pg, name):
    pg.wait_for_timeout(600)
    pg.screenshot(path=f'{SHOTS}/{name}.png')


def state(pg):
    return pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.demo.v1'))")


def task(pg, title):
    return next((t for t in state(pg)['tables'].get('family_tasks', []) if t['title'] == title), None)


def scroll_top(pg):
    return pg.evaluate(f"() => {{ const e = ({SCROLLER})(); return e ? e.scrollTop : -1; }}")


def scroll_by(pg, y):
    pg.evaluate(f"(y) => {{ const e = ({SCROLLER})(); if (e) e.scrollTop = y; }}", y)


def no_hscroll(pg):
    return pg.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1")


def start(pg):
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate(PREMIUM_ON); pg.goto(B + '/'); pg.wait_for_timeout(4000)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)
    ctx = b.new_context(viewport={'width': 320, 'height': 568}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'Failed to load resource' not in m.text and 'sb.fake.test' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    start(pg)
    me = state(pg)['session']['userId']

    # 1. Point focal visible sans défiler, prénoms
    foc = tid(pg, 'today-emphasis')
    box = foc.bounding_box() if foc.count() else None
    R['focal_visible_sans_defiler'] = bool(box) and box['y'] + 60 < 568
    R['un_seul_bouton_plein_dans_le_focal'] = foc.count() > 0 and foc.locator('[role="button"]').filter(has_text='J’accepte').count() == 1
    home_txt = tid(pg, 'home-today').inner_text()
    R['prenoms_accueil'] = 'Sam' in home_txt and 'Camille' in home_txt and 'Coparent' not in home_txt
    shot(pg, '01-accueil-focal')

    # 2. Terminer une tâche par la case à cocher ; la ligne rejoint la fin (réorganisation)
    bath = task(pg, BATH)
    chk = tid(pg, f'today-complete-{bath["id"]}')
    chk.scroll_into_view_if_needed(); pg.wait_for_timeout(300)
    R['case_role_checkbox_48'] = chk.get_attribute('role') == 'checkbox' and (chk.bounding_box() or {}).get('height', 0) >= 48
    chk.click(); pg.wait_for_timeout(400)
    shot(pg, '02-case-cochee')
    pg.wait_for_timeout(2200)
    after = task(pg, BATH)
    R['tache_faite_serveur'] = bool(after) and after['status'] == 'done' and after['done_by'] == me
    R['statut_fait'] = 'Fait' in tid(pg, f'today-status-{bath["id"]}').inner_text()
    order = pg.evaluate("() => [...document.querySelectorAll('[data-testid^=\"today-row-\"], [data-testid^=\"home-today-agenda-\"]')].map((e) => e.dataset.testid)")
    open_rows = [k for k in order if k.startswith('today-row-')]
    R['ligne_reorganisee_en_fin'] = bool(open_rows) and order.index(f'today-row-{bath["id"]}') > max(order.index(k) for k in order if k != f'today-row-{bath["id"]}' and not any(t['id'] in k and t['status'] == 'done' for t in state(pg)['tables']['family_tasks']))
    shot(pg, '03-apres-reorganisation')

    # 3. Ouvrir un détail depuis une ligne, revenir : même position de défilement, même ligne
    pick = task(pg, PICKUP)
    row = tid(pg, f'today-open-{pick["id"]}')
    row.scroll_into_view_if_needed(); pg.wait_for_timeout(300)
    scroll_by(pg, scroll_top(pg) + 40); pg.wait_for_timeout(300)
    y0 = scroll_top(pg)
    r0 = row.bounding_box()
    row.click(); pg.wait_for_timeout(2500)
    R['detail_ouvert'] = f'/family/missions/{pick["id"]}' in pg.url and tid(pg, 'mission-detail').count() > 0
    R['detail_prenoms'] = 'Pour Sam' in tid(pg, 'mission-to').inner_text() and 'Demandée par vous' in tid(pg, 'mission-from').inner_text()
    shot(pg, '04-detail-depuis-ligne')
    pg.go_back(); pg.wait_for_timeout(2000)
    y1 = scroll_top(pg)
    r1 = tid(pg, f'today-open-{pick["id"]}').bounding_box()
    R['retour_meme_position'] = y0 > 0 and abs(y1 - y0) <= 2 and bool(r0) and bool(r1) and abs(r1['y'] - r0['y']) <= 6
    R['retour_meme_ligne_focus'] = pg.evaluate("() => (document.activeElement && document.activeElement.dataset.testid) || ''") == f'today-open-{pick["id"]}'
    shot(pg, '05-retour-meme-position')

    # 4. La barre du bas ne masque pas le dernier contenu
    scroll_by(pg, 10 ** 6); pg.wait_for_timeout(600)
    last = tid(pg, 'home-tool-search').bounding_box()
    dock = tid(pg, 'home-today-add').bounding_box()
    R['barre_ne_masque_pas_le_bas'] = bool(last) and bool(dock) and last['y'] + last['height'] <= dock['y'] + 1
    shot(pg, '06-bas-de-page')

    # 5. Créer une mission en étapes ; « Précédent » conserve la saisie
    pg.goto(B + '/family/missions/new'); pg.wait_for_timeout(3000)
    tid(pg, 'mission-tpl-kibble').click(); pg.wait_for_timeout(300)
    title0 = tid(pg, 'mission-title').input_value()
    tid(pg, 'mission-next').click(); pg.wait_for_timeout(700)
    R['etape_2_qui_quand'] = tid(pg, 'mission-step-1').count() > 0 and 'Étape 2 sur 3' in tid(pg, 'mission-progress').inner_text()
    tid(pg, 'mission-who-coparent').click(); pg.wait_for_timeout(300)
    R['selecteur_membre_prenom'] = 'Sam' in tid(pg, 'mission-who').inner_text() and tid(pg, 'mission-who-coparent').get_attribute('aria-checked') == 'true'
    shot(pg, '07-creation-etape-2')
    tid(pg, 'mission-prev').click(); pg.wait_for_timeout(700)
    R['retour_conserve_titre'] = tid(pg, 'mission-title').input_value() == title0 and bool(title0)
    tid(pg, 'mission-next').click(); pg.wait_for_timeout(700)
    R['retour_conserve_membre'] = tid(pg, 'mission-who-coparent').get_attribute('aria-checked') == 'true'
    tid(pg, 'mission-date-today').click(); pg.wait_for_timeout(200)
    tid(pg, 'mission-next').click(); pg.wait_for_timeout(700)
    R['recap'] = 'Pour Sam' in tid(pg, 'mission-recap').inner_text()
    shot(pg, '08-creation-recap')
    tid(pg, 'mission-send').click(); pg.wait_for_timeout(3000)
    mid = pg.url.rstrip('/').split('/')[-1]
    created = next((t for t in state(pg)['tables']['family_tasks'] if t['id'] == mid), None)
    R['mission_creee_serveur'] = bool(created) and created['mission_state'] == 'pending' and created['created_by'] == me
    R['detail_a_accepter'] = tid(pg, 'mission-state-pending').count() > 0 and tid(pg, 'mission-reply-accept').count() == 0
    R['actions_autrice'] = tid(pg, 'mission-follow').count() > 0 and 'Sam' in tid(pg, 'mission-follow').inner_text() and tid(pg, 'mission-cancel').count() > 0
    shot(pg, '09-detail-autrice')

    # 6. Côté Sam : pastille démo compacte, prénoms, accepter (résultat réel du serveur)
    pill = tid(pg, 'mission-demo-switch')
    R['pastille_demo_compacte'] = (pill.bounding_box() or {}).get('height', 999) <= 60
    pill.click(); pg.wait_for_timeout(2500)
    R['bascule_sam'] = state(pg)['session']['userId'] != me
    pg.goto(B + '/family/missions'); pg.wait_for_timeout(3000)
    R['liste_camille_vous_demande'] = 'Camille vous demande' in tid(pg, f'mission-who-line-{mid}').inner_text()
    R['tuiles_resultat'] = tid(pg, 'mission-tile-answer').count() > 0 and tid(pg, 'mission-tile-active').count() > 0
    R['liste_sans_coparent'] = 'Coparent' not in tid(pg, 'missions-received').inner_text()
    shot(pg, '10-sam-recues')
    tid(pg, f'mission-{mid}').click(); pg.wait_for_timeout(2500)
    R['sam_detail_demandee_par_camille'] = 'Demandée par Camille' in tid(pg, 'mission-from').inner_text()
    R['point_focal_reponse'] = tid(pg, 'mission-answer').count() > 0
    shot(pg, '11-sam-detail-reponse')
    tid(pg, 'mission-reply-accept').click(); pg.wait_for_timeout(2500)
    R['sam_acceptee_serveur'] = next(t for t in state(pg)['tables']['family_tasks'] if t['id'] == mid)['mission_state'] == 'accepted'
    R['sam_detail_acceptee'] = tid(pg, 'mission-state-accepted').count() > 0
    pg.goto(B + '/'); pg.wait_for_timeout(3500)
    R['accueil_sam_prenoms'] = 'Coparent' not in tid(pg, 'home-today').inner_text() and 'Camille' in tid(pg, 'home-today').inner_text()
    shot(pg, '12-accueil-sam')
    pg.goto(B + '/family/missions/responsibilities'); pg.wait_for_timeout(3000)
    R['responsabilites_prenoms'] = 'Camille' in tid(pg, 'resp-shopping').inner_text() and 'Sam' in tid(pg, 'resp-shopping').inner_text()
    shot(pg, '13-responsabilites')

    # 7. Stocks d'exemple
    pg.goto(B + '/family/stocks'); pg.wait_for_timeout(3000)
    n = len([s for s in state(pg)['tables'].get('household_stocks', [])])
    R['stocks_exemple'] = n >= 5 and pg.locator('[data-testid^="stock-"]').count() >= 3
    shot(pg, '14-stocks')

    # 8. Texte agrandi 1,3 : aucun débordement horizontal
    for path, name in [('/', '15-zoom-accueil'), ('/family/missions', '16-zoom-missions'), (f'/family/missions/{mid}', '17-zoom-detail')]:
        pg.goto(B + path); pg.wait_for_timeout(3000)
        pg.evaluate(ZOOM_TEXT); pg.wait_for_timeout(500)
        R[f'zoom_1_3_sans_debordement_{name[3:]}'] = no_hscroll(pg)
        shot(pg, name)
    ctx.close()

    # 9. Réduire les animations : la case termine, aucun écran à moitié apparu
    ctx2 = b.new_context(viewport={'width': 320, 'height': 568}, locale='fr-FR', timezone_id='Europe/Paris', reduced_motion='reduce')
    pg2 = ctx2.new_page()
    pg2.on('pageerror', lambda e: errs.append('PAGE2 ' + str(e)[:200]))
    start(pg2)
    bath2 = task(pg2, BATH)
    c2 = tid(pg2, f'today-complete-{bath2["id"]}')
    c2.scroll_into_view_if_needed(); c2.click(); pg2.wait_for_timeout(1500)
    R['reduit_case_termine'] = task(pg2, BATH)['status'] == 'done'
    pick2 = task(pg2, PICKUP)
    tid(pg2, f'today-open-{pick2["id"]}').click(); pg2.wait_for_timeout(150)
    op = pg2.evaluate("() => { const e = document.querySelector('[data-testid=\"mission-detail-scene\"]'); return e ? getComputedStyle(e).opacity : '0'; }")
    R['reduit_detail_immediat'] = op == '1'
    ctx2.close()

    # 10. Captures clair / sombre (deviceScaleFactor 2)
    for theme in ['light', 'dark']:
        c3 = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2)
        p3 = c3.new_page()
        p3.on('pageerror', lambda e: errs.append('PAGE3 ' + str(e)[:200]))
        start(p3)
        p3.evaluate("(th) => { const ui = JSON.parse(localStorage.getItem('toietmoi.ui') || '{\"state\":{},\"version\":0}'); ui.state.themePreference = th; if (ui.state.appearanceOwner) { ui.state.appearanceByUser = ui.state.appearanceByUser || {}; ui.state.appearanceByUser[ui.state.appearanceOwner] = { theme: th, palette: ui.state.palettePreference || 'auto' }; } localStorage.setItem('toietmoi.ui', JSON.stringify(ui)); }", theme)
        milk = task(p3, 'Acheter du lait avant 18 h')
        for path, name in [('/', 'accueil'), ('/family/missions', 'missions'), (f'/family/missions/{milk["id"]}', 'detail'), ('/family/missions/new', 'creation'),
                           ('/family/missions/responsibilities', 'responsabilites'), ('/family/stocks', 'stocks')]:
            p3.goto(B + path); p3.wait_for_timeout(3200)
            p3.screenshot(path=f'{SHOTS}/{theme}-{name}.png')
        c3.close()
    b.close()

R['erreurs'] = errs[:8]
print(json.dumps(R, ensure_ascii=False, indent=1))
sys.exit(0 if all(v for k, v in R.items() if k != 'erreurs') and not errs else 1)
