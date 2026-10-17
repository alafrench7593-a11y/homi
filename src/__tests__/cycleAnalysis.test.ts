/**
 * Module d'analyse des tests (images de synthèse) : positif, négatif, invalide, ligne très pâle,
 * photo sombre, photo floue, photo trop tardive, test inconnu, tests numériques.
 */
import { synthTest } from './helpers/syntheticTest';
import {
  analyseDigitalText, analyseLineTest, manualReading, OUTCOME_LABEL, PREGNANCY_POSITIVE_MESSAGE, OVULATION_REMINDER,
  LATE_MESSAGE, UNKNOWN_TEST_MESSAGE, storedResult, type TestContext,
} from '@/lib/cycleAnalysis/interpret';
import { TEST_RULES, findRule } from '@/lib/cycleAnalysis/brands';
import { assessQuality } from '@/lib/cycleAnalysis/quality';
import { scanLines } from '@/lib/cycleAnalysis/lines';

const LH: TestContext = { kind: 'ovulation', ruleId: 'one-step-lh-strip', format: 'lines', minutesElapsed: 5, withinReadWindow: 'yes' };
const HCG: TestContext = { kind: 'pregnancy', ruleId: 'clearblue-detection-precoce', format: 'lines', minutesElapsed: 4, withinReadWindow: 'yes' };
const HCG_PINK: TestContext = { ...HCG, ruleId: 'first-response-early-result' };

const allText = (a: { messages: string[] }) => a.messages.join(' ');

describe('détection des lignes', () => {
  it('trouve la ligne de contrôle et la ligne de test, y compris sur un test incliné', () => {
    for (const angle of [0, 25, -40, 90]) {
      const { img, c, t } = synthTest({ control: 1, test: 0.9, angle });
      const s = scanLines(img, c, t);
      expect(s.control).not.toBeNull();
      expect(s.test).not.toBeNull();
      expect(s.control!.position).toBeLessThan(0.5);
      expect(s.test!.position).toBeGreaterThan(0.5);
    }
  });
  it('fonctionne avec des lignes bleues', () => {
    const { img, c, t } = synthTest({ control: 1, test: 0.6, colour: 'blue' });
    const s = scanLines(img, c, t);
    expect(s.control && s.test).toBeTruthy();
  });
});

describe('test d’ovulation (règle : ligne de test ≥ contrôle)', () => {
  it('test positif → Pic de LH possible, avec rappel que l’ovulation n’est pas prouvée', () => {
    const { img, c, t } = synthTest({ control: 0.6, test: 1 });
    const a = analyseLineTest(img, c, t, LH);
    expect(a.outcome).toBe('lh_peak_possible');
    expect(a.confidence).toBeGreaterThan(0.5);
    expect(a.messages).toContain(OVULATION_REMINDER);
    expect(a.needsConfirmation).toBe(true);
  });
  it('test négatif (ligne de test plus claire) → Pic de LH non détecté', () => {
    const { img, c, t } = synthTest({ control: 1, test: 0.35 });
    expect(analyseLineTest(img, c, t, LH).outcome).toBe('lh_peak_not_detected');
  });
  it('contrôle seul → Pic de LH non détecté', () => {
    const { img, c, t } = synthTest({ control: 1, test: 0 });
    expect(analyseLineTest(img, c, t, LH).outcome).toBe('lh_peak_not_detected');
  });
  it('intensités presque égales → Résultat incertain (pas de décision automatique)', () => {
    const { img, c, t } = synthTest({ control: 1, test: 0.95 });
    const a = analyseLineTest(img, c, t, LH);
    expect(a.outcome).toBe('uncertain');
    expect(a.confidence).toBeLessThan(0.5);
  });
  it('test invalide (pas de ligne de contrôle)', () => {
    const { img, c, t } = synthTest({ control: 0, test: 1 });
    expect(analyseLineTest(img, c, t, LH).outcome).toBe('invalid');
  });
});

