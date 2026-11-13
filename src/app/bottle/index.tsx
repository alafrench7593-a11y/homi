/**
 * Biberons du foyer (v3) : un enfant par ligne (jumeaux, triplés…) sur une surface MATE ; chaque ligne montre l'état
 * réel (biberon en cours, prochain rappel) et s'agrandit vers l'écran de l'enfant (transition carte → détail).
 * Point focal : l'action « Noter un biberon » en bas d'écran.
 */
import React from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { SectionTitle, Text } from '@/components/ui';
import { SecondaryButton } from '@/components/controls';
import { MatteSurface } from '@/components/surfaces';
import { BottleNotificationSettings, noRecommendationNote } from '@/features/bottle';
import { BottleChildRow } from '@/features/bottleList';
import { useBottleChildren, useBottleTimers } from '@/lib/data/hooks-bottle';
import { radius, spacing } from '@/theme/tokens';
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
        <MatteSurface radius={radius.lg} padded={spacing.xs} testID="bottle-children">
          {sorted.map((c, i) => <BottleChildRow key={c.id} child={c} last={i === sorted.length - 1} />)}
        </MatteSurface>
      )}
      {sorted.length ? <SecondaryButton label={tr('u6.bottle_index.history')} icon="list" onPress={() => router.push({ pathname: '/bottle/history', params: { child: sorted[0].id } })} testID="bottles-history" /> : null}
      <SectionTitle title={tr('u6.bottle_index.notifications')} />
      <BottleNotificationSettings />
      <Text variant="caption" muted>{noRecommendationNote()}</Text>
    </Screen>
  );
}
