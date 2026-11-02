/**
 * QA D-10 (02/11/2026) : en anglais, les contenus (recettes, garde-manger, espaces de la communauté, articles de
 * référence) ne doivent plus s'afficher en français. Le français reste intact et sert toujours aux contrôles.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import content from '@/content/demo-content.json';
import { ALL_RECIPES } from '@/content/recipes';
import { ARTICLES_EN } from '@/content/articles/en';
import { SOURCES as POSTPARTUM_SOURCES } from '@/content/postpartum';
import { setLocale } from '@/i18n';
import { localizeForum } from '@/lib/data/hooks';
import { recipeToRows, rowsToRecipes } from '@/lib/recipes/db';
import { englishShapeErrors, localizeRecipe, localizeRecipes } from '@/lib/recipes/english';
import { INGREDIENTS } from '@/lib/recipes/ingredients';
import { RECIPE_SOURCES } from '@/lib/recipes/sources';
import type { Recipe } from '@/lib/recipes/types';
import type { Forum } from '@/lib/types';

afterEach(() => setLocale('fr'));

// Mots empruntés au français et courants en anglais britannique (noms de plats, de fromages, d'organismes)
const ALLOWED = /purée|crème fraîche|crème|béchamel|crêpes?|sauté|comté|jardinière|pâtés?|rillettes|foie gras|pot-au-feu|petits-suisses|fromage frais|hachis parmentier|parmentier|gratin dauphinois|dauphinois|croque-monsieurs?|clafoutis|navarin|blanquette|ratatouille|herbes de provence|ras el hanout|quatre-quarts|en papillote|bain-marie|au lait cru|santé\.fr|santé publique france|assurance maladie|allô parent bébé|1000 premiers jours|mon soutien psy|retour de couches|fil santé jeunes|sida info service|carte vitale|au fil de nous|espelette|ministère de la santé|mpedia|québec|repère|é(?=cole)/gi;
const FRENCH = /[àâçéèêëîïôûùüÿœ]|\b(le|la|les|des|du|et|avec|dans|une|aux|sans|est|sont|votre|vous|bébé|enfant)\b/i;
const frenchIn = (s: string | undefined | null) => !!s && FRENCH.test(s.replace(ALLOWED, ''));

function texts(r: Recipe): string[] {
  return [r.title, r.summary, r.servingLabel ?? '', ...r.steps, ...r.adaptations, r.storage, r.freezing ?? '', ...r.precautions, r.nutrition,
    r.familyAdaptations?.baby ?? '', r.familyAdaptations?.child ?? '', ...r.ingredients.map((x) => x.note ?? ''), r.photo.author, r.photo.license, r.photo.rights, r.photo.alt,
    ...r.statusHistory.flatMap((h) => [h.by, h.note ?? ''])].filter(Boolean);
}

describe('recettes en anglais', () => {
  it('chaque recette de la bibliothèque a une version anglaise complète, de même forme que le français', () => {
    expect(ALL_RECIPES.length).toBeGreaterThan(150);
    const bad = ALL_RECIPES.map((r) => [r.slug, englishShapeErrors(r)] as const).filter(([, e]) => e.length);
    expect(bad).toEqual([]);
  });

  it('en anglais, aucun texte de recette affiché ne reste en français (titres, étapes, conseils, conservation, mentions)', () => {
    setLocale('en');
    const shown = localizeRecipes(ALL_RECIPES, ALL_RECIPES);
    const leaks = shown.flatMap((r) => texts(r).filter(frenchIn).map((t) => `${r.slug} : ${t.slice(0, 80)}`));
    expect(leaks).toEqual([]);
    expect(shown.find((r) => r.slug === 'fa-gratin-dauphinois')?.title).toBe('Creamy gratin dauphinois');
  });

  it('même chose pour les recettes lues depuis la base (lignes de la démonstration ou de Supabase)', () => {
    const rows = ALL_RECIPES.map((r, k) => recipeToRows(r, `lib-${k}`));
    const fromDb = rowsToRecipes(rows.map((x) => x.recipe), rows.flatMap((x) => x.ingredients), rows.flatMap((x) => x.steps), rows.map((x) => x.photo), rows.flatMap((x) => x.links), rows.flatMap((x) => x.reviews.map((v, i) => ({ ...v, created_at: `${v.created_at}T0${i}:00:00Z` }))));
    setLocale('en');
    const shown = localizeRecipes(fromDb, ALL_RECIPES);
    expect(shown.flatMap((r) => texts(r).filter(frenchIn).map((t) => `${r.slug} : ${t.slice(0, 80)}`))).toEqual([]);
    expect(shown.find((r) => r.slug === 'gr-hachis-parmentier')?.steps[0]).toMatch(/^Peel the potatoes/);
  });

  it('un texte corrigé dans l’administration reste celui de la base (jamais une traduction devenue fausse)', () => {
    const ref = ALL_RECIPES.find((r) => r.slug === 'gr-hachis-parmentier')!;
    const edited: Recipe = { ...ref, en: undefined, title: 'Hachis parmentier corrigé', steps: ['Étape corrigée', ...ref.steps.slice(1)] };
    const shown = localizeRecipe(edited, ref, 'en');
    expect(shown.title).toBe('Hachis parmentier corrigé');
    expect(shown.steps[0]).toBe('Étape corrigée');
    expect(shown.steps[1]).toBe(ref.en!.steps[1]);
    expect(shown.summary).toBe(ref.en!.summary);
  });

  it('le français est inchangé et une recette personnelle n’est jamais traduite', () => {
    setLocale('fr');
    const fr = localizeRecipes(ALL_RECIPES, ALL_RECIPES);
    expect(fr).toBe(ALL_RECIPES);
    expect(ALL_RECIPES.find((r) => r.slug === 'fa-gratin-dauphinois')?.title).toBe('Gratin dauphinois crémeux');
    const mine: Recipe = { ...ALL_RECIPES[0], personal: true, en: undefined };
    expect(localizeRecipe(mine, ALL_RECIPES[0], 'en').title).toBe(ALL_RECIPES[0].title);
  });

  it('les règles de contenu santé sont respectées dans les textes anglais', () => {
    const banned = /risk-free|it'?s normal|no danger|no need to (see|consult)|approved by a professional|validated by a professional/i;
    const all = ALL_RECIPES.flatMap((r) => texts(localizeRecipe(r, r, 'en')));
    expect(all.filter((t) => banned.test(t))).toEqual([]);
  });

  it('éditeurs des sources des recettes : précisions traduites, titres des sources françaises inchangés', () => {
    setLocale('en');
    expect(RECIPE_SOURCES.inspq_etouffement.publisher).toBe('Institut national de santé publique du Québec (complementary reference, outside France)');
    expect(RECIPE_SOURCES.inspq_etouffement.title).toBe('Risques d’étouffement – à surveiller jusqu’à 4 ans');
    setLocale('fr');
    expect(RECIPE_SOURCES.inspq_etouffement.publisher).toMatch(/hors France/);
  });
});

describe('garde-manger en anglais', () => {
  it('chaque ingrédient du dictionnaire a un nom anglais, affiché quand l’application est en anglais', () => {
    const missing = Object.entries(INGREDIENTS).filter(([, d]) => !d.en).map(([k]) => k);
    expect(missing).toEqual([]);
    setLocale('en');
    const leaks = Object.entries(INGREDIENTS).filter(([, d]) => frenchIn(d.name)).map(([k, d]) => `${k} : ${d.name}`);
    expect(leaks).toEqual([]);
    expect(INGREDIENTS.carrot.name).toBe('carrot');
    setLocale('fr');
    expect(INGREDIENTS.carrot.name).toBe('carotte');
  });
});

describe('communauté : espaces en anglais', () => {
  const forums = (content as unknown as { forums: Forum[] }).forums;
  it('chaque espace (données de démonstration, comme la migration 20261104001700) a un nom et une description en anglais', () => {
    expect(forums.length).toBe(14);
    expect(forums.filter((f) => !f.title_en || !f.description_en).map((f) => f.slug)).toEqual([]);
    const shown = forums.map((f) => localizeForum(f, 'en'));
    expect(shown.flatMap((f) => [f.title, f.description]).filter(frenchIn)).toEqual([]);
    expect(shown.find((f) => f.slug === 'jumeaux-triples')?.title).toBe('Twins and triplets');
  });
  it('en français, le nom reste le français', () => {
    expect(localizeForum(forums.find((f) => f.slug === 'nouveau-ne')!, 'fr').title).toBe('Nouveau-né');
  });
});

describe('articles de référence en anglais', () => {
  const articles = (content as unknown as { articles: { slug: string; title: string }[] }).articles;
  it('les 14 articles de référence (fertilité, contraception, post-partum, valise…) ont un titre, un résumé et un texte anglais', () => {
    expect(articles.length).toBe(14);
    expect(articles.filter((a) => !ARTICLES_EN[a.slug]?.title || !ARTICLES_EN[a.slug]?.summary || !ARTICLES_EN[a.slug]?.body_md).map((a) => a.slug)).toEqual([]);
    expect(articles.map((a) => ARTICLES_EN[a.slug]).flatMap((e) => [e.title, e.summary]).filter(frenchIn)).toEqual([]);
  });
  it('les orientations vers un professionnel et les numéros d’urgence sont conservés', () => {
    for (const a of articles) {
      const en = ARTICLES_EN[a.slug].body_md;
      expect(en).toMatch(/does not replace advice from a health professional/);
      expect(en).toMatch(/\*\*15\*\*|call 15|15 \(or 112\)|, 15 or 112|or \*\*15\*\*/);
    }
    expect(ARTICLES_EN['baby-blues-ou-depression'].body_md).toMatch(/midwife/);
  });
  it('sources du post-partum : présentation de l’éditeur traduite, titre d’origine conservé', () => {
    setLocale('en');
    expect(POSTPARTUM_SOURCES.awhonn.publisher).not.toMatch(/association américaine/);
    expect(POSTPARTUM_SOURCES.mpj.title).toBe('Le baby blues et la dépression post-partum');
  });
});
