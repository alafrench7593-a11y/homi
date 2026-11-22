/**
 * Bibliothèque « Liquid Glass » (src/components/glass) : rendu de chaque composant dans chaque état, repli OPAQUE quand
 * « Réduire la transparence » est actif (ou en mode nuit), états FINAUX immédiats quand « Réduire les animations » est
 * actif. Le verre natif d'iOS 26 est couvert par glassNative.test.tsx ; les contrastes par glassContrast.test.ts.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' }, NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
jest.mock('@/lib/lowPower', () => ({ useLowPower: () => false }));
// Appareil SANS verre natif (iOS < 26, web) : niveau « flou ». Le verre natif est testé dans glassNative.test.tsx.
jest.mock('@/components/surfaces/nativeGlass', () => ({ ...jest.requireActual('@/components/surfaces/nativeGlass'), NativeGlass: null, LIQUID_GLASS_NATIVE: false, BLUR_OK: true }));

import React from 'react';
import { AccessibilityInfo, Text as RNText, View } from 'react-native';
import { getAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useUiStore } from '@/lib/store';
import { setLocale } from '@/i18n';
import { useToast } from '@/components/Overlays';
import {
  Glass, GlassButton, GlassCard, GlassFab, GlassIconButton, GlassMenu, GlassModal, GlassProfileSwitcher, GlassSearchBar, GlassSegmentedControl, GlassSheet,
  GlassTabBar, GlassTierProvider, GlassToast, GlassToastProvider, GlassToolCard, GlassToolCardSkeleton, menuPosition, type GlassButtonState, type GlassButtonVariant,
} from '@/components/glass';

const mounted: ReactTestRenderer[] = [];
/** Le fournisseur de thème lit d'abord les réglages d'accessibilité (asynchrone), PUIS le composant est monté. */
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider>{null}</ThemeProvider>); });
  await act(async () => { r.update(<ThemeProvider>{el}</ThemeProvider>); });
  mounted.push(r);
  return r;
}
/** Laisse passer une image : les styles animés lus par Jest sont alors à jour. */
const frame = () => act(async () => { jest.advanceTimersByTime(34); });
const host = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === 'string');
const one = (r: ReactTestRenderer, id: string) => host(r, id)[0];
const has = (r: ReactTestRenderer, id: string) => host(r, id).length > 0;
const readAnimatedStyle = getAnimatedStyle as unknown as (c: { props: Record<string, unknown> }) => Record<string, unknown>;
const styleOf = (n: ReactTestInstance) => readAnimatedStyle(n as unknown as { props: Record<string, unknown> });
/** Le Pressable (composite) qui porte ce testID : c'est lui qui a le rôle, l'état et les gestionnaires. */
const pressable = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type !== 'string' && 'accessibilityRole' in n.props)[0];
const layout = (x: number, width: number) => ({ nativeEvent: { layout: { x, y: 0, width, height: 44 } } });
const texts = (r: ReactTestRenderer) => r.root.findAllByType(RNText).map((n) => (Array.isArray(n.props.children) ? n.props.children.join('') : String(n.props.children)));

