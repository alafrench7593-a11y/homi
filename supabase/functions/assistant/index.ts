// Fonction « assistant » — la clé du fournisseur d'IA reste ICI, jamais dans l'application.
//
// POST { conversation_id?: string, message: string, use_context?: boolean, context?: AssistantContext, stream?: boolean }
//
// Réponses :
//  - JSON (application/json) : erreurs, orientation urgente, refus, ou réponse complète si stream=false ;
//  - SSE (text/event-stream) si stream=true : événements « meta », « delta » ({ text }), puis « done »
//    (même contenu que la réponse JSON complète) ou « error ».
import { adminClient, corsHeaders, json, rateLimit, requireUser } from '../_shared/http.ts';
import { geminiConfig, geminiGenerate, geminiStream, GeminiError, type GeminiTurn } from '../_shared/gemini.ts';
import { assessSafety, auditAnswer, crisisMessage, urgentContacts } from '../_shared/safety.ts';
import { ASSISTANT_FOOTER, buildSystemPrompt, sanitizeContext, type ArticleRef, type AssistantContext } from '../_shared/assistant-prompt.ts';
import {
  INJECTION_REFUSAL,
  MAX_QUESTION_LENGTH,
  encodeSse,
  isEmptyAnswer,
  looksLikePromptInjection,
  parseStructuredAnswer,
  structuredToMarkdown,
  todayIso,
  sanitizeRecentTurns,
  type StructuredAnswer,
} from '../_shared/assistant-format.ts';

const APP_NAME = Deno.env.get('APP_NAME') ?? 'Toi & Moi';

const MAX_HISTORY = 12;
const MAX_TOKENS = 1400;

