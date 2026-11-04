/**
 * Logo « Au fil de nous » (nouveau logo du 04/11/2026, identique à YouTube et TikTok) : utérus dessiné d'un fil doré,
 * feuilles, pousse et silhouette de femme enceinte, sur un fond rose clair uni.
 *  - BrandLogo : le fil doré seul, sur fond transparent (aucune tuile ni fond de couleur dans l'appli) ;
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
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
      accessible={false}
    />
  );
}

export function BrandLine({ size = 160, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={LOGO_LINE} style={[{ width: size, height: size }, style]} resizeMode="contain" accessible={false} />;
}
