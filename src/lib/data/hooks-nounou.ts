/**
 * Espace Nounou — accès aux données. Le serveur décide de tout (RLS : parents de l'enfant, nounou confirmée et non
 * révoquée) ; ces fonctions ne font que lire et écrire. Les saisies du carnet sont des lignes des tables de suivi
 * existantes (insertOrQueue : file hors ligne, identifiant client idempotent, rejouée une seule fois).
 */
import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { backend, eq, gte, lte } from '../backend';
import { useAuth, useUserId } from '../auth';
import { insertOrQueue, useOfflineStore } from '../offline';
import { uuid } from '../uuid';
import { useInvalidate, useMemberships, useRows, useChildren } from './hooks';
import {
  CARE_PHOTO_BUCKET, CARE_SIGNED_URL_SECONDS, CARE_TABLES, buildTimeline, dayRange, type CareItem, type Retention,
} from '../domain/nounou';

export interface CareChildRef { id: string; first_name: string; birth_date?: string; household_id: string }
export interface MyCareLink {
  link_id: string; household_id: string; household_name: string; status: 'pending' | 'active';
  child: CareChildRef | null; photos_allowed: boolean;
}
export interface CareLink {
  id: string; household_id: string; child_id: string; caregiver_id: string | null; invitation_id: string | null; invited_by: string | null;
  label: string | null; created_at: string; expires_at: string | null; accepted_at: string | null; confirmed_at: string | null; revoked_at: string | null;
}
export interface CareSettings {
  child_id: string; household_id: string; photos_allowed: boolean; photos_allowed_at: string | null; photos_allowed_by: string | null;
  retention: Retention; allow_download: boolean; notify_name: boolean;
}
export interface CarePhoto {
  id: string; client_id: string; household_id: string; child_id: string; author_id: string | null; taken_at: string;
  caption: string | null; origin: string; storage_path: string; width: number | null; height: number | null; memory_photo_id: string | null; created_at: string;
}
export interface CareMessage { id: string; client_id: string | null; child_id: string; author_id: string | null; body: string; important: boolean; created_at: string; _pending?: boolean }
export interface NotifyPrefs { child_id: string; photos: boolean; messages: boolean; important: boolean }
export interface MemberName { household_id: string; user_id: string; role: 'owner' | 'coparent' | 'caregiver'; display_name: string | null }

// ---------------------------------------------------------------- rôle et enfant
/** Gardes de la personne connectée (côté nounou) : en attente ou actives. */
export function useMyChildcare() {
  const me = useUserId();
  return useQuery({
    queryKey: [me, 'my_childcare', 'childcare_links', 'household_members'],
    queryFn: async () => (await backend.rpc<MyCareLink[] | null>('my_childcare')) ?? [],
    enabled: !!me,
    staleTime: 30_000,
  });
}

export type CareRole = 'parent' | 'caregiver' | null;
/**
 * Enfant de l'espace et rôle de la personne : parent (propriétaire ou co-parent du foyer de l'enfant) ou nounou
 * dont l'accès est confirmé. L'enfant d'une nounou vient de my_childcare (elle peut garder dans plusieurs foyers).
 */
export function useCareChild(childId: string | null | undefined): { child: CareChildRef | null; role: CareRole; loading: boolean; photosAllowed: boolean } {
  const memberships = useMemberships();
  const kids = useChildren();
  const mine = useMyChildcare();
  return useMemo(() => {
    const link = mine.data?.find((l) => l.status === 'active' && l.child?.id === childId);
    const own = kids.data?.find((c) => c.id === childId);
    const m = own ? memberships.data?.find((x) => x.household_id === own.household_id) : undefined;
    if (own && m && m.role !== 'caregiver') return { child: own, role: 'parent', loading: false, photosAllowed: false };
    if (link?.child) return { child: link.child, role: 'caregiver', loading: false, photosAllowed: link.photos_allowed };
    const loading = (memberships.isLoading && !memberships.data) || (kids.isLoading && !kids.data) || (mine.isLoading && !mine.data);
    return { child: null, role: null, loading, photosAllowed: false };
  }, [childId, kids.data, kids.isLoading, memberships.data, memberships.isLoading, mine.data, mine.isLoading]);
}

export function useCareMemberNames(householdId: string | null | undefined) {
  const me = useUserId();
  return useQuery({
    queryKey: [me, 'member_names', householdId ?? '', 'members'],
    queryFn: async () => (await backend.rpc<MemberName[] | null>('household_member_names', { p_household: householdId })) ?? [],
    enabled: !!me && !!householdId,
    staleTime: 5 * 60_000,
  });
}

