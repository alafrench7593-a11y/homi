/**
 * SOULIGNEMENT QUI GLISSE — onglets de texte (fil de la communauté, profil) : le trait de l'onglet actif glisse vers
 * le nouvel onglet (ressort « panneau », interruptible) au lieu de sauter. Mesure de chaque onglet une fois
 * (onLayout) ; 'off' : pose immédiate ; 'minimal' (nuit) : fondu court.
 *
 *   const u = useSlidingUnderline(value);
 *   <Row>{opts.map((o) => <Tab onLayout={u.onItemLayout(o.value)} … />)}<SlidingUnderline style={u.style} color={c} /></Row>
 */
import React from 'react';
import Animated from 'react-native-reanimated';
import { useIndicator, useItemLayouts } from '@/motion/Indicator';

export function useSlidingUnderline<K extends string>(active: K) {
  const { layouts, onItemLayout } = useItemLayouts<K>();
  const style = useIndicator(layouts[active]);
  return { onItemLayout, style };
}

export function SlidingUnderline({ style, color, bottom = 0, testID }: { style: ReturnType<typeof useIndicator>; color: string; bottom?: number; testID?: string }) {
  return <Animated.View pointerEvents="none" testID={testID} style={[{ position: 'absolute', left: 0, bottom, height: 3, borderRadius: 1.5, backgroundColor: color }, style]} />;
}
