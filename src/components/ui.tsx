/** Primitives d'interface du design system « Toi & Moi ». */
import { NATIVE_DRIVER } from '@/theme/tokens';
import React from 'react';
import {
  ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text as RNText, TextInput, View,
  type GestureResponderEvent, type PressableProps, type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, NACRE, radius, spacing, typeScale } from '@/theme/tokens';
import { useUiStore } from '@/lib/store';
import { GlassSurface } from './Glass';
import { usePop, usePressMotion, useShake, useTilt } from './Motion';
import { duration, interaction, springTo, timeTo } from '@/theme/motion';
import { t as tr } from '@/i18n';

export type IconName = React.ComponentProps<typeof Feather>['name'];

export function haptic(kind: 'light' | 'success' | 'warning' | 'selection' = 'light') {
  if (!useUiStore.getState().hapticsEnabled || useUiStore.getState().nightMode && !useUiStore.getState().nightVibrations) return;
  try {
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else if (kind === 'selection') Haptics.selectionAsync();
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // retour haptique indisponible (web, simulateur)
  }
}

// ---------------------------------------------------------------- Texte
type Variant = 'hero' | 'title' | 'heading' | 'body' | 'small' | 'caption' | 'label';
interface AppTextProps extends TextProps {
  /** Aperçu volontairement limité (le contenu complet s'ouvre ailleurs) : signalé aux tests de mise en page. */
  intentionalTruncation?: boolean;
  variant?: Variant;
  muted?: boolean;
  color?: string;
  weight?: 'regular' | 'medium' | 'bold';
  center?: boolean;
  italic?: boolean;
}

export function Text({ variant = 'body', muted, color, weight, center, italic, style, intentionalTruncation, ...rest }: AppTextProps) {
  const t = useTheme();
  const display = variant === 'hero' || variant === 'title';
  const family = italic ? fonts.displayItalic : display ? fonts.display : variant === 'heading' ? fonts.displayMedium : weight === 'bold' ? fonts.bodyBold : weight === 'medium' || variant === 'label' ? fonts.bodyMedium : fonts.body;
  const scale = variant === 'label' ? typeScale.small : typeScale[variant];
  return (
    <RNText
      maxFontSizeMultiplier={1.7}
      style={[{ color: color ?? (muted ? t.colors.textMuted : t.colors.text), fontFamily: family, ...scale, textAlign: center ? 'center' : undefined }, variant === 'label' && { letterSpacing: 0.5 }, style]}
      {...(intentionalTruncation ? ({ dataSet: { truncate: 'intentional' } } as object) : null)}
      {...rest}
    />
  );
}

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const t = useTheme();
  return <Feather name={name} size={size} color={color ?? t.colors.text} accessibilityElementsHidden importantForAccessibility="no" />;
}

// ---------------------------------------------------------------- Carte
interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  tone?: 'surface' | 'soft' | 'lavender' | 'night' | 'gold' | 'danger';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  padded?: boolean;
  testID?: string;
}

