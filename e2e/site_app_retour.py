"""/app sur le site (coquille servie par e2e/site_server.py, faux Supabase) :
A. lien direct vers un écran privé sans session → accueil → connexion → retour à l'écran demandé
B. actualisation de l'écran privé → même écran ; /app → accueil, adresse /app, actualisation OK ; retour navigateur
C. changement de compte sur le même navigateur : rien du compte précédent n'apparaît
D. HTML servi pour une page privée : aucune donnée familiale (titre générique, noindex)
Usage : E2E_URL=http://127.0.0.1:8080 E2E_SHOTS=<dossier> python3 e2e/site_app_retour.py"""
import os, re, sys, time, urllib.request
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import FakeSupabase, FakeRealtime

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8080')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/homi-site-app'); os.makedirs(SHOTS, exist_ok=True)
fake = FakeSupabase()
RES = []
def check(name, ok, detail=''):
    RES.append(ok); print(('OK  ' if ok else 'ÉCHEC ') + name + (f' — {detail}' if detail else ''), flush=True)

def make_user(email, name):
    import uuid
    uid = str(uuid.uuid4())
    u = {'id': uid, 'email': email, 'password': 'abcdefg1', 'confirmed': True, 'meta': {}}
    fake.users[uid] = u
    fake.trigger_new_user(u)
    for p in fake.t('profiles'):
        if p['id'] == uid: p.update({'display_name': name, 'onboarding_completed': True, 'journeys': ['family']})
    return uid

ALICE = make_user('alice@example.test', 'Alice')
import datetime, uuid as _uuid
_hid = next(m['household_id'] for m in fake.t('household_members') if m['user_id'] == ALICE)
LEA = str(_uuid.uuid4())
fake.t('children').append({'id': LEA, 'household_id': _hid, 'first_name': 'Léa', 'birth_date': (datetime.date.today() - datetime.timedelta(days=210)).isoformat(),
                           'sex': 'female', 'photo_path': None, 'archived': False, 'enabled_tracking': ['bottle', 'sleep', 'growth'], 'allergies_declared': [], 'created_at': '2026-05-01T00:00:00Z'})
