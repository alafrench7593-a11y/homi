/** Données de l'allaitement : tétées, tirages, biberons (lecture), tétée chronométrée et réserve de lait (écriture). */
import { useMutation } from '@tanstack/react-query';
import { backend, eq } from '@/lib/backend';
import { useLogs, useInvalidate, useRows } from '@/lib/data/hooks';
import { insertOrQueue, useOfflineStore } from '@/lib/offline';
import { canSave, markSaved, toBreastfeedRows, type FeedSession } from '@/lib/domain/lactation';
import { useFeedSessionStore } from '@/lib/feedSessionStore';
import type { Bottle } from '@/lib/types';
import type { BreastfeedRecord, MilkStashRecord, PumpingRecord } from '@/lib/types-lactation';

/** Tétées, tirages et biberons des `days` derniers jours (saisies hors ligne en attente comprises). */
export function useFeedingLogs(childId: string | null | undefined, days = 3) {
  const breastfeeds = useLogs<BreastfeedRecord>('breastfeed', childId, days, { includePending: true });
  const pumpings = useLogs<PumpingRecord>('pumping', childId, days, { includePending: true });
  const bottles = useLogs<Bottle>('bottle', childId, days, { includePending: true });
  const all = [breastfeeds, pumpings, bottles];
  return {
    breastfeeds: breastfeeds.data ?? [],
    pumpings: pumpings.data ?? [],
    bottles: bottles.data ?? [],
    isLoading: all.some((q) => q.isLoading && !q.data),
    error: all.find((q) => q.isError && !q.data)?.error ?? null,
    refetch: () => all.forEach((q) => { void q.refetch(); }),
  };
}

/**
 * Enregistre une tétée chronométrée : une ligne par segment, identifiants dérivés de la session.
 * Protections contre le double enregistrement : session marquée « enregistrée » AVANT l'envoi (un second appui
 * ne repart pas), lignes déjà en file ignorées, et le serveur ignore un client_id déjà connu.
 */
export function useSaveFeedSession() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async ({ session, householdId, note }: { session: FeedSession; householdId: string | null; note: string | null }): Promise<'sent' | 'queued'> => {
      if (!canSave(session)) throw new Error('already_saved');
      const rows = toBreastfeedRows(session, note);
      const store = useFeedSessionStore.getState();
      // Marquée tout de suite : un double appui ou un retour sur l'écran ne renvoie rien
      store.setSession(session.childId, markSaved(session, Date.now()));
      const pending = new Set(useOfflineStore.getState().pending.map((p) => String(p.row.client_id ?? '')));
      let result: 'sent' | 'queued' = 'sent';
      try {
        for (const r of rows) {
          if (pending.has(r.client_id)) { result = 'queued'; continue; }
          const res = await insertOrQueue('breastfeeds', { ...r, household_id: householdId });
          if (res === 'queued') result = 'queued';
        }
      } catch (e) {
        // Refus (droits, abonnement…) : la session redevient enregistrable, rien n'est perdu
        store.setSession(session.childId, { ...session, savedAt: null });
        throw e;
      }
      store.setSession(session.childId, null);
      return result;
    },
    onSuccess: () => inv('breastfeeds'),
  });
}

export function useMilkStash(childId: string | null | undefined) {
  return useRows<MilkStashRecord>(['milk_stash', childId ?? ''], childId ? { table: 'milk_stash', filters: [eq('child_id', childId)], order: [{ col: 'collected_at', asc: false }], limit: 300 } : null);
}

export function useAddStash() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (row: Record<string, unknown>) => insertOrQueue('milk_stash', row),
    onSuccess: () => inv('milk_stash'),
  });
}

/** Changement de statut d'une portion : seulement si elle est encore disponible (un autre appareil a pu l'utiliser). */
export function useUpdateStash() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const rows = await backend.update('milk_stash', patch, [eq('id', id), eq('status', 'available')]);
      return Array.isArray(rows) ? rows.length : 1;
    },
    onSuccess: () => inv('milk_stash'),
  });
}

export function useDeleteStash() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => backend.remove('milk_stash', [eq('id', id)]),
    onSuccess: () => inv('milk_stash'),
  });
}
