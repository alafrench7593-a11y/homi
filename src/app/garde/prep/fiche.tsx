/**
 * 143 — Fiche de candidature : contact, disponibilités, statut (changé d'un appui), tarif et coût mensuel estimé avant
 * aides, avancement de l'entretien et de la visite, notes. Visible des seuls parents du foyer.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Button, Card, Chip, ListGroup, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { formatDate, formatNumber, t as tr } from '@/i18n';
import { callNumber, openLink } from '@/lib/links';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCandidates, useParentHousehold, usePrepAnswers, usePrepItems, useSaveCandidate } from '@/lib/data/hooks-childcarePrep';
import { CANDIDATE_STATUSES, monthlyCost, progressOf, type CandidateStatus } from '@/features/childcarePrep/domain';
import { CandidateEditor, kindLabel, money, statusLabel } from '@/features/childcarePrep/ui';

export default function CandidateSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { householdId, loading } = useParentHousehold();
  const cands = useCandidates(householdId);
  const items = usePrepItems(householdId).data ?? [];
  const answers = usePrepAnswers(householdId).data ?? [];
  const save = useSaveCandidate();
  const [editing, setEditing] = useState(false);
  const c = useMemo(() => cands.data?.find((x) => x.id === id) ?? null, [cands.data, id]);

  if (loading || (cands.isLoading && !cands.data)) return <Screen back title={tr('gp.tool.candidates')} tool={false}><Skeleton rows={4} kind="detail" /></Screen>;
  if (!c || !householdId) {
    return <Screen back title={tr('gp.tool.candidates')} tool={false}><EmptyState icon="user-x" title={tr('gp.fiche.notFound')} body={tr('gp.fiche.notFoundBody')} action={{ label: tr('gp.tool.candidates'), onPress: () => router.replace('/garde/prep/candidats' as never) }} /></Screen>;
  }
  const cost = monthlyCost(c);
  const iv = progressOf(items, answers, c.id, 'interview');
  const vs = progressOf(items, answers, c.id, 'visit');
  async function setStatus(s: CandidateStatus) {
    if (!c || s === c.status) return;
    try { await save.mutateAsync({ ...c, status: s }); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  const line = (label: string, n: number) => (n ? <ListRow title={label} value={money(n)} /> : null);
  return (
    <Screen back title={c.name} subtitle={kindLabel(c.kind)} tool={false} action={{ label: tr('gp.fiche.edit'), icon: 'edit-2', onPress: () => setEditing(true), testID: 'gp-fiche-edit' }}>
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">{tr('gp.f.status')}</Text>
        <Row wrap>{CANDIDATE_STATUSES.map((s) => <Chip key={s} label={statusLabel(s)} selected={c.status === s} onPress={() => void setStatus(s)} testID={`gp-fiche-status-${s}`} />)}</Row>
      </View>
      {c.interview_at ? <Text muted>{tr('gp.cand.dateAt', { date: formatDate(c.interview_at, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) })}</Text> : null}

      <SectionTitle title={tr('gp.fiche.price')} />
      <Card testID="gp-fiche-cost">
        {cost.complete ? (
          <>
            <Text variant="small" muted>{tr('gp.cost.beforeAid')}</Text>
            <Text variant="title">{tr('gp.cand.perMonth', { amount: money(cost.total) })}</Text>
            {cost.hoursPerMonth != null ? <Text variant="small" muted>{tr('gp.cost.hoursMonth', { hours: formatNumber(cost.hoursPerMonth, { maximumFractionDigits: 1 }) })}</Text> : null}
          </>
        ) : <Text muted>{tr('gp.cost.incomplete')}</Text>}
      </Card>
      {cost.complete ? (
        <ListGroup footer={tr('gp.bd.formula')}>
          {line(tr('gp.cost.base'), cost.base)}
          {line(tr('gp.cost.meals'), cost.meals)}
          {line(tr('gp.cost.upkeep'), cost.upkeep)}
          {line(tr('gp.cost.other'), cost.other)}
          <ListRow title={tr('gp.cost.total')} value={money(cost.total)} />
        </ListGroup>
      ) : null}

      <ListGroup title={tr('gp.fiche.prep')}>
        <ListRow icon="message-square" title={tr('gp.tool.interview')} value={`${iv.done} / ${iv.total}`} onPress={() => router.push(`/garde/prep/entretien?c=${c.id}` as never)} testID="gp-fiche-interview" />
        <ListRow icon="check-square" title={tr('gp.tool.visit')} value={`${vs.done} / ${vs.total}`} onPress={() => router.push(`/garde/prep/visite?c=${c.id}` as never)} testID="gp-fiche-visit" />
      </ListGroup>

      {c.phone || c.email || c.address || c.availability ? (
        <ListGroup title={tr('gp.fiche.contact')}>
          {c.phone ? <ListRow icon="phone" title={c.phone} subtitle={tr('gp.fiche.call')} onPress={() => callNumber(c.phone!, toast)} /> : null}
          {c.email ? <ListRow icon="mail" title={c.email} subtitle={tr('gp.fiche.mail')} onPress={() => openLink(`mailto:${c.email}`, toast)} /> : null}
          {c.address ? <ListRow icon="map-pin" title={c.address} /> : null}
          {c.availability ? <ListRow icon="clock" title={tr('gp.f.availability')} subtitle={c.availability} /> : null}
        </ListGroup>
      ) : null}
      {c.notes ? (
        <Card>
          <Text variant="label">{tr('gp.fiche.notes')}</Text>
          <Text style={{ marginTop: 4 }}>{c.notes}</Text>
        </Card>
      ) : null}
      <Button label={tr('gp.tool.budget')} variant="secondary" icon="credit-card" onPress={() => router.push('/garde/prep/budget' as never)} />
      <CandidateEditor visible={editing} onClose={() => setEditing(false)} householdId={householdId} candidate={c} onSaved={() => undefined} />
    </Screen>
  );
}
