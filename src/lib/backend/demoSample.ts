/** Famille d'exemple (mode démonstration) : grossesse de jumeaux + deux enfants. */
import { uuid } from '../uuid';
import { t as tr } from '@/i18n';
import { addDays, todayISO } from '../domain/dates';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function buildSampleFamily(userId: string, T: (t: string) => Row[], createHousehold: (a: Row) => string) {
  const now = Date.now();
  const iso = (hoursAgo: number) => new Date(now - hoursAgo * 3600_000).toISOString();
  const today = todayISO();
  const hid = T('household_members').find((m) => m.user_id === userId)?.household_id ?? createHousehold({ p_name: tr('l2.ds.household') });

  const profile = T('profiles').find((p) => p.id === userId);
  if (profile) Object.assign(profile, { display_name: profile.display_name ?? 'Camille', onboarding_completed: true });

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
  // Parcours de Camille : grossesse de jumeaux en cours + Lina (bébé) + Noé (enfant) ; profiles.journeys en découle
  if (!T('user_journeys').some((j) => j.user_id === userId && j.status === 'active')) {
    const j = (r: Row) => T('user_journeys').push({ id: uuid(), user_id: userId, status: 'active', ended_on: null, end_reason: null, pregnancy_id: null, child_id: null, household_id: hid, created_at: iso(10), ...r });
    j({ type: 'pregnancy', pregnancy_id: pid, started_on: addDays(today, -182) });
    j({ type: 'baby', child_id: lina, started_on: addDays(today, -400) });
    j({ type: 'child', child_id: noe, started_on: addDays(today, -2200) });
  }
  if (profile) profile.journeys = ['pregnant', 'newborn', 'child', 'family'];
  const log = (table: string, r: Row) => T(table).push({ id: uuid(), household_id: hid, created_by: userId, created_at: new Date().toISOString(), note: null, ...r });
  const lastBottle = uuid();
  T('bottles').push({ id: lastBottle, household_id: hid, created_by: userId, created_at: iso(3), note: null, child_id: lina, at: iso(3), prepared_ml: 210, consumed_ml: 180, planned_next_ml: 210, milk_type: 'Lait 2e âge' });
  log('bottles', { child_id: lina, at: iso(6.5), prepared_ml: 210, consumed_ml: 210, planned_next_ml: null, milk_type: 'Lait 2e âge' });
  log('bottles', { child_id: lina, at: iso(27), prepared_ml: 210, consumed_ml: 200, planned_next_ml: null, milk_type: 'Lait 2e âge' });
  // Minuteur biberon de Lina : délai et quantité saisis par le parent (l'app n'en propose aucun)
  if (!T('bottle_timers').some((x) => x.child_id === lina && x.status === 'active')) {
    T('bottle_timers').push({
      id: uuid(), household_id: hid, child_id: lina, bottle_id: lastBottle, last_bottle_at: iso(3), interval_minutes: 210,
      due_at: new Date(now - 3 * 3600_000 + 210 * 60_000).toISOString(), planned_ml: 210, status: 'active', created_by: userId, created_at: iso(3), updated_at: iso(3),
    });
  }
  log('diapers', { child_id: lina, at: iso(2), wet: true, stool: false });
  log('diapers', { child_id: lina, at: iso(6), wet: true, stool: true });
  log('sleeps', { child_id: lina, started_at: iso(14), ended_at: iso(4), wakeups: 1 });
  log('sleeps', { child_id: lina, started_at: iso(8), ended_at: iso(6.5), wakeups: 0 });
  // Quelques journées complètes plus anciennes : de quoi illustrer l'apprentissage du rythme propre à Lina
  const dayAt = (daysAgo: number, h: number, mi: number) => { const d = new Date(now); d.setDate(d.getDate() - daysAgo); d.setHours(h, mi, 0, 0); return d.toISOString(); };
  for (let d = 2; d <= 7; d++) {
    const shift = (d % 3) * 5;
    log('sleeps', { child_id: lina, kind: 'nap', started_at: dayAt(d, 10, 5 + shift), ended_at: dayAt(d, 11, 15 + shift), wakeups: 0, wake_events: [] });
    log('sleeps', { child_id: lina, kind: 'nap', started_at: dayAt(d, 14, 40 - shift), ended_at: dayAt(d, 15, 50), wakeups: 0, wake_events: [] });
    log('sleeps', { child_id: lina, kind: 'night', started_at: dayAt(d, 19, 40 + shift), ended_at: dayAt(d - 1, 7, shift), wakeups: d % 2, wake_events: d % 2 ? [{ at: dayAt(d - 1, 3, 10), minutes: 15, back_at: dayAt(d - 1, 3, 25) }] : [] });
  }
  log('sleep_profiles', { child_id: lina, usual_wake: '07:00', nap_count: 2, usual_bedtime: '19:45', routine_minutes: 20, routine_note: tr('l2.ds.routine'), feeding: 'mixed', difficulties: [], use_corrected: false, gestational_weeks: null, notify: { enabled: false }, updated_at: new Date().toISOString() });
  log('meals', { child_id: lina, at: iso(5), description: tr('l2.ds.meal'), foods: ['Carotte', 'Patate douce'], texture: 'mashed', reaction_note: null });
  for (const [days, kg, cm] of [[300, 7.4, 66], [200, 8.6, 71.5], [60, 9.9, 77]] as const) {
    log('child_measurements', { child_id: lina, measured_on: addDays(today, -days), weight_kg: kg, height_cm: cm, head_cm: null, source: 'professional' });
  }
  T('appointments').push({ id: uuid(), household_id: hid, pregnancy_id: pid, child_id: null, for_parent: false, kind: 'ultrasound', title: tr('l2.ds.apptEcho'), starts_at: (() => { const d = new Date(now + 30 * 86400_000); d.setHours(10, 30, 0, 0); return d.toISOString(); })(), location_label: tr('l2.ds.apptEchoPlace'), notes: null, questions: [tr('l2.ds.apptEchoQ')], calendar_keys: ['echo_3'], document_ids: [], time_set: true, created_at: iso(10) });
  T('appointments').push({ id: uuid(), household_id: hid, pregnancy_id: null, child_id: lina, for_parent: false, kind: 'pediatric', title: tr('l2.ds.apptPedia'), starts_at: new Date(now + 20 * 86400_000).toISOString(), location_label: null, notes: null, questions: [], created_at: iso(10) });

  const list = uuid();
  T('checklists').push({ id: list, household_id: hid, pregnancy_id: pid, kind: 'maternity_bag', title: tr('l2.ds.bag'), created_at: iso(100) });
  [tr('l2.ds.bag1'), tr('l2.ds.bag2'), tr('l2.ds.bag3'), tr('l2.ds.bag4')].forEach((label, i) =>
    T('checklist_items').push({ id: uuid(), checklist_id: list, household_id: hid, label, done: i === 0, done_by: i === 0 ? userId : null, position: i, note: null, created_at: iso(100) }),
  );
  [[60, 64.2], [30, 66.0], [7, 67.1]].forEach(([d, w]) =>
    T('maternal_weights').push({ id: uuid(), user_id: userId, pregnancy_id: pid, measured_on: addDays(today, -d), weight_kg: w, note: null, professional_note: null, created_at: iso(d * 24) }),
  );
  if (!T('community_profiles').some((p) => p.user_id === userId)) {
    T('community_profiles').push({ user_id: userId, pseudonym: 'CamilleEtLesJumeaux', area_label: 'Île-de-France', suspended_until: null, created_at: iso(1) });
  }

  // « Mon sommeil » : quelques nuits récentes de Camille (carnet privé)
  const at = (date: string, hhmm: string, dayShift = 0) => {
    const [y, m, d] = date.split('-').map(Number);
    const [h, mi] = hhmm.split(':').map(Number);
    return new Date(y, m - 1, d + dayShift, h, mi).toISOString();
  };
  const nights: [number, string, string, number, { at: string | null; minutes: number | null }[], { start: string; end: string }[], number, number, number, string | null][] = [
    [5, '22:45', '06:50', 2, [{ at: '01:30', minutes: 20 }, { at: '04:10', minutes: 15 }], [{ start: '14:00', end: '14:40' }], 3, 3, 4, null],
    [4, '23:30', '07:15', 1, [{ at: '03:00', minutes: 30 }], [], 3, 3, 3, tr('l2.ds.sleepNote1')],
    [3, '22:15', '06:30', 3, [{ at: '02:00', minutes: null }], [{ start: '13:30', end: '14:15' }], 2, 4, 3, null],
    [1, '22:30', '07:00', 2, [], [{ start: '15:00', end: '15:30' }], 3, 4, 4, tr('l2.ds.sleepNote2')],
    [0, '23:00', '07:20', 1, [{ at: '04:30', minutes: 10 }], [], 4, 3, 4, null],
  ];
  for (const [ago, bed, wake, count, details, naps, quality, fatigue, mood, note] of nights) {
    const day = addDays(today, -ago);
    if (T('parent_sleep_logs').some((r) => r.user_id === userId && r.log_date === day)) continue;
    const bedtime = at(day, bed, -1);
    const wake_time = at(day, wake);
    const awake = details.reduce((s, d) => s + (d.minutes ?? 0), 0);
    T('parent_sleep_logs').push({
      id: uuid(), user_id: userId, log_date: day, bedtime, wake_time, night_wakings: count, waking_details: details,
      sleep_minutes: Math.round((Date.parse(wake_time) - Date.parse(bedtime)) / 60_000) - awake, duration_edited: false,
      naps, quality, fatigue, mood, note, created_at: iso(ago * 24), updated_at: iso(ago * 24),
    });
  }
}
