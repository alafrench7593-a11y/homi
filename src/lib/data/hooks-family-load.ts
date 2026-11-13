/** Charge familiale : tâches, demandes, créneaux, routines (domaine « lists », partagé dans le foyer). */
import { t as tr } from '@/i18n';
import { useMutation } from '@tanstack/react-query';
import { backend, eq, gte } from '../backend';
import { useUserId } from '../auth';
import { insertOrQueue } from '../offline';
import { uuid } from '../uuid';
import { useHouseholdId, useHouseholdMembers, useInvalidate, useRows } from './hooks';
import type { CareRequest, CareShift, FamilyTask, RequestKind, Routine } from '../domain/familyLoad';
import type { FamilyEvent } from '../domain/calendar';
import type { HouseholdMember } from '../types';

export interface TaskEvent { id: string; task_id: string; household_id: string; actor_id: string | null; kind: string; detail: Record<string, unknown>; created_at: string }

const ROLE_KEY = { owner: 'u7.role.owner', coparent: 'u7.role.coparent', caregiver: 'u7.role.caregiver' } as const satisfies Record<HouseholdMember['role'], string>;
const roleLabel = (r: HouseholdMember['role']) => tr(ROLE_KEY[r]);

/** Membres du foyer, nommés par leur rôle (les profils ne sont pas exposés entre membres). */
export function usePeople() {
  const me = useUserId();
  const { data } = useHouseholdMembers();
  const list = (data ?? []).map((m, i, all) => {
    const sameRole = all.filter((x) => x.role === m.role);
    const label = m.user_id === me ? tr('u7.people.you') : sameRole.length > 1 ? `${roleLabel(m.role)} ${sameRole.indexOf(m) + 1}` : roleLabel(m.role);
    return { id: m.user_id, label, role: m.role };
  });
  const labelOf = (id: string | null | undefined) => (id ? list.find((p) => p.id === id)?.label ?? tr('u7.people.former') : tr('u7.people.nobody'));
  return { people: list, labelOf, me };
}

export function useFamilyTasks() {
  const hid = useHouseholdId();
  return useRows<FamilyTask>(['family_tasks', hid ?? ''], hid ? { table: 'family_tasks', filters: [eq('household_id', hid)], order: [{ col: 'due_at' }, { col: 'created_at' }], limit: 500 } : null);
}

export type TaskInput = Pick<FamilyTask, 'title' | 'category' | 'due_at' | 'assignee_id' | 'priority' | 'essential' | 'recurrence' | 'notes'> & { routine_id?: string | null };

export function useSaveTask() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: Partial<TaskInput> & { status?: FamilyTask['status'] } }) => {
      if (id) return backend.update('family_tasks', input, [eq('id', id)]);
      if (!hid) throw new Error(tr('l3.familyload.need_household'));
      // client_id unique par foyer : renvoyée par la file hors ligne sans jamais créer de doublon
      return insertOrQueue('family_tasks', { client_id: uuid(), ...input, household_id: hid });
    },
    onSuccess: () => inv('family_tasks', 'family_task_events'),
  });
}

/** Plusieurs tâches d'un coup (routine validée, report groupé) : une seule validation de l'utilisateur. */
export function useBatchTasks() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  return useMutation({
    mutationFn: async (a: { create?: Partial<TaskInput>[]; postpone?: { id: string; to: string }[] }) => {
      if (a.create?.length) {
        if (!hid) throw new Error(tr('l3.familyload.need_household'));
        await backend.insert('family_tasks', a.create.map((t) => ({ client_id: uuid(), ...t, household_id: hid })));
      }
      for (const p of a.postpone ?? []) await backend.update('family_tasks', { due_at: p.to }, [eq('id', p.id)]);
    },
    onSuccess: () => inv('family_tasks', 'family_task_events'),
  });
}

export function useDeleteTask() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.remove('family_tasks', [eq('id', id)]), onSuccess: () => inv('family_tasks', 'family_task_events') });
}

export function useTaskEvents(limit = 60) {
  const hid = useHouseholdId();
  return useRows<TaskEvent>(['family_task_events', hid ?? '', String(limit)], hid ? { table: 'family_task_events', filters: [eq('household_id', hid)], order: [{ col: 'created_at', asc: false }], limit } : null);
}

