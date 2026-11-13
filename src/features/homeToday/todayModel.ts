/**
 * « Aujourd'hui dans le foyer » (Accueil) : logique pure, testée (src/__tests__/homeToday.test.ts).
 * Aucune donnée inventée : tout vient des tables existantes (family_tasks — tâches simples ET missions —,
 * family_events, appointments, care_shifts, custody_plans / custody_exceptions).
 * Les droits affichés ici ne décident de rien : le serveur tranche (mission_respond, politiques du foyer).
 * Ils servent seulement à ne pas proposer « Terminer » à quelqu'un qui ne le peut pas (la mission d'un autre).
 */
import type { CareShift, FamilyTask } from '@/lib/domain/familyLoad';
import { isMission, isTerminal, nextState, viewerOf, type Mission, type MissionState } from '@/lib/domain/missions';
import { addDays, atLocal, dayKey, itemsBetween, type CalendarItem, type FamilyEvent } from '@/lib/domain/calendar';
import { custodyDays, type CustodyException, type Side } from '@/lib/domain/custody';

/** Statut affiché d'une ligne : état fin d'une mission, ou statut d'une tâche simple. */
export type TodayStatus = MissionState | 'todo' | 'open';

export type TaskLike = FamilyTask & Partial<Pick<Mission, 'mission_state' | 'all_day' | 'version'>>;

export interface TodayTask {
  id: string;
  title: string;
  kind: 'mission' | 'task';
  /** Personne qui s'en charge (null : à prendre). */
  ownerId: string | null;
  /** Échéance ISO (null : dans la journée, sans heure). */
  dueAt: string | null;
  /** Heure significative (échéance aujourd'hui, pas « toute la journée »). */
  timed: boolean;
  /** Échéance d'un jour précédent, pas encore faite. */
  late: boolean;
  status: TodayStatus;
  done: boolean;
  /** Mission qui attend MA réponse (à accepter / reportée, dont je suis destinataire ou à prendre). */
  awaitsMe: boolean;
  /** Je peux la terminer d'ici (destinataire d'une mission, ou tâche simple à moi / à prendre avec le droit d'écrire). */
  canComplete: boolean;
  /** Je peux l'accepter d'ici (mission à accepter qui m'attend). */
  canAccept: boolean;
  version?: number;
  rank: number;
  raw: TaskLike;
}

const startOfDay = (now: Date) => atLocal(dayKey(now)).getTime();
const endOfDay = (now: Date) => atLocal(addDays(dayKey(now), 1)).getTime();

/** Une tâche fait-elle partie de la journée ? (même règle que « Aujourd'hui » de l'organisation familiale) */
export function isToday(t: TaskLike, now: Date): boolean {
  if (t.status === 'cancelled' || t.mission_state === 'cancelled') return false;
  // Mission refusée : hors de la journée tant que la personne qui l'a demandée n'a pas décidé de la suite (comme l'agenda)
  if (t.mission_state === 'declined') return false;
  if (t.status === 'done') return !!t.done_at && Date.parse(t.done_at) >= startOfDay(now) && Date.parse(t.done_at) < endOfDay(now);
  if (!t.due_at) return true;
  return Date.parse(t.due_at) < endOfDay(now);
}

/**
 * Peut-on terminer d'ici ? Mission : seulement son destinataire (ou n'importe qui sauf l'autrice si elle est « à prendre »),
 * jamais la mission de quelqu'un d'autre. Tâche simple : la mienne ou une tâche à prendre, si j'ai le droit d'écrire.
 */
export function canCompleteTask(t: TaskLike, me: string | null | undefined, canEdit: boolean): boolean {
  if (!me) return false;
  if (isMission(t)) {
    if (isTerminal(t.mission_state) || !nextState(t.mission_state, 'complete')) return false;
    const v = viewerOf(t, me);
    return v === 'recipient' || v === 'open';
  }
  if (t.status !== 'todo' || !canEdit) return false;
  return !t.assignee_id || t.assignee_id === me;
}

export function awaitsMyAnswer(t: TaskLike, me: string | null | undefined): boolean {
  if (!me || !isMission(t)) return false;
  if (t.mission_state !== 'pending' && t.mission_state !== 'postponed') return false;
  const v = viewerOf(t, me);
  return v === 'recipient' || v === 'open';
}

export function statusOf(t: TaskLike): TodayStatus {
  if (isMission(t)) return t.mission_state;
  if (t.status === 'done') return 'done';
  return t.assignee_id ? 'todo' : 'open';
}

/**
 * Tâches et missions du jour, triées : d'abord ce qui attend ma réponse, puis ce qui est à moi, puis le reste du foyer,
 * puis ce qui est déjà fait aujourd'hui. Dans chaque groupe : en retard, puis à l'heure, puis « dans la journée ».
 */
