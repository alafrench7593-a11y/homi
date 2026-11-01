// État des services (écran développeur) : renvoie seulement « configuré » ou non, jamais une clé.
import { corsHeaders, json, requireUser, withCors } from '../_shared/http.ts';
import { serviceStatus } from '../_shared/service-status.ts';

Deno.serve(withCors(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  return json({ status: 'ok', services: serviceStatus((k) => Deno.env.get(k)), checked_at: new Date().toISOString() });
}));
