/**
 * Après le scan d'un aliment : recettes compatibles avec le profil affiché, précautions générales liées au produit
 * (lait cru, charcuterie, miel avant 1 an…) et lien « Que puis-je cuisiner avec ce que j'ai ? ».
 * Information générale : ne remplace ni l'étiquette ni l'avis d'un professionnel.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, SectionTitle, Text } from '@/components/ui';
import { useFoodProfile, useRecipes } from '@/lib/data/hooks-recipes';
import { scannedProductAdvice } from '@/lib/recipes/engine';
import { INGREDIENTS } from '@/lib/recipes/ingredients';
import { useUiStore } from '@/lib/store';
import { t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { RecipeCard } from './RecipeCard';

export function ScanRecipes({ name }: { name: string | null | undefined }) {
  const { data: all } = useRecipes();
  const { profile } = useFoodProfile();
  const pantry = useUiStore((s) => s.pantry);
  const setPantry = useUiStore((s) => s.setPantry);
  const adv = useMemo(() => (all && name ? scannedProductAdvice(name, profile, all) : null), [all, name, profile]);
  if (!adv) return null;
  const add = adv.keys.filter((k) => !pantry.includes(k));
  return (
    <View style={{ gap: spacing.xs }} testID="scan-recipes">
      <SectionTitle title={profile.name ? tr('rc.scan.titleFor', { name: profile.name }) : tr('rc.scan.title')} />
      {adv.precautions.length ? (
        <View testID="scan-precautions"><Banner tone="warning" title={tr('rc.scan.precautions')}>{adv.precautions.map((p) => `• ${p.text}${p.alternative ? ` ${tr('rc.scan.alt')} ${p.alternative}` : ''}`).join('\n')}</Banner></View>
      ) : null}
      {adv.recipes.length ? adv.recipes.slice(0, 4).map((r) => <RecipeCard key={r.id} r={r} />) : <Text variant="small" muted>{adv.keys.length ? tr('rc.scan.noRecipe') : tr('rc.scan.unknown')}</Text>}
      {add.length ? <Button label={tr('rc.scan.addPantry', { list: add.map((k) => INGREDIENTS[k].name).join(', ') })} icon="plus" size="sm" variant="secondary" onPress={() => setPantry([...pantry, ...add])} /> : null}
      <Button label={tr('rc.pantry.open')} icon="package" size="sm" variant="ghost" onPress={() => router.push('/meals/pantry')} testID="scan-open-pantry" />
      <Text variant="caption" muted>{tr('rc.scan.note')}</Text>
    </View>
  );
}
