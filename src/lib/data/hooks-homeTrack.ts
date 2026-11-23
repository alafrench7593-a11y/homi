/**
 * Foyer, couple, école (22/11/2026) — LECTURES sur une période pour les vues de suivi (aucune écriture ici : les
 * mini-apps écrivent par les hooks existants, même chemin que leurs formulaires).
 */
import { eq, gte, lte } from '../backend';
import type { KidCheck } from './hooks-tools6';
import { useHouseholdId, useRows } from './hooks';

/** Coches des routines de l'enfant entre deux jours inclus (semaine affichée). */
export function useKidChecksRange(from: string, to: string) {
  const hid = useHouseholdId();
  return useRows<KidCheck>(['kid_routine_checks', hid ?? '', 'range', from, to], hid ? { table: 'kid_routine_checks', filters: [eq('household_id', hid), gte('on_date', from), lte('on_date', to)], limit: 2000 } : null, { staleTime: 5_000 });
}
