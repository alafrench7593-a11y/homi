/**
 * Assemblage PUR du parcours du scanner : fiche trouvée (ou saisie) + corrections de la personne
 * → entrée des moteurs de règles. Aucune donnée n'est inventée : ce qui manque reste null et
 * apparaît dans « Informations manquantes ».
 * Testé par Jest (src/__tests__/scanner.test.ts).
 */
import type { CiqualFood, CosingIngredient, ProductCandidate, ProductSnapshot, RecallRow } from '../types-scanner';
import { toRecallInfo } from '../types-scanner';
import { DEMO_LABEL, splitIngredients, todayIso, type DataSourceInfo, type RecallCheck } from './scanCommon';
import type { FoodInput, FoodNutrition } from './scanFood';
import { PRODUCT_TYPE_LABEL, type Exposure, type ProductInput, type ProductType, type Zone } from './scanProduct';

export const PRODUCT_TYPES = Object.keys(PRODUCT_TYPE_LABEL) as ProductType[];

export function asProductType(s: string | null | undefined): ProductType | null {
  return s && (PRODUCT_TYPES as string[]).includes(s) ? (s as ProductType) : null;
}

export type IngredientsOrigin = 'database' | 'ocr_reviewed' | 'manual' | null;

/** Identification confirmée par la personne (« Est-ce bien ce produit ? » → oui). */
export interface ConfirmedSubject {
  candidate: ProductCandidate | null;
  /** Aliment générique de la table Ciqual choisi par la personne. */
  ciqual?: CiqualFood | null;
  name: string | null;
  brand: string | null;
  barcode: string | null;
  imageUrl: string | null;
}

/** Origine des données affichée sur le résultat. En mode démonstration, TOUT est étiqueté « Données de démonstration ». */
export function subjectDataSource(s: ConfirmedSubject, demoMode: boolean): DataSourceInfo & { collaborative?: boolean } {
  const c = s.candidate;
  if (c) {
    return {
      label: c.is_demo || demoMode ? `${c.data_source} — ${DEMO_LABEL}` : c.data_source,
      url: c.source_url || null,
      retrieved_on: c.data_retrieved_at || null,
      is_demo: c.is_demo || demoMode,
      collaborative: c.collaborative,
    };
  }
  if (s.ciqual) {
    return {
      label: s.ciqual.is_demo || demoMode ? `Table Ciqual — ${DEMO_LABEL}` : `Table Ciqual (Anses), ${s.ciqual.source_version}`,
      url: 'https://ciqual.anses.fr/',
      retrieved_on: s.ciqual.source_date,
      is_demo: s.ciqual.is_demo || demoMode,
    };
  }
  return {
    label: demoMode ? `Saisie par vous — ${DEMO_LABEL}` : 'Saisie par vous (non vérifiée par une base de produits)',
    url: null,
    retrieved_on: null,
    is_demo: demoMode,
  };
}

/** Noms d'ingrédients à rechercher dans CosIng (sans parenthèses, ni astérisques). */
export function ingredientNamesForCosing(text: string | null | undefined): string[] {
  return [...new Set(splitIngredients(text).map((x) => x.replace(/\s*\(.*?\)\s*/g, ' ').replace(/[.*]+$/, '').replace(/\s+/g, ' ').trim()).filter(Boolean))];
}

/** « arachide, lait » → ['arachide', 'lait'] (allergies déclarées, jamais déduites). */
export function parseAllergies(text: string | null | undefined): string[] {
  return [...new Set((text ?? '').split(/[,;\n]+/).map((x) => x.trim()).filter((x) => x.length >= 2))].slice(0, 20);
}

export function recallCheckOf(r: { checked: boolean; source: string; error: string | null; checkedOn?: string } | null | undefined, now = new Date()): RecallCheck | null {
  if (!r) return null;
  return { checked: r.checked, source: r.source, error: r.error, checkedOn: r.checkedOn ?? todayIso(now) };
}

export interface ProductDraft {
  type: ProductType | null;
  ingredientsText: string;
  ingredientsOrigin: IngredientsOrigin;
  ocrReadability?: number | null;
  precautionsText: string;
  periodAfterOpening: string;
  exposure: Exposure | null;
  zone: Zone | null;
}

