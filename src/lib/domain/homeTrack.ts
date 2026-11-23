/**
 * Foyer, couple, école et repas (22/11/2026) — fonctions PURES des mini-apps de suivi (module i18n `homeTrack`).
 * Règles : une journée / une semaine sans saisie vaut `null` (« rien de noté »), jamais 0 ; on n'additionne que des
 * grandeurs de même nature (minutes avec minutes, étapes avec étapes) ; aucun score inventé.
 */
import { dayDate, isoDay, shiftDay } from './journalTrack';

/** Nombre d'éléments par jour ; un jour sans élément vaut `null` (« rien de noté »), jamais 0. */
export function countByDay<T>(items: readonly T[], days: readonly string[], dayOf: (x: T) => string | null | undefined): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const d of days) out[d] = null;
  for (const x of items) {
    const d = dayOf(x);
    if (d && d in out) out[d] = (out[d] ?? 0) + 1;
  }
  return out;
}

/** Lundi (AAAA-MM-JJ) de la semaine d'un jour. */
export function mondayOfDay(day: string): string {
  const d = dayDate(day);
  const dow = (d.getDay() + 6) % 7;
  return shiftDay(day, -dow);
}

/** « 18:30 », « 18h30 », « 18 h », « 7h » → minutes depuis minuit ; `null` si illisible. */
export function parseHm(s: string): number | null {
  const m = /^\s*(\d{1,2})\s*(?:h|:)\s*(\d{0,2})\s*$/i.exec(s) ?? /^\s*(\d{1,2})\s*$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = m[2] ? Number(m[2]) : 0;
  if (h > 23 || mi > 59 || (m[2] && m[2].length === 1)) return null;
  return h * 60 + mi;
}
const pad = (n: number) => String(n).padStart(2, '0');
/** Minutes depuis minuit → « 18:30 » (champ de saisie). */
export const hmText = (min: number) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;
/** Heure locale d'un instant → minutes depuis minuit. */
export const minutesOf = (iso: string) => { const d = new Date(iso); return d.getHours() * 60 + d.getMinutes(); };
/** Même jour local que `iso`, à `min` minutes depuis minuit. */
export function atMinutes(iso: string, min: number): string {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(min / 60), min % 60).toISOString();
}
/** Jour local `day` à `min` minutes depuis minuit. */
export function dayAtMinutes(day: string, min: number): string {
  const d = dayDate(day);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(min / 60), min % 60).toISOString();
}

// ------------------------------------------------------------------ routines de l'enfant
export interface KidRoutineLike { id: string; steps: readonly unknown[]; active?: boolean }
export interface KidCheckLike { routine_id: string; step: number; on_date: string; done_by: string | null; created_at: string }

