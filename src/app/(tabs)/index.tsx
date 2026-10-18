/**
 * Accueil simple : profil actif, une carte principale adaptée, 3 ou 4 actions rapides,
 * le prochain rappel ou rendez-vous, l'article du jour et « Poser une question ».
 * Tout le reste est rangé dans « Tous mes outils ».
 */
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { DemoBanner, ProfileSwitcher } from '@/components/Family';
import { ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Icon, IconButton, Row, Text } from '@/components/ui';
import { PostpartumHomeCard } from '@/features/postpartum';
import { FamilyHomeCard } from '@/features/familyLoad';
import { ChildToday, CycleCard, orderedHomeCards, PregnancyHero, QuickActions, setCycleRoute, UpcomingCard } from '@/features/home';
import { useActivePregnancy, useActiveSubject, useArticles, useChildren, useNotificationsInbox, usePremium, useProfile } from '@/lib/data/hooks';
import { greeting } from '@/lib/domain/dates';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { childAge } from '@/lib/domain/child';
import { isLocked, suggestArticles } from '@/lib/domain/content';
import { articleOfDay, mainJourneys, quickActionsFor } from '@/lib/domain/journeys';
import { formatDate, t as tr } from '@/i18n';
import { useOfflineStore } from '@/lib/offline';
import { useUiStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, NACRE, previewTime, spacing } from '@/theme/tokens';

