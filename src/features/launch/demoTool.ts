/**
 * Outil du catalogue ouvert directement depuis la page publique (/outil/<id>, et /demo?outil=<id>) : même catalogue
 * que l'application, résolu pour l'enfant affiché s'il y en a un, sinon pour le plus jeune enfant du foyer.
 * Les enfants viennent du backend actif (vrai compte : droits du serveur ; démonstration : famille fictive).
 */
import { backend } from '@/lib/backend';
import { findEntry, toolCatalog } from '@/lib/domain/toolCatalog';

const DAY = 86_400_000;
type Kid = { id: string; birth_date: string | null; archived?: boolean };

export async function familyToolHref(toolId: string, preferredChildId?: string | null): Promise<string | null> {
  const kids = await backend.select<Kid>({ table: 'children' });
  const live = kids.filter((k) => !k.archived).sort((a, b) => String(b.birth_date).localeCompare(String(a.birth_date)));
  const child = live.find((k) => k.id === preferredChildId) ?? live[0];
  if (!child) return null;
  const isBaby = !!child.birth_date && Date.now() - Date.parse(child.birth_date) < 2 * 365 * DAY;
  const ctx = { scope: isBaby ? ('baby' as const) : ('child' as const), childId: child.id, babyId: isBaby ? child.id : null };
  return findEntry(toolCatalog(ctx), toolId)?.href ?? null;
}

/** Ancien nom (démo publique). */
export const demoToolHref = (toolId: string) => familyToolHref(toolId);