export function Card({ children, onPress, tone = 'surface', style, accessibilityLabel, accessibilityHint, padded = true, testID }: CardProps) {
  const t = useTheme();
  const press = usePressMotion({ pressed: 0.982, hoverLift: -3 });
  const tilt = useTilt(2.2);
  const bg = {
    surface: t.colors.surface,
    soft: t.isDark ? 'rgba(255,134,168,0.12)' : 'rgba(255,214,226,0.62)',
    lavender: t.isDark ? 'rgba(195,178,255,0.12)' : 'rgba(225,215,255,0.6)',
    night: '#1E0F1A',
    gold: t.isDark ? 'rgba(255,179,138,0.12)' : 'rgba(255,226,200,0.6)',
    danger: t.colors.dangerSoft,
  }[tone];
  // Verre liquide pour les cartes translucides ; les cartes pleines (nuit, alerte) restent opaques
  const glass = tone !== 'night' && tone !== 'danger';
  const content = glass ? (
    <GlassSurface
      fill={bg}
      borderColor={tone === 'surface' ? t.colors.border : 'transparent'}
      depth={onPress ? 2 : 1}
      padded={padded ? spacing.md : 0}
      shadow={tone === 'surface'}
      sheen={onPress && tilt.enabled ? { x: tilt.rx, y: tilt.ry } : undefined}
      style={style}
    >
      {children}
    </GlassSurface>
  ) : (
    <View style={[styles.card, { backgroundColor: bg, borderColor: 'transparent', padding: padded ? spacing.md : 0 }, style]}>
      {children}
    </View>
  );
  if (!onPress) return testID ? <View testID={testID}>{content}</View> : content;
  return (
    <Pressable
      onPress={() => {
        haptic('selection');
        onPress();
      }}
      {...press.handlers}
      onLayout={tilt.onLayout}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
    >
      <Animated.View style={[press.style, tilt.style]} {...(tilt.webHandlers as object)}>
        {content}
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------- Bouton
/**
 * Bouton unique de l'application. Variantes : primary, secondary, outline, ghost, danger (= destructive), night.
 * Tailles sm, md, lg ; hauteur minimale (jamais fixe) : un libellé long passe à la ligne au lieu d'être coupé.
 * Pression 0,97, survol (web) : soulèvement, surface éclairée, icône qui s'anime légèrement.
 * Si `onPress` renvoie une promesse, le bouton affiche le chargement et ignore les appuis suivants jusqu'à la fin
 * (pas de double envoi). La confirmation de réussite reste à l'écran appelant, après la réussite réelle.
 */
interface ButtonProps extends Omit<PressableProps, 'style' | 'children' | 'onPress'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'destructive' | 'night';
  icon?: IconName;
  /** Icône après le libellé (ex. flèche « suivant »). */
  iconRight?: IconName;
  loading?: boolean;
  size?: 'md' | 'lg' | 'sm';
  style?: StyleProp<ViewStyle>;
  full?: boolean;
  onPress?: (e: GestureResponderEvent) => unknown;
}

const NUDGE: Partial<Record<IconName, 'x' | 'up' | 'spin'>> = { 'arrow-right': 'x', 'chevron-right': 'x', 'external-link': 'up', send: 'x', 'log-in': 'x', upload: 'up', download: 'up', plus: 'spin', 'refresh-cw': 'spin' };

export function Button({ label, variant: v = 'primary', icon, iconRight, loading, size = 'md', style, full, disabled, onPress, ...rest }: ButtonProps) {
  const variant = v === 'destructive' ? 'danger' : v;
  const t = useTheme();
  const reduce = useReduceMotion();
  const press = usePressMotion();
  const [w, setW] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const running = React.useRef(false);
  const mounted = React.useRef(true);
  React.useEffect(() => () => { mounted.current = false; }, []);
  const isBusy = !!loading || pending;
  const shine = React.useRef(new Animated.Value(0)).current;
  const busy = React.useRef(new Animated.Value(isBusy ? 1 : 0)).current;
  React.useEffect(() => { timeTo(busy, isBusy ? 1 : 0, duration.fast, reduce).start(); }, [busy, isBusy, reduce]);
  const sweep = () => {
    if (reduce || !w) return;
    shine.setValue(0);
    Animated.timing(shine, { toValue: 1, duration: 650, easing: Easing.out(Easing.ease), useNativeDriver: NATIVE_DRIVER }).start();
  };
  // Verre liquide : primaire perlé (nuit) ou rose (jour), secondaire givré, reflet qui balaie au toucher
  const glass = t.name !== 'night' && (variant === 'primary' || variant === 'secondary');
  const fills: Record<string, [string, string, string]> = {
    primaryDark: ['#FFFFFF', '#FFEAF1', '#F4C9D8'],
    primaryLight: ['#FFA9C2', '#F57A9C', '#E9587C'],
    secondaryDark: ['rgba(255,255,255,0.16)', 'rgba(20,8,24,0.35)', 'rgba(190,170,255,0.14)'],
    secondaryLight: ['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.55)', 'rgba(255,214,228,0.7)'],
  };
  const fill = variant === 'primary' ? (t.isDark ? fills.primaryDark : fills.primaryLight) : t.isDark ? fills.secondaryDark : fills.secondaryLight;
  const fg = glass
    ? variant === 'primary' ? (t.isDark ? '#2A1022' : '#FFFFFF') : t.colors.text
    : { primary: t.colors.primaryText, secondary: t.colors.text, outline: t.colors.primary, ghost: t.colors.primary, danger: '#fff', night: '#1A0A13' }[variant];
  const bg = glass ? 'transparent' : { primary: t.colors.primary, secondary: 'transparent', outline: 'transparent', ghost: 'transparent', danger: t.colors.danger, night: '#FF8FB1' }[variant];
  const border = glass
    ? variant === 'primary' ? (t.isDark ? '#FFFFFF' : 'rgba(255,255,255,0.65)') : t.isDark ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.95)'
    : { primary: t.colors.primary, secondary: t.colors.border, outline: t.colors.primary, ghost: 'transparent', danger: t.colors.danger, night: '#FF8FB1' }[variant];
  const h = size === 'lg' ? 56 : size === 'sm' ? 40 : MIN_TOUCH;
  const iconSize = size === 'sm' ? 16 : 19;
  const nudge = (name: IconName) => {
    const k = NUDGE[name];
    if (!k) return { transform: [{ scale: press.hover.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] };
    if (k === 'spin') return { transform: [{ rotate: press.hover.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) }] };
    const d = press.hover.interpolate({ inputRange: [0, 1], outputRange: [0, interaction.iconNudge] });
    return { transform: k === 'x' ? [{ translateX: d }] : [{ translateX: d }, { translateY: Animated.multiply(d, -1) }] };
  };
  const handlePress = (e: GestureResponderEvent) => {
    if (running.current || isBusy) return;
    haptic('light');
    const r = onPress?.(e);
    if (r && typeof (r as Promise<unknown>).then === 'function') {
      running.current = true;
      setPending(true);
      (r as Promise<unknown>).catch(() => undefined).finally(() => { running.current = false; if (mounted.current) setPending(false); });
    }
  };
  return (
    <Animated.View style={[{ alignSelf: full ? 'stretch' : 'auto', maxWidth: '100%', minWidth: 0, opacity: disabled ? 0.45 : 1 }, style, press.style]}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled || isBusy, busy: isBusy }}
      disabled={disabled || isBusy}
      hitSlop={size === 'sm' ? 6 : 0}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onPressIn={() => { sweep(); press.handlers.onPressIn(); }}
      onPressOut={press.handlers.onPressOut}
      onHoverIn={press.handlers.onHoverIn}
      onHoverOut={press.handlers.onHoverOut}
      onPress={handlePress}
      style={[
        styles.button,
        { minHeight: h, backgroundColor: bg, borderColor: border, overflow: 'hidden', paddingHorizontal: size === 'sm' ? spacing.sm + 2 : size === 'lg' ? spacing.xl : spacing.lg },
        variant === 'ghost' && { paddingHorizontal: size === 'sm' ? spacing.xs + 2 : spacing.sm },
        glass && variant === 'primary' && { shadowColor: t.isDark ? '#FFC2D6' : '#E9587C', shadowOpacity: t.isDark ? 0.35 : 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
        variant === 'danger' && { shadowColor: t.colors.danger, shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      ]}
      {...rest}
    >
      {glass && <LinearGradient colors={fill} start={{ x: 0, y: 0 }} end={variant === 'primary' ? { x: 0, y: 1 } : { x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
      {glass && <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 12, right: 12, height: 1, backgroundColor: 'rgba(255,255,255,0.9)', opacity: variant === 'primary' ? 0.95 : 0.35 }} />}
      {glass && w > 0 && (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -10, bottom: -10, width: w * 0.5, transform: [{ translateX: shine.interpolate({ inputRange: [0, 1], outputRange: [-w * 0.7, w * 1.2] }) }, { rotate: '18deg' }] }}>
          <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}
      {/* Survol (web) : la surface s'illumine légèrement (teinte du bouton pour les variantes transparentes) */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: variant === 'ghost' || variant === 'outline' ? t.colors.primary : 'rgba(255,255,255,1)', opacity: press.hover.interpolate({ inputRange: [0, 1], outputRange: [0, variant === 'ghost' || variant === 'outline' ? 0.1 : 0.14] }) }]} />
      {/* Chargement : le libellé s'efface en douceur au profit de l'indicateur */}
      <Animated.View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, flexShrink: 1, minWidth: 0, maxWidth: '100%', opacity: busy.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ scale: busy.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] }) }] }}>
        {icon && <Animated.View style={nudge(icon)}><Icon name={icon} size={iconSize} color={fg} /></Animated.View>}
        <Text variant={size === 'sm' ? 'small' : 'body'} weight="bold" color={fg} center style={{ flexShrink: 1, minWidth: 0, letterSpacing: -0.2, textShadowColor: glass && variant === 'primary' && !t.isDark ? 'rgba(160,40,80,0.35)' : 'transparent', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } }}>
          {label}
        </Text>
        {iconRight && <Animated.View style={nudge(iconRight)}><Icon name={iconRight} size={iconSize} color={fg} /></Animated.View>}
      </Animated.View>
      {isBusy ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', opacity: busy }]}>
          <ActivityIndicator color={fg} />
        </Animated.View>
      ) : null}
    </Pressable>
    </Animated.View>
  );
}

