/**
 * « Aujourd'hui » — tableau de bord (refonte du 17/11/2026) : que dois-je faire maintenant ?
 *
 * En-tête FIXE : (1) bonjour + date + profil actif (sélecteur universel, indicateur de pages) et l'entrée « Outils ».
 * Puis les modules, dans l'ordre de la configuration de la situation affichée (`HOME_PRESETS`, déclaratif : grossesse,
 * nouveau-né, enfant, couple, famille, cycle, moi) ou dans celui choisi par la personne :
 * (2) prochaine action importante ; (3) actions rapides ; (4) résumé du profil ; (5) agenda du jour du profil ;
 * (6) recommandation ; (7) articles compacts ; puis les modules facultatifs.
 *
 * Glisser à gauche / à droite sur le tableau de bord passe au profil suivant / précédent (`ProfileSwipe`) : tout
 * l'accueil se met à jour ENSEMBLE (`ProfileStage` : sortie, rendu à neuf sous la clé du profil, entrée en cascade) ;
 * les carrousels internes gardent leur défilement. « Personnaliser », en bas, ouvre le mode
 * édition SUR PLACE (le même éditeur que Réglages › Mon accueil).
 * La Communauté s'ouvre par le bouton en haut à droite (`AccountActions`) ; l'ajout par l'action centrale de la barre.
 */
import { NapHomeCard } from '@/features/napLive/NapHomeCard';
import { BreastHomeCard } from '@/features/breastTrack/BreastHomeCard';
import { BottleHomeCard } from '@/features/quickTrack/BottleLog';
import { CycleHomeLast } from '@/features/cycleTrack/CycleOverview';
import { BadgeDot } from '@/components/Motion';
import React, { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useScreenScroll } from '@/components/screenChrome';
import { TAB_SCREEN_INSET } from '@/components/Dock';
import { Cascade } from '@/motion';
import { DemoBanner } from '@/components/Family';
import { ProfileSwipe, ProfileSwitcher, SwipeExclude, useActiveProfileKey } from '@/components/ProfileSwitcher';
import { ProfileStage } from '@/components/profileTransition';
import { ErrorView } from '@/components/States';
import { Banner, Button, Icon, Row, Text } from '@/components/ui';
import { GlassIconButton } from '@/components/glass';
import { PostpartumHomeCard } from '@/features/postpartum';
import { PregnancyHero, setCycleRoute, UpcomingCard } from '@/features/home';
import { StoryHomeStrip } from '@/features/story/StoryHomeStrip';
import { OutingsHomeCard } from '@/features/outings/OutingsHomeCard';
import { DailyActions } from '@/features/dailyActions/DailyActions';
import { FamilyOverview, NoJourneyCard } from '@/features/journeys';
import { useActivePregnancy, useArticle, useArticles, useHouseholdMembers, useJourneyState, usePremium, useProfile, useTrackedChildren, useMyMembership } from '@/lib/data/hooks';
import { useRelevantNotifications, useScope } from '@/lib/data/hooks-scope';
import { HomeRecipeCard } from '@/features/recipes/HomeRecipeCard';
import { HomeAssistantCard } from '@/features/aiHome/HomeAssistantCard';
import { HomeLibraryCard } from '@/features/library/HomeLibraryCard';
import { SoloHomeCard } from '@/features/solo/SoloHomeCard';
import { HomeVideosCard } from '@/features/videos/HomeVideosCard';
import { HomeCommunityCard } from '@/features/communitySocial';
import { CycleHome } from '@/features/cycle3/CycleHome';
import { ArticleCard, Cocoon } from '@/features/cocoon/Cocoon';
import type { Scope } from '@/lib/journeys/tools';
import type { Journey } from '@/lib/types';
import { greeting } from '@/lib/domain/dates';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { childAge } from '@/lib/domain/child';
import { suggestArticles } from '@/lib/domain/content';
import { articleOfDay } from '@/lib/domain/journeys';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useOfflineStore } from '@/lib/offline';
import { useUiStore } from '@/lib/store';
import { useUserId } from '@/lib/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, previewTime, spacing } from '@/theme/tokens';
import { AccountActions, HEADER_GAP, HEADER_ICON } from '@/components/AccountActions';
import { BrandName } from '@/components/BrandLogo';
import { BRAND } from '@/config/brand';
import { ThemePickerButton } from '@/features/themePicker/ThemePicker';
import { AuraHomeEntry } from '@/features/aura/AuraEntry';
import { Tappable } from '@/components/Tappable';
import { TodayAgenda, TodayNext, useTodayScene, type TodayProfile } from '@/features/homeToday';
import { coparentSituation } from '@/features/homeToday/coparentHome';
import { homeSituation, resolveHomeLayout, shownModules, type HomeModuleKey } from '@/features/homeToday/homeLayout';
import { TourResumeCard } from '@/features/tour/TourEntry';
import { ContinueModule, ExploreModule, ForYouModule, YourChildModule } from '@/features/homeToday/ToolSections';
import { useTourAnchor } from '@/features/tour/anchors';
import { tourEvent } from '@/features/tour/store';
import { ArticlesCompact, ChildInfoModule, FamilyTasksModule, HomeCardSkeleton, HomeEditor, PinnedTools, ToolsEntry } from '@/features/homeToday/HomeModules';

