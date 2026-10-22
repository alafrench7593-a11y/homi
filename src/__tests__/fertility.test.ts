/**
 * Parcours fertilité : calculs du cycle (toujours des estimations), règles éditoriales
 * (aucun jour « sans risque », aucune grossesse garantie) et confidentialité en mode démonstration.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import {
  avoidDayKind, avoidMargin, bbtSeries, consultationGuidance, conceptionDayKind, currentCycleDay, cycleDayKind, cycleHistory,
  estimateCycle, monthGrid, parseTemperature, projectFertileWindows, upcomingWindow,
} from '@/lib/domain/cycle';
import { addDays } from '@/lib/domain/dates';
import { createDemoBackend } from '@/lib/backend/demo';
import * as content from '@/content/fertility';

const TODAY = '2026-10-16';
// Cycles réguliers de 28 jours ; dernières règles le 2026-10-05
const regular = ['2026-07-13', '2026-08-10', '2026-09-07', '2026-10-05'].map((start_date) => ({ start_date, end_date: addDays(start_date, 4) }));

describe('cycle : exports existants inchangés', () => {
  it('estimateCycle et cycleDayKind fonctionnent toujours', () => {
    const est = estimateCycle(regular, TODAY);
    expect(est.averageLength).toBe(28);
    expect(est.nextPeriod).toBe('2026-11-02');
    expect(est.ovulation).toBe('2026-10-19');
    expect(est.fertileWindow).toEqual({ start: '2026-10-14', end: '2026-10-20' });
    expect(cycleDayKind('2026-10-19', regular, est)).toBe('ovulation_estimate');
    expect(est.caveats.join(' ')).toMatch(/estimations/);
  });
});

describe('historique et jour du cycle', () => {
  it('liste les cycles du plus récent au plus ancien, avec durées et ovulation estimée a posteriori', () => {
    const h = cycleHistory(regular, TODAY);
    expect(h).toHaveLength(4);
    expect(h[0]).toMatchObject({ start: '2026-10-05', current: true, length: null });
    expect(h[1]).toMatchObject({ start: '2026-09-07', end: '2026-10-04', length: 28, periodLength: 5, ovulationEstimate: '2026-09-21', current: false, unusual: false });
  });

  it('signale un cycle inhabituel (saisie à vérifier) et ignore les règles futures', () => {
    const h = cycleHistory([{ start_date: '2026-01-01' }, { start_date: '2026-04-15' }, { start_date: '2026-12-01' }], TODAY);
    expect(h).toHaveLength(2);
    expect(h[1].unusual).toBe(true);
  });

  it('jour du cycle', () => {
    expect(currentCycleDay(regular, TODAY)).toBe(12);
    expect(currentCycleDay([], TODAY)).toBeNull();
  });
});

describe('parcours « concevoir » : fenêtres estimées', () => {
  const est = estimateCycle(regular, TODAY);
  const windows = projectFertileWindows(est, 3);

  it('projette la fenêtre du cycle en cours et des suivants', () => {
    expect(windows.map((w) => w.ovulation)).toEqual(['2026-10-19', '2026-11-16', '2026-12-14']);
    expect(windows[0]).toMatchObject({ start: '2026-10-14', end: '2026-10-20', higherStart: '2026-10-17', higherEnd: '2026-10-19', nextPeriod: '2026-11-02' });
    expect(upcomingWindow(windows, '2026-10-21')?.ovulation).toBe('2026-11-16');
  });

  it('distingue les jours où les chances peuvent être plus élevées (toutes des estimations)', () => {
    const k = (d: string) => conceptionDayKind(d, regular, windows, TODAY);
    expect(k('2026-10-06')).toBe('period');
    expect(k('2026-10-16')).toBe('fertile_estimate');
    expect(k('2026-10-17')).toBe('higher_chance_estimate');
    expect(k('2026-10-19')).toBe('ovulation_estimate');
    expect(k('2026-10-20')).toBe('fertile_estimate');
    expect(k('2026-10-25')).toBeNull();
    expect(k('2026-11-03')).toBe('next_period_estimate');
    expect(k('2026-09-21')).toBeNull(); // pas d'estimation projetée dans le passé
  });

  it('aucune projection sans règles saisies', () => {
    expect(projectFertileWindows(estimateCycle([], TODAY))).toEqual([]);
  });
});

describe('parcours « éviter une grossesse » : aucun jour sûr', () => {
  const est = estimateCycle(regular, TODAY);
  const windows = projectFertileWindows(est, 3);
  const margin = avoidMargin(est);

  it('élargit la période à probabilité plus élevée avec une marge', () => {
    expect(margin).toBeGreaterThanOrEqual(2);
    expect(avoidMargin(estimateCycle([{ start_date: '2026-10-05' }], TODAY))).toBe(4);
    const irregular = ['2026-05-01', '2026-05-24', '2026-06-30', '2026-07-22', '2026-08-30'].map((start_date) => ({ start_date }));
    expect(avoidMargin(estimateCycle(irregular, TODAY))).toBeGreaterThan(margin);
  });

  it('chaque jour reste « grossesse possible » au minimum — jamais exempt de risque', () => {
    const allowed = ['period', 'next_period_estimate', 'ovulation_estimate', 'higher_probability_estimate', 'pregnancy_possible'];
    for (let i = -60; i < 120; i++) {
      const d = addDays(TODAY, i);
      expect(allowed).toContain(avoidDayKind(d, regular, windows, margin, TODAY));
    }
    expect(avoidDayKind('2026-10-27', regular, windows, margin, TODAY)).toBe('pregnancy_possible');
    // cycle suivant : fenêtre estimée du 11 au 17 novembre, élargie de la marge
    expect(avoidDayKind(addDays('2026-11-11', -margin), regular, windows, margin, TODAY)).toBe('higher_probability_estimate');
    expect(avoidDayKind(addDays('2026-11-17', margin), regular, windows, margin, TODAY)).toBe('higher_probability_estimate');
    expect(avoidDayKind(addDays('2026-11-11', -margin - 1), regular, windows, margin, TODAY)).toBe('pregnancy_possible');
    // passé : aucune estimation rétroactive, le jour reste « grossesse possible »
    expect(avoidDayKind('2026-10-12', regular, windows, margin, TODAY)).toBe('pregnancy_possible');
    expect(avoidDayKind('2026-10-19', regular, windows, margin, TODAY)).toBe('ovulation_estimate');
  });
});

describe('outils', () => {
  it('grille du mois commençant un lundi', () => {
    const g = monthGrid(2026, 9); // octobre 2026 : le 1er est un jeudi
    expect(g[0]).toBe('2026-09-28');
    expect(g.length % 7).toBe(0);
    expect(g).toContain('2026-10-31');
  });

  it('température : saisie française et série descriptive', () => {
    expect(parseTemperature('36,55')).toBe(36.55);
    expect(parseTemperature('36.7')).toBe(36.7);
    expect(parseTemperature('42')).toBeNull();
    expect(parseTemperature('abc')).toBeNull();
    const s = bbtSeries([
      { observed_on: '2026-10-10', bbt_celsius: '36.70' },
      { observed_on: '2026-10-08', bbt_celsius: 36.4 },
      { observed_on: '2026-10-09', bbt_celsius: null },
      { observed_on: '2026-01-01', bbt_celsius: 36.5 },
    ], 60, TODAY);
    expect(s.map((p) => [p.date, p.y])).toEqual([['2026-10-08', 36.4], ['2026-10-10', 36.7]]);
    expect(s[1].x - s[0].x).toBe(2);
  });

  it('repères de consultation : 12 mois, 6 mois à partir de 35 ans, plus tôt si besoin — sans diagnostic', () => {
    expect(consultationGuidance({ age: 30, monthsTrying: 8, irregularCycles: false, knownCondition: false })).toMatchObject({ thresholdMonths: 12, suggestTalkingNow: false });
    expect(consultationGuidance({ age: 30, monthsTrying: 12, irregularCycles: false, knownCondition: false }).suggestTalkingNow).toBe(true);
    expect(consultationGuidance({ age: 36, monthsTrying: 6, irregularCycles: false, knownCondition: false })).toMatchObject({ thresholdMonths: 6, suggestTalkingNow: true });
    expect(consultationGuidance({ age: null, monthsTrying: 1, irregularCycles: true, knownCondition: false }).suggestTalkingNow).toBe(true);
    const all = consultationGuidance({ age: 41, monthsTrying: 12, irregularCycles: true, knownCondition: true }).reasons.join(' ');
    expect(all).not.toMatch(/infertil|stérile|diagnosti/i);
  });
});

// ---------------------------------------------------------------- règles éditoriales
// Modules Node chargés à l'exécution (le projet n'embarque pas @types/node) : types minimaux.
interface Dirent { name: string; isDirectory(): boolean }
const fs = require('fs') as { readdirSync(p: string, o: { withFileTypes: true }): Dirent[]; readFileSync(p: string, enc: 'utf8'): string };
const path = require('path') as { join(...p: string[]): string; relative(a: string, b: string): string; sep: string };
declare const __dirname: string;
const ROOT = path.join(__dirname, '..');
function filesOf(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? filesOf(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
const SOURCES = [
  ...filesOf(path.join(ROOT, 'app/fertility')),
  ...filesOf(path.join(ROOT, 'app/contraception')),
  path.join(ROOT, 'components/Fertility.tsx'),
  path.join(ROOT, 'content/fertility.ts'),
  path.join(ROOT, 'lib/domain/cycle.ts'),
];
const NEGATION = /\b(aucun|aucune|jamais|n[’']|ne\b|pas\b|sans garantie|non\b|ni\b)/i;
/** Lignes contenant `pattern` sans aucune négation (formulation rassurante). */
function reassuring(pattern: RegExp): string[] {
  return SOURCES.flatMap((f) => fs.readFileSync(f, 'utf8').split('\n')
    .filter((l) => pattern.test(l) && !NEGATION.test(l))
    .map((l) => `${path.relative(ROOT, f)} : ${l.trim()}`));
}

