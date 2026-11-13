/**
 * Tirage : gauche, droit ou simultané ; quantité par sein, total calculé (modifiable), durée facultative,
 * ressenti en mots (sans score), note. Option : mettre le lait tiré dans la réserve. Modification avec ?id=.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Chip, Field, haptic, Row, Segmented, Text, Toggle } from '@/components/ui';
import { TimePicker } from '@/features/tracking';
import { useFeedingChild } from '@/features/lactation';
import { backend, eq } from '@/lib/backend';
import { BackendError } from '@/lib/backend/types';
import { useDeleteRow, useInvalidate, useRows } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { computedTotal, PUMP_COMFORTS, pumpRow, STASH_STORAGES, type PumpComfort, type PumpMode, type StashStorage } from '@/lib/domain/lactation';
import { insertOrQueue, useOfflineStore } from '@/lib/offline';
import { goBack } from '@/lib/links';
import type { PumpingRecord } from '@/lib/types-lactation';
import { uuid } from '@/lib/uuid';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

const num = (s: string): number | null => {
  const v = s.trim().replace(',', '.');
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : NaN;
};
const str = (n: number | null | undefined) => (n == null ? '' : String(n));

export default function PumpEntry() {
  const toast = useToast();
  const inv = useInvalidate();
  const params = useLocalSearchParams<{ child?: string; id?: string }>();
  const editing = !!params.id;
  const existingQ = useRows<PumpingRecord>(['pumpings', 'edit', params.id ?? ''], editing ? { table: 'pumpings', filters: [eq('id', params.id)] } : null);
  const existing = existingQ.data?.[0];
  const { child, loading, name } = useFeedingChild(existing?.child_id ?? params.child);
  const del = useDeleteRow('pumpings');

  const [mode, setMode] = useState<PumpMode>('both');
  const [time, setTime] = useState(new Date());
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [total, setTotal] = useState('');
  const [duration, setDuration] = useState('');
  const [comfort, setComfort] = useState<PumpComfort | null>(null);
  const [note, setNote] = useState('');
  const [toStash, setToStash] = useState(false);
  const [storage, setStorage] = useState<StashStorage>('fridge');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const loaded = useRef(false);
  const original = useRef<PumpingRecord | null>(null);

  useEffect(() => {
    if (!editing || loaded.current || !existing) return;
    loaded.current = true;
    original.current = { ...existing };
    setMode((existing.side as PumpMode | null) ?? 'both');
    setTime(new Date(existing.at));
    setLeft(str(existing.left_ml));
    setRight(str(existing.right_ml));
    // Ancienne saisie (total seul) : le total est repris tel quel
    const sides = computedTotal(existing.left_ml ?? null, existing.right_ml ?? null);
    setTotal(sides == null || sides !== existing.amount_ml ? str(existing.amount_ml) : '');
    setDuration(str(existing.duration_min));
    setComfort(existing.comfort ?? null);
    setNote(existing.note ?? '');
  }, [editing, existing]);

  const l = mode === 'right' ? null : num(left);
  const r = mode === 'left' ? null : num(right);
  const auto = computedTotal(l != null && !Number.isNaN(l) ? l : null, r != null && !Number.isNaN(r) ? r : null);
  const title = editing ? tr('lac.pump.titleEdit') : tr('lac.pump.title');

  if (editing && existingQ.isError) return <Screen back title={title}><ErrorView error={existingQ.error} onRetry={() => void existingQ.refetch()} /></Screen>;
  if (editing && existingQ.isSuccess && !existing) return <Screen back title={title}><EmptyState icon="help-circle" title={tr('lac.pump.gone')} /></Screen>;
  if (loading || (editing && !existing)) return <Screen back title={title}><Skeleton kind="detail" rows={5} /></Screen>;
  if (!child) {
    return (
      <Screen back title={title}>
        <EmptyState icon="user-plus" title={tr('lac.home.noChild')} action={{ label: tr('lac.home.addProfile'), icon: 'plus', onPress: () => router.replace('/profiles/new') }} />
      </Screen>
    );
  }

  async function save() {
    setError(null);
    const vals = [l, r, num(total), num(duration)];
    if (vals.some((v) => v != null && Number.isNaN(v))) return setError(tr('lac.pump.err.amount_range'));
    const res = pumpRow({ mode, leftMl: l, rightMl: r, totalMl: num(total), durationMin: num(duration), comfort });
    if ('error' in res) return setError(tr(`lac.pump.err.${res.error}` as TKey));
    const row = { ...res.row, at: time.toISOString(), note: note.trim() || null };
    setSaving(true);
    try {
      if (editing && existing) {
        if (backend.mode !== 'demo' && !useOfflineStore.getState().online) return setError(tr('lac.pump.offlineEdit'));
        const o = original.current ?? existing;
        const updated = await backend.update('pumpings', row, [eq('id', existing.id), eq('amount_ml', o.amount_ml), eq('at', o.at)]);
        inv('pumpings');
        if (Array.isArray(updated) && updated.length === 0) return setError(tr('lac.pump.changed'));
        toast(tr('lac.pump.edited'));
      } else {
        const id = uuid();
        const sent = await insertOrQueue('pumpings', { id, client_id: uuid(), child_id: child!.id, household_id: child!.household_id, ...row });
        let stashed = false;
        if (toStash) {
          await insertOrQueue('milk_stash', { client_id: uuid(), child_id: child!.id, household_id: child!.household_id, pumping_id: id, volume_ml: row.amount_ml, collected_at: row.at, storage, status: 'available', status_at: null });
          stashed = true;
          inv('milk_stash');
        }
        inv('pumpings');
        toast(sent === 'queued' ? tr('lac.pump.queued') : stashed ? tr('lac.pump.savedStash') : tr('lac.pump.saved'), sent === 'queued' ? 'info' : 'success');
      }
      haptic('success');
      goBack(`/feeding?child=${child!.id}`);
    } catch (e) {
      setError(editing && e instanceof BackendError && e.isNetwork ? tr('lac.pump.offlineEdit') : friendlyError(e, tr('lac.pump.err.fail')));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!existing || !(await confirm(tr('lac.pump.delAsk'), tr('lac.pump.delBody'), tr('lac.pump.delete')))) return;
    try {
      await del.mutateAsync(existing.id);
      toast(tr('lac.pump.deleted'));
      goBack(`/feeding/pumpings?child=${child!.id}`);
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  return (
    <Screen back title={title} subtitle={name ? tr('lac.timer.forName', { name }) : undefined}
      action={{ label: editing ? tr('lac.pump.saveChanges') : tr('lac.pump.save'), icon: 'check', testID: 'pump-save', disabled: saving, onPress: () => void save() }}
      footer={editing ? <Button label={tr('lac.pump.delete')} variant="ghost" icon="trash-2" onPress={() => void remove()} /> : undefined}>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <Segmented label={tr('lac.pump.mode')} value={mode} onChange={setMode}
        options={(['left', 'right', 'both'] as const).map((m) => ({ value: m, label: tr(`lac.pump.mode.${m}` as TKey), testID: `pump-mode-${m}` }))} />
      <TimePicker value={time} onChange={setTime} label={tr('lac.pump.time')} />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {mode !== 'right' ? <View style={{ flex: 1 }}><Field label={tr('lac.pump.left')} optional value={left} onChangeText={setLeft} keyboardType="number-pad" suffix="ml" testID="pump-left" /></View> : null}
        {mode !== 'left' ? <View style={{ flex: 1 }}><Field label={tr('lac.pump.right')} optional value={right} onChangeText={setRight} keyboardType="number-pad" suffix="ml" testID="pump-right" /></View> : null}
      </View>
      <Text weight="bold" testID="pump-total" accessibilityLiveRegion="polite">
        {num(total) != null && !Number.isNaN(num(total)) ? tr('lac.pump.total', { ml: num(total)! }) : auto != null ? tr('lac.pump.total', { ml: auto }) : tr('lac.pump.totalNone')}
      </Text>
      <Field label={tr('lac.pump.totalFix')} optional value={total} onChangeText={setTotal} keyboardType="number-pad" suffix="ml" hint={tr('lac.pump.totalFixHint')} testID="pump-total-fix" />
      <Field label={tr('lac.pump.duration')} optional value={duration} onChangeText={setDuration} keyboardType="number-pad" suffix="min" testID="pump-duration" />
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">{tr('lac.pump.comfort')}</Text>
        <Row wrap>
          {PUMP_COMFORTS.map((c) => <Chip key={c} label={tr(`lac.pump.comfort.${c}` as TKey)} selected={comfort === c} onPress={() => setComfort(comfort === c ? null : c)} testID={`pump-comfort-${c}`} />)}
        </Row>
      </View>
      {comfort === 'painful' ? (
        <Banner tone="info" icon="life-buoy" action={<Button label={tr('lac.pump.painfulLink')} size="sm" variant="secondary" onPress={() => router.push({ pathname: '/feeding/help', params: { child: child!.id } })} />}>
          {tr('lac.pump.painful')}
        </Banner>
      ) : null}
      <Field label={tr('lac.pump.note')} optional value={note} onChangeText={setNote} multiline maxLength={1000} />
      {!editing ? (
        <View style={{ gap: spacing.xs }}>
          <Toggle value={toStash} onChange={setToStash} label={tr('lac.pump.toStash')} />
          {toStash ? (
            <>
              <Segmented label={tr('lac.pump.storage')} value={storage} onChange={setStorage} options={STASH_STORAGES.map((s) => ({ value: s, label: tr(`lac.stash.storage.${s}` as TKey) }))} />
              <Text variant="caption" muted>{tr('lac.pump.toStashHint')}</Text>
            </>
          ) : null}
        </View>
      ) : null}
      <Button label={tr('lac.pump.volumesLink')} variant="ghost" icon="bar-chart-2" onPress={() => router.push({ pathname: '/feeding/pumpings', params: { child: child.id } })} style={{ alignSelf: 'flex-start' }} />
    </Screen>
  );
}
