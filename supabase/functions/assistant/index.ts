// Fonction « assistant » — la clé du fournisseur d'IA reste ICI, jamais dans l'application.
//
// POST { conversation_id?: string, message: string, use_context?: boolean, context?: AssistantContext, stream?: boolean }
//
// Réponses :
//  - JSON (application/json) : erreurs, orientation urgente, refus, ou réponse complète si stream=false ;
//  - SSE (text/event-stream) si stream=true : événements « meta », « delta » ({ text }), puis « done »
//    (même contenu que la réponse JSON complète) ou « error ».
//
// Crédits IA (26/11/2026, docs/CREDITS_IA.md) — à la place de l'ancien compteur assistant_usage :
//  - SÉCURITÉ AVANT TOUT : la détection de détresse et les réponses de sécurité ne consomment JAMAIS de crédit et ne
//    sont JAMAIS bloquées par un solde nul (elles passent avant toute vérification de crédit) ;
//  - réserve (credits_reserve, coût lu dans credit_settings) AVANT l'appel à Gemini ; refus clair
//    402 « insufficient_credits » (solde, date de renouvellement) qui permet à l'application de proposer un pack ;
//  - débit (credits_commit) seulement quand la réponse a été LIVRÉE ; restitution (credits_release) si Gemini échoue,
//    si la réponse est bloquée, ou si la diffusion est coupée ; une réserve orpheline expire d'elle-même ;
//  - clé d'idempotence : request_id envoyé par l'application (même question renvoyée → aucun second débit) ;
//  - interrupteur serveur « ai.enabled » (credit_settings) : l'IA se coupe sans nouvelle version de l'application ;
//  - modèle : secret GEMINI_MODEL (clé GEMINI_API_KEY d'un projet Google AI en facturation payante).
// Journaux : jamais le texte d'une question ni d'une réponse (codes d'état seulement).
import { creditsGate } from '../_shared/credits-gate.ts';
import { adminClient, corsHeaders, json, rateLimit, requireUser, withCors } from '../_shared/http.ts';
import { readJsonBody } from '../_shared/body.ts';
import { geminiGenerate, geminiGenerateTurn, geminiStream, GeminiError, type GeminiTurn } from '../_shared/gemini.ts';
import { runAura } from '../_shared/aura-run.ts';
import { pseudonymizer } from '../_shared/aura-privacy.ts';
import { enabledGeminiConfig } from '../_shared/ai-switch.ts';
import { billedSseStream, ClientGone, requestKey, reserveRefusal, settle, type CreditsGate } from '../_shared/credits.ts';
import { assessSafety, auditAnswer, crisisMessage, toSafetyLang, urgentContacts } from '../_shared/safety.ts';
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

const APP_NAME = Deno.env.get('APP_NAME') ?? 'HOMI';

const MAX_HISTORY = 12;
const MAX_TOKENS = 1400;

const CAUTIOUS_ANSWER: StructuredAnswer = {
  short:
    'Je préfère ne pas répondre précisément à cette question : la réponse dépend de ta situation et doit venir d’un professionnel de santé (médecin, sage-femme, pédiatre ou pharmacien).',
  actions: ['Note tes questions et ce que tu observes (depuis quand, à quelle fréquence) pour les transmettre au professionnel.'],
  watch: [],
  consult: ['Demande l’avis de ton médecin, de ta sage-femme, du pédiatre ou d’un pharmacien.', 'En cas d’urgence : 15 ou 112 (114 par SMS).'],
  questions: [],
  sources: [],
  updated_on: null,
};

