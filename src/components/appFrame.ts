/**
 * Largeur réelle de l'app. Sur le web, au-delà de 600 px de fenêtre, l'app est posée dans un cadre téléphone de 420 px
 * (`WebFrame`, src/app/_layout.tsx) : les éléments qui se dimensionnent sur la largeur (barre d'onglets…) doivent
 * lire CETTE largeur, pas celle de la fenêtre (sinon ils débordent du cadre). Ailleurs : largeur de la fenêtre.
 */
import { Platform, useWindowDimensions } from 'react-native';

export const WEB_FRAME = { minWindow: 600, width: 420, maxHeight: 900 } as const;

export function webFrameOn(windowWidth: number): boolean {
  if (Platform.OS !== 'web' || windowWidth < WEB_FRAME.minWindow) return false;
  try { return globalThis.localStorage?.getItem('toietmoi.frame') !== 'off'; } catch { return true; }
}

export function useAppWidth(): number {
  const { width } = useWindowDimensions();
  return webFrameOn(width) ? WEB_FRAME.width : width;
}
