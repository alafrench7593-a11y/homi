/**
 * « Repas et recettes » : contrôles de qualité de la bibliothèque, puis les 12 scénarios demandés
 * (menu et recette grossesse, purée vers 6 mois, texture selon l'étape, repas d'un enfant de 5 ans, allergène déclaré,
 * menu végétarien, liste de courses, famille avec plusieurs enfants, photo et licence, recette depuis un produit scanné,
 * aucune recette inadaptée à l'accueil).
 */
import { ALL_RECIPES } from '@/content/recipes';
import { recipeToRows, rowsToRecipes } from '@/lib/recipes/db';
import {
  adaptationFor, compatible, cookWithWhatIHave, filterRecipes, generateMenu, incompatibility, moveSlot, recipeOfDay, replaceSlot, scannedProductAdvice, shoppingList,
  stageFor, textureForStage, type FoodProfile, type MenuOptions,
} from '@/lib/recipes/engine';
import { INGREDIENTS } from '@/lib/recipes/ingredients';
import { RECIPE_SOURCES } from '@/lib/recipes/sources';
import type { Recipe } from '@/lib/recipes/types';
import { derivedAllergens, findDuplicates, isVegetarian, validateRecipe } from '@/lib/recipes/validate';
import { AI_PHOTOS } from '@/lib/recipes/photoCredits';

const all = ALL_RECIPES;
const byId = new Map(all.map((r) => [r.id, r]));
const pregnant: FoodProfile = { audience: 'pregnancy', trimester: 2 };
const baby6: FoodProfile = { audience: 'baby', name: 'Lina', ageMonths: 6 };
const child5: FoodProfile = { audience: 'child', name: 'Noé', ageMonths: 60 };
const opts = (o: Partial<MenuOptions> = {}): MenuOptions => ({ days: 7, meals: ['lunch', 'dinner'], servings: 2, seed: 3, ...o });
const clone = (r: Recipe): Recipe => JSON.parse(JSON.stringify(r));

describe('bibliothèque : contrôles avant publication', () => {
  it('compte réel et répartition', () => {
    // nouveau catalogue (150 recettes) + la purée carotte et pomme de terre conservée pour sa photo
    expect(all.length).toBe(151);
    expect(all.filter((r) => r.tags.includes('classic')).length).toBeGreaterThanOrEqual(80);
    for (const r of all) expect(r.freezing && r.freezing.length > 10).toBe(true);
    expect(all.filter((r) => r.audiences.includes('pregnancy')).length).toBeGreaterThanOrEqual(20);
    expect(all.filter((r) => r.audiences.includes('baby')).length).toBeGreaterThanOrEqual(20);
    expect(all.filter((r) => r.audiences.includes('child')).length).toBeGreaterThanOrEqual(20);
  });
  it('chaque recette passe les contrôles automatiques, sans doublon', () => {
    const errors = Object.fromEntries(all.map((r) => [r.slug, validateRecipe(r)]).filter(([, e]) => e.length));
    expect(errors).toEqual({});
    expect(findDuplicates(all)).toEqual([]);
    expect(new Set(all.map((r) => r.slug)).size).toBe(all.length);
  });
  it('aucune recette rédigée par l’IA n’est présentée comme relue ou validée', () => {
    for (const r of all) {
      expect(['ai_draft', 'to_review']).toContain(r.status);
      expect(r.statusHistory[0].by).toMatch(/IA/);
    }
  });
  it('les sources existent et sont datées', () => {
    for (const r of all) for (const s of r.sources) { expect(RECIPE_SOURCES[s]).toBeDefined(); expect(RECIPE_SOURCES[s].consulted).toMatch(/^\d{4}-\d{2}-\d{2}$/); }
  });
  it('le contrôle détecte les erreurs volontaires', () => {
    const r = clone(all.find((x) => x.audiences.includes('pregnancy') && x.allergens.length > 0 && x.ingredients.some((i) => INGREDIENTS[i.key].mustCook))!);
    // quantité manquante
    expect(validateRecipe({ ...r, ingredients: r.ingredients.map((x, n) => (n === 0 ? { ...x, qty: null } : x)) }).join()).toMatch(/quantité manquante/);
    // ingrédient jamais utilisé dans les étapes
    expect(validateRecipe({ ...r, ingredients: [...r.ingredients, { key: 'saffron' in INGREDIENTS ? 'saffron' : 'banana', qty: 1, unit: 'u' }] }).join()).toMatch(/absent des étapes/);
    // allergène oublié
    expect(validateRecipe({ ...r, allergens: [] }).length).toBeGreaterThan(0);
    // temps incohérent
    expect(validateRecipe({ ...r, cookMin: 1, steps: [...r.steps, 'Laissez cuire 90 minutes.'] }).length).toBeGreaterThan(0);
    // ingrédient à éviter pendant la grossesse
    const avoid = Object.keys(INGREDIENTS).find((k) => INGREDIENTS[k].pregnancyAvoid);
    if (avoid) expect(validateRecipe({ ...r, ingredients: [...r.ingredients, { key: avoid, qty: 10, unit: 'g' }] }).join()).toMatch(/grossesse|absent/);
    // promesse de santé
    expect(validateRecipe({ ...r, nutrition: 'Garantit un bébé en bonne santé.' }).length).toBeGreaterThan(0);
    // bébé : miel avant 1 an, sel ajouté
    const b = clone(all.find((x) => x.audiences.includes('baby') && (x.minMonths ?? 0) < 12)!);
    expect(validateRecipe({ ...b, ingredients: [...b.ingredients, { key: 'honey', qty: 5, unit: 'g' }], steps: [...b.steps, 'Ajoutez le miel.'] }).length).toBeGreaterThan(0);
    // doublon
    expect(findDuplicates([...all, { ...clone(all[0]), id: 'rcp-copie', slug: 'copie' }]).length).toBeGreaterThan(0);
  });
  it('aller-retour base de données sans perte', () => {
    const r = all[5];
    const rows = recipeToRows(r, 'id-1');
    const back = rowsToRecipes([rows.recipe], rows.ingredients, rows.steps, [rows.photo], rows.links, rows.reviews)[0];
    expect(back.title).toBe(r.title); expect(back.ingredients).toEqual(r.ingredients); expect(back.steps).toEqual(r.steps);
    expect(back.allergens).toEqual(r.allergens); expect(back.photo.license).toBe(r.photo.license); expect(back.status).toBe(r.status);
  });
});

