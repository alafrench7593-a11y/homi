/**
 * Calendrier des vaccinations de l'enfant — dates INDICATIVES calculées à partir de la date de naissance et des doses
 * notées, à vérifier avec le carnet de santé et le professionnel. L'application ne décide jamais à la place du
 * médecin, ne déclare jamais un enfant « en retard » et n'invente aucune règle : chaque ligne cite sa source.
 * Les règles vivent dans une base versionnée (src/content/vaccineCalendars, table vaccine_calendars) :
 * ce module garde les noms historiques utilisés par les écrans et les tests.
 */
import { FR_2026 } from '@/content/vaccineCalendars/fr-2026';
import { addMonthsISO, byVisit, nextDoses, scheduleFor, type DoseState, type ScheduledDose, type VaccineCalendar, type VaccineRule, type VaccineSource, type VaccineStatus } from './vaccineRules';
import type { ISODate } from './dates';

/** Calendriers intégrés à l'application (repli hors ligne), du plus ancien au plus récent. */
export const BUNDLED_CALENDARS: VaccineCalendar[] = [FR_2026];
export const DEFAULT_CALENDAR = FR_2026;

export const VACCINE_SOURCES: Record<string, VaccineSource> = FR_2026.sources;
export const CALENDAR_VERSION = { label: FR_2026.label, updated: FR_2026.updated, checked: FR_2026.checked };
export type VaccineDose = VaccineRule;
export const VACCINE_DOSES: VaccineDose[] = FR_2026.rules;
export const SITUATIONAL = FR_2026.situational;

/** Échéances avec le calendrier français en vigueur (compatibilité). */
export function vaccineSchedule(birthDate: ISODate, today: ISODate, done: Record<string, string | null> = {}, planned: string[] = [], postponed: Record<string, ISODate | null> = {}, cal: VaccineCalendar = FR_2026): ScheduledDose[] {
  return scheduleFor(cal, birthDate, today, { done, planned, postponed });
}

export { addMonthsISO, byVisit, nextDoses };
export type { DoseState, ScheduledDose, VaccineStatus, VaccineCalendar };

/** Questions neutres à préparer pour le rendez-vous (aucun conseil médical). */
export const VACCINE_QUESTIONS = [
  'Quels vaccins sont prévus à ce rendez-vous ?',
  'Peut-on en faire plusieurs le même jour ?',
  'Quelles réactions sont habituelles après ces vaccins, et lesquelles doivent nous faire rappeler ?',
  'Faut-il donner quelque chose contre la fièvre ou la douleur, et à quelle dose ?',
  'Notre enfant est-il à jour selon son carnet ?',
  'Y a-t-il un rattrapage à prévoir ?',
  'Notre situation (prématurité, maladie, voyage, entourage) change-t-elle quelque chose ?',
];
