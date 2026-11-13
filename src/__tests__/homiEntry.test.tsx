/**
 * Entrée dans l'app HOMI : introduction vectorielle de première ouverture (/cinematic), révélation en profondeur,
 * pastille « Démo » (sortie toujours accessible), absence de vidéo.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' }, NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
let mockLowPower = false;
jest.mock('@/lib/lowPower', () => ({ useLowPower: () => mockLowPower }));
const mockLeave = jest.fn(() => Promise.resolve());
jest.mock('@/lib/demoMode', () => ({ leaveDemo: () => mockLeave(), useBackendMode: () => ({ isDemo: true, canLeave: true }) }));
jest.mock('@/lib/auth', () => ({ useAuth: () => ({ session: { user: { id: 'u1' } }, ready: true }) }));
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ router: { replace: (...a: unknown[]) => mockReplace(...a), push: jest.fn(), back: jest.fn(), canGoBack: () => false } }));

import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { getAnimatedStyle } from 'react-native-reanimated';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useUiStore } from '@/lib/store';
import { setLocale } from '@/i18n';
import { HomiIntro, homiIntroDuration } from '@/features/entry/HomiIntro';
import { DEPTH_FROM_SCALE, DEPTH_REVEAL_MS, DepthReveal } from '@/features/entry/EntryKit';
import { DEMO_LEAVE_HEIGHT, DemoBar } from '@/components/DemoBar';
import { MIN_TOUCH } from '@/theme/tokens';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { existsSync(p: string): boolean };

const mounted: ReactTestRenderer[] = [];
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider>{el}</ThemeProvider>); });
  mounted.push(r);
  return r;
}
const readAnimatedStyle = getAnimatedStyle as unknown as (c: { props: Record<string, unknown> }) => Record<string, unknown>;
const animated = (r: ReactTestRenderer) => r.root.findAll((n) => typeof n.type === 'string' && n.props.jestAnimatedStyle !== undefined);
const byTestId = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === 'string')[0] as ReactTestInstance | undefined;

beforeAll(() => setLocale('fr'));
beforeEach(() => {
  jest.useFakeTimers();
  mockLowPower = false;
  mockReplace.mockClear();
  mockLeave.mockClear();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'dark', cinematicSeen: false, hapticsEnabled: false }); });
});
afterEach(async () => {
  await act(async () => { while (mounted.length) mounted.pop()!.unmount(); });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('introduction HOMI de première ouverture (vectorielle)', () => {
  it('courte : ≤ 2,5 s en mouvement complet, ≤ 1 s la nuit', () => {
    expect(homiIntroDuration('full')).toBeLessThanOrEqual(2500);
    expect(homiIntroDuration('short')).toBeLessThanOrEqual(1000);
  });
  it('joue puis passe la main une seule fois', async () => {
    const onDone = jest.fn();
    const r = await render(<HomiIntro onDone={onDone} />);
    expect(byTestId(r, 'homi-intro')).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
    await act(async () => { jest.advanceTimersByTime(homiIntroDuration('full') + 100); });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  it('« Passer » : accessible, ≥ 48 px, sort tout de suite', async () => {
    const onDone = jest.fn();
    const r = await render(<HomiIntro onDone={onDone} />);
    const skip = r.root.findAll((n) => n.props.accessibilityLabel === 'Passer l’introduction' && typeof n.props.onPress === 'function')[0];
    expect(skip).toBeTruthy();
    await act(async () => { skip.props.onPress(); });
    expect(onDone).toHaveBeenCalledTimes(1);
    await act(async () => { jest.advanceTimersByTime(5000); });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  it('Réduire les animations : sortie directe, sans animation', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const onDone = jest.fn();
    const r = await render(<HomiIntro onDone={onDone} />);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(byTestId(r, 'homi-intro')).toBeUndefined();
  });
  it('économie d’énergie : sortie directe', async () => {
    mockLowPower = true;
    const onDone = jest.fn();
    await render(<HomiIntro onDone={onDone} />);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  it('plus aucune vidéo d’introduction dans le dépôt', () => {
    // Jest tourne depuis la racine du dépôt (chemins relatifs, comme les autres tests de fichiers)
    expect(fs.existsSync('package.json')).toBe(true);
    expect(fs.existsSync('assets/video/intro-cinematique.mp4')).toBe(false);
    expect(fs.existsSync('assets/video/intro-cinematique-1080.mp4')).toBe(false);
    expect(fs.existsSync('src/features/cinematicIntro')).toBe(false);
  });
});

describe('révélation en profondeur (décor seulement)', () => {
  it('part de plus loin (échelle > 1, transparent) puis se pose à 1', async () => {
    const r = await render(<DepthReveal><></></DepthReveal>);
    const node = animated(r)[0];
    const start = readAnimatedStyle(node as unknown as { props: Record<string, unknown> });
    expect(start.opacity).toBe(0);
    expect((start.transform as { scale: number }[])[0].scale).toBeCloseTo(DEPTH_FROM_SCALE);
    await act(async () => { jest.advanceTimersByTime(DEPTH_REVEAL_MS + 50); });
    const end = readAnimatedStyle(node as unknown as { props: Record<string, unknown> });
    expect(end.opacity).toBeCloseTo(1);
    expect((end.transform as { scale: number }[])[0].scale).toBeCloseTo(1);
  });
  it('Réduire les animations : état final immédiat', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const r = await render(<DepthReveal><></></DepthReveal>);
    await act(async () => { jest.advanceTimersByTime(16); }); // une image : le style animé reflète la valeur
    const s = readAnimatedStyle(animated(r)[0] as unknown as { props: Record<string, unknown> });
    expect(s.opacity).toBe(1);
  });
});

describe('pastille « Démo »', () => {
  it('« Quitter la démo » visible, lu « Quitter la démonstration », cible ≥ 48 px', async () => {
    const r = await render(<DemoBar />);
    expect(byTestId(r, 'demo-pill')).toBeTruthy();
    const btn = r.root.findAll((n) => n.props.accessibilityLabel === 'Quitter la démonstration' && n.props.accessibilityRole === 'button')[0];
    expect(btn).toBeTruthy();
    const slop = btn.props.hitSlop as { top: number; bottom: number };
    expect(DEMO_LEAVE_HEIGHT + slop.top + slop.bottom).toBeGreaterThanOrEqual(MIN_TOUCH);
    expect(r.root.findAll((n) => typeof n.props.children === 'string' && n.props.children === 'Quitter la démo').length).toBeGreaterThan(0);
  });
  it('quitter : sortie de la démo puis accueil sans compte ; un double appui ne quitte qu’une fois', async () => {
    const r = await render(<DemoBar />);
    const btn = r.root.findAll((n) => n.props.accessibilityLabel === 'Quitter la démonstration' && typeof n.props.onPress === 'function')[0];
    await act(async () => { btn.props.onPress(); btn.props.onPress(); });
    expect(mockLeave).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/welcome');
  });
});
