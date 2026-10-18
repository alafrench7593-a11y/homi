/**
 * Évaluation TRANSPARENTE d'un produit précis (jamais d'une marque).
 * Pas de note opaque : une liste de constats, chacun avec son critère
 * et sa source, et des informations manquantes explicitement signalées.
 * Module pur, testé par Jest.
 */
import { checkAllergies } from './allergens.ts';

export interface ProductData {
  name: string;
  brand?: string | null;
  category: string;
  ingredients?: string[] | null;
  declared_allergens?: string[] | null;
  /** Traces « peut contenir » ; null/absent = non renseigné. */
  traces?: string[] | null;
  attributes?: Record<string, unknown> | null;
  data_source: string;
  data_retrieved_at: string;
  is_demo?: boolean;
}

export interface ScanContext {
  pregnant?: boolean;
  childAgeMonths?: number | null;
  childDeclaredAllergies?: string[];
}

export type FindingLevel = 'info' | 'attention' | 'avoid_advised';

export interface Finding {
  level: FindingLevel;
  title: string;
  criterion: string;
  source: string;
}

export interface Assessment {
  findings: Finding[];
  missing: string[];
  disclaimers: string[];
}

const OFFICIAL_FOOD = 'Recommandations alimentaires pendant la grossesse — Assurance Maladie / Santé publique France (à vérifier à la date de consultation)';
const DIVERSIFICATION = 'Recommandations sur la diversification alimentaire — Santé publique France / 1000 premiers jours';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function assessProduct(p: ProductData, ctx: ScanContext): Assessment {
  const findings: Finding[] = [];
  const missing: string[] = [];
  const attrs = p.attributes ?? {};
  const ingredients = p.ingredients ?? [];

  if (!p.ingredients || p.ingredients.length === 0) missing.push('Liste des ingrédients / composition');
  if (!p.declared_allergens) missing.push('Allergènes déclarés');
  if (!p.brand) missing.push('Marque');

  const isFood = p.category === 'food' || p.category === 'drink';
  const rawMilk = attrs.raw_milk === true || ingredients.some((i) => /lait cru/.test(norm(i)));
  const cheeseType = typeof attrs.cheese_type === 'string' ? attrs.cheese_type : null;

  if (ctx.pregnant && isFood) {
    if (rawMilk && cheeseType !== 'hard_cooked') {
      findings.push({
        level: 'avoid_advised',
        title: 'Produit au lait cru : généralement déconseillé pendant la grossesse',
        criterion: 'Lait cru indiqué sur l’emballage ou dans les ingrédients (risque de listériose).',
        source: OFFICIAL_FOOD,
      });
    } else if (rawMilk && cheeseType === 'hard_cooked') {
      findings.push({
        level: 'info',
        title: 'Fromage à pâte pressée cuite au lait cru',
        criterion: 'Les recommandations officielles font généralement une exception pour ce type de fromage ; retirer la croûte.',
        source: OFFICIAL_FOOD,
      });
    } else if (cheeseType && attrs.raw_milk === undefined && !ingredients.length) {
      missing.push('Type de lait (cru, thermisé ou pasteurisé)');
    }
    if (attrs.alcohol === true) {
      findings.push({ level: 'avoid_advised', title: 'Contient de l’alcool', criterion: 'Aucune consommation d’alcool n’est recommandée pendant la grossesse.', source: 'Santé publique France' });
    }
  }

  if (ctx.childAgeMonths != null && isFood) {
    const minAge = typeof attrs.min_age_months === 'number' ? attrs.min_age_months : null;
    if (minAge != null && ctx.childAgeMonths < minAge) {
      findings.push({
        level: 'attention',
        title: `Indiqué à partir de ${minAge} mois`,
        criterion: `L’emballage indique un âge minimal de ${minAge} mois ; votre enfant a ${ctx.childAgeMonths} mois.`,
        source: 'Emballage du produit',
      });
    }
    if (ctx.childAgeMonths < 12 && (attrs.added_salt === true || attrs.added_sugar === true)) {
      findings.push({ level: 'attention', title: 'Sel ou sucre ajouté', criterion: 'Il est recommandé de ne pas ajouter de sel ni de sucre avant 1 an.', source: DIVERSIFICATION });
    }
    if (ctx.childAgeMonths < 12 && ingredients.some((i) => /\bmiel\b/.test(norm(i)))) {
      findings.push({ level: 'avoid_advised', title: 'Contient du miel', criterion: 'Le miel est déconseillé avant 1 an (risque de botulisme infantile).', source: DIVERSIFICATION });
    }
  }

  const declared = (p.declared_allergens ?? []).map(norm);
  const chk = checkAllergies({ allergies: ctx.childDeclaredAllergies ?? [], declaredTags: p.declared_allergens ?? null, tracesTags: p.traces ?? null, ingredientsText: ingredients.length ? ingredients.join(', ') : null });
  for (const m of chk.identified) {
    findings.push({
      level: 'avoid_advised',
      title: `Contient « ${m.allergy} », allergie que vous avez déclarée`,
      criterion: m.via === 'declared' ? 'Allergène déclaré par le fabricant, correspondant à une allergie saisie dans le profil.' : 'Correspondance entre la liste des ingrédients et une allergie saisie dans le profil.',
      source: 'Étiquetage du produit + profil de l’enfant',
    });
  }
  for (const m of chk.possible) {
    findings.push({ level: 'attention', title: `Peut contenir « ${m.allergy} » (traces)`, criterion: 'Mention « peut contenir » : présence non intentionnelle possible.', source: 'Étiquetage du produit' });
  }
  if (chk.noMatchNote) findings.push({ level: chk.insufficient.length ? 'attention' : 'info', title: chk.insufficient.length ? 'Allergies : vérification impossible avec ces données' : 'Allergies : aucune correspondance trouvée', criterion: chk.noMatchNote, source: p.data_source });
  if (declared.length) {
    findings.push({ level: 'info', title: `Allergènes déclarés : ${p.declared_allergens!.join(', ')}`, criterion: 'Allergènes à déclaration obligatoire indiqués par le fabricant.', source: p.data_source });
  }

  if (['cream', 'shampoo', 'wash_gel', 'wipes', 'sunscreen'].includes(p.category)) {
    if (attrs.fragrance === true || ingredients.some((i) => /\b(parfum|fragrance)\b/.test(norm(i)))) {
      findings.push({
        level: 'info',
        title: 'Contient du parfum',
        criterion: 'Les parfums peuvent contenir des allergènes cutanés ; à prendre en compte en cas de peau réactive.',
        source: 'Liste INCI du produit',
      });
    }
  }

  const disclaimers = [
    'Cette analyse porte sur ce produit précis, d’après les données indiquées et leur date de récupération.',
    'L’absence d’alerte ne signifie pas qu’un produit est sans danger.',
    'Vérifiez toujours l’emballage, et demandez conseil à un professionnel de santé en cas de doute.',
  ];
  if (p.is_demo) disclaimers.unshift('DONNÉES FICTIVES : ce produit provient de la base de démonstration.');

  return { findings, missing, disclaimers };
}
