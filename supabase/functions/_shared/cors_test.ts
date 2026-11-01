// CORS : origine renvoyée uniquement si elle est dans la liste ; jamais « * » ni d'identifiants.
import { allowedOrigins, corsFor, withCors } from './http.ts';
function assertEquals(a: unknown, b: unknown) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`);
}

Deno.test('liste : lue depuis ALLOWED_ORIGINS, nettoyée ; serveurs Expo locaux par défaut', () => {
  assertEquals(allowedOrigins(' https://app.exemple.fr/ ,http://localhost:3000,javascript:x'), ['https://app.exemple.fr', 'http://localhost:3000']);
  assertEquals(allowedOrigins(undefined).includes('http://localhost:8081'), true);
});

Deno.test('origine autorisée : renvoyée telle quelle ; inconnue : aucun en-tête d’autorisation', () => {
  const list = ['https://app.exemple.fr'];
  assertEquals(corsFor('https://app.exemple.fr', list)['Access-Control-Allow-Origin'], 'https://app.exemple.fr');
  assertEquals(corsFor('https://pirate.exemple', list)['Access-Control-Allow-Origin'], undefined);
  assertEquals(corsFor(null, list)['Access-Control-Allow-Origin'], undefined);
  assertEquals(corsFor('https://app.exemple.fr', list)['Access-Control-Allow-Credentials'], undefined);
  assertEquals(corsFor('https://app.exemple.fr', list).Vary, 'Origin');
});

Deno.test('withCors : remplace un « * » posé par la fonction', async () => {
  const h = withCors(() => new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } }));
  const res = await h(new Request('http://local/x', { headers: { origin: 'https://pirate.exemple' } }));
  assertEquals(res.headers.get('Access-Control-Allow-Origin'), null);
  assertEquals(await res.text(), 'ok');
});
