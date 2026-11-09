/**
 * Interprétation PROPOSÉE d'une photo de test, selon les règles du fabricant.
 * Le résultat est toujours soumis à la confirmation de l'utilisatrice et accompagné d'un niveau de confiance.
 * L'application n'annonce jamais « Vous êtes enceinte » ni une ovulation certaine.
 */
import { onLocaleChange, t as tr } from '@/i18n';
import { localized } from '@/i18n/localized';
import { findRule, type TestFormat, type TestKind, type TestRule } from './brands';
import { scanLines, type LineScan } from './lines';
import { assessQuality, QUALITY_MESSAGES, type QualityReport } from './quality';
import type { Px, RGBAImage } from './image';

export type OvulationOutcome = 'lh_peak_possible' | 'lh_peak_not_detected' | 'invalid' | 'uncertain' | 'unusable';
export type PregnancyOutcome = 'possibly_positive' | 'possibly_negative' | 'invalid' | 'uncertain' | 'unusable';
export type TestOutcome = OvulationOutcome | PregnancyOutcome;
export type AnalysisMethod = 'on_device_lines' | 'on_device_ocr' | 'manual';
export type ReadWindowAnswer = 'yes' | 'no' | 'unknown';

const OUTCOME_LABEL_FR: Record<TestOutcome, string> = {
  lh_peak_possible: 'Pic de LH possible',
  lh_peak_not_detected: 'Pic de LH non détecté',
  possibly_positive: 'Résultat possiblement positif',
  possibly_negative: 'Résultat possiblement négatif',
  invalid: 'Test invalide',
  uncertain: 'Résultat incertain',
  unusable: 'Photo inexploitable',
};
const OUTCOME_LABEL_EN: Record<TestOutcome, string> = {
  lh_peak_possible: 'Possible LH surge',
  lh_peak_not_detected: 'LH surge not detected',
  possibly_positive: 'Possibly positive result',
  possibly_negative: 'Possibly negative result',
  invalid: 'Invalid test',
  uncertain: 'Uncertain result',
  unusable: 'Photo can’t be used',
};
const OUTCOME_LABEL_ES: Record<TestOutcome, string> = {
  lh_peak_possible: 'Posible pico de LH',
  lh_peak_not_detected: 'Pico de LH no detectado',
  possibly_positive: 'Resultado posiblemente positivo',
  possibly_negative: 'Resultado posiblemente negativo',
  invalid: 'Test no válido',
  uncertain: 'Resultado incierto',
  unusable: 'Foto no aprovechable',
};
const OUTCOME_LABEL_DE: Record<TestOutcome, string> = {
  lh_peak_possible: 'LH-Anstieg möglich',
  lh_peak_not_detected: 'Kein LH-Anstieg erkannt',
  possibly_positive: 'Möglicherweise positives Ergebnis',
  possibly_negative: 'Möglicherweise negatives Ergebnis',
  invalid: 'Ungültiger Test',
  uncertain: 'Unsicheres Ergebnis',
  unusable: 'Foto nicht auswertbar',
};
const OUTCOME_LABEL_IT: Record<TestOutcome, string> = {
  lh_peak_possible: 'Possibile picco di LH',
  lh_peak_not_detected: 'Picco di LH non rilevato',
  possibly_positive: 'Risultato forse positivo',
  possibly_negative: 'Risultato forse negativo',
  invalid: 'Test non valido',
  uncertain: 'Risultato incerto',
  unusable: 'Foto non utilizzabile',
};
export const OUTCOME_LABEL: Record<TestOutcome, string> = localized(OUTCOME_LABEL_FR, OUTCOME_LABEL_EN, { es: OUTCOME_LABEL_ES, de: OUTCOME_LABEL_DE, it: OUTCOME_LABEL_IT });

// Messages affichés tels quels par les écrans : relus à chaque changement de langue.
export let OVULATION_REMINDER = tr('l8.int.reminder');
export let PREGNANCY_POSITIVE_MESSAGE = tr('l8.int.pregPositive');
export let LATE_MESSAGE = tr('l8.int.late');
export let EARLY_MESSAGE = tr('l8.int.early');
export let UNKNOWN_TEST_MESSAGE = tr('l8.int.unknownTest');
onLocaleChange(() => {
  OVULATION_REMINDER = tr('l8.int.reminder');
  PREGNANCY_POSITIVE_MESSAGE = tr('l8.int.pregPositive');
  LATE_MESSAGE = tr('l8.int.late');
  EARLY_MESSAGE = tr('l8.int.early');
  UNKNOWN_TEST_MESSAGE = tr('l8.int.unknownTest');
});

