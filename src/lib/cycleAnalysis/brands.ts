/**
 * Liste FERMÉE des tests pris en charge, avec les règles de lecture de chaque fabricant.
 * Chaque règle provient de la notice publiée par le fabricant (source et date de consultation).
 * Un test absent de cette liste n'est PAS interprété automatiquement.
 *
 * Statut : règles reprises des notices ; analyse photo NON validée sur de vraies photos de ces tests.
 */

import { t as tr } from '@/i18n';
import { localized } from '@/i18n/localized';

export type TestKind = 'ovulation' | 'pregnancy';
export type TestFormat = 'lines' | 'cross' | 'digital';
/** Comment l'application lit ce test. */
export type AnalysisMode = 'lines_auto' | 'digital_ocr' | 'manual_only';

export interface ManualOption {
  value: string;
  label: string;
  /** Résultat proposé quand l'utilisatrice choisit cette option. */
  outcome: string;
}

export interface TestRule {
  id: string;
  kind: TestKind;
  brand: string;
  model: string;
  format: TestFormat;
  mode: AnalysisMode;
  /** Lecture à partir de (minutes) — null si la notice ne donne pas de minimum. */
  readMinMinutes: number | null;
  /** Ne plus lire après (minutes) — null pour les écrans numériques qui gardent le résultat. */
  readMaxMinutes: number | null;
  /** Règle de positivité appliquée à l'analyse des lignes. */
  positiveRule?: 'any_test_line' | 'test_ge_control';
  lineColour?: string;
  /** Règles de lecture résumées (affichées à l'utilisatrice). */
  readingRules: string[];
  /** Textes affichés à l'écran (tests numériques), en minuscules. */
  screenTexts?: { positive: string[]; negative: string[]; error: string[] };
  manualOptions?: ManualOption[];
  source: { title: string; url: string; consultedOn: string; note?: string };
}

const CONSULTED = '2026-10-17';

