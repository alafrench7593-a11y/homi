"""
Accueil du CO-PARENT (19/11/2026) : à deux comptes sur le faux serveur (e2e/fake_couple.py, RLS émulée) — Camille,
propriétaire (grossesse, règles, journal d'humeur : privés), Sam, co-parent invité.
Vérifie que l'accueil de Sam est l'accueil « Co-parent » (`coparentSituation`) et qu'aucune carte n'affiche ni n'ouvre
une donnée privée de Camille ; chaque carte de l'accueil est ouverte, l'écran atteint est relu.
Usage :
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \\
    npx expo export --platform web --clear --output-dir <dist>
  python3 e2e/spa_server.py <dist> <port> &
  E2E_URL=http://127.0.0.1:<port> E2E_SHOTS=<dossier> PW_CHROMIUM=/opt/pw-browsers/chromium python3 e2e/coparent_accueil.py
"""
import json, os, re, sys, uuid
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import now  # noqa: E402
from fake_couple import FakeCouple  # noqa: E402

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8811')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/homi-coparent')
EXE = os.environ.get('PW_CHROMIUM') or None
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
fake = FakeCouple()
PRIVATE = re.compile(r'mai 2027|journal intime|semaines? d.am[ée]norrh|\b\d+ SA\b|r[èe]gles le|dernières règles', re.I)


def account(email, name):
    uid = str(uuid.uuid4())
    fake.users[uid] = {'id': uid, 'email': email, 'password': 'abcdefg1', 'confirmed': True, 'meta': {}}
    fake.trigger_new_user(fake.users[uid])
    next(x for x in fake.t('profiles') if x['id'] == uid).update({'onboarding_completed': True, 'journeys': ['newborn'], 'display_name': name})
    return uid


cam = account('camille@exemple.test', 'Camille')
sam = account('sam@exemple.test', 'Sam')
hid = next(m['household_id'] for m in fake.t('household_members') if m['user_id'] == cam)
fake.premium_users.add(cam)
kid = str(uuid.uuid4())
fake.t('children').append({'id': kid, 'household_id': hid, 'first_name': 'Lina', 'birth_date': '2025-09-01', 'archived': False, 'sex': None, 'enabled_tracking': [], 'created_at': now()})
fake.t('user_journeys').append({'id': str(uuid.uuid4()), 'user_id': cam, 'household_id': hid, 'type': 'baby', 'status': 'active', 'child_id': kid, 'pregnancy_id': None,
                                'started_on': '2025-09-01', 'created_at': now(), 'updated_at': now()})
