/**
 * Moteur de règles « Puis-je manger ou donner cet aliment ? ».
 *
 * - Détection prudente de caractéristiques (« facettes ») à partir du nom confirmé, des ingrédients
 *   et des réponses aux questions complémentaires (cru/cuit, pasteurisé, fait maison, texture…).
 * - Une photo seule ne permet pas de connaître la cuisson, la conservation ou la composition :
 *   la question est posée, ou le résultat est « Impossible à confirmer ».
 * - Chaque constat cite sa source et sa date ; aucune garantie d'innocuité, aucun diagnostic d'allergie.
 * Module pur, testé par Jest (src/__tests__/scanner.test.ts).
 */
import {
  DEMO_LABEL, ENGINE_VERSION, GENERAL_DISCLAIMER, RECALL_DISCLAIMER, findingSources, isChildProfile, norm, profileAgeMonths, profileLabel,
  sortFindings, splitIngredients, todayIso,
  type Certainty, type DataSourceInfo, type Finding, type RecallCheck, type RecallInfo, type ScanProfile,
} from './scanCommon';
import type { ScanSource } from './scanSources';
import { t as tr } from '@/i18n';
import { checkAllergies } from '../../../supabase/functions/_shared/allergens';

export const FOOD_VERDICTS = [
  'Adapté selon les informations disponibles',
  'Adapté sous certaines conditions',
  'À préparer différemment',
  'À éviter pour ce profil selon la source indiquée',
  'Impossible à confirmer',
] as const;
export type FoodVerdict = (typeof FOOD_VERDICTS)[number];

/** Libellé affiché d'un verdict dans la langue en cours (la valeur enregistrée reste le texte français). */
export function foodVerdictLabel(v: string): string {
  const i = (FOOD_VERDICTS as readonly string[]).indexOf(v);
  return i < 0 ? v : tr(`l4.sf.v.${i}` as 'l4.sf.v.0');
}

export interface FoodNutrition {
  salt_g_100g?: number | null;
  sugars_g_100g?: number | null;
  energy_kcal_100g?: number | null;
  /** Origine des valeurs : base produit (Open Food Facts) ou table Ciqual importée. */
  source: 'openfoodfacts' | 'ciqual' | 'ciqual_demo';
  sourceLabel: string;
}

export interface FoodInput {
  identity: { name: string | null; brand?: string | null; barcode?: string | null; imageUrl?: string | null; confirmed: boolean };
  ingredientsText?: string | null;
  ingredientsOrigin?: 'database' | 'ocr_reviewed' | 'manual' | null;
  ocrReadability?: number | null;
  /** Catégories de la base produit (ex. tags Open Food Facts), facultatif. */
  categories?: string[];
  /** L'aliment correspond à une fiche connue (table foods ou Ciqual) : utile pour un aliment sans ingrédients. */
  catalogMatch?: boolean;
  /** Caractéristiques connues par les données (et non devinées). */
  labels?: { rawMilk?: boolean | null; alcohol?: boolean | null; caffeine?: boolean | null; sweeteners?: boolean | null };
  nutrition?: FoodNutrition | null;
  /** Allergènes déclarés par la base produit (ex. « en:milk ») ; null = non renseigné. */
  declaredAllergens?: string[] | null;
  /** Traces (« peut contenir ») ; null = non renseigné. */
  traces?: string[] | null;
  dataSource: DataSourceInfo & { collaborative?: boolean };
  recalls: RecallInfo[];
  recallCheck?: RecallCheck | null;
}

export type Tri<T extends string> = T | 'unknown';
export interface FoodAnswers {
  cooking?: Tri<'raw' | 'undercooked' | 'cooked'>;
  milk?: Tri<'raw' | 'pasteurized'>;
  origin?: Tri<'homemade' | 'industrial'>;
  texture?: Tri<'smooth' | 'mashed' | 'soft_pieces' | 'pieces' | 'whole'>;
  cut?: Tri<'whole' | 'cut_small' | 'crushed'>;
  storage?: Tri<'fridge' | 'room' | 'frozen'>;
  openedDaysAgo?: number | null;
  diversification?: Tri<'started' | 'not_started'>;
  /** Allergies connues (déclarées), en plus de celles du profil. */
  allergies?: string[];
}

export type Facet =
  | 'raw_milk' | 'cheese' | 'cheese_hard_cooked' | 'cheese_soft_or_uncooked' | 'grated_cheese' | 'dairy'
  | 'honey' | 'whole_nuts' | 'grapes' | 'cherry_tomato' | 'popcorn' | 'hard_raw_veg' | 'olives' | 'sausage_round' | 'hard_candy'
  | 'raw_meat' | 'meat' | 'raw_fish' | 'smoked_fish' | 'fish' | 'fish_avoid_mercury' | 'fish_limit_mercury'
  | 'raw_shellfish' | 'cooked_crustacean' | 'raw_egg_dish' | 'egg' | 'charcuterie_cold' | 'charcuterie_dry' | 'charcuterie_cook'
  | 'liver' | 'liquorice' | 'caffeine' | 'alcohol' | 'sweeteners' | 'added_sugar' | 'added_salt' | 'sprouts' | 'raw_veg_herbs'
  | 'soy' | 'infant_formula' | 'perishable';

const has = (re: RegExp, ...texts: string[]) => texts.some((t) => re.test(t));

