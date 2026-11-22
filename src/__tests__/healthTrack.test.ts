/**
 * Santé et soins (22/11/2026) : observations de l'enfant (température, symptômes), prises de médicament et humeur sur
 * une échelle. Une seule donnée source ; jour sans saisie = « rien de noté » (null), jamais 0 ; aucune moyenne
 * d'humeur ; une correction n'envoie que ce qui change et ne touche jamais une dose.
 */
import {
  doseDay, observationPatch, observationsByDay, recentTemperature, scaleByDay, scaleCounts, takenAt, takenTime, tempValue,
  temperaturePoints, type ObsLike,
} from '@/lib/domain/healthTrack';
import { editGuards } from '@/lib/domain/quickTrack';

const at = (day: number, h: number, m: number) => new Date(2026, 10, day, h, m).toISOString();
const NOW = new Date(2026, 10, 23, 15, 20);
const o = (id: string, day: number, h: number, m: number, x: Partial<ObsLike> = {}): ObsLike =>
  ({ id, child_id: 'lina', at: at(day, h, m), kind: 'temperature', value_num: null, label: null, ...x });
const obs: ObsLike[] = [
  o('t1', 23, 8, 0, { value_num: 38.4, temp_method: 'axillary' }),
  o('t2', 23, 14, 20, { value_num: '37,9' }),
  o('t3', 22, 21, 0, { value_num: 38.1 }),
  o('s1', 23, 9, 15, { kind: 'symptom', label: 'Nez qui coule' }),
  o('v1', 20, 10, 0, { kind: 'vomit', intensity: 2 }),
  { id: 'noe', child_id: 'noe', at: at(23, 15, 0), kind: 'temperature', value_num: 39, label: null },
];

describe('observations', () => {
  it('température lisible telle que notée (virgule acceptée), sinon null — jamais une valeur inventée', () => {
    expect(tempValue(obs[0])).toBe(38.4);
    expect(tempValue(obs[1])).toBe(37.9);
    expect(tempValue(obs[3])).toBeNull();
    expect(tempValue({ kind: 'temperature', value_num: null })).toBeNull();
    expect(tempValue({ kind: 'temperature', value_num: 12 })).toBeNull();
  });
  it('par jour : jour sans observation = null (« rien de noté »), autre enfant exclu, plus récente en tête', () => {
    const days = observationsByDay(obs, 'lina', NOW, 7);
    expect(days).toHaveLength(7);
    expect(days[6].count).toBe(3);
    expect(days[6].entries.map((e) => e.id)).toEqual(['t2', 's1', 't1']);
    expect(days[5].count).toBe(1);
    expect(days[4].count).toBeNull();
    expect(days[3].count).toBe(1);
    expect(days.flatMap((d) => d.entries).some((e) => e.child_id === 'noe')).toBe(false);
  });
  it('dernière température récente (accueil / catégorie) : la plus récente de cet enfant, rien au-delà de la fenêtre', () => {
    expect(recentTemperature(obs, 'lina', NOW, 24)?.id).toBe('t2');
    expect(recentTemperature(obs, 'lina', new Date(2026, 10, 25, 15, 0), 24)).toBeNull();
    expect(recentTemperature(obs, 'noe', NOW, 24)?.id).toBe('noe');
  });
  it('courbe : un point par prise RÉELLE à son instant exact (deux prises le même jour restent distinctes)', () => {
    const pts = temperaturePoints(obs, 'lina', (x) => x.temp_method ?? null);
    expect(pts.map((p) => p.id)).toEqual(['t3', 't1', 't2']);
    expect(pts[1].x).toBe(Date.parse(at(23, 8, 0)));
    expect(pts[1].date).toBe('2026-11-23');
    expect(pts[1].note).toBe('axillary');
    expect(pts.every((p) => Number.isFinite(p.y) && p.y > 30)).toBe(true);
  });
  it('correction : seuls les champs modifiés ; hors bornes, heure absente ou libellé vide → rien', () => {
    expect(observationPatch(obs[0], { at: new Date(at(23, 8, 0)), temp: 38.4 })).toEqual({});
    expect(observationPatch(obs[0], { at: new Date(at(23, 8, 10)), temp: 38.2 })).toEqual({ at: at(23, 8, 10), value_num: 38.2 });
    expect(observationPatch(obs[0], { at: new Date(at(23, 8, 0)), temp: 47 })).toBeNull();
    expect(observationPatch(obs[0], { at: null, temp: 38 })).toBeNull();
    expect(observationPatch(obs[3], { at: new Date(at(23, 9, 15)), label: '  ' })).toBeNull();
    expect(observationPatch(obs[3], { at: new Date(at(23, 9, 15)), label: 'Toux' })).toEqual({ label: 'Toux' });
    expect(observationPatch(obs[4], { at: new Date(at(20, 10, 0)), intensity: 3 })).toEqual({ intensity: 3 });
  });
  it('garde F-05 : la correction ne passe que si la valeur d’origine est inchangée', () => {
    const patch = observationPatch(obs[0], { at: new Date(at(23, 8, 0)), temp: 38.6 })!;
    expect(editGuards(patch, obs[0] as unknown as Record<string, unknown>)).toEqual([{ col: 'value_num', op: 'eq', value: 38.4 }]);
  });
});

