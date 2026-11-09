/**
 * Repères de croissance de l'OMS (Standards 2006, 0–60 mois) : position d'une mesure (z-score,
 * centile) et courbes de référence. Méthode LMS de l'OMS :
 *   z = ((x / M)^L − 1) / (L × S)        (L ≠ 0)      ;  x(z) = M × (1 + L × S × z)^(1/L)
 * Pour le poids, l'IMC (et le périmètre crânien, prudence identique), au-delà de ±3 l'OMS
 * prolonge linéairement avec l'écart entre +2 et +3 ET (« z-score restreint ») — repris ici.
 * Entre deux mois révolus, L, M et S sont interpolés linéairement (les tables journalières de
 * l'OMS sont lisses ; l'écart est négligeable) — documenté, jamais extrapolé au-delà de 60 mois.
 *
 * Ce n'est PAS un diagnostic : un repère pour situer une mesure, que seul un professionnel
 * interprète (évolution, contexte). En France, le carnet de santé utilise les courbes 2018
 * (AFPA–CRESS/Inserm), qui peuvent différer légèrement de celles de l'OMS.
 */
import { WHO_GROWTH, type WhoRow } from '@/content/whoGrowth';
import { t as tr, getLocale } from '@/i18n';
import { inLang } from '@/i18n/localized';

export type GrowthIndicator = 'weight' | 'length' | 'head' | 'bmi';
export type Sex = 'male' | 'female';
export const WHO_MAX_MONTHS = 60;
export const WHO_SOURCE = { get label() { return inLang({ fr: 'OMS — Standards de croissance de l’enfant (2006)', en: 'WHO — Child Growth Standards (2006)', es: 'OMS — Patrones de crecimiento infantil (2006)', de: 'WHO — Wachstumsstandards für Kinder (2006)', it: 'OMS — Standard di crescita del bambino (2006)' }); }, url: 'https://www.who.int/tools/child-growth-standards' };

const DAYS_PER_MONTH = 365.25 / 12;

/** Âge en mois (décimal) à une date de mesure, à partir de la date de naissance (AAAA-MM-JJ). */
export function ageInMonths(birthISO: string, onISO: string) {
  const b = Date.UTC(+birthISO.slice(0, 4), +birthISO.slice(5, 7) - 1, +birthISO.slice(8, 10));
  const d = Date.UTC(+onISO.slice(0, 4), +onISO.slice(5, 7) - 1, +onISO.slice(8, 10));
  return (d - b) / 86400000 / DAYS_PER_MONTH;
}

function table(ind: GrowthIndicator, sex: Sex): WhoRow[] {
  return WHO_GROWTH[`${ind}_${sex}`];
}

/** L, M, S à un âge donné (interpolation entre mois révolus). null hors 0–60 mois. */
export function lmsAt(ind: GrowthIndicator, sex: Sex, months: number): { L: number; M: number; S: number } | null {
  if (!(months >= 0) || months > WHO_MAX_MONTHS) return null;
  const t = table(ind, sex);
  const i = Math.min(Math.floor(months), WHO_MAX_MONTHS - 1);
  const a = t[i]; const b = t[i + 1];
  const f = Math.min(1, months - i);
  // à 24 mois, on change de table (couché → debout) : pas d'interpolation à travers la couture
  if (ind === 'length' || ind === 'bmi') { if (i === 23 && f > 0) return { L: b[1], M: b[2], S: b[3] }; }
  return { L: a[1] + (b[1] - a[1]) * f, M: a[2] + (b[2] - a[2]) * f, S: a[3] + (b[3] - a[3]) * f };
}

const valueFromZ = (L: number, M: number, S: number, z: number) => (L === 0 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L));

