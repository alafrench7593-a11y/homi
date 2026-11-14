/**
 * Scène HOMI v3 « désert sci-fi » — fond de coque (remplace PowderSky) et illustration des états vides importants.
 *
 * Création originale, 100 % vectorielle (react-native-svg + dégradés en couches), aucune image générée ni copiée :
 * ciel d'obsidienne (sombre) ou d'ivoire minéral (clair), astre géant éclairé d'en haut à gauche, arche de pierre,
 * dunes minérales, MAISON DE VERRE (la famille, le foyer) à la fenêtre allumée, eau calme qui reflète l'astre.
 * Toutes les couleurs viennent de `theme.material.scene` (calculées depuis la palette) : changer de palette déplace
 * ensemble la lumière, les reflets et les accents. Chaque couleur de zone est testée comme fond de texte
 * (contrast.test.ts) ; les seuls éléments exclus sont des traits ≤ 2 px (liseré de l'astre, arête, reflets).
 *
 * Variantes :
 *  - `immersive` : ouverture, accueil, états vides importants (scène complète) ;
 *  - `calm`      : écrans denses (ciel, petit astre dans le coin, horizon bas ; rien sous le contenu).
 *
 * Mouvement : parallaxe LÉGÈRE (Reanimated, fil UI) — quatre plans dérivent de 3 à 12 px sur 22 s, aller-retour.
 * Web : la même dérive passe par une animation CSS (compositeur du navigateur) ; Reanimated n'y a pas de fil UI et
 * recalculait les quatre plans en JS à chaque image (audit 10 : ≈ 64 % du fil principal au repos, CPU ×4).
 * Mise en pause (image fixe, animation annulée) : application en arrière-plan, scène hors écran (`active={false}`),
 * Réduire les animations, économie d'énergie, thème nuit. Décoratif : masqué aux lecteurs d'écran, aucun toucher.
 *
 * Évolution web documentée (non installée ici) : une version React Three Fiber (three.js) pourrait ajouter une vraie
 * profondeur (réfraction du verre, eau animée) sur ordinateur ; à n'envisager que derrière ce même composant.
 */
import React, { useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient as SvgLinear, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { useMotion } from '@/motion/useMotion';
import type { SceneColors } from '@/theme/tokens';

export type SceneVariant = 'immersive' | 'calm';

/** Constantes de la scène (testées). */
export const SCENE = {
  viewBox: { w: 390, h: 844 },
  driftMs: 22000,
  /** amplitude horizontale (px) de chaque plan : astre, lointain, médian, proche */
  parallax: [3, 6, 9, 12] as const,
} as const;

/** Routes où le fond de coque est immersif (ouverture, accueil) ; partout ailleurs : calme. */
export const IMMERSIVE_ROUTES = ['/', '/welcome', '/intro', '/onboarding', '/discover'] as const;
export function backdropVariant(pathname: string | null | undefined): SceneVariant {
  if (!pathname) return 'calm';
  return IMMERSIVE_ROUTES.some((r) => (r === '/' ? pathname === '/' : pathname === r || pathname.startsWith(`${r}/`))) ? 'immersive' : 'calm';
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

function Plane({ drift, amp, children, lift = 0, animate }: { drift: SharedValue<number>; amp: number; children: React.ReactNode; lift?: number; animate: boolean }) {
  if (WEB) return <View pointerEvents="none" style={[StyleSheet.absoluteFill, animate ? webDriftStyle(amp, lift) : null]}>{children}</View>;
  return <NativePlane drift={drift} amp={amp} lift={lift}>{children}</NativePlane>;
}

function NativePlane({ drift, amp, children, lift = 0 }: { drift: SharedValue<number>; amp: number; children: React.ReactNode; lift?: number }) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: drift.value * amp }, { translateY: lift ? -Math.abs(drift.value) * lift : 0 }] }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}

/**
 * Cadre « vignette » : dans une boîte plus large que haute (aperçu, état vide), la scène entière est montrée à
 * l'échelle (« meet ») à partir de l'horizon haut ; les bandes horizontales (ciel, dunes, eau) débordent à gauche et
 * à droite pour remplir la boîte. Plein écran (portrait) : « slice », ancré en bas.
 */
const FrameContext = React.createContext<number | null>(null);
const FRAMED_TOP = 170;

