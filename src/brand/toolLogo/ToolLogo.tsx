/**
 * `ToolLogo` — logo d'un outil HOMI : icône « verre dépoli » de la propriétaire + LUMIÈRE colorée du public
 * (21/11/2026, docs/DA_LIQUID_GLASS.md § 3 bis). Couches : plaque de verre (image fournie, une par catégorie) →
 * lumière radiale au centre, DERRIÈRE le dessin, couleur = à qui sert l'outil (femme rose, bébé bleu, enfant menthe,
 * couple pêche, foyer ambre, neutre lavande, urgence rouge, Aura bleu nuit) → symbole nacré au trait.
 *
 * TROIS RENDUS, un seul composant, une seule source par identifiant (`toolLogoDef`) :
 *  1. `detailed` (≥ 48 pt par défaut) : en-têtes, raccourcis — lumière large, filet de lumière sur le trait,
 *     ombre douce teintée de la lumière sous la plaque ;
 *  2. `compact` (< 48 pt) : catalogue, listes, recherche — lumière un peu plus serrée, trait plus franc, sans filet,
 *     ombre de contact seule (pas de halo dans une liste dense) ;
 *  3. ANIMÉ : la lumière s'intensifie brièvement à l'APPUI (tant que le doigt est posé) et à l'OUVERTURE (`play`),
 *     et la famille de l'outil réagit à une interaction réelle —
 *       `play` (compteur) : ouverture, ajout, confirmation (lune qui se pose, courbe qui se trace, coche, rebond, reflet) ;
 *       `running` : l'anneau tourne tant que le minuteur tourne et s'arrête avec lui (famille `ring`) ;
 *       `pressed` : la plaque s'enfonce (0,94, ressort vif).
 *
 * Au repos, rien ne bouge. « Réduire les animations » : lumière fixe, même état final immédiatement (l'anneau d'un
 * minuteur en cours reste VISIBLE, sans rotation). Nuit : lumière atténuée, aucune ombre. Décoratif pour les lecteurs
 * d'écran (la rangée ou le bouton qui le porte a son nom). Tout tourne sur le fil UI (transform, opacité, un tracé SVG).
 */
