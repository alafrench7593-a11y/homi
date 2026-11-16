/**
 * Logo HOMI v5 « encre » (logo de la propriétaire : symbole « M » aux deux personnes + mot-symbole « HOMI ») :
 * tracés identiques entre l'application, les SVG livrés et les sources fournies ; encre / ivoire uniquement ;
 * chorégraphie du logo animé (corps → têtes → nom → point du i → panneau, ≤ 1,4 s), Réduire les animations = état
 * final, rappel de panneau (mesure du symbole), version fixe en petit format.
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
import { HOMI_INK, HOMI_PARTS, HOMI_SVG, HOMI_SYMBOL_PATH, HOMI_WORD_PATH } from '@/brand/homiMarkSvg';
import {
  backOut, housePanelFrame, housePanelPath, LOGO_MOTION, logoBox, logoTimeline, stageProgress, type HouseMeasure, type HousePanelTarget,
} from '@/brand/logoMotion';
import { HomiLogoAnimated, houseMeasureAt, lensMeasureAt } from '@/components/HomiLogoAnimated';
import { BrandLogo, BrandName, BrandStack, BrandWordmark } from '@/components/BrandLogo';

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
const xmlOf = (r: ReactTestRenderer) => r.root.findAll((x) => typeof x.props.xml === 'string')[0].props.xml as string;
const layout = async (n: ReactTestInstance) => { await act(async () => { n.props.onLayout?.({ nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 100 } } }); }); };
const TARGET: HousePanelTarget = { x: 24, y: 400, width: 342, height: 120, radius: 24, fill: '#FFFFFF', edge: '#DDDDDD' };
const dOf = (svg: string) => [...svg.matchAll(/\sd="([^"]*)"/g)].map((m) => m[1]);

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

describe('logo v5 « encre » : une seule source de tracés', () => {
  const FILES = { symbol: 'symbole', word: 'motsymbole', logo: 'logo' } as const;
  const NAMES = { light: 'encre', dark: 'ivoire', mono: 'mono' } as const;
  it('les SVG livrés (assets/brand) sont exactement ceux de l’application', () => {
    for (const art of ['symbol', 'word', 'logo'] as const) {
      for (const tone of ['light', 'dark', 'mono'] as const) {
        expect(fs.readFileSync(`assets/brand/homi-${FILES[art]}-${NAMES[tone]}.svg`, 'utf8')).toBe(HOMI_SVG[art][tone]);
      }
    }
  });
  it('tracés de la propriétaire repris tels quels (sources assets/brand/source-v5), aucune police', () => {
    expect(dOf(fs.readFileSync('assets/brand/source-v5/homi-symbole-encre.svg', 'utf8'))).toEqual([HOMI_SYMBOL_PATH]);
    expect(dOf(fs.readFileSync('assets/brand/source-v5/homi-motsymbole-encre.svg', 'utf8'))).toEqual([HOMI_WORD_PATH]);
    expect(dOf(fs.readFileSync('assets/brand/source-v5/homi-logo-encre.svg', 'utf8'))).toEqual([HOMI_SYMBOL_PATH, HOMI_WORD_PATH]);
    const all = [...Object.values(HOMI_SVG).flatMap((v) => Object.values(v)), fs.readFileSync('assets/brand/homi-app-icon.svg', 'utf8')];
    for (const svg of all) expect(svg).not.toMatch(/<text|font-family/);
    // pièces du logo animé = sous-tracés exacts de la source
    expect(HOMI_PARTS.headA.d + HOMI_PARTS.headB.d + HOMI_PARTS.body.d).toBe(HOMI_SYMBOL_PATH.replace(/\s+(?=M)/g, ''));
    expect(HOMI_PARTS.dot.d + HOMI_PARTS.letters.d).toBe(HOMI_WORD_PATH.replace(/\s+(?=M)/g, ''));
  });
  it('encre (clair) et ivoire (sombre) uniquement : aucune autre couleur ; mono = currentColor', () => {
    expect(HOMI_INK).toEqual({ light: '#1F1B1A', dark: '#F7F1E8' });
    for (const art of ['symbol', 'word', 'logo'] as const) {
      expect([...HOMI_SVG[art].light.matchAll(/fill="([^"]*)"/g)].map((m) => m[1])).toEqual(['#1F1B1A']);
      expect([...HOMI_SVG[art].dark.matchAll(/fill="([^"]*)"/g)].map((m) => m[1])).toEqual(['#F7F1E8']);
      expect([...HOMI_SVG[art].mono.matchAll(/fill="([^"]*)"/g)].map((m) => m[1])).toEqual(['currentColor']);
    }
  });
  it('anciennes sources maison (violette) et lentille retirées', () => {
    for (const f of ['homi-mark.svg', 'homi-mark-light.svg', 'homi-mark-dark.svg', 'homi-mark-mono.svg', 'homi-wordmark-light.svg', 'homi-sign-light.svg']) {
      expect(fs.existsSync(`assets/brand/${f}`)).toBe(false);
    }
    expect(fs.existsSync('assets/brand/explorations')).toBe(false);
    expect(fs.readFileSync('src/brand/homiMarkSvg.ts', 'utf8')).not.toMatch(/#7A52E6|#3F2196|maison/i);
  });
});

describe('chorégraphie du logo (pure)', () => {
  it('corps → têtes (chignon d’abord) → nom → point du i → déploiement ; logo complet ≤ 1,4 s', () => {
    const tl = logoTimeline('full', true);
    expect(tl.heads[0][0]).toBeGreaterThan(tl.body[0]);
    expect(tl.heads[1][0]).toBeGreaterThan(tl.heads[0][0]);
    expect(tl.word[0]).toBeGreaterThan(tl.heads[1][0]);
    expect(tl.dot[0]).toBeGreaterThan(tl.word[0]);
    expect(tl.open).toBeLessThanOrEqual(1400);
    expect(tl.deploy![0]).toBeGreaterThanOrEqual(tl.open);
    expect(tl.end).toBe(tl.deploy![0] + tl.deploy![1]);
    expect(logoTimeline('full').deploy).toBeNull();
    expect(logoTimeline('full').end).toBe(logoTimeline('full').open);
  });
  it('léger ressort des têtes : dépassement < 15 %, arrivée exacte', () => {
    const peak = Math.max(...Array.from({ length: 101 }, (_, i) => backOut(i / 100)));
    expect(peak).toBeGreaterThan(1.03);
    expect(peak).toBeLessThan(1.15);
    expect(backOut(1)).toBe(1);
    expect(backOut(0)).toBe(0);
  });
  it('nuit : tout en fondu court, aucun déplacement', () => {
    const tl = logoTimeline('minimal', true);
    for (const s of [tl.body, ...tl.heads, tl.word, tl.dot]) expect(stageProgress(0, s)).toBe(1);
    expect(tl.end).toBeLessThanOrEqual(LOGO_MOTION.minimalFadeMs);
  });
  it('composition : l’assemblage officiel (rapport 1402 × 430), symbole à gauche', () => {
    const b = logoBox(300);
    expect(b.height).toBe(Math.round(300 * 430.5 / 1402.13));
    const h = houseMeasureAt({ x: 10, y: 20 }, 300);
    expect(h.x).toBeCloseTo(10 + b.symbol.left, 5);
    expect(h.y).toBeCloseTo(20 + b.symbol.top, 5);
    expect(h.height).toBeCloseTo(b.symbol.height, 5);
    expect(h.width / h.height).toBeCloseTo(312 / 430, 1);
    expect(h.x + h.width).toBeLessThan(10 + b.word.left); // le symbole précède le mot
    expect(lensMeasureAt).toBe(houseMeasureAt); // alias rétro-compatible
  });
  it('panneau : part exactement de la boîte du symbole et arrive sur la cible', () => {
    const house = houseMeasureAt({ x: 0, y: 0 }, 300);
    const f0 = housePanelFrame(house, TARGET, 0);
    expect(f0).toMatchObject({ x: house.x, y: house.y, width: house.width, height: house.height, roof: 0 });
    const f1 = housePanelFrame(house, TARGET, 1);
    expect(f1).toEqual({ x: TARGET.x, y: TARGET.y, width: TARGET.width, height: TARGET.height, rx: TARGET.radius, roof: 0, eave: TARGET.radius });
    expect(housePanelPath(f1)).toContain(`L${TARGET.x + TARGET.width - TARGET.radius} ${TARGET.y} Q${TARGET.x + TARGET.width} ${TARGET.y} ${TARGET.x + TARGET.width} ${TARGET.y + TARGET.radius}`);
  });
});

describe('HomiLogoAnimated', () => {
  it('mouvement complet : corps, têtes, nom, point du i, puis le symbole s’ouvre en panneau', async () => {
    const onHousePanel = jest.fn();
    const onDone = jest.fn();
    const panel = makeMutable(0);
    const tl = logoTimeline('full', true);
    const r = await render(<HomiLogoAnimated width={300} deployTo={TARGET} panel={panel} onHousePanel={onHousePanel} onDone={onDone} />);
    await layout(byTestId(r, 'homi-logo')!);
    expect(styleOf(byTestId(r, 'homi-logo-body')!).opacity).toBe(0);
    expect(styleOf(byTestId(r, 'homi-logo-head-0')!).opacity).toBe(0);
    expect(styleOf(byTestId(r, 'homi-logo-name')!).opacity).toBe(0);
    // première tête posée, point du i pas encore
    const t1 = tl.heads[0][0] + tl.heads[0][1] + 10;
    await act(async () => { jest.advanceTimersByTime(t1); });
    expect(styleOf(byTestId(r, 'homi-logo-body')!).opacity).toBeCloseTo(1, 4);
    expect(styleOf(byTestId(r, 'homi-logo-head-0')!).opacity).toBeCloseTo(1, 4);
    expect(styleOf(byTestId(r, 'homi-logo-dot')!).opacity as number).toBeLessThan(1);
    expect(onHousePanel).not.toHaveBeenCalled();
    await act(async () => { jest.advanceTimersByTime(tl.deploy![0] - t1 - 20); });
    for (const id of ['head-1', 'name', 'dot']) expect(styleOf(byTestId(r, `homi-logo-${id}`)!).opacity).toBeCloseTo(1, 4);
    expect(styleOf(byTestId(r, 'homi-logo-dot')!).transform).toEqual([{ translateY: -0 }, { scale: 1 }]);
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
  it('pièces encre en clair, ivoire en sombre (même dessin)', async () => {
    const fills = (r: ReactTestRenderer) => new Set(r.root.findAll((x) => typeof x.props.d === 'string' && typeof x.props.fill === 'string').map((x) => x.props.fill));
    const light = await render(<HomiLogoAnimated width={300} />);
    expect([...fills(light)]).toEqual([HOMI_INK.light]);
    const dark = await render(<HomiLogoAnimated width={300} tone="dark" />);
    expect([...fills(dark)]).toEqual([HOMI_INK.dark]);
  });
  it('sans panneau cible : le symbole « s’ouvre » quand le logo est complet (onHousePanel et l’alias onLensPanel, une fois chacun)', async () => {
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
    const same = jest.fn();
    const r2 = await render(<HomiLogoAnimated width={300} onHousePanel={same} onLensPanel={same} />);
    await layout(byTestId(r2, 'homi-logo')!);
    await act(async () => { jest.advanceTimersByTime(tl.end + 100); });
    expect(same).toHaveBeenCalledTimes(1);
  });
  it('Réduire les animations : état final immédiat (logo complet, panneau posé), rappels tout de suite', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const onLensPanel = jest.fn();
    const onDone = jest.fn();
    const panel = makeMutable(0);
    const r = await render(<HomiLogoAnimated width={300} deployTo={TARGET} panel={panel} onLensPanel={onLensPanel} onDone={onDone} />);
    await layout(byTestId(r, 'homi-logo')!);
    expect(byTestId(r, 'homi-logo-final')).toBeTruthy();
    expect(byTestId(r, 'homi-logo-body')).toBeUndefined(); // aucune pièce animée
    expect(byTestId(r, 'homi-house-panel')).toBeTruthy();
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onLensPanel).toHaveBeenCalledTimes(1);
    expect(panel.value).toBe(1);
    expect(xmlOf(r)).toBe(HOMI_SVG.logo.light); // le logo complet, tel quel
    await act(async () => { jest.advanceTimersByTime(LOGO_MOTION.reducedFadeMs + 20); });
    expect(styleOf(byTestId(r, 'homi-logo')!).opacity).toBe(1);
    expect(styleOf(byTestId(r, 'homi-logo')!).transform).toBeUndefined();
  });
  it('économie d’énergie : même état final', async () => {
    mockLowPower = true;
    const r = await render(<HomiLogoAnimated width={300} />);
    expect(byTestId(r, 'homi-logo-final')).toBeTruthy();
  });
  it('petit format (< 120 px) : version fixe, aucune pièce animée', async () => {
    const onDone = jest.fn();
    const r = await render(<HomiLogoAnimated width={96} onDone={onDone} />);
    expect(byTestId(r, 'homi-logo-static')).toBeTruthy();
    expect(byTestId(r, 'homi-logo-body')).toBeUndefined();
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  it('le nom est annoncé : « HOMI », en-tête', async () => {
    const r = await render(<HomiLogoAnimated width={300} />);
    const n = byTestId(r, 'homi-logo')!;
    expect(n.props.accessibilityLabel).toBe('HOMI');
    expect(n.props.accessibilityRole).toBe('header');
  });
});

describe('BrandWordmark / BrandLogo / BrandStack / BrandName', () => {
  it('wordmark : le logo complet (symbole + HOMI), annoncé HOMI', async () => {
    const r = await render(<BrandWordmark height={24} testID="wm" />);
    const n = byTestId(r, 'wm')!;
    expect(n.props.accessibilityLabel).toBe('HOMI');
    expect(n.props.accessibilityRole).toBe('header');
    expect(xmlOf(r)).toBe(HOMI_SVG.logo.light);
  });
  it('symbole (API inchangée), ivoire en thème sombre', async () => {
    act(() => { useUiStore.setState({ themePreference: 'dark' }); });
    const r = await render(<BrandLogo size={32} />);
    expect(xmlOf(r)).toBe(HOMI_SVG.symbol.dark);
  });
  it('mot-symbole seul, sans police', async () => {
    const r = await render(<BrandName size={20} />);
    expect(xmlOf(r)).toBe(HOMI_SVG.word.light);
  });
  it('logo à une largeur donnée : hauteur = logoBox', async () => {
    const r = await render(<BrandStack width={200} testID="st" />);
    expect(byTestId(r, 'st')!.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ width: 200, height: logoBox(200).height })]));
    expect(xmlOf(r)).toBe(HOMI_SVG.logo.light);
  });
});
