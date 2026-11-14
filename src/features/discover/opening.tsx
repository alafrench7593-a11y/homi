/**
 * Ouverture de « Découvrir HOMI » : la MAISON HOMI (maison violette, deux parents, deux enfants) s'illumine, puis
 * s'ouvre en premier panneau de verre ; trois scènes (grossesse, suivi d'un enfant, vie du foyer) s'y déploient sous
 * un mouvement de caméra (gros plan sur chacune, puis recul sur les trois).
 *
 * POINT D'INJECTION DU LOGO ANIMÉ (agent « logo ») — `HomiLogoAnimated` se branche SANS modifier ce fichier, avec
 * son API publique stable (`width`, `tone`, `still`, `clock`, `timeline`, `deployTo`, `panel`, `onLensPanel` /
 * `onHousePanel`, `onDone`) :
 *
 *   import { HomiLogoAnimated } from '@/components/HomiLogoAnimated';
 *   import { setDiscoverOpening } from '@/features/discover/opening';
 *   setDiscoverOpening(HomiLogoAnimated);      // une fois (module du logo ou _layout)
 *   // ou ponctuellement : <DiscoverKeynote logo={HomiLogoAnimated} />
 *
 * Ce que la présentation lui passe : `width` (largeur du logo), `still` (Réduire les animations → état final),
 * `onHousePanel` et `onLensPanel` (même rappel : mesure FENÊTRE de la maison au moment où elle s'ouvre — la
 * présentation fait partir le panneau de verre de ce rectangle), `onDone`. La présentation ne passe PAS `deployTo` :
 * c'est elle qui fait grandir le panneau (il contient les scènes) ; le logo joue l'illumination de la maison, la
 * présentation enchaîne à `OPENING.handoffAt` (ou dès `onDone` / `onHousePanel` s'ils arrivent plus tôt).
 * Le logo reste décoratif (masqué aux lecteurs d'écran ; la présentation annonce `kn.open.a11y`).
 * Tant qu'aucun logo n'est injecté : ouverture PROVISOIRE avec la marque existante (`BrandLogo`, maison).
 */
import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandLogo } from '@/components/BrandLogo';
import { OpticalGlass } from '@/components/surfaces';
import { Icon, type IconName, Text } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { formatNumber, t as tr, type TKey } from '@/i18n';
import { useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, fonts, radius, spacing } from '@/theme/tokens';

/** Mesure de la maison (coordonnées fenêtre), forme de `LensMeasure` du logo animé. */
export type HouseMeasure = { x: number; y: number; width: number; height: number; cx?: number; cy?: number; r?: number };
/** Sous-ensemble de l'API publique de `HomiLogoAnimated` utilisé par la présentation. */
export interface DiscoverLogoProps {
  width: number;
  tone?: 'light' | 'dark';
  still?: boolean;
  onHousePanel?: (house: HouseMeasure, target: unknown) => void;
  /** Alias historique de `onHousePanel`. */
  onLensPanel?: (house: HouseMeasure, target: unknown) => void;
  onDone?: () => void;
  testID?: string;
}
export type DiscoverLogo = React.ComponentType<DiscoverLogoProps>;

// ------------------------------------------------------------------ registre (un seul logo pour l'application)
let injected: DiscoverLogo | null = null;
const listeners = new Set<() => void>();
/** Branche le logo animé définitif (`null` : revient à l'ouverture provisoire). */
export function setDiscoverOpening(C: DiscoverLogo | null) {
  injected = C;
  listeners.forEach((l) => l());
}
export const getDiscoverOpening = () => injected;
export function useDiscoverLogo(override?: DiscoverLogo | null): DiscoverLogo {
  const current = useSyncExternalStore((cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => injected, () => injected);
  return override ?? current ?? ProvisionalHomiLogo;
}

/** Chorégraphie de l'ouverture (ms, pure, testée). */
export const OPENING = { lightMs: 1100, handoffAt: 1350, handoffMs: 700, scenesAt: 2000, sceneMs: 760, total: 2000 + 760 * 3 + 300 } as const;

// ------------------------------------------------------------------ ouverture provisoire : la maison existante s'illumine
export function ProvisionalHomiLogo({ width, still, onDone, testID = 'discover-provisional-logo' }: DiscoverLogoProps) {
  const t = useTheme();
  const m = useMotion();
  const light = useSharedValue(still || m.off ? 1 : 0);
  const house = Math.round(width * 0.62);
  useEffect(() => {
    if (still || m.off) { light.value = 1; onDone?.(); return; }
    light.value = 0;
    light.value = m.timing(1, OPENING.lightMs, 'decelerate');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still, m.off]);
  // la maison s'illumine : halo qui grandit, maison qui se pose, nom qui suit
  const halo = useAnimatedStyle(() => ({ opacity: interpolate(light.value, [0, 0.5, 1], [0, 0.9, 0.55]), transform: [{ scale: 0.6 + 0.5 * light.value }] }));
  const mark = useAnimatedStyle(() => ({ opacity: interpolate(light.value, [0, 0.35], [0, 1], Extrapolation.CLAMP), transform: [{ scale: 0.92 + 0.08 * light.value }] }));
  const word = useAnimatedStyle(() => {
    const k = interpolate(light.value, [0.45, 1], [0, 1], Extrapolation.CLAMP);
    return { opacity: k, transform: [{ translateY: 8 * (1 - k) }] };
  });
  return (
    <View style={{ width, alignItems: 'center' }} testID={testID}>
      <View style={{ width: house, height: house, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: house * 1.5, height: house * 1.5, borderRadius: house }, halo]}>
          <LinearGradient colors={[alpha(t.tokens.accent.glow[0], 0.42), alpha(t.tokens.accent.glow[0], 0)]} start={{ x: 0.5, y: 0.5 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: house }]} />
        </Animated.View>
        <Animated.View style={mark}><BrandLogo size={house} /></Animated.View>
      </View>
      <Animated.View style={word}>
        <Text style={{ fontFamily: fonts.display, fontSize: Math.round(width * 0.24), lineHeight: Math.round(width * 0.28), letterSpacing: -1, color: t.colors.text }} maxFontSizeMultiplier={1}>{BRAND.name}</Text>
      </Animated.View>
    </View>
  );
}

