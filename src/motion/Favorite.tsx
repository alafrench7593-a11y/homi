/**
 * MICRO-ANIMATION DE FAVORI — à l'ajout, l'étoile « saute » (1,28 → 1 en ressort « rebond léger ») et une onde part
 * du centre puis s'éteint (420 ms). Au retrait : rien ne bouge (on ne fête pas un retrait). Haptique « sélection » à
 * chaque bascule. L'état affiché suit la donnée (`active`), jamais un état supposé : l'animation joue quand la donnée
 * change, pas au moment de l'appui.
 *
 *  - 'off' / 'minimal' : l'étoile change simplement de forme et de couleur ;
 *  - jamais une couleur seule : étoile PLEINE (active) ou en CONTOUR (inactive), et libellé annoncé différent.
 *
 *   <FavoriteStar active={fav} onToggle={toggle} labelOn="Retirer des favoris" labelOff="Ajouter aux favoris" />
 */
import React, { useEffect, useRef } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH } from '@/theme/tokens';
import { favorite } from './curves';
import { motionHaptic, type MotionHaptic } from './haptics';
import { useMotion } from './useMotion';

/** Styles animés du saut de l'icône et de l'onde, déclenchés quand `active` passe à vrai. */
export function useFavoritePop(active: boolean) {
  const m = useMotion();
  const pop = useSharedValue(1);
  const ring = useSharedValue(0);
  const prev = useRef(active);
  useEffect(() => {
    const was = prev.current;
    prev.current = active;
    if (!active || was || m.level !== 'full') return;
    pop.value = favorite.pop;
    pop.value = m.spring(1, 'rebondLeger');
    ring.value = 0;
    ring.value = m.timing(1, favorite.ringMs, 'decelerate');
  }, [active, m, pop, ring]);
  useEffect(() => () => { cancelAnimation(pop); cancelAnimation(ring); }, [pop, ring]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value <= 0 || ring.value >= 1 ? 0 : 0.6 * (1 - ring.value),
    transform: [{ scale: 0.7 + ring.value * (favorite.ringScale - 0.7) }],
  }));
  return { iconStyle, ringStyle };
}

export function FavoriteStar({ active, onToggle, labelOn, labelOff, size = 22, color, activeColor, disabled, role = 'button', hapticOn = 'selection', box: boxSize, well, ringTestID, style, testID }: {
  active: boolean;
  onToggle: (next: boolean) => void;
  /** Libellé annoncé quand c'est un favori (ex. « Retirer des favoris ») */
  labelOn: string;
  /** Libellé annoncé sinon (ex. « Ajouter aux favoris ») */
  labelOff: string;
  size?: number;
  color?: string;
  activeColor?: string;
  disabled?: boolean;
  /** `switch` : annoncé comme un interrupteur (nom fixe, état coché) ; `button` (défaut) : nom selon l'état */
  role?: 'button' | 'switch';
  /** Haptique à l'AJOUT (défaut « sélection » ; « success » pour un enregistrement) ; le retrait reste « sélection » */
  hapticOn?: MotionHaptic;
  /** Côté de la cible visible (défaut : taille + 12, 32 au moins) ; la cible tactile reste ≥ 44 pt */
  box?: number;
  /** testID de l'onde (défaut : `<testID>-ring`) */
  ringTestID?: string;
  /** Pastille de fond quand c'est un favori (couleur) */
  well?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const t = useTheme();
  const { iconStyle, ringStyle } = useFavoritePop(active);
  const tint = active ? (activeColor ?? t.colors.gold) : (color ?? t.colors.textMuted);
  const box = boxSize ?? Math.max(size + 12, 32);
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={role === 'switch' ? labelOff : active ? labelOn : labelOff}
      accessibilityState={role === 'switch' ? { checked: active, disabled: !!disabled } : { selected: active, disabled: !!disabled }}
      {...(role === 'switch' ? ({ 'aria-checked': active } as object) : null)}
      disabled={disabled}
      hitSlop={Math.max(0, (MIN_TOUCH - box) / 2)}
      // l'état est ENREGISTRÉ d'abord (`onToggle`, synchrone) ; l'animation suit la donnée quand elle change
      onPress={() => { motionHaptic(active ? 'selection' : hapticOn); onToggle(!active); }}
      testID={testID}
      style={[{ width: box, height: box, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : 1 }, style]}
    >
      {well && active ? <Animated.View pointerEvents="none" style={{ position: 'absolute', width: box - 6, height: box - 6, borderRadius: (box - 6) / 2, backgroundColor: well }} /> : null}
      <Animated.View pointerEvents="none" testID={ringTestID ?? (testID ? `${testID}-ring` : undefined)}
        style={[{ position: 'absolute', width: box - 6, height: box - 6, borderRadius: (box - 6) / 2, borderWidth: 2, borderColor: tint }, ringStyle]} />
      <Animated.View pointerEvents="none" style={iconStyle}>
        <MaterialCommunityIcons name={active ? 'star' : 'star-outline'} size={size} color={tint} accessibilityElementsHidden importantForAccessibility="no" />
      </Animated.View>
    </Pressable>
  );
}
