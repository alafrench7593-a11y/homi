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
    <View accessibilityRole="alert" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm, backgroundColor: '#FFF6F2' }}>
      <Icon name="alert-triangle" size={36} color="#C2416E" />
      <Text variant="title" center color="#2A1B2E">{tr('error.screen.title')}</Text>
      <Text center color="#5B4A5E" style={{ maxWidth: 340 }}>{tr('error.screen.body')}</Text>
      <View style={{ gap: spacing.xs, alignSelf: 'stretch', maxWidth: 360, marginTop: spacing.sm }}>
        <Button label={tr('common.retry')} icon="refresh-cw" onPress={retry} full />
        <Button label={tr('error.screen.home')} variant="secondary" icon="home" onPress={() => { router.replace('/'); retry(); }} full />
      </View>
      <Text variant="caption" center color="#5B4A5E" style={{ marginTop: spacing.sm }}>{tr('error.screen.emergency')}</Text>
    </View>
  );
}
