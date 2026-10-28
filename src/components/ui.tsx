/** Primitives d'interface du design system « Au fil de nous ». */
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
import { linkFrame } from './linkFrame';
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
  const press = usePressMotion({ pressed: 0.985, hoverLift: -1 });
  const tilt = useTilt(1);
  const bg = {
    surface: t.colors.surface,
    soft: t.isDark ? 'rgba(231,192,143,0.10)' : 'rgba(250,234,223,0.7)',
    lavender: t.isDark ? 'rgba(195,178,255,0.12)' : 'rgba(225,215,255,0.6)',
    night: '#1E0F1A',
    gold: t.isDark ? 'rgba(231,192,143,0.14)' : 'rgba(240,215,180,0.55)',
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
 * Bouton unique de l'application (refonte 2026 : sobre, net, cohérent).
 * Hiérarchie : primary (plein), secondary (fond discret + liseré), outline (liseré couleur), ghost (sans fond),
 * danger (= destructive), night (mode nuit). Tailles sm / md / lg ; hauteur minimale, jamais fixe : un libellé long
 * passe à la ligne. Forme pilule ; bouton principal en dégradé cuivre doré avec reflet, secondaire en verre dépoli
 * au liseré champagne (refonte « moderne et élégante » du 26/10/2026), ombres chaudes et diffuses.
 * États : survol (web, 180 ms : voile de couleur), appui (enfoncement 0,98 + voile plus marqué), focus clavier
 * (anneau global, src/components/WebInteractionStyles.tsx), désactivé (atténué, sans ombre), chargement
 * (indicateur à la place du libellé, sans changement de taille). « Réduire les animations » : états immédiats.
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

/** Proportions du système de boutons (une seule source). */
export const BUTTON = {
  height: { sm: 40, md: 50, lg: 56 },
  padX: { sm: 16, md: 24, lg: 28 },
  radius: { sm: 20, md: 25, lg: 28 }, // pilule (moitié de la hauteur)
  font: { sm: 14, md: 15, lg: 16 },
  icon: { sm: 15, md: 17, lg: 18 },
  pressScale: 0.98,
  hoverMs: 180,
  pressInMs: 110,
  pressOutMs: 200,
};

/** Liseré discret, dérivé de la couleur du texte du thème (aucune nouvelle couleur). */
export const hairline = (isDark: boolean) => (isDark ? 'rgba(240,217,207,0.18)' : 'rgba(135,83,63,0.16)');
/** Dégradé des boutons principaux : reflet doré en haut, cuivre au centre, plus profond en bas. */
export const PRIMARY_GRADIENT = (isDark: boolean): [string, string, string] => (isDark ? ['#F3D4A6', '#E7C08F', '#D6A874'] : ['#9C6650', '#87533F', '#764533']);

/** Seules les flèches « avancent » de 2 px au survol : un indice de direction, pas un effet. */
const NUDGE: Partial<Record<IconName, 'x' | 'up'>> = { 'arrow-right': 'x', 'chevron-right': 'x', 'external-link': 'up', send: 'x', 'log-in': 'x' };

function useButtonMotion() {
  const reduce = useReduceMotion();
  const press = React.useRef(new Animated.Value(0)).current;
  const hover = React.useRef(new Animated.Value(0)).current;
  return {
    press, hover,
    handlers: {
      onPressIn: () => timeTo(press, 1, BUTTON.pressInMs, reduce, easingStd).start(),
      onPressOut: () => timeTo(press, 0, BUTTON.pressOutMs, reduce, easingStd).start(),
      onHoverIn: () => timeTo(hover, 1, BUTTON.hoverMs, reduce, easingStd).start(),
      onHoverOut: () => timeTo(hover, 0, BUTTON.hoverMs, reduce, easingStd).start(),
    },
  };
}
const easingStd = Easing.bezier(0.2, 0, 0, 1);

export function Button({ label, variant: v = 'primary', icon, iconRight, loading, size = 'md', style, full, disabled, onPress, ...rest }: ButtonProps) {
  const variant = v === 'destructive' ? 'danger' : v;
  const t = useTheme();
  const reduce = useReduceMotion();
  const m = useButtonMotion();
  const [pending, setPending] = React.useState(false);
  const running = React.useRef(false);
  const mounted = React.useRef(true);
  React.useEffect(() => () => { mounted.current = false; }, []);
  const isBusy = !!loading || pending;
  const busy = React.useRef(new Animated.Value(isBusy ? 1 : 0)).current;
  React.useEffect(() => { timeTo(busy, isBusy ? 1 : 0, duration.fast, reduce).start(); }, [busy, isBusy, reduce]);
  const off = !!disabled;
  const solid = variant === 'primary' || variant === 'danger' || variant === 'night';

  const bg = { primary: t.colors.primary, secondary: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,250,246,0.72)', outline: 'transparent', ghost: t.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,250,246,0.5)', danger: t.colors.danger, night: '#D9B48A' }[variant];
  const fg = {
    primary: t.colors.primaryText, secondary: t.colors.text, outline: t.colors.primary, ghost: t.colors.primary,
    danger: t.isDark ? t.colors.primaryText : '#FFFFFF', night: '#141831',
  }[variant];
  const border = { primary: 'transparent', secondary: t.isDark ? 'rgba(240,217,207,0.22)' : 'rgba(184,134,90,0.30)', outline: t.colors.primary, ghost: t.isDark ? 'rgba(240,217,207,0.18)' : 'rgba(184,134,90,0.24)', danger: t.colors.danger, night: '#D9B48A' }[variant];
  // Voile d'état : clair sur les boutons pleins (survol), teinte de la marque sur les boutons transparents
  const veil = solid ? '#FFFFFF' : variant === 'secondary' ? t.colors.text : t.colors.primary;
  const veilHover = solid ? 0.1 : variant === 'secondary' ? 0.05 : 0.08;
  const veilPress = solid ? -1 : variant === 'secondary' ? 0.09 : 0.14; // -1 : assombrir les boutons pleins à l'appui
  const h = BUTTON.height[size];
  const iconSize = BUTTON.icon[size];
  const nudge = (name: IconName) => {
    const k = NUDGE[name];
    if (!k) return undefined;
    const d = m.hover.interpolate({ inputRange: [0, 1], outputRange: [0, 2] });
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
  const radiusPx = BUTTON.radius[size];
  return (
    <Animated.View style={[{ alignSelf: full ? 'stretch' : 'auto', maxWidth: '100%', minWidth: 0, opacity: off ? 0.48 : 1, borderRadius: radiusPx }, style,
      { transform: [{ scale: m.press.interpolate({ inputRange: [0, 1], outputRange: [1, BUTTON.pressScale] }) }] }]}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off || isBusy, busy: isBusy }}
      disabled={off || isBusy}
      hitSlop={size === 'sm' ? 5 : 0}
      onPressIn={m.handlers.onPressIn}
      onPressOut={m.handlers.onPressOut}
      onHoverIn={m.handlers.onHoverIn}
      onHoverOut={m.handlers.onHoverOut}
      onPress={handlePress}
      style={[
        styles.button,
        { minHeight: h, borderRadius: radiusPx, backgroundColor: bg, borderColor: border, paddingHorizontal: BUTTON.padX[size] },
        // Profondeur subtile : ombre courte et douce sur les boutons pleins seulement (aucune ombre désactivé)
        solid && !off && { shadowColor: variant === 'danger' ? t.colors.danger : t.isDark ? '#000000' : '#6B3F2E', shadowOpacity: t.isDark ? 0.3 : 0.24, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
        variant === 'secondary' && !off && { shadowColor: '#6B3F2E', shadowOpacity: t.isDark ? 0 : 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
      ]}
      {...rest}
    >
      {/* Bouton principal : dégradé cuivre doré (or champagne la nuit) */}
      {variant === 'primary' && !off ? <LinearGradient pointerEvents="none" colors={PRIMARY_GRADIENT(t.isDark)} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: radiusPx }]} /> : null}
      {/* Reflet intérieur d'1 px en haut des boutons pleins et du verre */}
      {solid || variant === 'secondary' ? <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: radiusPx * 0.7, right: radiusPx * 0.7, height: 1, backgroundColor: solid ? 'rgba(255,236,214,0.38)' : 'rgba(255,255,255,0.9)' }} /> : null}
      {/* Survol puis appui : voile d'état (sans décalage de mise en page) */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radiusPx - 1, backgroundColor: veil, opacity: m.hover.interpolate({ inputRange: [0, 1], outputRange: [0, veilHover] }) }]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radiusPx - 1, backgroundColor: veilPress < 0 ? '#000000' : veil, opacity: m.press.interpolate({ inputRange: [0, 1], outputRange: [0, veilPress < 0 ? 0.1 : veilPress] }) }]} />
      {/* Chargement : le libellé s'efface en douceur au profit de l'indicateur, à taille constante */}
      <Animated.View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: size === 'sm' ? 6 : 8, flexShrink: 1, minWidth: 0, maxWidth: '100%', opacity: busy.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
        {icon && <Animated.View style={nudge(icon)}><Icon name={icon} size={iconSize} color={fg} /></Animated.View>}
        {label ? (
          <Text weight="bold" color={fg} center style={{ flexShrink: 1, minWidth: 0, fontSize: BUTTON.font[size], lineHeight: BUTTON.font[size] + 6, letterSpacing: 0.1 }}>
            {label}
          </Text>
        ) : null}
        {iconRight && <Animated.View style={nudge(iconRight)}><Icon name={iconRight} size={iconSize} color={fg} /></Animated.View>}
      </Animated.View>
      {isBusy ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', opacity: busy }]}>
          <ActivityIndicator size="small" color={fg} />
        </Animated.View>
      ) : null}
    </Pressable>
    </Animated.View>
  );
}

