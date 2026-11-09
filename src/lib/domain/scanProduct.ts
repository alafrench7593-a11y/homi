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
import { getLocale, t as tr } from '@/i18n';
import { localized } from '@/i18n/localized';
import { EXPOSURE_EXPLANATION_ES, EXPOSURE_LABEL_ES, PRODUCT_TYPE_LABEL_ES, ZONE_LABEL_ES } from './scanProduct.es';
import { EXPOSURE_EXPLANATION_DE, EXPOSURE_LABEL_DE, PRODUCT_TYPE_LABEL_DE, ZONE_LABEL_DE } from './scanProduct.de';
import { EXPOSURE_EXPLANATION_IT, EXPOSURE_LABEL_IT, PRODUCT_TYPE_LABEL_IT, ZONE_LABEL_IT } from './scanProduct.it';

export type ProductType =
  | 'cream' | 'oil' | 'wash_gel' | 'shampoo' | 'sunscreen' | 'makeup' | 'stretch_marks' | 'wipes' | 'diapers'
  | 'laundry' | 'household' | 'perfume' | 'baby_care' | 'medicine' | 'essential_oil' | 'supplement' | 'treatment' | 'other';

const PRODUCT_TYPE_LABEL_FR: Record<ProductType, string> = {
  cream: 'Crème', oil: 'Huile de soin', wash_gel: 'Gel lavant', shampoo: 'Shampooing', sunscreen: 'Protection solaire', makeup: 'Maquillage',
  stretch_marks: 'Soin anti-vergetures', wipes: 'Lingettes', diapers: 'Couches', laundry: 'Lessive', household: 'Produit ménager', perfume: 'Parfum',
  baby_care: 'Soin bébé / enfant', medicine: 'Médicament', essential_oil: 'Huile essentielle', supplement: 'Complément alimentaire',
  treatment: 'Produit de traitement (poux, verrues…)', other: 'Autre',
};
const PRODUCT_TYPE_LABEL_EN: Record<ProductType, string> = {
  cream: 'Cream', oil: 'Care oil', wash_gel: 'Wash gel', shampoo: 'Shampoo', sunscreen: 'Sun protection', makeup: 'Make-up',
  stretch_marks: 'Stretch mark care', wipes: 'Wipes', diapers: 'Nappies', laundry: 'Laundry detergent', household: 'Household product', perfume: 'Perfume',
  baby_care: 'Baby / child care', medicine: 'Medicine', essential_oil: 'Essential oil', supplement: 'Food supplement',
  treatment: 'Treatment product (lice, warts…)', other: 'Other',
};
export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = localized(PRODUCT_TYPE_LABEL_FR, PRODUCT_TYPE_LABEL_EN, { es: PRODUCT_TYPE_LABEL_ES, de: PRODUCT_TYPE_LABEL_DE, it: PRODUCT_TYPE_LABEL_IT });

/** Types pour lesquels l'application ne se prononce pas : avis d'un professionnel. */
export const PROFESSIONAL_TYPES: ProductType[] = ['medicine', 'essential_oil', 'supplement', 'treatment'];

export type Exposure = 'rinse_off' | 'leave_on' | 'inhaled' | 'indirect' | 'unknown';
export type Zone = 'face' | 'body' | 'diaper_area' | 'scalp' | 'lips' | 'hands' | 'air' | 'textiles' | 'surfaces' | 'unknown';

