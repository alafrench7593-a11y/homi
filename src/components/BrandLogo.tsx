/**
 * Logo HOMI v5 « maison » (14/11/2026, décision du propriétaire : retour à la maison, le logotype « lentille » v4
 * est abandonné). Maison violette aux contours lumineux, deux parents et deux enfants au centre (silhouettes lavande /
 * blanc). Vectoriel (react-native-svg) ; tracés générés par `scripts/homi/brand.mjs` → `src/brand/homiMarkSvg.ts`
 * (même source que assets/brand/homi-mark-*.svg et les icônes).
 *  - BrandLogo     : la maison seule — API inchangée (size, style) ; `tone` facultatif ;
 *  - BrandName     : le nom « HOMI » dans la typographie de l'app (Space Grotesk, graisse 700), couleur de la marque ;
 *  - BrandWordmark : maison + nom HOMI à côté (en-têtes, écrans d'identité) — API height / tone / color / decorative /
 *                    header / testID ;
 *  - BrandStack    : maison + nom dessous (composition du logo animé, version fixe) ;
 *  - BrandLine / BrandShine / BrandMono : grands visuels, éclat monochrome, monochrome couleur du texte.
 * Version claire = fond ivoire, sombre = fond obsidienne ; « auto » suit le thème.
 */
import { View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { HOMI_COLORS, HOMI_MARK_SVG } from '@/brand/homiMarkSvg';
import { logoBox } from '@/brand/logoMotion';
import { Text } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

type LogoProps = { size?: number; style?: StyleProp<ViewStyle> };
export type BrandTone = 'auto' | 'light' | 'dark' | 'mono';

/** Largeur indicative du `BrandWordmark` (maison + nom) : ≈ 2,9 × la hauteur. */
export const WORDMARK_RATIO = 2.9;
/** Proportions du `BrandWordmark` (part de la hauteur). */
const WORDMARK = { name: 0.66, gap: 0.22 } as const;

/** Variante effective : « auto » → clair ou sombre selon le thème. */
export function useBrandTone(tone: BrandTone = 'auto'): 'light' | 'dark' | 'mono' {
  const t = useTheme();
  return tone === 'auto' ? (t.isDark ? 'dark' : 'light') : tone;
}

/** Couleur du nom selon la variante (mono : `color`, sinon couleur du texte). */
export function useBrandNameColor(tone: BrandTone = 'auto', color?: string): string {
  const t = useTheme();
  const v = useBrandTone(tone);
  return v === 'mono' ? color ?? t.colors.text : HOMI_COLORS[v].name;
}

/** La maison (logo), en couleur selon le thème. Décor : le nom est annoncé ailleurs. */
export function BrandLogo({ size = 28, style, tone = 'auto', color }: LogoProps & { tone?: BrandTone; color?: string }) {
  const t = useTheme();
  const v = useBrandTone(tone);
  return (
    <View style={[{ width: size, height: size }, style]} accessible={false} importantForAccessibility="no-hide-descendants">
      <SvgXml xml={HOMI_MARK_SVG[v]} width={size} height={size} color={v === 'mono' ? color ?? t.colors.text : undefined} />
    </View>
  );
}

export function BrandLine({ size = 160, style }: LogoProps) {
  return <BrandLogo size={size} style={style} />;
}

/** Copie monochrome de la maison, à superposer exactement au logo : son opacité animée donne un éclat. */
export function BrandShine({ size, color = '#F7F4FB' }: { size: number; color?: string }) {
  return (
    <View style={{ width: size, height: size }} accessible={false} importantForAccessibility="no-hide-descendants">
      <SvgXml xml={HOMI_MARK_SVG.mono} width={size} height={size} color={color} />
    </View>
  );
}

/** Maison monochrome de la couleur du texte (en-têtes, pieds de page, petits formats). */
export function BrandMono({ size = 24, color, style }: LogoProps & { color: string }) {
  return (
    <View style={[{ width: size, height: size }, style]} accessible={false} importantForAccessibility="no-hide-descendants">
      <SvgXml xml={HOMI_MARK_SVG.mono} width={size} height={size} color={color} />
    </View>
  );
}

/**
 * Le nom « HOMI » en typographie de l'app (titres : Space Grotesk 700), couleur de la marque. Taille FIXE (c'est un
 * logo : il ne suit pas la taille de texte du téléphone). Décor par défaut — le composant parent annonce le nom.
 */
export function BrandName({ size, line, tone = 'auto', color, style }: { size: number; line?: number; tone?: BrandTone; color?: string; style?: StyleProp<TextStyle> }) {
  const fill = useBrandNameColor(tone, color);
  return (
    <Text
      variant="title"
      allowFontScaling={false}
      maxFontSizeMultiplier={1}
      numberOfLines={1}
      accessible={false}
      importantForAccessibility="no"
      style={[{ fontFamily: fonts.display, fontSize: size, lineHeight: line ?? Math.round(size * 1.18), letterSpacing: -size * 0.02, color: fill, includeFontPadding: false }, style]}
    >
      {BRAND.name}
    </Text>
  );
}

type WordmarkProps = {
  /** Hauteur (px) : côté de la maison ; le nom suit (≈ 0,66 × hauteur). */
  height?: number;
  /** clair (fond clair), sombre (fond sombre), monochrome (`color`, sinon couleur du texte) ou auto (thème). */
  tone?: BrandTone;
  color?: string;
  style?: StyleProp<ViewStyle>;
  /** Annoncé « HOMI » (en-tête par défaut) ; `decorative` le masque (nom déjà lu). */
  decorative?: boolean;
  header?: boolean;
  testID?: string;
};

const a11yFor = (decorative: boolean, header: boolean) => (decorative
  ? ({ accessible: false, importantForAccessibility: 'no-hide-descendants', accessibilityElementsHidden: true } as const)
  : ({ accessible: true, accessibilityRole: header ? 'header' : 'image', accessibilityLabel: BRAND.name } as const));

/** Maison + nom HOMI à côté (version FIXE : en-têtes, connexion, écrans d'identité). */
export function BrandWordmark({ height = 28, tone = 'auto', color, style, decorative = false, header = true, testID }: WordmarkProps) {
  return (
    <View testID={testID} style={[{ height, flexDirection: 'row', alignItems: 'center', gap: Math.round(height * WORDMARK.gap) }, style]} {...a11yFor(decorative, header)}>
      <BrandLogo size={height} tone={tone} color={color} />
      <BrandName size={Math.round(height * WORDMARK.name)} line={height} tone={tone} color={color} />
    </View>
  );
}

/** Maison + nom dessous (composition du logo animé, `logoBox`) — version FIXE du logo animé, écran de chargement. */
export function BrandStack({ width, tone = 'auto', color, style, decorative = false, header = true, testID }: Omit<WordmarkProps, 'height'> & { width: number }) {
  const b = logoBox(width);
  return (
    <View testID={testID} style={[{ width, height: b.height, alignItems: 'center' }, style]} {...a11yFor(decorative, header)}>
      <BrandLogo size={b.house.size} tone={tone} color={color} />
      <BrandName size={b.name.size} line={b.name.line} tone={tone} color={color} style={{ marginTop: b.name.top - b.house.size }} />
    </View>
  );
}
