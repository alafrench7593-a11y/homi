/**
 * Illustration 3D de tête (HOMI v5 « Lumière corail ») : une illustration originale (assets/illustrations, fond
 * transparent, 768 px) posée sur le HALO CORAIL (`CoralHalo`), réservée à l'entrée, à l'onboarding et à Premium.
 *
 *  - Taille FIXE (carré `size`) : rien ne saute pendant le chargement de l'image ;
 *  - le bas de l'illustration (personnages coupés à la taille) se fond dans le fond de l'écran : un dégradé vertical
 *    de la couleur du fond, sans arête ;
 *  - le halo déborde de l'image (×1,25, vers le haut et les côtés ; son bas s'éteint avec celui des personnages) mais
 *    jamais de la largeur de la fenêtre (aucun défilement horizontal) ;
 *  - changement d'illustration (situation choisie) : fondu enchaîné court (expo-image), aucun si Réduire les
 *    animations ;
 *  - `reveal` : arrivée douce une fois au montage (fondu + 8 px + échelle 0,96 → 1, Reanimated, fil UI), état final
 *    immédiat avec Réduire les animations / économie d'énergie ;
 *  - décorative : masquée aux lecteurs d'écran, `alt` vide, `accessibilityIgnoresInvertColors`.
 */
import React, { useEffect } from 'react';
import { useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { CoralHalo } from '@/components/CoralHalo';
import { useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';

/* eslint-disable @typescript-eslint/no-require-imports */
export const ILLUSTRATIONS = {
  famille: require('../../../assets/illustrations/famille.webp'),
  'projet-bebe': require('../../../assets/illustrations/projet-bebe.webp'),
  grossesse: require('../../../assets/illustrations/grossesse.webp'),
  bebe: require('../../../assets/illustrations/bebe.webp'),
  enfants: require('../../../assets/illustrations/enfants.webp'),
  cycle: require('../../../assets/illustrations/cycle.webp'),
  'foyer-maison': require('../../../assets/illustrations/foyer-maison.webp'),
  'foyer-pret': require('../../../assets/illustrations/foyer-pret.webp'),
} as const;
/* eslint-enable @typescript-eslint/no-require-imports */
export type IllustrationName = keyof typeof ILLUSTRATIONS;

/** Rapport halo / illustration : la lumière déborde autour des personnages. */
export const HERO_HALO_RATIO = 1.25;
/** Arrivée (ms) : courte, jamais bloquante (le texte et l'action sont déjà là). */
export const HERO_REVEAL_MS = 520;
/** Fondu enchaîné entre deux illustrations (ms). */
export const HERO_SWAP_MS = 260;

export function HeroArt({ name, size, reveal = true, dim, testID = 'hero-art', style }: {
  name: IllustrationName;
  /** Côté du carré de l'illustration (px) */
  size: number;
  /** Arrivée douce au montage (défaut : oui) */
  reveal?: boolean;
  /** 0..1 : l'illustration s'allume progressivement (révélation de l'onboarding) ; absent = pleine lumière */
  dim?: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const m = useMotion();
  const win = useWindowDimensions();
  const p = useSharedValue(!reveal || m.off ? 1 : 0);
  const glow = useSharedValue(dim ?? 1);
  useEffect(() => {
    if (!reveal) return undefined;
    p.value = m.timing(1, HERO_REVEAL_MS, 'decelerate');
    return () => cancelAnimation(p);
    // une arrivée par montage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (m.off) { cancelAnimation(p); p.value = 1; }
  }, [m.off, p]);
  useEffect(() => {
    glow.value = m.timing(dim ?? 1, 420, 'decelerate');
  }, [dim]); // eslint-disable-line react-hooks/exhaustive-deps
  const moves = m.level === 'full';
  const art = useAnimatedStyle(() => ({
    opacity: p.value * (0.45 + 0.55 * glow.value),
    transform: [{ translateY: moves ? (1 - p.value) * 8 : 0 }, { scale: (moves ? 0.96 + 0.04 * p.value : 1) * (0.97 + 0.03 * glow.value) }],
  }));
  const haloIn = useAnimatedStyle(() => ({ opacity: p.value * (0.35 + 0.65 * glow.value) }));
  // Le halo déborde, mais reste dans la fenêtre (aucun défilement horizontal, même à 320 px)
  const halo = Math.round(Math.min(size * HERO_HALO_RATIO, win.width));
  const fadeId = `hf${size}`;
  const bg = t.colors.background;
  return (
    <View testID={testID} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }, style]}>
      {/* Bas du halo aligné sur le bas de l'illustration : la lumière s'éteint là où les personnages se fondent dans le
          fond (aucune bande visible sous l'image) ; elle déborde en haut et sur les côtés. */}
      <Animated.View style={[{ position: 'absolute', top: size - halo, left: Math.round((size - halo) / 2) }, haloIn]}>
        <CoralHalo size={halo} testID={`${testID}-halo`} />
      </Animated.View>
      <Animated.View style={[{ width: size, height: size }, art]}>
        <Image source={ILLUSTRATIONS[name]} style={{ width: size, height: size }} contentFit="contain" alt="" accessible={false}
          accessibilityIgnoresInvertColors transition={m.off ? 0 : { duration: HERO_SWAP_MS, effect: 'cross-dissolve' }} cachePolicy="memory-disk" testID={`${testID}-image`} />
        {/* Bas des personnages : fondu dans le fond de l'écran (aucune coupe nette) */}
        <Svg width={size} height={Math.round(size * 0.22)} style={{ position: 'absolute', left: 0, bottom: 0 }}>
          <Defs>
            <LinearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={bg} stopOpacity={0} />
              <Stop offset="1" stopColor={bg} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={size} height={Math.round(size * 0.22)} fill={`url(#${fadeId})`} />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Taille de l'illustration de tête selon la hauteur disponible (bornée, jamais plus large que l'écran − 32 px). */
export function heroSize(win: { width: number; height: number }, { max, min, reserve }: { max: number; min: number; reserve: number }): number {
  return Math.round(Math.max(min, Math.min(max, win.height - reserve, win.width - 32)));
}
