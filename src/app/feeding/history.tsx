/**
 * Historique unifié : tétées (une ligne par tétée, même en plusieurs passages au sein), tirages et biberons,
 * jour par jour, avec filtres. Chaque entrée s'ouvre dans l'écran d'édition existant.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Sheet } from '@/components/Overlays';
import { Button, Card, Chip, ListRow, Row, Text } from '@/components/ui';
import { milkWord, shortDuration, sideWord, sidesPhrase, useFeedingChild } from '@/features/lactation';
import { useFeedingLogs } from '@/lib/data/hooks-lactation';
import { feedingHistory, HISTORY_FILTERS, type HistoryEntry, type HistoryFilter, type SessionGroup } from '@/lib/domain/lactation';
import { formatTime } from '@/lib/domain/dates';
import { spacing } from '@/theme/tokens';
import { localeTag, t as tr, type TKey } from '@/i18n';

const SPANS = [14, 45, 120];
const dayTitle = (d: string) => {
  try { return new Date(`${d}T12:00:00`).toLocaleDateString(localeTag(), { weekday: 'long', day: 'numeric', month: 'long' }); } catch { return d; }
};
const pending = (x: unknown) => !!(x as { _pending?: boolean })._pending;

export default function FeedingHistory() {
  const params = useLocalSearchParams<{ child?: string }>();
  const { child, loading, name } = useFeedingChild(params.child);
  const [span, setSpan] = useState(0);
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [segments, setSegments] = useState<SessionGroup | null>(null);
  const logs = useFeedingLogs(child?.id, SPANS[span]);
  const days = useMemo(() => feedingHistory({ breastfeeds: logs.breastfeeds, pumpings: logs.pumpings, bottles: logs.bottles }, filter), [logs.breastfeeds, logs.pumpings, logs.bottles, filter]);

  if (loading) return <Screen back title={tr('lac.hist.title')}><Skeleton kind="list" rows={4} /></Screen>;
  if (!child) return <Screen back title={tr('lac.hist.title')}><EmptyState icon="user-plus" title={tr('lac.home.noChild')} /></Screen>;

  function open(e: HistoryEntry) {
    if (e.kind === 'breastfeed') {
      const rows = e.group.rows.filter((r) => r.id && !pending(r));
      if (e.group.rows.length > 1) return setSegments(e.group);
      if (rows[0]) router.push({ pathname: '/track/[kind]', params: { kind: 'breastfeed', id: rows[0].id! } });
      return;
    }
    if (pending(e.row) || !e.row.id) return;
    if (e.kind === 'pumping') router.push({ pathname: '/feeding/pump', params: { id: e.row.id } });
    else router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', id: e.row.id } });
  }

  return (
    <Screen back title={tr('lac.hist.title')} subtitle={name ? tr('lac.timer.forName', { name }) : undefined}>
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">{tr('lac.hist.filter')}</Text>
        <Row wrap testID="hist-filters">
          {HISTORY_FILTERS.map((f) => <Chip key={f} label={tr(`lac.hist.f.${f}` as TKey)} selected={filter === f} onPress={() => setFilter(f)} testID={`hist-f-${f}`} />)}
        </Row>
        {filter === 'bottle_breast' || filter === 'bottle_other' ? <Text variant="caption" muted>{tr('lac.hist.milkHint')}</Text> : null}
      </View>
      {logs.error ? <ErrorView error={logs.error} onRetry={logs.refetch} /> : logs.isLoading ? <Skeleton kind="list" rows={4} /> : days.length ? (
        <View style={{ gap: spacing.md }} testID="hist-days">
          {days.map((d) => (
            <View key={d.day} style={{ gap: spacing.xs }}>
              <Text variant="heading" accessibilityRole="header" style={{ textTransform: 'capitalize' }}>{dayTitle(d.day)}</Text>
              <Card padded={false}>
                {d.entries.map((e, i) => <EntryRow key={`${e.kind}-${e.at}-${i}`} e={e} onPress={() => open(e)} />)}
              </Card>
            </View>
          ))}
        </View>
      ) : <EmptyState icon="list" title={tr('lac.hist.empty')} />}
      {span < SPANS.length - 1 ? <Button label={tr('lac.hist.more')} variant="ghost" icon="chevron-down" onPress={() => setSpan(span + 1)} style={{ alignSelf: 'center' }} testID="hist-more" /> : null}

      <Sheet visible={!!segments} onClose={() => setSegments(null)} title={tr('lac.hist.segmentsTitle')}>
        {segments?.rows.map((r, i) => (
          <ListRow key={r.id ?? i} icon="droplet"
            title={r.ended_at ? tr('lac.hist.segment', { side: sideWord(r.side), from: formatTime(r.started_at), to: formatTime(r.ended_at) }) : tr('lac.hist.segmentOpen', { side: sideWord(r.side), from: formatTime(r.started_at) })}
            subtitle={pending(r) ? tr('lac.hist.pending') : tr('lac.hist.edit')}
            onPress={r.id && !pending(r) ? () => { setSegments(null); router.push({ pathname: '/track/[kind]', params: { kind: 'breastfeed', id: r.id! } }); } : undefined} />
        ))}
      </Sheet>
    </Screen>
  );
}

function EntryRow({ e, onPress }: { e: HistoryEntry; onPress: () => void }) {
  if (e.kind === 'breastfeed') {
    const g = e.group;
    return (
      <ListRow icon="droplet" title={tr('lac.hist.feed', { sides: sidesPhrase(g.sides) })}
        subtitle={[formatTime(g.startedAt), g.durationMs ? tr('lac.hist.feedDur', { duration: shortDuration(g.durationMs) }) : tr('lac.hist.feedOpen'),
          g.rows.length > 1 ? tr('lac.timer.segments', { count: g.rows.length }) : null, g.rows.some(pending) ? tr('lac.hist.pending') : null].filter(Boolean).join(' · ')}
        onPress={onPress} />
    );
  }
  if (e.kind === 'pumping') {
    const r = e.row;
    return (
      <ListRow icon="activity" title={tr('lac.hist.pump', { ml: r.amount_ml ?? 0 })}
        subtitle={[formatTime(r.at), tr(`lac.pump.mode.${r.side ?? 'both'}` as TKey), r.left_ml != null || r.right_ml != null ? tr('lac.vol.rowSides', { left: r.left_ml ?? '—', right: r.right_ml ?? '—' }) : null,
          r.comfort ? tr(`lac.pump.comfort.${r.comfort}` as TKey) : null, pending(r) ? tr('lac.hist.pending') : null].filter(Boolean).join(' · ')}
        onPress={onPress} />
    );
  }
  const r = e.row;
  return (
    <ListRow icon="coffee" title={tr('lac.hist.bottle', { milk: milkWord(e.milk) })}
      subtitle={[formatTime(r.at), r.consumed_ml != null ? tr('lac.hist.bottleMl', { ml: r.consumed_ml }) : null, r.milk_type, pending(r) ? tr('lac.hist.pending') : null].filter(Boolean).join(' · ')}
      onPress={onPress} />
  );
}
