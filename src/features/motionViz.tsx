/**
 * Visualisations vivantes du suivi de l'enfant (données réelles uniquement).
 *  - DayRibbon : la journée sur 24 h — sommeils en rubans, repas en gouttes, changes en carrés,
 *    observations en losanges ; chaque événement « tombe » à sa place, repère « maintenant » animé.
 *  - SleepNights : 7 jours de sommeil enregistré, rubans atmosphériques qui se déploient ligne par ligne ;
 *    les nuits pleines, les siestes en contour (lisible sans la couleur).
 * Formes + légende textuelle : jamais d'information portée par la couleur seule.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { MotionNumber } from '@/components/MotionKit';
import { Row, Text } from '@/components/ui';
import { formatDuration } from '@/lib/domain/dates';
import { ambientDelay, easing } from '@/theme/motion';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { NATIVE_DRIVER, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { formatList, localeTag, t as tr } from '@/i18n';

export type RibbonEvent =
  | { kind: 'sleep'; start: string; end: string | null; nap?: boolean }
  | { kind: 'feed' | 'diaper' | 'obs'; at: string };

const dayStart = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
const frac = (ms: number, base: number) => Math.max(0, Math.min(1, (ms - base) / 86400000));

function Drop({ index, children, x }: { index: number; children: React.ReactNode; x: number }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) return;
    const a = Animated.spring(v, { toValue: 1, tension: 180, friction: 14, delay: 120 + index * 55, useNativeDriver: NATIVE_DRIVER });
    a.start();
    return () => a.stop();
  }, [v, reduce, index]);
  return (
    <Animated.View style={{ position: 'absolute', left: x, opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }}>
      {children}
    </Animated.View>
  );
}

function Grow({ index, left, width, children }: { index: number; left: number; width: number; children: React.ReactNode }) {
  const full = width >= 9999;
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) return;
    const a = Animated.timing(v, { toValue: 1, duration: 650, delay: 80 + index * 70, easing: easing.decelerate, useNativeDriver: NATIVE_DRIVER });
    a.start();
    return () => a.stop();
  }, [v, reduce, index]);
  return (
    <Animated.View style={{ position: 'absolute', left, ...(full ? { right: 0 } : { width: Math.max(width, 3) }), top: 0, bottom: 0, opacity: full ? v : 1,
      transform: full ? [{ scaleX: v.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }] : [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-Math.max(width, 3) / 2, 0] }) }, { scaleX: v.interpolate({ inputRange: [0, 1], outputRange: [0.001, 1] }) }] }}>
      {children}
    </Animated.View>
  );
}

// ------------------------------------------------------------------ la journée sur 24 h
export function DayRibbon({ events, now = new Date() }: { events: RibbonEvent[]; now?: Date }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const [w, setW] = useState(0);
  const base = dayStart(now);
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { isInteraction: false, toValue: 1, duration: 1600, useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(pulse, { isInteraction: false, toValue: 0, duration: 0, useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, pulse]);
  const sleeps = events.filter((e): e is Extract<RibbonEvent, { kind: 'sleep' }> => e.kind === 'sleep');
  const points = events.filter((e): e is Extract<RibbonEvent, { at: string }> => e.kind !== 'sleep').sort((a, b) => (a.at < b.at ? -1 : 1));
  const counts = { feed: points.filter((p) => p.kind === 'feed').length, diaper: points.filter((p) => p.kind === 'diaper').length, obs: points.filter((p) => p.kind === 'obs').length };
  const sleepMin = sleeps.reduce((s, e) => s + Math.max(0, (Math.min(e.end ? Date.parse(e.end) : now.getTime(), base + 86400000) - Math.max(Date.parse(e.start), base)) / 60000), 0);
  const summary = tr('u4.mv.sumToday', { feeds: tr('u4.mv.feeds', { count: counts.feed }), diapers: tr('u4.mv.diapers', { count: counts.diaper }), sleep: formatDuration(sleepMin), obs: counts.obs ? tr('u4.mv.obsPart', { count: counts.obs }) : '' });
  const X = (ms: number) => frac(ms, base) * w;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={summary} style={{ gap: 6 }}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: 64 }}>
        {/* nuit (avant 7 h, après 20 h) : voile lavande très léger */}
        {w > 0 ? (
          <>
            <View style={{ position: 'absolute', left: 0, width: X(base + 7 * 3600000), top: 0, bottom: 0, backgroundColor: t.colors.lavender, opacity: 0.08, borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }} />
            <View style={{ position: 'absolute', left: X(base + 20 * 3600000), right: 0, top: 0, bottom: 0, backgroundColor: t.colors.lavender, opacity: 0.08, borderTopRightRadius: 10, borderBottomRightRadius: 10 }} />
            {[6, 12, 18].map((h) => <View key={h} style={{ position: 'absolute', left: X(base + h * 3600000), top: 6, bottom: 6, width: 1, backgroundColor: t.colors.border }} />)}
            {/* sommeils : rubans */}
            <View style={{ position: 'absolute', left: 0, right: 0, top: 22, height: 20 }}>
              {sleeps.map((s, i) => {
                const a = X(Math.max(Date.parse(s.start), base));
                const b = X(Math.min(s.end ? Date.parse(s.end) : now.getTime(), base + 86400000));
                return (
                  <Grow key={`s${i}`} index={i} left={a} width={b - a}>
                    <View style={{ flex: 1, borderRadius: 10, backgroundColor: s.nap ? 'transparent' : t.colors.lavender, borderWidth: 2, borderColor: t.colors.lavender, opacity: s.end ? 0.85 : 0.6 }} />
                  </Grow>
                );
              })}
            </View>
            {/* repas, changes, observations : marques qui tombent à leur heure */}
            {points.map((p, i) => {
              const x = X(Date.parse(p.at)) - 6;
              const top = p.kind === 'feed' ? 4 : p.kind === 'diaper' ? 48 : 26;
              return (
                <View key={`p${i}`} style={{ position: 'absolute', top, left: 0, right: 0, height: 12 }}>
                  <Drop index={i} x={x}>
                    {p.kind === 'feed' ? <View style={{ width: 12, height: 12, borderRadius: 6, borderTopLeftRadius: 1, transform: [{ rotate: '45deg' }], backgroundColor: t.colors.primary }} />
                      : p.kind === 'diaper' ? <View style={{ width: 11, height: 11, borderRadius: 3, backgroundColor: t.colors.accent }} />
                        : <View style={{ width: 10, height: 10, transform: [{ rotate: '45deg' }], borderWidth: 2, borderColor: t.colors.gold }} />}
                  </Drop>
                </View>
              );
            })}
            {/* maintenant */}
            <View style={{ position: 'absolute', left: X(now.getTime()) - 1, top: 0, bottom: 0, width: 2, backgroundColor: t.colors.primary, opacity: 0.7 }} />
            <Animated.View style={{ position: 'absolute', left: X(now.getTime()) - 6, top: -6, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: t.colors.primary,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.8] }) }] }} />
          </>
        ) : null}
      </View>
      <Row style={{ justifyContent: 'space-between' }}>
        {[0, 6, 12, 18, 24].map((n) => tr('l7.mv.hour', { h: String(n) })).map((h) => <Text key={h} variant="caption" muted>{h}</Text>)}
      </Row>
      <Row wrap gap={spacing.sm}>
        <Legend shape="drop" label={tr('u4.mv.lgMeals', { n: counts.feed })} />
        <Legend shape="ribbon" label={tr('u4.mv.lgSleep', { d: formatDuration(sleepMin) })} />
        <Legend shape="square" label={tr('u4.mv.lgChanges', { n: counts.diaper })} />
        {counts.obs ? <Legend shape="diamond" label={tr('u4.mv.lgObs', { n: counts.obs })} /> : null}
      </Row>
    </View>
  );
}

