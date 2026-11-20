/**
 * Démonstration (sans serveur) : « Se comprendre », profil familial, grossesse partagée (19/11/2026) — mêmes règles que
 * 20261119100000_confidentialite_coparent.sql et 20261119100100_se_comprendre.sql :
 *  - couple_feelings : la personne connectée seule ;
 *  - couple_messages : autrice + destinataire, adultes ACTIFS du foyer ; écrits par couple_send (rejeu : même message) ;
 *    notification au texte fixe, sans contenu ; discrétion choisie par le destinataire ;
 *  - grossesse : lisible par la personne enceinte, sinon seulement si elle l'a partagée (essentiel / médical) ;
 *  - rendez-vous « pour moi » : réservés à leur autrice, sauf partage explicite.
 */
import { BackendError } from './types';
import { t as tr } from '@/i18n';
import { firstName } from '../domain/missions';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface CoupleCtx { T: (name: string) => Row[]; me: () => string | undefined; nowIso: () => string; uuid: () => string }

export function createCouple(c: CoupleCtx) {
  const { T } = c;
  const member = (household: unknown, user: unknown) => T('household_members').find((m) => m.household_id === household && m.user_id === user);
  const isParent = (household: unknown, user: unknown) => ['owner', 'coparent'].includes(String(member(household, user)?.role ?? ''));
  const fail = (msg: string, code = '42501') => new BackendError(msg, code);

  /** Lecture « sous RLS » des tables concernées ; null = table non concernée. */
  function filter(table: string, rows: Row[]): Row[] | null {
    const me = c.me();
    if (table === 'couple_feelings') return rows.filter((r) => r.user_id === me);
    if (table === 'couple_messages') return rows.filter((r) => (r.author_id === me || r.recipient_id === me) && isParent(r.household_id, me));
    if (table === 'family_member_profiles') return rows.filter((r) => r.user_id === me || (!!member(r.household_id, me) && !!member(r.household_id, r.user_id)));
    if (table === 'pregnancies') return rows.filter((p) => pregnancyVisible(p, 'share_basics'));
    if (table === 'appointments') return rows.filter((a) => (!a.private_to_creator || a.created_by === me) && (!a.for_parent || (a.created_by ?? me) === me || a.shared_with_household === true)
      && (!a.pregnancy_id || pregnancyIdVisible(a.pregnancy_id, 'share_basics')));
    return null;
  }
  function pregnancyVisible(p: Row, flag: 'share_basics' | 'share_medical') {
    const me = c.me();
    const m = member(p.household_id, me);
    if (!m) return false;
    if (p.carrier_user_id === me) return true;
    return (m.role === 'owner' || m.pregnancy_access !== false) && (!p.carrier_user_id || p[flag] === true);
  }
  function pregnancyIdVisible(id: unknown, flag: 'share_basics' | 'share_medical') {
    const p = T('pregnancies').find((x) => x.id === id);
    return !p || pregnancyVisible(p, flag);
  }

  const rpcs: Record<string, (a: Row) => unknown> = {
    couple_send: (a) => {
      const me = c.me();
      if (!me || !isParent(a.p_household, me) || !isParent(a.p_household, a.p_recipient) || a.p_recipient === me) throw fail(tr('l2.dm.forbidden'));
      if (a.p_client_id) {
        const again = T('couple_messages').find((m) => m.author_id === me && m.client_id === a.p_client_id);
        if (again) return { ...again };
      }
      const body = String(a.p_body ?? '').trim();
      if (!body || body.length > 2000) throw fail(tr('l2.dm.forbidden'), '22023');
      const row = { id: c.uuid(), household_id: a.p_household, author_id: me, recipient_id: a.p_recipient, kind: a.p_kind, situation: a.p_situation ?? null,
        body, reply_to: a.p_reply_to ?? null, task_id: a.p_task ?? null, client_id: a.p_client_id ?? null, created_at: c.nowIso() };
      T('couple_messages').push(row);
      const discreet = T('notification_settings').some((s) => s.user_id === a.p_recipient && s.couple_discreet === true);
      const name = discreet ? null : firstName(T('profiles').find((p) => p.id === me)?.display_name as string | undefined);
      T('notifications').push({ id: c.uuid(), user_id: a.p_recipient, category: 'family',
        title: name ? `${name} souhaite partager quelque chose avec toi` : 'Ton partenaire souhaite partager quelque chose avec toi',
        body: 'Ouvre HOMI quand tu le souhaites.', deep_link: '/family/understand/inbox', payload: { couple: true }, read_at: null, created_at: c.nowIso() });
      return { ...row };
    },
    set_pregnancy_sharing: (a) => {
      const p = T('pregnancies').find((x) => x.id === a.p_pregnancy);
      if (!p || p.carrier_user_id !== c.me()) throw fail(tr('l2.dm.forbidden'));
      p.share_basics = !!a.p_basics;
      p.share_medical = !!a.p_medical && !!a.p_basics;
      return null;
    },
  };
  return { rpcs, filter };
}
