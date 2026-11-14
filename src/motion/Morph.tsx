/**
 * Primitive « morph » carte → détail (HOMI v3, MOTION_SYSTEM.md § Morph) : la SURFACE D'ORIGINE s'agrandit jusqu'à
 * remplir l'écran pendant que l'écran détail s'ouvre dessous ; au retour, elle se rétracte vers LE MÊME élément.
 * Sans transitions partagées expérimentales : un « fantôme » de surface est animé par un hôte unique posé au-dessus
 * de la navigation (`<MorphHost />`, src/app/_layout.tsx).
 *
 *   // écran source (carte, tuile)
 *   <MorphSource id={`mission-${m.id}`} onOpen={() => router.push(`/family/missions/${m.id}`)} accessibilityLabel={…}>
 *     …contenu de la carte…
 *   </MorphSource>
 *   // ou, pour une surface existante : const src = useMorphSource(id); <View ref={src.ref} collapsable={false}>…
 *   //                                   onPress={() => src.open(() => router.push(…))}
 *   // écran détail
 *   <MorphTarget id={`mission-${id}`}>…contenu…</MorphTarget>
 *
 * Chorégraphie (niveau `full`) : ouverture 400 ms `decelerate` (famille « scène »), la navigation part dès la
 * première image (rien n'attend l'animation), le fantôme s'efface en 160 ms et révèle le détail ; retour 340 ms
 * vers le rectangle RE-MESURÉ de la source (si elle a bougé, le fantôme la suit). Interruptible : une nouvelle
 * ouverture repart de la géométrie courante. `off` (Réduire les animations, économie d'énergie) : navigation
 * immédiate, aucun fantôme ; `minimal` (nuit) : fondu court du contenu seulement.
 * Seuls transform / opacité / position du fantôme (une seule vue absolue) sont animés, sur le fil UI.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, radius as R } from '@/theme/tokens';
import { curves } from './curves';
import { motionHaptic } from './haptics';
import { useMotion } from './useMotion';

export const MORPH = { openMs: 400, revealMs: 160, closeMs: 340, fadeInMs: 100 } as const;

type Rect = { x: number; y: number; w: number; h: number };
type Source = { measure: (cb: (r: Rect) => void) => void; radius: number; tint?: string; sheen?: boolean };
type Host = { expand: (id: string, rect: Rect, radius: number, tint?: string, sheen?: boolean) => void; collapse: (id: string, rect: Rect, radius: number, tint?: string, sheen?: boolean) => void };

/** Registre des sources montées et de l'hôte (module : un seul hôte par application). */
const sources = new Map<string, Source>();
let host: Host | null = null;
/** Dernière ouverture : le retour ne joue que pour l'élément réellement ouvert (testé). */
let lastOpened: string | null = null;

/** État pur du registre (tests). */
export const morphRegistry = {
  has: (id: string) => sources.has(id),
  lastOpened: () => lastOpened,
  reset: () => { sources.clear(); lastOpened = null; },
};

function measureRef(ref: React.RefObject<View | null>, cb: (r: Rect) => void) {
  const node = ref.current as unknown as { measureInWindow?: (f: (x: number, y: number, w: number, h: number) => void) => void } | null;
  if (!node?.measureInWindow) { cb({ x: 0, y: 0, w: 0, h: 0 }); return; }
  node.measureInWindow((x, y, w, h) => cb({ x, y, w, h }));
}

/** Source de morph : `ref` à poser sur la surface, `open(navigate)` à appeler à l'appui. */
export function useMorphSource(id: string, opts: { radius?: number; tint?: string; sheen?: boolean } = {}) {
  const ref = useRef<View>(null);
  const m = useMotion();
  const radius = opts.radius ?? R.lg;
  useEffect(() => {
    sources.set(id, { measure: (cb) => measureRef(ref, cb), radius, tint: opts.tint, sheen: opts.sheen });
    return () => { if (sources.get(id)?.measure) sources.delete(id); };
  }, [id, radius, opts.tint, opts.sheen]);
  const open = (navigate: () => void) => {
    lastOpened = id;
    if (m.level !== 'full' || !host) { navigate(); return; }
    measureRef(ref, (r) => {
      if (r.w > 0 && r.h > 0) host?.expand(id, r, radius, opts.tint, opts.sheen);
      navigate();
    });
  };
  return { ref, open };
}