function Legend({ shape, label }: { shape: 'drop' | 'ribbon' | 'square' | 'diamond'; label: string }) {
  const t = useTheme();
  const mark = shape === 'drop' ? <View style={{ width: 9, height: 9, borderRadius: 5, borderTopLeftRadius: 1, transform: [{ rotate: '45deg' }], backgroundColor: t.colors.primary }} />
    : shape === 'ribbon' ? <View style={{ width: 16, height: 8, borderRadius: 4, backgroundColor: t.colors.lavender }} />
      : shape === 'square' ? <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: t.colors.accent }} />
        : <View style={{ width: 8, height: 8, transform: [{ rotate: '45deg' }], borderWidth: 2, borderColor: t.colors.gold }} />;
  return <Row gap={6} style={{ alignItems: 'center' }}>{mark}<Text variant="caption" muted>{label}</Text></Row>;
}

// ------------------------------------------------------------------ 7 jours de sommeil
export function SleepNights({ sleeps, days = 7 }: { sleeps: { started_at: string; ended_at: string | null; kind?: 'nap' | 'night' | null }[]; days?: number }) {
  const t = useTheme();
  const [w, setW] = useState(0);
  const today = dayStart();
  const rows = Array.from({ length: days }, (_, i) => today - (days - 1 - i) * 86400000);
  const label = (ms: number) => new Date(ms).toLocaleDateString(localeTag(), { weekday: 'short' }).replace('.', '');
  const totals = rows.map((b) => sleeps.reduce((s, x) => {
    const a = Math.max(Date.parse(x.started_at), b);
    const e = Math.min(x.ended_at ? Date.parse(x.ended_at) : Date.now(), b + 86400000);
    return s + Math.max(0, e - a) / 60000;
  }, 0));
  const summary = rows.map((b, i) => tr('u4.mv.dayDur', { day: label(b), dur: formatDuration(totals[i]) })).join(', ');
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={tr('u4.mv.sleepOver', { days, summary })} style={{ gap: 6 }}>
      {rows.map((b, r) => (
        <Row key={b} gap={spacing.xs} style={{ alignItems: 'center' }}>
          <Text variant="caption" muted style={{ width: 30 }}>{label(b)}</Text>
          <View style={{ flex: 1, height: 16 }} onLayout={r === 0 ? (e) => setW(e.nativeEvent.layout.width) : undefined}>
            <View style={{ position: 'absolute', left: 0, right: 0, top: 6, height: 4, borderRadius: 2, backgroundColor: t.colors.border, opacity: 0.6 }} />
            {w > 0 ? sleeps.map((x, i) => {
              const a = Math.max(Date.parse(x.started_at), b);
              const e = Math.min(x.ended_at ? Date.parse(x.ended_at) : Date.now(), b + 86400000);
              if (e <= a) return null;
              const left = ((a - b) / 86400000) * w;
              const width = ((e - a) / 86400000) * w;
              return (
                <Grow key={i} index={r} left={left} width={width}>
                  <View style={{ flex: 1, borderRadius: 8, borderWidth: 2, borderColor: t.colors.lavender, backgroundColor: x.kind === 'nap' ? 'transparent' : t.colors.lavender, opacity: 0.9 }} />
                </Grow>
              );
            }) : null}
          </View>
          <View style={{ width: 54, alignItems: 'flex-end' }}>
            <MotionNumber text={formatDuration(totals[r])} style={{ fontSize: 12, color: t.colors.textMuted }} />
          </View>
        </Row>
      ))}
      <Row style={{ paddingLeft: 38, paddingRight: 62, justifyContent: 'space-between' }}>
        {[0, 12, 24].map((n) => tr('l7.mv.hour', { h: String(n) })).map((h) => <Text key={h} variant="caption" muted>{h}</Text>)}
      </Row>
      <Row gap={spacing.sm}>
        <Row gap={6} style={{ alignItems: 'center' }}><View style={{ width: 16, height: 8, borderRadius: 4, backgroundColor: t.colors.lavender }} /><Text variant="caption" muted>{tr('u4.mv.nightOrNA')}</Text></Row>
        <Row gap={6} style={{ alignItems: 'center' }}><View style={{ width: 16, height: 8, borderRadius: 4, borderWidth: 2, borderColor: t.colors.lavender }} /><Text variant="caption" muted>{tr('u4.mv.nap')}</Text></Row>
      </Row>
    </View>
  );
}

