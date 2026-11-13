/**
 * Transition de carte « shared-element-like » (Reanimated), sans dépendre des transitions partagées
 * expérimentales : deux moitiés qui se répondent.
 *  - <LiftCard onOpen> (source) : à l'appui, la carte s'élève (échelle 1,03, −4 px, ombre portée en fondu),
 *    puis `onOpen` est appelé après 140 ms (navigation) — jamais plus tard ; elle retombe en ressort doux ;
 *  - <DetailEnter> (destination) : le contenu de l'écran détail part de l'échelle 0,94 / +14 px et rejoint
 *    sa place en ressort doux, en complément du fondu de la pile (animation: 'fade' dans src/app/_layout.tsx).
 * 'off' : onOpen immédiat, aucun mouvement ; 'minimal' (nuit) : pas d'élévation, fondu court à l'arrivée.
 * L'« ombre » est un calque dont seule l'opacité varie (pas d'animation de shadowRadius / elevation).
 */
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { cardLift, durations } from './curves';
import { motionHaptic } from './haptics';
import { useMotion } from './useMotion';

/** Élévation de carte : style animé + `open(cb)` qui lance l'élévation puis appelle `cb` (navigation). */
export function useCardLift() {
  const m = useMotion();
  const lift = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value * cardLift.lift }, { scale: 1 + lift.value * (cardLift.scale - 1) }],
  }));
  // ombre de contact discrète : visible aussi sous les cartes translucides, donc plafonnée bas
  const shadow = useAnimatedStyle(() => ({ opacity: lift.value * 0.16 }));
  useEffect(() => () => cancelAnimation(lift), [lift]);
  const open = (cb: () => void) => {
    if (m.level !== 'full') {
      cb();
      return;
    }
    lift.value = m.timing(1, cardLift.leadMs, 'decelerate', (finished) => {
      'worklet';
      if (finished) scheduleOnRN(cb);
    });
  };
  /** Retour au repos (retour sur l'écran source, relâchement sans ouverture). */
  const settle = () => { lift.value = m.spring(0, 'doux'); };
  return { style, shadow, open, settle, lift };
}

type LiftProps = Omit<PressableProps, 'style' | 'children' | 'onPress'> & {
  children: React.ReactNode;
  onOpen: () => void;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  shadowColor?: string;
};

export function LiftCard({ children, onOpen, style, radius = 22, shadowColor = '#0D0E11', ...rest }: LiftProps) {
  const c = useCardLift();
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      onPress={() => {
        motionHaptic('light');
        c.open(() => {
          onOpen();
          // l'écran détail recouvre déjà la carte : elle retombe sans être vue
          setTimeout(c.settle, durations.slow);
        });
      }}
    >
      <Animated.View style={c.style}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: shadowColor, opacity: 0, transform: [{ translateY: 10 }, { scale: 0.96 }] }, styles.shadowBlur, c.shadow]}
        />
        <Animated.View style={style}>{children}</Animated.View>
      </Animated.View>
    </Pressable>
  );
}

/** Arrivée du contenu de l'écran détail, en réponse à <LiftCard>. */
export function DetailEnter({ children, style, testID }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const m = useMotion();
  const p = useSharedValue(m.off ? 1 : 0);
  const move = m.level === 'full';
  useEffect(() => {
    p.value = m.spring(1, 'doux');
    return () => cancelAnimation(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const animated = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 1.6),
    transform: move
      ? [{ translateY: (1 - p.value) * cardLift.targetFromY }, { scale: cardLift.targetFromScale + p.value * (1 - cardLift.targetFromScale) }]
      : [],
  }));
  return <Animated.View testID={testID} style={[style, animated]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  // ombre douce et statique (seule l'opacité du calque est animée)
  shadowBlur: { shadowColor: '#0D0E11', shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
});
