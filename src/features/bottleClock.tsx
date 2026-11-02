/**
 * Cadran « journée biberons » : une horloge de 24 h en or, comme une montre de luxe.
 * - lunette dorée (dégradé, double filet), graduations fines, repères 0 h / 6 h / 12 h / 18 h, soleil et lune ;
 * - perles sur le cadran : biberons donnés (or plein), suivant (perle qui pulse), prévus (or creux), à remplir (pointillés) ;
 * - arc doré du dernier biberon au suivant : la partie déjà écoulée brille, le reste est plus pâle ;
 * - aiguille de l'heure actuelle (elle se met en place en tournant à l'ouverture), reflet qui fait le tour de la lunette ;
 * - au centre : le prochain biberon, en grand, et dans combien de temps.
 * Chaque perle se touche : remplir / noter / modifier. Immobile si les animations sont réduites.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { Icon, Text } from '@/components/ui';
import { slotClock, type DaySlot } from '@/lib/domain/bottleDayPlan';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { NATIVE_DRIVER } from '@/theme/tokens';
import { openSlot } from './bottleDay';
import { t as tr } from '@/i18n';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Angle (degrés, 0 = en haut, sens horaire) d'une heure sur un cadran de 24 h. */
export function dayAngle(d: Date): number {
  return ((d.getHours() + d.getMinutes() / 60) / 24) * 360;
}
const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
const pt = (c: number, r: number, deg: number) => ({ x: c + r * Math.cos(rad(deg)), y: c + r * Math.sin(rad(deg)) });
function arcPath(c: number, r: number, a0: number, a1: number) {
  let sweep = a1 - a0;
  while (sweep < 0) sweep += 360;
  if (sweep < 0.5) return '';
  const p0 = pt(c, r, a0);
  const p1 = pt(c, r, a0 + sweep);
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${p1.x} ${p1.y}`;
}

/** « dans 32 min », « dans 1 h 05 », « prévu il y a 12 min ». */
export function untilLabel(at: string, now: Date): string {
  const m = Math.round((Date.parse(at) - now.getTime()) / 60000);
  const fmt = (x: number) => (x >= 60 ? tr('u6.clock.hm', { h: Math.floor(x / 60), m: String(x % 60).padStart(2, '0') }) : tr('u6.clock.min', { n: x }));
  if (m > 0) return tr('u6.clock.in', { delay: fmt(m) });
  if (m === 0) return tr('u6.clock.now');
  return tr('u6.clock.ago', { delay: fmt(-m) });
}

export function BottleClock({ childId, slots, timerId, size = 300 }: { childId: string; slots: DaySlot[]; timerId?: string | null; size?: number }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const dark = t.isDark;
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const c = size / 2;
  const R = c - 8; // lunette
  const rTrack = R - 34; // perles
  const accent = t.colors.primary;
  const goldA = dark ? '#FFE7B0' : '#C99360';
  const goldB = dark ? '#E2AE78' : '#9C6650';
  const ink = dark ? '#F6E7CF' : '#5B3526';
  const muted = dark ? 'rgba(246,231,207,0.55)' : 'rgba(91,53,38,0.55)';

  const next = slots.find((s) => s.status === 'next') ?? null;
  const lastDone = [...slots].reverse().find((s) => s.status === 'done') ?? null;
  const nowAngle = dayAngle(now);

  // aiguille : se met en place en tournant à l'ouverture, puis suit l'heure
  const hand = useRef(new Animated.Value(reduce ? nowAngle : 0)).current;
  useEffect(() => {
    Animated.timing(hand, { toValue: nowAngle, duration: reduce ? 0 : 1400, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER }).start();
  }, [hand, nowAngle, reduce]);
  // reflet qui fait le tour de la lunette + pulsation du suivant
  const gleam = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const a = Animated.loop(Animated.timing(gleam, { isInteraction: false, toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }));
    const b = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { isInteraction: false, toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.timing(pulse, { isInteraction: false, toValue: 0, duration: 0, useNativeDriver: false }),
    ]));
    a.start(); b.start();
    return () => { a.stop(); b.stop(); };
  }, [reduce, gleam, pulse]);

  // apparition des perles l'une après l'autre, comme des joyaux posés sur le cadran
  const appear = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) { appear.setValue(1); return; }
    Animated.timing(appear, { toValue: 1, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [appear, reduce]);
  const pop = (i: number, n: number, r: number) => {
    if (reduce) return r;
    const a = Math.min(0.85, (i / Math.max(1, n)) * 0.7);
    return appear.interpolate({ inputRange: [0, a, Math.min(1, a + 0.15), 1], outputRange: [0, 0, r * 1.25, r], extrapolate: 'clamp' });
  };
  const lastDrunk = lastDone?.bottle?.consumed_ml ?? lastDone?.bottle?.prepared_ml ?? null;
  const doneCount = slots.filter((s) => s.status === 'done').length;
  const ticks = useMemo(() => Array.from({ length: 96 }, (_, i) => i), []);
  const a0 = lastDone ? dayAngle(new Date(lastDone.at)) : 0;
  const total = lastDone && next ? (dayAngle(new Date(next.at)) - a0 + 360) % 360 : 0;
  const passed = Math.min(total, (nowAngle - a0 + 360) % 360);
  const elapsedArc = lastDone && next ? arcPath(c, rTrack, a0, a0 + passed) : '';
  const waitArc = lastDone && next ? arcPath(c, rTrack, a0, a0 + total) : '';
  const full = { position: 'absolute' as const, left: 0, top: 0, width: size, height: size };

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }} testID="bottle-clock" accessibilityRole="image"
      accessibilityLabel={tr('u6.clock.a11y', { count: slots.filter((s) => s.status === 'done').length }) + (next ? ' ' + tr('u6.clock.a11y_next', { time: slotClock(next.at), until: untilLabel(next.at, now) }) : '')}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="bcBezel" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFF4D6" />
            <Stop offset="0.3" stopColor="#E9BE84" />
            <Stop offset="0.55" stopColor="#A86E46" />
            <Stop offset="0.8" stopColor="#F3D4A6" />
            <Stop offset="1" stopColor="#C38A5E" />
          </LinearGradient>
          <LinearGradient id="bcArc" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={goldA} />
            <Stop offset="1" stopColor={goldB} />
          </LinearGradient>
        </Defs>
        {/* lunette dorée : double filet et dégradé */}
        <Circle cx={c} cy={c} r={R + 4} fill="none" stroke={goldB} strokeOpacity={0.5} strokeWidth={1} />
        <Circle cx={c} cy={c} r={R - 5} fill="none" stroke="url(#bcBezel)" strokeWidth={10} />
        <Circle cx={c} cy={c} r={R - 12} fill="none" stroke={goldA} strokeOpacity={0.6} strokeWidth={0.8} />
        {/* graduations : quarts d'heure, heures, repères */}
        {ticks.map((i) => {
          const a = (i / 96) * 360;
          const major = i % 24 === 0;
          const hour = i % 4 === 0;
          const r1 = R - 14;
          const r2 = r1 - (major ? 10 : hour ? 6 : 3);
          const p1 = pt(c, r1, a);
          const p2 = pt(c, r2, a);
          return <Line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={hour ? goldB : goldA} strokeOpacity={major ? 1 : hour ? 0.85 : 0.45} strokeWidth={major ? 2.2 : hour ? 1.3 : 0.8} strokeLinecap="round" />;
        })}
        {/* nuit (20 h → 7 h) et jour (7 h → 20 h) : deux arcs très doux sous les graduations */}
        <Path d={arcPath(c, R - 19, (20 / 24) * 360, (31 / 24) * 360)} stroke={dark ? '#8E7CC3' : '#7C6BA8'} strokeOpacity={dark ? 0.35 : 0.18} strokeWidth={10} fill="none" />
        <Path d={arcPath(c, R - 19, (7 / 24) * 360, (20 / 24) * 360)} stroke={goldA} strokeOpacity={dark ? 0.16 : 0.22} strokeWidth={10} fill="none" />
        {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => {
          const main = h % 6 === 0;
          const p = pt(c, R - (main ? 50 : 46), (h / 24) * 360);
          return <SvgText key={h} x={p.x} y={p.y + (main ? 4 : 3)} fontSize={main ? 12 : 9} fontWeight={main ? '700' : '500'} fill={goldB} fillOpacity={main ? 1 : 0.7} textAnchor="middle" letterSpacing={0.5}>{main ? tr('dom.time.h', { h: String(h) }) : String(h)}</SvgText>;
        })}
        {/* piste des perles */}
        <Circle cx={c} cy={c} r={rTrack} fill="none" stroke={goldA} strokeOpacity={0.18} strokeWidth={6} />
        {waitArc ? <Path d={waitArc} stroke={goldA} strokeOpacity={0.35} strokeWidth={6} strokeLinecap="round" fill="none" /> : null}
        {elapsedArc ? <Path d={elapsedArc} stroke="url(#bcArc)" strokeWidth={6} strokeLinecap="round" fill="none" /> : null}
        {/* perles */}
        {slots.map((s, i) => {
          const p = pt(c, rTrack, dayAngle(new Date(s.at)));
          if (s.status === 'next') {
            return (
              <G key={i}>
                <AnimatedCircle cx={p.x} cy={p.y} r={reduce ? 14 : pulse.interpolate({ inputRange: [0, 1], outputRange: [10, 20] })} fill={accent} fillOpacity={reduce ? 0.2 : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] })} />
                <Circle cx={p.x} cy={p.y} r={11} fill={accent} stroke={goldA} strokeWidth={2} />
                <Circle cx={p.x} cy={p.y} r={4} fill="#FFFFFF" />
              </G>
            );
          }
          if (s.status === 'done') {
            const ml = s.bottle?.consumed_ml ?? s.bottle?.prepared_ml ?? null;
            const q = pt(c, rTrack - 19, dayAngle(new Date(s.at)));
            return (
              <G key={i}>
                <AnimatedCircle cx={p.x} cy={p.y} r={pop(i, slots.length, 8)} fill="url(#bcArc)" stroke={dark ? '#FFF4D6' : '#FFFFFF'} strokeWidth={1.5} />
                {ml != null ? <SvgText x={q.x} y={q.y + 3} fontSize={9} fontWeight="700" fill={goldB} textAnchor="middle">{ml}</SvgText> : null}
              </G>
            );
          }
          if (s.status === 'missed') return <AnimatedCircle key={i} cx={p.x} cy={p.y} r={pop(i, slots.length, 7)} fill="none" stroke={t.colors.heart} strokeWidth={2} strokeDasharray="3 3" />;
          return <AnimatedCircle key={i} cx={p.x} cy={p.y} r={pop(i, slots.length, 6)} fill={dark ? '#1B1836' : '#FFFBF5'} stroke={goldB} strokeWidth={1.6} />;
        })}
      </Svg>

      {/* soleil à midi, lune à minuit (dans le cadran, sous les chiffres) */}
      {[{ h: 12, icon: 'sun' as const }, { h: 0, icon: 'moon' as const }].map(({ h, icon }) => {
        const p = pt(c, R - 66, (h / 24) * 360);
        return <View key={h} pointerEvents="none" style={{ position: 'absolute', left: p.x - 7, top: p.y - 7 }}><Icon name={icon} size={14} color={goldB} /></View>;
      })}

      {/* reflet qui tourne sur la lunette */}
      {!reduce ? (
        <Animated.View pointerEvents="none" style={[full, { transform: [{ rotate: gleam.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
          <Svg width={size} height={size}>
            <Path d={arcPath(c, R - 5, -14, 14)} stroke="#FFFBEA" strokeOpacity={0.85} strokeWidth={4} strokeLinecap="round" fill="none" />
          </Svg>
        </Animated.View>
      ) : null}

      {/* aiguille de l'heure actuelle */}
      <Animated.View pointerEvents="none" style={[full, { transform: [{ rotate: hand.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }] }]} testID="bottle-clock-hand">
        <Svg width={size} height={size}>
          <Path d={`M ${c - 3.5} ${c - 52} L ${c} ${c - rTrack + 14} L ${c + 3.5} ${c - 52} Z`} stroke={dark ? 'none' : '#6B3F2E'} strokeWidth={0.6} fill="url(#bcHand)" />
          <Defs>
            <LinearGradient id="bcHand" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={dark ? goldB : '#7A4A33'} />
              <Stop offset="0.5" stopColor={dark ? '#FFF4D6' : '#C99360'} />
              <Stop offset="1" stopColor={dark ? goldB : '#7A4A33'} />
            </LinearGradient>
          </Defs>
          <Circle cx={c} cy={c - rTrack + 14} r={3.5} fill={dark ? '#FFF4D6' : '#7A4A33'} />
        </Svg>
      </Animated.View>

      {/* centre : le prochain biberon */}
      <View pointerEvents="none" style={[full, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: size * 0.24 }]}>
        <View style={{ alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 }}>
          {next ? (
            <>
              <Text variant="caption" weight="bold" color={goldB} style={{ letterSpacing: 1.4, textTransform: 'uppercase', fontSize: 10 }}>{tr('u6.clock.next')}</Text>
              <Text weight="bold" color={ink} style={{ fontSize: 30, lineHeight: 34 }} testID="bottle-clock-next">{slotClock(next.at)}</Text>
              <Text variant="caption" color={muted}>{untilLabel(next.at, now)}{next.suggestedMl != null ? tr('u6.clock.ml', { n: next.suggestedMl }) : ''}</Text>
              {lastDone ? (
                <Text variant="caption" color={muted} numberOfLines={1} style={{ fontSize: 10, marginTop: 4 }} testID="bottle-clock-last">
                  {tr('u6.clock.last', { time: slotClock(lastDone.at) })}{lastDrunk != null ? tr('u6.clock.ml', { n: lastDrunk }) : ''}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <Icon name="droplet" size={18} color={goldB} />
              <Text variant="caption" color={muted}>{tr('u6.clock.today', { count: slots.filter((s) => s.status === 'done').length })}</Text>
            </>
          )}
        </View>
      </View>

      {/* perles touchables */}
      {slots.map((s, i) => {
        if (s.status === 'planned') return null;
        const p = pt(c, rTrack, dayAngle(new Date(s.at)));
        const label = s.status === 'done' ? tr('u6.clock.edit', { time: slotClock(s.at) }) : tr('u6.clock.note', { time: slotClock(s.at) });
        return (
          <Pressable key={i} accessibilityRole="button" accessibilityLabel={label} testID={`bottle-clock-slot-${i}`} hitSlop={6}
            onPress={() => (s.status === 'done' && s.bottle ? router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: childId, id: s.bottle.id } }) : openSlot(childId, s, timerId))}
            style={{ position: 'absolute', left: p.x - 18, top: p.y - 18, width: 36, height: 36, borderRadius: 18 }} />
        );
      })}
    </View>
  );
}
