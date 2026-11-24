"""
Parcours navigateur à TROIS comptes : Espace Nounou (21/11/2026).
Parent 1 (propriétaire, Premium), parent 2 (co-parent) et une nounou, chacun dans son navigateur, contre un même faux
Supabase (fake_supabase.py étendu ici : RPC childcare_*, stockage, règles d'accès de la garde ÉMULÉES — la vraie RLS
est vérifiée par supabase/tests/sql/98zb_espace_nounou.sql).
Parcours : invitation → acceptation → confirmation → saisies du carnet (biberon, repas, sieste début/fin, change,
observation, activité, information importante) → photo (sélection de fichier, substitut web de la caméra : refus
de la photo de groupe, annulation, partage) → réception par les 2 parents → album (souvenirs, téléchargement
autorisé / interdit, suppression) → messages → hors ligne et synchronisation → doublon fusionné → révocation.
Usage : version web exportée (voir e2e/README.md), puis
  E2E_URL=http://127.0.0.1:<port> E2E_SHOTS=<dossier> python3 e2e/espace_nounou.py
La caméra, les autorisations iOS, les notifications push et l'enregistrement dans la photothèque ne sont vérifiables
que sur iPhone (docs/ESPACE_NOUNOU.md).
"""
import json, os, re, sys, uuid, time, base64, urllib.parse
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import FakeSupabase, FakeRealtime, now

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8811')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e/nounou')
GPS_JPG = os.environ.get('E2E_GPS_JPG', '')
os.makedirs(SHOTS, exist_ok=True)
R = {}; errs = []


