import {
  curveDomain, DAY_MS, dayMs, inPeriod, keepSelection, nearestIndex, nudge, parseMeasure, projector, stepIndex,
  timeTicks, toCurvePoints, usefulPeriods, valueTicks, type CurvePoint,
} from '@/lib/domain/measureCurve';

const pt = (id: string, date: string, y: number, note: string | null = null): CurvePoint => ({ id, date, x: dayMs(date), y, note });

describe('measureCurve — points réels uniquement', () => {
  it('trie, écarte les lignes sans valeur (jamais 0) et garde la note', () => {
    const rows = [
      { id: 'b', on: '2026-05-02', v: 7.1, n: 'PMI' },
      { id: 'a', on: '2026-03-01', v: '6,2' as unknown as number, n: null },
      { id: 'c', on: '2026-04-01', v: null, n: null },
      { id: 'd', on: '2026-04-15', v: 6.8, n: null },
      { id: 'e', on: 'n/a', v: 6.9, n: null },
    ];
    const p = toCurvePoints(rows, (r) => ({ id: r.id, date: r.on, value: r.v, note: r.n }));
    expect(p.map((x) => x.id)).toEqual(['d', 'b']);
    expect(p[1]).toEqual({ id: 'b', date: '2026-05-02', x: Date.UTC(2026, 4, 2), y: 7.1, note: 'PMI' });
    expect(p.some((x) => x.y === 0)).toBe(false);
  });
  it('données vides : aucun point, aucun domaine', () => {
    expect(toCurvePoints([], () => ({ id: '', date: '', value: null }))).toEqual([]);
    expect(curveDomain([], { minYSpan: 1 })).toBeNull();
    expect(nearestIndex([], 50)).toBe(-1);
    expect(stepIndex(0, 1, 0)).toBe(-1);
    expect(keepSelection([], 'x')).toBe(-1);
  });
});

describe('measureCurve — période', () => {
  const now = Date.UTC(2026, 10, 22);
  const pts = [pt('a', '2025-12-01', 60), pt('b', '2026-09-10', 66), pt('c', '2026-11-01', 68), pt('d', '2026-11-20', 69)];
  it('filtre les N derniers jours, « tout » garde tout', () => {
    expect(inPeriod(pts, '1m', now).map((p) => p.id)).toEqual(['c', 'd']);
    expect(inPeriod(pts, '3m', now).map((p) => p.id)).toEqual(['b', 'c', 'd']);
    expect(inPeriod(pts, 'all', now)).toHaveLength(4);
  });
  it('ne propose que les périodes qui changent quelque chose', () => {
    expect(usefulPeriods(pts, ['3m', '1y'], now)).toEqual(['3m', 'all']); // 1 an = tout ici
    expect(usefulPeriods([pt('x', '2026-11-20', 1)], ['3m', '1y'], now)).toEqual(['all']);
    expect(usefulPeriods([pt('x', '2020-01-01', 1)], ['3m'], now)).toEqual(['all']); // période vide : pas proposée
  });
});

describe('measureCurve — domaine et projection', () => {
  it('mesure isolée : domaine non nul, centré sur le point', () => {
    const d = curveDomain([pt('a', '2026-06-01', 72)], { minYSpan: 4, minXSpanDays: 14, padXRatio: 0 })!;
    expect(d.x1 - d.x0).toBe(14 * DAY_MS);
    expect((d.x0 + d.x1) / 2).toBe(Date.UTC(2026, 5, 1));
    expect([d.y0, d.y1]).toEqual([70, 74]);
  });
  it('bornes : premier et dernier points aux bords de la zone utile', () => {
    const pts = [pt('a', '2026-01-01', 50), pt('b', '2026-07-01', 66)];
    const d = curveDomain(pts, { minYSpan: 1, padRatio: 0, padXRatio: 0 })!;
    const padded = curveDomain(pts, { minYSpan: 1 })!;
    expect(padded.x0).toBeLessThan(pts[0].x); // marge : le premier point n'est pas coupé au bord
    expect(padded.x1).toBeGreaterThan(pts[1].x);
    const box = { width: 300, height: 200, left: 40, right: 10, top: 30, bottom: 20 };
    const { px, py } = projector(d, box);
    expect(px(pts[0].x)).toBe(40);
    expect(px(pts[1].x)).toBe(290);
    expect(py(66)).toBe(30);
    expect(py(50)).toBe(180);
  });
});

