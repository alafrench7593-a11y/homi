/**
 * HALO CORAIL (HOMI v5) — la SEULE lumière décorative de l'application. Réservé à l'ACCUEIL, à l'ENTRÉE (accueil
 * sans compte, connexion, inscription) et à l'ONBOARDING, derrière l'illustration principale. Jamais derrière un
 * contenu à lire, jamais sur les écrans de suivi.
 *
 * Dégradé radial LOCALISÉ (jeton `theme.tokens.halo`) : cœur corail, rose chaud, bord lilas, qui s'éteint avant le
 * bord du cadre (aucune arête). Deux foyers légèrement décalés donnent du volume (lumière sculptée, pas un disque).
 *
 * Mouvement : respiration très lente (échelle 1 → 1,04 et opacité 0,9 → 1 en 7 s, aller-retour, Reanimated sur le
 * fil UI) — à peine perceptible, uniquement de la présence. FIGÉ avec « Réduire les animations », en économie
 * d'énergie et la nuit (`useMotion`). Éteint la nuit (`halo.intensity` = 0). Décoratif : masqué aux lecteurs d'écran.
 */
import React, { useEffect, useId } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { useMotion } from '@/motion';

/** Paramètres du halo (testés) : durée d'une respiration, amplitude. */
export const HALO = { breathMs: 7000, scale: 1.04, minOpacity: 0.9 } as const;

export function CoralHalo({ size, style, still, testID = 'coral-halo' }: {
  /** Diamètre du halo (px) ; il déborde volontiers de l'illustration qu'il éclaire */
  size: number;
  style?: StyleProp<ViewStyle>;
  /** Forcer l'image fixe (aperçu, capture) */
  still?: boolean;
  testID?: string;
}) {
  const t = useTheme();
  const m = useMotion();
  const id = `ch${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const k = t.tokens.halo.intensity;
  const breathe = useSharedValue(0);
  const animate = !still && !m.off && !m.minimal && k > 0;

  useEffect(() => {
    if (!animate) { cancelAnimation(breathe); breathe.value = 0; return; }
    breathe.value = withRepeat(withTiming(1, { duration: HALO.breathMs, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(breathe);
  }, [animate, breathe]);

  const anim = useAnimatedStyle(() => ({
    opacity: HALO.minOpacity + (1 - HALO.minOpacity) * breathe.value,
    transform: [{ scale: 1 + (HALO.scale - 1) * breathe.value }],
  }));

  if (k <= 0) return <View pointerEvents="none" style={[{ width: size, height: size }, style]} testID={testID} />;
  const { color, color2, color3 } = t.tokens.halo;
  return (
    <Animated.View pointerEvents="none" style={[{ width: size, height: size }, style, anim]} testID={testID}
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          {/* Corps du halo : corail → rose → bord lilas, éteint avant le bord */}
          <RadialGradient id={`${id}a`} cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={color} stopOpacity={0.95 * k} />
            <Stop offset="0.45" stopColor={color2} stopOpacity={0.55 * k} />
            <Stop offset="0.75" stopColor={color3} stopOpacity={0.22 * k} />
            <Stop offset="1" stopColor={color3} stopOpacity={0} />
          </RadialGradient>
          {/* Foyer chaud décalé vers le haut à gauche : volume sculpté */}
          <RadialGradient id={`${id}b`} cx="0.42" cy="0.4" r="0.32">
            <Stop offset="0" stopColor={color} stopOpacity={0.7 * k} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={50} r={50} fill={`url(#${id}a)`} />
        <Circle cx={50} cy={50} r={50} fill={`url(#${id}b)`} />
      </Svg>
    </Animated.View>
  );
}
