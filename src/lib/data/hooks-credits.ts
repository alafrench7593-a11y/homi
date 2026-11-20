/**
 * Crédits HOMI IA : solde, configuration (coûts, interrupteur), historique paginé, packs de la boutique.
 * Le serveur fait foi (credits_status / credits_history / credits_config) ; l'application n'écrit jamais dans le
 * grand livre.
 */
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { backend } from '../backend';
import { useAuth } from '../auth';
import { getPurchaseMode, loadCreditPacks } from '../purchaseMode';
import { localeTag } from '@/i18n';
import type { CreditConfig, CreditHistoryRow, CreditStatus } from '../credits/model';

export const HISTORY_PAGE = 20;

export function useCreditStatus() {
  const { session } = useAuth();
  return useQuery({
    queryKey: [session?.userId, 'credits', 'status'],
    queryFn: () => backend.rpc<CreditStatus | null>('credits_status'),
    enabled: !!session,
    staleTime: 15_000,
  });
}

export function useCreditConfig() {
  const { session } = useAuth();
  return useQuery({
    queryKey: [session?.userId, 'credits', 'config'],
    queryFn: () => backend.rpc<CreditConfig | null>('credits_config').catch(() => null),
    enabled: !!session,
    staleTime: 300_000,
  });
}

/** Historique du plus récent au plus ancien, par pages (curseur : date de la dernière ligne). */
export function useCreditHistory() {
  const { session } = useAuth();
  return useInfiniteQuery({
    queryKey: [session?.userId, 'credits', 'history'],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => backend.rpc<CreditHistoryRow[]>('credits_history', { p_before: pageParam, p_limit: HISTORY_PAGE }),
    getNextPageParam: (last) => (last && last.length >= HISTORY_PAGE ? last[last.length - 1].created_at : undefined),
    enabled: !!session,
  });
}

/** Packs aux prix de la boutique (démonstration : grille signalée) ; aucun pack hors boutique. */
export function useCreditPacks() {
  const mode = getPurchaseMode();
  return useQuery({ queryKey: ['credit-packs', mode, localeTag()], queryFn: loadCreditPacks, staleTime: 600_000, retry: false, enabled: mode !== 'unavailable' });
}

/** Rafraîchit solde et historique (après un achat, une analyse). */
export function useRefreshCredits() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ predicate: (q) => q.queryKey.includes('credits') || q.queryKey.includes('access') });
}
