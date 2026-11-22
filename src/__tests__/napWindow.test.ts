/**
 * Siestes comparables et fenêtre indicative de réveil (supabase/functions/_shared/nap-window.ts) : cas de vérification
 * du 22/11/2026 (Léa : 45, 55, 60, 70, 80, 95 min ; nouvelle sieste à 13 h 10 → 4 siestes entre 55 et 80 min,
 * fenêtre 14 h 05 – 14 h 30) et cas limites. Dates construites en HEURE LOCALE : indépendant du fuseau de la machine.
 */
import { addMinutesHM, comparableNaps, napProgress, napRange, napWindow, type NapRecord } from '../../supabase/functions/_shared/nap-window';

const at = (day: number, h: number, m: number) => new Date(2026, 10, day, h, m).toISOString();
const nap = (child: string, day: number, h: number, m: number, minutes: number, kind: string | null = 'nap'): NapRecord => {
  const s = new Date(2026, 10, day, h, m);
  return { child_id: child, started_at: s.toISOString(), ended_at: new Date(s.getTime() + minutes * 60_000).toISOString(), kind };
};
const LEA = 'lea';
const NOE = 'noe';
// Six siestes d'après-midi de Léa sur les six jours précédents
const leaNaps = [45, 55, 60, 70, 80, 95].map((min, i) => nap(LEA, 16 + i, 13, i % 2 ? 0 : 20, min));
const current = at(23, 13, 10);

describe('cas de vérification : Léa, sieste démarrée à 13 h 10', () => {
  const w = napWindow(leaNaps, LEA, current);
  it('compare ses 6 dernières siestes, les plus récentes d’abord', () => {
    expect(w.samples.map((s) => s.minutes)).toEqual([95, 80, 70, 60, 55, 45]);
    expect(w.status).toBe('ok');
  });
  it('quatre siestes ont duré entre 55 et 80 minutes', () => {
    expect([w.low, w.high, w.inRange]).toEqual([55, 80, 4]);
  });
  it('fenêtre indicative 14 h 05 – 14 h 30', () => {
    expect(addMinutesHM('13:10', w.low!)).toBe('14:05');
    expect(addMinutesHM('13:10', w.high!)).toBe('14:30');
  });
  it('période des siestes comparées : du 16 au 21 novembre', () => {
    expect(new Date(w.periodFrom!).getDate()).toBe(16);
    expect(new Date(w.periodTo!).getDate()).toBe(21);
  });
  it('les siestes du second enfant n’entrent jamais dans les chiffres de Léa', () => {
    const noe = [20, 25, 150, 160, 170, 180, 190].map((min, i) => nap(NOE, 15 + i, 13, 15, min));
    const mixed = napWindow([...noe, ...leaNaps], LEA, current);
    expect(mixed.samples.map((s) => s.minutes)).toEqual([95, 80, 70, 60, 55, 45]);
    expect([mixed.low, mixed.high, mixed.inRange]).toEqual([55, 80, 4]);
    // et inversement
    expect(napWindow([...noe, ...leaNaps], NOE, current).samples.every((s) => s.minutes !== 45)).toBe(true);
  });
});

describe('sélection des siestes comparables', () => {
  it('écarte la nuit, les siestes du matin (> 2 h d’écart), celles de plus de 14 jours, en cours ou trop courtes', () => {
    const extra = [
      nap(LEA, 22, 20, 30, 600, 'night'),          // nuit
      nap(LEA, 22, 9, 30, 50),                     // matin : 3 h 40 d'écart
      nap(LEA, 5, 13, 10, 65),                     // 18 jours avant
      { child_id: LEA, started_at: at(23, 9, 0), ended_at: null, kind: 'nap' }, // en cours
      nap(LEA, 22, 14, 0, 5),                      // 5 min
    ];
    expect(comparableNaps([...leaNaps, ...extra], LEA, current).map((s) => s.minutes)).toEqual([95, 80, 70, 60, 55, 45]);
  });
  it('sans type : sieste de jour seulement si elle commence entre 7 h et 20 h le même jour', () => {
    const untyped = [nap(LEA, 22, 13, 0, 60, null), nap(LEA, 22, 23, 50, 40, null)];
    expect(comparableNaps(untyped, LEA, current).map((s) => s.minutes)).toEqual([60]);
  });
  it('une sieste qui finit après le début de la sieste en cours est ignorée (données incohérentes)', () => {
    expect(comparableNaps([nap(LEA, 23, 12, 30, 60)], LEA, current)).toEqual([]);
  });
});

describe('quand la fenêtre ne peut pas être estimée', () => {
  it('moins de 4 siestes comparables : faits seulement', () => {
    const w = napWindow(leaNaps.slice(0, 3), LEA, current);
    expect(w.status).toBe('insufficient');
    expect(w.samples).toHaveLength(3);
    expect(w.low).toBeNull();
  });
  it('aucune sieste : statut insuffisant, période vide', () => {
    const w = napWindow([], LEA, current);
    expect([w.status, w.periodFrom, w.periodTo]).toEqual(['insufficient', null, null]);
  });
  it('siestes trop dispersées (plage > 90 min) : pas de fenêtre', () => {
    expect(napRange([20, 30, 100, 140, 200, 230]).status).toBe('dispersed');
  });
  it('4 ou 5 siestes : rien n’est écarté ; 6 : la plus courte et la plus longue', () => {
    expect(napRange([40, 50, 60, 70])).toEqual({ status: 'ok', low: 40, high: 70, inRange: 4 });
    expect(napRange([40, 50, 60, 70, 80])).toEqual({ status: 'ok', low: 40, high: 80, inRange: 5 });
  });
});

describe('sieste en cours face à la fenêtre', () => {
  const w = napRange([45, 55, 60, 70, 80, 95]);
  it('avant, dans, au-delà', () => {
    expect(napProgress(w, 30)).toBe('before');
    expect(napProgress(w, 55)).toBe('inside');
    expect(napProgress(w, 80)).toBe('inside');
    expect(napProgress(w, 81)).toBe('beyond');
    expect(napProgress(napRange([60]), 81)).toBe('none');
  });
  it('heures : passage de minuit et entrées invalides', () => {
    expect(addMinutesHM('23:30', 45)).toBe('00:15');
    expect(addMinutesHM('25:00', 10)).toBeNull();
  });
});
