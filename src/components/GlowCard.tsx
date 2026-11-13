/**
 * Carte lumineuse HOMI v2 (référence « image 1 ») : carte sombre / verre aux grands coins, FILET LUMINEUX en dégradé
 * de la palette sur le contour et HALO diffus coloré derrière. Transposition React Native des idées « Shine Border »
 * et « Border Beam » de Magic UI (dégradé sur le contour + faisceau de lumière qui parcourt le bord) — aucun code web
 * repris : react-native-svg pour le filet, `boxShadow` coloré pour le halo, Reanimated pour le mouvement.
 *
 * À RÉSERVER à : la carte sélectionnée, une action importante, un moment de validation (un seul élément à la fois).
 * Les listes restent sobres : au repos (`active={false}`), contour statique discret, aucun halo, aucune animation.
 *
 * Mouvement (useMotion) quand la carte devient active :
 *  - halo : 0 → 1 en ressort « doux », échelle 0,97 → 1 (le halo « grandit » derrière la carte) ;
 *  - filet : fondu 240 ms du contour discret vers le dégradé ;
 *  - faisceau : une bande de lumière traverse la carte UNE fois (720 ms) — jamais en boucle.
 * 'off' → état final immédiat ; 'minimal' (nuit) → fondu court, sans faisceau ni halo (pas de lueur à 3 h).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, haloShadow, mixHex, physicalShadow, radius as R, spacing, type Theme } from '@/theme/tokens';
import { motionHaptic, useMotion, usePressScale } from '@/motion';

export const GLOW = { borderMs: 240, beamMs: 720, stroke: 1.5 } as const;
export type GlowEmphasis = 'selected' | 'action' | 'success';

/** Couleurs du filet selon l'usage : palette (sélection, action) ou succès (validation). */
export function glowColors(t: Theme, emphasis: GlowEmphasis = 'selected'): [string, string] {
  if (emphasis === 'success') return [t.tokens.status.success, t.tokens.accent.glow[0]];
  const [ga, gb] = t.tokens.accent.glow;
  // En clair, la lueur pure disparaît sur l'ivoire : on la mêle à l'encre de la palette
  return t.isDark ? [ga, gb] : [mixHex(ga, t.tokens.accent.accent, 0.45), mixHex(gb, t.tokens.accent.accent2, 0.45)];
}

