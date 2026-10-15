/** Tous les minuteurs biberon du foyer : un par enfant (jumeaux, triplés…). */
import React from 'react';
import { router } from 'expo-router';
import { Appear } from '@/components/Appear';
import { Screen } from '@/components/Screen';
import { Banner, Button, Loading, SectionTitle, Text } from '@/components/ui';
import { BottleNotificationSettings, BottleTimerCard, NO_RECOMMENDATION_NOTE } from '@/features/bottle';
import { useChildren } from '@/lib/data/hooks';
import { useBottleTimers } from '@/lib/data/hooks-bottle';

export default function BottleTimers() {
  const { data: children, isLoading } = useChildren();
  const { data: timers } = useBottleTimers();
  const activeCount = timers?.length ?? 0;
  // Enfants suivis au biberon d'abord, puis les autres
  const sorted = [...(children ?? [])].sort((a, b) => Number(b.enabled_tracking.includes('bottle')) - Number(a.enabled_tracking.includes('bottle')));

  return (
    <Screen back title="Minuteurs biberon" subtitle={activeCount ? `${activeCount} rappel${activeCount > 1 ? 's' : ''} en cours` : 'Un minuteur par enfant'}>
      {isLoading ? <Loading /> : !sorted.length ? (
        <>
          <Banner tone="info">{'Ajoutez d’abord le profil d’un enfant.'}</Banner>
          <Button label="Ajouter un profil" onPress={() => router.push('/profiles/new')} />
        </>
      ) : (
        sorted.map((c, i) => (
          <Appear key={c.id} kind="soft" delay={0.05 * i}>
            <BottleTimerCard child={c} />
          </Appear>
        ))
      )}
      <Button label="Historique des biberons" icon="list" variant="secondary" onPress={() => router.push({ pathname: '/bottle/history', params: sorted[0] ? { child: sorted[0].id } : {} })} />
      <SectionTitle title="Notifications" />
      <BottleNotificationSettings />
      <Text variant="caption" muted>{NO_RECOMMENDATION_NOTE}</Text>
    </Screen>
  );
}
