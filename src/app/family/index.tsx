/**
 * Organisation familiale : tâches partagées, demandes de relais, raccourcis vers le relais de nuit,
 * le temps pour soi, les routines, la journée difficile et le bilan de la semaine.
 * Collaboration, pas compétition : aucun classement, aucun compteur par personne.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { Banner, Button, Card, Chip, Field, haptic, IconButton, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { DayThread, clockFr, type ThreadRow } from '@/features/dayThread';
import { threadStates } from '@/lib/domain/dayThread';
import { friendlyError } from '@/lib/data/hooks-settings';
import { LoadBar } from '@/features/motionViz';
import { QuickActionsGrid, RequestCard, RequestSheet, TaskRow, TaskSheet } from '@/features/familyLoad';
import { useCareRequests, useCareShifts, useFamilyTasks, usePeople, useSaveTask } from '@/lib/data/hooks-family-load';
import { useParentSleepLogs } from '@/lib/data/hooks-sleep';
import { overloadSignals, sameLocalDay, type FamilyTask, type RequestKind } from '@/lib/domain/familyLoad';
import { todayISO } from '@/lib/domain/dates';
import { useUiStore } from '@/lib/store';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

type Filter = 'today' | 'upcoming' | 'unassigned' | 'done';

export default function FamilyHome() {
  const day = todayISO();
  const tasksQ = useFamilyTasks();
  const requestsQ = useCareRequests();
  const { data: shifts } = useCareShifts();
  const { data: mySleep } = useParentSleepLogs(1);
  const { me, labelOf } = usePeople();
  const toast = useToast();
  const saveTask = useSaveTask();
  const [quick, setQuick] = useState('');
  const tipsOff = useUiStore((s) => s.overloadTipsOff);
  const setTipsOff = useUiStore((s) => s.setOverloadTipsOff);
  const [filter, setFilter] = useState<Filter>('today');
  const [editing, setEditing] = useState<FamilyTask | null>(null);
  const [creating, setCreating] = useState(false);
  const [request, setRequest] = useState<{ kind: RequestKind; taskId?: string } | null>(null);

  const tasks = tasksQ.data ?? [];
  const requests = requestsQ.data ?? [];
  const open = requests.filter((r) => r.status === 'open');
  const recent = requests.filter((r) => r.status !== 'open').slice(0, 3);

  const list = useMemo(() => {
    const todo = tasks.filter((t) => t.status === 'todo');
    if (filter === 'today') return todo.filter((t) => !t.due_at || sameLocalDay(t.due_at, day) || Date.parse(t.due_at) < Date.now());
    if (filter === 'upcoming') return todo.filter((t) => t.due_at && !sameLocalDay(t.due_at, day) && Date.parse(t.due_at) > Date.now());
    if (filter === 'unassigned') return todo.filter((t) => !t.assignee_id);
    return tasks.filter((t) => t.status === 'done').sort((a, b) => ((a.done_at ?? '') < (b.done_at ?? '') ? 1 : -1)).slice(0, 30);
  }, [tasks, filter, day]);

  const signals = useMemo(() => (tipsOff || !me ? [] : overloadSignals({ tasks, requests, shifts: shifts ?? [], me, day, myDeclaredFatigue: mySleep?.[0]?.log_date === day ? mySleep[0].fatigue : null })), [tasks, requests, shifts, me, day, tipsOff, mySleep]);

  // Journée en famille : tâches du jour (et sans date) sur le fil d'or, cochées ou prises en charge en un geste
  const dayRows = useMemo<ThreadRow[]>(() => {
    const todays = tasks.filter((x) => x.status !== 'cancelled' && (
      (x.status === 'todo' && (!x.due_at || sameLocalDay(x.due_at, day) || Date.parse(x.due_at) < Date.now()))
      || (x.status === 'done' && x.done_at && sameLocalDay(x.done_at, day))));
    const states = threadStates(todays.map((x) => ({ key: x.id, at: x.due_at && sameLocalDay(x.due_at, day) ? x.due_at : null, done: x.status === 'done', actionable: true, task: x })));
    return states.map(({ task: x, state }) => ({
      key: x.id,
      state: x.status === 'todo' && x.due_at && !sameLocalDay(x.due_at, day) ? 'late' : state,
      time: x.due_at && sameLocalDay(x.due_at, day) ? clockFr(x.due_at) : '',
      title: x.title,
      sub: [x.assignee_id ? labelOf(x.assignee_id) : tr('u2.fam.nobody_yet'), x.essential ? tr('u2.fam.essential_lc') : null].filter(Boolean).join(' · '),
      icon: 'check',
      onPress: () => setEditing(x),
      testID: `family-day-${x.id}`,
      action: x.status === 'done' ? undefined
        : !x.assignee_id && me ? { label: tr('u2.fam.take'), onPress: () => void quickSave(x.id, { assignee_id: me }, tr('u2.fam.taken')), testID: `family-take-${x.id}` }
          : { label: tr('u2.fam.done'), onPress: () => void quickSave(x.id, { status: 'done' }, tr('u2.fam.done_toast')), testID: `family-done-${x.id}` },
    }));
  }, [tasks, day, me, labelOf]); // eslint-disable-line react-hooks/exhaustive-deps

  async function quickSave(id: string, input: Parameters<typeof saveTask.mutateAsync>[0]['input'], message: string) {
    try { await saveTask.mutateAsync({ id, input }); haptic('success'); toast(message); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function quickAdd() {
    const title = quick.trim();
    if (!title) return;
    try {
      await saveTask.mutateAsync({ input: { title: title.slice(0, 120), category: 'other', due_at: null, assignee_id: null, priority: 'normal', essential: false, recurrence: null, notes: null } });
      haptic('success'); setQuick(''); toast(tr('u2.fam.added_today'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  const [proposeHint, setProposeHint] = useState(false);
  function pick(kind: RequestKind) {
    if (kind === 'take_task') { setFilter('today'); setProposeHint(true); return; }
    if (kind === 'swap_slot') { router.push('/family/nights'); return; }
    setRequest({ kind });
  }

  return (
    <Screen back title={tr('u2.fam.title')} subtitle={tr('u2.fam.subtitle')} right={<IconButton icon="plus" label={tr('u2.fam.new_task')} onPress={() => setCreating(true)} />}
      action={{ label: tr('u2.fam.add_task'), icon: 'plus', onPress: () => setCreating(true), testID: 'family-main-action' }}>
      {(() => {
        const todo = tasks.filter((x) => x.status === 'todo');
        const dueToday = todo.filter((x) => !x.due_at || sameLocalDay(x.due_at, day) || Date.parse(x.due_at) < Date.now()).length;
        const doneToday = tasks.filter((x) => x.status === 'done' && x.done_at && sameLocalDay(x.done_at, day)).length;
        return tasksQ.data ? (
          <TodaySummary items={[
            { icon: 'check-square', value: String(dueToday), label: tr('u2.fam.to_do') },
            { icon: 'user-x', value: String(todo.filter((x) => !x.assignee_id).length), label: tr('u2.fam.unassigned') },
            { icon: 'check', value: String(doneToday), label: tr('u2.fam.done_pl') },
            { icon: 'message-circle', value: String(open.length), label: tr('u2.fam.open_requests') },
          ]} />
        ) : null;
      })()}
      <DayThread title={tr('u2.fam.our_day')} caption={tr('u2.fam.our_day_caption')} rows={dayRows} testID="family-day"
        empty={<Text variant="small" muted>{tr('u2.fam.nothing_planned')}</Text>} />
      <Row style={{ alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <Field label={tr('u2.fam.quick_add')} placeholder={tr('u2.fam.quick_ph')} value={quick} onChangeText={setQuick} onSubmitEditing={() => void quickAdd()} returnKeyType="done" testID="family-quick" />
        </View>
        <Button label={tr('u2.fam.add')} icon="plus" size="sm" onPress={() => void quickAdd()} disabled={!quick.trim()} testID="family-quick-add" />
      </Row>

      <Card tone="soft" onPress={() => router.push('/family/difficult')} accessibilityLabel={tr('u2.fam.hard_a11y')}>
        <ListRow icon="wind" title={tr('u2.fam.hard_title')} subtitle={tr('u2.fam.hard_sub')} />
      </Card>

      <SectionTitle title={tr('u2.fam.quick_actions')} />
      <QuickActionsGrid onPick={pick} />
      {proposeHint ? <Banner tone="info">{tr('u2.fam.propose_hint')}</Banner> : null}

      {signals.length ? (
        <>
          <SectionTitle title={tr('u2.fam.lighten')} action={tr('u2.fam.hide_tips')} onAction={() => setTipsOff(true)} />
          {signals.map((s, i) => (
            <StaggerItem key={s.key} index={i}>
              <Card>
                <Text weight="bold">{s.title}</Text>
                <Text variant="small" muted>{s.why}</Text>
                <Row wrap style={{ marginTop: spacing.xs }}>
                  {s.suggestions.map((g) => <Button key={g.label} label={g.label} size="sm" variant="secondary" onPress={() => (g.to ? router.push(g.to as never) : undefined)} />)}
                </Row>
              </Card>
            </StaggerItem>
          ))}
          <Text variant="caption" muted>{tr('u2.fam.tips_note')}</Text>
        </>
      ) : tipsOff ? <Button label={tr('u2.fam.show_tips')} size="sm" variant="ghost" onPress={() => setTipsOff(false)} /> : null}

      {open.length || recent.length ? <SectionTitle title={tr('u2.fam.requests')} /> : null}
      {[...open, ...recent].map((r, i) => <StaggerItem key={r.id} index={i}><RequestCard r={r} tasks={tasks} /></StaggerItem>)}

      <SectionTitle title={tr('u2.fam.tasks')} />
      {(() => {
        const todays = tasks.filter((x) => x.due_at && sameLocalDay(x.due_at, day) && x.status !== 'cancelled');
        return todays.length ? <Card><LoadBar done={todays.filter((x) => x.status === 'done').length} assigned={todays.filter((x) => x.status === 'todo' && x.assignee_id).length} unassigned={todays.filter((x) => x.status === 'todo' && !x.assignee_id).length} /></Card> : null;
      })()}
      <Row wrap>
        {([['today', tr('u2.fam.f_today')], ['upcoming', tr('u2.fam.f_upcoming')], ['unassigned', tr('u2.fam.unassigned')], ['done', tr('u2.fam.done_pl')]] as const).map(([v, l]) => <Chip key={v} label={l} selected={filter === v} onPress={() => setFilter(v)} />)}
      </Row>
      {tasksQ.isLoading && !tasksQ.data ? <Skeleton rows={3} /> : null}
      {tasksQ.isError && !tasksQ.data ? <ErrorView error={tasksQ.error} onRetry={() => void tasksQ.refetch()} /> : null}
      {tasksQ.data && list.length === 0 ? (
        <EmptyState icon="check-square" title={filter === 'done' ? tr('u2.fam.empty_done') : tr('u2.fam.empty_todo')} body={filter === 'today' ? tr('u2.fam.empty_body') : undefined} action={filter !== 'done' ? { label: tr('u2.fam.add_task'), onPress: () => setCreating(true) } : undefined} />
      ) : null}
      {list.map((task, i) => (
        <StaggerItem key={task.id} index={i}>
          <TaskRow task={task} onEdit={setEditing} onPropose={(x) => { setProposeHint(false); setRequest({ kind: 'take_task', taskId: x.id }); }} />
        </StaggerItem>
      ))}

      <SectionTitle title={tr('u2.fam.organise')} />
      <Card>
        {[
          { icon: 'moon' as const, title: tr('u2.fam.nights'), subtitle: tr('u2.fam.nights_sub'), to: '/family/nights' },
          { icon: 'sun' as const, title: tr('u2.fam.me_time'), subtitle: tr('u2.fam.me_time_sub'), to: '/family/me-time' },
          { icon: 'list' as const, title: tr('u2.fam.routines'), subtitle: tr('u2.fam.routines_sub'), to: '/family/routines' },
          { icon: 'calendar' as const, title: tr('u2.fam.calendar'), subtitle: tr('u2.fam.calendar_sub'), to: '/calendar' },
          { icon: 'pie-chart' as const, title: tr('u2.fam.review'), subtitle: tr('u2.fam.review_sub'), to: '/family/review' },
          { icon: 'clock' as const, title: tr('u2.fam.history'), subtitle: tr('u2.fam.history_sub'), to: '/family/history' },
          { icon: 'zap' as const, title: tr('u2.fam.urgent'), subtitle: tr('u2.fam.urgent_sub'), to: '/family/urgent' },
        ].map((l) => <ListRow key={l.to} icon={l.icon} title={l.title} subtitle={l.subtitle} onPress={() => router.push(l.to as never)} />)}
      </Card>

      <View style={{ height: spacing.md }} />
      <TaskSheet task={editing} open={!!editing || creating} onClose={() => { setEditing(null); setCreating(false); }} />
      <RequestSheet kind={request?.kind ?? null} taskId={request?.taskId} onClose={() => setRequest(null)} />
    </Screen>
  );
}
