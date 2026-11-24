// Alerte de modération : appelée par l'app juste après un signalement (publication, commentaire ou membre).
// Prévient la modératrice par e-mail (MODERATION_EMAIL, sinon l'adresse de contact), une seule fois par signalement.
// Secrets : RESEND_API_KEY, RESEND_FROM_EMAIL (déjà utilisés pour les e-mails de connexion).
import { adminClient, json, requireUser, withCors } from '../_shared/http.ts';
import { buildAlert, shouldAlert } from '../_shared/moderation-alert.ts';
import { sendWithResend } from '../auth-email/email.ts';

Deno.serve(withCors(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const admin = adminClient();
  // Le dernier signalement de CETTE personne : on ne peut pas déclencher d'alerte pour le signalement d'un autre
  const { data: r } = await admin.from('reports').select('id,reason,details,created_at,post_id,comment_id,reported_user,alerted_at')
    .eq('reporter_id', auth.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!r || !shouldAlert(r)) return json({ ok: true, sent: false });
  // Verrou : un seul envoi même si l'app appelle deux fois
  const { data: locked } = await admin.from('reports').update({ alerted_at: new Date().toISOString() }).eq('id', r.id).is('alerted_at', null).select('id');
  if (!locked?.length) return json({ ok: true, sent: false });
  let excerpt: string | null = null;
  if (r.post_id) excerpt = (await admin.from('posts').select('body').eq('id', r.post_id).maybeSingle()).data?.body ?? null;
  else if (r.comment_id) excerpt = (await admin.from('comments').select('body').eq('id', r.comment_id).maybeSingle()).data?.body ?? null;
  const apiKey = Deno.env.get('RESEND_API_KEY') ?? '';
  const from = Deno.env.get('RESEND_FROM_EMAIL') ?? '';
  const to = Deno.env.get('MODERATION_EMAIL') || 'homiyxz@gmail.com';
  if (!apiKey || !from) { console.error('moderation_alert_not_configured'); return json({ ok: true, sent: false }); }
  const sent = await sendWithResend(apiKey, from, to, buildAlert({ ...r, excerpt }));
  if (!sent.ok) {
    await admin.from('reports').update({ alerted_at: null }).eq('id', r.id); // réessai possible au prochain appel
    console.error('moderation_alert_resend', sent.status);
  }
  return json({ ok: true, sent: sent.ok });
}));
