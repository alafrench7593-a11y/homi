/**
 * Score nutritionnel éditorial sur 100 — méthode interne, transparente, adaptée à l'âge.
 * Ce n'est ni le Nutri-Score officiel, ni une certification, ni un avis médical.
 *
 * Données : valeurs CALNUT 2020 (ANSES) de chaque ingrédient (nutrition-data.ts), quantités de la recette.
 * Repères par âge : ANSES, « Les références nutritionnelles en vitamines et minéraux » (21/02/2025) pour le fer,
 * le calcium et le sodium (sel = sodium × 2,5) ; part des sucres ajoutés et des acides gras saturés dans l'énergie
 * (repères OMS et ANSES pour la population générale).
 *
 * Calcul (affiché tel quel dans l'application) :
 *   base 40
 *   + fruits, légumes et légumineuses : jusqu'à 20 points (20 si ≥ 50 % du poids du plat)
 *   + fibres : jusqu'à 10 points (10 si ≥ 3 g pour 100 g)
 *   + protéines : jusqu'à 10 points (10 si ≥ 12 % de l'énergie)
 *   + fer : jusqu'à 10 points (10 si une portion apporte ≥ 25 % du repère de l'âge)
 *   + calcium : jusqu'à 10 points (même règle)
 *   − sucres ajoutés : jusqu'à 15 points (0 si ≤ 5 % de l'énergie, 15 si ≥ 25 %)
 *   − sel : jusqu'à 15 points (0 si une portion ≤ 25 % du repère de l'âge, 15 si ≥ 75 %)
 *   − acides gras saturés : jusqu'à 10 points (0 si ≤ 12 % de l'énergie, 10 si ≥ 24 %)
 *   borné entre 0 et 100. Un plat n'est jamais présenté comme « bon » ou « mauvais » : on montre ses atouts et ses pistes.
 */
import { t as tr } from '@/i18n';
import { INGREDIENTS } from './ingredients';
import { CALNUT_SOURCE, NUTRITION } from './nutrition-data';
import type { Recipe } from './types';

export type AgeBand = 'm6_11' | 'y1_3' | 'y4_6' | 'y7_10';
export const AGE_BANDS: AgeBand[] = ['m6_11', 'y1_3', 'y4_6', 'y7_10'];
export const BAND_MONTHS: Record<AgeBand, [number, number]> = { m6_11: [6, 12], y1_3: [12, 48], y4_6: [48, 84], y7_10: [84, 132] };

/** Repères quotidiens ANSES (fer et calcium : RNP ou AS ; sel déduit de l'AS en sodium × 2,5). */
export const AGE_REFS: Record<AgeBand, { iron: number; calcium: number; salt: number }> = {
  m6_11: { iron: 11, calcium: 280, salt: 0.9 },
  y1_3: { iron: 5, calcium: 450, salt: 2.0 },
  y4_6: { iron: 4, calcium: 800, salt: 2.5 },
  y7_10: { iron: 6, calcium: 800, salt: 3.0 },
};
export const SCORE_SOURCES = [
  { label: CALNUT_SOURCE.label, url: CALNUT_SOURCE.url, date: '2020-07-07' },
  { label: 'ANSES — Les références nutritionnelles en vitamines et minéraux', url: 'https://www.anses.fr/fr/content/les-references-nutritionnelles-en-vitamines-et-mineraux', date: '2025-02-21' },
];

export function bandFor(months: number): AgeBand {
  return AGE_BANDS.find((b) => months >= BAND_MONTHS[b][0] && months < BAND_MONTHS[b][1]) ?? (months < 6 ? 'm6_11' : 'y7_10');
}
/** Tranche par défaut d'une recette : la plus jeune qu'elle concerne. */
export function defaultBand(r: Pick<Recipe, 'minMonths' | 'audiences'>): AgeBand {
  return bandFor(r.minMonths ?? (r.audiences.includes('baby') ? 6 : r.audiences.includes('child') ? 24 : 96));
}

