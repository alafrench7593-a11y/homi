/**
 * Barres simples du sommeil par jour (nuit + siestes), 7 / 14 / 30 jours. Aucune ligne « normale », aucune note.
 * Apparition : chaque barre monte depuis sa base (translateY + opacity, pilote natif), l'une après l'autre ;
 * immédiate si « Réduire les animations » est activé. Alternative textuelle complète juste en dessous (SleepBarsText).
 */
import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { Text } from '@/components/ui';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { easing, stagger } from '@/theme/motion';
import { NATIVE_DRIVER, radius, spacing } from '@/theme/tokens';
import { span } from '@/lib/domain/sleepPlanner';
import type { DayBar } from '@/lib/domain/sleepJournal';
import { formatDate, t as tr } from '@/i18n';

const H = 132;

function Bar({ bar, max, index, night, nap, empty }: { bar: DayBar; max: number; index: number; night: string; nap: string; empty: string }) {
  const reduce = useReduceMotion();
  const p = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const total = bar.totalMinutes;
  const h = total > 0 ? Math.max(4, Math.round((total / max) * H)) : 0;
  useEffect(() => {
    if (reduce) { p.setValue(1); return; }
    p.setValue(0);
    const a = Animated.timing(p, { toValue: 1, duration: 420, delay: stagger(index, 22, 520), easing: easing.decelerate, useNativeDriver: NATIVE_DRIVER });
    a.start();
    return () => a.stop();
  }, [total, max, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  const nightH = total > 0 ? Math.round((bar.nightMinutes / total) * h) : 0;
  return (
    <View style={{ flex: 1, height: H, justifyContent: 'flex-end', alignItems: 'center', overflow: 'hidden' }}>
      {h > 0 ? (
        <Animated.View style={{ width: '70%', maxWidth: 26, height: h, borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm, overflow: 'hidden', opacity: p, transform: [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [h, 0] }) }] }}>
          <View style={{ flex: 1, backgroundColor: nap }} />
          <View style={{ height: nightH, backgroundColor: night }} />
        </Animated.View>
      ) : <View style={{ width: '70%', maxWidth: 26, height: 2, backgroundColor: empty, borderRadius: 1 }} />}
    </View>
  );
}

const labelFor = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00`);
  return days === 7 ? formatDate(d, { weekday: 'narrow' }) : String(d.getDate());
};

export function SleepBars({ bars, testID }: { bars: DayBar[]; testID?: string }) {
  const t = useTheme();
  const max = Math.max(60, ...bars.map((b) => b.totalMinutes));
  const days = bars.length;
  const night = t.colors.lavender;
  const nap = t.colors.gold;
  const noted = bars.filter((b) => b.hasData).length;
  return (
    <View testID={testID} accessible accessibilityRole="image" accessibilityLabel={tr('sj.chart.a11y', { days, n: noted })} style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: days > 14 ? 1 : 4 }}>
        {bars.map((b, i) => <Bar key={b.date} bar={b} max={max} index={i} night={night} nap={nap} empty={t.colors.border} />)}
      </View>
      <View style={{ flexDirection: 'row', gap: days > 14 ? 1 : 4 }}>
        {bars.map((b, i) => (
          <View key={b.date} style={{ flex: 1, alignItems: 'center' }}>
            {days === 7 || i === days - 1 || (days === 14 ? i % 2 === 0 : i % 5 === 0)
              ? <Text variant="caption" muted numberOfLines={1} style={{ fontSize: 11 }}>{labelFor(b.date, days)}</Text> : null}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Legend color={night} label={tr('sj.chart.night')} />
        <Legend color={nap} label={tr('sj.chart.nap')} />
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color }} />
      <Text variant="caption" muted>{label}</Text>
    </View>
  );
}

/** Alternative textuelle : une ligne par jour noté (les jours sans saisie sont dits « rien de noté »). */
export function SleepBarsText({ bars }: { bars: DayBar[] }) {
  return (
    <View testID="sleep-bars-text" style={{ gap: 2 }}>
      {[...bars].reverse().map((b) => (
        <Text key={b.date} variant="small">
          {tr('sj.chart.line', {
            day: formatDate(new Date(`${b.date}T12:00:00`), { weekday: 'short', day: 'numeric', month: 'short' }),
            text: b.hasData
              ? tr('sj.chart.lineData', { night: b.nightMinutes ? span(b.nightMinutes) : '—', naps: tr('sj.naps', { count: b.naps }), nap: span(b.napMinutes), wakings: tr('sj.wakings', { count: b.wakings }) })
              : tr('sj.chart.lineEmpty'),
          })}
        </Text>
      ))}
    </View>
  );
}
