"""
Faux Supabase (Auth + PostgREST + RPC) pour les parcours navigateur de l'étape 1.
Branché sur Playwright via page.route('http://sb.fake.test/**', fake.route).
Il reproduit le comportement utile au client : PKCE, confirmation, mot de passe oublié,
renvoi d'e-mail, déclencheur d'inscription (profil + foyer + consentements), invitations.
"""
import json, uuid, time, base64, urllib.parse, re

def now(): return time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
def b64(d): return base64.urlsafe_b64encode(json.dumps(d).encode()).decode().rstrip('=')

class FakeSupabase:
    def __init__(self):
        self.users = {}          # id -> user
        self.codes = {}          # code -> (user_id, kind)
        self.tokens = {}         # access/refresh token -> user_id
        self.T = {}              # tables
        self.calls = []          # (method, path) journal
        self.signup_bodies = []
        self.premium_users = set()  # comptes Premium (has_premium)
        self.resend_count = 0
        self.recover_bodies = []
        self.rate_limit_resend = False

    def t(self, name): return self.T.setdefault(name, [])

    # ------------------------------------------------------------ auth
    def user_json(self, u):
        return {'id': u['id'], 'aud': 'authenticated', 'role': 'authenticated', 'email': u['email'], 'email_confirmed_at': now() if u['confirmed'] else None,
                'user_metadata': u['meta'], 'app_metadata': {'provider': 'email'}, 'identities': [{'id': u['id'], 'provider': 'email'}], 'created_at': now(), 'updated_at': now()}

    def session(self, uid):
        exp = int(time.time()) + 3600
        access = f"{b64({'alg':'HS256','typ':'JWT'})}.{b64({'sub': uid, 'exp': exp, 'role': 'authenticated', 'aud': 'authenticated', 'email': self.users[uid]['email']})}.sig{uuid.uuid4().hex[:8]}"
        refresh = 'r' + uuid.uuid4().hex
        self.tokens[access] = uid; self.tokens[refresh] = uid
        return {'access_token': access, 'refresh_token': refresh, 'expires_in': 3600, 'expires_at': exp, 'token_type': 'bearer', 'user': self.user_json(self.users[uid])}

    def trigger_new_user(self, u):
        uid = u['id']
        self.t('profiles').append({'id': uid, 'display_name': None, 'journeys': [], 'interests': [], 'locale': 'fr', 'timezone': 'Europe/Paris', 'onboarding_completed': False,
                                   'home_shortcuts': [], 'hide_weight_module': False, 'theme': 'system', 'onboarding_state': None})
        self.t('privacy_settings').append({'user_id': uid, 'analytics_enabled': False, 'crash_reports_enabled': False, 'ai_history_enabled': True, 'community_visible': True, 'retention_months': 36})
        self.new_household(uid, 'Ma famille', True)
        m = u['meta']
        if m.get('adult_confirmed') is True and m.get('terms_version') and m.get('privacy_version'):
            for p, v in (('terms', m['terms_version']), ('privacy_policy', m['privacy_version']), ('adult_confirmation', m['terms_version'])):
                self.t('consents').append({'id': str(uuid.uuid4()), 'user_id': uid, 'purpose': p, 'granted': True, 'version': v, 'created_at': now()})

    def new_household(self, uid, name, auto):
        hid = str(uuid.uuid4())
        self.t('households').append({'id': hid, 'name': name, 'created_by': uid, 'created_at': now(), 'auto_created': auto})
        dom = ['daily','health','documents','pregnancy','lists','names','profile']
        self.t('household_members').append({'household_id': hid, 'user_id': uid, 'role': 'owner', 'can_view': dom, 'can_edit': dom, 'joined_at': now()})
        return hid

    # ------------------------------------------------------------ abonnement (même règle que la base)
    def sub_grants(self, s):
        """public._subscription_grants : essai / actif / grâce / annulé / pause programmée ET échéance future ;
        échéance nulle → seulement octroi promotionnel ou à vie ; remboursé, expiré, problème de paiement → rien."""
        if not s or s.get('status') not in ('trial', 'active', 'grace', 'cancelled', 'paused'): return False
        exp = s.get('expires_at')
        if exp: return exp > now()
        return s.get('status') == 'active' and (s.get('store') == 'promotional' or s.get('period_type') == 'lifetime')

    def partner_of(self, subscriber):
        """public._premium_partner_of : le premier co-parent arrivé dans un foyer dont l'abonné·e est propriétaire,
        sinon la propriétaire du foyer où l'abonné·e est co-parent (un seul autre adulte)."""
        M = self.t('household_members')
        owned = [m['household_id'] for m in M if m['user_id'] == subscriber and m['role'] == 'owner']
        cands = sorted([(m.get('joined_at') or '', m['user_id']) for m in M if m['household_id'] in owned and m['role'] == 'coparent' and m['user_id'] != subscriber])
        if cands: return cands[0][1]
        mine = [m for m in M if m['user_id'] == subscriber and m['role'] == 'coparent']
        own = sorted([(me.get('joined_at') or '', o['user_id']) for me in mine for o in M if o['household_id'] == me['household_id'] and o['role'] == 'owner' and o['user_id'] != subscriber])
        return own[0][1] if own else None

    def premium_of(self, uid):
        if not uid: return False
        if uid in self.premium_users: return True
        for s in self.t('subscriptions'):
            if self.sub_grants(s) and (s.get('user_id') == uid or self.partner_of(s.get('user_id')) == uid): return True
        return False

    def premium_share(self, uid):
        name = lambda u: next((p.get('display_name') for p in self.t('profiles') if p['id'] == u), None)
        mine = next((s for s in self.t('subscriptions') if s.get('user_id') == uid and self.sub_grants(s)), None)
        out = {'shared_with': None, 'shared_by': None}
        if mine:
            p = self.partner_of(uid)
            if p: out['shared_with'] = {'user_id': p, 'display_name': name(p)}
        else:
            by = next((s['user_id'] for s in self.t('subscriptions') if self.sub_grants(s) and self.partner_of(s['user_id']) == uid), None)
            if by: out['shared_by'] = {'user_id': by, 'display_name': name(by)}
        return out

    def uid_from(self, headers):
        a = headers.get('authorization', '')
        return self.tokens.get(a.replace('Bearer ', '')) if a else None

    # ------------------------------------------------------------ PostgREST
    def match(self, row, params):
        for k, v in params.items():
            if k in ('select', 'order', 'limit', 'offset', 'on_conflict', 'columns'): continue
            op, _, val = v.partition('.')
            cell = row.get(k)
            if op == 'eq' and str(cell).lower() != val.lower() and not (val in ('true','false') and str(cell).lower() == val): return False
            if op == 'neq' and str(cell) == val: return False
            if op == 'in' and str(cell) not in [x.strip('"') for x in val.strip('()').split(',')]: return False
            if op == 'is' and not ((val == 'null' and cell is None) or (val == 'true' and cell is True) or (val == 'false' and cell is False)): return False
            if op in ('gte','lte','gt','lt') and cell is not None:
                c, w = str(cell), val
                if op == 'gte' and not c >= w: return False
                if op == 'lte' and not c <= w: return False
                if op == 'gt' and not c > w: return False
                if op == 'lt' and not c < w: return False
            if op == 'cs':
                want = [x.strip('"') for x in val.strip('{}').split(',') if x]
                if not all(w in (cell or []) for w in want): return False
        return True

    def rest(self, method, table, params, body, headers, uid):
        rows = self.t(table)
        if method == 'GET' or method == 'HEAD':
            out = [r for r in rows if self.match(r, params)]
            if 'order' in params:
                for part in reversed(params['order'].split(',')):
                    col, *mods = part.split('.')
                    out.sort(key=lambda r: (r.get(col) is None, str(r.get(col))), reverse='desc' in mods)
            if 'limit' in params: out = out[:int(params['limit'])]
            sel = params.get('select', '*')
            # comme PostgreSQL : l'empreinte du jeton d'agenda n'est pas lisible (colonne non accordée)
            if table == 'calendar_feeds' and sel == '*': return 401, {'code': '42501', 'message': 'permission denied for table calendar_feeds'}
            if sel != '*': out = [{k: r.get(k) for k in sel.split(',')} for r in out]
            return 200, out
        if method == 'POST':
            items = body if isinstance(body, list) else [body]
            conflict = params.get('on_conflict')
            merge = 'merge-duplicates' in headers.get('prefer', '')
            out = []
            for it in items:
                it = dict(it)
                if conflict and merge:
                    keys = conflict.split(',')
                    ex = next((r for r in rows if all(str(r.get(k)) == str(it.get(k)) for k in keys)), None)
                    if ex: ex.update(it); out.append(ex); continue
                it.setdefault('id', str(uuid.uuid4())); it.setdefault('created_at', now())
                if table == 'households':
                    hid = self.new_household(uid, it.get('name', 'Ma famille'), False); out.append(next(r for r in self.t('households') if r['id'] == hid)); continue
                rows.append(it); out.append(it)
            return 201, out
        if method == 'PATCH':
            out = [r for r in rows if self.match(r, params)]
            for r in out: r.update(body)
            return 200, out
        if method == 'DELETE':
            keep = [r for r in rows if not self.match(r, params)]
            gone = [r for r in rows if self.match(r, params)]
            self.T[table] = keep
            return 200, gone
        return 405, {'message': 'méthode'}

    def rpc(self, fn, body, uid):
        if fn == 'ensure_my_account':
            if not uid: return 401, {'code': '42501', 'message': 'Connexion requise'}
            mem = next((m for m in self.t('household_members') if m['user_id'] == uid), None)
            if mem: return 200, {'profile_created': False, 'household_created': False, 'household_id': mem['household_id']}
            return 200, {'profile_created': False, 'household_created': True, 'household_id': self.new_household(uid, 'Ma famille', True)}
        if fn == 'record_signup_consents':
            if body.get('p_is_adult') is not True: return 400, {'code': '22023', 'message': 'Vous devez avoir 18 ans ou plus'}
            for p in ('terms', 'privacy_policy', 'adult_confirmation'):
                self.t('consents').append({'id': str(uuid.uuid4()), 'user_id': uid, 'purpose': p, 'granted': True, 'version': body.get('p_terms_version'), 'created_at': now()})
            return 200, now()
        if fn == 'create_household':
            return 200, self.new_household(uid, body.get('p_name') or 'Ma famille', False)
        if fn == 'has_premium':
            return 200, self.premium_of(uid)
        if fn == 'my_premium_share':
            return 200, self.premium_share(uid)
        if fn == 'create_household_invitation':
            # Même règle que la base : l'invitation d'un coparent est une fonction Premium
            if not self.premium_of(uid): return 400, {'code': 'P0001', 'message': 'Fonction Premium (coparent_invite)', 'hint': 'premium_required'}
            tok = uuid.uuid4().hex + uuid.uuid4().hex[:8]
            self.t('household_invitations').append({'id': str(uuid.uuid4()), 'household_id': body['p_household'], 'token': tok, 'role': body.get('p_role', 'coparent'),
                'can_view': body.get('p_can_view', []), 'can_edit': body.get('p_can_edit', []), 'created_at': now(), 'expires_at': '2099-01-01T00:00:00Z', 'accepted_at': None, 'revoked_at': None})
            return 200, tok
        if fn == 'accept_household_invitation':
            inv = next((i for i in self.t('household_invitations') if i['token'] == body.get('p_token') and not i['accepted_at']), None)
            if not inv: return 400, {'code': 'P0001', 'message': 'Invitation invalide ou expirée'}
            inv['accepted_at'] = now()
            self.t('household_members').append({'household_id': inv['household_id'], 'user_id': uid, 'role': inv['role'], 'can_view': inv['can_view'], 'can_edit': inv['can_edit'], 'joined_at': now()})
            for h in list(self.t('households')):
                if h['created_by'] == uid and h.get('auto_created') and not any(c['household_id'] == h['id'] for c in self.t('children')) \
                        and len([m for m in self.t('household_members') if m['household_id'] == h['id']]) == 1:
                    self.T['households'] = [x for x in self.t('households') if x['id'] != h['id']]
                    self.T['household_members'] = [m for m in self.t('household_members') if m['household_id'] != h['id']]
            return 200, inv['household_id']
        if fn == 'create_calendar_feed':
            if not any(m['household_id'] == body.get('p_household') and m['user_id'] == uid for m in self.t('household_members')):
                return 403, {'code': '42501', 'message': 'Vous n’avez pas l’autorisation de faire cette action.'}
            tok = base64.urlsafe_b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes).decode().rstrip('=')
            row = {'id': str(uuid.uuid4()), 'user_id': uid, 'household_id': body['p_household'], 'label': 'Agenda familial',
                   'include_health_titles': bool(body.get('p_include_health_titles')), 'created_at': now(), 'last_accessed_at': None, 'revoked_at': None, '_token': tok}
            self.t('calendar_feeds').append(row)
            return 200, [{'id': row['id'], 'token': tok}]
        if fn == 'revoke_calendar_feed':
            f = next((x for x in self.t('calendar_feeds') if x['id'] == body.get('p_id') and x['user_id'] == uid and not x['revoked_at']), None)
            if not f: return 400, {'code': 'P0002', 'message': 'Lien introuvable.'}
            f['revoked_at'] = now(); return 200, None
        if fn in ('has_premium',): return 200, False
        return 200, None

    # ------------------------------------------------------------ routeur
    def route(self, route):
        req = route.request
        u = urllib.parse.urlparse(req.url)
        path = u.path
        params = dict(urllib.parse.parse_qsl(u.query))
        headers = {k.lower(): v for k, v in req.headers.items()}
        try: body = json.loads(req.post_data) if req.post_data else {}
        except Exception: body = {}
        self.calls.append((req.method, path + ('?' + u.query if u.query else '')))
        if req.method == 'OPTIONS':
            return route.fulfill(status=200, headers={'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*'})
        uid = self.uid_from(headers)
        status, payload = self.dispatch(req.method, path, params, body, headers, uid)
        h = {'access-control-allow-origin': '*', 'access-control-expose-headers': '*', 'content-type': 'application/json'}
        if isinstance(payload, list): h['content-range'] = f'0-{max(0,len(payload)-1)}/{len(payload)}'
        if 'vnd.pgrst.object' in headers.get('accept', '') and isinstance(payload, list):
            if len(payload) != 1: return route.fulfill(status=406, headers=h, body=json.dumps({'code': 'PGRST116', 'message': 'no rows'}))
            payload = payload[0]
        route.fulfill(status=status, headers=h, body=json.dumps(payload) if payload is not None else 'null')

    def dispatch(self, method, path, params, body, headers, uid):
        if path.startswith('/auth/v1/'):
            ep = path[len('/auth/v1/'):]
            if ep == 'signup':
                email = body['email'].lower()
                if any(x['email'] == email for x in self.users.values()):
                    return 422, {'code': 'user_already_exists', 'msg': 'User already registered'}
                self.signup_bodies.append(body)
                nid = str(uuid.uuid4())
                u = {'id': nid, 'email': email, 'password': body['password'], 'confirmed': False, 'meta': body.get('data') or {}}
                self.users[nid] = u
                self.trigger_new_user(u)
                self.codes['c-' + nid[:8]] = (nid, 'signup')
                return 200, self.user_json(u)
            if ep == 'resend':
                if self.rate_limit_resend: return 429, {'code': 'over_email_send_rate_limit', 'msg': 'email rate limit exceeded'}
                self.resend_count += 1; return 200, {}
            if ep == 'recover':
                self.recover_bodies.append({'body': body, 'params': params})
                u = next((x for x in self.users.values() if x['email'] == body.get('email', '').lower()), None)
                if u: self.codes['r-' + u['id'][:8]] = (u['id'], 'recovery')
                return 200, {}
            if ep == 'token':
                gt = params.get('grant_type')
                if gt == 'password':
                    u = next((x for x in self.users.values() if x['email'] == body.get('email', '').lower()), None)
                    if not u or u['password'] != body.get('password'): return 400, {'code': 'invalid_credentials', 'error_code': 'invalid_credentials', 'msg': 'Invalid login credentials'}
                    if not u['confirmed']: return 400, {'code': 'email_not_confirmed', 'error_code': 'email_not_confirmed', 'msg': 'Email not confirmed'}
                    return 200, self.session(u['id'])
                if gt == 'pkce':
                    c = self.codes.pop(body.get('auth_code'), None)
                    if not c: return 403, {'code': 'flow_state_expired', 'error_code': 'flow_state_expired', 'msg': 'invalid flow state, flow state has expired'}
                    self.users[c[0]]['confirmed'] = True
                    return 200, self.session(c[0])
                if gt == 'refresh_token':
                    rid = self.tokens.get(body.get('refresh_token'))
                    return (200, self.session(rid)) if rid else (400, {'code': 'refresh_token_not_found', 'msg': 'Invalid Refresh Token'})
            if ep == 'user':
                if not uid: return 401, {'code': 'session_not_found', 'msg': 'Auth session missing!'}
                if method == 'PUT':
                    if body.get('password'): self.users[uid]['password'] = body['password']
                return 200, self.user_json(self.users[uid])
            if ep == 'logout': return 204, None
            return 404, {'msg': 'not found'}
        if path.startswith('/rest/v1/rpc/'):
            return self.rpc(path.split('/')[-1], body, uid)
        if path.startswith('/rest/v1/'):
            return self.rest(method, path.split('/')[3], params, body, headers, uid)
        if path.startswith('/functions/v1/'):
            return 503, {'error': 'not_configured', 'message': 'Service non configuré (essai)'}
        return 404, {'message': 'introuvable'}


