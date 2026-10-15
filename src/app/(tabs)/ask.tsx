/** Onglet Questions : poser une question, retrouver l'historique privé et les réponses enregistrées. */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Chip, Field, Icon, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { EmptyStateCard } from '@/components/ui-extra';
import { confirm, useToast } from '@/components/Overlays';
import { SUGGESTED_QUESTIONS } from '@/features/assistant';
import { backend, eq } from '@/lib/backend';
import { useConversations, useInvalidate, useSavedAnswers } from '@/lib/data/hooks';
import { useUserId } from '@/lib/auth';
import { timeAgo } from '@/lib/domain/dates';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export default function Ask() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const [q, setQ] = useState('');
  const { data: conversations } = useConversations();
  const { data: saved } = useSavedAnswers();

  const go = (question: string) => router.push({ pathname: '/assistant/chat', params: { q: question } });

  async function clearHistory() {
    if (!(await confirm('Supprimer tout l’historique ?', 'Toutes vos conversations avec l’assistant seront définitivement supprimées.', 'Tout supprimer'))) return;
    await backend.remove('assistant_conversations', [eq('user_id', userId)]);
    inv('assistant_conversations', 'assistant_messages');
    toast('Historique supprimé.');
  }

  return (
    <Screen bottomInset={96} title="Questions" subtitle="Un assistant d’intelligence artificielle, prudent et sourcé.">
      <Card tone="lavender">
        <Field label="Votre question" placeholder="Écrivez votre question…" value={q} onChangeText={setQ} multiline maxLength={4000} returnKeyType="send" onSubmitEditing={() => q.trim() && go(q.trim())} />
        <Button label="Poser la question" icon="send" style={{ marginTop: spacing.sm }} disabled={q.trim().length < 2} onPress={() => go(q.trim())} />
        <Text variant="caption" muted style={{ marginTop: spacing.xs }}>Assistant d’IA : il informe, il ne diagnostique pas et ne remplace pas un professionnel de santé.</Text>
      </Card>

      <Banner tone="danger" title="Urgence ?" action={<Button label="Numéros d’urgence" size="sm" variant="secondary" icon="phone" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => router.push('/emergency')} />}>
        {'En cas de danger immédiat, appelez le 15 ou le 112. Idées suicidaires : 3114, 24 h/24.'}
      </Banner>

      <SectionTitle title="Idées de questions" />
      <View style={{ gap: spacing.xs }}>
        {SUGGESTED_QUESTIONS.map((s) => (
          <Pressable key={s} accessibilityRole="button" accessibilityLabel={`Poser : ${s}`} onPress={() => go(s)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface, borderWidth: 1, borderColor: t.colors.border })}>
            <Icon name="message-circle" size={16} color={t.colors.lavender} />
            <Text variant="small" style={{ flex: 1 }}>{s}</Text>
          </Pressable>
        ))}
      </View>

      {!!saved?.length && (
        <>
          <SectionTitle title="Réponses enregistrées" />
          <Card>
            {saved.slice(0, 5).map((m) => (
              <ListRow key={m.id} icon="bookmark" title={m.content.replace(/[*_#]/g, '').slice(0, 70) + '…'} subtitle={timeAgo(m.created_at)} onPress={() => router.push({ pathname: '/assistant/chat', params: { id: m.conversation_id } })} />
            ))}
          </Card>
        </>
      )}

      <SectionTitle title="Historique privé" action={conversations?.length ? 'Tout supprimer' : undefined} onAction={clearHistory} />
      {conversations?.length ? (
        <Card>
          {conversations.map((c) => (
            <ListRow key={c.id} icon="clock" title={c.title} subtitle={timeAgo(c.updated_at)} onPress={() => router.push({ pathname: '/assistant/chat', params: { id: c.id } })} />
          ))}
        </Card>
      ) : (
        <EmptyStateCard illustration="chat" title="Aucune question pour l’instant" text="Vos conversations restent privées : elles ne sont jamais publiées dans la communauté." />
      )}
      <Row style={{ justifyContent: 'center' }}>
        <Chip label="Gérer l’historique dans Confidentialité" icon="lock" onPress={() => router.push('/settings/privacy')} />
      </Row>
    </Screen>
  );
}
