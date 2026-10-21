/**
 * Profil communautaire (le mien ou celui d'un membre) : en-tête façon réseau social, chiffres, onglets
 * Publications · Réponses · Photos · Enregistrés. Seules les informations choisies par la personne sont montrées ;
 * aucune donnée de suivi (grossesse, enfants, sommeil, médicaments, documents) n'apparaît jamais ici.
 */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { EmptyState, Skeleton } from '@/components/States';
import { Card, Chip, Icon, Row, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { Avatar, CommunityImage, PhotoViewer, PostCard } from '@/features/community';
import { useForums } from '@/lib/data/hooks';
import { useLikedPosts, useMemberComments, useMemberPosts, useMyComments, useMyPosts, useSavedPosts } from '@/lib/data/hooks-community';
import { JOURNEY_LABELS, joinedLabel } from '@/lib/domain/communityRules';
import { timeAgo } from '@/lib/domain/dates';
import type { FeedComment, FeedPhoto, FeedPost } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { NACRE, radius, spacing } from '@/theme/tokens';

export interface ProfileHeaderData {
  pseudonym: string; handle?: string | null; bio?: string | null; journey_label?: string | null; avatar_path?: string | null; avatar_preset?: string | null;
  joined?: string | null; posts?: number | null; comments?: number | null; photos?: number | null; minimal?: boolean;
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ alignItems: 'center', minWidth: 72 }} accessible accessibilityLabel={`${value} ${label}`}>
      <Text variant="heading">{String(value)}</Text>
      <Text variant="caption" muted>{label}</Text>
    </View>
  );
}

export function ProfileHeader({ p, actions }: { p: ProfileHeaderData; actions?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ borderRadius: radius.xl, overflow: 'hidden', backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border }} testID="profile-header">
      <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 84, opacity: 0.75 }} />
      <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md, marginTop: -40, gap: 6 }}>
        <Row style={{ alignItems: 'flex-end' }}>
          <View style={{ borderRadius: 48, borderWidth: 4, borderColor: t.colors.background }}>
            <Avatar path={p.avatar_path} preset={p.avatar_preset ?? 'moon'} size={84} label={`Avatar de ${p.pseudonym}`} />
          </View>
        </Row>
        <Text variant="heading" testID="profile-pseudonym" numberOfLines={2}>{p.pseudonym}</Text>
        {p.handle ? <Text muted testID="profile-handle">{`@${p.handle}`}</Text> : null}
        {p.bio ? <Text testID="profile-bio">{p.bio}</Text> : null}
        {/* Actions sous la présentation : elles passent à la ligne au lieu de sortir de l'écran sur un petit téléphone */}
        {actions ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{actions}</View> : null}
        <Row wrap gap={spacing.sm}>
          {p.journey_label && JOURNEY_LABELS[p.journey_label] ? <Row gap={4}><Icon name="compass" size={14} color={t.colors.textMuted} /><Text variant="small" muted>{JOURNEY_LABELS[p.journey_label]}</Text></Row> : null}
          {joinedLabel(p.joined) ? <Row gap={4}><Icon name="calendar" size={14} color={t.colors.textMuted} /><Text variant="small" muted>{joinedLabel(p.joined)}</Text></Row> : null}
        </Row>
        {p.minimal ? <Text variant="caption" muted>Ce membre a choisi un profil discret : seuls son pseudonyme et ses publications sont visibles.</Text> : (
          <Row style={{ justifyContent: 'space-around', marginTop: spacing.xs }} testID="profile-stats">
            <Stat value={p.posts ?? 0} label="publications" />
            <Stat value={p.comments ?? 0} label="commentaires" />
            <Stat value={p.photos ?? 0} label="photos" />
          </Row>
        )}
      </View>
    </View>
  );
}

function CommentRow({ c }: { c: FeedComment }) {
  const t = useTheme();
  return (
    <Card onPress={() => router.push({ pathname: '/community/post/[id]', params: { id: c.post_id, comment: c.id } })} accessibilityLabel={`Réponse : ${c.body}`}>
      <Text variant="caption" muted numberOfLines={1}>{`En réponse à « ${(c.post_title ?? c.post_excerpt ?? '').slice(0, 60)} » · ${timeAgo(c.created_at)}`}</Text>
      <Text style={{ marginTop: 4 }}>{c.body}</Text>
      {c.status !== 'visible' ? <Text variant="caption" color={t.colors.gold}>{c.status === 'pending_review' ? 'En relecture' : 'Masqué'}</Text> : null}
    </Card>
  );
}

