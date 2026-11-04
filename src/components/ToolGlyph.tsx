/**
 * Glyphes des outils : une silhouette propre à chaque catégorie (goutte, nuage, dent, bouclier,
 * anneau segmenté, cadre de scan, orbite, soleil, cartes empilées…) — pas un cercle partout.
 *
 * - Surface translucide teintée + reflet supérieur + liseré : uniquement des couleurs du thème
 *   (avec transparence), aucune nouvelle couleur.
 * - Icône vectorielle existante (Feather) posée au centre OPTIQUE de la silhouette (`dy`).
 * - États : normal, survol (web), pressé, actif, désactivé, et une animation propre au thème
 *   jouée à l'ouverture (`play` change) — jamais en boucle.
 * - « Réduire les animations » : état final immédiat. Urgences : aucune animation.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient as NativeGradient } from 'expo-linear-gradient';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Icon, type IconName } from '@/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { toolGlyphIcon } from './toolGlyphIcons';
import { AnimatedPath } from '@/components/MotionKit';
import type { ToolTheme } from '@/lib/domain/toolCatalog';
import { easing } from '@/theme/motion';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { NACRE, NATIVE_DRIVER } from '@/theme/tokens';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
let seq = 0;

type ColorKey = 'primary' | 'lavender' | 'gold' | 'success' | 'heart' | 'danger';

/** Couleur (du thème), silhouette (viewBox 56) et décalage optique de l'icône. */
const SPEC: Record<ToolTheme | 'urgent', { color: ColorKey; shape: string; dy: number; icon?: boolean }> = {
  feeding: { color: 'primary', dy: 6, shape: 'M28 4 C28 4 8 25 8 36 A20 20 0 0 0 48 36 C48 25 28 4 28 4 Z' },
  sleep: { color: 'lavender', dy: 3, shape: 'M15 44 C8 44 4 39 4 33 C4 27 9 22.5 15 23 C16 15 22 10 29.5 10 C37.5 10 43.5 16 44 23.5 C49.5 24 53 28.5 53 34 C53 39.5 48.5 44 43 44 Z' },
  diapers: { color: 'gold', dy: -3, shape: 'M18 5 H38 C47.5 5 51 8.5 51 18 V38 C51 47.5 47.5 51 38 51 H18 C8.5 51 5 47.5 5 38 V18 C5 8.5 8.5 5 18 5 Z' },
  teeth: { color: 'lavender', dy: 0, icon: false, shape: 'M16 8 C9 10 7.5 19 10.5 28 C12.5 34.5 13.5 47 18.5 48 C23 49 23 37 28 37 C33 37 33 49 37.5 48 C42.5 47 43.5 34.5 45.5 28 C48.5 19 47 10 40 8 C34.5 6.5 32 11 28 11 C24 11 21.5 6.5 16 8 Z' },
  growth: { color: 'success', dy: -5, shape: 'M16 5 H40 C48.5 5 51 7.5 51 16 V40 C51 48.5 48.5 51 40 51 H16 C7.5 51 5 48.5 5 40 V16 C5 7.5 7.5 5 16 5 Z' },
  health: { color: 'heart', dy: -1, shape: 'M28 4 L48 11.5 V26.5 C48 39 40 47.5 28 52 C16 47.5 8 39 8 26.5 V11.5 Z' },
  mood: { color: 'gold', dy: 0, shape: 'M30 5 C42.5 5 52 14.5 51 28 C50 41.5 40.5 51 27 51 C13.5 51 5 41.5 5 29 C5 15.5 16.5 5 30 5 Z' },
  pregnancy: { color: 'lavender', dy: 1, shape: 'M28 4 C40.5 4 49 14.5 49 28.5 C49 42 40 52 28 52 C16 52 7 42 7 28.5 C7 14.5 15.5 4 28 4 Z' },
  cycle: { color: 'primary', dy: 0, shape: 'M28 13 A15 15 0 1 1 27.99 13 Z' },
  scanner: { color: 'lavender', dy: 0, shape: 'M14 9 H42 C45 9 47 11 47 14 V42 C47 45 45 47 42 47 H14 C11 47 9 45 9 42 V14 C9 11 11 9 14 9 Z' },
  calendar: { color: 'primary', dy: 3, shape: 'M14 10 H42 C47.5 10 50 12.5 50 18 V43 C50 48.5 47.5 51 42 51 H14 C8.5 51 6 48.5 6 43 V18 C6 12.5 8.5 10 14 10 Z' },
  tasks: { color: 'success', dy: 0, shape: 'M20 5 H36 C47 5 51 9 51 20 V36 C51 47 47 51 36 51 H20 C9 51 5 47 5 36 V20 C5 9 9 5 20 5 Z' },
  relay: { color: 'lavender', dy: 0, shape: 'M28 12 A16 16 0 1 1 27.99 12 Z' },
  metime: { color: 'gold', dy: 0, shape: 'M28 15 A13 13 0 1 1 27.99 15 Z' },
  prevention: { color: 'heart', dy: -2, shape: 'M10 14 C18 8 24 12 28 12 C32 12 38 8 46 14 C51 18 51 38 46 43 C38 49 32 45 28 45 C24 45 18 49 10 43 C5 38 5 18 10 14 Z' },
  memories: { color: 'gold', dy: 1, shape: 'M15 10 H41 C45 10 47 12 47 16 V42 C47 46 45 48 41 48 H15 C11 48 9 46 9 42 V16 C9 12 11 10 15 10 Z' },
  reminders: { color: 'primary', dy: 1, shape: 'M17 6 H39 C47 6 50 9 50 17 V39 C50 47 47 50 39 50 H17 C9 50 6 47 6 39 V17 C6 9 9 6 17 6 Z' },
  resources: { color: 'lavender', dy: 1, shape: 'M14 6 H36 L48 18 V44 C48 48 46 50 42 50 H14 C10 50 8 48 8 44 V12 C8 8 10 6 14 6 Z' },
  urgent: { color: 'danger', dy: 0, shape: 'M16 5 H40 C48.5 5 51 7.5 51 16 V40 C51 48.5 48.5 51 40 51 H16 C7.5 51 5 48.5 5 40 V16 C5 7.5 7.5 5 16 5 Z' },
};

