/**
 * Moteur des recettes (logique pure, testée) : profil alimentaire → recettes compatibles, filtres, menus sur
 * plusieurs jours (remplacer, déplacer), liste de courses, « Que puis-je cuisiner avec ce que j'ai ? »,
 * recettes et précautions à partir d'un produit scanné.
 */
import { INGREDIENTS } from './ingredients';
import { fold, hasPork, isVegetarian } from './validate';
import { STAGE_MONTHS, TEXTURES, type Aisle, type Allergen, type Meal, type Recipe, type Season, type Stage, type Tag, type Texture, type Unit } from './types';

export type Audience = 'pregnancy' | 'baby' | 'child' | 'family' | 'adult';

export interface FoodProfile {
  audience: Audience;
  /** Prénom (affiché avant toute action pour un enfant). */
  name?: string;
  ageMonths?: number | null;
  /** Bébé : texture actuellement proposée (prime sur l'âge). */
  texture?: Texture | null;
  allergies?: Allergen[];
  vegetarian?: boolean;
  noPork?: boolean;
  /** Clés d'ingrédients refusés ou à éviter. */
  refused?: string[];
  /** Bébé : aliments déjà introduits (clés) ; un allergène jamais introduit n'est pas proposé si un avis est nécessaire. */
  introduced?: string[] | null;
  /** Un professionnel a demandé un avis avant tout nouvel allergène (ou allergie connue). */
  allergenAdviceNeeded?: boolean;
  /** Grossesse : trimestre (1, 2, 3) pour les menus. */
  trimester?: 1 | 2 | 3 | null;
}

const TEX_RANK: Record<Texture, number> = Object.fromEntries(TEXTURES.map((t, i) => [t, i])) as Record<Texture, number>;

/** Étape indicative : d'abord la texture déclarée, puis l'âge. */
export function stageFor(ageMonths: number): Stage {
  const entries = Object.entries(STAGE_MONTHS) as [Stage, [number, number]][];
  return entries.find(([, [a, b]]) => ageMonths >= a && ageMonths < b)?.[0] ?? (ageMonths < 6 ? 'start' : 'y2_3');
}
export const textureForStage = (s: Stage): Texture => (s === 'start' ? 'smooth' : s === 'm6_8' ? 'mashed' : s === 'm9_12' ? 'ground' : s === 'm12_18' ? 'pieces' : 'regular');

/** Allergènes portés par un ingrédient (pour « jamais introduit »). */
const allergenFoods = (r: Recipe) => r.ingredients.filter((x) => (INGREDIENTS[x.key].allergens ?? []).length).map((x) => x.key);

/** Pourquoi une recette n'est pas proposée à ce profil (vide = compatible). */
export function incompatibility(r: Recipe, p: FoodProfile): string[] {
  const why: string[] = [];
  if (r.status === 'retired') why.push('retirée');
  const age = p.ageMonths ?? null;
  switch (p.audience) {
    case 'pregnancy': if (!r.audiences.includes('pregnancy')) why.push('pas une recette de grossesse'); break;
    case 'baby': {
      if (!r.audiences.includes('baby')) { why.push('pas une recette pour bébé'); break; }
      if (age != null) {
        if (r.minMonths != null && age < r.minMonths) why.push('étape suivante');
        if (r.maxMonths != null && age >= r.maxMonths && !(r.stages ?? []).includes(stageFor(age))) why.push('étape passée');
      }
      const tex = p.texture ?? (age != null ? textureForStage(stageFor(age)) : null);
      if (tex && !r.textures.some((t) => TEX_RANK[t] <= TEX_RANK[tex])) why.push('texture pas encore proposée');
      break;
    }
    case 'child':
      if (!r.audiences.includes('child')) why.push('pas une recette pour enfant');
      else if (age != null && ((r.minMonths != null && age < r.minMonths) || (r.maxMonths != null && age > r.maxMonths))) why.push('âge');
      break;
    case 'family': case 'adult':
      if (!r.audiences.includes('family')) why.push('pas une recette familiale');
      break;
  }
  const al = p.allergies ?? [];
  const hit = r.allergens.filter((a) => al.includes(a));
  if (hit.length) why.push(`allergène déclaré : ${hit.join(', ')}`);
  if (p.vegetarian && !isVegetarian(r)) why.push('non végétarienne');
  if (p.noPork && hasPork(r) && !r.adaptations.some((a) => /sans porc/i.test(a))) why.push('contient du porc');
  const refused = (p.refused ?? []).filter((k) => r.ingredients.some((x) => x.key === k && !x.optional));
  if (refused.length) why.push(`aliment refusé : ${refused.map((k) => INGREDIENTS[k]?.name ?? k).join(', ')}`);
  if (p.audience === 'baby' && p.introduced && p.allergenAdviceNeeded) {
    const fresh = allergenFoods(r).filter((k) => !p.introduced!.includes(k));
    if (fresh.length) why.push(`nouvel allergène sans avis : ${fresh.map((k) => INGREDIENTS[k].name).join(', ')}`);
  }
  return why;
}
export const compatible = (r: Recipe, p: FoodProfile) => incompatibility(r, p).length === 0;