class FakeRealtime:
    """Faux serveur Supabase Realtime (protocole Phoenix vsn 2.0.0, trames JSON en tableau)."""
    def __init__(self):
        self.ws = None
        self.joins = []          # (topic, config)
        self.bindings = {}       # table -> (topic, id)

    def attach(self, ws):
        self.ws = ws
        ws.on_message(self.on_message)

    def on_message(self, msg):
        try: join_ref, ref, topic, event, payload = json.loads(msg)
        except Exception: return
        if event == 'heartbeat':
            self.ws.send(json.dumps([None, ref, 'phoenix', 'phx_reply', {'status': 'ok', 'response': {}}])); return
        if event == 'phx_join':
            pcs = payload.get('config', {}).get('postgres_changes', [])
            self.joins.append((topic, pcs))
            out = []
            for i, pc in enumerate(pcs):
                bid = 1000 + len(self.bindings) + i
                out.append({**pc, 'id': bid})
                self.bindings[pc.get('table')] = (topic, bid, join_ref)
            self.ws.send(json.dumps([join_ref, ref, topic, 'phx_reply', {'status': 'ok', 'response': {'postgres_changes': out}}])); return
        if event in ('access_token', 'phx_leave'):
            self.ws.send(json.dumps([join_ref, ref, topic, 'phx_reply', {'status': 'ok', 'response': {}}]))

    def push_change(self, table, record, kind='INSERT'):
        topic, bid, join_ref = self.bindings[table]
        data = {'type': kind, 'schema': 'public', 'table': table, 'commit_timestamp': now(), 'record': record, 'old_record': {}, 'columns': [], 'errors': None}
        self.ws.send(json.dumps([join_ref, None, topic, 'postgres_changes', {'ids': [bid], 'data': data}]))
