/**
 * Missions familiales : reçues et envoyées (refonte 16/11/2026 ; missions actives et historique 19/11/2026).
 * Une mission est une demande pratique entre membres du foyer (« Acheter des couches taille 4 aujourd'hui »), suivie
 * par statut, sans messages ni relances.
 * Composition : pastille démo compacte, synthèse en tuiles de résultat, sélecteur Reçues / Envoyées, liste des missions
 * ACTIVES sur surface mate (une ligne par mission : prénom + avatar de la personne en face, statut icône + libellé,
 * échéance, et pour mes missions l'étape suivante « Je m'en occupe » / « Mission terminée ») ; une mission terminée ou
 * annulée quitte la liste et rejoint « Terminées » (historique paginé). Toucher une ligne ouvre le détail.
 * Pas de classement, pas de compteur par personne, pas de « vu ».
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, Divider, ListRow, Segmented, Text } from '@/components/ui';
import { Cascade, useMotion } from '@/motion';
import { MatteSurface, useListLayout } from '@/features/scene';
import { MissionRow, MissionTiles } from '@/features/missions/MissionCard';
import { MissionQuickAction } from '@/features/missions/MissionQuickAction';
import { DemoPerson } from '@/features/missions/DemoPerson';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useMissions } from '@/lib/data/hooks-missions';
import { isTerminal, missionHref } from '@/lib/domain/missions';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

type Tab = 'received' | 'sent';

export default function Missions() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'sent' ? 'sent' : 'received');
  const q = useMissions();
  const { personOf, people } = usePeople();
  const layout = useListLayout();
  const m = useMotion();
  // Missions qui viennent d'être terminées ici : la coche s'est tracée, la ligne part tout de suite (sans attendre le serveur)
  const [left, setLeft] = useState<string[]>([]);
  // …et celles en train de se terminer restent affichées le temps de la coche, même si la liste relue les dit terminées
  const [finishing, setFinishing] = useState<string[]>([]);
  const list = useMemo(() => (tab === 'received' ? q.received : q.sent)
    .filter((x) => (!isTerminal(x.mission_state) || finishing.includes(x.id)) && !left.includes(x.id)), [tab, q.received, q.sent, left, finishing]);
  const toAccept = q.received.filter((x) => x.mission_state === 'pending').length;
  const doneCount = q.all.filter((x) => x.mission_state === 'done').length;
  const exiting = m.off ? undefined : FadeOut.duration(m.minimal ? 120 : 220);

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
            {list.map((x, i) => (
              <Animated.View key={x.id} layout={layout} exiting={exiting}>
                {i ? <Divider /> : null}
                <MissionRow m={x} me={q.me ?? ''} personOf={personOf} onOpen={() => router.push(missionHref(x.id) as never)} />
                <View style={{ alignItems: 'flex-start', paddingBottom: spacing.xs, paddingLeft: 44 }}>
                  <MissionQuickAction m={x} me={q.me ?? ''} onFinishing={(id) => setFinishing((f) => [...f, id])} onAbort={(id) => setFinishing((f) => f.filter((y) => y !== id))}
                    onDone={(id) => { setLeft((l) => [...l, id]); setFinishing((f) => f.filter((y) => y !== id)); }} />
                </View>
              </Animated.View>
            ))}
          </MatteSurface>
        </Cascade>
      )}
      <View testID="mission-history-entry">
        <ListRow icon="check-circle" title={tr('cp2.mis.history')} subtitle={doneCount ? tr('cp2.mis.historySub', { count: doneCount }) : tr('cp2.mis.historyNone')}
          onPress={() => router.push('/family/missions/done')} testID="mission-history" />
      </View>
      <View testID="mission-resp">
        <ListRow icon="user-check" title={tr('mis.resp.title')} subtitle={tr('tool.family_responsibilities.sub')} onPress={() => router.push('/family/missions/responsibilities')} />
      </View>
    </Screen>
  );
}
