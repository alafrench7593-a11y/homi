/**
 * Démonstration — numéros partiels du 29/11/2026 (mêmes tables que 20261129400100) : valeurs d'analyses saisies (avec
 * la référence recopiée du compte rendu), un souvenir de grossesse, deux relais de biberons de Lina cette nuit, quelques
 * tétées pour l'allaitement mixte, des propositions en DME et des refus notés. Exemples de saisie seulement : aucune
 * valeur n'est interprétée, aucune norme n'est ajoutée.
 */
import { uuid } from '../uuid';
import { addDays, todayISO } from '../domain/dates';
import { DEMO_PARTNER_ID } from './demoMissions';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function seedPartiels({ userId, hid, childId, T }: { userId: string; hid: string; childId: string; T: (t: string) => Row[] }) {
  if (T('lab_results').some((r) => r.user_id === userId) || T('bottle_relays').some((r) => r.household_id === hid)) return;
  const now = new Date().toISOString();
  const today = todayISO();
  const pregnancy = T('pregnancies').find((p) => p.household_id === hid && p.status === 'active')?.id ?? null;
  const partner = T('household_members').find((m) => m.household_id === hid && m.user_id !== userId && ['owner', 'coparent'].includes(m.role))?.user_id ?? DEMO_PARTNER_ID;

  // ---------------------------------------------------------------- 42 analyses (valeurs saisies)
  const lab = (ago: number, name: string, value: number, unit: string, ref: string | null) =>
    T('lab_results').push({ id: uuid(), user_id: userId, pregnancy_id: pregnancy, document_id: null, name, value, unit, measured_on: addDays(today, -ago), lab_reference: ref, note: null, created_at: now, updated_at: now });
  lab(110, 'Hémoglobine', 12.6, 'g/dL', '11,5 – 16');
  lab(62, 'Hémoglobine', 12.1, 'g/dL', '11,5 – 16');
  lab(18, 'Hémoglobine', 11.9, 'g/dL', '11,5 – 16');
  lab(18, 'Ferritine', 24, 'µg/L', '15 – 150');

  // ---------------------------------------------------------------- 50 souvenir de grossesse
  T('pregnancy_memories').push({
    id: uuid(), user_id: userId, pregnancy_id: pregnancy, happened_on: addDays(today, -9), week_sa: null, kind: 'moment',
    title: 'Premiers coups de pied', body: 'Ce soir, sur le canapé : deux petits coups, puis plus rien. On a ri.', photo_ids: [], created_at: now, updated_at: now,
  });

  // ---------------------------------------------------------------- 80 relais de biberons (cette nuit)
  const at = (h: number) => { const d = new Date(); d.setHours(h, 0, 0, 0); if (h < 12) d.setDate(d.getDate() + 1); return d.toISOString(); };
  T('bottle_relays').push(
    { id: uuid(), household_id: hid, child_id: childId, planned_at: at(23), planned_ml: 180, assigned_to: partner, status: 'planned', bottle_id: null, given_at: null, note: 'Lait 2e âge, deux mesurettes de plus', created_by: userId, created_at: now, updated_at: now },
    { id: uuid(), household_id: hid, child_id: childId, planned_at: at(3), planned_ml: 150, assigned_to: userId, status: 'planned', bottle_id: null, given_at: null, note: null, created_by: userId, created_at: now, updated_at: now },
  );

  // ---------------------------------------------------------------- 75 / 83 allaitement mixte : tétées notées
  const h = (ago: number) => new Date(Date.now() - ago * 3600_000).toISOString();
  const feed = (ago: number, mins: number, side: string) =>
    T('breastfeeds').push({ id: uuid(), household_id: hid, child_id: childId, side, started_at: h(ago), ended_at: new Date(Date.parse(h(ago)) + mins * 60_000).toISOString(), note: null, created_by: userId, created_at: h(ago) });
  feed(1, 12, 'left'); feed(6, 15, 'right'); feed(26, 10, 'both'); feed(30, 14, 'left');

  // ---------------------------------------------------------------- 120 DME · 123 refus (sans jugement)
  const taste = (ago: number, key: string, name: string, status: string, extra: Row = {}) =>
    T('food_tastings').push({ id: uuid(), household_id: hid, child_id: childId, food_key: key, food_name: name, tasted_on: addDays(today, -ago), status, reaction: false, reaction_note: null, texture: 'pieces', preparation: null, note: null, created_by: userId, created_at: now, method: null, grasp: null, outcome: null, ...extra });
  taste(6, 'broccoli', 'Brocoli', 'refused', { method: 'blw', grasp: 'not_taken', outcome: 'refused' });
  taste(3, 'broccoli', 'Brocoli', 'tasted', { method: 'blw', grasp: 'palm', outcome: 'tasted' });
  taste(5, 'zucchini', 'Courgette', 'refused', { outcome: 'refused', texture: 'mashed' });
  taste(2, 'zucchini', 'Courgette', 'refused', { method: 'blw', grasp: 'fingers', outcome: 'refused' });
  for (const [key, name, status] of [['broccoli', 'Brocoli', 'tasted'], ['zucchini', 'Courgette', 'refused']] as const) {
    if (!T('food_introductions').some((f) => f.child_id === childId && f.food_key === key)) {
      T('food_introductions').push({ id: uuid(), household_id: hid, child_id: childId, food_key: key, food_name: name, status, first_tried_on: addDays(today, -6), texture: 'pieces', preparation: null, note: null, reaction: false, reaction_note: null, favorite: false, created_at: now, updated_at: now });
    }
  }
  T('meals').push({ id: uuid(), household_id: hid, child_id: childId, at: h(4), description: 'Déjeuner', foods: ['Carotte', 'Courgette'], refused_foods: ['Courgette'], texture: 'pieces', reaction_note: null, created_by: userId, created_at: h(4) });
}
