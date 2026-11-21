/**
 * Boutons de verre : `GlassButton`, `GlassIconButton`, `GlassFab` (HOMI_DESIGN_SYSTEM.md § 10).
 *
 * Variantes de `GlassButton` :
 *  - `primary`     : aplat de l'action principale (jeton `action`) sous un reflet de verre — UNE par écran ;
 *  - `secondary`   : verre `chrome`, libellé à l'encre du verre ;
 *  - `tertiary`    : sans surface (libellé à la couleur primaire), pour une action discrète sur fond UNI ;
 *  - `destructive` : aplat d'alerte (supprimer, quitter) — libellé explicite, aucun rebond.
 * États : repos, pressé (compression 0,97 + voile), désactivé (contenu estompé, action ignorée), `loading`
 * (indicateur à la place du libellé, largeur STABLE, appuis ignorés), `success` (coche tracée), `error` (secousse +
 * pictogramme). `state` les impose ; sinon, un `onPress` qui renvoie une promesse les enchaîne tout seul (chargement →
 * succès 900 ms, ou secousse + message), comme le `Button` historique dont il reprend les proportions (`BUTTON`).
 *
 * Pourquoi pas une peau posée sur `Button` (ui.tsx) : son corps animé PEINT son aplat opaque et ses retours passent
 * par l'ancienne API Animated ; le verre demande une sous-couche et les primitives Reanimated (`usePress`, `useShake`,
 * `SuccessCheck`). Les proportions, le texte, les icônes, l'haptique et les messages d'erreur sont partagés.
 *
 * L'opacité n'est JAMAIS posée sur un ancêtre du verre (elle figerait le flou) : seul le contenu s'estompe.
 */
import { HomiIcon, type HomiIconName } from '@/brand/icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, physicalShadow, typography } from '@/theme/tokens';
import { SuccessCheck, usePress, useShake } from '@/motion';
import { friendlyErrorMessage } from '@/lib/errors';
import { t as tr } from '@/i18n';
import { useToast } from '../Overlays';
import { BUTTON, Icon, Text, type IconName } from '../ui';
import { GlassMaterial, glassShadow, useGlass } from './Glass';

export type GlassButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
export type GlassButtonState = 'idle' | 'loading' | 'success' | 'error';
export type GlassButtonSize = 'sm' | 'md' | 'lg';

export interface GlassButtonProps extends Omit<PressableProps, 'style' | 'children' | 'onPress'> {
  label: string;
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  icon?: IconName;
  /** Pictogramme de la famille HOMI à gauche du libellé (prioritaire sur `icon`). */
  glyph?: HomiIconName;
  iconRight?: IconName;
  /** État imposé (sinon déduit de la promesse renvoyée par `onPress`) */
  state?: GlassButtonState;
  full?: boolean;
  onPress?: (e: GestureResponderEvent) => unknown;
  style?: StyleProp<ViewStyle>;
}

/** Couleurs d'une variante (pur, testé par glassContrast.test.ts). `fill` nul = verre ou aucune surface. */
export function glassButtonColors(t: ReturnType<typeof useTheme>, inkText: string, v: GlassButtonVariant): { fill: string | null; fg: string } {
  if (v === 'primary') return { fill: t.tokens.action.fill, fg: t.tokens.action.text };
  if (v === 'destructive') return { fill: t.colors.danger, fg: t.tokens.text.onAccent };
  if (v === 'tertiary') return { fill: null, fg: t.colors.primary };
  return { fill: null, fg: inkText };
}

const DISABLED = 0.45;

