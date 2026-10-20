/**
 * Neurodéveloppement et besoins particuliers d'un enfant.
 *  - Catégories : TDAH, TSA, troubles DYS, langage, TDC, tics et Gilles de la Tourette, sensoriel, diagnostic en cours, autre.
 *  - Suivi : rendez-vous, bilans, professionnels, observations, progrès, émotions, sommeil, routines, école ; documents.
 *  - Traitements prescrits : recopiés EXACTEMENT de l'ordonnance (nom, dose, heures, fréquence, dates, instructions),
 *    rappels avec « Pris », « Reporter », « Ignorer », « Ajouter une note ».
 * L'application ne calcule jamais une dose, ne modifie pas un traitement et ne pose aucun diagnostic.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, haptic, ListRow, Row, Segmented, SectionTitle, Text, Toggle } from '@/components/ui';
import { dosesFor, needLabel, type Dose } from '@/features/needs';
import { useChild } from '@/lib/data/hooks';
import { useNow } from '@/lib/data/hooks-bottle';
import { friendlyError } from '@/lib/data/hooks-settings';
import {
  ENTRY_KINDS, NEED_KINDS, useAddNeedEntry, useChildNeeds, useDeleteNeedEntry, useDeleteTreatment, useLogDose, useNeedEntries, useSaveNeeds, useSaveTreatment,
  useTreatmentLogs, useTreatments, type EntryKind, type NeedKind, type Treatment,
} from '@/lib/data/hooks-needs';
import { formatDateFr, frToISO, todayISO } from '@/lib/domain/dates';
import { snoozeLocally } from '@/lib/notifications';
import { toFrDate } from '@/lib/validation';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

type Tab = 'profile' | 'follow' | 'treatments';

export default function ChildNeeds() {
  const params = useLocalSearchParams<{ id: string; tab?: Tab; dose?: string }>();
  const child = useChild(params.id);
  const [tab, setTab] = useState<Tab>(params.tab === 'treatments' || params.tab === 'follow' ? params.tab : 'profile');
  if (!child) return <Screen back title={tr('nd.title')}><Skeleton kind="detail" rows={4} /></Screen>;
  return (
    <Screen back title={tr('nd.title')} subtitle={child.first_name}>
      <Banner tone="info">{tr('nd.disclaimer')}</Banner>
      <Segmented label={tr('nd.title')} value={tab} onChange={setTab} options={[
        { value: 'profile', label: tr('nd.tab.profile') }, { value: 'follow', label: tr('nd.tab.follow') }, { value: 'treatments', label: tr('nd.tab.treatments') },
      ]} />
      {tab === 'profile' && <NeedsProfile childId={child.id} />}
      {tab === 'follow' && <FollowUp childId={child.id} />}
      {tab === 'treatments' && <Treatments childId={child.id} childName={child.first_name} noteDose={params.dose} />}
    </Screen>
  );
}

// ---------------------------------------------------------------- catégories
function NeedsProfile({ childId }: { childId: string }) {
  const toast = useToast();
  const { data: needs, isLoading } = useChildNeeds(childId);
  const save = useSaveNeeds();
  const [kinds, setKinds] = useState<NeedKind[]>([]);
  const [other, setOther] = useState('');
  const [notes, setNotes] = useState('');
  useEffect(() => { if (needs) { setKinds(needs.kinds); setOther(needs.other_label ?? ''); setNotes(needs.notes ?? ''); } }, [needs]);
  if (isLoading) return <Skeleton rows={3} />;
  const toggle = (k: NeedKind) => setKinds((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]));
  return (
    <View style={{ gap: spacing.sm }}>
      <Text muted>{tr('nd.profile.intro')}</Text>
      <Row wrap>
        {NEED_KINDS.map((k) => <Chip key={k} label={needLabel(k)} selected={kinds.includes(k)} onPress={() => { haptic('selection'); toggle(k); }} accessibilityLabel={needLabel(k)} />)}
      </Row>
      {kinds.includes('other') ? <Field label={tr('nd.profile.other')} value={other} onChangeText={setOther} maxLength={80} /> : null}
      <Field label={tr('nd.profile.notes')} optional value={notes} onChangeText={setNotes} multiline maxLength={4000} hint={tr('nd.profile.notesHint')} />
      <Button label={tr('common.save')} loading={save.isPending} testID="needs-save" onPress={async () => {
        try { await save.mutateAsync({ id: needs?.id, child_id: childId, kinds, other_label: kinds.includes('other') ? other.trim() || null : null, notes: notes.trim() || null }); toast(tr('nd.saved'), 'success'); }
        catch (e) { toast(friendlyError(e), 'error'); }
      }} />
      <Text variant="caption" muted>{tr('nd.profile.private')}</Text>
    </View>
  );
}

// ---------------------------------------------------------------- suivi
function FollowUp({ childId }: { childId: string }) {
  const toast = useToast();
  const [filter, setFilter] = useState<EntryKind | null>(null);
  const { data: entries, isLoading } = useNeedEntries(childId, filter);
  const add = useAddNeedEntry();
  const del = useDeleteNeedEntry();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<EntryKind>('observation');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState(toFrDate(todayISO()));
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    const iso = frToISO(date);
    if (!title.trim()) { setErr(tr('nd.entry.errTitle')); return; }
    if (!iso) { setErr(tr('pj.start.err.format')); return; }
    try {
      await add.mutateAsync({ child_id: childId, kind, title: title.trim(), body: body.trim() || null, occurred_on: iso });
      setOpen(false); setTitle(''); setBody(''); setErr(null);
      toast(tr('nd.saved'), 'success');
    } catch (e) { setErr(friendlyError(e)); }
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <Row wrap>
        <Chip label={tr('nd.entry.all')} selected={!filter} onPress={() => setFilter(null)} />
        {ENTRY_KINDS.map((k) => <Chip key={k} label={tr(`nd.entry.${k}` as TKey)} selected={filter === k} onPress={() => setFilter(filter === k ? null : k)} />)}
      </Row>
      <Button label={tr('nd.entry.add')} icon="plus" onPress={() => { setKind(filter ?? 'observation'); setOpen(true); }} testID="entry-add" />
      <Card>
        <ListRow icon="calendar" title={tr('tool.appointments')} onPress={() => router.push(`/appointments?child=${childId}`)} />
        <ListRow icon="folder" title={tr('tool.documents')} subtitle={tr('nd.docsHint')} onPress={() => router.push(`/documents?child=${childId}`)} />
      </Card>
      {isLoading ? <Skeleton rows={3} /> : !entries?.length ? <EmptyState icon="list" title={tr('nd.entry.none')} /> : (
        <Card>
          {entries.map((e) => (
            <ListRow key={e.id} icon="file-text" title={e.title} subtitle={`${tr(`nd.entry.${e.kind}` as TKey)} · ${formatDateFr(e.occurred_on)}${e.body ? ` · ${e.body}` : ''}`}
              onPress={async () => { if (await confirm(tr('nd.entry.deleteTitle'), e.title, tr('common.delete'))) await del.mutateAsync(e.id).catch(() => undefined); }} />
          ))}
        </Card>
      )}
      <Sheet visible={open} onClose={() => setOpen(false)} title={tr('nd.entry.add')}>
        {err ? <Banner tone="danger">{err}</Banner> : null}
        <Row wrap>{ENTRY_KINDS.map((k) => <Chip key={k} label={tr(`nd.entry.${k}` as TKey)} selected={kind === k} onPress={() => setKind(k)} />)}</Row>
        <Field label={tr('nd.entry.title')} value={title} onChangeText={setTitle} maxLength={120} testID="entry-title" />
        <Field label={tr('nd.entry.date')} value={date} onChangeText={setDate} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" />
        <Field label={tr('nd.entry.body')} optional value={body} onChangeText={setBody} multiline maxLength={4000} />
        <Button label={tr('common.save')} loading={add.isPending} onPress={() => save()} testID="entry-save" />
      </Sheet>
    </View>
  );
}

// ---------------------------------------------------------------- traitements
interface TDraft { name: string; dose: string; times: string; frequency: Treatment['frequency']; weekdays: number[]; start: string; end: string; instructions: string; prescriber: string; reminders: boolean; active: boolean }
const emptyT = (): TDraft => ({ name: '', dose: '', times: '', frequency: 'daily', weekdays: [], start: toFrDate(todayISO()), end: '', instructions: '', prescriber: '', reminders: true, active: true });
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

function validateT(d: TDraft): { errors: Record<string, string>; row?: Omit<Treatment, 'id' | 'household_id' | 'created_at' | 'child_id'> } {
  const e: Record<string, string> = {};
  if (!d.name.trim()) e.name = tr('nd.t.err.name');
  if (!d.dose.trim()) e.dose = tr('nd.t.err.dose');
  const times = d.times.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean);
  if (d.frequency !== 'as_prescribed' && (!times.length || times.length > 6 || times.some((x) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(x)))) e.times = tr('nd.t.err.times');
  if (d.frequency === 'weekly' && !d.weekdays.length) e.weekdays = tr('nd.t.err.weekdays');
  const start = frToISO(d.start);
  if (!start) e.start = tr('pj.start.err.format');
  const end = d.end.trim() ? frToISO(d.end) : null;
  if (d.end.trim() && !end) e.end = tr('pj.start.err.format');
  else if (end && start && end < start) e.end = tr('nd.t.err.end');
  if (Object.keys(e).length) return { errors: e };
  return {
    errors: e,
    row: {
      name: d.name.trim(), dose_text: d.dose.trim(), times: times.length ? [...new Set(times)].sort() : ['08:00'], frequency: d.frequency, weekdays: d.frequency === 'weekly' ? d.weekdays : [],
      start_date: start!, end_date: end, instructions: d.instructions.trim() || null, prescriber: d.prescriber.trim() || null, active: d.active,
    },
  };
}

function Treatments({ childId, childName, noteDose }: { childId: string; childName: string; noteDose?: string }) {
  const toast = useToast();
  const now = useNow(60_000);
  const { data: treatments, isLoading } = useTreatments(childId);
  const ids = (treatments ?? []).map((x) => x.id);
  const dayStart = useMemo(() => { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }, [now.toDateString()]); // eslint-disable-line react-hooks/exhaustive-deps
  const { data: logs } = useTreatmentLogs(ids, dayStart.toISOString());
  const doses = useMemo(() => dosesFor(dayStart, treatments ?? [], logs ?? []), [dayStart, treatments, logs]);
  const save = useSaveTreatment();
  const remove = useDeleteTreatment();
  const logDose = useLogDose();
  const [editing, setEditing] = useState<Treatment | 'new' | null>(null);
  const [draft, setDraft] = useState<TDraft>(emptyT());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [noteFor, setNoteFor] = useState<Dose | null>(null);
  const [note, setNote] = useState('');

  // Ouverture depuis la notification « Ajouter une note »
  useEffect(() => {
    if (!noteDose || noteFor) return;
    const d = doses.find((x) => x.time === noteDose);
    if (d) { setNoteFor(d); setNote(d.log?.note ?? ''); }
  }, [noteDose, doses]); // eslint-disable-line react-hooks/exhaustive-deps

  function edit(t: Treatment | 'new') {
    setEditing(t);
    setErrors({});
    setDraft(t === 'new' ? emptyT() : {
      name: t.name, dose: t.dose_text, times: t.times.join(', '), frequency: t.frequency, weekdays: t.weekdays, start: toFrDate(t.start_date), end: t.end_date ? toFrDate(t.end_date) : '',
      instructions: t.instructions ?? '', prescriber: t.prescriber ?? '', reminders: true, active: t.active,
    });
  }
  async function submit() {
    const v = validateT(draft);
    setErrors(v.errors);
    if (!v.row) return;
    try {
      await save.mutateAsync({ id: editing && editing !== 'new' ? editing.id : null, childName, reminders: draft.reminders, row: { ...v.row, child_id: childId } });
      setEditing(null);
      toast(tr('nd.t.saved'), 'success');
    } catch (e) { setErrors({ form: friendlyError(e) }); }
  }
  async function answer(d: Dose, status: 'taken' | 'snoozed' | 'skipped', withNote?: string | null) {
    try {
      await logDose.mutateAsync({ treatment_id: d.treatment.id, scheduled_for: d.scheduledFor, status, note: withNote ?? d.log?.note ?? null, existingId: d.log?.id });
      if (status === 'snoozed') await snoozeLocally(`${childName} · ${d.treatment.name}`, d.treatment.dose_text, `/child/${childId}/needs?tab=treatments`).catch(() => undefined);
      haptic('success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  const set = <K extends keyof TDraft>(k: K, v: TDraft[K]) => setDraft((x) => ({ ...x, [k]: v }));

  return (
    <View style={{ gap: spacing.sm }}>
      <Banner tone="warning">{tr('nd.t.rule')}</Banner>
      <SectionTitle title={tr('nd.t.today')} />
      {isLoading ? <Skeleton rows={2} /> : !doses.length ? <Text muted>{tr('nd.t.noDose')}</Text> : doses.map((d) => (
        <Card key={`${d.treatment.id}-${d.time}`}>
          <View testID={`dose-${d.time}`}>
            <Text weight="bold">{d.time} · {d.treatment.name}</Text>
            <Text variant="small">{d.treatment.dose_text}</Text>
            {d.treatment.instructions ? <Text variant="small" muted>{d.treatment.instructions}</Text> : null}
            {d.log ? <Text variant="small" weight="bold" style={{ marginTop: 4 }} testID={`dose-status-${d.time}`}>{tr(`nd.t.status.${d.log.status}` as TKey)}{d.log.note ? ` · ${d.log.note}` : ''}</Text> : null}
            <Row wrap style={{ marginTop: spacing.xs }}>
              <Button label={tr('nd.t.taken')} size="sm" onPress={() => answer(d, 'taken')} testID={`dose-taken-${d.time}`} />
              <Button label={tr('nd.t.snooze')} size="sm" variant="secondary" onPress={() => answer(d, 'snoozed')} />
              <Button label={tr('nd.t.skip')} size="sm" variant="secondary" onPress={() => answer(d, 'skipped')} />
              <Button label={tr('nd.t.note')} size="sm" variant="ghost" onPress={() => { setNoteFor(d); setNote(d.log?.note ?? ''); }} />
            </Row>
          </View>
        </Card>
      ))}

      <SectionTitle title={tr('nd.t.list')} />
      {(treatments ?? []).map((t) => (
        <Card key={t.id}>
          <ListRow icon="clipboard" title={t.name} subtitle={`${t.dose_text} · ${t.frequency === 'as_prescribed' ? tr('nd.t.freq.as_prescribed') : t.times.join(', ')} · ${tr('nd.t.from', { date: formatDateFr(t.start_date) })}${t.end_date ? ` ${tr('nd.t.to', { date: formatDateFr(t.end_date) })}` : ''}${t.active ? '' : ` · ${tr('nd.t.paused')}`}`} onPress={() => edit(t)} />
        </Card>
      ))}
      <Button label={tr('nd.t.add')} icon="plus" onPress={() => edit('new')} testID="treatment-add" />

      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? tr('nd.t.add') : tr('nd.t.edit')}>
        {errors.form ? <Banner tone="danger">{errors.form}</Banner> : null}
        <Text variant="small" muted>{tr('nd.t.copyHint')}</Text>
        <Field label={tr('nd.t.name')} value={draft.name} onChangeText={(v) => set('name', v)} error={errors.name} maxLength={120} testID="t-name" />
        <Field label={tr('nd.t.dose')} value={draft.dose} onChangeText={(v) => set('dose', v)} error={errors.dose} maxLength={120} hint={tr('nd.t.doseHint')} testID="t-dose" />
        <Segmented label={tr('nd.t.frequency')} value={draft.frequency} onChange={(v) => set('frequency', v)} options={[
          { value: 'daily', label: tr('nd.t.freq.daily') }, { value: 'weekly', label: tr('nd.t.freq.weekly') }, { value: 'as_prescribed', label: tr('nd.t.freq.as_prescribed') },
        ]} />
        {draft.frequency === 'weekly' ? (
          <>
            <Row wrap>{WEEKDAYS.map((d) => <Chip key={d} label={tr(`nd.wd.${d}` as TKey)} selected={draft.weekdays.includes(d)} onPress={() => set('weekdays', draft.weekdays.includes(d) ? draft.weekdays.filter((x) => x !== d) : [...draft.weekdays, d].sort())} />)}</Row>
            {errors.weekdays ? <Text variant="small" color="#C0392B">{errors.weekdays}</Text> : null}
          </>
        ) : null}
        {draft.frequency !== 'as_prescribed' ? <Field label={tr('nd.t.times')} value={draft.times} onChangeText={(v) => set('times', v)} error={errors.times} placeholder="08:00, 16:00" keyboardType="numbers-and-punctuation" testID="t-times" /> : null}
        <Row>
          <View style={{ flex: 1 }}><Field label={tr('nd.t.start')} value={draft.start} onChangeText={(v) => set('start', v)} error={errors.start} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" /></View>
          <View style={{ flex: 1 }}><Field label={tr('nd.t.end')} optional value={draft.end} onChangeText={(v) => set('end', v)} error={errors.end} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" /></View>
        </Row>
        <Field label={tr('nd.t.instructions')} optional value={draft.instructions} onChangeText={(v) => set('instructions', v)} multiline maxLength={2000} />
        <Field label={tr('nd.t.prescriber')} optional value={draft.prescriber} onChangeText={(v) => set('prescriber', v)} maxLength={120} />
        <Toggle label={tr('nd.t.reminders')} value={draft.reminders} onChange={(v) => set('reminders', v)} />
        <Toggle label={tr('nd.t.active')} value={draft.active} onChange={(v) => set('active', v)} />
        <Button label={tr('common.save')} loading={save.isPending} onPress={() => submit()} testID="t-save" />
        {editing && editing !== 'new' ? <Button label={tr('common.delete')} variant="ghost" icon="trash-2" onPress={async () => {
          if (!(await confirm(tr('nd.t.deleteTitle'), editing.name, tr('common.delete')))) return;
          await remove.mutateAsync(editing.id).catch((e) => toast(friendlyError(e), 'error'));
          setEditing(null);
        }} /> : null}
      </Sheet>

      <Sheet visible={!!noteFor} onClose={() => setNoteFor(null)} title={tr('nd.t.note')}>
        <Field label={tr('nd.t.noteLabel')} value={note} onChangeText={setNote} multiline maxLength={1000} />
        <Button label={tr('common.save')} onPress={() => { if (noteFor) void answer(noteFor, noteFor.log?.status ?? 'taken', note.trim() || null); setNoteFor(null); }} />
      </Sheet>
    </View>
  );
}
