/**
 * Les 9 catégories du centre d'outils (ticket 3, 21/11/2026) : des CARTES DE VERRE (`GlassCard`), une couleur STABLE
 * par catégorie (src/theme/categoryPalette.ts : pastille, liseré, aplat léger, pictogramme), le nom en clair et le
 * nombre d'outils (profil affiché et autres profils du foyer). Sans Premium, le nombre d'outils réservés est indiqué
 * (« 12 avec Premium », cadenas). Chaque carte ouvre la liste de ses outils (`/tools/<catégorie>`). « Mon compte et
 * réglages » suit, à part, en carte pleine largeur : ce ne sont pas des outils, ils ne sont donc pas comptés.
 * `CategoryLegend` : légende compacte « Couleurs des catégories » (pastille + nom), en bas de « Mes outils ».
 *
 * Mise en page : grille de 2 colonnes à largeur relative (aucune mesure, aucun saut) ; 1 colonne quand l'écran est
 * étroit ET le texte agrandi (320 pt à 130 %) : les titres longs passent sur deux lignes sans être coupés.
 */
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { ToolGlyph } from '@/components/ToolGlyph';
import { CATEGORY_HOMI_ICON, HomiIcon, type IconCategory } from '@/brand/icons';
import { GlassCard } from '@/components/glass';
import { Chip, haptic, Icon, Text } from '@/components/ui';
import { StaggerList } from '@/motion';
import { CATEGORY_ICON, CATEGORY_THEME, categoryTitle, type CatalogTool } from '@/lib/domain/toolCatalog';
import { TOOL_CATEGORIES, type ToolCategory } from '@/lib/journeys/tools';
import { categoryColors, type CategoryKey } from '@/theme/categoryPalette';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export function categoryCounts(tools: CatalogTool[]): Record<ToolCategory, number> {
  const out = Object.fromEntries([...TOOL_CATEGORIES, 'account'].map((c) => [c, 0])) as Record<ToolCategory, number>;
  for (const x of tools) if (x.category in out) out[x.category] += 1; // l'espace Communauté n'est compté nulle part
  return out;
}

/** Une ou deux colonnes : une seule sur écran étroit avec texte agrandi (titres jamais coupés). */
export function categoryColumns(width: number, fontScale: number): 1 | 2 {
  return width < 360 && fontScale >= 1.2 ? 1 : 2;
}

/**
 * Catégories SUGGÉRÉES quand le champ de recherche est vide (centre d'outils, feuille de recherche) : les plus fournies
 * pour le foyer, en pastilles ; une pastille ouvre la catégorie. Apparition en décalé léger (`StaggerList`).
 */
export function CategoryChips({ tools, max = 5, onOpen, testID = 'tools-suggest' }: { tools: CatalogTool[]; max?: number; onOpen?: () => void; testID?: string }) {
  const counts = React.useMemo(() => categoryCounts(tools), [tools]);
  const cats = React.useMemo(() => TOOL_CATEGORIES.filter((c) => counts[c] > 0).sort((a, b) => counts[b] - counts[a]).slice(0, max), [counts, max]);
  if (!cats.length) return null;
  return (
    <View testID={testID} style={{ gap: 6 }}>
      <Text variant="caption" weight="medium" muted accessibilityRole="header">{tr('glass.suggest')}</Text>
      <StaggerList style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {cats.map((c) => (
          <Chip key={c} label={categoryTitle(c)} icon={CATEGORY_ICON[c]} testID={`${testID}-${c}`}
            onPress={() => { haptic('selection'); onOpen?.(); router.push(`/tools/${c}` as never); }} />
        ))}
      </StaggerList>
    </View>
  );
}

