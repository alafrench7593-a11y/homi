/**
 * Missions familiales : reçues et envoyées (refonte 16/11/2026). Une mission est une demande pratique entre membres
 * du foyer (« Acheter des couches taille 4 aujourd'hui »), suivie par statut, sans messages ni relances.
 * Composition : pastille démo compacte, synthèse en tuiles de résultat, sélecteur Reçues / Envoyées, liste lisible sur
 * surface mate (une ligne par mission : prénom + avatar de la personne en face, statut icône + libellé, échéance) ;
 * toucher une ligne ouvre le détail (transition carte → détail ; au retour, même ligne, même position).
 * Une seule entrée d'ajout : « Nouvelle mission ». Pas de classement, pas de compteur par personne, pas de « vu ».
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, Divider, ListRow, Segmented, Text } from '@/components/ui';
import { Cascade } from '@/motion';
import { MatteSurface, useListLayout } from '@/features/scene';
import { MissionRow, MissionTiles } from '@/features/missions/MissionCard';
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
  const { personOf, people } = usePeople();
  const layout = useListLayout();
  const list = tab === 'received' ? q.received : q.sent;
  const toAccept = q.received.filter((m) => m.mission_state === 'pending').length;

  return (
    <Screen back title={tr('mis.title')} subtitle={tr('mis.sub')}>
      <DemoPerson />
      <Button label={tr('mis.new')} icon="plus" full onPress={() => router.push('/family/missions/new')} testID="mission-new" />
      {people.length < 2 ? <Text variant="small" muted>{tr('mis.form.alone')}</Text> : null}
      {q.isLoading && !q.data ? null : q.isError && !q.data ? null : <MissionTiles all={q.all} received={q.received} me={q.me ?? ''} />}
      <Segmented label={tr('mis.tabs')} value={tab} onChange={setTab}
        options={[
          { value: 'received', label: toAccept ? `${tr('mis.tab.received')} · ${toAccept}` : tr('mis.tab.received'), testID: 'mission-tab-received' },
          { value: 'sent', label: tr('mis.tab.sent'), testID: 'mission-tab-sent' },
        ]} />
      {q.isLoading && !q.data ? <Skeleton kind="card" rows={3} /> : q.isError && !q.data ? (
        <ErrorView error={q.error} onRetry={() => void q.refetch()} />
      ) : !list.length ? (
        tab === 'received'
          ? <EmptyState icon="inbox" title={tr('mis.empty.received')} body={tr('mis.empty.receivedB')} />
          : <EmptyState icon="send" title={tr('mis.empty.sent')} body={tr('mis.empty.sentB')} />
      ) : (
        <Cascade index={1}>
          <MatteSurface testID={`missions-${tab}`} padded={spacing.sm} style={{ gap: 0 }}>
            {list.map((m, i) => (
              <Animated.View key={m.id} layout={layout}>
                {i ? <Divider /> : null}
                <MissionRow m={m} me={q.me ?? ''} personOf={personOf} onOpen={() => router.push(missionHref(m.id) as never)} />
              </Animated.View>
            ))}
          </MatteSurface>
        </Cascade>
      )}
      <View testID="mission-resp">
        <ListRow icon="user-check" title={tr('mis.resp.title')} subtitle={tr('tool.family_responsibilities.sub')} onPress={() => router.push('/family/missions/responsibilities')} />
      </View>
    </Screen>
  );
}
