/**
 * Mini-réseau social de la communauté : suivre, catégories suivies, groupes, sondages, épinglage, sujets consultés,
 * recherche (membres, avancée), journal d'activité, dossiers et albums (Premium), ateliers, résumé quotidien, IA.
 * Les droits sont vérifiés côté base (fonctions et politiques), avec les mêmes règles dans le moteur de démonstration.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { backend, eq } from '../backend';
import { useAuth, useUserId } from '../auth';
import { prepareCommunityPhoto } from '../community/photos';
import { syncDigestNotifications } from '../notifications';
import { uuid } from '../uuid';
import type { ActivityItem, CommunityAlbum, CommunityEvent, CommunityGroup, DigestPrefs, FeedPost, MemberCard, SavedFolder } from '../types';
import { useInvalidate, useRows } from './hooks';
import { COMMUNITY_BUCKET } from './hooks-community';

const FEED = ['forum_feed', 'comment_feed'];

function useRpcQuery<T>(key: unknown[], fn: string, args: Record<string, unknown> = {}, enabled = true, staleTime = 15_000) {
  const { session } = useAuth();
  return useQuery({ queryKey: [session?.userId, ...key], queryFn: () => backend.rpc<T>(fn, args), enabled: !!session && enabled, staleTime });
}

// ---------------------------------------------------------------- suivre un membre, catégories suivies
export function useFollows() {
  return useRpcQuery<MemberCard[]>(['member_follows'], 'my_follows');
}
export function useFollowMember() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (p: { handle: string; follow: boolean }) => backend.rpc(p.follow ? 'follow_member' : 'unfollow_member', { p_handle: p.handle }),
    onSuccess: () => inv('member_follows', 'community_profiles', 'forum_feed'),
  });
}
export function useForumSubscriptions() {
  const userId = useUserId();
  const q = useRows<{ forum_id: string }>(['forum_subscriptions'], userId ? { table: 'forum_subscriptions', filters: [eq('user_id', userId)] } : null);
  const ids = useMemo(() => (q.data ?? []).map((x) => x.forum_id), [q.data]);
  return { ...q, ids };
}
export function useToggleForumSubscription() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (p: { forumId: string; on: boolean }) => {
      if (p.on) await backend.insert('forum_subscriptions', { user_id: userId, forum_id: p.forumId }, { onConflict: 'user_id,forum_id', ignoreDuplicates: true });
      else await backend.remove('forum_subscriptions', [eq('user_id', userId), eq('forum_id', p.forumId)]);
    },
    onSuccess: () => inv('forum_subscriptions'),
  });
}
export function useSearchMembers(query: string) {
  const q = query.trim();
  return useRpcQuery<MemberCard[]>(['community_profiles', 'search', q], 'search_members', { p_query: q, p_limit: 20 }, q.replace(/^@/, '').length >= 2);
}

// ---------------------------------------------------------------- groupes
export function useGroups() {
  return useRpcQuery<CommunityGroup[]>(['community_groups', 'overview'], 'community_groups_overview');
}
export function useGroup(id: string | null | undefined) {
  return useRpcQuery<CommunityGroup | null>(['community_groups', 'detail', id ?? ''], 'group_detail', { p_group: id }, !!id);
}
export function useGroupFeed(id: string | null | undefined) {
  return useRows<FeedPost>(['forum_feed', 'group', id ?? ''], id ? { table: 'forum_feed', filters: [eq('group_id', id)], order: [{ col: 'created_at', asc: false }], limit: 100 } : null);
}
export function useGroupAction() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (a: { fn: 'join_group' | 'leave_group' | 'join_cohort_group' | 'create_private_group' | 'invite_to_group' | 'respond_group_invitation' | 'remove_group_member' | 'delete_private_group'; args: Record<string, unknown> }) =>
      backend.rpc<string | null>(a.fn, a.args),
    onSuccess: () => inv('community_groups', 'forum_feed', 'notifications'),
  });
}

// ---------------------------------------------------------------- sondages, épinglage, sujets consultés
export function useVotePoll() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (p: { postId: string; options: string[] }) => backend.rpc('vote_poll', { p_post: p.postId, p_options: p.options }),
    onSuccess: () => inv('forum_feed'),
  });
}
export function usePinPost() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (p: { postId: string; pin: boolean }) => backend.rpc('pin_post', { p_post: p.postId, p_pin: p.pin }),
    onSuccess: () => inv('forum_feed'),
  });
}
export function useTopicViews() {
  const userId = useUserId();
  const q = useRows<{ forum_id: string; views: number; last_at: string }>(['community_topic_views'], userId ? { table: 'community_topic_views', filters: [eq('user_id', userId)] } : null);
  const map = useMemo(() => Object.fromEntries((q.data ?? []).map((x) => [x.forum_id, x.views])), [q.data]);
  return { ...q, map };
}
/** Note la lecture d'une publication (sert uniquement à classer « Pour vous », effaçable). */
export function useNoteTopicView(postId: string | null | undefined) {
  const { session } = useAuth();
  useEffect(() => {
    if (!session || !postId) return;
    void backend.rpc('note_topic_view', { p_post: postId }).catch(() => undefined);
  }, [session, postId]);
}
export function useClearTopicViews() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({ mutationFn: () => backend.remove('community_topic_views', [eq('user_id', userId)]), onSuccess: () => inv('community_topic_views') });
}

