/**
 * Garde d'accès : un écran propre à un parcours (grossesse, biberons, post-partum, projet bébé…) ne s'ouvre
 * que si l'un de MES parcours actifs l'autorise (registre central src/lib/journeys/tools.ts). Un lien ancien,
 * une notification passée ou un favori ne ramènent donc jamais dans un parcours terminé.
 */
import { useEffect } from 'react';
import { router, usePathname } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useChildren, useHouseholdId, useJourneys, usePregnancies } from '@/lib/data/hooks';
import { useScope } from '@/lib/data/hooks-scope';
import { screenAllowed } from '@/lib/journeys/tools';

export function JourneyGuard() {
  const path = usePathname();
  const { session } = useAuth();
  const hid = useHouseholdId();
  const scope = useScope();
  const journeys = useJourneys();
  const pregnancies = usePregnancies();
  const children = useChildren();
  // Décision prise sur des données relues depuis l'ouverture (jamais sur un cache ancien)
  const settled = (q: { data?: unknown; isFetching: boolean }) => q.data !== undefined && !q.isFetching;
  const fresh = (q: { isFetchedAfterMount: boolean; isFetching: boolean }) => q.isFetchedAfterMount && !q.isFetching;
  const ready = !!session && scope.loaded && fresh(journeys) && (!hid || (settled(pregnancies) && settled(children)));
  const key = scope.activeScopes.join(',');
  useEffect(() => {
    if (!ready || !path || path.startsWith('/journeys')) return;
    if (!screenAllowed(path, scope.activeScopes)) router.replace({ pathname: '/journeys/blocked', params: { from: path } });
  }, [ready, path, key, journeys.isFetching, pregnancies.isFetching, children.isFetching]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
