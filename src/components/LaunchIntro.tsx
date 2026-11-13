/**
 * Introduction d'ouverture HOMI (lancement à froid, ≈ 2,3 s, Reanimated + react-native-svg) :
 * dans la continuité de l'écran de lancement natif (même fond), le contour de la maison HOMI se trace, la maison
 * s'illumine (remplissage, lueur intérieure, halo bref), les deux parents puis les deux enfants apparaissent,
 * pose sur le logo complet — identique à BrandLogo —, puis le calque s'efface sur l'accueil avec une très légère
 * avancée du logo (profondeur).
 *
 * Ne ralentit jamais le lancement :
 *  - le premier écran et ses données se chargent EN DESSOUS pendant l'animation (rien n'attend celle-ci) ;
 *  - le calque ne capte aucun toucher (pointerEvents « none ») : l'écran est utilisable dès qu'il est rendu ;
 *  - jouée une seule fois par lancement à froid (pas au retour d'arrière-plan, pas à chaque changement d'écran) ;
 *  - absente à la toute première ouverture (l'introduction cinématique joue déjà ce rôle) ;
 *  - « Réduire les animations » ou économie d'énergie (useMotion → 'off') : aucune introduction, état final immédiat ;
 *  - thème nuit ('minimal') ou lancement déjà lent : version abrégée (logo complet, courte pose, fondu).
 * Une seule horloge (valeur partagée, fil UI) pilote toute la chorégraphie ; chaque pièce n'anime que son opacité
 * et son transform, sauf le contour de la maison (strokeDashoffset d'un seul tracé, le « trait qui se dessine »).
 * Pièces détachées du logo : src/brand/homiMarkSvg.ts (générées par scripts/homi/brand.mjs, dessin inchangé).
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming, ReduceMotion, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { intro, introDrawnMs } from '@/theme/motion';
import { useUiStore } from '@/lib/store';
import { curves } from '@/motion/curves';
import { useMotion } from '@/motion/useMotion';
import { HOMI_COLORS, HOMI_FAMILY, HOMI_HOUSE_LENGTH, HOMI_HOUSE_PATH, HOMI_HOUSE_STROKE, HOMI_VIEWBOX } from '@/brand/homiMarkSvg';

/** Une seule fois par exécution de l'application (lancement à froid). */
let played = false;
/** Tests : rejouer l'introduction comme après un nouveau lancement. */
export function resetLaunchIntroForTests() { played = false; }

type Phase = 'wait' | 'play' | 'done';

/** Temps écoulé depuis le démarrage de l'application (performance.now part du lancement, web et natif). */
export function isLateStart(now: number = typeof performance !== 'undefined' ? performance.now() : 0) {
  return now > intro.lateStartMs;
}

/** Décision pure (testée) : faut-il jouer l'introduction ? `lowPower` : économie d'énergie (comme Réduire les animations). */
export function shouldPlayLaunchIntro(o: { alreadyPlayed: boolean; reduceMotion: boolean; cinematicSeen: boolean; lowPower?: boolean }) {
  return !o.alreadyPlayed && !o.reduceMotion && !o.lowPower && o.cinematicSeen;
}

/** Étape [début, durée] en ms sur l'horloge de l'introduction. */
type Stage = readonly [number, number];
export type IntroTimeline = { trace: Stage; light: Stage; halo: Stage; figures: readonly Stage[]; exit: Stage; total: number };

/**
 * Chorégraphie (pure, testée). 'full' : tracé → illumination → parents → enfants → pose → fondu.
 * 'short' (nuit, lancement lent) : logo complet d'emblée, courte pose, fondu.
 */
export function introTimeline(mode: 'full' | 'short'): IntroTimeline {
  if (mode === 'short') {
    const exit: Stage = [intro.shortHoldMs, intro.shortExitMs];
    return { trace: [0, 0], light: [0, 0], halo: [0, 0], figures: HOMI_FAMILY.map(() => [0, 0] as const), exit, total: exit[0] + exit[1] };
  }
  const start = intro.revealDelayMs;
  const figures = HOMI_FAMILY.map((_, i) => [start + intro.figuresAtMs - intro.revealDelayMs + i * intro.figureStepMs, intro.figureMs] as const);
  const drawn = start + introDrawnMs - intro.revealDelayMs;
  const exit: Stage = [drawn + intro.holdMs, intro.exitMs];
  return {
    trace: [start, intro.traceMs],
    light: [intro.lightAtMs, intro.lightMs],
    halo: [intro.lightAtMs, drawn + intro.holdMs - intro.lightAtMs],
    figures,
    exit,
    total: exit[0] + exit[1],
  };
}

