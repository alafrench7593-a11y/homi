/**
 * « Ses découvertes » et « Je grandis » (logique pure, testée) : disponibilité d'un aliment selon l'âge (jamais une
 * obligation), progression par catégorie sans compétition, découvertes de la semaine, idées adaptées à l'âge,
 * recettes qui utilisent les aliments déjà goûtés, sécurité après une réaction (jamais de diagnostic), étapes par
 * tranche d'âge (repères généraux) et résumé factuel pour un rendez-vous.
 */
import { t as tr } from '@/i18n';
import { FOODS, FOOD_BY_KEY, FOOD_CATEGORIES, type FoodCategory, type FoodDef } from '@/content/discoveries/foods';
import { AGE_BANDS, STEPS, STEP_BY_KEY, type StepCategory, type StepDef, type StepStatus } from '@/content/discoveries/steps';
import type { Recipe } from '@/lib/recipes/types';

export type FoodStatus = 'not_yet' | 'tasted' | 'liked' | 'refused';
export const FOOD_STATUSES: FoodStatus[] = ['not_yet', 'tasted', 'liked', 'refused'];
export type Texture = 'smooth' | 'mashed' | 'soft_pieces' | 'pieces' | 'family';
export const TEXTURES: Texture[] = ['smooth', 'mashed', 'soft_pieces', 'pieces', 'family'];
export const PREPARATIONS = ['steamed', 'boiled', 'oven', 'raw', 'mixed', 'stewed', 'other'] as const;

export interface FoodEntry {
  id: string;
  child_id: string;
  food_key: string | null;
  food_name: string;
  status: FoodStatus;
  first_tried_on: string | null;
  reaction: boolean;
  reaction_note: string | null;
  texture: Texture | null;
  preparation: string | null;
  note: string | null;
  favorite: boolean;
  updated_at?: string;
  created_at?: string;
}
export interface Tasting {
  id: string;
  child_id: string;
  food_key: string | null;
  food_name: string;
  tasted_on: string;
  status: Exclude<FoodStatus, 'not_yet'>;
  reaction: boolean;
  reaction_note: string | null;
  texture: Texture | null;
  preparation: string | null;
  note: string | null;
  created_at?: string;
}

/** Âge en mois révolus (date de naissance ISO, aujourd'hui ISO). */
export function ageInMonths(birth: string, today: string): number {
  const [by, bm, bd] = birth.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  return Math.max(0, (ty - by) * 12 + (tm - bm) - (td < bd ? 1 : 0));
}

/** Version gratuite : les aliments essentiels (les 4 premiers de chaque catégorie) et tous les allergènes. */
const ESSENTIAL = new Set(FOOD_CATEGORIES.flatMap((c) => FOODS.filter((f) => f.category === c).slice(0, 4).map((f) => f.key)));
export const freeFood = (f: Pick<FoodDef, 'key' | 'allergen' | 'category'>) => ESSENTIAL.has(f.key) || !!f.allergen || f.category === 'allergen';

/** « À découvrir lorsque son âge et sa situation le permettent » : jamais une obligation. */
export type Availability = 'now' | 'later';
export const availability = (f: Pick<FoodDef, 'minMonths'>, ageMonths: number): Availability => (ageMonths >= (f.minMonths ?? 4) ? 'now' : 'later');

/** Statut affiché : « Déjà découvert », « À reproposer plus tard », « À découvrir… ». */
export type DisplayState = 'discovered' | 'retry_later' | 'to_discover' | 'not_yet_age';
export function displayState(entry: Pick<FoodEntry, 'status'> | undefined, f: Pick<FoodDef, 'minMonths'>, ageMonths: number): DisplayState {
  if (entry?.status === 'tasted' || entry?.status === 'liked') return 'discovered';
  if (entry?.status === 'refused') return 'retry_later';
  return availability(f, ageMonths) === 'now' ? 'to_discover' : 'not_yet_age';
}

const isDiscovered = (e: Pick<FoodEntry, 'status'>) => e.status === 'tasted' || e.status === 'liked' || e.status === 'refused';

