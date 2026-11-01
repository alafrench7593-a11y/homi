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
import { agree, basisText, clock, notifyPrefs, type Estimate } from '@/lib/domain/sleepPlanner';
import { NIGHT_SOURCES, SAFE_SLEEP, SOOTHING_ROUTINES } from '@/content/nightHelp';
import type { Child } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

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
      <Screen back title="M’aider pour les nuits">
        {isLoading ? <Skeleton kind="detail" rows={5} /> : loadError ? (
          <ErrorView error={loadError.error} onRetry={() => { void membershipsQ.refetch(); void childrenQ.refetch(); }} title="Impossible d’afficher ce profil" />
        ) : (
          <EmptyState
            icon="user-x"
            title="Profil introuvable"
            body="Ce profil est introuvable. Il a peut-être été supprimé."
            action={{ label: 'Retour à l’accueil', icon: 'home', onPress: () => router.replace('/(tabs)') }}
          />
        )}
      </Screen>
    );
  }
  if (loading || !plan || !review) return <Screen back title="M’aider pour les nuits"><Skeleton kind="detail" rows={5} /></Screen>;
  const name = child.first_name;
  const age = childAge(child.birth_date);
  const prefs = notifyPrefs(profile);
  const tips = gentleTips(age.months, review, plan);
  const routineSteps = profile?.routine_note ? profile.routine_note.split(/[,·→\n]+/).map((s) => s.trim()).filter(Boolean) : SOOTHING_ROUTINES[0].steps.slice(0, 4);

  return (
    <Screen back title="M’aider pour les nuits" subtitle={`${name} · ${age.label}`}>
      <View testID="nights-help" />
      <LinearGradient pointerEvents="none" colors={t.isDark ? ['rgba(122,95,184,0.10)', 'rgba(40,32,70,0.0)'] : ['#EEF0FB', '#FFF7EE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: -spacing.md, right: -spacing.md, height: 2400, borderRadius: 32 }} />

      <Row wrap>
        <Button label="La nuit est difficile" icon="moon" onPress={() => router.push(`/sleep/difficult/${child.id}` as never)} testID="nh-difficult" />
        <Button label="Demander à l’IA sommeil" icon="message-circle" variant="secondary" onPress={() => router.push({ pathname: '/assistant/chat', params: { topic: 'sleep', child: child.id } })} testID="nh-ai" />
      </Row>

      <SectionTitle title="Sommeil récent" />
      <Card testID="nh-review">
        {reviewLines(review).map((l) => <Text key={l} variant="small" style={{ marginBottom: 4 }}>{l}</Text>)}
        {review.changes.length ? (
          <View style={{ marginTop: spacing.xs, gap: 4 }} testID="nh-changes">
            <Text variant="label">Changements par rapport au rythme habituel</Text>
            {review.changes.map((c) => <Text key={c.kind} variant="small">• {c.text}</Text>)}
          </View>
        ) : review.enough ? <Text variant="caption" muted>Pas de changement marqué par rapport aux jours précédents.</Text> : null}
        <Button label="Graphiques et historique" icon="bar-chart-2" size="sm" variant="ghost" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => router.push({ pathname: '/sleep/[childId]', params: { childId: child.id, tab: 'trends' } } as never)} testID="nh-history" />
      </Card>

      <SectionTitle title="Aujourd’hui" />
      <SleepRecordButtons child={child} plan={plan} />
      <PremiumSection feature="sleep_insights" name={name}
        preview={<Text variant="small">{`Avec Premium, la prochaine sieste et le moment du rituel du coucher de ${name} sont estimés d’après ses propres relevés, et vos avis « trop tôt » ou « trop tard » affinent les estimations suivantes.`}</Text>}>
        <Card testID="nh-plan">
          {plan.state !== 'awake' ? <Text variant="small">{plan.state === 'asleep_nap' ? `${name} fait la sieste.` : `${name} est ${agree(child.sex, 'endormi', 'endormie', 'endormi·e')}.`}</Text> : null}
          {plan.nextNap && !plan.nextNap.overdue ? <Suggestion label="Prochaine sieste estimée" e={plan.nextNap} target="nap" child={child} /> : null}
          {plan.bedtime && !plan.bedtime.overdue ? <Suggestion label="Rituel du coucher possible à partir de" e={plan.bedtime} target="bedtime" useRoutine child={child} /> : null}
          {!plan.nextNap && !plan.bedtime ? <Text variant="small" muted>Pas d’estimation pour le moment : notez le prochain réveil pour en obtenir une.</Text> : null}
          <Text variant="caption" muted style={{ marginTop: 6 }} testID="nh-basis">{`${basisText(plan, name)} Ce sont des repères souples, pas des horaires à respecter.`}</Text>
        </Card>
      </PremiumSection>

      <Card testID="nh-routine">
        <Text weight="bold">Routine du soir</Text>
        <Text variant="small" muted>{profile?.routine_note ? 'Votre routine :' : 'Une idée de départ, à adapter :'}</Text>
        {routineSteps.map((s, i) => <Text key={`${i}-${s}`} variant="small">{`${i + 1}. ${s}`}</Text>)}
        <Row wrap style={{ marginTop: 6 }}>
          <Button label="Personnaliser la routine" icon="edit-3" size="sm" variant="secondary" onPress={() => router.push({ pathname: '/sleep/[childId]', params: { childId: child.id, routine: '1' } } as never)} testID="nh-routine-edit" />
          <Button label={prefs.enabled ? 'Mes rappels sont activés' : 'Choisir mes rappels'} icon="bell" size="sm" variant="ghost" onPress={() => router.push({ pathname: '/sleep/[childId]', params: { childId: child.id, tab: 'alerts' } } as never)} testID="nh-reminders" />
        </Row>
        <Text variant="caption" muted>Chaque rappel est facultatif, modifiable et désactivable. Aucun réveil de bébé n’est jamais programmé.</Text>
      </Card>

      <SectionTitle title="Petits conseils pour son âge" />
      <Card testID="nh-tips">
        {tips.map((x) => <Row key={x} style={{ alignItems: 'flex-start', marginBottom: 4 }}><Icon name="feather" size={14} color={t.colors.lavender} /><Text variant="small" style={{ flex: 1 }}>{x}</Text></Row>)}
        <Text variant="caption" muted>Chaque enfant a son propre rythme. Aucune méthode n’est imposée, et il n’est jamais nécessaire de laisser pleurer votre bébé.</Text>
      </Card>

      <SectionTitle title="Couchage sécuritaire" />
      <Card testID="nh-safe">
        {(allSafe ? SAFE_SLEEP : SAFE_SLEEP.slice(0, 4)).map((x) => <Text key={x} variant="small" style={{ marginBottom: 4 }}>• {x}</Text>)}
        {!allSafe ? <Button label="Voir tous les repères" size="sm" variant="ghost" onPress={() => setAllSafe(true)} style={{ alignSelf: 'flex-start' }} testID="nh-safe-all" /> : null}
        <Text variant="caption" muted>{`Sources : ${NIGHT_SOURCES.ameliCoucher.label} ; ${NIGHT_SOURCES.mpediaCoucher.label}.`}</Text>
      </Card>
      <Banner tone="info" icon="heart" title="Une difficulté qui dure ?">Si les nuits restent difficiles plusieurs semaines, si vous êtes épuisé·e ou si quelque chose vous inquiète, parlez-en à son médecin ou à la PMI. Allô Parents Bébé : 0 800 00 34 56 (gratuit).</Banner>
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
      toast(verdict === 'right' ? 'Merci, c’est noté.' : 'Merci : les prochaines estimations en tiendront compte.');
    } catch (err) { toast(friendlyError(err), 'error'); }
  }
  return (
    <View style={{ gap: 4, marginBottom: spacing.sm }} testID={`nh-suggest-${target}`}>
      <Text variant="small" muted>{label}</Text>
      <Text variant="heading">{`vers ${clock(at)}`}</Text>
      {useRoutine ? <Text variant="caption" muted>{`Coucher estimé vers ${clock(e.at)}.`}</Text> : null}
      <Row wrap>
        <Chip label="Trop tôt" selected={sent === 'early'} onPress={() => vote('early')} testID={`nh-${target}-early`} />
        <Chip label="Trop tard" selected={sent === 'late'} onPress={() => vote('late')} testID={`nh-${target}-late`} />
        <Chip label="Utile" icon="check" selected={sent === 'right'} onPress={() => vote('right')} testID={`nh-${target}-right`} />
      </Row>
    </View>
  );
}
