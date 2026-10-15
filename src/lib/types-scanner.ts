/** Types du scanner (alignés sur supabase/migrations/20261016000600_scanner.sql et la fonction product-lookup). */
import type { Certainty, RecallInfo, ScanProfileKind } from './domain/scanCommon';
import type { FoodAnalysis, FoodAnswers } from './domain/scanFood';
import type { ProductAnalysis } from './domain/scanProduct';
import type { Explanation } from '../../supabase/functions/_shared/scan-explain';

export type ScanKind = 'product' | 'food';
export type ScanMethod = 'barcode' | 'photo' | 'photo_barcode' | 'import' | 'ingredients_photo' | 'manual' | 'search';

export interface ProductSnapshot {
  name: string | null;
  brand: string | null;
  image_url: string | null;
  type?: string | null;
  data_source?: string | null;
  retrieved_on?: string | null;
  source_url?: string | null;
}

export interface ScanRow {
  id: string;
  user_id: string;
  kind: ScanKind;
  method: ScanMethod;
  barcode: string | null;
  product_id: string | null;
  food_id: string | null;
  confirmed: boolean;
  product_snapshot: ProductSnapshot;
  target_profile: ScanProfileKind | null;
  target_age_months: number | null;
  answers: FoodAnswers | Record<string, unknown>;
  verdict: string | null;
  certainty: Certainty | null;
  sources: string[];
  is_demo: boolean;
  analysed_at: string | null;
  created_at: string;
}

export type ExplainResponse =
  | { ai: 'ok'; model: string; generated_on: string; verdict: string; explanation: Explanation }
  | { ai: 'not_configured' | 'unavailable' | 'rejected'; message?: string };

export interface ScanResultRow {
  id: string;
  scan_id: string;
  user_id: string;
  engine_version: string;
  result: ProductAnalysis | FoodAnalysis;
  explanation: ExplainResponse | null;
  created_at: string;
}

export interface ScanFavoriteRow { user_id: string; scan_id: string; created_at: string }

/** Rappel tel que renvoyé par product-lookup (cache product_recalls). */
export interface RecallRow {
  id: string;
  title: string;
  reason: string | null;
  risks?: string | null;
  recommended_action: string | null;
  official_url: string | null;
  source: string;
  published_on: string | null;
  lot_numbers: string[];
  is_demo: boolean;
  barcode?: string | null;
  gtins?: string[];
  brand?: string | null;
  product_name?: string | null;
  match?: 'gtin' | 'brand_name';
}

export function toRecallInfo(r: RecallRow): RecallInfo {
  return {
    id: r.id, title: r.title, reason: r.reason, risks: r.risks ?? null, recommended_action: r.recommended_action, official_url: r.official_url,
    source: r.source, published_on: r.published_on, lot_numbers: r.lot_numbers ?? [], match: r.match ?? 'gtin', is_demo: r.is_demo,
  };
}

/** Fiche produit normalisée (base interne ou Open Facts). */
export interface ProductCandidate {
  id?: string;
  barcode: string;
  name: string | null;
  brand: string | null;
  image_url: string | null;
  ingredients_text: string | null;
  allergens: string[];
  categories: string[];
  precautions_text: string | null;
  period_after_opening: string | null;
  nutrition: { salt_g_100g: number | null; sugars_g_100g: number | null; energy_kcal_100g: number | null } | null;
  labels: { rawMilk: boolean | null; alcohol: boolean | null; caffeine: boolean | null; sweeteners: boolean | null };
  kind: 'food' | 'cosmetic' | 'product';
  product_type: string | null;
  data_source: string;
  source_url: string;
  data_retrieved_at: string;
  last_modified: string | null;
  collaborative: boolean;
  is_demo: boolean;
}

export type DatabaseStatus = 'open_facts' | 'not_connected' | 'demo' | 'internal';

export interface LookupResponse {
  found: boolean;
  barcode?: string;
  message?: string;
  database?: DatabaseStatus;
  product?: ProductCandidate;
  recalls: RecallRow[];
  recall_check?: { checked: boolean; source: string; error: string | null; checkedOn?: string };
  needs_confirmation?: boolean;
}

export interface SearchResponse { candidates: ProductCandidate[]; database: DatabaseStatus; message?: string }

export interface CosingIngredient {
  inci_name: string; cas: string | null; ec: string | null; functions: string[]; restrictions: string | null; annex_refs: string[];
  source_url: string; updated_on: string; is_demo: boolean;
}

export interface CiqualFood {
  code: string; nom: string; groupe: string | null; sous_groupe: string | null;
  nutrients: { energie_kcal?: number | null; proteines_g?: number | null; glucides_g?: number | null; sucres_g?: number | null; lipides_g?: number | null; sel_g?: number | null };
  source_version: string; source_date: string; is_demo: boolean;
}

export interface FoodRef { id: string; name: string; category: string; allergen_group: string | null; is_major_allergen: boolean; ciqual_code?: string | null; is_demo?: boolean }

export interface QuotaStatus { used: number; quota: number; remaining: number }

/** Traduction des fonctions CosIng (libellés officiels en anglais) ; à défaut, le libellé officiel est affiché. */
export const COSING_FUNCTION_FR: Record<string, string> = {
  ABRASIVE: 'Abrasif', ABSORBENT: 'Absorbant', ANTICAKING: 'Anti-agglomérant', ANTIMICROBIAL: 'Antimicrobien', ANTIOXIDANT: 'Antioxydant',
  ANTIPERSPIRANT: 'Anti-transpirant', ANTISTATIC: 'Antistatique', ASTRINGENT: 'Astringent', BINDING: 'Liant', BLEACHING: 'Blanchissant',
  BUFFERING: 'Tampon', 'BULKING': 'Agent de charge', CHELATING: 'Chélatant', CLEANSING: 'Nettoyant', COLORANT: 'Colorant', DENATURANT: 'Dénaturant',
  DEODORANT: 'Déodorant', DEPILATORY: 'Dépilatoire', EMOLLIENT: 'Émollient', EMULSIFYING: 'Émulsifiant', 'EMULSION STABILISING': 'Stabilisant d’émulsion',
  'FILM FORMING': 'Filmogène', FOAMING: 'Moussant', 'FOAM BOOSTING': 'Renforçateur de mousse', 'GEL FORMING': 'Gélifiant', 'HAIR CONDITIONING': 'Conditionneur capillaire',
  HUMECTANT: 'Humectant', MASKING: 'Masquant', MOISTURISING: 'Hydratant', 'NAIL CONDITIONING': 'Soin des ongles', OPACIFYING: 'Opacifiant',
  'ORAL CARE': 'Soin bucco-dentaire', OXIDISING: 'Oxydant', PERFUMING: 'Parfumant', PLASTICISER: 'Plastifiant', PRESERVATIVE: 'Conservateur',
  PROPELLANT: 'Gaz propulseur', REDUCING: 'Réducteur', REFRESHING: 'Rafraîchissant', SKIN_CONDITIONING: 'Soin de la peau', 'SKIN CONDITIONING': 'Soin de la peau',
  'SKIN PROTECTING': 'Protecteur cutané', SMOOTHING: 'Lissant', SOLVENT: 'Solvant', SOOTHING: 'Apaisant', SURFACTANT: 'Tensioactif', TONIC: 'Tonifiant',
  'UV ABSORBER': 'Absorbeur UV', 'UV FILTER': 'Filtre UV', 'VISCOSITY CONTROLLING': 'Agent de viscosité',
};

export function cosingFunctionLabel(f: string): string {
  return COSING_FUNCTION_FR[f.trim().toUpperCase()] ?? f;
}
