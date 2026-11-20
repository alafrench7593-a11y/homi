/**
 * Table HOMI_200 (src/lib/journeys/homi200.ts) et catalogue complet filtré (src/lib/domain/catalogFilters.ts) :
 *  - 200 numéros, identifiants stables `h200_<n>`, natures conformes à l'audit (correspondance_200.csv) ;
 *  - doublons de liste → même entrée ; partiels et absents invisibles ; sous-accès nommés vers des routes existantes ;
 *  - non-régression : anciens identifiants d'outils, favoris et liens toujours résolus ;
 *  - filtres combinables (catégorie, âge, étape de vie, favoris, récents) ; profil absent → entrées « à découvrir ».
 */
import { setLocale } from '@/i18n';
import { HOMI_200, H200_BY_N, H200_VIEWS, h200Root } from '@/lib/journeys/homi200';
import { canonicalToolId, CATEGORY_TOOLS, isToolAllowed, resolveTool, SCOPES, TOOL_ALIASES, toolLabelKey, type ScopeCtx } from '@/lib/journeys/tools';
import { findEntry, toolCatalog, type CatalogTool } from '@/lib/domain/toolCatalog';
import { filterCatalog, flattenCatalog, lockedEntries, NO_FILTERS } from '@/lib/domain/catalogFilters';
import { migrateToolIds } from '@/lib/domain/toolFavorites';
import { APP_ROUTES } from '@/lib/routes.generated';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, e: 'utf8'): string };

