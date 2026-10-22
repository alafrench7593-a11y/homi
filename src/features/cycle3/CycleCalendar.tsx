/**
 * Calendrier principal du cycle — verre dépoli intégré au fond immersif, jour comme nuit.
 *  · Surface : flou d'arrière-plan (iOS, web), voile translucide, lavis rose poudré → terracotta → lavande,
 *    reflets lumineux discrets, coins très arrondis, ombre douce teintée.
 *  · Code visuel : aujourd'hui entouré d'un anneau lumineux ; règles notées en terracotta (dégradé) ; règles estimées
 *    en rose poudré (pointillés) ; fenêtre fertile estimée en lavande ; ovulation estimée par une petite étoile ;
 *    petites icônes : symptômes, rapport (masquable), contraception prise, rappel prévu.
 *  · Changement de mois : le mois sort du côté du geste et le suivant entre de l'autre (glissement + fondu).
 *    « Réduire les animations » : changement immédiat.
 * Les fonctions sont inchangées : toucher un jour ouvre sa fiche ; mode sélection pour les règles ; glisser ou flèches.
 */
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { haptic, Icon, Text } from '@/components/ui';
import { calendarMonth, type CalendarCell, type CalendarData } from '@/lib/domain/cycleDaily';
import type { CycleEstimate } from '@/lib/domain/cycle';
import { formatDate, t as tr } from '@/i18n';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, NATIVE_DRIVER, spacing } from '@/theme/tokens';
import { useCalPalette, type CalPalette } from './ui';

const BLUR_OK = Platform.OS === 'ios' || Platform.OS === 'web';
const RADIUS = 32;

export function CycleCalendar({ data, est, today, showIntimacy, onDayPress, selecting, selected, onToggle, reminderDays, testID = 'cycle-calendar' }: {
  data: CalendarData; est: CycleEstimate; today: string; showIntimacy: boolean;
  onDayPress: (iso: string) => void; selecting?: boolean; selected?: Set<string>; onToggle?: (iso: string) => void;
  /** Jours où un rappel est prévu (petite cloche). */
  reminderDays?: Set<string>;
  testID?: string;
}) {
  const t = useTheme();
  const P = useCalPalette();
  const reduce = useReduceMotion();
  const [offset, setOffset] = useState(0);
  const base = new Date(`${today}T12:00:00`);
  const first = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const ym = { y: first.getFullYear(), m: first.getMonth() };
  const cells = useMemo(() => calendarMonth(ym.y, ym.m, data, est, today, { showIntimacy }), [ym.y, ym.m, data, est, today, showIntimacy]);
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const moving = useRef(false);

  /** Le mois sort du côté du geste, le suivant entre de l'autre côté (≈ 120 ms + ressort doux). */
  const go = (d: number) => {
    haptic('selection');
    if (reduce) { setOffset((o) => o + d); return; }
    if (moving.current) return;
    moving.current = true;
    Animated.parallel([
      Animated.timing(slide, { toValue: -d * 36, duration: 120, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: NATIVE_DRIVER }),
    ]).start(() => {
      setOffset((o) => o + d);
      slide.setValue(d * 36);
      Animated.parallel([
        Animated.spring(slide, { toValue: 0, useNativeDriver: NATIVE_DRIVER, tension: 170, friction: 22 }),
        Animated.timing(fade, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
      ]).start(() => { moving.current = false; });
    });
  };
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderRelease: (_e, g) => { if (g.dx < -40) go(1); else if (g.dx > 40) go(-1); },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const monthLabel = formatDate(`${ym.y}-${String(ym.m + 1).padStart(2, '0')}-15T12:00:00`, { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase());
  const weekdays = tr('c3.cal.weekdays').split(',');
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  return (
    // Ombre douce teintée à l'extérieur (le contenu est découpé à l'intérieur)
    <View testID={testID} style={{ borderRadius: RADIUS, shadowColor: P.shadow, shadowOpacity: t.isDark ? 0.45 : 0.18, shadowRadius: 26, shadowOffset: { width: 0, height: 12 }, elevation: 3 }}>
      <View style={{ borderRadius: RADIUS, overflow: 'hidden', borderWidth: 1, borderColor: P.border }}>
        {/* Verre dépoli : flou du fond immersif puis voile translucide */}
        {BLUR_OK ? <BlurView intensity={t.isDark ? 30 : 40} tint={t.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} pointerEvents="none" /> : null}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: P.glass }]} />
        {/* Lavis rose poudré → terracotta → lavande */}
        <LinearGradient pointerEvents="none" colors={P.wash} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        {/* Halos lumineux diffus */}
        <Halo color={P.haloA} size={260} style={{ top: -150, right: -90 }} />
        <Halo color={P.haloB} size={220} style={{ bottom: -130, left: -80 }} />
        {/* Reflet : la lumière vient d'en haut à gauche, liseré lumineux en haut */}
        <LinearGradient pointerEvents="none" colors={[P.sheen, 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.55, y: 0.45 }} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: RADIUS, right: RADIUS, height: 1, backgroundColor: P.rim }} />

        <View style={{ padding: spacing.md, paddingTop: spacing.sm, gap: spacing.xs }}>
          {/* En-tête : mois, précédent / suivant, retour à aujourd'hui */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <NavBtn P={P} icon="chevron-left" label={tr('c3.cal.prev')} onPress={() => go(-1)} testID="c3-prev" />
            <Animated.View style={{ flex: 1, opacity: fade }}>
              <Text variant="heading" color={P.text} style={{ textAlign: 'center', letterSpacing: -0.3 }} accessibilityRole="header" testID="c3-month">{monthLabel}</Text>
            </Animated.View>
            <NavBtn P={P} icon="chevron-right" label={tr('c3.cal.next')} onPress={() => go(1)} testID="c3-next" />
          </View>
          {offset !== 0 ? (
            <Pressable accessibilityRole="button" onPress={() => { haptic('selection'); setOffset(0); }}
              style={({ pressed }) => ({ alignSelf: 'center', paddingHorizontal: 14, minHeight: 32, justifyContent: 'center', borderRadius: 12, backgroundColor: P.chip, borderWidth: 1, borderColor: P.border, opacity: pressed ? 0.8 : 1 })}>
              <Text variant="caption" weight="bold" color={P.soft}>{tr('c3.cal.today')}</Text>
            </Pressable>
          ) : null}
          <Animated.View {...swipe.panHandlers} style={{ transform: [{ translateX: slide }], opacity: fade, gap: 2 }}>
            <View style={{ flexDirection: 'row', marginBottom: 2 }}>
              {weekdays.map((w, i) => <View key={i} style={{ flex: 1, alignItems: 'center' }}><Text variant="caption" weight="bold" color={P.muted} style={{ letterSpacing: 0.6 }}>{w}</Text></View>)}
            </View>
            {weeks.map((week, w) => (
              <View key={w} style={{ flexDirection: 'row' }}>
                {week.map((c, i) => <Day key={c.iso ?? `e${w}-${i}`} P={P} cell={c} reminder={!!c.iso && !!reminderDays?.has(c.iso)} selecting={!!selecting} selected={!!c.iso && !!selected?.has(c.iso)}
                  onPress={() => c.iso && (selecting ? onToggle?.(c.iso) : onDayPress(c.iso))} />)}
              </View>
            ))}
          </Animated.View>
          <View style={{ height: 1, backgroundColor: P.line, marginVertical: 2 }} />
          <Legend P={P} showIntimacy={showIntimacy} showReminder={!!reminderDays?.size} />
        </View>
      </View>
    </View>
  );
}

