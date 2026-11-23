/**
 * Paywall de conclusion du parcours « première réussite » (src/features/firstWin/Offers.tsx). `?resume=1` : retour après l'inscription.
 * Web : aucun tarif ni essai (l'app n'est pas en vente) — écran neutre : créer son compte ou continuer la démo.
 */
import React from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import { FirstWinOffers } from '@/features/firstWin/Offers';
import { Button, Text } from '@/components/ui';
import { WebPurchaseNotice } from '@/features/subscription';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function StartOffers() {
  const th = useTheme();
  if (Platform.OS !== 'web') return <FirstWinOffers />;
  return (
    <View style={{ flex: 1, backgroundColor: th.colors.background, justifyContent: 'center', padding: spacing.lg, gap: spacing.md, maxWidth: 520, width: '100%', alignSelf: 'center' }} testID="web-offers-neutral">
      <WebPurchaseNotice />
      <Button label={tr('auth.signUp')} onPress={() => router.replace('/auth/sign-up')} testID="web-offers-sign-up" />
      <Button label={tr('webDemo.openDemo')} variant="secondary" onPress={() => router.replace('/demo' as never)} testID="web-offers-demo" />
      <Text center muted variant="small">{tr('webDemo.noPrice')}</Text>
    </View>
  );
}
