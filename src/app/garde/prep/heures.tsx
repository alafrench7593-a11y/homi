/**
 * 149 — Suivi des heures de garde : paires arrivée → départ du carnet de liaison (childcare_events, les mêmes lignes
 * que « Arrivée » / « Départ » de la nounou : aucune seconde saisie), totaux de la semaine et du mois, heures prévues
 * (planning moins absences, congés et fermetures), export CSV. Sans valeur légale de pointage.
 * Parents et nounou confirmée de l'enfant (ses propres heures).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { GlassSegmentedControl, GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, IconButton, ListGroup, ListRow, Row, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { formatDate, getLocale, t as tr } from '@/i18n';
import { addDays, frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { deliverFile } from '@/lib/deliverFile';
import { friendlyError } from '@/lib/data/hooks-settings';
import {
  useAbsences, useAddPunch, useDeletePunch, usePunches, useSchedules, useUpdatePunch, type PrepChild,
} from '@/lib/data/hooks-childcarePrep';
import {
  hoursCsv, hoursLabel, monthEnd, monthStart, mondayOfWeek, normTime, pairShifts, periodSummary, type AbsenceKind, type Shift,
} from '@/features/childcarePrep/domain';
import { ChildPicker, usePrepChild } from '@/features/childcarePrep/ui';

const H = (min: number) => hoursLabel(min, tr('gp.unit.h'));
const hhmm = (iso: string | undefined) => (iso ? new Date(iso).toTimeString().slice(0, 5) : '');
const atOf = (day: string, time: string) => new Date(`${day}T${time}:00`).toISOString();

/** Ajout ou correction d'un pointage (arrivée et / ou départ d'un même jour). */
function PunchEditor({ visible, onClose, child, shift }: { visible: boolean; onClose: () => void; child: PrepChild; shift: Shift | null }) {
  const toast = useToast();
  const add = useAddPunch();
  const upd = useUpdatePunch();
  const del = useDeletePunch();
  const [day, setDay] = useState('');
  const [arr, setArr] = useState('');
  const [dep, setDep] = useState('');
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!visible) return;
    setDay(toFrDate(shift?.date ?? todayISO())); setArr(hhmm(shift?.arrival?.at)); setDep(hhmm(shift?.departure?.at)); setErr(null);
  }, [visible, shift]);
  async function submit() {
    const d = frToISO(day);
    if (!d) return setErr(tr('gp.err.date'));
    const a = arr.trim() ? normTime(arr) : null;
    const b = dep.trim() ? normTime(dep) : null;
    if ((arr.trim() && !a) || (dep.trim() && !b) || (!a && !b) || (a && b && a >= b)) return setErr(tr('gp.err.slot'));
    setErr(null);
    try {
      for (const [kind, time, ev] of [['arrival', a, shift?.arrival], ['departure', b, shift?.departure]] as const) {
        if (!time) continue;
        if (ev && !ev._pending) { if (hhmm(ev.at) !== time || ev.at.slice(0, 10) !== d) await upd.mutateAsync({ id: ev.id, at: atOf(d, time) }); }
        else if (!ev) await add.mutateAsync({ child_id: child.id, household_id: child.household_id, kind, at: atOf(d, time) });
      }
      toast(tr('gp.hr.saved'), 'success');
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function remove() {
    if (!shift || !(await confirm(tr('common.delete'), tr('gp.hr.deleteQ'), tr('common.delete')))) return;
    try {
      for (const ev of [shift.arrival, shift.departure]) if (ev && !ev._pending) await del.mutateAsync(ev.id);
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <GlassSheet visible={visible} onClose={onClose} title={shift ? tr('gp.hr.edit') : tr('gp.hr.add')}>
      <Field label={tr('gp.hr.date')} value={day} onChangeText={setDay} keyboardType="numbers-and-punctuation" hint={tr('gp.f.dateHint')} testID="gp-hr-day" />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Field label={tr('gp.hr.arrival')} optional value={arr} onChangeText={setArr} keyboardType="numbers-and-punctuation" maxLength={5} placeholder="08:30" testID="gp-hr-arr" /></View>
        <View style={{ flex: 1 }}><Field label={tr('gp.hr.departure')} optional value={dep} onChangeText={setDep} keyboardType="numbers-and-punctuation" maxLength={5} placeholder="17:30" testID="gp-hr-dep" /></View>
      </View>
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Button label={tr('common.save')} icon="check" loading={add.isPending || upd.isPending} onPress={() => void submit()} testID="gp-hr-save" />
      {shift ? <Button label={tr('common.delete')} variant="ghost" icon="trash-2" onPress={() => void remove()} testID="gp-hr-delete" /> : null}
    </GlassSheet>
  );
}

export default function CareHours() {
  const toast = useToast();
  const { children, child, setChild, loading } = usePrepChild();
  const [mode, setMode] = useState<'week' | 'month'>('week');
  const [anchor, setAnchor] = useState(todayISO());
  const [editing, setEditing] = useState<Shift | null | undefined>(undefined);
  const from = mode === 'week' ? mondayOfWeek(anchor) : monthStart(anchor);
  const to = mode === 'week' ? addDays(from, 6) : monthEnd(anchor);
  const punchesQ = usePunches(child?.id ?? null, from, to);
  const schedules = useSchedules(child?.id ?? null).data ?? [];
  const absences = useAbsences(child?.id ?? null).data ?? [];
  const shifts = useMemo(() => pairShifts(punchesQ.data ?? []), [punchesQ.data]);
  const sum = useMemo(() => periodSummary(from, to, shifts, schedules.map((s) => ({ ...s, days: Array.isArray(s.days) ? s.days : [] })), absences), [from, to, shifts, schedules, absences]);
  const step = (dir: number) => setAnchor((a) => (mode === 'week' ? addDays(mondayOfWeek(a), dir * 7) : monthStart(dir > 0 ? addDays(monthEnd(a), 1) : addDays(monthStart(a), -1))));
  const periodLabel = mode === 'week' ? tr('gp.hr.weekOf', { date: formatDate(from, { day: 'numeric', month: 'long' }) }) : formatDate(from, { month: 'long', year: 'numeric' });

  async function exportCsv() {
    const kinds = { child: tr('gp.ab.kind.child'), caregiver_leave: tr('gp.ab.kind.caregiver_leave'), closure: tr('gp.ab.kind.closure') } as Record<AbsenceKind, string>;
    const csv = hoursCsv(from, to, shifts, absences, {
      date: tr('gp.csv.date'), arrival: tr('gp.csv.arrival'), departure: tr('gp.csv.departure'), duration: tr('gp.csv.duration'), hours: tr('gp.csv.hours'),
      absence: tr('gp.csv.absence'), total: tr('gp.csv.total'), notice: tr('gp.csv.notice'), kinds, decimalComma: getLocale() !== 'en',
    });
    try {
      await deliverFile(new TextEncoder().encode(csv), `heures-${child?.first_name ?? 'garde'}-${from}-${to}.csv`.replace(/[^A-Za-z0-9._-]+/g, '-'), 'text/csv', tr('gp.hr.exportTitle'));
      toast(tr('gp.hr.exported'), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  if (loading) return <Screen back title={tr('gp.tool.hours')} tool={false}><Skeleton rows={4} /></Screen>;
  if (!child) return <Screen back title={tr('gp.tool.hours')} tool={false}><EmptyState icon="clock" title={tr('gp.tool.hours')} body={tr('gp.noChild')} /></Screen>;
  const list = shifts.filter((s) => s.date >= from && s.date <= to).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Screen back title={tr('gp.tool.hours')} subtitle={tr('gp.hr.intro')} tool={false}
      action={{ label: tr('gp.hr.add'), icon: 'plus', onPress: () => setEditing(null), testID: 'gp-hr-add' }}>
      <ChildPicker list={children} value={child.id} onChange={setChild} />
      <GlassSegmentedControl label={tr('gp.hr.week')} value={mode} onChange={(m) => { setMode(m); setAnchor(todayISO()); }} testID="gp-hr-mode"
        options={[{ value: 'week', label: tr('gp.hr.week') }, { value: 'month', label: tr('gp.hr.month') }]} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <IconButton icon="chevron-left" label={tr('gp.hr.prev')} onPress={() => step(-1)} testID="gp-hr-prev" />
        <Text weight="bold" center style={{ flex: 1 }} accessibilityRole="header" testID="gp-hr-period">{periodLabel}</Text>
        <IconButton icon="chevron-right" label={tr('gp.hr.next')} onPress={() => step(1)} testID="gp-hr-next" />
      </View>
      <Card tone="soft" testID="gp-hr-summary">
        <Row wrap gap={spacing.lg}>
          <View><Text variant="small" muted>{tr('gp.hr.worked')}</Text><Text variant="title" testID="gp-hr-worked">{H(sum.workedMin)}</Text></View>
          <View><Text variant="small" muted>{tr('gp.hr.planned')}</Text><Text variant="title">{H(sum.plannedMin)}</Text></View>
        </Row>
        <View style={{ gap: 2, marginTop: spacing.xs }}>
          {sum.childDays ? <Text variant="small">{tr('gp.hr.childDays', { count: sum.childDays })}</Text> : null}
          {sum.leaveDays ? <Text variant="small">{tr('gp.hr.leaveDays', { count: sum.leaveDays })}</Text> : null}
          {sum.closureDays ? <Text variant="small">{tr('gp.hr.closureDays', { count: sum.closureDays })}</Text> : null}
          {sum.incomplete ? <Text variant="small" weight="bold">{tr('gp.hr.incomplete', { count: sum.incomplete })}</Text> : null}
        </View>
      </Card>
      {punchesQ.isLoading && !punchesQ.data ? <Skeleton rows={3} /> : !list.length ? <Card tone="soft"><Text muted>{tr('gp.hr.noShift')}</Text></Card> : (
        <ListGroup testID="gp-hr-list">
          {list.map((s, i) => {
            const a = s.arrival ? hhmm(s.arrival.at) : tr('gp.hr.missing');
            const b = s.departure ? hhmm(s.departure.at) : tr('gp.hr.missing');
            const pending = s.arrival?._pending || s.departure?._pending;
            return (
              <ListRow key={`${s.date}-${i}`} icon={s.arrival && s.departure ? 'clock' : 'alert-circle'} title={formatDate(s.date, { weekday: 'long', day: 'numeric', month: 'long' })}
                subtitle={`${tr('gp.hr.arrival')} ${a} · ${tr('gp.hr.departure')} ${b}${pending ? ` · ${tr('gp.hr.pending')}` : ''}`}
                value={s.minutes ? H(s.minutes) : undefined} onPress={pending ? undefined : () => setEditing(s)} testID={`gp-hr-shift-${s.date}`} />
            );
          })}
        </ListGroup>
      )}
      <Row wrap>
        <Chip label={tr('gp.hr.export')} icon="download" onPress={() => void exportCsv()} testID="gp-hr-export" />
        <Chip label={tr('gp.hr.journal')} icon="book-open" onPress={() => router.push(`/garde/${child.id}` as never)} testID="gp-hr-journal" />
      </Row>
      <Banner tone="info" icon="info">{tr('gp.hr.legal')}</Banner>
      {editing !== undefined ? <PunchEditor visible onClose={() => setEditing(undefined)} child={child} shift={editing} /> : null}
    </Screen>
  );
}