// ------------------------------------------------------------------ scènes du panneau
const SCENES: { icon: IconName; title: TKey; value: (() => string); sub: TKey; tint: 'heart' | 'accent' | 'success' }[] = [
  { icon: 'heart', title: 'kn.open.preg.title', value: () => tr('kn.open.preg.value'), sub: 'kn.open.preg.sub', tint: 'heart' },
  { icon: 'droplet', title: 'kn.open.child.title', value: () => `${formatNumber(600)} ml`, sub: 'kn.open.child.sub', tint: 'accent' },
  { icon: 'send', title: 'kn.open.home.title', value: () => tr('kn.open.home.value'), sub: 'kn.open.home.sub', tint: 'success' },
];
const ROW_H = 74;
const ROW_GAP = 10;
const FOCUS_SCALE = 1.4;

function SceneRow({ i, scenes }: { i: number; scenes: SharedValue<number> }) {
  const t = useTheme();
  const s = SCENES[i];
  const color = s.tint === 'heart' ? t.colors.heart : s.tint === 'success' ? t.colors.success : t.tokens.accent.glow[0];
  const appear = useAnimatedStyle(() => {
    const k = interpolate(scenes.value, [i - 0.05, i + 0.35], [0, 1], Extrapolation.CLAMP);
    return { opacity: k, transform: [{ translateX: 18 * (1 - k) }] };
  });
  return (
    <Animated.View style={[{ height: ROW_H, borderRadius: radius.lg, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      backgroundColor: t.material.surfaces.matte.fill, borderWidth: 1, borderColor: t.material.surfaces.matte.edge }, appear]}>
      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(color, t.isDark ? 0.2 : 0.16) }}>
        <Icon name={s.icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="small" muted>{tr(s.title)}</Text>
        <Text weight="bold" style={{ fontSize: 18 }}>{s.value()}</Text>
        <Text variant="caption" muted>{tr(s.sub)}</Text>
      </View>
    </Animated.View>
  );
}

