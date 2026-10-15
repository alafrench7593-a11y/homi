/** Onglet Questions : accueil de l'assistant (nouvelle conversation, suggestions par parcours, favoris, historique privé). */
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AssistantIntro } from '@/components/Assistant';
import { Banner, Button, Card, Chip, Field, Icon, IconButton, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { EmptyStateCard } from '@/components/ui-extra';
import { confirm, useToast } from '@/components/Overlays';
import { JOURNEY_ORDER, MAX_QUESTION_LENGTH, SUGGESTIONS_BY_JOURNEY, useAssistantQuota } from '@/features/assistant';
import { backend, eq } from '@/lib/backend';
import { useConversations, useInvalidate, useProfile, useSavedAnswers } from '@/lib/data/hooks';
import { useUserId } from '@/lib/auth';
import { timeAgo } from '@/lib/domain/dates';
import type { Conversation, Journey } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const preview = (s: string) => {
  const clean = s.replace(/[*_#>[\]]/g, '').replace(/\((https?:[^)]+)\)/g, '').replace(/\s+/g, ' ').replace(/^En bref\s*/i, '').trim();
  return clean.length > 80 ? clean.slice(0, 79) + '…' : clean;
};

export default function Ask() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const [q, setQ] = useState('');
  const { data: profile } = useProfile();
  const { data: conversations } = useConversations();
  const { data: saved } = useSavedAnswers();
  const { data: quota } = useAssistantQuota();

  // Parcours de la personne en premier, puis les autres
  const journeys = useMemo<Journey[]>(() => {
    const mine = (profile?.journeys ?? []).filter((j): j is Journey => JOURNEY_ORDER.includes(j as Journey));
    return [...mine, ...JOURNEY_ORDER.filter((j) => !mine.includes(j))];
  }, [profile?.journeys]);
  const [selected, setSelected] = useState<Journey | null>(null);
  const journey = selected ?? journeys[0];

  const go = (question?: string) => router.push({ pathname: '/assistant/chat', params: question ? { q: question } : {} });
  const blocked = quota?.remaining === 0;

  async function deleteOne(c: Conversation) {
    if (!(await confirm('Supprimer cette conversation ?', `« ${c.title} » sera définitivement effacée.`, 'Supprimer'))) return;
    await backend.remove('assistant_conversations', [eq('id', c.id)]);
    inv('assistant_conversations', 'assistant_messages');
    toast('Conversation supprimée.');
  }

  async function clearHistory() {
    if (!(await confirm('Supprimer tout l’historique ?', 'Toutes vos conversations avec l’assistant seront définitivement supprimées.', 'Tout supprimer'))) return;
    await backend.remove('assistant_conversations', [eq('user_id', userId)]);
    inv('assistant_conversations', 'assistant_messages');
    toast('Historique supprimé.');
  }

  return (
    <Screen bottomInset={96} title="Questions" subtitle="Posez vos questions de santé et de parentalité à un assistant prudent et sourcé.">
      <AssistantIntro />

      <Card tone="lavender">
        <Field
          label="Votre question"
          placeholder="Écrivez votre question…"
          value={q}
          onChangeText={setQ}
          multiline
          maxLength={MAX_QUESTION_LENGTH}
          returnKeyType="send"
          onSubmitEditing={() => q.trim().length >= 2 && !blocked && go(q.trim())}
        />
        <Row style={{ marginTop: spacing.sm }} wrap>
          <Button label="Poser la question" icon="send" disabled={blocked || q.trim().length < 2} onPress={() => go(q.trim())} />
          <Button label="Nouvelle conversation" icon="plus" variant="secondary" disabled={blocked} onPress={() => go()} />
        </Row>
        {quota && (
          <Text variant="caption" muted style={{ marginTop: spacing.xs }}>
            {quota.remaining > 0 ? `Il vous reste ${quota.remaining} question${quota.remaining > 1 ? 's' : ''} ce mois-ci (sur ${quota.quota}).` : 'Vous avez utilisé toutes vos questions de ce mois.'}
          </Text>
        )}
      </Card>

      {blocked && (
        <Banner
          tone="warning"
          icon="star"
          title="Limite mensuelle atteinte"
          action={<Button label="Découvrir Toi & Moi Plus" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => router.push('/settings/subscription')} />}
        >
          {'Avec Toi & Moi Plus, posez jusqu’à 300 questions par mois. L’orientation en cas d’urgence reste toujours gratuite.'}
        </Banner>
      )}

      <Banner tone="danger" title="Urgence ?" action={<Button label="Numéros d’urgence" size="sm" variant="secondary" icon="phone" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => router.push('/emergency')} />}>
        {'Danger immédiat : 15 ou 112 (SMS au 114 pour les personnes sourdes ou malentendantes). Détresse psychologique ou idées suicidaires : 3114, 24 h/24.'}
      </Banner>

      <SectionTitle title="Idées de questions" />
      <Row wrap>
        {journeys.map((j) => (
          <Chip key={j} label={SUGGESTIONS_BY_JOURNEY[j].label} selected={j === journey} onPress={() => setSelected(j)} />
        ))}
      </Row>
      <View style={{ gap: spacing.xs }}>
        {SUGGESTIONS_BY_JOURNEY[journey].questions.map((s) => (
          <Pressable
            key={s}
            accessibilityRole="button"
            accessibilityLabel={`Poser : ${s}`}
            disabled={blocked}
            onPress={() => go(s)}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, minHeight: 44, borderRadius: radius.md, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface, borderWidth: 1, borderColor: t.colors.border, opacity: blocked ? 0.5 : 1 })}
          >
            <Icon name="message-circle" size={16} color={t.colors.lavender} />
            <Text variant="small" style={{ flex: 1 }}>{s}</Text>
          </Pressable>
        ))}
      </View>

      {!!saved?.length && (
        <>
          <SectionTitle title="Mes réponses favorites" />
          <Card>
            {saved.slice(0, 10).map((m) => (
              <ListRow key={m.id} icon="bookmark" title={preview(m.content)} subtitle={timeAgo(m.created_at)} onPress={() => router.push({ pathname: '/assistant/chat', params: { id: m.conversation_id } })} />
            ))}
          </Card>
        </>
      )}

      <SectionTitle title="Historique privé" action={conversations?.length ? 'Tout supprimer' : undefined} onAction={clearHistory} />
      {conversations?.length ? (
        <Card>
          {conversations.map((c) => (
            <ListRow
              key={c.id}
              icon="clock"
              title={c.title}
              subtitle={timeAgo(c.updated_at)}
              onPress={() => router.push({ pathname: '/assistant/chat', params: { id: c.id } })}
              right={<IconButton icon="trash-2" size={18} label={`Supprimer la conversation « ${c.title} »`} onPress={() => deleteOne(c)} />}
            />
          ))}
        </Card>
      ) : (
        <EmptyStateCard illustration="chat" title="Aucune question pour l’instant" text="Vos conversations restent privées : elles ne sont jamais publiées dans la communauté." />
      )}
      <Text variant="caption" muted center>Vos conversations sont privées et ne sont jamais partagées dans la communauté.</Text>
      <Row style={{ justifyContent: 'center' }}>
        <Chip label="Gérer l’historique dans Confidentialité" icon="lock" onPress={() => router.push('/settings/privacy')} />
      </Row>
    </Screen>
  );
}
