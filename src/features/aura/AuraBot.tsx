/**
 * AURA, LE ROBOT COMPAGNON du chat d'Aura — dessiné en code (react-native-svg) et animé avec Reanimated.
 *
 * Personnage ORIGINAL de HOMI : un petit robot rond qui flotte. Dôme en coque blanc nacré, deux oreilles rondes rose
 * poudré, visière ovale bleu de nuit (l'identité d'Aura) tramée de points fins ; ses YEUX et sa BOUCHE sont des points
 * lumineux arrondis corail et ambre ; un cœur turquoise brille sur son torse en galet ; deux petits bras arrondis à
 * mains simples ; une lueur corail sous le corps et une ombre de contact au sol (il ne touche pas terre).
 * La signature `AuraOrb` (lentille) reste le signe d'Aura ailleurs dans l'application ; le robot est le personnage du chat.
 *
 * États (`state`) :
 *  - idle      : flotte doucement, cligne des yeux de temps en temps, le cœur pulse à peine ;
 *  - greet     : coucou d'un bras (une fois), yeux en arcs souriants ;
 *  - listening : tête penchée, yeux ronds attentifs qui suivent légèrement ;
 *  - thinking  : trois points défilent dans la visière, un anneau tourne autour du cœur, léger balancement ;
 *  - answer    : petit sursaut joyeux, yeux souriants (le hook `useAuraBot` revient ensuite au repos) ;
 *  - concern   : regard doux et inquiet, mains rapprochées, AUCUN sursaut (jamais joyeux sur un message de détresse).
 * « Réduire les animations », économie d'énergie, thème nuit ou `still` : pose STATIQUE de chaque état (mêmes
 * expressions, bras levé pour le coucou, tête penchée pour l'écoute), aucun mouvement continu.
 *
 * Lisible de 32 px (bulle) à 160 px (accueil) : sous 64 px, les points des yeux et de la bouche grossissent et se
 * rejoignent (formes pleines), la trame de la visière disparaît et le contour s'épaissit.
 * Accessibilité : décoratif par défaut (le texte voisin dit déjà l'état) ; `decorative={false}` → image nommée
 * (« Aura, ton assistante… » selon l'état). Couleurs : `auraBotPalette` (src/theme/auraBot.ts), aucune couleur en dur ici.
 */
