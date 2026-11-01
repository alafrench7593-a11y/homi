/**
 * Temps pour soi : chacun réserve ses propres créneaux de repos, planifie le relais, reporte ou échange.
 * Les propositions s'appuient sur les disponibilités réelles de l'agenda, sans imposer de planning.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { confirm, useToast } from '@/components/Overlays';
import { Button, Card, Field, ListRow, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { parseFrDateTime } from '@/features/familyLoad';
import { DayAvailability } from '@/features/motionViz';
import { useAppointments } from '@/lib/data/hooks';
import { useCareShifts, useCreateRequest, useDeleteShift, useFamilyTasks, usePeople, useSaveShifts, useUpdateShift } from '@/lib/data/hooks-family-load';
import { friendlyError } from '@/lib/data/hooks-settings';
import { addLocalDays, suggestFreeSlots, type CareShift } from '@/lib/domain/familyLoad';
import { todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { spacing } from '@/theme/tokens';
import { t as tr, formatDate, formatTime } from '@/i18n';

const hm = (iso: string) => formatTime(iso);
const fmt = (s: { starts_at: string; ends_at: string }) => `${formatDate(s.starts_at, { weekday: 'long', day: 'numeric', month: 'long' })} · ${hm(s.starts_at)} – ${hm(s.ends_at)}`;

export default function MeTime() {
  const toast = useToast();
  const { me, labelOf } = usePeople();
  const shiftsQ = useCareShifts();
  const { data: appointments } = useAppointments({ upcomingOnly: true });
  const { data: tasks } = useFamilyTasks();
  const save = useSaveShifts();
  const update = useUpdateShift();
  const del = useDeleteShift();
  const ask = useCreateRequest();
  const [which, setWhich] = useState<'today' | 'tomorrow'>('today');
  const [date, setDate] = useState(toFrDate(todayISO()));
  const [from, setFrom] = useState('14h');
  const [to, setTo] = useState('15h30');
  const [note, setNote] = useState('');

  const shifts = shiftsQ.data ?? [];
  const mine = shifts.filter((s) => s.kind === 'me_time' && s.user_id === me && s.status !== 'cancelled' && Date.parse(s.ends_at) > Date.now());
  const others = shifts.filter((s) => s.kind === 'me_time' && s.user_id !== me && s.status !== 'cancelled' && Date.parse(s.ends_at) > Date.now());
  const day = which === 'today' ? todayISO() : addLocalDays(todayISO(), 1);
  const busyList = useMemo(() => [
    ...(appointments ?? []).map((a) => ({ starts_at: a.starts_at, ends_at: new Date(Date.parse(a.starts_at) + 3600000).toISOString() })),
    ...shifts.filter((s) => s.status !== 'cancelled' && s.user_id === me && s.kind === 'night').map((s) => ({ starts_at: s.starts_at, ends_at: s.ends_at })),
    ...(tasks ?? []).filter((t) => t.status === 'todo' && t.assignee_id === me && t.due_at).map((t) => ({ starts_at: t.due_at!, ends_at: new Date(Date.parse(t.due_at!) + 1800000).toISOString() })),
  ], [appointments, shifts, tasks, me]);
  const slots = useMemo(() => {
    const busy = [
      ...(appointments ?? []).map((a) => ({ starts_at: a.starts_at, ends_at: new Date(Date.parse(a.starts_at) + 3600000).toISOString() })),
      ...shifts.filter((s) => s.status !== 'cancelled' && (s.user_id === me || s.kind === 'me_time')).map((s) => ({ starts_at: s.starts_at, ends_at: s.ends_at })),
      ...(tasks ?? []).filter((t) => t.status === 'todo' && t.assignee_id === me && t.due_at).map((t) => ({ starts_at: t.due_at!, ends_at: new Date(Date.parse(t.due_at!) + 1800000).toISOString() })),
    ];
    return suggestFreeSlots({ day, busy, now: new Date() });
  }, [appointments, shifts, tasks, me, day]);

  async function reserve(slot: { starts_at: string; ends_at: string }, withRelay: boolean) {
    try {
      await save.mutateAsync([{ kind: 'me_time', user_id: me, starts_at: slot.starts_at, ends_at: slot.ends_at, note: note.trim() || null }]);
      if (withRelay) await ask.mutateAsync({ kind: 'relay', message: tr('u2.metime.msg_book', { range: `${hm(slot.starts_at)} – ${hm(slot.ends_at)}` }), starts_at: slot.starts_at, ends_at: slot.ends_at });
      setNote('');
      toast(withRelay ? tr('u2.metime.reserved_relay') : tr('u2.metime.reserved'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function reserveManual(withRelay: boolean) {
    const a = parseFrDateTime(date, from);
    const b = parseFrDateTime(date, to);
    if (!a || !b || b <= a) return toast(tr('u2.metime.check_dates'), 'error');
    if (Date.parse(b) <= Date.now()) return toast(tr('u2.metime.past'), 'error');
    await reserve({ starts_at: a, ends_at: b }, withRelay);
  }

  async function postpone(s: CareShift) {
    const shift = (iso: string) => new Date(Date.parse(iso) + 86400000).toISOString();
    try { await update.mutateAsync({ id: s.id, patch: { starts_at: shift(s.starts_at), ends_at: shift(s.ends_at) } }); toast(tr('u2.metime.postponed')); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function cancel(s: CareShift) {
    if (!(await confirm(tr('u2.metime.cancel_title'), fmt(s), tr('u2.metime.cancel_confirm')))) return;
    try { await del.mutateAsync(s.id); toast(tr('u2.metime.cancelled')); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('u2.metime.title')} subtitle={tr('u2.metime.subtitle')}
      action={slots[0] ? { label: tr('u2.metime.book_range', { range: `${hm(slots[0].starts_at)} – ${hm(new Date(Math.min(Date.parse(slots[0].ends_at), Date.parse(slots[0].starts_at) + 3600000)).toISOString())}` }), icon: 'sun', disabled: save.isPending, testID: 'metime-next-slot',
        onPress: () => reserve({ starts_at: slots[0].starts_at, ends_at: new Date(Math.min(Date.parse(slots[0].ends_at), Date.parse(slots[0].starts_at) + 3600000)).toISOString() }, false) } : undefined}>
      <TodaySummary title={tr('u2.metime.my_time')} items={[
        { icon: 'sun', value: String(mine.length), label: mine.length > 1 ? tr('u2.metime.booked_pl') : tr('u2.metime.booked_one') },
        { icon: 'clock', value: mine[0] ? hm([...mine].sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1))[0].starts_at) : '—', label: tr('u2.metime.next') },
        { icon: 'calendar', value: String(slots.length), label: which === 'today' ? tr('u2.metime.free_today') : tr('u2.metime.free_tomorrow') },
      ]} />
      <SectionTitle title={tr('u2.metime.my_booked')} />
      {mine.length === 0 ? <EmptyState icon="sun" title={tr('u2.metime.none_title')} body={tr('u2.metime.none_body')} /> : null}
      {mine.map((s, i) => (
        <StaggerItem key={s.id} index={i}>
          <Card>
            <ListRow icon="sun" title={fmt(s)} subtitle={s.note ?? undefined} />
            <Row wrap style={{ marginTop: spacing.xs }}>
              <Button label={tr('u2.metime.ask_relay')} size="sm" variant="secondary" onPress={() => ask.mutateAsync({ kind: 'relay', message: tr('u2.metime.msg_breathe', { range: `${hm(s.starts_at)} – ${hm(s.ends_at)}` }), starts_at: s.starts_at, ends_at: s.ends_at }).then(() => toast(tr('u2.metime.request_sent'))).catch((e) => toast(friendlyError(e), 'error'))} />
              <Button label={tr('u2.metime.postpone')} size="sm" variant="ghost" onPress={() => postpone(s)} />
              <Button label={tr('u2.metime.cancel')} size="sm" variant="ghost" onPress={() => cancel(s)} />
            </Row>
          </Card>
        </StaggerItem>
      ))}

      <SectionTitle title={tr('u2.metime.free_in_calendar')} />
      <Segmented label={tr('u2.metime.day')} value={which} onChange={setWhich} options={[{ value: 'today', label: tr('u2.metime.today') }, { value: 'tomorrow', label: tr('u2.metime.tomorrow') }]} />
      <Card>
        <DayAvailability day={day} busy={busyList} free={slots} onPick={(f) => reserve({ starts_at: f.starts_at, ends_at: new Date(Math.min(Date.parse(f.ends_at), Date.parse(f.starts_at) + 3600000)).toISOString() }, false)}
          reserved={shifts.filter((s) => s.kind === 'me_time' && s.user_id === me && s.status !== 'cancelled')} />
      </Card>
      <Card>
        {slots.length === 0 ? <Text variant="small" muted>{tr('u2.metime.no_slot')}</Text> : null}
        {slots.map((s) => (
          <View key={s.starts_at} style={{ paddingVertical: 6 }}>
            <Text weight="medium">{hm(s.starts_at)} – {hm(s.ends_at)}</Text>
            <Row wrap style={{ marginTop: 4 }}>
              <Button label={tr('u2.metime.book_1h')} size="sm" onPress={() => reserve({ starts_at: s.starts_at, ends_at: new Date(Math.min(Date.parse(s.ends_at), Date.parse(s.starts_at) + 3600000)).toISOString() }, false)} loading={save.isPending} />
              <Button label={tr('u2.metime.book_relay')} size="sm" variant="secondary" onPress={() => reserve({ starts_at: s.starts_at, ends_at: new Date(Math.min(Date.parse(s.ends_at), Date.parse(s.starts_at) + 3600000)).toISOString() }, true)} />
            </Row>
          </View>
        ))}
        <Text variant="caption" muted style={{ marginTop: 6 }}>{tr('u2.metime.computed')}</Text>
      </Card>

      <SectionTitle title={tr('u2.metime.choose')} />
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Field label={tr('u2.metime.date')} value={date} onChangeText={setDate} placeholder={tr('u2.metime.date_ph')} keyboardType="numbers-and-punctuation" />
          <Row>
            <View style={{ flex: 1 }}><Field label={tr('u2.metime.from')} value={from} onChangeText={setFrom} placeholder="14h" /></View>
            <View style={{ flex: 1 }}><Field label={tr('u2.metime.to')} value={to} onChangeText={setTo} placeholder="15h30" /></View>
          </Row>
          <Field label={tr('u2.metime.what_for')} optional value={note} onChangeText={setNote} maxLength={300} placeholder={tr('u2.metime.what_for_ph')} />
          <Row wrap>
            <Button label={tr('u2.metime.book')} icon="sun" onPress={() => reserveManual(false)} loading={save.isPending} />
            <Button label={tr('u2.metime.book_relay_short')} variant="secondary" onPress={() => reserveManual(true)} />
          </Row>
        </View>
      </Card>

      {others.length ? (
        <>
          <SectionTitle title={tr('u2.metime.others')} />
          <Card>{others.map((s) => <ListRow key={s.id} icon="sun" title={labelOf(s.user_id)} subtitle={fmt(s)} />)}</Card>
          <Text variant="caption" muted>{tr('u2.metime.protect')}</Text>
        </>
      ) : null}
    </Screen>
  );
}
