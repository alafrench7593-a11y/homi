/**
 * Démonstration (sans serveur) — mêmes règles que 20261127000100_couple_embrouille_reconnexion.sql et
 * 20261127000200_naissance_postpartum_allaitement.sql :
 *  - calm_requests : lisibles par l'expéditeur et le destinataire (parents) ; écrites par calm_request_send (mission
 *    sans description, modèle vérifié, rejeu sans doublon) ; heure modifiée par calm_request_update (expéditeur) ;
 *  - couple_moments : proposés (autrice et état posés ici), réponses par couple_moment_respond (mêmes transitions),
 *    effacés par leur autrice seulement ; notification neutre ; jamais de refus notifié ;
 *  - checklists : une liste privée n'existe que pour son autrice ; une liste « coparent » partagée : parents seulement ;
 *  - contrôles des valeurs (contractions, douleur 0–10, quantités, dates) comme les contraintes SQL.
 * Les tables strictement personnelles (calm_modes, contractions, birth_plans, postpartum_care_logs,
 * breastfeeding_issues) sont filtrées par OWNER_TABLES dans demo.ts.
 */
import { BackendError } from './types';
import { t as tr } from '@/i18n';
import { CALM_TEMPLATES } from '@/features/calm/domain';
import { nextMomentStatus, type MomentAction } from '@/features/moments/domain';
import { uuid as newId } from '../uuid';
import { addDays, todayISO } from '../domain/dates';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface AbsentsCtx {
  T: (name: string) => Row[];
  me: () => string | undefined;
  nowIso: () => string;
  uuid: () => string;
  missionRpc: (name: string, a: Row) => unknown;
}

export const PERSONAL_TABLES: Record<string, string> = {
  calm_modes: 'user_id', contractions: 'user_id', birth_plans: 'user_id', postpartum_care_logs: 'user_id', breastfeeding_issues: 'user_id',
  // 29/11/2026 (20261129400100) : analyses et souvenirs de grossesse, strictement personnels
  lab_results: 'user_id', pregnancy_memories: 'user_id',
};

const CATEGORY: Record<string, string> = { pickup: 'childcare', groceries: 'shopping', appointment: 'appointments', medicine: 'health', paper: 'admin', night_relay: 'childcare' };
const KEY = /^[a-z0-9_]{1,40}$/;