/** Ajoute une transparence à une couleur #RRGGBB du thème. */
export function tint(hex: string, alpha: number) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
}

export function glyphColor(t: ReturnType<typeof useTheme>, theme: ToolTheme, urgent?: boolean) {
  return t.colors[SPEC[urgent ? 'urgent' : theme].color];
}

export interface ToolGlyphProps {
  /** Identifiant de l'outil (src/lib/journeys/tools.ts) : choisit le symbole propre à l'outil. */
  id?: string;
  theme: ToolTheme;
  icon: IconName;
  size?: number;
  /** Change à chaque ouverture : joue l'animation propre au thème. */
  play?: number;
  /** Survol web / pression : profondeur. */
  hovered?: boolean;
  pressed?: boolean;
  /** Outil en cours d'usage (minuteur en cours, nuit de relais…). */
  active?: boolean;
  disabled?: boolean;
  urgent?: boolean;
}

export function ToolGlyph({ id, theme, icon, size = 56, play = 0, hovered, pressed, active, disabled, urgent }: ToolGlyphProps) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const spec = SPEC[urgent ? 'urgent' : theme];
  const c = t.colors[spec.color];
  const still = reduce || urgent;

  // k : animation propre au thème (0 → 1), relancée à chaque `play`
  const k = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (still) return;
    k.setValue(0);
    const a = Animated.timing(k, { toValue: 1, duration: 760, easing: easing.decelerate, useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [play, still, k]);

  // profondeur : pression (enfoncement) et survol (soulèvement + reflet)
  const depth = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const to = pressed ? -1 : hovered ? 1 : 0;
    if (reduce) { depth.setValue(to); return; }
    Animated.spring(depth, { toValue: to, tension: 320, friction: 20, useNativeDriver: NATIVE_DRIVER }).start();
  }, [pressed, hovered, reduce, depth]);

  const s = size / 56;
  const iconSize = Math.round(22 * s);
  const fillA = t.isDark ? 0.2 : 0.14;
  const gid = useRef(`tg${++seq}`).current; // identifiants SVG uniques (plusieurs glyphes par page)
  const glyph = toolGlyphIcon(urgent ? 'urgent' : theme, icon, id);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size, height: size, opacity: disabled ? 0.45 : 1,
        transform: [
          { translateY: depth.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.5, 0, -2] }) },
          { scale: depth.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.92, 1, 1.04] }) },
        ],
      }}
    >
      {/* les cartes « souvenirs » s'éventaillent DERRIÈRE la silhouette */}
      {theme === 'memories' && !urgent ? <Overlay theme="memories" k={k} c={c} size={size} /> : null}
      <Svg width={size} height={size} viewBox="0 0 56 56" style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={t.isDark ? 0.16 : 0.55} />
            <Stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
          <ClipPath id={`${gid}-clip`}><Path d={spec.shape} /></ClipPath>
        </Defs>
        {/* ombre portée douce (même teinte) */}
        <Path d={spec.shape} fill={tint(c, 0.12)} transform="translate(0 1.6)" />
        {/* sous-couche (couleur de fond du thème) : contraste garanti quel que soit le décor derrière */}
        <Path d={spec.shape} fill={tint(t.colors.background, t.isDark ? 0.62 : 0.55)} />
        <Path d={spec.shape} fill={tint(c, fillA)} />
        <Decor theme={urgent ? 'urgent' : theme} k={k} c={c} clipId={`${gid}-clip`} />
        {/* reflet supérieur (matière de verre) */}
        <Path d={spec.shape} fill={`url(#${gid})`} />
        <Path d={spec.shape} fill="none" stroke={tint(c, active ? 0.95 : 0.42)} strokeWidth={active ? 2 : 1.2} strokeDasharray={disabled ? '3 3' : undefined} />
      </Svg>
      {theme !== 'memories' || urgent ? <Overlay theme={urgent ? 'urgent' : theme} k={k} c={c} size={size} /> : null}
      {spec.icon === false ? null : (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: spec.dy * s }] }}>
          {/* symbole plein propre à l'outil (biberon, dent, femme enceinte…) ; icône au trait si aucun n'est défini */}
          {glyph ? <NacreGlyph name={glyph} size={Math.round(iconSize * 1.18)} color={c} dark={t.isDark} /> : <Icon name={icon} size={iconSize} color={c} />}
        </View>
      )}
      {active ? <View style={{ position: 'absolute', right: 2 * s, top: 2 * s, width: 10 * s, height: 10 * s, borderRadius: 5 * s, backgroundColor: c, borderWidth: 2, borderColor: t.colors.surface }} /> : null}
    </Animated.View>
  );
}

