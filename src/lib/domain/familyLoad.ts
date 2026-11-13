/**
 * Partage de la charge familiale : logique pure, testée.
 * Pas de classement, pas de score, pas de compétition. Les signaux de surcharge reposent
 * uniquement sur ce qui a été noté (tâches, demandes, créneaux, fatigue déclarée par la personne
 * elle-même) et ne disent jamais ce que quelqu'un « a ».
 */
import type { IconName } from '@/components/ui';
import { t as tr } from '@/i18n';
import { localized } from '@/i18n/localized';

export type TaskCategory = 'feeding' | 'diapers' | 'sleep' | 'shopping' | 'packing' | 'appointments' | 'housework' | 'admin' | 'organization' | 'parent_rest' | 'other' | 'pets' | 'childcare' | 'health';
export type Recurrence = { type: 'daily' | 'weekly' | 'monthly'; every?: number } | null;

export interface FamilyTask {
  id: string; household_id: string; title: string; category: TaskCategory; due_at: string | null; assignee_id: string | null;
  priority: 'low' | 'normal' | 'high'; essential: boolean; recurrence: Recurrence; status: 'todo' | 'done' | 'cancelled';
  done_at: string | null; done_by: string | null; notes: string | null; routine_id: string | null; created_by: string | null;
  updated_by?: string | null; created_at: string; updated_at?: string;
}

export type RequestKind = 'relay' | 'taking_over' | 'rest' | 'take_task' | 'available' | 'swap_slot' | 'help_today';
export interface CareRequest {
  id: string; household_id: string; from_user: string; to_user: string | null; kind: RequestKind; message: string | null;
  task_id: string | null; shift_id: string | null; starts_at: string | null; ends_at: string | null;
  status: 'open' | 'accepted' | 'declined' | 'cancelled' | 'done'; responded_by: string | null; responded_at: string | null; created_at: string;
}

export interface CareShift {
  id: string; household_id: string; kind: 'night' | 'me_time'; user_id: string; starts_at: string; ends_at: string;
  status: 'planned' | 'confirmed' | 'swapped' | 'cancelled'; note: string | null; created_by: string | null; created_at: string;
}

export interface Routine {
  id: string; household_id: string; title: string; kind: 'bag' | 'meals' | 'bedtime' | 'tomorrow' | 'shopping' | 'weekly' | 'appointment' | 'rest' | 'custom';
  items: string[]; default_assignee: string | null; active: boolean; created_by: string | null; created_at: string;
}