// ------------------------------------------------------------------ relais de nuit : la frise du témoin
/**
 * Les nuits à venir, reliées comme une course de relais : chaque nuit porte le nom de la personne
 * responsable ; un témoin lumineux circule de la nuit en cours (ou la prochaine) vers la suivante.
 * Les états (confirmée, échangée) sont écrits, pas seulement colorés.
 */
export function RelayStrip({ nights, labelOf }: { nights: { id: string; user_id: string; starts_at: string; ends_at: string; status: string }[]; labelOf: (id: string) => string }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const baton = useRef(new Animated.Value(0)).current;
  const NODE = 92;
  const GAP = 18;
  const list = nights.slice(0, 7);
  useEffect(() => {
    if (reduce || list.length < 2) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(baton, { isInteraction: false, toValue: 1, duration: 1800, easing: easing.standard, useNativeDriver: NATIVE_DRIVER }),
      ambientDelay(600),
      Animated.timing(baton, { isInteraction: false, toValue: 0, duration: 0, useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, baton, list.length]);
  if (!list.length) return null;
  const nowMs = Date.now();
  const current = Math.max(0, list.findIndex((n) => Date.parse(n.ends_at) > nowMs));
  const day = (iso: string) => new Date(iso).toLocaleDateString(localeTag(), { weekday: 'short', day: 'numeric' }).replace('.', '');
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={tr('u4.mv.relay', { list: formatList(list.map((n) => `${day(n.starts_at)}, ${labelOf(n.user_id)}`)) })}>
      <View style={{ flexDirection: 'row', gap: GAP, paddingVertical: spacing.xs }}>
        {/* fil qui relie les nuits */}
        <View style={{ position: 'absolute', left: NODE / 2, width: (list.length - 1) * (NODE + GAP), top: 34, height: 2, backgroundColor: t.colors.border }} />
        {list.length > 1 ? (
          <Animated.View style={{ position: 'absolute', left: NODE / 2 + current * (NODE + GAP) - 6, top: 29, width: 12, height: 12, borderRadius: 6, backgroundColor: t.colors.primary,
            opacity: baton.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] }),
            transform: [{ translateX: baton.interpolate({ inputRange: [0, 1], outputRange: [0, current < list.length - 1 ? NODE + GAP : 0] }) }] }} />
        ) : null}
        {list.map((n, i) => {
          const isCur = i === current;
          return (
            <View key={n.id} style={{ width: NODE, alignItems: 'center', gap: 4 }}>
              <Text variant="caption" muted>{day(n.starts_at)}</Text>
              <View style={{ width: isCur ? 22 : 16, height: isCur ? 22 : 16, borderRadius: 11, borderWidth: 3, borderColor: isCur ? t.colors.primary : t.colors.lavender, backgroundColor: n.status === 'confirmed' ? t.colors.lavender : t.colors.surface }} />
              <Text variant="small" weight={isCur ? 'bold' : 'medium'}>{labelOf(n.user_id)}</Text>
              <Text variant="caption" muted>{isCur ? (Date.parse(n.starts_at) <= nowMs ? tr('u4.mv.tonight') : tr('u4.mv.next')) : n.status === 'confirmed' ? tr('u4.mv.confirmed') : n.status === 'swapped' ? tr('u4.mv.swapped') : tr('u4.mv.planned')}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ temps pour soi : piste de la journée
/**
 * De 8 h à 21 h : créneaux occupés (rayés, d'après l'agenda), créneaux libres (contour qui respire,
 * touchables pour réserver) et moments déjà réservés (pleins, qui se posent en douceur).
 */
export function DayAvailability({ day, busy, free, reserved, onPick }: {
  day: string; busy: { starts_at: string; ends_at: string }[]; free: { starts_at: string; ends_at: string }[]; reserved: { starts_at: string; ends_at: string }[];
  onPick: (slot: { starts_at: string; ends_at: string }) => void;
}) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const [w, setW] = useState(0);
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { isInteraction: false, toValue: 1, duration: 1800, useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(breathe, { isInteraction: false, toValue: 0, duration: 1800, useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, breathe]);
  const [y, m, d] = day.split('-').map(Number);
  const from = new Date(y, m - 1, d, 8).getTime();
  const to = new Date(y, m - 1, d, 21).getTime();
  const X = (iso: string) => Math.max(0, Math.min(1, (Date.parse(iso) - from) / (to - from))) * w;
  const hm = (iso: string) => new Date(iso).toLocaleTimeString(localeTag(), { hour: '2-digit', minute: '2-digit' });
  const inDay = (x: { starts_at: string; ends_at: string }) => Date.parse(x.ends_at) > from && Date.parse(x.starts_at) < to;
  busy = busy.filter(inDay); reserved = reserved.filter(inDay);
  return (
    <View style={{ gap: 6 }}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: 44, borderRadius: 12, backgroundColor: t.colors.surfaceAlt, overflow: 'hidden' }}>
        {w > 0 ? (
          <>
            {busy.map((b, i) => (
              <View key={`b${i}`} style={{ position: 'absolute', left: X(b.starts_at), width: Math.max(3, X(b.ends_at) - X(b.starts_at)), top: 0, bottom: 0, backgroundColor: t.colors.border, opacity: 0.9,
                borderLeftWidth: 1, borderRightWidth: 1, borderColor: t.colors.textMuted }} accessibilityElementsHidden />
            ))}
            {free.map((f, i) => (
              <Tappable key={`f${i}`} accessibilityRole="button" accessibilityLabel={tr('u4.mv.slotA11y', { from: hm(f.starts_at), to: hm(f.ends_at) })} onPress={() => onPick(f)}
                style={{ position: 'absolute', left: X(f.starts_at) + 2, width: Math.max(10, X(f.ends_at) - X(f.starts_at) - 4), top: 4, bottom: 4 }}>
                <Animated.View style={{ flex: 1, borderRadius: 9, borderWidth: 2, borderStyle: 'dashed', borderColor: t.colors.primary, opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }} />
              </Tappable>
            ))}
            {reserved.map((r, i) => (
              <Grow key={`r${i}`} index={i} left={X(r.starts_at)} width={X(r.ends_at) - X(r.starts_at)}>
                <View style={{ flex: 1, margin: 4, borderRadius: 9, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text variant="caption" weight="bold" color={t.colors.primaryText}>{tr('u4.mv.forMe')}</Text>
                </View>
              </Grow>
            ))}
          </>
        ) : null}
      </View>
      <Row style={{ justifyContent: 'space-between' }}>{[8, 12, 16, 21].map((n) => tr('l7.mv.hour', { h: String(n) })).map((h) => <Text key={h} variant="caption" muted>{h}</Text>)}</Row>
      <Row wrap gap={spacing.sm}>
        <Row gap={6} style={{ alignItems: 'center' }}><View style={{ width: 16, height: 10, borderRadius: 3, backgroundColor: t.colors.border, borderWidth: 1, borderColor: t.colors.textMuted }} /><Text variant="caption" muted>{tr('u4.mv.busy')}</Text></Row>
        <Row gap={6} style={{ alignItems: 'center' }}><View style={{ width: 16, height: 10, borderRadius: 3, borderWidth: 2, borderStyle: 'dashed', borderColor: t.colors.primary }} /><Text variant="caption" muted>{tr('u4.mv.free')}</Text></Row>
        <Row gap={6} style={{ alignItems: 'center' }}><View style={{ width: 16, height: 10, borderRadius: 3, backgroundColor: t.colors.primary }} /><Text variant="caption" muted>{tr('u4.mv.reserved')}</Text></Row>
      </Row>
    </View>
  );
}

// ------------------------------------------------------------------ scanner : cadre de détection
/**
 * Cadre de lecture du code-barres : quatre coins qui respirent, une ligne de lecture qui balaie.
 * `reading` : un code vient d'être lu → les coins se resserrent et la ligne s'arrête (feedback immédiat).
 */
export function ScanFrame({ reading }: { reading: boolean }) {
  const reduce = useReduceMotion();
  const sweep = useRef(new Animated.Value(0)).current;
  const lock = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce || reading) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(sweep, { isInteraction: false, toValue: 1, duration: 1600, easing: easing.standard, useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(sweep, { isInteraction: false, toValue: 0, duration: 1600, easing: easing.standard, useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, reading, sweep]);
  useEffect(() => {
    Animated.spring(lock, { toValue: reading ? 1 : 0, tension: 260, friction: 18, useNativeDriver: NATIVE_DRIVER }).start();
  }, [reading, lock]);
  const white = 'rgba(255,255,255,0.95)';
  const corner = (pos: object, rot: string) => (
    <Animated.View style={[{ position: 'absolute', width: 34, height: 34, borderTopWidth: 4, borderLeftWidth: 4, borderColor: white, borderTopLeftRadius: 12 }, pos, { transform: [{ rotate: rot }] }]} />
  );
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: '12%', right: '12%', top: '28%', bottom: '28%',
      transform: [{ scale: lock.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] }) }] }}>
      {corner({ left: 0, top: 0 }, '0deg')}
      {corner({ right: 0, top: 0 }, '90deg')}
      {corner({ right: 0, bottom: 0 }, '180deg')}
      {corner({ left: 0, bottom: 0 }, '270deg')}
      {!reading ? (
        <Animated.View style={{ position: 'absolute', left: 10, right: 10, height: 2, borderRadius: 1, backgroundColor: white, opacity: 0.85,
          top: 0, transform: [{ translateY: sweep.interpolate({ inputRange: [0, 1], outputRange: [8, 110] }) }] }} />
      ) : null}
    </Animated.View>
  );
}

