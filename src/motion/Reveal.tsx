/**
 * `Reveal` — divulgation progressive (MOTION_SYSTEM.md) : une section qui APPARAÎT après un choix (humeur → saisie,
 * scanner → précisions, réglage → options). Demandé par les pilotes (Humeur, Scanner) : chacun le refaisait à la main.
 *
 *  - `visible` : la section se monte, entre en fondu en montant de 12 px (« decelerate », 240 ms) ; elle se démonte
 *    après un fondu de sortie court (160 ms). Avec « Réduire les animations » : apparition / disparition immédiates.
 *  - `scrollIntoView` : une fois apparue, si son HAUT est sous la zone visible (petit écran, clavier), l'écran
 *    défile pour la montrer (`useScreenScroll`, src/components/screenChrome.ts) — la nouvelle étape ne reste
 *    jamais cachée sous le pli.
 *  - `appear` : monté déjà visible (section rendue sous condition, `{choix ? <Reveal visible appear>…}`), il entre
 *    quand même ; démonté par son parent, il disparaît aussitôt (sans fondu de sortie). Pilote Humeur (audit 09).
 *  - Ne capte jamais les appuis pendant la sortie (`pointerEvents="none"`), aucun fantôme après la fin.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useMotion } from './useMotion';
import { useScreenScroll } from '@/components/screenChrome';

export const REVEAL = { rise: 12, inMs: 240, outMs: 160, scrollDelayMs: 260 } as const;

export function Reveal({ visible, children, appear = false, scrollIntoView = false, style, testID }: {
  visible: boolean;
  children: React.ReactNode;
  appear?: boolean;
  scrollIntoView?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const m = useMotion();
  const [mounted, setMounted] = useState(visible);
  const v = useSharedValue(visible && !(appear && !m.off) ? 1 : 0);
  const ref = useRef<View>(null);
  const scroll = useScreenScroll();
  useEffect(() => {
    if (visible) {
      setMounted(true);
      v.value = m.timing(1, REVEAL.inMs, 'decelerate');
      if (!scrollIntoView) return;
      const id = setTimeout(() => { void scroll.ensureVisible(ref.current); }, m.off ? 0 : REVEAL.scrollDelayMs);
      return () => clearTimeout(id);
    }
    const unmount = () => setMounted(false);
    v.value = m.timing(0, REVEAL.outMs, 'accelerate', (finished) => {
      'worklet';
      if (finished) scheduleOnRN(unmount);
    });
    return undefined;
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cancelAnimation(v), [v]);
  const anim = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ translateY: (1 - v.value) * REVEAL.rise }] }));
  if (!mounted) return null;
  return (
    <Animated.View testID={testID} pointerEvents={visible ? 'auto' : 'none'} style={[style, anim]}>
      <View ref={ref} collapsable={false}>{children}</View>
    </Animated.View>
  );
}