/**
 * Bouton icône seule (retour, fermer, menu, partager…) : zone tactile de 48 px, pastille visible de 40 px aux coins de
 * 12 px. `plain` : sans fond (fond discret au survol), `filled` : fond discret + liseré, `primary` : plein.
 */
export function IconButton({ icon, label, onPress, color, size = 20, style, tone = 'plain', disabled }: { icon: IconName; label: string; onPress: () => void; color?: string; size?: number; style?: StyleProp<ViewStyle>; tone?: 'plain' | 'filled' | 'primary'; disabled?: boolean }) {
  const t = useTheme();
  const m = useButtonMotion();
  const bg = tone === 'primary' ? t.colors.primary : tone === 'filled' ? t.colors.surface : 'transparent';
  const veil = tone === 'primary' ? '#FFFFFF' : t.colors.text;
  const D = 40;
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
      {...m.handlers}
      hitSlop={6}
      style={[{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: MIN_TOUCH / 2, opacity: disabled ? 0.45 : 1 }, style]}
    >
      <Animated.View style={{ width: D, height: D, borderRadius: D / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg,
        borderWidth: tone === 'filled' ? 1 : 0, borderColor: hairline(t.isDark),
        transform: [{ scale: m.press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }) }] }}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: D / 2, backgroundColor: veil, opacity: Animated.add(
          m.hover.interpolate({ inputRange: [0, 1], outputRange: [0, tone === 'primary' ? 0.12 : 0.07] }),
          m.press.interpolate({ inputRange: [0, 1], outputRange: [0, 0.06] })) }]} />
        <Icon name={icon} size={size} color={color ?? (tone === 'primary' ? t.colors.primaryText : t.colors.text)} />
      </Animated.View>
    </Pressable>
  );
}