export interface Nutrients { kcal: number; kj: number; prot: number; carb: number; sugar: number; addedSugar: number; fiber: number; fat: number; sfa: number; salt: number; iron: number; calcium: number; grams: number; fvlGrams: number }
const ZERO = (): Nutrients => ({ kcal: 0, kj: 0, prot: 0, carb: 0, sugar: 0, addedSugar: 0, fiber: 0, fat: 0, sfa: 0, salt: 0, iron: 0, calcium: 0, grams: 0, fvlGrams: 0 });

/** Grammes d'une quantité de recette (pièce, cuillère, ml…). */
export function gramsOf(key: string, qty: number | null, unit: string | null): number {
  if (qty == null || !unit) return 0;
  const n = NUTRITION[key];
  const oil = /oil/.test(key);
  switch (unit) {
    case 'g': return qty;
    case 'ml': return qty * (oil ? 0.92 : 1);
    case 'u': return qty * (n?.gPerUnit ?? 100);
    case 'cs': return qty * (n?.gPerCs ?? 15);
    case 'cc': return qty * ((n?.gPerCs ?? 15) / 3);
    case 'pincee': return qty * 0.4;
    default: return 0;
  }
}

/** Valeurs nutritionnelles du plat entier et d'une portion. */
export function recipeNutrients(r: Pick<Recipe, 'ingredients' | 'servings'>): { total: Nutrients; portion: Nutrients; approximations: string[] } {
  const t = ZERO();
  const approx = new Set<string>();
  for (const x of r.ingredients) {
    if (x.optional) continue;
    const n = NUTRITION[x.key];
    if (!n) { approx.add(tr('l3.rcp.no_values', { name: INGREDIENTS[x.key]?.name ?? x.key })); continue; }
    if (n.approx) approx.add(n.approx);
    const g = gramsOf(x.key, x.qty, x.unit) * n.factor;
    const k = g / 100;
    t.kcal += n.per100.kcal * k; t.kj += n.per100.kj * k; t.prot += n.per100.prot * k; t.carb += n.per100.carb * k;
    t.sugar += n.per100.sugar * k; t.fiber += n.per100.fiber * k; t.fat += n.per100.fat * k; t.sfa += n.per100.sfa * k;
    t.salt += n.per100.salt * k; t.iron += n.per100.iron * k; t.calcium += n.per100.calcium * k;
    if (n.addedSugar) t.addedSugar += n.per100.sugar * k;
    t.grams += g;
    if (n.group) t.fvlGrams += g;
  }
  const s = Math.max(1, r.servings);
  const portion = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v / s])) as unknown as Nutrients;
  return { total: t, portion, approximations: [...approx] };
}

export interface ScorePart { key: 'base' | 'fvl' | 'fiber' | 'protein' | 'iron' | 'calcium' | 'addedSugar' | 'salt' | 'sfa'; points: number; max: number; value: number; unit: string }
export interface RecipeScore {
  score: number; band: AgeBand; parts: ScorePart[];
  /** Atouts et pistes d'amélioration (clés de traduction et valeurs). */
  strengths: ScorePart['key'][]; improvements: ScorePart['key'][];
  portion: Nutrients; per100: Nutrients; approximations: string[];
}

const lin = (v: number, lo: number, hi: number) => Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
const r1 = (v: number) => Math.round(v * 10) / 10;

