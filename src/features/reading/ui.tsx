/**
 * Lecture — éléments partagés : enfant de l'écran, choix de l'enfant, saisie d'une lecture (feuille de verre).
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Chip, Field, Row, Text } from '@/components/ui';
import { t as tr, type TKey } from '@/i18n';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { useChildren, useMemberships } from '@/lib/data/hooks';
import { usePeople } from '@/lib/data/hooks-family-load';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteReading, useSaveReading } from '@/lib/data/hooks-foyerTools';
import type { Child } from '@/lib/types';
import { spacing } from '@/theme/tokens';
import { parseMinutes, REACTIONS, type Reaction, type ReadingLog } from './domain';

export const REACTION_ICON: Record<Reaction, 'heart' | 'smile' | 'moon' | 'cloud'> = { loved: 'heart', liked: 'smile', calm: 'moon', not_today: 'cloud' };

/** Enfants dont la personne est parent (une nounou n'a pas de journal de lecture) ; enfant de l'adresse sinon le premier. */
export function useReadingChild() {
  const params = useLocalSearchParams<{ child?: string }>();
  const memberships = useMemberships();
  const kids = useChildren();
  const parentHouseholds = new Set((memberships.data ?? []).filter((m) => m.role === 'owner' || m.role === 'coparent').map((m) => m.household_id));
  const children: Child[] = (kids.data ?? []).filter((k) => parentHouseholds.has(k.household_id) && !k.archived);
  const [picked, setPicked] = useState<string | null>(typeof params.child === 'string' ? params.child : null);
  const child = children.find((c) => c.id === picked) ?? children[0] ?? null;
  const loading = (memberships.isLoading && !memberships.data) || (kids.isLoading && !kids.data);
  return { children, child, setChild: setPicked, loading };
}

export function ChildChips({ list, value, onChange }: { list: Child[]; value: string | null; onChange: (id: string) => void }) {
  if (list.length < 2) return null;
  return <Row wrap>{list.map((c) => <Chip key={c.id} label={c.first_name} selected={value === c.id} onPress={() => onChange(c.id)} testID={`rd-child-${c.id}`} />)}</Row>;
}

export function ReadingEditor({ visible, onClose, child, initial, preset }: {
  visible: boolean; onClose: () => void; child: Child; initial: ReadingLog | null; preset?: { title: string; story_key: string | null; minutes?: number | null } | null;
}) {
  const toast = useToast();
  const save = useSaveReading();
  const del = useDeleteReading();
  const { people, me } = usePeople();
  const adults = people.filter((p) => p.role === 'owner' || p.role === 'coparent');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [minutes, setMinutes] = useState('');
  const [reader, setReader] = useState<string | null>(null);
  const [other, setOther] = useState('');
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!visible) return;
    setTitle(initial?.title ?? preset?.title ?? ''); setDate(toFrDate(initial?.read_on ?? todayISO()));
    const m = initial?.minutes ?? preset?.minutes ?? null; setMinutes(m ? String(m) : '');
    setReader(initial ? initial.reader_id : me ?? null); setOther(initial?.reader_label ?? ''); setReaction(initial?.reaction ?? null); setNote(initial?.note ?? ''); setErr(null);
  }, [visible, initial, preset, me]);
  async function submit() {
    if (!title.trim()) return setErr(tr('rd.err.title'));
    const d = frToISO(date);
    if (!d || d > todayISO()) return setErr(tr('rd.err.date'));
    const m = parseMinutes(minutes);
    if (m === 'bad') return setErr(tr('rd.err.minutes'));
    setErr(null);
    try {
      const r = await save.mutateAsync({
        id: initial?.id, household_id: child.household_id, child_id: child.id, title: title.trim().slice(0, 120), story_key: initial?.story_key ?? preset?.story_key ?? null,
        read_on: d, minutes: m, reader_id: other.trim() ? null : reader, reader_label: other.trim() ? other.trim().slice(0, 40) : null, reaction, note: note.trim() || null,
      });
      toast(tr(r.queued ? 'rd.savedOffline' : 'rd.saved'), 'success');
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function remove() {
    if (!initial || !(await confirm(tr('common.delete'), tr('rd.deleteQ'), tr('common.delete')))) return;
    try { await del.mutateAsync(initial.id); onClose(); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <GlassSheet visible={visible} onClose={onClose} title={initial ? tr('rd.edit') : tr('rd.add', { name: child.first_name })}>
      <Field label={tr('rd.f.title')} value={title} onChangeText={setTitle} maxLength={120} placeholder={tr('rd.f.titlePh')} testID="rd-f-title" />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Field label={tr('rd.f.date')} value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" testID="rd-f-date" /></View>
        <View style={{ flex: 1 }}><Field label={tr('rd.f.minutes')} optional value={minutes} onChangeText={setMinutes} keyboardType="number-pad" suffix="min" testID="rd-f-minutes" /></View>
      </View>
      <Text variant="label">{tr('rd.f.reader')}</Text>
      <Row wrap>
        {adults.map((p) => <Chip key={p.id} label={p.label} selected={!other.trim() && reader === p.id} onPress={() => { setReader(p.id); setOther(''); }} testID={`rd-f-reader-${p.isMe ? 'me' : 'other'}`} />)}
      </Row>
      <Field label={tr('rd.f.readerOther')} optional value={other} onChangeText={setOther} maxLength={40} placeholder={tr('rd.f.readerOtherPh')} testID="rd-f-reader-label" />
      <Text variant="label">{tr('rd.f.reaction')}</Text>
      <Row wrap>{REACTIONS.map((r) => <Chip key={r} label={tr(`rd.reaction.${r}` as TKey)} icon={REACTION_ICON[r]} selected={reaction === r} onPress={() => setReaction(reaction === r ? null : r)} testID={`rd-f-reaction-${r}`} />)}</Row>
      <Field label={tr('rd.f.note')} optional value={note} onChangeText={setNote} maxLength={300} testID="rd-f-note" />
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="rd-f-save" />
      {initial ? <Button label={tr('common.delete')} icon="trash-2" variant="ghost" onPress={() => void remove()} testID="rd-f-delete" /> : null}
    </GlassSheet>
  );
}
