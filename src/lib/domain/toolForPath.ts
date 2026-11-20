/**
 * Retrouve l'outil (catégorie, icône) correspondant à l'écran affiché, à partir de son adresse : chaque outil
 * s'ouvre alors comme une « mini-app » avec son propre en-tête (couleur, glyphe), sans que chaque écran ait à le déclarer.
 * Les identifiants (enfant, biberon…) et la plupart des paramètres sont ignorés ; le plus long chemin connu l'emporte.
 */
import type { IconName } from '@/components/ui';
import type { ToolTheme } from '@/lib/domain/toolCatalog';
import { H200_VIEWS } from '@/lib/journeys/homi200';
import { SCOPES, subRef, TOOLS, type ScopeCtx } from '@/lib/journeys/tools';

/** `id` : identifiant stable de l'outil, ou `<outil>.<sous-accès>` quand l'écran est un sous-accès (guide, onglet, filtre). */
export interface PathTool { id: string; theme: ToolTheme; icon: IconName; urgent?: boolean }

const ID = '__id__';

/** Normalise une adresse : identifiants remplacés, paramètres gardés seulement s'ils distinguent un outil (tab, q, cat…). */
export function normalizeToolPath(href: string): string {
  const [path, query = ''] = href.split('?');
  let p = path.replace(/^\/\(tabs\)/, '').replace(/\/+$/, '') || '/';
  // écrans fixes qui partagent ces dossiers avec un identifiant (ex. /bottle/scoops, /bottle/history) : jamais remplacés
  if (!/^\/bottle\/(scoops|history)$/.test(p)) p = p.replace(/\/(child|bottle|sleep)\/[^/]+/, `/$1/${ID}`);
  const keep = new URLSearchParams(query);
  const kept: string[] = [];
  for (const k of ['tab', 'all']) { const v = keep.get(k); if (v) kept.push(`${k}=${v}`); }
  return kept.length ? `${p}?${kept.join('&')}` : p;
}

let INDEX: Map<string, PathTool> | null = null;
function index() {
  if (INDEX) return INDEX;
  INDEX = new Map();
  const ctxs: ScopeCtx[] = SCOPES.flatMap((scope) => [
    { scope, childId: ID, babyId: ID, postpartum: true },
    { scope },
  ]);
  for (const tool of TOOLS) {
    for (const c of ctxs) {
      let href: string | null = null;
      try { href = tool.href(c); } catch { href = null; }
      if (!href) continue;
      const key = normalizeToolPath(href);
      // le premier outil déclaré pour une adresse donne l'identité (catégorie principale)
      if (!INDEX.has(key)) INDEX.set(key, { id: tool.id, theme: tool.theme, icon: tool.icon, urgent: tool.urgent });
    }
  }
  // sous-accès (guides, onglets, filtres) : après tous les outils, pour qu'un outil garde toujours son adresse
  for (const tool of TOOLS) {
    for (const sub of tool.subs ?? []) {
      for (const c of ctxs) {
        let href: string | null = null;
        try { href = sub.href(c); } catch { href = null; }
        if (!href) continue;
        const key = normalizeToolPath(href);
        if (!INDEX.has(key)) INDEX.set(key, { id: subRef(tool.id, sub.id), theme: tool.theme, icon: sub.icon });
      }
    }
  }
  // fonctions nommées propres à l'enfant (langage, jeux, activités, devoirs…) : un écran à elles, avec leur
  // pictogramme et leurs lectures, plutôt que la fiche générique de l'enfant (après les outils et sous-accès)
  for (const e of H200_VIEWS) {
    if (!e.view?.kidPath || e.view.kidPath.includes('?')) continue;
    const key = normalizeToolPath(e.view.kidPath.replace(':id', ID));
    const def = TOOLS.find((d) => d.id === e.target);
    if (def && !INDEX.has(key)) INDEX.set(key, { id: e.id, theme: def.theme, icon: e.icon ?? def.icon });
  }
  return INDEX;
}

/** Outil de l'écran affiché, ou null (écran qui n'est pas un outil : accueil, réglages d'un compte…). */
export function toolForPath(pathname: string, search?: string): PathTool | null {
  const idx = index();
  const full = normalizeToolPath(search ? `${pathname}?${search}` : pathname);
  if (idx.has(full)) return idx.get(full)!;
  const bare = full.split('?')[0];
  if (idx.has(bare)) return idx.get(bare)!;
  // sous-écran d'un outil (ex. /scanner/product/123) : on remonte au chemin connu le plus proche
  const parts = bare.split('/');
  for (let n = parts.length - 1; n > 1; n--) {
    const up = parts.slice(0, n).join('/');
    if (idx.has(up)) return idx.get(up)!;
  }
  return null;
}
