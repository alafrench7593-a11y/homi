/**
 * Accès retiré à un enfant (périmètre d'un co-parent ou d'une personne de garde réduit, audit du 23/11/2026) : ses
 * données déjà chargées ne doivent plus rester sur l'appareil. Le cache des requêtes est enregistré 7 jours sur le
 * téléphone ; sans purge, l'onglet ouvert hors connexion montrait encore les saisies de l'enfant retiré. Les requêtes
 * dont la clé porte l'identifiant d'un enfant hors périmètre sont SUPPRIMÉES (pas seulement invalidées), puis tout le
 * reste est rechargé (listes du foyer filtrées par le serveur). Même chose pour la grossesse quand son accès est retiré.
 */
import type { QueryClient } from '@tanstack/react-query';

export interface ScopeLike { child_scope?: string[] | null; pregnancy_access?: boolean | null }

/**
 * Identifiants des enfants présents dans le cache : liste `children` ET colonne `child_id` de toute ligne en cache
 * (préproduction du 23/11/2026 : à la réouverture de l'app, la liste des enfants est déjà rechargée sans l'enfant
 * retiré alors que ses biberons, siestes… restaient dans le cache restauré du téléphone).
 */
function cachedChildIds(qc: QueryClient): Set<string> {
  const ids = new Set<string>();
  const scan = (v: unknown, depth: number) => {
    if (depth > 3 || v == null || typeof v !== 'object') return;
    if (Array.isArray(v)) { for (const x of v) scan(x, depth + 1); return; }
    const o = v as Record<string, unknown>;
    if (typeof o.child_id === 'string') ids.add(o.child_id);
    for (const k of ['pages', 'rows', 'data', 'items']) if (k in o) scan(o[k], depth + 1);
  };
  for (const q of qc.getQueryCache().getAll()) {
    const data = q.state.data;
    if (q.queryKey.includes('children') && Array.isArray(data)) for (const c of data as { id?: unknown }[]) if (typeof c?.id === 'string') ids.add(c.id);
    scan(data, 0);
  }
  return ids;
}

const PREGNANCY_TABLES = ['pregnancies', 'expected_babies', 'pregnancy_memories', 'pregnancy_symptom_logs', 'maternal_weights', 'pregnancy'];

/** Purge du cache pour un périmètre ; renvoie le nombre de requêtes supprimées. */
export function purgeForScope(qc: QueryClient, scope: ScopeLike, knownChildIds: readonly string[] = []): number {
  const allowed = scope.child_scope && scope.child_scope.length ? new Set(scope.child_scope) : null;
  // Enfants connus AVANT le changement (préproduction, 23/11/2026) : la liste `children` peut être rechargée, déjà
  // sans l'enfant retiré, avant l'arrivée des nouveaux droits ; le cache ne suffit donc pas à le retrouver.
  const known = new Set([...cachedChildIds(qc), ...knownChildIds]);
  const removed = allowed ? [...known].filter((id) => !allowed.has(id)) : [];
  const gone = new Set(removed);
  const noPregnancy = scope.pregnancy_access === false;
  let n = 0;
  qc.removeQueries({
    predicate: (q) => {
      const hit = q.queryKey.some((k) => gone.has(String(k))) || (noPregnancy && q.queryKey.some((k) => PREGNANCY_TABLES.includes(String(k))));
      if (hit) n++;
      return hit;
    },
  });
  // Listes du foyer (enfants, journal…) : rechargées, le serveur ne renvoie plus l'enfant retiré
  if (n || removed.length || noPregnancy) void qc.invalidateQueries();
  return n;
}

