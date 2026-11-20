/**
 * Géométrie commune des logos d'outils et de l'icône de l'app (grille 64, docs/DA_LIQUID_GLASS.md) — module PUR
 * (aucun import React Native) : partagé par le composant `ToolLogo`, l'export des icônes (scripts/da) et les tests.
 *
 *  - PLAQUE : squircle « coins continus » (superellipse n = 5, comme une icône d'app iOS), pleine grille 64 ;
 *  - GLYPHE : pictogramme HOMI (grille 24) centré dans une zone de 36 (détaillé) ou 38 (compact) — marge optique
 *    identique pour toute la famille ;
 *  - LUMIÈRE : reflet elliptique en haut à gauche, arête claire en haut (la moitié haute du contour), ombre interne
 *    en bas. Mêmes proportions pour tous les outils : seule la teinte et le glyphe changent.
 */
export const LOGO_GRID = 64;

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

/** Moitié haute du contour (arête éclairée), de 9 h à 3 h en passant par midi. */
export function squircleTopEdge(size = LOGO_GRID, n = 5, steps = 48, inset = 0.6): string {
  const a = size / 2 - inset;
  const c = size / 2;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = Math.PI + (i / steps) * Math.PI; // 180° → 360° (haut, l'axe y descend)
    const ct = Math.cos(t);
    const st = Math.sin(t);
    pts.push(`${(c + a * Math.sign(ct) * Math.abs(ct) ** (2 / n)).toFixed(2)} ${(c + a * Math.sign(st) * Math.abs(st) ** (2 / n)).toFixed(2)}`);
  }
  return `M${pts.join('L')}`;
}

export type LogoVariant = 'detailed' | 'compact';

/** Zone du glyphe dans la grille 64 et épaisseur de trait (en unités de la grille 24 du pictogramme). */
export const GLYPH_BOX: Record<LogoVariant, { size: number; stroke: number }> = {
  detailed: { size: 36, stroke: 1.75 },
  // compact : glyphe un peu plus grand et trait plus franc, lisible à 28–40 pt dans une liste
  compact: { size: 38, stroke: 2 },
};

/** Transformation SVG qui pose un pictogramme 24 au centre de la plaque 64. */
export function glyphTransform(variant: LogoVariant, dy = 0): string {
  const { size } = GLYPH_BOX[variant];
  const k = size / 24;
  const o = (LOGO_GRID - size) / 2;
  return `translate(${o} ${o + dy}) scale(${k.toFixed(4)})`;
}

/** Reflet : ellipse inclinée en haut à gauche. */
export const SHEEN = { cx: 22, cy: 14, rx: 30, ry: 18, rotate: -18 } as const;

/** Rayon équivalent d'un coin pour une boîte `size` (ombre portée, anneau de focus, masque web). */
export const squircleRadius = (size: number) => size * 0.2237;

/** Tailles réelles de l'icône iOS vérifiées (pt × échelle) : 1024 App Store, 180/120 écran d'accueil, 87/60/40. */
export const APP_ICON_SIZES = [1024, 180, 120, 87, 60, 40] as const;