const TEST_RULES_FR: TestRule[] = [
  // ------------------------------------------------------------- grossesse
  {
    id: 'clearblue-detection-precoce',
    kind: 'pregnancy',
    brand: 'Clearblue',
    model: 'Détection Précoce (lignes)',
    format: 'lines',
    mode: 'lines_auto',
    readMinMinutes: 3,
    readMaxMinutes: 10,
    positiveRule: 'any_test_line',
    lineColour: 'bleue',
    readingRules: [
      'Attendre les 3 minutes complètes, lire au plus tard 10 minutes après le test.',
      'Ligne dans la fenêtre témoin + ligne dans la fenêtre de résultat : positif, quelle que soit l’intensité.',
      'Ligne témoin seule : négatif.',
      'Aucune ligne dans la fenêtre témoin : test invalide, à refaire.',
    ],
    source: { title: 'Notice Clearblue Détection Précoce (FR)', url: 'https://fr.clearblue.com/sites/default/files/wysiwyg/products/leaflets/2300484_03.pdf', consultedOn: CONSULTED },
  },
  {
    id: 'first-response-early-result',
    kind: 'pregnancy',
    brand: 'First Response',
    model: 'Early Result (lignes)',
    format: 'lines',
    mode: 'lines_auto',
    readMinMinutes: 3,
    readMaxMinutes: 10,
    positiveRule: 'any_test_line',
    lineColour: 'rose',
    readingRules: [
      'Attendre 3 minutes ; ne pas lire un résultat négatif après 10 minutes.',
      'Deux lignes roses : positif (une ligne peut être plus claire que l’autre).',
      'Une seule ligne rose : négatif.',
      'Aucune ligne rose à 3 minutes : test invalide.',
    ],
    source: { title: 'Notice First Response Early Result', url: 'https://www.firstresponse.com/Products/Pregnancy/~/media/8809F06F680D4A5CA23069540D0A291D.ashx', consultedOn: CONSULTED, note: 'Notice nord-américaine : vérifiez la notice de la boîte achetée en France.' },
  },
  {
    id: 'clearblue-detection-rapide',
    kind: 'pregnancy',
    brand: 'Clearblue',
    model: 'Détection Rapide (signe + / −)',
    format: 'cross',
    mode: 'manual_only',
    readMinMinutes: 3,
    readMaxMinutes: 10,
    lineColour: 'bleue',
    readingRules: [
      'Attendre 3 minutes (un « Enceinte » peut apparaître dès 1 minute), lire au plus tard 10 minutes après le test.',
      'Ligne bleue dans la fenêtre témoin + signe « + » : positif, même si une branche du « + » est plus pâle.',
      'Ligne bleue dans la fenêtre témoin + signe « − » : négatif.',
      'Pas de ligne bleue dans la fenêtre témoin : test invalide.',
    ],
    manualOptions: [
      { value: 'plus', label: 'Ligne témoin + signe « + »', outcome: 'possibly_positive' },
      { value: 'minus', label: 'Ligne témoin + signe « − »', outcome: 'possibly_negative' },
      { value: 'no_control', label: 'Pas de ligne dans la fenêtre témoin', outcome: 'invalid' },
      { value: 'unsure', label: 'Je ne suis pas sûre', outcome: 'uncertain' },
    ],
    source: { title: 'Notice Clearblue Détection Rapide (FR)', url: 'https://fr.clearblue.com/sites/default/files/wysiwyg/products/leaflets/2300652_01-French.pdf', consultedOn: CONSULTED, note: 'Lecture du signe par l’utilisatrice : l’analyse automatique des croix n’est pas prise en charge.' },
  },
  {
    id: 'clearblue-ultra-precoce-digital',
    kind: 'pregnancy',
    brand: 'Clearblue',
    model: 'Détection Ultra Précoce Digital',
    format: 'digital',
    mode: 'digital_ocr',
    readMinMinutes: 1,
    readMaxMinutes: null,
    readingRules: [
      'Le résultat s’affiche après l’indicateur de progression (1 à 5 minutes).',
      '« Enceinte » : positif. « Pas Enceinte » : négatif.',
      'Un symbole « ! » ou un message d’erreur : le test n’a pas fonctionné.',
    ],
    screenTexts: { positive: ['enceinte'], negative: ['pas enceinte'], error: ['erreur', '!'] },
    manualOptions: [
      { value: 'pregnant', label: 'L’écran affiche « Enceinte »', outcome: 'possibly_positive' },
      { value: 'not_pregnant', label: 'L’écran affiche « Pas Enceinte »', outcome: 'possibly_negative' },
      { value: 'error', label: 'Symbole « ! » ou message d’erreur', outcome: 'invalid' },
      { value: 'unsure', label: 'Je n’arrive pas à lire l’écran', outcome: 'uncertain' },
    ],
    source: { title: 'Notice Clearblue Détection Ultra Précoce Digital (FR)', url: 'https://fr.clearblue.com/sites/default/files/wysiwyg/products/leaflets/2300619_02.pdf', consultedOn: CONSULTED },
  },
  // ------------------------------------------------------------- ovulation
  {
    id: 'one-step-lh-strip',
    kind: 'ovulation',
    brand: 'One Step',
    model: 'Bandelette LH (Co-Innovation Biotech)',
    format: 'lines',
    mode: 'lines_auto',
    readMinMinutes: 5,
    readMaxMinutes: 5,
    positiveRule: 'test_ge_control',
    readingRules: [
      'Lire le résultat à 5 minutes ; ne pas le lire au-delà.',
      'Deux lignes, ligne de test aussi foncée ou plus foncée que la ligne de contrôle : pic de LH.',
      'Ligne de contrôle seule, ou ligne de test plus claire : pas de pic de LH.',
      'Aucune ligne, ou ligne de test seule : test invalide.',
    ],
    source: { title: 'Notice One Step LH Test Strip (UE)', url: 'https://cdn.shopify.com/s/files/1/0313/7804/7108/files/One_Step_LH_Test_Strip_Instruction_Insert_EU.pdf?135', consultedOn: CONSULTED },
  },
  {
    id: 'clearblue-ovulation-digital',
    kind: 'ovulation',
    brand: 'Clearblue',
    model: 'Test d’ovulation Digital (smiley)',
    format: 'digital',
    mode: 'manual_only',
    readMinMinutes: null,
    readMaxMinutes: null,
    readingRules: [
      'Un smiley s’affiche lorsque le pic de LH est détecté.',
      'Reportez-vous à la notice de la boîte pour le délai d’affichage et les autres symboles.',
    ],
    manualOptions: [
      { value: 'smiley', label: 'Un smiley est affiché', outcome: 'lh_peak_possible' },
      { value: 'no_smiley', label: 'Pas de smiley', outcome: 'lh_peak_not_detected' },
      { value: 'error', label: 'Symbole ou message d’erreur', outcome: 'invalid' },
      { value: 'unsure', label: 'Je ne suis pas sûre', outcome: 'uncertain' },
    ],
    source: { title: 'Fiche produit Clearblue Test d’ovulation Digital', url: 'https://www.redcare-pharmacie.fr/hygiene-et-sante/F00001981/clearblue-test-d-ovulation-digital-kit.htm', consultedOn: CONSULTED, note: 'Seul le smiley est confirmé par la source consultée : le symbole ne peut pas être lu par reconnaissance de texte, la lecture est faite par l’utilisatrice.' },
  },
];