describe('règles éditoriales', () => {
  it('les fichiers des deux parcours existent', () => {
    expect(SOURCES.some((f) => f.endsWith(path.join('fertility', 'index.tsx')))).toBe(true);
    expect(SOURCES.some((f) => f.endsWith(path.join('contraception', 'index.tsx')))).toBe(true);
  });

  it('aucun écran ni texte ne présente un jour « sans risque » ou « sûr »', () => {
    expect(reassuring(/sans\s+risque|jours?\s+s[ûu]rs?\b|p[ée]riode\s+s[ûu]re|z[ée]ro\s+risque|safe\s+days?|risque\s+nul|sans\s+danger/i)).toEqual([]);
  });

  it('aucune grossesse n’est « garantie »', () => {
    expect(reassuring(/garanti/i)).toEqual([]);
  });

  it('les messages clés rappellent que la grossesse reste possible et qu’une contraception est nécessaire', () => {
    expect(content.AVOID_DISCLAIMER).toMatch(/grossesse reste possible/);
    expect(content.AVOID_DISCLAIMER).toMatch(/contraception adaptée est nécessaire/);
    expect(content.TTC_DISCLAIMER).toMatch(/estimations/);
    expect(content.TTC_DISCLAIMER).toMatch(/ne garantissent jamais/);
  });

  it('les libellés de dates d’ovulation et de fenêtre fertile sont marqués « estimation »', () => {
    const offenders = SOURCES.filter((f) => f.includes(`${path.sep}app${path.sep}`)).flatMap((f) => fs.readFileSync(f, 'utf8').split('\n')
      .filter((l) => /label[:=]\s*['"`{]/.test(l) && /ovulation|fenêtre fertile|chances|probabilité/i.test(l) && !/estim/i.test(l))
      .map((l) => `${path.relative(ROOT, f)} : ${l.trim()}`));
    expect(offenders).toEqual([]);
  });

  it('contraception d’urgence : délais publics et orientation vers un professionnel', () => {
    const txt = JSON.stringify([content.EMERGENCY_OPTIONS, content.EMERGENCY_FACTS]);
    expect(txt).toMatch(/72 heures/);
    expect(txt).toMatch(/120 heures/);
    expect(txt).toMatch(/5 jours/);
    expect(txt).toMatch(/sans ordonnance/);
    expect(txt).toMatch(/2023/);
    expect(txt).toMatch(/pharmacien/);
    expect(txt).not.toMatch(/\d+\s?mg/); // aucune posologie
  });

  it('les méthodes naturelles affichent leurs limites en utilisation courante', () => {
    const natural = content.CONTRACEPTION_METHODS.find((m) => m.kind === 'natural')!;
    expect(natural.typicalUse).toMatch(/20 à 25/);
    expect(natural.goodToKnow.join(' ')).toMatch(/n’est pas une méthode de contraception/);
  });
});

// ---------------------------------------------------------------- moteur local
describe('mode démonstration : données intimes', () => {
  const db = createDemoBackend();

  it('rapports et observations : propres au compte, une observation par jour, présents dans l’export personnel', async () => {
    await db.auth.signUp('ines@exemple.test', 'MotDePasse!2026');
    const me = (await db.auth.getSession())!.userId;
    // Suivi intime : uniquement après activation volontaire
    await expect(db.insert('intercourse_logs', { occurred_on: '2026-10-15' })).rejects.toMatchObject({ hint: 'intimate_optin_required' });
    await db.insert('cycle_preferences', { user_id: me, track_intercourse: true }, { onConflict: 'user_id' });
    await db.insert('intercourse_logs', { occurred_on: '2026-10-15' });
    await db.insert('fertility_observations', { user_id: me, observed_on: '2026-10-15', bbt_celsius: 36.4, cervical_mucus: null, note: null }, { onConflict: 'user_id,observed_on' });
    await db.insert('fertility_observations', { user_id: me, observed_on: '2026-10-15', bbt_celsius: 36.6, cervical_mucus: 'creamy', note: null }, { onConflict: 'user_id,observed_on' });
    const obs = await db.select<{ bbt_celsius: number; cervical_mucus: string }>({ table: 'fertility_observations' });
    expect(obs).toHaveLength(1);
    expect(obs[0]).toMatchObject({ bbt_celsius: 36.6, cervical_mucus: 'creamy' });
    const exp = await db.rpc<{ personal: Record<string, unknown[]> }>('export_my_data');
    expect(exp.personal.intercourse_logs).toHaveLength(1);

    await db.auth.signOut();
    await db.auth.signUp('autre@exemple.test', 'MotDePasse!2026');
    expect(await db.select({ table: 'intercourse_logs' })).toHaveLength(0);
    expect(await db.select({ table: 'fertility_observations' })).toHaveLength(0);
  });
});
