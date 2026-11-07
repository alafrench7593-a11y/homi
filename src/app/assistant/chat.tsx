/** Conversation avec l'assistant (réponses structurées, diffusion progressive, orientation urgente). */
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Markdown } from '@/components/Markdown';
import { EmergencyList } from '@/components/Family';
import { AssistantIntro, StructuredAnswerView, UrgentCard } from '@/components/Assistant';
import { confirm, useToast } from '@/components/Overlays';
import { Button, Card, Chip, haptic, Icon, IconButton, Row, Text, Toggle } from '@/components/ui';
import {
  MAX_QUESTION_LENGTH, describeContext, parseStructuredAnswer, useAssistantContext, useAssistantQuota,
  type AskResponse, type StructuredAnswer, type UrgentContact,
} from '@/features/assistant';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { backend, BackendError, eq, hasRealBackend, isDemo } from '@/lib/backend';
import { useUserId } from '@/lib/auth';
import { useChild, useConsents, useConversations, useInvalidate, useMessages, usePrivacy, useSetConsent } from '@/lib/data/hooks';
import { SLEEP_QUESTIONS, useSleepAssistantContext } from '@/features/sleepAssistant';
import { friendlyError, useUpdatePrivacy } from '@/lib/data/hooks-settings';
import type { AssistantMessage } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { t as tr } from '@/i18n';

interface LocalMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Texte brut reçu pendant la diffusion (affiché au fur et à mesure). */
  raw?: string;
  streaming?: boolean;
  structured?: StructuredAnswer | null;
  sources?: AskResponse['sources'];
  safety?: AskResponse['safety'];
  urgent?: UrgentContact[];
  devMode?: string;
  serverId?: string | null;
  feedback?: -1 | 1 | null;
  saved?: boolean;
  error?: boolean;
  /** Question d'origine (pour « Réessayer ») */
  question?: string;
  /** Réponse arrêtée par la personne */
  stopped?: boolean;
}

const fromHistory = (m: AssistantMessage): LocalMsg => ({
  id: m.id, serverId: m.role === 'assistant' ? m.id : null, role: m.role, content: m.content, structured: m.structured ?? null,
  sources: m.sources, safety: m.safety_level ?? 'none', feedback: m.feedback, saved: m.saved,
});

