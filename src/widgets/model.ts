/**
 * Widgets iOS HOMI (27/11/2026, refus App Review 4.4) : calcul PUR du contenu des six widgets
 * (cycle, bébé, sommeil, grossesse, tâches, planning) à partir des vraies données HOMI.
 *
 * - Aucune donnée inventée : sans donnée, le widget affiche un état « vide » qui dit quoi faire.
 * - Les compteurs « depuis » sont des dates (le widget les fait avancer seul, sans réveil de l'app).
 * - Les contenus qui changent avec le jour (jour du cycle, semaine de grossesse, rendez-vous passés)
 *   sont fournis en frise (une entrée par jour ou par échéance) : le widget reste juste app fermée.
 * - Confidentialité : `discreet` masque les prénoms et les intitulés ; le cycle et la grossesse sont
 *   discrets par défaut (réglage propre à l'appareil). Les textes personnels sont aussi marqués
 *   « sensibles » dans les vues (masqués quand l'iPhone est verrouillé).
 */
import { addDays, daysBetween, todayISO, toISODate } from '@/lib/domain/dates';

export type WidgetName = 'CycleWidget' | 'BabyWidget' | 'SleepWidget' | 'PregnancyWidget' | 'TasksWidget' | 'PlanningWidget';
export const WIDGET_NAMES: WidgetName[] = ['CycleWidget', 'BabyWidget', 'SleepWidget', 'PregnancyWidget', 'TasksWidget', 'PlanningWidget'];

/** État commun : ok = données ; empty = rien à afficher encore ; out = déconnecté ; locked = protégé par l'utilisatrice. */
export type WidgetState = 'ok' | 'empty' | 'out' | 'locked';
export interface Entry<P> { date: Date; props: P }
export interface Bar { x: string; y: number }

/** Textes communs passés au widget (le widget ne peut pas traduire lui-même). */
export interface BaseProps { s: WidgetState; title: string; url: string; msg: string; /** Adresse du logo HOMI dans le dossier partagé (ajoutée à l'envoi). */ logo?: string;
  /** Raccourcis d'ajout (moyen et grand formats) : ouvrent l'écran de saisie de l'app, qui synchronise normalement. */
  actions?: { t: string; u: string }[] }

const DAY = 86_400_000;
const ms = (iso: string | null | undefined) => (iso ? Date.parse(iso) : NaN);
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
/** Minuit local du jour `iso` (YYYY-MM-DD), sans décalage UTC. */
export const localMidnight = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d, 0, 0, 0, 0); };

/** Étiquettes courtes des 7 derniers jours (le plus ancien d'abord), ex. « L », « M »… */
export function lastDays(now: Date, n: number, dayLetter: (d: Date) => string): { iso: string; start: number; end: number; label: string }[] {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const s = startOfDay(new Date(now.getTime() - i * DAY));
    const e = new Date(s); e.setDate(e.getDate() + 1);
    out.push({ iso: toISODate(s), start: s.getTime(), end: e.getTime(), label: dayLetter(s) });
  }
  return out;
}

/** Minutes d'un intervalle [a, b] comprises dans [s, e]. */
export function overlapMin(a: number, b: number, s: number, e: number): number {
  const v = Math.min(b, e) - Math.max(a, s);
  return v > 0 ? Math.round(v / 60_000) : 0;
}

