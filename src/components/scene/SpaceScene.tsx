/**
 * Scène d'ESPACE HOMI v4 « lumière minérale » — fond de coque (une scène par espace) et illustration des aperçus.
 *
 * Remplace le « désert sci-fi » v3 : plus d'astre ni d'arc décoratif répété en haut à droite. Chaque espace a sa
 * COMPOSITION minérale, sa LUMIÈRE et son ACCENT secondaire (`src/theme/ambiance.ts`) :
 *   Accueil « Seuil » (plateaux + maison de verre) · Santé « Cairn » (galets en équilibre) · Bébé « Nid » (dunes rondes,
 *   galets lovés) · Famille « Strates » (terrasses) · Communauté « Monolithes » (pierres dressées ensemble) ·
 *   Réglages « Prisme » (cristal à facettes).
 * Clair : ciel bleu brume → ivoire → pêche, halo de lumière douce, pierres pâles, reflets lilas.
 * Sombre : obsidienne, pierres presque noires lisibles par leur arête éclairée, FAISCEAU de lumière directionnelle.
 *
 * Création originale, 100 % vectorielle (react-native-svg + dégradés), aucune image générée ni copiée. Toutes les
 * couleurs viennent de `spaceScene(theme, espace)` ; chaque couleur de zone est testée comme fond de texte
 * (contrast.test.ts) ; seuls des traits ≤ 2 px (arêtes, reflets) sont exclus.
 *
 * Variantes :
 *  - `immersive` : racine de chaque espace et ouverture — la composition occupe le haut de l'écran, du côté opposé au
 *    titre, au-dessus d'un sol qui reflète ;
 *  - `calm`      : écrans internes et denses — même lumière, même accent, composition réduite posée en bas.
 *
 * Mouvement : parallaxe LÉGÈRE (Reanimated, fil UI) — la composition et la lumière dérivent de 3 à 12 px sur 22 s.
 * Web : animation CSS (compositeur du navigateur), pas de calcul JS par image (audit 10).
 * Image fixe : application en arrière-plan, scène hors écran (`active={false}`), Réduire les animations, économie
 * d'énergie, thème nuit. Décorative : masquée aux lecteurs d'écran, aucun toucher.
 */
import React, { useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Ellipse, G, Line, LinearGradient as SvgLinear, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { useMotion } from '@/motion/useMotion';
import { AMBIANCES, spaceScene, type Composition, type SpaceKey } from '@/theme/ambiance';
import type { SceneColors } from '@/theme/tokens';

export type SceneVariant = 'immersive' | 'calm';

/** Constantes de la scène (testées). */
export const SCENE = {
  viewBox: { w: 390, h: 844 },
  /** Cadre de la composition immersive (largeur × hauteur, sol à `ground`) */
  stage: { w: 390, h: 420, ground: 330 },
  /** Bandeau de la composition calme (bas de l'écran) et échelle de la composition */
  band: { h: 150, scale: 0.42 },
  driftMs: 22000,
  /** amplitude horizontale (px) de chaque plan : lumière, composition lointaine, composition proche, reflets */
  parallax: [3, 6, 9, 12] as const,
} as const;

/** Routes où le fond est immersif : ouverture et RACINE de chaque espace ; partout ailleurs : calme. */
export const IMMERSIVE_ROUTES = ['/', '/welcome', '/intro', '/onboarding', '/discover', '/health', '/baby', '/household', '/community', '/settings'] as const;
export function backdropVariant(pathname: string | null | undefined): SceneVariant {
  if (!pathname) return 'calm';
  return IMMERSIVE_ROUTES.some((r) => (r === '/' ? pathname === '/' : r === '/welcome' || r === '/intro' || r === '/onboarding' || r === '/discover' ? pathname === r || pathname.startsWith(`${r}/`) : pathname === r)) ? 'immersive' : 'calm';
}

/** La scène s'anime-t-elle ? (logique pure, testée) */
export function sceneAnimates(o: { level: 'off' | 'minimal' | 'full'; appActive: boolean; active: boolean; still?: boolean }) {
  return o.level === 'full' && o.appActive && o.active && !o.still;
}

function useAppActive() {
  const [on, setOn] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setOn(s === 'active'));
    return () => sub.remove();
  }, []);
  return on;
}

