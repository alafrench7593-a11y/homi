/** Primitives d'interface du design system « Toi & Moi ». */
import React from 'react';
import {
  ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text as RNText, TextInput, View,
  type PressableProps, type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, NACRE, radius, spacing, typeScale } from '@/theme/tokens';
import { useUiStore } from '@/lib/store';

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
  variant?: Variant;
  muted?: boolean;
  color?: string;
  weight?: 'regular' | 'medium' | 'bold';
  center?: boolean;
  italic?: boolean;
}

export function Text({ variant = 'body', muted, color, weight, center, italic, style, ...rest }: AppTextProps) {
  const t = useTheme();
  const display = variant === 'hero' || variant === 'title';
  const family = italic ? fonts.displayItalic : display ? fonts.display : variant === 'heading' ? fonts.displayMedium : weight === 'bold' ? fonts.bodyBold : weight === 'medium' || variant === 'label' ? fonts.bodyMedium : fonts.body;
  const scale = variant === 'label' ? typeScale.small : typeScale[variant];
  return (
    <RNText
      maxFontSizeMultiplier={1.7}
      style={[{ color: color ?? (muted ? t.colors.textMuted : t.colors.text), fontFamily: family, ...scale, textAlign: center ? 'center' : undefined }, variant === 'label' && { letterSpacing: 0.5 }, style]}
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
}

export function Card({ children, onPress, tone = 'surface', style, accessibilityLabel, accessibilityHint, padded = true }: CardProps) {
  const t = useTheme();
  const bg = {
    surface: t.colors.surface,
    soft: t.isDark ? 'rgba(255,134,168,0.12)' : 'rgba(255,214,226,0.62)',
    lavender: t.isDark ? 'rgba(195,178,255,0.12)' : 'rgba(225,215,255,0.6)',
    night: '#1E0F1A',
    gold: t.isDark ? 'rgba(255,179,138,0.12)' : 'rgba(255,226,200,0.6)',
    danger: t.colors.dangerSoft,
  }[tone];
  const content = (
    <View style={[styles.card, { backgroundColor: bg, borderColor: tone === 'surface' ? t.colors.border : 'transparent', padding: padded ? spacing.md : 0 }, !t.isDark && tone === 'surface' && styles.shadow, style]}>
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={() => {
        haptic('selection');
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.985 : 1 }], opacity: pressed ? 0.92 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

// ---------------------------------------------------------------- Bouton
interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'night';
  icon?: IconName;
  loading?: boolean;
  size?: 'md' | 'lg' | 'sm';
  style?: StyleProp<ViewStyle>;
  full?: boolean;
}

export function Button({ label, variant = 'primary', icon, loading, size = 'md', style, full, disabled, onPress, ...rest }: ButtonProps) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const [w, setW] = React.useState(0);
  const shine = React.useRef(new Animated.Value(0)).current;
  const sweep = () => {
    if (reduce || !w) return;
    shine.setValue(0);
    Animated.timing(shine, { toValue: 1, duration: 650, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
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
    : { primary: t.colors.primaryText, secondary: t.colors.text, ghost: t.colors.primary, danger: '#fff', night: '#1A0A13' }[variant];
  const bg = glass ? 'transparent' : { primary: t.colors.primary, secondary: 'transparent', ghost: 'transparent', danger: t.colors.danger, night: '#FF8FB1' }[variant];
  const border = glass
    ? variant === 'primary' ? (t.isDark ? '#FFFFFF' : 'rgba(255,255,255,0.65)') : t.isDark ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.95)'
    : { primary: t.colors.primary, secondary: t.colors.border, ghost: 'transparent', danger: t.colors.danger, night: '#FF8FB1' }[variant];
  const h = size === 'lg' ? 58 : size === 'sm' ? 40 : MIN_TOUCH + 2;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      hitSlop={size === 'sm' ? 6 : 0}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onPressIn={sweep}
      onPress={(e) => {
        haptic('light');
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.button,
        { minHeight: h, backgroundColor: bg, borderColor: border, overflow: 'hidden', opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }], alignSelf: full ? 'stretch' : 'auto', paddingHorizontal: size === 'sm' ? spacing.sm : spacing.lg },
        glass && variant === 'primary' && { shadowColor: t.isDark ? '#FFC2D6' : '#E9587C', shadowOpacity: t.isDark ? 0.35 : 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
        style,
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
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={size === 'sm' ? 16 : 19} color={fg} />}
          <Text variant={size === 'sm' ? 'small' : 'body'} weight="bold" color={fg} numberOfLines={2} center style={{ letterSpacing: -0.2 }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, color, size = 22, style }: { icon: IconName; label: string; onPress: () => void; color?: string; size?: number; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptic('selection');
        onPress();
      }}
      hitSlop={8}
      style={({ pressed }) => [{ width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? t.colors.surfaceAlt : 'transparent' }, style]}
    >
      <Icon name={icon} size={size} color={color ?? t.colors.text} />
    </Pressable>
  );
}

// ---------------------------------------------------------------- Pastilles
export function Chip({ label, selected, onPress, icon, tone }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName; tone?: 'lavender' | 'primary' }) {
  const t = useTheme();
  const active = tone === 'lavender' ? t.colors.lavender : t.colors.primary;
  const filled = selected && tone !== 'lavender';
  return (
    <Pressable
      accessibilityRole={onPress ? 'checkbox' : 'text'}
      accessibilityState={{ checked: !!selected }}
      accessibilityLabel={label}
      onPress={onPress ? () => { haptic('selection'); onPress(); } : undefined}
      style={[styles.chip, { borderColor: selected ? active : t.isDark ? t.colors.border : 'transparent', backgroundColor: filled ? active : selected ? active + (t.isDark ? '33' : '1F') : t.colors.surface }]}
    >
      {icon && <Icon name={icon} size={15} color={filled ? t.colors.primaryText : selected ? active : t.colors.textMuted} />}
      {label ? <Text variant="small" weight="medium" color={filled ? t.colors.primaryText : selected ? active : t.colors.text}>{label}</Text> : null}
    </Pressable>
  );
}