// ---------------------------------------------------------------- Premium : recherche avancée, journal, dossiers, albums
export interface AdvancedFilters { query?: string; forumIds?: string[]; kind?: 'question' | 'testimony' | 'poll' | null; withPhotos?: boolean; sinceDays?: number | null; unanswered?: boolean; handle?: string | null; groupId?: string | null }
export function useAdvancedSearch(f: AdvancedFilters | null) {
  const args = f ? {
    p_query: f.query?.trim() || null, p_forums: f.forumIds?.length ? f.forumIds : null, p_kind: f.kind ?? null, p_with_photos: !!f.withPhotos,
    p_since: f.sinceDays ? new Date(Date.now() - f.sinceDays * 86_400_000).toISOString() : null, p_unanswered: !!f.unanswered, p_handle: f.handle?.trim() || null,
    p_group: f.groupId ?? null, p_limit: 60,
  } : {};
  return useRpcQuery<FeedPost[]>(['forum_feed', 'advanced', JSON.stringify(args)], 'search_posts_advanced', args, !!f);
}
export function useActivity(enabled: boolean) {
  return useRpcQuery<ActivityItem[]>(['community_activity'], 'my_community_activity', { p_limit: 100 }, enabled);
}
export function useSavedFolders() {
  const userId = useUserId();
  return useRows<SavedFolder>(['saved_folders'], userId ? { table: 'saved_folders', filters: [eq('user_id', userId)], order: [{ col: 'created_at' }] } : null);
}
export function useFolderAction() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (a: { kind: 'create'; name: string } | { kind: 'delete'; id: string } | { kind: 'move'; postId: string; folderId: string | null }) => {
      if (a.kind === 'create') return backend.insert('saved_folders', { user_id: userId, name: a.name.trim() }, { returning: 'id' });
      if (a.kind === 'delete') return backend.remove('saved_folders', [eq('id', a.id)]);
      return backend.update('saved_posts', { folder_id: a.folderId }, [eq('post_id', a.postId), eq('user_id', userId)], { returning: 'post_id' });
    },
    onSuccess: () => inv('saved_folders', 'forum_feed'),
  });
}
export function useAlbums() {
  return useRpcQuery<CommunityAlbum[]>(['community_albums'], 'my_albums');
}
export function useAlbumPhotos(albumId: string | null | undefined) {
  return useRows<{ id: string; album_id: string; path: string; width: number | null; height: number | null; created_at: string; owner_id?: string }>(
    ['community_albums', 'photos', albumId ?? ''], albumId ? { table: 'album_photos', filters: [eq('album_id', albumId)], order: [{ col: 'created_at' }] } : null);
}
export function useAlbumAction() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (a:
      | { kind: 'create'; title: string; description?: string | null }
      | { kind: 'delete'; id: string; paths: string[] }
      | { kind: 'addPhoto'; albumId: string; uri: string }
      | { kind: 'removePhoto'; id: string; path: string }
      | { kind: 'share'; albumId: string; handle: string }
      | { kind: 'unshare'; albumId: string; handle: string }) => {
      switch (a.kind) {
        case 'create': return (await backend.insert<{ id: string }>('community_albums', { owner_id: userId, title: a.title.trim(), description: a.description?.trim() || null }, { returning: 'id' }))[0].id;
        case 'delete':
          if (a.paths.length) await backend.storage.remove(COMMUNITY_BUCKET, a.paths).catch(() => undefined);
          await backend.remove('community_albums', [eq('id', a.id)]);
          return null;
        case 'addPhoto': {
          // Photo nettoyée (sans métadonnées ni position GPS), déposée dans mon dossier
          const prepared = await prepareCommunityPhoto(a.uri);
          const path = `${userId}/album-${uuid()}.jpg`;
          await backend.storage.upload(COMMUNITY_BUCKET, path, { uri: a.uri, mimeType: 'image/jpeg', size: prepared.bytes.length, bytes: prepared.bytes, name: path.split('/')[1] });
          try {
            await backend.insert('album_photos', { album_id: a.albumId, owner_id: userId, path, width: prepared.width || null, height: prepared.height || null }, { returning: 'id' });
          } catch (e) {
            await backend.storage.remove(COMMUNITY_BUCKET, [path]).catch(() => undefined);
            throw e;
          }
          return path;
        }
        case 'removePhoto':
          await backend.remove('album_photos', [eq('id', a.id)]);
          await backend.storage.remove(COMMUNITY_BUCKET, [a.path]).catch(() => undefined);
          return null;
        case 'share': await backend.rpc('share_album', { p_album: a.albumId, p_handle: a.handle }); return null;
        case 'unshare': {
          const profiles = await backend.select<{ user_id: string }>({ table: 'community_profiles', columns: 'user_id,handle', filters: [eq('handle', a.handle)] });
          if (profiles[0]) await backend.remove('album_shares', [eq('album_id', a.albumId), eq('user_id', profiles[0].user_id)]);
          return null;
        }
      }
    },
    onSuccess: () => inv('community_albums', 'community_image'),
  });
}

