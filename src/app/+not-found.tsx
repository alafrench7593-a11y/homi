/** Adresse inconnue (lien ancien ou mal copié) : on le dit clairement et on propose de repartir. */
import React from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui';
import { EmptyState } from '@/components/States';
import { t as tr } from '@/i18n';

export default function NotFound() {
  return (
    <Screen back title={tr('u1.nf.screen')}>
      <EmptyState icon="compass" title={tr('u1.nf.title')} body={tr('u1.nf.body')} action={{ label: tr('u1.nf.home'), icon: 'home', onPress: () => router.replace('/') }} />
      <Button label={tr('u1.nf.tools')} variant="ghost" icon="grid" onPress={() => router.replace('/tools')} />
    </Screen>
  );
}
