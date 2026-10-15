/**
 * Moteur de règles « produit » (cosmétiques, soins, lingettes, couches, lessives, entretien, parfums…).
 *
 * - Analyse UN produit précis (jamais une marque).
 * - Aucune note sur 100 : un verdict parmi quatre, des constats sourcés, la liste de ce qui manque.
 * - La fonction des ingrédients vient UNIQUEMENT de la base CosIng importée (table cosing_ingredients) ;
 *   sinon « information non disponible ».
 * - Médicaments, huiles essentielles, compléments, produits de traitement : renvoi vers un professionnel.
 * Module pur, testé par Jest (src/__tests__/scanner.test.ts).
 */
import {
  DEMO_LABEL, ENGINE_VERSION, GENERAL_DISCLAIMER, RECALL_DISCLAIMER, findingSources, isChildProfile, norm, profileAgeMonths, profileLabel,
  sortFindings, splitIngredients, todayIso,
  type Certainty, type DataSourceInfo, type Finding, type RecallCheck, type RecallInfo, type ScanProfile,
} from './scanCommon';
import type { ScanSource } from './scanSources';

export type ProductType =
  | 'cream' | 'oil' | 'wash_gel' | 'shampoo' | 'sunscreen' | 'makeup' | 'stretch_marks' | 'wipes' | 'diapers'
  | 'laundry' | 'household' | 'perfume' | 'baby_care' | 'medicine' | 'essential_oil' | 'supplement' | 'treatment' | 'other';

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  cream: 'Crème', oil: 'Huile de soin', wash_gel: 'Gel lavant', shampoo: 'Shampooing', sunscreen: 'Protection solaire', makeup: 'Maquillage',
  stretch_marks: 'Soin anti-vergetures', wipes: 'Lingettes', diapers: 'Couches', laundry: 'Lessive', household: 'Produit ménager', perfume: 'Parfum',
  baby_care: 'Soin bébé / enfant', medicine: 'Médicament', essential_oil: 'Huile essentielle', supplement: 'Complément alimentaire',
  treatment: 'Produit de traitement (poux, verrues…)', other: 'Autre',
};

/** Types pour lesquels l'application ne se prononce pas : avis d'un professionnel. */
export const PROFESSIONAL_TYPES: ProductType[] = ['medicine', 'essential_oil', 'supplement', 'treatment'];

export type Exposure = 'rinse_off' | 'leave_on' | 'inhaled' | 'indirect' | 'unknown';
export type Zone = 'face' | 'body' | 'diaper_area' | 'scalp' | 'lips' | 'hands' | 'air' | 'textiles' | 'surfaces' | 'unknown';

export const EXPOSURE_LABEL: Record<Exposure, string> = {
  rinse_off: 'Produit rincé', leave_on: 'Produit non rincé (reste sur la peau)', inhaled: 'Exposition par inhalation possible',
  indirect: 'Contact indirect (textiles, surfaces)', unknown: 'Type d’exposition inconnu',
};
const EXPOSURE_EXPLANATION: Record<Exposure, string> = {
  rinse_off: 'Le produit est rincé après application : il reste peu de temps au contact de la peau.',
  leave_on: 'Le produit reste sur la peau : l’exposition est plus longue qu’avec un produit rincé.',
  inhaled: 'Une partie du produit peut être respirée (spray, parfum, diffusion) : aérez et évitez l’usage à proximité du visage d’un enfant.',
  indirect: 'Le contact se fait surtout par les textiles lavés ou les surfaces ; le risque principal vient du produit pur (ingestion accidentelle, projection).',
  unknown: 'L’application ne sait pas si ce produit est rincé, laissé sur la peau ou inhalé : précisez-le pour affiner l’analyse.',
};
export const ZONE_LABEL: Record<Zone, string> = {
  face: 'Visage', body: 'Corps', diaper_area: 'Siège (zone du change)', scalp: 'Cuir chevelu', lips: 'Lèvres', hands: 'Mains',
  air: 'Air ambiant', textiles: 'Textiles', surfaces: 'Surfaces', unknown: 'Zone non précisée',
};

export function defaultExposure(type: ProductType | null): Exposure {
  switch (type) {
    case 'wash_gel': case 'shampoo': return 'rinse_off';
    case 'cream': case 'oil': case 'sunscreen': case 'makeup': case 'stretch_marks': case 'wipes': case 'baby_care': case 'diapers': return 'leave_on';
    case 'perfume': return 'inhaled';
    case 'laundry': case 'household': return 'indirect';
    default: return 'unknown';
  }
}