// ---------------------------------------------------------------- Bébé (biberons et tétées)
export interface BabyInput {
  childName: string | null; otherChildren: number;
  bottles: { at: string; consumed_ml: number | null; prepared_ml: number | null; in_progress?: boolean | null }[];
  lastBottle: { at: string; consumed_ml: number | null; prepared_ml: number | null } | null;
  nextBottleAt: string | null;
  lastFeed: { startedAt: string; ongoing: boolean; side: 'left' | 'right' | 'both' | null; minutes: number | null } | null;
}
export interface BabyProps extends BaseProps {
  name: string; more: string;
  bottleAt: number; bottleMl: number; todayCount: number; todayMl: number; nextAt: number;
  feedAt: number; feedOngoing: boolean; feedSide: string; feedMin: number;
  week: Bar[]; avgMl: number;
  l: { lastBottle: string; lastFeed: string; today: string; next: string; ml: string; min: string; feeds: string; week: string; avg: string; ongoing: string; none: string };
}
export function babyEntries(i: BabyInput | null, base: Omit<BaseProps, 's'>, ctx: { now: Date; discreet: boolean; dayLetter: (d: Date) => string; side: (s: 'left' | 'right' | 'both') => string; more: (n: number) => string; fallbackName: string }, l: BabyProps['l']): Entry<BabyProps>[] {
  const now = ctx.now;
  const empty: BabyProps = { ...base, s: 'empty', name: ctx.fallbackName, more: '', bottleAt: 0, bottleMl: 0, todayCount: 0, todayMl: 0, nextAt: 0, feedAt: 0, feedOngoing: false, feedSide: '', feedMin: 0, week: [], avgMl: 0, l };
  if (!i) return [{ date: now, props: empty }];
  const days = lastDays(now, 7, ctx.dayLetter);
  const done = i.bottles.filter((b) => !b.in_progress);
  const mlOf = (b: { consumed_ml: number | null; prepared_ml: number | null }) => b.consumed_ml ?? b.prepared_ml ?? 0;
  const week = days.map((d) => ({ x: d.label, y: done.filter((b) => ms(b.at) >= d.start && ms(b.at) < d.end).reduce((s, b) => s + mlOf(b), 0) }));
  const today = days[days.length - 1];
  const todayList = done.filter((b) => ms(b.at) >= today.start && ms(b.at) < today.end);
  const filled = week.slice(0, -1).filter((w) => w.y > 0);
  const has = !!(i.lastBottle || i.lastFeed || done.length);
  if (!has) return [{ date: now, props: { ...empty, name: ctx.discreet || !i.childName ? ctx.fallbackName : i.childName } }];
  const next = ms(i.nextBottleAt);
  const props: BabyProps = {
    ...empty, s: 'ok',
    name: ctx.discreet || !i.childName ? ctx.fallbackName : i.childName,
    more: i.otherChildren > 0 ? ctx.more(i.otherChildren) : '',
    bottleAt: i.lastBottle ? ms(i.lastBottle.at) : 0, bottleMl: i.lastBottle ? mlOf(i.lastBottle) : 0,
    todayCount: todayList.length, todayMl: todayList.reduce((s, b) => s + mlOf(b), 0),
    nextAt: Number.isFinite(next) && next > now.getTime() ? next : 0,
    feedAt: i.lastFeed ? ms(i.lastFeed.startedAt) : 0, feedOngoing: !!i.lastFeed?.ongoing,
    feedSide: i.lastFeed?.side ? ctx.side(i.lastFeed.side) : '', feedMin: i.lastFeed?.minutes ?? 0,
    week, avgMl: filled.length ? Math.round(filled.reduce((s, w) => s + w.y, 0) / filled.length) : 0,
  };
  // À minuit, les totaux « aujourd'hui » repartent de zéro sans attendre l'ouverture de l'app
  const midnight = new Date(today.end);
  return [{ date: now, props }, { date: midnight, props: { ...props, todayCount: 0, todayMl: 0, week: [...week.slice(1), { x: ctx.dayLetter(midnight), y: 0 }] } }];
}

