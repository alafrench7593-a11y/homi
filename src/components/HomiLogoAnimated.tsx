/**
 * Logo HOMI v5 « maison » animé — FULL MOTION, comme UN SEUL objet (Reanimated 4 + react-native-svg), une seule
 * horloge sur le fil UI (chorégraphie : src/brand/logoMotion.ts) :
 *  1. le contour de la maison se TRACE, un reflet court sur le bord (tête du tracé, puis un demi-tour qui s'éteint) ;
 *  2. la maison S'ILLUMINE : remplissage violet, halo qui s'allume puis retombe ;
 *  3. les silhouettes apparaissent en cascade — parent, parent, enfant, enfant — avec un léger rebond ;
 *  4. le nom HOMI se révèle dans la lumière (fenêtre qui glisse + reflet qui le traverse) ;
 *  5. (facultatif, `deployTo`) la maison se DÉPLOIE en premier panneau de verre : le toit s'aplatit, la forme grandit
 *     du dessin de la maison au panneau cible (un seul tracé SVG animé, exception documentée).
 * Composition (`logoBox`) : maison centrée en haut (62 % de la largeur), nom dessous. Image finale = `BrandStack`.
 *
 * Niveaux (`useMotion`) :
 *  - 'full'    : séquence complète ;
 *  - 'minimal' : nuit — logo complet en fondu court, panneau en fondu (aucun déplacement) ;
 *  - 'off'     : Réduire les animations / économie d'énergie — ÉTAT FINAL (maison, famille, nom, panneau posé),
 *                simple fondu d'opacité de 180 ms ; `onHousePanel` et `onDone` appelés tout de suite.
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
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import {
  HOMI_COLORS, HOMI_FAMILY, HOMI_FAMILY_SPAN, HOMI_HOUSE_BOX, HOMI_HOUSE_LENGTH, HOMI_HOUSE_PATH, HOMI_HOUSE_RIM, HOMI_HOUSE_STROKE, HOMI_VIEWBOX,
} from '@/brand/homiMarkSvg';
import {
  backOut, houseMeasureAt, housePanelFrame, housePanelPath, LOGO_MOTION, logoBox, logoTimeline, stageProgress,
  type HouseMeasure, type HousePanelTarget, type LogoTimeline, type Stage,
} from '@/brand/logoMotion';
import { BRAND } from '@/config/brand';
import { curves } from '@/motion/curves';
import { useMotion } from '@/motion/useMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { BrandName, BrandStack } from './BrandLogo';

export type { HouseMeasure, HousePanelTarget, LensMeasure, LensPanelTarget } from '@/brand/logoMotion';

export type HomiLogoAnimatedProps = {
  /** Largeur du logo (px) : maison = 62 % de la largeur, nom dessous (hauteur : `logoBox(width).height`). */
  width: number;
  /** 'light' (fond clair) | 'dark' (fond sombre) ; défaut : thème. */
  tone?: 'light' | 'dark';
  /** Version fixe forcée (petits formats). */
  still?: boolean;
  /** Horloge externe (ms) : l'appelant la pilote et synchronise d'autres éléments (intro de lancement). */
  clock?: SharedValue<number>;
  /** Chorégraphie (défaut : `logoTimeline(niveau, !!deployTo)`). */
  timeline?: LogoTimeline;
  /** Panneau cible (coordonnées FENÊTRE) : la maison s'y déploie. */
  deployTo?: HousePanelTarget;
  /** Avancement 0 → 1 du déploiement, écrit par le logo sur le fil UI (pour enchaîner d'autres éléments). */
  panel?: SharedValue<number>;
  /** La maison s'ouvre (une fois) : mesure FENÊTRE de la maison et panneau cible (null sans `deployTo`). */
  onHousePanel?: (house: HouseMeasure, target: HousePanelTarget | null) => void;
  /** Alias rétro-compatible de `onHousePanel` (logotype « lentille » v4). */
  onLensPanel?: (house: HouseMeasure, target: HousePanelTarget | null) => void;
  /** Fin de la séquence (horloge interne uniquement), une fois. */
  onDone?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Mesure de la maison dans la fenêtre (pure, testée). `lensMeasureAt` : alias rétro-compatible. */
