/**
 * 172 Mode embrouille et 179 Missions de reconnexion — accès aux données (20261127000100_couple_embrouille_reconnexion.sql).
 *  - calm_modes : interrupteur personnel (insertOrQueue, remplacé, jamais dupliqué) ;
 *  - calm_requests : demandes pratiques = missions (calm_request_send, rejouable : rpcOrQueue) ; réponses par
 *    mission_respond (accepter, ne peut pas, terminé), mêmes règles et même historique que les missions ;
 *  - couple_moments : propositions (insertOrQueue), réponses par couple_moment_respond (rpcOrQueue, rejouables).
 */
import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { backend, eq } from '../backend';
import { useUserId } from '../auth';
import { insertOrQueue, rpcOrQueue, useOfflineStore } from '../offline';
import { uuid } from '../uuid';
import { useHouseholdId, useInvalidate, useRows } from './hooks';
import { usePeople } from './hooks-family-load';
import { useMissions } from './hooks-missions';
import { nextState, type MissionState } from '../domain/missions';
import type { CalmReply, CalmRequestRow, CalmTemplateKey } from '@/features/calm/domain';
import { nextMomentStatus, type Moment, type MomentAction } from '@/features/moments/domain';

// ---------------------------------------------------------------- l'autre parent
/** L'autre adulte du couple (propriétaire ou co-parent du foyer, autre que moi), s'il existe. */
export function useOtherParent() {
  const { people } = usePeople();
  return useMemo(() => people.find((p) => !p.isMe && (p.role === 'owner' || p.role === 'coparent')) ?? null, [people]);
}

// ---------------------------------------------------------------- mode embrouille
export interface CalmMode { user_id: string; active: boolean; changed_at: string }
export function useCalmMode() {
  const me = useUserId();
  const pending = useOfflineStore((s) => s.pending);
  const q = useRows<CalmMode>(['calm_modes', me ?? ''], me ? { table: 'calm_modes', filters: [eq('user_id', me)] } : null);
  // Bascule faite hors connexion : l'écran suit tout de suite la dernière valeur en attente
  const queued = [...pending].reverse().find((p) => p.table === 'calm_modes');
  const active = queued ? !!queued.row.active : !!q.data?.[0]?.active;
  return { ...q, active, since: q.data?.[0]?.changed_at ?? null };
}
export function useSetCalmMode() {
  const inv = useInvalidate();
  const me = useUserId();
  return useMutation({
    mutationFn: async (active: boolean) => insertOrQueue('calm_modes', { user_id: me, active }, { conflict: 'user_id', merge: true }),
    onSuccess: () => { void inv('calm_modes'); },
  });
}

// ---------------------------------------------------------------- demandes pratiques
export function useCalmRequests() {
  const hid = useHouseholdId();
  const me = useUserId();
  const q = useRows<CalmRequestRow>(['calm_requests', hid ?? ''], hid ? { table: 'calm_requests', filters: [eq('household_id', hid)], order: [{ col: 'created_at', asc: false }], limit: 200 } : null);
  const missions = useMissions();
  const states = useMemo(() => Object.fromEntries(missions.all.map((m) => [m.id, m.mission_state as MissionState])), [missions.all]);
  return { ...q, states, me, loading: (q.isLoading && !q.data) || (missions.isLoading && !missions.data) };
}

export function useSendCalmRequest() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  return useMutation({
    // client_id : rejouer après une coupure renvoie la même demande (jamais deux missions)
    mutationFn: async (a: { template: CalmTemplateKey; to: string; title: string; dueAt: string | null; childId: string | null; clientId?: string }) => {
      if (!hid) throw new Error('household');
      const r = await rpcOrQueue<CalmRequestRow>('calm_request_send', {
        p_household: hid, p_template: a.template, p_assignee: a.to, p_title: a.title, p_due_at: a.dueAt, p_child: a.childId, p_client_id: a.clientId ?? uuid(),
      });
      return r.queued ? 'queued' as const : 'sent' as const;
    },
    onSuccess: () => { void inv('calm_requests', 'family_tasks', 'family_task_events', 'notifications'); },
  });
}

export function useUpdateCalmRequest() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (a: { id: string; dueAt: string }) => {
      const r = await backend.rpc<{ status: string }>('calm_request_update', { p_id: a.id, p_due_at: a.dueAt });
      if (r?.status !== 'ok') throw new Error('not_found');
    },
    onSuccess: () => { void inv('calm_requests', 'family_tasks'); },
  });
}

