/**
 * Parcours « Je souhaite concevoir » : cycle, fenêtre fertile ESTIMÉE, repères, suivi et préparation des consultations.
 * Aucune date n'est garantie ; aucune grossesse n'est promise.
 */
import { insertOrQueue } from '@/lib/offline';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { Appear } from '@/components/Appear';
import { Banner, Button, Card, Row, SectionTitle, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { ErrorView, Skeleton } from '@/components/States';
import { t as tr } from '@/i18n';
import { EstimateLine, fmt, JourneyArticles, MonthCalendar, NavCard, num, RELIABILITY_LABEL, type CalendarStyle } from '@/components/Fertility';
import { useUserId } from '@/lib/auth';
import { backend } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCycleEstimates } from '@/lib/data/hooks-fertility';
import { useCyclePreferences } from '@/lib/data/hooks-cycle';
import { conceptionDayKind, currentCycleDay, upcomingWindow, type ConceptionDayKind } from '@/lib/domain/cycle';
import { todayISO } from '@/lib/domain/dates';
import { TIMING_INFO, TTC_DISCLAIMER } from '@/content/fertility';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function FertilityScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const cycleQ = useCycleEstimates(4);
  const { entries, est, windows } = cycleQ;
  const [saving, setSaving] = useState(false);
  const [showTiming, setShowTiming] = useState(false);
  const { prefs } = useCyclePreferences();
  const today = todayISO();
  const day = currentCycleDay(entries, today);
  const w = upcomingWindow(windows, today);

  const styleOf = useCallback((k: ConceptionDayKind): CalendarStyle | null => {
    switch (k) {
      case 'period': return { bg: t.colors.heart, fg: '#fff', label: tr('u3.fertCal.period') };
      case 'next_period_estimate': return { bg: t.colors.heart + '44', label: tr('u3.fertCal.nextEst') };
      case 'ovulation_estimate': return { bg: t.colors.lavender, fg: '#fff', label: tr('u3.fertCal.ovEst') };
      case 'higher_chance_estimate': return { bg: t.colors.lavender + '88', label: tr('u3.fertIdx.higher') };
      case 'fertile_estimate': return { bg: t.colors.lavender + '33', label: tr('u3.fertIdx.fertile') };
      default: return null;
    }
  }, [t]);

  async function periodToday() {
    if (entries.some((p) => p.start_date === today)) return toast(tr('u3.fertIdx.already'), 'info');
    setSaving(true);
    try {
      await insertOrQueue('period_entries', { user_id: userId, start_date: today });
      inv('period_entries');
      toast(tr('u3.fertIdx.started'));
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen back account title={tr('u3.fertIdx.title')} subtitle={tr('u3.fertIdx.subtitle')}
      action={{ label: tr('u3.fertIdx.action'), icon: 'droplet', onPress: () => void periodToday(), disabled: saving, testID: 'ttc-period-today' }}>
      <TodaySummary items={[
        { icon: 'sun', value: day != null ? String(day) : '—', label: tr('u3.fertIdx.day') },
        { icon: 'heart', value: w ? `${fmt(w.start)} – ${fmt(w.end)}` : '—', label: tr('u3.fertIdx.win') },
        { icon: 'circle', value: w ? fmt(w.ovulation) : '—', label: tr('u3.fertIdx.ov') },
      ]} />
      <Banner tone="warning" title={tr('u3.fertIdx.warnT')}>{TTC_DISCLAIMER}</Banner>

      {cycleQ.isLoading && !cycleQ.data ? <Skeleton kind="card" rows={1} /> : cycleQ.isError && !cycleQ.data ? (
        <ErrorView error={cycleQ.error} onRetry={() => void cycleQ.refetch()} title={tr('u3.fertCal.errShow')} />
      ) : (
      <Appear kind="soft">
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text weight="bold">{tr('u3.fertIdx.myCycle')}</Text>
            <Text variant="caption" muted>{RELIABILITY_LABEL[est.reliability]}</Text>
          </Row>
          {day != null ? (
            <View style={{ marginTop: spacing.xs }}>
              <EstimateLine label={tr('u3.fertIdx.today')} value={tr('u3.fertIdx.dayN', { day })} estimate={false} />
              {w ? (
                <>
                  <EstimateLine label={tr('u3.fertIdx.winEst')} value={tr('u3.fertIdx.fromTo', { from: fmt(w.start), to: fmt(w.end) })} />
                  <EstimateLine label={tr('u3.fertIdx.higherLine')} value={tr('u3.fertIdx.fromTo', { from: fmt(w.higherStart), to: fmt(w.higherEnd) })} />
                  <EstimateLine label={tr('u3.fertIdx.ovLine')} value={tr('u3.fertIdx.around', { date: fmt(w.ovulation) })} />
                  <EstimateLine label={tr('u3.fertIdx.nextLine')} value={tr('u3.fertIdx.around', { date: fmt(w.nextPeriod) })} />
                </>
              ) : null}
              {est.averageLength != null ? <Text variant="small" muted>{tr('u3.fertIdx.avg', { n: num(est.averageLength), var: est.variability != null ? tr('u3.fertIdx.avgVar', { v: num(est.variability) }) : '' })}</Text> : null}
            </View>
          ) : (
            <Text muted style={{ marginTop: spacing.xs }}>{tr('u3.fertCal.noteStart')}</Text>
          )}
        </Card>
      </Appear>
      )}

      <Card>
        <MonthCalendar kindOf={(d) => conceptionDayKind(d, entries, windows, today)} styleOf={styleOf} legend={['period', 'next_period_estimate', 'fertile_estimate', 'higher_chance_estimate', 'ovulation_estimate']} />
        <View style={{ marginTop: spacing.sm, gap: 2 }}>
          {est.caveats.map((c) => <Text key={c} variant="caption" muted>• {c}</Text>)}
        </View>
      </Card>

      <Appear kind="soft">
        <Card onPress={() => router.push('/fertility/understand')} tone="lavender" accessibilityLabel={tr('u3.fertIdx.understand')}>
          <Text weight="bold">{tr('u3.fertIdx.understand')}</Text>
          <Text variant="small" muted>{tr('u3.fertIdx.understandSub')}</Text>
        </Card>
      </Appear>

      <SectionTitle title={tr('u3.fertIdx.follow')} />
      <NavCard items={[
        { icon: 'grid', title: tr('cy.nav.full'), subtitle: tr('cy.nav.full.hint'), to: '/cycle?all=1' },
        { icon: 'edit-3', title: tr('u3.fertIdx.n1'), subtitle: tr('u3.fertIdx.n1s'), to: '/fertility/log' },
        { icon: 'thermometer', title: tr('u3.fertBody.title'), subtitle: tr('u3.fertIdx.n2s'), to: '/fertility/body' },
        ...(prefs.track_intercourse ? [{ icon: 'lock' as const, title: tr('u3.fertIdx.n3'), subtitle: tr('u3.fertIdx.n3s'), to: '/fertility/intimacy' }] : []),
        { icon: 'rotate-ccw', title: tr('u3.fertHist.title'), subtitle: tr('u3.fertIdx.n4s'), to: '/fertility/history' },
        { icon: 'bell', title: tr('u3.fertRem.title'), subtitle: tr('u3.fertIdx.n5s'), to: '/fertility/reminders' },
      ]} />

      <SectionTitle title={tr('u3.fertIdx.timing')} />
      <Card tone="lavender">
        {TIMING_INFO.slice(0, showTiming ? undefined : 1).map((i) => (
          <View key={i.title} style={{ gap: 2, paddingVertical: 6 }}>
            <Text weight="bold">{i.title}</Text>
            <Text variant="small">{i.text}</Text>
          </View>
        ))}
        {TIMING_INFO.length > 1 ? (
          <Button label={showTiming ? tr('u3.fertIdx.less') : tr('u3.fertIdx.more', { count: TIMING_INFO.length - 1 })} size="sm" variant="ghost" icon={showTiming ? 'chevron-up' : 'chevron-down'} onPress={() => setShowTiming((v) => !v)} style={{ alignSelf: 'flex-start' }} />
        ) : null}
      </Card>

      <SectionTitle title={tr('u3.fertIdx.prepT')} />
      <NavCard items={[
        { icon: 'help-circle', title: tr('u3.fertIdx.q1'), subtitle: tr('u3.fertIdx.q1s'), to: '/fertility/consultation' },
        { icon: 'activity', title: tr('u3.fertExams.title'), subtitle: tr('u3.fertIdx.q2s'), to: '/fertility/exams' },
      ]} />

      <SectionTitle title={tr('u3.fertIdx.read')} />
      <JourneyArticles journey="ttc" />
    </Screen>
  );
}
