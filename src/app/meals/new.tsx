/**
 * Ajouter une recette personnelle (visible par mon foyer, jamais présentée comme relue ou validée).
 * Une personne de l'équipe éditoriale peut aussi créer un brouillon de la bibliothèque, qui passe ensuite par la relecture.
 * Les allergènes sont déduits des ingrédients choisis ; les contrôles automatiques s'affichent avant l'enregistrement.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ToggleRow } from '@/features/recipes/ToggleRow';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, IconButton, Row, SectionTitle, Text } from '@/components/ui';
import { allergenLabel, mealLabel } from '@/features/recipes/labels';
import { useFoodProfile, useRecipes, useSavePersonalRecipe } from '@/lib/data/hooks-recipes';
import { friendlyError, useMyRoles } from '@/lib/data/hooks-settings';
import { generatedPhoto } from '@/lib/recipes/build';
import { INGREDIENTS } from '@/lib/recipes/ingredients';
import { MEALS, type Audience, type Meal, type Recipe, type RecipeIngredient, type Unit } from '@/lib/recipes/types';
import { derivedAllergens, fold, isVegetarian, validateRecipe } from '@/lib/recipes/validate';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

const UNITS: Unit[] = ['g', 'ml', 'u', 'cs', 'cc', 'pincee'];
const AUDS: Audience[] = ['pregnancy', 'baby', 'child', 'family'];
const slugify = (s: string) => fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

export default function NewRecipe() {
  const toast = useToast();
  const { profile } = useFoodProfile();
  const { data: all } = useRecipes();
  const { isEditor } = useMyRoles();
  const save = useSavePersonalRecipe();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [aud, setAud] = useState<Audience>(profile.audience === 'adult' ? 'family' : (profile.audience as Audience));
  const [meals, setMeals] = useState<Meal[]>(['dinner']);
  const [servings, setServings] = useState(4);
  const [prep, setPrep] = useState('15');
  const [cook, setCook] = useState('20');
  const [ings, setIngs] = useState<RecipeIngredient[]>([]);
  const [q, setQ] = useState('');
  const [steps, setSteps] = useState('');
  const [storage, setStorage] = useState('');
  const [library, setLibrary] = useState(false);

  const recipe: Recipe = useMemo(() => {
    const slug = `${slugify(title) || 'recette'}-${Date.now().toString(36).slice(-4)}`;
    const base = { ingredients: ings };
    return {
      id: `rcp-${slug}`, slug, title: title.trim(), summary: summary.trim(), audiences: [aud], meals, textures: aud === 'baby' ? ['mashed'] : ['regular'], servings,
      prepMin: Number(prep) || 0, cookMin: Number(cook) || 0, ingredients: ings, steps: steps.split('\n').map((s) => s.trim()).filter(Boolean),
      allergens: derivedAllergens(base), tags: isVegetarian(base) ? ['vegetarian'] : [], adaptations: [], storage: storage.trim(), precautions: [], nutrition: '',
      budget: 2, seasons: 'all', temperature: 'hot', photo: generatedPhoto(title.trim() || 'recette'), sources: [], verifiedOn: '', status: 'ai_draft', statusHistory: [], personal: !library,
    };
  }, [title, summary, aud, meals, servings, prep, cook, ings, steps, storage, library]);

  // Contrôles utiles à une recette saisie à la main (les exigences de sources et de précautions concernent la bibliothèque)
  const checks = validateRecipe(recipe).filter((e) => library || !/source|précaution|SPF|listéri|toxo|licence|étape « bébé »/i.test(e));
  const dup = (all ?? []).some((r) => fold(r.title) === fold(recipe.title));
  const picker = q.length >= 2 ? Object.keys(INGREDIENTS).filter((k) => fold(INGREDIENTS[k].name).includes(fold(q)) && !ings.some((x) => x.key === k)).slice(0, 8) : [];
  const setIng = (k: number, patch: Partial<RecipeIngredient>) => setIngs(ings.map((x, n) => (n === k ? { ...x, ...patch } : x)));

  async function submit() {
    if (!recipe.title || !recipe.steps.length || !ings.length) { toast(tr('rc.new.missing'), 'error'); return; }
    try {
      const slug = await save.mutateAsync({ recipe, library });
      toast(tr('rc.new.saved'), 'success');
      router.replace(`/meals/${slug}`);
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('rc.new.open')}>
      <Banner tone="info">{tr('rc.new.intro')}</Banner>
      {isEditor ? <ToggleRow label={tr('rc.new.library')} value={library} onChange={setLibrary} /> : null}
      <Field label={tr('rc.new.title')} value={title} onChangeText={setTitle} maxLength={120} testID="new-title" />
      <Field label={tr('rc.new.summary')} optional value={summary} onChangeText={setSummary} maxLength={300} />
      <Text weight="bold">{tr('rc.new.for')}</Text>
      <Row wrap>{AUDS.map((a) => <Chip key={a} label={tr(`rc.aud.${a}` as TKey)} selected={aud === a} onPress={() => setAud(a)} />)}</Row>
      <Row wrap>{MEALS.map((m) => <Chip key={m} tone="lavender" label={mealLabel(m)} selected={meals.includes(m)} onPress={() => setMeals(meals.includes(m) ? meals.filter((x) => x !== m) : [...meals, m])} />)}</Row>
      <Row>
        <View style={{ flex: 1 }}><Field label={tr('rc.new.prep')} value={prep} onChangeText={setPrep} keyboardType="number-pad" maxLength={3} /></View>
        <View style={{ flex: 1 }}><Field label={tr('rc.new.cook')} value={cook} onChangeText={setCook} keyboardType="number-pad" maxLength={3} /></View>
      </Row>
      <Row style={{ alignItems: 'center' }}>
        <IconButton icon="minus" label={tr('rc.lessServings')} onPress={() => setServings(Math.max(1, servings - 1))} />
        <Text weight="bold">{tr('rc.servings', { count: servings })}</Text>
        <IconButton icon="plus" label={tr('rc.moreServings')} onPress={() => setServings(Math.min(20, servings + 1))} />
      </Row>

      <SectionTitle title={tr('rc.ingredients')} />
      {ings.map((x, k) => (
        <Card key={x.key}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text weight="bold" style={{ flex: 1 }}>{INGREDIENTS[x.key].name}</Text>
            <IconButton icon="x" label={tr('rc.new.removeIng')} onPress={() => setIngs(ings.filter((_, n) => n !== k))} />
          </Row>
          <Row>
            <View style={{ width: 96 }}><Field label={tr('rc.new.qty')} value={x.qty == null ? '' : String(x.qty)} onChangeText={(v) => setIng(k, { qty: v ? Number(v.replace(',', '.')) || null : null })} keyboardType="decimal-pad" maxLength={6} /></View>
            <Row wrap style={{ flex: 1 }}>{UNITS.map((u) => <Chip key={u} label={tr(`rc.unit.${u}` as TKey)} selected={x.unit === u} onPress={() => setIng(k, { unit: u })} />)}</Row>
          </Row>
        </Card>
      ))}
      <Field label={tr('rc.new.addIng')} value={q} onChangeText={setQ} autoCorrect={false} testID="new-ing-search" />
      {picker.length ? <Row wrap>{picker.map((k) => <Chip key={k} label={INGREDIENTS[k].name} onPress={() => { setIngs([...ings, { key: k, qty: null, unit: 'g' }]); setQ(''); }} />)}</Row> : null}
      {recipe.allergens.length ? <Text variant="small">{tr('rc.allergens')} : {recipe.allergens.map(allergenLabel).join(', ')}</Text> : null}

      <Field label={tr('rc.new.steps')} hint={tr('rc.new.stepsHint')} value={steps} onChangeText={setSteps} multiline maxLength={4000} testID="new-steps" />
      <Field label={tr('rc.storage')} optional value={storage} onChangeText={setStorage} maxLength={400} />

      {dup ? <Banner tone="warning">{tr('rc.new.duplicate')}</Banner> : null}
      {checks.length && (title || ings.length) ? (
        <View testID="new-checks"><Banner tone="warning" title={tr('rc.new.checks')}>{checks.map((c) => `• ${c}`).join('\n')}</Banner></View>
      ) : null}
      <Text variant="caption" muted>{library ? tr('rc.new.libraryNote') : tr('rc.new.personalNote')}</Text>
      <View style={{ gap: spacing.xs }}>
        <Button label={tr('common.save')} loading={save.isPending} onPress={() => void submit()} full testID="new-save" />
      </View>
    </Screen>
  );
}
