/**
 * « M'aider pour les nuits » : accompagnement du sommeil d'UN enfant (celui du profil choisi).
 *  · Sommeil récent : bilan des 7 derniers jours (siestes, temps d'éveil, coucher habituel, réveils, tendances),
 *    jamais de conclusion avant 3 jours notés.
 *  · Aujourd'hui : prochaine sieste et début du rituel estimés (souples), avis « trop tôt / trop tard / utile »
 *    qui affinent les estimations suivantes, routine personnalisable, rappels choisis par le parent.
 *  · Conseils doux selon l'âge et le rythme observé, « La nuit est difficile », assistant IA sommeil.
 *  · Couchage sécuritaire : toujours visible et gratuit.
 * Les graphiques et l'historique détaillé restent dans la page Sommeil.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { PremiumSection } from '@/components/Premium';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Icon, Row, SectionTitle, Text } from '@/components/ui';
import { SleepRecordButtons } from '@/features/sleep';
import { useChild, useChildren, useMemberships } from '@/lib/data/hooks';
import { addSleepFeedback, useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { childAge } from '@/lib/domain/child';
import { gentleTips, reviewLines, sleepReview } from '@/lib/domain/nightsHelp';
import { basisText, clock, notifyPrefs, type Estimate } from '@/lib/domain/sleepPlanner';
import { NIGHT_SOURCES, SAFE_SLEEP, SOOTHING_ROUTINES } from '@/content/nightHelp';
import type { Child } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function NightsHelp() {
  const t = useTheme();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const child = useChild(childId);
  const childrenQ = useChildren();
  const membershipsQ = useMemberships();
  const isLoading = (membershipsQ.isLoading && !membershipsQ.data) || (childrenQ.isLoading && !childrenQ.data);
  const loadError = membershipsQ.isError && !membershipsQ.data ? membershipsQ : childrenQ.isError && !childrenQ.data ? childrenQ : null;
  const { plan, sleeps, profile, loading } = useSleepPlan(child);
  const [allSafe, setAllSafe] = useState(false);
  const review = useMemo(() => (child ? sleepReview(sleeps, child.id) : null), [child, sleeps]);
  if (!child) {
    return (
      <Screen back title={tr('u4.nh.title')}>
        {isLoading ? <Skeleton kind="detail" rows={5} /> : loadError ? (
          <ErrorView error={loadError.error} onRetry={() => { void membershipsQ.refetch(); void childrenQ.refetch(); }} title={tr('u4.child.loadError')} />
        ) : (
          <EmptyState
            icon="user-x"
            title={tr('u4.child.notFound')}
            body={tr('u4.child.notFoundBody')}
            action={{ label: tr('u4.child.backHome'), icon: 'home', onPress: () => router.replace('/(tabs)') }}
          />
        )}
      </Screen>
    );
  }
  if (loading || !plan || !review) return <Screen back title={tr('u4.nh.title')}><Skeleton kind="detail" rows={5} /></Screen>;
  const name = child.first_name;
  const age = childAge(child.birth_date);
  const prefs = notifyPrefs(profile);
  const tips = gentleTips(age.months, review, plan);
  const routineSteps = profile?.routine_note ? profile.routine_note.split(/[,·→\n]+/).map((s) => s.trim()).filter(Boolean) : SOOTHING_ROUTINES[0].steps.slice(0, 4);

  return (
    <Screen back title={tr('u4.nh.title')} subtitle={`${name} · ${age.label}`}>
      <View testID="nights-help" />
      <LinearGradient pointerEvents="none" colors={t.isDark ? ['rgba(122,95,184,0.10)', 'rgba(40,32,70,0.0)'] : ['#EEF0FB', '#F4F0FA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: -spacing.md, right: -spacing.md, height: 2400, borderRadius: 32 }} />

      <Row wrap>
        <Button label={tr('u4.nh.difficult')} icon="moon" onPress={() => router.push(`/sleep/difficult/${child.id}` as never)} testID="nh-difficult" />
        <Button label={tr('u4.nh.askAi')} icon="message-circle" variant="secondary" onPress={() => router.push({ pathname: '/assistant/chat', params: { topic: 'sleep', child: child.id } })} testID="nh-ai" />
      </Row>

      <SectionTitle title={tr('u4.nh.recent')} />
      <Card testID="nh-review">
        {reviewLines(review).map((l) => <Text key={l} variant="small" style={{ marginBottom: 4 }}>{l}</Text>)}
        {review.changes.length ? (
          <View style={{ marginTop: spacing.xs, gap: 4 }} testID="nh-changes">
            <Text variant="label">{tr('u4.nh.changes')}</Text>
            {review.changes.map((c) => <Text key={c.kind} variant="small">• {c.text}</Text>)}
          </View>
        ) : review.enough ? <Text variant="caption" muted>{tr('u4.nh.noChange')}</Text> : null}
        <Button label={tr('u4.nh.charts')} icon="bar-chart-2" size="sm" variant="ghost" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => router.push({ pathname: '/sleep/[childId]', params: { childId: child.id, tab: 'trends' } } as never)} testID="nh-history" />
      </Card>

      <SectionTitle title={tr('u4.nh.today')} />
      <SleepRecordButtons child={child} plan={plan} />
      <PremiumSection feature="sleep_insights" name={name}
        preview={<Text variant="small">{tr('u4.nh.preview', { name })}</Text>}>
        <Card testID="nh-plan">
          {plan.state !== 'awake' ? <Text variant="small">{plan.state === 'asleep_nap' ? tr('u4.nh.napping', { name }) : tr(child.sex === 'female' ? 'u4.nh.asleepF' : child.sex === 'male' ? 'u4.nh.asleepM' : 'u4.nh.asleepX', { name })}</Text> : null}
          {plan.nextNap && !plan.nextNap.overdue ? <Suggestion label={tr('u4.nh.nextNap')} e={plan.nextNap} target="nap" child={child} /> : null}
          {plan.bedtime && !plan.bedtime.overdue ? <Suggestion label={tr('u4.nh.bedtimeFrom')} e={plan.bedtime} target="bedtime" useRoutine child={child} /> : null}
          {!plan.nextNap && !plan.bedtime ? <Text variant="small" muted>{tr('u4.nh.noEstimate')}</Text> : null}
          <Text variant="caption" muted style={{ marginTop: 6 }} testID="nh-basis">{tr('u4.nh.soft', { basis: basisText(plan, name) })}</Text>
        </Card>
      </PremiumSection>

      <Card testID="nh-routine">
        <Text weight="bold">{tr('u4.nh.evening')}</Text>
        <Text variant="small" muted>{profile?.routine_note ? tr('u4.nh.yourRoutine') : tr('u4.nh.startIdea')}</Text>
        {routineSteps.map((s, i) => <Text key={`${i}-${s}`} variant="small">{`${i + 1}. ${s}`}</Text>)}
        <Row wrap style={{ marginTop: 6 }}>
          <Button label={tr('u4.nh.customise')} icon="edit-3" size="sm" variant="secondary" onPress={() => router.push({ pathname: '/sleep/[childId]', params: { childId: child.id, routine: '1' } } as never)} testID="nh-routine-edit" />
          <Button label={prefs.enabled ? tr('u4.nh.remindersOn') : tr('u4.nh.chooseReminders')} icon="bell" size="sm" variant="ghost" onPress={() => router.push({ pathname: '/sleep/[childId]', params: { childId: child.id, tab: 'alerts' } } as never)} testID="nh-reminders" />
        </Row>
        <Text variant="caption" muted>{tr('u4.nh.reminderNote')}</Text>
      </Card>

      <SectionTitle title={tr('u4.nh.tipsTitle')} />
      <Card testID="nh-tips">
        {tips.map((x) => <Row key={x} style={{ alignItems: 'flex-start', marginBottom: 4 }}><Icon name="feather" size={14} color={t.colors.lavender} /><Text variant="small" style={{ flex: 1 }}>{x}</Text></Row>)}
        <Text variant="caption" muted>{tr('u4.nh.ownRhythm')}</Text>
      </Card>

      <SectionTitle title={tr('u4.nh.safeTitle')} />
      <Card testID="nh-safe">
        {(allSafe ? SAFE_SLEEP : SAFE_SLEEP.slice(0, 4)).map((x) => <Text key={x} variant="small" style={{ marginBottom: 4 }}>• {x}</Text>)}
        {!allSafe ? <Button label={tr('u4.nh.seeAll')} size="sm" variant="ghost" onPress={() => setAllSafe(true)} style={{ alignSelf: 'flex-start' }} testID="nh-safe-all" /> : null}
        <Text variant="caption" muted>{tr('u4.nh.sources', { a: NIGHT_SOURCES.ameliCoucher.label, b: NIGHT_SOURCES.mpediaCoucher.label })}</Text>
      </Card>
      <Banner tone="info" icon="heart" title={tr('u4.nh.lasting')}>{tr('u4.nh.lastingBody')}</Banner>
    </Screen>
  );
}

function Suggestion({ label, e, target, child, useRoutine }: { label: string; e: Estimate; target: 'nap' | 'bedtime'; child: Child; useRoutine?: boolean }) {
  const toast = useToast();
  const inv = useInvalidate();
  const [sent, setSent] = useState<string | null>(null);
  const at = useRoutine ? e.routineAt : e.at;
  async function vote(verdict: 'early' | 'late' | 'right') {
    try {
      await addSleepFeedback(child, target, verdict, e.initial);
      inv('sleep_feedback');
      setSent(verdict);
      toast(verdict === 'right' ? tr('u4.nh.thanks') : tr('u4.nh.thanksNext'));
    } catch (err) { toast(friendlyError(err), 'error'); }
  }
  return (
    <View style={{ gap: 4, marginBottom: spacing.sm }} testID={`nh-suggest-${target}`}>
      <Text variant="small" muted>{label}</Text>
      <Text variant="heading">{tr('u4.nh.around', { time: clock(at) })}</Text>
      {useRoutine ? <Text variant="caption" muted>{tr('u4.nh.bedEst', { time: clock(e.at) })}</Text> : null}
      <Row wrap>
        <Chip label={tr('u4.nh.early')} selected={sent === 'early'} onPress={() => vote('early')} testID={`nh-${target}-early`} />
        <Chip label={tr('u4.nh.late')} selected={sent === 'late'} onPress={() => vote('late')} testID={`nh-${target}-late`} />
        <Chip label={tr('u4.nh.useful')} icon="check" selected={sent === 'right'} onPress={() => vote('right')} testID={`nh-${target}-right`} />
      </Row>
    </View>
  );
}
