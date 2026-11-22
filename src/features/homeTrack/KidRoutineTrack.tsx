/**
 * Routines de l'enfant — suivi d'une journée (22/11/2026). Même donnée que le mode enfant (kid_routine_checks) :
 *  · étapes cochées le jour sélectionné en grand, « reste / fait », dernière coche (qui, quand) si elle est notée ;
 *  · semaine touchable, jour gardé dans l'adresse (« ?day= ») ; un jour sans coche = « rien de noté » ;
 *  · une routine du jour → sa fiche (Tray) : cocher / décocher les étapes de CE jour en valeurs provisoires, Annuler,
 *    Enregistrer verrouillé (écrit par `useToggleKidStep`, comme le mode enfant).
 */
import { MotionItem, MotionList } from '@/motion/ListMotion';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useKidChecksRange } from '@/lib/data/hooks-homeTrack';
import { useToggleKidStep, type KidRoutine } from '@/lib/data/hooks-tools6';
import { countByDay, kidProgress, stepDiff } from '@/lib/domain/homeTrack';
import { dayDate, weekDays } from '@/lib/domain/journalTrack';
import { clock } from '@/lib/domain/sleepPlanner';
import { spacing } from '@/theme/tokens';
import { HmEmpty, HmFixTray, HmHero, HmRow, HmWeek, togglesOf, useUrlDay } from './kit';

export function KidRoutineTrack({ routines }: { routines: readonly KidRoutine[] }) {
  const [day, setDay] = useUrlDay();
  const days = weekDays(day);
  const q = useKidChecksRange(days[0], days[6]);
  const checks = useMemo(() => q.data ?? [], [q.data]);
  const toggle = useToggleKidStep();
  const { labelOf } = usePeople();
  const [openId, setOpenId] = useState<string | null>(null);
  const live = routines.filter((r) => r.active !== false);
  const p = kidProgress(live, checks, day);
  const marks = useMemo(() => countByDay(checks.filter((c) => live.some((r) => r.id === c.routine_id)), days, (c) => c.on_date), [checks, live, days]);
  const dayLabel = formatDate(dayDate(day), { weekday: 'long', day: 'numeric', month: 'long' });
  const opened = live.find((r) => r.id === openId) ?? null;
  const doneSteps = (rid: string) => [...new Set(checks.filter((c) => c.routine_id === rid && c.on_date === day).map((c) => c.step))].sort((a, b) => a - b);
  const lastLine = p?.last ? (p.last.by ? tr('hm.kr.lastBy', { who: labelOf(p.last.by), time: clock(new Date(p.last.at)) }) : tr('hm.kr.lastAt', { time: clock(new Date(p.last.at)) })) : null;

  return (
    <View style={{ gap: spacing.sm }} testID="hm-kr">
      <HmHero testID="hm-kr-hero" value={p && p.done ? String(p.done) : null} unit={p ? tr('hm.kr.unit', { total: p.total, day: dayLabel }) : null}
        emptyLabel={tr('hm.kr.none', { day: dayLabel })}
        split={p && p.done ? [{ label: tr('hm.left'), value: String(p.remaining), testID: 'hm-kr-left' }, { label: tr('hm.doneCell'), value: String(p.done), testID: 'hm-kr-done' }] : undefined}
        caption={lastLine} />
      <HmWeek day={day} onSelect={setDay} marks={marks} countLabel={(n) => tr('hm.kr.count', { count: n })} testID="hm-kr-week" />
      {live.length ? (
        <View>
          <Text variant="label" muted>{tr('hm.kr.ofDay', { day: dayLabel })}</Text>
          <MotionList>{live.map((r) => {
            const s = p?.perRoutine[r.id];
            return <MotionItem key={r.id}><HmRow key={r.id} icon="check-square" title={r.title} testID={`hm-kr-open-${r.id}`}
              detail={s && s.done ? tr('hm.kr.progress', { done: s.done, total: s.total }) : tr('hm.nothing')} onPress={() => setOpenId(r.id)} /></MotionItem>;
          })}</MotionList>
        </View>
      ) : <HmEmpty label={tr('hm.kr.noRoutine')} />}
      {opened ? (
        <HmFixTray open={!!opened} onOpenChange={(v) => { if (!v) setOpenId(null); }} testID="hm-kr-tray"
          title={opened.title} hero={tr('hm.kr.ratio', { done: doneSteps(opened.id).length, total: opened.steps.length })}
          lines={[dayLabel, ...doneSteps(opened.id).map((i) => opened.steps[i]?.label).filter(Boolean).slice(0, 3)]}
          editLabel={tr('hm.kr.fix')} editTitle={tr('hm.kr.fixTitle', { day: dayLabel })}
          fields={[{ key: 'steps', label: opened.title, kind: 'toggles', options: opened.steps.map((s) => s.label) }]}
          initial={{ steps: doneSteps(opened.id).join(',') }}
          onSave={async (d) => {
            const diff = stepDiff(doneSteps(opened.id), togglesOf(d.steps));
            for (const step of diff.add) await toggle.mutateAsync({ routineId: opened.id, day, step, done: true });
            for (const step of diff.remove) await toggle.mutateAsync({ routineId: opened.id, day, step, done: false });
            return 'ok';
          }} />
      ) : null}
    </View>
  );
}
