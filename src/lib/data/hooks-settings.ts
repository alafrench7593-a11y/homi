/**
 * Hooks des écrans Réglages, Scanner et Administration.
 * Les droits sont TOUJOURS vérifiés côté serveur (RLS / fonctions security definer) :
 * ce qui suit ne fait que refléter l'état dans l'interface.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { backend, BackendError, eq, gte, inList, isDemo, type Filter } from '../backend';
import { useAuth, useUserId } from '../auth';
import { syncLocalReminders } from '../notifications';
import { useUiStore } from '../store';
import type { Article, Domain, HouseholdMember, Reminder } from '../types';
import type { ReminderSchedule } from '../domain/reminders';
import type { Assessment } from '../domain/products';
import { useHouseholdId, useInvalidate, useRows } from './hooks';

// ---------------------------------------------------------------- erreurs lisibles
/** Message d'erreur en français, sans jargon technique. */
export function friendlyError(e: unknown, fallback = 'Une erreur est survenue. Réessayez dans un instant.'): string {
  if (e instanceof BackendError) {
    if (e.isNetwork) return 'Pas de connexion internet. Réessayez une fois en ligne.';
    if (/indisponible en mode démonstration/i.test(e.message)) return `${e.message.replace(/ : .*$/, '')}. Cette fonction nécessite la connexion à Supabase.`;
    if (e.code === '42501') return 'Cette action est réservée au propriétaire du foyer ou à l’équipe de modération.';
    if (e.message) return e.message;
  }
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

// ---------------------------------------------------------------- rôles
export type AppRole = 'admin' | 'moderator' | 'editor';

/** Rôles applicatifs de la personne connectée (table user_roles, lecture limitée à soi par la RLS). */
export function useMyRoles() {
  const userId = useUserId();
  const q = useRows<{ user_id: string; role: AppRole }>(['user_roles'], userId ? { table: 'user_roles', filters: [eq('user_id', userId)] } : null, { staleTime: 300_000 });
  const roles = useMemo(() => new Set((q.data ?? []).map((r) => r.role)), [q.data]);
  return {
    ...q,
    roles,
    isAdmin: roles.has('admin'),
    isModerator: roles.has('admin') || roles.has('moderator'),
    isEditor: roles.has('admin') || roles.has('editor'),
  };
}

// ---------------------------------------------------------------- famille & partage
export interface Invitation {
  id: string; household_id: string; role: 'coparent' | 'caregiver'; can_view: Domain[]; can_edit: Domain[];
  email?: string | null; expires_at: string; accepted_at?: string | null; revoked_at?: string | null; created_at: string;
}

export function useInvitations(householdId: string | null, enabled: boolean) {
  return useRows<Invitation>(['household_invitations', householdId ?? ''], householdId ? { table: 'household_invitations', filters: [eq('household_id', householdId)], order: [{ col: 'created_at', asc: false }] } : null, { enabled });
}

export function useCreateInvitation() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (a: { householdId: string; role: 'coparent' | 'caregiver'; canView: Domain[]; canEdit: Domain[] }) =>
      backend.rpc<string>('create_household_invitation', { p_household: a.householdId, p_role: a.role, p_can_view: a.canView, p_can_edit: a.canEdit }),
    onSuccess: () => inv('household_invitations'),
  });
}

export function useRevokeInvitation() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => backend.update('household_invitations', { revoked_at: new Date().toISOString() }, [eq('id', id)]),
    onSuccess: () => inv('household_invitations'),
  });
}

export function useAcceptInvitation() {
  const inv = useInvalidate();
  const setHousehold = useUiStore((s) => s.setHousehold);
  return useMutation({
    mutationFn: (code: string) => backend.rpc<string>('accept_household_invitation', { p_token: code.trim().replace(/\s+/g, '') }),
    onSuccess: (householdId) => {
      if (householdId) setHousehold(householdId);
      inv('memberships', 'members', 'household');
    },
  });
}

export function useUpdateMemberRights() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (a: { householdId: string; userId: string; canView: Domain[]; canEdit: Domain[] }) =>
      backend.update('household_members', { can_view: a.canView, can_edit: a.canEdit }, [eq('household_id', a.householdId), eq('user_id', a.userId)]),
    onSuccess: () => inv('members', 'memberships'),
  });
}

