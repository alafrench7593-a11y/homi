/**
 * Horloge du jour (24 h glissantes) : sommeils en arcs, repas en points, changes en tirets,
 * aiguille sur l'heure actuelle. Lisible d'un coup d'œil, même à 3 h du matin.
 * Purement descriptive : aucune zone « normale » ou « anormale ».
 */
import React from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { palette, fonts } from '@/theme/tokens';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { Text } from './ui';
import { t as tr } from '@/i18n';

export interface ClockEvent {
  kind: 'sleep' | 'feed' | 'diaper';
  start: string;
  end?: string | null;
}

const angleOf = (d: Date) => ((d.getHours() + d.getMinutes() / 60) / 24) * 360 - 90;
const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};
function arc(cx: number, cy: number, r: number, from: number, to: number) {
  let sweep = to - from;
  if (sweep < 0) sweep += 360;
  if (sweep > 359.5) sweep = 359.5;
  const s = polar(cx, cy, r, from);
  const e = polar(cx, cy, r, from + sweep);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
}

export function DayClock({ events, size = 280, children, now = new Date(), label }: { events: ClockEvent[]; size?: number; children?: React.ReactNode; now?: Date; label: string }) {
  const t = useTheme();
  const c = size / 2;
  const rSleep = c - 22;
  const rFeed = c - 44;
  const rDiaper = c - 60;
  const since = now.getTime() - 24 * 3600_000;
  const recent = events.filter((e) => new Date(e.end ?? e.start).getTime() >= since);
  const ink = t.colors.text;

  const counts = { sleep: recent.filter((e) => e.kind === 'sleep').length, feed: recent.filter((e) => e.kind === 'feed').length, diaper: recent.filter((e) => e.kind === 'diaper').length };

  return (
    <View style={{ width: size, height: size }} accessible accessibilityRole="image" accessibilityLabel={tr('u4.clock.a11y', { label, feeds: counts.feed, sleeps: counts.sleep, diapers: counts.diaper })}>
      <Svg width={size} height={size}>
        {/* cadran : nuit (18h-6h) teintée, jour clair */}
        <Path d={arc(c, c, rSleep, angleOf(new Date(2000, 0, 1, 18)), angleOf(new Date(2000, 0, 1, 6)))} stroke={t.isDark ? '#262B57' : '#DCD5EE'} strokeWidth={26} fill="none" />
        <Path d={arc(c, c, rSleep, angleOf(new Date(2000, 0, 1, 6)), angleOf(new Date(2000, 0, 1, 18)))} stroke={t.isDark ? '#1E2247' : '#F3EEE6'} strokeWidth={26} fill="none" />
        {Array.from({ length: 24 }, (_, h) => {
          const a = (h / 24) * 360 - 90;
          const p1 = polar(c, c, c - 6, a);
          const p2 = polar(c, c, c - (h % 6 === 0 ? 14 : 9), a);
          return <Line key={h} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={ink} strokeOpacity={h % 6 === 0 ? 0.55 : 0.18} strokeWidth={h % 6 === 0 ? 1.6 : 1} />;
        })}
        {size >= 260 && [0, 6, 12, 18].map((h) => {
          const p = polar(c, c, rDiaper - 16, (h / 24) * 360 - 90);
          return <SvgText key={h} x={p.x} y={p.y + 4} fontSize={11} fill={ink} fillOpacity={0.5} textAnchor="middle" fontFamily={fonts.bodyMedium}>{h === 0 ? '0h' : `${h}h`}</SvgText>;
        })}
        {/* sommeils */}
        {recent.filter((e) => e.kind === 'sleep').map((e, i) => {
          const s = new Date(Math.max(new Date(e.start).getTime(), since));
          const en = e.end ? new Date(e.end) : now;
          return <Path key={`s${i}`} d={arc(c, c, rSleep, angleOf(s), angleOf(en))} stroke={palette.lavender} strokeWidth={18} strokeLinecap="round" fill="none" opacity={e.end ? 0.95 : 0.6} />;
        })}
        {/* repas */}
        {recent.filter((e) => e.kind === 'feed').map((e, i) => {
          const p = polar(c, c, rFeed, angleOf(new Date(e.start)));
          return <Circle key={`f${i}`} cx={p.x} cy={p.y} r={6} fill={palette.clay} stroke={t.colors.surface} strokeWidth={2} />;
        })}
        {/* changes */}
        {recent.filter((e) => e.kind === 'diaper').map((e, i) => {
          const a = angleOf(new Date(e.start));
          const p1 = polar(c, c, rDiaper + 4, a);
          const p2 = polar(c, c, rDiaper - 4, a);
          return <Line key={`d${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={palette.gold} strokeWidth={4} strokeLinecap="round" />;
        })}
        {/* maintenant */}
        <G>
          {(() => {
            const p = polar(c, c, c - 4, angleOf(now));
            const q = polar(c, c, rDiaper - 6, angleOf(now));
            return (
              <>
                <Line x1={q.x} y1={q.y} x2={p.x} y2={p.y} stroke={ink} strokeWidth={2} strokeLinecap="round" />
                <Circle cx={p.x} cy={p.y} r={4.5} fill={ink} />
              </>
            );
          })()}
        </G>
      </Svg>
      <View style={{ position: 'absolute', left: size * 0.25, right: size * 0.25, top: size * 0.25, bottom: size * 0.25, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

export function ClockLegend() {
  const t = useTheme();
  const item = (color: string, label: string, shape: 'dot' | 'bar' | 'arc') => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: shape === 'arc' ? 16 : shape === 'bar' ? 4 : 10, height: shape === 'bar' ? 10 : shape === 'arc' ? 8 : 10, borderRadius: 5, backgroundColor: color }} />
      <SvgLabel color={t.colors.textMuted} text={label} />
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
      {item(palette.lavender, tr('u4.clock.sleep'), 'arc')}
      {item(palette.clay, tr('u4.clock.meal'), 'dot')}
      {item(palette.gold, tr('u4.clock.change'), 'bar')}
    </View>
  );
}

function SvgLabel({ text, color }: { text: string; color: string }) {
  return <Text variant="caption" color={color}>{text}</Text>;
}

/** Anneau des 40 semaines autour de l'illustration du bébé. */
const NEON = '#FFC861';
const NEON_CORE = '#FFE7A8';
const NEON_HOT = '#FFF6DC';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Anneau des semaines : perles d'or néon. Une vague de lumière parcourt les semaines déjà passées jusqu'à la
 * semaine en cours, qui pulse doucement. Immobile (mais toujours dorée) si les animations sont réduites.
 */
export function WeeksRing({ week, total = 41, size, children }: { week: number; total?: number; size: number; children?: React.ReactNode }) {
  const c = size / 2;
  const r = c - 10;
  const reduce = useReduceMotion();
  const wave = React.useRef(new Animated.Value(0)).current;
  const pulse = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (reduce) return;
    const a = Animated.loop(Animated.sequence([
      Animated.timing(wave, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      Animated.delay(700),
      Animated.timing(wave, { toValue: 0, duration: 0, useNativeDriver: false }),
    ]));
    const b = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
    a.start(); b.start();
    return () => { a.stop(); b.stop(); };
  }, [reduce, wave, pulse]);
  const span = Math.max(1, week);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }} accessibilityElementsHidden importantForAccessibility="no">
        {Array.from({ length: total }, (_, i) => {
          const a = (i / total) * 360 - 90;
          const p = polar(c, c, r, a);
          const done = i < week;
          const current = i === week;
          if (!done && !current) return <Circle key={i} cx={p.x} cy={p.y} r={2.2} fill="#FFFFFF" fillOpacity={0.2} />;
          if (current) {
            return (
              <React.Fragment key={i}>
                <AnimatedCircle cx={p.x} cy={p.y} r={reduce ? 12 : pulse.interpolate({ inputRange: [0, 1], outputRange: [10, 15] })} fill={NEON} fillOpacity={reduce ? 0.28 : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.32, 0.12] })} />
                <Circle cx={p.x} cy={p.y} r={8} fill={NEON} fillOpacity={0.35} />
                <Circle cx={p.x} cy={p.y} r={5.5} fill={NEON_HOT} />
              </React.Fragment>
            );
          }
          // vague : chaque perle s'allume quand la lumière passe sur elle
          const at = i / span;
          const glow = reduce ? 0.22 : wave.interpolate({ inputRange: [Math.max(0, at - 0.12), at, Math.min(1, at + 0.12)], outputRange: [0.18, 0.75, 0.18], extrapolate: 'clamp' });
          const grow = reduce ? 6 : wave.interpolate({ inputRange: [Math.max(0, at - 0.12), at, Math.min(1, at + 0.12)], outputRange: [5.5, 8, 5.5], extrapolate: 'clamp' });
          return (
            <React.Fragment key={i}>
              <AnimatedCircle cx={p.x} cy={p.y} r={grow} fill={NEON} fillOpacity={glow} />
              <Circle cx={p.x} cy={p.y} r={3.2} fill={NEON_CORE} />
            </React.Fragment>
          );
        })}
      </Svg>
      {children}
    </View>
  );
}
