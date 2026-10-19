/**
 * Réglages de l'alimentation d'un bébé ou d'un enfant : texture actuellement proposée, aliments déjà introduits,
 * allergies connues (fiche de l'enfant), végétarien, sans porc, aliments refusés, recommandations du professionnel.
 * L'application ne diagnostique aucune allergie et ne propose pas de nouvel allergène quand un avis est nécessaire.
 */
import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ToggleRow } from '@/features/recipes/ToggleRow';
import { useToast } from '@/components/Overlays';
import { EmptyState } from '@/components/States';
import { Banner, Button, Card, Chip, Field, ListRow, Row, Text } from '@/components/ui';
import { textureLabel } from '@/features/recipes/labels';
import { useScope } from '@/lib/data/hooks-scope';
import { useChildFoodSettings, useIntroducedFoods, useSaveChildFoodSettings } from '@/lib/data/hooks-recipes';
import { friendlyError } from '@/lib/data/hooks-settings';
import { INGREDIENTS } from '@/lib/recipes/ingredients';
import { TEXTURES, type Texture } from '@/lib/recipes/types';
import { t as tr } from '@/i18n';

export default function FoodSettings() {
  const toast = useToast();
  const scope = useScope();
  const child = scope.child;
  const s = useChildFoodSettings(child?.id);
  const intro = useIntroducedFoods(child?.id);
  const save = useSaveChildFoodSettings();
  const [texture, setTexture] = useState<Texture | null>(null);
  const [veg, setVeg] = useState(false);
  const [noPork, setNoPork] = useState(false);
  const [refused, setRefused] = useState<string[]>([]);
  const [advice, setAdvice] = useState('');
  const [needAdvice, setNeedAdvice] = useState(false);
  useEffect(() => {
    if (!s.data) return;
    setTexture(s.data.texture); setVeg(s.data.vegetarian); setNoPork(s.data.no_pork); setRefused(s.data.refused); setAdvice(s.data.pro_advice ?? ''); setNeedAdvice(s.data.allergen_advice_needed);
  }, [s.data]);
  if (!child) return <Screen back title={tr('rc.settings.title')}><EmptyState icon="smile" title={tr('rc.settings.noChild')} /></Screen>;
  return (
    <Screen back title={tr('rc.settings.open', { name: child.first_name })}>
      <Banner tone="info">{tr('rc.settings.intro')}</Banner>
      <Text weight="bold">{tr('rc.settings.texture')}</Text>
      <Row wrap>{TEXTURES.map((x) => <Chip key={x} label={textureLabel(x)} selected={texture === x} onPress={() => setTexture(texture === x ? null : x)} />)}</Row>
      <Card>
        <ListRow icon="check-circle" title={tr('rc.settings.introduced', { count: intro.data?.length ?? 0 })} subtitle={(intro.data ?? []).slice(0, 6).map((f) => f.food_name).join(', ') || undefined} onPress={() => router.push(`/child/${child.id}/foods`)} />
        <ListRow icon="alert-circle" title={tr('rc.settings.allergies')} subtitle={(child.allergies_declared ?? []).join(', ') || tr('rc.settings.noAllergy')} onPress={() => router.push(`/child/${child.id}`)} />
      </Card>
      <ToggleRow label={tr('rc.filters.veg')} value={veg} onChange={setVeg} />
      <ToggleRow label={tr('rc.filters.noPork')} value={noPork} onChange={setNoPork} />
      <ToggleRow label={tr('rc.settings.needAdvice')} hint={tr('rc.settings.needAdviceHint')} value={needAdvice} onChange={setNeedAdvice} />
      <Text weight="bold">{tr('rc.settings.refused')}</Text>
      <Row wrap>{['carrot', 'zucchini', 'broccoli', 'spinach', 'peas', 'egg', 'white_fish', 'ground_beef', 'chicken', 'red_lentils', 'banana', 'pear'].map((k) => (
        <Chip key={k} label={INGREDIENTS[k].name} selected={refused.includes(k)} onPress={() => setRefused(refused.includes(k) ? refused.filter((x) => x !== k) : [...refused, k])} />
      ))}</Row>
      <Text variant="caption" muted>{tr('rc.settings.refusedHint')}</Text>
      <Field label={tr('rc.settings.advice')} optional value={advice} onChangeText={setAdvice} multiline maxLength={2000} />
      <Button label={tr('common.save')} loading={save.isPending} testID="food-settings-save" onPress={async () => {
        try {
          await save.mutateAsync({ exists: !!s.data, child_id: child.id, household_id: child.household_id, texture, vegetarian: veg, no_pork: noPork, refused, pro_advice: advice.trim() || null, allergen_advice_needed: needAdvice });
          toast(tr('nd.saved'), 'success');
        } catch (e) { toast(friendlyError(e), 'error'); }
      }} />
    </Screen>
  );
}
