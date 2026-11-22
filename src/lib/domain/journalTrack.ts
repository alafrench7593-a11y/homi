/**
 * Journaux et rendez-vous, Foyer (22/11/2026) — regroupements PURS, testés (src/__tests__/journalTrack.test.ts).
 * Une seule donnée source : les lignes des tables existantes (food_tastings, appointments, family_tasks,
 * shopping_items) ; rien n'est recopié ni additionné entre natures différentes.
 *
 *  - Semaine : du lundi au dimanche, en jours civils LOCAUX (« 2025-01-20 »), décalable d'une semaine.
 *  - Rendez-vous : prévu (à venir), réalisé (`completed_at` posé), passé sans confirmation (« à confirmer »).
 *    Le statut « reporté » n'existe pas dans la donnée : il n'est jamais deviné.
 *  - Restant / terminé : ce qui reste d'abord (ordre d'origine), ce qui est terminé ensuite (le plus récent d'abord).
 *  - Dégustations : regroupées par aliment (clé du catalogue, sinon nom replié), la première de chaque aliment est
 *    repérée. Une note n'est jamais interprétée (aucune déduction d'allergie ou de réaction).
 */

// ─── Jours et semaines ──────────────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');
/** Jour civil local « AAAA-MM-JJ ». */
export const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Midi local du jour (évite les surprises d'heure d'été). */
export const dayDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d, 12); };

/** Jour lu dans l'adresse : seulement une date réelle « AAAA-MM-JJ », sinon null. */
export function parseIsoDay(s: string | string[] | null | undefined): string | null {
  const v = Array.isArray(s) ? s[0] : s;
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = dayDate(v);
  return isoDay(d) === v ? v : null;
}

export const shiftDay = (iso: string, n: number) => { const d = dayDate(iso); return isoDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12)); };

/** Les 7 jours (lundi → dimanche) de la semaine qui contient `iso`. */
export function weekDays(iso: string): string[] {
  const d = dayDate(iso);
  const back = (d.getDay() + 6) % 7; // lundi = 0
  const monday = shiftDay(iso, -back);
  return Array.from({ length: 7 }, (_, i) => shiftDay(monday, i));
}

/** Bornes de la semaine, pour « Semaine du 20 au 26 janv. » (même mois) ou « du 27 janv. au 2 févr. ». */
export function weekRange(iso: string): { start: string; end: string; sameMonth: boolean; sameYear: boolean } {
  const days = weekDays(iso);
  const start = days[0]; const end = days[6];
  return { start, end, sameMonth: start.slice(0, 7) === end.slice(0, 7), sameYear: start.slice(0, 4) === end.slice(0, 4) };
}

/** Jour civil local d'un horodatage ISO. */
export const dayOfStamp = (stamp: string) => isoDay(new Date(stamp));

// ─── Rendez-vous ────────────────────────────────────────────────────────────────────────────────

export type ApptStatus = 'planned' | 'done' | 'to_confirm';
export interface ApptLike { id: string; starts_at: string; completed_at?: string | null }

/**
 * Statut d'un rendez-vous selon la donnée : réalisé si `completed_at` est posé ; prévu tant que l'heure n'est pas
 * passée d'une heure ; sinon « à confirmer » (passé, personne ne l'a marqué réalisé). Jamais « reporté » (absent).
 */
export function apptStatus(a: ApptLike, now: Date): ApptStatus {
  if (a.completed_at) return 'done';
  return Date.parse(a.starts_at) >= now.getTime() - 3600_000 ? 'planned' : 'to_confirm';
}

/** Rendez-vous de chaque jour demandé (clé = jour local), triés par heure. Un jour sans rendez-vous → liste vide. */
export function apptsByDay<T extends ApptLike>(list: readonly T[], days: readonly string[]): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const d of days) out[d] = [];
  for (const a of list) { const k = dayOfStamp(a.starts_at); if (out[k]) out[k].push(a); }
  for (const d of days) out[d].sort((x, y) => Date.parse(x.starts_at) - Date.parse(y.starts_at));
  return out;
}

/** Nombre de rendez-vous par statut sur une liste (compte d'événements, jamais une durée). */
export function countByStatus(list: readonly ApptLike[], now: Date): Record<ApptStatus, number> {
  const out: Record<ApptStatus, number> = { planned: 0, done: 0, to_confirm: 0 };
  for (const a of list) out[apptStatus(a, now)]++;
  return out;
}

/** Jour sélectionné au départ : celui de l'adresse, sinon aujourd'hui. */
export const initialDay = (param: string | string[] | null | undefined, now: Date) => parseIsoDay(param) ?? isoDay(now);

// ─── Restant / terminé ──────────────────────────────────────────────────────────────────────────

/**
 * Sépare ce qui reste de ce qui est terminé. Restant : ordre d'origine. Terminé : le plus récent d'abord (sans date
 * de validation : à la fin, dans l'ordre d'origine).
 */
