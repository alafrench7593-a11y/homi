/**
 * Démonstration — « Avant la garde » (mêmes tables que 20261125000100_avant_garde.sql) : trois candidates réalistes
 * (assistante maternelle, crèche, garde à domicile) avec tarifs saisis, quelques réponses d'entretien et points de
 * visite, un planning pour Lina, des absences / congés et deux semaines d'arrivées / départs dans le carnet.
 * Aucune aide n'est calculée : les montants sont ceux qu'un parent aurait saisis.
 */
import { uuid } from '../uuid';
import { addDays, todayISO } from '../domain/dates';
import { INTERVIEW_TEMPLATE, VISIT_TEMPLATE, isoWeekday } from '@/features/childcarePrep/domain';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function seedChildcarePrep({ userId, hid, childId, T }: { userId: string; hid: string; childId: string; T: (t: string) => Row[] }) {
  if (T('childcare_candidates').some((c) => c.household_id === hid)) return;
  const now = new Date().toISOString();
  const today = todayISO();
  const base = { household_id: hid, created_by: userId, created_at: now, updated_at: now };
  const sophie = uuid(); const lutins = uuid(); const julie = uuid();
  T('childcare_candidates').push(
    { ...base, id: sophie, name: 'Sophie Martin', kind: 'assmat', status: 'interview', phone: '06 12 34 56 78', email: null, address: 'Quartier Saint-Michel',
      availability: 'Du lundi au jeudi, 8 h – 18 h', rate_mode: 'hourly', hourly_rate: 4.6, hours_per_week: 36, weeks_per_year: 47, days_per_week: 4,
      monthly_fee: null, meal_fee_per_day: 4.5, upkeep_fee_per_day: 3.8, other_monthly: null, interview_at: `${addDays(today, 3)}T12:00:00.000Z`,
      notes: 'Jardin clos, garde deux autres enfants de 2 et 3 ans.' },
    { ...base, id: lutins, name: 'Crèche Les Lutins', kind: 'creche', status: 'visited', phone: '01 23 45 67 89', email: null, address: 'Rue des Écoles',
      availability: 'Place possible en janvier, 4 jours', rate_mode: 'monthly', hourly_rate: null, hours_per_week: null, weeks_per_year: 47, days_per_week: 4,
      monthly_fee: 395, meal_fee_per_day: null, upkeep_fee_per_day: null, other_monthly: null, interview_at: null, notes: 'Équipe chaleureuse, dortoir un peu bruyant.' },
    { ...base, id: julie, name: 'Julie (garde partagée)', kind: 'shared', status: 'to_contact', phone: null, email: null, address: null,
      availability: 'À confirmer avec la famille Durand', rate_mode: 'hourly', hourly_rate: 12.5, hours_per_week: 18, weeks_per_year: 52, days_per_week: 4,
      monthly_fee: null, meal_fee_per_day: null, upkeep_fee_per_day: null, other_monthly: 20, interview_at: null, notes: null },
  );
  const items: Record<string, string> = {};
  INTERVIEW_TEMPLATE.forEach((k, i) => { const id = uuid(); items[`i:${k}`] = id; T('childcare_prep_items').push({ id, household_id: hid, kind: 'interview', template_key: k, label: null, position: i * 10, archived: false, created_by: userId, created_at: now }); });
  VISIT_TEMPLATE.forEach((k, i) => { const id = uuid(); items[`v:${k}`] = id; T('childcare_prep_items').push({ id, household_id: hid, kind: 'visit', template_key: k, label: null, position: i * 10, archived: false, created_by: userId, created_at: now }); });
  const answer = (candidate_id: string, key: string, a: string | null, checked: boolean) =>
    T('childcare_prep_answers').push({ id: uuid(), household_id: hid, candidate_id, item_id: items[key], answer: a, checked, updated_by: userId, updated_at: now });
  answer(sophie, 'i:experience', '12 ans, agréée depuis 2014.', true);
  answer(sophie, 'i:approval', 'Agréée pour 3 enfants de moins de 3 ans.', true);
  answer(sophie, 'i:holidays', 'Trois semaines en août, une à Noël.', true);
  for (const k of ['welcome', 'hygiene', 'safety', 'outdoor', 'meals', 'adults']) answer(lutins, `v:${k}`, k === 'meals' ? 'Repas livrés, menus affichés à l’entrée.' : null, true);
  // Planning de Lina : lundi à jeudi
  T('childcare_schedules').push({ id: uuid(), household_id: hid, child_id: childId, label: 'Chez Sophie', starts_on: addDays(today, -28), ends_on: null,
    days: [1, 2, 3, 4].map((wd) => ({ wd, start: '08:30', end: '17:30' })), created_by: userId, created_at: now, updated_at: now });
  const abs = (kind: string, from: number, to: number, note: string | null) =>
    T('childcare_absences').push({ id: uuid(), household_id: hid, child_id: childId, kind, from_on: addDays(today, from), to_on: addDays(today, to), caregiver_id: null, note, created_by: userId, created_at: now });
  abs('child', -6, -6, 'Rendez-vous chez le pédiatre');
  abs('caregiver_leave', 12, 16, 'Congés de Sophie');
  abs('closure', 33, 40, 'Fermeture de fin d’année');
  // Arrivées / départs du carnet sur les deux semaines passées (jours prévus, hors absence)
  for (let d = -14; d < 0; d++) {
    const day = addDays(today, d);
    if (isoWeekday(day) > 4 || d === -6) continue;
    const at = (h: number, m: number) => { const [y, mo, dd] = day.split('-').map(Number); return new Date(y, mo - 1, dd, h, m).toISOString(); };
    const shift = (d * 7) % 15;
    T('childcare_events').push(
      { id: uuid(), client_id: uuid(), household_id: hid, child_id: childId, kind: 'arrival', activity_type: null, at: at(8, 25 + Math.abs(shift) % 10), note: null, origin: 'parent', created_by: userId, created_at: now },
      { id: uuid(), client_id: uuid(), household_id: hid, child_id: childId, kind: 'departure', activity_type: null, at: at(17, 20 + Math.abs(shift)), note: null, origin: 'parent', created_by: userId, created_at: now },
    );
  }
}
