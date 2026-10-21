/**
 * « Repas et recettes » : bibliothèque adaptée au profil affiché (grossesse, bébé selon son étape et sa texture,
 * enfant selon son âge, famille), recherche, filtres, favoris, accès au menu, aux courses et à « Que puis-je cuisiner ? ».
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ProfileSwitcher } from '@/components/Family';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Button, Chip, Field, Icon, Row, Text } from '@/components/ui';
import { RecipeCard } from '@/features/recipes/RecipeCard';
import { allergenLabel, mealLabel, MEALS_FOR, TAGS_FOR, tagLabel, textureLabel, stageLabel } from '@/features/recipes/labels';
import { meetsNeed, NEEDS, stageOf, useFoodProfile, useRecipeDislikes, useRecipeFavorites, useRecipes, useRecipeScores, type Need } from '@/lib/data/hooks-recipes';
import { currentSeason, filterRecipes, type RecipeFilter } from '@/lib/recipes/engine';
import { ALLERGENS, type Allergen, type Meal, type Recipe, type Tag } from '@/lib/recipes/types';
import { childAge } from '@/lib/domain/child';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { ResultsFade } from '@/components/MotionKit';

/** Classement par profil, âge et texture (une recette peut appartenir à plusieurs groupes). */
const overlaps = (r: Recipe, from: number, to: number) => r.minMonths != null && r.minMonths < to && (r.maxMonths ?? 999) > from;
const isKid = (r: Recipe) => r.audiences.includes('baby') || r.audiences.includes('child');
const GROUPS: { key: string; test: (r: Recipe) => boolean }[] = [
  { key: 'pregnancy', test: (r) => r.audiences.includes('pregnancy') },
  { key: 'start', test: (r) => r.audiences.includes('baby') && (r.stages?.includes('start') || (r.minMonths ?? 99) <= 6) && r.textures.includes('smooth') },
  { key: 'smooth', test: (r) => r.audiences.includes('baby') && r.textures.includes('smooth') },
  { key: 'ground', test: (r) => r.audiences.includes('baby') && r.textures.includes('ground') },
  { key: 'mashed', test: (r) => r.audiences.includes('baby') && r.textures.includes('mashed') },
  { key: 'pieces', test: (r) => r.audiences.includes('baby') && r.textures.includes('pieces') },
  { key: 'm12_24', test: (r) => isKid(r) && overlaps(r, 12, 24) },
  { key: 'y2_3', test: (r) => isKid(r) && overlaps(r, 24, 36) },
  { key: 'y3_6', test: (r) => isKid(r) && overlaps(r, 36, 72) },
  { key: 'y6_10', test: (r) => isKid(r) && overlaps(r, 72, 120) },
  { key: 'family', test: (r) => r.audiences.includes('family') },
];