/** Progression par catégorie (aliments proposés au moins une fois), sans total ni comparaison. */
export function progressByCategory(entries: Pick<FoodEntry, 'food_key' | 'status'>[]): Record<FoodCategory, number> {
  const out = Object.fromEntries(FOOD_CATEGORIES.map((c) => [c, 0])) as Record<FoodCategory, number>;
  for (const e of entries) {
    const f = e.food_key ? FOOD_BY_KEY[e.food_key] : undefined;
    if (f && isDiscovered(e)) out[f.category]++;
  }
  return out;
}

/** Les deux catégories les plus découvertes, pour la phrase « Lina a découvert 8 légumes et 6 fruits ». */
export function topCategories(progress: Record<FoodCategory, number>, n = 2): { category: FoodCategory; count: number }[] {
  return FOOD_CATEGORIES.map((c) => ({ category: c, count: progress[c] })).filter((x) => x.count > 0).sort((a, b) => b.count - a.count).slice(0, n);
}

/** Découvertes de la semaine (7 derniers jours, aujourd'hui compris), une ligne par aliment. */
export function discoveredThisWeek(tastings: Pick<Tasting, 'food_key' | 'food_name' | 'tasted_on'>[], today: string): string[] {
  const from = addDaysISO(today, -6);
  const seen = new Set<string>();
  return [...tastings].sort((a, b) => b.tasted_on.localeCompare(a.tasted_on))
    .filter((t) => t.tasted_on >= from && t.tasted_on <= today)
    .map((t) => t.food_key ?? t.food_name).filter((k) => (seen.has(k) ? false : (seen.add(k), true)));
}

/** Historique : récent (gratuit, 30 jours) ou complet (Premium). */
export function visibleHistory<T extends Pick<Tasting, 'tasted_on'>>(tastings: T[], today: string, full: boolean): T[] {
  const sorted = [...tastings].sort((a, b) => b.tasted_on.localeCompare(a.tasted_on));
  return full ? sorted : sorted.filter((t) => t.tasted_on >= addDaysISO(today, -29));
}

/** Nouvelles idées adaptées à l'âge : aliments possibles à son âge, jamais proposés, en variant les catégories. */
export function ideasForAge(entries: Pick<FoodEntry, 'food_key' | 'status'>[], ageMonths: number, n = 6, allergies: string[] = []): FoodDef[] {
  const known = new Set(entries.filter(isDiscovered).map((e) => e.food_key));
  const progress = progressByCategory(entries);
  const candidates = FOODS.filter((f) => !known.has(f.key) && availability(f, ageMonths) === 'now' && !(f.allergen && allergies.includes(f.allergen)));
  // une idée par catégorie à la fois, en commençant par les catégories les moins explorées
  const byCat = FOOD_CATEGORIES.map((c) => candidates.filter((f) => f.category === c)).filter((l) => l.length)
    .sort((a, b) => progress[a[0].category] - progress[b[0].category]);
  const out: FoodDef[] = [];
  for (let i = 0; out.length < n && byCat.some((l) => l[i]); i++) for (const l of byCat) if (l[i] && out.length < n) out.push(l[i]);
  return out;
}

/** Aliments du catalogue liés aux ingrédients d'une recette. */
export function recipeFoods(r: Pick<Recipe, 'ingredients'>): string[] {
  const keys = new Set<string>();
  for (const i of r.ingredients) for (const f of FOODS) if (f.ing === i.key) keys.add(f.key);
  return [...keys];
}

/**
 * Recettes pour bébé ou enfant compatibles avec son âge, qui contiennent l'aliment choisi (si donné) et dont tous les
 * autres aliments du catalogue ont déjà été goûtés (jamais refusé ou réaction : on ne le repropose pas en recette).
 */
