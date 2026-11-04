/**
 * Composants partagés des parcours « concevoir » (/fertility) et « éviter une grossesse » (/contraception).
 * Toute date d'ovulation / de fertilité est affichée comme une ESTIMATION.
 */
import { useObjective } from '@/features/cycle/Objective';
import { insertOrQueue } from '@/lib/offline';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { BarChart, StatPill } from './Charts';
import { confirm, Sheet, useToast } from './Overlays';
import { Banner, Button, Card, Chip, Field, haptic, Icon, IconButton, type IconName, ListRow, Row, SectionTitle, Segmented, Text, Toggle } from './ui';
import { EmptyState, ErrorView, Skeleton, VirtualList } from './States';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { useHouseholdId, useInvalidate, usePeriods, useReminders, useTests } from '@/lib/data/hooks';
import { useSymptomLogs } from '@/lib/data/hooks-me';
import { useCyclePreferences } from '@/lib/data/hooks-cycle';
import { friendlyError, useDeleteReminder, useToggleReminder } from '@/lib/data/hooks-settings';
import { useAddQuestions, useConsultationQuestions, useJourneyArticles, useShareQuestion } from '@/lib/data/hooks-fertility';
import { addDays, daysBetween, frToISO, todayISO, type ISODate } from '@/lib/domain/dates';
import { cycleHistory, monthGrid, type CycleEstimate } from '@/lib/domain/cycle';
import { describeSchedule, validateSchedule, type ReminderSchedule, type Weekday } from '@/lib/domain/reminders';
import { toFrDate } from '@/lib/validation';
import { QUESTION_SUGGESTIONS, type ReminderPreset } from '@/content/fertility';
import type { PeriodEntry } from '@/lib/types';
import type { FertilityJourney } from '@/lib/types-fertility';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { formatDate, formatNumber, t as tr, type TKey } from '@/i18n';

export const RELIABILITY_LABEL = {
  get insufficient() { return tr('u5.fert.rel_insufficient'); },
  get low() { return tr('u5.fert.rel_low'); },
  get moderate() { return tr('u5.fert.rel_moderate'); },
} as const;
/** Date localisée (jour, mois, année) à partir d'un ISODate. */
export const fdate = (d: ISODate, withYear = true) => formatDate(`${d}T12:00:00Z`, { day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' as const } : {}), timeZone: 'UTC' });
export const fmt = (d: ISODate) => fdate(d, false);
export const num = (n: number) => formatNumber(n);

// ---------------------------------------------------------------- étiquette « estimation »
export function EstimateTag() {
  const t = useTheme();
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: t.colors.lavender + '22' }}>
      <Text variant="caption" weight="bold" color={t.colors.lavender}>{tr('u5.fert.estimate')}</Text>
    </View>
  );
}

