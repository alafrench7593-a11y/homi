/** Onglet Suivi : selon le profil choisi (enfant, grossesse, moi). */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PremiumGate, ProfileSwitcher } from '@/components/Family';
import { BarChart } from '@/components/Charts';
import { ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, EmptyStateCard, haptic, Icon, type IconName, ListRow, Row, SectionTitle, Segmented, Text } from '@/components/ui-extra';
import { Timeline, type LogItem } from '@/features/tracking';
import { ChildTrackCards, PregnancyTrackCards } from '@/features/trackCards';
import { QuickEntry } from '@/features/quickEntry';
import { DayRibbon, SleepNights } from '@/features/motionViz';
import { useActivePregnancy, useActiveSubject, useChildren, useLogs, useOpenSleep, usePregnancies, usePremium, useProfile, useTrackedChildren } from '@/lib/data/hooks';
import { useScope } from '@/lib/data/hooks-scope';
import { lastDaysSeries } from '@/lib/domain/daily';
import type { Bottle, Breastfeed, Diaper, LogKind, Meal, Observation, Pumping, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
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
      <ChildTrackCards child={child} journey={journey} />
      <Tappable
        accessibilityRole="button"
        accessibilityLabel={openSleep ? 'Sommeil en cours. Ouvrir le mode nuit.' : 'Démarrer un sommeil en mode nuit'}
        onPress={() => { haptic('light'); router.push('/night'); }}
        style={({ pressed }) => ({ borderRadius: radius.lg, padding: spacing.md, backgroundColor: '#1B2140', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed ? 0.9 : 1 })}
      >
        <Icon name="moon" color="#FF8FB1" />
        <View style={{ flex: 1 }}>
          <Text weight="bold" color="#F2DFC1">{openSleep ? 'Sommeil en cours' : 'Mode nuit'}</Text>
          <Text variant="small" color="#B8A88F">{openSleep ? 'Touchez pour arrêter ou noter un réveil' : 'Écran apaisé pour les nuits : sommeil, tétées, couches'}</Text>
        </View>
        <Icon name="chevron-right" color="#B8A88F" />
      </Tappable>

      <QuickEntry activeChildId={childId} />

      <SectionTitle title="Aujourd’hui" />
      {logsLoading ? <Skeleton kind="list" rows={3} /> : logsError ? (
        <ErrorView error={logsError.error} onRetry={retryLogs} title="Impossible d’afficher le suivi" />
      ) : (
        <>
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

      <SectionTitle title="Tendances" />
      <Segmented label="Période" value={range} onChange={setRange} options={[{ value: '7', label: '7 jours' }, { value: '30', label: '30 jours' }]} />
      {range === '30' && !premium ? (
        <PremiumGate feature="Graphiques enrichis sur 30 jours"><View /></PremiumGate>
      ) : null}
      {child.enabled_tracking.includes('bottle') && (
        <Card><Text weight="bold">Lait bu par jour (ml)</Text><BarChart data={bottleSeries} unit="ml" accessibilityLabel="Quantité de lait bue par jour" /></Card>
      )}
      {child.enabled_tracking.includes('sleep') && (
        <Card><Text weight="bold">Sommeil enregistré</Text><View style={{ marginTop: spacing.xs }}><SleepNights sleeps={sleeps} days={7} /></View></Card>
      )}
      {child.enabled_tracking.includes('diaper') && (
        <Card><Text weight="bold">Changes par jour</Text><BarChart data={diaperSeries} unit="changes" accessibilityLabel="Nombre de changes par jour" /></Card>
      )}
      <Text variant="caption" muted>Ces graphiques reprennent vos saisies pour préparer un rendez-vous. Ils ne constituent pas une analyse médicale.</Text>

      <SectionTitle title={`Profil de ${child.first_name}`} />
      <Card>
        <ListRow icon="trending-up" title="Taille & poids" subtitle="Mesures datées et courbe" onPress={() => router.push(`/child/${childId}/growth`)} />
        <ListRow icon="user" title="Profil, santé et contacts" subtitle="Allergies déclarées, traitements, vaccins à vérifier" onPress={() => router.push(`/child/${childId}`)} />
        {child.enabled_tracking.includes('meal') && <ListRow icon="feather" title="Diversification" subtitle="Aliments découverts et idées de repas" onPress={() => router.push(`/child/${childId}/foods`)} />}
        <ListRow icon="folder" title="Documents" subtitle="Ordonnances, comptes rendus…" onPress={() => router.push('/documents')} />
      </Card>
    </View>
  );
}

function PregnancyTracking({ cards }: { cards?: boolean }) {
  const { data: profile } = useProfile();
  const pregnancy = useActivePregnancy();
  return (
    <View style={{ gap: spacing.md }}>
    {cards ? <PregnancyTrackCards pregnancyId={pregnancy?.id ?? null} /> : null}
    <Card>
      <ListRow icon="moon" title="Semaine après semaine" subtitle="Développement, changements possibles, compte à rebours" onPress={() => router.push('/pregnancy')} />
      {!profile?.hide_weight_module && <ListRow icon="trending-up" title="Mon poids" subtitle="Suivi facultatif et bienveillant" onPress={() => router.push('/pregnancy/weight')} />}
      <ListRow icon="calendar" title="Rendez-vous & examens" subtitle="Échographies, prises de sang, questions à poser" onPress={() => router.push('/appointments')} />
      <ListRow icon="check-square" title="Listes de préparation" subtitle="Valise, affaires de bébé, démarches…" onPress={() => router.push('/lists')} />
      <ListRow icon="folder" title="Documents" subtitle="Échographies, comptes rendus, résultats" onPress={() => router.push('/documents')} />
      <ListRow icon="star" title="Idées de prénoms" subtitle="Favoris et vote à deux" onPress={() => router.push('/names')} />
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
  const loading = (childrenQ.isLoading && !children) || (pregnanciesQ.isLoading && !pregnanciesQ.data);
  const failed = childrenQ.isError && !children ? childrenQ : pregnanciesQ.isError && !pregnanciesQ.data ? pregnanciesQ : null;
  const cycle = scope.scope === 'avoid' || scope.scope === 'ttc' || scope.scope === 'cycle';
  return (
    <View style={{ flex: 1 }}>
      <Screen account title={tr('screen.track.title')} bottomInset={96}>
        <ProfileSwitcher />
        {loading ? <Skeleton kind="card" rows={2} /> : failed ? (
          <ErrorView error={failed.error} onRetry={() => { void childrenQ.refetch(); void pregnanciesQ.refetch(); }} />
        ) : null}
        {subject.type === 'family' && <QuickEntry activeChildId={scope.childId} />}
        {scope.childId && <ChildTracking childId={scope.childId} journey={scope.scope === 'baby' ? 'baby' : scope.scope === 'child' ? 'child' : null} />}
        {scope.scope === 'pregnancy' && <PregnancyTracking cards />}
        {scope.scope === 'postpartum' && (
          <Card>
            <ListRow icon="edit-3" title={tr('tool.pp_checkin')} onPress={() => router.push('/postpartum/checkin')} />
            <ListRow icon="feather" title={tr('tool.pp_body')} onPress={() => router.push('/postpartum/recovery')} />
            <ListRow icon="smile" title={tr('tool.mood')} onPress={() => router.push('/me/mood')} />
            <ListRow icon="cloud" title={tr('tool.sleep')} onPress={() => router.push('/me/sleep')} />
            {scope.babyId ? <ListRow icon="droplet" title={tr('tool.pp_feeding')} onPress={() => router.push(`/track/breastfeed?child=${scope.babyId}`)} /> : null}
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
        {(cycle || scope.scope === 'none') && subject.type !== 'family' && (
          <Card>
            <ListRow icon="heart" title="Comment je me sens" subtitle="Bilan émotionnel et journal privé" onPress={() => router.push('/me/mood')} />
            {cycle ? <ListRow icon="circle" title="Mon cycle" subtitle="Règles, symptômes, tests" onPress={() => router.push(scope.scope === 'ttc' ? '/fertility' : '/cycle')} /> : null}
            <ListRow icon="calendar" title="Mes rendez-vous" onPress={() => router.push('/appointments')} />
          </Card>
        )}
        {!loading && !failed && !pregnancy && !children?.length && !cycle && scope.scope !== 'postpartum' && (
          <EmptyStateCard illustration="leaf" title="Rien à suivre pour l’instant" text={tr('pj.none.body')} action={<Button label={tr('pj.editJourney')} icon="compass" onPress={() => router.push('/journeys')} />} />
        )}
        {scope.childId && <Banner tone="info">{'Cette application ne remplace pas le carnet de santé officiel de votre enfant.'}</Banner>}
      </Screen>
    </View>
  );
}
