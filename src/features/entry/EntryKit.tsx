/**
 * Entrée dans l'app (HOMI, « Keynote ») : pièces partagées par l'accueil sans compte, la connexion, l'inscription,
 * le mot de passe oublié, la confirmation et l'onboarding.
 *
 * Règles (HOMI_SCREEN_INVENTORY.md › Entrée) :
 *  - un seul point focal par écran (`EntryHero`) : l'illustration 3D `famille` (HeroArt.tsx) ou, pour un écran
 *    d'état, un disque prune à icône, sur le HALO CORAIL ; le logo maison reste petit, en tête ;
 *  - la scène se révèle EN PROFONDEUR (échelle 1,12 → 1 + fondu, Reanimated, `useMotion`) mais le texte et l'action
 *    principale sont rendus tout de suite, sans animation d'entrée : rien n'attend la scène ;
 *  - champs posés sur une surface MATE (`MattePanel`, opaque, sans flou ni reflet) : lisibles sur toutes les palettes ;
 *  - une seule action principale, en pied d'écran (`EntryScreen.footer`) : elle reste au-dessus du clavier ouvert.
 * Couleurs : uniquement le thème (`useTheme`) ; aucune valeur en dur, la refonte des jetons s'applique d'elle-même.
 */
import React, { useEffect } from 'react';
import { useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { CoralHalo } from '@/components/CoralHalo';
import { Icon, type IconName, Text } from '@/components/ui';
import { BrandLogo, BrandWordmark } from '@/components/BrandLogo';
import { durations } from '@/motion/curves';
import { useMotion } from '@/motion/useMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { HeroArt, type IllustrationName } from './HeroArt';

/** Durée de la révélation en profondeur (≈ 730 ms) : longue et douce, mais jamais bloquante. */
export const DEPTH_REVEAL_MS = Math.round(durations.entrance * 1.4);
/** Échelle de départ de la scène (elle « recule » jusqu'à sa place). */
export const DEPTH_FROM_SCALE = 1.12;

/** Écran court (320×568, clavier ouvert sur petit téléphone) : point focal resserré. */
export function useCompactEntry() {
  return useWindowDimensions().height < 640;
}

/**
 * Révélation en profondeur d'un calque DÉCORATIF (jamais du texte ni d'une action).
 * 'off' (Réduire les animations, économie d'énergie) : visible d'emblée ; 'minimal' (nuit) : fondu court sans échelle.
 */
export function DepthReveal({ children, style, delay = 0 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; delay?: number }) {
  const m = useMotion();
  const p = useSharedValue(m.off ? 1 : 0);
  const scaled = m.level === 'full';
  useEffect(() => {
    p.value = m.delay(delay, m.timing(1, DEPTH_REVEAL_MS, 'decelerate'));
    return () => cancelAnimation(p);
    // une seule révélation par montage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (m.off) { cancelAnimation(p); p.value = 1; }
  }, [m.off, p]);
  const anim = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ scale: scaled ? DEPTH_FROM_SCALE - (DEPTH_FROM_SCALE - 1) * p.value : 1 }],
  }));
  return (
    <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[style, anim]}>
      {children}
    </Animated.View>
  );
}

/** Halo corail (v5) derrière le point focal : le seul décor lumineux de l'entrée (`CoralHalo`, figé si Réduire les animations). */
export function FocalGlow({ size }: { size: number }) {
  return <CoralHalo size={size} testID="entry-halo" />;
}

/**
 * Point focal : halo de la palette + disque en dégradé portant une icône (ou la maison HOMI).
 * Décor uniquement (masqué aux lecteurs d'écran) ; se révèle en profondeur.
 */
export function FocalMark({ icon, logo, size }: { icon?: IconName; logo?: boolean; size: number }) {
  const t = useTheme();
  const disc = Math.round(size * 0.38);
  return (
    <DepthReveal style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute' }}><FocalGlow size={size} /></View>
      {logo ? (
        <BrandLogo size={Math.round(size * 0.56)} />
      ) : (
        <View style={{ width: disc, height: disc, borderRadius: disc / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tokens.action.fill }}>
          {icon ? <Icon name={icon} size={Math.round(disc * 0.44)} color={t.tokens.action.text} /> : null}
        </View>
      )}
    </DepthReveal>
  );
}

/**
 * En-tête d'entrée (v5) : le logo maison PETIT en tête (`wordmark`), puis le point focal — l'illustration 3D `famille`
 * sur le halo corail (`logo` ou `art`) ou, pour les écrans d'état (e-mail envoyé, lien expiré), un disque prune
 * portant une icône — un titre aéré, une phrase. Titre et phrase sont là dès la première image.
 */
export function EntryHero({ icon, logo, art, wordmark, title, lead, kicker, testID }: { icon?: IconName; logo?: boolean; art?: IllustrationName; wordmark?: boolean; title: string; lead?: string; kicker?: string; testID?: string }) {
  const t = useTheme();
  const compact = useCompactEntry();
  const illustration = art ?? (logo ? 'famille' : null);
  return (
    <View testID={testID} style={{ alignItems: 'center', gap: compact ? spacing.xs : spacing.sm }}>
      {wordmark ? <BrandWordmark height={compact ? 16 : 20} header={false} testID="entry-wordmark" /> : null}
      {illustration
        ? <HeroArt name={illustration} size={compact ? 112 : 184} testID="entry-art" />
        : <FocalMark icon={icon} size={compact ? 104 : 148} />}
      {kicker ? <Text variant="label" color={t.colors.primary} center>{kicker}</Text> : null}
      <Text variant="title" center accessibilityRole="header" style={{ maxWidth: 360 }}>{title}</Text>
      {lead ? <Text center muted style={{ maxWidth: 320 }}>{lead}</Text> : null}
    </View>
  );
}

/**
 * Surface MATE pour les champs : remplissage opaque du thème, liseré fin, aucun flou ni reflet.
 * Le texte saisi garde son contraste quel que soit le décor derrière.
 */
export function MattePanel({ children, style, testID }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const t = useTheme();
  return (
    <View testID={testID} style={[{ backgroundColor: t.tokens.surface.opaque, borderColor: t.tokens.border.rest, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md }, style]}>
      {children}
    </View>
  );
}

/**
 * Écran d'entrée : bouton rond « Retour » en haut, contenu qui défile (le champ actif reste visible, voir
 * components/keyboard.tsx), action principale en pied d'écran, toujours au-dessus du clavier.
 */
export function EntryScreen({ children, footer, back = true }: { children: React.ReactNode; footer?: React.ReactNode; back?: boolean }) {
  return (
    <Screen back={back} footer={footer} tool={false}>
      {children}
    </Screen>
  );
}
