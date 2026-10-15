/** Publication, commentaires et réponses en fil (un niveau). */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Field, Icon, Loading, Row, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { PostCard, ReportSheet } from '@/features/community';
import { backend, eq } from '@/lib/backend';
import { useCommunityProfile, useForums, useInvalidate, usePost } from '@/lib/data/hooks';
import { useCommentThreads, useCreateComment, useDeleteComment } from '@/lib/data/hooks-community';
import { timeAgo } from '@/lib/domain/dates';
import type { FeedComment } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function PostScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: post, isLoading } = usePost(id);
  const { threads } = useCommentThreads(id);
  const { data: forums } = useForums();
  const { data: me } = useCommunityProfile();
  const create = useCreateComment(id);
  const del = useDeleteComment();
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<FeedComment | null>(null);
  const [reportComment, setReportComment] = useState<string | null>(null);

  async function send() {
    if (!body.trim()) return;
    try {
      const c = await create.mutateAsync({ body, parentId: replyTo?.id ?? null });
      setBody('');
      setReplyTo(null);
      toast(c?.status === 'pending_review' ? 'Message envoyé en relecture avant d’être visible.' : replyTo ? 'Réponse publiée.' : 'Commentaire publié.', c?.status === 'pending_review' ? 'info' : 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Publication impossible.', 'error');
    }
  }

  async function removePost() {
    if (!(await confirm('Supprimer votre publication ?', 'Elle et ses commentaires seront supprimés.', 'Supprimer'))) return;
    await backend.remove('posts', [eq('id', id)]);
    inv('forum_feed');
    router.back();
  }

  async function removeComment(c: FeedComment) {
    if (!(await confirm('Supprimer votre commentaire ?', c.parent_id ? 'Cette action est définitive.' : 'Les réponses à ce commentaire seront aussi supprimées.', 'Supprimer'))) return;
    del.mutate(c.id);
  }

  if (isLoading) return <Screen back><Loading /></Screen>;
  if (!post) return <Screen back title="Publication indisponible"><Text muted>Elle a peut-être été supprimée ou masquée par la modération.</Text></Screen>;

  const action = (label: string, onPress: () => void, primary = false) => (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" style={{ minHeight: 36, justifyContent: 'center' }}>
      <Text variant="caption" color={primary ? t.colors.primary : undefined} muted={!primary}>{label}</Text>
    </Pressable>
  );

  const renderComment = (c: FeedComment, reply = false) => (
    <View key={c.id} style={{ marginLeft: reply ? spacing.lg : 0, gap: 4, paddingVertical: spacing.xs, borderLeftWidth: reply ? 2 : 0, borderLeftColor: t.colors.border, paddingLeft: reply ? spacing.sm : 0 }}>
      <Text variant="caption" muted>{c.pseudonym ?? 'Membre'} · {timeAgo(c.created_at)}{c.status !== 'visible' ? ' · en relecture' : ''}</Text>
      <Text variant="small">{c.body}</Text>
      <Row gap={spacing.md}>
        {me && c.status === 'visible' ? action('Répondre', () => setReplyTo(c), true) : null}
        {c.is_mine ? action('Supprimer', () => removeComment(c)) : action('Signaler', () => setReportComment(c.id))}
      </Row>
    </View>
  );

  return (
    <Screen back>
      <PostCard post={post} full forumTitle={forums?.find((f) => f.id === post.forum_id)?.title} />
      {post.is_mine && <Button label="Supprimer ma publication" variant="ghost" icon="trash-2" onPress={removePost} />}
      <Text variant="heading">{post.comment_count} commentaire{post.comment_count > 1 ? 's' : ''}</Text>
      <Card>
        {threads.length ? threads.map(({ root, replies }) => (
          <View key={root.id}>
            {renderComment(root)}
            {replies.map((r) => renderComment(r, true))}
          </View>
        )) : <Text muted>Soyez la première personne à répondre.</Text>}
      </Card>

      {post.status !== 'visible' ? (
        <Banner tone="info">{'Cette publication est en attente de modération : les commentaires sont fermés pour le moment.'}</Banner>
      ) : me ? (
        <Card tone="soft">
          {replyTo && (
            <Row style={{ marginBottom: spacing.xs }}>
              <Icon name="corner-down-right" size={14} />
              <Text variant="small" style={{ flex: 1 }}>Réponse à {replyTo.pseudonym ?? 'ce commentaire'}</Text>
              <Pressable onPress={() => setReplyTo(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Annuler la réponse"><Icon name="x" size={16} /></Pressable>
            </Row>
          )}
          <Field label={replyTo ? 'Votre réponse' : 'Votre commentaire'} value={body} onChangeText={setBody} multiline maxLength={4000} />
          <Button label={replyTo ? 'Répondre' : 'Publier'} style={{ marginTop: spacing.sm }} loading={create.isPending} disabled={!body.trim()} onPress={send} />
        </Card>
      ) : (
        <Banner tone="info" action={<Button label="Choisir un pseudonyme" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => router.push('/community/profile')} />}>
          {'Choisissez un pseudonyme pour commenter et répondre.'}
        </Banner>
      )}
      <ReportSheet visible={!!reportComment} onClose={() => setReportComment(null)} commentId={reportComment ?? undefined} />
    </Screen>
  );
}
