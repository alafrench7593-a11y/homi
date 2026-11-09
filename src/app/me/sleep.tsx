/**
 * « Mon sommeil » — le sommeil du parent lui-même (distinct de celui du bébé).
 * Carnet privé (visible uniquement par vous), descriptif : aucune cible, aucune norme, aucun diagnostic.
 */
import React, { useMemo, useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { BarChart, StatPill } from '@/components/Charts';
import { Appear } from '@/components/Appear';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, haptic, Icon, IconButton, type IconName, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteParentSleep, useParentSleepLogs, useSaveParentSleep, useSleepContext } from '@/lib/data/hooks-sleep';
import { addDays, formatDuration, frToISO, todayISO } from '@/lib/domain/dates';
import {
  durationInput, estimateSleepMinutes, formatHHMM, nightLabel, nightMinutes, parseDuration, parseHHMM, resolveNight,
  sleepTips, summarizeWeek, supportSignal, timeOfIso, totalNapMinutes, validateSleepForm,
} from '@/lib/domain/parentSleep';
import { formatNumber, t as tr } from '@/i18n';
import { toFrDate } from '@/lib/validation';
import type { Nap, ParentSleepInput, ParentSleepLog, Scale5 } from '@/lib/types-sleep';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

const qualityLabels = () => [tr('u8.sleep.q1'), tr('u8.sleep.q2'), tr('u8.sleep.q3'), tr('u8.sleep.q4'), tr('u8.sleep.q5')];
const fatigueLabels = () => [tr('u8.sleep.f1'), tr('u8.sleep.f2'), tr('u8.sleep.f3'), tr('u8.sleep.f4'), tr('u8.sleep.f5')];
const moodLabels = () => [tr('u8.sleep.m1'), tr('u8.sleep.m2'), tr('u8.sleep.m3'), tr('u8.sleep.m4'), tr('u8.sleep.m5')];

// ---------------------------------------------------------------- petits composants
function ScalePicker({ label, labels, value, onChange }: { label: string; labels: string[]; value: Scale5 | null; onChange: (v: Scale5 | null) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label">{label}<Text variant="small" muted>{'  '}({tr('u8.sleep.optional')})</Text></Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', gap: 6 }}>
        {([1, 2, 3, 4, 5] as Scale5[]).map((v) => {
          const sel = value === v;
          return (
            <Tappable
              key={v}
              accessibilityRole="radio"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={tr('u8.sleep.scaleOf5', { v, label: labels[v - 1] })}
              onPress={() => { haptic('selection'); onChange(sel ? null : v); }}
              style={({ pressed }) => ({
                flex: 1, minHeight: MIN_TOUCH, borderRadius: radius.md, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center',
                borderColor: sel ? t.colors.primary : t.colors.border, backgroundColor: sel ? t.colors.primary : pressed ? t.colors.surfaceAlt : t.colors.surface,
              })}
            >
              <Text weight="bold" color={sel ? t.colors.primaryText : t.colors.text}>{v}</Text>
            </Tappable>
          );
        })}
      </View>
      <Text variant="caption" muted>{value ? labels[value - 1] : tr('u8.sleep.scaleHint', { low: labels[0].toLowerCase(), high: labels[4].toLowerCase() })}</Text>
    </View>
  );
}

function TimeField({ label, value, onChange, error, placeholder }: { label: string; value: string; onChange: (v: string) => void; error?: string; placeholder: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Field label={label} value={value} onChangeText={onChange} placeholder={placeholder} keyboardType="numbers-and-punctuation" maxLength={5} error={error} />
    </View>
  );
}

function SupportBanner({ fatigue, lowMood }: { fatigue: boolean; lowMood: boolean }) {
  const toast = useToast();
  const what = fatigue && lowMood
    ? tr('u8.sleep.sup.both')
    : fatigue ? tr('u8.sleep.sup.fatigue') : tr('u8.sleep.sup.mood');
  return (
    <Banner
      tone="warning"
      icon="heart"
      title={tr('u8.sleep.sup.title')}
      action={
        <Row wrap style={{ marginTop: spacing.xs }}>
          <Button label={tr('u8.sleep.sup.call')} size="sm" variant="secondary" icon="phone" onPress={() => Linking.openURL('tel:3114').catch(() => toast(tr('u8.sleep.sup.callFail'), 'error'))} />
          <Button label={tr('u8.sleep.sup.help')} size="sm" variant="secondary" icon="life-buoy" onPress={() => router.push('/emergency')} />
        </Row>
      }
    >
      <Text variant="small">
        {tr('u8.sleep.sup.body', { what })}
      </Text>
    </Banner>
  );
}

