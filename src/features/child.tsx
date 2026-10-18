/**
 * Onglets du profil enfant : aperçu, croissance, étapes, santé, alimentation.
 * Tout est descriptif : aucune zone « normale/anormale », aucune notion de retard.
 */
import { insertOrQueue } from '@/lib/offline';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { LineChart, StatPill } from '@/components/Charts';
import { PremiumGate } from '@/components/Family';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, haptic, Icon, IconButton, type IconName, ListRow, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { ChildToday } from '@/features/home';
import { BottleTimerCard } from '@/features/bottle';
import { KIND_META, Timeline, type LogItem, logTime } from '@/features/tracking';
import { ChildForm, childToDraft, validateChild, type ChildDraft } from '@/features/profiles';
import { backend, eq } from '@/lib/backend';
import { useInvalidate, useLogs, useMeasurements } from '@/lib/data/hooks';
import {
  errorMessage, type FoodIntroduction, type HealthItem, type HealthItemKind, type Milestone, type MilestoneKind,
  useFoodIntroductions, useFoods, useHealthItems, useMilestones,
} from '@/lib/data/hooks-family';
import { friendlyError } from '@/lib/data/hooks-settings';
import { formatDateFr, frToISO, todayISO } from '@/lib/domain/dates';
import type { Bottle, Breastfeed, Child, Diaper, LogKind, Meal, Measurement, Observation, Sleep } from '@/lib/types';
import { toFrDate } from '@/lib/validation';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';

// ---------------------------------------------------------------- onglets
export type ChildTab = 'apercu' | 'croissance' | 'etapes' | 'sante' | 'alimentation';
export const CHILD_TABS: { value: ChildTab; label: string; icon: IconName }[] = [
  { value: 'apercu', label: 'Aperçu', icon: 'sun' },
  { value: 'croissance', label: 'Croissance', icon: 'trending-up' },
  { value: 'etapes', label: 'Étapes', icon: 'star' },
  { value: 'sante', label: 'Santé', icon: 'heart' },
  { value: 'alimentation', label: 'Alimentation', icon: 'feather' },
];

export function ChildTabs({ value, onChange }: { value: ChildTab; onChange: (v: ChildTab) => void }) {
  const t = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
      {CHILD_TABS.map((tab) => {
        const sel = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: sel }}
            accessibilityLabel={tab.label}
            onPress={() => { haptic('selection'); onChange(tab.value); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: MIN_TOUCH, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1.2, borderColor: sel ? t.colors.primary : t.colors.border, backgroundColor: sel ? t.colors.primary : t.colors.surface }}
          >
            <Icon name={tab.icon} size={15} color={sel ? t.colors.primaryText : t.colors.textMuted} />
            <Text variant="small" weight="medium" color={sel ? t.colors.primaryText : t.colors.text}>{tab.label}</Text>
          </Pressable>
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
const fmt = (n: number | null | undefined, digits = 1) => (n == null ? '—' : String(Number(n.toFixed(digits))).replace('.', ','));

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
  const quick = (['bottle', 'breastfeed', 'diaper', 'meal', 'observation'] as LogKind[]).filter((k) => k === 'observation' || child.enabled_tracking.includes(KIND_META[k].tracking));

  return (
    <>
      <ChildToday child={child} compact />
      {(child.enabled_tracking.includes('bottle') || !!bottles?.length) && <BottleTimerCard child={child} />}
      <Row wrap>
        {quick.map((k) => (
          <Chip key={k} icon={KIND_META[k].icon} label={KIND_META[k].label} onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: k, child: child.id } })} />
        ))}
        {child.enabled_tracking.includes('sleep') && <Chip icon="moon" label="Sommeil" onPress={() => router.push('/night')} />}
      </Row>

      <SectionTitle title="Dernières entrées" />
      {logsLoading ? <Skeleton kind="list" rows={3} /> : logsError ? (
        <ErrorView error={logsError.error} onRetry={() => logQueries.forEach((q) => { void q.refetch(); })} title="Impossible d’afficher les dernières entrées" />
      ) : recent.length ? (
        <Card><Timeline logs={recent} childId={child.id} /></Card>
      ) : (
        <EmptyState
          icon="edit-3"
          title="Rien d’enregistré ces trois derniers jours"
          action={quick.length ? { label: `Noter : ${KIND_META[quick[0]].label}`, icon: 'plus', onPress: () => router.push({ pathname: '/track/[kind]', params: { kind: quick[0], child: child.id } }) } : undefined}
        />
      )}

      <SectionTitle title="En bref" />
      <Row wrap>
        <StatPill value={last ? formatDateFr(last.measured_on, false) : '—'} label="dernière mesure" />
        <StatPill value={String(milestones?.length ?? 0)} label="moments notés" />
      </Row>
      <Card>
        <ListRow icon="trending-up" title="Croissance" subtitle={last ? [last.weight_kg != null ? `${fmt(last.weight_kg, 3)} kg` : null, last.height_cm != null ? `${fmt(last.height_cm)} cm` : null].filter(Boolean).join(' · ') : 'Aucune mesure pour l’instant'} onPress={() => onTab('croissance')} />
        <ListRow icon="heart" title="Santé" subtitle={child.allergies_declared.length ? `Allergies déclarées : ${child.allergies_declared.join(', ')}` : 'Vaccins à vérifier, traitements, contacts'} onPress={() => onTab('sante')} />
        <ListRow icon="calendar" title="Rendez-vous" subtitle="Pédiatre, vaccins, bilans" onPress={() => router.push('/appointments')} />
      </Card>
    </>
  );
}