describe('test de grossesse à lignes (toute ligne de test compte)', () => {
  it('test positif → Résultat possiblement positif, jamais « Vous êtes enceinte »', () => {
    const { img, c, t } = synthTest({ control: 1, test: 0.7, colour: 'blue' });
    const a = analyseLineTest(img, c, t, HCG);
    expect(a.outcome).toBe('possibly_positive');
    expect(a.messages[0]).toBe(PREGNANCY_POSITIVE_MESSAGE);
    expect(allText(a)).not.toMatch(/vous êtes enceinte/i);
    expect(OUTCOME_LABEL[a.outcome]).toBe('Résultat possiblement positif');
  });
  it('test négatif → Résultat possiblement négatif', () => {
    const { img, c, t } = synthTest({ control: 1, test: 0 });
    expect(analyseLineTest(img, c, t, HCG_PINK).outcome).toBe('possibly_negative');
  });
  it('test invalide → Test invalide', () => {
    const { img, c, t } = synthTest({ control: 0, test: 0 });
    expect(analyseLineTest(img, c, t, HCG_PINK).outcome).toBe('invalid');
  });
  it('ligne très pâle → Résultat incertain, confiance faible', () => {
    const { img, c, t } = synthTest({ control: 1, test: 0.12, noise: 1.5 });
    const a = analyseLineTest(img, c, t, HCG_PINK);
    expect(a.outcome).toBe('uncertain');
    expect(a.reasons).toContain('faint_test_line');
    expect(a.confidence).toBeLessThan(0.5);
  });
});

describe('qualité de la photo', () => {
  it('photo sombre → Photo inexploitable, sans résultat proposé', () => {
    const { img, c, t } = synthTest({ control: 1, test: 1, light: 0.18 });
    const a = analyseLineTest(img, c, t, HCG);
    expect(a.outcome).toBe('unusable');
    expect(a.reasons).toContain('quality:too_dark');
    expect(a.confidence).toBe(0);
  });
  it('photo floue → Photo inexploitable', () => {
    const { img, c, t } = synthTest({ control: 1, test: 1, blur: 9 });
    const a = analyseLineTest(img, c, t, LH);
    expect(a.outcome).toBe('unusable');
    expect(a.reasons).toContain('quality:blurry');
  });
  it('photo nette et bien éclairée → qualité correcte', () => {
    const { img } = synthTest({ control: 1, test: 0.5 });
    const q = assessQuality(img);
    expect(q.ok).toBe(true);
    expect(q.score).toBeGreaterThan(0.6);
  });
});

describe('délai de lecture', () => {
  it('photo prise trop tard → Résultat incertain (ligne d’évaporation possible), même si une ligne est visible', () => {
    const { img, c, t } = synthTest({ control: 1, test: 0.8 });
    const late = analyseLineTest(img, c, t, { ...HCG, minutesElapsed: 25, withinReadWindow: 'yes' });
    expect(late.outcome).toBe('uncertain');
    expect(late.messages).toContain(LATE_MESSAGE);
    const declared = analyseLineTest(img, c, t, { ...HCG, minutesElapsed: null, withinReadWindow: 'no' });
    expect(declared.outcome).toBe('uncertain');
  });
  it('bandelette LH lue à 6 minutes (notice : 5 minutes) → incertain', () => {
    const { img, c, t } = synthTest({ control: 0.6, test: 1 });
    expect(analyseLineTest(img, c, t, { ...LH, minutesElapsed: 6 }).outcome).toBe('uncertain');
  });
  it('photo trop tôt → incertain', () => {
    const { img, c, t } = synthTest({ control: 1, test: 0 });
    expect(analyseLineTest(img, c, t, { ...HCG, minutesElapsed: 1 }).reasons).toContain('read_too_early');
  });
  it('délai inconnu → résultat proposé mais confiance réduite', () => {
    const { img, c, t } = synthTest({ control: 0.6, test: 1 });
    const known = analyseLineTest(img, c, t, LH);
    const unknown = analyseLineTest(img, c, t, { ...LH, minutesElapsed: null, withinReadWindow: 'unknown' });
    expect(unknown.confidence).toBeLessThan(known.confidence);
  });
});

