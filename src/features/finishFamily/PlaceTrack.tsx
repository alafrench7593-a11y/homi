/**
 * « Ma place dans la famille » — ce qui m'attend (23/11/2026). Même table que « Tâches » (family_tasks) :
 *  · mes tâches à faire en grand (« rien ne t'attend » sinon), puis en retard / cette semaine / missions reçues en
 *    cours, chacune dans sa case ;
 *  · liste datée : échéance en colonne fixe (« — » sans échéance), heure, catégorie ;
 *  · une tâche → sa fiche (« ?task= ») : la confier à l'autre, l'intitulé, l'échéance (TaskCarrierTray).
 *  Les missions ont leur écran (elles avancent par leurs réponses) : elles ne sont que comptées ici.
 */
import { MotionItem, MotionList } from '@/motion/ListMotion';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import type { Person } from '@/lib/data/hooks-family-load';
import { categoryOf, type FamilyTask } from '@/lib/domain/familyLoad';
import { myOpenTasks } from '@/lib/domain/finishFamily';
import { clock } from '@/lib/domain/sleepPlanner';
import { spacing } from '@/theme/tokens';
import { HmEmpty, HmHero, HmRow } from '@/features/homeTrack/kit';
import { TaskCarrierTray, useCanEditLists, useOpenParam } from './shared';

const MAX = 10;

export function PlaceTrack({ tasks, me, people, labelOf, missions }: {
  tasks: readonly FamilyTask[]; me: string | null; people: readonly Person[]; labelOf: (id: string | null | undefined) => string;
  /** Missions reçues en cours */
  missions: number;
}) {
  const canEdit = useCanEditLists();
  const [taskId, setTask] = useOpenParam('task');
  const now = new Date();
  const s = useMemo(() => myOpenTasks(tasks, me, new Date()), [tasks, me]);
  const opened = taskId ? tasks.find((t) => t.id === taskId) ?? null : null;
  return (
    <View style={{ gap: spacing.sm }} testID="ff-place">
      <HmHero testID="ff-place-hero" value={s.total == null ? null : String(s.total)} unit={tr('ff.place.unit', { count: s.total ?? 0 })} emptyLabel={tr('ff.place.none')}
        split={[
          { label: tr('ff.place.late'), value: String(s.late), testID: 'ff-place-late' },
          { label: tr('ff.place.week'), value: String(s.week), testID: 'ff-place-week' },
          { label: tr('ff.place.missions'), value: String(missions), testID: 'ff-place-missions' },
        ]} />
      {s.list.length ? (
        <>
          <Text variant="label" muted>{tr('ff.place.list')}</Text>
          <MotionList testID="ff-place-list">
            {s.list.slice(0, MAX).map((t) => {
              const late = !!t.due_at && Date.parse(t.due_at) < now.getTime();
              return (
                <MotionItem key={t.id}>
                  <HmRow time={t.due_at ? formatDate(t.due_at, { day: 'numeric', month: 'short' }) : null} icon={late ? 'alert-circle' : 'check-square'} title={t.title} testID={`ff-place-row-${t.id}`}
                    detail={[t.due_at ? clock(new Date(t.due_at)) : tr('ff.task.noDue'), late ? tr('ff.place.lateOne') : null, categoryOf(t.category).label].filter(Boolean).join(' · ')}
                    onPress={() => setTask(t.id)} />
                </MotionItem>
              );
            })}
          </MotionList>
          {s.list.length > MAX ? <Text variant="caption" muted>{tr('ff.load.more', { count: s.list.length - MAX })}</Text> : null}
        </>
      ) : <HmEmpty testID="ff-place-empty" label={tr('ff.place.empty')} />}
      <TaskCarrierTray task={opened} onClose={() => setTask(null)} people={people} labelOf={labelOf} canEdit={canEdit} testID="ff-place-tray" />
    </View>
  );
}
