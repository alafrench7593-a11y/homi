"""
Audit 08 « Fiabilité et données » — parcours navigateur rejouable, faux Supabase (mode réel, pas la démo).
Pannes simulées : hors ligne (context.set_offline), 500, réponse perdue APRÈS écriture réussie (le serveur écrit,
la connexion est coupée avant la réponse), serveur indisponible en continu, deux membres sur la même tâche,
fermeture / réouverture de l'appli avec une file non vide, déconnexion avec file non vide puis autre compte,
anciennes données sur l'appareil (file sans compte, cache illisible, apparence « night », garde-manger local).

Le faux serveur applique ce que fait PostgreSQL pour ces cas : « on conflict … do nothing » (Prefer: resolution=
ignore-duplicates), version +1 à chaque modification, update_if_version (ok / conflict + ligne actuelle).

Usage :
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/audit8/dist
  python3 e2e/spa_server.py /tmp/audit8/dist 8978 &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8978 python3 e2e/audit_fiabilite.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide. Sortie : code 1 sinon.
"""
import glob, json, os, re, sys, time, urllib.parse, uuid
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import FakeSupabase, now  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8978')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/audit8/shots')
EXE = os.environ.get('PW_CHROMIUM') or None
if EXE and os.path.isdir(EXE):
    EXE = (glob.glob(os.path.join(EXE, '**', 'chrome'), recursive=True) or [EXE])[0]
os.makedirs(SHOTS, exist_ok=True)
R, errs, notes = {}, [], {}
VERSIONED = {'family_tasks', 'care_requests', 'shopping_items', 'household_stocks'}
CORS = {'access-control-allow-origin': '*', 'access-control-expose-headers': '*', 'content-type': 'application/json'}


class FiabFake(FakeSupabase):
    """Faux Supabase + règles d'idempotence et de version du vrai serveur, et pannes injectables."""
    def __init__(self):
        super().__init__()
        self.inject = []      # [{'method','table','mode','times'}] : '500' | 'lost' | '503'

    def rest(self, method, table, params, body, headers, uid):
        if method == 'POST':
            items = body if isinstance(body, list) else [body]
            conflict = params.get('on_conflict')
            if conflict and 'ignore-duplicates' in headers.get('prefer', ''):
                keys = conflict.split(',')
                items = [it for it in items if not any(all(str(r.get(k)) == str(it.get(k)) for k in keys) for r in self.t(table))]
                if not items: return 201, []
            status, out = super().rest(method, table, params, items, headers, uid)
            for r in out:
                r.setdefault('created_by', uid)
                if table in VERSIONED: r['version'] = 1; r.setdefault('updated_at', now())
                if table == 'family_tasks':
                    for k, v in (('status', 'todo'), ('priority', 'normal'), ('category', 'other'), ('essential', False), ('assignee_id', None),
                                 ('due_at', None), ('recurrence', None), ('notes', None), ('done_at', None), ('done_by', None), ('routine_id', None)):
                        r.setdefault(k, v)
                if table == 'care_requests': r.setdefault('status', 'open'); r.setdefault('from_user', uid)
            return status, out
        if method == 'PATCH' and table in VERSIONED:
            body = {k: v for k, v in body.items() if k not in ('version', 'client_id')}
            status, out = super().rest(method, table, params, body, headers, uid)
            for r in out: r['version'] = r.get('version', 1) + 1; r['updated_at'] = now()
            return status, out
        return super().rest(method, table, params, body, headers, uid)

    def rpc(self, fn, body, uid):
        if fn == 'update_if_version':
            row = next((r for r in self.t(body['p_table']) if r['id'] == body['p_id']), None)
            if not row: return 200, {'status': 'not_found'}
            if int(row.get('version', 1)) != int(body['p_expected_version']): return 200, {'status': 'conflict', 'row': dict(row)}
            row.update(body['p_patch']); row['version'] = int(row.get('version', 1)) + 1; row['updated_at'] = now()
            if row.get('status') == 'done' and not row.get('done_at'): row['done_at'] = now(); row['done_by'] = uid
            return 200, {'status': 'ok', 'row': dict(row)}
        if fn == 'household_member_names':
            return 200, [{'household_id': m['household_id'], 'user_id': m['user_id'], 'role': m['role'], 'display_name': self.users[m['user_id']]['meta'].get('n'), 'avatar_path': None}
                         for m in self.t('household_members') if m['household_id'] in {x['household_id'] for x in self.t('household_members') if x['user_id'] == uid}]
        return super().rpc(fn, body, uid)

    def apply(self, req):
        """Exécute la requête côté « serveur » sans répondre (réponse perdue)."""
        u = urllib.parse.urlparse(req.url)
        headers = {k.lower(): v for k, v in req.headers.items()}
        try: body = json.loads(req.post_data) if req.post_data else {}
        except Exception: body = {}
        self.calls.append((req.method, u.path + ('?' + u.query if u.query else '')))
        return self.dispatch(req.method, u.path, dict(urllib.parse.parse_qsl(u.query)), body, headers, self.uid_from(headers))

    def handler(self, route):
        req = route.request
        m = re.search(r'/rest/v1/([a-z_]+)', req.url)
        table = m.group(1) if m else None
        for inj in list(self.inject):
            if req.method == inj['method'] and table == inj['table']:
                inj['times'] -= 1
                if inj['times'] <= 0: self.inject.remove(inj)
                self.calls.append((req.method + '!' + inj['mode'], urllib.parse.urlparse(req.url).path))
                if inj['mode'] == 'lost':
                    self.apply(req)                      # le serveur ÉCRIT…
                    return route.abort('connectionreset')  # … mais la réponse n'arrive jamais
                return route.fulfill(status=int(inj['mode']), headers=CORS, body=json.dumps({'code': 'XX000', 'message': 'Erreur interne simulée'}))
        return self.route(route)

    def posts(self, table):
        return [c for c in self.calls if c[0] == 'POST' and c[1].startswith(f'/rest/v1/{table}')]