export function createAbsents(c: AbsentsCtx) {
  const { T } = c;
  const fail = (code = '42501') => new BackendError(tr('l2.dm.forbidden'), code);
  const member = (h: unknown, u: unknown) => T('household_members').find((m) => m.household_id === h && m.user_id === u);
  const isParent = (h: unknown, u: unknown) => ['owner', 'coparent'].includes(String(member(h, u)?.role ?? ''));

  function filter(table: string, rows: Row[]): Row[] | null {
    const me = c.me();
    if (table === 'calm_requests') return rows.filter((r) => (r.from_user === me || r.to_user === me) && isParent(r.household_id, me));
    if (table === 'couple_moments') return rows.filter((r) => (r.from_user === me || r.to_user === me) && isParent(r.household_id, me));
    if (table === 'checklists') return rows.filter(checklistVisible);
    if (table === 'checklist_items') return rows.filter((i) => { const l = T('checklists').find((x) => x.id === i.checklist_id); return !l || checklistVisible(l); });
    if (table === 'milk_stock') return rows.filter((r) => isParent(r.household_id, me));
    if (table === 'bottle_relays') return rows.filter((r) => isParent(r.household_id, me));
    return null;
  }
  function checklistVisible(l: Row) {
    const me = c.me();
    if (l.private_to_creator) return l.created_by === me;
    if (l.kind === 'coparent' && l.created_by) return isParent(l.household_id, me);
    return true;
  }

  /** Mêmes contrôles que les contraintes et gardes SQL ; complète les valeurs posées par le serveur. */
  function beforeInsert(table: string, r: Row) {
    const me = c.me();
    if (table === 'calm_requests') throw fail();
    if (table === 'couple_moments') {
      if (!KEY.test(String(r.idea_key ?? '')) || !isParent(r.household_id, me) || !isParent(r.household_id, r.to_user) || r.to_user === me) throw fail('22023');
      Object.assign(r, { from_user: me, status: 'proposed', planned_at: null, duration_minutes: null, responded_at: null, done_at: null, created_at: c.nowIso(), updated_at: c.nowIso() });
      notify(r.to_user, 'proposed', r.id);
    }
    if (table === 'checklists') {
      r.created_by = me ?? null;
      r.private_to_creator = !!r.private_to_creator;
    }
    if (table === 'contractions') {
      if (r.ended_at && (Date.parse(r.ended_at) <= Date.parse(r.started_at) || Date.parse(r.ended_at) - Date.parse(r.started_at) > 30 * 60_000)) throw fail('23514');
    }
    if (table === 'postpartum_care_logs' || table === 'breastfeeding_issues') {
      if (r.pain != null && !(Number.isInteger(r.pain) && r.pain >= 0 && r.pain <= 10)) throw fail('23514');
      r.updated_at = c.nowIso();
    }
    if (table === 'milk_stock') {
      if (!isParent(r.household_id, me)) throw fail();
      if (!(Number.isInteger(r.amount_ml) && r.amount_ml >= 1 && r.amount_ml <= 1000) || Date.parse(r.use_by) <= Date.parse(r.expressed_at)) throw fail('23514');
      // 72 : les contenants d'une séance ne dépassent pas la quantité tirée
      if (r.pumping_id) {
        const p = T('pumpings').find((x) => x.id === r.pumping_id && x.household_id === r.household_id);
        if (!p) throw fail('22023');
        const stored = T('milk_stock').filter((x) => x.pumping_id === r.pumping_id && x.id !== r.id).reduce((n, x) => n + Number(x.amount_ml), 0);
        if (p.amount_ml != null && stored + r.amount_ml > p.amount_ml) throw fail('23514');
      }
      r.status ??= 'stored'; r.closed_at ??= null; r.created_by = me ?? null; r.updated_at = c.nowIso();
    }
    if (table === 'bottle_relays') {
      const child = T('children').find((k) => k.id === r.child_id && k.household_id === r.household_id);
      if (!child || !isParent(r.household_id, me)) throw fail();
      if (!isParent(r.household_id, r.assigned_to)) throw fail('22023');
      r.status ??= 'planned'; r.given_at ??= null; r.bottle_id ??= null;
      if ((r.status === 'given') !== !!r.given_at || (r.bottle_id && r.status !== 'given')) throw fail('23514');
      r.created_by = me ?? null; r.updated_at = c.nowIso();
    }
    // Comme la base (created_by default auth.uid()) : sans autrice, un rendez-vous privé disparaissait de la démo
    if (table === 'appointments') r.created_by ??= me ?? null;
    if (table === 'meals' && Array.isArray(r.refused_foods) && r.refused_foods.some((f: string) => !(r.foods ?? []).includes(f))) throw fail('23514');
    if (table === 'food_tastings' && r.outcome && (r.outcome === 'refused') !== (r.status === 'refused')) throw fail('23514');
    if (table === 'lab_results') {
      if (!String(r.name ?? '').trim() || typeof r.value !== 'number' || !Number.isFinite(r.value)) throw fail('23514');
      r.name = String(r.name).trim(); r.updated_at = c.nowIso();
    }
    if (table === 'pregnancy_memories') {
      if (!r.title && !r.body && !(r.photo_ids ?? []).length) throw fail('23514');
      if ((r.photo_ids ?? []).some((id: string) => !T('documents').some((d) => d.id === id && d.uploaded_by === me && d.private_to_uploader))) throw fail();
      r.updated_at = c.nowIso();
    }
    if (table === 'formula_changes') {
      const child = T('children').find((k) => k.id === r.child_id);
      if (!child || !isParent(child.household_id, me)) throw fail();
      if (r.ended_on && r.ended_on < r.started_on) throw fail('23514');
      r.household_id = child.household_id; r.created_by = me ?? null; r.updated_at = c.nowIso();
    }
  }
  /** Mises à jour : listes privées (seule l'autrice choisit), contenants et laits (mêmes contrôles). */
  function beforeUpdate(table: string, r: Row, patch: Row) {
    const me = c.me();
    if (table === 'couple_moments' || table === 'calm_requests') throw fail();
    if (table === 'checklists' && 'private_to_creator' in patch && r.created_by !== me) throw fail();
    if (table === 'milk_stock' || table === 'formula_changes' || table === 'postpartum_care_logs' || table === 'bottle_relays' || table === 'lab_results' || table === 'pregnancy_memories') patch.updated_at = c.nowIso();
  }
  function filterRemove(table: string, rows: Row[]): Row[] {
    const me = c.me();
    if (table === 'couple_moments') return rows.filter((r) => r.from_user === me);
    if (table === 'calm_requests') return [];
    if (table === 'checklists' || table === 'checklist_items') return rows.filter((r) => table === 'checklists' ? checklistVisible(r) : filter('checklist_items', [r])!.length > 0);
    return rows;
  }

  const LANG_TEXT = {
    proposed: () => tr('mom.notif.proposed'),
    accepted: () => tr('mom.notif.accepted'),
  };
  function notify(to: string, kind: 'proposed' | 'accepted', momentId: string) {
    T('notifications').push({ id: c.uuid(), user_id: to, category: 'family', title: LANG_TEXT[kind](), body: tr('mom.notif.body'), deep_link: '/family/moments',
      payload: { moment_id: momentId }, read_at: null, created_at: c.nowIso() });
  }

  const rpcs: Record<string, (a: Row) => unknown> = {
    calm_request_send: (a) => {
      const me = c.me();
      if (!me || !isParent(a.p_household, me)) throw fail();
      if (!a.p_assignee || a.p_assignee === me || !isParent(a.p_household, a.p_assignee)) throw fail('22023');
      if (!CALM_TEMPLATES.some((x) => x.key === a.p_template)) throw fail('22023');
      const title = String(a.p_title ?? '');
      if (!title.trim() || title.length > 120 || /[\r\n]/.test(title)) throw fail('22023');
      if (a.p_client_id) {
        const task = T('family_tasks').find((x) => x.household_id === a.p_household && x.client_id === a.p_client_id);
        const again = task && T('calm_requests').find((x) => x.task_id === task.id);
        if (again) return { ...again };
      }
      const task = c.missionRpc('create_mission', {
        p_household: a.p_household, p_title: title, p_assignee: a.p_assignee, p_category: CATEGORY[a.p_template], p_notes: null, p_due_at: a.p_due_at ?? null,
        p_all_day: false, p_priority: 'normal', p_recurrence: null, p_child_id: a.p_child ?? null, p_pet_id: null, p_shopping_item_id: null, p_product_label: null,
        p_document_id: null, p_domain_key: null, p_client_id: a.p_client_id ?? null,
      }) as Row;
      const row = { id: c.uuid(), household_id: a.p_household, task_id: task.id, template_key: a.p_template, child_id: a.p_child ?? null, from_user: me, to_user: a.p_assignee, due_at: a.p_due_at ?? null, created_at: c.nowIso() };
      T('calm_requests').push(row);
      return { ...row };
    },
    calm_request_update: (a) => {
      const me = c.me();
      const r = T('calm_requests').find((x) => x.id === a.p_id);
      if (!r || r.from_user !== me || !isParent(r.household_id, me)) return { status: 'not_found' };
      const t = T('family_tasks').find((x) => x.id === r.task_id);
      if (!t || !['pending', 'accepted', 'postponed'].includes(t.mission_state)) throw fail('22023');
      t.due_at = a.p_due_at; t.updated_at = c.nowIso(); t.version = Number(t.version ?? 1) + 1;
      r.due_at = a.p_due_at;
      return { status: 'ok', row: { ...r } };
    },
    couple_moment_respond: (a) => {
      const me = c.me();
      const m = T('couple_moments').find((x) => x.id === a.p_id);
      if (!me || !m || (m.from_user !== me && m.to_user !== me) || !isParent(m.household_id, me)) return { status: 'not_found' };
      const action = String(a.p_action) as MomentAction;
      const prev = m.status;
      const next = nextMomentStatus(m as never, action, me);
      if (!next) throw fail();
      if (next === prev && action !== 'plan') return { status: 'ok', unchanged: true, row: { ...m } };
      if (action === 'plan' && a.p_planned_at && Date.parse(a.p_planned_at) < Date.now() - 86_400_000) throw fail('22023');
      Object.assign(m, {
        status: next,
        planned_at: action === 'plan' ? a.p_planned_at ?? null : m.planned_at,
        duration_minutes: action === 'plan' ? a.p_duration ?? m.duration_minutes : m.duration_minutes,
        responded_at: action === 'accept' || action === 'decline' || (action === 'plan' && prev === 'proposed') ? c.nowIso() : m.responded_at,
        done_at: action === 'done' ? c.nowIso() : m.done_at,
        updated_at: c.nowIso(),
      });
      if (action === 'accept' || (action === 'plan' && prev === 'proposed')) notify(m.from_user, 'accepted', m.id);
      return { status: 'ok', row: { ...m } };
    },
  };
  return { rpcs, filter, beforeInsert, beforeUpdate, filterRemove };
}

