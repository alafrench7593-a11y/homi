/** Charge familiale : tâches, demandes, créneaux, routines (domaine « lists », partagé dans le foyer). */
import { t as tr } from '@/i18n';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { backend, eq, gte } from '../backend';
import { useUserId } from '../auth';
import { insertOrQueue } from '../offline';
import { changedFields, mergeUpdate } from '../offlineConflicts';
import { derivedId, withIdempotentId } from '../idempotency';
import { useHouseholdId, useHouseholdMembers, useInvalidate, useRows } from './hooks';
import type { CareRequest, CareShift, FamilyTask, RequestKind, Routine } from '../domain/familyLoad';
import type { FamilyEvent } from '../domain/calendar';
import type { HouseholdMember } from '../types';

export interface TaskEvent { id: string; task_id: string; household_id: string; actor_id: string | null; kind: string; detail: Record<string, unknown>; created_at: string }

const ROLE_KEY = { owner: 'u7.role.owner', coparent: 'u7.role.coparent', caregiver: 'u7.role.caregiver' } as const satisfies Record<HouseholdMember['role'], string>;
const roleLabel = (r: HouseholdMember['role']) => tr(ROLE_KEY[r]);

/** Prénom affiché + photo d'un membre actif du foyer (RPC household_member_names : rien d'autre du profil). */
export interface MemberName { household_id: string; user_id: string; role: HouseholdMember['role']; display_name: string | null; avatar_path: string | null }

/**
 * Prénoms et photos des membres actifs de mon foyer (16/11/2026). Le serveur décide de ce qui est visible :
 * parents → tous les membres ; nounou → les parents (et elle-même) ; autre foyer, ex-membre → rien.
 */
export function useMemberNames() {
  const me = useUserId();
  const hid = useHouseholdId();
  return useQuery({
    // 'profile' et 'members' dans la clé : un prénom ou une photo modifiés, un membre ajouté / retiré la rafraîchissent
    queryKey: [me, 'member_names', hid ?? '', 'profile', 'members'],
    queryFn: async () => ((await backend.rpc<MemberName[]>('household_member_names', { p_household: hid })) ?? []),
    enabled: !!me && !!hid,
    staleTime: 5 * 60_000,
  });
}

export interface Person {
  id: string;
  /** Libellé dans une phrase : « Vous » pour moi, sinon le prénom (rôle si le prénom n'est pas renseigné / visible). */
  label: string;
  /** Prénom affiché (le mien compris) ; rôle en dernier recours. */
  name: string;
  initial: string;
  avatarPath: string | null;
  role: HouseholdMember['role'];
  isMe: boolean;
}

/** Membres du foyer, nommés par leur PRÉNOM (household_member_names) ; le rôle seulement si aucun prénom n'est visible. */
export function usePeople() {
  const me = useUserId();
  const { data } = useHouseholdMembers();
  const names = useMemberNames().data;
  const list: Person[] = (data ?? []).map((m, i, all) => {
    const sameRole = all.filter((x) => x.role === m.role);
    const byRole = sameRole.length > 1 ? `${roleLabel(m.role)} ${sameRole.indexOf(m) + 1}` : roleLabel(m.role);
    const n = names?.find((x) => x.user_id === m.user_id);
    const name = n?.display_name?.trim() || byRole;
    const isMe = m.user_id === me;
    return { id: m.user_id, label: isMe ? tr('u7.people.you') : name, name, initial: (name.trim()[0] ?? '?').toUpperCase(), avatarPath: n?.avatar_path ?? null, role: m.role, isMe };
  });
  const labelOf = (id: string | null | undefined) => (id ? list.find((p) => p.id === id)?.label ?? tr('u7.people.former') : tr('u7.people.nobody'));
  /** Prénom (jamais « Vous ») : pour afficher qui porte une tâche à côté de son avatar. */
  const nameOf = (id: string | null | undefined) => (id ? list.find((p) => p.id === id)?.name ?? tr('u7.people.former') : tr('u7.people.nobody'));
  const personOf = (id: string | null | undefined): Person | null => (id ? list.find((p) => p.id === id) ?? null : null);
  return { people: list, labelOf, nameOf, personOf, me };
}

export function useFamilyTasks() {
  const hid = useHouseholdId();
  return useRows<FamilyTask>(['family_tasks', hid ?? ''], hid ? { table: 'family_tasks', filters: [eq('household_id', hid)], order: [{ col: 'due_at' }, { col: 'created_at' }], limit: 500 } : null);
}