/** Visite guidée : l'éditeur de l'accueil vient de s'ouvrir (étape « Personnaliser l'accueil »). */
const EDITOR_OPENED = { type: 'editorOpened' } as const;

/** Parcours historiques équivalents à la portée affichée (suggestion d'articles). */
const LEGACY_FOR: Record<Scope, Journey[]> = {
  avoid: ['avoid'], ttc: ['ttc'], cycle: ['cycle'], none: [], pregnancy: ['pregnant'], postpartum: ['newborn'], baby: ['newborn'], child: ['child'], family: ['family', 'child'],
};

/** « Personnaliser » : remonte en haut de l'écran, où s'ouvre le mode édition. */
function CustomizeButton({ onPress }: { onPress: () => void }) {
  const scroll = useScreenScroll();
  const anchor = useTourAnchor('home-customize');
  return <View {...anchor}><Button label={tr('hm.customize')} icon="sliders" variant="secondary" full testID="home-customize" onPress={() => { scroll.scrollToTop(false); onPress(); }} /></View>;
}

/** Carte de l'accueil, ancre de la visite pour « prochaine action » et « actions rapides ». */
function HomeCard({ id, children }: { id: string; children: React.ReactNode }) {
  const anchor = useTourAnchor(`home-${id}`);
  return <View testID={`home-card-${id}`} {...anchor}>{children}</View>;
}

