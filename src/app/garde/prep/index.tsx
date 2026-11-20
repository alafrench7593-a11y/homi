/**
 * « Avant la garde » : les outils des parents qui précèdent et encadrent la garde (choisir un mode de garde, comparer
 * les candidates, préparer entretiens et visites, budget) puis l'organisent (planning, heures, absences, contrats).
 * Le carnet de liaison, les photos et les messages restent dans l'Espace Nounou (/garde/[id]).
 */
import React from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Card, ListGroup, ListRow, Text } from '@/components/ui';
import { t as tr } from '@/i18n';
import { useCandidates, useParentHousehold } from '@/lib/data/hooks-childcarePrep';

const go = (p: string) => () => router.push(p as never);

export default function BeforeCare() {
  const { householdId, loading } = useParentHousehold();
  const cands = useCandidates(householdId);
  const list = cands.data ?? [];
  const chosen = list.find((c) => c.status === 'chosen');

  if (loading) return <Screen back title={tr('gp.title')} tool={false}><Skeleton rows={4} /></Screen>;
  if (!householdId) {
    return (
      <Screen back title={tr('gp.title')} tool={false}>
        <EmptyState icon="lock" title={tr('gp.parentOnly')} body={tr('gp.parentOnlyBody')} action={{ label: tr('gp.nanny.hours'), onPress: go('/garde/prep/heures') }} />
      </Screen>
    );
  }
  return (
    <Screen back title={tr('gp.title')} subtitle={tr('gp.sub')} tool={false}>
      <Card tone="soft" testID="gp-summary" onPress={go('/garde/prep/candidats')} accessibilityLabel={[tr('gp.tool.candidates'), list.length ? tr('gp.summary.count', { count: list.length }) : tr('gp.summary.none'), chosen ? tr('gp.summary.chosen', { name: chosen.name }) : ''].filter(Boolean).join(', ')}>
        <Text variant="heading">{list.length ? tr('gp.summary.count', { count: list.length }) : tr('gp.summary.none')}</Text>
        {chosen ? <Text>{tr('gp.summary.chosen', { name: chosen.name })}</Text> : null}
      </Card>
      <ListGroup title={tr('gp.sec.choose')}>
        <ListRow icon="compass" title={tr('gp.tool.modes')} subtitle={tr('gp.tool.modesSub')} onPress={go('/garde/prep/modes')} testID="gp-open-modes" />
        <ListRow icon="users" title={tr('gp.tool.candidates')} subtitle={tr('gp.tool.candidatesSub')} value={list.length ? String(list.length) : undefined} onPress={go('/garde/prep/candidats')} testID="gp-open-candidates" />
        <ListRow icon="message-square" title={tr('gp.tool.interview')} subtitle={tr('gp.tool.interviewSub')} onPress={go('/garde/prep/entretien')} testID="gp-open-interview" />
        <ListRow icon="check-square" title={tr('gp.tool.visit')} subtitle={tr('gp.tool.visitSub')} onPress={go('/garde/prep/visite')} testID="gp-open-visit" />
        <ListRow icon="credit-card" title={tr('gp.tool.budget')} subtitle={tr('gp.tool.budgetSub')} onPress={go('/garde/prep/budget')} testID="gp-open-budget" />
      </ListGroup>
      <ListGroup title={tr('gp.sec.organize')}>
        <ListRow icon="calendar" title={tr('gp.tool.planning')} subtitle={tr('gp.tool.planningSub')} onPress={go('/garde/prep/planning')} testID="gp-open-planning" />
        <ListRow icon="clock" title={tr('gp.tool.hours')} subtitle={tr('gp.tool.hoursSub')} onPress={go('/garde/prep/heures')} testID="gp-open-hours" />
        <ListRow icon="sun" title={tr('gp.tool.absences')} subtitle={tr('gp.tool.absencesSub')} onPress={go('/garde/prep/absences')} testID="gp-open-absences" />
        <ListRow icon="file-text" title={tr('gp.tool.contracts')} subtitle={tr('gp.tool.contractsSub')} onPress={go('/documents?cat=childcare')} testID="gp-open-contracts" />
      </ListGroup>
      <Banner tone="info" icon="lock">{tr('gp.privacy')}</Banner>
    </Screen>
  );
}
