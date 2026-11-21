/**
 * « Personnaliser l'accueil » (référence 01 de la propriétaire) : bouton palette à côté de la cloche, panneau de verre
 * avec les HUIT thèmes en deux colonnes (vignette nacrée, libellé, coche), « Appliquer le thème ».
 *
 *  - Toucher une vignette = APERÇU immédiat de toute l'application (`previewTheme`, jamais enregistré) ;
 *  - « Appliquer le thème » enregistre le choix pour le compte actif (`applyThemePreview`, persistance locale par compte
 *    existante) ; fermer le panneau autrement (voile, geste, retour) rétablit le thème confirmé (`cancelThemePreview`) ;
 *  - la sélection n'est jamais portée par la couleur seule : coche, contour épais, état « coché » annoncé ;
 *  - mouvement : vignette qui se comprime dès l'appui (`usePress`), coche qui apparaît en ressort léger, changement de
 *    couleurs en fondu (voile de fond `Backdrop`) ; immédiat avec Réduire les animations.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { router } from 'expo-router';
import { Glass, GlassIconButton } from '@/components/glass';
import { Sheet, useToast, type SheetPanelProps } from '@/components/Overlays';
import { Button, Text } from '@/components/ui';
import { CheckMark } from '@/motion/CheckMark';
import { ICON_FILL, ICON_STROKE } from '@/brand/icons';
import { motionHaptic, useMotion, usePress } from '@/motion';
import { useUiStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, fonts, radius, spacing, THEME_PICKER, themeFor, type PaletteName } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { alwaysDark, PICKER_THEMES, pickerSelected, swatchInk, swatchOf } from './model';

/** Palette de peintre (grille 24, trait d'encre 1,75 + aplat doux de l'accent, comme les pictogrammes HOMI). */
const PALETTE_PATH = 'M12 3.5a8.5 8.5 0 0 0 0 17c1.1 0 1.75-.8 1.75-1.65 0-.5-.2-.85-.45-1.15-.25-.3-.4-.65-.4-1.05 0-.9.72-1.6 1.6-1.6h1.95A4.55 4.55 0 0 0 21 10.5C21 6.6 17 3.5 12 3.5z';
const PALETTE_DOTS: [number, number][] = [[7.4, 11.6], [9.3, 7.6], [14.2, 7.3], [17.1, 10.6]];

export function PaletteGlyph({ size = 24, color, tone }: { size?: number; color: string; tone?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
      {tone ? <Path d={PALETTE_PATH} fill={tone} fillOpacity={ICON_FILL.inactive} /> : null}
      <Path d={PALETTE_PATH} fill="none" stroke={color} strokeWidth={ICON_STROKE} strokeLinejoin="round" />
      {PALETTE_DOTS.map(([cx, cy]) => <Circle key={cx} cx={cx} cy={cy} r={1.2} fill={color} />)}
    </Svg>
  );
}

