/**
 * Primitives d'interface du design system HOMI (règles et jetons : DESIGN_SYSTEM.md, src/theme/tokens.ts).
 * v3 « désert sci-fi » : surfaces mates pour le contenu, verre givré / optique pour les commandes (src/components/surfaces),
 * famille de commandes (src/components/controls), voiles d'état.
 * API stable : ~218 écrans en dépendent ; toute évolution ajoute des options, n'en retire aucune.
 */
import React from 'react';
import {
  ActivityIndicator, Animated, Easing, Platform, Pressable, StyleSheet, Text as RNText, TextInput, View,
  type GestureResponderEvent, type PressableProps, type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import {
  bannerColors, cardTintOf, controlSize, fonts, glassOf, linesFor, linesOf, MIN_TOUCH, NEUTRALS, physicalShadow, primaryGradient, radius, rgbOf, spacing, stateVeil, themes, tintedShadow, typeScale, typography,
  type BannerTone, type Theme, type TypographyRole,
} from '@/theme/tokens';
import { GlowCard, type GlowEmphasis } from './GlowCard';
import { ChoiceGroup } from './controls/ChoiceGroup';
import { PressSheen, usePressSheen } from '@/motion/PressSheen';
import { useUiStore } from '@/lib/store';
import { GlassSurface } from './Glass';
import { linkFrame } from './linkFrame';
import { usePop, usePressMotion, useShake, useTilt } from './Motion';
import { duration, feedback, hapticsSupported, interaction, shakeX, springTo, successPulse, timeTo } from '@/theme/motion';
import { Tappable } from './Tappable';
import { Appear } from './Appear';
import { useKeyboardScope } from './keyboard';
import { t as tr } from '@/i18n';
import { friendlyErrorMessage } from '@/lib/errors';
import { useToast } from './Overlays';
import { cappedScale, useFontScale } from '@/theme/fontScale';

export type IconName = React.ComponentProps<typeof Feather>['name'];

export function haptic(kind: 'light' | 'success' | 'warning' | 'selection' = 'light') {
  // Jamais sur le web ; sur téléphone, seulement si le réglage « Vibrations » est actif (et pas la nuit sans accord)
  if (!hapticsSupported) return;
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
  const tilt = useTilt(1);
  const tint = cardTintOf(t);
  const bg = {
    surface: t.colors.surface,
    soft: tint.soft,
    lavender: tint.lavender,
    // Carte « nuit » : une scène graphite posée sur la page, même en clair (texte perle dessus)
    night: NEUTRALS.graphite,
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
      sheen={onPress && tilt.enabled ? { x: tilt.rx, y: tilt.ry } : undefined}
      style={style}
    >
      {children}
    </GlassSurface>
  ) : (
    <View style={[styles.card, { backgroundColor: bg, borderColor: tone === 'danger' ? bannerColors(t).danger.edge : 'rgba(255,255,255,0.10)', padding: padded ? spacing.md : 0 },
      t.name !== 'night' && { boxShadow: physicalShadow('low', t.isDark) }, style]}>
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
 * passe à la ligne. Forme pilule ; v3 : bouton principal en VERRE TEINTÉ de la palette (dégradé + lumière interne +
 * reflet d'arête + ombre colorée), secondaire en verre givré / fumé au liseré fin, ombre physique douce.
 * États : survol (web, 180 ms : voile de couleur), appui (enfoncement 0,98 + voile plus marqué), focus clavier
 * (anneau global, src/components/WebInteractionStyles.tsx), désactivé (atténué, sans ombre), chargement
 * (indicateur à la place du libellé, sans changement de taille). « Réduire les animations » : états immédiats.
 * Si `onPress` renvoie une promesse, le bouton affiche le chargement et ignore les appuis suivants jusqu'à la fin
 * (pas de double envoi). La confirmation de réussite reste à l'écran appelant, après la réussite réelle.
 */
interface ButtonProps extends Omit<PressableProps, 'style' | 'children' | 'onPress'> {
  label: string;
  /**
   * Libellé court (bouton pleine largeur) : si le libellé complet ne tient pas sur une ligne (petit écran, texte
   * agrandi), le bouton retire d'abord son icône, puis affiche ce libellé. Le lecteur d'écran annonce toujours `label`.
   */
  shortLabel?: string;
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

/** Liseré discret des contrôles (jeton `lines.*.hairline`) ; `hairlineOf(theme)` suit la palette affichée. */
export const hairline = (isDark: boolean) => linesFor(isDark).hairline;
export const hairlineOf = (t: Theme) => linesOf(t).hairline;
/** Dégradé des boutons principaux de la palette par défaut ; les composants utilisent `t.material.primaryGradient`. */
export const PRIMARY_GRADIENT = primaryGradient;
/** Ombre teintée de la palette affichée (sous les éléments pleins). */
const accentShadow = (t: Theme) => tintedShadow(t.material.accentRgb, t.isDark);

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
      // Relâchement : ressort à léger rebond (retour élastique subtil, quelques millièmes d'échelle)
      onPressOut: () => springTo(press, 0, 'release', reduce).start(),
      onHoverIn: () => timeTo(hover, 1, BUTTON.hoverMs, reduce, easingStd).start(),
      onHoverOut: () => timeTo(hover, 0, BUTTON.hoverMs, reduce, easingStd).start(),
    },
  };
}
const easingStd = Easing.bezier(0.2, 0, 0, 1);
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

export function Button({ label, shortLabel, variant: v = 'primary', icon, iconRight, loading, size = 'md', style, full, disabled, onPress, ...rest }: ButtonProps) {
  const variant = v === 'destructive' ? 'danger' : v;
  const t = useTheme();
  const reduce = useReduceMotion();
  const m = useButtonMotion();
  const [pending, setPending] = React.useState(false);
  const toast = useToast();
  const running = React.useRef(false);
  const mounted = React.useRef(true);
  React.useEffect(() => () => { mounted.current = false; }, []);
  const isBusy = !!loading || pending;
  const busy = React.useRef(new Animated.Value(isBusy ? 1 : 0)).current;
  React.useEffect(() => { timeTo(busy, isBusy ? 1 : 0, duration.fast, reduce).start(); }, [busy, isBusy, reduce]);
  const off = !!disabled;
  // Libellé trop long pour une ligne (bouton pleine largeur) : sans icône, puis libellé court
  const fontScale = useFontScale();
  // L'étape est liée au libellé ET à la largeur : remise à 0 pendant le rendu (pas dans un effet, qui pouvait
  // annuler une mesure déjà faite et laisser le libellé sur 2 lignes)
  const [boxW, setBoxW] = React.useState(0);
  const stepKey = `${label}|${shortLabel ?? ''}|${boxW}`;
  const [lay, setLay] = React.useState({ key: stepKey, step: 0 });
  const step = lay.key === stepKey ? lay.step : 0;
  const adapt = !!full || size === 'lg';
  const lineH = (BUTTON.font[size] + 6 - (step >= 3 ? 2 : 0)) * cappedScale(fontScale, typography.button.maxScale);
  const onLabelLayout = (e: { nativeEvent: { layout: { height: number } } }) => {
    const lines = Math.round(e.nativeEvent.layout.height / lineH);
    setLay((cur) => { const s = cur.key === stepKey ? cur.step : 0; const n = nextLabelStep(s, { lines, hasIcon: !!icon && s === 0, hasShort: !!shortLabel }); return n === s && cur.key === stepKey ? cur : { key: stepKey, step: n }; });
  };
  const shownIcon = step >= 1 ? undefined : icon;
  const shownLabel = step >= 2 && shortLabel ? shortLabel : label;
  // Désactivation animée (fondu), réussite (respiration) et échec (tremblement) : l'action part toujours tout de suite,
  // ces retours l'accompagnent seulement, après le résultat réel de la promesse.
  const offV = React.useRef(new Animated.Value(off ? 1 : 0)).current;
  React.useEffect(() => { timeTo(offV, off ? 1 : 0, feedback.disabledMs, reduce).start(); }, [offV, off, reduce]);
  const pulse = React.useRef(new Animated.Value(1)).current;
  const shake = React.useRef(new Animated.Value(0)).current;
  const solid = variant === 'primary' || variant === 'danger' || variant === 'night';

  const nightC = t.name === 'night' ? t.colors : themes.night.colors;
  const sheen = usePressSheen();
  // Sombre : un bouton plein désactivé devient un verre neutre (la couleur vive atténuée restait le point le plus
  // lumineux de l'écran et semblait active) ; en clair, la teinte atténuée reste lisible comme « pas encore »
  const dimSolid = off && solid && t.isDark;
  const lines = linesOf(t);
  const bg = dimSolid ? lines.controlFill : { primary: t.colors.primary, secondary: linesOf(t).controlFill, outline: 'transparent', ghost: glassOf(t).inset.fill, danger: t.colors.danger, night: nightC.primary }[variant];
  const fg = dimSolid ? t.colors.textMuted : {
    primary: t.colors.primaryText, secondary: t.colors.text, outline: t.colors.primary, ghost: t.colors.primary,
    danger: t.isDark ? t.colors.primaryText : '#FFFFFF', night: nightC.primaryText,
  }[variant];
  const border = dimSolid ? lines.hairline : { primary: 'transparent', secondary: lines.hairline, outline: t.colors.primary, ghost: lines.hairline, danger: t.colors.danger, night: nightC.primary }[variant];
  // Voile d'état : clair sur les boutons pleins (survol), teinte de la marque sur les boutons transparents
  const veil = solid ? '#FFFFFF' : variant === 'secondary' ? t.colors.text : t.colors.primary;
  const veilHover = solid ? stateVeil.hoverSolid : variant === 'secondary' ? stateVeil.hoverGlass : 0.08;
  const veilPress = solid ? -1 : variant === 'secondary' ? stateVeil.pressGlass : stateVeil.pressTint; // -1 : assombrir les boutons pleins à l'appui
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
      // Une action qui échoue sans gérer son erreur affiche au moins un message (jamais d'échec muet)
      (r as Promise<unknown>)
        .then(() => { if (mounted.current) successPulse(pulse, reduce).start(); })
        .catch((err) => { if (!mounted.current) return; haptic('warning'); shakeX(shake, reduce).start(); toast(friendlyErrorMessage(err), 'error'); })
        .finally(() => { running.current = false; if (mounted.current) setPending(false); });
    }
  };
  const radiusPx = BUTTON.radius[size];
  return (
    <Animated.View style={[{ alignSelf: full ? 'stretch' : 'auto', maxWidth: '100%', minWidth: 0, opacity: offV.interpolate({ inputRange: [0, 1], outputRange: [1, dimSolid ? 0.8 : feedback.disabledOpacity] }), borderRadius: radiusPx }, style,
      { transform: [{ translateX: shake }, { scale: m.press.interpolate({ inputRange: [0, 1], outputRange: [1, BUTTON.pressScale] }) }, { scale: pulse }] }]}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off || isBusy, busy: isBusy }}
      disabled={off || isBusy}
      hitSlop={size === 'sm' ? 5 : 0}
      onPressIn={() => { m.handlers.onPressIn(); if (variant === 'primary') sheen.play(); }}
      onPressOut={m.handlers.onPressOut}
      onHoverIn={m.handlers.onHoverIn}
      onHoverOut={m.handlers.onHoverOut}
      onPress={handlePress}
      onLayout={adapt ? (e) => { const w = Math.round(e.nativeEvent.layout.width); setBoxW((cur) => (Math.abs(w - cur) > 2 ? w : cur)); } : undefined}
      style={[
        styles.button,
        { minHeight: h, borderRadius: radiusPx, backgroundColor: bg, borderColor: border, paddingHorizontal: step >= 1 ? BUTTON.padX.sm : BUTTON.padX[size] },
        // Profondeur : ombre teintée sous les boutons pleins (la lumière traverse le prune), ombre physique basse sous
        // le verre ; aucune ombre désactivé ni en mode nuit (calme, rien ne « flotte » à 3 h du matin)
        solid && !off && t.name !== 'night' && { boxShadow: variant === 'danger' ? tintedShadow(rgbOf(t.tokens.status.danger), t.isDark) : accentShadow(t) },
        variant === 'secondary' && !off && t.name !== 'night' && { boxShadow: physicalShadow('low', t.isDark) },
      ]}
      {...rest}
    >
      {/* Bouton principal (capsule) : dégradé de la palette, en diagonale (accent → accent 2) */}
      {variant === 'primary' && !off ? <LinearGradient pointerEvents="none" colors={t.material.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: radiusPx }]} /> : null}
      {/* Verre teinté (v3) : lumière d'en haut à gauche dans l'épaisseur du bouton ; givré pour le secondaire */}
      {(variant === 'primary' || variant === 'secondary') && !off && t.name !== 'night' ? (
        <LinearGradient pointerEvents="none" colors={variant === 'primary' ? [t.isDark ? 'rgba(255,255,255,0.26)' : 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0)'] : [t.material.light.sheen, 'rgba(255,255,255,0)']} start={t.material.light.start} end={variant === 'primary' && !t.isDark ? { x: 0.3, y: 0.45 } : { x: 0.4, y: 0.75 }} style={[StyleSheet.absoluteFill, { borderRadius: radiusPx }]} />
      ) : null}
      {/* Reflet d'arête d'1 px en haut des boutons pleins et du verre (edge highlight) */}
      {solid || variant === 'secondary' ? <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: radiusPx * 0.7, right: radiusPx * 0.7, height: 1, backgroundColor: solid ? 'rgba(255,255,255,0.3)' : t.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.95)' }} /> : null}
      {/* Survol puis appui : voile d'état (sans décalage de mise en page) */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radiusPx - 1, backgroundColor: veil, opacity: m.hover.interpolate({ inputRange: [0, 1], outputRange: [0, veilHover] }) }]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radiusPx - 1, backgroundColor: veilPress < 0 ? NEUTRALS.graphite : veil, opacity: m.press.interpolate({ inputRange: [0, 1], outputRange: [0, veilPress < 0 ? stateVeil.pressSolidDarken : veilPress], extrapolate: 'clamp' }) }]} />
      {/* Chargement : le libellé s'efface en douceur au profit de l'indicateur, à taille constante */}
      {/* mesure sur la rangée (View : onLayout fiable sur toutes les plateformes, le web ne le rend pas sur Text) ;
          sa hauteur = celle du libellé (l'icône, 15-18 px, est plus basse qu'une ligne) */}
      <Animated.View onLayout={adapt ? onLabelLayout : undefined}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: size === 'sm' ? 6 : 8, flexShrink: 1, minWidth: 0, maxWidth: '100%', opacity: busy.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
        {shownIcon && <Animated.View style={nudge(shownIcon)}><Icon name={shownIcon} size={iconSize} color={fg} /></Animated.View>}
        {shownLabel ? (
          <Text weight="bold" color={fg} center maxFontSizeMultiplier={typography.button.maxScale}
            style={[{ flexShrink: 1, minWidth: 0, fontSize: BUTTON.font[size] - (step >= 3 ? 2 : 0), lineHeight: BUTTON.font[size] + 6 - (step >= 3 ? 2 : 0), letterSpacing: 0.1 }, NO_HYPHENS]}>
            {shownLabel}
          </Text>
        ) : null}
        {iconRight && <Animated.View style={nudge(iconRight)}><Icon name={iconRight} size={iconSize} color={fg} /></Animated.View>}
      </Animated.View>
      {/* Reflet bref qui glisse sur le bouton principal à la pression (Reanimated, une traversée) */}
      {variant === 'primary' && !off ? <PressSheen sheen={sheen} /> : null}
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
export function IconButton({ icon, label, onPress, color, size = 20, style, tone = 'plain', disabled, testID }: { icon: IconName; label: string; onPress: () => void; color?: string; size?: number; style?: StyleProp<ViewStyle>; tone?: 'plain' | 'filled' | 'primary'; disabled?: boolean; testID?: string }) {
  const t = useTheme();
  const m = useButtonMotion();
  const bg = tone === 'primary' ? t.colors.primary : tone === 'filled' ? linesOf(t).controlFill : 'transparent';
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
    <Animated.View style={[styles.fab, { backgroundColor: t.colors.primary }, t.name !== 'night' && { boxShadow: [...accentShadow(t), ...physicalShadow('high', t.isDark)] }, style, press.style]}>
      {/* Élément flottant le plus haut de la page : même dégradé que le bouton principal, reflet d'arête */}
      {t.name !== 'night' ? <LinearGradient pointerEvents="none" colors={t.material.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 26 }]} /> : null}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 18, right: 18, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        onPress={() => { haptic('light'); onPress(); }}
        {...press.handlers}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, minWidth: 52, justifyContent: 'center', paddingHorizontal: withLabel ? 22 : 0, borderRadius: 26, overflow: 'hidden' }}
      >
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: press.hover.interpolate({ inputRange: [0, 1], outputRange: [0, 0.14] }) }]} />
        <Icon name={icon} size={20} color={t.colors.primaryText} />
        {withLabel ? <Text weight="bold" color={t.colors.primaryText} style={{ flexShrink: 1, fontSize: 15, letterSpacing: -0.15 }}>{label}</Text> : null}
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
      // 44 px visibles + 2 px de chaque côté : cible ≥ 48 px sans alourdir les rangées de filtres
      hitSlop={onPress ? { top: 2, bottom: 2 } : undefined}
      onPress={onPress ? () => { haptic('selection'); onPress(); } : undefined}
      style={[styles.chip, { borderColor: selected ? active : hairlineOf(t), backgroundColor: filled ? active : selected ? active + (t.isDark ? '33' : '1F') : glassOf(t).inset.fill },
        // Pastille choisie : elle se lève (ombre teintée) ; au repos elle reste dans le plan
        filled && t.name !== 'night' && { boxShadow: accentShadow(t) }]}
    >
      {filled && t.name !== 'night' ? <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.8 }} style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} /> : null}
      {selected && !filled ? <Icon name="check" size={14} color={active} /> : null}
      {icon && <Icon name={icon} size={15} color={filled ? t.colors.primaryText : selected ? active : t.colors.textMuted} />}
      {label ? <Text variant="small" weight="medium" color={filled ? t.colors.primaryText : selected ? active : t.colors.text} style={{ flexShrink: 1 }}>{label}</Text> : null}
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
}

