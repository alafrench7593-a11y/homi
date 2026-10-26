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
      case 'period': return { bg: t.colors.heart, fg: '#fff', label: 'Règles saisies' };
      case 'next_period_estimate': return { bg: t.colors.heart + '44', label: 'Règles estimées (estimation)' };
      case 'ovulation_estimate': return { bg: t.colors.lavender, fg: '#fff', label: 'Ovulation estimée (estimation)' };
      case 'higher_chance_estimate': return { bg: t.colors.lavender + '88', label: 'Chances possiblement plus élevées (estimation)' };
      case 'fertile_estimate': return { bg: t.colors.lavender + '33', label: 'Période fertile estimée (estimation)' };
      default: return null;
    }
  }, [t]);

  const dotKinds: DayEventKind[] = ['mucus', 'temperature', 'ovulation_test', 'pregnancy_test', 'symptom', 'note', ...(trackIntercourse ? ['intercourse' as const] : [])];
  const dotsOf = useCallback((d: string) => [...new Set((events.get(d) ?? []).filter((e) => e.kind !== 'period').map((e) => EVENT_COLOURS[e.kind]))], [events]);
  const dayEvents = selected ? events.get(selected) ?? [] : [];

  return (
    <Screen back title="Mon calendrier du cycle" subtitle="Privé : visible uniquement par vous">
      <TodaySummary items={[
        { icon: 'droplet', value: lastStart ? fmt(lastStart) : '—', label: 'Dernières règles' },
        { icon: 'heart', value: windows[0] ? `${fmt(windows[0].start)} – ${fmt(windows[0].end)}` : '—', label: 'Période fertile (estimation)' },
        { icon: 'calendar', value: windows[0] ? fmt(windows[0].nextPeriod) : '—', label: 'Prochaines règles (estimation)' },
      ]} />
      <PrivateBanner>Ce calendrier n’est jamais partagé avec votre foyer, votre coparent ni la communauté.</PrivateBanner>

      {cycleQ.isLoading && !cycleQ.data ? <Skeleton kind="card" rows={1} /> : cycleQ.isError && !cycleQ.data ? (
        <ErrorView error={cycleQ.error} onRetry={() => void cycleQ.refetch()} title="Impossible d’afficher votre cycle" />
      ) : crossed ? (
        <Card tone="lavender">
          <Text variant="caption" muted weight="bold">ESTIMATION</Text>
          <Text style={{ marginTop: 4 }}>{crossed.text}</Text>
          <Text variant="caption" muted style={{ marginTop: 4 }}>Ni une ovulation ni une grossesse ne peuvent être confirmées par l’application : seul un professionnel de santé, avec des examens adaptés, peut le faire.</Text>
        </Card>
      ) : (
        <Banner tone="info">Notez la date de vos dernières règles pour afficher des estimations.</Banner>
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
            )) : <Text muted>Rien de noté ce jour-là.</Text>}
            {windows[0] && selected >= windows[0].start && selected <= windows[0].end ? <EstimateLine label="Ce jour" value="dans la période fertile estimée" /> : null}
          </Card>
        </>
      ) : null}

      <SectionTitle title="Ajouter" />
      <Row wrap>
        <Button label="Glaire" icon="droplet" variant="secondary" size="sm" onPress={() => router.push('/fertility/mucus')} />
        <Button label="Test LH (photo)" icon="camera" variant="secondary" size="sm" onPress={() => router.push(LH_TEST_ROUTE)} />
        <Button label="Test de grossesse" icon="camera" variant="secondary" size="sm" onPress={() => router.push('/fertility/test/pregnancy')} />
        <Button label="Règles, symptômes" icon="edit-3" variant="secondary" size="sm" onPress={() => router.push('/fertility/log')} />
        <Button label="Température" icon="thermometer" variant="secondary" size="sm" onPress={() => router.push('/fertility/body')} />
        {trackIntercourse ? <Button label="Rapport" icon="lock" variant="secondary" size="sm" onPress={() => router.push('/fertility/intimacy')} /> : null}
      </Row>
      <Text variant="caption" muted>{`Dernière règle notée : ${lastStart ? fmt(lastStart) : '—'}.`}</Text>
    </Screen>
  );
}
