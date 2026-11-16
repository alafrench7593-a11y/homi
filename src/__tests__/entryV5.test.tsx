/**
 * Entrée et onboarding v5 « Lumière corail » : illustration 3D de tête (HeroArt) sur le halo corail, illustration de la
 * situation choisie, réponses en liste (ChoiceRow) avec haptique, Réduire les animations.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
const mockSelection = jest.fn(() => Promise.resolve());
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: () => mockSelection(), notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' }, NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('@/lib/lowPower', () => ({ useLowPower: () => false }));

import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { getAnimatedStyle } from 'react-native-reanimated';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useUiStore } from '@/lib/store';
import { setLocale } from '@/i18n';
import { HERO_HALO_RATIO, HERO_REVEAL_MS, HeroArt, ILLUSTRATIONS, heroSize } from '@/features/entry/HeroArt';
import { artForAnswers, ChoiceRow, SITUATION_ART } from '@/features/onboarding/kit';
import { SITUATIONS } from '@/lib/onboarding/personalize';

const mounted: ReactTestRenderer[] = [];
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider>{el}</ThemeProvider>); });
  mounted.push(r);
  return r;
}
const readAnimatedStyle = getAnimatedStyle as unknown as (c: { props: Record<string, unknown> }) => Record<string, unknown>;
const animated = (r: ReactTestRenderer) => r.root.findAll((n) => typeof n.type === 'string' && n.props.jestAnimatedStyle !== undefined);

beforeAll(() => setLocale('fr'));
beforeEach(() => {
  jest.useFakeTimers();
  mockSelection.mockClear();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'light', hapticsEnabled: true }); });
});
afterEach(async () => {
  await act(async () => { while (mounted.length) mounted.pop()!.unmount(); });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('illustrations 3D', () => {
  it('chaque situation a son illustration ; sans réponse : la famille', () => {
    for (const s of SITUATIONS) expect(ILLUSTRATIONS[SITUATION_ART[s]]).toBeTruthy();
    expect(artForAnswers({ situations: [] })).toBe('famille');
    expect(artForAnswers({ situations: ['baby'] })).toBe('bebe');
    expect(artForAnswers({ situations: ['home', 'pregnant'] })).toBe('grossesse');
  });
  it('taille fixe bornée : jamais plus large que l’écran − 32 px, jamais sous le minimum', () => {
    expect(heroSize({ width: 390, height: 844 }, { max: 300, min: 132, reserve: 500 })).toBe(300);
    expect(heroSize({ width: 320, height: 568 }, { max: 300, min: 132, reserve: 420 })).toBe(148);
    expect(heroSize({ width: 320, height: 400 }, { max: 300, min: 132, reserve: 420 })).toBe(132);
    expect(heroSize({ width: 200, height: 900 }, { max: 300, min: 100, reserve: 100 })).toBe(168);
  });
});

describe('HeroArt (illustration sur le halo corail)', () => {
  it('décorative : masquée aux lecteurs d’écran, alt vide, couleurs non inversées, taille fixe', async () => {
    const r = await render(<HeroArt name="famille" size={200} />);
    const root = r.root.findAll((n) => n.props.testID === 'hero-art' && typeof n.type === 'string')[0];
    expect(root.props.accessibilityElementsHidden).toBe(true);
    expect(root.props.importantForAccessibility).toBe('no-hide-descendants');
    const img = r.root.findAll((n) => n.props.testID === 'hero-art-image')[0];
    expect(img.props.alt).toBe('');
    expect(img.props.accessibilityIgnoresInvertColors).toBe(true);
    expect(img.props.style).toMatchObject({ width: 200, height: 200 });
    // le halo est là, derrière, plus grand que l'illustration
    const halo = r.root.findAll((n) => n.props.testID === 'hero-art-halo' && typeof n.type === 'string')[0];
    expect(halo).toBeTruthy();
    expect(HERO_HALO_RATIO).toBeGreaterThan(1);
  });
  it('arrivée douce puis pleine lumière', async () => {
    const r = await render(<HeroArt name="bebe" size={160} />);
    const art = animated(r).find((n) => (readAnimatedStyle(n as unknown as { props: Record<string, unknown> }).transform as unknown[] | undefined)?.length === 2)!;
    expect(readAnimatedStyle(art as unknown as { props: Record<string, unknown> }).opacity).toBe(0);
    await act(async () => { jest.advanceTimersByTime(HERO_REVEAL_MS + 100); });
    expect(readAnimatedStyle(art as unknown as { props: Record<string, unknown> }).opacity).toBeCloseTo(1);
  });
  it('Réduire les animations : posée d’emblée, sans fondu enchaîné', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const r = await render(<HeroArt name="cycle" size={160} />);
    await act(async () => { jest.advanceTimersByTime(16); });
    const art = animated(r).find((n) => (readAnimatedStyle(n as unknown as { props: Record<string, unknown> }).transform as unknown[] | undefined)?.length === 2)!;
    expect(readAnimatedStyle(art as unknown as { props: Record<string, unknown> }).opacity).toBeCloseTo(1);
    const img = r.root.findAll((n) => n.props.testID === 'hero-art-image')[0];
    expect(img.props.transition).toBe(0);
  });
});

describe('réponse en liste (ChoiceRow)', () => {
  it('case accessible, état coché annoncé, haptique « sélection » au choix', async () => {
    const onPress = jest.fn();
    const r = await render(<ChoiceRow icon="sun" label="Un bébé" hint="Moins de 2 ans" selected={false} onPress={onPress} testID="row" />);
    const row = r.root.findAll((n) => n.props.testID === 'row' && typeof n.props.onPress === 'function' && n.props.accessibilityRole !== undefined)[0];
    expect(row.props.accessibilityRole).toBe('checkbox');
    expect(row.props.accessibilityState).toEqual({ checked: false });
    expect(row.props.accessibilityLabel).toBe('Un bébé. Moins de 2 ans');
    await act(async () => { row.props.onPress(); });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(mockSelection).toHaveBeenCalled();
  });
  it('rang affiché dans le témoin (besoins classés)', async () => {
    const r = await render(<ChoiceRow icon="moon" label="Les nuits" selected rank={2} onPress={() => undefined} a11yLabel="Les nuits. Choix 2" testID="row" />);
    const row = r.root.findAll((n) => n.props.testID === 'row' && typeof n.props.onPress === 'function' && n.props.accessibilityRole !== undefined)[0];
    expect(row.props.accessibilityLabel).toBe('Les nuits. Choix 2');
    expect(r.root.findAll((n) => n.props.children === 2).length).toBeGreaterThan(0);
  });
});