type CategoryDef = { value: TaskCategory; label: string; icon: IconName };
const CATEGORIES_FR: CategoryDef[] = [
  { value: 'feeding', label: 'Biberons et repas', icon: 'coffee' },
  { value: 'diapers', label: 'Changes', icon: 'wind' },
  { value: 'sleep', label: 'Sommeil', icon: 'moon' },
  { value: 'shopping', label: 'Courses', icon: 'shopping-cart' },
  { value: 'packing', label: 'Préparation des affaires', icon: 'briefcase' },
  { value: 'appointments', label: 'Rendez-vous', icon: 'calendar' },
  { value: 'housework', label: 'Entretien', icon: 'home' },
  { value: 'admin', label: 'Administration', icon: 'file-text' },
  { value: 'organization', label: 'Organisation familiale', icon: 'grid' },
  { value: 'parent_rest', label: 'Repos parental', icon: 'sun' },
  { value: 'childcare', label: 'Crèche et garde', icon: 'users' },
  { value: 'pets', label: 'Animaux', icon: 'feather' },
  { value: 'health', label: 'Santé familiale', icon: 'activity' },
  { value: 'other', label: 'Autre', icon: 'circle' },
];
const CATEGORIES_EN: CategoryDef[] = [
  { value: 'feeding', label: 'Bottles and meals', icon: 'coffee' },
  { value: 'diapers', label: 'Nappy changes', icon: 'wind' },
  { value: 'sleep', label: 'Sleep', icon: 'moon' },
  { value: 'shopping', label: 'Shopping', icon: 'shopping-cart' },
  { value: 'packing', label: 'Packing bags', icon: 'briefcase' },
  { value: 'appointments', label: 'Appointments', icon: 'calendar' },
  { value: 'housework', label: 'Housework', icon: 'home' },
  { value: 'admin', label: 'Paperwork', icon: 'file-text' },
  { value: 'organization', label: 'Family organisation', icon: 'grid' },
  { value: 'parent_rest', label: 'Parental rest', icon: 'sun' },
  { value: 'childcare', label: 'Nursery and childcare', icon: 'users' },
  { value: 'pets', label: 'Pets', icon: 'feather' },
  { value: 'health', label: 'Family health', icon: 'activity' },
  { value: 'other', label: 'Other', icon: 'circle' },
];
const CATEGORIES_ES: CategoryDef[] = [
  { value: 'feeding', label: 'Biberones y comidas', icon: 'coffee' },
  { value: 'diapers', label: 'Cambios de pañal', icon: 'wind' },
  { value: 'sleep', label: 'Sueño', icon: 'moon' },
  { value: 'shopping', label: 'Compras', icon: 'shopping-cart' },
  { value: 'packing', label: 'Preparar las cosas', icon: 'briefcase' },
  { value: 'appointments', label: 'Citas', icon: 'calendar' },
  { value: 'housework', label: 'Tareas del hogar', icon: 'home' },
  { value: 'admin', label: 'Trámites', icon: 'file-text' },
  { value: 'organization', label: 'Organización familiar', icon: 'grid' },
  { value: 'parent_rest', label: 'Descanso parental', icon: 'sun' },
  { value: 'childcare', label: 'Guardería y cuidado', icon: 'users' },
  { value: 'pets', label: 'Mascotas', icon: 'feather' },
  { value: 'health', label: 'Salud familiar', icon: 'activity' },
  { value: 'other', label: 'Otro', icon: 'circle' },
];
const CATEGORIES_DE: CategoryDef[] = [
  { value: 'feeding', label: 'Fläschchen und Mahlzeiten', icon: 'coffee' },
  { value: 'diapers', label: 'Wickeln', icon: 'wind' },
  { value: 'sleep', label: 'Schlaf', icon: 'moon' },
  { value: 'shopping', label: 'Einkäufe', icon: 'shopping-cart' },
  { value: 'packing', label: 'Sachen packen', icon: 'briefcase' },
  { value: 'appointments', label: 'Termine', icon: 'calendar' },
  { value: 'housework', label: 'Haushalt', icon: 'home' },
  { value: 'admin', label: 'Behördenkram', icon: 'file-text' },
  { value: 'organization', label: 'Familienorganisation', icon: 'grid' },
  { value: 'parent_rest', label: 'Erholung für Eltern', icon: 'sun' },
  { value: 'childcare', label: 'Kita und Betreuung', icon: 'users' },
  { value: 'pets', label: 'Haustiere', icon: 'feather' },
  { value: 'health', label: 'Familiengesundheit', icon: 'activity' },
  { value: 'other', label: 'Anderes', icon: 'circle' },
];
const CATEGORIES_IT: CategoryDef[] = [
  { value: 'feeding', label: 'Biberon e pasti', icon: 'coffee' },
  { value: 'diapers', label: 'Cambi', icon: 'wind' },
  { value: 'sleep', label: 'Sonno', icon: 'moon' },
  { value: 'shopping', label: 'Spesa', icon: 'shopping-cart' },
  { value: 'packing', label: 'Preparare le cose', icon: 'briefcase' },
  { value: 'appointments', label: 'Appuntamenti', icon: 'calendar' },
  { value: 'housework', label: 'Faccende di casa', icon: 'home' },
  { value: 'admin', label: 'Pratiche', icon: 'file-text' },
  { value: 'organization', label: 'Organizzazione familiare', icon: 'grid' },
  { value: 'parent_rest', label: 'Riposo dei genitori', icon: 'sun' },
  { value: 'childcare', label: 'Nido e custodia', icon: 'users' },
  { value: 'pets', label: 'Animali', icon: 'feather' },
  { value: 'health', label: 'Salute della famiglia', icon: 'activity' },
  { value: 'other', label: 'Altro', icon: 'circle' },
];
export const CATEGORIES: CategoryDef[] = localized(CATEGORIES_FR, CATEGORIES_EN, { es: CATEGORIES_ES, de: CATEGORIES_DE, it: CATEGORIES_IT });
export const categoryOf = (c: TaskCategory) => CATEGORIES.find((x) => x.value === c) ?? CATEGORIES[CATEGORIES.length - 1];

