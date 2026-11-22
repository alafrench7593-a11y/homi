/** Onglet Suivi : selon le profil choisi (enfant, grossesse, moi). */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TAB_SCREEN_INSET } from '@/components/Dock';
import { TodaySummary } from '@/components/MiniApp';
import { PremiumGate, ProfileSwitcher } from '@/components/Family';
import { BarChart } from '@/components/Charts';
import { ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, EmptyStateCard, haptic, Icon, type IconName, ListRow, Row, SectionTitle, Segmented, Text } from '@/components/ui-extra';
import { Timeline, type LogItem } from '@/features/tracking';
import { DailyActions } from '@/features/dailyActions/DailyActions';
import { DayJournal } from '@/features/dayJournal/DayJournal';
import { QuickEntry } from '@/features/quickEntry';
import { DayRibbon, SleepNights } from '@/features/motionViz';
import { useActivePregnancy, useActiveSubject, useChildren, useLogs, useOpenSleep, usePregnancies, usePremium, useProfile, useTrackedChildren } from '@/lib/data/hooks';
import { useScope } from '@/lib/data/hooks-scope';
import { drunkMl, lastDaysSeries } from '@/lib/domain/daily';
import type { Bottle, Breastfeed, Diaper, LogKind, Meal, Observation, Pumping, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { ToolLinks } from '@/features/toolHub/ToolLinks';
import { toolName } from '@/lib/domain/toolCatalog';
import { formatDuration } from '@/lib/domain/dates';
import { Tappable } from '@/components/Tappable';
import { MotionItem, MotionList } from '@/motion/ListMotion';

function ChildTracking({ childId, journey }: { childId: string; journey?: 'baby' | 'child' | null }) {
  const t = useTheme();
  const premium = usePremium();
  const { data: children } = useChildren();
  const child = children?.find((c) => c.id === childId);
  const [range, setRange] = useState<'7' | '30'>('7');
  const days = Number(range);
  const qBottles = useLogs<Bottle>('bottle', childId, days);
  const qFeeds = useLogs<Breastfeed>('breastfeed', childId, days);
  const qPumpings = useLogs<Pumping>('pumping', childId, days);
  const qDiapers = useLogs<Diaper>('diaper', childId, days);
  const qSleeps = useLogs<Sleep>('sleep', childId, days);
  const qMeals = useLogs<Meal>('meal', childId, days);
  const qObs = useLogs<Observation>('observation', childId, days);
  const logQueries = [qBottles, qFeeds, qPumpings, qDiapers, qSleeps, qMeals, qObs];
  const logsLoading = logQueries.some((q) => q.isLoading && !q.data);
  const logsError = logQueries.find((q) => q.isError && !q.data);
  const retryLogs = () => logQueries.forEach((q) => { void q.refetch(); });
  const bottles = qBottles.data ?? [];
  const feeds = qFeeds.data ?? [];
  const pumpings = qPumpings.data ?? [];
  const diapers = qDiapers.data ?? [];
  const sleeps = qSleeps.data ?? [];
  const meals = qMeals.data ?? [];
  const obs = qObs.data ?? [];
  const openSleep = useOpenSleep(childId);

  const today = new Date().toDateString();
  const isToday = (iso: string) => new Date(iso).toDateString() === today;
  const todays: LogItem[] = useMemo(() => [
    ...bottles.filter((x) => isToday(x.at)).map((data) => ({ type: 'bottle' as const, data })),
    ...feeds.filter((x) => isToday(x.started_at)).map((data) => ({ type: 'breastfeed' as const, data })),
    ...pumpings.filter((x) => isToday(x.at)).map((data) => ({ type: 'pumping' as const, data })),
    ...diapers.filter((x) => isToday(x.at)).map((data) => ({ type: 'diaper' as const, data })),
    ...sleeps.filter((x) => isToday(x.started_at) || (x.ended_at && isToday(x.ended_at))).map((data) => ({ type: 'sleep' as const, data })),
    ...meals.filter((x) => isToday(x.at)).map((data) => ({ type: 'meal' as const, data })),
    ...obs.filter((x) => isToday(x.at)).map((data) => ({ type: 'observation' as const, data })),
  ], [bottles, feeds, pumpings, diapers, sleeps, meals, obs]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!child) return null;
  const chartDays = premium ? days : 7;
  // « Lait bu par jour » : seules les quantités BUES notées (une quantité préparée n'est pas une quantité bue)
  // La période choisie (7 / 30 jours) pilote les graphiques et leur libellé (audit 09 : « 30 jours » ne changeait
  // rien, les séries étaient tronquées à 7 barres) ; 30 jours = 30 barres quotidiennes, lisibles (Charts.barChartLayout)
  const bottleSeries = lastDaysSeries(chartDays, bottles, (b) => b.at, drunkMl);
  const diaperSeries = lastDaysSeries(chartDays, diapers, (d) => d.at, () => 1);
  const periodLabel = tr(chartDays === 30 ? 'trk.days30' : 'trk.days7');

  return (
    <View style={{ gap: spacing.md }}>
      {/* Planche 2 du brief client : le journal du jour (toutes natures mélangées par heure) passe en premier */}
      <DayJournal child={child} sleeps={sleeps} bottles={bottles} diapers={diapers} breastfeeds={feeds} loadedDays={days} />
      {/* Cartes de suivi : quatre actions utiles au profil, les autres dans « Voir tous les suivis » */}
      <DailyActions child={child} journey={journey ?? null} />
      <Tappable
        accessibilityRole="button"
        accessibilityLabel={openSleep ? tr('trk.night.a11yOpen') : tr('trk.night.a11yStart')}
        onPress={() => { haptic('light'); router.push('/night'); }}
        style={({ pressed }) => ({ borderRadius: radius.lg, padding: spacing.md, backgroundColor: t.tokens.inverse.fill, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed ? 0.9 : 1 })}
      >
        <Icon name="moon" color={t.tokens.inverse.accent} />
        <View style={{ flex: 1 }}>
          <Text weight="bold" color={t.tokens.inverse.text}>{openSleep ? tr('trk.night.ongoing') : tr('trk.night.title')}</Text>
          <Text variant="small" color={t.tokens.inverse.textMuted}>{openSleep ? tr('trk.night.ongoingHint') : tr('trk.night.hint')}</Text>
        </View>
        <Icon name="chevron-right" color={t.tokens.inverse.textMuted} />
      </Tappable>

      <QuickEntry activeChildId={childId} />

      <SectionTitle title={tr('trk.today')} />
      {logsLoading ? <Skeleton kind="list" rows={3} /> : logsError ? (
        <ErrorView error={logsError.error} onRetry={retryLogs} title={tr('trk.loadError')} />
      ) : (
        <>
          <TodaySummary title={tr('trk.today')} testID="track-tab-today" items={[
            { icon: 'droplet', value: String(bottles.filter((x) => isToday(x.at)).length + feeds.filter((x) => isToday(x.started_at)).length), label: toolName('baby_bottle') },
            { icon: 'wind', value: String(diapers.filter((x) => isToday(x.at)).length), label: toolName('baby_diaper') },
            { icon: 'moon', value: (() => {
              const m = sleeps.filter((x) => isToday(x.started_at) && x.ended_at).reduce((n, x) => n + (Date.parse(x.ended_at!) - Date.parse(x.started_at)) / 60000, 0);
              return m ? formatDuration(m) : '—';
            })(), label: toolName('kid_sleep') },
          ]} />
          <Card>
            <DayRibbon events={[
              ...sleeps.filter((x) => isToday(x.started_at) || (x.ended_at && isToday(x.ended_at)) || !x.ended_at).map((x) => ({ kind: 'sleep' as const, start: x.started_at, end: x.ended_at, nap: x.kind === 'nap' })),
              ...bottles.filter((x) => isToday(x.at)).map((x) => ({ kind: 'feed' as const, at: x.at })),
              ...feeds.filter((x) => isToday(x.started_at)).map((x) => ({ kind: 'feed' as const, at: x.started_at })),
              ...meals.filter((x) => isToday(x.at)).map((x) => ({ kind: 'feed' as const, at: x.at })),
              ...diapers.filter((x) => isToday(x.at)).map((x) => ({ kind: 'diaper' as const, at: x.at })),
              ...obs.filter((x) => isToday(x.at)).map((x) => ({ kind: 'obs' as const, at: x.at })),
            ]} />
          </Card>
          <Card><Timeline logs={todays} childId={childId} /></Card>
        </>
      )}

      <SectionTitle title={tr('trk.trends')} />
      <Segmented label={tr('trk.period')} value={range} onChange={setRange} options={[{ value: '7', label: tr('trk.days7') }, { value: '30', label: tr('trk.days30') }]} />
      {range === '30' && !premium ? (
        <PremiumGate feature={tr('trk.premiumCharts')}><View /></PremiumGate>
      ) : null}
      {child.enabled_tracking.includes('bottle') && (
        <Card testID="trk-chart-milk"><Text weight="bold">{tr('trk.chart.milk')}</Text><Text variant="caption" muted>{periodLabel}</Text><BarChart data={bottleSeries} unit="ml" accessibilityLabel={`${tr('trk.chart.milkA11y')}, ${periodLabel}`} /></Card>
      )}
      {child.enabled_tracking.includes('sleep') && (
        <Card><Text weight="bold">{tr('trk.chart.sleep')}</Text><Text variant="caption" muted>{tr('trk.days7')}</Text><View style={{ marginTop: spacing.xs }}><SleepNights sleeps={sleeps} days={7} /></View></Card>
      )}
      {child.enabled_tracking.includes('diaper') && (
        <Card testID="trk-chart-diapers"><Text weight="bold">{tr('trk.chart.diapers')}</Text><Text variant="caption" muted>{periodLabel}</Text><BarChart data={diaperSeries} unit={tr('trk.chart.diapersUnit')} accessibilityLabel={`${tr('trk.chart.diapersA11y')}, ${periodLabel}`} /></Card>
      )}
      <Text variant="caption" muted>{tr('trk.chart.disclaimer')}</Text>

      {/* Raccourcis du suivi quotidien : choix et ordre seulement, le reste vient du registre (les couches y gardent leur raccourci) */}
      <ToolLinks ids={CHILD_SHORTCUTS} filter={(x) => x.id !== 'baby_foods' || child.enabled_tracking.includes('meal')} allOf="care"
        title={tr('trk.child.profile', { name: child.first_name })} testID="track-child-tools" />
    </View>
  );
}

/** Raccourcis contextuels du suivi (identifiants du registre central : ni libellé, ni icône, ni route ici). */
const CHILD_SHORTCUTS = ['baby_diaper', 'kid_profile.growth', 'kid_profile', 'baby_foods', 'documents'] as const;
const PREGNANCY_SHORTCUTS = ['preg_evolution', 'preg_calendar', 'preg_feel', 'preg_eat', 'preg_weight', 'appointments', 'preg_lists', 'documents', 'preg_names'] as const;
/** Un seul des trois outils de cycle existe pour un profil (projet bébé, contraception, cycle) : les absents ne s'affichent pas. */
const ME_SHORTCUTS = ['mood', 'ttc_cycle', 'avoid_contraception', 'cycle_home', 'appointments'] as const;
const POSTPARTUM_SHORTCUTS = ['pp_checkin', 'pp_body', 'mood', 'sleep', 'baby_breastfeed'] as const;

function PregnancyTracking({ cards }: { cards?: boolean }) {
  const { data: profile } = useProfile();
  const pregnancy = useActivePregnancy();
  return (
    <View style={{ gap: spacing.md }}>
    {cards ? <DailyActions /> : null}
    <ToolLinks ids={PREGNANCY_SHORTCUTS} subject={pregnancy ? { type: 'pregnancy', id: pregnancy.id } : null} filter={(x) => x.id !== 'preg_weight' || !profile?.hide_weight_module}
      allOf="pregnancy" testID="track-preg" />
    </View>
  );
}

export default function Track() {
  // Profil affiché : un enfant né (bébé ou enfant), la grossesse, le post-partum, la famille ou moi — jamais mélangés
  const scope = useScope();
  const { subject } = useActiveSubject();
  const pregnancy = useActivePregnancy();
  const childrenQ = useTrackedChildren();
  const pregnanciesQ = usePregnancies();
  const children = childrenQ.data;
  // Les enfants suivis dépendent des parcours : tant qu'ils ne sont pas chargés, on n'affiche pas « aucun suivi »
  const journeysQ = scope.query;
  const loading = (childrenQ.isLoading && !children) || (pregnanciesQ.isLoading && !pregnanciesQ.data) || (!scope.loaded && !journeysQ.isError);
  const failed = childrenQ.isError && !children ? childrenQ : pregnanciesQ.isError && !pregnanciesQ.data ? pregnanciesQ : !scope.loaded && journeysQ.isError ? journeysQ : null;
  const cycle = scope.scope === 'avoid' || scope.scope === 'ttc' || scope.scope === 'cycle';
  return (
    <View style={{ flex: 1 }}>
      <Screen back account title={tr('screen.track.title')} bottomInset={TAB_SCREEN_INSET}>
        <ProfileSwitcher />
        {loading ? <Skeleton kind="card" rows={2} /> : failed ? (
          <ErrorView error={failed.error} onRetry={() => { void childrenQ.refetch(); void pregnanciesQ.refetch(); void journeysQ.refetch(); }} />
        ) : null}
        {subject.type === 'family' && <QuickEntry activeChildId={scope.childId} />}
        {!!scope.childId && <ChildTracking childId={scope.childId} journey={scope.scope === 'baby' ? 'baby' : scope.scope === 'child' ? 'child' : null} />}
        {scope.scope === 'pregnancy' && <PregnancyTracking cards />}
        {scope.scope === 'postpartum' && (
          <ToolLinks ids={POSTPARTUM_SHORTCUTS} allOf="pregnancy" testID="track-pp" />
        )}
        {subject.type === 'family' && (
          <View style={{ gap: spacing.md }}>
            {pregnancy && <PregnancyTracking />}
            <MotionList style={{ gap: spacing.md }}>{(children ?? []).map((c) => (
              <MotionItem key={c.id}><Card key={c.id} onPress={() => router.push(`/child/${c.id}`)}>
                <Row><Text weight="bold" style={{ flex: 1 }}>{c.first_name}</Text><Text variant="small" muted>{tr('pj.track.pick')}</Text></Row>
              </Card></MotionItem>
            ))}</MotionList>
          </View>
        )}
        {(cycle || scope.scope === 'none') && subject.type !== 'family' ? <DailyActions /> : null}
        {(cycle || scope.scope === 'none') && subject.type !== 'family' && (
          <ToolLinks ids={ME_SHORTCUTS} allOf={cycle ? ['cycle', 'health'] : 'health'} testID="track-me" />
        )}
        {!loading && !failed && !pregnancy && !children?.length && !cycle && scope.scope !== 'postpartum' && (
          <EmptyStateCard illustration="leaf" title={tr('trk.empty.title')} text={tr('pj.none.body')} action={<Button label={tr('pj.editJourney')} icon="compass" onPress={() => router.push('/journeys')} />} />
        )}
        {!!scope.childId && <Banner tone="info">{tr('trk.healthBookNotice')}</Banner>}
      </Screen>
    </View>
  );
}
