/**
 * Agenda v5 — la semaine en un coup d'œil : 7 jours (initiale, numéro tabulaire, jusqu'à 3 points discrets).
 * Choisir une date : l'indicateur (aplat de l'action) GLISSE jusqu'au jour en ressort « panneau » (Reanimated, fil
 * UI, ≈ 300 ms, sans rebond perceptible) + haptique de sélection. Réduire les animations : saut immédiat.
 * Aujourd'hui : contour corail fin. Aucun mouvement au repos.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, ReduceMotion } from 'react-native-reanimated';
import { haptic, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { addDays, atLocal, weekStart } from '@/lib/domain/calendar';
import { todayISO } from '@/lib/domain/dates';
import { springs, useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { formatDate, t as tr } from '@/i18n';

const GAP = 6;
const longDay = (day: string) => formatDate(atLocal(day, 12), { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase());

export function WeekStrip({ cursor, counts, onPick }: { cursor: string; counts: (d: string) => number; onPick: (d: string) => void }) {
  const t = useTheme();
  const m = useMotion();
  const start = weekStart(todayISO());
  const today = todayISO();
  const days = Array.from({ length: 7 }, (_, k) => addDays(start, k));
  const idx = days.indexOf(cursor);
  const [w, setW] = useState(0);
  const cell = w ? (w - GAP * 6) / 7 : 0;
  const x = useSharedValue(0);
  const shown = useSharedValue(0);
  useEffect(() => {
    if (!cell) return;
    const to = Math.max(0, idx) * (cell + GAP);
    // Premier rendu ou animations réduites : position finale immédiate ; sinon ressort « panneau »
    if (shown.value === 0 || m.off || m.minimal) x.value = to;
    else x.value = withSpring(to, { ...springs.panneau, reduceMotion: ReduceMotion.Never });
    shown.value = idx >= 0 ? 1 : 0;
  }, [idx, cell, m.off, m.minimal, x, shown]);
  const ind = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ translateX: x.value }] }));

  return (
    <View style={{ flexDirection: 'row', gap: GAP }} testID="cal-week-strip" onLayout={(e) => setW(e.nativeEvent.layout.width)} accessibilityRole="tablist">
      {cell ? (
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, width: cell, borderRadius: radius.md, backgroundColor: t.tokens.action.fill }, ind]} />
      ) : null}
      {days.map((d) => {
        const n = counts(d);
        const on = d === cursor;
        const isToday = d === today;
        const fg = on ? t.tokens.action.text : t.colors.text;
        return (
          <Tappable key={d} onPress={() => { haptic('selection'); onPick(d); }} accessibilityRole="tab" accessibilityState={{ selected: on }} aria-selected={on}
            accessibilityLabel={`${longDay(d)}, ${n ? tr('u3.cal.nItems', { count: n }) : tr('u3.cal.nothingLc')}`} testID={`cal-day-${d}`} pressScale={0.95}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 8, minHeight: 64, borderRadius: radius.md, borderWidth: on ? 0 : isToday ? 1.5 : StyleSheet.hairlineWidth,
              borderColor: isToday ? t.colors.primary : t.colors.border, backgroundColor: on ? 'transparent' : t.colors.surface }}>
            <Text variant="caption" color={on ? fg : t.colors.textMuted}>{formatDate(atLocal(d, 12), { weekday: 'narrow' })}</Text>
            <Text weight="bold" color={fg} style={{ fontVariant: ['tabular-nums'] }}>{Number(d.slice(8))}</Text>
            <View style={{ flexDirection: 'row', gap: 3, height: 5, marginTop: 3 }}>
              {Array.from({ length: Math.min(n, 3) }, (_, i) => <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: on ? fg : t.colors.primary }} />)}
            </View>
          </Tappable>
        );
      })}
    </View>
  );
}
