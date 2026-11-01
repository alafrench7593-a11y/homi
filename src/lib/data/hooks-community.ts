/**
 * Communauté : catégories, fils « Pour vous » et « Récent », recherche, publications (texte, photos, anonymat),
 * commentaires et réponses, réactions, enregistrées, profils de membres, blocage, signalement, notifications.
 * Toutes les lectures passent par les vues forum_feed / comment_feed et les fonctions serveur (anonymat et visibilité
 * du profil garantis côté base), avec les mêmes règles dans le moteur local de démonstration.
 */
import { t as tr } from '@/i18n';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { backend, eq, inList } from '../backend';
import { useAuth, useUserId } from '../auth';
import type { CommunityMember, CommunityNotifPrefs, CommunityProfile, FeedComment, FeedPost, Forum, Journey, ReportReason } from '../types';
import { useForums, useInvalidate, useProfile, useRows } from './hooks';
import { forYouOrder, primaryCategories } from '../domain/communityRules';
import { prepareCommunityPhoto } from '../community/photos';
import { uuid } from '../uuid';

const FEED_KEYS = ['forum_feed', 'comment_feed'];
export const COMMUNITY_BUCKET = 'community';

// ---------------------------------------------------------------- logique pure (testée)
/** « Mes espaces » : ceux liés aux parcours du profil ; tous les autres restent ouverts. */
export function splitSpaces(forums: Forum[], journeys: readonly Journey[]): { mine: Forum[]; others: Forum[] } {
  const sorted = [...forums].sort((a, b) => a.position - b.position);
  const mine = sorted.filter((f) => f.journeys.length > 0 && f.journeys.some((j) => journeys.includes(j)));
  return { mine, others: sorted.filter((f) => !mine.includes(f)) };
}

export interface CommentThread { root: FeedComment; replies: FeedComment[] }

/** Fils de discussion à un niveau : commentaire racine + réponses (ordre chronologique). */
export function threadComments(comments: readonly FeedComment[]): CommentThread[] {
  const byTime = [...comments].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const ids = new Set(byTime.map((c) => c.id));
  const roots = byTime.filter((c) => !c.parent_id || !ids.has(c.parent_id));
  return roots.map((root) => ({ root, replies: byTime.filter((c) => c.parent_id === root.id && c !== root) }));
}

export const PSEUDONYM_RE = /^[A-Za-zÀ-ÿ0-9_.\- ]{3,24}$/;

/** Message d'erreur si le pseudonyme est invalide ou identifiant (prénom, adresse e-mail). */
export function pseudonymError(pseudo: string, ctx: { displayName?: string | null; email?: string | null }): string | null {
  const p = pseudo.trim();
  if (!PSEUDONYM_RE.test(p)) return tr('l3.community.pseudo_format');
  const lower = p.toLowerCase();
  const name = ctx.displayName?.trim().toLowerCase();
  const local = ctx.email?.split('@')[0]?.toLowerCase();
  if ((name && lower === name) || (local && lower === local)) return tr('l3.community.pseudo_identity');
  return null;
}

// ---------------------------------------------------------------- lectures
export function useSpaces() {
  const forums = useForums();
  const { data: profile } = useProfile();
  const journeys = useMemo(() => profile?.journeys ?? [], [profile?.journeys]);
  const split = useMemo(() => splitSpaces(forums.data ?? [], journeys), [forums.data, journeys]);
  const primary = useMemo(() => primaryCategories(forums.data ?? [], journeys), [forums.data, journeys]);
  return { ...forums, all: forums.data ?? [], ...split, primary };
}