const WEB = Platform.OS === 'web';
const webDrift = new Map<string, StyleProp<ViewStyle>>();
/** Web : aller-retour CSS équivalent (0 → amplitude, demi-période, sinusoïde approchée par ease-in-out). */
export function webDriftStyle(amp: number, lift: number): StyleProp<ViewStyle> {
  const key = `${amp}:${lift}`;
  let style = webDrift.get(key);
  if (!style) {
    style = StyleSheet.create({ d: {
      animationKeyframes: [{ '0%': { transform: 'translate3d(0px,0px,0px)' }, '100%': { transform: `translate3d(${amp}px,${-lift}px,0px)` } }],
      animationDuration: `${SCENE.driftMs / 2}ms`, animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDirection: 'alternate',
    } as unknown as ViewStyle }).d;
    webDrift.set(key, style);
  }
  return style;
}

/** Plan qui dérive ; `frame` : bande absolue (haut ou bas) au lieu de tout l'écran. */
function Plane({ drift, amp, children, lift = 0, animate, frame }: { drift: SharedValue<number>; amp: number; children: React.ReactNode; lift?: number; animate: boolean; frame?: ViewStyle }) {
  const box = frame ? [styles.band, frame] : StyleSheet.absoluteFill;
  if (WEB) return <View pointerEvents="none" style={[box, animate ? webDriftStyle(amp, lift) : null]}>{children}</View>;
  return <NativePlane drift={drift} amp={amp} lift={lift} box={box}>{children}</NativePlane>;
}

function NativePlane({ drift, amp, children, lift = 0, box }: { drift: SharedValue<number>; amp: number; children: React.ReactNode; lift?: number; box: StyleProp<ViewStyle> }) {
  const a = useAnimatedStyle(() => ({ transform: [{ translateX: drift.value * amp }, { translateY: lift ? -Math.abs(drift.value) * lift : 0 }] }));
  return <Animated.View pointerEvents="none" style={[box, a]}>{children}</Animated.View>;
}
const styles = StyleSheet.create({ band: { position: 'absolute', left: 0, right: 0 } });

// ------------------------------------------------------------------------------------------------ formes minérales
/** Galet / rocher arrondi irrégulier (4 courbes, base légèrement aplatie) — jamais un cercle parfait. */
export function pebble(cx: number, cy: number, rx: number, ry: number, tilt = 0): string {
  const k = 0.56;
  const t = tilt * ry;
  const top = [cx + rx * 0.08, cy - ry];
  const right = [cx + rx, cy + t * 0.2];
  const bottom = [cx - rx * 0.05, cy + ry * 0.82];
  const left = [cx - rx, cy - t * 0.2];
  const f = (n: number) => Math.round(n * 10) / 10;
  return `M${f(left[0])} ${f(left[1])} C${f(left[0])} ${f(left[1] - ry * k)} ${f(top[0] - rx * k)} ${f(top[1])} ${f(top[0])} ${f(top[1])} `
    + `C${f(top[0] + rx * k)} ${f(top[1])} ${f(right[0])} ${f(right[1] - ry * k)} ${f(right[0])} ${f(right[1])} `
    + `C${f(right[0])} ${f(right[1] + ry * 0.5)} ${f(bottom[0] + rx * 0.6)} ${f(bottom[1])} ${f(bottom[0])} ${f(bottom[1])} `
    + `C${f(bottom[0] - rx * 0.6)} ${f(bottom[1])} ${f(left[0])} ${f(left[1] + ry * 0.5)} ${f(left[0])} ${f(left[1])} Z`;
}

/** Galet complet : corps, face éclairée (du côté de la lumière), arête fine. */
function Pebble({ s, cx, cy, rx, ry, fill, lightRight, tilt = 0 }: { s: SceneColors; cx: number; cy: number; rx: number; ry: number; fill: string; lightRight?: boolean; tilt?: number }) {
  const side = lightRight ? 1 : -1;
  return (
    <>
      <Path d={pebble(cx, cy, rx, ry, tilt)} fill={fill} />
      <Path d={pebble(cx + side * rx * 0.22, cy - ry * 0.32, rx * 0.62, ry * 0.42, tilt)} fill={s.facet} opacity={0.75} />
      <Path d={`M${cx + side * rx * 0.15} ${cy - ry * 0.98} Q${cx + side * rx * 0.6} ${cy - ry * 0.9} ${cx + side * rx * 0.82} ${cy - ry * 0.55}`} fill="none" stroke={s.rim} strokeOpacity={0.7} strokeWidth={1} strokeLinecap="round" />
    </>
  );
}

