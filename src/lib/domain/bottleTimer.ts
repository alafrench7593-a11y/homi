/**
 * Minuteur biberon — logique pure (sans React, sans réseau).
 *
 * Principes :
 *  - L'application ne calcule NI ne recommande AUCUNE quantité ni AUCUN rythme.
 *    Elle n'utilise que le délai et la quantité saisis par le parent (ou indiqués
 *    par son professionnel de santé).
 *  - Échéances en instants ABSOLUS (millisecondes UTC) : « dernier biberon + 3 h 30 »
 *    correspond toujours à 3 h 30 réellement écoulées, quel que soit le fuseau ou
 *    le changement d'heure. Seul l'AFFICHAGE de l'heure dépend du fuseau.
 */

export type BottleTimerStatus = 'active' | 'cancelled' | 'done';

export interface TimerCore {
  id?: string;
  child_id: string;
  last_bottle_at: string;
  interval_minutes: number;
  due_at: string;
  planned_ml: number | null;
  status: BottleTimerStatus;
  created_at?: string;
  updated_at?: string;
}

export const MIN_INTERVAL_MINUTES = 10;
export const MAX_INTERVAL_MINUTES = 12 * 60;
export const MAX_ML = 500;

/** Délais proposés au choix (aucun n'est présélectionné : c'est le parent qui choisit). */
export const DELAY_PRESETS: { minutes: number; label: string }[] = [
  { minutes: 120, label: '2 h' },
  { minutes: 150, label: '2 h 30' },
  { minutes: 180, label: '3 h' },
  { minutes: 210, label: '3 h 30' },
  { minutes: 240, label: '4 h' },
];
/** Reports proposés depuis l'écran de l'enfant (ouvert par la notification). */
export const SNOOZE_PRESETS = [10, 15, 30, 60];

const MS = 60_000;
const toDate = (d: Date | string | number) => (d instanceof Date ? d : new Date(d));

export function isValidInterval(minutes: unknown): minutes is number {
  return typeof minutes === 'number' && Number.isInteger(minutes) && minutes >= MIN_INTERVAL_MINUTES && minutes <= MAX_INTERVAL_MINUTES;
}

export function isValidMl(ml: unknown): boolean {
  return ml == null || (typeof ml === 'number' && Number.isInteger(ml) && ml >= 0 && ml <= MAX_ML);
}

/**
 * Lecture d'une durée saisie librement : « 3h30 », « 3 h 30 », « 3:30 », « 2h », « 45 min », « 210 ».
 * Un nombre seul est lu en minutes. Renvoie null si invalide ou hors bornes (10 min à 12 h).
 */
export function parseDelay(input: string): number | null {
  const s = input.trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return null;
  let minutes: number | null = null;
  let m = s.match(/^(\d{1,2})h(\d{1,2})?(min)?$/);
  if (m) minutes = Number(m[1]) * 60 + Number(m[2] ?? 0);
  if (minutes == null && (m = s.match(/^(\d{1,2})[:.](\d{2})$/))) minutes = Number(m[1]) * 60 + Number(m[2]);
  if (minutes == null && (m = s.match(/^(\d{1,3})(min|mn|m)?$/))) minutes = Number(m[1]);
  if (minutes == null) return null;
  if (m && m[2] && /h|:|\./.test(s) && Number(m[2]) > 59) return null;
  return isValidInterval(minutes) ? minutes : null;
}

/** Échéance absolue : dernier biberon + délai (en temps réellement écoulé). */
export function computeDueAt(lastBottleAt: Date | string, intervalMinutes: number): Date {
  return new Date(toDate(lastBottleAt).getTime() + intervalMinutes * MS);
}

export interface NewTimerInput {
  childId: string;
  lastBottleAt: Date | string;
  intervalMinutes: number;
  plannedMl?: number | null;
}

