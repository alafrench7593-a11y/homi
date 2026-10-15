/** Famille d'exemple (mode démonstration) : grossesse de jumeaux + deux enfants. */
import { uuid } from '../uuid';
import { addDays, todayISO } from '../domain/dates';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function buildSampleFamily(userId: string, T: (t: string) => Row[], createHousehold: (a: Row) => string) {
  const now = Date.now();
  const iso = (hoursAgo: number) => new Date(now - hoursAgo * 3600_000).toISOString();
  const today = todayISO();
  const hid = T('household_members').find((m) => m.user_id === userId)?.household_id ?? createHousehold({ p_name: 'Notre famille' });

  const profile = T('profiles').find((p) => p.id === userId);
  if (profile) Object.assign(profile, { display_name: profile.display_name ?? 'Camille', journeys: ['pregnant', 'child', 'family'], onboarding_completed: true });

  const pid = uuid();
  T('pregnancies').push({ id: pid, household_id: hid, carrier_user_id: userId, due_date: addDays(today, 105), lmp_date: null, due_date_source: 'professional', multiplicity: 'twins', status: 'active', reminders_wanted: [], topics: [], created_at: iso(2000) });
  T('expected_babies').push(
    { id: uuid(), pregnancy_id: pid, household_id: hid, position: 1, nickname: 'Petite Lune', notes: null },
    { id: uuid(), pregnancy_id: pid, household_id: hid, position: 2, nickname: 'Petit Soleil', notes: null },
  );

  const lina = uuid();
  const noe = uuid();
  T('children').push(
    { id: lina, household_id: hid, first_name: 'Lina', birth_date: addDays(today, -400), sex: 'female', photo_path: null, from_pregnancy_id: null, multiple_group: null, enabled_tracking: ['bottle', 'diaper', 'sleep', 'meal', 'growth'], allergies_declared: [], habits: null, archived: false, created_at: iso(5000) },
    { id: noe, household_id: hid, first_name: 'Noé', birth_date: addDays(today, -2200), sex: null, photo_path: null, from_pregnancy_id: null, multiple_group: null, enabled_tracking: ['sleep', 'meal', 'growth'], allergies_declared: ['arachide'], habits: null, archived: false, created_at: iso(5000) },
  );
  const log = (table: string, r: Row) => T(table).push({ id: uuid(), household_id: hid, created_by: userId, created_at: new Date().toISOString(), note: null, ...r });
  log('bottles', { child_id: lina, at: iso(3), prepared_ml: 210, consumed_ml: 180, milk_type: 'Lait 2e âge' });
  log('bottles', { child_id: lina, at: iso(27), prepared_ml: 210, consumed_ml: 200, milk_type: 'Lait 2e âge' });
  log('diapers', { child_id: lina, at: iso(2), wet: true, stool: false });
  log('diapers', { child_id: lina, at: iso(6), wet: true, stool: true });
  log('sleeps', { child_id: lina, started_at: iso(14), ended_at: iso(4), wakeups: 1 });
  log('sleeps', { child_id: lina, started_at: iso(8), ended_at: iso(6.5), wakeups: 0 });
  log('meals', { child_id: lina, at: iso(5), description: 'Purée carotte-patate douce', foods: ['Carotte', 'Patate douce'], texture: 'mashed', reaction_note: null });
  for (const [days, kg, cm] of [[300, 7.4, 66], [200, 8.6, 71.5], [60, 9.9, 77]] as const) {
    log('child_measurements', { child_id: lina, measured_on: addDays(today, -days), weight_kg: kg, height_cm: cm, head_cm: null, source: 'professional' });
  }
  T('appointments').push({ id: uuid(), household_id: hid, pregnancy_id: pid, child_id: null, for_parent: false, kind: 'ultrasound', title: 'Échographie du 3e trimestre', starts_at: new Date(now + 9 * 86400_000).toISOString(), location_label: 'Maternité', notes: null, questions: ['Comment se positionnent les bébés ?'], created_at: iso(10) });
  T('appointments').push({ id: uuid(), household_id: hid, pregnancy_id: null, child_id: lina, for_parent: false, kind: 'pediatric', title: 'Visite chez la pédiatre', starts_at: new Date(now + 20 * 86400_000).toISOString(), location_label: null, notes: null, questions: [], created_at: iso(10) });

  const list = uuid();
  T('checklists').push({ id: list, household_id: hid, pregnancy_id: pid, kind: 'maternity_bag', title: 'Valise de maternité', created_at: iso(100) });
  ['Carte Vitale et pièce d’identité', 'Dossier de suivi de grossesse', 'Bodies et pyjamas (x2 bébés)', 'Deux sièges auto adaptés'].forEach((label, i) =>
    T('checklist_items').push({ id: uuid(), checklist_id: list, household_id: hid, label, done: i === 0, done_by: i === 0 ? userId : null, position: i, note: null, created_at: iso(100) }),
  );
  [[60, 64.2], [30, 66.0], [7, 67.1]].forEach(([d, w]) =>
    T('maternal_weights').push({ id: uuid(), user_id: userId, pregnancy_id: pid, measured_on: addDays(today, -d), weight_kg: w, note: null, professional_note: null, created_at: iso(d * 24) }),
  );
  if (!T('community_profiles').some((p) => p.user_id === userId)) {
    T('community_profiles').push({ user_id: userId, pseudonym: 'CamilleEtLesJumeaux', area_label: 'Île-de-France', suspended_until: null, created_at: iso(1) });
  }
}
