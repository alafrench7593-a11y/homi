/**
 * Catalogue COMPLET filtré (« Mes outils », 20/11/2026) — logique pure, testée (catalogFilters.test.ts).
 *  - toutes les entrées : les outils, puis leurs fonctions exposées comme sous-accès nommés (liste des 200) ;
 *  - les outils d'un profil que le foyer n'a pas (encore) : entrées « à découvrir » (`locked`) dont la fiche explique
 *    ce qu'il faut ajouter (enfant, grossesse, parcours) et mène à « Modifier mon parcours » — jamais un bouton mort ;
 *  - filtres combinables : catégorie, âge (étape d'enfant), étape de vie, favoris, récents.
 */
import { t as tr, tMaybe } from '@/i18n';
import { isFreeRoute } from '@/lib/premium/access';
import { CATEGORY_TOOLS, REAL_TOOLS, TOOL_FNS, toolDescKey, toolLabelKey, toolProfiles, type ToolShelf } from '@/lib/journeys/tools';
import { STAGE_MONTHS, toolMeta, type ChildStage, type LifeStage } from '@/lib/personalization/toolMeta';
import { subAsTool, type CatalogTool } from './toolCatalog';

export interface CatalogFilters { category: ToolShelf | null; age: ChildStage | null; stage: LifeStage | null; favorites: boolean; recents: boolean }
export const NO_FILTERS: CatalogFilters = { category: null, age: null, stage: null, favorites: false, recents: false };
export const filtersActive = (f: CatalogFilters) => !!(f.category || f.age || f.stage || f.favorites || f.recents);

/** Outils, puis leurs fonctions nommées (`h200_<n>`), à plat. */
export function flattenCatalog(tools: CatalogTool[]): CatalogTool[] {
  return tools.flatMap((t) => [t, ...(t.fns ?? []).map((s) => subAsTool(t, s))]);
}

/**
 * Entrées « à découvrir » : outils (et leurs fonctions nommées) qu'aucun profil du foyer n'ouvre encore. Elles
 * s'ouvrent sur leur fiche, dont l'action mène à « Modifier mon parcours » (ajouter l'enfant, la grossesse, le parcours).
 */
export function lockedEntries(reachable: Set<string>): CatalogTool[] {
  const out: CatalogTool[] = [];
  for (const def of [...CATEGORY_TOOLS, ...REAL_TOOLS.filter((d) => d.category === 'community')]) {
    const base: CatalogTool = {
      id: def.id, key: def.id, category: def.category, theme: def.theme, icon: def.icon, label: tr(toolLabelKey(def.id)), sub: tMaybe(toolDescKey(def.id)) || undefined,
      href: '/journeys', profiles: toolProfiles(def), free: isFreeRoute('/journeys'), universal: !!def.universal, also: [], subs: [], fns: [], locked: true,
    };
    if (!reachable.has(def.id)) out.push(base);
    for (const s of TOOL_FNS[def.id] ?? []) {
      if (reachable.has(s.id)) continue;
      out.push({ ...base, id: s.id, key: s.id, icon: s.icon, category: s.category ?? def.category, label: tr(toolLabelKey(s.id)), sub: tMaybe(toolDescKey(s.id)) || undefined, parent: def.id, fns: [] });
    }
  }
  return out;
}

function inRange(meta: ReturnType<typeof toolMeta>, age: ChildStage): boolean {
  if (!meta) return false;
  if (meta.lifeStages.includes(age)) return true;
  if (!meta.ageRange) return false;
  const [a, b] = STAGE_MONTHS[age];
  return meta.ageRange[0] < b && meta.ageRange[1] > a;
}

export function filterCatalog(entries: CatalogTool[], f: CatalogFilters, ctx: { favorites: Set<string>; recents: string[] }): CatalogTool[] {
  const recent = new Set(ctx.recents);
  return entries.filter((e) => {
    if (f.category && e.category !== f.category) return false;
    if (f.favorites && !ctx.favorites.has(e.id)) return false;
    if (f.recents && !recent.has(e.id)) return false;
    const meta = f.age || f.stage ? toolMeta(e.id) : null;
    if (f.age && !inRange(meta, f.age)) return false;
    if (f.stage && !meta?.lifeStages.includes(f.stage)) return false;
    return true;
  });
}
