/**
 * Identité visuelle de HOMI Aura : le pictogramme suit les règles de la famille HomiIcon (grille 24, marge 2, trait
 * d'ENCRE 1,75 arrondi, aplat doux de l'accent sous le trait, aucune couleur en dur) — une bulle de conversation douce
 * d'où part un petit éclat à quatre branches (l'« aura »), entourée d'un anneau fin. Le logo HOMI n'est ni redessiné
 * ni recomposé (HOMI_BRAND.md) : Aura a son propre signe, de la même famille.
 * Décoratif pour les lecteurs d'écran : le nom « HOMI Aura » est toujours écrit à côté.
 *
 * Direction Liquid Glass (20/11/2026) : `AuraOrb` (signature animée) remplace la pastille de l'avatar ; le pictogramme
 * `AuraGlyph` reste pour les listes et l'analyse.
 */
import React, { useEffect, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { ICON_FILL, ICON_STROKE } from '@/brand/icons';
import { auraMotion, useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { AURA } from '@/theme/toolLogo';

/** Bulle arrondie (même rayon que les pictogrammes HOMI) et éclat. */
export const AURA_BUBBLE = 'M4.25 9.25A4.75 4.75 0 0 1 9 4.5h4.5a4.75 4.75 0 0 1 4.75 4.75v2.5a4.75 4.75 0 0 1-4.75 4.75H10.2l-3.7 3v-3.55A4.75 4.75 0 0 1 4.25 11.75z';
export const AURA_SPARK = 'M18.6 2.6v3.1M17.05 4.15h3.1';
export const AURA_DOTS: [number, number, number][] = [[8.6, 10.5, 0.95], [11.25, 10.5, 0.95], [13.9, 10.5, 0.95]];
/** Éclat à quatre branches de la signature (grille 64). */
export const AURA_STAR = 'M32 18 C33 27 37 31 46 32 C37 33 33 37 32 46 C31 37 27 33 18 32 C27 31 31 27 32 18 Z';

export function AuraGlyph({ size = 24, color, tone, active = false }: { size?: number; color?: string; tone?: string | null; active?: boolean }) {
  const t = useTheme();
  const ink = color ?? t.colors.text;
  const plate = tone === undefined ? t.colors.primary : tone;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
      {plate ? <Path d={AURA_BUBBLE} fill={plate} fillOpacity={active ? ICON_FILL.active : ICON_FILL.inactive} /> : null}
      <Path d={`${AURA_BUBBLE}${AURA_SPARK}`} fill="none" stroke={ink} strokeWidth={ICON_STROKE} strokeLinecap="round" strokeLinejoin="round" />
      {AURA_DOTS.map(([cx, cy, r]) => <Circle key={cx} cx={cx} cy={cy} r={r} fill={ink} />)}
    </Svg>
  );
}

/** Avatar d'Aura : la signature animée (`AuraOrb`). `thinking` : Aura prépare une réponse. */
export function AuraAvatar({ size = 40, thinking = false, testID }: { size?: number; thinking?: boolean; testID?: string }) {
  return <AuraOrb size={size} thinking={thinking} testID={testID} />;
}

/**
 * SIGNATURE D'AURA : une LENTILLE de verre où trois lumières (lilas, corail, lagon) entourent un éclat blanc à quatre
 * branches. Elle réagit :
 *  - à l'ouverture d'Aura : la lentille se pose (0,86 → 1, rebond léger) et l'éclat fait un quart de tour, une fois ;
 *  - pendant la préparation d'une réponse (`thinking`) : les lumières tournent lentement et la lentille respire ;
 *    tout s'arrête dès que la réponse arrive (aucune boucle au repos).
 * « Réduire les animations » : lentille immobile ; l'état « réfléchit » reste dit par le texte et les trois points.
 * Couleurs : marque d'Aura (`AURA`, src/theme/toolLogo.ts), identiques dans les cinq palettes.
 */
export function AuraOrb({ size = 44, thinking = false, testID }: { size?: number; thinking?: boolean; testID?: string }) {
  const m = useMotion();
  const uid = `ao${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const enter = useSharedValue(m.level === 'full' ? 0 : 1);
  const spin = useSharedValue(0);
  const breath = useSharedValue(0);
  useEffect(() => {
    if (m.level === 'full') enter.value = m.spring(1, 'rebondLeger');
    return () => cancelAnimation(enter);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (thinking && m.level === 'full') {
      spin.value = 0;
      spin.value = withRepeat(withTiming(360, { duration: auraMotion.spinMs, easing: Easing.linear }), -1, false);
      breath.value = withRepeat(withTiming(1, { duration: auraMotion.breathMs, easing: Easing.inOut(Easing.sin) }), -1, true);
    } else {
      cancelAnimation(spin);
      cancelAnimation(breath);
      breath.value = m.timing(0, 200, 'standard');
    }
  }, [thinking, m, spin, breath]);
  useEffect(() => () => { cancelAnimation(spin); cancelAnimation(breath); }, [spin, breath]);
  const lens = useAnimatedStyle(() => ({ transform: [{ scale: (0.86 + 0.14 * enter.value) * (1 + (auraMotion.thinkingScale - 1) * breath.value) }] }));
  const lights = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const spark = useAnimatedStyle(() => ({ transform: [{ rotate: `${(1 - enter.value) * 90}deg` }] }));
  const half = size / 2;
  return (
    <Animated.View testID={testID} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden
      style={[{ width: size, height: size, borderRadius: half, overflow: 'hidden', boxShadow: AURA.shadow }, lens]}>
      <Animated.View style={[StyleSheet.absoluteFill, lights]}>
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Defs>
            {AURA.hues.map((c, i) => (
              <RadialGradient key={c} id={`${uid}${i}`} cx="0.5" cy="0.5" r="0.5">
                <Stop offset="0" stopColor={c} stopOpacity={1} />
                <Stop offset="1" stopColor={c} stopOpacity={0} />
              </RadialGradient>
            ))}
          </Defs>
          <Circle cx={32} cy={32} r={32} fill={AURA.ring} />
          <Circle cx={20} cy={22} r={30} fill={`url(#${uid}0)`} />
          <Circle cx={46} cy={44} r={28} fill={`url(#${uid}1)`} />
          <Circle cx={18} cy={48} r={24} fill={`url(#${uid}2)`} />
        </Svg>
      </Animated.View>
      <View style={StyleSheet.absoluteFill}>
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Defs>
            <RadialGradient id={`${uid}g`} cx="0.36" cy="0.28" r="0.6">
              <Stop offset="0" stopColor={AURA.core} stopOpacity={0.55} />
              <Stop offset="1" stopColor={AURA.core} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={32} cy={32} r={32} fill={`url(#${uid}g)`} />
          <Path d="M12 22 A23 23 0 0 1 30 9.5" fill="none" stroke={AURA.core} strokeOpacity={0.7} strokeWidth={2.4} strokeLinecap="round" />
          <Circle cx={32} cy={32} r={31.2} fill="none" stroke={AURA.core} strokeOpacity={0.35} strokeWidth={1.2} />
        </Svg>
      </View>
      <Animated.View style={[StyleSheet.absoluteFill, spark]}>
        <Svg width={size} height={size} viewBox="0 0 64 64"><Path d={AURA_STAR} fill={AURA.ink} /></Svg>
      </Animated.View>
    </Animated.View>
  );
}

/** Trois points de lumière qui s'allument tour à tour : Aura prépare une réponse (fixes avec « Réduire les animations »). */
export function AuraThinkingDots({ color, testID }: { color: string; testID?: string }) {
  const m = useMotion();
  const live = m.level === 'full';
  const k = useSharedValue(0);
  useEffect(() => {
    if (live) k.value = withRepeat(withTiming(3, { duration: auraMotion.breathMs * 1.2, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(k);
  }, [live, k]);
  const s0 = useAnimatedStyle(() => ({ opacity: live ? 0.3 + 0.7 * Math.max(0, 1 - Math.abs(k.value - 0.5)) : 0.8 }));
  const s1 = useAnimatedStyle(() => ({ opacity: live ? 0.3 + 0.7 * Math.max(0, 1 - Math.abs(k.value - 1.5)) : 0.8 }));
  const s2 = useAnimatedStyle(() => ({ opacity: live ? 0.3 + 0.7 * Math.max(0, 1 - Math.abs(k.value - 2.5)) : 0.8 }));
  const dot = { width: 7, height: 7, borderRadius: 4, backgroundColor: color };
  return (
    <View testID={testID} style={{ flexDirection: 'row', gap: 5, alignItems: 'center', height: 12 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[dot, s0]} />
      <Animated.View style={[dot, s1]} />
      <Animated.View style={[dot, s2]} />
    </View>
  );
}
