/** Volumes tirés sur 7 ou 30 jours : barres simples, équivalent textuel, derniers tirages (sans aucun jugement). */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, Card, ListRow, Segmented, SectionTitle, Text } from '@/components/ui';
import { useFeedingChild, VolumeBars } from '@/features/lactation';
import { useLogs } from '@/lib/data/hooks';
import { dailyPumpVolumes, localDay } from '@/lib/domain/lactation';
import { formatTime } from '@/lib/domain/dates';
import type { PumpingRecord } from '@/lib/types-lactation';
import { spacing } from '@/theme/tokens';
import { localeTag, t as tr, type TKey } from '@/i18n';

const dayLabel = (iso: string, opts: Intl.DateTimeFormatOptions) => {
  try { return new Date(`${iso}T12:00:00`).toLocaleDateString(localeTag(), opts); } catch { return iso.slice(5); }
};

export default function PumpVolumes() {
  const params = useLocalSearchParams<{ child?: string }>();
  const { child, loading, name } = useFeedingChild(params.child);
  const [days, setDays] = useState<'7' | '30'>('7');
  const q = useLogs<PumpingRecord>('pumping', child?.id, 31, { includePending: true });
  const rows = useMemo(() => q.data ?? [], [q.data]);
  const vols = useMemo(() => dailyPumpVolumes(rows, Number(days), new Date()), [rows, days]);
  const totalMl = vols.reduce((n, v) => n + v.ml, 0);
  const totalCount = vols.reduce((n, v) => n + v.count, 0);
  const [showFigures, setShowFigures] = useState(false);

  if (loading) return <Screen back title={tr('lac.vol.title')}><Skeleton kind="card" rows={2} /></Screen>;
  if (!child) return <Screen back title={tr('lac.vol.title')}><EmptyState icon="user-plus" title={tr('lac.home.noChild')} /></Screen>;
  const short: Intl.DateTimeFormatOptions = days === '7' ? { weekday: 'narrow' } : { day: 'numeric', month: 'short' };
  const labels = vols.map((v) => dayLabel(v.day, short));
  const long = (d: string) => dayLabel(d, { weekday: 'long', day: 'numeric', month: 'long' });
  const textAlt = vols.map((v) => (v.count ? tr('lac.vol.dayLine', { day: long(v.day), ml: v.ml, count: v.count }) : tr('lac.vol.dayNone', { day: long(v.day) })));

  return (
    <Screen back title={tr('lac.vol.title')} subtitle={name ? tr('lac.timer.forName', { name }) : undefined}
      action={{ label: tr('lac.home.startPump'), icon: 'plus', testID: 'vol-add', onPress: () => router.push({ pathname: '/feeding/pump', params: { child: child.id } }) }}>
      <Segmented label={tr('lac.vol.period')} value={days} onChange={setDays} options={[{ value: '7', label: tr('lac.vol.days7'), testID: 'vol-7' }, { value: '30', label: tr('lac.vol.days30'), testID: 'vol-30' }]} />
      {q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} /> : q.isLoading && !q.data ? <Skeleton kind="card" rows={1} /> : (
        <Card testID="vol-chart">
          <View accessible accessibilityRole="image" accessibilityLabel={`${tr('lac.vol.chartLabel')} : ${textAlt.join(', ')}`} style={{ gap: spacing.sm }}>
            <Text weight="bold">{tr('lac.vol.summary', { count: totalCount, ml: totalMl })}</Text>
            <VolumeBars values={vols.map((v) => v.ml)} labels={labels} testID="vol-bars" />
          </View>
          <Button label={tr('lac.vol.figures')} variant="ghost" size="sm" icon={showFigures ? 'chevron-up' : 'chevron-down'} onPress={() => setShowFigures(!showFigures)} style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} testID="vol-figures-toggle" />
          {showFigures ? (
            <View style={{ gap: 2 }} testID="vol-figures">
              {[...textAlt].reverse().map((line, i) => <Text key={i} variant="small" muted>{line}</Text>)}
            </View>
          ) : null}
        </Card>
      )}
      <Text variant="caption" muted>{tr('lac.vol.caption')}</Text>

      <SectionTitle title={tr('lac.vol.recent')} />
      {rows.length ? (
        <Card padded={false}>
          {rows.slice(0, 20).map((p) => (
            <ListRow key={p.id ?? p.client_id ?? p.at} icon="droplet"
              title={tr('lac.vol.row', { ml: p.amount_ml, mode: tr(`lac.pump.mode.${p.side ?? 'both'}` as TKey) })}
              subtitle={[`${dayLabel(localDay(p.at), { day: 'numeric', month: 'short' })} · ${formatTime(p.at)}`,
                p.left_ml != null || p.right_ml != null ? tr('lac.vol.rowSides', { left: p.left_ml ?? '—', right: p.right_ml ?? '—' }) : null,
                (p as { _pending?: boolean })._pending ? tr('lac.hist.pending') : null].filter(Boolean).join(' · ')}
              onPress={p.id && !(p as { _pending?: boolean })._pending ? () => router.push({ pathname: '/feeding/pump', params: { id: p.id } }) : undefined} />
          ))}
        </Card>
      ) : <Text muted>{tr('lac.vol.empty')}</Text>}
    </Screen>
  );
}
