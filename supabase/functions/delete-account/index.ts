// Suppression définitive du compte. POST { confirm: "SUPPRIMER" }
// 1) efface les photos chiffrées du cycle (« cycle-private/<uid>/… ») ;
// 2) supprime les données (transfert d'un foyer partagé au coparent) ;
// 3) efface les fichiers privés correspondants du stockage « documents ».
// Aucun nom de fichier n'est journalisé.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { adminClient, corsHeaders, json, rateLimit, requireUser } from '../_shared/http.ts';

const PAGE = 100;

/** Liste (par pages) puis supprime (par lots de 100) tous les fichiers du dossier de la personne. */
async function removeCyclePhotos(admin: SupabaseClient, userId: string): Promise<{ ok: boolean; count: number }> {
  const bucket = admin.storage.from('cycle-private');
  const paths: string[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await bucket.list(userId, { limit: PAGE, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) return { ok: false, count: 0 };
    for (const f of data ?? []) if (f.name) paths.push(`${userId}/${f.name}`);
    if (!data || data.length < PAGE) break;
  }
  for (let i = 0; i < paths.length; i += PAGE) {
    const { error } = await bucket.remove(paths.slice(i, i + PAGE));
    if (error) return { ok: false, count: i };
  }
  return { ok: true, count: paths.length };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const admin = adminClient();
  if (!(await rateLimit(admin, `delete:${auth.user.id}`, 3, 3600))) return json({ error: 'rate_limited' }, 429);

  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== 'SUPPRIMER') return json({ error: 'confirmation_required' }, 400);

  // Photos intimes d'abord : en cas d'échec, le compte n'est pas supprimé et la personne peut réessayer
  // (évite de laisser des fichiers orphelins impossibles à rattacher à quelqu'un).
  const cycle = await removeCyclePhotos(admin, auth.user.id);
  if (!cycle.ok) {
    console.error('delete_account_cycle_storage_error');
    return json({ error: 'server_error' }, 500);
  }

  const { data: paths, error } = await admin.rpc('delete_user_account', { p_user: auth.user.id });
  if (error) {
    console.error('delete_account_error', error.code);
    return json({ error: 'server_error' }, 500);
  }
  const files = (paths ?? []) as string[];
  for (let i = 0; i < files.length; i += PAGE) {
    await admin.storage.from('documents').remove(files.slice(i, i + PAGE));
  }
  return json({ ok: true, files_removed: files.length + cycle.count });
});