/** Facettes détectées à partir du nom (prioritaire) et des ingrédients. Volontairement prudent et explicable. */
export function detectFacets(input: FoodInput): Set<Facet> {
  const name = norm(input.identity.name ?? '');
  const ingr = norm(input.ingredientsText ?? '');
  const cats = norm((input.categories ?? []).join(' '));
  const all = `${name} ${ingr} ${cats}`;
  const f = new Set<Facet>();
  const add = (x: Facet, cond: boolean) => { if (cond) f.add(x); };

  add('raw_milk', input.labels?.rawMilk === true || has(/lait cru|au lait cru|raw milk/, all));
  const cheese = has(/fromage|brie|camembert|roquefort|reblochon|mozzarella|feta|chevre|comte|parmesan|parmigiano|emmental|gruyere|beaufort|cantal|morbier|munster|coulommiers|mont d'or|vacherin|gorgonzola|raclette|tomme|ricotta|mascarpone|burrata|saint-nectaire|livarot|epoisses|pont-l'eveque|abondance|grana padano/, name, cats);
  add('cheese', cheese);
  add('cheese_hard_cooked', cheese && has(/comte|parmesan|parmigiano|emmental|gruyere|beaufort|abondance|grana padano/, name));
  add('cheese_soft_or_uncooked', cheese && has(/brie|camembert|coulommiers|reblochon|munster|mont d'or|vacherin|roquefort|bleu|gorgonzola|feta|mozzarella|morbier|raclette|tomme|saint-nectaire|livarot|epoisses|pont-l'eveque|burrata|chevre frais|fromage frais|ricotta|mascarpone/, name));
  add('grated_cheese', cheese && has(/rape/, name));
  add('dairy', cheese || has(/\blait\b|yaourt|yogourt|creme fraiche|fromage blanc|petit-suisse|beurre/, name));
  add('honey', has(/\bmiel\b|\bhoney\b/, name, ingr));
  add('whole_nuts', has(/cacahuete|arachide|\bnoix\b|noisette|amande|pistache|cajou|pignon|macadamia/, name) && !has(/puree|beurre|poudre|creme|pate a tartiner|lait|boisson|huile/, name));
  add('grapes', has(/\braisins?\b/, name) && !has(/jus|sec|confiture|compote/, name));
  add('cherry_tomato', has(/tomates? cerises?/, name));
  add('popcorn', has(/pop ?corn/, name));
  add('hard_raw_veg', has(/(carotte|celeri|pomme|chou|radis|poivron)s? crue?s?|crudites?/, name));
  add('olives', has(/\bolives?\b/, name) && !has(/huile/, name));
  add('sausage_round', has(/knack|saucisse|chipolata|hot.?dog|mini.?saucisse/, name));
  add('hard_candy', has(/bonbon|sucette|dragee|chewing|caramel dur/, name));
  add('raw_meat', has(/tartare|carpaccio|viande crue|steak cru/, name));
  add('meat', has(/boeuf|steak|viande|veau|agneau|\bporc\b|poulet|volaille|dinde|canard|hache|burger|gibier|lapin|roti/, name));
  add('raw_fish', has(/sushi|sashimi|ceviche|tarama|poisson cru|\bmaki\b|poke|gravlax/, name));
  add('smoked_fish', has(/(saumon|truite|hareng|maquereau|poisson|haddock|anchois|thon|flétan|fletan)[^,]*(fume|marine)|(fume|marine)[^,]*(saumon|truite|hareng|poisson)/, name));
  add('fish', has(/saumon|thon|cabillaud|colin|merlu|sardine|maquereau|truite|\bsole\b|poisson|\blieu\b|dorade|daurade|\bbar\b|\bloup\b|lotte|\braie\b|espadon|hareng|anchois|requin|marlin|brochet|anguille|fletan|bonite|empereur|sabre|siki|lamproie/, name));
  add('fish_avoid_mercury', has(/espadon|marlin|siki|requin|lamproie/, name));
  add('fish_limit_mercury', has(/\bthon\b|bonite|\braie\b|dorade|daurade|\bbar\b|\bloup\b|lotte|baudroie|empereur|fletan|\bsabre\b|brochet|anguille/, name));
  add('raw_shellfish', has(/huitres?|oursins?|coquillages? crus?|palourdes? crues?/, name));
  add('cooked_crustacean', has(/crevettes?|langoustines?|crabe|homard|ecrevisses?|bouquet/, name) && !has(/crue?s?\b/, name));
  add('raw_egg_dish', has(/mayonnaise|mousse au chocolat|tiramisu|oeufs? crus?|oeuf (a la )?coque|oeuf mollet|aioli|bearnaise|hollandaise|zabaglione|sabayon/, name));
  add('egg', has(/\boeufs?\b|omelette/, name));
  add('charcuterie_cold', has(/jambon (cuit|blanc|de paris)|rillettes|\bpate\b|pate de campagne|foie gras|terrine|en gelee|galantine|museau|mousse de foie/, name));
  add('charcuterie_dry', has(/saucisson|jambon (cru|sec)|chorizo|coppa|bresaola|serrano|bayonne|jambon de parme|rosette|pancetta/, name));
  add('charcuterie_cook', has(/saucisse|boudin|lardons?|bacon|chipolata|merguez/, name));
  add('liver', has(/\bfoie\b/, name));
  add('liquorice', has(/reglisse|glycyrrhiz|liquorice/, name, ingr));
  add('caffeine', input.labels?.caffeine === true || has(/\bcafe\b|expresso|espresso|cappuccino|\bthe\b( noir| vert)?|\bmate\b|\bcola\b|boisson energisante|energy drink|guarana|cafeine/, name) || has(/cafeine|guarana/, ingr));
  add('alcohol', input.labels?.alcohol === true || has(/alcool|biere|\bvin\b|champagne|cidre|\brhum\b|vodka|whisky|liqueur|cognac|pastis|sangria|kirsch|calvados/, name) || has(/% ?vol|alcool|rhum|kirsch|liqueur|\bvin\b/, ingr));
  add('sweeteners', input.labels?.sweeteners === true || has(/aspartame|acesulfame|sucralose|saccharine|stevia|steviol|cyclamate|edulcorant|maltitol|sorbitol|xylitol|erythritol/, ingr, name));
  add('added_sugar', has(/(^|, ?)(sucre|sucres|sirop de glucose|sirop|dextrose|saccharose|glucose-fructose|sucre de canne)\b/, ingr));
  add('added_salt', has(/(^|, ?)sel\b/, ingr));
  add('sprouts', has(/graines germees|germes de soja|pousses de/, name, ingr));
  add('raw_veg_herbs', has(/salade|crudite|herbes fraiches|persil|ciboulette|basilic|coriandre|menthe fraiche/, name));
  add('soy', has(/soja|tofu|tempeh/, name));
  add('infant_formula', has(/lait infantile|1er age|2e age|2eme age|lait de croissance|preparation pour nourrissons|preparation de suite/, name, cats));
  add('perishable', ['cheese', 'raw_meat', 'meat', 'raw_fish', 'smoked_fish', 'fish', 'raw_shellfish', 'cooked_crustacean', 'raw_egg_dish', 'egg', 'charcuterie_cold', 'charcuterie_cook', 'dairy'].some((x) => f.has(x as Facet)) || has(/restes?|plat prepare|plat cuisine|salade composee/, name));
  return f;
}

