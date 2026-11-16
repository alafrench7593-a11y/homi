/**
 * IconOrb — bouton rond à icône (référence « Lightly ») : petit disque OPTIQUE (verre givré, reflet dans le coin
 * éclairé, arête claire) pour ajouter, fermer, options… Zone tactile ≥ 48 px quelle que soit la taille visible ;
 * nom accessible OBLIGATOIRE (`label`).
 *
 * États : repos · pression (s'enfonce à 0,92 en ressort « vif », retour « rebond léger ») · sélection (`selected` :
 * lumière diffuse de la palette derrière le disque + `accessibilityState.selected`) · désactivé (atténué, sans
 * lumière ni haptique) · focus clavier (anneau global du web, WebInteractionStyles).
 * Tons : `glass` (défaut), `accent` (verre teinté de la palette, texte `primaryText`), `danger` (action sensible).
 */
import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, MIN_TOUCH } from '@/theme/tokens';
import { usePressScale } from '@/motion/PressableScale';

export const ORB_SIZE = { sm: 40, md: 48, lg: 56 } as const;

export function IconOrb({ icon, label, onPress, size = 'md', tone = 'glass', selected, disabled, hint, testID, style }: {
  icon: React.ComponentProps<typeof Feather>['name'];
  /** Nom accessible (obligatoire) */
  label: string;
  onPress: () => void;
  size?: keyof typeof ORB_SIZE;
  tone?: 'glass' | 'accent' | 'danger';
  selected?: boolean;
  disabled?: boolean;
  hint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const D = ORB_SIZE[size];
  const night = t.name === 'night';
  const p = usePressScale({ scale: 0.92, haptic: disabled ? 'none' : 'light' });
  const f = t.material.surfaces.frosted;
  const fill = tone === 'accent' ? t.colors.primary : tone === 'danger' ? t.colors.dangerSoft : f.fill;
  const ink = tone === 'accent' ? t.colors.primaryText : tone === 'danger' ? t.colors.danger : t.colors.text;
  const pad = Math.max(0, (MIN_TOUCH - D) / 2);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={p.onPressIn}
      onPressOut={p.onPressOut}
      hitSlop={pad}
      testID={testID}
      style={[{ width: D, height: D, opacity: disabled ? 0.45 : 1 }, style]}
    >
      <Animated.View style={[{ flex: 1 }, p.style]}>
        {selected && !night && !disabled ? (
          <View pointerEvents="none" testID="orb-light" style={[StyleSheet.absoluteFill, { borderRadius: D / 2, borderWidth: 2, borderColor: alpha(t.colors.primary, 0.35), transform: [{ scale: 1.12 }] }]} />
        ) : null}
        <View style={{ flex: 1, borderRadius: D / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: fill, borderWidth: 1,
          borderColor: tone === 'danger' ? alpha(t.tokens.status.danger, 0.4) : selected ? t.tokens.border.active : f.edge,
          }}>
          <Feather name={icon} size={Math.round(D * 0.42)} color={ink} accessibilityElementsHidden importantForAccessibility="no" />
        </View>
      </Animated.View>
    </Pressable>
  );
}
