/**
 * Logique pure de l'inscription et de la connexion : traduction des erreurs, liens reçus par e-mail,
 * délai de renvoi, invitation et consentements conservés pendant la confirmation de l'adresse.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t as tr } from '@/i18n';

/** Versions des documents acceptés à l'inscription (à mettre à jour à chaque nouvelle version). */
export const LEGAL_VERSIONS = { terms: '2026-11', privacy: '2026-11' } as const;

export const RESEND_COOLDOWN_S = 60;

export interface AuthLikeError { message?: unknown; code?: unknown; status?: unknown; name?: unknown }



/**
 * Message clair en français pour une erreur d'authentification Supabase.
 * Ne renvoie JAMAIS le message technique brut (souvent en anglais).
 */
export function friendlyAuthError(err: unknown): string {
  const e = (err && typeof err === 'object' ? err : { message: String(err ?? '') }) as AuthLikeError;
  const msg = String(e.message ?? '');
  const code = String(e.code ?? '');
  const status = Number(e.status ?? NaN);
  const name = String(e.name ?? '');
  const has = (re: RegExp) => re.test(msg);

  if (name === 'AuthRetryableFetchError' || status === 0 || has(/failed to fetch|network|fetch failed|load failed/i)) return tr('auth.err.network');
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || code === 'over_sms_send_rate_limit' || status === 429 || has(/rate limit|for security purposes/i)) {
    const s = msg.match(/after (\d+) seconds?/i)?.[1];
    return s ? tr('auth.err.rateSeconds', { seconds: s }) : tr('auth.err.rate');
  }
  // A-09 : lien ouvert dans un autre navigateur ou déjà utilisé (vérificateur PKCE absent)
  if (name === 'AuthPKCECodeVerifierMissingError' || code === 'pkce_verifier_missing' || has(/code verifier/i)) return tr('auth.err.linkUsed');
  if (code === 'otp_expired' || code === 'flow_state_expired' || has(/expired|has expired|invalid or has expired/i)) return tr('auth.err.expired');
  if (code === 'user_already_exists' || code === 'email_exists' || has(/already registered|already exists/i)) return tr('auth.err.exists');
  if (code === 'same_password' || has(/should be different/i)) return tr('auth.err.samePassword');
  if (code === 'weak_password' || has(/password should|weak password|password is too/i)) return tr('auth.err.weak');
  if (code === 'invalid_credentials' || has(/invalid login credentials/i)) return tr('auth.err.credentials');
  if (code === 'email_not_confirmed' || has(/email not confirmed/i)) return tr('auth.err.notConfirmed');
  if (code === 'email_address_invalid' || has(/validate email|invalid format|email address .* invalid/i)) return tr('auth.err.badEmail');
  if (code === 'signup_disabled' || has(/signups not allowed/i)) return tr('auth.err.signupClosed');
  if (code === 'session_not_found' || code === 'refresh_token_not_found' || name === 'AuthSessionMissingError' || has(/session missing|session not found|refresh token/i)) return tr('auth.err.session');
  if (code === 'user_banned') return tr('auth.err.banned');
  if (code === 'provider_disabled' || has(/provider is not enabled/i)) return tr('auth.err.provider');
  return tr('auth.err.generic');
}

/**
 * A-10 : le lien est-il expiré ou déjà utilisé ? Décidé d'après le CODE de l'erreur, jamais d'après
 * le message traduit (en anglais, le test sur « expiré » échouait).
 */
export function isExpiredLinkError(err: unknown): boolean {
  const code = String((err as { code?: string } | null)?.code ?? '');
  return ['otp_expired', 'flow_state_expired', 'flow_state_not_found', 'pkce_verifier_missing', 'bad_code_verifier'].includes(code);
}

export type CallbackResult = { kind: 'code'; code: string } | { kind: 'expired' } | { kind: 'error'; message: string } | { kind: 'missing' };

