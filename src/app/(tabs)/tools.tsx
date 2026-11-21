/**
 * « Mes outils » — le centre d'outils (refonte du 17/11/2026, verre branché le 18/11/2026).
 *
 * De haut en bas : la recherche par besoin (`GlassSearchBar` : anneau de focus, effacer ; champ vide et actif :
 * catégories suggérées) ; « Mes favoris » (et les outils ouverts récemment) en TUILES de verre compactes qui s'ouvrent
 * directement ; « Pour <profil affiché> » (les 6 plus utiles) en tuiles, rendues PAR PROFIL (`ProfileStage`) ; puis les
 * 9 catégories en liste opaque, chacune ouvrant la liste de ses outils ; enfin la Communauté, un espace À PART.
 * Tout outil est à deux appuis au plus (catégorie → outil), ou à un appui depuis la recherche.
 *
 * Verre ou pas : les tuiles (pictogramme + nom) sont de petites surfaces → verre `card` ; les RÉSULTATS de recherche
 * et les listes (nom + description de 4 lignes) restent des cartes OPAQUES (`ToolRow`) : on ne lit pas à travers
 * une vitre (HOMI_DESIGN_SYSTEM.md § 10).
 *
 * Une rangée ou une tuile ouvre la fiche de l'outil (ce que ça fait, problème résolu, aperçu, « Commencer ») la
 * première fois, puis l'outil directement une fois qu'il est connu ; l'appui long fait l'inverse. Les urgences restent
 * en tête. Recherche : index local de besoins (src/lib/domain/toolSearch.ts, inchangé) ; quand rien ne correspond,
 * l'écran le dit et propose les catégories — jamais de résultat au hasard. Résultats : apparition en décalé léger.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ErrorView } from '@/components/States';
import { TAB_SCREEN_INSET } from '@/components/Dock';
import { ProfileSwitcher, useActiveProfileKey } from '@/components/ProfileSwitcher';
import { ProfileStage } from '@/components/profileTransition';
import { GlassSearchBar } from '@/components/glass';
import { glyphColor, tint, ToolGlyph } from '@/components/ToolGlyph';
import { Tappable } from '@/components/Tappable';
import { Button, Icon, Text } from '@/components/ui';
import { SkeletonBone, SkeletonPulse, StaggerList } from '@/motion';
import { CategoryChips, CategoryLegend, CategoryList } from '@/features/toolHub/CategoryList';
import { PreviewBanner, ToolsIntro, useToolLock, useToolsIntro } from '@/features/toolHub/ToolsIntro';
import { AppsLogo } from '@/brand/toolGlass/AppsLogo';
import { FavoriteStar, ToolRow, ToolRowsSkeleton } from '@/features/toolHub/ToolRow';
import { TOOL_TILE, ToolTile } from '@/features/toolHub/ToolTile';
import { useToolHub, type ToolEntry } from '@/features/toolHub/useToolHub';
import { useProfile } from '@/lib/data/hooks';
import { communityEntry, featuredTools, type CatalogTool } from '@/lib/domain/toolCatalog';
import { searchCatalog } from '@/lib/domain/toolSearch';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { useTourAnchor } from '@/features/tour/anchors';
import { CatalogFilterBar, FilteredCatalog } from '@/features/toolHub/CatalogFilterBar';
import { filtersActive, NO_FILTERS, type CatalogFilters } from '@/lib/domain/catalogFilters';

/** Largeur utile maximale (tablette, ordinateur) : les listes restent lisibles et centrées, jamais étirées. */
const MAX_W = 720;

