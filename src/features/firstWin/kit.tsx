/**
 * Petites pièces du parcours « première réussite » : bulle d'Aura (messages PRÉDÉFINIS, aucun appel IA), carte de
 * démonstration signalée « Exemple », ligne de bénéfice.
 */
import React from 'react';
import { Platform, View, type TextStyle } from 'react-native';
import { Icon, Text, type IconName } from '@/components/ui';
import { ExampleBadge } from '@/features/onboarding/kit';
import { AuraAvatar } from '@/features/aura/AuraMark';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

/** Web : pas de césure automatique au milieu des mots (« re-pas ») — même règle que les écrans existants. */
export const NO_HYPHENS = (Platform.OS === 'web' ? { hyphens: 'manual' } : null) as unknown as TextStyle;

/** Message d'Aura : texte écrit à l'avance, lu par VoiceOver comme un message. */
export function AuraBubble({ text, testID = 'fw-aura' }: { text: string; testID?: string }) {
  const th = useTheme();
  return (
    <View testID={testID} accessible accessibilityLabel={`${tr('fw.auraA11y')}. ${text}`} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
      <AuraAvatar size={36} />
      <View style={{ flex: 1, minWidth: 0, gap: 2, borderRadius: radius.lg, borderTopLeftRadius: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: th.colors.surfaceAlt }}>
        <Text variant="caption" weight="bold" color={th.colors.primary}>{tr('fw.aura')}</Text>
        <Text variant="small" style={NO_HYPHENS}>{text}</Text>
      </View>
    </View>
  );
}

/** Surface d'une démo : titre, pastille « Exemple » (données fictives, rien n'est enregistré). */
export function DemoCard({ title, children, testID, compact }: { title: string; children: React.ReactNode; testID?: string; compact?: boolean }) {
  const th = useTheme();
  return (
    <View testID={testID} style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: th.tokens.border.rest, backgroundColor: th.tokens.surface.opaque, padding: spacing.md, gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
        {/* Écran résultat (compact) : le titre de l'écran suffit, la pastille « Exemple » reste */}
        {!compact ? <Text variant="heading" accessibilityRole="header" style={{ flexShrink: 1 }}>{title}</Text> : null}
        <View accessible accessibilityLabel={tr('fw.exampleA11y')}><ExampleBadge label={tr('fw.example')} /></View>
      </View>
      {children}
    </View>
  );
}

export function BenefitLine({ icon = 'check', text, testID }: { icon?: IconName; text: string; testID?: string }) {
  const th = useTheme();
  return (
    <View testID={testID} accessible accessibilityLabel={text} style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}>
      <View style={{ paddingTop: 2 }}><Icon name={icon} size={16} color={th.colors.primary} /></View>
      <Text variant="small" style={[{ flex: 1 }, NO_HYPHENS]}>{text}</Text>
    </View>
  );
}
