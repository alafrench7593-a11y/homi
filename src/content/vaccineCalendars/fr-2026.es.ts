/**
 * Calendrier vaccinal FRANÇAIS 2026 — libellés en espagnol uniquement (mêmes clés, mêmes âges, mêmes vaccins, mêmes
 * sources et dates que fr-2026.ts : seuls les textes affichés changent).
 */
import type { VaccineRule } from '@/lib/domain/vaccineRules';

const HEXA = 'Difteria, tétanos, tos ferina, poliomielitis, Haemophilus influenzae b, hepatitis B';
const POP_ALL_2018 = 'Todos los lactantes (obligatoria para los niños nacidos desde el 1 de enero de 2018)';
const POP_ALL_2023 = 'Todos los lactantes (obligatoria para los niños nacidos desde el 1 de enero de 2023)';
const ROTA = 'Rotavirus (vacuna oral)';
const POP_ROTA = 'Todos los lactantes (recomendada)';
const MENACWY = 'Meningococos A, C, W, Y';
const MMR = 'Sarampión, paperas, rubeola';
const PNEUMO = 'Neumococo';
const MENB = 'Meningococo B';

export const LABEL_ES = 'Calendario de vacunación 2026';

export const RULES_TEXT_ES: Record<string, Partial<VaccineRule>> = {
  hexa_1: { label: HEXA, dose: '1.ª inyección', population: POP_ALL_2018 },
  pneumo_1: { label: PNEUMO, dose: '1.ª inyección', population: POP_ALL_2018 },
  rota_1: { label: ROTA, dose: '1.ª dosis', note: 'Recomendada. Dos o tres dosis según la vacuna, que deben completarse antes de los 6 u 8 meses.', population: POP_ROTA },
  menb_1: { label: MENB, dose: '1.ª inyección', population: POP_ALL_2023 },
  rota_2: { label: ROTA, dose: '2.ª dosis', population: POP_ROTA },
  hexa_2: { label: HEXA, dose: '2.ª inyección', population: POP_ALL_2018 },
  pneumo_2: { label: PNEUMO, dose: '2.ª inyección', population: POP_ALL_2018 },
  rota_3: { label: ROTA, dose: '3.ª dosis, solo con RotaTeq (Rotarix: 2 dosis)', population: POP_ROTA },
  menb_2: { label: MENB, dose: '2.ª inyección', population: POP_ALL_2023 },
  menacwy_1: { label: MENACWY, dose: '1.ª inyección', population: POP_ALL_2023 },
  hexa_3: { label: HEXA, dose: 'Refuerzo', population: POP_ALL_2018 },
  pneumo_3: { label: PNEUMO, dose: 'Refuerzo', population: POP_ALL_2018 },
  ror_1: { label: MMR, dose: '1.ª inyección', population: POP_ALL_2018 },
  menb_3: { label: MENB, dose: 'Refuerzo', population: POP_ALL_2023 },
  menacwy_2: { label: MENACWY, dose: 'Refuerzo', population: POP_ALL_2023 },
  ror_2: { label: MMR, dose: '2.ª inyección', population: POP_ALL_2018 },
  dtcap_6: { label: 'Difteria, tétanos, tos ferina, poliomielitis', dose: 'Refuerzo de los 6 años', population: 'Todos los niños' },
  dtcap_11: { label: 'Difteria, tétanos, tos ferina, poliomielitis (dosis reducidas)', dose: 'Refuerzo de los 11–13 años', population: 'Todos los adolescentes' },
  hpv_1: { label: 'Virus del papiloma humano (VPH)', dose: '2 inyecciones separadas de 6 a 13 meses (11–14 años)', population: 'Todos los adolescentes' },
  menacwy_ado: { label: MENACWY, dose: '1 inyección (11–14 años)', population: 'Todos los adolescentes' },
};

export const SOURCE_LABELS_ES: Record<string, string> = {
  calendrier2026: 'Ministerio francés de Sanidad — Calendario de vacunación y recomendaciones vacunales 2026 (documento oficial difundido por Infovac)',
  santefr2026: 'Santé.fr — El calendario de vacunación (actualización de julio de 2026)',
  has_rotavirus: 'HAS (Alta Autoridad de Salud francesa) — Recomendación vacunal contra las infecciones por rotavirus (12 de julio de 2022), vía VIDAL',
};

export const SITUATIONAL_ES: string[] = [
  'BCG (tuberculosis): solo para los niños expuestos a un riesgo elevado, a partir de un mes.',
  'Hepatitis B al nacer: si la madre es portadora del virus (o nacimiento en la Guayana Francesa o en Mayotte).',
  'Bronquiolitis (VRS): puede proponerse un anticuerpo (nirsevimab) antes de salir de la maternidad durante la temporada, salvo si la madre se vacunó durante el embarazo.',
  'Gripe: puede proponerse cada año a los niños de 2 a 17 años, y desde los 6 meses si hay factores de riesgo.',
  'Vacunación de recuperación contra los meningococos B y ACWY entre los 2 y los 4 años cumplidos, incluso después de una vacuna contra el meningococo C; obligatoria para los niños nacidos desde 2023 no vacunados antes de los 2 años.',
];
