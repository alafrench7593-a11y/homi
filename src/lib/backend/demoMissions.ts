/**
 * Démonstration (sans serveur) : missions familiales, mêmes règles que 20261114000300_missions.sql.
 *  - create_mission / mission_respond : mêmes transitions (src/lib/domain/missions.ts, miroir de _mission_next_state),
 *    mêmes droits (seul le destinataire répond, seul le créateur annule / réattribue / relance 1 fois par 24 h),
 *    même historique (family_task_events) ;
 *  - consommateur des événements « mission.* » : notification neutre au bon destinataire, article de courses créé à
 *    l'acceptation (sans doublon) et coché à la fin ;
 *  - une seconde personne (« Sam ») peut rejoindre le foyer de démonstration pour essayer les deux côtés d'une mission
 *    sur un seul appareil (demo_mission_partner) ; la bascule de session est faite par demo.ts.
 */
import { BackendError } from './types';
import { t as tr } from '@/i18n';
import {
  CREATOR_ACTIONS, EVENT_OF_ACTION, MISSION_ACTIONS, MISSION_DOMAIN_OF, missionHref, missionNotification, missionNotifyTarget, nextState,
  type MissionAction, type MissionEventType, type MissionState,
} from '../domain/missions';
import type { TaskCategory } from '../domain/familyLoad';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface MissionsCtx {
  T: (name: string) => Row[];
  me: () => string | undefined;
  nowIso: () => string;
  uuid: () => string;
  taskEvent: (t: Row, kind: string, detail?: Row) => void;
  nextOccurrence: (t: Row) => void;
}

export const DEMO_PARTNER_ID = '5a4d0000-0000-4000-8000-00000000d3a0';
const fail = (msg: string, code = '22023') => new BackendError(msg, code);