export function scoreRecipe(r: Pick<Recipe, 'ingredients' | 'servings' | 'minMonths' | 'audiences'>, band: AgeBand = defaultBand(r)): RecipeScore {
  const { total, portion, approximations } = recipeNutrients(r);
  const per100 = Object.fromEntries(Object.entries(total).map(([k, v]) => [k, total.grams ? (v / total.grams) * 100 : 0])) as unknown as Nutrients;
  const ref = AGE_REFS[band];
  const kcal = Math.max(1, total.kcal);
  const fvlPct = total.grams ? (total.fvlGrams / total.grams) * 100 : 0;
  const protPct = ((total.prot * 4) / kcal) * 100;
  const sugarPct = ((total.addedSugar * 4) / kcal) * 100;
  const sfaPct = ((total.sfa * 9) / kcal) * 100;
  const ironShare = (portion.iron / ref.iron) * 100;
  const calciumShare = (portion.calcium / ref.calcium) * 100;
  const saltShare = (portion.salt / ref.salt) * 100;
  const parts: ScorePart[] = [
    { key: 'base', points: 40, max: 40, value: 40, unit: '' },
    { key: 'fvl', points: Math.round(20 * lin(fvlPct, 0, 50)), max: 20, value: Math.round(fvlPct), unit: '%' },
    { key: 'fiber', points: Math.round(10 * lin(per100.fiber, 0, 3)), max: 10, value: r1(per100.fiber), unit: 'g/100 g' },
    { key: 'protein', points: Math.round(10 * lin(protPct, 4, 12)), max: 10, value: Math.round(protPct), unit: '%' },
    { key: 'iron', points: Math.round(10 * lin(ironShare, 0, 25)), max: 10, value: Math.round(ironShare), unit: '%' },
    { key: 'calcium', points: Math.round(10 * lin(calciumShare, 0, 25)), max: 10, value: Math.round(calciumShare), unit: '%' },
    { key: 'addedSugar', points: -Math.round(15 * lin(sugarPct, 5, 25)), max: 15, value: Math.round(sugarPct), unit: '%' },
    { key: 'salt', points: -Math.round(15 * lin(saltShare, 25, 75)), max: 15, value: Math.round(saltShare), unit: '%' },
    { key: 'sfa', points: -Math.round(10 * lin(sfaPct, 12, 24)), max: 10, value: Math.round(sfaPct), unit: '%' },
  ];
  const score = Math.max(0, Math.min(100, parts.reduce((a, p) => a + p.points, 0)));
  const strengths = parts.filter((p) => p.key !== 'base' && p.points > 0 && p.points >= p.max * 0.7).map((p) => p.key);
  const improvements = parts.filter((p) => (p.points < 0 && Math.abs(p.points) >= p.max * 0.3) || (p.points >= 0 && p.key !== 'base' && p.key !== 'calcium' && p.key !== 'iron' && p.points <= p.max * 0.2)).map((p) => p.key);
  return { score, band, parts, strengths, improvements, portion, per100, approximations };
}

/** Coût par portion à partir de prix VÉRIFIÉS (au kilo ou au litre, ou à la pièce). Null si un prix manque. */
export interface IngredientPrice { key: string; pricePerKg?: number | null; pricePerUnit?: number | null; source: string; checkedOn: string }
export function costPerPortion(r: Pick<Recipe, 'ingredients' | 'servings'>, prices: Record<string, IngredientPrice>): { cost: number | null; missing: string[]; oldest: string | null } {
  let total = 0; const missing: string[] = []; let oldest: string | null = null;
  for (const x of r.ingredients) {
    if (x.optional || ['salt', 'herbs', 'cumin', 'cinnamon', 'paprika', 'curry', 'nutmeg', 'thyme', 'bay_leaf', 'vanilla', 'turmeric', 'ras_el_hanout'].includes(x.key)) continue;
    const p = prices[x.key];
    if (!p) { missing.push(x.key); continue; }
    if (!oldest || p.checkedOn < oldest) oldest = p.checkedOn;
    if (x.unit === 'u' && p.pricePerUnit != null) total += (x.qty ?? 0) * p.pricePerUnit;
    else if (p.pricePerKg != null) total += (gramsOf(x.key, x.qty, x.unit) / 1000) * p.pricePerKg;
    else missing.push(x.key);
  }
  return { cost: missing.length ? null : Math.round((total / Math.max(1, r.servings)) * 100) / 100, missing, oldest };
}
