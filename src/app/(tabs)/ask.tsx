/** Onglet Questions : accueil de l'assistant (nouvelle conversation, suggestions par parcours, favoris, historique privé). */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { AssistantIntro } from '@/components/Assistant';
import { Banner, Button, Card, Chip, Field, Icon, IconButton, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { JOURNEY_ORDER, MAX_QUESTION_LENGTH, SUGGESTIONS_BY_JOURNEY, useAssistantQuota } from '@/features/assistant';
import { backend, eq } from '@/lib/backend';
import { useConversations, useInvalidate, useProfile, useSavedAnswers } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useUserId } from '@/lib/auth';
import { timeAgo } from '@/lib/domain/dates';
import type { Conversation, Journey } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { Tappable } from '@/components/Tappable';
import { PremiumSection } from '@/components/Premium';
import { useActivePregnancy, useActiveSubject, useTrackedChildren } from '@/lib/data/hooks';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { childSuggestions, pregnancySuggestions } from '@/lib/premium/suggestions';
import { childAge } from '@/lib/domain/child';
import { pregnancyProgress } from '@/lib/domain/pregnancy';

const preview = (s: string) => {
  const clean = s.replace(/[*_#>[\]]/g, '').replace(/\((https?:[^)]+)\)/g, '').replace(/\s+/g, ' ').replace(/^En bref\s*/i, '').trim();
  return clean.length > 80 ? clean.slice(0, 79) + '…' : clean;
};

/** Questions suggérées pour le profil affiché (semaine de grossesse ou âge exact) : Premium ; aperçu réel sinon. */
function PersonalSuggestions({ onAsk, disabled }: { onAsk: (q: string) => void; disabled: boolean }) {
  const t = useTheme();
  const { subject } = useActiveSubject();
  const { data: children } = useTrackedChildren();
  const pregnancy = useActivePregnancy();
  const child = subject.type === 'child' ? (children ?? []).find((c) => c.id === subject.id) : null;
  const list = child ? childSuggestions(child.first_name, childAge(child.birth_date).months)
    : subject.type === 'pregnancy' && pregnancy ? pregnancySuggestions(pregnancyProgress(pregnancy.due_date).weeksSA, pregnancy.multiplicity !== 'single' && pregnancy.multiplicity !== 'unknown') : [];
  if (!list.length) return null;
  const name = child?.first_name ?? null;
  const title = child ? `Pour ${child.first_name}, en ce moment` : `Pour votre ${pregnancyProgress(pregnancy!.due_date).weeksSA}e semaine`;
  return (
    <View testID="ask-personal">
      <SectionTitle title={title} />
      <PremiumSection feature="assistant_suggestions" name={name} preview={<Text variant="small">{`« ${list[0]} »`}</Text>}>
        <View style={{ gap: spacing.xs }}>
          {list.map((s) => (
            <Tappable key={s} accessibilityRole="button" accessibilityLabel={`Poser : ${s}`} disabled={disabled} onPress={() => onAsk(s)}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, minHeight: 44, borderRadius: radius.md, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface })}>
              <Icon name="star" size={16} color={t.colors.gold} />
              <Text variant="small" style={{ flex: 1 }}>{s}</Text>
            </Tappable>
          ))}
        </View>
      </PremiumSection>
    </View>
  );
}

