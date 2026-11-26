/**
 * Communauté instantanée : mises à jour optimistes du cache TanStack Query.
 * Un like, un enregistrement ou un commentaire s'affichent tout de suite dans TOUTES les listes déjà chargées
 * (fil, recherche, profil, publication ouverte), puis le serveur confirme. En cas d'échec, l'état d'avant est rétabli.
 * Aucune donnée n'est inventée : on ne modifie que la publication touchée, avec les valeurs que l'utilisateur vient de choisir.
 */
import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { FeedComment } from '@/lib/types';

type Snapshot = [QueryKey, unknown][];
type Row = { id?: string } & Record<string, unknown>;

const isRowArray = (d: unknown): d is Row[] => Array.isArray(d) && d.every((x) => x && typeof x === 'object');

/** Applique `patch` à la publication `postId` dans tous les caches qui la contiennent ; renvoie de quoi annuler. */
export function patchPost(qc: QueryClient, postId: string, patch: (p: Row) => Row): Snapshot {
  const snap: Snapshot = [];
  for (const q of qc.getQueryCache().getAll()) {
    const d = q.state.data;
    if (!isRowArray(d) || !d.some((r) => r.id === postId && ('like_count' in r || 'liked' in r || 'saved' in r || 'comment_count' in r))) continue;
    snap.push([q.queryKey, d]);
    qc.setQueryData(q.queryKey, d.map((r) => (r.id === postId ? patch(r) : r)));
  }
  return snap;
}

export const likePatch = (liked: boolean) => (p: Row): Row => ({ ...p, liked, like_count: Math.max(0, Number(p.like_count ?? 0) + (liked ? 1 : -1)) });
export const savePatch = (saved: boolean) => (p: Row): Row => ({ ...p, saved });

/** Ajoute un commentaire « en cours d'envoi » à la discussion déjà chargée (+1 au compteur de la publication). */
export function addPendingComment(qc: QueryClient, comment: FeedComment): Snapshot {
  const snap = patchPost(qc, comment.post_id, (p) => ({ ...p, comment_count: Number(p.comment_count ?? 0) + 1 }));
  for (const q of qc.getQueryCache().getAll()) {
    const k = q.queryKey;
    if (!k.includes('comment_feed') || !k.includes(comment.post_id) || !Array.isArray(q.state.data)) continue;
    snap.push([k, q.state.data]);
    qc.setQueryData(k, [...(q.state.data as FeedComment[]), comment]);
  }
  return snap;
}

export function restore(qc: QueryClient, snap: Snapshot | undefined) {
  for (const [k, d] of snap ?? []) qc.setQueryData(k, d);
}

/** Marque les caches périmés sans les recharger tout de suite : pas de rechargement du fil entier après chaque cœur. */
export function markStale(qc: QueryClient, ...prefixes: string[]) {
  return qc.invalidateQueries({ predicate: (q) => prefixes.some((p) => q.queryKey.includes(p)), refetchType: 'none' });
}

export const PENDING = 'sending';