export function defaultZone(type: ProductType | null, profile: ScanProfile): Zone {
  switch (type) {
    case 'wipes': case 'diapers': return isChildProfile(profile) ? 'diaper_area' : 'body';
    case 'shampoo': return 'scalp';
    case 'makeup': return 'face';
    case 'sunscreen': case 'stretch_marks': case 'perfume': return 'body';
    case 'laundry': return 'textiles';
    case 'household': return 'surfaces';
    default: return 'unknown';
  }
}

/** Ligne de la base CosIng importée (cf. scripts/import-cosing.mjs). */
export interface CosingRow {
  inci_name: string;
  functions: string[];
  restrictions: string | null;
  annex_refs: string[];
  source_url: string;
  updated_on: string;
  is_demo?: boolean;
}

export interface ProductInput {
  identity: { name: string | null; brand: string | null; barcode?: string | null; imageUrl?: string | null; confirmed: boolean };
  type: ProductType | null;
  ingredientsText: string | null;
  /** database : base de produits ; ocr_reviewed : lu sur photo puis relu par la personne ; manual : saisi à la main. */
  ingredientsOrigin: 'database' | 'ocr_reviewed' | 'manual' | null;
  /** Indice de lisibilité estimé de la lecture locale (0 à 1), si la liste vient d'une photo. */
  ocrReadability?: number | null;
  precautionsText?: string | null;
  periodAfterOpening?: string | null;
  exposure?: Exposure | null;
  zone?: Zone | null;
  dataSource: DataSourceInfo & { collaborative?: boolean };
  recalls: RecallInfo[];
  recallCheck?: RecallCheck | null;
  cosing?: CosingRow[];
}

export const PRODUCT_VERDICTS = [
  'Adapté selon les informations disponibles',
  'Adapté avec précautions',
  'Déconseillé pour ce profil selon la source indiquée',
  'Informations insuffisantes',
] as const;
export type ProductVerdict = (typeof PRODUCT_VERDICTS)[number];

export type IngredientFlag = 'fragrance_allergen' | 'perfume' | 'essential_oil' | 'phenoxyethanol' | 'declared_allergy';

export interface IngredientLine {
  name: string;
  /** null : information non disponible (aucune ligne CosIng importée pour cet ingrédient). */
  functions: string[] | null;
  functionSource: 'cosing' | 'cosing_demo' | null;
  restrictions: string | null;
  flags: IngredientFlag[];
}

export interface ProductAnalysis {
  kind: 'product';
  verdict: ProductVerdict;
  verdictReason: string;
  certainty: Certainty;
  certaintyReasons: string[];
  profile: ScanProfile;
  profileLabel: string;
  product: { name: string | null; brand: string | null; barcode: string | null; imageUrl: string | null; type: ProductType | null; typeLabel: string };
  exposure: { type: Exposure; label: string; explanation: string };
  zone: { type: Zone; label: string };
  ingredients: IngredientLine[];
  fragranceAllergens: string[];
  perfume: 'present' | 'absent' | 'unknown';
  essentialOils: string[];
  packagingPrecautions: string | null;
  periodAfterOpening: string | null;
  pregnancyInfo: string[];
  childInfo: string[];
  findings: Finding[];
  missing: string[];
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
  /** Aucune note chiffrée n'est calculée (choix délibéré : verdict et constats sourcés seulement). */
  score: null;
}

