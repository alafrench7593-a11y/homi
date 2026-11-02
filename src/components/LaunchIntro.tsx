/**
 * Introduction d'ouverture (lancement à froid, ≈ 1,9 s) : dans la continuité de l'écran de lancement natif, le fond
 * aux couleurs de l'application est là, le fil doré du logo officiel se révèle de la tige vers les feuilles (comme une
 * pousse), avance très légèrement (profondeur), puis le calque s'efface sur le premier écran.
 *
 * Ne ralentit jamais le lancement :
 *  - le premier écran et ses données se chargent EN DESSOUS pendant l'animation (rien n'attend celle-ci) ;
 *  - le calque ne capte aucun toucher (pointerEvents « none ») : l'écran est utilisable dès qu'il est rendu ;
 *  - jouée une seule fois par lancement à froid (pas au retour d'arrière-plan, pas à chaque changement d'écran) ;
 *  - absente à la toute première ouverture (l'introduction cinématique joue déjà ce rôle) ;
 *  - « Réduire les animations » : aucune introduction (état final immédiat).
 * Uniquement transform et opacity, sur le fil natif ; aucune couleur ajoutée (fond = fond du thème, logo officiel
 * détouré sans retouche : assets/brand/logo-transparent.png).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { easing, intro } from '@/theme/motion';
import { NATIVE_DRIVER } from '@/theme/tokens';
import { useUiStore } from '@/lib/store';

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const LOGO_TRANSPARENT: number = require('../../assets/brand/logo-transparent.png');

/** Une seule fois par exécution de l'application (lancement à froid). */
let played = false;
/** Tests : rejouer l'introduction comme après un nouveau lancement. */
export function resetLaunchIntroForTests() { played = false; }

type Phase = 'wait' | 'play' | 'done';

/** Temps écoulé depuis le démarrage de l'application (performance.now part du lancement, web et natif). */
export function isLateStart(now: number = typeof performance !== 'undefined' ? performance.now() : 0) {
  return now > intro.lateStartMs;
}

/** Décision pure (testée) : faut-il jouer l'introduction ? */
export function shouldPlayLaunchIntro(o: { alreadyPlayed: boolean; reduceMotion: boolean; cinematicSeen: boolean }) {
  return !o.alreadyPlayed && !o.reduceMotion && o.cinematicSeen;
}

export function LaunchIntro() {
  const t = useTheme();
  const reduce = useReduceMotion();
  const { width, height } = useWindowDimensions();
  const [phase, setPhase] = useState<Phase>(() => (played ? 'done' : 'wait'));
  const [hydrated, setHydrated] = useState(() => useUiStore.persist?.hasHydrated?.() ?? true);
  useEffect(() => (hydrated ? undefined : useUiStore.persist?.onFinishHydration?.(() => setHydrated(true))), [hydrated]);
  const cinematicSeen = useUiStore((s) => s.cinematicSeen);

  const veil = useRef(new Animated.Value(1)).current;   // opacité du calque (fond)
  const reveal = useRef(new Animated.Value(0)).current; // 0 → 1 : révélation du fil doré
  const depth = useRef(new Animated.Value(0)).current;  // 0 → 1 : avancée finale (profondeur)

  // Décision, une fois les préférences relues (quelques millisecondes)
  useEffect(() => {
    if (phase !== 'wait' || !hydrated) return;
    played = true;
    if (!shouldPlayLaunchIntro({ alreadyPlayed: false, reduceMotion: reduce, cinematicSeen })) {
      // Pas d'introduction : le fond (identique à l'écran de lancement) s'efface aussitôt
      Animated.timing(veil, { toValue: 0, duration: reduce ? 0 : intro.splashFadeMs, useNativeDriver: NATIVE_DRIVER, isInteraction: false }).start(() => setPhase('done'));
      return;
    }
    setPhase('play');
  }, [phase, hydrated, reduce, cinematicSeen, veil]);

  useEffect(() => {
    if (phase !== 'play') return;
    // Lancement déjà lent (premier rendu tardif) : logo affiché d'emblée, courte pose, fondu — on n'ajoute pas d'attente
    if (isLateStart()) {
      reveal.setValue(1);
      const short = Animated.parallel([
        Animated.timing(veil, { toValue: 0, duration: intro.shortExitMs, delay: intro.shortHoldMs, easing: easing.standard, useNativeDriver: NATIVE_DRIVER, isInteraction: false }),
        Animated.timing(depth, { toValue: 1, duration: intro.shortExitMs + intro.shortHoldMs, easing: easing.decelerate, useNativeDriver: NATIVE_DRIVER, isInteraction: false }),
      ]);
      short.start(() => setPhase('done'));
      return () => short.stop();
    }
    // isInteraction: false : l'introduction ne retarde jamais les tâches « après interaction » (listes, requêtes)
    const a = Animated.sequence([
      Animated.timing(reveal, { toValue: 1, duration: intro.revealMs, delay: intro.revealDelayMs, easing: easing.reveal, useNativeDriver: NATIVE_DRIVER, isInteraction: false }),
      Animated.parallel([
        Animated.timing(veil, { toValue: 0, duration: intro.exitMs, delay: intro.holdMs, easing: easing.standard, useNativeDriver: NATIVE_DRIVER, isInteraction: false }),
        Animated.timing(depth, { toValue: 1, duration: intro.exitMs + intro.holdMs, easing: easing.decelerate, useNativeDriver: NATIVE_DRIVER, isInteraction: false }),
      ]),
    ]);
    a.start(() => setPhase('done'));
    return () => a.stop();
  }, [phase, reveal, veil, depth]);

  // « Réduire les animations » activé pendant l'introduction : on s'arrête net
  useEffect(() => { if (reduce && phase === 'play') setPhase('done'); }, [reduce, phase]);

  if (phase === 'done') return null;
  const size = Math.round(Math.min(width * 0.56, height * 0.32, 240));
  const logo = phase === 'play';
  return (
    <Animated.View
      testID="launch-intro"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: t.colors.background, opacity: veil, zIndex: 2000, elevation: 20 }]}
    >
      {logo ? (
        <Animated.View style={{
          width: size, height: size,
          opacity: reveal.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 1] }),
          transform: [
            { scale: Animated.add(reveal.interpolate({ inputRange: [0, 1], outputRange: [intro.logoFromScale, 1] }), depth.interpolate({ inputRange: [0, 1], outputRange: [0, intro.logoExitScale - 1] })) },
            { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          ],
        }}>
          {/* Révélation de bas en haut : la fenêtre monte pendant que l'image reste immobile (masque glissant natif) */}
          <Animated.View style={{ width: size, height: size, overflow: 'hidden', transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [size, 0] }) }] }}>
            <Animated.View style={{ width: size, height: size, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [-size, 0] }) }] }}>
              <Image source={LOGO_TRANSPARENT} style={{ width: size, height: size }} resizeMode="contain" accessible={false} />
            </Animated.View>
          </Animated.View>
        </Animated.View>
      ) : <View />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
