/**
 * Verre liquide — cadre commun web / natif (pur) : voile du thème, lèvre (bord lumineux d'un point + ombre interne du
 * côté opposé à la lumière, l'épaisseur se lit sur le pourtour) et ombre portée discrète.
 */
import type { ViewStyle } from 'react-native';
import { alpha } from '@/theme/tokens';
import type { useTheme } from '@/theme/ThemeProvider';
import type { LensParams } from './params';

export interface LiquidLensProps {
  radius: number; params: LensParams; testID?: string;
  /** `top` : feuille collée en bas, seuls les coins du haut sont arrondis */
  edges?: 'all' | 'top';
  /**
   * `false` : carte de contenu posée sur le fond uni de la page — même lèvre, même reflet, même ombre, sans filtre de
   * réfraction (rien à réfracter derrière ; un filtre par carte coûterait au défilement).
   */
  refract?: boolean;
  /** Remplissage imposé (carte de contenu : surface du thème, lisibilité des textes) */
  fill?: string;
}

/** Rayons par coin (feuille collée en bas : coins du bas droits). */
export const cornersOf = (radius: number, edges: 'all' | 'top' = 'all') => (edges === 'top' ? { borderTopLeftRadius: radius, borderTopRightRadius: radius, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : { borderRadius: radius });

export function lensFrame(t: ReturnType<typeof useTheme>, p: LensParams, radius: number, opaque: boolean, fill?: string): { outer: ViewStyle; fill: ViewStyle; lip: ViewStyle } {
  const light = t.tokens.inverse.text;
  const ink = t.tokens.shadowColor;
  const a = (p.lightAngle * Math.PI) / 180;
  // décalage de l'ombre interne : à l'opposé de la source
  const ox = Math.round(-Math.cos(a) * 2 * 10) / 10, oy = Math.round(Math.sin(a) * 2 * 10) / 10;
  const lipW = Math.max(1, Math.min(3, p.bezel / 10));
  return {
    outer: {
      borderRadius: radius,
      boxShadow: p.shadow > 0 ? `0 ${Math.round(4 + 10 * p.shadow)}px ${Math.round(12 + 26 * p.shadow)}px ${alpha(ink, (t.isDark ? 0.5 : 0.22) * p.shadow)}, 0 1px 2px ${alpha(ink, (t.isDark ? 0.4 : 0.12) * p.shadow)}` : undefined,
    } as ViewStyle,
    fill: { backgroundColor: fill ?? (opaque ? t.colors.surface : alpha(t.colors.surface, p.tint)) },
    lip: {
      borderWidth: 1,
      borderColor: alpha(light, opaque ? 0.5 : t.isDark ? 0.16 + 0.2 * p.highlight : 0.45 + 0.4 * p.highlight),
      boxShadow: opaque ? undefined
        : `inset ${-ox}px ${-oy}px ${lipW}px ${alpha(light, (t.isDark ? 0.25 : 0.7) * p.highlight)}, inset ${ox}px ${oy}px ${lipW * 2}px ${alpha(ink, t.isDark ? 0.35 : 0.1)}`,
    } as ViewStyle,
  };
}
