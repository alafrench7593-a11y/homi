/**
 * Briques d'interface de l'organisation familiale : ligne de tâche, éditeur, actions rapides,
 * carte de demande. Couleurs : uniquement celles du thème existant.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { usePressMotion } from '@/components/Motion';
import { DrawCheck } from '@/components/MotionKit';
import { easing } from '@/theme/motion';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Button, Card, Chip, Field, haptic, Icon, Row, Segmented, Text, Toggle } from '@/components/ui';
import { useChildren } from '@/lib/data/hooks';
import { useHealthItems } from '@/lib/data/hooks-family';
import { childAge } from '@/lib/domain/child';
import type { Child } from '@/lib/types';
import { useCareRequests, useCareShifts, useCreateRequest, useDeleteTask, useFamilyTasks, usePeople, useRespondRequest, useSaveTask, type TaskInput } from '@/lib/data/hooks-family-load';
import { router } from 'expo-router';
import { friendlyError } from '@/lib/data/hooks-settings';
import { CATEGORIES, QUICK_ACTIONS, REQUEST_LABEL, categoryOf, sameLocalDay, type CareRequest, type FamilyTask, type RequestKind } from '@/lib/domain/familyLoad';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { formatDate, formatTime, t as tr } from '@/i18n';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

const pad = (n: number) => String(n).padStart(2, '0');
export const fmtWhen = (iso: string) => formatDate(iso, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** « 18/10/2026 » + « 14h30 » → ISO (heure locale). `null` si vide, `undefined` si invalide. */
export function parseFrDateTime(date: string, time: string): string | null | undefined {
  if (!date.trim() && !time.trim()) return null;
  const iso = frToISO(date.trim());
  if (!iso) return undefined;
  const m = (time.trim() || '9h').match(/^(\d{1,2})\s*[h:.]?\s*(\d{2})?$/);
  if (!m || Number(m[1]) > 23 || Number(m[2] ?? 0) > 59) return undefined;
  const [y, mo, d] = iso.split('-').map(Number);
  return new Date(y, mo - 1, d, Number(m[1]), Number(m[2] ?? 0)).toISOString();
}
export function splitLocal(iso: string | null) {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  return { date: toFrDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`), time: `${pad(d.getHours())}h${pad(d.getMinutes())}` };
}

// ------------------------------------------------------------------ ligne de tâche
export function TaskRow({ task, onEdit, onPropose }: { task: FamilyTask; onEdit: (t: FamilyTask) => void; onPropose?: (t: FamilyTask) => void }) {
  const t = useTheme();
  const toast = useToast();
  const save = useSaveTask();
  const reduce = useReduceMotion();
  const { labelOf } = usePeople();
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const done = optimistic ?? task.status === 'done';
  const press = usePressMotion({ pressed: 0.9 });
  const strike = useRef(new Animated.Value(done ? 1 : 0)).current;   // trait qui raye le titre
  const fill = useRef(new Animated.Value(done ? 1 : 0)).current;     // remplissage de la case
  const leave = useRef(new Animated.Value(1)).current;               // sortie de la liste
  const [tw, setTw] = useState(0);
  const cat = categoryOf(task.category);
  const late = !done && task.due_at && Date.parse(task.due_at) < Date.now() - 3600000;
  useEffect(() => { setOptimistic(null); strike.setValue(task.status === 'done' ? 1 : 0); fill.setValue(task.status === 'done' ? 1 : 0); leave.setValue(1); }, [task.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggle() {
    const next = !done;
    haptic(next ? 'success' : 'light');
    setOptimistic(next);
    // La coche se remplit, le titre est rayé, puis la ligne s'efface : l'enregistrement part ensuite
    await new Promise<void>((resolve) => {
      if (reduce) { fill.setValue(next ? 1 : 0); strike.setValue(next ? 1 : 0); resolve(); return; }
      Animated.sequence([
        Animated.spring(fill, { toValue: next ? 1 : 0, tension: 300, friction: 16, useNativeDriver: false }),
        Animated.timing(strike, { toValue: next ? 1 : 0, duration: 260, easing: easing.decelerate, useNativeDriver: false }),
        ...(next ? [Animated.delay(160), Animated.timing(leave, { toValue: 0, duration: 220, easing: easing.accelerate, useNativeDriver: false })] : []),
      ]).start(() => resolve());
    });
    try {
      await save.mutateAsync({ id: task.id, input: { status: next ? 'done' : 'todo' } });
      if (next) toast(task.recurrence ? tr('u6.fl.done_next') : tr('u6.fl.done'));
    } catch (e) {
      setOptimistic(null); fill.setValue(done ? 1 : 0); strike.setValue(done ? 1 : 0); leave.setValue(1);
      toast(friendlyError(e), 'error');
    }
  }

  return (
    <Animated.View style={{ opacity: leave, transform: [{ translateX: leave.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }, { scale: leave.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] }}>
      <Card style={{ paddingVertical: spacing.xs }}>
        <Row style={{ alignItems: 'center' }}>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={`${task.title} : ${done ? tr('u6.fl.state_done') : tr('u6.fl.state_todo')}`} onPress={toggle} {...press.handlers} hitSlop={8}>
            <Animated.View style={[{ width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderColor: done ? t.colors.success : t.colors.border }, press.style]}>
              <Animated.View style={{ position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: t.colors.success, transform: [{ scale: fill }] }} />
              {done ? <DrawCheck size={22} color={t.colors.surface} play={optimistic === true} /> : null}
            </Animated.View>
          </Pressable>
          <Tappable style={{ flex: 1, minHeight: MIN_TOUCH, justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel={tr('u6.fl.edit_task_a11y', { title: task.title })} onPress={() => onEdit(task)}>
            <View style={{ alignSelf: 'flex-start' }} onLayout={(e) => setTw(e.nativeEvent.layout.width)}>
              <Animated.Text style={{ opacity: strike.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] }) }}>
                <Text weight="medium">{task.title}</Text>
              </Animated.Text>
              <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: '50%', height: 2, width: tw, backgroundColor: t.colors.textMuted, borderRadius: 1,
                transform: [{ translateX: strike.interpolate({ inputRange: [0, 1], outputRange: [-tw / 2, 0] }) }, { scaleX: strike.interpolate({ inputRange: [0, 1], outputRange: [0.001, 1] }) }] }} />
            </View>
            <Text variant="caption" muted>
              {[cat.label, task.due_at ? fmtWhen(task.due_at) : null, labelOf(task.assignee_id), task.recurrence ? tr('u6.fl.recurring') : null, task.essential ? tr('u6.fl.essential_tag') : null].filter(Boolean).join(' · ')}
            </Text>
            {late ? <Text variant="caption" color={t.colors.gold}>{tr('u6.fl.late')}</Text> : null}
          </Tappable>
          {onPropose && !done ? <Button label={tr('u6.fl.propose')} size="sm" variant="ghost" onPress={() => onPropose(task)} accessibilityLabel={tr('u6.fl.propose_a11y', { title: task.title })} /> : null}
        </Row>
      </Card>
    </Animated.View>
  );
}

// ------------------------------------------------------------------ éditeur de tâche
type Draft = { id?: string; title: string; category: FamilyTask['category']; date: string; time: string; assignee: string | null; priority: FamilyTask['priority']; essential: boolean; recurrence: 'none' | 'daily' | 'weekly' | 'monthly'; notes: string };

export function TaskSheet({ task, open, onClose, defaults }: { task: FamilyTask | null; open: boolean; onClose: () => void; defaults?: Partial<Draft> }) {
  const toast = useToast();
  const save = useSaveTask();
  const del = useDeleteTask();
  const { people } = usePeople();
  const [d, setD] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (task) {
      const w = splitLocal(task.due_at);
      setD({ id: task.id, title: task.title, category: task.category, date: w.date, time: w.time, assignee: task.assignee_id, priority: task.priority, essential: task.essential, recurrence: task.recurrence?.type ?? 'none', notes: task.notes ?? '' });
    } else setD({ title: '', category: 'other', date: '', time: '', assignee: null, priority: 'normal', essential: false, recurrence: 'none', notes: '', ...defaults });
  }, [open, task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    if (!d) return;
    const e: Record<string, string> = {};
    if (!d.title.trim()) e.title = tr('u6.fl.err_title');
    const due = parseFrDateTime(d.date, d.time);
    if (due === undefined) e.date = tr('u6.fl.err_date');
    if (d.recurrence !== 'none' && !due) e.date = tr('u6.fl.err_recurring');
    setErrors(e);
    if (Object.keys(e).length) return;
    const input: Partial<TaskInput> = {
      title: d.title.trim().slice(0, 120), category: d.category, due_at: due ?? null, assignee_id: d.assignee, priority: d.priority, essential: d.essential,
      recurrence: d.recurrence === 'none' ? null : { type: d.recurrence }, notes: d.notes.trim() || null,
    };
    try {
      await save.mutateAsync({ id: d.id, input });
      haptic('success');
      toast(d.id ? tr('u6.fl.task_edited') : tr('u6.fl.task_added'));
      onClose();
    } catch (err) { toast(friendlyError(err), 'error'); }
  }

  async function remove() {
    if (!d?.id || !(await confirm(tr('u6.fl.delete_q'), tr('u6.fl.delete_body'), tr('u6.bhist.delete')))) return;
    try { await del.mutateAsync(d.id); toast(tr('u6.fl.task_deleted')); onClose(); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Sheet visible={open} onClose={onClose} title={task ? tr('u6.fl.edit_task') : tr('u6.fl.new_task')}>
      {d ? (
        <View style={{ gap: spacing.sm }}>
          <Field label={tr('u6.fl.title')} value={d.title} onChangeText={(v) => setD({ ...d, title: v })} error={errors.title} maxLength={120} placeholder={tr('u6.fl.title_ph')} />
          <Text variant="label">{tr('u6.fl.category')}</Text>
          <Row wrap>{CATEGORIES.map((c) => <Chip key={c.value} label={c.label} icon={c.icon} selected={d.category === c.value} onPress={() => setD({ ...d, category: c.value })} />)}</Row>
          <Row>
            <View style={{ flex: 3 }}><Field label={tr('u6.fl.date')} optional value={d.date} onChangeText={(v) => setD({ ...d, date: v })} error={errors.date} placeholder={tr('u6.fl.date_ph')} keyboardType="numbers-and-punctuation" /></View>
            <View style={{ flex: 2 }}><Field label={tr('u6.fl.time')} optional value={d.time} onChangeText={(v) => setD({ ...d, time: v })} placeholder="14h30" keyboardType="numbers-and-punctuation" /></View>
          </Row>
          <Text variant="label">{tr('u6.fl.who')}</Text>
          <Row wrap>
            <Chip label={tr('u6.fl.nobody')} selected={!d.assignee} onPress={() => setD({ ...d, assignee: null })} />
            {people.map((p) => <Chip key={p.id} label={p.label} selected={d.assignee === p.id} onPress={() => setD({ ...d, assignee: p.id })} />)}
          </Row>
          <Text variant="label">{tr('u6.fl.priority')}</Text>
          <Segmented label={tr('u6.fl.priority')} value={d.priority} onChange={(v) => setD({ ...d, priority: v })} options={[{ value: 'low', label: tr('u6.fl.p_low') }, { value: 'normal', label: tr('u6.fl.p_normal') }, { value: 'high', label: tr('u6.fl.p_high') }]} />
          <Text variant="label">{tr('u6.fl.frequency')}</Text>
          <Segmented label={tr('u6.fl.frequency')} value={d.recurrence} onChange={(v) => setD({ ...d, recurrence: v })} options={[{ value: 'none', label: tr('u6.fl.once') }, { value: 'daily', label: tr('u6.fl.daily') }, { value: 'weekly', label: tr('u6.fl.weekly') }, { value: 'monthly', label: tr('u6.fl.monthly') }]} />
          <Row style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text weight="medium">{tr('u6.fl.essential')}</Text>
              <Text variant="caption" muted>{tr('u6.fl.essential_sub')}</Text>
            </View>
            <Toggle label={tr('u6.fl.essential_task')} value={d.essential} onChange={(v) => setD({ ...d, essential: v })} />
          </Row>
          <Field label={tr('u6.fl.notes')} optional multiline value={d.notes} onChangeText={(v) => setD({ ...d, notes: v })} maxLength={1000} />
          <Button label={d.id ? tr('u6.fl.save') : tr('u6.fl.add')} full onPress={submit} loading={save.isPending} />
          {d.id ? <Button label={tr('u6.fl.delete_task')} variant="ghost" onPress={remove} /> : null}
        </View>
      ) : null}
    </Sheet>
  );
}

// ------------------------------------------------------------------ actions rapides
export function QuickActionsGrid({ onPick }: { onPick: (kind: RequestKind) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
      {QUICK_ACTIONS.map((a) => <QuickTile key={a.kind} label={a.label} icon={a.icon} onPress={() => onPick(a.kind)} color={t.colors.primary} />)}
    </View>
  );
}

function QuickTile({ label, icon, onPress, color }: { label: string; icon: React.ComponentProps<typeof Icon>['name']; onPress: () => void; color: string }) {
  const t = useTheme();
  const press = usePressMotion();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => { haptic('selection'); onPress(); }} {...press.handlers} style={{ width: '48.5%' }}>
      <Animated.View style={[{ minHeight: 64, padding: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surface, gap: 4 }, press.style]}>
        <Icon name={icon} size={18} color={color} />
        <Text variant="small" weight="bold">{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

/** Envoi d'une demande : message facultatif, destinataire facultatif. Rien ne part sans « Envoyer ». */
export function RequestSheet({ kind, onClose, taskId, shiftId }: { kind: RequestKind | null; onClose: () => void; taskId?: string | null; shiftId?: string | null }) {
  const toast = useToast();
  const create = useCreateRequest();
  const { people, me } = usePeople();
  const [msg, setMsg] = useState('');
  const [to, setTo] = useState<string | null>(null);
  useEffect(() => { setMsg(''); setTo(null); }, [kind]);
  const others = people.filter((p) => p.id !== me);
  const action = QUICK_ACTIONS.find((a) => a.kind === kind);

  async function send() {
    if (!kind) return;
    try {
      await create.mutateAsync({ kind, message: msg.trim() || null, to_user: to, task_id: taskId ?? null, shift_id: shiftId ?? null });
      haptic('success');
      toast(others.length ? tr('u6.fl.sent') : tr('u6.fl.noted'));
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Sheet visible={!!kind} onClose={onClose} title={action?.label ?? ''}>
      {kind ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="small" muted>{action?.detail}</Text>
          {others.length > 1 ? (
            <>
              <Text variant="label">{tr('u6.fl.to_whom')}</Text>
              <Row wrap>
                <Chip label={tr('u6.fl.whole_household')} selected={!to} onPress={() => setTo(null)} />
                {others.map((p) => <Chip key={p.id} label={p.label} selected={to === p.id} onPress={() => setTo(p.id)} />)}
              </Row>
            </>
          ) : null}
          {others.length === 0 ? <Text variant="small">{tr('u6.fl.alone')}</Text> : null}
          <Field label={tr('u6.fl.a_word')} optional value={msg} onChangeText={setMsg} maxLength={300} placeholder={kind === 'rest' ? tr('u6.fl.ph_rest') : kind === 'relay' ? tr('u6.fl.ph_relay') : ''} />
          <Text variant="caption" muted>{tr('u6.fl.lock_note')}</Text>
          <Button label={tr('u6.fl.send')} icon="send" full onPress={send} loading={create.isPending} />
        </View>
      ) : null}
    </Sheet>
  );
}

// ------------------------------------------------------------------ carte de demande
export function RequestCard({ r, tasks }: { r: CareRequest; tasks: FamilyTask[] }) {
  const t = useTheme();
  const toast = useToast();
  const respond = useRespondRequest();
  const { me, labelOf } = usePeople();
  const mine = r.from_user === me;
  const forMe = !mine && (!r.to_user || r.to_user === me);
  const task = r.task_id ? tasks.find((x) => x.id === r.task_id) : null;
  const status = { open: tr('u6.fl.s_open'), accepted: tr('u6.fl.s_accepted'), declined: tr('u6.fl.s_declined'), cancelled: tr('u6.fl.s_cancelled'), done: tr('u6.fl.s_done') }[r.status];

  async function act(s: CareRequest['status'], msg: string) {
    try { await respond.mutateAsync({ id: r.id, status: s }); haptic('success'); toast(msg); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Card tone={r.status === 'open' && forMe ? 'soft' : 'surface'}>
      <Row style={{ alignItems: 'flex-start' }}>
        <Icon name={QUICK_ACTIONS.find((a) => a.kind === r.kind)?.icon ?? 'message-circle'} color={t.colors.primary} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight="bold">{REQUEST_LABEL[r.kind]}</Text>
          <Text variant="caption" muted>{mine ? tr('u6.fl.you') : labelOf(r.from_user)} · {formatDate(r.created_at, { weekday: 'short', hour: '2-digit', minute: '2-digit' })} · {status}{r.responded_by && r.status !== 'open' ? ` ${tr('u6.fl.by', { who: labelOf(r.responded_by) })}` : ''}</Text>
          {task ? <Text variant="small">{tr('u6.fl.task', { title: task.title })}</Text> : null}
          {r.message ? <Text variant="small">{tr('u6.bhist.note', { note: r.message })}</Text> : null}
        </View>
      </Row>
      {r.status === 'open' ? (
        <Row style={{ marginTop: spacing.xs }} wrap>
          {forMe ? (
            <>
              <Button label={r.kind === 'taking_over' || r.kind === 'available' ? tr('u6.fl.thanks') : tr('u6.fl.accept')} size="sm" icon="check" onPress={() => act('accepted', tr('u6.fl.answer_sent'))} loading={respond.isPending} />
              {r.kind !== 'taking_over' && r.kind !== 'available' ? <Button label={tr('u6.fl.decline')} size="sm" variant="ghost" onPress={() => act('declined', tr('u6.fl.answer_sent'))} /> : null}
            </>
          ) : null}
          {mine ? <Button label={tr('u6.fl.cancel_request')} size="sm" variant="ghost" onPress={() => act('cancelled', tr('u6.fl.request_cancelled'))} /> : null}
        </Row>
      ) : null}
    </Card>
  );
}

// ------------------------------------------------------------------ infos indispensables de l'enfant
export function ChildEssentials({ large }: { large?: boolean }) {
  const { data: children } = useChildren();
  if (!children?.length) return null;
  return <View style={{ gap: spacing.xs }}>{children.map((c) => <ChildEssentialCard key={c.id} child={c} large={large} />)}</View>;
}

function ChildEssentialCard({ child, large }: { child: Child; large?: boolean }) {
  const t = useTheme();
  const { data: items } = useHealthItems(child.id);
  const allergies = [...new Set([...(child.allergies_declared ?? []), ...(items ?? []).filter((i) => i.kind === 'allergy').map((i) => i.label)])];
  const treatments = (items ?? []).filter((i) => i.kind === 'treatment' && !i.done_on);
  const contacts = (items ?? []).filter((i) => i.kind === 'contact');
  const v = large ? 'body' : 'small';
  return (
    <Card>
      <Text weight="bold" style={large ? { fontSize: 20 } : undefined}>{child.first_name} · {childAge(child.birth_date).label}</Text>
      <Text variant={v} color={allergies.length ? t.colors.danger : undefined}>{tr('u6.fl.allergies', { list: allergies.length ? allergies.join(', ') : tr('u6.fl.none_noted') })}</Text>
      {treatments.length ? <Text variant={v}>{tr('u6.fl.treatments', { list: treatments.map((x) => `${x.label}${x.details ? ` (${x.details})` : ''}`).join(' ; ') })}</Text> : null}
      {contacts.length ? <Text variant={v}>{tr('u6.fl.contacts', { list: contacts.map((x) => `${x.label}${x.details ? ` ${x.details}` : ''}`).join(' ; ') })}</Text> : null}
      <Text variant="caption" muted>{tr('u6.fl.essentials_note')}</Text>
    </Card>
  );
}

// ------------------------------------------------------------------ carte d'accueil
/** Accueil : demandes qui m'attendent, mes tâches du jour, et l'accès immédiat à « Journée difficile ». */
export function FamilyHomeCard() {
  const t = useTheme();
  const { me, labelOf } = usePeople();
  const { data: requests } = useCareRequests();
  const { data: tasks } = useFamilyTasks();
  const day = todayISO();
  const waiting = (requests ?? []).filter((r) => r.status === 'open' && r.from_user !== me && (!r.to_user || r.to_user === me));
  const mineToday = (tasks ?? []).filter((x) => x.status === 'todo' && x.assignee_id === me && x.due_at && sameLocalDay(x.due_at, day));
  const { data: shifts } = useCareShifts('night');
  const nextNight = (shifts ?? []).filter((s) => s.status !== 'cancelled' && Date.parse(s.ends_at) > Date.now()).sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1))[0];
  return (
    <View style={{ gap: spacing.xs }}>
      {waiting.length || mineToday.length ? (
        <Card onPress={() => router.push('/family')} accessibilityLabel={tr('u6.fl.open_family')}>
          <Row>
            <Icon name={waiting.length ? 'bell' : 'check-square'} color={t.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text weight="bold">{waiting.length ? tr('u6.fl.waiting', { count: waiting.length }) : tr('u6.fl.today_tasks', { count: mineToday.length })}</Text>
              <Text variant="small" muted>{waiting.length ? REQUEST_LABEL[waiting[0].kind] : mineToday.map((x) => x.title).join(' · ')}</Text>
            </View>
            <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
          </Row>
        </Card>
      ) : null}
      {nextNight ? (
        <Card onPress={() => router.push('/family/nights')} accessibilityLabel={tr('u6.fl.next_night_a11y')}>
          <Row>
            <Icon name="moon" color={t.colors.lavender} />
            <Text style={{ flex: 1 }}><Text weight="bold">{tr('u6.fl.next_relay')} </Text>{labelOf(nextNight.user_id)} · {formatDate(nextNight.starts_at, { weekday: 'long' })} {formatTime(nextNight.starts_at)}</Text>
            <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
          </Row>
        </Card>
      ) : null}
      <Tappable accessibilityRole="button" accessibilityLabel={tr('u6.fl.hard_day_a11y')} onPress={() => router.push('/family/difficult')} style={({ pressed }) => ({ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: MIN_TOUCH, paddingHorizontal: spacing.sm, borderRadius: 12, borderWidth: 1, borderColor: t.colors.border, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface })}>
        <Icon name="wind" size={16} color={t.colors.primary} />
        <Text variant="small" weight="bold">{tr('u6.fl.hard_day')}</Text>
      </Tappable>
    </View>
  );
}
