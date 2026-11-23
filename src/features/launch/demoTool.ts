/** Démo publique : outil du catalogue ouvert directement depuis la page publique (/demo?outil=<id>). */
import { backend } from '@/lib/backend';
import { findEntry, toolCatalog } from '@/lib/domain/toolCatalog';

const DAY = 86_400_000;

/** Adresse de l'outil demandé dans la famille d'exemple (le plus jeune enfant de moins de 2 ans s'il y en a un). */
export async function demoToolHref(toolId: string): Promise<string | null> {
  const kids = await backend.select<{ id: string; birth_date: string | null; archived?: boolean }>({ table: 'children' });
  const live = kids.filter((k) => !k.archived).sort((a, b) => String(b.birth_date).localeCompare(String(a.birth_date)));
  const youngest = live[0];
  if (!youngest) return null;
  const isBaby = !!youngest.birth_date && Date.now() - Date.parse(youngest.birth_date) < 2 * 365 * DAY;
  const ctx = { scope: isBaby ? ('baby' as const) : ('child' as const), childId: youngest.id, babyId: isBaby ? youngest.id : null };
  return findEntry(toolCatalog(ctx), toolId)?.href ?? null;
}