/** Nouveau minuteur actif. Lève une erreur (en français) si la saisie est incohérente. */
export function newTimer(input: NewTimerInput, now: Date = new Date()): TimerCore {
  if (!input.childId) throw new Error('Choisissez un enfant.');
  if (!isValidInterval(input.intervalMinutes)) throw new Error('Le délai doit être compris entre 10 minutes et 12 heures.');
  if (!isValidMl(input.plannedMl)) throw new Error('Quantité attendue entre 0 et 500 ml.');
  const last = toDate(input.lastBottleAt);
  if (Number.isNaN(last.getTime())) throw new Error('Heure du dernier biberon invalide.');
  if (last.getTime() > now.getTime() + MS) throw new Error('L’heure du dernier biberon est dans le futur.');
  return {
    child_id: input.childId,
    last_bottle_at: last.toISOString(),
    interval_minutes: input.intervalMinutes,
    due_at: computeDueAt(last, input.intervalMinutes).toISOString(),
    planned_ml: input.plannedMl ?? null,
    status: 'active',
  };
}

/** « Mettre à jour l'heure » du dernier biberon : l'échéance suit, avec le même délai. */
export function updateLastBottleTime(timer: TimerCore, at: Date | string, now: Date = new Date()): Pick<TimerCore, 'last_bottle_at' | 'due_at'> {
  const d = toDate(at);
  if (Number.isNaN(d.getTime())) throw new Error('Heure invalide.');
  if (d.getTime() > now.getTime() + MS) throw new Error('Cette heure est dans le futur.');
  return { last_bottle_at: d.toISOString(), due_at: computeDueAt(d, timer.interval_minutes).toISOString() };
}

/** « Modifier le délai » : nouvelle échéance = dernier biberon + nouveau délai (les reports précédents sont remplacés). */
export function modifyInterval(timer: TimerCore, minutes: number): Pick<TimerCore, 'interval_minutes' | 'due_at'> {
  if (!isValidInterval(minutes)) throw new Error('Le délai doit être compris entre 10 minutes et 12 heures.');
  return { interval_minutes: minutes, due_at: computeDueAt(timer.last_bottle_at, minutes).toISOString() };
}

/**
 * « Reporter » : décale l'échéance. Si le rappel est déjà passé, le report part de maintenant
 * (reporter de 15 min un rappel dépassé = rappel dans 15 min).
 */
export function snoozeTimer(timer: TimerCore, minutes: number, now: Date = new Date()): Pick<TimerCore, 'due_at'> {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 6 * 60) throw new Error('Report attendu entre 1 minute et 6 heures.');
  const base = Math.max(toDate(timer.due_at).getTime(), now.getTime());
  return { due_at: new Date(base + minutes * MS).toISOString() };
}

/**
 * « Modifier l'heure du rappel » : le parent choisit directement l'heure du prochain rappel.
 * Elle doit être dans le futur, après le dernier biberon, et au plus 2 jours après lui.
 */
export function setReminderAt(timer: Pick<TimerCore, 'last_bottle_at'>, at: Date | string, now: Date = new Date()): Pick<TimerCore, 'due_at'> {
  const d = toDate(at);
  if (Number.isNaN(d.getTime())) throw new Error('Heure invalide.');
  if (d.getTime() <= now.getTime()) throw new Error('Choisissez une heure à venir.');
  const last = toDate(timer.last_bottle_at).getTime();
  if (d.getTime() <= last) throw new Error('Le rappel doit être après le dernier biberon.');
  if (d.getTime() > last + 2 * 86_400_000) throw new Error('Le rappel doit être au plus 2 jours après le dernier biberon.');
  return { due_at: d.toISOString() };
}

export const cancelTimer = (): Pick<TimerCore, 'status'> => ({ status: 'cancelled' });
export const markBottleGiven = (): Pick<TimerCore, 'status'> => ({ status: 'done' });

/**
 * Remplacement sans doublon : s'il existe un minuteur actif pour cet enfant,
 * il est clôturé (« done » s'il est remplacé par un nouveau biberon, sinon « cancelled »)
 * avant la création du nouveau.
 */
