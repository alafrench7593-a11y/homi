/**
 * HOMI Aura — déroulé d'une demande, côté serveur (module PUR : toutes les dépendances sont injectées, ce qui permet
 * de le tester dans Jest avec un Gemini SIMULÉ et un grand livre en mémoire ; aucune clé n'existe).
 *
 * Ordre IMMUABLE (vérifié par les tests) :
 *   1. SÉCURITÉ : détection de détresse sur le message, le brouillon et chaque texte libre choisi → réponse humaine
 *      immédiate, sans IA, sans consentement requis, JAMAIS de crédit, jamais bloquée par un solde nul ;
 *   2. CONSENTEMENT : conditions de l'assistant + accord explicite pour CETTE demande quand des données sont jointes ;
 *   3. anti-détournement (refus poli, gratuit) ;
 *   4. IA configurée et ouverte (sinon « ai_not_configured », gratuit) ;
 *   5. CRÉDITS : réserve du coût annoncé par l'application (refus si le coût diffère : la personne ne paie jamais plus
 *      que ce qui était affiché) ;
 *   6. GEMINI : au plus 4 tours, fonctions de la liste blanche (aura-tools.ts), propositions renvoyées à l'application ;
 *   7. contrôle de la sortie (aura-guard.ts) : réponse refusée → réponse prudente, propositions retirées, crédit rendu ;
 *   8. débit si une réponse est livrée, restitution sinon.
 * Journaux : codes seulement (jamais un texte).
 */
import { crisisMessage, assessSafety, toSafetyLang, urgentContacts, type SafetyLevel } from './safety.ts';
import { looksLikePromptInjection, sanitizeRecentTurns, MAX_QUESTION_LENGTH, todayIso } from './assistant-format.ts';
import { requestKey, reserveRefusal, settle, type CreditsGate } from './credits.ts';
// Types seulement (le client Gemini n'est jamais embarqué dans l'application) ; l'erreur vient de son petit module
import type { GeminiConfig, GeminiContent, GeminiFunctionCall, GeminiRequestOptions, GeminiTurnResult } from './gemini.ts';
import { GeminiError } from './gemini-error.ts';

export type { GeminiContent, GeminiFunctionCall, GeminiRequestOptions, GeminiTurnResult };
import { AURA_PROMPT_VERSION, buildAuraSystemPrompt, toAuraLang, toAuraTheme, type AuraKind, type AuraLang } from './aura-prompt.ts';
import { AURA_FUNCTIONS, AURA_MAX_ACTIONS, sanitizeCatalog, searchAuraCatalog, toAction, type AuraAction } from './aura-tools.ts';
import { AURA_ANALYSIS_KINDS, auraCreditAction, freeTexts, sanitizeAnalysis, sanitizeJournal, type AuraAnalysisKind } from './aura-data.ts';
import { AURA_CAUTIOUS, AURA_FOOTER, guardAuraOutput } from './aura-guard.ts';

export const AURA_MAX_TURNS = 4;
export const AURA_MAX_TOKENS = 1200;

export interface AuraDeps {
  userId: string;
  /** Conditions de l'assistant acceptées (table consents, purpose « ai_assistant »). */
  consented(): Promise<boolean>;
  /** Clé Gemini présente ET interrupteur « ai.enabled » ouvert ; null sinon. */
  geminiConfig(): Promise<GeminiConfig | null>;
  gate: CreditsGate;
  /** Un tour generateContent (production : geminiGenerateTurn ; tests : double). */
  turn(cfg: GeminiConfig, o: GeminiRequestOptions): Promise<GeminiTurnResult>;
  today?: string;
  log?(code: string): void;
}

