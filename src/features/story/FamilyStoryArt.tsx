/**
 * « Au fil de nous » : la femme et son enfant, dessinés à partir de la même pose numérique que les tests
 * (src/lib/domain/familyStory.ts). Les changements d'étape (autre profil, enfant qui grandit) passent par des poses
 * intermédiaires, en douceur. Mouvement au repos très léger (respiration, halo, particules la nuit), jamais au
 * premier plan. « Réduire les animations » ou économie d'énergie : la même image, immobile.
 * Décoratif : une seule description pour les lecteurs d'écran.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { useLowPower } from '@/lib/lowPower';
import { chapterIndexForScene, DAY_PALETTE, dressGradient, drawPose, lerpPose, NIGHT_PALETTE, poseFor, smooth, type Pose, type Shape, type StoryScene } from '@/lib/domain/familyStory';
import { Image as MotionImage } from 'expo-image';
import { STORY_ANIMS, STORY_IMAGES } from './storyImages';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { NATIVE_DRIVER } from '@/theme/tokens';

const TRANSITION_MS = 1400;

/** Suit la pose cible en passant par les poses intermédiaires (immédiat si les animations sont réduites). */
export function useTweenedPose(target: Pose, still: boolean): Pose {
  const [pose, setPose] = useState(target);
  const from = useRef(target);
  const current = useRef(target);
  useEffect(() => {
    if (still) { current.current = target; setPose(target); return; }
    from.current = current.current;
    const start = Date.now();
    let raf = 0;
    const step = () => {
      const k = smooth(Math.min(1, (Date.now() - start) / TRANSITION_MS));
      const p = lerpPose(from.current, target, k);
      current.current = p;
      setPose(p);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, still]);
  return pose;
}

/**
 * Mouvement normal : mini-vidéo au fil d'or (WebP animé). Animations réduites : croquis fixe. Ancien rendu animé en code conservé ci-dessous
 * (jamais atteint quand still=false) — Croquis au fil doré animé : à l'arrivée, le trait se dessine de haut en bas ; ensuite, une lumière d'or parcourt
 * le fil en continu (bande claire qui glisse le long du dessin). Immobile si les animations sont réduites.
 */
const GOLD_LIGHT = '#FFE7B0';
function GoldThreadImage({ idx, opacity, still, night }: { idx: number; opacity: number; still: boolean; night: boolean }) {
  const [h, setH] = useState(0);
  const draw = useRef(new Animated.Value(still ? 1 : 0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still || !h) { draw.setValue(1); return; }
    draw.setValue(0);
    const a = Animated.sequence([
      Animated.timing(draw, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE_DRIVER }),
    ]);
    a.start();
    return () => a.stop();
  }, [idx, still, h, draw]);
  useEffect(() => {
    if (still || !h) return;
    sweep.setValue(0);
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(900),
      Animated.timing(sweep, { toValue: 1, duration: 3400, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [still, h, sweep]);
  const src = STORY_IMAGES[idx];
  const full = { position: 'absolute' as const, top: 0, left: 0, right: 0, height: (h || '100%') as number | `${number}%` };
  // fenêtre qui glisse : on déplace le cadre vers le bas et l'image vers le haut d'autant, pour qu'elle reste en place
  const band = (size: number, alpha: number, k: number) => {
    const travel = sweep.interpolate({ inputRange: [0, 1], outputRange: [-size, h + size] });
    return (
      <Animated.View key={k} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: size, overflow: 'hidden', opacity: alpha, transform: [{ translateY: travel }] }}>
        <Animated.Image source={src} resizeMode="contain" tintColor={GOLD_LIGHT}
          style={[full, { transform: [{ translateY: Animated.multiply(travel, -1) }] }]} />
      </Animated.View>
    );
  };
  if (!still) {
    // mini-vidéo au fil d'or (WebP animé transparent) : le personnage bouge pour de vrai
    return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]} testID={`story-img-${idx + 1}`}>
        <MotionImage source={STORY_ANIMS[idx]} contentFit="contain" autoplay style={{ width: '100%', height: '100%' }} testID={`story-anim-${idx + 1}`} />
      </View>
    );
  }
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]} onLayout={(e) => setH(e.nativeEvent.layout.height)} testID={`story-img-${idx + 1}`}>
      {/* tracé : le dessin apparaît de haut en bas */}
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: (h || '100%') as number | `${number}%`, overflow: 'hidden',
        transform: [{ translateY: draw.interpolate({ inputRange: [0, 1], outputRange: [-(h || 0), 0] }) }] }}>
        <Animated.Image source={src} resizeMode="contain" accessibilityIgnoresInvertColors
          style={[full, { transform: [{ translateY: draw.interpolate({ inputRange: [0, 1], outputRange: [h || 0, 0] }) }] }]} />
      </Animated.View>
      {/* pointe du fil qui se dessine : une lueur dorée au bord du tracé */}
      {!still && h ? (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 26, overflow: 'hidden',
          opacity: draw.interpolate({ inputRange: [0, 0.05, 0.92, 1], outputRange: [0, 1, 1, 0] }),
          transform: [{ translateY: draw.interpolate({ inputRange: [0, 1], outputRange: [-13, h - 13] }) }] }}>
          <Animated.Image source={src} resizeMode="contain" tintColor={GOLD_LIGHT}
            style={[full, { transform: [{ translateY: draw.interpolate({ inputRange: [0, 1], outputRange: [13, -(h - 13)] }) }] }]} />
        </Animated.View>
      ) : null}
      {/* lumière d'or qui parcourt le fil en continu (bande douce : trois épaisseurs superposées) */}
      {!still && h ? [band(90, night ? 0.25 : 0.3, 0), band(46, night ? 0.45 : 0.5, 1), band(18, night ? 0.8 : 0.85, 2)] : null}
    </View>
  );
}

