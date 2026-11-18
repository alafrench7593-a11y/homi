"""
Faux Supabase À DEUX COMPTES pour les parcours « missions terminées / espace du co-parent / Se comprendre »
(19/11/2026). Étend fake_supabase.FakeSupabase avec :
  - une émulation de la RLS en LECTURE et en suppression (mêmes règles que les migrations 20261119100000 et
    20261119100100) : données personnelles = propriétaire seule ; foyer = membres ; couple_messages = autrice +
    destinataire, adultes actifs ; grossesse = personne enceinte ou partage explicite ; notifications = destinataire ;
  - les fonctions serveur utilisées : household_member_names, create_mission, mission_respond, couple_send,
    set_pregnancy_sharing (mêmes droits, mêmes textes de notification que le serveur).
Ce n'est pas la base : la preuve de sécurité reste supabase/tests/sql/98zb_coparent_confidentialite.sql. Ce faux
serveur sert à faire passer les écrans par les mêmes refus (requêtes directes avec le jeton de l'autre compte).
"""
import uuid
from fake_supabase import FakeSupabase, now

PRIVATE = {'period_entries', 'symptom_logs', 'mood_checkins', 'cycle_journal', 'bleeding_logs', 'intercourse_logs', 'ovulation_tests',
           'fertility_observations', 'contraception_logs', 'pregnancy_symptom_logs', 'maternal_weights', 'exhaustion_checkins',
           'couple_feelings', 'notification_settings', 'postpartum_checkins', 'daily_checks', 'my_treatments', 'parent_sleep_logs'}
NEXT = {
    'accept': {'pending': 'accepted', 'postponed': 'accepted'},
    'start': {'pending': 'in_progress', 'accepted': 'in_progress', 'postponed': 'in_progress'},
    'complete': {'pending': 'done', 'accepted': 'done', 'in_progress': 'done', 'postponed': 'done'},
    'decline': {'pending': 'declined', 'accepted': 'declined', 'in_progress': 'declined', 'postponed': 'declined'},
    'cancel': {'pending': 'cancelled', 'accepted': 'cancelled', 'in_progress': 'cancelled', 'postponed': 'cancelled', 'declined': 'cancelled'},
}
TARGET = {'accept': 'accepted', 'start': 'in_progress', 'complete': 'done', 'decline': 'declined', 'cancel': 'cancelled'}