export interface TestContext {
  kind: TestKind;
  ruleId: string | null;
  format: TestFormat;
  /** Minutes écoulées entre la réalisation du test et la photo (null si inconnu). */
  minutesElapsed: number | null;
  /** Réponse à « La photo a-t-elle été prise pendant le délai de lecture de la notice ? » */
  withinReadWindow: ReadWindowAnswer;
}

export interface TestAnalysis {
  outcome: TestOutcome;
  /** 0–1 ; affiché sous forme de niveau (faible / moyen / élevé). */
  confidence: number;
  method: AnalysisMethod;
  rule: TestRule | null;
  quality: QualityReport | null;
  scan: LineScan | null;
  /** Codes techniques (pour les tests et l'affichage du détail). */
  reasons: string[];
  /** Messages à afficher (dans la langue en cours). */
  messages: string[];
  /** Toujours vrai : le résultat doit être confirmé par l'utilisatrice. */
  needsConfirmation: true;
}

/**
 * Plafond de confiance tant que l'analyse n'a pas été validée sur un jeu de vraies photos de chaque test :
 * le niveau affiché ne peut pas dépasser « moyen ». À relever (0.9) seulement après validation.
 */
export const MAX_CONFIDENCE_UNTIL_VALIDATED = 0.74;

export function confidenceLabel(c: number): string {
  return c >= 0.75 ? tr('l8.int.conf.high') : c >= 0.5 ? tr('l8.int.conf.mid') : tr('l8.int.conf.low');
}

/** Contrôle du délai de lecture : null si le délai est respecté. */
export function timingProblem(ctx: TestContext, rule: TestRule | null): 'late' | 'early' | null {
  if (ctx.withinReadWindow === 'no') {
    if (rule?.readMinMinutes != null && ctx.minutesElapsed != null && ctx.minutesElapsed < rule.readMinMinutes) return 'early';
    return 'late';
  }
  if (rule && ctx.minutesElapsed != null) {
    if (rule.readMaxMinutes != null && ctx.minutesElapsed > rule.readMaxMinutes) return 'late';
    if (rule.readMinMinutes != null && ctx.minutesElapsed < rule.readMinMinutes) return 'early';
  }
  return null;
}

function finish(kind: TestKind, a: Omit<TestAnalysis, 'needsConfirmation' | 'confidence'> & { confidence: number }): TestAnalysis {
  const messages = [...a.messages];
  if (kind === 'ovulation' && !messages.includes(OVULATION_REMINDER)) messages.push(OVULATION_REMINDER);
  if (kind === 'pregnancy' && a.outcome === 'possibly_positive' && !messages.includes(PREGNANCY_POSITIVE_MESSAGE)) messages.unshift(PREGNANCY_POSITIVE_MESSAGE);
  // Un résultat incertain ou inexploitable n'affiche jamais une confiance élevée.
  const cap = a.outcome === 'uncertain' ? 0.45 : a.outcome === 'unusable' ? 0 : MAX_CONFIDENCE_UNTIL_VALIDATED;
  // Mise à l'échelle (et non simple plafond) : les écarts de confiance entre situations sont conservés.
  const scaled = Math.max(0, Math.min(1, a.confidence)) * (MAX_CONFIDENCE_UNTIL_VALIDATED / 0.9);
  return { ...a, messages, confidence: Math.round(Math.min(cap, scaled) * 100) / 100, needsConfirmation: true };
}

/**
 * Analyse d'un test à lignes à partir de l'image décodée et du cadrage (extrémités C et T).
 */
