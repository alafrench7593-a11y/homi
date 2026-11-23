/**
 * TRANSITION DE CONTENU PARTAGÉE — quand le SUJET d'un écran change (autre profil, autre onglet d'un sélecteur), tout
 * ce qui en dépend change ENSEMBLE : l'ancien contenu s'efface en glissant de 10 px (110 ms, `accelerate`), puis le
 * nouveau entre du côté opposé (220 ms, `decelerate`). Un seul mouvement coordonné au lieu de valeurs qui sautent.
 *
 *   <ContentSwap swapKey={profile.id} direction={next > prev ? 1 : -1}>
 *     <ProfileSummary profile={profile} />
 *   </ContentSwap>
 *
 *  - l'ancien contenu reste affiché pendant sa sortie (le nouveau n'est monté qu'ensuite) ;
 *  - `direction` : 1 = le nouveau arrive par la droite / le bas, −1 = par la gauche / le haut ;
 *  - `axis` : `y` (profil : fondu-glissé vertical, défaut) ou `x` (onglets voisins) ;
 *  - un changement pendant une transition repart de l'état courant (interruptible) ;
 *  - 'off' : échange immédiat ; 'minimal' (nuit) : fondu court, sans glissement.
 * Transform et opacité uniquement, sur le fil UI. À NE PAS poser autour d'un verre (`Glass`) : l'opacité d'un ancêtre
 * fige le flou — y mettre le CONTENU du verre, pas le verre.
 */
import React, { useEffect, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { swap } from './curves';
import { useMotion } from './useMotion';

export function ContentSwap({ swapKey, children, direction = 1, axis = 'y', style, testID }: {
  swapKey: string | number;
  children: React.ReactNode;
  direction?: 1 | -1;
  axis?: 'x' | 'y';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const m = useMotion();
  const [shownKey, setShownKey] = useState(swapKey);
  // dernier contenu rendu pour la clé affichée : c'est lui qui reste à l'écran pendant la sortie
  const kept = useRef<React.ReactNode>(children);
  if (shownKey === swapKey) kept.current = children;
  const latestKey = useRef(swapKey);
  latestKey.current = swapKey;
  const v = useSharedValue(1);
  const side = useSharedValue<number>(direction);
  const slide = m.level === 'full' ? swap.distance : 0;
  const horizontal = axis === 'x';

  // Fil JS : déclarée dans le composant (jamais dans un worklet), puis confiée à scheduleOnRN
  const commit = () => setShownKey(latestKey.current);
  useEffect(() => {
    if (swapKey === shownKey) return;
    if (m.off) { setShownKey(swapKey); return; }
    side.value = -direction;
    v.value = m.timing(0, swap.outMs, 'accelerate', (finished) => {
      'worklet';
      if (finished) scheduleOnRN(commit);
    });
  }, [swapKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    side.value = direction;
    v.value = m.timing(1, swap.inMs, 'decelerate');
  }, [shownKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cancelAnimation(v), [v]);

  const anim = useAnimatedStyle(() => {
    const d = (1 - v.value) * slide * side.value;
    return { opacity: v.value, transform: [horizontal ? { translateX: d } : { translateY: d }] };
  });
  return (
    <Animated.View testID={testID} style={[style, anim]}>
      {shownKey === swapKey ? children : kept.current}
    </Animated.View>
  );
}
