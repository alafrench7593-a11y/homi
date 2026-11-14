/**
 * Logotype HOMI animé, comme UN SEUL objet (Reanimated 4 + react-native-svg), une seule horloge sur le fil UI :
 *  1. un reflet balaie le mot et le RÉVÈLE (fenêtre qui glisse + contre-glissement du contenu : transform seulement) ;
 *  2. la lentille du O prend du VOLUME (verre à plat → verre en volume : opacité + échelle autour du centre, halo bref) ;
 *  3. (facultatif, `deployTo`) la lentille se DÉPLOIE en premier panneau de l'introduction : un seul rectangle SVG
 *     animé du disque de la lentille au panneau cible (exception documentée, comme le tracé d'un contour).
 * Image finale = `BrandWordmark` (mêmes calques, mêmes dégradés : src/brand/homiMarkSvg.ts).
 *
 * Niveaux (`useMotion`) :
 *  - 'full'    : séquence complète (src/brand/logoMotion.ts) ;
 *  - 'minimal' : nuit — logo complet en fondu court, panneau en fondu (aucun déplacement) ;
 *  - 'off'     : Réduire les animations / économie d'énergie — ÉTAT FINAL (mot, lentille en volume, panneau posé),
 *                simple fondu d'opacité de 180 ms ; `onLensPanel` et `onDone` appelés tout de suite.
 * Version FIXE : `still` ou largeur < 120 px → `BrandWordmark` (aucun reflet ni volume en petit format).
 *
 * Retour vers JS : `onLensPanel` une seule fois (au début du déploiement), `onDone` une seule fois (fin de l'horloge
 * interne) — via scheduleOnRN, jamais à chaque image. `cancelAnimation` au démontage.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation, Easing, ReduceMotion, useAnimatedProps, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop, SvgXml } from 'react-native-svg';
import { HOMI_LAYER_SVG, HOMI_LENS, HOMI_WORD } from '@/brand/homiMarkSvg';
import {
  LOGO_MOTION, lensPanelFrame, logoTimeline, stageProgress,
  type LensMeasure, type LensPanelTarget, type LogoTimeline,
} from '@/brand/logoMotion';
import { BRAND } from '@/config/brand';
import { curves } from '@/motion/curves';
import { useMotion } from '@/motion/useMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { BrandWordmark, WORDMARK_RATIO } from './BrandLogo';

export type HomiLogoAnimatedProps = {
  /** Largeur du mot-symbole (px) ; hauteur = largeur / 3. */
  width: number;
  /** 'light' (fond clair) | 'dark' (fond sombre) ; défaut : thème. */
  tone?: 'light' | 'dark';
  /** Version fixe forcée (petits formats). */
  still?: boolean;
  /** Horloge externe (ms) : l'appelant la pilote et synchronise d'autres éléments (intro de lancement). */
  clock?: SharedValue<number>;
  /** Chorégraphie (défaut : `logoTimeline(niveau, !!deployTo)`). */
  timeline?: LogoTimeline;
  /** Panneau cible (coordonnées FENÊTRE) : la lentille s'y déploie. */
  deployTo?: LensPanelTarget;
  /** Avancement 0 → 1 du déploiement, écrit par le logo sur le fil UI (pour enchaîner d'autres éléments). */
  panel?: SharedValue<number>;
  /** Début du déploiement (une fois) : mesure de la lentille (fenêtre) et panneau cible. */
  onLensPanel?: (lens: LensMeasure, target: LensPanelTarget | null) => void;
  /** Fin de la séquence (horloge interne uniquement), une fois. */
  onDone?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Mesure de la lentille (fenêtre) à partir de l'origine du logo et de sa largeur (pure, testée). */
