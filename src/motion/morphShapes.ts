/**
 * Formes des icônes de module morphables (carré de 100) : goutte → allaitement, lune → sommeil, cercle → cycle,
 * ventre → grossesse, maison → calendrier, cœur → souvenirs.
 *
 * Pourquoi c'est fiable : chaque forme est un contour fermé unique, rééchantillonné à la MÊME quantité de points
 * (72), à abscisse curviligne égale, dans le même sens (horaire à l'écran) et à partir du même repère (le point
 * situé à la verticale du centre, en haut). L'interpolation point à point entre deux formes est alors toujours
 * valide (pas de croisement de commandes SVG, pas de bibliothèque d'interpolation de chemins).
 * Calculé une fois au chargement du module (JS), puis passé tel quel aux worklets.
 */
import { morph } from './curves';

export type MorphShape = 'drop' | 'moon' | 'circle' | 'belly' | 'house' | 'heart';
export const MORPH_SHAPES: readonly MorphShape[] = ['drop', 'moon', 'circle', 'belly', 'house', 'heart'];
/** Module de l'application associé à chaque forme. */
export const MORPH_MODULE: Record<MorphShape, 'feeding' | 'sleep' | 'cycle' | 'pregnancy' | 'calendar' | 'memories'> = {
  drop: 'feeding', moon: 'sleep', circle: 'cycle', belly: 'pregnancy', house: 'calendar', heart: 'memories',
};

type Pt = [number, number];

const arc = (cx: number, cy: number, r: number, from: number, to: number, steps = 96): Pt[] => {
  // angles en radians, 0 = droite, sens horaire à l'écran (y vers le bas)
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
};
const line = (a: Pt, b: Pt, steps = 24): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) out.push([a[0] + ((b[0] - a[0]) * i) / steps, a[1] + ((b[1] - a[1]) * i) / steps]);
  return out;
};

function dropOutline(): Pt[] {
  const tip: Pt = [50, 8];
  const c: Pt = [50, 62];
  const r = 30;
  const d = c[1] - tip[1];
  const half = Math.acos(r / d); // tangentes issues de la pointe
  const up = -Math.PI / 2;
  const right = up + half;
  const left = up - half + Math.PI * 2;
  const pr: Pt = [c[0] + r * Math.cos(right), c[1] + r * Math.sin(right)];
  const pl: Pt = [c[0] + r * Math.cos(left), c[1] + r * Math.sin(left)];
  return [...line(tip, pr), ...arc(c[0], c[1], r, right, left), ...line(pl, tip)];
}

function moonOutline(): Pt[] {
  // croissant : disque (50,52) r 38 privé du disque (66,38) r 32
  const [x1, y1, r1] = [50, 52, 38];
  const [x2, y2, r2] = [68, 38, 31];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.hypot(dx, dy);
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(r1 * r1 - a * a);
  const mx = x1 + (a * dx) / d;
  const my = y1 + (a * dy) / d;
  const p: Pt = [mx + (h * dy) / d, my - (h * dx) / d];
  const q: Pt = [mx - (h * dy) / d, my + (h * dx) / d];
  const ang = (cx: number, cy: number, pt: Pt) => Math.atan2(pt[1] - cy, pt[0] - cx);
  // grand arc extérieur de q à p (sens horaire, du côté opposé au disque retiré)
  let qa = ang(x1, y1, q);
  let pa = ang(x1, y1, p);
  const away = ang(x1, y1, [x1 - dx, y1 - dy]);
  const norm = (v: number) => ((v % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  // choisir l'ordre pour que l'arc horaire passe par le point « à l'opposé »
  const between = (s: number, e: number, x: number) => norm(x - s) <= norm(e - s);
  let outer: Pt[];
  if (between(qa, pa, away)) outer = arc(x1, y1, r1, qa, qa + norm(pa - qa));
  else { [qa, pa] = [pa, qa]; outer = arc(x1, y1, r1, qa, qa + norm(pa - qa)); }
  const end = outer[outer.length - 1];
  const start = outer[0];
  // arc intérieur (bord du disque retiré, à l'intérieur du disque principal), sens antihoraire pour refermer
  const ea = ang(x2, y2, end);
  const sa = ang(x2, y2, start);
  const toward = ang(x2, y2, [x1, y1]);
  const ccw = norm(ea - sa); // longueur angulaire horaire de sa à ea
  // on va de ea à sa en passant par `toward`
  const inner = between(sa, ea, toward) ? arc(x2, y2, r2, ea, ea - ccw) : arc(x2, y2, r2, ea, ea + (2 * Math.PI - ccw));
  return [...outer, ...inner];
}

function circleOutline(): Pt[] {
  return arc(50, 50, 38, -Math.PI / 2, (3 * Math.PI) / 2, 160);
}

function bellyOutline(): Pt[] {
  // ventre de profil : dos droit à gauche, rondeur à droite (coins arrondis)
  const top = 12;
  const bottom = 88;
  const x0 = 28;
  const k = 6;
  const out: Pt[] = [];
  out.push(...line([x0 + k, top], [44, top], 8));
  out.push(...arc(44, 50, 38, -Math.PI / 2, Math.PI / 2, 120));
  out.push(...line([44, bottom], [x0 + k, bottom], 8));
  out.push(...arc(x0 + k, bottom - k, k, Math.PI / 2, Math.PI, 12));
  out.push(...line([x0, bottom - k], [x0, top + k], 24));
  out.push(...arc(x0 + k, top + k, k, Math.PI, (3 * Math.PI) / 2, 12));
  return out;
}

function houseOutline(): Pt[] {
  // même silhouette que la maison HOMI (toit, avant-toits, base), réduite au carré de 100
  const pts: Pt[] = [[50, 10], [87, 40], [87, 86], [13, 86], [13, 40]];
  const out: Pt[] = [];
  for (let i = 0; i < pts.length; i++) out.push(...line(pts[i], pts[(i + 1) % pts.length], 32));
  return out;
}

function heartOutline(): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= 240; i++) {
    const t = (i / 240) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    out.push([50 + x * 2.35, 47 - y * 2.35]);
  }
  return out;
}

