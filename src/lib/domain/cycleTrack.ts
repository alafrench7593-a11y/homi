/**
 * Mini-apps « Cycle et fertilité » (22/11/2026) — logique PURE et testée du geste commun aux journaux du cycle
 * (symptômes, douleur, pertes, saignements, journal, contraception, tests, glaire, rapports, PMA) :
 *  · une bande de jours (le jour choisi est conservé dans l'adresse) ;
 *  · un jour SANS saisie vaut `null` (« rien de noté »), JAMAIS 0 — une douleur notée « 0/10 » reste une valeur ;
 *  · les saisies d'un jour, rangées par heure (une saisie « de la journée », sans heure, passe en tête) ;
 *  · la correction d'un jour ou d'une heure garde le reste de l'horodatage ;
 *  · le résumé de la catégorie compte PAR APP (jours notés, saisies) et n'additionne jamais deux natures différentes.
 * Aucune donnée n'est interprétée : ce sont des faits notés, sans score ni déduction médicale.
 */
import { addDays, daysBetween, isValidISODate, toISODate } from './dates';

/** Une saisie datée (jour civil local) avec, si elle existe, son heure exacte. */
export interface DayItem { id: string; day: string; at?: string | null }
/** Bande de jours : `count` = nombre de saisies (null = rien de noté) ; `value` = valeur d'échelle (null = rien de noté). */
export interface StripDay { day: string; count: number | null; value: number | null }

/** Jour civil local d'un horodatage (« 2026-11-22T23:30:00+01:00 » → « 2026-11-22 » à Paris). */
export const localDay = (at: string): string => toISODate(new Date(at));

/** Valeur d'adresse « ?date= » / « ?day= » : jour valide, jamais dans le futur ; sinon `fallback` (aujourd'hui). */
export function parseDayParam(v: unknown, today: string, fallback = today): string {
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === 'string' && isValidISODate(s) && s <= today ? s : fallback;
}

/** `n` jours consécutifs finissant à `end` (du plus ancien au plus récent). */
export function lastDays(end: string, n: number): string[] {
  return Array.from({ length: Math.max(1, n) }, (_, i) => addDays(end, i - (Math.max(1, n) - 1)));
}

/**
 * Dernier jour affiché par une bande de `n` jours pour que le jour choisi soit visible : aujourd'hui tant que le jour
 * choisi est dans les `n` derniers jours, sinon une fenêtre qui le place au milieu (sans dépasser aujourd'hui).
 */
export function stripEnd(selected: string, today: string, n: number): string {
  if (daysBetween(selected, today) < n) return today;
  const end = addDays(selected, Math.floor(n / 2));
  return end > today ? today : end;
}

/** Saisies groupées par jour (ordre de la bande), chaque jour rangé par heure ; « journée » (sans heure) en tête. */
export function groupByDay<T extends DayItem>(items: readonly T[], days: readonly string[]): Record<string, T[]> {
  const out: Record<string, T[]> = Object.fromEntries(days.map((d) => [d, [] as T[]]));
  for (const it of items) if (out[it.day]) out[it.day].push(it);
  for (const d of days) out[d].sort(byTime);
  return out;
}
const byTime = (a: DayItem, b: DayItem) => (a.at ?? '').localeCompare(b.at ?? '') || a.id.localeCompare(b.id);

/** Saisies d'UN jour, rangées par heure. */
export const itemsOfDay = <T extends DayItem>(items: readonly T[], day: string): T[] => items.filter((x) => x.day === day).sort(byTime);

/**
 * Bande de jours d'un journal : nombre de saisies par jour (`null` = rien de noté) et, si `valueOf` est donné, la valeur
 * d'échelle du jour (la plus forte notée ; `null` si aucune valeur n'a été notée ce jour-là, même s'il y a des saisies).
 */
export function stripDays<T extends DayItem>(items: readonly T[], days: readonly string[], valueOf?: (x: T) => number | null | undefined): StripDay[] {
  const g = groupByDay(items, days);
  return days.map((day) => {
    const list = g[day];
    const vals = valueOf ? list.map(valueOf).filter((v): v is number => typeof v === 'number' && Number.isFinite(v)) : [];
    return { day, count: list.length ? list.length : null, value: vals.length ? Math.max(...vals) : null };
  });
}

/** Dernière saisie (jour puis heure les plus récents). */
export function lastItem<T extends DayItem>(items: readonly T[]): T | null {
  let best: T | null = null;
  for (const x of items) {
    if (!best || x.day > best.day || (x.day === best.day && (x.at ?? '') > (best.at ?? ''))) best = x;
  }
  return best;
}

/** Jours avec au moins une saisie parmi la bande, et nombre de saisies (même nature : celles d'une seule app). */
export function periodCount(strip: readonly StripDay[]): { days: number; entries: number } {
  return { days: strip.filter((d) => d.count != null).length, entries: strip.reduce((s, d) => s + (d.count ?? 0), 0) };
}

