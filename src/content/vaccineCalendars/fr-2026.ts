/**
 * Calendrier des vaccinations — France, version 2026 (base de règles versionnée).
 * Chaque règle : vaccin, âge indicatif, dose, nombre de doses de la série, écart avec la dose précédente (déduit des
 * âges du calendrier officiel), population concernée, obligatoire ou recommandé, source officielle.
 * Pour l'année suivante : ajouter un fichier (ex. fr-2027.ts) ou publier la version dans la table vaccine_calendars
 * (administration) ; l'application choisit automatiquement la version en vigueur. Aucune règle n'est codée dans les écrans.
 */
import type { VaccineCalendar, VaccineSource, VaccineRule } from '@/lib/domain/vaccineRules';

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

export const FR_2026: VaccineCalendar = {
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