const pathOf = (href: string) => href.split(/[?#]/)[0].replace(/\/\([^)]+\)/g, '').replace(/\/+$/, '') || '/';
const PATTERNS = APP_ROUTES.map((r) => new RegExp(`^${r.replace(/\[\.\.\.[^\]]+\]/g, '.+').replace(/\[[^\]]+\]/g, '[^/]+')}$`));
const routeExists = (href: string) => PATTERNS.some((re) => re.test(pathOf(href)));
const CTXS: ScopeCtx[] = SCOPES.flatMap((scope) => [{ scope, childId: scope === 'baby' || scope === 'child' ? 'c1' : null, pregnancyId: 'p1', babyId: 'c1', postpartum: true }, { scope }]);

function full(): CatalogTool[] {
  const seen = new Map<string, CatalogTool>();
  // un outil par identifiant ; ses fonctions nommées réunies sur tous les profils (chacune existe dans ses portées)
  for (const c of CTXS) for (const t of toolCatalog(c)) {
    const prev = seen.get(t.id);
    if (!prev) seen.set(t.id, { ...t, fns: [...(t.fns ?? [])] });
    else for (const f of t.fns ?? []) if (!prev.fns!.some((x) => x.id === f.id)) prev.fns!.push(f);
  }
  return [...seen.values()];
}

describe('HOMI_200', () => {
  beforeAll(() => setLocale('fr'));

  it('200 numéros, identifiants stables, natures conformes à l’audit', () => {
    expect(HOMI_200).toHaveLength(200);
    expect(new Set(HOMI_200.map((e) => e.id)).size).toBe(200);
    const count = (k: string) => HOMI_200.filter((e) => e.kind === k).length;
    expect({ tool: count('tool'), view: count('view'), dup: count('dup'), partial: count('partial'), absent: count('absent') })
      .toEqual({ tool: 62, view: 69, dup: 5, partial: 36, absent: 28 });
    // statuts de docs/200/correspondance_200.csv : PARTIEL et ABSENT identiques ; DOUBLON_LISTE identiques
    const csv = fs.readFileSync('docs/200/correspondance_200.csv', 'utf8').replace(/^﻿/, '').split('\n').slice(1).filter(Boolean);
    for (const line of csv) {
      const n = Number(line.split(',')[0]);
      const e = H200_BY_N[n];
      if (line.includes('ABSENT')) expect([n, e.kind]).toEqual([n, 'absent']);
      if (line.includes('PARTIEL')) expect([n, e.kind]).toEqual([n, 'partial']);
      if (line.includes('DOUBLON_LISTE')) expect([n, e.kind]).toEqual([n, 'dup']);
    }
  });

  it('doublons de liste : 13=3, 16=1, 22=11, 35=13, 187=163 → la même entrée', () => {
    for (const [a, b] of [[13, 3], [16, 1], [22, 11], [35, 3], [187, 163]]) {
      expect(h200Root(a)).toBe(b);
      expect(canonicalToolId(`h200_${a}`)).toBe(canonicalToolId(`h200_${b}`));
    }
  });

  it('partiels et absents : isAvailable faux, « missing » renseigné ; un absent n’ouvre rien, un partiel mène à un outil utilisable', () => {
    for (const e of HOMI_200.filter((x) => x.kind === 'partial' || x.kind === 'absent')) {
      expect(e.isAvailable).toBe(false);
      expect(e.missing?.length).toBeGreaterThan(10);
      if (e.kind === 'absent') expect(resolveTool(e.id)).toBeNull();
      if (e.kind === 'partial' && e.target) expect(resolveTool(e.id)?.def).toBeDefined();
    }
    // jamais une entrée de catalogue : seules les vues (fonctions nommées) apparaissent en plus des outils
    const visible = new Set(flattenCatalog(full()).map((x) => x.id));
    for (const e of HOMI_200.filter((x) => !x.isAvailable)) expect(visible.has(e.id)).toBe(false);
  });

  it('les 69 fonctions nommées : nom de la liste, une phrase, ouvertes sur une route existante dans au moins un profil', () => {
    const flat = flattenCatalog(full());
    for (const e of H200_VIEWS) {
      const entry = flat.find((x) => x.id === e.id);
      expect([e.n, !!entry]).toEqual([e.n, true]);
      expect(entry!.label.length).toBeGreaterThan(5);
      expect(entry!.sub?.length).toBeGreaterThan(10);
      expect([e.id, routeExists(entry!.href)]).toEqual([e.id, true]);
      expect(toolLabelKey(e.id)).toBe(`h2.${e.n}`);
    }
    // vues précises vérifiées : statistiques du cycle, onglet croissance, graphiques de sommeil, température, tire-lait
    const ctxKid: ScopeCtx = { scope: 'baby', childId: 'c1' };
    const href = (id: string, c: ScopeCtx) => findEntry(toolCatalog(c), id)?.href;
    expect(href('h200_92', ctxKid)).toBe('/child/c1?tab=croissance');
    expect(href('h200_90', ctxKid)).toBe('/sleep/c1?tab=trends');
    expect(href('h200_102', ctxKid)).toBe('/track/observation?obs=temperature&child=c1');
    expect(href('h200_71', ctxKid)).toBe('/track/pumping?child=c1');
    expect(href('h200_153', ctxKid)).toBe('/garde/c1/journee');
    expect(findEntry(toolCatalog({ scope: 'cycle' }), canonicalToolId('h200_12')!)?.href).toBe('/cycle/stats');
  });

  it('catalogue visible : outils existants + fonctions nommées (et rien d’autre)', () => {
    const flat = flattenCatalog(full());
    const tools = flat.filter((x) => !x.parent).length;
    const fns = flat.filter((x) => x.id.startsWith('h200_')).length;
    expect(tools).toBe(CATEGORY_TOOLS.length + 1); // + Communauté
    expect(fns).toBe(69);
  });

  it('non-régression : anciens identifiants, favoris et sous-accès historiques toujours résolus', () => {
    for (const old of Object.keys(TOOL_ALIASES)) expect([old, resolveTool(old)]).not.toEqual([old, null]);
    expect(migrateToolIds(['pp_feeding', 'kid_growth', 'h200_67', 'h200_66', 'h200_13', 'h200_39', 'inconnu'])).toEqual(['baby_breastfeed', 'kid_profile.growth', 'h200_67', 'cycle_symptoms']);
    expect(isToolAllowed('h200_67', { scope: 'baby', childId: 'c1' })).toBe(true);
    expect(isToolAllowed('h200_67', { scope: 'pregnancy', pregnancyId: 'p' })).toBe(false);
  });
});

describe('catalogue complet filtré', () => {
  beforeAll(() => setLocale('fr'));
  const ctx = { favorites: new Set(['kid_sleep', 'h200_67']), recents: ['meals'] };
  const flat = flattenCatalog(full());

  it('filtres combinables : catégorie × âge × étape de vie', () => {
    const sleep06 = filterCatalog(flat, { ...NO_FILTERS, category: 'sleep', age: 'infant_0_6' }, ctx).map((x) => x.id);
    expect(sleep06).toEqual(expect.arrayContaining(['kid_sleep', 'h200_87']));
    expect(sleep06).not.toContain('sleep'); // le sommeil de l'adulte n'est pas un outil d'enfant
    const preg = filterCatalog(flat, { ...NO_FILTERS, stage: 'pregnancy' }, ctx).map((x) => x.id);
    expect(preg).toEqual(expect.arrayContaining(['preg_evolution', 'h200_33']));
    expect(preg).not.toContain('kid_teeth');
    const school = filterCatalog(flat, { ...NO_FILTERS, age: 'child_6_10' }, ctx).map((x) => x.id);
    expect(school).toEqual(expect.arrayContaining(['kid_school', 'kid_routines']));
    expect(school).not.toContain('baby_diaper');
    const nanny = filterCatalog(flat, { ...NO_FILTERS, stage: 'nanny' }, ctx).map((x) => x.id);
    expect(nanny).toEqual(expect.arrayContaining(['childcare', 'h200_153']));
  });
  it('favoris et récents', () => {
    expect(filterCatalog(flat, { ...NO_FILTERS, favorites: true }, ctx).map((x) => x.id).sort()).toEqual(['h200_67', 'kid_sleep']);
    expect(filterCatalog(flat, { ...NO_FILTERS, recents: true }, ctx).map((x) => x.id)).toEqual(['meals']);
    expect(filterCatalog(flat, { ...NO_FILTERS, favorites: true, category: 'health' }, ctx)).toEqual([]);
  });
  it('sans aucun profil (G) : tout reste explorable, en « à découvrir » qui mène à « Modifier mon parcours »', () => {
    const mine = flattenCatalog(toolCatalog({ scope: 'none' }));
    const locked = lockedEntries(new Set(mine.map((x) => x.id)));
    const all = new Set([...mine, ...locked].map((x) => x.id));
    for (const d of CATEGORY_TOOLS) expect(all.has(d.id)).toBe(true);
    for (const e of H200_VIEWS) expect(all.has(e.id)).toBe(true);
    for (const l of locked) { expect(l.locked).toBe(true); expect(l.href).toBe('/journeys'); }
  });
});
