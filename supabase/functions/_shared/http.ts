// Utilitaires communs des fonctions backend (Deno, Supabase Edge Functions)
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

// CORS : l'application iPhone/Android n'est pas concernée (pas de navigateur). Seule la version web,
// servie depuis une adresse connue, peut appeler ces fonctions depuis un navigateur. Pas de cookie de
// connexion (jeton dans l'en-tête Authorization) : jamais d'Access-Control-Allow-Credentials.
// Liste : variable ALLOWED_ORIGINS (ex. « https://app.aufildenous.fr,http://localhost:8081 ») ;
// sans elle, seuls les serveurs de développement Expo locaux sont acceptés.
export const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEV_ORIGINS = ['http://localhost:8081', 'http://localhost:19006', 'http://127.0.0.1:8081'];

export function allowedOrigins(env: string | undefined = Deno.env.get('ALLOWED_ORIGINS')): string[] {
  const list = (env ?? '').split(',').map((o) => o.trim().replace(/\/+$/, '')).filter((o) => /^https?:\/\/[^\s/]+$/.test(o));
  return list.length ? list : DEV_ORIGINS;
}

/** En-têtes CORS pour CETTE demande : l'origine n'est renvoyée que si elle figure dans la liste. */
export function corsFor(origin: string | null, allowed: string[] = allowedOrigins()): Record<string, string> {
  const h: Record<string, string> = { ...corsHeaders, Vary: 'Origin' };
  if (origin && allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

/** Enveloppe une fonction : applique les en-têtes CORS de la demande à toutes ses réponses (flux compris). */
export function withCors(handler: (req: Request) => Response | Promise<Response>): (req: Request) => Promise<Response> {
  return async (req) => {
    const res = await handler(req);
    const headers = new Headers(res.headers);
    headers.delete('Access-Control-Allow-Origin');
    for (const [k, v] of Object.entries(corsFor(req.headers.get('origin')))) headers.set(k, v);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function env(name: string, required = true): string {
  const v = Deno.env.get(name) ?? '';
  if (required && !v) throw new Error(`Variable d'environnement manquante : ${name}`);
  return v;
}

/** Client « service » : contourne la RLS. À n'utiliser qu'après vérification des droits. */
export function adminClient(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Client agissant AVEC les droits de l'utilisateur (RLS appliquée). */
export function userClient(req: Request): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireUser(req: Request): Promise<{ user: User; client: SupabaseClient } | Response> {
  const client = userClient(req);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return json({ error: 'unauthorized', message: 'Connexion requise.' }, 401);
  return { user: data.user, client };
}

export async function rateLimit(admin: SupabaseClient, key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await admin.rpc('rate_limit_hit', { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
  if (error) {
    // Journal minimal, sans donnée personnelle. Refus par défaut : sans compteur, pas d'appels
    // illimités aux services payants (Gemini, Google Places…).
    console.error('rate_limit_error', error.code);
    return false;
  }
  return data === true;
}

export async function hasConsent(admin: SupabaseClient, userId: string, purpose: string): Promise<boolean> {
  const { data } = await admin
    .from('consents')
    .select('granted')
    .eq('user_id', userId)
    .eq('purpose', purpose)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.granted === true;
}

/** Comparaison de secrets en temps constant (pas d'indice sur la longueur commune par le temps de réponse). */
export function safeEqual(a: string, b: string): boolean {
  // Pas de retour anticipé sur la longueur : le temps ne dépend que de la plus longue chaîne
  const n = Math.max(a.length, b.length);
  let r = a.length ^ b.length;
  for (let i = 0; i < n; i++) r |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return r === 0;
}
