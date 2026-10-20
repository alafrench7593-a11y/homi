/**
 * Classements des recettes : recommandées, économiques, rapides, équilibrées — pour une tranche d'âge choisie
 * (par défaut celle de l'enfant affiché). Seules les recettes compatibles avec le profil affiché sont classées.
 * Le score est éditorial (méthode affichée sur chaque fiche), jamais présenté comme le Nutri-Score officiel.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { Button, Chip, Row, Text } from '@/components/ui';
import { RecipeCard } from '@/features/recipes/RecipeCard';
import { useFoodProfile, useRecipeFavorites, useRecipes } from '@/lib/data/hooks-recipes';
import { filterRecipes } from '@/lib/recipes/engine';
import { AGE_BANDS, BAND_MONTHS, bandFor, scoreRecipe, type AgeBand } from '@/lib/recipes/score';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

type Kind = 'recommended' | 'cheap' | 'quick' | 'balanced';
const KINDS: Kind[] = ['recommended', 'cheap', 'quick', 'balanced'];

export default function Rankings() {
  const { data: all, loading } = useRecipes();
  const { profile } = useFoodProfile();
  const fav = useRecipeFavorites();
  const kidProfile = profile.audience === 'baby' || profile.audience === 'child';
  const [band, setBand] = useState<AgeBand>(kidProfile && profile.ageMonths != null ? bandFor(profile.ageMonths) : 'y4_6');
  const [kind, setKind] = useState<Kind>('recommended');
  const [shown, setShown] = useState(20);

  const ranked = useMemo(() => {
    if (!all) return [];
    const [from, to] = BAND_MONTHS[band];
    // Recettes compatibles avec le profil affiché ET pensées pour cette tranche d'âge
    const pool = filterRecipes(all, profile).filter((r) => {
      if (!r.audiences.includes('child') && !r.audiences.includes('baby') && !r.audiences.includes('family')) return false;
      const min = r.minMonths ?? (r.audiences.includes('baby') ? 6 : 24);
      const max = r.maxMonths ?? 120;
      return min < to && max >= from;
    });
    const scored = pool.map((r) => ({ r, s: scoreRecipe(r, band) }));
    const by = (a: { s: { score: number } }, b: { s: { score: number } }) => b.s.score - a.s.score;
    switch (kind) {
      case 'recommended': return scored.sort(by);
      case 'cheap': return scored.sort((a, b) => a.r.budget - b.r.budget || by(a, b));
      case 'quick': return scored.filter((x) => x.r.prepMin + x.r.cookMin <= 30).sort(by);
      case 'balanced': return scored.filter((x) => (x.s.parts.find((p) => p.key === 'fvl')?.value ?? 0) >= 30 && (x.s.parts.find((p) => p.key === 'protein')?.points ?? 0) >= 6).sort(by);
    }
  }, [all, profile, band, kind]);

  return (
    <Screen back title={tr('rc.rank.open')} subtitle={profile.name ? tr('rc.for', { name: profile.name }) : undefined}>
      <Row wrap>{KINDS.map((k) => <Chip key={k} label={tr(`rc.rank.${k}` as TKey)} selected={kind === k} onPress={() => { setKind(k); setShown(20); }} />)}</Row>
      <Text variant="caption" muted>{tr(`rc.rank.${kind}.hint` as TKey)}</Text>
      <Text variant="small" weight="bold">{tr('rc.rank.band')}</Text>
      <Row wrap>{AGE_BANDS.map((b) => <Chip key={b} tone="lavender" label={tr(`rc.band.${b}` as TKey)} selected={band === b} onPress={() => { setBand(b); setShown(20); }} />)}</Row>
      <Text variant="caption" muted>{tr('rc.score.disclaimer')}</Text>
      {loading && !all ? <Skeleton rows={4} /> : !ranked.length ? <EmptyState icon="award" title={tr('rc.none')} body={tr('rc.noneBody')} /> : (
        <View style={{ gap: spacing.xs }} testID="rankings-list">
          {ranked.slice(0, shown).map((x, i) => (
            <View key={x.r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text weight="bold" style={{ width: 28, textAlign: 'right' }}>{i + 1}</Text>
              <View style={{ flex: 1 }}><RecipeCard r={x.r} favorite={fav.ids.includes(x.r.id)} score={x.s.score} /></View>
            </View>
          ))}
          {ranked.length > shown ? <Button label={tr('rc.more', { count: ranked.length - shown })} variant="secondary" onPress={() => setShown(shown + 20)} /> : null}
        </View>
      )}
    </Screen>
  );
}
