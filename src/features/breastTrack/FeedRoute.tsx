/**
 * Écran des mini-apps Allaitement et Tire-lait, servi par la route existante `/track/[kind]` (catalogue, accueil,
 * Dock, liens rapides pointent déjà vers `/track/breastfeed` et `/track/pumping`). Le formulaire complet reste
 * accessible : `?manual=1` (saisie passée) et `?id=` (modifier, supprimer).
 * Enfant : celui demandé, sinon l'enfant affiché, sinon le premier suivi (même règle que le formulaire).
 */
import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/States';
import { Banner, Button, Chip, Row } from '@/components/ui';
import { t as tr } from '@/i18n';
import { useActiveSubject, useChild, useLogs, useTrackedChildren } from '@/lib/data/hooks';
import { isOngoing, type FeedLike } from '@/lib/domain/breastSession';
import type { Breastfeed } from '@/lib/types';
import { spacing } from '@/theme/tokens';
import { BreastNow } from './BreastNow';
import { PumpNow } from './PumpNow';

export function FeedRoute({ kind }: { kind: 'breastfeed' | 'pumping' }) {
  const params = useLocalSearchParams<{ child?: string; feed?: string }>();
  const { data: children, isLoading } = useTrackedChildren();
  const { subject } = useActiveSubject();
  const childId = params.child || (subject.type === 'child' && children?.some((c) => c.id === subject.id) ? subject.id : children?.[0]?.id) || '';
  const child = useChild(childId);
  const feeds = useLogs<Breastfeed>('breastfeed', kind === 'breastfeed' ? childId || null : null, 1);
  const running = kind === 'breastfeed' && (feeds.data ?? []).some((f) => isOngoing(f as FeedLike, new Date()));
  const title = kind === 'breastfeed' ? (child ? tr('bt.screen.title', { name: child.first_name }) : tr('bt.screen.titleNoName')) : tr('bt.pump.screenTitle');
  if (!child) {
    return (
      <Screen back title={title}>
        {isLoading || !children ? <Skeleton kind="detail" rows={4} /> : (
          <View style={{ gap: spacing.sm }}>
            <Banner tone="info">{tr('u7.track.addChildFirst')}</Banner>
            <Button label={tr('u7.track.addProfile')} onPress={() => router.replace('/profiles/new')} />
          </View>
        )}
      </Screen>
    );
  }
  return (
    <Screen back title={title} subtitle={kind === 'pumping' ? tr('bt.pump.for', { name: child.first_name }) : undefined} toolRunning={running}>
      {children && children.length > 1 ? (
        <Row wrap>
          {children.map((c) => <Chip key={c.id} label={c.first_name} selected={c.id === child.id} onPress={() => router.setParams({ child: c.id, feed: undefined } as never)} />)}
        </Row>
      ) : null}
      {kind === 'breastfeed'
        ? <BreastNow key={child.id} child={child} focusFeed={typeof params.feed === 'string' ? params.feed : null} />
        : <PumpNow key={child.id} child={child} />}
    </Screen>
  );
}
