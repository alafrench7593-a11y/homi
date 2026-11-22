/**
 * Conversation privée entre deux membres : bulles, heure, état de chaque envoi (envoi…, envoyé, échec avec
 * « Renvoyer »), demande de message à accepter ou refuser, signaler ou bloquer depuis la conversation.
 * Texte seulement (pas de photo dans cette première version), 2 000 caractères au plus.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { glassEdge } from '@/components/glass/GlassRim';
import { FlatList, Keyboard, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { useKeyboardVisible } from '@/components/keyboard';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Chip, Icon, IconButton, Row, Text } from '@/components/ui';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { ReportSheet } from '@/features/community';
import { Bubble, DaySeparator } from '@/features/communityMessages';
import { useBlockMember } from '@/lib/data/hooks-community';
import { useConversation, useConversationMessages, useDmRealtime, useMarkRead, useRespondRequest, useSendMessage } from '@/lib/data/hooks-messages';
import { friendlyError } from '@/lib/data/hooks-settings';
import { DM_MAX_LENGTH, draftError, threadRows, type DmRow } from '@/lib/domain/messages';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function Conversation() {
  const t = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const { id: raw } = useLocalSearchParams<{ id: string }>();
  const id = typeof raw === 'string' ? raw : null;
  const convQ = useConversation(id);
  const conv = convQ.data;
  const msgQ = useConversationMessages(conv ? id : null);
  const { outgoing, send, retry, discard } = useSendMessage(id);
  const respond = useRespondRequest();
  useDmRealtime();
  const block = useBlockMember();
  const [text, setText] = useState('');
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const list = useRef<FlatList<DmRow>>(null);

  const rows = useMemo(() => threadRows(msgQ.data ?? [], outgoing), [msgQ.data, outgoing]);
  const lastId = msgQ.data?.length ? msgQ.data[msgQ.data.length - 1].id : null;
  useMarkRead(conv && conv.status !== 'request_received' ? id : null, conv?.unread ?? 0, lastId);
  useEffect(() => {
    const timer = setTimeout(() => list.current?.scrollToEnd({ animated: false }), 60);
    return () => clearTimeout(timer);
  }, [rows.length, keyboardVisible]);

  const title = conv ? conv.pseudonym : tr('dm.conversation');
  if (convQ.isLoading && !conv) return <Screen back title={title}><Skeleton kind="detail" rows={4} /></Screen>;
  if (convQ.isError && !conv) return <Screen back title={title}><ErrorView error={convQ.error} onRetry={() => void convQ.refetch()} /></Screen>;
  if (!conv) {
    return (
      <Screen back title={title}>
        <EmptyState icon="lock" title={tr('dm.unavailableTitle')} body={tr('dm.unavailableBody')}
          action={{ label: tr('dm.backToInbox'), icon: 'mail', onPress: () => router.replace('/community/messages' as never) }} />
      </Screen>
    );
  }

  const error = draftError(text);
  const canWrite = conv.can_send && conv.status !== 'request_received';
  const near = text.length > DM_MAX_LENGTH - 200;

  function submit() {
    if (error || !canWrite) return;
    if (send(text)) setText('');
  }
  async function answer(accept: boolean) {
    if (!id) return;
    if (!accept && !(await confirm(tr('dm.request.declineTitle'), tr('dm.request.declineBody'), tr('dm.request.decline')))) return;
    try {
      await respond.mutateAsync({ id, accept });
      if (accept) toast(tr('dm.request.accepted'));
      else { toast(tr('dm.request.declined')); router.replace({ pathname: '/community/messages', params: { tab: 'requests' } } as never); }
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function doBlock() {
    setMenu(false);
    if (!conv) return;
    if (!(await confirm(tr('cm2.member.blockTitle', { handle: conv.handle }), tr('dm.blockBody'), tr('cm2.member.block')))) return;
    try { await block.mutateAsync(conv.handle); toast(tr('cm2.member.blocked')); router.replace('/community/messages' as never); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={conv.pseudonym} subtitle={`@${conv.handle}`} scroll={false}
      right={<IconButton icon="more-vertical" label={tr('dm.menu')} onPress={() => { Keyboard.dismiss(); setMenu(true); }} testID="dm-menu" />}>
      <FlatList
        ref={list}
        data={rows}
        testID="dm-thread"
        keyExtractor={(r) => r.key}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, paddingBottom: spacing.md, flexGrow: 1 }}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={(
          <View style={{ gap: spacing.sm, marginBottom: spacing.sm }}>
            <Row gap={6} style={{ alignItems: 'flex-start' }}>
              <Icon name="shield" size={14} color={t.colors.textMuted} />
              <Text variant="caption" muted style={{ flex: 1 }}>{tr('dm.safetyNote')}</Text>
            </Row>
            {msgQ.isLoading && !msgQ.data ? <Skeleton kind="list" rows={3} /> : null}
            {msgQ.isError && !msgQ.data ? <ErrorView error={msgQ.error} onRetry={() => void msgQ.refetch()} /> : null}
            {!rows.length && msgQ.data ? <Text variant="small" muted center testID="dm-empty">{conv.status === 'open' ? tr('dm.emptyOpen', { name: conv.pseudonym }) : tr('dm.emptyRequest', { name: conv.pseudonym })}</Text> : null}
          </View>
        )}
        renderItem={({ item }) => (item.kind === 'day'
          ? <DaySeparator date={item.date} />
          : <Bubble message={item.message} outgoing={item.outgoing} showTime={item.showTime} onRetry={() => retry(item.message.client_id)} onDiscard={() => discard(item.message.client_id)} />)}
      />

      <View style={{ paddingBottom: keyboardVisible ? spacing.sm : insets.bottom + spacing.sm, gap: 6 }}>
        {conv.status === 'request_received' ? (
          <View style={{ gap: spacing.sm }} testID="dm-request">
            <Banner tone="info" title={tr('dm.request.title', { name: conv.pseudonym })}>{tr('dm.request.body')}</Banner>
            <Row gap={spacing.sm}>
              <View style={{ flex: 1 }}><Button label={tr('dm.request.decline')} variant="secondary" full loading={respond.isPending} onPress={() => void answer(false)} testID="dm-decline" /></View>
              <View style={{ flex: 1 }}><Button label={tr('dm.request.accept')} full loading={respond.isPending} onPress={() => void answer(true)} testID="dm-accept" /></View>
            </Row>
          </View>
        ) : (
          <>
            {conv.status === 'request_sent' ? (
              <Text variant="caption" muted center testID="dm-request-sent">
                {conv.can_send ? tr('dm.request.sentLeft', { count: conv.request_left ?? 0 }) : tr('dm.request.sentWaiting')}
              </Text>
            ) : null}
            {near ? <Text variant="caption" color={error === 'too_long' ? t.colors.danger : t.colors.textMuted} center>{tr('dm.chars', { n: text.length, max: DM_MAX_LENGTH })}</Text> : null}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, backgroundColor: t.colors.surface, borderRadius: radius.lg, ...glassEdge(t), padding: 6, opacity: canWrite ? 1 : 0.6 }}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={canWrite ? tr('dm.placeholder') : tr('dm.placeholderClosed')}
                placeholderTextColor={t.colors.textMuted}
                accessibilityLabel={tr('dm.inputA11y', { name: conv.pseudonym })}
                multiline
                textAlignVertical="top"
                editable={canWrite}
                maxLength={DM_MAX_LENGTH}
                testID="dm-input"
                style={{ flex: 1, minHeight: 44, maxHeight: 140, color: t.colors.text, fontFamily: fonts.body, fontSize: 16, paddingHorizontal: spacing.sm, paddingTop: 10 }}
              />
              <Tappable accessibilityRole="button" accessibilityLabel={tr('dm.send')} disabled={!!error || !canWrite} onPress={submit} testID="dm-send"
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.tokens.action.fill, alignItems: 'center', justifyContent: 'center', opacity: error || !canWrite ? 0.4 : 1 }}>
                <Icon name="arrow-up" color={t.tokens.action.text} />
              </Tappable>
            </View>
          </>
        )}
      </View>

      <Sheet visible={menu} onClose={() => setMenu(false)} title={conv.pseudonym}>
        <Tappable accessibilityRole="button" onPress={() => { setMenu(false); router.push(`/community/u/${conv.handle}` as never); }} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }} testID="dm-menu-profile">
          <Text>{tr('dm.menuProfile')}</Text>
        </Tappable>
        <Tappable accessibilityRole="button" onPress={() => { setMenu(false); setReporting(true); }} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }} testID="dm-menu-report">
          <Text>{tr('dm.menuReport')}</Text>
        </Tappable>
        <Tappable accessibilityRole="button" onPress={() => void doBlock()} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }} testID="dm-menu-block">
          <Text color={t.colors.danger}>{tr('dm.menuBlock')}</Text>
        </Tappable>
        <Chip label={tr('cm1.feed.readRules')} icon="book-open" onPress={() => { setMenu(false); router.push('/community/rules' as never); }} />
      </Sheet>
      <ReportSheet visible={reporting} onClose={() => setReporting(false)} handle={conv.handle} conversationId={conv.id} onBlocked={() => router.replace('/community/messages' as never)} />
    </Screen>
  );
}
