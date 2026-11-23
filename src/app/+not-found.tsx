/**
 * Adresse inconnue (lien ancien ou mal copié) : on le dit clairement, on rassure (rien n'est perdu), on montre
 * l'adresse demandée, puis trois façons de repartir : l'ACTION PRINCIPALE « Revenir à l'accueil », « Tous mes
 * outils », et la recherche d'outil (le plus souvent, on cherchait un outil précis).
 */
import React from 'react';
import { View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button, Icon, Text } from '@/components/ui';
import { ToolSearchButton } from '@/features/hubs/ToolSearch';
import { useTheme } from '@/theme/ThemeProvider';
import { linesOf, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function NotFound() {
  const t = useTheme();
  const path = usePathname();
  return (
    <Screen back title={tr('u1.nf.screen')} tool={false}
      action={{ label: tr('u1.nf.home'), icon: 'home', onPress: () => router.replace('/'), testID: 'nf-home' }}>
      <View style={{ gap: spacing.sm }} testID="not-found">
        <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: linesOf(t).iconWell }}>
          <Icon name="compass" size={26} color={t.colors.primary} />
        </View>
        <Text variant="heading" accessibilityRole="header">{tr('u1.nf.title')}</Text>
        <Text muted>{tr('u1.nf.body')}</Text>
        {path && path !== '/' ? <Text variant="caption" muted selectable testID="nf-path">{tr('h5.nf.path', { path })}</Text> : null}
      </View>
      <View style={{ gap: spacing.xs }}>
        <Text variant="label" muted>{tr('h5.nf.find')}</Text>
        <ToolSearchButton testID="nf-search" />
      </View>
      <Button label={tr('u1.nf.tools')} variant="secondary" icon="grid" full onPress={() => router.replace('/tools')} testID="nf-tools" />
    </Screen>
  );
}
