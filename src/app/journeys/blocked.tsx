/** Écran d'un parcours qui n'est pas (ou plus) actif : on explique, sans afficher de données mélangées. */
import React from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/States';
import { Button } from '@/components/ui';
import { t as tr } from '@/i18n';

export default function Blocked() {
  return (
    <Screen back title={tr('pj.blocked.title')}>
      <EmptyState icon="compass" title={tr('pj.blocked.title')} body={tr('pj.blocked.body')} />
      <Button label={tr('pj.editJourney')} icon="compass" onPress={() => router.replace('/journeys')} full testID="blocked-journeys" />
      <Button label={tr('pj.blocked.home')} variant="ghost" onPress={() => router.replace('/(tabs)')} full />
    </Screen>
  );
}