export default function Tools() {
  const profileQ = useProfile();
  const hub = useToolHub();
  const { width: winW } = useWindowDimensions();
  const profileKey = useActiveProfileKey();
  const { scope, catalog, all, allTools, account } = hub;
  const params = useLocalSearchParams<{ q?: string }>();
  const [q, setQ] = useState(typeof params.q === 'string' ? params.q : '');
  // Catalogue complet filtré (20/11/2026) : catégorie, âge, étape de vie, favoris, récents — combinables
  const [filters, setFilters] = useState<CatalogFilters>(NO_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const filtering = filtersActive(filters);
  const [searching, setSearching] = useState(false);
  const query = q.trim();

  // Recherche dans tous les outils atteignables (profil affiché et autres profils) et dans les réglages
  // (20/11/2026) les 200 entrées : outils et fonctions nommées, chacune avec son profil
  const searchable = useMemo(() => [...hub.flat.map((e) => e.tool), ...account], [hub.flat, account]);
  const entryOf = useMemo(() => new Map<string, ToolEntry>([...hub.flat.map((e) => [e.tool.id, e] as const), ...account.map((tool) => [tool.id, { tool }] as const)]), [hub.flat, account]);
  const outcome = useMemo(() => (query ? searchCatalog(searchable, query) : null), [searchable, query]);
  const featured = useMemo(() => featuredTools(catalog, scope.scope), [catalog, scope.scope]);
  const urgent = catalog.find((x) => x.urgent);
  const community = useMemo(() => { const tool = communityEntry(allTools); return tool ? entryOf.get(tool.id) ?? { tool } : null; }, [allTools, entryOf]);
  // Grille de tuiles : 3 colonnes (2 sous 360 pt), largeur calculée (aucune mesure, aucun saut)
  const inner = Math.min(winW, MAX_W) - spacing.lg * 2;
  const cols = winW < 360 ? 2 : 3;
  const tileW = Math.floor((inner - spacing.xs * (cols - 1)) / cols);

  const forTitle = scope.child ? tr('th.ui.for', { name: scope.child.first_name })
    : scope.scope === 'pregnancy' ? tr('th.ui.forPregnancy') : scope.scope === 'family' ? tr('th.ui.forFamily') : tr('th.ui.forMe');
  const loading = profileQ.isLoading && !profileQ.data;
  // Visite guidée (« Trouver un outil ») : la recherche, puis ses premiers résultats
  const searchAnchor = useTourAnchor('tools-search');
  // Ticket 3 : droits réels (cadenas sans Premium, jamais chez un abonné), introduction par compte, revoyable
  const { premium, locked } = useToolLock();
  const intro = useToolsIntro();
  // Logo « Mes apps » : les 4 tuiles s'allument en cascade à l'arrivée sur l'écran (statique si Réduire les animations)
  const [logoPulse, setLogoPulse] = useState(0);
  React.useEffect(() => { const id = setTimeout(() => setLogoPulse(1), 250); return () => clearTimeout(id); }, []);
  const resultsAnchor = useTourAnchor('tools-results');

  return (
    <Screen account title={tr('th.ui.title')} titleLogo={<AppsLogo size={40} pulse={logoPulse} testID="tools-logo" />} bottomInset={TAB_SCREEN_INSET} contentStyle={{ alignSelf: 'center', width: '100%', maxWidth: MAX_W }}>
      {/* 0. « Bienvenue dans Mes outils » (première visite de ce compte ; revoyable) */}
      {intro.open && !loading ? <ToolsIntro premium={premium} onDone={intro.hide} /> : null}
      {/* 1. Recherche par besoin (verre : petite surface de navigation posée sur le fond) */}
      <View style={{ gap: spacing.sm }}>
        <View {...searchAnchor}>
        <GlassSearchBar value={q} onChangeText={setQ} label={tr('th.ui.search')} placeholder={tr('th.ui.searchPh')} testID="tools-search"
          onFocus={() => setSearching(true)} onBlur={() => setSearching(false)} />
        </View>
        {/* Champ actif et vide : catégories suggérées */}
        {searching && !query && !loading ? <CategoryChips tools={allTools} /> : null}
        {!query ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            <Button label={showFilters || filtering ? tr('pz.cat.hideFilters') : tr('pz.cat.showFilters')} icon="sliders" variant="secondary" size="sm"
              onPress={() => setShowFilters(!(showFilters || filtering))} testID="tools-filter-toggle" />
            {intro.open ? null : <Button label={tr('mt.intro.replay')} icon="help-circle" variant="ghost" size="sm" onPress={intro.show} testID="tools-intro-replay" />}
          </View>
        ) : null}
        {!query && (showFilters || filtering) ? <CatalogFilterBar value={filters} onChange={setFilters} /> : null}
      </View>

      {loading ? <ToolsSkeleton tileW={tileW} cols={cols} /> : profileQ.isError && !profileQ.data ? (
        <ErrorView error={profileQ.error} onRetry={() => void profileQ.refetch()} title={tr('u3.tools.errTools')} />
      ) : !query && filtering ? (
        <FilteredCatalog hub={hub} filters={filters} onClear={() => setFilters(NO_FILTERS)} />
      ) : outcome ? (
        outcome.understood ? (
          <View testID="tools-results" accessibilityLiveRegion="polite" {...resultsAnchor}>
            <Text variant="caption" muted style={{ marginBottom: spacing.xs }}>{tr('th.ui.results', { count: outcome.results.length })}</Text>
            {/* Résultats : cartes opaques (texte), entrée en décalé léger (une fois par résultat nouveau) */}
            <StaggerList>
              {outcome.results.map((r, i) => {
                const e = entryOf.get(r.tool.id) ?? { tool: r.tool };
                return (
                  <ToolRow key={`tools-result-${e.tool.id}`} tool={e.tool} otherProfile={e.profile} first={i === 0} testID={`tools-result-${e.tool.id}`} locked={locked?.(e.tool)}
                    favorite={hub.favSet.has(e.tool.id)} onToggleFavorite={hub.toggleFav}
                    opensDirectly={hub.opensDirectly(e.tool)} onPress={() => hub.press(e)} onLongPress={() => hub.longPress(e)} />
                );
              })}
            </StaggerList>
          </View>
        ) : (
          <View style={{ gap: spacing.md }} testID="tools-no-match">
            <View style={{ gap: 4 }} accessibilityLiveRegion="polite">
              <Text variant="heading" accessibilityRole="header">{tr('th.ui.noMatch')}</Text>
              <Text muted>{tr('th.ui.noMatchB')}</Text>
            </View>
            <CategoryList tools={allTools} showAccount={false} />
          </View>
        )
      ) : (
        <>
          {urgent ? <UrgentStrip tool={urgent} /> : null}
          {/* Sans Premium : aperçu du catalogue, outils réservés marqués, offre accessible (paywall existant) */}
          {premium === false ? <PreviewBanner /> : null}

          {/* 2. Mes favoris (et récents) : tuiles de verre, ouverture directe */}
          <Section title={tr('th.ui.favs')} icon="star" testID="tools-favorites">
            {hub.favorites.length ? <Tiles entries={hub.favorites} onOpen={hub.openNow} locked={locked} /> : <Text variant="small" muted>{tr('th.ui.favsEmpty')}</Text>}
          </Section>
          {hub.recents.length ? (
            <Section title={tr('th.ui.recents')} icon="clock" testID="tools-recents">
              <Tiles entries={hub.recents} onOpen={hub.openNow} locked={locked} />
            </Section>
          ) : null}

          {/* 3. Pour le profil affiché : les plus utiles (6 au plus), rendues par profil */}
          <Section title={forTitle} testID="tools-featured">
            <View testID="tools-scope" accessibilityLabel={tr('pj.tools.scopeA11y')} style={{ marginBottom: spacing.xs }}>
              <ProfileSwitcher />
            </View>
            <ProfileStage profileKey={profileKey} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {featured.map((tool, i) => (
                <ToolTile key={tool.id} tool={tool} index={i} width={tileW} testID={`tools-featured-${tool.id}`} locked={locked?.(tool)} onPress={() => hub.press({ tool })} />
              ))}
            </ProfileStage>
          </Section>

          {/* 4. Les 9 catégories, puis le compte */}
          <Section title={tr('th.ui.categories')}>
            <CategoryList tools={allTools} locked={locked} />
          </Section>

          {/* 5. La communauté : un espace à part, hors des 9 catégories (son accès principal est en haut à droite) */}
          {community ? (
            <CommunityBlock tool={community.tool} favorite={hub.favSet.has(community.tool.id)} onToggleFavorite={() => hub.toggleFav(community.tool)} onOpen={() => hub.openNow(community)} />
          ) : null}

          {/* 6. Légende compacte des couleurs (les intitulés restent sur les cartes) */}
          <CategoryLegend />
        </>
      )}
      {hub.sheetNode}
    </Screen>
  );
}