// ---------------------------------------------------------------- Sommeil
export interface SleepInput { childName: string | null; otherChildren: number; sleeps: { started_at: string; ended_at: string | null; kind?: 'nap' | 'night' | null }[] }
export interface SleepProps extends BaseProps {
  name: string; more: string;
  asleep: boolean; since: number; todayMin: number; naps: number; lastMin: number;
  week: Bar[]; avgMin: number;
  l: { asleep: string; awake: string; today: string; naps: string; last: string; week: string; avg: string; h: string; none: string };
}
/** Un sommeil ouvert depuis plus de 18 h est un oubli de fin : il n'est pas « en cours ». */
const OPEN_MAX_MS = 18 * 3600_000;
export function sleepEntries(i: SleepInput | null, base: Omit<BaseProps, 's'>, ctx: { now: Date; discreet: boolean; dayLetter: (d: Date) => string; more: (n: number) => string; fallbackName: string }, l: SleepProps['l']): Entry<SleepProps>[] {
  const now = ctx.now; const t = now.getTime();
  const empty: SleepProps = { ...base, s: 'empty', name: ctx.fallbackName, more: '', asleep: false, since: 0, todayMin: 0, naps: 0, lastMin: 0, week: [], avgMin: 0, l };
  if (!i) return [{ date: now, props: empty }];
  const valid = i.sleeps.filter((x) => Number.isFinite(ms(x.started_at)));
  const open = valid.filter((x) => !x.ended_at && t - ms(x.started_at) < OPEN_MAX_MS && ms(x.started_at) <= t).sort((a, b) => ms(b.started_at) - ms(a.started_at))[0];
  const closed = valid.filter((x) => x.ended_at).sort((a, b) => ms(b.ended_at) - ms(a.ended_at));
  const days = lastDays(now, 7, ctx.dayLetter);
  const minsIn = (s: number, e: number) => valid.reduce((sum, x) => {
    const a = ms(x.started_at); const b = x.ended_at ? ms(x.ended_at) : (x === open ? t : a);
    return sum + overlapMin(a, b, s, e);
  }, 0);
  const week = days.map((d) => ({ x: d.label, y: Math.round((minsIn(d.start, Math.min(d.end, t)) / 60) * 10) / 10 }));
  const today = days[days.length - 1];
  const todayMin = minsIn(today.start, t);
  const naps = valid.filter((x) => (x.kind ?? 'nap') === 'nap' && ms(x.started_at) >= today.start).length;
  const last = closed[0];
  const past = week.slice(0, -1).filter((w) => w.y > 0);
  if (!open && !last) return [{ date: now, props: { ...empty, name: ctx.discreet || !i.childName ? ctx.fallbackName : i.childName } }];
  const props: SleepProps = {
    ...empty, s: 'ok',
    name: ctx.discreet || !i.childName ? ctx.fallbackName : i.childName,
    more: i.otherChildren > 0 ? ctx.more(i.otherChildren) : '',
    asleep: !!open, since: open ? ms(open.started_at) : ms(last!.ended_at),
    todayMin, naps, lastMin: last ? Math.round((ms(last.ended_at) - ms(last.started_at)) / 60_000) : 0,
    week, avgMin: past.length ? Math.round((past.reduce((s, w) => s + w.y, 0) / past.length) * 60) : 0,
  };
  return [{ date: now, props }];
}

// ---------------------------------------------------------------- Cycle (jour du cycle, prochaines règles, prise du jour)
export interface CycleInput {
  periods: { start_date: string; end_date?: string | null }[];
  nextPeriod: string | null; averageLength: number | null; fertileWindow: { start: string; end: string } | null;
  cycleDayOn: (iso: string) => number | null;
  pill: { active: boolean; takenToday: boolean } | null;
  hidden: boolean;
}
export interface CycleProps extends BaseProps {
  day: number; len: number; until: number; fertile: boolean; fertileIn: number; pill: '' | 'done' | 'todo'; detailed: boolean;
  l: { day: string; next: string; nextDiscreet: string; days: string; today: string; fertile: string; fertileSoon: string; pill: string; pillDone: string; pillTodo: string; none: string };
}
export function cycleEntries(i: CycleInput | null, base: Omit<BaseProps, 's'>, ctx: { now: Date; detailed: boolean }, l: CycleProps['l']): Entry<CycleProps>[] {
  const now = ctx.now;
  const empty: CycleProps = { ...base, s: 'empty', day: 0, len: 28, until: -1, fertile: false, fertileIn: -1, pill: '', detailed: ctx.detailed, l };
  if (!i) return [{ date: now, props: empty }];
  if (i.hidden) return [{ date: now, props: { ...empty, s: 'locked' } }];
  const today = todayISO(now);
  const out: Entry<CycleProps>[] = [];
  // Une entrée par jour pendant 10 jours : le jour du cycle avance même si l'app n'est pas ouverte
  for (let k = 0; k < 10; k++) {
    const iso = addDays(today, k);
    const day = i.cycleDayOn(iso);
    if (!day) { if (k === 0) return [{ date: now, props: empty }]; break; }
    const until = i.nextPeriod ? daysBetween(iso, i.nextPeriod) : -1;
    const fw = i.fertileWindow;
    const fertile = !!fw && iso >= fw.start && iso <= fw.end;
    const fertileIn = fw && iso < fw.start ? daysBetween(iso, fw.start) : -1;
    const pill = !i.pill?.active ? '' : k === 0 && i.pill.takenToday ? 'done' : 'todo';
    out.push({ date: k === 0 ? now : localMidnight(iso), props: { ...empty, s: 'ok', day, len: Math.max(i.averageLength ?? 28, day), until, fertile, fertileIn, pill } });
  }
  return out;
}

