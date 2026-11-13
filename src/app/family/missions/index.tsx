/**
 * Missions familiales : reçues et envoyées. Une mission est une demande pratique entre membres du foyer
 * (« Acheter des couches taille 4 aujourd'hui »), suivie par statut, sans messages ni relances.
 * Pas de classement, pas de compteur par personne, pas de « vu ».
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, Segmented, Text } from '@/components/ui';
import { Cascade } from '@/motion';
import { MissionCard } from '@/features/missions/MissionCard';
import { DemoPerson } from '@/features/missions/DemoPerson';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useMissions } from '@/lib/data/hooks-missions';
import { missionHref } from '@/lib/domain/missions';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

type Tab = 'received' | 'sent';

export default function Missions() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'sent' ? 'sent' : 'received');
  const q = useMissions();
  const { labelOf, people } = usePeople();
  const list = tab === 'received' ? q.received : q.sent;
  const toAccept = q.received.filter((m) => m.mission_state === 'pending').length;

  return (
    <Screen back title={tr('mis.title')} subtitle={tr('mis.sub')}>
      <DemoPerson />
      <View style={{ gap: spacing.xs }}>
        <Button label={tr('mis.new')} icon="plus" full onPress={() => router.push('/family/missions/new')} testID="mission-new" />
        <Button label={tr('mis.resp.title')} icon="user-check" variant="secondary" full onPress={() => router.push('/family/missions/responsibilities')} testID="mission-resp" />
      </View>
      {people.length < 2 ? <Text variant="small" muted>{tr('mis.form.alone')}</Text> : null}
      <Segmented label={tr('mis.tabs')} value={tab} onChange={setTab}
        options={[
          { value: 'received', label: toAccept ? `${tr('mis.tab.received')} · ${toAccept}` : tr('mis.tab.received'), testID: 'mission-tab-received' },
          { value: 'sent', label: tr('mis.tab.sent'), testID: 'mission-tab-sent' },
        ]} />
      {tab === 'received' && toAccept ? <Text variant="small" muted accessibilityLiveRegion="polite">{tr('mis.toAccept', { count: toAccept })}</Text> : null}
      {q.isLoading && !q.data ? <Skeleton kind="card" rows={3} /> : q.isError && !q.data ? (
        <ErrorView error={q.error} onRetry={() => void q.refetch()} />
      ) : !list.length ? (
        tab === 'received'
          ? <EmptyState icon="inbox" title={tr('mis.empty.received')} body={tr('mis.empty.receivedB')} />
          : <EmptyState icon="send" title={tr('mis.empty.sent')} body={tr('mis.empty.sentB')} action={{ label: tr('mis.new'), onPress: () => router.push('/family/missions/new') }} />
      ) : (
        <View style={{ gap: spacing.sm }} testID={`missions-${tab}`}>
          {list.map((m, i) => (
            <Cascade key={m.id} index={i}>
              <MissionCard m={m} me={q.me} labelOf={labelOf} onOpen={() => router.push(missionHref(m.id) as never)} />
            </Cascade>
          ))}
        </View>
      )}
    </Screen>
  );
}
