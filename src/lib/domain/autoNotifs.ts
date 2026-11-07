/**
 * Notifications automatiques (07/11/2026) — logique pure, testée (src/__tests__/autoNotifs.test.ts).
 * Ce que la maman n'a pas à programmer elle-même :
 *  - rendez-vous : la veille à 19 h et 1 h avant (sauf si un rappel a déjà été choisi pour ce rendez-vous) ;
 *  - tâches du foyer à faire (qui lui sont confiées ou sans personne attitrée) : à l'heure prévue, 9 h si pas d'heure ;
 *  - échéances à préparer (rentrée, anniversaires…) : le jour où il faut s'y mettre, à 10 h ;
 *  - papiers qui expirent : 60 jours et 15 jours avant, à 10 h.
 * Heures calmes (par défaut 22 h – 7 h) : ces notifications sont décalées à la fin des heures calmes.
 * Les rappels de médicaments, de traitements et le minuteur biberon ne sont JAMAIS concernés (ils ont leurs propres règles).
 */
export type AutoKind = 'appointment' | 'task' | 'prep' | 'paper';

export interface AutoPrefs {
  appointments: boolean;
  tasks: boolean;
  prep: boolean;
  papers: boolean;
  quiet: boolean;
  /** heures calmes, en heures entières (début inclus, fin exclue), ex. 22 → 7 */
  quietFrom: number;
  quietTo: number;
}
export const DEFAULT_AUTO_PREFS: AutoPrefs = { appointments: true, tasks: true, prep: true, papers: true, quiet: true, quietFrom: 22, quietTo: 7 };

export interface AutoPlan {
  /** identifiant stable : la même chose n'est programmée qu'une fois */
  id: string;
  kind: AutoKind;
  at: Date;
  title: string;
  body: string;
  url: string;
  /** tâche validable depuis la notification */
  taskId?: string;
}

export interface AutoInputs {
  now: Date;
  me: string | null;
  appointments: { id: string; title: string; starts_at: string; private_to_creator?: boolean; created_by?: string | null }[];
  /** rendez-vous qui ont déjà un rappel choisi par la personne */
  appointmentsWithReminder: Set<string>;
  tasks: { id: string; title: string; due_at: string | null; status: string; assignee_id: string | null }[];
  prep: { key: string; title: string; notifyOn: string }[];
  papers: { id: string; title: string; expires_on: string }[];
}

export interface AutoTexts {
  apptEve: (title: string, time: string) => { title: string; body: string };
  apptSoon: (title: string, time: string) => { title: string; body: string };
  apptPrivate: string;
  task: (title: string) => { title: string; body: string };
  prep: (title: string) => { title: string; body: string };
  paper: (title: string, days: number) => { title: string; body: string };
}

const MAX_AUTO = 30; // iOS : 64 notifications en attente pour toute l'appli ; on en garde pour les rappels
const pad = (n: number) => String(n).padStart(2, '0');
const at = (day: string, h: number, m = 0) => { const [y, mo, d] = day.slice(0, 10).split('-').map(Number); return new Date(y, mo - 1, d, h, m, 0, 0); };
const dayOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const addDays = (day: string, n: number) => { const d = at(day, 12); d.setDate(d.getDate() + n); return dayOf(d); };

/** Dans les heures calmes ? (plage qui peut passer minuit, ex. 22 h → 7 h) */
export function inQuiet(d: Date, p: Pick<AutoPrefs, 'quiet' | 'quietFrom' | 'quietTo'>): boolean {
  if (!p.quiet || p.quietFrom === p.quietTo) return false;
  const h = d.getHours();
  return p.quietFrom < p.quietTo ? h >= p.quietFrom && h < p.quietTo : h >= p.quietFrom || h < p.quietTo;
}
/** Décale à la fin des heures calmes (le lendemain matin si besoin). */
export function afterQuiet(d: Date, p: Pick<AutoPrefs, 'quiet' | 'quietFrom' | 'quietTo'>): Date {
  if (!inQuiet(d, p)) return d;
  const out = new Date(d);
  if (p.quietFrom > p.quietTo && d.getHours() >= p.quietFrom) out.setDate(out.getDate() + 1);
  out.setHours(p.quietTo, 0, 0, 0);
  return out;
}

export function planAutoNotifications(i: AutoInputs, prefs: AutoPrefs, tx: AutoTexts): AutoPlan[] {
  const out: AutoPlan[] = [];
  const now = i.now.getTime();
  const push = (p: AutoPlan, shiftQuiet: boolean) => {
    const when = shiftQuiet ? afterQuiet(p.at, prefs) : p.at;
    if (when.getTime() > now + 30_000) out.push({ ...p, at: when });
  };
  if (prefs.appointments) {
    for (const a of i.appointments) {
      if (a.private_to_creator && a.created_by && a.created_by !== i.me) continue;
      const start = new Date(a.starts_at);
      if (start.getTime() <= now) continue;
      const title = a.private_to_creator ? tx.apptPrivate : a.title;
      const eve = at(dayOf(start), 19); eve.setDate(eve.getDate() - 1);
      push({ id: `appt-eve-${a.id}`, kind: 'appointment', at: eve, ...tx.apptEve(title, hhmm(start)), url: '/appointments' }, true);
      if (!i.appointmentsWithReminder.has(a.id)) push({ id: `appt-1h-${a.id}`, kind: 'appointment', at: new Date(start.getTime() - 3600_000), ...tx.apptSoon(title, hhmm(start)), url: '/appointments' }, false);
    }
  }
  if (prefs.tasks) {
    for (const t of i.tasks) {
      if (t.status !== 'todo' || !t.due_at) continue;
      if (t.assignee_id && t.assignee_id !== i.me) continue;
      const hasTime = t.due_at.length > 10 && !/T00:00(:00(\.000)?)?(Z|[+-]00:00)?$/.test(t.due_at);
      const when = hasTime ? new Date(t.due_at) : at(t.due_at, 9);
      push({ id: `task-${t.id}`, kind: 'task', at: when, ...tx.task(t.title), url: '/family', taskId: t.id }, true);
    }
  }
  if (prefs.prep) for (const p of i.prep) push({ id: `prep-${p.key}`, kind: 'prep', at: at(p.notifyOn, 10), ...tx.prep(p.title), url: '/family/prep' }, true);
  if (prefs.papers) {
    for (const p of i.papers) {
      for (const days of [60, 15]) push({ id: `paper-${p.id}-${days}`, kind: 'paper', at: at(addDays(p.expires_on, -days), 10), ...tx.paper(p.title, days), url: '/family/papers' }, true);
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, MAX_AUTO);
}

/** Signature d'un plan : s'il change (heure, texte), la notification est reprogrammée. */
export function planSignature(p: AutoPlan): string {
  return JSON.stringify([p.at.toISOString(), p.title, p.body, p.url, p.taskId ?? null]);
}
