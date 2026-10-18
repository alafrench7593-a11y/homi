/** Suivi de l'enfant : chronomètre, repères de sécurité (quand consulter), plan médical — jamais de dose ni de diagnostic. */
const fs = require('fs') as { readdirSync(p: string): string[]; readFileSync(p: string, enc: 'utf8'): string };
import { CHILD_SOURCES, SAFE_SLEEP } from '@/content/childSafety';
import { PRIMARY_TEETH, bottleElapsed, digestionNotices, formatChrono, planCheck, resumePatch, stoolNotice } from '@/lib/domain/childCare';

const T0 = new Date('2026-10-18T10:00:00Z');
const at = (min: number) => new Date(T0.getTime() + min * 60000).toISOString();

describe('chronomètre de biberon', () => {
  it('temps écoulé recalculé depuis les horodatages (fermeture de l’app comprise)', () => {
    expect(bottleElapsed({ started_at: at(0), paused_at: null, paused_seconds: 0, ended_at: null }, new Date(at(7)))).toBe(420);
  });
  it('pause figée, reprise ajoutant la durée de pause', () => {
    const paused = { started_at: at(0), paused_at: at(5), paused_seconds: 0, ended_at: null };
    expect(bottleElapsed(paused, new Date(at(30)))).toBe(300);
    const r = resumePatch(paused, new Date(at(8)));
    expect(r).toEqual({ paused_at: null, paused_seconds: 180 });
    expect(bottleElapsed({ ...paused, ...r }, new Date(at(10)))).toBe(420);
  });
  it('fin : durée fixe, format mm:ss', () => {
    expect(bottleElapsed({ started_at: at(0), paused_at: null, paused_seconds: 60, ended_at: at(12) })).toBe(660);
    expect(formatChrono(660)).toBe('11:00');
  });
});

describe('repères de sécurité', () => {
  const NO_DIAG = /(atr[ée]sie|allergie|infection|maladie|cholestase|votre enfant a |diagnostic)/i;
  it('selles pâles : urgence, sans nommer de maladie', () => {
    const n = stoolNotice({ stool_color: 'pale' })!;
    expect(n.level).toBe('urgent');
    expect(`${n.title} ${n.body}`).toMatch(/15/);
    expect(`${n.title} ${n.body}`).not.toMatch(NO_DIAG);
  });
  it('sang, selles noires ou rouges : consulter sans attendre', () => {
    for (const d of [{ blood_seen: true }, { stool_color: 'black' as const }, { stool_color: 'red' as const }]) expect(stoolNotice(d)?.level).toBe('soon');
    expect(stoolNotice({ stool_color: 'yellow' })).toBeNull();
  });
  it('fièvre ≥ 38 °C avant 3 mois → urgence ; pas à 8 mois', () => {
    const obs = [{ at: at(-60), kind: 'temperature', value_num: 38.2 }];
    expect(digestionNotices({ now: T0, ageMonths: 2, observations: obs, diapers: [] })[0].level).toBe('urgent');
    expect(digestionNotices({ now: T0, ageMonths: 8, observations: obs, diapers: [] })).toEqual([]);
  });
  it('vomissements répétés en 24 h → surveiller l’hydratation', () => {
    const obs = [-60, -120, -300].map((m) => ({ at: at(m), kind: 'vomit' }));
    const n = digestionNotices({ now: T0, ageMonths: 10, observations: obs, diapers: [] });
    expect(n[0].source).toBe('dehydration');
    expect(JSON.stringify(n)).not.toMatch(NO_DIAG);
  });
  it('moins de couches mouillées : seulement s’il y a assez d’historique', () => {
    const wet = (h: number) => ({ at: new Date(T0.getTime() - h * 3600000).toISOString(), wet: true });
    const history = [25, 30, 35, 40, 50, 55, 60, 65, 75, 80, 85, 90].map(wet);
    expect(digestionNotices({ now: T0, ageMonths: 5, observations: [], diapers: [...history, wet(2)] }).some((x) => x.title.startsWith('Moins'))).toBe(true);
    expect(digestionNotices({ now: T0, ageMonths: 5, observations: [], diapers: [wet(2)] })).toEqual([]);
  });
  it('sources officielles ou médicales pour chaque repère', () => {
    for (const s of Object.values(CHILD_SOURCES)) expect(s.url).toMatch(/^https:\/\//);
    expect(SAFE_SLEEP[0]).toMatch(/sur le dos/);
  });
});

describe('suivi de santé : seulement le plan du professionnel', () => {
  const plan = { kind: 'measure' as const, low_threshold: 0.7, high_threshold: 1.8, thresholds_from_plan: true, plan_by: 'Dr Martin' };
  it('sans plan, aucune interprétation', () => {
    expect(planCheck({ ...plan, thresholds_from_plan: false }, 3).status).toBe('no_plan');
  });
  it('hors repères : renvoie au plan et à l’équipe, jamais une dose', () => {
    const r = planCheck(plan, 2.4);
    expect(r.status).toBe('above');
    expect(r.message).toMatch(/plan/);
    expect(r.message).not.toMatch(/(unit[ée]s? d|dose|injecte|augmente|diminue|insuline|resucr)/i);
    expect(planCheck(plan, 1.1).status).toBe('within');
  });
  it('aucun écran ni aucune logique ne calcule une dose', () => {
    const files = ['src/lib/domain/childCare.ts', ...fs.readdirSync('src/app/child/[id]').map((f) => `src/app/child/[id]/${f}`)];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      expect(src).not.toMatch(/(doseFor|computeDose|insulinDose|ml\s*\/\s*kg|mg\s*\/\s*kg)/i);
    }
  });
});

describe('dents de lait', () => {
  it('20 dents, 10 par arcade', () => {
    expect(PRIMARY_TEETH).toHaveLength(20);
    expect(PRIMARY_TEETH.filter((t) => t.arch === 'top')).toHaveLength(10);
    expect(new Set(PRIMARY_TEETH.map((t) => t.label)).size).toBe(20);
  });
});