describe('prises de médicament', () => {
  const sched = (h: number) => at(23, h, 0);
  it('journée avec prises prévues et aucune réponse = « rien de noté » (null), jamais 0 prise', () => {
    expect(doseDay([{ scheduledFor: sched(8), log: null }, { scheduledFor: sched(20), log: null }])).toEqual({ planned: 2, taken: 0, skipped: 0, snoozed: 0, open: 2, answered: null });
    expect(doseDay([])).toEqual({ planned: 0, taken: 0, skipped: 0, snoozed: 0, open: 0, answered: null });
  });
  it('comptes réels : prises, non prises, reportées, sans réponse', () => {
    const d = doseDay([
      { scheduledFor: sched(8), log: { id: 'a', status: 'taken', logged_at: at(23, 8, 12) } },
      { scheduledFor: sched(12), log: { id: 'b', status: 'skipped' } },
      { scheduledFor: sched(16), log: { id: 'c', status: 'snoozed' } },
      { scheduledFor: sched(20), log: null },
    ]);
    expect(d).toEqual({ planned: 4, taken: 1, skipped: 1, snoozed: 1, open: 1, answered: 3 });
  });
  it('heure de prise : seulement pour une prise « prise » avec son heure', () => {
    expect(takenAt({ scheduledFor: sched(8), log: { id: 'a', status: 'taken', logged_at: at(23, 8, 12) } })?.toISOString()).toBe(at(23, 8, 12));
    expect(takenAt({ scheduledFor: sched(8), log: { id: 'a', status: 'skipped', logged_at: at(23, 8, 12) } })).toBeNull();
    expect(takenAt({ scheduledFor: sched(8), log: null })).toBeNull();
  });
  it('heure corrigée : le jour de la prise prévue, jamais dans le futur, sinon null', () => {
    expect(takenTime(sched(8), '08:40', NOW)?.toISOString()).toBe(at(23, 8, 40));
    expect(takenTime(sched(8), '8h05', NOW)?.toISOString()).toBe(at(23, 8, 5));
    expect(takenTime(sched(8), '18:00', NOW)).toBeNull();
    expect(takenTime(sched(8), '25:00', NOW)).toBeNull();
  });
});

describe('échelle d’humeur', () => {
  const e = (id: string, day: number, h: number, value: number | null) => ({ id, at: at(day, h, 0), value });
  const list = [e('a', 23, 9, 2), e('b', 23, 18, 4), e('c', 21, 12, null), e('d', 20, 8, 5)];
  it('dernier relevé du jour (pas une moyenne) ; jour sans relevé = null ; relevé sans niveau gardé dans la liste', () => {
    const days = scaleByDay(list, NOW, 7);
    expect(days[6].last).toBe(4);
    expect(days[6].entries.map((x) => x.id)).toEqual(['b', 'a']);
    expect(days[5].last).toBeNull();
    expect(days[5].entries).toHaveLength(0);
    expect(days[4].last).toBeNull();
    expect(days[4].entries.map((x) => x.id)).toEqual(['c']);
    expect(days[3].last).toBe(5);
  });
  it('comptes réels par niveau, sans score', () => {
    expect(scaleCounts(scaleByDay(list, NOW, 7), 5)).toEqual([0, 1, 0, 1, 1]);
  });
});
