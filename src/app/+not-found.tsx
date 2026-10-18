/** Adresse inconnue (lien ancien ou mal copié) : on le dit clairement et on propose de repartir. */
import React from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui';
import { EmptyState } from '@/components/States';

export default function NotFound() {
  return (
    <Screen back title="Page introuvable">
      <EmptyState icon="compass" title="Cette page n’existe pas" body="Le lien est peut-être ancien ou incomplet. Rien n’a été perdu : vos données sont intactes." action={{ label: 'Revenir à l’accueil', icon: 'home', onPress: () => router.replace('/') }} />
      <Button label="Tous mes outils" variant="ghost" icon="grid" onPress={() => router.replace('/tools')} />
    </Screen>
  );
}
