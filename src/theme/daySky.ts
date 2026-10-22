/**
 * Ciel du mode jour (logique pure, testée) : un dégradé lumineux qui évolue PROGRESSIVEMENT avec l'heure,
 * jamais blanc pur, et une légère teinte selon le profil affiché.
 *  · Matin : crème, pêche, rose clair, lumière de lever de soleil.
 *  · Journée : bleu ciel légèrement grisé, lavande, touche dorée discrète.
 *  · Fin de journée : abricot, vieux rose, mauve — transition vers le mode nuit (qui reste inchangé).
 * Les couleurs sont interpolées minute par minute entre des repères : aucun changement brutal.
 */

export interface SkyStops {
  /** Quatre couleurs du dégradé de fond, de haut en bas */
  stops: [string, string, string, string];
  /** Halo de soleil diffus : position (0..1), couleur, intensité */
  sun: { x: number; y: number; color: string; opacity: number };
  /** Reflet nacré (bande diagonale) */
  nacre: string;
}

interface Key { h: number; stops: [string, string, string, string]; sun: { x: number; y: number; color: string; opacity: number }; nacre: string }

/** Repères de la journée (heures décimales). Entre deux repères, interpolation linéaire. */
export const DAY_KEYS: Key[] = [
  // aube / matin : crème, pêche, rose clair ; soleil bas à gauche
  { h: 5.5, stops: ['#F8E9EF', '#FCE6DA', '#FCE0E6', '#F1E5F6'], sun: { x: 0.12, y: 0.42, color: '#FFC9A8', opacity: 0.55 }, nacre: '#FFE6EE' },
  { h: 8, stops: ['#FFF2E6', '#FFE5D4', '#FCDDE5', '#F3E6F7'], sun: { x: 0.18, y: 0.3, color: '#FFD3A6', opacity: 0.75 }, nacre: '#FFEAF0' },
  // journée : bleu ciel grisé, lavande, crème, touche dorée en haut à droite
  { h: 11, stops: ['#E2EBF6', '#EAE5F9', '#F8F0F5', '#FDF1E6'], sun: { x: 0.82, y: 0.06, color: '#FFE6A8', opacity: 0.6 }, nacre: '#EEF0FF' },
  { h: 15.5, stops: ['#E0E9F5', '#E9E3F8', '#F8EEF3', '#FEF0E2'], sun: { x: 0.74, y: 0.1, color: '#FFE0A0', opacity: 0.55 }, nacre: '#F0ECFF' },
  // fin de journée : abricot, vieux rose, mauve ; soleil bas à droite
  { h: 17.5, stops: ['#FBE2D4', '#F8D9D3', '#F0D5E0', '#E4D7F0'], sun: { x: 0.86, y: 0.5, color: '#FFC08F', opacity: 0.7 }, nacre: '#FFE2E6' },
  { h: 19, stops: ['#F6DCD5', '#F1D3DB', '#E9D5EA', '#DFD7F0'], sun: { x: 0.9, y: 0.7, color: '#FFAE8E', opacity: 0.55 }, nacre: '#F6DCEB' },
  // nuit en « toujours clair » : lavande douce, jamais sombre
  { h: 22, stops: ['#ECE6F6', '#EFE3F0', '#F1E5EC', '#E6E2F4'], sun: { x: 0.8, y: 0.12, color: '#E9DDFF', opacity: 0.45 }, nacre: '#F1E8FF' },
];

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const toHex = (v: number[]) => `#${v.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
export function mix(a: string, b: string, k: number): string {
  const A = hex(a); const Bv = hex(b);
  return toHex(A.map((x, i) => x + (Bv[i] - x) * k));
}
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** Courbe douce (début et fin lents) */
const ease = (k: number) => k * k * (3 - 2 * k);

/** Couleurs du ciel de jour pour une heure décimale (0..24). Après le dernier repère, on revient au premier. */
export function daySkyAt(hour: number): SkyStops {
  const h = ((hour % 24) + 24) % 24;
  const keys = DAY_KEYS;
  let a = keys[keys.length - 1];
  let b = keys[0];
  let span = 24 - a.h + b.h;
  let pos = h >= a.h ? h - a.h : h + 24 - a.h;
  for (let i = 0; i < keys.length - 1; i++) {
    if (h >= keys[i].h && h < keys[i + 1].h) { a = keys[i]; b = keys[i + 1]; span = b.h - a.h; pos = h - a.h; break; }
  }
  const k = ease(Math.max(0, Math.min(1, pos / span)));
  return {
    stops: a.stops.map((c, i) => mix(c, b.stops[i], k)) as SkyStops['stops'],
    sun: { x: lerp(a.sun.x, b.sun.x, k), y: lerp(a.sun.y, b.sun.y, k), color: mix(a.sun.color, b.sun.color, k), opacity: lerp(a.sun.opacity, b.sun.opacity, k) },
    nacre: mix(a.nacre, b.nacre, k),
  };
}

/** Moment affiché (aperçu des réglages) → heure représentative. */
export const PREVIEW_HOUR: Record<'dawn' | 'day' | 'dusk' | 'night', number> = { dawn: 7.2, day: 13.5, dusk: 18.2, night: 22.5 };

/** Teinte légère selon le profil affiché : même direction artistique, ambiance un peu différente. */
export type SkyProfile = 'pregnancy' | 'cycle' | 'baby' | 'child' | 'default';
export const PROFILE_TINTS: Record<SkyProfile, [string, string, string]> = {
  pregnancy: ['#FFCDB2', '#F6C3D2', '#F2DDA6'], // pêche, rose poudré, doré doux
  cycle: ['#EBA790', '#F4BDCD', '#D3C3F3'], // terracotta, rose, lavande
  baby: ['#C9DFF6', '#D9CFF6', '#FFEFD8'], // bleu ciel, lavande, crème
  child: ['#FFD3BD', '#CBE5CF', '#CADFF5'], // pêche, sauge douce, bleu clair
  default: ['#FFD6C8', '#E2D6F7', '#FBE3EC'],
};

/** Opacité maximale de la teinte du profil : garde le texte secondaire lisible (≥ 4,5:1, testé). */
export const TINT_OPACITY = 0.18;

export function skyProfileFor(scope: string | null | undefined): SkyProfile {
  if (scope === 'pregnancy') return 'pregnancy';
  if (scope === 'avoid' || scope === 'ttc' || scope === 'cycle') return 'cycle';
  if (scope === 'baby' || scope === 'postpartum') return 'baby';
  if (scope === 'child') return 'child';
  return 'default';
}

/** Luminance relative (WCAG) */
export function luminance(c: string): number {
  const [r, g, b] = hex(c).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
