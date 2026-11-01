/** Accès aux données (TanStack Query). Toutes les lectures passent par la RLS côté Supabase. */
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { backend, eq, gte, inList, type Filter, type Query } from '../backend';
import { useAuth, useUserId } from '../auth';
import { useUiStore, type ActiveSubject } from '../store';
import { isBody, visiblePregnancy, type JourneyRow } from '../journeys/model';
import { insertOrQueue } from '../offline';
import { syncLocalReminders } from '../notifications';
import { uuid } from '../uuid';
import { getLocale } from '@/i18n';
import {
  LOG_TABLE, LOG_TIME_COL,
  type AppNotification, type Appointment, type Article, type AssistantMessage, type BabyName, type Category, type Checklist, type ChecklistItem,
  type Child, type CommunityProfile, type Consent, type ConsentPurpose, type Conversation, type DocumentRow, type EmergencyResource, type ExpectedBaby,
  type FeedComment, type FeedPost, type Forum, type Household, type HouseholdMember, type LogKind, type MaternalWeight, type Measurement, type MoodCheckin,
  type NameFavorite, type NameVote, type PeriodEntry, type Pregnancy, type PrivacySettings, type Profile, type Reminder, type Subscription, type TestResult,
} from '../types';

// ---------------------------------------------------------------- générique
export function useRows<T>(key: QueryKey, q: Query | null, opts?: { enabled?: boolean; staleTime?: number }) {
  const { session } = useAuth();
  return useQuery({
    queryKey: [session?.userId, ...key],
    queryFn: () => backend.select<T>(q!),
    enabled: !!q && (opts?.enabled ?? true),
    staleTime: opts?.staleTime ?? 30_000,
  });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (...prefixes: string[]) =>
    qc.invalidateQueries({ predicate: (query) => prefixes.some((p) => query.queryKey.includes(p)) });
}

// ---------------------------------------------------------------- profil & foyer
export function useProfile() {
  const userId = useUserId();
  const q = useRows<Profile>(['profile'], userId ? { table: 'profiles', filters: [eq('id', userId)] } : null);
  return { ...q, data: q.data?.[0] ?? null };
}

export function useUpdateProfile() {
  const userId = useUserId();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (patch: Partial<Profile>) => backend.update('profiles', patch, [eq('id', userId)]),
    onSuccess: () => inv('profile'),
  });
}

export function useMemberships() {
  const userId = useUserId();
  return useRows<HouseholdMember>(['memberships'], userId ? { table: 'household_members', filters: [eq('user_id', userId)], order: [{ col: 'joined_at' }] } : null);
}

/** Foyer courant : celui choisi, sinon le premier dont on est membre. */
export function useHouseholdId(): string | null {
  const stored = useUiStore((s) => s.householdId);
  const setHousehold = useUiStore((s) => s.setHousehold);
  const { data } = useMemberships();
  const valid = data?.some((m) => m.household_id === stored) ? stored : (data?.[0]?.household_id ?? null);
  useEffect(() => {
    if (valid !== stored && data) setHousehold(valid);
  }, [valid, stored, data, setHousehold]);
  return valid;
}

export function useMyMembership() {
  const hid = useHouseholdId();
  const { data } = useMemberships();
  return data?.find((m) => m.household_id === hid) ?? null;
}

export function useHousehold() {
  const hid = useHouseholdId();
  const q = useRows<Household>(['household', hid ?? ''], hid ? { table: 'households', filters: [eq('id', hid)] } : null);
  return q.data?.[0] ?? null;
}

export function useHouseholdMembers() {
  const hid = useHouseholdId();
  return useRows<HouseholdMember>(['members', hid ?? ''], hid ? { table: 'household_members', filters: [eq('household_id', hid)] } : null);
}

/**
 * Foyer de la personne connectée. Depuis l'étape 1, il est créé à l'inscription (déclencheur) :
 * on le récupère, on le rattrape s'il manque (ensure_my_account) et on le renomme si un nom est choisi.
 */
