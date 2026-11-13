/**
 * Onglets du profil enfant : aperçu, croissance, étapes, santé, alimentation.
 * Tout est descriptif : aucune zone « normale/anormale », aucune notion de retard.
 */
import { DEV_DOMAINS } from '@/lib/domain/childCare';
import { exportTextFile } from '@/lib/exportData';
import { csvCell, safeFileName } from '@/lib/csv';
import { insertOrQueue } from '@/lib/offline';
import { ChildShortcuts } from '@/features/discoveries/ChildShortcuts';
import { TodaySummary } from '@/components/MiniApp';
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { LineChart, StatPill } from '@/components/Charts';
import { GrowthChart } from '@/components/GrowthChart';
import { ageInMonths, describePosition, sexForStandards, WHO_MAX_MONTHS, type GrowthIndicator } from '@/lib/domain/growthStandards';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, haptic, Icon, IconButton, type IconName, ListRow, Row, SectionTitle, Segmented, Text, Toggle } from '@/components/ui';
import { t as tr, formatDate, formatNumber, type TKey } from '@/i18n';

/** Date lisible dans la langue courante, à partir d'une date ISO (jour civil, sans décalage de fuseau). */
const fd = (iso: string, withYear = true) => formatDate(`${iso.slice(0, 10)}T00:00:00Z`, { day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' as const } : {}), timeZone: 'UTC' });
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { ChildToday } from '@/features/home';
import { BottleTimerCard } from '@/features/bottle';
import { KIND_META, Timeline, type LogItem, logTime } from '@/features/tracking';
import { ChildForm, childToDraft, validateChild, type ChildDraft } from '@/features/profiles';
import { backend, eq } from '@/lib/backend';
import { useInvalidate, useLogs, useMeasurements, useJourneyState, usePremium } from '@/lib/data/hooks';
import {
  errorMessage, type FoodIntroduction, type HealthItem, type HealthItemKind, type Milestone, type MilestoneKind,
  useFoodIntroductions, useFoods, useHealthItems, useMilestones,
} from '@/lib/data/hooks-family';
import { friendlyError } from '@/lib/data/hooks-settings';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { BabySleepCard } from './sleep';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { PremiumSection } from '@/components/Premium';
import type { Bottle, Breastfeed, Child, Diaper, LogKind, Meal, Measurement, Observation, Sleep } from '@/lib/types';
import { toFrDate } from '@/lib/validation';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';

// ---------------------------------------------------------------- onglets
export { CHILD_TABS, type ChildTab } from '@/lib/domain/childTabs';
import { CHILD_TABS, type ChildTab } from '@/lib/domain/childTabs';
import { Tappable } from '@/components/Tappable';
import { isBottleChild } from '@/lib/domain/bottleTimer';
import { useUiStore } from '@/lib/store';

export function ChildTabs({ value, onChange }: { value: ChildTab; onChange: (v: ChildTab) => void }) {
  const t = useTheme();
  return (
    <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} accessibilityRole="tablist" contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
      {CHILD_TABS.map((tab) => {
        const sel = tab.value === value;
        return (
          <Tappable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: sel }}
            accessibilityLabel={tab.label}
            onPress={() => { haptic('selection'); onChange(tab.value); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: MIN_TOUCH, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.2, borderColor: sel ? t.colors.primary : t.colors.border, backgroundColor: sel ? t.colors.primary : t.colors.surface }}
          >
            <Icon name={tab.icon} size={15} color={sel ? t.colors.primaryText : t.colors.textMuted} />
            <Text variant="small" weight="medium" color={sel ? t.colors.primaryText : t.colors.text}>{tab.label}</Text>
          </Tappable>
        );
      })}
    </ScrollView>
  );
}

/** Exécute une écriture : jamais d'erreur silencieuse (toast en français en cas d'échec). */
function useSafeWrite() {
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const run = async (fn: () => Promise<unknown>, success?: string): Promise<boolean> => {
    if (pending) return false;
    setPending(true);
    try {
      await fn();
      if (success) toast(success);
      return true;
    } catch (e) {
      toast(friendlyError(e), 'error');
      return false;
    } finally {
      setPending(false);
    }
  };
  return { run, pending };
}

const num = (s: string) => Number(s.replace(',', '.').trim());
const fmt = (n: number | null | undefined, digits = 1) => (n == null ? '—' : formatNumber(Number(n.toFixed(digits)), { maximumFractionDigits: 6 }));