export default function Chat() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; q?: string; topic?: string; child?: string }>();
  // « M'aider pour les nuits » : conversation sommeil sur l'enfant choisi
  const sleepChild = useChild(params.topic === 'sleep' ? params.child : null);
  const sleepTopic = params.topic === 'sleep' && !!sleepChild;
  const sleepCtx = useSleepAssistantContext(sleepTopic ? sleepChild : null);
  const [conversationId, setConversationId] = useState<string | null>(params.id ?? null);
  const historyQ = useMessages(params.id);
  const { data: history } = historyQ;
  const conversationsQ = useConversations();
  const { data: conversations } = conversationsQ;
  const [busyAction, setBusyAction] = useState(false);
  const [msgs, setMsgs] = useState<LocalMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // Fermer la conversation pendant une réponse l'arrête (pas de quota consommé pour un écran fermé)
  useEffect(() => () => abortRef.current?.abort(), []);
  const privacy = usePrivacy();
  const updatePrivacy = useUpdatePrivacy();
  const historyOn = privacy.data?.ai_history_enabled === true;
  const [premiumNeeded, setPremiumNeeded] = useState<string | null>(null);
  // Sommeil : les données de sommeil de l'enfant sont proposées d'emblée (visibles et désactivables), sinon rien
  const [useContext, setUseContext] = useState(params.topic === 'sleep' && !params.id);
  const [showContext, setShowContext] = useState(false);
  const generalContext = useAssistantContext();
  // Seulement ce qui est nécessaire : pour le sommeil, l'âge et le résumé chiffré du sommeil de cet enfant
  const context = params.topic === 'sleep' ? (sleepCtx ?? {}) : generalContext;
  const { data: quotaStatus } = useAssistantQuota();
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  const { latest } = useConsents();
  const setConsent = useSetConsent();
  const scroll = useRef<FlatList<LocalMsg>>(null);
  const askedInitial = useRef(false);
  const consented = latest.get('ai_assistant') === true;

  const limit = quota?.limit ?? quotaStatus?.quota ?? null;
  const used = quota?.used ?? quotaStatus?.used ?? null;
  const remaining = limit != null && used != null ? Math.max(0, limit - used) : null;

  const historyLoaded = useRef(false);
  useEffect(() => {
    if (history && !historyLoaded.current && !msgs.length) {
      historyLoaded.current = true;
      setMsgs(history.map(fromHistory));
    }
  }, [history]); // eslint-disable-line react-hooks/exhaustive-deps

  // Choix du contexte mémorisé pour une conversation existante
  const conv = conversations?.find((c) => c.id === conversationId);
  const convLoaded = useRef(false);
  useEffect(() => {
    if (conv && !convLoaded.current) {
      convLoaded.current = true;
      setUseContext(conv.context_enabled === true);
    }
  }, [conv]);

  useEffect(() => {
    if (params.q && !askedInitial.current && consented && (params.topic !== 'sleep' || !!sleepCtx)) {
      askedInitial.current = true;
      send(params.q);
    }
  }, [params.q, consented, sleepCtx]); // eslint-disable-line react-hooks/exhaustive-deps

  async function changeContext(v: boolean) {
    setUseContext(v);
    haptic('selection');
    if (conversationId) {
      try {
        await backend.update('assistant_conversations', { context_enabled: v }, [eq('id', conversationId)]);
        inv('assistant_conversations');
      } catch {
        // Le choix est de toute façon transmis avec la prochaine question : on le signale sans bloquer
        toast(tr('u8.chat.prefSaveFail'), 'info');
      }
    }
  }

  const patchMsg = (id: string, patch: Partial<LocalMsg> | ((m: LocalMsg) => Partial<LocalMsg>)) =>
    setMsgs((all) => all.map((x) => (x.id === id ? { ...x, ...(typeof patch === 'function' ? patch(x) : patch) } : x)));

  async function send(text?: string) {
    const message = (text ?? input).trim().slice(0, MAX_QUESTION_LENGTH);
    if (message.length < 2 || sending) return;
    setInput('');
    setPremiumNeeded(null);
    const now = Date.now();
    const answerId = `a${now}`;
    setMsgs((m) => [...m, { id: `u${now}`, role: 'user', content: message }, { id: answerId, role: 'assistant', content: '', raw: '', streaming: true, question: message }]);
    setSending(true);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await backend.invokeStream<AskResponse>(
        'assistant',
        {
          conversation_id: conversationId, message, use_context: useContext, context: useContext ? context : undefined,
          // Historique non conservé : les derniers échanges accompagnent la question (gardés seulement pour cette réponse)
          recent_turns: conversationId ? undefined : msgs.filter((x) => !x.streaming && !x.error && !x.stopped && (x.role === 'user' || (x.safety ?? 'none') === 'none')).slice(-12).map((x) => ({ role: x.role, content: x.content })),
        },
        (event, data) => {
          const d = data as { text?: string; conversation_id?: string | null; quota?: { used: number; limit: number } };
          if (event === 'delta' && d.text) patchMsg(answerId, (m) => ({ raw: (m.raw ?? '') + d.text }));
          if (event === 'meta') {
            if (d.conversation_id) setConversationId(d.conversation_id);
            if (d.quota) setQuota(d.quota);
          }
        },
        { signal: ac.signal, timeoutMs: 90_000 },
      );
      if (res.conversation_id) setConversationId(res.conversation_id);
      if (res.quota) setQuota(res.quota);
      patchMsg(answerId, {
        streaming: false, raw: undefined, serverId: res.message_id ?? null, content: res.answer, structured: res.structured ?? null,
        sources: res.sources, safety: res.safety, urgent: res.urgent_contacts, devMode: res.dev_mode ?? (res.demo ? tr('u8.chat.demoMode') : undefined),
      });
      if (res.safety !== 'none') haptic('warning');
      if (res.replaced) toast(tr('u8.chat.replaced'), 'info');
      inv('assistant_conversations', 'assistant_usage');
    } catch (e) {
      if (e instanceof BackendError && e.isPremiumRequired) {
        setPremiumNeeded(e.message);
        setMsgs((m) => m.filter((x) => x.id !== answerId));
        inv('assistant_usage');
      } else if (e instanceof BackendError && e.code === 'aborted') {
        patchMsg(answerId, { streaming: false, raw: undefined, stopped: true, content: tr('u8.chat.stopped') });
      } else {
        // Démonstration : limite du jour atteinte côté serveur → le compteur affiché passe à 0
        if (e instanceof BackendError && e.code === 'quota_reached') setQuota((q) => (q ? { used: q.limit, limit: q.limit } : q));
        patchMsg(answerId, { streaming: false, raw: undefined, error: true, content: friendlyError(e, tr('u8.chat.unavailable')) });
      }
    } finally {
      abortRef.current = null;
      setSending(false);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 120);
    }
  }

  /** Réessayer : la question est renvoyée, la réponse en erreur ou arrêtée est retirée. */
  function retry(m: LocalMsg) {
    if (!m.question || sending) return;
    setMsgs((all) => {
      const i = all.findIndex((x) => x.id === m.id);
      return all.filter((_, j) => j !== i && j !== i - 1);
    });
    void send(m.question);
  }

  async function feedback(m: LocalMsg, value: -1 | 1) {
    if (!m.serverId || busyAction) return;
    setBusyAction(true);
    try {
      if (m.feedback === value) {
        await backend.remove('assistant_feedback', [eq('message_id', m.serverId), eq('user_id', userId)]);
        patchMsg(m.id, { feedback: null });
        return;
      }
      await backend.insert('assistant_feedback', { user_id: userId, message_id: m.serverId, value }, { onConflict: 'user_id,message_id' });
      patchMsg(m.id, { feedback: value });
      inv('assistant_messages');
      toast(tr('u8.chat.thanks'), 'info');
    } catch (e) {
      toast(friendlyError(e, tr('u8.chat.feedbackFail')), 'error');
    } finally {
      setBusyAction(false);
    }
  }

  const saveAccess = usePremiumAccess('assistant_saved');
  async function toggleSave(m: LocalMsg) {
    if (!m.serverId) return toast(tr('u8.chat.enableHistory'), 'info');
    if (busyAction) return;
    // Enregistrer une nouvelle réponse : Premium (retirer ou relire une réponse déjà enregistrée reste gratuit)
    if (!m.saved && !saveAccess.require(<Text variant="small" numberOfLines={3}>{tr('u8.chat.savePreview', { text: `${m.content.slice(0, 160)}${m.content.length > 160 ? '…' : ''}` })}</Text>)) return;
    setBusyAction(true);
    try {
      await backend.update('assistant_messages', { saved: !m.saved }, [eq('id', m.serverId)]);
      patchMsg(m.id, (x) => ({ saved: !x.saved }));
      inv('assistant_messages');
      toast(m.saved ? tr('u8.chat.unsaved') : tr('u8.chat.savedFav'));
    } catch (e) {
      toast(friendlyError(e, tr('u8.chat.favFail')), 'error');
    } finally {
      setBusyAction(false);
    }
  }

  async function deleteConversation() {
    if (!conversationId) return router.back();
    if (busyAction) return;
    if (!(await confirm(tr('u8.chat.delQ'), tr('u8.chat.delBody'), tr('u8.chat.delete')))) return;
    setBusyAction(true);
    try {
      await backend.remove('assistant_conversations', [eq('id', conversationId)]);
      inv('assistant_conversations', 'assistant_messages');
      toast(tr('u8.chat.deleted'));
      router.back();
    } catch (e) {
      toast(friendlyError(e, tr('u8.chat.delFail')), 'error');
    } finally {
      setBusyAction(false);
    }
  }

  function newConversation() {
    setConversationId(null);
    setMsgs([]);
    setUseContext(false);
    setPremiumNeeded(null);
    convLoaded.current = true;
    historyLoaded.current = true;
    router.setParams({ id: undefined, q: undefined });
  }

  if (!consented) {
    return (
      <Screen back title={sleepTopic ? tr('u8.chat.titleSleep') : tr('u8.chat.title')}>
        <AssistantIntro />
        <Card tone="lavender">
          <Text variant="heading">{tr('u8.chat.before')}</Text>
          <Text style={{ marginTop: spacing.xs }}>
            {tr('u8.chat.consent1')}
          </Text>
          <Text style={{ marginTop: spacing.xs }}>{tr('u8.chat.consent2')}</Text>
          <Row style={{ marginTop: spacing.md, justifyContent: 'space-between' }}>
            <Text weight="medium" style={{ flex: 1 }}>{tr('u8.chat.accept')}</Text>
            <Toggle
              label={tr('u8.chat.acceptA11y')}
              value={setConsent.isPending}
              onChange={() => {
                if (setConsent.isPending) return;
                setConsent.mutate({ purpose: 'ai_assistant', granted: true }, { onError: (e) => toast(friendlyError(e, tr('u8.chat.consentFail')), 'error') });
              }}
            />
          </Row>
        </Card>
        <EmergencyList compact />
      </Screen>
    );
  }

  // Conversation ouverte depuis l'historique : chargement, erreur, ou identifiant inconnu
  const openingExisting = !!params.id && conversationId === params.id && !historyLoaded.current;
  const historyLoading = openingExisting && historyQ.isLoading && !history;
  const historyError = openingExisting && historyQ.isError && !history;
  const notFound = !!params.id && conversationId === params.id && !msgs.length && !sending
    && !!history && history.length === 0 && !!conversations && !conversations.some((c) => c.id === params.id);
  if (historyLoading || historyError || notFound) {
    return (
      <Screen back title={sleepTopic ? tr('u8.chat.titleSleep') : tr('u8.chat.title')}>
        {historyLoading ? <Skeleton kind="detail" rows={5} /> : historyError ? (
          <ErrorView error={historyQ.error} onRetry={() => void historyQ.refetch()} title={tr('u8.chat.histErr')} />
        ) : (
          <EmptyState
            icon="message-circle"
            title={tr('u8.chat.notFound')}
            body={tr('u8.chat.notFoundBody')}
            action={{ label: tr('u8.chat.newConv'), icon: 'plus', onPress: newConversation }}
          />
        )}
      </Screen>
    );
  }

  const tooLong = input.length > MAX_QUESTION_LENGTH - 200;
  const blocked = remaining === 0;
  // Démonstration reliée à la vraie IA : limite par jour, pas d'offre Premium (il n'y a pas de compte)
  const demoAi = isDemo && hasRealBackend;

  return (
    <Screen
      back
      title={sleepTopic ? tr('u8.chat.titleSleep') : tr('u8.chat.title')}
      scroll={false}
      right={
        <Row gap={0}>
          {msgs.length > 0 && <IconButton icon="plus" label={tr('u8.chat.newConv')} onPress={newConversation} />}
          <IconButton icon="trash-2" label={tr('u8.chat.delConvA11y')} onPress={deleteConversation} />
        </Row>
      }
    >
      {/* Liste virtualisée (FlatList directe : il faut une référence pour défiler jusqu'au dernier message) */}
      <FlatList
        ref={scroll}
        data={msgs}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(m) => m.id}
        removeClippedSubviews={false}
        contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.lg }}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={(
          <View style={{ gap: spacing.md }}>
            <AssistantIntro />

            <Card padded>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text weight="medium">{sleepTopic ? tr('u8.chat.useSleep', { name: sleepChild!.first_name }) : tr('u8.chat.useMine')}</Text>
                  <Text variant="caption" muted>{tr('u8.chat.thisOnly')}</Text>
                </View>
                <Toggle label={tr('u8.chat.useMineA11y')} value={useContext} onChange={changeContext} />
              </Row>
              {useContext && (
                <Tappable accessibilityRole="button" onPress={() => setShowContext((v) => !v)} style={{ marginTop: spacing.xs, minHeight: MIN_TOUCH, justifyContent: 'center' }}>
                  <Text variant="small" color={t.colors.primary}>{showContext ? tr('u8.chat.hideCtx') : tr('u8.chat.showCtx')}</Text>
                </Tappable>
              )}
              {useContext && showContext && <Text variant="small" muted>{describeContext(context)}</Text>}
            </Card>
            {sleepTopic && !msgs.length ? (
              <View style={{ gap: spacing.xs }} testID="chat-sleep-questions">
                <Text variant="label">{tr('u8.chat.sleepQ', { name: sleepChild!.first_name })}</Text>
                <Row wrap>{SLEEP_QUESTIONS.map((q) => <Chip key={q} label={q} onPress={() => void send(q)} />)}</Row>
                <Text variant="caption" muted>{tr('u8.chat.sleepNote')}</Text>
              </View>
            ) : null}
            <Card padded>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text weight="medium">{tr('u8.chat.keep')}</Text>
                  <Text variant="caption" muted testID="chat-history-note">{historyOn ? tr('u8.chat.keepOn') : tr('u8.chat.keepOff')}</Text>
                </View>
                <Toggle label={tr('u8.chat.keep')} value={historyOn} onChange={(v) => updatePrivacy.mutate({ ai_history_enabled: v }, { onError: (e) => toast(friendlyError(e), 'error') })} />
              </Row>
              {historyOn ? <Button label={tr('u8.chat.myConvs')} icon="clock" size="sm" variant="ghost" style={{ alignSelf: 'flex-start' }} onPress={() => router.push('/(tabs)/ask' as never)} /> : null}
            </Card>
          </View>
        )}
        renderItem={({ item: m }) => (
          m.role === 'user' ? (
            <View key={m.id} style={{ alignSelf: 'flex-end', maxWidth: '86%', backgroundColor: t.colors.primary, padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.lg, borderBottomRightRadius: 6 }}>
              <Text color={t.colors.primaryText}>{m.content}</Text>
            </View>
          ) : m.safety && m.safety !== 'none' ? (
            <UrgentCard key={m.id} level={m.safety} contacts={m.urgent} message={m.content} />
          ) : (
            <View key={m.id} style={{ gap: spacing.xs }}>
              <View
                accessibilityLiveRegion={m.streaming ? 'polite' : 'none'}
                style={{ backgroundColor: m.error ? t.colors.dangerSoft : t.colors.surface, padding: spacing.md, borderRadius: radius.lg, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: t.colors.border, gap: spacing.sm }}
              >
                {!!m.devMode && <Text variant="caption" color={t.colors.lavender}>{m.devMode}</Text>}
                {m.streaming ? (
                  m.raw ? <StructuredAnswerView answer={parseStructuredAnswer(m.raw)} streaming /> : (
                    <Row>
                      <ActivityIndicator color={t.colors.lavender} />
                      <Text variant="small" muted>{tr('u8.chat.preparing')}</Text>
                    </Row>
                  )
                ) : m.structured ? (
                  <StructuredAnswerView answer={m.structured} articles={m.sources} />
                ) : (
                  <Markdown source={m.content} />
                )}
              </View>
              {(m.error || m.stopped) && m.question ? (
                <Button label={tr('u8.chat.retry')} icon="refresh-cw" size="sm" variant="secondary" style={{ alignSelf: 'flex-start' }} disabled={sending} onPress={() => retry(m)} testID="chat-retry" />
              ) : null}
              {!m.streaming && !m.error && !m.stopped && (
                <Text variant="caption" muted>{tr('u8.chat.aiNote')}</Text>
              )}
              {!!m.serverId && !m.streaming && (
                <Row wrap>
                  <Chip label={tr('u8.chat.useful')} icon="thumbs-up" selected={m.feedback === 1} onPress={() => feedback(m, 1)} />
                  <Chip label={tr('u8.chat.notUseful')} icon="thumbs-down" selected={m.feedback === -1} onPress={() => feedback(m, -1)} />
                  <Chip label={m.saved ? tr('u8.chat.inFav') : tr('u8.chat.fav')} icon="bookmark" selected={m.saved} onPress={() => toggleSave(m)} />
                </Row>
              )}
            </View>
          )
        )}
        ListFooterComponent={!demoAi && (premiumNeeded || blocked) ? (
          <Card tone="gold">
            <Text weight="bold">{premiumNeeded ?? tr('u8.chat.usedAll', { limit: limit ?? 0 })}</Text>
            <Text variant="small" muted>{tr('u8.chat.premiumPitch')}</Text>
            <Button label={tr('u8.chat.discover')} size="sm" variant="secondary" icon="star" style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={() => router.push('/settings/subscription')} />
          </Card>
        ) : null}
      />

      <View style={{ paddingBottom: insets.bottom + spacing.sm, gap: 4 }}>
        {remaining != null && (
          <Text variant="caption" muted center>
            {demoAi
              ? (remaining > 0 ? tr('ai.demo.left', { count: remaining, limit: limit ?? 0 }) : tr('ai.demo.noneLeft'))
              : remaining > 0 ? tr('u8.chat.left', { count: remaining, limit: limit ?? 0 }) : tr('u8.chat.noneLeft')}
          </Text>
        )}
        {tooLong && <Text variant="caption" color={t.colors.danger} center>{tr('u8.chat.chars', { n: input.length, max: MAX_QUESTION_LENGTH })}</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, backgroundColor: t.colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, padding: 6 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={blocked ? (demoAi ? tr('ai.demo.placeholderDone') : tr('u8.chat.limitReached')) : tr('u8.chat.placeholder')}
            placeholderTextColor={t.colors.textMuted}
            accessibilityLabel={tr('u8.chat.yourQ')}
            multiline
            editable={!blocked}
            maxLength={MAX_QUESTION_LENGTH}
            style={{ flex: 1, minHeight: 44, maxHeight: 140, color: t.colors.text, fontFamily: fonts.body, fontSize: 16, paddingHorizontal: spacing.sm, paddingTop: 10 }}
          />
          {sending ? (
            <Tappable accessibilityRole="button" accessibilityLabel={tr('u8.chat.stop')} onPress={() => abortRef.current?.abort()} testID="chat-stop"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="square" color={t.colors.primaryText} size={18} />
            </Tappable>
          ) : (
            <Tappable
              accessibilityRole="button"
              accessibilityLabel={tr('u8.chat.send')}
              disabled={blocked || input.trim().length < 2}
              onPress={() => send()}
              testID="chat-send"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center', opacity: blocked || input.trim().length < 2 ? 0.4 : 1 }}
            >
              <Icon name="arrow-up" color={t.colors.primaryText} />
            </Tappable>
          )}
        </View>
        <Tappable accessibilityRole="link" accessibilityLabel={tr('u8.chat.emergA11y')} onPress={() => router.push('/emergency')} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}>
          <Text variant="caption" color={t.colors.danger} center>{tr('u8.chat.emerg')}</Text>
        </Tappable>
      </View>
    </Screen>
  );
}