export async function ensureHousehold(name?: string): Promise<string> {
  const session = await backend.auth.getSession();
  if (!session) throw new Error('Connexion requise');
  const existing = await backend.select<HouseholdMember>({ table: 'household_members', filters: [eq('user_id', session.userId)], order: [{ col: 'joined_at' }] });
  let hid = existing[0]?.household_id;
  if (!hid) hid = (await backend.rpc<{ household_id: string }>('ensure_my_account')).household_id;
  if (name) {
    const [h] = await backend.select<Household & { auto_created?: boolean }>({ table: 'households', filters: [eq('id', hid)] });
    if (h?.auto_created && h.created_by === session.userId && h.name !== name) await backend.update('households', { name }, [eq('id', hid)]);
  }
  return hid;
}

// ---------------------------------------------------------------- grossesse & enfants
export function usePregnancies() {
  const hid = useHouseholdId();
  return useRows<Pregnancy>(['pregnancies', hid ?? ''], hid ? { table: 'pregnancies', filters: [eq('household_id', hid)], order: [{ col: 'created_at', asc: false }] } : null);
}

/**
 * Parcours visibles (les miens + les parcours familiaux du foyer : grossesse, bébé, enfant — jamais le cycle d'un autre).
 * Source de vérité de ce qui est affiché : un parcours archivé ne s'affiche plus nulle part (sauf « Mes parcours précédents »).
 */
export function useJourneys() {
  const userId = useUserId();
  return useRows<JourneyRow>(['user_journeys'], userId ? { table: 'user_journeys', order: [{ col: 'started_on', asc: false }] } : null);
}
export function useJourneyState() {
  const userId = useUserId();
  const q = useJourneys();
  return useMemo(() => {
    const rows = q.data ?? [];
    const mine = rows.filter((r) => r.user_id === userId);
    const active = mine.filter((r) => r.status === 'active');
    const visibleActive = rows.filter((r) => r.status === 'active');
    return {
      rows, mine, active,
      archived: mine.filter((r) => r.status === 'archived'),
      body: active.find((r) => isBody(r.type)) ?? null,
      postpartum: active.find((r) => r.type === 'postpartum') ?? null,
      pregnancyIds: visibleActive.filter((r) => r.type === 'pregnancy' && r.pregnancy_id).map((r) => r.pregnancy_id!),
      childIds: visibleActive.filter((r) => (r.type === 'baby' || r.type === 'child') && r.child_id).map((r) => r.child_id!),
      childType: (childId: string) => visibleActive.find((r) => (r.type === 'baby' || r.type === 'child') && r.child_id === childId)?.type ?? null,
      loaded: !!q.data, query: q,
    };
  }, [q.data, userId]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Grossesse affichée : seulement si un parcours « grossesse » actif la référence (jamais une ancienne grossesse restée active). */
export function useActivePregnancy() {
  const { data } = usePregnancies();
  const js = useJourneyState();
  return visiblePregnancy(data, js.rows);
}

export function useExpectedBabies(pregnancyId: string | null | undefined) {
  return useRows<ExpectedBaby>(['expected_babies', pregnancyId ?? ''], pregnancyId ? { table: 'expected_babies', filters: [eq('pregnancy_id', pregnancyId)], order: [{ col: 'position' }] } : null);
}

export function useChildren() {
  const hid = useHouseholdId();
  return useRows<Child>(['children', hid ?? ''], hid ? { table: 'children', filters: [eq('household_id', hid), eq('archived', false)], order: [{ col: 'birth_date', asc: false }] } : null);
}

/** Enfants suivis dans un parcours actif (bébé ou enfant) : ceux du sélecteur, des actions rapides et du suivi. */
export function useTrackedChildren() {
  const q = useChildren();
  const js = useJourneyState();
  const data = useMemo(() => (q.data ? q.data.filter((c) => js.childIds.includes(c.id)) : undefined), [q.data, js.childIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...q, data, isLoading: q.isLoading || js.query.isLoading };
}

export function useChild(id: string | null | undefined) {
  const { data } = useChildren();
  return data?.find((c) => c.id === id) ?? null;
}

/**
 * Profil affiché (sélecteur) : ma grossesse, mon post-partum, chaque enfant suivi, toute la famille ou moi.
 * Seuls les profils d'un parcours ACTIF sont proposés : un ancien parcours n'est jamais repris par défaut.
 */
export function useActiveSubject() {
  const subject = useUiStore((s) => s.subject);
  const setSubject = useUiStore((s) => s.setSubject);
  const pregnancy = useActivePregnancy();
  const { data: children } = useTrackedChildren();
  const js = useJourneyState();
  const resolved = useMemo((): ActiveSubject => {
    if (subject?.type === 'child' && children?.some((c) => c.id === subject.id)) return subject;
    if (subject?.type === 'pregnancy' && pregnancy?.id === subject.id) return subject;
    if (subject?.type === 'postpartum' && js.postpartum) return subject;
    if (subject?.type === 'family' && (children?.length ?? 0) + (pregnancy ? 1 : 0) > 1) return subject;
    if (subject?.type === 'me') return subject;
    if (pregnancy) return { type: 'pregnancy', id: pregnancy.id };
    if (children?.length) return { type: 'child', id: children[0].id };
    if (js.postpartum) return { type: 'postpartum' };
    return { type: 'me' };
  }, [subject, pregnancy, children, js.postpartum]);
  return { subject: resolved, setSubject };
}

export function useMeasurements(childId: string | null | undefined) {
  return useRows<Measurement>(['child_measurements', childId ?? ''], childId ? { table: 'child_measurements', filters: [eq('child_id', childId)], order: [{ col: 'measured_on' }] } : null);
}

// ---------------------------------------------------------------- suivi quotidien
export function useLogs<T>(kind: LogKind, childId: string | null | undefined, sinceDays = 7) {
  const since = useMemo(() => new Date(Date.now() - sinceDays * 86400_000).toISOString(), [sinceDays]);
  const table = LOG_TABLE[kind];
  return useRows<T>([table, childId ?? '', String(sinceDays)], childId ? {
    table, filters: [eq('child_id', childId), gte(LOG_TIME_COL[kind], since)], order: [{ col: LOG_TIME_COL[kind], asc: false }], limit: 300,
  } : null);
}

export function useOpenSleep(childId: string | null | undefined) {
  const q = useRows<{ id: string; started_at: string }>(['sleeps', childId ?? '', 'open'], childId ? { table: 'sleeps', filters: [eq('child_id', childId), { col: 'ended_at', op: 'is', value: null }] } : null);
  return q.data?.[0] ?? null;
}

export function useAddLog(kind: LogKind) {
  const inv = useInvalidate();
  const table = LOG_TABLE[kind];
  return useMutation({
    mutationFn: async (row: Record<string, unknown>) => insertOrQueue(table, { client_id: uuid(), ...row }),
    onSuccess: () => inv(table),
  });
}

export function useUpdateRow(table: string) {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) => backend.update(table, patch, [eq('id', id)]),
    onSuccess: () => inv(table),
  });
}