/** Avancement 0 → 1 d'une étape à l'instant `t` (worklet). Durée 0 : étape déjà terminée. */
export function stageProgress(t: number, s: Stage): number {
  'worklet';
  if (s[1] <= 0) return t >= s[0] ? 1 : 0;
  return Math.min(1, Math.max(0, (t - s[0]) / s[1]));
}

export function LaunchIntro() {
  const t = useTheme();
  const m = useMotion();
  const { width, height } = useWindowDimensions();
  const [phase, setPhase] = useState<Phase>(() => (played ? 'done' : 'wait'));
  const [hydrated, setHydrated] = useState(() => useUiStore.persist?.hasHydrated?.() ?? true);
  useEffect(() => (hydrated ? undefined : useUiStore.persist?.onFinishHydration?.(() => setHydrated(true))), [hydrated]);
  const cinematicSeen = useUiStore((s) => s.cinematicSeen);
  const [timeline, setTimeline] = useState<IntroTimeline>(() => introTimeline('full'));

  const clock = useSharedValue(0); // ms écoulées dans la chorégraphie
  const veil = useSharedValue(1);  // opacité du calque hors chorégraphie (attente, pas d'intro)

  // Décision, une fois les préférences relues (quelques millisecondes)
  useEffect(() => {
    if (phase !== 'wait' || !hydrated) return;
    played = true;
    if (!shouldPlayLaunchIntro({ alreadyPlayed: false, reduceMotion: m.off, cinematicSeen })) {
      // Pas d'introduction : le fond (identique à l'écran de lancement) s'efface aussitôt (durée 0 si mouvement coupé)
      const done = () => setPhase('done');
      if (m.off) {
        veil.value = 0;
        done();
        return;
      }
      veil.value = withTiming(0, { duration: intro.splashFadeMs, easing: Easing.linear, reduceMotion: ReduceMotion.Never }, (f) => {
        'worklet';
        if (f) scheduleOnRN(done);
      });
      return;
    }
    const tl = introTimeline(m.minimal || isLateStart() ? 'short' : 'full');
    setTimeline(tl);
    setPhase('play');
  }, [phase, hydrated, m.off, m.minimal, cinematicSeen, veil]);

  useEffect(() => {
    if (phase !== 'play') return;
    const done = () => setPhase('done');
    clock.value = 0;
    // horloge linéaire : chaque pièce applique sa propre courbe à son étape
    clock.value = withTiming(timeline.total, { duration: timeline.total, easing: Easing.linear, reduceMotion: ReduceMotion.Never }, (f) => {
      'worklet';
      if (f) scheduleOnRN(done);
    });
    return () => cancelAnimation(clock);
  }, [phase, timeline, clock]);

  // Mouvement coupé pendant l'introduction (réglage, économie d'énergie) : on s'arrête net
  useEffect(() => { if (m.off && phase === 'play') { cancelAnimation(clock); setPhase('done'); } }, [m.off, phase, clock]);

  const layer = useAnimatedStyle(() => {
    if (phase !== 'play') return { opacity: veil.value };
    const e = curves.standard(stageProgress(clock.value, timeline.exit));
    return { opacity: 1 - e };
  });

  if (phase === 'done') return null;
  const size = Math.round(Math.min(width * 0.56, height * 0.32, 240));
  return (
    <Animated.View
      testID="launch-intro"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: t.colors.background, zIndex: 2000, elevation: 20 }, layer]}
    >
      {phase === 'play' ? <IntroMark size={size} clock={clock} tl={timeline} /> : <View />}
    </Animated.View>
  );
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const VB = `0 0 ${HOMI_VIEWBOX} ${HOMI_VIEWBOX}`;
// identifiants propres à l'intro (le DOM web partage les <defs> de tous les SVG affichés)
// le logo applique un seul dégradé au groupe des quatre silhouettes : on reprend sa boîte (espace utilisateur)
const FAMILY_TOP = Math.min(...HOMI_FAMILY.map((f) => f.top));
const FAMILY_BOTTOM = Math.max(...HOMI_FAMILY.map((f) => f.bottom));
const ID = { house: 'hmi-house', edge: 'hmi-edge', fig: 'hmi-fig', glow: 'hmi-glow', halo: 'hmi-halo' };

