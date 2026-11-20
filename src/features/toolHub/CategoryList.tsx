/**
 * Les 9 catégories du centre d'outils, en liste : pictogramme, nom, nombre d'outils (profil affiché et autres profils
 * du foyer). Chaque rangée ouvre la liste de ses outils (`/tools/<catégorie>`). « Mon compte et réglages » suit, à
 * part : ce ne sont pas des outils, ils ne sont donc pas comptés.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ToolGlyph } from '@/components/ToolGlyph';
import { CATEGORY_HOMI_ICON, categoryTone, HomiIcon, type IconCategory } from '@/brand/icons';
import { Chip, haptic, Icon, Text } from '@/components/ui';
import { StaggerList } from '@/motion';
import { Tappable } from '@/components/Tappable';
import { CATEGORY_ICON, CATEGORY_THEME, categoryTitle, type CatalogTool } from '@/lib/domain/toolCatalog';
import { TOOL_CATEGORIES, type ToolCategory } from '@/lib/journeys/tools';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export function categoryCounts(tools: CatalogTool[]): Record<ToolCategory, number> {
  const out = Object.fromEntries([...TOOL_CATEGORIES, 'account'].map((c) => [c, 0])) as Record<ToolCategory, number>;
  for (const x of tools) if (x.category in out) out[x.category] += 1; // l'espace Communauté n'est compté nulle part
  return out;
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

export function CategoryList({ tools, showAccount = true, onOpen }: { tools: CatalogTool[]; showAccount?: boolean; /** Appelé juste avant l'ouverture (fermer une feuille). */ onOpen?: () => void }) {
  const t = useTheme();
  const counts = React.useMemo(() => categoryCounts(tools), [tools]);
  return (
    <View testID="tools-categories" style={{ borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border, backgroundColor: t.colors.surface, paddingHorizontal: spacing.sm, overflow: 'hidden' }}>
      {TOOL_CATEGORIES.map((c, i) => (
        <CategoryRow key={c} category={c} first={i === 0} onOpen={onOpen}
          detail={counts[c] ? tr('th.ui.count', { count: counts[c] }) : tr('th.ui.countNone')} />
      ))}
      {showAccount ? <CategoryRow category="account" onOpen={onOpen} detail={tr('th.ui.accountSub')} /> : null}
    </View>
  );
}

function CategoryRow({ category, detail, first, onOpen }: { category: ToolCategory; detail: string; first?: boolean; onOpen?: () => void }) {
  const t = useTheme();
  const title = categoryTitle(category);
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={tr('th.ui.openCat', { title, count: detail })}
      testID={`tools-category-${category}`}
      onPress={() => { haptic('selection'); onOpen?.(); router.push(`/tools/${category}` as never); }}
      bare pressScale={1} hoverLift={0}
      style={({ pressed, hovered }) => ({
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 64, paddingVertical: spacing.xs, borderRadius: radius.md,
        backgroundColor: pressed || hovered ? t.colors.surfaceAlt : 'transparent',
      })}
    >
      {first ? null : <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: t.colors.border }} />}
      {category in CATEGORY_HOMI_ICON ? (
        <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <HomiIcon name={CATEGORY_HOMI_ICON[category as IconCategory]} tone={categoryTone(t, category as IconCategory)} size={30} />
        </View>
      ) : (
        <ToolGlyph id={`cat.${category}`} theme={CATEGORY_THEME[category]} icon={CATEGORY_ICON[category]} size={44} />
      )}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text weight="bold">{title}</Text>
        <Text variant="small" muted>{detail}</Text>
      </View>
      <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
    </Tappable>
  );
}
