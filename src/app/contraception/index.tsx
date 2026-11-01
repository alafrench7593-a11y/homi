/**
 * Parcours « Je souhaite éviter une grossesse ».
 * AUCUN jour n'est présenté comme exempt de risque : une grossesse reste possible à tout moment du cycle.
 * Le calendrier informe ; il ne remplace jamais une contraception adaptée.
 */
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { Appear } from '@/components/Appear';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { t as tr, formatDate, getLocale } from '@/i18n';
import { EstimateLine, fmt, JourneyArticles, MonthCalendar, NavCard, num, RELIABILITY_LABEL, type CalendarStyle } from '@/components/Fertility';
import { useContraceptionMethods, useCycleEstimates } from '@/lib/data/hooks-fertility';
import { addDays, daysBetween, todayISO } from '@/lib/domain/dates';

const fd = (iso: string) => formatDate(`${iso}T00:00:00Z`, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
import { avoidDayKind, currentCycleDay, type AvoidDayKind } from '@/lib/domain/cycle';
import { AVOID_DISCLAIMER, AVOID_NO_SAFE_DAYS, methodTitle } from '@/content/fertility';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { PillToday, dailyKindFor } from '@/features/cycle/PillToday';

export default function ContraceptionScreen() {
  const t = useTheme();
  const cycleQ = useCycleEstimates(4);
  const { entries, est, windows, margin } = cycleQ;
  const methodsQ = useContraceptionMethods();
  const { data: methods } = methodsQ;
  const today = todayISO();
  const day = currentCycleDay(entries, today);
  const w = windows.find((x) => addDays(x.end, margin) >= today) ?? null;
  const active = (methods ?? []).filter((m) => m.active);

  const styleOf = useCallback((k: AvoidDayKind): CalendarStyle | null => {
    switch (k) {
      case 'period': return { bg: t.colors.heart, fg: '#fff', label: tr('u7.contra.index.cal.period') };
      case 'next_period_estimate': return { bg: t.colors.heart + '44', label: tr('u7.contra.index.cal.nextPeriod') };
      case 'ovulation_estimate': return { bg: t.colors.gold, fg: '#fff', label: tr('u7.contra.index.cal.ovulation') };
      case 'higher_probability_estimate': return { bg: t.colors.gold + '55', label: tr('u7.contra.index.cal.higher') };
      case 'pregnancy_possible': return { bg: t.colors.surfaceAlt, label: tr('u7.contra.index.cal.other') };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, getLocale()]);

  return (
    <Screen back account title={tr('u7.contra.index.title')} subtitle={tr('u7.contra.index.subtitle')}
      action={{ label: tr('u7.contra.index.reminders'), icon: 'bell', onPress: () => router.push('/contraception/reminders' as never), testID: 'contra-reminders' }}>
      <TodaySummary items={[
        { icon: 'sun', value: day != null ? String(day) : '—', label: tr('u7.contra.log.cycleDay') },
        { icon: 'shield', value: active[0] ? active[0].label || methodTitle(active[0].method) : '—', label: tr('u7.contra.index.myMethod') },
        { icon: 'calendar', value: w ? fmt(w.nextPeriod) : '—', label: tr('u7.contra.index.nextPeriodEst') },
      ]} />
      {/* Prise du jour en un geste (pilule, patch, anneau) */}
      {active.find((m) => dailyKindFor(m.method)) ? <PillToday method={active.find((m) => dailyKindFor(m.method))!.method} /> : null}
      <Banner tone="warning" title={tr('u7.contra.index.alwaysPossible')}>{AVOID_DISCLAIMER}</Banner>

      {cycleQ.isLoading && !cycleQ.data ? <Skeleton kind="card" rows={1} /> : cycleQ.isError && !cycleQ.data ? (
        <ErrorView error={cycleQ.error} onRetry={() => void cycleQ.refetch()} title={tr('u7.contra.index.cycleError')} />
      ) : (
      <Appear kind="soft">
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text weight="bold">{tr('u7.contra.index.myCycle')}</Text>
            <Text variant="caption" muted>{RELIABILITY_LABEL[est.reliability]}</Text>
          </Row>
          {day != null ? (
            <View style={{ marginTop: spacing.xs }}>
              <EstimateLine label={tr('u7.contra.index.today')} value={tr('u7.contra.index.cycleDayN', { day })} estimate={false} />
              {w ? (
                <>
                  <EstimateLine label={tr('u7.contra.index.higherWindow')} value={tr('u7.contra.index.fromTo', { from: fmt(addDays(w.start, -margin)), to: fmt(addDays(w.end, margin)) })} />
                  <EstimateLine label={tr('u7.contra.index.ovulEst')} value={tr('u7.contra.index.aroundDate', { date: fmt(w.ovulation) })} />
                  <EstimateLine label={tr('u7.contra.index.nextPeriodEstLong')} value={tr('u7.contra.index.aroundDate', { date: fmt(w.nextPeriod) })} />
                </>
              ) : null}
              <Text variant="small" muted>{est.variability != null ? tr('u7.contra.index.marginVar', { margin, var: num(est.variability) }) : tr('u7.contra.index.margin', { margin })}</Text>
            </View>
          ) : (
            <Text muted style={{ marginTop: spacing.xs }}>{tr('u7.contra.index.noCycle')}</Text>
          )}
        </Card>
      </Appear>
      )}

      <Card>
        <MonthCalendar kindOf={(d) => avoidDayKind(d, entries, windows, margin, today)} styleOf={styleOf} legend={['period', 'next_period_estimate', 'higher_probability_estimate', 'ovulation_estimate', 'pregnancy_possible']} />
        <Text variant="caption" muted style={{ marginTop: spacing.sm }}>{AVOID_NO_SAFE_DAYS}</Text>
      </Card>

      <SectionTitle title={tr('u7.contra.index.myContra')} action={tr('u7.contra.index.manage')} onAction={() => router.push('/contraception/reminders' as never)} />
      {methodsQ.isLoading && !methods ? <Skeleton rows={1} /> : methodsQ.isError && !methods ? (
        <ErrorView error={methodsQ.error} onRetry={() => void methodsQ.refetch()} title={tr('u7.contra.index.contraError')} />
      ) : !active.length ? (
        <EmptyState icon="shield" title={tr('u7.contra.index.noMethod')} body={tr('u7.contra.index.noMethodBody')} action={{ label: tr('u7.contra.index.addMethod'), onPress: () => router.push('/contraception/reminders' as never) }} />
      ) : (
      <Card>
        {active.map((m) => {
          const left = m.renewal_due_on ? daysBetween(today, m.renewal_due_on) : null;
          return (
            <ListRow
              key={m.id}
              icon="shield"
              title={m.label || methodTitle(m.method)}
              subtitle={[m.started_on ? tr('u7.contra.index.since', { date: fd(m.started_on) }) : null, m.renewal_due_on ? (left != null && left < 0 ? tr('u7.contra.index.overdue', { date: fd(m.renewal_due_on) }) : tr('u7.contra.index.renewOn', { date: fd(m.renewal_due_on) })) : null].filter(Boolean).join(' · ') || undefined}
              onPress={() => router.push('/contraception/reminders' as never)}
            />
          );
        })}
      </Card>
      )}

      <Card tone="gold" onPress={() => router.push('/contraception/emergency' as never)} accessibilityLabel={tr('u7.contra.index.emergA11y')}>
        <Text weight="bold">{tr('u7.contra.index.emergTitle')}</Text>
        <Text variant="small">{tr('u7.contra.index.emergBody')}</Text>
        <Button label={tr('u7.contra.index.whatToDo')} size="sm" variant="secondary" style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }} onPress={() => router.push('/contraception/emergency' as never)} />
      </Card>

      <SectionTitle title={tr('u7.contra.index.myFollowUp')} />
      <NavCard items={[
        { icon: 'grid', title: tr('cy.nav.full'), subtitle: tr('cy.nav.full.hint'), to: '/cycle?all=1' },
        { icon: 'edit-3', title: tr('u7.contra.index.logTitle'), subtitle: tr('u7.contra.index.logSub'), to: '/contraception/log' },
        { icon: 'rotate-ccw', title: tr('u7.contra.history.title'), subtitle: tr('u7.contra.index.historySub'), to: '/contraception/history' },
        { icon: 'bell', title: tr('u7.contra.index.reminders'), subtitle: tr('u7.contra.index.remindersSub'), to: '/contraception/reminders' },
      ]} />

      <SectionTitle title={tr('u7.contra.index.learn')} />
      <NavCard items={[
        { icon: 'book', title: tr('u7.contra.index.methodsTitle'), subtitle: tr('u7.contra.index.methodsSub'), to: '/contraception/methods' },
        { icon: 'alert-circle', title: tr('u7.contra.index.emergTitle'), subtitle: tr('u7.contra.index.emergSub'), to: '/contraception/emergency' },
        { icon: 'help-circle', title: tr('u7.contra.index.questionsTitle'), subtitle: tr('u7.contra.index.questionsSub'), to: '/contraception/consultation' },
      ]} />
      <JourneyArticles journey="avoid" />
    </Screen>
  );
}
