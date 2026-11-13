/**
 * Compteur numérique animé (Reanimated) : la valeur glisse vers la cible en 700 ms (décélération).
 *  - iOS / Android : texte mis à jour sur le fil UI (TextInput non éditable + animatedProps `text`),
 *    aucun rendu React par image ;
 *  - web : un seul fil de toute façon ; le texte n'est re-rendu que lorsque la chaîne affichée change ;
 *  - lecteurs d'écran : seule la valeur finale est annoncée (jamais les valeurs intermédiaires) ;
 *  - 'off' (Réduire les animations / économie d'énergie) : valeur finale immédiate ; 'minimal' (nuit) : 160 ms.
 * Chiffres tabulaires : la largeur ne danse pas pendant le défilement.
 */
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedProps, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { localeTag } from '@/i18n';
import { counter } from './curves';
import { useMotion } from './useMotion';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export type NumberFormatOptions = { decimals?: number; prefix?: string; suffix?: string; decimalSep?: string; groupSep?: string };

/** Mise en forme (worklet, testée) : arrondi, séparateurs décimal et de milliers, préfixe et suffixe. */
export function formatCounter(value: number, o: Required<NumberFormatOptions>): string {
  'worklet';
  const neg = value < 0;
  const fixed = Math.abs(value).toFixed(o.decimals);
  const dot = fixed.indexOf('.');
  const int = dot === -1 ? fixed : fixed.slice(0, dot);
  const dec = dot === -1 ? '' : fixed.slice(dot + 1);
  let grouped = '';
  for (let i = 0; i < int.length; i++) {
    if (i > 0 && (int.length - i) % 3 === 0) grouped += o.groupSep;
    grouped += int[i];
  }
  const sign = neg && Number(fixed) !== 0 ? '−' : '';
  return o.prefix + sign + grouped + (dec ? o.decimalSep + dec : '') + o.suffix;
}

/** Séparateurs de la langue de l'application (Intl, côté JS ; passés tels quels au worklet). */
export function localeSeparators(tag: string = safeTag()): { decimalSep: string; groupSep: string } {
  try {
    const parts = new Intl.NumberFormat(tag).formatToParts(12345.6);
    return {
      decimalSep: parts.find((p) => p.type === 'decimal')?.value ?? ',',
      groupSep: parts.find((p) => p.type === 'group')?.value ?? ' ',
    };
  } catch {
    return { decimalSep: ',', groupSep: ' ' };
  }
}
function safeTag() {
  try { return localeTag(); } catch { return 'fr-FR'; }
}

type Props = NumberFormatOptions & {
  value: number;
  /** valeur de départ au premier affichage (0 par défaut) */
  from?: number;
  ms?: number;
  style?: StyleProp<TextStyle>;
  testID?: string;
  /** libellé lu par les lecteurs d'écran (par défaut : la valeur finale mise en forme) */
  accessibilityLabel?: string;
};

export function AnimatedNumber({ value, from = 0, ms = counter.ms, style, testID, accessibilityLabel, ...fmt }: Props) {
  const m = useMotion();
  const seps = localeSeparators();
  const o: Required<NumberFormatOptions> = {
    decimals: fmt.decimals ?? 0,
    prefix: fmt.prefix ?? '',
    suffix: fmt.suffix ?? '',
    decimalSep: fmt.decimalSep ?? seps.decimalSep,
    groupSep: fmt.groupSep ?? seps.groupSep,
  };
  const finalText = formatCounter(value, o);
  const v = useSharedValue(m.off ? value : from);

  useEffect(() => {
    v.value = m.timing(value, ms, 'decelerate');
    return () => cancelAnimation(v);
  }, [value, ms, m, v]);

  const flat = StyleSheet.flatten([styles.tabular, style]);
  const label = accessibilityLabel ?? finalText;

  if (Platform.OS === 'web') return <WebCounter v={v} o={o} initial={formatCounter(v.value, o)} style={flat} testID={testID} label={label} />;

  return (
    <View accessible accessibilityRole="text" accessibilityLabel={label} testID={testID}>
      <NativeCounter v={v} o={o} initial={formatCounter(v.value, o)} style={flat} />
    </View>
  );
}

function NativeCounter({ v, o, initial, style }: { v: { value: number }; o: Required<NumberFormatOptions>; initial: string; style: TextStyle }) {
  const animatedProps = useAnimatedProps(() => {
    const text = formatCounter(v.value, o);
    return { text, defaultValue: text } as unknown as Record<string, unknown>;
  });
  return (
    <AnimatedTextInput
      editable={false}
      pointerEvents="none"
      underlineColorAndroid="transparent"
      importantForAccessibility="no"
      accessibilityElementsHidden
      defaultValue={initial}
      style={[styles.input, style]}
      animatedProps={animatedProps}
    />
  );
}

function WebCounter({ v, o, initial, style, testID, label }: { v: { value: number }; o: Required<NumberFormatOptions>; initial: string; style: TextStyle; testID?: string; label: string }) {
  const [text, setText] = useState(initial);
  useAnimatedReaction(
    () => formatCounter(v.value, o),
    (cur, prev) => {
      if (cur !== prev) scheduleOnRN(setText, cur);
    },
  );
  return (
    <Text testID={testID} style={style} accessibilityLabel={label} aria-live="off">
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
  input: { padding: 0, margin: 0, borderWidth: 0 },
});