/** Bouton d'action flottant (libellé facultatif). Le parent le positionne (position absolue). */
export function Fab({ icon, label, onPress, style, accessibilityHint, showLabel = true }: { icon: IconName; label: string; onPress: () => void; style?: StyleProp<ViewStyle>; accessibilityHint?: string; showLabel?: boolean }) {
  const t = useTheme();
  const press = usePressMotion({ pressed: 0.97, hoverLift: 0 });
  return (
    <Animated.View style={[styles.fab, { backgroundColor: t.colors.primary, shadowColor: t.isDark ? '#000000' : '#6B3F2E' }, style, press.style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        onPress={() => { haptic('light'); onPress(); }}
        {...press.handlers}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, minWidth: 52, justifyContent: 'center', paddingHorizontal: showLabel ? 22 : 0, borderRadius: 26, overflow: 'hidden' }}
      >
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: press.hover.interpolate({ inputRange: [0, 1], outputRange: [0, 0.14] }) }]} />
        <Icon name={icon} size={20} color={t.colors.primaryText} />
        {showLabel ? <Text weight="bold" color={t.colors.primaryText} style={{ flexShrink: 1, fontSize: 15, letterSpacing: -0.15 }}>{label}</Text> : null}
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
  const press = usePressMotion({ pressed: 0.97, hoverLift: 0 });
  const pop = usePop(selected, 1.03);
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
      style={[styles.chip, { borderColor: selected ? active : hairline(t.isDark), backgroundColor: filled ? active : selected ? active + (t.isDark ? '33' : '1F') : t.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,250,246,0.7)' }]}
    >
      {icon && <Icon name={icon} size={15} color={filled ? t.colors.primaryText : selected ? active : t.colors.textMuted} />}
      {label ? <Text variant="small" weight="medium" color={filled ? t.colors.primaryText : selected ? active : t.colors.text} style={{ flexShrink: 1 }}>{label}</Text> : null}
    </Pressable>
    </Animated.View>
  );
}