function Section({ title, icon, children, testID }: { title: string; icon?: 'star' | 'clock'; children: React.ReactNode; testID?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.xs }} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon ? <Icon name={icon} size={16} color={t.colors.primary} /> : null}
        <Text variant="heading" accessibilityRole="header" style={{ flex: 1 }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

/** Squelette assorti : tuiles de favoris, puis la grille « Pour <profil> », puis des cartes d'outils (aucun saut). */
function ToolsSkeleton({ tileW, cols }: { tileW: number; cols: number }) {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.md }} testID="tools-skeleton">
      <SkeletonPulse label={tr('common.loadingA11y')} style={{ gap: spacing.xs }}>
        <SkeletonBone width="40%" height={20} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {Array.from({ length: cols * 2 }, (_, i) => (
            <View key={i} style={{ width: tileW, minHeight: TOOL_TILE.minHeight, borderRadius: radius.lg, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, alignItems: 'center', paddingTop: spacing.sm, gap: 8 }}>
              <SkeletonBone width={TOOL_TILE.glyph} height={TOOL_TILE.glyph} radius={TOOL_TILE.glyph / 2} />
              <SkeletonBone width="70%" height={12} />
            </View>
          ))}
        </View>
      </SkeletonPulse>
      <ToolRowsSkeleton rows={3} />
    </View>
  );
}

