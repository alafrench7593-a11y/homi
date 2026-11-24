/**
 * Primitives d'interface du design system HOMI (règles et jetons : DESIGN_SYSTEM.md, src/theme/tokens.ts).
 * v3 « désert sci-fi » : surfaces mates pour le contenu, verre givré / optique pour les commandes (src/components/surfaces),
 * famille de commandes (src/components/controls), voiles d'état.
 * API stable : ~218 écrans en dépendent ; toute évolution ajoute des options, n'en retire aucune.
 */
import { hapticsMuted } from '@/motion/haptics';
import { CardLens } from './glass/liquid/CardLens';
import { InlineCalendar } from './InlineCalendar';
import { isDarkFill, WhoopSheen } from './stage/WhoopSheen';
import React from 'react';
import {
  ActivityIndicator, Animated, Easing, InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, Text as RNText, TextInput, View,
  type GestureResponderEvent, type PressableProps, type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import ReAnimated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import {
  alpha, bannerColors, cardTintOf, controlSize, fonts, glassOf, linesFor, linesOf, MIN_TOUCH, physicalShadow, primaryGradient, radius, spacing, themes, typeScale, typography,
  type BannerTone, type Theme, type TypographyRole,
} from '@/theme/tokens';
import { GlowCard, type GlowEmphasis } from './GlowCard';
import { ChoiceGroup } from './controls/ChoiceGroup';
import { useMotion } from '@/motion/useMotion';
import { useUiStore } from '@/lib/store';
import { GlassSurface } from './Glass';
import { linkFrame } from './linkFrame';
import { usePop, usePressMotion, useShake } from './Motion';
import { MotionItem, MotionList } from '@/motion/ListMotion';
import { duration, feedback, hapticsSupported, interaction, shakeX, springTo, successPulse, timeTo } from '@/theme/motion';
import { Tappable } from './Tappable';
import { Appear } from './Appear';
import { needsKeyboardAccessory, useKeyboardScope } from './keyboard';
import { t as tr } from '@/i18n';
import { friendlyErrorMessage } from '@/lib/errors';
import { useToast } from './Overlays';
import { cappedScale, useFontScale } from '@/theme/fontScale';

export type IconName = React.ComponentProps<typeof Feather>['name'];

export function haptic(kind: 'light' | 'success' | 'warning' | 'selection' = 'light') {
  // Jamais sur le web ; sur téléphone, seulement si « Vibrations » est actif ; entre 21 h et 7 h (ou en mode nuit), jamais sans accord
  if (!hapticsSupported) return;
  if (hapticsMuted(useUiStore.getState())) return;
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

/**
 * Variante → rôle typographique (tokens.ts) : le plafond d'agrandissement suit le rôle (un titre géant reste dans
 * l'écran avec la plus grande taille de texte du téléphone, le texte courant grandit jusqu'à 1,7×).
 */
const ROLE: Record<Variant, TypographyRole> = { hero: 'display', title: 'headingXL', heading: 'headingM', body: 'bodyM', small: 'bodyS', caption: 'caption', label: 'label' };

const IS_WEB = Platform.OS === 'web';

export function Text({ variant = 'body', muted, color, weight, center, italic, style, intentionalTruncation, ...rest }: AppTextProps) {
  const t = useTheme();
  const display = variant === 'hero' || variant === 'title';
  const family = italic ? fonts.displayItalic : display ? fonts.display : variant === 'heading' ? fonts.displayMedium : weight === 'bold' ? fonts.bodyBold : weight === 'medium' || variant === 'label' ? fonts.bodyMedium : fonts.body;
  const scale = variant === 'label' ? typeScale.small : typeScale[variant];
  const role = typography[ROLE[variant]];
  // Web : le plafond d'agrandissement est publié (data-fsmax) pour l'audit de mise en page, qui simule la taille de
  // texte du téléphone (react-native-web n'applique pas maxFontSizeMultiplier) — voir e2e/audit_ux_detect.js
  const cap = rest.maxFontSizeMultiplier ?? role.maxScale;
  const dataSet = IS_WEB ? (intentionalTruncation ? { truncate: 'intentional', fsmax: String(cap) } : { fsmax: String(cap) }) : intentionalTruncation ? { truncate: 'intentional' } : null;
  return (
    <RNText
      maxFontSizeMultiplier={role.maxScale}
      style={[{ color: color ?? (muted ? t.colors.textMuted : t.colors.text), fontFamily: family, ...scale, textAlign: center ? 'center' : undefined }, variant === 'label' && { letterSpacing: typography.label.letterSpacing }, style]}
      {...(dataSet ? ({ dataSet } as object) : null)}
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
  /**
   * v2 : carte mise en avant (filet lumineux en dégradé + halo, voir GlowCard). `selected` : carte choisie dans un
   * groupe (au repos : contour statique discret) ; `emphasis` : action importante ou moment de validation.
   * À réserver à UN élément à la fois ; jamais pour toutes les cartes d'une liste.
   */
  selected?: boolean;
  emphasis?: GlowEmphasis;
}

export function Card({ children, onPress, tone = 'surface', style, accessibilityLabel, accessibilityHint, padded = true, testID, selected, emphasis }: CardProps) {
  if (selected !== undefined || emphasis) {
    return (
      <GlowCard active={selected ?? true} emphasis={emphasis ?? 'selected'} onPress={onPress} style={style} padded={padded} testID={testID} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint}>
        {children}
      </GlowCard>
    );
  }
  return <PlainCard {...{ children, onPress, tone, style, accessibilityLabel, accessibilityHint, padded, testID }} />;
}

function PlainCard({ children, onPress, tone = 'surface', style, accessibilityLabel, accessibilityHint, padded = true, testID }: CardProps) {
  const t = useTheme();
  const press = usePressMotion({ pressed: 0.985, hoverLift: -1 });
  const tint = cardTintOf(t);
  const bg = {
    surface: t.colors.surface,
    soft: tint.soft,
    lavender: tint.lavender,
    // Carte « nuit » : une scène graphite posée sur la page, même en clair (texte perle dessus)
    night: t.tokens.inverse.fill,
    gold: tint.gold,
    danger: t.colors.dangerSoft,
  }[tone];
  // Verre lisible pour les cartes translucides ; les cartes pleines (nuit, alerte) restent opaques
  const isGlass = tone !== 'night' && tone !== 'danger';
  const content = isGlass ? (
    <GlassSurface
      fill={bg}
      // Cartes teintées : liseré lumineux plus discret (la teinte suffit à les détacher), sans ombre portée
      borderColor={tone === 'surface' ? undefined : glassOf(t).inset.edge}
      depth={onPress ? 2 : 1}
      padded={padded ? spacing.md : 0}
      shadow={tone === 'surface'}
      style={style}
    >
      {children}
    </GlassSurface>
  ) : (
    <View style={[styles.card, { backgroundColor: bg, borderColor: tone === 'danger' ? bannerColors(t).danger.edge : t.tokens.inverse.edge, padding: padded ? spacing.md : 0 },
      t.name !== 'night' && { boxShadow: physicalShadow('low', t.isDark) }, style]}>
      {tone === 'night' && t.name !== 'night' ? <WhoopSheen radius={radius.lg} /> : null}
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
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
    >
      <Animated.View style={press.style}>
        {content}
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------- Bouton
/**
 * Bouton unique de l'application (HOMI v5 « Lumière corail »).
 * Forme : RECTANGLE AUX ANGLES SOUPLES (rayon 14, jamais une capsule), hauteur 52 (md) / 44 (sm) / 56 (lg) ; hauteur
 * minimale, jamais fixe : un libellé long passe à la ligne. Aucun dégradé, aucune ombre épaisse, aucune icône
 * décorative par défaut (une icône n'est affichée que si l'écran la demande).
 * Variantes :
 *  - `primary`   : l'action principale de l'écran — aplat profond (clair : prune ; sombre : corail), texte clair ;
 *  - `onHero`    : action principale posée sur le halo corail (accueil, entrée) — surface claire OPAQUE + texte foncé ;
 *  - `secondary` : sobre, teinte légère (creux) et texte encre ;
 *  - `outline`   : contour fin, texte corail ;
 *  - `ghost`     : sans fond, texte corail ;
 *  - `link`      : lien texte (corail, souligné), cible ≥ 44 pt ;
 *  - `icon`      : icône AVEC libellé visible dessous (tuile carrée, teinte légère) ;
 *  - `danger` (= `destructive`) : rouge d'alerte, texte blanc ; `night` : thème nuit.
 * États : pressé (échelle 0,98 + légère teinte, ressort Reanimated sur le fil UI, haptique légère à l'action) ;
 * survol (web : teinte) ; focus visible (anneau de la couleur de focus, clavier et lecteur d'écran) ; chargement
 * (indicateur à la place du libellé, taille stable, libellé conservé pour l'accessibilité, appuis suivants ignorés) ;
 * succès (coche 900 ms) ; échec (tremblement + message) ; désactivé (fondu à 0,48).
 * Les `onPressIn` / `onPressOut` / `onHoverIn` / `onHoverOut` / `onFocus` / `onBlur` de l'appelant sont COMPOSÉS
 * avec ceux du bouton (ils n'écrasent plus l'animation interne). Cibles ≥ 44 pt (hitSlop en petite taille).
 * Si `onPress` renvoie une promesse, le bouton affiche le chargement jusqu'à la fin (pas de double envoi). La
 * confirmation de réussite reste à l'écran appelant, après la réussite réelle.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'destructive' | 'night' | 'onHero' | 'link' | 'icon';
interface ButtonProps extends Omit<PressableProps, 'style' | 'children' | 'onPress'> {
  label: string;
  /**
   * Libellé court (bouton pleine largeur) : si le libellé complet ne tient pas sur une ligne (petit écran, texte
   * agrandi), le bouton retire d'abord son icône, puis affiche ce libellé. Le lecteur d'écran annonce toujours `label`.
   */
  shortLabel?: string;
  variant?: ButtonVariant;
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
  height: { sm: 44, md: 52, lg: 56 },
  padX: { sm: 16, md: 22, lg: 24 },
  /** Rectangle aux angles souples (v5) : jamais la moitié de la hauteur */
  radius: { sm: 12, md: 14, lg: 16 },
  font: { sm: 14, md: 16, lg: 16 },
  icon: { sm: 16, md: 18, lg: 18 },
  pressScale: 0.98,
  /** Teinte ajoutée à la pression (voile) */
  pressTint: 0.1,
  /** Durée de la coche de succès après une action asynchrone réussie */
  successMs: 900,
  hoverMs: 180,
  pressInMs: 110,
  pressOutMs: 200,
  /** Anneau de focus : épaisseur et écart */
  focusRing: 2,
  focusOffset: 3,
};

/** Liseré discret des contrôles (jeton `lines.*.hairline`). */
export const hairline = (isDark: boolean) => linesFor(isDark).hairline;
export const hairlineOf = (t: Theme) => linesOf(t).hairline;
/** Aplat des boutons principaux (ancien nom : il n'y a plus de dégradé). */
export const PRIMARY_GRADIENT = primaryGradient;

/** Seules les flèches « avancent » de 2 px au survol : un indice de direction, pas un effet. */
const NUDGE: Partial<Record<IconName, 'x' | 'up'>> = { 'arrow-right': 'x', 'chevron-right': 'x', 'external-link': 'up', send: 'x', 'log-in': 'x' };

/**
 * Pression et survol sur le fil UI (Reanimated) : ressort « vif » à l'enfoncement, « doux » au relâchement (pas de
 * rebond sur un contrôle répété des dizaines de fois par jour). Réduire les animations : état immédiat.
 */
function useButtonPress() {
  const m = useMotion();
  const press = useSharedValue(0);
  const hover = useSharedValue(0);
  return {
    press, hover,
    pressIn: () => { press.value = m.spring(1, 'vif'); },
    pressOut: () => { press.value = m.spring(0, 'doux'); },
    hoverIn: () => { hover.value = m.timing(1, BUTTON.hoverMs, 'standard'); },
    hoverOut: () => { hover.value = m.timing(0, BUTTON.hoverMs, 'standard'); },
  };
}
const easingStd = Easing.bezier(0.2, 0, 0, 1);
/** Pression et survol (Animated) des boutons icône : enfoncement court, relâchement en ressort. */
function useButtonMotion() {
  const reduce = useReduceMotion();
  const press = React.useRef(new Animated.Value(0)).current;
  const hover = React.useRef(new Animated.Value(0)).current;
  return {
    press, hover,
    handlers: {
      onPressIn: () => timeTo(press, 1, BUTTON.pressInMs, reduce, easingStd).start(),
      onPressOut: () => springTo(press, 0, 'release', reduce).start(),
      onHoverIn: () => timeTo(hover, 1, BUTTON.hoverMs, reduce, easingStd).start(),
      onHoverOut: () => timeTo(hover, 0, BUTTON.hoverMs, reduce, easingStd).start(),
    },
  };
}
/** Libellés de bouton : retour à la ligne entre les mots seulement (pas de « Plu-tôt »). */
const NO_HYPHENS = (IS_WEB ? { hyphens: 'manual' } : null) as unknown as TextStyle;

/**
 * Étape d'adaptation d'un bouton pleine largeur dont le libellé passe sur plusieurs lignes (logique pure, testée) :
 * 0 = icône + libellé ; 1 = sans icône, marges intérieures réduites ; 2 = libellé court (si fourni) ;
 * 3 = libellé 2 px plus petit (dernier recours, sans libellé court). On n'avance que si le libellé occupe plus d'une
 * ligne ; jamais de retour en arrière tant que la largeur et le libellé ne changent pas.
 */
export const LABEL_STEP_MAX = 3;
export function nextLabelStep(step: number, o: { lines: number; hasIcon: boolean; hasShort: boolean }): number {
  if (o.lines <= 1 || step >= LABEL_STEP_MAX) return step;
  if (step === 0) return 1;
  if (step === 1 && o.hasShort) return 2;
  return LABEL_STEP_MAX;
}

/** Couleurs d'une variante de bouton pour un thème (logique pure, testée par contrast.test.ts). */
export function buttonColors(t: Theme, v: ButtonVariant): { bg: string; fg: string; border: string; veil: string } {
  const lines = linesOf(t);
  const nightC = t.name === 'night' ? t.colors : themes.night.colors;
  switch (v === 'destructive' ? 'danger' : v) {
    case 'primary': return { bg: t.tokens.action.fill, fg: t.tokens.action.text, border: 'transparent', veil: t.tokens.action.text };
    case 'onHero': return { bg: t.tokens.onHero.fill, fg: t.tokens.onHero.text, border: 'transparent', veil: t.tokens.onHero.text };
    case 'secondary': return { bg: lines.controlFill, fg: t.colors.text, border: 'transparent', veil: t.colors.text };
    case 'outline': return { bg: 'transparent', fg: t.colors.primary, border: lines.hairline, veil: t.colors.primary };
    case 'icon': return { bg: lines.controlFill, fg: t.colors.text, border: 'transparent', veil: t.colors.text };
    case 'danger': return { bg: t.colors.danger, fg: t.tokens.text.onAccent, border: 'transparent', veil: t.tokens.text.onAccent };
    case 'night': return { bg: nightC.primary, fg: nightC.primaryText, border: 'transparent', veil: nightC.primaryText };
    case 'ghost':
    case 'link':
    default: return { bg: 'transparent', fg: t.colors.primary, border: 'transparent', veil: t.colors.primary };
  }
}

export function Button({ label, shortLabel, variant: v = 'primary', icon, iconRight, loading, size = 'md', style, full, disabled, onPress,
  onPressIn, onPressOut, onHoverIn, onHoverOut, onFocus, onBlur, hitSlop, ...rest }: ButtonProps) {
  const variant: ButtonVariant = v === 'destructive' ? 'danger' : v;
  const t = useTheme();
  const reduce = useReduceMotion();
  const p = useButtonPress();
  const [pending, setPending] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const toast = useToast();
  const running = React.useRef(false);
  const mounted = React.useRef(true);
  React.useEffect(() => () => { mounted.current = false; }, []);
  const isBusy = !!loading || pending;
  const busy = React.useRef(new Animated.Value(isBusy ? 1 : 0)).current;
  React.useEffect(() => { timeTo(busy, isBusy ? 1 : 0, duration.fast, reduce).start(); }, [busy, isBusy, reduce]);
  const off = !!disabled;
  const link = variant === 'link';
  const tile = variant === 'icon';
  // Libellé trop long pour une ligne (bouton pleine largeur) : sans icône, puis libellé court
  const fontScale = useFontScale();
  // L'étape est liée au libellé : remise à 0 pendant le rendu quand il change (pas dans un effet, qui pouvait annuler
  // une mesure déjà faite). Pas de remise à 0 sur la largeur : la mesure suivante ne viendrait pas si la rangée ne
  // change pas de taille (le libellé resterait sur 2 lignes) ; un bouton qui s'élargit garde sa forme compacte.
  const stepKey = `${label}|${shortLabel ?? ''}`;
  const [lay, setLay] = React.useState({ key: stepKey, step: 0 });
  const step = lay.key === stepKey ? lay.step : 0;
  const adapt = (!!full || size === 'lg') && !tile;
  const lineH = (BUTTON.font[size] + 6 - (step >= 3 ? 2 : 0)) * cappedScale(fontScale, typography.button.maxScale);
  const onLabelLayout = (e: { nativeEvent: { layout: { height: number } } }) => {
    const lines = Math.round(e.nativeEvent.layout.height / lineH);
    setLay((cur) => { const s = cur.key === stepKey ? cur.step : 0; const n = nextLabelStep(s, { lines, hasIcon: !!icon && s === 0, hasShort: !!shortLabel }); return n === s && cur.key === stepKey ? cur : { key: stepKey, step: n }; });
  };
  const shownIcon = step >= 1 ? undefined : icon;
  const shownLabel = step >= 2 && shortLabel ? shortLabel : label;
  // Désactivation (fondu), réussite (respiration) et échec (tremblement) : l'action part toujours tout de suite,
  // ces retours l'accompagnent seulement, après le résultat réel de la promesse.
  const offV = React.useRef(new Animated.Value(off ? 1 : 0)).current;
  React.useEffect(() => { timeTo(offV, off ? 1 : 0, feedback.disabledMs, reduce).start(); }, [offV, off, reduce]);
  const pulse = React.useRef(new Animated.Value(1)).current;
  const shake = React.useRef(new Animated.Value(0)).current;
  const [done, setDone] = React.useState(false);
  const doneV = React.useRef(new Animated.Value(0)).current;
  const hideLabel = React.useMemo(() => Animated.add(busy, doneV).interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: 'clamp' }), [busy, doneV]);
  const c = buttonColors(t, variant);
  const h = link ? MIN_TOUCH - 4 : tile ? 72 : BUTTON.height[size];
  const iconSize = tile ? 22 : BUTTON.icon[size];
  const radiusPx = BUTTON.radius[size];
  const solid = variant === 'primary' || variant === 'danger' || variant === 'night' || variant === 'onHero';

  // Pression : échelle 0,98 (tuile icône : 0,96) + voile de teinte ; survol web : voile plus léger. Fil UI.
  const scaleTo = tile ? 0.96 : BUTTON.pressScale;
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - (1 - scaleTo) * p.press.value }] }));
  const veilStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, p.hover.value * (solid ? 0.08 : 0.05) + p.press.value * BUTTON.pressTint) }));
  const nudgeX = useAnimatedStyle(() => ({ transform: [{ translateX: 2 * p.hover.value }] }));
  const nudgeUp = useAnimatedStyle(() => ({ transform: [{ translateX: 2 * p.hover.value }, { translateY: -2 * p.hover.value }] }));
  const nudge = (name: IconName) => (NUDGE[name] === 'x' ? nudgeX : NUDGE[name] === 'up' ? nudgeUp : undefined);

  const handlePress = (e: GestureResponderEvent) => {
    if (running.current || isBusy) return;
    haptic('light');
    const r = onPress?.(e);
    if (r && typeof (r as Promise<unknown>).then === 'function') {
      running.current = true;
      setPending(true);
      // Une action qui échoue sans gérer son erreur affiche au moins un message (jamais d'échec muet)
      (r as Promise<unknown>)
        .then(() => {
          if (!mounted.current) return;
          successPulse(pulse, reduce).start();
          setDone(true);
          timeTo(doneV, 1, duration.fast, reduce).start();
          setTimeout(() => { if (mounted.current) timeTo(doneV, 0, duration.fast, reduce).start(() => { if (mounted.current) setDone(false); }); }, BUTTON.successMs);
        })
        .catch((err) => { if (!mounted.current) return; haptic('warning'); shakeX(shake, reduce).start(); toast(friendlyErrorMessage(err), 'error'); })
        .finally(() => { running.current = false; if (mounted.current) setPending(false); });
    }
  };
  const labelNode = shownLabel ? (
    <Text weight="bold" color={c.fg} center maxFontSizeMultiplier={typography.button.maxScale}
      style={[{ flexShrink: 1, minWidth: 0, fontSize: tile ? 13 : BUTTON.font[size] - (step >= 3 ? 2 : 0), lineHeight: tile ? 17 : BUTTON.font[size] + 6 - (step >= 3 ? 2 : 0), letterSpacing: 0.1 },
        link && { textDecorationLine: 'underline' }, NO_HYPHENS]}>
      {shownLabel}
    </Text>
  ) : null;
  return (
    <Animated.View style={[{ alignSelf: full ? 'stretch' : 'auto', maxWidth: '100%', minWidth: 0, opacity: offV.interpolate({ inputRange: [0, 1], outputRange: [1, feedback.disabledOpacity] }), borderRadius: radiusPx }, style,
      { transform: [{ translateX: shake }, { scale: pulse }] }]}>
    <Pressable
      accessibilityRole={link ? 'link' : 'button'}
      accessibilityLabel={label}
      accessibilityState={{ disabled: off || isBusy, busy: isBusy }}
      disabled={off || isBusy}
      hitSlop={hitSlop ?? (size === 'sm' || link ? 4 : 0)}
      onPressIn={(e) => { p.pressIn(); onPressIn?.(e); }}
      onPressOut={(e) => { p.pressOut(); onPressOut?.(e); }}
      onHoverIn={(e) => { p.hoverIn(); onHoverIn?.(e); }}
      onHoverOut={(e) => { p.hoverOut(); onHoverOut?.(e); }}
      onFocus={(e) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); onBlur?.(e); }}
      onPress={handlePress}
      {...rest}
    >
      <ReAnimated.View style={[
        styles.button,
        { minHeight: h, borderRadius: radiusPx, backgroundColor: c.bg, borderColor: c.border, borderWidth: variant === 'outline' ? 1 : 0,
          paddingHorizontal: link ? 2 : tile ? spacing.sm : step >= 1 ? BUTTON.padX.sm : BUTTON.padX[size] },
        tile && { flexDirection: 'column', minWidth: 72, paddingVertical: spacing.xs, gap: 4 },
        // Profondeur : seule la variante sur le halo garde une ombre de contact très légère (elle se détache de la lumière)
        variant === 'onHero' && !off && t.name !== 'night' && { boxShadow: physicalShadow('low', t.isDark) },
        pressStyle,
      ]}>
        {/* Aplat NOIR : finition Whoop (profondeur, arête lumineuse, filet d'accent) */}
        {solid && !link && t.name !== 'night' && isDarkFill(c.bg) ? <WhoopSheen radius={radiusPx} /> : null}
        {/* Survol puis appui : voile de teinte (sans décalage de mise en page) */}
        {!link ? <ReAnimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radiusPx, backgroundColor: c.veil }, veilStyle]} /> : null}
        {/* Chargement : le libellé s'efface en douceur au profit de l'indicateur, à taille constante ;
            mesure sur la rangée (View : onLayout fiable sur toutes les plateformes, le web ne le rend pas sur Text) */}
        <Animated.View onLayout={adapt ? onLabelLayout : undefined}
          style={{ flexDirection: tile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: tile ? 4 : size === 'sm' ? 6 : 8, flexShrink: 1, minWidth: 0, maxWidth: '100%', opacity: hideLabel }}>
          {shownIcon && <ReAnimated.View style={nudge(shownIcon)}><Icon name={shownIcon} size={iconSize} color={c.fg} /></ReAnimated.View>}
          {labelNode}
          {iconRight && <ReAnimated.View style={nudge(iconRight)}><Icon name={iconRight} size={iconSize} color={c.fg} /></ReAnimated.View>}
        </Animated.View>
        {isBusy ? (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', opacity: busy }]}>
            <ActivityIndicator size="small" color={c.fg} />
          </Animated.View>
        ) : null}
        {done && !isBusy ? (
          <Animated.View pointerEvents="none" testID="button-success" accessibilityLiveRegion="polite" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', opacity: doneV }]}>
            <Icon name="check" size={iconSize + 3} color={c.fg} />
          </Animated.View>
        ) : null}
      </ReAnimated.View>
      {/* Focus visible (clavier, lecteur d'écran, natif et web) : anneau de la couleur de focus, autour du bouton */}
      {focused ? <View pointerEvents="none" testID="button-focus-ring" style={{ position: 'absolute', top: -BUTTON.focusOffset, left: -BUTTON.focusOffset, right: -BUTTON.focusOffset, bottom: -BUTTON.focusOffset, borderRadius: radiusPx + BUTTON.focusOffset, borderWidth: BUTTON.focusRing, borderColor: t.tokens.focus }} /> : null}
    </Pressable>
    </Animated.View>
  );
}