export { houseMeasureAt };
export const lensMeasureAt = houseMeasureAt;

const AnimatedPath = Animated.createAnimatedComponent(Path);
/** Dégradés en coordonnées du dessin (carré de 256), comme dans le logo fixe. */
const USER_SPACE = 'userSpaceOnUse' as const;
const NEVER = ReduceMotion.Never;
const VB = `0 0 ${HOMI_VIEWBOX} ${HOMI_VIEWBOX}`;
const L = HOMI_HOUSE_LENGTH;

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

/** Version fixe : maison + nom, sans mouvement. */
function StaticLogo({ width, tone, style, testID, onDone }: Inner) {
  useEffect(() => { onDone?.(); }, [onDone]);
  return <BrandStack width={width} tone={tone} style={style} testID={`${testID}-static`} />;
}

/**
 * Réduire les animations : état final immédiat (maison, famille, nom, panneau posé), fondu d'opacité court.
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
      {deployTo && origin ? <PanelLayer origin={origin} house={houseMeasureAt(origin, width)} target={deployTo} tone={tone} progress={null} moving={false} /> : null}
      <View testID={`${testID}-final`} style={StyleSheet.absoluteFill} accessible={false} importantForAccessibility="no-hide-descendants">
        <BrandStack width={width} tone={tone} decorative />
      </View>
    </Animated.View>
  );
}

function LiveLogo(p: Inner & { level: 'full' | 'minimal' }) {
  const { width, tone, style, testID, level, deployTo, onDone } = p;
  const box = logoBox(width);
  const S = box.house.size;
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
    own.value = withTiming(tl.end, { duration: Math.max(1, tl.end), easing: Easing.linear, reduceMotion: NEVER }, (f) => {
      'worklet';
      if (f) scheduleOnRN(finish);
    });
    return () => cancelAnimation(own);
  }, [p.clock, own, tl.end, finish]);

  // La maison s'ouvre : un seul retour vers JS (mesure de la maison), jamais à chaque image
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

  // 0. fondu d'ensemble (nuit) ; légère mise en place 0,94 → 1 pendant la construction (autour du centre de la maison)
  const lastFig = tl.figures[tl.figures.length - 1];
  const settle: Stage = [tl.trace[0], lastFig[0] + lastFig[1] - tl.trace[0]];
  const whole = useAnimatedStyle(() => ({ opacity: curves.standard(stageProgress(clock.value, tl.fadeIn)) }));
  const houseStyle = useAnimatedStyle(() => {
    const s = LOGO_MOTION.settleFromScale + (1 - LOGO_MOTION.settleFromScale) * curves.decelerate(stageProgress(clock.value, settle));
    return { transform: [{ scale: s }] };
  });
  // 2. illumination : remplissage + halo en cloche (retombe à 0 : image finale = logo fixe)
  const fillStyle = useAnimatedStyle(() => ({ opacity: curves.decelerate(stageProgress(clock.value, tl.light)) }));
  const haloStyle = useAnimatedStyle(() => {
    const q = stageProgress(clock.value, tl.halo);
    const bell = q <= 0 || q >= 1 ? 0 : q < 0.3 ? curves.decelerate(q / 0.3) : 1 - curves.standard((q - 0.3) / 0.7);
    return { opacity: LOGO_MOTION.haloPeak * bell, transform: [{ scale: 0.75 + 0.35 * curves.decelerate(q) }] };
  });
  // 4. nom : fenêtre qui glisse (contre-glissement du contenu), montée de 6 px, reflet qui traverse
  const nameWindow = useAnimatedStyle(() => {
    const r = curves.decelerate(stageProgress(clock.value, tl.name));
    return { transform: [{ translateX: (r - 1) * width }] };
  });
  const nameContent = useAnimatedStyle(() => {
    const raw = stageProgress(clock.value, tl.name);
    const r = curves.decelerate(raw);
    return { opacity: Math.min(1, raw * 3), transform: [{ translateX: (1 - r) * width }, { translateY: 6 * (1 - r) }] };
  });
  const band = Math.round(width * LOGO_MOTION.sheenWidth);
  const sheenStyle = useAnimatedStyle(() => {
    const raw = stageProgress(clock.value, tl.name);
    const bell = raw <= 0 || raw >= 1 ? 0 : Math.sin(Math.PI * raw);
    return { opacity: bell, transform: [{ translateX: curves.reveal(raw) * (width + band) - band }, { skewX: `${LOGO_MOTION.sheenSkewDeg}deg` }] };
  });

  const c = HOMI_COLORS[tone];
  const id = `hmA${tone[0]}`;
  const halo = Math.round(S * 1.7);
  const housePanel = deployTo && origin && tl.deploy ? { house: houseMeasureAt(origin, width), target: deployTo } : null;
  return (
    <Animated.View
      ref={ref}
      onLayout={onLayout}
      testID={testID}
      style={[{ width, height: box.height }, style, whole]}
      accessible
      accessibilityRole="header"
      accessibilityLabel={BRAND.name}
    >
      {housePanel ? <PanelLayer origin={origin!} house={housePanel.house} target={housePanel.target} tone={tone} progress={{ clock, stage: tl.deploy! }} moving={moving} /> : null}
      <View style={StyleSheet.absoluteFill} accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Animated.View testID={`${testID}-house`} style={[{ position: 'absolute', left: box.house.left, top: box.house.top, width: S, height: S }, houseStyle]}>
          {/* halo derrière la maison */}
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: (S - halo) / 2, top: (S - halo) / 2 + S * 0.04, width: halo, height: halo }, haloStyle]}>
            <Svg width={halo} height={halo} viewBox="0 0 100 100">
              <Defs>
                <RadialGradient id={`${id}-halo`} cx="0.5" cy="0.5" r="0.5">
                  <Stop offset="0" stopColor={c.glow} stopOpacity={0.95} />
                  <Stop offset="0.45" stopColor={c.halo} stopOpacity={0.35} />
                  <Stop offset="1" stopColor={c.halo} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={50} cy={50} r={50} fill={`url(#${id}-halo)`} />
            </Svg>
          </Animated.View>
          {/* 1a. liseré (clair) : tracé sous le remplissage, comme dans le logo fixe */}
          {c.rim ? <TraceLayer size={S} clock={clock} stage={tl.trace} stroke={c.rim} width={HOMI_HOUSE_RIM} /> : null}
          {/* 2. la maison s'illumine */}
          <Animated.View testID={`${testID}-fill`} style={[StyleSheet.absoluteFill, fillStyle]}>
            <Svg width={S} height={S} viewBox={VB}>
              <Defs>
                <LinearGradient id={`${id}-house`} gradientUnits={USER_SPACE} x1="0" y1={HOMI_HOUSE_BOX.y} x2="0" y2={HOMI_HOUSE_BOX.y + HOMI_HOUSE_BOX.height}>
                  <Stop offset="0" stopColor={c.houseTop} />
                  <Stop offset="1" stopColor={c.houseBottom} />
                </LinearGradient>
                <RadialGradient id={`${id}-glow`} gradientUnits={USER_SPACE} cx="128" cy="138" r="118">
                  <Stop offset="0" stopColor={c.glow} stopOpacity={0.38} />
                  <Stop offset="1" stopColor={c.glow} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Path d={HOMI_HOUSE_PATH} fill={`url(#${id}-house)`} />
              <Path d={HOMI_HOUSE_PATH} fill={`url(#${id}-glow)`} />
            </Svg>
          </Animated.View>
          {/* 1b. contour lumineux tracé + reflet qui court sur le bord */}
          <TraceLayer size={S} clock={clock} stage={tl.trace} gradient={{ id: `${id}-edge`, stops: c.edge }} width={HOMI_HOUSE_STROKE} />
          {moving ? <CometLayer size={S} clock={clock} trace={tl.trace} comet={tl.comet} tone={tone} /> : null}
          {/* 3. la famille : parent, parent, enfant, enfant */}
          {HOMI_FAMILY.map((_, i) => <Figure key={i} index={i} size={S} clock={clock} stage={tl.figures[i]} tone={tone} moving={moving} />)}
        </Animated.View>
        {/* 4. le nom, révélé dans la lumière */}
        <Animated.View style={[{ position: 'absolute', left: 0, top: box.name.top, width, height: box.name.line, overflow: 'hidden' }, nameWindow]}>
          <Animated.View testID={`${testID}-name`} style={[{ width, height: box.name.line, alignItems: 'center', justifyContent: 'center' }, nameContent]}>
            <BrandName size={box.name.size} line={box.name.line} tone={tone} />
          </Animated.View>
        </Animated.View>
        {moving ? (
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: box.name.top - box.name.line * 0.2, height: box.name.line * 1.4, width: band, left: 0 }, sheenStyle]}>
            <Svg width={band} height={box.name.line * 1.4} viewBox="0 0 100 100" preserveAspectRatio="none">
              <Defs>
                <RadialGradient id={`${id}-sheen`} cx="0.5" cy="0.5" r="0.5">
                  <Stop offset="0" stopColor="#FFFFFF" stopOpacity={tone === 'dark' ? 0.7 : 0.95} />
                  <Stop offset="0.45" stopColor={c.glow} stopOpacity={0.4} />
                  <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect x={0} y={0} width={100} height={100} fill={`url(#${id}-sheen)`} />
            </Svg>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

