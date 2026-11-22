/**
 * Historique des modifications des tâches du foyer (écrit par le serveur, lecture seule).
 * 22/11/2026 : jour sélectionné gardé dans l'adresse (« ?day= »), semaine touchable (modifications par jour ; un jour
 * sans modification = « rien de noté »), modifications du jour en grand puis la liste (heure en colonne fixe, qui,
 * quoi). Rien ne se corrige ici : c'est la trace de ce qui a été fait dans « Tâches ».
 */
import { MotionItem, MotionList } from '@/motion/ListMotion';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { ErrorView, Skeleton } from '@/components/States';
import { Text } from '@/components/ui';
import { HmEmpty, HmHero, HmRow, HmWeek, useUrlDay } from '@/features/homeTrack/kit';
import { useFamilyTasks, usePeople, useTaskEvents } from '@/lib/data/hooks-family-load';
import { countByDay } from '@/lib/domain/homeTrack';
import { dayDate, isoDay, weekDays } from '@/lib/domain/journalTrack';
import { clock } from '@/lib/domain/sleepPlanner';
import type { IconName } from '@/components/ui';
import { t as tr, formatDate } from '@/i18n';
import { spacing } from '@/theme/tokens';

const KIND: Record<string, { label: string; icon: IconName }> = {
  created: { label: 'u2.history.created', icon: 'plus-circle' }, assigned: { label: 'u2.history.assigned', icon: 'user-check' }, unassigned: { label: 'u2.history.unassigned', icon: 'user-x' },
  done: { label: 'u2.history.done', icon: 'check-circle' }, reopened: { label: 'u2.history.reopened', icon: 'rotate-ccw' }, postponed: { label: 'u2.history.postponed', icon: 'skip-forward' },
  updated: { label: 'u2.history.updated', icon: 'edit-2' }, cancelled: { label: 'u2.history.cancelled', icon: 'x-circle' },
};

export default function FamilyHistory() {
  const q = useTaskEvents(100);
  const { data: tasks } = useFamilyTasks();
  const { labelOf } = usePeople();
  const [day, setDay] = useUrlDay();
  const days = weekDays(day);
  const events = useMemo(() => q.data ?? [], [q.data]);
  const marks = useMemo(() => countByDay(events, days, (e) => isoDay(new Date(e.created_at))), [events, days]);
  const ofDay = events.filter((e) => isoDay(new Date(e.created_at)) === day).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const dayLabel = formatDate(dayDate(day), { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <Screen back title={tr('u2.history.title')} subtitle={tr('u2.history.subtitle')}>
      {q.isLoading && !q.data ? <Skeleton rows={4} /> : null}
      {q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} /> : null}
      {q.data ? (
        <>
          <HmHero testID="hm-hist-hero" value={ofDay.length ? String(ofDay.length) : null} unit={tr('hm.hist.unit', { count: ofDay.length, day: dayLabel })} emptyLabel={tr('hm.hist.none', { day: dayLabel })}
            split={ofDay.length ? [
              { label: tr('u2.history.completed'), value: String(ofDay.filter((e) => e.kind === 'done').length), testID: 'hm-hist-done' },
              { label: tr('u2.history.delegated'), value: String(ofDay.filter((e) => e.kind === 'assigned').length), testID: 'hm-hist-assigned' },
            ] : undefined} />
          <HmWeek day={day} onSelect={setDay} marks={marks} countLabel={(n) => tr('hm.hist.count', { count: n })} testID="hm-hist-week" />
          {ofDay.length ? (
            <MotionList testID="hm-hist-list" style={{ gap: spacing.xs }}>
              {ofDay.map((e) => {
                const k = KIND[e.kind] ?? { label: '', icon: 'circle' as IconName };
                const kLabel = KIND[e.kind] ? tr(k.label as never) : e.kind;
                const task = tasks?.find((t) => t.id === e.task_id);
                const to = e.kind === 'assigned' && typeof e.detail?.to === 'string' ? tr('u2.history.to', { name: labelOf(e.detail.to as string) }) : '';
                return <MotionItem key={e.id}><HmRow key={e.id} time={clock(new Date(e.created_at))} icon={k.icon} title={`« ${task?.title ?? tr('u2.history.deleted_task')} »`}
                  detail={`${labelOf(e.actor_id)} ${kLabel}${to}`} testID={`hm-hist-row-${e.id}`} /></MotionItem>;
              })}
            </MotionList>
          ) : <HmEmpty testID="hm-hist-empty" />}
          <Text variant="caption" muted>{tr('hm.hist.window')}</Text>
        </>
      ) : null}
    </Screen>
  );
}
