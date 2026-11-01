/** Écran d'un parcours qui n'est pas (ou plus) actif : on explique, sans afficher de données mélangées. */
import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Banner } from '@/components/ui';
import { toolForPath } from '@/lib/domain/toolForPath';
import type { TKey } from '@/i18n';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/States';
import { Button } from '@/components/ui';
import { t as tr } from '@/i18n';

export default function Blocked() {
  // Écran demandé (envoyé par la garde des parcours) : on dit QUEL outil n'est pas disponible
  const { from } = useLocalSearchParams<{ from?: string }>();
  const tool = typeof from === 'string' ? toolForPath(from) : null;
  const toolName = tool ? tr(`tool.${tool.id}` as TKey) : null;
  return (
    <Screen back title={tr('pj.blocked.title')}>
      <EmptyState icon="compass" title={tr('pj.blocked.title')} body={tr('pj.blocked.body')} />
      {toolName && !toolName.startsWith('tool.') ? <Banner tone="info" title={tr('pj.blocked.tool')}>{toolName}</Banner> : null}
      <Button label={tr('pj.editJourney')} icon="compass" onPress={() => router.replace('/journeys')} full testID="blocked-journeys" />
      <Button label={tr('pj.blocked.home')} variant="ghost" onPress={() => router.replace('/(tabs)')} full />
    </Screen>
  );
}
