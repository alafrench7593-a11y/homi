/**
 * Les 9 catégories du centre d'outils, en liste : pictogramme, nom, nombre d'outils (profil affiché et autres profils
 * du foyer). Chaque rangée ouvre la liste de ses outils (`/tools/<catégorie>`). « Mon compte et réglages » suit, à
 * part : ce ne sont pas des outils, ils ne sont donc pas comptés.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ToolGlyph } from '@/components/ToolGlyph';
import { haptic, Icon, Text } from '@/components/ui';
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

export function CategoryList({ tools, showAccount = true, onOpen }: { tools: CatalogTool[]; showAccount?: boolean; /** Appelé juste avant l'ouverture (fermer une feuille). */ onOpen?: () => void }) {
  const counts = React.useMemo(() => categoryCounts(tools), [tools]);
  return (
    <View testID="tools-categories">
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
      <ToolGlyph id={`cat.${category}`} theme={CATEGORY_THEME[category]} icon={CATEGORY_ICON[category]} size={44} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text weight="bold">{title}</Text>
        <Text variant="small" muted>{detail}</Text>
      </View>
      <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
    </Tappable>
  );
}
