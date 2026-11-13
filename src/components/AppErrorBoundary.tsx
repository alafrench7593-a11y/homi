/**
 * Écran d'erreur global : une erreur de rendu n'affiche plus jamais un écran blanc.
 * Exporté comme `ErrorBoundary` par la mise en page racine (expo-router).
 */
import React from 'react';
import { View } from 'react-native';
import { router, type ErrorBoundaryProps } from 'expo-router';
import { Button, Icon, Text } from '@/components/ui';
import { reportError } from '@/lib/crashReporting';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  React.useEffect(() => { reportError(error); }, [error]);
  return (
    <View accessibilityRole="alert" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm, backgroundColor: '#F4F0FA' }}>
      <Icon name="alert-triangle" size={36} color="#A3243A" />
      <Text variant="title" center color="#1C1533">{tr('error.screen.title')}</Text>
      <Text center color="#584D72" style={{ maxWidth: 340 }}>{tr('error.screen.body')}</Text>
      <View style={{ gap: spacing.xs, alignSelf: 'stretch', maxWidth: 360, marginTop: spacing.sm }}>
        <Button label={tr('common.retry')} icon="refresh-cw" onPress={retry} full />
        <Button label={tr('error.screen.home')} variant="secondary" icon="home" onPress={() => { router.replace('/'); retry(); }} full />
      </View>
      <Text variant="caption" center color="#584D72" style={{ marginTop: spacing.sm }}>{tr('error.screen.emergency')}</Text>
      {/* Détail technique (aucune donnée personnelle) : à envoyer au support pour corriger le problème */}
      <Text variant="caption" center color="#584D72" selectable style={{ maxWidth: 360, marginTop: spacing.xs }} testID="error-detail">
        {tr('error.screen.detail', { detail: `${error?.name ?? 'Error'}: ${(error?.message ?? '').slice(0, 160)}` })}
      </Text>
    </View>
  );
}
