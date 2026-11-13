/** Onglet Suivi : selon le profil choisi (enfant, grossesse, moi). */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { PremiumGate, ProfileSwitcher } from '@/components/Family';
import { BarChart } from '@/components/Charts';
import { ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, EmptyStateCard, haptic, Icon, type IconName, ListRow, Row, SectionTitle, Segmented, Text } from '@/components/ui-extra';
import { Timeline, type LogItem } from '@/features/tracking';
import { DailyActions } from '@/features/dailyActions/DailyActions';
import { QuickEntry } from '@/features/quickEntry';
import { DayRibbon, SleepNights } from '@/features/motionViz';
import { useActivePregnancy, useActiveSubject, useChildren, useLogs, useOpenSleep, usePregnancies, usePremium, useProfile, useTrackedChildren } from '@/lib/data/hooks';
import { useScope } from '@/lib/data/hooks-scope';
import { lastDaysSeries } from '@/lib/domain/daily';
import type { Bottle, Breastfeed, Diaper, LogKind, Meal, Observation, Pumping, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { formatDuration } from '@/lib/domain/dates';
import { Tappable } from '@/components/Tappable';

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
  const bottleSeries = lastDaysSeries(Math.min(chartDays, 7), bottles, (b) => b.at, (b) => b.consumed_ml ?? b.prepared_ml ?? 0);
  const diaperSeries = lastDaysSeries(Math.min(chartDays, 7), diapers, (d) => d.at, () => 1);

  return (
    <View style={{ gap: spacing.md }}>
      {/* Cartes de suivi en premier : quatre actions utiles au profil, les autres dans « Voir tous les suivis » */}
      <DailyActions child={child} journey={journey ?? null} />
      <Tappable
        accessibilityRole="button"
        accessibilityLabel={openSleep ? tr('trk.night.a11yOpen') : tr('trk.night.a11yStart')}
        onPress={() => { haptic('light'); router.push('/night'); }}
        style={({ pressed }) => ({ borderRadius: radius.lg, padding: spacing.md, backgroundColor: '#1B2140', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed ? 0.9 : 1 })}
      >
        <Icon name="moon" color="#FF8FB1" />
        <View style={{ flex: 1 }}>
          <Text weight="bold" color="#F2DFC1">{openSleep ? tr('trk.night.ongoing') : tr('trk.night.title')}</Text>
          <Text variant="small" color="#B8A88F">{openSleep ? tr('trk.night.ongoingHint') : tr('trk.night.hint')}</Text>
        </View>
        <Icon name="chevron-right" color="#B8A88F" />
      </Tappable>

      <QuickEntry activeChildId={childId} />

      <SectionTitle title={tr('trk.today')} />
      {logsLoading ? <Skeleton kind="list" rows={3} /> : logsError ? (
        <ErrorView error={logsError.error} onRetry={retryLogs} title={tr('trk.loadError')} />
      ) : (
        <>
          <TodaySummary title={tr('trk.today')} testID="track-tab-today" items={[
            { icon: 'droplet', value: String(bottles.filter((x) => isToday(x.at)).length + feeds.filter((x) => isToday(x.started_at)).length), label: tr('tool.baby_bottle') },
            { icon: 'wind', value: String(diapers.filter((x) => isToday(x.at)).length), label: tr('tool.baby_diaper') },
            { icon: 'moon', value: (() => {
              const m = sleeps.filter((x) => isToday(x.started_at) && x.ended_at).reduce((n, x) => n + (Date.parse(x.ended_at!) - Date.parse(x.started_at)) / 60000, 0);
              return m ? formatDuration(m) : '—';
            })(), label: tr('tool.kid_sleep') },
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
        <Card><Text weight="bold">{tr('trk.chart.milk')}</Text><BarChart data={bottleSeries} unit="ml" accessibilityLabel={tr('trk.chart.milkA11y')} /></Card>
      )}
      {child.enabled_tracking.includes('sleep') && (
        <Card><Text weight="bold">{tr('trk.chart.sleep')}</Text><View style={{ marginTop: spacing.xs }}><SleepNights sleeps={sleeps} days={7} /></View></Card>
      )}
      {child.enabled_tracking.includes('diaper') && (
        <Card><Text weight="bold">{tr('trk.chart.diapers')}</Text><BarChart data={diaperSeries} unit={tr('trk.chart.diapersUnit')} accessibilityLabel={tr('trk.chart.diapersA11y')} /></Card>
      )}
      <Text variant="caption" muted>{tr('trk.chart.disclaimer')}</Text>

      <SectionTitle title={tr('trk.child.profile', { name: child.first_name })} />
      <Card>
        <ListRow icon="trending-up" title={tr('trk.child.growth')} subtitle={tr('trk.child.growthSub')} onPress={() => router.push(`/child/${childId}/growth`)} />
        <ListRow icon="user" title={tr('trk.child.health')} subtitle={tr('trk.child.healthSub')} onPress={() => router.push(`/child/${childId}`)} />
        {child.enabled_tracking.includes('meal') && <ListRow icon="feather" title={tr('trk.child.foods')} subtitle={tr('trk.child.foodsSub')} onPress={() => router.push(`/child/${childId}/foods`)} />}
        <ListRow icon="folder" title={tr('trk.documents')} subtitle={tr('trk.child.documentsSub')} onPress={() => router.push('/documents')} />
      </Card>
    </View>
  );
}

function PregnancyTracking({ cards }: { cards?: boolean }) {
  const { data: profile } = useProfile();
  const pregnancy = useActivePregnancy();
  return (
    <View style={{ gap: spacing.md }}>
    {cards ? <DailyActions /> : null}
    <Card>
      <ListRow icon="moon" title={tr('trk.preg.weekly')} subtitle={tr('trk.preg.weeklySub')} onPress={() => router.push('/pregnancy')} />
      <ListRow icon="calendar" title={tr('tool.preg_calendar')} subtitle={tr('care.cal.subtitle')} onPress={() => router.push('/pregnancy/calendar' as never)} testID="track-preg-calendar" />
      <ListRow icon="feather" title={tr('tool.preg_feel')} onPress={() => router.push('/pregnancy/feel' as never)} />
      <ListRow icon="coffee" title={tr('tool.preg_eat')} onPress={() => router.push('/pregnancy/eat' as never)} />
      {!profile?.hide_weight_module && <ListRow icon="trending-up" title={tr('trk.preg.weight')} subtitle={tr('trk.preg.weightSub')} onPress={() => router.push('/pregnancy/weight')} />}
      <ListRow icon="calendar" title={tr('trk.preg.appointments')} subtitle={tr('trk.preg.appointmentsSub')} onPress={() => router.push('/appointments')} />
      <ListRow icon="check-square" title={tr('trk.preg.lists')} subtitle={tr('trk.preg.listsSub')} onPress={() => router.push('/lists')} />
      <ListRow icon="folder" title={tr('trk.documents')} subtitle={tr('trk.preg.documentsSub')} onPress={() => router.push('/documents')} />
      <ListRow icon="star" title={tr('trk.preg.names')} subtitle={tr('trk.preg.namesSub')} onPress={() => router.push('/names')} />
    </Card>
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
      <Screen account title={tr('screen.track.title')} bottomInset={96}>
        <ProfileSwitcher />
        {loading ? <Skeleton kind="card" rows={2} /> : failed ? (
          <ErrorView error={failed.error} onRetry={() => { void childrenQ.refetch(); void pregnanciesQ.refetch(); void journeysQ.refetch(); }} />
        ) : null}
        {subject.type === 'family' && <QuickEntry activeChildId={scope.childId} />}
        {!!scope.childId && <ChildTracking childId={scope.childId} journey={scope.scope === 'baby' ? 'baby' : scope.scope === 'child' ? 'child' : null} />}
        {scope.scope === 'pregnancy' && <PregnancyTracking cards />}
        {scope.scope === 'postpartum' && (
          <Card>
            <ListRow icon="edit-3" title={tr('tool.pp_checkin')} onPress={() => router.push('/postpartum/checkin')} />
            <ListRow icon="feather" title={tr('tool.pp_body')} onPress={() => router.push('/postpartum/recovery')} />
            <ListRow icon="smile" title={tr('tool.mood')} onPress={() => router.push('/me/mood')} />
            <ListRow icon="cloud" title={tr('tool.sleep')} onPress={() => router.push('/me/sleep')} />
            {scope.babyId ? <ListRow icon="droplet" title={tr('tool.pp_feeding')} onPress={() => router.push(`/track/breastfeed?child=${scope.babyId}`)} /> : null}
            {scope.babyId ? <ListRow icon="heart" title={tr('tool.feeding_home')} subtitle={tr('tool.feeding_home.sub')} onPress={() => router.push(`/feeding?child=${scope.babyId}`)} testID="track-feeding-home" /> : null}
          </Card>
        )}
        {subject.type === 'family' && (
          <View style={{ gap: spacing.md }}>
            {pregnancy && <PregnancyTracking />}
            {(children ?? []).map((c) => (
              <Card key={c.id} onPress={() => router.push(`/child/${c.id}`)}>
                <Row><Text weight="bold" style={{ flex: 1 }}>{c.first_name}</Text><Text variant="small" muted>{tr('pj.track.pick')}</Text></Row>
              </Card>
            ))}
          </View>
        )}
        {(cycle || scope.scope === 'none') && subject.type !== 'family' ? <DailyActions /> : null}
        {(cycle || scope.scope === 'none') && subject.type !== 'family' && (
          <Card>
            <ListRow icon="heart" title={tr('trk.me.mood')} subtitle={tr('trk.me.moodSub')} onPress={() => router.push('/me/mood')} />
            {cycle ? <ListRow icon="circle" title={tr('trk.me.cycle')} subtitle={tr('trk.me.cycleSub')} onPress={() => router.push(scope.scope === 'ttc' ? '/fertility' : '/cycle')} /> : null}
            <ListRow icon="calendar" title={tr('trk.me.appointments')} onPress={() => router.push('/appointments')} />
          </Card>
        )}
        {!loading && !failed && !pregnancy && !children?.length && !cycle && scope.scope !== 'postpartum' && (
          <EmptyStateCard illustration="leaf" title={tr('trk.empty.title')} text={tr('pj.none.body')} action={<Button label={tr('pj.editJourney')} icon="compass" onPress={() => router.push('/journeys')} />} />
        )}
        {!!scope.childId && <Banner tone="info">{tr('trk.healthBookNotice')}</Banner>}
      </Screen>
    </View>
  );
}
