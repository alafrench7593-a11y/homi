/**
 * Frise de la journée au fil d'or (00 h → 24 h) : sommeils et tétées en segments, couches et biberons en perles,
 * « maintenant » marqué par une perle qui pulse. Vraies saisies uniquement ; lisible d'un coup d'œil.
 */
import React, { useEffect, useRef } from 'react';
import { t as tr } from '@/i18n';
import { Animated, Easing, View } from 'react-native';
import { GlassSurface } from '@/components/Glass';
import { Text } from '@/components/ui';
import { tint } from '@/components/ToolGlyph';
import type { DayEvent } from '@/lib/domain/dayTimeline';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { NATIVE_DRIVER, spacing } from '@/theme/tokens';

const DAY = 1440;
const pct = (m: number) => `${(Math.max(0, Math.min(DAY, m)) / DAY) * 100}%` as `${number}%`;

function NowPearl({ color }: { color: string }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { isInteraction: false, toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(v, { isInteraction: false, toValue: 0, duration: 0, useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, v]);
  return (
    <View style={{ width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: color,
        opacity: reduce ? 0.3 : v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
        transform: [{ scale: reduce ? 1.4 : v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }] }} />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

export function DayStrip({ title, events, now, legend, testID, empty }: {
  title: string;
  events: DayEvent[];
  /** Minutes depuis minuit, ou null. */
  now: number | null;
  /** Libellés courts de la légende (seulement les types présents). */
  legend?: { kind: DayEvent['kind']; label: string }[];
  testID?: string;
  /** Texte quand rien n'est noté aujourd'hui. */
  empty?: string;
}) {
  const t = useTheme();
  const gold = t.colors.gold;
  const accent = t.colors.primary;
  const thread = tint(t.isDark ? '#E5C190' : '#AC8B5D', t.isDark ? 0.45 : 0.4);
  const colorOf = (k: DayEvent['kind']) => (k === 'sleep' ? tint(gold, t.isDark ? 0.75 : 0.55) : k === 'feed' ? accent : k === 'bottle' ? accent : gold);
  const label = events.length
    ? tr('l5.daystrip.entries', { title, count: events.length })
    : tr('l5.daystrip.none', { title });
  return (
    <GlassSurface fill={t.colors.surface} depth={1} radius={22}>
      <View style={{ padding: spacing.md, gap: spacing.sm }} testID={testID} accessibilityRole="image" accessibilityLabel={label}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text weight="bold">{title}</Text>
          <Text variant="caption" muted>{events.length || '—'}</Text>
        </View>
        <View style={{ height: 34, justifyContent: 'center' }}>
          {/* fil d'or de la journée */}
          <View style={{ position: 'absolute', left: 0, right: 0, height: 2, borderRadius: 1, backgroundColor: thread }} />
          {[6, 12, 18].map((h) => (
            <View key={h} style={{ position: 'absolute', left: pct(h * 60), width: 1, height: 10, marginLeft: -0.5, backgroundColor: thread }} />
          ))}
          {events.map((e, i) => (e.end != null ? (
            <View key={`${e.kind}-${i}`} style={{ position: 'absolute', left: pct(e.start), width: pct(Math.max(6, e.end - e.start)), height: 12, borderRadius: 6,
              backgroundColor: colorOf(e.kind), opacity: e.open ? 0.85 : 1, borderWidth: e.open ? 1 : 0, borderColor: accent }} />
          ) : (
            <View key={`${e.kind}-${i}`} style={{ position: 'absolute', left: pct(e.start), marginLeft: -6, width: 12, height: 12, borderRadius: 6,
              backgroundColor: e.kind === 'diaper' && e.stool ? accent : colorOf(e.kind), borderWidth: 2, borderColor: t.isDark ? 'rgba(255,255,255,0.7)' : '#FFFFFF' }} />
          )))}
          {now != null ? <View style={{ position: 'absolute', left: pct(now), marginLeft: -6 }}><NowPearl color={accent} /></View> : null}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[0, 6, 12, 18, 24].map((n) => tr('l5.daystrip.hour', { n })).map((h) => <Text key={h} variant="caption" muted style={{ fontSize: 11 }}>{h}</Text>)}
        </View>
        {!events.length && empty ? <Text variant="caption" muted>{empty}</Text> : null}
        {legend?.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {legend.map((l) => (
              <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: l.kind === 'diaper' ? gold : colorOf(l.kind) }} />
                <Text variant="caption" muted>{l.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </GlassSurface>
  );
}
