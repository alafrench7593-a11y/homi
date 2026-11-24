/**
 * Direction artistique « Liquid Glass » (20/11/2026, docs/DA_LIQUID_GLASS.md) — logos d'outils, icône d'app, Aura.
 *  - COUVERTURE : chaque entrée réelle du catalogue (outils du registre, sous-accès, fonctions de la liste des 200,
 *    raccourcis de l'accueil, catégories) a un logo (glyphe + teinte + famille d'animation) ; chiffres sur le nombre réel ;
 *  - TROIS RENDUS : détaillé, compact, animé (lecture, minuteur en cours) ;
 *  - FAMILLES : sommeil → lune, allaitement → anneau, croissance → courbe, tâches → coche, repas → rebond ;
 *  - VERRE DÉPOLI + LUMIÈRE PAR PUBLIC (21/11/2026) : les 134 outils ont leur symbole et une plaque fournis par la
 *    propriétaire ; la lumière dit à qui sert l'outil (femme rose, bébé bleu, enfant menthe, couple pêche, foyer ambre,
 *    neutre lavande, urgence rouge, Aura bleu nuit), choix déterministe ; elle ne rend jamais le symbole moins lisible ;
 *  - BARRE D'ONGLETS : lumière jaune derrière chaque icône (plus vive sur l'onglet actif) et derrière « + » ;
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
import { bareContrast, CATEGORY_LIGHT, colorLightContrast, LOGO_CATEGORIES, LOGO_LIGHT, LOGO_PUBLICS, lightContrast, logoLight, logoShadow, PUBLIC_LIGHT, TAB_LIGHT, TOOL_LIGHT } from '@/theme/toolLogo';
import { logoPublicOf, logoSymbolOf, QUICK_TOOL } from '@/brand/toolLogo/families';
import { TOOL_SYMBOLS, TOOL_GLASS_CATEGORY } from '@/brand/toolGlass/symbols';
import { TOOL_ICON } from '@/brand/icons/manifest';

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

describe('verre dépoli de la propriétaire + lumière par public', () => {
  it('les 134 outils fournis + 2 entrées de compte (supprimer, se déconnecter) ont symbole et plaque (aucun manquant, aucun en trop)', () => {
    expect(Object.keys(TOOL_ICON).sort()).toEqual(Object.keys(TOOL_SYMBOLS).sort());
    expect(Object.keys(TOOL_SYMBOLS)).toHaveLength(137);
    for (const d of TOOLS) expect(toolLogoDef(d.id)?.symbol).toBe(d.id);
    for (const [id, d] of Object.entries(TOOL_SYMBOLS)) { expect(d).toMatch(/^[Mm]/); expect(TOOL_GLASS_CATEGORY[id]).toBeTruthy(); }
    for (const f of new Set(Object.values(TOOL_GLASS_CATEGORY))) expect(fs.readFileSync(`assets/brand/tool-glass/glass/${f}.png`)[25]).toBe(6); // RGBA
  });
  it('aucun doublon de symbole : deux outils n’ont jamais le même dessin (symboles clairs, 21/11/2026)', () => {
    const byDrawing = new Map<string, string[]>();
    for (const [id, d] of Object.entries(TOOL_SYMBOLS)) byDrawing.set(d, [...(byDrawing.get(d) ?? []), id]);
    expect([...byDrawing.values()].filter((ids) => ids.length > 1)).toEqual([]);
    expect(byDrawing.size).toBe(Object.keys(TOOL_SYMBOLS).length);
    // aucun caractère dessiné : les SVG sources sont des tracés au trait, sans élément <text>
    for (const id of Object.keys(TOOL_SYMBOLS)) expect(fs.readFileSync(`assets/brand/tool-glass/symboles/${id}.svg`, 'utf8')).not.toMatch(/<text\b/);
  });
  it('raccourcis de l’accueil : chacun mène à un outil du registre et en prend le symbole et le public', () => {
    for (const k of Object.keys(QUICK_ICON)) {
      expect(resolveTool(QUICK_TOOL[k])?.def.id).toBe(QUICK_TOOL[k]);
      expect(logoSymbolOf(`quick.${k}`)).toBe(QUICK_TOOL[k]);
      expect(toolLogoDef(`quick.${k}`)?.public).toBe(toolLogoDef(QUICK_TOOL[k])?.public);
    }
  });
  it('public déterministe : femme rose, bébé bleu, enfant menthe, couple, foyer, neutre, urgence, Aura', () => {
    const pub = (id: string) => toolLogoDef(id)?.public;
    expect(pub('cycle_calendar')).toBe('woman');
    expect(pub('avoid_contraception')).toBe('woman');
    expect(pub('preg_weight')).toBe('woman');
    expect(pub('pp_recovery')).toBe('woman');
    expect(pub('baby_bottle')).toBe('baby'); // scopes ['baby']
    expect(pub('baby_breastfeed')).toBe('baby'); // ['baby', 'postpartum'] : le premier scope
    expect(pub('kid_sleep')).toBe('baby'); // ['baby', 'child'] : le premier scope
    expect(pub('kid_school')).toBe('child');
    expect(pub('mental_load')).toBe('couple');
    expect(pub('meals')).toBe('family'); // au moins trois publics : toute la famille
    expect(pub('family_calendar')).toBe('family');
    expect(pub('settings')).toBe('neutral');
    expect(pub('community')).toBe('neutral');
    expect(pub('emergency')).toBe('urgent');
    expect(pub('ask')).toBe('aura');
    // même résultat à chaque appel, alias compris
    for (const d of TOOLS) {
      expect(logoPublicOf(d.id, toolLogoDef(d.id)!.category)).toBe(pub(d.id));
      for (const al of d.aliases ?? []) expect(pub(al)).toBe(pub(d.id));
    }
  });
  it('table des logos pour les planches (DA_LOGOS=<fichier.json> : scripts/da/brand-export.cjs)', () => {
    const all = [...new Set([...Object.values(ENTRIES).flat()])];
    const table = Object.fromEntries(all.map((id) => { const d = toolLogoDef(id)!; return [id, { icon: d.icon, category: d.category, public: d.public, symbol: d.symbol }]; }));
    expect(Object.keys(table).length).toBe(all.length);
    if (process.env.DA_LOGOS) fs.writeFileSync(process.env.DA_LOGOS, JSON.stringify(table));
  });
  it('chaque public a sa couleur, toutes distinctes ; la barre d’onglets a sa lumière jaune', () => {
    expect(new Set(LOGO_PUBLICS.map((p) => PUBLIC_LIGHT[p])).size).toBe(LOGO_PUBLICS.length);
    expect(TAB_LIGHT.active).toBeGreaterThan(TAB_LIGHT.idle);
    const all = [...new Set([...Object.values(ENTRIES).flat()])];
    const used = new Set(all.map((id) => toolLogoDef(id)!.public));
    for (const p of LOGO_PUBLICS) expect(used.has(p)).toBe(true);
  });
  it.each(LOGO_PUBLICS)('%s : la lumière ne rend jamais le symbole moins lisible que sur la plaque nue (clair, sombre, nuit)', (p) => {
    for (const mode of ['light', 'dark', 'night'] as const) expect(lightContrast(p, mode)).toBeGreaterThanOrEqual(bareContrast());
  });
  it('lumière franche (choix de la propriétaire) et plus discrète la nuit ; ombre colorée en détaillé seulement, aucune la nuit', () => {
    expect(LOGO_LIGHT.opacity.light).toBeLessThanOrEqual(0.9) // lumière franche demandée par la propriétaire (21/11/2026);
    expect(LOGO_LIGHT.opacity.night).toBeLessThan(LOGO_LIGHT.opacity.light);
    expect((logoShadow('baby', 60, 'detailed', 'light') ?? '').split('rgba(').length - 1).toBe(2);
    expect((logoShadow('baby', 40, 'compact', 'dark') ?? '').split('rgba(').length - 1).toBe(1);
    expect(logoShadow('baby', 60, 'detailed', 'night')).toBeUndefined();
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
  it('détaillé (filet de lumière, ombre teintée) et compact', async () => {
    const r = await render(<>
      <ToolLogo id="kid_sleep" size={64} testID="d" />
      <ToolLogo id="kid_sleep" size={32} testID="c" />
    </>);
    const d = byId(r, 'd')[0]; const c = byId(r, 'c')[0];
    expect(d).toBeTruthy(); expect(c).toBeTruthy();
    expect(paths(d)).toBeGreaterThan(paths(c)); // filet de lumière sur le trait en détaillé
    expect(byId(r, 'd-plate-detailed').length).toBeGreaterThan(0);
    expect(byId(r, 'c-plate-compact').length).toBeGreaterThan(0);
    expect(byId(r, 'd-light-baby').length).toBeGreaterThan(0); // sommeil de l'enfant : lumière bleue
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

describe('lumière : impulsion à l’appui et à l’ouverture, fixe sous « Réduire les animations »', () => {
  const lightOpacity = (r: ReactTestRenderer, id: string) => {
    const n = r.root.findAll((x) => x.props.testID === id && typeof x.type === 'string')[0] ?? r.root.findAll((x) => x.props.testID === id)[0];
    return (getAnimatedStyle as unknown as (c: unknown) => { opacity?: number })(n).opacity;
  };
  it('appui : la lumière monte, puis revient au repos au relâchement', async () => {
    const r = await render(<ToolLogo id="cycle_home" size={60} testID="p" />);
    await tick(800);
    const rest = lightOpacity(r, 'p-light-woman')!;
    expect(rest).toBeCloseTo(LOGO_LIGHT.opacity.light, 2);
    await update(r, <ToolLogo id="cycle_home" size={60} pressed testID="p" />);
    await tick(400);
    expect(lightOpacity(r, 'p-light-woman')!).toBeGreaterThan(rest + 0.1);
    await update(r, <ToolLogo id="cycle_home" size={60} testID="p" />);
    await tick(1200);
    expect(lightOpacity(r, 'p-light-woman')!).toBeCloseTo(rest, 2);
  });
  it('Réduire les animations : lumière fixe à l’appui comme à l’ouverture', async () => {
    reduceMotion = true;
    const r = await render(<ToolLogo id="baby_bottle" size={60} testID="q" />);
    await tick(100);
    const rest = lightOpacity(r, 'q-light-baby')!;
    await update(r, <ToolLogo id="baby_bottle" size={60} pressed play={1} testID="q" />);
    await tick(120);
    expect(lightOpacity(r, 'q-light-baby')).toBe(rest);
  });
});

describe('couleurs par famille d’outil (24/11/2026)', () => {
  it('chaque famille a sa couleur, toutes distinctes ; exceptions allaitement et croissance', () => {
    expect(new Set(LOGO_CATEGORIES.map((c) => CATEGORY_LIGHT[c])).size).toBe(LOGO_CATEGORIES.length);
    expect(logoLight('baby_breastfeed', 'feeding')).toBe(TOOL_LIGHT.baby_breastfeed);
    expect(logoLight('baby_bottle', 'feeding')).toBe(CATEGORY_LIGHT.feeding);
    expect(logoLight(undefined, 'sleep')).toBe(CATEGORY_LIGHT.sleep);
  });
  it.each([...LOGO_CATEGORIES.map((c) => [c, CATEGORY_LIGHT[c]]), ...Object.entries(TOOL_LIGHT)])('%s : symbole au moins aussi lisible que sur la plaque nue (clair, sombre, nuit)', (_name, color) => {
    for (const mode of ['light', 'dark', 'night'] as const) expect(colorLightContrast(color, mode)).toBeGreaterThanOrEqual(bareContrast());
  });
});
