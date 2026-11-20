/**
 * Numéros partiels complétés (29/11/2026) — accès aux données (20261129400100_partiels_suivi_allaitement.sql).
 *  - 42 analyses (lab_results) et 50 souvenirs de grossesse (pregnancy_memories) : la personne seule ;
 *  - 80 relais de biberons (bottle_relays) : parents du foyer.
 * Écritures par insertOrQueue (identifiant posé sur l'appareil : envoi répété sans doublon, file hors connexion) ;
 * les lignes encore en file s'affichent tout de suite, marquées « en attente ».
 */
import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { backend, eq, gte } from '../backend';
import { useUserId } from '../auth';
import { insertOrQueue, useOfflineStore } from '../offline';
import { uuid } from '../uuid';
import { useInvalidate, useRows } from './hooks';
import { withPending } from './hooks-birthCare';
import type { LabResult } from '@/features/labs/domain';
import type { PregnancyMemory } from '@/features/pregnancyMemories/domain';
import type { BottleRelay } from '@/features/feeding/relays';

const clean = (row: Record<string, unknown>, extra: string[] = []) => {
  for (const k of ['_pending', 'created_at', 'updated_at', ...extra]) delete row[k];
  return row;
};

// ---------------------------------------------------------------- 42 analyses
export function useLabResults() {
  const me = useUserId();
  const pending = useOfflineStore((s) => s.pending);
  const q = useRows<LabResult>(['lab_results', me ?? ''], me ? { table: 'lab_results', filters: [eq('user_id', me)], order: [{ col: 'measured_on', asc: false }], limit: 1000 } : null);
  const data = useMemo(() => withPending(q.data, pending, 'lab_results', () => true), [q.data, pending]);
  return { ...q, data };
}
export function useSaveLab() {
  const inv = useInvalidate();
  const me = useUserId();
  return useMutation({
    mutationFn: async (row: Partial<LabResult> & { name: string; value: number; measured_on: string }) => {
      const out = clean({ ...row, id: row.id ?? uuid(), user_id: me });
      const r = await insertOrQueue('lab_results', out, { conflict: 'id', merge: true });
      return { id: out.id as string, queued: r === 'queued' };
    },
    onSuccess: () => { void inv('lab_results'); },
  });
}
export function useDeleteLab() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => { await backend.remove('lab_results', [eq('id', id)]); },
    onSuccess: () => { void inv('lab_results'); },
  });
}

// ---------------------------------------------------------------- 50 souvenirs de grossesse
export function usePregnancyMemories() {
  const me = useUserId();
  const pending = useOfflineStore((s) => s.pending);
  const q = useRows<PregnancyMemory>(['pregnancy_memories', me ?? ''], me ? { table: 'pregnancy_memories', filters: [eq('user_id', me)], order: [{ col: 'happened_on', asc: false }], limit: 500 } : null);
  const data = useMemo(() => withPending(q.data, pending, 'pregnancy_memories', () => true), [q.data, pending]);
  return { ...q, data };
}
export function useSaveMemory() {
  const inv = useInvalidate();
  const me = useUserId();
  return useMutation({
    mutationFn: async (row: Partial<PregnancyMemory> & { happened_on: string }) => {
      const out = clean({ kind: 'moment', photo_ids: [], ...row, id: row.id ?? uuid(), user_id: me });
      const r = await insertOrQueue('pregnancy_memories', out, { conflict: 'id', merge: true });
      return { id: out.id as string, queued: r === 'queued' };
    },
    onSuccess: () => { void inv('pregnancy_memories'); },
  });
}
export function useDeleteMemory() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (m: Pick<PregnancyMemory, 'id' | 'photo_ids'> & { removePhotos: boolean }) => {
      await backend.remove('pregnancy_memories', [eq('id', m.id)]);
      // Photos : effacées avec le souvenir seulement si la personne le demande (elles restent sinon dans ses documents)
      if (m.removePhotos) for (const id of m.photo_ids) await backend.remove('documents', [eq('id', id)]).catch(() => undefined);
    },
    onSuccess: () => { void inv('pregnancy_memories', 'documents'); },
  });
}

/** Adresse temporaire d'une photo privée du coffre (affichage seulement ; jamais de lien public). */
export function useDocImageUrl(storagePath: string | null | undefined) {
  return useQuery({
    queryKey: ['doc-image', storagePath ?? ''],
    queryFn: () => backend.storage.signedUrl('documents', storagePath!, 600),
    enabled: !!storagePath,
    staleTime: 300_000,
  });
}

// ---------------------------------------------------------------- 80 relais de biberons
export function useBottleRelays(householdId: string | null, childId?: string | null) {
  const pending = useOfflineStore((s) => s.pending);
  const since = useMemo(() => new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 13), []);
  const q = useRows<BottleRelay>(['bottle_relays', householdId ?? '', childId ?? 'all', since], householdId
    ? { table: 'bottle_relays', filters: [eq('household_id', householdId), gte('planned_at', `${since}:00:00.000Z`), ...(childId ? [eq('child_id', childId)] : [])], order: [{ col: 'planned_at', asc: true }], limit: 300 }
    : null);
  const data = useMemo(() => withPending(q.data, pending, 'bottle_relays', (r) => r.household_id === householdId && (!childId || r.child_id === childId)), [q.data, pending, householdId, childId]);
  return { ...q, data };
}
export function useSaveRelays() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (rows: (Partial<BottleRelay> & { household_id: string; child_id: string; planned_at: string; assigned_to: string })[]) => {
      let queued = false;
      for (const row of rows) {
        const out = clean({ status: 'planned', bottle_id: null, given_at: null, planned_ml: null, note: null, ...row, id: row.id ?? uuid() }, ['created_by']);
        if ((await insertOrQueue('bottle_relays', out, { conflict: 'id', merge: true })) === 'queued') queued = true;
      }
      return { queued };
    },
    onSuccess: () => { void inv('bottle_relays'); },
  });
}
export function useDeleteRelay() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => { await backend.remove('bottle_relays', [eq('id', id)]); },
    onSuccess: () => { void inv('bottle_relays'); },
  });
}