/** Fil « Pour vous » (catégories du parcours, discussions actives, récence) ou « Récent » (chronologique). */
export function useCommunityFeed(mode: 'foryou' | 'recent', forumId: string | null, myForumIds: readonly string[]) {
  const q = useRows<FeedPost>(['forum_feed', 'feed', forumId ?? 'all'], { table: 'forum_feed', filters: forumId ? [eq('forum_id', forumId)] : [], order: [{ col: 'created_at', asc: false }], limit: 100 }, { staleTime: 15_000 });
  const data = useMemo(() => (q.data ? (mode === 'foryou' ? forYouOrder(q.data, myForumIds) : q.data) : undefined), [q.data, mode, myForumIds]);
  return { ...q, data };
}

/** Recherche (plein texte côté Supabase, « contient » en démonstration). Active dès 2 caractères. */
export function useCommunitySearch(query: string, forumId?: string | null) {
  const { session } = useAuth();
  const q = query.trim();
  return useQuery({
    queryKey: [session?.userId, 'forum_feed', 'search', q, forumId ?? 'all'],
    queryFn: () => backend.rpc<FeedPost[]>('search_posts', { p_query: q, p_forum: forumId ?? null, p_limit: 50 }),
    enabled: !!session && q.length >= 2,
    staleTime: 15_000,
  });
}

export function useSavedPosts() {
  const userId = useUserId();
  return useRows<FeedPost>(['forum_feed', 'saved'], userId ? { table: 'forum_feed', filters: [eq('saved', true)], order: [{ col: 'created_at', asc: false }], limit: 100 } : null);
}
export function useLikedPosts() {
  const userId = useUserId();
  return useRows<FeedPost>(['forum_feed', 'liked'], userId ? { table: 'forum_feed', filters: [eq('liked', true)], order: [{ col: 'created_at', asc: false }], limit: 100 } : null);
}
export function useMyPosts() {
  const userId = useUserId();
  return useRows<FeedPost>(['forum_feed', 'mine'], userId ? { table: 'forum_feed', filters: [eq('is_mine', true)], order: [{ col: 'created_at', asc: false }], limit: 100 } : null);
}
export function useMyComments() {
  const userId = useUserId();
  return useRows<FeedComment>(['comment_feed', 'mine'], userId ? { table: 'comment_feed', filters: [eq('is_mine', true)], order: [{ col: 'created_at', asc: false }], limit: 100 } : null);
}

/** Profil public d'un membre (selon ses choix de visibilité). null = introuvable. */
export function useCommunityMember(handle: string | null | undefined) {
  const { session } = useAuth();
  return useQuery({
    queryKey: [session?.userId, 'community_profiles', 'member', handle ?? ''],
    queryFn: () => backend.rpc<CommunityMember | null>('community_member', { p_handle: handle }),
    enabled: !!session && !!handle,
    staleTime: 30_000,
  });
}
export function useMemberPosts(handle: string | null | undefined) {
  return useRows<FeedPost>(['forum_feed', 'member', handle ?? ''], handle ? { table: 'forum_feed', filters: [eq('author_handle', handle)], order: [{ col: 'created_at', asc: false }], limit: 100 } : null);
}
export function useMemberComments(handle: string | null | undefined) {
  return useRows<FeedComment>(['comment_feed', 'member', handle ?? ''], handle ? { table: 'comment_feed', filters: [eq('author_handle', handle)], order: [{ col: 'created_at', asc: false }], limit: 100 } : null);
}

export function useCommentThreads(postId: string | null | undefined) {
  const q = useRows<FeedComment>(['comment_feed', postId ?? ''], postId ? { table: 'comment_feed', filters: [eq('post_id', postId)], order: [{ col: 'created_at' }] } : null);
  const threads = useMemo(() => threadComments(q.data ?? []), [q.data]);
  return { ...q, threads };
}

