"""
Parcours navigateur : synchronisation temps réel entre membres du foyer (faux Supabase + faux Realtime).
Un coparent ajoute une tâche depuis son téléphone → elle apparaît chez l'autre parent sans action ;
l'abonnement est filtré sur le foyer ; les tables privées ne sont pas écoutées.
Usage : même version web que etape1_auth.py (voir e2e/README.md), puis python3 e2e/temps_reel.py
"""
import json, os, re, sys, uuid, time
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import FakeSupabase, FakeRealtime, now

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8811')
fake = FakeSupabase(); rt = FakeRealtime(); R = {}; errs = []
uid = str(uuid.uuid4())
fake.users[uid] = {'id': uid, 'email': 'sync@exemple.test', 'password': 'abcdefg1', 'confirmed': True, 'meta': {}}
fake.trigger_new_user(fake.users[uid])
next(x for x in fake.t('profiles') if x['id'] == uid).update({'onboarding_completed': True, 'journeys': ['newborn'], 'display_name': 'Sync'})
hid = next(m['household_id'] for m in fake.t('household_members') if m['user_id'] == uid)

with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR'); pg = ctx.new_page()
    pg.route('http://sb.fake.test/**', fake.route)
    pg.route_web_socket(re.compile(r'wss?://sb\.fake\.test/realtime/.*'), rt.attach)
    pg.route(re.compile(r'https://d8j0ntlcm91z4\.cloudfront\.net/.*'), lambda r: r.abort())
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.on('console', lambda m: errs.append('console: ' + m.text[:160]) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    pg.goto(B + '/auth/sign-in'); pg.wait_for_timeout(3500)
    pg.get_by_label('Adresse e-mail').fill('sync@exemple.test')
    pg.get_by_label('Mot de passe', exact=True).fill('abcdefg1')
    pg.get_by_role('button', name='Se connecter').last.click(); pg.wait_for_timeout(4000)
    pg.goto(B + '/family'); pg.wait_for_timeout(4000)
    R['abonnement_ouvert'] = len(rt.joins) > 0
    specs = rt.joins[-1][1] if rt.joins else []
    R['filtre_foyer'] = any(s.get('table') == 'family_tasks' and s.get('filter') == f'household_id=eq.{hid}' for s in specs)
    R['notifications_personnelles'] = any(s.get('table') == 'notifications' and s.get('filter') == f'user_id=eq.{uid}' for s in specs)
    R['tables_privees_non_ecoutees'] = not any(re.search('postpartum|mood|period|document', s.get('table', '')) for s in specs)
    before = pg.get_by_text('Rangement des jouets').count()
    task = {'id': str(uuid.uuid4()), 'household_id': hid, 'title': 'Rangement des jouets', 'category': 'housework', 'status': 'todo', 'priority': 'normal',
            'essential': False, 'due_at': now(), 'assignee_id': None, 'created_by': str(uuid.uuid4()), 'created_at': now(), 'updated_at': now(), 'recurrence': None, 'notes': None, 'routine_id': None}
    fake.t('family_tasks').append(task)      # le coparent l'a créée depuis son téléphone…
    pg.wait_for_timeout(1500)
    R['pas_de_faux_rafraichissement'] = pg.get_by_text('Rangement des jouets').count() == before == 0
    rt.push_change('family_tasks', task)     # … et le serveur l'annonce
    pg.wait_for_timeout(2500)
    R['tache_apparue_sans_action'] = pg.get_by_text('Rangement des jouets').count() > 0
    R['erreurs'] = errs
    print(json.dumps(R, ensure_ascii=False, indent=1))
