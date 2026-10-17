// Tests de l'analyse pédagogique d'une photo de glaire cervicale (faux transport Gemini, sans réseau).
function assertEquals(a: unknown, b: unknown) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`);
}
function assert(cond: unknown, msg = 'condition fausse') { if (!cond) throw new Error(msg); }

import { handleCyclePhoto, NOT_CONFIGURED_MESSAGE, type CyclePhotoDeps } from './handler.ts';
import { geminiConfig } from '../_shared/gemini.ts';
import { base64DecodedSize, checkCyclePhotoBody, CYCLE_PHOTO_MAX_BYTES, parseCyclePhotoAnswer } from '../_shared/cycle-photo.ts';

const cfg = { apiKey: 'cle-de-test', model: 'gemini-3.5-flash-lite' };
// Début d'un vrai fichier JPEG (FF D8 FF E0…)
const JPEG = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDA==';

function geminiReply(text: string, finishReason = 'STOP'): typeof fetch {
  return ((_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    // L'image part bien en pièce jointe, avec le schéma de réponse JSON
    if (!body.contents[0].parts[1]?.inlineData?.data) throw new Error('image absente');
    if (body.generationConfig.responseMimeType !== 'application/json') throw new Error('schéma absent');
    return Promise.resolve(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason }] }), { status: 200 }));
  }) as typeof fetch;
}

function deps(over: Partial<CyclePhotoDeps> = {}): CyclePhotoDeps {
  return {
    authenticate: () => Promise.resolve({ userId: 'u1' }),
    config: () => cfg,
    fetchImpl: (() => Promise.reject(new Error('aucun appel réseau attendu'))) as typeof fetch,
    ...over,
  };
}

function post(body: unknown): Request {
  return new Request('http://local/cycle-photo', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { 'content-type': 'application/json' } });
}

Deno.test('sans consentement explicite : 400 consent_required, aucun appel', async () => {
  for (const consent of [undefined, false, 'true', 1]) {
    const res = await handleCyclePhoto(post({ image_base64: JPEG, mime_type: 'image/jpeg', consent }), deps());
    assertEquals(res.status, 400);
    assertEquals((await res.json()).error, 'consent_required');
    assertEquals(res.headers.get('Cache-Control'), 'no-store');
  }
});

Deno.test('sans clé Gemini : 503 ai_not_configured avec le message prévu', async () => {
  const res = await handleCyclePhoto(post({ image_base64: JPEG, mime_type: 'image/jpeg', consent: true }), deps({ config: () => null }));
  assertEquals(res.status, 503);
  assertEquals(await res.json(), { error: 'ai_not_configured', message: NOT_CONFIGURED_MESSAGE });
});

Deno.test({
  name: 'sans clé Gemini dans l’environnement : geminiConfig renvoie null → 503',
  ignore: Deno.permissions.querySync({ name: 'env', variable: 'GEMINI_API_KEY' }).state !== 'granted',
  fn: async () => {
    const saved = Deno.env.get('GEMINI_API_KEY');
    Deno.env.delete('GEMINI_API_KEY');
    try {
      const res = await handleCyclePhoto(post({ image_base64: JPEG, mime_type: 'image/jpeg', consent: true }), deps({ config: geminiConfig }));
      assertEquals(res.status, 503);
    } finally {
      if (saved) Deno.env.set('GEMINI_API_KEY', saved);
    }
  },
});

Deno.test('non connectée : la réponse 401 de l’authentification est renvoyée (no-store)', async () => {
  const res = await handleCyclePhoto(post({ consent: true }), deps({ authenticate: () => Promise.resolve(new Response('{"error":"unauthorized"}', { status: 401 })) }));
  assertEquals(res.status, 401);
  assertEquals(res.headers.get('Cache-Control'), 'no-store');
});

Deno.test('image trop lourde : 413 ; format autre que JPEG : 400', async () => {
  const big = '/9j/' + 'A'.repeat(Math.ceil((CYCLE_PHOTO_MAX_BYTES * 4) / 3) + 8);
  assertEquals((await handleCyclePhoto(post({ image_base64: big, mime_type: 'image/jpeg', consent: true }), deps())).status, 413);
  assertEquals((await handleCyclePhoto(post({ image_base64: 'iVBORw0KGgoAAAANSUhEUg==', mime_type: 'image/jpeg', consent: true }), deps())).status, 400);
  assertEquals((await handleCyclePhoto(post({ image_base64: JPEG, mime_type: 'image/png', consent: true }), deps())).status, 400);
  assertEquals(checkCyclePhotoBody({ image_base64: `data:image/jpeg;base64,${JPEG}`, mime_type: 'image/jpeg', consent: true }).ok, true);
  assertEquals(base64DecodedSize('QUJD'), 3);
  assertEquals(base64DecodedSize('QUI='), 2);
});

Deno.test('analyse : confiance bornée et plafonnée à 0,8, catégorie inconnue → inexploitable', () => {
  assertEquals(parseCyclePhotoAnswer({ analyzable: true, category: 'egg_white', confidence: 0.97, reason: 'Aspect transparent et filant.' }),
    { analyzable: true, category: 'egg_white', confidence: 0.8, reason: 'Aspect transparent et filant.' });
  assertEquals(parseCyclePhotoAnswer({ analyzable: true, category: 'creamy', confidence: -2, reason: '' }).confidence, 0);
  assertEquals(parseCyclePhotoAnswer({ analyzable: true, category: 'creamy', confidence: 'abc', reason: '' }).confidence, 0);
  assertEquals(parseCyclePhotoAnswer({ analyzable: true, category: 'creamy', confidence: 0.456, reason: '' }).confidence, 0.46);
  assertEquals(parseCyclePhotoAnswer({ analyzable: true, category: 'fertile', confidence: 0.5, reason: '' }).category, 'unanalyzable');
  assertEquals(parseCyclePhotoAnswer({ analyzable: true, category: 'fertile', confidence: 0.5, reason: '' }).analyzable, false);
  assertEquals(parseCyclePhotoAnswer({ analyzable: false, category: 'egg_white', confidence: 0.5, reason: '' }).category, 'unanalyzable');
  assertEquals(parseCyclePhotoAnswer({ analyzable: true, category: 'unusual', confidence: 0.3, reason: 'Teinte rosée visible.' }).category, 'unusual');
  assertEquals(parseCyclePhotoAnswer('pas du JSON').category, 'unanalyzable');
  assertEquals(parseCyclePhotoAnswer(null).category, 'unanalyzable');
  assertEquals(parseCyclePhotoAnswer('[1,2]').category, 'unanalyzable');
});

Deno.test('analyse : phrases sur l’ovulation, la grossesse ou la santé retirées ; 200 caractères maximum', () => {
  const r = parseCyclePhotoAnswer({
    analyzable: true, category: 'egg_white', confidence: 0.6,
    reason: 'Glaire transparente et étirable. Cela indique une ovulation proche ! Vous êtes peut-être enceinte. Aucun signe de maladie. Possible infection ? Pas de diagnostic possible. Texture homogène.',
  });
  assertEquals(r.reason, 'Glaire transparente et étirable. Texture homogène.');
  const long = parseCyclePhotoAnswer({ analyzable: true, category: 'creamy', confidence: 0.4, reason: 'x'.repeat(500) });
  assert(long.reason.length <= 200, 'raison trop longue');
  assertEquals(parseCyclePhotoAnswer({ analyzable: true, category: 'dry', confidence: 0.2, reason: 42 }).reason, '');
});

Deno.test('réponse bloquée par les filtres : inexploitable (200)', async () => {
  const res = await handleCyclePhoto(post({ image_base64: JPEG, mime_type: 'image/jpeg', consent: true }), deps({ fetchImpl: geminiReply('', 'SAFETY') }));
  assertEquals(res.status, 200);
  const out = await res.json();
  assertEquals([out.status, out.suggestion.analyzable, out.suggestion.category], ['ok', false, 'unanalyzable']);
});

Deno.test('erreur du service : 502 ai_unavailable', async () => {
  const failing = (() => Promise.resolve(new Response('{}', { status: 500 }))) as typeof fetch;
  const res = await handleCyclePhoto(post({ image_base64: JPEG, mime_type: 'image/jpeg', consent: true }), deps({ fetchImpl: failing }));
  assertEquals(res.status, 502);
  assertEquals((await res.json()).error, 'ai_unavailable');
});

Deno.test('limitation de débit : 429 sans appel au modèle', async () => {
  const res = await handleCyclePhoto(post({ image_base64: JPEG, mime_type: 'image/jpeg', consent: true }), deps({ rateLimit: () => Promise.resolve(false) }));
  assertEquals(res.status, 429);
});

Deno.test('parcours complet : suggestion validée, en-tête no-store, image transmise au modèle', async () => {
  let sent: Record<string, any> | null = null;
  let url = '';
  const fake = ((u: string, init?: RequestInit) => {
    url = u;
    sent = JSON.parse(String(init?.body));
    const text = JSON.stringify({ analyzable: true, category: 'egg_white', confidence: 0.92, reason: 'Échantillon clair et filant. Signe d’ovulation.' });
    return Promise.resolve(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] }), { status: 200 }));
  }) as typeof fetch;
  const res = await handleCyclePhoto(post({ image_base64: JPEG, mime_type: 'image/jpeg', consent: true }), deps({ fetchImpl: fake, rateLimit: () => Promise.resolve(true) }));
  assertEquals(res.status, 200);
  assertEquals(res.headers.get('Cache-Control'), 'no-store');
  assertEquals(await res.json(), { status: 'ok', suggestion: { analyzable: true, category: 'egg_white', confidence: 0.8, reason: 'Échantillon clair et filant.' } });
  assert(url.includes('gemini-3.5-flash-lite:generateContent'), 'mauvais point d’accès');
  const s = sent as unknown as Record<string, any>;
  assertEquals(s.contents[0].parts[1].inlineData, { mimeType: 'image/jpeg', data: JPEG });
  assertEquals(s.generationConfig.responseSchema.properties.category.enum.includes('egg_white'), true);
  assert(String(s.systemInstruction.parts[0].text).includes('JAMAIS si la personne ovule'), 'consignes de prudence absentes');
});

Deno.test('aucune journalisation dans la fonction (lecture du code source)', async () => {
  for (const f of ['./index.ts', './handler.ts', '../_shared/cycle-photo.ts']) {
    const src = await Deno.readTextFile(new URL(f, import.meta.url));
    assert(!/console\.\w+\s*\(/.test(src), `appel console trouvé dans ${f}`);
  }
});
