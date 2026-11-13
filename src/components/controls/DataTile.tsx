/**
 * DataTile — tuile de résultat (référence « tableau de mesures sombre ») : valeur GRANDE et FINE + unité + contexte
 * (période), sur une surface MATE aux coins très généreux que la couleur semble éclairer DE L'INTÉRIEUR (dégradé
 * radial interne teinté par la palette ou par une teinte sémantique). Micrographique fin OPTIONNEL : seulement si
 * `series` contient au moins deux valeurs réelles (aucune donnée inventée). État vide explicite (`value` nul).
 * Appuyable : transition carte → détail (`morphId` + `onPress` → `MorphSource`), sinon simple tuile.
 *
 * Accessibilité : un seul nom lisible (« Sommeil : 7,5 heures, cette semaine ») ; le micrographique est décoratif
 * (sa tendance est donnée par `trendLabel` si fourni). Contraste du texte sur la lumière interne testé (contrast.test.ts).
 */
import React from 'react';
import { Platform, Pressable, StyleSheet, Text as RNText, View, type StyleProp, type ViewStyle } from 'react-native';
import { useFontScale } from '@/theme/fontScale';
import Svg, { Defs, LinearGradient as SvgLinear, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, innerLight, radius as R, spacing, surfaceShadow, typography, type Theme } from '@/theme/tokens';
import { usePressScale } from '@/motion/PressableScale';
import { MorphSource } from '@/motion/Morph';

export type TileTint = 'accent' | 'accent2' | 'success' | 'warning' | 'danger' | 'info';

export function tileTint(t: Theme, tint: TileTint): string {
  if (tint === 'accent') return t.tokens.accent.glow[0];
  if (tint === 'accent2') return t.tokens.accent.glow[1];
  return t.tokens.status[tint];
}
/** Couleur de texte de la valeur selon la teinte (lisible : encre de la palette ou du statut). */
const valueInk = (t: Theme, tint: TileTint) => (tint === 'accent' ? t.colors.text : tint === 'accent2' ? t.colors.text : t.tokens.status[tint]);

/** Points finis du micrographique (aucun point inventé) ; `null` s'il y en a moins de deux. */
export function sparkPoints(series: (number | null | undefined)[] | undefined, w: number, h: number, pad = 2): [number, number][] | null {
  const vals = (series ?? []).map((v, i) => [i, v] as const).filter((p): p is readonly [number, number] => typeof p[1] === 'number' && Number.isFinite(p[1]));
  if (vals.length < 2) return null;
  const n = (series ?? []).length;
  const ys = vals.map((p) => p[1]);
  const min = Math.min(...ys); const max = Math.max(...ys);
  const span = max - min || 1;
  return vals.map(([i, v]) => [pad + (i / Math.max(1, n - 1)) * (w - pad * 2), h - pad - ((v - min) / span) * (h - pad * 2)]);
}

export function Sparkline({ series, color, width = 120, height = 26 }: { series: (number | null | undefined)[]; color: string; width?: number; height?: number }) {
  const pts = sparkPoints(series, width, height);
  const id = React.useId().replace(/:/g, '');
  if (!pts) return null;
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${height} L${pts[0][0].toFixed(1)} ${height} Z`;
  const last = pts[pts.length - 1];
  return (
    <Svg width={width} height={height} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="sparkline">
      <Defs>
        <SvgLinear id={`sa${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.22" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </SvgLinear>
      </Defs>
      <Path d={area} fill={`url(#sa${id})`} />
      <Path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={last[0] - 2} y={last[1] - 2} width={4} height={4} rx={2} fill={color} />
    </Svg>
  );
}