/**
 * Symbole plein en dégradé nacré (variante B choisie le 04/11/2026) : champagne → rose doré → vieux rose, le dégradé
 * de la marque. Sur téléphone, le symbole sert de masque au dégradé ; sur le web (aperçus et tests), couleur unie.
 */
function NacreGlyph({ name, size, color, dark }: { name: string; size: number; color: string; dark: boolean }) {
  const icon = <MaterialCommunityIcons name={name as never} size={size} color={color} />;
  if (Platform.OS === 'web') return icon;
  const colors = dark ? ['#F3D3A8', NACRE[0], NACRE[1]] as const : [NACRE[0], NACRE[1], NACRE[2]] as const;
  return (
    <MaskedView maskElement={<View style={{ alignItems: 'center', justifyContent: 'center' }}>{icon}</View>} style={{ width: size, height: size }}>
      <NativeGradient colors={colors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ width: size, height: size }} />
    </MaskedView>
  );
}

/** Éléments SVG animés à l'intérieur de la silhouette (props SVG : pas de pilote natif). */
function Decor({ theme, k, c, clipId }: { theme: ToolTheme | 'urgent'; k: Animated.Value; c: string; clipId: string }) {
  const at = (a: number, b: number, from: number, to: number) => k.interpolate({ inputRange: [0, a, b, 1], outputRange: [from, from, to, to], extrapolate: 'clamp' });
  switch (theme) {
    case 'feeding': // le lait monte dans la goutte
      return <G clipPath={`url(#${clipId})`}><AnimatedRect x={0} width={56} height={56} y={k.interpolate({ inputRange: [0, 1], outputRange: [56, 36] })} fill={tint(c, 0.22)} /></G>;
    case 'diapers': // trois événements qui s'insèrent sur la frise
      return <G>{[16, 28, 40].map((x, i) => <AnimatedRect key={x} x={x - 3} width={6} height={6} rx={1.5} y={at(i * 0.2, 0.35 + i * 0.2, 30, 42)} fill={tint(c, 0.75)} opacity={at(i * 0.2, 0.3 + i * 0.2, 0, 1)} />)}</G>;
    case 'growth': // trois barres qui poussent
      return <G clipPath={`url(#${clipId})`}>{[[14, 8], [24, 13], [34, 19]].map(([x, h], i) => (
        <AnimatedRect key={x} x={x} width={7} rx={2} y={at(i * 0.15, 0.5 + i * 0.15, 51, 51 - h)} height={at(i * 0.15, 0.5 + i * 0.15, 0, h)} fill={tint(c, 0.38)} />
      ))}</G>;
    case 'health': { // le liseré se trace
      const L = 140;
      return <AnimatedPath d={SPEC.health.shape} fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeDasharray={`${L} ${L}`} strokeDashoffset={k.interpolate({ inputRange: [0, 1], outputRange: [L, 0] })} />;
    }
    case 'cycle': // huit segments qui s'allument l'un après l'autre
      return <G>{Array.from({ length: 8 }, (_, i) => {
        const a0 = (i / 8) * Math.PI * 2 - Math.PI / 2 + 0.08; const a1 = ((i + 1) / 8) * Math.PI * 2 - Math.PI / 2 - 0.08; const R = 23;
        const d = `M${28 + R * Math.cos(a0)} ${28 + R * Math.sin(a0)} A${R} ${R} 0 0 1 ${28 + R * Math.cos(a1)} ${28 + R * Math.sin(a1)}`;
        return <AnimatedPath key={i} d={d} fill="none" stroke={c} strokeWidth={3.2} strokeLinecap="round" opacity={at(i * 0.09, i * 0.09 + 0.2, 0.25, i < 5 ? 0.95 : 0.3)} />;
      })}</G>;
    case 'calendar': // reliure + jour du mois qui se pose
      return <G>
        <Rect x={17} y={5} width={4} height={10} rx={2} fill={c} /><Rect x={35} y={5} width={4} height={10} rx={2} fill={c} />
        <Rect x={6} y={10} width={44} height={9} rx={0} fill={tint(c, 0.22)} clipPath={`url(#${clipId})`} />
      </G>;
    case 'metime': // rayons qui s'étirent
      return <G>{Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2; const r0 = 17;
        return <AnimatedPath key={i} d={`M${28 + r0 * Math.cos(a)} ${28 + r0 * Math.sin(a)} L${28 + 24 * Math.cos(a)} ${28 + 24 * Math.sin(a)}`} stroke={c} strokeWidth={2.4} strokeLinecap="round"
          strokeDasharray="7 7" strokeDashoffset={at(i * 0.04, 0.5 + i * 0.04, 7, 0)} />;
      })}</G>;
    case 'prevention': // la vague s'apaise
      return <AnimatedPath d="M14 36 C19 31 23 41 28 36 C33 31 37 41 42 36" fill="none" stroke={tint(c, 0.6)} strokeWidth={2} strokeLinecap="round"
        transform="translate(0 0)" opacity={k.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] })} />;
    case 'resources': // coin de page
      return <Path d="M36 6 V14 C36 16.5 37.5 18 40 18 H48" fill="none" stroke={tint(c, 0.6)} strokeWidth={1.4} />;
    case 'pregnancy':
      return <Ellipse cx={28} cy={30} rx={13} ry={14} fill={tint(c, 0.12)} />;
    default:
      return null;
  }
}