/** Bloc « Communauté » : présenté à part des catégories d'outils (nom, phrase et pictogramme du registre). */
function CommunityBlock({ tool, favorite, onToggleFavorite, onOpen }: { tool: CatalogTool; favorite: boolean; onToggleFavorite: () => void; onOpen: () => void }) {
  const t = useTheme();
  return (
    <View testID="tools-community" style={{ gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surface }}>
      <Text variant="caption" weight="medium" muted>{tr('th.ui.communityHead')}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <ToolGlyph id={tool.id} theme={tool.theme} icon={tool.icon} size={44} />
        <Text variant="heading" accessibilityRole="header" style={{ flex: 1, minWidth: 0 }}>{tool.label}</Text>
        <FavoriteStar on={favorite} label={tool.label} onPress={onToggleFavorite} id={tool.id} />
      </View>
      {tool.sub ? <Text variant="small" muted>{tool.sub}</Text> : null}
      <Button label={tr('th.ui.communityOpen')} icon="message-circle" variant="secondary" onPress={onOpen} full testID="tools-community-open" />
    </View>
  );
}

/** Favoris et récents : tuiles de verre compactes ; un appui ouvre l'outil (sur le bon profil). Nouvelle tuile : entrée animée. */
function Tiles({ entries, onOpen, locked }: { entries: ToolEntry[]; onOpen: (e: ToolEntry) => void; locked?: (tool: CatalogTool) => boolean }) {
  return (
    <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.xs, paddingLeft: spacing.xxs, paddingRight: spacing.lg, paddingVertical: spacing.xxs }} style={{ marginHorizontal: -spacing.xxs }}>
      {entries.map((e, i) => <ToolTile key={e.tool.id} tool={e.tool} profile={e.profile} index={i} locked={locked?.(e.tool)} onPress={() => onOpen(e)} />)}
    </ScrollView>
  );
}

/** Urgences : toujours visibles, immédiates, sans animation. */
function UrgentStrip({ tool }: { tool: CatalogTool }) {
  const t = useTheme();
  const c = glyphColor(t, tool.theme, true);
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={tr('u3.tools.urgA11y')}
      onPress={() => router.push('/emergency')}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: pressed ? tint(c, 0.2) : t.colors.dangerSoft, borderWidth: 1, borderColor: tint(c, 0.35) })}
    >
      <Icon name="life-buoy" size={20} color={c} />
      <Text weight="bold" style={{ flex: 1, color: c }}>{tr('u3.tools.urg')}</Text>
      <Icon name="chevron-right" size={18} color={c} />
    </Tappable>
  );
}
