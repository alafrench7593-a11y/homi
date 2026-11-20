/**
 * Pictogramme et couleur de catégorie d'une entrée du catalogue, à partir de son identifiant (actuel OU ancien :
 * outil fusionné, sous-accès, numéro de la liste des 200), d'un raccourci de l'accueil (`quick.<clé>`) ou d'une
 * rangée de catégorie (`cat.<catégorie>`). Source : le manifeste (./manifest.ts).
 */
import { resolveTool } from '@/lib/journeys/tools';
import { ICON_CATEGORIES, type IconCategory } from './HomiIcon';
import { QUICK_ICON, SUB_ICON, TOOL_ICON, VIEW_ICON } from './manifest';
import { CATEGORY_HOMI_ICON, type HomiIconName } from './paths';

const isCategory = (c: string | undefined | null): c is IconCategory => !!c && (ICON_CATEGORIES as string[]).includes(c);

/** Nom du pictogramme d'une entrée, ou null si elle n'en a pas (repli sur l'ancien glyphe). */
export function toolIconName(id: string | null | undefined): HomiIconName | null {
  if (!id) return null;
  if (id.startsWith('quick.')) return QUICK_ICON[id.slice(6)] ?? null;
  if (id.startsWith('cat.')) {
    const c = id.slice(4);
    return isCategory(c) ? CATEGORY_HOMI_ICON[c] : c === 'account' ? 'gear' : c === 'community' ? 'group' : null;
  }
  const r = resolveTool(id);
  if (!r) return TOOL_ICON[id] ?? null;
  if (r.sub) return VIEW_ICON[r.id] ?? SUB_ICON[r.id] ?? TOOL_ICON[r.def.id] ?? null;
  return TOOL_ICON[r.def.id] ?? null;
}

/** Catégorie dont l'entrée prend la couleur (celle où elle est rangée) ; null : couleur de l'accent. */
export function toolIconCategory(id: string | null | undefined): IconCategory | null {
  if (!id) return null;
  if (id.startsWith('cat.')) return isCategory(id.slice(4)) ? (id.slice(4) as IconCategory) : null;
  const r = resolveTool(id);
  const c = r ? (r.sub?.category ?? r.def.category) : null;
  return isCategory(c) ? c : null;
}
