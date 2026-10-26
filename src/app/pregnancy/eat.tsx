/**
 * « Bien manger enceinte » (remplace « Repas » dans le profil grossesse) :
 *  · idées de petits-déjeuners, déjeuners, dîners et collations (vraies recettes de la bibliothèque, compatibles
 *    grossesse : aucune ne contient un aliment à éviter, cuissons à cœur précisées) ;
 *  · repas adaptés aux nausées, à la fatigue ou à la constipation ;
 *  · filtres : trimestre, préférences (végétarien, sans porc), allergènes ;
 *  · repères (fer, calcium, protéines, fibres, vitamine B9), aliments à éviter ou à préparer avec précaution,
 *    hygiène et cuisson, liste de courses, favoris.
 * Jamais de complément alimentaire recommandé ; sources officielles françaises datées ; pas un avis médical.
 */
import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Icon, Row, SectionTitle, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { RecipeCard } from '@/features/recipes/RecipeCard';
import { allergenLabel, mealLabel } from '@/features/recipes/labels';
import { useActivePregnancy } from '@/lib/data/hooks';
import { useRecipeFavorites, useRecipes } from '@/lib/data/hooks-recipes';
import { filterRecipes } from '@/lib/recipes/engine';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import type { Allergen, Meal, Recipe, Tag } from '@/lib/recipes/types';
import { EAT_AVOID, EAT_HYGIENE, EAT_INTERESTING, NOT_ADVICE, NUTRIENTS, NUTRITION_SOURCES, SUPPLEMENT_NOTICE, type FoodSection } from '@/content/pregnancyCare';
import { formatDate, getLocale, t as tr, type TKey } from '@/i18n';

const L = (fr: string, en: string) => (getLocale().startsWith('fr') ? fr : en);
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];
type Need = 'nausea' | 'fatigue' | 'constipation' | 'iron' | 'calcium';
const NEED_TAG: Record<Need, Tag> = { nausea: 'nausea', fatigue: 'fatigue', constipation: 'fiber', iron: 'iron', calcium: 'calcium' };
const COMMON_ALLERGENS: Allergen[] = ['milk', 'gluten', 'eggs', 'fish', 'nuts', 'peanuts', 'sesame', 'soy'];

