/**
 * MaternityIcon — « Au Fil de Nous — Iconography System ».
 *
 * Pictogrammes originaux au fil continu (voir maternityPaths.ts et MATERNITY_ICONOGRAPHY_SYSTEM.md) :
 *  - grille 24 × 24, trait 1,6 à l'échelle, extrémités et jonctions arrondies, aucun texte ;
 *  - `active` : trait renforcé (2) et formes fermées remplies d'une teinte légère ;
 *  - `label` : si fourni, l'icône est une image annoncée avec ce libellé ; sinon elle est masquée aux lecteurs
 *    d'écran (décorative : le texte voisin porte le sens) ;
 *  - `animate` : le fil se dessine une fois à l'apparition (strokeDasharray / strokeDashoffset animés avec
 *    `Animated`) ; « réduire les animations » → état final immédiat. Pas de Reanimated.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AnimatedPath } from '@/components/MotionKit';
import { easing } from '@/theme/motion';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { pathLength } from './geometry';
import { MATERNITY_ICONS, type MaternityIconName } from './maternityPaths';

export type { MaternityIconName } from './maternityPaths';

/** Jetons du système (exportés pour les tests et la documentation). */
export const ICON_TOKENS = {
  grid: 24,
  stroke: 1.6,
  activeStroke: 2,
  tintOpacity: 0.2,
  mutedOpacity: 0.4,
  drawMs: 720,
  drawStaggerMs: 70,
} as const;

export interface MaternityIconProps {
  name: MaternityIconName;
  /** Taille en points (défaut 24). */
  size?: number;
  /** Couleur du trait (défaut : couleur principale du thème, le cuivre doré du fil). */
  color?: string;
  /** État actif / sélectionné : trait renforcé et formes remplies d'une teinte légère. */
  active?: boolean;
  /** Libellé pour les lecteurs d'écran. Absent → icône décorative, masquée. */
  label?: string;
  /** Le fil se dessine une fois à l'apparition (ignoré si « réduire les animations »). */
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const lengths = new Map<string, number>();
/** Longueur mémorisée d'un tracé (+ 1 pour couvrir les extrémités arrondies). */
export function strokeLength(d: string): number {
  let L = lengths.get(d);
  if (L == null) { L = Math.ceil(pathLength(d)) + 1; lengths.set(d, L); }
  return L;
}

export function MaternityIcon({ name, size = 24, color, active = false, label, animate = false, style, testID }: MaternityIconProps) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const c = color ?? t.colors.primary;
  const strokes = MATERNITY_ICONS[name] ?? [];
  const sw = active ? ICON_TOKENS.activeStroke : ICON_TOKENS.stroke;

  // Animation du tracé : une valeur 0 → 1 par élément (décalées), jouée une seule fois au montage.
  const play = animate && !reduce;
  const progress = useRef(strokes.map(() => new Animated.Value(play ? 0 : 1))).current;
  const [drawing, setDrawing] = useState(play);
  useEffect(() => {
    if (!play) { progress.forEach((v) => v.setValue(1)); setDrawing(false); return; }
    const anim = Animated.stagger(ICON_TOKENS.drawStaggerMs, progress.map((v) => Animated.timing(v, {
      toValue: 1, duration: ICON_TOKENS.drawMs, easing: easing.reveal, useNativeDriver: false, isInteraction: false,
    })));
    anim.start(({ finished }) => { if (finished) setDrawing(false); });
    return () => anim.stop();
    // jouée une seule fois à l'apparition (le nom ne change pas l'animation déjà jouée)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);

  const a11y = label
    ? { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: label }
    : { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

  const fills = useMemo(() => strokes.map((s) => {
    if (s.fill === 'solid') return { fill: c, fillOpacity: 1 };
    if (s.fill === 'tint' && active) return { fill: c, fillOpacity: ICON_TOKENS.tintOpacity };
    return { fill: 'none', fillOpacity: 1 };
  }), [strokes, c, active]);

  return (
    <View testID={testID} style={[{ width: size, height: size }, style]} {...a11y}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {strokes.map((s, i) => {
          const common = {
            d: s.d, stroke: c, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
            opacity: s.muted ? ICON_TOKENS.mutedOpacity : 1, ...fills[i],
          };
          if (!drawing) return <Path key={i} {...common} />;
          const L = strokeLength(s.d);
          return (
            <AnimatedPath
              key={i}
              {...common}
              // pendant le tracé, les remplissages apparaissent avec le fil
              fillOpacity={progress[i].interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, fills[i].fillOpacity] })}
              strokeDasharray={`${L} ${L}`}
              strokeDashoffset={progress[i].interpolate({ inputRange: [0, 1], outputRange: [L, 0] })}
            />
          );
        })}
      </Svg>
    </View>
  );
}
