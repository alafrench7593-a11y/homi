/**
 * « Vider ma tête » — ce qui est sorti de ma tête (23/11/2026). Même table que « Tâches » (family_tasks) : les tâches
 * que J'AI notées (ici ou dans Tâches, hors routines), rien d'autre :
 *  · jour gardé dans l'adresse (« ?day= »), semaine touchable : tâches notées par jour (« rien de noté » sinon) ;
 *  · tâches notées ce jour-là en grand, puis la liste : heure de la note en colonne fixe, qui la porte, échéance ;
 *  · une tâche → sa fiche (« ?task= ») : qui la porte, intitulé, échéance (TaskCarrierTray) ; lecture seule sans droit.
 */
import { MotionItem, MotionList } from '@/motion/ListMotion';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import type { Person } from '@/lib/data/hooks-family-load';
import type { FamilyTask } from '@/lib/domain/familyLoad';
import { notedByMe } from '@/lib/domain/finishFamily';
import { countByDay } from '@/lib/domain/homeTrack';
import { dayDate, isoDay, weekDays } from '@/lib/domain/journalTrack';
import { clock } from '@/lib/domain/sleepPlanner';
import { spacing } from '@/theme/tokens';
import { HmEmpty, HmHero, HmRow, HmWeek, useUrlDay } from '@/features/homeTrack/kit';
import { TaskCarrierTray, useCanEditLists, useOpenParam } from './shared';

export function DumpNoted({ tasks, me, people, labelOf }: { tasks: readonly FamilyTask[]; me: string | null; people: readonly Person[]; labelOf: (id: string | null | undefined) => string }) {
  const canEdit = useCanEditLists();
  const [day, setDay] = useUrlDay();
  const [taskId, setTask] = useOpenParam('task');
  const days = weekDays(day);
  const { mine, ofDay } = useMemo(() => notedByMe(tasks, me, day), [tasks, me, day]);
  const marks = useMemo(() => countByDay(mine, days, (t) => isoDay(new Date(t.created_at))), [mine, days]);
  const label = formatDate(dayDate(day), { weekday: 'long', day: 'numeric', month: 'long' });
  const opened = taskId ? tasks.find((t) => t.id === taskId) ?? null : null;
  return (
    <View style={{ gap: spacing.sm }} testID="ff-dump">
      <HmHero testID="ff-dump-hero" value={ofDay.length ? String(ofDay.length) : null} unit={tr('ff.dump.unit', { count: ofDay.length, day: label })}
        emptyLabel={tr('ff.dump.none', { day: label })}
        split={ofDay.length ? [
          { label: tr('ff.dump.open'), value: String(ofDay.filter((t) => t.status === 'todo').length), testID: 'ff-dump-open' },
          { label: tr('ff.dump.done'), value: String(ofDay.filter((t) => t.status === 'done').length), testID: 'ff-dump-done' },
        ] : undefined} />
      <HmWeek day={day} onSelect={setDay} marks={marks} countLabel={(n) => tr('ff.dump.count', { count: n })} testID="ff-dump-week" />
      <Text variant="label" muted>{tr('ff.dump.ofDay', { day: label })}</Text>
      {ofDay.length ? (
        <MotionList testID="ff-dump-list">
          {ofDay.map((t) => (
            <MotionItem key={t.id}>
              <HmRow time={clock(new Date(t.created_at))} icon={t.status === 'done' ? 'check-circle' : 'circle'} title={t.title} testID={`ff-dump-row-${t.id}`} faded={t.status !== 'todo'}
                detail={[t.assignee_id ? tr('ff.task.carried', { who: labelOf(t.assignee_id) }) : tr('ff.task.nobodyLine'), t.due_at ? formatDate(t.due_at, { weekday: 'short', day: 'numeric', month: 'short' }) : null].filter(Boolean).join(' · ')}
                onPress={() => setTask(t.id)} />
            </MotionItem>
          ))}
        </MotionList>
      ) : <HmEmpty testID="ff-dump-empty" />}
      <Text variant="caption" muted>{tr('ff.dump.hint')}</Text>
      <TaskCarrierTray task={opened} onClose={() => setTask(null)} people={people} labelOf={labelOf} canEdit={canEdit} testID="ff-dump-tray" />
    </View>
  );
}