export default function EatWellPregnant() {
  const t = useTheme();
  const pregnancy = useActivePregnancy();
  const current = pregnancy ? pregnancyProgress(pregnancy.due_date).trimester : 1;
  const { data: all, loading } = useRecipes();
  const fav = useRecipeFavorites();
  const [trimester, setTrimester] = useState<1 | 2 | 3>(current);
  const [meal, setMeal] = useState<Meal | 'fav'>('breakfast');
  const [need, setNeed] = useState<Need | null>(null);
  const [vegetarian, setVegetarian] = useState(false);
  const [noPork, setNoPork] = useState(false);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [filters, setFilters] = useState(false);

  const list = useMemo<Recipe[]>(() => {
    if (!all) return [];
    const base = filterRecipes(all, { audience: 'pregnancy', trimester }, {
      meal: meal === 'fav' ? null : meal === 'snack' ? null : meal, vegetarian, noPork, allergens, tag: need ? NEED_TAG[need] : null,
    }).filter((r) => r.audiences.includes('pregnancy'));
    const byMeal = meal === 'fav' ? base.filter((r) => fav.slugs.includes(r.slug)) : meal === 'snack' ? base.filter((r) => r.meals.includes('snack') || r.meals.includes('dessert')) : base;
    // Trimestre : les repères du moment d'abord (ex. nausées et B9 au 1er trimestre, fer et calcium ensuite)
    const prio: Record<1 | 2 | 3, Tag[]> = { 1: ['nausea', 'b9', 'quick'], 2: ['iron', 'calcium', 'protein'], 3: ['iron', 'calcium', 'fiber'] };
    return [...byMeal].sort((a, b) => b.tags.filter((x) => prio[trimester].includes(x)).length - a.tags.filter((x) => prio[trimester].includes(x)).length);
  }, [all, trimester, meal, need, vegetarian, noPork, allergens, fav.slugs]);

  return (
    <Screen back title={tr('care.eat.title')} subtitle={tr('care.eat.subtitle', { n: current })}
      action={{ label: tr('care.eat.shopping'), icon: 'shopping-cart', onPress: () => router.push('/meals/shopping'), testID: 'eat-shopping' }}>
      <View testID="eat-pregnant" />
      <TodaySummary items={[
        { icon: 'layers', value: tr('care.cal.trimester', { count: current }), label: L('Mon trimestre', 'My trimester') },
        { icon: 'coffee', value: all ? String(list.length) : '—', label: L('Idées adaptées', 'Matching ideas') },
        { icon: 'heart', value: String(fav.slugs.length), label: L('Favoris', 'Favourites') },
      ]} />

      <SectionTitle title={tr('care.eat.ideas')} />
      <Row wrap>
        {MEALS.map((m) => <Chip key={m} label={m === 'snack' ? tr('care.eat.snack') : mealLabel(m)} selected={meal === m} onPress={() => setMeal(m)} testID={`eat-meal-${m}`} />)}
        <Chip label={tr('care.eat.favorites', { count: fav.slugs.length })} icon="heart" selected={meal === 'fav'} onPress={() => setMeal('fav')} testID="eat-meal-fav" />
      </Row>
      <Text variant="label">{tr('care.eat.need')}</Text>
      <Row wrap>
        {(Object.keys(NEED_TAG) as Need[]).map((n) => <Chip key={n} label={tr(`care.eat.need.${n}` as TKey)} selected={need === n} onPress={() => setNeed(need === n ? null : n)} testID={`eat-need-${n}`} />)}
      </Row>
      {(() => {
        const active = (trimester !== current ? 1 : 0) + (vegetarian ? 1 : 0) + (noPork ? 1 : 0) + allergens.length;
        return <Chip label={`${L('Trimestre, préférences, allergènes', 'Trimester, preferences, allergens')}${active ? ` · ${active}` : ''}`} icon={filters ? 'chevron-up' : 'sliders'} selected={filters || active > 0} onPress={() => setFilters(!filters)} testID="eat-filters" />;
      })()}
      {filters ? (
        <>
          <Text variant="label">{tr('care.eat.trimester')}</Text>
          <Row wrap>
            {([1, 2, 3] as const).map((n) => <Chip key={n} label={tr('care.cal.trimester', { count: n }) + (n === current ? ` · ${tr('care.eat.now')}` : '')} selected={trimester === n} onPress={() => setTrimester(n)} testID={`eat-trimester-${n}`} />)}
          </Row>
          <Text variant="label">{tr('care.eat.prefs')}</Text>
          <Row wrap>
            <Chip label={tr('rc.tag.vegetarian')} selected={vegetarian} onPress={() => setVegetarian(!vegetarian)} testID="eat-veg" />
            <Chip label={tr('care.eat.noPork')} selected={noPork} onPress={() => setNoPork(!noPork)} />
            {COMMON_ALLERGENS.map((a) => <Chip key={a} label={tr('care.eat.without', { a: allergenLabel(a).toLowerCase() })} selected={allergens.includes(a)} onPress={() => setAllergens(allergens.includes(a) ? allergens.filter((x) => x !== a) : [...allergens, a])} testID={`eat-al-${a}`} />)}
          </Row>
        </>
      ) : null}
      {loading && !all ? <Skeleton kind="card" rows={1} /> : list.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.md }} testID="eat-list">
          {list.slice(0, 12).map((r) => <View key={r.id} style={{ width: 240 }}><RecipeCard r={r} favorite={fav.slugs.includes(r.slug)} /></View>)}
        </ScrollView>
      ) : <Text muted testID="eat-empty">{tr(meal === 'fav' ? 'care.eat.noFav' : 'care.eat.none')}</Text>}
      <Row wrap>
        <Button label={tr('care.eat.allRecipes')} size="sm" variant="secondary" icon="book-open" onPress={() => router.push('/meals')} />
        <Button label={tr('care.eat.menu')} size="sm" variant="ghost" icon="calendar" onPress={() => router.push('/meals/menu')} />
      </Row>

      <SectionTitle title={tr('care.eat.nutrients')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.md }} testID="eat-nutrients">
        {NUTRIENTS.map((n) => (
          <View key={n.key} style={{ width: 260 }}>
            <Card>
              <Text weight="bold">{n.title}</Text>
              <Text variant="small">{n.why}</Text>
              <Text variant="small"><Text variant="small" weight="bold">{tr('care.eat.where')} </Text>{n.where}</Text>
              <Text variant="small" muted>{n.professional}</Text>
            </Card>
          </View>
        ))}
      </ScrollView>

      <Banner tone="info" icon="shield">{SUPPLEMENT_NOTICE}</Banner>

      {[EAT_INTERESTING, EAT_AVOID, EAT_HYGIENE].map((s) => <Section key={s.key} s={s} open={open === s.key} onToggle={() => setOpen(open === s.key ? null : s.key)} />)}

      <View style={{ gap: 2 }}>
        <Text variant="caption" muted>{tr('care.eat.sources')}</Text>
        {NUTRITION_SOURCES.map((src) => (
          <Tappable key={src.url} accessibilityRole="link" onPress={() => void Linking.openURL(src.url)} style={{ minHeight: 32, justifyContent: 'center' }}>
            <Text variant="caption" color={t.colors.primary}>{src.label}{src.published ? ` (${formatDate(`${src.published}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' })})` : ''}</Text>
          </Tappable>
        ))}
        <Text variant="caption" muted>{NOT_ADVICE}</Text>
      </View>
    </Screen>
  );
}

function Section({ s, open, onToggle }: { s: FoodSection; open: boolean; onToggle: () => void }) {
  const t = useTheme();
  return (
    <Card>
      <Tappable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} testID={`eat-section-${s.key}`} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44 }}>
        <Text weight="bold" style={{ flex: 1 }}>{s.title}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={t.colors.textMuted} />
      </Tappable>
      {open ? (
        <View style={{ gap: 6 }}>
          {s.items.map((i) => (
            <View key={i.title}>
              <Text variant="small" weight="bold">{i.title}</Text>
              <Text variant="small">{i.text}</Text>
            </View>
          ))}
          {s.sources.map((src) => (
            <Tappable key={src.url} accessibilityRole="link" onPress={() => void Linking.openURL(src.url)} style={{ minHeight: 32, justifyContent: 'center' }}>
              <Text variant="caption" color={t.colors.primary}>{src.label}{src.published ? ` (${formatDate(`${src.published}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' })})` : ''}</Text>
            </Tappable>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