const EXPOSURE_LABEL_FR: Record<Exposure, string> = {
  rinse_off: 'Produit rincé', leave_on: 'Produit non rincé (reste sur la peau)', inhaled: 'Exposition par inhalation possible',
  indirect: 'Contact indirect (textiles, surfaces)', unknown: 'Type d’exposition inconnu',
};
const EXPOSURE_EXPLANATION_FR: Record<Exposure, string> = {
  rinse_off: 'Le produit est rincé après application : il reste peu de temps au contact de la peau.',
  leave_on: 'Le produit reste sur la peau : l’exposition est plus longue qu’avec un produit rincé.',
  inhaled: 'Une partie du produit peut être respirée (spray, parfum, diffusion) : aérez et évitez l’usage à proximité du visage d’un enfant.',
  indirect: 'Le contact se fait surtout par les textiles lavés ou les surfaces ; le risque principal vient du produit pur (ingestion accidentelle, projection).',
  unknown: 'L’application ne sait pas si ce produit est rincé, laissé sur la peau ou inhalé : précisez-le pour affiner l’analyse.',
};
const EXPOSURE_LABEL_EN: Record<Exposure, string> = {
  rinse_off: 'Rinse-off product', leave_on: 'Leave-on product (stays on the skin)', inhaled: 'Possible exposure by inhalation',
  indirect: 'Indirect contact (textiles, surfaces)', unknown: 'Type of exposure unknown',
};
const EXPOSURE_EXPLANATION_EN: Record<Exposure, string> = {
  rinse_off: 'The product is rinsed off after application: it stays in contact with the skin only briefly.',
  leave_on: 'The product stays on the skin: exposure is longer than with a rinse-off product.',
  inhaled: 'Some of the product may be breathed in (spray, perfume, diffusion): ventilate the room and avoid using it near a child’s face.',
  indirect: 'Contact is mainly through washed textiles or surfaces; the main risk comes from the undiluted product (accidental swallowing, splashing).',
  unknown: 'The app does not know whether this product is rinsed off, left on the skin or inhaled: specify it to refine the analysis.',
};
export const EXPOSURE_LABEL: Record<Exposure, string> = localized(EXPOSURE_LABEL_FR, EXPOSURE_LABEL_EN, { es: EXPOSURE_LABEL_ES, de: EXPOSURE_LABEL_DE, it: EXPOSURE_LABEL_IT });
const EXPOSURE_EXPLANATION: Record<Exposure, string> = localized(EXPOSURE_EXPLANATION_FR, EXPOSURE_EXPLANATION_EN, { es: EXPOSURE_EXPLANATION_ES, de: EXPOSURE_EXPLANATION_DE, it: EXPOSURE_EXPLANATION_IT });
const ZONE_LABEL_FR: Record<Zone, string> = {
  face: 'Visage', body: 'Corps', diaper_area: 'Siège (zone du change)', scalp: 'Cuir chevelu', lips: 'Lèvres', hands: 'Mains',
  air: 'Air ambiant', textiles: 'Textiles', surfaces: 'Surfaces', unknown: 'Zone non précisée',
};
const ZONE_LABEL_EN: Record<Zone, string> = {
  face: 'Face', body: 'Body', diaper_area: 'Nappy area (change zone)', scalp: 'Scalp', lips: 'Lips', hands: 'Hands',
  air: 'Room air', textiles: 'Textiles', surfaces: 'Surfaces', unknown: 'Area not specified',
};
export const ZONE_LABEL: Record<Zone, string> = localized(ZONE_LABEL_FR, ZONE_LABEL_EN, { es: ZONE_LABEL_ES, de: ZONE_LABEL_DE, it: ZONE_LABEL_IT });
/** Libellé inséré au milieu d'une phrase : minuscule initiale, sauf en allemand (les noms y gardent leur majuscule). */
const inSentence = (s: string) => (getLocale() === 'de' ? s : s.toLowerCase());

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

