// Formulaire de contact du site : POST JSON → e-mail vers homixyz@gmail.com par Resend.
// Secrets : RESEND_API_KEY, RESEND_FROM_EMAIL (adresse d'un domaine vérifié chez Resend, ex. contact@homifamille.com).
// Déploiement : `supabase functions deploy contact --no-verify-jwt` (public), puis CONTACT_ENDPOINT au build du site.
import { buildMail, checkContact, rateLimited } from '../_shared/contact.ts';

const ORIGINS = (Deno.env.get('CONTACT_ORIGINS') ?? 'https://homifamille.com,https://www.homifamille.com').split(',').map((s) => s.trim());
const headers = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && ORIGINS.includes(origin) ? origin : ORIGINS[0],
  'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type', Vary: 'Origin',
  'Content-Type': 'application/json; charset=utf-8',
});
const reply = (o: string | null, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: headers(o) });

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers(origin) });
  if (req.method !== 'POST') return reply(origin, { ok: false, error: 'method' }, 405);
  if (origin && !ORIGINS.includes(origin)) return reply(origin, { ok: false, error: 'origin' }, 403);
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'inconnue';
  if (rateLimited(ip)) return reply(origin, { ok: false, error: 'rate' }, 429);
  let body: unknown;
  try { body = await req.json(); } catch { return reply(origin, { ok: false, error: 'json' }, 400); }
  const c = checkContact(body);
  if (!c.ok) return c.spam ? reply(origin, { ok: true }) : reply(origin, { ok: false, error: c.error }, 400);   // robot : réponse neutre, rien envoyé
  const key = Deno.env.get('RESEND_API_KEY') ?? ''; const from = Deno.env.get('RESEND_FROM_EMAIL') ?? '';
  if (!key || !from) return reply(origin, { ok: false, error: 'not_configured' }, 503);
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildMail(c.value, from)) }).catch(() => null);
  if (!r || !r.ok) { console.error('contact_send_failed', r?.status ?? 'network'); return reply(origin, { ok: false, error: 'send' }, 502); }
  return reply(origin, { ok: true });
});
