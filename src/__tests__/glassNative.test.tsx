/**
 * Niveau 1 du matériau : verre NATIF d'iOS 26 (`expo-glass-effect`). Ici le module de détection est remplacé par un
 * appareil qui l'a : on vérifie que `Glass` rend la vue native (style, teinte, apparence imposée) et que
 * « Réduire la transparence » et le mode nuit gardent la priorité (surface opaque).
 * Le rendu réel du verre ne se vérifie que sur un iPhone sous iOS 26 (voir HOMI_DESIGN_SYSTEM.md § 10).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('@/lib/lowPower', () => ({ useLowPower: () => false }));
jest.mock('@/components/surfaces/nativeGlass', () => {
  const actual = jest.requireActual('@/components/surfaces/nativeGlass');
  const { View } = require('react-native');
  const React = require('react');
  return { ...actual, NativeGlass: (p: Record<string, unknown>) => React.createElement(View, p), LIQUID_GLASS_NATIVE: true, BLUR_OK: true };
});

import React from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useUiStore } from '@/lib/store';
import { Glass, GlassTierProvider } from '@/components/glass';

let reduceTransparency = false;
const mounted: ReactTestRenderer[] = [];
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider>{el}</ThemeProvider>); });
  mounted.push(r);
  return r;
}
const host = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === 'string');

beforeEach(() => {
  reduceTransparency = false;
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockImplementation(() => Promise.resolve(reduceTransparency));
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'dark' }); });
});
afterEach(async () => {
  await act(async () => { while (mounted.length) mounted.pop()!.unmount(); });
  jest.restoreAllMocks();
});

it('iOS 26 : vue de verre native, apparence imposée par le thème de l’app, ni flou ni voile maison', async () => {
  const r = await render(<Glass testID="g" variant="card"><View /></Glass>);
  const n = host(r, 'g-native')[0];
  expect(n.props.glassEffectStyle).toBe('regular');
  expect(n.props.colorScheme).toBe('dark');
  expect(typeof n.props.tintColor).toBe('string');
  expect(host(r, 'g-blur').length).toBe(0);
  expect(host(r, 'g-veil').length).toBe(0);
  expect(host(r, 'g-opaque').length).toBe(0);
});

it('Réduire la transparence passe avant le verre natif : surface opaque', async () => {
  reduceTransparency = true;
  const r = await render(<Glass testID="g"><View /></Glass>);
  expect(host(r, 'g-opaque').length).toBe(1);
  expect(host(r, 'g-native').length).toBe(0);
});

it('mode nuit : opaque ; niveau « flou » imposé : flou au lieu du verre natif', async () => {
  const blur = await render(<GlassTierProvider value="blur"><Glass testID="g"><View /></Glass></GlassTierProvider>);
  expect(host(blur, 'g-blur').length).toBe(1);
  expect(host(blur, 'g-native').length).toBe(0);
  act(() => { useUiStore.setState({ nightMode: true }); });
  const night = await render(<Glass testID="g"><View /></Glass>);
  expect(host(night, 'g-opaque').length).toBe(1);
});