// ---------------------------------------------------------------- formulaire
interface FormState {
  id: string | null;
  date: string;
  bed: string;
  wake: string;
  wakings: string;
  details: { at: string; minutes: string }[];
  duration: string;
  durationEdited: boolean;
  naps: Nap[];
  quality: Scale5 | null;
  fatigue: Scale5 | null;
  mood: Scale5 | null;
  note: string;
}

function emptyForm(date = todayISO()): FormState {
  return { id: null, date: toFrDate(date), bed: '', wake: '', wakings: '0', details: [], duration: '', durationEdited: false, naps: [], quality: null, fatigue: null, mood: null, note: '' };
}

/** Nouvelle nuit pré-remplie avec les horaires de la dernière nuit notée (les siens, jamais une norme), à ajuster. */
function usualForm(logs: ParentSleepLog[]): FormState {
  const last = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date))[0];
  const f = emptyForm();
  if (!last) return f;
  return { ...f, bed: timeOfIso(last.bedtime), wake: timeOfIso(last.wake_time) };
}

function formFromLog(l: ParentSleepLog): FormState {
  return {
    id: l.id,
    date: toFrDate(l.log_date),
    bed: timeOfIso(l.bedtime),
    wake: timeOfIso(l.wake_time),
    wakings: String(l.night_wakings ?? 0),
    details: (l.waking_details ?? []).map((d) => ({ at: d.at ?? '', minutes: d.minutes != null ? String(d.minutes) : '' })),
    duration: l.duration_edited ? durationInput(l.sleep_minutes) : '',
    durationEdited: l.duration_edited,
    naps: (l.naps ?? []).map((n) => ({ ...n })),
    quality: l.quality, fatigue: l.fatigue, mood: l.mood,
    note: l.note ?? '',
  };
}

const norm = (hhmm: string) => {
  const m = parseHHMM(hhmm);
  return m == null ? null : formatHHMM(m);
};

