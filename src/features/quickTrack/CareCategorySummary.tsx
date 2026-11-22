/**
 * Catégorie « Soins » — niveau 2 du tracking (en tête de /tools/care, pour l'enfant affiché). Lit les MÊMES couches
 * que la mini-app (table `diapers`) :
 *  · période (Jour / 7 jours) dans l'adresse (« ?period=&day= ») ;
 *  · dernier change → la mini-app sur CE change ;
 *  · nombre de couches du jour et de la période, par type (mouillée, selles, les deux) — un change compte une fois ;
 *  · une barre par jour ; jour sans saisie = pointillés « rien de noté », jamais 0 ; toucher un jour liste ses
 *    changes, chacun ouvre la mini-app sur lui.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Glass, GlassSegmentedControl } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { Icon, Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { useActiveSubject, useChildren, useLogs } from '@/lib/data/hooks';
import { useNow } from '@/lib/data/hooks-bottle';
import { childAge } from '@/lib/domain/child';
import { agoLabel } from '@/lib/domain/dayTimeline';
import { diapersByDay, diaperType, knownTotal, lastDiaper, type DayDiapers } from '@/lib/domain/quickTrack';
import { clock } from '@/lib/domain/sleepPlanner';
import type { Child, Diaper } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { DayBars } from './DayBars';
import { DIAPER_ICON, diaperLabel } from './DiaperLog';
import { TABULAR } from './EntryTray';

type Period = 'day' | 'week';
const BABY_MONTHS = 36;

export function CareCategorySummary() {
  const { subject } = useActiveSubject();
  const { data: children } = useChildren();
  const child = subject?.type === 'child' ? (children ?? []).find((c) => c.id === subject.id) ?? null : null;
  if (!child) return null;
  return <Summary key={child.id} child={child} />;
}

const openDiaper = (child: Child, id: string) => router.push({ pathname: '/track/[kind]', params: { kind: 'diaper', child: child.id, diaper: id } } as never);

/** « 3 mouillées · 1 selles · 2 les deux » (types présents seulement). */
function split(d: Pick<DayDiapers, 'wet' | 'stool' | 'both'>) {
  return [d.wet ? tr('qt.d.nWet', { count: d.wet }) : null, d.stool ? tr('qt.d.nStool', { count: d.stool }) : null, d.both ? tr('qt.d.nBoth', { count: d.both }) : null].filter(Boolean).join(' · ');
}

function Summary({ child }: { child: Child }) {
  const t = useTheme();
  const p = useLocalSearchParams<{ period?: string; day?: string }>();
  const period: Period = p.period === 'day' ? 'day' : 'week';
  const now = useNow(60_000);
  const q = useLogs<Diaper>('diaper', child.id, 8);
  const all = q.data ?? [];
  const days = useMemo(() => diapersByDay(all, child.id, now, period === 'day' ? 1 : 7), [all, child.id, now, period]);
  if (!all.length && childAge(child.birth_date).months >= BABY_MONTHS) return null;
  const today = days[days.length - 1];
  const total = knownTotal(days.map((d) => d.count));
  const sums = days.reduce((a, d) => ({ wet: a.wet + d.wet, stool: a.stool + d.stool, both: a.both + d.both }), { wet: 0, stool: 0, both: 0 });
  const last = lastDiaper(all, child.id);
  const selected = days.find((d) => d.day === p.day) ?? today;
  const countStr = (v: number | null) => (v != null ? tr('qt.d.count', { count: v }) : tr('qt.none'));
  return (
    <View style={{ gap: spacing.sm, marginBottom: spacing.sm }} testID="care-category-summary">
      <GlassSegmentedControl testID="care-cat-period" label={tr('qt.cat.periodLabel')} value={period}
        onChange={(v) => router.setParams({ period: v, day: undefined } as never)}
        options={[{ value: 'day' as Period, label: tr('qt.cat.day'), testID: 'care-cat-period-day' }, { value: 'week' as Period, label: tr('qt.cat.week'), testID: 'care-cat-period-week' }]} />
      {last ? (
        <Tappable accessibilityRole="button" testID="care-cat-last" onPress={() => openDiaper(child, last.id)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          accessibilityLabel={`${tr('qt.d.lastTitle', { name: child.first_name })}. ${diaperLabel(diaperType(last))}. ${clock(new Date(last.at))}. ${agoLabel(last.at, now)}`}>
          <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Icon name={DIAPER_ICON[diaperType(last)]} size={16} color={t.colors.textMuted} />
              <Text variant="small" weight="medium" style={{ flex: 1 }}>{tr('qt.d.lastTitle', { name: child.first_name })}</Text>
              <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
            </View>
            <Text testID="care-cat-last-ago" maxFontSizeMultiplier={1.3} style={[{ fontSize: 34, lineHeight: 40, letterSpacing: -1, fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{agoLabel(last.at, now)}</Text>
            <Text weight="bold" style={TABULAR}>{tr('qt.d.whatAt', { what: diaperLabel(diaperType(last)), time: clock(new Date(last.at)) })}</Text>
          </Glass>
        </Tappable>
      ) : null}
      <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.sm }} testID="care-cat-totals">
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" muted>{tr('qt.d.todayTotal')}</Text>
            <Text weight="bold" style={[{ fontSize: 22 }, TABULAR]} testID="care-cat-today">{countStr(today.count)}</Text>
            {today.count ? <Text variant="caption" muted testID="care-cat-today-split">{split(today)}</Text> : null}
          </View>
          {period === 'week' ? (
            <View style={{ flex: 1 }}>
              <Text variant="caption" muted>{tr('qt.d.weekTotal')}</Text>
              <Text weight="bold" style={[{ fontSize: 22 }, TABULAR]} testID="care-cat-period-total">{countStr(total.total)}</Text>
              {total.total ? <Text variant="caption" muted testID="care-cat-period-split">{split(sums)}</Text> : null}
              <Text variant="caption" muted>{tr('qt.cat.knownDays', { count: total.knownDays })}</Text>
            </View>
          ) : null}
        </View>
        {period === 'week' ? (
          <DayBars testID="care-cat-bars" days={days.map((d) => ({ day: d.day, value: d.count }))} selected={selected.day} minMax={4}
            onSelect={(day) => router.setParams({ day } as never)} describe={(d) => countStr(d.value)} />
        ) : null}
        <View style={{ gap: 2 }} testID="care-cat-day-list">
          <Text variant="label">{formatDate(`${selected.day}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          {selected.entries.length ? selected.entries.map((d) => (
            <Tappable key={d.id} accessibilityRole="button" onPress={() => openDiaper(child, d.id)} testID={`care-cat-entry-${d.id}`}
              style={({ pressed }) => ({ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed ? 0.6 : 1 })}>
              <Icon name={DIAPER_ICON[diaperType(d)]} size={16} color={t.colors.textMuted} />
              <Text style={[{ flex: 1 }, TABULAR]}>{`${clock(new Date(d.at))} · ${diaperLabel(diaperType(d))}`}</Text>
              {d.note ? <Icon name="message-square" size={14} color={t.colors.primary} /> : null}
              <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
            </Tappable>
          )) : <Text variant="small" muted testID="care-cat-day-none">{tr('qt.noneDay')}</Text>}
        </View>
      </Glass>
    </View>
  );
}
