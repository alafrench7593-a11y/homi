/** « Mon sommeil » : accès au carnet personnel (table parent_sleep_logs, RLS propriétaire uniquement). */
import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { backend, eq } from '../backend';
import { useUserId } from '../auth';
import { useActivePregnancy, useChildren, useInvalidate, useProfile, useRows } from './hooks';
import { pregnancyProgress } from '../domain/pregnancy';
import { sleepContext, type SleepContext } from '../domain/parentSleep';
import { todayISO } from '../domain/dates';
import type { ParentSleepInput, ParentSleepLog } from '../types-sleep';

const TABLE = 'parent_sleep_logs';

export function useParentSleepLogs(limit = 60) {
  const userId = useUserId();
  // la limite fait partie de la clé : l'aperçu (1 nuit) ne doit pas masquer l'historique complet
  return useRows<ParentSleepLog>([TABLE, String(limit)], userId ? { table: TABLE, filters: [eq('user_id', userId)], order: [{ col: 'log_date', asc: false }], limit } : null);
}

/** Ajoute une nuit, ou met à jour celle du même jour si elle existe (une entrée par jour). */
export function useSaveParentSleep() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string | null; input: ParentSleepInput }) => {
      if (id) return backend.update<ParentSleepLog>(TABLE, { ...input }, [eq('id', id)]);
      return backend.insert<ParentSleepLog>(TABLE, { user_id: userId, ...input });
    },
    onSuccess: () => inv(TABLE),
  });
}

export function useDeleteParentSleep() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => backend.remove(TABLE, [eq('id', id)]),
    onSuccess: () => inv(TABLE),
  });
}

/** Grossesse en cours / bébé de moins d'un an, pour adapter les repères. */
export function useSleepContext(): SleepContext {
  const { data: profile } = useProfile();
  const pregnancy = useActivePregnancy();
  const { data: children } = useChildren();
  return useMemo(() => {
    const today = todayISO();
    return sleepContext({
      journeys: profile?.journeys ?? [],
      activePregnancyWeeksSA: pregnancy ? pregnancyProgress(pregnancy.due_date, today).weeksSA : null,
      childBirthDates: (children ?? []).map((c) => c.birth_date),
      today,
    });
  }, [profile?.journeys, pregnancy, children]);
}
