/**
 * Famille et couple — fin du suivi (23/11/2026) : fonctions PURES des six mini-apps finies (bilan de la semaine,
 * je décroche, vider ma tête, ma place, agenda, charge mentale). Module i18n `finishFamily` (préfixe `ff.`).
 * Mêmes règles que `homeTrack` : rien de noté = `null` (jamais 0 inventé), on n'additionne que des grandeurs de même
 * nature, aucune note ni classement de personne.
 */
import { atMinutes, hmText, minutesOf, mondayOfDay, offDutyEnd, parseHm } from './homeTrack';
import { frDayToIso, isoDay, shiftDay } from './journalTrack';

// ------------------------------------------------------------------ droits
export interface MembershipLite { role: string; can_edit?: readonly string[] | null }
/**
 * Corriger une tâche, un domaine, un événement du foyer : propriétaire, ou membre ayant le droit d'édition « listes »
 * (même règle que l'accueil, l'agenda et la barre du bas). Sans foyer : rien n'est corrigeable.
 */
export function canEditLists(m: MembershipLite | null | undefined): boolean {
  return !!m && (m.role === 'owner' || (m.can_edit ?? []).includes('lists'));
}

// ------------------------------------------------------------------ correction d'une tâche (qui la porte)
export interface TaskFixable { id: string; title: string; assignee_id: string | null; due_at: string | null; status: 'todo' | 'done' | 'cancelled'; mission_state?: string | null }
export interface TaskFixDraft { title: string; who: string; due: string; time: string }

/** Une mission ne se corrige jamais ici (elle avance par ses réponses, dans « Missions »). */
export const taskLocked = (t: Pick<TaskFixable, 'mission_state' | 'status'>) => !!t.mission_state || t.status === 'cancelled';

const pad = (n: number) => String(n).padStart(2, '0');
/** Valeurs de départ de la fiche : choix = indice de la personne (people.length = « personne »). */
export function taskDraftOf(t: TaskFixable, people: readonly string[]): TaskFixDraft {
  const i = t.assignee_id ? people.indexOf(t.assignee_id) : -1;
  const d = t.due_at ? new Date(t.due_at) : null;
  return {
    title: t.title,
    who: String(i >= 0 ? i : people.length),
    due: d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : '',
    time: d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '',
  };
}

/**
 * Brouillon → changements à écrire (seulement les champs modifiés, pour l'écriture à la version lue de `useSaveTask`).
 * `withDue` : l'échéance est corrigeable (tâche à faire) ; une date sans heure garde l'heure d'avant (18:00 sinon).
 */
export function taskFixPatch(t: TaskFixable, d: TaskFixDraft, people: readonly string[], withDue: boolean):
  { error: 'title' | 'badDate' | 'badTime' } | { patch: Partial<Pick<TaskFixable, 'title' | 'assignee_id' | 'due_at'>> } {
  const title = d.title.trim().slice(0, 120);
  if (!title) return { error: 'title' };
  const i = Number(d.who);
  const assignee = Number.isInteger(i) && i >= 0 && i < people.length ? people[i] : null;
  const patch: Partial<Pick<TaskFixable, 'title' | 'assignee_id' | 'due_at'>> = {};
  if (title !== t.title) patch.title = title;
  if (assignee !== t.assignee_id) patch.assignee_id = assignee;
  if (withDue) {
    const before = taskDraftOf(t, people);
    if (d.due.trim() !== before.due || d.time.trim() !== before.time) {
      if (!d.due.trim()) patch.due_at = null;
      else {
        const day = frDayToIso(d.due);
        if (!day) return { error: 'badDate' };
        const m = d.time.trim() ? parseHm(d.time) : 18 * 60;
        if (m == null) return { error: 'badTime' };
        const [y, mo, dd] = day.split('-').map(Number);
        const iso = new Date(y, mo - 1, dd, Math.floor(m / 60), m % 60).toISOString();
        if (iso !== t.due_at) patch.due_at = iso;
      }
    }
  }
  return { patch };
}

