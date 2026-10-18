// Flux d'abonnement iCalendar (Google Agenda, Apple Calendrier, Outlook) — synchronisation à SENS UNIQUE.
// GET /functions/v1/calendar-feed?token=<jeton secret>   (pas de JWT : les agendas externes n'en envoient pas)
// Le jeton est vérifié par la base (empreinte SHA-256, révocable) ; les droits de la personne sont appliqués
// par public.calendar_feed_data. Aucune donnée n'est journalisée ; un jeton invalide renvoie 404 sans détail.
// Limite : 60 requêtes / heure / jeton. Réponse mise en cache 15 min par les intermédiaires privés.
import { adminClient, rateLimit } from '../_shared/http.ts';
import { buildFeed, validToken, type FeedData } from '../_shared/calendar-feed.ts';

const text = (body: string, status: number) => new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

Deno.serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return text('Méthode non autorisée.', 405);
  const token = new URL(req.url).searchParams.get('token');
  if (!validToken(token)) return text('Lien d’agenda introuvable ou révoqué.', 404);
  const admin = adminClient();
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))).map((b) => b.toString(16).padStart(2, '0')).join('');
  if (!(await rateLimit(admin, `calendar-feed:${digest.slice(0, 16)}`, 60, 3600))) return text('Trop de requêtes : réessayez plus tard.', 429);
  const { data, error } = await admin.rpc('calendar_feed_data', { p_token: token });
  if (error) { console.error('calendar_feed_error', error.code); return text('Agenda momentanément indisponible.', 503); }
  if (!data) return text('Lien d’agenda introuvable ou révoqué.', 404);
  const ics = buildFeed(data as FeedData);
  return new Response(req.method === 'HEAD' ? null : ics, {
    status: 200,
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'inline; filename="agenda-familial.ics"', 'Cache-Control': 'private, max-age=900' },
  });
});
