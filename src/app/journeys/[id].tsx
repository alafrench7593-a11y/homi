/**
 * Un parcours précédent : ses dates et ce qu'il contient (données conservées, en lecture),
 * avec la suppression définitive sur demande explicite.
 */
import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Button, Card, ListRow, Text } from '@/components/ui';
import { journeyDates, journeyLabel, useJourneyProfileLabel } from '@/features/journeys';
import { eq, gte, lte } from '@/lib/backend';
import { useChildren, useJourneyState, usePregnancies, useRows } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { todayISO } from '@/lib/domain/dates';
import { useRunJourneyOps } from '@/lib/journeys/manager';
import { deleteOps } from '@/lib/journeys/model';
import { formatDate, t as tr, type TKey } from '@/i18n';

export default function PastJourney() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const js = useJourneyState();
  const j = js.mine.find((r) => r.id === id) ?? null;
  const { data: pregnancies } = usePregnancies();
  const { data: children } = useChildren();
  const profileLabel = useJourneyProfileLabel();
  const { run, busy } = useRunJourneyOps();
  const to = j?.ended_on ?? todayISO();
  const cycle = j && (j.type === 'avoid' || j.type === 'ttc' || j.type === 'cycle');
  // Données conservées de la période (lecture seule) : rien n'est recopié ni modifié
  const periods = useRows<{ id: string; start_date: string }>(['period_entries', 'archive', id ?? ''], cycle ? { table: 'period_entries', filters: [gte('start_date', j!.started_on), lte('start_date', to)], order: [{ col: 'start_date', asc: false }] } : null);
  const tests = useRows<{ id: string }>(['ovulation_tests', 'archive', id ?? ''], j?.type === 'ttc' ? { table: 'ovulation_tests', filters: [gte('tested_at', j.started_on), lte('tested_at', `${to}T23:59:59`)] } : null);
  const weights = useRows<{ id: string }>(['maternal_weights', 'archive', id ?? ''], j?.type === 'pregnancy' && j.pregnancy_id ? { table: 'maternal_weights', filters: [eq('pregnancy_id', j.pregnancy_id)] } : null);
  const pregnancy = j?.pregnancy_id ? pregnancies?.find((p) => p.id === j.pregnancy_id) : null;
  const child = j?.child_id ? children?.find((c) => c.id === j.child_id) : null;

  async function remove() {
    if (!j) return;
    const ok = await confirm(tr('pj.delete.title'), j.type === 'baby' || j.type === 'child' ? tr('pj.mode.deleteChildBody') : tr('pj.delete.body'), tr('pj.delete.confirm'), true);
    if (!ok) return;
    try {
      await run(deleteOps(j));
      toast(tr('pj.toast.deleted'), 'success');
      router.replace('/journeys');
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  if (!js.loaded) return <Screen back title={tr('pj.manager.previous')}><Skeleton rows={3} /></Screen>;
  if (!j) return <Screen back title={tr('pj.manager.previous')}><EmptyState icon="archive" title={tr('pj.detail.missing')} /></Screen>;
  return (
    <Screen back title={profileLabel(j, children)} subtitle={journeyDates(j)}>
      <Card>
        <Text weight="bold">{journeyLabel(j.type)}</Text>
        <Text variant="small" muted>{j.status === 'archived' ? tr('pj.detail.archived') : tr('pj.activeBadge')}{j.end_reason ? ` · ${tr(`pj.reason.${j.end_reason}` as TKey)}` : ''}</Text>
      </Card>
      <Card>
        <Text variant="caption" weight="bold" muted>{tr('pj.detail.kept')}</Text>
        {cycle ? (
          <>
            <ListRow icon="droplet" title={tr('pj.detail.periods', { count: periods.data?.length ?? 0 })} subtitle={periods.data?.[0] ? formatDate(periods.data[0].start_date, { day: 'numeric', month: 'long', year: 'numeric' }) : undefined} />
            {j.type === 'ttc' ? <ListRow icon="check-circle" title={tr('pj.detail.tests', { count: tests.data?.length ?? 0 })} /> : null}
          </>
        ) : null}
        {pregnancy ? (
          <>
            <ListRow icon="moon" title={tr('pj.detail.pregnancy', { date: formatDate(pregnancy.due_date, { day: 'numeric', month: 'long', year: 'numeric' }) })} subtitle={tr(`pj.outcome.${pregnancy.end_reason ?? 'unspecified'}` as TKey)} />
            <ListRow icon="trending-up" title={tr('pj.detail.weights', { count: weights.data?.length ?? 0 })} />
          </>
        ) : null}
        {child ? <ListRow icon="smile" title={child.first_name} subtitle={tr('pj.detail.childKept')} onPress={() => router.push(`/child/${child.id}`)} /> : null}
        {j.type === 'postpartum' ? <ListRow icon="sun" title={tr('pj.detail.postpartum')} onPress={() => router.push('/postpartum/history')} /> : null}
      </Card>
      <Banner tone="info">{tr('pj.detail.note')}</Banner>
      {j.status === 'archived' ? <Button label={tr('pj.delete.button')} icon="trash-2" variant="danger" onPress={() => remove()} loading={busy} full testID="delete-journey" /> : null}
    </Screen>
  );
}
