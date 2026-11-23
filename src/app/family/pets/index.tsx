/**
 * 189 — Animaux du foyer : fiches, prochains soins (dates saisies par le parent), accès à chaque fiche (soins, rappels,
 * tâches récurrentes sous forme de missions, stocks liés). Parents du foyer seulement (RLS).
 */
import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, ListGroup, ListRow } from '@/components/ui';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { todayISO } from '@/lib/domain/dates';
import { useIsHouseholdParent, usePetCare, usePets } from '@/lib/data/hooks-foyerTools';
import { careStatus, petAge, upcomingCares } from '@/features/pets/domain';
import { ageLabel, careLabel, PetEditor, SPECIES_ICON, speciesLabel } from '@/features/pets/ui';

export default function Pets() {
  const { hid, parent, loading } = useIsHouseholdParent();
  const pets = usePets(parent ? hid : null);
  const care = usePetCare(parent ? hid : null);
  const [open, setOpen] = useState(false);
  const today = todayISO();
  const due = useMemo(() => upcomingCares(care.data ?? []).filter((c) => careStatus(c, today) !== 'planned'), [care.data, today]);

  if (loading || (parent && pets.isLoading && !pets.data)) return <Screen back title={tr('pet.title')}><Skeleton rows={4} /></Screen>;
  if (!parent || !hid) return <Screen back title={tr('pet.title')}><EmptyState icon="lock" title={tr('pet.title')} body={tr('pet.parentsOnly')} /></Screen>;
  if (pets.isError && !pets.data) return <Screen back title={tr('pet.title')}><ErrorView error={pets.error} onRetry={() => void pets.refetch()} /></Screen>;
  const list = pets.data ?? [];
  const petName = (id: string) => list.find((p) => p.id === id)?.name ?? '';
  return (
    <Screen back title={tr('pet.title')} subtitle={tr('pet.sub')} action={{ label: tr('pet.add'), icon: 'plus', onPress: () => setOpen(true), testID: 'pet-add' }}>
      {due.length ? (
        <ListGroup title={tr('pet.due')} testID="pet-due">
          {due.map((c) => {
            const st = careStatus(c, today);
            return <ListRow key={c.id} icon={st === 'overdue' ? 'alert-circle' : 'bell'} title={`${careLabel(c)} · ${petName(c.pet_id)}`}
              subtitle={tr(`pet.status.${st}` as TKey, { date: formatDate(c.next_due!, { day: 'numeric', month: 'long' }) })} onPress={() => router.push(`/family/pets/${c.pet_id}` as never)} />;
          })}
        </ListGroup>
      ) : null}
      {list.length ? (
        <ListGroup title={tr('pet.list')} testID="pet-list">
          {list.map((p) => {
            const age = petAge(p.birth_date, today);
            const next = upcomingCares((care.data ?? []).filter((c) => c.pet_id === p.id))[0];
            return (
              <ListRow key={p.id} icon={SPECIES_ICON[p.species]} title={p.name}
                subtitle={[speciesLabel(p.species), age ? ageLabel(age) : null,
                  next ? tr('pet.nextCare', { care: careLabel(next), date: formatDate(next.next_due!, { day: 'numeric', month: 'short' }) }) : null].filter(Boolean).join(' · ')}
                onPress={p._pending ? undefined : () => router.push(`/family/pets/${p.id}` as never)} testID={`pet-row-${p.id}`} />
            );
          })}
        </ListGroup>
      ) : <EmptyState icon="heart" title={tr('pet.empty.title')} body={tr('pet.empty.body')} action={{ label: tr('pet.add'), icon: 'plus', onPress: () => setOpen(true) }} />}
      <Banner tone="info" icon="info">{tr('pet.noCalendar')}</Banner>
      <PetEditor visible={open} onClose={() => setOpen(false)} hid={hid} initial={null} onSaved={(id) => router.push(`/family/pets/${id}` as never)} />
    </Screen>
  );
}
