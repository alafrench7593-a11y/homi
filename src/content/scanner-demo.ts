/**
 * Données de DÉMONSTRATION du scanner (mode local sans Supabase, et seed de développement).
 * Toutes sont FICTIVES et marquées is_demo = true : l'interface affiche « Données de démonstration ».
 * Les lignes CosIng / Ciqual ci-dessous ne sont PAS issues des bases officielles : elles illustrent
 * seulement l'affichage tant que les vraies tables n'ont pas été importées (scripts/import-*.mjs).
 * Même contenu que la section « Scanner » de supabase/seed.sql.
 */

const D = '2026-10-16';

export const DEMO_SCANNER_PRODUCTS = [
  {
    id: 'd0d0d0d0-5ca0-4000-8000-000000000062', barcode: '0000000000062', name: 'Lingettes parfumées démo', brand: 'Marque Démo', category: 'wipes', product_type: 'wipes',
    ingredients: null, ingredients_text: 'Aqua, Glycerin, Phenoxyethanol, Ethylhexylglycerin, Parfum, Limonene, Linalool',
    precautions_text: 'Texte de démonstration : usage externe, ne pas avaler.', period_after_opening: '3M', declared_allergens: [], attributes: { fragrance: true },
    image_url: null, nutrition: null, source_url: null, data_source: 'Base fictive de démonstration', data_retrieved_at: D, is_demo: true,
  },
  {
    id: 'd0d0d0d0-5ca0-4000-8000-000000000079', barcode: '0000000000079', name: 'Huile de massage vergetures démo', brand: 'Marque Démo', category: 'stretch_marks', product_type: 'stretch_marks',
    ingredients: null, ingredients_text: 'Prunus Amygdalus Dulcis Oil, Lavandula Angustifolia Oil, Tocopherol, Linalool, Limonene',
    precautions_text: null, period_after_opening: '6M', declared_allergens: [], attributes: {},
    image_url: null, nutrition: null, source_url: null, data_source: 'Base fictive de démonstration', data_retrieved_at: D, is_demo: true,
  },
  {
    id: 'd0d0d0d0-5ca0-4000-8000-000000000086', barcode: '0000000000086', name: 'Lessive douce démo', brand: 'Marque Démo', category: 'laundry', product_type: 'laundry',
    ingredients: null, ingredients_text: 'Aqua, Sodium Laureth Sulfate, Sodium Citrate, Parfum',
    precautions_text: 'Texte de démonstration : tenir hors de portée des enfants ; en cas de contact avec les yeux, rincer.', period_after_opening: null, declared_allergens: [], attributes: {},
    image_url: null, nutrition: null, source_url: null, data_source: 'Base fictive de démonstration', data_retrieved_at: D, is_demo: true,
  },
  {
    id: 'd0d0d0d0-5ca0-4000-8000-000000000093', barcode: '0000000000093', name: 'Biscuits au miel démo', brand: 'Biscuiterie Démo', category: 'food', product_type: null,
    ingredients: null, ingredients_text: 'Farine de blé, sucre, miel 8 %, beurre, sel, poudre à lever',
    precautions_text: null, period_after_opening: null, declared_allergens: ['gluten', 'lait'], attributes: {},
    image_url: null, nutrition: { salt_g_100g: 0.6, sugars_g_100g: 28, energy_kcal_100g: 450 }, source_url: null,
    data_source: 'Base fictive de démonstration', data_retrieved_at: D, is_demo: true,
  },
];

export const DEMO_SCANNER_RECALLS = [
  {
    id: 'd0d0d0d0-5ca0-4000-8000-0000000000a1', source_key: 'demo:lingettes-062', product_id: null, barcode: '0000000000062', gtins: ['0000000000062'],
    lot_numbers: ['DEMO-24'], title: 'Lingettes parfumées démo (lot DEMO-24)', brand: 'Marque Démo', product_name: 'Lingettes parfumées démo',
    reason: 'Exemple fictif : contamination microbiologique possible.', risks: 'Exemple fictif.', recommended_action: 'Exemple fictif : ne plus utiliser, rapporter au point de vente.',
    official_url: 'https://rappel.conso.gouv.fr', image_url: null, source: 'Rappel fictif de démonstration — format RappelConso', published_on: D, is_demo: true,
  },
];

/** Lignes d'illustration (NON officielles) : remplacées par l'import CosIng réel. */
export const DEMO_COSING = [
  { inci_name: 'Aqua', cas: null, ec: null, functions: ['Solvant'], restrictions: null, annex_refs: [], source_url: 'https://ec.europa.eu/growth/tools-databases/cosing/', updated_on: D, is_demo: true },
  { inci_name: 'Glycerin', cas: null, ec: null, functions: ['Humectant'], restrictions: null, annex_refs: [], source_url: 'https://ec.europa.eu/growth/tools-databases/cosing/', updated_on: D, is_demo: true },
  { inci_name: 'Phenoxyethanol', cas: null, ec: null, functions: ['Conservateur'], restrictions: 'Conservateur autorisé à concentration limitée (annexe V).', annex_refs: ['V'], source_url: 'https://ec.europa.eu/growth/tools-databases/cosing/', updated_on: D, is_demo: true },
  { inci_name: 'Parfum', cas: null, ec: null, functions: ['Parfumant'], restrictions: null, annex_refs: [], source_url: 'https://ec.europa.eu/growth/tools-databases/cosing/', updated_on: D, is_demo: true },
];

/** Ligne d'illustration (NON officielle) : remplacée par l'import Ciqual réel. */
export const DEMO_CIQUAL = [
  { code: 'DEMO-MIEL', nom: 'Miel (démonstration)', groupe: 'produits sucrés', sous_groupe: null, nutrients: { sucres_g: 80, sel_g: 0 }, source_version: 'Démonstration', source_date: D, is_demo: true },
];