/** Bouton icône seule (retour, fermer, menu, partager…). `tone="filled"` : pastille de fond visible. */
export function IconButton({ icon, label, onPress, color, size = 22, style, tone = 'plain', disabled }: { icon: IconName; label: string; onPress: () => void; color?: string; size?: number; style?: StyleProp<ViewStyle>; tone?: 'plain' | 'filled' | 'primary'; disabled?: boolean }) {
  const t = useTheme();
  const press = usePressMotion({ pressed: 0.9, hoverLift: 0 });
  const bg = tone === 'primary' ? t.colors.primary : tone === 'filled' ? t.colors.surfaceAlt : 'transparent';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        haptic('light');
        onPress();
      }}
      {...press.handlers}
      hitSlop={8}
      style={[{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, opacity: disabled ? 0.45 : 1 }, style]}
    >
      <Animated.View style={[{ width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }, press.style]}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.pill, backgroundColor: tone === 'primary' ? '#FFFFFF' : t.colors.surfaceAlt, opacity: press.hover.interpolate({ inputRange: [0, 1], outputRange: [0, tone === 'primary' ? 0.16 : 1] }) }]} />
        <Icon name={icon} size={size} color={color ?? (tone === 'primary' ? t.colors.primaryText : t.colors.text)} />
      </Animated.View>
    </Pressable>
  );
}