/** Personnes que j'ai bloquées, avec leur pseudonyme et leur identifiant. */
export function useMyBlocks() {
  const userId = useUserId();
  const { session } = useAuth();
  return useQuery({
    queryKey: [session?.userId, 'user_blocks'],
    enabled: !!userId,
    queryFn: async () => {
      const blocks = await backend.select<{ blocked_id: string; created_at: string }>({ table: 'user_blocks', filters: [eq('blocker_id', userId)], order: [{ col: 'created_at', asc: false }] });
      if (!blocks.length) return [];
      const profiles = await backend.select<Pick<CommunityProfile, 'user_id' | 'pseudonym' | 'handle'>>({ table: 'community_profiles', columns: 'user_id,pseudonym,handle', filters: [inList('user_id', blocks.map((b) => b.blocked_id))] });
      return blocks.map((b) => {
        const p = profiles.find((x) => x.user_id === b.blocked_id);
        return { userId: b.blocked_id, pseudonym: p?.pseudonym ?? 'Membre', handle: p?.handle ?? null, since: b.created_at };
      });
    },
  });
}

/** Adresse temporaire d'une photo du stockage privé (lecture contrôlée par la base). */
export function useCommunityImage(path: string | null | undefined) {
  const { session } = useAuth();
  return useQuery({
    queryKey: [session?.userId, 'community_image', path ?? ''],
    queryFn: () => backend.storage.signedUrl(COMMUNITY_BUCKET, path!, 3600),
    enabled: !!session && !!path,
    staleTime: 50 * 60_000,
  });
}

export const DEFAULT_NOTIF_PREFS: CommunityNotifPrefs = { post_comment: true, comment_reply: true, reaction: true, saved_reply: true, moderation: true, mention: true, new_follower: true, followed_post: false, group_activity: true, group_invite: true };
export function useCommunityNotifPrefs() {
  const userId = useUserId();
  const q = useRows<CommunityNotifPrefs>(['community_notification_prefs'], userId ? { table: 'community_notification_prefs', filters: [eq('user_id', userId)] } : null);
  return { ...q, data: { ...DEFAULT_NOTIF_PREFS, ...(q.data?.[0] ?? {}) } as CommunityNotifPrefs, saved: !!q.data?.[0] };
}
export function useSaveNotifPrefs() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: (p: CommunityNotifPrefs) => backend.insert('community_notification_prefs', { ...DEFAULT_NOTIF_PREFS, ...p, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }),
    onSuccess: () => inv('community_notification_prefs'),
  });
}

// ---------------------------------------------------------------- écritures
export interface DraftPhoto { uri: string; bytes?: Uint8Array; width?: number; height?: number }

/** Envoie les photos (déjà nettoyées) dans le dossier de la personne ; renvoie les chemins. */
async function uploadPhotos(userId: string, photos: DraftPhoto[]) {
  const out: { path: string; width: number | null; height: number | null }[] = [];
  for (const ph of photos) {
    const prepared = ph.bytes ? { bytes: ph.bytes, width: ph.width ?? 0, height: ph.height ?? 0 } : await prepareCommunityPhoto(ph.uri);
    const path = `${userId}/${uuid()}.jpg`;
    await backend.storage.upload(COMMUNITY_BUCKET, path, { uri: ph.uri, mimeType: 'image/jpeg', size: prepared.bytes.length, bytes: prepared.bytes, name: path.split('/')[1] });
    out.push({ path, width: prepared.width || null, height: prepared.height || null });
  }
  return out;
}

export function useCreatePost() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (p: { forumId: string; title?: string | null; body: string; kind: 'question' | 'testimony'; anonymous: boolean; photos: DraftPhoto[];
      groupId?: string | null; poll?: { options: string[]; multiple: boolean; closesInDays?: number | null } | null }) => {
      const [row] = await backend.insert<{ id: string; status: string }>('posts',
        { forum_id: p.forumId, title: p.title?.trim() || null, body: p.body.trim(), kind: p.kind, anonymous: p.anonymous, group_id: p.groupId ?? null }, { returning: 'id,status' });
      if (p.poll) {
        const closes = p.poll.closesInDays ? new Date(Date.now() + p.poll.closesInDays * 86_400_000).toISOString() : null;
        await backend.insert('post_polls', { post_id: row.id, multiple: p.poll.multiple, closes_at: closes }, { returning: 'post_id' });
        await backend.insert('poll_options', p.poll.options.map((label, position) => ({ post_id: row.id, label: label.trim(), position })), { returning: 'id' });
      }
      if (p.photos.length && userId) {
        const uploaded = await uploadPhotos(userId, p.photos);
        await backend.insert('post_photos', uploaded.map((u, position) => ({ post_id: row.id, path: u.path, width: u.width, height: u.height, position })), { returning: 'id' });
      }
      return row;
    },
    onSuccess: () => inv('forum_feed', 'community_profiles'),
  });
}

