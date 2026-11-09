/**
 * Calendrier des vaccinations de l'enfant — dates INDICATIVES calculées à partir de la date de naissance et des doses
 * notées, à vérifier avec le carnet de santé et le professionnel. L'application ne décide jamais à la place du
 * médecin, ne déclare jamais un enfant « en retard » et n'invente aucune règle : chaque ligne cite sa source.
 * Les règles vivent dans une base versionnée (src/content/vaccineCalendars, table vaccine_calendars) :
 * ce module garde les noms historiques utilisés par les écrans et les tests.
 */
import { FR_2026, FR_2026_VERSIONS as V } from '@/content/vaccineCalendars/fr-2026';
import { localized, type MoreLangs } from '@/i18n/localized';
import { VACCINES_ES } from './vaccines.es';
import { VACCINES_DE } from './vaccines.de';
import { VACCINES_IT } from './vaccines.it';
import { addMonthsISO, byVisit, nextDoses, scheduleFor, type DoseState, type ScheduledDose, type VaccineCalendar, type VaccineRule, type VaccineSource, type VaccineStatus } from './vaccineRules';
import type { ISODate } from './dates';

/** Calendriers intégrés à l'application (repli hors ligne), du plus ancien au plus récent. */
export const BUNDLED_CALENDARS: VaccineCalendar[] = [FR_2026];
export const DEFAULT_CALENDAR = FR_2026;

/** Textes affichés du calendrier en es / de / it (mêmes clés, âges, sources et dates que le français). */
export interface VaccineTexts {
  label: string;
  sources: Record<string, string>;
  rules: Record<string, Partial<Pick<VaccineRule, 'label' | 'dose' | 'population' | 'note'>>>;
  situational: string[];
  questions: string[];
}
type CalendarLang = 'es' | 'de' | 'it';
/** Si le fichier du calendrier fournit un jour sa propre version es/de/it, elle est prioritaire. */
const VX = V as typeof V & MoreLangs<VaccineCalendar>;
const TEXTS: Record<CalendarLang, VaccineTexts> = { es: VACCINES_ES, de: VACCINES_DE, it: VACCINES_IT };
const LANGS: CalendarLang[] = ['es', 'de', 'it'];
const perLang = <T,>(f: (cal: VaccineCalendar | undefined, t: VaccineTexts) => T): MoreLangs<T> =>
  Object.fromEntries(LANGS.map((l) => [l, f(VX[l], TEXTS[l])])) as MoreLangs<T>;
const sourcesFor = (t: VaccineTexts): Record<string, VaccineSource> =>
  Object.fromEntries(Object.entries(V.fr.sources).map(([k, src]) => [k, { ...src, label: t.sources[k] ?? src.label }]));
const rulesFor = (t: VaccineTexts): VaccineRule[] => V.fr.rules.map((r) => ({ ...r, ...t.rules[r.key] }));

export const VACCINE_SOURCES: Record<string, VaccineSource> = localized(V.fr.sources, V.en.sources, perLang((c, t) => c?.sources ?? sourcesFor(t)));
export const CALENDAR_VERSION = localized(
  { label: V.fr.label, updated: V.fr.updated, checked: V.fr.checked },
  { label: V.en.label, updated: V.en.updated, checked: V.en.checked },
  perLang((c, t) => ({ label: c?.label ?? t.label, updated: V.fr.updated, checked: V.fr.checked })),
);
export type VaccineDose = VaccineRule;
export const VACCINE_DOSES: VaccineDose[] = localized(V.fr.rules, V.en.rules, perLang((c, t) => c?.rules ?? rulesFor(t)));
export const SITUATIONAL = localized(V.fr.situational, V.en.situational, perLang((c, t) => c?.situational ?? t.situational));

/** Échéances avec le calendrier français en vigueur (compatibilité). */
export function vaccineSchedule(birthDate: ISODate, today: ISODate, done: Record<string, string | null> = {}, planned: string[] = [], postponed: Record<string, ISODate | null> = {}, cal: VaccineCalendar = FR_2026): ScheduledDose[] {
  return scheduleFor(cal, birthDate, today, { done, planned, postponed });
}

export { addMonthsISO, byVisit, nextDoses };
export type { DoseState, ScheduledDose, VaccineStatus, VaccineCalendar };

/** Questions neutres à préparer pour le rendez-vous (aucun conseil médical). */
const VACCINE_QUESTIONS_FR = [
  'Quels vaccins sont prévus à ce rendez-vous ?',
  'Peut-on en faire plusieurs le même jour ?',
  'Quelles réactions sont habituelles après ces vaccins, et lesquelles doivent nous faire rappeler ?',
  'Faut-il donner quelque chose contre la fièvre ou la douleur, et à quelle dose ?',
  'Notre enfant est-il à jour selon son carnet ?',
  'Y a-t-il un rattrapage à prévoir ?',
  'Notre situation (prématurité, maladie, voyage, entourage) change-t-elle quelque chose ?',
];
const VACCINE_QUESTIONS_EN = [
  'Which vaccines are planned at this appointment?',
  'Can several be given on the same day?',
  'Which reactions are usual after these vaccines, and which should make us call back?',
  'Should we give something for fever or pain, and at what dose?',
  'Is our child up to date according to their health record?',
  'Is any catch-up needed?',
  'Does our situation (prematurity, illness, travel, people around us) change anything?',
];
export const VACCINE_QUESTIONS = localized(VACCINE_QUESTIONS_FR, VACCINE_QUESTIONS_EN, { es: VACCINES_ES.questions, de: VACCINES_DE.questions, it: VACCINES_IT.questions });
