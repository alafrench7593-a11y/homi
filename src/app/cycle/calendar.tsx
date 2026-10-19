/**
 * Calendrier du cycle : vue mensuelle navigable, règles ENREGISTRÉES (pleines) distinctes des règles ESTIMÉES (pointillés),
 * fenêtre fertile estimée, symptômes, pertes, saignements, tests, journal, rendez-vous. Détail du jour + raccourcis de saisie.
 * Chaque information a une forme ET une couleur (jamais la couleur seule) et une description pour les lecteurs d'écran.
 */
import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button, haptic, IconButton, Row } from '@/components/ui';
import { Sheet } from '@/components/Overlays';
import { useAppointments, usePeriods, useTests } from '@/lib/data/hooks';
import { useAllSymptomLogs, useBleedingLogs, useCycleJournal, useDischargeLogs } from '@/lib/data/hooks-cycle2';
import { todayISO } from '@/lib/domain/dates';
import { monthCells, symptomKeysOf, type DayCell } from '@/lib/domain/cycleV2';
import { Glass, Ink, LegendDot, useCyclePalette } from '@/features/cycle/kit';
import { fmtDay } from '@/features/cycle/format';
import { formatDate, t as tr } from '@/i18n';
import { springTo } from '@/theme/motion';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function CycleCalendar() {
  const c = useCyclePalette();
  const reduce = useReduceMotion();
  const today = todayISO();
  const [ym, setYm] = useState(() => ({ y: +today.slice(0, 4), m: +today.slice(5, 7) - 1 }));
  const [day, setDay] = useState<DayCell | null>(null);
  const { data: periods } = usePeriods();
  const { data: symptoms } = useAllSymptomLogs();
  const { data: discharge } = useDischargeLogs();
  const { data: bleeding } = useBleedingLogs();
  const { data: journal } = useCycleJournal();
  const { data: ovu } = useTests('ovulation_tests');
  const { data: preg } = useTests('pregnancy_tests');
  const { data: appts } = useAppointments();
  const cells = useMemo(() => monthCells(ym.y, ym.m, {
    periods: periods ?? [], symptoms: symptoms ?? [], discharge: discharge ?? [], bleeding: bleeding ?? [], journal: journal ?? [],
    tests: [...(ovu ?? []), ...(preg ?? [])].map((x) => ({ tested_at: x.tested_at })),
    appointments: (appts ?? []).filter((a) => a.for_parent).map((a) => ({ starts_at: a.starts_at })),
  }, today), [ym, periods, symptoms, discharge, bleeding, journal, ovu, preg, appts, today]);

  // Transition de mois : glissement léger (supprimé si mouvement réduit)
  const slide = useRef(new Animated.Value(0)).current;
  const go = (d: -1 | 1) => {
    haptic('selection');
    slide.setValue(reduce ? 0 : d * 24);
    setYm(({ y, m }) => { const n = m + d; return { y: y + Math.floor(n / 12), m: ((n % 12) + 12) % 12 }; });
    springTo(slide, 0, 'gentle', reduce).start();
  };
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderRelease: (_e, g) => { if (g.dx < -40) go(1); else if (g.dx > 40) go(-1); },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const monthLabel = formatDate(`${ym.y}-${String(ym.m + 1).padStart(2, '0')}-15T12:00:00`, { month: 'long', year: 'numeric' });
  const weekdays = Array.from({ length: 7 }, (_, i) => formatDate(`2026-10-${String(12 + i).padStart(2, '0')}T12:00:00`, { weekday: 'narrow' }));
  const describe = (d: DayCell) => [
    fmtDay(d.iso, { weekday: 'long', day: 'numeric', month: 'long' }), d.today ? tr('cy.cal.today') : null,
    d.period ? tr('cy.cal.period') : null, d.estimatedPeriod ? tr('cy.cal.periodEstimate') : null, d.estimatedFertile ? tr('cy.cal.fertileEstimate') : null,
    d.symptoms ? tr('cy.cal.symptoms') : null, d.discharge ? tr('cy.cal.discharge') : null, d.bleeding ? tr('cy.cal.bleeding') : null,
    d.tests ? tr('cy.cal.tests') : null, d.journal ? tr('cy.cal.journal') : null, d.appointment ? tr('cy.cal.appointment') : null,
  ].filter(Boolean).join(', ');

  const daySymptoms = day ? (symptoms ?? []).filter((s) => s.logged_on === day.iso).flatMap((s) => symptomKeysOf(s)) : [];

  return (
    <Screen back title={tr('cy.cal.title')} subtitle={tr('cy.cal.subtitle')}>
      <Glass>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconButton icon="chevron-left" label={tr('cy.cal.prev')} onPress={() => go(-1)} />
          <Ink variant="heading" center style={{ flex: 1 }}>{monthLabel.replace(/^./, (x) => x.toUpperCase())}</Ink>
          <IconButton icon="chevron-right" label={tr('cy.cal.next')} onPress={() => go(1)} />
        </Row>
        <Animated.View {...swipe.panHandlers} style={{ transform: [{ translateX: slide }], gap: 4 }}>
          <View style={{ flexDirection: 'row' }}>{weekdays.map((w, i) => <View key={i} style={{ flex: 1 }}><Ink variant="caption" soft center>{w.toUpperCase()}</Ink></View>)}</View>
          {Array.from({ length: cells.length / 7 }, (_, w) => (
            <View key={w} style={{ flexDirection: 'row', gap: 4 }}>
              {cells.slice(w * 7, w * 7 + 7).map((d) => (
                <Pressable key={d.iso} accessibilityRole="button" accessibilityLabel={describe(d)} onPress={() => { haptic('selection'); setDay(d); }}
                  style={({ pressed }) => ({ flex: 1, aspectRatio: 1, maxHeight: 52, minHeight: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', opacity: d.inMonth ? 1 : 0.38,
                    backgroundColor: d.period ? c.period : d.estimatedFertile ? c.fertile : pressed ? c.pearl : 'transparent',
                    borderWidth: d.estimatedPeriod ? 1.5 : d.today ? 1.5 : 0, borderStyle: d.estimatedPeriod ? 'dashed' : 'solid', borderColor: d.estimatedPeriod ? c.period : c.mauve })}>
                  <Ink variant="small" weight={d.today ? 'bold' : undefined} style={{ color: d.period ? c.onAccent : c.ink }}>{String(+d.iso.slice(8, 10))}</Ink>
                  <View style={{ flexDirection: 'row', gap: 2, position: 'absolute', bottom: 3 }}>
                    {d.symptoms ? <LegendDot kind="symptom" /> : null}
                    {d.discharge ? <LegendDot kind="discharge" /> : null}
                    {d.journal || d.tests || d.bleeding || d.appointment ? <LegendDot kind="note" /> : null}
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </Animated.View>
        {/* Légende : forme + couleur + texte */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs }}>
          {(['period', 'estimate', 'fertile', 'symptom', 'discharge', 'note'] as const).map((k) => (
            <Row key={k} gap={6}><LegendDot kind={k} /><Ink variant="caption" soft>{tr(`cy.cal.legend.${k}` as 'cy.cal.legend.period')}</Ink></Row>
          ))}
        </View>
        <Ink variant="caption" soft>{tr('cy.cal.estimateNote')}</Ink>
      </Glass>
      <Button label={tr('cy.cal.today')} variant="ghost" icon="target" onPress={() => setYm({ y: +today.slice(0, 4), m: +today.slice(5, 7) - 1 })} />

      <Sheet visible={!!day} onClose={() => setDay(null)} title={day ? fmtDay(day.iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}>
        {day ? (
          <View style={{ gap: spacing.sm }}>
            {day.period ? <Ink>{tr('cy.cal.period')}</Ink> : null}
            {day.estimatedPeriod ? <Ink>{tr('cy.cal.periodEstimate')}</Ink> : null}
            {day.estimatedFertile ? <Ink>{tr('cy.cal.fertileEstimate')}</Ink> : null}
            {daySymptoms.length ? <Ink>{tr('cy.cal.symptomsList', { list: daySymptoms.map((k) => tr(`cy.sym.${k}` as 'cy.sym.cramps')).join(', ') })}</Ink> : null}
            {day.discharge ? <Ink>{tr('cy.cal.discharge')}</Ink> : null}
            {day.bleeding ? <Ink>{tr('cy.cal.bleeding')}</Ink> : null}
            {day.tests ? <Ink>{tr('cy.cal.tests')}</Ink> : null}
            {day.journal ? <Ink>{tr('cy.cal.journal')}</Ink> : null}
            {!day.period && !day.estimatedPeriod && !daySymptoms.length && !day.discharge && !day.bleeding && !day.tests && !day.journal ? <Ink soft>{tr('cy.cal.nothing')}</Ink> : null}
            {day.iso <= today ? (
              <View style={{ gap: spacing.xs }}>
                <Button label={tr('cy.cal.addSymptoms')} variant="secondary" onPress={() => { setDay(null); router.push(`/cycle/symptoms?date=${day.iso}` as never); }} full />
                <Button label={tr('cy.cal.addDischarge')} variant="secondary" onPress={() => { setDay(null); router.push(`/cycle/discharge/new?date=${day.iso}` as never); }} full />
                <Button label={tr('cy.cal.addJournal')} variant="secondary" onPress={() => { setDay(null); router.push(`/cycle/journal?date=${day.iso}` as never); }} full />
                <Button label={tr('cy.cal.addPeriod')} variant="ghost" onPress={() => { setDay(null); router.push('/cycle?all=1' as never); }} full />
              </View>
            ) : <Ink variant="caption" soft>{tr('cy.cal.future')}</Ink>}
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
