/**
 * Accès retiré à un enfant (périmètre d'un co-parent ou d'une personne de garde réduit, audit du 23/11/2026) : ses
 * données déjà chargées ne doivent plus rester sur l'appareil. Le cache des requêtes est enregistré 7 jours sur le
 * téléphone ; sans purge, l'onglet ouvert hors connexion montrait encore les saisies de l'enfant retiré. Les requêtes
 * dont la clé porte l'identifiant d'un enfant hors périmètre sont SUPPRIMÉES (pas seulement invalidées), puis tout le
 * reste est rechargé (listes du foyer filtrées par le serveur). Même chose pour la grossesse quand son accès est retiré.
 */
import type { QueryClient } from '@tanstack/react-query';

export interface ScopeLike { child_scope?: string[] | null; pregnancy_access?: boolean | null }

/** Identifiants des enfants présents dans le cache (liste `children` et clés des requêtes). */
function cachedChildIds(qc: QueryClient): Set<string> {
  const ids = new Set<string>();
  for (const q of qc.getQueryCache().getAll()) {
    const data = q.state.data;
    if (q.queryKey.includes('children') && Array.isArray(data)) for (const c of data as { id?: unknown }[]) if (typeof c?.id === 'string') ids.add(c.id);
  }
  return ids;
}

const PREGNANCY_TABLES = ['pregnancies', 'expected_babies', 'pregnancy_memories', 'pregnancy_symptom_logs', 'maternal_weights', 'pregnancy'];

/** Purge du cache pour un périmètre ; renvoie le nombre de requêtes supprimées. */
export function purgeForScope(qc: QueryClient, scope: ScopeLike): number {
  const allowed = scope.child_scope && scope.child_scope.length ? new Set(scope.child_scope) : null;
  const removed = allowed ? [...cachedChildIds(qc)].filter((id) => !allowed.has(id)) : [];
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