/**
 * Bouton icône seule (retour, fermer, menu, partager…) : zone tactile de 48 px, pastille visible de 40 px aux coins de
 * 12 px. `plain` : sans fond (fond discret au survol), `filled` : fond discret + liseré, `primary` : plein.
 */
export function IconButton({ icon, label, onPress, color, size = 20, style, tone = 'plain', disabled, testID }: { icon: IconName; label: string; onPress: () => void; color?: string; size?: number; style?: StyleProp<ViewStyle>; tone?: 'plain' | 'filled' | 'primary'; disabled?: boolean; testID?: string }) {
  const t = useTheme();
  const m = useButtonMotion();
  const bg = tone === 'primary' ? t.colors.primary : tone === 'filled' ? linesOf(t).controlFill : 'transparent';
  const veil = tone === 'primary' ? t.colors.primaryText : t.colors.text;
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
      testID={testID}
      style={[{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: MIN_TOUCH / 2, opacity: disabled ? 0.45 : 1 }, style]}
    >
      <Animated.View style={{ width: D, height: D, borderRadius: D / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg,
        borderWidth: tone === 'filled' ? 1 : 0, borderColor: hairlineOf(t),
        transform: [{ scale: m.press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }) }] }}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: D / 2, backgroundColor: veil, opacity: Animated.add(
          m.hover.interpolate({ inputRange: [0, 1], outputRange: [0, tone === 'primary' ? 0.12 : 0.07] }),
          m.press.interpolate({ inputRange: [0, 1], outputRange: [0, 0.06], extrapolate: 'clamp' })) }]} />
        <Icon name={icon} size={size} color={color ?? (tone === 'primary' ? t.colors.primaryText : t.colors.text)} />
      </Animated.View>
    </Pressable>
  );
}