export function useDeleteRow(table: string) {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => backend.remove(table, [eq('id', id)]),
    onSuccess: () => inv(table),
  });
}

export function useInsertRow<T = unknown>(table: string, extraInvalidate: string[] = []) {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (row: Record<string, unknown> | Record<string, unknown>[]) => backend.insert<T>(table, row),
    onSuccess: () => inv(table, ...extraInvalidate),
  });
}

// ---------------------------------------------------------------- données personnelles
/** Poids de la mère pour UNE grossesse : jamais les mesures d'une grossesse précédente. */
export function useMaternalWeights(pregnancyId?: string | null) {
  const userId = useUserId();
  return useRows<MaternalWeight>(['maternal_weights', pregnancyId ?? ''], userId && pregnancyId ? { table: 'maternal_weights', filters: [eq('user_id', userId), eq('pregnancy_id', pregnancyId)], order: [{ col: 'measured_on' }] } : null);
}
export function useMoods(limit = 30) {
  const userId = useUserId();
  return useRows<MoodCheckin>(['mood_checkins', String(limit)], userId ? { table: 'mood_checkins', filters: [eq('user_id', userId)], order: [{ col: 'checked_at', asc: false }], limit } : null);
}
export function usePeriods() {
  const userId = useUserId();
  return useRows<PeriodEntry>(['period_entries'], userId ? { table: 'period_entries', filters: [eq('user_id', userId)], order: [{ col: 'start_date' }] } : null);
}
export function useTests(kind: 'ovulation_tests' | 'pregnancy_tests') {
  const userId = useUserId();
  return useRows<TestResult>([kind], userId ? { table: kind, filters: [eq('user_id', userId)], order: [{ col: 'tested_at', asc: false }], limit: 60 } : null);
}