describe('measureCurve — sélection du point le plus proche', () => {
  const xs = [40, 100, 103, 290];
  it('point le plus proche, égalité -> le premier', () => {
    expect(nearestIndex(xs, 98)).toBe(1);
    expect(nearestIndex(xs, 102)).toBe(2);
    expect(nearestIndex([10, 20], 15)).toBe(0);
  });
  it('doigt hors du graphique : la borne (premier / dernier point réel)', () => {
    expect(nearestIndex(xs, -500)).toBe(0);
    expect(nearestIndex(xs, 5000)).toBe(3);
    expect(nearestIndex([77], 0)).toBe(0); // mesure isolée
  });
  it('clavier : reste dans les bornes', () => {
    expect(stepIndex(0, -1, 4)).toBe(0);
    expect(stepIndex(3, 1, 4)).toBe(3);
    expect(stepIndex(1, 1, 4)).toBe(2);
    expect(stepIndex(-1, -1, 4)).toBe(2);
  });
  it('garde la mesure sélectionnée après correction, sinon la plus récente', () => {
    const pts = [pt('a', '2026-01-01', 1), pt('b', '2026-02-01', 2)];
    expect(keepSelection(pts, 'a')).toBe(0);
    expect(keepSelection(pts, 'zz')).toBe(1);
    expect(keepSelection(pts, null)).toBe(1);
  });
});

describe('measureCurve — graduations et saisie', () => {
  it('mois en abscisse au-delà de deux mois, dans les bornes', () => {
    const x0 = Date.UTC(2026, 0, 15); const x1 = Date.UTC(2026, 11, 20);
    const t = timeTicks(x0, x1, 4);
    expect(t.every((k) => k.unit === 'month' && k.at >= x0 && k.at <= x1)).toBe(true);
    expect(t.length).toBeGreaterThan(1);
    expect(t.length).toBeLessThanOrEqual(5);
    expect(new Date(t[0].at).getUTCDate()).toBe(1);
  });
  it('jours sur une courte période ; intervalle nul -> rien', () => {
    const x0 = Date.UTC(2026, 10, 1); const x1 = Date.UTC(2026, 10, 15);
    const t = timeTicks(x0, x1, 4);
    expect(t.every((k) => k.unit === 'day')).toBe(true);
    expect(t.length).toBeGreaterThan(1);
    expect(timeTicks(5, 5)).toEqual([]);
  });
  it('valeurs rondes', () => {
    expect(valueTicks(36.2, 37.1, 3)).toEqual([36.5, 37]);
    expect(valueTicks(36.2, 37.1, 6)).toEqual([36.2, 36.4, 36.6, 36.8, 37]);
    expect(valueTicks(60, 75, 3)).toEqual([60, 65, 70, 75]);
    expect(valueTicks(3, 3)).toEqual([]);
  });
  it('valeur provisoire : lecture et pas', () => {
    expect(parseMeasure('72,4', 20, 180)).toBe(72.4);
    expect(parseMeasure(' 36.55 ', 34, 43)).toBe(36.55);
    expect(parseMeasure('abc', 0, 10)).toBeNull();
    expect(parseMeasure('500', 0, 300)).toBeNull();
    expect(parseMeasure('', 0, 10)).toBeNull();
    expect(nudge(72.4, 0.1, 1, 20, 180)).toBe(72.5);
    expect(nudge(36.55, -0.05, 2, 34, 43)).toBe(36.5);
    expect(nudge(20, -1, 1, 20, 180)).toBe(20);
  });
});
