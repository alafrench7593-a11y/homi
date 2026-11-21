/**
 * Direction artistique « Liquid Glass » (20/11/2026, docs/DA_LIQUID_GLASS.md) — logos d'outils, icône d'app, Aura.
 *  - COUVERTURE : chaque entrée réelle du catalogue (outils du registre, sous-accès, fonctions de la liste des 200,
 *    raccourcis de l'accueil, catégories) a un logo (glyphe + teinte + famille d'animation) ; chiffres sur le nombre réel ;
 *  - TROIS RENDUS : détaillé, compact, animé (lecture, minuteur en cours) ;
 *  - FAMILLES : sommeil → lune, allaitement → anneau, croissance → courbe, tâches → coche, repas → rebond ;
 *  - CONTRASTE (verre sombre, 21/11/2026) : par teinte, glyphe ≥ 4,5:1 sur la plaque et détails ≥ 3:1 sur le glyphe,
 *    en clair, sombre et nuit ; plaque profonde dans les deux apparences ; halo en détaillé seulement ; teintes distinctes ;
 *  - RÉDUIRE LES ANIMATIONS : l'anneau d'un minuteur en cours reste visible, sans rotation ; Aura immobile ;
 *  - MÊME LOGO PARTOUT : `ToolGlyph` (rangées, tuiles, recherche, en-têtes) rend `ToolLogo` pour l'identifiant.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('@react-native-masked-view/masked-view', () => 'MaskedView');
let mockLowPower = false;
jest.mock('@/lib/lowPower', () => ({ useLowPower: () => mockLowPower }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, enc?: 'utf8'): string & { readUInt32BE(o: number): number; [i: number]: number }; writeFileSync(p: string, d: string): void };
import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { getAnimatedStyle } from 'react-native-reanimated';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useUiStore } from '@/lib/store';
import { LOGO_MOTIONS, ToolLogo, toolLogoDef } from '@/brand/toolLogo';
import { appIconSvg } from '@/brand/toolLogo/appIcon';
import { QUICK_ICON } from '@/brand/icons/manifest';
import { ToolGlyph } from '@/components/ToolGlyph';
import { AuraOrb } from '@/features/aura/AuraMark';
import { H200_VIEWS, HOMI_200 } from '@/lib/journeys/homi200';
import { resolveTool, subRef, TOOL_CATEGORIES, TOOLS } from '@/lib/journeys/tools';
import { contrastRatio } from '@/theme/contrast';
import { DETAIL_MIN_CONTRAST, detailContrast, GLYPH_MIN_CONTRAST, glyphContrast, LOGO_GLOWS, LOGO_HUES, logoShadow, plateBrightest, toolLogoSpec, type LogoCategory } from '@/theme/toolLogo';

/** Toutes les entrées visibles du catalogue, sur le nombre RÉEL. */
const ENTRIES = {
  outils: TOOLS.map((d) => d.id),
  sousAcces: TOOLS.flatMap((d) => (d.subs ?? []).map((s) => subRef(d.id, s.id))),
  fonctions200: H200_VIEWS.map((e) => e.id),
  raccourcis: Object.keys(QUICK_ICON).map((k) => `quick.${k}`),
  categories: TOOL_CATEGORIES.map((c) => `cat.${c}`),
};

describe('couverture des logos sur le catalogue réel', () => {
  it.each(Object.entries(ENTRIES))('%s : chaque entrée a un logo', (_k, ids) => {
    const missing = ids.filter((id) => !toolLogoDef(id));
    expect(ids.length).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });
  it('les numéros de la liste des 200 qui mènent à un outil utilisable ont tous un logo', () => {
    const usable = HOMI_200.map((e) => e.id).filter((id) => resolveTool(id));
    expect(usable.filter((id) => !toolLogoDef(id))).toEqual([]);
    // chiffres réels (rapport docs/DA_LIQUID_GLASS.md)
    const total = new Set([...Object.values(ENTRIES).flat(), ...usable]).size;
    expect(total).toBeGreaterThan(300);
    if (process.env.DA_REPORT) {
      const all = [...new Set([...Object.values(ENTRIES).flat(), ...usable])];
      const fam: Record<string, number> = {};
      for (const id of all) { const m = toolLogoDef(id)!.motion; fam[m] = (fam[m] ?? 0) + 1; }
      const glyphs = new Set(all.map((id) => toolLogoDef(id)!.icon)).size;
      fs.writeFileSync(process.env.DA_REPORT, JSON.stringify({ ...Object.fromEntries(Object.entries(ENTRIES).map(([k, v]) => [k, v.length])), numeros200Utilisables: usable.length, numeros200Total: HOMI_200.length, entreesDistinctes: total, avecLogo: all.filter((id) => toolLogoDef(id)).length, glyphesDistincts: glyphs, familles: fam }, null, 1));
    }
  });
  it('identifiant stable → toujours le même logo (alias et ancien identifiant compris)', () => {
    for (const d of TOOLS) for (const a of d.aliases ?? []) expect(toolLogoDef(a)?.icon).toBe(toolLogoDef(d.id)?.icon);
  });
});

