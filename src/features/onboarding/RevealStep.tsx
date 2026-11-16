/**
 * Temps 7 — Révélation : « Votre foyer est prêt ». Progressive et HONNÊTE : l'illustration `foyer-pret` s'allume au
 * rythme des opérations RÉELLES (accords, foyer, grossesse, enfants, parcours, rappels, réponses) — chaque opération
 * terminée ajoute sa ligne dessous et un peu de lumière ; pleine lumière quand tout est fait. Aucun score, aucune
 * promesse : seulement ce qui vient d'être fait. Réduire les animations : lumière et lignes posées sans mouvement.
 */
import React from 'react';
import { ActivityIndicator, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Banner, Icon, Text } from '@/components/ui';
import { HeroArt, heroSize } from '@/features/entry/HeroArt';
import { useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { StepTitle } from './kit';

export interface RevealLine { key: string; text: string }

export function RevealStep({ lines, total, done, title, error }: { lines: RevealLine[]; total: number; done: boolean; title: string; error: string | null }) {
  const t = useTheme();
  const m = useMotion();
  const win = useWindowDimensions();
  const anim = m.level === 'full';
  const progress = done ? 1 : Math.min(1, lines.length / Math.max(1, total));
  const art = heroSize(win, { max: 260, min: 132, reserve: 560 });
  return (
    <View style={{ gap: spacing.md, alignItems: 'stretch' }} testID="onb-reveal">
      <View accessible accessibilityRole="image" accessibilityLabel={done ? title : `${tr('o2.reveal.working')} ${tr('e5.onb.reveal.progress', { done: lines.length, total })}`}
        accessibilityLiveRegion="polite">
        <HeroArt name="foyer-pret" size={art} dim={progress} testID="onb-reveal-art" />
      </View>
      {done ? (
        <StepTitle title={title} lead={tr('onb.ready.privacy')} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }} accessibilityLiveRegion="polite">
          {!error ? <ActivityIndicator color={t.colors.primary} /> : null}
          <Text weight="bold">{tr('o2.reveal.working')}</Text>
        </View>
      )}
      {error ? <Banner tone="warning">{error}</Banner> : null}
      <View style={{ gap: spacing.xs, alignSelf: 'center', maxWidth: 360 }} accessibilityRole="list" testID="onb-reveal-lines">
        {lines.map((l) => (
          <Animated.View key={l.key} entering={anim ? FadeInDown.duration(260) : undefined} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs }} accessible accessibilityLabel={l.text}>
            <Icon name="check" size={18} color={t.colors.success} />
            <Text style={{ flex: 1 }}>{l.text}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