export function recipesWithTasted(recipes: Recipe[], entries: Pick<FoodEntry, 'food_key' | 'status' | 'reaction'>[], ageMonths: number, focus?: string | null): Recipe[] {
  const ok = new Set(entries.filter((e) => (e.status === 'tasted' || e.status === 'liked') && !e.reaction).map((e) => e.food_key));
  return recipes.filter((r) => (r.audiences.includes('baby') || r.audiences.includes('child'))
    && (r.minMonths == null || ageMonths >= r.minMonths) && (r.maxMonths == null || ageMonths <= r.maxMonths)
    && r.status !== 'retired')
    .map((r) => ({ r, foods: recipeFoods(r) }))
    .filter(({ foods }) => foods.length > 0 && (!focus || foods.includes(focus)) && foods.every((k) => k === focus || ok.has(k)))
    .map(({ r }) => r);
}

// ---------------------------------------------------------------- sécurité après une réaction
export type ReactionSign = 'breathing' | 'swelling' | 'vomiting' | 'faint' | 'hives' | 'redness_mouth' | 'digestive' | 'other';
export const SEVERE_SIGNS: ReactionSign[] = ['breathing', 'swelling', 'vomiting', 'faint'];
/** Jamais un diagnostic : seulement la conduite à tenir selon les signes notés (ameli, œdème de Quincke). */
export function reactionAdvice(signs: ReactionSign[]): 'emergency' | 'advice' {
  return signs.some((s) => SEVERE_SIGNS.includes(s)) ? 'emergency' : 'advice';
}

// ---------------------------------------------------------------- Je grandis
export interface ChildStep { id: string; child_id: string; step_key: string; status: StepStatus; observed_on: string | null; note: string | null; updated_at: string }

/** Tranche d'âge actuelle (repère général). */
export const bandFor = (ageMonths: number) => AGE_BANDS.find((b) => ageMonths >= b.from && ageMonths < b.to) ?? AGE_BANDS[AGE_BANDS.length - 1];

/** Étapes d'une tranche : celles dont le repère général chevauche la tranche. */
export function stepsInBand(band: { from: number; to: number }, category?: StepCategory | null): StepDef[] {
  return STEPS.filter((s) => s.around[0] < band.to && s.around[1] >= band.from && (!category || s.category === category));
}

/** Étapes accessibles : principales en version gratuite, toutes avec Premium. */
export const stepAvailable = (s: Pick<StepDef, 'main'>, premium: boolean) => premium || !!s.main;

/** « Ce que vous avez observé récemment » : observées ou en cours, les plus récentes d'abord. */
export function recentObservations(rows: ChildStep[], n = 5): ChildStep[] {
  return rows.filter((r) => r.status === 'observed' || r.status === 'in_progress')
    .sort((a, b) => (b.observed_on ?? b.updated_at).localeCompare(a.observed_on ?? a.updated_at)).slice(0, n);
}

/** Libellés interdits (jamais affichés) : pas de score, de retard, d'échec ni de comparaison. */
export const FORBIDDEN_GROW = [/en retard/i, /retard/i, /échec/i, /\d+\s*(sur|\/)\s*\d+\s*(objectifs|étapes)/i, /mauvais progrès/i, /classement/i, /meilleur que/i];

/**
 * Résumé factuel pour un rendez-vous : ce que le parent a noté, tel quel, sans interprétation.
 * Les étapes « je ne souhaite pas la suivre » ne figurent pas.
 */
export function factualSummary(name: string, ageMonths: number, rows: ChildStep[], questions: string[]): string[] {
  const lines = [tr('l3.disc.head', { name, age: ageMonths })];
  const label: Record<StepStatus, string> = { observed: tr('l3.disc.observed'), in_progress: tr('l3.disc.in_progress'), not_yet: tr('l3.disc.not_yet'), not_tracked: '' };
  for (const r of [...rows].filter((x) => x.status !== 'not_tracked').sort((a, b) => a.step_key.localeCompare(b.step_key))) {
    const s = STEP_BY_KEY[r.step_key];
    if (!s) continue;
    lines.push(`${tr('l3.disc.line', { title: s.title, status: label[r.status] })}${r.observed_on ? tr('l3.disc.on_date', { date: r.observed_on.split('-').reverse().join('/') }) : ''}${r.note ? tr('l3.disc.note', { note: r.note }) : ''}`);
  }
  for (const q of questions) lines.push(`? ${q}`);
  return lines;
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
