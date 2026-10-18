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
import { checkAllergies } from '../../../supabase/functions/_shared/allergens';

export const FOOD_VERDICTS = [
  'Adapté selon les informations disponibles',
  'Adapté sous certaines conditions',
  'À préparer différemment',
  'À éviter pour ce profil selon la source indiquée',
  'Impossible à confirmer',
] as const;
export type FoodVerdict = (typeof FOOD_VERDICTS)[number];

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

const TRI_UNKNOWN = { value: 'unknown', label: 'Je ne sais pas' };

export function foodQuestions(input: FoodInput, profile: ScanProfile): FoodQuestion[] {
  const f = detectFacets(input);
  const age = profileAgeMonths(profile);
  const child = isChildProfile(profile);
  const sensitive = profile.kind === 'pregnant' || child;
  const q: FoodQuestion[] = [];
  const cookable = f.has('meat') || f.has('fish') || f.has('egg') || f.has('cooked_crustacean') || f.has('charcuterie_cook');
  if (cookable && !f.has('raw_meat') && !f.has('raw_fish') && !f.has('smoked_fish') && sensitive) {
    q.push({
      key: 'cooking', label: 'Comment est-il préparé ?', why: 'La cuisson à cœur change les recommandations ; une photo ne permet pas de la vérifier.', critical: true,
      options: [{ value: 'cooked', label: 'Bien cuit, à cœur' }, { value: 'undercooked', label: 'Peu cuit, rosé, saignant ou mollet' }, { value: 'raw', label: 'Cru' }, TRI_UNKNOWN],
    });
  }
  if ((f.has('cheese') || f.has('dairy')) && !f.has('raw_milk') && !f.has('cheese_hard_cooked') && !f.has('cheese_soft_or_uncooked') && (sensitive)) {
    q.push({
      key: 'milk', label: 'Le lait est-il cru ou pasteurisé ?', why: 'Indiqué sur l’emballage (« au lait cru » ou « pasteurisé »).', critical: true,
      options: [{ value: 'pasteurized', label: 'Pasteurisé' }, { value: 'raw', label: 'Lait cru' }, TRI_UNKNOWN],
    });
  }
  if (f.has('raw_egg_dish') && sensitive) {
    q.push({
      key: 'origin', label: 'Est-ce fait maison ou industriel ?', why: 'Les préparations maison aux œufs crus et les préparations industrielles ne sont pas traitées de la même façon.', critical: true,
      options: [{ value: 'homemade', label: 'Fait maison' }, { value: 'industrial', label: 'Industriel (emballé)' }, TRI_UNKNOWN],
    });
  }
  if (child && age != null && age < 36 && !f.has('infant_formula')) {
    q.push({
      key: 'texture', label: 'Quelle texture allez-vous proposer ?', why: 'La texture doit suivre l’âge et le stade de diversification.', critical: false,
      options: [{ value: 'smooth', label: 'Lisse (purée mixée)' }, { value: 'mashed', label: 'Écrasée' }, { value: 'soft_pieces', label: 'Petits morceaux fondants' }, { value: 'pieces', label: 'Morceaux' }, { value: 'whole', label: 'Entier' }, TRI_UNKNOWN],
    });
  }
  if (child && age != null && age < 48 && ['whole_nuts', 'grapes', 'cherry_tomato', 'olives', 'sausage_round', 'hard_raw_veg'].some((x) => f.has(x as Facet))) {
    q.push({
      key: 'cut', label: 'Sous quelle forme ?', why: 'Les aliments ronds, durs ou entiers peuvent provoquer un étouffement chez le jeune enfant.', critical: true,
      options: [{ value: 'whole', label: 'Entier' }, { value: 'cut_small', label: 'Coupé finement (en quatre dans la longueur)' }, { value: 'crushed', label: 'Mixé, râpé ou en poudre' }, TRI_UNKNOWN],
    });
  }
  if (child && age != null && age >= 4 && age < 7) {
    q.push({
      key: 'diversification', label: 'La diversification alimentaire a-t-elle commencé ?', why: 'Les premiers aliments sont introduits entre 4 et 6 mois révolus, en accord avec le médecin.', critical: false,
      options: [{ value: 'started', label: 'Oui' }, { value: 'not_started', label: 'Pas encore' }, TRI_UNKNOWN],
    });
  }
  if (f.has('perishable')) {
    q.push({
      key: 'storage', label: 'Comment a-t-il été conservé ?', why: 'La chaîne du froid compte pour les produits frais.', critical: false,
      options: [{ value: 'fridge', label: 'Au réfrigérateur' }, { value: 'room', label: 'À température ambiante' }, { value: 'frozen', label: 'Congelé' }, TRI_UNKNOWN],
    });
    q.push({ key: 'openedDaysAgo', label: 'Ouvert depuis combien de jours ?', why: 'À comparer avec la mention « à consommer dans les … jours après ouverture ».', critical: false });
  }
  q.push({ key: 'allergies', label: 'Allergies connues (facultatif)', why: 'Seules les allergies déjà identifiées par un professionnel sont prises en compte ; l’application ne diagnostique aucune allergie.', critical: false });
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
    impossible = 'L’aliment n’a pas été confirmé : l’application ne peut pas savoir de quoi il s’agit.';
    lower('low', 'Aliment non confirmé.');
  }
  const ingredients = splitIngredients(input.ingredientsText);
  const meaningful = [...f].filter((x) => x !== 'perishable');
  if (!impossible && meaningful.length === 0 && ingredients.length === 0 && !input.catalogMatch) {
    impossible = 'Cet aliment n’est pas reconnu par l’application et sa composition n’est pas connue.';
    missing.push('Composition ou liste des ingrédients');
    lower('low', 'Aliment non reconnu.');
  }
  if (child && age == null) {
    impossible ??= 'L’âge exact de l’enfant (en mois) est nécessaire.';
    missing.push('Âge exact de l’enfant');
  }
  if (input.dataSource.is_demo) lower('low', `${DEMO_LABEL} : cet aliment n’est pas une donnée réelle.`);
  else if (input.dataSource.collaborative) lower('medium', 'Base collaborative : comparez avec l’emballage.');
  if (input.ingredientsOrigin === 'manual') lower('low', 'Ingrédients saisis à la main.');
  if (input.ingredientsOrigin === 'ocr_reviewed') lower(input.ocrReadability != null && input.ocrReadability < 0.6 ? 'low' : 'medium', 'Ingrédients lus sur photo puis relus.');

  // -- Rappels officiels
  for (const r of input.recalls) {
    if (r.match === 'gtin') {
      push({ id: 'recall', level: 'avoid', title: `Rappel officiel en cours : ${r.title}`, explanation: `${r.reason ?? 'Motif non précisé.'}${r.recommended_action ? ` Conduite à tenir : ${r.recommended_action}` : ''} Vérifiez le numéro de lot.`, sourceIds: ['rappelconso'] });
    } else {
      push({ id: 'recall_possible', level: 'precaution', title: `Un rappel officiel pourrait concerner ce produit : ${r.title}`, explanation: 'Correspondance sur la marque et le nom seulement : comparez la référence et le lot avec l’avis officiel.', sourceIds: ['rappelconso'] });
      lower('medium', 'Rappel possible (marque et nom).');
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
      push({ id: `allergy_${norm(m.allergy)}`, level: 'avoid', title: `Contient « ${m.allergy} », allergie déclarée${m.allergen && norm(m.allergen) !== norm(m.allergy) ? ` (${m.allergen.toLowerCase()})` : ''}`,
        explanation: `${m.via === 'declared' ? 'Allergène déclaré par le fabricant dans la base produit.' : 'Correspondance dans la liste des ingrédients étiquetés.'} L’application ne pose aucun diagnostic d’allergie.`, sourceIds: ['eu-inco-1169-2011'] });
    }
    for (const m of chk.possible) {
      push({ id: `allergy_trace_${norm(m.allergy)}`, level: 'precaution', title: `Peut contenir « ${m.allergy} » (traces)`,
        explanation: 'Mention « peut contenir » : présence non intentionnelle possible. Selon la sévérité de l’allergie, suivez les consignes de votre allergologue.', sourceIds: ['eu-inco-1169-2011'] });
    }
    if (chk.noMatchNote) {
      push({ id: 'allergy_unchecked', level: chk.insufficient.length ? 'missing' : 'info', title: chk.insufficient.length ? 'Allergies : vérification impossible avec ces données' : 'Allergies : aucune correspondance trouvée', explanation: chk.noMatchNote, sourceIds: ['eu-inco-1169-2011'] });
      if (chk.insufficient.length && !input.ingredientsText) lower('low', 'Composition inconnue : vos allergies ne peuvent pas être vérifiées.');
      else if (chk.insufficient.length) lower('medium', `Données incomplètes pour vos allergies (${chk.insufficient.join(', ').toLowerCase()}).`);
    }
  }

  // ================================================================ grossesse
  if (pregnant) {
    if (f.has('alcohol')) push({ id: 'p_alcohol', level: 'avoid', title: 'Contient de l’alcool', explanation: 'Aucune consommation d’alcool n’est recommandée pendant la grossesse (« zéro alcool »).', sourceIds: ['sante-alcool'] });
    if (f.has('cheese_hard_cooked') && !f.has('grated_cheese')) {
      push({ id: 'p_hard_cheese', level: 'precaution', title: 'Fromage à pâte pressée cuite (type comté, parmesan)', explanation: 'Ce type de fromage est accepté pendant la grossesse ; retirez la croûte.', sourceIds: ['spf-grossesse-2025', 'anses-lait-cru-2022'] });
    } else if (f.has('cheese_soft_or_uncooked')) {
      push({ id: 'p_soft_cheese', level: 'avoid', title: 'Fromage à pâte molle ou à pâte pressée non cuite', explanation: 'À éviter pendant toute la grossesse, qu’il soit au lait cru ou pasteurisé (risque de listériose).', sourceIds: ['spf-grossesse-2025'] });
    } else if (f.has('raw_milk') || answers.milk === 'raw') {
      push({ id: 'p_raw_milk', level: 'avoid', title: 'Produit au lait cru', explanation: 'Les produits au lait cru sont à éviter pendant toute la grossesse (listériose).', sourceIds: ['spf-grossesse-2025', 'anses-lait-cru-2022'] });
    } else if (f.has('cheese') || f.has('dairy')) {
      if (unknown(answers.milk) && f.has('cheese')) need('milk', 'Lait cru ou pasteurisé');
      else if (answers.milk === 'pasteurized' && f.has('cheese')) {
        push({ id: 'p_cheese_type', level: 'precaution', title: 'Fromage au lait pasteurisé : vérifiez le type de pâte', explanation: 'Même pasteurisés, les fromages à pâte molle (brie, camembert…) et à pâte pressée non cuite (reblochon…) sont à éviter pendant la grossesse. Retirez la croûte.', sourceIds: ['spf-grossesse-2025'] });
      }
    }
    if (f.has('grated_cheese')) push({ id: 'p_grated', level: 'avoid', title: 'Fromage râpé en sachet', explanation: 'Le fromage râpé vendu en sachet est à éviter pendant la grossesse.', sourceIds: ['spf-grossesse-2025'] });
    if (f.has('charcuterie_cold') || f.has('charcuterie_dry')) push({ id: 'p_charcuterie', level: 'avoid', title: 'Charcuterie prête à consommer (jambon cuit, rillettes, pâté, foie gras, saucisson, jambon cru…)', explanation: 'À éviter pendant la grossesse (listériose, toxoplasmose).', sourceIds: ['spf-grossesse-2025', 'mpedia-listeriose-2025'] });
    else if (f.has('charcuterie_cook')) {
      if (answers.cooking === 'cooked') push({ id: 'p_charcuterie_cook', level: 'precaution', title: 'Charcuterie à cuire, bien cuite', explanation: 'À consommer en quantité limitée, de préférence cuite par vos soins.', sourceIds: ['spf-grossesse-2025'] });
      else push({ id: 'p_charcuterie_cook', level: 'prepare', title: 'Charcuterie à cuire (saucisses, boudin, lardons…)', explanation: 'Seulement bien cuite par vos soins, et en quantité limitée.', sourceIds: ['spf-grossesse-2025'] });
    }
    if (f.has('raw_meat')) push({ id: 'p_raw_meat', level: 'avoid', title: 'Viande crue (tartare, carpaccio…)', explanation: 'La viande crue ou peu cuite est à éviter pendant la grossesse.', sourceIds: ['spf-grossesse-2025'] });
    if (f.has('raw_fish')) push({ id: 'p_raw_fish', level: 'avoid', title: 'Poisson cru (sushi, sashimi, tarama…)', explanation: 'À éviter pendant la grossesse ; la congélation n’élimine pas Listeria.', sourceIds: ['spf-grossesse-2025'] });
    if (f.has('smoked_fish')) push({ id: 'p_smoked_fish', level: 'avoid', title: 'Poisson fumé ou mariné', explanation: 'À éviter pendant la grossesse.', sourceIds: ['spf-grossesse-2025', 'mpedia-listeriose-2025'] });
    if (f.has('raw_shellfish')) push({ id: 'p_raw_shellfish', level: 'avoid', title: 'Coquillages crus (huîtres…)', explanation: 'Les coquillages crus sont à éviter pendant la grossesse.', sourceIds: ['spf-grossesse-2025'] });
    if (f.has('cooked_crustacean')) {
      if (answers.origin === 'homemade' && answers.cooking === 'cooked') push({ id: 'p_crustacean', level: 'precaution', title: 'Crustacés achetés crus et cuits à la maison', explanation: 'Acceptés s’ils sont bien cuits ; évitez les crustacés vendus déjà cuits et décortiqués.', sourceIds: ['spf-grossesse-2025'] });
      else push({ id: 'p_crustacean', level: 'prepare', title: 'Crustacés (crevettes…)', explanation: 'Évitez les crustacés décortiqués vendus cuits : achetez-les crus et cuisez-les vous-même.', sourceIds: ['spf-grossesse-2025'] });
    }
    if (f.has('raw_egg_dish')) {
      if (answers.origin === 'homemade') push({ id: 'p_raw_egg', level: 'avoid', title: 'Préparation maison à base d’œufs crus', explanation: 'Mayonnaise, mousse, tiramisu faits maison : à éviter pendant la grossesse (salmonelle).', sourceIds: ['spf-grossesse-2025'] });
      else if (answers.origin === 'industrial') push({ id: 'p_raw_egg', level: 'precaution', title: 'Préparation industrielle à base d’œufs', explanation: 'Les préparations industrielles sont considérées à faible risque ; respectez la date limite et la conservation.', sourceIds: ['spf-grossesse-2025'] });
      else need('origin', 'Fait maison ou industriel');
    }
    if (f.has('fish_avoid_mercury')) push({ id: 'p_mercury', level: 'avoid', title: 'Grand poisson prédateur (espadon, marlin, siki, requin, lamproie)', explanation: 'À éviter pendant la grossesse en raison du méthylmercure.', sourceIds: ['anses-mercure-2024', 'spf-grossesse-2025'] });
    else if (f.has('fish_limit_mercury')) push({ id: 'p_mercury_limit', level: 'precaution', title: 'Poisson prédateur sauvage (thon, dorade, bar, lotte…)', explanation: 'À limiter pendant la grossesse (méthylmercure) ; variez les espèces.', sourceIds: ['anses-mercure-2024'] });
    if (f.has('sprouts')) push({ id: 'p_sprouts', level: 'avoid', title: 'Graines germées', explanation: 'Citées parmi les aliments à éviter pendant la grossesse (listériose).', sourceIds: ['mpedia-listeriose-2025'] });
    if (f.has('soy')) push({ id: 'p_soy', level: 'avoid', title: 'Produit à base de soja', explanation: 'La source recommande de ne pas consommer de boissons et produits à base de soja pendant la grossesse (perturbateurs endocriniens).', sourceIds: ['spf-grossesse-2025'] });
    if (f.has('liquorice')) push({ id: 'p_liquorice', level: 'avoid', title: 'Contient de la réglisse', explanation: 'L’Anses recommande de déconseiller la réglisse sous toutes ses formes aux femmes enceintes et allaitantes (acide glycyrrhizique).', sourceIds: ['anses-reglisse-2025'] });
    if (f.has('liver')) {
      push({ id: 'p_liver', level: 'professional', title: 'Foie (très riche en vitamine A)', explanation: 'Demandez conseil à votre sage-femme ou votre médecin sur la consommation de foie pendant la grossesse.', sourceIds: ['lecrat'] });
      askProfessional ??= 'Parlez de cet aliment à votre sage-femme ou à votre médecin.';
    }
    if (f.has('caffeine')) {
      push({ id: 'p_caffeine', level: 'professional', title: 'Contient de la caféine', explanation: 'Limitez la caféine pendant la grossesse ; demandez à votre sage-femme ou votre médecin la quantité adaptée.', sourceIds: ['lecrat'] });
    }
    if (f.has('raw_veg_herbs')) push({ id: 'p_wash', level: 'precaution', title: 'Crudités et herbes fraîches', explanation: 'Lavez soigneusement légumes et herbes pour retirer la terre (toxoplasmose).', sourceIds: ['spf-grossesse-2025'] });
    if ((f.has('meat') || f.has('fish') || f.has('egg')) && !f.has('raw_meat') && !f.has('raw_fish') && !f.has('smoked_fish') && !f.has('raw_egg_dish')) {
      if (answers.cooking === 'raw' || answers.cooking === 'undercooked') push({ id: 'p_cook', level: 'prepare', title: 'À cuire à cœur', explanation: 'Viande, volaille, poisson et œufs sont acceptés s’ils sont bien cuits ; évitez-les crus ou peu cuits.', sourceIds: ['spf-grossesse-2025'] });
      else if (unknown(answers.cooking)) need('cooking', 'Cuisson (bien cuit, peu cuit ou cru)');
    }
  }

  // ================================================================ allaitement
  if (breastfeeding) {
    if (f.has('alcohol')) push({ id: 'b_alcohol', level: 'avoid', title: 'Contient de l’alcool', explanation: 'L’alcool passe dans le lait maternel : il est recommandé de ne pas en consommer pendant l’allaitement.', sourceIds: ['sante-alcool'] });
    if (f.has('liquorice')) push({ id: 'b_liquorice', level: 'avoid', title: 'Contient de la réglisse', explanation: 'L’Anses recommande de déconseiller la réglisse sous toutes ses formes aux femmes enceintes et allaitantes.', sourceIds: ['anses-reglisse-2025'] });
    if (f.has('fish_avoid_mercury')) push({ id: 'b_mercury', level: 'avoid', title: 'Grand poisson prédateur (espadon, marlin, siki, requin, lamproie)', explanation: 'À éviter pendant l’allaitement (méthylmercure).', sourceIds: ['anses-mercure-2024'] });
    else if (f.has('fish_limit_mercury')) push({ id: 'b_mercury_limit', level: 'precaution', title: 'Poisson prédateur sauvage', explanation: 'À limiter pendant l’allaitement (méthylmercure).', sourceIds: ['anses-mercure-2024'] });
    if (f.has('caffeine')) push({ id: 'b_caffeine', level: 'professional', title: 'Contient de la caféine', explanation: 'La caféine passe dans le lait : demandez à votre sage-femme ou votre médecin la quantité adaptée.', sourceIds: ['lecrat'] });
  }

  // ================================================================ bébé et enfant
  if (child && age != null) {
    if (f.has('infant_formula')) {
      push({ id: 'c_formula', level: 'professional', title: 'Lait infantile', explanation: 'Le choix et la préparation du lait infantile se discutent avec le médecin ou la sage-femme ; respectez l’âge indiqué et les doses de l’emballage.', sourceIds: ['spf-pas-a-pas'] });
      askProfessional ??= 'Demandez conseil au médecin ou à la sage-femme qui suit votre bébé.';
    } else if (age < 4) {
      push({ id: 'c_too_young', level: 'avoid', title: 'Avant 4 mois : lait uniquement', explanation: 'La diversification alimentaire ne commence pas avant 4 mois révolus ; parlez-en au médecin qui suit votre bébé.', sourceIds: ['spf-pas-a-pas'] });
    } else if (age < 7 && answers.diversification === 'not_started') {
      push({ id: 'c_div', level: 'professional', title: 'Diversification pas encore commencée', explanation: 'Les premiers aliments s’introduisent entre 4 et 6 mois révolus : demandez au médecin quand commencer.', sourceIds: ['spf-pas-a-pas'] });
      askProfessional ??= 'Demandez au médecin qui suit votre bébé quand commencer la diversification.';
    }
    if (f.has('honey') && age < 12) push({ id: 'c_honey', level: 'avoid', title: 'Contient du miel', explanation: 'Pas de miel avant 1 an (risque de botulisme infantile), même en petite quantité.', sourceIds: ['anses-miel-2010'] });
    const rawMilkCheese = (f.has('raw_milk') || answers.milk === 'raw') && !f.has('cheese_hard_cooked');
    if (rawMilkCheese && age < 60) push({ id: 'c_raw_milk', level: 'avoid', title: 'Produit au lait cru', explanation: 'L’Anses recommande que les jeunes enfants évitent les fromages au lait cru (sauf pâtes pressées cuites comme le comté) ; l’application retient l’âge de 5 ans par prudence.', sourceIds: ['anses-lait-cru-2022'] });
    else if ((f.has('cheese') && !f.has('cheese_hard_cooked') && !f.has('raw_milk')) && unknown(answers.milk) && age < 60) need('milk', 'Lait cru ou pasteurisé');
    if (f.has('alcohol')) push({ id: 'c_alcohol', level: 'avoid', title: 'Contient de l’alcool', explanation: 'Aucun alcool pour les enfants, y compris dans les desserts ou sauces non cuits.', sourceIds: ['spf-pas-a-pas'] });
    if (f.has('caffeine')) push({ id: 'c_caffeine', level: age < 36 ? 'avoid' : 'precaution', title: 'Contient de la caféine (café, thé, cola, boisson énergisante)', explanation: 'Ces boissons ne sont pas adaptées aux jeunes enfants.', sourceIds: ['spf-pas-a-pas'] });
    if (f.has('fish_avoid_mercury') && age < 36) push({ id: 'c_mercury', level: 'avoid', title: 'Grand poisson prédateur (espadon, marlin, siki, requin, lamproie)', explanation: 'À éviter chez l’enfant de moins de 3 ans (méthylmercure).', sourceIds: ['anses-mercure-2024'] });
    else if (f.has('fish_limit_mercury') && age < 36) push({ id: 'c_mercury_limit', level: 'precaution', title: 'Poisson prédateur sauvage', explanation: 'À limiter chez l’enfant de moins de 3 ans (méthylmercure) ; variez les espèces.', sourceIds: ['anses-mercure-2024'] });
    if ((f.has('raw_fish') || f.has('raw_shellfish') || f.has('smoked_fish')) && age < 60) push({ id: 'c_raw_fish', level: 'avoid', title: 'Poisson ou coquillages crus ou fumés', explanation: 'Les produits de la mer crus ne sont pas adaptés aux jeunes enfants ; proposez du poisson bien cuit.', sourceIds: ['spf-pas-a-pas'] });
    if (f.has('raw_meat') && age < 60) push({ id: 'c_raw_meat', level: 'prepare', title: 'Viande crue', explanation: 'Pour un jeune enfant, la viande doit être bien cuite à cœur.', sourceIds: ['spf-pas-a-pas'] });
    if ((f.has('meat') || f.has('fish') || f.has('egg') || f.has('charcuterie_cook')) && !f.has('raw_meat') && !f.has('raw_fish') && !f.has('smoked_fish')) {
      if (answers.cooking === 'raw' || answers.cooking === 'undercooked') push({ id: 'c_cook', level: 'prepare', title: 'À cuire à cœur', explanation: 'Viande, poisson et œufs bien cuits pour les jeunes enfants.', sourceIds: ['spf-pas-a-pas'] });
      else if (unknown(answers.cooking)) need('cooking', 'Cuisson (bien cuit, peu cuit ou cru)');
    }
    if (f.has('raw_egg_dish') && age < 60) {
      if (answers.origin === 'homemade' || unknown(answers.origin)) push({ id: 'c_raw_egg', level: 'avoid', title: 'Préparation à base d’œufs crus', explanation: 'Les préparations à base d’œufs crus ou peu cuits ne sont pas adaptées aux jeunes enfants.', sourceIds: ['spf-pas-a-pas'] });
    }
    if ((f.has('charcuterie_dry') || f.has('charcuterie_cold')) && age < 36) push({ id: 'c_charcuterie', level: 'precaution', title: 'Charcuterie', explanation: 'Produit gras et salé : à éviter ou limiter chez le jeune enfant.', sourceIds: ['spf-pas-a-pas'] });

    // Étouffement
    if (age < 48) {
      if (f.has('popcorn') || f.has('hard_candy')) push({ id: 'c_choke_avoid', level: 'avoid', title: f.has('popcorn') ? 'Pop-corn' : 'Bonbon dur', explanation: 'Risque d’étouffement chez le jeune enfant ; l’application retient l’âge de 4 ans par prudence.', sourceIds: ['spf-pas-a-pas'] });
      const roundOrHard = (['whole_nuts', 'grapes', 'cherry_tomato', 'olives', 'sausage_round', 'hard_raw_veg'] as Facet[]).filter((x) => f.has(x));
      if (roundOrHard.length) {
        if (answers.cut === 'whole' || (f.has('whole_nuts') && answers.cut !== 'crushed')) {
          push({
            id: 'c_choke', level: f.has('whole_nuts') && answers.cut === 'whole' ? 'avoid' : 'prepare', title: f.has('whole_nuts') ? 'Fruits à coque entiers' : 'Aliment rond ou dur à couper',
            explanation: f.has('whole_nuts')
              ? 'Les fruits à coque entiers (cacahuètes, noix, noisettes…) présentent un risque d’étouffement chez le jeune enfant : proposez-les uniquement en poudre ou en purée lisse.'
              : 'Raisins, tomates cerises, olives, saucisses : coupez-les en quatre dans la longueur ; râpez ou cuisez les légumes durs.',
            sourceIds: ['spf-pas-a-pas'],
          });
        } else if (unknown(answers.cut)) need('cut', 'Forme proposée (entier, coupé, mixé)');
      }
    }
    // Texture
    if (age < 8 && (answers.texture === 'pieces' || answers.texture === 'whole')) push({ id: 'c_texture', level: 'prepare', title: 'Texture à adapter', explanation: 'Au début de la diversification, proposez des textures lisses puis écrasées ; les morceaux viennent progressivement.', sourceIds: ['spf-pas-a-pas'] });
    // Sel, sucre, édulcorants
    const salt = input.nutrition?.salt_g_100g ?? null;
    if (age < 12 && (f.has('added_salt') || (salt != null && salt >= 0.25))) push({ id: 'c_salt', level: 'precaution', title: salt != null ? `Contient du sel (${salt} g pour 100 g)` : 'Contient du sel ajouté', explanation: 'Pas de sel ajouté avant 1 an ; ensuite, peu de sel.', sourceIds: ['spf-pas-a-pas'] });
    if (age < 12 && f.has('added_sugar')) push({ id: 'c_sugar', level: 'precaution', title: 'Contient du sucre ajouté', explanation: 'Pas de sucre ajouté avant 1 an ; ensuite, à limiter.', sourceIds: ['spf-pas-a-pas'] });
    if (f.has('sweeteners') && age < 36) push({ id: 'c_sweeteners', level: 'precaution', title: 'Contient des édulcorants', explanation: 'Les produits édulcorés ne sont pas destinés aux jeunes enfants.', sourceIds: ['spf-pas-a-pas'] });
  }

  // ================================================================ conservation (tous profils)
  if (f.has('perishable')) {
    if (answers.storage === 'room') {
      push({ id: 'storage_room', level: 'precaution', title: 'Conservé à température ambiante', explanation: 'Les produits frais se conservent au réfrigérateur (4 °C) ; les restes se réchauffent et se consomment aussitôt. En cas de doute sur la durée hors du froid, ne le consommez pas.', sourceIds: ['mpedia-listeriose-2025'] });
      if (pregnant || child) lower('medium', 'Chaîne du froid incertaine.');
    }
    if (answers.openedDaysAgo != null && answers.openedDaysAgo > 3) {
      push({ id: 'opened', level: 'precaution', title: `Ouvert depuis ${answers.openedDaysAgo} jours`, explanation: 'Respectez la date limite et la mention « à consommer dans les … jours après ouverture » de l’emballage.', sourceIds: ['mpedia-listeriose-2025'] });
    }
    if (unknown(answers.storage) && (pregnant || child)) missing.push('Conditions de conservation');
  }

  // -- Informations manquantes ⇒ impossible à confirmer (pour les questions décisives)
  if (unanswered.length) {
    impossible ??= `Il manque une information décisive : ${missing.filter((m) => m).slice(0, 2).join(', ')}. Une photo seule ne permet pas de la vérifier.`;
    lower('low', 'Question décisive sans réponse.');
  }
  if (!input.ingredientsText && input.identity.barcode) missing.push('Liste des ingrédients');

  // -- Verdict
  const sorted = sortFindings(findings);
  let verdict: FoodVerdict;
  let verdictReason: string;
  const avoid = sorted.find((x) => x.level === 'avoid');
  if (!input.identity.confirmed || !input.identity.name) {
    // Sans confirmation de l'aliment, aucune conclusion (les rappels éventuels restent affichés)
    verdict = 'Impossible à confirmer';
    verdictReason = impossible ?? 'L’aliment n’a pas été confirmé.';
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
    verdictReason = 'Aucune des règles suivies par l’application ne s’applique à cet aliment pour ce profil, d’après les informations disponibles.';
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
