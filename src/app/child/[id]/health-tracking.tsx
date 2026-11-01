/**
 * Suivi de santé configurable (TDAH observé, diabète, autre maladie déjà diagnostiquée…).
 * - Mesures avec unité et contexte, observations par contexte (maison, école…).
 * - Les seuils ne viennent QUE du plan écrit par le professionnel de l'enfant ; sans plan, rien n'est interprété.
 * - Jamais de dose, jamais de traitement, jamais de diagnostic ni de score clinique.
 * - Chaque entrée indique sa source : observation du parent, donnée importée, information confirmée par un professionnel.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { LineChart } from '@/components/Charts';
import { Banner, Button, Card, Chip, Field, ListRow, Row, SectionTitle, Segmented, Text, Toggle } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useChild, useInvalidate, useRows } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { planCheck } from '@/lib/domain/childCare';
import { frToISO } from '@/lib/domain/dates';
import { exportTextFile } from '@/lib/exportData';
import { insertOrQueue } from '@/lib/offline';
import { csvCell, safeFileName } from '@/lib/csv';
import { spacing } from '@/theme/tokens';
import { formatNumber, localeTag, t as tr } from '@/i18n';

interface Tracker { id: string; child_id: string; kind: 'measure' | 'observation'; label: string; unit: string | null; plan_note: string | null; plan_by: string | null; plan_date: string | null; low_threshold: number | null; high_threshold: number | null; thresholds_from_plan: boolean; contexts: string[]; active: boolean }
interface Entry { id: string; tracker_id: string; at: string; value: number | null; context: string | null; note: string | null; source: 'parent' | 'imported' | 'professional' }
const SOURCE_KEY = { parent: 'u4.ht.src.parent', imported: 'u4.ht.src.imported', professional: 'u4.ht.src.professional' } as const;
const sourceLabel = (k: keyof typeof SOURCE_KEY) => tr(SOURCE_KEY[k]);

const templates = () => [
  { kind: 'observation' as const, label: tr('u4.ht.tpl.attention'), unit: undefined as string | undefined, contexts: [tr('u4.ht.ctx.home'), tr('u4.ht.ctx.school'), tr('u4.ht.ctx.activities'), tr('u4.ht.ctx.homework')] },
  { kind: 'measure' as const, label: tr('u4.ht.tpl.glucose'), unit: 'g/L' as string | undefined, contexts: [tr('u4.ht.ctx.fasting'), tr('u4.ht.ctx.beforeMeal'), tr('u4.ht.ctx.afterMeal'), tr('u4.ht.ctx.bedtime')] },
  { kind: 'observation' as const, label: tr('u4.ht.tpl.sleep'), unit: undefined as string | undefined, contexts: [tr('u4.ht.ctx.night'), tr('u4.ht.ctx.day')] },
];

export default function HealthTracking() {
  const toast = useToast();
  const inv = useInvalidate();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const trackersQ = useRows<Tracker>(['child_health_trackers', id ?? ''], id ? { table: 'child_health_trackers', filters: [eq('child_id', id)], order: [{ col: 'created_at' }] } : null);
  const entriesQ = useRows<Entry>(['child_health_entries', id ?? ''], id ? { table: 'child_health_entries', filters: [eq('child_id', id)], order: [{ col: 'at', asc: false }], limit: 500 } : null);
  const [editing, setEditing] = useState<Partial<Tracker> & { low?: string; high?: string } | null>(null);
  const [entryFor, setEntryFor] = useState<Tracker | null>(null);
  const [value, setValue] = useState('');
  const [context, setContext] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [source, setSource] = useState<Entry['source']>('parent');
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState(false);

  async function saveTracker() {
    if (!child || !editing) return;
    if (!editing.label?.trim()) return toast(tr('u4.ht.nameIt'), 'error');
    const low = editing.low?.trim() ? Number(editing.low.replace(',', '.')) : null;
    const high = editing.high?.trim() ? Number(editing.high.replace(',', '.')) : null;
    if ((low != null && !Number.isFinite(low)) || (high != null && !Number.isFinite(high))) return toast(tr('u4.ht.badRef'), 'error');
    if ((low != null || high != null) && !(editing.thresholds_from_plan && editing.plan_by?.trim())) return toast(tr('u4.ht.refPlan'), 'error');
    const row = {
      kind: editing.kind ?? 'observation', label: editing.label.trim().slice(0, 80), unit: editing.kind === 'measure' ? editing.unit?.trim() || null : null,
      plan_note: editing.plan_note?.trim() || null, plan_by: editing.plan_by?.trim() || null, plan_date: editing.plan_date ? frToISO(editing.plan_date) : null,
      low_threshold: editing.kind === 'measure' ? low : null, high_threshold: editing.kind === 'measure' ? high : null,
      thresholds_from_plan: editing.kind === 'measure' && (low != null || high != null) ? true : !!editing.thresholds_from_plan && editing.kind === 'measure',
      contexts: (editing.contexts ?? []).slice(0, 12),
    };
    setBusy(true);
    try {
      if (editing.id) await backend.update('child_health_trackers', row, [eq('id', editing.id)]);
      else await backend.insert('child_health_trackers', { ...row, child_id: child.id, household_id: child.household_id });
      inv('child_health_trackers');
      toast(tr('u4.ht.trackerSaved'));
      setEditing(null);
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }

  async function saveEntry() {
    if (!child || !entryFor) return;
    const v = value.trim() ? Number(value.replace(',', '.')) : null;
    if (entryFor.kind === 'measure' && (v == null || !Number.isFinite(v))) return toast(tr('u4.ht.needValue'), 'error');
    if (entryFor.kind === 'observation' && !note.trim()) return toast(tr('u4.ht.needObs'), 'error');
    setBusy(true);
    try {
      await insertOrQueue('child_health_entries', { tracker_id: entryFor.id, child_id: child.id, household_id: child.household_id, at: new Date().toISOString(), value: entryFor.kind === 'measure' ? v : null, context, note: note.trim() || null, source });
      inv('child_health_entries');
      const check = planCheck(entryFor, v);
      toast(entryFor.kind === 'measure' ? check.message : tr('u4.ht.obsNoted'), check.status === 'above' || check.status === 'below' ? 'info' : 'success');
      setEntryFor(null); setValue(''); setNote(''); setContext(null); setSource('parent');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }

  async function exportTracker(trk: Tracker) {
    const rows = (entriesQ.data ?? []).filter((e) => e.tracker_id === trk.id).sort((a, b) => (a.at < b.at ? -1 : 1));
    const cell = csvCell;
    const csv = `﻿${tr('u4.ht.csvTitle', { label: trk.label, name: child?.first_name ?? '' })}\r\n` + [[tr('u4.ht.csv.date'), tr('u4.ht.csv.time'), trk.kind === 'measure' ? tr('u4.ht.valueU', { unit: trk.unit ?? '' }) : tr('u4.ht.observation'), tr('u4.ht.csv.context'), tr('u4.ht.source'), tr('u4.wb.note')].map(cell).join(';'),
      ...rows.map((e) => { const d = new Date(e.at); return [d.toLocaleDateString(localeTag()), d.toLocaleTimeString(localeTag(), { hour: '2-digit', minute: '2-digit' }), e.value != null ? String(e.value).replace('.', ',') : '', e.context ?? '', sourceLabel(e.source), e.note ?? ''].map(cell).join(';'); })].join('\r\n');
    const r = await exportTextFile(csv, `${safeFileName(`${trk.label}-${child?.first_name ?? ''}`)}.csv`, 'text/csv', 'public.comma-separated-values-text', tr('u4.ht.export'));
    toast(r === 'text' ? tr('u4.ht.exportFail') : tr('u4.ht.exported'), r === 'text' ? 'error' : 'success');
  }

  async function removeTracker(trk: Tracker) {
    if (!(await confirm(tr('u4.ht.delQ'), tr('u4.ht.delBody', { label: trk.label }), tr('u4.ht.delete')))) return;
    try { await backend.remove('child_health_trackers', [eq('id', trk.id)]); inv('child_health_trackers', 'child_health_entries'); toast(tr('u4.ht.deleted')); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  const trackers = trackersQ.data ?? [];
  const activeTrackers = trackers.filter((x) => x.active !== false);
  const allEntries = entriesQ.data ?? [];
  const todayKey = new Date().toDateString();
  const todayCount = allEntries.filter((e) => new Date(e.at).toDateString() === todayKey).length;
  const lastEntry = allEntries[0];
  // Action principale : noter tout de suite (un seul suivi), choisir le suivi (plusieurs), ou en créer un (aucun)
  function quickNote() {
    if (activeTrackers.length === 1) setEntryFor(activeTrackers[0]);
    else if (activeTrackers.length > 1) setPick(true);
    else setEditing({ kind: 'observation', label: '', contexts: [] });
  }
  return (
    <Screen back title={tr('u4.ht.title')} subtitle={child ? tr('u4.ht.subtitle', { name: child.first_name }) : undefined}
      action={{ label: activeTrackers.length ? tr('u4.ht.noteNow') : tr('u4.ht.create'), icon: 'plus', onPress: quickNote, testID: 'health-main-action' }}>
      <TodaySummary items={[
        { icon: 'activity', value: String(activeTrackers.length), label: tr('u4.ht.sumTrackers') },
        { icon: 'edit-3', value: String(todayCount), label: tr('u4.ht.sumToday') },
        { icon: 'clock', value: lastEntry ? new Date(lastEntry.at).toLocaleDateString(localeTag(), { day: 'numeric', month: 'short' }) : '—', label: tr('u4.ht.sumLast') },
      ]} />
      <Banner tone="info" icon="info">{tr('u4.ht.banner')}</Banner>

      {trackersQ.isLoading && !trackersQ.data ? <Skeleton kind="card" rows={2} /> : null}
      {/* Erreur réseau : jamais présentée comme « aucun suivi » */}
      {trackersQ.isError && !trackersQ.data ? <ErrorView error={trackersQ.error} onRetry={() => void trackersQ.refetch()} title={tr('u4.ht.errTrackers')} /> : null}
      {trackersQ.data && entriesQ.isError && !entriesQ.data ? <ErrorView error={entriesQ.error} onRetry={() => void entriesQ.refetch()} title={tr('u4.ht.errNotes')} /> : null}
      {trackersQ.data && !trackers.length ? <EmptyState icon="activity" title={tr('u4.ht.emptyTitle')} body={tr('u4.ht.emptyBody')} /> : null}

      {trackers.map((trk, i) => {
        const list = (entriesQ.data ?? []).filter((e) => e.tracker_id === trk.id);
        const points = list.filter((e) => e.value != null).slice(0, 60).reverse().map((e) => ({ x: Date.parse(e.at), y: Number(e.value) }));
        return (
          <StaggerItem key={trk.id} index={i}>
            <Card>
              <Text weight="bold">{trk.label}{trk.unit ? ` (${trk.unit})` : ''}</Text>
              {trk.plan_by ? <Text variant="caption" muted>{tr('u4.ht.plan', { by: trk.plan_by })}{trk.plan_date ? `, ${new Date(trk.plan_date).toLocaleDateString(localeTag())}` : ''}{trk.thresholds_from_plan && (trk.low_threshold != null || trk.high_threshold != null) ? tr('u4.ht.thr', { low: trk.low_threshold ?? '—', high: trk.high_threshold ?? '—' }) : ''}</Text> : <Text variant="caption" muted>{tr('u4.ht.noPlan')}</Text>}
              {trk.plan_note ? <Text variant="small" style={{ marginTop: 4 }}>{tr('u4.ht.instr', { note: trk.plan_note })}</Text> : null}
              {points.length >= 2 ? <View style={{ marginTop: spacing.xs }}><LineChart points={points} unit={trk.unit ?? ''} accessibilityLabel={tr('u4.ht.evolution', { label: trk.label })} formatX={(x) => new Date(x).toLocaleDateString(localeTag(), { day: 'numeric', month: 'short' })} /></View> : null}
              {list.slice(0, 4).map((e) => (
                <ListRow key={e.id} icon={e.source === 'professional' ? 'check-circle' : e.source === 'imported' ? 'download' : 'user'} title={`${new Date(e.at).toLocaleString(localeTag(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}${e.value != null ? ` · ${formatNumber(Number(e.value), { maximumFractionDigits: 6 })} ${trk.unit ?? ''}` : ''}${e.context ? ` · ${e.context}` : ''}`} subtitle={[sourceLabel(e.source), e.note].filter(Boolean).join(' — ')} />
              ))}
              <Row wrap style={{ marginTop: spacing.xs }}>
                <Button label={trk.kind === 'measure' ? tr('u4.ht.noteMeasure') : tr('u4.ht.noteObs')} icon="plus" size="sm" onPress={() => setEntryFor(trk)} />
                <Button label={tr('u4.ht.edit')} size="sm" variant="secondary" onPress={() => setEditing({ ...trk, low: trk.low_threshold != null ? String(trk.low_threshold) : '', high: trk.high_threshold != null ? String(trk.high_threshold) : '', plan_date: trk.plan_date ? new Date(trk.plan_date).toLocaleDateString('fr-FR') : undefined })} />
                {list.length ? <Button label={tr('u4.ht.export')} size="sm" variant="ghost" icon="download" onPress={() => exportTracker(trk)} /> : null}
                <Button label={tr('u4.ht.delete')} size="sm" variant="ghost" onPress={() => removeTracker(trk)} />
              </Row>
            </Card>
          </StaggerItem>
        );
      })}

      <SectionTitle title={tr('u4.ht.createTitle')} />
      <Row wrap>
        {templates().map((m) => <Chip key={m.label} label={m.label} icon="plus" onPress={() => setEditing({ kind: m.kind, label: m.label, unit: m.unit ?? null, contexts: m.contexts })} />)}
        <Chip label={tr('u4.ht.blank')} icon="plus" onPress={() => setEditing({ kind: 'observation', label: '', contexts: [] })} />
      </Row>

      <Sheet visible={pick} onClose={() => setPick(false)} title={tr('u4.ht.pickTitle')}>
        <View style={{ gap: spacing.xs }}>
          {activeTrackers.map((x) => <ListRow key={x.id} icon={x.kind === 'measure' ? 'activity' : 'edit-3'} title={x.label} subtitle={x.kind === 'measure' ? tr('u4.ht.measure') : tr('u4.ht.observation')} onPress={() => { setPick(false); setEntryFor(x); }} />)}
        </View>
      </Sheet>

      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing?.id ? tr('u4.ht.editTracker') : tr('u4.ht.newTracker')}>
        {editing ? (
          <View style={{ gap: spacing.sm }}>
            <Segmented label={tr('u4.ht.type')} value={editing.kind ?? 'observation'} onChange={(k) => setEditing({ ...editing, kind: k })} options={[{ value: 'observation', label: tr('u4.ht.observations') }, { value: 'measure', label: tr('u4.ht.measures') }]} />
            <Field label={tr('u4.ht.name')} value={editing.label ?? ''} onChangeText={(v) => setEditing({ ...editing, label: v })} maxLength={80} />
            {editing.kind === 'measure' ? <Field label={tr('u4.ht.unit')} optional value={editing.unit ?? ''} onChangeText={(v) => setEditing({ ...editing, unit: v })} maxLength={20} placeholder={tr('u4.ht.unitPh')} /> : null}
            <Field label={tr('u4.ht.contexts')} optional hint={tr('u4.ht.commaSep')} value={(editing.contexts ?? []).join(', ')} onChangeText={(v) => setEditing({ ...editing, contexts: v.split(',').map((x) => x.trim()).filter(Boolean) })} />
            <Text variant="label">{tr('u4.ht.proPlan')}</Text>
            <Field label={tr('u4.ht.by')} optional value={editing.plan_by ?? ''} onChangeText={(v) => setEditing({ ...editing, plan_by: v })} maxLength={120} placeholder={tr('u4.ht.byPh')} />
            <Field label={tr('u4.ht.planDate')} optional value={editing.plan_date ?? ''} onChangeText={(v) => setEditing({ ...editing, plan_date: v })} placeholder={tr('u4.ht.planDatePh')} />
            <Field label={tr('u4.ht.planNote')} optional multiline value={editing.plan_note ?? ''} onChangeText={(v) => setEditing({ ...editing, plan_note: v })} maxLength={2000} hint={tr('u4.ht.planNoteHint')} />
            {editing.kind === 'measure' ? (
              <>
                <Row style={{ alignItems: 'flex-start' }}>
                  <Text style={{ flex: 1 }}>{tr('u4.ht.fromPlan')}</Text>
                  <Toggle label={tr('u4.ht.fromPlanA11y')} value={!!editing.thresholds_from_plan} onChange={(v) => setEditing({ ...editing, thresholds_from_plan: v })} />
                </Row>
                {editing.thresholds_from_plan ? (
                  <Row>
                    <View style={{ flex: 1 }}><Field label={tr('u4.ht.low')} optional value={editing.low ?? ''} onChangeText={(v) => setEditing({ ...editing, low: v })} keyboardType="decimal-pad" /></View>
                    <View style={{ flex: 1 }}><Field label={tr('u4.ht.high')} optional value={editing.high ?? ''} onChangeText={(v) => setEditing({ ...editing, high: v })} keyboardType="decimal-pad" /></View>
                  </Row>
                ) : <Text variant="caption" muted>{tr('u4.ht.noJudge')}</Text>}
              </>
            ) : null}
            <Button label={tr('u4.ht.save')} full onPress={saveTracker} loading={busy} />
          </View>
        ) : null}
      </Sheet>

      <Sheet visible={!!entryFor} onClose={() => setEntryFor(null)} title={entryFor?.label ?? ''}>
        {entryFor ? (
          <View style={{ gap: spacing.sm }}>
            {entryFor.kind === 'measure' ? <Field label={entryFor.unit ? tr('u4.ht.valueU', { unit: entryFor.unit }) : tr('u4.ht.value')} value={value} onChangeText={setValue} keyboardType="decimal-pad" /> : null}
            {entryFor.contexts.length ? <Row wrap>{entryFor.contexts.map((c) => <Chip key={c} label={c} selected={context === c} onPress={() => setContext(context === c ? null : c)} />)}</Row> : null}
            <Field label={entryFor.kind === 'measure' ? tr('u4.wb.note') : tr('u4.ht.whatObserved')} optional={entryFor.kind === 'measure'} multiline value={note} onChangeText={setNote} maxLength={2000} />
            <Text variant="label">{tr('u4.ht.source')}</Text>
            <Row wrap>{(Object.keys(SOURCE_KEY) as Entry['source'][]).map((k) => <Chip key={k} label={sourceLabel(k)} selected={source === k} onPress={() => setSource(k)} />)}</Row>
            <Button label={tr('u4.ht.save')} full onPress={saveEntry} loading={busy} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
