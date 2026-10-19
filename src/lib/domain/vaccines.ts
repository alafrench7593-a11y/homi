/**
 * Calendrier des vaccinations de l'enfant (France) — repères officiels, dates INDICATIVES calculées à partir de la date
 * de naissance, à vérifier avec le carnet de santé et le professionnel. L'application ne décide jamais à la place du
 * médecin, ne déclare jamais un enfant « en retard » et n'invente aucune règle : chaque ligne cite sa source.
 *
 * Obligation : les vaccinations du nourrisson prévues avant 2 ans (nés depuis 2018 ; méningocoques B et ACWY : nés depuis 2023) ;
 * les rappels de 6 ans et de 11–13 ans, le HPV et le méningocoque de l'adolescent sont recommandés.
 * Source principale : ministère chargé de la Santé, « Calendrier des vaccinations et recommandations vaccinales 2026 »
 * (version d'avril 2026, actualisée en juillet 2026). Rotavirus : HAS, recommandation du 12 juillet 2022, reprise au calendrier.
 */
import { addDays, daysBetween, type ISODate } from './dates';

export interface VaccineSource { key: string; label: string; url: string; published: string; consulted: string }
export const VACCINE_SOURCES: Record<string, VaccineSource> = {
  calendrier2026: {
    key: 'calendrier2026', label: 'Ministère chargé de la Santé — Calendrier des vaccinations et recommandations vaccinales 2026 (document officiel diffusé par Infovac)',
    url: 'https://www.infovac.fr/~documents/public/1-calendrier-vaccinal-2026-officiel/?layout=file', published: '2026-04-02', consulted: '2026-10-20',
  },
  santefr2026: {
    key: 'santefr2026', label: 'Santé.fr — Le calendrier des vaccinations (actualisation de juillet 2026)',
    url: 'https://www.sante.fr/node/1134620', published: '2026-08-26', consulted: '2026-10-20',
  },
  has_rotavirus: {
    key: 'has_rotavirus', label: 'HAS — Recommandation vaccinale contre les infections à rotavirus (12 juillet 2022), via VIDAL',
    url: 'https://www.vidal.fr/actualites/29613-gastro-enterites-a-rotavirus-la-has-recommande-la-vaccination-des-nourrissons-par-rotarix-ou-rotateq.html', published: '2022-07-12', consulted: '2026-10-20',
  },
};
/** Date de la version du calendrier utilisée (affichée à l'écran). */
export const CALENDAR_VERSION = { label: 'Calendrier des vaccinations 2026', updated: '2026-07-01', checked: '2026-10-20' };

export type VaccineStatus = 'mandatory' | 'recommended';
export interface VaccineDose {
  /** Clé stable d'une dose (enregistrée avec le vaccin noté par le parent). */
  key: string;
  /** Groupe (même maladie / même vaccin). */
  group: 'hexa' | 'pneumo' | 'rota' | 'menb' | 'menacwy' | 'ror' | 'dtcap' | 'dtcap_ado' | 'hpv' | 'menacwy_ado';
  /** Âge indicatif en mois (ou âge minimal d'une fenêtre). */
  months: number;
  /** Fin de la fenêtre indicative en mois (ex. 16–18 mois, 11–13 ans). */
  toMonths?: number;
  label: string;
  dose: string;
  /** Obligatoire selon l'année de naissance (sinon recommandé). */
  mandatoryFrom?: string;
  note?: string;
  source: keyof typeof VACCINE_SOURCES;
}

