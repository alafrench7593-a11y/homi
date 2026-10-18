/**
 * Étape 1 — inscription et connexion : chaque test reproduit un bug relevé dans AUDIT.md (B1–B14)
 * avant sa correction.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import {
  friendlyAuthError, parseAuthCallback, passwordRules, resendRemaining, RESEND_COOLDOWN_S,
  savePendingInvite, takePendingInvite, savePendingConsents, takePendingConsents, LEGAL_VERSIONS, extractInviteCode,
} from '@/lib/authFlow';
import { issueText, signUpSchema, passwordSchema } from '@/lib/validation';
import { restoreDraft, serializeDraft, type OnboardingDraft } from '@/lib/onboardingDraft';

describe('B5 — erreurs Supabase traduites, jamais de message technique brut', () => {
  const cases: [Record<string, unknown>, RegExp][] = [
    [{ message: 'User already registered', code: 'user_already_exists', status: 422 }, /existe déjà/],
    [{ message: 'Password should be at least 8 characters.', code: 'weak_password', status: 422 }, /mot de passe/i],
    [{ message: 'email rate limit exceeded', code: 'over_email_send_rate_limit', status: 429 }, /trop de tentatives|patientez/i],
    [{ message: 'For security purposes, you can only request this after 42 seconds.', status: 429 }, /patientez|tentatives/i],
    [{ message: 'Request rate limit reached', code: 'over_request_rate_limit', status: 429 }, /trop de tentatives|patientez/i],
    [{ message: 'Email link is invalid or has expired', code: 'otp_expired', status: 403 }, /expiré/],
    [{ message: 'Auth session missing!', name: 'AuthSessionMissingError', status: 400 }, /lien|session|reconnect/i],
    [{ message: 'New password should be different from the old password.', code: 'same_password' }, /différent/],
    [{ message: 'Invalid login credentials', code: 'invalid_credentials', status: 400 }, /incorrect/],
    [{ message: 'Email not confirmed', code: 'email_not_confirmed' }, /confirmez/i],
    [{ message: 'Failed to fetch', name: 'AuthRetryableFetchError', status: 0 }, /connexion internet/],
    [{ message: 'Signups not allowed for this instance', code: 'signup_disabled' }, /inscriptions/i],
    [{ message: 'Unable to validate email address: invalid format', code: 'email_address_invalid' }, /adresse e-mail/i],
    [{ message: 'Some totally unknown english error from the server' }, /réessayez/i],
  ];
  it.each(cases)('%j', (err, expected) => {
    const out = friendlyAuthError(err);
    expect(out).toMatch(expected);
    expect(out).not.toMatch(/\b(the|should|invalid|error|session missing|rate limit)\b/i);
  });
});

describe('B6 — règles du mot de passe : 8 caractères, une lettre et un chiffre, affichées en direct', () => {
  it('accepte 8 caractères avec lettre et chiffre', () => {
    expect(passwordSchema.safeParse('abcdefg1').success).toBe(true);
    expect(passwordSchema.safeParse('abcdefgh').success).toBe(false);
    expect(passwordSchema.safeParse('1234567a').success).toBe(true);
    expect(passwordSchema.safeParse('abc1').success).toBe(false);
  });
  it('liste des règles avec leur état, pour l’affichage en direct', () => {
    expect(passwordRules('ab1')).toEqual([
      { key: 'length', label: '8 caractères minimum', ok: false },
      { key: 'letter', label: 'Au moins une lettre', ok: true },
      { key: 'digit', label: 'Au moins un chiffre', ok: true },
    ]);
  });
});

describe('B12 — 18 ans ou plus, CGU et confidentialité obligatoires à l’inscription', () => {
  const base = { email: 'a@b.fr', password: 'abcdefg1', confirm: 'abcdefg1', terms: true, adult: true };
  it('refuse sans la case 18 ans', () => {
    const r = signUpSchema.safeParse({ ...base, adult: false });
    expect(r.success).toBe(false);
    expect(JSON.stringify((r.error?.issues ?? []).map((i) => issueText(i.message)))).toMatch(/18 ans/);
  });
  it('refuse sans l’acceptation des CGU', () => {
    expect(signUpSchema.safeParse({ ...base, terms: false }).success).toBe(false);
  });
  it('accepte tout coché', () => expect(signUpSchema.safeParse(base).success).toBe(true));
  it('les consentements en attente (confirmation e-mail) sont conservés avec leur horodatage', async () => {
    await savePendingConsents('a@b.fr', '2026-10-18T10:00:00.000Z');
    const c = await takePendingConsents();
    expect(c).toEqual({ email: 'a@b.fr', terms_version: LEGAL_VERSIONS.terms, privacy_version: LEGAL_VERSIONS.privacy, adult: true, accepted_at: '2026-10-18T10:00:00.000Z' });
    expect(await takePendingConsents()).toBeNull(); // consommés une seule fois
  });
});

describe('B3 — lien de confirmation : code, lien expiré, erreur', () => {
  it('code présent', () => expect(parseAuthCallback({ code: 'abc' })).toEqual({ kind: 'code', code: 'abc' }));
  it('lien expiré (query)', () => expect(parseAuthCallback({ error: 'access_denied', error_code: 'otp_expired', error_description: 'Email link is invalid or has expired' })).toEqual({ kind: 'expired' }));
  it('lien expiré (fragment # du web)', () => expect(parseAuthCallback({}, '#error=access_denied&error_code=otp_expired&error_description=Email+link')).toEqual({ kind: 'expired' }));
  it('autre erreur → message français', () => {
    const r = parseAuthCallback({ error: 'server_error', error_description: 'Database error saving new user' });
    expect(r.kind).toBe('error');
    expect(r.kind === 'error' && r.message).not.toMatch(/Database/);
  });
  it('rien → lien incomplet', () => expect(parseAuthCallback({})).toEqual({ kind: 'missing' }));
});

describe('B4 — « Renvoyer l’e-mail » limité à une fois toutes les 60 s', () => {
  it('compte à rebours', () => {
    expect(RESEND_COOLDOWN_S).toBe(60);
    expect(resendRemaining(null, 1000)).toBe(0);
    expect(resendRemaining(0, 15_000)).toBe(45);
    expect(resendRemaining(0, 60_000)).toBe(0);
    expect(resendRemaining(0, 59_001)).toBe(1);
  });
});

describe('B13 — invitation du coparent conservée pendant l’inscription', () => {
  it('extrait le code d’un lien d’invitation ou d’un code collé', () => {
    expect(extractInviteCode('toietmoi://settings/family?code=AbCdEfGh12345678XyZ')).toBe('AbCdEfGh12345678XyZ');
    expect(extractInviteCode('  AbCd EfGh 1234 5678  ')).toBe('AbCdEfGh12345678');
    expect(extractInviteCode('court')).toBeNull();
  });
  it('le code est gardé puis repris une seule fois après connexion', async () => {
    await savePendingInvite('AbCdEfGh12345678XyZ');
    expect(await takePendingInvite()).toBe('AbCdEfGh12345678XyZ');
    expect(await takePendingInvite()).toBeNull();
  });
});

describe('B11 — onboarding sauvegardé et repris là où on s’était arrêté', () => {
  const draft: OnboardingDraft = {
    v: 1, step: 'children', name: 'Sarah', journeys: ['family'],
    pregnancy: { due_date: '', multiplicity: 'single' } as never, children: [{ first_name: 'Lina', birth_date: '12/03/2026', sex: null } as never],
    reminders: ['bottle'], consents: { terms: true, health_data: true, ai_assistant: true, document_reading: false, analytics: false, crash_reports: false, marketing: false },
    bottleFeeding: 'yes',
    interests: ['community'],
  };
  it('aller-retour sans perte', () => expect(restoreDraft(serializeDraft(draft))).toEqual(draft));
  it('ancien brouillon sans centres d’intérêt → liste vide', () => {
    const { interests: _omit, ...old } = draft;
    expect(restoreDraft(JSON.stringify(old))?.interests).toEqual([]);
  });
  it('brouillon illisible ou d’une autre version → ignoré', () => {
    expect(restoreDraft('{pas du json')).toBeNull();
    expect(restoreDraft(JSON.stringify({ ...draft, v: 99 }))).toBeNull();
    expect(restoreDraft(null)).toBeNull();
  });
  it('étape inconnue → reprise à « journeys »', () => expect(restoreDraft(JSON.stringify({ ...draft, step: 'nimporte' }))?.step).toBe('journeys'));
});
