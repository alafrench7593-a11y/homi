/**
 * Frise de la journée (fil d'or) — logique pure, partagée par l'organisation familiale, l'agenda, les rendez-vous
 * et le relais de nuit. Classe chaque élément de la journée : fait, en cours, en retard, le suivant, à venir.
 * Rien n'est inventé : seuls les éléments réellement notés (tâches, événements, rendez-vous, relais) sont placés.
 */
export type ThreadState = 'done' | 'now' | 'late' | 'past' | 'next' | 'todo' | 'anytime';

export interface ThreadInput {
  key: string;
  /** Début (ISO) ; null = « dans la journée » sans heure. */
  at: string | null;
  /** Fin (ISO) pour un créneau (événement, rendez-vous, nuit). */
  end?: string | null;
  done?: boolean;
  /** Tâche à cocher : un retard reste « à faire » (late) au lieu d'être simplement passé. */
  actionable?: boolean;
  allDay?: boolean;
}

/** Au-delà de 30 min sans être fait, une tâche datée passe « en retard ». */
export const LATE_GRACE_MIN = 30;

export function threadStates<T extends ThreadInput>(items: T[], now: Date = new Date()): (T & { state: ThreadState })[] {
  const n = now.getTime();
  const timed = items.filter((i) => i.at && !i.allDay).sort((a, b) => (a.at! < b.at! ? -1 : a.at! > b.at! ? 1 : 0));
  const untimed = items.filter((i) => !i.at || i.allDay);
  let nextGiven = false;
  const out: (T & { state: ThreadState })[] = timed.map((i) => {
    const start = Date.parse(i.at!);
    const end = i.end ? Date.parse(i.end) : start;
    let state: ThreadState;
    if (i.done) state = 'done';
    else if (i.end && start <= n && n < end) state = 'now';
    else if (end + (i.actionable ? LATE_GRACE_MIN * 60_000 : 0) < n) state = i.actionable ? 'late' : 'past';
    else if (!nextGiven) { state = 'next'; nextGiven = true; }
    else state = 'todo';
    return { ...i, state };
  });
  return [...out, ...untimed.map((i) => ({ ...i, state: (i.done ? 'done' : 'anytime') as ThreadState }))];
}

/** Libellé court de l'état, pour la frise. */
export const THREAD_LABEL: Record<ThreadState, string> = {
  done: 'Fait', now: 'En cours', late: 'En retard', past: 'Passé', next: 'Ensuite', todo: 'Prévu', anytime: 'Dans la journée',
};

/** Compte à rebours lisible : « dans 2 h 15 », « dans 3 jours », « aujourd’hui à 14 h 30 ». */
export function countdown(iso: string, now: Date = new Date()): string {
  const ms = Date.parse(iso) - now.getTime();
  if (ms <= 0) return 'maintenant';
  const min = Math.round(ms / 60_000);
  if (min < 60) return `dans ${min} min`;
  const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
  const d1 = new Date(iso); d1.setHours(0, 0, 0, 0);
  const days = Math.round((d1.getTime() - d0.getTime()) / 86_400_000);
  if (days === 0) { const h = Math.floor(min / 60); const m = min % 60; return `dans ${h} h${m ? ` ${String(m).padStart(2, '0')}` : ''}`; }
  if (days === 1) return 'demain';
  return `dans ${days} jours`;
}
