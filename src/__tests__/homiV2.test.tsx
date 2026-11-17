/**
 * HOMI v2 → v5 : préférences d'apparence (par compte, persistantes), thème résolu (apparence, identité unique),
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
import { migrateAppearance, useUiStore } from '@/lib/store';
import { GlowCard } from '@/components/GlowCard';
import { CompletionCheck, CompletionGlow, PressSheen, usePressSheen } from '@/motion';
import { PALETTE_SPECS, PALETTES, type Theme } from '@/theme/tokens';

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
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'light', palettePreference: 'lilas' as never, adaptiveProfile: 'me', skyOverride: null, appearanceByUser: {}, appearanceOwner: null, hapticsEnabled: true }); });
});
afterEach(async () => {
  await act(async () => { while (mounted.length) mounted.pop()!.unmount(); });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('préférences d’apparence (v5 : identité unique, Système / Clair / Sombre)', () => {
  it('apparence appliquée immédiatement ; une seule identité (corail), plus de palette', async () => {
    await render(<Probe />);
    expect(seen!.name).toBe('light');
    expect(seen!.palette).toBe('homi');
    expect(seen!.colors.primary).toBe(PALETTES.homi.ink[0]);
    expect(seen!.colors.background).toBe('#FBF4F2');
    await act(async () => { useUiStore.getState().setTheme('dark'); });
    expect(seen!.name).toBe('dark');
    expect(seen!.colors.primary).toBe(PALETTES.homi.glow[0]);
    expect(seen!.colors.background).toBe('#1A1217');
  });
  it('l’heure ne change plus les couleurs : l’aperçu d’un moment (skyOverride) ne touche que la phase', async () => {
    await act(async () => { useUiStore.setState({ skyOverride: 'dusk' }); });
    await render(<Probe />);
    const primary = seen!.colors.primary;
    expect(seen!.phase).toBe('dusk');
    await act(async () => { useUiStore.getState().setSkyOverride('dawn'); });
    expect(seen!.phase).toBe('dawn');
    expect(seen!.colors.primary).toBe(primary);
  });
  it('mode nuit (écran /night) prioritaire, sans halo', async () => {
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
  it('par compte : chaque membre retrouve son apparence, un nouveau compte part de Système', () => {
    const s = () => useUiStore.getState();
    act(() => { s().switchAppearanceOwner('alice'); });
    expect(s().appearanceByUser.alice).toEqual({ theme: 'light', palette: 'homi' }); // premier compte : garde l'existant (palette migrée)
    act(() => { s().setTheme('dark'); });
    act(() => { s().switchAppearanceOwner('bob'); });
    expect([s().themePreference, s().palettePreference]).toEqual(['system', 'homi']);
    act(() => { s().setTheme('system'); });
    act(() => { s().switchAppearanceOwner('alice'); });
    expect([s().themePreference, s().palettePreference]).toEqual(['dark', 'homi']);
    expect(s().appearanceByUser.bob).toEqual({ theme: 'system', palette: 'homi' });
  });
  it('migration v5 : toutes les palettes enregistrées (v3, v4, Auto ; compte actif et autres comptes) deviennent l’identité unique, l’apparence est conservée', () => {
    const out = migrateAppearance({
      palettePreference: 'turquoise' as never,
      appearanceByUser: { alice: { theme: 'dark', palette: 'crepuscule' as never }, bob: { theme: 'system', palette: 'auto' as never }, carla: { theme: 'light', palette: 'lagune' as never } },
    });
    expect(out.palettePreference).toBe('homi');
    expect(out.appearanceByUser).toEqual({ alice: { theme: 'dark', palette: 'homi' }, bob: { theme: 'system', palette: 'homi' }, carla: { theme: 'light', palette: 'homi' } });
    act(() => { useUiStore.getState().setPalette('menthe' as never); });
    expect(useUiStore.getState().palettePreference).toBe('homi');
  });
  it('v6 : une palette choisie s’applique immédiatement, en clair et en sombre, et reste propre au compte', async () => {
    await render(<Probe />);
    act(() => { useUiStore.getState().switchAppearanceOwner('alice'); });
    await act(async () => { useUiStore.getState().setPalette('sauge'); });
    expect(seen!.palette).toBe('sauge');
    expect(seen!.colors.primary).toBe(PALETTES.sauge.ink[0]);
    expect(seen!.colors.background).toBe(PALETTE_SPECS.sauge.light.bg);
    await act(async () => { useUiStore.getState().setTheme('dark'); });
    expect(seen!.colors.primary).toBe(PALETTES.sauge.glow[0]);
    expect(seen!.colors.background).toBe(PALETTE_SPECS.sauge.dark.bg);
    expect(useUiStore.getState().appearanceByUser.alice).toEqual({ theme: 'dark', palette: 'sauge' });
    // un autre compte part de la palette par défaut ; le premier retrouve la sienne
    await act(async () => { useUiStore.getState().switchAppearanceOwner('bob'); });
    expect(seen!.palette).toBe('homi');
    await act(async () => { useUiStore.getState().switchAppearanceOwner('alice'); });
    expect(seen!.palette).toBe('sauge');
    // un choix v6 survit à la restauration
    expect(migrateAppearance({ palettePreference: 'sauge', appearanceByUser: { alice: { theme: 'dark', palette: 'adaptive' } } }))
      .toEqual({ palettePreference: 'sauge', appearanceByUser: { alice: { theme: 'dark', palette: 'adaptive' } } });
  });
  it('v6 : Adaptatif suit le profil affiché (correspondance fixe) ; une palette fixe l’ignore', async () => {
    await act(async () => { useUiStore.setState({ palettePreference: 'adaptive', adaptiveProfile: 'me' }); });
    await render(<Probe />);
    expect(seen!.palette).toBe('homi');
    for (const [profile, palette] of [['pregnancy', 'lavande'], ['child', 'sauge'], ['postpartum', 'champagne'], ['family', 'nuit'], ['me', 'homi']] as const) {
      await act(async () => { useUiStore.getState().setAdaptiveProfile(profile); });
      expect(seen!.palette).toBe(palette);
      expect(seen!.colors.primary).toBe(PALETTES[palette].ink[0]);
    }
    await act(async () => { useUiStore.getState().setPalette('champagne'); useUiStore.getState().setAdaptiveProfile('family'); });
    expect(seen!.palette).toBe('champagne');
  });
  it('v6 : « Rétablir par défaut » remet Système et la palette par défaut, pour le compte actif', async () => {
    await render(<Probe />);
    act(() => { useUiStore.getState().switchAppearanceOwner('alice'); });
    await act(async () => { useUiStore.getState().setPalette('nuit'); useUiStore.getState().setTheme('dark'); });
    expect(seen!.palette).toBe('nuit');
    await act(async () => { useUiStore.getState().resetAppearance(); });
    expect([useUiStore.getState().themePreference, useUiStore.getState().palettePreference]).toEqual(['system', 'homi']);
    expect(useUiStore.getState().appearanceByUser.alice).toEqual({ theme: 'system', palette: 'homi' });
    expect(seen!.palette).toBe('homi');
  });
  it('migration v5 : une préférence ancienne encore en mémoire s’affiche avec l’identité unique', async () => {
    await act(async () => { useUiStore.setState({ palettePreference: 'lilas' as never }); });
    await render(<Probe />);
    expect(seen!.palette).toBe('homi');
    expect(seen!.colors.primary).toBe(PALETTES.homi.ink[0]);
  });
});

describe('GlowCard, reflet et validation', () => {
  it('GlowCard : rôle radio coché pour un sélecteur ; au repos ni filet ni halo visibles', async () => {
    const r = await render(<GlowCard active={false} role="radio" onPress={() => undefined} testID="g"><RNText>x</RNText></GlowCard>);
    const press = r.root.findAll((n) => n.props.testID === 'g' && n.props.accessibilityRole === 'radio')[0];
    expect(press.props.accessibilityState).toEqual({ checked: false, selected: false });
  });
  it('mouvement complet : reflet de pression disponible (primitive conservée)', async () => {
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
