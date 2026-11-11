/**
 * Assistant IA en ligne : écran « Bientôt disponible » (src/config/features.ts). Aucune fausse conversation :
 * l'écran l'annonce clairement et propose ce qui fonctionne déjà (réponses à partir des articles, bibliothèque,
 * urgences).
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Icon, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export function AiComingSoonCard() {
  const th = useTheme();
  return (
    <Card testID="ai-coming-soon">
      <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: th.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="clock" size={26} color={th.colors.primary} />
        </View>
        <Text variant="caption" weight="bold" color={th.colors.gold} style={{ letterSpacing: 1.2 }}>{tr('pw.soon.badge').toUpperCase()}</Text>
        <Text variant="heading" center accessibilityRole="header">{tr('pw.soon.title')}</Text>
        <Text variant="small" muted center>{tr('pw.soon.body')}</Text>
      </View>
      <View style={{ gap: spacing.xs }}>
        <Button label={tr('pw.soon.articles')} icon="book-open" onPress={() => router.push('/assistant/local')} testID="ai-soon-local" />
        <Button label={tr('pw.soon.library')} icon="search" variant="secondary" onPress={() => router.push('/library')} testID="ai-soon-library" />
      </View>
    </Card>
  );
}

export function AiComingSoonScreen({ back = false }: { back?: boolean }) {
  return (
    // Dans l'onglet Questions (sans retour), réserver la place de la barre d'onglets comme les autres onglets
    <Screen back={back} title={tr('pw.soon.screenTitle')} bottomInset={back ? 0 : 96}>
      <AiComingSoonCard />
      <Banner tone="info" icon="phone">{tr('pw.soon.urgent')}</Banner>
      <Button label={tr('pw.emergency')} icon="life-buoy" variant="ghost" onPress={() => router.push('/emergency')} testID="ai-soon-emergency" />
    </Screen>
  );
}
