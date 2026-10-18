/**
 * Partage de la charge familiale : logique pure, testée.
 * Pas de classement, pas de score, pas de compétition. Les signaux de surcharge reposent
 * uniquement sur ce qui a été noté (tâches, demandes, créneaux, fatigue déclarée par la personne
 * elle-même) et ne disent jamais ce que quelqu'un « a ».
 */
import type { IconName } from '@/components/ui';

export type TaskCategory = 'feeding' | 'diapers' | 'sleep' | 'shopping' | 'packing' | 'appointments' | 'housework' | 'admin' | 'organization' | 'parent_rest' | 'other';
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

export const CATEGORIES: { value: TaskCategory; label: string; icon: IconName }[] = [
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
  { value: 'other', label: 'Autre', icon: 'circle' },
];
export const categoryOf = (c: TaskCategory) => CATEGORIES.find((x) => x.value === c) ?? CATEGORIES[CATEGORIES.length - 1];

/** Actions rapides (§ 20). `needsTask` / `needsShift` : il faut choisir l'élément concerné. */
export const QUICK_ACTIONS: { kind: RequestKind; label: string; icon: IconName; detail: string; needsTask?: boolean; needsShift?: boolean }[] = [
  { kind: 'taking_over', label: 'Je prends le relais', icon: 'repeat', detail: 'Prévient le foyer que vous prenez la suite.' },
  { kind: 'rest', label: 'J’ai besoin de repos', icon: 'moon', detail: 'Demande à être relayé·e pour souffler.' },
  { kind: 'take_task', label: 'Peux-tu prendre cette tâche ?', icon: 'share', detail: 'Proposer une tâche à quelqu’un d’autre.', needsTask: true },
  { kind: 'available', label: 'Je suis disponible', icon: 'check-circle', detail: 'Signaler que vous pouvez aider.' },
  { kind: 'swap_slot', label: 'Échanger mon créneau', icon: 'shuffle', detail: 'Proposer d’échanger un relais de nuit.', needsShift: true },
  { kind: 'help_today', label: 'J’ai besoin d’aide aujourd’hui', icon: 'life-buoy', detail: 'Demande d’aide générale pour la journée.' },
  { kind: 'relay', label: 'Demander un relais', icon: 'users', detail: 'Pour qu’on prenne le bébé un moment.' },
];
export const REQUEST_LABEL: Record<RequestKind, string> = Object.fromEntries(QUICK_ACTIONS.map((a) => [a.kind, a.label])) as Record<RequestKind, string>;

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
    out.push({ key: 'overdue', title: 'Plusieurs tâches ont pris du retard', why: `${overdue.length} tâches notées sont passées. Ça arrive, surtout avec un bébé.`, suggestions: [{ label: 'Alléger la journée', to: '/family/difficult' }, { label: 'Reporter ce qui peut attendre', to: '/family/difficult' }] });
  }
  const todays = todo.filter((t) => t.due_at && sameLocalDay(t.due_at, o.day));
  if (todays.length >= 8) {
    out.push({ key: 'heavy_day', title: 'Journée très chargée', why: `${todays.length} tâches sont prévues aujourd’hui.`, suggestions: [{ label: 'Simplifier la journée', to: '/family/difficult' }, { label: 'Déléguer une tâche', to: '/family' }] });
  }
  const soon = todo.filter((t) => !t.assignee_id && t.due_at && Date.parse(t.due_at) < now.getTime() + 2 * 86400000);
  if (soon.length >= 3) {
    out.push({ key: 'unassigned', title: 'Des tâches sans responsable', why: `${soon.length} tâches des deux prochains jours n’ont personne d’attribué.`, suggestions: [{ label: 'Les répartir ensemble', to: '/family' }] });
  }
  // Répartition : uniquement sur ce qui a été noté ; pas de nom, pas de chiffre par personne
  const week = o.tasks.filter((t) => t.status === 'done' && t.done_at && Date.parse(t.done_at) > now.getTime() - 7 * 86400000 && t.done_by);
  if (week.length >= 8) {
    const mine = week.filter((t) => t.done_by === o.me).length;
    if (mine / week.length >= 0.75) {
      out.push({ key: 'imbalance', title: 'Une grande part repose sur vous cette semaine', why: 'D’après les tâches notées comme faites ces 7 derniers jours. Ce qui n’est pas noté n’apparaît pas ici.', suggestions: [{ label: 'Proposer une tâche à quelqu’un', to: '/family' }, { label: 'En parler ensemble au bilan de la semaine', to: '/family/review' }] });
    }
  }
  const restedRecently = o.shifts.some((s) => s.kind === 'me_time' && s.user_id === o.me && s.status !== 'cancelled' && Date.parse(s.ends_at) > now.getTime() - 7 * 86400000);
  const askedRest = o.requests.some((r) => r.from_user === o.me && (r.kind === 'rest' || r.kind === 'help_today') && Date.parse(r.created_at) > now.getTime() - 3 * 86400000);
  if ((o.myDeclaredFatigue ?? 0) >= 4 || askedRest) {
    if (!restedRecently) {
      out.push({ key: 'rest', title: 'Un moment de repos vous ferait du bien', why: askedRest ? 'Vous avez demandé du repos ou de l’aide récemment.' : 'Vous avez noté une fatigue élevée.', suggestions: [{ label: 'Réserver du temps pour soi', to: '/family/me-time' }, { label: 'Demander un relais', to: '/family' }, { label: 'Contacter une personne de confiance', to: '/postpartum/support' }] });
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
  if (unassigned.length) points.push(`${unassigned.length} tâche${unassigned.length > 1 ? 's' : ''} à venir sans responsable : à répartir ensemble ?`);
  if (requests.some((r) => r.status === 'open')) points.push('Des demandes attendent encore une réponse.');
  if (!rest.length) points.push('Aucun temps pour soi pris ou prévu : en réserver un pour chacun ?');
  if (!points.length) points.push('Rien de particulier à ajuster d’après ce qui est noté.');
  return {
    doneCount: done.length, byCategory, upcoming: upcoming.slice(0, 8), unassignedCount: unassigned.length,
    requests: { total: requests.length, accepted: requests.filter((r) => r.status === 'accepted').length, open: requests.filter((r) => r.status === 'open').length },
    restCount: rest.length, nightsCount: nights.length, points,
  };
}

// ------------------------------------------------------------------ routines
export const ROUTINE_TEMPLATES: { kind: Routine['kind']; title: string; items: string[] }[] = [
  { kind: 'bag', title: 'Sac de l’enfant', items: ['Couches et lingettes', 'Tenue de rechange', 'Biberon ou collation', 'Doudou', 'Carnet de santé si rendez-vous'] },
  { kind: 'bedtime', title: 'Préparer le coucher', items: ['Bain ou toilette', 'Pyjama', 'Histoire', 'Veilleuse', 'Préparer le biberon de nuit'] },
  { kind: 'tomorrow', title: 'Préparer le lendemain', items: ['Vêtements', 'Sac', 'Repas', 'Vérifier l’agenda'] },
  { kind: 'shopping', title: 'Courses de la semaine', items: ['Couches', 'Lait ou aliments bébé', 'Fruits et légumes', 'Produits d’entretien'] },
  { kind: 'meals', title: 'Organiser les repas', items: ['Choisir les repas de la semaine', 'Liste de courses', 'Préparer à l’avance'] },
  { kind: 'weekly', title: 'Tâches de la semaine', items: ['Linge', 'Ménage', 'Papiers', 'Bilan de la semaine ensemble'] },
  { kind: 'appointment', title: 'Préparer un rendez-vous', items: ['Carnet de santé', 'Questions à poser', 'Ordonnances', 'Trajet'] },
  { kind: 'rest', title: 'Réserver du repos', items: ['Choisir un créneau', 'Prévoir le relais', 'Couper les notifications'] },
];

/** Tâches qu'une routine créerait (aperçu à valider : aucune création automatique). */
export function routinePreview(r: Pick<Routine, 'items' | 'default_assignee' | 'kind'>, dueAt: string | null) {
  const cat: TaskCategory = r.kind === 'bag' ? 'packing' : r.kind === 'shopping' ? 'shopping' : r.kind === 'meals' ? 'feeding' : r.kind === 'bedtime' ? 'sleep' : r.kind === 'appointment' ? 'appointments' : r.kind === 'rest' ? 'parent_rest' : 'organization';
  return r.items.map((title) => ({ title, category: cat, assignee_id: r.default_assignee, due_at: dueAt }));
}
