/**
 * Courbe de mesures (Croissance, Poids de grossesse, Température) — fonctions PURES (22/11/2026).
 *
 * Règle d'or : chaque point dessiné est une mesure RÉELLEMENT enregistrée. Aucun lissage, aucune interpolation, aucun
 * point inventé : on trie, on filtre par période, on calcule l'échelle et on retrouve le point réel le plus proche du
 * doigt / de la souris. Les jours sans mesure restent vides (jamais un zéro).
 */

export const DAY_MS = 86_400_000;

/** Une mesure telle qu'enregistrée : identifiant d'origine, date (jour civil ISO), instant (ms, 0 h UTC) et valeur. */
export interface CurvePoint {
  id: string;
  /** Jour civil ISO (AAAA-MM-JJ) de la mesure */
  date: string;
  /** Abscisse : instant en ms (jour civil à 0 h UTC) */
  x: number;
  y: number;
  note?: string | null;
}

export type CurvePeriod = '1m' | '3m' | '1y' | 'all';
export const PERIOD_DAYS: Record<Exclude<CurvePeriod, 'all'>, number> = { '1m': 31, '3m': 92, '1y': 366 };

/** Jour civil ISO -> ms à 0 h UTC (lecture identique partout, quel que soit le fuseau). NaN si la date est illisible. */
export function dayMs(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN;
}

/**
 * Lignes d'une table -> points de courbe, triés du plus ancien au plus récent. Une ligne sans valeur (ou valeur non
 * numérique) n'est PAS un point : elle est écartée, jamais remplacée par 0.
 */
