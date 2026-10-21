/**
 * Membres que je suis et catégories suivies. Ne plus suivre en un geste.
 * La liste des personnes qui me suivent n'est jamais affichée (pas de concours de popularité).
 */
import React from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { Card, Chip, Row, SectionTitle, Text } from '@/components/ui';
import { spaceIcon } from '@/features/community';
import { FollowButton, MemberRow } from '@/features/communitySocial';
import { useSpaces } from '@/lib/data/hooks-community';
import { useFollows, useForumSubscriptions, useToggleForumSubscription } from '@/lib/data/hooks-social';
import { spacing } from '@/theme/tokens';

export default function Following() {
  const follows = useFollows();
  const subs = useForumSubscriptions();
  const toggle = useToggleForumSubscription();
  const spaces = useSpaces();
  return (
    <Screen back title="Abonnements" subtitle="Leurs publications apparaissent dans le fil « Abonnements »">
      <SectionTitle title="Membres" />
      {follows.isLoading && !follows.data ? <Skeleton kind="list" rows={2} /> : follows.data?.length ? (
        <Card testID="following-list">{follows.data.map((m) => <MemberRow key={m.handle} m={m} right={<FollowButton handle={m.handle} following />} />)}</Card>
      ) : <EmptyState icon="user-plus" title="Vous ne suivez encore personne" body="Depuis une publication (menu « … ») ou le profil d’un membre, touchez « Suivre »." />}
      <SectionTitle title="Catégories" />
      <Text variant="caption" muted>Touchez une catégorie pour la suivre ou ne plus la suivre.</Text>
      <View style={{ gap: spacing.xs }}>
        <Row wrap gap={6} testID="following-categories">
          {[...spaces.all].sort((a, b) => a.position - b.position).map((f) => (
            <Chip key={f.id} label={f.title} icon={spaceIcon(f)} selected={subs.ids.includes(f.id)} onPress={() => toggle.mutate({ forumId: f.id, on: !subs.ids.includes(f.id) })} />
          ))}
        </Row>
      </View>
    </Screen>
  );
}
