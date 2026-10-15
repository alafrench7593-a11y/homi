// Tests de l'explication IA du scanner : l'IA reformule le verdict des règles, elle ne décide pas (faux transport Gemini).
function assertEquals(a: unknown, b: unknown) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`);
}
import { buildExplainPrompt, sanitizePayload, type ExplainPayload } from './scan-explain.ts';
import { runExplain } from './scan-explain-run.ts';

const payload = sanitizePayload({
  kind: 'food', verdict: 'Impossible à confirmer', verdictReason: 'Cuisson inconnue', certainty: 'Faible', profileLabel: 'Personne enceinte',
  subject: { name: 'Poulet rôti', brand: null }, findings: [], missing: ['Cuisson (bien cuit, peu cuit ou cru)'],
  sources: [{ n: 1, label: 'Quels aliments éviter…', publisher: 'Santé publique France', date: '15/10/2025', url: 'https://www.sante.fr/node/7070507' }], demo: false,
}) as ExplainPayload;
const cfg = { apiKey: 'cle-de-test', model: 'gemini-3.5-flash-lite' };

function gemini(text: string, status = 200): typeof fetch {
  return ((_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    if (!String(body.contents[0].parts[0].text).includes('VERDICT (à reprendre mot pour mot) : Impossible à confirmer')) throw new Error('prompt sans verdict');
    return Promise.resolve(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] }), { status }));
  }) as typeof fetch;
}

Deno.test('sans clé : not_configured, aucun appel', async () => {
  let called = false;
  const r = await runExplain(payload, null, (() => { called = true; return Promise.reject(new Error('x')); }) as typeof fetch);
  assertEquals(r.ai, 'not_configured');
  assertEquals(called, false);
});

Deno.test('réponse prudente : acceptée avec modèle et date', async () => {
  const text = JSON.stringify({ summary: 'Impossible à confirmer : la cuisson n’est pas connue [1].', points: ['La volaille doit être bien cuite à cœur pendant la grossesse [1].'], missing: ['Cuisson'], next_step: 'Indiquez la cuisson.' });
  const r = await runExplain(payload, cfg, gemini(text), '2026-10-16');
  assertEquals([r.ai, r.ai === 'ok' ? r.model : '', r.ai === 'ok' ? r.generated_on : ''], ['ok', 'gemini-3.5-flash-lite', '2026-10-16']);
});

Deno.test('promesse d’innocuité ou autre verdict : rejetée', async () => {
  const unsafe = JSON.stringify({ summary: 'Ce poulet est sans danger.', points: ['ok'], missing: ['Cuisson'], next_step: '' });
  assertEquals((await runExplain(payload, cfg, gemini(unsafe))).ai, 'rejected');
  const other = JSON.stringify({ summary: 'Adapté selon les informations disponibles.', points: ['ok'], missing: ['Cuisson'], next_step: '' });
  assertEquals((await runExplain(payload, cfg, gemini(other))).ai, 'rejected');
});

Deno.test('erreur du service : unavailable (l’application garde l’explication des règles)', async () => {
  assertEquals((await runExplain(payload, cfg, gemini('{}', 500))).ai, 'unavailable');
});

Deno.test('le prompt contient les sources numérotées et les informations manquantes', () => {
  const p = buildExplainPrompt(payload);
  assertEquals(p.includes('[1] Santé publique France'), true);
  assertEquals(p.includes('Informations manquantes : Cuisson'), true);
});
