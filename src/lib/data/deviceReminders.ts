import { backend, eq } from '../backend';
import type { Reminder } from '../types';

/**
 * Rappels à programmer sur CE téléphone : les miens + ceux qu'un autre membre du foyer a choisi de partager
 * (colonne `shared`, lecture seule ; la sécurité côté serveur limite la lecture aux foyers dont je suis membre).
 * Si la colonne n'existe pas encore (migration non appliquée), seuls mes rappels sont pris : rien ne casse.
 */
export async function loadDeviceReminders(userId: string): Promise<Reminder[]> {
  const mine = await backend.select<Reminder>({ table: 'reminders', filters: [eq('user_id', userId)] });
  const shared = await backend.select<Reminder>({ table: 'reminders', filters: [eq('shared', true)] }).catch(() => [] as Reminder[]);
  return mergeDeviceReminders(userId, mine, shared);
}

export function mergeDeviceReminders(userId: string, mine: Reminder[], shared: Reminder[] | undefined): Reminder[] {
  const ids = new Set(mine.map((r) => r.id));
  return [...mine, ...(shared ?? []).filter((r) => r.user_id !== userId && !ids.has(r.id))];
}
