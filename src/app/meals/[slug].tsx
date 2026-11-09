/**
 * Fiche recette : illustration (avec sa licence), portions ajustables, ingrédients et quantités, étapes, allergènes,
 * adaptations, conservation, précautions (grossesse, âge, étouffement), intérêt nutritionnel, sources, date de
 * vérification et statut réel (« À vérifier » tant qu'aucun professionnel ne l'a relue).
 */
import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { Sheet, useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, FavoriteButton, haptic, Icon, IconButton, Row, SectionTitle, Text } from '@/components/ui';
import { RecipeArt } from '@/features/recipes/RecipeArt';
import { allergenLabel, budgetLabel, mealLabel, stageLabel, statusLabel, textureLabel } from '@/features/recipes/labels';
import { scoreBandFor, useCreateShoppingList, useFoodProfile, useIngredientPrices, useLatestShoppingList, useRecipeDislikes, useRecipeFavorites, useRecipes } from '@/lib/data/hooks-recipes';
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
import { Tappable } from '@/components/Tappable';

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
  const dislikes = useRecipeDislikes();
  const shopping = useLatestShoppingList();
  const createList = useCreateShoppingList();
  const inv = useInvalidate();
  const r = all?.find((x) => x.slug === slug) ?? null;
  const { ready: authReady } = useAuth(); // session pas encore restaurée : chargement, pas « introuvable »
  const [servings, setServings] = useState<number | null>(null);
  // Cuisine pas-à-pas : étapes cochées d'un tap, et mode plein écran une étape à la fois
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [cookAt, setCookAt] = useState<number | null>(null);
  if ((loading && !all) || (!authReady && !r)) return <Screen back title={tr('rc.title')}><Skeleton kind="detail" rows={5} /></Screen>;
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
    <Screen back title={r.title} right={<FavoriteButton icon="star" active={isFav} activeColor={t.colors.gold} labelOn={tr('rc.unfavorite')} labelOff={tr('rc.favorite')} onPress={() => fav.toggle.mutate(r.slug)} />}
      action={{ label: tr('rc.addToShopping'), icon: 'shopping-cart', onPress: () => addToShopping(), testID: 'add-shopping' }}>
      <RecipeArt recipe={r} height={190} />
      <TodaySummary title={tr('mb.rc.recipeTitle')} items={[
        { icon: 'clock', value: tr('mb.rc.minutes', { m: r.prepMin }), label: tr('mb.rc.prep') },
        { icon: 'thermometer', value: tr('mb.rc.minutes', { m: r.cookMin }), label: tr('mb.rc.cook') },
        { icon: 'users', value: String(n), label: tr('mb.rc.portions') },
      ]} />
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
      <Button label={tr('mb.rc.cookMode')} icon="play" variant="secondary" onPress={() => { setCookAt(0); haptic('light'); }} testID="rc-cook-mode" />
      {r.steps.map((s, k) => {
        const done = doneSteps.includes(k);
        return (
          <Tappable key={k} accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={`${k + 1}. ${s}`} testID={`rc-step-${k}`}
            onPress={() => { haptic('selection'); setDoneSteps((d) => (d.includes(k) ? d.filter((x) => x !== k) : [...d, k])); }}
            style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', paddingVertical: 4 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? t.colors.gold : 'transparent', borderWidth: 2, borderColor: done ? t.colors.gold : t.colors.primary }}>
              {done ? <Icon name="check" size={15} color="#FFFFFF" /> : <Text variant="caption" weight="bold" color={t.colors.primary}>{k + 1}</Text>}
            </View>
            <Text style={{ flex: 1, opacity: done ? 0.55 : 1, textDecorationLine: done ? 'line-through' : 'none' }}>{s}</Text>
          </Tappable>
        );
      })}
      <Sheet visible={cookAt != null} onClose={() => setCookAt(null)} title={cookAt != null ? tr('mb.rc.stepOf', { n: cookAt + 1, total: r.steps.length }) : ''}>
        {cookAt != null ? (
          <View style={{ gap: spacing.md }} testID="rc-cook-sheet">
            <View style={{ height: 6, borderRadius: 3, backgroundColor: t.colors.border, overflow: 'hidden' }}>
              <View style={{ width: `${((cookAt + 1) / r.steps.length) * 100}%`, height: 6, backgroundColor: t.colors.gold }} />
            </View>
            <Text style={{ fontSize: 22, lineHeight: 31 }}>{r.steps[cookAt]}</Text>
            <Row>
              <Button label={tr('mb.rc.prev')} icon="arrow-left" variant="secondary" disabled={cookAt === 0} onPress={() => setCookAt(cookAt - 1)} style={{ flex: 1 }} />
              {cookAt < r.steps.length - 1 ? (
                <Button label={tr('mb.rc.next')} iconRight="arrow-right" onPress={() => { setDoneSteps((d) => (d.includes(cookAt) ? d : [...d, cookAt])); setCookAt(cookAt + 1); haptic('light'); }} style={{ flex: 1 }} testID="rc-cook-next" />
              ) : (
                <Button label={tr('mb.rc.finish')} icon="check" onPress={() => { setDoneSteps(r.steps.map((_, i) => i)); setCookAt(null); haptic('success'); }} style={{ flex: 1 }} testID="rc-cook-finish" />
              )}
            </Row>
          </View>
        ) : null}
      </Sheet>

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
      {r.freezing ? <View testID="rc-freezing"><Card><Text weight="bold">{tr('rc.freezing')}</Text><Text variant="small" style={{ marginTop: 4 }}>{r.freezing}</Text></Card></View> : null}
      {r.ingredients.some((x) => INGREDIENTS[x.key]?.fish) ? <Text variant="caption" muted testID="rc-fish-note">{tr('rc.fishNote')}</Text> : null}
      {r.nutrition ? <Card><Text weight="bold">{tr('rc.nutrition')}</Text><Text variant="small" style={{ marginTop: 4 }}>{r.nutrition}</Text><Text variant="caption" muted style={{ marginTop: 4 }}>{tr('rc.nutritionNote')}</Text></Card> : null}

      <Row wrap>
        <Button label={tr('rc.addToMenu')} icon="calendar" variant="secondary" size="sm" onPress={() => router.push({ pathname: '/meals/menu', params: { add: r.slug } })} />
      </Row>
      {!r.personal ? (
        <View style={{ gap: 4 }}>
          {dislikes.slugs.includes(r.slug) ? <Text variant="small" muted testID="rc-disliked">{tr('rc.dislike.hint')}</Text> : null}
          <Button label={dislikes.slugs.includes(r.slug) ? tr('rc.dislike.undo') : tr('rc.dislike')} icon={dislikes.slugs.includes(r.slug) ? 'eye' : 'thumbs-down'} variant="ghost" size="sm" testID="rc-dislike"
            onPress={() => dislikes.toggle.mutate(r.slug, { onSuccess: () => { if (!dislikes.slugs.includes(r.slug)) toast(tr('rc.dislike.done'), 'info'); }, onError: (e) => toast(friendlyError(e), 'error') })} />
        </View>
      ) : null}

      <SectionTitle title={tr('rc.sources')} />
      <View testID="recipe-sources" style={{ gap: 2 }}>
        {r.sources.map((s) => { const src = RECIPE_SOURCES[s]; return src ? (
          <Tappable key={s} accessibilityRole="link" onPress={() => void Linking.openURL(src.url)} style={{ minHeight: 36, justifyContent: 'center' }}>
            <Text variant="small" color={t.colors.primary}>{src.publisher} — {src.title}{src.date ? ` (${formatDate(src.date)})` : ''} · {tr('rc.consulted', { date: formatDate(src.consulted) })}</Text>
          </Tappable>
        ) : null; })}
        {r.verifiedOn ? <Text variant="caption" muted>{tr('rc.verifiedOn', { date: formatDate(r.verifiedOn) })}</Text> : null}
        {r.statusHistory.map((h, k) => <Text key={k} variant="caption" muted>{formatDate(h.on)} · {statusLabel(h.status)} · {h.by}</Text>)}
      </View>
    </Screen>
  );
}
