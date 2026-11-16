/**
 * Logo HOMI v5 « encre » animé (16/11/2026) — le logo de la propriétaire (symbole « M » formé de deux personnes +
 * mot-symbole « HOMI »), animé comme UN SEUL objet, sobrement et vite (≤ 1,4 s), sur une seule horloge sur le fil UI
 * (Reanimated 4 + react-native-svg ; chorégraphie : src/brand/logoMotion.ts) :
 *  1. le corps « M » MONTE du sol (fenêtre qui se lève + légère montée) ;
 *  2. les deux têtes se POSENT sur le corps avec un léger ressort (chignon d'abord) ;
 *  3. « HOMI » se révèle de gauche à droite ; le point du i se pose en dernier (même ressort) ;
 *  4. (facultatif, `deployTo`) le symbole s'ouvre en premier panneau de verre (rectangle arrondi qui grandit jusqu'au
 *     panneau cible ; un seul tracé SVG animé, exception documentée).
 * Composition : l'assemblage officiel (`logoBox`, homi-logo-encre.svg). Image finale = `BrandStack`. Encre en clair,
 * ivoire en sombre ; transform et opacité uniquement (pièces = sous-tracés exacts de la source).
 *
 * Niveaux (`useMotion`) :
 *  - 'full'    : séquence complète ;
 *  - 'minimal' : nuit — logo complet en fondu court, panneau en fondu (aucun déplacement) ;
 *  - 'off'     : Réduire les animations / économie d'énergie — ÉTAT FINAL (logo complet, panneau posé), simple fondu
 *                d'opacité de 180 ms ; `onHousePanel` et `onDone` appelés tout de suite.
 * Version FIXE : `still` ou largeur < 120 px → `BrandStack`.
 *
 * Retour vers JS : `onHousePanel` (alias `onLensPanel`) une seule fois — au début du déploiement, ou quand le logo
 * est complet s'il n'y a pas de panneau cible —, `onDone` une seule fois (fin de l'horloge interne) ; via
 * scheduleOnRN, jamais à chaque image. `cancelAnimation` au démontage.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation, Easing, ReduceMotion, useAnimatedProps, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { G, Path } from 'react-native-svg';
import { HOMI_INK, HOMI_LOCKUP, HOMI_PARTS, type HomiPart } from '@/brand/homiMarkSvg';
import {
  backOut, houseMeasureAt, housePanelFrame, housePanelPath, LOGO_MOTION, lockupToPx, logoBox, logoTimeline, stageProgress,
  type Box, type HouseMeasure, type HousePanelTarget, type LogoTimeline, type Stage,
} from '@/brand/logoMotion';
import { BRAND } from '@/config/brand';
import { curves } from '@/motion/curves';
import { useMotion } from '@/motion/useMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { BrandStack } from './BrandLogo';

export type { HouseMeasure, HousePanelTarget, LensMeasure, LensPanelTarget } from '@/brand/logoMotion';

export type HomiLogoAnimatedProps = {
  /** Largeur du logo complet (px) ; hauteur : `logoBox(width).height` (≈ 0,31 × largeur). */
  width: number;
  /** 'light' = encre (fond clair) | 'dark' = ivoire (fond sombre) ; défaut : thème. */
  tone?: 'light' | 'dark';
  /** Version fixe forcée (petits formats). */
  still?: boolean;
  /** Horloge externe (ms) : l'appelant la pilote et synchronise d'autres éléments (intro de lancement). */
  clock?: SharedValue<number>;
  /** Chorégraphie (défaut : `logoTimeline(niveau, !!deployTo)`). */
  timeline?: LogoTimeline;
  /** Panneau cible (coordonnées FENÊTRE) : le symbole s'y déploie. */
  deployTo?: HousePanelTarget;
  /** Avancement 0 → 1 du déploiement, écrit par le logo sur le fil UI (pour enchaîner d'autres éléments). */
  panel?: SharedValue<number>;
  /** Le symbole s'ouvre (une fois) : sa mesure FENÊTRE (nom historique) et panneau cible (null sans `deployTo`). */
  onHousePanel?: (house: HouseMeasure, target: HousePanelTarget | null) => void;
  /** Alias rétro-compatible de `onHousePanel` (logotype « lentille » v4). */
  onLensPanel?: (house: HouseMeasure, target: HousePanelTarget | null) => void;
  /** Fin de la séquence (horloge interne uniquement), une fois. */
  onDone?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Mesure du symbole dans la fenêtre (pure, testée). `lensMeasureAt` : alias rétro-compatible. */
