/**
 * Design system du module cycle : palette douce (rose poudré, lavande, mauve, beige, gris perle, anthracite),
 * verre dépoli lisible, icônes vectorielles dédiées, sélecteurs qui passent à la ligne (jamais de texte coupé).
 *
 * La palette ne s'applique qu'au module cycle (décision de la propriétaire de l'app : le reste ne change pas).
 * Lisibilité : le texte posé sur le verre utilise toujours l'encre de la palette (anthracite / blanc cassé),
 * avec un voile assez opaque pour garder le contraste quel que soit le fond animé derrière.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Path } from 'react-native-svg';
import { haptic, Text, Toggle } from '@/components/ui';
import { springTo } from '@/theme/motion';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

export interface CyclePalette {
  ink: string; inkSoft: string; paper: string; glass: string; glassBorder: string; line: string;
  powder: string; rose: string; lavender: string; mauve: string; beige: string; pearl: string; anthracite: string;
  period: string; periodSoft: string; estimate: string; fertile: string; info: string; warn: string; danger: string; success: string;
  onAccent: string;
}

/** Contrastes calculés (WCAG AA ≥ 4,5:1) sur le fond « paper » : encre 13,2:1 (clair) / 14,4:1 (sombre), encre douce 6,4 / 9,7, couleurs d'état ≥ 5:1, texte sur « period » 5,3 / 8,0. */
// HOMI (13/11/2026) : perle et midnight violet ; « powder » et « rose » deviennent lilas pâle et mauve framboise,
// les règles passent du vieux rose au framboise HOMI. Les noms des clés restent (compatibilité des écrans).
const LIGHT: CyclePalette = {
  ink: '#1C1533', inkSoft: '#584D72', paper: '#F7F4FB', glass: 'rgba(251,249,254,0.86)', glassBorder: 'rgba(255,255,255,0.95)', line: '#E4DEEE',
  powder: '#ECE4FA', rose: '#D3B3E3', lavender: '#D9CFF0', mauve: '#735C9B', beige: '#F6ECDA', pearl: '#E8E4F0', anthracite: '#1C1533',
  period: '#A8346A', periodSoft: '#FBE8F1', estimate: '#B9A6D8', fertile: '#DCD3F2', info: '#2A609C', warn: '#8A5A0E', danger: '#B3261E', success: '#2F6E4F',
  onAccent: '#FFFFFF',
};
const DARK: CyclePalette = {
  ink: '#F7F4FB', inkSoft: '#C3B8DD', paper: '#16112B', glass: 'rgba(29,22,56,0.88)', glassBorder: 'rgba(255,255,255,0.16)', line: '#2E2650',
  powder: '#3A2650', rose: '#B98AB0', lavender: '#3E3470', mauve: '#C2AEE6', beige: '#3A3226', pearl: '#2A2342', anthracite: '#110D23',
  period: '#FF9CC3', periodSoft: '#3A2036', estimate: '#8C7AB0', fertile: '#33295A', info: '#A8CCFF', warn: '#F2D49A', danger: '#FF8A80', success: '#8BD3AE',
  onAccent: '#110D23',
};
export function useCyclePalette(): CyclePalette {
  const t = useTheme();
  return t.isDark ? DARK : LIGHT;
}

/** Carte de verre dépoli. Sans flou (Android, web lent, mouvement réduit) : surface opaque équivalente. */
export function Glass({ children, style, padded = true, onPress, accessibilityLabel, accessibilityHint }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean; onPress?: () => void; accessibilityLabel?: string; accessibilityHint?: string }) {
  const c = useCyclePalette();
  const t = useTheme();
  const reduce = useReduceMotion();
  const press = useRef(new Animated.Value(0)).current;
  const blur = Platform.OS === 'ios' && !reduce;
  const body = (
    <Animated.View style={[{ borderRadius: radius.lg, borderWidth: 1, borderColor: c.glassBorder, overflow: 'hidden', backgroundColor: blur ? 'transparent' : c.glass,
      shadowColor: '#2E2A33', shadowOpacity: t.isDark ? 0.35 : 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2,
      transform: [{ scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] }) }] }, style]}>
      {blur ? <><BlurView intensity={40} tint={t.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /><View style={[StyleSheet.absoluteFill, { backgroundColor: c.glass }]} /></> : null}
      <View style={{ padding: padded ? spacing.md : 0, gap: spacing.xs }}>{children}</View>
    </Animated.View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint}
      onPressIn={() => springTo(press, 1, 'press', reduce).start()} onPressOut={() => springTo(press, 0, 'release', reduce).start()}
      onPress={() => { haptic('selection'); onPress(); }}>
      {body}
    </Pressable>
  );
}