Deno.serve(withCors(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  // Assistant IA « Bientôt disponible » (09/11/2026, src/config/features.ts) : aucun appel à l'IA tant que le secret
  // ASSISTANT_ENABLED ne vaut pas « true » (activation : supabase secrets set ASSISTANT_ENABLED=true)
  if (Deno.env.get('ASSISTANT_ENABLED') !== 'true') {
    return new Response(JSON.stringify({ error: 'coming_soon', message: 'L’assistant IA sera bientôt disponible.' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // 0) Authentification : le JWT est vérifié auprès de Supabase Auth ; `db` agit AVEC les droits
  //    de la personne (RLS). Le client « service » ne sert qu'aux crédits et à l'écriture des messages.
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user, client: db } = auth;
  const admin = adminClient();

  if (!(await rateLimit(admin, `assistant:${user.id}`, 8, 60)) || !(await rateLimit(admin, `assistant-day:${user.id}`, 120, 86400))) {
    return json({ error: 'rate_limited', message: 'Beaucoup de questions en peu de temps. Réessaie dans une minute.' }, 429);
  }

  let body: { conversation_id?: unknown; message?: unknown; context?: unknown; use_context?: unknown; stream?: unknown; recent_turns?: unknown; lang?: unknown; region?: unknown; request_id?: unknown };
  const raw = await readJsonBody(req, 256 * 1024);
  if (!raw) return json({ error: 'too_large' }, 413);
  body = raw;

  // HOMI Aura (docs/HOMI_AURA.md) : déroulé complet dans _shared/aura-run.ts, testé avec un Gemini simulé.
  // Ordre : sécurité → consentement → crédits → Gemini (fonctions de la liste blanche, propositions jamais exécutées ici).
  // Prénoms masqués avant Gemini (droits de la personne : RLS) — enfants et membres visibles du foyer
  const householdNames = async (): Promise<string[]> => {
    const [kids, people] = await Promise.all([
      db.from('children').select('first_name').limit(50),
      db.from('profiles').select('display_name').limit(50),
    ]);
    const out: string[] = [];
    for (const k of kids.data ?? []) out.push(String((k as { first_name?: string }).first_name ?? ''));
    for (const p of people.data ?? []) {
      const n = String((p as { display_name?: string }).display_name ?? '').trim();
      if (n) out.push(n, n.split(/\s+/)[0]);
    }
    return out;
  };
  const mode = (raw as { mode?: unknown }).mode;
  if (mode === 'aura') {
    const out = await runAura({
      userId: user.id,
      consented: async () => {
        const { data } = await db.from('consents').select('granted').eq('user_id', user.id).eq('purpose', 'ai_assistant').order('created_at', { ascending: false }).limit(1).maybeSingle();
        return data?.granted === true;
      },
      geminiConfig: () => enabledGeminiConfig(admin),
      gate: creditsGate(admin, user.id),
      turn: (cfg, o) => geminiGenerateTurn(cfg, o),
      log: (code) => console.error(code), // codes seulement, jamais un texte
      names: householdNames,
    }, raw);
    return json(out.body, out.status);
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
    // Langue de l'application (sinon celle du message) et pays choisi : ressources d'urgence adaptées
    const where = { lang: toSafetyLang(body.lang) ?? safety.lang, region: typeof body.region === 'string' ? body.region.slice(0, 8) : null };
    const answer = crisisMessage(safety.level, where);
    const saved = await store(answer, { safety: safety.level, flags: safety.reasons });
    return json({
      conversation_id: saved.conversationId,
      message_id: saved.messageId,
      answer,
      safety: safety.level,
      reasons: safety.reasons,
      urgent_contacts: urgentContacts(safety.level, where),
      sources: [],
      structured: null,
      show_emergency_resources: true,
      stored: !!saved.messageId,
    });
  }

  if (!consented) {
    return json({ error: 'consent_required', message: 'Pour utiliser l’assistant, accepte d’abord ses conditions d’utilisation.' }, 403);
  }

  // 2) Tentative de détournement des consignes : refus poli, sans IA ni crédit
  if (looksLikePromptInjection(message)) {
    const structured = { ...INJECTION_REFUSAL, updated_on: todayIso() };
    return json({ conversation_id: requestedConversation, message_id: null, answer: structured.short, structured, safety: 'none', sources: [], stored: false, refused: true });
  }

  // 3) IA configurée ET ouverte (clé Gemini + interrupteur serveur « ai.enabled ») : sinon on le dit clairement,
  //    sans réserver de crédit ni simuler de réponse.
  const geminiOrNull = await enabledGeminiConfig(admin);
  if (!geminiOrNull) {
    // Message discret pour l'utilisatrice ; l'état détaillé est dans Réglages › État des services (mode développeur)
    console.error('assistant_not_configured');
    return json({ error: 'ai_not_configured', message: 'L’assistant n’est pas disponible pour le moment. Réessaie plus tard.' }, 503);
  }
  const gemini = geminiOrNull;

  // 4) Crédits : réserve atomique côté serveur (Premium strict : sans abonnement, aucun crédit)
  const gate: CreditsGate = creditsGate(admin, user.id);
  const reservation = await gate.reserve('assistant_question', requestKey('assistant', user.id, body.request_id));
  const refusal = reserveRefusal(reservation);
  if (refusal) return json(refusal.body, refusal.status);
  if (!reservation.ok) return json({ error: 'server_error' }, 500);
  const reservationId = reservation.reservation_id;
  const creditsOut = {
    cost: reservation.cost,
    monthly_remaining: reservation.monthly_remaining ?? null,
    purchased_remaining: reservation.purchased_remaining ?? null,
    next_renewal: reservation.next_renewal ?? null,
  };
  const charge = (delivered: boolean, reason: string) => settle(gate, reservationId, delivered, reason).then((r) => {
    if (r === 'failed') console.error('credits_settle_failed', delivered ? 'commit' : 'release'); // rattrapé par l'expiration des réserves
  });

  // 5) Contexte : UNIQUEMENT si la personne l'a autorisé pour cette conversation, nettoyé ici
  const context: AssistantContext | null = useContext ? sanitizeContext(body.context) : null;

  // 6) Articles publiés de la bibliothèque liés à la question (lecture sous RLS)
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

  // 7) Historique de la conversation (sous RLS : uniquement celle de la personne)
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
  const legacyPz = pseudonymizer(await householdNames().catch(() => []));
  const today = todayIso();

  /** Contrôle, structuration, filtrage des sources, enregistrement : réponse finale. */
  async function finalize(rawMasked: string) {
    const raw = legacyPz.unmask(rawMasked);
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
      credits: creditsOut,
      stored: !!saved.messageId,
    };
  }

  const geminiRequest = {
    system: buildSystemPrompt(APP_NAME, context, articles, today),
    turns: [...history.map((h) => ({ role: h.role === 'assistant' ? 'model' : 'user', text: legacyPz.mask(h.content) }) as GeminiTurn), { role: 'user', text: legacyPz.mask(message) } as GeminiTurn],
    maxOutputTokens: MAX_TOKENS,
  };

  const unavailable = { error: 'assistant_unavailable', message: 'L’assistant est momentanément indisponible. Réessaie dans un instant. Aucun crédit n’a été utilisé.' };

  // 8a) Réponse complète (sans diffusion) : débit seulement si une réponse de l'IA est rendue
  if (!wantsStream) {
    let raw: string;
    try {
      raw = (await geminiGenerate(gemini, geminiRequest)).trim();
    } catch (e) {
      console.error('llm_error', e instanceof GeminiError ? e.status : 'unknown'); // jamais le contenu
      const blocked = e instanceof GeminiError && e.blocked;
      await charge(false, blocked ? 'blocked' : 'llm_error');
      // Réponse bloquée : réponse prudente, jamais facturée
      if (blocked) return json({ ...(await finalize('')), credits: { ...creditsOut, charged: false } });
      return json(unavailable, 503);
    }
    const out = await finalize(raw);
    await charge(!!raw, raw ? 'delivered' : 'empty');
    return json({ ...out, credits: { ...creditsOut, charged: !!raw } });
  }

  // 8b) Diffusion en continu (Server-Sent Events) : débit seulement si « done » est remis à une connexion ouverte
  const stream = billedSseStream({
    encode: encodeSse,
    meta: { conversation_id: requestedConversation, credits: creditsOut, demo: devMode },
    settle: (delivered, reason) => charge(delivered, reason),
    produce: async (emit) => {
      let raw = '';
      try {
        await geminiStream(gemini, geminiRequest, (t) => {
          raw += t;
          // L'application est partie : on arrête de lire Gemini (aucun coût inutile) et la réserve est restituée
          if (!emit('delta', { text: legacyPz.unmask(t) })) throw new ClientGone();
        });
      } catch (e) {
        if (e instanceof ClientGone) throw e;
        if (!(e instanceof GeminiError && e.blocked)) {
          console.error('assistant_stream_error', e instanceof GeminiError ? e.status : e instanceof Error ? e.name : 'unknown'); // jamais le texte
          return {
            error: raw
              ? { error: 'assistant_unavailable', message: 'La réponse a été interrompue. Réessaie dans un instant. Aucun crédit n’a été utilisé.' }
              : unavailable,
          };
        }
        raw = ''; // réponse bloquée : remplacée par la réponse prudente, sans débit
      }
      const charged = raw.trim().length > 0;
      const out = await finalize(raw.trim());
      return { done: { ...out, credits: { ...creditsOut, charged } }, charge: charged };
    },
  });
  return new Response(stream, {
    headers: { ...corsHeaders, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
  });
}));
