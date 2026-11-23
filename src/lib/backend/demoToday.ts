/**
 * Démonstration : une journée réaliste dans le foyer d'exemple, pour « Aujourd'hui dans le foyer » (Accueil).
 * Ajout isolé (appelé par buildSampleFamily) : co-parent « Sam » (même personne que demo_mission_partner), deux missions
 * (une qui attend la réponse de Camille, une acceptée par Sam), deux tâches simples, une tâche déjà faite, un événement
 * du foyer et le relais de nuit de ce soir. Mêmes formes de lignes que create_mission / les insertions de la démo.
 */
import { t as tr } from '@/i18n';
import { uuid } from '../uuid';
import { DEMO_PARTNER_ID } from './demoMissions';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function seedTodayHousehold(o: { userId: string; hid: string; childId: string | null; T: (t: string) => Row[] }) {
  const { userId, hid, childId, T } = o;
  if (T('family_tasks').some((x) => x.household_id === hid && x.client_id === 'demo-today:milk')) return;
  const now = new Date();
  const nowIso = now.toISOString();
  const at = (h: number, m = 0, dayShift = 0) => { const d = new Date(now); d.setDate(d.getDate() + dayShift); d.setHours(h, m, 0, 0); return d.toISOString(); };
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);

  // Co-parent du foyer d'exemple (rôle et droits identiques à demo_mission_partner)
  if (!T('household_members').some((m) => m.household_id === hid && m.user_id !== userId)) {
    T('household_members').push({ household_id: hid, user_id: DEMO_PARTNER_ID, role: 'coparent', joined_at: new Date(now.getTime() - 400 * 86400_000).toISOString(),
      can_view: ['daily', 'health', 'documents', 'pregnancy', 'lists', 'names', 'profile'], can_edit: ['daily', 'lists', 'names'], child_scope: null, pregnancy_access: true });
    if (!T('profiles').some((p) => p.id === DEMO_PARTNER_ID)) {
      const base = T('profiles').find((p) => p.id === userId) ?? {};
      T('profiles').push({ ...base, id: DEMO_PARTNER_ID, display_name: 'Sam', avatar_path: null, onboarding_completed: true });
    }
  }
  const partner = T('household_members').find((m) => m.household_id === hid && m.user_id !== userId)?.user_id ?? DEMO_PARTNER_ID;

  const base = (r: Row): Row => ({
    id: uuid(), household_id: hid, essential: false, recurrence: null, status: 'todo', done_at: null, done_by: null, notes: null, routine_id: null,
    priority: 'normal', updated_by: null, created_at: new Date(now.getTime() - 3 * 3600_000).toISOString(), updated_at: nowIso, version: 1, mission_state: null, ...r,
  });
  const mission = (r: Row): Row => base({
    all_day: false, child_id: null, pet_id: null, shopping_item_id: null, product_label: null, document_id: null, responded_at: null, last_reminded_at: null, ...r,
  });
  const rows: Row[] = [
    // Mission de Sam pour Camille : attend sa réponse
    mission({ client_id: 'demo-today:milk', title: tr('mis.tpl.milk'), category: 'shopping', due_at: at(18), assignee_id: userId, created_by: partner, mission_state: 'pending',
      product_label: tr('mis.tpl.milk.product'), domain_key: 'shopping' }),
    // Mission de Camille, acceptée par Sam
    mission({ client_id: 'demo-today:pickup', title: tr('ht.demo.pickup'), category: 'childcare', due_at: at(17, 30), assignee_id: partner, created_by: userId, mission_state: 'accepted',
      child_id: childId, domain_key: 'childcare', responded_at: new Date(now.getTime() - 2 * 3600_000).toISOString() }),
    // Tâches simples : une pour Camille, une à prendre (sans heure), une déjà faite par Sam
    base({ client_id: 'demo-today:bath', title: tr('ht.demo.bath'), category: 'other', due_at: at(19), assignee_id: userId, created_by: userId }),
    base({ client_id: 'demo-today:pharmacy', title: tr('ht.demo.pharmacy'), category: 'health', due_at: null, assignee_id: null, created_by: partner }),
    base({ client_id: 'demo-today:laundry', title: tr('ht.demo.laundry'), category: 'housework', due_at: null, assignee_id: partner, created_by: userId, status: 'done',
      done_at: new Date(Math.max(startOfDay.getTime() + 60_000, now.getTime() - 2 * 3600_000)).toISOString(), done_by: partner }),
  ];
  for (const r of rows) {
    T('family_tasks').push(r);
    T('family_task_events').push({ id: uuid(), task_id: r.id, household_id: hid, actor_id: r.created_by, kind: 'created', detail: { assignee: r.assignee_id, ...(r.mission_state ? { mission: true } : {}) }, created_at: r.created_at });
    if (r.mission_state === 'accepted') T('family_task_events').push({ id: uuid(), task_id: r.id, household_id: hid, actor_id: partner, kind: 'accepted', detail: { mission: true, action: 'accept', state: 'accepted' }, created_at: r.responded_at });
  }

  // Un événement du foyer à venir aujourd'hui (activité de Lina) et le relais de nuit de ce soir (Sam)
  const h = Math.min(21, Math.max(9, now.getHours() + 2));
  T('family_events').push({ id: uuid(), household_id: hid, child_id: childId, kind: 'activity', title: tr('ht.demo.event'), starts_at: at(h), ends_at: at(h, 45), all_day: false,
    location_label: tr('ht.demo.eventPlace'), notes: null, recurrence: null, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris', created_by: userId, created_at: nowIso, updated_at: nowIso });
  T('care_shifts').push({ id: uuid(), household_id: hid, kind: 'night', user_id: partner, starts_at: at(22), ends_at: at(6, 0, 1), status: 'planned', note: null, created_by: userId, created_at: nowIso });

  // Stocks d'exemple (16/11/2026) : /family/stocks n'est plus vide dans la démo. Niveaux variés (bien, bientôt, non
  // renseigné), aucun réapprovisionnement en cours : la suggestion naît du serveur émulé quand un niveau change.
  // Libellés distincts des scénarios E2E (« Couches », « Croquettes ») pour ne pas fusionner avec leurs stocks.
  if (!T('household_stocks').some((s) => s.household_id === hid && String(s.client_id ?? '').startsWith('demo-stock:'))) {
    const stock = (key: string, r: Row): Row => ({
      id: uuid(), household_id: hid, brand: null, size: null, unit: 'u', frequency_days: null, responsible_id: null, reminder: true, child_id: null, pet_id: null,
      ingredient_key: null, source: 'manual', notes: null, restock_state: 'ok', low_since: null, restock_task_id: null, restock_item_id: null, last_purchase_at: null,
      last_validated_by: null, client_id: `demo-stock:${key}`, version: 1, created_by: userId, created_at: new Date(now.getTime() - 20 * 86400_000).toISOString(), updated_at: nowIso, ...r,
    });
    for (const r of [
      stock('night_diapers', { label: tr('ht.demo.stock.night_diapers'), category: 'diapers', size: '4', qty_estimate: 24, threshold: 10, frequency_days: 7, responsible_id: partner, child_id: childId }),
      stock('milk', { label: tr('ht.demo.stock.milk'), category: 'milk', qty_estimate: 2, unit: 'boite', threshold: 1, frequency_days: 10, responsible_id: userId, child_id: childId }),
      stock('wipes', { label: tr('ht.demo.stock.wipes'), category: 'wipes', qty_estimate: 3, unit: 'paquet', threshold: 2, child_id: childId }),
      stock('kibble', { label: tr('ht.demo.stock.kibble'), category: 'pet_food', qty_estimate: 2, unit: 'kg', threshold: 1, responsible_id: partner }),
      stock('laundry', { label: tr('ht.demo.stock.laundry'), category: 'laundry', qty_estimate: null, unit: 'bouteille', threshold: 1 }),
      stock('toilet', { label: tr('ht.demo.stock.toilet'), category: 'toilet_paper', qty_estimate: 12, unit: 'rouleau', threshold: 6 }),
    ]) T('household_stocks').push(r);
  }
}