/** Actions rapides (§ 20). `needsTask` / `needsShift` : il faut choisir l'élément concerné. */
type QuickAction = { kind: RequestKind; label: string; icon: IconName; detail: string; needsTask?: boolean; needsShift?: boolean };
const QUICK_ACTIONS_FR: QuickAction[] = [
  { kind: 'taking_over', label: 'Je prends le relais', icon: 'repeat', detail: 'Prévient le foyer que vous prenez la suite.' },
  { kind: 'rest', label: 'J’ai besoin de repos', icon: 'moon', detail: 'Demande à être relayé·e pour souffler.' },
  { kind: 'take_task', label: 'Peux-tu prendre cette tâche ?', icon: 'share', detail: 'Proposer une tâche à quelqu’un d’autre.', needsTask: true },
  { kind: 'available', label: 'Je suis disponible', icon: 'check-circle', detail: 'Signaler que vous pouvez aider.' },
  { kind: 'swap_slot', label: 'Échanger mon créneau', icon: 'shuffle', detail: 'Proposer d’échanger un relais de nuit.', needsShift: true },
  { kind: 'help_today', label: 'J’ai besoin d’aide aujourd’hui', icon: 'life-buoy', detail: 'Demande d’aide générale pour la journée.' },
  { kind: 'relay', label: 'Demander un relais', icon: 'users', detail: 'Pour qu’on prenne le bébé un moment.' },
];
const QUICK_ACTIONS_EN: QuickAction[] = [
  { kind: 'taking_over', label: 'I’m taking over', icon: 'repeat', detail: 'Lets the household know you are taking over.' },
  { kind: 'rest', label: 'I need a rest', icon: 'moon', detail: 'Ask for someone to take over so you can catch your breath.' },
  { kind: 'take_task', label: 'Can you take this task?', icon: 'share', detail: 'Suggest a task to someone else.', needsTask: true },
  { kind: 'available', label: 'I’m available', icon: 'check-circle', detail: 'Let others know you can help.' },
  { kind: 'swap_slot', label: 'Swap my slot', icon: 'shuffle', detail: 'Suggest swapping a night shift.', needsShift: true },
  { kind: 'help_today', label: 'I need help today', icon: 'life-buoy', detail: 'A general request for help for the day.' },
  { kind: 'relay', label: 'Ask for a relay', icon: 'users', detail: 'So that someone takes the baby for a while.' },
];
const QUICK_ACTIONS_ES: QuickAction[] = [
  { kind: 'taking_over', label: 'Tomo el relevo', icon: 'repeat', detail: 'Avisa al hogar de que te encargas tú.' },
  { kind: 'rest', label: 'Necesito descansar', icon: 'moon', detail: 'Pide que alguien te releve para tomar aire.' },
  { kind: 'take_task', label: '¿Puedes encargarte de esta tarea?', icon: 'share', detail: 'Proponer una tarea a otra persona.', needsTask: true },
  { kind: 'available', label: 'Estoy disponible', icon: 'check-circle', detail: 'Avisar de que puedes ayudar.' },
  { kind: 'swap_slot', label: 'Cambiar mi turno', icon: 'shuffle', detail: 'Proponer cambiar un turno de noche.', needsShift: true },
  { kind: 'help_today', label: 'Necesito ayuda hoy', icon: 'life-buoy', detail: 'Petición de ayuda general para el día.' },
  { kind: 'relay', label: 'Pedir un relevo', icon: 'users', detail: 'Para que alguien se ocupe del bebé un rato.' },
];
const QUICK_ACTIONS_DE: QuickAction[] = [
  { kind: 'taking_over', label: 'Ich übernehme', icon: 'repeat', detail: 'Sagt dem Haushalt Bescheid, dass du übernimmst.' },
  { kind: 'rest', label: 'Ich brauche eine Pause', icon: 'moon', detail: 'Bitte darum, abgelöst zu werden, um durchzuatmen.' },
  { kind: 'take_task', label: 'Kannst du diese Aufgabe übernehmen?', icon: 'share', detail: 'Eine Aufgabe jemand anderem vorschlagen.', needsTask: true },
  { kind: 'available', label: 'Ich bin verfügbar', icon: 'check-circle', detail: 'Zeigen, dass du helfen kannst.' },
  { kind: 'swap_slot', label: 'Meine Schicht tauschen', icon: 'shuffle', detail: 'Vorschlagen, eine Nachtschicht zu tauschen.', needsShift: true },
  { kind: 'help_today', label: 'Ich brauche heute Hilfe', icon: 'life-buoy', detail: 'Allgemeine Bitte um Hilfe für den Tag.' },
  { kind: 'relay', label: 'Um Ablösung bitten', icon: 'users', detail: 'Damit jemand das Baby eine Weile nimmt.' },
];
const QUICK_ACTIONS_IT: QuickAction[] = [
  { kind: 'taking_over', label: 'Do il cambio', icon: 'repeat', detail: 'Avvisa la famiglia che te ne occupi tu.' },
  { kind: 'rest', label: 'Ho bisogno di riposare', icon: 'moon', detail: 'Chiedi a qualcuno di darti il cambio per tirare il fiato.' },
  { kind: 'take_task', label: 'Puoi occuparti di questo compito?', icon: 'share', detail: 'Proporre un compito a qualcun altro.', needsTask: true },
  { kind: 'available', label: 'Sono disponibile', icon: 'check-circle', detail: 'Far sapere che puoi aiutare.' },
  { kind: 'swap_slot', label: 'Scambiare il mio turno', icon: 'shuffle', detail: 'Proporre di scambiare un turno di notte.', needsShift: true },
  { kind: 'help_today', label: 'Ho bisogno di aiuto oggi', icon: 'life-buoy', detail: 'Richiesta di aiuto generale per la giornata.' },
  { kind: 'relay', label: 'Chiedere il cambio', icon: 'users', detail: 'Perché qualcuno si occupi del bebè per un po’.' },
];
export const QUICK_ACTIONS: QuickAction[] = localized(QUICK_ACTIONS_FR, QUICK_ACTIONS_EN, { es: QUICK_ACTIONS_ES, de: QUICK_ACTIONS_DE, it: QUICK_ACTIONS_IT });
const labelsOf = (list: QuickAction[]) => Object.fromEntries(list.map((a) => [a.kind, a.label])) as Record<RequestKind, string>;
export const REQUEST_LABEL: Record<RequestKind, string> = localized(labelsOf(QUICK_ACTIONS_FR), labelsOf(QUICK_ACTIONS_EN), { es: labelsOf(QUICK_ACTIONS_ES), de: labelsOf(QUICK_ACTIONS_DE), it: labelsOf(QUICK_ACTIONS_IT) });

