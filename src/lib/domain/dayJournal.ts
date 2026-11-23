/**
 * Journal du jour d'un enfant (planche 2 du brief client) : les événements de TOUTES les natures mélangés par heure,
 * pour un jour civil local choisi (dans l'adresse : `?day=AAAA-MM-JJ`). Pur, testé (src/__tests__/dayJournal.test.ts).
 * Lit les mêmes tables que les mini-apps via `relayItems` : rien n'est recopié.
 */
import { relayItems, type BottleLike, type BreastfeedLike, type DiaperLike, type RelayItem } from './relayDraft';
import { dayKey, type SleepLike } from './sleepSummary';

/** Jour valide (AAAA-MM-JJ, pas dans le futur) sinon aujourd'hui. */
export function journalDay(raw: string | null | undefined, now: Date): string {
  const today = dayKey(now);
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return today;
  const [y, m, d] = raw.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getMonth() !== m - 1 || dt.getDate() !== d) return today;
  return raw > today ? today : raw;
}

/** Jour voisin (−1 / +1), jamais après aujourd'hui. */
export function shiftDay(day: string, delta: number, now: Date): string {
  const [y, m, d] = day.split('-').map(Number);
  return journalDay(dayKey(new Date(y, m - 1, d + delta)), now);
}

/** Événements de ce jour (un sommeil qui touche le jour y figure), triés par heure ; jamais ceux d'un autre enfant. */
export function journalItems(o: {
  childId: string; day: string; now: Date; sleeps: readonly SleepLike[]; bottles: readonly BottleLike[];
  diapers?: readonly DiaperLike[]; breastfeeds?: readonly BreastfeedLike[];
}): RelayItem[] {
  const [y, m, d] = o.day.split('-').map(Number);
  const since = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 1, 0, 0, 0, -1);
  const until = end.getTime() < o.now.getTime() ? end : o.now;
  return relayItems({ childId: o.childId, since, now: until, sleeps: o.sleeps, bottles: o.bottles, diapers: o.diapers, breastfeeds: o.breastfeeds });
}