// ---------------------------------------------------------------- questions complémentaires
export type QuestionKey = 'cooking' | 'milk' | 'origin' | 'texture' | 'cut' | 'storage' | 'openedDaysAgo' | 'diversification' | 'allergies';
export interface FoodQuestion {
  key: QuestionKey;
  label: string;
  why: string;
  options?: { value: string; label: string }[];
  /** true : sans réponse, le résultat ne peut pas être confirmé. */
  critical: boolean;
}

const TRI_UNKNOWN = { value: 'unknown', get label() { return tr('l4.sf.q.unknown'); } };

export function foodQuestions(input: FoodInput, profile: ScanProfile): FoodQuestion[] {
  const f = detectFacets(input);
  const age = profileAgeMonths(profile);
  const child = isChildProfile(profile);
  const sensitive = profile.kind === 'pregnant' || child;
  const q: FoodQuestion[] = [];
  const cookable = f.has('meat') || f.has('fish') || f.has('egg') || f.has('cooked_crustacean') || f.has('charcuterie_cook');
  if (cookable && !f.has('raw_meat') && !f.has('raw_fish') && !f.has('smoked_fish') && sensitive) {
    q.push({
      key: 'cooking', label: tr('l4.sf.q.cooking.l'), why: tr('l4.sf.q.cooking.w'), critical: true,
      options: [{ value: 'cooked', label: tr('l4.sf.q.cooking.o1') }, { value: 'undercooked', label: tr('l4.sf.q.cooking.o2') }, { value: 'raw', label: tr('l4.sf.q.cooking.o3') }, TRI_UNKNOWN],
    });
  }
  if ((f.has('cheese') || f.has('dairy')) && !f.has('raw_milk') && !f.has('cheese_hard_cooked') && !f.has('cheese_soft_or_uncooked') && (sensitive)) {
    q.push({
      key: 'milk', label: tr('l4.sf.q.milk.l'), why: tr('l4.sf.q.milk.w'), critical: true,
      options: [{ value: 'pasteurized', label: tr('l4.sf.q.milk.o1') }, { value: 'raw', label: tr('l4.sf.q.milk.o2') }, TRI_UNKNOWN],
    });
  }
  if (f.has('raw_egg_dish') && sensitive) {
    q.push({
      key: 'origin', label: tr('l4.sf.q.origin.l'), why: tr('l4.sf.q.origin.w'), critical: true,
      options: [{ value: 'homemade', label: tr('l4.sf.q.origin.o1') }, { value: 'industrial', label: tr('l4.sf.q.origin.o2') }, TRI_UNKNOWN],
    });
  }
  if (child && age != null && age < 36 && !f.has('infant_formula')) {
    q.push({
      key: 'texture', label: tr('l4.sf.q.texture.l'), why: tr('l4.sf.q.texture.w'), critical: false,
      options: [{ value: 'smooth', label: tr('l4.sf.q.texture.o1') }, { value: 'mashed', label: tr('l4.sf.q.texture.o2') }, { value: 'soft_pieces', label: tr('l4.sf.q.texture.o3') }, { value: 'pieces', label: tr('l4.sf.q.texture.o4') }, { value: 'whole', label: tr('l4.sf.q.texture.o5') }, TRI_UNKNOWN],
    });
  }
  if (child && age != null && age < 48 && ['whole_nuts', 'grapes', 'cherry_tomato', 'olives', 'sausage_round', 'hard_raw_veg'].some((x) => f.has(x as Facet))) {
    q.push({
      key: 'cut', label: tr('l4.sf.q.cut.l'), why: tr('l4.sf.q.cut.w'), critical: true,
      options: [{ value: 'whole', label: tr('l4.sf.q.texture.o5') }, { value: 'cut_small', label: tr('l4.sf.q.cut.o2') }, { value: 'crushed', label: tr('l4.sf.q.cut.o3') }, TRI_UNKNOWN],
    });
  }
  if (child && age != null && age >= 4 && age < 7) {
    q.push({
      key: 'diversification', label: tr('l4.sf.q.div.l'), why: tr('l4.sf.q.div.w'), critical: false,
      options: [{ value: 'started', label: tr('l4.sf.q.div.o1') }, { value: 'not_started', label: tr('l4.sf.q.div.o2') }, TRI_UNKNOWN],
    });
  }
  if (f.has('perishable')) {
    q.push({
      key: 'storage', label: tr('l4.sf.q.stor.l'), why: tr('l4.sf.q.stor.w'), critical: false,
      options: [{ value: 'fridge', label: tr('l4.sf.q.stor.o1') }, { value: 'room', label: tr('l4.sf.q.stor.o2') }, { value: 'frozen', label: tr('l4.sf.q.stor.o3') }, TRI_UNKNOWN],
    });
    q.push({ key: 'openedDaysAgo', label: tr('l4.sf.q.open.l'), why: tr('l4.sf.q.open.w'), critical: false });
  }
  q.push({ key: 'allergies', label: tr('l4.sf.q.all.l'), why: tr('l4.sf.q.all.w'), critical: false });
  return q;
}