export function planReplacement(
  active: TimerCore | null | undefined,
  next: TimerCore,
  reason: 'new_bottle' | 'restart' = 'new_bottle',
): { close: { id: string; patch: Pick<TimerCore, 'status'> } | null; create: TimerCore } {
  if (active && active.child_id !== next.child_id) throw new Error('Ce minuteur appartient à un autre enfant.');
  const close = active && active.status === 'active' && active.id ? { id: active.id, patch: { status: reason === 'new_bottle' ? 'done' as const : 'cancelled' as const } } : null;
  return { close, create: { ...next, status: 'active' } };
}

export function activeTimerFor<T extends TimerCore>(timers: T[] | null | undefined, childId: string): T | null {
  const list = (timers ?? []).filter((t) => t.child_id === childId && t.status === 'active');
  list.sort((a, b) => (b.updated_at ?? b.created_at ?? '').localeCompare(a.updated_at ?? a.created_at ?? ''));
  return list[0] ?? null;
}

/** Délai utilisé la dernière fois POUR CET ENFANT (« Reprendre l'intervalle précédent »). */
export function lastIntervalFor(timers: TimerCore[] | null | undefined, childId: string): number | null {
  const list = (timers ?? []).filter((t) => t.child_id === childId && isValidInterval(t.interval_minutes));
  list.sort((a, b) => (b.created_at ?? b.last_bottle_at).localeCompare(a.created_at ?? a.last_bottle_at));
  return list[0]?.interval_minutes ?? null;
}

export const remainingMinutes = (timer: Pick<TimerCore, 'due_at'>, now: Date = new Date()) => (toDate(timer.due_at).getTime() - now.getTime()) / MS;
export const elapsedMinutes = (timer: Pick<TimerCore, 'last_bottle_at'>, now: Date = new Date()) => Math.max(0, (now.getTime() - toDate(timer.last_bottle_at).getTime()) / MS);

/** Avancement 0 → 1 entre le dernier biberon et l'échéance (pour l'anneau). */
export function timerProgress(timer: Pick<TimerCore, 'last_bottle_at' | 'due_at'>, now: Date = new Date()): number {
  const start = toDate(timer.last_bottle_at).getTime();
  const end = toDate(timer.due_at).getTime();
  if (end <= start) return 1;
  return Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)));
}

