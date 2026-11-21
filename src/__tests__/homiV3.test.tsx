/**
 * HOMI v3 → v5 : famille de commandes (états, accessibilité, double soumission), panneau du bas
 * gestuel (crans, fermeture), fond uni et halo corail, système de mouvement (familles de durées),
 * transition carte → détail (registre, Réduire les animations), apparence résolue (identité unique).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: (p: { testID?: string }) => (p.testID ? require('react').createElement('Text', { testID: p.testID }) : null), MaterialCommunityIcons: () => null }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' }, NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));
let mockLowPower = false;
jest.mock('@/lib/lowPower', () => ({ useLowPower: () => mockLowPower }));

import React from 'react';
import { AccessibilityInfo, Alert } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider, useTheme, resolveThemeName } from '@/theme/ThemeProvider';
import { useUiStore } from '@/lib/store';
import { ChoiceGroup, CHECK_MIN_WIDTH, DataTile, IconOrb, PrimaryButton, SensitiveButton, sparkPoints } from '@/components/controls';
import { ToastProvider, sheetRelease, sheetSnaps, SHEET } from '@/components/Overlays';
import { CoralHalo, HALO } from '@/components/CoralHalo';
import { durationFamilies, duration } from '@/theme/motion';
import { dampingRatio, springs } from '@/motion/curves';
import { MorphSource, morphRegistry, MORPH } from '@/motion/Morph';
import { PALETTES, surfaceShadow, themes, type Theme } from '@/theme/tokens';

const mounted: ReactTestRenderer[] = [];
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider>); });
  mounted.push(r);
  return r;
}
const host = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === 'string');
const pressable = (r: ReactTestRenderer, id: string): ReactTestInstance => r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function' && n.props.accessibilityRole !== undefined)[0];

let seen: Theme | null = null;
function Probe() { seen = useTheme(); return null; }

beforeEach(() => {
  jest.useFakeTimers();
  mockLowPower = false;
  seen = null;
  morphRegistry.reset();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'dark', palettePreference: 'rose', themePreview: null, skyOverride: null, appearanceByUser: {}, appearanceOwner: null, hapticsEnabled: true }); });
});
afterEach(async () => {
  await act(async () => { while (mounted.length) mounted.pop()!.unmount(); });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('système de mouvement v3', () => {
  it('trois familles de durées : micro 120–180, panneaux 220–320, scènes 320–450 ms', () => {
    const inRange = (v: number, [a, b]: readonly [number, number]) => v >= a && v <= b;
    expect(inRange(duration.micro, durationFamilies.micro)).toBe(true);
    expect(inRange(duration.panel, durationFamilies.panel)).toBe(true);
    expect(inRange(duration.scene, durationFamilies.scene)).toBe(true);
    expect(inRange(MORPH.openMs, durationFamilies.scene)).toBe(true);
    expect(inRange(MORPH.closeMs, durationFamilies.scene)).toBe(true);
  });
  it('ressort « panneau » quasi critique (pas de rebond visible)', () => {
    expect(dampingRatio(springs.panneau)).toBeGreaterThan(0.85);
    expect(dampingRatio(springs.panneau)).toBeLessThanOrEqual(1);
  });
});

describe('identité unique (v5) : apparence résolue sans palette', () => {
  it('nuit prioritaire, puis le choix, puis le système ; « auto » lu comme Système', () => {
    expect(resolveThemeName({ nightMode: true, preference: 'light', system: 'light' })).toBe('night');
    expect(resolveThemeName({ nightMode: false, preference: 'dark', system: 'light' })).toBe('dark');
    expect(resolveThemeName({ nightMode: false, preference: 'system', system: 'dark' })).toBe('dark');
    expect(resolveThemeName({ nightMode: false, preference: 'auto', system: null })).toBe('light');
  });
  it('changer d’apparence pose directement le thème (aucune étape intermédiaire)', async () => {
    await render(<Probe />);
    expect(seen!.colors.primary).toBe(PALETTES.rose.glow[0]);
    await act(async () => { useUiStore.getState().setTheme('light'); });
    expect(seen!.colors.primary).toBe(PALETTES.rose.ink[0]);
  });
});

describe('matières', () => {
  it('v5 : surfaces élevées = ombre de contact très légère (2 couches, aucune couleur) ; contenu sans ombre ; nuit : aucune', () => {
    const opt = surfaceShadow(themes.light, 'optical')!;
    expect(opt.length).toBe(2);
    for (const l of opt) expect(Number(l.color.match(/,([\d.]+)\)$/)![1])).toBeLessThanOrEqual(0.08);
    expect(surfaceShadow(themes.light, 'matte')).toBeUndefined();
    expect(surfaceShadow(themes.night, 'optical')).toBeUndefined();
    for (const k of ['optical', 'frosted', 'matte'] as const) expect(themes.light.material.surfaces[k].blur).toBe(0);
  });
});

describe('ChoiceGroup', () => {
  const opts = [{ value: 'a', label: 'Un', testID: 'c-a' }, { value: 'b', label: 'Deux', testID: 'c-b' }, { value: 'c', label: 'Trois', testID: 'c-c' }] as const;
  it('groupe radio nommé, option cochée annoncée, choix transmis', async () => {
    const onChange = jest.fn();
    const r = await render(<ChoiceGroup label="Durée" options={[...opts]} value="b" onChange={onChange} testID="grp" />);
    const grp = host(r, 'grp')[0];
    expect(grp.props.accessibilityRole).toBe('radiogroup');
    expect(grp.props.accessibilityLabel).toBe('Durée');
    expect(pressable(r, 'c-b').props.accessibilityState).toEqual({ selected: true, checked: true });
    expect(pressable(r, 'c-a').props.accessibilityState).toEqual({ selected: false, checked: false });
    await act(async () => { pressable(r, 'c-c').props.onPress(); });
    expect(onChange).toHaveBeenCalledWith('c');
  });
  it('coche + indicateur dès que la place le permet (sélection jamais par la couleur seule)', async () => {
    const r = await render(<ChoiceGroup label="Durée" options={[...opts]} value="a" onChange={() => undefined} testID="grp" />);
    const grp = host(r, 'grp')[0];
    await act(async () => { grp.props.onLayout({ nativeEvent: { layout: { width: CHECK_MIN_WIDTH * 3 + 40, height: 52 } } }); });
    expect(host(r, 'choice-indicator').length).toBe(1);
    expect(host(r, 'choice-check').length).toBe(1);
    // très étroit : pas de coche, le gras reste (230 px : les libellés tiennent encore en pills avec le fontScale 2
    // du simulateur Jest, plafonné à 1,5 ; plus étroit, le sélecteur passe en cartes — audit 09)
    await act(async () => { grp.props.onLayout({ nativeEvent: { layout: { width: 230, height: 52 } } }); });
    expect(host(r, 'choice-check').length).toBe(0);
  });
  it('variante orbes (humeur) : coche sur l’orbe choisi', async () => {
    const r = await render(<ChoiceGroup variant="orbs" label="Humeur" options={[{ value: 'x', label: 'Calme', icon: 'sun' }, { value: 'y', label: 'Bien', icon: 'moon' }]} value="y" onChange={() => undefined} testID="orbs" />);
    expect(host(r, 'orbs')[0].props.accessibilityRole).toBe('radiogroup');
    expect(host(r, 'choice-check').length).toBe(1);
  });
});

describe('IconOrb', () => {
  it('nom accessible, cible ≥ 48 px même en petite taille, état sélectionné et désactivé', async () => {
    const onPress = jest.fn();
    const r = await render(<IconOrb icon="plus" label="Ajouter" size="sm" selected onPress={onPress} testID="orb" />);
    const p = pressable(r, 'orb');
    expect(p.props.accessibilityLabel).toBe('Ajouter');
    expect(p.props.accessibilityRole).toBe('button');
    expect(40 + 2 * (p.props.hitSlop as number)).toBeGreaterThanOrEqual(48);
    expect(p.props.accessibilityState).toEqual({ disabled: false, selected: true });
    expect(host(r, 'orb-light').length).toBe(1);
    const r2 = await render(<IconOrb icon="x" label="Fermer" disabled onPress={onPress} testID="orb2" />);
    expect(r2.root.findAll((n) => n.props.testID === 'orb2' && n.props.accessibilityState)[0].props.accessibilityState.disabled).toBe(true);
  });
});

describe('PrimaryButton : enregistrement', () => {
  it('double soumission bloquée, chargement annoncé, libellé conservé (largeur stable)', async () => {
    let resolve!: () => void;
    const onPress = jest.fn(() => new Promise<void>((r) => { resolve = r; }));
    const r = await render(<PrimaryButton label="Enregistrer" onPress={onPress} testID="save" />);
    const btn = () => r.root.findAll((n) => n.props.accessibilityLabel === 'Enregistrer' && typeof n.props.onPress === 'function')[0];
    await act(async () => { btn().props.onPress({}); });
    await act(async () => { btn().props.onPress({}); btn().props.onPress({}); });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(btn().props.accessibilityState).toEqual({ disabled: true, busy: true });
    // le libellé reste rendu (en fondu) : la largeur ne change pas pendant l'enregistrement
    expect(r.root.findAll((n) => n.props.children === 'Enregistrer').length).toBeGreaterThan(0);
    await act(async () => { resolve(); });
    await act(async () => { jest.advanceTimersByTime(500); });
    expect(btn().props.accessibilityState).toEqual({ disabled: false, busy: false });
  });
});

describe('SensitiveButton : confirmation avant d’agir', () => {
  it('annuler : rien ne se passe ; confirmer : l’action part', async () => {
    const onPress = jest.fn();
    let answer = 0;
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => { buttons?.[answer]?.onPress?.(); });
    const r = await render(<SensitiveButton label="Supprimer" onPress={onPress} confirmMessage="Sûr ?" />);
    const btn = () => r.root.findAll((n) => n.props.accessibilityLabel === 'Supprimer' && typeof n.props.onPress === 'function')[0];
    await act(async () => { btn().props.onPress({}); });
    expect(onPress).not.toHaveBeenCalled();
    answer = 1;
    await act(async () => { jest.advanceTimersByTime(500); });
    await act(async () => { btn().props.onPress({}); });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith('Supprimer', 'Sûr ?', expect.any(Array));
  });
});

describe('DataTile', () => {
  it('nom lisible unique : valeur, unité, période, tendance', async () => {
    const r = await render(<DataTile label="Sommeil" value="7,4" unit="h" context="7 derniers jours" series={[6, 7, 7.4]} trendLabel="en hausse" testID="tile" />);
    expect(host(r, 'tile')[0].props.accessibilityLabel).toBe('Sommeil : 7,4 h, 7 derniers jours, en hausse');
    expect(host(r, 'sparkline').length).toBe(1);
    expect(host(r, 'tile-light').length).toBe(1);
  });
  it('état vide explicite, sans micrographique ni lumière', async () => {
    const r = await render(<DataTile label="Courses" value={null} emptyText="Aucune donnée" series={[3, 4]} testID="tile" />);
    expect(host(r, 'tile-empty').length).toBe(1);
    expect(host(r, 'tile')[0].props.accessibilityLabel).toBe('Courses : Aucune donnée');
    expect(host(r, 'sparkline').length).toBe(0);
  });
  it('micrographique : seulement avec au moins deux valeurs RÉELLES (aucun point inventé)', () => {
    expect(sparkPoints([], 96, 28)).toBeNull();
    expect(sparkPoints([5, null, undefined, NaN], 96, 28)).toBeNull();
    const pts = sparkPoints([1, null, 3], 96, 28)!;
    expect(pts.length).toBe(2);
    expect(pts[0][0]).toBeLessThan(pts[1][0]);
  });
});

describe('panneau du bas gestuel', () => {
  it('crans : un seul pour un contenu court, moyen + grand pour un contenu haut', () => {
    expect(sheetSnaps(300, 800)).toEqual([0]);
    const s = sheetSnaps(700, 800);
    expect(s.length).toBe(2);
    expect(s[1]).toBeCloseTo(700 - 800 * SHEET.mediumRatio, 5);
  });
  it('relâcher : cran le plus proche, lancer vers le haut = grand cran, assez bas ou lancer vers le bas = fermeture', () => {
    const snaps = sheetSnaps(700, 800);
    expect(sheetRelease({ y: 20, vy: 0, snaps, h: 700 })).toEqual({ close: false, to: 0 });
    expect(sheetRelease({ y: snaps[1] - 10, vy: 0, snaps, h: 700 })).toEqual({ close: false, to: snaps[1] });
    expect(sheetRelease({ y: snaps[1] + 10, vy: -1500, snaps, h: 700 })).toEqual({ close: false, to: 0 });
    expect(sheetRelease({ y: snaps[1] + 10, vy: 1500, snaps, h: 700 }).close).toBe(true);
    expect(sheetRelease({ y: snaps[1] + (700 - snaps[1]) * 0.5, vy: 0, snaps, h: 700 }).close).toBe(true);
    expect(sheetRelease({ y: 30, vy: 1500, snaps, h: 700 })).toEqual({ close: false, to: snaps[1] });
  });
});

describe('fond uni et halo corail (v5)', () => {
  it('halo : respiration très lente et discrète', () => {
    expect(HALO.breathMs).toBeGreaterThanOrEqual(5000);
    expect(HALO.scale).toBeLessThanOrEqual(1.05);
    expect(HALO.minOpacity).toBeGreaterThanOrEqual(0.85);
  });
  it('halo rendu en clair (décor masqué aux lecteurs d’écran), éteint la nuit', async () => {
    await act(async () => { useUiStore.setState({ themePreference: 'light' }); });
    const r = await render(<CoralHalo size={200} testID="halo" />);
    const h = host(r, 'halo')[0];
    expect(h.props.accessibilityElementsHidden).toBe(true);
    expect(h.findAll((n) => (n.type as unknown) === 'RNSVGRadialGradient' || String(n.type).includes('RadialGradient')).length).toBeGreaterThan(0);
    await act(async () => { useUiStore.setState({ nightMode: true }); });
    const night = host(r, 'halo')[0];
    expect(night.findAll((n) => String(n.type).includes('RadialGradient')).length).toBe(0);
  });
});

describe('morph carte → détail', () => {
  it('Réduire les animations : navigation immédiate, aucun fantôme', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const onOpen = jest.fn();
    const r = await render(<MorphSource id="carte-1" onOpen={onOpen} accessibilityLabel="Ouvrir" testID="src"><></></MorphSource>);
    expect(morphRegistry.has('carte-1')).toBe(true);
    await act(async () => { pressable(r, 'src').props.onPress(); });
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(morphRegistry.lastOpened()).toBe('carte-1');
    await act(async () => { r.unmount(); });
    mounted.splice(mounted.indexOf(r), 1);
    expect(morphRegistry.has('carte-1')).toBe(false);
  });
});