export { houseMeasureAt };
export const lensMeasureAt = houseMeasureAt;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const NEVER = ReduceMotion.Never;
const VB = HOMI_LOCKUP.viewBox.join(' ');
const SYMBOL_T = `translate(${HOMI_LOCKUP.symbol.x} ${HOMI_LOCKUP.symbol.y}) scale(${HOMI_LOCKUP.symbol.scale})`;
const WORD_T = `translate(${HOMI_LOCKUP.word.x} ${HOMI_LOCKUP.word.y})`;

export function HomiLogoAnimated(props: HomiLogoAnimatedProps) {
  const { width, still, testID = 'homi-logo' } = props;
  const theme = useTheme();
  const m = useMotion();
  const tone = props.tone ?? (theme.isDark ? 'dark' : 'light');
  if (still || width < LOGO_MOTION.staticMaxWidth) return <StaticLogo {...props} tone={tone} testID={testID} />;
  if (m.off) return <ReducedLogo {...props} tone={tone} testID={testID} />;
  return <LiveLogo {...props} tone={tone} level={m.minimal ? 'minimal' : 'full'} testID={testID} />;
}

type Inner = HomiLogoAnimatedProps & { tone: 'light' | 'dark'; testID: string };

/** Les deux noms du rappel (un seul appel par ouverture, même si les deux sont fournis avec la même fonction). */
function useOpenCallback(p: Inner) {
  const { onHousePanel, onLensPanel } = p;
  return useCallback((house: HouseMeasure, target: HousePanelTarget | null) => {
    onHousePanel?.(house, target);
    if (onLensPanel && onLensPanel !== onHousePanel) onLensPanel(house, target);
  }, [onHousePanel, onLensPanel]);
}

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

/** Version fixe : logo complet, sans mouvement. */
function StaticLogo({ width, tone, style, testID, onDone }: Inner) {
  useEffect(() => { onDone?.(); }, [onDone]);
  return <BrandStack width={width} tone={tone} style={style} testID={`${testID}-static`} />;
}

/**
 * Réduire les animations : état final immédiat (logo complet, panneau posé), fondu d'opacité court.
 * Rappels appelés tout de suite (aucune attente imposée).
 */
function ReducedLogo(p: Inner) {
  const { width, tone, style, testID, deployTo, panel, onDone } = p;
  const box = logoBox(width);
  const fade = useSharedValue(0);
  const { ref, origin, onLayout } = useWindowOrigin();
  const open = useOpenCallback(p);
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
    open(houseMeasureAt(origin, width), deployTo ?? null);
  }, [origin, width, deployTo, open]);
  const s = useAnimatedStyle(() => ({ opacity: fade.value }));
  return (
    <Animated.View ref={ref} onLayout={onLayout} testID={testID} style={[{ width, height: box.height }, style, s]} accessible accessibilityRole="header" accessibilityLabel={BRAND.name}>
      {deployTo && origin ? <PanelLayer origin={origin} house={houseMeasureAt(origin, width)} target={deployTo} progress={null} moving={false} /> : null}
      <View testID={`${testID}-final`} style={StyleSheet.absoluteFill} accessible={false} importantForAccessibility="no-hide-descendants">
        <BrandStack width={width} tone={tone} decorative />
      </View>
    </Animated.View>
  );
}