/** Bouton d'action flottant (libellé facultatif). Le parent le positionne (position absolue). */
export function Fab({ icon, label, onPress, style, accessibilityHint, showLabel = true }: { icon: IconName; label: string; onPress: () => void; style?: StyleProp<ViewStyle>; accessibilityHint?: string; showLabel?: boolean }) {
  const t = useTheme();
  const press = usePressMotion({ hoverLift: -3 });
  return (
    <Animated.View style={[styles.fab, { backgroundColor: t.colors.primary, shadowColor: t.colors.primary }, style, press.style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        onPress={() => { haptic('light'); onPress(); }}
        {...press.handlers}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, minWidth: 52, justifyContent: 'center', paddingHorizontal: showLabel ? 18 : 0, borderRadius: radius.pill, overflow: 'hidden' }}
      >
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: press.hover.interpolate({ inputRange: [0, 1], outputRange: [0, 0.14] }) }]} />
        <Animated.View style={{ transform: [{ rotate: press.hover.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-8deg'] }) }] }}><Icon name={icon} size={20} color={t.colors.primaryText} /></Animated.View>
        {showLabel ? <Text weight="medium" color={t.colors.primaryText} style={{ flexShrink: 1 }}>{label}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Favori (étoile, signet, cœur) : à l'activation, l'icône « saute » et une onde part du centre.
 * L'état affiché suit la donnée réelle (`active`), jamais un état supposé.
 */
export function FavoriteButton({ active, onPress, icon = 'heart', labelOn, labelOff, activeColor }: { active: boolean; onPress: () => void; icon?: IconName; labelOn: string; labelOff: string; activeColor?: string }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const pop = React.useRef(new Animated.Value(1)).current;
  const ring = React.useRef(new Animated.Value(1)).current;
  const prev = React.useRef(active);
  React.useEffect(() => {
    if (active && !prev.current && !reduce) {
      pop.setValue(1.3); springTo(pop, 1, 'pop', reduce).start();
      ring.setValue(0); timeTo(ring, 1, 520, reduce).start();
    }
    prev.current = active;
  }, [active, pop, ring, reduce]);
  const color = active ? (activeColor ?? t.colors.primary) : t.colors.textMuted;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: color, opacity: ring.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.7, 0] }), transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.5] }) }] }} />
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <IconButton icon={icon} label={active ? labelOn : labelOff} color={color} onPress={onPress} />
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------- Pastilles
export function Chip({ label, selected, onPress, icon, tone, accessibilityLabel, testID }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName; tone?: 'lavender' | 'primary'; accessibilityLabel?: string; testID?: string }) {
  const t = useTheme();
  const active = tone === 'lavender' ? t.colors.lavender : t.colors.primary;
  const filled = selected && tone !== 'lavender';
  const press = usePressMotion({ pressed: 0.96, hoverLift: -1 });
  const pop = usePop(selected, 1.07);
  return (
    <Animated.View style={[{ maxWidth: '100%' }, press.style, pop]}>
    <Pressable
      {...(onPress ? press.handlers : {})}
      accessibilityRole={onPress ? 'checkbox' : 'text'}
      accessibilityState={{ checked: !!selected }}
      aria-checked={onPress ? !!selected : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      onPress={onPress ? () => { haptic('selection'); onPress(); } : undefined}
      style={[styles.chip, { borderColor: selected ? active : t.isDark ? t.colors.border : 'transparent', backgroundColor: filled ? active : selected ? active + (t.isDark ? '33' : '1F') : t.colors.surface }]}
    >
      {icon && <Icon name={icon} size={15} color={filled ? t.colors.primaryText : selected ? active : t.colors.textMuted} />}
      {label ? <Text variant="small" weight="medium" color={filled ? t.colors.primaryText : selected ? active : t.colors.text} style={{ flexShrink: 1 }}>{label}</Text> : null}
    </Pressable>
    </Animated.View>
  );
}

export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const [w, setW] = React.useState(0);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const x = React.useRef(new Animated.Value(idx)).current;
  React.useEffect(() => { springTo(x, idx, 'gentle', reduce).start(); }, [x, idx, reduce]);
  const PAD = 4, GAP = 4;
  const segW = w ? (w - PAD * 2 - GAP * (options.length - 1)) / options.length : 0;
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} onLayout={(e) => setW(e.nativeEvent.layout.width)} style={[styles.segmented, { backgroundColor: t.colors.surfaceAlt }]}>
      {segW > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute', top: PAD, bottom: PAD, left: PAD, width: segW, borderRadius: radius.pill, backgroundColor: t.colors.primary,
            shadowColor: t.colors.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
            transform: [{ translateX: x.interpolate({ inputRange: [0, Math.max(1, options.length - 1)], outputRange: [0, (segW + GAP) * Math.max(1, options.length - 1)] }) }],
          }}
        />
      ) : null}
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: sel, checked: sel }}
            aria-checked={sel}
            accessibilityLabel={o.label}
            onPress={() => { haptic('selection'); onChange(o.value); }}
            style={[styles.segment, sel && !segW && { backgroundColor: t.colors.primary }]}
          >
            <Text variant="small" weight={sel ? 'bold' : 'medium'} color={sel ? t.colors.primaryText : t.colors.textMuted} center>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------- Champ de formulaire