const noSubscribe = () => () => undefined;
const noVersion = () => 0;

export const Field = React.forwardRef<TextInput, FieldProps>(function Field({ label, hint, error, optional, suffix, style, revealable, secureTextEntry, onFocus, onBlur, ...rest }, ref) {
  const t = useTheme();
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
      <View style={[styles.input, { borderColor: error ? t.colors.danger : glassOf(t).inset.edge, backgroundColor: focused ? glassOf(t).floating.fill : glassOf(t).inset.fill }]}>
        {/* Halo de focus : liseré de la couleur principale qui apparaît en fondu */}
        {!error ? <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -1.5, left: -1.5, right: -1.5, bottom: -1.5, borderRadius: 18, borderWidth: 1.5, borderColor: t.colors.primary, opacity: focus }} /> : null}
        {!error ? <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -5, left: -5, right: -5, bottom: -5, borderRadius: 22, borderWidth: 3, borderColor: t.colors.primary, opacity: focus.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16] }) }} /> : null}
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
          secureTextEntry={secureTextEntry && !shown}
          onFocus={(e) => { setFocused(true); scope?.reveal(input.current); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        />
        {suffix ? <Text muted>{suffix}</Text> : null}
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
      <View style={[styles.bannerIcon, { backgroundColor: t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)' }]}>
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

export function ListRow({ icon, leading, title, subtitle, onPress, right, danger, testID }: { icon?: IconName; leading?: React.ReactNode; title: string; subtitle?: string; onPress?: () => void; right?: React.ReactNode; danger?: boolean; testID?: string }) {
  const t = useTheme();
  const inner = (
    <View style={[styles.listRow]}>
      {leading ? leading : icon && (
        <View style={[styles.listIcon, { backgroundColor: danger ? t.colors.dangerSoft : linesOf(t).iconWell }]}>
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
      // Rail éteint visible sur le verre blanc (l'ancien `border` blanc disparaissait en clair)
      style={{ width: 52, height: 32, borderRadius: 16, padding: 3, backgroundColor: linesOf(t).track, justifyContent: 'center', overflow: 'hidden' }}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 16, backgroundColor: t.colors.primary, opacity: on, overflow: 'hidden' }]}>
        {/* Interrupteur capsule allumé : dégradé de la palette */}
        {t.name !== 'night' ? <LinearGradient colors={t.material.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
      </Animated.View>
      <Animated.View
        style={{
          width: 26, height: 26, borderRadius: 13, backgroundColor: t.name === 'night' ? t.colors.text : '#FFFFFF',
          borderWidth: StyleSheet.hairlineWidth, borderColor: linesOf(t).thumbEdge,
          boxShadow: physicalShadow('low', t.isDark),
          transform: [{ translateX: on.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }, { scaleX: squish.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }],
        }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1 },
  fab: { borderRadius: 26 },
  button: { borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: 8, overflow: 'hidden' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 6, minHeight: controlSize.chip, maxWidth: '100%', borderRadius: 999, borderWidth: 1, overflow: 'hidden' },
  segmented: { flexDirection: 'row', borderRadius: 999, padding: 4, gap: 4 },
  // marge intérieure réduite (8 → 4) : à 320 px, 4 options allemandes (« Woche ») ne se coupent plus au milieu du mot
  segment: { flex: 1, minHeight: 44, borderRadius: 999, justifyContent: 'center', paddingHorizontal: 4 },
  input: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, paddingHorizontal: spacing.md + 2, gap: spacing.xs },
  banner: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, alignItems: 'flex-start', borderWidth: 1 },
  bannerIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: -2 },
  // flexWrap : une action longue (allemand, italien, petit écran) passe sous le titre au lieu de sortir de l'écran
  sectionTitle: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: spacing.sm, rowGap: spacing.xxs, marginTop: spacing.md },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 56, paddingVertical: spacing.xs },
  listIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