export function lensMeasureAt(origin: { x: number; y: number }, width: number): LensMeasure {
  const k = width / HOMI_WORD.width;
  const r = HOMI_LENS.r * k;
  const cx = origin.x + HOMI_LENS.cx * k;
  const cy = origin.y + HOMI_LENS.cy * k;
  return { x: cx - r, y: cy - r, width: 2 * r, height: 2 * r, cx, cy, r };
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const NEVER = ReduceMotion.Never;

export function HomiLogoAnimated(props: HomiLogoAnimatedProps) {
  const { width, still, style, testID = 'homi-logo' } = props;
  const theme = useTheme();
  const m = useMotion();
  const tone = props.tone ?? (theme.isDark ? 'dark' : 'light');
  const height = Math.round(width / WORDMARK_RATIO);
  if (still || width < LOGO_MOTION.staticMaxWidth) {
    return <StaticLogo {...props} tone={tone} height={height} testID={testID} />;
  }
  if (m.off) return <ReducedLogo {...props} tone={tone} height={height} testID={testID} style={style} />;
  return <LiveLogo {...props} tone={tone} height={height} level={m.minimal ? 'minimal' : 'full'} testID={testID} />;
}

type Inner = HomiLogoAnimatedProps & { tone: 'light' | 'dark'; height: number; testID: string };

/**
 * Origine du logo dans la fenêtre : d'abord la position de mise en page (immédiate), puis la mesure exacte dans la
 * fenêtre (`measureInWindow`, asynchrone) qui la remplace.
 */
function useWindowOrigin() {
  const ref = useRef<View>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const l = e?.nativeEvent?.layout;
    setOrigin((prev) => prev ?? { x: l?.x ?? 0, y: l?.y ?? 0 });
    const node = ref.current as unknown as { measureInWindow?: (cb: (x: number, y: number) => void) => void } | null;
    node?.measureInWindow?.((x, y) => { if (Number.isFinite(x) && Number.isFinite(y)) setOrigin({ x, y }); });
  }, []);
  return { ref, origin, onLayout };
}

/** Version fixe : le mot-symbole, sans mouvement. */
function StaticLogo({ height, tone, style, testID, onDone }: Inner) {
  useEffect(() => { onDone?.(); }, [onDone]);
  return <BrandWordmark height={height} tone={tone} style={style} testID={`${testID}-static`} />;
}

/**
 * Réduire les animations : état final immédiat (mot, lentille en volume, panneau posé), fondu d'opacité court.
 * Rappels appelés tout de suite (aucune attente imposée).
 */
function ReducedLogo({ width, height, tone, style, testID, deployTo, panel, onLensPanel, onDone }: Inner) {
  const fade = useSharedValue(0);
  const { ref, origin, onLayout } = useWindowOrigin();
  const called = useRef(false);
  useEffect(() => {
    fade.value = withTiming(1, { duration: LOGO_MOTION.reducedFadeMs, easing: Easing.linear, reduceMotion: NEVER });
    if (panel) panel.value = 1;
    onDone?.();
    return () => cancelAnimation(fade);
    // une seule fois par montage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!origin || called.current) return;
    called.current = true;
    onLensPanel?.(lensMeasureAt(origin, width), deployTo ?? null);
  }, [origin, width, deployTo, onLensPanel]);
  const s = useAnimatedStyle(() => ({ opacity: fade.value }));
  return (
    <Animated.View ref={ref} onLayout={onLayout} testID={testID} style={[{ width, height }, style, s]} accessible accessibilityRole="header" accessibilityLabel={BRAND.name}>
      {deployTo && origin ? <PanelLayer origin={origin} lens={lensMeasureAt(origin, width)} target={deployTo} progress={null} moving={false} /> : null}
      <View testID={`${testID}-final`} style={StyleSheet.absoluteFill} accessible={false} importantForAccessibility="no-hide-descendants">
        <SvgXml xml={HOMI_LAYER_SVG[tone].letters} width={width} height={height} />
        <View style={StyleSheet.absoluteFill}><SvgXml xml={HOMI_LAYER_SVG[tone].lens} width={width} height={height} /></View>
      </View>
    </Animated.View>
  );
}

