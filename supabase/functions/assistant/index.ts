// Fonction « assistant » — la clé du fournisseur d'IA reste ICI, jamais dans l'application.
// POST { conversation_id?: string, message: string, context?: AssistantContext }
import { adminClient, corsHeaders, env, hasConsent, json, rateLimit, requireUser } from '../_shared/http.ts';
import { assessSafety, auditAnswer, crisisMessage } from '../_shared/safety.ts';
import { ASSISTANT_FOOTER, buildSystemPrompt, sanitizeContext, type ArticleRef } from '../_shared/assistant-prompt.ts';

const APP_NAME = Deno.env.get('APP_NAME') ?? 'Toi & Moi';
const MODEL = Deno.env.get('ASSISTANT_MODEL') ?? 'claude-sonnet-5-5';
const MAX_HISTORY = 12;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;
  const admin = adminClient();

  if (!(await rateLimit(admin, `assistant:${user.id}`, 8, 60))) {
    return json({ error: 'rate_limited', message: 'Beaucoup de questions en peu de temps. Réessayez dans une minute.' }, 429);
  }

  let body: { conversation_id?: string; message?: string; context?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  const message = (body.message ?? '').toString().trim();
  if (message.length < 2 || message.length > 4000) {
    return json({ error: 'bad_request', message: 'La question doit contenir entre 2 et 4 000 caractères.' }, 400);
  }

  // 1) Sécurité AVANT tout : réponse humaine immédiate, gratuite, sans IA
  const safety = assessSafety(message);
  if (safety.level !== 'none') {
    return json({
      conversation_id: body.conversation_id ?? null,
      answer: crisisMessage(safety.level),
      safety: safety.level,
      sources: [],
      show_emergency_resources: true,
      stored: false,
    });
  }

  if (!(await hasConsent(admin, user.id, 'ai_assistant'))) {
    return json({ error: 'consent_required', message: 'Pour utiliser l’assistant, acceptez d’abord ses conditions d’utilisation.' }, 403);
  }

  // 2) Quota (gratuit / premium), vérifié côté serveur
  const { data: quotaRows, error: quotaErr } = await admin.rpc('consume_assistant_quota', { p_user: user.id });
  if (quotaErr) return json({ error: 'server_error' }, 500);
  const quota = quotaRows?.[0];
  if (!quota?.allowed) {
    return json({ error: 'quota_reached', message: `Vous avez utilisé vos ${quota?.quota ?? ''} questions de ce mois.`, used: quota?.used, quota: quota?.quota }, 402);
  }

  const context = sanitizeContext(body.context);

  // 3) Articles de la bibliothèque (publiés) en lien avec la question
  const words = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 4)
    .slice(0, 6);
  let articles: ArticleRef[] = [];
  if (words.length) {
    const orFilter = words.map((w) => `title.ilike.%${w}%,summary.ilike.%${w}%,body_md.ilike.%${w}%`).join(',');
    const { data } = await admin.from('articles').select('slug,title,summary,sources').eq('status', 'published').or(orFilter).limit(4);
    articles = (data ?? []) as ArticleRef[];
  }

  // 4) Historique de la conversation (seulement celle de l'utilisateur)
  let conversationId = body.conversation_id ?? null;
  const { data: privacy } = await admin.from('privacy_settings').select('ai_history_enabled').eq('user_id', user.id).maybeSingle();
  const keepHistory = privacy?.ai_history_enabled !== false;
  const history: { role: 'user' | 'assistant'; content: string }[] = [];
  if (conversationId) {
    const { data: conv } = await admin.from('assistant_conversations').select('id').eq('id', conversationId).eq('user_id', user.id).maybeSingle();
    if (!conv) return json({ error: 'not_found' }, 404);
    const { data: msgs } = await admin
      .from('assistant_messages')
      .select('role,content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY);
    history.push(...((msgs ?? []).reverse() as typeof history));
  }

  // 5) Appel au modèle (ou mode démonstration si aucune clé n'est configurée)
  const apiKey = env('ANTHROPIC_API_KEY', false);
  let answer: string;
  let demo = false;
  if (apiKey) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 900,
        system: buildSystemPrompt(APP_NAME, context, articles),
        messages: [...history, { role: 'user', content: message }],
      }),
    });
    if (!res.ok) {
      console.error('llm_error', res.status); // jamais le contenu
      return json({ error: 'assistant_unavailable', message: 'L’assistant est momentanément indisponible. Réessayez dans un instant.' }, 503);
    }
    const out = await res.json();
    answer = (out.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('\n').trim();
  } else {
    demo = true;
    answer = articles.length
      ? `**Mode démonstration** (aucun service d’IA n’est encore connecté).\n\nVoici les articles de la bibliothèque qui semblent liés à votre question :\n${articles.map((a, i) => `• [${i + 1}] ${a.title} — ${a.summary}`).join('\n')}\n\nPour toute question sur votre santé ou celle de votre enfant, un professionnel reste la meilleure personne à qui la poser.`
      : `**Mode démonstration** (aucun service d’IA n’est encore connecté).\n\nJe n’ai pas trouvé d’article lié à votre question dans la bibliothèque. Notez votre question : vous pourrez la poser lors de votre prochain rendez-vous.`;
  }

  // 6) Contrôle de la réponse : formulations interdites -> réponse prudente
  const flags = auditAnswer(answer);
  if (flags.length) {
    answer =
      'Je préfère ne pas répondre précisément à cette question, car la réponse dépend de votre situation et doit venir d’un professionnel de santé (médecin, sage-femme, pédiatre ou pharmacien).\n\nJe peux en revanche vous aider à préparer les informations utiles à lui transmettre.';
  }
  answer += ASSISTANT_FOOTER;

  const sources = articles.map((a, i) => ({ ref: i + 1, title: a.title, slug: a.slug, sources: a.sources }));

  // 7) Historique privé (si la personne l'a activé)
  let assistantMessageId: string | null = null;
  if (keepHistory) {
    if (!conversationId) {
      const { data: conv } = await admin
        .from('assistant_conversations')
        .insert({ user_id: user.id, title: message.slice(0, 80), context_snapshot: context })
        .select('id')
        .single();
      conversationId = conv?.id ?? null;
    } else {
      await admin.from('assistant_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
    }
    if (conversationId) {
      await admin.from('assistant_messages').insert({ conversation_id: conversationId, user_id: user.id, role: 'user', content: message });
      const { data: am } = await admin
        .from('assistant_messages')
        .insert({ conversation_id: conversationId, user_id: user.id, role: 'assistant', content: answer, sources, safety_flags: flags })
        .select('id')
        .single();
      assistantMessageId = am?.id ?? null;
    }
  }

  return json({
    conversation_id: conversationId,
    message_id: assistantMessageId,
    answer,
    sources,
    safety: 'none',
    demo,
    quota: { used: quota.used, limit: quota.quota },
    stored: keepHistory,
  });
});