export default function Home() {
  const t = useTheme();
  const { width: winW } = useWindowDimensions();
  const narrow = winW < 360;
  const me = useUserId();
  const profileQ = useProfile();
  const profile = profileQ.data;
  // Portée affichée = profil du sélecteur + parcours actif : seule source de l'accueil (jamais un ancien parcours)
  const scope = useScope();
  const pregnancy = useActivePregnancy();
  const childrenQ = useTrackedChildren();
  const children = childrenQ.data;
  const js = useJourneyState();
  const { data: members } = useHouseholdMembers();
  const journeysFailed = !scope.loaded && js.query.isError;
  const mainLoading = (profileQ.isLoading && !profile) || (childrenQ.isLoading && !children) || (!scope.loaded && !journeysFailed);
  const mainError = profileQ.isError && !profile ? profileQ : childrenQ.isError && !children ? childrenQ : journeysFailed ? js.query : null;
  const { data: articles } = useArticles();
  const { data: inbox } = useRelevantNotifications();
  const premium = usePremium();
  const offline = useOfflineStore();
  const skyOverride = useUiStore((st) => st.skyOverride);
  const simple = useUiStore((st) => st.simpleMode);
  const [editing, setEditing] = useState(false);
  const profileKey = useActiveProfileKey();
  const now = skyOverride ? previewTime(skyOverride) : new Date();

  const unread = inbox?.filter((n) => !n.read_at).length ?? 0;
  const child = scope.child;
  const childScope = (scope.scope === 'baby' || scope.scope === 'child') && child ? scope.scope : null;
  const cycleMode = scope.scope === 'avoid' || scope.scope === 'ttc' || scope.scope === 'cycle' ? scope.scope : null;
  setCycleRoute(cycleMode === 'avoid' ? '/contraception' : cycleMode === 'cycle' ? '/cycle' : '/fertility');

  // Situation affichée → configuration du tableau de bord (déclarative), puis choix de la personne pour cette situation
  const membership = useMyMembership();
  const adults = (members ?? []).filter((m) => m.role === 'owner' || m.role === 'coparent').length;
  // Co-parent (adulte qui n'a pas créé le foyer) : accueil « coparent » sur « Moi » / « couple » (jamais les données
  // privées de l'autre adulte)
  const situation = coparentSituation(homeSituation({ scope: scope.scope, adults, children: children?.length ?? 0, pregnancy: !!pregnancy }), membership?.role);
  const saved = useUiStore((st) => st.homeLayouts[situation]);
  const modules = useMemo(() => shownModules(resolveHomeLayout(situation, saved)), [situation, saved]);

  // Journée du profil affiché : agenda, relais et garde suivent le profil (tâches : celles du foyer, les miennes pour « Moi »)
  const todayProfile = useMemo<TodayProfile>(() => (
    childScope && child ? { kind: 'child', childId: child.id }
      : scope.scope === 'pregnancy' && pregnancy ? { kind: 'pregnancy', pregnancyId: pregnancy.id }
        : scope.scope === 'family' ? { kind: 'all' } : { kind: 'me', userId: me }
  ), [childScope, child, scope.scope, pregnancy, me]);
  const scene = useTodayScene({ profile: todayProfile });
  const agendaFor = todayProfile.kind === 'child' && child ? tr('ht.for.child', { name: child.first_name })
    : todayProfile.kind === 'pregnancy' ? tr('ht.for.pregnancy') : todayProfile.kind === 'me' ? tr('ht.for.me') : tr('ht.for.all');

  // La semaine d'aménorrhée n'apparaît QUE pour une grossesse active affichée
  const subtitle = childScope && child ? `${child.first_name}, ${childAge(child.birth_date).label}`
    : scope.scope === 'pregnancy' && pregnancy ? `${pregnancyProgress(pregnancy.due_date).label}`
      : scope.scope === 'postpartum' ? tr('pj.home.sub.postpartum')
        : scope.scope === 'family' ? tr('pj.home.sub.family')
          : cycleMode === 'ttc' ? tr('home.sub.ttc') : cycleMode ? tr('home.sub.cycle') : undefined;

  const suggested = useMemo(() => suggestArticles(articles ?? [], {
    journeys: LEGACY_FOR[scope.scope],
    weekSA: scope.scope === 'pregnancy' && pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null,
    childAgesMonths: child ? [childAge(child.birth_date).months] : scope.scope === 'family' ? (children ?? []).map((c) => childAge(c.birth_date).months) : [],
    postpartum: scope.scope === 'postpartum',
    multiple: scope.scope === 'pregnancy' && !!pregnancy && pregnancy.multiplicity !== 'single',
  }, 6), [articles, scope.scope, pregnancy, child, children]);
  const picked = articleOfDay(suggested);
  // La liste ne contient pas le texte : la carte (temps de lecture) reçoit l'article choisi, lu en entier (une requête)
  const article = useArticle(picked?.slug).data ?? null;
  const articleCard = article ? <ArticleCard article={article} premium={premium} /> : null;

  const journeyName = js.body ? tr(`pj.type.${js.body.type}` as TKey) : null;
  const art = scope.scope === 'pregnancy' ? 'grossesse' : scope.scope === 'baby' || scope.scope === 'postpartum' ? 'bebe' : scope.scope === 'child' ? 'enfants' : cycleMode ? 'cycle' : 'foyer';
  const cards: Record<HomeModuleKey, React.ReactNode> = {
    // (2) Prochaine action importante : prochain événement, puis ce qui attend une réponse
    next: <TodayNext scene={scene} art={art} compactEmpty />,
    // (3) Actions rapides du profil (personnalisables) ; carrousel : son défilement passe avant le glissement de profil
    quick: mainLoading ? null : <DailyActions />,
    // (4) Résumé du profil sélectionné
    main: mainLoading ? <HomeCardSkeleton />
      : mainError ? <ErrorView error={mainError.error} onRetry={() => { void profileQ.refetch(); void childrenQ.refetch(); void js.query.refetch(); }} />
      : scope.scope === 'pregnancy' && pregnancy ? <PregnancyHero pregnancy={pregnancy} />
      : childScope && child ? <Cocoon key={child.id} child={child} journey={childScope} now={now} article={article} />
      : scope.scope === 'postpartum' ? <PostpartumHomeCard main />
      : scope.scope === 'family' ? <FamilyOverview />
      : cycleMode ? <CycleHome goal={cycleMode} />
      : <NoJourneyCard />,
    // (5) Agenda du jour, pour le profil affiché
    agenda: <TodayAgenda scene={scene} caption={agendaFor} />,
    // (6) Recommandation : l'article adapté, sinon une idée de repas — sans doublon avec les modules « article » / « recette »
    recommendation: (!modules.includes('article') && !childScope ? articleCard : null) ?? (!modules.includes('recipe') ? <HomeRecipeCard /> : null),
    // (7) Articles en format compact
    articles: <ArticlesCompact articles={suggested.filter((a) => a.slug !== picked?.slug || !!childScope)} premium={premium} />,
    familyTasks: <FamilyTasksModule />,
    childInfo: <ChildInfoModule activeChildId={scope.childId ?? null} />,
    tools: <PinnedTools />,
    // Sections d'outils (20/11/2026) : moteur de recommandation déterministe, raison affichée en petit
    forYou: mainLoading ? null : <ForYouModule />,
    continue: <ContinueModule />,
    yourChild: mainLoading ? null : <YourChildModule />,
    explore: <ExploreModule />,
    upcoming: <View style={{ gap: spacing.xs }}>{simple ? null : <PostpartumHomeCard />}<UpcomingCard single={simple} /></View>,
    assistant: <HomeAssistantCard />,
    community: <SwipeExclude><HomeCommunityCard /></SwipeExclude>,
    outings: <OutingsHomeCard />,
    videos: <HomeVideosCard />,
    library: <HomeLibraryCard />,
    solo: <SoloHomeCard />,
    story: mainLoading ? null : <StoryHomeStrip />,
    recipe: <HomeRecipeCard />,
    article: articleCard,
  };

  return (
    <Screen bottomInset={TAB_SCREEN_INSET} reorder contentStyle={{ paddingHorizontal: narrow ? spacing.md : 20 }}>
      {/* (1) Bonjour + date + profil actif. Coin supérieur droit (21/11/2026) : urgences, notifications, Communauté
          (nommée), avatar ; les Réglages sont derrière l'avatar (feuille « Mon compte », qui rappelle aussi les Urgences). */}
      <View style={{ gap: 2, marginTop: spacing.xs }}>
        {/* Référence 01 (21/11/2026) : mot-symbole HOMI, cloche et palette à gauche ; urgences, Communauté et avatar à droite.
            Tout tient à 320 pt (cibles de 44 pt, marges de 16 pt sous 360 pt, Communauté en pictogramme sur l'accueil). */}
        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }} gap={HEADER_GAP}>
          <Row style={{ alignItems: 'center', flexShrink: 1 }} gap={narrow ? 2 : HEADER_GAP}>
            <View accessible accessibilityRole="header" accessibilityLabel={BRAND.name} style={{ paddingRight: narrow ? 2 : spacing.xs }} testID="home-wordmark">
              <BrandName size={narrow ? 17 : 20} line={HEADER_ICON} tone="mono" color={t.colors.text} />
            </View>
            <View>
              <GlassIconButton icon="bell" glyph="notifications" label={unread ? tr('home.notificationsUnread', { count: unread }) : tr('home.notifications')} size={HEADER_ICON} testID="home-bell" onPress={() => router.push('/notifications')} />
              <BadgeDot count={unread} style={{ position: 'absolute', top: 9, right: 9, width: 9, height: 9, borderRadius: 5, backgroundColor: t.colors.heart }} />
            </View>
            <ThemePickerButton size={HEADER_ICON} />
          </Row>
          <Row style={{ alignItems: 'center' }} gap={narrow ? 2 : HEADER_GAP}>
            <GlassIconButton icon="life-buoy" glyph="emergency" label={tr('home.helpA11y')} size={HEADER_ICON} color={t.colors.heart} testID="home-help" onPress={() => router.push('/emergency')} />
            <AccountActions communityIcon />
          </Row>
        </Row>
        <Text variant="title" accessibilityRole="header">{greeting(profile?.display_name, now)}</Text>
        <Text variant="small" muted testID="home-date">{[formatDate(now, { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase()), subtitle].filter(Boolean).join(' · ')}</Text>
      </View>
      <ProfileSwitcher pager />
      {/* « Outils » : entrée fixe et évidente (aussi dans l'action centrale de la barre) */}
      <ToolsEntry />
      {/* Aura en une interaction depuis l'accueil */}
      <AuraHomeEntry />
      {/* Visite guidée interrompue : reprise discrète, masquable */}
      <TourResumeCard />
      {!offline.online && <Banner tone="warning" title={tr('home.offline')}>{offline.pending.length ? tr('home.offlinePending', { count: offline.pending.length }) : tr('home.offlineBody')}</Banner>}

      {editing ? <HomeEditor situation={situation} onDone={() => setEditing(false)} /> : (
        <ProfileSwipe>
          {/* Rendu PAR PROFIL : au changement de profil, l'ancien tableau de bord s'efface, le nouveau est monté à neuf
              (vraies données du nouveau profil) et ses cartes entrent en cascade (`profileTransition`) */}
          <ProfileStage profileKey={profileKey} style={{ gap: spacing.md }} testID="home-stage">
          {/* Maintenant : la sieste de l'enfant affiché passe avant tout le reste (en cours ou dernière du jour) */}
          {childScope && child ? <NapHomeCard child={child} /> : null}
          {childScope && child ? <BreastHomeCard child={child} /> : null}
          {childScope && child ? <BottleHomeCard child={child} /> : null}
          {/* Profil cycle : dernière saisie du cycle (jamais l'intime ; rien si « masquer sur l'accueil ») → son app sur ce jour */}
          {cycleMode ? <CycleHomeLast /> : null}
          {modules.map((key, i) => {
            const node = cards[key];
            if (!node) return null;
            return <Cascade key={key} index={i}><HomeCard id={key}>{node}</HomeCard></Cascade>;
          })}
          {simple ? null : (
            <Tappable accessibilityRole="button" testID="home-journey" accessibilityLabel={tr('pj.home.journeyA11y', { name: journeyName ?? tr('pj.none') })} onPress={() => router.push('/journeys')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: MIN_TOUCH }}>
              <Icon name="compass" size={14} color={t.colors.textMuted} />
              <Text variant="caption" muted style={{ flex: 1 }}>{tr('pj.home.journey', { name: journeyName ?? tr('pj.none') })}</Text>
              <Text variant="caption" weight="bold" color={t.colors.primary}>{tr('pj.edit')}</Text>
            </Tappable>
          )}
          {/* Personnalisation sur place : réordonner, masquer, actions rapides, outils épinglés, rétablir */}
          <CustomizeButton onPress={() => { setEditing(true); tourEvent(EDITOR_OPENED); }} />
          </ProfileStage>
        </ProfileSwipe>
      )}
      <DemoBanner />
    </Screen>
  );
}