export function useUpdatePost() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (p: { id: string; forumId: string; title?: string | null; body: string; kind: 'question' | 'testimony'; removePaths: string[]; addPhotos: DraftPhoto[]; keptCount: number }) => {
      const [row] = await backend.update<{ id: string; status: string }>('posts', { forum_id: p.forumId, title: p.title?.trim() || null, body: p.body.trim(), kind: p.kind }, [eq('id', p.id)], { returning: 'id,status' });
      if (p.removePaths.length) {
        await backend.remove('post_photos', [eq('post_id', p.id), inList('path', p.removePaths)]);
        await backend.storage.remove(COMMUNITY_BUCKET, p.removePaths).catch(() => undefined);
      }
      if (p.addPhotos.length && userId) {
        const uploaded = await uploadPhotos(userId, p.addPhotos);
        await backend.insert('post_photos', uploaded.map((u, i) => ({ post_id: p.id, path: u.path, width: u.width, height: u.height, position: p.keptCount + i })), { returning: 'id' });
      }
      return row;
    },
    onSuccess: () => inv('forum_feed', 'community_profiles'),
  });
}

/** Suppression définitive : photos effacées du stockage, puis la publication (et ses commentaires). */
export function useDeletePost() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (post: Pick<FeedPost, 'id' | 'photos'>) => {
      const paths = (post.photos ?? []).map((p) => p.path);
      // D'abord la publication : si sa suppression échoue, les photos restent intactes (plus d'images cassées)
      await backend.remove('posts', [eq('id', post.id)]);
      if (paths.length) await backend.storage.remove(COMMUNITY_BUCKET, paths).catch(() => undefined);
    },
    onSuccess: () => inv(...FEED_KEYS, 'community_profiles'),
  });
}

/** Commentaire, ou réponse à un commentaire (parentId). */
export function useCreateComment(postId: string) {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (c: { body: string; parentId?: string | null }) => {
      const [row] = await backend.insert<{ id: string; status: string; parent_id: string | null }>('comments', { post_id: postId, parent_id: c.parentId ?? null, body: c.body.trim() }, { returning: 'id,status,parent_id' });
      return row;
    },
    onSuccess: () => inv(...FEED_KEYS, 'notifications', 'community_profiles'),
  });
}

export function useUpdateComment() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (c: { id: string; body: string }) => {
      const [row] = await backend.update<{ id: string; status: string }>('comments', { body: c.body.trim() }, [eq('id', c.id)], { returning: 'id,status' });
      return row;
    },
    onSuccess: () => inv(...FEED_KEYS),
  });
}

export function useToggleSave() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (post: Pick<FeedPost, 'id' | 'saved'>) => {
      if (post.saved) await backend.remove('saved_posts', [eq('post_id', post.id), eq('user_id', userId)]);
      else await backend.insert('saved_posts', { post_id: post.id, user_id: userId }, { onConflict: 'post_id,user_id', ignoreDuplicates: true });
      return !post.saved;
    },
    onSuccess: () => inv('forum_feed', 'community_profiles'),
  });
}

export function useToggleLike() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (post: Pick<FeedPost, 'id' | 'liked'>) => {
      if (post.liked) await backend.remove('post_likes', [eq('post_id', post.id), eq('user_id', userId)]);
      else await backend.insert('post_likes', { post_id: post.id, user_id: userId });
    },
    onSuccess: () => inv('forum_feed', 'community_profiles'),
  });
}

