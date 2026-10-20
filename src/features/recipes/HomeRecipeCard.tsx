/** Accueil : une seule recette recommandée, adaptée au profil affiché (jamais de purée pour une femme enceinte, etc.). */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Card, Row, Text } from '@/components/ui';
import { useFoodProfile, useRecipes } from '@/lib/data/hooks-recipes';
import { recipeOfDay } from '@/lib/recipes/engine';
import { t as tr } from '@/i18n';
import { RecipeArt } from './RecipeArt';
import { RECIPE_PHOTO_FILES } from './recipePhotos';

export function HomeRecipeCard() {
  const { data: all } = useRecipes();
  const { profile } = useFoodProfile();
  // Une recette avec une vraie photo (générée pour elle) passe en premier si elle convient au profil
  const r = useMemo(() => (all ? recipeOfDay(all.filter((x) => RECIPE_PHOTO_FILES[x.slug]), profile) ?? recipeOfDay(all, profile) : null), [all, profile]);
  if (!r) return null;
  const photo = !!RECIPE_PHOTO_FILES[r.slug];
  return (
    <View testID="home-recipe">
    <Card onPress={() => router.push(`/meals/${r.slug}`)} accessibilityLabel={tr('rc.home.a11y', { title: r.title })} padded={!photo}>
      {photo ? (
        <View>
          <RecipeArt recipe={r} height={220} rounded={0} />
          <View style={{ padding: 16, gap: 2 }}>
            <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>{profile.name ? tr('rc.home.labelFor', { name: profile.name }) : tr('rc.home.label')}</Text>
            <Text variant="heading" testID="home-recipe-title">{r.title}</Text>
            <Text variant="caption" muted>{tr('rc.card.meta', { min: r.prepMin + r.cookMin, n: r.servings })}</Text>
          </View>
        </View>
      ) : (
      <Row style={{ alignItems: 'center' }}>
        <View style={{ width: 72 }}><RecipeArt recipe={r} height={64} label={false} rounded={12} /></View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>{profile.name ? tr('rc.home.labelFor', { name: profile.name }) : tr('rc.home.label')}</Text>
          <Text weight="bold" testID="home-recipe-title">{r.title}</Text>
          <Text variant="caption" muted>{tr('rc.card.meta', { min: r.prepMin + r.cookMin, n: r.servings })}</Text>
        </View>
      </Row>
      )}
    </Card>
    </View>
  );
}
