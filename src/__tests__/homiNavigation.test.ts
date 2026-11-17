/**
 * HOMI — navigation (refonte du 17/11/2026) : Aujourd'hui · Moi · [action centrale] · Enfant · Famille.
 * Garde-fous : aucun outil du catalogue ne perd son onglet (chaque thème non vide est accessible depuis au moins
 * un onglet hub, et chaque outil s'y affiche réellement) ; les anciennes routes d'onglet restent valides ;
 * les libellés de la barre existent dans les 5 langues et tiennent à 320 px de large.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
const fs = require('fs') as { existsSync(p: string): boolean; readFileSync(p: string, enc: string): string };
const path = require('path') as { join(...p: string[]): string };

import { DICTIONARIES } from '@/i18n/dictionaries';
import { setLocale } from '@/i18n';
import { toolCatalog } from '@/lib/domain/toolCatalog';
import type { ScopeCtx } from '@/lib/journeys/tools';
import { ACTIVE_ALIAS, CHILD_TAB, childTabMode, HIDDEN_TAB_ROUTES, HUB_ENTRIES, HUB_KEYS, HUB_ROUTE, HUB_THEMES, hubGroups, hubOf, hubTools, NAV_CENTER_AFTER, NAV_TABS, dockGeometry, dockLayout, estimateLabelWidth, tabLabelKeys, TAB_LABEL_MIN, TAB_MIN_W, tabLayout } from '@/features/hubs/hubMap';
import { parentRoute } from '@/lib/parentRoute';
import { pushRecent, RECENT_MAX } from '@/features/hubs/recentTools';
import { APP_ROUTES } from '@/lib/routes.generated';

const CTXS: ScopeCtx[] = [
  { scope: 'avoid' }, { scope: 'ttc' }, { scope: 'cycle' }, { scope: 'none' }, { scope: 'pregnancy', pregnancyId: 'p1' },
  { scope: 'postpartum', babyId: 'c1', postpartum: true }, { scope: 'baby', childId: 'c1', postpartum: true }, { scope: 'child', childId: 'c2' }, { scope: 'family' },
];
const TABS_DIR = path.join(process.cwd(), 'src', 'app', '(tabs)');

describe('HOMI : onglets hub construits depuis le catalogue', () => {
  beforeAll(() => setLocale('fr'));

  it.each(CTXS.map((c) => [c.scope, c]))('« %s » : chaque outil est affiché dans exactement un hub (rien de perdu, rien en double)', (_s, ctx) => {
    const catalog = toolCatalog(ctx as ScopeCtx);
    expect(catalog.length).toBeGreaterThan(0);
    const shown: string[] = [];
    for (const hub of HUB_KEYS) {
      const tools = hubTools(catalog, hub);
      // urgences : bandeau en tête du hub ; le reste : sections par thème
      shown.push(...tools.filter((x) => x.urgent).map((x) => x.id));
      shown.push(...hubGroups(tools.filter((x) => !x.urgent), hub).flatMap((g) => g.items.map((x) => x.id)));
    }
    expect(shown.sort()).toEqual(catalog.map((x) => x.id).sort());
    for (const tool of catalog) expect(HUB_THEMES[hubOf(tool)]).toContain(tool.theme);
  });

  it('chaque thème non vide du catalogue est accessible depuis au moins un onglet hub de la barre', () => {
    const themes = new Set(CTXS.flatMap((c) => toolCatalog(c).map((x) => x.theme)));
    expect(themes.size).toBeGreaterThanOrEqual(17);
    const tabNames = new Set(NAV_TABS.map((x) => x.name));
    for (const theme of themes) {
      const hubs = HUB_KEYS.filter((h) => CTXS.some((c) => hubTools(toolCatalog(c), h).some((x) => x.theme === theme)));
      expect([theme, hubs.length > 0]).toEqual([theme, true]);
      for (const h of hubs) expect(tabNames.has(HUB_ROUTE[h])).toBe(true);
    }
  });

  it('répartition retenue : Santé, Bébé, Famille', () => {
    expect(hubOf({ theme: 'cycle', key: 'x' })).toBe('health');
    expect(hubOf({ theme: 'pregnancy', key: 'x' })).toBe('health');
    expect(hubOf({ theme: 'mood', key: 'x' })).toBe('health');
    expect(hubOf({ theme: 'resources', key: 'ask' })).toBe('health');
    expect(hubOf({ theme: 'feeding', key: 'x' })).toBe('baby');
    expect(hubOf({ theme: 'feeding', key: 'baby_bottle' })).toBe('baby');
    expect(hubOf({ theme: 'feeding', key: 'pp_feeding' })).toBe('baby');
    // repas et sommeil de la mère : Santé
    expect(hubOf({ theme: 'feeding', key: 'preg_eat' })).toBe('health');
    expect(hubOf({ theme: 'sleep', key: 'sleep' })).toBe('health');
    expect(hubOf({ theme: 'scanner', key: 'x' })).toBe('baby');
    expect(hubOf({ theme: 'calendar', key: 'x' })).toBe('family');
    expect(hubOf({ theme: 'reminders', key: 'x' })).toBe('family');
    // un nouvel outil « resources » non rangé n'est jamais perdu
    expect(hubOf({ theme: 'resources', key: 'outil_inconnu' })).toBe('family');
  });
});

describe('HOMI : barre à 4 onglets + action centrale, routes conservées', () => {
  it('4 onglets visibles dans l’ordre du cahier des charges, le bouton d’action au centre', () => {
    expect(NAV_TABS.map((x) => x.name)).toEqual(['index', 'health', 'baby', 'household']);
    expect(NAV_TABS.map((x) => DICTIONARIES.fr[x.label])).toEqual(['Aujourd’hui', 'Moi', 'Enfant', 'Famille']);
    expect(NAV_CENTER_AFTER).toBe(2);
    // le bouton central est exactement au milieu de la barre, à 320 comme à 390 pt
    for (const w of [320, 390]) {
      const g = dockGeometry(w);
      expect(g.pad * 2 + g.inner + g.action + g.gap * 2).toBe(w);
      expect(g.action).toBeGreaterThanOrEqual(48);
    }
  });

  it('l’onglet « Enfant » s’adapte : Enfant, Grossesse (sans enfant), ou proposition d’ajout', () => {
    expect(childTabMode({ children: 2, pregnancy: false })).toBe('child');
    expect(childTabMode({ children: 1, pregnancy: true })).toBe('child');
    expect(childTabMode({ children: 0, pregnancy: true })).toBe('pregnancy');
    expect(childTabMode({ children: 0, pregnancy: false })).toBe('empty');
    expect(DICTIONARIES.fr[CHILD_TAB.pregnancy.label]).toBe('Grossesse');
    expect(DICTIONARIES.fr[CHILD_TAB.child.label]).toBe('Enfant');
    // sans enfant ni grossesse : l'écran d'ajout mène à des routes qui existent
    const baby = fs.readFileSync(path.join(TABS_DIR, 'baby.tsx'), 'utf8');
    expect(baby).toContain('child-tab-add-child');
    expect(baby).toContain('child-tab-add-pregnancy');
    expect(APP_ROUTES).toContain('/profiles/new');
  });

  it('chaque onglet visible et chaque route hors barre a son écran ; hors barre = masqué, pas supprimé (Communauté comprise)', () => {
    const layout = fs.readFileSync(path.join(TABS_DIR, '_layout.tsx'), 'utf8');
    for (const name of [...NAV_TABS.map((x) => x.name), ...HIDDEN_TAB_ROUTES]) {
      expect([name, fs.existsSync(path.join(TABS_DIR, `${name}.tsx`))]).toEqual([name, true]);
      expect(layout).toContain(`name="${name}"`);
    }
    expect(HIDDEN_TAB_ROUTES).toContain('community');
    for (const name of HIDDEN_TAB_ROUTES) expect(layout).toMatch(new RegExp(`name="${name}" options=\\{\\{[^}]*href: null`));
    for (const r of ['/agenda', '/track', '/tools', '/ask', '/moi', '/profile', '/health', '/baby', '/household', '/community', '/family']) expect(APP_ROUTES).toContain(r);
  });

  it('les accès directs des hubs pointent vers des routes existantes ; les routes hors barre allument un onglet visible', () => {
    for (const hub of HUB_KEYS) for (const e of HUB_ENTRIES[hub]) expect(APP_ROUTES).toContain(e.href);
    const visible = new Set(NAV_TABS.map((x) => x.name));
    for (const target of Object.values(ACTIVE_ALIAS)) expect(visible.has(target)).toBe(true);
    for (const name of ['community', 'agenda', 'track', 'tools', 'ask', 'moi']) expect(ACTIVE_ALIAS[name]).toBeDefined();
  });

  it('retour arrière cohérent : chaque route hors barre remonte à l’onglet qu’elle allume, sans boucle', () => {
    const tabPath: Record<string, string> = { index: '/', health: '/health', baby: '/baby', household: '/household' };
    // route hors barre → son parent ; la Communauté et Outils remontent à Aujourd'hui, /moi passe par la Communauté
    expect(parentRoute('/agenda')).toBe('/household');
    expect(parentRoute('/track')).toBe('/baby');
    expect(parentRoute('/ask')).toBe('/health');
    expect(parentRoute('/community')).toBe('/');
    expect(parentRoute('/tools')).toBe('/');
    expect(parentRoute('/moi')).toBe('/community');
    for (const name of ['agenda', 'track', 'ask', 'community', 'tools']) expect(parentRoute(`/${name}`)).toBe(tabPath[ACTIVE_ALIAS[name]]);
    // aucune navigation circulaire : en remontant de parent en parent on atteint toujours un onglet de la barre
    const roots = new Set(Object.values(tabPath));
    for (const start of [...APP_ROUTES.filter((r) => !r.includes('[')), '/community/post/abc', '/child/c1/growth', '/sleep/c1']) {
      let cur = start;
      const seen = new Set<string>();
      while (!roots.has(cur)) {
        expect([start, seen.has(cur)]).toEqual([start, false]);
        seen.add(cur);
        cur = parentRoute(cur);
      }
    }
    // les onglets de la barre sont des racines : leur parent est Aujourd'hui (jamais un autre onglet)
    for (const p of ['/health', '/baby', '/household']) expect(parentRoute(p)).toBe('/');
  });

  it.each(Object.keys(DICTIONARIES).map((l) => [l]))('« %s » : libellés complets, non vides, qui tiennent à 320 px (variante « Grossesse » comprise)', (locale) => {
    const d = DICTIONARIES[locale];
    for (const variant of [0, 1]) {
      const labels = NAV_TABS.map((x) => { const keys = tabLabelKeys(x); return d[keys[Math.min(variant, keys.length - 1)]] as string; });
      for (const l of labels) expect(typeof l === 'string' && l.trim().length > 0).toBe(true);
      // barre à 320 px (bouton d'action au centre) : chaque libellé tient dans son onglet, sans ellipse ni icônes seules
      const g = dockGeometry(320);
      const { fontSize, widths, iconsOnly } = dockLayout(g.inner, labels.map((l) => estimateLabelWidth(l)));
      expect([locale, labels.join('·'), iconsOnly]).toEqual([locale, labels.join('·'), false]);
      // estimation prudente d'avant la mesure (plus large que la réalité) : déjà ≥ 10 px sans ellipse
      expect(fontSize).toBeGreaterThanOrEqual(10);
      labels.forEach((l, i) => expect(estimateLabelWidth(l, fontSize)).toBeLessThanOrEqual(widths[i]));
      for (const w of widths) expect(w).toBeGreaterThanOrEqual(TAB_MIN_W);
      expect(widths.reduce((a, w) => a + w, 0)).toBeLessThanOrEqual(g.inner + 0.01);
      // les deux moitiés ont la même largeur : le bouton d'action reste au milieu de l'écran
      expect(widths[0] + widths[1]).toBeCloseTo(widths[2] + widths[3], 5);
      expect(dockLayout(dockGeometry(390).inner, labels.map((l) => estimateLabelWidth(l))).fontSize).toBe(12);
    }
  });

  it('pourquoi 4 onglets + bouton central : avec un 5e onglet « Outils », la barre passe en icônes seules à 320 pt', () => {
    // largeurs réelles à 12 px (export web, Chromium, Manrope 700) : Aujourd'hui, Moi, Grossesse, Famille (+ Outils)
    const four = [67, 20, 60, 39];
    const g = dockGeometry(320);
    const l4 = dockLayout(g.inner, four);
    expect(l4.fontSize).toBe(12);
    expect(l4.iconsOnly).toBe(false);
    // 5 onglets, bouton centré : trois onglets dans la moitié droite (128 pt) → plus de libellés
    expect(dockLayout(g.inner, [...four, 35]).iconsOnly).toBe(true);
    // texte agrandi (libellés plafonnés à ×1,2) : les 4 onglets gardent leurs libellés entiers, à 320 comme à 390 pt
    const big = four.map((w) => w * 1.2);
    for (const width of [390, 320]) {
      const l = dockLayout(dockGeometry(width).inner, big);
      expect(l.iconsOnly).toBe(false);
      big.forEach((m, i) => expect((m * l.fontSize) / 12).toBeLessThanOrEqual(l.widths[i]));
      for (const w of l.widths) expect(w).toBeGreaterThanOrEqual(TAB_MIN_W);
    }
    // libellés bien plus longs + texte agrandi à 320 px : icônes seules, cibles ≥ 44 px, moitiés égales
    const narrow = dockLayout(g.inner, big.map((w) => w * 1.6));
    expect(narrow.iconsOnly).toBe(true);
    for (const w of narrow.widths) expect(w).toBeGreaterThanOrEqual(TAB_MIN_W);
    expect(narrow.widths[0] + narrow.widths[1]).toBeCloseTo(narrow.widths[2] + narrow.widths[3], 5);
  });

  it('tabLayout (répartition d’une rangée) : jamais d’ellipse ni d’onglet de moins de 44 px', () => {
    const l = tabLayout(128, [67, 20]);
    expect(l.iconsOnly).toBe(false);
    expect(l.widths.reduce((a, w) => a + w, 0)).toBeCloseTo(128, 5);
    for (const w of l.widths) expect(w).toBeGreaterThanOrEqual(TAB_MIN_W);
    expect(tabLayout(100, [90, 90]).iconsOnly).toBe(true);
  });
});

describe('HOMI : outils récents', () => {
  it('le plus récent en premier, sans doublon, borné', () => {
    let ids: string[] = [];
    for (let i = 0; i < RECENT_MAX + 3; i++) ids = pushRecent(ids, `t${i}`);
    expect(ids).toHaveLength(RECENT_MAX);
    expect(ids[0]).toBe(`t${RECENT_MAX + 2}`);
    expect(pushRecent(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b']);
  });
});
