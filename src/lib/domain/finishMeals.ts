/**
 * Menu de la semaine, « Que puis-je cuisiner ? », Classements et Vaccins — fonctions pures du suivi (23/11/2026).
 * Aucune valeur inventée : un jour sans repas prévu vaut `null` (jamais 0), une date absente reste absente, une
 * correction ne renvoie que les colonnes réellement changées (le reste de la ligne n'est jamais réécrit).
 */
import { addDays } from './dates';
import { checkDate } from './careTrack';

// ------------------------------------------------------------------ menu
export interface SlotLike { day: number; meal: string; recipeId: string; servings: number; note?: string | null }
export interface PlanItemLike { id: string; day: number; meal: string; recipe_slug: string; servings: number; note: string | null }

/** Date d'un jour du menu (`start` = premier jour enregistré) ; menu pas encore enregistré → `null`. */
export const menuDayDate = (start: string | null | undefined, day: number): string | null => (start ? addDays(start.slice(0, 10), day) : null);

/**
 * Jour du menu gardé dans l'adresse (« ?day=2 ») : borné au menu ; sans paramètre, le jour qui tombe aujourd'hui si
 * le menu enregistré le couvre, sinon le premier.
 */
export function menuDayIndex(raw: string | null | undefined, days: number, start: string | null | undefined, today: string): number {
  const n = raw != null && /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (Number.isInteger(n) && n >= 0 && n < days) return n;
  if (start) {
    for (let d = 0; d < days; d++) if (menuDayDate(start, d) === today) return d;
  }
  return 0;
}

/** Un repère par jour du menu : nombre de repas prévus, `null` si aucun (jamais 0). */
export function menuDays(slots: readonly SlotLike[], days: number): { day: number; count: number | null; recipeIds: string[] }[] {
  return Array.from({ length: days }, (_, day) => {
    const of = slots.filter((s) => s.day === day);
    return { day, count: of.length || null, recipeIds: of.map((s) => s.recipeId) };
  });
}

/** Repas ouvert, gardé dans l'adresse : « ?slot=2-dinner ». */
export const slotKey = (s: Pick<SlotLike, 'day' | 'meal'>) => `${s.day}-${s.meal}`;
export function parseSlotKey(raw: string | null | undefined): { day: number; meal: string } | null {
  const m = raw ? /^(\d+)-([a-z_]+)$/.exec(raw) : null;
  return m ? { day: Number(m[1]), meal: m[2] } : null;
}

/** Ligne enregistrée qui correspond à ce repas (même jour, même repas, même recette), sinon `null`. */
export function savedItemOf(items: readonly PlanItemLike[], s: SlotLike): PlanItemLike | null {
  return items.find((i) => i.day === s.day && i.meal === s.meal && `rcp-${i.recipe_slug}` === s.recipeId) ?? null;
}

/** Correction d'un repas : personnes (1–12) et note. Erreur `'servings'` si le nombre est invalide. */
export function slotPatch(s: Pick<SlotLike, 'servings' | 'note'>, draft: { servings: string; note: string }): { ok: true; patch: { servings?: number; note?: string | null } } | { ok: false; reason: 'servings' } {
  const n = Number(draft.servings.trim().replace(',', '.'));
  if (!draft.servings.trim() || !Number.isInteger(n) || n < 1 || n > 12) return { ok: false, reason: 'servings' };
  const patch: { servings?: number; note?: string | null } = {};
  if (n !== s.servings) patch.servings = n;
  const note = draft.note.trim().slice(0, 500) || null;
  if (note !== (s.note ?? null)) patch.note = note;
  return { ok: true, patch };
}

/** Repas prévus AUJOURD'HUI dans le menu enregistré (remontée dans la catégorie), sinon `null`. */
export function todayMenu<T extends PlanItemLike>(plan: { start_date: string; days: number } | null | undefined, items: readonly T[], today: string): { day: number; items: T[] } | null {
  if (!plan) return null;
  for (let d = 0; d < plan.days; d++) {
    if (menuDayDate(plan.start_date, d) !== today) continue;
    const of = items.filter((i) => i.day === d);
    return of.length ? { day: d, items: of } : null;
  }
  return null;
}

// ------------------------------------------------------------------ garde-manger
export interface PantryStockLike { id: string; ingredient_key: string | null; qty_estimate: number | string | null; notes: string | null; created_at: string; updated_at: string }
const num = (v: number | string | null | undefined) => (v == null || v === '' ? null : Number(v));

/** Ingrédients à la maison, du plus récemment noté au plus ancien (date en colonne fixe). */
export function pantryRows<T extends PantryStockLike>(stocks: readonly T[]): T[] {
  return stocks.filter((s) => s.ingredient_key && num(s.qty_estimate) !== 0).slice().sort((a, b) => (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at));
}

