/**
 * Catégorie « Alimentation » — niveau 2 du tracking (en tête de /tools/feeding, pour l'enfant affiché). Lit les MÊMES
 * lignes que les mini-apps (biberons, tétées en lecture seule, « Ses découvertes » en lecture seule) :
 *  · période (Jour / 7 jours), conservée dans l'adresse (« ?period=&day= ») ;
 *  · dernière prise (biberon ou tétée) → son app, sur ELLE ;
 *  · trois totaux SÉPARÉS, chacun dans son unité : millilitres bus (biberons), minutes de tétée, aliments découverts.
 *    Jamais additionnés entre eux ;
 *  · une barre par jour pour les millilitres ; jour sans quantité notée = pointillés « rien de noté », jamais 0 ;
 *    toucher un jour liste ses prises, chacune ouvre son app sur elle.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Glass, GlassSegmentedControl } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { Icon, Text, type IconName } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { useActiveSubject, useChildren, useLogs } from '@/lib/data/hooks';
import { useBottleHistory, useNow } from '@/lib/data/hooks-bottle';
import { useFoodEntries } from '@/lib/data/hooks-discoveries';
import { childAge } from '@/lib/domain/child';
import { agoLabel } from '@/lib/domain/dayTimeline';
import { bottlesByDay, feedMinutes, feedsByDay, foodsByDay, knownTotal, lastFeeding, type BottleLike, type FeedLike, type FoodLike } from '@/lib/domain/quickTrack';
import { clock, span } from '@/lib/domain/sleepPlanner';
import type { Breastfeed, Child } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { DayBars } from './DayBars';
import { TABULAR } from './EntryTray';

type Period = 'day' | 'week';
const BABY_MONTHS = 36;

export function FeedingCategorySummary() {
  const { subject } = useActiveSubject();
  const { data: children } = useChildren();
  const child = subject?.type === 'child' ? (children ?? []).find((c) => c.id === subject.id) ?? null : null;
  if (!child) return null;
  return <Summary key={child.id} child={child} />;
}

const sideLabel = (s?: string | null) => (s === 'left' ? tr('qt.f.left') : s === 'right' ? tr('qt.f.right') : s === 'both' ? tr('qt.f.both') : null);
const openBottle = (child: Child, id: string) => router.push({ pathname: '/bottle/[childId]', params: { childId: child.id, bottle: id } } as never);
const openFeed = (child: Child, id: string) => router.push({ pathname: '/track/[kind]', params: { kind: 'breastfeed', child: child.id, id } } as never);
const openFoods = (child: Child) => router.push({ pathname: '/child/[id]/discoveries', params: { id: child.id } } as never);

function Summary({ child }: { child: Child }) {
  const t = useTheme();
  const p = useLocalSearchParams<{ period?: string; day?: string }>();
  const period: Period = p.period === 'day' ? 'day' : 'week';
  const now = useNow(60_000);
  const bq = useBottleHistory(child.id, 8);
  const fq = useLogs<Breastfeed>('breastfeed', child.id, 8);
  const foodQ = useFoodEntries(child.id);
  const bottles = (bq.data ?? []) as unknown as BottleLike[];
  const feeds = (fq.data ?? []) as FeedLike[];
  const foods = (foodQ.data ?? []) as unknown as FoodLike[];
  const n = period === 'day' ? 1 : 7;
  const bDays = useMemo(() => bottlesByDay(bottles, child.id, now, n), [bottles, child.id, now, n]);
  const fDays = useMemo(() => feedsByDay(feeds, child.id, now, n), [feeds, child.id, now, n]);
  const aDays = useMemo(() => foodsByDay(foods, child.id, now, n), [foods, child.id, now, n]);
  const anyData = bottles.length > 0 || feeds.length > 0 || aDays.some((d) => d.count != null);
  if (!anyData && childAge(child.birth_date).months >= BABY_MONTHS) return null;

  const last = lastFeeding(bottles, feeds, child.id, now);
  const i = bDays.length - 1;
  const selectedDay = bDays.find((d) => d.day === p.day)?.day ?? bDays[i].day;
  const ml = { today: bDays[i].ml, period: knownTotal(bDays.map((d) => d.ml)) };
  const min = { today: fDays[i].minutes, period: knownTotal(fDays.map((d) => d.minutes)) };
  const fo = { today: aDays[i].count, period: knownTotal(aDays.map((d) => d.count)) };
  const sb = bDays.find((d) => d.day === selectedDay)!;
  const sf = fDays.find((d) => d.day === selectedDay)!;
  const sa = aDays.find((d) => d.day === selectedDay)!;
  const timed = [
    ...sb.entries.map((b) => ({ key: `b-${b.id}`, at: b.at, icon: 'coffee' as IconName, text: `${clock(new Date(b.at))} · ${tr('qt.f.bottle')} · ${b.consumed_ml != null ? tr('qt.b.ml', { n: b.consumed_ml }) : tr('qt.b.noQty')}`, onPress: () => openBottle(child, b.id), testID: `feed-cat-entry-bottle-${b.id}` })),
    ...sf.entries.map((f) => {
      const m = feedMinutes(f);
      return { key: `f-${f.id}`, at: f.started_at, icon: 'droplet' as IconName, text: [`${clock(new Date(f.started_at))} · ${tr('qt.f.feed')}`, m != null ? span(m) : tr('qt.f.noEnd'), sideLabel(f.side)].filter(Boolean).join(' · '), onPress: () => openFeed(child, f.id), testID: `feed-cat-entry-feed-${f.id}` };
    }),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const mlStr = (v: number | null) => (v != null ? tr('qt.b.ml', { n: v }) : tr('qt.none'));
  const minStr = (v: number | null) => (v != null ? span(v) : tr('qt.none'));
  const foodStr = (v: number | null) => (v != null ? tr('qt.f.foods', { count: v }) : tr('qt.none'));

  return (
    <View style={{ gap: spacing.sm, marginBottom: spacing.sm }} testID="feeding-category-summary">
      <GlassSegmentedControl testID="feed-cat-period" label={tr('qt.cat.periodLabel')} value={period}
        onChange={(v) => router.setParams({ period: v, day: undefined } as never)}
        options={[{ value: 'day' as Period, label: tr('qt.cat.day'), testID: 'feed-cat-period-day' }, { value: 'week' as Period, label: tr('qt.cat.week'), testID: 'feed-cat-period-week' }]} />
      {last ? (
        <Tappable accessibilityRole="button" testID="feed-cat-last" onPress={() => (last.kind === 'bottle' ? openBottle(child, last.item.id) : openFeed(child, last.item.id))}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          accessibilityLabel={`${tr('qt.f.lastTitle', { name: child.first_name })}. ${last.kind === 'bottle' ? mlStr(last.item.consumed_ml) : minStr(feedMinutes(last.item))}. ${clock(new Date(last.at))}. ${agoLabel(last.at, now)}`}>
          <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Icon name={last.kind === 'bottle' ? 'coffee' : 'droplet'} size={16} color={t.colors.textMuted} />
              <Text variant="small" weight="medium" style={{ flex: 1 }}>{tr('qt.f.lastTitle', { name: child.first_name })}</Text>
              <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' }}>
              <Text testID="feed-cat-last-value" maxFontSizeMultiplier={1.3} style={[{ fontSize: 40, lineHeight: 46, letterSpacing: -1, fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>
                {last.kind === 'bottle' ? mlStr(last.item.consumed_ml) : feedMinutes(last.item) != null ? span(feedMinutes(last.item)!) : tr('qt.f.feed')}
              </Text>
              <Text weight="bold" style={TABULAR}>{`${last.kind === 'bottle' ? tr('qt.f.bottle') : tr('qt.f.feed')} · ${clock(new Date(last.at))}`}</Text>
            </View>
            <Text variant="small" muted>{agoLabel(last.at, now)}</Text>
          </Glass>
        </Tappable>
      ) : null}
      <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.sm }} testID="feed-cat-totals">
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1.2 }} />
          <Text variant="caption" muted style={{ flex: 1 }}>{tr('qt.cat.today')}</Text>
          {period === 'week' ? <Text variant="caption" muted style={{ flex: 1 }}>{tr('qt.cat.sevenDays')}</Text> : null}
        </View>
        <TotalRow icon="coffee" label={tr('qt.f.mlLabel')} today={mlStr(ml.today)} period={period === 'week' ? mlStr(ml.period.total) : null} known={ml.period.knownDays} testID="feed-cat-ml" />
        <TotalRow icon="droplet" label={tr('qt.f.minLabel')} today={minStr(min.today)} period={period === 'week' ? minStr(min.period.total) : null} known={min.period.knownDays} testID="feed-cat-min" />
        <TotalRow icon="feather" label={tr('qt.f.foodLabel')} today={foodStr(fo.today)} period={period === 'week' ? foodStr(fo.period.total) : null} known={fo.period.knownDays} testID="feed-cat-foods" />
        <Text variant="caption" muted>{tr('qt.f.separate')}</Text>
        {period === 'week' ? (
          <View style={{ gap: 4 }}>
            <Text variant="label">{tr('qt.f.barsTitle')}</Text>
            <DayBars testID="feed-cat-bars" days={bDays.map((d) => ({ day: d.day, value: d.ml }))} selected={selectedDay} minMax={60}
              onSelect={(day) => router.setParams({ day } as never)}
              describe={(d) => { const b = bDays.find((x) => x.day === d.day)!; return d.value != null ? tr('qt.b.ml', { n: d.value }) : b.count ? tr('qt.f.noQtyDay', { count: b.count }) : tr('qt.none'); }} />
          </View>
        ) : null}
        <View style={{ gap: 2 }} testID="feed-cat-day-list">
          <Text variant="label">{formatDate(`${selectedDay}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          {timed.map((e) => (
            <Tappable key={e.key} accessibilityRole="button" onPress={e.onPress} testID={e.testID}
              style={({ pressed }) => ({ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed ? 0.6 : 1 })}>
              <Icon name={e.icon} size={16} color={t.colors.textMuted} />
              <Text style={[{ flex: 1 }, TABULAR]}>{e.text}</Text>
              <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
            </Tappable>
          ))}
          {sa.entries.map((f) => (
            <Tappable key={`a-${f.id}`} accessibilityRole="button" onPress={() => openFoods(child)} testID={`feed-cat-entry-food-${f.id}`}
              style={({ pressed }) => ({ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed ? 0.6 : 1 })}>
              <Icon name="feather" size={16} color={t.colors.textMuted} />
              <Text style={{ flex: 1 }}>{tr('qt.f.discovered', { food: f.food_name })}</Text>
              <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
            </Tappable>
          ))}
          {!timed.length && !sa.entries.length ? <Text variant="small" muted testID="feed-cat-day-none">{tr('qt.noneDay')}</Text> : null}
        </View>
      </Glass>
    </View>
  );
}

export function TotalRow({ icon, label, today, period, known, testID }: { icon: IconName; label: string; today: string; period: string | null; known: number; testID: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }} testID={testID}>
      <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name={icon} size={14} color={t.colors.textMuted} />
        <Text variant="small" weight="medium" style={{ flexShrink: 1 }}>{label}</Text>
      </View>
      <Text weight="bold" style={[{ flex: 1 }, TABULAR]} testID={`${testID}-today`}>{today}</Text>
      {period != null ? (
        <View style={{ flex: 1 }}>
          <Text weight="bold" style={TABULAR} testID={`${testID}-period`}>{period}</Text>
          <Text variant="caption" muted>{tr('qt.cat.knownDays', { count: known })}</Text>
        </View>
      ) : null}
    </View>
  );
}
