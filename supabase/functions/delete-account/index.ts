// Suppression définitive du compte. POST { confirm: "SUPPRIMER" }
// 1) efface les photos chiffrées du cycle (« cycle-private/<uid>/… ») et les photos de la communauté
//    (« community/<uid>/… » : avatar et photos publiées) ;
// 2) supprime les données (transfert d'un foyer partagé au coparent) ;
// 3) efface les fichiers privés correspondants du stockage « documents » (3 tentatives ; un échec
//    persistant est journalisé, jamais ignoré).
// Aucun nom de fichier n'est journalisé.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { adminClient, corsHeaders, json, rateLimit, requireUser, withCors } from '../_shared/http.ts';

const PAGE = 100;

/** Liste (par pages) puis supprime (par lots de 100) tous les fichiers du dossier de la personne. */
async function removeUserFolder(admin: SupabaseClient, bucketId: string, userId: string): Promise<{ ok: boolean; count: number }> {
  const bucket = admin.storage.from(bucketId);
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

/** Supprime un lot de fichiers, avec jusqu'à 3 tentatives espacées. */
async function removeWithRetry(admin: SupabaseClient, bucketId: string, batch: string[]): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await admin.storage.from(bucketId).remove(batch);
    if (!error) return true;
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  return false;
}

Deno.serve(withCors(async (req) => {
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
  const cycle = await removeUserFolder(admin, 'cycle-private', auth.user.id);
  const community = await removeUserFolder(admin, 'community', auth.user.id);
  if (!cycle.ok || !community.ok) {
    console.error('delete_account_cycle_storage_error');
    return json({ error: 'server_error' }, 500);
  }

  // Album des enfants : fichiers des foyers qui vont disparaître + photos privées de la personne
  const { data: photoPaths, error: photoErr } = await admin.rpc('child_photo_paths_for_account', { p_user: auth.user.id });
  if (photoErr) {
    console.error('delete_account_child_photos_error', photoErr.code);
    return json({ error: 'server_error' }, 500);
  }
  const photos = (photoPaths ?? []) as string[];
  for (let i = 0; i < photos.length; i += PAGE) {
    const { error: rmErr } = await admin.storage.from('child-photos').remove(photos.slice(i, i + PAGE));
    if (rmErr) {
      console.error('delete_account_child_photos_storage_error');
      return json({ error: 'server_error' }, 500);
    }
  }
  const { error: forgetErr } = await admin.rpc('forget_private_child_photos', { p_user: auth.user.id });
  if (forgetErr) {
    console.error('delete_account_child_photos_error', forgetErr.code);
    return json({ error: 'server_error' }, 500);
  }

  const { data: paths, error } = await admin.rpc('delete_user_account', { p_user: auth.user.id });
  if (error) {
    console.error('delete_account_error', error.code);
    return json({ error: 'server_error' }, 500);
  }
  const files = (paths ?? []) as string[];
  // Les données sont déjà effacées : on ne peut plus annuler. Chaque lot de documents est donc
  // réessayé (3 tentatives) et un échec persistant est journalisé (nombre seulement, jamais de nom de
  // fichier) pour être repris à la main au lieu d'être ignoré en silence.
  let pending = 0;
  for (let i = 0; i < files.length; i += PAGE) {
    if (!(await removeWithRetry(admin, 'documents', files.slice(i, i + PAGE)))) pending += files.slice(i, i + PAGE).length;
  }
  if (pending > 0) console.error('delete_account_documents_pending', pending);
  return json({ ok: true, files_removed: files.length - pending + photos.length + cycle.count + community.count, files_pending: pending });
}));
