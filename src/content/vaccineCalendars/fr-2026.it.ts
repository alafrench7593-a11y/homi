/**
 * Calendrier vaccinal FRANÇAIS 2026 — libellés en italien uniquement (mêmes clés, mêmes âges, mêmes vaccins, mêmes
 * sources et dates que fr-2026.ts : seuls les textes affichés changent).
 */
import type { VaccineRule } from '@/lib/domain/vaccineRules';

const HEXA = 'Difterite, tetano, pertosse, poliomielite, Haemophilus influenzae b, epatite B';
const POP_ALL_2018 = 'Tutti i lattanti (obbligatoria per i bambini nati dal 1° gennaio 2018)';
const POP_ALL_2023 = 'Tutti i lattanti (obbligatoria per i bambini nati dal 1° gennaio 2023)';
const ROTA = 'Rotavirus (vaccino orale)';
const POP_ROTA = 'Tutti i lattanti (raccomandata)';
const MENACWY = 'Meningococchi A, C, W, Y';
const MMR = 'Morbillo, parotite, rosolia';
const PNEUMO = 'Pneumococco';
const MENB = 'Meningococco B';

export const LABEL_IT = 'Calendario delle vaccinazioni 2026';

export const RULES_TEXT_IT: Record<string, Partial<VaccineRule>> = {
  hexa_1: { label: HEXA, dose: '1ª iniezione', population: POP_ALL_2018 },
  pneumo_1: { label: PNEUMO, dose: '1ª iniezione', population: POP_ALL_2018 },
  rota_1: { label: ROTA, dose: '1ª dose', note: 'Raccomandata. Due o tre dosi a seconda del vaccino, da completare prima dei 6 o 8 mesi.', population: POP_ROTA },
  menb_1: { label: MENB, dose: '1ª iniezione', population: POP_ALL_2023 },
  rota_2: { label: ROTA, dose: '2ª dose', population: POP_ROTA },
  hexa_2: { label: HEXA, dose: '2ª iniezione', population: POP_ALL_2018 },
  pneumo_2: { label: PNEUMO, dose: '2ª iniezione', population: POP_ALL_2018 },
  rota_3: { label: ROTA, dose: '3ª dose, solo con RotaTeq (Rotarix: 2 dosi)', population: POP_ROTA },
  menb_2: { label: MENB, dose: '2ª iniezione', population: POP_ALL_2023 },
  menacwy_1: { label: MENACWY, dose: '1ª iniezione', population: POP_ALL_2023 },
  hexa_3: { label: HEXA, dose: 'Richiamo', population: POP_ALL_2018 },
  pneumo_3: { label: PNEUMO, dose: 'Richiamo', population: POP_ALL_2018 },
  ror_1: { label: MMR, dose: '1ª iniezione', population: POP_ALL_2018 },
  menb_3: { label: MENB, dose: 'Richiamo', population: POP_ALL_2023 },
  menacwy_2: { label: MENACWY, dose: 'Richiamo', population: POP_ALL_2023 },
  ror_2: { label: MMR, dose: '2ª iniezione', population: POP_ALL_2018 },
  dtcap_6: { label: 'Difterite, tetano, pertosse, poliomielite', dose: 'Richiamo dei 6 anni', population: 'Tutti i bambini' },
  dtcap_11: { label: 'Difterite, tetano, pertosse, poliomielite (dosi ridotte)', dose: 'Richiamo degli 11–13 anni', population: 'Tutti gli adolescenti' },
  hpv_1: { label: 'Papillomavirus (HPV)', dose: '2 iniezioni a distanza di 6–13 mesi (11–14 anni)', population: 'Tutti gli adolescenti' },
  menacwy_ado: { label: MENACWY, dose: '1 iniezione (11–14 anni)', population: 'Tutti gli adolescenti' },
};

export const SOURCE_LABELS_IT: Record<string, string> = {
  calendrier2026: 'Ministero francese della Salute — Calendario delle vaccinazioni e raccomandazioni vaccinali 2026 (documento ufficiale diffuso da Infovac)',
  santefr2026: 'Santé.fr — Il calendario delle vaccinazioni (aggiornamento di luglio 2026)',
  has_rotavirus: 'HAS (Alta Autorità per la Salute francese) — Raccomandazione vaccinale contro le infezioni da rotavirus (12 luglio 2022), tramite VIDAL',
};

export const SITUATIONAL_IT: string[] = [
  'BCG (tubercolosi): solo per i bambini esposti a un rischio elevato, a partire da un mese.',
  'Epatite B alla nascita: se la madre è portatrice del virus (o nascita nella Guyana francese o a Mayotte).',
  'Bronchiolite (VRS): durante la stagione può essere proposto un anticorpo (nirsevimab) prima di lasciare il reparto maternità, salvo se la madre è stata vaccinata durante la gravidanza.',
  'Influenza: può essere proposta ogni anno ai bambini dai 2 ai 17 anni, e dai 6 mesi in presenza di fattori di rischio.',
  'Recupero contro i meningococchi B e ACWY tra i 2 e i 4 anni compiuti, anche dopo un vaccino contro il meningococco C; obbligatorio per i bambini nati dal 2023 non vaccinati prima dei 2 anni.',
];
