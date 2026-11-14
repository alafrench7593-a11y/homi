/**
 * Introduction d'ouverture HOMI (lancement à froid, ≈ 2,2 s, Reanimated + react-native-svg) — logo v5 « maison » :
 * dans la continuité de l'écran de lancement natif (même fond, même maison), le contour de la maison se trace (un
 * reflet court sur le bord), la maison s'illumine, parent, parent, enfant, enfant apparaissent, le nom HOMI se révèle
 * dans la lumière, pose sur le logo complet — identique à BrandStack —, puis le calque s'efface sur l'accueil avec une
 * très légère avancée (profondeur). Logo : `HomiLogoAnimated` (même horloge).
 *
 * Ne ralentit jamais le lancement :
 *  - le premier écran et ses données se chargent EN DESSOUS pendant l'animation (rien n'attend celle-ci) ;
 *  - le calque ne capte aucun toucher (pointerEvents « none ») : l'écran est utilisable dès qu'il est rendu ;
 *  - jouée une seule fois par lancement à froid (pas au retour d'arrière-plan, pas à chaque changement d'écran) ;
 *  - absente à la toute première ouverture (l'introduction HOMI de /cinematic, même logo animé, joue déjà ce rôle) ;
 *  - « Réduire les animations » ou économie d'énergie (useMotion → 'off') : aucune introduction, état final immédiat ;
 *  - thème nuit ('minimal') ou lancement déjà lent : version abrégée (logo complet, courte pose, fondu).
 * Une seule horloge (valeur partagée, fil UI) pilote toute la chorégraphie ; transform et opacité uniquement.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming, ReduceMotion, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '@/theme/ThemeProvider';
import { intro } from '@/theme/motion';
import { useUiStore } from '@/lib/store';
import { curves } from '@/motion/curves';
import { useMotion } from '@/motion/useMotion';
import { logoTimeline, stageProgress, type LogoTimeline, type Stage } from '@/brand/logoMotion';
import { HomiLogoAnimated } from './HomiLogoAnimated';

export { stageProgress };

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

export type IntroTimeline = { logo: LogoTimeline; exit: Stage; total: number };

/** Logo complet d'emblée (version abrégée) : toutes les étapes terminées à l'instant 0. */
const LOGO_DONE: LogoTimeline = { ...logoTimeline('minimal'), fadeIn: [0, 0], end: 0 };

/**
 * Chorégraphie (pure, testée). 'full' : tracé → illumination → parents → enfants → nom → pose → fondu du calque.
 * 'short' (nuit, lancement lent) : logo complet d'emblée, courte pose, fondu.
 */
export function introTimeline(mode: 'full' | 'short'): IntroTimeline {
  if (mode === 'short') {
    const exit: Stage = [intro.shortHoldMs, intro.shortExitMs];
    return { logo: LOGO_DONE, exit, total: exit[0] + exit[1] };
  }
  const logo = logoTimeline('full');
  const exit: Stage = [logo.end + intro.holdMs, intro.exitMs];
  return { logo, exit, total: exit[0] + exit[1] };
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
    // horloge linéaire : chaque calque applique sa propre courbe à son étape
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
  const logoWidth = Math.round(Math.min(width * 0.6, height * 0.36, 280));
  return (
    <Animated.View
      testID="launch-intro"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: t.colors.background, zIndex: 2000, elevation: 20 }, layer]}
    >
      {phase === 'play' ? <IntroLogo width={logoWidth} clock={clock} tl={timeline} /> : <View />}
    </Animated.View>
  );
}

/** Le logo animé sur l'horloge de l'introduction, avec une légère avancée (1 → 1,06) pendant le fondu du calque. */
function IntroLogo({ width, clock, tl }: { width: number; clock: SharedValue<number>; tl: IntroTimeline }) {
  const depth = useAnimatedStyle(() => {
    const d = curves.decelerate(stageProgress(clock.value, [tl.exit[0] - 120, tl.exit[1] + 120]));
    return { transform: [{ scale: 1 + (intro.logoExitScale - 1) * d }] };
  });
  return (
    <Animated.View style={depth}>
      <HomiLogoAnimated width={width} clock={clock} timeline={tl.logo} testID="launch-logo" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
