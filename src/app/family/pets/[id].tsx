/**
 * 189 — Fiche d'un animal : informations et vétérinaire, soins et rappels (dates saisies, rappel du téléphone le jour
 * prévu), tâches récurrentes (missions « Animaux » ordinaires : nourrir, promener, litière…), stocks liés (croquettes,
 * litière). Supprimer l'animal supprime ses soins ; ses missions et stocks restent (lien vidé par le serveur).
 */
import React, { useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Chip, ListGroup, ListRow, Row, Text } from '@/components/ui';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { todayISO } from '@/lib/domain/dates';
import { uuid } from '@/lib/uuid';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCreateMission, useMissions } from '@/lib/data/hooks-missions';
import { useStocks } from '@/lib/data/hooks-stocks';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useDeletePet, useIsHouseholdParent, usePetCare, usePets } from '@/lib/data/hooks-foyerTools';
import { isTerminal, missionHref } from '@/lib/domain/missions';
import { careHistory, careStatus, petAge, tasksFor, upcomingCares, type PetCare, type PetTaskTemplate } from '@/features/pets/domain';
import { ageLabel, CareEditor, careLabel, PetEditor, speciesLabel } from '@/features/pets/ui';

export default function PetDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { hid, parent, loading } = useIsHouseholdParent();
  const pets = usePets(parent ? hid : null);
  const care = usePetCare(parent ? hid : null);
  const missions = useMissions();
  const stocks = useStocks();
  const { people, me, nameOf } = usePeople();
  const create = useCreateMission();
  const del = useDeletePet();
  const [editPet, setEditPet] = useState(false);
  const [careOpen, setCareOpen] = useState(false);
  const [careEdit, setCareEdit] = useState<PetCare | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [who, setWho] = useState<string | null>(null);
  const today = todayISO();
  const pet = (pets.data ?? []).find((p) => p.id === id) ?? null;
  const cares = useMemo(() => (care.data ?? []).filter((c) => c.pet_id === id), [care.data, id]);
  const tasks = missions.all.filter((m) => m.pet_id === id && !isTerminal(m.mission_state));
  const linkedStocks = stocks.all.filter((s) => s.pet_id === id);
  const adults = people.filter((p) => p.role === 'owner' || p.role === 'coparent');

  if (loading || (parent && pets.isLoading && !pets.data)) return <Screen back title={tr('pet.title')}><Skeleton kind="detail" /></Screen>;
  if (!parent || !hid) return <Screen back title={tr('pet.title')}><EmptyState icon="lock" title={tr('pet.title')} body={tr('pet.parentsOnly')} /></Screen>;
  if (!pet) return <Screen back title={tr('pet.title')}><EmptyState icon="heart" title={tr('pet.notFound')} body={tr('pet.notFoundBody')} action={{ label: tr('pet.title'), icon: 'arrow-left', onPress: () => router.replace('/family/pets' as never) }} /></Screen>;
  const age = petAge(pet.birth_date, today);
  const upcoming = upcomingCares(cares);
  const history = careHistory(cares);

  async function addTask(tpl: PetTaskTemplate) {
    setBusy(tpl.key);
    try {
      const [h, m] = tpl.time.split(':').map(Number);
      const due = new Date(); due.setHours(h, m, 0, 0);
      if (due.getTime() < Date.now()) due.setDate(due.getDate() + 1);
      const out = await create.mutateAsync({
        client_id: uuid(), title: tr(`pet.task.${tpl.key}` as TKey, { name: pet!.name }).slice(0, 120), assignee_id: who, category: 'pets',
        due_at: due.toISOString(), all_day: false, recurrence: { type: tpl.repeat }, pet_id: pet!.id,
      });
      toast(tr('pet.task.created'), 'success');
      router.push(missionHref(out.id) as never);
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(null); }
  }
  async function removePet() {
    if (!(await confirm(tr('common.delete'), tr('pet.deleteQ', { name: pet!.name }), tr('common.delete')))) return;
    try { await del.mutateAsync(pet!.id); toast(tr('pet.deleted'), 'success'); router.replace('/family/pets' as never); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  const careRow = (c: PetCare, mode: 'next' | 'done') => {
    const st = careStatus(c, today);
    return (
      <ListRow key={`${mode}-${c.id}`} icon={mode === 'next' ? (st === 'overdue' ? 'alert-circle' : 'bell') : 'check'} title={careLabel(c)}
        subtitle={[mode === 'next' ? tr(`pet.status.${st}` as TKey, { date: formatDate(c.next_due!, { day: 'numeric', month: 'long', year: 'numeric' }) })
          : tr('pet.doneOn', { date: formatDate(c.done_on!, { day: 'numeric', month: 'long', year: 'numeric' }) }), c.note, c._pending ? tr('fx.pending') : null].filter(Boolean).join(' · ')}
        onPress={c._pending ? undefined : () => { setCareEdit(c); setCareOpen(true); }} testID={`pet-care-${mode}-${c.kind}`} />
    );
  };
  return (
    <Screen back title={pet.name} subtitle={[speciesLabel(pet.species), age ? ageLabel(age) : null].filter(Boolean).join(' · ')}
      action={{ label: tr('pet.care.add'), icon: 'plus', onPress: () => { setCareEdit(null); setCareOpen(true); }, testID: 'pet-care-add' }}>
      <ListGroup title={tr('pet.info')}>
        {pet.vet_name || pet.vet_phone ? <ListRow icon="phone" title={pet.vet_name ?? tr('pet.f.vet')} subtitle={pet.vet_phone ?? undefined}
          onPress={pet.vet_phone ? () => void Linking.openURL(`tel:${pet.vet_phone!.replace(/\s/g, '')}`).catch(() => undefined) : undefined} testID="pet-vet" /> : null}
        {pet.birth_date ? <ListRow icon="calendar" title={tr('pet.f.birth')} value={formatDate(pet.birth_date, { day: 'numeric', month: 'short', year: 'numeric' })} /> : null}
        {pet.notes ? <ListRow icon="file-text" title={pet.notes} /> : null}
        <ListRow icon="edit-2" title={tr('pet.edit')} onPress={() => setEditPet(true)} testID="pet-edit" />
      </ListGroup>

      <ListGroup title={tr('pet.care.next')} footer={tr('pet.noCalendar')} testID="pet-care-next">
        {upcoming.length ? upcoming.map((c) => careRow(c, 'next')) : <ListRow icon="info" title={tr('pet.care.noneNext')} />}
      </ListGroup>
      {history.length ? <ListGroup title={tr('pet.care.history')} testID="pet-care-history">{history.slice(0, 20).map((c) => careRow(c, 'done'))}</ListGroup> : null}

      <ListGroup title={tr('pet.tasks')} footer={tr('pet.tasksFooter')} testID="pet-tasks">
        {tasks.length ? tasks.map((m) => (
          <ListRow key={m.id} icon="repeat" title={m.title} subtitle={[m.assignee_id ? nameOf(m.assignee_id) : tr('pet.task.anyone'), m.recurrence ? tr(`mis.form.repeat.${m.recurrence.type}` as TKey) : null].filter(Boolean).join(' · ')}
            onPress={() => router.push(missionHref(m.id) as never)} testID={`pet-task-${m.id}`} />
        )) : <ListRow icon="info" title={tr('pet.tasks.none')} />}
      </ListGroup>
      <Text variant="label">{tr('pet.task.addTitle')}</Text>
      {adults.length > 1 ? (
        <Row wrap>
          <Chip label={tr('pet.task.anyone')} selected={!who} onPress={() => setWho(null)} testID="pet-task-who-none" />
          {adults.map((p) => <Chip key={p.id} label={p.label} selected={who === p.id} onPress={() => setWho(p.id)} testID={`pet-task-who-${p.id === me ? 'me' : 'other'}`} />)}
        </Row>
      ) : null}
      <Row wrap>
        {tasksFor(pet.species).map((tpl) => (
          <Button key={tpl.key} label={tr(`pet.taskBtn.${tpl.key}` as TKey)} icon="plus" size="sm" variant="secondary" loading={busy === tpl.key} onPress={() => void addTask(tpl)} testID={`pet-task-add-${tpl.key}`} />
        ))}
      </Row>

      <ListGroup title={tr('pet.stocks')} footer={tr('pet.stocksFooter')} testID="pet-stocks">
        {linkedStocks.map((s) => <ListRow key={s.id} icon="package" title={s.label} onPress={() => router.push(`/family/stocks/${s.id}` as never)} />)}
        <ListRow icon="plus" title={tr('pet.stockAdd')} onPress={() => router.push(`/family/stocks/new?pet=${pet.id}` as never)} testID="pet-stock-add" />
      </ListGroup>
      {upcoming.some((c) => careStatus(c, today) === 'overdue') ? <Banner tone="warning" icon="alert-triangle">{tr('pet.overdueHint')}</Banner> : null}
      <Button label={tr('pet.delete')} icon="trash-2" variant="ghost" onPress={() => void removePet()} testID="pet-delete" />
      <PetEditor visible={editPet} onClose={() => setEditPet(false)} hid={hid} initial={pet} />
      <CareEditor visible={careOpen} onClose={() => setCareOpen(false)} pet={pet} initial={careEdit} />
    </Screen>
  );
}