type SourceProps = Omit<PressableProps, 'style' | 'children' | 'onPress'> & {
  id: string;
  onOpen: () => void;
  children: React.ReactNode;
  radius?: number;
  tint?: string;
  /** Reflet qui suit le bord haut de la surface pendant qu'elle s'agrandit (et au retour). */
  sheen?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Surface appuyable qui s'agrandit vers l'écran détail. */
export function MorphSource({ id, onOpen, children, radius, tint, sheen, style, ...rest }: SourceProps) {
  const src = useMorphSource(id, { radius, tint, sheen });
  return (
    <Pressable accessibilityRole="button" {...rest} onPress={() => { motionHaptic('light'); src.open(onOpen); }}>
      <View ref={src.ref} collapsable={false} style={style}>{children}</View>
    </Pressable>
  );
}

/** Écran détail : le contenu apparaît sous le fantôme ; au démontage (retour), la surface revient vers sa source. */
export function MorphTarget({ id, children, style, testID }: { id: string; children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const m = useMotion();
  const p = useSharedValue(m.off ? 1 : 0);
  useEffect(() => {
    p.value = m.level === 'full' ? withDelay(MORPH.openMs * 0.55, withTiming(1, { duration: MORPH.revealMs * 1.5, easing: curves.decelerate })) : m.timing(1, 160, 'standard');
    return () => {
      cancelAnimation(p);
      const src = sources.get(id);
      if (!src || !host || lastOpened !== id) return;
      lastOpened = null;
      src.measure((r) => { if (r.w > 0 && r.h > 0) host?.collapse(id, r, src.radius, src.tint, src.sheen); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const animated = useAnimatedStyle(() => ({ opacity: p.value }));
  return <Animated.View testID={testID} style={[{ flex: 1 }, style, animated]}>{children}</Animated.View>;
}

/** Hôte unique du fantôme de surface (au-dessus de la navigation, sans capter les touchers). */
export function MorphHost() {
  const t = useTheme();
  const m = useMotion();
  const { width: W, height: H } = useWindowDimensions();
  const rootRef = useRef<View>(null);
  const [tint, setTint] = useState<string | undefined>(undefined);
  const [sheen, setSheen] = useState(false);
  const [visible, setVisible] = useState(false);
  const p = useSharedValue(0);
  const op = useSharedValue(0);
  const from = useSharedValue<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  const rad = useSharedValue<number>(R.lg);
  const size = useSharedValue({ w: W, h: H });
  useEffect(() => { size.value = { w: W, h: H }; }, [W, H, size]);

  useEffect(() => {
    if (m.level !== 'full') { host = null; return; }
    const hide = () => setVisible(false);
    // décalage de l'hôte dans la fenêtre (web : cadre téléphone centré)
    const offset = (r: Rect, cb: (r: Rect) => void) => measureRef(rootRef, (o) => cb({ x: r.x - o.x, y: r.y - o.y, w: r.w, h: r.h }));
    host = {
      expand: (_id, r, radius, tnt, shn) => offset(r, (rr) => {
        setTint(tnt); setSheen(!!shn); setVisible(true);
        cancelAnimation(p); cancelAnimation(op);
        from.value = rr; rad.value = radius;
        p.value = 0; op.value = 1;
        p.value = withTiming(1, { duration: MORPH.openMs, easing: curves.decelerate });
        op.value = withDelay(MORPH.openMs, withTiming(0, { duration: MORPH.revealMs, easing: curves.standard }, (f) => { 'worklet'; if (f) scheduleOnRN(hide); }));
      }),
      collapse: (_id, r, radius, tnt, shn) => offset(r, (rr) => {
        setTint(tnt); setSheen(!!shn); setVisible(true);
        cancelAnimation(p); cancelAnimation(op);
        from.value = rr; rad.value = radius;
        p.value = 1; op.value = 0;
        p.value = withTiming(0, { duration: MORPH.closeMs, easing: curves.decelerate });
        op.value = withSequence(
          withTiming(0.92, { duration: MORPH.fadeInMs, easing: curves.standard }),
          withDelay(MORPH.closeMs - MORPH.fadeInMs - 40, withTiming(0, { duration: MORPH.revealMs, easing: curves.standard }, (f) => { 'worklet'; if (f) scheduleOnRN(hide); })),
        );
      }),
    };
    return () => { host = null; };
  }, [m.level, p, op, from, rad]);

  const ghost = useAnimatedStyle(() => {
    const k = p.value;
    const r = from.value;
    return {
      opacity: op.value,
      left: r.x * (1 - k),
      top: r.y * (1 - k),
      width: r.w + (size.value.w - r.w) * k,
      height: r.h + (size.value.h - r.h) * k,
      borderRadius: rad.value * (1 - k) + 28 * k,
    };
  });
  // reflet : une bande claire qui longe le bord haut, du coin de départ vers l'autre bord, au rythme de la surface
  const edge = useAnimatedStyle(() => {
    const k = p.value;
    const w = from.value.w + (size.value.w - from.value.w) * k;
    return { width: w * 0.42, opacity: Math.sin(Math.PI * Math.min(1, Math.max(0, k))) * 0.95, transform: [{ translateX: w * (-0.42 + 1.42 * k) }] };
  });
  const s = t.material.surfaces.matte;
  const light = tint ?? t.tokens.accent.glow[0];
  return (
    <View ref={rootRef} pointerEvents="none" collapsable={false} style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {visible ? (
        <Animated.View testID="morph-ghost" style={[{ position: 'absolute', overflow: 'hidden', backgroundColor: s.fill, borderWidth: 1, borderColor: s.edge }, ghost]}>
          <LinearGradient colors={[alpha(light, t.isDark ? 0.16 : 0.14), alpha(light, 0)]} start={t.material.light.start} end={t.material.light.end} style={StyleSheet.absoluteFill} />
          {sheen ? (
            <Animated.View testID="morph-sheen" style={[{ position: 'absolute', top: 0, left: 0, height: 2 }, edge]}>
              <LinearGradient colors={[alpha('#FFFFFF', 0), alpha('#FFFFFF', t.isDark ? 0.7 : 0.95), alpha('#FFFFFF', 0)]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}