// ---------------------------------------------------------------- carnet du jour
/** Toutes les saisies d'une journée (suivi existant + garde), y compris celles encore en file hors ligne. */
export function useCareDay(childId: string | null | undefined, day: string) {
  const { session } = useAuth();
  const { from, to } = dayRange(day);
  const pending = useOfflineStore((s) => s.pending);
  const q = useQuery({
    queryKey: [session?.userId, 'care_day', childId ?? '', day, ...CARE_TABLES],
    enabled: !!childId,
    staleTime: 15_000,
    queryFn: async () => {
      const f = (col: string) => [eq('child_id', childId), gte(col, from), lte(col, to)];
      const [bottles, meals, sleeps, diapers, child_observations, childcare_events, childcare_photos] = await Promise.all([
        backend.select({ table: 'bottles', filters: f('at') }),
        backend.select({ table: 'meals', filters: f('at') }),
        backend.select({ table: 'sleeps', filters: [eq('child_id', childId), lte('started_at', to), gte('started_at', new Date(Date.parse(from) - 12 * 3600_000).toISOString())] }),
        backend.select({ table: 'diapers', filters: f('at') }),
        backend.select({ table: 'child_observations', filters: f('at') }),
        backend.select({ table: 'childcare_events', filters: f('at') }),
        backend.select({ table: 'childcare_photos', filters: f('taken_at') }).catch(() => []),
      ]);
      // sieste commencée la veille et finie aujourd'hui : gardée ; commencée la veille sans fin : gardée (en cours)
      const sl = (sleeps as Record<string, unknown>[]).filter((s) => String(s.started_at) >= from || !s.ended_at || String(s.ended_at) >= from);
      return { bottles, meals, sleeps: sl, diapers, child_observations, childcare_events, childcare_photos } as Record<string, Record<string, unknown>[]>;
    },
  });
  const items: CareItem[] | undefined = useMemo(() => {
    if (!q.data) return undefined;
    const byTable: Record<string, Record<string, unknown>[]> = { ...q.data };
    for (const op of pending) {
      if (!childId || op.row.child_id !== childId || !(CARE_TABLES as readonly string[]).includes(op.table)) continue;
      const at = String(op.row.at ?? op.row.started_at ?? '');
      if (at < from || at >= to) continue;
      byTable[op.table] = [...(byTable[op.table] ?? []), { ...op.row, id: op.row.id ?? op.row.client_id, _pending: true }];
    }
    return buildTimeline(byTable);
  }, [q.data, pending, childId, from, to]);
  return { ...q, items };
}

/** Saisie du carnet : ligne de la table de suivi existante, hors ligne → file (renvoyée une seule fois). */
export function useAddCareEntry() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { table: string; row: Record<string, unknown> }) => insertOrQueue(v.table, { client_id: uuid(), ...v.row }),
    onSuccess: (_r, v) => inv('care_day', v.table),
  });
}

/** Fusion proposée : la saisie existante est complétée (jamais une seconde ligne). */
export function useMergeCareEntry() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { table: string; id: string; patch: Record<string, unknown> }) => {
      if (!Object.keys(v.patch).length) return;
      await backend.update(v.table, v.patch, [eq('id', v.id)]);
    },
    onSuccess: (_r, v) => inv('care_day', v.table),
  });
}

/** Sieste en cours terminée d'un appui. */
export function useEndSleep() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => { await backend.update('sleeps', { ended_at: new Date().toISOString() }, [eq('id', id)]); },
    onSuccess: () => inv('care_day', 'sleeps'),
  });
}