/** Repères du calendrier 2026 pour un enfant sans situation particulière. */
export const VACCINE_DOSES: VaccineDose[] = [
  { key: 'hexa_1', group: 'hexa', months: 2, label: 'Diphtérie, tétanos, coqueluche, poliomyélite, Haemophilus influenzae b, hépatite B', dose: '1re injection', mandatoryFrom: '2018-01-01', source: 'calendrier2026' },
  { key: 'pneumo_1', group: 'pneumo', months: 2, label: 'Pneumocoque', dose: '1re injection', mandatoryFrom: '2018-01-01', source: 'calendrier2026' },
  { key: 'rota_1', group: 'rota', months: 2, label: 'Rotavirus (vaccin buvable)', dose: '1re dose', note: 'Recommandé. Deux ou trois doses selon le vaccin, à terminer avant 6 ou 8 mois.', source: 'has_rotavirus' },
  { key: 'menb_1', group: 'menb', months: 3, label: 'Méningocoque B', dose: '1re injection', mandatoryFrom: '2023-01-01', source: 'calendrier2026' },
  { key: 'rota_2', group: 'rota', months: 3, label: 'Rotavirus (vaccin buvable)', dose: '2e dose', source: 'has_rotavirus' },
  { key: 'hexa_2', group: 'hexa', months: 4, label: 'Diphtérie, tétanos, coqueluche, poliomyélite, Haemophilus influenzae b, hépatite B', dose: '2e injection', mandatoryFrom: '2018-01-01', source: 'calendrier2026' },
  { key: 'pneumo_2', group: 'pneumo', months: 4, label: 'Pneumocoque', dose: '2e injection', mandatoryFrom: '2018-01-01', source: 'calendrier2026' },
  { key: 'rota_3', group: 'rota', months: 4, label: 'Rotavirus (vaccin buvable)', dose: '3e dose, uniquement avec RotaTeq (Rotarix : 2 doses)', source: 'has_rotavirus' },
  { key: 'menb_2', group: 'menb', months: 5, label: 'Méningocoque B', dose: '2e injection', mandatoryFrom: '2023-01-01', source: 'calendrier2026' },
  { key: 'menacwy_1', group: 'menacwy', months: 6, label: 'Méningocoques A, C, W, Y', dose: '1re injection', mandatoryFrom: '2023-01-01', source: 'calendrier2026' },
  { key: 'hexa_3', group: 'hexa', months: 11, label: 'Diphtérie, tétanos, coqueluche, poliomyélite, Haemophilus influenzae b, hépatite B', dose: 'Rappel', mandatoryFrom: '2018-01-01', source: 'calendrier2026' },
  { key: 'pneumo_3', group: 'pneumo', months: 11, label: 'Pneumocoque', dose: 'Rappel', mandatoryFrom: '2018-01-01', source: 'calendrier2026' },
  { key: 'ror_1', group: 'ror', months: 12, label: 'Rougeole, oreillons, rubéole', dose: '1re injection', mandatoryFrom: '2018-01-01', source: 'calendrier2026' },
  { key: 'menb_3', group: 'menb', months: 12, label: 'Méningocoque B', dose: 'Rappel', mandatoryFrom: '2023-01-01', source: 'calendrier2026' },
  { key: 'menacwy_2', group: 'menacwy', months: 12, label: 'Méningocoques A, C, W, Y', dose: 'Rappel', mandatoryFrom: '2023-01-01', source: 'calendrier2026' },
  { key: 'ror_2', group: 'ror', months: 16, toMonths: 18, label: 'Rougeole, oreillons, rubéole', dose: '2e injection', mandatoryFrom: '2018-01-01', source: 'calendrier2026' },
  { key: 'dtcap_6', group: 'dtcap', months: 72, label: 'Diphtérie, tétanos, coqueluche, poliomyélite', dose: 'Rappel de 6 ans', source: 'calendrier2026' },
  { key: 'dtcap_11', group: 'dtcap_ado', months: 132, toMonths: 156, label: 'Diphtérie, tétanos, coqueluche, poliomyélite (doses réduites)', dose: 'Rappel de 11–13 ans', source: 'calendrier2026' },
  { key: 'hpv_1', group: 'hpv', months: 132, toMonths: 168, label: 'Papillomavirus (HPV)', dose: '2 injections espacées de 6 à 13 mois (11–14 ans)', source: 'calendrier2026' },
  { key: 'menacwy_ado', group: 'menacwy_ado', months: 132, toMonths: 168, label: 'Méningocoques A, C, W, Y', dose: '1 injection (11–14 ans)', source: 'calendrier2026' },
];

