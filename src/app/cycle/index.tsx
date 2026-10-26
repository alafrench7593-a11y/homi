/**
 * Mon cycle : vue d'ensemble, enregistrement des règles (5 niveaux de flux, dates passées, modification),
 * historique, tests, et accès à tout le suivi (calendrier, symptômes, pertes, fiches, saignements, journal,
 * statistiques, rappels, export, confidentialité).
 * Les dates calculées sont TOUJOURS des estimations : elles ne garantissent rien et ne remplacent pas une contraception.
 * Parcours « concevoir » ou « éviter » : leur écran dédié s'ouvre d'abord (sauf ?all=1, depuis ces écrans).
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { HistoryHeader, TodaySummary } from '@/components/MiniApp';
import { ErrorView, Skeleton } from '@/components/States';
import { Button, Field, haptic, Row, Segmented } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { insertOrQueue } from '@/lib/offline';
import { useInvalidate, usePeriods, useProfile, useTests } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useFertilityJourney } from '@/lib/data/hooks-fertility';
import { useAllSymptomLogs, useDischargeLogs } from '@/lib/data/hooks-cycle2';
import { daysBetween, frToISO, todayISO } from '@/lib/domain/dates';
import { estimateCycle } from '@/lib/domain/cycle';
import { cycleDayOn, FLOWS, symptomKeysOf } from '@/lib/domain/cycleV2';
import { toFrDate } from '@/lib/validation';
import type { PeriodEntry } from '@/lib/types';
import { Choices, CycleIcon, Glass, IconBadge, Ink, Rise, useCyclePalette, type CycleIconName } from '@/features/cycle/kit';
import { fmtDay } from '@/features/cycle/format';
import { CycleRing, ringData } from '@/features/cycle/CycleRing';
import { AdviceCard } from '@/features/cycle/AdviceCard';
import { HomeCycleCard } from '@/features/cycle/HomeCycleCard';
import { ObjectiveRow, useObjective } from '@/features/cycle/Objective';
import { useAdvice } from '@/features/cycle/useAdvice';
import { rank } from '@/lib/advice/types';
import { uuid } from '@/lib/uuid';
import { formatNumber, formatUnit, t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

type TestKind = 'ovulation_tests' | 'pregnancy_tests';
const TEST_RESULTS: Record<TestKind, string[]> = { ovulation_tests: ['negative', 'positive', 'peak', 'invalid'], pregnancy_tests: ['negative', 'positive', 'faint', 'invalid'] };

const SECTIONS: { key: string; icon: CycleIconName; href: string }[] = [
  { key: 'advice', icon: 'guide', href: '/cycle/advice' },
  { key: 'calendar', icon: 'calendar', href: '/cycle/calendar' },
  { key: 'symptoms', icon: 'symptoms', href: '/cycle/symptoms' },
  { key: 'pain', icon: 'pain', href: '/cycle/pain' },
  { key: 'intimacy', icon: 'privacy', href: '/cycle/intimacy' },
  { key: 'discharge', icon: 'discharge', href: '/cycle/discharge' },
  { key: 'guides', icon: 'guide', href: '/cycle/guides' },
  { key: 'bleeding', icon: 'bleeding', href: '/cycle/bleeding' },
  { key: 'journal', icon: 'journal', href: '/cycle/journal' },
  { key: 'stats', icon: 'stats', href: '/cycle/stats' },
  { key: 'fertility', icon: 'ovulation', href: '/fertility/body' },
  { key: 'reminders', icon: 'reminders', href: '/settings/reminders' },
  { key: 'export', icon: 'export', href: '/cycle/export' },
  { key: 'privacy', icon: 'privacy', href: '/cycle/privacy' },
  { key: 'emergency', icon: 'guide', href: '/cycle/emergency' },
  { key: 'share', icon: 'privacy', href: '/cycle/share' },
  { key: 'month', icon: 'stats', href: '/cycle/month' },
];

/** Rubriques visibles d'emblée ; les autres s'ouvrent d'un geste (écran allégé). */
const ESSENTIAL = ['calendar', 'month', 'advice', 'reminders', 'share', 'privacy'];

const history0 = (list: PeriodEntry[]) => [...list].sort((a, b) => b.start_date.localeCompare(a.start_date));

export default function CycleRoute() {
  const journey = useFertilityJourney();
  const profileQ = useProfile();
  const { all } = useLocalSearchParams<{ all?: string }>();
  if (profileQ.isLoading) return <Screen back account title={tr('cy.title')}><Skeleton kind="card" rows={3} /></Screen>;
  if (!all && journey === 'ttc') return <Redirect href={'/fertility' as never} />;
  if (!all && journey === 'avoid') return <Redirect href={'/contraception' as never} />;
  return <CycleHub />;
}