// ---------------------------------------------------------------- Aperçu
export function OverviewTab({ child, onTab }: { child: Child; onTab: (t: ChildTab) => void }) {
  const qBottles = useLogs<Bottle>('bottle', child.id, 3);
  const qFeeds = useLogs<Breastfeed>('breastfeed', child.id, 3);
  const qDiapers = useLogs<Diaper>('diaper', child.id, 3);
  const qSleeps = useLogs<Sleep>('sleep', child.id, 3);
  const qMeals = useLogs<Meal>('meal', child.id, 3);
  const qObs = useLogs<Observation>('observation', child.id, 3);
  const logQueries = [qBottles, qFeeds, qDiapers, qSleeps, qMeals, qObs];
  const logsLoading = logQueries.some((q) => q.isLoading && !q.data);
  const logsError = logQueries.find((q) => q.isError && !q.data);
  const { data: bottles } = qBottles;
  const { data: feeds } = qFeeds;
  const { data: diapers } = qDiapers;
  const { data: sleeps } = qSleeps;
  const { data: meals } = qMeals;
  const { data: observations } = qObs;
  const { data: measurements } = useMeasurements(child.id);
  const { data: milestones } = useMilestones(child.id);
  const js = useJourneyState();

  const recent = useMemo<LogItem[]>(() => {
    const all: LogItem[] = [
      ...(bottles ?? []).map((data) => ({ type: 'bottle' as const, data })),
      ...(feeds ?? []).map((data) => ({ type: 'breastfeed' as const, data })),
      ...(diapers ?? []).map((data) => ({ type: 'diaper' as const, data })),
      ...(sleeps ?? []).map((data) => ({ type: 'sleep' as const, data })),
      ...(meals ?? []).map((data) => ({ type: 'meal' as const, data })),
      ...(observations ?? []).map((data) => ({ type: 'observation' as const, data })),
    ];
    return all.sort((a, b) => logTime(b).localeCompare(logTime(a))).slice(0, 6);
  }, [bottles, feeds, diapers, sleeps, meals, observations]);

  const last = measurements?.length ? measurements[measurements.length - 1] : null;
  const quick = (['bottle', 'breastfeed', 'diaper', 'meal', 'observation'] as LogKind[]).filter((k) => (k === 'observation' || child.enabled_tracking.includes(KIND_META[k].tracking)) && (k !== 'bottle' || isBottleChild(child.birth_date, js.childType(child.id))));

  return (
    <>
      <ChildToday child={child} compact />
      <ChildShortcuts child={child} />
      {isBottleChild(child.birth_date, js.childType(child.id)) && <BottleTimerCard child={child} />}
      {child.enabled_tracking.includes('sleep') && <BabySleepCard child={child} />}
      {/* noter en un geste : grandes tuiles plutôt que petites puces */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }} testID="child-quick">
        {[...quick.map((k) => ({ key: k, icon: KIND_META[k].icon, label: KIND_META[k].label, go: () => router.push({ pathname: '/track/[kind]', params: { kind: k, child: child.id } }) })),
          ...(child.enabled_tracking.includes('sleep') ? [{ key: 'sleep', icon: 'moon' as IconName, label: tr('u7.track.sleep'), go: () => router.push('/night') }] : [])].map((x) => (
          <QuickTile key={x.key} icon={x.icon} label={x.label} onPress={x.go} />
        ))}
      </View>
      {/* Accueil « L'alimentation de … » (tétées, tirages, biberons, réserve) : s'ajoute aux tuiles, ne les remplace pas */}
      {child.enabled_tracking.includes('breastfeed') || isBottleChild(child.birth_date, js.childType(child.id)) ? (
        <Card padded={false}>
          <ListRow icon="heart" title={tr('lac.link.home', { name: child.first_name })} subtitle={tr('lac.link.homeSub')} onPress={() => router.push({ pathname: '/feeding', params: { child: child.id } })} testID="child-feeding-home" />
        </Card>
      ) : null}

      <SectionTitle title={tr('u7.child.latestEntries')} />
      {logsLoading ? <Skeleton kind="list" rows={3} /> : logsError ? (
        <ErrorView error={logsError.error} onRetry={() => logQueries.forEach((q) => { void q.refetch(); })} title={tr('u7.child.latestError')} />
      ) : recent.length ? (
        <Card><Timeline logs={recent} childId={child.id} /></Card>
      ) : (
        <EmptyState
          icon="edit-3"
          title={tr('u7.child.nothingThree')}
          action={quick.length ? { label: tr('u7.child.logKind', { kind: KIND_META[quick[0]].label }), icon: 'plus', onPress: () => router.push({ pathname: '/track/[kind]', params: { kind: quick[0], child: child.id } }) } : undefined}
        />
      )}

      <SectionTitle title={tr('u7.child.inBrief')} />
      <Row wrap>
        <StatPill value={last ? fd(last.measured_on, false) : '—'} label={tr('u7.child.lastMeasureLabel')} />
        <StatPill value={String(milestones?.length ?? 0)} label={tr('u7.child.momentsLogged')} />
      </Row>
      <Card>
        <ListRow icon="trending-up" title={tr('u7.child.growth')} subtitle={last ? [last.weight_kg != null ? `${fmt(last.weight_kg, 3)} kg` : null, last.height_cm != null ? `${fmt(last.height_cm)} cm` : null].filter(Boolean).join(' · ') : tr('u7.child.noMeasureYet')} onPress={() => onTab('croissance')} />
        <ListRow icon="heart" title={tr('u7.child.health')} subtitle={child.allergies_declared.length ? tr('u7.child.allergiesDeclared', { list: child.allergies_declared.join(', ') }) : tr('u7.child.healthSub')} onPress={() => onTab('sante')} />
        <ListRow icon="calendar" title={tr('u7.child.appointments')} subtitle={tr('u7.child.appointmentsSub')} onPress={() => router.push('/appointments')} />
        <ListRow icon="image" title={tr('alb.title')} subtitle={tr('alb.rowSubtitle')} onPress={() => router.push(`/child/${child.id}/album`)} testID="child-album" />
      </Card>
    </>
  );
}

