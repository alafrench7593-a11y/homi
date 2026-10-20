/**
 * Catalogue de produits enfants : critères objectifs, lisibles et sourcés (méthode interne de l'application).
 * Ce n'est ni une certification, ni un label, ni un avis médical ; un produit cosmétique n'est jamais présenté comme un traitement.
 *
 * Cosmétiques (gel lavant, shampoing, crème, soin du change, peau sensible, solaire, dentifrice) — sur 100 :
 *   composition connue 20 · sans parfum 25 · sans huile essentielle 20 · sans les allergènes parfumants réglementés 20 ·
 *   sans phénoxyéthanol 15 (décision ANSM du 13/03/2019 : produits non rincés, siège des enfants de 3 ans ou moins ;
 *   critère appliqué à tous les cosmétiques du catalogue par prudence, et affiché comme tel).
 * Alimentation infantile — sur 100 : composition connue 20 · sucres ≤ 5 g/100 g (30 ; 15 si ≤ 12,5) · sel ≤ 0,3 g/100 g
 *   (30 ; 15 si ≤ 1,5) · sans édulcorant 20. Valeurs de la fiche Open Food Facts (base collaborative) quand elles existent.
 * Accessoires : pas de note (critères non applicables).
 */
import { fragranceAllergensIn, isEssentialOil, isPerfume, isPhenoxyethanol } from './scanProduct';

export type ProductCategory = 'food' | 'wash' | 'cream' | 'sensitive' | 'hair' | 'teeth' | 'sun' | 'accessory';
export const PRODUCT_CATEGORIES: ProductCategory[] = ['food', 'wash', 'cream', 'sensitive', 'hair', 'teeth', 'sun', 'accessory'];

export interface ProductForCriteria {
  category: ProductCategory;
  composition: string | null;
  nutrition?: { sugars_g_100g: number | null; salt_g_100g: number | null } | null;
}
export interface Criterion { key: string; ok: boolean | null; points: number; max: number }
export interface CriteriaResult { score: number | null; criteria: Criterion[]; flags: { perfume: boolean; essentialOils: string[]; allergens: string[]; phenoxyethanol: boolean } }

export const PRODUCT_CRITERIA_SOURCES = [
  { label: 'Règlement (CE) n° 1223/2009 relatif aux produits cosmétiques — annexe III (substances parfumantes allergisantes)', url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223' },
  { label: 'ANSM — Décision du 13/03/2019 : produits cosmétiques non rincés contenant du phénoxyéthanol, « ne pas utiliser sur le siège des enfants de 3 ans ou moins »', url: 'https://ansm.sante.fr/actualites/decision-du-13-03-2019-fixant-des-conditions-particulieres-dutilisation-des-produits-cosmetiques-non-rinces-contenant-du-phenoxyethanol-en-precisant-sur-leur-etiquetage-quils-ne-peuvent-pas-etre-utilises-sur-le-siege-des-enfants-de-3-ans-ou-moins' },
  { label: 'Open Food Facts / Open Beauty Facts — bases collaboratives (ODbL)', url: 'https://world.openfoodfacts.org' },
];

/** Liste d'ingrédients séparée par virgules (INCI ou alimentaire). */
export const splitIngredients = (text: string) => text.split(/[,;]|\s-\s/).map((x) => x.trim()).filter(Boolean);

export function productCriteria(p: ProductForCriteria): CriteriaResult {
  const list = p.composition ? splitIngredients(p.composition) : [];
  const known = list.length > 0;
  const perfume = list.some(isPerfume);
  const essentialOils = list.filter(isEssentialOil);
  const allergens = [...new Set(list.map(fragranceAllergensIn).filter((x): x is string => !!x))];
  const phenoxyethanol = list.some(isPhenoxyethanol);
  const flags = { perfume, essentialOils, allergens, phenoxyethanol };
  if (p.category === 'accessory') return { score: null, criteria: [], flags };
  const c = (key: string, ok: boolean | null, max: number, partial = 0): Criterion => ({ key, ok, max, points: ok === null ? 0 : ok ? max : partial });
  let criteria: Criterion[];
  if (p.category === 'food') {
    const sugar = p.nutrition?.sugars_g_100g ?? null;
    const salt = p.nutrition?.salt_g_100g ?? null;
    const sweet = /aspartame|acesulfame|sucralose|saccharine|st[ée]vi|cyclamate|[ée]dulcorant|sweetener/i.test(p.composition ?? '');
    criteria = [
      c('composition', known, 20),
      sugar == null ? c('sugar', null, 30) : c('sugar', sugar <= 5, 30, sugar <= 12.5 ? 15 : 0),
      salt == null ? c('salt', null, 30) : c('salt', salt <= 0.3, 30, salt <= 1.5 ? 15 : 0),
      c('sweetener', known ? !sweet : null, 20),
    ];
  } else {
    criteria = [
      c('composition', known, 20),
      c('perfume', known ? !perfume : null, 25),
      c('essential_oils', known ? essentialOils.length === 0 : null, 20),
      c('fragrance_allergens', known ? allergens.length === 0 : null, 20),
      c('phenoxyethanol', known ? !phenoxyethanol : null, 15),
    ];
  }
  // Composition inconnue : pas de note (on ne note pas ce qu'on ne peut pas vérifier)
  const score = known ? criteria.reduce((a, x) => a + x.points, 0) : null;
  return { score, criteria, flags };
}