/** Halo diffus : dégradé radial (react-native-svg), du centre coloré vers la transparence, sans bord visible. */
function Halo({ color, size, style }: { color: string; size: number; style: object }) {
  const id = React.useId().replace(/:/g, '');
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={1} />
            <Stop offset="0.55" stopColor={color} stopOpacity={0.45} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

function NavBtn({ P, icon, label, onPress, testID }: { P: CalPalette; icon: 'chevron-left' | 'chevron-right'; label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} testID={testID} hitSlop={4}
      style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
      {({ pressed }) => (
        <View style={{ width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: P.chip, borderWidth: 1, borderColor: P.border, transform: [{ scale: pressed ? 0.94 : 1 }] }}>
          <Icon name={icon} size={19} color={P.text} />
        </View>
      )}
    </Pressable>
  );
}

function dayLabel(c: CalendarCell, reminder: boolean) {
  const parts = [formatDate(`${c.iso}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' })];
  if (c.today) parts.push(tr('c3.cal.today'));
  if (c.period === 'logged') parts.push(tr('c3.cal.lgLogged'));
  if (c.period === 'predicted') parts.push(tr('c3.cal.lgPredicted'));
  if (c.fertile) parts.push(tr('c3.cal.lgFertile'));
  if (c.ovulation) parts.push(tr('c3.cal.lgOvulation'));
  if (c.symptoms) parts.push(tr('c3.cal.lgSymptoms'));
  if (c.intimacy) parts.push(tr('c3.cal.lgIntimacy'));
  if (c.contraception) parts.push(tr('c3.cal.lgContraception'));
  if (reminder) parts.push(tr('c3.cal.lgReminder'));
  return parts.join(', ');
}

const D = 36;

function Day({ P, cell: c, selecting, selected, reminder, onPress }: { P: CalPalette; cell: CalendarCell; selecting: boolean; selected: boolean; reminder: boolean; onPress: () => void }) {
  if (!c.iso) return <View style={{ flex: 1, height: 52 }} />;
  const logged = c.period === 'logged';
  const predicted = c.period === 'predicted';
  const solid = selected || logged;
  const fg = solid ? P.periodText : predicted ? P.predictedText : c.fertile ? P.fertileText : P.text;
  return (
    <Pressable onPress={onPress} accessibilityRole={selecting ? 'checkbox' : 'button'} accessibilityState={selecting ? { checked: selected } : undefined}
      aria-checked={selecting ? selected : undefined} accessibilityLabel={dayLabel(c, reminder)} testID={`c3-day-${c.iso}`} style={{ flex: 1, height: 52, alignItems: 'center', justifyContent: 'center' }}>
      {({ pressed }) => (
        <View style={{ alignItems: 'center', transform: [{ scale: pressed ? 0.9 : 1 }] }}>
          {/* Anneau lumineux autour d'aujourd'hui (halo + liseré dégradé) */}
          {c.today ? (
            <>
              <View pointerEvents="none" style={{ position: 'absolute', top: -4, width: D + 8, height: D + 8, borderRadius: (D + 8) / 2, backgroundColor: P.todayGlow, shadowColor: P.todayShadow, shadowOpacity: 0.7, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }} />
              <LinearGradient pointerEvents="none" colors={P.todayRing} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: -2.5, width: D + 5, height: D + 5, borderRadius: (D + 5) / 2 }} />
              <View pointerEvents="none" style={{ position: 'absolute', top: -0.5, width: D + 1, height: D + 1, borderRadius: (D + 1) / 2, backgroundColor: P.todayInner }} />
            </>
          ) : null}
          <View style={{ width: D, height: D, borderRadius: D / 2, alignItems: 'center', justifyContent: 'center', overflow: solid ? 'hidden' : 'visible',
            backgroundColor: solid ? undefined : predicted ? P.predicted : c.fertile ? P.fertile : 'transparent',
            borderWidth: predicted && !c.today ? 1.3 : 0, borderColor: P.predictedBorder, borderStyle: 'dashed' }}>
            {solid ? <LinearGradient pointerEvents="none" colors={P.period} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
            <Text weight={c.today || logged ? 'bold' : 'medium'} color={fg}>{c.day}</Text>
            {selected ? <View style={{ position: 'absolute', bottom: -1, right: -1, width: 15, height: 15, borderRadius: 8, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={10} color={P.period[1]} /></View> : null}
          </View>
          {c.ovulation ? <View style={{ position: 'absolute', top: -4, right: -5 }}><Icon name="star" size={10} color={P.ovulation} /></View> : null}
          {/* Petites icônes discrètes */}
          <View style={{ flexDirection: 'row', gap: 2, height: 9, marginTop: 3, alignItems: 'center' }}>
            {Array.from({ length: c.symptoms }, (_, k) => <View key={k} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: P.symptom }} />)}
            {c.intimacy ? <Icon name="heart" size={8} color={P.intimacy} /> : null}
            {c.contraception ? <Icon name="check" size={8} color={P.contraception} /> : null}
            {reminder ? <Icon name="bell" size={8} color={P.reminder} /> : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}

function Legend({ P, showIntimacy, showReminder }: { P: CalPalette; showIntimacy: boolean; showReminder: boolean }) {
  const item = (swatch: React.ReactNode, label: string) => (
    <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>{swatch}<Text variant="caption" color={P.soft}>{label}</Text></View>
  );
  const dot = (fill: string, border?: string) => <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: fill, borderWidth: border ? 1.2 : 0, borderColor: border, borderStyle: 'dashed' }} />;
  return (
    <View testID="c3-legend" accessibilityLabel={tr('c3.cal.legend')} style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.sm, rowGap: 5 }}>
      {item(<LinearGradient colors={P.period} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 12, height: 12, borderRadius: 6 }} />, tr('c3.cal.lgLogged'))}
      {item(dot(P.predicted, P.predictedBorder), tr('c3.cal.lgPredicted'))}
      {item(dot(P.fertile), tr('c3.cal.lgFertile'))}
      {item(<Icon name="star" size={11} color={P.ovulation} />, tr('c3.cal.lgOvulation'))}
      {item(<View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: P.symptom }} />, tr('c3.cal.lgSymptoms'))}
      {showIntimacy ? item(<Icon name="heart" size={9} color={P.intimacy} />, tr('c3.cal.lgIntimacy')) : null}
      {item(<Icon name="check" size={9} color={P.contraception} />, tr('c3.cal.lgContraception'))}
      {showReminder ? item(<Icon name="bell" size={9} color={P.reminder} />, tr('c3.cal.lgReminder')) : null}
    </View>
  );
}