describe('niveau de confiance avant validation sur de vraies photos', () => {
  it('ne dépasse jamais « moyen », même pour une photo parfaite', () => {
    const { img, c, t } = synthTest({ control: 0.5, test: 1, noise: 0.5 });
    const a = analyseLineTest(img, c, t, LH);
    expect(a.confidence).toBeLessThan(0.75);
  });
});

describe('cadrage', () => {
  it('cadrage absent, hors image ou trop court → Photo inexploitable (jamais « invalide »)', () => {
    const { img, c, t } = synthTest({ control: 1, test: 1 });
    expect(analyseLineTest(img, { x: NaN, y: NaN }, t, LH).outcome).toBe('unusable');
    expect(analyseLineTest(img, c, { x: c.x + 3, y: c.y }, LH).reasons).toContain('bad_crop');
    expect(analyseLineTest(img, { x: -50, y: 10 }, t, LH).outcome).toBe('unusable');
  });
  it('« invalide » ne dépasse jamais une confiance moyenne (un mauvais cadrage peut en être la cause)', () => {
    const { img, c, t } = synthTest({ control: 0, test: 0 });
    expect(analyseLineTest(img, c, t, HCG).confidence).toBeLessThanOrEqual(0.7);
  });
});

describe('test inconnu', () => {
  it('aucun résultat proposé pour un test hors de la liste', () => {
    const { img, c, t } = synthTest({ control: 1, test: 1 });
    const a = analyseLineTest(img, c, t, { ...HCG, ruleId: 'marque-inconnue' });
    expect(a.outcome).toBe('uncertain');
    expect(a.messages).toContain(UNKNOWN_TEST_MESSAGE);
    expect(a.reasons).toContain('unknown_test');
  });
});

describe('tests numériques (texte lu sur l’appareil)', () => {
  const DIG: TestContext = { kind: 'pregnancy', ruleId: 'clearblue-ultra-precoce-digital', format: 'digital', minutesElapsed: 4, withinReadWindow: 'yes' };
  it('« Pas Enceinte » → possiblement négatif (pas confondu avec « Enceinte »)', () => {
    expect(analyseDigitalText('Pas\nEnceinte', DIG).outcome).toBe('possibly_negative');
  });
  it('« Enceinte » → possiblement positif avec le message prudent', () => {
    const a = analyseDigitalText('Enceinte', DIG);
    expect(a.outcome).toBe('possibly_positive');
    expect(a.messages[0]).toBe(PREGNANCY_POSITIVE_MESSAGE);
  });
  it('écran flou / texte illisible → Photo inexploitable, aucun résultat inventé', () => {
    expect(analyseDigitalText('', DIG).outcome).toBe('unusable');
    expect(analyseDigitalText('~#', DIG).outcome).toBe('unusable');
    expect(analyseDigitalText('Clearblue 12:30', DIG).outcome).toBe('unusable');
  });
  it('symbole d’erreur → Test invalide', () => {
    expect(analyseDigitalText('! Erreur', DIG).outcome).toBe('invalid');
  });
});

describe('lecture manuelle et liste des tests', () => {
  it('lecture manuelle après le délai → incertain', () => {
    expect(manualReading('possibly_positive', { kind: 'pregnancy', ruleId: 'clearblue-detection-rapide', format: 'cross', minutesElapsed: 30, withinReadWindow: 'no' }).outcome).toBe('uncertain');
  });
  it('chaque test compatible a une source, une date et des règles', () => {
    for (const r of TEST_RULES) {
      expect(r.source.url).toMatch(/^https:\/\//);
      expect(r.source.consultedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.readingRules.length).toBeGreaterThan(0);
      if (r.mode === 'lines_auto') expect(r.positiveRule).toBeDefined();
      if (r.mode === 'manual_only') expect(r.manualOptions?.length).toBeGreaterThan(0);
    }
    expect(findRule('nimporte')).toBeNull();
  });
  it('le résultat stocké reflète la confirmation', () => {
    expect(storedResult('ovulation', 'lh_peak_possible')).toBe('positive');
    expect(storedResult('pregnancy', 'unusable')).toBe('uncertain');
  });
});
