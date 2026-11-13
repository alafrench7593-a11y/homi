/**
 * Logo HOMI (13/11/2026) : maison lumineuse, deux parents et deux enfants au centre.
 * Vectoriel (react-native-svg), net à toutes les tailles ; tracés générés par `scripts/homi/brand.mjs`
 * (même source que assets/brand/homi-*.svg et les icônes de l'application).
 *  - BrandLogo : marque en couleur (nuit, lilas, perle), fond transparent ;
 *  - BrandLine : même marque pour les grands visuels ;
 *  - BrandShine : version monochrome claire à superposer pour un éclat animé.
 * API inchangée (size, style) pour ne toucher à aucun écran existant.
 */
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { HOMI_MARK_MONO_SVG, HOMI_MARK_SVG } from '@/brand/homiMarkSvg';

type LogoProps = { size?: number; style?: StyleProp<ViewStyle> };

export function BrandLogo({ size = 28, style }: LogoProps) {
  return (
    <View style={[{ width: size, height: size }, style]} accessible={false} importantForAccessibility="no-hide-descendants">
      <SvgXml xml={HOMI_MARK_SVG} width={size} height={size} />
    </View>
  );
}

export function BrandLine({ size = 160, style }: LogoProps) {
  return <BrandLogo size={size} style={style} />;
}

/** Copie monochrome de la marque, à superposer exactement au logo : son opacité animée donne un éclat. */
export function BrandShine({ size, color = '#F7F4FB' }: { size: number; color?: string }) {
  return (
    <View style={{ width: size, height: size }} accessible={false} importantForAccessibility="no-hide-descendants">
      <SvgXml xml={HOMI_MARK_MONO_SVG} width={size} height={size} color={color} />
    </View>
  );
}

/** Logo monochrome de la couleur du texte (en-têtes, pieds de page, petits formats). */
export function BrandMono({ size = 24, color, style }: LogoProps & { color: string }) {
  return (
    <View style={[{ width: size, height: size }, style]} accessible={false} importantForAccessibility="no-hide-descendants">
      <SvgXml xml={HOMI_MARK_MONO_SVG} width={size} height={size} color={color} />
    </View>
  );
}