/** Réponse en un geste (ou annulation par l'expéditeur) : idempotente, gardée en file hors connexion. */
export function useCalmReply() {
  const inv = useInvalidate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: { taskId: string; action: CalmReply | 'cancel' }) => {
      const r = await rpcOrQueue<{ status: string }>('mission_respond', { p_task: a.taskId, p_action: a.action, p_note: null, p_due_at: null, p_assignee: null, p_expected_version: null });
      if (!r.queued && r.result?.status === 'not_found') throw new Error('not_found');
      return r.queued ? 'queued' as const : 'sent' as const;
    },
    onSuccess: (res, a) => {
      if (res === 'queued') {
        // L'écran montre tout de suite la réponse (la file l'enverra ; le serveur reste juge)
        qc.setQueriesData<Record<string, unknown>[]>({ predicate: (q) => q.queryKey.includes('family_tasks') }, (rows) => Array.isArray(rows)
          ? rows.map((r) => (r?.id === a.taskId && r.mission_state ? { ...r, mission_state: nextState(r.mission_state as MissionState, a.action) ?? r.mission_state } : r)) : rows);
      } else void inv('family_tasks', 'family_task_events', 'calm_requests', 'notifications');
    },
  });
}

// ---------------------------------------------------------------- moments à deux
export function useMoments() {
  const hid = useHouseholdId();
  const me = useUserId();
  const pending = useOfflineStore((s) => s.pending);
  const q = useRows<Moment>(['couple_moments', hid ?? ''], hid ? { table: 'couple_moments', filters: [eq('household_id', hid)], order: [{ col: 'created_at', asc: false }], limit: 300 } : null);
  const data = useMemo(() => {
    if (!q.data) return undefined;
    const now = new Date().toISOString();
    const queued = pending.filter((p) => p.table === 'couple_moments' && p.row.household_id === hid && !q.data!.some((m) => m.id === p.row.id))
      .map((p) => ({ status: 'proposed', planned_at: null, duration_minutes: null, responded_at: null, done_at: null, created_at: now, updated_at: now, from_user: me, ...(p.row as object), _pending: true }) as Moment);
    // Réponses en file : appliquées à l'affichage
    const replies = pending.filter((p) => p.table === 'rpc:couple_moment_respond');
    const rows = [...queued, ...q.data].map((m) => {
      let out = m;
      for (const r of replies) if (r.row.p_id === m.id && me) {
        const s = nextMomentStatus(out, r.row.p_action as MomentAction, me);
        if (s) out = { ...out, status: s, planned_at: r.row.p_action === 'plan' ? (r.row.p_planned_at as string | null) : out.planned_at, _pending: true };
      }
      return out;
    });
    return rows;
  }, [q.data, pending, hid, me]);
  return { ...q, data, me };
}

export function useProposeMoment() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  return useMutation({
    mutationFn: async (a: { ideaKey: string; to: string }) => {
      if (!hid) throw new Error('household');
      return insertOrQueue('couple_moments', { id: uuid(), household_id: hid, idea_key: a.ideaKey, to_user: a.to }, { conflict: 'id' });
    },
    onSuccess: () => { void inv('couple_moments', 'notifications'); },
  });
}

export function useRespondMoment() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (a: { id: string; action: MomentAction; plannedAt?: string | null; duration?: number | null }) => {
      const r = await rpcOrQueue<{ status: string }>('couple_moment_respond', { p_id: a.id, p_action: a.action, p_planned_at: a.plannedAt ?? null, p_duration: a.duration ?? null });
      if (!r.queued && r.result?.status === 'not_found') throw new Error('not_found');
      return r.queued ? 'queued' as const : 'sent' as const;
    },
    onSuccess: () => { void inv('couple_moments', 'notifications'); },
  });
}

export function useDeleteMoment() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => { await backend.remove('couple_moments', [eq('id', id)]); },
    onSuccess: () => { void inv('couple_moments'); },
  });
}

/** Moments planifiés (agenda) : acceptés avec une date. */
export function usePlannedMoments() {
  const { data } = useMoments();
  return useMemo(() => (data ?? []).filter((m) => m.status === 'accepted' && m.planned_at), [data]);
}