/** Vaccinations qui dépendent d'une situation particulière : à voir avec le professionnel (jamais calculées). */
export const SITUATIONAL = [
  'BCG (tuberculose) : seulement pour les enfants exposés à un risque élevé, à partir d’un mois.',
  'Hépatite B à la naissance : si la mère est porteuse du virus (ou naissance en Guyane ou à Mayotte).',
  'Bronchiolite (VRS) : un anticorps (nirsévimab) peut être proposé avant la sortie de la maternité pendant la saison, sauf si la mère a été vaccinée pendant la grossesse.',
  'Grippe : peut être proposée chaque année aux enfants de 2 à 17 ans, et dès 6 mois en cas de facteurs de risque.',
  'Rattrapage méningocoques B et ACWY entre 2 et 4 ans révolus, même après un vaccin contre le méningocoque C ; obligatoire pour les enfants nés depuis 2023 non vaccinés avant 2 ans.',
];

/** Ajoute des mois à une date ISO (fin de mois gérée : 31 janvier + 1 mois → 28/29 février). */
export function addMonthsISO(iso: ISODate, months: number): ISODate {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return target.toISOString().slice(0, 10);
}

export type DoseState = 'done' | 'planned' | 'upcoming' | 'due' | 'later' | 'check';
export interface ScheduledDose extends VaccineDose {
  /** Date indicative (début de la fenêtre). */
  date: ISODate;
  dateTo?: ISODate;
  status: VaccineStatus;
  state: DoseState;
  doneOn?: string | null;
}

/**
 * Échéances indicatives d'un enfant. `done` : clés des doses notées comme faites ; `planned` : clés avec un rendez-vous prévu.
 * États : fait · rendez-vous prévu · bientôt (≤ 45 jours) · à faire maintenant (fenêtre ouverte) · plus tard ·
 * « date indicative passée : à vérifier avec le carnet » (jamais « en retard »).
 */
export function vaccineSchedule(birthDate: ISODate, today: ISODate, done: Record<string, string | null> = {}, planned: string[] = []): ScheduledDose[] {
  return VACCINE_DOSES.map((v) => {
    const date = addMonthsISO(birthDate, v.months);
    const dateTo = v.toMonths ? addMonthsISO(birthDate, v.toMonths) : undefined;
    const status: VaccineStatus = v.mandatoryFrom && birthDate >= v.mandatoryFrom ? 'mandatory' : 'recommended';
    const end = dateTo ?? addDays(date, 30);
    let state: DoseState;
    if (v.key in done) state = 'done';
    else if (planned.includes(v.key)) state = 'planned';
    else if (today < date) state = daysBetween(today, date) <= 45 ? 'upcoming' : 'later';
    else if (today <= end) state = 'due';
    else state = 'check';
    return { ...v, date, ...(dateTo ? { dateTo } : {}), status, state, doneOn: done[v.key] ?? null };
  });
}

/** Regroupe par âge (« 2 mois », « 16 à 18 mois »…) dans l'ordre du calendrier. */
export function byVisit(list: ScheduledDose[]): { months: number; toMonths?: number; date: ISODate; doses: ScheduledDose[] }[] {
  const out: { months: number; toMonths?: number; date: ISODate; doses: ScheduledDose[] }[] = [];
  for (const d of list) {
    const g = out.find((x) => x.months === d.months && x.toMonths === d.toMonths);
    if (g) g.doses.push(d); else out.push({ months: d.months, toMonths: d.toMonths, date: d.date, doses: [d] });
  }
  return out;
}

/** Prochaines échéances (non faites), la plus proche d'abord. */
export function nextDoses(list: ScheduledDose[], n = 3): ScheduledDose[] {
  return list.filter((d) => d.state === 'upcoming' || d.state === 'due' || d.state === 'planned').sort((a, b) => a.date.localeCompare(b.date)).slice(0, n);
}

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