/** Texte à l'encre de la palette (contraste garanti sur le verre). Pas de hauteur fixe : il passe à la ligne. */
export function Ink({ children, soft, variant = 'body', weight, center, style }: { children: React.ReactNode; soft?: boolean; variant?: 'title' | 'heading' | 'body' | 'small' | 'caption' | 'label'; weight?: 'bold' | 'medium'; center?: boolean; style?: object }) {
  const c = useCyclePalette();
  return <Text variant={variant} weight={weight} center={center} color={soft ? c.inkSoft : c.ink} style={[{ flexShrink: 1 }, style]}>{children}</Text>;
}

// ---------------------------------------------------------------- icônes vectorielles du cycle
export type CycleIconName =
  | 'cycle' | 'period' | 'ovulation' | 'fertility' | 'discharge' | 'symptoms' | 'pain' | 'mood' | 'sleep' | 'energy' | 'journal'
  | 'calendar' | 'stats' | 'reminders' | 'documents' | 'settings' | 'privacy' | 'bleeding' | 'guide' | 'export' | 'temperature' | 'test';

/** Tracés au trait (24×24), arrondis, sans emoji. */
const PATHS: Record<CycleIconName, string[]> = {
  cycle: ['M12 3a9 9 0 1 1-8.5 6', 'M3.5 4v5h5'],
  period: ['M12 3.5c3 4 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 2.5-6 5.5-10z'],
  ovulation: ['M12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z', 'M12 2.5v2', 'M12 19.5v2', 'M2.5 12h2', 'M19.5 12h2'],
  fertility: ['M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z', 'M12 11v4', 'M10 13h4'],
  discharge: ['M7 4c0 3 3 4 3 7s-3 4-3 7', 'M12 4c0 3 3 4 3 7s-3 4-3 7', 'M17 4c0 3 3 4 3 7s-3 4-3 7'],
  symptoms: ['M4 12h3l2-5 3 10 2-6 2 3h4'],
  pain: ['M13 3 6 13h5l-1 8 7-10h-5l1-8z'],
  mood: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8', 'M9 9.5h.01', 'M15 9.5h.01'],
  sleep: ['M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'],
  energy: ['M7 8h9a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z', 'M20 11v2', 'M8 11v2', 'M11 11v2'],
  journal: ['M6 3.5h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6z', 'M6 3.5v17', 'M10 8h5', 'M10 11.5h5'],
  calendar: ['M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5z', 'M3.5 10h17', 'M8 3.5v4', 'M16 3.5v4'],
  stats: ['M4 20h16', 'M7 16v-5', 'M12 16V7', 'M17 16v-8'],
  reminders: ['M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z', 'M10 20.5a2 2 0 0 0 4 0'],
  documents: ['M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5z', 'M14 3.5V8h4', 'M9 12.5h6', 'M9 16h6'],
  settings: ['M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z', 'M12 2.5v3', 'M12 18.5v3', 'M2.5 12h3', 'M18.5 12h3', 'M5.3 5.3l2.1 2.1', 'M16.6 16.6l2.1 2.1', 'M5.3 18.7l2.1-2.1', 'M16.6 7.4l2.1-2.1'],
  privacy: ['M12 3l7 3v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6z', 'M9.5 12l2 2 3.5-4'],
  bleeding: ['M12 4c2.5 3.4 4.5 6 4.5 8.6a4.5 4.5 0 0 1-9 0C7.5 10 9.5 7.4 12 4z', 'M18 4.5v4', 'M18 11h.01'],
  guide: ['M4 5.5c2.5-1 5-1 8 1 3-2 5.5-2 8-1v13c-2.5-1-5-1-8 1-3-2-5.5-2-8-1z', 'M12 6.5v13'],
  export: ['M12 15V3.5', 'M8 7.5l4-4 4 4', 'M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13'],
  temperature: ['M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0z', 'M12 9v7'],
  test: ['M9 3.5h6v13a3 3 0 0 1-6 0z', 'M9 9h6', 'M12 12v3'],
};

export function CycleIcon({ name, size = 24, color, strokeWidth = 1.7 }: { name: CycleIconName; size?: number; color?: string; strokeWidth?: number }) {
  const c = useCyclePalette();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden importantForAccessibility="no">
      {PATHS[name].map((d, i) => <Path key={i} d={d} stroke={color ?? c.ink} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />)}
    </Svg>
  );
}

/** Pastille d'icône : fond doux, glyphe à l'encre. */
export function IconBadge({ name, tone = 'powder', size = 40 }: { name: CycleIconName; tone?: 'powder' | 'lavender' | 'beige' | 'pearl' | 'period'; size?: number }) {
  const c = useCyclePalette();
  const bg = tone === 'period' ? c.period : c[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2.6, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
      <CycleIcon name={name} size={size * 0.55} color={tone === 'period' ? c.onAccent : c.ink} />
    </View>
  );
}

// ---------------------------------------------------------------- sélecteurs
/**
 * Choix en puces qui passent à la ligne (aucune largeur fixe : un libellé long agrandit la puce).
 * multi : sélection multiple ; sinon choix unique (re-toucher désélectionne si allowNone).
 */
