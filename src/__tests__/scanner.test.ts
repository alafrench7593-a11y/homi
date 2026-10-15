/**
 * Scanner : moteurs de règles (produits, aliments), formulations interdites, lecteur RappelConso (deux schémas),
 * normalisation Open Food / Beauty Facts, contrôle de l'explication IA, assemblage du parcours et moteur local.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { createDemoBackend } from '@/lib/backend/demo';
import { eq } from '@/lib/backend/types';
import {
  analysisText, containsForbiddenPhrase, DEMO_LABEL, RECALL_DISCLAIMER, splitIngredients, type RecallInfo, type ScanProfile,
} from '@/lib/domain/scanCommon';
import { buildExplainPayload, ruleExplanation } from '@/lib/domain/scanExplain';
import { buildFoodInput, buildProductInput, catalogMatches, ingredientNamesForCosing, nutritionFromCiqual, parseAllergies, subjectDataSource } from '@/lib/domain/scanFlow';
import { analyzeFood, detectFacets, FOOD_VERDICTS, foodQuestions, type FoodInput } from '@/lib/domain/scanFood';
import { estimateReadability, extractIngredientSection, extractPrintedBarcode, frontTextToQuery } from '@/lib/domain/scanOcr';
import { analyzeProduct, fragranceAllergensIn, isEssentialOil, PRODUCT_VERDICTS, type ProductInput } from '@/lib/domain/scanProduct';
import { SCAN_SOURCES } from '@/lib/domain/scanSources';
import { LOCAL_RECOGNITION_UNAVAILABLE, LocalRecognitionUnavailable, localTextRecognitionAvailable, readBarcodesFromImage, readTextFromImage } from '@/lib/scanner/localRecognition';
import type { ExplainResponse, LookupResponse, ProductCandidate, ScanResultRow, ScanRow, SearchResponse } from '@/lib/types-scanner';
import { fromProductRow, guessProductType, normalizeOpenFacts, normalizeSearch, productUrl, searchUrl } from '../../supabase/functions/_shared/open-facts';
import { matchRecalls, parseRecallRecords, rappelConsoUrl, recallRow, sameGtin, validGtin } from '../../supabase/functions/_shared/rappelconso';
import { checkExplanation, sanitizePayload } from '../../supabase/functions/_shared/scan-explain';

const NOW = new Date('2026-10-16T10:00:00Z');
const real = { label: 'Open Beauty Facts (base collaborative)', is_demo: false, collaborative: true };
const PREGNANT: ScanProfile = { kind: 'pregnant' };
const baby = (m: number): ScanProfile => ({ kind: 'baby', ageMonths: m });

function product(over: Partial<ProductInput> = {}): ProductInput {
  return {
    identity: { name: 'Crème test', brand: 'Marque', barcode: '3017620422003', confirmed: true },
    type: 'cream', ingredientsText: 'Aqua, Glycerin, Cetearyl Alcohol', ingredientsOrigin: 'database',
    precautionsText: 'Usage externe.', dataSource: real, recalls: [], ...over,
  };
}
function food(name: string, over: Partial<FoodInput> = {}): FoodInput {
  return { identity: { name, confirmed: true }, dataSource: { label: 'Saisie', is_demo: false }, recalls: [], ...over };
}
const recall = (match: 'gtin' | 'brand_name' = 'gtin'): RecallInfo => ({
  id: 'r1', title: 'Crème test lot A', reason: 'Contamination microbiologique', recommended_action: 'Ne plus utiliser', official_url: 'https://rappel.conso.gouv.fr/fiche-rappel/1/Interne',
  source: 'RappelConso', published_on: '2026-10-01', lot_numbers: ['A'], match, is_demo: false,
});

const expectNoForbidden = (a: Parameters<typeof analysisText>[0]) => expect(containsForbiddenPhrase(analysisText(a))).toBeNull();

// ====================================================================== formulations
describe('formulations interdites', () => {
  it.each(['Produit sans toxines', 'totalement sans danger', 'Zéro risque', '100 % sûr', 'Ce produit est inoffensif', 'non toxique', 'garanti sans risque'])('détecte « %s »', (s) => {
    expect(containsForbiddenPhrase(s)).not.toBeNull();
  });
  it('autorise la mention obligatoire sur les rappels', () => {
    expect(RECALL_DISCLAIMER).toBe('L’absence de rappel officiel ne signifie pas que le produit est garanti sans danger.');
    expect(containsForbiddenPhrase(`Aucun rappel trouvé. ${RECALL_DISCLAIMER}`)).toBeNull();
  });
  it('les sources citées sont toutes en https et datées', () => {
    for (const s of Object.values(SCAN_SOURCES)) {
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.consulted_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

// ====================================================================== produits
describe('moteur de règles produit', () => {
  it('produit non confirmé → Informations insuffisantes', () => {
    const a = analyzeProduct(product({ identity: { name: 'X', brand: null, confirmed: false } }), PREGNANT, NOW);
    expect(a.verdict).toBe('Informations insuffisantes');
    expect(a.certainty).toBe('low');
  });
  it('composition inconnue → Informations insuffisantes, sans note chiffrée', () => {
    const a = analyzeProduct(product({ ingredientsText: null, ingredientsOrigin: null }), PREGNANT, NOW);
    expect(a.verdict).toBe('Informations insuffisantes');
    expect(a.missing).toContain('Liste des ingrédients / composition');
    expect(a.score).toBeNull();
    expect(a.recallDisclaimer).toBe(RECALL_DISCLAIMER);
  });
  it('sans ligne CosIng importée, la fonction est « information non disponible »', () => {
    const a = analyzeProduct(product(), { kind: 'adult' }, NOW);
    expect(a.ingredients.every((i) => i.functions === null)).toBe(true);
    expect(a.missing.some((m) => /information non disponible \(base CosIng\)/.test(m))).toBe(true);
  });
  it('fonctions CosIng importées affichées avec leur origine', () => {
    const a = analyzeProduct(product({ cosing: [{ inci_name: 'GLYCERIN', functions: ['HUMECTANT'], restrictions: null, annex_refs: [], source_url: 'https://ec.europa.eu/growth/tools-databases/cosing/', updated_on: '2026-10-16' }] }), { kind: 'adult' }, NOW);
    const g = a.ingredients.find((i) => i.name === 'Glycerin')!;
    expect(g.functions).toEqual(['HUMECTANT']);
    expect(g.functionSource).toBe('cosing');
  });
  it('phénoxyéthanol non rincé sur le siège d’un bébé → déconseillé (ANSM 2019)', () => {
    const a = analyzeProduct(product({ type: 'wipes', ingredientsText: 'Aqua, Phenoxyethanol, Parfum' }), baby(6), NOW);
    expect(a.verdict).toBe('Déconseillé pour ce profil selon la source indiquée');
    expect(a.sources.map((s) => s.id)).toContain('ansm-phenoxy-2019');
    expect(a.perfume).toBe('present');
    expectNoForbidden(a);
  });
  it('huile essentielle (flacon) pendant la grossesse → déconseillé selon l’Anses', () => {
    const a = analyzeProduct(product({ type: 'essential_oil', ingredientsText: 'Lavandula Angustifolia Oil' }), PREGNANT, NOW);
    expect(a.verdict).toBe('Déconseillé pour ce profil selon la source indiquée');
    expect(a.askProfessional).toMatch(/pharmacien/);
  });
  it('huiles essentielles dans une crème, grossesse → précautions + avis professionnel', () => {
    const a = analyzeProduct(product({ type: 'stretch_marks', ingredientsText: 'Prunus Amygdalus Dulcis Oil, Lavandula Angustifolia Oil, Linalool', zone: 'body' }), PREGNANT, NOW);
    expect(a.verdict).toBe('Adapté avec précautions');
    expect(a.essentialOils).toEqual(['Lavandula Angustifolia Oil']);
    expect(a.fragranceAllergens).toContain('Linalool');
    expect(a.askProfessional).toMatch(/sage-femme/);
  });
  it('médicament, complément, traitement → avis d’un professionnel', () => {
    for (const type of ['medicine', 'supplement', 'treatment'] as const) {
      const a = analyzeProduct(product({ type }), { kind: 'breastfeeding' }, NOW);
      expect(a.askProfessional).toMatch(/pharmacien.*sage-femme.*médecin/);
      expect(a.verdict).toBe('Informations insuffisantes');
    }
  });
  it('rappel officiel (même code-barres) → déconseillé, toujours affiché', () => {
    const a = analyzeProduct(product({ recalls: [recall()] }), { kind: 'adult' }, NOW);
    expect(a.verdict).toBe('Déconseillé pour ce profil selon la source indiquée');
    expect(a.recalls).toHaveLength(1);
    const possible = analyzeProduct(product({ recalls: [recall('brand_name')] }), { kind: 'adult' }, NOW);
    expect(possible.verdict).toBe('Adapté avec précautions');
  });
  it('allergie déclarée retrouvée dans la liste, sans diagnostic', () => {
    const a = analyzeProduct(product({ ingredientsText: 'Aqua, Arachis Hypogaea Oil' }), { kind: 'child', ageMonths: 60, allergies: ['arachis'] }, NOW);
    expect(a.verdict).toBe('Déconseillé pour ce profil selon la source indiquée');
    expect(analysisText(a)).toMatch(/ne pose aucun diagnostic/);
  });
  it('âge de l’enfant inconnu → Informations insuffisantes', () => {
    expect(analyzeProduct(product(), { kind: 'baby', ageMonths: null }, NOW).verdict).toBe('Informations insuffisantes');
  });
  it('données de démonstration toujours signalées', () => {
    const a = analyzeProduct(product({ dataSource: { label: 'Démo', is_demo: true } }), { kind: 'adult' }, NOW);
    expect(a.demo).toBe(true);
    expect(a.demoLabel).toBe(DEMO_LABEL);
    expect(a.certainty).toBe('low');
  });
  it('verdicts limités aux quatre formulations prévues, jamais de promesse d’innocuité', () => {
    const cases: [Partial<ProductInput>, ScanProfile][] = [
      [{}, { kind: 'adult' }], [{ type: 'laundry', ingredientsText: null }, baby(10)], [{ type: 'perfume', ingredientsText: 'Alcohol Denat., Parfum, Citral' }, PREGNANT],
      [{ type: 'shampoo', ingredientsText: 'Aqua, Sodium Laureth Sulfate, Limonene' }, { kind: 'child', ageMonths: 48 }],
    ];
    for (const [over, p] of cases) {
      const a = analyzeProduct(product(over), p, NOW);
      expect(PRODUCT_VERDICTS).toContain(a.verdict);
      expectNoForbidden(a);
      expect(a.sources.length).toBeGreaterThan(0);
    }
  });
  it('détection : allergènes de parfum et huiles essentielles', () => {
    expect(fragranceAllergensIn('LIMONENE')).toBe('Limonene');
    expect(isEssentialOil('Prunus Amygdalus Dulcis Oil')).toBe(false);
    expect(isEssentialOil('Mentha Piperita Leaf Oil')).toBe(true);
    expect(splitIngredients('Ingrédients : Aqua, Parfum (Fragrance), Citral.')).toEqual(['Aqua', 'Parfum (Fragrance)', 'Citral']);
  });
});

// ====================================================================== aliments
describe('moteur de règles aliment', () => {
  it('aliment non confirmé ou inconnu → Impossible à confirmer', () => {
    expect(analyzeFood(food('Brie', { identity: { name: 'Brie', confirmed: false } }), PREGNANT, {}, NOW).verdict).toBe('Impossible à confirmer');
    const unknown = analyzeFood(food('Plat mystère xyz'), PREGNANT, {}, NOW);
    expect(unknown.verdict).toBe('Impossible à confirmer');
    expect(unknown.certainty).toBe('low');
  });
  it('miel avant 1 an → à éviter (Anses)', () => {
    const a = analyzeFood(food('Biscuits au miel', { ingredientsText: 'Farine de blé, sucre, miel 8 %' }), baby(8), { texture: 'smooth' }, NOW);
    expect(a.verdict).toBe('À éviter pour ce profil selon la source indiquée');
    expect(a.sources.map((s) => s.id)).toContain('anses-miel-2010');
    expect(analyzeFood(food('Miel de fleurs'), baby(14), { texture: 'smooth' }, NOW).verdict).not.toBe('À éviter pour ce profil selon la source indiquée');
  });
  it('grossesse : brie → à éviter ; comté → sous conditions', () => {
    expect(analyzeFood(food('Brie de Meaux'), PREGNANT, {}, NOW).verdict).toBe('À éviter pour ce profil selon la source indiquée');
    expect(analyzeFood(food('Comté 18 mois'), PREGNANT, {}, NOW).verdict).toBe('Adapté sous certaines conditions');
  });
  it('grossesse : la cuisson inconnue empêche de conclure, une réponse permet de conclure', () => {
    const q = foodQuestions(food('Poulet rôti'), PREGNANT);
    expect(q.map((x) => x.key)).toContain('cooking');
    expect(analyzeFood(food('Poulet rôti'), PREGNANT, {}, NOW).verdict).toBe('Impossible à confirmer');
    expect(analyzeFood(food('Poulet rôti'), PREGNANT, { cooking: 'undercooked' }, NOW).verdict).toBe('À préparer différemment');
    expect(analyzeFood(food('Poulet rôti'), PREGNANT, { cooking: 'cooked', storage: 'fridge' }, NOW).verdict).toBe('Adapté selon les informations disponibles');
  });
  it('enfant : raisins entiers → à préparer différemment ; cacahuètes entières → à éviter', () => {
    expect(analyzeFood(food('Raisins blancs'), baby(24), { cut: 'whole', texture: 'pieces' }, NOW).verdict).toBe('À préparer différemment');
    expect(analyzeFood(food('Cacahuètes grillées'), baby(30), { cut: 'whole', texture: 'whole' }, NOW).verdict).toBe('À éviter pour ce profil selon la source indiquée');
  });
  it('alcool, caféine, lait cru, sel et sucre ajoutés, édulcorants', () => {
    expect(analyzeFood(food('Vin rouge'), { kind: 'breastfeeding' }, {}, NOW).verdict).toBe('À éviter pour ce profil selon la source indiquée');
    expect(analyzeFood(food('Café expresso'), baby(20), {}, NOW).verdict).toBe('À éviter pour ce profil selon la source indiquée');
    expect(analyzeFood(food('Fromage au lait cru'), { kind: 'child', ageMonths: 40 }, {}, NOW).verdict).toBe('À éviter pour ce profil selon la source indiquée');
    const compote = analyzeFood(food('Compote', { ingredientsText: 'Pomme, sucre, sel, aspartame', catalogMatch: true }), baby(9), { texture: 'smooth' }, NOW);
    expect(compote.findings.map((f) => f.id)).toEqual(expect.arrayContaining(['c_salt', 'c_sugar', 'c_sweeteners']));
    expect(detectFacets(food('Sushi saumon')).has('raw_fish')).toBe(true);
  });
  it('allergie déclarée : à éviter, sans diagnostic', () => {
    const a = analyzeFood(food('Pâte à tartiner noisette'), { kind: 'adult' }, { allergies: ['noisette'] }, NOW);
    expect(a.verdict).toBe('À éviter pour ce profil selon la source indiquée');
    expect(analysisText(a)).toMatch(/aucun diagnostic/);
  });
  it('verdicts limités aux cinq formulations prévues, jamais de promesse d’innocuité', () => {
    const names = ['Saumon fumé', 'Jambon cuit', 'Mayonnaise', 'Thon en boîte', 'Tomates cerises', 'Pop-corn', 'Réglisse', 'Œufs', 'Huîtres', 'Graines germées'];
    for (const n of names) for (const p of [PREGNANT, baby(10), { kind: 'child', ageMonths: 40 } as ScanProfile]) {
      const a = analyzeFood(food(n), p, {}, NOW);
      expect(FOOD_VERDICTS).toContain(a.verdict);
      expectNoForbidden(a);
      expect(a.score).toBeNull();
    }
  });
});

// ====================================================================== RappelConso
describe('RappelConso : lecteur tolérant et correspondance', () => {
  const V21 = {
    total_count: 1,
    results: [{
      numero_fiche: '2026-10-0042', libelle: 'Lait corporel bébé 200 ml', marque_produit: 'Marque Test', gtin: '3017620422003 3560070000006',
      motif_rappel: 'Présence de bactéries', risques_encourus: 'Infection', conduites_a_tenir_par_le_consommateur: 'Ne plus utiliser le produit',
      lien_vers_la_fiche_rappel: 'https://rappel.conso.gouv.fr/fiche-rappel/42/Interne', date_publication: '2026-10-01T08:00:00+00:00',
      identification_produits: 'Lot 24A123 date 12/2027', categorie_produit: 'Hygiène-Beauté',
    }],
  };
  const V1 = {
    records: [{
      fields: {
        reference_fiche: '2023-05-0007', nom_de_la_marque_du_produit: 'Fromagerie Test', noms_des_modeles_ou_references: 'Brie au lait cru 1 kg',
        identification_des_produits: '3017620422003 $ Lot n° L123 $ 04/05/2023', motif_du_rappel: 'Listeria monocytogenes',
        risques_encourus_par_le_consommateur: 'Listériose', conduites_a_tenir_par_le_consommateur: 'Ne pas consommer',
        lien_vers_la_fiche_rappel: 'https://rappel.conso.gouv.fr/fiche-rappel/7/Interne', date_de_publication: '04/05/2023',
      },
    }],
  };
  it('lit le schéma v2.1 (results)', () => {
    const [r] = parseRecallRecords(V21);
    expect(r.gtins).toEqual(['3017620422003', '3560070000006']);
    expect(r.brand).toBe('Marque Test');
    expect(r.reason).toBe('Présence de bactéries');
    expect(r.published_on).toBe('2026-10-01');
    expect(r.lot_numbers).toEqual(['24A123']);
    expect(r.official_url).toMatch(/^https:/);
  });
  it('lit l’ancien schéma (records[].fields) et les GTIN cités dans l’identification', () => {
    const [r] = parseRecallRecords(V1);
    expect(r.gtins).toEqual(['3017620422003']);
    expect(r.title).toBe('Fromagerie Test — Brie au lait cru 1 kg');
    expect(r.reason).toBe('Listeria monocytogenes');
    expect(r.published_on).toBe('2023-05-04');
    expect(r.lot_numbers).toEqual(['L123']);
  });
  it('accepte un tableau brut, ignore les entrées vides', () => {
    expect(parseRecallRecords([null, {}, { libelle: 'X' }])).toHaveLength(1);
    expect(parseRecallRecords({ error: 'x' })).toEqual([]);
  });
  it('correspondance : code-barres exact, ou marque + nom (à vérifier), jamais la marque seule', () => {
    const recs = [...parseRecallRecords(V21), ...parseRecallRecords(V1)];
    expect(matchRecalls(recs, { barcode: '03017620422003' }).map((m) => m.match)).toEqual(['gtin', 'gtin']);
    expect(matchRecalls(recs, { brand: 'Marque Test', name: 'Lait corporel bébé' })[0].match).toBe('brand_name');
    expect(matchRecalls(recs, { brand: 'Marque Test', name: 'Shampooing doux' })).toEqual([]);
    expect(sameGtin('0003017620422003', '3017620422003')).toBe(true);
    expect(validGtin('3017620422003')).toBe(true);
    expect(validGtin('3017620422004')).toBe(false);
  });
  it('requête et ligne de cache', () => {
    expect(rappelConsoUrl('3017620422003')).toBe('https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso-v2-gtin-espaces/records?where=%223017620422003%22&limit=20');
    const row = recallRow(parseRecallRecords(V21)[0], '3017620422003');
    expect(row).toMatchObject({ source_key: 'rappelconso:2026-10-0042', is_demo: false, source: 'RappelConso (data.economie.gouv.fr)' });
  });
});

// ====================================================================== Open Facts
describe('Open Food / Beauty / Products Facts : normalisation', () => {
  const OFF = {
    status: 1,
    product: {
      code: '3017620422003', product_name_fr: 'Pâte à tartiner', brands: 'Marque A, Groupe B', image_front_url: 'https://images.openfoodfacts.org/x.jpg',
      ingredients_text_fr: 'Sucre, huile de palme, noisettes 13 %, lait écrémé en poudre', allergens_tags: ['en:milk', 'en:nuts'], categories_tags: ['en:spreads'],
      nutriments: { salt_100g: 0.107, sugars_100g: 56.3, 'energy-kcal_100g': 539 }, last_modified_t: 1760000000,
    },
  };
  it('fiche aliment : champs, nutrition, base collaborative', () => {
    const p = normalizeOpenFacts(OFF, 'food', '3017620422003', '2026-10-16')!;
    expect(p).toMatchObject({ name: 'Pâte à tartiner', brand: 'Marque A', allergens: ['milk', 'nuts'], kind: 'food', collaborative: true, is_demo: false, data_retrieved_at: '2026-10-16' });
    expect(p.nutrition).toEqual({ salt_g_100g: 0.11, sugars_g_100g: 56.3, energy_kcal_100g: 539 });
    expect(p.source_url).toBe('https://world.openfoodfacts.org/product/3017620422003');
    expect(p.last_modified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('fiche cosmétique : type déduit des catégories, précautions, durée après ouverture', () => {
    const p = normalizeOpenFacts({ status: 1, product: { product_name: 'Lingettes', categories_tags: ['en:baby-wipes'], ingredients_text: 'Aqua, Phenoxyethanol', warning: 'Usage externe', periods_after_opening_tags: ['en:3-months'] } }, 'beauty', '3560070000006', '2026-10-16')!;
    expect(p.kind).toBe('cosmetic');
    expect(p.product_type).toBe('wipes');
    expect(p.precautions_text).toBe('Usage externe');
    expect(p.period_after_opening).toBe('3-months');
    expect(p.nutrition).toBeNull();
    expect(guessProductType(['en:shower-gels'])).toBe('wash_gel');
    expect(guessProductType(['en:unknown'])).toBeNull();
  });
  it('produit absent → null ; recherche filtrée sur des codes valides ; URL', () => {
    expect(normalizeOpenFacts({ status: 0 }, 'food', '1', '2026-10-16')).toBeNull();
    expect(normalizeSearch({ products: [OFF.product, { code: 'abc', product_name: 'x' }] }, 'food', '2026-10-16')).toHaveLength(1);
    expect(productUrl('beauty', '123')).toMatch(/^https:\/\/world\.openbeautyfacts\.org\/api\/v2\/product\/123\.json\?fields=/);
    expect(searchUrl('products', 'lessive')).toMatch(/openproductsfacts\.org\/cgi\/search\.pl\?search_terms=lessive/);
  });
  it('fiche de la base interne → même forme', () => {
    const p = fromProductRow({ id: 'x', barcode: '0000000000017', name: 'Crème', category: 'cream', ingredients: ['Aqua', 'Parfum'], data_source: 'Base fictive', data_retrieved_at: '2026-10-15', is_demo: true });
    expect(p).toMatchObject({ ingredients_text: 'Aqua, Parfum', product_type: 'cream', kind: 'product', is_demo: true });
  });
});

// ====================================================================== explication IA
describe('explication IA : l’IA reformule, elle ne décide pas', () => {
  const analysis = analyzeProduct(product({ ingredientsText: null, ingredientsOrigin: null }), PREGNANT, NOW);
  const payload = sanitizePayload(buildExplainPayload(analysis))!;
  it('charge envoyée bornée, sans donnée nominative, sources numérotées', () => {
    expect(payload.verdict).toBe('Informations insuffisantes');
    expect(payload.sources[0].n).toBe(1);
    expect(JSON.stringify(payload)).not.toMatch(/user_id|prénom/);
    expect(sanitizePayload({ ...payload, verdict: 'Totalement sûr' })).toBeNull();
  });
  it('rejette promesse d’innocuité, autre verdict, informations manquantes ignorées, JSON invalide', () => {
    const ok = JSON.stringify({ summary: 'Informations insuffisantes : la composition manque [1].', points: ['La liste des ingrédients n’est pas disponible.'], missing: ['Liste des ingrédients'], next_step: 'Photographiez la liste.' });
    expect(checkExplanation(ok, payload).ok).toBe(true);
    const bad = (o: object) => checkExplanation(JSON.stringify({ summary: 's', points: ['p'], missing: ['m'], next_step: 'n', ...o }), payload);
    expect(bad({ summary: 'Ce produit est sans danger.' })).toEqual({ ok: false, reason: 'forbidden:sans danger' });
    expect(bad({ points: ['Adapté selon les informations disponibles'] })).toEqual({ ok: false, reason: 'other_verdict' });
    expect(checkExplanation(JSON.stringify({ summary: 'Résumé', points: ['Point'], missing: [], next_step: 'Rien' }), payload)).toEqual({ ok: false, reason: 'missing_ignored' });
    expect(checkExplanation('pas du json', payload)).toEqual({ ok: false, reason: 'invalid_json' });
  });
  it('explication des règles affichée sans IA', () => {
    const r = ruleExplanation(analysis);
    expect(r.summary).toMatch(/^Informations insuffisantes\./);
  });
});

// ====================================================================== lecture locale (ML Kit) et OCR
describe('lecture locale et texte lu', () => {
  it('sans module natif (Jest, web, Expo Go) : message clair, aucun plantage', async () => {
    expect(localTextRecognitionAvailable()).toBe(false);
    await expect(readTextFromImage('file:///x.jpg')).rejects.toBeInstanceOf(LocalRecognitionUnavailable);
    await expect(readBarcodesFromImage('file:///x.jpg')).rejects.toThrow(LOCAL_RECOGNITION_UNAVAILABLE);
    expect(LOCAL_RECOGNITION_UNAVAILABLE).toBe('Lecture locale indisponible ici : utilisez la saisie manuelle');
  });
  it('extrait la liste des ingrédients, le code imprimé et un indice de lisibilité', () => {
    const text = 'CRÈME CHANGE\nIngrédients : Aqua, Zinc Oxide,\nGlycerin, Parfum.\nÀ conserver au sec.\n3 017620 422003';
    expect(extractIngredientSection(text)).toBe('Aqua, Zinc Oxide, Glycerin, Parfum');
    expect(extractPrintedBarcode(text)).toBe('3017620422003');
    expect(estimateReadability('Aqua, Glycerin, Parfum')).toBe(0.75);
    expect(estimateReadability('')).toBe(0);
    expect(frontTextToQuery('Lingettes douces\nBébé\nIngrédients : x\n3017620422003')).toBe('Lingettes douces Bébé');
  });
});

// ====================================================================== assemblage du parcours
describe('assemblage du parcours', () => {
  const candidate = fromProductRow({ barcode: '0000000000062', name: 'Lingettes démo', category: 'wipes', ingredients_text: 'Aqua, Phenoxyethanol', data_source: 'Base fictive', data_retrieved_at: '2026-10-16', is_demo: true }) as ProductCandidate;
  it('mode démonstration : tout résultat est étiqueté « Données de démonstration »', () => {
    const subject = { candidate: null, name: 'Purée maison', brand: null, barcode: null, imageUrl: null };
    expect(subjectDataSource(subject, true)).toMatchObject({ is_demo: true, label: `Saisie par vous — ${DEMO_LABEL}` });
    expect(subjectDataSource(subject, false)).toMatchObject({ is_demo: false });
    const input = buildProductInput({ candidate, name: candidate.name, brand: null, barcode: candidate.barcode, imageUrl: null },
      { type: 'wipes', ingredientsText: candidate.ingredients_text!, ingredientsOrigin: 'database', precautionsText: '', periodAfterOpening: '', exposure: null, zone: null },
      { recalls: [], recallCheck: null, cosing: [], demoMode: false });
    const a = analyzeProduct(input, baby(4), NOW);
    expect(a.demoLabel).toBe(DEMO_LABEL);
    expect(a.verdict).toBe('Déconseillé pour ce profil selon la source indiquée');
  });
  it('Ciqual : valeurs reprises telles quelles ; table vide → aucune valeur inventée', () => {
    const row = { code: '31008', nom: 'Miel', groupe: 'produits sucrés', sous_groupe: null, nutrients: { sucres_g: 81.1, sel_g: null }, source_version: 'Ciqual 2020', source_date: '2020-07-07', is_demo: false };
    expect(nutritionFromCiqual(row)).toMatchObject({ sugars_g_100g: 81.1, salt_g_100g: null, source: 'ciqual' });
    expect(nutritionFromCiqual({ ...row, nutrients: {} })).toBeNull();
    const input = buildFoodInput({ candidate: null, name: 'Purée maison', brand: null, barcode: null, imageUrl: null }, { ingredientsText: '', ingredientsOrigin: null },
      { recalls: [], recallCheck: null, catalogMatch: false, demoMode: false });
    expect(input.nutrition).toBeNull();
  });
  it('utilitaires', () => {
    expect(ingredientNamesForCosing('Aqua, Parfum (Fragrance), Citral*')).toEqual(['Aqua', 'Parfum', 'Citral']);
    expect(parseAllergies('arachide, lait ; ; x')).toEqual(['arachide', 'lait']);
    expect(catalogMatches('Avocat', [{ name: 'Avocat' }])).toBe(true);
    expect(catalogMatches('avocat bio', [{ name: 'Avocat' }])).toBe(false);
  });
});

// ====================================================================== moteur local (démonstration)
describe('moteur local : scanner', () => {
  const db = createDemoBackend();
  let scanId = '';

  it('connexion', async () => {
    await db.auth.signUp('scan@exemple.test', 'MotDePasse!2026');
  });

  it('recherche par code-barres : fiche fictive étiquetée, rappels, RappelConso non interrogé', async () => {
    const r = await db.invoke<LookupResponse>('product-lookup', { barcode: '0000000000062', kind: 'product' });
    expect(r.found).toBe(true);
    expect(r.database).toBe('demo');
    expect(r.product).toMatchObject({ name: 'Lingettes parfumées démo', is_demo: true, product_type: 'wipes' });
    expect(r.recalls[0]).toMatchObject({ is_demo: true, match: 'gtin' });
    expect(r.recall_check).toMatchObject({ checked: false });
    expect(r.recall_check?.error).toMatch(/démonstration/);
    const missing = await db.invoke<LookupResponse>('product-lookup', { barcode: '3017620422003' });
    expect(missing.found).toBe(false);
  });

  it('recherche par nom et vérification des rappels', async () => {
    const s = await db.invoke<SearchResponse>('product-lookup', { action: 'search', query: 'lessive', kind: 'product' });
    expect(s.candidates.map((c) => c.name)).toEqual(['Lessive douce démo']);
    const rc = await db.invoke<Pick<LookupResponse, 'recalls'>>('product-lookup', { action: 'recalls', brand: 'Marque Démo', name: 'Lingettes parfumées démo' });
    expect(rc.recalls).toHaveLength(1);
    const cos = await db.rpc<unknown[]>('cosing_lookup', { p_names: ['aqua', 'PHENOXYETHANOL', 'inconnu'] });
    expect(cos).toHaveLength(2);
  });

  it('explication IA : « non configurée » en démonstration (aucun faux texte IA)', async () => {
    const a = analyzeProduct(product(), { kind: 'adult' }, NOW);
    const r = await db.invoke<ExplainResponse>('scan-explain', buildExplainPayload(a));
    expect(r.ai).toBe('not_configured');
    await expect(db.invoke('scan-explain', { kind: 'product', verdict: 'Sans danger' })).rejects.toThrow(/invalide/);
  });

  it('enregistrement : quota, verdict contrôlé, rappel → notification unique vers la fiche', async () => {
    const me = (await db.auth.getSession())!.userId;
    const [scan] = await db.insert<ScanRow>('product_scans', {
      user_id: me, kind: 'product', method: 'barcode', barcode: '0000000000062', product_snapshot: { name: 'Lingettes parfumées démo' },
      verdict: 'Déconseillé pour ce profil selon la source indiquée', certainty: 'low', sources: ['ansm-phenoxy-2019'], is_demo: true, analysed_at: new Date().toISOString(),
    });
    scanId = scan.id;
    await db.insert('scan_results', { user_id: me, scan_id: scan.id, engine_version: 'x', result: { verdict: scan.verdict } });
    expect((await db.rpc<{ used: number }[]>('scan_quota_status'))[0].used).toBe(1);
    const notes = await db.select<{ category: string; deep_link: string }>({ table: 'notifications', filters: [eq('category', 'product_recall')] });
    expect(notes).toHaveLength(1);
    expect(notes[0].deep_link).toBe(`/scanner/result/${scan.id}`);
    await db.invoke('product-lookup', { action: 'recall_watch' });
    expect(await db.select({ table: 'notifications', filters: [eq('category', 'product_recall')] })).toHaveLength(1);
    await expect(db.insert('product_scans', { kind: 'food', method: 'manual', verdict: 'Adapté avec précautions', analysed_at: new Date().toISOString() })).rejects.toThrow(/Verdict/);
    await expect(db.update('product_scans', { verdict: 'Adapté avec précautions' }, [eq('id', scan.id)])).rejects.toThrow();
    await db.update('scan_results', { explanation: { ai: 'not_configured' } }, [eq('scan_id', scan.id)]);
    await expect(db.update('scan_results', { result: {} }, [eq('scan_id', scan.id)])).rejects.toThrow();
  });

  it('favoris et suppression (résultats et favoris supprimés avec le scan, quota inchangé)', async () => {
    await db.insert('scan_favorites', { scan_id: scanId });
    await expect(db.insert('scan_favorites', { scan_id: 'inconnu' })).rejects.toThrow();
    expect(await db.select({ table: 'scan_favorites' })).toHaveLength(1);
    await db.remove('product_scans', [eq('id', scanId)]);
    expect(await db.select<ScanResultRow>({ table: 'scan_results' })).toHaveLength(0);
    expect(await db.select({ table: 'scan_favorites' })).toHaveLength(0);
    expect((await db.rpc<{ used: number }[]>('scan_quota_status'))[0].used).toBe(1);
  });

  it('quota gratuit atteint : l’analyse est refusée, les rappels restent accessibles', async () => {
    const me = (await db.auth.getSession())!.userId;
    const row = () => ({ user_id: me, kind: 'food', method: 'manual', product_snapshot: { name: 'x' }, verdict: 'Impossible à confirmer', certainty: 'low', analysed_at: new Date().toISOString() });
    for (let i = 1; i < 10; i++) await db.insert('product_scans', row());
    await expect(db.insert('product_scans', row())).rejects.toMatchObject({ isPremiumRequired: true });
    const r = await db.invoke<LookupResponse>('product-lookup', { barcode: '0000000000062' });
    expect(r.recalls.length).toBeGreaterThan(0);
  });
});
