/**
 * Système de mouvement Reanimated (src/motion/**) et introduction de lancement HOMI.
 * Reanimated tourne ici dans son implémentation JS officielle (résolveur `react-native-reanimated/jest/resolver`
 * déclaré dans la config Jest de package.json) : les animations avancent avec les minuteurs simulés de Jest.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' }, NotificationFeedbackType: { Success: 'success' },
}));
let mockLowPower = false;
jest.mock('@/lib/lowPower', () => ({ useLowPower: () => mockLowPower }));

import React from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { getAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useUiStore } from '@/lib/store';
import { intro } from '@/theme/motion';
import { introTimeline, LaunchIntro, resetLaunchIntroForTests, shouldPlayLaunchIntro, stageProgress } from '@/components/LaunchIntro';
import {
  AnimatedNumber, Cascade, cascadeDelay, curves, dampingRatio, DetailEnter, formatCounter, MORPH_POINTS, MORPH_SHAPES, MorphIcon,
  morphPath, motionDuration, motionSpring, motionTiming, PressableScale, resolveMotionLevel, springs,
} from '@/motion';
import { HOMI_FAMILY, HOMI_HOUSE_LENGTH, HOMI_HOUSE_PATH, HOMI_MARK_SVG } from '@/brand/homiMarkSvg';
import { logoTimeline } from '@/brand/logoMotion';

const mounted: ReactTestRenderer[] = [];
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider>{el}</ThemeProvider>); });
  mounted.push(r);
  return r;
}
const animatedNodes = (r: ReactTestRenderer) => r.root.findAll((n) => typeof n.type === 'string' && n.props.jestAnimatedStyle !== undefined);
// Sous Jest, getAnimatedStyle est l'utilitaire natif (1 argument) ; les types publiés exposent la version web (0 argument)
const readAnimatedStyle = getAnimatedStyle as unknown as (c: { props: Record<string, unknown> }) => Record<string, unknown>;
const styleOf = (n: ReactTestInstance) => readAnimatedStyle(n as unknown as { props: Record<string, unknown> });
const byTestId = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === 'string')[0];

beforeEach(() => {
  jest.useFakeTimers();
  mockLowPower = false;
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'light', cinematicSeen: true, hapticsEnabled: true }); });
});
afterEach(async () => {
  await act(async () => { while (mounted.length) mounted.pop()!.unmount(); });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('niveau de mouvement (hook unique)', () => {
  it('Réduire les animations ou économie d’énergie → off ; nuit → minimal ; sinon full', () => {
    expect(resolveMotionLevel({ reduceMotion: true, lowPower: false, night: false })).toBe('off');
    expect(resolveMotionLevel({ reduceMotion: false, lowPower: true, night: false })).toBe('off');
    expect(resolveMotionLevel({ reduceMotion: true, lowPower: true, night: true })).toBe('off');
    expect(resolveMotionLevel({ reduceMotion: false, lowPower: false, night: true })).toBe('minimal');
    expect(resolveMotionLevel({ reduceMotion: false, lowPower: false, night: false })).toBe('full');
  });
  it('off : durée 0, valeur finale renvoyée telle quelle (aucune animation créée), fin signalée tout de suite', () => {
    expect(motionDuration('off', 520)).toBe(0);
    const cb = jest.fn();
    expect(motionTiming('off', 1, 520, 'decelerate', cb)).toBe(1);
    expect(cb).toHaveBeenCalledWith(true);
    const cb2 = jest.fn();
    expect(motionSpring('off', 0.97, 'vif', cb2)).toBe(0.97);
    expect(cb2).toHaveBeenCalledWith(true);
  });
  it('minimal (nuit) : durées plafonnées à 160 ms ; full : durée demandée et objet d’animation', () => {
    expect(motionDuration('minimal', 520)).toBeLessThanOrEqual(160);
    expect(motionDuration('full', 520)).toBe(520);
    expect(typeof motionTiming('full', 1, 300)).toBe('object');
    expect(typeof motionSpring('minimal', 1)).toBe('object');
  });
  it('ressorts nommés : doux et vif sans rebond perceptible, rebond léger modéré', () => {
    expect(dampingRatio(springs.doux)).toBeGreaterThanOrEqual(0.8);
    expect(dampingRatio(springs.vif)).toBeGreaterThanOrEqual(0.8);
    expect(dampingRatio(springs.rebondLeger)).toBeGreaterThan(0.5);
    expect(dampingRatio(springs.rebondLeger)).toBeLessThan(0.8);
  });
  it('courbes : bornes exactes et monotonie', () => {
    for (const c of Object.values(curves)) {
      expect(c(0)).toBe(0);
      expect(c(1)).toBe(1);
      let prev = 0;
      for (let i = 1; i <= 20; i++) { const v = c(i / 20); expect(v).toBeGreaterThanOrEqual(prev - 1e-6); prev = v; }
    }
    expect(curves.decelerate(0.3)).toBeGreaterThan(0.5); // décélération : vite au début
  });
});

describe('primitives', () => {
  it('cascade : délai 45 ms par rang, plafonné à 360 ms', () => {
    expect(cascadeDelay(0)).toBe(0);
    expect(cascadeDelay(3)).toBe(135);
    expect(cascadeDelay(40)).toBe(360);
  });
  it('cascade : en économie d’énergie, visible d’emblée (opacité 1, aucun déplacement)', async () => {
    mockLowPower = true;
    const r = await render(<Cascade index={5} testID="c"><React.Fragment /></Cascade>);
    const s = styleOf(byTestId(r, 'c'));
    expect(s.opacity).toBe(1);
    expect(s.transform).toEqual([{ translateY: 0 }]);
  });
  it('cascade : Réduire les animations activé → état final dès l’image suivante (pas de délai de cascade)', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const r = await render(<Cascade index={8} testID="c"><React.Fragment /></Cascade>);
    // une seule image (16 ms) : bien moins que le délai de cascade (360 ms) + la durée d'entrée (520 ms)
    await act(async () => { jest.advanceTimersByTime(16); });
    expect(styleOf(byTestId(r, 'c')).opacity).toBe(1);
  });
  it('cascade : mouvement complet → part de 0 puis atteint 1', async () => {
    const r = await render(<Cascade index={2} testID="c"><React.Fragment /></Cascade>);
    expect(styleOf(byTestId(r, 'c')).opacity).toBeLessThan(1);
    await act(async () => { jest.advanceTimersByTime(1500); });
    expect(styleOf(byTestId(r, 'c')).opacity).toBeCloseTo(1, 2);
  });
  it('écran détail : économie d’énergie → contenu à sa place immédiatement', async () => {
    mockLowPower = true;
    const r = await render(<DetailEnter testID="d"><React.Fragment /></DetailEnter>);
    const s = styleOf(byTestId(r, 'd'));
    expect(s.opacity).toBe(1);
    expect(s.transform).toEqual([]);
  });
  it('pression : action immédiate, haptique discrète sur téléphone seulement, échelle intacte en économie d’énergie', async () => {
    mockLowPower = true;
    const onPress = jest.fn();
    (Haptics.impactAsync as jest.Mock).mockClear();
    const r = await render(<PressableScale onPress={onPress} accessibilityLabel="Ouvrir"><React.Fragment /></PressableScale>);
    const p = r.root.findAll((n) => n.props.accessibilityLabel === 'Ouvrir' && typeof n.props.onPressIn === 'function')[0];
    act(() => { p.props.onPressIn({}); p.props.onPress({}); });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(Platform.OS === 'web' ? 0 : 1);
    const scaled = animatedNodes(r).map(styleOf).find((s) => Array.isArray(s.transform));
    expect(scaled?.transform).toEqual([{ scale: 1 }]);
  });
  it('compteur : mise en forme (séparateurs, décimales, signe) et valeur finale immédiate en économie d’énergie', async () => {
    const o = { decimals: 1, prefix: '', suffix: ' ml', decimalSep: ',', groupSep: ' ' };
    expect(formatCounter(12345.67, o)).toBe('12 345,7 ml');
    expect(formatCounter(-3.04, { ...o, suffix: '' })).toBe('−3,0');
    expect(formatCounter(-0.01, { ...o, suffix: '' })).toBe('0,0');
    mockLowPower = true;
    const r = await render(<AnimatedNumber value={42} testID="n" groupSep=" " />);
    expect(byTestId(r, 'n').props.accessibilityLabel).toBe('42');
  });
});

describe('icônes morphables', () => {
  it('six formes, même nombre de points, départ en haut au centre', () => {
    expect(MORPH_SHAPES).toEqual(['drop', 'moon', 'circle', 'belly', 'house', 'heart']);
    const n = MORPH_POINTS.drop.length;
    for (const s of MORPH_SHAPES) {
      expect(MORPH_POINTS[s]).toHaveLength(n);
      expect(MORPH_POINTS[s].every(Number.isFinite)).toBe(true);
    }
    expect(Math.abs(MORPH_POINTS.circle[0] - 50)).toBeLessThan(3);
  });
  it('interpolation : extrémités exactes, chemin fermé', () => {
    const a = morphPath(MORPH_POINTS.drop, MORPH_POINTS.heart, 0);
    expect(a).toBe(morphPath(MORPH_POINTS.drop, MORPH_POINTS.drop, 1));
    expect(morphPath(MORPH_POINTS.drop, MORPH_POINTS.heart, 1)).toBe(morphPath(MORPH_POINTS.heart, MORPH_POINTS.heart, 0));
    expect(a.startsWith('M')).toBe(true);
    expect(a.endsWith('Z')).toBe(true);
  });
  it('économie d’énergie : forme finale immédiate au changement de module', async () => {
    mockLowPower = true;
    let r!: ReactTestRenderer;
    const el = (shape: 'drop' | 'moon') => <ThemeProvider><MorphIcon shape={shape} color="#5B2A86" /></ThemeProvider>;
    await act(async () => { r = create(el('drop')); });
    mounted.push(r);
    await act(async () => { r.update(el('moon')); });
    await act(async () => { jest.advanceTimersByTime(16); });
    const path = r.root.findAll((n) => typeof n.props.jestAnimatedProps?.value?.d === 'string')[0];
    expect(path.props.jestAnimatedProps.value.d).toBe(morphPath(MORPH_POINTS.moon, MORPH_POINTS.moon, 1));
  });
});

describe('logo HOMI : pièces détachées', () => {
  it('maison et silhouettes exposées sont exactement celles du logo (clair et sombre)', () => {
    for (const tone of ['light', 'dark'] as const) {
      expect(HOMI_MARK_SVG[tone]).toContain(HOMI_HOUSE_PATH);
      for (const f of HOMI_FAMILY) {
        expect(HOMI_MARK_SVG[tone]).toContain(f.bodyD);
        expect(HOMI_MARK_SVG[tone]).toContain(`<circle cx="${f.cx}" cy="${f.headY}" r="${f.headR}"/>`);
      }
    }
    expect(HOMI_FAMILY.map((f) => f.role)).toEqual(['parent', 'parent', 'child', 'child']);
    expect(HOMI_HOUSE_LENGTH).toBeGreaterThan(600);
    expect(HOMI_HOUSE_LENGTH).toBeLessThan(720);
  });
});

describe('introduction de lancement', () => {
  it('chorégraphie : tracé → illumination → parents → enfants → nom → pose → fondu (1,5–2,5 s)', () => {
    const tl = introTimeline('full');
    expect(tl.total).toBeGreaterThanOrEqual(1500);
    expect(tl.total).toBeLessThanOrEqual(2500);
    expect(tl.logo).toEqual(logoTimeline('full'));
    expect(tl.logo.light[0]).toBeGreaterThan(tl.logo.trace[0]);
    expect(tl.logo.figures[0][0]).toBeGreaterThan(tl.logo.light[0]);
    for (let i = 1; i < tl.logo.figures.length; i++) expect(tl.logo.figures[i][0]).toBeGreaterThan(tl.logo.figures[i - 1][0]);
    expect(tl.logo.deploy).toBeNull();
    expect(tl.exit[0]).toBeGreaterThanOrEqual(tl.logo.end);
  });
  it('version abrégée (nuit, lancement lent) : logo complet d’emblée, ≤ 600 ms', () => {
    const tl = introTimeline('short');
    expect(stageProgress(0, tl.logo.trace)).toBe(1);
    expect(tl.logo.figures.every((st) => stageProgress(0, st) === 1)).toBe(true);
    expect(stageProgress(0, tl.logo.name)).toBe(1);
    expect(tl.total).toBeLessThanOrEqual(intro.shortHoldMs + intro.shortExitMs);
  });
  it('économie d’énergie : jamais d’introduction', () => {
    expect(shouldPlayLaunchIntro({ alreadyPlayed: false, reduceMotion: false, cinematicSeen: true, lowPower: true })).toBe(false);
  });
  it('joue une seule fois par lancement : visible, puis retirée à la fin ; un second montage ne rejoue rien', async () => {
    resetLaunchIntroForTests();
    const r = await render(<LaunchIntro />);
    expect(byTestId(r, 'launch-intro')).toBeTruthy();
    await act(async () => { jest.advanceTimersByTime(introTimeline('full').total + 200); });
    expect(byTestId(r, 'launch-intro')).toBeUndefined();
    const again = await render(<LaunchIntro />);
    expect(byTestId(again, 'launch-intro')).toBeUndefined();
  });
  it('Réduire les animations : calque retiré immédiatement (durée 0), sans attendre de minuteur', async () => {
    resetLaunchIntroForTests();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const r = await render(<LaunchIntro />);
    expect(byTestId(r, 'launch-intro')).toBeUndefined();
  });
  it('économie d’énergie : calque retiré immédiatement', async () => {
    resetLaunchIntroForTests();
    mockLowPower = true;
    const r = await render(<LaunchIntro />);
    expect(byTestId(r, 'launch-intro')).toBeUndefined();
  });
});
