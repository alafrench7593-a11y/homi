/**
 * Nettoyage du stockage (QA 02/11/2026, B-10) : supprime les fichiers listés dans public.storage_deletions
 * (photos dont la ligne a été effacée par la base), par lots, puis retire les lignes traitées.
 * Un lot en échec reste dans la file (attempts + 1) et sera retenté au passage suivant.
 */
export type CleanupRow = { id: number; bucket: string; path: string; attempts: number };
export type CleanupStore = {
  next(limit: number): Promise<CleanupRow[]>;
  remove(bucket: string, paths: string[]): Promise<boolean>;
  done(ids: number[]): Promise<void>;
  failed(ids: number[]): Promise<void>;
};

export async function runStorageCleanup(store: CleanupStore, limit = 500, batch = 100): Promise<{ removed: number; failed: number }> {
  const rows = await store.next(limit);
  const byBucket = new Map<string, CleanupRow[]>();
  for (const r of rows) byBucket.set(r.bucket, [...(byBucket.get(r.bucket) ?? []), r]);
  let removed = 0;
  let failed = 0;
  for (const [bucket, list] of byBucket) {
    for (let i = 0; i < list.length; i += batch) {
      const chunk = list.slice(i, i + batch);
      if (await store.remove(bucket, chunk.map((r) => r.path))) { await store.done(chunk.map((r) => r.id)); removed += chunk.length; }
      else { await store.failed(chunk.map((r) => r.id)); failed += chunk.length; }
    }
  }
  return { removed, failed };
}
