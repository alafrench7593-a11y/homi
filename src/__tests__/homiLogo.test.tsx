/**
 * Logo HOMI v5 « maison » (retour à la maison, la lentille v4 est abandonnée) : tracés identiques entre l'application
 * et les fichiers SVG, chorégraphie du logo animé (tracé → illumination → parent, parent, enfant, enfant → nom →
 * panneau), Réduire les animations = état final, rappel de panneau (mesure de la maison), version fixe en petit format.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
let mockLowPower = false;
jest.mock('@/lib/lowPower', () => ({ useLowPower: () => mockLowPower }));

import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { getAnimatedStyle, makeMutable } from 'react-native-reanimated';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useUiStore } from '@/lib/store';
import { HOMI_FAMILY, HOMI_HOUSE_BOX, HOMI_HOUSE_PATH, HOMI_MARK_SVG } from '@/brand/homiMarkSvg';
import {
  backOut, housePanelFrame, housePanelPath, LOGO_MOTION, logoBox, logoTimeline, stageProgress, type HouseMeasure, type HousePanelTarget,
} from '@/brand/logoMotion';
import { HomiLogoAnimated, houseMeasureAt, lensMeasureAt } from '@/components/HomiLogoAnimated';
import { BrandLogo, BrandStack, BrandWordmark } from '@/components/BrandLogo';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, e: string): string; existsSync(p: string): boolean };

const mounted: ReactTestRenderer[] = [];
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider>{el}</ThemeProvider>); });
  mounted.push(r);
  return r;
}
const readAnimatedStyle = getAnimatedStyle as unknown as (c: { props: Record<string, unknown> }) => Record<string, unknown>;
const styleOf = (n: ReactTestInstance) => readAnimatedStyle(n as unknown as { props: Record<string, unknown> });
const byTestId = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === 'string')[0] as ReactTestInstance | undefined;
const layout = async (n: ReactTestInstance) => { await act(async () => { n.props.onLayout?.({ nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 100 } } }); }); };
const TARGET: HousePanelTarget = { x: 24, y: 400, width: 342, height: 120, radius: 24, fill: '#FFFFFF', edge: '#DDDDDD' };

beforeEach(() => {
  jest.useFakeTimers();
  mockLowPower = false;
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'light', cinematicSeen: true }); });
});
afterEach(async () => {
  await act(async () => { while (mounted.length) mounted.pop()!.unmount(); });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('logo maison : une seule source de tracés', () => {
  it('les SVG livrés (assets/brand) sont exactement ceux de l’application', () => {
    for (const tone of ['light', 'dark', 'mono'] as const) {
      expect(fs.readFileSync(`assets/brand/homi-mark-${tone}.svg`, 'utf8')).toBe(HOMI_MARK_SVG[tone]);
    }
    expect(fs.readFileSync('assets/brand/homi-mark.svg', 'utf8')).toBe(HOMI_MARK_SVG.light);
  });
  it('maison + deux parents + deux enfants partout (marque, monochrome, icône), aucune police', () => {
    const all = [...Object.values(HOMI_MARK_SVG), fs.readFileSync('assets/brand/homi-app-icon.svg', 'utf8')];
    for (const svg of all) {
      expect(svg).not.toMatch(/<text|font-family/);
      expect(svg).toContain(HOMI_HOUSE_PATH);
      for (const f of HOMI_FAMILY) expect(svg).toContain(f.bodyD);
    }
    expect(HOMI_FAMILY.map((f) => f.role)).toEqual(['parent', 'parent', 'child', 'child']);
  });
  it('logotype « lentille » abandonné : ses fichiers sont retirés', () => {
    for (const tone of ['light', 'dark', 'mono']) {
      expect(fs.existsSync(`assets/brand/homi-wordmark-${tone}.svg`)).toBe(false);
      expect(fs.existsSync(`assets/brand/homi-sign-${tone}.svg`)).toBe(false);
    }
    expect(fs.existsSync('assets/brand/explorations')).toBe(false);
  });
});

describe('chorégraphie du logo (pure)', () => {
  it('tracé → illumination → parent, parent, enfant, enfant → nom → déploiement, ≤ 2,5 s', () => {
    const tl = logoTimeline('full', true);
    expect(tl.light[0]).toBeGreaterThan(tl.trace[0]);
    expect(tl.figures).toHaveLength(4);
    expect(tl.figures[0][0]).toBeGreaterThan(tl.light[0]);
    for (let i = 1; i < 4; i++) expect(tl.figures[i][0]).toBeGreaterThan(tl.figures[i - 1][0]);
    expect(tl.name[0]).toBeGreaterThan(tl.figures[0][0]);
    expect(tl.deploy![0]).toBeGreaterThanOrEqual(tl.open);
    expect(tl.end).toBe(tl.deploy![0] + tl.deploy![1]);
    expect(tl.end).toBeLessThanOrEqual(2500);
    expect(logoTimeline('full').deploy).toBeNull();
    expect(logoTimeline('full').end).toBe(logoTimeline('full').open);
  });
  it('léger rebond des silhouettes : dépassement < 15 %, arrivée exacte', () => {
    const peak = Math.max(...Array.from({ length: 101 }, (_, i) => backOut(i / 100)));
    expect(peak).toBeGreaterThan(1.03);
    expect(peak).toBeLessThan(1.15);
    expect(backOut(1)).toBe(1);
    expect(backOut(0)).toBe(0);
  });
  it('nuit : tout en fondu court, aucun tracé ni rebond', () => {
    const tl = logoTimeline('minimal', true);
    expect(stageProgress(0, tl.trace)).toBe(1);
    expect(tl.figures.every((s) => stageProgress(0, s) === 1)).toBe(true);
    expect(stageProgress(0, tl.name)).toBe(1);
    expect(tl.end).toBeLessThanOrEqual(LOGO_MOTION.minimalFadeMs);
  });
  it('mesure de la maison : boîte du dessin dans la composition (maison centrée en haut)', () => {
    const b = logoBox(300);
    const h = houseMeasureAt({ x: 10, y: 20 }, 300);
    const k = b.house.size / 256;
    expect(h.x).toBeCloseTo(10 + b.house.left + HOMI_HOUSE_BOX.x * k, 5);
    expect(h.y).toBeCloseTo(20 + HOMI_HOUSE_BOX.y * k, 5);
    expect(h.width).toBeCloseTo(HOMI_HOUSE_BOX.width * k, 5);
    expect(h.cx).toBeCloseTo(10 + 150, 0); // centrée
    expect(lensMeasureAt).toBe(houseMeasureAt); // alias rétro-compatible
  });
  it('panneau : part exactement de la maison (toit en pignon) et arrive sur la cible (toit aplati)', () => {
    const house = houseMeasureAt({ x: 0, y: 0 }, 300);
    const f0 = housePanelFrame(house, TARGET, 0);
    expect(f0).toMatchObject({ x: house.x, y: house.y, width: house.width, height: house.height });
    expect(f0.roof).toBeGreaterThan(0);
    const f1 = housePanelFrame(house, TARGET, 1);
    expect(f1).toEqual({ x: TARGET.x, y: TARGET.y, width: TARGET.width, height: TARGET.height, rx: TARGET.radius, roof: 0, eave: TARGET.radius });
    // à l'arrivée : rectangle arrondi (le haut est une droite y = TARGET.y, angle haut droit arrondi)
    expect(housePanelPath(f1)).toContain(`L${TARGET.x + TARGET.width - TARGET.radius} ${TARGET.y} Q${TARGET.x + TARGET.width} ${TARGET.y} ${TARGET.x + TARGET.width} ${TARGET.y + TARGET.radius}`);
  });
});

describe('HomiLogoAnimated', () => {
  it('mouvement complet : maison éteinte → illuminée, famille en cascade, nom, puis la maison s’ouvre en panneau', async () => {
    const onHousePanel = jest.fn();
    const onDone = jest.fn();
    const panel = makeMutable(0);
    const tl = logoTimeline('full', true);
    const r = await render(<HomiLogoAnimated width={300} deployTo={TARGET} panel={panel} onHousePanel={onHousePanel} onDone={onDone} />);
    await layout(byTestId(r, 'homi-logo')!);
    expect(styleOf(byTestId(r, 'homi-logo-fill')!).opacity).toBe(0);
    expect(styleOf(byTestId(r, 'homi-logo-figure-0')!).opacity).toBe(0);
    // premier parent arrivé, dernier enfant pas encore
    const t1 = tl.figures[0][0] + tl.figures[0][1] + 10;
    await act(async () => { jest.advanceTimersByTime(t1); });
    expect(styleOf(byTestId(r, 'homi-logo-figure-0')!).opacity).toBeCloseTo(1, 4);
    expect(styleOf(byTestId(r, 'homi-logo-figure-3')!).opacity as number).toBeLessThan(1);
    expect(onHousePanel).not.toHaveBeenCalled();
    await act(async () => { jest.advanceTimersByTime(tl.deploy![0] - t1 - 30); });
    expect(styleOf(byTestId(r, 'homi-logo-fill')!).opacity).toBeCloseTo(1, 4);
    expect(styleOf(byTestId(r, 'homi-logo-figure-3')!).opacity).toBeCloseTo(1, 4);
    expect(styleOf(byTestId(r, 'homi-logo-name')!).opacity).toBeCloseTo(1, 4);
    expect(onHousePanel).not.toHaveBeenCalled();
    await act(async () => { jest.advanceTimersByTime(tl.end - tl.deploy![0] + 200); });
    expect(onHousePanel).toHaveBeenCalledTimes(1);
    const [house, target] = onHousePanel.mock.calls[0] as [HouseMeasure, HousePanelTarget];
    expect(house).toEqual(houseMeasureAt({ x: 0, y: 0 }, 300));
    expect(target).toBe(TARGET);
    expect(byTestId(r, 'homi-house-panel')).toBeTruthy();
    expect(panel.value).toBeCloseTo(1, 4);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  it('sans panneau cible : la maison « s’ouvre » quand le logo est complet (onHousePanel et l’alias onLensPanel, une fois chacun)', async () => {
    const onHousePanel = jest.fn();
    const onLensPanel = jest.fn();
    const tl = logoTimeline('full');
    const r = await render(<HomiLogoAnimated width={300} onHousePanel={onHousePanel} onLensPanel={onLensPanel} />);
    await layout(byTestId(r, 'homi-logo')!);
    await act(async () => { jest.advanceTimersByTime(tl.open - 40); });
    expect(onHousePanel).not.toHaveBeenCalled();
    await act(async () => { jest.advanceTimersByTime(200); });
    expect(onHousePanel).toHaveBeenCalledTimes(1);
    expect(onLensPanel).toHaveBeenCalledTimes(1);
    expect(onHousePanel.mock.calls[0][1]).toBeNull();
    // même fonction passée aux deux noms (cas de « Découvrir HOMI ») : un seul appel
    const same = jest.fn();
    const r2 = await render(<HomiLogoAnimated width={300} onHousePanel={same} onLensPanel={same} />);
    await layout(byTestId(r2, 'homi-logo')!);
    await act(async () => { jest.advanceTimersByTime(tl.end + 100); });
    expect(same).toHaveBeenCalledTimes(1);
  });
  it('Réduire les animations : état final immédiat (maison, famille, nom, panneau posé), rappels tout de suite', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const onLensPanel = jest.fn();
    const onDone = jest.fn();
    const panel = makeMutable(0);
    const r = await render(<HomiLogoAnimated width={300} deployTo={TARGET} panel={panel} onLensPanel={onLensPanel} onDone={onDone} />);
    await layout(byTestId(r, 'homi-logo')!);
    expect(byTestId(r, 'homi-logo-final')).toBeTruthy();
    expect(byTestId(r, 'homi-logo-fill')).toBeUndefined(); // aucun calque animé
    expect(byTestId(r, 'homi-house-panel')).toBeTruthy();
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onLensPanel).toHaveBeenCalledTimes(1);
    expect(panel.value).toBe(1);
    const xml = r.root.findAll((x) => typeof x.props.xml === 'string')[0].props.xml as string;
    expect(xml).toBe(HOMI_MARK_SVG.light); // la maison complète, telle quelle
    // seul un fondu d'opacité court (aucun déplacement)
    await act(async () => { jest.advanceTimersByTime(LOGO_MOTION.reducedFadeMs + 20); });
    expect(styleOf(byTestId(r, 'homi-logo')!).opacity).toBe(1);
    expect(styleOf(byTestId(r, 'homi-logo')!).transform).toBeUndefined();
  });
  it('économie d’énergie : même état final', async () => {
    mockLowPower = true;
    const r = await render(<HomiLogoAnimated width={300} />);
    expect(byTestId(r, 'homi-logo-final')).toBeTruthy();
  });
  it('petit format : version fixe (maison + nom), aucun calque animé', async () => {
    const onDone = jest.fn();
    const r = await render(<HomiLogoAnimated width={96} onDone={onDone} />);
    expect(byTestId(r, 'homi-logo-static')).toBeTruthy();
    expect(byTestId(r, 'homi-logo-fill')).toBeUndefined();
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  it('le nom est annoncé : « HOMI », en-tête', async () => {
    const r = await render(<HomiLogoAnimated width={300} />);
    const n = byTestId(r, 'homi-logo')!;
    expect(n.props.accessibilityLabel).toBe('HOMI');
    expect(n.props.accessibilityRole).toBe('header');
  });
});

describe('BrandWordmark / BrandLogo / BrandStack', () => {
  const texts = (r: ReactTestRenderer) => r.root.findAll((x) => typeof x.type === 'string' && x.children.some((c) => c === 'HOMI'));
  it('wordmark : la maison + le nom HOMI à côté, annoncé HOMI', async () => {
    const r = await render(<BrandWordmark height={24} testID="wm" />);
    const n = byTestId(r, 'wm')!;
    expect(n.props.accessibilityLabel).toBe('HOMI');
    expect(n.props.accessibilityRole).toBe('header');
    const xml = r.root.findAll((x) => typeof x.props.xml === 'string')[0].props.xml as string;
    expect(xml).toBe(HOMI_MARK_SVG.light);
    expect(texts(r).length).toBeGreaterThan(0);
  });
  it('maison (API inchangée), variante sombre en thème sombre', async () => {
    act(() => { useUiStore.setState({ themePreference: 'dark' }); });
    const r = await render(<BrandLogo size={32} />);
    const xml = r.root.findAll((x) => typeof x.props.xml === 'string')[0].props.xml as string;
    expect(xml).toBe(HOMI_MARK_SVG.dark);
  });
  it('composition verticale : maison puis nom, hauteur = logoBox', async () => {
    const r = await render(<BrandStack width={200} testID="st" />);
    expect(byTestId(r, 'st')!.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ width: 200, height: logoBox(200).height })]));
    expect(texts(r).length).toBeGreaterThan(0);
  });
});
