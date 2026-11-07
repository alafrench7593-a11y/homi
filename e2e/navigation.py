"""
Navigation principale : Communauté dans la barre, Profil + Réglages en haut à droite.
Version web de démonstration (sans compte), servie par spa_server.py :
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/navigation.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import ensure  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []

def tabs(pg):
    return [t.get_attribute('aria-label') for t in pg.get_by_role('tab').all()]

def header_ok(pg, avatar_name=re.compile('^(Mon profil|My profile)')):
    """Réglages et avatar présents, dans le coin supérieur droit."""
    s = pg.get_by_role('button', name=re.compile('^(Réglages|Settings)$')).first
    a = pg.get_by_role('button', name=avatar_name).first
    if not (s.count() and a.count()): return False
    bs, ba = s.bounding_box(), a.bounding_box()
    w = pg.viewport_size['width']
    return bool(bs and ba and ba['y'] < 140 and bs['y'] < 140 and ba['x'] > w * 0.6 and ba['x'] > bs['x'])

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR')
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)

    # 1. Barre : Communauté présente, Outils au centre, profil de la personne à droite (07/11/2026)
    t = tabs(pg)
    R['1_barre_onglets'] = t[:5] == ['Accueil', 'Suivi', 'Outils', 'Communauté', 'Questions'] and len(t) == 6 and t[5].startswith('Mon profil')
    pg.get_by_role('tab', name='Communauté').click(); pg.wait_for_timeout(1800)
    R['1_communaute_ouvre_la_vraie_section'] = pg.url.endswith('/community') and 'forum des parents' in pg.inner_text('body')
    R['1_onglet_actif'] = pg.get_by_role('tab', name='Communauté').get_attribute('aria-selected') == 'true'
    pg.screenshot(path=f'{SHOTS}/nav-communaute.png')

    # 2-3. Accueil : avatar + Réglages en haut à droite
    pg.get_by_role('tab', name='Accueil').click(); pg.wait_for_timeout(1500)
    R['2_3_accueil_profil_reglages_en_haut_a_droite'] = header_ok(pg)
    R['2_urgence_et_notifications_conservees'] = pg.get_by_role('button', name='Besoin d’aide maintenant').count() == 1 and pg.get_by_role('button', name=re.compile('^Notifications')).count() == 1
    pg.screenshot(path=f'{SHOTS}/nav-accueil.png')

    # 4. Profil : données du compte connecté
    name = pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const u = s.session && s.session.userId; const p = s.tables.profiles.find(x => x.id === u); return p ? (p.display_name || '') : '' }")
    pg.get_by_role('button', name=re.compile('^Mon profil')).first.click(); pg.wait_for_timeout(1800)
    body = pg.inner_text('body')
    R['4_profil_ouvert'] = pg.url.endswith('/profile') and 'MES PARCOURS' in body
    R['4_profil_donnees_du_compte'] = (name in body) if name else ('Mon profil' in body)
    R['4_profil_lien_publications'] = 'Mes publications' in body
    R['4_avatar_actif_sur_le_profil'] = pg.get_by_role('button', name=re.compile('^Mon profil')).first.get_attribute('aria-selected') == 'true'
    pg.screenshot(path=f'{SHOTS}/nav-profil.png')
    pg.get_by_role('button', name='Réglages').first.click(); pg.wait_for_timeout(1500)
    R['3_reglages_ouverts'] = pg.url.endswith('/settings') and 'Langue et pays' in pg.inner_text('body')
    for sub in ['/settings/account', '/settings/privacy', '/settings/reminders', '/settings/language', '/settings/home']:
        pg.goto(B + sub); pg.wait_for_timeout(1200)
        R[f'3_reglage_{sub.split("/")[-1]}'] = 'introuvable' not in pg.inner_text('body').lower()

    # 5. En-tête sur les écrans principaux
    seed = {}
    for path in ['/', '/track', '/tools', '/community', '/ask', '/cycle', '/calendar', '/fertility', '/contraception']:
        ensure(pg, path, seed)  # écrans de cycle : ouverts avec le parcours correspondant (garde d'accès)
        pg.goto(B + path); pg.wait_for_timeout(1800)
        R[f'5_entete_{path.strip("/") or "accueil"}'] = header_ok(pg)
    # Écrans détaillés : bouton Retour, sans en-tête de compte imposé
    pg.goto(B + '/settings/privacy'); pg.wait_for_timeout(1200)
    R['5_ecran_detail_sans_entete_compte'] = pg.get_by_role('button', name='Retour').count() >= 1 and pg.get_by_role('button', name=re.compile('^Mon profil')).count() == 0

    # 6. Fluidité : une recherche saisie dans Communauté survit à un changement d'onglet
    pg.goto(B + '/'); pg.wait_for_timeout(1500)
    pg.get_by_role('tab', name='Communauté').click(); pg.wait_for_timeout(1500)
    box = pg.get_by_placeholder('Sommeil, purée… ou @membre')
    if box.count():
        box.fill('Brouillon conservé ?')
        pg.get_by_role('tab', name='Suivi').click(); pg.wait_for_timeout(1000)
        pg.get_by_role('tab', name='Communauté').click(); pg.wait_for_timeout(1000)
        R['6_pas_de_reinitialisation'] = pg.get_by_placeholder('Sommeil, purée… ou @membre').input_value() == 'Brouillon conservé ?'
    else:
        R['6_pas_de_reinitialisation'] = False

    # 7. Liens internes : notifications, espace de communauté, route du profil
    pg.goto(B + '/'); pg.wait_for_timeout(1500)
    pg.get_by_role('button', name=re.compile('^Notifications')).first.click(); pg.wait_for_timeout(1500)
    R['7_cloche_vers_notifications'] = pg.url.endswith('/notifications')
    pg.goto(B + '/community?space=grossesse'); pg.wait_for_timeout(1800)
    R['7_lien_espace_communaute'] = 'Grossesse' in pg.inner_text('body')
    pg.goto(B + '/profile'); pg.wait_for_timeout(1500)
    R['7_lien_direct_profil'] = 'MES PARCOURS' in pg.inner_text('body')
    pg.goto(B + '/scanner'); pg.wait_for_timeout(1500)
    R['7_scanner_toujours_accessible'] = 'introuvable' not in pg.inner_text('body').lower()
    ctx.close()

    # 8. Petit écran (iPhone SE 1re génération) : barre lisible, Outils centré, pas de débordement
    ctx = b.new_context(viewport={'width': 320, 'height': 568}, locale='fr-FR'); pg = ctx.new_page()
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    boxes = [pg.get_by_role('tab', name=n).bounding_box() for n in ['Accueil', 'Suivi', 'Communauté', 'Questions']] + [pg.locator('[data-testid="tab-profile"]').first.bounding_box()]
    R['8_onglets_dans_l_ecran'] = all(bb and bb['x'] >= 0 and bb['x'] + bb['width'] <= 320 and bb['width'] >= 44 for bb in boxes)
    orb = pg.get_by_role('tab', name='Outils').bounding_box()
    # 6 onglets (profil ajouté le 07/11/2026) : Outils entre Suivi et Communauté, onglets de même largeur
    R['8_outils_entre_suivi_et_communaute'] = bool(orb) and boxes[1]['x'] < orb['x'] < boxes[2]['x']
    R['8_pas_de_debordement'] = not pg.evaluate('() => document.documentElement.scrollWidth > window.innerWidth + 1')
    R['8_entete_petit_ecran'] = header_ok(pg)
    pg.screenshot(path=f'{SHOTS}/nav-320.png')

    # 9. Anglais
    pg.goto(B + '/settings/language'); pg.wait_for_timeout(1800)
    pg.get_by_role('radio', name='English').click(); pg.wait_for_timeout(2000)
    pg.goto(B + '/'); pg.wait_for_timeout(2500)
    R['9_barre_en_anglais'] = tabs(pg)[:5] == ['Home', 'Tracking', 'Tools', 'Community', 'Questions'] and tabs(pg)[5].startswith('My profile')
    R['9_entete_en_anglais'] = header_ok(pg, re.compile('^My profile'))
    pg.goto(B + '/community'); pg.wait_for_timeout(1800)
    R['9_communaute_en_anglais'] = 'parents’ forum' in pg.inner_text('body')
    pg.screenshot(path=f'{SHOTS}/nav-en.png')
    ctx.close(); b.close()

R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