export function GlowCard({
  children, active = false, emphasis = 'selected', onPress, style, contentStyle, radius = R.lg, padded = true, still,
  testID, accessibilityLabel, accessibilityHint, role = 'button',
}: {
  children: React.ReactNode;
  /** Carte sélectionnée / active : filet dégradé + halo. Au repos : contour statique discret. */
  active?: boolean;
  emphasis?: GlowEmphasis;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  padded?: boolean;
  /** Dans une liste : aucun mouvement (l'état s'affiche directement). */
  still?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** `radio` : élément d'un groupe à choix unique (sélecteur de palette) */
  role?: 'button' | 'radio';
}) {
  const t = useTheme();
  const m = useMotion();
  const night = t.name === 'night';
  const animate = m.level === 'full' && !still;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setSize((s) => (Math.abs(s.w - w) < 0.5 && Math.abs(s.h - h) < 0.5 ? s : { w, h }));
  };
  const halo = useSharedValue(active ? 1 : 0);
  const border = useSharedValue(active ? 1 : 0);
  const beam = useSharedValue(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (still || m.off) { halo.value = active ? 1 : 0; border.value = active ? 1 : 0; return; }
    border.value = m.timing(active ? 1 : 0, GLOW.borderMs, 'standard');
    halo.value = m.spring(active ? 1 : 0, 'doux');
    if (active && animate) {
      beam.value = 0;
      beam.value = m.timing(1, GLOW.beamMs, 'decelerate');
    }
  }, [active, still, animate, m, halo, border, beam]);
  useEffect(() => () => { cancelAnimation(halo); cancelAnimation(border); cancelAnimation(beam); }, [halo, border, beam]);

  const haloStyle = useAnimatedStyle(() => ({ opacity: halo.value, transform: [{ scale: 0.97 + 0.03 * halo.value }] }));
  const borderStyle = useAnimatedStyle(() => ({ opacity: border.value }));
  const bandW = Math.max(60, size.w * 0.35);
  const beamStyle = useAnimatedStyle(() => {
    const k = beam.value;
    return { opacity: k <= 0 || k >= 1 ? 0 : Math.sin(k * Math.PI) * 0.9, transform: [{ translateX: -bandW + (size.w + bandW * 2) * k }, { skewX: '-20deg' }] };
  });
  const press = usePressScale({ scale: 0.985, haptic: 'none' });

  const [c1, c2] = glowColors(t, emphasis);
  const gid = React.useId().replace(/:/g, '');
  const fill = t.isDark ? t.tokens.surface.card : t.tokens.surface.glassStrong;
  const card = (
    <View onLayout={onLayout} style={{ flexGrow: 1 }}>
      {/* Halo diffus coloré derrière le contour (deux lueurs décalées) */}
      {!night ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: t.colors.background, boxShadow: haloShadow(t, emphasis === 'action' ? 1.1 : 1) }, haloStyle]} />
      ) : null}
      <View style={[{ borderRadius: radius, overflow: 'hidden', backgroundColor: t.isDark ? mixHex(t.colors.background, '#FFFFFF', 0.035) : fill, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: t.tokens.border.rest },
        !night && { boxShadow: physicalShadow(active ? 'mid' : 'low', t.isDark) }]}>
        {t.isDark ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} /> : null}
        {/* Reflet intérieur haut (verre) */}
        {!night ? <LinearGradient pointerEvents="none" colors={[t.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFill} /> : null}
        {/* Lueur intérieure très douce de la palette quand la carte est active */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, borderStyle]}>
          <LinearGradient colors={[alpha(c1, t.isDark ? 0.1 : 0.08), alpha(c2, 0)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        {/* Faisceau (une seule traversée à l'activation) */}
        {animate && size.w > 0 ? (
          <Animated.View pointerEvents="none" testID="glow-beam" style={[{ position: 'absolute', top: -8, bottom: -8, left: 0, width: bandW }, beamStyle]}>
            <LinearGradient colors={['rgba(255,255,255,0)', alpha(t.isDark ? '#FFFFFF' : '#FFFFFF', t.isDark ? 0.08 : 0.35), 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        ) : null}
        <View style={[padded ? { padding: spacing.md } : null, contentStyle]}>{children}</View>
      </View>
      {/* Filet lumineux en dégradé sur le contour */}
      {size.w > 0 ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, borderStyle]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Svg width={size.w} height={size.h}>
            <Defs>
              <SvgGradient id={`g${gid}`} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={c1} />
                <Stop offset="0.55" stopColor={mixHex(c1, c2, 0.6)} />
                <Stop offset="1" stopColor={c2} />
              </SvgGradient>
            </Defs>
            <Rect x={GLOW.stroke / 2} y={GLOW.stroke / 2} width={Math.max(0, size.w - GLOW.stroke)} height={Math.max(0, size.h - GLOW.stroke)} rx={radius - GLOW.stroke / 2} ry={radius - GLOW.stroke / 2} fill="none" stroke={`url(#g${gid})`} strokeWidth={GLOW.stroke} />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
  // `style` s'applique au conteneur extérieur (grille, marges) ; la carte le remplit
  if (!onPress) return <View testID={testID} style={style}>{card}</View>;
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={role === 'radio' ? { checked: active, selected: active } : { selected: active }}
      aria-selected={role === 'radio' ? undefined : active}
      aria-checked={role === 'radio' ? active : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onPress={() => { motionHaptic('selection'); onPress(); }}
      style={style}
    >
      <Animated.View style={[{ flexGrow: 1 }, press.style]}>{card}</Animated.View>
    </Pressable>
  );
}
