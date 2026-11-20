/**
 * Missions familiales : lecture (les missions SONT des tâches du foyer, même requête que l'organisation familiale)
 * et réponses (RPC create_mission / mission_respond : le serveur valide chaque transition).
 */
import { useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { t as tr } from '@/i18n';
import { backend, BackendError, eq } from '../backend';
import { useUserId } from '../auth';
import { uuid } from '../uuid';
import { rpcOrQueue, useOfflineStore } from '../offline';
import { useHouseholdId, useInvalidate, useRows } from './hooks';
import { useFamilyTasks, type TaskEvent } from './hooks-family-load';
import { isMission, nextState, receivedMissions, sentMissions, sortMissions, type Mission, type MissionAction } from '../domain/missions';
import type { TaskCategory } from '../domain/familyLoad';

/** Toutes les missions du foyer visibles par la personne (le serveur a déjà filtré : foyer, enfant confié). */
export function useMissions() {
  const q = useFamilyTasks();
  const me = useUserId();
  const all = useMemo(() => ((q.data ?? []) as Mission[]).filter(isMission), [q.data]);
  const received = useMemo(() => sortMissions(receivedMissions(all, me)), [all, me]);
  const sent = useMemo(() => sortMissions(sentMissions(all, me)), [all, me]);
  return { ...q, all, received, sent, me };
}

export function useMission(id: string | undefined) {
  const m = useMissions();
  return { ...m, mission: m.all.find((x) => x.id === id) ?? null };
}

/** Historique d'une mission, du plus ancien au plus récent (ajout seul, écrit par le serveur). */
export function useMissionHistory(taskId: string | undefined) {
  const hid = useHouseholdId();
  return useRows<TaskEvent>(['family_task_events', 'mission', taskId ?? ''], hid && taskId ? { table: 'family_task_events', filters: [eq('task_id', taskId)], order: [{ col: 'created_at' }], limit: 200 } : null);
}

export interface ShoppingItemLite { id: string; label: string; checked: boolean; list_id: string; checked_by: string | null; stock_id: string | null }
export function useShoppingItem(id: string | null | undefined) {
  const q = useRows<ShoppingItemLite>(['shopping_items', 'one', id ?? ''], id ? { table: 'shopping_items', columns: 'id,label,checked,list_id,checked_by,stock_id', filters: [eq('id', id)] } : null);
  return q.data?.[0] ?? null;
}

export interface MissionInput {
  title: string; assignee_id: string | null; category: TaskCategory; notes?: string | null; due_at?: string | null; all_day?: boolean;
  priority?: 'low' | 'normal' | 'high'; recurrence?: { type: 'daily' | 'weekly' | 'monthly'; every?: number } | null;
  child_id?: string | null; product_label?: string | null; document_id?: string | null; shopping_item_id?: string | null;
  /** Animal du foyer (outil Animaux, 20261128300200) : même foyer, vérifié par le serveur. */
  pet_id?: string | null;
}

const INVALIDATE = ['family_tasks', 'family_task_events', 'shopping_items', 'shopping_lists', 'notifications'] as const;

export function useCreateMission() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  return useMutation({
    // client_id : un nouvel essai après une coupure renvoie la même mission (jamais de doublon)
    mutationFn: async (input: MissionInput & { client_id?: string }) => {
      if (!hid) throw new Error(tr('l3.familyload.need_household'));
      return backend.rpc<Mission>('create_mission', {
        p_household: hid, p_title: input.title, p_assignee: input.assignee_id, p_category: input.category, p_notes: input.notes ?? null,
        p_due_at: input.due_at ?? null, p_all_day: !!input.all_day, p_priority: input.priority ?? 'normal', p_recurrence: input.recurrence ?? null,
        p_child_id: input.child_id ?? null, p_pet_id: input.pet_id ?? null, p_shopping_item_id: input.shopping_item_id ?? null, p_product_label: input.product_label ?? null,
        p_document_id: input.document_id ?? null, p_domain_key: null, p_client_id: input.client_id ?? uuid(),
      });
    },
    onSuccess: () => inv(...INVALIDATE),
  });
}

