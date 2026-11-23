/**
 * Révocation côté appareil (14/11/2026). Le serveur coupe tout à la seconde où un membre est retiré ou quitte un
 * foyer (RLS) ; mais le cache React Query PERSISTÉ sur le téléphone gardait ce qu'il avait déjà lu.
 * Ici : quand l'appareil constate qu'il n'appartient plus à un foyer (la liste fraîche de ses appartenances ne le
 * contient plus), il efface de son cache toutes les requêtes de ce foyer, puis la file hors ligne correspondante.
 * La persistance (AsyncStorage) suit : elle réécrit le cache sans ces requêtes au passage suivant.
 * Voir HOMI_SECURITY_REVIEW.md § 4 et HOMI_SYNC_ARCHITECTURE.md § 5.
 */
import { useEffect } from 'react';
import { useQueryClient, type Query, type QueryClient } from '@tanstack/react-query';
import { useUserId } from './auth';
import { useMemberships } from './data/hooks';
import { purgeQueueForHousehold } from './offline';
import { useUiStore } from './store';

/** Foyers connus de l'appareil qui ne figurent plus dans la liste fraîche des appartenances. */
export function lostHouseholds(known: readonly string[], current: readonly string[]): string[] {
  const now = new Set(current);
  return [...new Set(known)].filter((h) => !!h && !now.has(h));
}

const rowsOf = (data: unknown): unknown[] => (Array.isArray(data) ? data : data && typeof data === 'object' ? [data] : []);
const belongs = (row: unknown, householdId: string) =>
  !!row && typeof row === 'object' && (row as { household_id?: unknown }).household_id === householdId;

/** Vrai si la requête concerne ce foyer : identifiant dans sa clé, ou au moins une ligne de ce foyer dans ses données. */
export function queryTouchesHousehold(query: Pick<Query, 'queryKey' | 'state'>, householdId: string): boolean {
  if (query.queryKey.some((k) => k === householdId)) return true;
  return rowsOf(query.state.data).some((r) => belongs(r, householdId));
}

/** Efface du cache toutes les requêtes du foyer ; renvoie leur nombre. */
export function purgeHouseholdCache(qc: QueryClient, householdId: string): number {
  const hit = qc.getQueryCache().findAll({ predicate: (q) => queryTouchesHousehold(q, householdId) });
  for (const q of hit) qc.removeQueries({ queryKey: q.queryKey, exact: true });
  return hit.length;
}

/**
 * Monté une fois (racine de l'application). Ne décide que sur une liste d'appartenances lue AU SERVEUR pendant
 * cette session (jamais sur le cache restauré au lancement, qui pourrait être ancien).
 */
export function useHouseholdRevocationGuard() {
  const qc = useQueryClient();
  const userId = useUserId();
  const q = useMemberships();
  const known = useUiStore((s) => s.knownHouseholds);
  const setKnown = useUiStore((s) => s.setKnownHouseholds);
  const fresh = !!userId && q.isSuccess && q.isFetchedAfterMount && !q.isFetching;
  const current = fresh ? (q.data ?? []).map((m) => m.household_id) : null;
  const sig = current ? [...current].sort().join(',') : null;
  useEffect(() => {
    if (!current) return;
    for (const h of lostHouseholds(known, current)) {
      purgeHouseholdCache(qc, h);
      void purgeQueueForHousehold(h);
    }
    const next = [...new Set(current)].sort();
    if (next.join(',') !== [...known].sort().join(',')) setKnown(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, q.dataUpdatedAt]);
}
