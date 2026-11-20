/**
 * Outils du foyer du 28/11/2026 — accès aux données. Le serveur décide de tout (RLS, migrations 20261128300100…500) :
 *  - dépenses, animaux et soins, portions préparées : parents du foyer (propriétaire, co-parent) ;
 *  - lecture : parents de l'enfant (périmètre d'enfants respecté).
 * Écritures par insertOrQueue (file hors ligne, identifiant posé sur l'appareil, envoi répété sans doublon) ; une
 * saisie encore en file apparaît tout de suite dans la liste (« en attente d'envoi »).
 */
import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { backend, eq, type Filter } from '../backend';
import { useAuth } from '../auth';
import { insertOrQueue, useOfflineStore } from '../offline';
import { uuid } from '../uuid';
import { useHouseholdId, useInvalidate, useMyMembership } from './hooks';
import { normalizeExpense, type Expense } from '@/features/expenses/domain';
import type { Pet, PetCare } from '@/features/pets/domain';
import type { PortionBatch, PortionUse } from '@/features/portions/domain';
import type { ReadingFavorite, ReadingLog } from '@/features/reading/domain';

/** La personne est parent (propriétaire ou co-parent) du foyer courant : seule à voir ces outils. */
export function useIsHouseholdParent(): { hid: string | null; parent: boolean; loading: boolean } {
  const hid = useHouseholdId();
  const m = useMyMembership();
  return { hid, parent: !!m && (m.role === 'owner' || m.role === 'coparent'), loading: !!hid && !m };
}

type Row = { id: string; _pending?: boolean };
/** Lignes d'une table filtrée + lignes encore en file hors ligne (même filtre simple « colonne = valeur »). */
function useRowsWithPending<T extends Row>(table: string, key: string[], filter: { col: string; value: string } | null, order: { col: string; asc?: boolean }[], normalize?: (r: T) => T) {
  const { session } = useAuth();
  const pending = useOfflineStore((s) => s.pending);
  const q = useQuery({
    queryKey: [session?.userId, table, ...key],
    enabled: !!filter,
    staleTime: 30_000,
    queryFn: async () => {
      const rows = await backend.select<T>({ table, filters: [eq(filter!.col, filter!.value)] as Filter[], order });
      return normalize ? rows.map(normalize) : rows;
    },
  });
  const data = useMemo(() => {
    if (!q.data) return undefined;
    const have = new Set(q.data.map((r) => r.id));
    const queued = pending.filter((p) => p.table === table && filter && p.row[filter.col] === filter.value && !have.has(String(p.row.id)))
      .map((p) => { const r = { ...(p.row as unknown as T), _pending: true }; return normalize ? normalize(r) : r; });
    // une modification en file remplace la ligne affichée
    const edited = q.data.map((r) => {
      const p = pending.find((x) => x.table === table && x.row.id === r.id);
      return p ? ({ ...r, ...(p.row as object), _pending: true } as T) : r;
    });
    return [...edited, ...queued];
  }, [q.data, pending, table, filter]);
  return { ...q, data };
}

function useSave<T extends Record<string, unknown>>(table: string, invalidate: string[], conflict = 'id') {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (row: T & { id?: string }) => {
      const payload: Record<string, unknown> = { ...row, id: row.id ?? uuid() };
      for (const k of ['_pending', 'created_at', 'updated_at', 'created_by']) delete payload[k];
      const r = await insertOrQueue(table, payload, { conflict, merge: true });
      return { id: payload.id as string, queued: r === 'queued' };
    },
    onSuccess: () => { void inv(table, ...invalidate); },
  });
}
/** Suppression ; `children` : lignes dépendantes retirées d'abord (le serveur les supprime aussi en cascade — même résultat en démonstration). */
function useRemove(table: string, invalidate: string[] = [], children: { table: string; col: string }[] = []) {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      for (const c of children) await backend.remove(c.table, [eq(c.col, id)]);
      await backend.remove(table, [eq('id', id)]);
    },
    onSuccess: () => { void inv(table, ...invalidate); },
  });
}

// ---------------------------------------------------------------- 186 Dépenses
export function useExpenses(hid: string | null) {
  const filter = useMemo(() => (hid ? { col: 'household_id', value: hid } : null), [hid]);
  return useRowsWithPending<Expense>('household_expenses', [hid ?? ''], filter, [{ col: 'spent_on', asc: false }, { col: 'created_at', asc: false }], normalizeExpense);
}
export const useSaveExpense = () => useSave<Omit<Expense, 'id'>>('household_expenses', []);
export const useDeleteExpense = () => useRemove('household_expenses');

