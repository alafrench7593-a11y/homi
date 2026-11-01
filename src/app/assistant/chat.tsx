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
import { backend, BackendError, eq } from '@/lib/backend';
import { useUserId } from '@/lib/auth';
import { useChild, useConsents, useConversations, useInvalidate, useMessages, usePrivacy, useSetConsent } from '@/lib/data/hooks';
import { SLEEP_QUESTIONS, useSleepAssistantContext } from '@/features/sleepAssistant';
import { friendlyError, useUpdatePrivacy } from '@/lib/data/hooks-settings';
import type { AssistantMessage } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

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
        toast('Préférence non enregistrée pour l’instant : elle sera appliquée à votre prochaine question.', 'info');
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
        sources: res.sources, safety: res.safety, urgent: res.urgent_contacts, devMode: res.dev_mode ?? (res.demo ? 'Mode démonstration' : undefined),
      });
      if (res.safety !== 'none') haptic('warning');
      if (res.replaced) toast('Réponse remplacée par une version plus prudente.', 'info');
      inv('assistant_conversations', 'assistant_usage');
    } catch (e) {
      if (e instanceof BackendError && e.isPremiumRequired) {
        setPremiumNeeded(e.message);
        setMsgs((m) => m.filter((x) => x.id !== answerId));
        inv('assistant_usage');
      } else if (e instanceof BackendError && e.code === 'aborted') {
        patchMsg(answerId, { streaming: false, raw: undefined, stopped: true, content: 'Réponse arrêtée.' });
      } else {
        patchMsg(answerId, { streaming: false, raw: undefined, error: true, content: friendlyError(e, 'L’assistant est indisponible pour le moment. Réessayez dans un instant.') });
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
      toast('Merci pour votre retour.', 'info');
    } catch (e) {
      toast(friendlyError(e, 'Retour non enregistré. Réessayez dans un instant.'), 'error');
    } finally {
      setBusyAction(false);
    }
  }

  const saveAccess = usePremiumAccess('assistant_saved');
  async function toggleSave(m: LocalMsg) {
    if (!m.serverId) return toast('Activez l’historique pour enregistrer des réponses.', 'info');
    if (busyAction) return;
    // Enregistrer une nouvelle réponse : Premium (retirer ou relire une réponse déjà enregistrée reste gratuit)
    if (!m.saved && !saveAccess.require(<Text variant="small" numberOfLines={3}>{`« ${m.content.slice(0, 160)}${m.content.length > 160 ? '…' : ''} » serait gardée dans « Mes réponses favorites ».`}</Text>)) return;
    setBusyAction(true);
    try {
      await backend.update('assistant_messages', { saved: !m.saved }, [eq('id', m.serverId)]);
      patchMsg(m.id, (x) => ({ saved: !x.saved }));
      inv('assistant_messages');
      toast(m.saved ? 'Réponse retirée des favoris.' : 'Réponse ajoutée aux favoris.');
    } catch (e) {
      toast(friendlyError(e, 'Favori non enregistré. Réessayez dans un instant.'), 'error');
    } finally {
      setBusyAction(false);
    }
  }

  async function deleteConversation() {
    if (!conversationId) return router.back();
    if (busyAction) return;
    if (!(await confirm('Supprimer cette conversation ?', 'Elle sera définitivement effacée, avec vos favoris et retours associés.', 'Supprimer'))) return;
    setBusyAction(true);
    try {
      await backend.remove('assistant_conversations', [eq('id', conversationId)]);
      inv('assistant_conversations', 'assistant_messages');
      toast('Conversation supprimée.');
      router.back();
    } catch (e) {
      toast(friendlyError(e, 'Suppression impossible. Réessayez dans un instant.'), 'error');
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
      <Screen back title={sleepTopic ? "Assistant sommeil · IA" : "Assistant"}>
        <AssistantIntro />
        <Card tone="lavender">
          <Text variant="heading">Avant de commencer</Text>
          <Text style={{ marginTop: spacing.xs }}>
            Vos questions sont envoyées, depuis nos serveurs, à l’intelligence artificielle Google Gemini (service externe). Votre situation (parcours, semaine de grossesse, âge des enfants…) n’est transmise que si vous l’autorisez, conversation par conversation — jamais de prénom ni de document.
          </Text>
          <Text style={{ marginTop: spacing.xs }}>L’assistant informe et vous aide à préparer vos rendez-vous. Il ne pose pas de diagnostic, ne prescrit rien et ne remplace pas un professionnel. Vos conversations restent privées et ne sont jamais publiées.</Text>
          <Row style={{ marginTop: spacing.md, justifyContent: 'space-between' }}>
            <Text weight="medium" style={{ flex: 1 }}>J’accepte d’utiliser l’assistant</Text>
            <Toggle
              label="Accepter l’utilisation de l’assistant"
              value={setConsent.isPending}
              onChange={() => {
                if (setConsent.isPending) return;
                setConsent.mutate({ purpose: 'ai_assistant', granted: true }, { onError: (e) => toast(friendlyError(e, 'Votre accord n’a pas pu être enregistré. Réessayez.'), 'error') });
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
      <Screen back title={sleepTopic ? "Assistant sommeil · IA" : "Assistant"}>
        {historyLoading ? <Skeleton kind="detail" rows={5} /> : historyError ? (
          <ErrorView error={historyQ.error} onRetry={() => void historyQ.refetch()} title="Impossible d’afficher cette conversation" />
        ) : (
          <EmptyState
            icon="message-circle"
            title="Conversation introuvable"
            body="Elle a peut-être été supprimée."
            action={{ label: 'Nouvelle conversation', icon: 'plus', onPress: newConversation }}
          />
        )}
      </Screen>
    );
  }

  const tooLong = input.length > MAX_QUESTION_LENGTH - 200;
  const blocked = remaining === 0;

  return (
    <Screen
      back
      title={sleepTopic ? "Assistant sommeil · IA" : "Assistant"}
      scroll={false}
      right={
        <Row gap={0}>
          {msgs.length > 0 && <IconButton icon="plus" label="Nouvelle conversation" onPress={newConversation} />}
          <IconButton icon="trash-2" label="Supprimer la conversation" onPress={deleteConversation} />
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
                  <Text weight="medium">{sleepTopic ? `Utiliser les données de sommeil de ${sleepChild!.first_name}` : 'Utiliser ma situation'}</Text>
                  <Text variant="caption" muted>Pour cette conversation uniquement. Vous pouvez changer d’avis à tout moment.</Text>
                </View>
                <Toggle label="Utiliser ma situation pour cette conversation" value={useContext} onChange={changeContext} />
              </Row>
              {useContext && (
                <Tappable accessibilityRole="button" onPress={() => setShowContext((v) => !v)} style={{ marginTop: spacing.xs, minHeight: MIN_TOUCH, justifyContent: 'center' }}>
                  <Text variant="small" color={t.colors.primary}>{showContext ? 'Masquer' : 'Voir'} ce qui est transmis</Text>
                </Tappable>
              )}
              {useContext && showContext && <Text variant="small" muted>{describeContext(context)}</Text>}
            </Card>
            {sleepTopic && !msgs.length ? (
              <View style={{ gap: spacing.xs }} testID="chat-sleep-questions">
                <Text variant="label">{`Questions fréquentes sur le sommeil de ${sleepChild!.first_name}`}</Text>
                <Row wrap>{SLEEP_QUESTIONS.map((q) => <Chip key={q} label={q} onPress={() => void send(q)} />)}</Row>
                <Text variant="caption" muted>L’assistant tient compte de son âge et des sommeils notés, explique ses incertitudes et ne pose jamais de diagnostic.</Text>
              </View>
            ) : null}
            <Card padded>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text weight="medium">Garder mes conversations</Text>
                  <Text variant="caption" muted testID="chat-history-note">{historyOn ? 'Vos conversations sont enregistrées dans votre espace privé, visibles par vous seule ou vous seul, et supprimables à tout moment.' : 'Désactivé : vos questions et les réponses ne sont pas enregistrées après l’échange.'}</Text>
                </View>
                <Toggle label="Garder mes conversations" value={historyOn} onChange={(v) => updatePrivacy.mutate({ ai_history_enabled: v }, { onError: (e) => toast(friendlyError(e), 'error') })} />
              </Row>
              {historyOn ? <Button label="Mes conversations" icon="clock" size="sm" variant="ghost" style={{ alignSelf: 'flex-start' }} onPress={() => router.push('/(tabs)/ask' as never)} /> : null}
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
                      <Text variant="small" muted>L’assistant prépare une réponse…</Text>
                    </Row>
                  )
                ) : m.structured ? (
                  <StructuredAnswerView answer={m.structured} articles={m.sources} />
                ) : (
                  <Markdown source={m.content} />
                )}
              </View>
              {(m.error || m.stopped) && m.question ? (
                <Button label="Réessayer" icon="refresh-cw" size="sm" variant="secondary" style={{ alignSelf: 'flex-start' }} disabled={sending} onPress={() => retry(m)} testID="chat-retry" />
              ) : null}
              {!m.streaming && !m.error && !m.stopped && (
                <Text variant="caption" muted>Réponse générée par une IA, à titre d’information : elle ne remplace pas un professionnel de santé.</Text>
              )}
              {m.serverId && !m.streaming && (
                <Row wrap>
                  <Chip label="Utile" icon="thumbs-up" selected={m.feedback === 1} onPress={() => feedback(m, 1)} />
                  <Chip label="Pas utile" icon="thumbs-down" selected={m.feedback === -1} onPress={() => feedback(m, -1)} />
                  <Chip label={m.saved ? 'Dans mes favoris' : 'Favori'} icon="bookmark" selected={m.saved} onPress={() => toggleSave(m)} />
                </Row>
              )}
            </View>
          )
        )}
        ListFooterComponent={premiumNeeded || blocked ? (
          <Card tone="gold">
            <Text weight="bold">{premiumNeeded ?? `Vous avez utilisé vos ${limit} questions de ce mois.`}</Text>
            <Text variant="small" muted>Avec Au fil de nous Premium, posez jusqu’à 300 questions par mois. L’orientation en cas d’urgence et les numéros d’urgence restent toujours gratuits.</Text>
            <Button label="Découvrir Au fil de nous Premium" size="sm" variant="secondary" icon="star" style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={() => router.push('/settings/subscription')} />
          </Card>
        ) : null}
      />

      <View style={{ paddingBottom: insets.bottom + spacing.sm, gap: 4 }}>
        {remaining != null && (
          <Text variant="caption" muted center>
            {remaining > 0 ? `Il vous reste ${remaining} question${remaining > 1 ? 's' : ''} ce mois-ci (sur ${limit}).` : 'Plus de question disponible ce mois-ci.'}
          </Text>
        )}
        {tooLong && <Text variant="caption" color={t.colors.danger} center>{input.length} / {MAX_QUESTION_LENGTH} caractères</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, backgroundColor: t.colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, padding: 6 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={blocked ? 'Limite mensuelle atteinte' : 'Écrivez votre question…'}
            placeholderTextColor={t.colors.textMuted}
            accessibilityLabel="Votre question"
            multiline
            editable={!blocked}
            maxLength={MAX_QUESTION_LENGTH}
            style={{ flex: 1, minHeight: 44, maxHeight: 140, color: t.colors.text, fontFamily: fonts.body, fontSize: 16, paddingHorizontal: spacing.sm, paddingTop: 10 }}
          />
          {sending ? (
            <Tappable accessibilityRole="button" accessibilityLabel="Arrêter la réponse" onPress={() => abortRef.current?.abort()} testID="chat-stop"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="square" color={t.colors.primaryText} size={18} />
            </Tappable>
          ) : (
            <Tappable
              accessibilityRole="button"
              accessibilityLabel="Envoyer"
              disabled={blocked || input.trim().length < 2}
              onPress={() => send()}
              testID="chat-send"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center', opacity: blocked || input.trim().length < 2 ? 0.4 : 1 }}
            >
              <Icon name="arrow-up" color={t.colors.primaryText} />
            </Tappable>
          )}
        </View>
        <Tappable accessibilityRole="link" accessibilityLabel="Numéros d’urgence : 15, 112, SMS 114, 3114" onPress={() => router.push('/emergency')} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}>
          <Text variant="caption" color={t.colors.danger} center>Urgence : 15 ou 112 · SMS 114 (sourds, malentendants) · Détresse : 3114</Text>
        </Tappable>
      </View>
    </Screen>
  );
}
