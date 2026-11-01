/** Historique des modifications des tâches du foyer (écrit par le serveur, lecture seule). */
import React from 'react';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { Card, ListRow } from '@/components/ui';
import { useFamilyTasks, usePeople, useTaskEvents } from '@/lib/data/hooks-family-load';
import type { IconName } from '@/components/ui';
import { t as tr, formatDate } from '@/i18n';

const KIND: Record<string, { label: string; icon: IconName }> = {
  created: { label: 'u2.history.created', icon: 'plus-circle' }, assigned: { label: 'u2.history.assigned', icon: 'user-check' }, unassigned: { label: 'u2.history.unassigned', icon: 'user-x' },
  done: { label: 'u2.history.done', icon: 'check-circle' }, reopened: { label: 'u2.history.reopened', icon: 'rotate-ccw' }, postponed: { label: 'u2.history.postponed', icon: 'skip-forward' },
  updated: { label: 'u2.history.updated', icon: 'edit-2' }, cancelled: { label: 'u2.history.cancelled', icon: 'x-circle' },
};

export default function FamilyHistory() {
  const q = useTaskEvents(100);
  const { data: tasks } = useFamilyTasks();
  const { labelOf } = usePeople();
  return (
    <Screen back title={tr('u2.history.title')} subtitle={tr('u2.history.subtitle')}>
      {q.data ? (() => {
        const today = new Date().toDateString();
        const evToday = q.data.filter((e) => new Date(e.created_at).toDateString() === today);
        return (
          <TodaySummary items={[
            { icon: 'activity', value: String(evToday.length), label: tr('u2.history.changes') },
            { icon: 'check', value: String(evToday.filter((e) => e.kind === 'done').length), label: tr('u2.history.completed') },
            { icon: 'user-plus', value: String(evToday.filter((e) => e.kind === 'assigned').length), label: tr('u2.history.delegated') },
          ]} />
        );
      })() : null}
      {q.isLoading && !q.data ? <Skeleton rows={4} /> : null}
      {q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} /> : null}
      {q.data && !q.data.length ? <EmptyState icon="clock" title={tr('u2.history.empty_title')} body={tr('u2.history.empty_body')} /> : null}
      {(q.data ?? []).map((e, i) => {
        const k = KIND[e.kind] ?? { label: '', icon: 'circle' as IconName };
        const kLabel = KIND[e.kind] ? tr(k.label as never) : e.kind;
        const task = tasks?.find((t) => t.id === e.task_id);
        const to = e.kind === 'assigned' && typeof e.detail?.to === 'string' ? tr('u2.history.to', { name: labelOf(e.detail.to as string) }) : '';
        return (
          <StaggerItem key={e.id} index={i}>
            <Card style={{ paddingVertical: 4 }}>
              <ListRow icon={k.icon} title={`${labelOf(e.actor_id)} ${kLabel} « ${task?.title ?? tr('u2.history.deleted_task')} »${to}`} subtitle={formatDate(e.created_at, { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} />
            </Card>
          </StaggerItem>
        );
      })}
    </Screen>
  );
}
