/**
 * Routines du foyer — ce qu'elles ont lancé (22/11/2026). Même donnée que « Tâches » (family_tasks.routine_id) :
 *  · jour sélectionné gardé dans l'adresse (« ?day= »), semaine touchable : tâches de routine prévues par jour (un jour
 *    sans tâche de routine = « rien de noté ») ;
 *  · tâches de routine du jour en grand, « reste / fait » ; la liste du jour avec la case à cocher de « Tâches »
 *    (droits des missions, double appui ignoré, qui et quand une fois faite).
 */
import { MotionItem, MotionList } from '@/motion/ListMotion';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { TaskRow } from '@/features/familyLoad';
import { formatDate, t as tr } from '@/i18n';
import type { FamilyTask, Routine } from '@/lib/domain/familyLoad';
import { countByDay } from '@/lib/domain/homeTrack';
import { dayDate, isoDay, weekDays } from '@/lib/domain/journalTrack';
import { spacing } from '@/theme/tokens';
import { HmEmpty, HmHero, HmWeek, useUrlDay } from './kit';

/** Jour d'une tâche : son échéance, sinon le jour où elle a été faite, sinon sa création. */
const dayOfTask = (t: FamilyTask) => isoDay(new Date(t.due_at ?? t.done_at ?? t.created_at));

export function RoutineTrack({ tasks, routines, onEdit }: { tasks: readonly FamilyTask[]; routines: readonly Routine[]; onEdit: (t: FamilyTask) => void }) {
  const [day, setDay] = useUrlDay();
  const days = weekDays(day);
  const ofRoutines = useMemo(() => tasks.filter((t) => t.routine_id && t.status !== 'cancelled'), [tasks]);
  const marks = useMemo(() => countByDay(ofRoutines, days, dayOfTask), [ofRoutines, days]);
  const list = ofRoutines.filter((t) => dayOfTask(t) === day).sort((a, b) => (a.status === b.status ? ((a.due_at ?? '') < (b.due_at ?? '') ? -1 : 1) : a.status === 'todo' ? -1 : 1));
  const left = list.filter((t) => t.status === 'todo').length;
  const dayLabel = formatDate(dayDate(day), { weekday: 'long', day: 'numeric', month: 'long' });
  const routineOf = (t: FamilyTask) => routines.find((r) => r.id === t.routine_id)?.title ?? null;
  if (!routines.length && !ofRoutines.length) return null;
  return (
    <View style={{ gap: spacing.sm }} testID="hm-rt">
      <HmHero testID="hm-rt-hero" value={list.length ? String(left) : null} unit={tr('hm.rt.unit', { count: list.length, day: dayLabel })} emptyLabel={tr('hm.rt.none', { day: dayLabel })}
        split={list.length ? [{ label: tr('hm.left'), value: String(left), testID: 'hm-rt-left' }, { label: tr('hm.doneCell'), value: String(list.length - left), testID: 'hm-rt-done' }] : undefined} />
      <HmWeek day={day} onSelect={setDay} marks={marks} countLabel={(n) => tr('hm.rt.count', { count: n })} testID="hm-rt-week" />
      {list.length ? (
        <MotionList style={{ gap: spacing.sm }} testID="hm-rt-list">
          {list.map((t) => (
            <MotionItem key={t.id}><View key={t.id} style={{ gap: 2 }}>
              {routineOf(t) ? <Text variant="caption" muted>{routineOf(t)}</Text> : null}
              <TaskRow task={t} onEdit={onEdit} />
            </View></MotionItem>
          ))}
        </MotionList>
      ) : <HmEmpty testID="hm-rt-empty" />}
    </View>
  );
}
