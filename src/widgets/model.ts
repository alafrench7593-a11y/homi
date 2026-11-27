/**
 * Widgets iOS HOMI (27/11/2026, refus App Review 4.4) : calcul PUR du contenu des dix widgets
 * (cycle, bébé, sommeil, grossesse, tâches, planning, Aura, relais, santé, Mon histoire) à partir des vraies données HOMI.
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

export type WidgetName = 'CycleWidget' | 'BabyWidget' | 'SleepWidget' | 'PregnancyWidget' | 'TasksWidget' | 'PlanningWidget'
  | 'AuraWidget' | 'RelayWidget' | 'HealthWidget' | 'StoryWidget';
export const WIDGET_NAMES: WidgetName[] = ['CycleWidget', 'BabyWidget', 'SleepWidget', 'PregnancyWidget', 'TasksWidget', 'PlanningWidget', 'AuraWidget', 'RelayWidget', 'HealthWidget', 'StoryWidget'];

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

// ---------------------------------------------------------------- Enfant des widgets (réglage de l'appareil)
/**
 * Enfant affiché par les widgets : celui choisi pour les widgets, sinon celui de l'accueil, sinon le profil actif,
 * sinon le premier enfant suivi. Un choix qui n'existe plus (enfant retiré, autre compte, accès perdu) est ignoré.
 */
export function pickWidgetChild<C extends { id: string }>(children: readonly C[] | null | undefined, o: { widgetChildId: string | null; homeChildId: string | null; subjectChildId: string | null }): C | null {
  const list = children ?? [];
  const by = (id: string | null) => (id ? list.find((c) => c.id === id) ?? null : null);
  return by(o.widgetChildId) ?? by(o.homeChildId) ?? by(o.subjectChildId) ?? list[0] ?? null;
}

// ---------------------------------------------------------------- Aura (suggestion du moment et priorités du jour)
/**
 * Tout est calculé SUR L'APPAREIL par les règles locales déjà présentes (prochaine étape d'Aura, suggestions du thème,
 * moteur de recommandations) : aucun appel IA, aucun crédit. Le lien d'une question ouvre Aura avec la question
 * pré-remplie, sans l'envoyer (rien n'est consommé sans le geste du parent).
 */
export interface AuraInput {
  step: { title: string; cta: string; href: string } | null;
  question: { text: string; href: string } | null;
  tasks: { late: number; today: number; href: string } | null;
  appts: { title: string; at: string; href: string }[];
  tools: { label: string; why: string; href: string }[];
}
export interface AuraRow { k: 'late' | 'task' | 'appt' | 'tool'; t: string; sub: string; u: string; at: number }
export interface AuraProps extends BaseProps {
  kind: '' | 'step' | 'ask'; head: string; body: string; cta: string; ctaU: string; rows: AuraRow[]; n: number;
  l: { step: string; ask: string; prio: string; late: string; today: string; appt: string; none: string };
}
export function auraEntries(i: AuraInput | null, base: Omit<BaseProps, 's'>, ctx: { now: Date; discreet: boolean; lateN: (n: number) => string; todayN: (n: number) => string; askCta: string }, l: AuraProps['l']): Entry<AuraProps>[] {
  const now = ctx.now; const t = now.getTime();
  const empty: AuraProps = { ...base, s: 'empty', kind: '', head: '', body: '', cta: '', ctaU: '', rows: [], n: 0, l };
  if (!i) return [{ date: now, props: empty }];
  const endToday = startOfDay(now).getTime() + DAY;
  const appts = i.appts.map((a) => ({ ...a, ms: ms(a.at) })).filter((a) => Number.isFinite(a.ms) && a.ms > t && a.ms < endToday).sort((a, b) => a.ms - b.ms);
  const build = (from: number): AuraProps => {
    const rows: AuraRow[] = [];
    if (i.tasks && i.tasks.late > 0) rows.push({ k: 'late', t: ctx.lateN(i.tasks.late), sub: '', u: i.tasks.href, at: 0 });
    for (const a of appts.filter((x) => x.ms > from).slice(0, 2)) rows.push({ k: 'appt', t: ctx.discreet ? l.appt : a.title, sub: '', u: a.href, at: a.ms });
    if (i.tasks && i.tasks.today > 0) rows.push({ k: 'task', t: ctx.todayN(i.tasks.today), sub: '', u: i.tasks.href, at: 0 });
    for (const x of i.tools) { if (rows.length >= 4) break; rows.push({ k: 'tool', t: x.label, sub: x.why, u: x.href, at: 0 }); }
    const step = i.step; const q = i.question;
    const head = step ? { kind: 'step' as const, head: l.step, body: step.title, cta: step.cta, ctaU: step.href }
      : q ? { kind: 'ask' as const, head: l.ask, body: q.text, cta: ctx.askCta, ctaU: q.href }
        : { kind: '' as const, head: '', body: '', cta: '', ctaU: '' };
    const has = !!head.kind || rows.length > 0;
    return { ...empty, ...head, s: has ? 'ok' : 'empty', rows, n: rows.filter((r) => r.k !== 'tool').length };
  };
  // Un rendez-vous du jour quitte les priorités à son heure, sans ouvrir l'app ; à minuit, plus de rendez-vous « du jour »
  const out: Entry<AuraProps>[] = [{ date: now, props: build(t) }];
  for (const a of appts.slice(0, 3)) out.push({ date: new Date(a.ms + 60_000), props: build(a.ms + 60_000) });
  return out;
}

