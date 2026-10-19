/** Tous les minuteurs biberon du foyer : un par enfant (jumeaux, triplés…). */
import React from 'react';
import { router } from 'expo-router';
import { Appear } from '@/components/Appear';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, SectionTitle, Text } from '@/components/ui';
import { BottleNotificationSettings, BottleTimerCard, NO_RECOMMENDATION_NOTE } from '@/features/bottle';
import { useTrackedChildren } from '@/lib/data/hooks';
import { useBottleTimers } from '@/lib/data/hooks-bottle';

export default function BottleTimers() {
  const childrenQ = useTrackedChildren();
  const { data: children } = childrenQ;
  const isLoading = childrenQ.isLoading && !children;
  const { data: timers } = useBottleTimers();
  const activeCount = timers?.length ?? 0;
  // Enfants suivis au biberon d'abord, puis les autres
  const sorted = [...(children ?? [])].sort((a, b) => Number(b.enabled_tracking.includes('bottle')) - Number(a.enabled_tracking.includes('bottle')));

  return (
    <Screen back title="Minuteurs biberon" subtitle={activeCount ? `${activeCount} rappel${activeCount > 1 ? 's' : ''} en cours` : 'Un minuteur par enfant'}>
      {isLoading ? <Skeleton kind="card" rows={2} /> : childrenQ.isError && !children ? (
        <ErrorView error={childrenQ.error} onRetry={() => void childrenQ.refetch()} title="Impossible d’afficher les minuteurs" />
      ) : !sorted.length ? (
        <EmptyState
          icon="clock"
          title="Aucun enfant à suivre"
          body="Ajoutez d’abord le profil d’un enfant."
          action={{ label: 'Ajouter un enfant', onPress: () => router.push({ pathname: '/profiles/new', params: { kind: 'child' } }) }}
        />
      ) : (
        sorted.map((c, i) => (
          <Appear key={c.id} kind="soft" delay={0.05 * i}>
            <BottleTimerCard child={c} />
          </Appear>
        ))
      )}
      {sorted.length ? <Button label="Historique des biberons" icon="list" variant="secondary" onPress={() => router.push({ pathname: '/bottle/history', params: { child: sorted[0].id } })} /> : null}
      <SectionTitle title="Notifications" />
      <BottleNotificationSettings />
      <Text variant="caption" muted>{NO_RECOMMENDATION_NOTE}</Text>
    </Screen>
  );
}
