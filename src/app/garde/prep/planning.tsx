/**
 * 148 — Calendrier des périodes de garde (nounou, assistante maternelle, crèche) : jours et horaires prévus, absences
 * de l'enfant, congés de la nounou, fermetures, et heures pointées, sur 4 semaines. Ne remplace pas la garde alternée
 * entre parents (/family/custody), qui reste l'outil de la résidence de l'enfant.
 * Parents : écriture ; nounou confirmée de l'enfant : lecture (ses propres horaires).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, IconButton, ListGroup, ListRow, Row, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { addDays, frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useAbsences, useDeleteSchedule, usePunches, useSaveSchedule, useSchedules, type PrepChild } from '@/lib/data/hooks-childcarePrep';
import {
  hoursLabel, mondayOfWeek, normTime, pairShifts, plannedOn, scheduleOn, validDay, type Schedule, type ScheduleDay,
} from '@/features/childcarePrep/domain';
import { ChildPicker, usePrepChild } from '@/features/childcarePrep/ui';

const WD = [1, 2, 3, 4, 5, 6, 7];
/** Nom du jour (lundi = 1) dans la langue de l'appli : date de référence 2026-11-02, un lundi. */
const dayName = (wd: number) => formatDate(`2026-11-0${1 + wd}T12:00:00`, { weekday: 'long' });
const H = (min: number) => hoursLabel(min, tr('gp.unit.h'));