// ---------------------------------------------------------------- ateliers et rencontres
export function useEvents() {
  return useRows<CommunityEvent>(['community_events'], { table: 'community_events', order: [{ col: 'starts_at' }] });
}
export function useEventRegistrations() {
  const userId = useUserId();
  return useRows<{ event_id: string }>(['event_registrations'], userId ? { table: 'event_registrations', filters: [eq('user_id', userId)] } : null);
}
export function useEventAction() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (a: { eventId: string; register: boolean }) => {
      if (a.register) await backend.insert('event_registrations', { event_id: a.eventId, user_id: userId }, { returning: 'event_id' });
      else await backend.remove('event_registrations', [eq('event_id', a.eventId), eq('user_id', userId)]);
    },
    onSuccess: () => inv('event_registrations'),
  });
}

// ---------------------------------------------------------------- résumé du matin et du soir
export const DEFAULT_DIGEST: DigestPrefs = { morning: false, morning_time: '08:00', evening: false, evening_time: '20:30', question: true, hidden_items: [] };
export function useDigestPrefs() {
  const userId = useUserId();
  const q = useRows<DigestPrefs>(['daily_digest_prefs'], userId ? { table: 'daily_digest_prefs', filters: [eq('user_id', userId)] } : null);
  const data = useMemo(() => {
    const row = q.data?.[0];
    return row ? { ...DEFAULT_DIGEST, ...row, morning_time: String(row.morning_time).slice(0, 5), evening_time: String(row.evening_time).slice(0, 5) } : DEFAULT_DIGEST;
  }, [q.data]);
  return { ...q, data, saved: !!q.data?.[0] };
}
export function useSaveDigestPrefs() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (p: DigestPrefs) => {
      await backend.insert('daily_digest_prefs', { ...p, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      await syncDigestNotifications(p).catch(() => 0);
    },
    onSuccess: () => inv('daily_digest_prefs'),
  });
}
/** Garde les notifications du résumé alignées sur les réglages (nouvel appareil, réinstallation). */
export function useDigestSync() {
  const { data, saved } = useDigestPrefs();
  useEffect(() => { if (saved) void syncDigestNotifications(data).catch(() => 0); }, [saved, data]);
}

// ---------------------------------------------------------------- résumé et traduction (Premium, serveur)
export type CommunityAiResult =
  | { ai: 'ok' | 'demo'; kind: 'summary'; points: string[]; caution: string | null; message?: string }
  | { ai: 'ok'; kind: 'translation'; text: string; target: 'fr' | 'en' }
  | { ai: 'not_configured' | 'unavailable' | 'rejected' | 'consent_required'; message: string };
export function useCommunityAi() {
  return useMutation({
    mutationFn: (p: { action: 'summarize' | 'translate'; postId: string; commentId?: string | null; target?: 'fr' | 'en' }) =>
      backend.invoke<CommunityAiResult>('community-ai', { action: p.action, post_id: p.postId, comment_id: p.commentId ?? null, target_lang: p.target ?? 'fr' }),
  });
}

export { FEED as SOCIAL_FEED_KEYS };
