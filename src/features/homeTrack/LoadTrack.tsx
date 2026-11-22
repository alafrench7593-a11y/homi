/**
 * « Qui y pense » — la semaine en tâches FAITES (22/11/2026). Même donnée que les tâches du foyer (family_tasks) :
 *  · jour sélectionné gardé dans l'adresse (« ?day= »), semaine touchable : tâches faites par jour (un jour sans tâche
 *    faite = « rien de noté ») ;
 *  · tâches faites dans la semaine en grand, une case par adulte (qui a fait, sinon à qui c'était confié : jamais
 *    deviné), tâches ouvertes sans personne ;
 *  · la liste du jour : heure en colonne fixe, tâche, qui l'a faite. Rouvrir ou corriger se fait dans « Tâches ».
 *  Aucun score : des nombres de tâches, de même nature, à lire à deux.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import type { FamilyTask } from '@/lib/domain/familyLoad';
import { countByDay, mondayOfDay, shareOfWeek } from '@/lib/domain/homeTrack';
import { dayDate, isoDay, weekDays } from '@/lib/domain/journalTrack';
import { clock } from '@/lib/domain/sleepPlanner';
import { spacing } from '@/theme/tokens';
import { HmEmpty, HmHero, HmRow, HmWeek, useUrlDay } from './kit';

export function LoadTrack({ tasks, people, labelOf }: { tasks: readonly FamilyTask[]; people: readonly string[]; labelOf: (id: string | null | undefined) => string }) {
  const [day, setDay] = useUrlDay();
  const days = weekDays(day);
  const monday = mondayOfDay(day);
  const done = useMemo(() => tasks.filter((t) => t.status === 'done' && t.done_at), [tasks]);
  const marks = useMemo(() => countByDay(done, days, (t) => isoDay(new Date(t.done_at!))), [done, days]);
  const share = shareOfWeek(tasks, monday, people);
  const ofDay = done.filter((t) => isoDay(new Date(t.done_at!)) === day).sort((a, b) => (a.done_at! < b.done_at! ? -1 : 1));
  const dayLabel = formatDate(dayDate(day), { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <View style={{ gap: spacing.sm }} testID="hm-load">
      <HmHero testID="hm-load-hero" value={share.total == null ? null : String(share.total)} unit={tr('hm.load.unit')} emptyLabel={tr('hm.load.none')}
        split={share.rows.map((r) => ({ label: labelOf(r.id), value: String(r.done), testID: `hm-load-p-${r.id}` }))}
        caption={share.unassigned ? tr('hm.load.unassigned', { count: share.unassigned }) : null} />
      <HmWeek day={day} onSelect={setDay} marks={marks} countLabel={(n) => tr('hm.load.count', { count: n })} testID="hm-load-week" />
      <Text variant="label" muted>{tr('hm.load.ofDay', { day: dayLabel })}</Text>
      {ofDay.length ? (
        <View testID="hm-load-list">
          {ofDay.map((t) => <HmRow key={t.id} time={clock(new Date(t.done_at!))} icon="check-circle" title={t.title} testID={`hm-load-row-${t.id}`}
            detail={t.done_by ? tr('jt.task.doneBy', { who: labelOf(t.done_by) }) : t.assignee_id ? tr('hm.load.assigned', { who: labelOf(t.assignee_id) }) : null}
            onPress={() => router.push('/family' as never)} />)}
        </View>
      ) : <HmEmpty testID="hm-load-empty" />}
    </View>
  );
}