export type TaskInput = Pick<FamilyTask, 'title' | 'category' | 'due_at' | 'assignee_id' | 'priority' | 'essential' | 'recurrence' | 'notes'> & { routine_id?: string | null };

/** Tâche déjà lue (cache) : sert à reconnaître une mission, dont l'état ne change que par ses réponses. */
function cachedTask(qc: QueryClient, id: string): (FamilyTask & { mission_state?: string | null }) | undefined {
  for (const [, rows] of qc.getQueriesData<FamilyTask[]>({ predicate: (q) => q.queryKey.includes('family_tasks') })) {
    const hit = Array.isArray(rows) ? rows.find((r) => r?.id === id) : undefined;
    if (hit) return hit;
  }
  return undefined;
}

export function useSaveTask() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  const qc = useQueryClient();
  return useMutation({
    /** `base` : la tâche telle qu'elle était à l'ouverture du formulaire (avec sa version) ; à défaut, la copie en cache. */
    mutationFn: async ({ id, input, base }: { id?: string; input: Partial<TaskInput> & { status?: FamilyTask['status'] }; base?: FamilyTask | null }) => {
      // Mission (14/11/2026) : « fait » / « annulé » passent par sa réponse serveur (mission_respond), jamais par un update direct
      const known = id ? cachedTask(qc, id) : undefined;
      if (id && known?.mission_state && input.status && input.status !== known.status) {
        const action = input.status === 'done' ? 'complete' : input.status === 'cancelled' ? 'cancel' : null;
        if (action) return backend.rpc('mission_respond', { p_task: id, p_action: action });
      }
      // Audit 08 : plus d'écrasement silencieux. Seuls les champs réellement modifiés partent, à la version lue
      // (update_if_version) ; une modification concurrente d'un AUTRE champ est reportée, un vrai conflit est refusé.
      const read = (base ?? known) as Record<string, unknown> | undefined;
      if (id && read && Object.keys(changedFields(read, input)).every((k) => VERSIONED_TASK_FIELDS.includes(k))) {
        return mergeUpdate('family_tasks', id, read, input, { conflict: tr('rel.task.conflict'), notFound: tr('rel.task.notFound') });
      }
      if (id) return backend.update('family_tasks', input, [eq('id', id)]);
      if (!hid) throw new Error(tr('l3.familyload.need_household'));
      // client_id unique par foyer : renvoyée par la file hors ligne sans jamais créer de doublon
      // Audit 08 : double pression (deux envois simultanés du même contenu) → même client_id → une seule tâche
      const row = { ...input, household_id: hid };
      return withIdempotentId('family_tasks', row, (client_id) => insertOrQueue('family_tasks', { client_id, ...row }));
    },
    onSuccess: () => inv('family_tasks', 'family_task_events', 'shopping_items', 'notifications'),
    // Conflit ou tâche disparue : la version à jour est relue tout de suite (le message renvoie à ce qui est affiché)
    onError: (e) => { if ((e as { code?: string }).code === 'conflict' || (e as { code?: string }).code === 'not_found') inv('family_tasks'); },
  });
}
/** Colonnes modifiables par update_if_version sur family_tasks (liste blanche du serveur). */
const VERSIONED_TASK_FIELDS = ['title', 'category', 'due_at', 'assignee_id', 'priority', 'essential', 'recurrence', 'status', 'notes'];

/** Plusieurs tâches d'un coup (routine validée, report groupé) : une seule validation de l'utilisateur. */
export function useBatchTasks() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  return useMutation({
    mutationFn: async (a: { create?: Partial<TaskInput>[]; postpone?: { id: string; to: string }[] }) => {
      if (a.create?.length) {
        if (!hid) throw new Error(tr('l3.familyload.need_household'));
        // Audit 08 : lot rejoué (réponse perdue, report en échec au milieu) → mêmes client_id → aucune tâche en double
        const rows = a.create;
        await withIdempotentId('family_tasks.batch', { hid, rows }, (batch) =>
          backend.insert('family_tasks', rows.map((t, n) => ({ client_id: derivedId(batch, n), ...t, household_id: hid })), { onConflict: 'household_id,client_id', ignoreDuplicates: true }));
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
      // Audit 08 : même demande renvoyée après une réponse perdue ou une double pression → même client_id → aucun doublon
      const row = { ...r, household_id: hid };
      return withIdempotentId('care_requests', row, (client_id) =>
        backend.insert('care_requests', { client_id, ...row }, { onConflict: 'household_id,client_id', ignoreDuplicates: true }));
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
