/** Calendario de vacunación (Francia 2026) — textos en español. Mismas claves, mismas edades, mismas fuentes y fechas. */
import type { VaccineTexts } from './vaccines';

const HEXA = 'Difteria, tétanos, tos ferina, poliomielitis, Haemophilus influenzae b, hepatitis B';
const POP_2018 = 'Todos los lactantes (obligatoria para los niños nacidos desde el 1 de enero de 2018)';
const POP_2023 = 'Todos los lactantes (obligatoria para los niños nacidos desde el 1 de enero de 2023)';
const ROTA = 'Rotavirus (vacuna oral)';
const POP_ROTA = 'Todos los lactantes (recomendada)';
const MENACWY = 'Meningococos A, C, W, Y';
const MMR = 'Sarampión, paperas, rubeola';

export const VACCINES_ES: VaccineTexts = {
  label: 'Calendario de vacunación 2026',
  sources: {
    calendrier2026: 'Ministerio de Sanidad francés — Calendario de vacunación y recomendaciones vacunales 2026 (documento oficial difundido por Infovac)',
    santefr2026: 'Santé.fr — El calendario de vacunación (actualización de julio de 2026)',
    has_rotavirus: 'HAS (Alta Autoridad de Salud francesa) — Recomendación vacunal contra las infecciones por rotavirus (12 de julio de 2022), vía VIDAL',
  },
  rules: {
    hexa_1: { label: HEXA, dose: '1.ª inyección', population: POP_2018 },
    pneumo_1: { label: 'Neumococo', dose: '1.ª inyección', population: POP_2018 },
    rota_1: { label: ROTA, dose: '1.ª dosis', note: 'Recomendada. Dos o tres dosis según la vacuna, que deben completarse antes de los 6 u 8 meses.', population: POP_ROTA },
    menb_1: { label: 'Meningococo B', dose: '1.ª inyección', population: POP_2023 },
    rota_2: { label: ROTA, dose: '2.ª dosis', population: POP_ROTA },
    hexa_2: { label: HEXA, dose: '2.ª inyección', population: POP_2018 },
    pneumo_2: { label: 'Neumococo', dose: '2.ª inyección', population: POP_2018 },
    rota_3: { label: ROTA, dose: '3.ª dosis, solo con RotaTeq (Rotarix: 2 dosis)', population: POP_ROTA },
    menb_2: { label: 'Meningococo B', dose: '2.ª inyección', population: POP_2023 },
    menacwy_1: { label: MENACWY, dose: '1.ª inyección', population: POP_2023 },
    hexa_3: { label: HEXA, dose: 'Refuerzo', population: POP_2018 },
    pneumo_3: { label: 'Neumococo', dose: 'Refuerzo', population: POP_2018 },
    ror_1: { label: MMR, dose: '1.ª inyección', population: POP_2018 },
    menb_3: { label: 'Meningococo B', dose: 'Refuerzo', population: POP_2023 },
    menacwy_2: { label: MENACWY, dose: 'Refuerzo', population: POP_2023 },
    ror_2: { label: MMR, dose: '2.ª inyección', population: POP_2018 },
    dtcap_6: { label: 'Difteria, tétanos, tos ferina, poliomielitis', dose: 'Refuerzo de los 6 años', population: 'Todos los niños' },
    dtcap_11: { label: 'Difteria, tétanos, tos ferina, poliomielitis (dosis reducidas)', dose: 'Refuerzo de los 11–13 años', population: 'Todos los adolescentes' },
    hpv_1: { label: 'Virus del papiloma humano (VPH)', dose: '2 inyecciones separadas de 6 a 13 meses (11–14 años)', population: 'Todos los adolescentes' },
    menacwy_ado: { label: MENACWY, dose: '1 inyección (11–14 años)', population: 'Todos los adolescentes' },
  },
  situational: [
    'BCG (tuberculosis): solo para los niños expuestos a un riesgo elevado, a partir de un mes.',
    'Hepatitis B al nacer: si la madre es portadora del virus (o nacimiento en la Guayana Francesa o en Mayotte).',
    'Bronquiolitis (VRS): puede proponerse un anticuerpo (nirsevimab) antes de salir de la maternidad durante la temporada, salvo si la madre se vacunó durante el embarazo.',
    'Gripe: puede proponerse cada año a los niños de 2 a 17 años, y desde los 6 meses en caso de factores de riesgo.',
    'Vacunación de recuperación contra los meningococos B y ACWY entre los 2 y los 4 años cumplidos, incluso después de una vacuna contra el meningococo C; obligatoria para los niños nacidos desde 2023 no vacunados antes de los 2 años.',
  ],
  questions: [
    '¿Qué vacunas están previstas en esta cita?',
    '¿Se pueden poner varias el mismo día?',
    '¿Qué reacciones son habituales después de estas vacunas y cuáles deben hacernos volver a llamar?',
    '¿Hay que darle algo contra la fiebre o el dolor, y en qué dosis?',
    '¿Nuestro hijo o hija está al día según su cartilla de salud?',
    '¿Hay que prever alguna vacunación de recuperación?',
    '¿Nuestra situación (prematuridad, enfermedad, viaje, entorno) cambia algo?',
  ],
};
