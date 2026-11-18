/**
 * Démonstration (sans serveur) de la messagerie privée : mêmes règles que 20261119000300_messagerie_privee.sql.
 * Suivi mutuel = conversation ouverte ; sinon demande de message (3 messages, sans coordonnées) à accepter ou refuser ;
 * rien entre deux personnes dont l'une a bloqué l'autre ; un refus n'est jamais annoncé ; notification sans le texte.
 */
import { BackendError } from './types';
import { t as tr } from '@/i18n';
import { normalizeHandle, textNeedsReview } from '../domain/communityRules';
import { DM_MAX_LENGTH, DM_PER_MINUTE, DM_REQUEST_LIMIT, DM_REQUESTS_PER_DAY, type DmConversation, type DmMessage, type DmUnread } from '../domain/messages';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface MessagesCtx {
  T: (name: string) => Row[];
  uid: () => string;
  uuid: () => string;
  nowIso: () => string;
  blockedBetween: (a: string, b: string) => boolean;
  notify: (userId: string, n: Row) => void;
}

/** Tables de la messagerie : jamais lues ni écrites directement (comme sur le serveur, tout passe par les fonctions). */
export const DM_TABLES = ['dm_conversations', 'dm_participants', 'dm_messages', 'dm_report_evidence'];

export function createMessages(c: MessagesCtx) {
  const { T } = c;
  const prof = (id: string) => T('community_profiles').find((p) => p.user_id === id);
  const closed = () => new BackendError(tr('dm.err.closed'), '42501', 'dm_closed');
  const notFound = () => new BackendError(tr('dm.err.notFound'), '42501');
  const follows = (a: string, b: string) => T('member_follows').some((f) => f.follower_id === a && f.followee_id === b);
  const mutual = (a: string, b: string) => follows(a, b) && follows(b, a);
  const conv = (id: unknown) => T('dm_conversations').find((x) => x.id === id);
  const other = (cv: Row, me: string): string => (cv.user_a === me ? cv.user_b : cv.user_a);
  const part = (cv: Row, userId: string) => {
    let p = T('dm_participants').find((x) => x.conversation_id === cv.id && x.user_id === userId);
    if (!p) { p = { conversation_id: cv.id, user_id: userId, unread_count: 0, last_read_at: null, last_message_at: null }; T('dm_participants').push(p); }
    return p;
  };
  const messagesOf = (id: string) => T('dm_messages').filter((m) => m.conversation_id === id).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  const mine = (id: unknown, me: string) => { const cv = conv(id); if (!cv || (cv.user_a !== me && cv.user_b !== me)) throw notFound(); return cv; };
  const requireProfile = (me: string) => {
    const p = prof(me);
    if (!p) throw new BackendError(tr('dm.err.needProfile'), 'P0001', 'pseudonym_required');
    if (p.suspended_until && p.suspended_until > c.nowIso()) throw new BackendError(tr('dm.err.suspended'), '42501');
  };

  function card(cv: Row, me: string): DmConversation | null {
    if (cv.user_a !== me && cv.user_b !== me) return null;
    const o = other(cv, me);
    if (c.blockedBetween(me, o)) return null;
    if (cv.status === 'declined' && cv.requested_by !== me) return null;
    const p = prof(o);
    if (!p) return null;
    const all = messagesOf(cv.id); const last = all[all.length - 1];
    const sent = all.filter((m) => m.sender_id === me).length;
    const status = cv.status === 'open' ? 'open' : cv.requested_by === me ? 'request_sent' : 'request_received';
    return {
      id: cv.id, status, handle: p.handle, pseudonym: p.pseudonym, avatar_path: p.avatar_path ?? null, avatar_preset: p.avatar_preset ?? null,
      last_body: last ? String(last.body).slice(0, 140) : null, last_at: last?.created_at ?? null, last_mine: last ? last.sender_id === me : null,
      unread: part(cv, me).unread_count ?? 0,
      can_send: cv.status === 'open' || (cv.status === 'request' && cv.requested_by !== me) || (cv.status !== 'open' && cv.requested_by === me && sent < DM_REQUEST_LIMIT),
      request_left: cv.status !== 'open' && cv.requested_by === me ? Math.max(0, DM_REQUEST_LIMIT - sent) : null,
    };
  }
  const cards = (me: string) => T('dm_conversations').filter((cv) => (cv.user_a === me || cv.user_b === me) && cv.last_message_at)
    .map((cv) => card(cv, me)).filter((x): x is DmConversation => !!x).sort((a, b) => String(b.last_at).localeCompare(String(a.last_at)));
  const toMessage = (m: Row, me: string): DmMessage => ({ id: m.id, body: m.body, mine: m.sender_id === me, created_at: m.created_at, client_id: m.client_id });

  function open(me: string, target: string): Row {
    const [a, b] = me < target ? [me, target] : [target, me];
    let cv = T('dm_conversations').find((x) => x.user_a === a && x.user_b === b);
    if (cv) {
      if (cv.status === 'declined' && cv.requested_by !== me) { cv.status = 'open'; cv.accepted_at = c.nowIso(); cv.declined_at = null; }
      else if (cv.status === 'request' && mutual(me, target)) { cv.status = 'open'; cv.accepted_at = c.nowIso(); }
      return cv;
    }
    const isMutual = mutual(me, target);
    if (!isMutual) {
      const since = new Date(Date.parse(c.nowIso()) - 86_400_000).toISOString();
      if (T('dm_conversations').filter((x) => x.requested_by === me && x.status !== 'open' && x.created_at > since).length >= DM_REQUESTS_PER_DAY) {
        throw new BackendError(tr('dm.err.tooManyRequests'), 'P0001', 'rate_limited');
      }
    }
    cv = { id: c.uuid(), user_a: a, user_b: b, status: isMutual ? 'open' : 'request', requested_by: me, created_at: c.nowIso(), accepted_at: isMutual ? c.nowIso() : null, declined_at: null, last_message_at: null };
    T('dm_conversations').push(cv);
    part(cv, a); part(cv, b);
    return cv;
  }

  function send(me: string, cv: Row, rawBody: unknown, clientId: unknown, at = c.nowIso()): DmMessage {
    if (!clientId) throw new BackendError(tr('dm.err.invalid'), '22023');
    const dup = T('dm_messages').find((m) => m.sender_id === me && m.client_id === clientId);
    if (dup) return toMessage(dup, me);
    const o = other(cv, me);
    requireProfile(me);
    if (c.blockedBetween(me, o) || !prof(o) || (cv.status === 'declined' && cv.requested_by === me)) throw closed();
    const body = String(rawBody ?? '').trim();
    if (!body) throw new BackendError(tr('dm.err.empty'), '22023');
    if (body.length > DM_MAX_LENGTH) throw new BackendError(tr('dm.err.tooLong'), '22023');
    const minuteAgo = new Date(Date.parse(at) - 60_000).toISOString();
    if (T('dm_messages').filter((m) => m.sender_id === me && m.created_at > minuteAgo).length >= DM_PER_MINUTE) throw new BackendError(tr('dm.err.tooFast'), 'P0001', 'rate_limited');
    if (cv.status === 'declined') { cv.status = 'open'; cv.accepted_at = at; cv.declined_at = null; }
    else if (cv.status === 'request') {
      if (cv.requested_by !== me || mutual(me, o)) { cv.status = 'open'; cv.accepted_at = at; }
      else {
        if (messagesOf(cv.id).filter((m) => m.sender_id === me).length >= DM_REQUEST_LIMIT) throw new BackendError(tr('dm.err.requestPending'), 'P0001', 'request_pending');
        if (textNeedsReview(body)) throw new BackendError(tr('dm.err.requestContact'), 'P0001', 'request_contact');
      }
    }
    const m = { id: c.uuid(), conversation_id: cv.id, sender_id: me, body, client_id: clientId, created_at: at };
    T('dm_messages').push(m);
    cv.last_message_at = at;
    const pm = part(cv, me); pm.unread_count = 0; pm.last_read_at = at; pm.last_message_at = at;
    const po = part(cv, o); const wasUnread = po.unread_count ?? 0; po.unread_count = wasUnread + 1; po.last_message_at = at;
    // Une notification par série de messages non lus, SANS le texte du message
    if (!wasUnread) {
      c.notify(o, { category: 'community_message', title: tr(cv.status === 'open' ? 'dm.notif.message' : 'dm.notif.request'), body: null,
        deep_link: `/community/messages/${cv.id}`, payload: { conversation_id: cv.id, request: cv.status !== 'open' } });
    }
    return toMessage(m, me);
  }

  /**
   * Famille d'exemple de la démonstration : deux personnages écrivent à la visiteuse dès qu'elle a un profil
   * communautaire (une conversation ouverte, une demande de message), pour montrer la boîte de réception.
   */
  function seedDemo(me: string) {
    if (!T('_dm_demo').some((x) => x.user_id === me && !x.seeded) || !prof(me)) return;
    T('_dm_demo').forEach((x) => { if (x.user_id === me) x.seeded = true; });
    const ago = (min: number) => new Date(Date.parse(c.nowIso()) - min * 60_000).toISOString();
    const maia = prof('demo-voisine-1'); const papa = prof('demo-voisin-2');
    if (maia && !c.blockedBetween(me, maia.user_id)) {
      const cv = open(maia.user_id, me); cv.status = 'open'; cv.accepted_at = ago(200);
      send(maia.user_id, cv, tr('dm.demo.maia1'), `demo-dm-${me}-1`, ago(190));
      send(maia.user_id, cv, tr('dm.demo.maia2'), `demo-dm-${me}-2`, ago(188));
    }
    if (papa && !c.blockedBetween(me, papa.user_id)) {
      const cv = open(papa.user_id, me);
      if (cv.status === 'request') send(papa.user_id, cv, tr('dm.demo.papa1'), `demo-dm-${me}-3`, ago(45));
    }
  }
  const markDemo = (me: string) => { if (!T('_dm_demo').some((x) => x.user_id === me)) T('_dm_demo').push({ user_id: me, seeded: false }); };

  const unread = (me: string): DmUnread => {
    const list = cards(me);
    return { messages: list.filter((x) => x.status === 'open').reduce((n, x) => n + x.unread, 0), requests: list.filter((x) => x.status === 'request_received').length };
  };

  const rpcs: Record<string, (a: Row) => unknown> = {
    dm_open: (a) => {
      const me = c.uid();
      requireProfile(me);
      const v = T('community_profiles').find((p) => p.handle === normalizeHandle(String(a.p_handle ?? '')));
      if (!v || v.user_id === me) throw new BackendError(tr('l2.dm.memberGone'), 'P0001');
      if (c.blockedBetween(me, v.user_id)) throw closed();
      return open(me, v.user_id).id;
    },
    dm_send: (a) => { const me = c.uid(); return send(me, mine(a.p_conversation, me), a.p_body, a.p_client_id); },
    dm_respond: (a) => {
      const me = c.uid(); const cv = mine(a.p_conversation, me);
      if (cv.requested_by === me) throw new BackendError(tr('dm.err.notYours'), '42501');
      if (cv.status !== 'request') return null;
      if (a.p_accept) { cv.status = 'open'; cv.accepted_at = c.nowIso(); } else { cv.status = 'declined'; cv.declined_at = c.nowIso(); }
      const p = part(cv, me); p.unread_count = 0; p.last_read_at = c.nowIso();
      return null;
    },
    dm_mark_read: (a) => {
      const me = c.uid(); const cv = conv(a.p_conversation);
      if (cv && (cv.user_a === me || cv.user_b === me)) { const p = part(cv, me); p.unread_count = 0; p.last_read_at = c.nowIso(); }
      return null;
    },
    dm_inbox: () => { const me = c.uid(); seedDemo(me); return cards(me); },
    dm_conversation: (a) => { const me = c.uid(); const cv = conv(a.p_conversation); return cv ? card(cv, me) : null; },
    dm_messages_list: (a) => {
      const me = c.uid(); const cv = conv(a.p_conversation);
      if (!cv || !card(cv, me)) return [];
      const n = Math.min(Math.max(Number(a.p_limit) || 50, 1), 100);
      return messagesOf(cv.id).filter((m) => !a.p_before || m.created_at < a.p_before).slice(-n).map((m) => toMessage(m, me));
    },
    dm_unread: () => { const me = c.uid(); seedDemo(me); return unread(me); },
    dm_report: (a) => {
      const me = c.uid(); const cv = mine(a.p_conversation, me); const o = other(cv, me);
      if (T('reports').some((r) => r.reporter_id === me && r.reported_user === o && r.status === 'open')) throw new BackendError(tr('l2.dm.memberReported'), 'P0001');
      const id = c.uuid();
      T('reports').push({ id, reporter_id: me, post_id: null, comment_id: null, reported_user: o, reason: a.p_reason, details: String(a.p_details ?? '').trim() || null, status: 'open', created_at: c.nowIso() });
      T('dm_report_evidence').push({ report_id: id, conversation_id: cv.id, created_at: c.nowIso(),
        messages: messagesOf(cv.id).filter((m) => m.sender_id === o).slice(-20).map((m) => ({ body: m.body, created_at: m.created_at })) });
      return null;
    },
  };

  return { rpcs, markDemo };
}
