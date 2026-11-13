/**
 * HOMI — navigation à 5 onglets (Accueil · Santé · Bébé · Famille · Communauté).
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
import { ACTIVE_ALIAS, HIDDEN_TAB_ROUTES, HUB_ENTRIES, HUB_KEYS, HUB_ROUTE, HUB_THEMES, hubGroups, hubOf, hubTools, NAV_TABS, tabLabelSize } from '@/features/hubs/hubMap';
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

describe('HOMI : barre à 5 onglets et routes conservées', () => {
  it('5 onglets visibles, dans l’ordre du cahier des charges', () => {
    expect(NAV_TABS.map((x) => x.name)).toEqual(['index', 'health', 'baby', 'household', 'community']);
  });

  it('chaque onglet visible et chaque ancien onglet a son écran ; les anciens sont masqués de la barre, pas supprimés', () => {
    const layout = fs.readFileSync(path.join(TABS_DIR, '_layout.tsx'), 'utf8');
    for (const name of [...NAV_TABS.map((x) => x.name), ...HIDDEN_TAB_ROUTES]) {
      expect([name, fs.existsSync(path.join(TABS_DIR, `${name}.tsx`))]).toEqual([name, true]);
      expect(layout).toContain(`name="${name}"`);
    }
    for (const name of HIDDEN_TAB_ROUTES) expect(layout).toMatch(new RegExp(`name="${name}" options=\\{\\{[^}]*href: null`));
    for (const r of ['/agenda', '/track', '/tools', '/ask', '/moi', '/profile', '/health', '/baby', '/household', '/community', '/family']) expect(APP_ROUTES).toContain(r);
  });

  it('les accès directs des hubs pointent vers des routes existantes ; les anciennes routes allument leur onglet parent', () => {
    for (const hub of HUB_KEYS) for (const e of HUB_ENTRIES[hub]) expect(APP_ROUTES).toContain(e.href);
    const visible = new Set(NAV_TABS.map((x) => x.name));
    for (const target of Object.values(ACTIVE_ALIAS)) expect(visible.has(target)).toBe(true);
  });

  it.each(Object.keys(DICTIONARIES).map((l) => [l]))('« %s » : libellés complets, non vides, qui tiennent à 320 px', (locale) => {
    const d = DICTIONARIES[locale];
    const labels = NAV_TABS.map((x) => d[x.label]);
    for (const l of labels) expect(typeof l === 'string' && l.trim().length > 0).toBe(true);
    // barre à 320 px : marges 2 × 8, capsule 2 × 4 → 5 onglets de 59 px ; largeur estimée 0,58 em par caractère (Manrope)
    const tabW = (320 - 16 - 8) / 5;
    const longest = Math.max(...labels.map((l) => (l as string).length));
    const size = tabLabelSize(tabW, longest);
    expect(size).toBeGreaterThanOrEqual(9.5);
    expect(longest * size * 0.58).toBeLessThanOrEqual(tabW);
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