function LiveLogo(p: Inner & { level: 'full' | 'minimal' }) {
  const { width, tone, style, testID, level, deployTo, onDone } = p;
  const box = logoBox(width);
  const own = useSharedValue(0);
  const clock = p.clock ?? own;
  const tl: LogoTimeline = p.timeline ?? logoTimeline(level, !!deployTo);
  const { ref, origin, onLayout } = useWindowOrigin();
  const moving = level === 'full';

  // Horloge interne (sauf horloge externe) : linéaire, chaque pièce applique sa courbe à son étape
  const finish = useCallback(() => onDone?.(), [onDone]);
  useEffect(() => {
    if (p.clock) return;
    own.value = 0;
    own.value = withTiming(tl.end, { duration: Math.max(1, tl.end), easing: Easing.linear, reduceMotion: NEVER }, (f) => {
      'worklet';
      if (f) scheduleOnRN(finish);
    });
    return () => cancelAnimation(own);
  }, [p.clock, own, tl.end, finish]);

  // Le symbole s'ouvre : un seul retour vers JS (sa mesure), jamais à chaque image
  const open = useOpenCallback(p);
  const houseRef = useRef<HouseMeasure | null>(null);
  houseRef.current = origin ? houseMeasureAt(origin, width) : null;
  const fired = useRef(false);
  const fireOpen = useCallback(() => {
    if (fired.current) return;
    fired.current = true;
    open(houseRef.current ?? houseMeasureAt({ x: 0, y: 0 }, width), deployTo ?? null);
  }, [open, deployTo, width]);
  const openAt = tl.deploy ? tl.deploy[0] : tl.open;
  const deployStage = tl.deploy;
  const panel = p.panel;
  useAnimatedReaction(
    () => clock.value,
    (now, prev) => {
      if (panel && deployStage) panel.value = stageProgress(now, deployStage);
      if (now >= openAt && (prev === null || prev < openAt)) scheduleOnRN(fireOpen);
    },
  );

  // fondu d'ensemble (nuit) ; légère mise en place 0,97 → 1 pendant la construction (autour du centre)
  const settle: Stage = [tl.body[0], Math.max(0, tl.open - tl.body[0])];
  const whole = useAnimatedStyle(() => {
    const s = moving ? LOGO_MOTION.settleFromScale + (1 - LOGO_MOTION.settleFromScale) * curves.decelerate(stageProgress(clock.value, settle)) : 1;
    return { opacity: curves.standard(stageProgress(clock.value, tl.fadeIn)), transform: [{ scale: s }] };
  });

  const ink = HOMI_INK[tone];
  const housePanel = deployTo && origin && tl.deploy ? { house: houseMeasureAt(origin, width), target: deployTo } : null;
  return (
    <Animated.View
      ref={ref}
      onLayout={onLayout}
      testID={testID}
      style={[{ width, height: box.height }, style]}
      accessible
      accessibilityRole="header"
      accessibilityLabel={BRAND.name}
    >
      {housePanel ? <PanelLayer origin={origin!} house={housePanel.house} target={housePanel.target} progress={{ clock, stage: tl.deploy! }} moving={moving} /> : null}
      <Animated.View style={[StyleSheet.absoluteFill, whole]} accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {/* 1. le corps « M » monte du sol */}
        <Wipe testID={`${testID}-body`} part={HOMI_PARTS.body} transform={SYMBOL_T} axis="up" box={box} clock={clock} stage={tl.body} rise={LOGO_MOTION.bodyRise} moving={moving} ink={ink} />
        {/* 2. les deux têtes se posent (chignon d'abord) */}
        <Pop testID={`${testID}-head-0`} part={HOMI_PARTS.headA} transform={SYMBOL_T} box={box} clock={clock} stage={tl.heads[0]} drop={LOGO_MOTION.headDrop} moving={moving} ink={ink} />
        <Pop testID={`${testID}-head-1`} part={HOMI_PARTS.headB} transform={SYMBOL_T} box={box} clock={clock} stage={tl.heads[1]} drop={LOGO_MOTION.headDrop} moving={moving} ink={ink} />
        {/* 3. « HOMI » se révèle, puis le point du i se pose */}
        <Wipe testID={`${testID}-name`} part={HOMI_PARTS.letters} transform={WORD_T} axis="right" box={box} clock={clock} stage={tl.word} rise={LOGO_MOTION.wordRise} moving={moving} ink={ink} />
        <Pop testID={`${testID}-dot`} part={HOMI_PARTS.dot} transform={WORD_T} box={box} clock={clock} stage={tl.dot} drop={0} moving={moving} ink={ink} />
      </Animated.View>
    </Animated.View>
  );
}

type LogoGeometry = ReturnType<typeof logoBox>;
type PartProps = { part: HomiPart; transform: string; box: LogoGeometry; clock: SharedValue<number>; stage: Stage; moving: boolean; ink: string; testID: string };

/** Une pièce du logo, dessinée dans le cadre du logo complet et replacée sous l'origine `at` (px). */
function PartSvg({ part, transform, box, at, ink }: { part: HomiPart; transform: string; box: LogoGeometry; at: Box; ink: string }) {
  return (
    <Svg width={box.width} height={box.height} viewBox={VB} style={{ position: 'absolute', left: -at.left, top: -at.top }}>
      <G transform={transform}><Path d={part.d} fill={ink} /></G>
    </Svg>
  );
}