export function Choices<T extends string>({ label, options, value, onChange, multi, allowNone = true, labelOf }: {
  label: string; options: readonly T[]; value: T | T[] | null; onChange: (v: T | T[] | null) => void; multi?: boolean; allowNone?: boolean; labelOf: (v: T) => string;
}) {
  const c = useCyclePalette();
  const selected = (o: T) => (multi ? (value as T[] | null)?.includes(o) ?? false : value === o);
  return (
    <View style={{ gap: 6 }} accessibilityRole={multi ? undefined : 'radiogroup'} accessibilityLabel={label}>
      <Ink variant="label" weight="medium">{label}</Ink>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((o) => {
          const on = selected(o);
          return (
            <Tappable key={o} accessibilityRole={multi ? 'checkbox' : 'radio'} accessibilityState={multi ? { checked: on } : { selected: on }} aria-checked={on}
              accessibilityLabel={labelOf(o)}
              onPress={() => {
                haptic('selection');
                if (multi) { const cur = (value as T[] | null) ?? []; onChange(on ? cur.filter((x) => x !== o) : [...cur, o]); }
                else onChange(on && allowNone ? null : o);
              }}
              style={({ pressed }) => ({ minHeight: MIN_TOUCH - 4, maxWidth: '100%', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, justifyContent: 'center',
                borderWidth: 1.2, borderColor: on ? c.mauve : c.line, backgroundColor: on ? c.lavender : pressed ? c.pearl : 'transparent' })}>
              <Text variant="small" weight={on ? 'bold' : 'medium'} color={c.ink} style={{ flexShrink: 1 }}>{labelOf(o)}</Text>
            </Tappable>
          );
        })}
      </View>
    </View>
  );
}

/** Échelle de 1 à 5 (humeur, énergie, sommeil, stress) avec libellés des extrémités, touche à nouveau pour effacer. */
export function Scale({ label, value, onChange, low, high }: { label: string; value: number | null; onChange: (v: number | null) => void; low: string; high: string }) {
  const c = useCyclePalette();
  return (
    <View style={{ gap: 6 }} accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={value ? { min: 1, max: 5, now: value } : undefined}>
      <Ink variant="label" weight="medium">{label}</Ink>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = value === n;
          return (
            <Tappable key={n} accessibilityRole="button" accessibilityLabel={`${label} ${n}/5`} accessibilityState={{ selected: on }}
              onPress={() => { haptic('selection'); onChange(on ? null : n); }}
              style={{ flex: 1, minHeight: MIN_TOUCH, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.2, borderColor: on ? c.mauve : c.line, backgroundColor: on ? c.lavender : 'transparent' }}>
              <Text weight="bold" color={c.ink}>{n}</Text>
            </Tappable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
        <Ink variant="caption" soft style={{ flex: 1 }}>{low}</Ink>
        <Ink variant="caption" soft style={{ flex: 1, textAlign: 'right' }}>{high}</Ink>
      </View>
    </View>
  );
}

/** Apparition douce d'une section (fondu + légère montée), désactivée si mouvement réduit. */
export function Rise({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) { v.setValue(1); return; }
    const id = setTimeout(() => springTo(v, 1, 'gentle', reduce).start(), delay);
    return () => clearTimeout(id);
  }, [v, delay, reduce]);
  return <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>{children}</Animated.View>;
}

/** Point de légende (couleur + forme différentes : l'information ne repose jamais sur la seule couleur). */
export function LegendDot({ kind }: { kind: 'period' | 'estimate' | 'fertile' | 'symptom' | 'discharge' | 'note' }) {
  const c = useCyclePalette();
  const size = 12;
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" accessibilityElementsHidden importantForAccessibility="no">
      {kind === 'period' ? <Circle cx={6} cy={6} r={5} fill={c.period} /> : null}
      {kind === 'estimate' ? <Circle cx={6} cy={6} r={4.6} fill="none" stroke={c.period} strokeWidth={1.4} strokeDasharray="2 1.6" /> : null}
      {kind === 'fertile' ? <Circle cx={6} cy={6} r={5} fill={c.fertile} stroke={c.estimate} strokeWidth={1} /> : null}
      {kind === 'symptom' ? <Path d="M6 1.5 10.5 10.5h-9z" fill={c.mauve} /> : null}
      {kind === 'discharge' ? <Path d="M6 1.5c2 2.6 3.4 4.4 3.4 6.1a3.4 3.4 0 0 1-6.8 0C2.6 5.9 4 4.1 6 1.5z" fill={c.estimate} /> : null}
      {kind === 'note' ? <Path d="M2 2h8v8H2z" fill={c.beige} stroke={c.inkSoft} strokeWidth={0.8} /> : null}
    </Svg>
  );
}

/** Interrupteur avec libellé visible (qui passe à la ligne) et aide facultative. */
export function SwitchRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Ink weight="medium">{label}</Ink>
        {hint ? <Ink variant="caption" soft>{hint}</Ink> : null}
      </View>
      <Toggle label={label} value={value} onChange={onChange} />
    </View>
  );
}
