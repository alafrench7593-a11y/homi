"""
Navigation d'un compte qui n'est QUE nounou, et entrée « Garde et nounou » des parents (19/11/2026).
Faux serveur (fake_supabase.py) : un foyer (Camille, Lou) et Sophie, nounou de Lou (membre « caregiver » seulement).
  - Sophie : l'accueil et les onglets du foyer la renvoient vers « Mes gardes » (/garde) ; sur les écrans qui lui
    restent (Profil), la barre du bas ne montre ni les onglets ni les profils du foyer : « Mes gardes » + l'action
    centrale « Ajouter un événement » ;
  - Camille : l'onglet Enfant propose « Garde et nounou » (→ /garde/<enfant> si une nounou a un accès confirmé).
Usage : version web exportée avec EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key,
  E2E_URL=http://127.0.0.1:<port> E2E_SHOTS=<dossier> python3 e2e/nounou_navigation.py
"""
import json, os, re, sys, uuid
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import FakeSupabase, now  # noqa: E402

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8811')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/homi-nounou-nav')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
fake = FakeSupabase()


def mk_user(email, name, onboarded=True):
    uid = str(uuid.uuid4())
    fake.users[uid] = {'id': uid, 'email': email, 'password': 'abcdefg1', 'confirmed': True, 'meta': {}}
    fake.trigger_new_user(fake.users[uid])
    next(x for x in fake.t('profiles') if x['id'] == uid).update({'onboarding_completed': onboarded, 'journeys': ['newborn'] if onboarded else [], 'display_name': name})
    return uid


P1 = mk_user('parent1@exemple.test', 'Camille')
NN = mk_user('nounou@exemple.test', 'Sophie', onboarded=False)
H = next(m['household_id'] for m in fake.t('household_members') if m['user_id'] == P1)
# la nounou n'a AUCUN foyer en tant que parent : seulement le rôle « caregiver » dans celui de Lou
hn = next(m['household_id'] for m in fake.t('household_members') if m['user_id'] == NN)
fake.T['households'] = [h for h in fake.t('households') if h['id'] != hn]
fake.T['household_members'] = [m for m in fake.t('household_members') if m['household_id'] != hn]
LOU = str(uuid.uuid4())
fake.t('children').append({'id': LOU, 'household_id': H, 'first_name': 'Lou', 'birth_date': '2025-12-01', 'sex': 'female', 'photo_path': None, 'archived': False, 'enabled_tracking': [], 'created_at': now()})
fake.t('user_journeys').append({'id': str(uuid.uuid4()), 'user_id': P1, 'household_id': H, 'type': 'baby', 'status': 'active', 'child_id': LOU, 'pregnancy_id': None, 'started_on': '2025-12-01', 'created_at': now(), 'updated_at': now()})
fake.t('household_members').append({'household_id': H, 'user_id': NN, 'role': 'caregiver', 'can_view': ['daily'], 'can_edit': ['daily'], 'child_scope': [LOU], 'joined_at': now()})
fake.premium_users.add(P1)


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def n(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count()


def open_ctx(b, email):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR')
    pg = ctx.new_page()
    pg.route('http://sb.fake.test/**', fake.route)
    pg.route_web_socket(re.compile(r'wss?://sb\.fake\.test/realtime/.*'), lambda ws: None)
    pg.route(re.compile(r'https://(d8j0ntlcm91z4\.cloudfront\.net|cdn\.5sdesign\.art)/.*'), lambda r: r.abort())
    pg.on('pageerror', lambda e: errs.append(f'{email}: ' + str(e)[:200]))
    pg.goto(B + '/auth/sign-in'); pg.wait_for_timeout(3000)
    pg.get_by_label('Adresse e-mail').fill(email)
    pg.get_by_label('Mot de passe', exact=True).fill('abcdefg1')
    pg.get_by_role('button', name='Se connecter').last.click(); pg.wait_for_timeout(4000)
    return ctx, pg


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM') or None)
    cn, pn = open_ctx(b, 'nounou@exemple.test')
    for path in ['/', '/health', '/baby', '/household', '/tools']:
        pn.goto(B + path); pn.wait_for_timeout(3000)
        R[f'nounou_{path.strip("/") or "accueil"}_renvoie_vers_mes_gardes'] = pn.url.rstrip('/').endswith('/garde')
    pn.goto(B + '/profile'); pn.wait_for_timeout(3500)
    R['nounou_barre_sans_onglets_du_foyer'] = n(pn, 'tab-index') == 0 and n(pn, 'tab-baby') == 0 and n(pn, 'tab-household') == 0 and n(pn, 'tab-garde') == 1
    R['nounou_action_ajouter_un_evenement'] = (tid(pn, 'care-quick-add').get_attribute('aria-label') or '').startswith('Ajouter un événement')
    R['nounou_sans_profils_du_foyer'] = n(pn, 'profile-switcher') == 0 and pn.locator('[data-testid^="subject-"]').count() == 0
    pn.screenshot(path=f'{SHOTS}/nounou-profil-barre.png')
    tid(pn, 'tab-garde').click(); pn.wait_for_timeout(2500)
    R['nounou_onglet_mes_gardes'] = pn.url.rstrip('/').endswith('/garde')

    cp, pp = open_ctx(b, 'parent1@exemple.test')
    pp.goto(B + '/baby'); pp.wait_for_timeout(3500)
    R['parent_entree_garde_et_nounou'] = n(pp, 'hub-baby-care-open') == 1
    pp.screenshot(path=f'{SHOTS}/parent-onglet-enfant-garde.png')
    tid(pp, 'hub-baby-care-open').click(); pp.wait_for_timeout(2500)
    R['parent_entree_ouvre_la_garde'] = '/garde' in pp.url
    R['parent_barre_complete'] = True
    pp.goto(B + '/'); pp.wait_for_timeout(3000)
    R['parent_barre_complete'] = n(pp, 'tab-index') == 1 and n(pp, 'tab-baby') == 1 and n(pp, 'care-quick-add') == 0
    b.close()
print(json.dumps({**R, 'erreurs': errs[:6]}, ensure_ascii=False, indent=1))
