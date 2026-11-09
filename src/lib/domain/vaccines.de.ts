/** Impfkalender (Frankreich 2026) — deutsche Texte. Gleiche Schlüssel, gleiche Altersangaben, gleiche Quellen und Daten. */
import type { VaccineTexts } from './vaccines';

const HEXA = 'Diphtherie, Tetanus, Keuchhusten, Kinderlähmung (Polio), Haemophilus influenzae b, Hepatitis B';
const POP_2018 = 'Alle Säuglinge (Pflicht für Kinder, die ab dem 1. Januar 2018 geboren sind)';
const POP_2023 = 'Alle Säuglinge (Pflicht für Kinder, die ab dem 1. Januar 2023 geboren sind)';
const ROTA = 'Rotaviren (Schluckimpfung)';
const POP_ROTA = 'Alle Säuglinge (empfohlen)';
const MENACWY = 'Meningokokken A, C, W, Y';
const MMR = 'Masern, Mumps, Röteln';

export const VACCINES_DE: VaccineTexts = {
  label: 'Impfkalender 2026',
  sources: {
    calendrier2026: 'Französisches Gesundheitsministerium — Impfkalender und Impfempfehlungen 2026 (offizielles Dokument, verbreitet von Infovac)',
    santefr2026: 'Santé.fr — Der Impfkalender (Aktualisierung Juli 2026)',
    has_rotavirus: 'HAS (Französische Gesundheitsbehörde) — Impfempfehlung gegen Rotavirus-Infektionen (12. Juli 2022), über VIDAL',
  },
  rules: {
    hexa_1: { label: HEXA, dose: '1. Impfung', population: POP_2018 },
    pneumo_1: { label: 'Pneumokokken', dose: '1. Impfung', population: POP_2018 },
    rota_1: { label: ROTA, dose: '1. Dosis', note: 'Empfohlen. Zwei oder drei Dosen je nach Impfstoff, abzuschließen vor dem Alter von 6 bzw. 8 Monaten.', population: POP_ROTA },
    menb_1: { label: 'Meningokokken B', dose: '1. Impfung', population: POP_2023 },
    rota_2: { label: ROTA, dose: '2. Dosis', population: POP_ROTA },
    hexa_2: { label: HEXA, dose: '2. Impfung', population: POP_2018 },
    pneumo_2: { label: 'Pneumokokken', dose: '2. Impfung', population: POP_2018 },
    rota_3: { label: ROTA, dose: '3. Dosis, nur mit RotaTeq (Rotarix: 2 Dosen)', population: POP_ROTA },
    menb_2: { label: 'Meningokokken B', dose: '2. Impfung', population: POP_2023 },
    menacwy_1: { label: MENACWY, dose: '1. Impfung', population: POP_2023 },
    hexa_3: { label: HEXA, dose: 'Auffrischung', population: POP_2018 },
    pneumo_3: { label: 'Pneumokokken', dose: 'Auffrischung', population: POP_2018 },
    ror_1: { label: MMR, dose: '1. Impfung', population: POP_2018 },
    menb_3: { label: 'Meningokokken B', dose: 'Auffrischung', population: POP_2023 },
    menacwy_2: { label: MENACWY, dose: 'Auffrischung', population: POP_2023 },
    ror_2: { label: MMR, dose: '2. Impfung', population: POP_2018 },
    dtcap_6: { label: 'Diphtherie, Tetanus, Keuchhusten, Kinderlähmung (Polio)', dose: 'Auffrischung mit 6 Jahren', population: 'Alle Kinder' },
    dtcap_11: { label: 'Diphtherie, Tetanus, Keuchhusten, Kinderlähmung (Polio) (reduzierte Dosen)', dose: 'Auffrischung mit 11–13 Jahren', population: 'Alle Jugendlichen' },
    hpv_1: { label: 'Humane Papillomviren (HPV)', dose: '2 Impfungen im Abstand von 6 bis 13 Monaten (11–14 Jahre)', population: 'Alle Jugendlichen' },
    menacwy_ado: { label: MENACWY, dose: '1 Impfung (11–14 Jahre)', population: 'Alle Jugendlichen' },
  },
  situational: [
    'BCG (Tuberkulose): nur für Kinder mit hohem Risiko, ab einem Alter von einem Monat.',
    'Hepatitis B bei der Geburt: wenn die Mutter Trägerin des Virus ist (oder bei Geburt in Französisch-Guayana oder auf Mayotte).',
    'Bronchiolitis (RSV): Während der Saison kann vor der Entlassung aus der Geburtsklinik ein Antikörper (Nirsevimab) angeboten werden, außer wenn die Mutter in der Schwangerschaft geimpft wurde.',
    'Grippe: kann Kindern von 2 bis 17 Jahren jedes Jahr angeboten werden, bei Risikofaktoren ab 6 Monaten.',
    'Nachholimpfung gegen Meningokokken B und ACWY zwischen 2 und vollendeten 4 Jahren, auch nach einer Impfung gegen Meningokokken C; Pflicht für Kinder, die seit 2023 geboren und vor dem Alter von 2 Jahren nicht geimpft wurden.',
  ],
  questions: [
    'Welche Impfungen sind bei diesem Termin geplant?',
    'Können mehrere am selben Tag gegeben werden?',
    'Welche Reaktionen sind nach diesen Impfungen üblich, und bei welchen sollten wir uns wieder melden?',
    'Sollen wir etwas gegen Fieber oder Schmerzen geben, und in welcher Dosis?',
    'Ist unser Kind laut seinem Gesundheitsheft auf dem aktuellen Stand?',
    'Muss etwas nachgeholt werden?',
    'Ändert unsere Situation (Frühgeburt, Krankheit, Reise, Umfeld) etwas?',
  ],
};
