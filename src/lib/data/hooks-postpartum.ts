/**
 * Suivi post-partum : accès aux données. Tout est réservé à la mère (RLS propriétaire),
 * sauf `postpartum_shared_status`, lisible par son foyer et filtré par le serveur.
 */
import { useMutation } from '@tanstack/react-query';
import { backend, eq } from '../backend';
import { useUserId } from '../auth';
import { insertOrQueue } from '../offline';
import { useHouseholdId, useInvalidate, useRows } from './hooks';
import {
  anySharing, DEFAULT_SETTINGS, filterShared,
  type CheckinInput, type PostpartumCheckin, type PostpartumSettings, type SharedStatus,
} from '../domain/postpartum';

export interface TrustedContact { id: string; user_id: string; kind: 'trusted' | 'professional'; name: string; relation: string | null; phone: string | null; email: string | null; note: string | null; position: number; created_at: string }
export interface PostpartumAction { id: string; user_id: string; done_on: string; kind: string; note: string | null; created_at: string }

export function usePostpartumSettings() {
  const userId = useUserId();
  const q = useRows<PostpartumSettings>(['postpartum_settings'], userId ? { table: 'postpartum_settings', filters: [eq('user_id', userId)] } : null);
  return { ...q, data: q.data?.[0] ?? null };
}

/** Crée les réglages au premier enregistrement, sinon les met à jour (la révocation est appliquée par le serveur). */
export function useSaveSettings() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async ({ existing, patch }: { existing: boolean; patch: Partial<PostpartumSettings> }) => {
      if (existing) return backend.update<PostpartumSettings>('postpartum_settings', patch, [eq('user_id', userId)]);
      return backend.insert<PostpartumSettings>('postpartum_settings', { ...DEFAULT_SETTINGS, ...patch, user_id: userId });
    },
    onSuccess: () => inv('postpartum_settings', 'postpartum_shared_status'),
  });
}

export function usePostpartumCheckins(limit = 90) {
  const userId = useUserId();
  return useRows<PostpartumCheckin>(['postpartum_checkins', String(limit)], userId ? {
    table: 'postpartum_checkins', filters: [eq('user_id', userId)], order: [{ col: 'checkin_date', asc: false }], limit,
  } : null);
}

/** Un point par jour : on modifie celui du jour s'il existe. Hors ligne, il part dans la file d'attente. */
export function useSaveCheckin() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string | null; input: CheckinInput }) => {
      if (id) return backend.update<PostpartumCheckin>('postpartum_checkins', { ...input }, [eq('id', id)]);
      return insertOrQueue('postpartum_checkins', { user_id: userId, ...input });
    },
    onSuccess: () => inv('postpartum_checkins'),
  });
}

export function useDeleteCheckin() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.remove('postpartum_checkins', [eq('id', id)]), onSuccess: () => inv('postpartum_checkins') });
}

// ---------------------------------------------------------------- contacts et démarches
export function useTrustedContacts() {
  const userId = useUserId();
  return useRows<TrustedContact>(['trusted_contacts'], userId ? { table: 'trusted_contacts', filters: [eq('user_id', userId)], order: [{ col: 'kind' }, { col: 'position' }, { col: 'created_at' }] } : null);
}
export function useSaveContact() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: Omit<TrustedContact, 'id' | 'user_id' | 'created_at' | 'position'> }) => {
      if (id) return backend.update('trusted_contacts', input, [eq('id', id)]);
      return backend.insert('trusted_contacts', { ...input, user_id: userId });
    },
    onSuccess: () => inv('trusted_contacts'),
  });
}
export function useDeleteContact() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.remove('trusted_contacts', [eq('id', id)]), onSuccess: () => inv('trusted_contacts') });
}

export function usePostpartumActions() {
  const userId = useUserId();
  return useRows<PostpartumAction>(['postpartum_actions'], userId ? { table: 'postpartum_actions', filters: [eq('user_id', userId)], order: [{ col: 'done_on', asc: false }], limit: 100 } : null);
}
export function useAddAction() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: (input: { kind: string; note: string | null; done_on: string }) => insertOrQueue('postpartum_actions', { ...input, user_id: userId }),
    onSuccess: () => inv('postpartum_actions'),
  });
}
export function useDeleteAction() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.remove('postpartum_actions', [eq('id', id)]), onSuccess: () => inv('postpartum_actions') });
}

// ---------------------------------------------------------------- partage
/** Ma propre ligne partagée (ce que voit mon foyer). */
export function useMySharedStatus() {
  const userId = useUserId();
  const q = useRows<SharedStatus>(['postpartum_shared_status', 'mine'], userId ? { table: 'postpartum_shared_status', filters: [eq('user_id', userId)] } : null);
  return { ...q, data: q.data?.[0] ?? null };
}

/** Ce que d'AUTRES membres du foyer ont choisi de partager (espace conjoint). */
export function useSharedWithMe() {
  const userId = useUserId();
  const hid = useHouseholdId();
  const q = useRows<SharedStatus>(['postpartum_shared_status', 'household', hid ?? ''], hid ? { table: 'postpartum_shared_status', filters: [eq('household_id', hid)] } : null);
  return { ...q, data: (q.data ?? []).filter((s) => s.user_id !== userId) };
}

export function useUpdateShared() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async ({ settings, exists, value }: { settings: PostpartumSettings; exists: boolean; value: Partial<SharedStatus> }) => {
      if (!settings.share_household_id || !anySharing(settings)) throw new Error('Choisissez d’abord ce que vous voulez partager.');
      const row = { ...filterShared(settings, value), household_id: settings.share_household_id };
      if (exists) return backend.update('postpartum_shared_status', row, [eq('user_id', userId)]);
      return backend.insert('postpartum_shared_status', { ...row, user_id: userId });
    },
    onSuccess: () => inv('postpartum_shared_status'),
  });
}

export function useStopSharing() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: () => backend.remove('postpartum_shared_status', [eq('user_id', userId)]),
    onSuccess: () => inv('postpartum_shared_status'),
  });
}