export function analyseLineTest(img: RGBAImage, c: Px, t: Px, ctx: TestContext, bandRatio = 0.22): TestAnalysis {
  const rule = findRule(ctx.ruleId);
  // Cadrage incohérent (points absents, hors image ou trop proches) : aucune interprétation possible.
  const inside = (p: Px) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.y >= 0 && p.x <= img.width && p.y <= img.height;
  if (!inside(c) || !inside(t) || Math.hypot(t.x - c.x, t.y - c.y) < Math.max(12, 0.08 * Math.min(img.width, img.height))) {
    return finish(ctx.kind, { method: 'on_device_lines', rule, quality: null, scan: null, outcome: 'unusable', confidence: 0, reasons: ['bad_crop'], messages: [tr('l8.int.badCrop')] });
  }
  const scan = scanLines(img, c, t, bandRatio);
  const quality = assessQuality(img, scan.bandBrightness);
  const base = { method: 'on_device_lines' as const, rule, quality, scan };
  const neg: TestOutcome = ctx.kind === 'ovulation' ? 'lh_peak_not_detected' : 'possibly_negative';
  const pos: TestOutcome = ctx.kind === 'ovulation' ? 'lh_peak_possible' : 'possibly_positive';

  // 1. Qualité de la photo
  if (!quality.ok) {
    return finish(ctx.kind, { ...base, outcome: 'unusable', confidence: 0, reasons: quality.issues.map((i) => `quality:${i}`), messages: [...quality.issues.map((i) => QUALITY_MESSAGES[i]), tr('l8.int.noPhotoResult')] });
  }
  // 2. Test non répertorié : pas de règle de fabricant → pas d'interprétation
  if (!rule || rule.mode !== 'lines_auto') {
    return finish(ctx.kind, { ...base, outcome: 'uncertain', confidence: 0.2, reasons: [rule ? 'format_not_supported' : 'unknown_test'], messages: [UNKNOWN_TEST_MESSAGE] });
  }
  // 3. Délai de lecture
  const timing = timingProblem(ctx, rule);
  if (timing) {
    return finish(ctx.kind, { ...base, outcome: 'uncertain', confidence: 0.2, reasons: [`read_too_${timing}`], messages: [timing === 'late' ? LATE_MESSAGE : EARLY_MESSAGE] });
  }
  // 4. Ligne de contrôle
  if (!scan.control) {
    return finish(ctx.kind, {
      ...base, outcome: 'invalid', confidence: Math.min(0.7, 0.4 + 0.3 * quality.score), reasons: ['no_control_line'],
      messages: [tr('l8.int.noControl')],
    });
  }
  const timingFactor = ctx.withinReadWindow === 'unknown' && ctx.minutesElapsed == null ? 0.75 : 1;
  const controlFactor = Math.min(1, scan.control.snr / 12);
  const baseConf = quality.score * (0.5 + 0.5 * controlFactor) * timingFactor;
  const extra: string[] = [];
  if (timingFactor < 1) extra.push(tr('l8.int.timingUnknown'));

  const tLine = scan.test;
  const ratio = scan.ratio ?? 0;

  // 5a. Ovulation : la ligne de test doit être aussi foncée ou plus foncée que le contrôle
  if (rule.positiveRule === 'test_ge_control') {
    if (!tLine) return finish(ctx.kind, { ...base, outcome: neg, confidence: baseConf * 0.95, reasons: ['no_test_line'], messages: [tr('l8.int.onlyControl'), ...extra] });
    if (ratio >= 1.05) return finish(ctx.kind, { ...base, outcome: pos, confidence: baseConf * Math.min(1, 0.6 + (ratio - 1.05) * 2), reasons: ['test_ge_control'], messages: [tr('l8.int.testGeControl'), ...extra] });
    if (ratio >= 0.85) return finish(ctx.kind, { ...base, outcome: 'uncertain', confidence: 0.35, reasons: ['test_close_to_control'], messages: [tr('l8.int.testCloseControl'), ...extra] });
    return finish(ctx.kind, { ...base, outcome: neg, confidence: baseConf * Math.min(1, 0.6 + (0.85 - ratio)), reasons: ['test_lighter_than_control'], messages: [tr('l8.int.testLighter'), ...extra] });
  }

  // 5b. Grossesse : toute ligne de test visible compte, mais une ligne très pâle sur photo reste incertaine
  if (!tLine || ratio < 0.08) {
    return finish(ctx.kind, { ...base, outcome: neg, confidence: baseConf * 0.9, reasons: ['no_test_line'], messages: [tr('l8.int.noTestLine'), ...extra] });
  }
  if (tLine.snr < 8 || ratio < 0.2) {
    return finish(ctx.kind, { ...base, outcome: 'uncertain', confidence: 0.3, reasons: ['faint_test_line'], messages: [tr('l8.int.faintLine'), ...extra] });
  }
  return finish(ctx.kind, { ...base, outcome: pos, confidence: baseConf * Math.min(1, 0.55 + tLine.snr / 40), reasons: ['test_line_visible'], messages: [...extra] });
}