/** Libellé affiché d'un verdict dans la langue en cours (la valeur enregistrée reste le texte français). */
export function productVerdictLabel(v: string): string {
  const i = (PRODUCT_VERDICTS as readonly string[]).indexOf(v);
  return i < 0 ? v : tr(`l4.sp.v.${i}` as 'l4.sp.v.0');
}

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
    insufficient = tr('l4.sp.imp.unconfirmed');
    lower('low', tr('l4.sp.cr.unconfirmed'));
  }
  if (!input.identity.name) missing.push(tr('l4.sp.miss.name'));
  if (!type) {
    missing.push(tr('l4.sp.miss.type'));
    lower('medium', tr('l4.sp.cr.type'));
  }
  if (child && age == null) {
    insufficient ??= tr('l4.sp.imp.age');
    missing.push(tr('l4.sp.miss.age'));
    lower('low', tr('l4.sp.cr.age'));
  }

  // -- Données
  if (input.dataSource.is_demo) lower('low', tr('l4.sp.cr.demo', { label: DEMO_LABEL }));
  else if (input.dataSource.collaborative) lower('medium', tr('l4.sp.cr.collab'));

  // -- Composition
  const parts = splitIngredients(input.ingredientsText);
  if (parts.length === 0) {
    missing.push(tr('l4.sp.miss.ingredients'));
  } else if (input.ingredientsOrigin === 'manual') {
    lower('low', tr('l4.sp.cr.manual'));
  } else if (input.ingredientsOrigin === 'ocr_reviewed') {
    const r = input.ocrReadability;
    if (r != null && r < 0.6) lower('low', tr('l4.sp.cr.ocr_low'));
    else lower('medium', tr('l4.sp.cr.ocr'));
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
  if (parts.length && unknownFunctions) missing.push(tr('l4.sp.miss.cosing', { count: unknownFunctions }));

  const fragranceAllergens = [...new Set(parts.map(fragranceAllergensIn).filter((x): x is string => !!x))];
  const perfume: ProductAnalysis['perfume'] = parts.length === 0 ? 'unknown' : ingredients.some((i) => i.flags.includes('perfume')) ? 'present' : 'absent';
  const essentialOils = ingredients.filter((i) => i.flags.includes('essential_oil')).map((i) => i.name);
  const hasPhenoxy = ingredients.some((i) => i.flags.includes('phenoxyethanol'));

  // -- Rappel officiel (toujours prioritaire)
  for (const r of input.recalls) {
    if (r.match === 'gtin') {
      findings.push({
        id: 'recall', level: 'avoid', title: tr('l4.sp.f.recall.t', { title: r.title }),
        explanation: `${r.reason ?? tr('l4.sp.recall.noReason')}${r.recommended_action ? ` ${tr('l4.sp.recall.action', { action: r.recommended_action })}` : ''} ${tr('l4.sp.recall.lot')}`,
        sourceIds: ['rappelconso'],
      });
    } else {
      findings.push({
        id: 'recall_possible', level: 'precaution', title: tr('l4.sp.f.recall_possible.t', { title: r.title }),
        explanation: tr('l4.sp.f.recall_possible.e'),
        sourceIds: ['rappelconso'],
      });
      lower('medium', tr('l4.sp.cr.recall_possible'));
    }
  }

  // -- Médicaments, huiles essentielles, compléments, traitements
  if (type && PROFESSIONAL_TYPES.includes(type)) {
    askProfessional = tr('l4.sp.ask.professional');
    if (type === 'essential_oil' && (profile.kind === 'pregnant' || child)) {
      findings.push({
        id: 'eo_product', level: 'avoid', title: tr('l4.sp.f.eo_product.t'),
        explanation: tr('l4.sp.f.eo_product.e'),
        sourceIds: ['anses-he-2024'],
      });
    } else {
      findings.push({
        id: 'professional_type', level: 'professional', title: tr('l4.sp.f.professional_type.t', { type: PRODUCT_TYPE_LABEL[type] }),
        explanation: tr('l4.sp.f.professional_type.e'),
        sourceIds: profile.kind === 'pregnant' || profile.kind === 'breastfeeding' ? ['lecrat'] : type === 'essential_oil' ? ['anses-he-2024'] : ['lecrat'],
      });
      insufficient ??= tr('l4.sp.imp.professional');
    }
  } else if (parts.length === 0 && !(type === 'laundry' || type === 'household') ) {
    insufficient ??= tr('l4.sp.imp.nocomposition');
  }

  // -- Allergies déclarées
  for (const ing of ingredients.filter((i) => i.flags.includes('declared_allergy'))) {
    const a = allergyMatches(ing.name, allergies) ?? '';
    findings.push({
      id: `allergy_${norm(a)}`, level: 'avoid', title: tr('l4.sp.f.allergy.t', { name: ing.name, allergy: a }),
      explanation: tr('l4.sp.f.allergy.e'),
      sourceIds: ['eu-1223-2009'],
    });
  }

  // -- Phénoxyéthanol : produits non rincés sur le siège des enfants de 3 ans ou moins (ANSM 2019)
  if (hasPhenoxy && exposure === 'leave_on' && child && age != null && age <= 36) {
    if (zone === 'diaper_area') {
      findings.push({
        id: 'phenoxy_diaper', level: 'avoid', title: tr('l4.sp.f.phenoxy_diaper.t'),
        explanation: tr('l4.sp.f.phenoxy_diaper.e'),
        sourceIds: ['ansm-phenoxy-2019'],
      });
      childInfo.push(tr('l4.sp.child.phenoxy'));
    } else {
      findings.push({
        id: 'phenoxy_zone', level: 'precaution', title: tr('l4.sp.f.phenoxy_zone.t'),
        explanation: tr('l4.sp.f.phenoxy_zone.e', { zone: inSentence(ZONE_LABEL[zone]) }),
        sourceIds: ['ansm-phenoxy-2019'],
      });
      if (zone === 'unknown') missing.push(tr('l4.sp.miss.zone'));
    }
  }

  // -- Huiles essentielles présentes dans un produit (hors flacon d'huile essentielle)
  if (essentialOils.length && type !== 'essential_oil') {
    if (profile.kind === 'pregnant' || child) {
      findings.push({
        id: 'eo_ingredient', level: 'precaution', title: tr('l4.sp.f.eo_ingredient.t', { list: essentialOils.slice(0, 3).join(', '), more: essentialOils.length > 3 ? '…' : '' }),
        explanation: tr('l4.sp.f.eo_ingredient.e'),
        sourceIds: ['anses-he-2024'],
      });
      askProfessional ??= tr('l4.sp.ask.eo');
      missing.push(tr('l4.sp.miss.eo'));
    } else if (profile.kind === 'breastfeeding') {
      findings.push({
        id: 'eo_breastfeeding', level: 'professional', title: tr('l4.sp.f.eo.t'),
        explanation: tr('l4.sp.f.eo_breastfeeding.e'),
        sourceIds: ['anses-he-2024'],
      });
      askProfessional ??= tr('l4.sp.ask.eo');
    } else {
      findings.push({ id: 'eo_info', level: 'info', title: tr('l4.sp.f.eo.t'), explanation: tr('l4.sp.f.eo_info.e'), sourceIds: ['anses-he-2024'] });
    }
    if (exposure === 'inhaled') {
      findings.push({
        id: 'eo_inhaled', level: 'precaution', title: tr('l4.sp.f.eo_inhaled.t'),
        explanation: tr('l4.sp.f.eo_inhaled.e'),
        sourceIds: ['anses-diffuseurs'],
      });
    }
  }

  // -- Parfum et allergènes de parfum
  if (perfume === 'present') {
    const leaveOnBaby = child && age != null && age < 36 && exposure === 'leave_on';
    findings.push({
      id: 'perfume', level: leaveOnBaby ? 'precaution' : 'info', title: tr('l4.sp.f.perfume.t'),
      explanation: leaveOnBaby
        ? tr('l4.sp.f.perfume.e1')
        : tr('l4.sp.f.perfume.e2'),
      sourceIds: ['eu-1223-2009'],
    });
  }
  if (fragranceAllergens.length) {
    findings.push({
      id: 'fragrance_allergens', level: 'info', title: tr('l4.sp.f.fragrance_allergens.t', { list: fragranceAllergens.join(', ') }),
      explanation: tr('l4.sp.f.fragrance_allergens.e', { exposure: inSentence(EXPOSURE_LABEL[exposure]) }),
      sourceIds: ['eu-1223-2009', 'eu-2023-1545'],
    });
  }

  // -- Restrictions réglementaires connues (CosIng importé)
  for (const ing of ingredients.filter((i) => i.restrictions)) {
    findings.push({
      id: `restriction_${norm(ing.name)}`, level: 'info', title: tr('l4.sp.f.restriction.t', { name: ing.name }),
      explanation: `${ing.restrictions}${ing.functionSource === 'cosing_demo' ? ` (${DEMO_LABEL})` : ''}`,
      sourceIds: ['cosing', 'eu-1223-2009'],
    });
  }

  // -- Lessives et produits ménagers
  if (type === 'laundry' || type === 'household') {
    findings.push({
      id: 'household', level: 'precaution', title: tr('l4.sp.f.household.t'),
      explanation: `${tr('l4.sp.f.household.e')}${child ? tr('l4.sp.f.household.child') : ''}`,
      sourceIds: ['eu-clp-1272-2008'],
    });
    if (!input.precautionsText) {
      missing.push(tr('l4.sp.miss.precautions_pack'));
      if (parts.length === 0) insufficient ??= tr('l4.sp.imp.noprecautions');
    }
  }

  // -- Zone et exposition
  if (exposure === 'unknown') missing.push(tr('l4.sp.miss.exposure'));
  if (zone === 'unknown' && exposure === 'leave_on') {
    missing.push(tr('l4.sp.miss.zone'));
    lower('medium', tr('l4.sp.cr.zone'));
  }
  if (!input.precautionsText && type !== 'laundry' && type !== 'household') missing.push(tr('l4.sp.miss.precautions'));

  // -- Informations grossesse / âge
  if (profile.kind === 'pregnant' || profile.kind === 'breastfeeding') {
    for (const f of findings) if (['eo_product', 'eo_ingredient', 'eo_breastfeeding', 'professional_type', 'eo_inhaled'].includes(f.id)) pregnancyInfo.push(f.title);
    if (!pregnancyInfo.length) {
      pregnancyInfo.push(profile.kind === 'pregnant'
        ? tr('l4.sp.preg.none')
        : tr('l4.sp.bf.none'));
    }
  }
  if (child) {
    for (const f of findings) if (['eo_product', 'eo_ingredient', 'perfume', 'household', 'eo_inhaled'].includes(f.id) && f.level !== 'info') childInfo.push(f.title);
    if (!childInfo.length) childInfo.push(tr('l4.sp.child.none', { profile: profileLabel(profile) }));
  }

  // -- Verdict
  const sorted = sortFindings(findings);
  let verdict: ProductVerdict;
  let verdictReason: string;
  const avoid = sorted.find((f) => f.level === 'avoid');
  if (!input.identity.confirmed) {
    // Sans confirmation du produit, aucune conclusion (les rappels éventuels restent affichés)
    verdict = 'Informations insuffisantes';
    verdictReason = insufficient ?? tr('l4.sp.vr.unconfirmed');
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
    verdictReason = tr('l4.sp.vr.ok');
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
      type, typeLabel: type ? PRODUCT_TYPE_LABEL[type] : tr('l4.sp.typeNone'),
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
