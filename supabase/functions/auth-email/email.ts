/** Logique pure du hook « Send Email » de Supabase Auth : signature, liens, gabarits FR, envoi Resend. */

export interface HookPayload {
  user: { email: string; user_metadata?: Record<string, unknown> };
  email_data: { token: string; token_hash: string; redirect_to: string; email_action_type: string; site_url: string; token_new?: string; token_hash_new?: string };
}

const b64ToBytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const bytesToB64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)));

/**
 * Vérifie la signature « Standard Webhooks » envoyée par Supabase Auth.
 * secret au format « v1,whsec_<base64> » (tel qu'affiché par Supabase) ou « whsec_<base64> ».
 */
export async function verifyHook(secret: string, headers: Headers, body: string, now = Date.now()): Promise<boolean> {
  const id = headers.get('webhook-id');
  const ts = headers.get('webhook-timestamp');
  const sig = headers.get('webhook-signature');
  if (!id || !ts || !sig || !secret) return false;
  if (Math.abs(now / 1000 - Number(ts)) > 300) return false; // 5 minutes de tolérance
  const raw = secret.replace(/^v1,/, '').replace(/^whsec_/, '');
  const key = await crypto.subtle.importKey('raw', b64ToBytes(raw), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = bytesToB64(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${body}`)));
  return sig.split(' ').some((part) => {
    const [v, s] = part.split(',');
    return v === 'v1' && typeof s === 'string' && constantTimeEqual(s, expected);
  });
}

export function verifyLink(supabaseUrl: string, d: HookPayload['email_data'], hash = d.token_hash): string {
  const u = new URL('/auth/v1/verify', supabaseUrl);
  u.searchParams.set('token', hash);
  u.searchParams.set('type', d.email_action_type);
  if (d.redirect_to) u.searchParams.set('redirect_to', d.redirect_to);
  return u.toString();
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function buildEmail(appName: string, supabaseUrl: string, p: HookPayload): { subject: string; html: string; text: string } {
  const d = p.email_data;
  const link = verifyLink(supabaseUrl, d);
  const T: Record<string, { subject: string; intro: string; cta: string }> = {
    signup: { subject: `Confirmez votre adresse — ${appName}`, intro: 'Bienvenue ! Confirmez votre adresse e-mail pour activer votre compte.', cta: 'Confirmer mon adresse' },
    recovery: { subject: `Réinitialiser votre mot de passe — ${appName}`, intro: 'Vous avez demandé à réinitialiser votre mot de passe. Si ce n’est pas vous, ignorez simplement ce message.', cta: 'Choisir un nouveau mot de passe' },
    magiclink: { subject: `Votre lien de connexion — ${appName}`, intro: 'Voici votre lien de connexion. Il n’est valable que quelques minutes.', cta: 'Me connecter' },
    invite: { subject: `Vous êtes invité·e sur ${appName}`, intro: 'Vous avez été invité·e à rejoindre un espace familial.', cta: 'Accepter l’invitation' },
    email_change: { subject: `Confirmez votre nouvelle adresse — ${appName}`, intro: 'Confirmez le changement d’adresse e-mail de votre compte.', cta: 'Confirmer le changement' },
    reauthentication: { subject: `Votre code de vérification — ${appName}`, intro: 'Utilisez ce code pour confirmer votre identité.', cta: '' },
  };
  const t = T[d.email_action_type] ?? { subject: `${appName}`, intro: 'Action à confirmer sur votre compte.', cta: 'Continuer' };
  const code = d.token ? `Code : ${d.token}` : '';
  const text = [t.intro, t.cta ? `${t.cta} : ${link}` : '', code, '', 'Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.', `— L’équipe ${appName}`].filter((x) => x !== '').join('\n');
  const html = `<!doctype html><html lang="fr"><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#FFF6EF;margin:0;padding:24px;color:#2A1A26">
<div style="max-width:480px;margin:auto;background:#fff;border-radius:20px;padding:28px">
<h1 style="font-size:22px;margin:0 0 12px">${esc(appName)}</h1>
<p style="font-size:16px;line-height:1.5">${esc(t.intro)}</p>
${t.cta ? `<p style="margin:24px 0"><a href="${esc(link)}" style="background:#E9587C;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600;display:inline-block">${esc(t.cta)}</a></p>` : ''}
${d.token ? `<p style="font-size:15px">Code : <strong style="letter-spacing:2px">${esc(d.token)}</strong></p>` : ''}
<p style="font-size:13px;color:#7E6873">Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.</p>
</div></body></html>`;
  return { subject: t.subject, html, text };
}

export async function sendWithResend(apiKey: string, from: string, to: string, mail: { subject: string; html: string; text: string }, fetchImpl: typeof fetch = fetch): Promise<{ ok: boolean; status: number; id?: string }> {
  const res = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject: mail.subject, html: mail.html, text: mail.text }),
  });
  const out = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, id: (out as { id?: string }).id };
}

/** Comparaison en temps constant de la signature du webhook. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
