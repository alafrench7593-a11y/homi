/**
 * Deux raccourcis sur la page d'un enfant : « Ses découvertes » et « Je grandis ».
 * Seulement un résumé (dernier aliment découvert, prochaine idée de recette, nouvelle étape observée, activité ou
 * étape adaptée à l'âge) ; les détails restent dans les pages dédiées.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { GlassSurface } from '@/components/Glass';
import { Icon, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { FoodArt } from './FoodArt';
import { usePremium } from '@/lib/data/hooks';
import { useRecipes } from '@/lib/data/hooks-recipes';
import { useChildSteps, useFoodEntries, useTastings } from '@/lib/data/hooks-discoveries';
import { FOOD_BY_KEY } from '@/content/discoveries/foods';
import { STEP_BY_KEY } from '@/content/discoveries/steps';
import { ageInMonths, bandFor, recentObservations, recipesWithTasted, stepAvailable, stepsInBand } from '@/lib/domain/discoveries';
import { todayISO } from '@/lib/domain/dates';
import { formatDate, t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import type { Child } from '@/lib/types';

export function ChildShortcuts({ child }: { child: Pick<Child, 'id' | 'first_name' | 'birth_date'> }) {
  const t = useTheme();
  const premium = usePremium();
  const entries = useFoodEntries(child.id).data ?? [];
  const tastings = useTastings(child.id).data ?? [];
  const steps = useChildSteps(child.id).data ?? [];
  const { data: recipes } = useRecipes();
  const age = ageInMonths(child.birth_date, todayISO());
  const lastTaste = tastings.find((x) => x.status !== 'refused');
  const lastFood = lastTaste?.food_key ? FOOD_BY_KEY[lastTaste.food_key] : null;
  const recipe = useMemo(() => recipesWithTasted(recipes ?? [], entries, age)[0] ?? null, [recipes, entries, age]);
  const lastStep = recentObservations(steps, 1)[0];
  const known = new Set(steps.map((s) => s.step_key));
  const nextStep = stepsInBand(bandFor(age)).find((s) => !known.has(s.key) && stepAvailable(s, premium));
  const fill = t.isDark ? 'rgba(40,32,70,0.55)' : 'rgba(255,255,255,0.62)';
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }} testID="child-shortcuts">
      <Tappable accessibilityRole="button" accessibilityLabel={`${tr('dc.title')}. ${lastFood ? tr('cs.lastFood', { food: lastFood.name }) : tr('cs.noFood')}`} onPress={() => router.push(`/child/${child.id}/discoveries` as never)} style={{ flex: 1 }} testID="cs-discoveries">
        <GlassSurface fill={fill} depth={1} radius={22} padded={12} style={{ minHeight: 150 }}>
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {lastFood ? <FoodArt food={lastFood} size={34} /> : <Icon name="feather" size={18} color={t.colors.primary} />}
              <Text weight="bold" style={{ flex: 1 }} numberOfLines={2}>{tr('cs.discoveries')}</Text>
            </View>
            <Text variant="caption" muted numberOfLines={2} testID="cs-last-food">{lastFood && lastTaste ? tr('cs.lastFoodOn', { food: lastFood.name, date: formatDate(`${lastTaste.tasted_on}T12:00:00`, { day: 'numeric', month: 'short' }) }) : tr('cs.noFood')}</Text>
            {recipe ? <Text variant="caption" numberOfLines={2} testID="cs-recipe">{tr('cs.recipe', { title: recipe.title })}</Text> : null}
          </View>
        </GlassSurface>
      </Tappable>
      <Tappable accessibilityRole="button" accessibilityLabel={`${tr('gr.title')}. ${lastStep ? tr('cs.lastStep', { step: STEP_BY_KEY[lastStep.step_key]?.title ?? '' }) : tr('cs.noStep')}`} onPress={() => router.push(`/child/${child.id}/grow` as never)} style={{ flex: 1 }} testID="cs-grow">
        <GlassSurface fill={fill} depth={1} radius={22} padded={12} style={{ minHeight: 150 }}>
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="star" size={18} color={t.colors.primary} />
              <Text weight="bold" style={{ flex: 1 }}>{tr('gr.title')}</Text>
            </View>
            <Text variant="caption" muted numberOfLines={2} testID="cs-last-step">{lastStep && STEP_BY_KEY[lastStep.step_key] ? tr('cs.lastStep', { step: STEP_BY_KEY[lastStep.step_key].title }) : tr('cs.noStep')}</Text>
            {nextStep ? <Text variant="caption" numberOfLines={3} testID="cs-activity">{premium ? tr('cs.activity', { text: nextStep.play }) : tr('cs.nextStep', { step: nextStep.title })}</Text> : null}
          </View>
        </GlassSurface>
      </Tappable>
    </View>
  );
}
