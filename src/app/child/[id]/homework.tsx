/**
 * 137 — Suivi des devoirs (depuis « École ») : devoirs par enfant (matière, consigne, échéance, fait), vue de la
 * semaine, ce qui reste à faire, rappel la veille à 18 h (rappel du téléphone). Aucune note, aucun classement, aucun
 * message culpabilisant. Parents de l'enfant seulement (RLS) ; hors ligne : saisie gardée puis envoyée.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ErrorView, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { Banner, Button, Card, Chip, Field, haptic, Icon, IconButton, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteHomework, useHomework, useHomeworkReminder, useSaveHomework } from '@/lib/data/hooks-partiels2';
import { addDays, frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { knownSubjects, mondayOf, overdue, weekView, type Homework } from '@/features/homework/domain';
import { ChildToolGate, useParentChild } from '@/features/childTools/ChildToolGate';
import type { Child } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { CheckMark } from '@/motion/CheckMark';
import { MotionItem, MotionList } from '@/motion/ListMotion';

export default function HomeworkScreen() {
  const state = useParentChild();
  const gate = ChildToolGate({ title: tr('p2.hw.title'), state });
  if (gate) return gate;
  return <HomeworkBody child={state.child!} />;
}

const dayLabel = (d: string) => formatDate(`${d}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'short' }).replace(/^./, (c) => c.toUpperCase());

function HomeworkBody({ child }: { child: Child }) {
  const theme = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ h?: string }>();
  const q = useHomework(child.id);
  const save = useSaveHomework();
  const reminder = useHomeworkReminder();
  const today = todayISO();
  const [week, setWeek] = useState(mondayOf(today));
  const [open, setOpen] = useState<{ h: Homework | null } | null>(null);
  const list = useMemo(() => q.data ?? [], [q.data]);
  const days = useMemo(() => weekView(list, week), [list, week]);
  const late = useMemo(() => overdue(list, today), [list, today]);
  useEffect(() => {
    const h = params.h ? list.find((x) => x.id === params.h) : undefined;
    if (h && !h._pending) { setWeek(mondayOf(h.due_on)); setOpen({ h }); }
  }, [params.h, list.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (q.isLoading && !q.data) return <Screen back title={tr('p2.hw.title')}><Skeleton rows={4} /></Screen>;
  if (q.isError && !q.data) return <Screen back title={tr('p2.hw.title')}><ErrorView error={q.error} onRetry={() => void q.refetch()} /></Screen>;

  async function toggle(h: Homework) {
    const done_at = h.done_at ? null : new Date().toISOString();
    try {
      const { done_by: _d, _pending: _p, ...rest } = h; // eslint-disable-line @typescript-eslint/no-unused-vars
      const r = await save.mutateAsync({ ...rest, done_at });
      await reminder.mutateAsync({ hw: { ...h, done_at }, childName: child.first_name }).catch(() => undefined);
      haptic(done_at ? 'success' : 'selection');
      if (r.queued) toast(tr('p2.savedOffline'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  const weekEnd = addDays(week, 6);
  const pending = days.reduce((n, d) => n + d.items.filter((h) => !h.done_at).length, 0);
  return (
    <Screen back title={tr('p2.hw.title')} subtitle={tr('p2.hw.sub', { name: child.first_name })}
      action={{ label: tr('p2.hw.add'), icon: 'plus', onPress: () => setOpen({ h: null }), testID: 'hw-add' }}>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon="chevron-left" label={tr('p2.hw.prevWeek')} onPress={() => setWeek(addDays(week, -7))} testID="hw-prev" />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text weight="bold" testID="hw-week">{tr('p2.hw.week', { from: formatDate(`${week}T12:00:00`, { day: 'numeric', month: 'short' }), to: formatDate(`${weekEnd}T12:00:00`, { day: 'numeric', month: 'short' }) })}</Text>
          <Text variant="caption" muted>{pending ? tr('p2.hw.left', { count: pending }) : tr('p2.hw.allDone')}</Text>
        </View>
        <IconButton icon="chevron-right" label={tr('p2.hw.nextWeek')} onPress={() => setWeek(addDays(week, 7))} testID="hw-next" />
      </Row>
      {week !== mondayOf(today) ? <Button label={tr('p2.hw.thisWeek')} size="sm" variant="ghost" onPress={() => setWeek(mondayOf(today))} /> : null}
      {late.length ? (
        <>
          <SectionTitle title={tr('p2.hw.late')} subtitle={tr('p2.hw.lateSub')} />
          <MotionList style={{ gap: 6 }} testID="hw-late">{late.map((h) => <MotionItem key={h.id}><HwRow key={h.id} h={h} onToggle={() => void toggle(h)} onOpen={() => setOpen({ h })} showDate /></MotionItem>)}</MotionList>
        </>
      ) : null}
      {/* une seule carte pour la semaine : les jours sans devoir tiennent sur une ligne */}
      <Card testID="hw-days">
        {days.map((d, i) => (
          <View key={d.date} testID={`hw-day-${d.date}`} style={{ paddingVertical: d.items.length ? 8 : 5, borderTopWidth: i ? 1 : 0, borderTopColor: theme.colors.border }}>
            {d.items.length ? (
              <>
                <Text weight="bold" color={d.date === today ? theme.colors.primary : undefined}>{dayLabel(d.date)}{d.date === today ? ` · ${tr('u1.appt.today')}` : ''}</Text>
                <MotionList style={{ gap: 2, marginTop: 4 }}>{d.items.map((h) => <MotionItem key={h.id}><HwRow key={h.id} h={h} onToggle={() => void toggle(h)} onOpen={() => setOpen({ h })} /></MotionItem>)}</MotionList>
              </>
            ) : (
              <Row style={{ alignItems: 'baseline' }}>
                <Text variant="small" weight="medium" color={d.date === today ? theme.colors.primary : undefined} style={{ flex: 1 }}>{dayLabel(d.date)}{d.date === today ? ` · ${tr('u1.appt.today')}` : ''}</Text>
                <Text variant="caption" muted>{tr('p2.hw.nothing')}</Text>
              </Row>
            )}
          </View>
        ))}
      </Card>
      <Text variant="caption" muted>{tr('p2.hw.eveNote')}</Text>
      <HomeworkSheet open={open} child={child} known={knownSubjects(list)} onClose={() => setOpen(null)} />
    </Screen>
  );
}

