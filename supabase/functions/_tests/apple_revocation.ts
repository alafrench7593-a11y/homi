// Révocation Apple : signature ES256 vérifiable, cas sans code / sans secrets / Apple simulé / code refusé.
// Lancer : deno run --allow-env supabase/functions/_tests/apple_revocation.ts (aucun appel réseau, clé de test générée).
import { appleClientSecret, revokeAppleFromCode } from '../_shared/apple.ts';
// Clé de test générée localement (jamais une vraie clé Apple)
const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', kp.privateKey));
const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...der))}\n-----END PRIVATE KEY-----`;
const jwt = await appleClientSecret({ teamId: 'TEAM', keyId: 'KEY', privateKey: pem, clientId: 'fr.aufildenous.app' }, 1000);
const [h, c, s] = jwt.split('.');
const dec = (x: string) => Uint8Array.from(atob(x.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((x.length + 3) % 4)), (ch) => ch.charCodeAt(0));
const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, kp.publicKey, dec(s), new TextEncoder().encode(`${h}.${c}`));
console.log('signature valide:', ok, JSON.parse(new TextDecoder().decode(dec(c))));
console.log('sans code:', await revokeAppleFromCode(undefined));
console.log('sans secrets:', await revokeAppleFromCode('abc'));
Deno.env.set('APPLE_TEAM_ID', 'TEAM'); Deno.env.set('APPLE_KEY_ID', 'KEY'); Deno.env.set('APPLE_PRIVATE_KEY', pem.replace(/\n/g, '\\n'));
const calls: string[] = [];
const fake = (async (url: string, init: RequestInit) => { calls.push(url + ' ' + new URLSearchParams(String(init.body)).get('token_type_hint')); return url.endsWith('/auth/token') ? new Response(JSON.stringify({ refresh_token: 'r' })) : new Response(null, { status: 200 }); }) as unknown as typeof fetch;
console.log('avec Apple simulé:', await revokeAppleFromCode('abc', fake), calls);
const bad = (async () => new Response('{"error":"invalid_grant"}', { status: 400 })) as unknown as typeof fetch;
console.log('code refusé:', await revokeAppleFromCode('abc', bad));
