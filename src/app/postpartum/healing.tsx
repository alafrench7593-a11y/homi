/**
 * 60 — Suivi de la cicatrisation : un journal simple (date, ressenti, douleur 0–10, note, photo facultative). La photo
 * reste un document PRIVÉ de la personne (coffre de documents existant), réencodé sur l'appareil, jamais analysé.
 * Données de la personne seulement ; aucun conseil médical ; un rappel fixe invite à consulter en cas d'inquiétude.
 */
import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Chip, Field, ListGroup, ListRow, Row, Text } from '@/components/ui';
import { PainScale, WhenFields, whenOf, whenToIso, type WhenValue } from '@/components/CareInputs';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCareLogs, useDeleteCareLog, useSaveCareLog, useUploadPrivatePhoto } from '@/lib/data/hooks-birthCare';
import { pickPhotos } from '@/lib/documents/io';
import { healingEntries, type CareLog, type Feeling } from '@/features/postpartumCare/domain';

const FEELINGS: Feeling[] = ['better', 'same', 'worse'];
const LONG = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' } as const;

function EntrySheet({ log, visible, onClose }: { log: CareLog | null; visible: boolean; onClose: () => void }) {
  const toast = useToast();
  const save = useSaveCareLog();
  const del = useDeleteCareLog();
  const upload = useUploadPrivatePhoto();
  const [when, setWhen] = useState<WhenValue>(whenOf());
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [pain, setPain] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [doc, setDoc] = useState<string | null>(null);
  React.useEffect(() => {
    if (!visible) return;
    setWhen(whenOf(log?.at)); setFeeling(log?.feeling ?? null); setPain(log?.pain ?? null); setNote(log?.note ?? ''); setDoc(log?.document_id ?? null);
  }, [visible, log?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!visible) return null;
  async function addPhoto() {
    try {
      const picked = await pickPhotos(false);
      if (picked === 'denied') return toast(tr('ppc.h.photoDenied'), 'error');
      if (!picked[0]) return;
      const id = await upload.mutateAsync({ uri: picked[0].uri, title: tr('ppc.h.photoTitle', { date: formatDate(new Date(), { day: 'numeric', month: 'long' }) }) });
      setDoc(id); toast(tr('ppc.h.photoAdded'), 'success');
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  async function submit() {
    const at = whenToIso(when);
    if (!at) return toast(tr('ppc.err.date'), 'error');
    if (at > new Date(Date.now() + 60_000).toISOString()) return toast(tr('ppc.err.future'), 'error');
    if (!feeling && pain == null && !note.trim() && !doc) return toast(tr('ppc.h.err.empty'), 'error');
    try {
      const r = await save.mutateAsync({ row: { ...(log ?? {}), kind: 'healing', at, status: null, practitioner: null, feeling, pain, note: note.trim() || null, document_id: doc } });
      toast(r.queued ? tr('ppc.savedOffline') : tr('ppc.h.saved'), 'success'); onClose();
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  async function remove() {
    if (!log || !(await confirm(tr('ppc.h.delete'), tr('ppc.h.deleteQ'), tr('ppc.h.delete')))) return;
    try { await del.mutateAsync(log); onClose(); } catch (x) { toast(friendlyError(x), 'error'); }
  }
  return (
    <GlassSheet visible onClose={onClose} title={log ? tr('ppc.h.edit') : tr('ppc.h.add')}>
      <WhenFields value={when} onChange={setWhen} days="past" testID="heal-when" />
      <Text variant="label">{tr('ppc.h.feeling')}</Text>
      <Row wrap>{FEELINGS.map((f) => <Chip key={f} label={tr(`ppc.h.f.${f}` as TKey)} selected={feeling === f} onPress={() => setFeeling(feeling === f ? null : f)} testID={`heal-f-${f}`} />)}</Row>
      <PainScale value={pain} onChange={setPain} testID="heal-pain" />
      <Field label={tr('ppc.h.note')} optional multiline maxLength={1000} value={note} onChangeText={setNote} placeholder={tr('ppc.h.notePh')} testID="heal-note" />
      <Row wrap>
        <Button label={doc ? tr('ppc.h.photoReplace') : tr('ppc.h.photoAdd')} icon="camera" size="sm" variant="secondary" loading={upload.isPending} onPress={() => void addPhoto()} testID="heal-photo" />
        {doc ? <Button label={tr('ppc.h.photoRemove')} size="sm" variant="ghost" onPress={() => setDoc(null)} /> : null}
      </Row>
      <Text variant="caption" muted>{tr('ppc.h.photoPrivate')}</Text>
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="heal-save" />
      {log ? <Button label={tr('ppc.h.delete')} variant="ghost" icon="trash-2" onPress={() => void remove()} testID="heal-delete" /> : null}
    </GlassSheet>
  );
}

export default function HealingJournal() {
  const q = useCareLogs('healing');
  const [sheet, setSheet] = useState<{ log: CareLog | null } | null>(null);
  const list = useMemo(() => healingEntries(q.data ?? []), [q.data]);
  if (q.isLoading && !q.data) return <Screen back title={tr('ppc.h.title')} tool={false}><Skeleton rows={4} /></Screen>;
  return (
    <Screen back title={tr('ppc.h.title')} subtitle={tr('ppc.h.subtitle')} tool={false}
      action={{ label: tr('ppc.h.add'), icon: 'plus', onPress: () => setSheet({ log: null }), testID: 'heal-add' }}>
      <Text muted>{tr('ppc.h.intro')}</Text>
      {list.length ? (
        <ListGroup title={tr('ppc.h.journal')} testID="heal-list">
          {list.map((l) => (
            <ListRow key={l.id} icon={l.document_id ? 'image' : 'edit-3'} title={formatDate(l.at, LONG)}
              subtitle={[l.feeling ? tr(`ppc.h.f.${l.feeling}` as TKey) : null, l.pain != null ? tr('care.pain.value', { n: l.pain }) : null, l.note, l.document_id ? tr('ppc.h.hasPhoto') : null, l._pending ? tr('ppc.pending') : null].filter(Boolean).join(' · ')}
              onPress={() => setSheet({ log: l })} testID={`heal-row-${l.pain ?? 'x'}`}
              right={l.document_id ? <Button label={tr('ppc.h.see')} size="sm" variant="ghost" onPress={() => router.push(`/documents/${l.document_id}`)} /> : undefined} />
          ))}
        </ListGroup>
      ) : <EmptyState icon="feather" title={tr('ppc.h.emptyTitle')} body={tr('ppc.h.emptyBody')} action={{ label: tr('ppc.h.add'), onPress: () => setSheet({ log: null }) }} />}
      <Banner tone="info" icon="heart">{tr('ppc.h.consult')}</Banner>
      <Text variant="caption" muted>{tr('ppc.private')}</Text>
      <EntrySheet log={sheet?.log ?? null} visible={!!sheet} onClose={() => setSheet(null)} />
    </Screen>
  );
}