const signedArea = (p: Pt[]) => {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
};

/** Rééchantillonne un contour fermé en `n` points équidistants, sens horaire, départ en haut à la verticale du centre. */
export function resample(outline: Pt[], n: number = morph.points): number[] {
  let p = outline.filter((pt, i) => i === 0 || Math.hypot(pt[0] - outline[i - 1][0], pt[1] - outline[i - 1][1]) > 1e-6);
  if (Math.hypot(p[0][0] - p[p.length - 1][0], p[0][1] - p[p.length - 1][1]) < 1e-6) p = p.slice(0, -1);
  if (signedArea(p) < 0) p = [...p].reverse(); // horaire à l'écran (y vers le bas) ⇔ aire signée positive
  const cx = p.reduce((s, q) => s + q[0], 0) / p.length;
  const cy = p.reduce((s, q) => s + q[1], 0) / p.length;
  // repère : le point dont la direction depuis le centre est la plus proche de « vers le haut »
  let start = 0;
  let best = Infinity;
  p.forEach((q, i) => {
    const a = Math.abs(Math.atan2(q[0] - cx, -(q[1] - cy)));
    if (a < best) { best = a; start = i; }
  });
  p = [...p.slice(start), ...p.slice(0, start)];
  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    seg.push(l);
    total += l;
  }
  const out: number[] = [];
  let i = 0;
  let acc = 0;
  for (let k = 0; k < n; k++) {
    const target = (total * k) / n;
    while (acc + seg[i] < target && i < p.length - 1) { acc += seg[i]; i++; }
    const a = p[i];
    const b = p[(i + 1) % p.length];
    const t = seg[i] ? (target - acc) / seg[i] : 0;
    out.push(Math.round((a[0] + (b[0] - a[0]) * t) * 100) / 100, Math.round((a[1] + (b[1] - a[1]) * t) * 100) / 100);
  }
  return out;
}

const OUTLINES: Record<MorphShape, () => Pt[]> = {
  drop: dropOutline, moon: moonOutline, circle: circleOutline, belly: bellyOutline, house: houseOutline, heart: heartOutline,
};

/** Points (x0, y0, x1, y1, …) de chaque forme, même nombre partout. */
export const MORPH_POINTS: Record<MorphShape, number[]> = Object.fromEntries(
  MORPH_SHAPES.map((s) => [s, resample(OUTLINES[s]())]),
) as Record<MorphShape, number[]>;

/** Interpolation point à point (worklet) → chemin SVG fermé. */
export function morphPath(a: readonly number[], b: readonly number[], t: number): string {
  'worklet';
  let d = '';
  for (let i = 0; i < a.length; i += 2) {
    const x = a[i] + (b[i] - a[i]) * t;
    const y = a[i + 1] + (b[i + 1] - a[i + 1]) * t;
    d += (i === 0 ? 'M' : 'L') + (Math.round(x * 10) / 10) + ' ' + (Math.round(y * 10) / 10);
  }
  return d + 'Z';
}

/** Points intermédiaires (JS) : reprise d'un morph interrompu depuis la forme affichée. */
export function lerpPoints(a: readonly number[], b: readonly number[], t: number): number[] {
  return a.map((v, i) => v + (b[i] - v) * t);
}
