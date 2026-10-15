/** Conversation avec l'assistant. */
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { Markdown } from '@/components/Markdown';
import { EmergencyList } from '@/components/Family';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, haptic, Icon, IconButton, Row, Text, Toggle } from '@/components/ui';
import { useAssistantContext, type AskResponse } from '@/features/assistant';
import { backend, BackendError, eq } from '@/lib/backend';
import { useConsents, useInvalidate, useMessages, useSetConsent } from '@/lib/data/hooks';
import type { AssistantMessage } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';

interface LocalMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: AskResponse['sources'];
  safety?: AskResponse['safety'];
  serverId?: string | null;
  feedback?: -1 | 1 | null;
  saved?: boolean;
}

export default function Chat() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; q?: string }>();
  const [conversationId, setConversationId] = useState<string | null>(params.id ?? null);
  const { data: history } = useMessages(params.id);
  const [msgs, setMsgs] = useState<LocalMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  const [premiumNeeded, setPremiumNeeded] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const context = useAssistantContext();
  const { latest } = useConsents();
  const setConsent = useSetConsent();
  const scroll = useRef<ScrollView>(null);
  const askedInitial = useRef(false);
  const consented = latest.get('ai_assistant') === true;

  useEffect(() => {
    if (history && !msgs.length) {
      setMsgs(history.map((m: AssistantMessage) => ({ id: m.id, serverId: m.id, role: m.role, content: m.content, sources: m.sources, feedback: m.feedback, saved: m.saved })));
    }
  }, [history]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (params.q && !askedInitial.current && consented) {
      askedInitial.current = true;
      send(params.q);
    }
  }, [params.q, consented]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (message.length < 2 || sending) return;
    setInput('');
    setPremiumNeeded(null);
    const local: LocalMsg = { id: `u${Date.now()}`, role: 'user', content: message };
    setMsgs((m) => [...m, local]);
    setSending(true);
    try {
      const res = await backend.invoke<AskResponse>('assistant', { conversation_id: conversationId, message, context });
      if (res.conversation_id) setConversationId(res.conversation_id);
      if (res.quota) setQuota(res.quota);
      setDemo(!!res.demo);
      setMsgs((m) => [...m, { id: `a${Date.now()}`, serverId: res.message_id, role: 'assistant', content: res.answer, sources: res.sources, safety: res.safety }]);
      if (res.safety !== 'none') haptic('warning');
      inv('assistant_conversations');
    } catch (e) {
      if (e instanceof BackendError && e.isPremiumRequired) setPremiumNeeded(e.message);
      else setMsgs((m) => [...m, { id: `e${Date.now()}`, role: 'assistant', content: e instanceof Error ? e.message : 'L’assistant est indisponible pour le moment.' }]);
    } finally {
      setSending(false);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 120);
    }
  }

  async function feedback(m: LocalMsg, value: -1 | 1) {
    if (!m.serverId) return;
    await backend.update('assistant_messages', { feedback: value }, [eq('id', m.serverId)]);
    setMsgs((all) => all.map((x) => (x.id === m.id ? { ...x, feedback: value } : x)));
    toast('Merci pour votre retour.', 'info');
  }

  async function toggleSave(m: LocalMsg) {
    if (!m.serverId) return toast('Activez l’historique pour enregistrer des réponses.', 'info');
    await backend.update('assistant_messages', { saved: !m.saved }, [eq('id', m.serverId)]);
    setMsgs((all) => all.map((x) => (x.id === m.id ? { ...x, saved: !x.saved } : x)));
    inv('assistant_messages');
    toast(m.saved ? 'Réponse retirée des favoris.' : 'Réponse enregistrée.');
  }

  async function deleteConversation() {
    if (!conversationId) return router.back();
    if (!(await confirm('Supprimer cette conversation ?', 'Elle sera définitivement effacée.', 'Supprimer'))) return;
    await backend.remove('assistant_conversations', [eq('id', conversationId)]);
    inv('assistant_conversations', 'assistant_messages');
    router.back();
  }

  if (!consented) {
    return (
      <Screen back title="Assistant">
        <Card tone="lavender">
          <Text variant="heading">Avant de commencer</Text>
          <Text style={{ marginTop: spacing.xs }}>
            L’assistant est une intelligence artificielle. Vos questions sont envoyées à un service d’IA sécurisé, avec seulement votre parcours, la semaine de grossesse ou l’âge des enfants — jamais de prénom ni de document.
          </Text>
          <Text style={{ marginTop: spacing.xs }}>Il informe et vous aide à préparer vos rendez-vous. Il ne pose pas de diagnostic, ne prescrit rien et ne remplace pas un professionnel.</Text>
          <Row style={{ marginTop: spacing.md, justifyContent: 'space-between' }}>
            <Text weight="medium">J’accepte d’utiliser l’assistant</Text>
            <Toggle label="Accepter l’utilisation de l’assistant" value={false} onChange={() => setConsent.mutate({ purpose: 'ai_assistant', granted: true })} />
          </Row>
        </Card>
        <EmergencyList compact />
      </Screen>
    );
  }

  return (
    <Screen back title="Assistant" scroll={false} right={<IconButton icon="trash-2" label="Supprimer la conversation" onPress={deleteConversation} />}>
      <ScrollView ref={scroll} contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.lg }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
        <Banner tone="info">{'Assistant d’intelligence artificielle. Il peut se tromper : vérifiez auprès d’un professionnel pour toute décision de santé.'}</Banner>
        {demo && <Banner tone="demo">{'Mode démonstration : aucun service d’IA n’est connecté, les réponses proviennent de la bibliothèque d’articles.'}</Banner>}
        {msgs.map((m) =>
          m.role === 'user' ? (
            <View key={m.id} style={{ alignSelf: 'flex-end', maxWidth: '86%', backgroundColor: t.colors.primary, padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.lg, borderBottomRightRadius: 6 }}>
              <Text color={t.colors.primaryText}>{m.content}</Text>
            </View>
          ) : (
            <View key={m.id} style={{ gap: spacing.xs }}>
              <View style={{ backgroundColor: m.safety && m.safety !== 'none' ? t.colors.dangerSoft : t.colors.surface, padding: spacing.md, borderRadius: radius.lg, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: t.colors.border }}>
                <Markdown source={m.content} />
              </View>
              {m.safety && m.safety !== 'none' && <EmergencyList compact />}
              {!!m.sources?.length && (
                <View style={{ gap: 4 }}>
                  <Text variant="caption" muted>Sources</Text>
                  {m.sources.map((s) => (
                    <Pressable key={s.ref} accessibilityRole="link" onPress={() => router.push(`/article/${s.slug}`)} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', minHeight: 36 }}>
                      <Text variant="small" color={t.colors.primary}>[{s.ref}] {s.title}</Text>
                      {s.sources[0] && <Text variant="caption" muted>— {s.sources.map((x) => x.label).join(', ')}</Text>}
                    </Pressable>
                  ))}
                </View>
              )}
              {m.serverId && (
                <Row wrap>
                  <Chip label="Utile" icon="thumbs-up" selected={m.feedback === 1} onPress={() => feedback(m, 1)} />
                  <Chip label="Pas utile" icon="thumbs-down" selected={m.feedback === -1} onPress={() => feedback(m, -1)} />
                  <Chip label={m.saved ? 'Enregistrée' : 'Enregistrer'} icon="bookmark" selected={m.saved} onPress={() => toggleSave(m)} />
                </Row>
              )}
            </View>
          ),
        )}
        {sending && (
          <Row>
            <ActivityIndicator color={t.colors.lavender} />
            <Text variant="small" muted>L’assistant prépare une réponse…</Text>
          </Row>
        )}
        {premiumNeeded && (
          <Card tone="gold">
            <Text weight="bold">{premiumNeeded}</Text>
            <Text variant="small" muted>Avec Toi & Moi Plus, posez jusqu’à 300 questions par mois. Les ressources d’urgence restent toujours gratuites.</Text>
            <Button label="Voir l’abonnement" size="sm" variant="secondary" style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={() => router.push('/settings/subscription')} />
          </Card>
        )}
      </ScrollView>
      <View style={{ paddingBottom: insets.bottom + spacing.sm, gap: 4 }}>
        {quota && <Text variant="caption" muted center>{quota.used} / {quota.limit} questions ce mois-ci</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, backgroundColor: t.colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, padding: 6 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Écrivez votre question…"
            placeholderTextColor={t.colors.textMuted}
            accessibilityLabel="Votre question"
            multiline
            maxLength={4000}
            style={{ flex: 1, minHeight: 44, maxHeight: 140, color: t.colors.text, fontFamily: fonts.body, fontSize: 16, paddingHorizontal: spacing.sm, paddingTop: 10 }}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Envoyer" disabled={sending || input.trim().length < 2} onPress={() => send()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center', opacity: input.trim().length < 2 ? 0.4 : 1 }}>
            <Icon name="arrow-up" color={t.colors.primaryText} />
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
