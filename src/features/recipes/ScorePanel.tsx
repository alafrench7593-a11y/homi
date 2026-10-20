/**
 * Score nutritionnel éditorial d'une recette (sur 100), détail du calcul, atouts, pistes d'amélioration,
 * valeurs par portion et sources. Mention claire : ni Nutri-Score officiel, ni avis médical.
 */
import React, { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Card, Chip, Row, Text } from '@/components/ui';
import { AGE_BANDS, scoreRecipe, SCORE_SOURCES, type AgeBand } from '@/lib/recipes/score';
import type { Recipe } from '@/lib/recipes/types';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const fmt = (v: number, d = 1) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('fr-FR');

export function ScorePanel({ recipe, band: initial }: { recipe: Recipe; band: AgeBand }) {
  const t = useTheme();
  const [band, setBand] = useState<AgeBand>(initial);
  const [open, setOpen] = useState(false);
  const s = scoreRecipe(recipe, band);
  const p = s.portion;
  return (
    <View testID="recipe-score" style={{ gap: spacing.xs }}>
      <Card>
        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" weight="bold" muted>{tr('rc.score.title')}</Text>
            <Text variant="caption" muted>{tr('rc.score.for', { band: tr(`rc.band.${band}` as TKey) })}</Text>
          </View>
          <View style={{ minWidth: 72, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: t.colors.surfaceAlt, alignItems: 'center' }}>
            <Text variant="heading" testID="recipe-score-value">{s.score}</Text>
            <Text variant="caption" muted>/100</Text>
          </View>
        </Row>
        <Row wrap style={{ marginTop: spacing.xs }}>
          {AGE_BANDS.map((b) => <Chip key={b} label={tr(`rc.band.${b}` as TKey)} selected={band === b} onPress={() => setBand(b)} />)}
        </Row>
        {s.strengths.length ? <View style={{ marginTop: spacing.xs }}><Text weight="bold">{tr('rc.score.strengths')}</Text>{s.strengths.map((k) => <Text key={k} variant="small">• {tr(`rc.score.plus.${k}` as TKey)}</Text>)}</View> : null}
        {s.improvements.length ? <View style={{ marginTop: spacing.xs }}><Text weight="bold">{tr('rc.score.improve')}</Text>{s.improvements.map((k) => <Text key={k} variant="small">• {tr(`rc.score.tip.${k}` as TKey)}</Text>)}</View> : null}
        <Text variant="small" style={{ marginTop: spacing.xs }}>{tr('rc.score.portion', { kcal: Math.round(p.kcal), prot: fmt(p.prot), fiber: fmt(p.fiber), sugar: fmt(p.addedSugar), salt: fmt(p.salt, 2), iron: fmt(p.iron), calcium: Math.round(p.calcium) })}</Text>
        <Pressable accessibilityRole="button" onPress={() => setOpen(!open)} style={{ minHeight: 40, justifyContent: 'center' }} testID="score-details">
          <Text variant="small" weight="bold" color={t.colors.primary}>{open ? tr('rc.score.hide') : tr('rc.score.how')}</Text>
        </Pressable>
        {open ? (
          <View style={{ gap: 2 }}>
            {s.parts.map((x) => (
              <Row key={x.key} style={{ justifyContent: 'space-between' }}>
                <Text variant="small" style={{ flex: 1 }}>{tr(`rc.score.part.${x.key}` as TKey, { v: x.value, u: x.unit })}</Text>
                <Text variant="small" weight="bold">{x.points > 0 && x.key !== 'base' ? '+' : ''}{x.points}</Text>
              </Row>
            ))}
            <Text variant="caption" muted style={{ marginTop: 4 }}>{tr('rc.score.method')}</Text>
            {s.approximations.map((a) => <Text key={a} variant="caption" muted>• {a}</Text>)}
            {SCORE_SOURCES.map((x) => (
              <Pressable key={x.url} accessibilityRole="link" onPress={() => void Linking.openURL(x.url)} style={{ minHeight: 32, justifyContent: 'center' }}>
                <Text variant="caption" color={t.colors.primary}>{x.label} ({formatDate(`${x.date}T12:00:00`)})</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Text variant="caption" muted style={{ marginTop: 4 }}>{tr('rc.score.disclaimer')}</Text>
      </Card>
    </View>
  );
}