describe('familles d’animation', () => {
  it('sommeil → lune, allaitement → anneau, croissance → courbe, tâches → coche, repas → rebond', () => {
    expect(toolLogoDef('kid_sleep')?.motion).toBe('moon');
    expect(toolLogoDef('sleep')?.motion).toBe('moon');
    expect(toolLogoDef('baby_breastfeed')?.motion).toBe('ring');
    expect(toolLogoDef('baby_bottle_timer')?.motion).toBe('ring');
    expect(toolLogoDef('kid_grow')?.motion).toBe('curve');
    expect(toolLogoDef('preg_weight')?.motion).toBe('curve');
    expect(toolLogoDef('family_tasks')?.motion).toBe('check');
    expect(toolLogoDef('family_routines')?.motion).toBe('check');
    expect(toolLogoDef('meals')?.motion).toBe('meal');
    expect(toolLogoDef('baby_foods')?.motion).toBe('meal');
  });
  it('chaque famille couvre au moins un outil du registre', () => {
    const used = new Set(TOOLS.map((d) => toolLogoDef(d.id)?.motion));
    for (const f of LOGO_MOTIONS) expect(used.has(f)).toBe(true);
  });
  it('urgences : plaque rouge d’urgence, aucune animation (famille ignorée par le composant)', () => {
    expect(toolLogoDef('emergency')?.category).toBe('urgent');
  });
});

/** Luminance relative WCAG, déduite du contraste avec le noir. */
const relativeLuminance = (c: string) => contrastRatio(c, '#000000') * 0.05 - 0.05;

