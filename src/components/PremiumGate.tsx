/**
 * Verrouillage strict (08/11/2026) : sur un écran réservé, sans Premium confirmé par le serveur (has_premium),
 * l'écran Premium s'affiche par-dessus la page (la navigation reste intacte : retour, onglets, liens profonds).
 * Les écrans libres (connexion, onboarding, profil, réglages, données, urgences…) ne sont jamais couverts :
 * voir src/lib/premium/access.ts. Le serveur refuse de toute façon les nouvelles saisies sans droit.
 */
import React from 'react';
import { View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { IconButton } from '@/components/ui';
import { parentRoute } from '@/lib/parentRoute';
import { spacing } from '@/theme/tokens';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDemoInset } from '@/components/demoInset';
import { Loading } from '@/components/ui';
import { Paywall } from '@/features/Paywall';
import { backend } from '@/lib/backend';
import { useAuth } from '@/lib/auth';
import { useAccess } from '@/lib/data/hooks-access';
import { gateFor } from '@/lib/premium/access';
import { useTheme } from '@/theme/ThemeProvider';
import { t as tr } from '@/i18n';

export function PremiumGate() {
  const { session } = useAuth();
  const pathname = usePathname() ?? '/';
  const th = useTheme();
  const insets = useSafeAreaInsets();
  // Haut : zone sûre + place de la pastille « Démonstration » (0 hors démo)
  const topInset = insets.top + useDemoInset();
  // même clé que usePremium() : une seule lecture de has_premium pour toute l'application
  const q = useQuery({ queryKey: [session?.userId, 'subscriptions', 'premium'], queryFn: () => backend.rpc<boolean>('has_premium'), enabled: !!session, staleTime: 60_000 });
  const access = useAccess();
  if (!session) return null;
  // réponse inconnue après une erreur (hors connexion sans cache) : jamais d'ouverture par défaut
  const premium = q.data === true ? true : q.data === false || q.isError ? false : undefined;
  const decision = gateFor(pathname, premium, access.data ?? null);
  if (decision === 'open') return null;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: th.colors.background, paddingTop: topInset, paddingBottom: insets.bottom }}
      testID={decision === 'checking' ? 'premium-gate-checking' : 'premium-gate'} accessibilityViewIsModal>
      {/* Retour toujours visible (audit 01 N-05 / 09) : l'écran verrouillé couvre l'en-tête et la barre d'onglets */}
      <View style={{ flexDirection: 'row', paddingHorizontal: spacing.sm }}>
        <IconButton icon="arrow-left" label={tr('common.back')} testID="premium-gate-back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace(parentRoute(pathname) as never))} />
      </View>
      {decision === 'checking' ? <Loading label={tr('pw.checking')} /> : <Paywall locked />}
    </View>
  );
}
