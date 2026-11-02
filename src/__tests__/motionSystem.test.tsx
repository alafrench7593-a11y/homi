/**
 * Système de mouvement (motion design) : jetons centralisés, « réduire les animations », introduction d'ouverture,
 * bouton (action immédiate même pendant l'animation, retours de réussite / d'échec), listes (arrivée d'un nouvel
 * élément), pastille de notification, retour haptique jamais sur le web.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(), notificationAsync: jest.fn(), selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' }, NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));

import React from 'react';
import { Animated, Platform, StyleSheet, Text as RNText } from 'react-native';
import * as Haptics from 'expo-haptics';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { Button, haptic } from '@/components/ui';
import { BadgeDot, StaggerItem, StepProgress } from '@/components/Motion';
import { LaunchIntro, resetLaunchIntroForTests, shouldPlayLaunchIntro } from '@/components/LaunchIntro';
import { duration, feedback, hapticsSupported, intro, introTotalMs, shakeX, spring, successPulse } from '@/theme/motion';
import { useUiStore } from '@/lib/store';

const value = (v: Animated.Value) => (v as unknown as { __getValue: () => number }).__getValue();
const mounted: ReactTestRenderer[] = [];
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider>{el}</ThemeProvider>); });
  mounted.push(r);
  return r;
}
afterEach(async () => { await act(async () => { while (mounted.length) mounted.pop()!.unmount(); }); });
const pressable = (r: ReactTestRenderer, label: string) => r.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];

describe('jetons centralisés (src/theme/motion.ts)', () => {
  it('durées courtes : micro-interactions et états entre 90 et 400 ms, entrées ≤ 520 ms', () => {
    for (const ms of [duration.instant, duration.fast, duration.base, duration.slow, duration.screen]) {
      expect(ms).toBeGreaterThanOrEqual(90);
      expect(ms).toBeLessThanOrEqual(400);
    }
    expect(duration.entrance).toBeLessThanOrEqual(520);
  });
  it('introduction d’ouverture entre 1,5 et 2,5 s, sans rebond ni rotation (échelle très proche de 1)', () => {
    expect(introTotalMs).toBeGreaterThanOrEqual(1500);
    expect(introTotalMs).toBeLessThanOrEqual(2500);
    expect(intro.logoFromScale).toBeGreaterThanOrEqual(0.9);
    expect(intro.logoExitScale).toBeLessThanOrEqual(1.1);
  });
  it('tremblement d’erreur court (< 400 ms) et respiration de réussite discrète', () => {
    expect(feedback.shake.length * feedback.shakeStepMs).toBeLessThan(400);
    expect(feedback.shake[feedback.shake.length - 1]).toBe(0);
    expect(feedback.successScale).toBeLessThanOrEqual(1.05);
    expect(spring.release.friction).toBeGreaterThan(0);
  });
});

describe('réduire les animations', () => {
  it('tremblement et respiration : état final immédiat, fin signalée', () => {
    const x = new Animated.Value(5);
    const cb = jest.fn();
    shakeX(x, true).start(cb);
    expect(value(x)).toBe(0);
    expect(cb).toHaveBeenCalledWith({ finished: true });
    const s = new Animated.Value(1.2);
    const cb2 = jest.fn();
    successPulse(s, true).start(cb2);
    expect(value(s)).toBe(1);
    expect(cb2).toHaveBeenCalledWith({ finished: true });
  });
  it('introduction d’ouverture : jamais avec « réduire les animations », ni deux fois, ni avant l’introduction cinématique', () => {
    expect(shouldPlayLaunchIntro({ alreadyPlayed: false, reduceMotion: false, cinematicSeen: true })).toBe(true);
    expect(shouldPlayLaunchIntro({ alreadyPlayed: false, reduceMotion: true, cinematicSeen: true })).toBe(false);
    expect(shouldPlayLaunchIntro({ alreadyPlayed: true, reduceMotion: false, cinematicSeen: true })).toBe(false);
    expect(shouldPlayLaunchIntro({ alreadyPlayed: false, reduceMotion: false, cinematicSeen: false })).toBe(false);
  });
});

describe('introduction d’ouverture', () => {
  it('ne capte aucun toucher, est masquée aux lecteurs d’écran et ne joue qu’une fois par lancement', async () => {
    resetLaunchIntroForTests();
    act(() => { useUiStore.setState({ cinematicSeen: true }); });
    const r = await render(<LaunchIntro />);
    const layer = r.root.findAll((n) => n.props.testID === 'launch-intro')[0];
    expect(layer).toBeTruthy();
    expect(layer.props.pointerEvents).toBe('none');
    expect(layer.props.importantForAccessibility).toBe('no-hide-descendants');
    // Un second montage (changement d'écran, retour d'arrière-plan) ne rejoue pas l'introduction
    const again = await render(<LaunchIntro />);
    expect(again.root.findAll((n) => n.props.testID === 'launch-intro')).toHaveLength(0);
  });
});

describe('bouton', () => {
  it('l’action part tout de suite, même pendant l’animation de pression', async () => {
    const onPress = jest.fn();
    const r = await render(<Button label="Publier" onPress={onPress} />);
    const p = pressable(r, 'Publier');
    // appui en cours (animation lancée) puis relâchement immédiat : l'action n'attend pas la fin de l'animation
    act(() => { p.props.onPressIn?.({}); p.props.onPress({}); });
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  it('désactivé : aucune action ; échec d’une action : le bouton redevient utilisable', async () => {
    const off = jest.fn();
    const r1 = await render(<Button label="Envoyer" disabled onPress={off} />);
    expect(pressable(r1, 'Envoyer').props.disabled).toBe(true);
    const fail = jest.fn(() => Promise.reject(new Error('réseau')));
    const r2 = await render(<Button label="Réessayer plus tard" onPress={fail} />);
    await act(async () => { pressable(r2, 'Réessayer plus tard').props.onPress({}); });
    expect(fail).toHaveBeenCalledTimes(1);
    expect(pressable(r2, 'Réessayer plus tard').props.accessibilityState).toMatchObject({ busy: false, disabled: false });
  });
  it('désactivé : opacité atténuée du système (fondu animé, même valeur qu’avant)', async () => {
    const r = await render(<Button label="Valider" disabled />);
    const hosts = r.root.findAll((n) => (n.type as unknown) === 'View' && StyleSheet.flatten(n.props.style)?.opacity === feedback.disabledOpacity);
    expect(hosts.length).toBeGreaterThan(0);
  });
});

describe('listes, progression et pastilles', () => {
  const opacityOf = (r: ReactTestRenderer) => {
    const v = r.root.findAll((n) => (n.type as unknown) === 'View' && StyleSheet.flatten(n.props.style)?.opacity !== undefined)[0];
    return StyleSheet.flatten(v.props.style).opacity as number;
  };
  it('un élément arrivé après l’affichage entre en fondu même loin dans la liste ; les autres arrivent déjà visibles', async () => {
    const fresh = await render(<StaggerItem index={40} fresh><RNText>Nouveau commentaire</RNText></StaggerItem>);
    expect(opacityOf(fresh)).toBe(0);
    const old = await render(<StaggerItem index={40}><RNText>Ancien</RNText></StaggerItem>);
    expect(opacityOf(old)).toBe(1);
  });
  it('progression par étapes : annonce l’étape courante', async () => {
    const r = await render(<StepProgress count={5} index={1} color="#87533F" track="#EED5CF" accessibilityLabel="Étape 2 sur 5" />);
    const bar = r.root.findAll((n) => n.props.accessibilityRole === 'progressbar')[0];
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 5, now: 2 });
  });
  it('pastille de notification : invisible sans notification, présente sinon', async () => {
    const none = await render(<BadgeDot count={0} style={{ width: 9, height: 9 }} />);
    expect(none.root.findAll((n) => n.props.pointerEvents === 'none').length).toBeGreaterThan(0);
    const some = await render(<BadgeDot count={3} style={{ width: 9, height: 9 }} />);
    expect(opacityOf(some)).toBe(1);
  });
});

describe('retour haptique', () => {
  it('jamais sur le web ; sur téléphone, seulement si le réglage est actif', () => {
    expect(hapticsSupported).toBe(Platform.OS !== 'web');
    (Haptics.impactAsync as jest.Mock).mockClear();
    act(() => { useUiStore.setState({ hapticsEnabled: false }); });
    haptic('light');
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    act(() => { useUiStore.setState({ hapticsEnabled: true, nightMode: false }); });
    haptic('light');
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(Platform.OS === 'web' ? 0 : 1);
  });
});