/** Analyse le lien ouvert depuis l'e-mail (paramètres de requête et fragment # du web). */
export function parseAuthCallback(params: Record<string, string | string[] | undefined>, hash = ''): CallbackResult {
  const all: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) if (v != null) all[k] = Array.isArray(v) ? v[0] : v;
  for (const [k, v] of new URLSearchParams(hash.replace(/^#/, ''))) if (!all[k]) all[k] = v;
  if (all.code) return { kind: 'code', code: all.code };
  if (all.error || all.error_code || all.error_description) {
    if (all.error_code === 'otp_expired' || /expired/i.test(all.error_description ?? '')) return { kind: 'expired' };
    return { kind: 'error', message: friendlyAuthError({ message: all.error_description, code: all.error_code }) };
  }
  return { kind: 'missing' };
}

/** Secondes restantes avant de pouvoir renvoyer un e-mail. */
export function resendRemaining(lastSentAt: number | null, now = Date.now()): number {
  if (lastSentAt == null) return 0;
  return Math.max(0, Math.ceil((lastSentAt + RESEND_COOLDOWN_S * 1000 - now) / 1000));
}

export interface PasswordRule { key: 'length' | 'letter' | 'digit'; label: string; ok: boolean }

/** Règles affichées en direct sous le champ mot de passe. */
export function passwordRules(pw: string): PasswordRule[] {
  return [
    { key: 'length', label: tr('auth.rules.length'), ok: pw.length >= 8 },
    { key: 'letter', label: tr('auth.rules.letter'), ok: /\p{L}/u.test(pw) },
    { key: 'digit', label: tr('auth.rules.digit'), ok: /[0-9]/.test(pw) },
  ];
}

// ------------------------------------------------------------------ invitation en attente
const INVITE_KEY = 'toietmoi.pending-invite.v1';
const CONSENT_KEY = 'toietmoi.pending-consents.v1';

/** Code d'invitation tiré d'un lien (…?code=…) ou d'un code collé (espaces retirés). */
export function extractInviteCode(input: string): string | null {
  const s = input.trim();
  const fromUrl = s.match(/[?&]code=([A-Za-z0-9_-]+)/)?.[1];
  const code = (fromUrl ?? s).replace(/\s+/g, '');
  return /^[A-Za-z0-9_-]{16,}$/.test(code) ? code : null;
}

export async function savePendingInvite(code: string): Promise<void> {
  await AsyncStorage.setItem(INVITE_KEY, JSON.stringify({ code, at: Date.now() }));
}

/** Reprend le code (valable 7 jours, comme l'invitation) et l'efface. */
export async function takePendingInvite(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(INVITE_KEY);
  await AsyncStorage.removeItem(INVITE_KEY);
  try {
    const v = raw ? (JSON.parse(raw) as { code: string; at: number }) : null;
    return v && Date.now() - v.at < 7 * 86400_000 ? v.code : null;
  } catch {
    return null;
  }
}

export async function peekPendingInvite(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(INVITE_KEY);
    return raw ? (JSON.parse(raw) as { code: string }).code : null;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ consentements en attente
export interface PendingConsents { email: string; terms_version: string; privacy_version: string; adult: true; accepted_at: string }

/** Gardés sur l'appareil jusqu'à la première connexion (adresse à confirmer par e-mail). */
export async function savePendingConsents(email: string, acceptedAt = new Date().toISOString()): Promise<void> {
  const v: PendingConsents = { email: email.trim().toLowerCase(), terms_version: LEGAL_VERSIONS.terms, privacy_version: LEGAL_VERSIONS.privacy, adult: true, accepted_at: acceptedAt };
  await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(v));
}

export async function takePendingConsents(): Promise<PendingConsents | null> {
  const raw = await AsyncStorage.getItem(CONSENT_KEY);
  await AsyncStorage.removeItem(CONSENT_KEY);
  try {
    return raw ? (JSON.parse(raw) as PendingConsents) : null;
  } catch {
    return null;
  }
}
