/**
 * Recherche d'outils de la page publique (/) : le MÊME catalogue et le MÊME moteur que l'application
 * (src/lib/domain/toolCatalog.ts + toolSearch.ts), compilés pour le navigateur par scripts/web/bundle-search.mjs.
 * Contexte : profils fictifs (aucune donnée de compte). Les cartes mènent à la démonstration : /demo?outil=<id>.
 */
import { toolCatalog, groupByCategory, categoryTitle, type CatalogTool } from '@/lib/domain/toolCatalog';
import { searchCatalog } from '@/lib/domain/toolSearch';
import type { Scope } from '@/lib/journeys/tools';

const ctx = (scope: Scope) => ({ scope, childId: 'demo-child', babyId: scope === 'baby' || scope === 'postpartum' ? 'demo-child' : null, pregnancyId: 'demo-pregnancy' });
const tools = toolCatalog(ctx('baby'));

const pick = (t: CatalogTool) => ({ id: t.parent ?? t.id, entry: t.id, label: t.label, sub: t.sub ?? '', category: t.category });

/** Étapes de vie proposées dans l'exploration (mêmes profils que l'application). */
const STAGES: { scope: Scope; title: string }[] = [
  { scope: 'ttc', title: 'Projet bébé' },
  { scope: 'pregnancy', title: 'Grossesse' },
  { scope: 'postpartum', title: 'Après la naissance' },
  { scope: 'baby', title: 'Bébé (0–2 ans)' },
  { scope: 'child', title: 'Enfant' },
  { scope: 'family', title: 'Toute la famille' },
];

const api = {
  count: tools.length,
  search(q: string) {
    const out = searchCatalog(tools, q, 6);
    return { understood: out.understood, results: out.results.map((r) => pick(r.tool)) };
  },
  categories() {
    return groupByCategory(tools).filter((g) => g.items.length).map((g) => ({ key: g.key, title: categoryTitle(g.key), items: g.items.map(pick) }));
  },
  stages() {
    return STAGES.map((s) => { const list = toolCatalog(ctx(s.scope)); return { key: s.scope, title: s.title, count: list.length, items: list.slice(0, 8).map(pick) }; });
  },
};

(globalThis as unknown as { homiTools: typeof api }).homiTools = api;
