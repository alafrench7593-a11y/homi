/** Onglet Questions : accueil de l'assistant (nouvelle conversation, suggestions par parcours, favoris, historique privé). */
import React, { useMemo, useState } from 'react';
import { aiAssistantOnline } from '@/config/features';
import { AiComingSoonScreen } from '@/features/AiComingSoon';
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
  const title = child ? tr('u3.ask.forChild', { name: child.first_name }) : tr('u3.ask.forWeek', { n: pregnancyProgress(pregnancy!.due_date).weeksSA });
  return (
    <View testID="ask-personal">
      <SectionTitle title={title} />
      <PremiumSection feature="assistant_suggestions" name={name} preview={<Text variant="small">{`« ${list[0]} »`}</Text>}>
        <View style={{ gap: spacing.xs }}>
          {list.map((s) => (
            <Tappable key={s} accessibilityRole="button" accessibilityLabel={tr('u3.ask.pose', { q: s })} disabled={disabled} onPress={() => onAsk(s)}
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

export default function AskScreen() {
  // Assistant IA en ligne « Bientôt disponible » (src/config/features.ts) : le vrai écran reste intact ci-dessous
  return aiAssistantOnline() ? <Ask /> : <AiComingSoonScreen />;
}

function Ask() {
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

  // Réponses générées SUR LE TÉLÉPHONE par l'assistant local (articles sourcés, hors ligne, sans limite) ;
  // l'assistant en ligne reste disponible, avec son quota mensuel.
  const go = (question?: string) => router.push({ pathname: '/assistant/local', params: question ? { q: question } : {} });
  const goOnline = (question?: string) => router.push({ pathname: '/assistant/chat', params: question ? { q: question } : {} });
  const blockedOnline = quota?.remaining === 0;
  const blocked = false;

  async function deleteOne(c: Conversation) {
    if (busy) return;
    if (!(await confirm(tr('u3.ask.delQ'), tr('u3.ask.delBody', { title: c.title }), tr('u3.fertBody.delOk')))) return;
    setBusy(true);
    try {
      await backend.remove('assistant_conversations', [eq('id', c.id)]);
      inv('assistant_conversations', 'assistant_messages');
      toast(tr('u3.ask.deleted'));
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function clearHistory() {
    if (busy) return;
    if (!(await confirm(tr('u3.ask.clearQ'), tr('u3.ask.clearBody'), tr('u3.ask.clearAll')))) return;
    setBusy(true);
    try {
      await backend.remove('assistant_conversations', [eq('user_id', userId)]);
      inv('assistant_conversations', 'assistant_messages');
      toast(tr('u3.ask.cleared'));
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
          label={tr('u3.ask.yourQ')}
          placeholder={tr('u3.ask.yourQPh')}
          value={q}
          onChangeText={setQ}
          multiline
          maxLength={MAX_QUESTION_LENGTH}
          returnKeyType="send"
          // Multiligne : sans cela la touche « Envoyer » ajoutait une ligne au lieu d'envoyer
          submitBehavior="blurAndSubmit"
          onSubmitEditing={() => q.trim().length >= 2 && !blocked && go(q.trim())}
        />
        <Row style={{ marginTop: spacing.sm }} wrap>
          <Button label={tr('u3.ask.askBtn')} icon="send" disabled={q.trim().length < 2} onPress={() => go(q.trim())} testID="ask-local" />
          <Button label={tr('u3.ask.online')} icon="cloud" variant="secondary" disabled={blockedOnline} onPress={() => goOnline(q.trim() || undefined)} testID="ask-online" />
        </Row>
        <Text variant="caption" muted style={{ marginTop: spacing.xs }}>
          {tr('u3.ask.immediate')}
        </Text>
        {quota && (
          <Text variant="caption" muted style={{ marginTop: 2 }}>
            {quota.remaining > 0 ? tr('u3.ask.quotaLeft', { count: quota.remaining, quota: quota.quota }) : tr('u3.ask.quotaNone')}
          </Text>
        )}
      </Card>

      {blockedOnline && (
        <Banner
          tone="warning"
          icon="star"
          title={tr('u3.ask.limitT')}
          action={<Button label={tr('u3.ask.discover')} size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => assistantAccess.showPreview(undefined, quota ? { used: quota.quota - quota.remaining, quota: quota.quota, unit: 'questions' } : null)} />}
        >
          {tr('u3.ask.limitBody')}
        </Banner>
      )}

      <Banner tone="danger" title={tr('u3.ask.urgT')} action={<Button label={tr('u3.ask.urgNums')} size="sm" variant="secondary" icon="phone" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => router.push('/emergency')} />}>
        {tr('u3.ask.urgBody')}
      </Banner>

      <PersonalSuggestions onAsk={(s) => go(s)} disabled={blocked} />

      <SectionTitle title={tr('u3.ask.ideas')} />
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
            accessibilityLabel={tr('u3.ask.pose', { q: s })}
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
          <SectionTitle title={tr('u3.ask.favs')} />
          <Card>
            {saved.slice(0, 10).map((m) => (
              <ListRow key={m.id} icon="bookmark" title={preview(m.content)} subtitle={timeAgo(m.created_at)} onPress={() => router.push({ pathname: '/assistant/chat', params: { id: m.conversation_id } })} />
            ))}
          </Card>
        </>
      )}

      <SectionTitle title={tr('u3.ask.hist')} action={conversations?.length ? tr('u3.ask.clearAll') : undefined} onAction={clearHistory} />
      {convLoading ? <Skeleton kind="list" rows={3} /> : convError ? (
        <ErrorView error={convQ.error} onRetry={() => void convQ.refetch()} title={tr('u3.ask.errHist')} />
      ) : null}
    </View>
  );

  const footer = (
    <View style={{ gap: spacing.md, marginTop: spacing.md }}>
      <Text variant="caption" muted center>{tr('u3.ask.private')}</Text>
      <Row style={{ justifyContent: 'center' }}>
        <Chip label={tr('u3.ask.manage')} icon="lock" onPress={() => router.push('/settings/privacy')} />
      </Row>
    </View>
  );

  return (
    <Screen back account scroll={false} padded={false} title={tr('screen.ask.title')} subtitle={tr('screen.ask.sub')}>
      <VirtualList
        data={rows}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={convLoading || convError ? null : (
          <EmptyState
            icon="message-circle"
            title={tr('u3.ask.emptyT')}
            body={tr('u3.ask.emptyB')}
            action={blocked ? undefined : { label: tr('u3.ask.first'), icon: 'message-circle', onPress: () => go() }}
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
                right={<IconButton icon="trash-2" size={18} label={tr('u3.ask.delConv', { title: c.title })} onPress={() => deleteOne(c)} />}
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