function LiveLogo(p: Inner & { level: 'full' | 'minimal' }) {
  const { width, height, tone, style, testID, level, deployTo, onLensPanel, onDone } = p;
  const own = useSharedValue(0);
  const clock = p.clock ?? own;
  const tl = p.timeline ?? logoTimeline(level, !!deployTo);
  const { ref, origin, onLayout } = useWindowOrigin();
  const moving = level === 'full';

  // Horloge interne (sauf horloge externe) : linéaire, chaque calque applique sa courbe à son étape
  const finish = useCallback(() => onDone?.(), [onDone]);
  useEffect(() => {
    if (p.clock) return;
    own.value = 0;
    own.value = withTiming(tl.end, { duration: tl.end, easing: Easing.linear, reduceMotion: NEVER }, (f) => {
      'worklet';
      if (f) scheduleOnRN(finish);
    });
    return () => cancelAnimation(own);
  }, [p.clock, own, tl.end, finish]);

  // Début du déploiement : un seul retour vers JS (mesure de la lentille), jamais à chaque image
  const lensRef = useRef<LensMeasure | null>(null);
  lensRef.current = origin ? lensMeasureAt(origin, width) : null;
  const fired = useRef(false);
  const fireLensPanel = useCallback(() => {
    if (fired.current) return;
    fired.current = true;
    onLensPanel?.(lensRef.current ?? lensMeasureAt({ x: 0, y: 0 }, width), deployTo ?? null);
  }, [onLensPanel, deployTo, width]);
  const deployAt = tl.deploy ? tl.deploy[0] : -1;
  const panel = p.panel;
  useAnimatedReaction(
    () => clock.value,
    (now, prev) => {
      if (deployAt < 0) return;
      if (panel) panel.value = tl.deploy ? stageProgress(now, tl.deploy) : 0;
      if (now >= deployAt && (prev === null || prev < deployAt)) scheduleOnRN(fireLensPanel);
    },
  );

  // 0. fondu d'ensemble (nuit)
  const whole = useAnimatedStyle(() => ({ opacity: curves.standard(stageProgress(clock.value, tl.fadeIn)) }));
  // 1. fenêtre de révélation : glisse de −largeur à 0 ; le contenu contre-glisse (aucune propriété de mise en page)
  const windowStyle = useAnimatedStyle(() => {
    const r = curves.reveal(stageProgress(clock.value, tl.reveal));
    return { transform: [{ translateX: (r - 1) * width }] };
  });
  const contentStyle = useAnimatedStyle(() => {
    const r = curves.reveal(stageProgress(clock.value, tl.reveal));
    return { transform: [{ translateX: (1 - r) * width }] };
  });
  // bande de reflet au bord de la fenêtre : visible pendant le balayage seulement (cloche d'opacité)
  const band = Math.round(width * LOGO_MOTION.sheenWidth);
  const sheenStyle = useAnimatedStyle(() => {
    const raw = stageProgress(clock.value, tl.reveal);
    const r = curves.reveal(raw);
    const bell = raw <= 0 || raw >= 1 ? 0 : Math.sin(Math.PI * Math.min(1, raw * 1.15));
    return { opacity: bell, transform: [{ translateX: r * (width + band) - band * 0.75 }, { skewX: `${LOGO_MOTION.sheenSkewDeg}deg` }] };
  });
  // 2. volume de la lentille : opacité + échelle autour du centre (translation équivalente, portable)
  const k = width / HOMI_WORD.width;
  const ox = HOMI_LENS.cx * k - width / 2;
  const oy = HOMI_LENS.cy * k - height / 2;
  const lensStyle = useAnimatedStyle(() => {
    const v = curves.decelerate(stageProgress(clock.value, tl.lens));
    const s = LOGO_MOTION.lensFromScale + (1 - LOGO_MOTION.lensFromScale) * v;
    return { opacity: v, transform: [{ translateX: ox * (1 - s) }, { translateY: oy * (1 - s) }, { scale: s }] };
  });
  const haloStyle = useAnimatedStyle(() => {
    const q = stageProgress(clock.value, tl.lens);
    const bell = q <= 0 || q >= 1 ? 0 : q < 0.4 ? curves.decelerate(q / 0.4) : 1 - curves.standard((q - 0.4) / 0.6);
    return { opacity: LOGO_MOTION.lensHaloPeak * bell, transform: [{ scale: 0.8 + 0.5 * q }] };
  });

  const halo = Math.round(HOMI_LENS.r * k * 3.2);
  const layers = HOMI_LAYER_SVG[tone];
  // reflet : blanc au cœur, teinté lilas (clair) ou bleu brume (sombre) sur les bords
  const sheenPeak = tone === 'dark' ? 0.6 : 0.95;
  const sheenTint = tone === 'dark' ? '#C9D6E8' : '#E4DCFF';
  const lensPanel = deployTo && origin && tl.deploy ? { lens: lensMeasureAt(origin, width), target: deployTo } : null;
  return (
    <Animated.View
      ref={ref}
      onLayout={onLayout}
      testID={testID}
      style={[{ width, height }, style, whole]}
      accessible
      accessibilityRole="header"
      accessibilityLabel={BRAND.name}
    >
      {lensPanel ? <PanelLayer origin={origin!} lens={lensPanel.lens} target={lensPanel.target} progress={{ clock, stage: tl.deploy! }} moving={moving} /> : null}
      <View style={StyleSheet.absoluteFill} accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {/* halo bref derrière la lentille */}
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: HOMI_LENS.cx * k - halo / 2, top: HOMI_LENS.cy * k - halo / 2, width: halo, height: halo }, haloStyle]}>
          <Svg width={halo} height={halo} viewBox="0 0 100 100">
            <Defs>
              <RadialGradient id={`hla-${tone}`} cx="0.5" cy="0.5" r="0.5">
                <Stop offset="0" stopColor={tone === 'dark' ? '#C9D6E8' : '#B4C6E2'} stopOpacity={0.9} />
                <Stop offset="0.55" stopColor={tone === 'dark' ? '#CFC4FF' : '#C9BEF5'} stopOpacity={0.25} />
                <Stop offset="1" stopColor="#C9BEF5" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={50} cy={50} r={50} fill={`url(#hla-${tone})`} />
          </Svg>
        </Animated.View>
        {/* 1. le mot, révélé par la fenêtre ; la lentille y est encore « à plat » */}
        <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, windowStyle]}>
          <Animated.View style={[StyleSheet.absoluteFill, contentStyle]}>
            <SvgXml xml={layers.letters} width={width} height={height} />
            <View style={StyleSheet.absoluteFill}><SvgXml xml={layers.lensFlat} width={width} height={height} /></View>
          </Animated.View>
        </Animated.View>
        {/* 2. la lentille en volume (image finale = mot-symbole exact) */}
        <Animated.View testID={`${testID}-lens`} style={[StyleSheet.absoluteFill, lensStyle]}>
          <SvgXml xml={layers.lens} width={width} height={height} />
        </Animated.View>
        {/* reflet : bande de lumière inclinée qui précède le bord de la fenêtre */}
        {moving ? (
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: -height * 0.2, height: height * 1.4, width: band, left: 0 }, sheenStyle]}>
            {/* ellipse de lumière (bords doux de tous côtés : aucune arête visible sur le fond) */}
            <Svg width={band} height={height * 1.4} viewBox="0 0 100 100" preserveAspectRatio="none">
              <Defs>
                <RadialGradient id={`hls-${tone}`} cx="0.5" cy="0.5" r="0.5">
                  <Stop offset="0" stopColor="#FFFFFF" stopOpacity={sheenPeak} />
                  <Stop offset="0.45" stopColor={sheenTint} stopOpacity={sheenPeak * 0.45} />
                  <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect x={0} y={0} width={100} height={100} fill={`url(#hls-${tone})`} />
            </Svg>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

