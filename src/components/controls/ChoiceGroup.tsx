/**
 * Sélecteur HOMI v4 (segmented, choix de membre, durée, catégorie, humeur) — référence « Lightly ».
 *
 *  - `pills` (défaut) : rail en creux, LENTILLE de verre clair (`Lens`) qui GLISSE sous le choix actif (ressort
 *    « panneau », interruptible) ; elle grossit l'option sans la colorer (caustique de la palette au pied) ; la
 *    sélection est confirmée par le texte (gras) ET une coche dans la couleur d'accent (dès que la place le permet,
 *    ≥ 92 px par option), jamais par la couleur seule.
 *  - `orbs` : rangée d'orbes de verre givré (humeur, membre) ; l'orbe choisi grandit (1,08) avec une lumière diffuse
 *    derrière lui, les autres se resserrent légèrement vers lui (0,94) — les choix « se rapprochent » ; une pastille
 *    à coche confirme le choix, le libellé passe en gras.
 *    `light="travel"` (ajout rétro-compatible, humeur/journal) : UNE seule lumière diffuse se DÉPLACE d'une option à
 *    l'autre (ressort « panneau ») au lieu de s'allumer sous chaque orbe, et les autres orbes glissent de quelques
 *    pixels vers le choix actif (`CHOICE.orbGather`). Défaut `each` : comportement historique inchangé.
 *  - `cards` : liste verticale de cartes de choix (libellé + description facultative, coche à droite) — pour des
 *    libellés longs. `pills` y bascule D'ELLE-MÊME quand un libellé ne tient pas en 2 lignes dans son segment
 *    (petit écran, texte agrandi, langue longue) : le choix passe à la ligne au lieu d'être coupé.
 *  - `orbs` passe sur plusieurs rangées (centrées) quand un libellé ne tient pas sous son orbe en 3 lignes sans
 *    couper de mot (`orbLayout`, src/components/layoutFit.ts) ; la lumière suit alors l'orbe choisi.
 * Accessibilité : `radiogroup` + `radio` (`checked`), libellé du groupe obligatoire, cible ≥ 48 px.
 * Mouvement : `useMotion` — `off` : positions finales immédiates ; `minimal` (nuit) : fondu court, sans rebond.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text as RNText, View, type LayoutChangeEvent, type TextStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Lens, LENS, useLensSlide } from './Lens';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, fonts, MIN_TOUCH, typography } from '@/theme/tokens';
import { motionHaptic } from '@/motion/haptics';
import { useMotion } from '@/motion/useMotion';
import { cappedScale, useFontScale } from '@/theme/fontScale';
import { lineCount, orbLayout } from '../layoutFit';

/** Web : plafond d'agrandissement publié pour l'audit (voir ui.tsx `Text`) ; pas de coupure de mot avec trait d'union. */
const web = (fsmax: number) => (Platform.OS === 'web' ? ({ dataSet: { fsmax: String(fsmax) } } as object) : null);
const NO_HYPHENS = (Platform.OS === 'web' ? { hyphens: 'manual' } : null) as unknown as TextStyle;
const ORB_LABEL_MAX = 1.4;
const PILL_LABEL_MAX = 1.5;

export type ChoiceOption<T extends string> = { value: T; label: string; icon?: React.ComponentProps<typeof Feather>['name']; testID?: string; accessibilityLabel?: string;
  /** Variante `cards` : une ligne d'explication sous le libellé */
  description?: string };

/** Les libellés tiennent-ils dans des segments de `segW` px (2 lignes au plus, sans couper de mot) ? (pur, testé) */
export function pillsFit(labels: string[], segW: number, scale = 1, glyph = segW >= CHECK_MIN_WIDTH): boolean {
  if (!(segW > 0)) return true;
  // marge intérieure du segment (4 + 4) et, si elle est affichée, icône ou coche (14 + 5)
  const avail = segW - 8 - (glyph ? 19 : 0);
  return labels.every((l) => lineCount(l, avail, typography.bodyS.fontSize * scale) <= 2);
}

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
  variant?: 'pills' | 'orbs' | 'cards';
  /** `orbs` seulement : `each` (défaut, lumière sous l'orbe choisi) ou `travel` (une seule lumière qui se déplace) */
  light?: 'each' | 'travel';
  testID?: string;
}) {
  if (variant === 'orbs') return <Orbs options={options} value={value} onChange={onChange} label={label} light={light} testID={testID} />;
  if (variant === 'cards') return <Cards options={options} value={value} onChange={onChange} label={label} testID={testID} />;
  return <Pills options={options} value={value} onChange={onChange} label={label} testID={testID} />;
}