const CAUTIOUS_ANSWER: StructuredAnswer = {
  short:
    'Je préfère ne pas répondre précisément à cette question : la réponse dépend de votre situation et doit venir d’un professionnel de santé (médecin, sage-femme, pédiatre ou pharmacien).',
  actions: ['Notez vos questions et ce que vous observez (depuis quand, à quelle fréquence) pour les transmettre au professionnel.'],
  watch: [],
  consult: ['Demandez l’avis de votre médecin, de votre sage-femme, du pédiatre ou d’un pharmacien.', 'En cas d’urgence : 15 ou 112 (114 par SMS).'],
  questions: [],
  sources: [],
  updated_on: null,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // 0) Authentification : le JWT est vérifié auprès de Supabase Auth ; `db` agit AVEC les droits
  //    de la personne (RLS). Le client « service » ne sert qu'au quota et à l'écriture des messages.
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user, client: db } = auth;
  const admin = adminClient();

  if (!(await rateLimit(admin, `assistant:${user.id}`, 8, 60)) || !(await rateLimit(admin, `assistant-day:${user.id}`, 120, 86400))) {
    return json({ error: 'rate_limited', message: 'Beaucoup de questions en peu de temps. Réessayez dans une minute.' }, 429);
  }

  let body: { conversation_id?: unknown; message?: unknown; context?: unknown; use_context?: unknown; stream?: unknown; recent_turns?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  const message = (typeof body.message === 'string' ? body.message : '').trim();
  if (message.length < 2 || message.length > MAX_QUESTION_LENGTH) {
    return json({ error: 'bad_request', message: `La question doit contenir entre 2 et ${MAX_QUESTION_LENGTH.toLocaleString('fr-FR')} caractères.` }, 400);
  }
  const requestedConversation = typeof body.conversation_id === 'string' && /^[0-9a-f-]{36}$/i.test(body.conversation_id) ? body.conversation_id : null;
  if (body.conversation_id != null && !requestedConversation) return json({ error: 'bad_request' }, 400);
  const useContext = body.use_context === true;
  const wantsStream = body.stream === true;

  // Conversation existante : elle doit appartenir à la personne (lecture sous RLS)
  if (requestedConversation) {
    const { data: conv } = await db.from('assistant_conversations').select('id').eq('id', requestedConversation).maybeSingle();
    if (!conv) return json({ error: 'not_found', message: 'Conversation introuvable.' }, 404);
  }

  // Historique conservé seulement avec l'accord explicite de la personne (20261029000200)
  const { data: privacy } = await db.from('privacy_settings').select('ai_history_enabled, ai_history_consented_at').eq('user_id', user.id).maybeSingle();
  const keepHistory = privacy?.ai_history_enabled === true && !!privacy?.ai_history_consented_at;
  const { data: consent } = await db
    .from('consents')
    .select('granted')
    .eq('user_id', user.id)
    .eq('purpose', 'ai_assistant')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const consented = consent?.granted === true;

  /** Enregistre l'échange dans l'historique privé (si activé). */
  async function store(answer: string, extra: { sources?: unknown; structured?: StructuredAnswer | null; flags?: string[]; safety?: string }) {
    if (!keepHistory || !consented) return { conversationId: requestedConversation, messageId: null as string | null };
    let conversationId = requestedConversation;
    if (!conversationId) {
      const { data: conv } = await db
        .from('assistant_conversations')
        .insert({ user_id: user.id, title: message.slice(0, 80), context_enabled: useContext, context_snapshot: {} })
        .select('id')
        .single();
      conversationId = conv?.id ?? null;
    } else {
      await db.from('assistant_conversations').update({ updated_at: new Date().toISOString(), context_enabled: useContext }).eq('id', conversationId);
    }
    if (!conversationId) return { conversationId: null, messageId: null };
    await admin.from('assistant_messages').insert({ conversation_id: conversationId, user_id: user.id, role: 'user', content: message });
    const { data: am } = await admin
      .from('assistant_messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: 'assistant',
        content: answer.slice(0, 12000),
        sources: extra.sources ?? [],
        structured: extra.structured ?? null,
        safety_flags: extra.flags ?? [],
        safety_level: extra.safety ?? 'none',
      })
      .select('id')
      .single();
    return { conversationId, messageId: (am?.id as string | undefined) ?? null };
  }

  // 1) Sécurité AVANT tout : orientation humaine immédiate, gratuite, sans IA
  const safety = assessSafety(message);
  if (safety.level !== 'none') {
    const answer = crisisMessage(safety.level);
    const saved = await store(answer, { safety: safety.level, flags: safety.reasons });
    return json({
      conversation_id: saved.conversationId,
      message_id: saved.messageId,
      answer,
      safety: safety.level,
      reasons: safety.reasons,
      urgent_contacts: urgentContacts(safety.level),
      sources: [],
      structured: null,
      show_emergency_resources: true,
      stored: !!saved.messageId,
    });
  }

  if (!consented) {
    return json({ error: 'consent_required', message: 'Pour utiliser l’assistant, acceptez d’abord ses conditions d’utilisation.' }, 403);
  }

  // 2) Tentative de détournement des consignes : refus poli, sans IA ni quota
  if (looksLikePromptInjection(message)) {
    const structured = { ...INJECTION_REFUSAL, updated_on: todayIso() };
    return json({ conversation_id: requestedConversation, message_id: null, answer: structured.short, structured, safety: 'none', sources: [], stored: false, refused: true });
  }

  // 3) Quota (gratuit / premium), vérifié et réservé côté serveur
  // L'IA n'est pas configurée : on le dit clairement, sans consommer de question ni simuler de réponse.
  const geminiOrNull = geminiConfig();
  if (!geminiOrNull) {
    // Message discret pour l'utilisatrice ; l'état détaillé est dans Réglages › État des services (mode développeur)
    console.error('assistant_not_configured');
    return json({ error: 'ai_not_configured', message: 'L’assistant n’est pas disponible pour le moment. Réessayez plus tard.' }, 503);
  }
  const gemini = geminiOrNull;

  const { data: quotaRows, error: quotaErr } = await admin.rpc('consume_assistant_quota', { p_user: user.id });
  if (quotaErr) return json({ error: 'server_error' }, 500);
  const quota = quotaRows?.[0];
  if (!quota?.allowed) {
    return json({ error: 'quota_reached', message: `Vous avez utilisé vos ${quota?.quota ?? ''} questions de ce mois.`, used: quota?.used, quota: quota?.quota }, 402);
  }
  const quotaOut = { used: quota.used as number, limit: quota.quota as number, remaining: Math.max(0, (quota.quota as number) - (quota.used as number)) };

  // 4) Contexte : UNIQUEMENT si la personne l'a autorisé pour cette conversation, nettoyé ici
  const context: AssistantContext | null = useContext ? sanitizeContext(body.context) : null;

  // 5) Articles publiés de la bibliothèque liés à la question (lecture sous RLS)
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
    const { data } = await db.from('articles').select('slug,title,summary,sources').eq('status', 'published').or(orFilter).limit(4);
    articles = (data ?? []) as ArticleRef[];
  }
  const articleRefs = articles.map((a, i) => ({ ref: i + 1, title: a.title, slug: a.slug, sources: a.sources }));

  // 6) Historique de la conversation (sous RLS : uniquement celle de la personne)
  const history: { role: 'user' | 'assistant'; content: string }[] = [];
  if (requestedConversation) {
    const { data: msgs } = await db
      .from('assistant_messages')
      .select('role,content,safety_level')
      .eq('conversation_id', requestedConversation)
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY);
    for (const m of (msgs ?? []).reverse()) {
      const last = history[history.length - 1];
      if (last && last.role === m.role) continue; // l'API exige une alternance stricte
      history.push({ role: m.role, content: String(m.content).slice(0, 4000) });
    }
    while (history.length && history[0].role !== 'user') history.shift();
    if (history.length && history[history.length - 1].role === 'user') history.pop();
  } else {
    // Historique non conservé : le contexte de la conversation vient de l'application, pour cette réponse seulement
    history.push(...sanitizeRecentTurns(body.recent_turns));
  }

  const devMode = false;
  const today = todayIso();

  /** Contrôle, structuration, filtrage des sources, enregistrement : réponse finale. */
  async function finalize(raw: string) {
    let structured = parseStructuredAnswer(raw, today);
    const flags = auditAnswer(raw);
    if (flags.length) structured = { ...CAUTIOUS_ANSWER, updated_on: today };
    if (isEmptyAnswer(structured)) structured = { ...CAUTIOUS_ANSWER, updated_on: today };
    const answer = structuredToMarkdown(structured) + ASSISTANT_FOOTER;
    const saved = await store(answer, { sources: articleRefs, structured, flags });
    return {
      conversation_id: saved.conversationId,
      message_id: saved.messageId,
      answer,
      structured,
      replaced: flags.length > 0,
      sources: articleRefs,
      safety: 'none' as const,
      demo: devMode,
      model: gemini.model,
      quota: quotaOut,
      stored: !!saved.messageId,
    };
  }

  const geminiRequest = {
    system: buildSystemPrompt(APP_NAME, context, articles, today),
    turns: [...history.map((h) => ({ role: h.role === 'assistant' ? 'model' : 'user', text: h.content }) as GeminiTurn), { role: 'user', text: message } as GeminiTurn],
    maxOutputTokens: MAX_TOKENS,
  };

  const unavailable = async () => {
    await admin.rpc('refund_assistant_quota', { p_user: user.id });
    return { error: 'assistant_unavailable', message: 'L’assistant est momentanément indisponible. Réessayez dans un instant.' };
  };

  // 7a) Réponse complète (sans diffusion)
  if (!wantsStream) {
    let raw: string;
    try {
      raw = (await geminiGenerate(gemini, geminiRequest)).trim();
    } catch (e) {
      console.error('llm_error', e instanceof GeminiError ? e.status : 'unknown'); // jamais le contenu
      if (e instanceof GeminiError && e.blocked) return json(await finalize(''));
      return json(await unavailable(), 503);
    }
    return json(await finalize(raw));
  }

  // 7b) Diffusion en continu (Server-Sent Events)
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(encodeSse(event, data)));
        } catch {
          // l'application a fermé la connexion : on termine quand même (enregistrement de la réponse)
        }
      };
      const close = () => {
        try {
          controller.close();
        } catch {
          // déjà fermé
        }
      };
      send('meta', { conversation_id: requestedConversation, quota: quotaOut, demo: devMode });
      let raw = '';
      try {
        try {
          await geminiStream(gemini, geminiRequest, (t) => {
            raw += t;
            send('delta', { text: t });
          });
        } catch (e) {
          if (!(e instanceof GeminiError && e.blocked)) throw e;
          raw = ''; // réponse bloquée : remplacée par la réponse prudente
        }
        send('done', await finalize(raw.trim()));
      } catch (e) {
        console.error('assistant_stream_error', e instanceof Error ? e.message : 'unknown');
        send('error', raw ? { error: 'assistant_unavailable', message: 'La réponse a été interrompue. Réessayez dans un instant.' } : await unavailable());
      }
      close();
    },
  });
  return new Response(stream, {
    headers: { ...corsHeaders, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
  });
});
