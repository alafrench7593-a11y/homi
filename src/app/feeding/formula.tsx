/**
 * 79 — Historique des changements de lait infantile : marque, type, date de début et de fin, raison, observations.
 * Visible aussi dans la frise de l'enfant (journal des moments) ; lisible par la nounou confirmée qui prépare les
 * biberons. HOMI ne recommande aucun lait.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, ListGroup, ListRow, Row, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr } from '@/i18n';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteFormula, useFormulaChanges, useSaveFormula } from '@/lib/data/hooks-feeding';
import { FeedingChildPicker, useFeedingChild } from '@/features/feeding/ui';
import {
  closePrevious, current, FORMULA_KINDS, FORMULA_REASONS, kindLabel, reasonLabel, sorted, timelineLine, validateFormula,
  type FormulaChange, type FormulaKind, type FormulaReason,
} from '@/features/feeding/formula';

function FormulaSheet({ item, visible, onClose, childId, householdId, list }: { item: FormulaChange | null; visible: boolean; onClose: () => void; childId: string; householdId: string; list: FormulaChange[] }) {
  const toast = useToast();
  const save = useSaveFormula();
  const del = useDeleteFormula();
  const [brand, setBrand] = useState('');
  const [kind, setKind] = useState<FormulaKind>('first_age');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState<FormulaReason | null>(null);
  const [obs, setObs] = useState('');
  const [err, setErr] = useState<string | null>(null);
  React.useEffect(() => {
    if (!visible) return;
    setBrand(item?.brand ?? ''); setKind(item?.kind ?? 'first_age'); setStart(toFrDate(item?.started_on ?? todayISO())); setEnd(toFrDate(item?.ended_on ?? null));
    setReason(item?.reason ?? (list.length ? null : 'start')); setObs(item?.observations ?? ''); setErr(null);
  }, [visible, item?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!visible) return null;
  const startIso = frToISO(start);
  const prev = !item && startIso ? closePrevious(list, startIso) : null;
  async function submit() {
    const endIso = end.trim() ? frToISO(end) : null;
    if (end.trim() && !endIso) return setErr(tr('fml.err.end'));
    const e = validateFormula({ brand, startedOn: startIso, endedOn: endIso }, todayISO());
    if (e) return setErr(tr(e));
    try {
      if (prev) {
        const old = list.find((f) => f.id === prev.id);
        if (old) await save.mutateAsync({ ...old, ended_on: prev.ended_on });
      }
      const r = await save.mutateAsync({ ...(item ?? {}), child_id: childId, household_id: householdId, brand: brand.trim(), kind, started_on: startIso!, ended_on: endIso, reason, observations: obs.trim() || null });
      toast(r === 'queued' ? tr('fml.savedOffline') : tr('fml.saved'), 'success'); onClose();
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  async function remove() {
    if (!item || !(await confirm(tr('fml.delete'), tr('fml.deleteQ'), tr('fml.delete')))) return;
    try { await del.mutateAsync(item.id); onClose(); } catch (x) { toast(friendlyError(x), 'error'); }
  }
  return (
    <GlassSheet visible onClose={onClose} title={item ? tr('fml.edit') : tr('fml.add')}>
      <Field label={tr('fml.brand')} value={brand} onChangeText={setBrand} maxLength={80} placeholder={tr('fml.brandPh')} testID="fml-f-brand" />
      <Text variant="label">{tr('fml.kind')}</Text>
      <Row wrap>{FORMULA_KINDS.map((k) => <Chip key={k} label={kindLabel(k)} selected={kind === k} onPress={() => setKind(k)} testID={`fml-f-kind-${k}`} />)}</Row>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Field label={tr('fml.start')} value={start} onChangeText={setStart} keyboardType="numbers-and-punctuation" placeholder={tr('care.when.datePh')} testID="fml-f-start" /></View>
        <View style={{ flex: 1 }}><Field label={tr('fml.end')} optional value={end} onChangeText={setEnd} keyboardType="numbers-and-punctuation" placeholder={tr('care.when.datePh')} testID="fml-f-end" /></View>
      </View>
      {prev ? <Banner tone="info" icon="info">{tr('fml.closePrev', { brand: list.find((f) => f.id === prev.id)?.brand ?? '', date: formatDate(prev.ended_on, { day: 'numeric', month: 'long' }) })}</Banner> : null}
      <Text variant="label">{tr('fml.reason')}</Text>
      <Row wrap>{FORMULA_REASONS.map((r) => <Chip key={r} label={reasonLabel(r)} selected={reason === r} onPress={() => setReason(reason === r ? null : r)} testID={`fml-f-reason-${r}`} />)}</Row>
      <Field label={tr('fml.observations')} optional multiline maxLength={1000} value={obs} onChangeText={setObs} placeholder={tr('fml.obsPh')} testID="fml-f-obs" />
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="fml-f-save" />
      {item ? <Button label={tr('fml.delete')} variant="ghost" icon="trash-2" onPress={() => void remove()} testID="fml-f-delete" /> : null}
    </GlassSheet>
  );
}

export default function FormulaHistory() {
  const { children, child, setChild, loading } = useFeedingChild();
  const q = useFormulaChanges(child?.id ?? null);
  const [sheet, setSheet] = useState<{ item: FormulaChange | null } | null>(null);
  const list = useMemo(() => sorted(q.data ?? []), [q.data]);
  const cur = current(list, todayISO());
  if (loading || (q.isLoading && !q.data && child)) return <Screen back title={tr('fml.title')} tool={false}><Skeleton rows={4} /></Screen>;
  if (!child) return <Screen back title={tr('fml.title')} tool={false}><EmptyState icon="droplet" title={tr('fml.title')} body={tr('milk.noChild')} /></Screen>;
  return (
    <Screen back title={tr('fml.title')} subtitle={tr('fml.subtitle', { name: child.first_name })} tool={false}
      action={{ label: tr('fml.add'), icon: 'plus', onPress: () => setSheet({ item: null }), testID: 'fml-add' }}>
      <FeedingChildPicker list={children} value={child.id} onChange={setChild} />
      {cur ? (
        <Card testID="fml-current">
          <Text variant="caption" muted>{tr('fml.current')}</Text>
          <Text weight="bold">{cur.brand}</Text>
          <Text variant="small" muted>{[kindLabel(cur.kind), tr('fml.since', { from: formatDate(cur.started_on, { day: 'numeric', month: 'long', year: 'numeric' }) })].join(' · ')}</Text>
        </Card>
      ) : null}
      {list.length ? (
        <ListGroup title={tr('fml.history')} testID="fml-list">
          {list.map((f) => {
            const l = timelineLine(f);
            return <ListRow key={f.id} icon="droplet" title={l.title} subtitle={f._pending ? `${l.subtitle} · ${tr('fml.pending')}` : l.subtitle} onPress={() => setSheet({ item: f })} testID={`fml-row-${f.kind}`} />;
          })}
        </ListGroup>
      ) : <EmptyState icon="droplet" title={tr('fml.emptyTitle')} body={tr('fml.emptyBody')} action={{ label: tr('fml.add'), onPress: () => setSheet({ item: null }) }} />}
      <Text variant="caption" muted>{tr('fml.note')}</Text>
      <FormulaSheet item={sheet?.item ?? null} visible={!!sheet} onClose={() => setSheet(null)} childId={child.id} householdId={child.household_id} list={list} />
    </Screen>
  );
}