export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string; testID?: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const [w, setW] = React.useState(0);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const x = React.useRef(new Animated.Value(idx)).current;
  React.useEffect(() => { springTo(x, idx, 'gentle', reduce).start(); }, [x, idx, reduce]);
  const PAD = 4, GAP = 4;
  const segW = w ? (w - PAD * 2 - GAP * (options.length - 1)) / options.length : 0;
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} onLayout={(e) => setW(e.nativeEvent.layout.width)} style={[styles.segmented, { backgroundColor: t.colors.surfaceAlt, borderWidth: 1, borderColor: hairline(t.isDark) }]}>
      {segW > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute', top: PAD, bottom: PAD, left: PAD, width: segW, borderRadius: 999, backgroundColor: t.colors.primary,
            shadowColor: t.isDark ? '#000000' : '#6B3F2E', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
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
            testID={o.testID}
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
      <View style={[styles.input, { borderColor: error ? t.colors.danger : hairline(t.isDark), backgroundColor: t.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,250,246,0.78)' }]}>
        {/* Halo de focus : liseré de la couleur principale qui apparaît en fondu */}
        {!error ? <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -1.5, left: -1.5, right: -1.5, bottom: -1.5, borderRadius: 18, borderWidth: 1.5, borderColor: t.colors.primary, opacity: focus }} /> : null}
        {!error ? <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -5, left: -5, right: -5, bottom: -5, borderRadius: 22, borderWidth: 3, borderColor: t.colors.primary, opacity: focus.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16] }) }} /> : null}
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
        {typeof children === 'string' ? <BannerText text={children} fold={tone === 'info' || tone === 'demo'} accent={c.fg} /> : children}
        {action}
      </View>
    </View>
  );
}

/**
 * Texte d'un bandeau d'information : un long paragraphe est replié sur deux lignes, avec « Lire la suite »
 * pour le déplier (le texte complet reste lu par les lecteurs d'écran). Avertissements et urgences ne sont jamais repliés.
 */
const FOLD_AT = 110;
function BannerText({ text, fold, accent }: { text: string; fold: boolean; accent: string }) {
  const t = useTheme();
  const [open, setOpen] = React.useState(false);
  const long = fold && text.length > FOLD_AT;
  return (
    <>
      <Text variant="small" color={t.colors.text} numberOfLines={long && !open ? 2 : undefined} accessibilityLabel={text}>{text}</Text>
      {long ? (
        <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityLabel={open ? 'Réduire' : 'Lire la suite'} hitSlop={10} style={{ alignSelf: 'flex-start', paddingVertical: 2 }}>
          <Text variant="caption" weight="bold" color={accent}>{open ? 'Réduire' : 'Lire la suite'}</Text>
        </Pressable>
      ) : null}
    </>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const t = useTheme();
  return (
    <View style={styles.sectionTitle}>
      <Text variant="heading" accessibilityRole="header">{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={6} style={({ pressed }) => [linkFrame(t.isDark), { alignSelf: 'center', opacity: pressed ? 0.8 : 1 }]}>
          <Text variant="small" weight="bold" color={t.colors.primary}>{action}</Text>
          <Icon name="chevron-right" size={14} color={t.colors.primary} />
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
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 12, backgroundColor: t.colors.surfaceAlt, opacity: press.hover, marginHorizontal: -8 }]} />
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
  shadow: { shadowColor: '#6B3F2E', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 0 },
  fab: { borderRadius: 26, shadowOpacity: 0.26, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  button: { borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: 8, overflow: 'hidden' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 6, minHeight: 44, maxWidth: '100%', borderRadius: 999, borderWidth: 1 },
  segmented: { flexDirection: 'row', borderRadius: 999, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 44, borderRadius: 999, justifyContent: 'center', paddingHorizontal: 8 },
  input: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, paddingHorizontal: spacing.md + 2, gap: spacing.xs },
  banner: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, alignItems: 'flex-start' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 56, paddingVertical: spacing.xs },
  listIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
