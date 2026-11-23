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
import { TOOL_BY_ID, TOOL_CATEGORIES, type ScopeCtx } from '@/lib/journeys/tools';
import { ACTIVE_ALIAS, CHILD_TAB, childTabMode, HIDDEN_TAB_ROUTES, HUB_KEYS, HUB_PER_CATEGORY, HUB_PINNED, HUB_ROUTE, hubOf, hubSelection, hubTools, NAV_CENTER_AFTER, NAV_TABS, dockGeometry, dockLayout, estimateLabelWidth, tabLabelKeys, TAB_LABEL_MIN, TAB_MIN_W, tabLayout } from '@/features/hubs/hubMap';
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

  it.each(CTXS.map((c) => [c.scope, c]))('« %s » : chaque outil a exactement un onglet (rien de perdu, rien en double)', (_s, ctx) => {
    const c = ctx as ScopeCtx;
    const catalog = toolCatalog(c);
    expect(catalog.length).toBeGreaterThan(0);
    const shown: string[] = [];
    for (const hub of HUB_KEYS) shown.push(...hubTools(catalog, hub, c.scope).map((x) => x.id));
    expect(shown.sort()).toEqual(catalog.map((x) => x.id).sort());
  });

  it.each(CTXS.map((c) => [c.scope, c]))('« %s » : la sélection d’un onglet vient du catalogue, 4 outils au plus par catégorie, sans doublon', (_s, ctx) => {
    const c = ctx as ScopeCtx;
    const catalog = toolCatalog(c);
    for (const hub of HUB_KEYS) {
      const tools = hubTools(catalog, hub, c.scope);
      const groups = hubSelection(tools, hub, c.scope);
      const ids = groups.flatMap((g) => g.items.map((x) => x.id));
      expect(new Set(ids).size).toBe(ids.length);
      for (const g of groups) {
        expect(TOOL_CATEGORIES).toContain(g.category);
        expect(g.items.length).toBeLessThanOrEqual(HUB_PER_CATEGORY);
        expect(g.total).toBeGreaterThanOrEqual(g.items.length);
        // mêmes objets que le catalogue : identifiant, nom, description, pictogramme, destination, accès
        for (const x of g.items) expect(catalog).toContain(x);
        expect(g.items.every((x) => x.category === g.category && !x.urgent)).toBe(true);
      }
    }
  });

  it('outils mis en avant : des identifiants du registre, rangés dans le bon onglet', () => {
    for (const hub of HUB_KEYS) for (const id of HUB_PINNED[hub]) {
      expect(TOOL_BY_ID[id]).toBeDefined();
      expect(TOOL_BY_ID[id].id).toBe(id);
    }
    expect(hubSelection(hubTools(toolCatalog({ scope: 'baby', childId: 'c1' }), 'baby', 'baby'), 'baby', 'baby').find((g) => g.category === 'care')?.items[0].id).toBe('baby_daily');
    expect(hubSelection(hubTools(toolCatalog({ scope: 'family' }), 'family', 'family'), 'family', 'family').find((g) => g.category === 'family')?.items.map((x) => x.id))
      .toEqual(['family_missions', 'family_shopping', 'family_stocks', 'family_calendar']);
  });

  it('rangement logique : cycle, contraception, grossesse → Moi ; santé de l’enfant → Enfant ; foyer → Famille', () => {
    // grossesse, contraception, règles : jamais dans Famille
    for (const c of CTXS) for (const x of toolCatalog(c)) {
      if (x.category === 'cycle' || x.category === 'pregnancy') expect([x.id, hubOf(x, c.scope)]).toEqual([x.id, 'health']);
      if (x.category === 'couple' || x.category === 'family' || x.category === 'community') expect([x.id, hubOf(x, c.scope)]).toEqual([x.id, 'family']);
    }
    // vaccins, suivi de santé, traitements, rendez-vous de l'enfant : dans Enfant, pas dans Moi
    for (const id of ['kid_vaccines', 'kid_health', 'kid_treatments', 'appointments', 'documents', 'medications', 'baby_diaper', 'kid_sleep', 'meals', 'kid_school', 'kid_card']) {
      expect([id, hubOf({ key: id }, 'child')]).toEqual([id, id === 'baby_diaper' ? 'baby' : 'baby']);
    }
    // le scanner n'apparaît pas dans Enfant pour un profil sans enfant
    for (const scope of ['none', 'cycle', 'avoid', 'ttc', 'pregnancy', 'postpartum', 'family'] as const) {
      const baby = hubTools(toolCatalog({ scope }), 'baby', scope);
      expect([scope, baby.map((x) => x.id)]).toEqual([scope, []]);
    }
    expect(hubOf({ key: 'scan_food' }, 'none')).toBe('health');
    expect(hubOf({ key: 'scan_product' }, 'pregnancy')).toBe('health');
    expect(hubOf({ key: 'scan_product' }, 'baby')).toBe('baby');
    // ce qui concerne le parent lui-même reste dans Moi, quel que soit le profil affiché
    for (const id of ['ask', 'library', 'guides', 'videos', 'exhaustion_check']) expect([id, hubOf({ key: id }, 'baby')]).toEqual([id, 'health']);
    expect(hubOf({ key: 'preg_eat' }, 'pregnancy')).toBe('health');
    expect(hubOf({ key: 'sleep' }, 'none')).toBe('health');
    expect(hubOf({ key: 'pp_feeding' }, 'baby')).toBe('baby');
    expect(hubOf({ key: 'family_calendar' }, 'baby')).toBe('family');
    expect(hubOf({ key: 'outil_inconnu' })).toBe('family');
  });

  it('écrans d’onglet : aucun « Voir les N autres », aucun libellé ni route d’outil hors registre', () => {
    const files = ['src/app/(tabs)/health.tsx', 'src/app/(tabs)/baby.tsx', 'src/app/(tabs)/household.tsx', 'src/features/hubs/HubScreen.tsx', 'src/features/hubs/hubMap.ts'];
    for (const f of files) {
      const src = fs.readFileSync(path.join(process.cwd(), f), 'utf8');
      expect([f, /pj\.tools\.more|pj\.tools\.less|tools\.more|see_more|Voir les|PREVIEW/.test(src)]).toEqual([f, false]);
      // ni libellé d'outil (anciennes clés `tool.<id>`, `nav.hub.<accès direct>`), ni liste d'accès écrite à la main
      expect([f, /tr\(['`]tool\.|nav\.hub\.(ask|track|missions|shopping|stocks|agenda|babyStocks|community)|HUB_ENTRIES|HubRow\b/.test(src)]).toEqual([f, false]);
    }
    const screen = fs.readFileSync(path.join(process.cwd(), 'src/features/hubs/HubScreen.tsx'), 'utf8');
    expect(screen).toContain('ToolLinks');
    expect(screen).toContain('allOf={g.category}');
    // seules routes écrites dans l'écran d'onglet : « Mes outils » et la modification du parcours (pas des outils)
    expect([...screen.matchAll(/router\.push\('([^']+)'/g)].map((m) => m[1]).sort()).toEqual(['/journeys', '/tools']);
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

  it('les routes hors barre allument un onglet visible', () => {
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
