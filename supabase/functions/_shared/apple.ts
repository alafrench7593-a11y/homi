// Révocation « Se connecter avec Apple » à la suppression du compte (exigence App Store, règle 5.1.1 v).
// Documentation Apple : Sign in with Apple REST API — « Generate and validate tokens » (POST /auth/token) et
// « Token revocation » (POST /auth/revoke).
// Secrets serveur (jamais dans l'app) : APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (contenu du fichier .p8),
// APPLE_CLIENT_ID (identifiant de l'app, par défaut fr.aufildenous.app). Sans ces secrets : « not_configured ».
// Ne journalise jamais de code, de jeton ni de clé.

const APPLE = 'https://appleid.apple.com';

export type AppleRevocation = 'revoked' | 'skipped' | 'not_configured' | 'failed';

const b64url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlText = (s: string): string => b64url(new TextEncoder().encode(s));

function pemToPkcs8(pem: string): Uint8Array<ArrayBuffer> {
  const body = pem.replace(/\\n/g, '\n').replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '');
  return Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
}

/** Secret client Apple : jeton JWT ES256 signé avec la clé .p8 (valable 5 minutes ici). */
export async function appleClientSecret(cfg: { teamId: string; keyId: string; privateKey: string; clientId: string }, now = Math.floor(Date.now() / 1000)): Promise<string> {
  const header = b64urlText(JSON.stringify({ alg: 'ES256', kid: cfg.keyId }));
  const claims = b64urlText(JSON.stringify({ iss: cfg.teamId, iat: now, exp: now + 300, aud: APPLE, sub: cfg.clientId }));
  const key = await crypto.subtle.importKey('pkcs8', pemToPkcs8(cfg.privateKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(`${header}.${claims}`)));
  return `${header}.${claims}.${b64url(sig)}`;
}

function config() {
  const teamId = Deno.env.get('APPLE_TEAM_ID');
  const keyId = Deno.env.get('APPLE_KEY_ID');
  const privateKey = Deno.env.get('APPLE_PRIVATE_KEY');
  const clientId = Deno.env.get('APPLE_CLIENT_ID') ?? 'fr.aufildenous.app';
  return teamId && keyId && privateKey ? { teamId, keyId, privateKey, clientId } : null;
}

/** Échange le code d'autorisation contre un jeton puis le révoque. Jamais bloquant pour la suppression. */
export async function revokeAppleFromCode(code: string | undefined, fetcher: typeof fetch = fetch): Promise<AppleRevocation> {
  if (!code) return 'skipped';
  const cfg = config();
  if (!cfg) return 'not_configured';
  try {
    const secret = await appleClientSecret(cfg);
    const form = (p: Record<string, string>) => ({ method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(p).toString() });
    const tok = await fetcher(`${APPLE}/auth/token`, form({ client_id: cfg.clientId, client_secret: secret, code, grant_type: 'authorization_code' }));
    if (!tok.ok) return 'failed';
    const data = await tok.json() as { refresh_token?: string; access_token?: string };
    const token = data.refresh_token ?? data.access_token;
    if (!token) return 'failed';
    const rev = await fetcher(`${APPLE}/auth/revoke`, form({ client_id: cfg.clientId, client_secret: secret, token, token_type_hint: data.refresh_token ? 'refresh_token' : 'access_token' }));
    return rev.ok ? 'revoked' : 'failed';
  } catch {
    return 'failed';
  }
}