fake = FiabFake()


def user(email, name):
    uid = str(uuid.uuid4())
    fake.users[uid] = {'id': uid, 'email': email, 'password': 'abcdefg1', 'confirmed': True, 'meta': {'n': name}}
    fake.trigger_new_user(fake.users[uid])
    next(x for x in fake.t('profiles') if x['id'] == uid).update({'onboarding_completed': True, 'journeys': ['newborn'], 'display_name': name})
    return uid


OW = user('marie@exemple.test', 'Marie')
H = next(m['household_id'] for m in fake.t('household_members') if m['user_id'] == OW)
fake.premium_users.add(OW)
CP = user('paul@exemple.test', 'Paul')
# Paul rejoint le foyer de Marie (son foyer automatique disparaît, comme accept_household_invitation)
fake.T['households'] = [h for h in fake.t('households') if h['created_by'] != CP]
fake.T['household_members'] = [m for m in fake.t('household_members') if m['user_id'] != CP]
DOM = ['daily', 'health', 'documents', 'pregnancy', 'lists', 'names', 'profile']
fake.t('household_members').append({'household_id': H, 'user_id': CP, 'role': 'coparent', 'can_view': DOM, 'can_edit': DOM, 'joined_at': now()})
fake.t('children').append({'id': str(uuid.uuid4()), 'household_id': H, 'first_name': 'Lina', 'birth_date': '2026-06-01', 'sex': 'f', 'created_at': now()})


def rows(table, **eq):
    return [r for r in fake.t(table) if all(r.get(k) == v for k, v in eq.items())]


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def shot(pg, name):
    try: pg.screenshot(path=f'{SHOTS}/{name}.png')
    except Exception: pass


def body(pg):
    try: return pg.inner_text('body')
    except Exception: return ''


def new_page(ctx, label):
    pg = ctx.new_page()
    pg.route('http://sb.fake.test/**', fake.handler)
    pg.route(re.compile(r'wss?://sb\.fake\.test/.*'), lambda r: r.abort())
    pg.route(re.compile(r'https://(d8j0ntlcm91z4\.cloudfront\.net|cdn\.5sdesign\.art|fonts\.).*'), lambda r: r.abort())
    pg.on('pageerror', lambda e: errs.append(f'[{label}] PAGE ' + str(e)[:200]))
    pg.on('console', lambda m: m.type == 'error' and not re.search(r'Failed to load resource|ERR_|net::|sb\.fake\.test|WebSocket|realtime', m.text) and errs.append(f'[{label}] ' + m.text[:200]))
    return pg


def sign_in(pg, email):
    pg.goto(B + '/auth/sign-in'); pg.wait_for_timeout(3500)
    pg.get_by_label('Adresse e-mail').fill(email)
    pg.get_by_label('Mot de passe', exact=True).fill('abcdefg1')
    pg.get_by_role('button', name='Se connecter').last.click(); pg.wait_for_timeout(4500)