function useLoop(ms: number, still: boolean) {
  const v = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (still) { v.setValue(0.5); return; }
    const ease = Easing.inOut(Easing.sin);
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: ms, easing: ease, useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(v, { toValue: 0, duration: ms, easing: ease, useNativeDriver: NATIVE_DRIVER }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [ms, still, v]);
  return v;
}

function ShapeEl({ s }: { s: Shape }) {
  if (s.k === 'path') {
    return <Path d={s.d} fill={s.fill ?? 'none'} stroke={s.stroke} strokeWidth={s.sw} opacity={s.op} strokeLinecap={s.cap ?? 'butt'} strokeLinejoin="round" />;
  }
  return <Ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={s.fill ?? 'none'} stroke={s.stroke} strokeWidth={s.sw} opacity={s.op} rotation={s.rot ?? 0} origin={`${s.cx}, ${s.cy}`} />;
}

/** Le dessin seul (une pose donnée), sans animation : sert aussi à la présentation et à la version fixe. */
export function StoryDrawing({ pose, night, width, height }: { pose: Pose; night: boolean; width: number | `${number}%`; height: number }) {
  const pal = night ? NIGHT_PALETTE : DAY_PALETTE;
  const g = dressGradient(pal);
  const shapes = useMemo(() => drawPose(pose, pal), [pose, pal]);
  // Cadre : la mère et les enfants, centrés ; s'élargit pour une fratrie
  const right = Math.max(196, ...pose.kids.filter((k) => k.bundle < 0.5 && k.opacity > 0.05).map((k) => k.x + 22));
  const left = 46 - (right - 196) * 0.5;
  return (
    <Svg width={width} height={height} viewBox={`${left} 20 ${right - left} 174`} preserveAspectRatio="xMidYMax meet">
      <Defs>
        <LinearGradient id={g.id} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}>
          {g.stops.map((st) => <Stop key={st.o} offset={st.o} stopColor={st.c} />)}
        </LinearGradient>
      </Defs>
      <G>{shapes.map((s, i) => <ShapeEl key={i} s={s} />)}</G>
    </Svg>
  );
}

const MOTES = Array.from({ length: 9 }, (_, i) => ({ x: ((i * 37) % 100) / 100, y: ((i * 53) % 80) / 100, r: 1 + (i % 3) * 0.6, o: 0.35 + (i % 4) * 0.12 }));