// ------------------------------------------------------------------ bilan de la semaine
export interface ReviewTask { id: string; status: 'todo' | 'done' | 'cancelled'; done_at: string | null; created_at?: string }
export interface ReviewRequest { created_at: string }
export interface ReviewShift { kind: string; status: string; starts_at: string }

const inWeek = (iso: string | null | undefined, monday: string) => {
  if (!iso) return false;
  const d = isoDay(new Date(iso));
  return d >= monday && d < shiftDay(monday, 7);
};

/**
 * Une semaine (lundi → dimanche) du bilan : tâches faites (triées par heure), demandes, nuits et temps pour soi de
 * cette semaine. Chaque compteur reste dans sa case ; rien de fait = `null`.
 */
export function reviewOfWeek<T extends ReviewTask>(o: { tasks: readonly T[]; requests: readonly ReviewRequest[]; shifts: readonly ReviewShift[]; monday: string }) {
  const done = o.tasks.filter((t) => t.status === 'done' && inWeek(t.done_at, o.monday)).sort((a, b) => (a.done_at! < b.done_at! ? -1 : 1));
  const live = o.shifts.filter((s) => s.status !== 'cancelled' && inWeek(s.starts_at, o.monday));
  return {
    done,
    doneCount: done.length ? done.length : null,
    requests: o.requests.filter((r) => inWeek(r.created_at, o.monday)).length,
    nights: live.filter((s) => s.kind === 'night').length,
    rest: live.filter((s) => s.kind === 'me_time').length,
  };
}

// ------------------------------------------------------------------ je décroche
export interface OffDutyLike { id: string; user_id: string; starts_at: string; ends_at: string }
/** Pauses d'une semaine (début dans la semaine), les plus récentes d'abord, et MES minutes de pause (null si aucune). */
export function offDutyWeek<T extends OffDutyLike>(periods: readonly T[], monday: string, me: string | null, now: Date) {
  const list = periods.filter((p) => inWeek(p.starts_at, monday)).sort((a, b) => (a.starts_at < b.starts_at ? 1 : -1));
  const mine = list.filter((p) => p.user_id === me);
  const minutes = mine.reduce((s, p) => s + Math.max(0, Math.min(Date.parse(p.ends_at), now.getTime()) - Date.parse(p.starts_at)) / 60000, 0);
  return { list, mine: mine.length, minutes: mine.length ? Math.round(minutes) : null };
}
/** Une pause se corrige seulement par la personne qui l'a prise, et tant qu'elle est en cours. */
export const offDutyEditable = (p: OffDutyLike, me: string | null, now: Date) => !!me && p.user_id === me && Date.parse(p.ends_at) > now.getTime();
/**
 * Nouvelle fin d'une pause en cours (« 18:30 ») : la prochaine occurrence de cette heure, après maintenant, et au plus
 * 24 h après le DÉBUT de la pause (règle du serveur : ends_at <= starts_at + 24 h).
 */
export function offDutyEndEdit(p: Pick<OffDutyLike, 'starts_at'>, text: string, now: Date): { error: 'badTime' | 'tooLong' } | { ends_at: string } {
  const r = offDutyEnd(text, now);
  if ('error' in r) return r;
  if (Date.parse(r.ends_at) - Date.parse(p.starts_at) > 24 * 3600000) return { error: 'tooLong' };
  return r;
}
/** Rappels mis en pause PAR cette pause (leur reprise suit la fin corrigée). */
export function snoozedBy<T extends { snoozed_until: string | null; category?: string | null }>(reminders: readonly T[], endsAt: string): T[] {
  const end = Date.parse(endsAt);
  return reminders.filter((r) => r.snoozed_until && Math.abs(Date.parse(r.snoozed_until) - end) < 1000 && r.category !== 'medication');
}

