/**
 * École — devoirs de la semaine (22/11/2026). Même donnée que l'app Devoirs (child_homework) :
 *  · semaine gardée dans l'adresse (« ?week= ») ; devoirs qui RESTENT en grand, « reste / fait », dernier devoir
 *    coché (qui, quand) si c'est noté ; aucun devoir : « rien de noté » ;
 *  · les devoirs de la semaine (jour en colonne fixe) ; un devoir ouvre sa fiche dans l'app Devoirs (cocher, corriger).
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { formatDate, t as tr } from '@/i18n';
import { usePeople } from '@/lib/data/hooks-family-load';
import { homeworkLink } from '@/lib/data/hooks-partiels2';
import type { Homework } from '@/features/homework/domain';
import { shiftDay } from '@/lib/domain/journalTrack';
import { clock } from '@/lib/domain/sleepPlanner';
import { spacing } from '@/theme/tokens';
import { HmHero, HmRow, HmWeekStepper, useUrlWeek } from './kit';

export function SchoolTrack({ homework, thisWeek }: { homework: readonly Homework[]; thisWeek: string }) {
  const { labelOf } = usePeople();
  const [week, setWeek] = useUrlWeek(thisWeek);
  const end = shiftDay(week, 6);
  const list = homework.filter((h) => h.due_on >= week && h.due_on <= end);
  const left = list.filter((h) => !h.done_at);
  const done = list.filter((h) => h.done_at).sort((a, b) => (a.done_at! < b.done_at! ? 1 : -1));
  const last = done[0];
  const caption = last ? (last.done_by
    ? tr('hm.sc.lastBy', { subject: last.subject, who: labelOf(last.done_by), when: `${formatDate(last.done_at!, { weekday: 'short', day: 'numeric' })} · ${clock(new Date(last.done_at!))}` })
    : tr('hm.sc.lastAt', { subject: last.subject, when: `${formatDate(last.done_at!, { weekday: 'short', day: 'numeric' })} · ${clock(new Date(last.done_at!))}` })) : null;
  return (
    <View style={{ gap: spacing.sm }} testID="hm-sc">
      <HmWeekStepper monday={week} onSelect={setWeek} testID="hm-sc-week" />
      <HmHero testID="hm-sc-hero" value={list.length ? String(left.length) : null} unit={tr('hm.sc.unit', { count: list.length })} emptyLabel={tr('hm.sc.none')}
        split={list.length ? [{ label: tr('hm.left'), value: String(left.length), testID: 'hm-sc-left' }, { label: tr('hm.done'), value: String(done.length), testID: 'hm-sc-done' }] : undefined}
        caption={caption} />
      {list.length ? (
        <View testID="hm-sc-list">
          {[...left, ...done].map((h) => (
            <HmRow key={h.id} time={formatDate(h.due_on, { weekday: 'short', day: 'numeric' })} icon={h.done_at ? 'check-circle' : 'circle'} faded={!!h.done_at}
              title={h.subject} detail={[h.done_at ? tr('hm.done') : tr('hm.sc.todo'), h.instructions].filter(Boolean).join(' · ')}
              testID={`hm-sc-row-${h.id}`} onPress={() => router.push(homeworkLink(h) as never)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
