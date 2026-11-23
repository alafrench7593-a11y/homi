/**
 * Scène de donnée (direction « Whoop / Keynote » demandée par la propriétaire, 22/11/2026) : un panneau sombre en verre
 * dense, posé sur la page même en thème clair, qui porte UNE donnée en très grand (chiffres de largeur fixe), un anneau
 * de progression tiré de la donnée réelle (jamais un score inventé), une étiquette en capitales espacées et l'action.
 *
 *  - Matériau : fond « inverse » du thème (graphite ou nuit selon la palette), voile dégradé, liseré spéculaire en haut,
 *    reflet doux — plus dense sous les chiffres (consigne PDF p. 18) ; jamais de flou imbriqué.
 *  - Mouvement (Keynote) : à l'arrivée et à chaque changement de valeur, le chiffre monte en fondu et l'anneau balaie
 *    jusqu'à sa valeur ; « Réduire les animations » → état final immédiat.
 *  - Accessibilité : la scène est lue comme une seule phrase (`a11y`), l'anneau est décoratif ; une sélection reste
 *    lisible sans couleur (le libellé porte l'information).
 */
import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { BLUR_OK, LIQUID_GLASS_NATIVE, NativeGlass, useReduceTransparency } from '@/components/surfaces/nativeGlass';
import Svg, { Circle } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Text } from '@/components/ui';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { alpha, fonts, radius, spacing } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
/** L'anneau part de midi (le tracé SVG part de 3 h). */
const RING_START: ViewStyle = { transform: [{ rotate: '-90deg' }] };

export interface StageHeroProps {
  /** Étiquette en capitales espacées (« SIESTE · EN COURS »). */
  eyebrow: string;
  /** LA donnée (« 42:18 », « 1 h 25 », « 150 ml »). */
  value: string;
  /** Unité ou période juste dessous (« Depuis 13 h 10 »). */
  caption?: string | null;
  /** Ligne de contexte factuelle (fenêtre indicative, comparaison). */
  detail?: string | null;
  /** 0–1 : part réelle (ex. minutes écoulées / borne haute de la fenêtre). `null` : pas d'anneau. */
  progress?: number | null;
  /** Texte au centre de l'anneau (« 63 % » n'est permis que s'il vient de la donnée ; sinon une unité courte). */
  ringLabel?: string | null;
  /** Phrase lue par les lecteurs d'écran pour toute la donnée. */
  a11y: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Taille du chiffre (par défaut 64). */
  size?: number;
}

