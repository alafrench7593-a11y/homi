import React from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button, Text } from '@/components/ui';
import { EmptyStateCard } from '@/components/ui-extra';

export default function NotFound() {
  return (
    <Screen back title="Bientôt disponible">
      <EmptyStateCard illustration="moon" title="Écran en cours de développement" text="Cette partie de l’application arrive dans la prochaine étape." />
      <Button label="Retour à l’accueil" onPress={() => router.replace('/')} />
      <Text variant="caption" muted center>Toi & Moi — version de développement</Text>
    </Screen>
  );
}
