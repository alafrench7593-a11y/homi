/** Publication, commentaires et réponses en fil (un niveau). Une notification ouvre directement le commentaire visé. */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { type FlatList, Keyboard, type TextInput, View } from 'react-native';
import { whenKeyboardShown } from '@/components/keyboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Banner, Button, Card, Chip, Field, Icon, Row, Text } from '@/components/ui';
import { ScrollView } from 'react-native';
import { AiSummaryCard, MentionText, PremiumBadge } from '@/features/communitySocial';
import { useGroup, useNoteTopicView, useSearchMembers } from '@/lib/data/hooks-social';
import { completeMention, mentionQuery } from '@/lib/domain/communitySocial';
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
import { t as tr } from '@/i18n';

export default function PostScreen() {
  const t = useTheme();
  const toast = useToast();
  const { id, comment: focusComment } = useLocalSearchParams<{ id: string; comment?: string }>();
  const insets = useSafeAreaInsets();
  const postQ = usePost(id);
  const { data: post } = postQ;
  const { ready: authReady } = useAuth(); // session pas encore restaurée : chargement, pas « introuvable »
  const isLoading = (postQ.isLoading && !postQ.data) || (!authReady && !post);
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
  // Sujet consulté : sert uniquement à classer « Pour vous » (visible et effaçable dans l’éditeur du profil communautaire)
  useNoteTopicView(id);
  const groupQ = useGroup(postQ.data?.group_id ?? null);
  const create = useCreateComment(id);
  const del = useDeleteComment();
  const [body, setBody] = useState('');
  const mq = mentionQuery(body);
  const mentionSearch = useSearchMembers(mq && mq.length >= 2 ? mq : '');
  const mentionHits = mq ? (mentionSearch.data ?? []).slice(0, 6) : [];
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
      toast(r?.status === 'pending_review' ? tr('cm2.post.editedReview') : tr('cm2.post.edited'), r?.status === 'pending_review' ? 'info' : 'success');
      setEditing(null);
    } catch (e) { toast(friendlyError(e, tr('cm2.post.editFailed')), 'error'); }
  }

  async function send() {
    if (!body.trim() || create.isPending) return;
    Keyboard.dismiss();
    try {
      const c = await create.mutateAsync({ body, parentId: replyTo?.id ?? null });
      setBody('');
      setReplyTo(null);
      toast(c?.status === 'pending_review' ? tr('cm2.post.sentForReview') : replyTo ? tr('cm2.post.replyPublished') : tr('cm2.post.commentPublished'), c?.status === 'pending_review' ? 'info' : 'success');
    } catch (e) {
      toast(friendlyError(e, tr('cm2.publishFailed')), 'error');
    }
  }

  async function removeComment(c: FeedComment) {
    if (!(await confirm(tr('cm2.post.deleteTitle'), c.parent_id ? tr('cm2.post.deleteFinal') : tr('cm2.post.deleteWithReplies'), tr('cm2.post.delete')))) return;
    del.mutate(c.id, {
      onSuccess: () => toast(tr('cm2.post.deleted')),
      onError: (e) => toast(friendlyError(e, tr('cm2.post.deleteFailed')), 'error'),
    });
  }

  const backToCommunity = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/community'));
  if (isLoading) return <Screen back><Skeleton kind="detail" rows={5} /></Screen>;
  if (postQ.isError && !postQ.data) {
    return <Screen back title={tr('cm2.post.title')}><ErrorView error={postQ.error} onRetry={() => void postQ.refetch()} title={tr('cm2.post.loadError')} /></Screen>;
  }
  if (!post) {
    return (
      <Screen back title={tr('cm2.post.unavailable')}>
        <EmptyState
          icon="message-square"
          title={tr('cm2.post.notFound')}
          body={tr('cm2.post.notFoundBody')}
          action={{ label: tr('cm2.post.backToCommunity'), icon: 'arrow-left', onPress: backToCommunity }}
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
    const who = c.anonymous ? (c.is_mine ? tr('cm2.post.anonYou') : tr('cm2.post.anonAuthor')) : c.pseudonym ?? tr('cm2.post.member');
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
            <Tappable accessibilityRole={c.author_handle ? 'button' : 'image'} accessibilityLabel={c.author_handle ? tr('cm2.post.viewProfile', { name: who }) : who} disabled={!c.author_handle} onPress={openProfile}>
              <Avatar path={c.avatar_path} preset={c.avatar_preset} anonymous={c.anonymous} size={30} />
            </Tappable>
            <View style={{ flex: 1 }}>
              <Row gap={6} style={{ flexWrap: 'nowrap' }}>
                <Text variant="small" weight="bold" style={{ flexShrink: 1 }}>{who}{c.is_op && !c.anonymous ? tr('cm2.post.opSuffix') : ''}</Text>
                {c.author_badge ? <PremiumBadge /> : null}
              </Row>
              <Text variant="caption" muted>{[c.author_handle ? `@${c.author_handle}` : null, timeAgo(c.created_at), c.edited_at ? tr('cm2.post.editedTag') : null, c.status !== 'visible' ? tr('cm2.post.inReview') : null].filter(Boolean).join(' · ')}</Text>
            </View>
          </Row>
          <MentionText text={c.body} style={{ fontSize: 14 }} />
          <Row gap={spacing.md}>
            {me && c.status === 'visible' ? action(tr('cm2.post.reply'), () => { setReplyTo(c); inputRef.current?.focus(); }, true) : null}
            {c.is_mine ? action(tr('cm2.post.edit'), () => { setEditing(c); setEditBody(c.body); }) : null}
            {c.is_mine ? action(tr('cm2.post.delete'), () => removeComment(c)) : action(tr('cm2.post.report'), () => setReportComment(c.id))}
          </Row>
        </View>
      </View>
    );
  };

  const canComment = post.status === 'visible' && !!me;
  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
      <PostCard post={post} full forum={forums?.find((f) => f.id === post.forum_id) ?? null} onCommentPress={() => inputRef.current?.focus()}
        canPin={!!groupQ.data?.is_owner && groupQ.data.kind === 'private'} />
      <AiSummaryCard postId={post.id} commentCount={post.comment_count} />
      <Text variant="heading">{tr('cm2.post.commentCount', { count: String(commentsQ.data ? rows.length : post.comment_count) })}</Text>
      {commentsLoading ? <Skeleton kind="list" rows={2} /> : commentsError ? (
        <ErrorView error={commentsQ.error} onRetry={() => void commentsQ.refetch()} title={tr('cm2.post.commentsError')} />
      ) : null}
    </View>
  );

  const footer = (
    <View style={{ gap: spacing.md, marginTop: spacing.md }}>
      {post.status !== 'visible' ? (
        <Banner tone="info">{tr('cm2.post.closed')}</Banner>
      ) : me ? (
        <Card tone="soft">
          {replyTo && (
            <Row style={{ marginBottom: spacing.xs }}>
              <Icon name="corner-down-right" size={14} />
              <Text variant="small" style={{ flex: 1 }}>{tr('cm2.post.replyTo', { name: replyTo.pseudonym ?? tr('cm2.post.thisComment') })}</Text>
              <Tappable onPress={() => setReplyTo(null)} hitSlop={4} accessibilityRole="button" accessibilityLabel={tr('cm2.post.cancelReply')} style={{ minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={16} /></Tappable>
            </Row>
          )}
          <Field ref={inputRef} label={replyTo ? tr('cm2.post.yourReply') : tr('cm2.post.yourComment')} value={body} onChangeText={setBody} multiline maxLength={4000} testID="comment-input"
            // Zone de réponse en bas de la liste : elle remonte au-dessus du clavier
            onFocus={() => { whenKeyboardShown(() => listRef.current?.scrollToEnd({ animated: true })); }} />
          {mentionHits.length ? (
            <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingTop: spacing.xs }} testID="comment-mentions">
              {mentionHits.map((m) => <Chip key={m.handle} label={`@${m.handle}`} icon="at-sign" onPress={() => setBody((b) => completeMention(b, m.handle))} />)}
            </ScrollView>
          ) : null}
          <Button label={replyTo ? tr('cm2.post.reply') : tr('cm2.publish')} style={{ marginTop: spacing.sm }} loading={create.isPending} disabled={!body.trim()} onPress={send} testID="comment-send" />
          <Text variant="caption" muted style={{ marginTop: 4 }}>{post.anonymous && post.is_mine ? tr('cm2.post.anonReplies') : tr('cm2.post.kindness')}</Text>
        </Card>
      ) : (
        <Banner tone="info" action={<Button label={tr('cm2.chooseHandle')} size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => router.push('/community/profile')} />}>
          {tr('cm2.post.needHandle')}
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
            title={tr('cm2.post.beFirst')}
            action={canComment
              ? { label: tr('cm2.post.writeFirst'), icon: 'edit-3', onPress: () => inputRef.current?.focus() }
              : post.status === 'visible'
                ? { label: tr('cm2.chooseHandle'), icon: 'user', onPress: () => router.push('/community/profile') }
                : undefined}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl }}
        showsVerticalScrollIndicator={false}
      />
      <ReportSheet visible={!!reportComment} onClose={() => setReportComment(null)} commentId={reportComment ?? undefined} />
      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={tr('cm2.post.editSheet')}>
        <Field label={tr('cm2.post.commentField')} value={editBody} onChangeText={setEditBody} multiline maxLength={4000} testID="comment-edit-input" />
        <Button label={tr('cm2.post.save')} loading={updateComment.isPending} disabled={!editBody.trim()} onPress={saveEdit} testID="comment-edit-save" />
      </Sheet>
    </Screen>
  );
}
