/**
 * Audit 10 (performance) : les animations décoratives en boucle s'arrêtent quand l'écran n'est pas affiché
 * (onglet resté monté en arrière-plan), et la dérive du fond passe par une animation CSS sur le web.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useIsFocused: () => true, usePathname: () => '/' }));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import React from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ScreenFocusContext, useScreenFocused } from '@/components/screenChrome';
import { FamilyStoryArt } from '@/features/story/FamilyStoryArt';
import { FetusArt } from '@/components/FetusArt';
import { SCENE, webDriftStyle } from '@/components/scene/DesertScene';
import { WOMAN_ALONE } from '@/lib/domain/familyStory';
import { STORY_ROTATE_MS, useRotatingChapter } from '@/features/story/StoryHomeStrip';

const flush = async (ms = 50) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };
const has = (r: ReactTestRenderer, re: RegExp) => r.root.findAll((n) => typeof n.props.testID === 'string' && re.test(n.props.testID)).length > 0;

beforeEach(() => { jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false); });
afterEach(() => jest.restoreAllMocks());

it('hors d’un écran, le composant est considéré comme affiché', async () => {
  let seen: boolean | undefined;
  const Probe = () => { seen = useScreenFocused(); return null; };
  await act(async () => { create(<Probe />); });
  expect(seen).toBe(true);
});

it('« Au fil de nous » : mini-vidéo quand l’écran est affiché, image fixe quand il ne l’est pas', async () => {
  const art = (focused: boolean) => (
    <ThemeProvider><ScreenFocusContext.Provider value={focused}><FamilyStoryArt scene={WOMAN_ALONE} label="x" testID="art" /></ScreenFocusContext.Provider></ThemeProvider>
  );
  let r!: ReactTestRenderer;
  await act(async () => { r = create(art(true)); });
  await flush();
  expect(has(r, /^story-anim-/)).toBe(true);
  await act(async () => { r.update(art(false)); });
  await flush();
  expect(has(r, /^story-anim-/)).toBe(false);
  expect(has(r, /^story-img-/)).toBe(true);
  r.unmount();
});

it('bébé à naître : aucune boucle (flottement, battement, liseré) quand l’écran n’est pas affiché', async () => {
  const loop = jest.spyOn(Animated, 'loop');
  const fetus = (focused: boolean) => (
    <ThemeProvider><ScreenFocusContext.Provider value={focused}><FetusArt week={24} growth={0.5} size={120} /></ScreenFocusContext.Provider></ThemeProvider>
  );
  let r!: ReactTestRenderer;
  await act(async () => { r = create(fetus(false)); });
  await flush();
  expect(loop).not.toHaveBeenCalled();
  await act(async () => { r.update(fetus(true)); });
  await flush();
  expect(loop.mock.calls.length).toBeGreaterThanOrEqual(4);
  r.unmount();
});

it('fond (web) : dérive CSS aller-retour, mêmes amplitude et période que Reanimated, style partagé', () => {
  const s = webDriftStyle(12, 0) as unknown as Record<string, unknown>;
  expect(webDriftStyle(12, 0)).toBe(s);
  expect(s.animationDuration).toBe(`${SCENE.driftMs / 2}ms`);
  expect(s.animationDirection).toBe('alternate');
  expect(s.animationIterationCount).toBe('infinite');
  expect(JSON.stringify(s.animationKeyframes)).toContain('translate3d(12px,0px,0px)');
  expect(JSON.stringify(webDriftStyle(3, 3))).toContain('translate3d(3px,-3px,0px)');
});

it('accueil en arrière-plan : la rotation des mini-vidéos se met en pause et garde l’étape affichée', () => {
  jest.useFakeTimers();
  try {
    const out: { v?: [number, number, number] } = {};
    const Probe = ({ paused }: { paused: boolean }) => { out.v = useRotatingChapter(2, false, paused); return null; };
    let r!: ReactTestRenderer;
    act(() => { r = create(<Probe paused={false} />); });
    act(() => { jest.advanceTimersByTime(STORY_ROTATE_MS + 1300); });
    const shown = out.v![0];
    expect(shown).not.toBe(2);
    act(() => { r.update(<Probe paused />); });
    act(() => { jest.advanceTimersByTime(STORY_ROTATE_MS * 4); });
    expect(out.v).toEqual([shown, expect.any(Number), 0]);
    act(() => { r.update(<Probe paused={false} />); });
    act(() => { jest.advanceTimersByTime(STORY_ROTATE_MS + 1300); });
    expect(out.v![0]).not.toBe(shown);
    r.unmount();
  } finally {
    jest.useRealTimers();
  }
});
