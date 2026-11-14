/**
 * Logotype HOMI v4 « lentille » : tracés identiques entre l'application et les fichiers SVG, dessin vectoriel (aucune
 * police), chorégraphie du logo animé (reflet → volume → panneau), Réduire les animations = état final, rappel de la
 * lentille (mesure + déploiement), version fixe en petit format, mesures de lisibilité des deux pistes.
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
import { HOMI_LAYER_SVG, HOMI_LENS, HOMI_LETTERS, HOMI_SIGN_SVG, HOMI_WORDMARK_SVG } from '@/brand/homiMarkSvg';
import { LOGO_MOTION, lensPanelFrame, logoTimeline, stageProgress, type LensMeasure, type LensPanelTarget } from '@/brand/logoMotion';
import { HomiLogoAnimated, lensMeasureAt } from '@/components/HomiLogoAnimated';
import { BrandLogo, BrandWordmark } from '@/components/BrandLogo';

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
const TARGET: LensPanelTarget = { x: 24, y: 400, width: 342, height: 120, radius: 24, fill: '#FFFFFF', edge: '#DDDDDD' };

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

describe('logotype : une seule source de tracés', () => {
  it('les SVG livrés (assets/brand) sont exactement ceux de l’application', () => {
    for (const tone of ['light', 'dark', 'mono'] as const) {
      expect(fs.readFileSync(`assets/brand/homi-wordmark-${tone}.svg`, 'utf8')).toBe(HOMI_WORDMARK_SVG[tone]);
      expect(fs.readFileSync(`assets/brand/homi-sign-${tone}.svg`, 'utf8')).toBe(HOMI_SIGN_SVG[tone]);
    }
  });
  it('les quatre lettres sont dessinées (tracés), jamais une police rendue en texte', () => {
    const all = [...Object.values(HOMI_WORDMARK_SVG), ...Object.values(HOMI_SIGN_SVG), fs.readFileSync('assets/brand/homi-app-icon.svg', 'utf8')];
    for (const svg of all) {
      expect(svg).not.toMatch(/<text|font-family/);
      expect(svg).toContain(HOMI_LENS.ringD); // le O-lentille est partout (mot, signe, icône)
    }
    for (const tone of ['light', 'dark', 'mono'] as const) {
      for (const d of Object.values(HOMI_LETTERS)) expect(HOMI_WORDMARK_SVG[tone]).toContain(`d="${d}"`);
      expect(HOMI_WORDMARK_SVG[tone]).toContain(HOMI_LENS.glintD); // le reflet capté, y compris en monochrome
    }
  });
  it('calques de l’animation : lettres + lentille superposées = mot-symbole', () => {
    for (const tone of ['light', 'dark'] as const) {
      const inner = (svg: string) => svg.replace(/^[\s\S]*?<\/defs>\n/, '').replace(/\n<\/svg>$/, '');
      expect(HOMI_WORDMARK_SVG[tone]).toBe(HOMI_LAYER_SVG[tone].letters.replace(/\n<\/svg>$/, `\n${inner(HOMI_LAYER_SVG[tone].lens)}\n</svg>`));
    }
  });
  it('ancien pictogramme maison retiré', () => {
    expect(fs.existsSync('assets/brand/homi-mark.svg')).toBe(false);
    expect(fs.existsSync('assets/brand/homi-mark-mono.svg')).toBe(false);
  });
});

describe('pistes explorées : choix mesuré en petit format', () => {
  it('la piste retenue (lentille) se lit mieux que la piste 2 à 16 et 24 px, en monochrome', () => {
    const m = JSON.parse(fs.readFileSync('assets/brand/explorations/mesures.json', 'utf8')) as { pistes: Record<string, { hauteurMot: number; lectureNom: number; contreformes: number }[]> };
    const p1 = m.pistes['piste1-lentille'];
    const p2 = m.pistes['piste2-foyer'];
    for (const h of [16, 24]) {
      expect(p1.find((r) => r.hauteurMot === h)!.lectureNom).toBeGreaterThan(p2.find((r) => r.hauteurMot === h)!.lectureNom + 10);
    }
    // contreformes stables (aucune fusion) pour la lentille de 16 à 96 px
    expect(new Set(p1.map((r) => r.contreformes)).size).toBe(1);
    expect(fs.existsSync('assets/brand/explorations/planche-pistes.png')).toBe(true);
  });
});

describe('chorégraphie du logo (pure)', () => {
  it('reflet → volume → déploiement, dans l’ordre, ≤ 2 s', () => {
    const tl = logoTimeline('full', true);
    expect(tl.lens[0]).toBeGreaterThan(tl.reveal[0]);
    expect(tl.deploy![0]).toBeGreaterThanOrEqual(tl.lens[0] + tl.lens[1]);
    expect(tl.end).toBe(tl.deploy![0] + tl.deploy![1]);
    expect(tl.end).toBeLessThanOrEqual(2000);
    expect(logoTimeline('full').deploy).toBeNull();
  });
  it('nuit : tout en fondu court, aucun balayage', () => {
    const tl = logoTimeline('minimal', true);
    expect(stageProgress(0, tl.reveal)).toBe(1);
    expect(stageProgress(0, tl.lens)).toBe(1);
    expect(tl.end).toBeLessThanOrEqual(LOGO_MOTION.minimalFadeMs);
  });
  it('panneau : part exactement du disque de la lentille et arrive sur la cible', () => {
    const lens = lensMeasureAt({ x: 10, y: 20 }, 360);
    expect(lens).toMatchObject({ cx: 10 + HOMI_LENS.cx, cy: 20 + HOMI_LENS.cy, r: HOMI_LENS.r });
    expect(lensPanelFrame(lens, TARGET, 0)).toEqual({ x: lens.x, y: lens.y, width: lens.width, height: lens.height, rx: lens.r });
    expect(lensPanelFrame(lens, TARGET, 1)).toEqual({ x: TARGET.x, y: TARGET.y, width: TARGET.width, height: TARGET.height, rx: TARGET.radius });
  });
});

describe('HomiLogoAnimated', () => {
  it('mouvement complet : le mot est caché puis révélé, la lentille prend du volume, le panneau se déploie', async () => {
    const onLensPanel = jest.fn();
    const onDone = jest.fn();
    const panel = makeMutable(0);
    const tl = logoTimeline('full', true);
    const r = await render(<HomiLogoAnimated width={300} deployTo={TARGET} panel={panel} onLensPanel={onLensPanel} onDone={onDone} />);
    await layout(byTestId(r, 'homi-logo')!);
    expect(styleOf(byTestId(r, 'homi-logo-lens')!).opacity).toBe(0);
    await act(async () => { jest.advanceTimersByTime(tl.deploy![0] - 50); });
    expect(onLensPanel).not.toHaveBeenCalled();
    expect(styleOf(byTestId(r, 'homi-logo-lens')!).opacity).toBeCloseTo(1, 4);
    await act(async () => { jest.advanceTimersByTime(tl.end - tl.deploy![0] + 200); });
    expect(onLensPanel).toHaveBeenCalledTimes(1);
    const [lens, target] = onLensPanel.mock.calls[0] as [LensMeasure, LensPanelTarget];
    expect(lens).toEqual(lensMeasureAt({ x: 0, y: 0 }, 300));
    expect(target).toBe(TARGET);
    expect(panel.value).toBeCloseTo(1, 4);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  it('Réduire les animations : état final immédiat (mot + lentille en volume + panneau posé), rappels tout de suite', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const onLensPanel = jest.fn();
    const onDone = jest.fn();
    const panel = makeMutable(0);
    const r = await render(<HomiLogoAnimated width={300} deployTo={TARGET} panel={panel} onLensPanel={onLensPanel} onDone={onDone} />);
    await layout(byTestId(r, 'homi-logo')!);
    expect(byTestId(r, 'homi-logo-final')).toBeTruthy();
    expect(byTestId(r, 'homi-logo-lens')).toBeUndefined(); // aucun calque animé
    expect(byTestId(r, 'homi-lens-panel')).toBeTruthy();
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onLensPanel).toHaveBeenCalledTimes(1);
    expect(panel.value).toBe(1);
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
  it('petit format : version fixe (mot-symbole), aucun calque animé', async () => {
    const onDone = jest.fn();
    const r = await render(<HomiLogoAnimated width={96} onDone={onDone} />);
    expect(byTestId(r, 'homi-logo-static')).toBeTruthy();
    expect(byTestId(r, 'homi-logo-lens')).toBeUndefined();
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  it('le nom est annoncé : « HOMI », en-tête', async () => {
    const r = await render(<HomiLogoAnimated width={300} />);
    const n = byTestId(r, 'homi-logo')!;
    expect(n.props.accessibilityLabel).toBe('HOMI');
    expect(n.props.accessibilityRole).toBe('header');
  });
});

describe('BrandWordmark / BrandLogo', () => {
  it('mot-symbole : largeur = 3 × hauteur, variante selon le thème, annoncé HOMI', async () => {
    const r = await render(<BrandWordmark height={24} testID="wm" />);
    const n = byTestId(r, 'wm')!;
    expect(n.props.style).toEqual(expect.arrayContaining([{ width: 72, height: 24 }]));
    expect(n.props.accessibilityLabel).toBe('HOMI');
    const xml = r.root.findAll((x) => typeof x.props.xml === 'string')[0].props.xml as string;
    expect(xml).toBe(HOMI_WORDMARK_SVG.light);
  });
  it('signe compact (API inchangée) : la lentille du logotype', async () => {
    const r = await render(<BrandLogo size={32} />);
    const xml = r.root.findAll((x) => typeof x.props.xml === 'string')[0].props.xml as string;
    expect(xml).toBe(HOMI_SIGN_SVG.light);
  });
});