// ---------------------------------------------------------------- analyse
export interface FoodAnalysis {
  kind: 'food';
  verdict: FoodVerdict;
  verdictReason: string;
  certainty: Certainty;
  certaintyReasons: string[];
  profile: ScanProfile;
  profileLabel: string;
  food: { name: string | null; brand: string | null; barcode: string | null; imageUrl: string | null };
  facets: Facet[];
  ingredients: string[];
  nutrition: FoodNutrition | null;
  answers: FoodAnswers;
  findings: Finding[];
  missing: string[];
  unanswered: QuestionKey[];
  askProfessional: string | null;
  recalls: RecallInfo[];
  recallCheck: RecallCheck | null;
  recallDisclaimer: string;
  sources: ScanSource[];
  dataSource: DataSourceInfo;
  demo: boolean;
  demoLabel: string | null;
  disclaimer: string;
  engineVersion: string;
  analysedOn: string;
  score: null;
}

const unknown = (v: unknown) => v == null || v === 'unknown';

export function analyzeFood(input: FoodInput, profile: ScanProfile, answers: FoodAnswers = {}, now = new Date()): FoodAnalysis {
  const f = detectFacets(input);
  const age = profileAgeMonths(profile);
  const child = isChildProfile(profile);
  const pregnant = profile.kind === 'pregnant';
  const breastfeeding = profile.kind === 'breastfeeding';
  const findings: Finding[] = [];
  const missing: string[] = [];
  const unanswered: QuestionKey[] = [];
  const certaintyReasons: string[] = [];
  let certainty: Certainty = 'high';
  let impossible: string | null = null;
  let askProfessional: string | null = null;
  const lower = (to: Certainty, why: string) => {
    const rank = { high: 2, medium: 1, low: 0 };
    if (rank[to] < rank[certainty]) certainty = to;
    certaintyReasons.push(why);
  };
  const push = (x: Finding) => findings.push(x);
  const need = (key: QuestionKey, label: string) => {
    unanswered.push(key);
    missing.push(label);
  };

  // -- Identification
  if (!input.identity.confirmed || !input.identity.name) {
    impossible = tr('l4.sf.imp.unconfirmed');
    lower('low', tr('l4.sf.cr.unconfirmed'));
  }
  const ingredients = splitIngredients(input.ingredientsText);
  const meaningful = [...f].filter((x) => x !== 'perishable');
  if (!impossible && meaningful.length === 0 && ingredients.length === 0 && !input.catalogMatch) {
    impossible = tr('l4.sf.imp.unknown');
    missing.push(tr('l4.sf.miss.composition'));
    lower('low', tr('l4.sf.cr.unrecognised'));
  }
  if (child && age == null) {
    impossible ??= tr('l4.sf.imp.age');
    missing.push(tr('l4.sf.miss.age'));
  }
  if (input.dataSource.is_demo) lower('low', tr('l4.sf.cr.demo', { label: DEMO_LABEL }));
  else if (input.dataSource.collaborative) lower('medium', tr('l4.sf.cr.collab'));
  if (input.ingredientsOrigin === 'manual') lower('low', tr('l4.sf.cr.manual'));
  if (input.ingredientsOrigin === 'ocr_reviewed') lower(input.ocrReadability != null && input.ocrReadability < 0.6 ? 'low' : 'medium', tr('l4.sf.cr.ocr'));

  // -- Rappels officiels
  for (const r of input.recalls) {
    if (r.match === 'gtin') {
      push({ id: 'recall', level: 'avoid', title: tr('l4.sf.f.recall.t', { title: r.title }), explanation: `${r.reason ?? tr('l4.sf.recall.noReason')}${r.recommended_action ? ` ${tr('l4.sf.recall.action', { action: r.recommended_action })}` : ''} ${tr('l4.sf.recall.lot')}`, sourceIds: ['rappelconso'] });
    } else {
      push({ id: 'recall_possible', level: 'precaution', title: tr('l4.sf.f.recall_possible.t', { title: r.title }), explanation: tr('l4.sf.f.recall_possible.e'), sourceIds: ['rappelconso'] });
      lower('medium', tr('l4.sf.cr.recall_possible'));
    }
  }

  // -- Allergies déclarées : trois niveaux (identifié, possible, impossible à vérifier), jamais « sans risque »
  const allergies = [...(profile.allergies ?? []), ...(answers.allergies ?? [])].map((a) => a.trim()).filter((a) => a.length >= 2);
  if (allergies.length) {
    const fromDb = input.ingredientsOrigin === 'database' || input.declaredAllergens != null;
    const chk = checkAllergies({
      allergies,
      declaredTags: input.declaredAllergens ?? (fromDb ? null : []),
      tracesTags: input.traces ?? (fromDb ? null : []),
      ingredientsText: input.ingredientsText ?? null,
      nameText: input.identity.name ?? null,
    });
    for (const m of chk.identified) {
      push({ id: `allergy_${norm(m.allergy)}`, level: 'avoid', title: `${tr('l4.sf.f.allergy.t', { allergy: m.allergy })}${m.allergen && norm(m.allergen) !== norm(m.allergy) ? ` (${m.allergen.toLowerCase()})` : ''}`,
        explanation: `${tr(m.via === 'declared' ? 'l4.sf.al.declared' : 'l4.sf.al.listed')} ${tr('l4.sf.al.nodiag')}`, sourceIds: ['eu-inco-1169-2011'] });
    }
    for (const m of chk.possible) {
      push({ id: `allergy_trace_${norm(m.allergy)}`, level: 'precaution', title: tr('l4.sf.f.allergy_trace.t', { allergy: m.allergy }),
        explanation: tr('l4.sf.f.allergy_trace.e'), sourceIds: ['eu-inco-1169-2011'] });
    }
    if (chk.noMatchNote) {
      push({ id: 'allergy_unchecked', level: chk.insufficient.length ? 'missing' : 'info', title: chk.insufficient.length ? tr('l4.sf.f.allergy_unchecked.t1') : tr('l4.sf.f.allergy_unchecked.t2'), explanation: chk.noMatchNote, sourceIds: ['eu-inco-1169-2011'] });
      if (chk.insufficient.length && !input.ingredientsText) lower('low', tr('l4.sf.cr.allergy_unknown'));
      else if (chk.insufficient.length) lower('medium', tr('l4.sf.cr.allergy_partial', { list: chk.insufficient.join(', ').toLowerCase() }));
    }
  }

  // ================================================================ grossesse
  if (pregnant) {
    if (f.has('alcohol')) push({ id: 'p_alcohol', level: 'avoid', title: tr('l4.sf.f.alcohol.t'), explanation: tr('l4.sf.f.p_alcohol.e'), sourceIds: ['sante-alcool'] });
    if (f.has('cheese_hard_cooked') && !f.has('grated_cheese')) {
      push({ id: 'p_hard_cheese', level: 'precaution', title: tr('l4.sf.f.p_hard_cheese.t'), explanation: tr('l4.sf.f.p_hard_cheese.e'), sourceIds: ['spf-grossesse-2025', 'anses-lait-cru-2022'] });
    } else if (f.has('cheese_soft_or_uncooked')) {
      push({ id: 'p_soft_cheese', level: 'avoid', title: tr('l4.sf.f.p_soft_cheese.t'), explanation: tr('l4.sf.f.p_soft_cheese.e'), sourceIds: ['spf-grossesse-2025'] });
    } else if (f.has('raw_milk') || answers.milk === 'raw') {
      push({ id: 'p_raw_milk', level: 'avoid', title: tr('l4.sf.f.raw_milk.t'), explanation: tr('l4.sf.f.p_raw_milk.e'), sourceIds: ['spf-grossesse-2025', 'anses-lait-cru-2022'] });
    } else if (f.has('cheese') || f.has('dairy')) {
      if (unknown(answers.milk) && f.has('cheese')) need('milk', tr('l4.sf.miss.milk'));
      else if (answers.milk === 'pasteurized' && f.has('cheese')) {
        push({ id: 'p_cheese_type', level: 'precaution', title: tr('l4.sf.f.p_cheese_type.t'), explanation: tr('l4.sf.f.p_cheese_type.e'), sourceIds: ['spf-grossesse-2025'] });
      }
    }
    if (f.has('grated_cheese')) push({ id: 'p_grated', level: 'avoid', title: tr('l4.sf.f.p_grated.t'), explanation: tr('l4.sf.f.p_grated.e'), sourceIds: ['spf-grossesse-2025'] });
    if (f.has('charcuterie_cold') || f.has('charcuterie_dry')) push({ id: 'p_charcuterie', level: 'avoid', title: tr('l4.sf.f.p_charcuterie.t'), explanation: tr('l4.sf.f.p_charcuterie.e'), sourceIds: ['spf-grossesse-2025', 'mpedia-listeriose-2025'] });
    else if (f.has('charcuterie_cook')) {
      if (answers.cooking === 'cooked') push({ id: 'p_charcuterie_cook', level: 'precaution', title: tr('l4.sf.f.p_charcuterie_cook.t1'), explanation: tr('l4.sf.f.p_charcuterie_cook.e1'), sourceIds: ['spf-grossesse-2025'] });
      else push({ id: 'p_charcuterie_cook', level: 'prepare', title: tr('l4.sf.f.p_charcuterie_cook.t2'), explanation: tr('l4.sf.f.p_charcuterie_cook.e2'), sourceIds: ['spf-grossesse-2025'] });
    }
    if (f.has('raw_meat')) push({ id: 'p_raw_meat', level: 'avoid', title: tr('l4.sf.f.p_raw_meat.t'), explanation: tr('l4.sf.f.p_raw_meat.e'), sourceIds: ['spf-grossesse-2025'] });
    if (f.has('raw_fish')) push({ id: 'p_raw_fish', level: 'avoid', title: tr('l4.sf.f.p_raw_fish.t'), explanation: tr('l4.sf.f.p_raw_fish.e'), sourceIds: ['spf-grossesse-2025'] });
    if (f.has('smoked_fish')) push({ id: 'p_smoked_fish', level: 'avoid', title: tr('l4.sf.f.p_smoked_fish.t'), explanation: tr('l4.sf.f.p_smoked_fish.e'), sourceIds: ['spf-grossesse-2025', 'mpedia-listeriose-2025'] });
    if (f.has('raw_shellfish')) push({ id: 'p_raw_shellfish', level: 'avoid', title: tr('l4.sf.f.p_raw_shellfish.t'), explanation: tr('l4.sf.f.p_raw_shellfish.e'), sourceIds: ['spf-grossesse-2025'] });
    if (f.has('cooked_crustacean')) {
      if (answers.origin === 'homemade' && answers.cooking === 'cooked') push({ id: 'p_crustacean', level: 'precaution', title: tr('l4.sf.f.p_crustacean.t1'), explanation: tr('l4.sf.f.p_crustacean.e1'), sourceIds: ['spf-grossesse-2025'] });
      else push({ id: 'p_crustacean', level: 'prepare', title: tr('l4.sf.f.p_crustacean.t2'), explanation: tr('l4.sf.f.p_crustacean.e2'), sourceIds: ['spf-grossesse-2025'] });
    }
    if (f.has('raw_egg_dish')) {
      if (answers.origin === 'homemade') push({ id: 'p_raw_egg', level: 'avoid', title: tr('l4.sf.f.p_raw_egg.t1'), explanation: tr('l4.sf.f.p_raw_egg.e1'), sourceIds: ['spf-grossesse-2025'] });
      else if (answers.origin === 'industrial') push({ id: 'p_raw_egg', level: 'precaution', title: tr('l4.sf.f.p_raw_egg.t2'), explanation: tr('l4.sf.f.p_raw_egg.e2'), sourceIds: ['spf-grossesse-2025'] });
      else need('origin', tr('l4.sf.miss.origin'));
    }
    if (f.has('fish_avoid_mercury')) push({ id: 'p_mercury', level: 'avoid', title: tr('l4.sf.f.mercury_avoid.t'), explanation: tr('l4.sf.f.p_mercury.e'), sourceIds: ['anses-mercure-2024', 'spf-grossesse-2025'] });
    else if (f.has('fish_limit_mercury')) push({ id: 'p_mercury_limit', level: 'precaution', title: tr('l4.sf.f.p_mercury_limit.t'), explanation: tr('l4.sf.f.p_mercury_limit.e'), sourceIds: ['anses-mercure-2024'] });
    if (f.has('sprouts')) push({ id: 'p_sprouts', level: 'avoid', title: tr('l4.sf.f.p_sprouts.t'), explanation: tr('l4.sf.f.p_sprouts.e'), sourceIds: ['mpedia-listeriose-2025'] });
    if (f.has('soy')) push({ id: 'p_soy', level: 'avoid', title: tr('l4.sf.f.p_soy.t'), explanation: tr('l4.sf.f.p_soy.e'), sourceIds: ['spf-grossesse-2025'] });
    if (f.has('liquorice')) push({ id: 'p_liquorice', level: 'avoid', title: tr('l4.sf.f.liquorice.t'), explanation: tr('l4.sf.f.p_liquorice.e'), sourceIds: ['anses-reglisse-2025'] });
    if (f.has('liver')) {
      push({ id: 'p_liver', level: 'professional', title: tr('l4.sf.f.p_liver.t'), explanation: tr('l4.sf.f.p_liver.e'), sourceIds: ['lecrat'] });
      askProfessional ??= tr('l4.sf.ask.liver');
    }
    if (f.has('caffeine')) {
      push({ id: 'p_caffeine', level: 'professional', title: tr('l4.sf.f.caffeine.t'), explanation: tr('l4.sf.f.p_caffeine.e'), sourceIds: ['lecrat'] });
    }
    if (f.has('raw_veg_herbs')) push({ id: 'p_wash', level: 'precaution', title: tr('l4.sf.f.p_wash.t'), explanation: tr('l4.sf.f.p_wash.e'), sourceIds: ['spf-grossesse-2025'] });
    if ((f.has('meat') || f.has('fish') || f.has('egg')) && !f.has('raw_meat') && !f.has('raw_fish') && !f.has('smoked_fish') && !f.has('raw_egg_dish')) {
      if (answers.cooking === 'raw' || answers.cooking === 'undercooked') push({ id: 'p_cook', level: 'prepare', title: tr('l4.sf.f.cook.t'), explanation: tr('l4.sf.f.p_cook.e'), sourceIds: ['spf-grossesse-2025'] });
      else if (unknown(answers.cooking)) need('cooking', tr('l4.sf.miss.cooking'));
    }
  }

  // ================================================================ allaitement
  if (breastfeeding) {
    if (f.has('alcohol')) push({ id: 'b_alcohol', level: 'avoid', title: tr('l4.sf.f.alcohol.t'), explanation: tr('l4.sf.f.b_alcohol.e'), sourceIds: ['sante-alcool'] });
    if (f.has('liquorice')) push({ id: 'b_liquorice', level: 'avoid', title: tr('l4.sf.f.liquorice.t'), explanation: tr('l4.sf.f.b_liquorice.e'), sourceIds: ['anses-reglisse-2025'] });
    if (f.has('fish_avoid_mercury')) push({ id: 'b_mercury', level: 'avoid', title: tr('l4.sf.f.mercury_avoid.t'), explanation: tr('l4.sf.f.b_mercury.e'), sourceIds: ['anses-mercure-2024'] });
    else if (f.has('fish_limit_mercury')) push({ id: 'b_mercury_limit', level: 'precaution', title: tr('l4.sf.f.wild_predator.t'), explanation: tr('l4.sf.f.b_mercury_limit.e'), sourceIds: ['anses-mercure-2024'] });
    if (f.has('caffeine')) push({ id: 'b_caffeine', level: 'professional', title: tr('l4.sf.f.caffeine.t'), explanation: tr('l4.sf.f.b_caffeine.e'), sourceIds: ['lecrat'] });
  }

  // ================================================================ bébé et enfant
  if (child && age != null) {
    if (f.has('infant_formula')) {
      push({ id: 'c_formula', level: 'professional', title: tr('l4.sf.f.c_formula.t'), explanation: tr('l4.sf.f.c_formula.e'), sourceIds: ['spf-pas-a-pas'] });
      askProfessional ??= tr('l4.sf.ask.formula');
    } else if (age < 4) {
      push({ id: 'c_too_young', level: 'avoid', title: tr('l4.sf.f.c_too_young.t'), explanation: tr('l4.sf.f.c_too_young.e'), sourceIds: ['spf-pas-a-pas'] });
    } else if (age < 7 && answers.diversification === 'not_started') {
      push({ id: 'c_div', level: 'professional', title: tr('l4.sf.f.c_div.t'), explanation: tr('l4.sf.f.c_div.e'), sourceIds: ['spf-pas-a-pas'] });
      askProfessional ??= tr('l4.sf.ask.div');
    }
    if (f.has('honey') && age < 12) push({ id: 'c_honey', level: 'avoid', title: tr('l4.sf.f.c_honey.t'), explanation: tr('l4.sf.f.c_honey.e'), sourceIds: ['anses-miel-2010'] });
    const rawMilkCheese = (f.has('raw_milk') || answers.milk === 'raw') && !f.has('cheese_hard_cooked');
    if (rawMilkCheese && age < 60) push({ id: 'c_raw_milk', level: 'avoid', title: tr('l4.sf.f.raw_milk.t'), explanation: tr('l4.sf.f.c_raw_milk.e'), sourceIds: ['anses-lait-cru-2022'] });
    else if ((f.has('cheese') && !f.has('cheese_hard_cooked') && !f.has('raw_milk')) && unknown(answers.milk) && age < 60) need('milk', tr('l4.sf.miss.milk'));
    if (f.has('alcohol')) push({ id: 'c_alcohol', level: 'avoid', title: tr('l4.sf.f.alcohol.t'), explanation: tr('l4.sf.f.c_alcohol.e'), sourceIds: ['spf-pas-a-pas'] });
    if (f.has('caffeine')) push({ id: 'c_caffeine', level: age < 36 ? 'avoid' : 'precaution', title: tr('l4.sf.f.c_caffeine.t'), explanation: tr('l4.sf.f.c_caffeine.e'), sourceIds: ['spf-pas-a-pas'] });
    if (f.has('fish_avoid_mercury') && age < 36) push({ id: 'c_mercury', level: 'avoid', title: tr('l4.sf.f.mercury_avoid.t'), explanation: tr('l4.sf.f.c_mercury.e'), sourceIds: ['anses-mercure-2024'] });
    else if (f.has('fish_limit_mercury') && age < 36) push({ id: 'c_mercury_limit', level: 'precaution', title: tr('l4.sf.f.wild_predator.t'), explanation: tr('l4.sf.f.c_mercury_limit.e'), sourceIds: ['anses-mercure-2024'] });
    if ((f.has('raw_fish') || f.has('raw_shellfish') || f.has('smoked_fish')) && age < 60) push({ id: 'c_raw_fish', level: 'avoid', title: tr('l4.sf.f.c_raw_fish.t'), explanation: tr('l4.sf.f.c_raw_fish.e'), sourceIds: ['spf-pas-a-pas'] });
    if (f.has('raw_meat') && age < 60) push({ id: 'c_raw_meat', level: 'prepare', title: tr('l4.sf.f.c_raw_meat.t'), explanation: tr('l4.sf.f.c_raw_meat.e'), sourceIds: ['spf-pas-a-pas'] });
    if ((f.has('meat') || f.has('fish') || f.has('egg') || f.has('charcuterie_cook')) && !f.has('raw_meat') && !f.has('raw_fish') && !f.has('smoked_fish')) {
      if (answers.cooking === 'raw' || answers.cooking === 'undercooked') push({ id: 'c_cook', level: 'prepare', title: tr('l4.sf.f.cook.t'), explanation: tr('l4.sf.f.c_cook.e'), sourceIds: ['spf-pas-a-pas'] });
      else if (unknown(answers.cooking)) need('cooking', tr('l4.sf.miss.cooking'));
    }
    if (f.has('raw_egg_dish') && age < 60) {
      if (answers.origin === 'homemade' || unknown(answers.origin)) push({ id: 'c_raw_egg', level: 'avoid', title: tr('l4.sf.f.c_raw_egg.t'), explanation: tr('l4.sf.f.c_raw_egg.e'), sourceIds: ['spf-pas-a-pas'] });
    }
    if ((f.has('charcuterie_dry') || f.has('charcuterie_cold')) && age < 36) push({ id: 'c_charcuterie', level: 'precaution', title: tr('l4.sf.f.c_charcuterie.t'), explanation: tr('l4.sf.f.c_charcuterie.e'), sourceIds: ['spf-pas-a-pas'] });

    // Étouffement
    if (age < 48) {
      if (f.has('popcorn') || f.has('hard_candy')) push({ id: 'c_choke_avoid', level: 'avoid', title: f.has('popcorn') ? tr('l4.sf.f.popcorn') : tr('l4.sf.f.hard_candy'), explanation: tr('l4.sf.f.c_choke_avoid.e'), sourceIds: ['spf-pas-a-pas'] });
      const roundOrHard = (['whole_nuts', 'grapes', 'cherry_tomato', 'olives', 'sausage_round', 'hard_raw_veg'] as Facet[]).filter((x) => f.has(x));
      if (roundOrHard.length) {
        if (answers.cut === 'whole' || (f.has('whole_nuts') && answers.cut !== 'crushed')) {
          push({
            id: 'c_choke', level: f.has('whole_nuts') && answers.cut === 'whole' ? 'avoid' : 'prepare', title: f.has('whole_nuts') ? tr('l4.sf.f.c_choke.t1') : tr('l4.sf.f.c_choke.t2'),
            explanation: f.has('whole_nuts')
              ? tr('l4.sf.f.c_choke.e1')
              : tr('l4.sf.f.c_choke.e2'),
            sourceIds: ['spf-pas-a-pas'],
          });
        } else if (unknown(answers.cut)) need('cut', tr('l4.sf.miss.cut'));
      }
    }
    // Texture
    if (age < 8 && (answers.texture === 'pieces' || answers.texture === 'whole')) push({ id: 'c_texture', level: 'prepare', title: tr('l4.sf.f.c_texture.t'), explanation: tr('l4.sf.f.c_texture.e'), sourceIds: ['spf-pas-a-pas'] });
    // Sel, sucre, édulcorants
    const salt = input.nutrition?.salt_g_100g ?? null;
    if (age < 12 && (f.has('added_salt') || (salt != null && salt >= 0.25))) push({ id: 'c_salt', level: 'precaution', title: salt != null ? tr('l4.sf.f.c_salt.t1', { salt: String(salt) }) : tr('l4.sf.f.c_salt.t2'), explanation: tr('l4.sf.f.c_salt.e'), sourceIds: ['spf-pas-a-pas'] });
    if (age < 12 && f.has('added_sugar')) push({ id: 'c_sugar', level: 'precaution', title: tr('l4.sf.f.c_sugar.t'), explanation: tr('l4.sf.f.c_sugar.e'), sourceIds: ['spf-pas-a-pas'] });
    if (f.has('sweeteners') && age < 36) push({ id: 'c_sweeteners', level: 'precaution', title: tr('l4.sf.f.c_sweeteners.t'), explanation: tr('l4.sf.f.c_sweeteners.e'), sourceIds: ['spf-pas-a-pas'] });
  }

  // ================================================================ conservation (tous profils)
  if (f.has('perishable')) {
    if (answers.storage === 'room') {
      push({ id: 'storage_room', level: 'precaution', title: tr('l4.sf.f.storage_room.t'), explanation: tr('l4.sf.f.storage_room.e'), sourceIds: ['mpedia-listeriose-2025'] });
      if (pregnant || child) lower('medium', tr('l4.sf.cr.cold_chain'));
    }
    if (answers.openedDaysAgo != null && answers.openedDaysAgo > 3) {
      push({ id: 'opened', level: 'precaution', title: tr('l4.sf.f.opened.t', { count: answers.openedDaysAgo }), explanation: tr('l4.sf.f.opened.e'), sourceIds: ['mpedia-listeriose-2025'] });
    }
    if (unknown(answers.storage) && (pregnant || child)) missing.push(tr('l4.sf.miss.storage'));
  }

  // -- Informations manquantes ⇒ impossible à confirmer (pour les questions décisives)
  if (unanswered.length) {
    impossible ??= tr('l4.sf.imp.missing', { list: missing.filter((m) => m).slice(0, 2).join(', ') });
    lower('low', tr('l4.sf.cr.unanswered'));
  }
  if (!input.ingredientsText && input.identity.barcode) missing.push(tr('l4.sf.miss.ingredients'));

  // -- Verdict
  const sorted = sortFindings(findings);
  let verdict: FoodVerdict;
  let verdictReason: string;
  const avoid = sorted.find((x) => x.level === 'avoid');
  if (!input.identity.confirmed || !input.identity.name) {
    // Sans confirmation de l'aliment, aucune conclusion (les rappels éventuels restent affichés)
    verdict = 'Impossible à confirmer';
    verdictReason = impossible ?? tr('l4.sf.vr.unconfirmed');
    certainty = 'low';
  } else if (avoid) {
    verdict = 'À éviter pour ce profil selon la source indiquée';
    verdictReason = avoid.title;
  } else if (impossible) {
    verdict = 'Impossible à confirmer';
    verdictReason = impossible;
    certainty = 'low';
  } else if (sorted.some((x) => x.level === 'prepare')) {
    verdict = 'À préparer différemment';
    verdictReason = sorted.filter((x) => x.level === 'prepare').map((x) => x.title).join(' · ');
  } else if (sorted.some((x) => x.level === 'precaution' || x.level === 'professional')) {
    verdict = 'Adapté sous certaines conditions';
    verdictReason = sorted.filter((x) => x.level === 'precaution' || x.level === 'professional').map((x) => x.title).join(' · ');
  } else {
    verdict = 'Adapté selon les informations disponibles';
    verdictReason = tr('l4.sf.vr.ok');
  }

  return {
    kind: 'food',
    verdict,
    verdictReason,
    certainty,
    certaintyReasons: [...new Set(certaintyReasons)],
    profile,
    profileLabel: profileLabel(profile),
    food: { name: input.identity.name, brand: input.identity.brand ?? null, barcode: input.identity.barcode ?? null, imageUrl: input.identity.imageUrl ?? null },
    facets: [...f],
    ingredients,
    nutrition: input.nutrition ?? null,
    answers,
    findings: sorted,
    missing: [...new Set(missing)],
    unanswered: [...new Set(unanswered)],
    askProfessional,
    recalls: input.recalls,
    recallCheck: input.recallCheck ?? null,
    recallDisclaimer: RECALL_DISCLAIMER,
    sources: findingSources(sorted, ['rappelconso']),
    dataSource: input.dataSource,
    demo: input.dataSource.is_demo,
    demoLabel: input.dataSource.is_demo ? DEMO_LABEL : null,
    disclaimer: GENERAL_DISCLAIMER,
    engineVersion: ENGINE_VERSION,
    analysedOn: todayIso(now),
    score: null,
  };
}
