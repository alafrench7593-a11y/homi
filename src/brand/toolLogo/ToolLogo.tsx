/**
 * `ToolLogo` — logo d'un outil HOMI façon icône d'app (direction « verre minéral », docs/DA_LIQUID_GLASS.md).
 *
 * TROIS RENDUS, un seul composant, une seule source par identifiant (`toolLogoDef`) :
 *  1. `detailed` (≥ 48 pt par défaut) : en-tête de l'outil, raccourcis mis en avant — plaque, reflet, ombre interne,
 *     ombre du glyphe, ombre portée ;
 *  2. `compact` (< 48 pt) : catalogue, listes, recherche — même plaque, glyphe un peu plus grand et trait plus franc,
 *     sans ombre du glyphe ;
 *  3. ANIMÉ : la famille de l'outil réagit à une interaction réelle —
 *       `play` (compteur) : ouverture, ajout, confirmation (lune qui se pose, courbe qui se trace, coche, rebond, reflet) ;
 *       `running` : l'anneau tourne tant que le minuteur tourne et s'arrête avec lui (famille `ring`) ;
 *       `pressed` : la plaque s'enfonce (0,94, ressort vif).
 *
 * Au repos, rien ne bouge. « Réduire les animations » : même état final immédiatement (l'anneau d'un minuteur en
 * cours reste VISIBLE, sans rotation). Nuit : plaque désaturée, fondus courts. Décoratif pour les lecteurs d'écran
 * (la rangée ou le bouton qui le porte a son nom). Tout tourne sur le fil UI (transform, opacité, un tracé SVG).
 */
