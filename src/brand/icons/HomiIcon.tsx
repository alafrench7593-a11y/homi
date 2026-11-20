/**
 * `HomiIcon` — pictogramme de la famille HOMI (src/brand/icons/paths.ts) : grille 24, trait d'encre 1,75 arrondi,
 * aplat doux de la couleur de catégorie (ou de l'accent) sous le trait.
 *
 *   <HomiIcon name="sleep" />                              // encre du thème, aplat de l'accent
 *   <HomiIcon name="feeding" tone={categoryTone(t, 'feeding')} active />
 *
 * États : `active` = aplat plus présent (onglet choisi, catégorie ouverte) ; inactif = aplat léger. Le sens ne repose
 * jamais sur l'aplat seul (le trait dit tout, contraste du trait = celui du texte). Décoratif pour les lecteurs
 * d'écran (le bouton qui le porte a son nom). Aucune couleur en dur : tout vient du thème (ou des props).
 */
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { HOMI_ICONS, type HomiIconName } from './paths';

export const ICON_STROKE = 1.75;
/** Opacité de l'aplat selon l'état. */
export const ICON_FILL = { active: 0.38, inactive: 0.16 } as const;

export interface HomiIconProps {
  name: HomiIconName;
  size?: number;
  /** Encre du trait (défaut : texte du thème). */
  color?: string;
  /** Couleur de l'aplat (défaut : accent du thème). `null` : sans aplat. */
  tone?: string | null;
  active?: boolean;
  /** Épaisseur du trait à 24 pt (défaut 1,75 ; mise à l'échelle avec la taille). */
  strokeWidth?: number;
  testID?: string;
}

export function HomiIcon({ name, size = 24, color, tone, active = false, strokeWidth, testID }: HomiIconProps) {
  const t = useTheme();
  const def: { stroke: string; fill?: string; dots?: [number, number, number][]; heavy?: boolean } = HOMI_ICONS[name];
  const ink = color ?? t.colors.text;
  const plate = tone === undefined ? t.colors.primary : tone;
  const sw = strokeWidth ?? (def.heavy ? 2.25 : ICON_STROKE);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" testID={testID} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
      {def.fill && plate ? <Path d={def.fill} fill={plate} fillOpacity={active ? ICON_FILL.active : ICON_FILL.inactive} /> : null}
      <Path d={def.stroke} fill="none" stroke={ink} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      {def.dots?.map(([cx, cy, r]) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={ink} />)}
    </Svg>
  );
}

/**
 * Couleur d'aplat d'une des 9 catégories : la MÊME que les glyphes d'outils de la catégorie (`CATEGORY_THEME` →
 * `glyphColor`, src/components/ToolGlyph.tsx), sans importer le registre (aucune dépendance circulaire).
 */
const CATEGORY_COLOR = {
  feeding: 'primary', sleep: 'lavender', care: 'gold', health: 'heart', cycle: 'primary', pregnancy: 'lavender', school: 'success', couple: 'lavender', family: 'primary',
} as const;
export type IconCategory = keyof typeof CATEGORY_COLOR;
export const ICON_CATEGORIES = Object.keys(CATEGORY_COLOR) as IconCategory[];
export function categoryTone(t: ReturnType<typeof useTheme>, category: IconCategory) {
  return t.colors[CATEGORY_COLOR[category]];
}