fake.t('period_entries').append({'id': str(uuid.uuid4()), 'user_id': cam, 'start_date': '2026-11-10', 'end_date': None, 'created_at': now()})
fake.t('mood_checkins').append({'id': str(uuid.uuid4()), 'user_id': cam, 'mood': 2, 'journal': 'journal intime', 'created_at': now()})
fake.t('pregnancies').append({'id': str(uuid.uuid4()), 'household_id': hid, 'carrier_user_id': cam, 'due_date': '2027-05-01', 'status': 'active', 'multiplicity': 'single',
                              'due_date_source': 'due_date', 'reminders_wanted': [], 'topics': [], 'created_at': now(), 'share_basics': None, 'share_medical': None})


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def open_ctx(b, email, width=390):
    ctx = b.new_context(viewport={'width': width, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    pg.route('http://sb.fake.test/**', fake.route)
    pg.route(re.compile(r'https://(d8j0ntlcm91z4\.cloudfront\.net|cdn\.5sdesign\.art)/.*'), lambda r: r.abort())
    pg.route_web_socket(re.compile(r'wss?://sb\.fake\.test/realtime/.*'), lambda ws: None)
    pg.on('pageerror', lambda e: errs.append(f'{email} PAGE ' + str(e)[:200]))
    pg.goto(B + '/auth/sign-in'); pg.wait_for_timeout(3000)
    pg.get_by_label('Adresse e-mail').fill(email)
    pg.get_by_label('Mot de passe', exact=True).fill('abcdefg1')
    pg.get_by_role('button', name='Se connecter').last.click(); pg.wait_for_timeout(4000)
    return ctx, pg


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)
    cctx, cpg = open_ctx(b, 'camille@exemple.test')
    cpg.goto(B + '/settings/family'); cpg.wait_for_timeout(3000)
    cpg.get_by_role('button', name='Créer l’invitation').click(); cpg.wait_for_timeout(2500)
    token = fake.t('household_invitations')[-1]['token']
    sctx, spg = open_ctx(b, 'sam@exemple.test')
    spg.goto(B + f'/settings/family?code={token}'); spg.wait_for_timeout(4000)
    spg.get_by_role('button', name='Rejoindre le foyer').first.click(); spg.wait_for_timeout(4000)
    fake.premium_users.add(sam)
    R['sam_co_parent'] = any(m['household_id'] == hid and m['user_id'] == sam and m['role'] == 'coparent' for m in fake.t('household_members'))

    spg.goto(B + '/'); spg.wait_for_timeout(4500)
    spg.screenshot(path=f'{SHOTS}/sam-accueil-enfant.png')
    # l'accueil « Co-parent » s'applique au profil « Moi » (le profil d'un enfant garde sa configuration)
    tid(spg, 'subject-me').click(); spg.wait_for_timeout(1500)
    spg.screenshot(path=f'{SHOTS}/sam-accueil.png')
    cards = spg.evaluate("""() => [...document.querySelectorAll('[data-testid^="home-card-"]')].filter(e => e.offsetParent !== null).map(e => e.getAttribute('data-testid').replace('home-card-', ''))""")
    R['cartes'] = cards
    R['ordre_co_parent'] = cards[:2] == ['next', 'quick'] and 'familyTasks' in cards
    R['aucune_donnee_privee_affichee'] = not PRIVATE.search(spg.inner_text('body'))
    c = tid(spg, 'home-customize'); c.scroll_into_view_if_needed(); c.click(); spg.wait_for_timeout(1200)
    R['configuration_co_parent'] = 'Co-parent' in tid(spg, 'home-editor-situation').inner_text()
    tid(spg, 'home-editor-done').scroll_into_view_if_needed(); tid(spg, 'home-editor-done').click(); spg.wait_for_timeout(1000)

    # chaque élément ouvrable des cartes de l'accueil : l'écran atteint ne montre rien de privé de Camille
    opened, leaks = 0, []
    n = spg.evaluate("""() => [...document.querySelectorAll('[data-testid^="home-card-"] [role="button"], [data-testid^="home-card-"] [role="link"]')].filter(e => e.offsetParent !== null).length""")
    for i in range(min(n, 40)):
        spg.goto(B + '/'); spg.wait_for_timeout(2600)
        if tid(spg, 'subject-me').get_attribute('aria-checked') != 'true': tid(spg, 'subject-me').click(); spg.wait_for_timeout(1200)
        els = spg.locator('[data-testid^="home-card-"] [role="button"], [data-testid^="home-card-"] [role="link"]').filter(visible=True)
        if els.count() <= i: break
        el = els.nth(i)
        name = (el.get_attribute('aria-label') or el.inner_text() or '')[:50]
        try:
            el.scroll_into_view_if_needed(); el.click(timeout=4000); spg.wait_for_timeout(1800)
        except Exception:
            continue
        opened += 1
        if PRIVATE.search(spg.inner_text('body')):
            leaks.append(f'{name} → {spg.url}')
    R['elements_ouverts'] = opened
    R['aucune_carte_n_ouvre_de_donnee_privee'] = not leaks
    R['fuites'] = leaks
    b.close()
print(json.dumps({**R, 'erreurs': errs[:6]}, ensure_ascii=False, indent=1))