export function toCurvePoints<R>(rows: readonly R[], pick: (r: R) => { id: string; date: string; value: number | string | null | undefined; note?: string | null }): CurvePoint[] {
  const out: CurvePoint[] = [];
  for (const r of rows) {
    const p = pick(r);
    if (p.value == null || p.value === '') continue;
    const y = Number(p.value);
    const x = dayMs(p.date);
    if (!Number.isFinite(y) || !Number.isFinite(x)) continue;
    out.push({ id: p.id, date: p.date.slice(0, 10), x, y, note: p.note ?? null });
  }
  return out.sort((a, b) => a.x - b.x || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Points de la période (les `days` derniers jours jusqu'à `nowMs` inclus). « all » : tout. */
export function inPeriod(points: readonly CurvePoint[], period: CurvePeriod, nowMs: number): CurvePoint[] {
  if (period === 'all') return points.slice();
  const from = nowMs - PERIOD_DAYS[period] * DAY_MS;
  return points.filter((p) => p.x >= from);
}

/**
 * Périodes qui ont un sens : une période n'est proposée que si elle montre MOINS que « tout » ET au moins une mesure.
 * Rien à choisir (une seule option) -> tableau d'un élément ['all'] : le sélecteur est alors masqué.
 */
export function usefulPeriods(points: readonly CurvePoint[], candidates: readonly Exclude<CurvePeriod, 'all'>[], nowMs: number): CurvePeriod[] {
  const out: CurvePeriod[] = [];
  for (const c of candidates) {
    const n = inPeriod(points, c, nowMs).length;
    if (n > 0 && n < points.length) out.push(c);
  }
  return [...out, 'all'];
}

export interface CurveDomain { x0: number; x1: number; y0: number; y1: number }

/**
 * Domaine affiché : de la première à la dernière mesure (abscisses, + `padXRatio` de marge), valeurs encadrées d'une marge. Jamais un
 * intervalle nul : une mesure isolée est centrée sur ±`minXSpanDays`/2 jours et ±`minYSpan`/2 unités.
 * Aucune mesure -> null.
 */
export function curveDomain(points: readonly CurvePoint[], opts: { minYSpan: number; minXSpanDays?: number; padRatio?: number; padXRatio?: number }): CurveDomain | null {
  if (!points.length) return null;
  const minX = opts.minXSpanDays ?? 14;
  const pad = opts.padRatio ?? 0.12;
  let x0 = Infinity; let x1 = -Infinity; let y0 = Infinity; let y1 = -Infinity;
  for (const p of points) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  if (x1 - x0 < minX * DAY_MS) { const c = (x0 + x1) / 2; x0 = c - (minX * DAY_MS) / 2; x1 = c + (minX * DAY_MS) / 2; }
  // marge horizontale : le premier et le dernier point (et leur halo) restent entiers dans la zone dessinée
  const padX = (x1 - x0) * (opts.padXRatio ?? 0.05); x0 -= padX; x1 += padX;
  const span = y1 - y0;
  if (span < opts.minYSpan) { const c = (y0 + y1) / 2; y0 = c - opts.minYSpan / 2; y1 = c + opts.minYSpan / 2; }
  else { y0 -= span * pad; y1 += span * pad; }
  return { x0, x1, y0, y1 };
}

export interface CurveBox { width: number; height: number; left: number; right: number; top: number; bottom: number }

/** Projection linéaire domaine -> pixels, identique à celle de Victory (domaine explicite + `padding`). */
export function projector(d: CurveDomain, box: CurveBox) {
  const w = Math.max(1, box.width - box.left - box.right);
  const h = Math.max(1, box.height - box.top - box.bottom);
  return {
    px: (x: number) => box.left + ((x - d.x0) / (d.x1 - d.x0 || 1)) * w,
    py: (y: number) => box.top + (1 - (y - d.y0) / (d.y1 - d.y0 || 1)) * h,
  };
}

/**
 * Index du point RÉEL le plus proche horizontalement de `target` (positions triées ou non). En cas d'égalité, le premier
 * rencontré. Aucun point -> -1. Le doigt hors du graphique (avant le premier / après le dernier) sélectionne la borne.
 */
export function nearestIndex(xs: readonly number[], target: number): number {
  let best = -1; let bestD = Infinity;
  for (let i = 0; i < xs.length; i++) {
    const d = Math.abs(xs[i] - target);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

/** Pas clavier / VoiceOver : reste dans [0, n-1] ; aucun point -> -1. */
export function stepIndex(i: number, delta: number, n: number): number {
  if (n <= 0) return -1;
  return Math.max(0, Math.min(n - 1, (i < 0 ? n - 1 : i) + delta));
}

/** Après un changement de données, garder la même mesure sélectionnée si elle existe encore ; sinon la plus récente. */
export function keepSelection(points: readonly CurvePoint[], id: string | null): number {
  if (!points.length) return -1;
  const k = id ? points.findIndex((p) => p.id === id) : -1;
  return k >= 0 ? k : points.length - 1;
}

/**
 * Graduations de temps : débuts de mois (UTC) quand l'intervalle dépasse ~2 mois, sinon débuts de semaine (lundi)
 * ou jours. Au plus `max` graduations, toutes DANS [x0, x1].
 */
export function timeTicks(x0: number, x1: number, max = 4): { at: number; unit: 'month' | 'day' }[] {
  if (!(x1 > x0)) return [];
  const spanDays = (x1 - x0) / DAY_MS;
  if (spanDays > 62) {
    const a = new Date(x0); const b = new Date(x1);
    const months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth() + 1;
    const step = [1, 2, 3, 4, 6, 12, 24].find((s) => Math.ceil(months / s) <= max) ?? 24;
    const out: { at: number; unit: 'month' }[] = [];
    for (let k = a.getUTCFullYear() * 12 + a.getUTCMonth(); k <= b.getUTCFullYear() * 12 + b.getUTCMonth(); k++) {
      const at = Date.UTC(Math.floor(k / 12), k % 12, 1);
      if (at >= x0 && at <= x1 && k % step === 0) out.push({ at, unit: 'month' }); // alignés : janvier, avril… pour 3 mois
    }
    return out.slice(0, max + 1);
  }
  const step = [1, 2, 7, 14, 21].find((s) => spanDays / s <= max) ?? 28;
  const first = Math.ceil(x0 / DAY_MS) * DAY_MS;
  const out: { at: number; unit: 'day' }[] = [];
  for (let at = first; at <= x1 && out.length <= max; at += step * DAY_MS) out.push({ at, unit: 'day' });
  return out;
}

/** Graduations de valeur « rondes » (pas de 1, 2, 2,5 ou 5 × 10^k) dans [y0, y1], au plus `max` + 1. */
export function valueTicks(y0: number, y1: number, max = 3): number[] {
  if (!(y1 > y0)) return [];
  const raw = (y1 - y0) / max;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find((s) => s * mag >= raw) ?? 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(y0 / step) * step; v <= y1 + 1e-9; v += step) out.push(Math.round(v / step) * step);
  return out.map((v) => Math.round(v * 1e6) / 1e6);
}

/** Saisie « 72,4 » / « 72.4 » -> nombre dans [min, max], sinon null. */
export function parseMeasure(input: string, min: number, max: number): number | null {
  const s = input.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const v = Number(s);
  return Number.isFinite(v) && v >= min && v <= max ? v : null;
}

/** Ajoute `delta` à une valeur en arrondissant à `digits` décimales, bornée à [min, max]. */
export function nudge(v: number, delta: number, digits: number, min: number, max: number): number {
  const f = 10 ** digits;
  return Math.max(min, Math.min(max, Math.round((v + delta) * f) / f));
}