export function StageHero({ eyebrow, value, caption, detail, progress = null, ringLabel, a11y, children, style, testID, size = 64 }: StageHeroProps) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const inv = t.tokens.inverse;
  const accent = inv.accent;
  const enter = useSharedValue(reduce ? 1 : 0);
  const ring = useSharedValue(reduce ? (progress ?? 0) : 0);
  const R = 34; const C = 2 * Math.PI * R;
  // avec l'anneau, le chiffre partage la ligne : taille plafonnée pour ne jamais être tronqué (« 1 h 25 » à 320 pt)
  const fs = progress != null ? Math.min(size, 52) : size;

  // Keynote : entrée du chiffre à l'arrivée et à chaque nouvelle valeur « de fond » (pas à chaque seconde d'un minuteur)
  const settled = value.replace(/\d/g, '0');
  useEffect(() => {
    if (reduce) { enter.value = 1; return; }
    enter.value = 0; enter.value = withTiming(1, { duration: 620, easing: EASE });
  }, [settled, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const target = Math.max(0, Math.min(1, progress ?? 0));
    ring.value = reduce ? target : withDelay(120, withTiming(target, { duration: 900, easing: EASE }));
  }, [progress, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  const numStyle = useAnimatedStyle(() => ({ opacity: enter.value, transform: [{ translateY: (1 - enter.value) * 14 }, { scale: 0.94 + enter.value * 0.06 }] }));
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: C * (1 - ring.value) }));

  const fg = t.colors.text; const muted = t.colors.textMuted; const ink = t.colors.primary;
  return (
    <View testID={testID} accessible accessibilityLabel={a11y} style={[{ borderRadius: radius.xl }, style]}>
      {/* Fond ambiant SOUS le verre : deux halos tirés de l'accent du thème. Sans quelque chose derrière, un verre clair
          est invisible ; c'est ce que le Liquid Glass d'iOS réfracte (fond d'écran, contenu). */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.xl, overflow: 'hidden' }]}>
        <LinearGradient colors={[alpha(ink, 0.55), alpha(ink, 0)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', width: '70%', aspectRatio: 1, borderRadius: 999, left: '-12%', top: '-45%' }} />
        <LinearGradient colors={[alpha(inv.accent, 0), alpha(inv.accent, 0.5)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', width: '60%', aspectRatio: 1, borderRadius: 999, right: '-15%', bottom: '-55%' }} />
      </View>
      <ClearGlass radius={radius.xl}>
        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <Text variant="caption" weight="bold" color={muted} style={{ letterSpacing: 1.6 }} numberOfLines={1}>{eyebrow.toUpperCase()}</Text>
              <Animated.View style={numStyle}>
                <Text maxFontSizeMultiplier={1.25} numberOfLines={1} adjustsFontSizeToFit testID={testID ? `${testID}-value` : undefined}
                  style={{ fontSize: fs, lineHeight: Math.round(fs * 1.08), letterSpacing: -fs * 0.03, fontFamily: fonts.display, color: fg, fontVariant: ['tabular-nums'] }}>{value}</Text>
              </Animated.View>
              {caption ? <Text variant="small" color={muted} style={{ fontVariant: ['tabular-nums'] }} testID={testID ? `${testID}-caption` : undefined}>{caption}</Text> : null}
            </View>
            {progress != null ? (
              <View style={{ width: 84, height: 84, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Svg width={84} height={84} viewBox="0 0 84 84" style={[StyleSheet.absoluteFill, RING_START]}>
                  <Circle cx={42} cy={42} r={R} stroke={alpha(fg, 0.1)} strokeWidth={7} fill="none" />
                  <AnimatedCircle cx={42} cy={42} r={R} stroke={ink} strokeWidth={7} fill="none" strokeLinecap="round"
                    strokeDasharray={`${C} ${C}`} animatedProps={ringProps} />
                </Svg>
                {ringLabel ? <Text variant="caption" weight="bold" color={fg} style={{ fontVariant: ['tabular-nums'] }}>{ringLabel}</Text> : null}
              </View>
            ) : null}
          </View>
          {detail ? <Text variant="small" weight="medium" color={fg} testID={testID ? `${testID}-detail` : undefined}>{detail}</Text> : null}
          {children ? <View style={{ marginTop: spacing.xs, gap: spacing.xs }}>{children}</View> : null}
        </View>
      </ClearGlass>
    </View>
  );
}

/**
 * Liquid Glass CLAIR, façon iOS 26 : verre natif « clear » quand il existe ; ailleurs, flou léger + voile très fin (on
 * voit ce qu'il y a derrière), liseré lumineux en haut, reflet spéculaire, ombre interne au bas du bord, ombre portée
 * douce. « Réduire la transparence » : surface pleine du thème, même liseré.
 */
export function ClearGlass({ radius: r, children, style }: { radius: number; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const opaque = useReduceTransparency();
  const light = t.tokens.inverse.text; // reflets : toujours clairs, quel que soit le thème
  const Native = !opaque && LIQUID_GLASS_NATIVE ? NativeGlass : null;
  const native = !!Native;
  return (
    <View style={[{ borderRadius: r, overflow: 'hidden', backgroundColor: opaque || !(native || BLUR_OK) ? t.colors.surface : 'transparent',
      boxShadow: `0 20px 44px ${alpha(t.tokens.shadowColor, 0.18)}, inset 0 1px 0 ${alpha(light, t.isDark ? 0.28 : 0.9)}, inset 0 -1px 0 ${alpha(light, t.isDark ? 0.08 : 0.35)}` } as ViewStyle, style]}>
      {Native ? (
        <Native pointerEvents="none" style={StyleSheet.absoluteFill} glassEffectStyle="clear" colorScheme={t.isDark ? 'dark' : 'light'} />
      ) : !opaque && BLUR_OK ? (
        <>
          <BlurView pointerEvents="none" intensity={28} tint={t.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: alpha(t.colors.surface, t.isDark ? 0.18 : 0.32) }]} />
        </>
      ) : null}
      {/* reflet spéculaire (haut-gauche → transparent) et lueur de bord */}
      <LinearGradient pointerEvents="none" colors={[alpha(light, t.isDark ? 0.16 : 0.55), alpha(light, 0)]} locations={[0, 0.42]} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, borderWidth: 1, borderColor: alpha(light, t.isDark ? 0.18 : 0.7) }]} />
      {children}
    </View>
  );
}

/**
 * Matériau « Liquid Glass sombre » partagé (scènes de donnée, panneau Aura) : verre natif iOS 26, sinon flou + voile
 * graphite ; rien (le fond opaque du conteneur) si « Réduire la transparence ». À poser en premier enfant d'un conteneur
 * à coins arrondis, `overflow: 'hidden'`, fond `darkGlassBase(...)`.
 */
export function DarkGlassMaterial() {
  const t = useTheme();
  const inv = t.tokens.inverse;
  const opaque = useReduceTransparency();
  return (
    <>
        {/* Liquid Glass sombre : verre natif (iOS 26), sinon flou + voile graphite ; opaque si « Réduire la transparence » */}
        {!opaque && LIQUID_GLASS_NATIVE && NativeGlass ? (
          <NativeGlass pointerEvents="none" style={StyleSheet.absoluteFill} glassEffectStyle="regular" colorScheme="dark" tintColor={alpha(inv.fill, 0.72)} />
        ) : !opaque && BLUR_OK ? (
          <>
            <BlurView pointerEvents="none" intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: alpha(inv.fill, 0.8) }]} />
          </>
        ) : null}
    </>
  );
}

/** Fond du conteneur : opaque si le verre n'est pas disponible ou si la transparence est réduite. */
export function useDarkGlassBase(): string {
  const t = useTheme();
  const opaque = useReduceTransparency();
  return opaque || !(LIQUID_GLASS_NATIVE || BLUR_OK) ? t.tokens.inverse.fill : 'transparent';
}
