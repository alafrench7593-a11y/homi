/**
 * 73/74 stock de lait · 76/77 difficultés et douleurs d'allaitement · 79 laits infantiles — accès aux données
 * (20261127000200_naissance_postpartum_allaitement.sql). Le serveur décide (RLS) : stock = parents du foyer ;
 * difficultés = la personne seule ; laits = parents de l'enfant (lecture par la nounou confirmée).
 * Écritures par insertOrQueue (file hors connexion, identifiant posé sur l'appareil).
 */
import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { backend, eq, gte } from '../backend';
import { useUserId } from '../auth';
import { insertOrQueue, useOfflineStore } from '../offline';
import { uuid } from '../uuid';
import { useHouseholdId, useInvalidate, useRows } from './hooks';
import { resync } from './hooks-settings';
import { withPending } from './hooks-birthCare';
import type { MilkItem } from '@/features/feeding/milkStock';
import type { FeedingIssue, FeedLite } from '@/features/feeding/issues';
import type { FormulaChange } from '@/features/feeding/formula';
import type { Pumping } from '../types';

// ---------------------------------------------------------------- 73/74 stock de lait maternel
export function useMilkStock(householdId: string | null) {
  const pending = useOfflineStore((s) => s.pending);
  const q = useRows<MilkItem>(['milk_stock', householdId ?? ''], householdId ? { table: 'milk_stock', filters: [eq('household_id', householdId)], order: [{ col: 'expressed_at', asc: true }], limit: 500 } : null);
  const data = useMemo(() => withPending(q.data, pending, 'milk_stock', (r) => r.household_id === householdId), [q.data, pending, householdId]);
  return { ...q, data };
}

/** Séances de tire-lait récentes de l'enfant (suivi existant 71/72) : à ranger sans ressaisir. */
export function useRecentPumpings(childId: string | null, days = 3) {
  const since = useMemo(() => new Date(Date.now() - days * 86_400_000).toISOString(), [days]);
  return useRows<Pumping>(['pumpings', 'stock', childId ?? '', since.slice(0, 13)], childId ? { table: 'pumpings', filters: [eq('child_id', childId), gte('at', since)], order: [{ col: 'at', asc: false }], limit: 50 } : null);
}

/**
 * Enregistrement d'un contenant (création ou modification, même ligne). Rappel « avant la date limite » (74) : un
 * rappel ponctuel de la personne dans la table des rappels existante (notifications locales), remplacé à chaque
 * modification ; le rappel demande le réseau, le contenant part en file hors connexion.
 */
export function useSaveMilk() {
  const inv = useInvalidate();
  const me = useUserId();
  return useMutation({
    mutationFn: async (a: { row: Partial<MilkItem> & { household_id: string }; reminder?: { at: string | null; title: string; previousId?: string | null } }) => {
      const id = a.row.id ?? uuid();
      const row: Record<string, unknown> = { status: 'stored', closed_at: null, ...a.row, id };
      delete row._pending; delete row.created_at; delete row.updated_at; delete row.created_by;
      const r = await insertOrQueue('milk_stock', row, { conflict: 'id', merge: true });
      if (a.reminder && useOfflineStore.getState().online) {
        if (a.reminder.previousId) await backend.remove('reminders', [eq('id', a.reminder.previousId)]).catch(() => undefined);
        if (a.reminder.at) {
          await backend.insert('reminders', {
            id: uuid(), user_id: me, household_id: a.row.household_id, child_id: a.row.child_id ?? null, category: 'bottle', title: a.reminder.title, body: null,
            schedule: { type: 'once', at: a.reminder.at }, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris', enabled: true, deep_link: `/feeding/milk-stock?item=${id}`,
          });
        }
        if (me) void resync(me);
      }
      return { id, queued: r === 'queued' };
    },
    onSuccess: () => { void inv('milk_stock', 'reminders'); },
  });
}
export function useDeleteMilk() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => { await backend.remove('milk_stock', [eq('id', id)]); },
    onSuccess: () => { void inv('milk_stock'); },
  });
}
/** Rappel déjà programmé pour un contenant (lien profond), pour le remplacer ou l'annuler. */
export function useMilkReminders() {
  const me = useUserId();
  return useRows<{ id: string; deep_link: string | null; schedule: { type: string; at?: string } }>(['reminders', 'milk', me ?? ''], me ? { table: 'reminders', filters: [eq('user_id', me), eq('category', 'bottle')] } : null);
}

