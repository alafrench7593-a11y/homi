/** Publication, commentaires et réponses en fil (un niveau). Une notification ouvre directement le commentaire visé. */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { type FlatList, type TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Banner, Button, Card, Field, Icon, Row, Text } from '@/components/ui';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Avatar, PostCard, ReportSheet } from '@/features/community';
import { useCommunityProfile, useForums, usePost } from '@/lib/data/hooks';
import { useCommentThreads, useCreateComment, useDeleteComment, useUpdateComment } from '@/lib/data/hooks-community';
import { friendlyError } from '@/lib/data/hooks-settings';
import { timeAgo } from '@/lib/domain/dates';
import type { FeedComment } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

export default function PostScreen() {
  const t = useTheme();
  const toast = useToast();
  const { id, comment: focusComment } = useLocalSearchParams<{ id: string; comment?: string }>();
  const insets = useSafeAreaInsets();
  const postQ = usePost(id);
  const { data: post } = postQ;
  const isLoading = postQ.isLoading && !postQ.data;
  const commentsQ = useCommentThreads(id);
  const { threads } = commentsQ;
  const commentsLoading = commentsQ.isLoading && !commentsQ.data;
  const commentsError = commentsQ.isError && !commentsQ.data;
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<{ c: FeedComment; reply: boolean }>>(null);
  const [editing, setEditing] = useState<FeedComment | null>(null);
  const [editBody, setEditBody] = useState('');
  const updateComment = useUpdateComment();
  // Fil aplati (commentaire puis ses réponses) pour une liste virtualisée
  const rows = useMemo(() => threads.flatMap(({ root, replies }) => [{ c: root, reply: false }, ...replies.map((r) => ({ c: r, reply: true }))]), [threads]);
  const { data: forums } = useForums();
  const { data: me } = useCommunityProfile();
  const create = useCreateComment(id);
  const del = useDeleteComment();
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<FeedComment | null>(null);
  const [reportComment, setReportComment] = useState<string | null>(null);
  // Lien depuis une notification : défilement jusqu'au commentaire concerné, mis en évidence
  useEffect(() => {
    if (!focusComment || !rows.length) return;
    const index = rows.findIndex((r) => r.c.id === focusComment);
    if (index < 0) return;
    const h = setTimeout(() => { try { listRef.current?.scrollToIndex({ index, viewPosition: 0.3, animated: true }); } catch { /* liste pas encore mesurée */ } }, 350);
    return () => clearTimeout(h);
  }, [focusComment, rows.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveEdit() {
    if (!editing || !editBody.trim() || updateComment.isPending) return;
    try {
      const r = await updateComment.mutateAsync({ id: editing.id, body: editBody });
      toast(r?.status === 'pending_review' ? 'Commentaire modifié : il sera relu avant d’être de nouveau visible.' : 'Commentaire modifié.', r?.status === 'pending_review' ? 'info' : 'success');
      setEditing(null);
    } catch (e) { toast(friendlyError(e, 'Modification impossible.'), 'error'); }
  }

  async function send() {
    if (!body.trim() || create.isPending) return;
    try {
      const c = await create.mutateAsync({ body, parentId: replyTo?.id ?? null });
      setBody('');
      setReplyTo(null);
      toast(c?.status === 'pending_review' ? 'Message envoyé en relecture avant d’être visible.' : replyTo ? 'Réponse publiée.' : 'Commentaire publié.', c?.status === 'pending_review' ? 'info' : 'success');
    } catch (e) {
      toast(friendlyError(e, 'Publication impossible. Réessayez dans un instant.'), 'error');
    }
  }

  async function removeComment(c: FeedComment) {
    if (!(await confirm('Supprimer votre commentaire ?', c.parent_id ? 'Cette action est définitive.' : 'Les réponses à ce commentaire seront aussi supprimées.', 'Supprimer'))) return;
    del.mutate(c.id, {
      onSuccess: () => toast('Commentaire supprimé.'),
      onError: (e) => toast(friendlyError(e, 'Suppression impossible. Réessayez dans un instant.'), 'error'),
    });
  }

  const backToCommunity = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/community'));
  if (isLoading) return <Screen back><Skeleton kind="detail" rows={5} /></Screen>;
  if (postQ.isError && !postQ.data) {
    return <Screen back title="Publication"><ErrorView error={postQ.error} onRetry={() => void postQ.refetch()} title="Impossible d’afficher cette publication" /></Screen>;
  }
  if (!post) {
    return (
      <Screen back title="Publication indisponible">
        <EmptyState
          icon="message-square"
          title="Publication introuvable"
          body="Elle a peut-être été supprimée ou masquée par la modération."
          action={{ label: 'Retour à la communauté', icon: 'arrow-left', onPress: backToCommunity }}
        />
      </Screen>
    );
  }

  const action = (label: string, onPress: () => void, primary = false) => (
    <Tappable onPress={onPress} hitSlop={4} accessibilityRole="button" accessibilityLabel={label} style={{ minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, justifyContent: 'center' }}>
      <Text variant="caption" color={primary ? t.colors.primary : undefined} muted={!primary}>{label}</Text>
    </Tappable>
  );

  const renderComment = (c: FeedComment, reply: boolean, index: number) => {
    const first = index === 0;
    const last = index === rows.length - 1;
    const focused = c.id === focusComment;
    const who = c.anonymous ? (c.is_mine ? 'Anonyme (vous)' : 'Auteur·rice (anonyme)') : c.pseudonym ?? 'Membre';
    const openProfile = () => { if (c.author_handle) router.push(`/community/u/${c.author_handle}` as never); };
    return (
      <View
        style={{
          backgroundColor: focused ? t.colors.primary + '14' : t.colors.surface, borderColor: t.colors.border, borderLeftWidth: 1, borderRightWidth: 1,
          borderTopWidth: first ? 1 : 0, borderBottomWidth: last ? 1 : 0,
          borderTopLeftRadius: first ? radius.lg : 0, borderTopRightRadius: first ? radius.lg : 0,
          borderBottomLeftRadius: last ? radius.lg : 0, borderBottomRightRadius: last ? radius.lg : 0,
          paddingHorizontal: spacing.md, paddingTop: first ? spacing.sm : 0, paddingBottom: last ? spacing.sm : 0,
        }}
      >
        <View testID={focused ? 'comment-focused' : `comment-${c.id}`} style={{ marginLeft: reply ? spacing.lg : 0, gap: 4, paddingVertical: spacing.xs, borderLeftWidth: reply ? 2 : 0, borderLeftColor: t.colors.border, paddingLeft: reply ? spacing.sm : 0 }}>
          <Row style={{ alignItems: 'center' }} gap={8}>
            <Tappable accessibilityRole={c.author_handle ? 'button' : 'image'} accessibilityLabel={c.author_handle ? `Voir le profil de ${who}` : who} disabled={!c.author_handle} onPress={openProfile}>
              <Avatar path={c.avatar_path} preset={c.avatar_preset} anonymous={c.anonymous} size={30} />
            </Tappable>
            <View style={{ flex: 1 }}>
              <Text variant="small" weight="bold" numberOfLines={1}>{who}{c.is_op && !c.anonymous ? ' · auteur·rice' : ''}</Text>
              <Text variant="caption" muted numberOfLines={1}>{[c.author_handle ? `@${c.author_handle}` : null, timeAgo(c.created_at), c.edited_at ? 'modifié' : null, c.status !== 'visible' ? 'en relecture' : null].filter(Boolean).join(' · ')}</Text>
            </View>
          </Row>
          <Text variant="small">{c.body}</Text>
          <Row gap={spacing.md}>
            {me && c.status === 'visible' ? action('Répondre', () => { setReplyTo(c); inputRef.current?.focus(); }, true) : null}
            {c.is_mine ? action('Modifier', () => { setEditing(c); setEditBody(c.body); }) : null}
            {c.is_mine ? action('Supprimer', () => removeComment(c)) : action('Signaler', () => setReportComment(c.id))}
          </Row>
        </View>
      </View>
    );
  };

  const canComment = post.status === 'visible' && !!me;
  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
      <PostCard post={post} full forum={forums?.find((f) => f.id === post.forum_id) ?? null} onCommentPress={() => inputRef.current?.focus()} />
      <Text variant="heading">{post.comment_count} commentaire{post.comment_count > 1 ? 's' : ''}</Text>
      {commentsLoading ? <Skeleton kind="list" rows={2} /> : commentsError ? (
        <ErrorView error={commentsQ.error} onRetry={() => void commentsQ.refetch()} title="Impossible d’afficher les commentaires" />
      ) : null}
    </View>
  );

  const footer = (
    <View style={{ gap: spacing.md, marginTop: spacing.md }}>
      {post.status !== 'visible' ? (
        <Banner tone="info">{'Cette publication est en attente de modération : les commentaires sont fermés pour le moment.'}</Banner>
      ) : me ? (
        <Card tone="soft">
          {replyTo && (
            <Row style={{ marginBottom: spacing.xs }}>
              <Icon name="corner-down-right" size={14} />
              <Text variant="small" style={{ flex: 1 }}>Réponse à {replyTo.pseudonym ?? 'ce commentaire'}</Text>
              <Tappable onPress={() => setReplyTo(null)} hitSlop={4} accessibilityRole="button" accessibilityLabel="Annuler la réponse" style={{ minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={16} /></Tappable>
            </Row>
          )}
          <Field ref={inputRef} label={replyTo ? 'Votre réponse' : 'Votre commentaire'} value={body} onChangeText={setBody} multiline maxLength={4000} testID="comment-input" />
          <Button label={replyTo ? 'Répondre' : 'Publier'} style={{ marginTop: spacing.sm }} loading={create.isPending} disabled={!body.trim()} onPress={send} testID="comment-send" />
          <Text variant="caption" muted style={{ marginTop: 4 }}>{post.anonymous && post.is_mine ? 'Vos réponses à votre publication anonyme restent anonymes.' : 'Bienveillance avant tout : partagez votre expérience, pas un diagnostic.'}</Text>
        </Card>
      ) : (
        <Banner tone="info" action={<Button label="Choisir un pseudonyme" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => router.push('/community/profile')} />}>
          {'Choisissez un pseudonyme pour commenter et répondre.'}
        </Banner>
      )}
    </View>
  );

  return (
    <Screen back scroll={false} padded={false}>
      <VirtualList
        ref={listRef}
        onScrollToIndexFailed={(info: { index: number; averageItemLength: number }) => { listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true }); }}
        data={commentsLoading || commentsError ? [] : rows}
        keyExtractor={(r) => r.c.id}
        renderItem={({ item, index }) => renderComment(item.c, item.reply, index)}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={commentsLoading || commentsError ? null : (
          <EmptyState
            icon="message-circle"
            title="Soyez la première personne à répondre."
            action={canComment
              ? { label: 'Écrire le premier commentaire', icon: 'edit-3', onPress: () => inputRef.current?.focus() }
              : post.status === 'visible'
                ? { label: 'Choisir un pseudonyme', icon: 'user', onPress: () => router.push('/community/profile') }
                : undefined}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl }}
        showsVerticalScrollIndicator={false}
      />
      <ReportSheet visible={!!reportComment} onClose={() => setReportComment(null)} commentId={reportComment ?? undefined} />
      <Sheet visible={!!editing} onClose={() => setEditing(null)} title="Modifier mon commentaire">
        <Field label="Commentaire" value={editBody} onChangeText={setEditBody} multiline maxLength={4000} testID="comment-edit-input" />
        <Button label="Enregistrer" loading={updateComment.isPending} disabled={!editBody.trim()} onPress={saveEdit} testID="comment-edit-save" />
      </Sheet>
    </Screen>
  );
}