/** Composition d'un espace, dans le cadre 390 × 420 (sol à y = 330). `floor` : sol qui reflète (immersive). */
function Stage({ composition, s, id, floor }: { composition: Composition; s: SceneColors; id: string; floor: boolean }) {
  const G0 = SCENE.stage.ground;
  const ground = floor ? (
    <>
      <Defs>
        <SvgLinear id={`fl${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={s.floor[0]} stopOpacity="1" />
          <Stop offset="1" stopColor={s.floor[1]} stopOpacity="0" />
        </SvgLinear>
      </Defs>
      <Rect x={-40} y={G0} width={470} height={90} fill={`url(#fl${id})`} />
    </>
  ) : null;
  switch (composition) {
    case 'threshold':
      // Accueil « Seuil » : chaîne de plateaux, mesa médiane portant la maison de verre à la fenêtre allumée
      return (
        <>
          <Path d="M-20 252 L40 240 L70 242 L96 224 L150 224 L172 238 L230 236 L250 216 L318 216 L338 234 L410 230 L410 330 L-20 330 Z" fill={s.stones[0]} />
          <Path d="M196 330 L212 262 L226 250 L332 250 L346 266 L362 330 Z" fill={s.stones[1]} />
          <Path d="M212 262 L226 250 L332 250 L320 259 L230 259 Z" fill={s.facet} />
          <Path d="M226 250 L332 250" stroke={s.rim} strokeWidth={1.2} strokeLinecap="round" />
          <Path d="M-20 330 L4 290 L18 280 L122 280 L136 296 L152 330 Z" fill={s.stones[2]} />
          <Path d="M4 290 L18 280 L122 280 L112 288 L20 288 Z" fill={s.facet} />
          <Path d="M18 280 L122 280" stroke={s.rim} strokeWidth={1.2} strokeLinecap="round" />
          {/* maison de verre : le foyer HOMI */}
          <Path d="M264 250 L264 226 L284 210 L304 226 L304 250 Z" fill={s.stones[0]} stroke={s.rim} strokeWidth={1} strokeLinejoin="round" />
          <Rect x={278} y={230} width={12} height={20} rx={2} fill={s.window} />
          {ground}
          {floor ? <Rect x={278} y={G0 + 6} width={12} height={14} rx={2} fill={s.window} opacity={0.35} /> : null}
        </>
      );
    case 'cairn':
      // Santé « Cairn » : galets empilés en équilibre (côté droit, lumière d'en haut à droite)
      return (
        <>
          <Path d="M-20 300 C70 288 150 296 230 302 C300 306 350 296 410 290 L410 330 L-20 330 Z" fill={s.stones[0]} />
          <Pebble s={s} cx={300} cy={306} rx={66} ry={22} fill={s.stones[2]} lightRight />
          <Pebble s={s} cx={294} cy={268} rx={48} ry={18} fill={s.stones[1]} lightRight tilt={0.3} />
          <Pebble s={s} cx={304} cy={236} rx={34} ry={15} fill={s.stones[2]} lightRight tilt={-0.3} />
          <Pebble s={s} cx={298} cy={210} rx={21} ry={11} fill={s.stones[1]} lightRight />
          <Pebble s={s} cx={70} cy={322} rx={24} ry={9} fill={s.stones[1]} lightRight />
          <Pebble s={s} cx={110} cy={326} rx={12} ry={5} fill={s.stones[2]} lightRight />
          {ground}
        </>
      );
    case 'nest':
      // Bébé « Nid » : dunes rondes et galets lovés les uns contre les autres (lumière du zénith)
      return (
        <>
          <Path d="M-20 272 C60 236 140 234 204 258 C262 280 322 262 410 236 L410 330 L-20 330 Z" fill={s.stones[0]} />
          <Path d="M-30 330 C10 284 84 268 150 288 C196 302 222 322 232 330 Z" fill={s.stones[1]} />
          <Path d="M240 330 C276 300 330 292 410 300 L410 330 Z" fill={s.stones[1]} />
          <Pebble s={s} cx={118} cy={300} rx={34} ry={26} fill={s.stones[2]} />
          <Pebble s={s} cx={160} cy={314} rx={22} ry={16} fill={s.stones[2]} lightRight />
          <Pebble s={s} cx={82} cy={318} rx={18} ry={12} fill={s.stones[1]} />
          <Pebble s={s} cx={136} cy={276} rx={12} ry={9} fill={s.facet} lightRight />
          {ground}
        </>
      );
    case 'strata':
      // Famille « Strates » : terrasses de roche en paliers, à droite (lumière rasante depuis la gauche)
      return (
        <G transform="translate(390 0) scale(-1 1)">
          <Path d="M280 330 L292 294 L362 294 L374 330 Z" fill={s.stones[0]} />
          <Path d="M-10 330 L-10 286 L250 286 L262 300 L272 330 Z" fill={s.stones[2]} />
          <Path d="M-10 286 L-10 250 L196 250 L206 264 L214 286 Z" fill={s.stones[1]} />
          <Path d="M-10 250 L-10 214 L140 214 L150 230 L156 250 Z" fill={s.stones[0]} />
          <Path d="M-10 214 L-10 184 L86 184 L94 198 L98 214 Z" fill={s.stones[1]} />
          {/* plateaux éclairés (dessus de chaque palier) */}
          <Path d="M-10 286 L214 286 L208 292 L-10 292 Z" fill={s.facet} />
          <Path d="M-10 250 L156 250 L150 256 L-10 256 Z" fill={s.facet} />
          <Path d="M-10 214 L98 214 L92 220 L-10 220 Z" fill={s.facet} />
          <Path d="M-10 184 L86 184 L82 189 L-10 189 Z" fill={s.facet} />
          {/* strates : traits fins */}
          <Line x1={-10} y1={306} x2={256} y2={306} stroke={s.rim} strokeOpacity={0.45} strokeWidth={0.8} />
          <Line x1={-10} y1={270} x2={204} y2={270} stroke={s.rim} strokeOpacity={0.45} strokeWidth={0.8} />
          <Line x1={-10} y1={234} x2={146} y2={234} stroke={s.rim} strokeOpacity={0.45} strokeWidth={0.8} />
          <Path d="M-10 184 L86 184 L94 198" fill="none" stroke={s.rim} strokeWidth={1.2} strokeLinecap="round" />
          {ground}
        </G>
      );
    case 'monoliths':
      // Communauté « Monolithes » : pierres dressées ensemble, en contre-jour, et leurs reflets
      return (
        <>
          <Path d="M-20 312 C80 304 180 308 260 310 C320 312 360 306 410 302 L410 330 L-20 330 Z" fill={s.stones[0]} />
          {MONOLITHS.map(([x, w, h, k], i) => (
            <G key={i}>
              <Path d={`M${x} ${G0} L${x + 2} ${G0 - h + 10} Q${x + w / 2} ${G0 - h - 4} ${x + w - 2} ${G0 - h + 8} L${x + w} ${G0} Z`} fill={k ? s.stones[2] : s.stones[1]} />
              <Path d={`M${x + 2} ${G0 - h + 10} Q${x + w / 2} ${G0 - h - 4} ${x + w - 2} ${G0 - h + 8}`} fill="none" stroke={s.rim} strokeWidth={1.2} strokeLinecap="round" />
              <Path d={`M${x + 2} ${G0 - h + 12} L${x + 7} ${G0 - h + 8} L${x + 7} ${G0} L${x} ${G0} Z`} fill={s.facet} />
              {floor ? <Path d={`M${x} ${G0} L${x + w} ${G0} L${x + w - 4} ${G0 + h * 0.35} L${x + 4} ${G0 + h * 0.35} Z`} fill={k ? s.stones[2] : s.stones[1]} opacity={0.22} /> : null}
            </G>
          ))}
          {ground}
        </>
      );
    case 'prism':
    default:
      // Réglages « Prisme » : cristal à facettes qui décompose un rayon de lumière en reflets de la palette
      return (
        <>
          <Path d="M-20 306 C90 300 200 304 280 306 C340 308 370 304 410 300 L410 330 L-20 330 Z" fill={s.stones[0]} />
          <Line x1={232} y1={176} x2={262} y2={196} stroke={s.rim} strokeWidth={1.2} strokeLinecap="round" />
          <Line x1={330} y1={212} x2={404} y2={232} stroke={s.glint} strokeWidth={1.4} strokeLinecap="round" />
          <Line x1={330} y1={222} x2={404} y2={256} stroke={s.glint} strokeOpacity={0.7} strokeWidth={1.2} strokeLinecap="round" />
          <Line x1={326} y1={232} x2={400} y2={282} stroke={s.glint} strokeOpacity={0.45} strokeWidth={1} strokeLinecap="round" />
          <Path d="M300 110 L348 170 L300 196 Z" fill={s.facet} />
          <Path d="M300 110 L300 196 L256 160 Z" fill={s.stones[0]} />
          <Path d="M256 160 L300 196 L296 312 L252 262 Z" fill={s.stones[1]} />
          <Path d="M300 196 L348 170 L340 270 L296 312 Z" fill={s.stones[2]} />
          <Path d="M300 110 L348 170 L340 270" fill="none" stroke={s.rim} strokeWidth={1.2} strokeLinejoin="round" />
          <Path d="M222 330 L232 300 L246 296 L252 330 Z" fill={s.stones[1]} />
          <Path d="M232 300 L246 296 L242 312 Z" fill={s.facet} />
          <Path d="M352 330 L360 310 L372 312 L374 330 Z" fill={s.stones[2]} />
          {ground}
        </>
      );
  }
}
/** Monolithes : x, largeur, hauteur, teinte proche (1) ou médiane (0). */
const MONOLITHS: [number, number, number, 0 | 1][] = [[150, 28, 74, 0], [186, 32, 116, 1], [226, 34, 148, 0], [268, 30, 100, 1], [304, 26, 66, 0]];

/** Cadrages SVG (valeurs techniques) */
const ASPECT = { meet: 'xMidYMid meet', top: 'xMidYMin slice', bottom: 'xMidYMax slice' } as const;

/** Haut du cadre immersif rogné (unités du cadre) : le sol arrive juste sous le titre de l'espace. */
export const STAGE_TOP: Record<Composition, number> = { threshold: 90, cairn: 120, nest: 110, strata: 110, monoliths: 110, prism: 90 };

/** Position de la composition calme (bas de l'écran) : côté opposé à la lumière, jamais le même pour deux espaces. */
const CALM_X: Record<Composition, number> = { threshold: 0.5, cairn: 0.62, nest: 0.08, strata: 0, monoliths: 0.34, prism: 0.58 };

/** Lumière de l'espace : halo doux (clair) ou faisceau directionnel (sombre), plus une brume d'horizon. */
function Light({ s, id, x, y, dark, groundY, strength }: { s: SceneColors; id: string; x: number; y: number; dark: boolean; groundY: number; strength: number }) {
  const lx = x * 390;
  const ly = y * 844;
  // faisceau : de la source vers le centre bas de l'écran
  const tx = 195 + (195 - lx) * 0.25;
  const ty = 760;
  const ang = Math.atan2(ty - ly, tx - lx);
  const nx = -Math.sin(ang);
  const ny = Math.cos(ang);
  const wedge = (w0: number, w1: number) => `M${lx + nx * w0} ${ly + ny * w0} L${tx + nx * w1} ${ty + ny * w1} L${tx - nx * w1} ${ty - ny * w1} L${lx - nx * w0} ${ly - ny * w0} Z`;
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <RadialGradient id={`lb${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={s.light} stopOpacity={dark ? 0.9 * strength : 1 * strength} />
          <Stop offset="1" stopColor={s.light} stopOpacity="0" />
        </RadialGradient>
        <SvgLinear id={`bm${id}`} x1={lx} y1={ly} x2={tx} y2={ty} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={s.light} stopOpacity={0.55 * strength} />
          <Stop offset="1" stopColor={s.light} stopOpacity="0" />
        </SvgLinear>
        <SvgLinear id={`hz${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={s.haze} stopOpacity="0" />
          <Stop offset="0.5" stopColor={s.haze} stopOpacity={0.8 * strength} />
          <Stop offset="1" stopColor={s.haze} stopOpacity="0" />
        </SvgLinear>
      </Defs>
      <Rect x={-40} y={groundY - 90} width={470} height={150} fill={`url(#hz${id})`} />
      {dark ? (
        <>
          <Path d={wedge(60, 260)} fill={`url(#bm${id})`} opacity={0.45} />
          <Path d={wedge(24, 130)} fill={`url(#bm${id})`} opacity={0.7} />
        </>
      ) : null}
      <Ellipse cx={lx} cy={ly} rx={dark ? 220 : 320} ry={dark ? 200 : 280} fill={`url(#lb${id})`} />
    </Svg>
  );
}

export function SpaceScene({ space = 'home', variant = 'calm', active = true, still, style, testID }: {
  space?: SpaceKey;
  variant?: SceneVariant;
  /** false : la scène n'est pas visible (écran non affiché) → image fixe */
  active?: boolean;
  /** Force l'image fixe */
  still?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const t = useTheme();
  const m = useMotion();
  const appActive = useAppActive();
  const win = useWindowDimensions();
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const W = box?.w ?? win.width;
  const H = box?.h ?? win.height;
  // boîte plus large que haute (rapport < 1,2) : vignette (composition entière à l'échelle)
  const framed = H / Math.max(1, W) < 1.2;
  const amb = AMBIANCES[space];
  const s = spaceScene(t, space);
  const id = React.useId().replace(/:/g, '');
  const drift = useSharedValue(0);
  const animate = sceneAnimates({ level: m.level, appActive, active, still });
  useEffect(() => {
    if (!animate || WEB) {
      cancelAnimation(drift);
      drift.value = withTiming(0, { duration: m.off ? 0 : 320 });
      return;
    }
    drift.value = withRepeat(withTiming(1, { duration: SCENE.driftMs / 2, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(drift);
  }, [animate, drift, m.off]);

  const immersive = variant === 'immersive';
  const [a1, a2] = SCENE.parallax;
  const st = SCENE.stage;
  // Immersive : cadre 390 × 420 à la largeur de l'écran, en haut ; vignette : cadre entier dans la boîte
  // Plein écran : le cadre est rogné en haut (`STAGE_TOP`) pour que la composition se pose dans l'en-tête (zone du
  // titre), visible au-dessus des premières cartes ; vignette : cadre entier
  const top = framed ? 0 : STAGE_TOP[amb.composition];
  const stageH = framed ? H : Math.round((W * (st.h - top)) / st.w);
  const stageGround = framed ? H * 0.78 : (stageH * (st.ground - top)) / (st.h - top);
  // Calme : composition réduite, posée sur le bas de l'écran
  const k = SCENE.band.scale;
  const bandH = Math.round((W * SCENE.band.h) / st.w);
  const calmTransform = `translate(${Math.round(CALM_X[amb.composition] * st.w * (1 - k))} ${Math.round(SCENE.band.h - 16 - st.ground * k)}) scale(${k})`;
  const groundY = immersive ? (framed ? 844 * 0.78 : (stageGround / H) * 844) : 844 - 30;
  return (
    <View pointerEvents="none" onLayout={(e) => { const { width, height } = e.nativeEvent.layout; if (width > 0 && height > 0) setBox((o) => (o && Math.abs(o.w - width) < 1 && Math.abs(o.h - height) < 1 ? o : { w: width, h: height })); }}
      style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: s.sky[1] }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID={testID ?? `scene-${variant}`}>
      <View testID={`scene-space-${space}`} style={StyleSheet.absoluteFill}>
        <LinearGradient colors={s.sky} locations={[0, 0.5, 1]} start={{ x: amb.light.x, y: 0 }} end={{ x: 1 - amb.light.x * 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
        <Plane animate={animate} drift={drift} amp={a1} lift={2}>
          <Light s={s} id={id} x={amb.light.x} y={amb.light.y} dark={t.isDark} groundY={groundY} strength={t.name === 'night' ? 0.5 : immersive ? 1 : 0.8} />
        </Plane>
        <Plane animate={animate} drift={drift} amp={a2}
          frame={immersive ? { top: 0, height: stageH } : { bottom: 0, height: bandH }}>
          {immersive ? (
            <Svg width={W + 24} height={stageH} style={{ position: 'absolute', left: -12, top: 0 }} viewBox={`0 ${top} ${st.w} ${st.h - top}`} preserveAspectRatio={framed ? ASPECT.meet : ASPECT.top}>
              <Stage composition={amb.composition} s={s} id={id} floor />
            </Svg>
          ) : (
            <Svg width={W + 24} height={bandH} style={{ position: 'absolute', left: -12, bottom: 0 }} viewBox={`0 0 ${st.w} ${SCENE.band.h}`} preserveAspectRatio={ASPECT.bottom}>
              <Rect x={-40} y={SCENE.band.h - 16} width={470} height={16} fill={s.floor[0]} />
              <G transform={calmTransform}>
                <Stage composition={amb.composition} s={s} id={id} floor={false} />
              </G>
            </Svg>
          )}
        </Plane>
      </View>
    </View>
  );
}