function HwRow({ h, onToggle, onOpen, showDate }: { h: Homework; onToggle: () => void; onOpen: () => void; showDate?: boolean }) {
  const t = useTheme();
  const done = !!h.done_at;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 }}>
      <Tappable bare accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={`${h.subject} : ${h.instructions}`} onPress={onToggle} hitSlop={8} testID={`hw-check-${h.id}`}
        style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: done ? 0 : 2, borderColor: t.colors.primary, backgroundColor: done ? t.tokens.action.fill : 'transparent' }}>
        <CheckMark checked={!!done} size={17} color={t.tokens.action.text} />
      </Tappable>
      <Tappable bare accessibilityRole="button" onPress={h._pending ? () => undefined : onOpen} style={{ flex: 1 }} testID={`hw-row-${h.id}`}>
        <Text weight="medium" style={{ textDecorationLine: done ? 'line-through' : 'none', opacity: done ? 0.65 : 1 }}>{h.subject}</Text>
        <Text variant="caption" muted numberOfLines={2}>{[h.instructions, showDate ? dayLabel(h.due_on) : null, h._pending ? tr('fx.pending') : null].filter(Boolean).join(' · ')}</Text>
      </Tappable>
      {h.remind_eve && !done ? <Icon name="bell" size={14} color={t.colors.textMuted} /> : null}
    </View>
  );
}

