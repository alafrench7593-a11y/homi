/**
 * Classements des recettes : recommandées, économiques, rapides, équilibrées — pour une tranche d'âge choisie
 * (par défaut celle de l'enfant affiché). Seules les recettes compatibles avec le profil affiché sont classées.
 * Le score est éditorial (méthode affichée sur chaque fiche), jamais présenté comme le Nutri-Score officiel.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { HmHero } from '@/features/homeTrack/kit';
import { router, useLocalSearchParams } from 'expo-router';
import { EmptyState, Skeleton } from '@/components/States';
import { Button, Chip, IconButton, Row, Text } from '@/components/ui';
import { RecipeCard } from '@/features/recipes/RecipeCard';
import { useFoodProfile, useRecipeFavorites, useRecipes } from '@/lib/data/hooks-recipes';
import { filterRecipes } from '@/lib/recipes/engine';
import { AGE_BANDS, BAND_MONTHS, bandFor, scoreRecipe, type AgeBand } from '@/lib/recipes/score';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { ResultsFade } from '@/components/MotionKit';
import { MotionItem, MotionList } from '@/motion/ListMotion';
import { RankTray } from '@/features/finishMeals/RankTray';

type Kind = 'recommended' | 'cheap' | 'quick' | 'balanced';
const KINDS: Kind[] = ['recommended', 'cheap', 'quick', 'balanced'];

export default function Rankings() {
  const { data: all, loading } = useRecipes();
  const { profile } = useFoodProfile();
  const fav = useRecipeFavorites();
  const kidProfile = profile.audience === 'baby' || profile.audience === 'child';
  // Classement et tranche d'âge gardés dans l'adresse (« ?kind=quick&band=… ») : ouvrir une recette puis revenir les retrouve
  const qp = useLocalSearchParams<{ kind?: string; band?: string; recipe?: string }>();
  const band: AgeBand = AGE_BANDS.includes(qp.band as AgeBand) ? (qp.band as AgeBand) : kidProfile && profile.ageMonths != null ? bandFor(profile.ageMonths) : 'y4_6';
  const kind: Kind = KINDS.includes(qp.kind as Kind) ? (qp.kind as Kind) : 'recommended';
  const setBand = (b: AgeBand) => router.setParams({ band: b } as never);
  const setKind = (k: Kind) => router.setParams({ kind: k } as never);
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
      <HmHero testID="hm-rank-hero" value={all ? String(ranked.length) : null} unit={tr('hm.rank.unit', { band: tr(`rc.band.${band}` as TKey), kind: tr(`rc.rank.${kind}` as TKey) })}
        split={[{ label: tr('mb.rc.quick'), value: String(ranked.filter((x) => x.r.prepMin + x.r.cookMin <= 30).length), testID: 'hm-rank-quick' }, { label: tr('mb.rc.favorites'), value: String(ranked.filter((x) => fav.ids.includes(x.r.id)).length), testID: 'hm-rank-fav' }]} />
      <Row wrap>{KINDS.map((k) => <Chip key={k} label={tr(`rc.rank.${k}` as TKey)} selected={kind === k} onPress={() => { setKind(k); setShown(20); }} />)}</Row>
      <Text variant="caption" muted>{tr(`rc.rank.${kind}.hint` as TKey)}</Text>
      <Text variant="small" weight="bold">{tr('rc.rank.band')}</Text>
      <Row wrap>{AGE_BANDS.map((b) => <Chip key={b} tone="lavender" label={tr(`rc.band.${b}` as TKey)} selected={band === b} onPress={() => { setBand(b); setShown(20); }} />)}</Row>
      <Text variant="caption" muted>{tr('rc.score.disclaimer')}</Text>
      {loading && !all ? <Skeleton rows={4} /> : !ranked.length ? <EmptyState icon="award" title={tr('rc.noMatch')} body={tr('rc.noneBody')} /> : (
        <ResultsFade k={`${kind}-${band}`} style={{ gap: spacing.xs }} testID="rankings-list">
          {/* Rang en colonne fixe ; le bouton à droite ouvre la fiche du score (gardée dans l'adresse « ?recipe= ») */}
          <MotionList style={{ gap: spacing.xs }}>{ranked.slice(0, shown).map((x, i) => (
            <MotionItem key={x.r.id}><View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text weight="bold" style={{ minWidth: 28, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{i + 1}</Text>
              <View style={{ flex: 1 }}><RecipeCard r={x.r} favorite={fav.ids.includes(x.r.id)} score={x.s.score} /></View>
              <IconButton icon="sliders" label={tr('fm.rank.open', { title: x.r.title })} testID={`fm-rank-open-${x.r.slug}`} onPress={() => router.setParams({ recipe: x.r.slug } as never)} />
            </View></MotionItem>
          ))}</MotionList>
          {ranked.length > shown ? <Button label={tr('rc.more', { count: ranked.length - shown })} variant="secondary" onPress={() => setShown(shown + 20)} /> : null}
        </ResultsFade>
      )}
      {(() => {
        const i = qp.recipe ? ranked.findIndex((x) => x.r.slug === qp.recipe) : -1;
        if (i < 0) return null;
        const x = ranked[i];
        return <RankTray key={x.r.id} recipe={x.r} score={x.s.score} rank={i + 1} context={`${tr(`rc.rank.${kind}` as TKey)} · ${tr(`rc.band.${band}` as TKey)}`}
          onClose={() => router.setParams({ recipe: undefined } as never)} />;
      })()}
    </Screen>
  );
}