# parcours « bébé » actif pour Léa (sans lui, l'app bloque à raison les outils bébé : /journeys/blocked)
fake.t('user_journeys').append({'id': str(_uuid.uuid4()), 'user_id': ALICE, 'household_id': _hid, 'type': 'baby', 'status': 'active', 'started_on': '2026-05-01', 'ended_on': None, 'end_reason': None, 'pregnancy_id': None, 'child_id': LEA, 'created_at': '2026-05-01T00:00:00Z'})
make_user('bruno@example.test', 'Bruno')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ['PW_CHROMIUM']) if os.environ.get('PW_CHROMIUM') else p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', device_scale_factor=2)
    pg = ctx.new_page()
    pg.route('http://sb.fake.test/**', fake.route)
    pg.route_web_socket(re.compile(r'wss?://sb\.fake\.test/realtime/.*'), FakeRealtime().attach)
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    wait = lambda s: pg.wait_for_timeout(int(s * 1000))
    path = lambda: re.sub(r'^https?://[^/]+', '', pg.url)
    def sign_in(email):
        pg.get_by_label('Adresse e-mail').fill(email)
        pg.get_by_label('Mot de passe').first.fill('abcdefg1')
        btn = pg.locator('[data-testid="signin-submit"]')
        btn.click()
        try: btn.click(force=True, timeout=800)  # double appui : un seul envoi
        except Exception: pass
        wait(5)

    # A. lien direct sans session
    pg.goto(B + '/settings/appearance'); wait(5)
    check('lien privé sans session → accueil sans compte', path().startswith('/welcome') or path().startswith('/start'), path())
    pg.goto(B + '/auth/sign-in'); wait(3)
    sign_in('alice@example.test')
    check('après connexion : retour à l’écran demandé', path().startswith('/settings/appearance'), path())
    pg.screenshot(path=os.path.join(SHOTS, 'a-retour-apres-connexion.png'))

    # A bis. carte d'outil du site (/outil/<id>) : déjà connectée → l'outil de l'enfant
    pg.goto(B + '/outil/baby_breastfeed'); wait(6)
    check('carte du site → Allaitement de l’enfant dans la vraie app', path().startswith(f'/track/breastfeed?child={LEA}'), path())
    pg.screenshot(path=os.path.join(SHOTS, 'a2-outil-connecte.png'))
    pg.goto(B + '/settings/appearance'); wait(4)

    # B. actualisation, /app, retour navigateur
    pg.reload(); wait(5)
    check('actualisation : même écran privé', path().startswith('/settings/appearance'), path())
    pg.goto(B + '/app'); wait(5)
    body = pg.inner_text('body')
    check('/app → accueil de la famille', 'Alice' in body, path())
    check('/app : adresse affichée /app (pas la page publique)', path() == '/app', path())
    pg.screenshot(path=os.path.join(SHOTS, 'b-app-accueil.png'))
    pg.reload(); wait(5)
    check('/app : actualisation → accueil', 'Alice' in pg.inner_text('body'), path())
    pg.go_back(); wait(3)
    check('retour navigateur : écran précédent', path().startswith('/settings/appearance'), path())

    # C. changement de compte sur le même navigateur
    pg.evaluate("() => { /* déconnexion propre via le client */ }")
    pg.goto(B + '/settings/account'); wait(4)
    out = pg.get_by_text(re.compile('Se déconnecter|Déconnexion')).first
    if out.count():
        out.click(); wait(1)
        confirm = pg.get_by_role('button', name=re.compile('Se déconnecter|Déconnexion')).last
        if confirm.count(): confirm.click()
        wait(4)
    pg.goto(B + '/auth/sign-in'); wait(3)
    sign_in('bruno@example.test')
    pg.goto(B + '/app'); wait(5)
    body = pg.inner_text('body')
    check('autre compte : accueil de Bruno', 'Bruno' in body, path())
    check('autre compte : rien d’Alice à l’écran', 'Alice' not in body)
    ls = pg.evaluate("() => Object.entries(localStorage).map(([k,v]) => k + '=' + v).join('\\n')")
    check('autre compte : rien d’Alice dans le stockage du navigateur', 'Alice' not in ls and 'alice@' not in ls)
    pg.screenshot(path=os.path.join(SHOTS, 'c-changement-compte.png'))

    # C bis. carte d'outil sans session (nouveau navigateur) → connexion → l'outil
    ctx2 = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR')
    pg2 = ctx2.new_page(); pg2.route('http://sb.fake.test/**', fake.route)
    pg2.route_web_socket(re.compile(r'wss?://sb\.fake\.test/realtime/.*'), FakeRealtime().attach)
    pg, prev = pg2, pg
    pg.goto(B + '/outil/baby_breastfeed'); wait(5)
    check('carte du site sans session → connexion demandée (pas la démo)', ('/welcome' in path() or '/start' in path()) and 'demo' not in path(), path())
    pg.goto(B + '/auth/sign-in'); wait(3)
    sign_in('alice@example.test'); wait(3)
    check('après connexion : l’outil demandé s’ouvre', path().startswith(f'/track/breastfeed?child={LEA}'), path())
    pg.screenshot(path=os.path.join(SHOTS, 'c2-outil-apres-connexion.png'))
    pg = prev

    # D. HTML servi pour une page privée
    html = urllib.request.urlopen(B + '/settings/appearance').read().decode()
    check('HTML privé : titre générique et noindex', '<title>HOMI</title>' in html and 'noindex' in html)
    check('HTML privé : aucun prénom', 'Alice' not in html and 'Bruno' not in html)
    check('aucune erreur JavaScript', not errs, ' | '.join(errs[:3]))
    b.close()

print(f'\n{sum(RES)}/{len(RES)} vérifications réussies')
sys.exit(0 if all(RES) else 1)
