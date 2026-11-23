/**
 * DÉPLACEMENT D'INDICATEUR — l'élément de sélection (pastille d'onglet, segment, anneau d'avatar) GLISSE vers le
 * choix actif au lieu de sauter : l'œil suit le changement.
 *
 *  - `useItemLayouts()` mesure chaque option UNE fois (onLayout), jamais par image ;
 *  - `useIndicator(layout)` anime la position (transform) et la largeur en ressort « panneau » (≈ 300 ms, interruptible :
 *    un nouvel appui repart de la position courante). La largeur animée est permise ici : l'indicateur est en
 *    position absolue et SANS enfant (rien d'autre ne se remet en page), et ses coins restent ronds ;
 *  - première pose : sans trajet ; 'off' : pose immédiate ; 'minimal' (nuit) : fondu court sans ressort.
 *
 *   const { layouts, onItemLayout } = useItemLayouts<string>();
 *   const style = useIndicator(layouts[active]);
 *   <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 4, bottom: 4 }, style]} />
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { liquidIndicator } from './curves';
import { useMotion } from './useMotion';

export interface ItemLayout { x: number; width: number }

/** Mesure des options d'un groupe (clé → position et largeur dans la rangée). */
export function useItemLayouts<K extends string>() {
  const [layouts, setLayouts] = useState<Partial<Record<K, ItemLayout>>>({});
  const onItemLayout = useCallback((key: K) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setLayouts((cur) => {
      const old = cur[key];
      return old && Math.abs(old.x - x) < 0.5 && Math.abs(old.width - width) < 0.5 ? cur : { ...cur, [key]: { x, width } };
    });
  }, []);
  return { layouts, onItemLayout };
}

/** Style animé de l'indicateur (translateX + width ; opacité 0 tant que rien n'est mesuré). */
export function useIndicator(layout: ItemLayout | undefined) {
  const m = useMotion();
  const x = useSharedValue(layout?.x ?? 0);
  const w = useSharedValue(layout?.width ?? 0);
  const shown = useSharedValue(layout && layout.width > 0 ? 1 : 0);
  const placed = useRef(!!layout && layout.width > 0);
  const lx = layout?.x;
  const lw = layout?.width;
  useEffect(() => {
    if (lx === undefined || lw === undefined || !(lw > 0)) return;
    if (!placed.current) {
      placed.current = true;
      x.value = lx;
      w.value = lw;
      shown.value = 1;
      return;
    }
    x.value = m.spring(lx, 'panneau');
    w.value = m.spring(lw, 'panneau');
  }, [lx, lw]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { cancelAnimation(x); cancelAnimation(w); }, [x, w]);
  return useAnimatedStyle(() => ({ opacity: shown.value, width: w.value, transform: [{ translateX: x.value }] }));
}

/**
 * Indicateur « LIQUIDE » (barre d'onglets, direction Liquid Glass 20/11/2026) : même glissé que `useIndicator`, et la
 * pastille s'ÉTIRE dans le sens du trajet tant qu'elle est loin de sa cible (comme une goutte qui se déplace), puis
 * reprend sa forme en arrivant. Étirement proportionnel à la distance restante, plafonné (`liquidIndicator`) ; aucun
 * étirement avec « Réduire les animations » ou la nuit (glissé seul, ou pose immédiate).
 */
export function useLiquidIndicator(layout: ItemLayout | undefined) {
  const m = useMotion();
  const x = useSharedValue(layout?.x ?? 0);
  const w = useSharedValue(layout?.width ?? 0);
  const target = useSharedValue(layout?.x ?? 0);
  const shown = useSharedValue(layout && layout.width > 0 ? 1 : 0);
  const placed = useRef(!!layout && layout.width > 0);
  const stretchOn = m.level === 'full';
  const lx = layout?.x;
  const lw = layout?.width;
  useEffect(() => {
    if (lx === undefined || lw === undefined || !(lw > 0)) return;
    target.value = lx;
    if (!placed.current) {
      placed.current = true;
      x.value = lx;
      w.value = lw;
      shown.value = 1;
      return;
    }
    x.value = m.spring(lx, 'panneau');
    w.value = m.spring(lw, 'panneau');
  }, [lx, lw]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { cancelAnimation(x); cancelAnimation(w); }, [x, w]);
  return useAnimatedStyle(() => {
    const d = stretchOn ? Math.min(liquidIndicator.maxStretch, Math.abs(target.value - x.value) * liquidIndicator.perPx) : 0;
    const squash = liquidIndicator.maxStretch > 0 ? (d / liquidIndicator.maxStretch) * liquidIndicator.squash : 0;
    return { opacity: shown.value, width: w.value, transform: [{ translateX: x.value }, { scaleX: 1 + d }, { scaleY: 1 - squash }] };
  });
}
