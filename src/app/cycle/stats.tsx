/**
 * Statistiques DESCRIPTIVES du cycle : longueur des cycles, durée des règles, flux, symptômes fréquents, bien-être moyen.
 * Aucune zone « normale / anormale », aucune interprétation : ce sont des comptes et des moyennes de ce qui a été saisi.
 * Chaque graphique a une alternative textuelle complète (lecteur d'écran) et les valeurs sont écrites à côté des barres.
 * 23/11/2026 : longueurs de cycle en barres TACTILES (bulle valeur + date, comme les courbes de mesures) ; la période
 * (`?n=6|12|all`) et le cycle choisi (`?cycle=AAAA-MM-JJ`) vivent dans l'adresse ; « Ouvrir la fiche » ouvre la saisie
 * des règles qui ouvre ce cycle, dans le formulaire de correction existant (`/cycle?all=1&period=`).
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { GlassSegmentedControl } from '@/components/glass';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { Skeleton } from '@/components/States';
import { usePeriods } from '@/lib/data/hooks';
import { PremiumSection } from '@/components/Premium';
import { useAllSymptomLogs } from '@/lib/data/hooks-cycle2';
import { cycleStats } from '@/lib/domain/cycleV2';
import { Glass, Ink, Rise, useCyclePalette } from '@/features/cycle/kit';
import { Bars } from '@/features/cycle/Bars';
import { fmtDay } from '@/features/cycle/format';
import { formatDate, formatNumber, t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { AuraAnalysis } from '@/features/aura/AuraAnalysis';
import { cycleAggregate } from '@/features/aura/analysis';
import { TouchBars } from '@/features/finishTrack/TouchBars';
import { cycleBars, keepBar, parseCycleRange, usefulCycleRanges, type CycleRange } from '@/lib/domain/finishTrack';

export default function StatsScreen() {
  const c = useCyclePalette();
  const periodsQ = usePeriods();
  const symptomsQ = useAllSymptomLogs();
  const s = useMemo(() => cycleStats(periodsQ.data ?? [], symptomsQ.data ?? []), [periodsQ.data, symptomsQ.data]);
  const dash = '—';
  const days = (n: number | null) => (n == null ? dash : tr('cy.st.daysValue', { n: formatNumber(n) }));
  const qp = useLocalSearchParams<{ n?: string; cycle?: string }>();
  const ranges = usefulCycleRanges(s.cycles.length);
  const range: CycleRange = ranges.includes(parseCycleRange(qp.n)) ? parseCycleRange(qp.n) : 'all';
  const bars = useMemo(() => cycleBars(periodsQ.data ?? [], s.cycles, range), [periodsQ.data, s.cycles, range]);
  const selected = keepBar(bars, qp.cycle);

  if (periodsQ.isLoading && !periodsQ.data) return <Screen back title={tr('cy.st.title')}><Skeleton kind="card" rows={3} /></Screen>;

  return (
    <Screen back title={tr('cy.st.title')} subtitle={tr('cy.st.subtitle')}>
      <PremiumSection feature="cycle_insights" preview={<Ink variant="small">{`${tr('pm.cycleStats', { count: s.cycles.length })}${s.averageLength != null ? ` ${tr('pm.cycleStatsAvg', { days: days(s.averageLength) })}` : ''}`}</Ink>}>
      <View style={{ gap: spacing.sm }}>
      <Rise>
        <View style={{ gap: spacing.xs }}>
          <TodaySummary title={tr('cy.st.title')} items={[
            { icon: 'repeat', value: days(s.averageLength), label: tr('cy.st.avgCycle') },
            { icon: 'droplet', value: days(s.averagePeriod), label: tr('cy.st.avgPeriod') },
            { icon: 'bar-chart-2', value: s.shortest == null ? dash : `${formatNumber(s.shortest)}–${formatNumber(s.longest!)}`, label: tr('cy.st.range') },
            { icon: 'calendar', value: formatNumber(s.cycles.length), label: tr('cy.st.cycleCount') },
          ]} />
          <Ink variant="caption" soft>{tr('cy.st.descriptive')}</Ink>
        </View>
      </Rise>

      <Rise delay={60}>
        <Glass>
          <Ink variant="heading">{tr('cy.st.lengths')}</Ink>
          {ranges.length ? (
            <GlassSegmentedControl label={tr('ft.cs.range')} value={range} testID="cs-range"
              onChange={(v) => router.setParams({ n: v, cycle: undefined } as never)}
              options={ranges.map((r) => ({ value: r, label: r === 'all' ? tr('ft.cs.rangeAll') : tr('ft.cs.rangeN', { n: Number(r) }) }))} />
          ) : null}
          {bars.length
            ? <TouchBars testID="cs-bars" title={tr('cy.st.lengths')} bars={bars} selected={selected} colorOf={() => c.period}
                onSelect={(b) => router.setParams({ cycle: b.id } as never)}
                valueText={(b) => days(b.value)} dateText={(b) => tr('cy.st.cycleFrom', { date: fmtDay(b.date) })}
                axisText={(b) => formatDate(`${b.date}T12:00:00`, { day: 'numeric', month: 'short' })}
                canOpen={(b) => !!b.periodId}
                onOpen={(b) => router.push({ pathname: '/cycle', params: { all: '1', period: b.periodId! } } as never)} />
            : <Ink soft>{tr('cy.st.needTwo')}</Ink>}
        </Glass>
      </Rise>

      <Rise delay={120}>
        <Glass>
          <Ink variant="heading">{tr('cy.st.flows')}</Ink>
          {Object.keys(s.flowCounts).length
            ? <Bars label={tr('cy.st.flows')} color={c.estimate} rows={['spotting', 'light', 'medium', 'heavy', 'very_heavy'].filter((f) => s.flowCounts[f]).map((f) => ({ label: tr(`cy.flow.${f}` as TKey), value: s.flowCounts[f], display: tr('cy.st.times', { count: s.flowCounts[f] }) }))} />
            : <Ink soft>{tr('cy.st.noFlow')}</Ink>}
        </Glass>
      </Rise>

      <Rise delay={180}>
        <Glass>
          <Ink variant="heading">{tr('cy.st.symptoms')}</Ink>
          {s.symptomCounts.length
            ? <Bars label={tr('cy.st.symptoms')} color={c.mauve} rows={s.symptomCounts.slice(0, 8).map((x) => ({ label: tr(`cy.sym.${x.key}` as TKey), value: x.count, display: tr('cy.st.days', { count: x.count }) }))} />
            : <Ink soft>{tr('cy.st.noSymptoms')}</Ink>}
        </Glass>
      </Rise>

      <Rise delay={240}>
        <Glass>
          <Ink variant="heading">{tr('cy.st.wellbeing')}</Ink>
          {s.wellbeing.days
            ? <Bars label={tr('cy.st.wellbeing')} color={c.rose} rows={(['mood', 'energy', 'sleep', 'stress'] as const).filter((k) => s.wellbeing[k] != null).map((k) => ({ label: tr(`cy.sym.${k}` as TKey), value: s.wellbeing[k]!, display: `${formatNumber(s.wellbeing[k]!)} / 5` }))} />
            : <Ink soft>{tr('cy.st.noWellbeing')}</Ink>}
          {s.wellbeing.days ? <Ink variant="caption" soft>{tr('cy.st.basedOn', { count: s.wellbeing.days })}</Ink> : null}
        </Glass>
      </Rise>
      {/* « Analyser avec HOMI Aura » : moyennes descriptives seulement, après aperçu et accord (docs/HOMI_AURA.md) */}
      <AuraAnalysis kind="cycle" data={cycleAggregate(s)} />
      </View>
      </PremiumSection>
      <Ink variant="caption" soft>{tr('cy.st.notice')}</Ink>
    </Screen>
  );
}
