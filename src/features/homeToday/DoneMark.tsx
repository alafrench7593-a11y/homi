/**
 * Pastille d'état « fait » d'une ligne du jour, animée à la validation (Reanimated, primitives src/motion) :
 * le disque se remplit (échelle 0,6 → 1 en ressort « rebondLeger », fondu `decelerate`), la coche apparaît juste après.
 *  - 'off' (Réduire les animations, économie d'énergie) : état final immédiat ; 'minimal' (nuit) : fondu court, sans rebond ;
 *  - transform + opacité uniquement ; décoratif (masqué aux lecteurs d'écran : l'état est annoncé par le libellé de la ligne).
 *
 * Point d'injection : un composant « tâche terminée » plus riche (autre agent) peut remplacer celui-ci SANS toucher
 * à l'accueil, via `setTodayDoneComponent(MonComposant)` (mêmes props `DoneMarkProps`), ou par la prop `DoneComponent`
 * de `HomeToday`.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useMotion } from '@/motion';
import { Icon, type IconName } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

export interface DoneMarkProps {
  /** La ligne est faite (ou en cours de validation, de façon optimiste). */
  done: boolean;
  /** La validation vient d'avoir lieu sur cet écran : jouer l'animation (sinon état posé sans animation). */
  celebrate: boolean;
  /** Icône du statut tant que ce n'est pas fait. */
  icon: IconName;
  /** Couleur du statut (jeton du thème). */
  color: string;
  size?: number;
}

export function DoneMark({ done, celebrate, icon, color, size = 28 }: DoneMarkProps) {
  const t = useTheme();
  const m = useMotion();
  const p = useSharedValue(done ? 1 : 0);
  useEffect(() => {
    if (!done) { cancelAnimation(p); p.value = 0; return; }
    if (!celebrate || m.off) { cancelAnimation(p); p.value = 1; return; }
    p.value = 0;
    p.value = m.minimal ? m.timing(1, 160, 'standard') : m.spring(1, 'rebondLeger');
    return () => cancelAnimation(p);
  }, [done, celebrate, m, p]);
  const fill = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value * 1.4), transform: [{ scale: 0.6 + 0.4 * p.value }] }));
  const check = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, (p.value - 0.35) / 0.5)), transform: [{ scale: 0.7 + 0.3 * Math.min(1, p.value) }] }));
  const r = size / 2;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {!done ? <Icon name={icon} size={Math.round(size * 0.68)} color={color} /> : null}
      {done ? (
        <>
          <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: r, backgroundColor: t.colors.success }, fill]} />
          <Animated.View style={check}><Icon name="check" size={Math.round(size * 0.6)} color={t.colors.primaryText} /></Animated.View>
        </>
      ) : null}
    </View>
  );
}

let injected: React.ComponentType<DoneMarkProps> | null = null;
/** Remplace la pastille animée « fait » de l'accueil (null : revenir à la pastille par défaut). */
export function setTodayDoneComponent(c: React.ComponentType<DoneMarkProps> | null) { injected = c; }
export function getTodayDoneComponent(): React.ComponentType<DoneMarkProps> { return injected ?? DoneMark; }