export interface DataTileProps {
  label: string;
  /** Valeur déjà formatée (locale) ; nulle → état vide */
  value: string | number | null | undefined;
  unit?: string;
  /** Contexte : période (« cette semaine »), comparaison… */
  context?: string;
  /**
   * Lignes du contexte (défaut 3). Au-delà, le texte est volontairement abrégé (« … ») et reste lu en entier par
   * les lecteurs d'écran (libellé de la tuile) ; `0` = jamais abrégé. Texte agrandi : +1 ligne automatiquement.
   */
  contextLines?: number;
  icon?: React.ComponentProps<typeof Feather>['name'];
  tint?: TileTint;
  /** Valeurs réelles pour le micrographique (≥ 2 valeurs finies, sinon rien n'est dessiné) */
  series?: (number | null | undefined)[];
  /** Tendance dite aux lecteurs d'écran (le micrographique est décoratif) */
  trendLabel?: string;
  /** Texte de l'état vide (aucune donnée) */
  emptyText?: string;
  onPress?: () => void;
  /** Identifiant de transition carte → détail (avec `onPress`) */
  morphId?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function DataTile({ label, value, unit, context, contextLines = 3, icon, tint = 'accent', series, trendLabel, emptyText, onPress, morphId, style, testID }: DataTileProps) {
  const t = useTheme();
  const fontScale = useFontScale();
  const ctxLines = contextLines > 0 ? contextLines + (fontScale > 1.15 ? 1 : 0) : undefined;
  const id = React.useId().replace(/:/g, '');
  const color = tileTint(t, tint);
  const light = innerLight(t, color);
  const empty = value === null || value === undefined || value === '';
  const s = t.material.surfaces.matte;
  const a11y = empty ? `${label} : ${emptyText ?? '—'}` : [`${label} : ${value}${unit ? ` ${unit}` : ''}`, context, trendLabel].filter(Boolean).join(', ');
  const press = usePressScale({ scale: 0.98, haptic: 'none' });
  const body = (
    <View testID={onPress ? undefined : testID} style={[{ borderRadius: R.tile, overflow: 'hidden', backgroundColor: s.fill, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: s.edge, padding: spacing.md, minHeight: 132, gap: 6, boxShadow: surfaceShadow(t, 'matte') }, onPress ? null : style]}
      accessible={!onPress} accessibilityLabel={onPress ? undefined : a11y}>
      {/* lumière intérieure : foyer radial dans le coin haut gauche */}
      {light.opacity > 0 && !empty ? (
        <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%" testID="tile-light">
          <Defs>
            <RadialGradient id={`il${id}`} cx="18%" cy="8%" rx="95%" ry="85%">
              <Stop offset="0" stopColor={light.color} stopOpacity={light.opacity} />
              <Stop offset="1" stopColor={light.color} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#il${id})`} />
        </Svg>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon ? <Feather name={icon} size={15} color={empty ? t.colors.textMuted : valueInk(t, tint) === t.colors.text ? t.colors.primary : color} /> : null}
        <RNText maxFontSizeMultiplier={1.4} {...(Platform.OS === 'web' ? ({ dataSet: { fsmax: '1.4' } } as object) : null)} style={{ flex: 1, color: t.colors.textMuted, fontFamily: fonts.bodyMedium, fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight }}>{label}</RNText>
      </View>
      {empty ? (
        <View style={{ flex: 1, justifyContent: 'flex-end', gap: 2 }} testID="tile-empty">
          <RNText style={{ color: t.colors.textMuted, fontFamily: fonts.displayItalic, fontSize: 30, lineHeight: 36 }} maxFontSizeMultiplier={1.2}>—</RNText>
          <RNText maxFontSizeMultiplier={1.5} style={{ color: t.colors.textMuted, fontFamily: fonts.body, fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight }}>{emptyText ?? '—'}</RNText>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
            {/* chiffre grand et fin (Space Grotesk 500), chiffres tabulaires */}
            <RNText maxFontSizeMultiplier={1.25} numberOfLines={1} adjustsFontSizeToFit style={{ color: valueInk(t, tint), fontFamily: fonts.displayItalic, fontSize: 40, lineHeight: 46, letterSpacing: -1.6, fontVariant: ['tabular-nums'] }}>{String(value)}</RNText>
            {unit ? <RNText maxFontSizeMultiplier={1.4} style={{ color: t.colors.textMuted, fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 20 }}>{unit}</RNText> : null}
          </View>
          {/* micrographique (au-dessus) puis contexte : jamais l'un ne coupe l'autre, même dans une tuile étroite */}
          <View style={{ gap: 4, marginTop: 'auto' }}>
            {series ? <Sparkline series={series} color={color} /> : null}
            {context ? <RNText maxFontSizeMultiplier={1.5} numberOfLines={ctxLines} {...(Platform.OS === 'web' ? ({ dataSet: { fsmax: '1.5', truncate: 'intentional' } } as object) : null)} style={{ color: t.colors.textMuted, fontFamily: fonts.body, fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight }}>{context}</RNText> : null}
          </View>
        </>
      )}
    </View>
  );
  if (!onPress) return body;
  if (morphId) {
    return (
      <MorphSource id={morphId} onOpen={onPress} radius={R.tile} tint={color} accessibilityLabel={a11y} testID={testID} style={style}>
        {body}
      </MorphSource>
    );
  }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} testID={testID} onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut} style={style}>
      <Animated.View style={press.style}>{body}</Animated.View>
    </Pressable>
  );
}
