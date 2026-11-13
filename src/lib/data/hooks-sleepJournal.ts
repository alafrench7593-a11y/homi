/**
 * Historique et journal du sommeil d'UN enfant : relevés sur 30 jours, repas notés (biberons, tétées, repas) pour
 * la chronologie des nuits, et notes datées (difficultés, changements de routine — table sleep_notes).
 * Tout est filtré par child_id : jamais de mélange entre enfants (jumeaux compris).
 */
import { useMemo } from 'react';
import { backend, eq, gte } from '../backend';
import { useInvalidate, useLogs, useRows } from './hooks';
import type { FeedEvent, SleepNote, SleepNoteDraft } from '../domain/sleepJournal';
import type { Bottle, Breastfeed, Child, Meal, Sleep } from '../types';

export const HISTORY_DAYS = 31;

export function useSleepHistory(childId: string | null | undefined) {
  const q = useLogs<Sleep>('sleep', childId, HISTORY_DAYS);
  return { sleeps: q.data ?? [], loading: q.isLoading, error: q.isError ? q.error : null, refetch: q.refetch };
}

/** Repas notés de cet enfant (pour information sur la chronologie de nuit ; aucune conclusion n'en est tirée). */
export function useFeedEvents(childId: string | null | undefined): FeedEvent[] {
  const b = useLogs<Bottle>('bottle', childId, HISTORY_DAYS);
  const f = useLogs<Breastfeed>('breastfeed', childId, HISTORY_DAYS);
  const m = useLogs<Meal>('meal', childId, HISTORY_DAYS);
  return useMemo(() => [
    ...(b.data ?? []).map((x) => ({ at: x.at, kind: 'bottle' as const, child_id: x.child_id })),
    ...(f.data ?? []).map((x) => ({ at: x.started_at, kind: 'breastfeed' as const, child_id: x.child_id })),
    ...(m.data ?? []).map((x) => ({ at: x.at, kind: 'meal' as const, child_id: x.child_id })),
  ], [b.data, f.data, m.data]);
}

export function useSleepNotes(childId: string | null | undefined) {
  const since = useMemo(() => new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString(), []);
  const q = useRows<SleepNote>(['sleep_notes', childId ?? ''], childId ? {
    table: 'sleep_notes', filters: [eq('child_id', childId), gte('noted_at', since)], order: [{ col: 'noted_at', asc: false }], limit: 200,
  } : null);
  return { notes: q.data ?? [], loading: q.isLoading };
}

export function useSleepNoteActions(child: Child | null | undefined) {
  const inv = useInvalidate();
  return {
    async add(d: SleepNoteDraft) {
      if (!child) throw new Error('child');
      await backend.insert('sleep_notes', {
        child_id: child.id, household_id: child.household_id, kind: d.kind, tags: d.tags,
        note: d.note.trim() || null, noted_at: d.notedAt.toISOString(),
      });
      inv('sleep_notes');
    },
    async remove(id: string) {
      await backend.remove('sleep_notes', [eq('id', id)]);
      inv('sleep_notes');
    },
  };
}