// ------------------------------------------------------------------ dates (heure locale)
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const sameLocalDay = (iso: string, day: string) => dayKey(new Date(iso)) === day;
const atLocal = (day: string, hour: number, minute = 0) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute, 0, 0);
};
export function addLocalDays(day: string, n: number): string {
  const d = atLocal(day, 12);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

// ------------------------------------------------------------------ relais de nuit
export type NightPattern = 'alternate' | 'fixed' | 'custom';

/**
 * Prépare des créneaux de nuit (à valider avant enregistrement).
 * - alternate : chacun son tour dans l'ordre donné (un seul adulte → toutes les nuits, sans jugement) ;
 * - fixed : toujours la même personne ;
 * - custom : `custom[i]` désigne la personne de la nuit i.
 */
export function planNights(o: { pattern: NightPattern; people: string[]; startDay: string; nights: number; startHour?: number; endHour?: number; custom?: string[] }) {
  const startHour = o.startHour ?? 22;
  const endHour = o.endHour ?? 6;
  const n = Math.max(1, Math.min(o.nights, 31));
  if (!o.people.length) return [];
  return Array.from({ length: n }, (_, i) => {
    const day = addLocalDays(o.startDay, i);
    const start = atLocal(day, startHour);
    const end = endHour <= startHour ? atLocal(addLocalDays(day, 1), endHour) : atLocal(day, endHour);
    const user = o.pattern === 'fixed' ? o.people[0] : o.pattern === 'custom' ? (o.custom?.[i] ?? o.people[i % o.people.length]) : o.people[i % o.people.length];
    return { kind: 'night' as const, user_id: user, starts_at: start.toISOString(), ends_at: end.toISOString() };
  });
}

/** Créneaux qui se chevauchent pour une même personne (conflits à signaler avant d'enregistrer). */
export function shiftConflicts(planned: { user_id: string; starts_at: string; ends_at: string }[], existing: Pick<CareShift, 'user_id' | 'starts_at' | 'ends_at' | 'status'>[]) {
  return planned.filter((p) => existing.some((e) => e.status !== 'cancelled' && e.user_id === p.user_id && e.starts_at < p.ends_at && p.starts_at < e.ends_at));
}

// ------------------------------------------------------------------ temps pour soi
/**
 * Créneaux libres d'au moins `minMinutes` dans la journée (entre 8 h et 21 h), en évitant
 * les rendez-vous, les créneaux déjà posés et les tâches datées de la personne. Simple suggestion.
 */
export function suggestFreeSlots(o: { day: string; busy: { starts_at: string; ends_at: string }[]; minMinutes?: number; from?: number; to?: number; now?: Date }) {
  const min = (o.minMinutes ?? 60) * 60000;
  let cursor = atLocal(o.day, o.from ?? 8).getTime();
  if (o.now && dayKey(o.now) === o.day) cursor = Math.max(cursor, Math.ceil(o.now.getTime() / 900000) * 900000);
  const end = atLocal(o.day, o.to ?? 21).getTime();
  const busy = o.busy.map((b) => [Date.parse(b.starts_at), Date.parse(b.ends_at)] as const).filter(([s, e]) => e > cursor && s < end).sort((a, b) => a[0] - b[0]);
  const out: { starts_at: string; ends_at: string }[] = [];
  for (const [s, e] of busy) {
    if (s - cursor >= min) out.push({ starts_at: new Date(cursor).toISOString(), ends_at: new Date(s).toISOString() });
    cursor = Math.max(cursor, e);
  }
  if (end - cursor >= min) out.push({ starts_at: new Date(cursor).toISOString(), ends_at: new Date(end).toISOString() });
  return out.slice(0, 4);
}

// ------------------------------------------------------------------ journée difficile
/** Sépare l'essentiel de ce qui peut attendre (rien n'est reporté sans validation). */
export function lightenDay(tasks: FamilyTask[], day: string) {
  const today = tasks.filter((t) => t.status === 'todo' && t.due_at && (sameLocalDay(t.due_at, day) || t.due_at < atLocal(day, 0).toISOString()));
  const essential = today.filter((t) => t.essential || t.priority === 'high');
  const postponable = today.filter((t) => !t.essential && t.priority !== 'high');
  /** Proposition : même heure, le lendemain (ou demain 9 h pour une tâche en retard). */
  const plan = postponable.map((t) => {
    const d = new Date(t.due_at!);
    const next = sameLocalDay(t.due_at!, day) ? new Date(d.getTime() + 86400000) : atLocal(addLocalDays(day, 1), 9);
    return { id: t.id, title: t.title, from: t.due_at!, to: next.toISOString() };
  });
  return { essential, postponable, plan };
}

// ------------------------------------------------------------------ signaux de surcharge (§ 21)
export interface OverloadSignal { key: string; title: string; why: string; suggestions: { label: string; to?: string }[] }

export function overloadSignals(o: {
  tasks: FamilyTask[]; requests: CareRequest[]; shifts: CareShift[]; me: string; day: string; now?: Date;
  /** Fatigue que la personne a déclarée elle-même (1..5), lue sur SON appareil uniquement. */
  myDeclaredFatigue?: number | null;
}): OverloadSignal[] {
  const now = o.now ?? new Date();
  const todo = o.tasks.filter((t) => t.status === 'todo');
  const out: OverloadSignal[] = [];
  const overdue = todo.filter((t) => t.due_at && Date.parse(t.due_at) < now.getTime() - 3600000);
  if (overdue.length >= 3) {
    out.push({ key: 'overdue', title: tr('l8.fl.overdue.title'), why: tr('l8.fl.overdue.why', { count: overdue.length }), suggestions: [{ label: tr('l8.fl.lighten'), to: '/family/difficult' }, { label: tr('l8.fl.postpone'), to: '/family/difficult' }] });
  }
  const todays = todo.filter((t) => t.due_at && sameLocalDay(t.due_at, o.day));
  if (todays.length >= 8) {
    out.push({ key: 'heavy_day', title: tr('l8.fl.heavy.title'), why: tr('l8.fl.heavy.why', { count: todays.length }), suggestions: [{ label: tr('l8.fl.simplify'), to: '/family/difficult' }, { label: tr('l8.fl.delegate'), to: '/family' }] });
  }
  const soon = todo.filter((t) => !t.assignee_id && t.due_at && Date.parse(t.due_at) < now.getTime() + 2 * 86400000);
  if (soon.length >= 3) {
    out.push({ key: 'unassigned', title: tr('l8.fl.unassigned.title'), why: tr('l8.fl.unassigned.why', { count: soon.length }), suggestions: [{ label: tr('l8.fl.shareTogether'), to: '/family' }] });
  }
  // Répartition : uniquement sur ce qui a été noté ; pas de nom, pas de chiffre par personne
  const week = o.tasks.filter((t) => t.status === 'done' && t.done_at && Date.parse(t.done_at) > now.getTime() - 7 * 86400000 && t.done_by);
  if (week.length >= 8) {
    const mine = week.filter((t) => t.done_by === o.me).length;
    if (mine / week.length >= 0.75) {
      out.push({ key: 'imbalance', title: tr('l8.fl.imb.title'), why: tr('l8.fl.imb.why'), suggestions: [{ label: tr('l8.fl.proposeTask'), to: '/family' }, { label: tr('l8.fl.talkReview'), to: '/family/review' }] });
    }
  }
  const restedRecently = o.shifts.some((s) => s.kind === 'me_time' && s.user_id === o.me && s.status !== 'cancelled' && Date.parse(s.ends_at) > now.getTime() - 7 * 86400000);
  const askedRest = o.requests.some((r) => r.from_user === o.me && (r.kind === 'rest' || r.kind === 'help_today') && Date.parse(r.created_at) > now.getTime() - 3 * 86400000);
  if ((o.myDeclaredFatigue ?? 0) >= 4 || askedRest) {
    if (!restedRecently) {
      out.push({ key: 'rest', title: tr('l8.fl.rest.title'), why: askedRest ? tr('l8.fl.rest.whyAsked') : tr('l8.fl.rest.whyFatigue'), suggestions: [{ label: tr('l8.fl.rest.book'), to: '/family/me-time' }, { label: tr('l8.fl.rest.relay'), to: '/family' }, { label: tr('l8.fl.rest.trusted'), to: '/postpartum/support' }] });
    }
  }
  return out;
}

// ------------------------------------------------------------------ bilan hebdomadaire (§ 28)
export function weeklyReview(o: { tasks: FamilyTask[]; requests: CareRequest[]; shifts: CareShift[]; now?: Date }) {
  const now = (o.now ?? new Date()).getTime();
  const since = now - 7 * 86400000;
  const until = now + 7 * 86400000;
  const done = o.tasks.filter((t) => t.status === 'done' && t.done_at && Date.parse(t.done_at) >= since);
  const byCategory = CATEGORIES.map((c) => ({ ...c, count: done.filter((t) => t.category === c.value).length })).filter((c) => c.count > 0);
  const upcoming = o.tasks.filter((t) => t.status === 'todo' && t.due_at && Date.parse(t.due_at) >= now && Date.parse(t.due_at) <= until)
    .sort((a, b) => (a.due_at! < b.due_at! ? -1 : 1));
  const unassigned = upcoming.filter((t) => !t.assignee_id);
  const requests = o.requests.filter((r) => Date.parse(r.created_at) >= since);
  // Créneaux de la semaine écoulée ET de la semaine qui vient (pris ou prévus)
  const rest = o.shifts.filter((s) => s.kind === 'me_time' && s.status !== 'cancelled' && Date.parse(s.starts_at) >= since && Date.parse(s.starts_at) <= until);
  const nights = o.shifts.filter((s) => s.kind === 'night' && s.status !== 'cancelled' && Date.parse(s.starts_at) >= since && Date.parse(s.starts_at) <= until);
  const points: string[] = [];
  if (unassigned.length) points.push(tr('l8.fl.pt.unassigned', { count: unassigned.length }));
  if (requests.some((r) => r.status === 'open')) points.push(tr('l8.fl.pt.openRequests'));
  if (!rest.length) points.push(tr('l8.fl.pt.noRest'));
  if (!points.length) points.push(tr('l8.fl.pt.nothing'));
  return {
    doneCount: done.length, byCategory, upcoming: upcoming.slice(0, 8), unassignedCount: unassigned.length,
    requests: { total: requests.length, accepted: requests.filter((r) => r.status === 'accepted').length, open: requests.filter((r) => r.status === 'open').length },
    restCount: rest.length, nightsCount: nights.length, points,
  };
}

// ------------------------------------------------------------------ routines
type RoutineTemplate = { kind: Routine['kind']; title: string; items: string[] };
const ROUTINE_TEMPLATES_FR: RoutineTemplate[] = [
  { kind: 'bag', title: 'Sac de l’enfant', items: ['Couches et lingettes', 'Tenue de rechange', 'Biberon ou collation', 'Doudou', 'Carnet de santé si rendez-vous'] },
  { kind: 'bedtime', title: 'Préparer le coucher', items: ['Bain ou toilette', 'Pyjama', 'Histoire', 'Veilleuse', 'Préparer le biberon de nuit'] },
  { kind: 'tomorrow', title: 'Préparer le lendemain', items: ['Vêtements', 'Sac', 'Repas', 'Vérifier l’agenda'] },
  { kind: 'shopping', title: 'Courses de la semaine', items: ['Couches', 'Lait ou aliments bébé', 'Fruits et légumes', 'Produits d’entretien'] },
  { kind: 'meals', title: 'Organiser les repas', items: ['Choisir les repas de la semaine', 'Liste de courses', 'Préparer à l’avance'] },
  { kind: 'weekly', title: 'Tâches de la semaine', items: ['Linge', 'Ménage', 'Papiers', 'Bilan de la semaine ensemble'] },
  { kind: 'appointment', title: 'Préparer un rendez-vous', items: ['Carnet de santé', 'Questions à poser', 'Ordonnances', 'Trajet'] },
  { kind: 'rest', title: 'Réserver du repos', items: ['Choisir un créneau', 'Prévoir le relais', 'Couper les notifications'] },
];

const ROUTINE_TEMPLATES_EN: RoutineTemplate[] = [
  { kind: 'bag', title: 'Child’s bag', items: ['Nappies and wipes', 'Change of clothes', 'Bottle or snack', 'Comforter', 'Health record book if there is an appointment'] },
  { kind: 'bedtime', title: 'Getting ready for bed', items: ['Bath or wash', 'Pyjamas', 'Story', 'Night light', 'Prepare the night bottle'] },
  { kind: 'tomorrow', title: 'Getting ready for tomorrow', items: ['Clothes', 'Bag', 'Meals', 'Check the diary'] },
  { kind: 'shopping', title: 'Weekly shopping', items: ['Nappies', 'Milk or baby food', 'Fruit and vegetables', 'Cleaning products'] },
  { kind: 'meals', title: 'Planning meals', items: ['Choose the week’s meals', 'Shopping list', 'Prepare ahead'] },
  { kind: 'weekly', title: 'Tasks for the week', items: ['Laundry', 'Cleaning', 'Paperwork', 'Weekly review together'] },
  { kind: 'appointment', title: 'Getting ready for an appointment', items: ['Health record book', 'Questions to ask', 'Prescriptions', 'Journey'] },
  { kind: 'rest', title: 'Booking some rest', items: ['Choose a slot', 'Arrange the relay', 'Turn off notifications'] },
];
const ROUTINE_TEMPLATES_ES: RoutineTemplate[] = [
  { kind: 'bag', title: 'Bolsa del niño', items: ['Pañales y toallitas', 'Ropa de recambio', 'Biberón o merienda', 'Peluche de apego', 'Cartilla de salud si hay cita'] },
  { kind: 'bedtime', title: 'Preparar la hora de dormir', items: ['Baño o aseo', 'Pijama', 'Cuento', 'Lamparita', 'Preparar el biberón de la noche'] },
  { kind: 'tomorrow', title: 'Preparar el día siguiente', items: ['Ropa', 'Bolsa', 'Comidas', 'Revisar la agenda'] },
  { kind: 'shopping', title: 'Compras de la semana', items: ['Pañales', 'Leche o alimentos para bebé', 'Fruta y verdura', 'Productos de limpieza'] },
  { kind: 'meals', title: 'Organizar las comidas', items: ['Elegir las comidas de la semana', 'Lista de la compra', 'Preparar con antelación'] },
  { kind: 'weekly', title: 'Tareas de la semana', items: ['Ropa', 'Limpieza', 'Papeles', 'Balance de la semana juntos'] },
  { kind: 'appointment', title: 'Preparar una cita', items: ['Cartilla de salud', 'Preguntas que hacer', 'Recetas', 'Trayecto'] },
  { kind: 'rest', title: 'Reservar descanso', items: ['Elegir un momento', 'Organizar el relevo', 'Silenciar las notificaciones'] },
];
const ROUTINE_TEMPLATES_DE: RoutineTemplate[] = [
  { kind: 'bag', title: 'Tasche des Kindes', items: ['Windeln und Feuchttücher', 'Wechselkleidung', 'Fläschchen oder Snack', 'Kuscheltier', 'Vorsorgeheft bei einem Termin'] },
  { kind: 'bedtime', title: 'Schlafenszeit vorbereiten', items: ['Baden oder Waschen', 'Schlafanzug', 'Geschichte', 'Nachtlicht', 'Fläschchen für die Nacht vorbereiten'] },
  { kind: 'tomorrow', title: 'Den nächsten Tag vorbereiten', items: ['Kleidung', 'Tasche', 'Mahlzeiten', 'Kalender prüfen'] },
  { kind: 'shopping', title: 'Wocheneinkauf', items: ['Windeln', 'Milch oder Babynahrung', 'Obst und Gemüse', 'Putzmittel'] },
  { kind: 'meals', title: 'Mahlzeiten planen', items: ['Die Mahlzeiten der Woche auswählen', 'Einkaufsliste', 'Vorkochen'] },
  { kind: 'weekly', title: 'Aufgaben der Woche', items: ['Wäsche', 'Putzen', 'Papierkram', 'Gemeinsamer Wochenrückblick'] },
  { kind: 'appointment', title: 'Einen Termin vorbereiten', items: ['Vorsorgeheft', 'Fragen, die du stellen willst', 'Rezepte', 'Anfahrt'] },
  { kind: 'rest', title: 'Erholung einplanen', items: ['Einen Zeitraum wählen', 'Die Ablösung organisieren', 'Benachrichtigungen ausschalten'] },
];
const ROUTINE_TEMPLATES_IT: RoutineTemplate[] = [
  { kind: 'bag', title: 'Borsa del bambino', items: ['Pannolini e salviette', 'Cambio di vestiti', 'Biberon o merenda', 'Pupazzo', 'Libretto sanitario se c’è un appuntamento'] },
  { kind: 'bedtime', title: 'Preparare la nanna', items: ['Bagnetto o igiene', 'Pigiama', 'Storia', 'Lucina notturna', 'Preparare il biberon della notte'] },
  { kind: 'tomorrow', title: 'Preparare il giorno dopo', items: ['Vestiti', 'Borsa', 'Pasti', 'Controllare l’agenda'] },
  { kind: 'shopping', title: 'Spesa della settimana', items: ['Pannolini', 'Latte o alimenti per bebè', 'Frutta e verdura', 'Prodotti per la pulizia'] },
  { kind: 'meals', title: 'Organizzare i pasti', items: ['Scegliere i pasti della settimana', 'Lista della spesa', 'Preparare in anticipo'] },
  { kind: 'weekly', title: 'Compiti della settimana', items: ['Bucato', 'Pulizie', 'Documenti', 'Bilancio della settimana insieme'] },
  { kind: 'appointment', title: 'Preparare un appuntamento', items: ['Libretto sanitario', 'Domande da fare', 'Prescrizioni', 'Tragitto'] },
  { kind: 'rest', title: 'Prenotare del riposo', items: ['Scegliere una fascia oraria', 'Organizzare il cambio', 'Disattivare le notifiche'] },
];
export const ROUTINE_TEMPLATES: RoutineTemplate[] = localized(ROUTINE_TEMPLATES_FR, ROUTINE_TEMPLATES_EN, { es: ROUTINE_TEMPLATES_ES, de: ROUTINE_TEMPLATES_DE, it: ROUTINE_TEMPLATES_IT });

/** Tâches qu'une routine créerait (aperçu à valider : aucune création automatique). */
export function routinePreview(r: Pick<Routine, 'items' | 'default_assignee' | 'kind'>, dueAt: string | null) {
  const cat: TaskCategory = r.kind === 'bag' ? 'packing' : r.kind === 'shopping' ? 'shopping' : r.kind === 'meals' ? 'feeding' : r.kind === 'bedtime' ? 'sleep' : r.kind === 'appointment' ? 'appointments' : r.kind === 'rest' ? 'parent_rest' : 'organization';
  return r.items.map((title) => ({ title, category: cat, assignee_id: r.default_assignee, due_at: dueAt }));
}
