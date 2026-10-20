/** Carte d'une recette dans une liste. */
import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { haptic, Icon, Row, Text } from '@/components/ui';
import { RecipeArt } from './RecipeArt';
import { budgetLabel, statusLabel } from './labels';
import type { Recipe } from '@/lib/recipes/types';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export function RecipeCard({ r, favorite, score }: { r: Recipe; favorite?: boolean; score?: number | null }) {
  const t = useTheme();
  return (
    <Pressable testID={`recipe-${r.slug}`} accessibilityRole="button" accessibilityLabel={tr('rc.card.a11y', { title: r.title, min: r.prepMin + r.cookMin })} onPress={() => { haptic('selection'); router.push(`/meals/${r.slug}`); }}
      style={({ pressed }) => ({ flexDirection: 'row', gap: spacing.sm, padding: spacing.xs, borderRadius: radius.lg, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface, borderWidth: 1, borderColor: t.colors.border })}>
      <View style={{ width: 104 }}><RecipeArt recipe={r} height={86} label={false} rounded={12} /></View>
      <View style={{ flex: 1, gap: 2, justifyContent: 'center' }}>
        <Text weight="bold">{r.title}</Text>
        <Text variant="small" muted>{tr('rc.card.meta', { min: r.prepMin + r.cookMin, n: r.servings })} · {budgetLabel(r.budget)}</Text>
        <Row gap={6}>
          <Text variant="caption" color={t.colors.primary}>{r.personal ? tr('rc.personal') : statusLabel(r.status)}</Text>
          {favorite ? <Icon name="star" size={13} color={t.colors.gold} /> : null}
          {score != null ? <Text variant="caption" weight="bold" testID={`score-${r.slug}`}>{tr('rc.score.badge', { n: score })}</Text> : null}
        </Row>
      </View>
    </Pressable>
  );
}