import React, { useEffect, useId, useRef } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { HOMI_ICONS, type HomiIconName } from '@/brand/icons/paths';
import type { HomiIconDef } from '@/brand/icons/geometry';
import { glassPlate } from '@/brand/toolGlass/glass';
import { TOOL_SYMBOLS } from '@/brand/toolGlass/symbols';
import { logoMotion, useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { LOGO_LIGHT, logoMode, logoShadow, mixHex, PEARL, PUBLIC_LIGHT, SYMBOL_GLOW, type LogoCategory, type LogoPublic } from '@/theme/toolLogo';
import { logoPublicOf, motionOfIcon, toolLogoDef, type LogoMotion } from './families';
import { LOGO_GRID, SYMBOL_BOX, SYMBOL_STROKE, SYMBOL_TRANSFORM, squircleRadius, type LogoVariant } from './geometry';
import { LIGHT_STOPS } from './svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
/** Courbe de croissance (grille 64) et sa longueur approchée. */
const CURVE_D = 'M11 47 C 20 46 25 41 31 36 S 44 24 53 17';
const CURVE_LEN = 54;
const CHECK_D = 'M45.5 47.5 L48.6 50.6 L54 44.6';
const CHECK_LEN = 12.5;
const RING_R = 26.5;
const RING_C = 2 * Math.PI * RING_R;
/** Impulsion de lumière à l'ouverture : montée puis retour (ms). */
const PULSE_IN = 160;
const PULSE_OUT = 620;

export interface ToolLogoProps {
  /** Identifiant stable du catalogue (outil, sous-accès, `h200_<n>`, `quick.<clé>`, `cat.<catégorie>`). */
  id?: string | null;
  /** Pictogramme imposé (sinon : symbole de la propriétaire, ou pictogramme du manifeste pour `id`). */
  icon?: HomiIconName;
  /** Plaque imposée (sinon : celle de la catégorie de `id`). */
  category?: LogoCategory;
  /** Public imposé (couleur de la lumière ; sinon : celui de `id`). */
  audience?: LogoPublic;
  size?: number;
  variant?: LogoVariant;
  /** Change à chaque interaction réelle (ouverture, ajout, confirmation) : joue l'animation de la famille. */
  play?: number;
  /** Minuteur / outil en cours : anneau qui tourne (famille `ring`), sinon pastille d'activité. */
  running?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  urgent?: boolean;
  /** Famille imposée (sinon : celle du pictogramme). */
  motion?: LogoMotion;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ToolLogo({ id, icon: forcedIcon, category: forcedCat, audience, size = 44, variant, play = 0, running = false, pressed = false, disabled = false, urgent, motion: forcedMotion, style, testID }: ToolLogoProps) {
  const t = useTheme();
  const m = useMotion();
  const def = toolLogoDef(id, urgent);
  const iconName = forcedIcon ?? def?.icon ?? 'tools';
  const cat: LogoCategory = forcedCat ?? def?.category ?? (urgent ? 'urgent' : 'account');
  const pub: LogoPublic = audience ?? (forcedCat ? logoPublicOf(id, forcedCat) : def?.public ?? logoPublicOf(id, cat));
  const family: LogoMotion = forcedMotion ?? (forcedIcon ? motionOfIcon(forcedIcon) : def?.motion ?? 'glint');
  const v: LogoVariant = variant ?? (size >= 48 ? 'detailed' : 'compact');
  const mode = logoMode(t);
  const symbolKey = forcedIcon ? null : def?.symbol ?? null;
  const uid = `tl${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const still = m.level === 'off' || cat === 'urgent';
  const lightColor = PUBLIC_LIGHT[pub];
  const base = LOGO_LIGHT.opacity[mode];

  // ------------------------------------------------------------ animation de famille (0 → 1), relancée par `play`
  const k = useSharedValue(1);
  const extra = useSharedValue(0); // tracé temporaire (courbe, coche) : 0 caché, 1 visible
  const pulse = useSharedValue(0); // lumière : 0 repos, 1 sommet de l'impulsion
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (still) return; // état final immédiat : rien à jouer, lumière fixe
    pulse.value = withSequence(m.timing(1, PULSE_IN, 'decelerate'), m.timing(0, PULSE_OUT, 'standard'));
    if (family === 'curve' || family === 'check') {
      const draw = family === 'curve' ? logoMotion.curveDrawMs : logoMotion.checkDrawMs;
      k.value = 0;
      k.value = m.timing(1, draw, 'reveal');
      extra.value = withSequence(withTiming(1, { duration: 1 }), withTiming(1, { duration: draw + logoMotion.holdMs }), withTiming(0, { duration: m.duration(logoMotion.fadeMs) }));
    } else {
      k.value = 0;
      k.value = family === 'meal' ? m.spring(1, 'rebondLeger') : m.spring(1, 'doux');
    }
  }, [play, still, family, m, k, extra, pulse]);

  // ------------------------------------------------------------ pression : la plaque s'enfonce, la lumière monte
  const press = useSharedValue(0);
  useEffect(() => {
    press.value = m.spring(pressed ? 1 : 0, 'vif');
    if (m.level !== 'off') pulse.value = m.timing(pressed ? 1 : 0, pressed ? PULSE_IN : PULSE_OUT, pressed ? 'decelerate' : 'standard');
  }, [pressed, m, press, pulse]);
  const plateStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - (1 - logoMotion.pressScale) * press.value }] }));
  const lightStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, base + LOGO_LIGHT.pulse * pulse.value), transform: [{ scale: 1 + 0.12 * pulse.value }] }));

  // ------------------------------------------------------------ anneau du minuteur (famille ring)
  const ringOn = useSharedValue(running ? 1 : 0);
  const spin = useSharedValue(0);
  useEffect(() => {
    ringOn.value = m.timing(running ? 1 : 0, 220, 'standard');
    if (running && m.level === 'full' && family === 'ring') {
      spin.value = 0;
      spin.value = withRepeat(withTiming(360, { duration: logoMotion.ringPeriodMs, easing: Easing.linear }), -1, false);
    } else {
      cancelAnimation(spin);
    }
  }, [running, m, family, ringOn, spin]);
  useEffect(() => () => { cancelAnimation(spin); cancelAnimation(k); cancelAnimation(extra); cancelAnimation(pulse); }, [spin, k, extra, pulse]);

  const glyphStyle = useAnimatedStyle(() => {
    const p = k.value;
    if (family === 'moon') return { transform: [{ translateY: (1 - p) * -logoMotion.moonDrop * (size / LOGO_GRID) * 2 }, { rotate: `${(1 - p) * logoMotion.moonTurnDeg}deg` }] };
    if (family === 'meal') return { transform: [{ scale: 1 + (logoMotion.mealPop - 1) * Math.sin(Math.min(1, p) * Math.PI) }] };
    if (family === 'glint') return { transform: [{ translateY: -2 * Math.sin(Math.min(1, p) * Math.PI) * (size / LOGO_GRID) }] };
    return {};
  });
  const ringStyle = useAnimatedStyle(() => ({ opacity: ringOn.value, transform: [{ rotate: `${spin.value}deg` }] }));
  const glintStyle = useAnimatedStyle(() => ({ opacity: family === 'glint' || family === 'moon' ? 0.6 * Math.sin(Math.min(1, k.value) * Math.PI) : 0, transform: [{ translateX: (k.value * 1.6 - 0.8) * size }, { rotate: '24deg' }] }));
  const drawProps = useAnimatedProps(() => ({ strokeDashoffset: (family === 'curve' ? CURVE_LEN : CHECK_LEN) * (1 - k.value) }));
  const extraStyle = useAnimatedStyle(() => ({ opacity: extra.value }));
  const starsStyle = useAnimatedStyle(() => ({ opacity: family === 'moon' ? Math.max(0, k.value * 2 - 1) * Math.sin(Math.min(1, k.value) * Math.PI) : 0 }));

  const r = squircleRadius(size);
  const abs = StyleSheet.absoluteFill;
  const owner = symbolKey ? TOOL_SYMBOLS[symbolKey] : null;
  const fallback: HomiIconDef = HOMI_ICONS[iconName];
  const rootId = testID ?? (id ? `tool-logo-${id}` : undefined);
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      pointerEvents="none"
      testID={rootId}
      style={[{ width: size, height: size, opacity: disabled ? 0.45 : 1 }, plateStyle, style]}
    >
      {/* plaque de verre dépoli (image fournie) */}
      <View style={[abs, { borderRadius: r, boxShadow: logoShadow(pub, size, v, mode) }]} testID={rootId ? `${rootId}-plate-${v}` : undefined}>
        <Image source={glassPlate(cat)} accessibilityIgnoresInvertColors style={{ width: size, height: size }} />
      </View>

      {/* lumière du public, au centre, derrière le dessin */}
      <Animated.View style={[abs, lightStyle]} testID={rootId ? `${rootId}-light-${pub}` : undefined}>
        <Light color={lightColor} uid={uid} size={size} radius={LOGO_LIGHT.radius[v]} />
      </Animated.View>

      {/* reflet qui traverse la plaque (ouverture) */}
      <View style={[abs, { borderRadius: r, overflow: 'hidden' }]}>
        <Animated.View style={[{ position: 'absolute', top: -size * 0.3, left: size * 0.35, width: size * 0.22, height: size * 1.6, backgroundColor: PEARL.highlight, opacity: 0 }, glintStyle]} />
      </View>

      {/* symbole nacré (couche animée) */}
      <Animated.View style={[abs, glyphStyle]}>
        <PearlSymbol d={owner ?? fallback.stroke} dots={owner ? undefined : fallback.dots} uid={uid} size={size} variant={v} glow={lightColor} tint={SYMBOL_GLOW.tint[mode]} />
      </Animated.View>

      {/* lune : deux étoiles s'allument pendant que le croissant se pose */}
      {family === 'moon' ? (
        <Animated.View style={[abs, starsStyle]}>
          <Svg width={size} height={size} viewBox={`0 0 ${LOGO_GRID} ${LOGO_GRID}`}>
            <Circle cx={49} cy={13} r={1.8} fill={PEARL.top} />
            <Circle cx={54} cy={20} r={1.1} fill={PEARL.top} />
          </Svg>
        </Animated.View>
      ) : null}

      {/* courbe ou coche (tracé temporaire) */}
      {family === 'curve' || family === 'check' ? (
        <Animated.View style={[abs, extraStyle]}>
          <Svg width={size} height={size} viewBox={`0 0 ${LOGO_GRID} ${LOGO_GRID}`}>
            {family === 'check' ? <Circle cx={49.5} cy={47.5} r={9} fill={PEARL.top} /> : null}
            <AnimatedPath d={family === 'curve' ? CURVE_D : CHECK_D} fill="none" stroke={family === 'curve' ? PEARL.top : lightColor} strokeWidth={family === 'curve' ? 2.6 : 2.4}
              strokeLinecap="round" strokeLinejoin="round" strokeDasharray={family === 'curve' ? [CURVE_LEN, CURVE_LEN] : [CHECK_LEN, CHECK_LEN]} animatedProps={drawProps} />
          </Svg>
        </Animated.View>
      ) : null}

      {/* minuteur en cours : anneau (famille ring) ou pastille d'activité */}
      {family === 'ring' ? (
        <Animated.View style={[abs, ringStyle]} testID={running ? `${testID ?? `tool-logo-${id}`}-running` : undefined}>
          <Svg width={size} height={size} viewBox={`0 0 ${LOGO_GRID} ${LOGO_GRID}`}>
            <Circle cx={32} cy={32} r={RING_R} fill="none" stroke={PEARL.top} strokeOpacity={0.3} strokeWidth={2} />
            <Circle cx={32} cy={32} r={RING_R} fill="none" stroke={PEARL.top} strokeWidth={2.6} strokeLinecap="round"
              strokeDasharray={[RING_C * logoMotion.ringArc, RING_C]} />
          </Svg>
        </Animated.View>
      ) : running ? (
        <View testID={`${testID ?? `tool-logo-${id}`}-running`} style={{ position: 'absolute', right: -2, top: -2, width: Math.max(10, size * 0.24), height: Math.max(10, size * 0.24), borderRadius: 99, backgroundColor: lightColor, borderWidth: 2, borderColor: t.colors.surface }} />
      ) : null}
    </Animated.View>
  );
}

/** Lumière : disque radial centré (opacité relative 1 → 0) ; l'intensité réelle est l'opacité de la couche. Même dessin que svg.ts. */
const Light = React.memo(function Light({ color, uid, size, radius }: { color: string; uid: string; size: number; radius: number }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${SYMBOL_BOX} ${SYMBOL_BOX}`}>
      <Defs>
        <RadialGradient id={`${uid}l`} cx="0.5" cy="0.5" r="0.5">
          {LIGHT_STOPS.map(([o, a]) => <Stop key={o} offset={o} stopColor={color} stopOpacity={a} />)}
        </RadialGradient>
      </Defs>
      <Circle cx={SYMBOL_BOX / 2} cy={SYMBOL_BOX / 2} r={SYMBOL_BOX * radius} fill={`url(#${uid}l)`} />
    </Svg>
  );
});