class FakeCouple(FakeSupabase):
    def member(self, hid, uid):
        return next((m for m in self.t('household_members') if m['household_id'] == hid and m['user_id'] == uid), None)

    def parent(self, hid, uid):
        m = self.member(hid, uid)
        return bool(m) and m['role'] in ('owner', 'coparent')

    def first_name(self, uid):
        p = next((x for x in self.t('profiles') if x['id'] == uid), None)
        n = ((p or {}).get('display_name') or '').strip().split(' ')[0][:40]
        return n or None

    # ------------------------------------------------------------ RLS (lecture)
    def visible(self, table, r, uid):
        if not uid: return False
        if table in PRIVATE: return r.get('user_id') == uid
        if table == 'profiles': return r.get('id') == uid
        if table == 'notifications': return r.get('user_id') == uid
        if table == 'couple_messages': return uid in (r.get('author_id'), r.get('recipient_id')) and self.parent(r['household_id'], uid)
        if table == 'pregnancies':
            m = self.member(r['household_id'], uid)
            return bool(m) and (r.get('carrier_user_id') == uid or ((m['role'] == 'owner' or m.get('pregnancy_access', True))
                                                                   and (not r.get('carrier_user_id') or r.get('share_basics') is True)))
        if table == 'household_invitations': return bool(self.member(r['household_id'], uid)) and self.member(r['household_id'], uid)['role'] == 'owner'
        if table == 'households': return bool(self.member(r['id'], uid))
        if 'household_id' in r and r['household_id']: return bool(self.member(r['household_id'], uid))
        return True

    def rest(self, method, table, params, body, headers, uid):
        if method in ('GET', 'HEAD'):
            out = [r for r in self.t(table) if self.match(r, params) and self.visible(table, r, uid)]
            if 'order' in params:
                for part in reversed(params['order'].split(',')):
                    col, *mods = part.split('.')
                    out.sort(key=lambda r: (r.get(col) is None, str(r.get(col))), reverse='desc' in mods)
            if 'limit' in params: out = out[:int(params['limit'])]
            sel = params.get('select', '*')
            if sel != '*': out = [{k: r.get(k) for k in sel.split(',')} for r in out]
            return 200, out
        if method == 'POST':
            items = body if isinstance(body, list) else [body]
            for it in items:
                if table in PRIVATE:
                    it.setdefault('user_id', uid)
                    if it['user_id'] != uid: return 403, {'code': '42501', 'message': 'new row violates row-level security policy'}
                if table == 'couple_messages': return 403, {'code': '42501', 'message': 'permission denied for table couple_messages'}
                if table == 'family_member_profiles':
                    it.setdefault('user_id', uid)
                    if it['user_id'] != uid or not self.member(it.get('household_id'), uid): return 403, {'code': '42501', 'message': 'new row violates row-level security policy'}
            return super().rest(method, table, params, body, headers, uid)
        if method in ('PATCH', 'DELETE'):
            rows = [r for r in self.t(table) if self.match(r, params)]
            allowed = [r for r in rows if self.visible(table, r, uid) and (table != 'couple_messages' or (method == 'DELETE' and r['author_id'] == uid))]
            if table == 'couple_messages' and method == 'PATCH': return 403, {'code': '42501', 'message': 'permission denied for table couple_messages'}
            if method == 'DELETE':
                self.T[table] = [r for r in self.t(table) if r not in allowed]
                return 200, allowed
            for r in allowed: r.update(body)
            return 200, allowed
        return super().rest(method, table, params, body, headers, uid)

    # ------------------------------------------------------------ fonctions serveur
    def notify(self, to, title, body, link, payload):
        self.t('notifications').append({'id': str(uuid.uuid4()), 'user_id': to, 'category': 'family', 'title': title, 'body': body,
                                        'deep_link': link, 'payload': payload, 'read_at': None, 'created_at': now(), 'urgent': False})

    def event(self, t, actor, kind, detail=None):
        self.t('family_task_events').append({'id': str(uuid.uuid4()), 'task_id': t['id'], 'household_id': t['household_id'], 'actor_id': actor,
                                             'kind': kind, 'detail': detail or {}, 'created_at': now()})

    def rpc(self, fn, body, uid):
        if fn == 'household_member_names':
            mine = {m['household_id'] for m in self.t('household_members') if m['user_id'] == uid}
            out = []
            for m in self.t('household_members'):
                if m['household_id'] in mine and (body.get('p_household') in (None, m['household_id'])):
                    p = next((x for x in self.t('profiles') if x['id'] == m['user_id']), {})
                    out.append({'household_id': m['household_id'], 'user_id': m['user_id'], 'role': m['role'],
                                'display_name': (p.get('display_name') or '').strip() or None, 'avatar_path': p.get('avatar_path')})
            return 200, out
        if fn == 'create_mission':
            hid = body['p_household']
            if not self.member(hid, uid): return 403, {'code': '42501', 'message': 'Vous n’avez pas l’autorisation de faire cette action.'}
            again = next((x for x in self.t('family_tasks') if x.get('client_id') and x.get('client_id') == body.get('p_client_id')), None)
            if again: return 200, again
            a = body.get('p_assignee')
            if a == uid or (a and not self.member(hid, a)): return 400, {'code': '22023', 'message': 'Cette personne ne peut pas recevoir cette mission.'}
            t = {'id': str(uuid.uuid4()), 'household_id': hid, 'title': body['p_title'], 'category': body.get('p_category') or 'other', 'due_at': body.get('p_due_at'),
                 'all_day': bool(body.get('p_all_day')), 'assignee_id': a, 'priority': body.get('p_priority') or 'normal', 'essential': False,
                 'recurrence': body.get('p_recurrence'), 'status': 'todo', 'done_at': None, 'done_by': None, 'notes': body.get('p_notes'), 'routine_id': None,
                 'created_by': uid, 'updated_by': None, 'created_at': now(), 'updated_at': now(), 'client_id': body.get('p_client_id'), 'version': 1,
                 'mission_state': 'pending', 'child_id': None, 'pet_id': None, 'shopping_item_id': None, 'product_label': None, 'document_id': None,
                 'domain_key': None, 'responded_at': None, 'last_reminded_at': None, 'stock_id': None}
            self.t('family_tasks').append(t)
            self.event(t, uid, 'created', {'mission': True, 'assignee': a})
            # « <Prénom> t’a confié une mission », sans contenu (discrétion par défaut) : 20261122000100_mission_confiee.sql
            if a: self.notify(a, (self.first_name(uid) + ' t’a confié une mission') if self.first_name(uid) else 'On t’a confié une mission',
                              'Ouvre HOMI pour répondre quand tu peux.', '/family/missions/' + t['id'], {'task_id': t['id'], 'mission': 'mission.requested', 'entrusted': True})
            return 200, t
        if fn == 'mission_respond':
            t = next((x for x in self.t('family_tasks') if x['id'] == body.get('p_task')), None)
            if not t or not t.get('mission_state') or not self.member(t['household_id'], uid): return 200, {'status': 'not_found'}
            ev = body.get('p_expected_version')
            if ev is not None and ev != t['version']: return 200, {'status': 'conflict', 'row': t}
            act = body['p_action']
            if act == 'cancel':
                if uid != t['created_by']: return 403, {'code': '42501', 'message': 'Seule la personne qui a demandé la mission peut faire cela.'}
            elif t['assignee_id'] != uid: return 403, {'code': '42501', 'message': 'Cette mission s’adresse à quelqu’un d’autre.'}
            nxt = NEXT.get(act, {}).get(t['mission_state'])
            if not nxt:
                if TARGET.get(act) == t['mission_state']: return 200, {'status': 'ok', 'unchanged': True, 'row': t}
                return 400, {'code': '22023', 'message': 'Cette réponse n’est plus possible.'}
            t.update({'mission_state': nxt, 'status': 'done' if nxt == 'done' else 'cancelled' if nxt == 'cancelled' else 'todo', 'version': t['version'] + 1,
                      'updated_at': now(), 'responded_at': now()})
            if nxt == 'done': t.update({'done_at': now(), 'done_by': uid})
            self.event(t, uid, {'accept': 'accepted', 'start': 'started', 'complete': 'done', 'decline': 'declined', 'cancel': 'cancelled'}[act], {'mission': True, 'state': nxt})
            pref_off = any(s['user_id'] == t['created_by'] and s.get('mission_done') is False for s in self.t('notification_settings'))
            if act == 'complete' and not pref_off:
                self.notify(t['created_by'], f"{self.first_name(uid) or 'Quelqu’un'} a terminé : {t['title']}", 'Ouvrez HOMI pour voir le détail.', '/family/missions/' + t['id'], {'task_id': t['id'], 'mission': 'mission.completed'})
            if act == 'accept': self.notify(t['created_by'], 'Mission acceptée : ' + t['title'], 'Ouvrez HOMI pour voir le détail.', '/family/missions/' + t['id'], {'task_id': t['id'], 'mission': 'mission.accepted'})
            return 200, {'status': 'ok', 'row': t}
        if fn == 'couple_send':
            hid, to = body['p_household'], body['p_recipient']
            if not uid or not self.parent(hid, uid) or not self.parent(hid, to) or to == uid:
                return 403, {'code': '42501', 'message': 'Ce message ne peut être envoyé qu’à l’autre adulte de votre foyer.'}
            again = next((m for m in self.t('couple_messages') if m['author_id'] == uid and body.get('p_client_id') and m.get('client_id') == body.get('p_client_id')), None)
            if again: return 200, again
            r = {'id': str(uuid.uuid4()), 'household_id': hid, 'author_id': uid, 'recipient_id': to, 'kind': body['p_kind'], 'situation': body.get('p_situation'),
                 'body': body['p_body'].strip(), 'reply_to': body.get('p_reply_to'), 'task_id': body.get('p_task'), 'client_id': body.get('p_client_id'), 'created_at': now()}
            self.t('couple_messages').append(r)
            discreet = any(s['user_id'] == to and s.get('couple_discreet') for s in self.t('notification_settings'))
            name = None if discreet else self.first_name(uid)
            self.notify(to, (name + ' souhaite partager quelque chose avec vous') if name else 'Votre partenaire souhaite partager quelque chose avec vous',
                        'Ouvrez HOMI quand vous le souhaitez.', '/family/understand/inbox', {'couple': True})
            return 200, r
        if fn == 'set_pregnancy_sharing':
            p = next((x for x in self.t('pregnancies') if x['id'] == body.get('p_pregnancy')), None)
            if not p or p.get('carrier_user_id') != uid: return 403, {'code': '42501', 'message': 'Seule la personne concernée choisit ce qu’elle partage de sa grossesse.'}
            p['share_basics'] = bool(body.get('p_basics')); p['share_medical'] = bool(body.get('p_medical')) and p['share_basics']
            return 200, None
        return super().rpc(fn, body, uid)