// ---------------------------------------------------------------- Relais (qui est de garde, prochain relais)
export interface ShiftLike { user_id: string; starts_at: string; ends_at: string; status: string }
export interface RelayRow { who: string; mine: boolean; at: number; end: number }
export interface RelayProps extends BaseProps {
  name: string;
  nowWho: string; nowMine: boolean; nowEnd: number; nowStart: number;
  nextWho: string; nextMine: boolean; nextAt: number; nextEnd: number;
  sentAt: number; sentN: number; rows: RelayRow[]; mine7: number; other7: number;
  l: { now: string; nobody: string; next: string; until: string; sent: string; events: string; week: string; mine: string; other: string; none: string };
}
export function relayEntries(i: { shifts: readonly ShiftLike[]; me: string | null; nameOf: (id: string) => string; lastSent: { at: string; count: number } | null; childName: string | null } | null,
  base: Omit<BaseProps, 's'>, ctx: { now: Date; discreet: boolean; you: string; coparent: string; fallbackName: string }, l: RelayProps['l']): Entry<RelayProps>[] {
  const now = ctx.now; const t = now.getTime();
  const empty: RelayProps = { ...base, s: 'empty', name: ctx.fallbackName, nowWho: '', nowMine: false, nowEnd: 0, nowStart: 0, nextWho: '', nextMine: false, nextAt: 0, nextEnd: 0, sentAt: 0, sentN: 0, rows: [], mine7: 0, other7: 0, l };
  if (!i) return [{ date: now, props: empty }];
  const who = (id: string) => (i.me && id === i.me ? ctx.you : ctx.discreet ? ctx.coparent : i.nameOf(id));
  const live = i.shifts.filter((s) => s.status !== 'cancelled').map((s) => ({ ...s, a: ms(s.starts_at), b: ms(s.ends_at) }))
    .filter((s) => Number.isFinite(s.a) && Number.isFinite(s.b) && s.b > s.a && s.b > t).sort((x, y) => x.a - y.a);
  const sent = i.lastSent ? ms(i.lastSent.at) : NaN;
  const name = ctx.discreet || !i.childName ? ctx.fallbackName : i.childName;
  const build = (from: number): RelayProps => {
    const cur = live.find((s) => s.a <= from && s.b > from);
    const nxt = live.find((s) => s.a > from);
    const week = live.filter((s) => s.b > from && s.a < from + 7 * DAY);
    const has = !!cur || !!nxt || Number.isFinite(sent);
    return {
      ...empty, s: has ? 'ok' : 'empty', name,
      nowWho: cur ? who(cur.user_id) : '', nowMine: !!cur && cur.user_id === i.me, nowEnd: cur ? cur.b : 0, nowStart: cur ? cur.a : 0,
      nextWho: nxt ? who(nxt.user_id) : '', nextMine: !!nxt && nxt.user_id === i.me, nextAt: nxt ? nxt.a : 0, nextEnd: nxt ? nxt.b : 0,
      sentAt: Number.isFinite(sent) && sent <= from ? sent : 0, sentN: Number.isFinite(sent) ? i.lastSent!.count : 0,
      rows: live.filter((s) => s.b > from).slice(0, 5).map((s) => ({ who: who(s.user_id), mine: s.user_id === i.me, at: s.a, end: s.b })),
      mine7: week.filter((s) => s.user_id === i.me).length, other7: week.filter((s) => s.user_id !== i.me).length,
    };
  };
  // Une entrée à chaque début et fin de garde : « qui est de garde » change à l'heure, sans ouvrir l'app
  const marks = [...new Set(live.flatMap((s) => [s.a, s.b]).filter((x) => x > t))].sort((a, b) => a - b).slice(0, 10);
  return [{ date: now, props: build(t) }, ...marks.map((m) => ({ date: new Date(m), props: build(m) }))];
}