export default function Meals() {
  const t = useTheme();
  const { data: all, loading } = useRecipes();
  const { profile, scope } = useFoodProfile();
  const fav = useRecipeFavorites();
  const dislikes = useRecipeDislikes();
  const [showHidden, setShowHidden] = useState(false);
  const [classic, setClassic] = useState(false);
  const [familyOnly, setFamilyOnly] = useState(false);
  const [quickOnly, setQuickOnly] = useState(false);
  const [fish, setFish] = useState(false);
  const [group, setGroup] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [meal, setMeal] = useState<Meal | null>(null);
  const [tag, setTag] = useState<Tag | null>(null);
  const [onlyFav, setOnlyFav] = useState(false);
  const [more, setMore] = useState(false);
  const [maxMin, setMaxMin] = useState<number | null>(null);
  const [budget, setBudget] = useState<1 | 2 | null>(null);
  const [season, setSeason] = useState(false);
  const [temp, setTemp] = useState<'hot' | 'cold' | null>(null);
  const [veg, setVeg] = useState(false);
  const [noPork, setNoPork] = useState(false);
  const [excl, setExcl] = useState<Allergen[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [byScore, setByScore] = useState(false);
  const [shown, setShown] = useState(30);

  const filter: RecipeFilter = { q, meal, tag, maxMinutes: maxMin, budget, season: season ? currentSeason() : null, temperature: temp, vegetarian: veg, noPork, allergens: excl, favorites: onlyFav ? fav.ids : null, fish, exclude: showHidden ? null : dislikes.ids };
  const quickTags: Tag[] = [...(classic ? ['classic' as Tag] : []), ...(familyOnly ? ['family' as Tag] : []), ...(quickOnly ? ['quick' as Tag] : [])];
  const scores = useRecipeScores(all, profile);
  const list = useMemo(() => {
    const g = GROUPS.find((x) => x.key === group);
    const base = all ? filterRecipes(all, profile, filter).filter((r) => needs.every((n) => meetsNeed(r, scores.get(r.id), n)) && quickTags.every((x) => r.tags.includes(x)) && (!g || g.test(r))) : [];
    return byScore ? [...base].sort((a, b) => (scores.get(b.id)?.score ?? 0) - (scores.get(a.id)?.score ?? 0)) : base;
  }, [all, profile, JSON.stringify(filter), needs.join(','), byScore, scores, quickTags.join(), group]); // eslint-disable-line react-hooks/exhaustive-deps
  // Groupes présents pour le profil affiché (sans filtre de groupe)
  const groups = useMemo(() => {
    const pool = all ? filterRecipes(all, profile, { exclude: showHidden ? null : dislikes.ids }) : [];
    return GROUPS.filter((x) => pool.some(x.test)).map((x) => x.key);
  }, [all, profile, showHidden, dislikes.ids.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const aud = profile.audience;
  const stage = stageOf(profile);
  const heading = aud === 'pregnancy' ? tr('rc.head.pregnancy') : aud === 'baby' ? tr('rc.head.baby', { name: profile.name ?? '' }) : aud === 'child' ? tr('rc.head.child', { name: profile.name ?? '' }) : aud === 'family' ? tr('rc.head.family') : tr('rc.head.adult');
  const sub = aud === 'baby' && stage
    ? `${stageLabel(stage)} · ${tr('rc.textureNow', { t: textureLabel(profile.texture ?? (stage === 'start' ? 'smooth' : stage === 'm6_8' ? 'mashed' : stage === 'm9_12' ? 'ground' : 'pieces')) })}`
    : aud === 'child' && scope.child ? childAge(scope.child.birth_date).label : null;

  return (
    <Screen back title={tr('rc.title')} subtitle={tr('rc.subtitle')}>
      <ProfileSwitcher />
      <View testID="meals-heading" style={{ gap: 2 }}>
        <Text variant="heading" accessibilityRole="header">{heading}</Text>
        {sub ? <Text variant="small" muted>{sub}</Text> : null}
        {profile.allergies?.length ? <Text variant="small" color={t.colors.primary} testID="meals-allergies">{tr('rc.allergiesExcluded', { list: profile.allergies.map(allergenLabel).join(', ') })}</Text> : null}
      </View>
      {aud === 'pregnancy' ? <Banner tone="info">{tr('rc.banner.pregnancy')}</Banner> : aud === 'baby' ? <Banner tone="info">{tr('rc.banner.baby')}</Banner> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
        <Button label={aud === 'pregnancy' ? tr('rc.menu.pregnancy') : tr('rc.menu.open')} icon="calendar" size="sm" variant="secondary" onPress={() => router.push('/meals/menu')} testID="open-menu" />
        <Button label={tr('rc.shopping.open')} icon="shopping-cart" size="sm" variant="secondary" onPress={() => router.push('/meals/shopping')} testID="open-shopping" />
        <Button label={tr('rc.rank.open')} icon="award" size="sm" variant="secondary" onPress={() => router.push('/meals/rankings')} testID="open-rankings" />
        <Button label={tr('rc.pantry.open')} icon="package" size="sm" variant="secondary" onPress={() => router.push('/meals/pantry')} testID="open-pantry" />
        {aud === 'baby' && profile.name ? <Button label={tr('rc.settings.open', { name: profile.name })} icon="sliders" size="sm" variant="secondary" onPress={() => router.push('/meals/settings')} testID="open-food-settings" /> : null}
        <Button label={tr('rc.new.open')} icon="plus" size="sm" variant="ghost" onPress={() => router.push('/meals/new')} />
      </ScrollView>

      <Field label={tr('rc.search')} value={q} onChangeText={setQ} placeholder={tr('rc.searchPh')} autoCorrect={false} testID="recipes-search" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
        <Chip label={tr('rc.all')} selected={!meal} onPress={() => setMeal(null)} />
        {MEALS_FOR[aud].map((m) => <Chip key={m} label={mealLabel(m)} selected={meal === m} onPress={() => setMeal(meal === m ? null : m)} />)}
        <Chip label={tr('rc.favorites')} icon="star" selected={onlyFav} onPress={() => setOnlyFav(!onlyFav)} />
      </ScrollView>
      <View testID="rc-quick-filters"><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
        <Chip tone="lavender" label={tr('rc.quick.classic')} selected={classic} onPress={() => setClassic(!classic)} />
        <Chip tone="lavender" label={tr('rc.quick.family')} selected={familyOnly} onPress={() => setFamilyOnly(!familyOnly)} />
        <Chip tone="lavender" label={tr('rc.quick.quick')} selected={quickOnly} onPress={() => setQuickOnly(!quickOnly)} />
        <Chip tone="lavender" label={tr('rc.quick.budget')} selected={budget === 1} onPress={() => setBudget(budget === 1 ? null : 1)} />
        <Chip tone="lavender" label={tr('rc.quick.fish')} selected={fish} onPress={() => setFish(!fish)} />
        <Chip tone="lavender" label={tr('rc.quick.veg')} selected={veg} onPress={() => setVeg(!veg)} />
        <Chip tone="lavender" label={tr('rc.quick.noPork')} selected={noPork} onPress={() => setNoPork(!noPork)} />
        <Chip tone="lavender" label={excl.length ? `${tr('rc.quick.allergens')} (${excl.length})` : tr('rc.quick.allergens')} selected={excl.length > 0} onPress={() => setMore(true)} />
      </ScrollView></View>
      {groups.length > 1 ? (
        <View testID="rc-groups" style={{ gap: 4 }}>
          <Text variant="caption" muted>{tr('rc.groups')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
            {groups.map((k) => <Chip key={k} label={tr(`rc.group.${k}` as never)} selected={group === k} onPress={() => setGroup(group === k ? null : k)} />)}
          </ScrollView>
        </View>
      ) : null}
      {fish ? <Text variant="caption" muted>{tr('rc.fishNote')}</Text> : null}
      <Tappable accessibilityRole="button" onPress={() => setMore(!more)} style={{ minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6 }} testID="more-filters">
        <Icon name="sliders" size={16} color={t.colors.primary} /><Text variant="small" weight="bold" color={t.colors.primary}>{more ? tr('rc.filters.less') : tr('rc.filters.more')}</Text>
      </Tappable>
      {more ? (
        <View style={{ gap: spacing.xs }}>
          <Row wrap>{TAGS_FOR[aud].map((x) => <Chip key={x} tone="lavender" label={tagLabel(x)} selected={tag === x} onPress={() => setTag(tag === x ? null : x)} />)}</Row>
          <Row wrap>
            {[15, 30, 60].map((m) => <Chip key={m} label={tr('rc.filters.max', { m })} selected={maxMin === m} onPress={() => setMaxMin(maxMin === m ? null : m)} />)}
            <Chip label={tr('rc.filters.season')} selected={season} onPress={() => setSeason(!season)} />
            <Chip label={tr('rc.filters.hot')} selected={temp === 'hot'} onPress={() => setTemp(temp === 'hot' ? null : 'hot')} />
            <Chip label={tr('rc.filters.cold')} selected={temp === 'cold'} onPress={() => setTemp(temp === 'cold' ? null : 'cold')} />
          </Row>
          <Text variant="caption" muted>{tr('rc.needs')}</Text>
          <Row wrap>{NEEDS.map((n) => <Chip key={n} label={tr(`rc.need.${n}`)} selected={needs.includes(n)} onPress={() => setNeeds(needs.includes(n) ? needs.filter((x) => x !== n) : [...needs, n])} />)}</Row>
          <Text variant="caption" muted>{tr('rc.filters.exclude')}</Text>
          <Row wrap>{ALLERGENS.map((a) => <Chip key={a} label={allergenLabel(a)} selected={excl.includes(a)} onPress={() => setExcl(excl.includes(a) ? excl.filter((x) => x !== a) : [...excl, a])} />)}</Row>
        </View>
      ) : null}

      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="small" muted testID="recipes-count">{tr('rc.count', { count: list.length })}</Text>
        <Chip label={tr('rc.sort.score')} icon="bar-chart-2" selected={byScore} onPress={() => setByScore(!byScore)} />
      </Row>
      {loading && !all ? <Skeleton rows={4} /> : !list.length ? <EmptyState icon="search" title={tr('rc.none')} body={tr('rc.noneBody')} /> : (
        <ResultsFade k={list.map((r) => r.id).slice(0, 40).join()} style={{ gap: spacing.xs }}>
          {list.slice(0, shown).map((r) => <RecipeCard key={r.id} r={r} favorite={fav.ids.includes(r.id)} score={scores.get(r.id)?.score} />)}
          {list.length > shown ? <Button label={tr('rc.more', { count: list.length - shown })} variant="secondary" onPress={() => setShown(shown + 30)} testID="recipes-more" /> : null}
        </ResultsFade>
      )}
      {dislikes.slugs.length ? <Button label={showHidden ? tr('rc.dislike.hide') : tr('rc.dislike.show', { count: dislikes.slugs.length })} variant="ghost" size="sm" onPress={() => setShowHidden(!showHidden)} testID="recipes-hidden-toggle" /> : null}
      <Text variant="caption" muted>{tr('rc.footer')}</Text>
    </Screen>
  );
}