/** Bouton d'action flottant (libellé facultatif). Le parent le positionne (position absolue). */
export function Fab({ icon, label, onPress, style, accessibilityHint, showLabel = true }: { icon: IconName; label: string; onPress: () => void; style?: StyleProp<ViewStyle>; accessibilityHint?: string; showLabel?: boolean }) {
  const t = useTheme();
  const press = usePressMotion({ pressed: 0.97, hoverLift: 0 });
  // Très petits écrans (< 360 px, ex. iPhone SE 1re génération) : icône seule, pour ne pas masquer le contenu
  // (onglets, filtres) ; le libellé reste annoncé par le lecteur d'écran.
  const { width } = useWindowDimensions();
  const withLabel = showLabel && width >= 360;
  return (
    <Animated.View style={[styles.fab, { backgroundColor: t.tokens.action.fill }, t.name !== 'night' && { boxShadow: physicalShadow('mid', t.isDark) }, style, press.style]}>
      {/* Élément flottant : aplat de l'action principale (v5 : rectangle aux angles souples, ombre très légère) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        onPress={() => { haptic('light'); onPress(); }}
        {...press.handlers}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, minWidth: 52, justifyContent: 'center', paddingHorizontal: withLabel ? 20 : 0, borderRadius: radius.md, overflow: 'hidden' }}
      >
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: t.tokens.action.text, opacity: press.hover.interpolate({ inputRange: [0, 1], outputRange: [0, 0.14] }) }]} />
        <Icon name={icon} size={20} color={t.tokens.action.text} />
        {withLabel ? <Text weight="bold" color={t.tokens.action.text} style={{ flexShrink: 1, fontSize: 15, letterSpacing: -0.15 }}>{label}</Text> : null}
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
/**
 * Pastille (`Chip`) — RÉSERVÉE aux FILTRES et aux STATUTS (v5) : seule forme en capsule de l'interface avec les
 * pastilles d'état. Au repos : surface + contour fin ; choisie : aplat de l'action (prune en clair, corail en sombre)
 * et texte clair ; `tone="lavender"` : teinte lilas + coche (choix secondaire). Sélection : petite impulsion d'échelle.
 */
export function Chip({ label, selected, onPress, icon, tone, accessibilityLabel, testID }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName; tone?: 'lavender' | 'primary'; accessibilityLabel?: string; testID?: string }) {
  const t = useTheme();
  const lilac = tone === 'lavender';
  const filled = selected && !lilac;
  const press = usePressMotion({ pressed: 0.97, hoverLift: 0 });
  const pop = usePop(selected, 1.03);
  const fg = filled ? t.tokens.action.text : selected ? t.colors.lavender : t.colors.text;
  return (
    <Animated.View style={[{ maxWidth: '100%' }, press.style, pop]}>
    <Pressable
      {...(onPress ? press.handlers : {})}
      accessibilityRole={onPress ? 'checkbox' : 'text'}
      accessibilityState={{ checked: !!selected }}
      aria-checked={onPress ? !!selected : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      // 44 px visibles + 2 px de chaque côté : cible ≥ 48 px sans alourdir les rangées de filtres
      hitSlop={onPress ? { top: 2, bottom: 2 } : undefined}
      onPress={onPress ? () => { haptic('selection'); onPress(); } : undefined}
      style={[styles.chip, {
        borderColor: filled ? t.tokens.action.fill : selected ? alpha(t.colors.lavender, 0.5) : hairlineOf(t),
        backgroundColor: filled ? t.tokens.action.fill : selected ? cardTintOf(t).lavender : t.colors.surface,
      }]}
    >
      {selected && !filled ? <Icon name="check" size={14} color={t.colors.lavender} /> : null}
      {icon && <Icon name={icon} size={15} color={filled ? t.tokens.action.text : selected ? t.colors.lavender : t.colors.textMuted} />}
      {label ? <Text variant="small" weight={selected ? 'bold' : 'medium'} color={fg} style={{ flexShrink: 1 }}>{label}</Text> : null}
    </Pressable>
    </Animated.View>
  );
}

/**
 * Sélecteur capsule (API historique) : délègue à `ChoiceGroup` (v3) — indicateur de verre teinté qui GLISSE vers le
 * choix actif, lumière diffuse derrière lui, coche + gras en plus de la couleur.
 */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string; testID?: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return <ChoiceGroup options={options} value={value} onChange={onChange} label={label} />;
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
  /** Champ date JJ/MM/AAAA : bouton calendrier (déduit du placeholder « JJ/MM/AAAA » si absent) */
  date?: boolean;
}

const noSubscribe = () => () => undefined;
const noVersion = () => 0;

export const Field = React.forwardRef<TextInput, FieldProps>(function Field({ label, hint, error, optional, suffix, style, revealable, secureTextEntry, onFocus, onBlur, date, ...rest }, ref) {
  const t = useTheme();
  // Audit final (23/11/2026) : tout champ JJ/MM/AAAA reçoit un calendrier déplié sous le champ (saisie clavier conservée)
  const isDate = (date ?? rest.placeholder === 'JJ/MM/AAAA') && rest.editable !== false;
  const [calendar, setCalendar] = React.useState(false);
  // Clavier (voir components/keyboard.tsx) : champ gardé visible au focus, « Suivant » passe au champ suivant
  const input = React.useRef<TextInput>(null);
  React.useImperativeHandle(ref, () => input.current as TextInput);
  const scope = useKeyboardScope();
  const editable = rest.editable !== false;
  const singleLine = !rest.multiline && editable;
  const live = React.useRef(editable);
  live.current = editable;
  const entry = React.useMemo(() => ({ ref: input, editable: () => live.current }), []);
  React.useEffect(() => scope?.register(entry), [scope, entry]);
  React.useSyncExternalStore(scope?.subscribe ?? noSubscribe, scope?.version ?? noVersion, noVersion);
  // Sans action propre (pas d'onSubmitEditing ni de comportement imposé), un champ d'une ligne enchaîne sur le suivant ;
  // le dernier affiche « OK » et ferme le clavier
  const chain = !!scope && singleLine && rest.onSubmitEditing == null && rest.blurOnSubmit == null && rest.submitBehavior == null
    && (rest.returnKeyType == null || rest.returnKeyType === 'next');
  const chainProps: Partial<TextInputProps> = chain && scope ? {
    returnKeyType: rest.returnKeyType ?? (scope.isLast(entry) ? 'done' : 'next'),
    submitBehavior: 'submit',
    blurOnSubmit: false,
    onSubmitEditing: () => { void scope.focusNext(input.current); },
  } : {};
  // iPhone : les pavés numériques n'ont pas de touche Retour. Une barre au-dessus du clavier porte « Suivant » (il reste
  // un champ) ou « OK » (dernier champ, ou champ hors portée) et lance le même enchaînement que la touche Retour.
  const accessoryId = `kb${React.useId().replace(/[^A-Za-z0-9]/g, '')}`;
  const accessory = editable && !rest.multiline && rest.inputAccessoryViewID == null && needsKeyboardAccessory(rest.keyboardType, Platform.OS);
  const accessoryNext = !!scope && !scope.isLast(entry);
  const onAccessory = () => { if (scope) void scope.focusNext(input.current); else Keyboard.dismiss(); };
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
      {/* Champ = surface « inset » : un creux de verre au liseré fin, qui s'éclaire au focus (halo prune) */}
      <View style={[styles.input, { borderColor: error ? t.colors.danger : glassOf(t).inset.edge, backgroundColor: focused ? glassOf(t).floating.fill : glassOf(t).inset.fill }, isDate ? styles.inputDate : null]}>
        {/* Halo de focus : liseré de la couleur principale qui apparaît en fondu */}
        {!error ? <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -1.5, left: -1.5, right: -1.5, bottom: -1.5, borderRadius: radius.control + 1.5, borderWidth: 1.5, borderColor: t.colors.primary, opacity: focus }} /> : null}
        {!error ? <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -5, left: -5, right: -5, bottom: -5, borderRadius: radius.control + 5, borderWidth: 3, borderColor: t.colors.primary, opacity: focus.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16] }) }} /> : null}
        <TextInput
          ref={input}
          placeholderTextColor={t.colors.textMuted}
          accessibilityLabel={label}
          accessibilityHint={hint}
          maxFontSizeMultiplier={1.6}
          {...(IS_WEB ? ({ dataSet: { field: '1', fsmax: '1.6' } } as object) : null)}
          // Multiligne : le texte commence en haut du cadre (Android le centrait verticalement)
          style={[{ flex: 1, minWidth: 0, color: t.colors.text, fontFamily: fonts.body, fontSize: 16, minHeight: MIN_TOUCH, paddingVertical: 10 }, rest.multiline ? { textAlignVertical: 'top' } : null, style as StyleProp<TextStyle>]}
          {...rest}
          {...chainProps}
          {...(accessory ? { inputAccessoryViewID: accessoryId } : null)}
          secureTextEntry={secureTextEntry && !shown}
          onFocus={(e) => { setFocused(true); scope?.reveal(input.current); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        />
        {suffix ? <Text muted>{suffix}</Text> : null}
        {isDate ? (
          <Tappable accessibilityRole="button" accessibilityLabel={tr(calendar ? 'cal.close' : 'cal.open', { label })} accessibilityState={{ expanded: calendar }}
            onPress={() => { Keyboard.dismiss(); setCalendar((v) => !v); }} hitSlop={8} pressScale={0.9} hoverLift={0} testID={rest.testID ? `${rest.testID}-calendar` : 'field-calendar'}
            style={{ minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="calendar" size={20} color={calendar ? t.colors.text : t.colors.textMuted} />
          </Tappable>
        ) : null}
        {revealable ? (
          <Tappable
            accessibilityRole="button"
            accessibilityLabel={shown ? tr('common.hidePassword') : tr('common.showPassword')}
            onPress={() => setShown((v) => !v)}
            hitSlop={8}
            pressScale={0.9}
            hoverLift={0}
            style={{ minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name={shown ? 'eye-off' : 'eye'} size={20} color={t.colors.textMuted} />
          </Tappable>
        ) : null}
      </View>
      {isDate && calendar ? (
        <InlineCalendar value={String(rest.value ?? '')} testID={rest.testID ? `${rest.testID}-cal` : undefined}
          onPick={(fr) => { rest.onChangeText?.(fr); setCalendar(false); }} />
      ) : null}
      {error ? (
        // Le message d'erreur glisse en place (en plus du tremblement du champ) ; nouvelle clé = nouvelle apparition
        <Appear key={error} kind="soft" delay={0} duration={duration.base / 1000}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }} accessibilityLiveRegion="polite">
            <Icon name="alert-circle" size={14} color={t.colors.danger} />
            <Text variant="small" color={t.colors.danger} style={{ flex: 1 }}>{error}</Text>
          </View>
        </Appear>
      ) : hint ? (
        <Text variant="small" muted>{hint}</Text>
      ) : null}
      {accessory ? (
        <InputAccessoryView nativeID={accessoryId} backgroundColor={t.colors.surface}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.border }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={accessoryNext ? tr('common.next') : tr('common.ok')}
              onPress={onAccessory}
              hitSlop={6}
              testID="field-accessory"
              style={({ pressed }) => ({ minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
            >
              <Text weight="bold" color={t.colors.primary} maxFontSizeMultiplier={1.4}>{accessoryNext ? tr('common.next') : tr('common.ok')}</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </Animated.View>
  );
});

// ---------------------------------------------------------------- Bandeaux & états
/** Chaque ton de bandeau a son icône : le statut ne repose jamais sur la couleur seule (testé). */
export const BANNER_ICON: Record<BannerTone, IconName> = { info: 'info', warning: 'alert-triangle', danger: 'alert-octagon', demo: 'smartphone', success: 'check-circle' };

/**
 * Bandeau d'information : fond teinté + liseré de la même teinte (jetons `bannerColors`, contraste testé), icône dans
 * une pastille pour un repère visuel net. Le rouge reste réservé aux urgences et aux erreurs.
 */
export function Banner({ tone = 'info', icon, title, children, action }: { tone?: BannerTone; icon?: IconName; title?: string; children?: React.ReactNode; action?: React.ReactNode }) {
  const t = useTheme();
  const c = { ...bannerColors(t)[tone], icon: BANNER_ICON[tone] };
  return (
    <View style={[styles.banner, { backgroundColor: c.bg, borderColor: c.edge }]} accessibilityRole={tone === 'danger' ? 'alert' : undefined}>
      <View style={[styles.bannerIcon, { backgroundColor: t.tokens.surface.veil }]}>
        <Icon name={icon ?? c.icon} size={16} color={c.fg} />
      </View>
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
      <Text variant="small" color={t.colors.text} numberOfLines={long && !open ? 2 : undefined} intentionalTruncation={long && !open} accessibilityLabel={text}>{text}</Text>
      {long ? (
        // cible de 44 px de haut (le web ignore hitSlop), sans décaler la mise en page (marges négatives)
        <Tappable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityLabel={open ? tr('u5.ui.collapse') : tr('u5.ui.read_more')} hitSlop={12} hoverLift={0} style={{ alignSelf: 'flex-start', minHeight: MIN_TOUCH, justifyContent: 'center', marginVertical: -12, paddingRight: spacing.sm }}>
          <Text variant="caption" weight="bold" color={accent}>{open ? tr('u5.ui.collapse') : tr('u5.ui.read_more')}</Text>
        </Tappable>
      ) : null}
    </>
  );
}

/**
 * En-tête de section : titre Space Grotesk (rôle `headingM`), sur-titre facultatif en capitales espacées (`overline`)
 * et sous-titre facultatif en texte secondaire. L'action éventuelle est une vraie pilule (cible ≥ 40 px + hitSlop).
 */
export function SectionTitle({ title, action, onAction, overline, subtitle }: { title: string; action?: string; onAction?: () => void; overline?: string; subtitle?: string }) {
  const t = useTheme();
  const head = <Text variant="heading" accessibilityRole="header" style={{ flexShrink: 1 }}>{title}</Text>;
  return (
    <View style={styles.sectionTitle}>
      {overline || subtitle ? (
        <View style={{ flexShrink: 1, gap: 2 }}>
          {overline ? <Text muted style={[typography.overline, { color: t.colors.textMuted }]} maxFontSizeMultiplier={typography.overline.maxScale}>{overline.toUpperCase()}</Text> : null}
          {head}
          {subtitle ? <Text variant="small" muted>{subtitle}</Text> : null}
        </View>
      ) : head}
      {action && onAction ? (
        <Tappable onPress={onAction} accessibilityRole="button" hitSlop={6} style={({ pressed }) => [linkFrame(t.isDark), { alignSelf: 'center', opacity: pressed ? 0.8 : 1 }]}>
          <Text variant="small" weight="bold" color={t.colors.primary}>{action}</Text>
          <Icon name="chevron-right" size={14} color={t.colors.primary} />
        </Tappable>
      ) : null}
    </View>
  );
}

export function Loading({ label = 'Chargement…' }: { label?: string }) {
  const t = useTheme();
  return (
    <Appear kind="soft" delay={0.12} duration={duration.base / 1000} style={{ padding: spacing.xl, alignItems: 'center', gap: spacing.sm }}>
      <View accessibilityLabel={label} style={{ alignItems: 'center', gap: spacing.sm }}>
        <ActivityIndicator color={t.colors.primary} />
        <Text variant="small" muted>{label}</Text>
      </View>
    </Appear>
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
  // `separator` et non `border` : en clair, le liseré blanc des cartes serait invisible sur le verre blanc
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: linesOf(t).separator, marginVertical: spacing.xs }} />;
}

/**
 * Groupe de liste (v5) : UNE surface aux coins de carte, rangées séparées par des filets fins — remplace les cartes
 * empilées pour les outils, réglages et événements. Titre de groupe facultatif (libellé au-dessus, hors surface).
 * Les rangées (`ListRow`) reçoivent automatiquement le séparateur (pas avant la première).
 */
export function ListGroup({ children, title, footer, testID, style }: { children: React.ReactNode; title?: string; footer?: string; testID?: string; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ gap: spacing.xs }, style]} testID={testID}>
      {title ? <Text variant="label" accessibilityRole="header" style={{ paddingHorizontal: spacing.xxs }}>{title}</Text> : null}
      <View style={{ backgroundColor: t.colors.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border, overflow: 'hidden', boxShadow: physicalShadow('low', t.isDark) }}>
        <CardLens radius={radius.lg} />
        {/* Liste vivante (à la source) : une rangée ajoutée apparaît à sa place, une rangée supprimée se replie */}
        <MotionList>
          {rows.map((row, i) => (
            <MotionItem key={(row as { key?: React.Key }).key ?? i}>
              <ListGroupRowContext.Provider value={{ inGroup: true, first: i === 0 }}>
                {row}
              </ListGroupRowContext.Provider>
            </MotionItem>
          ))}
        </MotionList>
      </View>
      {footer ? <Text variant="caption" muted style={{ paddingHorizontal: spacing.xxs }}>{footer}</Text> : null}
    </View>
  );
}
const ListGroupRowContext = React.createContext<{ inGroup: boolean; first: boolean }>({ inGroup: false, first: true });

/**
 * Rangée de liste (v5) : icône cohérente (même famille, pastille ronde teintée), titre, sous-titre, valeur et/ou
 * chevron. Dans un `ListGroup` : marges intérieures et filet fin au-dessus (aligné sur le texte, pas sur l'icône).
 * `value` : texte à droite (ex. « 3 », « Activé »), chiffres tabulaires. Pression : légère teinte + échelle 0,99.
 */
export function ListRow({ icon, leading, title, subtitle, onPress, right, danger, testID, value, iconColor }: { icon?: IconName; leading?: React.ReactNode; title: string; subtitle?: string; onPress?: () => void; right?: React.ReactNode; danger?: boolean; testID?: string; value?: string; iconColor?: string }) {
  const t = useTheme();
  const g = React.useContext(ListGroupRowContext);
  const hasLead = !!leading || !!icon;
  const inner = (
    <View style={[styles.listRow, g.inGroup && { paddingHorizontal: spacing.md, minHeight: 60 }]}>
      {g.inGroup && !g.first ? <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, left: spacing.md + (hasLead ? 36 + spacing.sm : 0), height: StyleSheet.hairlineWidth, backgroundColor: linesOf(t).separator }} /> : null}
      {leading ? leading : icon && (
        <View style={[styles.listIcon, { backgroundColor: danger ? t.colors.dangerSoft : linesOf(t).iconWell }]}>
          <Icon name={icon} size={18} color={danger ? t.colors.danger : iconColor ?? t.colors.primary} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Text weight="medium" color={danger ? t.colors.danger : undefined}>{title}</Text>
        {subtitle ? <Text variant="small" muted>{subtitle}</Text> : null}
      </View>
      {value ? <Text variant="small" muted style={{ fontVariant: ['tabular-nums'], flexShrink: 0, maxWidth: '40%', textAlign: 'right' }}>{value}</Text> : null}
      {right ?? (onPress ? <Icon name="chevron-right" size={18} color={t.colors.textMuted} /> : null)}
    </View>
  );
  return onPress ? (
    <ListRowPress label={[title, subtitle, value].filter(Boolean).join(', ')} onPress={onPress} testID={testID} inGroup={g.inGroup}>{inner}</ListRowPress>
  ) : testID ? <View testID={testID}>{inner}</View> : inner;
}

function ListRowPress({ label, onPress, children, testID, inGroup }: { label: string; onPress: () => void; children: React.ReactNode; testID?: string; inGroup?: boolean }) {
  const press = usePressMotion({ pressed: 0.99, hoverLift: 0 });
  const t = useTheme();
  const [down, setDown] = React.useState(false);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} testID={testID} onPress={() => { haptic('selection'); onPress(); }} {...press.handlers}
      onPressIn={() => { setDown(true); press.handlers.onPressIn(); }} onPressOut={() => { setDown(false); press.handlers.onPressOut(); }}>
      <Animated.View style={press.style}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: inGroup ? 0 : 12, backgroundColor: t.colors.surfaceAlt, opacity: down ? 1 : press.hover, marginHorizontal: inGroup ? 0 : -8 }]} />
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
      // Cible de 52 × 44 (le web ignore hitSlop) ; le rail visible garde ses 52 × 32
      style={{ width: 52, height: MIN_TOUCH, justifyContent: 'center' }}
    >
      {/* Rail éteint visible sur le verre blanc (l'ancien `border` blanc disparaissait en clair) */}
      <View pointerEvents="none" style={{ width: 52, height: 32, borderRadius: 16, padding: 3, backgroundColor: linesOf(t).track, justifyContent: 'center', overflow: 'hidden' }}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 16, backgroundColor: t.colors.primary, opacity: on, overflow: 'hidden' }]} />
        <Animated.View
          style={{
            width: 26, height: 26, borderRadius: 13, backgroundColor: t.tokens.surface.thumb,
            borderWidth: StyleSheet.hairlineWidth, borderColor: linesOf(t).thumbEdge,
            boxShadow: physicalShadow('low', t.isDark),
            transform: [{ translateX: on.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }, { scaleX: squish.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }],
          }}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1 },
  fab: { borderRadius: radius.md },
  button: { borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: 8, overflow: 'hidden' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 6, minHeight: controlSize.chip, maxWidth: '100%', borderRadius: 999, borderWidth: 1, overflow: 'hidden' },
  segmented: { flexDirection: 'row', borderRadius: 999, padding: 4, gap: 4 },
  // marge intérieure réduite (8 → 4) : à 320 px, 4 options allemandes (« Woche ») ne se coupent plus au milieu du mot
  segment: { flex: 1, minHeight: 44, borderRadius: 999, justifyContent: 'center', paddingHorizontal: 4 },
  input: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.control, paddingHorizontal: spacing.md + 2, gap: spacing.xs },
  // Champ date en demi-largeur (24/11/2026 : « 24/11/202 » coupé) : le bouton calendrier (44 px de cible) sert de marge droite
  inputDate: { paddingRight: 0, paddingLeft: spacing.sm + 2, gap: 0 },
  banner: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, alignItems: 'flex-start', borderWidth: 1 },
  bannerIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: -2 },
  // flexWrap : une action longue (allemand, italien, petit écran) passe sous le titre au lieu de sortir de l'écran
  sectionTitle: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: spacing.sm, rowGap: spacing.xxs, marginTop: spacing.md },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 56, paddingVertical: spacing.xs },
  listIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