export interface RespondArgs { id: string; action: MissionAction; note?: string | null; due_at?: string | null; assignee_id?: string | null; version?: number }
/** `queued` : réponse gardée sur le téléphone (hors connexion), envoyée une fois au retour du réseau. */
type RespondResult = { status: 'ok' | 'not_found' | 'conflict'; unchanged?: boolean; queued?: boolean; row?: Mission };
/** Réponses qui peuvent attendre le réseau : rejouées par le serveur sans effet de bord (« inchangé »). */
const QUEUEABLE: MissionAction[] = ['accept', 'start', 'complete'];
/** Résultat réel d'une réponse, pour la confirmation affichée : fait maintenant, ou déjà fait (rejeu). */
export type RespondResultStatus = 'ok' | 'unchanged';

/** Réponse à une mission. « not_found » et « conflict » deviennent des erreurs lisibles. */
export async function respondMission(a: RespondArgs): Promise<RespondResult> {
  const args = { p_task: a.id, p_action: a.action, p_note: a.note ?? null, p_due_at: a.due_at ?? null, p_assignee: a.assignee_id ?? null, p_expected_version: a.version ?? null };
  let out: RespondResult;
  if (QUEUEABLE.includes(a.action) && !a.note) {
    // Hors connexion : mise en file SANS version attendue (le rejeu doit rester « inchangé », jamais « conflit »)
    const r = await rpcOrQueue<RespondResult>('mission_respond', { ...args, p_expected_version: online() ? args.p_expected_version : null });
    if (r.queued) return { status: 'ok', queued: true };
    out = r.result;
  } else out = await backend.rpc<RespondResult>('mission_respond', args);
  if (out?.status === 'not_found') throw new BackendError(tr('mis.detail.notFound'), 'not_found');
  return out;
}
const online = () => useOfflineStore.getState().online;

/** Réponse en file : la liste montre tout de suite le nouvel état (la file l'enverra ; le serveur reste juge). */
function applyLocally(qc: QueryClient, a: RespondArgs) {
  qc.setQueriesData<Mission[]>({ predicate: (q) => q.queryKey.includes('family_tasks') }, (rows) => {
    if (!Array.isArray(rows)) return rows;
    return rows.map((r) => {
      if (r?.id !== a.id || !r.mission_state) return r;
      const next = nextState(r.mission_state, a.action);
      if (!next) return r;
      return { ...r, mission_state: next, status: next === 'done' ? 'done' : 'todo', done_at: next === 'done' ? new Date().toISOString() : r.done_at };
    });
  });
}

export function useRespondMission() {
  const inv = useInvalidate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: respondMission,
    onSuccess: (out, a) => { if (out?.queued) applyLocally(qc, a); else inv(...INVALIDATE); },
  });
}

// ---------------------------------------------------------------- historique « Terminées » (paginé)
export const DONE_PAGE = 20;
/**
 * Missions terminées du foyer, des plus récentes aux plus anciennes, par pages de 20 (curseur : date de réalisation).
 * Requête à part : l'écran principal ne charge jamais l'historique.
 */
export function useDoneMissions() {
  const hid = useHouseholdId();
  const me = useUserId();
  return useInfiniteQuery({
    queryKey: [me, 'family_tasks', 'done-history', hid ?? ''],
    enabled: !!hid,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => backend.select<Mission>({
      table: 'family_tasks',
      filters: [eq('household_id', hid), eq('mission_state', 'done'), ...(pageParam ? [{ col: 'done_at', op: 'lt' as const, value: pageParam }] : [])],
      order: [{ col: 'done_at', asc: false }],
      limit: DONE_PAGE,
    }),
    getNextPageParam: (last) => (last.length < DONE_PAGE ? null : last[last.length - 1]?.done_at ?? null),
  });
}

/** Démonstration : une seconde personne rejoint le foyer, puis on peut « voir comme » elle (les deux côtés d'une mission). */
export function useDemoSwitchPerson() {
  return useMutation({
    mutationFn: async (to?: string) => {
      const target = to ?? (await backend.rpc<{ user_id: string }>('demo_mission_partner')).user_id;
      return backend.rpc('demo_switch_person', { p_user: target });
    },
  });
}