/** Bouton palette de l'en-tête de l'accueil : ouvre le panneau. */
export function ThemePickerButton({ size = 44 }: { size?: number }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <GlassIconButton icon="droplet" label={tr('tp.button')} accessibilityHint={tr('tp.buttonHint')} size={size} testID="home-theme"
        renderIcon={(ink, s) => <PaletteGlyph size={s} color={ink} tone={t.colors.primary} />}
        onPress={() => setOpen(true)} />
      <ThemePickerSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ThemeTile({ p, selected, height, onPress }: { p: PaletteName; selected: boolean; height: number; onPress: () => void }) {
  const t = useTheme();
  const m = useMotion();
  const press = usePress({ scale: 0.96, haptic: 'none' });
  const check = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    check.value = m.off ? (selected ? 1 : 0) : m.spring(selected ? 1 : 0, 'rebondLeger');
  }, [selected, m, check]);
  useEffect(() => () => cancelAnimation(check), [check]);
  const checkStyle = useAnimatedStyle(() => ({ opacity: check.value, transform: [{ scale: 0.6 + 0.4 * check.value }] }));
  const own = themeFor('light', p);
  const [a, b] = swatchOf(p);
  const ink = swatchInk(p);
  const name = tr(`v6.palette.${p}` as const);
  const hint = [tr(`v6.palette.${p}.d` as const), alwaysDark(p) ? tr('tp.alwaysDark') : null].filter(Boolean).join('. ');
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, selected }}
      aria-checked={selected}
      accessibilityLabel={name}
      accessibilityHint={hint}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onPress={onPress}
      testID={`theme-${p}`}
      style={styles.tileCell}
    >
      <Animated.View style={[styles.tile, {
        height, borderRadius: radius.lg, borderWidth: selected ? 2.5 : StyleSheet.hairlineWidth,
        // vignette active : liseré lumineux or clair + lueur dorée (référence 01) ; les autres : filet fin
        borderColor: selected ? THEME_PICKER.rim : t.colors.border,
        boxShadow: selected ? [{ offsetX: 0, offsetY: 0, blurRadius: 16, color: THEME_PICKER.rimGlow }, { offsetX: 0, offsetY: 4, blurRadius: 10, color: alpha(t.tokens.shadowColor, 0.16) }] : [{ offsetX: 0, offsetY: 2, blurRadius: 6, color: alpha(t.tokens.shadowColor, 0.1) }],
      }, press.style]}>
        <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        {/* reflet nacré : une vague claire en haut de la vignette (lumière du verre) */}
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 200 100" preserveAspectRatio="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Path d="M0 0H200V22C150 44 110 8 60 30 36 40 16 44 0 40Z" fill={own.tokens.glow.edge} fillOpacity={0.32} />
          <Path d="M0 2H200" stroke={own.tokens.glow.edge} strokeOpacity={0.6} strokeWidth={2} />
        </Svg>
        <Text numberOfLines={2} maxFontSizeMultiplier={1.4} color={ink}
          style={{ position: 'absolute', left: spacing.sm + 2, right: spacing.sm, bottom: spacing.sm, fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 20 }}>{name}</Text>
        {/* second filet, nacré, à l'intérieur du liseré d'or : la lumière du verre sur le bord */}
        {selected ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.lg - 2.5, borderWidth: 1, borderColor: THEME_PICKER.rimInner }]} /> : null}
        <Animated.View pointerEvents="none" style={[styles.check, { backgroundColor: THEME_PICKER.badge, borderColor: THEME_PICKER.badgeRing }, checkStyle]}>
          <CheckMark checked={selected} size={18} color={THEME_PICKER.badgeInk} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export function ThemePickerSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const toast = useToast();
  const { width, height } = useWindowDimensions();
  const preview = useUiStore((s) => s.themePreview);
  const choice = useUiStore((s) => s.palettePreference);
  const profile = useUiStore((s) => s.adaptiveProfile);
  const previewTheme = useUiStore((s) => s.previewTheme);
  const applyPreview = useUiStore((s) => s.applyThemePreview);
  const cancelPreview = useUiStore((s) => s.cancelThemePreview);
  const selected = pickerSelected(preview, choice, profile);
  const tileH = width < 360 || height < 700 ? 70 : 84;
  // fermeture sans validation (voile, geste, retour) : le thème confirmé revient
  const close = () => { cancelPreview(); onClose(); };
  const apply = () => {
    const name = tr(`v6.palette.${selected}` as const);
    if (preview) applyPreview();
    motionHaptic('success');
    onClose();
    if (preview) toast(tr('tp.applied', { name }));
  };
  return (
    <Sheet visible={visible} onClose={close} title={tr('tp.title')} panel={ThemePanel} headerAlign="center" discreetClose>
      <View style={{ gap: spacing.md }} testID="theme-picker">
        {choice === 'adaptive' && !preview ? <Text variant="caption" muted testID="theme-adaptive-note">{tr('tp.adaptive')}</Text> : null}
        <View accessibilityRole="radiogroup" accessibilityLabel={tr('tp.group')} style={styles.grid}>
          {PICKER_THEMES.map((p) => (
            <ThemeTile key={p} p={p} height={tileH} selected={p === selected}
              onPress={() => { if (p !== selected) motionHaptic('selection'); previewTheme(p); }} />
          ))}
        </View>
        {/* petit écran : la consigne cède la place au bouton (le bouton reste visible sans défiler) */}
        {height >= 700 ? <Text variant="caption" muted center>{tr('tp.choiceHint')}</Text> : null}
        <Button label={tr('tp.apply')} full size="lg" onPress={apply} testID="theme-apply" />
        <Button label={tr('tp.more')} variant="link" icon="sliders" style={{ alignSelf: 'center' }} testID="theme-more"
          onPress={() => { cancelPreview(); onClose(); router.push('/settings/appearance'); }} />
      </View>
    </Sheet>
  );
}

/**
 * Panneau de VERRE PLUS MARQUÉ (référence 01) : verre `sheet` + arête lumineuse sur tout le bord haut et reflet
 * clair qui descend du haut du panneau (lueur du thème). Réduire la transparence / nuit : surface opaque (`Glass`),
 * l'arête reste.
 */
function ThemePanel({ testID, radius: r, style, contentStyle, children }: SheetPanelProps) {
  const t = useTheme();
  const edge = t.tokens.glow.edge;
  return (
    <Glass variant="sheet" edges="top" radius={r} testID={testID}
      style={[style, { borderWidth: 1.5, borderBottomWidth: 0, borderColor: alpha(t.tokens.glow.inner, t.isDark ? 0.35 : 0.9) }]} contentStyle={contentStyle}>
      <LinearGradient pointerEvents="none" colors={[alpha(t.tokens.glow.inner, t.isDark ? 0.16 : 0.55), alpha(t.tokens.glow.inner, 0)]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, borderTopLeftRadius: r, borderTopRightRadius: r }} testID="theme-panel-sheen" />
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: r, right: r, height: 1.5, backgroundColor: edge }} />
      {children}
    </Glass>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tileCell: { flexBasis: '46%', flexGrow: 1 },
  tile: { overflow: 'hidden' },
  check: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