export function splitRemaining<T>(items: readonly T[], isDone: (x: T) => boolean, doneAt: (x: T) => string | null | undefined): { remaining: T[]; done: T[] } {
  const remaining: T[] = []; const done: { x: T; i: number; at: number }[] = [];
  items.forEach((x, i) => {
    if (isDone(x)) { const s = doneAt(x); const at = s ? Date.parse(s) : NaN; done.push({ x, i, at: Number.isFinite(at) ? at : -Infinity }); } else remaining.push(x);
  });
  done.sort((a, b) => (b.at - a.at) || (a.i - b.i));
  return { remaining, done: done.map((d) => d.x) };
}

/** Qui a validé et quand, seulement si la donnée existe (sinon null : on n'affiche rien d'inventé). */
export function doneBy(by: string | null | undefined, at: string | null | undefined): { by: string | null; at: string | null } | null {
  if (!by && !at) return null;
  return { by: by ?? null, at: at ?? null };
}

export interface TaskLike { status: 'todo' | 'done' | 'cancelled'; assignee_id: string | null; created_by?: string | null; mission_state?: string | null }
export type ToggleBlock = 'mission_recipient' | 'mission_closed' | 'cancelled' | null;

/**
 * Cocher / rouvrir une tâche selon les droits :
 *  - tâche simple : tout membre du foyer peut la cocher et la rouvrir ;
 *  - mission confiée : seul son destinataire peut la terminer (règle du serveur, mission_respond) ; une mission
 *    terminée ou annulée est close et ne se rouvre pas ;
 *  - tâche annulée : rien à cocher.
 */
export function taskToggle(task: TaskLike, me: string | null): { action: 'complete' | 'reopen'; allowed: boolean; block: ToggleBlock } {
  const action = task.status === 'done' ? 'reopen' : 'complete';
  if (task.status === 'cancelled') return { action, allowed: false, block: 'cancelled' };
  if (task.mission_state) {
    if (task.status === 'done' || task.mission_state === 'done' || task.mission_state === 'cancelled') return { action, allowed: false, block: 'mission_closed' };
    if (!me || task.assignee_id !== me) return { action, allowed: false, block: 'mission_recipient' };
  }
  return { action, allowed: true, block: null };
}

// ─── Dégustations par aliment ───────────────────────────────────────────────────────────────────

export interface TastingLike { id: string; food_key: string | null; food_name: string; tasted_on: string; created_at?: string | null }

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
/** Clé d'aliment : celle du catalogue, sinon le nom replié (« Poire » et « poire » sont le même aliment). */
export const foodGroupKey = (t: Pick<TastingLike, 'food_key' | 'food_name'>) => t.food_key ?? `name:${fold(t.food_name)}`;

/** Plus récent d'abord : date de dégustation, puis ordre de saisie. */
const recentFirst = (a: TastingLike, b: TastingLike) => b.tasted_on.localeCompare(a.tasted_on) || (b.created_at ?? '').localeCompare(a.created_at ?? '') || b.id.localeCompare(a.id);

/** Dégustations regroupées par aliment, chaque groupe du plus récent au plus ancien ; groupes par dernière dégustation. */
export function tastingsByFood<T extends TastingLike>(list: readonly T[]): { key: string; food_key: string | null; food_name: string; tastings: T[]; first: T; last: T }[] {
  const m = new Map<string, T[]>();
  for (const t of list) { const k = foodGroupKey(t); const a = m.get(k); if (a) a.push(t); else m.set(k, [t]); }
  return [...m.entries()].map(([key, arr]) => {
    const tastings = [...arr].sort(recentFirst);
    return { key, food_key: tastings[0].food_key, food_name: tastings[0].food_name, tastings, first: tastings[tastings.length - 1], last: tastings[0] };
  }).sort((a, b) => recentFirst(a.last, b.last));
}

/** Identifiants des premières dégustations de chaque aliment (« Première dégustation »). */
export function firstTastingIds(list: readonly TastingLike[]): Set<string> {
  return new Set(tastingsByFood(list).map((g) => g.first.id));
}

/** Journal d'UN aliment (plus récent d'abord) ; vide si rien n'est noté. */
export function foodJournal<T extends TastingLike>(list: readonly T[], key: string): T[] {
  return list.filter((t) => foodGroupKey(t) === key).sort(recentFirst);
}

/**
 * Première date de dégustation d'un aliment après correction d'une ligne (`changedId` → `newDate`) ; null s'il n'en
 * reste aucune. Sert à garder la fiche de l'aliment (first_tried_on) cohérente avec son journal.
 */
export function firstTriedAfter(list: readonly TastingLike[], key: string, changedId: string | null, newDate: string | null): string | null {
  const dates = list.filter((t) => foodGroupKey(t) === key && t.id !== changedId).map((t) => t.tasted_on);
  if (newDate) dates.push(newDate);
  return dates.length ? dates.sort()[0] : null;
}

/** Date saisie « JJ/MM/AAAA » → « AAAA-MM-JJ » (date réelle) ; sinon null. */
export function frDayToIso(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return null;
  return parseIsoDay(`${m[3]}-${pad(Number(m[2]))}-${pad(Number(m[1]))}`);
}
export const isoToFrDay = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
