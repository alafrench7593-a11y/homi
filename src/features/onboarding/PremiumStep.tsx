/**
 * Temps 8 — Transition Premium, sans pression : ce que Premium AJOUTE réellement pour ces réponses (catalogue réel
 * src/lib/premium/features.ts, choisi par `premiumHighlights`), en regard de ce qui reste toujours gratuit
 * (ALWAYS_FREE). Composition en registre : deux colonnes de texte séparées par un filet, aucune carte.
 * Les deux issues sont visibles (pied d'écran) : « Voir les formules » et « Continuer sans Premium ».
 * Écran sauté si l'utilisateur a déjà Premium.
 */
import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Icon, Text, type IconName } from '@/components/ui';
import { Cascade } from '@/motion';
import { HeroArt, heroSize } from '@/features/entry/HeroArt';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { ALWAYS_FREE, FEATURES, featureTitle, type PremiumFeature } from '@/lib/premium/features';
import { StepTitle } from './kit';

export function PremiumStep({ features, childName }: { features: PremiumFeature[]; childName?: string | null }) {
  const t = useTheme();
  // Données déjà créées, urgences, alertes de rappel : ce qui ne dépend jamais d'un abonnement
  const win = useWindowDimensions();
  const free = [6, 0, 2].map((i) => ALWAYS_FREE[i]).filter(Boolean);
  return (
    <View style={{ gap: spacing.lg }} testID="onb-premium">
      <View style={{ gap: spacing.sm }}>
        <HeroArt name="foyer-maison" size={heroSize(win, { max: 168, min: 96, reserve: 660 })} testID="onb-premium-art" />
        <StepTitle kicker={tr('o2.prem.kicker')} title={tr('o2.prem.title')} lead={tr('o2.prem.lead')} />
      </View>
      <View style={{ gap: spacing.sm }}>
        <Text variant="label" weight="bold" color={t.colors.primary}>{tr('o2.prem.adds')}</Text>
        {features.map((f, i) => (
          <Cascade key={f} index={i}>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', paddingLeft: spacing.sm, borderLeftWidth: 2, borderLeftColor: t.colors.primary }}
              accessible accessibilityLabel={`${featureTitle(f, childName)}. ${FEATURES[f].premium}`} testID={`onb-prem-${f}`}>
              <Icon name={FEATURES[f].icon as IconName} size={18} color={t.colors.primary} />
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text weight="bold">{featureTitle(f, childName)}</Text>
                <Text variant="small" muted>{FEATURES[f].premium}</Text>
              </View>
            </View>
          </Cascade>
        ))}
      </View>
      <View style={{ gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: t.material.lines.separator }}>
        <Text variant="label" weight="bold">{tr('o2.prem.free')}</Text>
        {free.map((x) => (
          <View key={x} style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}>
            <Icon name="check" size={16} color={t.colors.success} />
            <Text variant="small" style={{ flex: 1 }}>{x}</Text>
          </View>
        ))}
      </View>
      <Text variant="caption" muted>{tr('o2.prem.note')}</Text>
    </View>
  );
}
