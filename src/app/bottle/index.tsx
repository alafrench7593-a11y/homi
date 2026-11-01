/** Tous les minuteurs biberon du foyer : un par enfant (jumeaux, triplés…). */
import React from 'react';
import { router } from 'expo-router';
import { Appear } from '@/components/Appear';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, SectionTitle, Text } from '@/components/ui';
import { BottleNotificationSettings, BottleTimerCard, noRecommendationNote } from '@/features/bottle';

import { useBottleTimers } from '@/lib/data/hooks-bottle';
import { useBottleChildren } from '@/lib/data/hooks-bottle';
import { t as tr } from '@/i18n';

export default function BottleTimers() {
  const childrenQ = useBottleChildren();
  const { data: children } = childrenQ;
  const isLoading = childrenQ.isLoading && !children;
  const { data: timers } = useBottleTimers();
  const activeCount = timers?.length ?? 0;
  // Enfants suivis au biberon d'abord, puis les autres
  const sorted = [...(children ?? [])].sort((a, b) => Number(b.enabled_tracking.includes('bottle')) - Number(a.enabled_tracking.includes('bottle')));

  return (
    <Screen back title={tr('u6.bottle_index.title')} subtitle={activeCount ? tr('u6.bottle_index.active', { count: activeCount }) : tr('u6.bottle_index.per_child')}
      action={sorted.length ? { label: tr('u6.bottle_index.add'), icon: 'plus', testID: 'bottles-add', onPress: () => router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: sorted[0].id } }) } : undefined}>
      {isLoading ? <Skeleton kind="card" rows={2} /> : childrenQ.isError && !children ? (
        <ErrorView error={childrenQ.error} onRetry={() => void childrenQ.refetch()} title={tr('u6.bottle_index.error')} />
      ) : !sorted.length ? (
        <EmptyState
          icon="clock"
          title={tr('u6.bottle_index.empty_title')}
          body={tr('u6.bottle_index.empty_body')}
          action={{ label: tr('u6.bottle_index.add_child'), onPress: () => router.push({ pathname: '/profiles/new', params: { kind: 'child' } }) }}
        />
      ) : (
        sorted.map((c, i) => (
          <Appear key={c.id} kind="soft" delay={0.05 * i}>
            <BottleTimerCard child={c} />
          </Appear>
        ))
      )}
      {sorted.length ? <Button label={tr('u6.bottle_index.history')} icon="list" variant="secondary" onPress={() => router.push({ pathname: '/bottle/history', params: { child: sorted[0].id } })} /> : null}
      <SectionTitle title={tr('u6.bottle_index.notifications')} />
      <BottleNotificationSettings />
      <Text variant="caption" muted>{noRecommendationNote()}</Text>
    </Screen>
  );
}
