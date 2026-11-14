/** Navigation de « Découvrir HOMI » : sortie (Passer / Commencer), catalogue, démo d'un outil. Garde `?replay=1`. */
import { useCallback, useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useUiStore } from '@/lib/store';
import { discoverExit } from './flow';

export function useDiscoverNav() {
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const isReplay = replay === '1';
  const { session } = useAuth();
  const introSeen = useUiStore((s) => s.introSeen);
  const exit = useCallback(() => {
    const e = discoverExit({ replay: isReplay, session: !!session, introSeen, canGoBack: router.canGoBack() });
    if (e.kind === 'dismissTo') router.dismissTo(e.href as never);
    else router.replace(e.href as never);
  }, [isReplay, session, introSeen]);
  return useMemo(() => {
    const q = isReplay ? '?replay=1' : '';
    return {
      replay: isReplay,
      session: !!session,
      exit,
      openCatalog: () => router.push(`/discover/tools${q}` as never),
      openTool: (key: string) => router.push(`/discover/tool/${key}${q}` as never),
      toolHref: (key: string) => `/discover/tool/${key}${q}`,
      backToKeynote: () => (router.canGoBack() ? router.back() : router.replace(`/discover${q}` as never)),
    };
  }, [isReplay, session, exit]);
}