/** Symbole nacré (construction des fichiers fournis) : ombre portée, trait en dégradé nacré, filet de lumière (détaillé). */
const PearlSymbol = React.memo(function PearlSymbol({ d, dots, uid, size, variant, glow, tint }: { d: string; dots?: [number, number, number][]; uid: string; size: number; variant: LogoVariant; glow: string; tint: number }) {
  const sw = SYMBOL_STROKE[variant];
  const lit = mixHex(PEARL.top, glow, tint);
  const ink = `url(#${uid}p)`;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${SYMBOL_BOX} ${SYMBOL_BOX}`}>
      <Defs>
        <LinearGradient id={`${uid}p`} x1="0" y1="0" x2="0.4" y2="1">
          <Stop offset="0" stopColor={PEARL.top} />
          <Stop offset="1" stopColor={lit} />
        </LinearGradient>
      </Defs>
      <G transform={SYMBOL_TRANSFORM}>
        {/* le symbole s'allume : halos de la couleur du public autour du trait (du plus large au plus serré) */}
        {SYMBOL_GLOW.bloom.map(([k, a]) => (
          <G key={k} opacity={a}>
            <Path d={d} fill="none" stroke={glow} strokeWidth={sw.pearl * k} strokeLinecap="round" strokeLinejoin="round" />
            {dots?.map(([cx, cy, rr]) => <Circle key={`g${k}${cx}-${cy}`} cx={cx} cy={cy} r={rr * k * 0.8} fill={glow} />)}
          </G>
        ))}
        <G transform="translate(0 0.42)" opacity={PEARL.shadowOpacity}>
          <Path d={d} fill="none" stroke={PEARL.shadow} strokeWidth={sw.shadow} strokeLinecap="round" strokeLinejoin="round" />
          {dots?.map(([cx, cy, rr]) => <Circle key={`s${cx}-${cy}`} cx={cx} cy={cy} r={rr} fill={PEARL.shadow} />)}
        </G>
        <Path d={d} fill="none" stroke={ink} strokeWidth={sw.pearl} strokeLinecap="round" strokeLinejoin="round" />
        {dots?.map(([cx, cy, rr]) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={rr} fill={PEARL.top} />)}
        {sw.highlight ? (
          <G transform="translate(0 -0.23)" opacity={PEARL.highlightOpacity}>
            <Path d={d} fill="none" stroke={PEARL.highlight} strokeWidth={sw.highlight} strokeLinecap="round" strokeLinejoin="round" />
          </G>
        ) : null}
      </G>
    </Svg>
  );
});
