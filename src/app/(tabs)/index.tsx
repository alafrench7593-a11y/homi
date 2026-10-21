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
import { ChildToday, CycleCard, orderedHomeCards, PregnancyHero, QuickActions, setCycleRoute, UpcomingCard } from '@/features/home';
import { ChildHomeCard, FamilyOverview, NoJourneyCard } from '@/features/journeys';
import { useActivePregnancy, useArticles, useJourneyState, usePremium, useProfile, useTrackedChildren } from '@/lib/data/hooks';
import { useRelevantNotifications, useScope } from '@/lib/data/hooks-scope';
import { HomeRecipeCard } from '@/features/recipes/HomeRecipeCard';
import { quickAllowed, quickFor, type Scope } from '@/lib/journeys/tools';
import type { Journey } from '@/lib/types';
import { greeting } from '@/lib/domain/dates';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { childAge } from '@/lib/domain/child';
import { isLocked, suggestArticles } from '@/lib/domain/content';
import { articleOfDay } from '@/lib/domain/journeys';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useOfflineStore } from '@/lib/offline';
import { useUiStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, NACRE, previewTime, spacing } from '@/theme/tokens';
import { AccountActions } from '@/components/AccountActions';
import { Tappable } from '@/components/Tappable';

/** Parcours historiques équivalents à la portée affichée (suggestion d'articles). */
const LEGACY_FOR: Record<Scope, Journey[]> = {
  avoid: ['avoid'], ttc: ['ttc'], cycle: ['cycle'], none: [], pregnancy: ['pregnant'], postpartum: ['newborn'], baby: ['newborn'], child: ['child'], family: ['family', 'child'],
};