/** Contour tracé (strokeDashoffset d'un seul tracé, le « trait qui se dessine ») : couleur unie ou dégradé lumineux. */
function TraceLayer({ size, clock, stage, stroke, gradient, width }: {
  size: number; clock: SharedValue<number>; stage: Stage; stroke?: string; gradient?: { id: string; stops: readonly string[] }; width: number;
}) {
  const trace = useAnimatedProps(() => ({ strokeDashoffset: L * (1 - curves.reveal(stageProgress(clock.value, stage))) }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={size} height={size} viewBox={VB}>
        {gradient ? (
          <Defs>
            <LinearGradient id={gradient.id} gradientUnits={USER_SPACE} x1="32" y1="30" x2="224" y2="224">
              <Stop offset="0" stopColor={gradient.stops[0]} />
              <Stop offset="0.55" stopColor={gradient.stops[1]} />
              <Stop offset="1" stopColor={gradient.stops[2]} />
            </LinearGradient>
          </Defs>
        ) : null}
        <AnimatedPath
          d={HOMI_HOUSE_PATH}
          fill="none"
          stroke={gradient ? `url(#${gradient.id})` : stroke}
          strokeWidth={width}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={[L, L]}
          strokeDashoffset={L}
          animatedProps={trace}
        />
      </Svg>
    </View>
  );
}

/**
 * Reflet qui court sur le bord : un trait court (9 % du contour) — lueur large + cœur blanc — placé à la tête du
 * tracé, puis qui poursuit sa course (un demi-tour) en s'éteignant.
 */
function CometLayer({ size, clock, trace, comet, tone }: { size: number; clock: SharedValue<number>; trace: Stage; comet: Stage; tone: 'light' | 'dark' }) {
  const seg = L * LOGO_MOTION.cometDash;
  const traceEnd = trace[0] + trace[1];
  const run: Stage = [traceEnd, Math.max(1, comet[0] + comet[1] - traceEnd)];
  const head = (t: number) => {
    'worklet';
    if (t <= traceEnd) return L * curves.reveal(stageProgress(t, trace));
    return L + LOGO_MOTION.cometRunLaps * L * curves.decelerate(stageProgress(t, run));
  };
  const alpha = (t: number) => {
    'worklet';
    const on = Math.min(1, stageProgress(t, trace) * 10);
    const off = 1 - curves.standard(stageProgress(t, run));
    return t < trace[0] ? 0 : on * off;
  };
  const glow = useAnimatedProps(() => ({ strokeDashoffset: seg - head(clock.value), strokeOpacity: 0.5 * alpha(clock.value) }));
  const core = useAnimatedProps(() => ({ strokeDashoffset: seg - head(clock.value), strokeOpacity: alpha(clock.value) }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={size} height={size} viewBox={VB}>
        <AnimatedPath d={HOMI_HOUSE_PATH} fill="none" stroke={HOMI_COLORS[tone].glow} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={[seg, L - seg]} strokeDashoffset={seg} strokeOpacity={0} animatedProps={glow} />
        <AnimatedPath d={HOMI_HOUSE_PATH} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={[seg, L - seg]} strokeDashoffset={seg} strokeOpacity={0} animatedProps={core} />
      </Svg>
    </View>
  );
}

/** Une silhouette : monte et grandit autour de ses pieds avec un léger rebond (back-out), en fondu. Nuit : fondu seul. */
function Figure({ index, size, clock, stage, tone, moving }: { index: number; size: number; clock: SharedValue<number>; stage: Stage; tone: 'light' | 'dark'; moving: boolean }) {
  const f = HOMI_FAMILY[index];
  const k = size / HOMI_VIEWBOX;
  const style = useAnimatedStyle(() => {
    const p = stageProgress(clock.value, stage);
    if (!moving) return { opacity: p };
    const e = backOut(p);
    const s = LOGO_MOTION.figureFromScale + (1 - LOGO_MOTION.figureFromScale) * e;
    // échelle autour des pieds : translation équivalente (transform-origin non utilisé, portable)
    const ox = f.cx * k - size / 2;
    const oy = f.bottom * k - size / 2;
    return {
      opacity: Math.min(1, p * 2.5),
      transform: [{ translateX: ox * (1 - s) }, { translateY: oy * (1 - s) + LOGO_MOTION.figureRise * k * (1 - Math.min(1, e)) }, { scale: s }],
    };
  });
  const c = HOMI_COLORS[tone];
  const gid = `hmA${tone[0]}-fig-${index}`;
  return (
    <Animated.View testID={`homi-logo-figure-${index}`} style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox={VB}>
        <Defs>
          <LinearGradient id={gid} gradientUnits={USER_SPACE} x1="0" y1={HOMI_FAMILY_SPAN.top} x2="0" y2={HOMI_FAMILY_SPAN.bottom}>
            <Stop offset="0" stopColor={c.figTop} />
            <Stop offset="1" stopColor={c.figBottom} />
          </LinearGradient>
        </Defs>
        <G fill={`url(#${gid})`}>
          <Circle cx={f.cx} cy={f.headY} r={f.headR} />
          <Path d={f.bodyD} />
        </G>
      </Svg>
    </Animated.View>
  );
}

/**
 * Panneau issu de la maison : un seul tracé SVG (pignon → rectangle arrondi), en coordonnées de fenêtre (calque plein
 * écran replacé sous l'origine du logo), dessiné SOUS la maison — il sort de derrière elle. Il part violet (la maison)
 * et devient verre (matière du panneau cible).
 * `progress` null : panneau posé (état final). `moving` false (nuit) : forme finale en fondu, sans déplacement.
 */
function PanelLayer({ origin, house, target, tone, progress, moving }: {
  origin: { x: number; y: number };
  house: HouseMeasure;
  target: HousePanelTarget;
  tone: 'light' | 'dark';
  progress: { clock: SharedValue<number>; stage: Stage } | null;
  moving: boolean;
}) {
  const win = useWindowDimensions();
  const clock = progress?.clock;
  const stage = progress?.stage ?? ([0, 0] as const);
  const glass = useAnimatedProps(() => {
    const raw = clock ? stageProgress(clock.value, stage) : 1;
    const q = moving ? curves.decelerate(raw) : 1;
    return { d: housePanelPath(housePanelFrame(house, target, q)), opacity: moving ? Math.min(1, raw * 4) : curves.standard(raw) };
  });
  const tint = useAnimatedProps(() => {
    const raw = clock ? stageProgress(clock.value, stage) : 1;
    const q = moving ? curves.decelerate(raw) : 1;
    // la teinte violette de la maison s'efface pendant l'ouverture : le panneau devient verre
    return { d: housePanelPath(housePanelFrame(house, target, q)), opacity: moving && raw > 0 ? 0.9 * (1 - curves.standard(raw)) : 0 };
  });
  const c = HOMI_COLORS[tone];
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
        <AnimatedPath animatedProps={tint} d={start} fill={c.houseBottom} opacity={0} />
      </Svg>
    </View>
  );
}