// ------------------------------------------------------------------ charge du jour (sans score)
/** Les tâches du jour en trois parts : faites, attribuées, sans responsable. Des comptes, jamais une note. */
export function LoadBar({ done, assigned, unassigned }: { done: number; assigned: number; unassigned: number }) {
  const t = useTheme();
  const total = done + assigned + unassigned;
  if (!total) return null;
  const parts = [
    { n: done, color: t.colors.success, label: tr('u4.mv.done', { count: done }), style: {} },
    { n: assigned, color: t.colors.primary, label: tr('u4.mv.assigned', { count: assigned }), style: {} },
    { n: unassigned, color: 'transparent', label: tr('u4.mv.unassigned'), style: { borderWidth: 2, borderStyle: 'dashed' as const, borderColor: t.colors.textMuted } },
  ].filter((p) => p.n > 0);
  return (
    <View accessible accessibilityLabel={tr('u4.mv.loadA11y', { done, assigned, unassigned })} style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', height: 14, gap: 3 }}>
        {parts.map((p, i) => (
          <View key={p.label} style={{ flex: p.n, height: 14 }}>
            <Grow index={i} left={0} width={9999}>
              <View style={[{ flex: 1, borderRadius: 7, backgroundColor: p.color }, p.style]} />
            </Grow>
          </View>
        ))}
      </View>
      <Row wrap gap={spacing.sm}>{parts.map((p) => <Text key={p.label} variant="caption" muted>{p.n} {p.label}</Text>)}</Row>
    </View>
  );
}
