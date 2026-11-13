/**
 * En tête : « Aujourd'hui dans le foyer » (src/features/homeToday : tâches et missions du jour, agenda, relais, ajouter / terminer).
 * Accueil volontairement court (profil « Suivre mon cycle » : calendrier, 5 raccourcis, une carte intelligente et le prochain
 * rappel seulement) : carte principale du profil affiché, les 4 actions du quotidien, le prochain rappel,
 * une publication de la communauté choisie pour vous (+ « Voir la communauté »), une recommandation (article ou repas).
 * La communauté complète reste dans son onglet ; les autres cartes se réactivent dans Réglages › Mon accueil.
 */
import { BadgeDot } from '@/components/Motion';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { TAB_SCREEN_INSET } from '@/components/Dock';
import { Cascade } from '@/motion';
import { DemoBanner, ProfileSwitcher } from '@/components/Family';
import { ErrorView, Skeleton } from '@/components/States';
import { Banner, Card, Icon, IconButton, Row, Text } from '@/components/ui';
import { PostpartumHomeCard } from '@/features/postpartum';
import { effectiveHidden, orderedHomeCards, PregnancyHero, setCycleRoute, UpcomingCard } from '@/features/home';
import { StoryHomeStrip } from '@/features/story/StoryHomeStrip';
import { OutingsHomeCard } from '@/features/outings/OutingsHomeCard';
import { DailyActions } from '@/features/dailyActions/DailyActions';
import { FamilyOverview, NoJourneyCard } from '@/features/journeys';
import { useActivePregnancy, useArticle, useArticles, useJourneyState, usePremium, useProfile, useTrackedChildren } from '@/lib/data/hooks';
import { useRelevantNotifications, useScope } from '@/lib/data/hooks-scope';
import { HomeRecipeCard } from '@/features/recipes/HomeRecipeCard';
import { HomeAssistantCard } from '@/features/aiHome/HomeAssistantCard';
import { HomeLibraryCard } from '@/features/library/HomeLibraryCard';
import { SoloHomeCard } from '@/features/solo/SoloHomeCard';
import { HomeVideosCard } from '@/features/videos/HomeVideosCard';
import { HomeCommunityCard } from '@/features/communitySocial';
import { CycleHome } from '@/features/cycle3/CycleHome';
import { ArticleCard, Cocoon, CocoonAdd } from '@/features/cocoon/Cocoon';
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
import { ToolSearchButton } from '@/features/hubs/ToolSearch';
import { HomeToday } from '@/features/homeToday';

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
  const journeysFailed = !scope.loaded && js.query.isError;
  const mainLoading = (profileQ.isLoading && !profile) || (childrenQ.isLoading && !children) || (!scope.loaded && !journeysFailed);
  const mainError = profileQ.isError && !profile ? profileQ : childrenQ.isError && !children ? childrenQ : journeysFailed ? js.query : null;
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
  // Profil enfant : « Le cocon du jour » (bulles, cocon, frise, trois informations, « + Ajouter », un conseil)
  const childScope = (scope.scope === 'baby' || scope.scope === 'child') && child ? scope.scope : null;
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

  const picked = useMemo(() => {
    const list = suggestArticles(articles ?? [], {
      journeys: LEGACY_FOR[scope.scope],
      weekSA: scope.scope === 'pregnancy' && pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null,
      childAgesMonths: child ? [childAge(child.birth_date).months] : scope.scope === 'family' ? (children ?? []).map((c) => childAge(c.birth_date).months) : [],
      postpartum: scope.scope === 'postpartum',
      multiple: scope.scope === 'pregnancy' && !!pregnancy && pregnancy.multiplicity !== 'single',
    }, 6);
    return articleOfDay(list);
  }, [articles, scope.scope, pregnancy, child, children]);
  // La liste ne contient pas le texte : la carte (temps de lecture) reçoit l'article choisi, lu en entier (une requête)
  const article = useArticle(picked?.slug).data ?? null;

  // Raccourcis : ceux choisis par la personne, mais seulement s'ils sont autorisés pour le profil affiché
  const allowed = quickFor(scope);
  const custom = (quickShortcuts ?? []).filter((k) => quickAllowed(k, scope));
  const quickKeys = custom.length >= 3 ? custom : allowed;
  const journeyName = js.body ? tr(`pj.type.${js.body.type}` as TKey) : null;
  const cards: Record<string, React.ReactNode> = {
    main: mainLoading ? <Skeleton kind="card" rows={1} />
      : mainError ? <ErrorView error={mainError.error} onRetry={() => { void profileQ.refetch(); void childrenQ.refetch(); void js.query.refetch(); }} />
      : scope.scope === 'pregnancy' && pregnancy ? <PregnancyHero pregnancy={pregnancy} />
      : childScope && child ? <Cocoon key={child.id} child={child} journey={childScope} now={now} article={article} />
      : scope.scope === 'postpartum' ? <PostpartumHomeCard main />
      : scope.scope === 'family' ? <FamilyOverview />
      : cycleMode ? <CycleHome goal={cycleMode} />
      : <NoJourneyCard />,
    // Les 4 actions du quotidien : cartes de suivi pour un enfant ou une grossesse, sinon les raccourcis du profil
    // « Mes actions du jour » : une carte horizontale, 4 raccourcis du profil affiché au maximum (personnalisables)
    quick: <DailyActions />,
    outings: <OutingsHomeCard />,
    community: <HomeCommunityCard />,
    upcoming: <View style={{ gap: spacing.xs }}>{simple ? null : <PostpartumHomeCard />}<UpcomingCard single={simple} /></View>,
    article: article ? <ArticleCard article={article} premium={premium} /> : null,
    recipe: <HomeRecipeCard />,
    recommendation: null as React.ReactNode,
    assistant: <HomeAssistantCard />,
    library: <HomeLibraryCard />,
    solo: <SoloHomeCard />,
    videos: <HomeVideosCard />,
  };
  // « Suivre mon cycle » : l'accueil ne montre que le calendrier, les 5 raccourcis, une carte intelligente et le prochain rappel
  // Profil enfant : le cocon remplace les cartes par défaut ; les cartes facultatives que le parent a lui-même
  // activées dans Réglages › Mon accueil (recette, question) restent affichées en dessous
  // « Mon assistant IA » reste visible dans tous les modes (sauf si la personne l'a masqué dans Mon accueil)
  const aiShown = !effectiveHidden(homeOrder, homeHidden).includes('assistant');
  const libShown = !effectiveHidden(homeOrder, homeHidden).includes('library');
  const homeCards = cycleMode && !mainLoading && !mainError ? ['main', ...(aiShown ? ['assistant'] : []), ...(libShown ? ['library'] : [])]
    : childScope && !mainLoading && !mainError ? ['main', ...orderedHomeCards(homeOrder, homeHidden).filter((k) => k === 'recipe' || k === 'assistant' || k === 'solo' || k === 'videos' || k === 'library' || k === 'outings')]
      : orderedHomeCards(homeOrder, homeHidden);
  // Recommandation du jour : l'article adapté s'il existe, sinon une idée de repas — sans doublon si ces cartes sont déjà affichées
  cards.recommendation = (!homeCards.includes('article') ? cards.article : null) ?? (!homeCards.includes('recipe') ? cards.recipe : null);

  return (
    <View style={{ flex: 1 }}>
      <Screen bottomInset={TAB_SCREEN_INSET}>
        {/* En-tête */}
        {/* Ligne du haut : date à gauche ; aide, notifications, Réglages et Profil à droite. Salutation pleine largeur dessous. */}
        <View style={{ gap: 2, marginTop: spacing.xs }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="small" muted weight="bold" style={{ flexShrink: 1 }}>{formatDate(now, { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase())}</Text>
            <Row gap={0}>
              <IconButton icon="life-buoy" label={tr('home.helpA11y')} color={t.colors.heart} onPress={() => router.push('/emergency')} />
              <View>
                <IconButton icon="bell" label={unread ? tr('home.notificationsUnread', { count: unread }) : tr('home.notifications')} onPress={() => router.push('/notifications')} />
                <BadgeDot count={unread} style={{ position: 'absolute', top: 11, right: 11, width: 9, height: 9, borderRadius: 5, backgroundColor: t.colors.heart }} />
              </View>
              <AccountActions />
            </Row>
          </Row>
          <Text variant="title" accessibilityRole="header">{greeting(profile?.display_name, now)}</Text>
          {subtitle && !childScope ? <Text variant="small" muted>{subtitle}</Text> : null}
        </View>
        {/* HOMI : « Aujourd'hui dans le foyer » en tête — ce qui est prévu, qui s'en charge, ajouter / terminer */}
        <HomeToday />
        {/* Seule entrée de recherche d'outils de l'accueil (la feuille donne aussi accès à « Tous les outils ») */}
        <ToolSearchButton testID="home-tool-search" />

        {/* 1. Parcours et profil actifs */}
        <Cascade index={0} style={{ gap: 4 }}>
          {simple ? null : <Tappable accessibilityRole="button" testID="home-journey" accessibilityLabel={tr('pj.home.journeyA11y', { name: journeyName ?? tr('pj.none') })} onPress={() => router.push('/journeys')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 }}>
            <Icon name="compass" size={14} color={t.colors.textMuted} />
            <Text variant="caption" muted style={{ flex: 1 }}>{tr('pj.home.journey', { name: journeyName ?? tr('pj.none') })}</Text>
            <Text variant="caption" weight="bold" color={t.colors.primary}>{tr('pj.edit')}</Text>
          </Tappable>}
          <ProfileSwitcher variant={childScope && !mainLoading ? 'bubbles' : 'card'} />
        </Cascade>
        {/* « HOMI » : l'étape du profil affiché, discrète, au-dessus des cartes utiles */}
        {!mainLoading && !effectiveHidden(homeOrder, homeHidden).includes('story') ? <Cascade index={1}><StoryHomeStrip /></Cascade> : null}
        {!offline.online && <Banner tone="warning" title={tr('home.offline')}>{offline.pending.length ? tr('home.offlinePending', { count: offline.pending.length }) : tr('home.offlineBody')}</Banner>}

        {/* Cartes de l'accueil, dans l'ordre choisi (Réglages › Mon accueil) */}
        {homeCards.map((key, i) => {
          const node = cards[key];
          if (!node) return null;
          return <Cascade key={key} index={2 + i}><View testID={`home-card-${key}`}>{node}</View></Cascade>;
        })}

        <DemoBanner />
      </Screen>
      {childScope && child && !mainLoading ? <CocoonAdd key={child.id} child={child} journey={childScope} /> : null}
    </View>
  );
}
