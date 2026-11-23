/**
 * École — devoirs de la semaine (22/11/2026). Même donnée que l'app Devoirs (child_homework) :
 *  · semaine gardée dans l'adresse (« ?week= ») ; devoirs qui RESTENT en grand, « reste / fait », dernier devoir
 *    coché (qui, quand) si c'est noté ; aucun devoir : « rien de noté » ;
 *  · les devoirs de la semaine (jour en colonne fixe) ; un devoir ouvre sa fiche (Tray) ici même, gardée dans l'adresse
 *    (« ?hw= ») : la relire, la cocher, corriger matière / consigne / échéance (23/11/2026). L'écriture passe par la
 *    MÊME mutation que l'app Devoirs (`useUpdateHomework` : enregistrement + rappel de la veille) ; « Formulaire
 *    complet » ouvre le devoir dans l'app Devoirs.
 */
import { MotionItem, MotionList } from '@/motion/ListMotion';
import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { formatDate, t as tr } from '@/i18n';
import { usePeople } from '@/lib/data/hooks-family-load';
import { homeworkLink, useUpdateHomework } from '@/lib/data/hooks-partiels2';
import type { Homework } from '@/features/homework/domain';
import { homeworkDraftError, homeworkPatch } from '@/lib/domain/finishTrack';
import { frToISO } from '@/lib/domain/dates';
import { shiftDay } from '@/lib/domain/journalTrack';
import { clock } from '@/lib/domain/sleepPlanner';
import { toFrDate } from '@/lib/validation';
import { spacing } from '@/theme/tokens';
import { HmFixTray, HmHero, HmRow, HmWeekStepper, useUrlWeek } from './kit';

export function SchoolTrack({ homework, thisWeek, childName = '' }: { homework: readonly Homework[]; thisWeek: string; childName?: string }) {
  const { labelOf } = usePeople();
  const [week, setWeek] = useUrlWeek(thisWeek);
  const qp = useLocalSearchParams<{ hw?: string }>();
  const update = useUpdateHomework();
  const end = shiftDay(week, 6);
  const list = homework.filter((h) => h.due_on >= week && h.due_on <= end);
  const left = list.filter((h) => !h.done_at);
  const done = list.filter((h) => h.done_at).sort((a, b) => (a.done_at! < b.done_at! ? 1 : -1));
  const last = done[0];
  const opened = qp.hw ? homework.find((h) => h.id === qp.hw && !h._pending) ?? null : null;
  const setOpened = (id: string | null) => router.setParams({ hw: id ?? undefined } as never);
  const when = (iso: string) => `${formatDate(iso, { weekday: 'short', day: 'numeric' })} · ${clock(new Date(iso))}`;
  const caption = last ? (last.done_by
    ? tr('hm.sc.lastBy', { subject: last.subject, who: labelOf(last.done_by), when: when(last.done_at!) })
    : tr('hm.sc.lastAt', { subject: last.subject, when: when(last.done_at!) })) : null;
  return (
    <View style={{ gap: spacing.sm }} testID="hm-sc">
      <HmWeekStepper monday={week} onSelect={setWeek} testID="hm-sc-week" />
      <HmHero testID="hm-sc-hero" value={list.length ? String(left.length) : null} unit={tr('hm.sc.unit', { count: list.length })} emptyLabel={tr('hm.sc.none')}
        split={list.length ? [{ label: tr('hm.left'), value: String(left.length), testID: 'hm-sc-left' }, { label: tr('hm.doneCell'), value: String(done.length), testID: 'hm-sc-done' }] : undefined}
        caption={caption} />
      {list.length ? (
        <MotionList testID="hm-sc-list">
          {[...left, ...done].map((h) => (
            <MotionItem key={h.id}><HmRow key={h.id} time={formatDate(h.due_on, { weekday: 'short', day: 'numeric' })} icon={h.done_at ? 'check-circle' : 'circle'} faded={!!h.done_at}
              title={h.subject} detail={[h.done_at ? tr('hm.doneCell') : tr('hm.sc.todo'), h.instructions, h._pending ? tr('fx.pending') : null].filter(Boolean).join(' · ')}
              testID={`hm-sc-row-${h.id}`} onPress={h._pending ? undefined : () => setOpened(h.id)} /></MotionItem>
          ))}
        </MotionList>
      ) : null}
      {opened ? (
        <HmFixTray open={!!opened} onOpenChange={(v) => { if (!v) setOpened(null); }} testID="hm-sc-tray"
          title={tr('ft.sc.trayTitle', { name: childName })} hero={opened.subject}
          lines={[
            tr('ft.sc.due', { date: formatDate(`${opened.due_on}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' }) }),
            opened.done_at ? tr('ft.sc.doneAt', { when: when(opened.done_at) }) : tr('hm.sc.todo'),
            opened.instructions,
          ]}
          editLabel={tr('ft.sc.fix')} editTitle={tr('ft.sc.fixTitle')}
          fields={[
            { key: 'done', label: tr('ft.sc.state'), kind: 'choice', options: [tr('hm.sc.todo'), tr('hm.doneCell')] },
            { key: 'subject', label: tr('p2.hw.fSubject'), kind: 'text', maxLength: 60 },
            { key: 'instructions', label: tr('p2.hw.fInstructions'), kind: 'multiline', maxLength: 500 },
            { key: 'due', label: tr('p2.hw.fDue'), kind: 'date' },
          ]}
          initial={{ done: opened.done_at ? '1' : '0', subject: opened.subject, instructions: opened.instructions, due: toFrDate(opened.due_on) }}
          validate={(d) => { const e = homeworkDraftError({ subject: d.subject, instructions: d.instructions }, frToISO(d.due)); return e ? tr(e) : null; }}
          onSave={async (d) => {
            const due = frToISO(d.due);
            if (!due) return tr('p2.hw.errDate');
            await update(opened, homeworkPatch(opened, { subject: d.subject, instructions: d.instructions, done: d.done === '1' ? '1' : '0' }, due, new Date()), childName);
            return 'ok';
          }}
          onFullForm={() => router.push(homeworkLink(opened) as never)} />
      ) : null}
    </View>
  );
}