function QuickTile({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={tr('u7.child.logKind', { kind: label })} onPress={onPress}
      style={{ flexGrow: 1, flexBasis: '30%', minWidth: 92, alignItems: 'center', gap: 6, paddingVertical: spacing.md, borderRadius: 20, borderWidth: 1,
        borderColor: t.isDark ? 'rgba(240,217,207,0.2)' : 'rgba(184,134,90,0.28)', backgroundColor: t.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,250,246,0.7)' }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.primary }}>
        <Icon name={icon} size={18} color={t.colors.primaryText} />
      </View>
      <Text variant="caption" weight="bold" center>{label}</Text>
    </Tappable>
  );
}

// ---------------------------------------------------------------- Croissance
type Metric = 'weight_kg' | 'height_cm' | 'head_cm';
const WHO_IND: Record<Metric, GrowthIndicator> = { weight_kg: 'weight', height_cm: 'length', head_cm: 'head' };
const METRICS: { key: Metric; unit: string; min: number; max: number; digits: number }[] = [
  { key: 'weight_kg', unit: 'kg', min: 0.3, max: 80, digits: 3 },
  { key: 'height_cm', unit: 'cm', min: 20, max: 180, digits: 1 },
  { key: 'head_cm', unit: 'cm', min: 20, max: 65, digits: 1 },
];
const metricLabel = (k: Metric) => tr(`u7.child.metric.${k}` as TKey);

export function GrowthTab({ child }: { child: Child }) {
  const toast = useToast();
  const inv = useInvalidate();
  const write = useSafeWrite();
  const measurementsQ = useMeasurements(child.id);
  const { data: measurements } = measurementsQ;
  const growthAccess = usePremiumAccess('growth_export', child.first_name);
  async function exportGrowth() {
    if (!growthAccess.require(<Text variant="small">{tr('u7.child.exportPreview', { count: (measurements ?? []).length, name: child.first_name })}</Text>)) return;
    const cell = csvCell;
    const rows = [...(measurements ?? [])].sort((a, b) => a.measured_on.localeCompare(b.measured_on));
    const csv = `\uFEFF${tr('u7.child.csvTitle', { name: child.first_name })}\r\n` + [[tr('u7.child.csv.date'), tr('u7.child.csv.weight'), tr('u7.child.csv.height'), tr('u7.child.csv.head'), tr('u7.child.csv.source'), tr('u7.child.csv.note')].map(cell).join(';'),
      ...rows.map((m) => [fd(m.measured_on), m.weight_kg != null ? String(m.weight_kg).replace('.', ',') : '', m.height_cm != null ? String(m.height_cm).replace('.', ',') : '', m.head_cm != null ? String(m.head_cm).replace('.', ',') : '', m.source === 'professional' ? tr('u7.child.professional') : tr('u7.child.home'), m.note ?? ''].map(cell).join(';'))].join('\r\n');
    const r = await exportTextFile(csv, `mesures-${safeFileName(child.first_name)}.csv`, 'text/csv', 'public.comma-separated-values-text', tr('u7.child.exportMeasures'));
    toast(r === 'text' ? tr('u7.child.exportFail') : tr('u7.child.exported'), r === 'text' ? 'error' : 'success');
  }
  const [metric, setMetric] = useState<Metric>('weight_kg');
  const [date, setDate] = useState(toFrDate(todayISO()));
  const [values, setValues] = useState<Record<Metric, string>>({ weight_kg: '', height_cm: '', head_cm: '' });
  const [source, setSource] = useState<'home' | 'professional'>('professional');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const m = METRICS.find((x) => x.key === metric)!;
  const [whoOn, setWhoOn] = useState(true);
  const whoSex = sexForStandards(child.sex);
  const agePoints = (measurements ?? [])
    .filter((x) => x[metric] != null)
    .map((x) => ({ m: ageInMonths(child.birth_date, x.measured_on), y: Number(x[metric]), label: fd(x.measured_on, false) }))
    .filter((p) => p.m >= 0 && p.m <= WHO_MAX_MONTHS);
  const tooOld = (measurements ?? []).some((x) => x[metric] != null && ageInMonths(child.birth_date, x.measured_on) > WHO_MAX_MONTHS);
  const lastAge = agePoints.slice().sort((a, b) => a.m - b.m).at(-1);
  const position = whoSex && lastAge ? describePosition(WHO_IND[metric], whoSex, lastAge.m, lastAge.y) : null;
  const points = (measurements ?? [])
    .filter((x) => x[metric] != null)
    .map((x) => ({ x: new Date(x.measured_on).getTime(), y: Number(x[metric]), label: fd(x.measured_on, false) }));

  // Dernière valeur connue de chaque mesure (saisies de la famille) : affichée en tuiles et reprise d'un geste dans le formulaire
  const sortedM = [...(measurements ?? [])].sort((a, b) => b.measured_on.localeCompare(a.measured_on));
  const lastOf = (k: Metric) => sortedM.find((x) => x[k] != null);
  function prefillLast() {
    setValues({
      weight_kg: lastOf('weight_kg') ? String(lastOf('weight_kg')!.weight_kg).replace('.', ',') : '',
      height_cm: lastOf('height_cm') ? String(lastOf('height_cm')!.height_cm).replace('.', ',') : '',
      head_cm: lastOf('head_cm') ? String(lastOf('head_cm')!.head_cm).replace('.', ',') : '',
    });
    haptic('light');
  }

  async function add() {
    const e: Record<string, string> = {};
    const iso = frToISO(date);
    if (!iso) e.date = tr('u7.contra.rem.formatErr');
    else if (iso > todayISO()) e.date = tr('u7.child.err.future');
    else if (iso < child.birth_date) e.date = tr('u7.child.err.beforeBirth');
    const row: Record<string, number | null> = {};
    for (const x of METRICS) {
      const raw = values[x.key].trim();
      if (!raw) { row[x.key] = null; continue; }
      const v = num(raw);
      if (!Number.isFinite(v) || v < x.min || v > x.max) e[x.key] = tr('u7.child.err.range', { min: formatNumber(x.min, { maximumFractionDigits: 6 }), max: x.max, unit: x.unit });
      else row[x.key] = v;
    }
    if (!e.weight_kg && !e.height_cm && !e.head_cm && METRICS.every((x) => row[x.key] == null)) e.form = tr('u7.child.err.atLeastOne');
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await insertOrQueue('child_measurements', { child_id: child.id, household_id: child.household_id, measured_on: iso, ...row, source, note: note.trim() || null });
      inv('child_measurements');
      setValues({ weight_kg: '', height_cm: '', head_cm: '' });
      setNote('');
      haptic('success');
      toast(tr('u7.child.measureSaved'));
    } catch (err) {
      setErrors({ form: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function remove(x: Measurement) {
    if (!(await confirm(tr('u7.child.delMeasureAsk'), tr('u7.child.delHousehold'), tr('u7.child.delete')))) return;
    await write.run(async () => {
      await backend.remove('child_measurements', [eq('id', x.id)]);
      inv('child_measurements');
    }, tr('u7.child.measureDeleted'));
  }

  return (
    <>
      <TodaySummary title={tr('u7.child.latestMeasures')} testID="growth-last" items={[
        { icon: 'trending-up', value: lastOf('weight_kg') ? `${fmt(lastOf('weight_kg')!.weight_kg!, 3)} kg` : '—', label: lastOf('weight_kg') ? tr('u7.child.weightOn', { date: fd(lastOf('weight_kg')!.measured_on, false) }) : metricLabel('weight_kg') },
        { icon: 'maximize-2', value: lastOf('height_cm') ? `${fmt(lastOf('height_cm')!.height_cm!)} cm` : '—', label: lastOf('height_cm') ? tr('u7.child.heightOn', { date: fd(lastOf('height_cm')!.measured_on, false) }) : metricLabel('height_cm') },
        { icon: 'circle', value: lastOf('head_cm') ? `${fmt(lastOf('head_cm')!.head_cm!)} cm` : '—', label: tr('u7.child.headShort') },
      ]} />
      <Segmented label={tr('u7.child.displayedMeasure')} value={metric} onChange={setMetric} options={METRICS.map((x) => ({ value: x.key, label: x.key === 'head_cm' ? tr('u7.child.headShort') : metricLabel(x.key) }))} />
      {whoOn && whoSex && agePoints.length >= 1 ? (
        <Card>
          <Text weight="bold">{tr('u7.child.whoRef', { label: metricLabel(metric), unit: m.unit })}</Text>
          <GrowthChart indicator={WHO_IND[metric]} sex={whoSex} points={agePoints} unit={m.unit} accessibilityLabel={tr('u7.child.whoA11y', { label: metricLabel(metric), name: child.first_name })} />
          {position ? <Text variant="small" style={{ marginTop: spacing.xs }}>{tr('u7.child.lastMeasureText', { text: `${position.text.charAt(0).toLowerCase()}${position.text.slice(1)}` })}</Text> : null}
        </Card>
      ) : points.length >= 2 ? (
        <Card>
          <Text weight="bold">{metricLabel(metric)} ({m.unit})</Text>
          <LineChart points={points} unit={m.unit} accessibilityLabel={tr('u7.child.chartA11y', { label: metricLabel(metric).toLowerCase(), name: child.first_name })} formatX={(x) => formatDate(x, { month: 'short', year: '2-digit' })} />
        </Card>
      ) : (
        <Card tone="soft"><Text muted>{points.length === 1 ? tr('u7.child.addSecond') : tr('u7.child.addTwo')}</Text></Card>
      )}
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="small" weight="medium" style={{ flex: 1 }}>{tr('u7.child.showWho')}</Text>
        <Toggle value={whoOn} onChange={setWhoOn} label={tr('u7.child.showWhoA11y')} />
      </Row>
      {whoOn && !whoSex ? <Text variant="caption" muted>{tr('u7.child.whoSex')}</Text> : null}
      {whoOn && whoSex && tooOld ? <Text variant="caption" muted>{tr('u7.child.whoOld')}</Text> : null}
      <Text variant="caption" muted>{whoOn
        ? tr('u7.child.whoSource')
        : tr('u7.child.noWhoNote')}</Text>

      <SectionTitle title={tr('u7.child.addMeasure')} />
      <Card>
        <View style={{ gap: spacing.sm }}>
          {errors.form ? <Banner tone="danger">{errors.form}</Banner> : null}
          <Field label={tr('u7.child.date')} value={date} onChangeText={setDate} placeholder={tr('u7.contra.rem.datePh')} keyboardType="numbers-and-punctuation" error={errors.date} />
          {sortedM.length ? <Chip icon="copy" label={tr('u7.child.prefill')} onPress={prefillLast} testID="growth-prefill" /> : null}
          <Row style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}><Field label={tr('u7.child.metric.weight_kg')} optional value={values.weight_kg} onChangeText={(v) => setValues({ ...values, weight_kg: v })} keyboardType="decimal-pad" suffix="kg" error={errors.weight_kg} /></View>
            <View style={{ flex: 1 }}><Field label={tr('u7.child.metric.height_cm')} optional value={values.height_cm} onChangeText={(v) => setValues({ ...values, height_cm: v })} keyboardType="decimal-pad" suffix="cm" error={errors.height_cm} /></View>
          </Row>
          <Field label={tr('u7.child.metric.head_cm')} optional value={values.head_cm} onChangeText={(v) => setValues({ ...values, head_cm: v })} keyboardType="decimal-pad" suffix="cm" error={errors.head_cm} />
          <Segmented label={tr('u7.child.measureTaken')} value={source} onChange={setSource} options={[{ value: 'professional', label: tr('u7.child.byPro') }, { value: 'home', label: tr('u7.child.atHome') }]} />
          <Field label={tr('u7.child.note')} optional value={note} onChangeText={setNote} maxLength={1000} />
          <Button label={tr('u7.child.saveMeasure')} loading={saving} onPress={add} />
        </View>
      </Card>

      <SectionTitle title={tr('u7.child.history')} action={measurements?.length ? tr('u7.child.exportCsv') : undefined} onAction={() => void exportGrowth()} />
      {measurementsQ.isLoading && !measurements ? <Skeleton kind="list" rows={2} /> : measurementsQ.isError && !measurements ? (
        <ErrorView error={measurementsQ.error} onRetry={() => void measurementsQ.refetch()} title={tr('u7.child.measuresError')} />
      ) : <Card>
        {(measurements ?? []).slice().reverse().map((x) => (
          <ListRow
            key={x.id}
            title={[x.weight_kg != null ? `${fmt(x.weight_kg, 3)} kg` : null, x.height_cm != null ? `${fmt(x.height_cm)} cm` : null, x.head_cm != null ? tr('u7.child.hc', { v: fmt(x.head_cm) }) : null].filter(Boolean).join(' · ')}
            subtitle={[fd(x.measured_on), x.source === 'professional' ? tr('u7.child.pro') : tr('u7.child.homeLower'), x.note].filter(Boolean).join(' · ')}
            right={<IconButton icon="trash-2" label={tr('u7.child.delMeasureOn', { date: fd(x.measured_on) })} size={18} onPress={() => remove(x)} />}
          />
        ))}
        {!measurements?.length && <Text muted>{tr('u7.child.noMeasures')}</Text>}
      </Card>}
    </>
  );
}

// ---------------------------------------------------------------- Étapes
const milestoneKinds = (): { value: MilestoneKind; label: string; icon: IconName }[] => [
  { value: 'milestone', label: tr('u7.child.mk.milestone'), icon: 'star' },
  { value: 'memory', label: tr('u7.child.mk.memory'), icon: 'camera' },
  { value: 'tooth', label: tr('u7.child.mk.tooth'), icon: 'smile' },
  { value: 'learning', label: tr('u7.child.mk.learning'), icon: 'compass' },
  { value: 'habit', label: tr('u7.child.mk.habit'), icon: 'repeat' },
];
const MILESTONE_IDEAS = ['smile', 'laugh', 'rolled', 'sit', 'steps', 'word', 'tooth', 'table'] as const;
/** Repère interne pour les moments sans date (jamais affiché tel quel). */
const NO_DATE = '__none__';

function groupByYear(list: Milestone[]): [string, Milestone[]][] {
  const map = new Map<string, Milestone[]>();
  for (const m of list) {
    const y = m.happened_on ? m.happened_on.slice(0, 4) : NO_DATE;
    map.set(y, [...(map.get(y) ?? []), m]);
  }
  return [...map.entries()].sort((a, b) => (a[0] === NO_DATE ? 1 : b[0] === NO_DATE ? -1 : b[0].localeCompare(a[0])));
}

export function MilestonesTab({ child }: { child: Child }) {
  const toast = useToast();
  const inv = useInvalidate();
  const write = useSafeWrite();
  const milestonesQ = useMilestones(child.id);
  const { data: milestones } = milestonesQ;
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<MilestoneKind>('milestone');
  const [domain, setDomain] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(toFrDate(todayISO()));
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function start(idea?: (typeof MILESTONE_IDEAS)[number]) {
    setTitle(idea ? tr(`u7.child.idea.${idea}` as TKey) : '');
    setKind(idea === 'tooth' ? 'tooth' : 'milestone');
    setDate(toFrDate(todayISO()));
    setNote('');
    setDomain(null);
    setErrors({});
    setOpen(true);
  }

  async function save() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = tr('u7.child.err.title');
    let iso: string | null = null;
    if (date.trim()) {
      iso = frToISO(date);
      if (!iso) e.date = tr('u7.contra.rem.formatErr');
      else if (iso > todayISO()) e.date = tr('u7.child.err.future');
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await insertOrQueue('child_milestones', { child_id: child.id, household_id: child.household_id, kind, title: title.trim(), happened_on: iso, note: note.trim() || null, domain });
      inv('child_milestones');
      haptic('success');
      toast(tr('u7.child.momentAdded'));
      setOpen(false);
    } catch (err) {
      setErrors({ form: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function remove(x: Milestone) {
    if (!(await confirm(tr('u7.child.delMomentAsk'), tr('u7.child.willBeDeleted', { title: x.title }), tr('u7.child.delete')))) return;
    await write.run(async () => {
      await backend.remove('child_milestones', [eq('id', x.id)]);
      inv('child_milestones');
    }, tr('u7.child.momentDeleted'));
  }

  const meta = (k: MilestoneKind) => milestoneKinds().find((x) => x.value === k) ?? milestoneKinds()[0];

  return (
    <>
      <Card tone="lavender">
        <Text>{tr('u7.child.journalIntro', { name: child.first_name })}</Text>
      </Card>
      <Button label={tr('u7.child.logMoment')} icon="plus" onPress={() => start()} />
      <Row wrap>
        {MILESTONE_IDEAS.map((idea) => <Chip key={idea} label={tr(`u7.child.idea.${idea}` as TKey)} tone="lavender" onPress={() => start(idea)} />)}
      </Row>

      <SectionTitle title={tr('u7.child.momentsTitle')} />
      {milestonesQ.isLoading && !milestones ? <Skeleton kind="list" rows={2} /> : milestonesQ.isError && !milestones ? (
        <ErrorView error={milestonesQ.error} onRetry={() => void milestonesQ.refetch()} title={tr('u7.child.momentsError')} />
      ) : !milestones?.length ? (
        <EmptyState icon="star" title={tr('u7.child.noMoments')} action={{ label: tr('u7.child.logMoment'), onPress: () => start() }} />
      ) : (
        <>
          <Field label={tr('u7.child.searchMemory')} optional value={search} onChangeText={setSearch} placeholder={tr('u7.child.searchPh')} />
          <Row wrap>
            <Chip label={tr('u7.child.all')} selected={!filter} onPress={() => setFilter(null)} />
            {DEV_DOMAINS.filter((d) => milestones.some((m) => m.domain === d.value)).map((d) => <Chip key={d.value} label={d.label} selected={filter === d.value} onPress={() => setFilter(filter === d.value ? null : d.value)} />)}
          </Row>
          {/* Frise : regroupée par année */}
          {groupByYear(milestones.filter((m) => (!filter || m.domain === filter) && (!search.trim() || `${m.title} ${m.note ?? ''}`.toLowerCase().includes(search.trim().toLowerCase())))).map(([year, list]) => (
            <View key={year} style={{ gap: spacing.xs }}>
              <Text weight="bold">{year === NO_DATE ? tr('u7.child.noDate') : year}</Text>
              <Card>
                {list.map((x) => (
                  <ListRow
                    key={x.id}
                    icon={meta(x.kind).icon}
                    title={x.title}
                    subtitle={[meta(x.kind).label, x.domain ? DEV_DOMAINS.find((d) => d.value === x.domain)?.label : null, x.happened_on ? fd(x.happened_on) : null, x.note].filter(Boolean).join(' · ')}
                    right={<IconButton icon="trash-2" label={tr('u7.child.deleteX', { name: x.title })} size={18} onPress={() => remove(x)} />}
                  />
                ))}
              </Card>
            </View>
          ))}
          <Text variant="caption" muted>{tr('u7.child.milestonesNote')}</Text>
        </>
      )}

      <Sheet visible={open} onClose={() => setOpen(false)} title={tr('u7.child.logMoment')}>
        {errors.form ? <Banner tone="danger">{errors.form}</Banner> : null}
        <View style={{ gap: spacing.xs }}>
          <Text variant="label">{tr('u7.child.type')}</Text>
          <Row wrap>{milestoneKinds().map((k) => <Chip key={k.value} icon={k.icon} label={k.label} selected={kind === k.value} onPress={() => setKind(k.value)} />)}</Row>
        </View>
        <View style={{ gap: spacing.xs }}>
          <Text variant="label">{tr('u7.child.domain')}</Text>
          <Row wrap>{DEV_DOMAINS.map((d) => <Chip key={d.value} label={d.label} selected={domain === d.value} onPress={() => setDomain(domain === d.value ? null : d.value)} />)}</Row>
        </View>
        <Field label={tr('u7.child.titleField')} value={title} onChangeText={setTitle} maxLength={120} error={errors.title} placeholder={tr('u7.child.firstSmilePh')} />
        <Field label={tr('u7.child.dateOpt')} optional value={date} onChangeText={setDate} placeholder={tr('u7.contra.rem.datePh')} keyboardType="numbers-and-punctuation" error={errors.date} />
        <Field label={tr('u7.child.noteMemory')} optional value={note} onChangeText={setNote} multiline maxLength={4000} />
        <Button label={tr('u7.child.save')} loading={saving} onPress={save} />
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------- Santé
const healthKinds = (): { value: HealthItemKind; label: string; icon: IconName; hint: string }[] => [
  { value: 'vaccine_to_check', label: tr('u7.child.hk.vaccine_to_check'), icon: 'shield', hint: tr('u7.child.hk.vaccine_to_check.hint') },
  { value: 'allergy', label: tr('u7.child.hk.allergy'), icon: 'alert-circle', hint: tr('u7.child.hk.allergy.hint') },
  { value: 'treatment', label: tr('u7.child.hk.treatment'), icon: 'package', hint: tr('u7.child.hk.treatment.hint') },
  { value: 'contact', label: tr('u7.child.hk.contact'), icon: 'phone', hint: tr('u7.child.hk.contact.hint') },
];

export function HealthTab({ child }: { child: Child }) {
  const simple = useUiStore((st) => st.simpleMode);
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const write = useSafeWrite();
  const itemsQ = useHealthItems(child.id);
  const { data: items } = itemsQ;
  const [adding, setAdding] = useState<HealthItemKind | null>(null);
  const [label, setLabel] = useState('');
  const [details, setDetails] = useState('');
  const [due, setDue] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function start(kind: HealthItemKind) {
    setAdding(kind);
    setLabel('');
    setDetails('');
    setDue('');
    setErrors({});
  }

  async function save() {
    if (!adding) return;
    const e: Record<string, string> = {};
    if (!label.trim()) e.label = tr('u7.child.err.labelReq');
    let dueIso: string | null = null;
    if (due.trim()) {
      dueIso = frToISO(due);
      if (!dueIso) e.due = tr('u7.contra.rem.formatErr');
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await insertOrQueue('child_health_items', { child_id: child.id, household_id: child.household_id, kind: adding, label: label.trim(), details: details.trim() || null, due_on: dueIso, done_on: null });
      inv('child_health_items');
      toast(tr('u7.child.added'));
      setAdding(null);
    } catch (err) {
      setErrors({ form: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function toggleDone(x: HealthItem) {
    await write.run(async () => {
      await backend.update('child_health_items', { done_on: x.done_on ? null : todayISO() }, [eq('id', x.id)]);
      inv('child_health_items');
    });
  }

  async function remove(x: HealthItem) {
    if (!(await confirm(tr('u7.child.delItemAsk'), tr('u7.child.willBeDeleted', { title: x.label }), tr('u7.child.delete')))) return;
    await write.run(async () => {
      await backend.remove('child_health_items', [eq('id', x.id)]);
      inv('child_health_items');
    }, tr('u7.child.itemDeleted'));
  }

  const meta = healthKinds().find((k) => k.value === adding);

  return (
    <>
      <Banner tone="info">{tr('u7.child.healthBanner')}</Banner>
      <Card>
        <ListRow icon="shield" title={tr('u7.child.vaccDone')} subtitle={tr('u7.child.vaccDoneSub')} onPress={() => router.push(`/child/${child.id}/vaccines` as never)} />
        <ListRow icon="activity" title={tr('u7.child.healthTracking')} subtitle={tr('u7.child.healthTrackingSub')} onPress={() => router.push(`/child/${child.id}/health-tracking` as never)} />
        <ListRow icon="smile" title={tr('u7.child.mood')} subtitle={tr('u7.child.moodSub')} onPress={() => router.push(`/child/${child.id}/wellbeing` as never)} />
        {simple ? null : <ListRow icon="book-open" title={tr('u7.child.journal')} subtitle={tr('u7.child.journalSub')} onPress={() => router.push('/journal')} />}
      </Card>
      {child.allergies_declared.length > 0 && (
        <Card tone="gold">
          <Row><Icon name="alert-circle" size={18} /><Text weight="bold" style={{ flex: 1 }}>{tr('u7.child.allergiesProfile')}</Text></Row>
          <Text style={{ marginTop: 4 }}>{child.allergies_declared.join(', ')}</Text>
        </Card>
      )}
      {itemsQ.isLoading && !items ? <Skeleton kind="list" rows={3} /> : itemsQ.isError && !items ? (
        <ErrorView error={itemsQ.error} onRetry={() => void itemsQ.refetch()} title={tr('u7.child.healthDisplayError')} />
      ) : healthKinds().map((k) => {
        const list = (items ?? []).filter((x) => x.kind === k.value);
        return (
          <View key={k.value} style={{ gap: spacing.xs }}>
            <SectionTitle title={k.label} action={tr('u7.child.add')} onAction={() => start(k.value)} />
            <Card>
              {list.map((x) => (
                <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  {k.value === 'vaccine_to_check' && (
                    <Tappable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: !!x.done_on }}
                      accessibilityLabel={tr(x.done_on ? 'u7.child.checked' : 'u7.child.toCheck', { label: x.label })}
                      disabled={write.pending}
                      onPress={() => { haptic('selection'); void toggleDone(x); }}
                      hitSlop={6}
                      style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Icon name={x.done_on ? 'check-square' : 'square'} color={x.done_on ? t.colors.success : t.colors.textMuted} />
                    </Tappable>
                  )}
                  <View style={{ flex: 1 }}>
                    <ListRow
                      title={x.label}
                      subtitle={[x.details, x.due_on ? tr('u7.child.checkAround', { date: fd(x.due_on) }) : null, x.done_on ? tr('u7.child.checkedOn', { date: fd(x.done_on) }) : null].filter(Boolean).join(' · ') || undefined}
                      right={<IconButton icon="trash-2" label={tr('u7.child.deleteX', { name: x.label })} size={18} onPress={() => remove(x)} />}
                    />
                  </View>
                </View>
              ))}
              {!list.length && <Text variant="small" muted>{k.hint}</Text>}
            </Card>
          </View>
        );
      })}
      <Banner tone="danger" title={tr('u7.child.emergencyTitle')}>{tr('u7.child.emergencyBody')}</Banner>

      <Sheet visible={!!adding} onClose={() => setAdding(null)} title={meta?.label ?? tr('u7.child.add')}>
        {errors.form ? <Banner tone="danger">{errors.form}</Banner> : null}
        {meta ? <Text variant="small" muted>{meta.hint}</Text> : null}
        <Field label={adding === 'contact' ? tr('u7.child.nameOrRole') : tr('u7.child.label')} value={label} onChangeText={setLabel} maxLength={160} error={errors.label} placeholder={adding === 'contact' ? tr('u7.child.paediatrician') : adding === 'vaccine_to_check' ? tr('u7.child.vaccPh') : undefined} />
        <Field label={adding === 'contact' ? tr('u7.child.phoneAddress') : tr('u7.child.details')} optional value={details} onChangeText={setDetails} multiline maxLength={2000} />
        {adding === 'vaccine_to_check' && <Field label={tr('u7.child.checkAroundField')} optional value={due} onChangeText={setDue} placeholder={tr('u7.contra.rem.datePh')} keyboardType="numbers-and-punctuation" error={errors.due} />}
        <Button label={tr('u7.child.add')} loading={saving} onPress={save} />
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------- Alimentation (diversification)
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/** Onglet « alimentation » : le carnet complet est dans « Ses découvertes » (mêmes données, rien n'est perdu). */
export function FoodsTab({ child }: { child: Child }) {
  return (
    <>
      <ChildShortcuts child={child} />
      <Button label={tr('u7.child.openDiscoveries')} icon="feather" onPress={() => router.push(`/child/${child.id}/discoveries` as never)} testID="foods-open-discoveries" />
      <Banner tone="danger" title={tr('u7.child.reactionTitle')}>{tr('u7.track.reactionBody')}</Banner>
    </>
  );
}

/** Ancien formulaire simple (conservé pour la lecture hors ligne) : le carnet complet est « Ses découvertes ». */
export function FoodsTracker({ child, readOnly }: { child: Child; readOnly?: boolean }) {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const write = useSafeWrite();
  const introsQ = useFoodIntroductions(child.id);
  const { data: intros } = introsQ;
  const { data: foods } = useFoods();
  const [name, setName] = useState('');
  const [date, setDate] = useState(toFrDate(todayISO()));
  const [reaction, setReaction] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<FoodIntroduction | null>(null);
  const [editNote, setEditNote] = useState('');

  const tried = new Set((intros ?? []).map((i) => norm(i.food_name)));
  const catalog = new Map((foods ?? []).map((f) => [norm(f.name), f]));
  const isAllergen = (food: string) => !!catalog.get(norm(food))?.is_major_allergen;
  const suggestions = (foods ?? []).filter((f) => !tried.has(norm(f.name)) && (!name.trim() || norm(f.name).includes(norm(name)))).slice(0, 10);
  const pendingAllergen = name.trim() && isAllergen(name);

  async function add() {
    const e: Record<string, string> = {};
    const food = name.trim();
    if (!food) e.name = tr('u7.child.err.food');
    else if (tried.has(norm(food))) e.name = tr('u7.child.err.foodDup');
    const iso = frToISO(date);
    if (!iso) e.date = tr('u7.contra.rem.formatErr');
    else if (iso > todayISO()) e.date = tr('u7.child.err.future');
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await insertOrQueue('food_introductions', { child_id: child.id, household_id: child.household_id, food_name: food, first_tried_on: iso, reaction_note: reaction.trim() || null });
      inv('food_introductions');
      setName('');
      setReaction('');
      haptic('success');
      toast(tr('u7.child.foodAdded', { food }));
    } catch (err) {
      setErrors({ form: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function saveNote() {
    if (!editing) return;
    const id = editing.id;
    const ok = await write.run(async () => {
      await backend.update('food_introductions', { reaction_note: editNote.trim() || null }, [eq('id', id)]);
      inv('food_introductions');
    }, tr('u7.child.noteSaved'));
    if (ok) setEditing(null);
  }

  async function remove() {
    if (!editing) return;
    const { id, food_name } = editing;
    if (!(await confirm(tr('u7.child.removeFoodAsk'), tr('u7.child.removeFoodBody', { food: food_name }), tr('u7.child.remove')))) return;
    const ok = await write.run(async () => {
      await backend.remove('food_introductions', [eq('id', id)]);
      inv('food_introductions');
    }, tr('u7.child.foodRemoved'));
    if (ok) setEditing(null);
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Banner tone="info" title={tr('u7.child.allergens')}>{tr('u7.child.allergensBody')}</Banner>
      <Row wrap>
        <StatPill value={String(intros?.length ?? 0)} label={tr('u7.child.foodsDiscovered')} />
        <StatPill value={String((intros ?? []).filter((i) => isAllergen(i.food_name)).length)} label={tr('u7.child.majorAllergens')} />
      </Row>

      {readOnly ? <Banner tone="info">{tr('u7.child.readOnlyFoods')}</Banner> : null}
      {readOnly ? null : <SectionTitle title={tr('u7.child.newFood')} />}
      {readOnly ? null : <Card>
        <View style={{ gap: spacing.sm }}>
          {errors.form ? <Banner tone="danger">{errors.form}</Banner> : null}
          <Field label={tr('u7.child.food')} value={name} onChangeText={setName} maxLength={60} error={errors.name} placeholder={tr('u7.child.foodPh')} />
          {suggestions.length > 0 && (
            <Row wrap>
              {suggestions.map((f) => <Chip key={f.id} label={f.name} icon={f.is_major_allergen ? 'alert-circle' : undefined} selected={norm(name) === norm(f.name)} onPress={() => setName(f.name)} />)}
            </Row>
          )}
          {pendingAllergen ? <Banner tone="warning">{tr('u7.child.majorAllergenWarn')}</Banner> : null}
          <Field label={tr('u7.child.firstTimeOn')} value={date} onChangeText={setDate} placeholder={tr('u7.contra.rem.datePh')} keyboardType="numbers-and-punctuation" error={errors.date} />
          <Field label={tr('u7.child.reaction')} optional value={reaction} onChangeText={setReaction} multiline maxLength={1000} hint={tr('u7.child.reactionHint')} />
          <Button label={tr('u7.child.add')} icon="plus" loading={saving} onPress={add} />
        </View>
      </Card>}

      <SectionTitle title={tr('u7.child.foodsDiscoveredTitle')} />
      {introsQ.isLoading && !intros ? <Skeleton kind="list" rows={2} /> : introsQ.isError && !intros ? (
        <ErrorView error={introsQ.error} onRetry={() => void introsQ.refetch()} title={tr('u7.child.foodsError')} />
      ) : <Card>
        {(intros ?? []).map((i) => (
          <ListRow
            key={i.id}
            icon={isAllergen(i.food_name) ? 'alert-circle' : 'feather'}
            title={i.food_name}
            subtitle={[tr('u7.child.firstTimeDate', { date: fd(i.first_tried_on) }), isAllergen(i.food_name) ? tr('u7.child.majorAllergenLower') : null, i.reaction_note].filter(Boolean).join(' · ')}
            onPress={() => { setEditing(i); setEditNote(i.reaction_note ?? ''); }}
          />
        ))}
        {!intros?.length && <Text muted>{tr('u7.child.foodsAlsoHere')}</Text>}
      </Card>}

      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing?.food_name ?? ''}>
        {editing ? <Text muted>{tr('u7.child.firstTimeDate', { date: fd(editing.first_tried_on) })}</Text> : null}
        {editing && isAllergen(editing.food_name) ? <Text variant="small" color={t.colors.textMuted}>{tr('u7.child.majorAllergenTalk')}</Text> : null}
        <Field label={tr('u7.child.reaction')} optional value={editNote} onChangeText={setEditNote} multiline maxLength={1000} />
        <Button label={tr('u7.child.save')} loading={write.pending} onPress={saveNote} />
        <Button label={tr('u7.child.removeFromList')} variant="ghost" icon="trash-2" disabled={write.pending} onPress={remove} />
      </Sheet>
    </View>
  );
}

// ---------------------------------------------------------------- Modifier le profil
export function EditChildSheet({ child, visible, onClose }: { child: Child; visible: boolean; onClose: () => void }) {
  const toast = useToast();
  const inv = useInvalidate();
  const [draft, setDraft] = useState<ChildDraft>(() => childToDraft(child));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const v = validateChild(draft);
    setErrors(v.errors);
    if (!v.birth || Object.keys(v.errors).length) return;
    setSaving(true);
    setError(null);
    try {
      await backend.update('children', {
        first_name: draft.first_name.trim(), birth_date: v.birth, sex: draft.sex, enabled_tracking: draft.tracking,
        allergies_declared: draft.allergies.split(',').map((a) => a.trim()).filter(Boolean),
      }, [eq('id', child.id)]);
      inv('children');
      haptic('success');
      toast(tr('u7.child.profileUpdated'));
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={tr('u7.child.editProfile', { name: child.first_name })}>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <ChildForm value={draft} onChange={setDraft} errors={errors} />
      <Button label={tr('u7.child.save')} loading={saving} onPress={save} />
    </Sheet>
  );
}
