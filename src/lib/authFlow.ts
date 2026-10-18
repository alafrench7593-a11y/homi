/**
 * Logique pure de l'inscription et de la connexion : traduction des erreurs, liens reçus par e-mail,
 * délai de renvoi, invitation et consentements conservés pendant la confirmation de l'adresse.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Versions des documents acceptés à l'inscription (à mettre à jour à chaque nouvelle version). */
export const LEGAL_VERSIONS = { terms: '2026-10', privacy: '2026-10' } as const;

export const RESEND_COOLDOWN_S = 60;

export interface AuthLikeError { message?: unknown; code?: unknown; status?: unknown; name?: unknown }

const GENERIC = 'Une erreur est survenue. Réessayez dans un instant.';

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

  if (name === 'AuthRetryableFetchError' || status === 0 || has(/failed to fetch|network|fetch failed|load failed/i)) return 'Pas de connexion internet pour le moment. Vérifiez votre réseau puis réessayez.';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || code === 'over_sms_send_rate_limit' || status === 429 || has(/rate limit|for security purposes/i)) {
    const s = msg.match(/after (\d+) seconds?/i)?.[1];
    return s ? `Trop de tentatives. Patientez ${s} secondes avant de réessayer.` : 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
  }
  if (code === 'otp_expired' || code === 'flow_state_expired' || has(/expired|has expired|invalid or has expired/i)) return 'Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.';
  if (code === 'user_already_exists' || code === 'email_exists' || has(/already registered|already exists/i)) return 'Un compte existe déjà avec cette adresse. Connectez-vous ou utilisez « Mot de passe oublié ».';
  if (code === 'same_password' || has(/should be different/i)) return 'Le nouveau mot de passe doit être différent de l’ancien.';
  if (code === 'weak_password' || has(/password should|weak password|password is too/i)) return 'Ce mot de passe est trop faible : 8 caractères minimum, avec au moins une lettre et un chiffre.';
  if (code === 'invalid_credentials' || has(/invalid login credentials/i)) return 'Adresse e-mail ou mot de passe incorrect.';
  if (code === 'email_not_confirmed' || has(/email not confirmed/i)) return 'Confirmez d’abord votre adresse e-mail grâce au lien reçu.';
  if (code === 'email_address_invalid' || has(/validate email|invalid format|email address .* invalid/i)) return 'Cette adresse e-mail ne semble pas valide.';
  if (code === 'signup_disabled' || has(/signups not allowed/i)) return 'Les inscriptions sont momentanément fermées. Réessayez plus tard.';
  if (code === 'session_not_found' || code === 'refresh_token_not_found' || name === 'AuthSessionMissingError' || has(/session missing|session not found|refresh token/i)) return 'Votre lien ou votre session n’est plus valable. Reconnectez-vous, ou demandez un nouveau lien.';
  if (code === 'user_banned') return 'Ce compte est suspendu. Contactez le support.';
  if (code === 'provider_disabled' || has(/provider is not enabled/i)) return 'Cette méthode de connexion n’est pas encore activée.';
  return GENERIC;
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
    { key: 'length', label: '8 caractères minimum', ok: pw.length >= 8 },
    { key: 'letter', label: 'Au moins une lettre', ok: /\p{L}/u.test(pw) },
    { key: 'digit', label: 'Au moins un chiffre', ok: /[0-9]/.test(pw) },
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