describe('les 12 scénarios', () => {
  it('1. menu grossesse : 7 jours, seulement des recettes de grossesse, sans aliment à éviter', () => {
    const m = generateMenu(all, pregnant, opts());
    expect(m.length).toBe(14);
    for (const s of m) {
      const r = byId.get(s.recipeId)!;
      expect(r.audiences).toContain('pregnancy');
      expect(r.ingredients.every((x) => !INGREDIENTS[x.key].pregnancyAvoid)).toBe(true);
    }
    // pas deux fois la même recette sur 3 jours
    for (const s of m) expect(m.filter((o) => o.recipeId === s.recipeId && o !== s && Math.abs(o.day - s.day) < 3).length).toBe(0);
    // le trimestre change les priorités sans exclure de recette
    expect(generateMenu(all, { ...pregnant, trimester: 1 }, opts()).map((s) => s.recipeId)).not.toEqual(m.map((s) => s.recipeId));
  });
  it('2. recette grossesse : précautions, cuisson à cœur, sources listériose et toxoplasmose, aucune promesse', () => {
    const list = all.filter((r) => r.audiences.includes('pregnancy'));
    for (const r of list) {
      expect(r.precautions.length).toBeGreaterThan(0);
      if (r.ingredients.some((x) => INGREDIENTS[x.key].mustCook)) expect(r.steps.join(' ')).toMatch(/cœur|cuit|cuire|cuisson|enfourn|grill|mijot/i);
      expect(r.sources.some((s) => /listeria|toxo/.test(s))).toBe(true);
      expect(`${r.nutrition} ${r.summary}`).not.toMatch(/garanti|guérit|traite|bébé en (bonne )?santé|intelligen/i);
      expect(r.verifiedOn).toBeTruthy();
    }
  });
  it('3. purée pour un bébé de 6 mois environ : lisse ou écrasée, sans sel ni sucre ajouté, sans miel', () => {
    const list = filterRecipes(all, baby6, { tag: 'puree' });
    expect(list.length).toBeGreaterThan(2);
    for (const r of list) {
      expect(r.textures.some((t) => t === 'smooth' || t === 'mashed')).toBe(true);
      expect(r.ingredients.some((x) => x.key === 'honey' || x.key === 'salt' || x.key === 'sugar')).toBe(false);
      expect(r.sources).toContain('spf_diversification');
    }
  });
  it('4. la texture suit l’étape, et la texture déclarée prime sur l’âge', () => {
    expect([4, 7, 10, 14, 20, 30].map((m) => textureForStage(stageFor(m)))).toEqual(['smooth', 'mashed', 'ground', 'pieces', 'regular', 'regular']);
    const at7 = filterRecipes(all, { audience: 'baby', ageMonths: 7 });
    const at10 = filterRecipes(all, { audience: 'baby', ageMonths: 10 });
    expect(at10.some((r) => r.textures.includes('ground') && !at7.includes(r))).toBe(true);
    expect(at7.every((r) => r.textures.some((t) => ['smooth', 'mashed'].includes(t)))).toBe(true);
    // un bébé de 10 mois encore aux textures lisses : pas de morceaux
    const smoothOnly = filterRecipes(all, { audience: 'baby', ageMonths: 10, texture: 'smooth' });
    expect(smoothOnly.every((r) => r.textures.includes('smooth'))).toBe(true);
    // un bébé ne reçoit jamais une recette prévue pour un enfant de 5 ans
    expect(filterRecipes(all, baby6).every((r) => r.audiences.includes('baby'))).toBe(true);
  });
  it('5. repas pour un enfant de 5 ans : recettes enfant adaptées à l’âge, aucun jugement « bon / mauvais »', () => {
    const list = filterRecipes(all, child5, { meal: 'dinner' });
    expect(list.length).toBeGreaterThan(3);
    for (const r of filterRecipes(all, child5)) {
      expect(r.audiences).toContain('child');
      expect(`${r.title} ${r.summary} ${r.nutrition}`).not.toMatch(/\b(bon|mauvais) (aliment|pour)|malbouffe|interdit/i);
    }
  });
  it('6. allergène déclaré : jamais proposé, et l’avis du professionnel bloque tout nouvel allergène', () => {
    const noMilk = { ...child5, allergies: ['milk' as const] };
    expect(filterRecipes(all, noMilk).some((r) => r.allergens.includes('milk'))).toBe(false);
    const withMilk = all.find((r) => r.audiences.includes('child') && r.allergens.includes('milk'))!;
    expect(incompatibility(withMilk, noMilk).join()).toMatch(/allergène déclaré/);
    const cautious: FoodProfile = { ...baby6, ageMonths: 8, introduced: ['carrot', 'zucchini', 'potato'], allergenAdviceNeeded: true };
    for (const r of filterRecipes(all, cautious)) expect(derivedAllergens(r).every((a) => r.ingredients.filter((x) => (INGREDIENTS[x.key].allergens ?? []).includes(a)).every((x) => cautious.introduced!.includes(x.key)))).toBe(true);
    // allergènes déclarés = allergènes déduits des ingrédients
    for (const r of all) expect([...r.allergens].sort()).toEqual([...derivedAllergens(r)].sort());
  });
  it('7. menu végétarien : aucune viande ni poisson', () => {
    const m = generateMenu(all, { ...pregnant, vegetarian: true }, opts());
    expect(m.length).toBeGreaterThan(0);
    expect(m.every((s) => isVegetarian(byId.get(s.recipeId)!))).toBe(true);
    expect(filterRecipes(all, child5, { vegetarian: true }).every(isVegetarian)).toBe(true);
  });
  it('8. liste de courses : quantités additionnées, rangées par rayon, « déjà à la maison »', () => {
    const r = all.find((x) => x.audiences.includes('family') && x.ingredients.length >= 4)!;
    const menu = [{ day: 0, meal: r.meals[0], recipeId: r.id, servings: r.servings }, { day: 2, meal: r.meals[0], recipeId: r.id, servings: r.servings }];
    const first = r.ingredients.find((x) => !x.optional && x.qty != null)!;
    const lines = shoppingList(all, menu, [first.key]);
    const line = lines.find((l) => l.key === first.key)!;
    expect(line.qty).toBeCloseTo(first.qty! * 2, 1);
    expect(line.atHome).toBe(true);
    expect(lines.filter((l) => l.key === first.key && l.unit === first.unit).length).toBe(1);
    const order = ['fruits_legumes', 'boucherie', 'poissonnerie', 'cremerie', 'frais', 'boulangerie', 'epicerie', 'surgeles'];
    expect(lines.map((l) => order.indexOf(l.aisle))).toEqual([...lines.map((l) => order.indexOf(l.aisle))].sort((x, y) => x - y));
    // doubler les portions double les quantités
    const doubled = shoppingList(all, [{ ...menu[0], servings: r.servings * 2 }]).find((l) => l.key === first.key)!;
    expect(doubled.qty).toBeCloseTo(first.qty! * 2, 1);
  });
  it('9. famille avec plusieurs enfants : repas communs avec une adaptation pour chacun', () => {
    const kids: FoodProfile[] = [{ audience: 'baby', name: 'Lina', ageMonths: 10 }, { audience: 'child', name: 'Noé', ageMonths: 60, allergies: ['eggs'] }];
    const m = generateMenu(all, { audience: 'family' }, opts({ members: kids, servings: 4 }));
    expect(m.length).toBeGreaterThan(0);
    for (const s of m) {
      const r = byId.get(s.recipeId)!;
      expect(r.audiences).toContain('family');
      expect(r.allergens).not.toContain('eggs'); // l'allergie de Noé exclut le plat pour tout le monde
      for (const k of kids) expect(compatible(r, k) || adaptationFor(r, k) != null).toBe(true);
    }
    expect(m.some((s) => /Lina/.test(s.note ?? ''))).toBe(true);
    // remplacer et déplacer
    const replaced = replaceSlot(all, { audience: 'family' }, m, 0, opts({ members: kids, servings: 4 }));
    expect(replaced[0].recipeId).not.toBe(m[0].recipeId);
    const moved = moveSlot(m, 0, { day: 1, meal: 'lunch' });
    expect(moved[0]).toMatchObject({ day: 1, meal: 'lunch' });
  });
  it('10. image et licence : illustration générée et déclarée comme telle, droits enregistrés', () => {
    for (const r of all) {
      expect(r.photo.generated).toBe(true);
      expect(r.photo.kind).toBe('generated');
      expect(r.photo.license).toBeTruthy(); expect(r.photo.rights).toBeTruthy(); expect(r.photo.author).toBeTruthy(); expect(r.photo.source).toBeTruthy();
      expect(r.photo.alt).toContain(r.title);
      if (!AI_PHOTOS[r.slug]) expect(r.photo.alt).toMatch(/pas une photographie/);
    }
  });
  it('11. recette proposée depuis un produit scanné, avec précautions', () => {
    const lentils = scannedProductAdvice('Lentilles corail bio 500 g', pregnant, all);
    expect(lentils.keys).toContain('red_lentils');
    expect(lentils.recipes.length).toBeGreaterThan(0);
    expect(lentils.recipes.every((r) => r.audiences.includes('pregnancy'))).toBe(true);
    expect(scannedProductAdvice('Camembert au lait cru', pregnant, all).precautions.length).toBeGreaterThan(0);
    expect(scannedProductAdvice('Saumon fumé', pregnant, all).suitable).toBe(false);
    expect(scannedProductAdvice('Miel de fleurs', { audience: 'baby', ageMonths: 8 }, all).suitable).toBe(false);
    expect(scannedProductAdvice('Miel de fleurs', pregnant, all).suitable).toBe(true);
    // « Que puis-je cuisiner avec ce que j'ai ? »
    const target = filterRecipes(all, child5).find((r) => r.ingredients.filter((x) => !x.optional).length >= 3)!;
    const have = target.ingredients.filter((x) => !x.optional).map((x) => x.key).slice(1);
    const res = cookWithWhatIHave(all, child5, have);
    expect(res.map((x) => x.r.id)).toContain(target.id);
    expect(res.every((x) => compatible(x.r, child5))).toBe(true);
  });
  it('12. accueil : une seule recette, toujours adaptée au profil affiché', () => {
    for (let d = 0; d < 60; d++) {
      const day = new Date(2026, 0, 1 + d * 6);
      expect(recipeOfDay(all, pregnant, day)!.audiences).toContain('pregnancy');
      const b = recipeOfDay(all, baby6, day)!;
      expect(b.audiences).toContain('baby');
      expect(compatible(b, baby6)).toBe(true);
      expect(recipeOfDay(all, child5, day)!.audiences).toContain('child');
    }
    // jamais de purée de bébé sur l'accueil d'une femme enceinte
    expect(filterRecipes(all, pregnant).some((r) => r.tags.includes('puree') && !r.audiences.includes('pregnancy'))).toBe(false);
    // une recette retirée n'est plus proposée
    const retired = { ...clone(all[0]), status: 'retired' as const };
    expect(compatible(retired, { audience: retired.audiences[0] === 'baby' ? 'baby' : retired.audiences[0] })).toBe(false);
  });
});