function Layer({ w, h, children, slice = 'xMidYMax slice' }: { w: number; h: number; children: React.ReactNode; slice?: string }) {
  const top = React.useContext(FrameContext);
  const framed = top !== null;
  const vy = top ?? 0;
  // plan un peu plus large que l'écran : la dérive ne découvre jamais le bord
  return (
    <Svg width={w + 32} height={h} style={{ position: 'absolute', left: -16, top: 0 }} viewBox={`0 ${vy} ${SCENE.viewBox.w} ${SCENE.viewBox.h - vy}`} preserveAspectRatio={framed ? 'xMidYMax meet' : slice}>
      {children}
    </Svg>
  );
}

function Planet({ s, id, cx, cy, r, halo }: { s: SceneColors; id: string; cx: number; cy: number; r: number; halo: string }) {
  return (
    <>
      <Defs>
        <RadialGradient id={`ph${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0.55" stopColor={halo} stopOpacity="0.9" />
          <Stop offset="1" stopColor={halo} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={`pf${id}`} cx="34%" cy="30%" r="80%" fx="30%" fy="26%">
          <Stop offset="0" stopColor={s.planet[0]} />
          <Stop offset="1" stopColor={s.planet[1]} />
        </RadialGradient>
        <SvgLinear id={`pr${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={s.rim} stopOpacity="1" />
          <Stop offset="0.55" stopColor={s.rim} stopOpacity="0.25" />
          <Stop offset="1" stopColor={s.rim} stopOpacity="0" />
        </SvgLinear>
        <ClipPath id={`pc${id}`}><Circle cx={cx} cy={cy} r={r} /></ClipPath>
      </Defs>
      <Circle cx={cx} cy={cy} r={r * 1.32} fill={`url(#ph${id})`} />
      <Circle cx={cx} cy={cy} r={r} fill={`url(#pf${id})`} />
      {/* bandes atmosphériques très discrètes */}
      <G clipPath={`url(#pc${id})`} opacity={0.5}>
        <Ellipse cx={cx} cy={cy + r * 0.25} rx={r * 1.3} ry={r * 0.16} fill="none" stroke={s.rim} strokeOpacity={0.12} strokeWidth={1} />
        <Ellipse cx={cx} cy={cy - r * 0.2} rx={r * 1.3} ry={r * 0.1} fill="none" stroke={s.rim} strokeOpacity={0.08} strokeWidth={1} />
      </G>
      <Circle cx={cx} cy={cy} r={r - 0.75} fill="none" stroke={`url(#pr${id})`} strokeWidth={1.5} />
    </>
  );
}

export function DesertScene({ variant = 'calm', active = true, still, style, testID }: {
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
  // boîte plus large que haute (rapport < 1,2) : vignette (scène entière à l'échelle)
  const framed = H / Math.max(1, W) < 1.2;
  const s = t.material.scene;
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
  const [a1, a2, a3, a4] = SCENE.parallax;
  return (
    <FrameContext.Provider value={framed ? (variant === 'immersive' ? FRAMED_TOP : 0) : null}>
    <View pointerEvents="none" onLayout={(e) => { const { width, height } = e.nativeEvent.layout; if (width > 0 && height > 0) setBox((o) => (o && Math.abs(o.w - width) < 1 && Math.abs(o.h - height) < 1 ? o : { w: width, h: height })); }}
      style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: s.sky[1] }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID={testID ?? `scene-${variant}`}>
      <LinearGradient colors={s.sky} locations={[0, 0.45, 0.82]} start={{ x: 0.3, y: 0 }} end={{ x: 0.6, y: 1 }} style={StyleSheet.absoluteFill} />
      {/* lueur d'horizon */}
      <Layer w={W} h={H}>
        <Defs>
          <RadialGradient id={`hz${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={s.horizon} stopOpacity="1" />
            <Stop offset="1" stopColor={s.horizon} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx={immersive ? 250 : 300} cy={immersive ? 610 : 820} rx={immersive ? 420 : 340} ry={immersive ? 170 : 120} fill={`url(#hz${id})`} />
      </Layer>
      {/* astre géant */}
      <Plane animate={animate} drift={drift} amp={a1} lift={immersive ? 3 : 0}>
        <Layer w={W} h={H} slice={immersive ? 'xMidYMax slice' : 'xMaxYMin slice'}>
          {immersive
            ? <Planet s={s} id={id} cx={300} cy={250} r={150} halo={s.horizon} />
            : <Planet s={s} id={id} cx={384} cy={64} r={78} halo={s.horizon} />}
        </Layer>
      </Plane>
      {/* plan lointain : dunes + arche de pierre */}
      <Plane animate={animate} drift={drift} amp={a2}>
        <Layer w={W} h={H}>
          {immersive ? (
            <>
              <Path d="M-420 600 C-200 590 -60 600 0 612 C60 590 120 584 190 598 C250 610 300 596 390 580 C520 560 680 590 810 600 L810 844 L-420 844 Z" fill={s.dunes[0]} />
              <Path fillRule="evenodd" d="M18 640 L18 486 Q18 392 98 384 Q178 392 178 486 L178 640 Z M58 640 L58 494 Q58 430 98 426 Q138 430 138 494 L138 640 Z" fill={s.arch} />
              {/* arête éclairée de l'arche, côté astre */}
              <Path d="M98 384 Q178 392 178 486 L178 600" fill="none" stroke={s.archRim} strokeWidth={1.2} strokeLinecap="round" />
              <Path d="M98 426 Q138 430 138 494" fill="none" stroke={s.archRim} strokeOpacity={0.5} strokeWidth={1} strokeLinecap="round" />
            </>
          ) : (
            <Path d="M-420 786 C-200 776 -80 784 0 790 C80 772 160 770 230 782 C300 794 340 784 390 770 C520 760 680 780 810 784 L810 844 L-420 844 Z" fill={s.dunes[0]} />
          )}
        </Layer>
      </Plane>
      {immersive ? (
        <>
          {/* plan médian : dune + maison de verre */}
          <Plane animate={animate} drift={drift} amp={a3}>
            <Layer w={W} h={H}>
              <Defs>
                <RadialGradient id={`wg${id}`} cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={s.window} stopOpacity="0.8" />
                  <Stop offset="1" stopColor={s.window} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Path d="M-420 664 C-220 650 -80 660 0 672 C70 650 150 646 230 660 C300 672 350 664 390 652 C520 640 680 662 810 668 L810 844 L-420 844 Z" fill={s.dunes[1]} />
              <Ellipse cx={288} cy={662} rx={70} ry={20} fill={`url(#wg${id})`} />
              <Path d="M252 664 L252 616 L288 586 L324 616 L324 664 Z" fill={s.house} stroke={s.archRim} strokeWidth={1} strokeLinejoin="round" />
              <Path d="M252 616 L288 586" stroke={s.rim} strokeWidth={1.2} strokeLinecap="round" />
              <Rect x={276} y={626} width={24} height={38} rx={3} fill={s.window} />
              <Rect x={260} y={624} width={10} height={12} rx={2} fill={s.window} opacity={0.7} />
            </Layer>
          </Plane>
          {/* plan proche : rive + eau qui reflète l'astre */}
          <Plane animate={animate} drift={drift} amp={a4}>
            <Layer w={W} h={H}>
              <Defs>
                <SvgLinear id={`wt${id}`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={s.water[0]} />
                  <Stop offset="1" stopColor={s.water[1]} />
                </SvgLinear>
              </Defs>
              <Path d="M-420 700 C-220 692 -80 698 0 704 C90 690 180 688 260 698 C320 706 360 702 390 696 C520 686 680 700 810 702 L810 844 L-420 844 Z" fill={s.dunes[2]} />
              <Path d="M-420 724 C-220 718 -80 724 -10 728 C80 716 200 714 300 722 C340 726 370 724 400 720 C540 712 680 722 810 724 L810 844 L-420 844 Z" fill={`url(#wt${id})`} />
              <Ellipse cx={262} cy={760} rx={120} ry={14} fill={s.planet[0]} opacity={0.55} />
              <Rect x={278} y={736} width={20} height={16} rx={2} fill={s.window} opacity={0.4} />
              <Line x1={180} y1={748} x2={330} y2={748} stroke={s.glint} strokeWidth={1} strokeLinecap="round" />
              <Line x1={210} y1={772} x2={312} y2={772} stroke={s.glint} strokeOpacity={0.6} strokeWidth={1} strokeLinecap="round" />
              <Line x1={60} y1={790} x2={140} y2={790} stroke={s.glint} strokeOpacity={0.35} strokeWidth={1} strokeLinecap="round" />
              <Line x1={236} y1={800} x2={290} y2={800} stroke={s.glint} strokeOpacity={0.4} strokeWidth={1} strokeLinecap="round" />
            </Layer>
          </Plane>
        </>
      ) : (
        <Plane animate={animate} drift={drift} amp={a4}>
          <Layer w={W} h={H}>
            <Path d="M-420 814 C-200 810 -80 812 0 816 C100 806 220 806 390 812 C540 816 680 812 810 812 L810 844 L-420 844 Z" fill={s.water[0]} />
            <Line x1={210} y1={826} x2={330} y2={826} stroke={s.glint} strokeOpacity={0.5} strokeWidth={1} strokeLinecap="round" />
          </Layer>
        </Plane>
      )}
    </View>
    </FrameContext.Provider>
  );
}
