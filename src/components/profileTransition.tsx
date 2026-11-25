/**
 * CHANGEMENT DE PROFIL COORDONNÉ (18/11/2026) — un toucher sur un avatar ou un glissement sur l'accueil / un hub :
 *
 *  1. tout de suite : l'anneau du sélecteur GLISSE vers l'avatar choisi, son prénom passe en gras (profil « visé ») ;
 *  2. sortie (110 ms, `accelerate`) : un voile à la couleur du fond uni recouvre le contenu du profil précédent, qui
 *     glisse de quelques points — le magasin n'a PAS encore changé : on voit encore les vraies données de l'ancien
 *     profil, jamais un mélange ;
 *  3. bascule : `setSubject` (une seule mise à jour du magasin) ; chaque `ProfileStage` est rendu sous une CLÉ PAR
 *     PROFIL : son contenu est remonté à neuf avec les données du nouveau profil (aucun état intermédiaire) ;
 *  4. entrée (220 ms, `decelerate`) : le voile s'efface dès que le nouveau contenu est posé (`onLayout`), le contenu
 *     glisse en place ; les cartes remontées arrivent DÉJÀ visibles (`CascadeSettled`).
 *
 * Correctif « écran noir » (22/11/2026) : le voile ne devient plus jamais opaque (`VEIL_MAX`) — le fond reste continu
 * et l'on devine toujours la mise en page — et les cartes remontées ne repartent plus de l'opacité 0.
 *
 * Le voile est un calque FRÈRE du contenu (jamais l'opacité d'un ancêtre : le verre ne se fige pas). Un seul voile
 * partagé (`makeMutable`) pour tous les `ProfileStage` à l'écran : l'accueil, ses actions rapides et son tableau de bord
 * changent ENSEMBLE. « Réduire les animations » / économie d'énergie : bascule immédiate, sans voile ni glissement.
 *
 * Règles worklets : aucune fonction déclarée dans un worklet n'est confiée à scheduleOnRN (la bascule part d'un
 * minuteur du fil JS) ; aucun paramètre par défaut ; aucune ref React lue sur le fil UI.
 */
import React, { useSyncExternalStore } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, makeMutable, useAnimatedStyle } from 'react-native-reanimated';
import { CascadeSettled, motionTiming, swap, useMotion, type MotionLevel } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';

/** 0 : contenu visible ; 1 : sortie terminée (le voile atteint alors `VEIL_MAX`, jamais un aplat opaque). */
const veil = makeMutable(0);
/** Opacité maximale du voile : le fond et la composition restent perceptibles pendant la bascule. */
export const VEIL_MAX = 0.18;
/** Le voile s'efface quand le nouveau contenu est posé ; filet de sécurité si aucune mise en page n'arrive. */
let lift: (() => void) | null = null;
export function profileStageLaidOut() { const f = lift; lift = null; f?.(); }
/** Sens du glissement : 1 = le nouveau profil est à droite dans la rangée (il arrive par la droite). */
const side = makeMutable(1);
/** 0 : sortie (l'ancien contenu part du côté opposé) ; 1 : entrée (le nouveau arrive du côté du profil choisi). */
const phase = makeMutable(0);

let pending: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const snapshot = () => pending;

/** Profil visé pendant la sortie (l'anneau s'y rend tout de suite), sinon null. */
export function usePendingProfile(): string | null {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/** Durées du changement de profil (sortie, entrée). */
export const PROFILE_SWAP = { outMs: swap.outMs, inMs: swap.inMs, distance: 8 } as const;

/**
 * Lance le changement de profil coordonné. `commit` change réellement le profil (magasin) ; il est appelé une fois la
 * sortie terminée (immédiatement en 'off'). Un nouveau choix pendant une transition remplace le précédent.
 */
export function changeProfile(key: string, direction: 1 | -1, level: MotionLevel, commit: () => void) {
  if (timer) { clearTimeout(timer); timer = null; }
  if (level === 'off') {
    pending = null;
    emit();
    cancelAnimation(veil);
    veil.value = 0;
    commit();
    return;
  }
  pending = key;
  emit();
  side.value = direction;
  phase.value = 0;
  veil.value = motionTiming(level, 1, PROFILE_SWAP.outMs, 'accelerate');
  timer = setTimeout(() => {
    timer = null;
    phase.value = 1;
    commit();
    pending = null;
    emit();
    // le nouveau contenu posé (onLayout du ProfileStage remonté) → le voile s'efface ; au plus tard 160 ms après
    let done = false;
    const go = () => { if (done) return; done = true; veil.value = motionTiming(level, 0, PROFILE_SWAP.inMs, 'decelerate'); };
    lift = go;
    setTimeout(go, 160);
  }, level === 'minimal' ? Math.min(PROFILE_SWAP.outMs, 90) : PROFILE_SWAP.outMs);
}

/**
 * Zone dont le contenu dépend du profil affiché : rendue sous une clé par profil (`profileKey`), recouverte par le
 * voile partagé pendant la sortie, glissée de 12 pt dans le sens du changement.
 */
export function ProfileStage({ profileKey, children, style, testID }: { profileKey: string; children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const t = useTheme();
  const m = useMotion();
  const move = m.level === 'full';
  const content = useAnimatedStyle(() => ({ transform: [{ translateX: move ? veil.value * PROFILE_SWAP.distance * (phase.value === 0 ? -side.value : side.value) : 0 }] }));
  const cover = useAnimatedStyle(() => ({ opacity: veil.value * VEIL_MAX }));
  // Premier profil affiché : entrée normale en cascade ; profils suivants (remontage par la clé) : cartes déjà posées
  const first = React.useRef(profileKey);
  const swapped = first.current !== profileKey;
  return (
    <View testID={testID}>
      <Animated.View key={profileKey} testID={testID ? `${testID}-${profileKey}` : undefined} style={[style, content]} onLayout={swapped ? profileStageLaidOut : undefined}>
        <CascadeSettled.Provider value={swapped}>{children}</CascadeSettled.Provider>
      </Animated.View>
      {m.off ? null : (
        <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden
          style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.background }, cover]} />
      )}
    </View>
  );
}

/** Tests : état neutre. */
export function resetProfileTransition() {
  if (timer) { clearTimeout(timer); timer = null; }
  pending = null;
  lift = null;
  veil.value = 0;
  emit();
}