/** Ligne « libellé : valeur » avec l'étiquette estimation. */
export function EstimateLine({ label, value, estimate = true }: { label: string; value: string; estimate?: boolean }) {
  return (
    <View style={{ gap: 2, paddingVertical: 4 }}>
      <Row gap={6} wrap>
        <Text variant="small" muted>{label}</Text>
        {estimate ? <EstimateTag /> : null}
      </Row>
      <Text weight="bold">{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------- calendrier mensuel
/** Initiales des jours, du lundi au dimanche, dans la langue courante. */
const weekdayInitials = () => [0, 1, 2, 3, 4, 5, 6].map((i) => formatDate(new Date(Date.UTC(2024, 0, 1 + i)), { weekday: 'narrow', timeZone: 'UTC' }));

export interface CalendarStyle { bg: string; fg?: string; label: string }

export function MonthCalendar<K extends string | null>({ kindOf, styleOf, legend, dotsOf, onDayPress, selected }: {
  kindOf: (day: ISODate) => K;
  styleOf: (k: K) => CalendarStyle | null;
  legend: K[];
  /** Pastilles de couleur sous le numéro du jour (événements notés). */
  dotsOf?: (day: ISODate) => string[];
  onDayPress?: (day: ISODate) => void;
  selected?: ISODate | null;
}) {
  const t = useTheme();
  const today = todayISO();
  const [cursor, setCursor] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const days = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
  const shift = (d: number) => setCursor((c) => {
    const m = c.m + d;
    return { y: c.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
  });
  const monthPrefix = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`;
  return (
    <View style={{ gap: 4 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon="chevron-left" label={tr('u5.fert.prev_month')} onPress={() => shift(-1)} />
        <Text weight="bold" accessibilityRole="header">{formatDate(new Date(Date.UTC(cursor.y, cursor.m, 1)), { month: 'long', year: 'numeric', timeZone: 'UTC' })}</Text>
        <IconButton icon="chevron-right" label={tr('u5.fert.next_month')} onPress={() => shift(1)} />
      </Row>
      <Row gap={4}>{weekdayInitials().map((d, i) => <Text key={i} variant="caption" muted center style={{ flex: 1 }}>{d}</Text>)}</Row>
      {Array.from({ length: days.length / 7 }, (_, w) => (
        <Row key={w} gap={4}>
          {days.slice(w * 7, w * 7 + 7).map((d) => {
            const k = kindOf(d);
            const s = styleOf(k);
            const inMonth = d.startsWith(monthPrefix);
            const isToday = d === today;
            const dots = dotsOf?.(d) ?? [];
            const isSel = selected === d;
            const style = { flex: 1, aspectRatio: 1, maxHeight: 44, borderRadius: radius.sm, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: s?.bg ?? 'transparent', borderWidth: isSel ? 2 : isToday ? 1.5 : 0, borderColor: isSel ? t.colors.text : t.colors.primary, opacity: inMonth ? 1 : 0.35 };
            const label = `${fdate(d)}${isToday ? `, ${tr('u5.fert.today')}` : ''}${s ? `, ${s.label}` : ''}${dots.length ? `, ${tr('u5.fert.dots', { count: dots.length })}` : ''}`;
            const inner = (
              <>
                <Text variant="caption" weight={isToday || isSel ? 'bold' : 'regular'} color={s?.fg}>{Number(d.slice(8, 10))}</Text>
                {dots.length ? (
                  <View style={{ flexDirection: 'row', gap: 2, position: 'absolute', bottom: 3 }}>
                    {dots.slice(0, 4).map((c, i) => <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c }} />)}
                  </View>
                ) : null}
              </>
            );
            return onDayPress ? (
              <Tappable key={d} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: isSel }} onPress={() => onDayPress(d)} style={style}>{inner}</Tappable>
            ) : (
              <View key={d} accessible accessibilityLabel={label} style={style}>{inner}</View>
            );
          })}
        </Row>
      ))}
      <View style={{ marginTop: 4, gap: 4 }}>
        {legend.map((k) => {
          const s = styleOf(k);
          if (!s) return null;
          return (
            <Row key={String(k)} gap={6}>
              <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: s.bg, borderWidth: 1, borderColor: t.colors.border }} />
              <Text variant="caption" muted style={{ flex: 1 }}>{s.label}</Text>
            </Row>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- navigation
export function NavCard({ items }: { items: { icon: IconName; title: string; subtitle: string; to: string }[] }) {
  return (
    <Card>
      {items.map((l) => <ListRow key={l.to} icon={l.icon} title={l.title} subtitle={l.subtitle} onPress={() => router.push(l.to as never)} />)}
    </Card>
  );
}

// ---------------------------------------------------------------- règles
const flowLabel = (): Record<NonNullable<PeriodEntry['flow']>, string> => ({ spotting: tr('u5.fert.f_spotting'), light: tr('u5.fert.f_light'), medium: tr('u5.fert.f_medium'), heavy: tr('u5.fert.f_heavy'), very_heavy: tr('u5.fert.f_vheavy') });
type Flow = NonNullable<PeriodEntry['flow']> | 'none';

export function PeriodLogger() {
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const periodsQ = usePeriods();
  const periods = periodsQ.data;
  const entries = useMemo(() => periods ?? [], [periods]);
  const [start, setStart] = useState(toFrDate(todayISO()));
  const [end, setEnd] = useState('');
  const [flow, setFlow] = useState<Flow>('none');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function add() {
    const s = frToISO(start);
    const e = end.trim() ? frToISO(end) : null;
    const errs: Record<string, string> = {};
    if (!s || s > todayISO()) errs.start = tr('u5.fert.e_start');
    if (end.trim() && (!e || (s && e < s))) errs.end = tr('u5.fert.e_end');
    if (s && e && daysBetween(s, e) > 15) errs.end = tr('u5.fert.e_len');
    if (s && entries.some((p) => p.start_date === s)) errs.start = tr('u5.fert.e_dup');
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await insertOrQueue('period_entries', { user_id: userId, start_date: s, end_date: e, flow: flow === 'none' ? null : flow, note: null });
      inv('period_entries');
      haptic('success');
      setEnd('');
      setFlow('none');
      toast(tr('u5.fert.p_saved'));
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function endToday(p: PeriodEntry) {
    setBusyId(p.id);
    try {
      await backend.update('period_entries', { end_date: todayISO() }, [eq('id', p.id)]);
      inv('period_entries');
      toast(tr('u5.fert.p_end_saved'));
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(p: PeriodEntry) {
    if (!(await confirm(tr('u5.fert.p_del'), tr('u5.fert.final'), tr('u5.fert.delete')))) return;
    try {
      await backend.remove('period_entries', [eq('id', p.id)]);
      inv('period_entries');
      toast(tr('u5.fert.p_deleted'));
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  return (
    <>
      <Card>
        <Row style={{ alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}><Field label={tr('u5.fert.start')} value={start} onChangeText={setStart} error={errors.start} keyboardType="numbers-and-punctuation" placeholder={tr('u5.fert.date_ph')} /></View>
          <View style={{ flex: 1 }}><Field label={tr('u5.fert.end')} optional value={end} onChangeText={setEnd} error={errors.end} keyboardType="numbers-and-punctuation" placeholder={tr('u5.fert.date_ph')} /></View>
        </Row>
        <View style={{ gap: 6, marginTop: spacing.sm }}>
          <Text variant="label">{tr('u5.fert.flow_opt')}</Text>
          <Segmented label={tr('u5.fert.flow')} value={flow} onChange={setFlow} options={[{ value: 'none', label: '—' }, { value: 'spotting', label: tr('u5.fert.o_spotting') }, { value: 'light', label: tr('u5.fert.o_light') }, { value: 'medium', label: tr('u5.fert.o_medium') }, { value: 'heavy', label: tr('u5.fert.o_heavy') }, { value: 'very_heavy', label: tr('u5.fert.o_vheavy') }]} />
        </View>
        <Button label={tr('u5.fert.save_p')} icon="plus" style={{ marginTop: spacing.sm }} loading={saving} onPress={add} />
      </Card>
      {periodsQ.isLoading && !periods ? <Skeleton rows={2} /> : null}
      {periodsQ.isError && !periods ? <ErrorView error={periodsQ.error} onRetry={() => void periodsQ.refetch()} title={tr('u5.fert.err_p')} /> : null}
      {entries.length ? (
        <Card>
          <Text weight="bold">{tr('u5.fert.p_list')}</Text>
          {entries.slice().reverse().slice(0, 12).map((p) => (
            <ListRow
              key={p.id}
              icon="droplet"
              title={p.end_date ? tr('u5.fert.from_to', { from: fmt(p.start_date), to: fdate(p.end_date) }) : tr('u5.fert.since', { date: fdate(p.start_date) })}
              subtitle={p.flow ? tr('u5.fert.flow_sub', { flow: flowLabel()[p.flow] }) : undefined}
              right={
                <Row gap={0}>
                  {!p.end_date && p.start_date <= todayISO() ? <Button label={tr('u5.fert.end_today')} size="sm" variant="ghost" loading={busyId === p.id} onPress={() => endToday(p)} /> : null}
                  <IconButton icon="trash-2" label={tr('u5.fert.p_del_a11y', { date: fdate(p.start_date) })} onPress={() => remove(p)} />
                </Row>
              }
            />
          ))}
        </Card>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------- symptômes
/** Les libellés enregistrés restent en français (valeurs stockées) : seul l'affichage est traduit. */
const SYMPTOM_KEYS: Record<string, TKey> = {
  'Crampes': 'u5.fert.sym_cramps',
  'Maux de tête': 'u5.fert.sym_headache',
  'Seins sensibles': 'u5.fert.sym_breasts',
  'Ballonnements': 'u5.fert.sym_bloating',
  'Fatigue': 'u5.fert.sym_tired',
  'Humeur changeante': 'u5.fert.sym_mood',
  'Acné': 'u5.fert.sym_acne',
  'Douleur pelvienne': 'u5.fert.sym_pelvic',
  'Saignements légers': 'u5.fert.sym_spotting',
  'Nausées': 'u5.fert.sym_nausea',
  'Libido en hausse': 'u5.fert.sym_libido_up',
  'Libido en baisse': 'u5.fert.sym_libido_down',
};
const symLabel = (s: string) => { const key = SYMPTOM_KEYS[s]; return key ? tr(key) : s; };
const SYMPTOMS = ['Crampes', 'Maux de tête', 'Seins sensibles', 'Ballonnements', 'Fatigue', 'Humeur changeante', 'Acné', 'Douleur pelvienne', 'Saignements légers', 'Nausées', 'Libido en hausse', 'Libido en baisse'];

export function SymptomLogger() {
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const logsQ = useSymptomLogs(30);
  const logs = logsQ.data;
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!symptoms.length && !note.trim()) return toast(tr('u5.fert.s_choose'), 'info');
    setSaving(true);
    try {
      await insertOrQueue('symptom_logs', { user_id: userId, logged_on: todayISO(), symptoms, note: note.trim() || null });
      inv('symptom_logs');
      setSymptoms([]);
      setNote('');
      toast(tr('u5.fert.s_saved'));
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!(await confirm(tr('u5.fert.s_del'), tr('u5.fert.final'), tr('u5.fert.delete')))) return;
    try {
      await backend.remove('symptom_logs', [eq('id', id)]);
      inv('symptom_logs');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  return (
    <Card>
      <Row wrap>
        {SYMPTOMS.map((s) => <Chip key={s} label={symLabel(s)} selected={symptoms.includes(s)} onPress={() => setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))} />)}
      </Row>
      <View style={{ marginTop: spacing.sm }}><Field label={tr('u5.fert.note')} optional value={note} onChangeText={setNote} maxLength={2000} /></View>
      <Button label={tr('u5.fert.log_today')} variant="secondary" style={{ marginTop: spacing.sm }} loading={saving} onPress={save} />
      <Text variant="caption" muted style={{ marginTop: 6 }}>{tr('u5.fert.s_warn')}</Text>
      {logsQ.isLoading && !logs ? <View style={{ marginTop: spacing.sm }}><Skeleton rows={2} /></View> : null}
      {logsQ.isError && !logs ? <View style={{ marginTop: spacing.sm }}><ErrorView error={logsQ.error} onRetry={() => void logsQ.refetch()} title={tr('u5.fert.err_s')} /></View> : null}
      {(logs ?? []).slice(0, 8).map((l) => (
        <ListRow key={l.id} icon="clipboard" title={fdate(l.logged_on)} subtitle={[l.symptoms.map(symLabel).join(', '), l.note].filter(Boolean).join(' · ')} right={<IconButton icon="trash-2" label={tr('u5.fert.s_del_a11y', { date: fdate(l.logged_on) })} onPress={() => remove(l.id)} />} />
      ))}
    </Card>
  );
}

// ---------------------------------------------------------------- tests
type TestKind = 'ovulation_tests' | 'pregnancy_tests';
const testResults = (): Record<TestKind, { value: string; label: string }[]> => ({
  ovulation_tests: [{ value: 'negative', label: tr('u5.fert.t_neg') }, { value: 'positive', label: tr('u5.fert.t_pos') }, { value: 'peak', label: tr('u5.fert.t_peak') }, { value: 'invalid', label: tr('u5.fert.t_invalid') }],
  pregnancy_tests: [{ value: 'negative', label: tr('u5.fert.t_neg') }, { value: 'positive', label: tr('u5.fert.t_pos') }, { value: 'faint', label: tr('u5.fert.t_faint') }, { value: 'invalid', label: tr('u5.fert.t_invalid') }],
});
const testHelp = (): Record<TestKind, string> => ({
  ovulation_tests: tr('u5.fert.h_ovu'),
  pregnancy_tests: tr('u5.fert.h_preg'),
});

export function TestLogger({ kinds }: { kinds: TestKind[] }) {
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const [kind, setKind] = useState<TestKind>(kinds[0]);
  const [result, setResult] = useState<string | null>(null);
  const ovuQ = useTests('ovulation_tests');
  const pregQ = useTests('pregnancy_tests');
  const q = kind === 'ovulation_tests' ? ovuQ : pregQ;
  const list = q.data;
  const label = (v: string) => testResults()[kind].find((r) => r.value === v)?.label ?? v;
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!result) return toast(tr('u5.fert.t_choose'), 'info');
    setSaving(true);
    try {
      await insertOrQueue(kind, { user_id: userId, tested_at: new Date().toISOString(), result });
      inv(kind);
      setResult(null);
      toast(tr('u5.fert.t_saved'));
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!(await confirm(tr('u5.fert.t_del'), tr('u5.fert.final'), tr('u5.fert.delete')))) return;
    try {
      await backend.remove(kind, [eq('id', id)]);
      inv(kind);
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  return (
    <Card>
      {kinds.length > 1 ? (
        <Segmented label={tr('u5.fert.t_type')} value={kind} onChange={(v) => { setKind(v); setResult(null); }} options={[{ value: 'ovulation_tests', label: tr('u5.fert.t_o_ovu') }, { value: 'pregnancy_tests', label: tr('u5.fert.t_o_preg') }]} />
      ) : <Text weight="bold">{kind === 'pregnancy_tests' ? tr('u5.fert.t_preg') : tr('u5.fert.t_ovu')}</Text>}
      <Row wrap style={{ marginTop: spacing.sm }}>
        {testResults()[kind].map((r) => <Chip key={r.value} label={r.label} selected={result === r.value} onPress={() => setResult(r.value)} />)}
      </Row>
      <Text variant="caption" muted style={{ marginTop: 6 }}>{testHelp()[kind]}</Text>
      <Button label={tr('u5.fert.t_save')} variant="secondary" style={{ marginTop: spacing.sm }} loading={saving} onPress={save} />
      {q.isLoading && !list ? <View style={{ marginTop: spacing.sm }}><Skeleton rows={2} /></View> : null}
      {q.isError && !list ? <View style={{ marginTop: spacing.sm }}><ErrorView error={q.error} onRetry={() => void q.refetch()} title={tr('u5.fert.err_t')} /></View> : null}
      {(list ?? []).slice(0, 10).map((x) => (
        <ListRow
          key={x.id}
          icon="check-square"
          title={`${label(x.result)} · ${formatDate(x.tested_at, { day: 'numeric', month: 'long' })}`}
          right={<IconButton icon="trash-2" label={tr('u5.fert.t_del_a11y', { date: formatDate(x.tested_at) })} onPress={() => remove(x.id)} />}
        />
      ))}
    </Card>
  );
}

// ---------------------------------------------------------------- historique des cycles
/**
 * Historique des cycles, rendu en liste virtualisée : à placer dans un <Screen scroll={false} padded={false}>.
 * `addRoute` : écran où noter ses règles (action de l'état vide).
 */
export function CycleHistoryView({ est, addRoute, bottomPadding = 0 }: { est: CycleEstimate; addRoute: string; bottomPadding?: number }) {
  const periodsQ = usePeriods();
  const periods = periodsQ.data;
  const history = useMemo(() => cycleHistory(periods ?? []), [periods]);
  const done = history.filter((c) => !c.current && !c.unusual && c.length != null);
  const lengths = done.map((c) => c.length as number);
  const loading = periodsQ.isLoading && !periods;
  const failed = periodsQ.isError && !periods;
  const header = loading ? <Skeleton rows={4} /> : failed ? (
    <ErrorView error={periodsQ.error} onRetry={() => void periodsQ.refetch()} title={tr('u5.fert.err_h')} />
  ) : history.length ? (
    <View style={{ gap: spacing.md }}>
      {lengths.length ? (
        <Row wrap>
          <StatPill value={est.averageLength != null ? tr('u5.fert.days_short', { n: num(est.averageLength) }) : '—'} label={tr('u5.fert.avg')} />
          <StatPill value={tr('u5.fert.days_short', { n: Math.min(...lengths) })} label={tr('u5.fert.shortest')} />
          <StatPill value={tr('u5.fert.days_short', { n: Math.max(...lengths) })} label={tr('u5.fert.longest')} />
        </Row>
      ) : null}
      {lengths.length >= 2 ? (
        <Card>
          <BarChart data={done.slice(0, 8).reverse().map((c) => ({ label: fmt(c.start).replace(/ .*/, '') + '/' + c.start.slice(5, 7), value: c.length as number }))} unit={tr('u5.fert.days')} accessibilityLabel={tr('u5.fert.chart_a11y')} />
          <Text variant="caption" muted>{tr('u5.fert.chart_cap')}</Text>
        </Card>
      ) : null}
    </View>
  ) : null;
  return (
    <VirtualList
      data={loading || failed ? [] : history}
      keyExtractor={(c) => c.start}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: bottomPadding, gap: spacing.sm }}
      ListHeaderComponent={header}
      ListEmptyComponent={loading || failed ? null : (
        <EmptyState icon="rotate-ccw" title={tr('u5.fert.no_cycle')} body={tr('u5.fert.no_cycle_b')} action={{ label: tr('u5.fert.log_period'), icon: 'droplet', onPress: () => router.push(addRoute as never) }} />
      )}
      renderItem={({ item: c }) => (
        <Card style={{ paddingVertical: spacing.xs }}>
          <ListRow
            icon={c.current ? 'circle' : 'rotate-ccw'}
            title={c.current ? tr('u5.fert.cur_cycle', { date: fdate(c.start) }) : tr('u5.fert.from_to', { from: fmt(c.start), to: fdate(c.end!) })}
            subtitle={[
              c.length != null ? `${tr('u5.fert.cycle_len', { count: c.length })}${c.unusual ? ` ${tr('u5.fert.unusual')}` : ''}` : tr('u5.fert.day_n', { n: daysBetween(c.start, todayISO()) + 1 }),
              c.periodLength != null ? tr('u5.fert.period_len', { n: c.periodLength }) : null,
              c.ovulationEstimate ? tr('u5.fert.ovu_post', { date: fmt(c.ovulationEstimate) }) : null,
            ].filter(Boolean).join(' · ')}
          />
        </Card>
      )}
    />
  );
}

// ---------------------------------------------------------------- articles du parcours
export function JourneyArticles({ journey }: { journey: FertilityJourney }) {
  const q = useJourneyArticles(journey);
  const { data } = q;
  if (q.isLoading && !data.length) return <Skeleton rows={2} />;
  if (q.isError && !data.length) return <ErrorView error={q.error} onRetry={() => void q.refetch()} title={tr('u5.fert.err_a')} />;
  if (!data.length) return <EmptyState icon="book-open" title={tr('u5.fert.soon')} body={tr('u5.fert.soon_b')} action={{ label: tr('u5.fert.open_lib'), icon: 'book-open', onPress: () => router.push('/library' as never) }} />;
  return (
    <Card>
      {data.map((a) => <ListRow key={a.id} icon="book-open" title={a.title} subtitle={a.summary} onPress={() => router.push(`/article/${a.slug}` as never)} />)}
    </Card>
  );
}

// ---------------------------------------------------------------- questions pour la consultation
export function ConsultationChecklist({ journey, childId }: { journey: FertilityJourney; childId?: string | null }) {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const householdId = useHouseholdId();
  const questionsQ = useConsultationQuestions(journey, childId);
  const { data } = questionsQ;
  const add = useAddQuestions(journey, childId);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const share = useShareQuestion();
  const [text, setText] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const list = data ?? [];
  const existing = new Set(list.map((q) => q.question));
  const suggestions = QUESTION_SUGGESTIONS[journey].filter((s) => !existing.has(s));
  const nextPos = list.length ? Math.max(...list.map((q) => q.position)) + 1 : 0;

  async function addQuestions(qs: string[]) {
    const clean = qs.map((q) => q.trim()).filter(Boolean);
    if (!clean.length) return;
    try {
      await add.mutateAsync({ questions: clean, startPosition: nextPos });
      setText('');
      haptic('success');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  async function update(id: string, patch: Record<string, unknown>): Promise<boolean> {
    try {
      await backend.update('consultation_questions', patch, [eq('id', id)]);
      inv('consultation_questions');
      return true;
    } catch (err) {
      toast(friendlyError(err), 'error');
      return false;
    }
  }

  async function remove(id: string) {
    if (!(await confirm(tr('u5.fert.q_del'), tr('u5.fert.final'), tr('u5.fert.delete')))) return;
    try {
      await backend.remove('consultation_questions', [eq('id', id)]);
      inv('consultation_questions');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  async function saveAnswer(id: string) {
    setSavingAnswer(true);
    const ok = await update(id, { answer: answer.trim() || null });
    setSavingAnswer(false);
    if (!ok) return;
    setOpen(null);
    toast(tr('u5.fert.a_saved'));
  }

  return (
    <>
      <Card>
        <Field label={tr('u5.fert.q_add')} value={text} onChangeText={setText} maxLength={300} placeholder={tr('u5.fert.q_ph')} onSubmitEditing={() => addQuestions([text])} />
        <Button label={tr('u5.fert.add')} icon="plus" variant="secondary" style={{ marginTop: spacing.sm }} loading={add.isPending} onPress={() => addQuestions([text])} />
      </Card>
      {questionsQ.isLoading && !data ? <Skeleton rows={3} /> : null}
      {questionsQ.isError && !data ? <ErrorView error={questionsQ.error} onRetry={() => void questionsQ.refetch()} title={tr('u5.fert.err_q')} /> : null}
      {list.length ? (
        <Card>
          {list.map((q) => (
            <View key={q.id} style={{ paddingVertical: spacing.xs, gap: 6, borderBottomWidth: 0.5, borderColor: t.colors.border }}>
              <Row style={{ alignItems: 'flex-start' }}>
                <Tappable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: q.done }}
                  accessibilityLabel={`${q.question}${q.done ? `, ${tr('u5.fert.q_asked')}` : ''}`}
                  onPress={() => update(q.id, { done: !q.done })}
                  hitSlop={11}
                  style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, borderColor: q.done ? t.colors.success : t.colors.border, backgroundColor: q.done ? t.colors.success : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}
                >
                  {q.done ? <Icon name="check" size={16} color="#fff" /> : null}
                </Tappable>
                <Tappable style={{ flex: 1, minHeight: MIN_TOUCH, justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel={tr('u5.fert.q_answer_a11y', { question: q.question })} onPress={() => { setOpen(q.id); setAnswer(q.answer ?? ''); }}>
                  <Text style={{ textDecorationLine: q.done ? 'line-through' : 'none' }} muted={q.done}>{q.question}</Text>
                  {q.answer ? <Text variant="small" muted>{tr('u5.fert.q_answer', { answer: q.answer })}</Text> : null}
                  {q.shared ? <Text variant="caption" color={t.colors.lavender}>{tr('u5.fert.shared')}</Text> : null}
                </Tappable>
                <IconButton icon="trash-2" label={tr('u5.fert.q_del_a11y', { question: q.question })} onPress={() => remove(q.id)} />
              </Row>
            </View>
          ))}
          <Text variant="caption" muted style={{ marginTop: 6 }}>{tr('u5.fert.q_hint')}</Text>
        </Card>
      ) : null}
      {suggestions.length ? (
        <>
          <SectionTitle title={tr('u5.fert.suggest')} action={suggestions.length > 1 ? tr('u5.fert.add_all') : undefined} onAction={() => addQuestions(suggestions)} />
          <Card tone="soft">
            {suggestions.map((s) => <ListRow key={s} icon="plus-circle" title={s} onPress={() => addQuestions([s])} />)}
          </Card>
        </>
      ) : null}
      <Sheet visible={!!open} onClose={() => setOpen(null)} title={tr('u5.fert.my_q')}>
        {(() => {
          const q = list.find((x) => x.id === open);
          if (!q) return null;
          return (
            <>
              <Text weight="medium">{q.question}</Text>
              <Field label={tr('u5.fert.answer_lbl')} optional value={answer} onChangeText={setAnswer} maxLength={1000} multiline style={{ minHeight: 90, textAlignVertical: 'top' }} />
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text weight="medium">{tr('u5.fert.share')}</Text>
                  <Text variant="caption" muted>{householdId ? tr('u5.fert.share_on') : tr('u5.fert.share_off')}</Text>
                </View>
                <Toggle label={tr('u5.fert.share_toggle')} value={q.shared} onChange={async (v) => {
                  if (!householdId) return toast(tr('u5.fert.share_need'), 'info');
                  try { await share.mutateAsync({ id: q.id, shared: v }); } catch (err) { toast(friendlyError(err), 'error'); }
                }} />
              </Row>
              <Button label={tr('u5.fert.save')} loading={savingAnswer} onPress={() => saveAnswer(q.id)} />
            </>
          );
        })()}
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------- rappels du parcours
const weekdayChips = (): { d: Weekday; label: string }[] => [
  { d: 1, label: tr('u5.fert.wd1') }, { d: 2, label: tr('u5.fert.wd2') }, { d: 3, label: tr('u5.fert.wd3') }, { d: 4, label: tr('u5.fert.wd4') }, { d: 5, label: tr('u5.fert.wd5') }, { d: 6, label: tr('u5.fert.wd6') }, { d: 7, label: tr('u5.fert.wd7') },
];

function parseTime(s: string): { hour: number; minute: number } | null {
  const m = s.trim().match(/^(\d{1,2})\s*[:hH]\s*(\d{0,2})$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = m[2] ? Number(m[2]) : 0;
  return hour < 24 && minute < 60 ? { hour, minute } : null;
}

/** Planification d'un rappel proposé ; renvoie une erreur lisible si la saisie est invalide. */
export function presetSchedule(kind: ReminderPreset['kind'], v: { time: string; date: string; weekday: Weekday }): { schedule?: ReminderSchedule; error?: string } {
  const tm = parseTime(v.time);
  if (!tm) return { error: tr('u5.fert.r_e_time') };
  if (kind === 'daily') return { schedule: { type: 'daily', ...tm } };
  if (kind === 'weekly') return { schedule: { type: 'weekly', weekdays: [v.weekday], ...tm } };
  const iso = frToISO(v.date);
  if (!iso) return { error: tr('u5.fert.r_e_date') };
  const [y, mo, d] = iso.split('-').map(Number);
  const at = new Date(y, mo - 1, d, tm.hour, tm.minute);
  if (at.getTime() <= Date.now()) return { error: tr('u5.fert.r_e_future') };
  return { schedule: { type: 'once', at: at.toISOString() } };
}

export function JourneyReminders({ presets, deepLink, defaultDates }: { presets: ReminderPreset[]; deepLink: '/fertility' | '/contraception'; defaultDates?: Partial<Record<string, ISODate | null>> }) {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const remindersQ = useReminders();
  const reminders = remindersQ.data;
  const toggle = useToggleReminder();
  const del = useDeleteReminder();
  const [preset, setPreset] = useState<ReminderPreset | null>(null);
  const [time, setTime] = useState('08:00');
  const [date, setDate] = useState('');
  const [weekday, setWeekday] = useState<Weekday>(1);
  // Notifications neutres par défaut (texte détaillé seulement si la personne l'a explicitement choisi)
  const { prefs: cyclePrefs } = useCyclePreferences();
  const [discreet, setDiscreet] = useState(!cyclePrefs.detailed_notifications);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Objectif « suivre » ou « concevoir » : rappels de contraception rattachés au cycle (visibles sur son accueil)
  const objective = useObjective();
  const link = deepLink === '/contraception' && objective && objective !== 'avoid' ? '/cycle' : deepLink;
  const mine = (reminders ?? []).filter((r) => r.deep_link?.startsWith(deepLink) || (deepLink === '/contraception' && r.deep_link === '/cycle'));

  function openPreset(p: ReminderPreset) {
    setPreset(p);
    setError(null);
    setTime(p.key === 'bbt' ? '07:00' : '09:00');
    const d = defaultDates?.[p.key];
    setDate(toFrDate(d && d > todayISO() ? d : addDays(todayISO(), 1)));
  }

  async function create() {
    if (!preset) return;
    const { schedule, error: e } = presetSchedule(preset.kind, { time, date, weekday });
    setError(e ?? null);
    if (!schedule || !validateSchedule(schedule)) return;
    setSaving(true);
    try {
      await backend.insert('reminders', {
        user_id: userId, household_id: null, category: preset.category,
        title: discreet ? preset.discreetTitle : preset.title, body: null, schedule,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris', enabled: true, deep_link: link,
      });
      inv('reminders'); // la liste relue reprogramme les notifications locales
      haptic('success');
      toast(tr('u5.fert.r_created'));
      setPreset(null);
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!(await confirm(tr('u5.fert.r_del'), tr('u5.fert.r_del_b'), tr('u5.fert.delete')))) return;
    try { await del.mutateAsync(id); } catch (err) { toast(friendlyError(err), 'error'); }
  }

  async function setEnabled(id: string, enabled: boolean) {
    try { await toggle.mutateAsync({ id, enabled }); } catch (err) { toast(friendlyError(err), 'error'); }
  }

  return (
    <>
      {remindersQ.isLoading && !reminders ? <Skeleton rows={2} /> : remindersQ.isError && !reminders ? (
        <ErrorView error={remindersQ.error} onRetry={() => void remindersQ.refetch()} title={tr('u5.fert.err_r')} />
      ) : mine.length ? (
        <Card>
          {mine.map((r) => (
            <Row key={r.id} style={{ paddingVertical: spacing.xs }}>
              <View style={{ flex: 1, opacity: r.enabled ? 1 : 0.55 }}>
                <Text weight="medium">{r.title}</Text>
                <Text variant="small" muted>{validateSchedule(r.schedule) ? describeSchedule(r.schedule) : tr('u5.fert.r_fix')}</Text>
              </View>
              <Toggle label={r.enabled ? tr('u5.fert.r_off', { title: r.title }) : tr('u5.fert.r_on', { title: r.title })} value={r.enabled} onChange={(v) => void setEnabled(r.id, v)} />
              <IconButton icon="trash-2" label={tr('u5.fert.r_del_a11y', { title: r.title })} onPress={() => remove(r.id)} />
            </Row>
          ))}
        </Card>
      ) : (
        <Card tone="soft"><Text muted>{tr('u5.fert.r_none')}</Text></Card>
      )}
      <SectionTitle title={tr('u5.fert.r_create')} />
      <Card>
        {presets.map((p) => <ListRow key={p.key} icon="bell" title={p.title} subtitle={p.hint} onPress={() => openPreset(p)} />)}
      </Card>
      <Button label={tr('u5.fert.r_all')} variant="ghost" icon="settings" onPress={() => router.push('/settings/reminders' as never)} />
      <Sheet visible={!!preset} onClose={() => setPreset(null)} title={preset?.title ?? tr('u5.fert.r_one')}>
        {preset ? (
          <>
            <Text variant="small" muted>{preset.hint}</Text>
            {preset.kind === 'once' ? <Field label={tr('u5.fert.r_date')} value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" placeholder={tr('u5.fert.date_ph')} hint={defaultDates?.[preset.key] ? tr('u5.fert.r_date_hint') : undefined} /> : null}
            {preset.kind === 'weekly' ? (
              <View style={{ gap: 6 }}>
                <Text variant="label">{tr('u5.fert.r_day')}</Text>
                <Row wrap>{weekdayChips().map((w) => <Chip key={w.d} label={w.label} selected={weekday === w.d} onPress={() => setWeekday(w.d)} />)}</Row>
              </View>
            ) : null}
            <Field label={tr('u5.fert.r_time')} value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" placeholder={tr('u5.fert.time_ph')} />
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text weight="medium">{tr('u5.fert.r_discreet')}</Text>
                <Text variant="caption" muted>{tr('u5.fert.r_lock', { title: discreet ? preset.discreetTitle : preset.title })}</Text>
              </View>
              <Toggle label={tr('u5.fert.r_discreet_toggle')} value={discreet} onChange={setDiscreet} />
            </Row>
            {error ? <Text variant="small" color={t.colors.danger}>{error}</Text> : null}
            <Button label={tr('u5.fert.r_create_btn')} loading={saving} onPress={create} />
          </>
        ) : null}
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------- bandeau « privé »
export function PrivateBanner({ children }: { children: string }) {
  return <Banner tone="info" icon="lock" title={tr('u5.fert.private')}>{children}</Banner>;
}