/** Étapes cochées le jour donné : total, fait, reste, dernière coche (qui, quand) ; `null` si aucune routine. */
export function kidProgress(routines: readonly KidRoutineLike[], checks: readonly KidCheckLike[], day: string) {
  const live = routines.filter((r) => r.active !== false);
  if (!live.length) return null;
  const ids = new Map(live.map((r) => [r.id, r.steps.length]));
  const seen = new Set<string>();
  const dayChecks = checks.filter((c) => {
    const n = ids.get(c.routine_id);
    if (c.on_date !== day || n == null || c.step < 0 || c.step >= n) return false;
    const k = `${c.routine_id}:${c.step}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const total = live.reduce((n, r) => n + r.steps.length, 0);
  const done = dayChecks.length;
  const last = [...dayChecks].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] ?? null;
  const perRoutine: Record<string, { total: number; done: number }> = {};
  for (const r of live) perRoutine[r.id] = { total: r.steps.length, done: dayChecks.filter((c) => c.routine_id === r.id).length };
  return { total, done, remaining: total - done, last: last ? { by: last.done_by, at: last.created_at } : null, perRoutine };
}

/** Coches à écrire / effacer pour passer de `before` à `after` (étapes d'une routine, un jour). */
export function stepDiff(before: readonly number[], after: readonly number[]): { add: number[]; remove: number[] } {
  const b = new Set(before);
  const a = new Set(after);
  return { add: [...a].filter((x) => !b.has(x)).sort((x, y) => x - y), remove: [...b].filter((x) => !a.has(x)).sort((x, y) => x - y) };
}

// ------------------------------------------------------------------ stocks
/** Quantité estimée ± pas (jamais négative) ; « non renseignée » + pas positif part de 0. */
export function stepQty(q: number | string | null | undefined, delta: number): number | null {
  if (q == null || q === '') return delta > 0 ? delta : null;
  const n = Number(q);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.round((n + delta) * 100) / 100);
}
/** Saisie libre d'une quantité (« 2,5 ») : nombre ≥ 0, `null` si vide, `'bad'` si illisible. */
export function parseQty(s: string): number | null | 'bad' {
  const v = s.trim().replace(',', '.');
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n < 100000 ? Math.round(n * 100) / 100 : 'bad';
}

// ------------------------------------------------------------------ papiers
/** Jours entre aujourd'hui et une date (négatif si passée). */
export function daysUntil(today: string, iso: string): number {
  return Math.round((dayDate(iso).getTime() - dayDate(today).getTime()) / 86400000);
}
export interface PaperLike { id: string; expires_on: string | null }
/** Prochaine échéance à venir (ou la plus récente dépassée) ; `null` si aucune date n'est notée. */
export function nextExpiry<T extends PaperLike>(papers: readonly T[], today: string): { paper: T; days: number } | null {
  const dated = papers.filter((p) => !!p.expires_on).map((p) => ({ paper: p, days: daysUntil(today, p.expires_on!) }));
  if (!dated.length) return null;
  const upcoming = dated.filter((x) => x.days >= 0).sort((a, b) => a.days - b.days);
  if (upcoming.length) return upcoming[0];
  return dated.sort((a, b) => b.days - a.days)[0];
}

// ------------------------------------------------------------------ créneaux (temps pour moi, garde)
export interface ShiftLike { user_id: string; kind: string; starts_at: string; ends_at: string; status: string }
/** Minutes réservées sur une semaine (lundi → dimanche), même nature uniquement ; `null` si rien de noté. */
export function weekMinutes(shifts: readonly ShiftLike[], monday: string, filter: (s: ShiftLike) => boolean): number | null {
  const a = dayDate(monday); a.setHours(0, 0, 0, 0);
  const b = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 7);
  let total: number | null = null;
  for (const s of shifts) {
    if (s.status === 'cancelled' || !filter(s)) continue;
    const st = Math.max(Date.parse(s.starts_at), a.getTime());
    const en = Math.min(Date.parse(s.ends_at), b.getTime());
    if (en <= st) continue;
    total = (total ?? 0) + Math.round((en - st) / 60000);
  }
  return total;
}
/** Correction d'un créneau : heures « 14:00 » → « 15:30 » sur le jour du début ; message d'erreur ou instants. */
export function shiftEdit(startIso: string, fromText: string, toText: string): { error: 'badTime' | 'order' } | { starts_at: string; ends_at: string } {
  const f = parseHm(fromText);
  const t = parseHm(toText);
  if (f == null || t == null) return { error: 'badTime' };
  if (t <= f) return { error: 'order' };
  return { starts_at: atMinutes(startIso, f), ends_at: atMinutes(startIso, t) };
}

// ------------------------------------------------------------------ point de couple
export interface CheckinLike { week_of: string; heavy: string | null; decisions: string | null; thanks: string | null }
/** Questions remplies (0 à 3) ; `null` si la semaine n'a pas de point noté. */
export function checkinFilled(c: CheckinLike | null | undefined): number | null {
  if (!c) return null;
  const n = [c.heavy, c.decisions, c.thanks].filter((x) => !!x && x.trim()).length;
  return n || null;
}

// ------------------------------------------------------------------ je décroche
/** Minutes restantes d'une pause (0 si terminée). */
export const minutesLeft = (endsAt: string, now: Date) => Math.max(0, Math.ceil((Date.parse(endsAt) - now.getTime()) / 60000));
/** Nouvelle fin de pause « 18:30 » : aujourd'hui (ou demain si l'heure est passée), au plus 24 h après maintenant. */
export function offDutyEnd(text: string, now: Date): { error: 'badTime' | 'tooLong' } | { ends_at: string } {
  const m = parseHm(text);
  if (m == null) return { error: 'badTime' };
  let d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Math.floor(m / 60), m % 60);
  if (d.getTime() <= now.getTime()) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, Math.floor(m / 60), m % 60);
  if (d.getTime() - now.getTime() > 24 * 3600000) return { error: 'tooLong' };
  return { ends_at: d.toISOString() };
}

// ------------------------------------------------------------------ tâches (charge, bilan)
export interface TaskLite { id: string; status: 'todo' | 'done' | 'cancelled'; assignee_id: string | null; done_by: string | null; done_at: string | null; due_at: string | null; routine_id?: string | null }
/** Tâches faites par personne sur la semaine (lundi → dimanche) ; ouvertes par personne ; `null` si rien de fait. */
export function shareOfWeek(tasks: readonly TaskLite[], monday: string, people: readonly string[]) {
  const days = new Set(Array.from({ length: 7 }, (_, i) => shiftDay(monday, i)));
  const done = tasks.filter((t) => t.status === 'done' && t.done_at && days.has(isoDay(new Date(t.done_at))));
  const rows = people.map((id) => ({ id, done: done.filter((t) => (t.done_by ?? t.assignee_id) === id).length, open: tasks.filter((t) => t.status === 'todo' && t.assignee_id === id).length }));
  const unassigned = tasks.filter((t) => t.status === 'todo' && !t.assignee_id).length;
  return { total: done.length ? done.length : null, rows, unassigned };
}

// ------------------------------------------------------------------ carte « Foyer » de l'accueil
export interface RequestLite { id: string; from_user: string; to_user: string | null; status: string; kind: string; created_at: string }
export interface EventLite { id: string; title: string; starts_at: string; child_id?: string | null }
export interface MemberRights { role: string; can_view?: readonly string[] | null; child_scope?: readonly string[] | null }
/** L'agenda familial n'est visible que du propriétaire ou d'un membre ayant « listes » (et dans son périmètre d'enfants). */
export function canSeeEvent(m: MemberRights | null | undefined, e: Pick<EventLite, 'child_id'>): boolean {
  if (!m) return false;
  if (m.role !== 'owner' && !(m.can_view ?? []).includes('lists')) return false;
  if (e.child_id && m.child_scope && !m.child_scope.includes(e.child_id)) return false;
  return true;
}
/** Relais à consulter (demandes ouvertes qui me sont adressées), tâches ouvertes, prochain événement visible. */
export function householdHome(p: { me: string | null; requests: readonly RequestLite[]; tasks: readonly TaskLite[]; events: readonly EventLite[]; member: MemberRights | null; now: Date }) {
  const relays = p.me ? p.requests.filter((r) => r.status === 'open' && r.from_user !== p.me && (r.to_user === p.me || r.to_user == null)) : [];
  const open = p.tasks.filter((t) => t.status === 'todo');
  const mine = p.me ? open.filter((t) => t.assignee_id === p.me).length : 0;
  const next = p.events.filter((e) => Date.parse(e.starts_at) >= p.now.getTime() && canSeeEvent(p.member, e)).sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1))[0] ?? null;
  return { relays: relays.length, open: open.length, mine, next };
}