export default function Home() {
  const t = useTheme();
  const profileQ = useProfile();
  const profile = profileQ.data;
  const { subject } = useActiveSubject();
  const pregnancy = useActivePregnancy();
  const childrenQ = useChildren();
  const children = childrenQ.data;
  // Carte principale : squelette pendant le premier chargement, erreur avec « Réessayer » sinon
  const mainLoading = (profileQ.isLoading && !profile) || (childrenQ.isLoading && !children);
  const mainError = profileQ.isError && !profile ? profileQ : childrenQ.isError && !children ? childrenQ : null;
  const { data: articles } = useArticles();
  const { data: inbox } = useNotificationsInbox();
  const premium = usePremium();
  const offline = useOfflineStore();
  const skyOverride = useUiStore((st) => st.skyOverride);
  const homeOrder = useUiStore((st) => st.homeOrder);
  const homeHidden = useUiStore((st) => st.homeHidden);
  const quickShortcuts = useUiStore((st) => st.quickShortcuts);
  const now = skyOverride ? previewTime(skyOverride) : new Date();

  const journeys = profile?.journeys ?? [];
  const main = mainJourneys(journeys);
  const unread = inbox?.filter((n) => !n.read_at).length ?? 0;
  const child = subject.type === 'child' ? children?.find((c) => c.id === subject.id) : subject.type === 'family' ? children?.[0] : undefined;
  const cycleMode: 'ttc' | 'avoid' | 'cycle' | null = main.includes('ttc') ? 'ttc' : main.includes('avoid') ? 'avoid' : main.includes('cycle') ? 'cycle' : null;
  setCycleRoute(cycleMode === 'avoid' ? '/contraception' : cycleMode === 'cycle' ? '/cycle' : '/fertility');

  const subtitle = subject.type === 'child' && child
    ? `${child.first_name}, ${childAge(child.birth_date).label}`
    : subject.type === 'pregnancy' && pregnancy
      ? `${pregnancyProgress(pregnancy.due_date).label}`
      : cycleMode === 'ttc' ? tr('home.sub.ttc') : cycleMode ? tr('home.sub.cycle') : undefined;

  const article = useMemo(() => {
    const list = suggestArticles(articles ?? [], {
      journeys,
      weekSA: subject.type === 'pregnancy' && pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null,
      childAgesMonths: child ? [childAge(child.birth_date).months] : (children ?? []).map((c) => childAge(c.birth_date).months),
      postpartum: main.includes('mother'),
      multiple: !!pregnancy && pregnancy.multiplicity !== 'single',
    }, 6);
    return articleOfDay(list);
  }, [articles, journeys, subject, pregnancy, child, children, main]);

  const youngestMonths = children?.length ? Math.min(...children.map((c) => childAge(c.birth_date).months)) : null;
  const quick = quickActionsFor(subject.type === 'pregnancy' ? 'pregnancy' : subject.type === 'child' ? 'child' : subject.type === 'family' ? 'family' : 'me', journeys);

  const quickKeys = (quickShortcuts?.length ? quickShortcuts : quick);
  const cards: Record<string, React.ReactNode> = {
    main: mainLoading ? <Skeleton kind="card" rows={1} />
      : mainError ? <ErrorView error={mainError.error} onRetry={() => { void profileQ.refetch(); void childrenQ.refetch(); }} />
      : subject.type === 'pregnancy' && pregnancy ? <PregnancyHero pregnancy={pregnancy} />
      : child ? <ChildToday child={child} compact />
        : cycleMode ? <CycleCard mode={cycleMode} />
          : (
            <Card onPress={() => router.push('/me')} accessibilityLabel={tr('home.meA11y')}>
              <Text variant="heading">{tr('home.me')}</Text>
              <Text variant="small" muted>{tr('home.meSub')}</Text>
            </Card>
          ),
    quick: <QuickActions keys={quickKeys} childId={child?.id} onCustomize={() => router.push('/settings/home')} />,
    upcoming: <UpcomingCard />,
    family: <FamilyHomeCard />,
    postpartum: <PostpartumHomeCard journeys={profile?.journeys ?? []} youngestChildMonths={youngestMonths} />,
    article: article ? (
      <Card onPress={() => router.push(`/article/${article.slug}`)} accessibilityLabel={tr('home.articleA11y', { title: article.title })}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>{tr('home.article')}</Text>
          {isLocked(article, premium) && <Icon name="lock" size={14} color={t.colors.gold} />}
        </Row>
        <Text variant="heading" style={{ marginTop: 4 }}>{article.title}</Text>
        <Text variant="small" muted numberOfLines={2}>{article.summary}</Text>
      </Card>
    ) : null,
    assistant: (
      <Pressable accessibilityRole="button" accessibilityLabel={tr('home.askA11y')} onPress={() => router.push('/assistant/chat')} style={({ pressed }) => ({ borderRadius: 24, overflow: 'hidden', transform: [{ scale: pressed ? 0.98 : 1 }] })}>
        <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, minHeight: MIN_TOUCH + 16 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="message-circle" color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text weight="bold" color="#FFFFFF">{tr('home.ask')}</Text>
            <Text variant="caption" color="rgba(255,255,255,0.85)">{tr('home.askSub')}</Text>
          </View>
          <Icon name="arrow-right" color="#FFFFFF" />
        </LinearGradient>
      </Pressable>
    ),
  };
  const homeCards = orderedHomeCards(homeOrder, homeHidden);

  return (
    <View style={{ flex: 1 }}>
      <Screen bottomInset={96}>
        {/* En-tête */}
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginTop: spacing.xs }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="small" muted weight="bold">{formatDate(now, { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase())}</Text>
            <Text variant="title" accessibilityRole="header">{greeting(profile?.display_name, now)}</Text>
            {subtitle ? <Text variant="small" muted>{subtitle}</Text> : null}
          </View>
          <Row gap={0}>
            <IconButton icon="maximize" label={tr('home.scanA11y')} onPress={() => router.push('/scanner')} />
            <IconButton icon="life-buoy" label={tr('home.helpA11y')} color={t.colors.heart} onPress={() => router.push('/emergency')} />
            <View>
              <IconButton icon="bell" label={unread ? tr('home.notificationsUnread', { count: unread }) : tr('home.notifications')} onPress={() => router.push('/notifications')} />
              {unread > 0 && <View style={{ position: 'absolute', top: 11, right: 11, width: 9, height: 9, borderRadius: 5, backgroundColor: t.colors.heart }} />}
            </View>
          </Row>
        </Row>

        {/* 1. Profil actif */}
        <Appear kind="soft" delay={0.1}><ProfileSwitcher /></Appear>
        {!offline.online && <Banner tone="warning" title={tr('home.offline')}>{offline.pending.length ? tr('home.offlinePending', { count: offline.pending.length }) : tr('home.offlineBody')}</Banner>}

        {/* Cartes de l'accueil, dans l'ordre choisi (Réglages › Mon accueil) */}
        {homeCards.map((key, i) => {
          const node = cards[key];
          if (!node) return null;
          return <Appear key={key} kind={key === 'main' ? 'pop' : key === 'assistant' ? 'btn' : 'soft'} delay={0.2 + Math.min(i, 6) * 0.08}>{node}</Appear>;
        })}

        <Appear kind="side" delay={0.7}>
          <Button label={tr('home.allTools')} icon="grid" variant="secondary" onPress={() => router.push('/tools')} full />
        </Appear>

        <DemoBanner />
      </Screen>
    </View>
  );
}
