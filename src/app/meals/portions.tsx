/**
 * 122 — Portions préparées : lots de repas de bébé préparés à l'avance (recette de la bibliothèque facultative, enfant,
 * nombre, date, congélateur ou réfrigérateur), décompte à chaque utilisation (une ligne par utilisation, annulable),
 * alerte d'échéance d'après la date limite SAISIE par le parent. HOMI ne propose aucune durée de conservation : si une
 * recette est liée, ses propres conseils de conservation sont rappelés avec leurs sources.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Chip, Field, ListGroup, ListRow, Row, Segmented, Text } from '@/components/ui';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { daysBetween, frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { useChildren } from '@/lib/data/hooks';
import { useRecipes } from '@/lib/data/hooks-recipes';
import { friendlyError } from '@/lib/data/hooks-settings';
import { RECIPE_SOURCES } from '@/lib/recipes/sources';
import {
  useDeleteBatch, useIsHouseholdParent, usePortionBatches, usePortionUses, useSaveBatch, useUndoPortionUse, useUsePortion,
} from '@/lib/data/hooks-foyerTools';
import { expiryAlerts, expiryStatus, portionsLeft, sortBatches, useByFromDays, type PortionBatch, type PortionStorage } from '@/features/portions/domain';
import { spacing } from '@/theme/tokens';

const dShort = (d: string) => formatDate(d, { day: 'numeric', month: 'short' });

function BatchEditor({ visible, onClose, hid, initial, used }: { visible: boolean; onClose: () => void; hid: string; initial: PortionBatch | null; used: number }) {
  const toast = useToast();
  const save = useSaveBatch();
  const kids = (useChildren().data ?? []).filter((c) => c.household_id === hid && !c.archived);
  const recipes = useRecipes().data ?? [];
  const babyRecipes = useMemo(() => recipes.filter((r) => r.audiences.includes('baby')), [recipes]);
  const [label, setLabel] = useState('');
  const [slug, setSlug] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [count, setCount] = useState('');
  const [prepared, setPrepared] = useState('');
  const [storage, setStorage] = useState<PortionStorage>('freezer');
  const [limitMode, setLimitMode] = useState<'date' | 'days'>('date');
  const [useBy, setUseBy] = useState('');
  const [days, setDays] = useState('');
  const [child, setChild] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!visible) return;
    setLabel(initial?.label ?? ''); setSlug(initial?.recipe_slug ?? null); setSearch(''); setCount(initial ? String(initial.portions_total) : '');
    setPrepared(toFrDate(initial?.prepared_on ?? todayISO())); setStorage(initial?.storage ?? 'freezer'); setLimitMode('date');
    setUseBy(initial?.use_by ? toFrDate(initial.use_by) : ''); setDays(''); setChild(initial?.child_id ?? kids[0]?.id ?? null); setNote(initial?.note ?? ''); setErr(null);
  }, [visible, initial]); // eslint-disable-line react-hooks/exhaustive-deps
  const recipe = slug ? recipes.find((r) => r.slug === slug) ?? null : null;
  const matches = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    if (q.length < 2) return [];
    // les titres les plus proches d'abord (« Purée de carotte » avant « Bœuf carottes en famille »)
    return babyRecipes.map((r) => ({ r, at: r.title.toLocaleLowerCase().indexOf(q) })).filter((x) => x.at >= 0)
      .sort((x, y) => x.at - y.at || x.r.title.length - y.r.title.length).slice(0, 6).map((x) => x.r);
  }, [search, babyRecipes]);
  async function submit() {
    if (!label.trim()) return setErr(tr('pt.err.label'));
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > 200) return setErr(tr('pt.err.count'));
    if (n < used) return setErr(tr('pt.err.belowUsed', { count: used }));
    const p = frToISO(prepared);
    if (!p) return setErr(tr('pt.err.date'));
    let limit: string | null = null;
    if (limitMode === 'date' && useBy.trim()) { limit = frToISO(useBy); if (!limit) return setErr(tr('pt.err.date')); }
    if (limitMode === 'days' && days.trim()) { limit = useByFromDays(p, Number(days)); if (!limit) return setErr(tr('pt.err.days')); }
    if (limit && limit < p) return setErr(tr('pt.err.before'));
    setErr(null);
    try {
      const r = await save.mutateAsync({ id: initial?.id, household_id: hid, child_id: child, label: label.trim().slice(0, 80), recipe_slug: slug, portions_total: n, prepared_on: p, storage, use_by: limit, note: note.trim() || null });
      toast(tr(r.queued ? 'pt.savedOffline' : 'pt.saved'), 'success');
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  const advice = recipe ? (storage === 'freezer' ? recipe.freezing : recipe.storage) : null;
  return (
    <GlassSheet visible={visible} onClose={onClose} title={initial ? tr('pt.edit') : tr('pt.add')}>
      <Field label={tr('pt.f.recipe')} optional value={search} onChangeText={setSearch} placeholder={tr('pt.f.recipePh')} testID="pt-f-recipe" />
      {matches.length ? <Row wrap>{matches.map((r) => <Chip key={r.slug} label={r.title} icon="book-open" onPress={() => { setSlug(r.slug); if (!label.trim()) setLabel(r.title); setSearch(''); }} testID={`pt-f-recipe-${r.slug}`} />)}</Row> : null}
      {recipe ? <Chip label={recipe.title} icon="x" selected onPress={() => setSlug(null)} testID="pt-f-recipe-clear" /> : null}
      <Field label={tr('pt.f.label')} value={label} onChangeText={setLabel} maxLength={80} testID="pt-f-label" />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Field label={tr('pt.f.count')} value={count} onChangeText={setCount} keyboardType="number-pad" testID="pt-f-count" /></View>
        <View style={{ flex: 1 }}><Field label={tr('pt.f.prepared')} value={prepared} onChangeText={setPrepared} keyboardType="numbers-and-punctuation" testID="pt-f-prepared" /></View>
      </View>
      <Segmented label={tr('pt.f.storage')} value={storage} onChange={setStorage}
        options={[{ value: 'freezer', label: tr('pt.storage.freezer'), testID: 'pt-f-freezer' }, { value: 'fridge', label: tr('pt.storage.fridge'), testID: 'pt-f-fridge' }]} />
      <Text variant="label">{tr('pt.f.limit')}</Text>
      <Row wrap>
        <Chip label={tr('pt.f.limitDate')} selected={limitMode === 'date'} onPress={() => setLimitMode('date')} testID="pt-f-mode-date" />
        <Chip label={tr('pt.f.limitDays')} selected={limitMode === 'days'} onPress={() => setLimitMode('days')} testID="pt-f-mode-days" />
      </Row>
      {limitMode === 'date' ? <Field label={tr('pt.f.useBy')} optional value={useBy} onChangeText={setUseBy} keyboardType="numbers-and-punctuation" hint={tr('pt.f.dateHint')} testID="pt-f-useby" />
        : <Field label={tr('pt.f.days')} optional value={days} onChangeText={setDays} keyboardType="number-pad" hint={tr('pt.f.daysHint')} testID="pt-f-days" />}
      <Text variant="caption" muted>{tr('pt.f.limitNotice')}</Text>
      {advice ? (
        <Banner tone="info" icon="book-open" title={tr('pt.advice.title')}>
          <Text variant="small">{advice}</Text>
          <Text variant="caption" muted>{tr('pt.advice.sources', { list: recipe!.sources.map((s) => RECIPE_SOURCES[s]?.publisher ?? s).join(', ') })}</Text>
        </Banner>
      ) : null}
      {kids.length > 1 ? (
        <Row wrap>
          <Chip label={tr('pt.f.noChild')} selected={!child} onPress={() => setChild(null)} />
          {kids.map((k) => <Chip key={k.id} label={k.first_name} selected={child === k.id} onPress={() => setChild(k.id)} />)}
        </Row>
      ) : null}
      <Field label={tr('pt.f.note')} optional value={note} onChangeText={setNote} maxLength={300} placeholder={tr('pt.f.notePh')} testID="pt-f-note" />
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="pt-f-save" />
    </GlassSheet>
  );
}

export default function Portions() {
  const toast = useToast();
  const { hid, parent, loading } = useIsHouseholdParent();
  const batches = usePortionBatches(parent ? hid : null);
  const usesQ = usePortionUses(parent ? hid : null);
  const use = useUsePortion();
  const undo = useUndoPortionUse();
  const del = useDeleteBatch();
  const kids = useChildren().data ?? [];
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PortionBatch | null>(null);
  const today = todayISO();
  const uses = useMemo(() => usesQ.data ?? [], [usesQ.data]);
  const { active, finished } = useMemo(() => sortBatches(batches.data ?? [], uses), [batches.data, uses]);
  const alerts = useMemo(() => expiryAlerts(batches.data ?? [], uses, today), [batches.data, uses, today]);

  if (loading || (parent && batches.isLoading && !batches.data)) return <Screen back title={tr('pt.title')}><Skeleton rows={4} /></Screen>;
  if (!parent || !hid) return <Screen back title={tr('pt.title')}><EmptyState icon="lock" title={tr('pt.title')} body={tr('pt.parentsOnly')} /></Screen>;
  if (batches.isError && !batches.data) return <Screen back title={tr('pt.title')}><ErrorView error={batches.error} onRetry={() => void batches.refetch()} /></Screen>;

  async function useOne(b: PortionBatch) {
    try {
      const r = await use.mutateAsync({ household_id: b.household_id, portion_id: b.id, count: 1 });
      toast(tr(r.queued ? 'pt.usedOffline' : 'pt.used', { count: Math.max(0, portionsLeft(b, uses) - 1) }), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function undoLast(b: PortionBatch) {
    const last = [...uses].filter((u) => u.portion_id === b.id && !u._pending).sort((x, y) => y.used_at.localeCompare(x.used_at))[0];
    if (!last) return;
    try { await undo.mutateAsync(last.id); toast(tr('pt.undone'), 'success'); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function remove(b: PortionBatch) {
    if (!(await confirm(tr('common.delete'), tr('pt.deleteQ'), tr('common.delete')))) return;
    try { await del.mutateAsync(b.id); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  const usedOf = (b: PortionBatch) => b.portions_total - portionsLeft(b, uses);
  const batchCard = (b: PortionBatch, done: boolean) => {
    const left = portionsLeft(b, uses);
    const st = expiryStatus(b.use_by, today);
    const kid = kids.find((k) => k.id === b.child_id)?.first_name;
    return (
      <View key={b.id} style={{ gap: spacing.xs }} testID={`pt-batch-${b.id}`}>
        <ListRow icon={b.storage === 'freezer' ? 'box' : 'thermometer'} title={b.label}
          subtitle={[tr(`pt.storage.${b.storage}` as TKey), tr('pt.preparedOn', { date: dShort(b.prepared_on) }), kid,
            b.use_by ? tr(`pt.expiry.${st}` as TKey, { date: dShort(b.use_by), count: Math.max(0, daysBetween(today, b.use_by)) }) : tr('pt.expiry.none'),
            b._pending ? tr('fx.pending') : null].filter(Boolean).join(' · ')}
          value={tr('pt.left', { left, total: b.portions_total })} onPress={b._pending ? undefined : () => { setEditing(b); setOpen(true); }} testID={`pt-row-${b.id}`} />
        {!done ? (
          <Row wrap>
            <Button label={tr('pt.useOne')} icon="minus-circle" size="sm" loading={use.isPending} onPress={() => void useOne(b)} disabled={b._pending} testID={`pt-use-${b.id}`} />
            {usedOf(b) > 0 ? <Button label={tr('pt.undo')} icon="rotate-ccw" size="sm" variant="ghost" onPress={() => void undoLast(b)} testID={`pt-undo-${b.id}`} /> : null}
            {b.recipe_slug ? <Button label={tr('pt.recipe')} icon="book-open" size="sm" variant="ghost" onPress={() => router.push(`/meals/${b.recipe_slug}` as never)} /> : null}
          </Row>
        ) : <Button label={tr('common.delete')} icon="trash-2" size="sm" variant="ghost" onPress={() => void remove(b)} testID={`pt-delete-${b.id}`} />}
      </View>
    );
  };
  return (
    <Screen back title={tr('pt.title')} subtitle={tr('pt.sub')} action={{ label: tr('pt.add'), icon: 'plus', onPress: () => { setEditing(null); setOpen(true); }, testID: 'pt-add' }}>
      {alerts.map((b) => (
        <Banner key={b.id} tone={expiryStatus(b.use_by, today) === 'expired' ? 'warning' : 'info'} icon="clock" title={b.label}>
          <Text variant="small" testID={`pt-alert-${b.id}`}>{tr(`pt.alert.${expiryStatus(b.use_by, today)}` as TKey, { date: dShort(b.use_by!), count: portionsLeft(b, uses) })}</Text>
        </Banner>
      ))}
      {active.length ? <ListGroup title={tr('pt.active')} testID="pt-active"><View style={{ gap: spacing.md, padding: spacing.sm }}>{active.map((b) => batchCard(b, false))}</View></ListGroup>
        : <EmptyState icon="box" title={tr('pt.empty.title')} body={tr('pt.empty.body')} action={{ label: tr('pt.add'), icon: 'plus', onPress: () => { setEditing(null); setOpen(true); } }} />}
      {finished.length ? <ListGroup title={tr('pt.finished')}><View style={{ gap: spacing.md, padding: spacing.sm }}>{finished.slice(0, 10).map((b) => batchCard(b, true))}</View></ListGroup> : null}
      <Text variant="caption" muted>{tr('pt.notice')}</Text>
      <BatchEditor visible={open} onClose={() => setOpen(false)} hid={hid} initial={editing} used={editing ? usedOf(editing) : 0} />
    </Screen>
  );
}
