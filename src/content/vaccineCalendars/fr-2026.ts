/**
 * Calendrier des vaccinations — France, version 2026 (base de règles versionnée).
 * Chaque règle : vaccin, âge indicatif, dose, nombre de doses de la série, écart avec la dose précédente (déduit des
 * âges du calendrier officiel), population concernée, obligatoire ou recommandé, source officielle.
 * Pour l'année suivante : ajouter un fichier (ex. fr-2027.ts) ou publier la version dans la table vaccine_calendars
 * (administration) ; l'application choisit automatiquement la version en vigueur. Aucune règle n'est codée dans les écrans.
 */
import type { VaccineCalendar, VaccineSource, VaccineRule } from '@/lib/domain/vaccineRules';
import { localized } from '@/i18n/localized';
import { LABEL_ES, RULES_TEXT_ES, SITUATIONAL_ES, SOURCE_LABELS_ES } from './fr-2026.es';
import { LABEL_DE, RULES_TEXT_DE, SITUATIONAL_DE, SOURCE_LABELS_DE } from './fr-2026.de';
import { LABEL_IT, RULES_TEXT_IT, SITUATIONAL_IT, SOURCE_LABELS_IT } from './fr-2026.it';

const SOURCES: Record<string, VaccineSource> = {
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

const RULES: VaccineRule[] = [
  { key: 'hexa_1', group: 'hexa', months: 2, label: 'Diphtérie, tétanos, coqueluche, poliomyélite, Haemophilus influenzae b, hépatite B', dose: '1re injection', mandatoryFrom: '2018-01-01', population: 'Tous les nourrissons (obligatoire pour les enfants nés depuis le 1er janvier 2018)', source: 'calendrier2026' },
  { key: 'pneumo_1', group: 'pneumo', months: 2, label: 'Pneumocoque', dose: '1re injection', mandatoryFrom: '2018-01-01', population: 'Tous les nourrissons (obligatoire pour les enfants nés depuis le 1er janvier 2018)', source: 'calendrier2026' },
  { key: 'rota_1', group: 'rota', months: 2, label: 'Rotavirus (vaccin buvable)', dose: '1re dose', note: 'Recommandé. Deux ou trois doses selon le vaccin, à terminer avant 6 ou 8 mois.', population: 'Tous les nourrissons (recommandé)', source: 'has_rotavirus' },
  { key: 'menb_1', group: 'menb', months: 3, label: 'Méningocoque B', dose: '1re injection', mandatoryFrom: '2023-01-01', population: 'Tous les nourrissons (obligatoire pour les enfants nés depuis le 1er janvier 2023)', source: 'calendrier2026' },
  { key: 'rota_2', group: 'rota', months: 3, label: 'Rotavirus (vaccin buvable)', dose: '2e dose', population: 'Tous les nourrissons (recommandé)', source: 'has_rotavirus' },
  { key: 'hexa_2', group: 'hexa', months: 4, label: 'Diphtérie, tétanos, coqueluche, poliomyélite, Haemophilus influenzae b, hépatite B', dose: '2e injection', mandatoryFrom: '2018-01-01', population: 'Tous les nourrissons (obligatoire pour les enfants nés depuis le 1er janvier 2018)', source: 'calendrier2026' },
  { key: 'pneumo_2', group: 'pneumo', months: 4, label: 'Pneumocoque', dose: '2e injection', mandatoryFrom: '2018-01-01', population: 'Tous les nourrissons (obligatoire pour les enfants nés depuis le 1er janvier 2018)', source: 'calendrier2026' },
  { key: 'rota_3', group: 'rota', months: 4, label: 'Rotavirus (vaccin buvable)', dose: '3e dose, uniquement avec RotaTeq (Rotarix : 2 doses)', population: 'Tous les nourrissons (recommandé)', source: 'has_rotavirus' },
  { key: 'menb_2', group: 'menb', months: 5, label: 'Méningocoque B', dose: '2e injection', mandatoryFrom: '2023-01-01', population: 'Tous les nourrissons (obligatoire pour les enfants nés depuis le 1er janvier 2023)', source: 'calendrier2026' },
  { key: 'menacwy_1', group: 'menacwy', months: 6, label: 'Méningocoques A, C, W, Y', dose: '1re injection', mandatoryFrom: '2023-01-01', population: 'Tous les nourrissons (obligatoire pour les enfants nés depuis le 1er janvier 2023)', source: 'calendrier2026' },
  { key: 'hexa_3', group: 'hexa', months: 11, label: 'Diphtérie, tétanos, coqueluche, poliomyélite, Haemophilus influenzae b, hépatite B', dose: 'Rappel', mandatoryFrom: '2018-01-01', population: 'Tous les nourrissons (obligatoire pour les enfants nés depuis le 1er janvier 2018)', source: 'calendrier2026' },
  { key: 'pneumo_3', group: 'pneumo', months: 11, label: 'Pneumocoque', dose: 'Rappel', mandatoryFrom: '2018-01-01', population: 'Tous les nourrissons (obligatoire pour les enfants nés depuis le 1er janvier 2018)', source: 'calendrier2026' },
  { key: 'ror_1', group: 'ror', months: 12, label: 'Rougeole, oreillons, rubéole', dose: '1re injection', mandatoryFrom: '2018-01-01', population: 'Tous les nourrissons (obligatoire pour les enfants nés depuis le 1er janvier 2018)', source: 'calendrier2026' },
  { key: 'menb_3', group: 'menb', months: 12, label: 'Méningocoque B', dose: 'Rappel', mandatoryFrom: '2023-01-01', population: 'Tous les nourrissons (obligatoire pour les enfants nés depuis le 1er janvier 2023)', source: 'calendrier2026' },
  { key: 'menacwy_2', group: 'menacwy', months: 12, label: 'Méningocoques A, C, W, Y', dose: 'Rappel', mandatoryFrom: '2023-01-01', population: 'Tous les nourrissons (obligatoire pour les enfants nés depuis le 1er janvier 2023)', source: 'calendrier2026' },
  { key: 'ror_2', group: 'ror', months: 16, toMonths: 18, label: 'Rougeole, oreillons, rubéole', dose: '2e injection', mandatoryFrom: '2018-01-01', population: 'Tous les nourrissons (obligatoire pour les enfants nés depuis le 1er janvier 2018)', source: 'calendrier2026' },
  { key: 'dtcap_6', group: 'dtcap', months: 72, label: 'Diphtérie, tétanos, coqueluche, poliomyélite', dose: 'Rappel de 6 ans', population: 'Tous les enfants', source: 'calendrier2026' },
  { key: 'dtcap_11', group: 'dtcap_ado', months: 132, toMonths: 156, label: 'Diphtérie, tétanos, coqueluche, poliomyélite (doses réduites)', dose: 'Rappel de 11–13 ans', population: 'Tous les adolescents', source: 'calendrier2026' },
  { key: 'hpv_1', group: 'hpv', months: 132, toMonths: 168, label: 'Papillomavirus (HPV)', dose: '2 injections espacées de 6 à 13 mois (11–14 ans)', population: 'Tous les adolescents', source: 'calendrier2026' },
  { key: 'menacwy_ado', group: 'menacwy_ado', months: 132, toMonths: 168, label: 'Méningocoques A, C, W, Y', dose: '1 injection (11–14 ans)', population: 'Tous les adolescents', source: 'calendrier2026' },
];

const FR_2026_FR: VaccineCalendar = {
  country: 'FR',
  version: '2026',
  label: 'Calendrier des vaccinations 2026',
  effectiveFrom: '2026-04-02',
  updated: '2026-07-01',
  checked: '2026-10-20',
  sourceUrl: 'https://www.infovac.fr/~documents/public/1-calendrier-vaccinal-2026-officiel/?layout=file',
  sources: SOURCES,
  rules: RULES,
  situational: [
  'BCG (tuberculose) : seulement pour les enfants exposés à un risque élevé, à partir d’un mois.',
  'Hépatite B à la naissance : si la mère est porteuse du virus (ou naissance en Guyane ou à Mayotte).',
  'Bronchiolite (VRS) : un anticorps (nirsévimab) peut être proposé avant la sortie de la maternité pendant la saison, sauf si la mère a été vaccinée pendant la grossesse.',
  'Grippe : peut être proposée chaque année aux enfants de 2 à 17 ans, et dès 6 mois en cas de facteurs de risque.',
  'Rattrapage méningocoques B et ACWY entre 2 et 4 ans révolus, même après un vaccin contre le méningocoque C ; obligatoire pour les enfants nés depuis 2023 non vaccinés avant 2 ans.',
],
};

// ─── English version (same keys, same order, same sources and dates; only the displayed texts differ) ───

const HEXA_EN = 'Diphtheria, tetanus, whooping cough, polio, Haemophilus influenzae b, hepatitis B';
const POP_ALL_2018 = 'All infants (compulsory for children born on or after 1 January 2018)';
const POP_ALL_2023 = 'All infants (compulsory for children born on or after 1 January 2023)';
const ROTA_EN = 'Rotavirus (oral vaccine)';
const POP_ROTA = 'All infants (recommended)';
const MENACWY_EN = 'Meningococcus A, C, W, Y';
const MMR_EN = 'Measles, mumps, rubella';

const RULES_TEXT_EN: Record<string, Partial<VaccineRule>> = {
  hexa_1: { label: HEXA_EN, dose: '1st injection', population: POP_ALL_2018 },
  pneumo_1: { label: 'Pneumococcus', dose: '1st injection', population: POP_ALL_2018 },
  rota_1: { label: ROTA_EN, dose: '1st dose', note: 'Recommended. Two or three doses depending on the vaccine, to be finished before 6 or 8 months.', population: POP_ROTA },
  menb_1: { label: 'Meningococcus B', dose: '1st injection', population: POP_ALL_2023 },
  rota_2: { label: ROTA_EN, dose: '2nd dose', population: POP_ROTA },
  hexa_2: { label: HEXA_EN, dose: '2nd injection', population: POP_ALL_2018 },
  pneumo_2: { label: 'Pneumococcus', dose: '2nd injection', population: POP_ALL_2018 },
  rota_3: { label: ROTA_EN, dose: '3rd dose, only with RotaTeq (Rotarix: 2 doses)', population: POP_ROTA },
  menb_2: { label: 'Meningococcus B', dose: '2nd injection', population: POP_ALL_2023 },
  menacwy_1: { label: MENACWY_EN, dose: '1st injection', population: POP_ALL_2023 },
  hexa_3: { label: HEXA_EN, dose: 'Booster', population: POP_ALL_2018 },
  pneumo_3: { label: 'Pneumococcus', dose: 'Booster', population: POP_ALL_2018 },
  ror_1: { label: MMR_EN, dose: '1st injection', population: POP_ALL_2018 },
  menb_3: { label: 'Meningococcus B', dose: 'Booster', population: POP_ALL_2023 },
  menacwy_2: { label: MENACWY_EN, dose: 'Booster', population: POP_ALL_2023 },
  ror_2: { label: MMR_EN, dose: '2nd injection', population: POP_ALL_2018 },
  dtcap_6: { label: 'Diphtheria, tetanus, whooping cough, polio', dose: '6-year booster', population: 'All children' },
  dtcap_11: { label: 'Diphtheria, tetanus, whooping cough, polio (reduced doses)', dose: '11–13-year booster', population: 'All adolescents' },
  hpv_1: { label: 'Human papillomavirus (HPV)', dose: '2 injections 6 to 13 months apart (ages 11–14)', population: 'All adolescents' },
  menacwy_ado: { label: MENACWY_EN, dose: '1 injection (ages 11–14)', population: 'All adolescents' },
};

const SOURCES_EN: Record<string, VaccineSource> = {
  calendrier2026: { ...SOURCES.calendrier2026, label: 'French Ministry of Health — Vaccination schedule and vaccine recommendations 2026 (official document published by Infovac)' },
  santefr2026: { ...SOURCES.santefr2026, label: 'Santé.fr — The vaccination schedule (updated July 2026)' },
  has_rotavirus: { ...SOURCES.has_rotavirus, label: 'HAS (French National Authority for Health) — Vaccine recommendation against rotavirus infections (12 July 2022), via VIDAL' },
};

const FR_2026_EN: VaccineCalendar = {
  ...FR_2026_FR,
  label: 'Vaccination schedule 2026',
  sources: SOURCES_EN,
  rules: RULES.map((r) => ({ ...r, ...RULES_TEXT_EN[r.key] })),
  situational: [
    'BCG (tuberculosis): only for children at high risk, from one month old.',
    'Hepatitis B at birth: if the mother carries the virus (or birth in French Guiana or Mayotte).',
    'Bronchiolitis (RSV): an antibody (nirsevimab) may be offered before leaving the maternity unit during the season, unless the mother was vaccinated during pregnancy.',
    'Flu: may be offered every year to children aged 2 to 17, and from 6 months old if there are risk factors.',
    'Catch-up for meningococcus B and ACWY between 2 and 4 years old, even after a meningococcus C vaccine; compulsory for children born since 2023 who were not vaccinated before the age of 2.',
  ],
};

// ─── Espagnol, allemand, italien : calendrier FRANÇAIS, seuls les libellés sont traduits (âges, vaccins, sources et dates inchangés) ───

/** Même calendrier, mêmes règles dans le même ordre ; seuls les textes affichés viennent de la langue demandée. */
function translatedCalendar(label: string, rulesText: Record<string, Partial<VaccineRule>>, sourceLabels: Record<string, string>, situational: string[]): VaccineCalendar {
  return {
    ...FR_2026_FR,
    label,
    sources: Object.fromEntries(Object.entries(SOURCES).map(([k, src]) => [k, { ...src, label: sourceLabels[k] ?? src.label }])),
    rules: RULES.map((r) => ({ ...r, ...pickText(rulesText[r.key]) })),
    situational,
  };
}
/** Uniquement les champs de texte (jamais un âge, un groupe, une date ou une source). */
const pickText = (t?: Partial<VaccineRule>): Partial<VaccineRule> => {
  if (!t) return {};
  const out: Partial<VaccineRule> = {};
  if (t.label != null) out.label = t.label;
  if (t.dose != null) out.dose = t.dose;
  if (t.note != null) out.note = t.note;
  if (t.population != null) out.population = t.population;
  return out;
};

const FR_2026_ES: VaccineCalendar = translatedCalendar(LABEL_ES, RULES_TEXT_ES, SOURCE_LABELS_ES, SITUATIONAL_ES);
const FR_2026_DE: VaccineCalendar = translatedCalendar(LABEL_DE, RULES_TEXT_DE, SOURCE_LABELS_DE, SITUATIONAL_DE);
const FR_2026_IT: VaccineCalendar = translatedCalendar(LABEL_IT, RULES_TEXT_IT, SOURCE_LABELS_IT, SITUATIONAL_IT);

export const FR_2026: VaccineCalendar = localized(FR_2026_FR, FR_2026_EN, { es: FR_2026_ES, de: FR_2026_DE, it: FR_2026_IT });

/** Toutes les versions, pour les modules qui en extraient une partie (sources, règles) en gardant la langue dynamique. */
export const FR_2026_VERSIONS = { fr: FR_2026_FR, en: FR_2026_EN, es: FR_2026_ES, de: FR_2026_DE, it: FR_2026_IT };
