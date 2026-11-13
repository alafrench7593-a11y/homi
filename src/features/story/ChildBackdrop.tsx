/**
 * Fond des pages du bébé et de l'enfant (HOMI, 13/11/2026) : un décor vectoriel discret posé sur le ciel de
 * l'application — halo lilas en haut, lumière champagne en bas, comme une veilleuse dans la maison.
 * Remplace les vidéos d'« Au fil de nous » (galets, ciel rose et pêche, histoire en 3D) : plus de photo pêche
 * derrière le Suivi, moins de batterie, rien à charger. Le soir, le ciel Minuit de la coque suffit.
 * Décoratif, immobile, ignoré par les lecteurs d'écran.
 */
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { HOMI } from '@/features/homiColors';

/** Adresses des pages qui parlent d'un bébé ou d'un enfant. */
const CHILD_PATH = /^\/(child|bottle|sleep|teeth|night|track|discoveries)(\/|$)/;
export function isChildPage(pathname: string, toolId?: string | null): boolean {
  return CHILD_PATH.test(pathname) || (!!toolId && /^(kid_|baby_|pp_feeding|pp_bottle)/.test(toolId));
}

export function ChildBackdrop() {
  const t = useTheme();
  const { width: W, height: H } = useWindowDimensions();
  const id = React.useId().replace(/:/g, '');
  if (t.isDark) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="child-backdrop" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={W} height={H}>
        <Defs>
          <RadialGradient id={`a${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={HOMI.lilac} stopOpacity="0.55" />
            <Stop offset="1" stopColor={HOMI.lilac} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`b${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={HOMI.champagne} stopOpacity="0.38" />
            <Stop offset="1" stopColor={HOMI.champagne} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx={W * 0.82} cy={H * 0.08} rx={W * 0.75} ry={H * 0.22} fill={`url(#a${id})`} />
        <Ellipse cx={W * 0.12} cy={H * 0.94} rx={W * 0.8} ry={H * 0.2} fill={`url(#b${id})`} />
      </Svg>
    </View>
  );
}
