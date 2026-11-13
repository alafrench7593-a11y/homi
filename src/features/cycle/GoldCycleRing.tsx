/**
 * Anneau du cycle au fil d'or (en-tête de « Mon cycle ») : une perle par jour du cycle.
 * - règles NOTÉES : perles pleines couleur règles ;
 * - jours passés : perles d'or ; jour actuel : perle or néon qui pulse ;
 * - fenêtre fertile ESTIMÉE : perles cerclées (jamais pleines), légende « estimée » ;
 * - au centre : le jour du cycle, la durée estimée.
 * Un fil d'or relie les perles ; une lueur le parcourt jusqu'à aujourd'hui. Immobile si les animations sont réduites.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { t as tr, type TKey } from '@/i18n';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import type { RingData } from './CycleRing';
import { Ink, useCyclePalette } from './kit';
import { fmtDay } from './format';
import { ambientDelay } from '@/theme/motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const DAY = 86_400_000;
const dn = (iso: string) => Math.floor(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / DAY);
const NEON = '#E9CFA4'; // champagne HOMI
const NEON_CORE = '#F6ECDA';
const NEON_HOT = '#F7F4FB';
const pd = (k: string, p?: Record<string, string | number>) => tr(k as TKey, p);

export function GoldCycleRing({ data, size = 260 }: { data: RingData; size?: number }) {
  const c = useCyclePalette();
  const reduce = useReduceMotion();
  const wave = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const a = Animated.loop(Animated.sequence([
      Animated.timing(wave, { isInteraction: false, toValue: 1, duration: 2400, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ambientDelay(900),
      Animated.timing(wave, { isInteraction: false, toValue: 0, duration: 0, useNativeDriver: false }),
    ]));
    const b = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { isInteraction: false, toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(pulse, { isInteraction: false, toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
    a.start(); b.start();
    return () => { a.stop(); b.stop(); };
  }, [reduce, wave, pulse]);

  const { length, periodDays } = data;
  const day = data.day ?? 0;
  const start = data.lastStart ? dn(data.lastStart) : null;
  const fFrom = start != null && data.fertileFrom ? dn(data.fertileFrom) - start + 1 : null;
  const fTo = start != null && data.fertileTo ? dn(data.fertileTo) - start + 1 : null;
  const cx = size / 2;
  const r = cx - 14;
  const span = Math.max(1, day - 1);
  const beads = Array.from({ length }, (_, k) => k + 1);

  return (
    <View style={{ alignItems: 'center', gap: spacing.sm }} accessible accessibilityRole="image" testID="cycle-gold-ring"
      accessibilityLabel={pd('pd.ring.label', { day, length })}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {/* le fil d'or qui relie les perles */}
          <Circle cx={cx} cy={cx} r={r} stroke={NEON} strokeOpacity={0.18} strokeWidth={6} fill="none" />
          <Circle cx={cx} cy={cx} r={r} stroke={NEON_CORE} strokeOpacity={0.45} strokeWidth={1.2} fill="none" />
          {beads.map((i) => {
            const a = ((i - 1) / length) * 2 * Math.PI - Math.PI / 2;
            const x = cx + r * Math.cos(a);
            const y = cx + r * Math.sin(a);
            const isPeriod = i <= periodDays;
            const isFertile = fFrom != null && fTo != null && i >= fFrom && i <= fTo;
            const isToday = i === day;
            const past = i < day;
            if (isToday) {
              return (
                <React.Fragment key={i}>
                  <AnimatedCircle cx={x} cy={y} r={reduce ? 12 : pulse.interpolate({ inputRange: [0, 1], outputRange: [10, 16] })} fill={NEON} fillOpacity={reduce ? 0.28 : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.1] })} />
                  <Circle cx={x} cy={y} r={7.5} fill={NEON} fillOpacity={0.4} />
                  <Circle cx={x} cy={y} r={5.5} fill={isPeriod ? c.period : NEON_HOT} stroke={NEON_HOT} strokeWidth={1.5} />
                </React.Fragment>
              );
            }
            if (isPeriod) return <Circle key={i} cx={x} cy={y} r={4.6} fill={c.period} stroke={NEON_CORE} strokeOpacity={0.6} strokeWidth={1} />;
            if (isFertile) {
              return <Circle key={i} cx={x} cy={y} r={4.4} fill="none" stroke={c.mauve} strokeWidth={1.6} strokeDasharray="2 2" />;
            }
            if (past) {
              const at = (i - 1) / span;
              const glow = reduce ? 0.2 : wave.interpolate({ inputRange: [Math.max(0, at - 0.12), at, Math.min(1, at + 0.12)], outputRange: [0.15, 0.75, 0.15], extrapolate: 'clamp' });
              const grow = reduce ? 5.5 : wave.interpolate({ inputRange: [Math.max(0, at - 0.12), at, Math.min(1, at + 0.12)], outputRange: [5, 7.5, 5], extrapolate: 'clamp' });
              return (
                <React.Fragment key={i}>
                  <AnimatedCircle cx={x} cy={y} r={grow} fill={NEON} fillOpacity={glow} />
                  <Circle cx={x} cy={y} r={2.8} fill={NEON_CORE} />
                </React.Fragment>
              );
            }
            return <Circle key={i} cx={x} cy={y} r={2.2} fill={c.inkSoft} fillOpacity={0.35} />;
          })}
        </Svg>
        <View style={{ alignItems: 'center' }}>
          <Ink variant="title" weight="bold">{day ? pd('pd.ring.day', { day }) : '—'}</Ink>
          <Ink variant="caption" soft>{pd('pd.ring.of', { length })}</Ink>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md }}>
        <Legend color={c.period} filled label={pd('pd.ring.legend.period')} />
        <Legend color={c.mauve} label={pd('pd.ring.legend.fertile')} />
      </View>
      {data.nextPeriod ? <Ink variant="small" soft center>{pd('pd.ring.next', { date: fmtDay(data.nextPeriod) })}</Ink> : null}
    </View>
  );
}

function Legend({ color, filled, label }: { color: string; filled?: boolean; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: filled ? color : 'transparent', borderWidth: filled ? 0 : 1.6, borderColor: color, borderStyle: filled ? 'solid' : 'dashed' }} />
      <Ink variant="caption" soft>{label}</Ink>
    </View>
  );
}