// ---------------------------------------------------------------- Croissance
type Metric = 'weight_kg' | 'height_cm' | 'head_cm';
const METRICS: { key: Metric; label: string; unit: string; min: number; max: number; digits: number }[] = [
  { key: 'weight_kg', label: 'Poids', unit: 'kg', min: 0.3, max: 80, digits: 3 },
  { key: 'height_cm', label: 'Taille', unit: 'cm', min: 20, max: 180, digits: 1 },
  { key: 'head_cm', label: 'Périmètre crânien', unit: 'cm', min: 20, max: 65, digits: 1 },
];

export function GrowthTab({ child }: { child: Child }) {
  const toast = useToast();
  const inv = useInvalidate();
  const write = useSafeWrite();
  const measurementsQ = useMeasurements(child.id);
  const { data: measurements } = measurementsQ;
  const [metric, setMetric] = useState<Metric>('weight_kg');
  const [date, setDate] = useState(toFrDate(todayISO()));
  const [values, setValues] = useState<Record<Metric, string>>({ weight_kg: '', height_cm: '', head_cm: '' });
  const [source, setSource] = useState<'home' | 'professional'>('professional');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const m = METRICS.find((x) => x.key === metric)!;
  const points = (measurements ?? [])
    .filter((x) => x[metric] != null)
    .map((x) => ({ x: new Date(x.measured_on).getTime(), y: Number(x[metric]), label: formatDateFr(x.measured_on, false) }));

  async function add() {
    const e: Record<string, string> = {};
    const iso = frToISO(date);
    if (!iso) e.date = 'Format attendu : JJ/MM/AAAA.';
    else if (iso > todayISO()) e.date = 'La date ne peut pas être dans le futur.';
    else if (iso < child.birth_date) e.date = 'La date précède la naissance.';
    const row: Record<string, number | null> = {};
    for (const x of METRICS) {
      const raw = values[x.key].trim();
      if (!raw) { row[x.key] = null; continue; }
      const v = num(raw);
      if (!Number.isFinite(v) || v < x.min || v > x.max) e[x.key] = `Valeur attendue entre ${String(x.min).replace('.', ',')} et ${x.max} ${x.unit}.`;
      else row[x.key] = v;
    }
    if (!e.weight_kg && !e.height_cm && !e.head_cm && METRICS.every((x) => row[x.key] == null)) e.form = 'Indiquez au moins une mesure.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await insertOrQueue('child_measurements', { child_id: child.id, household_id: child.household_id, measured_on: iso, ...row, source, note: note.trim() || null });
      inv('child_measurements');
      setValues({ weight_kg: '', height_cm: '', head_cm: '' });
      setNote('');
      haptic('success');
      toast('Mesure enregistrée.');
    } catch (err) {
      setErrors({ form: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function remove(x: Measurement) {
    if (!(await confirm('Supprimer cette mesure ?', 'Elle sera supprimée pour toutes les personnes du foyer.', 'Supprimer'))) return;
    await write.run(async () => {
      await backend.remove('child_measurements', [eq('id', x.id)]);
      inv('child_measurements');
    }, 'Mesure supprimée.');
  }

  return (
    <>
      <Segmented label="Mesure affichée" value={metric} onChange={setMetric} options={METRICS.map((x) => ({ value: x.key, label: x.key === 'head_cm' ? 'Crâne' : x.label }))} />
      {points.length >= 2 ? (
        <Card>
          <Text weight="bold">{m.label} ({m.unit})</Text>
          <LineChart points={points} unit={m.unit} accessibilityLabel={`Mesures de ${m.label.toLowerCase()} de ${child.first_name}`} formatX={(x) => new Date(x).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })} />
        </Card>
      ) : (
        <Card tone="soft"><Text muted>{points.length === 1 ? 'Ajoutez une deuxième mesure pour afficher la courbe.' : 'Ajoutez au moins deux mesures pour afficher la courbe.'}</Text></Card>
      )}
      <Text variant="caption" muted>Ce graphique reprend simplement vos mesures. Les courbes de référence figurent dans le carnet de santé : c’est votre médecin ou votre sage-femme qui les interprète avec vous.</Text>

      <SectionTitle title="Ajouter une mesure" />
      <Card>
        <View style={{ gap: spacing.sm }}>
          {errors.form ? <Banner tone="danger">{errors.form}</Banner> : null}
          <Field label="Date" value={date} onChangeText={setDate} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" error={errors.date} />
          <Row style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}><Field label="Poids" optional value={values.weight_kg} onChangeText={(v) => setValues({ ...values, weight_kg: v })} keyboardType="decimal-pad" suffix="kg" error={errors.weight_kg} /></View>
            <View style={{ flex: 1 }}><Field label="Taille" optional value={values.height_cm} onChangeText={(v) => setValues({ ...values, height_cm: v })} keyboardType="decimal-pad" suffix="cm" error={errors.height_cm} /></View>
          </Row>
          <Field label="Périmètre crânien" optional value={values.head_cm} onChangeText={(v) => setValues({ ...values, head_cm: v })} keyboardType="decimal-pad" suffix="cm" error={errors.head_cm} />
          <Segmented label="Mesure prise" value={source} onChange={setSource} options={[{ value: 'professional', label: 'Par un professionnel' }, { value: 'home', label: 'À la maison' }]} />
          <Field label="Note" optional value={note} onChangeText={setNote} maxLength={1000} />
          <Button label="Enregistrer la mesure" loading={saving} onPress={add} />
        </View>
      </Card>

      <SectionTitle title="Historique" />
      {measurementsQ.isLoading && !measurements ? <Skeleton kind="list" rows={2} /> : measurementsQ.isError && !measurements ? (
        <ErrorView error={measurementsQ.error} onRetry={() => void measurementsQ.refetch()} title="Impossible d’afficher les mesures" />
      ) : <Card>
        {(measurements ?? []).slice().reverse().map((x) => (
          <ListRow
            key={x.id}
            title={[x.weight_kg != null ? `${fmt(x.weight_kg, 3)} kg` : null, x.height_cm != null ? `${fmt(x.height_cm)} cm` : null, x.head_cm != null ? `PC ${fmt(x.head_cm)} cm` : null].filter(Boolean).join(' · ')}
            subtitle={[formatDateFr(x.measured_on), x.source === 'professional' ? 'professionnel' : 'maison', x.note].filter(Boolean).join(' · ')}
            right={<IconButton icon="trash-2" label={`Supprimer la mesure du ${formatDateFr(x.measured_on)}`} size={18} onPress={() => remove(x)} />}
          />
        ))}
        {!measurements?.length && <Text muted>Aucune mesure. Utilisez le formulaire ci-dessus pour ajouter la première.</Text>}
      </Card>}
    </>
  );
}

