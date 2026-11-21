/**
 * Tickets navigation et design (21/11/2026) — garde-fous des corrections :
 *  T1 visite : écrans d'onglet parcourables en démonstration SEULEMENT, outils toujours réservés, vrais comptes inchangés ;
 *  T2 barre d'onglets : la lumière jaune est calculée DANS le symbole (masques PNG), jamais sur la tuile ni autour ;
 *     opacités repos < appui < actif ; aucune lumière sans image allumée ;
 *  T3 Mes outils : aperçu du catalogue ouvert à tout compte, cadenas d'après les droits réels (jamais chez un
 *     abonné, jamais pendant la vérification), couleurs de catégories stables et lisibles dans les 8 thèmes, grille
 *     1 colonne à 320 pt avec texte agrandi, introduction mémorisée par compte ;
 *  T6 thèmes : Réglages et bouton palette partagent le même sélecteur et la même source (aperçu → annuler / appliquer,
 *     sortie de l'écran sans valider = thème confirmé).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => ({}), useIsFocused: () => true, usePathname: () => '/', useNavigation: () => ({ setOptions: jest.fn(), addListener: () => () => undefined }), useFocusEffect: () => undefined };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import React from 'react';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import { useUiStore } from '@/lib/store';
import { PALETTE_NAMES, THEME_STARTS, themeFor, type Theme } from '@/theme/tokens';
import { ThemePickerInline } from '@/features/themePicker/ThemePicker';
import { gateFor, isLockedFor, PREVIEW_ROUTES, VISIT_ROUTES } from '@/lib/premium/access';
import type { AccessInfo } from '@/lib/premium/offers';
import { APPS_LOGO, PUBLIC_LIGHT, TAB_LIGHT } from '@/theme/toolLogo';
import { tMaybe } from '@/i18n';
import { DICTIONARIES } from '@/i18n/dictionaries';
import { tabLightOpacity } from '@/brand/toolGlass/TabLight';
import { CATEGORY_HUE, categoryColors, categoryContrast, type CategoryKey } from '@/theme/categoryPalette';
import { categoryColumns } from '@/features/toolHub/CategoryList';
import { TOOL_CATEGORIES } from '@/lib/journeys/tools';
import { contrastRatio } from '@/theme/contrast';

jest.setTimeout(60000);

type Img = { width: number; height: number; data: Uint8Array };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string): Uint8Array };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path') as { resolve(...p: string[]): string; join(...p: string[]): string };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PNG } = require('pngjs') as { PNG: { sync: { read(b: Uint8Array): Img } } };

const access = (over: Partial<AccessInfo> = {}): AccessInfo => ({ premium: false, ai: false, trial_until: null, strict: true, tools: [], ...over });

describe('ticket 1 — visite sans compte', () => {
  it('démonstration : accueil et onglets parcourables ; outils, communauté et suivi restent réservés', () => {
    for (const p of ['/', '/health', '/baby', '/household', '/settings/appearance', '/settings/home']) expect([p, gateFor(p, false, access(), { visit: true })]).toEqual([p, 'open']);
    for (const p of ['/bottle', '/cycle', '/track', '/community', '/family/tasks', '/ask', '/child/c1/vaccines']) expect([p, gateFor(p, false, access(), { visit: true })]).toEqual([p, 'locked']);
  });
  it('vrai compte sans Premium : rien ne change (accueil, apparence verrouillés)', () => {
    for (const p of ['/', '/health', '/settings/appearance']) expect([p, gateFor(p, false, access())]).toEqual([p, 'locked']);
    expect(VISIT_ROUTES.length).toBeGreaterThan(0);
  });
});

describe('ticket 3 — accès à Mes outils', () => {
  it('aperçu du catalogue (Mes outils, catégories) ouvert à tout compte ; l’outil reste gardé', () => {
    for (const p of ['/tools', '/tools/sleep', '/tools/account']) expect([p, gateFor(p, false, access())]).toEqual([p, 'open']);
    expect(gateFor('/sleep', false, access())).toBe('locked');
    expect(PREVIEW_ROUTES.some((r) => r.test('/tools/sleep/extra'))).toBe(false);
  });
  it('cadenas : seulement quand has_premium est faux ; jamais pour un abonné (dont co-parent partenaire), ni pendant la vérification', () => {
    expect(isLockedFor('/bottle', false, access())).toBe(true);
    expect(isLockedFor('/bottle', true, access({ premium: true }))).toBe(false);
    expect(isLockedFor('/bottle', undefined, null)).toBe(false);
    expect(isLockedFor('/emergency', false, access())).toBe(false);
    expect(isLockedFor('/ask', false, access({ ai: true }))).toBe(false);
    expect(isLockedFor('/fertility/pma', false, access({ tools: [{ key: 'pma_tracker', owned: true } as never] }))).toBe(false);
  });
  it('couleurs : une par catégorie réelle, toutes distinctes, pastille ≥ 3:1 sur l’aplat de sa carte dans les 8 thèmes (clair et sombre)', () => {
    expect(Object.keys(CATEGORY_HUE).sort()).toEqual([...TOOL_CATEGORIES].sort());
    expect(new Set(Object.values(CATEGORY_HUE)).size).toBe(TOOL_CATEGORIES.length);
    const weak: string[] = [];
    for (const p of PALETTE_NAMES) for (const mode of ['light', 'dark'] as const) {
      const th = themeFor(mode, p);
      for (const c of TOOL_CATEGORIES) if (categoryContrast(th, c as CategoryKey) < 3) weak.push(`${p}/${mode}/${c}:${categoryContrast(th, c as CategoryKey).toFixed(2)}`);
      // couleur stable : même teinte en clair d'un thème à l'autre
      if (!th.isDark) for (const c of TOOL_CATEGORIES) expect(categoryColors(th, c as CategoryKey).accent).toBe(CATEGORY_HUE[c as CategoryKey]);
    }
    expect(weak).toEqual([]);
  });
  it('grille : 1 colonne à 320 pt avec texte agrandi (titres jamais coupés), 2 sinon', () => {
    expect(categoryColumns(320, 1.3)).toBe(1);
    expect(categoryColumns(320, 1)).toBe(2);
    expect(categoryColumns(390, 1.3)).toBe(2);
  });
  it('introduction « Bienvenue dans Mes outils » : mémorisée par compte, revoyable', () => {
    const s = () => useUiStore.getState();
    act(() => { s().setToolsIntroSeen('u1', true); });
    expect(s().toolsIntroSeen.u1).toBe(true);
    expect(s().toolsIntroSeen.u2).toBeUndefined();
    act(() => { s().setToolsIntroSeen('u1', false); });
    expect(s().toolsIntroSeen.u1).toBe(false);
  });
});

describe('ticket 3 — « Mes apps » (nouveau nom, nouveau logo)', () => {
  it('nom dans les 5 langues ; un élément = « une app » ; plus aucun « Mes outils » visible', () => {
    const want: Record<string, string> = { fr: 'Mes apps', en: 'My apps', es: 'Mis apps', de: 'Meine Apps', it: 'Le mie app' };
    for (const [lang, name] of Object.entries(want)) {
      const d = DICTIONARIES[lang];
      expect([lang, d['th.ui.title'], d['hm.toolsEntry']]).toEqual([lang, name, name]);
      const old = Object.entries(d).filter(([, v]) => /Mes outils|My tools|Meine Werkzeuge|Mis herramientas|I miei strumenti/i.test(JSON.stringify(v))).map(([k]) => k);
      expect([lang, old]).toEqual([lang, []]);
    }
    expect(DICTIONARIES.fr['mt.intro.title']).toBe('Bienvenue dans Mes apps');
    expect(DICTIONARIES.fr['th.sheet.start']).toBe('Ouvrir l’app');
    expect(tMaybe('th.ui.title')).toBeTruthy();
  });
  it('logo : 4 tuiles, 4 lumières de public distinctes (rose, bleu, menthe, ambre), repos < allumé', () => {
    expect(APPS_LOGO.lights).toEqual([PUBLIC_LIGHT.woman, PUBLIC_LIGHT.baby, PUBLIC_LIGHT.child, PUBLIC_LIGHT.family]);
    expect(new Set(APPS_LOGO.lights).size).toBe(4);
    expect(APPS_LOGO.rest).toBeLessThan(APPS_LOGO.lit);
  });
});

describe('ticket 2 — lumière DANS le pictogramme de la barre', () => {
  const dir = path.resolve('assets/brand/tabs');
  const read = (f: string) => PNG.sync.read(fs.readFileSync(path.join(dir, f)));
  it.each(['today', 'me', 'add', 'child', 'family'])('%s : lumière nulle hors du symbole, symbole plus clair que la tuile, cœur éclairé', (name) => {
    const icon = read(`${name}.png`);
    const lit = read(`${name}-lit.png`);
    const mask = read(`${name}-mask.png`);
    expect([lit.width, lit.height]).toEqual([icon.width, icon.height]);
    let outside = 0; let litPx = 0; let bright = 0;
    const lum = (d: Uint8Array, i: number) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    for (let i = 0; i < lit.data.length; i += 4) {
      const a = lit.data[i + 3];
      if (a > 0 && mask.data[i + 3] === 0) outside += 1;
      if (a > 0) {
        litPx += 1;
        // jamais sur le fond transparent ni sur la tuile (pixels sombres de la plaque)
        expect(icon.data[i + 3]).toBeGreaterThan(200);
        // jamais plus opaque que le masque du symbole ; presque toujours sur les pixels clairs du dessin
        expect(a).toBeLessThanOrEqual(mask.data[i + 3]);
        if (lum(icon.data, i) > 185) bright += 1;
      }
    }
    expect(outside).toBe(0);
    expect(litPx).toBeGreaterThan(1500);
    expect(bright / litPx).toBeGreaterThan(0.9);
    // bord de l'icône : aucune lumière sur les 10 px du pourtour
    for (let y = 0; y < lit.height; y += 1) for (let x = 0; x < lit.width; x += 1) {
      if (x < 10 || y < 10 || x >= lit.width - 10 || y >= lit.height - 10) expect(lit.data[(y * lit.width + x) * 4 + 3]).toBe(0);
    }
  });
  it('le « + » s’éclaire au croisement de ses branches, plus qu’au bout d’une branche', () => {
    const lit = read('add-lit.png');
    const at = (x: number, y: number) => lit.data[(y * lit.width + x) * 4 + 3];
    expect(at(96, 96)).toBeGreaterThan(at(96, 50) + 60);
  });
  it('opacités : repos < appui < actif ; nuit atténuée', () => {
    expect(tabLightOpacity('idle')).toBeLessThan(tabLightOpacity('pressed'));
    expect(tabLightOpacity('pressed')).toBeLessThan(tabLightOpacity('active'));
    expect(tabLightOpacity('active', true)).toBeLessThan(tabLightOpacity('active'));
    expect(TAB_LIGHT.active).toBeLessThanOrEqual(1);
  });
});

let seen: Theme | null = null;
function Probe() { seen = useTheme(); return null; }
const flush = async (ms = 50) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await act(async () => { r = create(<QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider>{el}<Probe /></ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>); });
  await flush(200);
  return r;
}
const byId = (r: ReactTestRenderer, id: string) => r.root.findAll((n: ReactTestInstance) => n.props.testID === id && typeof n.props.onPress === 'function');
async function press(r: ReactTestRenderer, id: string) {
  const n = byId(r, id)[0];
  if (!n) throw new Error(`introuvable : ${id}`);
  await act(async () => { n.props.onPress(); });
  await flush(120);
}

describe('ticket 6 — Réglages › Apparence : le même sélecteur que le bouton palette', () => {
  beforeEach(() => {
    act(() => { useUiStore.setState({ nightMode: false, themePreference: 'light', palettePreference: 'olive', themePreview: null, adaptiveProfile: 'me', appearanceByUser: {}, appearanceOwner: null }); });
  });
  it('aperçu → Annuler : thème confirmé rétabli, rien d’enregistré', async () => {
    const r = await render(<ThemePickerInline />);
    for (const p of PALETTE_NAMES) expect(byId(r, `theme-${p}`).length).toBeGreaterThan(0);
    await press(r, 'theme-nacre');
    expect(seen!.colors.background).toBe(THEME_STARTS.nacre.bg);
    await press(r, 'theme-inline-cancel');
    expect(seen!.colors.background).toBe(THEME_STARTS.olive.bg);
    expect(useUiStore.getState().palettePreference).toBe('olive');
    r.unmount();
  });
  it('passage rapide entre les 8 thèmes puis Appliquer : le dernier est enregistré', async () => {
    const r = await render(<ThemePickerInline />);
    for (const p of PALETTE_NAMES) await press(r, `theme-${p}`);
    await press(r, 'theme-graphite');
    await press(r, 'theme-inline-apply');
    expect(useUiStore.getState().palettePreference).toBe('graphite');
    expect(useUiStore.getState().themePreview).toBeNull();
    r.unmount();
  });
  it('quitter l’écran (retour, geste) sans valider : aperçu abandonné', async () => {
    const r = await render(<ThemePickerInline />);
    await press(r, 'theme-sable');
    expect(useUiStore.getState().themePreview).toBe('sable');
    await act(async () => { r.unmount(); });
    expect(useUiStore.getState().themePreview).toBeNull();
    expect(useUiStore.getState().palettePreference).toBe('olive');
    expect(contrastRatio('#000000', '#FFFFFF')).toBeGreaterThan(20);
  });
});