/**
 * Panneau issu de la lentille : un seul rectangle SVG, en coordonnées de fenêtre (calque plein écran replacé sous
 * l'origine du logo), dessiné SOUS les lettres — il sort de derrière le O.
 * `progress` null : panneau posé (état final). `moving` false (nuit) : rectangle final en fondu, sans déplacement.
 */
function PanelLayer({ origin, lens, target, progress, moving }: {
  origin: { x: number; y: number };
  lens: LensMeasure;
  target: LensPanelTarget;
  progress: { clock: SharedValue<number>; stage: readonly [number, number] } | null;
  moving: boolean;
}) {
  const win = useWindowDimensions();
  const clock = progress?.clock;
  const stage = progress?.stage ?? ([0, 0] as const);
  const animated = useAnimatedProps(() => {
    const raw = clock ? stageProgress(clock.value, stage) : 1;
    const q = moving ? curves.decelerate(raw) : 1;
    const f = lensPanelFrame(lens, target, q);
    // la lumière quitte la lentille : opacité qui monte sur le premier tiers (fondu seul la nuit)
    const o = moving ? Math.min(1, raw * 3) : curves.standard(raw);
    return { x: f.x, y: f.y, width: f.width, height: f.height, rx: f.rx, ry: f.rx, opacity: o };
  });
  return (
    <View
      testID="homi-lens-panel"
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', left: -origin.x, top: -origin.y, width: win.width, height: win.height }}
    >
      <Svg width={win.width} height={win.height}>
        <AnimatedRect
          animatedProps={animated}
          x={target.x}
          y={target.y}
          width={target.width}
          height={target.height}
          rx={target.radius}
          fill={target.fill}
          stroke={target.edge ?? 'none'}
          strokeWidth={target.edge ? 1 : 0}
        />
      </Svg>
    </View>
  );
}
