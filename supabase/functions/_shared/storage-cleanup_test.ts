// Nettoyage du stockage (B-10).
function assertEquals(a: unknown, b: unknown) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`);
}
import { runStorageCleanup, type CleanupRow } from './storage-cleanup.ts';

Deno.test('nettoyage du stockage : fichiers supprimés par compartiment, échecs gardés dans la file', async () => {
  const queue: CleanupRow[] = [
    { id: 1, bucket: 'community', path: 'a/1.jpg', attempts: 0 },
    { id: 2, bucket: 'community', path: 'a/2.jpg', attempts: 0 },
    { id: 3, bucket: 'child-photos', path: 'h/c/3.jpg', attempts: 0 },
  ];
  const removedPaths: string[] = [];
  const failedIds: number[] = [];
  const res = await runStorageCleanup({
    next: async () => queue,
    remove: async (bucket, paths) => { if (bucket === 'child-photos') return false; removedPaths.push(...paths); return true; },
    done: async (ids) => { for (const id of ids) queue.splice(queue.findIndex((r) => r.id === id), 1); },
    failed: async (ids) => { failedIds.push(...ids); },
  }, 500, 1);
  assertEquals(res, { removed: 2, failed: 1 });
  assertEquals(removedPaths, ['a/1.jpg', 'a/2.jpg']);
  assertEquals(failedIds, [3]);
  assertEquals(queue.map((r) => r.id), [3]);
});
