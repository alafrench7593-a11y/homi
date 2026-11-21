/**
 * 42 — Suivi des analyses médicales (dans le coffre de documents) : les valeurs d'un compte rendu, saisies une à une
 * (nom, valeur, unité, date, référence du laboratoire RECOPIÉE telle quelle), reliées au document s'il existe, et une
 * courbe par analyse. Privé : visible de la personne seule. HOMI ne compare jamais une valeur à une norme et n'en tire
 * aucune conclusion : la lecture d'un résultat appartient au professionnel de santé.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { LineChart } from '@/components/Charts';
import { Banner, Button, Card, Chip, Field, Icon, ListGroup, ListRow, Row, Text } from '@/components/ui';
import { WhenFields, whenDay, whenOf, type WhenValue } from '@/components/CareInputs';
import { formatDate, getLocale, t as tr } from '@/i18n';
import { useActivePregnancy, useDocuments } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteLab, useLabResults, useSaveLab } from '@/lib/data/hooks-partiels';
import { todayISO } from '@/lib/domain/dates';
import { cleanName, curvePoints, formatLabValue, groupByAnalysis, knownNames, parseLabValue, validateLab, type AnalysisGroup, type LabResult } from '@/features/labs/domain';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { MotionItem, MotionList } from '@/motion/ListMotion';

const LAB_CATEGORIES = new Set(['blood_test', 'exam_result', 'report', 'prenatal', 'pregnancy_report', 'postnatal', 'consultation', 'other', 'custom']);
const DAY = { day: 'numeric', month: 'short', year: 'numeric' } as const;
const fmtDay = (iso: string) => formatDate(`${iso}T12:00:00`, DAY);
const comma = () => getLocale() !== 'en';
const valueLine = (r: Pick<LabResult, 'value' | 'unit'>) => `${formatLabValue(r.value, comma())}${r.unit ? ` ${r.unit}` : ''}`;

function LabSheet({ lab, preset, visible, onClose, names }: {
  lab: LabResult | null; preset: { name?: string; docId?: string | null; unit?: string | null; reference?: string | null } | null; visible: boolean; onClose: () => void; names: string[];
}) {
  const toast = useToast();
  const save = useSaveLab();
  const del = useDeleteLab();
  const pregnancy = useActivePregnancy();
  const docs = (useDocuments().data ?? []).filter((d) => LAB_CATEGORIES.has(d.category) && !d.archived).slice(0, 12);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [when, setWhen] = useState<WhenValue>(whenOf());
  const [ref, setRef] = useState('');
  const [doc, setDoc] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  React.useEffect(() => {
    if (!visible) return;
    setName(lab?.name ?? preset?.name ?? ''); setValue(lab ? formatLabValue(lab.value, comma()) : ''); setUnit(lab?.unit ?? preset?.unit ?? '');
    setWhen(whenOf(lab ? `${lab.measured_on}T12:00:00` : undefined)); setRef(lab?.lab_reference ?? preset?.reference ?? ''); setDoc(lab?.document_id ?? preset?.docId ?? null);
    setNote(lab?.note ?? ''); setErr(null);
  }, [visible, lab?.id, preset?.name, preset?.docId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!visible) return null;
  const suggestions = names.filter((n) => n !== cleanName(name)).slice(0, 8);
  async function submit() {
    const v = parseLabValue(value);
    const date = whenDay(when);
    const e = validateLab({ name, value: v, date, unit, reference: ref }, todayISO());
    if (e) return setErr(tr(e));
    try {
      const r = await save.mutateAsync({
        ...(lab ?? {}), name: cleanName(name), value: v!, unit: unit.trim() || null, measured_on: date!, lab_reference: ref.trim() || null,
        document_id: doc, note: note.trim() || null, pregnancy_id: lab?.pregnancy_id ?? pregnancy?.id ?? null,
      });
      toast(r.queued ? tr('lab.savedOffline') : tr('lab.saved'), 'success'); onClose();
    } catch (x) { setErr(friendlyError(x)); }
  }
  async function remove() {
    if (!lab || !(await confirm(tr('lab.delete'), tr('lab.deleteQ'), tr('lab.delete')))) return;
    try { await del.mutateAsync(lab.id); toast(tr('lab.deleted'), 'success'); onClose(); } catch (x) { toast(friendlyError(x), 'error'); }
  }
  return (
    <GlassSheet visible onClose={onClose} title={lab ? tr('lab.edit') : tr('lab.add')}>
      <Field label={tr('lab.name')} value={name} onChangeText={setName} maxLength={80} placeholder={tr('lab.namePh')} testID="lab-f-name" />
      {suggestions.length ? <Row wrap>{suggestions.map((n) => <Chip key={n} label={n} onPress={() => setName(n)} testID={`lab-f-known-${n}`} />)}</Row> : null}
      <Row style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1.2 }}><Field label={tr('lab.value')} value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder="12,4" testID="lab-f-value" /></View>
        <View style={{ flex: 1 }}><Field label={tr('lab.unit')} optional value={unit} onChangeText={setUnit} maxLength={24} placeholder="g/dL" autoCapitalize="none" testID="lab-f-unit" /></View>
      </Row>
      <WhenFields value={when} onChange={setWhen} withTime={false} days="past" dateLabel={tr('lab.date')} testID="lab-f-date" />
      <Field label={tr('lab.reference')} optional value={ref} onChangeText={setRef} maxLength={80} placeholder={tr('lab.referencePh')} hint={tr('lab.referenceHint')} testID="lab-f-ref" />
      <Text variant="label">{tr('lab.document')}</Text>
      {docs.length ? (
        <Row wrap>
          <Chip label={tr('lab.noDocument')} selected={!doc} onPress={() => setDoc(null)} testID="lab-f-doc-none" />
          {docs.map((d) => <Chip key={d.id} label={d.title} icon="file-text" selected={doc === d.id} onPress={() => setDoc(d.id)} testID={`lab-f-doc-${d.id}`} />)}
        </Row>
      ) : <Text variant="caption" muted>{tr('lab.noDocs')}</Text>}
      <Field label={tr('lab.note')} optional value={note} onChangeText={setNote} maxLength={500} multiline testID="lab-f-note" />
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="lab-f-save" />
      {lab ? <Button label={tr('lab.delete')} variant="ghost" icon="trash-2" onPress={() => void remove()} testID="lab-f-delete" /> : null}
    </GlassSheet>
  );
}

function AnalysisCard({ g, open, onToggle, onEdit, onAdd, docTitle }: {
  g: AnalysisGroup; open: boolean; onToggle: () => void; onEdit: (r: LabResult) => void; onAdd: () => void; docTitle: (id: string | null) => string | null;
}) {
  const t = useTheme();
  const pts = curvePoints(g);
  const prev = g.entries.length > 1 ? g.entries[g.entries.length - 2] : null;
  const slug = g.key.replace(/[^a-z0-9]+/g, '-');
  return (
    <Card onPress={onToggle} accessibilityLabel={tr('lab.cardA11y', { name: g.name, value: valueLine(g.last), date: fmtDay(g.last.measured_on) })} testID={`lab-group-${slug}`}>
      <Row style={{ alignItems: 'flex-start' }}>
        <Icon name="activity" color={t.colors.lavender} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight="bold">{g.name}</Text>
          <Text testID={`lab-last-${slug}`}>{tr('lab.last', { value: valueLine(g.last), date: fmtDay(g.last.measured_on) })}</Text>
          {g.last.lab_reference ? <Text variant="small" muted>{tr('lab.refLine', { ref: g.last.lab_reference })}</Text> : null}
          {prev ? <Text variant="caption" muted>{tr('lab.previous', { value: valueLine(prev), date: fmtDay(prev.measured_on) })}</Text> : null}
          <Text variant="caption" muted>{tr('lab.count', { count: g.entries.length })}</Text>
        </View>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={t.colors.textMuted} />
      </Row>
      {open ? (
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }} testID={`lab-detail-${slug}`}>
          {pts.length >= 2 ? (
            <LineChart points={pts} unit={g.unit ?? ''} accessibilityLabel={tr('lab.chartA11y', { name: g.name, count: pts.length })}
              formatX={(x) => formatDate(new Date(x), { day: 'numeric', month: 'short' })} />
          ) : <Text variant="caption" muted>{tr('lab.chartNeedsTwo')}</Text>}
          {g.otherUnits ? <Text variant="caption" muted>{tr('lab.otherUnits', { count: g.otherUnits })}</Text> : null}
          <ListGroup>
            {[...g.entries].reverse().map((r) => (
              <ListRow key={r.id} icon={r.document_id ? 'file-text' : 'edit-3'} title={`${fmtDay(r.measured_on)} · ${valueLine(r)}`}
                subtitle={[r.lab_reference ? tr('lab.refLine', { ref: r.lab_reference }) : null, docTitle(r.document_id), r.note, r._pending ? tr('lab.pending') : null].filter(Boolean).join(' · ') || undefined}
                onPress={() => onEdit(r)} testID={`lab-row-${slug}-${r.measured_on}`}
                right={r.document_id ? <Button label={tr('lab.seeDoc')} size="sm" variant="ghost" onPress={() => router.push(`/documents/${r.document_id}`)} /> : undefined} />
            ))}
          </ListGroup>
          <Button label={tr('lab.addValue', { name: g.name })} icon="plus" size="sm" variant="secondary" onPress={onAdd} testID={`lab-add-${slug}`} />
        </View>
      ) : null}
    </Card>
  );
}

export default function LabResults() {
  const params = useLocalSearchParams<{ doc?: string; name?: string }>();
  const q = useLabResults();
  const docsQ = useDocuments();
  const list = useMemo(() => q.data ?? [], [q.data]);
  const groups = useMemo(() => groupByAnalysis(list), [list]);
  const names = useMemo(() => knownNames(list), [list]);
  const [open, setOpen] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ lab: LabResult | null; preset: { name?: string; docId?: string | null; unit?: string | null; reference?: string | null } | null } | null>(null);
  const handled = React.useRef(false);
  React.useEffect(() => {
    if (handled.current || !q.data) return;
    handled.current = true;
    if (typeof params.doc === 'string') setSheet({ lab: null, preset: { docId: params.doc } });
    else if (typeof params.name === 'string') setOpen(groupByAnalysis(q.data).find((g) => g.name === params.name)?.key ?? null);
  }, [q.data, params.doc, params.name]);
  const docTitle = (id: string | null) => (id ? docsQ.data?.find((d) => d.id === id)?.title ?? tr('lab.docLinked') : null);
  const fromDoc = typeof params.doc === 'string' ? docsQ.data?.find((d) => d.id === params.doc) : undefined;

  return (
    <Screen back title={tr('lab.title')} subtitle={tr('lab.subtitle')} tool={false}
      action={{ label: tr('lab.add'), icon: 'plus', onPress: () => setSheet({ lab: null, preset: fromDoc ? { docId: fromDoc.id } : null }), testID: 'lab-add' }}>
      <Text muted>{tr('lab.intro')}</Text>
      {fromDoc ? <View testID="lab-from-doc"><Banner tone="info" icon="file-text">{tr('lab.fromDoc', { title: fromDoc.title })}</Banner></View> : null}
      {q.isLoading && !q.data ? <Skeleton rows={3} /> : null}
      {q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} title={tr('lab.loadErr')} /> : null}
      {q.data && !groups.length ? (
        <EmptyState icon="activity" title={tr('lab.emptyTitle')} body={tr('lab.emptyBody')} action={{ label: tr('lab.add'), onPress: () => setSheet({ lab: null, preset: null }) }} />
      ) : null}
      <MotionList>{groups.map((g) => (
        <MotionItem key={g.key}><AnalysisCard key={g.key} g={g} open={open === g.key} onToggle={() => setOpen(open === g.key ? null : g.key)} docTitle={docTitle}
          onEdit={(r) => setSheet({ lab: r, preset: null })} onAdd={() => setSheet({ lab: null, preset: { name: g.name, docId: fromDoc?.id ?? null, unit: g.unit, reference: g.last.lab_reference } })} /></MotionItem>
      ))}</MotionList>
      <View testID="lab-no-advice"><Banner tone="info" icon="info">{tr('lab.noAdvice')}</Banner></View>
      <Text variant="caption" muted>{tr('lab.private')}</Text>
      <Button label={tr('lab.toDocuments')} variant="ghost" icon="folder" onPress={() => router.push('/documents')} />
      <LabSheet lab={sheet?.lab ?? null} preset={sheet?.preset ?? null} visible={!!sheet} onClose={() => setSheet(null)} names={names} />
    </Screen>
  );
}