interface FieldProps extends TextInputProps {
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  suffix?: string;
  /** Mot de passe : bouton afficher / masquer. */
  revealable?: boolean;
}

export const Field = React.forwardRef<TextInput, FieldProps>(function Field({ label, hint, error, optional, suffix, style, revealable, secureTextEntry, onFocus, onBlur, ...rest }, ref) {
  const t = useTheme();
  const [focused, setFocused] = React.useState(false);
  const [shown, setShown] = React.useState(false);
  const reduce = useReduceMotion();
  const focus = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => { timeTo(focus, focused ? 1 : 0, duration.base, reduce).start(); }, [focus, focused, reduce]);
  const shake = useShake(error);
  return (
    <Animated.View style={[{ gap: 6 }, shake]}>
      <Text variant="label">
        {label}
        {optional ? <Text variant="small" muted>{`  (${tr('common.optional')})`}</Text> : null}
      </Text>
      <View style={[styles.input, { borderColor: error ? t.colors.danger : t.colors.border, backgroundColor: t.colors.surface }]}>
        {/* Halo de focus : liseré de la couleur principale qui apparaît en fondu */}
        {!error ? <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -1.5, left: -1.5, right: -1.5, bottom: -1.5, borderRadius: radius.md, borderWidth: 1.5, borderColor: t.colors.primary, opacity: focus }} /> : null}
        {!error ? <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -5, left: -5, right: -5, bottom: -5, borderRadius: radius.md + 4, borderWidth: 3, borderColor: t.colors.primary, opacity: focus.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16] }) }} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={t.colors.textMuted}
          accessibilityLabel={label}
          accessibilityHint={hint}
          maxFontSizeMultiplier={1.6}
          style={[{ flex: 1, minWidth: 0, color: t.colors.text, fontFamily: fonts.body, fontSize: 16, minHeight: MIN_TOUCH, paddingVertical: 10 }, style as StyleProp<TextStyle>]}
          {...rest}
          secureTextEntry={secureTextEntry && !shown}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        />
        {suffix ? <Text muted>{suffix}</Text> : null}
        {revealable ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shown ? tr('common.hidePassword') : tr('common.showPassword')}
            onPress={() => setShown((v) => !v)}
            hitSlop={8}
            style={{ minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name={shown ? 'eye-off' : 'eye'} size={20} color={t.colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }} accessibilityLiveRegion="polite">
          <Icon name="alert-circle" size={14} color={t.colors.danger} />
          <Text variant="small" color={t.colors.danger} style={{ flex: 1 }}>{error}</Text>
        </View>
      ) : hint ? (
        <Text variant="small" muted>{hint}</Text>
      ) : null}
    </Animated.View>
  );
});

