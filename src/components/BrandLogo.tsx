/**
 * Fichiers (13/11/2026) : logo-mark.png 768 px et logo-line.png 1024 px, régénérés depuis le logo officiel détouré
 * (même dessin, même cadrage) : net jusqu'à 256 pt sur écran Retina, et contour nettoyé de la frange rose laissée par
 * l'ancien fond (visible sur les fonds sombres et sur la vidéo). Toujours `contain` : jamais étiré ni rogné.
 *  - BrandShine : éclat qui suit le tracé du fil (copie claire du logo), sans cadre rectangulaire.
 *
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

/** Copie claire du logo, à superposer exactement au logo : son opacité animée donne un éclat qui suit le tracé. */
export function BrandShine({ size, color = '#FFF1D6' }: { size: number; color?: string }) {
  return <Image source={LOGO_MARK} style={{ width: size, height: size, tintColor: color }} resizeMode="contain" accessible={false} />;
}