/**
 * Test numérique : lecture du texte reconnu SUR L'APPAREIL (ML Kit).
 * Si le texte est vide, flou ou ne correspond à aucun message connu, aucun résultat n'est inventé.
 */
export function analyseDigitalText(text: string | null, ctx: TestContext): TestAnalysis {
  const rule = findRule(ctx.ruleId);
  const base = { method: 'on_device_ocr' as const, rule, quality: null, scan: null };
  if (!rule || rule.mode !== 'digital_ocr' || !rule.screenTexts) {
    return finish(ctx.kind, { ...base, outcome: 'uncertain', confidence: 0.2, reasons: [rule ? 'format_not_supported' : 'unknown_test'], messages: [UNKNOWN_TEST_MESSAGE] });
  }
  const norm = (text ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  const has = (list: string[]) => list.some((s) => norm.includes(s.normalize('NFD').replace(/[̀-ͯ]/g, '')));
  if (!norm || norm.length < 3) {
    return finish(ctx.kind, { ...base, outcome: 'unusable', confidence: 0, reasons: ['ocr_empty'], messages: [tr('l8.int.ocrEmpty')] });
  }
  const neg = rule.screenTexts.negative.some((s) => norm.includes(s));
  const err = has(rule.screenTexts.error.filter((s) => s !== '!')) || /(^|\s)!(\s|$)/.test(norm);
  const pos = !neg && has(rule.screenTexts.positive);
  const timing = timingProblem(ctx, rule);
  if (timing === 'early') {
    return finish(ctx.kind, { ...base, outcome: 'uncertain', confidence: 0.2, reasons: ['read_too_early'], messages: [EARLY_MESSAGE] });
  }
  if (err) return finish(ctx.kind, { ...base, outcome: 'invalid', confidence: 0.7, reasons: ['screen_error'], messages: [tr('l8.int.screenError')] });
  if (neg) return finish(ctx.kind, { ...base, outcome: ctx.kind === 'ovulation' ? 'lh_peak_not_detected' : 'possibly_negative', confidence: 0.8, reasons: ['screen_negative'], messages: [tr('l8.int.screenNeg')] });
  if (pos) return finish(ctx.kind, { ...base, outcome: ctx.kind === 'ovulation' ? 'lh_peak_possible' : 'possibly_positive', confidence: 0.8, reasons: ['screen_positive'], messages: [tr('l8.int.screenPos')] });
  return finish(ctx.kind, { ...base, outcome: 'unusable', confidence: 0, reasons: ['ocr_unrecognised'], messages: [tr('l8.int.ocrUnrecognised')] });
}

/** Lecture faite par l'utilisatrice (croix, smiley, ou analyse automatique impossible). */
export function manualReading(outcome: TestOutcome, ctx: TestContext): TestAnalysis {
  const rule = findRule(ctx.ruleId);
  const timing = timingProblem(ctx, rule);
  if (timing && outcome !== 'invalid') {
    return finish(ctx.kind, { method: 'manual', rule, quality: null, scan: null, outcome: 'uncertain', confidence: 0.2, reasons: [`read_too_${timing}`], messages: [timing === 'late' ? LATE_MESSAGE : EARLY_MESSAGE] });
  }
  return finish(ctx.kind, { method: 'manual', rule, quality: null, scan: null, outcome, confidence: outcome === 'uncertain' ? 0.2 : 0.6, reasons: ['manual_reading'], messages: [tr('l8.int.manual')] });
}

/** Correspondance avec la colonne « result » historique (résultat confirmé par l'utilisatrice). */
export function storedResult(kind: TestKind, outcome: TestOutcome): string {
  if (kind === 'ovulation') return outcome === 'lh_peak_possible' ? 'positive' : outcome === 'lh_peak_not_detected' ? 'negative' : outcome === 'invalid' ? 'invalid' : 'uncertain';
  return outcome === 'possibly_positive' ? 'positive' : outcome === 'possibly_negative' ? 'negative' : outcome === 'invalid' ? 'invalid' : 'uncertain';
}

export function outcomesFor(kind: TestKind): TestOutcome[] {
  return kind === 'ovulation'
    ? ['lh_peak_possible', 'lh_peak_not_detected', 'invalid', 'uncertain', 'unusable']
    : ['possibly_positive', 'possibly_negative', 'invalid', 'uncertain', 'unusable'];
}
