/**
 * Retrouve l'outil (catégorie, icône) correspondant à l'écran affiché, à partir de son adresse : chaque outil
 * s'ouvre alors comme une « mini-app » avec son propre en-tête (couleur, glyphe), sans que chaque écran ait à le déclarer.
 * Les identifiants (enfant, biberon…) et la plupart des paramètres sont ignorés ; le plus long chemin connu l'emporte.
 */
import type { IconName } from '@/components/ui';
import type { ToolTheme } from '@/lib/domain/toolCatalog';
import { SCOPES, TOOLS, type ScopeCtx } from '@/lib/journeys/tools';

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
  for (const k of ['tab']) { const v = keep.get(k); if (v) kept.push(`${k}=${v}`); }
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