export function createMissions(c: MissionsCtx) {
  const { T } = c;
  const member = (household: unknown, user: unknown) => T('household_members').find((m) => m.household_id === household && m.user_id === user);
  const childAllowed = (m: Row, child: unknown) => !child || m.role === 'owner' || (m.child_scope == null ? m.role !== 'caregiver' : (m.child_scope as unknown[]).includes(child));
  const canReceive = (household: unknown, user: unknown, child: unknown) => {
    const m = member(household, user);
    return !!m && (m.role === 'owner' || (m.can_view ?? []).includes('lists')) && childAllowed(m, child);
  };
  const touch = (t: Row) => { t.version = Number(t.version ?? 1) + 1; t.updated_at = c.nowIso(); t.updated_by = c.me() ?? null; };

  /** Consommateur des événements « mission.* » (miroir de _consume_mission_event). */
  function consume(type: MissionEventType, t: Row, actor: string | undefined) {
    const target = missionNotifyTarget(type, t as never);
    const text = missionNotification(type, t.title);
    if (target && text) {
      const to: string[] = target === 'household'
        ? T('household_members').filter((m) => m.household_id === t.household_id && m.user_id !== t.created_by && canReceive(t.household_id, m.user_id, t.child_id)).map((m) => m.user_id)
        : [target === 'assignee' ? t.assignee_id : t.created_by].filter((u) => u && canReceive(t.household_id, u, t.child_id));
      for (const u of to) {
        if (u === actor) continue;
        T('notifications').push({ id: c.uuid(), user_id: u, category: 'family', title: text.title, body: text.body, deep_link: missionHref(t.id),
          payload: { task_id: t.id, mission: type }, read_at: null, created_at: c.nowIso() });
      }
    }
    const purchase = !!t.product_label || t.category === 'shopping';
    if ((type === 'mission.accepted' || type === 'mission.started') && !t.shopping_item_id && purchase && ['accepted', 'in_progress'].includes(t.mission_state)) {
      const label = String(t.product_label ?? t.title).trim().slice(0, 120);
      let list = T('shopping_lists').filter((l) => l.household_id === t.household_id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
      if (!list) { list = { id: c.uuid(), household_id: t.household_id, plan_id: null, title: 'Courses', created_by: actor ?? t.created_by, created_at: c.nowIso() }; T('shopping_lists').push(list); }
      const clientId = `mission-item:${t.id}`;
      let item = T('shopping_items').find((i) => i.list_id === list!.id && !i.checked && String(i.label).trim().toLowerCase() === label.toLowerCase())
        ?? T('shopping_items').find((i) => i.household_id === t.household_id && i.client_id === clientId);
      if (!item) {
        const position = Math.max(-1, ...T('shopping_items').filter((i) => i.list_id === list!.id).map((i) => Number(i.position ?? 0))) + 1;
        item = { id: c.uuid(), list_id: list.id, household_id: t.household_id, ingredient_key: null, label, qty: null, unit: null, aisle: 'epicerie',
          at_home: false, checked: false, checked_by: null, checked_at: null, position, client_id: clientId, version: 1, updated_at: c.nowIso() };
        T('shopping_items').push(item);
      }
      t.shopping_item_id = item.id;
    }
    if (type === 'mission.completed' && t.shopping_item_id) {
      const item = T('shopping_items').find((i) => i.id === t.shopping_item_id);
      if (item && !item.checked) Object.assign(item, { checked: true, checked_by: actor ?? null, checked_at: c.nowIso(), version: Number(item.version ?? 1) + 1 });
    }
  }

  const rpcs: Record<string, (a: Row) => unknown> = {
    create_mission: (a) => {
      const me = c.me();
      if (!me) throw fail(tr('l2.dm.forbidden'), '42501');
      const mine = member(a.p_household, me);
      if (!mine || !(mine.role === 'owner' || (mine.can_edit ?? []).includes('lists'))) throw fail(tr('l2.dm.forbidden'), '42501');
      if (a.p_client_id) {
        const again = T('family_tasks').find((x) => x.household_id === a.p_household && x.client_id === a.p_client_id);
        if (again) return { ...again };
      }
      const title = String(a.p_title ?? '').trim();
      if (title.length < 1 || title.length > 120) throw fail(tr('mis.form.titleRequired'));
      if (a.p_child_id && !childAllowed(mine, a.p_child_id)) throw fail(tr('l2.dm.forbidden'));
      const category = (a.p_category ?? 'other') as TaskCategory;
      const domain = a.p_domain_key ?? MISSION_DOMAIN_OF[category] ?? null;
      let assignee: string | null = a.p_assignee ?? null;
      if (!assignee && domain) {
        const owner = T('family_domains').find((d) => d.household_id === a.p_household && d.key === domain)?.owner_id;
        if (owner && owner !== me && canReceive(a.p_household, owner, a.p_child_id)) assignee = owner;
      }
      if (assignee === me) throw fail(tr('l2.dm.forbidden'));
      if (assignee && !canReceive(a.p_household, assignee, a.p_child_id)) throw fail(tr('l2.dm.forbidden'));
      const t: Row = {
        id: c.uuid(), household_id: a.p_household, title, category, due_at: a.p_due_at ?? null, all_day: !!a.p_all_day, assignee_id: assignee,
        priority: a.p_priority ?? 'normal', essential: false, recurrence: a.p_recurrence ?? null, status: 'todo', done_at: null, done_by: null,
        notes: a.p_notes ? String(a.p_notes).trim() || null : null, routine_id: null, created_by: me, updated_by: null, created_at: c.nowIso(), updated_at: c.nowIso(),
        mission_state: 'pending', child_id: a.p_child_id ?? null, pet_id: a.p_pet_id ?? null, shopping_item_id: a.p_shopping_item_id ?? null,
        product_label: a.p_product_label ? String(a.p_product_label).trim() || null : null, document_id: a.p_document_id ?? null, domain_key: domain,
        responded_at: null, last_reminded_at: null, client_id: a.p_client_id ?? null, version: 1,
      };
      T('family_tasks').push(t);
      c.taskEvent(t, 'created', { assignee: assignee, mission: true });
      consume('mission.requested', t, me);
      return { ...t };
    },
    mission_respond: (a) => {
      const me = c.me();
      const action = String(a.p_action) as MissionAction;
      if (!MISSION_ACTIONS.includes(action)) throw fail(tr('l2.dm.forbidden'));
      const t = T('family_tasks').find((x) => x.id === a.p_task);
      if (!t || !t.mission_state) return { status: 'not_found' };
      const m = member(t.household_id, me);
      if (!m || !(m.role === 'owner' || (m.can_view ?? []).includes('lists')) || !childAllowed(m, t.child_id)) return { status: 'not_found' };
      if (a.p_expected_version != null && Number(a.p_expected_version) !== Number(t.version ?? 1)) return { status: 'conflict', row: { ...t } };
      if (CREATOR_ACTIONS.includes(action)) {
        if (t.created_by !== me) throw fail(tr('l2.dm.forbidden'), '42501');
      } else if (!t.assignee_id) {
        if (me === t.created_by || !['accept', 'start', 'complete'].includes(action)) throw fail(tr('l2.dm.forbidden'), '42501');
      } else if (t.assignee_id !== me) throw fail(tr('l2.dm.forbidden'), '42501');
      const state = t.mission_state as MissionState;
      const next = nextState(state, action);
      const target: Partial<Record<MissionAction, MissionState>> = { accept: 'accepted', start: 'in_progress', complete: 'done', decline: 'declined', cancel: 'cancelled' };
      if (!next) {
        if (target[action] === state) return { status: 'ok', unchanged: true, row: { ...t } };
        throw fail(tr('l2.dm.forbidden'));
      }
      const note = a.p_note ? String(a.p_note).trim() : '';
      if (note.length > 300) throw fail(tr('l2.dm.forbidden'));
      if (action === 'postpone' && (!a.p_due_at || Date.parse(a.p_due_at) < Date.now() - 5 * 60000)) throw fail(tr('mis.form.dateInvalid'));
      if (action === 'remind' && t.last_reminded_at && Date.now() - Date.parse(t.last_reminded_at) < 24 * 3600_000) throw fail(tr('mis.act.remindLimit'));
      if (action === 'reassign' && (!a.p_assignee || a.p_assignee === t.created_by || !canReceive(t.household_id, a.p_assignee, t.child_id))) throw fail(tr('l2.dm.forbidden'));
      const wasDone = t.status === 'done';
      if (action === 'reassign') t.assignee_id = a.p_assignee;
      else if (!t.assignee_id && ['accept', 'start', 'complete'].includes(action)) t.assignee_id = me;
      t.mission_state = next;
      t.status = next === 'done' ? 'done' : next === 'cancelled' ? 'cancelled' : 'todo';
      if (action === 'postpone') t.due_at = a.p_due_at;
      if (['accept', 'decline', 'postpone', 'start', 'complete'].includes(action)) t.responded_at = c.nowIso();
      if (action === 'remind') t.last_reminded_at = c.nowIso();
      if (t.status === 'done' && !wasDone) { t.done_at = c.nowIso(); t.done_by = me ?? null; }
      if (t.status !== 'done') { t.done_at = null; t.done_by = null; }
      touch(t);
      const kind: Record<MissionAction, string> = { accept: 'accepted', decline: 'declined', postpone: 'postponed', start: 'started', complete: 'done', ask: 'question', cancel: 'cancelled', reassign: 'assigned', remind: 'reminded' };
      const detail: Row = { mission: true, action, state: next };
      if (note) detail.note = note;
      if (action === 'postpone') detail.to = a.p_due_at;
      if (action === 'reassign') detail.to = a.p_assignee;
      c.taskEvent(t, kind[action], detail);
      if (t.status === 'done' && !wasDone) c.nextOccurrence(t);
      consume(EVENT_OF_ACTION[action], t, me);
      return { status: 'ok', row: { ...t } };
    },
    /** Démonstration uniquement : une seconde personne (co-parent « Sam ») rejoint le foyer de démonstration. */
    demo_mission_partner: () => {
      const me = c.me();
      const mine = T('household_members').find((m) => m.user_id === me);
      if (!mine) throw fail(tr('l2.dm.forbidden'));
      const hid = mine.household_id;
      const other = T('household_members').find((m) => m.household_id === hid && m.user_id !== me);
      if (other) return { user_id: other.user_id, household_id: hid };
      T('household_members').push({ household_id: hid, user_id: DEMO_PARTNER_ID, role: 'coparent', joined_at: c.nowIso(),
        can_view: ['daily', 'health', 'documents', 'pregnancy', 'lists', 'names', 'profile'], can_edit: ['daily', 'lists', 'names'], child_scope: null, pregnancy_access: true });
      if (!T('profiles').some((p) => p.id === DEMO_PARTNER_ID)) {
        const base = T('profiles').find((p) => p.id === me) ?? {};
        T('profiles').push({ ...base, id: DEMO_PARTNER_ID, display_name: 'Sam', avatar_path: null, onboarding_completed: true });
      }
      return { user_id: DEMO_PARTNER_ID, household_id: hid };
    },
  };
  return { rpcs };
}
