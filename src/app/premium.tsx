/**
 * Écran Premium plein écran (`/premium`, `/premium?from=onboarding`) — libre d'accès, même sans abonnement.
 * Fermeture toujours visible en haut. Depuis l'onboarding : après l'achat confirmé, « Plus tard » ou la fermeture,
 * retour à l'accueil `/(tabs)` (jamais de retour vers l'onboarding terminé). Sinon : retour, ou l'écran parent.
 */
import React from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopInset } from '@/components/demoInset';
import { useToast } from '@/components/Overlays';
import { IconButton } from '@/components/ui';
import { Paywall } from '@/features/Paywall';
import { goUp } from '@/lib/links';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function PremiumScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const pathname = usePathname() ?? '/premium';
  const top = useTopInset();
  const bottom = useSafeAreaInsets().bottom;
  const fromOnboarding = from === 'onboarding';
  const toast = useToast();
  const home = () => router.replace('/(tabs)');
  const close = () => (fromOnboarding ? home() : goUp(pathname));
  return (
    <View style={{ flex: 1, paddingTop: top }} testID="premium-screen">
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.sm, minHeight: 48, alignItems: 'center' }}>
        <IconButton icon="x" label={fromOnboarding ? tr('pay2.later') : tr('pay2.close')} tone="filled" onPress={close} testID="pw2-close" />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: bottom + spacing.lg, maxWidth: 560, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={Platform.OS === 'web'}>
        <Paywall embedded onContinue={fromOnboarding ? home : close} onPurchased={fromOnboarding ? () => { toast(tr('pay2.welcome'), 'success'); home(); } : undefined} onLater={fromOnboarding ? home : undefined} />
      </ScrollView>
    </View>
  );
}
