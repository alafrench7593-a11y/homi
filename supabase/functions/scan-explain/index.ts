// Explication en français clair d'un résultat du scanner, par Gemini (clé côté serveur uniquement).
// POST { kind, verdict, verdictReason, certainty, profileLabel, subject, findings, missing, sources, demo, scan_id? }
//
// L'IA n'explique que ce que les règles ont établi : le verdict est repris tel quel ; une réponse
// contenant une promesse d'innocuité ou un autre verdict est rejetée. Sans GEMINI_API_KEY :
// { ai: 'not_configured' } — l'application affiche alors l'explication des règles, jamais un faux texte IA.
import { adminClient, corsHeaders, json, rateLimit, requireUser } from '../_shared/http.ts';
import { geminiConfig } from '../_shared/gemini.ts';
import { sanitizePayload } from '../_shared/scan-explain.ts';
import { runExplain } from '../_shared/scan-explain-run.ts';

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

  const result = await runExplain(payload, cfg);
  if (result.ai !== 'ok') {
    console.error('scan_explain', result.ai, result.reason ?? '');
    const { reason: _r, ...publicResult } = result;
    return json(publicResult);
  }
  // Mémorisation sur le résultat (RLS : uniquement si le scan appartient à la personne)
  if (typeof body.scan_id === 'string') {
    await auth.client.from('scan_results').update({ explanation: result }).eq('scan_id', body.scan_id);
  }
  return json(result);
});