/** « 3 h 30 », « 3 h 05 », « 2 h », « 45 min ». Arrondi à la minute ; une durée négative est lue en valeur absolue. */
export function formatHM(minutes: number): string {
  const m = Math.round(Math.abs(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${String(r).padStart(2, '0')}` : `${h} h`;
}

/** Minutes restantes affichées : arrondi au-dessus, pour ne jamais annoncer « 0 min » avant l'échéance. */
export function formatRemaining(minutes: number): string {
  return minutes > 0 ? formatHM(Math.ceil(minutes - 1e-9)) : formatHM(minutes);
}

interface ZonedParts { year: number; month: number; day: number; hour: number; minute: number; weekday: number }

/** Composantes d'une date dans un fuseau donné (ou le fuseau de l'appareil si absent). */
export function zonedParts(date: Date | string, timeZone?: string): ZonedParts {
  const d = toDate(date);
  if (!timeZone) return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours(), minute: d.getMinutes(), weekday: d.getDay() };
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23', weekday: 'short' }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { year: Number(get('year')), month: Number(get('month')), day: Number(get('day')), hour: Number(get('hour')) % 24, minute: Number(get('minute')), weekday: wd < 0 ? 0 : wd };
}

/** Heure murale en français : « 14 h 45 », « 4 h 00 ». */
export function formatClock(date: Date | string, timeZone?: string): string {
  const p = zonedParts(date, timeZone);
  return `${p.hour} h ${String(p.minute).padStart(2, '0')}`;
}

/** Clé de jour AAAA-MM-JJ dans le fuseau donné. */
export function dayKey(date: Date | string, timeZone?: string): string {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

const dayDiff = (a: string, b: string) => Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 86_400_000);

/** « à 14 h 45 », « demain à 1 h 15 », « hier à 23 h 10 », « le 12/10 à 9 h 00 ». */
export function atClock(date: Date | string, now: Date = new Date(), timeZone?: string): string {
  const diff = dayDiff(dayKey(now, timeZone), dayKey(date, timeZone));
  const clock = formatClock(date, timeZone);
  if (diff === 0) return `à ${clock}`;
  if (diff === 1) return `demain à ${clock}`;
  if (diff === -1) return `hier à ${clock}`;
  const p = zonedParts(date, timeZone);
  return `le ${String(p.day).padStart(2, '0')}/${String(p.month).padStart(2, '0')} à ${clock}`;
}

/**
 * Phrase affichée sur l'écran du minuteur, par exemple :
 * « Prochain rappel pour Lina dans 3 h 30, à 14 h 45. Quantité enregistrée : 150 ml. »
 */
export function timerSentence(opts: { childName: string; timer: Pick<TimerCore, 'due_at' | 'planned_ml' | 'status'>; now?: Date; timeZone?: string }): string {
  const now = opts.now ?? new Date();
  const { childName, timer, timeZone } = opts;
  const qty = timer.planned_ml != null ? ` Quantité enregistrée : ${timer.planned_ml} ml.` : '';
  if (timer.status === 'cancelled') return `Le rappel pour ${childName} a été annulé.`;
  if (timer.status === 'done') return `Le biberon de ${childName} a été noté comme donné.`;
  const rem = remainingMinutes(timer, now);
  if (rem > 0) return `Prochain rappel pour ${childName} dans ${formatRemaining(rem)}, ${atClock(timer.due_at, now, timeZone)}.${qty}`;
  return `Le rappel pour ${childName} était prévu ${atClock(timer.due_at, now, timeZone)} (il y a ${formatHM(rem)}).${qty}`;
}

/**
 * Phrase principale de l'écran : « Prochain rappel de biberon de Lina à 16 h 40. »
 * (« demain à 1 h 15 » si le rappel tombe le lendemain).
 */
export function nextReminderSentence(childName: string, dueAt: Date | string, now: Date = new Date(), timeZone?: string): string {
  return `Prochain rappel de biberon de ${childName} ${atClock(dueAt, now, timeZone)}.`;
}

/**
 * Contenu de la notification locale. L'horaire est celui choisi par le parent : aucune affirmation médicale.
 * La quantité n'apparaît que si le parent l'a autorisé (réglage « Afficher la quantité dans la notification »).
 */
export function notificationContent(childName: string, plannedMl: number | null | undefined, showQuantity = false): { title: string; body: string } {
  return {
    title: `Biberon de ${childName}`,
    body: `Rappel choisi pour ${childName} : le prochain biberon était prévu maintenant.${showQuantity && plannedMl != null ? ` Quantité notée : ${plannedMl} ml.` : ''}`,
  };
}

/** Lien profond vers le minuteur d'un enfant. */
export const bottleTimerUrl = (childId: string) => `/bottle/${childId}`;

// ---------------------------------------------------------------- saisie d'un biberon
export type ReminderChoice =
  | { kind: 'none' }
  | { kind: 'delay'; minutes: number }
  | { kind: 'previous'; minutes: number };

export const resolveReminderChoice = (c: ReminderChoice): number | null => (c.kind === 'none' ? null : isValidInterval(c.minutes) ? c.minutes : null);

export interface BottleDraft {
  prepared_ml: number | null;
  consumed_ml: number | null;
  planned_next_ml: number | null;
  reminder: ReminderChoice;
}

/**
 * Valeurs initiales du formulaire : TOUT est vide, aucun rappel.
 * La seule exception est la quantité prévue que le parent a lui-même enregistrée
 * sur le minuteur (« Marquer le biberon comme donné ») : elle pré-remplit la quantité préparée.
 */
export function bottleDraftDefaults(from?: { plannedMl?: number | null }): BottleDraft {
  return { prepared_ml: from?.plannedMl ?? null, consumed_ml: null, planned_next_ml: null, reminder: { kind: 'none' } };
}