/**
 * Exemples de la démonstration : laits infantiles de Lina, stock de lait (un contenant au réfrigérateur, deux au
 * congélateur), un moment à deux passé et une idée proposée par le co-parent, une demande pratique reçue.
 */
export function seedAbsents({ userId, hid, childId, T }: { userId: string; hid: string; childId: string; T: (t: string) => Row[] }) {
  if (T('formula_changes').some((f) => f.household_id === hid)) return;
  const now = new Date().toISOString();
  const today = todayISO();
  T('formula_changes').push(
    { id: newId(), household_id: hid, child_id: childId, brand: 'Lait 1er âge (marque A)', kind: 'first_age', started_on: addDays(today, -400), ended_on: addDays(today, -230), reason: 'start', observations: null, created_by: userId, created_at: now, updated_at: now },
    { id: newId(), household_id: hid, child_id: childId, brand: 'Lait 2e âge (marque A)', kind: 'second_age', started_on: addDays(today, -229), ended_on: null, reason: 'age', observations: 'Bien accepté dès le premier biberon.', created_by: userId, created_at: now, updated_at: now },
  );
  const at = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
  const plus = (iso: string, h: number) => new Date(Date.parse(iso) + h * 3600_000).toISOString();
  const months4 = (iso: string) => { const d = new Date(iso); d.setMonth(d.getMonth() + 4); return d.toISOString(); };
  T('milk_stock').push(
    { id: newId(), household_id: hid, child_id: childId, pumping_id: null, expressed_at: at(20), amount_ml: 120, location: 'fridge', thawed_at: null, use_by: plus(at(20), 48), status: 'stored', closed_at: null, note: null, created_by: userId, created_at: now, updated_at: now },
    { id: newId(), household_id: hid, child_id: childId, pumping_id: null, expressed_at: at(24 * 40), amount_ml: 90, location: 'freezer', thawed_at: null, use_by: months4(at(24 * 40)), status: 'stored', closed_at: null, note: null, created_by: userId, created_at: now, updated_at: now },
    { id: newId(), household_id: hid, child_id: childId, pumping_id: null, expressed_at: at(24 * 12), amount_ml: 150, location: 'freezer', thawed_at: null, use_by: months4(at(24 * 12)), status: 'stored', closed_at: null, note: null, created_by: userId, created_at: now, updated_at: now },
  );
}
