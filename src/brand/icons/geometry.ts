/** Un pictogramme : tracé à l'encre (`stroke`), aplat doux facultatif (`fill`), points pleins (`dots`). */
export interface HomiIconDef {
  /** Tracé à l'encre (trait). */
  stroke: string;
  /** Aplat doux sous le trait (facultatif). */
  fill?: string;
  /** Points pleins à l'encre : [x, y, rayon]. */
  dots?: [number, number, number][];
  /** Trait plus épais (signe « + » du bouton central, posé sur l'aplat plein de l'action). */
  heavy?: boolean;
}

/**
 * Géométrie des pictogrammes HOMI : petites fonctions qui écrivent des tracés SVG sur la grille de 24 (coordonnées
 * absolues, arrondies au centième). Elles servent à dessiner les familles de pictogrammes d'outils
 * (src/brand/icons/tools/*) avec les MÊMES primitives que la famille de base (paths.ts) : cercles, rectangles
 * arrondis, cœur, goutte, croissant, gélule… Aucune couleur ici.
 */
export const n = (v: number) => +v.toFixed(2);
const P = (x: number, y: number) => `${n(x)} ${n(y)}`;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Cercle complet (deux demi-arcs). */
export const circle = (cx: number, cy: number, r: number) => `M${P(cx + r, cy)}A${n(r)} ${n(r)} 0 1 1 ${P(cx - r, cy)}A${n(r)} ${n(r)} 0 1 1 ${P(cx + r, cy)}Z`;

/** Rectangle aux coins arrondis. */
export function rrect(x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  const a = `${n(k)} ${n(k)} 0 0 1`;
  return `M${P(x + k, y)}H${n(x + w - k)}A${a} ${P(x + w, y + k)}V${n(y + h - k)}A${a} ${P(x + w - k, y + h)}H${n(x + k)}A${a} ${P(x, y + h - k)}V${n(y + k)}A${a} ${P(x + k, y)}Z`;
}

/** Ligne brisée ouverte : line(x1, y1, x2, y2, …). */
export function line(...c: number[]) {
  let d = `M${P(c[0], c[1])}`;
  for (let i = 2; i < c.length; i += 2) d += `L${P(c[i], c[i + 1])}`;
  return d;
}

/** Polygone fermé. */
export const poly = (...c: number[]) => `${line(...c)}Z`;

/** Point sur un cercle (angle en degrés, 0 = à droite, sens des aiguilles d'une montre). */
export const on = (cx: number, cy: number, r: number, deg: number): [number, number] => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];