/** Correction d'un ingrédient : quantité (vide = non comptée ; jamais négative, jamais 0 — 0 le retire) et note. */
export function stockPatch(s: Pick<PantryStockLike, 'qty_estimate' | 'notes'>, draft: { qty: string; note: string }): { ok: true; patch: { qty_estimate?: number | null; notes?: string | null } } | { ok: false; reason: 'qty' } {
  const raw = draft.qty.trim().replace(',', '.');
  const n = raw ? Number(raw) : null;
  if (n != null && (!Number.isFinite(n) || n <= 0 || n > 9999)) return { ok: false, reason: 'qty' };
  const patch: { qty_estimate?: number | null; notes?: string | null } = {};
  if (n !== num(s.qty_estimate)) patch.qty_estimate = n;
  const note = draft.note.trim().slice(0, 500) || null;
  if (note !== (s.notes ?? null)) patch.notes = note;
  return { ok: true, patch };
}

// ------------------------------------------------------------------ classements
/** Préférence d'une recette : 0 favorite, 1 neutre, 2 écartée des menus. */
export type Preference = 0 | 1 | 2;
export function preferenceOf(slug: string, favorites: readonly string[], dislikes: readonly string[]): Preference {
  return favorites.includes(slug) ? 0 : dislikes.includes(slug) ? 2 : 1;
}
/** Bascules à faire pour passer d'une préférence à l'autre (jamais favorite ET écartée à la fois). */
export function preferenceSteps(from: Preference, to: Preference): { favorite: boolean; dislike: boolean } {
  return { favorite: (from === 0) !== (to === 0), dislike: (from === 2) !== (to === 2) };
}

// ------------------------------------------------------------------ vaccins
export interface VaccinationLike { id: string; vaccine: string; given_on: string; dose_label: string | null; lot: string | null; given_by: string | null; source: string; note: string | null }

/** Registre du plus récent au plus ancien (date en colonne fixe). */
export const vaccinationsByDate = <T extends VaccinationLike>(list: readonly T[]): T[] => list.slice().sort((a, b) => b.given_on.localeCompare(a.given_on) || a.vaccine.localeCompare(b.vaccine));

/** Donnée principale : vaccins notés, dernier noté, doses du calendrier faites / prévues / reportées. */
export function vaccineFacts(list: readonly Pick<VaccinationLike, 'given_on'>[], schedule: readonly { state: string }[] | null): { count: number; last: string | null; done: number; planned: number; postponed: number } {
  const dates = list.map((v) => v.given_on).sort();
  const s = schedule ?? [];
  return { count: list.length, last: dates[dates.length - 1] ?? null, done: s.filter((x) => x.state === 'done').length, planned: s.filter((x) => x.state === 'planned').length, postponed: s.filter((x) => x.state === 'postponed').length };
}

export type VaccineDraft = { date: string; dose: string; lot: string; by: string; source: string; note: string };
export const SOURCES = ['carnet', 'professional', 'parent'] as const;

/**
 * Correction d'une ligne du registre : date obligatoire (jamais future, jamais avant la naissance), dose, lot, par qui,
 * source (indice dans `SOURCES`), note. Ne renvoie que les colonnes changées.
 */
export function vaccinePatch(v: VaccinationLike, draft: VaccineDraft, today: string, birthDate: string | null): { ok: true; patch: Record<string, string | null> } | { ok: false; reason: 'format' | 'future' | 'before' } {
  const c = checkDate(draft.date, today, { required: true, min: birthDate });
  if (!c.ok) return { ok: false, reason: c.reason };
  const patch: Record<string, string | null> = {};
  if (c.iso && c.iso !== v.given_on) patch.given_on = c.iso;
  const text = (x: string, max: number) => x.trim().slice(0, max) || null;
  const pairs: [keyof VaccinationLike, string | null][] = [['dose_label', text(draft.dose, 60)], ['lot', text(draft.lot, 40)], ['given_by', text(draft.by, 120)], ['note', text(draft.note, 1000)]];
  for (const [k, val] of pairs) if (val !== (v[k] ?? null)) patch[k] = val;
  const src = SOURCES[Number(draft.source)];
  if (src && src !== v.source) patch.source = src;
  return { ok: true, patch };
}

/** Remontée « Santé » : vaccins notés aujourd'hui et rendez-vous de vaccination d'aujourd'hui non faits. */
export function vaccinesOn<V extends Pick<VaccinationLike, 'given_on'>, A extends { starts_at: string; completed_at?: string | null }>(list: readonly V[], appts: readonly A[], day: string, dayOf: (stamp: string) => string): { given: V[]; appts: A[] } {
  return { given: list.filter((v) => v.given_on === day), appts: appts.filter((a) => !a.completed_at && dayOf(a.starts_at) === day) };
}
