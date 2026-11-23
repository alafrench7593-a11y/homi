/**
 * Primitives de mouvement « Liquid Glass » (src/motion) : pression, apparition échelonnée, transition de contenu
 * partagée, déplacement d'indicateur, favori, secousse, coche, squelettes, glisser-déposer.
 * Pour chacune : le mouvement complet, et l'ÉTAT FINAL IMMÉDIAT quand « Réduire les animations » (ou l'économie
 * d'énergie) est actif.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' }, NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
let mockLowPower = false;
jest.mock('@/lib/lowPower', () => ({ useLowPower: () => mockLowPower }));

import React from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import Animated, { getAnimatedStyle } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useUiStore } from '@/lib/store';
import {
  autoScrollSpeed, ContentSwap, FavoriteStar, moveKey, reorder, ReorderList, reorderOffset, reorderOrder, reorderTotal, shake, SkeletonBone, SkeletonPulse,
  StaggerList, SuccessCheck, swap, useIndicator, usePress, useShake,
} from '@/motion';

const mounted: ReactTestRenderer[] = [];
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider>{null}</ThemeProvider>); });
  await act(async () => { r.update(<ThemeProvider>{el}</ThemeProvider>); });
  mounted.push(r);
  return r;
}
const update = (r: ReactTestRenderer, el: React.ReactElement) => act(async () => { r.update(<ThemeProvider>{el}</ThemeProvider>); });
const tick = (ms = 34) => act(async () => { jest.advanceTimersByTime(ms); });
const one = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === 'string')[0];
const readAnimatedStyle = getAnimatedStyle as unknown as (c: { props: Record<string, unknown> }) => Record<string, unknown>;
const styleOf = (n: ReactTestInstance) => readAnimatedStyle(n as unknown as { props: Record<string, unknown> });
const tr = (n: ReactTestInstance) => Object.assign({}, ...(styleOf(n).transform as object[])) as Record<string, number>;

let reduceMotion = false;
beforeEach(() => {
  jest.useFakeTimers();
  reduceMotion = false;
  mockLowPower = false;
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(() => Promise.resolve(reduceMotion));
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'light', hapticsEnabled: true }); });
  for (const f of [Haptics.impactAsync, Haptics.selectionAsync, Haptics.notificationAsync]) (f as jest.Mock).mockClear();
});
afterEach(async () => {
  await act(async () => { while (mounted.length) mounted.pop()!.unmount(); });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('pression (usePress)', () => {
  function Probe({ disabled }: { disabled?: boolean }) {
    const p = usePress({ disabled });
    return <Pressable testID="p" onPressIn={p.onPressIn} onPressOut={p.onPressOut}><Animated.View testID="s" style={p.style} /></Pressable>;
  }
  const press = (r: ReactTestRenderer) => r.root.findAll((n) => n.props.testID === 'p' && typeof n.props.onPressIn === 'function')[0];
  it('compression à 0,97 + un haptique léger au contact ; retour à 1 au relâchement', async () => {
    const r = await render(<Probe />);
    await act(async () => { press(r).props.onPressIn(); });
    await tick(600);
    expect(tr(one(r, 's')).scale).toBeCloseTo(0.97, 2);
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    await act(async () => { press(r).props.onPressOut(); });
    await tick(900);
    expect(tr(one(r, 's')).scale).toBeCloseTo(1, 2);
  });
  it.each([['Réduire les animations', true, false], ['économie d’énergie', false, true]])('%s : aucune échelle', async (_n, rm, lp) => {
    reduceMotion = rm; mockLowPower = lp;
    const r = await render(<Probe />);
    await act(async () => { press(r).props.onPressIn(); });
    await tick();
    expect(tr(one(r, 's')).scale).toBe(1);
  });
  it('désactivé : ni mouvement ni haptique', async () => {
    const r = await render(<Probe disabled />);
    await act(async () => { press(r).props.onPressIn(); });
    await tick(300);
    expect(tr(one(r, 's')).scale).toBe(1);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});

describe('apparition échelonnée (StaggerList)', () => {
  const list = <StaggerList gap={8}><View key="a" testID="a" /><View key="b" testID="b" /><View key="c" testID="c" /></StaggerList>;
  it('les rangs entrent l’un après l’autre, puis tout est posé', async () => {
    const r = await render(list);
    const nodes = r.root.findAll((n) => typeof n.type === 'string' && n.props.jestAnimatedStyle !== undefined);
    expect(nodes.length).toBe(3);
    await tick(120);
    const [o0, , o2] = nodes.map((n) => Number(styleOf(n).opacity));
    expect(o0).toBeGreaterThan(o2);
    await tick(1500);
    for (const n of nodes) { expect(styleOf(n).opacity).toBe(1); expect(tr(n).translateY).toBe(0); }
  });
  it('Réduire les animations : tout est visible d’emblée, sans décalage', async () => {
    reduceMotion = true;
    const r = await render(list);
    for (const n of r.root.findAll((x) => typeof x.type === 'string' && x.props.jestAnimatedStyle !== undefined)) { expect(styleOf(n).opacity).toBe(1); expect(tr(n).translateY).toBe(0); }
  });
});

describe('transition de contenu partagée (ContentSwap)', () => {
  const el = (k: string) => <ContentSwap swapKey={k} testID="swap"><Text>{`profil ${k}`}</Text></ContentSwap>;
  const shown = (r: ReactTestRenderer) => r.root.findAllByType(Text).map((n) => n.props.children).join('|');
  it('l’ancien contenu sort (il reste affiché), puis le nouveau entre : un seul mouvement coordonné', async () => {
    const r = await render(el('lea'));
    await update(r, el('noe'));
    expect(shown(r)).toBe('profil lea');
    await tick(swap.outMs / 2);
    expect(Number(styleOf(one(r, 'swap')).opacity)).toBeLessThan(1);
    await tick(swap.outMs);
    expect(shown(r)).toBe('profil noe');
    await tick(swap.inMs + 100);
    expect(styleOf(one(r, 'swap')).opacity).toBe(1);
    expect(tr(one(r, 'swap')).translateY).toBe(0);
  });
  it('Réduire les animations : échange immédiat, pleinement visible', async () => {
    reduceMotion = true;
    const r = await render(el('lea'));
    await update(r, el('noe'));
    expect(shown(r)).toBe('profil noe');
    expect(styleOf(one(r, 'swap')).opacity).toBe(1);
  });
  it('le contenu d’une même clé se met à jour sans transition', async () => {
    const r = await render(<ContentSwap swapKey="a" testID="swap"><Text>un</Text></ContentSwap>);
    await update(r, <ContentSwap swapKey="a" testID="swap"><Text>deux</Text></ContentSwap>);
    expect(shown(r)).toBe('deux');
    expect(styleOf(one(r, 'swap')).opacity).toBe(1);
  });
});

describe('déplacement d’indicateur (useIndicator)', () => {
  function Probe({ x, width }: { x?: number; width?: number }) {
    const style = useIndicator(x === undefined || width === undefined ? undefined : { x, width });
    return <Animated.View testID="i" style={style} />;
  }
  it('invisible tant que rien n’est mesuré ; première pose sans trajet ; ensuite il glisse', async () => {
    const r = await render(<Probe />);
    expect(styleOf(one(r, 'i')).opacity).toBe(0);
    await update(r, <Probe x={40} width={90} />);
    await tick();
    expect(styleOf(one(r, 'i')).opacity).toBe(1);
    expect(tr(one(r, 'i')).translateX).toBe(40);
    await update(r, <Probe x={240} width={60} />);
    await tick();
    expect(tr(one(r, 'i')).translateX).toBeGreaterThan(40);
    expect(tr(one(r, 'i')).translateX).toBeLessThan(240);
    await tick(1500);
    expect(tr(one(r, 'i')).translateX).toBeCloseTo(240, 0);
    expect(Number(styleOf(one(r, 'i')).width)).toBeCloseTo(60, 0);
  });
  it('Réduire les animations : posé tout de suite', async () => {
    reduceMotion = true;
    const r = await render(<Probe x={40} width={90} />);
    await update(r, <Probe x={240} width={60} />);
    await tick();
    expect(tr(one(r, 'i')).translateX).toBe(240);
    expect(styleOf(one(r, 'i')).width).toBe(60);
  });
});

describe('favori (FavoriteStar)', () => {
  const el = (active: boolean, onToggle = jest.fn()) => <FavoriteStar active={active} onToggle={onToggle} labelOn="Retirer des favoris" labelOff="Ajouter aux favoris" testID="star" />;
  const btn = (r: ReactTestRenderer) => r.root.findAll((n) => n.props.testID === 'star' && typeof n.props.onPress === 'function')[0];
  it('bascule + haptique « sélection » ; libellé selon l’état ; cible ≥ 44 pt', async () => {
    const onToggle = jest.fn();
    const r = await render(el(false, onToggle));
    expect(btn(r).props.accessibilityLabel).toBe('Ajouter aux favoris');
    const s = Object.assign({}, ...[one(r, 'star').props.style].flat(4).filter(Boolean)) as Record<string, number>;
    expect(s.width + 2 * btn(r).props.hitSlop).toBeGreaterThanOrEqual(44);
    await act(async () => { btn(r).props.onPress(); });
    expect(onToggle).toHaveBeenCalledWith(true);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });
  it('quand la donnée passe à « favori » : une onde part du centre puis s’éteint', async () => {
    const r = await render(el(false));
    expect(styleOf(one(r, 'star-ring')).opacity).toBe(0);
    await update(r, el(true));
    await tick(120);
    expect(Number(styleOf(one(r, 'star-ring')).opacity)).toBeGreaterThan(0);
    await tick(1200);
    expect(styleOf(one(r, 'star-ring')).opacity).toBe(0);
  });
  it('Réduire les animations : aucune onde, aucun saut', async () => {
    reduceMotion = true;
    const r = await render(el(false));
    await update(r, el(true));
    await tick(120);
    expect(styleOf(one(r, 'star-ring')).opacity).toBe(0);
  });
});

describe('secousse d’erreur (useShake)', () => {
  let go!: () => void;
  function Probe() { const s = useShake(); go = s.shake; return <Animated.View testID="f" style={s.style} />; }
  it('tremble puis revient exactement à sa place ; haptique « erreur »', async () => {
    const r = await render(<Probe />);
    await act(async () => { go(); });
    await tick(shake.stepMs);
    expect(Math.abs(tr(one(r, 'f')).translateX)).toBeGreaterThan(1);
    await tick(shake.stepMs * shake.steps.length + 100);
    expect(tr(one(r, 'f')).translateX).toBe(0);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
  });
  it('Réduire les animations : aucun déplacement (le message d’erreur suffit)', async () => {
    reduceMotion = true;
    const r = await render(<Probe />);
    await act(async () => { go(); });
    await tick(shake.stepMs);
    expect(tr(one(r, 'f')).translateX).toBe(0);
  });
});

describe('coche de succès, squelettes', () => {
  it('coche : apparaît en ressort puis reste posée ; Réduire les animations : complète tout de suite', async () => {
    const r = await render(<SuccessCheck visible={false} testID="c" />);
    expect(styleOf(one(r, 'c')).opacity).toBe(0);
    await update(r, <SuccessCheck visible testID="c" haptic />);
    await tick(900);
    expect(styleOf(one(r, 'c')).opacity).toBe(1);
    expect(tr(one(r, 'c')).scale).toBeCloseTo(1, 2);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    reduceMotion = true;
    const q = await render(<SuccessCheck visible={false} testID="c2" />);
    await update(q, <SuccessCheck visible testID="c2" />);
    await tick();
    expect(tr(one(q, 'c2')).scale).toBe(1);
  });
  it('squelette : annoncé une fois, il respire ; Réduire les animations ou économie d’énergie : immobile', async () => {
    const r = await render(<SkeletonPulse label="Chargement" testID="sk"><SkeletonBone /><SkeletonBone width="60%" /></SkeletonPulse>);
    expect(one(r, 'sk').props.accessibilityRole).toBe('progressbar');
    expect(one(r, 'sk').props.accessibilityLabel).toBe('Chargement');
    await tick(600);
    expect(Number(styleOf(one(r, 'sk')).opacity)).toBeLessThan(1);
    mockLowPower = true;
    const q = await render(<SkeletonPulse label="Chargement" testID="sk2"><SkeletonBone /></SkeletonPulse>);
    await tick(600);
    expect(styleOf(one(q, 'sk2')).opacity).toBe(1);
  });
});

describe('glisser-déposer : logique pure (worklets)', () => {
  const H = { a: 50, b: 80, c: 50, d: 60 };
  const order = ['a', 'b', 'c', 'd'];
  it('places et hauteur totale, hauteurs variables et espacement compris', () => {
    expect(reorderOffset(order, H, 10, 'a')).toBe(0);
    expect(reorderOffset(order, H, 10, 'c')).toBe(50 + 10 + 80 + 10);
    expect(reorderTotal(order, H, 10)).toBe(50 + 80 + 50 + 60 + 30);
  });
  it('le rang change quand le milieu de la carte dépasse le milieu d’une voisine — dans les deux sens, sans oscillation', () => {
    // « a » tenue : immobile → même tableau (aucun haptique)
    expect(reorderOrder(order, H, 10, 'a', 0)).toBe(order);
    // milieu de « b » sans « a » : 40 ; milieu de « a » = top + 25
    expect(reorderOrder(order, H, 10, 'a', 14)).toBe(order);
    expect(reorderOrder(order, H, 10, 'a', 16)).toEqual(['b', 'a', 'c', 'd']);
    const moved = ['b', 'a', 'c', 'd'];
    // même position du doigt, nouvel ordre : stable
    expect(reorderOrder(moved, H, 10, 'a', 16)).toBe(moved);
    expect(reorderOrder(moved, H, 10, 'a', 14)).toEqual(order);
    // geste rapide : plusieurs rangs d'un coup
    expect(reorderOrder(order, H, 10, 'a', 400)).toEqual(['b', 'c', 'd', 'a']);
    expect(reorderOrder(order, H, 10, 'd', -40)).toEqual(['d', 'a', 'b', 'c']);
    expect(reorderOrder(order, H, 10, 'zz', 0)).toBe(order);
  });
  it('défilement automatique : nul au centre, proportionnel près des bords, plafonné', () => {
    const { edge, maxSpeed } = reorder;
    expect(autoScrollSpeed(400, 100, 600, edge, maxSpeed)).toBe(0);
    expect(autoScrollSpeed(100, 100, 600, edge, maxSpeed)).toBe(-maxSpeed);
    expect(autoScrollSpeed(100 + edge / 2, 100, 600, edge, maxSpeed)).toBeCloseTo(-maxSpeed / 2);
    expect(autoScrollSpeed(700, 100, 600, edge, maxSpeed)).toBe(maxSpeed);
    expect(autoScrollSpeed(900, 100, 600, edge, maxSpeed)).toBe(maxSpeed);
    expect(autoScrollSpeed(700 - edge / 4, 100, 600, edge, maxSpeed)).toBeCloseTo(maxSpeed * 0.75);
    expect(autoScrollSpeed(300, 0, 0, edge, maxSpeed)).toBe(0);
  });
  it('actions d’accessibilité : monter / descendre d’un rang, bornées', () => {
    expect(moveKey(order, 'b', -1)).toEqual(['b', 'a', 'c', 'd']);
    expect(moveKey(order, 'b', 1)).toEqual(['a', 'c', 'b', 'd']);
    expect(moveKey(order, 'a', -1)).toBe(order);
    expect(moveKey(order, 'd', 1)).toBe(order);
  });
});

describe('glisser-déposer : composant (ReorderList)', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const infos: Record<string, { moveUp: () => void; moveDown: () => void; a11y: { accessibilityActions: { name: string; label: string }[]; onAccessibilityAction: (e: never) => void } }> = {};
  const list = (data: { id: string }[], onReorder: (k: string[]) => void) => (
    <GestureHandlerRootView>
      <ReorderList data={data} keyOf={(i) => i.id} gap={10} onReorder={onReorder} moveUpLabel="Monter" moveDownLabel="Descendre" testID="list"
        renderItem={(item, info) => { infos[item.id] = info; return <View testID={`item-${item.id}`} style={{ height: 50 }} />; }} />
    </GestureHandlerRootView>
  );
  const measure = (r: ReactTestRenderer) => act(async () => { for (const k of ['a', 'b', 'c']) one(r, `reorder-row-${k}`).props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 50 } } }); });
  const flat = (n: ReactTestInstance) => Object.assign({}, ...[n.props.style].flat(4).filter(Boolean)) as Record<string, number>;

  it('une fois les lignes mesurées : hauteur du conteneur connue, chaque ligne à sa place, sans trajet au montage', async () => {
    const r = await render(list(items, jest.fn()));
    expect(flat(one(r, 'list')).opacity).toBe(0);
    await measure(r);
    await tick();
    expect(flat(one(r, 'list')).height).toBe(170);
    expect(flat(one(r, 'list')).opacity).toBe(1);
    expect(['a', 'b', 'c'].map((k) => tr(one(r, `reorder-row-${k}`)).translateY)).toEqual([0, 60, 120]);
  });
  it('lecteurs d’écran : actions « Monter » / « Descendre » → onReorder (un haptique), bornées aux extrémités', async () => {
    const onReorder = jest.fn();
    const r = await render(list(items, onReorder));
    await measure(r);
    expect(infos.b.a11y.accessibilityActions.map((a) => a.label)).toEqual(['Monter', 'Descendre']);
    await act(async () => { infos.b.a11y.onAccessibilityAction({ nativeEvent: { actionName: 'moveUp' } } as never); });
    expect(onReorder).toHaveBeenLastCalledWith(['b', 'a', 'c']);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    await act(async () => { infos.a.moveUp(); infos.c.moveDown(); });
    expect(onReorder).toHaveBeenCalledTimes(1);
  });
  it('quand `data` change d’ordre, les lignes rejoignent leur nouvelle place (ressort) — immédiatement avec Réduire les animations', async () => {
    const r = await render(list(items, jest.fn()));
    await measure(r);
    await tick(60);
    await update(r, list([items[1], items[0], items[2]], jest.fn()));
    await tick();
    const mid = tr(one(r, 'reorder-row-a')).translateY;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(60);
    await tick(1500);
    expect(['a', 'b', 'c'].map((k) => Math.round(tr(one(r, `reorder-row-${k}`)).translateY))).toEqual([60, 0, 120]);

    reduceMotion = true;
    const q = await render(list(items, jest.fn()));
    await measure(q);
    await tick(60);
    await update(q, list([items[2], items[0], items[1]], jest.fn()));
    await tick();
    expect(['a', 'b', 'c'].map((k) => tr(one(q, `reorder-row-${k}`)).translateY)).toEqual([60, 120, 0]);
  });
});
