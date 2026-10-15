// Suppression définitive du compte. POST { confirm: "SUPPRIMER" }
// 1) supprime les données (transfert d'un foyer partagé au coparent),
// 2) efface les fichiers privés correspondants du stockage.
import { adminClient, corsHeaders, json, rateLimit, requireUser } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const admin = adminClient();
  if (!(await rateLimit(admin, `delete:${auth.user.id}`, 3, 3600))) return json({ error: 'rate_limited' }, 429);

  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== 'SUPPRIMER') return json({ error: 'confirmation_required' }, 400);

  const { data: paths, error } = await admin.rpc('delete_user_account', { p_user: auth.user.id });
  if (error) {
    console.error('delete_account_error', error.code);
    return json({ error: 'server_error' }, 500);
  }
  const files = (paths ?? []) as string[];
  for (let i = 0; i < files.length; i += 100) {
    await admin.storage.from('documents').remove(files.slice(i, i + 100));
  }
  return json({ ok: true, files_removed: files.length });
});