/** Arc ouvert de `a0` à `a1` degrés (a1 > a0 : sens horaire). */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const [x0, y0] = on(cx, cy, r, a0);
  const [x1, y1] = on(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M${P(x0, y0)}A${n(r)} ${n(r)} 0 ${large} ${sweep} ${P(x1, y1)}`;
}

/** Pointe de flèche (deux barbes) au point (x, y), la flèche allant dans la direction `deg`. */
export function tip(x: number, y: number, deg: number, len = 2.6) {
  const [ax, ay] = on(x, y, len, deg + 180 - 42);
  const [bx, by] = on(x, y, len, deg + 180 + 42);
  return `M${P(ax, ay)}L${P(x, y)}L${P(bx, by)}`;
}

/** Cœur centré en (cx, cy), demi-largeur `s` (même dessin que le cœur de la famille de base). */
export function heart(cx: number, cy: number, s: number) {
  const k = s / 7.6;
  const r = n(4.2 * k);
  return `M${P(cx, cy + 7.1 * k)}C${P(cx, cy + 7.1 * k)} ${P(cx - 7.6 * k, cy + 2.6 * k)} ${P(cx - 7.6 * k, cy - 3 * k)}A${r} ${r} 0 0 1 ${P(cx, cy - 5.6 * k)}A${r} ${r} 0 0 1 ${P(cx + 7.6 * k, cy - 3 * k)}C${P(cx + 7.6 * k, cy + 2.6 * k)} ${P(cx, cy + 7.1 * k)} ${P(cx, cy + 7.1 * k)}Z`;
}

/** Goutte : rond de rayon `r` centré en (cx, cy), pointe vers le haut. */
export function drop(cx: number, cy: number, r: number) {
  const top = cy - 1.8 * r;
  return `M${P(cx, top)}C${P(cx, top)} ${P(cx + r, top + 1.09 * r)} ${P(cx + r, cy)}A${n(r)} ${n(r)} 0 0 1 ${P(cx - r, cy)}C${P(cx - r, cy - 0.71 * r)} ${P(cx, top)} ${P(cx, top)}Z`;
}

/** Gélule (stade) d'un centre à l'autre, rayon `r`. `half` : seulement la moitié côté (x2, y2). */
export function capsule(x1: number, y1: number, x2: number, y2: number, r: number, half = false) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const px = -uy * r;
  const py = ux * r;
  const R = `${n(r)} ${n(r)} 0 0 0`;
  if (half) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    return `M${P(mx + px, my + py)}L${P(x2 + px, y2 + py)}A${R} ${P(x2 - px, y2 - py)}L${P(mx - px, my - py)}Z`;
  }
  return `M${P(x1 + px, y1 + py)}L${P(x2 + px, y2 + py)}A${R} ${P(x2 - px, y2 - py)}L${P(x1 - px, y1 - py)}A${R} ${P(x1 + px, y1 + py)}Z`;
}

/** Croissant de lune : cercle extérieur (cx, cy, r), échancrure en haut à droite. */
export function crescent(cx: number, cy: number, r: number) {
  const [ax, ay] = on(cx, cy, r, -80);
  const [bx, by] = on(cx, cy, r, 10);
  return `M${P(bx, by)}A${n(r)} ${n(r)} 0 1 1 ${P(ax, ay)}A${n(r * 0.78)} ${n(r * 0.78)} 0 0 0 ${P(bx, by)}Z`;
}

/** Étoile à `k` branches (rayons extérieur R et intérieur r), pointe vers le haut. */
export function star(cx: number, cy: number, R: number, r: number, k = 5) {
  const pts: number[] = [];
  for (let i = 0; i < k * 2; i++) {
    const [x, y] = on(cx, cy, i % 2 ? r : R, -90 + (i * 180) / k);
    pts.push(x, y);
  }
  return poly(...pts);
}

/** Polygone régulier à `k` côtés (rotation `rot` en degrés). */
export function ngon(cx: number, cy: number, R: number, k: number, rot = 0) {
  const pts: number[] = [];
  for (let i = 0; i < k; i++) pts.push(...on(cx, cy, R, rot + (i * 360) / k));
  return poly(...pts);
}

/** Rectangle tourné (centre, longueur, largeur, angle en degrés). */
export function rotRect(cx: number, cy: number, len: number, w: number, deg: number) {
  const [ux, uy] = on(0, 0, len / 2, deg);
  const [px, py] = on(0, 0, w / 2, deg + 90);
  return poly(cx - ux - px, cy - uy - py, cx + ux - px, cy + uy - py, cx + ux + px, cy + uy + py, cx - ux + px, cy - uy + py);
}

/** Calendrier : corps, ligne d'en-tête, deux anneaux. */
export function calendar(x: number, y: number, w: number, h: number) {
  return `${rrect(x, y, w, h, 2.25)}M${P(x, y + 4.25)}H${n(x + w)}M${P(x + 4, y - 1.75)}V${n(y + 2)}M${P(x + w - 4, y - 1.75)}V${n(y + 2)}`;
}

/** Quatre coins de cadrage (scanner). */
export const SCAN_CORNERS = 'M3.75 8V5.5a1.75 1.75 0 0 1 1.75-1.75H8M16 3.75h2.5a1.75 1.75 0 0 1 1.75 1.75V8M20.25 16v2.5a1.75 1.75 0 0 1-1.75 1.75H16M8 20.25H5.5a1.75 1.75 0 0 1-1.75-1.75V16';

/** Presse-papiers : planche et pince. */
export const CLIPBOARD = rrect(5, 4.5, 14, 16.5, 2.25);
export const CLIP = rrect(9, 3, 6, 3.5, 1.25);

/** Bulle de dialogue pleine (queue en bas à gauche). */
export const BUBBLE_FULL = 'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.5V17h-.5A2.5 2.5 0 0 1 4 14.5z';

/** Livre fermé (couverture et tranche des pages). */
export const CLOSED_BOOK = 'M5.5 18V5a2 2 0 0 1 2-2h11v13.5h-11a2 2 0 0 0 0 4h11';
export const CLOSED_BOOK_FILL = 'M5.5 18V5a2 2 0 0 1 2-2h11v13.5h-11a2 2 0 0 0-2 1.5z';