function CycleHub() {
  const objective = useObjective();
  const c = useCyclePalette();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const periodsQ = usePeriods();
  const entries = useMemo(() => periodsQ.data ?? [], [periodsQ.data]);
  const est = useMemo(() => estimateCycle(entries), [entries]);
  const { data: symptoms } = useAllSymptomLogs();
  const { data: discharge } = useDischargeLogs(5);
  const ovuQ = useTests('ovulation_tests');
  const pregQ = useTests('pregnancy_tests');
  const today = todayISO();
  const day = cycleDayOn(entries, today);
  const last = entries.length ? [...entries].sort((a, b) => b.start_date.localeCompare(a.start_date))[0] : null;

  // Formulaire des règles (création ou modification explicite d'une saisie existante)
  const [editing, setEditing] = useState<PeriodEntry | null>(null);
  const [start, setStart] = useState(toFrDate(today));
  const [end, setEnd] = useState('');
  const [flow, setFlow] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [testKind, setTestKind] = useState<TestKind>('ovulation_tests');
  const [testResult, setTestResult] = useState<string | null>(null);
  const tests = (testKind === 'ovulation_tests' ? ovuQ : pregQ).data;

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try { await fn(); } catch (err) { toast(friendlyError(err), 'error'); } finally { setBusy(null); }
  }
  function edit(p: PeriodEntry) {
    setEditing(p); setStart(toFrDate(p.start_date)); setEnd(p.end_date ? toFrDate(p.end_date) : ''); setFlow(p.flow); setNote(p.note ?? ''); setErrors({});
    haptic('selection');
  }
  function resetForm() { setEditing(null); setStart(toFrDate(today)); setEnd(''); setFlow(null); setNote(''); setErrors({}); }

  async function savePeriod() {
    const s = frToISO(start);
    const e = end.trim() ? frToISO(end) : null;
    const errs: Record<string, string> = {};
    if (!s || s > today) errs.start = tr('cy.err.start');
    if (end.trim() && (!e || (s && e < s))) errs.end = tr('cy.err.end');
    if (e && e > today) errs.end = tr('cy.err.endFuture');
    if (s && e && daysBetween(s, e) > 15) errs.end = tr('cy.err.long');
    if (s && entries.some((p) => p.start_date === s && p.id !== editing?.id)) errs.start = tr('cy.err.duplicate');
    setErrors(errs);
    if (Object.keys(errs).length) return;
    await run('period', async () => {
      const row = { start_date: s, end_date: e, flow, note: note.trim() || null };
      if (editing) await backend.update('period_entries', row, [eq('id', editing.id)]);
      else await insertOrQueue('period_entries', { user_id: userId, ...row });
      inv('period_entries');
      haptic('success');
      toast(editing ? tr('cy.period.updated') : tr('cy.period.saved'));
      resetForm();
    });
  }
  async function endToday(p: PeriodEntry) {
    await run(`end-${p.id}`, async () => { await backend.update('period_entries', { end_date: today }, [eq('id', p.id)]); inv('period_entries'); toast(tr('cy.period.ended')); });
  }
  async function remove(table: string, id: string, what: string) {
    if (!(await confirm(tr('cy.delete.title', { what }), tr('cy.delete.body'), tr('common.delete')))) return;
    await run(`del-${id}`, async () => { await backend.remove(table, [eq('id', id)]); inv(table); if (editing?.id === id) resetForm(); });
  }
  async function saveTest() {
    if (!testResult) return toast(tr('cy.test.choose'), 'info');
    await run('test', async () => {
      await insertOrQueue(testKind, { user_id: userId, tested_at: new Date().toISOString(), result: testResult });
      inv(testKind); setTestResult(null); toast(tr('cy.test.saved'));
    });
  }

  // « Mes règles ont commencé / sont terminées » : enregistrement immédiat, récapitulatif, annulation possible
  const open = history0(entries).find((p) => !p.end_date && p.start_date <= today && daysBetween(p.start_date, today) <= 14) ?? null;
  const [quick, setQuick] = useState<{ kind: 'start' | 'end'; id: string } | null>(null);
  async function periodStarted() {
    if (entries.some((p) => p.start_date === today)) return toast(tr('cy.err.duplicate'), 'info');
    await run('quick', async () => {
      const id = uuid();
      await insertOrQueue('period_entries', { id, user_id: userId, start_date: today, end_date: null, flow: null, note: null });
      inv('period_entries'); haptic('success'); setQuick({ kind: 'start', id });
    });
  }
  async function periodEnded() {
    if (!open) return;
    await run('quick', async () => {
      await backend.update('period_entries', { end_date: today }, [eq('id', open.id)]);
      inv('period_entries'); haptic('success'); setQuick({ kind: 'end', id: open.id });
    });
  }
  async function undoQuick() {
    if (!quick) return;
    await run('quick', async () => {
      if (quick.kind === 'start') await backend.remove('period_entries', [eq('id', quick.id)]);
      else await backend.update('period_entries', { end_date: null }, [eq('id', quick.id)]);
      inv('period_entries'); setQuick(null); toast(tr('cy.quick.undone'));
    });
  }
  const ring = ringData(entries, est, today, (ovuQ.data ?? []).filter((t) => t.result === 'positive' || t.result === 'peak').map((t) => t.tested_at.slice(0, 10)));
  const { all: advice, isNew } = useAdvice();
  const urgentAdvice = advice.filter((a) => rank(a.priority) >= rank('prompt') && daysBetween(a.event.date, today) <= 3);
  const freshCount = advice.filter(isNew).length;

  const [allSections, setAllSections] = useState(false);
  const recentSymptoms = (symptoms ?? []).slice(0, 3).flatMap((s) => symptomKeysOf(s)).slice(0, 4);
  const history = history0(entries);

  return (
    <Screen back account title={tr('cy.title')} subtitle={tr('cy.subtitle')}
      action={open
        ? { label: tr('cy.quick.ended'), icon: 'check', onPress: () => void periodEnded(), disabled: busy === 'quick', testID: 'cycle-quick-end' }
        : { label: tr('cy.quick.started'), icon: 'droplet', onPress: () => void periodStarted(), disabled: busy === 'quick', testID: 'cycle-quick-start' }}>
      {/* Situations pressantes récentes : visibles sans chercher (jamais retardées par une animation) */}
      {urgentAdvice.slice(0, 1).map((a) => <AdviceCard key={a.signature} advice={a} compact />)}

      {/* L'essentiel d'un coup d'œil : jour du cycle, prochaines règles (estimation), durée habituelle */}
      <TodaySummary title={tr('cy.cal.today')} items={[
        { icon: 'sun', value: day ? String(day) : '—', label: tr('cy.hc.item.day') },
        { icon: 'droplet', value: est.nextPeriod ? fmtDay(est.nextPeriod, { day: 'numeric', month: 'short' }) : '—', label: tr('cy.hc.item.next') },
        { icon: 'repeat', value: est.averageLength != null ? formatUnit(est.averageLength, 'day', 0) : '—', label: tr('cy.hc.item.length') },
      ]} />

      {/* Objectif (changeable sans perdre l'historique) et carte de synthèse personnalisable (Réglages de la carte) */}
      <ObjectiveRow />
      <HomeCycleCard mode={objective ?? 'cycle'} />

      {/* Mes règles : un geste (gros bouton en bas), enregistrement immédiat, récapitulatif et annulation ici */}
      {quick ? (
      <Glass>
        {quick ? (
          <Rise key={`${quick.kind}${quick.id}`}>
            <View accessibilityLiveRegion="polite" style={{ gap: 4, padding: spacing.sm, borderRadius: 14, backgroundColor: c.powder }}>
              <Ink weight="bold">{quick.kind === 'start' ? tr('cy.quick.startedRecap', { date: fmtDay(today) }) : tr('cy.quick.endedRecap', { date: fmtDay(today) })}</Ink>
              {quick.kind === 'start' && est.nextPeriod ? <Ink variant="small">{tr('cy.quick.nextAfter', { date: fmtDay(est.nextPeriod) })}</Ink> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                <Button label={tr('cy.quick.undo')} size="sm" variant="secondary" onPress={undoQuick} />
                <Button label={tr('cy.quick.fix')} size="sm" variant="ghost" onPress={() => { const p = entries.find((x) => x.id === quick.id); if (p) edit(p); setQuick(null); }} />
              </View>
            </View>
          </Rise>
        ) : null}
      </Glass>
      ) : null}

      {ring ? <Rise><Glass><CycleRing data={ring} /></Glass></Rise> : null}

      {advice.length ? (
        <Glass onPress={() => router.push('/cycle/advice' as never)} accessibilityLabel={tr('adv.ui.seeAll')}>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <IconBadge name="guide" tone="lavender" />
            <View style={{ flex: 1, gap: 2 }}>
              <Ink weight="bold">{tr('adv.ui.hubTitle', { count: advice.length })}</Ink>
              {freshCount ? <Ink variant="caption" soft>{tr('adv.ui.hubNew', { count: freshCount })}</Ink> : null}
            </View>
          </View>
        </Glass>
      ) : null}

      {/* Vue d'ensemble : ce qui est ENREGISTRÉ d'abord, puis ce qui est ESTIMÉ (libellé comme tel) */}
      <Rise>
        <Glass>
          <Row style={{ alignItems: 'flex-start' }}>
            <IconBadge name="cycle" tone="period" size={48} />
            <View style={{ flex: 1, gap: 2 }}>
              <Ink variant="heading">{day ? tr('cy.dayOf', { day }) : tr('cy.noData')}</Ink>
              {last ? <Ink variant="small" soft>{tr('cy.lastPeriod', { date: fmtDay(last.start_date) })}</Ink> : <Ink variant="small" soft>{tr('cy.startHint')}</Ink>}
            </View>
          </Row>
          {est.nextPeriod ? (
            <View style={{ gap: 4, marginTop: spacing.xs }}>
              <Ink>{tr('cy.nextEstimate', { date: fmtDay(est.nextPeriod) })}</Ink>
              {est.fertileWindow ? <Ink variant="small">{tr('cy.fertileEstimate', { from: fmtDay(est.fertileWindow.start), to: fmtDay(est.fertileWindow.end) })}</Ink> : null}
              {est.averageLength != null ? <Ink variant="small" soft>{tr('cy.usualLength', { days: formatNumber(est.averageLength) })}{est.variability != null ? ` ${tr('cy.variability', { days: formatNumber(est.variability) })}` : ''}</Ink> : null}
              <Ink variant="caption" soft>{tr(`cy.reliability.${est.reliability}` as 'cy.reliability.low')}</Ink>
            </View>
          ) : null}
          {recentSymptoms.length ? <Ink variant="small" soft>{tr('cy.recentSymptoms', { list: recentSymptoms.map((k) => tr(`cy.sym.${k}` as 'cy.sym.cramps')).join(', ') })}</Ink> : null}
          {discharge?.[0] ? <Ink variant="small" soft>{tr('cy.lastDischarge', { date: fmtDay(discharge[0].observed_at.slice(0, 10)) })}</Ink> : null}
          <View style={{ padding: spacing.sm, borderRadius: 14, backgroundColor: c.powder, marginTop: spacing.xs }}>
            <Ink variant="caption">{tr('cy.disclaimer')}</Ink>
          </View>
        </Glass>
      </Rise>

      {/* Toutes les rubriques (grille qui passe à la ligne : jamais de libellé coupé) */}
      <Rise delay={60}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {SECTIONS.filter((s) => allSections || ESSENTIAL.includes(s.key)).map((s) => (
            <View key={s.key} style={{ flexGrow: 1, flexBasis: 140, maxWidth: '100%' }}>
              <Glass onPress={() => router.push(s.href as never)} accessibilityLabel={tr(`cy.nav.${s.key}` as 'cy.nav.calendar')} accessibilityHint={tr(`cy.nav.${s.key}.hint` as 'cy.nav.calendar.hint')}>
                <CycleIcon name={s.icon} color={c.mauve} />
                <Ink weight="bold">{tr(`cy.nav.${s.key}` as 'cy.nav.calendar')}</Ink>
                <Ink variant="caption" soft>{tr(`cy.nav.${s.key}.hint` as 'cy.nav.calendar.hint')}</Ink>
              </Glass>
            </View>
          ))}
        </View>
        <Button label={allSections ? tr('cy.nav.less') : tr('cy.nav.more', { count: SECTIONS.length - ESSENTIAL.length })} icon={allSections ? 'chevron-up' : 'grid'} variant="ghost" onPress={() => setAllSections((v) => !v)} testID="cycle-sections-toggle" />
      </Rise>

      {/* Règles */}
      <Rise delay={120}>
        <Glass>
          <Ink variant="heading">{editing ? tr('cy.period.editTitle') : tr('cy.period.title')}</Ink>
          <Ink variant="small" soft>{tr('cy.period.hint')}</Ink>
          <Field label={tr('cy.period.start')} value={start} onChangeText={setStart} error={errors.start} keyboardType="numbers-and-punctuation" placeholder={tr('cy.datePh')} />
          <Field label={tr('cy.period.end')} optional value={end} onChangeText={setEnd} error={errors.end} keyboardType="numbers-and-punctuation" placeholder={tr('cy.datePh')} />
          <Choices label={tr('cy.period.flow')} options={FLOWS} value={flow as never} onChange={(v) => setFlow(v as string | null)} labelOf={(f) => tr(`cy.flow.${f}` as 'cy.flow.light')} />
          <Field label={tr('cy.period.note')} optional value={note} onChangeText={setNote} maxLength={1000} multiline />
          <Button label={editing ? tr('cy.period.update') : tr('common.save')} icon={editing ? 'check' : 'plus'} loading={busy === 'period'} onPress={savePeriod} full />
          {editing ? <Button label={tr('common.cancel')} variant="ghost" onPress={resetForm} full /> : null}
        </Glass>
      </Rise>

      <HistoryHeader title={tr('cy.history')} count={history.length || undefined} />
      {periodsQ.isLoading && !periodsQ.data ? <Skeleton rows={2} /> : periodsQ.isError && !periodsQ.data ? <ErrorView error={periodsQ.error} onRetry={() => void periodsQ.refetch()} /> : null}
      {!history.length && !periodsQ.isLoading ? <Ink soft>{tr('cy.history.empty')}</Ink> : null}
      {history.slice(0, 24).map((p) => (
        <Glass key={p.id}>
          <Row style={{ alignItems: 'flex-start' }}>
            <CycleIcon name="period" color={c.period} />
            <View style={{ flex: 1, gap: 2 }}>
              <Ink weight="medium">{p.end_date ? tr('cy.history.range', { from: fmtDay(p.start_date), to: fmtDay(p.end_date) }) : tr('cy.history.since', { from: fmtDay(p.start_date) })}</Ink>
              <Ink variant="caption" soft>{[p.end_date ? tr('cy.history.days', { count: daysBetween(p.start_date, p.end_date) + 1 }) : null, p.flow ? tr(`cy.flow.${p.flow}` as 'cy.flow.light') : null, p.note].filter(Boolean).join(' · ')}</Ink>
            </View>
          </Row>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {!p.end_date && p.start_date <= today ? <Button label={tr('cy.history.endToday')} size="sm" variant="ghost" loading={busy === `end-${p.id}`} onPress={() => endToday(p)} /> : null}
            <Button label={tr('common.edit')} size="sm" variant="ghost" onPress={() => edit(p)} />
            <Button label={tr('common.delete')} size="sm" variant="ghost" loading={busy === `del-${p.id}`} onPress={() => remove('period_entries', p.id, tr('cy.what.period'))} />
          </View>
        </Glass>
      ))}

      {/* Tests (saisie manuelle ; la lecture par photo est dans Fertilité) */}
      <Glass>
        <Ink variant="heading">{tr('cy.test.title')}</Ink>
        <Segmented label={tr('cy.test.kind')} value={testKind} onChange={(v) => { setTestKind(v); setTestResult(null); }} options={[{ value: 'ovulation_tests', label: tr('cy.test.ovulation') }, { value: 'pregnancy_tests', label: tr('cy.test.pregnancy') }]} />
        <Choices label={tr('cy.test.result')} options={TEST_RESULTS[testKind]} value={testResult} onChange={(v) => setTestResult(v as string | null)} labelOf={(r) => tr(`cy.test.r.${r}` as 'cy.test.r.negative')} />
        <Ink variant="caption" soft>{testKind === 'pregnancy_tests' ? tr('cy.test.pregnancyNote') : tr('cy.test.ovulationNote')}</Ink>
        <Button label={tr('cy.test.save')} variant="secondary" loading={busy === 'test'} onPress={saveTest} full />
        <Button label={tr('cy.test.photo')} icon="camera" variant="ghost" onPress={() => router.push(`/fertility/test/${testKind === 'ovulation_tests' ? 'ovulation' : 'pregnancy'}` as never)} full />
        {(tests ?? []).slice(0, 8).map((x) => (
          <Row key={x.id} style={{ justifyContent: 'space-between' }}>
            <Ink variant="small" style={{ flex: 1 }}>{`${tr(`cy.test.r.${x.result}` as 'cy.test.r.negative')} · ${fmtDay(x.tested_at.slice(0, 10))}`}</Ink>
            <Button label={tr('common.delete')} size="sm" variant="ghost" loading={busy === `del-${x.id}`} onPress={() => remove(testKind, x.id, tr('cy.what.test'))} />
          </Row>
        ))}
      </Glass>
    </Screen>
  );
}
