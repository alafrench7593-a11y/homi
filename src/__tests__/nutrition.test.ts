/**
 * Nutrition 0–10 ans, catalogue de produits, sources : score éditorial, brouillons IA, import, critères produits,
 * prix Open Prices (normalisation), rubrique « Sources et lectures », registre d'outils.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { ALL_RECIPES } from '@/content/recipes';
import { EXTERNAL_RESOURCES, RESOURCE_KINDS } from '@/content/resources';
import { LIBRARY_SOURCES } from '@/content/articles/library';
import { meetsNeed, NEEDS, visibleRecipes } from '@/lib/data/hooks-recipes';
import { resourceAgeLabel, resourceErrors, resourceFitsAge } from '@/lib/data/hooks-resources';
import { productCriteria } from '@/lib/domain/productCriteria';
import { checkDraft, parseCsv, readBatch, type RecipeDraft } from '@/lib/recipes/draft';
import { NUTRITION } from '@/lib/recipes/nutrition-data';
import { INGREDIENTS } from '@/lib/recipes/ingredients';
import { bandFor, costPerPortion, scoreRecipe } from '@/lib/recipes/score';
import { RECIPE_SOURCES } from '@/lib/recipes/sources';
import { MEALS, type Recipe } from '@/lib/recipes/types';
import { TOOLS } from '@/lib/journeys/tools';
import { createDemoBackend } from '@/lib/backend/demo';
import { normalizePrices, parseQuantity, pricesUrl, unitPrice } from '../../supabase/functions/_shared/open-prices';

const base = ALL_RECIPES.find((r) => r.audiences.includes('child'))!;
const withIngredients = (ingredients: Recipe['ingredients']): Recipe => ({ ...base, ingredients });

describe('bibliothèque de recettes 0–10 ans', () => {
  it('ancien catalogue supprimé : 151 recettes, sans doublon', () => {
    expect(ALL_RECIPES.length).toBe(151);
    expect(new Set(ALL_RECIPES.map((r) => r.slug)).size).toBe(ALL_RECIPES.length);
  });
  it('chaque recette est « À vérifier », avec ingrédients, quantités, étapes, temps, allergènes, sources et congélation', () => {
    for (const r of ALL_RECIPES) {
      expect(r.status).toBe('to_review');
      expect(r.ingredients.length).toBeGreaterThan(0);
      expect(r.steps.length).toBeGreaterThan(0);
      expect(r.prepMin + r.cookMin).toBeGreaterThan(0);
      expect(Array.isArray(r.allergens)).toBe(true);
      expect(r.sources.length).toBeGreaterThan(0);
      for (const s of r.sources) expect(RECIPE_SOURCES[s]).toBeDefined();
      expect(r.maxMonths == null || r.maxMonths <= 120 || r.audiences.includes('family')).toBe(true);
    }
  });
  it('tous les repas sont couverts, dessert compris', () => {
    for (const m of MEALS) expect(ALL_RECIPES.filter((r) => r.meals.includes(m)).length).toBeGreaterThan(m === 'breakfast' ? 0 : 5);
  });
  it('chaque ingrédient du dictionnaire a une composition nutritionnelle (CALNUT)', () => {
    for (const k of Object.keys(INGREDIENTS)) expect(NUTRITION[k]).toBeDefined();
  });
  it('les brouillons IA sont invisibles des parents, visibles de l’équipe ; une recette personnelle reste visible', () => {
    const list = [{ status: 'ai_draft' as const }, { status: 'validated' as const }, { status: 'retired' as const }, { status: 'ai_draft' as const, personal: true }];
    expect(visibleRecipes(list)).toEqual([{ status: 'validated' }, { status: 'ai_draft', personal: true }]);
    expect(visibleRecipes(list, { includeDrafts: true })).toHaveLength(3);
    expect(visibleRecipes(list, { includeDrafts: true, includeRetired: true })).toHaveLength(4);
  });
});

describe('score nutritionnel éditorial (sur 100)', () => {
  it('tranches d’âge', () => {
    expect(bandFor(7)).toBe('m6_11');
    expect(bandFor(20)).toBe('y1_3');
    expect(bandFor(50)).toBe('y4_6');
    expect(bandFor(100)).toBe('y7_10');
  });
  it('toutes les recettes ont un score entier entre 0 et 100, avec détail et nutriments par portion', () => {
    for (const r of ALL_RECIPES) {
      const s = scoreRecipe(r);
      expect(Number.isInteger(s.score)).toBe(true);
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
      expect(s.parts.length).toBeGreaterThan(0);
      expect(s.portion.grams).toBeGreaterThan(0);
    }
  });
  it('le sucre et le sel ajoutés font baisser le score ; les légumes le font monter', () => {
    const veg = scoreRecipe(withIngredients([{ key: 'carrot', qty: 300, unit: 'g' }, { key: 'butternut', qty: 300, unit: 'g' }]), 'y4_6').score;
    const sweet = scoreRecipe(withIngredients([{ key: 'carrot', qty: 300, unit: 'g' }, { key: 'butternut', qty: 300, unit: 'g' }, { key: 'sugar', qty: 120, unit: 'g' }]), 'y4_6').score;
    const salty = scoreRecipe(withIngredients([{ key: 'carrot', qty: 300, unit: 'g' }, { key: 'butternut', qty: 300, unit: 'g' }, { key: 'salt', qty: 15, unit: 'g' }]), 'y4_6').score;
    expect(sweet).toBeLessThan(veg);
    expect(salty).toBeLessThan(veg);
  });
  it('coût par portion : jamais inventé (null sans prix vérifié)', () => {
    const r = withIngredients([{ key: 'carrot', qty: 500, unit: 'g' }]);
    expect(costPerPortion(r, {}).cost).toBeNull();
    expect(costPerPortion(r, {}).missing).toEqual(['carrot']);
    const c = costPerPortion({ ...r, servings: 4 }, { carrot: { key: 'carrot', pricePerKg: 2, source: 'test', checkedOn: '2026-10-01' } });
    expect(c.cost).toBeCloseTo(0.25, 2);
    expect(c.oldest).toBe('2026-10-01');
  });
  it('besoins alimentaires : sans lait, sans gluten…', () => {
    const r = { ...base, allergens: ['milk'] } as Recipe;
    expect(meetsNeed(r, undefined, 'no_milk')).toBe(false);
    expect(meetsNeed(r, undefined, 'no_gluten')).toBe(true);
    expect(NEEDS).toContain('iron');
  });
});

describe('import de brouillons (JSON / CSV)', () => {
  const draft: RecipeDraft = {
    slug: 'test-puree-carotte', title: 'Purée test de carottes', summary: 'Une purée simple pour tester l’import.', audiences: ['baby'], meals: ['lunch'], minMonths: 6, maxMonths: 12,
    textures: ['smooth'], servings: 2, prepMin: 10, cookMin: 15, ingredients: [['carrot', 200, 'g']], steps: ['Éplucher et couper les carottes.', 'Cuire à la vapeur 15 minutes puis mixer finement.'],
    allergens: [], tags: [], adaptations: [], storage: 'Au réfrigérateur 24 heures maximum, dans une boîte fermée.', precautions: ['Vérifier la température avant de servir.'],
    nutrition: 'Légume riche en fibres.', budget: 1, seasons: 'all', temperature: 'hot', sources: ['spf_diversification', 'anses_miel', 'inspq_etouffement'],
  };
  it('JSON : objet unique ou liste', () => {
    expect(readBatch(JSON.stringify(draft), 'json')).toHaveLength(1);
    expect(readBatch(JSON.stringify([draft, draft]), 'json')).toHaveLength(2);
    expect(() => readBatch('{pas du json', 'json')).toThrow();
  });
  it('les contrôles refusent un ingrédient hors dictionnaire, une source inconnue ou un âge au-delà de 10 ans', () => {
    const o = { by: 'test', on: '2026-10-20' };
    expect(checkDraft({ ...draft, ingredients: [['licorne', 1, 'u']] }, o).errors.join()).toMatch(/hors dictionnaire/);
    expect(checkDraft({ ...draft, sources: ['inconnue'] }, o).errors.join()).toMatch(/source inconnue/);
    expect(checkDraft({ ...draft, audiences: ['child'], minMonths: 36, maxMonths: 144 }, o).errors.join()).toMatch(/10 ans/);
  });
  it('CSV : listes « | », ingrédients « clé:quantité:unité »', () => {
    const csv = 'slug;title;meals;ingredients;seasons;budget\ntest-csv;Test CSV;lunch|dinner;carrot:200:g|butter:10:g;all;1';
    const [d] = parseCsv(csv);
    expect(d.meals).toEqual(['lunch', 'dinner']);
    expect(d.ingredients).toEqual([['carrot', 200, 'g', undefined], ['butter', 10, 'g', undefined]]);
    expect(d.seasons).toBe('all');
  });
});

describe('catalogue de produits : critères objectifs', () => {
  it('composition inconnue : pas de note', () => {
    expect(productCriteria({ category: 'wash', composition: null }).score).toBeNull();
  });
  it('parfum, huiles essentielles, phénoxyéthanol : points retirés et signalés', () => {
    const clean = productCriteria({ category: 'wash', composition: 'Aqua, Glycerin, Coco-Glucoside' });
    const loaded = productCriteria({ category: 'wash', composition: 'Aqua, Parfum, Lavandula Angustifolia Oil, Phenoxyethanol, Linalool' });
    expect(clean.score).toBe(100);
    expect(loaded.score!).toBeLessThan(clean.score!);
    expect(loaded.flags.perfume).toBe(true);
    expect(loaded.flags.essentialOils.length).toBeGreaterThan(0);
    expect(loaded.flags.phenoxyethanol).toBe(true);
    expect(loaded.flags.allergens.length).toBeGreaterThan(0);
  });
  it('alimentation infantile : sucre, sel, édulcorants', () => {
    expect(productCriteria({ category: 'food', composition: 'Pomme, poire', nutrition: { sugars_g_100g: 3, salt_g_100g: 0.01 } }).score).toBe(100);
    expect(productCriteria({ category: 'food', composition: 'Pomme, sucralose', nutrition: { sugars_g_100g: 20, salt_g_100g: 2 } }).score).toBe(20);
  });
  it('accessoire : pas de note', () => {
    expect(productCriteria({ category: 'accessory', composition: 'Silicone' }).score).toBeNull();
  });
});

describe('prix Open Prices (normalisation, sans appel réseau)', () => {
  it('adresse de l’API : code-barres ou catégorie, sinon rien', () => {
    expect(pricesUrl({ barcode: '3017620422003' })).toBe('https://prices.openfoodfacts.org/api/v1/prices?currency=EUR&order_by=-date&size=20&product_code=3017620422003');
    expect(pricesUrl({ barcode: 'abc' })).toBeNull();
  });
  it('garde seulement les prix en euros, positifs, datés et jamais dans le futur', () => {
    const json = { items: [
      { id: 1, price: 4.5, currency: 'EUR', date: '2026-09-01', location: { type: 'OSM', osm_name: 'Pharmacie du Centre', osm_address_city: 'Lyon' } },
      { id: 2, price: 3, currency: 'USD', date: '2026-09-01' },
      { id: 3, price: 0, currency: 'EUR', date: '2026-09-01' },
      { id: 4, price: 2, currency: 'EUR', date: '2027-01-01' },
      { id: 5, price: 6.2, currency: 'EUR', date: '2026-08-15', location: { type: 'ONLINE', website_url: 'https://www.exemple-boutique.fr' } },
    ] };
    const out = normalizePrices(json, '2026-10-20');
    expect(out.map((p) => p.id)).toEqual(['1', '5']);
    expect(out[0]).toMatchObject({ store_name: 'Pharmacie du Centre', store_city: 'Lyon', online: false, source_url: 'https://prices.openfoodfacts.org/prices/1' });
    expect(out[1]).toMatchObject({ store_name: 'exemple-boutique.fr', online: true });
    expect(normalizePrices({}, '2026-10-20')).toEqual([]);
  });
  it('contenance et prix au litre / au kilo', () => {
    expect(parseQuantity('500 ml')).toEqual({ value: 500, unit: 'ml' });
    expect(parseQuantity('2 x 75 g')).toEqual({ value: 150, unit: 'g' });
    expect(parseQuantity('1 L')).toEqual({ value: 1000, unit: 'ml' });
    expect(parseQuantity('52 couches')).toEqual({ value: 52, unit: 'u' });
    expect(parseQuantity(null)).toEqual({ value: null, unit: null });
    expect(unitPrice(5, { value: 500, unit: 'ml' })).toEqual({ value: 10, per: 'l' });
    expect(unitPrice(5, { value: null, unit: null })).toBeNull();
  });
});

describe('sources et lectures', () => {
  it('chaque ressource vient d’une page réellement consultée, avec résumé court et lien https', () => {
    const known = new Set([...Object.values(LIBRARY_SOURCES).map((s) => s.url), ...Object.values(RECIPE_SOURCES).map((s) => s.url), 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223', 'https://ciqual.anses.fr/', 'https://www.anses.fr/fr/content/les-references-nutritionnelles-en-vitamines-et-mineraux']);
    expect(new Set(EXTERNAL_RESOURCES.map((r) => r.slug)).size).toBe(EXTERNAL_RESOURCES.length);
    for (const r of EXTERNAL_RESOURCES) {
      expect(resourceErrors(r, '2026-10-20')).toEqual([]);
      expect(known.has(r.url)).toBe(true);
      expect(RESOURCE_KINDS).toContain(r.kind);
    }
  });
  it('contrôles de saisie', () => {
    expect(resourceErrors({ slug: 'X y', title: 'ab', publisher: '', description: 'x'.repeat(401), url: 'http://a.fr', consulted_on: '2030-01-01' }, '2026-10-20'))
      .toEqual(['slug', 'title', 'publisher', 'description', 'url', 'consulted_on']);
  });
  it('filtre par âge et libellé', () => {
    expect(resourceFitsAge({ min_age_months: 0, max_age_months: 12 }, 36, 120)).toBe(false);
    expect(resourceFitsAge({ min_age_months: null, max_age_months: null }, 36, 120)).toBe(true);
    expect(resourceAgeLabel({ min_age_months: 0, max_age_months: 12 })).toBe('de 0 mois à 12 mois');
    expect(resourceAgeLabel({ min_age_months: 36, max_age_months: 72 })).toBe('de 3 ans à 6 ans');
    expect(resourceAgeLabel({ min_age_months: null, max_age_months: null })).toBe('tous âges');
  });
  it('mode démonstration : les ressources sont chargées et un lien non https est refusé', async () => {
    const db = createDemoBackend();
    await db.auth.signUp('sources@exemple.test', 'MotDePasse!2026');
    const rows = await db.select<{ slug: string; status: string }>({ table: 'external_resources' });
    expect(rows.length).toBe(EXTERNAL_RESOURCES.length);
    expect(rows.every((r) => r.status === 'published')).toBe(true);
    await expect(db.insert('external_resources', { slug: 'x-test', kind: 'institution', title: 'Test', publisher: 'Test', description: 'Test', url: 'http://exemple.fr', consulted_on: '2026-10-20' })).rejects.toThrow(/https/);
  });
});

describe('navigation', () => {
  it('les outils Produits, Sources et Classements sont déclarés', () => {
    const ids = TOOLS.map((t) => t.id);
    for (const id of ['kid_products', 'sources', 'meal_rankings']) expect(ids).toContain(id);
    expect(TOOLS.find((t) => t.id === 'kid_products')!.href({ scope: 'baby' })).toBe('/products');
  });
});
