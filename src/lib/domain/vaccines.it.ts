/** Calendario vaccinale (Francia 2026) — testi in italiano. Stesse chiavi, stesse età, stesse fonti e date. */
import type { VaccineTexts } from './vaccines';

const HEXA = 'Difterite, tetano, pertosse, poliomielite, Haemophilus influenzae b, epatite B';
const POP_2018 = 'Tutti i lattanti (obbligatorio per i bambini nati dal 1° gennaio 2018)';
const POP_2023 = 'Tutti i lattanti (obbligatorio per i bambini nati dal 1° gennaio 2023)';
const ROTA = 'Rotavirus (vaccino orale)';
const POP_ROTA = 'Tutti i lattanti (raccomandato)';
const MENACWY = 'Meningococchi A, C, W, Y';
const MMR = 'Morbillo, parotite, rosolia';

export const VACCINES_IT: VaccineTexts = {
  label: 'Calendario vaccinale 2026',
  sources: {
    calendrier2026: 'Ministero della Salute francese — Calendario vaccinale e raccomandazioni vaccinali 2026 (documento ufficiale diffuso da Infovac)',
    santefr2026: 'Santé.fr — Il calendario vaccinale (aggiornamento di luglio 2026)',
    has_rotavirus: 'HAS (Alta Autorità della Salute francese) — Raccomandazione vaccinale contro le infezioni da rotavirus (12 luglio 2022), tramite VIDAL',
  },
  rules: {
    hexa_1: { label: HEXA, dose: '1ª iniezione', population: POP_2018 },
    pneumo_1: { label: 'Pneumococco', dose: '1ª iniezione', population: POP_2018 },
    rota_1: { label: ROTA, dose: '1ª dose', note: 'Raccomandato. Due o tre dosi a seconda del vaccino, da completare prima dei 6 o degli 8 mesi.', population: POP_ROTA },
    menb_1: { label: 'Meningococco B', dose: '1ª iniezione', population: POP_2023 },
    rota_2: { label: ROTA, dose: '2ª dose', population: POP_ROTA },
    hexa_2: { label: HEXA, dose: '2ª iniezione', population: POP_2018 },
    pneumo_2: { label: 'Pneumococco', dose: '2ª iniezione', population: POP_2018 },
    rota_3: { label: ROTA, dose: '3ª dose, solo con RotaTeq (Rotarix: 2 dosi)', population: POP_ROTA },
    menb_2: { label: 'Meningococco B', dose: '2ª iniezione', population: POP_2023 },
    menacwy_1: { label: MENACWY, dose: '1ª iniezione', population: POP_2023 },
    hexa_3: { label: HEXA, dose: 'Richiamo', population: POP_2018 },
    pneumo_3: { label: 'Pneumococco', dose: 'Richiamo', population: POP_2018 },
    ror_1: { label: MMR, dose: '1ª iniezione', population: POP_2018 },
    menb_3: { label: 'Meningococco B', dose: 'Richiamo', population: POP_2023 },
    menacwy_2: { label: MENACWY, dose: 'Richiamo', population: POP_2023 },
    ror_2: { label: MMR, dose: '2ª iniezione', population: POP_2018 },
    dtcap_6: { label: 'Difterite, tetano, pertosse, poliomielite', dose: 'Richiamo dei 6 anni', population: 'Tutti i bambini' },
    dtcap_11: { label: 'Difterite, tetano, pertosse, poliomielite (dosi ridotte)', dose: 'Richiamo degli 11–13 anni', population: 'Tutti gli adolescenti' },
    hpv_1: { label: 'Papillomavirus (HPV)', dose: '2 iniezioni a distanza di 6–13 mesi (11–14 anni)', population: 'Tutti gli adolescenti' },
    menacwy_ado: { label: MENACWY, dose: '1 iniezione (11–14 anni)', population: 'Tutti gli adolescenti' },
  },
  situational: [
    'BCG (tubercolosi): solo per i bambini esposti a un rischio elevato, a partire da un mese.',
    'Epatite B alla nascita: se la madre è portatrice del virus (o in caso di nascita nella Guyana francese o a Mayotte).',
    'Bronchiolite (VRS): durante la stagione può essere proposto un anticorpo (nirsevimab) prima dell’uscita dal reparto maternità, salvo se la madre è stata vaccinata durante la gravidanza.',
    'Influenza: può essere proposta ogni anno ai bambini dai 2 ai 17 anni, e dai 6 mesi in caso di fattori di rischio.',
    'Recupero contro i meningococchi B e ACWY tra i 2 e i 4 anni compiuti, anche dopo un vaccino contro il meningococco C; obbligatorio per i bambini nati dal 2023 non vaccinati prima dei 2 anni.',
  ],
  questions: [
    'Quali vaccini sono previsti a questo appuntamento?',
    'Se ne possono fare diversi lo stesso giorno?',
    'Quali reazioni sono abituali dopo questi vaccini, e quali devono farci richiamare?',
    'Bisogna dare qualcosa contro la febbre o il dolore, e a quale dose?',
    'Nostro figlio o nostra figlia è in regola secondo il suo libretto sanitario?',
    'C’è qualche vaccinazione di recupero da prevedere?',
    'La nostra situazione (prematurità, malattia, viaggio, persone vicine) cambia qualcosa?',
  ],
};
