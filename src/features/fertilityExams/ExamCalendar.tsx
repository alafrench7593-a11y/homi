/**
 * 27 — Calendrier des examens (parcours fertilité). Les examens DATÉS que la personne saisit : ce sont des rendez-vous
 * « pour moi » (privés par défaut, partage choisi), avec rappel, visibles dans « Mes rendez-vous » et l'agenda. Aucun
 * calendrier médical n'est proposé : seules les dates saisies existent. Le guide de l'écran reste la lecture.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Chip, Field, ListGroup, ListRow, Row, SectionTitle, Segmented, Text, Toggle } from '@/components/ui';
import { POSSIBLE_EXAMS } from '@/content/fertility';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { ensureHousehold, useHouseholdId, useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteExam, useFertilityExams, useSaveExam, type ExamInput } from '@/lib/data/hooks-partiels2';
import { frToISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { useUserId } from '@/lib/auth';
import { parseClock } from '@/features/activities/domain';
import { splitExams, type ExamRow } from './domain';
import { spacing } from '@/theme/tokens';

const KINDS: ExamInput['kind'][] = ['exam', 'blood_test', 'ultrasound', 'consultation'];
const KIND_ICON = { exam: 'clipboard', blood_test: 'droplet', ultrasound: 'radio', consultation: 'user' } as const;
const pad = (n: number) => String(n).padStart(2, '0');
const when = (iso: string) => formatDate(iso, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function ExamCalendar({ openSignal }: { openSignal: number }) {
  const exams = useFertilityExams();
  const me = useUserId();
  const [editing, setEditing] = useState<ExamRow | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (openSignal) { setEditing(null); setOpen(true); } }, [openSignal]);
  const { upcoming, past } = useMemo(() => splitExams(exams.data ?? [], new Date()), [exams.data]);
  const row = (a: ExamRow) => (
    <ListRow key={a.id} icon={KIND_ICON[a.kind as keyof typeof KIND_ICON] ?? 'calendar'} title={a.title}
      subtitle={[when(a.starts_at), a.location_label, a.created_by && a.created_by !== me ? tr('p2.ex.sharedBy') : a.private_to_creator ? tr('p2.ex.private') : tr('p2.ex.shared'),
        a.result_note ? tr('p2.ex.hasNote') : null, a._pending ? tr('fx.pending') : null].filter(Boolean).join(' · ')}
      onPress={a._pending || (a.created_by && a.created_by !== me) ? undefined : () => { setEditing(a); setOpen(true); }} testID={`ex-row-${a.id}`} />
  );
  return (
    <View style={{ gap: spacing.sm }} testID="ex-calendar">
      <SectionTitle title={tr('p2.ex.title')} subtitle={tr('p2.ex.sub')} />
      {upcoming.length ? <ListGroup title={tr('p2.ex.upcoming')} testID="ex-upcoming">{upcoming.map(row)}</ListGroup> : (
        <Text variant="small" muted testID="ex-empty">{tr('p2.ex.empty')}</Text>
      )}
      {past.length ? <ListGroup title={tr('p2.ex.past')} footer={tr('p2.ex.pastHint')} testID="ex-past">{past.map(row)}</ListGroup> : null}
      <Row wrap>
        <Button label={tr('p2.ex.add')} icon="plus" size="sm" onPress={() => { setEditing(null); setOpen(true); }} testID="ex-add" />
        <Button label={tr('p2.ex.allAppts')} icon="calendar" size="sm" variant="ghost" onPress={() => router.push('/appointments?all=1' as never)} testID="ex-appts" />
      </Row>
      <ExamSheet visible={open} initial={editing} onClose={() => setOpen(false)} />
    </View>
  );
}

function ExamSheet({ visible, initial, onClose }: { visible: boolean; initial: ExamRow | null; onClose: () => void }) {
  const toast = useToast();
  const hid = useHouseholdId();
  const inv = useInvalidate();
  const save = useSaveExam();
  const del = useDeleteExam();
  const [kind, setKind] = useState<ExamInput['kind']>('exam');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState('');
  const [priv, setPriv] = useState(true);
  const [lead, setLead] = useState<'0' | '60' | '1440'>('1440');
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!visible) return;
    const d = initial ? new Date(initial.starts_at) : null;
    setKind((KINDS as string[]).includes(initial?.kind ?? '') ? (initial!.kind as ExamInput['kind']) : 'exam');
    setTitle(initial?.title ?? ''); setDate(d ? toFrDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`) : '');
    setTime(d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : ''); setPlace(initial?.location_label ?? ''); setNotes(initial?.notes ?? '');
    setResult(initial?.result_note ?? ''); setPriv(initial ? !!initial.private_to_creator : true); setLead('1440'); setErr(null);
  }, [visible, initial]);
  const isPast = initial ? Date.parse(initial.starts_at) < Date.now() : false;
  async function submit() {
    if (!title.trim()) return setErr(tr('p2.ex.errTitle'));
    const iso = frToISO(date);
    if (!iso) return setErr(tr('p2.ex.errDate'));
    const y = Number(iso.slice(0, 4)); const now = new Date().getFullYear();
    if (y < now - 2 || y > now + 3) return setErr(tr('u1.appt.errRange'));
    const clock = parseClock(time || '09:00');
    if (!clock) return setErr(tr('p2.ex.errTime'));
    const [yy, mm, dd] = iso.split('-').map(Number);
    const startsAt = new Date(yy, mm - 1, dd, Number(clock.slice(0, 2)), Number(clock.slice(3, 5))).toISOString();
    setErr(null);
    try {
      const household_id = hid ?? (await ensureHousehold());
      if (!hid) inv('memberships');
      const r = await save.mutateAsync({ id: initial?.id, household_id, kind, title: title.trim().slice(0, 120), starts_at: startsAt, location_label: place.trim() || null,
        notes: notes.trim() || null, result_note: result.trim() || null, private_to_creator: priv, lead: Number(lead) as ExamInput['lead'] });
      toast(tr(r.queued ? 'p2.savedOffline' : 'p2.ex.saved'), 'success');
      onClose();
    } catch (e) { setErr(friendlyError(e)); }
  }
  async function remove() {
    if (!initial || !(await confirm(tr('common.delete'), tr('p2.ex.deleteQ', { title: initial.title }), tr('common.delete')))) return;
    try { await del.mutateAsync(initial.id); toast(tr('p2.ex.deleted')); onClose(); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <GlassSheet visible={visible} onClose={onClose} title={initial ? tr('p2.ex.edit') : tr('p2.ex.add')}>
      <Text variant="label">{tr('p2.ex.kind')}</Text>
      <Row wrap>{KINDS.map((k) => <Chip key={k} label={tr(`u1.appt.kind.${k}` as TKey)} icon={KIND_ICON[k]} selected={kind === k} onPress={() => setKind(k)} testID={`ex-kind-${k}`} />)}</Row>
      <Field label={tr('p2.ex.fTitle')} value={title} onChangeText={setTitle} maxLength={120} placeholder={tr('p2.ex.fTitlePh')} testID="ex-f-title" />
      {!initial ? (
        <View style={{ gap: 4 }}>
          <Text variant="caption" muted>{tr('p2.ex.fromGuide')}</Text>
          <Row wrap>{POSSIBLE_EXAMS.slice(1, 5).map((e, i) => <Chip key={e.title} label={e.title.replace(/^(Un|Une|Des|A|An) /, '')} onPress={() => setTitle(e.title)} testID={`ex-suggest-${i}`} />)}</Row>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 3 }}><Field label={tr('p2.ex.fDate')} value={date} onChangeText={setDate} placeholder={tr('u1.appt.datePh')} keyboardType="numbers-and-punctuation" testID="ex-f-date" /></View>
        <View style={{ flex: 2 }}><Field label={tr('p2.ex.fTime')} optional value={time} onChangeText={setTime} placeholder="09:00" keyboardType="numbers-and-punctuation" testID="ex-f-time" /></View>
      </View>
      <Field label={tr('p2.ex.fPlace')} optional value={place} onChangeText={setPlace} maxLength={160} testID="ex-f-place" />
      <Field label={tr('p2.ex.fNotes')} optional value={notes} onChangeText={setNotes} maxLength={2000} multiline hint={tr('p2.ex.fNotesHint')} testID="ex-f-notes" />
      {isPast ? <Field label={tr('p2.ex.fResult')} optional value={result} onChangeText={setResult} maxLength={1000} multiline hint={tr('p2.ex.fResultHint')} testID="ex-f-result" /> : null}
      <Row style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text weight="medium">{tr('u1.appt.privateOnly')}</Text>
          <Text variant="caption" muted>{tr('p2.ex.privateD')}</Text>
        </View>
        <Toggle label={tr('u1.appt.privateOnly')} value={priv} onChange={setPriv} />
      </Row>
      {!isPast ? (
        <>
          <Text variant="label">{tr('u1.appt.reminder')}</Text>
          <Segmented label={tr('u1.appt.reminder')} value={lead} onChange={setLead} options={[
            { value: '0', label: tr('u1.appt.leadNone') }, { value: '60', label: tr('u1.appt.lead1h') }, { value: '1440', label: tr('u1.appt.leadDay'), testID: 'ex-lead-day' },
          ]} />
        </>
      ) : null}
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="ex-f-save" />
      {initial ? <Button label={tr('common.delete')} icon="trash-2" variant="ghost" onPress={() => void remove()} testID="ex-f-delete" /> : null}
    </GlassSheet>
  );
}
