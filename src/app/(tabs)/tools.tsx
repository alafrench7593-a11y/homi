/**
 * « Mes outils » — le centre d'outils (refonte du 17/11/2026).
 *
 * De haut en bas : la recherche par besoin ; « Mes favoris » (et les outils ouverts récemment) qui s'ouvrent
 * directement ; « Pour <profil affiché> » (les 6 plus utiles) ; puis les 9 catégories en liste, chacune ouvrant la
 * liste de ses outils. Plus de grille de cartes, plus de « Voir les N autres » : tout outil est à deux appuis au
 * plus (catégorie → outil), ou à un appui depuis la recherche.
 *
 * Une rangée d'outil ouvre sa fiche (ce que ça fait, pour qui, l'aperçu, « Commencer ») la première fois, puis
 * l'outil directement une fois qu'il est connu ; l'appui long fait l'inverse. Les urgences restent en tête.
 * Recherche : index local de besoins (src/lib/domain/toolSearch.ts) ; quand rien ne correspond, l'écran le dit et
 * propose les catégories — jamais de résultat au hasard.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ErrorView, Skeleton } from '@/components/States';
import { ToolShortcut } from '@/components/ToolCard';
import { TAB_SCREEN_INSET } from '@/components/Dock';
import { ProfileSwitcher } from '@/components/Family';
import { glyphColor, tint } from '@/components/ToolGlyph';
import { Tappable } from '@/components/Tappable';
import { Field, Icon, IconButton, Text } from '@/components/ui';
import { CategoryList } from '@/features/toolHub/CategoryList';
import { ToolRow } from '@/features/toolHub/ToolRow';
import { useToolHub, type ToolEntry } from '@/features/toolHub/useToolHub';
import { useProfile } from '@/lib/data/hooks';
import { featuredTools, type CatalogTool } from '@/lib/domain/toolCatalog';
import { searchCatalog } from '@/lib/domain/toolSearch';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

/** Largeur utile maximale (tablette, ordinateur) : les listes restent lisibles et centrées, jamais étirées. */
const MAX_W = 720;

export default function Tools() {
  const profileQ = useProfile();
  const hub = useToolHub();
  const { scope, catalog, all, allTools, account } = hub;
  const [q, setQ] = useState('');
  const query = q.trim();

  // Recherche dans tous les outils atteignables (profil affiché et autres profils) et dans les réglages
  const searchable = useMemo(() => [...allTools, ...account], [allTools, account]);
  const entryOf = useMemo(() => new Map<string, ToolEntry>([...all.map((e) => [e.tool.id, e] as const), ...account.map((tool) => [tool.id, { tool }] as const)]), [all, account]);
  const outcome = useMemo(() => (query ? searchCatalog(searchable, query) : null), [searchable, query]);
  const featured = useMemo(() => featuredTools(catalog, scope.scope), [catalog, scope.scope]);
  const urgent = catalog.find((x) => x.urgent);

  const forTitle = scope.child ? tr('th.ui.for', { name: scope.child.first_name })
    : scope.scope === 'pregnancy' ? tr('th.ui.forPregnancy') : scope.scope === 'family' ? tr('th.ui.forFamily') : tr('th.ui.forMe');

  const row = (e: ToolEntry, i: number, prefix: string) => (
    <ToolRow key={`${prefix}-${e.tool.id}`} tool={e.tool} otherProfile={e.profile} first={i === 0} testID={`${prefix}-${e.tool.id}`}
      favorite={hub.favSet.has(e.tool.id)} onToggleFavorite={hub.toggleFav}
      opensDirectly={hub.opensDirectly(e.tool)} onPress={() => hub.press(e)} onLongPress={() => hub.longPress(e)} />
  );

  return (
    <Screen account title={tr('th.ui.title')} bottomInset={TAB_SCREEN_INSET} contentStyle={{ alignSelf: 'center', width: '100%', maxWidth: MAX_W }}>
      {/* 1. Recherche par besoin */}
      <View>
        <Field label={tr('th.ui.search')} value={q} onChangeText={setQ} placeholder={tr('th.ui.searchPh')} returnKeyType="search" autoCorrect={false}
          accessibilityLabel={tr('th.ui.search')} testID="tools-search" />
        {q ? (
          <View style={{ position: 'absolute', right: 4, bottom: 4 }}>
            <IconButton icon="x" label={tr('th.ui.clear')} onPress={() => setQ('')} testID="tools-search-clear" />
          </View>
        ) : null}
      </View>

      {profileQ.isLoading && !profileQ.data ? <Skeleton kind="list" rows={6} /> : profileQ.isError && !profileQ.data ? (
        <ErrorView error={profileQ.error} onRetry={() => void profileQ.refetch()} title={tr('u3.tools.errTools')} />
      ) : outcome ? (
        outcome.understood ? (
          <View testID="tools-results" accessibilityLiveRegion="polite">
            <Text variant="caption" muted style={{ marginBottom: spacing.xs }}>{tr('th.ui.results', { count: outcome.results.length })}</Text>
            {outcome.results.map((r, i) => row(entryOf.get(r.tool.id) ?? { tool: r.tool }, i, 'tools-result'))}
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

          {/* 2. Mes favoris (et récents) : ouverture directe */}
          <Section title={tr('th.ui.favs')} icon="star" testID="tools-favorites">
            {hub.favorites.length ? <Shortcuts entries={hub.favorites} onOpen={hub.openNow} /> : <Text variant="small" muted>{tr('th.ui.favsEmpty')}</Text>}
          </Section>
          {hub.recents.length ? (
            <Section title={tr('th.ui.recents')} icon="clock" testID="tools-recents">
              <Shortcuts entries={hub.recents} onOpen={hub.openNow} />
            </Section>
          ) : null}

          {/* 3. Pour le profil affiché : les plus utiles (6 au plus) */}
          <Section title={forTitle} testID="tools-featured">
            <View testID="tools-scope" accessibilityLabel={tr('pj.tools.scopeA11y')} style={{ marginBottom: spacing.xs }}>
              <ProfileSwitcher />
            </View>
            <View>{featured.map((tool, i) => row({ tool }, i, 'tools-featured'))}</View>
          </Section>

          {/* 4. Les 9 catégories, puis le compte */}
          <Section title={tr('th.ui.categories')}>
            <CategoryList tools={allTools} />
          </Section>
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

/** Favoris et récents : raccourcis compacts, un appui ouvre l'outil (sur le bon profil). */
function Shortcuts({ entries, onOpen }: { entries: ToolEntry[]; onOpen: (e: ToolEntry) => void }) {
  return (
    <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingRight: spacing.lg }}>
      {entries.map((e) => <ToolShortcut key={e.tool.id} tool={e.tool} onOpen={() => onOpen(e)} />)}
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
