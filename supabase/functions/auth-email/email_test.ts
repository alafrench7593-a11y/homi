import { buildEmail, sendWithResend, verifyHook, verifyLink } from './email.ts';
function eq(a: unknown, b: unknown) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`); }

const secretBytes = crypto.getRandomValues(new Uint8Array(32));
const secretB64 = btoa(String.fromCharCode(...secretBytes));
async function sign(id: string, ts: string, body: string) {
  const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return 'v1,' + btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${body}`)))));
}
const payload = { user: { email: 'camille@exemple.fr' }, email_data: { token: '123456', token_hash: 'abc', redirect_to: 'toietmoi://auth/callback', email_action_type: 'recovery', site_url: 'https://x' } };

Deno.test('signature Standard Webhooks valide acceptée, invalide ou périmée refusée', async () => {
  const body = JSON.stringify(payload);
  const ts = String(Math.floor(Date.now() / 1000));
  const h = new Headers({ 'webhook-id': 'msg_1', 'webhook-timestamp': ts, 'webhook-signature': await sign('msg_1', ts, body) });
  eq(await verifyHook(`v1,whsec_${secretB64}`, h, body), true);
  eq(await verifyHook(`v1,whsec_${secretB64}`, h, body + ' '), false);
  const old = String(Math.floor(Date.now() / 1000) - 3600);
  const h2 = new Headers({ 'webhook-id': 'msg_1', 'webhook-timestamp': old, 'webhook-signature': await sign('msg_1', old, body) });
  eq(await verifyHook(`v1,whsec_${secretB64}`, h2, body), false);
});

Deno.test('lien de vérification Supabase et gabarit français', () => {
  eq(verifyLink('https://proj.supabase.co', payload.email_data), 'https://proj.supabase.co/auth/v1/verify?token=abc&type=recovery&redirect_to=toietmoi%3A%2F%2Fauth%2Fcallback');
  const m = buildEmail('Au fil de nous', 'https://proj.supabase.co', payload);
  eq(m.subject, 'Réinitialiser votre mot de passe — Au fil de nous');
  eq(m.html.includes('Toi &amp; Moi'), true);
  eq(m.text.includes('123456'), true);
});

Deno.test('appel Resend : URL, en-tête et corps ; un refus n’est jamais présenté comme un succès', async () => {
  let url = '', auth = '', sent: any = null;
  const ok = (async (u: string, init: RequestInit) => { url = u; auth = (init.headers as Record<string, string>).Authorization; sent = JSON.parse(String(init.body)); return new Response('{"id":"em_1"}', { status: 200 }); }) as typeof fetch;
  const r = await sendWithResend('re_test', 'Au fil de nous <bonjour@exemple.fr>', 'a@b.fr', { subject: 's', html: 'h', text: 't' }, ok);
  eq([url, auth, sent.to, r.ok, r.id], ['https://api.resend.com/emails', 'Bearer re_test', ['a@b.fr'], true, 'em_1']);
  const ko = (async () => new Response('{"message":"invalid"}', { status: 403 })) as typeof fetch;
  eq((await sendWithResend('x', 'y', 'z', { subject: 's', html: 'h', text: 't' }, ko)).ok, false);
});
