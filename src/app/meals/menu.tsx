/**
 * Menu sur plusieurs jours, selon le profil affiché (grossesse et trimestre, âge et étape du bébé, enfant, famille avec
 * adaptations), les allergies, le budget, le temps disponible, le nombre de personnes et ce qu'il y a à la maison.
 * Remplacer, déplacer, ajouter une recette, enregistrer pour le foyer, puis générer la liste de courses.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { ToggleRow } from '@/features/recipes/ToggleRow';
import { Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, IconButton, Row, SectionTitle, Text } from '@/components/ui';
import { mealLabel } from '@/features/recipes/labels';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { useCreateShoppingList, useFoodProfile, useLatestMealPlan, useRecipeDislikes, useRecipeFavorites, useRecipes, useSaveMealPlan } from '@/lib/data/hooks-recipes';
import { friendlyError } from '@/lib/data/hooks-settings';
import { generateMenu, moveSlot, replaceSlot, shoppingList, type MenuOptions, type MenuSlot } from '@/lib/recipes/engine';
import { MEALS, type Meal } from '@/lib/recipes/types';
import { useUiStore } from '@/lib/store';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

export default function MenuScreen() {
  const t = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ add?: string }>();
  const { data: all } = useRecipes();
  const { profile, members } = useFoodProfile();
  const fav = useRecipeFavorites();
  const dislikes = useRecipeDislikes();
  const pantry = useUiStore((s) => s.pantry);
  const saved = useLatestMealPlan();
  const save = useSaveMealPlan();
  const createList = useCreateShoppingList();
  const aud = profile.audience;
  const [days, setDays] = useState(7);
  const [meals, setMeals] = useState<Meal[]>(aud === 'baby' ? ['lunch', 'snack'] : ['lunch', 'dinner']);
  const [servings, setServings] = useState(aud === 'baby' ? 1 : aud === 'family' ? 2 + members.length : 2);
  const [budget, setBudget] = useState<1 | 2 | null>(null);
  const [maxMin, setMaxMin] = useState<number | null>(null);
  const [useHave, setUseHave] = useState(pantry.length > 0);
  const [withKids, setWithKids] = useState(aud === 'family');
  const [trimester, setTrimester] = useState<1 | 2 | 3 | null>(profile.trimester ?? null);
  const [slots, setSlots] = useState<MenuSlot[] | null>(null);
  const [moving, setMoving] = useState<number | null>(null);
  const [adding, setAdding] = useState<string | null>(params.add ?? null);
  const byId = useMemo(() => new Map((all ?? []).map((r) => [r.id, r])), [all]);
  const p = { ...profile, trimester };
  const opts: MenuOptions = { days, meals, servings, budget, maxMinutes: maxMin, have: useHave ? pantry : [], favorites: fav.ids, exclude: dislikes.ids, members: withKids ? members : [], seed: 11 };

  // Le profil affiché se charge après le premier rendu : valeurs par défaut adaptées à ce profil
  useEffect(() => {
    if (slots) return;
    setMeals(aud === 'baby' ? ['lunch', 'snack'] : ['lunch', 'dinner']);
    setServings(aud === 'baby' ? 1 : aud === 'family' ? 2 + members.length : 2);
    setWithKids(aud === 'family');
    setTrimester(profile.trimester ?? null);
  }, [aud, members.length, profile.trimester]); // eslint-disable-line react-hooks/exhaustive-deps

  // Menu enregistré du foyer : repris à l'ouverture
  useEffect(() => {
    if (slots || !saved.plan || !saved.items.length || (saved.plan.profile as { audience?: string }).audience !== aud) return;
    setSlots(saved.items.map((i) => ({ day: i.day, meal: i.meal, recipeId: `rcp-${i.recipe_slug}`, servings: i.servings, ...(i.note ? { note: i.note } : {}) })));
    setDays(saved.plan.days);
  }, [saved.plan, saved.items, aud]); // eslint-disable-line react-hooks/exhaustive-deps

  const menuAccess = usePremiumAccess('weekly_menu', profile.name);
  const generate = () => {
    if (!all) return;
    if (!menuAccess.premium) {
      // Aperçu réel : les premiers repas que le menu proposerait pour ce profil
      const first = generateMenu(all, p, { ...opts, days: 2 }).map((x) => byId.get(x.recipeId)?.title).filter(Boolean).slice(0, 3);
      menuAccess.showPreview(<View style={{ gap: 2 }}>{first.map((tt) => <Text key={tt} variant="small">{`• ${tt}`}</Text>)}<Text variant="small" muted>{tr('pm.menuMore')}</Text></View>);
      return;
    }
    setSlots(generateMenu(all, p, opts));
  };
  const toggleMeal = (m: Meal) => setMeals((xs) => (xs.includes(m) ? xs.filter((x) => x !== m) : [...xs, m]));

  async function persist() {
    if (!slots) return null;
    try {
      const id = await save.mutateAsync({ title: tr('rc.menu.title'), days, servings, profile: { audience: aud, trimester, name: profile.name ?? null }, slots, replaceId: saved.plan?.id ?? null });
      toast(tr('rc.menu.saved'), 'success');
      return id;
    } catch (e) { toast(friendlyError(e), 'error'); return null; }
  }
  async function makeList() {
    if (!slots || !all) return;
    const planId = await persist();
    try {
      await createList.mutateAsync({ title: tr('rc.shopping.forMenu'), planId, lines: shoppingList(all, slots, useHave ? pantry : []) });
      router.push('/meals/shopping');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  function addRecipe(day: number, meal: Meal) {
    if (!adding) return;
    const r = (all ?? []).find((x) => x.slug === adding);
    if (!r) return;
    const cur = slots ?? [];
    const without = cur.filter((s) => !(s.day === day && s.meal === meal));
    setSlots([...without, { day, meal, recipeId: r.id, servings }].sort((a, b) => a.day - b.day || MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal)));
    setAdding(null);
  }

  return (
    <Screen back title={aud === 'pregnancy' ? tr('rc.menu.pregnancy') : tr('rc.menu.open')} subtitle={profile.name ? tr('rc.for', { name: profile.name }) : undefined}
      action={slots
        ? { label: tr('rc.menu.toShopping'), icon: 'shopping-cart', onPress: () => void makeList(), disabled: createList.isPending, testID: 'menu-to-shopping' }
        : { label: tr('rc.menu.generate'), icon: 'refresh-cw', onPress: generate, testID: 'menu-generate' }}>
      <TodaySummary title={tr('rc.menu.title')} items={[
        { icon: 'calendar', value: String(days), label: tr('mb.rc.days') },
        { icon: 'coffee', value: slots ? String(slots.length) : String(days * meals.length), label: tr('mb.rc.planned') },
        { icon: 'users', value: String(servings), label: tr('mb.rc.portions') },
      ]} />
      {aud === 'pregnancy' ? (
        <View style={{ gap: 4 }}>
          <Text variant="small" muted>{tr('rc.menu.trimesterHint')}</Text>
          <Row wrap>{([1, 2, 3] as const).map((x) => <Chip key={x} label={tr('rc.menu.trimester', { n: x })} selected={trimester === x} onPress={() => setTrimester(x)} />)}</Row>
        </View>
      ) : null}
      <Row wrap>{[3, 5, 7].map((d) => <Chip key={d} label={tr('rc.menu.days', { count: d })} selected={days === d} onPress={() => setDays(d)} />)}</Row>
      <Row wrap>{MEALS.map((m) => <Chip key={m} tone="lavender" label={mealLabel(m)} selected={meals.includes(m)} onPress={() => toggleMeal(m)} />)}</Row>
      <Row wrap>
        <Chip label={tr('rc.filters.budget1')} selected={budget === 1} onPress={() => setBudget(budget === 1 ? null : 1)} />
        <Chip label={tr('rc.filters.max', { m: 30 })} selected={maxMin === 30} onPress={() => setMaxMin(maxMin === 30 ? null : 30)} />
        <Chip label={tr('rc.filters.max', { m: 45 })} selected={maxMin === 45} onPress={() => setMaxMin(maxMin === 45 ? null : 45)} />
      </Row>
      <Row style={{ alignItems: 'center' }}>
        <IconButton icon="minus" label={tr('rc.lessServings')} onPress={() => setServings(Math.max(1, servings - 1))} />
        <Text weight="bold">{tr('rc.servings', { count: servings })}</Text>
        <IconButton icon="plus" label={tr('rc.moreServings')} onPress={() => setServings(Math.min(12, servings + 1))} />
      </Row>
      <ToggleRow label={tr('rc.menu.useHave', { count: pantry.length })} value={useHave} onChange={setUseHave} />
      {members.length ? <ToggleRow label={tr('rc.menu.withKids', { names: members.map((m) => m.name).join(', ') })} value={withKids} onChange={setWithKids} /> : null}
      {slots ? <Button label={tr('rc.menu.regenerate')} icon="refresh-cw" variant="secondary" onPress={generate} full testID="menu-generate" /> : null}
      {aud === 'pregnancy' ? <Banner tone="info">{tr('rc.menu.pregnancyNote')}</Banner> : null}

      {adding ? <Banner tone="info" title={tr('rc.menu.adding')}>{tr('rc.menu.addingBody', { title: (all ?? []).find((x) => x.slug === adding)?.title ?? '' })}</Banner> : null}
      {slots ? Array.from({ length: days }, (_, d) => (
        <View key={d} style={{ gap: spacing.xs }} testID={`menu-day-${d}`}>
          <SectionTitle title={tr('rc.menu.day', { n: d + 1 })} />
          {meals.map((m) => {
            const idx = slots.findIndex((s) => s.day === d && s.meal === m);
            const s = slots[idx];
            const r = s ? byId.get(s.recipeId) : null;
            return (
              <Card key={m}>
                <Text variant="caption" weight="bold" muted>{mealLabel(m).toUpperCase()}</Text>
                {r ? (
                  <>
                    <Tappable accessibilityRole="link" onPress={() => router.push(`/meals/${r.slug}`)} style={{ minHeight: 36, justifyContent: 'center' }}>
                      <Text weight="bold" testID={`menu-slot-${d}-${m}`}>{r.title}</Text>
                    </Tappable>
                    {s.note ? <Text variant="small" muted>{s.note}</Text> : null}
                    <Row wrap>
                      <Button label={tr('rc.menu.replace')} size="sm" variant="ghost" onPress={() => all && setSlots(replaceSlot(all, p, slots, idx, opts))} testID={`menu-replace-${d}-${m}`} />
                      <Button label={tr('rc.menu.move')} size="sm" variant="ghost" onPress={() => setMoving(idx)} />
                      {adding ? <Button label={tr('rc.menu.putHere')} size="sm" onPress={() => addRecipe(d, m)} /> : null}
                    </Row>
                  </>
                ) : (
                  <Row wrap>
                    <Text variant="small" muted>{tr('rc.menu.empty')}</Text>
                    {adding ? <Button label={tr('rc.menu.putHere')} size="sm" onPress={() => addRecipe(d, m)} /> : null}
                  </Row>
                )}
              </Card>
            );
          })}
        </View>
      )) : <Text muted>{tr('rc.menu.intro')}</Text>}

      {slots ? (
        <View style={{ gap: spacing.xs }}>
          <Button label={tr('rc.menu.save')} icon="save" variant="secondary" onPress={() => persist()} loading={save.isPending} full testID="menu-save" />
          <Button label={tr('rc.new.open')} icon="plus" variant="ghost" onPress={() => router.push('/meals/new')} full />
        </View>
      ) : null}

      <Sheet visible={moving != null} onClose={() => setMoving(null)} title={tr('rc.menu.moveTo')}>
        {Array.from({ length: days }, (_, d) => (
          <Row key={d} wrap>
            <Text weight="bold" style={{ width: 64 }}>{tr('rc.menu.day', { n: d + 1 })}</Text>
            {meals.map((m) => (
              <Tappable key={m} accessibilityRole="button" onPress={() => { if (slots && moving != null) setSlots(moveSlot(slots, moving, { day: d, meal: m })); setMoving(null); }}
                style={{ paddingHorizontal: 10, minHeight: 36, justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: t.colors.border }}>
                <Text variant="small">{mealLabel(m)}</Text>
              </Tappable>
            ))}
          </Row>
        ))}
      </Sheet>
    </Screen>
  );
}

