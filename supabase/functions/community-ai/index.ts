// Communauté (Premium) : résumé d'une longue discussion ou traduction d'un message, par Gemini (clé côté serveur).
// POST { action: 'summarize' | 'translate', post_id, comment_id?, target_lang? }
//
// Droits vérifiés ici : connexion, abonnement (has_premium), quota mensuel, et lecture du contenu AVEC les droits
// de la personne (RLS : publications et réponses qu'elle peut déjà lire). Seuls les textes sont transmis,
// mentions et coordonnées neutralisées ; jamais de pseudonyme ni de donnée de l'application.
// Sans GEMINI_API_KEY : { ai: 'not_configured' } — l'application l'indique, jamais un faux résumé.
import { adminClient, corsHeaders, hasConsent, json, rateLimit, requireUser, withCors } from '../_shared/http.ts';
import { geminiConfig } from '../_shared/gemini.ts';
import { readJsonBody } from '../_shared/body.ts';
import { MIN_COMMENTS_FOR_SUMMARY, parseRequest } from '../_shared/community-ai.ts';
import { runSummary, runTranslation } from '../_shared/community-ai-run.ts';

Deno.serve(withCors(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const raw = await readJsonBody(req, 4 * 1024);
  if (!raw) return json({ error: 'too_large' }, 413);
  const request = parseRequest(raw);
  if (!request) return json({ error: 'bad_request', message: 'Demande invalide.' }, 400);

  const { data: premium } = await auth.client.rpc('has_premium');
  if (!premium) return json({ error: 'premium_required', message: 'Fonction Premium.' }, 402);

  const cfg = geminiConfig();
  if (!cfg) return json({ ai: 'not_configured', message: 'Le résumé et la traduction par IA ne sont pas encore configurés.' });

  const admin = adminClient();
  // Même règle que l'assistant : rien n'est envoyé à l'IA sans l'accord « assistant IA » (désactivé par défaut)
  if (!(await hasConsent(admin, auth.user.id, 'ai_assistant'))) {
    return json({ ai: 'consent_required', message: 'Le résumé et la traduction par IA demandent votre accord : Réglages › Confidentialité › Assistant IA.' });
  }
  if (!(await rateLimit(admin, `community_ai:${auth.user.id}`, 30, 3600))) {
    return json({ ai: 'unavailable', message: 'Trop de demandes en une heure. Réessayez plus tard.' });
  }

  // Contenu lu avec les droits de la personne (vues forum_feed / comment_feed)
  const { data: post } = await auth.client.from('forum_feed').select('id, title, body, status').eq('id', request.post_id).maybeSingle();
  if (!post || post.status !== 'visible') return json({ error: 'not_found', message: 'Publication introuvable.' }, 404);

  if (request.action === 'summarize') {
    const { data: comments } = await auth.client.from('comment_feed').select('body, pseudonym, status').eq('post_id', request.post_id).eq('status', 'visible').order('created_at').limit(120);
    const list = (comments ?? []) as { body: string; pseudonym: string | null }[];
    if (list.length < MIN_COMMENTS_FOR_SUMMARY) return json({ error: 'too_short', message: 'Le résumé est proposé à partir de 6 réponses.' }, 400);
    const quota = await auth.client.rpc('consume_feature_quota', { p_key: 'community_ai_per_month' });
    if (!quota.data?.[0]?.allowed) return json({ error: 'quota_reached', message: 'Limite mensuelle atteinte.' }, 402);
    const result = await runSummary(cfg, post, list, list.map((c) => c.pseudonym ?? '').filter(Boolean));
    if (result.ai !== 'ok') console.error('community_ai', result.ai, 'reason' in result ? result.reason : '');
    const { reason: _r, ...publicResult } = result as Record<string, unknown>;
    return json(publicResult);
  }

  let text = `${post.title ? `${post.title}\n` : ''}${post.body}`;
  if (request.comment_id) {
    const { data: comment } = await auth.client.from('comment_feed').select('body, status').eq('id', request.comment_id).eq('post_id', request.post_id).maybeSingle();
    if (!comment || comment.status !== 'visible') return json({ error: 'not_found', message: 'Réponse introuvable.' }, 404);
    text = comment.body;
  }
  const quota = await auth.client.rpc('consume_feature_quota', { p_key: 'community_ai_per_month' });
  if (!quota.data?.[0]?.allowed) return json({ error: 'quota_reached', message: 'Limite mensuelle atteinte.' }, 402);
  const result = await runTranslation(cfg, text, request.target_lang ?? 'fr');
  const { reason: _r, ...publicResult } = result as Record<string, unknown>;
  return json(publicResult);
}));
