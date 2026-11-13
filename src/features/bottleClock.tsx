/**
 * Cadran « journée biberons » (v3) : une horloge de 24 h aux couleurs de la palette affichée (aucune couleur en dur).
 * - lunette fine (dégradé des lueurs de la palette), graduations, repères 0 h / 6 h / 12 h / 18 h, soleil et lune ;
 * - perles : biberons donnés (pleines), suivant (perle de l'accent cerclée), prévus (creuses), à remplir (pointillés) ;
 * - arc du dernier biberon au suivant : la partie déjà écoulée est pleine, le reste plus pâle ;
 * - aiguille de l'heure actuelle : elle se met en place une fois à l'ouverture (famille « scène », 400 ms) ;
 * - au centre : le prochain biberon, en grand (chiffres tabulaires), et dans combien de temps.
 * Aucune boucle décorative (un chronomètre partage l'écran, MOTION_SYSTEM.md § Principes 5). Chaque perle se touche :
 * remplir / noter / modifier. Réduire les animations : aiguille posée directement.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { router } from 'expo-router';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { Icon, Text } from '@/components/ui';
import { slotClock, type DaySlot } from '@/lib/domain/bottleDayPlan';
import { useMotion } from '@/motion/useMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { openSlot } from './bottleDay';
import { t as tr } from '@/i18n';

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
  const m = useMotion();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const c = size / 2;
  const R = c - 8; // lunette
  const rTrack = R - Math.max(26, size * 0.11); // perles
  const accent = t.colors.primary;
  // filets et perles : lueur de l'accent 2 ; chiffres et repères : encre de l'accent 2 (contraste testé ≥ 4,5:1)
  const lineA = t.tokens.accent.glow[1];
  const ink2 = t.tokens.accent.accent2;
  const ink = t.colors.text;
  const muted = t.colors.textMuted;
  // petit cadran (écran de 320 px) : ni soleil ni lune, ni rappel du dernier biberon au centre (rien ne se chevauche)
  const small = size < 280;

  const next = slots.find((s) => s.status === 'next') ?? null;
  const lastDone = [...slots].reverse().find((s) => s.status === 'done') ?? null;
  const nowAngle = dayAngle(now);

  // aiguille : se met en place une fois à l'ouverture, puis suit l'heure (sans animation)
  const hand = useSharedValue(m.off ? nowAngle : 0);
  const placed = useRef(false);
  useEffect(() => {
    hand.value = placed.current || m.off ? nowAngle : m.timing(nowAngle, 400, 'decelerate');
    placed.current = true;
  }, [nowAngle]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cancelAnimation(hand), [hand]);
  const handStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${hand.value}deg` }] }));

  const lastDrunk = lastDone?.bottle?.consumed_ml ?? lastDone?.bottle?.prepared_ml ?? null;
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
            <Stop offset="0" stopColor={t.tokens.accent.glow[0]} />
            <Stop offset="1" stopColor={t.tokens.accent.glow[1]} />
          </LinearGradient>
          <LinearGradient id="bcArc" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={lineA} />
            <Stop offset="1" stopColor={ink2} />
          </LinearGradient>
        </Defs>
        {/* lunette : filet fin + anneau au dégradé de la palette */}
        <Circle cx={c} cy={c} r={R + 4} fill="none" stroke={ink2} strokeOpacity={0.35} strokeWidth={1} />
        <Circle cx={c} cy={c} r={R - 3} fill="none" stroke="url(#bcBezel)" strokeOpacity={0.55} strokeWidth={6} />
        {/* graduations : quarts d'heure, heures, repères */}
        {ticks.map((i) => {
          const a = (i / 96) * 360;
          const major = i % 24 === 0;
          const hour = i % 4 === 0;
          const r1 = R - 10;
          const r2 = r1 - (major ? 9 : hour ? 5 : 2.5);
          const p1 = pt(c, r1, a);
          const p2 = pt(c, r2, a);
          return <Line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={hour ? ink2 : muted} strokeOpacity={major ? 1 : hour ? 0.8 : 0.35} strokeWidth={major ? 2 : hour ? 1.2 : 0.8} strokeLinecap="round" />;
        })}
        {/* nuit (20 h → 7 h) et jour (7 h → 20 h) : deux arcs très doux sous les graduations */}
        <Path d={arcPath(c, R - 15, (20 / 24) * 360, (31 / 24) * 360)} stroke={t.tokens.accent.glow[0]} strokeOpacity={t.isDark ? 0.16 : 0.12} strokeWidth={8} fill="none" />
        <Path d={arcPath(c, R - 15, (7 / 24) * 360, (20 / 24) * 360)} stroke={lineA} strokeOpacity={t.isDark ? 0.14 : 0.2} strokeWidth={8} fill="none" />
        {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => {
          if (small && h % 6 !== 0) return null;
          const main = h % 6 === 0;
          const p = pt(c, R - (main ? 40 : 37), (h / 24) * 360);
          return <SvgText key={h} x={p.x} y={p.y + (main ? 4 : 3)} fontSize={main ? 11 : 9} fontFamily={main ? fonts.bodyBold : fonts.bodyMedium} fill={ink2} fillOpacity={main ? 1 : 0.75} textAnchor="middle" letterSpacing={0.4}>{main ? tr('dom.time.h', { h: String(h) }) : String(h)}</SvgText>;
        })}
        {/* piste des perles */}
        <Circle cx={c} cy={c} r={rTrack} fill="none" stroke={t.material.lines.track} strokeOpacity={0.5} strokeWidth={5} />
        {waitArc ? <Path d={waitArc} stroke={lineA} strokeOpacity={0.35} strokeWidth={5} strokeLinecap="round" fill="none" /> : null}
        {elapsedArc ? <Path d={elapsedArc} stroke="url(#bcArc)" strokeWidth={5} strokeLinecap="round" fill="none" /> : null}
        {/* perles (aucune ne clignote) */}
        {slots.map((s, i) => {
          const p = pt(c, rTrack, dayAngle(new Date(s.at)));
          if (s.status === 'next') {
            return (
              <G key={i}>
                <Circle cx={p.x} cy={p.y} r={15} fill={accent} fillOpacity={0.18} />
                <Circle cx={p.x} cy={p.y} r={10} fill={accent} stroke={t.colors.surface} strokeWidth={2} />
                <Circle cx={p.x} cy={p.y} r={3.5} fill={t.colors.primaryText} />
              </G>
            );
          }
          if (s.status === 'done') {
            const ml = s.bottle?.consumed_ml ?? s.bottle?.prepared_ml ?? null;
            const q = pt(c, rTrack - 17, dayAngle(new Date(s.at)));
            return (
              <G key={i}>
                <Circle cx={p.x} cy={p.y} r={7.5} fill="url(#bcArc)" stroke={t.colors.surface} strokeWidth={1.5} />
                {ml != null && !small ? <SvgText x={q.x} y={q.y + 3} fontSize={9} fontFamily={fonts.bodyBold} fill={ink2} textAnchor="middle">{ml}</SvgText> : null}
              </G>
            );
          }
          if (s.status === 'missed') return <Circle key={i} cx={p.x} cy={p.y} r={7} fill="none" stroke={t.tokens.status.danger} strokeWidth={2} strokeDasharray="3 3" />;
          return <Circle key={i} cx={p.x} cy={p.y} r={5.5} fill={t.colors.surface} stroke={ink2} strokeWidth={1.5} />;
        })}
      </Svg>

      {/* soleil à midi, lune à minuit (dans le cadran, sous les chiffres) */}
      {small ? null : [{ h: 12, icon: 'sun' as const }, { h: 0, icon: 'moon' as const }].map(({ h, icon }) => {
        const p = pt(c, R - 56, (h / 24) * 360);
        return <View key={h} pointerEvents="none" style={{ position: 'absolute', left: p.x - 7, top: p.y - 7 }}><Icon name={icon} size={14} color={ink2} /></View>;
      })}

      {/* aiguille de l'heure actuelle */}
      <Animated.View pointerEvents="none" style={[full, handStyle]} testID="bottle-clock-hand">
        <Svg width={size} height={size}>
          <Path d={`M ${c - 3} ${c - size * 0.2} L ${c} ${c - rTrack + 12} L ${c + 3} ${c - size * 0.2} Z`} fill={ink} fillOpacity={0.85} />
          <Circle cx={c} cy={c - rTrack + 12} r={3.5} fill={accent} />
        </Svg>
      </Animated.View>

      {/* centre : le prochain biberon */}
      <View pointerEvents="none" style={[full, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: size * (small ? 0.2 : 0.24) }]}>
        <View style={{ alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6 }}>
          {next ? (
            <>
              <Text variant="caption" weight="bold" color={ink2} numberOfLines={1} center style={{ letterSpacing: 1, textTransform: 'uppercase', fontSize: 10 }}>{tr('u6.clock.next')}</Text>
              <RNText maxFontSizeMultiplier={1.2} style={{ color: ink, fontFamily: fonts.displayItalic, fontSize: small ? 26 : 30, lineHeight: small ? 30 : 34, fontVariant: ['tabular-nums'] }} testID="bottle-clock-next">{slotClock(next.at)}</RNText>
              <Text variant="caption" color={muted} center>{untilLabel(next.at, now)}{next.suggestedMl != null ? tr('u6.clock.ml', { n: next.suggestedMl }) : ''}</Text>
              {lastDone && !small ? (
                <Text variant="caption" color={muted} numberOfLines={1} style={{ fontSize: 10, marginTop: 4 }} testID="bottle-clock-last">
                  {tr('u6.clock.last', { time: slotClock(lastDone.at) })}{lastDrunk != null ? tr('u6.clock.ml', { n: lastDrunk }) : ''}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <Icon name="droplet" size={18} color={ink2} />
              <Text variant="caption" color={muted} center>{tr('u6.clock.today', { count: slots.filter((s) => s.status === 'done').length })}</Text>
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
