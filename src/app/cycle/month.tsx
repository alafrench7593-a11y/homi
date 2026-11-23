/**
 * Résumé du mois (Premium) : règles, cycle terminé, symptômes et humeurs les plus notés, douleur la plus forte,
 * nuits difficiles. Des faits notés, jamais un diagnostic ; PDF fabriqué sur l'appareil (sans l'intime).
 * 23/11/2026 : le mois (`?m=AAAA-MM`) et le jour choisi (`?day=`) vivent dans l'adresse ; les jours du mois en barres
 * TACTILES (bulle valeur + date, comme les courbes de mesures) ; « Ouvrir la fiche » ouvre la saisie des règles de ce
 * jour dans le formulaire de correction existant, sinon le journal des symptômes sur ce jour.
 */
import React, { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { PremiumSection } from '@/components/Premium';
import { Button, Card, haptic, IconButton, Row, Text } from '@/components/ui';
import { usePeriods } from '@/lib/data/hooks';
import { useAllSymptomLogs } from '@/lib/data/hooks-cycle2';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { friendlyError } from '@/lib/data/hooks-settings';
import { todayISO } from '@/lib/domain/dates';
import { monthlySummary, shiftMonth, type MonthSummary } from '@/lib/domain/cycleMonthly';
import { buildTextPdf } from '@/lib/documents/pdf';
import { deliverFile } from '@/lib/deliverFile';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { useCyclePalette } from '@/features/cycle/kit';
import { TouchBars } from '@/features/finishTrack/TouchBars';
import { keepBar, monthDayBars, parseMonthDay, parseMonthParam, type MonthDayBar } from '@/lib/domain/finishTrack';

const monthLabel = (m: string) => formatDate(`${m}-15T12:00:00`, { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase());

export function summaryLines(s: MonthSummary): { facts: string[]; symptoms: string[]; moods: string[] } {
  const facts = [
    s.periodStarts.length ? tr('c3.month.periodStarts', { count: s.periodStarts.length }) : null,
    s.periodDays ? tr('c3.month.periodDays', { count: s.periodDays }) : null,
    ...s.cycleLengths.map((d) => tr('c3.month.cycleLength', { days: d })),
    s.painMax != null ? tr('c3.month.painMax', { value: s.painMax }) : null,
    s.difficultNights ? tr('c3.month.difficult', { count: s.difficultNights }) : null,
    s.daysLogged ? tr('c3.month.daysLogged', { count: s.daysLogged }) : null,
  ].filter((x): x is string => !!x);
  return {
    facts,
    symptoms: s.topSymptoms.map((x) => `${tr(`cy.sym.${x.key}` as TKey)} · ${tr('c3.month.times', { count: x.count })}`),
    moods: s.topMoods.map((x) => `${tr(`c3.p.${x.key}` as TKey)} · ${tr('c3.month.times', { count: x.count })}`),
  };
}

export default function CycleMonth() {
  const toast = useToast();
  const today = todayISO();
  const c = useCyclePalette();
  const qp = useLocalSearchParams<{ m?: string; day?: string }>();
  const month = parseMonthParam(qp.m, today);
  const setMonth = (m: string) => router.setParams({ m, day: undefined } as never);
  const periods = usePeriods();
  const logs = useAllSymptomLogs();
  const access = usePremiumAccess('cycle_monthly');
  const [busy, setBusy] = useState(false);
  const s = useMemo(() => monthlySummary(month, { periods: periods.data ?? [], logs: (logs.data ?? []) as never }, { today }), [month, periods.data, logs.data, today]);
  const lines = summaryLines(s);
  const bars = useMemo(() => monthDayBars(month, { periods: periods.data ?? [], logs: (logs.data ?? []) as never }, today), [month, periods.data, logs.data, today]);
  const selected = keepBar(bars, parseMonthDay(qp.day, month, today));
  const dayValue = (b: MonthDayBar) => (b.value == null ? tr('ft.cm.nothing') : [
    b.periodId ? tr('ft.cm.period') : null,
    b.symptoms ? tr('ft.cm.symptoms', { count: b.symptoms }) : null,
    b.pain != null ? tr('ft.cm.pain', { value: b.pain }) : null,
  ].filter(Boolean).join(' · ') || tr('ft.cm.noted'));
  const empty = !lines.facts.length && !lines.symptoms.length && !lines.moods.length;
  async function pdf() {
    if (!access.require()) return;
    setBusy(true);
    try {
      const bytes = await buildTextPdf(tr('c3.month.pdfTitle', { month: monthLabel(month) }), [tr('c3.month.notice')], [
        { heading: tr('c3.month.facts'), lines: lines.facts.length ? lines.facts : [tr('c3.month.empty')] },
        ...(lines.symptoms.length ? [{ heading: tr('c3.month.topSymptoms'), lines: lines.symptoms }] : []),
        ...(lines.moods.length ? [{ heading: tr('c3.month.topMoods'), lines: lines.moods }] : []),
      ]);
      await deliverFile(bytes, `cycle-${month}.pdf`, 'application/pdf', tr('c3.month.title'));
      haptic('success');
    } catch (e) { toast((e as Error)?.message === 'share_unavailable' ? tr('cy.ex.shareUnavailable') : friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  return (
    <Screen back title={tr('c3.month.title')}>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon="chevron-left" label={tr('c3.month.prev')} onPress={() => setMonth(shiftMonth(month, -1))} />
        <Text variant="heading" testID="month-label">{monthLabel(month)}</Text>
        <IconButton icon="chevron-right" label={tr('c3.month.next')} onPress={() => setMonth(shiftMonth(month, 1))} disabled={month >= today.slice(0, 7)} />
      </Row>
      <PremiumSection feature="cycle_monthly" preview={<Text variant="small">{lines.facts.slice(0, 2).join(' · ') || tr('c3.month.notice')}</Text>}>
        <View testID="month-summary" style={{ gap: spacing.sm }}>
          {empty ? <Card tone="soft"><Text>{tr('c3.month.empty')}</Text></Card> : (
            <>
              <Card><Text weight="bold">{tr('c3.month.facts')}</Text>{lines.facts.map((f) => <Text key={f} variant="small">{f}</Text>)}</Card>
              {lines.symptoms.length ? <Card><Text weight="bold">{tr('c3.month.topSymptoms')}</Text>{lines.symptoms.map((f) => <Text key={f} variant="small">{f}</Text>)}</Card> : null}
              {lines.moods.length ? <Card><Text weight="bold">{tr('c3.month.topMoods')}</Text>{lines.moods.map((f) => <Text key={f} variant="small">{f}</Text>)}</Card> : null}
            </>
          )}
          {bars.length ? (
            <Card testID="month-days">
              <Text weight="bold">{tr('ft.cm.days')}</Text>
              <TouchBars testID="month-bars" title={tr('ft.cm.days')} bars={bars} selected={selected}
                onSelect={(b) => router.setParams({ day: b.id } as never)}
                colorOf={(b) => (b.periodId ? c.period : c.mauve)}
                valueText={dayValue} dateText={(b) => formatDate(`${b.date}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' })}
                axisText={(b) => formatDate(`${b.date}T12:00:00`, { day: 'numeric', month: 'short' })}
                canOpen={(b) => !!b.periodId || b.logged}
                onOpen={(b) => router.push((b.periodId ? { pathname: '/cycle', params: { all: '1', period: b.periodId } } : { pathname: '/cycle/symptoms', params: { date: b.date } }) as never)} />
            </Card>
          ) : null}
          <Text variant="caption" muted>{tr('c3.month.notice')}</Text>
          <Button label={Platform.OS === 'web' ? tr('c3.month.pdf') : tr('c3.month.share')} icon={Platform.OS === 'web' ? 'download' : 'share'} onPress={pdf} loading={busy} full testID="month-pdf" />
        </View>
      </PremiumSection>
    </Screen>
  );
}
