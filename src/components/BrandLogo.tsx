/**
 * Fichiers (13/11/2026) : logo-mark.png 768 px et logo-line.png 1024 px, régénérés depuis le logo officiel détouré
 * (même dessin, même cadrage) : net jusqu'à 256 pt sur écran Retina, et contour nettoyé de la frange rose laissée par
 * l'ancien fond (visible sur les fonds sombres et sur la vidéo). Toujours `contain` : jamais étiré ni rogné.
 *  - BrandGlow : halo doux, sans bord (dégradé radial vers le transparent) pour poser le logo sur une vidéo ;
 *  - BrandShine : éclat qui suit le tracé du fil (copie claire du logo), sans cadre rectangulaire.
 *
 * Logo « Au fil de nous » (nouveau logo du 04/11/2026, identique à YouTube et TikTok) : utérus dessiné d'un fil doré,
 * feuilles, pousse et silhouette de femme enceinte, sur un fond rose clair uni.
 *  - BrandLogo : le fil doré seul, sur fond transparent (aucune tuile ni fond de couleur dans l'appli) ;
 *  - BrandLine : le fil doré seul sur fond transparent, pour les grands visuels.
 */
import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

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

/**
 * Halo doux derrière le logo : cœur légèrement plus dense (lisibilité du fil doré sur une vidéo claire ou mouvante),
 * anneau nacré, puis fondu complet vers le transparent. Aucun bord visible : le logo n'est jamais « dans un cadre ».
 */
export function BrandGlow({ size, core = 'rgba(34,18,44,0.22)', ring = 'rgba(203,138,114,0.30)' }: { size: number; core?: string; ring?: string }) {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const [cc, co] = splitAlpha(core);
  const [rc, ro] = splitAlpha(ring);
  return (
    <Svg width={size} height={size} pointerEvents="none">
      <Defs>
        <RadialGradient id={`glow${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={cc} stopOpacity={co} />
          <Stop offset="0.45" stopColor={rc} stopOpacity={ro} />
          <Stop offset="0.78" stopColor={rc} stopOpacity={ro * 0.35} />
          <Stop offset="1" stopColor={rc} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#glow${id})`} />
    </Svg>
  );
}

/** « rgba(r,g,b,a) » → [« rgb(r,g,b) », a] (react-native-svg veut l'opacité à part). */
function splitAlpha(c: string): [string, number] {
  const m = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/.exec(c);
  return m ? [`rgb(${m[1]},${m[2]},${m[3]})`, Number(m[4])] : [c, 1];
}

/** Copie claire du logo, à superposer exactement au logo : son opacité animée donne un éclat qui suit le tracé. */
export function BrandShine({ size, color = '#FFF1D6' }: { size: number; color?: string }) {
  return <Image source={LOGO_MARK} style={{ width: size, height: size, tintColor: color }} resizeMode="contain" accessible={false} />;
}
