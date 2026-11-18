/**
 * Démonstration (sans serveur) : Espace Nounou, mêmes règles que 20261121000100_espace_nounou.sql pour la personne
 * connectée (parent du foyer d'exemple). Une démonstration n'a qu'un compte : l'invitation produit un lien, mais
 * personne ne peut l'accepter sur cet appareil (dit honnêtement à l'écran).
 */
import { BackendError } from './types';
import { t as tr } from '@/i18n';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface ChildcareCtx {
  T: (name: string) => Row[];
  me: () => string | undefined;
  nowIso: () => string;
  uuid: () => string;
}

export function createChildcare(c: ChildcareCtx) {
  const { T } = c;
  const childOf = (id: unknown) => T('children').find((k) => k.id === id);
  const isParent = (childId: unknown) => {
    const k = childOf(childId);
    return !!k && T('household_members').some((m) => m.household_id === k.household_id && m.user_id === c.me() && (m.role === 'owner' || m.role === 'coparent'));
  };
  const deny = () => new BackendError(tr('l2.dm.forbidden'), '42501');
  const settingsOf = (childId: unknown) => {
    let s = T('childcare_settings').find((x) => x.child_id === childId);
    if (!s) {
      s = { child_id: childId, household_id: childOf(childId)?.household_id, photos_allowed: false, photos_allowed_at: null, photos_allowed_by: null, retention: '30d', allow_download: false, notify_name: false };
      T('childcare_settings').push(s);
    }
    return s;
  };
  const rpcs: Record<string, (a: Row) => unknown> = {
    my_childcare: () => [],
    childcare_invite: (a) => {
      if (!isParent(a.p_child)) throw deny();
      const token = (c.uuid() + c.uuid()).replace(/-/g, '').slice(0, 36);
      const exp = new Date(Date.now() + 72 * 3600_000).toISOString();
      const id = c.uuid();
      T('childcare_links').push({ id, household_id: childOf(a.p_child)?.household_id, child_id: a.p_child, caregiver_id: null, invitation_id: c.uuid(), invited_by: c.me(),
        label: a.p_label || null, created_at: c.nowIso(), expires_at: exp, accepted_at: null, confirmed_at: null, revoked_at: null });
      return { token, link_id: id, expires_at: exp };
    },
    childcare_confirm: (a) => {
      const l = T('childcare_links').find((x) => x.id === a.p_link);
      if (!l || !isParent(l.child_id)) throw deny();
      if (!l.accepted_at) throw new BackendError(tr('nn.err.notAccepted'), '22023');
      l.confirmed_at = c.nowIso();
      return null;
    },
    childcare_revoke: (a) => {
      const l = T('childcare_links').find((x) => x.id === a.p_link);
      if (!l || !isParent(l.child_id)) throw deny();
      l.revoked_at = l.revoked_at ?? c.nowIso();
      return null;
    },
    childcare_add_child: () => { throw new BackendError(tr('nn.err.demo'), '22023'); },
    childcare_set_settings: (a) => {
      if (!isParent(a.p_child)) throw deny();
      const s = settingsOf(a.p_child);
      if (a.p_photos_allowed != null && a.p_photos_allowed !== s.photos_allowed) {
        s.photos_allowed = a.p_photos_allowed; s.photos_allowed_at = c.nowIso(); s.photos_allowed_by = c.me();
        T('childcare_consents').push({ id: T('childcare_consents').length + 1, child_id: a.p_child, household_id: s.household_id, user_id: c.me(), photos_allowed: a.p_photos_allowed, created_at: c.nowIso() });
      }
      if (a.p_retention) s.retention = a.p_retention;
      if (a.p_allow_download != null) s.allow_download = a.p_allow_download;
      if (a.p_notify_name != null) s.notify_name = a.p_notify_name;
      return { ...s };
    },
    childcare_photo_to_memories: (a) => {
      const p = T('childcare_photos').find((x) => x.id === a.p_photo);
      if (!p || !isParent(p.child_id)) throw deny();
      if (p.memory_photo_id) return p.memory_photo_id;
      const id = c.uuid();
      T('child_photos').push({ id, household_id: p.household_id, child_id: p.child_id, storage_path: p.storage_path, taken_on: String(p.taken_at).slice(0, 10),
        caption: p.caption ?? null, visibility: 'household', width: p.width ?? null, height: p.height ?? null, created_by: c.me(), created_at: c.nowIso() });
      p.memory_photo_id = id;
      return id;
    },
    childcare_purge_now: () => {
      const now = Date.now();
      const before = T('childcare_photos').length;
      const keep = T('childcare_photos').filter((p) => {
        const r = T('childcare_settings').find((s) => s.child_id === p.child_id)?.retention ?? '30d';
        if (r === 'forever') return true;
        const max = r === '30d' ? 30 * 86400_000 : 365 * 86400_000;
        return now - Date.parse(p.taken_at) <= max;
      });
      T('childcare_photos').splice(0, T('childcare_photos').length, ...keep);
      return before - keep.length;
    },
  };
  return { rpcs };
}
