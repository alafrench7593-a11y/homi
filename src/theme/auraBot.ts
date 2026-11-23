/**
 * Palette du robot compagnon d'Aura (`AuraBot`, src/features/aura/AuraBot.tsx) — couleurs de PERSONNAGE.
 *
 * Comme la signature d'Aura (`AURA`, src/theme/toolLogo.ts), ce sont des couleurs sémantiques de la marque d'Aura :
 * identiques dans les cinq palettes (le personnage ne change pas de couleur avec le thème), elles ne varient qu'avec
 * l'apparence : clair, sombre (contour plus discret, ombre plus profonde) et nuit (désaturé, assombri : rien ne brille
 * pendant les soins nocturnes).
 *
 *  - 23/11/2026 : noir, blanc et gris uniquement (décision de la propriétaire) ; ancien nuancier ci-dessous.
 *  - coque : blanc nacré (dégradé #FFF8F2 → #F3E7E4) et accents rose poudré (oreilles, mains, base) ;
 *  - visière : bleu de nuit d'Aura (#1E2A4A) tramée de points fins ;
 *  - yeux et bouche : points lumineux arrondis corail (#F08A6C) et ambre (#F2B65A) ;
 *  - cœur : lumière turquoise (#4FB3BF) sur le torse ; lueur corail sous le corps (il flotte).
 */
import type { Theme } from './tokens';

export interface AuraBotPalette {
  shellTop: string;
  shellBottom: string;
  /** contour de la silhouette (lisible sur un fond clair, même à 32 px) */
  outline: string;
  outlineOpacity: number;
  /** liseré lumineux intérieur façon Liquid Glass et reflet du dôme */
  rim: string;
  rimOpacity: number;
  sheenOpacity: number;
  blush: string;
  blushDeep: string;
  visorTop: string;
  visor: string;
  /** trame de points de la visière */
  grid: string;
  gridOpacity: number;
  coral: string;
  amber: string;
  heart: string;
  /** lueur corail sous le corps */
  glow: string;
  glowOpacity: number;
  /** ombre de contact au sol */
  shadow: string;
  shadowOpacity: number;
}

const BASE: AuraBotPalette = {
  shellTop: '#FFFFFF',
  shellBottom: '#E6E6E9',
  outline: '#8E8E94',
  outlineOpacity: 0.55,
  rim: '#FFFFFF',
  rimOpacity: 0.9,
  sheenOpacity: 0.85,
  blush: '#C9C9CE',
  blushDeep: '#AEAEB4',
  visorTop: '#2E2E32',
  visor: '#151517',
  grid: '#8A8A90',
  gridOpacity: 0.16,
  coral: '#F4F4F6',
  amber: '#D8D8DC',
  heart: '#BDBDC2',
  glow: '#9A9AA0',
  glowOpacity: 0.45,
  shadow: '#151517',
  shadowOpacity: 0.2,
};

export const AURA_BOT: Record<'light' | 'dark' | 'night', AuraBotPalette> = {
  light: BASE,
  dark: { ...BASE, outline: '#000000', outlineOpacity: 0.35, glowOpacity: 0.55, shadow: '#000000', shadowOpacity: 0.45 },
  night: {
    ...BASE,
    shellTop: '#CFCFD2', shellBottom: '#B4B4B8', outline: '#000000', outlineOpacity: 0.4, rimOpacity: 0.35, sheenOpacity: 0.3,
    blush: '#9C9CA2', blushDeep: '#86868C', visorTop: '#1C1C1F', visor: '#111113', gridOpacity: 0.1,
    coral: '#C8C8CC', amber: '#B0B0B4', heart: '#8E8E94', glowOpacity: 0.2, shadow: '#000000', shadowOpacity: 0.4,
  },
};

/** Palette du robot pour un thème (clair, sombre ou nuit). */
export const auraBotPalette = (t: Pick<Theme, 'name' | 'isDark'>): AuraBotPalette => AURA_BOT[t.name === 'night' ? 'night' : t.isDark ? 'dark' : 'light'];