export function CategoryList({ tools, showAccount = true, onOpen, locked }: {
  tools: CatalogTool[]; showAccount?: boolean;
  /** Appelé juste avant l'ouverture (fermer une feuille). */ onOpen?: () => void;
  /** Sans Premium : outil réservé (cadenas, nombre « avec Premium »). */ locked?: (tool: CatalogTool) => boolean;
}) {
  const counts = React.useMemo(() => categoryCounts(tools), [tools]);
  const lockedCounts = React.useMemo(() => (locked ? categoryCounts(tools.filter(locked)) : null), [tools, locked]);
  const { width, fontScale } = useWindowDimensions();
  const cols = categoryColumns(width, fontScale);
  return (
    <View testID="tools-categories" style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {TOOL_CATEGORIES.map((c) => (
          <CategoryCard key={c} category={c} cols={cols} onOpen={onOpen} locked={lockedCounts?.[c] ?? 0}
            detail={counts[c] ? tr('th.ui.count', { count: counts[c] }) : tr('th.ui.countNone')} />
        ))}
      </View>
      {showAccount ? <CategoryCard category="account" cols={1} onOpen={onOpen} locked={0} detail={tr('th.ui.accountSub')} /> : null}
    </View>
  );
}

function CategoryCard({ category, detail, cols, locked, onOpen }: { category: ToolCategory; detail: string; cols: 1 | 2; locked: number; onOpen?: () => void }) {
  const t = useTheme();
  const title = categoryTitle(category);
  const key = category in CATEGORY_HOMI_ICON ? (category as CategoryKey) : null;
  const c = key ? categoryColors(t, key) : null;
  const lockText = locked ? tr('mt.locked', { count: locked }) : null;
  return (
    <GlassCard padded={false} radius={radius.lg} testID={`tools-category-${category}`}
      accessibilityLabel={`${tr('th.ui.openCat', { title, count: detail })}${lockText ? `. ${lockText}` : ''}`}
      onPress={() => { haptic('selection'); onOpen?.(); router.push(`/tools/${category}` as never); }}
      style={cols === 2 ? { flexBasis: '46%', flexGrow: 1, minWidth: 0 } : { width: '100%' }}>
      {/* Aplat très léger et liseré de la couleur de la catégorie, sous le contenu (le verre reste lisible) */}
      {c ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.lg, backgroundColor: c.soft, opacity: 0.55, borderWidth: 1, borderColor: c.edge }]} /> : null}
      <View style={{ flexDirection: cols === 2 ? 'column' : 'row', alignItems: cols === 2 ? 'flex-start' : 'center', gap: spacing.xs, padding: spacing.sm, minHeight: cols === 2 ? 112 : 64 }}>
        {key && c ? (
          <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: c.soft, borderWidth: 1, borderColor: c.edge }} testID={`tools-category-dot-${category}`}>
            <HomiIcon name={CATEGORY_HOMI_ICON[key as IconCategory]} tone={c.accent} color={t.colors.text} size={26} />
          </View>
        ) : (
          <ToolGlyph id={`cat.${category}`} theme={CATEGORY_THEME[category]} icon={CATEGORY_ICON[category]} size={40} />
        )}
        <View style={{ flex: cols === 2 ? undefined : 1, minWidth: 0, gap: 2, alignSelf: 'stretch' }}>
          <Text weight="bold" numberOfLines={3}>{title}</Text>
          <Text variant="small" muted>{detail}</Text>
          {lockText ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} testID={`tools-category-locked-${category}`}>
              <Icon name="lock" size={12} color={t.colors.textMuted} />
              <Text variant="caption" muted style={{ flexShrink: 1 }}>{lockText}</Text>
            </View>
          ) : null}
        </View>
        {cols === 1 ? <Icon name="chevron-right" size={18} color={t.colors.textMuted} /> : null}
      </View>
    </GlassCard>
  );
}

/** Légende compacte « Couleurs des catégories » : pastille + nom (les intitulés restent aussi sur les cartes). */
export function CategoryLegend() {
  const t = useTheme();
  return (
    <View testID="tools-legend" style={{ gap: spacing.xs }} accessibilityRole="summary">
      <Text variant="caption" weight="bold" muted accessibilityRole="header">{tr('mt.legend')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.sm, rowGap: 6 }}>
        {TOOL_CATEGORIES.map((cat) => (
          <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%' }} testID={`tools-legend-${cat}`}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: categoryColors(t, cat as CategoryKey).accent }} />
            <Text variant="caption" style={{ flexShrink: 1 }}>{categoryTitle(cat)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
