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
import { PALETTE_SPECS, PALETTES, THEME_STARTS, type Theme } from '@/theme/tokens';

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
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'light', palettePreference: 'lilas' as never, themePreview: null, adaptiveProfile: 'me', skyOverride: null, appearanceByUser: {}, appearanceOwner: null, hapticsEnabled: true }); });
});
afterEach(async () => {
  await act(async () => { while (mounted.length) mounted.pop()!.unmount(); });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('préférences d’apparence (v7 : huit thèmes, Système / Clair / Sombre)', () => {
  it('apparence appliquée immédiatement ; une ancienne préférence s’affiche avec le thème le plus proche (Rose poudré)', async () => {
    await render(<Probe />);
    expect(seen!.name).toBe('light');
    expect(seen!.palette).toBe('rose');
    expect(seen!.colors.primary).toBe(PALETTES.rose.ink[0]);
    expect(seen!.colors.background).toBe(THEME_STARTS.rose.bg);
    await act(async () => { useUiStore.getState().setTheme('dark'); });
    expect(seen!.name).toBe('dark');
    expect(seen!.colors.primary).toBe(PALETTES.rose.glow[0]);
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
  it('par compte : chaque membre retrouve son apparence, un nouveau compte part de Système et d’Olive HOMI', () => {
    const s = () => useUiStore.getState();
    act(() => { s().switchAppearanceOwner('alice'); });
    expect(s().appearanceByUser.alice).toEqual({ theme: 'light', palette: 'rose' }); // premier compte : garde l'existant (migré)
    act(() => { s().setTheme('dark'); });
    act(() => { s().switchAppearanceOwner('bob'); });
    expect([s().themePreference, s().palettePreference]).toEqual(['system', 'olive']);
    act(() => { s().setTheme('system'); });
    act(() => { s().switchAppearanceOwner('alice'); });
    expect([s().themePreference, s().palettePreference]).toEqual(['dark', 'rose']);
    expect(s().appearanceByUser.bob).toEqual({ theme: 'system', palette: 'olive' });
  });
  it('migration v7 : chaque palette enregistrée (compte actif et autres comptes) devient le thème le plus proche, l’apparence est conservée', () => {
    const out = migrateAppearance({
      palettePreference: 'sauge' as never,
      appearanceByUser: {
        alice: { theme: 'dark', palette: 'homi' as never }, bob: { theme: 'system', palette: 'nuit' as never },
        carla: { theme: 'light', palette: 'champagne' as never }, dan: { theme: 'light', palette: 'lagune' as never }, eve: { theme: 'dark', palette: 'lavande' },
      },
    });
    expect(out.palettePreference).toBe('olive');
    expect(out.appearanceByUser).toEqual({
      alice: { theme: 'dark', palette: 'rose' }, bob: { theme: 'system', palette: 'glacier' },
      carla: { theme: 'light', palette: 'sable' }, dan: { theme: 'light', palette: 'rose' }, eve: { theme: 'dark', palette: 'lavande' },
    });
    act(() => { useUiStore.getState().setPalette('menthe' as never); });
    expect(useUiStore.getState().palettePreference).toBe('rose');
  });
  it('v7 : un thème choisi s’applique immédiatement, en clair et en sombre, et reste propre au compte', async () => {
    await render(<Probe />);
    act(() => { useUiStore.getState().switchAppearanceOwner('alice'); });
    await act(async () => { useUiStore.getState().setPalette('glacier'); });
    expect(seen!.palette).toBe('glacier');
    expect(seen!.colors.primary).toBe(PALETTES.glacier.ink[0]);
    expect(seen!.colors.background).toBe(PALETTE_SPECS.glacier.light.bg);
    await act(async () => { useUiStore.getState().setTheme('dark'); });
    expect(seen!.colors.primary).toBe(PALETTES.glacier.glow[0]);
    expect(seen!.colors.background).toBe(PALETTE_SPECS.glacier.dark.bg);
    expect(useUiStore.getState().appearanceByUser.alice).toEqual({ theme: 'dark', palette: 'glacier' });
    // un autre compte part du thème par défaut ; le premier retrouve le sien
    await act(async () => { useUiStore.getState().switchAppearanceOwner('bob'); });
    expect(seen!.palette).toBe('olive');
    await act(async () => { useUiStore.getState().switchAppearanceOwner('alice'); });
    expect(seen!.palette).toBe('glacier');
    // un choix v7 survit à la restauration
    expect(migrateAppearance({ palettePreference: 'glacier', appearanceByUser: { alice: { theme: 'dark', palette: 'adaptive' } } }))
      .toEqual({ palettePreference: 'glacier', appearanceByUser: { alice: { theme: 'dark', palette: 'adaptive' } } });
  });
  it('v7 : Noir graphite et Nuit améthyste restent sombres en « Clair »', async () => {
    await render(<Probe />);
    await act(async () => { useUiStore.getState().setPalette('graphite'); });
    expect(seen!.isDark).toBe(true);
    expect(seen!.colors.background).toBe(THEME_STARTS.graphite.bg);
    await act(async () => { useUiStore.getState().setPalette('amethyste'); });
    expect(seen!.isDark).toBe(true);
    expect(seen!.colors.background).toBe(THEME_STARTS.amethyste.bg);
  });
  it('v7 : Adaptatif suit le profil affiché (correspondance fixe) ; un thème fixe l’ignore', async () => {
    await act(async () => { useUiStore.setState({ palettePreference: 'adaptive', adaptiveProfile: 'me' }); });
    await render(<Probe />);
    expect(seen!.palette).toBe('rose');
    for (const [profile, palette] of [['pregnancy', 'lavande'], ['child', 'olive'], ['postpartum', 'sable'], ['family', 'glacier'], ['me', 'rose']] as const) {
      await act(async () => { useUiStore.getState().setAdaptiveProfile(profile); });
      expect(seen!.palette).toBe(palette);
      expect(seen!.colors.primary).toBe(PALETTES[palette].ink[0]);
    }
    await act(async () => { useUiStore.getState().setPalette('sable'); useUiStore.getState().setAdaptiveProfile('family'); });
    expect(seen!.palette).toBe('sable');
  });
  it('v7 : « Rétablir par défaut » remet Système et Olive HOMI, pour le compte actif', async () => {
    await render(<Probe />);
    act(() => { useUiStore.getState().switchAppearanceOwner('alice'); });
    await act(async () => { useUiStore.getState().setPalette('glacier'); useUiStore.getState().setTheme('dark'); });
    expect(seen!.palette).toBe('glacier');
    await act(async () => { useUiStore.getState().resetAppearance(); });
    expect([useUiStore.getState().themePreference, useUiStore.getState().palettePreference]).toEqual(['system', 'olive']);
    expect(useUiStore.getState().appearanceByUser.alice).toEqual({ theme: 'system', palette: 'olive' });
    expect(seen!.palette).toBe('olive');
  });
});

describe('sélecteur « Personnaliser l’accueil » : aperçu, annulation, application, relancement', () => {
  it('l’aperçu s’affiche partout tout de suite sans rien enregistrer ; fermer rétablit le thème confirmé', async () => {
    await act(async () => { useUiStore.setState({ palettePreference: 'olive', themePreview: null }); });
    await render(<Probe />);
    act(() => { useUiStore.getState().switchAppearanceOwner('alice'); });
    await act(async () => { useUiStore.getState().previewTheme('amethyste'); });
    expect(seen!.palette).toBe('amethyste');
    expect(seen!.isDark).toBe(true);
    expect(useUiStore.getState().palettePreference).toBe('olive');
    expect(useUiStore.getState().appearanceByUser.alice.palette).toBe('olive');
    await act(async () => { useUiStore.getState().previewTheme('sable'); });
    expect(seen!.palette).toBe('sable');
    await act(async () => { useUiStore.getState().cancelThemePreview(); });
    expect(seen!.palette).toBe('olive');
    expect(useUiStore.getState().themePreview).toBeNull();
  });
  it('« Appliquer le thème » enregistre le thème pour le compte actif ; l’aperçu n’est jamais persisté', async () => {
    await act(async () => { useUiStore.setState({ palettePreference: 'olive', themePreview: null }); });
    await render(<Probe />);
    act(() => { useUiStore.getState().switchAppearanceOwner('alice'); });
    await act(async () => { useUiStore.getState().previewTheme('lavande'); });
    // relancement AVANT d'appliquer : l'état persisté ne contient pas l'aperçu
    const persistOpts = useUiStore.persist.getOptions();
    const saved = persistOpts.partialize!(useUiStore.getState()) as Record<string, unknown>;
    expect(saved.themePreview).toBeUndefined();
    expect(saved.palettePreference).toBe('olive');
    await act(async () => { useUiStore.getState().applyThemePreview(); });
    expect(seen!.palette).toBe('lavande');
    expect(useUiStore.getState().palettePreference).toBe('lavande');
    expect(useUiStore.getState().themePreview).toBeNull();
    expect(useUiStore.getState().appearanceByUser.alice.palette).toBe('lavande');
  });
  it('relancement : la restauration redonne EXACTEMENT le thème appliqué (et efface un aperçu)', () => {
    const persistOpts = useUiStore.persist.getOptions();
    const restored = persistOpts.merge!({ palettePreference: 'glacier', themePreview: 'graphite', appearanceByUser: { alice: { theme: 'dark', palette: 'glacier' } } }, useUiStore.getState());
    expect(restored.palettePreference).toBe('glacier');
    expect(restored.themePreview).toBeNull();
    expect(restored.appearanceByUser.alice).toEqual({ theme: 'dark', palette: 'glacier' });
  });
  it('un aperçu inconnu est ignoré ; changer de compte efface l’aperçu', () => {
    act(() => { useUiStore.setState({ themePreview: null }); useUiStore.getState().previewTheme('turquoise' as never); });
    expect(useUiStore.getState().themePreview).toBeNull();
    act(() => { useUiStore.getState().switchAppearanceOwner('alice'); useUiStore.getState().previewTheme('rose'); });
    act(() => { useUiStore.getState().switchAppearanceOwner('bob'); });
    expect(useUiStore.getState().themePreview).toBeNull();
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
