/**
 * Calendrier principal du cycle : sombre, glissement d'un mois à l'autre, utilisable d'une main.
 * Code visuel : aujourd'hui entouré ; règles notées en terracotta ; règles estimées en rose clair (pointillés) ;
 * fenêtre fertile estimée en lavande ; ovulation estimée par un symbole discret ; petits indicateurs (symptômes,
 * rapport — masquable —, contraception prise). Toucher un jour ouvre sa fiche ; mode sélection pour les règles.
 */
import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { haptic, Icon, Text } from '@/components/ui';
import { calendarMonth, type CalendarCell, type CalendarData } from '@/lib/domain/cycleDaily';
import type { CycleEstimate } from '@/lib/domain/cycle';
import { formatDate, t as tr } from '@/i18n';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { CAL } from './ui';

export function CycleCalendar({ data, est, today, showIntimacy, onDayPress, selecting, selected, onToggle, testID = 'cycle-calendar' }: {
  data: CalendarData; est: CycleEstimate; today: string; showIntimacy: boolean;
  onDayPress: (iso: string) => void; selecting?: boolean; selected?: Set<string>; onToggle?: (iso: string) => void; testID?: string;
}) {
  const reduce = useReduceMotion();
  const [offset, setOffset] = useState(0);
  const base = new Date(`${today}T12:00:00`);
  const ym = { y: new Date(base.getFullYear(), base.getMonth() + offset, 1).getFullYear(), m: new Date(base.getFullYear(), base.getMonth() + offset, 1).getMonth() };
  const cells = useMemo(() => calendarMonth(ym.y, ym.m, data, est, today, { showIntimacy }), [ym.y, ym.m, data, est, today, showIntimacy]);
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const offsetRef = useRef(0);
  offsetRef.current = offset;

  const go = (d: number) => {
    haptic('selection');
    setOffset((o) => o + d);
    if (reduce) return;
    slide.setValue(d * 28); fade.setValue(0.4);
    Animated.parallel([
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 4 }),
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  };
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderRelease: (_e, g) => { if (g.dx < -40) go(1); else if (g.dx > 40) go(-1); },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const monthLabel = formatDate(`${ym.y}-${String(ym.m + 1).padStart(2, '0')}-15T12:00:00`, { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase());
  const weekdays = tr('c3.cal.weekdays').split(',');
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  return (
    <View testID={testID} style={{ borderRadius: 28, overflow: 'hidden' }}>
      <LinearGradient colors={[CAL.bg2, CAL.bg]} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={{ padding: spacing.md, gap: spacing.xs }}>
        {/* En-tête : mois, précédent / suivant, retour à aujourd'hui */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <NavBtn icon="chevron-left" label={tr('c3.cal.prev')} onPress={() => go(-1)} testID="c3-prev" />
          <Text variant="heading" color={CAL.text} style={{ flex: 1, textAlign: 'center' }} accessibilityRole="header" testID="c3-month">{monthLabel}</Text>
          <NavBtn icon="chevron-right" label={tr('c3.cal.next')} onPress={() => go(1)} testID="c3-next" />
        </View>
        {offset !== 0 ? (
          <Pressable accessibilityRole="button" onPress={() => { haptic('selection'); setOffset(0); }} style={{ alignSelf: 'center', paddingHorizontal: 12, minHeight: 32, justifyContent: 'center', borderRadius: 10, backgroundColor: CAL.line }}>
            <Text variant="caption" weight="bold" color={CAL.soft}>{tr('c3.cal.today')}</Text>
          </Pressable>
        ) : null}
        <Animated.View {...swipe.panHandlers} style={{ transform: [{ translateX: slide }], opacity: fade, gap: 2 }}>
          <View style={{ flexDirection: 'row' }}>
            {weekdays.map((w, i) => <View key={i} style={{ flex: 1, alignItems: 'center' }}><Text variant="caption" color={CAL.muted}>{w}</Text></View>)}
          </View>
          {weeks.map((week, w) => (
            <View key={w} style={{ flexDirection: 'row' }}>
              {week.map((c, i) => <Day key={c.iso ?? `e${w}-${i}`} cell={c} selecting={!!selecting} selected={!!c.iso && !!selected?.has(c.iso)}
                onPress={() => c.iso && (selecting ? onToggle?.(c.iso) : onDayPress(c.iso))} />)}
            </View>
          ))}
        </Animated.View>
        <Legend showIntimacy={showIntimacy} />
      </LinearGradient>
    </View>
  );
}

function NavBtn({ icon, label, onPress, testID }: { icon: 'chevron-left' | 'chevron-right'; label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} testID={testID} hitSlop={6}
      style={({ pressed }) => ({ width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? CAL.line : 'transparent' })}>
      <Icon name={icon} color={CAL.text} />
    </Pressable>
  );
}

function dayLabel(c: CalendarCell) {
  const parts = [formatDate(`${c.iso}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' })];
  if (c.today) parts.push(tr('c3.cal.today'));
  if (c.period === 'logged') parts.push(tr('c3.cal.lgLogged'));
  if (c.period === 'predicted') parts.push(tr('c3.cal.lgPredicted'));
  if (c.fertile) parts.push(tr('c3.cal.lgFertile'));
  if (c.ovulation) parts.push(tr('c3.cal.lgOvulation'));
  if (c.symptoms) parts.push(tr('c3.cal.lgSymptoms'));
  if (c.intimacy) parts.push(tr('c3.cal.lgIntimacy'));
  if (c.contraception) parts.push(tr('c3.cal.lgContraception'));
  return parts.join(', ');
}

function Day({ cell: c, selecting, selected, onPress }: { cell: CalendarCell; selecting: boolean; selected: boolean; onPress: () => void }) {
  if (!c.iso) return <View style={{ flex: 1, height: 50 }} />;
  const logged = c.period === 'logged';
  const predicted = c.period === 'predicted';
  const bg = selected ? CAL.selected : logged ? CAL.period : predicted ? CAL.predicted : c.fertile ? CAL.fertile : 'transparent';
  const fg = selected || logged ? CAL.periodText : predicted ? CAL.predictedText : c.fertile ? CAL.fertileText : CAL.text;
  return (
    <Pressable onPress={onPress} accessibilityRole={selecting ? 'checkbox' : 'button'} accessibilityState={selecting ? { checked: selected } : undefined}
      aria-checked={selecting ? selected : undefined} accessibilityLabel={dayLabel(c)} testID={`c3-day-${c.iso}`} style={{ flex: 1, height: 50, alignItems: 'center', justifyContent: 'center' }}>
      {({ pressed }) => (
        <View style={{ alignItems: 'center', transform: [{ scale: pressed ? 0.9 : 1 }] }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: bg,
            borderWidth: c.today ? 2 : predicted ? 1.4 : 0, borderColor: c.today ? CAL.today : CAL.predictedBorder, borderStyle: predicted && !c.today ? 'dashed' : 'solid' }}>
            <Text weight={c.today || logged ? 'bold' : 'medium'} color={fg}>{c.day}</Text>
            {c.ovulation ? <View style={{ position: 'absolute', top: -3, right: -3 }}><Icon name="sun" size={11} color={CAL.ovulation} /></View> : null}
            {selected ? <View style={{ position: 'absolute', bottom: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: CAL.today, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={11} color={CAL.selected} /></View> : null}
          </View>
          <View style={{ flexDirection: 'row', gap: 2, height: 8, marginTop: 2, alignItems: 'center' }}>
            {Array.from({ length: c.symptoms }, (_, k) => <View key={k} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: CAL.symptom }} />)}
            {c.intimacy ? <Icon name="heart" size={8} color={CAL.intimacy} /> : null}
            {c.contraception ? <Icon name="check" size={8} color={CAL.contraception} /> : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}

function Legend({ showIntimacy }: { showIntimacy: boolean }) {
  const item = (swatch: React.ReactNode, label: string) => (
    <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>{swatch}<Text variant="caption" color={CAL.soft}>{label}</Text></View>
  );
  const dot = (bg: string, border?: string, dashed?: boolean) => <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: bg, borderWidth: border ? 1.2 : 0, borderColor: border, borderStyle: dashed ? 'dashed' : 'solid' }} />;
  return (
    <View testID="c3-legend" accessibilityLabel={tr('c3.cal.legend')} style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.sm, rowGap: 4, marginTop: 4 }}>
      {item(dot(CAL.period), tr('c3.cal.lgLogged'))}
      {item(dot(CAL.predicted, CAL.predictedBorder, true), tr('c3.cal.lgPredicted'))}
      {item(dot(CAL.fertile), tr('c3.cal.lgFertile'))}
      {item(<Icon name="sun" size={11} color={CAL.ovulation} />, tr('c3.cal.lgOvulation'))}
      {item(<View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: CAL.symptom }} />, tr('c3.cal.lgSymptoms'))}
      {showIntimacy ? item(<Icon name="heart" size={9} color={CAL.intimacy} />, tr('c3.cal.lgIntimacy')) : null}
      {item(<Icon name="check" size={9} color={CAL.contraception} />, tr('c3.cal.lgContraception'))}
    </View>
  );
}