/** Ingrédients d'une recette jamais introduits chez le bébé (affichés comme « nouveaux » sur la fiche). */
export const newFoods = (r: Recipe, p: FoodProfile) => (p.introduced ? r.ingredients.filter((x) => !p.introduced!.includes(x.key)).map((x) => x.key) : []);

// ---------------------------------------------------------------- filtres
export interface RecipeFilter {
  q?: string;
  meal?: Meal | null;
  tag?: Tag | null;
  maxMinutes?: number | null;
  budget?: 1 | 2 | 3 | null;
  season?: Season | null;
  temperature?: 'hot' | 'cold' | null;
  vegetarian?: boolean;
  noPork?: boolean;
  allergens?: Allergen[];
  texture?: Texture | null;
  ageMonths?: number | null;
  favorites?: string[] | null;
  /** Avec du poisson (recommandations ANSES sur les espèces, la cuisson, l'âge et la grossesse appliquées à chaque recette). */
  fish?: boolean;
  /** Idées masquées (« Je n'aime pas cette idée »), par identifiant de recette. */
  exclude?: string[] | null;
}

export function filterRecipes(all: Recipe[], p: FoodProfile, f: RecipeFilter = {}): Recipe[] {
  const q = fold(f.q ?? '').trim();
  return all.filter((r) => compatible(r, p)
    && (!f.meal || r.meals.includes(f.meal))
    && (!f.tag || r.tags.includes(f.tag))
    && (!f.maxMinutes || r.prepMin + r.cookMin <= f.maxMinutes)
    && (!f.budget || r.budget <= f.budget)
    && (!f.season || r.seasons === 'all' || r.seasons.includes(f.season))
    && (!f.temperature || r.temperature === f.temperature)
    && (!f.vegetarian || isVegetarian(r))
    && (!f.noPork || !hasPork(r))
    && (!f.allergens?.length || !r.allergens.some((a) => f.allergens!.includes(a)))
    && (!f.texture || r.textures.includes(f.texture))
    && (f.ageMonths == null || r.minMonths == null || (f.ageMonths >= r.minMonths && (r.maxMonths == null || f.ageMonths <= r.maxMonths)))
    && (!f.favorites || f.favorites.includes(r.id))
    && (!f.fish || r.ingredients.some((x) => INGREDIENTS[x.key]?.fish))
    && (!f.exclude?.length || !f.exclude.includes(r.id))
    && (!q || fold(`${r.title} ${r.summary} ${r.ingredients.map((x) => INGREDIENTS[x.key].name).join(' ')}`).includes(q)));
}

export const currentSeason = (d = new Date()): Season => (['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'] as Season[])[d.getMonth()];

// ---------------------------------------------------------------- quantités
export function scaleQty(qty: number | null, from: number, to: number, unit: Unit | null): number | null {
  if (qty == null) return null;
  const v = (qty * to) / from;
  if (unit === 'g' || unit === 'ml') return v >= 100 ? Math.round(v / 10) * 10 : Math.round(v / 5) * 5 || Math.round(v);
  return Math.round(v * 4) / 4; // pièces, cuillères : au quart près
}
export function formatQty(qty: number | null, unit: Unit | null): string {
  if (qty == null) return '';
  const n = Number.isInteger(qty) ? String(qty) : qty === 0.5 ? '½' : qty === 0.25 ? '¼' : qty === 0.75 ? '¾' : String(qty).replace('.', ',');
  switch (unit) {
    case 'g': return `${n} g`;
    case 'ml': return qty >= 1000 ? `${String(qty / 1000).replace('.', ',')} l` : `${n} ml`;
    case 'cs': return `${n} c. à soupe`;
    case 'cc': return `${n} c. à café`;
    case 'pincee': return qty > 1 ? `${n} pincées` : '1 pincée';
    default: return n;
  }
}