// ---------------------------------------------------------------- 76/77 difficultés et douleurs pendant les tétées
export function useFeedingIssues(childId: string | null) {
  const me = useUserId();
  const pending = useOfflineStore((s) => s.pending);
  const q = useRows<FeedingIssue>(['breastfeeding_issues', me ?? '', childId ?? 'all'], me ? { table: 'breastfeeding_issues', filters: [eq('user_id', me), ...(childId ? [eq('child_id', childId)] : [])], order: [{ col: 'at', asc: false }], limit: 300 } : null);
  const data = useMemo(() => withPending(q.data, pending, 'breastfeeding_issues', (r) => !childId || r.child_id === childId), [q.data, pending, childId]);
  return { ...q, data };
}
/** Tétées existantes de l'enfant (historique des tétées), pour relier une difficulté et la montrer au bon jour. */
export function useRecentFeeds(childId: string | null, days = 14) {
  const since = useMemo(() => new Date(Date.now() - days * 86_400_000).toISOString(), [days]);
  return useRows<FeedLite>(['breastfeeds', 'issues', childId ?? '', since.slice(0, 13)], childId ? { table: 'breastfeeds', columns: 'id,started_at,ended_at,side', filters: [eq('child_id', childId), gte('started_at', since)], order: [{ col: 'started_at', asc: false }], limit: 400 } : null);
}
export function useSaveIssue() {
  const inv = useInvalidate();
  const me = useUserId();
  return useMutation({
    mutationFn: async (row: Partial<FeedingIssue> & { at: string; kind: FeedingIssue['kind'] }) => {
      const out: Record<string, unknown> = { ...row, id: row.id ?? uuid(), user_id: me };
      delete out._pending; delete out.created_at;
      return insertOrQueue('breastfeeding_issues', out, { conflict: 'id', merge: true });
    },
    onSuccess: () => { void inv('breastfeeding_issues'); },
  });
}
export function useDeleteIssue() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => { await backend.remove('breastfeeding_issues', [eq('id', id)]); },
    onSuccess: () => { void inv('breastfeeding_issues'); },
  });
}

// ---------------------------------------------------------------- 79 laits infantiles
export function useFormulaChanges(childId: string | null) {
  const pending = useOfflineStore((s) => s.pending);
  const q = useRows<FormulaChange>(['formula_changes', childId ?? ''], childId ? { table: 'formula_changes', filters: [eq('child_id', childId)], order: [{ col: 'started_on', asc: false }], limit: 200 } : null);
  const data = useMemo(() => withPending(q.data, pending, 'formula_changes', (r) => r.child_id === childId), [q.data, pending, childId]);
  return { ...q, data };
}
export function useSaveFormula() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  return useMutation({
    mutationFn: async (row: Partial<FormulaChange> & { child_id: string; household_id?: string }) => {
      const out: Record<string, unknown> = { household_id: hid, ...row, id: row.id ?? uuid() };
      delete out._pending; delete out.created_at; delete out.updated_at; delete out.created_by;
      return insertOrQueue('formula_changes', out, { conflict: 'id', merge: true });
    },
    onSuccess: () => { void inv('formula_changes'); },
  });
}
export function useDeleteFormula() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => { await backend.remove('formula_changes', [eq('id', id)]); },
    onSuccess: () => { void inv('formula_changes'); },
  });
}
