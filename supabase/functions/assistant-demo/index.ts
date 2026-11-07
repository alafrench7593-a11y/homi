// Fonction « assistant-demo » (07/11/2026) : l'assistant du mode démonstration (« Découvrir sans compte »),
// relié à la vraie IA (Gemini) avec des limites strictes, parce qu'il n'y a pas de compte derrière.
//
// POST { message: string, device_id: string (uuid), recent_turns?: [{ role, content }] }
// → { answer, structured, sources, safety, demo: true, limit } ou une erreur JSON.
//
// Ce qui est envoyé à Gemini : la question, les derniers échanges de la conversation en cours et des fiches
// publiques de la bibliothèque. Aucune donnée de profil, aucun compte, rien n'est enregistré côté serveur.
// Limites : 3 questions / jour / appareil, 6 / jour / adresse IP, 100 / jour pour toute la démo,
// 10 / minute pour toute la démo. Les urgences sont orientées sans IA et sans rien décompter.
import { adminClient, corsHeaders, json, rateLimit, withCors } from '../_shared/http.ts';
import { geminiConfig, geminiGenerate, GeminiError, type GeminiTurn } from '../_shared/gemini.ts';
import { assessSafety, auditAnswer, crisisMessage, urgentContacts } from '../_shared/safety.ts';
import { ASSISTANT_FOOTER, buildSystemPrompt, type ArticleRef } from '../_shared/assistant-prompt.ts';
import {
  INJECTION_REFUSAL,
  isEmptyAnswer,
  looksLikePromptInjection,
  parseStructuredAnswer,
  sanitizeRecentTurns,
  structuredToMarkdown,
  todayIso,
  type StructuredAnswer,
} from '../_shared/assistant-format.ts';

const APP_NAME = Deno.env.get('APP_NAME') ?? 'Au fil de nous';
export const DEMO_LIMITS = { perDevice: 3, perIp: 6, perDay: 100, perMinute: 10 } as const;
const MAX_DEMO_QUESTION = 500;
const MAX_TOKENS = 1000;

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

const LIMIT_MESSAGE = 'Vous avez utilisé les 3 questions de la démonstration pour aujourd’hui. Créez un compte gratuit pour continuer à poser vos questions.';

Deno.serve(withCors(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body: { message?: unknown; device_id?: unknown; recent_turns?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  const message = (typeof body.message === 'string' ? body.message : '').trim();
  const device = typeof body.device_id === 'string' && /^[0-9a-f-]{36}$/i.test(body.device_id) ? body.device_id.toLowerCase() : null;
  if (!device) return json({ error: 'bad_request', message: 'Appareil non reconnu.' }, 400);
  if (message.length < 2 || message.length > MAX_DEMO_QUESTION) {
    return json({ error: 'bad_request', message: `La question doit contenir entre 2 et ${MAX_DEMO_QUESTION} caractères.` }, 400);
  }

  // 1) Urgence : orientation humaine immédiate, sans IA et sans rien décompter
  const safety = assessSafety(message);
  if (safety.level !== 'none') {
    return json({
      answer: crisisMessage(safety.level), safety: safety.level, reasons: safety.reasons, urgent_contacts: urgentContacts(safety.level),
      sources: [], structured: null, show_emergency_resources: true, stored: false, demo: true,
    });
  }
  // 2) Détournement des consignes : refus poli, sans IA
  if (looksLikePromptInjection(message)) {
    const structured = { ...INJECTION_REFUSAL, updated_on: todayIso() };
    return json({ answer: structured.short, structured, safety: 'none', sources: [], stored: false, refused: true, demo: true });
  }

  const gemini = geminiConfig();
  if (!gemini) {
    console.error('assistant_demo_not_configured');
    return json({ error: 'ai_not_configured', message: 'L’assistant n’est pas disponible pour le moment. Réessayez plus tard.' }, 503);
  }

  // 3) Limites (refus par défaut si le compteur est indisponible : jamais d'appels payants illimités)
  const admin = adminClient();
  // L'adresse IP n'est jamais conservée telle quelle : seule son empreinte sert de clé de compteur
  const rawIp = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'inconnue';
  const ipHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`assistant-demo:${rawIp}`))))
    .map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  const day = 86400;
  if (!(await rateLimit(admin, 'assistant-demo-min', DEMO_LIMITS.perMinute, 60))) {
    return json({ error: 'rate_limited', message: 'Beaucoup de questions en ce moment. Réessayez dans une minute.' }, 429);
  }
  if (!(await rateLimit(admin, `assistant-demo-dev:${device}`, DEMO_LIMITS.perDevice, day)) || !(await rateLimit(admin, `assistant-demo-ip:${ipHash}`, DEMO_LIMITS.perIp, day))) {
    return json({ error: 'quota_reached', message: LIMIT_MESSAGE, limit: DEMO_LIMITS.perDevice }, 402);
  }
  if (!(await rateLimit(admin, 'assistant-demo-day', DEMO_LIMITS.perDay, day))) {
    return json({ error: 'quota_reached', message: 'La démonstration a reçu beaucoup de questions aujourd’hui. Créez un compte gratuit pour continuer, ou revenez demain.', limit: DEMO_LIMITS.perDevice }, 402);
  }

  // 4) Fiches publiques de la bibliothèque liées à la question
  const words = message.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 4).slice(0, 6);
  let articles: ArticleRef[] = [];
  if (words.length) {
    const orFilter = words.map((w) => `title.ilike.%${w}%,summary.ilike.%${w}%`).join(',');
    const { data } = await admin.from('articles').select('slug,title,summary,sources').eq('status', 'published').or(orFilter).limit(4);
    articles = (data ?? []) as ArticleRef[];
  }
  const articleRefs = articles.map((a, i) => ({ ref: i + 1, title: a.title, slug: a.slug, sources: a.sources }));
  const today = todayIso();
  const history = sanitizeRecentTurns(body.recent_turns).slice(-6);

  let raw = '';
  try {
    raw = (await geminiGenerate(gemini, {
      system: buildSystemPrompt(APP_NAME, null, articles, today),
      turns: [...history.map((h) => ({ role: h.role === 'assistant' ? 'model' : 'user', text: h.content }) as GeminiTurn), { role: 'user', text: message }],
      maxOutputTokens: MAX_TOKENS,
    })).trim();
  } catch (e) {
    console.error('assistant_demo_llm_error', e instanceof GeminiError ? e.status : 'unknown'); // jamais le contenu
    if (!(e instanceof GeminiError && e.blocked)) {
      return json({ error: 'assistant_unavailable', message: 'L’assistant est momentanément indisponible. Réessayez dans un instant.' }, 503);
    }
  }

  // 5) Même contrôle que l'assistant des comptes : réponse prudente si quelque chose cloche
  let structured = parseStructuredAnswer(raw, today);
  const flags = auditAnswer(raw);
  if (flags.length || isEmptyAnswer(structured)) structured = { ...CAUTIOUS_ANSWER, updated_on: today };
  return json({
    answer: structuredToMarkdown(structured) + ASSISTANT_FOOTER, structured, replaced: flags.length > 0, sources: articleRefs,
    safety: 'none', demo: true, model: gemini.model, stored: false, limit: DEMO_LIMITS.perDevice,
  });
}));
