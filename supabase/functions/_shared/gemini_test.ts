// Tests du client Gemini (format REST v1beta) avec un faux transport réseau.
function assertEquals(a: unknown, b: unknown) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`);
}
async function assertRejects(fn: () => Promise<unknown>, cls: new (...a: any[]) => Error) {
  try { await fn(); } catch (e) { if (e instanceof cls) return; throw e; }
  throw new Error('aucune erreur levée');
}
import { buildGeminiBody, geminiGenerate, geminiStream, geminiText, GeminiError } from './gemini.ts';

const cfg = { apiKey: 'cle-de-test', model: 'gemini-3.5-flash-lite' };

Deno.test('le corps de requête suit le format generateContent', () => {
  const body = buildGeminiBody({ system: 'Consignes', turns: [{ role: 'user', text: 'Bonjour' }], images: [{ mimeType: 'image/jpeg', base64: 'AAA' }], responseSchema: { type: 'object' } }) as Record<string, any>;
  assertEquals(body.systemInstruction.parts[0].text, 'Consignes');
  assertEquals(body.contents[0].role, 'user');
  assertEquals(body.contents[0].parts[1].inlineData.mimeType, 'image/jpeg');
  assertEquals(body.generationConfig.responseMimeType, 'application/json');
});

Deno.test('appel non-streaming : URL, en-tête de clé et lecture du texte', async () => {
  let url = '', key = '';
  const fake = (async (u: string, init: RequestInit) => {
    url = u; key = (init.headers as Record<string, string>)['x-goog-api-key'];
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Réponse ' }, { text: 'courte' }] }, finishReason: 'STOP' }] }), { status: 200 });
  }) as typeof fetch;
  const out = await geminiGenerate(cfg, { system: 's', turns: [{ role: 'user', text: 'q' }] }, fake);
  assertEquals(out, 'Réponse courte');
  assertEquals(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
  assertEquals(key, 'cle-de-test');
});

Deno.test('erreur HTTP et blocage de sécurité sont signalés, jamais maquillés en succès', async () => {
  const e401 = (async () => new Response('{}', { status: 401 })) as typeof fetch;
  await assertRejects(() => geminiGenerate(cfg, { system: 's', turns: [{ role: 'user', text: 'q' }] }, e401), GeminiError);
  assertEquals(geminiText({ promptFeedback: { blockReason: 'SAFETY' } }).blocked, true);
});

Deno.test('flux SSE découpé en morceaux arbitraires', async () => {
  const events = [
    'data: {"candidates":[{"content":{"parts":[{"text":"Bon"}]}}]}\n\n',
    'data: {"candidates":[{"content":{"parts":[{"text":"jour"}]},"finishReason":"STOP"}]}\n\n',
  ].join('');
  const chunks = [events.slice(0, 17), events.slice(17, 60), events.slice(60)];
  const fake = (async () => new Response(new ReadableStream({ start(c) { for (const ch of chunks) c.enqueue(new TextEncoder().encode(ch)); c.close(); } }), { status: 200 })) as typeof fetch;
  const got: string[] = [];
  const full = await geminiStream(cfg, { system: 's', turns: [{ role: 'user', text: 'q' }] }, (t) => { got.push(t); }, fake);
  assertEquals(full, 'Bonjour');
  assertEquals(got, ['Bon', 'jour']);
});