function Pills<T extends string>({ options, value, onChange, label, testID }: { options: ChoiceOption<T>[]; value: T | null | undefined; onChange: (v: T) => void; label: string; testID?: string }) {
  const t = useTheme();
  const [w, setW] = useState(0);
  const [railH, setRailH] = useState(52);
  const found = options.findIndex((o) => o.value === value);
  const n = Math.max(1, options.length);
  const segW = w ? (w - CHOICE.pad * 2 - CHOICE.gap * (n - 1)) / n : 0;
  // Lentille : position du choix actif dans le rail (première pose immédiate, puis glissement)
  const lens = useLensSlide(CHOICE.pad + Math.max(0, found) * (segW + CHOICE.gap), segW);
  const showCheck = segW >= CHECK_MIN_WIDTH;
  const fontScale = useFontScale();
  if (w > 0 && !pillsFit(options.map((o) => o.label), segW, cappedScale(fontScale, PILL_LABEL_MAX), showCheck || options.some((o) => !!o.icon))) {
    return <Cards options={options} value={value} onChange={onChange} label={label} testID={testID} onLayout={(e) => setW(e.nativeEvent.layout.width)} />;
  }
  const g = t.material.glass.inset;
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} testID={testID} onLayout={(e: LayoutChangeEvent) => { setW(e.nativeEvent.layout.width); setRailH(Math.round(e.nativeEvent.layout.height)); }}
      style={[styles.rail, { backgroundColor: g.fill, borderColor: g.edge }]}>
      {segW > 0 && found >= 0 ? <Lens slide={lens} top={LENS.inset} height={Math.max(0, railH - 2 - LENS.inset * 2)} testID="choice-indicator" /> : null}
      {options.map((o) => {
        const sel = o.value === value;
        const color = sel ? t.colors.text : t.colors.textMuted;
        return (
          <Pressable key={o.value} accessibilityRole="radio" accessibilityState={{ selected: sel, checked: sel }} aria-checked={sel}
            accessibilityLabel={o.accessibilityLabel ?? o.label} testID={o.testID}
            onPress={() => { motionHaptic('selection'); onChange(o.value); }} hitSlop={{ top: 4, bottom: 4 }}
            style={[styles.segment, sel && !segW ? { backgroundColor: t.material.lens.fill } : null]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              {sel && showCheck ? <Feather name="check" size={14} color={t.colors.primary} testID="choice-check" /> : o.icon ? <Feather name={o.icon} size={14} color={color} /> : null}
              <RNText maxFontSizeMultiplier={PILL_LABEL_MAX} {...web(PILL_LABEL_MAX)} style={[{ color, fontFamily: sel ? fonts.bodyBold : fonts.bodyMedium, fontSize: typography.bodyS.fontSize, lineHeight: typography.bodyS.lineHeight, textAlign: 'center', flexShrink: 1 }, NO_HYPHENS]}>{o.label}</RNText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function Orb<T extends string>({ o, sel, any, onPress, ownLight = true, gather = 0, col }: { o: ChoiceOption<T>; sel: boolean; any: boolean; onPress: () => void; ownLight?: boolean; gather?: number; col?: number }) {
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
      testID={o.testID} onPress={onPress} style={col ? { alignItems: 'center', gap: 6, width: col } : { alignItems: 'center', gap: 6, minWidth: MIN_TOUCH, flex: 1 }}>
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
      {/* libellé entier sous l'orbe (jamais « Très diffi-… ») : la rangée passe à la ligne s'il ne tient pas */}
      <RNText maxFontSizeMultiplier={ORB_LABEL_MAX} {...web(ORB_LABEL_MAX)} style={[{ color: sel ? t.colors.text : t.colors.textMuted, fontFamily: sel ? fonts.bodyBold : fonts.bodyMedium, fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, textAlign: 'center', alignSelf: 'stretch' }, NO_HYPHENS]}>{o.label}</RNText>
    </Pressable>
  );
}

function Orbs<T extends string>({ options, value, onChange, label, light = 'each', testID }: { options: ChoiceOption<T>[]; value: T | null | undefined; onChange: (v: T) => void; label: string; light?: 'each' | 'travel'; testID?: string }) {
  const idx = options.findIndex((o) => o.value === value);
  const any = idx >= 0;
  const [w, setW] = useState(0);
  const fontScale = useFontScale();
  const lay = orbLayout({ labels: options.map((o) => o.label), width: w, fontSize: typography.caption.fontSize, scale: cappedScale(fontScale, ORB_LABEL_MAX), gap: CHOICE.orbGap, minCol: MIN_TOUCH });
  const wrapped = w > 0 && lay.rows > 1;
  // Plusieurs rangées : chaque orbe garde sa propre lumière (une lumière qui « voyage » ne suit qu'une rangée)
  const travel = light === 'travel' && !wrapped;
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} testID={testID}
      style={wrapped
        ? { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: CHOICE.orbGap, rowGap: 12, paddingVertical: 6 }
        : { flexDirection: 'row', justifyContent: 'space-between', gap: CHOICE.orbGap, paddingVertical: 6 }}
      onLayout={(e: LayoutChangeEvent) => { const nw = Math.round(e.nativeEvent.layout.width); setW((cur) => (Math.abs(cur - nw) > 1 ? nw : cur)); }}>
      {travel ? <TravelingLight index={idx} count={options.length} w={w} /> : null}
      {options.map((o, i) => (
        <Orb key={o.value} o={o} sel={o.value === value} any={any} ownLight={!travel} gather={travel && w ? orbGatherOffset(i, idx, w, options.length) : 0}
          col={wrapped ? lay.col : undefined} onPress={() => { motionHaptic('selection'); onChange(o.value); }} />
      ))}
    </View>
  );
}

/** Liste de cartes de choix (`variant="cards"`, et repli automatique de `pills`). */
function Cards<T extends string>({ options, value, onChange, label, testID, onLayout }: { options: ChoiceOption<T>[]; value: T | null | undefined; onChange: (v: T) => void; label: string; testID?: string; onLayout?: (e: LayoutChangeEvent) => void }) {
  const t = useTheme();
  const g = t.material.glass.inset;
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} testID={testID} onLayout={onLayout} style={{ gap: 8 }}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="radio" accessibilityState={{ selected: sel, checked: sel }} aria-checked={sel}
            accessibilityLabel={o.accessibilityLabel ?? (o.description ? `${o.label}, ${o.description}` : o.label)} testID={o.testID}
            onPress={() => { motionHaptic('selection'); onChange(o.value); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, borderWidth: sel ? 1.5 : 1,
              borderColor: sel ? t.colors.primary : g.edge, backgroundColor: sel ? alpha(t.tokens.accent.glow[0], t.isDark ? 0.16 : 0.12) : g.fill }}>
            {o.icon ? <Feather name={o.icon} size={18} color={sel ? t.colors.primary : t.colors.textMuted} /> : null}
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <RNText maxFontSizeMultiplier={1.7} {...web(1.7)} style={{ color: t.colors.text, fontFamily: sel ? fonts.bodyBold : fonts.bodyMedium, fontSize: typography.bodyM.fontSize, lineHeight: typography.bodyM.lineHeight }}>{o.label}</RNText>
              {o.description ? <RNText maxFontSizeMultiplier={1.7} {...web(1.7)} style={{ color: t.colors.textMuted, fontFamily: fonts.body, fontSize: typography.bodyS.fontSize, lineHeight: typography.bodyS.lineHeight }}>{o.description}</RNText> : null}
            </View>
            {/* sélection confirmée par la coche ET le gras, jamais par la couleur seule */}
            <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: sel ? 0 : 1.5, borderColor: t.colors.textMuted, backgroundColor: sel ? t.colors.primary : 'transparent' }}>
              {sel ? <Feather name="check" size={14} color={t.colors.primaryText} testID="choice-check" /> : null}
            </View>
          </Pressable>
        );
      })}
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
