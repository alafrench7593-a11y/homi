/** Historique des biberons d'un enfant : vue jour / semaine, modification, suppression, résumé de consultation. */
import React, { useMemo, useState } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { BarChart } from '@/components/Charts';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Button, Card, Chip, IconButton, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { copyText } from '@/features/bottle';
import { BottleInstrument } from '@/features/bottleInstrument';
import { useDeleteRow, useActiveSubject } from '@/lib/data/hooks';
import { useBottleChildren, useBottleHistory, useRecorderLabel } from '@/lib/data/hooks-bottle';
import { friendlyError } from '@/lib/data/hooks-settings';
import { consultationSummary, dailySummaries, dayLabel, groupByDay, lastDays, withIntervals } from '@/lib/domain/bottleHistory';
import { formatClock, formatHM } from '@/lib/domain/bottleTimer';
import { formatDate, t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

type View_ = 'day' | 'week';
const shortDay = (key: string) => formatDate(new Date(`${key}T12:00:00`), { weekday: 'short' });

export default function BottleHistory() {
  const t = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ child?: string }>();
  const insets = useSafeAreaInsets();
  const childrenQ = useBottleChildren();
  const { data: children } = childrenQ;
  const { subject } = useActiveSubject();
  const childId = params.child || (subject.type === 'child' && children?.some((c) => c.id === subject.id) ? subject.id : children?.[0]?.id) || '';
  const child = children?.find((c) => c.id === childId) ?? null;
  const historyQ = useBottleHistory(childId, 8);
  const [chrono, setChrono] = useState(false);
  const { data: bottles } = historyQ;
  const isLoading = historyQ.isLoading && !bottles;
  const loadError = historyQ.isError && !bottles;
  const del = useDeleteRow('bottles');
  const recorder = useRecorderLabel();
  const [view, setView] = useState<View_>('day');
  const days = useMemo(() => lastDays(7), []);
  const [day, setDay] = useState(days[0]);
  const [summary, setSummary] = useState<string | null>(null);

  const enriched = useMemo(() => withIntervals(bottles ?? []), [bottles]);
  const byDay = useMemo(() => groupByDay(enriched), [enriched]);
  const week = useMemo(() => dailySummaries(bottles ?? [], 7), [bottles]);
  const list = byDay.get(day) ?? [];

  async function remove(id: string, at: string) {
    if (del.isPending) return;
    if (!(await confirm(tr('u6.bhist.delete_q'), tr('u6.bhist.delete_body', { time: formatClock(at) }), tr('u6.bhist.delete')))) return;
    try {
      await del.mutateAsync(id);
      toast(tr('u6.bhist.deleted'));
    } catch (e) {
      toast(friendlyError(e, tr('u6.bhist.delete_failed')), 'error');
    }
  }

  function openSummary() {
    if (!child) return;
    setSummary(consultationSummary({ childName: child.first_name, bottles: bottles ?? [], recordedBy: recorder }));
  }

  if (!childId) {
    return (
      <Screen back title={tr('u6.bhist.title')}>
        {childrenQ.isLoading && !children ? <Skeleton kind="list" rows={4} /> : childrenQ.isError && !children ? (
          <ErrorView error={childrenQ.error} onRetry={() => void childrenQ.refetch()} title={tr('u6.bhist.error')} />
        ) : (
          <EmptyState
            icon="coffee"
            title={tr('u6.bottle_index.empty_title')}
            body={tr('u6.bottle_index.empty_body')}
            action={{ label: tr('u6.bottle_index.add_child'), onPress: () => router.push({ pathname: '/profiles/new', params: { kind: 'child' } }) }}
          />
        )}
      </Screen>
    );
  }

  const addBottle = () => router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: childId } });
  const dayRows = view === 'day' && !isLoading && !loadError ? list : [];

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.xxs }}>
      {children && children.length > 1 && (
        <Row wrap>
          {children.map((c) => <Chip key={c.id} label={c.first_name} selected={c.id === childId} onPress={() => router.setParams({ child: c.id })} />)}
        </Row>
      )}
      {child ? (
        <>
          <Button label={chrono ? tr('u6.bhist.hide_timer') : tr('u6.bhist.show_timer')} variant="ghost" size="sm" icon="watch" onPress={() => setChrono(!chrono)} style={{ alignSelf: 'flex-start' }} />
          {chrono ? <BottleInstrument child={child} /> : null}
        </>
      ) : null}
      {!isLoading && !loadError ? (() => {
        const d = week.find((x) => x.key === day);
        const gaps = list.map((b) => b.interval_minutes).filter((m): m is number => m != null);
        return (
          <TodaySummary title={dayLabel(day)} items={[
            { icon: 'droplet', value: String(d?.count ?? 0), label: tr('u6.bchild.bottles', { count: d?.count ?? 0 }) },
            { icon: 'bar-chart-2', value: d?.consumedCount ? `${d.consumedTotal} ml` : '—', label: tr('u6.bchild.drunk_logged') },
            { icon: 'clock', value: gaps.length ? formatHM(Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)) : '—', label: tr('u6.bhist.avg_gap') },
          ]} testID="bottle-history-today" />
        );
      })() : null}
      <Segmented label={tr('u6.bhist.display')} value={view} onChange={setView} options={[{ value: 'day', label: tr('u6.bhist.day') }, { value: 'week', label: tr('u6.bhist.week') }]} />
      {isLoading ? <Skeleton kind="list" rows={4} /> : loadError ? (
        <ErrorView error={historyQ.error} onRetry={() => void historyQ.refetch()} title={tr('u6.bhist.error')} />
      ) : view === 'day' ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {days.map((k, i) => (
              <Chip key={k} label={i === 0 ? tr('u6.bhist.today') : i === 1 ? tr('u6.bhist.yesterday') : `${shortDay(k)} ${Number(k.slice(8, 10))}`} selected={k === day} onPress={() => setDay(k)} />
            ))}
          </ScrollView>
          <SectionTitle title={`${dayLabel(day)[0].toUpperCase()}${dayLabel(day).slice(1)}`} />
        </>
      ) : null}
    </View>
  );

  const footer = (
    <View style={{ gap: spacing.md, marginTop: spacing.xxs }}>
      {view === 'week' && !isLoading && !loadError ? (
        <>
          <Card>
            <Text weight="medium">{tr('u6.bhist.chart_title')}</Text>
            <BarChart data={[...week].reverse().map((d) => ({ label: shortDay(d.key), value: d.consumedTotal }))} unit="ml" accessibilityLabel={tr('u6.bhist.chart_a11y')} />
            <Text variant="caption" muted>{tr('u6.bhist.chart_note')}</Text>
          </Card>
          <Card>
            {week.map((d) => (
              <Row key={d.key} style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: t.colors.border, borderRadius: radius.sm }}>
                <Text style={{ flex: 1 }}>{d.label}</Text>
                <Text variant="small" muted>
                  {d.count ? `${tr('u6.bhist.count', { count: d.count })}${d.consumedCount ? tr('u6.bhist.row_drunk', { n: d.consumedTotal }) : ''}${d.preparedCount ? tr('u6.bhist.row_prepared', { n: d.preparedTotal }) : ''}` : '—'}
                </Text>
              </Row>
            ))}
          </Card>
        </>
      ) : null}

      <Button label={tr('u6.bhist.summary_btn')} icon="file-text" variant="secondary" disabled={!child || isLoading} onPress={openSummary} />
      <Text variant="caption" muted>{tr('u6.bhist.disclaimer')}</Text>
    </View>
  );

  return (
    <Screen scroll={false} padded={false} back title={tr('u6.bhist.title')} subtitle={child ? tr('u6.bhist.last7', { name: child.first_name }) : undefined}
      action={{ label: tr('u6.bchild.record'), icon: 'plus', onPress: addBottle, testID: 'bottle-history-add' }}>
      <VirtualList
        data={dayRows}
        keyExtractor={(b) => b.id}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={view === 'day' && !isLoading && !loadError ? (
          <EmptyState icon="coffee" title={tr('u6.bhist.empty_day')} action={{ label: tr('u6.bchild.record'), onPress: addBottle }} />
        ) : null}
        renderItem={({ item: b }) => {
          const who = recorder(b.created_by);
          return (
            <Card>
              <Row style={{ alignItems: 'flex-start' }}>
                <Text variant="heading" style={{ width: 74 }}>{formatClock(b.at)}</Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text weight="medium">
                    {[b.prepared_ml != null ? tr('u6.bhist.prepared', { n: b.prepared_ml }) : null, b.consumed_ml != null ? tr('u6.bhist.drunk', { n: b.consumed_ml }) : null].filter(Boolean).join(' · ') || tr('u6.bhist.no_qty')}
                  </Text>
                  {b.interval_minutes != null && <Text variant="small" muted>{tr('u6.bhist.after_prev', { delay: formatHM(b.interval_minutes) })}</Text>}
                  {b.milk_type ? <Text variant="small" muted>{b.milk_type}</Text> : null}
                  {b.planned_next_ml != null && <Text variant="small" muted>{tr('u6.bhist.planned_next', { n: b.planned_next_ml })}</Text>}
                  {b.note ? <Text variant="small" italic>{tr('u6.bhist.note', { note: b.note })}</Text> : null}
                  {!!who && <Text variant="caption" muted>{tr('u6.bhist.by', { who })}</Text>}
                </View>
                <View>
                  <IconButton icon="edit-2" label={tr('u6.clock.edit', { time: formatClock(b.at) })} onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: childId, id: b.id } })} />
                  <IconButton icon="trash-2" label={tr('u6.bhist.delete_a11y', { time: formatClock(b.at) })} onPress={() => remove(b.id, b.at)} />
                </View>
              </Row>
            </Card>
          );
        }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
      />

      <Sheet visible={summary != null} onClose={() => setSummary(null)} title={tr('u6.bhist.share_title')}>
        <Row wrap>
          <Button label={tr('u6.bhist.share')} icon="share-2" size="sm" onPress={() => Share.share({ message: summary ?? '', title: tr('u6.bhist.share_msg', { name: child?.first_name ?? '' }) }).catch(() => toast(tr('u6.bhist.share_unavailable'), 'error'))} />
          <Button label={tr('u6.bhist.copy')} icon="copy" size="sm" variant="secondary" onPress={async () => {
            const ok = await copyText(summary ?? '');
            toast(ok ? tr('u6.bhist.copied') : tr('u6.bhist.long_press'), ok ? 'success' : 'info');
          }} />
        </Row>
        <View style={{ borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt, padding: spacing.sm }}>
          <Text selectable variant="caption">{summary}</Text>
        </View>
      </Sheet>
    </Screen>
  );
}
