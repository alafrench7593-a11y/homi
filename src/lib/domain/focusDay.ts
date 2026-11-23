/**
 * Mode « parent TDAH » : 3 choses aujourd'hui (23/11/2026).
 * Les 3 choix restent sur l'appareil (identifiants de tâches du jour) : la tâche partagée n'est pas modifiée,
 * une mission reçue peut donc être choisie. Les tâches choisies ne sont jamais reportées. Logique pure.
 */
import { atLocal, sameLocalDay, type FamilyTask } from './familyLoad';

export const FOCUS_MAX = 3;

/** Tâches ouvertes pour moi aujourd'hui (du jour, en retard ou sans date), triées par échéance. */
export function focusDay(tasks: FamilyTask[], day: string, me: string | null, picks: { day: string; ids: string[] } = { day: '', ids: [] }) {
  const start = atLocal(day, 0).toISOString();
  const open = tasks
    .filter((t) => t.status === 'todo' && (!t.assignee_id || t.assignee_id === me) && (!t.due_at || sameLocalDay(t.due_at, day) || t.due_at < start))
    .sort((a, b) => (a.due_at ?? '9') < (b.due_at ?? '9') ? -1 : (a.due_at ?? '9') > (b.due_at ?? '9') ? 1 : 0);
  const ids = picks.day === day ? picks.ids : [];
  const focus = open.filter((t) => ids.includes(t.id)).slice(0, FOCUS_MAX);
  const rest = open.filter((t) => !focus.includes(t));
  return { focus, rest, canAdd: focus.length < FOCUS_MAX };
}

/** Ajoute ou retire un choix du jour (au plus 3 ; les choix d'un autre jour sont oubliés). */
export function togglePick(picks: { day: string; ids: string[] }, day: string, id: string) {
  const ids = picks.day === day ? picks.ids : [];
  return { day, ids: ids.includes(id) ? ids.filter((x) => x !== id) : ids.length < FOCUS_MAX ? [...ids, id] : ids };
}

/** « Juste 10 minutes » : heure de fin affichée, aucun minuteur qui tourne à l'écran. */
export const startTimerEnd = (now: number, minutes = 10) => new Date(now + minutes * 60000);