/** Retrait d'un membre (par le propriétaire) ou départ volontaire (soi-même, hors propriétaire). */
export function useRemoveMember() {
  const inv = useInvalidate();
  const me = useUserId();
  const setHousehold = useUiStore((s) => s.setHousehold);
  return useMutation({
    mutationFn: (m: Pick<HouseholdMember, 'household_id' | 'user_id'>) => backend.remove('household_members', [eq('household_id', m.household_id), eq('user_id', m.user_id)]),
    onSuccess: (_d, m) => {
      if (m.user_id === me) setHousehold(null);
      inv('members', 'memberships', 'household');
    },
  });
}

export function useRenameHousehold() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (a: { id: string; name: string }) => backend.update('households', { name: a.name }, [eq('id', a.id)]),
    onSuccess: () => inv('household'),
  });
}

// ---------------------------------------------------------------- rappels
export interface ReminderDraft {
  title: string;
  body: string | null;
  category: Reminder['category'];
  schedule: ReminderSchedule;
  enabled: boolean;
}

/** Après chaque modification : relecture de la liste puis reprogrammation des notifications locales. */
async function resync(userId: string) {
  const rows = await backend.select<Reminder>({ table: 'reminders', filters: [eq('user_id', userId)] });
  return syncLocalReminders(rows).catch(() => ({ scheduled: 0, skipped: 0 }));
}

export function useSaveReminder() {
  const inv = useInvalidate();
  const userId = useUserId();
  const householdId = useHouseholdId();
  return useMutation({
    mutationFn: async (a: { id?: string; draft: ReminderDraft }) => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';
      const row = { ...a.draft, timezone };
      if (a.id) await backend.update('reminders', row, [eq('id', a.id)]);
      else await backend.insert('reminders', { ...row, user_id: userId, household_id: householdId });
      return resync(userId);
    },
    onSuccess: () => inv('reminders'),
  });
}

export function useToggleReminder() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (a: { id: string; enabled: boolean }) => {
      await backend.update('reminders', { enabled: a.enabled, snoozed_until: null }, [eq('id', a.id)]);
      return resync(userId);
    },
    onSuccess: () => inv('reminders'),
  });
}

export function useDeleteReminder() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (id: string) => {
      await backend.remove('reminders', [eq('id', id)]);
      return resync(userId);
    },
    onSuccess: () => inv('reminders'),
  });
}

// ---------------------------------------------------------------- confidentialité
export function useUpdatePrivacy() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: (patch: Record<string, unknown>) => backend.update('privacy_settings', patch, [eq('user_id', userId)]),
    onSuccess: () => inv('privacy_settings'),
  });
}

export function useExportData() {
  return useMutation({ mutationFn: () => backend.rpc<Record<string, unknown>>('export_my_data') });
}

/** Suppression définitive : fonction serveur « delete-account » (efface aussi les fichiers privés). */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const out = await backend.invoke<{ ok?: boolean; error?: string }>('delete-account', { confirm: 'SUPPRIMER' });
      if (out && out.ok === false) throw new Error('La suppression n’a pas pu aboutir.');
      // Sur Supabase, l'utilisateur n'existe plus : on ferme la session locale
      if (!isDemo) await backend.auth.signOut().catch(() => undefined);
      return true;
    },
  });
}

// ---------------------------------------------------------------- abonnement & limites
export interface PlanLimit { key: string; free_value: number; premium_value: number; description: string | null }

export function usePlanLimits() {
  return useRows<PlanLimit>(['plan_limits'], { table: 'plan_limits' }, { staleTime: 3600_000 });
}

// ---------------------------------------------------------------- scanner
export interface Recall {
  id: string; title: string; reason: string; recommended_action: string | null; official_url: string | null;
  source: string; published_on: string; lot_numbers: string[]; is_demo: boolean;
}

export interface LookupResult {
  found: boolean;
  barcode?: string;
  message?: string;
  needs_confirmation?: boolean;
  recalls: Recall[];
  product?: {
    name: string; brand: string | null; category: string; ingredients: string[] | null; declared_allergens: string[] | null;
    data_source: string; data_retrieved_at: string; is_demo: boolean;
  };
  assessment?: Assessment & { limited?: boolean };
}