// ---------------------------------------------------------------- Grossesse
export interface PregnancyInput {
  dueDate: string;
  progressOn: (iso: string) => { weeksSA: number; extraDays: number; trimester: 1 | 2 | 3; daysToDue: number; progress: number };
  nextAppt: { at: string; title: string } | null;
}
export interface PregnancyProps extends BaseProps {
  week: number; extra: number; tri: number; toDue: number; pct: number; detailed: boolean; apptAt: number; apptTitle: string;
  l: { week: string; weekDiscreet: string; tri: string; toDue: string; toDueDiscreet: string; appt: string; apptDiscreet: string; none: string; days: string };
}
export function pregnancyEntries(i: PregnancyInput | null, base: Omit<BaseProps, 's'>, ctx: { now: Date; detailed: boolean }, l: PregnancyProps['l']): Entry<PregnancyProps>[] {
  const now = ctx.now;
  const empty: PregnancyProps = { ...base, s: 'empty', week: 0, extra: 0, tri: 0, toDue: 0, pct: 0, detailed: ctx.detailed, apptAt: 0, apptTitle: '', l };
  if (!i) return [{ date: now, props: empty }];
  const today = todayISO(now);
  const appt = i.nextAppt && ms(i.nextAppt.at) > now.getTime() ? i.nextAppt : null;
  const out: Entry<PregnancyProps>[] = [];
  for (let k = 0; k < 8; k++) {
    const iso = addDays(today, k);
    const p = i.progressOn(iso);
    const date = k === 0 ? now : localMidnight(iso);
    const stillAppt = appt && ms(appt.at) > date.getTime() ? appt : null;
    out.push({ date, props: { ...empty, s: 'ok', week: p.weeksSA, extra: p.extraDays, tri: p.trimester, toDue: Math.max(0, p.daysToDue), pct: Math.max(0, Math.min(1, p.progress)), apptAt: stillAppt ? ms(stillAppt.at) : 0, apptTitle: stillAppt && ctx.detailed ? stillAppt.title : '' } });
  }
  return out;
}