/** Couches animées par transformation (pilote natif possible) au-dessus de la silhouette. */
function Overlay({ theme, k, c, size }: { theme: ToolTheme | 'urgent'; k: Animated.Value; c: string; size: number }) {
  const s = size / 56;
  const full = { position: 'absolute' as const, left: 0, top: 0, width: size, height: size };
  switch (theme) {
    case 'sleep': // deux étoiles qui scintillent, le nuage glisse doucement
      return (
        <Animated.View pointerEvents="none" style={[full, { opacity: k.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 1, 0.4, 0.85] }), transform: [{ translateX: k.interpolate({ inputRange: [0, 1], outputRange: [-2 * s, 0] }) }] }]}>
          <Svg width={size} height={size} viewBox="0 0 56 56"><Circle cx={46} cy={9} r={1.8} fill={c} /><Circle cx={51} cy={16} r={1.1} fill={c} /></Svg>
        </Animated.View>
      );
    case 'teeth': // éclat qui traverse la dent
      return (
        <Animated.View pointerEvents="none" style={[full, { overflow: 'hidden', opacity: k.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.9, 0.9, 0] }) }]}>
          <Animated.View style={{ position: 'absolute', top: -10 * s, width: 8 * s, height: 80 * s, backgroundColor: '#FFFFFF', opacity: 0.5, transform: [{ rotate: '25deg' }, { translateX: k.interpolate({ inputRange: [0, 1], outputRange: [-10 * s, 70 * s] }) }] }} />
          <Svg width={size} height={size} viewBox="0 0 56 56" style={{ position: 'absolute' }}><Path d="M20 17 C22 15.5 24 16 25 17" stroke={c} strokeWidth={1.6} fill="none" strokeLinecap="round" /></Svg>
        </Animated.View>
      );
    case 'mood': // la forme respire une fois
      return (
        <Animated.View pointerEvents="none" style={[full, { opacity: k.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.6, 0] }), transform: [{ scale: k.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] }) }] }]}>
          <Svg width={size} height={size} viewBox="0 0 56 56"><Path d={SPEC.mood.shape} fill="none" stroke={c} strokeWidth={1.2} /></Svg>
        </Animated.View>
      );
    case 'pregnancy':
    case 'reminders': { // ondes (lueur, rappel)
      return (
        <Animated.View pointerEvents="none" style={[full, { opacity: k.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.7, 0] }), transform: [{ scale: k.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.22] }) }] }]}>
          <Svg width={size} height={size} viewBox="0 0 56 56"><Circle cx={28} cy={28} r={24} fill="none" stroke={c} strokeWidth={1.4} /></Svg>
        </Animated.View>
      );
    }
    case 'scanner': // coins qui se resserrent, ligne qui balaie
      return (
        <>
          <Animated.View pointerEvents="none" style={[full, { transform: [{ scale: k.interpolate({ inputRange: [0, 1], outputRange: [1.18, 1] }) }] }]}>
            <Svg width={size} height={size} viewBox="0 0 56 56">
              {['M4 14 V8 C4 6 6 4 8 4 H14', 'M42 4 H48 C50 4 52 6 52 8 V14', 'M52 42 V48 C52 50 50 52 48 52 H42', 'M14 52 H8 C6 52 4 50 4 48 V42'].map((d) => <Path key={d} d={d} fill="none" stroke={c} strokeWidth={2.2} strokeLinecap="round" />)}
            </Svg>
          </Animated.View>
          <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 12 * s, right: 12 * s, height: 2, borderRadius: 1, backgroundColor: c, opacity: k.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.8, 0.8, 0] }), top: k.interpolate({ inputRange: [0, 1], outputRange: [12 * s, 44 * s] }) }} />
        </>
      );
    case 'calendar': // la page se pose depuis la reliure
      return (
        <Animated.View pointerEvents="none" style={[full, { opacity: k.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.9, 0.2, 0] }), transform: [{ translateY: k.interpolate({ inputRange: [0, 1], outputRange: [-3 * s, 8 * s] }) }] }]}>
          <Svg width={size} height={size} viewBox="0 0 56 56"><Rect x={9} y={20} width={38} height={2} rx={1} fill={c} /></Svg>
        </Animated.View>
      );
    case 'tasks': // coche dessinée dans un médaillon
      return (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', right: -2 * s, bottom: -2 * s, width: 20 * s, height: 20 * s, opacity: k.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 1] }), transform: [{ scale: k.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.4, 1.1, 1] }) }] }}>
          <Svg width={20 * s} height={20 * s} viewBox="0 0 20 20">
            <Circle cx={10} cy={10} r={9} fill={c} />
            <AnimatedPath d="M5.5 10.5 L8.5 13.5 L14.5 7" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="14 14" strokeDashoffset={k.interpolate({ inputRange: [0, 0.4, 1], outputRange: [14, 14, 0] })} />
          </Svg>
        </Animated.View>
      );
    case 'relay': // le témoin fait un demi-tour d'orbite (une personne → la suivante)
      return (
        <Animated.View pointerEvents="none" style={[full, { transform: [{ rotate: k.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg'] }) }] }]}>
          <Svg width={size} height={size} viewBox="0 0 56 56">
            <Circle cx={28} cy={28} r={24} fill="none" stroke={c} strokeOpacity={0.35} strokeWidth={1.2} strokeDasharray="2 4" />
            <Circle cx={28} cy={4} r={3.6} fill={c} />
          </Svg>
        </Animated.View>
      );
    case 'memories': // deux cartes qui s'éventaillent derrière la photo
      return (
        <>
          {[-1, 1].map((d) => (
            <Animated.View key={d} pointerEvents="none" style={[full, { opacity: 0.55, transform: [{ rotate: k.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${d * 9}deg`] }) }] }]}>
              <Svg width={size} height={size} viewBox="0 0 56 56"><Path d={SPEC.memories.shape} fill={tint(c, 0.12)} stroke={tint(c, 0.35)} strokeWidth={1} /></Svg>
            </Animated.View>
          ))}
        </>
      );
    case 'prevention':
      return null;
    default:
      return null;
  }
}

/** Tous les thèmes dessinés (planche de vérification visuelle). */
export const GLYPH_THEMES = Object.keys(SPEC) as (ToolTheme | 'urgent')[];