/** Valeur la plus forte notée sur la période (échelle), `null` si aucune — jamais 0 par défaut. */
export const periodMax = (strip: readonly StripDay[]): number | null => {
  const v = strip.map((d) => d.value).filter((x): x is number => x != null);
  return v.length ? Math.max(...v) : null;
};

/** Déplace un horodatage sur un autre jour civil en gardant son heure locale. */
export function moveToDay(at: string, day: string): string {
  const d = new Date(at);
  const [y, m, dd] = day.split('-').map(Number);
  const n = new Date(y, m - 1, dd, d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
  return n.toISOString();
}

/** Heure « HH:MM » appliquée à un horodatage (même jour civil) ; null si l'heure est invalide. */
export function withClock(at: string, text: string): string | null {
  const m = text.trim().replace('h', ':').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]); const mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  const d = new Date(at);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, mi).toISOString();
}

/** « HH:MM » local d'un horodatage. */
export const clockOf = (at: string): string => {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * Jour proposé par le correcteur (±1 j ou saisie « JJ/MM/AAAA ») : valide, jamais dans le futur ; sinon une raison.
 * `min` : jour le plus ancien accepté (ex. début d'un protocole).
 */
export function dayEditError(day: string | null, today: string, min?: string | null): 'bad' | 'future' | 'beforeMin' | null {
  if (!day || !isValidISODate(day)) return 'bad';
  if (day > today) return 'future';
  if (min && day < min) return 'beforeMin';
  return null;
}

/** Brouillon modifié ? (comparaison de valeurs simples et de listes, l'ordre d'une liste ne compte pas). */
export function draftChanged(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const x = a[k]; const y = b[k];
    if (Array.isArray(x) || Array.isArray(y)) {
      const xs = [...((x as unknown[]) ?? [])].map(String).sort(); const ys = [...((y as unknown[]) ?? [])].map(String).sort();
      if (xs.length !== ys.length || xs.some((v, i) => v !== ys[i])) return true;
    } else if (norm(x) !== norm(y)) return true;
  }
  return false;
}
const norm = (v: unknown) => (v == null || (typeof v === 'string' && v.trim() === '') ? null : typeof v === 'string' ? v.trim() : v);

// ─── Catégorie « Cycle et fertilité » ─────────────────────────────────────────────────────────────────────────

/** Une journée de la catégorie : les apps qui ont une saisie ce jour-là, chacune avec SON nombre (jamais additionnés). */
export interface CategoryDay { day: string; apps: { app: string; count: number }[] }

export function categoryDays(sources: Record<string, readonly DayItem[]>, days: readonly string[]): CategoryDay[] {
  const order = Object.keys(sources);
  return days.map((day) => ({
    day,
    apps: order.map((app) => ({ app, count: sources[app].filter((x) => x.day === day).length })).filter((a) => a.count > 0),
  }));
}

/** Par app : jours notés et saisies sur la période. Une app sans saisie n'apparaît pas (et ne vaut pas 0). */
export function categoryTotals(sources: Record<string, readonly DayItem[]>, days: readonly string[]): { app: string; days: number; entries: number }[] {
  const set = new Set(days);
  return Object.keys(sources).map((app) => {
    const inPeriod = sources[app].filter((x) => set.has(x.day));
    return { app, days: new Set(inPeriod.map((x) => x.day)).size, entries: inPeriod.length };
  }).filter((x) => x.entries > 0);
}

/**
 * Jours de règles NOTÉS (jamais estimés) : du début à la fin enregistrée ; des règles encore ouvertes couvrent du
 * début à aujourd'hui, dans la limite de `openMax` jours (une saisie oubliée ne colore pas tout le mois).
 */
export function periodDays(periods: readonly { id: string; start_date: string; end_date?: string | null }[], today: string, openMax = 10): DayItem[] {
  const out: DayItem[] = [];
  for (const p of periods) {
    if (p.start_date > today) continue;
    const end = p.end_date ?? (addDays(p.start_date, openMax - 1) < today ? addDays(p.start_date, openMax - 1) : today);
    const n = Math.min(daysBetween(p.start_date, end), 40);
    for (let i = 0; i <= n; i++) out.push({ id: `${p.id}:${i}`, day: addDays(p.start_date, i) });
  }
  return out;
}

// ─── Lecture (fiches pédagogiques longues) ────────────────────────────────────────────────────────────────────

/** Ajoute ou retire un favori (le plus récent en tête, sans doublon, 50 au plus). */
export function toggleFavorite(list: readonly string[], slug: string): string[] {
  return list.includes(slug) ? list.filter((x) => x !== slug) : [slug, ...list].slice(0, 50);
}

/** Fiche à reprendre : la dernière ouverte si elle existe encore dans le catalogue. */
export function resumeSlug(last: { slug: string } | null | undefined, known: readonly string[]): string | null {
  return last && known.includes(last.slug) ? last.slug : null;
}
