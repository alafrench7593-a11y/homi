/** Logique pure du hook « Send Email » de Supabase Auth : signature, liens, gabarits (fr, en, es, de, it), envoi Resend.
 *  Langue : celle enregistrée à l'inscription (métadonnée `locale`), sinon le français. */

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
  if (!Number.isFinite(Number(ts)) || Math.abs(now / 1000 - Number(ts)) > 300) return false; // 5 minutes de tolérance
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

type Mail = { subject: string; intro: string; cta: string };
interface MailLang { types: Record<string, Mail>; fallback: Mail; code: string; ignore: string; team: string }
const MAIL: Record<'fr' | 'en' | 'es' | 'de' | 'it', MailLang> = {
  fr: {
    types: {
      signup: { subject: 'Confirmez votre adresse — {app}', intro: 'Bienvenue ! Confirmez votre adresse e-mail pour activer votre compte.', cta: 'Confirmer mon adresse' },
      recovery: { subject: 'Réinitialiser votre mot de passe — {app}', intro: 'Vous avez demandé à réinitialiser votre mot de passe. Si ce n’est pas vous, ignorez simplement ce message.', cta: 'Choisir un nouveau mot de passe' },
      magiclink: { subject: 'Votre lien de connexion — {app}', intro: 'Voici votre lien de connexion. Il n’est valable que quelques minutes.', cta: 'Me connecter' },
      invite: { subject: 'Vous êtes invité·e sur {app}', intro: 'Vous avez été invité·e à rejoindre un espace familial.', cta: 'Accepter l’invitation' },
      email_change: { subject: 'Confirmez votre nouvelle adresse — {app}', intro: 'Confirmez le changement d’adresse e-mail de votre compte.', cta: 'Confirmer le changement' },
      reauthentication: { subject: 'Votre code de vérification — {app}', intro: 'Utilisez ce code pour confirmer votre identité.', cta: '' },
    },
    fallback: { subject: '{app}', intro: 'Action à confirmer sur votre compte.', cta: 'Continuer' },
    code: 'Code', ignore: 'Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.', team: '— L’équipe {app}',
  },
  en: {
    types: {
      signup: { subject: 'Confirm your email address — {app}', intro: 'Welcome! Confirm your email address to activate your account.', cta: 'Confirm my address' },
      recovery: { subject: 'Reset your password — {app}', intro: 'You asked to reset your password. If this wasn’t you, simply ignore this message.', cta: 'Choose a new password' },
      magiclink: { subject: 'Your sign-in link — {app}', intro: 'Here is your sign-in link. It is only valid for a few minutes.', cta: 'Sign me in' },
      invite: { subject: 'You’re invited to {app}', intro: 'You’ve been invited to join a family space.', cta: 'Accept the invitation' },
      email_change: { subject: 'Confirm your new email address — {app}', intro: 'Confirm the change of email address on your account.', cta: 'Confirm the change' },
      reauthentication: { subject: 'Your verification code — {app}', intro: 'Use this code to confirm your identity.', cta: '' },
    },
    fallback: { subject: '{app}', intro: 'An action needs confirming on your account.', cta: 'Continue' },
    code: 'Code', ignore: 'If you didn’t make this request, please ignore this message.', team: '— The {app} team',
  },
  es: {
    types: {
      signup: { subject: 'Confirma tu dirección de correo — {app}', intro: '¡Bienvenida! Confirma tu dirección de correo electrónico para activar tu cuenta.', cta: 'Confirmar mi dirección' },
      recovery: { subject: 'Restablecer tu contraseña — {app}', intro: 'Has pedido restablecer tu contraseña. Si no has sido tú, ignora este mensaje.', cta: 'Elegir una nueva contraseña' },
      magiclink: { subject: 'Tu enlace de inicio de sesión — {app}', intro: 'Aquí tienes tu enlace de inicio de sesión. Solo es válido durante unos minutos.', cta: 'Iniciar sesión' },
      invite: { subject: 'Te han invitado a {app}', intro: 'Te han invitado a unirte a un espacio familiar.', cta: 'Aceptar la invitación' },
      email_change: { subject: 'Confirma tu nueva dirección de correo — {app}', intro: 'Confirma el cambio de dirección de correo electrónico de tu cuenta.', cta: 'Confirmar el cambio' },
      reauthentication: { subject: 'Tu código de verificación — {app}', intro: 'Usa este código para confirmar tu identidad.', cta: '' },
    },
    fallback: { subject: '{app}', intro: 'Hay una acción pendiente de confirmar en tu cuenta.', cta: 'Continuar' },
    code: 'Código', ignore: 'Si no has hecho esta solicitud, ignora este mensaje.', team: '— El equipo de {app}',
  },
  de: {
    types: {
      signup: { subject: 'Bestätige deine E-Mail-Adresse — {app}', intro: 'Willkommen! Bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.', cta: 'Adresse bestätigen' },
      recovery: { subject: 'Passwort zurücksetzen — {app}', intro: 'Du hast angefordert, dein Passwort zurückzusetzen. Falls du das nicht warst, ignoriere diese Nachricht einfach.', cta: 'Neues Passwort wählen' },
      magiclink: { subject: 'Dein Anmeldelink — {app}', intro: 'Hier ist dein Anmeldelink. Er ist nur wenige Minuten gültig.', cta: 'Anmelden' },
      invite: { subject: 'Du wurdest zu {app} eingeladen', intro: 'Du wurdest eingeladen, einem Familienbereich beizutreten.', cta: 'Einladung annehmen' },
      email_change: { subject: 'Bestätige deine neue E-Mail-Adresse — {app}', intro: 'Bestätige die Änderung der E-Mail-Adresse deines Kontos.', cta: 'Änderung bestätigen' },
      reauthentication: { subject: 'Dein Bestätigungscode — {app}', intro: 'Verwende diesen Code, um deine Identität zu bestätigen.', cta: '' },
    },
    fallback: { subject: '{app}', intro: 'In deinem Konto muss eine Aktion bestätigt werden.', cta: 'Weiter' },
    code: 'Code', ignore: 'Falls du diese Anfrage nicht gestellt hast, ignoriere diese Nachricht.', team: '— Dein {app}-Team',
  },
  it: {
    types: {
      signup: { subject: 'Conferma il tuo indirizzo email — {app}', intro: 'Benvenuta! Conferma il tuo indirizzo email per attivare il tuo account.', cta: 'Conferma il mio indirizzo' },
      recovery: { subject: 'Reimposta la tua password — {app}', intro: 'Hai chiesto di reimpostare la password. Se non sei stata tu, ignora semplicemente questo messaggio.', cta: 'Scegli una nuova password' },
      magiclink: { subject: 'Il tuo link di accesso — {app}', intro: 'Ecco il tuo link di accesso. È valido solo per pochi minuti.', cta: 'Accedi' },
      invite: { subject: 'Sei stato/a invitato/a su {app}', intro: 'Sei stato/a invitato/a a unirti a uno spazio familiare.', cta: 'Accetta l’invito' },
      email_change: { subject: 'Conferma il tuo nuovo indirizzo email — {app}', intro: 'Conferma la modifica dell’indirizzo email del tuo account.', cta: 'Conferma la modifica' },
      reauthentication: { subject: 'Il tuo codice di verifica — {app}', intro: 'Usa questo codice per confermare la tua identità.', cta: '' },
    },
    fallback: { subject: '{app}', intro: 'C’è un’azione da confermare sul tuo account.', cta: 'Continua' },
    code: 'Codice', ignore: 'Se non hai fatto tu questa richiesta, ignora questo messaggio.', team: '— Il team di {app}',
  },
};