/** Marge (px) autour de la fenêtre d'une pièce : l'anticrénelage du bord n'est jamais rogné. */
const EDGE = 2;
const padded = (b: Box): Box => ({ left: b.left - EDGE, top: b.top - EDGE, width: b.width + 2 * EDGE, height: b.height + 2 * EDGE });

/**
 * Révélation par fenêtre (transform uniquement) : la fenêtre glisse (vers le haut : le corps monte du sol ; vers la
 * droite : le nom se lit), le contenu glisse en sens inverse — il reste en place, à une légère montée près. Nuit : fondu.
 */
function Wipe({ part, transform, box, clock, stage, moving, ink, testID, axis, rise }: PartProps & { axis: 'up' | 'right'; rise: number }) {
  const b = padded(lockupToPx(part.box, box.scale));
  const up = axis === 'up';
  const span = up ? b.height : b.width;
  const lift = rise * part.box.height * box.scale;
  const win = useAnimatedStyle(() => {
    const r = moving ? curves.decelerate(stageProgress(clock.value, stage)) : 1;
    const o = (1 - r) * span;
    return { transform: up ? [{ translateY: o }] : [{ translateX: -o }] };
  });
  const content = useAnimatedStyle(() => {
    const raw = stageProgress(clock.value, stage);
    const r = moving ? curves.decelerate(raw) : 1;
    const o = (1 - r) * span;
    return {
      opacity: moving ? Math.min(1, raw * 3) : raw,
      transform: up ? [{ translateY: -o + lift * (1 - r) }] : [{ translateX: o }, { translateY: lift * (1 - r) }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: b.left, top: b.top, width: b.width, height: b.height, overflow: 'hidden' }, win]}>
      <Animated.View testID={testID} style={[{ width: b.width, height: b.height }, content]}>
        <PartSvg part={part} transform={transform} box={box} at={b} ink={ink} />
      </Animated.View>
    </Animated.View>
  );
}

/** Pièce ronde qui se pose (têtes, point du i) : tombe de `drop` × sa hauteur, grandit autour de son centre, léger ressort. */
function Pop({ part, transform, box, clock, stage, moving, ink, testID, drop }: PartProps & { drop: number }) {
  const b = padded(lockupToPx(part.box, box.scale));
  const style = useAnimatedStyle(() => {
    const p = stageProgress(clock.value, stage);
    if (!moving) return { opacity: p };
    const e = backOut(p);
    const s = LOGO_MOTION.headFromScale + (1 - LOGO_MOTION.headFromScale) * e;
    return { opacity: Math.min(1, p * 3), transform: [{ translateY: -drop * b.height * (1 - e) }, { scale: s }] };
  });
  return (
    <Animated.View testID={testID} pointerEvents="none" style={[{ position: 'absolute', left: b.left, top: b.top, width: b.width, height: b.height }, style]}>
      <PartSvg part={part} transform={transform} box={box} at={b} ink={ink} />
    </Animated.View>
  );
}

/**
 * Panneau issu du symbole : un seul tracé SVG (rectangle arrondi qui grandit), en coordonnées de fenêtre (calque plein
 * écran replacé sous l'origine du logo), dessiné SOUS le logo — il sort de derrière le symbole, déjà en verre.
 * `progress` null : panneau posé (état final). `moving` false (nuit) : forme finale en fondu, sans déplacement.
 */
function PanelLayer({ origin, house, target, progress, moving }: {
  origin: { x: number; y: number };
  house: HouseMeasure;
  target: HousePanelTarget;
  progress: { clock: SharedValue<number>; stage: Stage } | null;
  moving: boolean;
}) {
  const win = useWindowDimensions();
  const clock = progress?.clock;
  const stage = progress?.stage ?? ([0, 0] as const);
  const glass = useAnimatedProps(() => {
    const raw = clock ? stageProgress(clock.value, stage) : 1;
    const q = moving ? curves.decelerate(raw) : 1;
    return { d: housePanelPath(housePanelFrame(house, target, q)), opacity: moving ? Math.min(1, raw * 3) : curves.standard(raw) };
  });
  const start = housePanelPath(housePanelFrame(house, target, 1));
  return (
    <View
      testID="homi-house-panel"
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', left: -origin.x, top: -origin.y, width: win.width, height: win.height }}
    >
      <Svg width={win.width} height={win.height}>
        <AnimatedPath animatedProps={glass} d={start} fill={target.fill} stroke={target.edge ?? 'none'} strokeWidth={target.edge ? 1 : 0} />
      </Svg>
    </View>
  );
}
