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
interface MailLang { types: Record<string, Mail>; fallback: Mail; code: string; ignore: string; team: string; tagline: string; copy: string; help: string }
const MAIL: Record<'fr' | 'en' | 'es' | 'de' | 'it', MailLang> = {
  fr: {
    types: {
      signup: { subject: 'Confirme ton adresse — {app}', intro: 'Bienvenue ! Confirme ton adresse e-mail pour activer ton compte.', cta: 'Confirmer mon adresse' },
      recovery: { subject: 'Réinitialiser ton mot de passe — {app}', intro: 'Tu as demandé à réinitialiser ton mot de passe. Si ce n’est pas toi, ignore simplement ce message.', cta: 'Choisir un nouveau mot de passe' },
      magiclink: { subject: 'Ton lien de connexion — {app}', intro: 'Voici ton lien de connexion. Il n’est valable que quelques minutes.', cta: 'Me connecter' },
      invite: { subject: 'Tu es invité·e sur {app}', intro: 'Tu as été invité·e à rejoindre un espace familial.', cta: 'Accepter l’invitation' },
      email_change: { subject: 'Confirme ta nouvelle adresse — {app}', intro: 'Confirme le changement d’adresse e-mail de ton compte.', cta: 'Confirmer le changement' },
      reauthentication: { subject: 'Ton code de vérification — {app}', intro: 'Utilise ce code pour confirmer ton identité.', cta: '' },
    },
    fallback: { subject: '{app}', intro: 'Action à confirmer sur ton compte.', cta: 'Continuer' },
    code: 'Code', ignore: 'Si tu n’es pas à l’origine de cette demande, ignore ce message.', team: '— L’équipe {app}', tagline: 'Parce que devenir parents ne devrait pas signifier s’oublier.', copy: 'Le bouton ne fonctionne pas ? Copie ce lien dans ton navigateur :', help: 'Une question ? Écris-nous',
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
    code: 'Code', ignore: 'If you didn’t make this request, please ignore this message.', team: '— The {app} team', tagline: 'Because becoming parents shouldn’t mean forgetting yourselves.', copy: 'Button not working? Copy this link into your browser:', help: 'A question? Write to us',
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
    code: 'Código', ignore: 'Si no has hecho esta solicitud, ignora este mensaje.', team: '— El equipo de {app}', tagline: 'Porque ser padres no debería significar olvidarse de uno mismo.', copy: '¿El botón no funciona? Copia este enlace en tu navegador:', help: '¿Una pregunta? Escríbenos',
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
    code: 'Code', ignore: 'Falls du diese Anfrage nicht gestellt hast, ignoriere diese Nachricht.', team: '— Dein {app}-Team', tagline: 'Weil Eltern werden nicht heißen sollte, sich selbst zu vergessen.', copy: 'Der Button funktioniert nicht? Kopiere diesen Link in deinen Browser:', help: 'Eine Frage? Schreib uns',
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
    code: 'Codice', ignore: 'Se non hai fatto tu questa richiesta, ignora questo messaggio.', team: '— Il team di {app}', tagline: 'Perché diventare genitori non dovrebbe voler dire dimenticarsi di sé.', copy: 'Il pulsante non funziona? Copia questo link nel browser:', help: 'Una domanda? Scrivici',
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
  const heading = subject.split(' — ')[0];
  const logo = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/auth-email/logo.png`;
  const support = 'homiyxz@gmail.com';
  const site = 'https://homifamille.com';
  // Gabarit en tableaux (Gmail, Apple Mail, Outlook), styles en ligne, blanc nacré et noir HOMI, aucun script ni image distante autre que le logo
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#F4F1EE;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(t.intro)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F1EE"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px">
<tr><td align="center" style="padding:0 0 20px">
<img src="${logo}" width="64" height="64" alt="${esc(appName)}" style="display:block;width:64px;height:64px;border:0;border-radius:16px">
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:800;letter-spacing:4px;color:#111111;padding-top:10px">${esc(appName)}</div>
</td></tr>
<tr><td style="background:#FFFFFF;border-radius:24px;padding:36px 32px;border:1px solid #ECE7E3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111">
<h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;font-weight:800;color:#111111">${esc(heading)}</h1>
<p style="margin:0;font-size:16px;line-height:1.55;color:#3D3A38">${esc(t.intro)}</p>
${t.cta ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px"><tr><td align="center" style="border-radius:999px;background:#111111"><a href="${esc(link)}" style="display:inline-block;padding:15px 30px;font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:999px">${esc(t.cta)}</a></td></tr></table>` : ''}
${d.token ? `<div style="margin:24px 0 4px;padding:16px;border-radius:16px;background:#F4F1EE;text-align:center"><div style="font-size:13px;color:#6E6965;padding-bottom:6px">${esc(L.code)}</div><div style="font-size:28px;font-weight:800;letter-spacing:6px;color:#111111">${esc(d.token)}</div></div>` : ''}
${t.cta ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6E6965">${esc(L.copy)}<br><a href="${esc(link)}" style="color:#6E6965;word-break:break-all">${esc(link)}</a></p>` : ''}
<hr style="border:0;border-top:1px solid #ECE7E3;margin:28px 0 20px">
<p style="margin:0;font-size:13px;line-height:1.5;color:#6E6965">${esc(L.ignore)}</p>
<p style="margin:12px 0 0;font-size:14px;font-weight:600;color:#111111">${esc(L.team.replace('{app}', appName))}</p>
</td></tr>
<tr><td align="center" style="padding:24px 12px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<p style="margin:0 0 10px;font-size:13px;font-style:italic;color:#6E6965">${esc(L.tagline)}</p>
<p style="margin:0;font-size:12px;line-height:1.6;color:#8C8681">${esc(L.help)} : <a href="mailto:${support}" style="color:#8C8681">${support}</a><br><a href="${site}" style="color:#8C8681">homifamille.com</a> · <a href="https://www.instagram.com/homi_famille/" style="color:#8C8681">Instagram @homi_famille</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
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
