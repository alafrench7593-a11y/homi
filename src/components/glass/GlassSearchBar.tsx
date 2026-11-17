/**
 * `GlassSearchBar` — champ de recherche sur verre `chrome` (HOMI_DESIGN_SYSTEM.md § 10).
 *
 *  - TRANSITION DE FOCUS : un anneau à la couleur de focus se fond autour du champ et la loupe prend l'encre forte
 *    (160 ms, `standard`) ; immédiat avec « Réduire les animations » ;
 *  - BOUTON EFFACER : apparaît dès qu'il y a du texte (fondu + échelle 0,8 → 1), cible de 44 pt (`hitSlop`), efface et
 *    garde le focus ; masqué aux lecteurs d'écran quand le champ est vide ;
 *  - texte de 16 px (pas de zoom automatique sur iOS / web), suit la taille de texte du téléphone (plafond 1,4) ;
 *  - encre du champ et du texte indicatif garanties ≥ 4,5:1 sur le verre (glassContrast.test.ts).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { durations, useMotion } from '@/motion';
import { fonts, radius as R, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { Icon } from '../ui';
import { Glass, useGlass } from './Glass';

export interface GlassSearchBarProps extends Omit<TextInputProps, 'style' | 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (v: string) => void;
  /** Nom annoncé du champ (défaut : « Rechercher ») */
  label?: string;
  /** Élément à droite du champ (filtre, micro…) */
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const NO_OUTLINE = (Platform.OS === 'web' ? { outlineStyle: 'none' } : null) as unknown as TextStyle;
export const GLASS_SEARCH = { height: 48, focusMs: durations.fast } as const;

export function GlassSearchBar({ value, onChangeText, label, placeholder, right, style, testID = 'glass-search', onFocus, onBlur, ...rest }: GlassSearchBarProps) {
  const t = useTheme();
  const m = useMotion();
  const { spec } = useGlass('chrome');
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const focus = useSharedValue(0);
  const filled = useSharedValue(value.length > 0 ? 1 : 0);
  const has = value.length > 0;
  useEffect(() => { focus.value = m.timing(focused ? 1 : 0, GLASS_SEARCH.focusMs, 'standard'); }, [focused, m, focus]);
  useEffect(() => { filled.value = m.timing(has ? 1 : 0, GLASS_SEARCH.focusMs, 'standard'); }, [has, m, filled]);
  const ringStyle = useAnimatedStyle(() => ({ opacity: focus.value }));
  const clearStyle = useAnimatedStyle(() => ({ opacity: filled.value, transform: [{ scale: 0.8 + 0.2 * filled.value }] }));
  const name = label ?? tr('glass.search');
  return (
    <Glass variant="chrome" radius={R.control + 2} testID={testID} style={style}>
      <Animated.View pointerEvents="none" testID={`${testID}-focus`} style={[StyleSheet.absoluteFill, { borderRadius: R.control + 2, borderWidth: 2, borderColor: spec.inks.accent }, ringStyle]} />
      <View style={styles.row}>
        <Icon name="search" size={19} color={focused ? spec.inks.text : spec.inks.muted} />
        <TextInput
          ref={input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? name}
          placeholderTextColor={spec.inks.muted}
          accessibilityLabel={name}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          maxFontSizeMultiplier={1.4}
          selectionColor={t.tokens.focus}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          testID={`${testID}-input`}
          style={[styles.input, { color: spec.inks.text }, NO_OUTLINE]}
          {...rest}
        />
        <Animated.View style={clearStyle} pointerEvents={has ? 'auto' : 'none'}>
          <Pressable accessibilityRole="button" accessibilityLabel={tr('glass.search.clear')} accessibilityElementsHidden={!has} importantForAccessibility={has ? 'yes' : 'no-hide-descendants'}
            disabled={!has} hitSlop={10} testID={`${testID}-clear`} onPress={() => { onChangeText(''); input.current?.focus(); }} style={styles.clear}>
            <Icon name="x-circle" size={18} color={spec.inks.muted} />
          </Pressable>
        </Animated.View>
        {right}
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: GLASS_SEARCH.height, paddingLeft: spacing.sm + 2, paddingRight: spacing.xs, gap: spacing.xs },
  input: { flex: 1, minWidth: 0, fontFamily: fonts.body, fontSize: 16, paddingVertical: 10 },
  clear: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});