// ------------------------------------------------------------------ vider ma tête
export interface CreatedTask { id: string; created_by: string | null; created_at: string; routine_id?: string | null }
/** Ce que j'ai noté (tâches créées par moi, hors routines) : par jour, et la liste d'un jour (triée par heure). */
export function notedByMe<T extends CreatedTask>(tasks: readonly T[], me: string | null, day: string) {
  const mine = me ? tasks.filter((t) => t.created_by === me && !t.routine_id) : [];
  return { mine, ofDay: mine.filter((t) => isoDay(new Date(t.created_at)) === day).sort((a, b) => (a.created_at < b.created_at ? -1 : 1)) };
}

// ------------------------------------------------------------------ ma place
export interface PlaceTask { id: string; status: 'todo' | 'done' | 'cancelled'; assignee_id: string | null; due_at: string | null; mission_state?: string | null }
/** Mes tâches ouvertes (hors missions, qui ont leur écran) : en retard, cette semaine, plus tard ; triées par échéance. */
export function myOpenTasks<T extends PlaceTask>(tasks: readonly T[], me: string | null, now: Date) {
  const mine = me ? tasks.filter((t) => t.status === 'todo' && t.assignee_id === me && !t.mission_state) : [];
  const sorted = [...mine].sort((a, b) => (a.due_at ?? '9999') < (b.due_at ?? '9999') ? -1 : (a.due_at ?? '9999') > (b.due_at ?? '9999') ? 1 : 0);
  const end = Date.parse(`${shiftDay(mondayOfDay(isoDay(now)), 7)}T00:00:00`);
  const late = mine.filter((t) => t.due_at && Date.parse(t.due_at) < now.getTime()).length;
  const week = mine.filter((t) => t.due_at && Date.parse(t.due_at) >= now.getTime() && Date.parse(t.due_at) < end).length;
  return { list: sorted, total: mine.length ? mine.length : null, late, week };
}

// ------------------------------------------------------------------ agenda
export interface CalItemLite { source: string }
/** Comptes de la période affichée, par nature (aucun total mélangé dans les cases). */
export function calendarCounts(items: readonly CalItemLite[]) {
  return {
    total: items.length ? items.length : null,
    appointments: items.filter((i) => i.source === 'appointment').length,
    tasks: items.filter((i) => i.source === 'task').length,
    events: items.filter((i) => i.source === 'event').length,
  };
}
export interface EventFixable { title: string; starts_at: string; ends_at: string | null; all_day: boolean; location_label: string | null }
/** Valeurs de départ de la fiche d'un événement (heures « 18:30 »). */
export function eventDraftOf(e: EventFixable): { title: string; from: string; to: string; place: string } {
  return { title: e.title, from: e.all_day ? '' : hmText(minutesOf(e.starts_at)), to: e.all_day || !e.ends_at ? '' : hmText(minutesOf(e.ends_at)), place: e.location_label ?? '' };
}
/** Correction rapide d'un événement : titre, heures (même jour), lieu. Seuls les champs modifiés partent. */
export function eventFixPatch(e: EventFixable, d: { title: string; from: string; to: string; place: string }):
  { error: 'title' | 'badTime' | 'order' } | { patch: Partial<EventFixable> } {
  const title = d.title.trim().slice(0, 120);
  if (!title) return { error: 'title' };
  const patch: Partial<EventFixable> = {};
  if (title !== e.title) patch.title = title;
  const place = d.place.trim().slice(0, 160) || null;
  if (place !== (e.location_label ?? null)) patch.location_label = place;
  if (!e.all_day && (d.from.trim() !== eventDraftOf(e).from || d.to.trim() !== eventDraftOf(e).to)) {
    const f = parseHm(d.from);
    const t = d.to.trim() ? parseHm(d.to) : null;
    if (f == null || (d.to.trim() && t == null)) return { error: 'badTime' };
    if (t != null && t <= f) return { error: 'order' };
    const starts = atMinutes(e.starts_at, f);
    const ends = t == null ? null : atMinutes(e.starts_at, t);
    if (starts !== new Date(e.starts_at).toISOString()) patch.starts_at = starts;
    if (ends !== (e.ends_at ? new Date(e.ends_at).toISOString() : null)) patch.ends_at = ends;
  }
  return { patch };
}