export interface AuraResult { status: number; body: Record<string, unknown> }

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function runAura(deps: AuraDeps, raw: unknown): Promise<AuraResult> {
  const b = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const kind: AuraKind | null = b.kind === 'chat' || b.kind === 'reformulate' || b.kind === 'analysis' ? b.kind : null;
  if (!kind) return { status: 400, body: { error: 'bad_request' } };
  const lang: AuraLang = toAuraLang(b.lang);
  const theme = toAuraTheme(b.theme);
  const today = deps.today ?? todayIso();
  const message = str(b.message, MAX_QUESTION_LENGTH + 1);
  const draft = str(b.draft, MAX_QUESTION_LENGTH + 1);
  const analysisKind: AuraAnalysisKind | null = kind === 'analysis' && (AURA_ANALYSIS_KINDS as readonly string[]).includes((b.analysis as { kind?: string } | null)?.kind ?? '')
    ? ((b.analysis as { kind: AuraAnalysisKind }).kind) : null;
  const journal = kind === 'chat' ? sanitizeJournal(b.journal) : null;
  const analysis = analysisKind ? sanitizeAnalysis(analysisKind, (b.analysis as { data?: unknown }).data) : null;

  if (kind === 'chat' && (message.length < 2 || message.length > MAX_QUESTION_LENGTH)) return { status: 400, body: { error: 'bad_request' } };
  if (kind === 'reformulate' && (draft.length < 2 || draft.length > MAX_QUESTION_LENGTH)) return { status: 400, body: { error: 'bad_request' } };
  if (kind === 'analysis' && (!analysisKind || !analysis)) return { status: 400, body: { error: 'bad_request' } };

  // 1) SÉCURITÉ AVANT TOUT : aucune IA, aucun consentement exigé, aucun crédit
  const texts = [message, draft, ...freeTexts(journal, analysis)].filter(Boolean);
  let level: SafetyLevel = 'none';
  let safetyLang: string | undefined;
  for (const t of texts) {
    const s = assessSafety(t);
    if (s.level === 'crisis' || (s.level === 'medical_urgent' && level === 'none')) { level = s.level; safetyLang = s.lang; }
    if (level === 'crisis') break;
  }
  if (level !== 'none') {
    const where = { lang: toSafetyLang(b.lang) ?? toSafetyLang(safetyLang), region: typeof b.region === 'string' ? b.region.slice(0, 8) : null };
    deps.log?.('aura_safety');
    return {
      status: 200,
      body: {
        kind, safety: level, answer: crisisMessage(level, where), urgent_contacts: urgentContacts(level, where), actions: [],
        show_emergency_resources: true, prompt_version: AURA_PROMPT_VERSION, credits: { cost: 0, charged: false },
      },
    };
  }

  // 2) CONSENTEMENT : conditions de l'assistant, puis accord pour les données jointes à CETTE demande
  if (!(await deps.consented())) return { status: 403, body: { error: 'consent_required' } };
  if ((journal || analysis) && b.data_consent !== true) return { status: 403, body: { error: 'data_consent_required' } };

  // 3) Détournement des consignes : refus poli, gratuit
  if ((message && looksLikePromptInjection(message)) || (draft && looksLikePromptInjection(draft))) {
    return { status: 200, body: { kind, safety: 'none', refused: true, answer: AURA_CAUTIOUS[lang], actions: [], prompt_version: AURA_PROMPT_VERSION, credits: { cost: 0, charged: false } } };
  }

  // 4) IA configurée et ouverte
  const cfg = await deps.geminiConfig();
  if (!cfg) { deps.log?.('aura_not_configured'); return { status: 503, body: { error: 'ai_not_configured' } }; }

  // 5) CRÉDITS : le coût annoncé par l'application doit être celui du serveur
  const action = auraCreditAction(kind, { journal: !!journal, analysis: analysisKind });
  if (typeof b.credit_action === 'string' && b.credit_action !== action) return { status: 400, body: { error: 'cost_mismatch', expected: action } };
  const reservation = await deps.gate.reserve(action, requestKey('aura', deps.userId, b.request_id));
  const refusal = reserveRefusal(reservation);
  if (refusal) return refusal;
  if (!reservation.ok) return { status: 500, body: { error: 'server_error' } };
  const credits = {
    action, cost: reservation.cost, monthly_remaining: reservation.monthly_remaining ?? null, purchased_remaining: reservation.purchased_remaining ?? null, next_renewal: reservation.next_renewal ?? null,
  };
  const release = async (reason: string) => { if ((await settle(deps.gate, reservation.reservation_id, false, reason)) === 'failed') deps.log?.('credits_settle_failed'); };
  const commit = async () => { if ((await settle(deps.gate, reservation.reservation_id, true, 'delivered')) === 'failed') deps.log?.('credits_settle_failed'); };
  const cautious = async (reason: string, flags: string[] = []) => {
    await release(reason);
    return { status: 200, body: { kind, safety: 'none', replaced: true, flags, answer: AURA_CAUTIOUS[lang], actions: [], options: [], footer: AURA_FOOTER[lang], prompt_version: AURA_PROMPT_VERSION, credits: { ...credits, charged: false } } };
  };

  // 6) GEMINI
  const catalog = kind === 'chat' ? sanitizeCatalog(b.tools) : [];
  const dataText = journal ? JSON.stringify(journal) : analysis ? JSON.stringify({ kind: analysisKind, ...analysis }) : null;
  const system = buildAuraSystemPrompt({ lang, kind, theme, today, data: dataText, catalogSize: catalog.length, analysisKind });
  try {
    if (kind === 'reformulate') {
      const out = await deps.turn(cfg, {
        system, turns: [{ role: 'user', text: draft }], maxOutputTokens: 700,
        responseSchema: { type: 'OBJECT', properties: { options: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['options'] },
      });
      let options: string[] = [];
      try { options = (JSON.parse(out.text) as { options?: unknown }).options as string[]; } catch { options = []; }
      const clean = (Array.isArray(options) ? options : []).filter((x): x is string => typeof x === 'string').map((x) => x.trim().slice(0, 400))
        .filter((x) => x.length >= 2 && guardAuraOutput(x).ok).slice(0, 3);
      if (!clean.length) return cautious('empty');
      await commit();
      return { status: 200, body: { kind, safety: 'none', options: clean, answer: '', actions: [], footer: AURA_FOOTER[lang], prompt_version: AURA_PROMPT_VERSION, credits: { ...credits, charged: true } } };
    }

    const history = kind === 'chat' ? sanitizeRecentTurns(b.recent_turns) : [];
    const contents: GeminiContent[] = [
      ...history.map((h) => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] }) as GeminiContent),
      { role: 'user', parts: [{ text: kind === 'analysis' ? `${analysisKind}` : message }] },
    ];
    const actions: AuraAction[] = [];
    let text = '';
    for (let i = 0; i < AURA_MAX_TURNS; i++) {
      const out = await deps.turn(cfg, { system, turns: [], contents, maxOutputTokens: AURA_MAX_TOKENS, functions: kind === 'chat' ? AURA_FUNCTIONS : undefined });
      text = out.text.trim();
      if (!out.calls.length || kind !== 'chat') break;
      // Les parties du modèle sont recopiées TELLES QUELLES (signatures de pensée), puis une réponse par appel
      contents.push({ role: 'model', parts: out.parts });
      const responses = out.calls.map((c) => {
        if (c.name === 'search_tools') return { functionResponse: { name: c.name, response: { tools: searchAuraCatalog(catalog, String(c.args.query ?? '')) } } };
        if (!AURA_FUNCTIONS.some((f) => f.name === c.name)) return { functionResponse: { name: c.name, response: { error: 'unknown_function' } } };
        const a = actions.length < AURA_MAX_ACTIONS ? toAction(c.name, c.args, catalog, today) : null;
        if (a) actions.push(a);
        return { functionResponse: { name: c.name, response: a ? { status: 'shown_to_person_for_confirmation' } : { status: 'ignored', reason: actions.length >= AURA_MAX_ACTIONS ? 'too_many' : 'invalid' } } };
      });
      contents.push({ role: 'user', parts: responses });
    }

    // 7) Contrôle de la sortie
    const g = guardAuraOutput([text, ...actions.map((a) => JSON.stringify(a))].join('\n'));
    if (!g.ok) { deps.log?.('aura_guarded'); return cautious('guarded', g.flags); }
    if (!text && !actions.length) return cautious('empty');

    // 8) Livrée : débit
    await commit();
    return { status: 200, body: { kind, safety: 'none', answer: text, actions, footer: AURA_FOOTER[lang], prompt_version: AURA_PROMPT_VERSION, credits: { ...credits, charged: true } } };
  } catch (e) {
    if (e instanceof GeminiError && e.blocked) return cautious('blocked');
    deps.log?.(e instanceof GeminiError ? `aura_llm_${e.status}` : 'aura_llm_error');
    await release('llm_error');
    return { status: 503, body: { error: 'assistant_unavailable' } };
  }
}