// ---------------------------------------------------------------- ce que j'ai à la maison
/** Ingrédients de base qu'on suppose présents (ne comptent pas comme « manquants »). */
export const STAPLES = ['olive_oil', 'rapeseed_oil', 'salt', 'sugar', 'herbs', 'cumin', 'cinnamon', 'paprika', 'baking_powder', 'vanilla', 'curry', 'ras_el_hanout'];

export function pantryMatch(r: Recipe, have: string[]) {
  const main = r.ingredients.filter((x) => !STAPLES.includes(x.key) && !x.optional).map((x) => x.key);
  const missing = main.filter((k) => !have.includes(k));
  return { coverage: main.length ? (main.length - missing.length) / main.length : 1, missing, uses: main.filter((k) => have.includes(k)) };
}

/** « Que puis-je cuisiner avec ce que j'ai ? » : recettes COMPATIBLES avec le profil, les plus complètes d'abord. */
export function cookWithWhatIHave(all: Recipe[], p: FoodProfile, have: string[], maxMissing = 2) {
  return filterRecipes(all, p)
    .map((r) => ({ r, ...pantryMatch(r, have) }))
    .filter((x) => x.uses.length > 0 && x.missing.length <= maxMissing)
    .sort((a, b) => a.missing.length - b.missing.length || b.uses.length - a.uses.length);
}

/** Ingrédients reconnus dans un texte (nom de produit scanné, saisie libre). */
export function ingredientsInText(text: string): string[] {
  const t = ` ${fold(text).replace(/[^a-z0-9 ]+/g, ' ')} `;
  return Object.entries(INGREDIENTS).filter(([, d]) => (d.terms ?? [d.name]).some((term) => t.includes(` ${fold(term)} `) || t.includes(` ${fold(term)}s `))).map(([k]) => k);
}

// ---------------------------------------------------------------- produit scanné
interface Risk { re: RegExp; audiences: Audience[]; maxMonths?: number; text: string; alternative: string }
/** Mots d'un produit qui demandent une précaution (repères officiels cités dans les sources des recettes). */
const RISKS: Risk[] = [
  { re: /lait cru/, audiences: ['pregnancy', 'baby', 'child'], maxMonths: 60, text: 'Produit au lait cru : déconseillé pendant la grossesse et avant 5 ans (sauf fromages à pâte pressée cuite).', alternative: 'Choisissez un produit au lait pasteurisé, ou un fromage à pâte pressée cuite (emmental, comté).' },
  { re: /(fume|saumon fume|truite fumee|sushi|tarama|carpaccio|tartare)/, audiences: ['pregnancy'], text: 'Poisson fumé ou cru : à éviter pendant la grossesse (listériose).', alternative: 'Préférez un poisson cuit à cœur, par exemple au four.' },
  { re: /(rillette|pate de campagne|foie gras|terrine|en gelee)/, audiences: ['pregnancy'], text: 'Charcuterie de ce type : à éviter pendant la grossesse (listériose).', alternative: 'Jambon cuit préemballé ou volaille cuite à cœur.' },
  { re: /(foie|pate de foie)/, audiences: ['pregnancy'], text: 'Foie et produits à base de foie : à limiter pendant la grossesse (vitamine A).', alternative: 'Une autre source de fer : viande rouge cuite, lentilles.' },
  { re: /(soja|tofu)/, audiences: ['pregnancy'], text: 'Produits au soja : déconseillés pendant la grossesse (phytoestrogènes).', alternative: 'Yaourt au lait de vache, légumineuses (lentilles, pois chiches).' },
  { re: /(alcool|vin |biere|cidre|rhum)/, audiences: ['pregnancy', 'baby', 'child'], text: 'Contient de l’alcool : pas d’alcool pendant la grossesse ni pour les enfants.', alternative: 'Une recette sans alcool.' },
  { re: /miel/, audiences: ['baby'], maxMonths: 12, text: 'Miel : jamais avant 1 an (botulisme infantile, ANSES).', alternative: 'Une compote de fruits sans sucre ajouté.' },
  { re: /(cacahuete|arachide|noisette|amande|noix|pistache)/, audiences: ['baby', 'child'], maxMonths: 48, text: 'Fruits à coque entiers : risque d’étouffement avant 4 ans ; à proposer en poudre ou en purée lisse. En cas d’allergie connue ou suspectée, demandez d’abord un avis médical.', alternative: 'Poudre d’amande ou purée lisse, en petite quantité.' },
  { re: /(sel |sale|sucre|sirop|bonbon|confiserie|soda)/, audiences: ['baby'], maxMonths: 12, text: 'Produit salé ou sucré : sans sel ni sucre ajoutés pour les bébés.', alternative: 'Fruits ou légumes cuits sans assaisonnement.' },
  { re: /(raisin|tomate cerise|olive)/, audiences: ['baby', 'child'], maxMonths: 48, text: 'Petit aliment rond : à couper en quatre dans la longueur avant 4 ans (risque d’étouffement).', alternative: 'Coupé en quatre ou écrasé.' },
];