// ---------------------------------------------------------------- Étapes
const MILESTONE_KINDS: { value: MilestoneKind; label: string; icon: IconName }[] = [
  { value: 'milestone', label: 'Première fois', icon: 'star' },
  { value: 'memory', label: 'Souvenir', icon: 'camera' },
  { value: 'tooth', label: 'Dent', icon: 'smile' },
  { value: 'learning', label: 'Découverte', icon: 'compass' },
  { value: 'habit', label: 'Habitude', icon: 'repeat' },
];
const MILESTONE_IDEAS = ['Premier sourire', 'Premier éclat de rire', 'S’est retourné·e', 'Tient assis·e', 'Premiers pas', 'Premier mot', 'Première dent', 'Premier repas à table'];

export function MilestonesTab({ child }: { child: Child }) {
  const toast = useToast();
  const inv = useInvalidate();
  const write = useSafeWrite();
  const milestonesQ = useMilestones(child.id);
  const { data: milestones } = milestonesQ;
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<MilestoneKind>('milestone');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(toFrDate(todayISO()));
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function start(prefill?: string) {
    setTitle(prefill ?? '');
    setKind(prefill === 'Première dent' ? 'tooth' : 'milestone');
    setDate(toFrDate(todayISO()));
    setNote('');
    setErrors({});
    setOpen(true);
  }

  async function save() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Donnez un titre à ce moment.';
    let iso: string | null = null;
    if (date.trim()) {
      iso = frToISO(date);
      if (!iso) e.date = 'Format attendu : JJ/MM/AAAA.';
      else if (iso > todayISO()) e.date = 'La date ne peut pas être dans le futur.';
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await insertOrQueue('child_milestones', { child_id: child.id, household_id: child.household_id, kind, title: title.trim(), happened_on: iso, note: note.trim() || null });
      inv('child_milestones');
      haptic('success');
      toast('Moment ajouté.');
      setOpen(false);
    } catch (err) {
      setErrors({ form: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function remove(x: Milestone) {
    if (!(await confirm('Supprimer ce moment ?', `« ${x.title} » sera supprimé.`, 'Supprimer'))) return;
    await write.run(async () => {
      await backend.remove('child_milestones', [eq('id', x.id)]);
      inv('child_milestones');
    }, 'Moment supprimé.');
  }

  const meta = (k: MilestoneKind) => MILESTONE_KINDS.find((x) => x.value === k) ?? MILESTONE_KINDS[0];

  return (
    <>
      <Card tone="lavender">
        <Text>Le journal des premières fois de {child.first_name}. Chaque enfant avance à son propre rythme : notez ce qui compte pour vous, quand cela arrive.</Text>
      </Card>
      <Button label="Noter un moment" icon="plus" onPress={() => start()} />
      <Row wrap>
        {MILESTONE_IDEAS.map((idea) => <Chip key={idea} label={idea} tone="lavender" onPress={() => start(idea)} />)}
      </Row>

      <SectionTitle title="Moments notés" />
      {milestonesQ.isLoading && !milestones ? <Skeleton kind="list" rows={2} /> : milestonesQ.isError && !milestones ? (
        <ErrorView error={milestonesQ.error} onRetry={() => void milestonesQ.refetch()} title="Impossible d’afficher les moments" />
      ) : !milestones?.length ? (
        <EmptyState icon="star" title="Aucun moment noté pour l’instant" action={{ label: 'Noter un moment', onPress: () => start() }} />
      ) : <Card>
        {milestones.map((x) => (
          <ListRow
            key={x.id}
            icon={meta(x.kind).icon}
            title={x.title}
            subtitle={[meta(x.kind).label, x.happened_on ? formatDateFr(x.happened_on) : null, x.note].filter(Boolean).join(' · ')}
            right={<IconButton icon="trash-2" label={`Supprimer ${x.title}`} size={18} onPress={() => remove(x)} />}
          />
        ))}
      </Card>}

      <Sheet visible={open} onClose={() => setOpen(false)} title="Noter un moment">
        {errors.form ? <Banner tone="danger">{errors.form}</Banner> : null}
        <View style={{ gap: spacing.xs }}>
          <Text variant="label">Type</Text>
          <Row wrap>{MILESTONE_KINDS.map((k) => <Chip key={k.value} icon={k.icon} label={k.label} selected={kind === k.value} onPress={() => setKind(k.value)} />)}</Row>
        </View>
        <Field label="Titre" value={title} onChangeText={setTitle} maxLength={120} error={errors.title} placeholder="Premier sourire" />
        <Field label="Date" optional value={date} onChangeText={setDate} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" error={errors.date} />
        <Field label="Note ou souvenir" optional value={note} onChangeText={setNote} multiline maxLength={4000} />
        <Button label="Enregistrer" loading={saving} onPress={save} />
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------- Santé
const HEALTH_KINDS: { value: HealthItemKind; label: string; icon: IconName; hint: string }[] = [
  { value: 'vaccine_to_check', label: 'Vaccins à vérifier', icon: 'shield', hint: 'Notez ce que vous souhaitez vérifier avec le carnet de santé ou votre médecin.' },
  { value: 'allergy', label: 'Allergies', icon: 'alert-circle', hint: 'Uniquement celles identifiées par un professionnel.' },
  { value: 'treatment', label: 'Traitements prescrits', icon: 'package', hint: 'Tels que prescrits : l’application n’indique aucune dose.' },
  { value: 'contact', label: 'Contacts utiles', icon: 'phone', hint: 'Pédiatre, médecin traitant, PMI, crèche…' },
];

export function HealthTab({ child }: { child: Child }) {
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
    if (!label.trim()) e.label = 'Indiquez un libellé.';
    let dueIso: string | null = null;
    if (due.trim()) {
      dueIso = frToISO(due);
      if (!dueIso) e.due = 'Format attendu : JJ/MM/AAAA.';
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await insertOrQueue('child_health_items', { child_id: child.id, household_id: child.household_id, kind: adding, label: label.trim(), details: details.trim() || null, due_on: dueIso, done_on: null });
      inv('child_health_items');
      toast('Ajouté.');
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
    if (!(await confirm('Supprimer cet élément ?', `« ${x.label} » sera supprimé.`, 'Supprimer'))) return;
    await write.run(async () => {
      await backend.remove('child_health_items', [eq('id', x.id)]);
      inv('child_health_items');
    }, 'Élément supprimé.');
  }

  const meta = HEALTH_KINDS.find((k) => k.value === adding);

  return (
    <>
      <Banner tone="info">{'Un aide-mémoire pour préparer vos rendez-vous. Le carnet de santé et votre médecin font référence, notamment pour le calendrier des vaccins.'}</Banner>
      {child.allergies_declared.length > 0 && (
        <Card tone="gold">
          <Row><Icon name="alert-circle" size={18} /><Text weight="bold" style={{ flex: 1 }}>Allergies déclarées au profil</Text></Row>
          <Text style={{ marginTop: 4 }}>{child.allergies_declared.join(', ')}</Text>
        </Card>
      )}
      {itemsQ.isLoading && !items ? <Skeleton kind="list" rows={3} /> : itemsQ.isError && !items ? (
        <ErrorView error={itemsQ.error} onRetry={() => void itemsQ.refetch()} title="Impossible d’afficher la santé" />
      ) : HEALTH_KINDS.map((k) => {
        const list = (items ?? []).filter((x) => x.kind === k.value);
        return (
          <View key={k.value} style={{ gap: spacing.xs }}>
            <SectionTitle title={k.label} action="Ajouter" onAction={() => start(k.value)} />
            <Card>
              {list.map((x) => (
                <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  {k.value === 'vaccine_to_check' && (
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: !!x.done_on }}
                      accessibilityLabel={`${x.label} : ${x.done_on ? 'vérifié' : 'à vérifier'}`}
                      disabled={write.pending}
                      onPress={() => { haptic('selection'); void toggleDone(x); }}
                      hitSlop={6}
                      style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Icon name={x.done_on ? 'check-square' : 'square'} color={x.done_on ? t.colors.success : t.colors.textMuted} />
                    </Pressable>
                  )}
                  <View style={{ flex: 1 }}>
                    <ListRow
                      title={x.label}
                      subtitle={[x.details, x.due_on ? `À vérifier vers le ${formatDateFr(x.due_on)}` : null, x.done_on ? `Vérifié le ${formatDateFr(x.done_on)}` : null].filter(Boolean).join(' · ') || undefined}
                      right={<IconButton icon="trash-2" label={`Supprimer ${x.label}`} size={18} onPress={() => remove(x)} />}
                    />
                  </View>
                </View>
              ))}
              {!list.length && <Text variant="small" muted>{k.hint}</Text>}
            </Card>
          </View>
        );
      })}
      <Banner tone="danger" title="En cas d’urgence">{'Difficultés à respirer, malaise, somnolence inhabituelle, fièvre chez un bébé de moins de 3 mois : appelez le 15 ou le 112.'}</Banner>

      <Sheet visible={!!adding} onClose={() => setAdding(null)} title={meta?.label ?? 'Ajouter'}>
        {errors.form ? <Banner tone="danger">{errors.form}</Banner> : null}
        {meta ? <Text variant="small" muted>{meta.hint}</Text> : null}
        <Field label={adding === 'contact' ? 'Nom ou rôle' : 'Libellé'} value={label} onChangeText={setLabel} maxLength={160} error={errors.label} placeholder={adding === 'contact' ? 'Pédiatre' : adding === 'vaccine_to_check' ? 'Rappel prévu à la visite des 11 mois' : undefined} />
        <Field label={adding === 'contact' ? 'Téléphone, adresse' : 'Détails'} optional value={details} onChangeText={setDetails} multiline maxLength={2000} />
        {adding === 'vaccine_to_check' && <Field label="À vérifier vers le" optional value={due} onChangeText={setDue} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" error={errors.due} />}
        <Button label="Ajouter" loading={saving} onPress={save} />
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------- Alimentation (diversification)
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export function FoodsTab({ child }: { child: Child }) {
  return (
    <>
      <PremiumGate feature="Suivi de la diversification">
        <FoodsTracker child={child} />
      </PremiumGate>
      <Banner tone="danger" title="Réaction importante ?">{'Gêne pour respirer, gonflement du visage ou des lèvres, vomissements répétés, malaise : appelez le 15 ou le 112 immédiatement.'}</Banner>
    </>
  );
}

function FoodsTracker({ child }: { child: Child }) {
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
    if (!food) e.name = 'Indiquez un aliment.';
    else if (tried.has(norm(food))) e.name = 'Cet aliment est déjà noté.';
    const iso = frToISO(date);
    if (!iso) e.date = 'Format attendu : JJ/MM/AAAA.';
    else if (iso > todayISO()) e.date = 'La date ne peut pas être dans le futur.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await insertOrQueue('food_introductions', { child_id: child.id, household_id: child.household_id, food_name: food, first_tried_on: iso, reaction_note: reaction.trim() || null });
      inv('food_introductions');
      setName('');
      setReaction('');
      haptic('success');
      toast(`${food} ajouté.`);
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
    }, 'Note enregistrée.');
    if (ok) setEditing(null);
  }

  async function remove() {
    if (!editing) return;
    const { id, food_name } = editing;
    if (!(await confirm('Retirer cet aliment ?', `« ${food_name} » sera retiré de la liste.`, 'Retirer'))) return;
    const ok = await write.run(async () => {
      await backend.remove('food_introductions', [eq('id', id)]);
      inv('food_introductions');
    }, 'Aliment retiré.');
    if (ok) setEditing(null);
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Banner tone="info" title="Allergènes">{'Pour l’introduction des aliments allergènes (œuf, arachide, lait, blé, poisson…), parlez-en à votre médecin, surtout s’il existe des allergies dans la famille.'}</Banner>
      <Row wrap>
        <StatPill value={String(intros?.length ?? 0)} label="aliments découverts" />
        <StatPill value={String((intros ?? []).filter((i) => isAllergen(i.food_name)).length)} label="dont allergènes majeurs" />
      </Row>

      <SectionTitle title="Nouvel aliment" />
      <Card>
        <View style={{ gap: spacing.sm }}>
          {errors.form ? <Banner tone="danger">{errors.form}</Banner> : null}
          <Field label="Aliment" value={name} onChangeText={setName} maxLength={60} error={errors.name} placeholder="Courgette, banane…" />
          {suggestions.length > 0 && (
            <Row wrap>
              {suggestions.map((f) => <Chip key={f.id} label={f.name} icon={f.is_major_allergen ? 'alert-circle' : undefined} selected={norm(name) === norm(f.name)} onPress={() => setName(f.name)} />)}
            </Row>
          )}
          {pendingAllergen ? <Banner tone="warning">{'Allergène majeur : parlez-en à votre médecin avant ou pendant son introduction.'}</Banner> : null}
          <Field label="Première fois le" value={date} onChangeText={setDate} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" error={errors.date} />
          <Field label="Réaction observée" optional value={reaction} onChangeText={setReaction} multiline maxLength={1000} hint="Ce que vous avez remarqué, tel quel. L’application ne l’interprète pas." />
          <Button label="Ajouter" icon="plus" loading={saving} onPress={add} />
        </View>
      </Card>

      <SectionTitle title="Aliments découverts" />
      {introsQ.isLoading && !intros ? <Skeleton kind="list" rows={2} /> : introsQ.isError && !intros ? (
        <ErrorView error={introsQ.error} onRetry={() => void introsQ.refetch()} title="Impossible d’afficher les aliments" />
      ) : <Card>
        {(intros ?? []).map((i) => (
          <ListRow
            key={i.id}
            icon={isAllergen(i.food_name) ? 'alert-circle' : 'feather'}
            title={i.food_name}
            subtitle={[`Première fois le ${formatDateFr(i.first_tried_on)}`, isAllergen(i.food_name) ? 'allergène majeur' : null, i.reaction_note].filter(Boolean).join(' · ')}
            onPress={() => { setEditing(i); setEditNote(i.reaction_note ?? ''); }}
          />
        ))}
        {!intros?.length && <Text muted>Les aliments notés dans les repas apparaissent aussi ici.</Text>}
      </Card>}

      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing?.food_name ?? ''}>
        {editing ? <Text muted>Première fois le {formatDateFr(editing.first_tried_on)}</Text> : null}
        {editing && isAllergen(editing.food_name) ? <Text variant="small" color={t.colors.textMuted}>Allergène majeur : parlez-en à votre médecin.</Text> : null}
        <Field label="Réaction observée" optional value={editNote} onChangeText={setEditNote} multiline maxLength={1000} />
        <Button label="Enregistrer" loading={write.pending} onPress={saveNote} />
        <Button label="Retirer de la liste" variant="ghost" icon="trash-2" disabled={write.pending} onPress={remove} />
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
      toast('Profil mis à jour.');
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={`Modifier le profil de ${child.first_name}`}>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <ChildForm value={draft} onChange={setDraft} errors={errors} />
      <Button label="Enregistrer" loading={saving} onPress={save} />
    </Sheet>
  );
}
