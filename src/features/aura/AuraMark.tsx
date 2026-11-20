/**
 * Identité visuelle de HOMI Aura : le pictogramme suit les règles de la famille HomiIcon (grille 24, marge 2, trait
 * d'ENCRE 1,75 arrondi, aplat doux de l'accent sous le trait, aucune couleur en dur) — une bulle de conversation douce
 * d'où part un petit éclat à quatre branches (l'« aura »), entourée d'un anneau fin. Le logo HOMI n'est ni redessiné
 * ni recomposé (HOMI_BRAND.md) : Aura a son propre signe, de la même famille.
 * Décoratif pour les lecteurs d'écran : le nom « HOMI Aura » est toujours écrit à côté.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { ICON_FILL, ICON_STROKE } from '@/brand/icons';
import { useTheme } from '@/theme/ThemeProvider';

/** Bulle arrondie (même rayon que les pictogrammes HOMI) et éclat. */
export const AURA_BUBBLE = 'M4.25 9.25A4.75 4.75 0 0 1 9 4.5h4.5a4.75 4.75 0 0 1 4.75 4.75v2.5a4.75 4.75 0 0 1-4.75 4.75H10.2l-3.7 3v-3.55A4.75 4.75 0 0 1 4.25 11.75z';
export const AURA_SPARK = 'M18.6 2.6v3.1M17.05 4.15h3.1';
export const AURA_DOTS: [number, number, number][] = [[8.6, 10.5, 0.95], [11.25, 10.5, 0.95], [13.9, 10.5, 0.95]];

export function AuraGlyph({ size = 24, color, tone, active = false }: { size?: number; color?: string; tone?: string | null; active?: boolean }) {
  const t = useTheme();
  const ink = color ?? t.colors.text;
  const plate = tone === undefined ? t.colors.primary : tone;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
      {plate ? <Path d={AURA_BUBBLE} fill={plate} fillOpacity={active ? ICON_FILL.active : ICON_FILL.inactive} /> : null}
      <Path d={`${AURA_BUBBLE}${AURA_SPARK}`} fill="none" stroke={ink} strokeWidth={ICON_STROKE} strokeLinecap="round" strokeLinejoin="round" />
      {AURA_DOTS.map(([cx, cy, r]) => <Circle key={cx} cx={cx} cy={cy} r={r} fill={ink} />)}
    </Svg>
  );
}

/** Avatar d'Aura : pastille ronde teintée + anneau fin (couleurs du thème). */
export function AuraAvatar({ size = 40, testID }: { size?: number; testID?: string }) {
  const t = useTheme();
  return (
    <View testID={testID} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.colors.accentSoft, borderWidth: 1.5, borderColor: t.colors.lavender, alignItems: 'center', justifyContent: 'center' }}>
      <AuraGlyph size={Math.round(size * 0.62)} active />
    </View>
  );
}