export function scannedProductAdvice(productName: string, p: FoodProfile, all: Recipe[]) {
  const t = ` ${fold(productName)} `;
  const age = p.ageMonths ?? null;
  const precautions = RISKS.filter((r) => r.re.test(t) && r.audiences.includes(p.audience) && (r.maxMonths == null || p.audience === 'pregnancy' || age == null || age < r.maxMonths));
  const keys = ingredientsInText(productName);
  const recipes = filterRecipes(all, p).filter((r) => r.ingredients.some((x) => keys.includes(x.key)));
  return { keys, precautions, recipes, suitable: precautions.length === 0 };
}

// ---------------------------------------------------------------- menus
export interface MenuSlot { day: number; meal: Meal; recipeId: string; servings: number; note?: string }
export interface MenuOptions {
  days: number;
  meals: Meal[];
  servings: number;
  maxMinutes?: number | null;
  budget?: 1 | 2 | 3 | null;
  have?: string[];
  favorites?: string[];
  /** Idées masquées par la personne : jamais proposées dans un menu. */
  exclude?: string[];
  /** Pour une famille : profils des enfants (repas communs + adaptations). */
  members?: FoodProfile[];
  seed?: number;
}

const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

/** Repères généraux par trimestre (aucune promesse) : on privilégie certaines étiquettes. */
const TRIMESTER_TAGS: Record<1 | 2 | 3, Tag[]> = { 1: ['nausea', 'quick', 'b9'], 2: ['iron', 'calcium', 'protein'], 3: ['iron', 'calcium', 'fiber', 'make_ahead'] };

function score(r: Recipe, p: FoodProfile, o: MenuOptions) {
  let s = 0;
  if (o.favorites?.includes(r.id)) s += 3;
  if (o.have?.length) s += pantryMatch(r, o.have).coverage * 2;
  if (p.audience === 'pregnancy' && p.trimester) s += r.tags.filter((t) => TRIMESTER_TAGS[p.trimester!].includes(t)).length;
  if (o.members?.length) s += (r.familyAdaptations ? 1.5 : 0) + (r.tags.includes('family') ? 1 : 0);
  return s;
}

/** Recettes possibles pour un repas : compatibles avec le profil ET, pour une famille, avec chaque enfant ou adaptables. */
export function candidates(all: Recipe[], p: FoodProfile, meal: Meal, o: MenuOptions) {
  return filterRecipes(all, p, { meal, maxMinutes: o.maxMinutes, budget: o.budget, exclude: o.exclude })
    .filter((r) => (o.members ?? []).every((m) => compatible(r, m) || adaptationFor(r, m) != null));
}

/** Adaptation d'un repas familial pour un membre (bébé, enfant), ou null si impossible. */
export function adaptationFor(r: Recipe, m: FoodProfile): string | null {
  if (compatible(r, m)) return m.audience === 'baby' ? (r.familyAdaptations?.baby ?? null) : (r.familyAdaptations?.child ?? '');
  const why = incompatibility(r, m);
  const onlyAudience = why.every((w) => /^pas une recette|^âge|^étape|^texture/.test(w));
  if (!onlyAudience) return null; // allergène, refus, végétarien : pas d'adaptation automatique
  if (m.audience === 'baby' && r.familyAdaptations?.baby && (m.ageMonths ?? 0) >= 6) return r.familyAdaptations.baby;
  if (m.audience === 'child' && r.familyAdaptations?.child) return r.familyAdaptations.child;
  return null;
}

/** Adaptations d'un repas familial pour chaque enfant (« Lina : … · Noé : … »). */
function notesFor(r: Recipe, o: MenuOptions): string | null {
  const notes = (o.members ?? []).map((m) => { const a = adaptationFor(r, m); return a == null ? null : `${m.name ?? ''} : ${a || 'même repas que les adultes'}`; }).filter(Boolean);
  return notes.length ? notes.join(' · ') : null;
}