// ---------------------------------------------------------------- Santé (vaccin, rendez-vous, prochaine prise)
/**
 * Données de santé : discrètes par défaut. Le nom du médicament n'entre JAMAIS dans le widget (heure seulement) ;
 * le nom du vaccin et l'intitulé du rendez-vous seulement en mode détaillé et hors mode discret.
 */
export interface HealthInput {
  childName: string | null;
  vaccine: { date: string; label: string; due: boolean } | null;
  appts: { at: string; title: string }[];
  /** Prises enregistrées (traitements saisis par le parent), sans nom : heure prévue et prise notée ou non. */
  doses: { at: string; done: boolean }[];
}
export interface HealthProps extends BaseProps {
  name: string; detailed: boolean;
  vacAt: number; vacT: string; vacDue: boolean;
  apptAt: number; apptT: string;
  doseAt: number; doseDone: number; doseTotal: number;
  l: { vaccine: string; due: string; appt: string; dose: string; doses: string; none: string; allDone: string };
}
export function healthEntries(i: HealthInput | null, base: Omit<BaseProps, 's'>, ctx: { now: Date; discreet: boolean; detailed: boolean; fallbackName: string }, l: HealthProps['l']): Entry<HealthProps>[] {
  const now = ctx.now; const t = now.getTime();
  const empty: HealthProps = { ...base, s: 'empty', name: ctx.fallbackName, detailed: ctx.detailed, vacAt: 0, vacT: '', vacDue: false, apptAt: 0, apptT: '', doseAt: 0, doseDone: 0, doseTotal: 0, l };
  if (!i) return [{ date: now, props: empty }];
  const show = ctx.detailed && !ctx.discreet;
  const appts = i.appts.map((a) => ({ ...a, ms: ms(a.at) })).filter((a) => Number.isFinite(a.ms) && a.ms > t).sort((a, b) => a.ms - b.ms);
  const doses = i.doses.map((d) => ({ ...d, ms: ms(d.at) })).filter((d) => Number.isFinite(d.ms)).sort((a, b) => a.ms - b.ms);
  const vac = i.vaccine ? localMidnight(i.vaccine.date).getTime() : 0;
  const build = (from: number): HealthProps => {
    const day0 = startOfDay(new Date(from)).getTime();
    const today = doses.filter((d) => d.ms >= day0 && d.ms < day0 + DAY);
    const nextDose = doses.find((d) => !d.done && d.ms > from);
    const appt = appts.find((a) => a.ms > from);
    const has = !!i.vaccine || !!appt || doses.some((d) => d.ms > from || (d.ms >= day0 && d.ms < day0 + DAY));
    return {
      ...empty, s: has ? 'ok' : 'empty',
      name: ctx.discreet || !i.childName ? ctx.fallbackName : i.childName,
      vacAt: vac, vacT: i.vaccine && show ? i.vaccine.label : i.vaccine ? l.vaccine : '', vacDue: !!i.vaccine?.due || (vac > 0 && vac <= from),
      apptAt: appt ? appt.ms : 0, apptT: appt ? (show ? appt.title : l.appt) : '',
      doseAt: nextDose ? nextDose.ms : 0, doseDone: today.filter((d) => d.done).length, doseTotal: today.length,
    };
  };
  const out: Entry<HealthProps>[] = [{ date: now, props: build(t) }];
  // À l'heure d'une prise ou d'un rendez-vous, le widget passe au suivant ; à minuit, les prises du jour repartent
  const marks = [...new Set([...doses.filter((d) => !d.done && d.ms > t).map((d) => d.ms + 60_000), ...appts.slice(0, 3).map((a) => a.ms + 60_000), startOfDay(now).getTime() + DAY])]
    .filter((x) => x > t).sort((a, b) => a - b).slice(0, 10);
  for (const m of marks) out.push({ date: new Date(m), props: build(m) });
  return out;
}

