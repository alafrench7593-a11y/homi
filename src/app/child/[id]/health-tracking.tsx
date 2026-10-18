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
import { EmptyState, Skeleton } from '@/components/States';
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

interface Tracker { id: string; child_id: string; kind: 'measure' | 'observation'; label: string; unit: string | null; plan_note: string | null; plan_by: string | null; plan_date: string | null; low_threshold: number | null; high_threshold: number | null; thresholds_from_plan: boolean; contexts: string[]; active: boolean }
interface Entry { id: string; tracker_id: string; at: string; value: number | null; context: string | null; note: string | null; source: 'parent' | 'imported' | 'professional' }
const SOURCE_LABEL = { parent: 'Observation du parent', imported: 'Donnée importée', professional: 'Confirmé par un professionnel' } as const;

const TEMPLATES = [
  { kind: 'observation' as const, label: 'Attention et comportement', contexts: ['Maison', 'École', 'Activités', 'Devoirs'] },
  { kind: 'measure' as const, label: 'Glycémie capillaire', unit: 'g/L', contexts: ['À jeun', 'Avant repas', 'Après repas', 'Au coucher'] },
  { kind: 'observation' as const, label: 'Sommeil et fatigue', contexts: ['Nuit', 'Journée'] },
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

  async function saveTracker() {
    if (!child || !editing) return;
    if (!editing.label?.trim()) return toast('Donnez un nom à ce suivi.', 'error');
    const low = editing.low?.trim() ? Number(editing.low.replace(',', '.')) : null;
    const high = editing.high?.trim() ? Number(editing.high.replace(',', '.')) : null;
    if ((low != null && !Number.isFinite(low)) || (high != null && !Number.isFinite(high))) return toast('Repères non reconnus.', 'error');
    if ((low != null || high != null) && !(editing.thresholds_from_plan && editing.plan_by?.trim())) return toast('Les repères doivent venir du plan écrit par le professionnel : cochez la case et indiquez qui l’a établi.', 'error');
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
      toast('Suivi enregistré.');
      setEditing(null);
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }

  async function saveEntry() {
    if (!child || !entryFor) return;
    const v = value.trim() ? Number(value.replace(',', '.')) : null;
    if (entryFor.kind === 'measure' && (v == null || !Number.isFinite(v))) return toast('Indiquez la valeur mesurée.', 'error');
    if (entryFor.kind === 'observation' && !note.trim()) return toast('Décrivez ce que vous avez observé.', 'error');
    setBusy(true);
    try {
      await insertOrQueue('child_health_entries', { tracker_id: entryFor.id, child_id: child.id, household_id: child.household_id, at: new Date().toISOString(), value: entryFor.kind === 'measure' ? v : null, context, note: note.trim() || null, source });
      inv('child_health_entries');
      const check = planCheck(entryFor, v);
      toast(entryFor.kind === 'measure' ? check.message : 'Observation notée.', check.status === 'above' || check.status === 'below' ? 'info' : 'success');
      setEntryFor(null); setValue(''); setNote(''); setContext(null); setSource('parent');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }

  async function exportTracker(tr: Tracker) {
    const rows = (entriesQ.data ?? []).filter((e) => e.tracker_id === tr.id).sort((a, b) => (a.at < b.at ? -1 : 1));
    const cell = csvCell;
    const csv = `﻿# ${tr.label} — ${child?.first_name ?? ''} — saisies de la famille, à vérifier\r\n` + [['Date', 'Heure', tr.kind === 'measure' ? `Valeur (${tr.unit ?? ''})` : 'Observation', 'Contexte', 'Source', 'Note'].map(cell).join(';'),
      ...rows.map((e) => { const d = new Date(e.at); return [d.toLocaleDateString('fr-FR'), d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), e.value != null ? String(e.value).replace('.', ',') : '', e.context ?? '', SOURCE_LABEL[e.source], e.note ?? ''].map(cell).join(';'); })].join('\r\n');
    const r = await exportTextFile(csv, `${safeFileName(`${tr.label}-${child?.first_name ?? ''}`)}.csv`, 'text/csv', 'public.comma-separated-values-text', 'Exporter');
    toast(r === 'text' ? 'Export impossible sur cet appareil.' : 'Historique exporté.', r === 'text' ? 'error' : 'success');
  }

  async function removeTracker(tr: Tracker) {
    if (!(await confirm('Supprimer ce suivi ?', `« ${tr.label} » et toutes ses entrées seront supprimés.`, 'Supprimer'))) return;
    try { await backend.remove('child_health_trackers', [eq('id', tr.id)]); inv('child_health_trackers', 'child_health_entries'); toast('Suivi supprimé.'); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  const trackers = trackersQ.data ?? [];
  return (
    <Screen back title="Suivi de santé" subtitle={child ? `${child.first_name} — pour préparer les consultations` : undefined}>
      <Banner tone="info" icon="info">{'Cet espace aide à noter et à retrouver des informations. Il ne pose aucun diagnostic, ne donne aucun score et n’indique jamais de dose ni de traitement. Les repères affichés sont uniquement ceux du plan écrit par le professionnel qui suit votre enfant.'}</Banner>

      {trackersQ.isLoading && !trackersQ.data ? <Skeleton kind="card" rows={2} /> : null}
      {trackersQ.data && !trackers.length ? <EmptyState icon="activity" title="Aucun suivi pour l’instant" body="Partez d’un modèle ci-dessous ou créez le vôtre." /> : null}

      {trackers.map((tr, i) => {
        const list = (entriesQ.data ?? []).filter((e) => e.tracker_id === tr.id);
        const points = list.filter((e) => e.value != null).slice(0, 60).reverse().map((e) => ({ x: Date.parse(e.at), y: Number(e.value) }));
        return (
          <StaggerItem key={tr.id} index={i}>
            <Card>
              <Text weight="bold">{tr.label}{tr.unit ? ` (${tr.unit})` : ''}</Text>
              {tr.plan_by ? <Text variant="caption" muted>Plan : {tr.plan_by}{tr.plan_date ? `, ${new Date(tr.plan_date).toLocaleDateString('fr-FR')}` : ''}{tr.thresholds_from_plan && (tr.low_threshold != null || tr.high_threshold != null) ? ` · repères ${tr.low_threshold ?? '—'} à ${tr.high_threshold ?? '—'}` : ''}</Text> : <Text variant="caption" muted>Aucun plan renseigné : les valeurs ne sont pas interprétées.</Text>}
              {tr.plan_note ? <Text variant="small" style={{ marginTop: 4 }}>Consignes : {tr.plan_note}</Text> : null}
              {points.length >= 2 ? <View style={{ marginTop: spacing.xs }}><LineChart points={points} unit={tr.unit ?? ''} accessibilityLabel={`Évolution de ${tr.label}`} formatX={(x) => new Date(x).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} /></View> : null}
              {list.slice(0, 4).map((e) => (
                <ListRow key={e.id} icon={e.source === 'professional' ? 'check-circle' : e.source === 'imported' ? 'download' : 'user'} title={`${new Date(e.at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}${e.value != null ? ` · ${String(e.value).replace('.', ',')} ${tr.unit ?? ''}` : ''}${e.context ? ` · ${e.context}` : ''}`} subtitle={[SOURCE_LABEL[e.source], e.note].filter(Boolean).join(' — ')} />
              ))}
              <Row wrap style={{ marginTop: spacing.xs }}>
                <Button label={tr.kind === 'measure' ? 'Noter une mesure' : 'Noter une observation'} icon="plus" size="sm" onPress={() => setEntryFor(tr)} />
                <Button label="Modifier" size="sm" variant="secondary" onPress={() => setEditing({ ...tr, low: tr.low_threshold != null ? String(tr.low_threshold) : '', high: tr.high_threshold != null ? String(tr.high_threshold) : '', plan_date: tr.plan_date ? new Date(tr.plan_date).toLocaleDateString('fr-FR') : undefined })} />
                {list.length ? <Button label="Exporter" size="sm" variant="ghost" icon="download" onPress={() => exportTracker(tr)} /> : null}
                <Button label="Supprimer" size="sm" variant="ghost" onPress={() => removeTracker(tr)} />
              </Row>
            </Card>
          </StaggerItem>
        );
      })}

      <SectionTitle title="Créer un suivi" />
      <Row wrap>
        {TEMPLATES.map((m) => <Chip key={m.label} label={m.label} icon="plus" onPress={() => setEditing({ kind: m.kind, label: m.label, unit: m.unit ?? null, contexts: m.contexts })} />)}
        <Chip label="Suivi vide" icon="plus" onPress={() => setEditing({ kind: 'observation', label: '', contexts: [] })} />
      </Row>

      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Modifier le suivi' : 'Nouveau suivi'}>
        {editing ? (
          <View style={{ gap: spacing.sm }}>
            <Segmented label="Type" value={editing.kind ?? 'observation'} onChange={(k) => setEditing({ ...editing, kind: k })} options={[{ value: 'observation', label: 'Observations' }, { value: 'measure', label: 'Mesures' }]} />
            <Field label="Nom" value={editing.label ?? ''} onChangeText={(v) => setEditing({ ...editing, label: v })} maxLength={80} />
            {editing.kind === 'measure' ? <Field label="Unité" optional value={editing.unit ?? ''} onChangeText={(v) => setEditing({ ...editing, unit: v })} maxLength={20} placeholder="g/L, mmol/L, °C…" /> : null}
            <Field label="Contextes" optional hint="Séparés par des virgules." value={(editing.contexts ?? []).join(', ')} onChangeText={(v) => setEditing({ ...editing, contexts: v.split(',').map((x) => x.trim()).filter(Boolean) })} />
            <Text variant="label">Plan du professionnel (facultatif)</Text>
            <Field label="Établi par" optional value={editing.plan_by ?? ''} onChangeText={(v) => setEditing({ ...editing, plan_by: v })} maxLength={120} placeholder="Dr Martin, diabétologue" />
            <Field label="Date du plan" optional value={editing.plan_date ?? ''} onChangeText={(v) => setEditing({ ...editing, plan_date: v })} placeholder="JJ/MM/AAAA" />
            <Field label="Consignes recopiées du plan" optional multiline value={editing.plan_note ?? ''} onChangeText={(v) => setEditing({ ...editing, plan_note: v })} maxLength={2000} hint="Recopiez-les telles qu’écrites : l’application ne les modifie ni ne les complète." />
            {editing.kind === 'measure' ? (
              <>
                <Row style={{ alignItems: 'flex-start' }}>
                  <Text style={{ flex: 1 }}>Ces repères viennent du plan écrit par le professionnel de mon enfant</Text>
                  <Toggle label="Repères issus du plan du professionnel" value={!!editing.thresholds_from_plan} onChange={(v) => setEditing({ ...editing, thresholds_from_plan: v })} />
                </Row>
                {editing.thresholds_from_plan ? (
                  <Row>
                    <View style={{ flex: 1 }}><Field label="Repère bas" optional value={editing.low ?? ''} onChangeText={(v) => setEditing({ ...editing, low: v })} keyboardType="decimal-pad" /></View>
                    <View style={{ flex: 1 }}><Field label="Repère haut" optional value={editing.high ?? ''} onChangeText={(v) => setEditing({ ...editing, high: v })} keyboardType="decimal-pad" /></View>
                  </Row>
                ) : <Text variant="caption" muted>Sans plan, aucune valeur n’est jugée « haute » ou « basse ». Il n’existe pas de valeur universelle valable pour tous les enfants.</Text>}
              </>
            ) : null}
            <Button label="Enregistrer" full onPress={saveTracker} loading={busy} />
          </View>
        ) : null}
      </Sheet>

      <Sheet visible={!!entryFor} onClose={() => setEntryFor(null)} title={entryFor?.label ?? ''}>
        {entryFor ? (
          <View style={{ gap: spacing.sm }}>
            {entryFor.kind === 'measure' ? <Field label={`Valeur${entryFor.unit ? ` (${entryFor.unit})` : ''}`} value={value} onChangeText={setValue} keyboardType="decimal-pad" /> : null}
            {entryFor.contexts.length ? <Row wrap>{entryFor.contexts.map((c) => <Chip key={c} label={c} selected={context === c} onPress={() => setContext(context === c ? null : c)} />)}</Row> : null}
            <Field label={entryFor.kind === 'measure' ? 'Note' : 'Ce que vous avez observé'} optional={entryFor.kind === 'measure'} multiline value={note} onChangeText={setNote} maxLength={2000} />
            <Text variant="label">Source</Text>
            <Row wrap>{(Object.keys(SOURCE_LABEL) as Entry['source'][]).map((k) => <Chip key={k} label={SOURCE_LABEL[k]} selected={source === k} onPress={() => setSource(k)} />)}</Row>
            <Button label="Enregistrer" full onPress={saveEntry} loading={busy} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
