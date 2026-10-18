/**
 * Continuité « carte → outil » : l'écran qui s'ouvre sait depuis quelle carte on arrive et
 * reprend son glyphe dans l'en-tête (le glyphe semble glisser de la carte vers le titre).
 * Mémoire de session uniquement, aucune donnée personnelle.
 */
import type { IconName } from '@/components/ui';
import type { ToolTheme } from '@/lib/domain/toolCatalog';

export interface ToolOrigin { path: string; theme: ToolTheme; icon: IconName; urgent?: boolean; at: number; y?: number }
let last: ToolOrigin | null = null;

/** Chemin comparable à usePathname() : sans paramètres ni groupe de routes. */
export function normalizePath(href: string) {
  return (href.split('?')[0].replace(/\/\([^)]+\)/g, '') || '/').replace(/\/$/, '') || '/';
}

export function markToolOpen(o: Omit<ToolOrigin, 'at' | 'path'> & { href: string }) {
  last = { path: normalizePath(o.href), theme: o.theme, icon: o.icon, urgent: o.urgent, y: o.y, at: Date.now() };
}

/** Origine récente (moins de 3 s) correspondant à l'écran courant ; consommée une seule fois. */
export function takeToolOrigin(pathname: string, now = Date.now()): ToolOrigin | null {
  if (!last || now - last.at > 3000 || normalizePath(pathname) !== last.path) return null;
  const o = last;
  last = null;
  return o;
}

/** Lecture sans consommation (rendu) ; la consommation se fait ensuite, dans un effet. */
export function peekToolOrigin(pathname: string, now = Date.now()): ToolOrigin | null {
  if (!last || now - last.at > 3000 || normalizePath(pathname) !== last.path) return null;
  return last;
}