// ---------------------------------------------------------------- 189 Animaux
export function usePets(hid: string | null) {
  const filter = useMemo(() => (hid ? { col: 'household_id', value: hid } : null), [hid]);
  return useRowsWithPending<Pet>('pets', [hid ?? ''], filter, [{ col: 'created_at', asc: true }]);
}
/** Animaux du foyer courant (missions, stocks) : vide pour une nounou (la RLS ne renvoie rien). */
export function useHouseholdPets() {
  const hid = useHouseholdId();
  return usePets(hid);
}
export const useSavePet = () => useSave<Omit<Pet, 'id'>>('pets', ['pet_care']);
export const useDeletePet = () => useRemove('pets', ['pet_care', 'family_tasks', 'household_stocks'], [{ table: 'pet_care', col: 'pet_id' }]);
export function usePetCare(hid: string | null) {
  const filter = useMemo(() => (hid ? { col: 'household_id', value: hid } : null), [hid]);
  return useRowsWithPending<PetCare>('pet_care', [hid ?? ''], filter, [{ col: 'created_at', asc: true }]);
}
export const useSavePetCare = () => useSave<Omit<PetCare, 'id'>>('pet_care', []);
export const useDeletePetCare = () => useRemove('pet_care');

/** Rappel d'un soin (rappels existants du téléphone : notification locale le jour saisi, 9 h). */
export function useCareReminder() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (a: { userId: string; hid: string; title: string; date: string; link: string; enabled: boolean }) => {
      await backend.remove('reminders', [eq('deep_link', a.link), eq('user_id', a.userId)]).catch(() => undefined);
      if (!a.enabled) return;
      const [y, m, d] = a.date.split('-').map(Number);
      const at = new Date(y, m - 1, d, 9, 0).toISOString();
      await insertOrQueue('reminders', {
        id: uuid(), user_id: a.userId, household_id: a.hid, category: 'custom', title: a.title, body: null, schedule: { type: 'once', at },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris', enabled: true, deep_link: a.link,
      });
    },
    onSuccess: () => { void inv('reminders'); },
  });
}

// ---------------------------------------------------------------- 122 Portions préparées
export function usePortionBatches(hid: string | null) {
  const filter = useMemo(() => (hid ? { col: 'household_id', value: hid } : null), [hid]);
  return useRowsWithPending<PortionBatch>('prepared_portions', [hid ?? ''], filter, [{ col: 'prepared_on', asc: false }],
    (r) => ({ ...r, portions_total: Number(r.portions_total) }));
}
export function usePortionUses(hid: string | null) {
  const filter = useMemo(() => (hid ? { col: 'household_id', value: hid } : null), [hid]);
  return useRowsWithPending<PortionUse>('prepared_portion_uses', [hid ?? ''], filter, [{ col: 'used_at', asc: true }], (r) => ({ ...r, count: Number(r.count) }));
}
export const useSaveBatch = () => useSave<Omit<PortionBatch, 'id'>>('prepared_portions', ['prepared_portion_uses']);
export const useDeleteBatch = () => useRemove('prepared_portions', ['prepared_portion_uses'], [{ table: 'prepared_portion_uses', col: 'portion_id' }]);
/** Une utilisation = une ligne (identifiant posé sur l'appareil : un envoi répété ne décompte pas deux fois). */
export function useUsePortion() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (a: { household_id: string; portion_id: string; count: number }) => {
      const r = await insertOrQueue('prepared_portion_uses', { id: uuid(), ...a, used_at: new Date().toISOString() }, { conflict: 'id' });
      return { queued: r === 'queued' };
    },
    onSuccess: () => { void inv('prepared_portion_uses'); },
  });
}
export const useUndoPortionUse = () => useRemove('prepared_portion_uses');

// ---------------------------------------------------------------- 133 Lecture
export function useReadingLogs(childId: string | null) {
  const filter = useMemo(() => (childId ? { col: 'child_id', value: childId } : null), [childId]);
  return useRowsWithPending<ReadingLog>('reading_logs', [childId ?? ''], filter, [{ col: 'read_on', asc: false }, { col: 'created_at', asc: false }],
    (r) => ({ ...r, minutes: r.minutes == null ? null : Number(r.minutes) }));
}
export const useSaveReading = () => useSave<Omit<ReadingLog, 'id'>>('reading_logs', []);
export const useDeleteReading = () => useRemove('reading_logs');
export function useReadingFavorites(childId: string | null) {
  const filter = useMemo(() => (childId ? { col: 'child_id', value: childId } : null), [childId]);
  return useRowsWithPending<ReadingFavorite>('reading_favorites', [childId ?? ''], filter, [{ col: 'created_at', asc: true }]);
}
export const useAddFavorite = () => useSave<Omit<ReadingFavorite, 'id'>>('reading_favorites', []);
export const useRemoveFavorite = () => useRemove('reading_favorites');