class FakeCare(FakeSupabase):
    """Faux Supabase + espace nounou (mêmes règles que 20261121000100_espace_nounou.sql, émulées)."""
    CHILD_TABLES = ('bottles', 'meals', 'sleeps', 'diapers', 'child_observations', 'childcare_events', 'childcare_photos', 'childcare_messages', 'childcare_settings')

    def __init__(self):
        super().__init__()
        self.objects = {}        # chemin → octets
        self.uploads = []        # (chemin, octets) reçus
        self.removed = []
        self.offline_pages = set()

    # ---------------------------------------------------------------- droits émulés
    def member(self, hid, uid): return next((m for m in self.t('household_members') if m['household_id'] == hid and m['user_id'] == uid), None)
    def child(self, cid): return next((c for c in self.t('children') if c['id'] == cid), None)
    def is_parent(self, cid, uid):
        c = self.child(cid); m = c and self.member(c['household_id'], uid)
        return bool(m and m['role'] in ('owner', 'coparent'))
    def active(self, cid, uid):
        c = self.child(cid); m = c and self.member(c['household_id'], uid)
        if not m or m['role'] != 'caregiver' or cid not in (m.get('child_scope') or []): return False
        return any(l['child_id'] == cid and l['caregiver_id'] == uid and l['confirmed_at'] and not l['revoked_at'] for l in self.t('childcare_links'))
    def visible(self, table, r, uid):
        if table == 'childcare_links': return self.is_parent(r['child_id'], uid) or r.get('caregiver_id') == uid
        if table == 'children':
            m = self.member(r['household_id'], uid)
            return bool(m and (m['role'] != 'caregiver' or r['id'] in (m.get('child_scope') or [])))
        if table in self.CHILD_TABLES and r.get('child_id'):
            if self.is_parent(r['child_id'], uid): return True
            if table == 'childcare_photos': return r.get('author_id') == uid and self.active(r['child_id'], uid)
            return self.active(r['child_id'], uid)
        return True

    def rest(self, method, table, params, body, headers, uid):
        if method == 'POST':
            items = body if isinstance(body, list) else [body]
            conflict = params.get('on_conflict'); ignore = 'ignore-duplicates' in headers.get('prefer', '')
            out = []
            for it in items:
                it = dict(it)
                if 'child_id' in it and table in self.CHILD_TABLES:
                    c = self.child(it['child_id'])
                    if not c or not (self.is_parent(it['child_id'], uid) or self.active(it['child_id'], uid)):
                        return 403, {'code': '42501', 'message': 'new row violates row-level security policy'}
                    it.setdefault('household_id', c['household_id'])
                    if table == 'childcare_photos':
                        st = next((s for s in self.t('childcare_settings') if s['child_id'] == it['child_id']), None)
                        if not self.active(it['child_id'], uid) or not (st and st['photos_allowed']) or it.get('only_this_child') is not True:
                            return 403, {'code': '42501', 'message': 'new row violates row-level security policy'}
                        it['author_id'] = uid
                    else:
                        it['created_by' if table != 'childcare_messages' else 'author_id'] = uid
                    it['origin'] = 'caregiver' if self.member(c['household_id'], uid)['role'] == 'caregiver' else 'parent'
                if conflict and ignore:
                    keys = conflict.split(',')
                    if any(all(str(r.get(k)) == str(it.get(k)) for k in keys) for r in self.t(table)): continue
                it.setdefault('id', str(uuid.uuid4())); it.setdefault('created_at', now())
                self.t(table).append(it); out.append(it)
            return 201, out
        if method in ('GET', 'HEAD'):
            st, rows = super().rest(method, table, params, body, headers, uid)
            if st == 200 and isinstance(rows, list): rows = [r for r in rows if self.visible(table, r, uid)]
            return st, rows
        if method in ('PATCH', 'DELETE'):
            # n'agit que sur ce que la personne voit
            hidden = [r for r in self.t(table) if not self.visible(table, r, uid)]
            self.T[table] = [r for r in self.t(table) if self.visible(table, r, uid)]
            st, out = super().rest(method, table, params, body, headers, uid)
            self.T[table] = self.t(table) + hidden
            return st, out
        return super().rest(method, table, params, body, headers, uid)

    def rpc(self, fn, body, uid):
        T = self.t
        if fn == 'has_premium': return 200, uid in self.premium_users
        if fn == 'my_access':
            return 200, {'premium': uid in self.premium_users, 'ai': False, 'trial_until': None, 'strict': True,
                         'caregiver': any(m['user_id'] == uid and m['role'] == 'caregiver' for m in T('household_members')), 'tools': []}
        if fn == 'household_member_names':
            mine = [m for m in T('household_members') if m['user_id'] == uid and (not body.get('p_household') or m['household_id'] == body['p_household'])]
            out = []
            for me in mine:
                for o in T('household_members'):
                    if o['household_id'] != me['household_id']: continue
                    if me['role'] in ('owner', 'coparent') or o['role'] in ('owner', 'coparent') or o['user_id'] == uid:
                        p = next((x for x in T('profiles') if x['id'] == o['user_id']), {})
                        out.append({'household_id': o['household_id'], 'user_id': o['user_id'], 'role': o['role'], 'display_name': p.get('display_name'), 'avatar_path': None})
            return 200, out
        if fn == 'childcare_invite':
            if not self.is_parent(body['p_child'], uid): return 403, {'code': '42501', 'message': 'Seul un parent de cet enfant peut inviter une nounou'}
            tok = uuid.uuid4().hex + uuid.uuid4().hex[:4]; inv = str(uuid.uuid4()); lid = str(uuid.uuid4())
            exp = time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(time.time() + 72 * 3600))
            hid = self.child(body['p_child'])['household_id']
            T('household_invitations').append({'id': inv, 'household_id': hid, 'token': tok, 'role': 'caregiver', 'can_view': ['daily'], 'can_edit': ['daily'], 'child_scope': [],
                                               'created_at': now(), 'expires_at': exp, 'accepted_at': None, 'revoked_at': None})
            T('childcare_links').append({'id': lid, 'household_id': hid, 'child_id': body['p_child'], 'caregiver_id': None, 'invitation_id': inv, 'invited_by': uid,
                                         'label': body.get('p_label'), 'created_at': now(), 'expires_at': exp, 'accepted_at': None, 'confirmed_at': None, 'revoked_at': None})
            return 200, {'token': tok, 'link_id': lid, 'expires_at': exp}
        if fn == 'childcare_accept':
            inv = next((i for i in T('household_invitations') if i.get('token') == body.get('p_token') and not i['accepted_at'] and not i['revoked_at']), None)
            link = inv and next((l for l in T('childcare_links') if l['invitation_id'] == inv['id'] and not l['revoked_at']), None)
            if not link: return 400, {'code': 'P0002', 'message': 'Invitation invalide ou expirée'}
            m = self.member(inv['household_id'], uid)
            if m and m['role'] != 'caregiver': return 409, {'code': '23505', 'message': 'Vous faites déjà partie de ce foyer.'}
            if not m:
                T('household_members').append({'household_id': inv['household_id'], 'user_id': uid, 'role': 'caregiver', 'can_view': ['daily'], 'can_edit': ['daily'], 'child_scope': [], 'joined_at': now()})
                for h in list(T('households')):
                    if h['created_by'] == uid and h.get('auto_created'):
                        self.T['households'] = [x for x in T('households') if x['id'] != h['id']]
                        self.T['household_members'] = [x for x in T('household_members') if x['household_id'] != h['id']]
            inv['accepted_at'] = now(); link['caregiver_id'] = uid; link['accepted_at'] = now()
            return 200, {'household_id': inv['household_id'], 'link_id': link['id']}
        if fn in ('childcare_confirm', 'childcare_revoke'):
            l = next((x for x in T('childcare_links') if x['id'] == body.get('p_link')), None)
            if not l or not self.is_parent(l['child_id'], uid): return 403, {'code': '42501', 'message': 'Accès refusé'}
            m = l['caregiver_id'] and self.member(l['household_id'], l['caregiver_id'])
            if fn == 'childcare_confirm':
                l['confirmed_at'] = now(); l['confirmed_by'] = uid
                if m: m['child_scope'] = sorted(set((m.get('child_scope') or []) + [l['child_id']]))
            else:
                l['revoked_at'] = now()
                if m:
                    m['child_scope'] = [c for c in (m.get('child_scope') or []) if c != l['child_id']]
                    if not m['child_scope']: self.T['household_members'] = [x for x in T('household_members') if x is not m]
            return 200, None
        if fn == 'childcare_set_settings':
            if not self.is_parent(body['p_child'], uid): return 403, {'code': '42501', 'message': 'Seul un parent'}
            s = next((x for x in T('childcare_settings') if x['child_id'] == body['p_child']), None)
            if not s:
                s = {'child_id': body['p_child'], 'household_id': self.child(body['p_child'])['household_id'], 'photos_allowed': False, 'photos_allowed_at': None,
                     'photos_allowed_by': None, 'retention': '30d', 'allow_download': False, 'notify_name': False}
                T('childcare_settings').append(s)
            if body.get('p_photos_allowed') is not None and body['p_photos_allowed'] != s['photos_allowed']:
                s['photos_allowed'] = body['p_photos_allowed']; s['photos_allowed_at'] = now(); s['photos_allowed_by'] = uid
                T('childcare_consents').append({'child_id': body['p_child'], 'user_id': uid, 'photos_allowed': body['p_photos_allowed'], 'created_at': now()})
            for k, a in (('retention', 'p_retention'), ('allow_download', 'p_allow_download'), ('notify_name', 'p_notify_name')):
                if body.get(a) is not None: s[k] = body[a]
            return 200, s
        if fn == 'my_childcare':
            out = []
            for l in T('childcare_links'):
                if l['caregiver_id'] != uid or l['revoked_at']: continue
                h = next((x for x in T('households') if x['id'] == l['household_id']), {})
                act = self.active(l['child_id'], uid); c = self.child(l['child_id'])
                st = next((x for x in T('childcare_settings') if x['child_id'] == l['child_id']), None)
                out.append({'link_id': l['id'], 'household_id': l['household_id'], 'household_name': h.get('name'), 'status': 'active' if act else 'pending',
                            'child': {'id': c['id'], 'first_name': c['first_name'], 'birth_date': c['birth_date'], 'household_id': c['household_id']} if act else None,
                            'photos_allowed': bool(act and st and st['photos_allowed'])})
            return 200, out
        if fn == 'childcare_photo_to_memories':
            p = next((x for x in T('childcare_photos') if x['id'] == body.get('p_photo')), None)
            if not p or not self.is_parent(p['child_id'], uid): return 403, {'code': '42501', 'message': 'Accès refusé'}
            mid = str(uuid.uuid4()); T('child_photos').append({'id': mid, 'household_id': p['household_id'], 'child_id': p['child_id'], 'storage_path': p['storage_path'], 'taken_on': p['taken_at'][:10], 'visibility': 'household', 'created_at': now()})
            p['memory_photo_id'] = mid
            return 200, mid
        if fn == 'childcare_purge_now': return 200, 0
        return super().rpc(fn, body, uid)

    # ---------------------------------------------------------------- stockage (octets)
    def route(self, route):
        req = route.request
        # Coupure réseau d'UN téléphone : ses requêtes échouent (les requêtes interceptées ignorent set_offline)
        if self.offline_pages and route.request.frame.page in self.offline_pages: return route.abort('internetdisconnected')
        u = urllib.parse.urlparse(req.url)
        if not u.path.startswith('/storage/v1/object'): return super().route(route)
        h = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*'}
        if req.method == 'OPTIONS': return route.fulfill(status=200, headers=h)
        uid = self.uid_from({k.lower(): v for k, v in req.headers.items()})
        rest = u.path[len('/storage/v1/object/'):]
        j = lambda st, p: route.fulfill(status=st, headers={**h, 'content-type': 'application/json'}, body=json.dumps(p))
        if rest.startswith('sign/'):
            path = rest[len('sign/child-photos/'):]
            if req.method == 'POST':
                ok = any(p['storage_path'] == path and self.visible('childcare_photos', p, uid) for p in self.t('childcare_photos'))
                if not ok or path not in self.objects: return j(400, {'statusCode': '404', 'error': 'not_found', 'message': 'Object not found'})
                return j(200, {'signedURL': f'/object/sign/child-photos/{path}?token=t{uuid.uuid4().hex[:6]}'})
            if path not in self.objects: return j(404, {'message': 'not found'})
            return route.fulfill(status=200, headers={**h, 'content-type': 'image/jpeg'}, body=self.objects[path])
        if req.method == 'DELETE':
            body = json.loads(req.post_data or '{}')
            for p in body.get('prefixes', []):
                if p in self.objects and not any(x['storage_path'] == p for x in self.t('childcare_photos') + self.t('child_photos')):
                    del self.objects[p]; self.removed.append(p)
            return j(200, [])
        path = rest[len('child-photos/'):]
        if path in self.objects: return j(400, {'statusCode': '409', 'error': 'Duplicate', 'message': 'The resource already exists'})
        data = req.post_data_buffer or b''
        self.objects[path] = data; self.uploads.append((path, data))
        return j(200, {'Key': f'child-photos/{path}', 'Id': str(uuid.uuid4())})