export function todayTasks(tasks: TaskLike[], me: string | null | undefined, now: Date, opts: { canEdit: boolean }): TodayTask[] {
  const sod = startOfDay(now);
  const out = tasks.filter((t) => isToday(t, now)).map((t): TodayTask => {
    const status = statusOf(t);
    const done = status === 'done';
    const awaitsMe = !done && awaitsMyAnswer(t, me);
    const canComplete = !done && canCompleteTask(t, me, opts.canEdit);
    const mine = !!me && t.assignee_id === me;
    const late = !done && !!t.due_at && Date.parse(t.due_at) < sod;
    const timed = !!t.due_at && !t.all_day && Date.parse(t.due_at) >= sod;
    const rank = done ? 3 : awaitsMe ? 0 : mine || canComplete ? 1 : 2;
    return {
      id: t.id, title: t.title, kind: isMission(t) ? 'mission' : 'task', ownerId: t.assignee_id, dueAt: t.due_at, timed, late, status, done, awaitsMe,
      canComplete, canAccept: awaitsMe && isMission(t) && !!nextState(t.mission_state, 'accept'), version: t.version, rank, raw: t,
    };
  });
  return out.sort((a, b) => a.rank - b.rank
    || (a.done && b.done ? (b.raw.done_at ?? '').localeCompare(a.raw.done_at ?? '') : 0)
    || Number(b.late) - Number(a.late)
    || Number(!a.dueAt || !a.timed) - Number(!b.dueAt || !b.timed)
    || (a.dueAt ?? '').localeCompare(b.dueAt ?? '')
    || a.raw.created_at.localeCompare(b.raw.created_at));
}

/** La ligne « à faire maintenant », candidate à l'état mis en avant : ce qui m'attend, sinon ma prochaine tâche. */
export function emphasisId(list: TodayTask[]): string | null {
  const first = list[0];
  return first && first.rank <= 1 && !first.done ? first.id : null;
}

/** Rendez-vous et événements du jour encore à venir (ou en cours), journées entières comprises. */
export function todayAgenda(s: { events?: FamilyEvent[]; appointments?: Parameters<typeof itemsBetween>[0]['appointments'] }, now: Date): CalendarItem[] {
  const from = atLocal(dayKey(now));
  const to = atLocal(addDays(dayKey(now), 1));
  return itemsBetween({ events: s.events ?? [], appointments: s.appointments ?? [], tasks: [], shifts: [] }, from, to)
    .filter((i) => i.allDay || Date.parse(i.ends) > now.getTime());
}

/** Relais du jour : relais de nuit qui commence aujourd'hui, temps pour soi qui touche la journée (hors annulés). */
export function todayShifts(shifts: CareShift[], now: Date): CareShift[] {
  const a = startOfDay(now);
  const b = endOfDay(now);
  return shifts
    .filter((s) => s.status !== 'cancelled')
    .filter((s) => (s.kind === 'night' ? Date.parse(s.starts_at) >= a && Date.parse(s.starts_at) < b : Date.parse(s.starts_at) < b && Date.parse(s.ends_at) > a))
    .sort((x, y) => x.starts_at.localeCompare(y.starts_at));
}

export interface CustodyPlanToday { id: string; child_id: string | null; label_a: string; label_b: string; cycle: string; anchor_on: string; handover_time: string | null; handover_place: string | null; active: boolean }
export interface CustodyToday { planId: string; childId: string | null; side: Side; where: string; handover: boolean; from: string | null; time: string | null; place: string | null }

/** Garde alternée : chez qui aujourd'hui, et si l'enfant change de maison ce jour-là (rythme + exceptions). */
export function custodyToday(plans: CustodyPlanToday[], exceptions: (CustodyException & { plan_id?: string })[], now: Date): CustodyToday[] {
  const day = dayKey(now);
  return plans.filter((p) => p.active).map((p) => {
    const ex = exceptions.filter((e) => !e.plan_id || e.plan_id === p.id);
    const d = custodyDays(p, day, 1, ex)[0];
    const label = (s: Side) => (s === 'A' ? p.label_a : p.label_b);
    return {
      planId: p.id, childId: p.child_id, side: d.side, where: label(d.side), handover: d.handover, from: d.handover ? label(d.side === 'A' ? 'B' : 'A') : null,
      time: d.handover && p.handover_time ? p.handover_time.slice(0, 5) : null, place: d.handover ? p.handover_place : null,
    };
  });
}

export interface TodayModel { tasks: TodayTask[]; agenda: CalendarItem[]; shifts: CareShift[]; custody: CustodyToday[] }
export const isEmptyToday = (m: TodayModel) => !m.tasks.length && !m.agenda.length && !m.shifts.length && !m.custody.length;

/** Résumé chiffré pour l'en-tête et les lecteurs d'écran : à faire (non faites) et faites aujourd'hui. */
export function todayCounts(list: TodayTask[]) {
  return { todo: list.filter((x) => !x.done).length, done: list.filter((x) => x.done).length, awaiting: list.filter((x) => x.awaitsMe).length };
}
