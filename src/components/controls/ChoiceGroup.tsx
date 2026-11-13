/**
 * Sélecteur HOMI v3 (segmented, choix de membre, durée, catégorie, humeur) — référence « Lightly ».
 *
 *  - `pills` (défaut) : rail en creux, INDICATEUR DE VERRE translucide qui GLISSE vers le choix actif (ressort
 *    « panneau », interruptible), lumière diffuse de la palette derrière l'option active ; la sélection est confirmée
 *    par le texte (gras) ET une coche (dès que la place le permet, ≥ 92 px par option), jamais par la couleur seule.
 *  - `orbs` : rangée d'orbes de verre givré (humeur, membre) ; l'orbe choisi grandit (1,08) avec une lumière diffuse
 *    derrière lui, les autres se resserrent légèrement vers lui (0,94) — les choix « se rapprochent » ; une pastille
 *    à coche confirme le choix, le libellé passe en gras.
 *    `light="travel"` (ajout rétro-compatible, humeur/journal) : UNE seule lumière diffuse se DÉPLACE d'une option à
 *    l'autre (ressort « panneau ») au lieu de s'allumer sous chaque orbe, et les autres orbes glissent de quelques
 *    pixels vers le choix actif (`CHOICE.orbGather`). Défaut `each` : comportement historique inchangé.
 * Accessibilité : `radiogroup` + `radio` (`checked`), libellé du groupe obligatoire, cible ≥ 48 px.
 * Mouvement : `useMotion` — `off` : positions finales immédiates ; `minimal` (nuit) : fondu court, sans rebond.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text as RNText, View, type LayoutChangeEvent } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, fonts, MIN_TOUCH, typography } from '@/theme/tokens';
import { motionHaptic } from '@/motion/haptics';
import { useMotion } from '@/motion/useMotion';

export type ChoiceOption<T extends string> = { value: T; label: string; icon?: React.ComponentProps<typeof Feather>['name']; testID?: string; accessibilityLabel?: string };

/** Largeur minimale d'une option pour afficher la coche en plus du gras (testée). */
export const CHECK_MIN_WIDTH = 92;
export const CHOICE = { pad: 4, gap: 4, orbSize: 52, orbSelected: 1.08, orbOther: 0.94, orbGap: 4, orbGather: 4 } as const;

/** Centre horizontal de l'orbe `i` dans une rangée de largeur `w` (orbes de largeur égale, écart `CHOICE.orbGap`). */
export function orbCenter(i: number, n: number, w: number): number {
  const k = Math.max(1, n);
  const seg = (w - CHOICE.orbGap * (k - 1)) / k;
  return i * (seg + CHOICE.orbGap) + seg / 2;
}
/**
 * Décalage d'un orbe non choisi vers le choix actif (« les choix se rapprochent ») ; 0 sans choix ou pour le choix.
 * `w`/`n` (facultatifs) : largeur de la rangée et nombre d'orbes — le décalage est réduit à la place réellement libre
 * entre l'orbe choisi (agrandi) et ses voisins (resserrés), pour qu'ils ne se chevauchent jamais (écran de 320 px).
 */
export function orbGatherOffset(i: number, selected: number, w?: number, n?: number): number {
  if (selected < 0 || i === selected) return 0;
  let g: number = CHOICE.orbGather;
  if (w && n) {
    const pitch = orbCenter(1, n, w) - orbCenter(0, n, w);
    const need = (CHOICE.orbSize * (CHOICE.orbSelected + CHOICE.orbOther)) / 2 + 2;
    g = Math.max(0, Math.min(g, pitch - need));
  }
  return Math.sign(selected - i) * g;
}

export function ChoiceGroup<T extends string>({ options, value, onChange, label, variant = 'pills', light = 'each', testID }: {
  options: ChoiceOption<T>[];
  value: T | null | undefined;
  onChange: (v: T) => void;
  /** Nom du groupe (lecteurs d'écran) : obligatoire */
  label: string;
  variant?: 'pills' | 'orbs';
  /** `orbs` seulement : `each` (défaut, lumière sous l'orbe choisi) ou `travel` (une seule lumière qui se déplace) */
  light?: 'each' | 'travel';
  testID?: string;
}) {
  return variant === 'orbs'
    ? <Orbs options={options} value={value} onChange={onChange} label={label} light={light} testID={testID} />
    : <Pills options={options} value={value} onChange={onChange} label={label} testID={testID} />;
}

