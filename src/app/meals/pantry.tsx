/**
 * « Que puis-je cuisiner avec ce que j'ai ? » : je coche mes ingrédients, seules les recettes compatibles avec le profil affiché sont proposées.
 * Depuis le 15/11/2026, les ingrédients cochés vivent dans l'inventaire du foyer (household_stocks, partagé) ; l'ancien
 * garde-manger local de l'appareil y est migré à la première synchronisation (usePantryMigration).
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState } from '@/components/States';
import { Button, Chip, Field, Row, SectionTitle, Text } from '@/components/ui';
import { RecipeCard } from '@/features/recipes/RecipeCard';
import { useFoodProfile, useRecipes } from '@/lib/data/hooks-recipes';
import { AISLE_ORDER, cookWithWhatIHave, STAPLES } from '@/lib/recipes/engine';
import { INGREDIENTS } from '@/lib/recipes/ingredients';
import { fold } from '@/lib/recipes/validate';
import { usePantry } from '@/lib/data/hooks-stocks';
import { router } from 'expo-router';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

export default function Pantry() {
  const { data: all } = useRecipes();
  const { profile } = useFoodProfile();
  const { keys: have, setKeys } = usePantry();
  const setHave = (next: string[]) => void setKeys(next).catch(() => undefined);
  const [q, setQ] = useState('');
  const keys = Object.keys(INGREDIENTS).filter((k) => !STAPLES.includes(k));
  const shown = keys.filter((k) => !q || fold(INGREDIENTS[k].name).includes(fold(q)));
  const results = useMemo(() => (all ? cookWithWhatIHave(all, profile, have) : []), [all, profile, have]);
  const toggle = (k: string) => setHave(have.includes(k) ? have.filter((x) => x !== k) : [...have, k]);
  return (
    <Screen back title={tr('rc.pantry.open')} subtitle={profile.name ? tr('rc.for', { name: profile.name }) : tr('rc.pantry.sub')}>
      <TodaySummary title={tr('rc.pantry.open')} items={[
        { icon: 'package', value: String(have.length), label: tr('mb.rc.have') },
        { icon: 'book-open', value: String(results.length), label: tr('mb.rc.possible') },
        { icon: 'check-circle', value: String(results.filter((x) => !x.missing.length).length), label: tr('mb.rc.complete') },
      ]} />
      <Field label={tr('rc.pantry.search')} value={q} onChangeText={setQ} autoCorrect={false} testID="pantry-search" />
      {have.length ? <Row wrap>{have.map((k) => <Chip key={k} label={INGREDIENTS[k]?.name ?? k} selected onPress={() => toggle(k)} />)}<Button label={tr('rc.pantry.clear')} size="sm" variant="ghost" onPress={() => setHave([])} /></Row> : null}
      {AISLE_ORDER.map((a) => {
        const list = shown.filter((k) => INGREDIENTS[k].aisle === a && !have.includes(k));
        if (!list.length) return null;
        return (
          <View key={a} style={{ gap: 4 }}>
            <Text variant="caption" weight="bold" muted>{tr(`rc.aisle.${a}` as TKey)}</Text>
            <Row wrap>{list.map((k) => <Chip key={k} label={INGREDIENTS[k].name} onPress={() => toggle(k)} accessibilityLabel={`${tr('rc.pantry.have')} ${INGREDIENTS[k].name}`} />)}</Row>
          </View>
        );
      })}
      <Button label={tr('stk.pantry.shared')} icon="package" size="sm" variant="ghost" onPress={() => router.push('/family/stocks' as never)} testID="pantry-open-stocks" />
      <SectionTitle title={tr('rc.pantry.results', { count: results.length })} />
      <Text variant="caption" muted>{tr('rc.pantry.note')}</Text>
      {!have.length ? <Text muted>{tr('rc.pantry.pick')}</Text> : !results.length ? <EmptyState icon="package" title={tr('rc.pantry.none')} /> : (
        <View style={{ gap: spacing.xs }} testID="pantry-results">
          {results.map((x) => (
            <View key={x.r.id} style={{ gap: 2 }}>
              <RecipeCard r={x.r} />
              <Text variant="caption" muted>{x.missing.length ? tr('rc.pantry.missing', { list: x.missing.map((k) => INGREDIENTS[k].name).join(', ') }) : tr('rc.pantry.complete')}</Text>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
