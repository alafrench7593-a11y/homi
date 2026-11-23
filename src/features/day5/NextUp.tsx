/**
 * Accueil v5 — « Prochain événement » : ce qui arrive ensuite ressort immédiatement. Une carte (information isolée),
 * une petite illustration 3D de la situation posée sur un halo corail LOCAL et discret (même identité que
 * l'onboarding), l'heure en chiffres tabulaires, le titre, le lieu ou la personne. Toucher ouvre le détail.
 * Halo FIXE (`still`) : écran de suivi, aucune animation ambiante pendant la lecture.
 */
import { glassEdge } from '@/components/glass/GlassRim';
import React from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import { CoralHalo } from '@/components/CoralHalo';
import { Icon, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export type NextArt = 'foyer' | 'bebe' | 'grossesse' | 'enfants' | 'cycle' | 'famille';
const ART: Record<NextArt, ImageSourcePropType> = {
  foyer: require('../../../assets/illustrations/foyer-maison.webp'),
  bebe: require('../../../assets/illustrations/bebe.webp'),
  grossesse: require('../../../assets/illustrations/grossesse.webp'),
  enfants: require('../../../assets/illustrations/enfants.webp'),
  cycle: require('../../../assets/illustrations/cycle.webp'),
  famille: require('../../../assets/illustrations/famille.webp'),
};

export interface NextUpInfo {
  /** « Prochain rendez-vous », « Prochain événement », « Relais de nuit »… */
  kicker: string;
  time: string;
  /** Heure de fin, ou « dans 45 min » */
  timeSub?: string | null;
  title: string;
  sub?: string | null;
  onPress?: () => void;
}

const ART_SIZE = 92;

export function NextUp({ info, art = 'foyer', testID = 'home-next-up', emptyTitle, emptyBody, compactEmpty = false }: { info: NextUpInfo | null; art?: NextArt; testID?: string; emptyTitle?: string; emptyBody?: string; /** accueil (référence 01) : sans rendez-vous, une rangée sobre (pictogramme + titre) au lieu de l'illustration */ compactEmpty?: boolean }) {
  const t = useTheme();
  const illus = (
    <View style={{ width: ART_SIZE, height: ART_SIZE, alignItems: 'center', justifyContent: 'center' }} testID={`${testID}-art`}
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <CoralHalo size={ART_SIZE * 1.45} still style={{ position: 'absolute' }} testID={`${testID}-halo`} />
      <Image source={ART[art]} style={{ width: ART_SIZE, height: ART_SIZE }} resizeMode="contain" accessibilityIgnoresInvertColors />
    </View>
  );
  const shell = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.md, padding: spacing.md, paddingLeft: spacing.sm, borderRadius: radius.lg,
    ...glassEdge(t), backgroundColor: t.colors.surface, overflow: 'hidden' as const };
  if (!info && compactEmpty) {
    return (
      <View style={[shell, { minHeight: 56, paddingVertical: spacing.sm, paddingLeft: spacing.md }]} testID={testID} accessible accessibilityLabel={[emptyTitle ?? tr('d5.next.noneTitle'), emptyBody ?? tr('d5.next.noneBody')].join('. ')}>
        <View style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: t.material.lines.iconWell, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="calendar" size={18} color={t.colors.text} />
        </View>
        <Text weight="bold" style={{ flex: 1, minWidth: 0 }}>{emptyTitle ?? tr('d5.next.noneTitle')}</Text>
      </View>
    );
  }
  if (!info) {
    return (
      <View style={shell} testID={testID} accessible accessibilityLabel={[emptyTitle ?? tr('d5.next.noneTitle'), emptyBody ?? tr('d5.next.noneBody')].join('. ')}>
        {illus}
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text weight="bold">{emptyTitle ?? tr('d5.next.noneTitle')}</Text>
          <Text variant="small" muted>{emptyBody ?? tr('d5.next.noneBody')}</Text>
        </View>
      </View>
    );
  }
  const a11y = [info.kicker, info.time, info.timeSub, info.title, info.sub].filter(Boolean).join('. ');
  const body = (
    <>
      {illus}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="caption" weight="bold" color={t.colors.primary} numberOfLines={1}>{info.kicker}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: spacing.xs }}>
          <Text style={{ fontSize: 26, lineHeight: 32, fontVariant: ['tabular-nums'] }} weight="bold">{info.time}</Text>
          {info.timeSub ? <Text variant="small" muted style={{ fontVariant: ['tabular-nums'] }}>{info.timeSub}</Text> : null}
        </View>
        <Text weight="bold" numberOfLines={2}>{info.title}</Text>
        {info.sub ? <Text variant="small" muted numberOfLines={1}>{info.sub}</Text> : null}
      </View>
    </>
  );
  return info.onPress ? (
    <Tappable accessibilityRole="button" accessibilityLabel={a11y} accessibilityHint={tr('d5.next.hint')} onPress={info.onPress} testID={testID} pressScale={0.99} style={shell}>{body}</Tappable>
  ) : <View style={shell} testID={testID} accessible accessibilityLabel={a11y}>{body}</View>;
}