let reduceMotion = false;
let reduceTransparency = false;
beforeEach(() => {
  jest.useFakeTimers();
  reduceMotion = false;
  reduceTransparency = false;
  setLocale('fr');
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(() => Promise.resolve(reduceMotion));
  jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockImplementation(() => Promise.resolve(reduceTransparency));
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'light', hapticsEnabled: true }); });
  (Haptics.impactAsync as jest.Mock).mockClear();
  (Haptics.selectionAsync as jest.Mock).mockClear();
});
afterEach(async () => {
  await act(async () => { while (mounted.length) mounted.pop()!.unmount(); });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('matériau Glass : trois niveaux', () => {
  it('par défaut (iOS < 26, web) : le verre flottant est LIQUIDE (lentille réglée au laboratoire), jamais un simple fond', async () => {
    const r = await render(<Glass testID="g"><View /></Glass>);
    expect(has(r, 'g-material')).toBe(true);
    expect(has(r, 'g-liquid')).toBe(true);
    expect(has(r, 'g-opaque')).toBe(false);
  });
  it('carte de contenu (iOS < 26, web) : verre liquide sans réfraction, sur un voile de contraste (lisibilité)', async () => {
    const r = await render(<Glass testID="g" variant="card"><View /></Glass>);
    expect(has(r, 'g-liquid')).toBe(true);
    expect(has(r, 'g-liquid-fill')).toBe(true);
    expect(has(r, 'g-opaque')).toBe(false);
  });
  it.each(['chrome', 'card', 'sheet'] as const)('Réduire la transparence → surface opaque du thème, même forme (%s)', async (variant) => {
    reduceTransparency = true;
    const r = await render(<Glass testID="g" variant={variant} radius={20}><View /></Glass>);
    expect(has(r, 'g-opaque')).toBe(true);
    expect(has(r, 'g-blur')).toBe(false);
    expect(has(r, 'g-veil')).toBe(false);
    const flat = (s: unknown): Record<string, unknown> => Object.assign({}, ...[s].flat(4).filter(Boolean) as object[]);
    expect(flat(one(r, 'g-opaque').props.style).borderRadius).toBe(20);
    expect(String(flat(one(r, 'g-opaque').props.style).backgroundColor)).toMatch(/^#[0-9A-F]{6}$/i);
  });
  it('mode nuit → opaque (rien ne brille pendant un soin de nuit)', async () => {
    act(() => { useUiStore.setState({ nightMode: true }); });
    const r = await render(<Glass testID="g"><View /></Glass>);
    expect(has(r, 'g-opaque')).toBe(true);
  });
  it('niveau imposé à un sous-arbre (galerie) ; `edges="top"` : coins du haut seulement', async () => {
    const r = await render(<GlassTierProvider value="opaque"><Glass testID="g" edges="top" radius={28}><View /></Glass></GlassTierProvider>);
    expect(has(r, 'g-opaque')).toBe(true);
    const s = Object.assign({}, ...[one(r, 'g').props.style].flat(4).filter(Boolean)) as Record<string, unknown>;
    expect(s.borderTopLeftRadius).toBe(28);
    expect(s.borderRadius).toBeUndefined();
  });
  it('la sous-couche est décorative : sans interaction, masquée aux lecteurs d’écran', async () => {
    const r = await render(<Glass testID="g"><View /></Glass>);
    const m = one(r, 'g-material');
    expect(m.props.pointerEvents).toBe('none');
    expect(m.props.accessibilityElementsHidden).toBe(true);
  });
});

describe('GlassButton', () => {
  const VARIANTS: GlassButtonVariant[] = ['primary', 'secondary', 'tertiary', 'destructive'];
  const STATES: GlassButtonState[] = ['idle', 'loading', 'success', 'error'];
  it.each(VARIANTS.flatMap((v) => STATES.map((s): [GlassButtonVariant, GlassButtonState] => [v, s])))('%s / %s : rendu, rôle, état annoncé', async (variant, state) => {
    const r = await render(<GlassButton label="Enregistrer" variant={variant} state={state} onPress={() => undefined} testID="b" />);
    const b = pressable(r, 'b');
    expect(b.props.accessibilityRole).toBe('button');
    expect(b.props.accessibilityLabel).toContain('Enregistrer');
    expect(b.props.accessibilityState.busy).toBe(state === 'loading');
    expect(has(r, `b-${state}`)).toBe(state !== 'idle');
    if (state === 'loading') expect(b.props.accessibilityLabel).toContain('Chargement');
    // seul `secondary` porte du verre ; les aplats et `tertiary` n'en ont pas
    expect(has(r, 'b-material')).toBe(variant === 'secondary');
  });
  it.each(['sm', 'md', 'lg'] as const)('taille %s : cible ≥ 44 pt', async (size) => {
    const r = await render(<GlassButton label="OK" size={size} onPress={() => undefined} testID="b" />);
    const s = Object.assign({}, ...[one(r, 'b-surface').props.style].flat(4).filter(Boolean)) as Record<string, number>;
    expect(s.minHeight).toBeGreaterThanOrEqual(44);
  });
  it('désactivé : action ignorée, contenu estompé (jamais l’opacité du verre)', async () => {
    const onPress = jest.fn();
    const r = await render(<GlassButton label="OK" disabled onPress={onPress} testID="b" />);
    expect(pressable(r, 'b').props.disabled).toBe(true);
    expect(pressable(r, 'b').props.accessibilityState.disabled).toBe(true);
    const s = Object.assign({}, ...[one(r, 'b-surface').props.style].flat(4).filter(Boolean)) as Record<string, unknown>;
    expect(s.opacity).toBeUndefined();
  });
  it('pressé : compression 0,97 + haptique léger ; relâché : retour à 1', async () => {
    const r = await render(<GlassButton label="OK" onPress={() => undefined} testID="b" />);
    await act(async () => { pressable(r, 'b').props.onPressIn({}); jest.advanceTimersByTime(600); });
    expect((styleOf(one(r, 'b-surface')).transform as { scale: number }[])[0].scale).toBeCloseTo(0.97, 2);
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    await act(async () => { pressable(r, 'b').props.onPressOut({}); jest.advanceTimersByTime(900); });
    expect((styleOf(one(r, 'b-surface')).transform as { scale: number }[])[0].scale).toBeCloseTo(1, 2);
  });
  it('Réduire les animations : aucune échelle à l’appui (état final immédiat), l’action part quand même', async () => {
    reduceMotion = true;
    const onPress = jest.fn();
    const r = await render(<GlassButton label="OK" onPress={onPress} testID="b" />);
    await act(async () => { pressable(r, 'b').props.onPressIn({}); });
    await frame();
    expect((styleOf(one(r, 'b-surface')).transform as { scale: number }[])[0].scale).toBe(1);
    await act(async () => { pressable(r, 'b').props.onPress({}); });
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  it('promesse : chargement (appuis suivants ignorés) → succès → repos', async () => {
    let done!: () => void;
    const onPress = jest.fn(() => new Promise<void>((res) => { done = res; }));
    const r = await render(<GlassButton label="OK" onPress={onPress} testID="b" />);
    await act(async () => { pressable(r, 'b').props.onPress({}); });
    expect(has(r, 'b-loading')).toBe(true);
    expect(pressable(r, 'b').props.disabled).toBe(true);
    await act(async () => { done(); });
    expect(has(r, 'b-success')).toBe(true);
    await act(async () => { jest.advanceTimersByTime(1000); });
    expect(has(r, 'b-success')).toBe(false);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  it('promesse rejetée : état erreur + message (jamais d’échec muet)', async () => {
    const seen: string[] = [];
    const Spy = ({ msg, onDone }: { msg: string; onDone: () => void }) => { seen.push(msg); void onDone; return null; };
    const { ToastProvider } = jest.requireActual('@/components/Overlays') as typeof import('@/components/Overlays');
    const r = await render(<ToastProvider view={Spy}><GlassButton label="OK" onPress={() => Promise.reject(new Error('non'))} testID="b" /></ToastProvider>);
    await act(async () => { pressable(r, 'b').props.onPress({}); });
    await act(async () => { await Promise.resolve(); });
    expect(has(r, 'b-error')).toBe(true);
    expect(seen.length).toBe(1);
  });
});

describe('GlassIconButton, GlassFab', () => {
  it('bouton icône : nom accessible, cible ≥ 44 pt (hitSlop si le disque est plus petit), verre ou nu', async () => {
    const r = await render(<><GlassIconButton icon="x" label="Fermer" onPress={() => undefined} testID="i" /><GlassIconButton icon="x" label="Fermer" size={36} plain onPress={() => undefined} testID="p" /></>);
    expect(pressable(r, 'i').props.accessibilityLabel).toBe('Fermer');
    expect(has(r, 'i-material')).toBe(true);
    expect(has(r, 'p-material')).toBe(false);
    expect(36 + 2 * pressable(r, 'p').props.hitSlop).toBeGreaterThanOrEqual(44);
  });
  it('bouton flottant : aplat d’action (sans verre) ou verre, libellé facultatif, nom toujours annoncé', async () => {
    const r = await render(<><GlassFab icon="plus" label="Ajouter" onPress={() => undefined} testID="f" /><GlassFab icon="plus" label="Ajouter" tone="glass" showLabel onPress={() => undefined} testID="g" /></>);
    expect(pressable(r, 'f').props.accessibilityLabel).toBe('Ajouter');
    expect(has(r, 'f-material')).toBe(false);
    expect(has(r, 'g-material')).toBe(true);
    expect(texts(r).filter((x) => x === 'Ajouter').length).toBe(1);
  });
});

describe('GlassCard, GlassToolCard', () => {
  it('carte d’outil : nom, description multi-lignes, pastille de profil ; étoile = bouton FRÈRE avec son propre nom', async () => {
    const onPress = jest.fn();
    const onFav = jest.fn();
    const r = await render(<GlassToolCard title="Biberons" description="Notez chaque prise." profile="Léa" icon="droplet" favorite={false} onToggleFavorite={onFav} onPress={onPress} testID="t" />);
    const card = pressable(r, 't');
    expect(card.props.accessibilityLabel).toBe('Biberons. Notez chaque prise.. Léa');
    expect(texts(r)).toEqual(expect.arrayContaining(['Biberons', 'Notez chaque prise.', 'Léa']));
    const star = pressable(r, 't-star');
    expect(star.props.accessibilityLabel).toBe('Ajouter aux favoris');
    // l'étoile n'est pas un descendant de la carte pressable
    expect(card.findAll((n) => n.props.testID === 't-star').length).toBe(0);
    await act(async () => { star.props.onPress(); });
    expect(onFav).toHaveBeenCalledWith(true);
    expect(onPress).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).toHaveBeenCalled();
  });
  it('favori actif : libellé « Retirer », état sélectionné ; sans `favorite` : pas d’étoile', async () => {
    const r = await render(<><GlassToolCard title="A" favorite onToggleFavorite={() => undefined} onPress={() => undefined} testID="a" /><GlassToolCard title="B" onPress={() => undefined} testID="b" /></>);
    expect(pressable(r, 'a-star').props.accessibilityLabel).toBe('Retirer des favoris');
    expect(pressable(r, 'a-star').props.accessibilityState.selected).toBe(true);
    expect(has(r, 'b-star')).toBe(false);
  });
  it('au toucher : compression + ombre qui évolue (repos → contact, par fondu de deux calques)', async () => {
    const r = await render(<GlassToolCard title="A" onPress={() => undefined} testID="t" />);
    expect(styleOf(one(r, 'glass-shadow-rest')).opacity).toBe(1);
    expect(styleOf(one(r, 'glass-shadow-pressed')).opacity).toBe(0);
    await act(async () => { pressable(r, 't').props.onPressIn({}); jest.advanceTimersByTime(600); });
    expect(styleOf(one(r, 'glass-shadow-rest')).opacity).toBeCloseTo(0, 1);
    expect(styleOf(one(r, 'glass-shadow-pressed')).opacity).toBeCloseTo(1, 1);
    expect((styleOf(one(r, 't-surface')).transform as { scale: number }[])[0].scale).toBeCloseTo(0.97, 2);
  });
  it('désactivée ; squelette annoncé une fois ; GlassCard simple ou pressable', async () => {
    const r = await render(<><GlassToolCard title="A" disabled onPress={() => undefined} testID="t" /><GlassToolCardSkeleton testID="s" /><GlassCard testID="c"><View /></GlassCard><GlassCard testID="cp" onPress={() => undefined} accessibilityLabel="Ouvrir"><View /></GlassCard></>);
    expect(pressable(r, 't').props.disabled).toBe(true);
    expect(r.root.findAll((n) => n.props.accessibilityRole === 'progressbar' && typeof n.type === 'string').length).toBe(1);
    expect(has(r, 's-material')).toBe(true);
    expect(has(r, 'c-material')).toBe(true);
    expect(pressable(r, 'cp').props.accessibilityRole).toBe('button');
  });
});

describe('GlassTabBar', () => {
  const tabs = [{ key: 'a', label: 'Aujourd’hui', icon: 'sun' as const }, { key: 'b', label: 'Moi', icon: 'user' as const }, { key: 'c', label: 'Enfant', icon: 'smile' as const }, { key: 'd', label: 'Famille', icon: 'users' as const }];
  function Bar({ onChange = () => undefined, activeKey = 'a' }: { onChange?: (k: string) => void; activeKey?: string }) {
    return <GlassTabBar tabs={tabs} activeKey={activeKey} onChange={onChange} bottomInset={34} center={<View testID="center-slot" />} centerAfter={2} testID="bar" />;
  }
  it('rôles (tablist / tab), onglet actif annoncé, emplacement central au milieu, zone sûre du bas', async () => {
    const r = await render(<Bar />);
    expect(r.root.findAll((n) => n.props.accessibilityRole === 'tablist' && typeof n.type === 'string').length).toBe(1);
    expect(pressable(r, 'glass-tab-a').props.accessibilityState.selected).toBe(true);
    expect(pressable(r, 'glass-tab-b').props.accessibilityState.selected).toBe(false);
    const order = r.root.findAll((n) => typeof n.type === 'string' && /^(glass-tab-|center-slot)/.test(String(n.props.testID ?? ''))).map((n) => n.props.testID);
    expect(order).toEqual(['glass-tab-a', 'glass-tab-b', 'center-slot', 'glass-tab-c', 'glass-tab-d']);
    const pad = Object.assign({}, ...[one(r, 'bar').props.style].flat(4).filter(Boolean)) as Record<string, number>;
    expect(pad.paddingBottom).toBe(34);
  });
  it('l’indicateur se DÉPLACE vers l’onglet actif (ressort), haptique « sélection » au changement', async () => {
    const onChange = jest.fn();
    const r = await render(<Bar onChange={onChange} />);
    await act(async () => { tabs.forEach((t, i) => pressable(r, `glass-tab-${t.key}`).props.onLayout(layout(i * 80 + (i > 1 ? 60 : 0), 80))); });
    await frame();
    const at = () => (styleOf(one(r, 'bar-indicator')).transform as { translateX: number }[])[0].translateX;
    expect(at()).toBe(0);
    expect(styleOf(one(r, 'bar-indicator')).width).toBe(80);
    await act(async () => { pressable(r, 'glass-tab-c').props.onPress(); });
    expect(onChange).toHaveBeenCalledWith('c');
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    await act(async () => { r.update(<ThemeProvider><Bar activeKey="c" /></ThemeProvider>); });
    await act(async () => { jest.advanceTimersByTime(32); });
    const mid = at();
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(220);
    await act(async () => { jest.advanceTimersByTime(1500); });
    expect(at()).toBeCloseTo(220, 0);
  });
  it('Réduire les animations : l’indicateur est posé tout de suite sur le nouvel onglet', async () => {
    reduceMotion = true;
    const r = await render(<Bar />);
    await act(async () => { tabs.forEach((t, i) => pressable(r, `glass-tab-${t.key}`).props.onLayout(layout(i * 80, 80))); });
    await act(async () => { r.update(<ThemeProvider><Bar activeKey="d" /></ThemeProvider>); });
    await frame();
    expect((styleOf(one(r, 'bar-indicator')).transform as { translateX: number }[])[0].translateX).toBe(240);
  });
  it('icônes seules : libellés non affichés, noms toujours annoncés ; cibles ≥ 44 pt', async () => {
    const r = await render(<GlassTabBar tabs={tabs} activeKey="a" onChange={() => undefined} iconsOnly testID="bar" />);
    expect(texts(r)).not.toContain('Moi');
    expect(pressable(r, 'glass-tab-b').props.accessibilityLabel).toBe('Moi');
    const s = Object.assign({}, ...[pressable(r, 'glass-tab-b').props.style].flat(4).filter(Boolean)) as Record<string, number>;
    expect(s.height).toBeGreaterThanOrEqual(44);
    expect(s.minWidth).toBeGreaterThanOrEqual(44);
  });
});

describe('GlassSegmentedControl, GlassProfileSwitcher, GlassSearchBar', () => {
  it('segmenté : radiogroup / radio, choix annoncé, indicateur qui glisse, pas de rappel sur le choix déjà actif', async () => {
    const onChange = jest.fn();
    const opts = [{ value: 'j', label: 'Jour' }, { value: 's', label: 'Semaine' }];
    const r = await render(<GlassSegmentedControl options={opts} value="j" onChange={onChange} label="Période" testID="seg" />);
    expect(r.root.findAll((n) => n.props.accessibilityRole === 'radiogroup' && typeof n.type === 'string')[0].props.accessibilityLabel).toBe('Période');
    expect(pressable(r, 'seg-j').props.accessibilityState.checked).toBe(true);
    await act(async () => { pressable(r, 'seg-j').props.onPress(); pressable(r, 'seg-s').props.onPress(); });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('s');
    await act(async () => { pressable(r, 'seg-j').props.onLayout(layout(0, 120)); pressable(r, 'seg-s').props.onLayout(layout(120, 120)); });
    await frame();
    expect(styleOf(one(r, 'seg-indicator')).width).toBe(120);
  });
  it('profils : composant de présentation piloté par props, anneau UNIQUE qui glisse, « ajouter » facultatif', async () => {
    const onChange = jest.fn();
    const onAdd = jest.fn();
    const profiles = [{ key: 'me', label: 'Moi', avatar: <View /> }, { key: 'lea', label: 'Léa', accessibilityLabel: 'Léa, 8 mois', avatar: <View /> }];
    const El = (k: string) => <ThemeProvider><GlassProfileSwitcher profiles={profiles} activeKey={k} onChange={onChange} onAdd={onAdd} addLabel="Ajouter" testID="ps" /></ThemeProvider>;
    reduceMotion = true;
    const r = await render(<GlassProfileSwitcher profiles={profiles} activeKey="me" onChange={onChange} onAdd={onAdd} addLabel="Ajouter" testID="ps" />);
    expect(host(r, 'ps-ring').length).toBe(1);
    expect(pressable(r, 'ps-lea').props.accessibilityLabel).toBe('Léa, 8 mois');
    expect(pressable(r, 'ps-me').props.accessibilityState.selected).toBe(true);
    await act(async () => { pressable(r, 'ps-me').props.onLayout(layout(8, 68)); pressable(r, 'ps-lea').props.onLayout(layout(76, 68)); });
    await act(async () => { pressable(r, 'ps-lea').props.onPress(); pressable(r, 'ps-add').props.onPress(); });
    expect(onChange).toHaveBeenCalledWith('lea');
    expect(onAdd).toHaveBeenCalled();
    await act(async () => { r.update(El('lea')); });
    await frame();
    expect((styleOf(one(r, 'ps-ring')).transform as { translateX: number }[])[0].translateX).toBe(76);
  });
  it('recherche : nom accessible, focus (anneau), bouton effacer seulement quand il y a du texte', async () => {
    const onChange = jest.fn();
    reduceMotion = true;
    const r = await render(<GlassSearchBar value="" onChangeText={onChange} testID="q" />);
    const input = one(r, 'q-input');
    expect(input.props.accessibilityLabel).toBe('Rechercher');
    expect(pressable(r, 'q-clear').props.disabled).toBe(true);
    expect(styleOf(one(r, 'q-focus')).opacity).toBe(0);
    await act(async () => { input.props.onFocus({}); });
    await frame();
    expect(styleOf(one(r, 'q-focus')).opacity).toBe(1);
    await act(async () => { r.update(<ThemeProvider><GlassSearchBar value="bib" onChangeText={onChange} testID="q" /></ThemeProvider>); });
    const clear = pressable(r, 'q-clear');
    expect(clear.props.disabled).toBe(false);
    expect(clear.props.accessibilityLabel).toBe('Effacer la recherche');
    expect(28 + 2 * clear.props.hitSlop).toBeGreaterThanOrEqual(44);
    await act(async () => { clear.props.onPress(); });
    expect(onChange).toHaveBeenCalledWith('');
  });
});

describe('GlassMenu, GlassModal, GlassSheet, GlassToast', () => {
  it('menu : rôle menu / menuitem, rangées ≥ 44 pt, choisir ferme puis agit, l’extérieur ferme', async () => {
    const onClose = jest.fn();
    const act1 = jest.fn();
    const items = [{ key: 'e', label: 'Modifier', onPress: act1 }, { key: 'd', label: 'Supprimer', destructive: true, onPress: jest.fn() }, { key: 'x', label: 'Indisponible', disabled: true, onPress: jest.fn() }];
    const r = await render(<GlassMenu visible onClose={onClose} items={items} testID="m" />);
    expect(one(r, 'm').props.accessibilityRole).toBe('menu');
    expect(pressable(r, 'm-e').props.accessibilityRole).toBe('menuitem');
    expect(pressable(r, 'm-x').props.disabled).toBe(true);
    expect(has(r, 'm-glass-material')).toBe(true);
    await act(async () => { pressable(r, 'm-e').props.onPress(); });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(act1).toHaveBeenCalledTimes(1);
    await act(async () => { pressable(r, 'm-backdrop').props.onPress(); });
    expect(onClose).toHaveBeenCalledTimes(2);
    const closed = await render(<GlassMenu visible={false} onClose={onClose} items={items} testID="m2" />);
    expect(has(closed, 'm2')).toBe(false);
  });
  it('position du menu : sous l’ancre, au-dessus si la place manque, jamais hors de l’écran', () => {
    const win = { width: 390, height: 844 };
    const below = menuPosition({ x: 16, y: 100, width: 120, height: 44 }, win, 3);
    expect(below.top).toBe(150);
    expect(below.left).toBe(16);
    const above = menuPosition({ x: 300, y: 780, width: 60, height: 44 }, win, 4);
    expect(above.originY).toBe('bottom');
    expect(above.top).toBeLessThan(780);
    expect(above.left + 248).toBeLessThanOrEqual(390 - 12);
    expect(menuPosition(null, win, 2).left).toBe((390 - 248) / 2);
  });
  it('fenêtre : titre (en-tête), message, actions ; voile fermant (ou non) ; verre « sheet »', async () => {
    const onClose = jest.fn();
    const ok = jest.fn();
    const r = await render(<GlassModal visible onClose={onClose} title="Retirer ?" message="Vous pourrez le remettre." actions={[{ label: 'Annuler', onPress: onClose, testID: 'no' }, { label: 'Retirer', variant: 'destructive', onPress: ok, testID: 'yes' }]} testID="w" />);
    expect(texts(r)).toEqual(expect.arrayContaining(['Retirer ?', 'Vous pourrez le remettre.', 'Annuler', 'Retirer']));
    expect(one(r, 'w').props.accessibilityViewIsModal).toBe(true);
    expect(has(r, 'w-glass-material')).toBe(true);
    await act(async () => { pressable(r, 'yes').props.onPress({}); pressable(r, 'w-backdrop').props.onPress(); });
    expect(ok).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    const locked = await render(<GlassModal visible onClose={onClose} title="T" dismissable={false} testID="w2" />);
    expect(pressable(locked, 'w2-backdrop').props.disabled).toBe(true);
  });
  it('Réduire les animations : fenêtre posée tout de suite à l’échelle 1', async () => {
    reduceMotion = true;
    const r = await render(<GlassModal visible onClose={() => undefined} title="T" testID="w" />);
    await frame();
    const tr = styleOf(one(r, 'w')).transform as Record<string, number>[];
    expect(tr[0].translateY).toBe(0);
    expect(tr[1].scale).toBe(1);
  });
  it('feuille : le Sheet existant (poignée, fermeture, défilement) avec un panneau de verre — et opaque si demandé', async () => {
    const r = await render(<GlassSheet visible onClose={() => undefined} title="Ajouter"><View testID="inside" /></GlassSheet>);
    for (const id of ['sheet', 'sheet-handle', 'sheet-backdrop', 'sheet-scroll', 'inside']) expect(has(r, id)).toBe(true);
    expect(has(r, 'sheet-panel-liquid')).toBe(true);
    reduceTransparency = true;
    const o = await render(<GlassSheet visible onClose={() => undefined} title="Ajouter"><View /></GlassSheet>);
    expect(has(o, 'sheet-panel-opaque')).toBe(true);
    expect(has(o, 'sheet-panel-liquid')).toBe(false);
  });
  it.each(['success', 'info', 'error'] as const)('toast %s : annoncé (alerte polie), reste 3 s puis prévient qu’il a fini', async (tone) => {
    reduceMotion = true;
    const onDone = jest.fn();
    const r = await render(<GlassToast msg="Biberon enregistré" tone={tone} onDone={onDone} />);
    const tst = one(r, 'glass-toast');
    expect(tst.props.accessibilityRole).toBe('alert');
    expect(tst.props.accessibilityLiveRegion).toBe('polite');
    expect(texts(r)).toContain('Biberon enregistré');
    // Réduire les animations : en place tout de suite
    expect((styleOf(tst).transform as { translateY: number }[])[0].translateY).toBe(0);
    await act(async () => { jest.advanceTimersByTime(2800); });
    expect(onDone).not.toHaveBeenCalled();
    await act(async () => { jest.advanceTimersByTime(300); });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  it('GlassToastProvider : même `useToast()` que l’application, vue de verre', async () => {
    let show!: ReturnType<typeof useToast>;
    const Probe = () => { show = useToast(); return null; };
    const r = await render(<GlassToastProvider><Probe /></GlassToastProvider>);
    await act(async () => { show('Enregistré', 'success'); });
    expect(has(r, 'glass-toast')).toBe(true);
    expect(has(r, 'glass-toast-glass-material')).toBe(true);
  });
});
