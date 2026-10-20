/**
 * Fiche recette : illustration (avec sa licence), portions ajustables, ingrédients et quantités, étapes, allergènes,
 * adaptations, conservation, précautions (grossesse, âge, étouffement), intérêt nutritionnel, sources, date de
 * vérification et statut réel (« À vérifier » tant qu'aucun professionnel ne l'a relue).
 */
import React, { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, IconButton, Row, SectionTitle, Text } from '@/components/ui';
import { RecipeArt } from '@/features/recipes/RecipeArt';
import { allergenLabel, budgetLabel, mealLabel, stageLabel, statusLabel, textureLabel } from '@/features/recipes/labels';
import { scoreBandFor, useCreateShoppingList, useFoodProfile, useIngredientPrices, useLatestShoppingList, useRecipeFavorites, useRecipes } from '@/lib/data/hooks-recipes';
import { useMyRoles } from '@/lib/data/hooks-settings';
import { ScorePanel } from '@/features/recipes/ScorePanel';
import { costPerPortion } from '@/lib/recipes/score';
import { friendlyError } from '@/lib/data/hooks-settings';
import { backend } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { formatQty, incompatibility, newFoods, scaleQty, shoppingList } from '@/lib/recipes/engine';
import { INGREDIENTS } from '@/lib/recipes/ingredients';
import { RECIPE_SOURCES } from '@/lib/recipes/sources';
import { formatDate, t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const ageText = (m: number) => (m < 24 ? tr('vx.ageMonths', { count: m }) : tr('vx.ageYears', { count: Math.round(m / 12) }));

export default function RecipeDetail() {
  const t = useTheme();
  const toast = useToast();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { isEditor } = useMyRoles();
  const { data: all, loading } = useRecipes({ includeDrafts: isEditor, includeRetired: isEditor });
  const prices = useIngredientPrices();
  const { profile } = useFoodProfile();
  const fav = useRecipeFavorites();
  const shopping = useLatestShoppingList();
  const createList = useCreateShoppingList();
  const inv = useInvalidate();
  const r = all?.find((x) => x.slug === slug) ?? null;
  const [servings, setServings] = useState<number | null>(null);
  if (loading && !all) return <Screen back title={tr('rc.title')}><Skeleton kind="detail" rows={5} /></Screen>;
  if (!r) return <Screen back title={tr('rc.title')}><EmptyState icon="book" title={tr('rc.notFound')} /></Screen>;
  const n = servings ?? r.servings;
  const why = incompatibility(r, profile);
  const fresh = newFoods(r, profile);
  const isFav = fav.slugs.includes(r.slug);

  async function addToShopping() {
    if (!r) return;
    try {
      const lines = shoppingList([r], [{ day: 0, meal: r.meals[0], recipeId: r.id, servings: n }]);
      if (shopping.list) {
        await backend.insert('shopping_items', lines.map((l, i) => ({ list_id: shopping.list!.id, household_id: shopping.list!.household_id, ingredient_key: l.key, label: l.label, qty: l.qty, unit: l.unit, aisle: l.aisle, at_home: l.atHome, position: shopping.items.length + i })));
        inv('shopping_items');
      } else await createList.mutateAsync({ title: tr('rc.shopping.defaultTitle'), planId: null, lines });
      toast(tr('rc.shopping.added'), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={r.title} right={<IconButton icon="star" label={isFav ? tr('rc.unfavorite') : tr('rc.favorite')} color={isFav ? t.colors.gold : t.colors.textMuted} onPress={() => fav.toggle.mutate(r.slug)} />}>
      <RecipeArt recipe={r} height={190} />
      <Text variant="caption" muted testID="photo-license">{tr('rc.photo.credit', { author: r.photo.author, license: r.photo.license, rights: r.photo.rights })}{r.photo.url ? ` · ${r.photo.url}` : ''}</Text>
      <Text>{r.summary}</Text>
      <View testID="recipe-status"><Banner tone={r.status === 'validated' || r.status === 'reviewed' ? 'success' : 'warning'} title={r.personal ? tr('rc.personal') : statusLabel(r.status)}>{r.personal ? tr('rc.personalBody') : tr(`rc.statusBody.${r.status}` as never)}</Banner></View>
      {why.length && !r.personal ? <Banner tone="danger" title={tr('rc.notForProfile')}>{why.join(' · ')}</Banner> : null}

      {!r.audiences.includes('pregnancy') ? <ScorePanel recipe={r} band={scoreBandFor(r, profile)} /> : null}
      {(() => { const c = costPerPortion(r, prices.map); return (
        <View testID="recipe-cost"><Text variant="small" muted>{c.cost != null && c.oldest ? tr('rc.cost.value', { cost: c.cost.toFixed(2).replace('.', ','), date: formatDate(`${c.oldest}T12:00:00`) }) : tr('rc.cost.na')}</Text>
          {c.cost == null ? <Text variant="caption" muted>{tr('rc.cost.naBody')}</Text> : null}</View>
      ); })()}
      {r.minMonths != null ? <Text variant="small" muted>{tr('rc.ageRange', { from: ageText(r.minMonths), to: ageText(r.maxMonths ?? 120) })}</Text> : null}
      <Row wrap>
        <Chip label={tr('rc.prep', { m: r.prepMin })} />
        <Chip label={tr('rc.cook', { m: r.cookMin })} />
        <Chip label={budgetLabel(r.budget)} />
        {r.meals.map((m) => <Chip key={m} label={mealLabel(m)} />)}
        {r.stages?.map((s) => <Chip key={s} tone="lavender" label={stageLabel(s)} />)}
        {r.audiences.includes('baby') || r.audiences.includes('child') ? r.textures.map((x) => <Chip key={x} tone="lavender" label={textureLabel(x)} />) : null}
      </Row>

      <SectionTitle title={tr('rc.ingredients')} />
      <Row style={{ alignItems: 'center' }}>
        <IconButton icon="minus" label={tr('rc.lessServings')} onPress={() => setServings(Math.max(1, n - 1))} />
        <Text weight="bold" testID="servings">{r.servingLabel && n === r.servings ? `${n} ${r.servingLabel}` : tr('rc.servings', { count: n })}</Text>
        <IconButton icon="plus" label={tr('rc.moreServings')} onPress={() => setServings(Math.min(20, n + 1))} />
      </Row>
      <Card>
        {r.ingredients.map((x) => {
          const d = INGREDIENTS[x.key];
          const isNew = fresh.includes(x.key);
          return (
            <View key={x.key + (x.note ?? '')} style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: 5 }} testID={`ing-${x.key}`}>
              <Text weight="bold" style={{ minWidth: 84 }}>{formatQty(scaleQty(x.qty, r.servings, n, x.unit), x.unit)}</Text>
              <Text style={{ flex: 1 }}>{d?.name ?? x.key}{x.note ? ` (${x.note})` : ''}{x.optional ? ` · ${tr('rc.optional')}` : ''}{isNew && profile.name ? ` · ${tr('rc.newFor', { name: profile.name })}` : ''}</Text>
            </View>
          );
        })}
      </Card>
      <View testID="recipe-allergens" style={{ gap: 4 }}>
        <Text variant="caption" weight="bold" muted>{tr('rc.allergens')}</Text>
        <Row wrap>{r.allergens.length ? r.allergens.map((a) => <Chip key={a} label={allergenLabel(a)} selected={profile.allergies?.includes(a)} />) : <Text variant="small">{tr('rc.noAllergen')}</Text>}</Row>
        <Text variant="caption" muted>{tr('rc.allergensNote')}</Text>
      </View>

      <SectionTitle title={tr('rc.steps')} />
      {r.steps.map((s, k) => (
        <View key={k} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Text weight="bold" color={t.colors.primary}>{k + 1}.</Text>
          <Text style={{ flex: 1 }}>{s}</Text>
        </View>
      ))}

      {r.precautions.length ? (
        <View testID="recipe-precautions"><Banner tone="warning" title={profile.audience === 'pregnancy' ? tr('rc.precautions.pregnancy') : tr('rc.precautions')}>{r.precautions.map((p) => `• ${p}`).join('\n')}</Banner></View>
      ) : null}
      {r.adaptations.length ? <Card><Text weight="bold">{tr('rc.adaptations')}</Text>{r.adaptations.map((a) => <Text key={a} variant="small" style={{ marginTop: 4 }}>• {a}</Text>)}</Card> : null}
      {r.familyAdaptations ? (
        <View testID="family-adaptations"><Card>
          <Text weight="bold">{tr('rc.familyAdaptations')}</Text>
          {r.familyAdaptations.baby ? <Text variant="small" style={{ marginTop: 4 }}>{tr('rc.forBaby')} {r.familyAdaptations.baby}</Text> : null}
          {r.familyAdaptations.child ? <Text variant="small" style={{ marginTop: 4 }}>{tr('rc.forChild')} {r.familyAdaptations.child}</Text> : null}
        </Card></View>
      ) : null}
      <Card><Text weight="bold">{tr('rc.storage')}</Text><Text variant="small" style={{ marginTop: 4 }}>{r.storage}</Text></Card>
      {r.nutrition ? <Card><Text weight="bold">{tr('rc.nutrition')}</Text><Text variant="small" style={{ marginTop: 4 }}>{r.nutrition}</Text><Text variant="caption" muted style={{ marginTop: 4 }}>{tr('rc.nutritionNote')}</Text></Card> : null}

      <Row wrap>
        <Button label={tr('rc.addToMenu')} icon="calendar" variant="secondary" size="sm" onPress={() => router.push({ pathname: '/meals/menu', params: { add: r.slug } })} />
        <Button label={tr('rc.addToShopping')} icon="shopping-cart" variant="secondary" size="sm" onPress={() => void addToShopping()} testID="add-shopping" />
      </Row>

      <SectionTitle title={tr('rc.sources')} />
      <View testID="recipe-sources" style={{ gap: 2 }}>
        {r.sources.map((s) => { const src = RECIPE_SOURCES[s]; return src ? (
          <Pressable key={s} accessibilityRole="link" onPress={() => void Linking.openURL(src.url)} style={{ minHeight: 36, justifyContent: 'center' }}>
            <Text variant="small" color={t.colors.primary}>{src.publisher} — {src.title}{src.date ? ` (${formatDate(src.date)})` : ''} · {tr('rc.consulted', { date: formatDate(src.consulted) })}</Text>
          </Pressable>
        ) : null; })}
        {r.verifiedOn ? <Text variant="caption" muted>{tr('rc.verifiedOn', { date: formatDate(r.verifiedOn) })}</Text> : null}
        {r.statusHistory.map((h, k) => <Text key={k} variant="caption" muted>{formatDate(h.on)} · {statusLabel(h.status)} · {h.by}</Text>)}
      </View>
    </Screen>
  );
}
