/**
 * Saisie rapide du carnet (à une main) : gros boutons, heure = maintenant, valeurs par défaut = dernière saisie du
 * même type, pavé numérique avec la barre « OK ». Biberon, repas, sieste, change, activité, observation, arrivée,
 * départ, information importante. Chaque saisie est une ligne des tables de suivi existantes ; hors ligne, elle
 * attend sur le téléphone (« en attente d'envoi ») et part une seule fois. Si une saisie proche du même type existe
 * déjà (parent et nounou notent le même biberon), la FUSION est proposée au lieu d'une seconde ligne.
 * Une observation n'est jamais interprétée : aucun diagnostic, la température est la valeur mesurée.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { Sheet, useToast } from '@/components/Overlays';
import { Button, Card, Chip, Field, Text, type IconName } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { t as tr, type TKey } from '@/i18n';
import { formatTime, todayISO } from '@/lib/domain/dates';
import {
  ACTIVITY_TYPES, IMPORTANT_KINDS, MOODS, findDuplicate, lastDefaults, mergePatch, type CareItem, type CareKind,
} from '@/lib/domain/nounou';
import { useAddCareEntry, useCareChild, useCareDay, useCareMemberNames, useMergeCareEntry } from '@/lib/data/hooks-nounou';
import { friendlyError } from '@/lib/data/hooks-settings';
import { AbsenceNote, EmergencyNote, itemDetail, useAuthorLabel, KIND_LABEL } from '@/features/nounou/CareUI';

type EntryType = Exclude<CareKind, 'photo'> | 'important';
const TYPES: EntryType[] = ['bottle', 'meal', 'sleep', 'diaper', 'activity', 'observation', 'arrival', 'departure', 'important'];
const AMOUNTS = ['none', 'little', 'half', 'most', 'all'] as const;
const MILKS = ['breast_milk', 'infant_formula', 'other'] as const;

/** « 14:05 » / « 14h05 » → date du jour (heure du téléphone) ; null si invalide. */
function timeToIso(day: string, hm: string): string | null {
  const m = hm.trim().match(/^(\d{1,2})\s*[:hH.]\s*(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]); const mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  const [y, mo, d] = day.split('-').map(Number);
  return new Date(y, mo - 1, d, h, mi, 0, 0).toISOString();
}
const nowHM = () => formatTime(new Date()).replace(/\s/g, '');
const num = (s: string) => { const v = Number(s.replace(',', '.').trim()); return s.trim() && Number.isFinite(v) ? v : null; };

const PICK: { type: EntryType; icon: IconName }[] = [
  { type: 'bottle', icon: 'droplet' }, { type: 'meal', icon: 'coffee' }, { type: 'sleep', icon: 'moon' }, { type: 'diaper', icon: 'refresh-cw' },
  { type: 'activity', icon: 'sun' }, { type: 'observation', icon: 'eye' }, { type: 'arrival', icon: 'log-in' }, { type: 'departure', icon: 'log-out' },
];

/** Sans type précisé (« + Ajouter un événement » depuis Mes gardes) : choix du type en gros boutons. */
export default function AddCareEntry() {
  const { id, type: rawType } = useLocalSearchParams<{ id: string; type?: string }>();
  const { child, role, photosAllowed } = useCareChild(id);
  if (TYPES.includes(rawType as EntryType)) return <AddCareForm id={id} type={rawType as EntryType} />;
  const go = (t: string) => router.setParams({ type: t });
  return (
    <Screen back title={tr('nn.add.cta')} subtitle={child?.first_name} tool={false}>
      <View style={{ gap: spacing.xs }}>
        {PICK.map((p) => <Button key={p.type} label={tr(KIND_LABEL[p.type as CareKind])} icon={p.icon} size="lg" variant="secondary" full onPress={() => go(p.type)} testID={`care-pick-${p.type}`} />)}
        {role === 'caregiver' && photosAllowed ? <Button label={tr('nn.photo.take')} icon="camera" size="lg" variant="secondary" full onPress={() => router.replace(`/garde/${id}/photo` as never)} testID="care-pick-photo" /> : null}
        <Button label={tr('nn.kind.important')} icon="alert-triangle" size="lg" variant="danger" full onPress={() => go('important')} testID="care-pick-important" />
      </View>
    </Screen>
  );
}