fake = FakeCare()
def mk_user(email, name, onboarded=True):
    uid = str(uuid.uuid4())
    fake.users[uid] = {'id': uid, 'email': email, 'password': 'abcdefg1', 'confirmed': True, 'meta': {}}
    fake.trigger_new_user(fake.users[uid])
    next(x for x in fake.t('profiles') if x['id'] == uid).update({'onboarding_completed': onboarded, 'journeys': ['newborn'] if onboarded else [], 'display_name': name})
    return uid
P1 = mk_user('parent1@exemple.test', 'Camille'); P2 = mk_user('parent2@exemple.test', 'Alex'); NN = mk_user('nounou@exemple.test', 'Sophie', onboarded=False)
H = next(m['household_id'] for m in fake.t('household_members') if m['user_id'] == P1)
next(h for h in fake.t('households') if h['id'] == H).update({'name': 'Famille Martin', 'auto_created': False})
# le second parent rejoint le foyer (son foyer automatique disparaît)
h2 = next(m['household_id'] for m in fake.t('household_members') if m['user_id'] == P2)
fake.T['households'] = [h for h in fake.t('households') if h['id'] != h2]
fake.T['household_members'] = [m for m in fake.t('household_members') if m['household_id'] != h2]
fake.t('household_members').append({'household_id': H, 'user_id': P2, 'role': 'coparent', 'can_view': ['daily', 'health', 'documents', 'lists', 'profile'], 'can_edit': ['daily', 'lists', 'profile'], 'child_scope': None, 'joined_at': now()})
LOU = str(uuid.uuid4())
fake.t('children').append({'id': LOU, 'household_id': H, 'first_name': 'Lou', 'birth_date': '2025-12-01', 'sex': 'female', 'photo_path': None, 'archived': False, 'enabled_tracking': [], 'allergies_declared': [], 'created_at': now()})
fake.premium_users.update({P1, P2})

