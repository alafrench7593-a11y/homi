// Hook « Send Email » de Supabase Auth : e-mails de confirmation, connexion et récupération du mot de passe via Resend.
// Secrets : RESEND_API_KEY, RESEND_FROM_EMAIL, SEND_EMAIL_HOOK_SECRET (affiché par Supabase en activant le hook).
// Déploiement : supabase functions deploy auth-email --no-verify-jwt  (la signature du hook remplace le JWT)
import { buildEmail, sendWithResend, verifyHook, type HookPayload } from './email.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Méthode non autorisée', { status: 405 });
  const body = await req.text();
  const secret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? '';
  if (!(await verifyHook(secret, req.headers, body))) {
    return new Response(JSON.stringify({ error: { http_code: 401, message: 'Signature du hook invalide' } }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const apiKey = Deno.env.get('RESEND_API_KEY') ?? '';
  const from = Deno.env.get('RESEND_FROM_EMAIL') ?? '';
  if (!apiKey || !from) {
    // Aucune simulation : l'envoi échoue explicitement et Supabase Auth renvoie l'erreur à l'application.
    return new Response(JSON.stringify({ error: { http_code: 500, message: 'Envoi d’e-mail non configuré : RESEND_API_KEY et RESEND_FROM_EMAIL manquants' } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const payload = JSON.parse(body) as HookPayload;
  const mail = buildEmail(Deno.env.get('APP_NAME') ?? 'Au fil de nous', Deno.env.get('SUPABASE_URL') ?? '', payload);
  const sent = await sendWithResend(apiKey, from, payload.user.email, mail);
  if (!sent.ok) {
    console.error('resend_error', sent.status);
    return new Response(JSON.stringify({ error: { http_code: 502, message: `Resend a refusé l’envoi (${sent.status})` } }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
});