function ScheduleEditor({ visible, onClose, child, schedule }: { visible: boolean; onClose: () => void; child: PrepChild; schedule?: Schedule | null }) {
  const toast = useToast();
  const save = useSaveSchedule();
  const del = useDeleteSchedule();
  const [label, setLabel] = useState('');
  const [from, setFrom] = useState('');
  const [days, setDays] = useState<Record<number, { on: boolean; start: string; end: string }>>({});
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!visible) return;
    setLabel(schedule?.label ?? ''); setFrom(toFrDate(schedule?.starts_on ?? todayISO())); setErr(null);
    const d: Record<number, { on: boolean; start: string; end: string }> = {};
    for (const wd of WD) {
      const s = schedule?.days.find((x) => x.wd === wd);
      d[wd] = { on: !!s || (!schedule && wd <= 5), start: s?.start ?? '08:30', end: s?.end ?? '17:30' };
    }
    setDays(d);
  }, [visible, schedule]);
  async function submit() {
    const startsOn = frToISO(from);
    if (!label.trim()) return setErr(tr('gp.err.label'));
    if (!startsOn) return setErr(tr('gp.err.date'));
    const out: ScheduleDay[] = [];
    for (const wd of WD) {
      const d = days[wd];
      if (!d?.on) continue;
      const slot = { wd, start: normTime(d.start) ?? '', end: normTime(d.end) ?? '' };
      if (!validDay(slot)) return setErr(`${dayName(wd)} : ${tr('gp.err.slot')}`);
      out.push(slot);
    }
    if (!out.length) return setErr(tr('gp.err.noDay'));
    setErr(null);
    try {
      await save.mutateAsync({ ...(schedule ? { id: schedule.id } : {}), household_id: child.household_id, child_id: child.id, label: label.trim().slice(0, 60), days: out, starts_on: startsOn, ends_on: schedule?.ends_on ?? null });
      toast(tr('gp.pl.saved'), 'success');
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function remove() {
    if (!schedule || !(await confirm(tr('common.delete'), tr('gp.pl.deleteQ'), tr('common.delete')))) return;
    try { await del.mutateAsync(schedule.id); onClose(); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  const set = (wd: number, patch: Partial<{ on: boolean; start: string; end: string }>) => setDays((x) => ({ ...x, [wd]: { ...x[wd], ...patch } }));
  return (
    <GlassSheet visible={visible} onClose={onClose} title={schedule ? tr('gp.pl.edit') : tr('gp.pl.new')}>
      <Field label={tr('gp.pl.label')} value={label} onChangeText={setLabel} maxLength={60} placeholder={tr('gp.pl.labelPh')} testID="gp-pl-label" />
      <Field label={tr('gp.pl.from')} value={from} onChangeText={setFrom} keyboardType="numbers-and-punctuation" hint={tr('gp.f.dateHint')} testID="gp-pl-from" />
      <Text variant="label">{tr('gp.pl.days')}</Text>
      {WD.map((wd) => (
        <View key={wd} style={{ gap: spacing.xs }}>
          <View style={{ alignSelf: 'flex-start' }}>
            <Chip label={dayName(wd)} selected={!!days[wd]?.on} onPress={() => set(wd, { on: !days[wd]?.on })} accessibilityLabel={tr('gp.pl.dayOn', { day: dayName(wd) })} testID={`gp-pl-day-${wd}`} />
          </View>
          {days[wd]?.on ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}><Field label={tr('gp.pl.start')} value={days[wd].start} onChangeText={(v) => set(wd, { start: v })} keyboardType="numbers-and-punctuation" maxLength={5} testID={`gp-pl-start-${wd}`} /></View>
              <View style={{ flex: 1 }}><Field label={tr('gp.pl.end')} value={days[wd].end} onChangeText={(v) => set(wd, { end: v })} keyboardType="numbers-and-punctuation" maxLength={5} testID={`gp-pl-end-${wd}`} /></View>
            </View>
          ) : null}
        </View>
      ))}
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="gp-pl-save" />
      {schedule ? <Button label={tr('common.delete')} variant="ghost" icon="trash-2" onPress={() => void remove()} /> : null}
    </GlassSheet>
  );
}

export default function CarePlanning() {
  const t = useTheme();
  const { children, child, setChild, loading } = usePrepChild();
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState<Schedule | null | undefined>(undefined);
  const today = todayISO();
  const start = addDays(mondayOfWeek(today), offset * 28);
  const end = addDays(start, 27);
  const schedQ = useSchedules(child?.id ?? null);
  const schedules = useMemo(() => (schedQ.data ?? []).map((s) => ({ ...s, days: Array.isArray(s.days) ? s.days : [] })), [schedQ.data]);
  const absences = useAbsences(child?.id ?? null).data ?? [];
  const punches = usePunches(child?.id ?? null, start, end).data ?? [];
  const shifts = useMemo(() => pairShifts(punches), [punches]);
  const parent = child?.role === 'parent';
  const current = scheduleOn(today, schedules) ?? schedules[0] ?? null;
  const days = useMemo(() => Array.from({ length: 28 }, (_, i) => plannedOn(addDays(start, i), schedules, absences)), [start, schedules, absences]);
  const weekPlanned = useMemo(() => Array.from({ length: 7 }, (_, i) => plannedOn(addDays(mondayOfWeek(today), i), schedules, absences)).reduce((n, d) => n + d.plannedMin, 0), [today, schedules, absences]);

  if (loading || (schedQ.isLoading && !schedQ.data && child)) return <Screen back title={tr('gp.tool.planning')} tool={false}><Skeleton rows={4} /></Screen>;
  if (!child) return <Screen back title={tr('gp.tool.planning')} tool={false}><EmptyState icon="calendar" title={tr('gp.tool.planning')} body={tr('gp.noChild')} /></Screen>;
  return (
    <Screen back title={tr('gp.tool.planning')} subtitle={tr('gp.pl.intro')} tool={false}
      action={parent ? { label: current ? tr('gp.pl.edit') : tr('gp.pl.new'), icon: current ? 'edit-2' : 'plus', onPress: () => setEditing(current), testID: 'gp-pl-edit' } : undefined}>
      <ChildPicker list={children} value={child.id} onChange={setChild} />
      {!current ? (
        <EmptyState icon="calendar" title={tr('gp.pl.none')} body={tr('gp.pl.noneBody')} action={parent ? { label: tr('gp.pl.new'), onPress: () => setEditing(null) } : undefined} />
      ) : (
        <Card tone="soft" testID="gp-pl-current">
          <Text variant="heading">{current.label}</Text>
          <Text variant="small" muted>{tr('gp.pl.weekTotal', { hours: H(weekPlanned) })}</Text>
          <View style={{ marginTop: spacing.xs, gap: 2 }}>
            {current.days.slice().sort((a, b) => a.wd - b.wd).map((d) => <Text key={d.wd} variant="small">{`${dayName(d.wd)} · ${d.start} – ${d.end}`}</Text>)}
          </View>
          {!parent ? <Text variant="small" muted style={{ marginTop: spacing.xs }}>{tr('gp.pl.readOnly')}</Text> : null}
        </Card>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <IconButton icon="chevron-left" label={tr('gp.pl.prevWeeks')} onPress={() => setOffset((o) => o - 1)} testID="gp-pl-prev" />
        <Text weight="bold" center style={{ flex: 1 }} accessibilityRole="header">{tr('gp.pl.weeksFrom', { date: formatDate(start, { day: 'numeric', month: 'long' }) })}</Text>
        <IconButton icon="chevron-right" label={tr('gp.pl.nextWeeks')} onPress={() => setOffset((o) => o + 1)} testID="gp-pl-next" />
      </View>
      <Card padded={false} style={{ padding: spacing.sm }}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {WD.map((wd) => <Text key={wd} variant="caption" muted center style={{ flex: 1 }}>{tr(`cu.wd.${wd - 1}` as TKey)}</Text>)}
        </View>
        {[0, 1, 2, 3].map((w) => (
          <View key={w} style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
            {days.slice(w * 7, w * 7 + 7).map((d) => {
              const worked = shifts.filter((s) => s.date === d.date).reduce((n, s) => n + s.minutes, 0);
              const why = d.absences.map((a) => tr(`gp.ab.kind.${a.kind}` as TKey)).join(', ');
              const state = d.off ? tr('gp.pl.stateOff', { why }) : d.plannedMin ? tr('gp.pl.statePlanned', { hours: H(d.plannedMin) }) : tr('gp.pl.stateNone');
              const isToday = d.date === today;
              return (
                <View key={d.date} testID={`gp-pl-cell-${d.date}`} accessible
                  accessibilityLabel={`${formatDate(d.date, { weekday: 'long', day: 'numeric', month: 'long' })} : ${state}${worked ? `, ${tr('gp.pl.stateDone', { hours: H(worked) })}` : ''}`}
                  style={{ flex: 1, minHeight: 52, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingVertical: 2,
                    backgroundColor: d.plannedMin ? t.colors.accentSoft : t.colors.surface,
                    borderWidth: isToday ? 2 : 1, borderStyle: d.off && !isToday ? 'dashed' : 'solid', borderColor: isToday ? t.colors.primary : d.plannedMin ? t.colors.accent : t.colors.border }}>
                  <Text variant="small" weight={isToday ? 'bold' : undefined} maxFontSizeMultiplier={1.3}>{Number(d.date.slice(8, 10))}</Text>
                  <Text variant="caption" muted maxFontSizeMultiplier={1.2}>{d.off ? '×' : worked ? '✓' : d.plannedMin ? '•' : ' '}</Text>
                </View>
              );
            })}
          </View>
        ))}
        <View style={{ gap: 4, marginTop: spacing.sm }}>
          <Row><View style={{ width: 14, height: 14, borderRadius: 4, borderWidth: 1, borderColor: t.colors.accent, backgroundColor: t.colors.accentSoft }} /><Text variant="small">{`• ${tr('gp.pl.legendPlanned')}`}</Text></Row>
          <Row><View style={{ width: 14, height: 14, borderRadius: 4, borderWidth: 1, borderStyle: 'dashed', borderColor: t.colors.border }} /><Text variant="small">{`× ${tr('gp.pl.legendOff')}`}</Text></Row>
          <Row><View style={{ width: 14, height: 14 }} /><Text variant="small">{`✓ ${tr('gp.pl.legendDone')}`}</Text></Row>
        </View>
      </Card>

      <ListGroup>
        <ListRow icon="sun" title={tr('gp.tool.absences')} subtitle={tr('gp.tool.absencesSub')} onPress={() => router.push(`/garde/prep/absences?child=${child.id}` as never)} testID="gp-pl-absences" />
        <ListRow icon="clock" title={tr('gp.tool.hours')} subtitle={tr('gp.tool.hoursSub')} onPress={() => router.push(`/garde/prep/heures?child=${child.id}` as never)} testID="gp-pl-hours" />
      </ListGroup>
      {parent && editing !== undefined ? <ScheduleEditor visible onClose={() => setEditing(undefined)} child={child} schedule={editing} /> : null}
    </Screen>
  );
}