function Pills<T extends string>({ options, value, onChange, label, testID }: { options: ChoiceOption<T>[]; value: T | null | undefined; onChange: (v: T) => void; label: string; testID?: string }) {
  const t = useTheme();
  const m = useMotion();
  const night = t.name === 'night';
  const [w, setW] = useState(0);
  const found = options.findIndex((o) => o.value === value);
  const n = Math.max(1, options.length);
  const segW = w ? (w - CHOICE.pad * 2 - CHOICE.gap * (n - 1)) / n : 0;
  const x = useSharedValue(0);
  const placed = useRef(false);
  useEffect(() => {
    if (found < 0 || !segW) return;
    const to = found * (segW + CHOICE.gap);
    x.value = placed.current ? m.spring(to, 'panneau') : to;
    placed.current = true;
  }, [found, segW]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cancelAnimation(x), [x]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const showCheck = segW >= CHECK_MIN_WIDTH;
  const g = t.material.glass.inset;
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} testID={testID} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
      style={[styles.rail, { backgroundColor: g.fill, borderColor: g.edge }]}>
      {segW > 0 && found >= 0 ? (
        <Animated.View pointerEvents="none" testID="choice-indicator"
          style={[{ position: 'absolute', top: CHOICE.pad, bottom: CHOICE.pad, left: CHOICE.pad, width: segW, borderRadius: 999, overflow: 'hidden', backgroundColor: night ? t.colors.primary : t.colors.primary,
            boxShadow: night ? undefined : [{ offsetX: 0, offsetY: 6, blurRadius: 18, spreadDistance: -2, color: alpha(t.tokens.accent.glow[0], t.isDark ? 0.45 : 0.4) }] }, indicator]}>
          {/* pastille de verre teinté : dégradé de la palette, reflet haut, arête claire */}
          {!night ? <LinearGradient colors={t.material.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
          {!night ? <LinearGradient colors={['rgba(255,255,255,0.32)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} style={StyleSheet.absoluteFill} /> : null}
          {!night ? <View style={{ position: 'absolute', top: 0, left: 12, right: 12, height: 1, backgroundColor: 'rgba(255,255,255,0.55)' }} /> : null}
        </Animated.View>
      ) : null}
      {options.map((o) => {
        const sel = o.value === value;
        const color = sel ? t.colors.primaryText : t.colors.textMuted;
        return (
          <Pressable key={o.value} accessibilityRole="radio" accessibilityState={{ selected: sel, checked: sel }} aria-checked={sel}
            accessibilityLabel={o.accessibilityLabel ?? o.label} testID={o.testID}
            onPress={() => { motionHaptic('selection'); onChange(o.value); }} hitSlop={{ top: 4, bottom: 4 }}
            style={[styles.segment, sel && !segW ? { backgroundColor: t.colors.primary } : null]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              {sel && showCheck ? <Feather name="check" size={14} color={color} testID="choice-check" /> : o.icon ? <Feather name={o.icon} size={14} color={color} /> : null}
              <RNText maxFontSizeMultiplier={1.5} numberOfLines={2} style={{ color, fontFamily: sel ? fonts.bodyBold : fonts.bodyMedium, fontSize: typography.bodyS.fontSize, lineHeight: typography.bodyS.lineHeight, textAlign: 'center', flexShrink: 1 }}>{o.label}</RNText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function Orb<T extends string>({ o, sel, any, onPress, ownLight = true, gather = 0 }: { o: ChoiceOption<T>; sel: boolean; any: boolean; onPress: () => void; ownLight?: boolean; gather?: number }) {
  const t = useTheme();
  const m = useMotion();
  const night = t.name === 'night';
  const target = sel ? CHOICE.orbSelected : any ? CHOICE.orbOther : 1;
  const s = useSharedValue(target);
  const light = useSharedValue(sel ? 1 : 0);
  const dx = useSharedValue(gather);
  useEffect(() => {
    s.value = m.spring(target, 'panneau');
    dx.value = m.spring(gather, 'panneau');
    light.value = m.timing(sel ? 1 : 0, 220, 'standard');
  }, [target, sel, gather]); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: dx.value }, { scale: s.value }] }));
  const glow = useAnimatedStyle(() => ({ opacity: light.value }));
  const D = CHOICE.orbSize;
  const f = t.material.surfaces.frosted;
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: sel, checked: sel }} aria-checked={sel} accessibilityLabel={o.accessibilityLabel ?? o.label}
      testID={o.testID} onPress={onPress} style={{ alignItems: 'center', gap: 6, minWidth: MIN_TOUCH, flex: 1 }}>
      <Animated.View style={[{ width: D, height: D }, style]}>
        {/* lumière diffuse derrière l'option active */}
        {!night && ownLight ? <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: D / 2, boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 22, spreadDistance: 2, color: alpha(t.tokens.accent.glow[0], t.isDark ? 0.55 : 0.5) }] }, glow]} /> : null}
        <View style={{ flex: 1, borderRadius: D / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? t.colors.primary : f.fill, borderWidth: 1, borderColor: sel ? alpha('#FFFFFF', 0.5) : f.edge }}>
          {sel && !night ? <LinearGradient colors={t.material.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
          {!night ? <LinearGradient colors={[alpha('#FFFFFF', t.isDark ? 0.14 : 0.5), alpha('#FFFFFF', 0)]} start={{ x: 0.2, y: 0 }} end={{ x: 0.5, y: 0.7 }} style={StyleSheet.absoluteFill} /> : null}
          {o.icon ? <Feather name={o.icon} size={22} color={sel ? t.colors.primaryText : t.colors.text} /> : null}
        </View>
        {sel ? (
          <View testID="choice-check" style={{ position: 'absolute', right: -2, bottom: -2, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.tokens.border.active }}>
            <Feather name="check" size={12} color={t.colors.primary} />
          </View>
        ) : null}
      </Animated.View>
      <RNText maxFontSizeMultiplier={1.4} numberOfLines={2} style={{ color: sel ? t.colors.text : t.colors.textMuted, fontFamily: sel ? fonts.bodyBold : fonts.bodyMedium, fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, textAlign: 'center' }}>{o.label}</RNText>
    </Pressable>
  );
}

