/**
 * Statistiques DESCRIPTIVES du cycle : longueur des cycles, durée des règles, flux, symptômes fréquents, bien-être moyen.
 * Aucune zone « normale / anormale », aucune interprétation : ce sont des comptes et des moyennes de ce qui a été saisi.
 * Chaque graphique a une alternative textuelle complète (lecteur d'écran) et les valeurs sont écrites à côté des barres.
 */
import React, { useMemo } from 'react';
import { Animated, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/States';
import { usePeriods } from '@/lib/data/hooks';
import { PremiumSection } from '@/components/Premium';
import { useAllSymptomLogs } from '@/lib/data/hooks-cycle2';
import { cycleStats } from '@/lib/domain/cycleV2';
import { CycleIcon, Glass, Ink, Rise, useCyclePalette, type CycleIconName } from '@/features/cycle/kit';
import { Bars } from '@/features/cycle/Bars';
import { fmtDay } from '@/features/cycle/format';
import { formatNumber, t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

function Tile({ icon, value, label }: { icon: CycleIconName; value: string; label: string }) {
  const c = useCyclePalette();
  return (
    <View style={{ flexGrow: 1, flexBasis: 130, maxWidth: '100%', padding: spacing.sm, borderRadius: 16, backgroundColor: c.pearl, gap: 2 }}>
      <CycleIcon name={icon} color={c.mauve} size={20} />
      <Ink variant="heading">{value}</Ink>
      <Ink variant="caption" soft>{label}</Ink>
    </View>
  );
}

export default function StatsScreen() {
  const c = useCyclePalette();
  const periodsQ = usePeriods();
  const symptomsQ = useAllSymptomLogs();
  const s = useMemo(() => cycleStats(periodsQ.data ?? [], symptomsQ.data ?? []), [periodsQ.data, symptomsQ.data]);
  const dash = '—';
  const days = (n: number | null) => (n == null ? dash : tr('cy.st.daysValue', { n: formatNumber(n) }));

  if (periodsQ.isLoading && !periodsQ.data) return <Screen back title={tr('cy.st.title')}><Skeleton kind="card" rows={3} /></Screen>;
  const recentCycles = s.cycles.slice(-8);

  return (
    <Screen back title={tr('cy.st.title')} subtitle={tr('cy.st.subtitle')}>
      <PremiumSection feature="cycle_insights" preview={<Ink variant="small">{`${tr('pm.cycleStats', { count: s.cycles.length })}${s.averageLength != null ? ` ${tr('pm.cycleStatsAvg', { days: days(s.averageLength) })}` : ''}`}</Ink>}>
      <View style={{ gap: spacing.sm }}>
      <Rise>
        <Glass>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Tile icon="cycle" value={days(s.averageLength)} label={tr('cy.st.avgCycle')} />
            <Tile icon="period" value={days(s.averagePeriod)} label={tr('cy.st.avgPeriod')} />
            <Tile icon="stats" value={s.shortest == null ? dash : `${formatNumber(s.shortest)}–${formatNumber(s.longest!)}`} label={tr('cy.st.range')} />
            <Tile icon="calendar" value={formatNumber(s.cycles.length)} label={tr('cy.st.cycleCount')} />
          </View>
          <Ink variant="caption" soft>{tr('cy.st.descriptive')}</Ink>
        </Glass>
      </Rise>

      <Rise delay={60}>
        <Glass>
          <Ink variant="heading">{tr('cy.st.lengths')}</Ink>
          {recentCycles.length
            ? <Bars label={tr('cy.st.lengths')} color={c.period} rows={recentCycles.map((x) => ({ label: tr('cy.st.cycleFrom', { date: fmtDay(x.start) }), value: x.length, display: days(x.length) }))} />
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
      </View>
      </PremiumSection>
      <Ink variant="caption" soft>{tr('cy.st.notice')}</Ink>
    </Screen>
  );
}
