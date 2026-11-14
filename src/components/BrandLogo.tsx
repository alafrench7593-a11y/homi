/**
 * Logotype HOMI v4 « lentille » (14/11/2026) — remplace le pictogramme maison + famille.
 * Lettres DESSINÉES (tracés vectoriels, aucune police) : identiques sur iOS, Android, web et dans les PNG.
 * Tracés générés par `scripts/homi/brand.mjs` → `src/brand/homiMarkSvg.ts` (même source que assets/brand/*.svg).
 *  - BrandWordmark : le mot-symbole HOMI (le O est une lentille de verre) — clair, sombre ou monochrome ;
 *  - BrandLogo     : le SIGNE compact (la lentille du O, détail identifiable du logotype) — API inchangée (size, style) ;
 *  - BrandLine     : même signe pour les grands visuels ;
 *  - BrandShine    : signe monochrome clair à superposer (éclat animé) ;
 *  - BrandMono     : signe monochrome de la couleur du texte (en-têtes, pieds de page, petits formats).
 * Version claire = pour fond clair (ivoire), version sombre = pour fond sombre (obsidienne) ; « auto » suit le thème.
 */
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { HOMI_SIGN_SVG, HOMI_WORD, HOMI_WORDMARK_SVG } from '@/brand/homiMarkSvg';
import { BRAND } from '@/config/brand';
import { useTheme } from '@/theme/ThemeProvider';

type LogoProps = { size?: number; style?: StyleProp<ViewStyle> };
export type BrandTone = 'auto' | 'light' | 'dark' | 'mono';

/** Rapport largeur / hauteur du mot-symbole (boîte 360 × 120). */
export const WORDMARK_RATIO = HOMI_WORD.width / HOMI_WORD.height;

/** Variante effective : « auto » → clair ou sombre selon le thème. */
export function useBrandTone(tone: BrandTone = 'auto'): 'light' | 'dark' | 'mono' {
  const t = useTheme();
  return tone === 'auto' ? (t.isDark ? 'dark' : 'light') : tone;
}

/** Signe compact (lentille), en couleur selon le thème. */
export function BrandLogo({ size = 28, style, tone = 'auto' }: LogoProps & { tone?: BrandTone }) {
  const v = useBrandTone(tone);
  return (
    <View style={[{ width: size, height: size }, style]} accessible={false} importantForAccessibility="no-hide-descendants">
      <SvgXml xml={HOMI_SIGN_SVG[v]} width={size} height={size} />
    </View>
  );
}

export function BrandLine({ size = 160, style }: LogoProps) {
  return <BrandLogo size={size} style={style} />;
}

/** Copie monochrome du signe, à superposer exactement au logo : son opacité animée donne un éclat. */
export function BrandShine({ size, color = '#F7F4FB' }: { size: number; color?: string }) {
  return (
    <View style={{ width: size, height: size }} accessible={false} importantForAccessibility="no-hide-descendants">
      <SvgXml xml={HOMI_SIGN_SVG.mono} width={size} height={size} color={color} />
    </View>
  );
}

/** Signe monochrome de la couleur du texte (en-têtes, pieds de page, petits formats). */
export function BrandMono({ size = 24, color, style }: LogoProps & { color: string }) {
  return (
    <View style={[{ width: size, height: size }, style]} accessible={false} importantForAccessibility="no-hide-descendants">
      <SvgXml xml={HOMI_SIGN_SVG.mono} width={size} height={size} color={color} />
    </View>
  );
}

type WordmarkProps = {
  /** Hauteur du mot-symbole (px) ; la largeur suit (× 3). */
  height?: number;
  /** clair (fond clair), sombre (fond sombre), monochrome (`color`, sinon couleur du texte) ou auto (thème). */
  tone?: BrandTone;
  color?: string;
  style?: StyleProp<ViewStyle>;
  /** Le mot-symbole EST le nom : annoncé « HOMI » (en-tête par défaut) ; `decorative` le masque (nom déjà lu). */
  decorative?: boolean;
  header?: boolean;
  testID?: string;
};

/** Mot-symbole HOMI (version FIXE : aucun mouvement — petits formats, en-têtes, écrans d'identité). */
export function BrandWordmark({ height = 28, tone = 'auto', color, style, decorative = false, header = true, testID }: WordmarkProps) {
  const t = useTheme();
  const v = useBrandTone(tone);
  const width = Math.round(height * WORDMARK_RATIO);
  const a11y = decorative
    ? ({ accessible: false, importantForAccessibility: 'no-hide-descendants', accessibilityElementsHidden: true } as const)
    : ({ accessible: true, accessibilityRole: header ? 'header' : 'image', accessibilityLabel: BRAND.name } as const);
  return (
    <View testID={testID} style={[{ width, height }, style]} {...a11y}>
      <SvgXml xml={HOMI_WORDMARK_SVG[v]} width={width} height={height} color={v === 'mono' ? color ?? t.colors.text : undefined} />
    </View>
  );
}