export function generateMenu(all: Recipe[], p: FoodProfile, o: MenuOptions): MenuSlot[] {
  const rand = rng(o.seed ?? 7);
  const out: MenuSlot[] = [];
  for (let day = 0; day < o.days; day++) {
    for (const meal of o.meals) {
      const pool = candidates(all, p, meal, o);
      if (!pool.length) continue;
      // pas deux fois la même recette sur 3 jours ; puis meilleur score, départage pseudo-aléatoire stable
      const recent = new Set(out.filter((s) => s.day > day - 3).map((s) => s.recipeId));
      const fresh = pool.filter((r) => !recent.has(r.id));
      const list = (fresh.length ? fresh : pool).map((r) => ({ r, s: score(r, p, o) + rand() * 0.9 })).sort((a, b) => b.s - a.s);
      const r = list[0].r;
      const note = notesFor(r, o);
      out.push({ day, meal, recipeId: r.id, servings: o.servings, ...(note ? { note } : {}) });
    }
  }
  return out;
}

/** Remplacer une recette du menu : la suivante compatible, absente du menu si possible. */
export function replaceSlot(all: Recipe[], p: FoodProfile, menu: MenuSlot[], index: number, o: MenuOptions): MenuSlot[] {
  const slot = menu[index];
  const used = new Set(menu.map((s) => s.recipeId));
  const pool = candidates(all, p, slot.meal, o).filter((r) => r.id !== slot.recipeId);
  const next = pool.find((r) => !used.has(r.id)) ?? pool[0];
  if (!next) return menu;
  const note = notesFor(next, o);
  return menu.map((s, i) => { if (i !== index) return s; const { note: _old, ...rest } = s; return { ...rest, recipeId: next.id, ...(note ? { note } : {}) }; });
}
/** Déplacer un repas (échange avec la case visée). */
export function moveSlot(menu: MenuSlot[], from: number, to: { day: number; meal: Meal }): MenuSlot[] {
  const target = menu.findIndex((s) => s.day === to.day && s.meal === to.meal);
  return menu.map((s, i) => {
    if (i === from) return { ...s, day: to.day, meal: to.meal };
    if (i === target) return { ...s, day: menu[from].day, meal: menu[from].meal };
    return s;
  });
}

// ---------------------------------------------------------------- liste de courses
export interface ShoppingLine { key: string; label: string; qty: number | null; unit: Unit | null; aisle: Aisle; atHome: boolean; recipes: string[] }
export const AISLE_ORDER: Aisle[] = ['fruits_legumes', 'boucherie', 'poissonnerie', 'cremerie', 'frais', 'boulangerie', 'epicerie', 'surgeles'];

export function shoppingList(all: Recipe[], menu: MenuSlot[], have: string[] = []): ShoppingLine[] {
  const byId = new Map(all.map((r) => [r.id, r]));
  const lines = new Map<string, ShoppingLine>();
  for (const s of menu) {
    const r = byId.get(s.recipeId);
    if (!r) continue;
    for (const x of r.ingredients) {
      if (x.optional) continue;
      const d = INGREDIENTS[x.key];
      const k = `${x.key}|${x.unit}`;
      const q = scaleQty(x.qty, r.servings, s.servings, x.unit);
      const cur = lines.get(k);
      if (cur) { cur.qty = cur.qty != null && q != null ? Math.round((cur.qty + q) * 100) / 100 : cur.qty ?? q; if (!cur.recipes.includes(r.title)) cur.recipes.push(r.title); }
      else lines.set(k, { key: x.key, label: d.name, qty: q, unit: x.unit, aisle: d.aisle, atHome: have.includes(x.key) || STAPLES.includes(x.key), recipes: [r.title] });
    }
  }
  return [...lines.values()].sort((a, b) => AISLE_ORDER.indexOf(a.aisle) - AISLE_ORDER.indexOf(b.aisle) || a.label.localeCompare(b.label, 'fr'));
}

/** Une recette recommandée pour l'accueil : stable pour la journée, uniquement parmi les recettes compatibles. */
export function recipeOfDay(all: Recipe[], p: FoodProfile, d = new Date(), exclude: string[] = []): Recipe | null {
  const season = currentSeason(d);
  const pool = filterRecipes(all, p, { exclude }).filter((r) => r.seasons === 'all' || r.seasons.includes(season));
  const list = pool.length ? pool : filterRecipes(all, p, { exclude });
  if (!list.length) return null;
  const day = Math.floor(d.getTime() / 86_400_000);
  return list[day % list.length];
}
