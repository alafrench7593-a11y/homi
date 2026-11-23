import { demoFamilyPlans, demoPlans } from '@/lib/premium/plans';
/**
 * Données du paywall « première réussite » : catalogue (boutique ou grille de démonstration), droits du compte, variante A/B.
 * Le catalogue est relu à chaque changement de compte : l'éligibilité à l'essai dépend du compte (demo_trial_used,
 * checkTrialOrIntroductoryPriceEligibility après logIn).
 */
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { useAuth } from '@/lib/auth';
import { getInstallId } from '@/lib/analytics/events';
import { useOfflineStore } from '@/lib/offline';
import { getPurchaseMode, loadFamilyPlans, loadPlans } from '@/lib/purchaseMode';
import { useBackendMode } from '@/lib/demoMode';
import { localeTag } from '@/i18n';
import { assignVariant, type TitleVariant } from './model';
import { catalogState, offerCards, type CatalogState, type OfferCard } from './offer';

/** has_premium du serveur, à trois états : undefined tant que la réponse n'est pas connue (jamais d'accès supposé). */
export function usePremiumState(): boolean | undefined {
  const { session } = useAuth();
  const q = useQuery({ queryKey: [session?.userId, 'subscriptions', 'premium'], queryFn: () => backend.rpc<boolean>('has_premium'), enabled: !!session, staleTime: 60_000 });
  if (!session) return false;
  return q.data === undefined ? undefined : q.data === true;
}

export function useOfferCatalog(showcase = false): { cards: OfferCard[]; catalog: CatalogState; refetch: () => void; mode: string } {
  useBackendMode(); // relu quand la démonstration s'ouvre
  const { session } = useAuth();
  const mode = getPurchaseMode();
  const online = useOfflineStore((s) => s.online);
  const key = [mode, localeTag(), session?.userId ?? 'anon'];
  const enabled = mode !== 'unavailable';
  const prem = useQuery({ queryKey: ['fw-plans', 'premium', ...key], queryFn: loadPlans, enabled, retry: false, staleTime: 300_000 });
  const fam = useQuery({ queryKey: ['fw-plans', 'family', ...key], queryFn: loadFamilyPlans, enabled, retry: false, staleTime: 300_000 });
  const cards = useMemo(() => offerCards(prem.data ?? [], fam.data ?? [], localeTag()), [prem.data, fam.data]);
  const networkError = /network|offline|internet|fetch|timed? ?out/i.test(String((prem.error as { message?: string } | null)?.message ?? ''));
  const catalog = catalogState({ mode, online, isLoading: prem.isLoading, isError: prem.isError, count: (prem.data ?? []).length, web: Platform.OS === 'web', networkError });
  // Vitrine web : grille prévue (indicative), sans boutique ni démonstration
  const showcaseCards = useMemo(() => (showcase ? offerCards(demoPlans(localeTag()), demoFamilyPlans(localeTag()), localeTag()) : []), [showcase]);
  if (showcase) return { cards: showcaseCards, catalog: 'ready', mode, refetch: () => undefined };
  return { cards, catalog, mode, refetch: () => { void prem.refetch(); void fam.refetch(); } };
}

/** Variante du test A/B, stable par installation. */
export function useTitleVariant(): TitleVariant | null {
  const [v, setV] = useState<TitleVariant | null>(null);
  useEffect(() => { let alive = true; void getInstallId().then((id) => { if (alive) setV(assignVariant(id)); }); return () => { alive = false; }; }, []);
  return v;
}