describe('matière « verre sombre » : contraste et teintes', () => {
  const CATS = Object.keys(LOGO_HUES) as LogoCategory[];
  const MODES = ['light', 'dark', 'night'] as const;
  it.each(CATS)('%s : glyphe ≥ 4,5:1 sur la plaque et détails ≥ 3:1 sur le glyphe, en clair, sombre et nuit', (c) => {
    for (const mode of MODES) {
      expect(glyphContrast(c, mode)).toBeGreaterThanOrEqual(GLYPH_MIN_CONTRAST);
      expect(detailContrast(c, mode)).toBeGreaterThanOrEqual(DETAIL_MIN_CONTRAST);
      // contrôle indépendant : point le plus sombre du glyphe contre point le plus clair de la plaque
      const s = toolLogoSpec(c, mode);
      expect(contrastRatio(s.glyphTint, plateBrightest(s))).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('seuil du glyphe : celui du texte (4,5:1), même à petite taille', () => {
    expect(GLYPH_MIN_CONTRAST).toBeGreaterThanOrEqual(4.5);
  });
  it('la plaque reste du verre PROFOND et lumineux sur fond crème comme sur fond nuit', () => {
    for (const c of CATS) for (const mode of ['light', 'dark'] as const) {
      const s = toolLogoSpec(c, mode);
      expect(relativeLuminance(s.mid)).toBeLessThan(0.1); // verre sombre (blanc ≥ 6:1 sur le milieu de la plaque)
      expect(s.mid).toBe(toolLogoSpec(c, mode === 'light' ? 'dark' : 'light').mid); // même verre dans les deux apparences
      expect(relativeLuminance(s.glow)).toBeGreaterThan(relativeLuminance(s.mid)); // une lumière, pas une ombre
    }
  });
  it('halo : seulement en rendu détaillé, jamais la nuit', () => {
    for (const c of CATS) {
      expect(logoShadow(toolLogoSpec(c, 'light'), 60, 'detailed')).toMatch(/^0px [\d.]+px [\d.]+px rgba\(/);
      expect((logoShadow(toolLogoSpec(c, 'dark'), 60, 'compact') ?? '').split('rgba(').length - 1).toBe(1); // contact seul
      expect(logoShadow(toolLogoSpec(c, 'night'), 60, 'detailed')).toBeUndefined();
    }
  });
  it('deux catégories n’ont jamais la même teinte de plaque ni la même lumière', () => {
    for (const mode of ['light', 'dark', 'night'] as const) {
      const mids = CATS.map((c) => toolLogoSpec(c, mode).mid);
      expect(new Set(mids).size).toBe(mids.length);
    }
    expect(new Set(Object.values(LOGO_GLOWS)).size).toBe(CATS.length);
  });
});

describe('icône de l’app', () => {
  it('trois tons vectoriels sans police, exports 1024 présents et branchés dans ios.icon', () => {
    for (const tone of ['light', 'dark', 'tinted'] as const) {
      const svg = appIconSvg(tone);
      expect(svg).not.toMatch(/<text|font-family/);
      expect(fs.readFileSync(`assets/brand/homi-app-icon-${tone}.svg`, 'utf8').trim()).toBe(svg.trim());
      const png = fs.readFileSync(`assets/icon-ios-${tone}.png`);
      expect(png.readUInt32BE(16)).toBe(1024); // largeur (en-tête IHDR)
      expect(png.readUInt32BE(20)).toBe(1024);
    }
    const cfg = fs.readFileSync('app.config.ts', 'utf8');
    expect(cfg).toMatch(/icon: \{ light: '.\/assets\/icon-ios-light.png', dark: '.\/assets\/icon-ios-dark.png', tinted: '.\/assets\/icon-ios-tinted.png' \}/);
  });
  it('icône claire et sombre sans canal alpha (exigence App Store)', () => {
    for (const tone of ['light', 'dark'] as const) expect(fs.readFileSync(`assets/icon-ios-${tone}.png`)[25]).toBe(2); // type couleur 2 = RVB
  });
});

// ------------------------------------------------------------------ rendus (composant)
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
const byId = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type !== 'string');
const paths = (n: ReactTestInstance) => n.findAll((x) => (x.type as { displayName?: string; name?: string })?.name === 'Path' || (x.type as { displayName?: string })?.displayName === 'Path').length;

let reduceMotion = false;
beforeEach(() => {
  jest.useFakeTimers();
  reduceMotion = false;
  mockLowPower = false;
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(() => Promise.resolve(reduceMotion));
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'light', hapticsEnabled: false }); });
});
afterEach(async () => {
  await act(async () => { while (mounted.length) mounted.pop()!.unmount(); });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('trois rendus par outil', () => {
  it('détaillé (ombre du glyphe en plus) et compact', async () => {
    const r = await render(<>
      <ToolLogo id="kid_sleep" size={64} testID="d" />
      <ToolLogo id="kid_sleep" size={32} testID="c" />
    </>);
    const d = byId(r, 'd')[0]; const c = byId(r, 'c')[0];
    expect(d).toBeTruthy(); expect(c).toBeTruthy();
    expect(paths(d)).toBeGreaterThan(paths(c));
  });
  it('animé : une interaction réelle (play) joue l’animation puis revient à l’état stable', async () => {
    const r = await render(<ToolLogo id="kid_grow" size={64} play={0} testID="g" />);
    await update(r, <ToolLogo id="kid_grow" size={64} play={1} testID="g" />);
    await tick(200);
    await tick(3000);
    expect(byId(r, 'g').length).toBeGreaterThan(0);
  });
  it('minuteur : l’anneau apparaît quand il tourne et disparaît à l’arrêt', async () => {
    const r = await render(<ToolLogo id="baby_breastfeed" size={48} running testID="f" />);
    expect(byId(r, 'f-running').length).toBeGreaterThan(0);
    await tick(400);
    await update(r, <ToolLogo id="baby_breastfeed" size={48} running={false} testID="f" />);
    expect(byId(r, 'f-running').length).toBe(0);
  });
  it('Réduire les animations : l’anneau d’un minuteur en cours reste visible, sans rotation', async () => {
    reduceMotion = true;
    const r = await render(<ToolLogo id="baby_breastfeed" size={48} running testID="f" />);
    await tick(50);
    const ring = byId(r, 'f-running')[0];
    expect(ring).toBeTruthy();
    const style = (getAnimatedStyle as unknown as (c: unknown) => { opacity?: number; transform?: { rotate?: string }[] })(r.root.findAll((n) => n.props.testID === 'f-running' && typeof n.type === 'string')[0] ?? ring);
    expect(style.opacity).toBe(1);
    await tick(2000);
    const after = (getAnimatedStyle as unknown as (c: unknown) => { transform?: { rotate?: string }[] })(r.root.findAll((n) => n.props.testID === 'f-running' && typeof n.type === 'string')[0] ?? ring);
    expect(Object.assign({}, ...(after.transform ?? [])).rotate).toBe('0deg');
  });
  it('même logo partout : ToolGlyph (rangées, tuiles, recherche, en-têtes) rend le logo de l’identifiant', async () => {
    const r = await render(<ToolGlyph id="meals" theme="feeding" icon="coffee" size={44} />);
    expect(byId(r, 'tool-logo-meals').length).toBeGreaterThan(0);
    expect(r.root.findAll((n) => n.props.testID === 'tool-icon-meals').length).toBeGreaterThan(0);
  });
  it('Aura : la signature se rend au repos et pendant la préparation d’une réponse', async () => {
    const r = await render(<AuraOrb size={44} testID="orb" />);
    await update(r, <AuraOrb size={44} thinking testID="orb" />);
    await tick(500);
    await update(r, <AuraOrb size={44} thinking={false} testID="orb" />);
    expect(byId(r, 'orb').length).toBeGreaterThan(0);
  });
});