/** Valeur de la courbe de référence (médiane, ±1/2/3 ET…) à un âge donné. */
export function referenceValue(ind: GrowthIndicator, sex: Sex, months: number, z: number): number | null {
  const lms = lmsAt(ind, sex, months);
  if (!lms) return null;
  const { L, M, S } = lms;
  const restricted = ind !== 'length';
  if (restricted && Math.abs(z) > 3) {
    const sd3 = valueFromZ(L, M, S, 3 * Math.sign(z));
    const sd2 = valueFromZ(L, M, S, 2 * Math.sign(z));
    return sd3 + (z - 3 * Math.sign(z)) * Math.abs(sd3 - sd2);
  }
  return valueFromZ(L, M, S, z);
}

/** z-score d'une mesure (méthode OMS, restreinte au-delà de ±3 pour poids, IMC et périmètre crânien). */
export function zScore(ind: GrowthIndicator, sex: Sex, months: number, x: number): number | null {
  const lms = lmsAt(ind, sex, months);
  if (!lms || !(x > 0)) return null;
  const { L, M, S } = lms;
  const z = L === 0 ? Math.log(x / M) / S : (Math.pow(x / M, L) - 1) / (L * S);
  if (ind === 'length' || Math.abs(z) <= 3) return z;
  const sd3 = valueFromZ(L, M, S, 3); const sd2 = valueFromZ(L, M, S, 2);
  const sd3n = valueFromZ(L, M, S, -3); const sd2n = valueFromZ(L, M, S, -2);
  return z > 3 ? 3 + (x - sd3) / (sd3 - sd2) : -3 + (x - sd3n) / (sd2n - sd3n);
}

/** Fonction de répartition de la loi normale (Abramowitz–Stegun 7.1.26, erreur < 1,5e-7). */
export function normalCdf(z: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

/** Centiles affichés : 3, 15, 50, 85, 97 (repères usuels de l'OMS). */
export const CENTILE_Z: { p: number; z: number }[] = [
  { p: 3, z: -1.880794 }, { p: 15, z: -1.036433 }, { p: 50, z: 0 }, { p: 85, z: 1.036433 }, { p: 97, z: 1.880794 },
];

/** Courbes de référence échantillonnées (mois → valeurs aux centiles), de `from` à `to` mois. */
export function referenceCurves(ind: GrowthIndicator, sex: Sex, from: number, to: number, step = 0.5) {
  const out: { m: number; v: Record<number, number> }[] = [];
  const end = Math.min(to, WHO_MAX_MONTHS);
  for (let m = Math.max(0, from); m <= end + 1e-9; m += step) {
    const v: Record<number, number> = {};
    for (const c of CENTILE_Z) v[c.p] = referenceValue(ind, sex, m, c.z)!;
    out.push({ m, v });
  }
  return out;
}

export interface GrowthPosition { z: number; centile: number; band: 'below' | 'within' | 'above'; text: string }

/**
 * Phrase neutre sur la position d'une mesure. Jamais de jugement (« trop », « insuffisant ») :
 * en dehors du 3e–97e centile, on invite à en parler au professionnel qui suit l'enfant.
 */
function ordinal(n: number): string {
  const l = getLocale();
  if (l === 'es') return `${n}.º`;
  if (l === 'de') return `${n}.`;
  if (l === 'it') return `${n}°`;
  if (l !== 'en') return `${n}${n === 1 ? 'er' : 'e'}`;
  const r = n % 100;
  return `${n}${r >= 11 && r <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'}`;
}

export function describePosition(ind: GrowthIndicator, sex: Sex, months: number, x: number): GrowthPosition | null {
  const z = zScore(ind, sex, months, x);
  if (z == null) return null;
  const c = normalCdf(z) * 100;
  const centile = c < 1 ? 1 : c > 99 ? 99 : Math.round(c);
  if (z < CENTILE_Z[0].z || z > CENTILE_Z[4].z) {
    return { z, centile, band: z < 0 ? 'below' : 'above', text: tr(z < 0 ? 'l4.gs.below' : 'l4.gs.above') };
  }
  return { z, centile, band: 'within', text: tr('l4.gs.within', { ord: ordinal(centile) }) };
}

export function sexForStandards(sex: string | null | undefined): Sex | null {
  return sex === 'male' || sex === 'female' ? sex : null;
}
