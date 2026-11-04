/** Accueil « Au fil de nous » : les mini-vidéos défilent (début = étape du profil, jamais deux fois la même d'affilée). */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import React from 'react';
import { act, create } from 'react-test-renderer';
import { STORY_ROTATE_MS, useRotatingChapter } from '@/features/story/StoryHomeStrip';

function Probe({ start, still, out }: { start: number | null; still: boolean; out: { v?: [number, number, number] } }) {
  out.v = useRotatingChapter(start, still);
  return null;
}

describe('défilement des mini-vidéos sur l’accueil', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('commence par l’étape du profil puis passe à d’autres étapes, sans répétition immédiate', () => {
    const out: { v?: [number, number, number] } = {};
    act(() => { create(<Probe start={3} still={false} out={out} />); });
    expect(out.v![0]).toBe(3);
    const seen: number[] = [3];
    for (let i = 0; i < 8; i++) {
      act(() => { jest.advanceTimersByTime(STORY_ROTATE_MS + 1300); });
      const cur = out.v![0];
      expect(cur).not.toBe(seen[seen.length - 1]);
      seen.push(cur);
    }
    expect(new Set(seen).size).toBeGreaterThan(3);
  });

  it('animations réduites : reste sur l’étape du profil ; pas d’étape (fratrie) : rien', () => {
    const out: { v?: [number, number, number] } = {};
    act(() => { create(<Probe start={5} still out={out} />); });
    act(() => { jest.advanceTimersByTime(STORY_ROTATE_MS * 3); });
    expect(out.v).toEqual([5, 5, 0]);
    act(() => { create(<Probe start={null} still={false} out={out} />); });
    expect(out.v).toBeUndefined();
  });
});