function AddCareForm({ id, type }: { id: string; type: EntryType }) {
  const toast = useToast();
  const t = useTheme();
  const { child, role, loading } = useCareChild(id);
  const day = todayISO();
  const dayQ = useCareDay(child ? id : null, day);
  const names = useCareMemberNames(child?.household_id);
  const authorOf = useAuthorLabel(names.data);
  const add = useAddCareEntry();
  const merge = useMergeCareEntry();
  const defaults = useMemo(() => (type === 'important' ? {} : lastDefaults(type, dayQ.items ?? [])), [type, dayQ.items]);

  const [time, setTime] = useState(nowHM());
  const [endTime, setEndTime] = useState('');
  const [ml, setMl] = useState('');
  const [milk, setMilk] = useState<string | null>(null);
  const [foods, setFoods] = useState('');
  const [amount, setAmount] = useState<string | null>(null);
  const [diaper, setDiaper] = useState<'wet' | 'stool' | 'both' | null>(null);
  const [activity, setActivity] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState('');
  const [toShare, setToShare] = useState('');
  const [impKind, setImpKind] = useState<string | null>(null);
  const [temp, setTemp] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dup, setDup] = useState<{ item: CareItem; table: string; row: Record<string, unknown> } | null>(null);

  // valeurs par défaut = dernière saisie (une seule fois, quand le carnet est lu)
  const [seeded, setSeeded] = useState(false);
  if (!seeded && dayQ.items) {
    setSeeded(true);
    if (typeof defaults.consumed_ml === 'number') setMl(String(defaults.consumed_ml));
    if (typeof defaults.milk_type === 'string') setMilk(defaults.milk_type);
    if (Array.isArray(defaults.foods) && defaults.foods.length) setFoods((defaults.foods as string[]).join(', '));
    if (defaults.wet !== undefined) setDiaper(defaults.wet && defaults.stool ? 'both' : defaults.stool ? 'stool' : defaults.wet ? 'wet' : null);
    if (typeof defaults.activity_type === 'string') setActivity(defaults.activity_type);
  }

  if (loading) return <Screen back title={tr('nn.add.cta')} tool={false}><Skeleton rows={3} /></Screen>;
  if (!child || !role) return <Screen back title={tr('nn.add.cta')} tool={false}><EmptyState icon="lock" title={tr('nn.space.noAccess')} body={tr('nn.space.noAccessBody')} /></Screen>;

  function build(): { table: string; row: Record<string, unknown> } | string {
    const at = timeToIso(day, time);
    if (!at) return tr('nn.err.time');
    if (Date.parse(at) > Date.now() + 5 * 60_000) return tr('nn.err.future');
    const base = { child_id: child!.id, household_id: child!.household_id };
    const n = note.trim() || null;
    switch (type) {
      case 'bottle': {
        const v = num(ml);
        if (ml.trim() && (v == null || v < 0 || v > 500)) return tr('nn.err.ml');
        return { table: 'bottles', row: { ...base, at, consumed_ml: v == null ? null : Math.round(v), milk_type: milk, note: n } };
      }
      case 'meal': {
        const list = foods.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 20);
        if (!list.length && !n) return tr('nn.err.meal');
        return { table: 'meals', row: { ...base, at, foods: list, description: list.join(', ') || null, eaten_amount: amount, reaction_note: n } };
      }
      case 'sleep': {
        let ended: string | null = null;
        if (endTime.trim()) {
          ended = timeToIso(day, endTime);
          if (!ended) return tr('nn.err.time');
          if (Date.parse(ended) < Date.parse(at)) return tr('nn.err.endBefore');
        }
        return { table: 'sleeps', row: { ...base, started_at: at, ended_at: ended, kind: 'nap', note: n } };
      }
      case 'diaper':
        if (!diaper && !n) return tr('nn.err.diaper');
        return { table: 'diapers', row: { ...base, at, wet: diaper === 'wet' || diaper === 'both', stool: diaper === 'stool' || diaper === 'both', note: n } };
      case 'activity':
        return { table: 'childcare_events', row: { ...base, at, kind: 'activity', activity_type: activity ?? 'other', note: n } };
      case 'arrival': case 'departure':
        return { table: 'childcare_events', row: { ...base, at, kind: type, note: n } };
      case 'observation':
        if (!mood && !difficulty.trim() && !toShare.trim() && !n) return tr('nn.err.observation');
        return { table: 'child_observations', row: { ...base, at, kind: 'note', mood, difficulty: difficulty.trim() || null, to_share: toShare.trim() || null, note: n } };
      case 'important': {
        if (!impKind) return tr('nn.err.importantKind');
        if (impKind === 'temperature') {
          const v = num(temp);
          if (v == null || v < 30 || v > 45) return tr('nn.err.temp');
          return { table: 'child_observations', row: { ...base, at, kind: 'temperature', value_num: Math.round(v * 10) / 10, important: true, important_kind: 'temperature', note: n } };
        }
        if (!n) return tr('nn.err.importantText');
        return { table: 'child_observations', row: { ...base, at, kind: 'note', important: true, important_kind: impKind, note: n } };
      }
    }
  }

  async function save(force = false) {
    const b = build();
    if (typeof b === 'string') { setError(b); return; }
    setError(null);
    if (!force && type !== 'important') {
      const at = String(b.row.at ?? b.row.started_at);
      const d = findDuplicate({ kind: type, childId: child!.id, at }, dayQ.items ?? []);
      if (d) { setDup({ item: d, table: b.table, row: b.row }); return; }
    }
    try {
      const r = await add.mutateAsync(b);
      toast(r === 'queued' ? tr('nn.savedQueued') : tr('nn.saved'), 'success');
      router.back();
    } catch (e) { setError(friendlyError(e)); }
  }
  async function doMerge() {
    if (!dup) return;
    try {
      await merge.mutateAsync({ table: dup.table, id: dup.item.id, patch: mergePatch(dup.table, dup.item.row, dup.row) });
      setDup(null);
      toast(tr('nn.dup.merged'), 'success');
      router.back();
    } catch (e) { setDup(null); setError(friendlyError(e)); }
  }

  const title = type === 'important' ? tr('nn.kind.important') : tr(KIND_LABEL[type]);
  const chips = <T extends string>(values: readonly T[], value: string | null, set: (v: T | null) => void, prefix: string, testPrefix: string) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
      {values.map((v) => <Chip key={v} label={tr(`${prefix}${v}` as TKey)} selected={value === v} onPress={() => set(value === v ? null : v)} testID={`${testPrefix}-${v}`} />)}
    </View>
  );
  return (
    <Screen back title={title} subtitle={child.first_name} tool={false}
      action={{ label: tr('nn.add.save'), icon: 'check', onPress: () => save(), testID: 'care-save', loading: add.isPending }}>
      {type === 'important' ? <EmergencyNote /> : null}
      <Card>
        <Field label={type === 'sleep' ? tr('nn.f.start') : tr('nn.f.time')} value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" maxLength={5} hint={tr('nn.f.timeHint')} testID="care-time" />
        <Button label={tr('nn.f.now')} icon="clock" size="sm" variant="ghost" style={{ alignSelf: 'flex-start' }} onPress={() => setTime(nowHM())} />
        {type === 'sleep' ? (
          <Field label={tr('nn.f.end')} optional value={endTime} onChangeText={setEndTime} keyboardType="numbers-and-punctuation" maxLength={5} hint={tr('nn.f.endHint')} testID="care-end-time" />
        ) : null}
      </Card>
      {type === 'bottle' ? (
        <Card>
          <Field label={tr('nn.f.ml')} optional value={ml} onChangeText={setMl} keyboardType="number-pad" suffix="ml" maxLength={3} testID="care-ml" />
          <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('nn.f.milk')}</Text>
          {chips(MILKS, milk, setMilk, 'nn.milk.', 'care-milk')}
        </Card>
      ) : null}
      {type === 'meal' ? (
        <Card>
          <Field label={tr('nn.f.foods')} value={foods} onChangeText={setFoods} hint={tr('nn.f.foodsHint')} maxLength={300} testID="care-foods" />
          <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('nn.f.amount')}</Text>
          {chips(AMOUNTS, amount, setAmount, 'nn.amount.', 'care-amount')}
        </Card>
      ) : null}
      {type === 'diaper' ? <Card>{chips(['wet', 'stool', 'both'] as const, diaper, setDiaper, 'nn.diaper.', 'care-diaper')}</Card> : null}
      {type === 'activity' ? <Card><Text variant="label">{tr('nn.f.activity')}</Text>{chips(ACTIVITY_TYPES, activity, setActivity, 'nn.act.', 'care-act')}</Card> : null}
      {type === 'observation' ? (
        <Card>
          <Text variant="label">{tr('nn.f.mood')}</Text>
          {chips(MOODS, mood, setMood, 'nn.mood.', 'care-mood')}
          <Field label={tr('nn.f.difficulty')} optional value={difficulty} onChangeText={setDifficulty} maxLength={300} testID="care-difficulty" />
          <Field label={tr('nn.f.toShare')} optional value={toShare} onChangeText={setToShare} multiline maxLength={1000} testID="care-toshare" />
          <Text variant="caption" muted>{tr('nn.f.noDiagnosis')}</Text>
        </Card>
      ) : null}
      {type === 'important' ? (
        <Card>
          <Text variant="label">{tr('nn.f.importantKind')}</Text>
          {chips(IMPORTANT_KINDS, impKind, setImpKind, 'nn.imp.', 'care-imp')}
          {impKind === 'temperature' ? (
            <Field label={tr('nn.f.temp')} value={temp} onChangeText={setTemp} keyboardType="decimal-pad" suffix="°C" maxLength={4} hint={tr('nn.f.tempHint')} testID="care-temp" />
          ) : null}
        </Card>
      ) : null}
      <Card>
        <Field label={type === 'important' ? tr('nn.f.importantText') : tr('nn.f.note')} optional={type !== 'important' || impKind === 'temperature'} value={note} onChangeText={setNote} multiline maxLength={1000} testID="care-note" />
        {error ? <Text variant="small" color={t.colors.danger} testID="care-error" accessibilityRole="alert">{error}</Text> : null}
      </Card>
      <AbsenceNote />
      <Sheet visible={!!dup} onClose={() => setDup(null)} title={tr('nn.dup.title')}>
        {dup ? (
          <View style={{ gap: spacing.sm }} testID="care-dup-sheet">
            <Text>{tr('nn.dup.body', { time: formatTime(dup.item.at), who: authorOf(dup.item.authorId, dup.item.origin) })}</Text>
            {itemDetail(dup.item) ? <Text variant="small" muted>{itemDetail(dup.item)}</Text> : null}
            <Button label={tr('nn.dup.merge')} icon="git-merge" full loading={merge.isPending} onPress={doMerge} testID="care-dup-merge" />
            <Button label={tr('nn.dup.addAnyway')} variant="secondary" full onPress={() => { setDup(null); void save(true); }} testID="care-dup-add" />
            <Button label={tr('common.cancel')} variant="ghost" full onPress={() => setDup(null)} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
