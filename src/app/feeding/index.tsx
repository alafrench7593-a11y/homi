/**
 * « L'alimentation de mon bébé » : dernière session, une action principale adaptée aux saisies récentes
 * (tétée, tirage ou biberon), résumé du jour (chaque mesure à part, jamais additionnées) et accès directs.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary, type SummaryItem } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, Card, Chip, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { milkWord, shortDuration, sidesPhrase, useFeedingChild } from '@/features/lactation';
import { useFeedingLogs, useMilkStash } from '@/lib/data/hooks-lactation';
import { agoLabel } from '@/lib/domain/dayTimeline';
import { formatTime } from '@/lib/domain/dates';
import { clock, elapsedMs, feedingDaySummary, inferFeedingMode, lastFeedingSession, stashRemaining, type FeedingMode, type LastSession } from '@/lib/domain/lactation';
import { useFeedSession } from '@/lib/feedSessionStore';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function FeedingHome() {
  const params = useLocalSearchParams<{ child?: string }>();
  const { child, children, loading, name } = useFeedingChild(params.child);
  const childId = child?.id ?? null;
  const logs = useFeedingLogs(childId, 3);
  const stash = useMilkStash(childId);
  const session = useFeedSession(childId);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), session?.status === 'running' ? 1000 : 60_000);
    return () => clearInterval(id);
  }, [session?.status]);

  const title = name ? tr('lac.home.titleName', { name }) : tr('lac.home.title');
  if (loading) return <Screen back title={title}><Skeleton kind="card" rows={3} /></Screen>;
  if (!child) {
    return (
      <Screen back title={title}>
        <EmptyState icon="user-plus" title={tr('lac.home.noChild')} action={{ label: tr('lac.home.addProfile'), icon: 'plus', onPress: () => router.replace('/profiles/new') }} />
      </Screen>
    );
  }
  const cid = child.id;
  const data = { breastfeeds: logs.breastfeeds, pumpings: logs.pumpings, bottles: logs.bottles };
  const mode: FeedingMode = inferFeedingMode(data, now);
  const day = feedingDaySummary(data, now);
  const last = lastFeedingSession(data);
  const stock = stashRemaining(stash.data ?? []);

  const go = {
    breastfeed: () => router.push({ pathname: '/feeding/timer', params: { child: cid } }),
    pumping: () => router.push({ pathname: '/feeding/pump', params: { child: cid } }),
    bottle: () => router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: cid } }),
  };
  const label: Record<FeedingMode, string> = { breastfeed: tr('lac.home.startFeed'), pumping: tr('lac.home.startPump'), bottle: tr('lac.home.addBottle') };
  const icon = { breastfeed: 'play', pumping: 'droplet', bottle: 'coffee' } as const;
  // Une tétée est en cours : l'action principale y ramène
  const action = session
    ? { label: tr('lac.home.resume'), icon: 'play' as const, testID: 'feeding-main', onPress: go.breastfeed }
    : { label: label[mode], icon: icon[mode], testID: 'feeding-main', onPress: go[mode] };
  const secondary = (['breastfeed', 'pumping', 'bottle'] as FeedingMode[]).filter((m) => session || m !== mode);

  const items: SummaryItem[] = [
    { icon: 'droplet', value: String(day.feeds), label: tr('lac.home.feeds', { count: day.feeds }), testID: 'feeding-today-feeds' },
    { icon: 'clock', value: day.lastMealAt ? formatTime(day.lastMealAt) : '—', label: tr('lac.home.lastMeal') },
    { icon: 'activity', value: day.pumpedMl != null ? `${day.pumpedMl} ml` : '—', label: tr('lac.home.pumped', { count: day.pumpCount }), testID: 'feeding-today-pumped' },
    { icon: 'coffee', value: String(day.bottleCount), label: tr('lac.home.bottles', { count: day.bottleCount }) },
    ...(day.bottleDrunkMl != null ? [{ icon: 'coffee' as const, value: `${day.bottleDrunkMl} ml`, label: tr('lac.home.bottlesMl') }] : []),
  ];

  return (
    <Screen back title={title} subtitle={tr('lac.home.subtitle')} action={action}>
      {children.length > 1 ? (
        <Row wrap>
          {children.map((c) => <Chip key={c.id} label={c.first_name} selected={c.id === cid} onPress={() => router.setParams({ child: c.id })} />)}
        </Row>
      ) : null}

      {session ? (
        <Card onPress={go.breastfeed} testID="feeding-session" accessibilityLabel={`${tr(session.status === 'running' ? 'lac.home.running' : session.status === 'paused' ? 'lac.home.paused' : 'lac.home.finished')}, ${clock(elapsedMs(session, now.getTime()))}`}>
          <Row>
            <View style={{ flex: 1, gap: 2 }}>
              <Text weight="bold">{tr(session.status === 'running' ? 'lac.home.running' : session.status === 'paused' ? 'lac.home.paused' : 'lac.home.finished')}</Text>
              <Text variant="small" muted>{tr('lac.home.resume')}</Text>
            </View>
            <Text variant="heading" style={{ fontVariant: ['tabular-nums'] }}>{clock(elapsedMs(session, now.getTime()))}</Text>
          </Row>
        </Card>
      ) : null}

      {logs.error ? <ErrorView error={logs.error} onRetry={logs.refetch} /> : logs.isLoading ? <Skeleton kind="card" rows={1} /> : (
        <Card testID="feeding-last">
          <Text variant="caption" muted style={{ letterSpacing: 1.1, textTransform: 'uppercase' }}>{tr('lac.home.last')}</Text>
          <Text weight="bold" style={{ marginTop: 4 }}>{lastLine(last)}</Text>
          {last ? <Text variant="small" muted>{`${formatTime(last.at)} · ${agoLabel(last.at, now)}`}</Text> : null}
        </Card>
      )}

      <TodaySummary title={tr('lac.home.today')} items={items} testID="feeding-today" />
      <Text variant="caption" muted>{tr('lac.home.separate')}</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }} testID="feeding-secondary">
        {secondary.map((m) => (
          <Button key={m} label={label[m]} icon={icon[m]} variant="secondary" size="lg" style={{ flexGrow: 1, flexBasis: '45%' }} onPress={go[m]} testID={`feeding-secondary-${m}`} />
        ))}
      </View>
      <Text variant="caption" muted>{tr('lac.home.modeNote')}</Text>

      <SectionTitle title={tr('lac.home.access')} />
      <Card padded={false} testID="feeding-access">
        <ListRow icon="watch" title={tr('lac.home.timer')} subtitle={tr('lac.home.timerSub')} onPress={go.breastfeed} testID="feeding-go-timer" />
        <ListRow icon="edit-3" title={tr('lac.home.pastFeed')} subtitle={tr('lac.home.pastFeedSub')} onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'breastfeed', child: cid } })} testID="feeding-go-past" />
        <ListRow icon="droplet" title={tr('lac.home.pump')} subtitle={tr('lac.home.pumpSub')} onPress={go.pumping} testID="feeding-go-pump" />
        <ListRow icon="bar-chart-2" title={tr('lac.home.volumes')} subtitle={tr('lac.home.volumesSub')} onPress={() => router.push({ pathname: '/feeding/pumpings', params: { child: cid } })} testID="feeding-go-volumes" />
        <ListRow icon="coffee" title={tr('lac.home.bottle')} subtitle={tr('lac.home.bottleSub')} onPress={() => router.push({ pathname: '/bottle/[childId]', params: { childId: cid } })} testID="feeding-go-bottle" />
        <ListRow icon="archive" title={tr('lac.home.stash')} subtitle={tr('lac.home.stashSub', { count: stock.count, ml: stock.ml })} onPress={() => router.push({ pathname: '/feeding/stash', params: { child: cid } })} testID="feeding-go-stash" />
        <ListRow icon="list" title={tr('lac.home.history')} subtitle={tr('lac.home.historySub')} onPress={() => router.push({ pathname: '/feeding/history', params: { child: cid } })} testID="feeding-go-history" />
        <ListRow icon="life-buoy" title={tr('lac.home.help')} subtitle={tr('lac.home.helpSub')} onPress={() => router.push({ pathname: '/feeding/help', params: { child: cid } })} testID="feeding-go-help" />
      </Card>
    </Screen>
  );
}

function lastLine(last: LastSession | null): string {
  if (!last) return tr('lac.home.lastNone');
  if (last.kind === 'breastfeed') {
    const sides = sidesPhrase(last.group.sides);
    return last.group.durationMs ? tr('lac.home.lastFeedDur', { sides, duration: shortDuration(last.group.durationMs) }) : tr('lac.home.lastFeed', { sides });
  }
  if (last.kind === 'pumping') return last.ml != null ? tr('lac.home.lastPump', { ml: last.ml }) : tr('lac.home.lastPumpNoMl');
  return last.ml != null ? tr('lac.home.lastBottleMl', { milk: milkWord(last.milk), ml: last.ml }) : tr('lac.home.lastBottle', { milk: milkWord(last.milk) });
}
