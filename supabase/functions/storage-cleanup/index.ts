// Nettoyage du stockage (B-10) : à planifier (Supabase Cron, toutes les heures par exemple) avec
// l'en-tête x-cleanup-secret = STORAGE_CLEANUP_SECRET. Supprime les fichiers des photos effacées par la base.
import { adminClient, env, json, safeEqual } from '../_shared/http.ts';
import { runStorageCleanup } from '../_shared/storage-cleanup.ts';

Deno.serve(async (req) => {
  if (!safeEqual(req.headers.get('x-cleanup-secret') ?? '', env('STORAGE_CLEANUP_SECRET'))) return json({ error: 'unauthorized' }, 401);
  const admin = adminClient();
  const result = await runStorageCleanup({
    async next(limit) {
      const { data } = await admin.from('storage_deletions').select('id,bucket,path,attempts').lt('attempts', 5).order('queued_at').limit(limit);
      return data ?? [];
    },
    async remove(bucket, paths) {
      const { error } = await admin.storage.from(bucket).remove(paths);
      return !error;
    },
    async done(ids) { await admin.from('storage_deletions').delete().in('id', ids); },
    async failed(ids) {
      const { data } = await admin.from('storage_deletions').select('id,attempts').in('id', ids);
      for (const r of data ?? []) await admin.from('storage_deletions').update({ attempts: r.attempts + 1 }).eq('id', r.id);
    },
  });
  if (result.failed) console.error('storage_cleanup_failed', result.failed);
  return json(result);
});
