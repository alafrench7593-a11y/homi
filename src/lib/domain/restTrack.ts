/**
 * Repas, grossesse / post-partum, famille, communauté — fonctions PURES du suivi (22/11/2026), testées dans
 * src/__tests__/restTrack.test.ts. Aucune donnée inventée : « rien de noté » (null) n'est jamais un zéro, aucun
 * score, aucune déduction médicale. Toutes lisent les tables existantes (aucune nouvelle table, aucune migration).
 */
import { isoDay, parseIsoDay } from './journalTrack';
import { atMinutes, minutesOf, parseHm } from './homeTrack';

// ------------------------------------------------------------------ repas d'un enfant (table `meals`)
export interface MealLike { id: string; at: string; description: string | null; foods: string[] | null; texture?: string | null; reaction_note?: string | null; refused_foods?: string[] | null }

/** Repas d'un jour local, du plus tôt au plus tard. */
export function mealsOfDay<T extends Pick<MealLike, 'at'>>(list: readonly T[], day: string): T[] {
  return list.filter((m) => isoDay(new Date(m.at)) === day).sort((a, b) => a.at.localeCompare(b.at));
}

/** Ce qui a été noté pour un repas : aliments, sinon la description ; `null` si rien n'est écrit. */
export function mealLine(m: Pick<MealLike, 'foods' | 'description'>): string | null {
  const foods = (m.foods ?? []).map((f) => f.trim()).filter(Boolean);
  if (foods.length) return foods.join(', ');
  return m.description?.trim() || null;
}

/** « carotte, Pomme ,, riz » → ['carotte', 'Pomme', 'riz'] (doublons retirés, casse conservée). */
export function parseFoods(s: string): string[] {
  const out: string[] = [];
  for (const f of s.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean)) if (!out.some((o) => o.toLowerCase() === f.toLowerCase())) out.push(f.slice(0, 60));
  return out;
}

/**
 * Correction d'un repas : patch minimal (heure du même jour, aliments, note). `null` si l'heure est illisible.
 * Les aliments refusés restent ceux qui figurent encore dans la liste.
 */
export function mealPatch(orig: MealLike, d: { time: string; foods: string; note: string }): Record<string, unknown> | null {
  const min = parseHm(d.time);
  if (min == null) return null;
  const patch: Record<string, unknown> = {};
  const at = atMinutes(orig.at, min);
  if (at !== new Date(orig.at).toISOString()) patch.at = at;
  const foods = parseFoods(d.foods);
  if (foods.join('\u0001') !== (orig.foods ?? []).join('\u0001')) {
    patch.foods = foods;
    const refused = (orig.refused_foods ?? []).filter((f) => foods.includes(f));
    if (refused.length !== (orig.refused_foods ?? []).length) patch.refused_foods = refused;
  }
  const note = d.note.trim() || null;
  if (note !== (orig.reaction_note ?? null)) patch.reaction_note = note;
  return patch;
}

// ------------------------------------------------------------------ mesurettes
export type ScoopState = 'no_rule' | 'counting' | 'done' | 'over';
/**
 * État du compteur de mesurettes : le compte touché comparé au compte CALCULÉ à partir de la règle de la boîte
 * (jamais une quantité proposée par l'application). Sans règle exacte : `no_rule` (on compte simplement).
 */
export function scoopProgress(count: number, target: number | null): { state: ScoopState; remaining: number | null; extra: number } {
  const n = Math.max(0, Math.floor(count));
  if (target == null || !Number.isFinite(target) || target <= 0) return { state: 'no_rule', remaining: null, extra: 0 };
  if (n < target) return { state: 'counting', remaining: target - n, extra: 0 };
  if (n === target) return { state: 'done', remaining: 0, extra: 0 };
  return { state: 'over', remaining: 0, extra: n - target };
}

// ------------------------------------------------------------------ prénoms : gardés / écartés
/** Valeurs stockées dans `name_favorites.list_label` (donnée, jamais affichée telle quelle). */
export const NAME_KEPT = 'Favoris';
export const NAME_SET_ASIDE = 'Ecartes';
export interface NameFavLike { id: string; name: string; list_label: string; added_by: string | null; created_at: string }
export interface NameVoteLike { favorite_id: string; user_id: string; vote: -1 | 0 | 1 }

export const isSetAside = (f: Pick<NameFavLike, 'list_label'>) => f.list_label === NAME_SET_ASIDE;

/**
 * Tableau des prénoms : gardés (les plus récents d'abord) et écartés ; pour chacun, qui l'a proposé et les votes
 * exprimés (pour / contre), sans aucun « score » ni classement par personne.
 */
export function namesBoard<F extends NameFavLike>(favorites: readonly F[], votes: readonly NameVoteLike[]) {
  const row = (f: F) => {
    const vs = votes.filter((v) => v.favorite_id === f.id && v.vote !== 0);
    return { fav: f, pro: vs.filter((v) => v.vote > 0).length, con: vs.filter((v) => v.vote < 0).length };
  };
  const byNew = (a: F, b: F) => b.created_at.localeCompare(a.created_at) || a.name.localeCompare(b.name);
  const kept = favorites.filter((f) => !isSetAside(f)).sort(byNew).map(row);
  const setAside = favorites.filter(isSetAside).sort(byNew).map(row);
  return { kept, setAside };
}