export default function Home() {
  const t = useTheme();
  const profileQ = useProfile();
  const profile = profileQ.data;
  // Portée affichée = profil du sélecteur + parcours actif : seule source de l'accueil (jamais un ancien parcours)
  const scope = useScope();
  const pregnancy = useActivePregnancy();
  const childrenQ = useTrackedChildren();
  const children = childrenQ.data;
  const js = useJourneyState();
  const mainLoading = (profileQ.isLoading && !profile) || (childrenQ.isLoading && !children) || !scope.loaded;
  const mainError = profileQ.isError && !profile ? profileQ : childrenQ.isError && !children ? childrenQ : null;
  const { data: articles } = useArticles();
  const { data: inbox } = useRelevantNotifications();
  const premium = usePremium();
  const offline = useOfflineStore();
  const skyOverride = useUiStore((st) => st.skyOverride);
  const homeOrder = useUiStore((st) => st.homeOrder);
  const homeHidden = useUiStore((st) => st.homeHidden);
  const quickShortcuts = useUiStore((st) => st.quickShortcuts);
  const simple = useUiStore((st) => st.simpleMode);
  const now = skyOverride ? previewTime(skyOverride) : new Date();

  const unread = inbox?.filter((n) => !n.read_at).length ?? 0;
  const child = scope.child;
  const cycleMode = scope.scope === 'avoid' || scope.scope === 'ttc' || scope.scope === 'cycle' ? scope.scope : null;
  setCycleRoute(cycleMode === 'avoid' ? '/contraception' : cycleMode === 'cycle' ? '/cycle' : '/fertility');

  // La semaine d'aménorrhée n'apparaît QUE pour une grossesse active affichée
  const subtitle = (scope.scope === 'baby' || scope.scope === 'child') && child
    ? `${child.first_name}, ${childAge(child.birth_date).label}`
    : scope.scope === 'pregnancy' && pregnancy
      ? `${pregnancyProgress(pregnancy.due_date).label}`
      : scope.scope === 'postpartum' ? tr('pj.home.sub.postpartum')
        : scope.scope === 'family' ? tr('pj.home.sub.family')
          : cycleMode === 'ttc' ? tr('home.sub.ttc') : cycleMode ? tr('home.sub.cycle') : undefined;

  const article = useMemo(() => {
    const list = suggestArticles(articles ?? [], {
      journeys: LEGACY_FOR[scope.scope],
      weekSA: scope.scope === 'pregnancy' && pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null,
      childAgesMonths: child ? [childAge(child.birth_date).months] : scope.scope === 'family' ? (children ?? []).map((c) => childAge(c.birth_date).months) : [],
      postpartum: scope.scope === 'postpartum',
      multiple: scope.scope === 'pregnancy' && !!pregnancy && pregnancy.multiplicity !== 'single',
    }, 6);
    return articleOfDay(list);
  }, [articles, scope.scope, pregnancy, child, children]);

  // Raccourcis : ceux choisis par la personne, mais seulement s'ils sont autorisés pour le profil affiché
  const allowed = quickFor(scope);
  const custom = (quickShortcuts ?? []).filter((k) => quickAllowed(k, scope));
  const quickKeys = custom.length >= 3 ? custom : allowed;
  const journeyName = js.body ? tr(`pj.type.${js.body.type}` as TKey) : null;
  const cards: Record<string, React.ReactNode> = {
    main: mainLoading ? <Skeleton kind="card" rows={1} />
      : mainError ? <ErrorView error={mainError.error} onRetry={() => { void profileQ.refetch(); void childrenQ.refetch(); }} />
      : scope.scope === 'pregnancy' && pregnancy ? <PregnancyHero pregnancy={pregnancy} />
      : scope.scope === 'baby' && child ? <ChildToday child={child} compact />
      : scope.scope === 'child' && child ? <ChildHomeCard child={child} />
      : scope.scope === 'postpartum' ? <PostpartumHomeCard main />
      : scope.scope === 'family' ? <FamilyOverview />
      : cycleMode ? <CycleCard mode={cycleMode} />
      : <NoJourneyCard />,
    quick: <QuickActions keys={quickKeys} childId={scope.childId ?? scope.babyId ?? undefined} onCustomize={() => router.push('/settings/home')} />,
    upcoming: <View style={{ gap: spacing.xs }}>{simple ? null : <PostpartumHomeCard />}<UpcomingCard single={simple} /></View>,
    article: article ? (
      <Card onPress={() => router.push(`/article/${article.slug}`)} accessibilityLabel={tr('home.articleA11y', { title: article.title })}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>{tr('home.article')}</Text>
          {isLocked(article, premium) && <Icon name="lock" size={14} color={t.colors.gold} />}
        </Row>
        <Text variant="heading" style={{ marginTop: 4 }}>{article.title}</Text>
        <Text variant="small" muted numberOfLines={2} intentionalTruncation>{article.summary}</Text>
      </Card>
    ) : null,
    recipe: <HomeRecipeCard />,
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
        {/* Ligne du haut : date à gauche ; aide, notifications, Réglages et Profil à droite. Salutation pleine largeur dessous. */}
        <View style={{ gap: 2, marginTop: spacing.xs }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="small" muted weight="bold" style={{ flexShrink: 1 }}>{formatDate(now, { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase())}</Text>
            <Row gap={0}>
              <IconButton icon="life-buoy" label={tr('home.helpA11y')} color={t.colors.heart} onPress={() => router.push('/emergency')} />
              <View>
                <IconButton icon="bell" label={unread ? tr('home.notificationsUnread', { count: unread }) : tr('home.notifications')} onPress={() => router.push('/notifications')} />
                {unread > 0 && <View style={{ position: 'absolute', top: 11, right: 11, width: 9, height: 9, borderRadius: 5, backgroundColor: t.colors.heart }} />}
              </View>
              <AccountActions />
            </Row>
          </Row>
          <Text variant="title" accessibilityRole="header">{greeting(profile?.display_name, now)}</Text>
          {subtitle ? <Text variant="small" muted>{subtitle}</Text> : null}
        </View>

        {/* 1. Parcours et profil actifs */}
        <Appear kind="soft" delay={0.1} style={{ gap: 4 }}>
          {simple ? null : <Tappable accessibilityRole="button" testID="home-journey" accessibilityLabel={tr('pj.home.journeyA11y', { name: journeyName ?? tr('pj.none') })} onPress={() => router.push('/journeys')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 }}>
            <Icon name="compass" size={14} color={t.colors.textMuted} />
            <Text variant="caption" muted style={{ flex: 1 }}>{tr('pj.home.journey', { name: journeyName ?? tr('pj.none') })}</Text>
            <Text variant="caption" weight="bold" color={t.colors.primary}>{tr('pj.edit')}</Text>
          </Tappable>}
          <ProfileSwitcher />
        </Appear>
        {!offline.online && <Banner tone="warning" title={tr('home.offline')}>{offline.pending.length ? tr('home.offlinePending', { count: offline.pending.length }) : tr('home.offlineBody')}</Banner>}

        {/* Cartes de l'accueil, dans l'ordre choisi (Réglages › Mon accueil) */}
        {homeCards.map((key, i) => {
          const node = cards[key];
          if (!node) return null;
          return <Appear key={key} kind={key === 'main' ? 'pop' : key === 'assistant' ? 'btn' : 'soft'} delay={0.2 + Math.min(i, 6) * 0.08}><View testID={`home-card-${key}`}>{node}</View></Appear>;
        })}

        <Appear kind="side" delay={0.7}>
          <Button label={tr('pj.allTools')} icon="grid" variant="secondary" onPress={() => router.push('/tools')} full testID="all-tools" />
        </Appear>

        <DemoBanner />
      </Screen>
    </View>
  );
}
