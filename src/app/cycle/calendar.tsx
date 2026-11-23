/**
 * Calendrier du cycle : vue mensuelle navigable, règles ENREGISTRÉES (pleines) distinctes des règles ESTIMÉES (pointillés),
 * fenêtre fertile estimée, symptômes, pertes, saignements, tests, journal, rendez-vous. Détail du jour + raccourcis de saisie.
 * Chaque information a une forme ET une couleur (jamais la couleur seule) et une description pour les lecteurs d'écran.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { confirm, useToast } from '@/components/Overlays';
import { backend, eq } from '@/lib/backend';
import { useUserId } from '@/lib/auth';
import { useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useScope } from '@/lib/data/hooks-scope';
import { insertOrQueue } from '@/lib/offline';
import { cycleHistory, estimateCycle, periodDelay, projectFertileWindows } from '@/lib/domain/cycle';
import { ObjectiveRow, useObjective } from '@/features/cycle/Objective';
import { ListRow } from '@/components/ui';
import { dayActions, type DayAction } from '@/lib/domain/cycleCalendar';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { Button, haptic, IconButton, Row } from '@/components/ui';
import { useAppointments, usePeriods, useTests } from '@/lib/data/hooks';
import { useAllSymptomLogs, useBleedingLogs, useCycleJournal, useDischargeLogs } from '@/lib/data/hooks-cycle2';
import { todayISO } from '@/lib/domain/dates';
import { monthCells, symptomKeysOf, type DayCell } from '@/lib/domain/cycleV2';
import { Glass, Ink, LegendDot, useCyclePalette } from '@/features/cycle/kit';
import { fmtDay } from '@/features/cycle/format';
import { formatDate, t as tr } from '@/i18n';
import { springTo } from '@/theme/motion';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { ErrorView, Skeleton } from '@/components/States';
import { APP_META, appName, useCycleSources, type CycleApp } from '@/features/cycleTrack/CycleOverview';
import { categoryDays, parseDayParam } from '@/lib/domain/cycleTrack';
import { Glass as GlassPanel } from '@/components/glass';
import { Icon, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius } from '@/theme/tokens';

export default function CycleCalendar() {
  const c = useCyclePalette();
  const reduce = useReduceMotion();
  const today = todayISO();
  const th = useTheme();
  // Jour choisi conservé dans l'adresse (« ?day=AAAA-MM-JJ ») : il survit au retour d'une app ouverte depuis ce jour
  const params = useLocalSearchParams<{ day?: string }>();
  const selIso = parseDayParam(params.day, '9999-12-31', today);
  const [ym, setYm] = useState(() => ({ y: +selIso.slice(0, 4), m: +selIso.slice(5, 7) - 1 }));
  const setDay = (d: DayCell | null) => router.setParams({ day: d ? d.iso : undefined } as never);
  const sources = useCycleSources({ intimate: true });
  const periodsQ = usePeriods();
  const periods = periodsQ.data;
  // Tant que les règles ne sont pas chargées, aucune action : sinon un jour semble vide et propose « Début des règles » (doublon)
  const periodsReady = periodsQ.isSuccess;
  const { data: symptoms } = useAllSymptomLogs();
  const { data: discharge } = useDischargeLogs();
  const { data: bleeding } = useBleedingLogs();
  const { data: journal } = useCycleJournal();
  const { data: ovu } = useTests('ovulation_tests');
  const { data: preg } = useTests('pregnancy_tests');
  const { data: appts } = useAppointments();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const scope = useScope();
  const [busy, setBusy] = useState(false);
  const rows = useMemo(() => (periods ?? []) as { id: string; start_date: string; end_date?: string | null }[], [periods]);
  const est = useMemo(() => estimateCycle(periods ?? [], today), [periods, today]);
  const next = useMemo(() => projectFertileWindows(est, 1)[0] ?? null, [est]);
  const history = useMemo(() => cycleHistory(periods ?? [], today), [periods, today]);
  const delay = useMemo(() => periodDelay(periods ?? [], today), [periods, today]);
  const objective = useObjective();

  /** Toucher un jour : début, fin, début plus tôt, suppression (avec confirmation). */
  async function apply(a: DayAction) {
    if (!day || busy || !periodsReady) return;
    if (a.kind === 'delete' && !(await confirm(tr('cyc.deleteTitle'), tr('cyc.deleteBody'), tr('common.delete')))) return;
    setBusy(true);
    try {
      if (a.kind === 'start') await insertOrQueue('period_entries', { user_id: userId, start_date: day.iso, end_date: null, flow: null, note: null });
      else if (a.kind === 'end') await backend.update('period_entries', { end_date: day.iso }, [eq('id', a.id)]);
      else if (a.kind === 'moveStart') await backend.update('period_entries', { start_date: day.iso }, [eq('id', a.id)]);
      else await backend.remove('period_entries', [eq('id', a.id)]);
      inv('period_entries');
      haptic('success');
      toast(tr(`cyc.done.${a.kind}` as 'cyc.done.start'));
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  const cells = useMemo(() => monthCells(ym.y, ym.m, {
    periods: periods ?? [], symptoms: symptoms ?? [], discharge: discharge ?? [], bleeding: bleeding ?? [], journal: journal ?? [],
    tests: [...(ovu ?? []), ...(preg ?? [])].map((x) => ({ tested_at: x.tested_at })),
    appointments: (appts ?? []).filter((a) => a.for_parent).map((a) => ({ starts_at: a.starts_at })),
  }, today), [ym, periods, symptoms, discharge, bleeding, journal, ovu, preg, appts, today]);

  // Transition de mois : glissement léger (supprimé si mouvement réduit)
  const slide = useRef(new Animated.Value(0)).current;
  const go = (d: -1 | 1) => {
    haptic('selection');
    slide.setValue(reduce ? 0 : d * 24);
    setYm(({ y, m }) => { const n = m + d; return { y: y + Math.floor(n / 12), m: ((n % 12) + 12) % 12 }; });
    springTo(slide, 0, 'gentle', reduce).start();
  };
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderRelease: (_e, g) => { if (g.dx < -40) go(1); else if (g.dx > 40) go(-1); },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const monthLabel = formatDate(`${ym.y}-${String(ym.m + 1).padStart(2, '0')}-15T12:00:00`, { month: 'long', year: 'numeric' });
  const weekdays = Array.from({ length: 7 }, (_, i) => formatDate(`2026-10-${String(12 + i).padStart(2, '0')}T12:00:00`, { weekday: 'narrow' }));
  const describe = (d: DayCell) => [
    fmtDay(d.iso, { weekday: 'long', day: 'numeric', month: 'long' }), d.today ? tr('cy.cal.today') : null,
    d.period ? tr('cy.cal.period') : null, d.estimatedPeriod ? tr('cy.cal.periodEstimate') : null, d.estimatedFertile ? tr('cy.cal.fertileEstimate') : null,
    d.symptoms ? tr('cy.cal.symptoms') : null, d.discharge ? tr('cy.cal.discharge') : null, d.bleeding ? tr('cy.cal.bleeding') : null,
    d.tests ? tr('cy.cal.tests') : null, d.journal ? tr('cy.cal.journal') : null, d.appointment ? tr('cy.cal.appointment') : null,
  ].filter(Boolean).join(', ');

  // Jour choisi : la case du mois affiché (le jour reste choisi quand on change de mois)
  const day = cells.find((x) => x.iso === selIso) ?? null;
  // Le mois suit un jour choisi depuis l'adresse (retour d'une app, lien de la catégorie)
  useEffect(() => { setYm({ y: +selIso.slice(0, 4), m: +selIso.slice(5, 7) - 1 }); }, [selIso]);
  // « Ajouter aujourd'hui » : choisit aujourd'hui (revient au mois en cours si besoin) ; le détail du jour est juste dessous
  function openToday() {
    if (!periodsReady) return;
    haptic('selection');
    setYm({ y: +today.slice(0, 4), m: +today.slice(5, 7) - 1 });
    router.setParams({ day: today } as never);
  }
  const noted = day ? categoryDays(sources, [day.iso])[0].apps : [];
  const acts = day && periodsReady ? dayActions(day.iso, rows, today) : { covering: null, actions: [] as DayAction[] };
  const short = (iso: string) => fmtDay(iso, { day: 'numeric', month: 'short' });

  const daySymptoms = day ? (symptoms ?? []).filter((s) => s.logged_on === day.iso).flatMap((s) => symptomKeysOf(s)) : [];

  return (
    <Screen back title={tr('pj.cycleHub')} subtitle={tr('cy.cal.subtitle')}
      action={{ label: tr('c3.home.add'), icon: 'plus', onPress: openToday, testID: 'cal-add-today' }}>
      <TodaySummary title={tr('cyc.estimates')} items={[
        { icon: 'droplet', value: next ? short(next.nextPeriod) : '—', label: tr('cy.hc.item.next') },
        { icon: 'sun', value: next ? `${short(next.start)} – ${short(next.end)}` : '—', label: tr('cy.hc.item.fertile') },
        { icon: 'circle', value: next ? short(next.ovulation) : '—', label: tr('cy.ring.legend.ovulation') },
      ]} />
      <ObjectiveRow />
      <Glass>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconButton icon="chevron-left" label={tr('cy.cal.prev')} onPress={() => go(-1)} />
          <Ink variant="heading" center style={{ flex: 1 }}>{monthLabel.replace(/^./, (x) => x.toUpperCase())}</Ink>
          <IconButton icon="chevron-right" label={tr('cy.cal.next')} onPress={() => go(1)} />
        </Row>
        {periodsQ.isError ? (
          <ErrorView error={periodsQ.error} onRetry={() => periodsQ.refetch()} />
        ) : !periodsReady ? (
          <Skeleton kind="card" rows={3} />
        ) : (
        <Animated.View {...swipe.panHandlers} style={{ transform: [{ translateX: slide }], gap: 4 }}>
          <View style={{ flexDirection: 'row' }}>{weekdays.map((w, i) => <View key={i} style={{ flex: 1 }}><Ink variant="caption" soft center>{w.toUpperCase()}</Ink></View>)}</View>
          {Array.from({ length: cells.length / 7 }, (_, w) => (
            <View key={w} style={{ flexDirection: 'row', gap: 4 }}>
              {cells.slice(w * 7, w * 7 + 7).map((d) => (
                <Tappable key={d.iso} accessibilityRole="button" accessibilityState={{ selected: d.iso === selIso }} testID={`cal-day-${d.iso}`} accessibilityLabel={describe(d)} onPress={() => { haptic('selection'); setDay(d); }}
                  style={({ pressed }) => ({ flex: 1, aspectRatio: 1, maxHeight: 52, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', opacity: d.inMonth ? 1 : 0.38,
                    backgroundColor: d.period ? c.period : d.estimatedFertile ? c.fertile : pressed ? c.pearl : 'transparent',
                    borderWidth: d.iso === selIso ? 3 : d.estimatedPeriod ? 1.5 : d.today ? 1.5 : 0, borderStyle: d.iso !== selIso && d.estimatedPeriod ? 'dashed' : 'solid', borderColor: d.iso === selIso ? th.colors.text : d.estimatedPeriod ? c.period : c.mauve })}>
                  <Ink variant="small" weight={d.today || d.iso === selIso ? 'bold' : undefined} style={{ color: d.period ? c.onAccent : c.ink }}>{String(+d.iso.slice(8, 10))}</Ink>
                  <View style={{ flexDirection: 'row', gap: 2, position: 'absolute', bottom: 3 }}>
                    {d.symptoms ? <LegendDot kind="symptom" /> : null}
                    {d.discharge ? <LegendDot kind="discharge" /> : null}
                    {d.journal || d.tests || d.bleeding || d.appointment ? <LegendDot kind="note" /> : null}
                  </View>
                </Tappable>
              ))}
            </View>
          ))}
        </Animated.View>
        )}
        {/* Légende : forme + couleur + texte */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs }}>
          {(['period', 'estimate', 'fertile', 'symptom', 'discharge', 'note'] as const).map((k) => (
            <Row key={k} gap={6}><LegendDot kind={k} /><Ink variant="caption" soft>{tr(`cy.cal.legend.${k}` as 'cy.cal.legend.period')}</Ink></Row>
          ))}
        </View>
        <Ink variant="caption" soft>{tr('cy.cal.estimateNote')}</Ink>
      </Glass>
      <Button label={tr('cy.cal.today')} variant="ghost" icon="target" onPress={() => setYm({ y: +today.slice(0, 4), m: +today.slice(5, 7) - 1 })} />
      <Ink variant="caption" soft>{tr('cyc.tapHint')}</Ink>
      {/* Jour choisi (adresse « ?day= ») : ce qui est noté, actions des règles et saisies de ce jour */}
      {day ? (
        <GlassPanel variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.xs }} testID="cal-day-panel">
          <Text variant="label" accessibilityRole="header" testID="cal-day-title">{fmtDay(day.iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^./, (x) => x.toUpperCase())}</Text>
        {day ? (
          <View style={{ gap: spacing.sm }}>
            {day.period ? <Ink>{tr('cy.cal.period')}</Ink> : null}
            {day.estimatedPeriod ? <Ink>{tr('cy.cal.periodEstimate')}</Ink> : null}
            {day.estimatedFertile ? <Ink>{tr('cy.cal.fertileEstimate')}</Ink> : null}
            {daySymptoms.length ? <Ink>{tr('cy.cal.symptomsList', { list: daySymptoms.map((k) => tr(`cy.sym.${k}` as 'cy.sym.cramps')).join(', ') })}</Ink> : null}
            {/* Ce qui est noté ce jour-là, app par app (même source que chaque app) → l'app s'ouvre sur ce jour */}
            {noted.filter((x) => x.app !== 'period').map(({ app, count }) => (
              <Tappable key={app} accessibilityRole="button" testID={`cal-noted-${app}`} onPress={() => router.push(APP_META[app as CycleApp].href(day.iso) as never)}
                accessibilityLabel={`${appName(app as CycleApp)}. ${tr('cy.tk.notes', { count })}. ${tr('cy.tk.openApp')}`}
                style={({ pressed }) => ({ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed ? 0.6 : 1 })}>
                <Text weight="bold" variant="small" muted style={{ width: 64 }}>{tr('cy.tk.allDay')}</Text>
                <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: th.colors.border }}>
                  <Icon name={APP_META[app as CycleApp].icon} size={15} color={th.colors.text} />
                </View>
                <Text weight="medium" style={{ flex: 1 }}>{appName(app as CycleApp)}</Text>
                <Text variant="small" muted style={{ fontVariant: ['tabular-nums'] }}>{tr('cy.tk.notes', { count })}</Text>
                <Icon name="chevron-right" size={16} color={th.colors.textMuted} />
              </Tappable>
            ))}
            {!day.period && !day.estimatedPeriod && !noted.length ? (
              <View testID="cal-day-nothing" style={{ minHeight: 48, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: th.colors.border, alignItems: 'center', justifyContent: 'center', padding: spacing.sm }}>
                <Ink soft>{tr('cy.cal.nothing')}</Ink>
              </View>
            ) : null}
            {acts.covering ? <View testID="cal-covering"><Ink>{tr('cyc.covering', { from: fmtDay(acts.covering.start_date, { day: 'numeric', month: 'long' }), to: acts.covering.end_date ? fmtDay(acts.covering.end_date, { day: 'numeric', month: 'long' }) : tr('cyc.ongoing') })}</Ink></View> : null}
            {acts.actions.length ? (
              <View style={{ gap: spacing.xs }}>
                {acts.actions.map((a) => (
                  <Button key={a.kind + ('id' in a ? a.id : '')} label={tr(`cyc.act.${a.kind}` as 'cyc.act.start')} variant={a.kind === 'delete' ? 'ghost' : 'primary'} icon={a.kind === 'delete' ? 'trash-2' : 'droplet'} loading={busy} full testID={`cal-act-${a.kind}`} onPress={() => apply(a)} />
                ))}
              </View>
            ) : null}
            {day.iso <= today ? (
              <View style={{ gap: spacing.xs }}>
                <Button label={tr('cy.cal.addSymptoms')} variant="secondary" onPress={() => { router.push(`/cycle/symptoms?date=${day.iso}` as never); }} full />
                <Button label={tr('cy.cal.addPain')} variant="secondary" onPress={() => { router.push(`/cycle/pain?date=${day.iso}` as never); }} full />
                <Button label={tr('cy.cal.addDischarge')} variant="secondary" onPress={() => { router.push(`/cycle/discharge/new?date=${day.iso}` as never); }} full />
                <Button label={tr('cy.cal.addJournal')} variant="secondary" onPress={() => { router.push(`/cycle/journal?date=${day.iso}` as never); }} full />
                <Button label={tr('cyc.editAll')} variant="ghost" onPress={() => { router.push('/cycle?all=1' as never); }} full />
              </View>
            ) : <Ink variant="caption" soft>{tr('cy.cal.future')}</Ink>}
          </View>
        ) : null}
        </GlassPanel>
      ) : null}

      {/* Estimations (approximatives) */}
      <Glass>
        <View testID="cal-estimates" style={{ gap: 4 }}>
          <Ink weight="bold">{tr('cyc.estimates')}</Ink>
          {next ? (
            <>
              <Ink variant="small">{tr('cyc.nextPeriod', { date: fmtDay(next.nextPeriod, { day: 'numeric', month: 'long' }) })}</Ink>
              <Ink variant="small">{tr('cyc.fertile', { from: fmtDay(next.start, { day: 'numeric', month: 'long' }), to: fmtDay(next.end, { day: 'numeric', month: 'long' }) })}</Ink>
              <View testID="cal-ovulation"><Ink variant="small">{tr('cyh.ovulation', { date: fmtDay(next.ovulation, { day: 'numeric', month: 'long' }) })}</Ink></View>
              {est.averageLength ? <Ink variant="small">{tr('cyc.average', { count: Math.round(est.averageLength) })}</Ink> : null}
            </>
          ) : <Ink variant="small" soft>{tr('cyc.needMore')}</Ink>}
          <Ink variant="caption" soft>{tr('cyc.approx')}</Ink>
          {delay ? <View testID="cal-delay"><Ink variant="small" weight="bold">{tr('cyh.late', { count: delay })}</Ink></View> : null}
          {scope.scope === 'avoid' ? <View testID="cal-avoid-warning"><Ink variant="caption" weight="bold">{tr('cyc.avoidWarning')}</Ink></View> : null}
        </View>
      </Glass>

      {/* Selon l'objectif : au quotidien (tous), éviter une grossesse, concevoir */}
      <Glass>
        <View testID="cal-section-daily" style={{ gap: 0 }}>
          <Ink weight="bold">{tr('cyh.section.cycle')}</Ink>
          <ListRow icon="activity" title={tr('cyh.l.symptoms')} onPress={() => router.push('/cycle/symptoms' as never)} />
          <ListRow icon="smile" title={tr('cyh.l.mood')} onPress={() => router.push('/me/mood' as never)} />
          <ListRow icon="zap" title={tr('cyh.l.pain')} onPress={() => router.push('/cycle/pain' as never)} />
          <ListRow icon="droplet" title={tr('cyh.l.discharge')} onPress={() => router.push('/cycle/discharge' as never)} />
          <ListRow icon="lock" title={tr('cyh.l.intimacy')} onPress={() => router.push('/cycle/intimacy' as never)} />
          <ListRow icon="edit-3" title={tr('cyh.l.journal')} onPress={() => router.push('/cycle/journal' as never)} />
        </View>
      </Glass>
      {objective === 'avoid' ? (
        <Glass>
          <View testID="cal-section-avoid">
            <Ink weight="bold">{tr('cyh.section.avoid')}</Ink>
            <Ink variant="caption" weight="bold">{tr('cyh.avoidNote')}</Ink>
            <ListRow icon="list" title={tr('cyh.l.methods')} onPress={() => router.push('/contraception/methods' as never)} />
            <ListRow icon="bell" title={tr('cyh.l.pill')} onPress={() => router.push('/contraception/reminders' as never)} />
            <ListRow icon="refresh-cw" title={tr('cyh.l.renewal')} onPress={() => router.push('/contraception/reminders' as never)} />
            <ListRow icon="alert-circle" title={tr('cyh.l.emergency')} onPress={() => router.push('/contraception/emergency' as never)} />
            <ListRow icon="clipboard" title={tr('cyh.l.consult')} onPress={() => router.push('/contraception/consultation' as never)} />
          </View>
        </Glass>
      ) : null}
      {objective === 'ttc' ? (
        <Glass>
          <View testID="cal-section-ttc">
            <Ink weight="bold">{tr('cyh.section.ttc')}</Ink>
            <ListRow icon="check-circle" title={tr('cyh.l.tests')} onPress={() => router.push('/fertility/log' as never)} />
            <ListRow icon="search" title={tr('cyh.l.mucus')} onPress={() => router.push('/fertility/mucus' as never)} />
            <ListRow icon="thermometer" title={tr('cyh.l.temperature')} onPress={() => router.push('/fertility/body' as never)} />
            <ListRow icon="bell" title={tr('cyh.l.reminders')} onPress={() => router.push('/fertility/reminders' as never)} />
            <Button label={tr('cyh.l.positive')} icon="heart" onPress={() => router.push('/pregnancy/start' as never)} testID="cal-positive" full />
            <Ink variant="caption" soft>{tr('cyh.positiveHint')}</Ink>
          </View>
        </Glass>
      ) : null}

      {/* Cycles précédents, avec leur durée */}
      <Glass>
        <View testID="cal-history" style={{ gap: 4 }}>
          <Ink weight="bold">{tr('cyc.history')}</Ink>
          {!history.length ? <Ink variant="small" soft>{tr('cyc.historyEmpty')}</Ink> : history.slice(0, 12).map((h) => (
            <Row key={h.start} style={{ justifyContent: 'space-between' }}>
              <Ink variant="small" style={{ flex: 1 }}>{tr('cyc.cycleFrom', { date: fmtDay(h.start, { day: 'numeric', month: 'long', year: 'numeric' }) })}</Ink>
              <Ink variant="small" soft>{h.current ? tr('cyc.current') : tr('cyc.length', { count: h.length ?? 0 })}{h.periodLength ? ` · ${tr('cyc.periodLength', { count: h.periodLength })}` : ''}{h.unusual ? ` · ${tr('cyc.unusual')}` : ''}</Ink>
            </Row>
          ))}
          {est.averageLength ? <Ink variant="caption" soft>{tr('cyc.average', { count: Math.round(est.averageLength) })}</Ink> : null}
        </View>
      </Glass>

    </Screen>
  );
}
