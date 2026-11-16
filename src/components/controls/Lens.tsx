/**
 * LENTILLE HOMI v4 — la sélection est une lentille de verre CLAIR qui GLISSE sous l'option active.
 *
 * Matière (`theme.material.lens`, contraste testé) : remplissage plus clair que le rail qu'elle survole (elle
 * « grossit » l'option sans la colorer), reflet de réfraction en haut, ombre interne d'épaisseur en bas, CAUSTIQUE
 * de la palette au pied (la lumière concentrée par le verre), ombre portée douce. C'est la même matière que le « O » du
 * futur logo (une lentille de verre) : la sélection, partout dans l'app, se lit comme « regarder à travers HOMI ».
 *
 * Utilisée par : `ChoiceGroup` (pills, donc `Segmented`) et la barre d'onglets (`Dock`). Une seule lentille par
 * groupe ; jamais une couleur seule : l'option active reste aussi confirmée par le gras (et une coche si la place
 * le permet).
 *
 * Mouvement (`useLensSlide`) : première pose sans trajet ; ensuite position ET largeur en ressort « panneau »
 * (interruptible : un nouvel appui repart de la position courante). Réduire les animations / économie d'énergie :
 * pose immédiate ; nuit : fondu court, sans rebond, sans reflet ni caustique.
 *
 *   const lens = useLensSlide(x, width);
 *   <Lens slide={lens} top={4} height={44} testID="choice-indicator" />
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { useMotion } from '@/motion/useMotion';

/** Constantes de la lentille (testées). */
export const LENS = {
  /** famille de ressort du glissement */
  spring: 'panneau',
  /** retrait de la lentille dans son rail (px) */
  inset: 4,
  /** hauteur relative du reflet de réfraction */
  rimDepth: 0.55,
} as const;

export interface LensSlide { x: SharedValue<number>; w: SharedValue<number> }

/** Position et largeur de la lentille, animées (première pose immédiate, ensuite ressort interruptible). */
export function useLensSlide(x: number, width: number): LensSlide {
  const m = useMotion();
  const sx = useSharedValue(x);
  const sw = useSharedValue(width);
  const placed = useRef(false);
  useEffect(() => {
    if (!(width > 0)) return;
    if (!placed.current) { sx.value = x; sw.value = width; placed.current = true; return; }
    sx.value = m.spring(x, LENS.spring);
    sw.value = m.spring(width, LENS.spring);
  }, [x, width]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { cancelAnimation(sx); cancelAnimation(sw); }, [sx, sw]);
  return { x: sx, w: sw };
}

export function Lens({ slide, top, height, radius = 999, hue, testID }: {
  slide: LensSlide;
  top: number;
  height: number;
  radius?: number;
  /** Teinte de la caustique (accent secondaire de l'espace) ; défaut : lueur de la palette */
  hue?: string;
  testID?: string;
}) {
  const t = useTheme();
  const L = t.material.lens;
  const night = t.name === 'night';
  const style = useAnimatedStyle(() => ({ width: slide.w.value, transform: [{ translateX: slide.x.value }] }));
  void hue;
  return (
    <Animated.View pointerEvents="none" testID={testID}
      style={[{ position: 'absolute', left: 0, top, height, borderRadius: radius, overflow: 'hidden', backgroundColor: L.fill, borderWidth: 1, borderColor: L.edge,
        // v5 : indicateur de sélection = surface claire opaque + liseré + ombre de contact très légère (aucun reflet)
        boxShadow: night ? undefined : [{ offsetX: 0, offsetY: 1, blurRadius: 3, color: L.shadow }] }, style]} />
  );
}

const styles = StyleSheet.create({
  caustic: { position: 'absolute', left: '18%', right: '18%', bottom: 1, height: 2, borderRadius: 1 },
  rim: { position: 'absolute', top: 0, left: '22%', right: '22%', height: 1 },
});