// ---------------------------------------------------------------- Bandeaux & états
export function Banner({ tone = 'info', icon, title, children, action }: { tone?: 'info' | 'warning' | 'danger' | 'demo' | 'success'; icon?: IconName; title?: string; children?: React.ReactNode; action?: React.ReactNode }) {
  const t = useTheme();
  const c = {
    info: { bg: t.isDark ? 'rgba(195,178,255,0.12)' : 'rgba(225,215,255,0.6)', fg: t.colors.lavender, icon: 'info' as IconName },
    warning: { bg: t.isDark ? 'rgba(255,190,120,0.12)' : 'rgba(255,235,200,0.7)', fg: t.isDark ? '#F7C77E' : '#8A5A12', icon: 'alert-triangle' as IconName },
    danger: { bg: t.colors.dangerSoft, fg: t.colors.danger, icon: 'alert-octagon' as IconName },
    demo: { bg: t.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.6)', fg: t.colors.textMuted, icon: 'smartphone' as IconName },
    success: { bg: t.isDark ? 'rgba(159,224,181,0.12)' : 'rgba(210,240,220,0.7)', fg: t.colors.success, icon: 'check-circle' as IconName },
  }[tone];
  return (
    <View style={[styles.banner, { backgroundColor: c.bg }]} accessibilityRole={tone === 'danger' ? 'alert' : undefined}>
      <Icon name={icon ?? c.icon} size={18} color={c.fg} />
      <View style={{ flex: 1, gap: 2 }}>
        {title ? <Text variant="small" weight="bold" color={tone === 'demo' ? t.colors.text : c.fg}>{title}</Text> : null}
        {typeof children === 'string' ? <Text variant="small" color={t.colors.text}>{children}</Text> : children}
        {action}
      </View>
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const t = useTheme();
  return (
    <View style={styles.sectionTitle}>
      <Text variant="heading" accessibilityRole="header">{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="link" hitSlop={10} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}>
          <Text variant="small" weight="medium" color={t.colors.primary}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Loading({ label = 'Chargement…' }: { label?: string }) {
  const t = useTheme();
  return (
    <View style={{ padding: spacing.xl, alignItems: 'center', gap: spacing.sm }} accessibilityLabel={label}>
      <ActivityIndicator color={t.colors.primary} />
      <Text variant="small" muted>{label}</Text>
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : tr('common.error');
  return (
    <Banner tone="danger" title={tr('common.cannotShow')} action={onRetry ? <Button label={tr('common.retry')} size="sm" variant="secondary" onPress={onRetry} style={{ marginTop: 8, alignSelf: 'flex-start' }} /> : undefined}>
      {message}
    </Banner>
  );
}

export function Row({ children, gap = spacing.sm, style, wrap, testID }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle>; wrap?: boolean; testID?: string }) {
  return <View testID={testID} style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>;
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.colors.border, marginVertical: spacing.xs }} />;
}

export function ListRow({ icon, title, subtitle, onPress, right, danger, testID }: { icon?: IconName; title: string; subtitle?: string; onPress?: () => void; right?: React.ReactNode; danger?: boolean; testID?: string }) {
  const t = useTheme();
  const inner = (
    <View style={[styles.listRow]}>
      {icon && (
        <View style={[styles.listIcon, { backgroundColor: danger ? t.colors.dangerSoft : t.colors.surfaceAlt }]}>
          <Icon name={icon} size={18} color={danger ? t.colors.danger : t.colors.text} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight="medium" color={danger ? t.colors.danger : undefined}>{title}</Text>
        {subtitle ? <Text variant="small" muted>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron-right" size={18} color={t.colors.textMuted} /> : null)}
    </View>
  );
  return onPress ? (
    <ListRowPress label={subtitle ? `${title}, ${subtitle}` : title} onPress={onPress} testID={testID}>{inner}</ListRowPress>
  ) : inner;
}

function ListRowPress({ label, onPress, children, testID }: { label: string; onPress: () => void; children: React.ReactNode; testID?: string }) {
  const press = usePressMotion({ pressed: 0.985, hoverLift: 0 });
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} testID={testID} onPress={() => { haptic('selection'); onPress(); }} {...press.handlers}>
      <Animated.View style={press.style}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt, opacity: press.hover, marginHorizontal: -8 }]} />
        {children}
      </Animated.View>
    </Pressable>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const on = React.useRef(new Animated.Value(value ? 1 : 0)).current;
  const squish = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => { springTo(on, value ? 1 : 0, 'pop', reduce).start(); }, [on, value, reduce]);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      aria-checked={value}
      accessibilityLabel={label}
      onPressIn={() => springTo(squish, 1, 'press', reduce).start()}
      onPressOut={() => springTo(squish, 0, 'release', reduce).start()}
      onPress={() => { haptic('selection'); onChange(!value); }}
      hitSlop={8}
      style={{ width: 52, height: 32, borderRadius: 16, padding: 3, backgroundColor: t.colors.border, justifyContent: 'center', overflow: 'hidden' }}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 16, backgroundColor: t.colors.primary, opacity: on }]} />
      <Animated.View
        style={{
          width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff',
          shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
          transform: [{ translateX: on.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }, { scaleX: squish.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }],
        }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1 },
  shadow: { shadowColor: '#B4507A', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 0 },
  fab: { borderRadius: radius.pill, shadowOpacity: 0.32, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  button: { borderRadius: radius.pill, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, minHeight: 44, maxWidth: '100%', borderRadius: radius.pill, borderWidth: 1.2 },
  segmented: { flexDirection: 'row', borderRadius: radius.pill, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 44, borderRadius: radius.pill, justifyContent: 'center', paddingHorizontal: 8 },
  input: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: spacing.md, gap: spacing.xs },
  banner: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, alignItems: 'flex-start' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 56, paddingVertical: spacing.xs },
  listIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
