// Explication en français clair d'un résultat du scanner, par Gemini (clé côté serveur uniquement).
// POST { kind, verdict, verdictReason, certainty, profileLabel, subject, findings, missing, sources, demo, scan_id? }
//
// L'IA n'explique que ce que les règles ont établi : le verdict est repris tel quel ; une réponse
// contenant une promesse d'innocuité ou un autre verdict est rejetée. Sans GEMINI_API_KEY :
// { ai: 'not_configured' } — l'application affiche alors l'explication des règles, jamais un faux texte IA.
import { adminClient, corsHeaders, json, rateLimit, requireUser } from '../_shared/http.ts';
import { geminiConfig, geminiGenerate, GeminiError } from '../_shared/gemini.ts';
import { buildExplainPrompt, checkExplanation, EXPLAIN_SCHEMA, EXPLAIN_SYSTEM, sanitizePayload } from '../_shared/scan-explain.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const body = await req.json().catch(() => ({}));
  const payload = sanitizePayload(body);
  if (!payload) return json({ error: 'bad_request', message: 'Résultat d’analyse invalide.' }, 400);

  const cfg = geminiConfig();
  if (!cfg) return json({ ai: 'not_configured', message: 'Explication IA non configurée.' });

  const admin = adminClient();
  if (!(await rateLimit(admin, `scan_explain:${auth.user.id}`, 20, 3600))) {
    return json({ ai: 'unavailable', message: 'Trop d’explications demandées en une heure. L’explication des règles reste affichée.' });
  }

  const generatedOn = new Date().toISOString().slice(0, 10);
  let raw = '';
  try {
    raw = await geminiGenerate(cfg, { system: EXPLAIN_SYSTEM, turns: [{ role: 'user', text: buildExplainPrompt(payload) }], maxOutputTokens: 900, responseSchema: EXPLAIN_SCHEMA });
  } catch (e) {
    console.error('scan_explain_error', e instanceof GeminiError ? e.status : 'fetch');
    return json({ ai: 'unavailable', message: 'L’explication IA est momentanément indisponible. L’explication des règles reste affichée.' });
  }
  const checked = checkExplanation(raw, payload);
  if (!checked.ok) {
    console.error('scan_explain_rejected', checked.reason);
    return json({ ai: 'rejected', message: 'L’explication IA n’a pas passé les contrôles de prudence : seule l’explication des règles est affichée.' });
  }

  const result = { ai: 'ok', model: cfg.model, generated_on: generatedOn, verdict: payload.verdict, explanation: checked.explanation };
  // Mémorisation sur le résultat (RLS : uniquement si le scan appartient à la personne)
  if (typeof body.scan_id === 'string') {
    await auth.client.from('scan_results').update({ explanation: result }).eq('scan_id', body.scan_id);
  }
  return json(result);
});