// ---------------------------------------------------------------- Tâches familiales
export interface TaskLike { id: string; title: string; status: 'todo' | 'done' | 'cancelled'; due_at: string | null; done_at: string | null; assignee_id: string | null }
export interface TaskRow { t: string; due: number; late: boolean; mine: boolean }
export interface TasksProps extends BaseProps {
  open: number; doneWeek: number; mine: number; late: number; pct: number; rows: TaskRow[]; week: Bar[];
  l: { open: string; done: string; mine: string; late: string; week: string; none: string; noDue: string; hidden: string };
}
export function tasksEntries(tasks: readonly TaskLike[] | null, base: Omit<BaseProps, 's'>, ctx: { now: Date; me: string | null; discreet: boolean; dayLetter: (d: Date) => string }, l: TasksProps['l']): Entry<TasksProps>[] {
  const now = ctx.now; const t = now.getTime();
  const empty: TasksProps = { ...base, s: 'empty', open: 0, doneWeek: 0, mine: 0, late: 0, pct: 0, rows: [], week: [], l };
  if (!tasks) return [{ date: now, props: empty }];
  const open = tasks.filter((x) => x.status === 'todo');
  const days = lastDays(now, 7, ctx.dayLetter);
  const done = tasks.filter((x) => x.status === 'done' && ms(x.done_at) >= days[0].start);
  if (!open.length && !done.length) return [{ date: now, props: empty }];
  const sorted = [...open].sort((a, b) => (ms(a.due_at) || Infinity) - (ms(b.due_at) || Infinity));
  const rows = sorted.slice(0, 6).map((x) => {
    const due = ms(x.due_at);
    return { t: ctx.discreet ? l.hidden : x.title, due: Number.isFinite(due) ? due : 0, late: Number.isFinite(due) && due < t, mine: !!ctx.me && x.assignee_id === ctx.me };
  });
  const week = days.map((d) => ({ x: d.label, y: done.filter((x) => ms(x.done_at) >= d.start && ms(x.done_at) < d.end).length }));
  const props: TasksProps = {
    ...empty, s: 'ok', open: open.length, doneWeek: done.length,
    mine: ctx.me ? open.filter((x) => x.assignee_id === ctx.me).length : 0,
    late: open.filter((x) => Number.isFinite(ms(x.due_at)) && ms(x.due_at) < t).length,
    pct: done.length + open.length ? done.length / (done.length + open.length) : 0, rows, week,
  };
  // Une tâche passe « en retard » à son échéance : nouvelle entrée à chaque échéance à venir (max 6)
  const out: Entry<TasksProps>[] = [{ date: now, props }];
  const upcoming = rows.filter((r) => r.due > t).map((r) => r.due).slice(0, 6);
  for (const at of upcoming) {
    const prev = out[out.length - 1].props;
    const nrows = prev.rows.map((r) => ({ ...r, late: r.due > 0 && r.due <= at }));
    out.push({ date: new Date(at), props: { ...prev, rows: nrows, late: open.filter((x) => Number.isFinite(ms(x.due_at)) && ms(x.due_at) <= at).length } });
  }
  return out;
}

// ---------------------------------------------------------------- Planning (prochains rendez-vous)
export interface ApptLike { id: string; title: string; starts_at: string; location_label: string | null; completed_at?: string | null }
export interface ApptRow { t: string; at: number; place: string }
export interface PlanningProps extends BaseProps {
  rows: ApptRow[]; week: number; todayN: number;
  l: { next: string; week: string; today: string; none: string; hidden: string; in: string };
}
export function planningEntries(list: readonly ApptLike[] | null, base: Omit<BaseProps, 's'>, ctx: { now: Date; discreet: boolean }, l: PlanningProps['l']): Entry<PlanningProps>[] {
  const now = ctx.now; const t = now.getTime();
  const empty: PlanningProps = { ...base, s: 'empty', rows: [], week: 0, todayN: 0, l };
  if (!list) return [{ date: now, props: empty }];
  const future = list.filter((a) => !a.completed_at && ms(a.starts_at) > t).sort((a, b) => ms(a.starts_at) - ms(b.starts_at)).slice(0, 12);
  const build = (from: number): PlanningProps => {
    const left = future.filter((a) => ms(a.starts_at) > from);
    const endToday = startOfDay(new Date(from)).getTime() + DAY;
    return {
      ...empty, s: left.length ? 'ok' : 'empty',
      rows: left.slice(0, 5).map((a) => ({ t: ctx.discreet ? l.hidden : a.title, at: ms(a.starts_at), place: ctx.discreet ? '' : a.location_label ?? '' })),
      week: left.filter((a) => ms(a.starts_at) < from + 7 * DAY).length,
      todayN: left.filter((a) => ms(a.starts_at) < endToday).length,
    };
  };
  // Un rendez-vous passé disparaît à son heure, sans ouvrir l'app
  return [{ date: now, props: build(t) }, ...future.slice(0, 6).map((a) => ({ date: new Date(ms(a.starts_at) + 60_000), props: build(ms(a.starts_at) + 60_000) }))];
}

/** Contenu affiché quand personne n'est connecté (déconnexion, changement de compte) : aucune donnée. */
export function signedOut<P extends BaseProps>(base: Omit<BaseProps, 's'>, now: Date): Entry<P>[] {
  return [{ date: now, props: { ...base, s: 'out' } as P }];
}