function PhotosGrid({ posts }: { posts: FeedPost[] }) {
  const all: { post: FeedPost; photo: FeedPhoto }[] = posts.flatMap((p) => (p.photos ?? []).map((photo) => ({ post: p, photo })));
  const [open, setOpen] = useState<number | null>(null);
  if (!all.length) return <EmptyState icon="image" title="Aucune photo publiée" />;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} testID="profile-photos">
      {all.map((x, i) => (
        <Tappable key={x.photo.path} accessibilityRole="imagebutton" accessibilityLabel={`Photo ${i + 1}`} onPress={() => setOpen(i)} style={{ width: '32%', aspectRatio: 1, borderRadius: radius.md, overflow: 'hidden' }}>
          <CommunityImage path={x.photo.path} style={{ width: '100%', height: '100%' }} />
        </Tappable>
      ))}
      <PhotoViewer photos={all.map((x) => x.photo)} index={open} onClose={() => setOpen(null)} />
    </View>
  );
}

type Tab = 'posts' | 'replies' | 'photos' | 'saved';

function ProfileTab({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Tappable accessibilityRole="tab" accessibilityState={{ selected }} onPress={onPress} testID={`profile-tab-${label}`}
      style={{ minHeight: 44, paddingHorizontal: spacing.md, justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: selected ? t.colors.primary : 'transparent' }}>
      <Text weight={selected ? 'bold' : 'medium'} color={selected ? t.colors.primary : t.colors.textMuted}>{label}</Text>
    </Tappable>
  );
}

/** Onglets internes. `mine` : mes contenus (anonymes compris) et mes enregistrés / aimés. */
export function ProfileTabs({ handle, mine }: { handle: string | null; mine: boolean }) {
  const [tab, setTab] = useState<Tab>('posts');
  const [savedKind, setSavedKind] = useState<'saved' | 'liked'>('saved');
  const forums = useForums().data ?? [];
  const minePosts = useMyPosts();
  const memberPosts = useMemberPosts(mine ? null : handle);
  const myComments = useMyComments();
  const memberComments = useMemberComments(mine ? null : handle);
  const saved = useSavedPosts();
  const liked = useLikedPosts();
  const posts = mine ? minePosts : memberPosts;
  const comments = mine ? myComments : memberComments;
  const options: { value: Tab; label: string }[] = [{ value: 'posts', label: 'Publications' }, { value: 'replies', label: 'Réponses' }, { value: 'photos', label: 'Photos' }];
  if (mine) options.push({ value: 'saved', label: 'Enregistrés' });
  const forumOf = (p: FeedPost) => forums.find((f) => f.id === p.forum_id) ?? null;
  const list = (q: { data?: FeedPost[]; isLoading: boolean }, empty: string) => (q.isLoading && !q.data ? <Skeleton kind="card" rows={2} /> : q.data?.length
    ? <View style={{ gap: spacing.sm }}>{q.data.map((p) => <PostCard key={p.id} post={p} forum={forumOf(p)} />)}</View>
    : <EmptyState icon="message-square" title={empty} />);
  return (
    <View style={{ gap: spacing.sm }} testID="profile-tabs">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }} accessibilityRole="tablist">
        {options.map((o) => <ProfileTab key={o.value} label={o.label} selected={tab === o.value} onPress={() => setTab(o.value)} />)}
      </ScrollView>
      {tab === 'posts' ? list(posts, mine ? 'Vous n’avez encore rien publié' : 'Aucune publication') : null}
      {tab === 'replies' ? (comments.isLoading && !comments.data ? <Skeleton kind="list" rows={2} /> : comments.data?.length
        ? <View style={{ gap: spacing.sm }}>{comments.data.map((c) => <CommentRow key={c.id} c={c} />)}</View>
        : <EmptyState icon="message-circle" title="Aucune réponse" />) : null}
      {tab === 'photos' ? <PhotosGrid posts={posts.data ?? []} /> : null}
      {tab === 'saved' && mine ? (
        <>
          <Row><Chip label="Enregistrées" icon="bookmark" selected={savedKind === 'saved'} onPress={() => setSavedKind('saved')} /><Chip label="Aimées" icon="heart" selected={savedKind === 'liked'} onPress={() => setSavedKind('liked')} /></Row>
          {list(savedKind === 'saved' ? saved : liked, savedKind === 'saved' ? 'Aucune publication enregistrée' : 'Aucune publication aimée')}
        </>
      ) : null}
    </View>
  );
}