/**
 * Scène animée : halo de lumière chaude (ou bleu nuit et prune), personnages, quelques particules lumineuses.
 * `scene` : étape à montrer ; `pose` : pose imposée (présentation pilotée par le défilement).
 */
export function FamilyStoryArt({ scene, pose: forced, progress, blend, height = 150, label, testID }: { scene?: StoryScene; pose?: Pose; progress?: number; /** fondu libre entre deux étapes quelconques : [de, vers, 0..1] */ blend?: [number, number, number]; height?: number; label: string; testID?: string }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const lowPower = useLowPower();
  const still = reduce || lowPower;
  const night = t.isDark;
  const target = useMemo(() => forced ?? poseFor(scene ?? { belly: 0, multiple: false, kids: [] }), [forced, scene]);
  const tweened = useTweenedPose(target, still || !!forced);
  const pose = forced ?? tweened;
  const breathe = useLoop(4200, still);
  const glow = useLoop(7000, still);
  const id = React.useId().replace(/:/g, '');
  const halo = night ? ['#8E6FB0', '#3B3A6E'] : ['#FFF8F1', '#F7E1D9'];
  // Personnages générés : étape de la scène (accueil) ou fondu entre deux étapes selon le défilement (présentation).
  // Plusieurs enfants ou grossesse multiple : le dessin animé, qui sait les montrer, reste utilisé.
  const images: [number, number][] | null = useMemo(() => {
    if (blend) {
      const [a, b, k] = blend;
      return k <= 0 || a === b ? [[a, 1]] : k >= 1 ? [[b, 1]] : [[a, 1 - k], [b, k]];
    }
    if (progress != null) {
      const n = STORY_IMAGES.length - 1;
      const p = Math.max(0, Math.min(n, progress));
      const i = Math.min(n - 1, Math.floor(p));
      const k = Math.max(0, Math.min(1, (p - i - 0.18) / 0.64));
      const e = k * k * (3 - 2 * k);
      return e <= 0 ? [[i, 1]] : e >= 1 ? [[i + 1, 1]] : [[i, 1 - e], [i + 1, e]];
    }
    if (forced) return null;
    const idx = chapterIndexForScene(scene ?? { belly: 0, multiple: false, kids: [] });
    return idx == null ? null : [[idx, 1]];
  }, [blend, progress, forced, scene]);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} testID={testID} style={{ height, overflow: 'hidden' }}>
      {/* halo de lumière douce, qui respire très lentement */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) }]}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id={`h${id}`} cx="50%" cy="58%" r="55%">
              <Stop offset="0" stopColor={halo[0]} stopOpacity={night ? 0.42 : 0.9} />
              <Stop offset="0.55" stopColor={halo[1]} stopOpacity={night ? 0.18 : 0.45} />
              <Stop offset="1" stopColor={halo[1]} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx="50%" cy="60%" rx="48%" ry="62%" fill={`url(#h${id})`} />
        </Svg>
      </Animated.View>
      {/* particules lumineuses (plus présentes la nuit) */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: night ? [0.6, 1] : [0.35, 0.7] }), transform: [{ translateY: glow.interpolate({ inputRange: [0, 1], outputRange: [3, -3] }) }] }]}>
        <Svg width="100%" height="100%">
          {MOTES.map((m, i) => <Circle key={i} cx={`${8 + m.x * 84}%`} cy={`${6 + m.y * 70}%`} r={m.r} fill={night ? '#F6E7FF' : '#FFFFFF'} opacity={m.o} />)}
        </Svg>
      </Animated.View>
      {/* personnages : respiration à peine perceptible */}
      <Animated.View style={{ flex: 1, transform: [{ translateY: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.6, -0.6] }) }, { scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.006] }) }] }}>
        {images ? (
          images.map(([idx, op]) => <GoldThreadImage key={idx} idx={idx} opacity={op} still={still} night={night} />)
        ) : (
          <StoryDrawing pose={pose} night={night} width="100%" height={height} />
        )}
      </Animated.View>
    </View>
  );
}