function SleepFormSheet({ initial, logs, onClose }: { initial: FormState; logs: ParentSleepLog[]; onClose: () => void }) {
  const t = useTheme();
  const toast = useToast();
  const save = useSaveParentSleep();
  const del = useDeleteParentSleep();
  const [f, setF] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((cur) => ({ ...cur, [k]: v }));

  const iso = frToISO(f.date);
  const night = iso && f.bed && f.wake ? resolveNight(iso, f.bed, f.wake) : null;
  const detailsNum = f.details.map((d) => ({ at: norm(d.at), minutes: d.minutes.trim() && /^\d+$/.test(d.minutes.trim()) ? Number(d.minutes) : null }));
  const auto = night ? estimateSleepMinutes(night.bedtime, night.wake, detailsNum) : null;
  const durationShown = f.durationEdited ? f.duration : auto != null ? durationInput(auto) : '';
  const count = f.wakings.trim() === '' ? 0 : Number(f.wakings);

  function setCount(n: number) {
    set('wakings', String(Math.max(0, Math.min(30, n))));
  }

  async function submit() {
    const today = todayISO();
    const e: Record<string, string> = {};
    if (!iso) e.logDate = tr('u8.sleep.f.dateFormat');
    Object.assign(e, iso ? validateSleepForm({ logDate: iso, bed: f.bed, wake: f.wake, wakings: f.wakings, details: f.details, duration: f.durationEdited ? f.duration : '', durationEdited: f.durationEdited, naps: f.naps }, today) : {});
    if (!e.logDate && iso && logs.some((l) => l.log_date === iso && l.id !== f.id)) e.logDate = tr('u8.sleep.f.dup');
    const minutes = f.durationEdited ? parseDuration(f.duration) : auto;
    const hasContent = !!night || minutes != null || f.naps.length > 0 || count > 0 || f.quality || f.fatigue || f.mood || f.note.trim();
    if (!hasContent && !Object.keys(e).length) e.form = tr('u8.sleep.f.needOne');
    setErrors(e);
    if (Object.keys(e).length || !iso) return;
    const details = detailsNum.filter((d) => d.at != null || d.minutes != null);
    const input: ParentSleepInput = {
      log_date: iso,
      bedtime: night ? night.bedtime.toISOString() : null,
      wake_time: night ? night.wake.toISOString() : null,
      night_wakings: Math.max(count, details.length),
      waking_details: details,
      sleep_minutes: minutes ?? null,
      duration_edited: f.durationEdited && minutes != null,
      naps: f.naps.map((n) => ({ start: norm(n.start) ?? n.start, end: norm(n.end) ?? n.end })),
      quality: f.quality, fatigue: f.fatigue, mood: f.mood,
      note: f.note.trim() || null,
    };
    try {
      await save.mutateAsync({ id: f.id, input });
      haptic('success');
      toast(f.id ? tr('u8.sleep.f.edited') : tr('u8.sleep.f.saved'));
      onClose();
    } catch (err) {
      toast(friendlyError(err, tr('u8.sleep.f.saveFail')), 'error');
    }
  }

  async function remove() {
    if (!f.id) return;
    if (!(await confirm(tr('u8.sleep.f.delQ'), tr('u8.sleep.f.final'), tr('u8.sleep.f.delete')))) return;
    try {
      await del.mutateAsync(f.id);
      toast(tr('u8.sleep.f.deleted'));
      onClose();
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  return (
    <Sheet visible onClose={onClose} title={f.id ? tr('u8.sleep.f.editTitle') : tr('u8.sleep.f.addTitle')}>
      <Field label={tr('u8.sleep.f.wakeDay')} value={f.date} onChangeText={(v) => set('date', v)} placeholder={tr('u8.sleep.f.datePh')} keyboardType="numbers-and-punctuation" maxLength={10} error={errors.logDate}
        hint={iso ? `${nightLabel(iso)}` : undefined} />
      {!f.id && (
        <Row>
          <Chip label={tr('u8.sleep.f.tonight')} selected={iso === todayISO()} onPress={() => set('date', toFrDate(todayISO()))} />
          <Chip label={tr('u8.sleep.f.lastNightChip')} selected={iso === addDays(todayISO(), -1)} onPress={() => set('date', toFrDate(addDays(todayISO(), -1)))} />
        </Row>
      )}

      {!initial.id && initial.bed ? <Text variant="caption" muted testID="sleep-prefilled">{tr('u8.sleep.f.prefilled')}</Text> : null}
      <Row style={{ alignItems: 'flex-start' }}>
        <TimeField label={tr('u8.sleep.f.bed')} value={f.bed} onChange={(v) => set('bed', v)} placeholder="22:30" error={errors.bed} />
        <TimeField label={tr('u8.sleep.f.wake')} value={f.wake} onChange={(v) => set('wake', v)} placeholder="07:00" error={errors.wake} />
      </Row>

      <View style={{ gap: 6 }}>
        <Text variant="label">{tr('u8.sleep.f.wakings')}</Text>
        <Row>
          <IconButton icon="minus" label={tr('u8.sleep.f.less')} onPress={() => setCount(count - 1)} style={{ backgroundColor: t.colors.surfaceAlt }} />
          <Text variant="heading" style={{ minWidth: 40, textAlign: 'center' }} accessibilityLiveRegion="polite">{Number.isFinite(count) ? count : 0}</Text>
          <IconButton icon="plus" label={tr('u8.sleep.f.more')} onPress={() => setCount(count + 1)} style={{ backgroundColor: t.colors.surfaceAlt }} />
        </Row>
        {errors.wakings ? <Text variant="small" color={t.colors.danger}>{errors.wakings}</Text> : null}
        {f.details.map((d, i) => (
          <View key={i} style={{ gap: 4 }}>
            <Row style={{ alignItems: 'flex-end' }}>
              <TimeField label={tr('u8.sleep.f.wakingTime', { n: i + 1 })} value={d.at} placeholder="03:15" onChange={(v) => set('details', f.details.map((x, j) => (j === i ? { ...x, at: v } : x)))} />
              <View style={{ flex: 1 }}>
                <Field label={tr('u8.sleep.f.awake')} value={d.minutes} onChangeText={(v) => set('details', f.details.map((x, j) => (j === i ? { ...x, minutes: v } : x)))} placeholder="20" keyboardType="number-pad" maxLength={3} />
              </View>
              <IconButton icon="x" label={tr('u8.sleep.f.removeWaking', { n: i + 1 })} onPress={() => set('details', f.details.filter((_, j) => j !== i))} />
            </Row>
            {errors[`detail${i}`] ? <Text variant="small" color={t.colors.danger}>{errors[`detail${i}`]}</Text> : null}
          </View>
        ))}
        {f.details.length < 30 && (
          <Button label={tr('u8.sleep.f.addWaking')} size="sm" variant="ghost" icon="plus" style={{ alignSelf: 'flex-start' }}
            onPress={() => { set('details', [...f.details, { at: '', minutes: '' }]); if (count <= f.details.length) setCount(f.details.length + 1); }} />
        )}
      </View>

      <View style={{ gap: 6 }}>
        <Field label={tr('u8.sleep.f.approx')} optional value={durationShown} placeholder="7h30" maxLength={8} error={errors.duration}
          onChangeText={(v) => setF((cur) => ({ ...cur, duration: v, durationEdited: true }))}
          hint={f.durationEdited ? tr('u8.sleep.f.hintEdited') : tr('u8.sleep.f.hintAuto')} />
        {f.durationEdited && auto != null && (
          <Button label={tr('u8.sleep.f.revert', { duration: formatDuration(auto) })} size="sm" variant="ghost" icon="refresh-cw" style={{ alignSelf: 'flex-start' }}
            onPress={() => setF((cur) => ({ ...cur, duration: '', durationEdited: false }))} />
        )}
      </View>

      <View style={{ gap: 6 }}>
        <Text variant="label">{tr('u8.sleep.f.naps')}</Text>
        {f.naps.map((n, i) => (
          <View key={i} style={{ gap: 4 }}>
            <Row style={{ alignItems: 'flex-end' }}>
              <TimeField label={tr('u8.sleep.f.napStart', { n: i + 1 })} value={n.start} placeholder="14:00" onChange={(v) => set('naps', f.naps.map((x, j) => (j === i ? { ...x, start: v } : x)))} />
              <TimeField label={tr('u8.sleep.f.napEnd')} value={n.end} placeholder="14:45" onChange={(v) => set('naps', f.naps.map((x, j) => (j === i ? { ...x, end: v } : x)))} />
              <IconButton icon="x" label={tr('u8.sleep.f.removeNap', { n: i + 1 })} onPress={() => set('naps', f.naps.filter((_, j) => j !== i))} />
            </Row>
            {errors[`nap${i}`] ? <Text variant="small" color={t.colors.danger}>{errors[`nap${i}`]}</Text> : null}
          </View>
        ))}
        {f.naps.length < 12 && (
          <Button label={tr('u8.sleep.f.addNap')} size="sm" variant="ghost" icon="plus" style={{ alignSelf: 'flex-start' }} onPress={() => set('naps', [...f.naps, { start: '', end: '' }])} />
        )}
      </View>

      <ScalePicker label={tr('u8.sleep.f.quality')} labels={qualityLabels()} value={f.quality} onChange={(v) => set('quality', v)} />
      <ScalePicker label={tr('u8.sleep.f.fatigue')} labels={fatigueLabels()} value={f.fatigue} onChange={(v) => set('fatigue', v)} />
      <ScalePicker label={tr('u8.sleep.f.mood')} labels={moodLabels()} value={f.mood} onChange={(v) => set('mood', v)} />

      <Field label={tr('u8.sleep.f.notes')} optional value={f.note} onChangeText={(v) => set('note', v)} multiline maxLength={2000} placeholder={tr('u8.sleep.f.notesPh')} style={{ minHeight: 90, textAlignVertical: 'top' }} />

      {errors.form ? <Banner tone="warning">{errors.form}</Banner> : null}
      <Button label={f.id ? tr('u8.sleep.f.saveChanges') : tr('u8.sleep.f.saveNight')} onPress={submit} loading={save.isPending} full />
      {!!f.id && <Button label={tr('u8.sleep.f.deleteNight')} variant="ghost" icon="trash-2" loading={del.isPending} onPress={remove} />}
    </Sheet>
  );
}

// ---------------------------------------------------------------- écran
function logSubtitle(l: ParentSleepLog): string {
  const parts: string[] = [];
  if (l.bedtime && l.wake_time) parts.push(`${timeOfIso(l.bedtime)} → ${timeOfIso(l.wake_time)}`);
  if (l.night_wakings) parts.push(tr('u8.sleep.sub.wakings', { count: l.night_wakings }));
  const naps = (l.naps ?? []).length;
  if (naps) parts.push(tr('u8.sleep.sub.naps', { count: naps, duration: formatDuration(totalNapMinutes(l.naps)) }));
  if (l.quality) parts.push(tr('u8.sleep.sub.quality', { v: l.quality }));
  if (l.fatigue) parts.push(tr('u8.sleep.sub.fatigue', { v: l.fatigue }));
  if (l.mood) parts.push(tr('u8.sleep.sub.mood', { v: l.mood }));
  return parts.join(' · ');
}

export default function MySleepScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const logsQ = useParentSleepLogs(90);
  const { data: logs } = logsQ;
  const [removingId, setRemovingId] = useState<string | null>(null);
  const del = useDeleteParentSleep();
  const toast = useToast();
  const ctx = useSleepContext();
  const [form, setForm] = useState<FormState | null>(null);

  const today = todayISO();
  const week = useMemo(() => summarizeWeek(logs ?? [], today), [logs, today]);
  const signal = useMemo(() => supportSignal(logs ?? [], today), [logs, today]);
  const tips = useMemo(() => sleepTips(ctx), [ctx]);
  const todayLog = logs?.find((l) => l.log_date === today);

  async function remove(l: ParentSleepLog) {
    if (!(await confirm(tr('u8.sleep.f.delQ'), tr('u8.sleep.f.final'), tr('u8.sleep.f.delete')))) return;
    setRemovingId(l.id);
    try {
      await del.mutateAsync(l.id);
      toast(tr('u8.sleep.f.deleted'));
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setRemovingId(null);
    }
  }

  const tipsTitle = ctx.postpartum && ctx.pregnant ? tr('u8.sleep.tips.both') : ctx.postpartum ? tr('u8.sleep.tips.post') : ctx.pregnant ? tr('u8.sleep.tips.preg') : tr('u8.sleep.tips.gen');

  const loading = logsQ.isLoading && !logs;
  const failed = logsQ.isError && !logs;

  return (
    <Screen back title={tr('u8.sleep.title')} subtitle={tr('u8.sleep.subtitle')} scroll={false} padded={false}
      action={{ label: todayLog ? tr('u8.sleep.f.editTitle') : tr('u8.sleep.f.addTitle'), icon: 'moon', onPress: () => setForm(todayLog ? formFromLog(todayLog) : usualForm(logs ?? [])), testID: 'sleep-main-action' }}>
      <VirtualList
        data={loading || failed ? [] : logs ?? []}
        keyExtractor={(l) => l.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        ListHeaderComponent={(
          <View style={{ gap: spacing.md }}>
            <Banner tone="info" icon="lock">{tr('u8.sleep.banner')}</Banner>

            {signal.show && <SupportBanner fatigue={signal.fatigue} lowMood={signal.lowMood} />}

            <Appear kind="soft">
              <TodaySummary title={tr('u8.sleep.f.tonight')} items={[
                { icon: 'moon', value: todayLog && nightMinutes(todayLog) != null ? formatDuration(nightMinutes(todayLog)!) : '—', label: tr('u8.sleep.sleep') },
                { icon: 'star', value: todayLog?.quality ? `${todayLog.quality}/5` : '—', label: tr('u8.sleep.qualityS') },
                { icon: 'battery', value: todayLog?.fatigue ? `${todayLog.fatigue}/5` : '—', label: tr('u8.sleep.fatigueS') },
              ]} />
            </Appear>

            <SectionTitle title={tr('u8.sleep.last7')} />
            {loading ? <Skeleton kind="card" rows={1} /> : failed ? (
              <ErrorView error={logsQ.error} onRetry={() => void logsQ.refetch()} title={tr('u8.sleep.listErr')} />
            ) : (
            <Card>
              {week.nightsLogged > 0 ? (
                <BarChart
                  data={week.days.map((d) => ({ label: d.label, value: d.minutes != null ? Math.round((d.minutes / 60) * 10) / 10 : 0 }))}
                  unit="h"
                  accessibilityLabel={tr('u8.sleep.chartA11y')}
                />
              ) : (
                <Text muted>{tr('u8.sleep.noneWeek')}</Text>
              )}
              <Row wrap style={{ marginTop: spacing.sm }}>
                <StatPill value={week.avgSleepMinutes != null ? formatDuration(week.avgSleepMinutes) : '—'} label={tr('u8.sleep.avg', { count: week.nightsLogged })} />
                <StatPill value={String(week.napsCount)} label={week.napsCount ? tr('u8.sleep.napsDur', { count: week.napsCount, duration: formatDuration(week.napMinutes) }) : tr('u8.sleep.napsLabel')} />
                <StatPill value={String(week.totalWakings)} label={tr('u8.sleep.wakingsStat')} />
              </Row>
              <Row wrap style={{ marginTop: spacing.xs }}>
                <StatPill value={week.avgQuality != null ? `${formatNumber(week.avgQuality)}/5` : '—'} label={tr('u8.sleep.avgQ')} />
                <StatPill value={week.avgFatigue != null ? `${formatNumber(week.avgFatigue)}/5` : '—'} label={tr('u8.sleep.avgF')} />
              </Row>
              <Text variant="caption" muted style={{ marginTop: spacing.sm }}>{tr('u8.sleep.numbers')}</Text>
            </Card>
            )}

            <SectionTitle title={tipsTitle} />
            <Text variant="small" muted>{tr('u8.sleep.tipsIntro')}</Text>
            {tips.map((tip) => (
              <Card key={tip.key} tone="lavender">
                <Row style={{ alignItems: 'flex-start' }}>
                  <Icon name={tip.icon as IconName} color={t.colors.lavender} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text weight="bold">{tip.title}</Text>
                    <Text variant="small">{tip.text}</Text>
                  </View>
                </Row>
              </Card>
            ))}
            <Banner tone="info" title={tr('u8.sleep.whenTitle')}>
              {tr('u8.sleep.whenBody')}
            </Banner>

            <SectionTitle title={tr('u8.sleep.myNights')} />
            {loading ? <Skeleton rows={3} /> : null}
          </View>
        )}
        ListEmptyComponent={loading || failed ? null : (
          <EmptyState icon="moon" title={tr('u8.sleep.none')} body={tr('u8.sleep.noneBody')} action={{ label: tr('u8.sleep.f.addTitle'), icon: 'moon', onPress: () => setForm(emptyForm()) }} />
        )}
        renderItem={({ item: l }) => {
          const m = nightMinutes(l);
          return (
            <Card style={{ paddingVertical: spacing.xs }}>
              {/* « Supprimer » à côté de la ligne et non dedans : un bouton dans un bouton est invalide sur le web */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ListRow
                    icon="moon"
                    title={`${nightLabel(l.log_date)}${m != null ? ` · ${formatDuration(m)}` : ''}`}
                    subtitle={[logSubtitle(l), l.note ? (l.note.length > 80 ? `${l.note.slice(0, 80)}…` : l.note) : null].filter(Boolean).join(' — ') || undefined}
                    onPress={() => setForm(formFromLog(l))}
                    right={<View />}
                  />
                </View>
                <Button label={tr('u8.sleep.f.delete')} size="sm" variant="ghost" loading={removingId === l.id} onPress={() => remove(l)} accessibilityLabel={tr('u8.sleep.delA11y', { night: nightLabel(l.log_date).toLowerCase() })} />
              </View>
            </Card>
          );
        }}
        ListFooterComponent={(
          <View style={{ marginTop: spacing.sm }}>
            <ListRow icon="life-buoy" title={tr('u8.sleep.helpNow')} subtitle={tr('u8.sleep.helpNowSub')} onPress={() => router.push('/emergency')} />
          </View>
        )}
      />

      {form && <SleepFormSheet key={form.id ?? 'new'} initial={form} logs={logs ?? []} onClose={() => setForm(null)} />}
    </Screen>
  );
}
