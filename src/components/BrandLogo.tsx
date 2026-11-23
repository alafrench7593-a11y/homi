/**
 * Logo HOMI v5 « encre » (16/11/2026, décision de la propriétaire) : symbole « M » formé de deux personnes (l'une avec
 * un chignon) + mot-symbole « HOMI » arrondi (point du i rond). ENCRE sur fond clair, IVOIRE sur fond sombre (même
 * dessin) ; aucune autre couleur. Vectoriel (react-native-svg) ; tracés tirés tels quels des sources de la
 * propriétaire par `scripts/homi/brand.mjs` → `src/brand/homiMarkSvg.ts` (mêmes SVG que assets/brand/ et les icônes).
 *  - BrandLogo     : le symbole « M » seul — API inchangée (size, style) ; `tone` facultatif ;
 *  - BrandName     : le mot-symbole « HOMI » seul (dessin, aucune police) ;
 *  - BrandWordmark : logo complet (symbole + HOMI, assemblage officiel) — en-têtes, connexion, Réglages ;
 *  - BrandStack    : logo complet à une largeur donnée (version fixe du logo animé, écran de chargement) ;
 *  - BrandLine / BrandShine / BrandMono : grands visuels, éclat monochrome, monochrome couleur du texte.
 * « auto » suit le thème : encre en clair, ivoire en sombre. Accessibilité : annoncé « HOMI ».
 */
import { View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { HOMI_INK, HOMI_SVG, HOMI_WORD_VIEWBOX, type HomiArt } from '@/brand/homiMarkSvg';
import { LOGO_RATIO, logoBox } from '@/brand/logoMotion';
import { BRAND } from '@/config/brand';
import { useTheme } from '@/theme/ThemeProvider';

type LogoProps = { size?: number; style?: StyleProp<ViewStyle> };
/** auto (thème) | light = encre (fond clair) | dark = ivoire (fond sombre) | mono = `color` (sinon couleur du texte). */
export type BrandTone = 'auto' | 'light' | 'dark' | 'mono';

/** Largeur du `BrandWordmark` (logo complet) : ≈ 3,26 × la hauteur. */
export const WORDMARK_RATIO = LOGO_RATIO;
/** Rapport largeur / hauteur du mot-symbole seul. */
const WORD_RATIO = HOMI_WORD_VIEWBOX[2] / HOMI_WORD_VIEWBOX[3];

/** Variante effective : « auto » → encre (clair) ou ivoire (sombre) selon le thème. */
export function useBrandTone(tone: BrandTone = 'auto'): 'light' | 'dark' | 'mono' {
  const t = useTheme();
  return tone === 'auto' ? (t.isDark ? 'dark' : 'light') : tone;
}

/** Couleur du logo selon la variante (mono : `color`, sinon couleur du texte). */
export function useBrandNameColor(tone: BrandTone = 'auto', color?: string): string {
  const t = useTheme();
  const v = useBrandTone(tone);
  return v === 'mono' ? color ?? t.colors.text : HOMI_INK[v];
}

const hidden = { accessible: false, importantForAccessibility: 'no-hide-descendants', accessibilityElementsHidden: true } as const;

/** Un des trois dessins (symbole, mot, logo) dans la variante voulue. Décor : le nom est annoncé par le parent. */
function Art({ art, width, height, tone, color }: { art: HomiArt; width: number; height: number; tone: BrandTone; color?: string }) {
  const t = useTheme();
  const v = useBrandTone(tone);
  return <SvgXml xml={HOMI_SVG[art][v]} width={width} height={height} color={v === 'mono' ? color ?? t.colors.text : undefined} />;
}

/** Le symbole « M » (deux personnes), encre ou ivoire selon le thème. Décor : le nom est annoncé ailleurs. */
export function BrandLogo({ size = 28, style, tone = 'auto', color }: LogoProps & { tone?: BrandTone; color?: string }) {
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]} {...hidden}>
      <Art art="symbol" width={size} height={size} tone={tone} color={color} />
    </View>
  );
}

export function BrandLine({ size = 160, style }: LogoProps) {
  return <BrandLogo size={size} style={style} />;
}

/** Copie monochrome du symbole, à superposer exactement au logo : son opacité animée donne un éclat. */
export function BrandShine({ size, color = '#F7F1E8' }: { size: number; color?: string }) {
  return <BrandLogo size={size} tone="mono" color={color} />;
}

/** Symbole monochrome de la couleur voulue (en-têtes, pieds de page, petits formats). */
export function BrandMono({ size = 24, color, style }: LogoProps & { color: string }) {
  return <BrandLogo size={size} tone="mono" color={color} style={style} />;
}

/**
 * Le mot-symbole « HOMI » seul (dessin de la propriétaire, aucune police). `size` : hauteur du dessin (point du i
 * compris) ; `line` : hauteur de la ligne qui le centre. Taille FIXE (c'est un logo). Décor par défaut.
 */
export function BrandName({ size, line, tone = 'auto', color, style }: { size: number; line?: number; tone?: BrandTone; color?: string; style?: StyleProp<TextStyle> }) {
  const h = line ?? size;
  return (
    <View style={[{ height: h, justifyContent: 'center' }, style as StyleProp<ViewStyle>]} {...hidden}>
      <Art art="word" width={Math.round(size * WORD_RATIO)} height={size} tone={tone} color={color} />
    </View>
  );
}

type WordmarkProps = {
  /** Hauteur (px) du logo complet ; largeur = hauteur × `WORDMARK_RATIO`. */
  height?: number;
  /** encre (light), ivoire (dark), monochrome (`color`, sinon couleur du texte) ou auto (thème). */
  tone?: BrandTone;
  color?: string;
  style?: StyleProp<ViewStyle>;
  /** Annoncé « HOMI » (en-tête par défaut) ; `decorative` le masque (nom déjà lu). */
  decorative?: boolean;
  header?: boolean;
  testID?: string;
};

const a11yFor = (decorative: boolean, header: boolean) => (decorative
  ? hidden
  : ({ accessible: true, accessibilityRole: header ? 'header' : 'image', accessibilityLabel: BRAND.name } as const));

/** Logo complet (symbole + HOMI), version FIXE : en-têtes, connexion, écrans d'identité. */
export function BrandWordmark({ height = 28, tone = 'auto', color, style, decorative = false, header = true, testID }: WordmarkProps) {
  const width = Math.round(height * WORDMARK_RATIO);
  return (
    <View testID={testID} style={[{ height, width }, style]} {...a11yFor(decorative, header)}>
      <Art art="logo" width={width} height={height} tone={tone} color={color} />
    </View>
  );
}

/** Logo complet à une largeur donnée (`logoBox`) — image finale du logo animé, écran de chargement, introduction. */
export function BrandStack({ width, tone = 'auto', color, style, decorative = false, header = true, testID }: Omit<WordmarkProps, 'height'> & { width: number }) {
  const b = logoBox(width);
  return (
    <View testID={testID} style={[{ width, height: b.height }, style]} {...a11yFor(decorative, header)}>
      <Art art="logo" width={width} height={b.height} tone={tone} color={color} />
    </View>
  );
}