// ---------------------------------------------------------------- accès (côté parents)
export function useCareLinks(childId: string | null | undefined) {
  return useRows<CareLink>(['childcare_links', childId ?? ''], childId ? { table: 'childcare_links', filters: [eq('child_id', childId)], order: [{ col: 'created_at', asc: false }] } : null);
}
export function useCareSettings(childId: string | null | undefined) {
  const q = useRows<CareSettings>(['childcare_settings', childId ?? ''], childId ? { table: 'childcare_settings', filters: [eq('child_id', childId)] } : null);
  return { ...q, settings: q.data?.[0] ?? null };
}
export function useInviteCaregiver() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { childId: string; label: string | null }) => backend.rpc<{ token: string; link_id: string; expires_at: string }>('childcare_invite', { p_child: v.childId, p_label: v.label }),
    onSuccess: () => inv('childcare_links', 'household_invitations'),
  });
}
export function useCareLinkAction() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { action: 'confirm' | 'revoke'; linkId: string }) => { await backend.rpc(v.action === 'confirm' ? 'childcare_confirm' : 'childcare_revoke', { p_link: v.linkId }); },
    onSuccess: () => inv('childcare_links', 'my_childcare', 'members', 'household_members'),
  });
}
export function useAddChildToCaregiver() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { childId: string; caregiverId: string }) => backend.rpc<string>('childcare_add_child', { p_child: v.childId, p_caregiver: v.caregiverId }),
    onSuccess: () => inv('childcare_links', 'members'),
  });
}
export function useSetCareSettings() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { childId: string; photosAllowed?: boolean; retention?: Retention; allowDownload?: boolean; notifyName?: boolean }) =>
      backend.rpc<CareSettings>('childcare_set_settings', {
        p_child: v.childId, p_photos_allowed: v.photosAllowed ?? null, p_retention: v.retention ?? null,
        p_allow_download: v.allowDownload ?? null, p_notify_name: v.notifyName ?? null,
      }),
    onSuccess: () => inv('childcare_settings', 'my_childcare'),
  });
}
export function useNotifyPrefs(childId: string | null | undefined) {
  const me = useUserId();
  const q = useRows<NotifyPrefs>(['childcare_notify_prefs', childId ?? ''], childId && me ? { table: 'childcare_notify_prefs', filters: [eq('child_id', childId), eq('user_id', me)] } : null);
  return { ...q, prefs: q.data?.[0] ?? { child_id: childId ?? '', photos: true, messages: true, important: true } };
}
export function useSetNotifyPrefs() {
  const inv = useInvalidate();
  const me = useUserId();
  return useMutation({
    mutationFn: (p: NotifyPrefs) => backend.insert('childcare_notify_prefs', { user_id: me, ...p, updated_at: new Date().toISOString() }, { onConflict: 'user_id,child_id' }),
    onSuccess: () => inv('childcare_notify_prefs'),
  });
}
/** Purge des photos dont la durée de conservation est dépassée (à l'ouverture de l'espace par un parent). */
export async function purgeExpiredCarePhotos(): Promise<number> {
  try { return (await backend.rpc<number>('childcare_purge_now')) ?? 0; } catch { return 0; }
}

// ---------------------------------------------------------------- photos
export function useCarePhotos(childId: string | null | undefined, sinceIso?: string) {
  return useRows<CarePhoto>(['childcare_photos', childId ?? '', sinceIso ?? ''], childId ? {
    table: 'childcare_photos', filters: [eq('child_id', childId), ...(sinceIso ? [gte('taken_at', sinceIso)] : [])], order: [{ col: 'taken_at', asc: false }], limit: 300,
  } : null);
}
/** Lien signé de quelques minutes, redemandé à chaque affichage (jamais d'adresse permanente). */
export function useCarePhotoUrl(path: string | null | undefined) {
  const me = useUserId();
  return useQuery({
    queryKey: [me, 'childcare-photo-url', path ?? ''],
    queryFn: () => backend.storage.signedUrl(CARE_PHOTO_BUCKET, path!, CARE_SIGNED_URL_SECONDS),
    enabled: !!path,
    staleTime: (CARE_SIGNED_URL_SECONDS - 60) * 1000,
    gcTime: (CARE_SIGNED_URL_SECONDS - 30) * 1000,
  });
}
export function useDeleteCarePhoto() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (p: Pick<CarePhoto, 'id' | 'storage_path'>) => {
      await backend.remove('childcare_photos', [eq('id', p.id)]);
      // fichier effacé ensuite ; refusé par la base s'il est encore dans les souvenirs (il y reste)
      await backend.storage.remove(CARE_PHOTO_BUCKET, [p.storage_path]).catch(() => undefined);
    },
    onSuccess: () => inv('childcare_photos', 'care_day', 'childcare-photo-url'),
  });
}
export function usePhotoToMemories() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (photoId: string) => backend.rpc<string>('childcare_photo_to_memories', { p_photo: photoId }),
    onSuccess: () => inv('childcare_photos', 'child_photos'),
  });
}

// ---------------------------------------------------------------- messagerie (texte seulement)
export function useCareMessages(childId: string | null | undefined) {
  const q = useRows<CareMessage>(['childcare_messages', childId ?? ''], childId ? { table: 'childcare_messages', filters: [eq('child_id', childId)], order: [{ col: 'created_at', asc: true }], limit: 500 } : null);
  const pending = useOfflineStore((s) => s.pending);
  const data = useMemo(() => {
    const extra = pending.filter((o) => o.table === 'childcare_messages' && o.row.child_id === childId && !q.data?.some((m) => m.client_id === o.row.client_id))
      .map((o) => ({ ...(o.row as unknown as CareMessage), id: String(o.row.client_id), created_at: o.queuedAt, _pending: true }));
    return q.data ? [...q.data, ...extra] : undefined;
  }, [q.data, pending, childId]);
  return { ...q, data };
}
export function useSendCareMessage() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { childId: string; body: string; important: boolean }) =>
      insertOrQueue('childcare_messages', { client_id: uuid(), child_id: v.childId, body: v.body, important: v.important }),
    onSuccess: () => inv('childcare_messages'),
  });
}