// ---------------------------------------------------------------- demandes
export function useCareRequests() {
  const hid = useHouseholdId();
  const since = new Date(Date.now() - 14 * 86400000).toISOString();
  return useRows<CareRequest>(['care_requests', hid ?? ''], hid ? { table: 'care_requests', filters: [eq('household_id', hid), gte('created_at', since)], order: [{ col: 'created_at', asc: false }], limit: 100 } : null);
}

export function useCreateRequest() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  return useMutation({
    mutationFn: async (r: { kind: RequestKind; message?: string | null; to_user?: string | null; task_id?: string | null; shift_id?: string | null; starts_at?: string | null; ends_at?: string | null }) => {
      if (!hid) throw new Error(tr('l3.familyload.need_household'));
      return backend.insert('care_requests', { client_id: uuid(), ...r, household_id: hid });
    },
    onSuccess: () => inv('care_requests'),
  });
}

export function useRespondRequest() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CareRequest['status'] }) => backend.update('care_requests', { status }, [eq('id', id)]),
    onSuccess: () => inv('care_requests', 'family_tasks', 'care_shifts', 'family_task_events'),
  });
}

// ---------------------------------------------------------------- créneaux
export function useCareShifts(kind?: CareShift['kind']) {
  const hid = useHouseholdId();
  const since = new Date(Date.now() - 14 * 86400000).toISOString();
  const filters = hid ? [eq('household_id', hid), gte('ends_at', since), ...(kind ? [eq('kind', kind)] : [])] : [];
  return useRows<CareShift>(['care_shifts', hid ?? '', kind ?? 'all'], hid ? { table: 'care_shifts', filters, order: [{ col: 'starts_at' }], limit: 200 } : null);
}

export function useSaveShifts() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  return useMutation({
    mutationFn: async (rows: { kind: CareShift['kind']; user_id: string; starts_at: string; ends_at: string; note?: string | null }[]) => {
      if (!hid) throw new Error(tr('l3.familyload.need_household'));
      return backend.insert('care_shifts', rows.map((r) => ({ ...r, household_id: hid })));
    },
    onSuccess: () => inv('care_shifts'),
  });
}

export function useUpdateShift() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CareShift> }) => backend.update('care_shifts', patch, [eq('id', id)]),
    onSuccess: () => inv('care_shifts'),
  });
}

export function useDeleteShift() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.remove('care_shifts', [eq('id', id)]), onSuccess: () => inv('care_shifts') });
}

// ---------------------------------------------------------------- routines
export function useRoutines() {
  const hid = useHouseholdId();
  return useRows<Routine>(['routines', hid ?? ''], hid ? { table: 'routines', filters: [eq('household_id', hid)], order: [{ col: 'created_at' }] } : null);
}

export function useSaveRoutine() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: Pick<Routine, 'title' | 'kind' | 'items' | 'default_assignee'> & { active?: boolean } }) => {
      if (id) return backend.update('routines', input, [eq('id', id)]);
      if (!hid) throw new Error(tr('l3.familyload.need_household'));
      return backend.insert('routines', { ...input, household_id: hid });
    },
    onSuccess: () => inv('routines'),
  });
}

export function useDeleteRoutine() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.remove('routines', [eq('id', id)]), onSuccess: () => inv('routines') });
}

// ---------------------------------------------------------------- agenda familial
export function useFamilyEvents() {
  const hid = useHouseholdId();
  return useRows<FamilyEvent>(['family_events', hid ?? ''], hid ? { table: 'family_events', filters: [eq('household_id', hid)], order: [{ col: 'starts_at' }], limit: 1000 } : null);
}

export type EventInput = Pick<FamilyEvent, 'title' | 'kind' | 'starts_at' | 'ends_at' | 'all_day' | 'location_label' | 'notes' | 'recurrence' | 'child_id'>;

export function useSaveEvent() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: Partial<EventInput> }) => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';
      if (id) return backend.update('family_events', input, [eq('id', id)]);
      if (!hid) throw new Error(tr('l3.familyload.need_household'));
      return insertOrQueue('family_events', { ...input, timezone, household_id: hid });
    },
    onSuccess: () => inv('family_events'),
  });
}

export function useDeleteEvent() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.remove('family_events', [eq('id', id)]), onSuccess: () => inv('family_events') });
}