export function useReport() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (r: { postId?: string | null; commentId?: string | null; reason: ReportReason; details?: string | null }) =>
      backend.insert('reports', { post_id: r.postId ?? null, comment_id: r.commentId ?? null, reason: r.reason, details: r.details ?? null }, { returning: 'id' }),
    onSuccess: () => inv(...FEED_KEYS, 'moderation_queue'),
  });
}

export function useBlockAuthor() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (t: { postId?: string | null; commentId?: string | null }) => backend.rpc('block_author', { p_post: t.postId ?? null, p_comment: t.commentId ?? null }),
    onSuccess: () => inv(...FEED_KEYS, 'user_blocks', 'community_profiles'),
  });
}

export function useReportMember() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (r: { handle: string; reason: ReportReason; details?: string | null }) => backend.rpc('report_member', { p_handle: r.handle, p_reason: r.reason, p_details: r.details ?? null }),
    onSuccess: () => inv('moderation_queue'),
  });
}

export function useBlockMember() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (handle: string) => backend.rpc('block_member', { p_handle: handle }),
    onSuccess: () => inv(...FEED_KEYS, 'user_blocks', 'community_profiles'),
  });
}

export function useUnblock() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: (blockedId: string) => backend.remove('user_blocks', [eq('blocker_id', userId), eq('blocked_id', blockedId)]),
    onSuccess: () => inv(...FEED_KEYS, 'user_blocks', 'community_profiles'),
  });
}

export function useDeleteComment() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => backend.remove('comments', [eq('id', id)]),
    onSuccess: () => inv(...FEED_KEYS, 'community_profiles'),
  });
}

export interface CommunityProfileDraft {
  pseudonym: string; handle?: string | null; bio?: string | null; journeyLabel?: string | null; visibility?: 'members' | 'minimal';
  avatarPreset?: string | null; areaLabel?: string | null; acceptRules?: boolean;
}
export function useSaveCommunityProfile() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (p: CommunityProfileDraft & { exists: boolean }) => {
      const row: Record<string, unknown> = {
        pseudonym: p.pseudonym.trim(), bio: p.bio?.trim() || null, journey_label: p.journeyLabel || null,
        visibility: p.visibility ?? 'members', area_label: p.areaLabel?.trim() || null,
      };
      if (p.handle !== undefined) row.handle = p.handle?.trim() || null;
      if (p.avatarPreset !== undefined) row.avatar_preset = p.avatarPreset;
      if (p.acceptRules) row.rules_accepted_at = new Date().toISOString();
      if (p.exists) await backend.update('community_profiles', row, [eq('user_id', userId)], { returning: 'user_id' });
      else await backend.insert('community_profiles', { user_id: userId, ...row }, { returning: 'user_id' });
    },
    onSuccess: () => inv('community_profiles', ...FEED_KEYS),
  });
}

/** Photo de profil : nettoyée (sans métadonnées), déposée dans mon dossier ; l'ancienne est effacée. */
export function useSetAvatarPhoto() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (p: { uri: string | null; previous: string | null }) => {
      let path: string | null = null;
      if (p.uri && userId) {
        const prepared = await prepareCommunityPhoto(p.uri);
        path = `${userId}/avatar-${uuid()}.jpg`;
        await backend.storage.upload(COMMUNITY_BUCKET, path, { uri: p.uri, mimeType: 'image/jpeg', size: prepared.bytes.length, bytes: prepared.bytes });
      }
      await backend.update('community_profiles', { avatar_path: path }, [eq('user_id', userId)], { returning: 'user_id' });
      if (p.previous) await backend.storage.remove(COMMUNITY_BUCKET, [p.previous]).catch(() => undefined);
      return path;
    },
    onSuccess: () => inv('community_profiles', ...FEED_KEYS, 'community_image'),
  });
}