export function GlassButton({ label, variant = 'secondary', size = 'md', icon, glyph, iconRight, state: forced, full, disabled, onPress, onPressIn, onPressOut, onFocus, onBlur, style, testID, ...rest }: GlassButtonProps) {
  const t = useTheme();
  const { spec, tier } = useGlass('chrome');
  const toast = useToast();
  const [auto, setAuto] = useState<GlassButtonState>('idle');
  const [focused, setFocused] = useState(false);
  const running = useRef(false);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const state = forced ?? auto;
  const busy = state === 'loading';
  const off = !!disabled;
  const p = usePress({ disabled: off || busy });
  const sh = useShake();
  const prev = useRef(state);
  useEffect(() => {
    if (state === 'error' && prev.current !== 'error') sh.shake();
    prev.current = state;
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const c = glassButtonColors(t, spec.inks.text, variant);
  const solid = c.fill !== null;
  const glass = variant === 'secondary';
  const h = BUTTON.height[size];
  const r = BUTTON.radius[size];
  const veilK = solid ? 0.12 : 1;
  const veilStyle = useAnimatedStyle(() => ({ opacity: p.progress.value * veilK }));

  const handle = (e: GestureResponderEvent) => {
    if (running.current || busy) return;
    const out = onPress?.(e);
    if (forced || !out || typeof (out as Promise<unknown>).then !== 'function') return;
    running.current = true;
    setAuto('loading');
    (out as Promise<unknown>)
      .then(() => {
        if (!alive.current) return;
        setAuto('success');
        setTimeout(() => { if (alive.current) setAuto('idle'); }, BUTTON.successMs);
      })
      .catch((err) => {
        if (!alive.current) return;
        setAuto('error');
        toast(friendlyErrorMessage(err), 'error');
        setTimeout(() => { if (alive.current) setAuto('idle'); }, BUTTON.successMs);
      })
      .finally(() => { running.current = false; });
  };
  const a11yLabel = state === 'loading' ? `${label}, ${tr('glass.state.loading')}` : state === 'success' ? `${label}, ${tr('glass.state.success')}` : state === 'error' ? `${label}, ${tr('glass.state.error')}` : label;
  const shadow = t.name === 'night' || off ? undefined : solid ? physicalShadow('low', t.isDark, t.material.shadowInk) : glass ? glassShadow(spec, tier, true) : undefined;

  return (
    <Animated.View style={[{ alignSelf: full ? 'stretch' : 'auto', maxWidth: '100%', minWidth: 0, borderRadius: r }, style, sh.style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityState={{ disabled: off || busy, busy }}
        disabled={off || busy}
        hitSlop={size === 'sm' ? 4 : 0}
        pressRetentionOffset={16}
        onPressIn={(e) => { p.onPressIn(); onPressIn?.(e); }}
        onPressOut={(e) => { p.onPressOut(); onPressOut?.(e); }}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        onPress={handle}
        testID={testID}
        {...rest}
      >
        <Animated.View testID={testID ? `${testID}-surface` : undefined}
          style={[styles.body, { minHeight: h, borderRadius: r, paddingHorizontal: variant === 'tertiary' ? BUTTON.padX.sm : BUTTON.padX[size], boxShadow: shadow }, solid && { backgroundColor: c.fill as string }, p.style]}>
          {glass ? <GlassMaterial variant="chrome" radius={r} testID={testID ?? 'glass-button'} /> : null}
          {/* Aplat : reflet de verre en haut (lumière), sans toucher au contraste du libellé (testé) */}
          {solid && t.name !== 'night' ? <LinearGradient pointerEvents="none" colors={[spec.highlight[0], spec.highlight[1]]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.sheen, { borderTopLeftRadius: r, borderTopRightRadius: r, opacity: t.isDark ? 1 : 0.34 }]} /> : null}
          {/* Voile d'appui (aucun décalage de mise en page) */}
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, backgroundColor: solid ? c.fg : spec.press }, veilStyle]} />
          <View style={[styles.row, { gap: size === 'sm' ? 6 : 8, opacity: state !== 'idle' ? 0 : off ? DISABLED : 1 }]}>
            {glyph ? <HomiIcon name={glyph} size={BUTTON.icon[size] + 3} color={c.fg} tone={variant === 'primary' ? null : t.colors.primary} />
              : icon ? <Icon name={icon} size={BUTTON.icon[size]} color={c.fg} /> : null}
            <Text weight="bold" color={c.fg} center numberOfLines={2} maxFontSizeMultiplier={typography.button.maxScale}
              style={{ flexShrink: 1, minWidth: 0, fontSize: BUTTON.font[size], lineHeight: BUTTON.font[size] + 6, letterSpacing: 0.1 }}>{label}</Text>
            {iconRight ? <Icon name={iconRight} size={BUTTON.icon[size]} color={c.fg} /> : null}
          </View>
          {state !== 'idle' ? (
            <View pointerEvents="none" accessibilityLiveRegion="polite" testID={testID ? `${testID}-${state}` : `glass-button-${state}`} style={[StyleSheet.absoluteFill, styles.center]}>
              {state === 'loading' ? <ActivityIndicator size="small" color={c.fg} />
                : state === 'success' ? <SuccessCheck visible size={BUTTON.icon[size] + 8} color={c.fg} />
                  : <Icon name="alert-circle" size={BUTTON.icon[size] + 3} color={c.fg} />}
            </View>
          ) : null}
        </Animated.View>
        {focused ? <View pointerEvents="none" testID="glass-button-focus" style={{ position: 'absolute', top: -BUTTON.focusOffset, left: -BUTTON.focusOffset, right: -BUTTON.focusOffset, bottom: -BUTTON.focusOffset, borderRadius: r + BUTTON.focusOffset, borderWidth: BUTTON.focusRing, borderColor: t.tokens.focus }} /> : null}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Bouton icône seule sur verre (retour, fermer, menu…) : disque de 44 pt (cible ≥ 44 pt), nom accessible obligatoire.
 * `plain` : sans verre (icône seule dans la même cible), pour l'intérieur d'une barre déjà en verre.
 */
export function GlassIconButton({ icon, glyph, renderIcon, label, onPress, size = 44, plain, disabled, selected, color, style, testID, accessibilityHint }: {
  icon: IconName;
  /** Pictogramme de la famille HOMI (prioritaire sur `icon`). */
  glyph?: HomiIconName;
  /** Pictogramme dessiné par l'appelant (prioritaire sur `glyph`) : reçoit l'encre du verre et la taille conseillée. */
  renderIcon?: (ink: string, size: number) => React.ReactNode;
  label: string;
  onPress: () => void;
  size?: number;
  plain?: boolean;
  disabled?: boolean;
  selected?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityHint?: string;
}) {
  const t = useTheme();
  const { spec, tier } = useGlass('chrome');
  const p = usePress({ scale: 0.94, disabled });
  const veilStyle = useAnimatedStyle(() => ({ opacity: p.progress.value }));
  const r = size / 2;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, selected: selected || undefined }}
      disabled={disabled}
      hitSlop={Math.max(0, (MIN_TOUCH - size) / 2)}
      pressRetentionOffset={16}
      onPressIn={p.onPressIn}
      onPressOut={p.onPressOut}
      onPress={onPress}
      testID={testID}
      style={[{ width: size, height: size }, style]}
    >
      <Animated.View style={[styles.center, { flex: 1, borderRadius: r, boxShadow: plain || t.name === 'night' ? undefined : glassShadow(spec, tier, true) }, p.style]}>
        {plain ? null : <GlassMaterial variant="chrome" radius={r} testID={testID ?? 'glass-icon-button'} />}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, backgroundColor: spec.press }, veilStyle]} />
        <View style={{ opacity: disabled ? DISABLED : 1 }}>
          {renderIcon ? renderIcon(color ?? spec.inks.text, Math.round(size * 0.52))
            : glyph ? <HomiIcon name={glyph} size={Math.round(size * 0.52)} color={color ?? spec.inks.text} tone={color ?? t.colors.primary} active={!!selected} />
            : <Icon name={icon} size={Math.round(size * 0.46)} color={color ?? spec.inks.text} />}
        </View>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Bouton flottant. `tone="action"` (défaut) : aplat de l'action principale sous reflet — l'action de l'écran ;
 * `tone="glass"` : verre `chrome` (action secondaire flottante). Libellé facultatif ; le parent le positionne
 * (position absolue + zone sûre).
 */
