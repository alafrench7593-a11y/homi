/**
 * Taille de texte de l'utilisateur (« fontScale ») pour les DÉCISIONS DE MISE EN PAGE (titre qui réduit, orbes qui
 * passent à la ligne, en-tête qui se replie) — l'agrandissement des glyphes lui-même reste fait par React Native
 * (`maxFontSizeMultiplier` plafonne par rôle typographique, voir tokens.ts `typography`).
 *
 *  - iOS / Android : `useWindowDimensions().fontScale` (suit le réglage du téléphone en direct).
 *  - Web : rapport entre la taille de police racine du navigateur et 16 px (réglage « Taille de la police » du
 *    navigateur). react-native-web n'agrandit pas les textes en px ; l'audit (e2e/audit_ux.py) simule le
 *    téléphone en fixant la police racine ET en agrandissant chaque texte de min(échelle, plafond).
 */
import { Platform, useWindowDimensions } from 'react-native';

/** Échelle lue sur le web (1 hors navigateur ou si la racine est illisible). */
export function webFontScale(): number {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return 1;
  const px = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(px) && px > 0 ? Math.round((px / 16) * 100) / 100 : 1;
}

/** Échelle effective d'un rôle : min(réglage, plafond du rôle), jamais < 1 pour le calcul de place. */
export function cappedScale(fontScale: number, maxScale?: number): number {
  const s = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
  return Math.max(1, maxScale ? Math.min(s, maxScale) : s);
}

export function useFontScale(): number {
  const { fontScale, width, height } = useWindowDimensions();
  // Web : relu à chaque changement de fenêtre (le réglage du navigateur ne déclenche pas d'événement dédié)
  void width; void height;
  return Platform.OS === 'web' ? webFontScale() : fontScale || 1;
}