export default function Ask() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const [q, setQ] = useState('');
  const { data: profile } = useProfile();
  const insets = useSafeAreaInsets();
  const convQ = useConversations();
  const conversations = convQ.data;
  const [busy, setBusy] = useState(false);
  const { data: saved } = useSavedAnswers();
  const { data: quota } = useAssistantQuota();
  const assistantAccess = usePremiumAccess('assistant_more');

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
    if (busy) return;
    if (!(await confirm('Supprimer cette conversation ?', `« ${c.title} » sera définitivement effacée.`, 'Supprimer'))) return;
    setBusy(true);
    try {
      await backend.remove('assistant_conversations', [eq('id', c.id)]);
      inv('assistant_conversations', 'assistant_messages');
      toast('Conversation supprimée.');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function clearHistory() {
    if (busy) return;
    if (!(await confirm('Supprimer tout l’historique ?', 'Toutes vos conversations avec l’assistant seront définitivement supprimées.', 'Tout supprimer'))) return;
    setBusy(true);
    try {
      await backend.remove('assistant_conversations', [eq('user_id', userId)]);
      inv('assistant_conversations', 'assistant_messages');
      toast('Historique supprimé.');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  const convLoading = convQ.isLoading && !conversations;
  const convError = convQ.isError && !conversations;
  const rows = convLoading || convError ? [] : (conversations ?? []);

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
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
          action={<Button label="Découvrir Toi & Moi Premium" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => assistantAccess.showPreview(undefined, quota ? { used: quota.quota - quota.remaining, quota: quota.quota, unit: 'questions' } : null)} />}
        >
          {'Avec Toi & Moi Premium, posez jusqu’à 300 questions par mois. L’orientation en cas d’urgence reste toujours gratuite.'}
        </Banner>
      )}

      <Banner tone="danger" title="Urgence ?" action={<Button label="Numéros d’urgence" size="sm" variant="secondary" icon="phone" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => router.push('/emergency')} />}>
        {'Danger immédiat : 15 ou 112 (SMS au 114 pour les personnes sourdes ou malentendantes). Détresse psychologique ou idées suicidaires : 3114, 24 h/24.'}
      </Banner>

      <PersonalSuggestions onAsk={(s) => go(s)} disabled={blocked} />

      <SectionTitle title="Idées de questions" />
      <Row wrap>
        {journeys.map((j) => (
          <Chip key={j} label={SUGGESTIONS_BY_JOURNEY[j].label} selected={j === journey} onPress={() => setSelected(j)} />
        ))}
      </Row>
      <View style={{ gap: spacing.xs }}>
        {SUGGESTIONS_BY_JOURNEY[journey].questions.map((s) => (
          <Tappable
            key={s}
            accessibilityRole="button"
            accessibilityLabel={`Poser : ${s}`}
            disabled={blocked}
            onPress={() => go(s)}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, minHeight: 44, borderRadius: radius.md, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface, borderWidth: 1, borderColor: t.colors.border, opacity: blocked ? 0.5 : 1 })}
          >
            <Icon name="message-circle" size={16} color={t.colors.lavender} />
            <Text variant="small" style={{ flex: 1 }}>{s}</Text>
          </Tappable>
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
      {convLoading ? <Skeleton kind="list" rows={3} /> : convError ? (
        <ErrorView error={convQ.error} onRetry={() => void convQ.refetch()} title="Impossible d’afficher l’historique" />
      ) : null}
    </View>
  );

  const footer = (
    <View style={{ gap: spacing.md, marginTop: spacing.md }}>
      <Text variant="caption" muted center>Vos conversations sont privées et ne sont jamais partagées dans la communauté.</Text>
      <Row style={{ justifyContent: 'center' }}>
        <Chip label="Gérer l’historique dans Confidentialité" icon="lock" onPress={() => router.push('/settings/privacy')} />
      </Row>
    </View>
  );

  return (
    <Screen account scroll={false} padded={false} title={tr('screen.ask.title')} subtitle={tr('screen.ask.sub')}>
      <VirtualList
        data={rows}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={convLoading || convError ? null : (
          <EmptyState
            icon="message-circle"
            title="Aucune question pour l’instant"
            body="Vos conversations restent privées : elles ne sont jamais publiées dans la communauté."
            action={blocked ? undefined : { label: 'Poser ma première question', icon: 'message-circle', onPress: () => go() }}
          />
        )}
        renderItem={({ item: c, index }) => {
          const first = index === 0;
          const last = index === rows.length - 1;
          return (
            <View
              style={{
                backgroundColor: t.colors.surface, borderColor: t.colors.border, borderLeftWidth: 1, borderRightWidth: 1,
                borderTopWidth: first ? 1 : 0, borderBottomWidth: last ? 1 : 0,
                borderTopLeftRadius: first ? radius.lg : 0, borderTopRightRadius: first ? radius.lg : 0,
                borderBottomLeftRadius: last ? radius.lg : 0, borderBottomRightRadius: last ? radius.lg : 0,
                paddingHorizontal: spacing.md, paddingTop: first ? spacing.xs : 0, paddingBottom: last ? spacing.xs : 0,
              }}
            >
              <ListRow
                icon="clock"
                title={c.title}
                subtitle={timeAgo(c.updated_at)}
                onPress={() => router.push({ pathname: '/assistant/chat', params: { id: c.id } })}
                right={<IconButton icon="trash-2" size={18} label={`Supprimer la conversation « ${c.title} »`} onPress={() => deleteOne(c)} />}
              />
            </View>
          );
        }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl + 96 }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