// ---------------------------------------------------------------- rendez-vous, rappels, notifications
export function useAppointments(opts: { upcomingOnly?: boolean } = {}) {
  const hid = useHouseholdId();
  const filters: Filter[] = hid ? [eq('household_id', hid)] : [];
  if (opts.upcomingOnly) filters.push(gte('starts_at', new Date(Date.now() - 3600_000).toISOString()));
  return useRows<Appointment>(['appointments', hid ?? '', String(!!opts.upcomingOnly)], hid ? { table: 'appointments', filters, order: [{ col: 'starts_at' }] } : null);
}

export function useReminders() {
  const userId = useUserId();
  const q = useRows<Reminder>(['reminders'], userId ? { table: 'reminders', filters: [eq('user_id', userId)], order: [{ col: 'created_at' }] } : null);
  // Synchronisation automatique avec les notifications locales du téléphone
  useEffect(() => {
    if (q.data) syncLocalReminders(q.data).catch(() => undefined);
  }, [q.data]);
  return q;
}

export function useNotificationsInbox() {
  const userId = useUserId();
  return useRows<AppNotification>(['notifications'], userId ? { table: 'notifications', filters: [eq('user_id', userId)], order: [{ col: 'created_at', asc: false }], limit: 100 } : null, { staleTime: 10_000 });
}

// ---------------------------------------------------------------- listes, documents, prénoms
export function useChecklists() {
  const hid = useHouseholdId();
  return useRows<Checklist>(['checklists', hid ?? ''], hid ? { table: 'checklists', filters: [eq('household_id', hid)], order: [{ col: 'created_at' }] } : null);
}
export function useChecklistItems(listId: string | null | undefined) {
  return useRows<ChecklistItem>(['checklist_items', listId ?? ''], listId ? { table: 'checklist_items', filters: [eq('checklist_id', listId)], order: [{ col: 'position' }] } : null);
}
export function useAllChecklistItems() {
  const hid = useHouseholdId();
  return useRows<ChecklistItem>(['checklist_items', hid ?? '', 'all'], hid ? { table: 'checklist_items', filters: [eq('household_id', hid)] } : null);
}
export function useDocuments() {
  const hid = useHouseholdId();
  return useRows<DocumentRow>(['documents', hid ?? ''], hid ? { table: 'documents', filters: [eq('household_id', hid)], order: [{ col: 'created_at', asc: false }] } : null);
}
export function useBabyNames() {
  return useRows<BabyName>(['baby_names'], { table: 'baby_names', order: [{ col: 'name' }] }, { staleTime: 3600_000 });
}
export function useNameFavorites() {
  const hid = useHouseholdId();
  return useRows<NameFavorite>(['name_favorites', hid ?? ''], hid ? { table: 'name_favorites', filters: [eq('household_id', hid)], order: [{ col: 'created_at' }] } : null);
}
export function useNameVotes() {
  const hid = useHouseholdId();
  return useRows<NameVote>(['name_votes', hid ?? ''], hid ? { table: 'name_votes', filters: [eq('household_id', hid)] } : null);
}

// ---------------------------------------------------------------- contenus
/** Version anglaise d'un article quand elle existe (colonnes *_en) ; sinon le texte français d'origine. */
export function localizeArticle<T extends Article>(a: T, lang: string = getLocale()): T {
  if (lang !== 'en' || !a.title_en || !a.body_md_en) return a;
  return { ...a, title: a.title_en, summary: a.summary_en ?? a.summary, body_md: a.body_md_en };
}
export function useArticles() {
  const q = useRows<Article>(['articles'], { table: 'articles', filters: [eq('status', 'published')], order: [{ col: 'updated_on', asc: false }] }, { staleTime: 600_000 });
  // L'arbre est remonté à chaque changement de langue : getLocale() suffit ici
  const lang = getLocale();
  const data = useMemo(() => (q.data && lang === 'en' ? q.data.map((a) => localizeArticle(a, lang)) : q.data), [q.data, lang]);
  return { ...q, data } as typeof q;
}
export function useCategories() {
  const q = useRows<Category>(['content_categories'], { table: 'content_categories', order: [{ col: 'position' }] }, { staleTime: 3600_000 });
  const lang = getLocale();
  const data = useMemo(() => (q.data && lang === 'en' ? q.data.map((c) => (c.label_en ? { ...c, label: c.label_en } : c)) : q.data), [q.data, lang]);
  return { ...q, data } as typeof q;
}
export function useEmergencyResources() {
  return useRows<EmergencyResource>(['emergency_resources'], { table: 'emergency_resources', filters: [eq('active', true)], order: [{ col: 'position' }] }, { staleTime: 3600_000 });
}

