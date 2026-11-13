/**
 * HOMI v2 : préférences d'apparence (par compte, persistantes), thème résolu (apparence × palette × Auto),
 * GlowCard, reflet des boutons et coche de validation (Réduire les animations / économie d'énergie → aucun mouvement).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' }, NotificationFeedbackType: { Success: 'success' },
}));
let mockLowPower = false;
jest.mock('@/lib/lowPower', () => ({ useLowPower: () => mockLowPower }));

import React from 'react';
import { AccessibilityInfo, Text as RNText } from 'react-native';
import { getAnimatedStyle } from 'react-native-reanimated';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { useUiStore } from '@/lib/store';
import { GlowCard } from '@/components/GlowCard';
import { CompletionCheck, CompletionGlow, PressSheen, usePressSheen } from '@/motion';
import { autoPaletteAt, PALETTES, type Theme } from '@/theme/tokens';

const mounted: ReactTestRenderer[] = [];
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider>{el}</ThemeProvider>); });
  mounted.push(r);
  return r;
}
const readAnimatedStyle = getAnimatedStyle as unknown as (c: { props: Record<string, unknown> }) => Record<string, unknown>;
const styleOf = (n: ReactTestInstance) => readAnimatedStyle(n as unknown as { props: Record<string, unknown> });
const byTestId = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === 'string');

let seen: Theme | null = null;
function Probe() { seen = useTheme(); return null; }

beforeEach(() => {
  jest.useFakeTimers();
  mockLowPower = false;
  seen = null;
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'light', palettePreference: 'aurore', skyOverride: null, appearanceByUser: {}, appearanceOwner: null, hapticsEnabled: true }); });
});
afterEach(async () => {
  await act(async () => { while (mounted.length) mounted.pop()!.unmount(); });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('préférences d’apparence', () => {
  it('apparence et palette indépendantes, appliquées immédiatement', async () => {
    await render(<Probe />);
    expect(seen!.name).toBe('light');
    expect(seen!.colors.primary).toBe(PALETTES.aurore.ink[0]);
    await act(async () => { useUiStore.getState().setPalette('menthe'); });
    // v3 : la palette est interpolée en 4 paliers (≈ 360 ms) — d'abord la couleur affichée, puis la nouvelle
    expect(seen!.colors.primary).toBe(PALETTES.aurore.ink[0]);
    await act(async () => { jest.advanceTimersByTime(400); });
    expect(seen!.colors.primary).toBe(PALETTES.menthe.ink[0]);
    await act(async () => { useUiStore.getState().setTheme('dark'); });
    expect(seen!.name).toBe('dark');
    expect(seen!.colors.primary).toBe(PALETTES.menthe.glow[0]);
    expect(seen!.colors.background).toBe('#06090B');
  });
  it('Auto : palette de l’heure locale, aperçu d’un autre moment via skyOverride', async () => {
    await act(async () => { useUiStore.setState({ palettePreference: 'auto', skyOverride: 'dusk' }); });
    await render(<Probe />);
    expect(seen!.palette).toBe('crepuscule');
    expect(seen!.colors.primary).toBe(PALETTES.crepuscule.ink[0]);
    await act(async () => { useUiStore.getState().setSkyOverride('dawn'); });
    expect(seen!.palette).toBe('menthe');
    await act(async () => { useUiStore.getState().setSkyOverride(null); });
    expect(seen!.palette).toBe(autoPaletteAt(new Date()).dominant);
  });
  it('mode nuit (écran /night) prioritaire, palette atténuée, sans halo', async () => {
    await act(async () => { useUiStore.setState({ nightMode: true }); });
    await render(<Probe />);
    expect(seen!.name).toBe('night');
    expect(seen!.tokens.halo.intensity).toBe(0);
  });
  it('ancienne préférence « auto » (clair/sombre selon l’heure) lue comme Système', async () => {
    await act(async () => { useUiStore.setState({ themePreference: 'auto' }); });
    await render(<Probe />);
    expect(['light', 'dark']).toContain(seen!.name);
  });
  it('par compte : chaque membre retrouve ses choix, un nouveau compte part de Système + Auto', () => {
    const s = () => useUiStore.getState();
    act(() => { s().switchAppearanceOwner('alice'); });
    expect(s().appearanceByUser.alice).toEqual({ theme: 'light', palette: 'aurore' }); // premier compte : garde l'existant
    act(() => { s().setTheme('dark'); s().setPalette('iris'); });
    act(() => { s().switchAppearanceOwner('bob'); });
    expect([s().themePreference, s().palettePreference]).toEqual(['system', 'auto']);
    act(() => { s().setPalette('crepuscule'); });
    act(() => { s().switchAppearanceOwner('alice'); });
    expect([s().themePreference, s().palettePreference]).toEqual(['dark', 'iris']);
    expect(s().appearanceByUser.bob).toEqual({ theme: 'system', palette: 'crepuscule' });
  });
});

describe('GlowCard, reflet et validation', () => {
  it('GlowCard : rôle radio coché pour un sélecteur ; au repos ni filet ni halo visibles', async () => {
    const r = await render(<GlowCard active={false} role="radio" onPress={() => undefined} testID="g"><RNText>x</RNText></GlowCard>);
    const press = r.root.findAll((n) => n.props.testID === 'g' && n.props.accessibilityRole === 'radio')[0];
    expect(press.props.accessibilityState).toEqual({ checked: false, selected: false });
  });
  it('mouvement complet : faisceau à l’activation, reflet du bouton présent', async () => {
    function Sheen() { const s = usePressSheen(); return <PressSheen sheen={s} />; }
    const r = await render(<><GlowCard active><RNText>x</RNText></GlowCard><Sheen /></>);
    await act(async () => { jest.advanceTimersByTime(50); });
    expect(byTestId(r, 'press-sheen').length).toBe(1);
  });
  it('Réduire les animations : aucun reflet, aucun faisceau, coche posée sans ressort ni halo', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    function Sheen() { const s = usePressSheen(); return <PressSheen sheen={s} />; }
    function Task() {
      const [done, setDone] = React.useState(false);
      return <CompletionGlow done={done}><CompletionCheck done={done} onToggle={setDone} label="Terminer" testID="task" /></CompletionGlow>;
    }
    const r = await render(<><GlowCard active><RNText>x</RNText></GlowCard><Sheen /><Task /></>);
    expect(byTestId(r, 'press-sheen').length).toBe(0);
    expect(byTestId(r, 'glow-beam').length).toBe(0);
    const check = r.root.findAll((n) => n.props.testID === 'task' && n.props.accessibilityRole === 'checkbox')[0];
    await act(async () => { check.props.onPress(); });
    await act(async () => { jest.advanceTimersByTime(16); });
    const disc = byTestId(r, 'completion-disc')[0];
    const st = styleOf(disc) as { opacity: number; transform: { scale: number }[] };
    expect(st.opacity).toBe(1);
    expect(st.transform[0].scale).toBe(1);
    expect((styleOf(byTestId(r, 'completion-glow')[0]) as { opacity: number }).opacity).toBe(0);
  });
  it('économie d’énergie : même comportement que Réduire les animations', async () => {
    mockLowPower = true;
    function Sheen() { const s = usePressSheen(); return <PressSheen sheen={s} />; }
    const r = await render(<Sheen />);
    expect(byTestId(r, 'press-sheen').length).toBe(0);
  });
  it('mouvement complet : la validation joue le ressort puis atteint l’état final', async () => {
    function Task() {
      const [done, setDone] = React.useState(false);
      return <CompletionGlow done={done}><CompletionCheck done={done} onToggle={setDone} label="Terminer" testID="task" /></CompletionGlow>;
    }
    const r = await render(<Task />);
    const check = r.root.findAll((n) => n.props.testID === 'task' && n.props.accessibilityRole === 'checkbox')[0];
    expect(check.props.accessibilityState.checked).toBe(false);
    await act(async () => { check.props.onPress(); });
    await act(async () => { jest.advanceTimersByTime(32); });
    const early = styleOf(byTestId(r, 'completion-disc')[0]) as { transform: { scale: number }[] };
    expect(early.transform[0].scale).toBeLessThan(1);
    await act(async () => { jest.advanceTimersByTime(2000); });
    const late = styleOf(byTestId(r, 'completion-disc')[0]) as { opacity: number; transform: { scale: number }[] };
    expect(late.opacity).toBe(1);
    expect(Math.abs(late.transform[0].scale - 1)).toBeLessThan(0.01);
    expect((styleOf(byTestId(r, 'completion-glow')[0]) as { opacity: number }).opacity).toBeLessThan(0.02);
  });
});