function HomeworkSheet({ open, child, known, onClose }: { open: { h: Homework | null } | null; child: Child; known: string[]; onClose: () => void }) {
  const toast = useToast();
  const save = useSaveHomework();
  const del = useDeleteHomework();
  const reminder = useHomeworkReminder();
  const h = open?.h ?? null;
  const [subject, setSubject] = useState('');
  const [instructions, setInstructions] = useState('');
  const [due, setDue] = useState('');
  const [eve, setEve] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setSubject(h?.subject ?? ''); setInstructions(h?.instructions ?? ''); setDue(toFrDate(h?.due_on ?? addDays(todayISO(), 1))); setEve(h ? h.remind_eve : true); setErr(null);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  async function submit() {
    if (!subject.trim()) return setErr(tr('p2.hw.errSubject'));
    if (!instructions.trim()) return setErr(tr('p2.hw.errInstructions'));
    const d = frToISO(due);
    if (!d) return setErr(tr('p2.hw.errDate'));
    setErr(null);
    const row = { household_id: child.household_id, child_id: child.id, subject: subject.trim().slice(0, 60), instructions: instructions.trim().slice(0, 500), due_on: d, done_at: h?.done_at ?? null, remind_eve: eve };
    try {
      const r = await save.mutateAsync({ id: h?.id, ...row });
      await reminder.mutateAsync({ hw: { id: r.id, ...row }, childName: child.first_name }).catch(() => undefined);
      toast(tr(r.queued ? 'p2.savedOffline' : 'p2.hw.saved'), 'success');
      onClose();
    } catch (e) { setErr(friendlyError(e)); }
  }
  async function remove() {
    if (!h || !(await confirm(tr('common.delete'), tr('p2.hw.deleteQ'), tr('common.delete')))) return;
    try {
      await reminder.mutateAsync({ hw: h, childName: child.first_name, remove: true }).catch(() => undefined);
      await del.mutateAsync(h.id); onClose();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <GlassSheet visible={!!open} onClose={onClose} title={h ? tr('p2.hw.edit') : tr('p2.hw.new', { name: child.first_name })}>
      <Field label={tr('p2.hw.fSubject')} value={subject} onChangeText={setSubject} maxLength={60} placeholder={tr('p2.hw.fSubjectPh')} testID="hw-f-subject" />
      {known.length ? <Row wrap>{known.map((s) => <Chip key={s} label={s} selected={subject === s} onPress={() => setSubject(s)} />)}</Row> : null}
      <Field label={tr('p2.hw.fInstructions')} value={instructions} onChangeText={setInstructions} maxLength={500} multiline placeholder={tr('p2.hw.fInstructionsPh')} testID="hw-f-instructions" />
      <Field label={tr('p2.hw.fDue')} value={due} onChangeText={setDue} placeholder={tr('u1.appt.datePh')} keyboardType="numbers-and-punctuation" testID="hw-f-due" />
      <Row wrap>
        <Chip label={tr('u1.appt.tomorrow')} onPress={() => setDue(toFrDate(addDays(todayISO(), 1)))} testID="hw-f-tomorrow" />
        <Chip label={tr('p2.hw.inTwoDays')} onPress={() => setDue(toFrDate(addDays(todayISO(), 2)))} />
        <Chip label={tr('p2.hw.nextMonday')} onPress={() => setDue(toFrDate(addDays(mondayOf(todayISO()), 7)))} />
      </Row>
      <Row style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text weight="medium">{tr('p2.hw.fEve')}</Text>
          <Text variant="caption" muted>{tr('p2.hw.fEveD')}</Text>
        </View>
        <Toggle label={tr('p2.hw.fEve')} value={eve} onChange={setEve} />
      </Row>
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="hw-f-save" />
      {h ? <Button label={tr('common.delete')} icon="trash-2" variant="ghost" onPress={() => void remove()} testID="hw-f-delete" /> : null}
    </GlassSheet>
  );
}