// ---------------------------------------------------------------- Mon histoire (photo souvenir, âge exact, souvenir de la semaine)
export interface StoryPageLike { date: string; title: string | null; text: string | null }
export interface StoryProps extends BaseProps {
  name: string; age: string; photo: string; photoAt: number; caption: string;
  memT: string; memWhen: string; memAt: number; total: number; week: number;
  l: { age: string; memory: string; thisWeek: string; yearsAgo: string; memories: string; none: string; photo: string };
}
/**
 * Souvenir de la semaine : une page notée la même semaine une année précédente (« il y a 1 an »), sinon la plus récente
 * des 7 derniers jours. Sans photo prête (aucune, téléchargement impossible) : pas d'image, jamais d'image d'exemple.
 */
export function storyEntries(i: { childName: string | null; birth: string; photo: { file: string; taken_on: string; caption: string | null } | null; pages: readonly StoryPageLike[] } | null,
  base: Omit<BaseProps, 's'>, ctx: { now: Date; discreet: boolean; ageText: (birthISO: string, dayISO: string) => string; yearsAgo: (n: number) => string; fallbackName: string }, l: StoryProps['l']): Entry<StoryProps>[] {
  const now = ctx.now;
  const empty: StoryProps = { ...base, s: 'empty', name: ctx.fallbackName, age: '', photo: '', photoAt: 0, caption: '', memT: '', memWhen: '', memAt: 0, total: 0, week: 0, l };
  if (!i || !i.birth) return [{ date: now, props: empty }];
  const pages = i.pages.filter((p) => !!p.date && (p.title || p.text));
  const build = (day: string): StoryProps => {
    const [y] = day.split('-').map(Number);
    let mem: { p: StoryPageLike; when: string } | null = null;
    for (let k = 1; k <= 10 && !mem; k++) {
      const from = addDays(`${y - k}${day.slice(4)}`, -3); const to = addDays(`${y - k}${day.slice(4)}`, 3);
      const hit = pages.filter((p) => p.date >= from && p.date <= to && p.date >= i.birth).sort((a, b) => b.date.localeCompare(a.date))[0];
      if (hit) mem = { p: hit, when: ctx.yearsAgo(k) };
    }
    const recent = pages.filter((p) => p.date <= day && p.date > addDays(day, -7)).sort((a, b) => b.date.localeCompare(a.date));
    if (!mem && recent[0]) mem = { p: recent[0], when: l.thisWeek };
    const photo = !ctx.discreet && i.photo ? i.photo : null;
    return {
      ...empty, s: 'ok', name: ctx.discreet || !i.childName ? ctx.fallbackName : i.childName,
      age: day >= i.birth ? ctx.ageText(i.birth, day) : '',
      photo: photo?.file ?? '', photoAt: photo ? localMidnight(photo.taken_on).getTime() : 0, caption: photo?.caption?.trim() ?? '',
      memT: mem && !ctx.discreet ? (mem.p.title || mem.p.text || '') : '', memWhen: mem ? mem.when : '', memAt: mem ? localMidnight(mem.p.date).getTime() : 0,
      total: pages.length, week: recent.length,
    };
  };
  // L'âge et le souvenir de la semaine avancent seuls chaque jour à minuit (7 jours d'avance)
  const today = todayISO(now);
  const out: Entry<StoryProps>[] = [{ date: now, props: build(today) }];
  for (let k = 1; k <= 7; k++) { const iso = addDays(today, k); out.push({ date: localMidnight(iso), props: build(iso) }); }
  return out;
}

/** Contenu affiché quand personne n'est connecté (déconnexion, changement de compte) : aucune donnée. */
export function signedOut<P extends BaseProps>(base: Omit<BaseProps, 's'>, now: Date): Entry<P>[] {
  return [{ date: now, props: { ...base, s: 'out' } as P }];
}
