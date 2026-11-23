/**
 * Sélecteur « Personnaliser l'accueil » — logique pure (testée) : ordre, vignette, encre lisible, choix coché.
 * Seul ce dossier (avec src/theme, le magasin et Réglages) manipule des noms de thème (hardcodedColors.test.ts).
 */
import { contrastRatio } from '@/theme/contrast';
import { OFFERED_PALETTES, PALETTE_SPECS, resolvePalette, themeFor, type PaletteChoice, type PaletteName, type ProfileKind } from '@/theme/tokens';

/** Ordre d'affichage (deux colonnes, ligne par ligne) : celui du tableau de la propriétaire. */
export const PICKER_THEMES: readonly PaletteName[] = OFFERED_PALETTES;

/** Thème coché : l'aperçu en cours, sinon le thème confirmé (Adaptatif : celui du profil affiché). */
export function pickerSelected(preview: PaletteName | null, choice: PaletteChoice, profile: ProfileKind): PaletteName {
  return preview ?? resolvePalette(choice, profile);
}

/** Vignette d'un thème : deux arrêts du reflet nacré (`PALETTE_SPECS[p].swatch`). */
export function swatchOf(p: PaletteName): [string, string] {
  return PALETTE_SPECS[p].swatch;
}

/**
 * Encre du libellé posé sur la vignette : parmi les textes du thème (clair, sombre) et la surface claire, celle dont le
 * contraste le plus FAIBLE sur les deux arrêts est le plus élevé (≥ 4,5:1, testé pour les huit thèmes).
 */
export function swatchInk(p: PaletteName): string {
  const spec = PALETTE_SPECS[p];
  const stops = swatchOf(p);
  const candidates = [spec.light.text, spec.dark.text, themeFor('light', p).colors.surface, spec.dark.onAccent];
  let best = candidates[0];
  let bestMin = -1;
  for (const c of candidates) {
    const m = Math.min(...stops.map((s) => contrastRatio(c, s)));
    if (m > bestMin) { bestMin = m; best = c; }
  }
  return best;
}

/** Contraste minimal du libellé sur sa vignette (diagnostic, tests). */
export function swatchInkContrast(p: PaletteName): number {
  const ink = swatchInk(p);
  return Math.min(...swatchOf(p).map((s) => contrastRatio(ink, s)));
}

/** Thème sombre par nature (mention « Toujours sombre » pour les lecteurs d'écran). */
export const alwaysDark = (p: PaletteName) => PALETTE_SPECS[p].scheme === 'dark';
