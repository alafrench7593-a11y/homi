/**
 * Animaux — éléments partagés : libellés, fiche (feuille de verre), saisie d'un soin avec rappel facultatif.
 * Dates SAISIES par le parent ; aucun calendrier vétérinaire proposé.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Chip, Field, Row, Text, Toggle } from '@/components/ui';
import { t as tr, type TKey } from '@/i18n';
import { useUserId } from '@/lib/auth';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCareReminder, useDeletePetCare, useSavePet, useSavePetCare } from '@/lib/data/hooks-foyerTools';
import { spacing } from '@/theme/tokens';
import { CARE_KINDS, careReminderLink, PET_SPECIES, type CareKind, type Pet, type PetCare, type PetSpecies } from './domain';

export const speciesLabel = (s: PetSpecies) => tr(`pet.sp.${s}` as TKey);
export const careLabel = (c: Pick<PetCare, 'kind' | 'label'>) => c.label?.trim() || tr(`pet.care.${c.kind}` as TKey);
export const SPECIES_ICON: Record<PetSpecies, 'feather' | 'heart' | 'droplet' | 'sun'> = {
  dog: 'heart', cat: 'heart', rabbit: 'heart', rodent: 'heart', bird: 'feather', fish: 'droplet', reptile: 'sun', other: 'heart',
};
export const ageLabel = (a: { years: number; months: number }) => (a.years ? tr('pet.ageYears', { count: a.years, months: a.months }) : tr('pet.ageMonths', { count: a.months }));
const isoOrNull = (s: string): string | null | 'bad' => (s.trim() ? frToISO(s) ?? 'bad' : null);

export function PetEditor({ visible, onClose, hid, initial, onSaved }: { visible: boolean; onClose: () => void; hid: string; initial: Pet | null; onSaved?: (id: string) => void }) {
  const toast = useToast();
  const save = useSavePet();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('dog');
  const [birth, setBirth] = useState('');
  const [vet, setVet] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? ''); setSpecies(initial?.species ?? 'dog'); setBirth(initial?.birth_date ? toFrDate(initial.birth_date) : '');
    setVet(initial?.vet_name ?? ''); setPhone(initial?.vet_phone ?? ''); setNotes(initial?.notes ?? ''); setErr(null);
  }, [visible, initial]);
  async function submit() {
    if (!name.trim()) return setErr(tr('pet.err.name'));
    const b = isoOrNull(birth);
    if (b === 'bad' || (b && b > todayISO())) return setErr(tr('pet.err.birth'));
    setErr(null);
    try {
      const r = await save.mutateAsync({ id: initial?.id, household_id: hid, name: name.trim().slice(0, 40), species, birth_date: b, vet_name: vet.trim() || null, vet_phone: phone.trim() || null, notes: notes.trim() || null });
      toast(tr(r.queued ? 'pet.savedOffline' : 'pet.saved'), 'success');
      onClose();
      onSaved?.(r.id);
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <GlassSheet visible={visible} onClose={onClose} title={initial ? tr('pet.edit') : tr('pet.add')}>
      <Field label={tr('pet.f.name')} value={name} onChangeText={setName} maxLength={40} testID="pet-f-name" />
      <Text variant="label">{tr('pet.f.species')}</Text>
      <Row wrap>{PET_SPECIES.map((s) => <Chip key={s} label={speciesLabel(s)} selected={species === s} onPress={() => setSpecies(s)} testID={`pet-f-sp-${s}`} />)}</Row>
      <Field label={tr('pet.f.birth')} optional value={birth} onChangeText={setBirth} keyboardType="numbers-and-punctuation" hint={tr('pet.f.dateHint')} testID="pet-f-birth" />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Field label={tr('pet.f.vet')} optional value={vet} onChangeText={setVet} maxLength={80} testID="pet-f-vet" /></View>
        <View style={{ flex: 1 }}><Field label={tr('pet.f.phone')} optional value={phone} onChangeText={setPhone} maxLength={40} keyboardType="phone-pad" testID="pet-f-phone" /></View>
      </View>
      <Field label={tr('pet.f.notes')} optional multiline value={notes} onChangeText={setNotes} maxLength={1000} testID="pet-f-notes" />
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="pet-f-save" />
    </GlassSheet>
  );
}

export function CareEditor({ visible, onClose, pet, initial }: { visible: boolean; onClose: () => void; pet: Pet; initial: PetCare | null }) {
  const toast = useToast();
  const me = useUserId();
  const save = useSavePetCare();
  const del = useDeletePetCare();
  const remind = useCareReminder();
  const [kind, setKind] = useState<CareKind>('vaccine');
  const [label, setLabel] = useState('');
  const [done, setDone] = useState('');
  const [next, setNext] = useState('');
  const [note, setNote] = useState('');
  const [reminder, setReminder] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!visible) return;
    setKind(initial?.kind ?? 'vaccine'); setLabel(initial?.label ?? ''); setDone(initial?.done_on ? toFrDate(initial.done_on) : initial ? '' : toFrDate(todayISO()));
    setNext(initial?.next_due ? toFrDate(initial.next_due) : ''); setNote(initial?.note ?? ''); setReminder(true); setErr(null);
  }, [visible, initial]);
  async function submit() {
    const d = isoOrNull(done); const n = isoOrNull(next);
    if (d === 'bad' || n === 'bad') return setErr(tr('pet.err.date'));
    if (!d && !n) return setErr(tr('pet.err.oneDate'));
    setErr(null);
    try {
      const r = await save.mutateAsync({ id: initial?.id, household_id: pet.household_id, pet_id: pet.id, kind, label: label.trim() || null, done_on: d, next_due: n, note: note.trim() || null });
      if (me) {
        await remind.mutateAsync({ userId: me, hid: pet.household_id, title: tr('pet.reminderTitle', { care: careLabel({ kind, label }), name: pet.name }), date: n ?? '', link: careReminderLink(pet.id, r.id), enabled: !!n && reminder && n >= todayISO() }).catch(() => undefined);
      }
      toast(tr(r.queued ? 'pet.savedOffline' : 'pet.care.saved'), 'success');
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function remove() {
    if (!initial || !(await confirm(tr('common.delete'), tr('pet.care.deleteQ'), tr('common.delete')))) return;
    try {
      await del.mutateAsync(initial.id);
      if (me) await remind.mutateAsync({ userId: me, hid: pet.household_id, title: '', date: '', link: careReminderLink(pet.id, initial.id), enabled: false }).catch(() => undefined);
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <GlassSheet visible={visible} onClose={onClose} title={initial ? tr('pet.care.edit') : tr('pet.care.add')}>
      <Row wrap>{CARE_KINDS.map((k) => <Chip key={k} label={tr(`pet.care.${k}` as TKey)} selected={kind === k} onPress={() => setKind(k)} testID={`pet-c-kind-${k}`} />)}</Row>
      <Field label={tr('pet.c.label')} optional value={label} onChangeText={setLabel} maxLength={80} placeholder={tr('pet.c.labelPh')} testID="pet-c-label" />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Field label={tr('pet.c.done')} optional value={done} onChangeText={setDone} keyboardType="numbers-and-punctuation" testID="pet-c-done" /></View>
        <View style={{ flex: 1 }}><Field label={tr('pet.c.next')} optional value={next} onChangeText={setNext} keyboardType="numbers-and-punctuation" testID="pet-c-next" /></View>
      </View>
      <Text variant="caption" muted>{tr('pet.c.datesHint')}</Text>
      <Toggle label={tr('pet.c.reminder')} value={reminder} onChange={setReminder} />
      <Field label={tr('pet.c.note')} optional value={note} onChangeText={setNote} maxLength={300} testID="pet-c-note" />
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="pet-c-save" />
      {initial ? <Button label={tr('common.delete')} icon="trash-2" variant="ghost" onPress={() => void remove()} testID="pet-c-delete" /> : null}
    </GlassSheet>
  );
}
