/**
 * Calendrier privé du cycle : règles, glaire, température, tests, symptômes, notes
 * et rapports (uniquement si l'option est activée). Période fertile et ovulation = ESTIMATIONS.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { ErrorView, Skeleton } from '@/components/States';
import { EstimateLine, fmt, MonthCalendar, PrivateBanner, type CalendarStyle } from '@/components/Fertility';
import { Banner, Button, Card, Row, SectionTitle, Text } from '@/components/ui';
import { useCycleEstimates } from '@/lib/data/hooks-fertility';
import { useCycleHistoryData } from '@/lib/data/hooks-cycle';
import { buildDayEvents, crossedOvulationEstimate, EVENT_COLOURS, EVENT_LABEL, type DayEventKind } from '@/lib/domain/cycleHistory';
import { conceptionDayKind, type ConceptionDayKind } from '@/lib/domain/cycle';
import { formatDateFr, todayISO } from '@/lib/domain/dates';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const LH_TEST_ROUTE = '/fertility/test/ovulation';

export default function CycleCalendarScreen() {
  const t = useTheme();
  const today = todayISO();
  const cycleQ = useCycleEstimates(4);
  const { entries, windows, est } = cycleQ;
  const { input, trackIntercourse } = useCycleHistoryData();
  const events = useMemo(() => buildDayEvents(input), [input]);
  const [selected, setSelected] = useState<string | null>(today);
  const lastStart = useMemo(() => [...entries].map((e) => e.start_date).sort().pop() ?? null, [entries]);
  const crossed = useMemo(() => crossedOvulationEstimate(windows, lastStart, input, today), [windows, lastStart, input, today]);

  const styleOf = useCallback((k: ConceptionDayKind): CalendarStyle | null => {
    switch (k) {
      case 'period': return { bg: t.colors.heart, fg: '#fff', label: tr('u3.fertCal.period') };
      case 'next_period_estimate': return { bg: t.colors.heart + '44', label: tr('u3.fertCal.nextEst') };
      case 'ovulation_estimate': return { bg: t.colors.lavender, fg: '#fff', label: tr('u3.fertCal.ovEst') };
      case 'higher_chance_estimate': return { bg: t.colors.lavender + '88', label: tr('u3.fertCal.higher') };
      case 'fertile_estimate': return { bg: t.colors.lavender + '33', label: tr('u3.fertCal.fertile') };
      default: return null;
    }
  }, [t]);

  const dotKinds: DayEventKind[] = ['mucus', 'temperature', 'ovulation_test', 'pregnancy_test', 'symptom', 'note', ...(trackIntercourse ? ['intercourse' as const] : [])];
  const dotsOf = useCallback((d: string) => [...new Set((events.get(d) ?? []).filter((e) => e.kind !== 'period').map((e) => EVENT_COLOURS[e.kind]))], [events]);
  const dayEvents = selected ? events.get(selected) ?? [] : [];

  return (
    <Screen back title={tr('u3.fertCal.title')} subtitle={tr('u3.fertCal.subtitle')}>
      <TodaySummary items={[
        { icon: 'droplet', value: lastStart ? fmt(lastStart) : '—', label: tr('u3.fertCal.lastPeriods') },
        { icon: 'heart', value: windows[0] ? `${fmt(windows[0].start)} – ${fmt(windows[0].end)}` : '—', label: tr('u3.fertCal.fertileWin') },
        { icon: 'calendar', value: windows[0] ? fmt(windows[0].nextPeriod) : '—', label: tr('u3.fertCal.nextPeriods') },
      ]} />
      <PrivateBanner>{tr('u3.fertCal.private')}</PrivateBanner>

      {cycleQ.isLoading && !cycleQ.data ? <Skeleton kind="card" rows={1} /> : cycleQ.isError && !cycleQ.data ? (
        <ErrorView error={cycleQ.error} onRetry={() => void cycleQ.refetch()} title={tr('u3.fertCal.errShow')} />
      ) : crossed ? (
        <Card tone="lavender">
          <Text variant="caption" muted weight="bold">{tr('u3.fertCal.estimation')}</Text>
          <Text style={{ marginTop: 4 }}>{crossed.text}</Text>
          <Text variant="caption" muted style={{ marginTop: 4 }}>{tr('u3.fertCal.noConfirm')}</Text>
        </Card>
      ) : (
        <Banner tone="info">{tr('u3.fertCal.noteStart')}</Banner>
      )}

      <Card>
        <MonthCalendar
          kindOf={(d) => conceptionDayKind(d, entries, windows, today)}
          styleOf={styleOf}
          legend={['period', 'next_period_estimate', 'fertile_estimate', 'higher_chance_estimate', 'ovulation_estimate']}
          dotsOf={dotsOf}
          onDayPress={setSelected}
          selected={selected}
        />
        <Row wrap style={{ marginTop: spacing.xs }}>
          {dotKinds.map((k) => (
            <Row key={k} gap={4}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: EVENT_COLOURS[k] }} /><Text variant="caption" muted>{EVENT_LABEL[k]}</Text></Row>
          ))}
        </Row>
        {est.caveats.slice(0, 2).map((c) => <Text key={c} variant="caption" muted style={{ marginTop: 2 }}>• {c}</Text>)}
      </Card>

      {selected ? (
        <>
          <SectionTitle title={formatDateFr(selected)} />
          <Card>
            {dayEvents.length ? dayEvents.map((e, i) => (
              <View key={`${e.kind}-${i}`} style={{ paddingVertical: 6, flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, marginTop: 5, backgroundColor: EVENT_COLOURS[e.kind] }} />
                <View style={{ flex: 1 }}>
                  <Text>{e.label}</Text>
                  {e.detail ? <Text variant="small" muted>{e.detail}</Text> : null}
                </View>
              </View>
            )) : <Text muted>{tr('u3.fertCal.nothing')}</Text>}
            {windows[0] && selected >= windows[0].start && selected <= windows[0].end ? <EstimateLine label={tr('u3.fertCal.thisDay')} value={tr('u3.fertCal.inFertile')} /> : null}
          </Card>
        </>
      ) : null}

      <SectionTitle title={tr('u3.fertCal.add')} />
      <Row wrap>
        <Button label={tr('u3.fertCal.bMucus')} icon="droplet" variant="secondary" size="sm" onPress={() => router.push('/fertility/mucus')} />
        <Button label={tr('u3.fertCal.bLh')} icon="camera" variant="secondary" size="sm" onPress={() => router.push(LH_TEST_ROUTE)} />
        <Button label={tr('u3.fertCal.bPreg')} icon="camera" variant="secondary" size="sm" onPress={() => router.push('/fertility/test/pregnancy')} />
        <Button label={tr('u3.fertCal.bLog')} icon="edit-3" variant="secondary" size="sm" onPress={() => router.push('/fertility/log')} />
        <Button label={tr('u3.fertCal.bTemp')} icon="thermometer" variant="secondary" size="sm" onPress={() => router.push('/fertility/body')} />
        {trackIntercourse ? <Button label={tr('u3.fertCal.bInt')} icon="lock" variant="secondary" size="sm" onPress={() => router.push('/fertility/intimacy')} /> : null}
      </Row>
      <Text variant="caption" muted>{tr('u3.fertCal.lastNoted', { date: lastStart ? fmt(lastStart) : '—' })}</Text>
    </Screen>
  );
}