export function startOfMonthIso(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export function useScansThisMonth() {
  const userId = useUserId();
  const since = startOfMonthIso();
  const q = useRows<{ id: string }>(['product_scans', since.slice(0, 7)], userId ? { table: 'product_scans', filters: [eq('user_id', userId), gte('created_at', since)] } : null);
  return { ...q, count: q.data?.length ?? 0 };
}

export function useProductLookup() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (a: { barcode: string; confirm: boolean; context: { pregnant?: boolean; childAgeMonths?: number | null; childDeclaredAllergies?: string[] } }) =>
      backend.invoke<LookupResult>('product-lookup', a),
    onSuccess: (_r, a) => { if (a.confirm) inv('product_scans'); },
  });
}

// ---------------------------------------------------------------- administration
export interface AdminStats {
  accounts: number; onboarded: number; active_pregnancies: number; multiple_pregnancies: number; children: number;
  premium: number; posts_7d: number; open_reports: number; journeys: Record<string, number>;
}

export function useAdminStats(enabled: boolean) {
  const { session } = useAuth();
  return useQuery({ queryKey: [session?.userId, 'admin_stats'], queryFn: () => backend.rpc<AdminStats>('admin_stats'), enabled: enabled && !!session, staleTime: 30_000, retry: false });
}

export interface ModItem {
  kind: 'post' | 'comment';
  id: string;
  post_id?: string;
  title: string | null;
  body: string;
  status: string;
  report_count: number;
  created_at: string;
}

interface RawPost { id: string; title: string; body: string; status: string; report_count: number | null; created_at: string }
interface RawComment { id: string; post_id: string; body: string; status: string; report_count: number | null; created_at: string }

/** File de modération : contenus masqués, en attente de relecture ou signalés. */
export function useModerationQueue(enabled: boolean) {
  const { session } = useAuth();
  return useQuery({
    queryKey: [session?.userId, 'moderation_queue', 'posts', 'comments', 'reports'],
    enabled: enabled && !!session,
    retry: false,
    queryFn: async () => {
      const flagged: Filter[] = [inList('status', ['hidden', 'pending_review'])];
      const reported: Filter[] = [eq('status', 'visible'), { col: 'report_count', op: 'gt', value: 0 }];
      const [p1, p2, c1, c2] = await Promise.all([
        backend.select<RawPost>({ table: 'posts', filters: flagged, order: [{ col: 'created_at', asc: false }], limit: 100 }),
        backend.select<RawPost>({ table: 'posts', filters: reported, order: [{ col: 'created_at', asc: false }], limit: 100 }),
        backend.select<RawComment>({ table: 'comments', filters: flagged, order: [{ col: 'created_at', asc: false }], limit: 100 }),
        backend.select<RawComment>({ table: 'comments', filters: reported, order: [{ col: 'created_at', asc: false }], limit: 100 }),
      ]);
      const items: ModItem[] = [
        ...[...p1, ...p2].map((p) => ({ kind: 'post' as const, id: p.id, title: p.title, body: p.body, status: p.status, report_count: p.report_count ?? 0, created_at: p.created_at })),
        ...[...c1, ...c2].map((c) => ({ kind: 'comment' as const, id: c.id, post_id: c.post_id, title: null, body: c.body, status: c.status, report_count: c.report_count ?? 0, created_at: c.created_at })),
      ];
      const seen = new Set<string>();
      return items
        .filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)))
        .sort((a, b) => b.report_count - a.report_count || b.created_at.localeCompare(a.created_at));
    },
  });
}

export type ModAction = 'hide' | 'restore' | 'remove' | 'dismiss_report';

export function useModerate() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (a: { item: ModItem; action: ModAction; reason?: string }) =>
      backend.rpc('moderate', { p_action: a.action, p_post: a.item.kind === 'post' ? a.item.id : null, p_comment: a.item.kind === 'comment' ? a.item.id : null, p_reason: a.reason ?? null }),
    onSuccess: () => inv('moderation_queue', 'admin_stats', 'forum_feed', 'comment_feed'),
  });
}

export function useBroadcast() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (a: { title: string; body: string; deepLink?: string | null }) => backend.rpc<number>('admin_broadcast', { p_title: a.title, p_body: a.body, p_deep_link: a.deepLink || null }),
    onSuccess: () => inv('notifications'),
  });
}

/** Tous les articles (brouillons compris pour les éditeurs ; publiés seulement sinon, selon la RLS). */
export function useAllArticles(enabled: boolean) {
  return useRows<Article>(['articles', 'admin'], { table: 'articles', order: [{ col: 'updated_on', asc: false }] }, { enabled, staleTime: 60_000 });
}