/** Nom corrigé : 1–40 caractères, pas déjà présent dans la même liste (hors lui-même). Message-clé ou null. */
export function nameFixError(name: string, list: string, id: string, favorites: readonly NameFavLike[]): 'empty' | 'long' | 'taken' | null {
  const n = name.trim();
  if (!n) return 'empty';
  if (n.length > 40) return 'long';
  const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (favorites.some((f) => f.id !== id && f.list_label === list && fold(f.name) === fold(n))) return 'taken';
  return null;
}

// ------------------------------------------------------------------ post-partum
/** Jours depuis la naissance (J+N) ; `null` sans date ou date future. */
export function daysSinceBirth(delivery: string | null | undefined, today: string): number | null {
  const a = parseIsoDay(delivery ?? null);
  const b = parseIsoDay(today);
  if (!a || !b) return null;
  const n = Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 86400000);
  return n >= 0 ? n : null;
}

/** Nombre de jours avec un point noté parmi les `n` derniers jours (jamais de moyenne). */
export function notedDays(list: readonly { checkin_date: string }[], days: readonly string[]): number {
  const set = new Set(list.map((c) => c.checkin_date));
  return days.filter((d) => set.has(d)).length;
}

// ------------------------------------------------------------------ grossesse
/** Semaine choisie dans l'adresse (« ?week=24 ») bornée à 4–42 ; `null` = semaine en cours. */
export function weekParam(s: string | string[] | null | undefined): number | null {
  const v = Array.isArray(s) ? s[0] : s;
  if (!v || !/^\d{1,2}$/.test(v)) return null;
  const n = Number(v);
  return n >= 4 && n <= 42 ? n : null;
}

// ------------------------------------------------------------------ carnet de garde
export interface CareEditSpec { table: string; timeCol: 'at' | 'started_at'; noteCol: 'note' | 'reaction_note' }
/** Où corriger une saisie du carnet (heure + note) ; `null` pour une photo ou une saisie encore en file. */
export function careEditSpec(kind: string, pending?: boolean): CareEditSpec | null {
  if (pending) return null;
  switch (kind) {
    case 'bottle': return { table: 'bottles', timeCol: 'at', noteCol: 'note' };
    case 'meal': return { table: 'meals', timeCol: 'at', noteCol: 'reaction_note' };
    case 'sleep': return { table: 'sleeps', timeCol: 'started_at', noteCol: 'note' };
    case 'diaper': return { table: 'diapers', timeCol: 'at', noteCol: 'note' };
    case 'observation': return { table: 'child_observations', timeCol: 'at', noteCol: 'note' };
    case 'activity': case 'arrival': case 'departure': return { table: 'childcare_events', timeCol: 'at', noteCol: 'note' };
    default: return null;
  }
}

/**
 * Correction d'une saisie du carnet : heure du même jour et note. Refuse une heure illisible, une heure future,
 * un début de sieste après sa fin. Retourne le patch (vide si rien ne change) ou une clé d'erreur.
 */
export function carePatch(spec: CareEditSpec, row: Record<string, unknown>, d: { time: string; note: string }, now: Date):
  { patch: Record<string, unknown> } | { error: 'time' | 'future' | 'order' } {
  const min = parseHm(d.time);
  const orig = String(row[spec.timeCol] ?? '');
  if (min == null || !orig) return { error: 'time' };
  const patch: Record<string, unknown> = {};
  const at = atMinutes(orig, min);
  if (minutesOf(orig) !== min) {
    if (Date.parse(at) > now.getTime() + 60_000) return { error: 'future' };
    if (spec.timeCol === 'started_at' && typeof row.ended_at === 'string' && Date.parse(at) > Date.parse(row.ended_at)) return { error: 'order' };
    patch[spec.timeCol] = at;
  }
  const note = d.note.trim() || null;
  const prev = typeof row[spec.noteCol] === 'string' ? (row[spec.noteCol] as string) : null;
  if (note !== prev) patch[spec.noteCol] = note;
  return { patch };
}

// ------------------------------------------------------------------ missions
export interface MissionLike { id: string; mission_state: string; done_at: string | null; done_by: string | null; assignee_id: string | null }
const ACTIVE = new Set(['pending', 'accepted', 'in_progress', 'postponed']);
/** Restant (missions actives) / fait (terminées) ; les terminées d'un jour, de la plus récente à la plus ancienne. */
export function missionsSplit<T extends MissionLike>(all: readonly T[], day: string) {
  const remaining = all.filter((m) => ACTIVE.has(m.mission_state));
  const done = all.filter((m) => m.mission_state === 'done' && m.done_at);
  const doneOn = done.filter((m) => isoDay(new Date(m.done_at!)) === day).sort((a, b) => b.done_at!.localeCompare(a.done_at!));
  return { remaining, done, doneOn };
}

// ------------------------------------------------------------------ domaines du foyer
/** Domaines portés par chaque personne et domaines libres (aucun classement). */
export function domainsBoard(keys: readonly string[], owners: ReadonlyMap<string, string | null | undefined>, people: readonly { id: string }[]) {
  const per = people.map((p) => ({ id: p.id, count: keys.filter((k) => owners.get(k) === p.id).length }));
  const free = keys.filter((k) => !owners.get(k) || !people.some((p) => p.id === owners.get(k))).length;
  return { per, free, carried: keys.length - free };
}

// ------------------------------------------------------------------ communauté
/** Catégorie lue le plus récemment (`community_topic_views`) ; `null` si rien n'a été lu. */
export function lastReadCategory<T extends { forum_id: string; last_at: string | null }>(views: readonly T[]): T | null {
  return [...views].filter((v) => v.last_at).sort((a, b) => b.last_at!.localeCompare(a.last_at!))[0] ?? null;
}
