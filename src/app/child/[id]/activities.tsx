/**
 * 136 — Activités extrascolaires (depuis « École ») : une activité rattachée à l'enfant — nom, lieu, créneaux
 * hebdomadaires, période, matériel, contact, rappel. Ses séances s'affichent dans l'agenda familial (/calendar) et
 * dans la journée de l'accueil ; le rappel est un rappel hebdomadaire du téléphone. Parents de l'enfant seulement.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, Icon, IconButton, ListRow, Row, Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useActivityReminder, useChildActivities, useDeleteActivity, useSaveActivity } from '@/lib/data/hooks-partiels2';
import { frToISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { checkSlots, nextSession, parseClock, REMINDER_LEADS, validPhone, type ChildActivity, type ReminderLead, type Slot, type Weekday } from '@/features/activities/domain';
import { ChildToolGate, useParentChild } from '@/features/childTools/ChildToolGate';
import { dayShort, slotsText } from '@/features/activities/format';
import type { Child } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { MotionItem, MotionList } from '@/motion/ListMotion';

const DAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

export default function Activities() {
  const state = useParentChild();
  const gate = ChildToolGate({ title: tr('p2.act.title'), state });
  if (gate) return gate;
  return <ActivitiesBody child={state.child!} />;
}

function ActivitiesBody({ child }: { child: Child }) {
  const t = useTheme();
  const params = useLocalSearchParams<{ a?: string }>();
  const q = useChildActivities(child.id);
  const [open, setOpen] = useState<{ a: ChildActivity | null } | null>(null);
  const list = useMemo(() => q.data ?? [], [q.data]);
  useEffect(() => {
    const a = params.a ? list.find((x) => x.id === params.a) : undefined;
    if (a && !a._pending) setOpen({ a });
  }, [params.a, list.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (q.isLoading && !q.data) return <Screen back title={tr('p2.act.title')}><Skeleton rows={3} /></Screen>;
  if (q.isError && !q.data) return <Screen back title={tr('p2.act.title')}><ErrorView error={q.error} onRetry={() => void q.refetch()} /></Screen>;
  const now = new Date();
  return (
    <Screen back title={tr('p2.act.title')} subtitle={tr('p2.act.sub', { name: child.first_name })}
      action={{ label: tr('p2.act.add'), icon: 'plus', onPress: () => setOpen({ a: null }), testID: 'act-add' }}>
      {list.length ? <MotionList>{list.map((a) => {
        const next = nextSession(a, now);
        return (
          <MotionItem key={a.id}><Card key={a.id} onPress={a._pending ? undefined : () => setOpen({ a })} testID={`act-card-${a.id}`} accessibilityLabel={`${a.name}. ${slotsText(a.slots)}`}>
            <Row style={{ alignItems: 'flex-start' }}>
              <Icon name="award" color={t.colors.primary} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text weight="bold">{a.name}</Text>
                <Text variant="small">{slotsText(a.slots)}</Text>
                {a.place ? <Text variant="caption" muted>{a.place}</Text> : null}
                {next ? <Text variant="caption" muted testID={`act-next-${a.id}`}>{tr('p2.act.next', { when: formatDate(next.starts, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) })}</Text> : null}
                {a.equipment ? <Text variant="caption" muted>{tr('p2.act.bring', { what: a.equipment })}</Text> : null}
                {a._pending ? <Text variant="caption" muted>{tr('fx.pending')}</Text> : null}
              </View>
              {a.reminder_minutes ? <Icon name="bell" size={16} color={t.colors.textMuted} /> : null}
            </Row>
          </Card></MotionItem>
        );
      })}</MotionList> : <EmptyState icon="award" title={tr('p2.act.emptyT')} body={tr('p2.act.emptyB', { name: child.first_name })} action={{ label: tr('p2.act.add'), icon: 'plus', onPress: () => setOpen({ a: null }) }} />}
      <ListRow icon="calendar" title={tr('p2.act.agenda')} subtitle={tr('p2.act.agendaSub')} onPress={() => router.push('/calendar' as never)} testID="act-agenda" />
      <ActivitySheet open={open} child={child} onClose={() => setOpen(null)} />
    </Screen>
  );
}

type SlotDraft = { day: Weekday; from: string; to: string };

function ActivitySheet({ open, child, onClose }: { open: { a: ChildActivity | null } | null; child: Child; onClose: () => void }) {
  const toast = useToast();
  const save = useSaveActivity();
  const del = useDeleteActivity();
  const reminder = useActivityReminder();
  const a = open?.a ?? null;
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [slots, setSlots] = useState<SlotDraft[]>([]);
  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');
  const [equipment, setEquipment] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [lead, setLead] = useState<string>('0');
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setName(a?.name ?? ''); setPlace(a?.place ?? ''); setSlots(a ? a.slots.map((s) => ({ ...s })) : [{ day: 3, from: '', to: '' }]);
    setStartsOn(a?.starts_on ? toFrDate(a.starts_on) : ''); setEndsOn(a?.ends_on ? toFrDate(a.ends_on) : ''); setEquipment(a?.equipment ?? '');
    setContact(a?.contact_name ?? ''); setPhone(a?.contact_phone ?? ''); setNote(a?.note ?? ''); setLead(String(a?.reminder_minutes ?? 0)); setErr(null);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const setSlot = (i: number, patch: Partial<SlotDraft>) => setSlots((l) => l.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  async function submit() {
    if (!name.trim()) return setErr(tr('p2.act.errName'));
    const parsed: Slot[] = [];
    for (const s of slots) {
      const from = parseClock(s.from); const to = parseClock(s.to);
      if (!from || !to) return setErr(tr('p2.act.errTime'));
      parsed.push({ day: s.day, from, to });
    }
    const bad = checkSlots(parsed);
    if (bad) return setErr(tr(`p2.act.err.${bad}` as 'p2.act.err.none'));
    const s1 = startsOn.trim() ? frToISO(startsOn) : null;
    const s2 = endsOn.trim() ? frToISO(endsOn) : null;
    if ((startsOn.trim() && !s1) || (endsOn.trim() && !s2)) return setErr(tr('p2.act.errDate'));
    if (s1 && s2 && s2 < s1) return setErr(tr('p2.act.errPeriod'));
    if (phone.trim() && !validPhone(phone)) return setErr(tr('p2.act.errPhone'));
    setErr(null);
    const row = {
      household_id: child.household_id, child_id: child.id, name: name.trim().slice(0, 80), place: place.trim().slice(0, 160) || null, slots: parsed,
      starts_on: s1, ends_on: s2, equipment: equipment.trim().slice(0, 300) || null, contact_name: contact.trim().slice(0, 80) || null,
      contact_phone: phone.trim() || null, note: note.trim().slice(0, 500) || null, reminder_minutes: (Number(lead) || null) as ReminderLead | null,
    };
    try {
      const r = await save.mutateAsync({ id: a?.id, ...row });
      await reminder.mutateAsync({ activity: { id: r.id, ...row } }).catch(() => undefined);
      toast(tr(r.queued ? 'p2.savedOffline' : 'p2.act.saved'), 'success');
      onClose();
    } catch (e) { setErr(friendlyError(e)); }
  }
  async function remove() {
    if (!a || !(await confirm(tr('common.delete'), tr('p2.act.deleteQ', { name: a.name }), tr('common.delete')))) return;
    try {
      await reminder.mutateAsync({ activity: a, remove: true }).catch(() => undefined);
      await del.mutateAsync(a.id);
      toast(tr('p2.act.deleted'));
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <GlassSheet visible={!!open} onClose={onClose} title={a ? tr('p2.act.edit') : tr('p2.act.new', { name: child.first_name })}>
      <Field label={tr('p2.act.fName')} value={name} onChangeText={setName} maxLength={80} placeholder={tr('p2.act.fNamePh')} testID="act-f-name" />
      <Field label={tr('p2.act.fPlace')} optional value={place} onChangeText={setPlace} maxLength={160} testID="act-f-place" />
      <Text variant="label">{tr('p2.act.fSlots')}</Text>
      {slots.map((s, i) => (
        <View key={i} style={{ gap: 6 }} testID={`act-slot-${i}`}>
          <Row wrap>{DAYS.map((d) => <Chip key={d} label={dayShort(d)} selected={s.day === d} onPress={() => setSlot(i, { day: d })} testID={`act-slot-${i}-day-${d}`} />)}</Row>
          <Row style={{ alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}><Field label={tr('p2.act.fFrom')} value={s.from} onChangeText={(v) => setSlot(i, { from: v })} placeholder="14:00" keyboardType="numbers-and-punctuation" testID={`act-slot-${i}-from`} /></View>
            <View style={{ flex: 1 }}><Field label={tr('p2.act.fTo')} value={s.to} onChangeText={(v) => setSlot(i, { to: v })} placeholder="15:00" keyboardType="numbers-and-punctuation" testID={`act-slot-${i}-to`} /></View>
            {slots.length > 1 ? <IconButton icon="x" label={tr('p2.act.removeSlot')} onPress={() => setSlots((l) => l.filter((_, j) => j !== i))} /> : null}
          </Row>
        </View>
      ))}
      {slots.length < 7 ? <Button label={tr('p2.act.addSlot')} icon="plus" size="sm" variant="ghost" onPress={() => setSlots((l) => [...l, { day: 6, from: '', to: '' }])} testID="act-add-slot" /> : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Field label={tr('p2.act.fStart')} optional value={startsOn} onChangeText={setStartsOn} placeholder={tr('u1.appt.datePh')} keyboardType="numbers-and-punctuation" testID="act-f-start" /></View>
        <View style={{ flex: 1 }}><Field label={tr('p2.act.fEnd')} optional value={endsOn} onChangeText={setEndsOn} placeholder={tr('u1.appt.datePh')} keyboardType="numbers-and-punctuation" testID="act-f-end" /></View>
      </View>
      <Field label={tr('p2.act.fEquipment')} optional value={equipment} onChangeText={setEquipment} maxLength={300} placeholder={tr('p2.act.fEquipmentPh')} testID="act-f-equipment" />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Field label={tr('p2.act.fContact')} optional value={contact} onChangeText={setContact} maxLength={80} testID="act-f-contact" /></View>
        <View style={{ flex: 1 }}><Field label={tr('p2.act.fPhone')} optional value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={30} testID="act-f-phone" /></View>
      </View>
      <Field label={tr('p2.act.fNote')} optional value={note} onChangeText={setNote} maxLength={500} multiline testID="act-f-note" />
      <Text variant="label">{tr('p2.act.fReminder')}</Text>
      <Row wrap>
        <Chip label={tr('u1.appt.leadNone')} selected={lead === '0'} onPress={() => setLead('0')} testID="act-lead-0" />
        {REMINDER_LEADS.map((m) => <Chip key={m} label={tr('p2.act.before', { minutes: m })} icon="bell" selected={lead === String(m)} onPress={() => setLead(String(m))} testID={`act-lead-${m}`} />)}
      </Row>
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="act-f-save" />
      {a ? <Button label={tr('common.delete')} icon="trash-2" variant="ghost" onPress={() => void remove()} testID="act-f-delete" /> : null}
    </GlassSheet>
  );
}