export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  const t = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.segmented, { backgroundColor: t.colors.surfaceAlt }]}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: sel }}
            onPress={() => { haptic('selection'); onChange(o.value); }}
            style={[styles.segment, sel && { backgroundColor: t.colors.primary }]}
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
}

export const Field = React.forwardRef<TextInput, FieldProps>(function Field({ label, hint, error, optional, suffix, style, ...rest }, ref) {
  const t = useTheme();
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label">
        {label}
        {optional ? <Text variant="small" muted>{'  '}(facultatif)</Text> : null}
      </Text>
      <View style={[styles.input, { borderColor: error ? t.colors.danger : focused ? t.colors.primary : t.colors.border, backgroundColor: t.colors.surface }]}>
        <TextInput
          ref={ref}
          placeholderTextColor={t.colors.textMuted}
          accessibilityLabel={label}
          accessibilityHint={hint}
          maxFontSizeMultiplier={1.6}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          style={[{ flex: 1, color: t.colors.text, fontFamily: fonts.body, fontSize: 16, minHeight: MIN_TOUCH, paddingVertical: 10 }, style as StyleProp<TextStyle>]}
          {...rest}
        />
        {suffix ? <Text muted>{suffix}</Text> : null}
      </View>
      {error ? (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }} accessibilityLiveRegion="polite">
          <Icon name="alert-circle" size={14} color={t.colors.danger} />
          <Text variant="small" color={t.colors.danger}>{error}</Text>
        </View>
      ) : hint ? (
        <Text variant="small" muted>{hint}</Text>
      ) : null}
    </View>
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
  const message = error instanceof Error ? error.message : 'Une erreur est survenue.';
  return (
    <Banner tone="danger" title="Impossible d’afficher ces informations" action={onRetry ? <Button label="Réessayer" size="sm" variant="secondary" onPress={onRetry} style={{ marginTop: 8, alignSelf: 'flex-start' }} /> : undefined}>
      {message}
    </Banner>
  );
}

export function Row({ children, gap = spacing.sm, style, wrap }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle>; wrap?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>;
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.colors.border, marginVertical: spacing.xs }} />;
}

export function ListRow({ icon, title, subtitle, onPress, right, danger }: { icon?: IconName; title: string; subtitle?: string; onPress?: () => void; right?: React.ReactNode; danger?: boolean }) {
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
    <Pressable accessibilityRole="button" accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title} onPress={() => { haptic('selection'); onPress(); }} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {inner}
    </Pressable>
  ) : inner;
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => { haptic('selection'); onChange(!value); }}
      hitSlop={8}
      style={{ width: 52, height: 32, borderRadius: 16, padding: 3, backgroundColor: value ? t.colors.primary : t.colors.border, justifyContent: 'center' }}
    >
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignSelf: value ? 'flex-end' : 'flex-start' }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1 },
  shadow: { shadowColor: '#B4507A', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 0 },
  button: { borderRadius: radius.pill, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, minHeight: 40, borderRadius: radius.pill, borderWidth: 1.2 },
  segmented: { flexDirection: 'row', borderRadius: radius.pill, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 40, borderRadius: radius.pill, justifyContent: 'center', paddingHorizontal: 8 },
  input: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: spacing.md, gap: spacing.xs },
  banner: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, alignItems: 'flex-start' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 56, paddingVertical: spacing.xs },
  listIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
