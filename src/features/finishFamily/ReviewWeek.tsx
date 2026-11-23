/**
 * Bilan de la semaine — suivi (23/11/2026). Mêmes tables que l'écran (family_tasks, care_requests, care_shifts) :
 *  · semaine gardée dans l'adresse (« ?week= ») ; tâches faites de CETTE semaine en grand (« rien de noté » sinon),
 *    demandes, nuits et temps pour soi chacun dans sa case (jamais additionnés) ;
 *  · liste datée des tâches faites : jour et heure en colonne fixe, qui l'a faite ;
 *  · une tâche → sa fiche (« ?task= ») : qui la porte, intitulé (TaskCarrierTray) ; lecture seule sans droit d'édition.
 */
import { MotionItem, MotionList } from '@/motion/ListMotion';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import type { Person } from '@/lib/data/hooks-family-load';
import type { CareRequest, CareShift, FamilyTask } from '@/lib/domain/familyLoad';
import { reviewOfWeek } from '@/lib/domain/finishFamily';
import { mondayOfDay } from '@/lib/domain/homeTrack';
import { isoDay } from '@/lib/domain/journalTrack';
import { clock } from '@/lib/domain/sleepPlanner';
import { spacing } from '@/theme/tokens';
import { HmEmpty, HmHero, HmRow, HmWeekStepper, useUrlWeek } from '@/features/homeTrack/kit';
import { TaskCarrierTray, useCanEditLists, useOpenParam } from './shared';

export function ReviewWeek({ tasks, requests, shifts, people, labelOf }: {
  tasks: readonly FamilyTask[]; requests: readonly CareRequest[]; shifts: readonly CareShift[]; people: readonly Person[];
  labelOf: (id: string | null | undefined) => string;
}) {
  const canEdit = useCanEditLists();
  const [week, setWeek] = useUrlWeek(mondayOfDay(isoDay(new Date())));
  const [taskId, setTask] = useOpenParam('task');
  const r = useMemo(() => reviewOfWeek({ tasks, requests, shifts, monday: week }), [tasks, requests, shifts, week]);
  const opened = taskId ? tasks.find((t) => t.id === taskId) ?? null : null;
  return (
    <View style={{ gap: spacing.sm }} testID="ff-review">
      <HmWeekStepper monday={week} onSelect={setWeek} testID="ff-review-week" />
      <HmHero testID="ff-review-hero" value={r.doneCount == null ? null : String(r.doneCount)} unit={tr('ff.review.unit', { count: r.doneCount ?? 0 })} emptyLabel={tr('ff.review.none')}
        split={[
          { label: tr('u2.review.requests'), value: String(r.requests), testID: 'ff-review-req' },
          { label: tr('u2.review.nights'), value: String(r.nights), testID: 'ff-review-nights' },
          { label: tr('u2.review.me_time'), value: String(r.rest), testID: 'ff-review-rest' },
        ]} />
      <Text variant="label" muted>{tr('ff.review.list')}</Text>
      {r.done.length ? (
        <MotionList testID="ff-review-list">
          {r.done.map((t) => (
            <MotionItem key={t.id}>
              <HmRow time={formatDate(t.done_at!, { weekday: 'short', day: 'numeric' })} icon="check-circle" title={t.title} testID={`ff-review-row-${t.id}`}
                detail={[clock(new Date(t.done_at!)), t.done_by ? tr('jt.task.doneBy', { who: labelOf(t.done_by) }) : t.assignee_id ? tr('hm.load.assigned', { who: labelOf(t.assignee_id) }) : null].filter(Boolean).join(' · ')}
                onPress={() => setTask(t.id)} />
            </MotionItem>
          ))}
        </MotionList>
      ) : <HmEmpty testID="ff-review-empty" label={tr('ff.review.empty')} />}
      <TaskCarrierTray task={opened} onClose={() => setTask(null)} people={people} labelOf={labelOf} canEdit={canEdit} testID="ff-review-tray" />
    </View>
  );
}