def tid(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0
def shot(pg, name): pg.screenshot(path=os.path.join(SHOTS, name + '.png'), full_page=False)

BROWSER = []
def open_ctx(p, email, scheme='light', width=390):
    if not BROWSER: BROWSER.append(p.chromium.launch(executable_path=os.environ.get('E2E_CHROME') or None))
    ctx = BROWSER[0].new_context(viewport={'width': width, 'height': 844}, locale='fr-FR', color_scheme=scheme)
    pg = ctx.new_page(); rt = FakeRealtime()
    pg.route('http://sb.fake.test/**', fake.route)
    pg.route_web_socket(re.compile(r'wss?://sb\.fake\.test/realtime/.*'), rt.attach)
    pg.route(re.compile(r'https://(d8j0ntlcm91z4\.cloudfront\.net|cdn\.5sdesign\.art)/.*'), lambda r: r.abort())
    pg.on('pageerror', lambda e: errs.append(f'{email}: ' + str(e)[:200]))
    pg.goto(B + '/auth/sign-in'); pg.wait_for_timeout(3000)
    pg.get_by_label('Adresse e-mail').fill(email)
    pg.get_by_label('Mot de passe', exact=True).fill('abcdefg1')
    pg.get_by_role('button', name='Se connecter').last.click(); pg.wait_for_timeout(3500)
    return ctx, pg, rt

def rows(table, **kw): return [r for r in fake.t(table) if all(r.get(k) == v for k, v in kw.items())]
def confirm_dialog(pg, label): pg.get_by_role('button', name=label).last.click(); pg.wait_for_timeout(1200)

with sync_playwright() as p:
    c1, p1, rt1 = open_ctx(p, 'parent1@exemple.test')
    c2, p2, rt2 = open_ctx(p, 'parent2@exemple.test')
    cn, pn, rtn = open_ctx(p, 'nounou@exemple.test')

    # 1. invitation (parent 1)
    p1.goto(B + f'/garde/{LOU}/acces'); p1.wait_for_timeout(3000)
    tid(p1, 'care-invite-label').fill('Sophie')
    tid(p1, 'care-invite').click(); p1.wait_for_timeout(1500)
    code = tid(p1, 'care-invite-code').inner_text().strip()
    R['invitation_creee'] = len(code) >= 16 and len(rows('childcare_links', child_id=LOU)) == 1
    inv0 = rows('household_invitations', token=code)[0]
    R['invitation_sans_enfant_avant_confirmation'] = inv0['child_scope'] == [] and inv0['role'] == 'caregiver'
    shot(p1, 'parent_acces_invitation_390')

    # 2. acceptation (nounou) — rien n'est visible avant la confirmation
    pn.goto(B + f'/garde/rejoindre?code={code}'); pn.wait_for_timeout(2500)
    tid(pn, 'care-join-accept').click(); pn.wait_for_timeout(3500)
    R['acceptation'] = rows('childcare_links', child_id=LOU)[0]['accepted_at'] is not None
    R['avant_confirmation_en_attente'] = has(pn, 'care-pending') and not has(pn, f'care-child-{LOU}')
    pn.goto(B + f'/garde/{LOU}'); pn.wait_for_timeout(2500)
    R['avant_confirmation_aucune_donnee'] = pn.get_by_text('Accès indisponible').count() > 0
    pn.goto(B + '/garde/rejoindre?code=' + code); pn.wait_for_timeout(2000)
    tid(pn, 'care-join-accept').click(); pn.wait_for_timeout(1500)
    R['lien_usage_unique'] = pn.get_by_text(re.compile('Invitation invalide')).count() > 0 and len(rows('household_members', user_id=NN)) == 1

    # 3. confirmation par le SECOND parent + autorisation des photos par le parent 1
    p2.goto(B + f'/garde/{LOU}/acces'); p2.wait_for_timeout(3000)
    R['parent2_voit_a_confirmer'] = has(p2, 'care-to-confirm')
    tid(p2, 'care-confirm').click(); p2.wait_for_timeout(2000)
    R['association_enfant'] = LOU in (rows('household_members', user_id=NN)[0].get('child_scope') or [])
    p1.goto(B + f'/garde/{LOU}/acces'); p1.wait_for_timeout(3000)
    p1.get_by_role('switch', name='Photos autorisées').click(); p1.wait_for_timeout(800)
    confirm_dialog(p1, 'J’autorise')
    p1.get_by_role('switch', name='Permettre d’enregistrer les photos dans la photothèque des parents').click(); p1.wait_for_timeout(1500)
    s = rows('childcare_settings', child_id=LOU)[0]
    R['photos_autorisees_horodatees'] = s['photos_allowed'] and s['photos_allowed_at'] is not None and len(fake.t('childcare_consents')) == 1
    shot(p1, 'parent_acces_390')

    # 4. carnet (nounou)
    pn.goto(B + '/garde'); pn.wait_for_timeout(3000)
    R['mes_gardes_enfant_visible'] = has(pn, f'care-child-{LOU}')
    shot(pn, 'nounou_mes_gardes_390')
    # Profil de la nounou (21/11/2026) : son compte, ses gardes, ses réglages — aucun outil du foyer (390 et 320 pt)
    pn.goto(B + '/profile'); pn.wait_for_timeout(3000)
    txt = pn.inner_text('body')
    R['profil_nounou_ses_gardes'] = has(pn, f'caregiver-profile-care-{LOU}') and has(pn, 'caregiver-profile-settings')
    R['profil_nounou_sans_outils_du_foyer'] = not any(w in txt for w in ['Agenda familial', 'MES PARCOURS', 'Ma famille', 'Mes outils'])
    shot(pn, 'nounou_profil_390')
    pn.set_viewport_size({'width': 320, 'height': 568}); pn.wait_for_timeout(1200)
    R['profil_nounou_320_sans_debordement'] = not pn.evaluate('() => document.documentElement.scrollWidth > innerWidth + 1')
    shot(pn, 'nounou_profil_320')
    pn.set_viewport_size({'width': 390, 'height': 844}); pn.goto(B + '/garde'); pn.wait_for_timeout(2500)
    tid(pn, 'care-add-event').click(); pn.wait_for_timeout(2000)
    shot(pn, 'nounou_ajouter_choix_390')
    def add(kind, fill=lambda: None):
        pn.goto(B + f'/garde/{LOU}/ajouter?type={kind}'); pn.wait_for_timeout(2200)
        fill(); tid(pn, 'care-save').click(); pn.wait_for_timeout(2200)
    add('bottle', lambda: (tid(pn, 'care-ml').fill('120'), tid(pn, 'care-milk-infant_formula').click()))
    R['biberon'] = len([b for b in fake.t('bottles') if b['child_id'] == LOU and b.get('consumed_ml') == 120 and b['origin'] == 'caregiver' and b['created_by'] == NN]) == 1
    add('meal', lambda: (tid(pn, 'care-foods').fill('purée de carottes, compote'), tid(pn, 'care-amount-most').click()))
    R['repas'] = any(m.get('foods') == ['purée de carottes', 'compote'] and m.get('eaten_amount') == 'most' for m in fake.t('meals'))
    add('sleep')
    R['sieste_debut'] = any(s['child_id'] == LOU and s.get('ended_at') is None for s in fake.t('sleeps'))
    pn.goto(B + f'/garde/{LOU}'); pn.wait_for_timeout(2500)
    tid(pn, 'care-end-sleep-main').click(); pn.wait_for_timeout(2000)
    R['sieste_fin'] = all(s.get('ended_at') for s in fake.t('sleeps') if s['child_id'] == LOU)
    add('diaper', lambda: tid(pn, 'care-diaper-wet').click())
    R['change'] = any(d['child_id'] == LOU and d['wet'] and not d['stool'] for d in fake.t('diapers'))
    add('observation', lambda: (tid(pn, 'care-mood-happy').click(), tid(pn, 'care-toshare').fill('A bien joué avec les cubes')))
    R['observation'] = any(o.get('mood') == 'happy' and o.get('to_share') for o in fake.t('child_observations'))
    add('activity', lambda: tid(pn, 'care-act-outdoor').click())
    pn.goto(B + f'/garde/{LOU}/ajouter?type=important'); pn.wait_for_timeout(2200)
    R['urgence_rappel_fixe'] = has(pn, 'care-emergency-numbers')
    tid(pn, 'care-imp-temperature').click(); tid(pn, 'care-temp').fill('38,2')
    shot(pn, 'nounou_information_importante_390')
    tid(pn, 'care-save').click(); pn.wait_for_timeout(2200)
    R['information_importante_mesuree'] = any(o.get('important') and o.get('value_num') == 38.2 and o['kind'] == 'temperature' for o in fake.t('child_observations'))
    pn.goto(B + f'/garde/{LOU}'); pn.wait_for_timeout(3000)
    R['carnet_auteur_et_heure'] = pn.get_by_text('par Vous').count() >= 5 and has(pn, 'care-absence-note')
    shot(pn, 'nounou_carnet_390')

    # 5. photo : substitut web de la caméra (choix de fichier), photo de groupe refusée, annulation, partage
    pn.goto(B + f'/garde/{LOU}/photo'); pn.wait_for_timeout(2500)
    R['regle_premiere_utilisation'] = has(pn, 'care-photo-rule')
    tid(pn, 'care-photo-rule-ok').click(); pn.wait_for_timeout(400)
    def pick():
        with pn.expect_file_chooser() as fc: tid(pn, 'care-photo-capture').click()
        fc.value.set_files(GPS_JPG); pn.wait_for_timeout(2500)
    pick()
    R['previsualisation'] = has(pn, 'care-photo-preview') and has(pn, 'care-photo-retake') and has(pn, 'care-photo-keep')
    tid(pn, 'care-photo-keep').click(); pn.wait_for_timeout(500)
    tid(pn, 'care-caption-1').click(); tid(pn, 'care-photo-caption-next').click(); pn.wait_for_timeout(500)
    tid(pn, 'care-photo-others-yes').click(); pn.wait_for_timeout(800)
    R['photo_de_groupe_bloquee'] = has(pn, 'care-photo-blocked') and len(fake.uploads) == 0
    shot(pn, 'nounou_photo_groupe_bloquee_390')
    # annulation du partage
    pn.goto(B + f'/garde/{LOU}/photo'); pn.wait_for_timeout(2000); pick()
    tid(pn, 'care-photo-keep').click(); tid(pn, 'care-photo-caption-next').click(); tid(pn, 'care-photo-others-no').click(); pn.wait_for_timeout(600)
    tid(pn, 'care-photo-cancel').click(); pn.wait_for_timeout(1200)
    R['annulation_partage'] = len(fake.uploads) == 0 and len(fake.t('childcare_photos')) == 0
    # partage
    pn.goto(B + f'/garde/{LOU}/photo'); pn.wait_for_timeout(2000); pick()
    tid(pn, 'care-photo-keep').click(); tid(pn, 'care-caption-1').click(); tid(pn, 'care-photo-caption-next').click(); tid(pn, 'care-photo-others-no').click(); pn.wait_for_timeout(600)
    R['confirmation_enfant_et_destinataires'] = pn.get_by_text('Enfant : Lou').count() > 0 and pn.get_by_text(re.compile('Destinataires :.*Camille.*Alex|Destinataires :.*Alex.*Camille')).count() > 0
    shot(pn, 'nounou_photo_confirmation_390')
    tid(pn, 'care-photo-share').click(); pn.wait_for_timeout(4000)
    up = fake.uploads[-1][1] if fake.uploads else b''
    R['televersement'] = has(pn, 'care-photo-done') and len(fake.t('childcare_photos')) == 1 and len(fake.uploads) == 1
    R['exif_gps_retires_apres_envoi'] = bool(up) and b'Exif' not in up and b'TestPhone' not in up and up[:2] == b'\xff\xd8'
    with open(GPS_JPG, 'rb') as f: R['fichier_source_avait_gps'] = b'Exif' in f.read()
    R['photo_jpeg_taille'] = len(up)

    # 6. réception côté parents, album, souvenirs, téléchargement, suppression
    p1.goto(B + f'/garde/{LOU}/photos'); p1.wait_for_timeout(3500)
    R['reception_parent1'] = has(p1, 'care-album-item') and p1.locator('img').count() > 0
    shot(p1, 'parent_album_390')
    p2.goto(B + f'/garde/{LOU}/photos'); p2.wait_for_timeout(3500)
    R['reception_parent2'] = has(p2, 'care-album-item')
    tid(p1, 'care-photo-thumb').click(); p1.wait_for_timeout(2000)
    R['agrandissement'] = has(p1, 'care-photo-large')
    R['telechargement_autorise_visible'] = has(p1, 'care-photo-download')
    tid(p1, 'care-photo-memories').click(); p1.wait_for_timeout(1500)
    R['ajout_souvenirs_sans_copie'] = len(fake.t('child_photos')) == 1 and fake.t('child_photos')[0]['storage_path'] == fake.t('childcare_photos')[0]['storage_path'] and len(fake.objects) == 1
    tid(p1, 'care-photo-close').click(); p1.wait_for_timeout(500)
    # téléchargement interdit
    p1.goto(B + f'/garde/{LOU}/acces'); p1.wait_for_timeout(2500)
    p1.get_by_role('switch', name='Permettre d’enregistrer les photos dans la photothèque des parents').click(); p1.wait_for_timeout(1500)
    p2.goto(B + f'/garde/{LOU}/photos'); p2.wait_for_timeout(3000); tid(p2, 'care-photo-thumb').click(); p2.wait_for_timeout(1500)
    R['telechargement_interdit_masque'] = not has(p2, 'care-photo-download')
    tid(p2, 'care-photo-close').click()
    # journée : photos et carnet entremêlés, récapitulatif
    p1.goto(B + f'/garde/{LOU}/journee'); p1.wait_for_timeout(3500)
    R['carnet_parent_affiche_nounou'] = p1.get_by_text('par Sophie').count() >= 5
    R['recapitulatif'] = has(p1, 'care-day-summary') and p1.get_by_text('270 ml').count() == 0 and p1.get_by_text(re.compile(r'120 ml au total')).count() > 0
    R['album_dans_journee'] = p1.locator('[data-testid="care-row-photo"]').count() == 1
    shot(p1, 'parent_journee_390')

    # 7. messages (texte seulement, sans accusé de lecture)
    pn.goto(B + f'/garde/{LOU}/messages'); pn.wait_for_timeout(2500)
    tid(pn, 'care-msg-body').fill('Lou a bien mangé ce midi.'); tid(pn, 'care-msg-send-inline').click(); pn.wait_for_timeout(1500)
    p1.goto(B + f'/garde/{LOU}/messages'); p1.wait_for_timeout(2500)
    tid(p1, 'care-msg-body').fill('Merci ! Pensez à la crème.'); p1.get_by_role('switch', name='Marquer comme information importante').click(); tid(p1, 'care-msg-send-inline').click(); p1.wait_for_timeout(1500)
    R['messagerie'] = len(fake.t('childcare_messages')) == 2 and any(m['important'] for m in fake.t('childcare_messages'))
    R['messagerie_sans_vu'] = p1.get_by_text(re.compile(r'\bVu\b|\ben ligne\b|\bLu à\b')).count() == 0
    shot(p1, 'parent_messages_390')

    # 8. hors ligne → file d'attente → synchronisation, une seule fois ; doublon proposé à la fusion
    pn.goto(B + f'/garde/{LOU}/ajouter?type=diaper'); pn.wait_for_timeout(2500)
    before = len(fake.t('diapers'))
    cn.set_offline(True); fake.offline_pages.add(pn); pn.wait_for_timeout(1500)   # le réseau coupe, l'écran reste ouvert
    tid(pn, 'care-diaper-stool').click(); tid(pn, 'care-save').click(); pn.wait_for_timeout(1500)
    R['doublon_propose_nounou'] = has(pn, 'care-dup-sheet')   # un change a déjà été noté quelques minutes avant
    if has(pn, 'care-dup-add'): tid(pn, 'care-dup-add').click(); pn.wait_for_timeout(1500)
    queued = pn.evaluate("() => { try { return JSON.parse(localStorage.getItem('toietmoi.offline.v1') || '{}').pending || []; } catch (e) { return []; } }")
    R['hors_ligne_en_file'] = len(fake.t('diapers')) == before and any(o.get('table') == 'diapers' for o in queued)
    pn.wait_for_timeout(500)
    R['hors_ligne_indicateur'] = pn.get_by_text(re.compile('en attente d’envoi')).count() > 0
    shot(pn, 'nounou_hors_ligne_390')
    fake.offline_pages.discard(pn); cn.set_offline(False); pn.wait_for_timeout(8000)
    R['synchronisation'] = len(fake.t('diapers')) == before + 1
    pn.reload(); pn.wait_for_timeout(5000)
    R['rejouee_une_seule_fois'] = len([d for d in fake.t('diapers') if d.get('stool')]) == 1
    # doublon : le parent 2 note le même biberon peu après
    p2.goto(B + f'/garde/{LOU}/ajouter?type=bottle'); p2.wait_for_timeout(2500)
    tid(p2, 'care-ml').fill('120'); tid(p2, 'care-save').click(); p2.wait_for_timeout(1500)
    R['doublon_propose'] = has(p2, 'care-dup-sheet')
    nb = len(fake.t('bottles'))
    if has(p2, 'care-dup-merge'): tid(p2, 'care-dup-merge').click(); p2.wait_for_timeout(1500)
    R['absence_de_doublon'] = len(fake.t('bottles')) == nb

    # 9. suppression (parent) : ligne et fichier ; le fichier reste s'il est dans les souvenirs
    p2.goto(B + f'/garde/{LOU}/photos'); p2.wait_for_timeout(3000); tid(p2, 'care-photo-thumb').click(); p2.wait_for_timeout(1200)
    tid(p2, 'care-photo-delete').click(); p2.wait_for_timeout(600); confirm_dialog(p2, 'Supprimer')
    R['suppression_ligne'] = len(fake.t('childcare_photos')) == 0
    R['suppression_fichier_garde_si_souvenir'] = len(fake.objects) == 1

    # 10. révocation immédiate ; accès non autorisé
    p1.goto(B + f'/garde/{LOU}/acces'); p1.wait_for_timeout(2500)
    tid(p1, 'care-revoke').click(); p1.wait_for_timeout(600); confirm_dialog(p1, 'Retirer l’accès')
    pn.goto(B + f'/garde/{LOU}'); pn.wait_for_timeout(3000)
    pn.wait_for_timeout(3000)
    R['revocation_serveur'] = not any(m['user_id'] == NN and m['household_id'] == H for m in fake.t('household_members'))
    if not R['revocation_serveur']: R['debug_membres_nounou'] = [(m['household_id'] == H, m['role'], m.get('child_scope')) for m in fake.t('household_members') if m['user_id'] == NN]
    R['debug_liens'] = [(l['label'], bool(l['confirmed_at']), bool(l['revoked_at'])) for l in fake.t('childcare_links')]
    R['revocation_ecran'] = pn.get_by_text('Accès indisponible').count() > 0
    R['revocation_plus_de_carnet'] = pn.get_by_text('par Vous').count() == 0
    shot(pn, 'nounou_apres_revocation_390')
    pn.goto(B + '/garde'); pn.wait_for_timeout(2500)
    R['revocation_plus_de_garde'] = not has(pn, f'care-child-{LOU}')
    R['erreurs'] = errs[:12]

    # 11. captures : clair / sombre, 390 et 320 (écrans denses), nounou et parent — sur un état réaffiché
    fake.t('household_members').append({'household_id': H, 'user_id': NN, 'role': 'caregiver', 'can_view': ['daily'], 'can_edit': ['daily'], 'child_scope': [LOU], 'joined_at': now()})
    fake.t('childcare_links').append({'id': str(uuid.uuid4()), 'household_id': H, 'child_id': LOU, 'caregiver_id': NN, 'invitation_id': None, 'invited_by': P1, 'label': 'Sophie',
                                      'created_at': now(), 'expires_at': None, 'accepted_at': now(), 'confirmed_at': now(), 'revoked_at': None})
    for scheme in ('light', 'dark'):
        for width in (390, 320):
            if scheme == 'light' and width == 390: continue
            cxn, pgn, _ = open_ctx(p, 'nounou@exemple.test', scheme, width)
            for path, name in ((f'/garde', 'mes_gardes'), (f'/garde/{LOU}', 'carnet'), (f'/garde/{LOU}/ajouter?type=bottle', 'ajouter_biberon'), (f'/garde/{LOU}/ajouter?type=important', 'information_importante')):
                pgn.goto(B + path); pgn.wait_for_timeout(2600); shot(pgn, f'nounou_{name}_{width}_{scheme}')
            cxp, pgp, _ = open_ctx(p, 'parent1@exemple.test', scheme, width)
            for path, name in ((f'/garde/{LOU}', 'espace'), (f'/garde/{LOU}/journee', 'journee'), (f'/garde/{LOU}/acces', 'acces'), (f'/garde/{LOU}/messages', 'messages')):
                pgp.goto(B + path); pgp.wait_for_timeout(2600); shot(pgp, f'parent_{name}_{width}_{scheme}')
    print(json.dumps(R, ensure_ascii=False, indent=1))