export function buildProductInput(s: ConfirmedSubject, d: ProductDraft, extra: { recalls: RecallRow[]; recallCheck: RecallCheck | null; cosing: CosingIngredient[]; demoMode: boolean }): ProductInput {
  const text = d.ingredientsText.trim();
  return {
    identity: { name: s.name?.trim() || null, brand: s.brand?.trim() || null, barcode: s.barcode, imageUrl: s.imageUrl, confirmed: true },
    type: d.type,
    ingredientsText: text || null,
    ingredientsOrigin: text ? d.ingredientsOrigin : null,
    ocrReadability: d.ocrReadability ?? null,
    precautionsText: d.precautionsText.trim() || null,
    periodAfterOpening: d.periodAfterOpening.trim() || null,
    exposure: d.exposure,
    zone: d.zone,
    dataSource: subjectDataSource(s, extra.demoMode),
    recalls: extra.recalls.map(toRecallInfo),
    recallCheck: extra.recallCheck,
    cosing: extra.cosing.map((c) => ({ ...c, is_demo: c.is_demo || extra.demoMode })),
  };
}

/** Valeurs nutritionnelles : base produit d'abord (Open Food Facts), sinon table Ciqual importée ; sinon null. */
export function nutritionOf(s: ConfirmedSubject, demoMode: boolean): FoodNutrition | null {
  const n = s.candidate?.nutrition;
  if (n && (n.salt_g_100g != null || n.sugars_g_100g != null || n.energy_kcal_100g != null)) {
    return { ...n, source: 'openfoodfacts', sourceLabel: s.candidate!.is_demo || demoMode ? `${s.candidate!.data_source} — ${DEMO_LABEL}` : s.candidate!.data_source };
  }
  return s.ciqual ? nutritionFromCiqual(s.ciqual, demoMode) : null;
}

export function nutritionFromCiqual(row: CiqualFood, demoMode = false): FoodNutrition | null {
  const n = row.nutrients ?? {};
  if (n.sel_g == null && n.sucres_g == null && n.energie_kcal == null) return null;
  const demo = row.is_demo || demoMode;
  return {
    salt_g_100g: n.sel_g ?? null,
    sugars_g_100g: n.sucres_g ?? null,
    energy_kcal_100g: n.energie_kcal ?? null,
    source: demo ? 'ciqual_demo' : 'ciqual',
    sourceLabel: demo ? `Table Ciqual — ${DEMO_LABEL}` : `Table Ciqual (Anses), ${row.source_version}, ${row.source_date}`,
  };
}

export interface FoodDraft {
  ingredientsText: string;
  ingredientsOrigin: IngredientsOrigin;
  ocrReadability?: number | null;
}

export function buildFoodInput(s: ConfirmedSubject, d: FoodDraft, extra: { recalls: RecallRow[]; recallCheck: RecallCheck | null; catalogMatch: boolean; demoMode: boolean }): FoodInput {
  const text = d.ingredientsText.trim();
  const labels = s.candidate?.labels;
  return {
    identity: { name: s.name?.trim() || null, brand: s.brand?.trim() || null, barcode: s.barcode, imageUrl: s.imageUrl, confirmed: true },
    ingredientsText: text || null,
    ingredientsOrigin: text ? d.ingredientsOrigin : null,
    ocrReadability: d.ocrReadability ?? null,
    categories: s.candidate?.categories ?? (s.ciqual ? [s.ciqual.groupe, s.ciqual.sous_groupe].filter((x): x is string => !!x) : []),
    catalogMatch: extra.catalogMatch || !!s.ciqual,
    labels: labels ? { rawMilk: labels.rawMilk, alcohol: labels.alcohol, caffeine: labels.caffeine, sweeteners: labels.sweeteners } : undefined,
    nutrition: nutritionOf(s, extra.demoMode),
    declaredAllergens: s.candidate ? (s.candidate.allergens_known === false ? null : s.candidate.allergens) : null,
    traces: s.candidate?.traces ?? null,
    dataSource: subjectDataSource(s, extra.demoMode),
    recalls: extra.recalls.map(toRecallInfo),
    recallCheck: extra.recallCheck,
  };
}

export function snapshotOf(s: ConfirmedSubject, typeLabel: string | null, demoMode: boolean): ProductSnapshot {
  const src = subjectDataSource(s, demoMode);
  return {
    name: s.name, brand: s.brand, image_url: s.imageUrl, type: typeLabel,
    data_source: src.label, retrieved_on: src.retrieved_on ?? null, source_url: src.url ?? null,
  };
}

/** Aliment du catalogue interne (table foods) dont le nom ou un alias correspond exactement. */
export function catalogMatches(name: string, foods: { name: string; aliases?: string[] | null }[]): boolean {
  const f = (x: string) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\(.*?\)/g, '').trim();
  const n = f(name);
  return n.length >= 2 && foods.some((x) => f(x.name) === n || (x.aliases ?? []).some((a) => f(a) === n));
}
