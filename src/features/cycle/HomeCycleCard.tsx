/**
 * Carte « Mon cycle » de l'accueil.
 *  - Ce qui est ENREGISTRÉ (jour du cycle, dernières règles, symptômes, pertes) est distingué de ce qui est ESTIMÉ
 *    (prochaines règles, fenêtre fertile), toujours libellé « estimation ».
 *  - Éléments, ordre et raccourcis personnalisables ; « masquer sur l'accueil » n'affiche plus aucune donnée.
 *  - Mise en page fluide : tout passe à la ligne (aucune hauteur fixe, aucun texte coupé).
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { haptic, Text } from '@/components/ui';
import { usePeriods } from '@/lib/data/hooks';
import { useCyclePreferences } from '@/lib/data/hooks-cycle';
import { useAllSymptomLogs, useDischargeLogs } from '@/lib/data/hooks-cycle2';
import { estimateCycle } from '@/lib/domain/cycle';
import { cycleDayOn, cycleStats, symptomKeysOf } from '@/lib/domain/cycleV2';
import { todayISO } from '@/lib/domain/dates';
import { useUiStore } from '@/lib/store';
import { formatNumber, t as tr, type TKey } from '@/i18n';
import { fonts, MIN_TOUCH, spacing } from '@/theme/tokens';
import { CycleIcon, Glass, Ink, useCyclePalette } from './kit';
import { fmtDay } from './format';
import { resolveItems, resolveShortcuts, SHORTCUT_META, type CardItem } from './homeCard';
import { Tappable } from '@/components/Tappable';

type Mode = 'ttc' | 'avoid' | 'cycle';

export function HomeCycleCard({ mode }: { mode: Mode }) {
  const c = useCyclePalette();
  const { prefs } = useCyclePreferences();
  const storedItems = useUiStore((s) => s.cycleCardItems);
  const storedShortcuts = useUiStore((s) => s.cycleCardShortcuts);
  const items = resolveItems(storedItems, mode);
  const shortcuts = resolveShortcuts(storedShortcuts);
  const hidden = !!prefs.hide_on_home;
  const { data: periods } = usePeriods();
  const { data: symptoms } = useAllSymptomLogs();
  const { data: discharge } = useDischargeLogs(1);
  const entries = useMemo(() => periods ?? [], [periods]);
  const est = useMemo(() => estimateCycle(entries), [entries]);
  const stats = useMemo(() => (items.includes('stats') ? cycleStats(entries, symptoms ?? []) : null), [items, entries, symptoms]);
  const today = todayISO();
  const day = cycleDayOn(entries, today);
  const last = entries.length ? [...entries].sort((a, b) => b.start_date.localeCompare(a.start_date))[0] : null;
  // « Éviter une grossesse » : le calendrier du cycle est l'outil principal
  // « Suivre mon cycle » : le calendrier est l'écran principal, quel que soit l'objectif
  const href = '/cycle/calendar';
  const open = mode === 'ttc' ? tr('cycleCard.openTtc') : mode === 'avoid' ? tr('cycleCard.openAvoid') : tr('cycleCard.openCycle');
  const note = mode === 'ttc' ? tr('cycleCard.noteTtc') : mode === 'avoid' ? tr('cycleCard.noteAvoid') : tr('cycleCard.noteCycle');
  const recent = (symptoms ?? []).filter((s) => s.logged_on >= isoMinus(today, 3)).flatMap((s) => symptomKeysOf(s));
  const recentUnique = [...new Set(recent)].slice(0, 3);

  const facts: Record<CardItem, React.ReactNode> = {
    day: null, // affiché en grand en tête
    last: <Fact key="last" label={tr('cy.home.last')} value={last ? fmtDay(last.start_date) : tr('cy.home.none')} kind="recorded" />,
    next: <Fact key="next" label={tr('cycleCard.nextPeriod')} value={est.nextPeriod ? fmtDay(est.nextPeriod) : tr('cycleCard.toEstimate')} kind="estimate" />,
    fertile: <Fact key="fertile" label={mode === 'ttc' ? tr('cycleCard.fertileTtc') : tr('cycleCard.fertileAvoid')} value={est.fertileWindow ? `${fmtDay(est.fertileWindow.start)} → ${fmtDay(est.fertileWindow.end)}` : tr('cycleCard.toEstimate')} kind="estimate" />,
    length: <Fact key="length" label={tr('cy.home.length')} value={est.averageLength != null ? tr('cy.st.daysValue', { n: formatNumber(est.averageLength) }) : tr('cycleCard.toEstimate')} kind="recorded" />,
    symptoms: <Fact key="symptoms" label={tr('cy.home.symptoms')} value={recentUnique.length ? recentUnique.map((k) => tr(`cy.sym.${k}` as TKey)).join(', ') : tr('cy.home.none')} kind="recorded" />,
    discharge: <Fact key="discharge" label={tr('cy.home.discharge')} value={discharge?.[0] ? fmtDay(discharge[0].observed_at.slice(0, 10)) : tr('cy.home.none')} kind="recorded" />,
    stats: <Fact key="stats" label={tr('cy.home.stats')} value={stats?.averagePeriod != null ? tr('cy.home.statsValue', { n: formatNumber(stats.averagePeriod), count: stats.cycles.length }) : tr('cycleCard.toEstimate')} kind="recorded" />,
  };

  return (
    <Glass>
      <Tappable accessibilityRole="button" accessibilityLabel={open} onPress={() => { haptic('selection'); router.push(href as never); }} style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <CycleIcon name="cycle" color={c.period} size={18} />
          <Ink variant="caption" weight="bold" soft style={{ flex: 1, letterSpacing: 1.2 }}>{mode === 'ttc' ? tr('cycleCard.ttc') : tr('cycleCard.mine')}</Ink>
          <CycleIcon name="calendar" color={c.inkSoft} size={18} />
        </View>
        {hidden ? (
          <Ink soft>{tr('cy.home.hidden')}</Ink>
        ) : (
          <>
            {items.includes('day') ? (day ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', columnGap: 8 }}>
                <Text color={c.ink} style={{ fontFamily: fonts.display, fontSize: 64, lineHeight: 68, letterSpacing: -3 }}>{tr('cycleCard.day', { day })}</Text>
                <Ink variant="small" soft style={{ marginBottom: 10 }}>{tr('cycleCard.ofCycle')}</Ink>
              </View>
            ) : <Ink variant="heading">{tr('cycleCard.start')}</Ink>) : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {items.filter((k) => k !== 'day').map((k) => facts[k])}
            </View>
            {items.some((k) => k === 'next' || k === 'fertile') ? <Ink variant="caption" soft>{note}</Ink> : null}
          </>
        )}
      </Tappable>
      {shortcuts.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }}>
          {shortcuts.map((s) => (
            <Tappable key={s} accessibilityRole="button" accessibilityLabel={tr(`cy.home.sc.${s}` as TKey)} onPress={() => { haptic('selection'); router.push(SHORTCUT_META[s].href as never); }}
              style={({ pressed }) => ({ flexGrow: 1, flexBasis: 120, maxWidth: '100%', minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingVertical: 8,
                borderRadius: 14, backgroundColor: pressed ? c.lavender : c.pearl })}>
              <CycleIcon name={SHORTCUT_META[s].icon} color={c.mauve} size={20} />
              <Ink variant="small" weight="medium" style={{ flex: 1 }}>{tr(`cy.home.sc.${s}` as TKey)}</Ink>
            </Tappable>
          ))}
        </View>
      ) : null}
      <Tappable accessibilityRole="button" accessibilityLabel={tr('cy.home.customize')} onPress={() => router.push('/cycle/home-card' as never)}
        style={{ minHeight: MIN_TOUCH, justifyContent: 'center', alignSelf: 'flex-start', maxWidth: '100%' }}>
        <Ink variant="small" weight="medium" style={{ color: c.mauve }}>{tr('cy.home.customize')}</Ink>
      </Tappable>
    </Glass>
  );
}

function isoMinus(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - days); return d.toISOString().slice(0, 10);
}

function Fact({ label, value, kind }: { label: string; value: string; kind: 'recorded' | 'estimate' }) {
  const c = useCyclePalette();
  return (
    <View style={{ flexGrow: 1, flexBasis: 130, maxWidth: '100%', borderRadius: 14, padding: spacing.sm, gap: 2,
      backgroundColor: kind === 'estimate' ? 'transparent' : c.pearl, borderWidth: kind === 'estimate' ? 1.2 : 0, borderColor: c.estimate, borderStyle: kind === 'estimate' ? 'dashed' : 'solid' }}>
      <Ink variant="caption" soft>{label}</Ink>
      <Ink weight="bold">{value}</Ink>
    </View>
  );
}
