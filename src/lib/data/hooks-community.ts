/**
 * Communauté : espaces, recherche, favoris, réponses, blocage, signalement.
 * Toutes les lectures passent par la RLS côté Supabase (vues forum_feed / comment_feed)
 * et par les mêmes règles dans le moteur local de démonstration.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { backend, eq, inList } from '../backend';
import { useAuth, useUserId } from '../auth';
import type { CommunityProfile, FeedComment, FeedPost, Forum, Journey, ReportReason } from '../types';
import { useForums, useInvalidate, useProfile, useRows } from './hooks';

const FEED_KEYS = ['forum_feed', 'comment_feed'];

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
  // Une réponse dont le commentaire parent n'est plus visible (masqué, bloqué) est affichée seule
  const roots = byTime.filter((c) => !c.parent_id || !ids.has(c.parent_id));
  return roots.map((root) => ({ root, replies: byTime.filter((c) => c.parent_id === root.id && c !== root) }));
}

export const PSEUDONYM_RE = /^[A-Za-zÀ-ÿ0-9_.\- ]{3,24}$/;

/** Message d'erreur si le pseudonyme est invalide ou identifiant (prénom, adresse e-mail). */
export function pseudonymError(pseudo: string, ctx: { displayName?: string | null; email?: string | null }): string | null {
  const p = pseudo.trim();
  if (!PSEUDONYM_RE.test(p)) return '3 à 24 caractères : lettres, chiffres, espace, point, tiret.';
  const lower = p.toLowerCase();
  const name = ctx.displayName?.trim().toLowerCase();
  const local = ctx.email?.split('@')[0]?.toLowerCase();
  if ((name && lower === name) || (local && lower === local)) return 'Choisissez un pseudonyme différent de votre prénom et de votre adresse e-mail.';
  return null;
}

// ---------------------------------------------------------------- lectures
export function useSpaces() {
  const forums = useForums();
  const { data: profile } = useProfile();
  const split = useMemo(() => splitSpaces(forums.data ?? [], profile?.journeys ?? []), [forums.data, profile?.journeys]);
  return { ...forums, all: forums.data ?? [], ...split };
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

export function useMyPosts() {
  const userId = useUserId();
  return useRows<FeedPost>(['forum_feed', 'mine'], userId ? { table: 'forum_feed', filters: [eq('is_mine', true)], order: [{ col: 'created_at', asc: false }], limit: 100 } : null);
}

export function useCommentThreads(postId: string | null | undefined) {
  const q = useRows<FeedComment>(['comment_feed', postId ?? ''], postId ? { table: 'comment_feed', filters: [eq('post_id', postId)], order: [{ col: 'created_at' }] } : null);
  const threads = useMemo(() => threadComments(q.data ?? []), [q.data]);
  return { ...q, threads };
}

/** Personnes que j'ai bloquées, avec leur pseudonyme. */
export function useMyBlocks() {
  const userId = useUserId();
  const { session } = useAuth();
  return useQuery({
    queryKey: [session?.userId, 'user_blocks'],
    enabled: !!userId,
    queryFn: async () => {
      const blocks = await backend.select<{ blocked_id: string; created_at: string }>({ table: 'user_blocks', filters: [eq('blocker_id', userId)], order: [{ col: 'created_at', asc: false }] });
      if (!blocks.length) return [];
      const profiles = await backend.select<CommunityProfile>({ table: 'community_profiles', filters: [inList('user_id', blocks.map((b) => b.blocked_id))] });
      return blocks.map((b) => ({ userId: b.blocked_id, pseudonym: profiles.find((p) => p.user_id === b.blocked_id)?.pseudonym ?? 'Membre', since: b.created_at }));
    },
  });
}

// ---------------------------------------------------------------- écritures
export function useCreatePost() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (p: { forumId: string; title: string; body: string; areaLabel?: string | null }) => {
      const [row] = await backend.insert<FeedPost & { status: string }>('posts', { forum_id: p.forumId, title: p.title.trim(), body: p.body.trim(), area_label: p.areaLabel?.trim() || null });
      return row;
    },
    onSuccess: () => inv('forum_feed'),
  });
}

/** Commentaire, ou réponse à un commentaire (parentId). */
export function useCreateComment(postId: string) {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (c: { body: string; parentId?: string | null }) => {
      const [row] = await backend.insert<FeedComment>('comments', { post_id: postId, parent_id: c.parentId ?? null, body: c.body.trim() });
      return row;
    },
    onSuccess: () => inv(...FEED_KEYS, 'notifications'),
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
    onSuccess: () => inv('forum_feed'),
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
    onSuccess: () => inv('forum_feed'),
  });
}

export function useReport() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (r: { postId?: string | null; commentId?: string | null; reason: ReportReason; details?: string | null }) =>
      backend.insert('reports', { post_id: r.postId ?? null, comment_id: r.commentId ?? null, reason: r.reason, details: r.details ?? null }),
    onSuccess: () => inv(...FEED_KEYS, 'moderation_queue'),
  });
}

export function useBlockAuthor() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (t: { postId?: string | null; commentId?: string | null }) => backend.rpc('block_author', { p_post: t.postId ?? null, p_comment: t.commentId ?? null }),
    onSuccess: () => inv(...FEED_KEYS, 'user_blocks'),
  });
}

export function useUnblock() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: (blockedId: string) => backend.remove('user_blocks', [eq('blocker_id', userId), eq('blocked_id', blockedId)]),
    onSuccess: () => inv(...FEED_KEYS, 'user_blocks'),
  });
}

export function useDeleteComment() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => backend.remove('comments', [eq('id', id)]),
    onSuccess: () => inv(...FEED_KEYS),
  });
}

export function useSaveCommunityProfile() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (p: { pseudonym: string; areaLabel: string | null; exists: boolean }) => {
      const row = { pseudonym: p.pseudonym.trim(), area_label: p.areaLabel?.trim() || null };
      if (p.exists) await backend.update('community_profiles', row, [eq('user_id', userId)]);
      else await backend.insert('community_profiles', { user_id: userId, ...row });
    },
    onSuccess: () => inv('community_profiles', ...FEED_KEYS),
  });
}