function Orbs<T extends string>({ options, value, onChange, label, light = 'each', testID }: { options: ChoiceOption<T>[]; value: T | null | undefined; onChange: (v: T) => void; label: string; light?: 'each' | 'travel'; testID?: string }) {
  const travel = light === 'travel';
  const idx = options.findIndex((o) => o.value === value);
  const any = idx >= 0;
  const [w, setW] = useState(0);
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} testID={testID} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: CHOICE.orbGap, paddingVertical: 6 }}
      onLayout={travel ? (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width) : undefined}>
      {travel ? <TravelingLight index={idx} count={options.length} w={w} /> : null}
      {options.map((o, i) => (
        <Orb key={o.value} o={o} sel={o.value === value} any={any} ownLight={!travel} gather={travel && w ? orbGatherOffset(i, idx, w, options.length) : 0}
          onPress={() => { motionHaptic('selection'); onChange(o.value); }} />
      ))}
    </View>
  );
}

/** Lumière diffuse unique qui glisse derrière l'orbe choisi (`light="travel"`) ; première pose sans trajet. */
function TravelingLight({ index, count, w }: { index: number; count: number; w: number }) {
  const t = useTheme();
  const m = useMotion();
  const x = useSharedValue(0);
  const on = useSharedValue(0);
  const placed = useRef(false);
  const D = CHOICE.orbSize;
  useEffect(() => {
    if (!w) return;
    if (index < 0) { on.value = m.timing(0, 220, 'standard'); placed.current = false; return; }
    const to = orbCenter(index, count, w) - D / 2;
    x.value = placed.current ? m.spring(to, 'panneau') : to;
    on.value = m.timing(1, 220, 'standard');
    placed.current = true;
  }, [index, count, w]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { cancelAnimation(x); cancelAnimation(on); }, [x, on]);
  const style = useAnimatedStyle(() => ({ opacity: on.value, transform: [{ translateX: x.value }, { scale: CHOICE.orbSelected }] }));
  if (t.name === 'night') return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View testID="choice-light" style={[{ position: 'absolute', top: 6, left: 0, width: D, height: D, borderRadius: D / 2,
        boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 30, spreadDistance: 6, color: alpha(t.tokens.accent.glow[0], t.isDark ? 0.6 : 0.5) }] }, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { flexDirection: 'row', borderRadius: 999, padding: CHOICE.pad, gap: CHOICE.gap, borderWidth: 1 },
  // marge intérieure réduite : à 320 px, 4 options allemandes (« Woche ») ne se coupent pas au milieu du mot
  segment: { flex: 1, minHeight: 44, borderRadius: 999, justifyContent: 'center', paddingHorizontal: 4 },
});
