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

export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  React.useEffect(() => { reportError(error); }, [error]);
  return (
    <View accessibilityRole="alert" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm, backgroundColor: '#FFF6F2' }}>
      <Icon name="alert-triangle" size={36} color="#C2416E" />
      <Text variant="title" center color="#2A1B2E">Oups, cet écran a rencontré un problème</Text>
      <Text center color="#5B4A5E" style={{ maxWidth: 340 }}>Vos données ne sont pas perdues. Réessayez, ou revenez à l’accueil.</Text>
      <View style={{ gap: spacing.xs, alignSelf: 'stretch', maxWidth: 360, marginTop: spacing.sm }}>
        <Button label="Réessayer" icon="refresh-cw" onPress={retry} full />
        <Button label="Revenir à l’accueil" variant="secondary" icon="home" onPress={() => { router.replace('/'); retry(); }} full />
      </View>
      <Text variant="caption" center color="#5B4A5E" style={{ marginTop: spacing.sm }}>En cas d’urgence, appelez le 15 ou le 112.</Text>
    </View>
  );
}