// ---------------------------------------------------------------- détection d'ingrédients
/** Les 26 substances parfumantes allergisantes de l'annexe III du règlement (CE) n° 1223/2009 (liste historique). */
export const EU_26_FRAGRANCE_ALLERGENS: { name: string; aliases?: string[] }[] = [
  { name: 'Amyl cinnamal' }, { name: 'Benzyl alcohol' }, { name: 'Cinnamyl alcohol' }, { name: 'Citral' }, { name: 'Eugenol' },
  { name: 'Hydroxycitronellal' }, { name: 'Isoeugenol' }, { name: 'Amylcinnamyl alcohol' }, { name: 'Benzyl salicylate' }, { name: 'Cinnamal' },
  { name: 'Coumarin' }, { name: 'Geraniol' }, { name: 'Hydroxyisohexyl 3-cyclohexene carboxaldehyde', aliases: ['hicc', 'lyral'] },
  { name: 'Anise alcohol', aliases: ['anisyl alcohol'] }, { name: 'Benzyl cinnamate' }, { name: 'Farnesol' },
  { name: 'Butylphenyl methylpropional', aliases: ['lilial'] }, { name: 'Linalool' }, { name: 'Benzyl benzoate' }, { name: 'Citronellol' },
  { name: 'Hexyl cinnamal' }, { name: 'Limonene' }, { name: 'Methyl 2-octynoate', aliases: ['methyl heptine carbonate'] },
  { name: 'Alpha-isomethyl ionone' }, { name: 'Evernia prunastri extract', aliases: ['oakmoss extract', 'mousse de chene'] },
  { name: 'Evernia furfuracea extract', aliases: ['treemoss extract'] },
];

const ALLERGEN_PATTERNS = EU_26_FRAGRANCE_ALLERGENS.map((a) => ({
  name: a.name,
  re: new RegExp(`(^|[^a-z0-9-])(${[a.name, ...(a.aliases ?? [])].map((x) => norm(x).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})($|[^a-z0-9])`),
}));

export function fragranceAllergensIn(ingredient: string): string | null {
  const n = norm(ingredient);
  for (const p of ALLERGEN_PATTERNS) if (p.re.test(n)) return p.name;
  return null;
}

export const isPerfume = (ingredient: string) => /(^|[^a-z])(parfum|fragrance)([^a-z]|$)/.test(norm(ingredient));
export const isPhenoxyethanol = (ingredient: string) => /phenoxyethanol/.test(norm(ingredient));

const NOT_ESSENTIAL = /(seed|kernel|nut|germ|bean|castor|ricinus|olea|cocos|helianthus|prunus|simmondsia|argania|butyrospermum|persea|sesamum|glycine|zea mays|triticum|vitis|carthamus|oenothera|borago|macadamia|caprylic|mineral|paraffin|hydrogenated|peg-|ppg-|silicone|jojoba|olive|tournesol|amande|argan|coco|ricin|avocat|onagre|bourrache)/;
const EO_PART = /\b(leaf|flower|peel|herb|bark|bud|needle|twig|stem|wood|root|rind|resin|leaf\/stem|flower\/leaf\/stem)\s+oil\b/;
const EO_GENUS = /\b(lavandula|mentha|melaleuca|eucalyptus|rosmarinus|cinnamomum|eugenia|syzygium|thymus|salvia|pelargonium|cymbopogon|citrus|cananga|pogostemon|juniperus|pinus|abies|cupressus|origanum|ocimum|matricaria|chamomilla|anthemis|litsea|boswellia|santalum|cedrus|vetiveria|ravensara|cinnamosma|niaouli|tea tree)\b[^,]*\boil\b/;

export function isEssentialOil(ingredient: string): boolean {
  const n = norm(ingredient);
  if (/huile essentielle|essential oil|\bhe\s+de\b/.test(n)) return true;
  if (!/\boil\b/.test(n)) return false;
  if (NOT_ESSENTIAL.test(n)) return false;
  return EO_PART.test(n) || EO_GENUS.test(n);
}

function cleanName(raw: string): string {
  return raw.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').replace(/[.*]+$/, '').trim();
}

function cosingFor(name: string, rows: CosingRow[]): CosingRow | null {
  const n = norm(name);
  return rows.find((r) => norm(r.inci_name) === n) ?? null;
}

function allergyMatches(ingredient: string, allergies: string[]): string | null {
  const n = norm(ingredient);
  for (const a of allergies) {
    const x = norm(a);
    if (x.length >= 3 && n.includes(x)) return a;
  }
  return null;
}