import React, { useEffect, useId, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { HOMI_ICONS, type HomiIconName } from '@/brand/icons/paths';
import type { HomiIconDef } from '@/brand/icons/geometry';
import { logoMotion, useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { logoMode, toolLogoSpec, type LogoCategory } from '@/theme/toolLogo';
import { motionOfIcon, toolLogoDef, type LogoMotion } from './families';
import { GLYPH_BOX, glyphTransform, LOGO_GRID, SHEEN, squirclePath, squircleRadius, squircleTopEdge, type LogoVariant } from './geometry';

const PLATE = squirclePath();
const TOP_EDGE = squircleTopEdge();
const AnimatedPath = Animated.createAnimatedComponent(Path);
/** Courbe de croissance (grille 64) et sa longueur approchée. */
const CURVE_D = 'M11 47 C 20 46 25 41 31 36 S 44 24 53 17';
const CURVE_LEN = 54;
const CHECK_D = 'M45.5 47.5 L48.6 50.6 L54 44.6';
const CHECK_LEN = 12.5;
const RING_R = 26.5;
const RING_C = 2 * Math.PI * RING_R;

export interface ToolLogoProps {
  /** Identifiant stable du catalogue (outil, sous-accès, `h200_<n>`, `quick.<clé>`, `cat.<catégorie>`). */
  id?: string | null;
  /** Pictogramme imposé (sinon : celui du manifeste pour `id`). */
  icon?: HomiIconName;
  /** Teinte imposée (sinon : celle de la catégorie de `id`). */
  category?: LogoCategory;
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

export function ToolLogo({ id, icon: forcedIcon, category: forcedCat, size = 44, variant, play = 0, running = false, pressed = false, disabled = false, urgent, motion: forcedMotion, style, testID }: ToolLogoProps) {
  const t = useTheme();
  const m = useMotion();
  const def = toolLogoDef(id, urgent);
  const iconName = forcedIcon ?? def?.icon ?? 'tools';
  const cat: LogoCategory = forcedCat ?? def?.category ?? (urgent ? 'urgent' : 'account');
  const family: LogoMotion = forcedMotion ?? (forcedIcon ? motionOfIcon(forcedIcon) : def?.motion ?? 'glint');
  const v: LogoVariant = variant ?? (size >= 48 ? 'detailed' : 'compact');
  const spec = toolLogoSpec(cat, logoMode(t));
  const glyph: HomiIconDef = HOMI_ICONS[iconName];
  const uid = `tl${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const sw = glyph.heavy ? 2.25 : GLYPH_BOX[v].stroke;
  const still = m.level === 'off' || cat === 'urgent';

  // ------------------------------------------------------------ animation de famille (0 → 1), relancée par `play`
  const k = useSharedValue(1);
  const extra = useSharedValue(0); // tracé temporaire (courbe, coche) : 0 caché, 1 visible
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (still) return; // état final immédiat : rien à jouer
    if (family === 'curve' || family === 'check') {
      const draw = family === 'curve' ? logoMotion.curveDrawMs : logoMotion.checkDrawMs;
      k.value = 0;
      k.value = m.timing(1, draw, 'reveal');
      extra.value = withSequence(withTiming(1, { duration: 1 }), withTiming(1, { duration: draw + logoMotion.holdMs }), withTiming(0, { duration: m.duration(logoMotion.fadeMs) }));
    } else {
      k.value = 0;
      k.value = family === 'meal' ? m.spring(1, 'rebondLeger') : m.spring(1, 'doux');
    }
  }, [play, still, family, m, k, extra]);

  // ------------------------------------------------------------ pression
  const press = useSharedValue(0);
  useEffect(() => { press.value = m.spring(pressed ? 1 : 0, 'vif'); }, [pressed, m, press]);
  const plateStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - (1 - logoMotion.pressScale) * press.value }] }));

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
  useEffect(() => () => { cancelAnimation(spin); cancelAnimation(k); cancelAnimation(extra); }, [spin, k, extra]);

  const glyphStyle = useAnimatedStyle(() => {
    const p = k.value;
    if (family === 'moon') return { transform: [{ translateY: (1 - p) * -logoMotion.moonDrop * (size / LOGO_GRID) * 2 }, { rotate: `${(1 - p) * logoMotion.moonTurnDeg}deg` }] };
    if (family === 'meal') return { transform: [{ scale: 1 + (logoMotion.mealPop - 1) * Math.sin(Math.min(1, p) * Math.PI) }] };
    if (family === 'glint') return { transform: [{ translateY: -2 * Math.sin(Math.min(1, p) * Math.PI) * (size / LOGO_GRID) }] };
    return {};
  });
  const ringStyle = useAnimatedStyle(() => ({ opacity: ringOn.value, transform: [{ rotate: `${spin.value}deg` }] }));
  const glintStyle = useAnimatedStyle(() => ({ opacity: family === 'glint' || family === 'moon' ? Math.sin(Math.min(1, k.value) * Math.PI) : 0, transform: [{ translateX: (k.value * 1.6 - 0.8) * size }, { rotate: '24deg' }] }));
  const drawProps = useAnimatedProps(() => ({ strokeDashoffset: (family === 'curve' ? CURVE_LEN : CHECK_LEN) * (1 - k.value) }));
  const extraStyle = useAnimatedStyle(() => ({ opacity: extra.value }));
  const starsStyle = useAnimatedStyle(() => ({ opacity: family === 'moon' ? Math.max(0, k.value * 2 - 1) * Math.sin(Math.min(1, k.value) * Math.PI) : 0 }));

  const r = squircleRadius(size);
  const abs = StyleSheet.absoluteFill;
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      pointerEvents="none"
      testID={testID ?? (id ? `tool-logo-${id}` : undefined)}
      style={[{ width: size, height: size, opacity: disabled ? 0.45 : 1 }, plateStyle, style]}
    >
      <View style={[abs, { borderRadius: r, boxShadow: v === 'detailed' && spec.drop !== 'none' ? spec.drop : undefined }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${LOGO_GRID} ${LOGO_GRID}`}>
          <Defs>
            <LinearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={spec.top} />
              <Stop offset="1" stopColor={spec.bottom} />
            </LinearGradient>
            <RadialGradient id={`${uid}s`} cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor={spec.light} stopOpacity={spec.sheen} />
              <Stop offset="1" stopColor={spec.light} stopOpacity={0} />
            </RadialGradient>
            <LinearGradient id={`${uid}h`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.55" stopColor={spec.shade} stopOpacity={0} />
              <Stop offset="1" stopColor={spec.shade} stopOpacity={spec.shadeOpacity} />
            </LinearGradient>
            <ClipPath id={`${uid}c`}><Path d={PLATE} /></ClipPath>
          </Defs>
          <Path d={PLATE} fill={`url(#${uid}b)`} />
          <G clipPath={`url(#${uid}c)`}>
            <Ellipse cx={SHEEN.cx} cy={SHEEN.cy} rx={SHEEN.rx} ry={SHEEN.ry} transform={`rotate(${SHEEN.rotate} ${SHEEN.cx} ${SHEEN.cy})`} fill={`url(#${uid}s)`} />
            <Path d={PLATE} fill={`url(#${uid}h)`} />
          </G>
          {v === 'detailed' ? (
            <G transform={glyphTransform(v, 0.9)} opacity={0.35}>
              {glyph.fill ? <Path d={glyph.fill} fill={spec.shade} /> : null}
              <Path d={glyph.stroke} fill="none" stroke={spec.shade} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
            </G>
          ) : null}
          <Path d={TOP_EDGE} fill="none" stroke={spec.light} strokeOpacity={spec.rim} strokeWidth={1} strokeLinecap="round" />
          <Path d={PLATE} fill="none" stroke={spec.bottom} strokeOpacity={0.35} strokeWidth={0.6} />
        </Svg>
      </View>

      {/* reflet qui traverse la plaque (ouverture) */}
      <View style={[abs, { borderRadius: r, overflow: 'hidden' }]}>
        <Animated.View style={[{ position: 'absolute', top: -size * 0.3, left: size * 0.35, width: size * 0.22, height: size * 1.6, backgroundColor: spec.light, opacity: 0 }, glintStyle]} />
      </View>

      {/* glyphe (couche animée) */}
      <Animated.View style={[abs, glyphStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${LOGO_GRID} ${LOGO_GRID}`}>
          <G transform={glyphTransform(v)}>
            {glyph.fill ? <Path d={glyph.fill} fill={spec.glyph} fillOpacity={spec.glyphFillOpacity} /> : null}
            <Path d={glyph.stroke} fill="none" stroke={spec.glyph} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
            {glyph.dots?.map(([cx, cy, rr]) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={rr} fill={spec.glyph} />)}
          </G>
        </Svg>
      </Animated.View>

      {/* lune : deux étoiles s'allument pendant que le croissant se pose */}
      {family === 'moon' ? (
        <Animated.View style={[abs, starsStyle]}>
          <Svg width={size} height={size} viewBox={`0 0 ${LOGO_GRID} ${LOGO_GRID}`}>
            <Circle cx={49} cy={13} r={1.8} fill={spec.glyph} />
            <Circle cx={54} cy={20} r={1.1} fill={spec.glyph} />
          </Svg>
        </Animated.View>
      ) : null}

      {/* courbe ou coche (tracé temporaire) */}
      {family === 'curve' || family === 'check' ? (
        <Animated.View style={[abs, extraStyle]}>
          <Svg width={size} height={size} viewBox={`0 0 ${LOGO_GRID} ${LOGO_GRID}`}>
            {family === 'check' ? <Circle cx={49.5} cy={47.5} r={9} fill={spec.glyph} /> : null}
            <AnimatedPath d={family === 'curve' ? CURVE_D : CHECK_D} fill="none" stroke={family === 'curve' ? spec.glyph : spec.mid} strokeWidth={family === 'curve' ? 2.6 : 2.4}
              strokeLinecap="round" strokeLinejoin="round" strokeDasharray={family === 'curve' ? [CURVE_LEN, CURVE_LEN] : [CHECK_LEN, CHECK_LEN]} animatedProps={drawProps} />
          </Svg>
        </Animated.View>
      ) : null}

      {/* minuteur en cours : anneau (famille ring) ou pastille d'activité */}
      {family === 'ring' ? (
        <Animated.View style={[abs, ringStyle]} testID={running ? `${testID ?? `tool-logo-${id}`}-running` : undefined}>
          <Svg width={size} height={size} viewBox={`0 0 ${LOGO_GRID} ${LOGO_GRID}`}>
            <Circle cx={32} cy={32} r={RING_R} fill="none" stroke={spec.glyph} strokeOpacity={0.22} strokeWidth={2} />
            <Circle cx={32} cy={32} r={RING_R} fill="none" stroke={spec.glyph} strokeWidth={2.6} strokeLinecap="round"
              strokeDasharray={[RING_C * logoMotion.ringArc, RING_C]} />
          </Svg>
        </Animated.View>
      ) : running ? (
        <View testID={`${testID ?? `tool-logo-${id}`}-running`} style={{ position: 'absolute', right: -2, top: -2, width: Math.max(10, size * 0.24), height: Math.max(10, size * 0.24), borderRadius: 99, backgroundColor: spec.mid, borderWidth: 2, borderColor: t.colors.surface }} />
      ) : null}
    </Animated.View>
  );
}
