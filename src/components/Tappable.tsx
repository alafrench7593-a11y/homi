/**
 * Zone tactile animée de l'application : remplace `Pressable` partout où un élément se touche
 * (cartes, lignes, cases de calendrier, liens, pastilles maison).
 *  - pression : réduction à 0,97 en 120 ms, relâchement en 200 ms (jetons `interaction` de src/theme/motion.ts) ;
 *  - survol (web) : soulèvement de 2 px ;
 *  - `style` accepte un objet ou une fonction ({ pressed, hovered }) comme Pressable ;
 *  - une transformation déjà présente dans le style est conservée ;
 *  - « réduire les animations » : aucun mouvement, seulement l'état final.
 * Le focus clavier visible (web) est assuré par la feuille de style globale (WebInteractionStyles).
 */
import React, { useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, type GestureResponderEvent, type PressableProps, type StyleProp, View, type ViewStyle } from 'react-native';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { linkFrame } from './linkFrame';
import { easing, interaction, timeTo } from '@/theme/motion';

const APressable = Animated.createAnimatedComponent(Pressable);
const IS_WEB = Platform.OS === 'web';

type State = { pressed: boolean; hovered: boolean };
export interface TappableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle> | ((s: State) => StyleProp<ViewStyle>);
  /** Échelle à l'appui (0,97 par défaut ; 1 = aucune réduction, pour les grandes surfaces). */
  pressScale?: number;
  /** Soulèvement au survol en px (web) ; 0 = aucun. */
  hoverLift?: number;
  /** Lien sans cadre (mentions sur une carte ou une photo). Par défaut, un lien est présenté comme un bouton arrondi. */
  bare?: boolean;
}

export const Tappable = React.forwardRef<View, TappableProps>(function Tappable({ style, pressScale = interaction.pressScale, hoverLift = interaction.hoverLift, onPressIn, onPressOut, onHoverIn, onHoverOut, disabled, bare, children, ...rest }, ref) {
  const reduce = useReduceMotion();
  const theme = useTheme();
  const framed = rest.accessibilityRole === 'link' && !bare;
  const press = useRef(new Animated.Value(0)).current;
  const hover = useRef(new Animated.Value(0)).current;
  const dynamic = typeof style === 'function';
  const [state, setState] = useState<State>({ pressed: false, hovered: false });
  const set = (k: keyof State, v: boolean) => { if (dynamic) setState((s) => (s[k] === v ? s : { ...s, [k]: v })); };

  const ownStyle = dynamic ? (style as (s: State) => StyleProp<ViewStyle>)(state) : style;
  const userStyle: StyleProp<ViewStyle> = framed ? [linkFrame(theme.isDark), ownStyle] : ownStyle;
  const flat = (StyleSheet.flatten(userStyle) ?? {}) as ViewStyle;
  const own = [
    { translateY: hover.interpolate({ inputRange: [0, 1], outputRange: [0, hoverLift] }) },
    { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, pressScale] }) },
  ];
  const transform = [...(Array.isArray(flat.transform) ? flat.transform : []), ...own];

  return (
    <APressable
      ref={ref as never}
      {...rest}
      disabled={disabled}
      style={[userStyle as object, { transform } as object]}
      onPressIn={(e: GestureResponderEvent) => { set('pressed', true); timeTo(press, 1, interaction.pressInMs, reduce, easing.standard).start(); onPressIn?.(e); }}
      onPressOut={(e: GestureResponderEvent) => { set('pressed', false); timeTo(press, 0, interaction.pressOutMs, reduce, easing.decelerate).start(); onPressOut?.(e); }}
      onHoverIn={(e) => { set('hovered', true); if (IS_WEB && !disabled) timeTo(hover, 1, interaction.hoverMs, reduce, easing.standard).start(); onHoverIn?.(e); }}
      onHoverOut={(e) => { set('hovered', false); if (IS_WEB) timeTo(hover, 0, interaction.hoverMs, reduce, easing.standard).start(); onHoverOut?.(e); }}
    >
      {children as React.ReactNode}
    </APressable>
  );
});
