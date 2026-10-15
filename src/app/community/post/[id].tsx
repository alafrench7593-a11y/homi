/** Publication et commentaires (réponses en fil). */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Field, Icon, Loading, Row, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { PostCard, ReportSheet } from '@/features/community';
import { backend, eq } from '@/lib/backend';
import { useComments, useCommunityProfile, useForums, useInvalidate, usePost } from '@/lib/data/hooks';
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
  const { data: comments } = useComments(id);
  const { data: forums } = useForums();
  const { data: me } = useCommunityProfile();
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<FeedComment | null>(null);
  const [reportComment, setReportComment] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    try {
      await backend.insert('comments', { post_id: id, parent_id: replyTo?.id ?? null, body: body.trim() });
      setBody('');
      setReplyTo(null);
      inv('comment_feed', 'forum_feed');
      toast('Commentaire publié.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Publication impossible.', 'error');
    } finally {
      setSending(false);
    }
  }

  async function removePost() {
    if (!(await confirm('Supprimer votre publication ?', 'Elle et ses commentaires seront supprimés.', 'Supprimer'))) return;
    await backend.remove('posts', [eq('id', id)]);
    inv('forum_feed');
    router.back();
  }

  async function removeComment(c: FeedComment) {
    if (!(await confirm('Supprimer votre commentaire ?', 'Cette action est définitive.', 'Supprimer'))) return;
    await backend.remove('comments', [eq('id', c.id)]);
    inv('comment_feed', 'forum_feed');
  }

  if (isLoading) return <Screen back><Loading /></Screen>;
  if (!post) return <Screen back title="Publication indisponible"><Text muted>Elle a peut-être été supprimée ou masquée par la modération.</Text></Screen>;

  const roots = (comments ?? []).filter((c) => !c.parent_id);
  const replies = (pid: string) => (comments ?? []).filter((c) => c.parent_id === pid);

  const renderComment = (c: FeedComment, depth = 0) => (
    <View key={c.id} style={{ marginLeft: depth * spacing.lg, gap: 4, paddingVertical: spacing.xs, borderLeftWidth: depth ? 2 : 0, borderLeftColor: t.colors.border, paddingLeft: depth ? spacing.sm : 0 }}>
      <Text variant="caption" muted>{c.pseudonym ?? 'Membre'} · {timeAgo(c.created_at)}{c.status !== 'visible' ? ' · en relecture' : ''}</Text>
      <Text variant="small">{c.body}</Text>
      <Row gap={spacing.md}>
        {depth === 0 && <Pressable onPress={() => setReplyTo(c)} hitSlop={8} accessibilityRole="button" style={{ minHeight: 36, justifyContent: 'center' }}><Text variant="caption" color={t.colors.primary}>Répondre</Text></Pressable>}
        {c.is_mine ? (
          <Pressable onPress={() => removeComment(c)} hitSlop={8} accessibilityRole="button" style={{ minHeight: 36, justifyContent: 'center' }}><Text variant="caption" muted>Supprimer</Text></Pressable>
        ) : (
          <Pressable onPress={() => setReportComment(c.id)} hitSlop={8} accessibilityRole="button" style={{ minHeight: 36, justifyContent: 'center' }}><Text variant="caption" muted>Signaler</Text></Pressable>
        )}
      </Row>
      {replies(c.id).map((r) => renderComment(r, depth + 1))}
    </View>
  );

  return (
    <Screen back>
      <PostCard post={post} full forumTitle={forums?.find((f) => f.id === post.forum_id)?.title} />
      {post.is_mine && <Button label="Supprimer ma publication" variant="ghost" icon="trash-2" onPress={removePost} />}
      <Text variant="heading">{post.comment_count} commentaire{post.comment_count > 1 ? 's' : ''}</Text>
      <Card>{roots.length ? roots.map((c) => renderComment(c)) : <Text muted>Soyez la première personne à répondre.</Text>}</Card>

      {me ? (
        <Card tone="soft">
          {replyTo && (
            <Row style={{ marginBottom: spacing.xs }}>
              <Icon name="corner-down-right" size={14} />
              <Text variant="small" style={{ flex: 1 }}>Réponse à {replyTo.pseudonym}</Text>
              <Pressable onPress={() => setReplyTo(null)} hitSlop={8}><Icon name="x" size={16} /></Pressable>
            </Row>
          )}
          <Field label="Votre commentaire" value={body} onChangeText={setBody} multiline maxLength={4000} />
          <Button label="Publier" style={{ marginTop: spacing.sm }} loading={sending} disabled={!body.trim()} onPress={send} />
        </Card>
      ) : (
        <Banner tone="info" action={<Button label="Choisir un pseudonyme" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => router.push('/community/profile')} />}>
          {'Choisissez un pseudonyme pour participer.'}
        </Banner>
      )}
      <ReportSheet visible={!!reportComment} onClose={() => setReportComment(null)} commentId={reportComment ?? undefined} />
    </Screen>
  );
}
