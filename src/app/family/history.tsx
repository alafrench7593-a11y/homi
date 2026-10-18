/** Historique des modifications des tâches du foyer (écrit par le serveur, lecture seule). */
import React from 'react';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { Card, ListRow } from '@/components/ui';
import { useFamilyTasks, usePeople, useTaskEvents } from '@/lib/data/hooks-family-load';
import type { IconName } from '@/components/ui';

const KIND: Record<string, { label: string; icon: IconName }> = {
  created: { label: 'a créé', icon: 'plus-circle' }, assigned: { label: 'a confié', icon: 'user-check' }, unassigned: { label: 'a retiré le responsable de', icon: 'user-x' },
  done: { label: 'a terminé', icon: 'check-circle' }, reopened: { label: 'a rouvert', icon: 'rotate-ccw' }, postponed: { label: 'a reporté', icon: 'skip-forward' },
  updated: { label: 'a modifié', icon: 'edit-2' }, cancelled: { label: 'a annulé', icon: 'x-circle' },
};

export default function FamilyHistory() {
  const q = useTaskEvents(100);
  const { data: tasks } = useFamilyTasks();
  const { labelOf } = usePeople();
  return (
    <Screen back title="Historique" subtitle="Pour se coordonner, pas pour compter.">
      {q.isLoading && !q.data ? <Skeleton rows={4} /> : null}
      {q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} /> : null}
      {q.data && !q.data.length ? <EmptyState icon="clock" title="Rien pour l’instant" body="Les créations, attributions et tâches terminées apparaîtront ici." /> : null}
      {(q.data ?? []).map((e, i) => {
        const k = KIND[e.kind] ?? { label: e.kind, icon: 'circle' as IconName };
        const task = tasks?.find((t) => t.id === e.task_id);
        const to = e.kind === 'assigned' && typeof e.detail?.to === 'string' ? ` à ${labelOf(e.detail.to as string)}` : '';
        return (
          <StaggerItem key={e.id} index={i}>
            <Card style={{ paddingVertical: 4 }}>
              <ListRow icon={k.icon} title={`${labelOf(e.actor_id)} ${k.label} « ${task?.title ?? 'une tâche supprimée'} »${to}`} subtitle={new Date(e.created_at).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} />
            </Card>
          </StaggerItem>
        );
      })}
    </Screen>
  );
}