// ---------------------------------------------------------------- assistant
export function useConversations() {
  const userId = useUserId();
  return useRows<Conversation>(['assistant_conversations'], userId ? { table: 'assistant_conversations', filters: [eq('user_id', userId)], order: [{ col: 'updated_at', asc: false }] } : null);
}
export function useMessages(conversationId: string | null | undefined) {
  return useRows<AssistantMessage>(['assistant_messages', conversationId ?? ''], conversationId ? { table: 'assistant_messages', filters: [eq('conversation_id', conversationId)], order: [{ col: 'created_at' }] } : null);
}
export function useSavedAnswers() {
  const userId = useUserId();
  return useRows<AssistantMessage>(['assistant_messages', 'saved'], userId ? { table: 'assistant_messages', filters: [eq('user_id', userId), eq('saved', true)], order: [{ col: 'created_at', asc: false }] } : null);
}

// ---------------------------------------------------------------- communauté
export function useForums() {
  return useRows<Forum>(['forums'], { table: 'forums', order: [{ col: 'position' }] }, { staleTime: 3600_000 });
}
export function useFeed(forumId?: string | null) {
  const filters: Filter[] = forumId ? [eq('forum_id', forumId)] : [];
  return useRows<FeedPost>(['forum_feed', forumId ?? 'all'], { table: 'forum_feed', filters, order: [{ col: 'created_at', asc: false }], limit: 50 }, { staleTime: 15_000 });
}
export function usePost(id: string | null | undefined) {
  const q = useRows<FeedPost>(['forum_feed', 'post', id ?? ''], id ? { table: 'forum_feed', filters: [eq('id', id)] } : null);
  return { ...q, data: q.data?.[0] ?? null };
}
export function useComments(postId: string | null | undefined) {
  return useRows<FeedComment>(['comment_feed', postId ?? ''], postId ? { table: 'comment_feed', filters: [eq('post_id', postId)], order: [{ col: 'created_at' }] } : null);
}
/** Mon profil communautaire complet (présentation, visibilité, chiffres) : lu par une fonction serveur, jamais par la table. */
export function useCommunityProfile() {
  const userId = useUserId();
  const { session } = useAuth();
  return useQuery({
    queryKey: [session?.userId, 'community_profiles', 'mine'],
    queryFn: () => backend.rpc<CommunityProfile | null>('my_community_profile'),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------- abonnement & confidentialité
export function usePremium() {
  const { session } = useAuth();
  const q = useQuery({ queryKey: [session?.userId, 'subscriptions', 'premium'], queryFn: () => backend.rpc<boolean>('has_premium'), enabled: !!session, staleTime: 60_000 });
  return q.data === true;
}
export function useSubscription() {
  const userId = useUserId();
  const q = useRows<Subscription>(['subscriptions'], userId ? { table: 'subscriptions', filters: [eq('user_id', userId)] } : null);
  return q.data?.[0] ?? null;
}
export function usePrivacy() {
  const userId = useUserId();
  const q = useRows<PrivacySettings>(['privacy_settings'], userId ? { table: 'privacy_settings', filters: [eq('user_id', userId)] } : null);
  return { ...q, data: q.data?.[0] ?? null };
}
export function useConsents() {
  const userId = useUserId();
  const q = useRows<Consent>(['consents'], userId ? { table: 'consents', filters: [eq('user_id', userId)], order: [{ col: 'created_at', asc: false }] } : null);
  const latest = useMemo(() => {
    const m = new Map<ConsentPurpose, boolean>();
    for (const c of q.data ?? []) if (!m.has(c.purpose)) m.set(c.purpose, c.granted);
    return m;
  }, [q.data]);
  return { ...q, latest };
}
export function useSetConsent() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: (c: { purpose: ConsentPurpose; granted: boolean }) => backend.insert('consents', { user_id: userId, ...c }),
    onSuccess: () => inv('consents'),
  });
}

export { inList };