def quick_add(pg, title):
    tid(pg, 'family-quick').fill(title)
    tid(pg, 'family-quick-add').click()
    pg.wait_for_timeout(1200)


def queue(pg):
    raw = pg.evaluate("() => localStorage.getItem('toietmoi.offline.v1')")
    return json.loads(raw) if raw else {'pending': [], 'conflicts': []}


def wait_until(pg, cond, ms=12000, step=500):
    t0 = time.time()
    while (time.time() - t0) * 1000 < ms:
        if cond(): return True
        pg.wait_for_timeout(step)
    return cond()


def check(key, fn):
    try: R[key] = bool(fn())
    except Exception as e:  # un scénario qui casse ne masque pas les suivants
        R[key] = False; errs.append(f'{key} : {type(e).__name__} {str(e)[:160]}')


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = new_page(ctx, 'Marie')
    sign_in(pg, 'marie@exemple.test')
    pg.goto(B + '/family'); pg.wait_for_timeout(3500)
    shot(pg, '00-famille')

    # ------------------------------------------------------------ S1 hors ligne → file → reconnexion → envoi unique
    def s1():
        ctx.set_offline(True); pg.wait_for_timeout(800)
        quick_add(pg, 'Tâche hors ligne')
        txt = body(pg)
        notes['S1_message'] = next((m for m in ('Gardé sur ce téléphone', 'Ajoutée') if m in txt), '')
        queued = len(queue(pg)['pending'])
        sent_offline = len(rows('family_tasks', title='Tâche hors ligne'))
        shot(pg, 'S1-hors-ligne')
        ctx.set_offline(False)
        ok = wait_until(pg, lambda: len(rows('family_tasks', title='Tâche hors ligne')) == 1, 10000)
        pg.wait_for_timeout(1500)
        R['S1_message_honnete_hors_ligne'] = 'Gardé sur ce téléphone' in txt
        return queued == 1 and sent_offline == 0 and ok and len(rows('family_tasks', title='Tâche hors ligne')) == 1 and not queue(pg)['pending']
    check('S1_hors_ligne_file_puis_un_seul_envoi', s1)

    # ------------------------------------------------------------ S2 erreur 500 → message honnête → nouvel essai automatique
    def s2():
        fake.inject.append({'method': 'POST', 'table': 'family_tasks', 'mode': '500', 'times': 1})
        quick_add(pg, 'Tâche 500')
        txt = body(pg)
        R['S2_pas_de_faux_ajoutee_apres_500'] = 'Gardé sur ce téléphone' in txt
        shot(pg, 'S2-500')
        # aucune action de l'utilisatrice : le réessai doit partir seul (réseau présent, NetInfo ne change pas)
        ok = wait_until(pg, lambda: len(rows('family_tasks', title='Tâche 500')) == 1, 12000)
        pg.wait_for_timeout(1000)
        notes['S2_posts'] = len([c for c in fake.calls if c[1].startswith('/rest/v1/family_tasks') and c[0].startswith('POST')])
        return ok and len(rows('family_tasks', title='Tâche 500')) == 1
    check('S2_500_reessai_automatique_une_ligne', s2)

    # ------------------------------------------------------------ S3 réponse perdue après écriture réussie → pas de doublon
    def s3():
        fake.inject.append({'method': 'POST', 'table': 'family_tasks', 'mode': 'lost', 'times': 1})
        quick_add(pg, 'Tâche réponse perdue')
        written = len(rows('family_tasks', title='Tâche réponse perdue'))
        wait_until(pg, lambda: not queue(pg)['pending'], 12000)
        pg.wait_for_timeout(1000)
        n = len(rows('family_tasks', title='Tâche réponse perdue'))
        notes['S3_lignes'] = n
        return written == 1 and n == 1 and not queue(pg)['pending']
    check('S3_reponse_perdue_rejeu_sans_doublon', s3)

    # ------------------------------------------------------------ S4 double pression (deux clics dans le même instant)
    def s4():
        tid(pg, 'family-quick').fill('Tâche double clic')
        pg.evaluate("() => { const el = [...document.querySelectorAll('[data-testid=\"family-quick-add\"]')].find((e) => e.offsetParent); el.click(); el.click(); }")
        pg.wait_for_timeout(2500)
        n = len(rows('family_tasks', title='Tâche double clic'))
        notes['S4_lignes'] = n
        return n == 1
    check('S4_double_pression_un_seul_effet', s4)

    # ------------------------------------------------------------ S5 demande d'aide (envoi direct) : réponse perdue puis « Réessayer »
    def s5():
        pg.goto(B + '/family/sos'); pg.wait_for_timeout(3000)
        before = len(rows('care_requests', kind='relay'))
        fake.inject.append({'method': 'POST', 'table': 'care_requests', 'mode': 'lost', 'times': 1})
        pg.get_by_text('Demander le relais au foyer').first.click(); pg.wait_for_timeout(1500)
        txt1 = body(pg)
        R['S5_pas_de_faux_envoye_apres_coupure'] = 'Demande envoyée' not in txt1
        shot(pg, 'S5-coupure')
        pg.wait_for_timeout(3000)  # le toast d'erreur disparaît
        pg.get_by_text('Demander le relais au foyer').first.click(); pg.wait_for_timeout(1500)
        R['S5_confirmation_au_second_essai'] = 'Demande envoyée' in body(pg)
        n = len(rows('care_requests', kind='relay')) - before
        notes['S5_demandes'] = n
        return n == 1
    check('S5_demande_reessayee_sans_doublon', s5)

    # ------------------------------------------------------------ S6 deux membres modifient la même tâche
    t_same = {'id': str(uuid.uuid4()), 'household_id': H, 'title': 'Rendez-vous crèche', 'category': 'other', 'status': 'todo', 'priority': 'normal', 'essential': False,
              'due_at': None, 'assignee_id': None, 'created_by': OW, 'created_at': now(), 'updated_at': now(), 'recurrence': None, 'notes': None, 'routine_id': None,
              'done_at': None, 'done_by': None, 'version': 1, 'client_id': None}
    t_other = dict(t_same, id=str(uuid.uuid4()), title='Préparer le sac')
    fake.t('family_tasks').extend([t_same, t_other])

    def open_task(title):
        pg.goto(B + '/family'); pg.wait_for_timeout(3500)
        pg.get_by_label(f'Modifier {title}').first.click(); pg.wait_for_timeout(1500)

    def save_title(new):
        f = pg.get_by_label('Titre', exact=True).filter(visible=True).first
        f.fill(new)
        pg.get_by_role('button', name='Enregistrer').filter(visible=True).last.evaluate('(e) => e.click()'); pg.wait_for_timeout(2500)

    def s6():
        open_task('Rendez-vous crèche')
        t_same.update({'title': 'Rendez-vous crèche 9 h', 'version': 2})   # Paul a modifié le titre entre-temps
        save_title('Rendez-vous crèche 10 h')
        txt = body(pg)
        shot(pg, 'S6-conflit')
        R['S6_message_conflit_comprehensible'] = 'modifiée entre-temps' in txt
        notes['S6_titre_serveur'] = t_same['title']
        return t_same['title'] == 'Rendez-vous crèche 9 h'
    check('S6_conflit_meme_champ_rien_ecrase', s6)

    def s6b():
        open_task('Préparer le sac')
        t_other.update({'notes': 'Doudou + gourde (Paul)', 'version': 2})  # Paul a ajouté une note
        save_title('Préparer le sac de Lina')
        return t_other['title'] == 'Préparer le sac de Lina' and t_other['notes'] == 'Doudou + gourde (Paul)'
    check('S6b_champs_differents_les_deux_gardes', s6b)

    # ------------------------------------------------------------ S7 fermeture / réouverture en pleine file
    def s7():
        pg.goto(B + '/family'); pg.wait_for_timeout(3000)
        ctx.set_offline(True); pg.wait_for_timeout(800)
        quick_add(pg, 'Tâche avant fermeture')
        q = queue(pg)['pending']
        pg.close()
        ctx.set_offline(False)
        globals()['pg'] = new_page(ctx, 'Marie-2')
        pg2 = globals()['pg']
        pg2.goto(B + '/family'); pg2.wait_for_timeout(5000)
        ok = wait_until(pg2, lambda: len(rows('family_tasks', title='Tâche avant fermeture')) == 1, 10000)
        return len(q) == 1 and q[0]['owner'] == OW and ok and len(rows('family_tasks', title='Tâche avant fermeture')) == 1 and not queue(pg2)['pending']
    check('S7_reouverture_file_envoyee_une_fois', s7)

    # ------------------------------------------------------------ S8 déconnexion avec file non vide, puis un autre compte
    def s8():
        pg = globals()['pg']
        fake.inject.append({'method': 'POST', 'table': 'family_tasks', 'mode': '503', 'times': 999})
        pg.goto(B + '/family'); pg.wait_for_timeout(3000)
        quick_add(pg, 'Tâche de Marie en attente')
        pending = queue(pg)['pending']
        pg.goto(B + '/settings'); pg.wait_for_timeout(3000)
        pg.get_by_role('button', name='Se déconnecter').first.click(); pg.wait_for_timeout(1500)
        txt = body(pg)
        R['S8_avertissement_saisies_non_envoyees'] = 'pas encore envoyée' in txt
        shot(pg, 'S8-deconnexion')
        pg.get_by_role('button', name='Se déconnecter').last.click(); pg.wait_for_timeout(3000)
        fake.inject = [i for i in fake.inject if i['mode'] != '503']
        posts_before = len(fake.posts('family_tasks'))
        sign_in(pg, 'paul@exemple.test')
        pg.goto(B + '/family'); pg.wait_for_timeout(4000)
        sent_as_paul = [r for r in rows('family_tasks', title='Tâche de Marie en attente')]
        q = queue(pg)
        notes['S8'] = {'file_avant': len(pending), 'posts_apres_paul': len(fake.posts('family_tasks')) - posts_before, 'file_apres': len(q['pending'])}
        return len(pending) == 1 and not sent_as_paul and not any(o.get('owner') == OW for o in q['pending'] + q['conflicts'])
    check('S8_file_dun_autre_compte_jamais_envoyee', s8)

    # ------------------------------------------------------------ S9 données anciennes sur l'appareil
    def s9():
        ctx2 = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
        p9 = new_page(ctx2, 'ancien')
        p9.goto(B + '/welcome'); p9.wait_for_timeout(2000)
        old_cid = str(uuid.uuid4())
        p9.evaluate("""([hid, cid]) => {
          // file d'avant le 09/11/2026 (aucun compte noté), cache React Query illisible, apparence « night », garde-manger local
          localStorage.setItem('toietmoi.offline.v1', JSON.stringify({ pending: [{ id: cid, table: 'family_tasks', row: { client_id: cid, household_id: hid, title: 'Ancienne saisie en file' }, queuedAt: '2026-11-01T08:00:00Z' }], conflicts: [] }));
          localStorage.setItem('toietmoi.cache.v1', '{ceci n\\'est pas du JSON');
          localStorage.setItem('toietmoi.ui', JSON.stringify({ state: { themePreference: 'night', palettePreference: 'auto', pantry: ['pates', 'riz'], pantryMigrated: [] }, version: 0 }));
        }""", [H, old_cid])
        p9.reload(); p9.wait_for_timeout(2500)
        sign_in(p9, 'marie@exemple.test')
        p9.goto(B + '/family'); p9.wait_for_timeout(5000)
        ok_old = wait_until(p9, lambda: len(rows('family_tasks', client_id=old_cid)) == 1, 10000)
        R['S9_ancienne_file_envoyee_une_fois'] = ok_old and len(rows('family_tasks', client_id=old_cid)) == 1
        pantry = lambda: [r for r in fake.t('household_stocks') if r.get('source') == 'pantry' and r.get('household_id') == H]  # noqa: E731
        R['S9_garde_manger_migre'] = wait_until(p9, lambda: len(pantry()) == 2, 8000)
        # Deuxième appareil avec le même garde-manger local : aucun doublon (client_id déterministe)
        p9b = new_page(ctx2, 'ancien-2')
        p9b.goto(B + '/welcome'); p9b.wait_for_timeout(1500)
        p9b.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.ui')); s.state.pantry = ['pates', 'riz']; s.state.pantryMigrated = []; localStorage.setItem('toietmoi.ui', JSON.stringify(s)); }")
        p9b.goto(B + '/family'); p9b.wait_for_timeout(5000)
        R['S9_garde_manger_rejoue_sans_doublon'] = len(pantry()) == 2
        p9.goto(B + '/settings'); p9.wait_for_timeout(2500)
        shot(p9, 'S9-ancien-format')
        rendered = 'Apparence' in body(p9) and not any(e.startswith('[ancien') for e in errs)
        ctx2.close()
        return rendered
    check('S9_app_demarre_avec_donnees_anciennes', s9)

    R['erreurs'] = errs
    print(json.dumps({'resultats': R, 'observations': notes}, ensure_ascii=False, indent=1))
    b.close()

sys.exit(0 if all(v is True for k, v in R.items() if k != 'erreurs') and not errs else 1)
