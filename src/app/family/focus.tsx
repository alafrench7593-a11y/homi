/**
 * Mode « parent TDAH » : 3 choses aujourd'hui (23/11/2026).
 * Un seul écran, peu de texte : 3 priorités maximum (choix gardés sur l'appareil), « Juste 10 minutes »
 * pour démarrer, le reste replié et reportable à demain d'un geste. Aucun diagnostic demandé, rien de nouveau en base.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, haptic, ListRow, SectionTitle, Text } from '@/components/ui';
import { EmptyState } from '@/components/States';
import { useUserId } from '@/lib/auth';
import { useBatchTasks, useFamilyTasks, useSaveTask } from '@/lib/data/hooks-family-load';
import { friendlyError } from '@/lib/data/hooks-settings';
import { lightenDay, type FamilyTask } from '@/lib/domain/familyLoad';
import { focusDay, FOCUS_MAX, startTimerEnd, togglePick } from '@/lib/domain/focusDay';
import { useUiStore } from '@/lib/store';
import { todayISO } from '@/lib/domain/dates';
import { toolBlurb, toolName } from '@/lib/domain/toolCatalog';
import { formatTime, t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

export default function FocusDay() {
  const toast = useToast();
  const me = useUserId();
  const day = todayISO();
  const { data: tasks } = useFamilyTasks();
  const save = useSaveTask();
  const batch = useBatchTasks();
  const picks = useUiStore((st) => st.focusPicks);
  const setPicks = useUiStore((st) => st.setFocusPicks);
  const { focus, rest, canAdd } = useMemo(() => focusDay(tasks ?? [], day, me, picks), [tasks, day, me, picks]);
  // Report à demain : jamais les 3 choses choisies
  const plan = useMemo(() => lightenDay(tasks ?? [], day).plan.filter((x) => !focus.some((f) => f.id === x.id)), [tasks, day, focus]);
  const [showRest, setShowRest] = useState(false);
  const [timer, setTimer] = useState<{ id: string; end: Date } | null>(null);

  const set = (t: FamilyTask, input: Partial<FamilyTask>, msg?: string) => 
    save.mutateAsync({ id: t.id, input, base: t }).then(() => msg && toast(msg, 'success')).catch((e) => toast(friendlyError(e), 'error'));

  return (
    <Screen back title={toolName('focus_day')} subtitle={toolBlurb('focus_day')}>
      <SectionTitle title={tr('fcs.today', { n: focus.length, max: FOCUS_MAX })} />
      {focus.length ? (
        <Card>
          {focus.map((t) => (
            <View key={t.id} style={{ gap: 4, paddingVertical: 4 }}>
              <ListRow icon="circle" title={t.title} subtitle={t.due_at ? formatTime(t.due_at) : undefined} />
              <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
                <Button label={tr('fcs.markDone')} icon="check" size="sm" testID={`focus-done-${t.id}`} onPress={() => { haptic('success'); void set(t, { status: 'done' }, tr('fcs.bravo')); }} />
                {timer?.id === t.id
                  ? <Banner tone="info">{tr('fcs.timer', { time: formatTime(timer.end.toISOString()) })}</Banner>
                  : <Button label={tr('fcs.start10')} icon="play" size="sm" variant="secondary" testID={`focus-start-${t.id}`} onPress={() => setTimer({ id: t.id, end: startTimerEnd(Date.now()) })} />}
                <Button label={tr('fcs.unpick')} size="sm" variant="ghost" testID={`focus-unpick-${t.id}`} onPress={() => setPicks(togglePick(picks, day, t.id))} />
              </View>
            </View>
          ))}
        </Card>
      ) : <EmptyState icon="target" title={tr('fcs.empty')} />}
      {canAdd && rest.length ? <Text muted>{tr('fcs.pickHint')}</Text> : null}
      {rest.length ? (
        <>
          {!canAdd ? <Button label={showRest ? tr('fcs.hideRest') : tr('fcs.rest', { count: rest.length })} variant="ghost" onPress={() => setShowRest((v) => !v)} testID="focus-rest" /> : null}
          {showRest || canAdd ? (
            <Card>
              {rest.map((t) => (
                <ListRow key={t.id} icon={canAdd ? 'plus' : 'minus'} title={t.title} subtitle={t.due_at ? formatTime(t.due_at) : undefined} testID={`focus-pick-${t.id}`}
                  onPress={canAdd ? () => { haptic('selection'); setPicks(togglePick(picks, day, t.id)); } : undefined} />
              ))}
            </Card>
          ) : null}
        </>
      ) : null}
      {plan.length ? (
        <Button label={tr('u2.urgent.postpone', { count: plan.length })} icon="skip-forward" variant="secondary" testID="focus-postpone"
          onPress={() => batch.mutateAsync({ postpone: plan.map((p) => ({ id: p.id, to: p.to })) }).then(() => toast(tr('u2.urgent.postponed'))).catch((e) => toast(friendlyError(e), 'error'))} />
      ) : null}
      <Button label={toolName('brain_dump')} icon="download" variant="ghost" onPress={() => router.push('/family/brain-dump')} testID="focus-dump" />
    </Screen>
  );
}
