/**
 * Accès aux offres du 07/11/2026 (Assistant IA, outils à vie) — lu sur le serveur (my_access), qui fait foi.
 */
import { useQuery } from '@tanstack/react-query';
import { backend } from '../backend';
import { useAuth } from '../auth';
import { toolAccess, type AccessInfo, type ToolAccess } from '../premium/offers';

export function useAccess() {
  const { session } = useAuth();
  return useQuery({
    queryKey: [session?.userId, 'access'],
    queryFn: () => backend.rpc<AccessInfo | null>('my_access').catch(() => null),
    enabled: !!session,
    staleTime: 60_000,
  });
}

export function useToolAccess(tool: string | null | undefined): ToolAccess & { loading: boolean } {
  const q = useAccess();
  return { ...toolAccess(tool, q.data ?? null), loading: q.isLoading };
}