/** Textes anglais des règles : mêmes identifiants et même ordre ; seuls les libellés affichés changent. */
const EN_TEXTS: Record<string, {
  model: string;
  readingRules: string[];
  options?: Record<string, string>;
  source: { title: string; note?: string };
}> = {
  'clearblue-detection-precoce': {
    model: 'Détection Précoce (lines)',
    readingRules: [
      'Wait the full 3 minutes and read no later than 10 minutes after the test.',
      'A line in the control window + a line in the result window: positive, whatever the intensity.',
      'Control line only: negative.',
      'No line in the control window: invalid test, repeat it.',
    ],
    source: { title: 'Clearblue Détection Précoce leaflet (French)' },
  },
  'first-response-early-result': {
    model: 'Early Result (lines)',
    readingRules: [
      'Wait 3 minutes; do not read a negative result after 10 minutes.',
      'Two pink lines: positive (one line may be fainter than the other).',
      'One pink line only: negative.',
      'No pink line at 3 minutes: invalid test.',
    ],
    source: { title: 'First Response Early Result leaflet', note: 'North American leaflet: check the leaflet in the box you bought in France.' },
  },
  'clearblue-detection-rapide': {
    model: 'Détection Rapide (+ / − sign)',
    readingRules: [
      'Wait 3 minutes (an “Enceinte” may appear from 1 minute) and read no later than 10 minutes after the test.',
      'Blue line in the control window + a “+” sign: positive, even if one arm of the “+” is fainter.',
      'Blue line in the control window + a “−” sign: negative.',
      'No blue line in the control window: invalid test.',
    ],
    options: {
      plus: 'Control line + “+” sign',
      minus: 'Control line + “−” sign',
      no_control: 'No line in the control window',
      unsure: 'I’m not sure',
    },
    source: { title: 'Clearblue Détection Rapide leaflet (French)', note: 'The sign is read by you: automatic analysis of crosses is not supported.' },
  },
  'clearblue-ultra-precoce-digital': {
    model: 'Détection Ultra Précoce Digital',
    readingRules: [
      'The result appears after the progress indicator (1 to 5 minutes).',
      '“Enceinte”: positive. “Pas Enceinte”: negative.',
      'A “!” symbol or an error message: the test did not work.',
    ],
    options: {
      pregnant: 'The screen shows “Enceinte”',
      not_pregnant: 'The screen shows “Pas Enceinte”',
      error: '“!” symbol or error message',
      unsure: 'I can’t read the screen',
    },
    source: { title: 'Clearblue Détection Ultra Précoce Digital leaflet (French)' },
  },
  'one-step-lh-strip': {
    model: 'LH strip (Co-Innovation Biotech)',
    readingRules: [
      'Read the result at 5 minutes; do not read it after that.',
      'Two lines, with the test line as dark as or darker than the control line: LH surge.',
      'Control line only, or a lighter test line: no LH surge.',
      'No line, or test line only: invalid test.',
    ],
    source: { title: 'One Step LH Test Strip leaflet (EU)' },
  },
  'clearblue-ovulation-digital': {
    model: 'Digital ovulation test (smiley)',
    readingRules: [
      'A smiley appears when the LH surge is detected.',
      'See the leaflet in the box for the display time and the other symbols.',
    ],
    options: {
      smiley: 'A smiley is displayed',
      no_smiley: 'No smiley',
      error: 'Symbol or error message',
      unsure: 'I’m not sure',
    },
    source: { title: 'Clearblue Digital ovulation test product sheet', note: 'Only the smiley is confirmed by the source consulted: the symbol can’t be read by text recognition, so you read it yourself.' },
  },
};

const TEST_RULES_EN: TestRule[] = TEST_RULES_FR.map((r) => {
  const x = EN_TEXTS[r.id];
  if (!x) return r;
  return {
    ...r,
    model: x.model,
    readingRules: x.readingRules,
    manualOptions: r.manualOptions?.map((o) => ({ ...o, label: x.options?.[o.value] ?? o.label })),
    source: { ...r.source, title: x.source.title, note: x.source.note ?? r.source.note },
  };
});

export const TEST_RULES: TestRule[] = localized(TEST_RULES_FR, TEST_RULES_EN);

export const UNKNOWN_TEST_ID = 'unknown';

export function rulesFor(kind: TestKind): TestRule[] {
  return TEST_RULES.filter((r) => r.kind === kind);
}

export function findRule(id: string | null | undefined): TestRule | null {
  return TEST_RULES.find((r) => r.id === id) ?? null;
}

/** Options de lecture manuelle génériques (test non répertorié ou analyse impossible). */
export function genericManualOptions(kind: TestKind, format: TestFormat): ManualOption[] {
  if (kind === 'ovulation') {
    return [
      { value: 'peak', label: format === 'digital' ? tr('l8.br.peakDigital') : tr('l8.br.peakLines'), outcome: 'lh_peak_possible' },
      { value: 'no_peak', label: format === 'digital' ? tr('l8.br.noPeakDigital') : tr('l8.br.noPeakLines'), outcome: 'lh_peak_not_detected' },
      { value: 'invalid', label: tr('l8.br.noControl'), outcome: 'invalid' },
      { value: 'unsure', label: tr('l8.br.unsure'), outcome: 'uncertain' },
    ];
  }
  return [
    { value: 'positive', label: format === 'digital' ? tr('l8.br.digitalPregnant') : format === 'cross' ? tr('l8.br.plusVisible') : tr('l8.br.testLineVisible'), outcome: 'possibly_positive' },
    { value: 'negative', label: format === 'digital' ? tr('l8.br.digitalNotPregnant') : format === 'cross' ? tr('l8.br.minusSign') : tr('l8.br.controlOnly'), outcome: 'possibly_negative' },
    { value: 'invalid', label: tr('l8.br.noControl'), outcome: 'invalid' },
    { value: 'unsure', label: tr('l8.br.unsure'), outcome: 'uncertain' },
  ];
}