import React, { useEffect, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { auraBotMotion as M, curves, springs, useMotion } from '@/motion';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { AURA_BOT, auraBotPalette, type AuraBotPalette } from '@/theme/auraBot';
import type { AuraBotState } from './useAuraBot';

export type { AuraBotState } from './useAuraBot';

/** Grille du dessin (120 × 120) et points remarquables. */
const VB = 120;
const C = VB / 2;
const EYE_L = 48;
const EYE_R = 72;
const EYE_Y = 47;
const NECK = { x: 60, y: 76 };
const HEART = { x: 60, y: 87 };
const SHOULDER_L = { x: 36, y: 84 };
const SHOULDER_R = { x: 84, y: 84 };
const SWAY_PIVOT = { x: 60, y: 104 };
/** Sous cette taille (px), dessin simplifié : points fondus en formes pleines, sans trame. */
const SMALL = 64;

type EyeKind = 'open' | 'round' | 'happy' | 'soft' | 'none';
type MouthKind = 'smile' | 'grin' | 'o' | 'flat' | 'worried';
export const AURA_BOT_FACES: Record<AuraBotState, { eyes: EyeKind; mouth: MouthKind; brows: boolean }> = {
  idle: { eyes: 'open', mouth: 'smile', brows: false },
  greet: { eyes: 'happy', mouth: 'grin', brows: false },
  listening: { eyes: 'round', mouth: 'o', brows: false },
  thinking: { eyes: 'none', mouth: 'flat', brows: false },
  answer: { eyes: 'happy', mouth: 'grin', brows: false },
  concern: { eyes: 'soft', mouth: 'worried', brows: true },
};

/** Point lumineux : x, y, rayon, teinte (c = corail, a = ambre, w = reflet blanc). */
type Dot = [number, number, number, 'c' | 'a' | 'w'];
const arc = (cx: number, cy: number, rad: number, from: number, to: number, n: number, r: number, mid: 'c' | 'a' = 'c'): Dot[] =>
  Array.from({ length: n }, (_, i) => {
    const a = ((from + ((to - from) * i) / (n - 1)) * Math.PI) / 180;
    return [cx + rad * Math.cos(a), cy + rad * Math.sin(a), r, i === (n - 1) / 2 ? mid : 'c'];
  });

function eyeDots(kind: EyeKind, x: number): Dot[] {
  const y = EYE_Y;
  switch (kind) {
    // trois points fondus en une pastille verticale (ambre en haut), petit reflet
    case 'open': return [[x, y - 3.7, 3, 'a'], [x, y, 3.2, 'c'], [x, y + 3.7, 3, 'c'], [x + 1.1, y - 4.4, 0.9, 'w']];
    // grand point rond attentif (iris ambre), reflet
    case 'round': return [[x, y, 5.3, 'c'], [x, y + 0.4, 2.9, 'a'], [x + 1.9, y - 2, 1.05, 'w']];
    // arcs souriants (∩) : yeux plissés de joie
    case 'happy': return arc(x, y + 3, 5.2, 200, 340, 5, 2.1, 'a');
    // regard doux, un peu baissé
    case 'soft': return [[x, y + 1.4, 2.7, 'a'], [x, y + 4.4, 2.7, 'c'], [x + 0.9, y + 0.6, 0.8, 'w']];
    default: return [];
  }
}

function mouthDots(kind: MouthKind): Dot[] {
  switch (kind) {
    case 'smile': return arc(60, 54.5, 6, 35, 145, 5, 1.9);
    case 'grin': return arc(60, 53, 7.6, 22, 158, 7, 2, 'a');
    case 'o': return [[60, 60, 2.6, 'c']];
    case 'flat': return [[55.4, 60.5, 1.6, 'c'], [60, 60.5, 1.6, 'c'], [64.6, 60.5, 1.6, 'c']];
    // légère inquiétude (arc à peine renversé), jamais une grimace
    case 'worried': return arc(60, 66, 6.5, 235, 305, 5, 1.7);
    default: return [];
  }
}

/** Sourcils de l'inquiétude : extrémités intérieures relevées. */
const brow = (x0: number, y0: number, x1: number, y1: number): Dot[] => Array.from({ length: 5 }, (_, i) => [x0 + ((x1 - x0) * i) / 4, y0 + ((y1 - y0) * i) / 4, 1.25, 'a']);
const BROWS: Dot[] = [...brow(EYE_L - 4.5, EYE_Y - 3.6, EYE_L + 3.5, EYE_Y - 6.6), ...brow(EYE_R + 4.5, EYE_Y - 3.6, EYE_R - 3.5, EYE_Y - 6.6)];

/** Trame de la visière (calculée une fois). */
const GRID: [number, number][] = [];
for (let y = 33; y <= 65; y += 4) for (let x = 36; x <= 84; x += 4) if (((x - 60) / 24.5) ** 2 + ((y - 49) / 16.5) ** 2 <= 1) GRID.push([x, y]);

/** Pose des bras (degrés, autour de l'épaule) par état. */
const ARMS: Record<AuraBotState, { l: number; r: number }> = {
  idle: { l: 0, r: 0 },
  greet: { l: 0, r: M.raiseDeg },
  listening: { l: 0, r: 0 },
  thinking: { l: 8, r: -8 },
  answer: { l: 32, r: -32 },
  concern: { l: -28, r: 28 },
};

/** Les trois points de la réflexion (grille 120). */
const THINK_DOTS: Dot[] = [[48.5, 48, 3.3, 'c'], [60, 48, 3.3, 'a'], [71.5, 48, 3.3, 'c']];

export interface AuraBotProps {
  /** taille en px (32 → bulle du chat, 160 → accueil d'Aura) */
  size?: number;
  state?: AuraBotState;
  /** pose statique de l'état, sans aucune animation (avatars des anciens messages) */
  still?: boolean;
  /** décoratif par défaut ; false → image nommée selon l'état */
  decorative?: boolean;
  /** apparence forcée (galerie de QA) ; par défaut celle du thème courant */
  appearance?: keyof typeof AURA_BOT;
  testID?: string;
}

/** Libellé d'accessibilité du robot pour un état (« Aura, ton assistante… »). */
export const auraBotLabel = (state: AuraBotState) => tr(`aura.bot.${state}` as never);

export function AuraBot({ size = 120, state = 'idle', still = false, decorative = true, appearance, testID }: AuraBotProps) {
  const theme = useTheme();
  const m = useMotion();
  const p = appearance ? AURA_BOT[appearance] : auraBotPalette(theme);
  const uid = `ab${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const s = size / VB;
  const small = size < SMALL;
  const live = m.level === 'full' && !still;
  const face = AURA_BOT_FACES[state];

  const float = useSharedValue(0);
  const hop = useSharedValue(0);
  const sway = useSharedValue(0);
  const tilt = useSharedValue(state === 'listening' ? M.tiltDeg : 0);
  const look = useSharedValue(0);
  const blink = useSharedValue(1);
  const heart = useSharedValue(0);
  const orbit = useSharedValue(0);
  const dots = useSharedValue(0);
  const armL = useSharedValue(ARMS[state].l);
  const armR = useSharedValue(ARMS[state].r);

  useEffect(() => {
    const all = [float, hop, sway, look, blink, heart, orbit, dots, armL, armR, tilt];
    all.forEach((v) => cancelAnimation(v));
    const pose = ARMS[state];
    const tiltTo = state === 'listening' ? M.tiltDeg : 0;
    if (!live) {
      // pose statique : immédiate (`still`, Réduire les animations) ou court fondu (thème nuit)
      const set = (v: SharedValue<number>, to: number) => { v.value = still ? to : m.timing(to, 220, 'standard'); };
      set(float, 0); set(hop, 0); set(sway, 0); set(look, 0); set(heart, 0); set(orbit, 0);
      blink.value = 1; dots.value = 0;
      set(armL, pose.l); set(armR, pose.r); set(tilt, tiltTo);
      return;
    }
    const ease = curves.reveal;
    tilt.value = withSpring(tiltTo, springs.doux);
    armL.value = withSpring(pose.l, springs.doux);
    // flottement (sauf inquiétude : sobre, posé)
    if (state === 'concern') float.value = withTiming(0, { duration: 400, easing: ease });
    else float.value = withRepeat(withTiming(1, { duration: M.floatMs, easing: ease }), -1, true);
    // clignement (pas sur les yeux plissés ni pendant la réflexion)
    if (face.eyes !== 'happy' && face.eyes !== 'none') {
      blink.value = withRepeat(withSequence(withDelay(M.blinkEveryMs, withTiming(0.08, { duration: M.blinkMs })), withTiming(1, { duration: M.blinkMs * 1.5 })), -1, false);
    } else blink.value = 1;
    heart.value = withRepeat(withTiming(1, { duration: state === 'thinking' ? M.heartMs / 2 : M.heartMs, easing: ease }), -1, true);
    if (state === 'thinking') {
      orbit.value = 0;
      orbit.value = withRepeat(withTiming(360, { duration: M.orbitMs, easing: curves.linear }), -1, false);
      dots.value = 0;
      dots.value = withRepeat(withTiming(3, { duration: M.dotsMs, easing: curves.linear }), -1, false);
      sway.value = withRepeat(withSequence(withTiming(1, { duration: M.swayMs, easing: ease }), withTiming(-1, { duration: M.swayMs, easing: ease })), -1, true);
    } else sway.value = withTiming(0, { duration: 300, easing: ease });
    if (state === 'listening') {
      look.value = withRepeat(withSequence(withTiming(M.look, { duration: M.lookMs, easing: ease }), withTiming(-M.look, { duration: M.lookMs, easing: ease })), -1, true);
    } else look.value = withTiming(0, { duration: 200 });
    if (state === 'greet') {
      // coucou, une fois : le bras se lève, trois allers-retours, puis se repose
      const swing = Array.from({ length: M.waves }, () => [withTiming(M.waveToDeg, { duration: M.waveMs, easing: ease }), withTiming(M.waveFromDeg, { duration: M.waveMs, easing: ease })]).flat();
      armR.value = withSequence(withTiming(M.raiseDeg, { duration: 260, easing: curves.decelerate }), ...swing, withDelay(120, withSpring(0, springs.doux)));
    } else armR.value = withSpring(pose.r, springs.doux);
    if (state === 'answer') {
      // petit sursaut joyeux, retour au sol en rebond léger
      hop.value = withSequence(withTiming(-M.hop, { duration: M.hopMs, easing: curves.decelerate }), withSpring(0, springs.rebondLeger));
    } else hop.value = withTiming(0, { duration: 200 });
  }, [state, live, still]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { [float, hop, sway, look, blink, heart, orbit, dots, armL, armR, tilt].forEach((v) => cancelAnimation(v)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const floatAmp = M.float;
  const swayDeg = M.swayDeg;
  const heartScale = M.heartScale;
  // rotation autour d'un point de la grille : translation vers le pivot, rotation, translation retour
  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (-float.value * floatAmp + hop.value) * s },
      { translateY: (SWAY_PIVOT.y - C) * s }, { rotate: `${sway.value * swayDeg}deg` }, { translateY: -(SWAY_PIVOT.y - C) * s },
    ],
  }));
  const shadowStyle = useAnimatedStyle(() => {
    const lift = float.value * 0.5 + Math.min(1, -hop.value / 7) * 0.5;
    return { opacity: 1 - 0.35 * lift, transform: [{ translateY: (108 - C) * s }, { scaleX: 1 - 0.14 * lift }, { translateY: -(108 - C) * s }] };
  });
  const headStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (NECK.y - C) * s }, { rotate: `${tilt.value}deg` }, { translateY: -(NECK.y - C) * s }],
  }));
  const eyesStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: look.value * s }, { translateY: (EYE_Y - C) * s }, { scaleY: blink.value }, { translateY: -(EYE_Y - C) * s }],
  }));
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (HEART.y - C) * s }, { scale: 1 + (heartScale - 1) * heart.value }, { translateY: -(HEART.y - C) * s }],
    opacity: 0.85 + 0.15 * heart.value,
  }));
  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (HEART.y - C) * s }, { rotate: `${orbit.value}deg` }, { translateY: -(HEART.y - C) * s }],
  }));
  const armLStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (SHOULDER_L.x - C) * s }, { translateY: (SHOULDER_L.y - C) * s }, { rotate: `${armL.value}deg` }, { translateX: -(SHOULDER_L.x - C) * s }, { translateY: -(SHOULDER_L.y - C) * s }],
  }));
  const armRStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (SHOULDER_R.x - C) * s }, { translateY: (SHOULDER_R.y - C) * s }, { rotate: `${armR.value}deg` }, { translateX: -(SHOULDER_R.x - C) * s }, { translateY: -(SHOULDER_R.y - C) * s }],
  }));
  // trois points de la réflexion : chacun s'allume et se soulève à son tour (fixes et allumés sans mouvement)
  const dot0 = useAnimatedStyle(() => thinkDot(dots.value, 0, live, s));
  const dot1 = useAnimatedStyle(() => thinkDot(dots.value, 1, live, s));
  const dot2 = useAnimatedStyle(() => thinkDot(dots.value, 2, live, s));

  const a11y = decorative
    ? { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const, 'aria-hidden': true }
    : { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: auraBotLabel(state) };
  const line = small ? 2.6 : 1.4;
  // petites tailles : points un peu plus gros (formes pleines), sans reflets
  const grow = small ? 0.8 : 0;
  const dotFill = (d: Dot) => (d[3] === 'a' ? p.amber : d[3] === 'w' ? p.rim : p.coral);
  const lit = (d: Dot) => !(small && d[3] === 'w');
  const svg = (children: React.ReactNode) => <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>{children}</Svg>;
  const eyes = face.eyes === 'none' ? [] : [...eyeDots(face.eyes, EYE_L), ...eyeDots(face.eyes, EYE_R)];

  return (
    <View testID={testID} {...a11y} pointerEvents="none" style={{ width: size, height: size }}>
      <View testID={testID ? `${testID}-${state}` : undefined} style={StyleSheet.absoluteFill} />
      {/* ombre de contact : il flotte */}
      <Animated.View style={[StyleSheet.absoluteFill, shadowStyle]} testID={testID ? `${testID}-shadow` : undefined}>
        {svg(<>
          <Defs>
            <RadialGradient id={`${uid}sh`} cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor={p.shadow} stopOpacity={p.shadowOpacity * 1.6} />
              <Stop offset="1" stopColor={p.shadow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={60} cy={114} rx={26} ry={4.5} fill={`url(#${uid}sh)`} />
        </>)}
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, bodyStyle]} testID={testID ? `${testID}-body` : undefined}>
        {/* corps en galet, base rose poudré, lueur corail dessous */}
        <View style={StyleSheet.absoluteFill}>
          {svg(<>
            <Defs>
              <RadialGradient id={`${uid}gl`} cx="0.5" cy="0.5" r="0.5">
                <Stop offset="0" stopColor={p.glow} stopOpacity={p.glowOpacity} />
                <Stop offset="1" stopColor={p.glow} stopOpacity={0} />
              </RadialGradient>
              <LinearGradient id={`${uid}bd`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={p.shellTop} />
                <Stop offset="1" stopColor={p.shellBottom} />
              </LinearGradient>
              <ClipPath id={`${uid}bc`}><Path d={BODY} /></ClipPath>
            </Defs>
            <Ellipse cx={60} cy={107} rx={24} ry={8} fill={`url(#${uid}gl)`} />
            <Path d={BODY} fill={`url(#${uid}bd)`} />
            <G clipPath={`url(#${uid}bc)`}>
              <Ellipse cx={60} cy={109} rx={30} ry={9.5} fill={p.blush} />
            </G>
            <Path d={BODY} fill="none" stroke={p.outline} strokeOpacity={p.outlineOpacity} strokeWidth={line} />
            {!small ? <Path d="M39.5 86 C40.5 79.5 45.5 74.5 51.5 72.8" fill="none" stroke={p.rim} strokeOpacity={p.rimOpacity} strokeWidth={1.8} strokeLinecap="round" /> : null}
          </>)}
        </View>
        {/* cœur turquoise */}
        <Animated.View style={[StyleSheet.absoluteFill, heartStyle]} testID={testID ? `${testID}-heart` : undefined}>
          {svg(<>
            <Defs>
              <RadialGradient id={`${uid}ht`} cx="0.5" cy="0.5" r="0.5">
                <Stop offset="0" stopColor={p.heart} stopOpacity={0.7} />
                <Stop offset="1" stopColor={p.heart} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={HEART.x} cy={HEART.y} r={9.5} fill={`url(#${uid}ht)`} />
            <Circle cx={HEART.x} cy={HEART.y} r={small ? 4.4 : 3.5} fill={p.heart} />
            {!small ? <Circle cx={HEART.x - 1.1} cy={HEART.y - 1.1} r={1} fill={p.rim} fillOpacity={0.85} /> : null}
          </>)}
        </Animated.View>
        {state === 'thinking' ? (
          <Animated.View style={[StyleSheet.absoluteFill, orbitStyle]} testID={testID ? `${testID}-orbit` : undefined}>
            {svg(<Path d={`M${HEART.x + 6.8} ${HEART.y} A6.8 6.8 0 1 1 ${HEART.x} ${HEART.y - 6.8}`} fill="none" stroke={p.heart} strokeWidth={small ? 2 : 1.3} strokeLinecap="round" />)}
          </Animated.View>
        ) : null}
        {/* bras articulés (épaule rose), mains simples */}
        <Animated.View style={[StyleSheet.absoluteFill, armLStyle]} testID={testID ? `${testID}-arm-l` : undefined}>
          {svg(<Arm p={p} x={SHOULDER_L.x} y={SHOULDER_L.y} hx={29} hy={98.5} line={line} />)}
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, armRStyle]} testID={testID ? `${testID}-arm-r` : undefined}>
          {svg(<Arm p={p} x={SHOULDER_R.x} y={SHOULDER_R.y} hx={91} hy={98.5} line={line} />)}
        </Animated.View>

        {/* tête : oreilles, dôme laqué, visière bleu de nuit */}
        <Animated.View style={[StyleSheet.absoluteFill, headStyle]} testID={testID ? `${testID}-head` : undefined}>
          <View style={StyleSheet.absoluteFill}>
            {svg(<>
              <Defs>
                <LinearGradient id={`${uid}hd`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={p.shellTop} />
                  <Stop offset="1" stopColor={p.shellBottom} />
                </LinearGradient>
                <LinearGradient id={`${uid}vs`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={p.visorTop} />
                  <Stop offset="1" stopColor={p.visor} />
                </LinearGradient>
                <RadialGradient id={`${uid}ey`} cx="0.5" cy="0.5" r="0.5">
                  <Stop offset="0" stopColor={p.coral} stopOpacity={0.42} />
                  <Stop offset="1" stopColor={p.coral} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              {[22.5, 97.5].map((x) => (
                <G key={x}>
                  <Circle cx={x} cy={50} r={8.6} fill={p.blushDeep} stroke={p.outline} strokeOpacity={p.outlineOpacity} strokeWidth={line} />
                  <Circle cx={x} cy={50} r={5} fill={p.blush} />
                  {!small ? <Circle cx={x - 2.4} cy={47.2} r={1.5} fill={p.rim} fillOpacity={p.sheenOpacity * 0.8} /> : null}
                </G>
              ))}
              <Ellipse cx={60} cy={46} rx={36} ry={31} fill={`url(#${uid}hd)`} stroke={p.outline} strokeOpacity={p.outlineOpacity} strokeWidth={line} />
              {!small ? <Ellipse cx={60} cy={46} rx={34.6} ry={29.6} fill="none" stroke={p.rim} strokeOpacity={p.rimOpacity * 0.7} strokeWidth={1} /> : null}
              {/* reflet doux en haut à gauche */}
              <Path d="M29.5 36 C31.5 26.5 39.5 19.5 50.5 17.2 C43.5 21.5 37.5 27.5 34.6 35.4 C33.6 38 29.2 38.6 29.5 36 Z" fill={p.rim} fillOpacity={p.sheenOpacity} />
              <Ellipse cx={60} cy={49} rx={27} ry={19} fill={`url(#${uid}vs)`} />
              {!small ? GRID.map(([x, y]) => <Circle key={`${x}-${y}`} cx={x} cy={y} r={0.55} fill={p.grid} fillOpacity={p.gridOpacity} />) : null}
              <Ellipse cx={60} cy={49} rx={27} ry={19} fill="none" stroke={p.blush} strokeWidth={small ? 2.2 : 1.5} />
              {!small ? <Path d="M37.5 42.5 C39.5 36.5 45 32.5 52 31.2" fill="none" stroke={p.rim} strokeOpacity={0.22} strokeWidth={2} strokeLinecap="round" /> : null}
              {face.eyes !== 'none' && !small ? [EYE_L, EYE_R].map((x) => <Circle key={x} cx={x} cy={EYE_Y + 1} r={10} fill={`url(#${uid}ey)`} />) : null}
              {[...mouthDots(face.mouth), ...(face.brows ? BROWS : [])].map((d, i) => <Circle key={i} cx={d[0]} cy={d[1]} r={d[2] + grow} fill={dotFill(d)} />)}
            </>)}
          </View>
          {eyes.length ? (
            <Animated.View style={[StyleSheet.absoluteFill, eyesStyle]} testID={testID ? `${testID}-eyes-${face.eyes}` : undefined}>
              {svg(eyes.filter(lit).map((d, i) => <Circle key={i} cx={d[0]} cy={d[1]} r={d[2] + (d[3] === 'w' ? 0 : grow)} fill={dotFill(d)} fillOpacity={d[3] === 'w' ? 0.9 : 1} />))}
            </Animated.View>
          ) : null}
          {state === 'thinking' ? (
            <View style={StyleSheet.absoluteFill} testID={testID ? `${testID}-thinking-dots` : undefined}>
              {THINK_DOTS.map((d, i) => (
                <Animated.View key={i} style={[{ position: 'absolute', left: (d[0] - d[2] - grow) * s, top: (d[1] - d[2] - grow) * s, width: 2 * (d[2] + grow) * s, height: 2 * (d[2] + grow) * s, borderRadius: (d[2] + grow) * s, backgroundColor: dotFill(d) }, i === 0 ? dot0 : i === 1 ? dot1 : dot2]} />
              ))}
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** Corps en galet (grille 120). */
const BODY = 'M60 69 C77 69 86.5 79 86.5 90 C86.5 100.5 75.5 106.5 60 106.5 C44.5 106.5 33.5 100.5 33.5 90 C33.5 79 43 69 60 69 Z';

/** Un bras : segment arrondi (coque) depuis l'épaule, main ronde rose poudré, articulation à l'épaule. */
function Arm({ p, x, y, hx, hy, line }: { p: AuraBotPalette; x: number; y: number; hx: number; hy: number; line: number }) {
  const d = `M${x} ${y} L${hx} ${hy}`;
  return (
    <>
      <Path d={d} stroke={p.outline} strokeOpacity={p.outlineOpacity} strokeWidth={6.4 + 2 * line} strokeLinecap="round" />
      <Path d={d} stroke={p.shellBottom} strokeWidth={6.4} strokeLinecap="round" />
      <Circle cx={hx} cy={hy} r={5.2} fill={p.blush} stroke={p.outline} strokeOpacity={p.outlineOpacity} strokeWidth={line} />
      <Circle cx={x} cy={y} r={3.3} fill={p.blushDeep} />
    </>
  );
}

/** Style d'un des trois points de la réflexion (worklet : aucune valeur par défaut, rien lu hors arguments). */
function thinkDot(k: number, i: number, live: boolean, s: number) {
  'worklet';
  if (!live) return { opacity: 0.95, transform: [{ translateY: 0 }] };
  const on = Math.max(0, 1 - Math.abs(k - (i + 0.5)));
  return { opacity: 0.45 + 0.55 * on, transform: [{ translateY: -2.2 * on * s }] };
}
