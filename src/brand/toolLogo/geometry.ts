/**
 * Géométrie commune des logos d'outils et de l'icône de l'app — module PUR (aucun import React Native) : partagé par
 * le composant `ToolLogo`, les planches (scripts/da) et les tests.
 *
 *  - PLAQUE : verre dépoli de la propriétaire (image 256, plein cadre), squircle « coins continus » ;
 *  - SYMBOLE : boîte 128 identique à la plaque ; pictogramme sur grille 24 posé en translate(21 21) scale(3.58) —
 *    la mise en place des fichiers fournis (Motion/symboles), reprise telle quelle pour les pictogrammes de repli ;
 *  - LUMIÈRE : disque radial centré, rayon 0,40 (détaillé) / 0,36 (compact) de la plaque ;
 *  - TRACÉS ANIMÉS (anneau, courbe, coche, étoiles) : grille 64.
 */
export const LOGO_GRID = 64;
/** Boîte du symbole et de la lumière (celle des fichiers fournis). */
export const SYMBOL_BOX = 128;
/** Mise en place du pictogramme 24 dans la boîte 128 (fichiers fournis). */
export const SYMBOL_TRANSFORM = 'translate(21 21) scale(3.58)';

export type LogoVariant = 'detailed' | 'compact';

/** Trait du symbole (grille 24) : plus nourri que le SVG fourni (2,04), comme ses rendus PNG ; compact encore plus franc (28–40 pt). */
export const SYMBOL_STROKE: Record<LogoVariant, { pearl: number; shadow: number; highlight: number }> = {
  detailed: { pearl: 2.4, shadow: 2.5, highlight: 0.4 },
  compact: { pearl: 2.7, shadow: 2.8, highlight: 0 },
};

/** Squircle (superellipse) centré dans un carré `size`, exposant n (5 ≈ coins continus d'iOS). */
export function squirclePath(size = LOGO_GRID, n = 5, steps = 96, inset = 0): string {
  const a = size / 2 - inset;
  const c = size / 2;
  const pts: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const x = c + a * Math.sign(ct) * Math.abs(ct) ** (2 / n);
    const y = c + a * Math.sign(st) * Math.abs(st) ** (2 / n);
    pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** Rayon équivalent d'un coin pour une boîte `size` (ombre portée, anneau de focus, masque web). */
export const squircleRadius = (size: number) => size * 0.2237;

/** Tailles réelles de l'icône iOS vérifiées (pt × échelle) : 1024 App Store, 180/120 écran d'accueil, 87/60/40. */
export const APP_ICON_SIZES = [1024, 180, 120, 87, 60, 40] as const;