/** Scène d'ouverture complète. `token` : la rejouer (retour à l'étape 0). */
export function OpeningScene({ token, width, height, logo }: { token: number; width: number; height: number; logo?: DiscoverLogo | null }) {
  const t = useTheme();
  const m = useMotion();
  const Logo = useDiscoverLogo(logo);
  const handoff = useSharedValue(m.off ? 1 : 0);
  const scenes = useSharedValue(m.off ? 3 : 0);
  const started = useRef(false);
  // rectangle de la maison dans le repère de la scène (mise en page du logo ; mesure du logo si elle arrive)
  const [house, setHouse] = useState<{ cx: number; cy: number; size: number } | null>(null);
  const stageRef = useRef<View>(null);

  const W = width;
  const logoW = Math.round(Math.min(W * 0.46, 200));
  const panelW = Math.min(W - spacing.lg * 2, 380);
  const panelH = ROW_H * 3 + ROW_GAP * 2 + spacing.md * 2;
  // composition : logo au centre, puis la caméra le remonte (réduit) quand la maison s'ouvre en panneau
  const logoTop = height * 0.42 - logoW * 0.5;
  const logoFinalY = Math.max(spacing.xs, height * 0.02) - logoTop;
  const panelTop = Math.max(logoW * 0.55 + spacing.lg, height * 0.24);

  // la maison s'ouvre : à l'heure prévue, ou plus tôt si le logo l'annonce (onHousePanel / onDone)
  const open = useCallback(() => {
    if (started.current || m.off) return;
    started.current = true;
    handoff.value = m.timing(1, OPENING.handoffMs, 'decelerate');
    scenes.value = m.delay(OPENING.scenesAt - OPENING.handoffAt, m.timing(3, OPENING.sceneMs * 3, 'standard'));
  }, [m, handoff, scenes]);

  useEffect(() => {
    started.current = false;
    handoff.value = m.off ? 1 : 0;
    scenes.value = m.off ? 3 : 0;
    if (m.off) return;
    const id = setTimeout(open, OPENING.handoffAt);
    return () => clearTimeout(id);
  }, [token, m.off, open, handoff, scenes]);

  const onHousePanel = useCallback((h: HouseMeasure) => {
    // mesure fenêtre → repère de la scène
    const node = stageRef.current as unknown as { measureInWindow?: (cb: (x: number, y: number) => void) => void } | null;
    node?.measureInWindow?.((sx, sy) => {
      const size = Math.max(h.width, h.height);
      if (size > 0) setHouse({ cx: (h.cx ?? h.x + h.width / 2) - sx, cy: (h.cy ?? h.y + h.height / 2) - sy, size });
    });
    open();
  }, [open]);

  const logoStyle = useAnimatedStyle(() => ({ opacity: 1 - 0.15 * handoff.value, transform: [{ translateY: logoFinalY * handoff.value }, { scale: 1 - 0.45 * handoff.value }] }));
  const hx = house?.cx ?? W / 2;
  const hy = house?.cy ?? logoTop + logoW * 0.31;
  const startScale = (house?.size ?? logoW * 0.62) / panelW;
  const panel = useAnimatedStyle(() => {
    const k = handoff.value;
    return {
      opacity: interpolate(k, [0, 0.2], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateX: (hx - W / 2) * (1 - k) }, { translateY: (hy - (panelTop + panelH / 2)) * (1 - k) }, { scale: startScale + (1 - startScale) * k }],
    };
  });
  // reflet qui longe le bord haut du panneau pendant qu'il s'ouvre
  const edge = useAnimatedStyle(() => ({ opacity: interpolate(handoff.value, [0, 0.3, 1], [0, 1, 0.35]), transform: [{ translateX: interpolate(handoff.value, [0, 1], [-panelW * 0.4, panelW * 0.4]) }] }));
  // caméra dans le panneau : gros plan sur chaque scène, puis recul sur les trois
  const camera = useAnimatedStyle(() => {
    const s = scenes.value;
    const step = ROW_H + ROW_GAP;
    const focus = (i: number) => -(i - 1) * step * FOCUS_SCALE;
    const ty = interpolate(s, [0, 0.8, 1, 1.8, 2, 2.6, 3], [focus(0), focus(0), focus(1), focus(1), focus(2), focus(2), 0], Extrapolation.CLAMP);
    const sc = interpolate(s, [0, 2.6, 3], [FOCUS_SCALE, FOCUS_SCALE, 1], Extrapolation.CLAMP);
    return { transform: [{ translateY: ty }, { scale: sc }] };
  });
  const lead = useAnimatedStyle(() => ({ opacity: interpolate(scenes.value, [2.6, 3], [0, 1], Extrapolation.CLAMP) }));

  return (
    <View ref={stageRef} collapsable={false} style={{ height, width: '100%' }} accessible accessibilityLabel={tr('kn.open.a11y')} testID="discover-opening">
      <Animated.View style={[{ position: 'absolute', top: logoTop, left: 0, right: 0, alignItems: 'center' }, logoStyle]}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
          onLayout={(e) => { const l = e.nativeEvent.layout; setHouse((cur) => cur ?? { cx: l.x + l.width / 2, cy: logoTop + l.y + l.width * 0.31, size: l.width * 0.62 }); }}>
          <Logo width={logoW} still={m.off} tone={t.isDark ? 'dark' : 'light'} onHousePanel={onHousePanel} onLensPanel={onHousePanel} onDone={open} testID="discover-logo" />
        </View>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', top: panelTop, left: (W - panelW) / 2, width: panelW, height: panelH }, panel]}>
        <OpticalGlass radius={radius.xl} style={{ flex: 1 }} contentStyle={{ flex: 1, padding: spacing.md, justifyContent: 'center', overflow: 'hidden' }}>
          <Animated.View style={[{ gap: ROW_GAP }, camera]}>
            {SCENES.map((_, i) => <SceneRow key={i} i={i} scenes={scenes} />)}
          </Animated.View>
        </OpticalGlass>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: panelW * 0.2, width: panelW * 0.6, height: 2 }, edge]}>
          <LinearGradient colors={[alpha('#FFFFFF', 0), alpha('#FFFFFF', 0.9), alpha('#FFFFFF', 0)]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', top: panelTop + panelH + spacing.lg, left: spacing.lg, right: spacing.lg }, lead]}>
        <Text variant="heading" center>{tr('kn.open.lead')}</Text>
      </Animated.View>
    </View>
  );
}
