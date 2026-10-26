/**
 * Export du suivi de cycle en PDF (pour soi ou pour une consultation) : période et rubriques au choix,
 * fabriqué SUR L'APPAREIL puis remis par la feuille de partage (mobile) ou téléchargé (web).
 * Aucun lien public, aucun envoi automatique. Le journal intime est exclu par défaut.
 */
import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, haptic } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { usePeriods, useTests } from '@/lib/data/hooks';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { useAllSymptomLogs, useBleedingLogs, useCycleJournal, useDischargeLogs } from '@/lib/data/hooks-cycle2';
import { friendlyError } from '@/lib/data/hooks-settings';
import { todayISO } from '@/lib/domain/dates';
import { buildTextPdf } from '@/lib/documents/pdf';
import { deliverFile } from '@/lib/deliverFile';
import { buildCycleReport, REPORT_PARTS, type ReportPart } from '@/features/cycle/report';
import { Choices, Glass, Ink, Rise, SwitchRow } from '@/features/cycle/kit';
import { fmtDayYear } from '@/features/cycle/format';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

const RANGES = ['3', '6', '12', 'all'] as const;
type Range = (typeof RANGES)[number];

function fromOf(r: Range, today: string): string | null {
  if (r === 'all') return null;
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - Number(r));
  return d.toISOString().slice(0, 10);
}

export default function CycleExport() {
  const access = usePremiumAccess('cycle_export');
  const toast = useToast();
  const periods = usePeriods();
  const symptoms = useAllSymptomLogs();
  const discharge = useDischargeLogs(1000);
  const bleeding = useBleedingLogs();
  const journal = useCycleJournal();
  const ovu = useTests('ovulation_tests');
  const preg = useTests('pregnancy_tests');
  const [range, setRange] = useState<Range>('6');
  const [parts, setParts] = useState<ReportPart[]>(['summary', 'periods', 'symptoms', 'discharge', 'bleeding', 'tests']);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const loading = [periods, symptoms, discharge, bleeding, journal, ovu, preg].some((q) => q.isLoading && !q.data);

  const toggle = (p: ReportPart, on: boolean) => setParts((cur) => (on ? [...cur.filter((x) => x !== p), p] : cur.filter((x) => x !== p)));

  async function make() {
    if (!parts.length) return toast(tr('cy.ex.chooseOne'), 'info');
    if (!access.require(<Ink variant="small">{tr('pm.cycleExport', { periods: (periods.data ?? []).length, days: (symptoms.data ?? []).length })}</Ink>)) return;
    setBusy(true); setDone(false);
    try {
      const today = todayISO();
      const from = fromOf(range, today);
      const sections = buildCycleReport({
        periods: periods.data ?? [], symptoms: symptoms.data ?? [], discharge: discharge.data ?? [], bleeding: bleeding.data ?? [], journal: journal.data ?? [],
        tests: [...(ovu.data ?? []).map((x) => ({ kind: 'ovulation' as const, tested_at: x.tested_at, result: x.result })), ...(preg.data ?? []).map((x) => ({ kind: 'pregnancy' as const, tested_at: x.tested_at, result: x.result }))],
      }, REPORT_PARTS.filter((p) => parts.includes(p)), from, today);
      const bytes = await buildTextPdf(tr('cy.ex.pdfTitle'), [
        from ? tr('cy.ex.pdfRange', { from: fmtDayYear(from), to: fmtDayYear(today) }) : tr('cy.ex.pdfAll'),
        tr('cy.ex.pdfGenerated', { date: formatDate(new Date(), { dateStyle: 'long' }) }),
        tr('cy.ex.pdfNotice'),
      ], sections);
      await deliverFile(bytes, `cycle-${today}.pdf`, 'application/pdf', tr('cy.ex.pdfTitle'));
      haptic('success'); setDone(true);
    } catch (e) {
      toast((e as Error)?.message === 'share_unavailable' ? tr('cy.ex.shareUnavailable') : friendlyError(e), 'error');
    } finally { setBusy(false); }
  }

  return (
    <Screen back title={tr('cy.ex.title')} subtitle={tr('cy.ex.subtitle')}
      action={{ label: Platform.OS === 'web' ? tr('cy.ex.download') : tr('cy.ex.share'), icon: Platform.OS === 'web' ? 'download' : 'share', onPress: () => void make(), disabled: busy || loading, testID: 'export-make' }}>
      <Rise>
        <Glass>
          <Choices label={tr('cy.ex.rangeQ')} options={RANGES} value={range} allowNone={false} onChange={(v) => v && setRange(v as Range)} labelOf={(r) => tr(`cy.ex.range.${r}` as TKey)} />
        </Glass>
      </Rise>
      <Rise delay={60}>
        <Glass>
          <Ink variant="label" weight="medium">{tr('cy.ex.partsQ')}</Ink>
          <View style={{ gap: spacing.xs }}>
            {REPORT_PARTS.map((p) => <SwitchRow key={p} label={tr(`cy.ex.part.${p}` as TKey)} value={parts.includes(p)} onChange={(on) => toggle(p, on)} />)}
          </View>
          {parts.includes('journal') ? <Banner tone="warning">{tr('cy.ex.journalWarn')}</Banner> : null}
        </Glass>
      </Rise>
      <Ink variant="caption" soft>{Platform.OS === 'web' ? tr('cy.ex.destWeb') : tr('cy.ex.destNative')}</Ink>
      {done ? <Banner tone="success">{tr('cy.ex.done')}</Banner> : null}
      <Button label={tr('cy.ex.fullData')} variant="ghost" icon="database" onPress={() => router.push('/settings/privacy' as never)} full />
    </Screen>
  );
}
