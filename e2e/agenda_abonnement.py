"""
Parcours navigateur : lien d'abonnement d'agenda (hors démonstration, faux Supabase).
Création → lien affiché une seule fois (adresse de la fonction calendar-feed) → listé sans jeton → révocation.
Usage : même version web que etape1_auth.py (voir e2e/README.md), puis python3 e2e/agenda_abonnement.py
"""
import json, os, re, sys, uuid
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import FakeSupabase, FakeRealtime

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8811')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e'); os.makedirs(SHOTS, exist_ok=True)
fake = FakeSupabase(); R = {}; errs = []
uid = str(uuid.uuid4())
fake.users[uid] = {'id': uid, 'email': 'agenda@exemple.test', 'password': 'abcdefg1', 'confirmed': True, 'meta': {'adult_confirmed': True, 'terms_version': '2026-10', 'privacy_version': '2026-10'}}
fake.trigger_new_user(fake.users[uid])
next(x for x in fake.t('profiles') if x['id'] == uid).update({'onboarding_completed': True, 'journeys': ['newborn'], 'display_name': 'Agenda'})

with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR'); pg = ctx.new_page()
    pg.route('http://sb.fake.test/**', fake.route)
    pg.route_web_socket(re.compile(r'wss?://sb\.fake\.test/realtime/.*'), FakeRealtime().attach)
    pg.route(re.compile(r'https://d8j0ntlcm91z4\.cloudfront\.net/.*'), lambda r: r.abort())
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.on('console', lambda m: errs.append('console: ' + m.text[:160]) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    pg.goto(B + '/auth/sign-in'); pg.wait_for_timeout(3500)
    pg.get_by_label('Adresse e-mail').fill('agenda@exemple.test')
    pg.get_by_label('Mot de passe', exact=True).fill('abcdefg1')
    pg.get_by_role('button', name='Se connecter').last.click(); pg.wait_for_timeout(4000)
    pg.goto(B + '/calendar'); pg.wait_for_timeout(3500)
    R['carte_visible'] = pg.get_by_text('S’abonner depuis un autre agenda').count() > 0
    R['pas_en_demo'] = pg.get_by_text('Disponible avec un compte').count() == 0
    pg.get_by_role('button', name='Créer un lien d’abonnement').first.click(); pg.wait_for_timeout(900)
    pg.get_by_role('button', name='Créer le lien').last.click(); pg.wait_for_timeout(1500)
    feed = fake.t('calendar_feeds')[-1] if fake.t('calendar_feeds') else None
    url = pg.get_by_label('Adresse du lien d’abonnement').first.inner_text() if feed else ''
    R['lien_affiche'] = bool(feed) and url == f"http://sb.fake.test/functions/v1/calendar-feed?token={feed['_token']}"
    R['titres_sante_neutres_par_defaut'] = bool(feed) and feed['include_health_titles'] is False
    pg.screenshot(path=os.path.join(SHOTS, 'agenda-lien.png'))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    pg.goto(B + '/calendar'); pg.wait_for_timeout(3000)
    R['lien_liste_sans_jeton'] = pg.get_by_text('pas encore consulté', exact=False).count() > 0 and (feed['_token'] not in pg.inner_text('body') if feed else False)
    pg.once('dialog', lambda d: d.accept())
    pg.get_by_role('button', name='Révoquer').first.click(); pg.wait_for_timeout(800)
    conf = pg.get_by_role('button', name='Révoquer')
    if conf.count() > 1: conf.last.click(); pg.wait_for_timeout(1200)
    R['revoque'] = bool(feed) and feed['revoked_at'] is not None
    R['liste_videe'] = pg.get_by_text('pas encore consulté', exact=False).count() == 0
    R['erreurs'] = errs
    print(json.dumps(R, ensure_ascii=False, indent=1))