/** Langue de l'e-mail : une des 5 langues de l'application, sinon le français. */
export function emailLang(v: unknown): 'fr' | 'en' | 'es' | 'de' | 'it' {
  return v === 'en' || v === 'es' || v === 'de' || v === 'it' ? v : 'fr';
}

export function buildEmail(appName: string, supabaseUrl: string, p: HookPayload): { subject: string; html: string; text: string } {
  const d = p.email_data;
  const link = verifyLink(supabaseUrl, d);
  const lang = emailLang(p.user.user_metadata?.locale);
  const L = MAIL[lang];
  const t = L.types[d.email_action_type] ?? L.fallback;
  const subject = t.subject.replace('{app}', appName);
  const code = d.token ? `${L.code} : ${d.token}` : '';
  const text = [t.intro, t.cta ? `${t.cta} : ${link}` : '', code, '', L.ignore, L.team.replace('{app}', appName)].filter((x) => x !== '').join('\n');
  const html = `<!doctype html><html lang="${lang}"><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#FFF6EF;margin:0;padding:24px;color:#2A1A26">
<div style="max-width:480px;margin:auto;background:#fff;border-radius:20px;padding:28px">
<h1 style="font-size:22px;margin:0 0 12px">${esc(appName)}</h1>
<p style="font-size:16px;line-height:1.5">${esc(t.intro)}</p>
${t.cta ? `<p style="margin:24px 0"><a href="${esc(link)}" style="background:#E9587C;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600;display:inline-block">${esc(t.cta)}</a></p>` : ''}
${d.token ? `<p style="font-size:15px">${esc(L.code)} : <strong style="letter-spacing:2px">${esc(d.token)}</strong></p>` : ''}
<p style="font-size:13px;color:#7E6873">${esc(L.ignore)}</p>
</div></body></html>`;
  return { subject, html, text };
}

export async function sendWithResend(apiKey: string, from: string, to: string, mail: { subject: string; html: string; text: string }, fetchImpl: typeof fetch = fetch): Promise<{ ok: boolean; status: number; id?: string }> {
  const res = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject: mail.subject, html: mail.html, text: mail.text }),
    signal: AbortSignal.timeout(8000),
  });
  const out = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, id: (out as { id?: string }).id };
}

/** Comparaison en temps constant de la signature du webhook. */
function constantTimeEqual(a: string, b: string): boolean {
  // Pas de retour anticipé sur la longueur : le temps ne dépend que de la plus longue chaîne
  const n = Math.max(a.length, b.length);
  let r = a.length ^ b.length;
  for (let i = 0; i < n; i++) r |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return r === 0;
}
