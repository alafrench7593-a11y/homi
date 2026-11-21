/**
 * Géométrie commune des logos d'outils et de l'icône de l'app (grille 64, docs/DA_LIQUID_GLASS.md) — module PUR
 * (aucun import React Native) : partagé par le composant `ToolLogo`, l'export des icônes (scripts/da) et les tests.
 *
 *  - PLAQUE : squircle « coins continus » (superellipse n = 5, comme une icône d'app iOS), pleine grille 64 ;
 *  - GLYPHE : pictogramme HOMI (grille 24) centré dans une zone de 36 (détaillé) ou 38 (compact) — marge optique
 *    identique pour toute la famille ;
 *  - LUMIÈRE (verre sombre, 21/11/2026) : cœur lumineux au centre-haut, reflet doux en diagonale, liseré fin sur les
 *    bords haut et gauche, ombre interne en bas, rayonnement du glyphe. Mêmes proportions pour tous les outils : seuls
 *    la teinte et le glyphe changent.
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
  // verre sombre (21/11/2026) : trait un peu plus nourri, le pictogramme se lit « plein » et lumineux
  detailed: { size: 36, stroke: 1.95 },
  // compact : glyphe un peu plus grand et trait plus franc, lisible à 28–40 pt dans une liste
  compact: { size: 38, stroke: 2.15 },
};

/** Transformation SVG qui pose un pictogramme 24 au centre de la plaque 64. */
export function glyphTransform(variant: LogoVariant, dy = 0): string {
  const { size } = GLYPH_BOX[variant];
  const k = size / 24;
  const o = (LOGO_GRID - size) / 2;
  return `translate(${o} ${o + dy}) scale(${k.toFixed(4)})`;
}

/** Cœur lumineux de la plaque : dégradé radial centré au centre-haut (fractions de la plaque). */
export const CORE = { cx: 0.5, cy: 0.3, r: 0.62 } as const;

/** Reflet doux en diagonale : bande claire du coin haut-gauche, fondue avant le centre (fractions du dégradé). */
export const SHEEN_BAND = { solid: 0.3, end: 0.52 } as const;

/** Liseré lumineux : contour intérieur de la plaque (retrait et épaisseur, grille 64). */
export const RIM = { inset: 0.6, width: 1.1 } as const;
export const RIM_PATH = squirclePath(LOGO_GRID, 5, 96, RIM.inset);

/**
 * Rayonnement du glyphe (sans filtre de flou, coûteux sur mobile) : traits élargis superposés, de plus en plus
 * larges et transparents — un dégradé de lumière autour du pictogramme. Détaillé : trois couches ; compact : une
 * seule, plus discrète (lisibilité à 28–40 pt). `spread` : élargissement du trait (grille 24).
 */
export function glyphGlowLayers(variant: LogoVariant, strength: number): { spread: number; opacity: number }[] {
  if (strength <= 0) return [];
  const steps = variant === 'detailed' ? [[4.2, 0.22], [2.6, 0.34], [1.2, 0.5]] : [[1.6, 0.45]];
  return steps.map(([spread, k]) => ({ spread, opacity: +(strength * k).toFixed(3) }));
}

/** Contour de l'aplat redessiné au clair par-dessus les détails : un peu plus large que le trait (pas de liseré sombre). */
export const FILL_EDGE = 1.25;

/** Rayon équivalent d'un coin pour une boîte `size` (ombre portée, anneau de focus, masque web). */
export const squircleRadius = (size: number) => size * 0.2237;

/** Tailles réelles de l'icône iOS vérifiées (pt × échelle) : 1024 App Store, 180/120 écran d'accueil, 87/60/40. */
export const APP_ICON_SIZES = [1024, 180, 120, 87, 60, 40] as const;