// ---------------------------------------------------------------- analyse
export function analyzeProduct(input: ProductInput, profile: ScanProfile, now = new Date()): ProductAnalysis {
  const findings: Finding[] = [];
  const missing: string[] = [];
  const certaintyReasons: string[] = [];
  const pregnancyInfo: string[] = [];
  const childInfo: string[] = [];
  const type = input.type ?? null;
  const age = profileAgeMonths(profile);
  const child = isChildProfile(profile);
  const exposure: Exposure = input.exposure ?? defaultExposure(type);
  const zone: Zone = input.zone ?? defaultZone(type, profile);
  const allergies = (profile.allergies ?? []).filter((a) => a.trim().length > 0);
  let askProfessional: string | null = null;
  let insufficient: string | null = null;
  let certainty: Certainty = 'high';
  const lower = (to: Certainty, why: string) => {
    const rank = { high: 2, medium: 1, low: 0 };
    if (rank[to] < rank[certainty]) certainty = to;
    certaintyReasons.push(why);
  };

  // -- Identité
  if (!input.identity.confirmed) {
    insufficient = 'Le produit n’a pas été confirmé : l’application ne peut pas savoir à quoi s’applique l’analyse.';
    lower('low', 'Produit non confirmé.');
  }
  if (!input.identity.name) missing.push('Nom du produit');
  if (!type) {
    missing.push('Type de produit (crème, gel lavant, lingettes, lessive…)');
    lower('medium', 'Type de produit non précisé.');
  }
  if (child && age == null) {
    insufficient ??= 'L’âge exact de l’enfant est nécessaire pour appliquer les règles liées à l’âge.';
    missing.push('Âge de l’enfant');
    lower('low', 'Âge inconnu.');
  }

  // -- Données
  if (input.dataSource.is_demo) lower('low', `${DEMO_LABEL} : ce produit n’est pas une donnée réelle.`);
  else if (input.dataSource.collaborative) lower('medium', 'Base collaborative : les informations peuvent être incomplètes ou anciennes ; comparez avec l’emballage.');

  // -- Composition
  const parts = splitIngredients(input.ingredientsText);
  if (parts.length === 0) {
    missing.push('Liste des ingrédients / composition');
  } else if (input.ingredientsOrigin === 'manual') {
    lower('low', 'Liste des ingrédients saisie à la main : une erreur de recopie est possible.');
  } else if (input.ingredientsOrigin === 'ocr_reviewed') {
    const r = input.ocrReadability;
    if (r != null && r < 0.6) lower('low', 'Liste lue sur photo avec une faible lisibilité, même après relecture.');
    else lower('medium', 'Liste lue sur photo puis relue : vérifiez-la sur l’emballage.');
  }

  const cosing = input.cosing ?? [];
  const ingredients: IngredientLine[] = parts.map((raw) => {
    const name = cleanName(raw) || raw;
    const flags: IngredientFlag[] = [];
    if (fragranceAllergensIn(raw)) flags.push('fragrance_allergen');
    if (isPerfume(raw)) flags.push('perfume');
    if (isEssentialOil(raw)) flags.push('essential_oil');
    if (isPhenoxyethanol(raw)) flags.push('phenoxyethanol');
    if (allergyMatches(raw, allergies)) flags.push('declared_allergy');
    const row = cosingFor(name, cosing);
    return {
      name,
      functions: row && row.functions.length ? row.functions : null,
      functionSource: row ? (row.is_demo ? 'cosing_demo' : 'cosing') : null,
      restrictions: row?.restrictions ?? null,
      flags,
    };
  });
  const unknownFunctions = ingredients.filter((i) => i.functions == null).length;
  if (parts.length && unknownFunctions) missing.push(`Fonction de ${unknownFunctions} ingrédient${unknownFunctions > 1 ? 's' : ''} : information non disponible (base CosIng)`);

  const fragranceAllergens = [...new Set(parts.map(fragranceAllergensIn).filter((x): x is string => !!x))];
  const perfume: ProductAnalysis['perfume'] = parts.length === 0 ? 'unknown' : ingredients.some((i) => i.flags.includes('perfume')) ? 'present' : 'absent';
  const essentialOils = ingredients.filter((i) => i.flags.includes('essential_oil')).map((i) => i.name);
  const hasPhenoxy = ingredients.some((i) => i.flags.includes('phenoxyethanol'));

  // -- Rappel officiel (toujours prioritaire)
  for (const r of input.recalls) {
    if (r.match === 'gtin') {
      findings.push({
        id: 'recall', level: 'avoid', title: `Rappel officiel en cours : ${r.title}`,
        explanation: `${r.reason ?? 'Motif non précisé.'}${r.recommended_action ? ` Conduite à tenir : ${r.recommended_action}` : ''} Vérifiez le numéro de lot sur l’emballage.`,
        sourceIds: ['rappelconso'],
      });
    } else {
      findings.push({
        id: 'recall_possible', level: 'precaution', title: `Un rappel officiel pourrait concerner ce produit : ${r.title}`,
        explanation: 'La correspondance repose sur la marque et le nom, pas sur le code-barres : comparez la référence et le lot avec l’avis officiel.',
        sourceIds: ['rappelconso'],
      });
      lower('medium', 'Rappel possible identifié par la marque et le nom uniquement.');
    }
  }

  // -- Médicaments, huiles essentielles, compléments, traitements
  if (type && PROFESSIONAL_TYPES.includes(type)) {
    askProfessional = 'Pour un médicament, une huile essentielle, un complément alimentaire ou un produit de traitement, demandez conseil à votre pharmacien, à votre sage-femme ou à votre médecin avant utilisation.';
    if (type === 'essential_oil' && (profile.kind === 'pregnant' || child)) {
      findings.push({
        id: 'eo_product', level: 'avoid', title: 'Huile essentielle : déconseillée aux femmes enceintes et aux enfants selon l’Anses',
        explanation: 'L’Anses indique que les huiles essentielles sont déconseillées aux femmes enceintes et aux enfants, notamment en raison de substances neurotoxiques ou toxiques pour l’embryon et le fœtus. Elles doivent rester hors de portée des enfants et ne jamais être rangées avec les produits de soin des bébés (risque de confusion).',
        sourceIds: ['anses-he-2024'],
      });
    } else {
      findings.push({
        id: 'professional_type', level: 'professional', title: `${PRODUCT_TYPE_LABEL[type]} : avis d’un professionnel nécessaire`,
        explanation: 'L’application n’évalue pas ce type de produit : la dose, la durée et la situation de santé comptent. Montrez le produit à votre pharmacien, votre sage-femme ou votre médecin.',
        sourceIds: profile.kind === 'pregnant' || profile.kind === 'breastfeeding' ? ['lecrat'] : type === 'essential_oil' ? ['anses-he-2024'] : ['lecrat'],
      });
      insufficient ??= 'Ce type de produit doit être évalué par un professionnel de santé.';
    }
  } else if (parts.length === 0 && !(type === 'laundry' || type === 'household') ) {
    insufficient ??= 'La composition de ce produit n’est pas disponible : photographiez ou saisissez la liste des ingrédients.';
  }

  // -- Allergies déclarées
  for (const ing of ingredients.filter((i) => i.flags.includes('declared_allergy'))) {
    const a = allergyMatches(ing.name, allergies) ?? '';
    findings.push({
      id: `allergy_${norm(a)}`, level: 'avoid', title: `Contient « ${ing.name} », en lien avec l’allergie déclarée « ${a} »`,
      explanation: 'Correspondance entre la liste des ingrédients (étiquetage obligatoire) et les allergies saisies dans le profil. L’application ne pose aucun diagnostic d’allergie.',
      sourceIds: ['eu-1223-2009'],
    });
  }

  // -- Phénoxyéthanol : produits non rincés sur le siège des enfants de 3 ans ou moins (ANSM 2019)
  if (hasPhenoxy && exposure === 'leave_on' && child && age != null && age <= 36) {
    if (zone === 'diaper_area') {
      findings.push({
        id: 'phenoxy_diaper', level: 'avoid', title: 'Phénoxyéthanol dans un produit non rincé utilisé sur le siège',
        explanation: 'L’ANSM a décidé que les produits cosmétiques non rincés contenant du phénoxyéthanol doivent indiquer qu’ils ne peuvent pas être utilisés sur le siège des enfants de 3 ans ou moins (exposition : non rincé, zone du change).',
        sourceIds: ['ansm-phenoxy-2019'],
      });
      childInfo.push('Produit non rincé contenant du phénoxyéthanol : ne pas l’utiliser sur le siège (ANSM, 2019).');
    } else {
      findings.push({
        id: 'phenoxy_zone', level: 'precaution', title: 'Phénoxyéthanol : ne pas appliquer sur le siège',
        explanation: `Ce produit non rincé contient du phénoxyéthanol. Selon l’ANSM, ce type de produit ne doit pas être utilisé sur le siège des enfants de 3 ans ou moins. Zone indiquée : ${ZONE_LABEL[zone].toLowerCase()}.`,
        sourceIds: ['ansm-phenoxy-2019'],
      });
      if (zone === 'unknown') missing.push('Zone d’application');
    }
  }

  // -- Huiles essentielles présentes dans un produit (hors flacon d'huile essentielle)
  if (essentialOils.length && type !== 'essential_oil') {
    if (profile.kind === 'pregnant' || child) {
      findings.push({
        id: 'eo_ingredient', level: 'precaution', title: `Contient des huiles essentielles (${essentialOils.slice(0, 3).join(', ')}${essentialOils.length > 3 ? '…' : ''})`,
        explanation: 'L’Anses indique que les huiles essentielles sont déconseillées aux femmes enceintes et aux enfants. Leur concentration dans ce produit n’est pas indiquée : demandez conseil à votre pharmacien, votre sage-femme ou votre médecin avant utilisation.',
        sourceIds: ['anses-he-2024'],
      });
      askProfessional ??= 'Ce produit contient des huiles essentielles : demandez conseil à votre pharmacien, votre sage-femme ou votre médecin.';
      missing.push('Concentration des huiles essentielles');
    } else if (profile.kind === 'breastfeeding') {
      findings.push({
        id: 'eo_breastfeeding', level: 'professional', title: 'Contient des huiles essentielles',
        explanation: 'La source consultée ne traite pas spécifiquement l’allaitement : demandez conseil à votre pharmacien, sage-femme ou médecin, et évitez l’application sur la poitrine.',
        sourceIds: ['anses-he-2024'],
      });
      askProfessional ??= 'Ce produit contient des huiles essentielles : demandez conseil à votre pharmacien, votre sage-femme ou votre médecin.';
    } else {
      findings.push({ id: 'eo_info', level: 'info', title: 'Contient des huiles essentielles', explanation: 'Respectez les conditions d’utilisation indiquées et tenez le produit hors de portée des enfants.', sourceIds: ['anses-he-2024'] });
    }
    if (exposure === 'inhaled') {
      findings.push({
        id: 'eo_inhaled', level: 'precaution', title: 'Huiles essentielles diffusées ou vaporisées',
        explanation: 'L’Anses appelle à la vigilance sur les sprays et diffuseurs à base d’huiles essentielles : aérez la pièce et évitez l’exposition des jeunes enfants et des femmes enceintes.',
        sourceIds: ['anses-diffuseurs'],
      });
    }
  }

  // -- Parfum et allergènes de parfum
  if (perfume === 'present') {
    const leaveOnBaby = child && age != null && age < 36 && exposure === 'leave_on';
    findings.push({
      id: 'perfume', level: leaveOnBaby ? 'precaution' : 'info', title: 'Contient du parfum',
      explanation: leaveOnBaby
        ? 'Produit parfumé non rincé appliqué sur la peau d’un jeune enfant : les parfums peuvent contenir des substances allergisantes. En cas de rougeurs ou de peau réactive, arrêtez et demandez conseil.'
        : 'Le parfum peut contenir des substances allergisantes ; le règlement impose de les signaler au-delà de certains seuils.',
      sourceIds: ['eu-1223-2009'],
    });
  }
  if (fragranceAllergens.length) {
    findings.push({
      id: 'fragrance_allergens', level: 'info', title: `Allergènes de parfum déclarés : ${fragranceAllergens.join(', ')}`,
      explanation: `Substances parfumantes allergisantes listées par la réglementation européenne et signalées sur l’étiquette. Exposition : ${EXPOSURE_LABEL[exposure].toLowerCase()}.`,
      sourceIds: ['eu-1223-2009', 'eu-2023-1545'],
    });
  }

  // -- Restrictions réglementaires connues (CosIng importé)
  for (const ing of ingredients.filter((i) => i.restrictions)) {
    findings.push({
      id: `restriction_${norm(ing.name)}`, level: 'info', title: `${ing.name} : ingrédient encadré par la réglementation`,
      explanation: `${ing.restrictions}${ing.functionSource === 'cosing_demo' ? ` (${DEMO_LABEL})` : ''}`,
      sourceIds: ['cosing', 'eu-1223-2009'],
    });
  }

  // -- Lessives et produits ménagers
  if (type === 'laundry' || type === 'household') {
    findings.push({
      id: 'household', level: 'precaution', title: 'Respectez l’étiquette et rangez hors de portée des enfants',
      explanation: `Les mélanges classés selon le règlement CLP portent des pictogrammes et des mentions de danger obligatoires : lisez-les avant usage, gardez l’emballage d’origine et rangez le produit hors de portée des enfants.${child ? ' Pour un jeune enfant, le risque principal est l’ingestion ou la projection du produit pur.' : ''}`,
      sourceIds: ['eu-clp-1272-2008'],
    });
    if (!input.precautionsText) {
      missing.push('Précautions et pictogrammes de l’emballage');
      if (parts.length === 0) insufficient ??= 'Ni la composition ni les précautions d’emballage ne sont disponibles.';
    }
  }

  // -- Zone et exposition
  if (exposure === 'unknown') missing.push('Type d’exposition (rincé, non rincé, inhalé)');
  if (zone === 'unknown' && exposure === 'leave_on') {
    missing.push('Zone d’application');
    lower('medium', 'Zone d’application non précisée.');
  }
  if (!input.precautionsText && type !== 'laundry' && type !== 'household') missing.push('Précautions d’emploi de l’emballage');

  // -- Informations grossesse / âge
  if (profile.kind === 'pregnant' || profile.kind === 'breastfeeding') {
    for (const f of findings) if (['eo_product', 'eo_ingredient', 'eo_breastfeeding', 'professional_type', 'eo_inhaled'].includes(f.id)) pregnancyInfo.push(f.title);
    if (!pregnancyInfo.length) {
      pregnancyInfo.push(profile.kind === 'pregnant'
        ? 'Aucune des règles suivies par l’application ne concerne spécifiquement la grossesse pour cette composition. Cela ne remplace pas l’avis de votre sage-femme ou de votre médecin.'
        : 'Aucune des règles suivies par l’application ne concerne spécifiquement l’allaitement pour cette composition. En cas de doute, demandez conseil à votre sage-femme ou votre pharmacien.');
    }
  }
  if (child) {
    for (const f of findings) if (['eo_product', 'eo_ingredient', 'perfume', 'household', 'eo_inhaled'].includes(f.id) && f.level !== 'info') childInfo.push(f.title);
    if (!childInfo.length) childInfo.push(`Aucune règle liée à l’âge (${profileLabel(profile)}) ne s’applique d’après les informations disponibles.`);
  }

  // -- Verdict
  const sorted = sortFindings(findings);
  let verdict: ProductVerdict;
  let verdictReason: string;
  const avoid = sorted.find((f) => f.level === 'avoid');
  if (!input.identity.confirmed) {
    // Sans confirmation du produit, aucune conclusion (les rappels éventuels restent affichés)
    verdict = 'Informations insuffisantes';
    verdictReason = insufficient ?? 'Le produit n’a pas été confirmé.';
  } else if (avoid) {
    verdict = 'Déconseillé pour ce profil selon la source indiquée';
    verdictReason = avoid.title;
  } else if (insufficient) {
    verdict = 'Informations insuffisantes';
    verdictReason = insufficient;
  } else if (sorted.some((f) => f.level === 'precaution' || f.level === 'professional')) {
    verdict = 'Adapté avec précautions';
    verdictReason = sorted.filter((f) => f.level === 'precaution' || f.level === 'professional').map((f) => f.title).join(' · ');
  } else {
    verdict = 'Adapté selon les informations disponibles';
    verdictReason = 'Aucune des règles suivies par l’application ne s’applique à ce produit pour ce profil, d’après la composition disponible. Les informations manquantes sont listées ci-dessous.';
  }
  if (verdict === 'Informations insuffisantes') certainty = 'low';

  return {
    kind: 'product',
    verdict,
    verdictReason,
    certainty,
    certaintyReasons: [...new Set(certaintyReasons)],
    profile,
    profileLabel: profileLabel(profile),
    product: {
      name: input.identity.name, brand: input.identity.brand, barcode: input.identity.barcode ?? null, imageUrl: input.identity.imageUrl ?? null,
      type, typeLabel: type ? PRODUCT_TYPE_LABEL[type] : 'Type non précisé',
    },
    exposure: { type: exposure, label: EXPOSURE_LABEL[exposure], explanation: EXPOSURE_EXPLANATION[exposure] },
    zone: { type: zone, label: ZONE_LABEL[zone] },
    ingredients,
    fragranceAllergens,
    perfume,
    essentialOils,
    packagingPrecautions: input.precautionsText?.trim() || null,
    periodAfterOpening: input.periodAfterOpening?.trim() || null,
    pregnancyInfo,
    childInfo,
    findings: sorted,
    missing: [...new Set(missing)],
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
