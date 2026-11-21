/**
 * Lumière JAUNE DANS le pictogramme d'un onglet (consigne de la propriétaire, 21/11/2026 ; ticket 2) : la lumière
 * reste à l'intérieur du dessin — le soleil s'éclaire en son cœur, le « + » au croisement de ses branches.
 *
 * Avant : un disque radial 1,9 × plus grand que l'icône, posé DERRIÈRE la tuile → la lueur débordait du logo.
 * Maintenant : une image « symbole allumé » pré-calculée (assets/brand/tabs/<nom>-lit.png, script
 * scripts/brand/tab-light-masks.py : couleur de la lumière × masque du symbole × halo centré sur le cœur du dessin)
 * est posée SUR l'icône, à la même taille ; seule son OPACITÉ varie (repos discret, appui, onglet actif vif), en fondu
 * court. Comme l'image est nulle hors du symbole, la lumière ne peut sortir du dessin à aucun moment, y compris pendant
 * le changement d'onglet. La lentille de verre de l'onglet actif glisse DESSOUS (reflet distinct, GlassTabBar).
 * Réduire les animations : opacité posée sans fondu. Décoratif : ne capte pas le toucher, ignoré des lecteurs d'écran.
 */
import React, { useEffect } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { TAB_LIGHT } from '@/theme/toolLogo';

export type TabLightState = 'idle' | 'pressed' | 'active';

/** Opacité de la lumière intérieure (nuit : atténuée, comme les logos d'outils). */
export function tabLightOpacity(state: TabLightState, night = false): number {
  const base = state === 'active' ? TAB_LIGHT.active : state === 'pressed' ? TAB_LIGHT.pressed : TAB_LIGHT.idle;
  return night ? base * TAB_LIGHT.night : base;
}

export function TabLight({ size, active, pressed = false, lit, children, testID }: {
  size: number; active: boolean; pressed?: boolean;
  /** Symbole allumé de l'icône (`TAB_LIT`) ; sans lui, aucune lumière (jamais de halo hors du dessin). */
  lit?: ImageSourcePropType;
  children: React.ReactNode; testID?: string;
}) {
  const m = useMotion();
  const night = useTheme().name === 'night';
  const target = tabLightOpacity(active ? 'active' : pressed ? 'pressed' : 'idle', night);
  const o = useSharedValue(target);
  useEffect(() => {
    o.value = m.level === 'full' ? m.timing(target, pressed ? 90 : 220) : target;
  }, [target, pressed, m, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <View style={{ width: size, height: size }}>
      {children}
      {lit ? (
        <Animated.View pointerEvents="none" testID={testID} style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, style]}
          accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Image source={lit} accessibilityIgnoresInvertColors style={{ width: size, height: size }} />
        </Animated.View>
      ) : null}
    </View>
  );
}
