/**
 * Messages privés : boîte de réception (conversations, non-lus) et demandes de message à accepter ou refuser.
 * On écrit librement à un membre que l'on suit et qui vous suit ; sinon le premier message est une demande.
 * Texte seulement dans cette première version ; les règles de la communauté s'appliquent aussi ici.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Segmented, Text } from '@/components/ui';
import { ConversationRow } from '@/features/communityMessages';
import { useCommunityProfile } from '@/lib/data/hooks';
import { useDmRealtime, useInbox } from '@/lib/data/hooks-messages';
import { splitInbox } from '@/lib/domain/messages';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

type Tab = 'conversations' | 'requests';

export default function MessagesInbox() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'requests' ? 'requests' : 'conversations');
  const meQ = useCommunityProfile();
  const me = meQ.data;
  const inbox = useInbox();
  useDmRealtime(!!me);
  const { conversations, requests } = splitInbox(inbox.data ?? []);
  const list = tab === 'requests' ? requests : conversations;

  if (meQ.isLoading && !me) return <Screen back title={tr('dm.title')}><Skeleton kind="list" rows={4} /></Screen>;
  if (!me) {
    return (
      <Screen back title={tr('dm.title')} subtitle={tr('dm.subtitle')}>
        <Banner tone="info">{tr('dm.needProfile')}</Banner>
        <Button label={tr('cm2.new.createProfile')} onPress={() => router.push('/community/profile')} testID="dm-create-profile" />
      </Screen>
    );
  }

  return (
    <Screen back title={tr('dm.title')} subtitle={tr('dm.subtitle')}>
      <Segmented label={tr('dm.inbox.tabs')} value={tab} onChange={setTab} options={[
        { value: 'conversations', label: tr('dm.inbox.conversations'), testID: 'dm-tab-conversations' },
        { value: 'requests', label: requests.length ? tr('dm.inbox.requestsCount', { count: requests.length }) : tr('dm.inbox.requests'), testID: 'dm-tab-requests' },
      ]} />
      {tab === 'requests' ? <Text variant="small" muted>{tr('dm.inbox.requestsHint')}</Text> : null}
      {inbox.isLoading && !inbox.data ? <Skeleton kind="list" rows={4} /> : inbox.isError && !inbox.data ? (
        <ErrorView error={inbox.error} onRetry={() => void inbox.refetch()} />
      ) : list.length ? (
        <Card testID={tab === 'requests' ? 'dm-requests' : 'dm-inbox'}>
          {list.map((c, i) => <ConversationRow key={c.id} c={c} last={i === list.length - 1} />)}
        </Card>
      ) : tab === 'requests' ? (
        <EmptyState icon="inbox" title={tr('dm.inbox.noRequestsTitle')} body={tr('dm.inbox.noRequestsBody')} />
      ) : (
        <EmptyState icon="mail" title={tr('dm.inbox.emptyTitle')} body={tr('dm.inbox.emptyBody')}
          action={{ label: tr('dm.inbox.findMembers'), icon: 'search', onPress: () => router.push('/community/following' as never) }} />
      )}
      <View style={{ gap: spacing.xs }}>
        <Text variant="caption" muted>{tr('dm.inbox.note')}</Text>
        <Button label={tr('cm1.feed.readRules')} size="sm" variant="ghost" icon="book-open" style={{ alignSelf: 'flex-start' }} onPress={() => router.push('/community/rules' as never)} />
      </View>
    </Screen>
  );
}