export function GlassFab({ icon, label, showLabel = false, onPress, tone = 'action', size = 56, style, testID, accessibilityHint }: {
  icon: IconName;
  label: string;
  showLabel?: boolean;
  onPress: () => void;
  tone?: 'action' | 'glass';
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityHint?: string;
}) {
  const t = useTheme();
  const { spec, tier } = useGlass('chrome');
  const p = usePress({ scale: 0.95 });
  const veilStyle = useAnimatedStyle(() => ({ opacity: p.progress.value * (tone === 'action' ? 0.14 : 1) }));
  const restShadow = useAnimatedStyle(() => ({ opacity: 1 - p.progress.value }));
  const r = size / 2;
  const fg = tone === 'action' ? t.tokens.action.text : spec.inks.text;
  const night = t.name === 'night';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      pressRetentionOffset={16}
      onPressIn={p.onPressIn}
      onPressOut={p.onPressOut}
      onPress={onPress}
      testID={testID}
      style={[{ minWidth: size, height: size, alignSelf: 'flex-start' }, style]}
    >
      <Animated.View style={[styles.fab, { borderRadius: r, paddingHorizontal: showLabel ? 20 : 0, minWidth: size }, p.style]}>
        {/* Ombre qui évolue : deux calques pré-ombrés fondus l'un dans l'autre (jamais d'ombre animée image par image) */}
        {night ? null : <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, boxShadow: physicalShadow('low', t.isDark, t.material.shadowInk) }]} />}
        {night ? null : <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, boxShadow: glassShadow(spec, tier) }, restShadow]} />}
        {tone === 'action'
          ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, backgroundColor: t.tokens.action.fill, overflow: 'hidden' }]}>
            {night ? null : <LinearGradient colors={[spec.highlight[0], spec.highlight[1]]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.sheen, { opacity: t.isDark ? 1 : 0.34 }]} />}
          </View>
          : <GlassMaterial variant="chrome" radius={r} testID={testID ?? 'glass-fab'} />}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, backgroundColor: tone === 'action' ? fg : spec.press }, veilStyle]} />
        <Icon name={icon} size={24} color={fg} />
        {showLabel ? <Text weight="bold" color={fg} numberOfLines={1} maxFontSizeMultiplier={typography.button.maxScale} style={{ fontSize: 16, lineHeight: 22 }}>{label}</Text> : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexShrink: 1, minWidth: 0, maxWidth: '100%', paddingVertical: 8 },
  center: { alignItems: 'center', justifyContent: 'center' },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '55%' },
  fab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
