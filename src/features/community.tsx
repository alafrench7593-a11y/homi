import React, { useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { router } from 'expo-router';
import { Card, Chip, Icon, Row, Text } from '@/components/ui';
import { Sheet, useToast } from '@/components/Overlays';
import { backend, eq } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { useUserId } from '@/lib/auth';
import { timeAgo } from '@/lib/domain/dates';
import type { FeedPost, ReportReason } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { BRAND } from '@/config/brand';

export const REPORT_REASONS: { key: ReportReason; label: string }[] = [
  { key: 'harassment', label: 'Harcèlement ou propos blessants' },
  { key: 'medical_misinformation', label: 'Information médicale dangereuse' },
  { key: 'danger', label: 'Une personne semble en danger' },
  { key: 'personal_data', label: 'Données personnelles exposées' },
  { key: 'spam', label: 'Publicité ou spam' },
  { key: 'inappropriate', label: 'Contenu inapproprié' },
  { key: 'other', label: 'Autre' },
];

export function ReportSheet({ visible, onClose, postId, commentId }: { visible: boolean; onClose: () => void; postId?: string; commentId?: string }) {
  const toast = useToast();
  const inv = useInvalidate();
  async function report(reason: ReportReason) {
    try {
      await backend.insert('reports', { post_id: postId ?? null, comment_id: commentId ?? null, reason });
      toast('Merci. L’équipe de modération va examiner ce contenu.');
      inv('forum_feed', 'comment_feed');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Signalement impossible.', 'error');
    }
    onClose();
  }
  async function block() {
    await backend.rpc('block_author', { p_post: postId ?? null, p_comment: commentId ?? null });
    inv('forum_feed', 'comment_feed');
    toast('Cette personne est bloquée : vous ne verrez plus ses contenus.');
    onClose();
  }
  return (
    <Sheet visible={visible} onClose={onClose} title="Signaler ou bloquer">
      {REPORT_REASONS.map((r) => (
        <Pressable key={r.key} accessibilityRole="button" onPress={() => report(r.key)} style={{ minHeight: 48, justifyContent: 'center' }}>
          <Text>{r.label}</Text>
        </Pressable>
      ))}
      <Chip label="Bloquer cette personne" icon="slash" onPress={block} />
      <Text variant="caption" muted>Si quelqu’un semble en danger immédiat, appelez le 15 ou le 112.</Text>
    </Sheet>
  );
}

export function PostCard({ post, forumTitle, full }: { post: FeedPost; forumTitle?: string; full?: boolean }) {
  const t = useTheme();
  const inv = useInvalidate();
  const userId = useUserId();
  const [reporting, setReporting] = useState(false);

  async function like() {
    if (post.liked) await backend.remove('post_likes', [eq('post_id', post.id), eq('user_id', userId)]);
    else await backend.insert('post_likes', { post_id: post.id, user_id: userId });
    inv('forum_feed');
  }
  async function save() {
    if (post.saved) await backend.remove('saved_posts', [eq('post_id', post.id), eq('user_id', userId)]);
    else await backend.insert('saved_posts', { post_id: post.id, user_id: userId });
    inv('forum_feed');
  }

  return (
    <Card onPress={full ? undefined : () => router.push(`/community/post/${post.id}`)} accessibilityLabel={`Publication de ${post.pseudonym ?? 'anonyme'} : ${post.title}`}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="caption" muted>{post.pseudonym ?? 'Membre'}, {timeAgo(post.created_at)}{forumTitle ? ` dans ${forumTitle}` : ''}</Text>
        {post.status !== 'visible' && <Text variant="caption" color={t.colors.gold}>{post.status === 'pending_review' ? 'En relecture' : 'Masquée'}</Text>}
      </Row>
      <Text weight="bold" style={{ marginTop: 4 }}>{post.title}</Text>
      <Text variant="small" numberOfLines={full ? undefined : 3} style={{ marginTop: 2 }}>{post.body}</Text>
      {post.area_label ? <Row gap={4} style={{ marginTop: 6 }}><Icon name="map-pin" size={12} color={t.colors.textMuted} /><Text variant="caption" muted>{post.area_label}</Text></Row> : null}
      <Row style={{ marginTop: spacing.sm }} gap={spacing.xs}>
        <Chip label={String(post.like_count)} icon="heart" selected={post.liked} onPress={like} />
        <Chip label={String(post.comment_count)} icon="message-square" onPress={() => router.push(`/community/post/${post.id}`)} />
        <Chip label="" icon="bookmark" selected={post.saved} onPress={save} />
        <View style={{ flex: 1 }} />
        <Pressable accessibilityRole="button" accessibilityLabel="Partager" hitSlop={10} onPress={() => Share.share({ message: `« ${post.title} » — une discussion sur ${BRAND.name}` })} style={{ padding: 8 }}>
          <Icon name="share-2" size={18} color={t.colors.textMuted} />
        </Pressable>
        {!post.is_mine && (
          <Pressable accessibilityRole="button" accessibilityLabel="Signaler ou bloquer" hitSlop={10} onPress={() => setReporting(true)} style={{ padding: 8 }}>
            <Icon name="flag" size={18} color={t.colors.textMuted} />
          </Pressable>
        )}
      </Row>
      <ReportSheet visible={reporting} onClose={() => setReporting(false)} postId={post.id} />
    </Card>
  );
}