function IntroMark({ size, clock, tl }: { size: number; clock: SharedValue<number>; tl: IntroTimeline }) {
  const k = size / HOMI_VIEWBOX;
  const full = StyleSheet.absoluteFill;

  // ensemble : 0,94 → 1 pendant le tracé, puis légère avancée au fondu (profondeur)
  const whole = useAnimatedStyle(() => {
    const draw = curves.decelerate(stageProgress(clock.value, [tl.trace[0], tl.figures[tl.figures.length - 1][0] + tl.figures[0][1] - tl.trace[0]]));
    const depth = curves.decelerate(stageProgress(clock.value, [tl.exit[0] - 120, tl.exit[1] + 120]));
    return { transform: [{ scale: intro.logoFromScale + (1 - intro.logoFromScale) * draw + (intro.logoExitScale - 1) * depth }] };
  });
  // halo bref autour de la maison au moment où elle s'illumine
  const halo = useAnimatedStyle(() => {
    const p = stageProgress(clock.value, tl.halo);
    const bell = p < 0.35 ? curves.decelerate(p / 0.35) : 1 - curves.standard((p - 0.35) / 0.65);
    return { opacity: 0.55 * bell, transform: [{ scale: 0.9 + 0.2 * p }] };
  });
  const fill = useAnimatedStyle(() => ({ opacity: curves.decelerate(stageProgress(clock.value, tl.light)) }));
  const trace = useAnimatedProps(() => ({
    strokeDashoffset: HOMI_HOUSE_LENGTH * (1 - curves.reveal(stageProgress(clock.value, tl.trace))),
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, whole]}>
      <Animated.View style={[full, halo]}>
        <Svg width={size} height={size} viewBox={VB}>
          <Defs>
            <RadialGradient id={ID.halo} cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor={HOMI_COLORS.lilac} stopOpacity={0.9} />
              <Stop offset="1" stopColor={HOMI_COLORS.lilac} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={128} cy={132} r={128} fill={`url(#${ID.halo})`} />
        </Svg>
      </Animated.View>
      <Animated.View style={[full, fill]}>
        <Svg width={size} height={size} viewBox={VB}>
          <Defs>
            <LinearGradient id={ID.house} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={HOMI_COLORS.midnightHigh} />
              <Stop offset="1" stopColor={HOMI_COLORS.midnight} />
            </LinearGradient>
            <RadialGradient id={ID.glow} cx="0.5" cy="0.42" r="0.6">
              <Stop offset="0" stopColor={HOMI_COLORS.lilac} stopOpacity={0.35} />
              <Stop offset="1" stopColor={HOMI_COLORS.lilac} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Path d={HOMI_HOUSE_PATH} fill={`url(#${ID.house})`} />
          <Path d={HOMI_HOUSE_PATH} fill={`url(#${ID.glow})`} />
        </Svg>
      </Animated.View>
      <View style={full}>
        <Svg width={size} height={size} viewBox={VB}>
          <Defs>
            <LinearGradient id={ID.edge} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset="0.55" stopColor={HOMI_COLORS.lilac} />
              <Stop offset="1" stopColor={HOMI_COLORS.lilacDeep} />
            </LinearGradient>
          </Defs>
          <AnimatedPath
            d={HOMI_HOUSE_PATH}
            fill="none"
            stroke={`url(#${ID.edge})`}
            strokeWidth={HOMI_HOUSE_STROKE}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={[HOMI_HOUSE_LENGTH, HOMI_HOUSE_LENGTH]}
            strokeDashoffset={HOMI_HOUSE_LENGTH}
            animatedProps={trace}
          />
        </Svg>
      </View>
      {HOMI_FAMILY.map((f, i) => (
        <Figure key={i} index={i} size={size} k={k} clock={clock} stage={tl.figures[i]} />
      ))}
    </Animated.View>
  );
}

/** Une silhouette : monte de 10 unités et passe de 0,9 à 1 autour de ses pieds, en fondu. */
function Figure({ index, size, k, clock, stage }: { index: number; size: number; k: number; clock: SharedValue<number>; stage: Stage }) {
  const f = HOMI_FAMILY[index];
  const style = useAnimatedStyle(() => {
    const p = curves.decelerate(stageProgress(clock.value, stage));
    // échelle autour du bas de la silhouette : translation équivalente (transform-origin non utilisé, portable)
    const s = 0.9 + 0.1 * p;
    const ox = f.cx * k;
    const oy = f.bottom * k;
    return {
      opacity: Math.min(1, p * 1.4),
      transform: [
        { translateX: (ox - size / 2) * (1 - s) },
        { translateY: (oy - size / 2) * (1 - s) + 10 * k * (1 - p) },
        { scale: s },
      ],
    };
  });
  const gid = `hmi-fig-${index}`;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg width={size} height={size} viewBox={VB}>
        <Defs>
          <LinearGradient id={gid} gradientUnits="userSpaceOnUse" x1="0" y1={FAMILY_TOP} x2="0" y2={FAMILY_BOTTOM}>
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor={HOMI_COLORS.lilac} />
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

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
