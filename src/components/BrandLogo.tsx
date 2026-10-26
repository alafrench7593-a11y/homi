/**
 * Logo « Au fil de nous » (validé le 26/10/2026) : utérus dessiné d'un fil doré, feuilles, pousse et silhouette
 * de femme enceinte, sur le ciel rose et pêche de la vidéo de fond.
 *  - BrandLogo : la tuile d'icône (ciel + fil doré), coins arrondis comme sur l'écran d'accueil du téléphone ;
 *  - BrandLine : le fil doré seul sur fond transparent, pour les grands visuels.
 */
import { Image, type ImageStyle, type StyleProp } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const LOGO_MARK: number = require('../../assets/brand/logo-mark.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const LOGO_LINE: number = require('../../assets/brand/logo-line.png');

export function BrandLogo({ size = 28, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={LOGO_MARK}
      style={[{ width: size, height: size, borderRadius: size * 0.23 }, style]}
      accessibilityIgnoresInvertColors
      accessible={false}
    />
  );
}

export function BrandLine({ size = 160, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={LOGO_LINE} style={[{ width: size, height: size }, style]} resizeMode="contain" accessible={false} />;
}
