/**
 * Portions préparées (outil 122) — logique pure, testée (foyerTools.test.ts).
 * Reste = nombre préparé − utilisations (chaque utilisation est une ligne : un envoi répété ne décompte jamais deux
 * fois). L'échéance est la date limite SAISIE par le parent (ou calculée depuis le nombre de jours qu'il saisit) :
 * HOMI ne propose aucune durée de conservation. Les conseils de conservation d'une recette liée sont ceux de la
 * recette, avec ses sources.
 */
import { addDays, daysBetween, type ISODate } from '@/lib/domain/dates';

export type PortionStorage = 'freezer' | 'fridge';
export interface PortionBatch {
  id: string; household_id: string; child_id: string | null; label: string; recipe_slug: string | null; portions_total: number;
  prepared_on: ISODate; storage: PortionStorage; use_by: ISODate | null; note: string | null; created_at?: string; _pending?: boolean;
}
export interface PortionUse { id: string; household_id: string; portion_id: string; count: number; used_at: string; used_by: string | null; _pending?: boolean }

export function portionsLeft(b: Pick<PortionBatch, 'id' | 'portions_total'>, uses: Pick<PortionUse, 'portion_id' | 'count'>[]): number {
  const used = uses.filter((u) => u.portion_id === b.id).reduce((s, u) => s + u.count, 0);
  return Math.max(0, b.portions_total - used);
}

export type ExpiryStatus = 'expired' | 'today' | 'soon' | 'ok' | 'none';
/** Échéance : dépassée, aujourd'hui, bientôt (≤ 2 jours), à venir, ou aucune date saisie. */
export function expiryStatus(useBy: ISODate | null, today: ISODate, soonDays = 2): ExpiryStatus {
  if (!useBy) return 'none';
  const d = daysBetween(today, useBy);
  if (d < 0) return 'expired';
  if (d === 0) return 'today';
  return d <= soonDays ? 'soon' : 'ok';
}

/** Date limite depuis un nombre de jours saisi par le parent (« 30 » → préparation + 30 jours). */
export function useByFromDays(preparedOn: ISODate, days: number): ISODate | null {
  if (!Number.isInteger(days) || days < 0 || days > 3650) return null;
  return addDays(preparedOn, days);
}

/** Lots à afficher : ceux qui restent d'abord, triés par échéance (sans date en dernier), puis les lots terminés. */
export function sortBatches<T extends PortionBatch>(list: T[], uses: PortionUse[]): { active: T[]; finished: T[] } {
  const active = list.filter((b) => portionsLeft(b, uses) > 0)
    .sort((a, b) => (a.use_by ?? '9999').localeCompare(b.use_by ?? '9999') || a.prepared_on.localeCompare(b.prepared_on));
  const finished = list.filter((b) => portionsLeft(b, uses) === 0).sort((a, b) => b.prepared_on.localeCompare(a.prepared_on));
  return { active, finished };
}

/** Alertes : lots entamés ou non dont l'échéance est dépassée, aujourd'hui ou proche. */
export function expiryAlerts<T extends PortionBatch>(list: T[], uses: PortionUse[], today: ISODate): T[] {
  return list.filter((b) => portionsLeft(b, uses) > 0 && ['expired', 'today', 'soon'].includes(expiryStatus(b.use_by, today)));
}
