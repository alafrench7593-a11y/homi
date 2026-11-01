/**
 * Connexion Apple et Google avec Supabase.
 *  - iPhone : « Se connecter avec Apple » natif (expo-apple-authentication) + jeton d'identité vérifié par Supabase.
 *  - Google partout, et Apple sur Android et le web : page sécurisée du fournisseur (OAuth + PKCE),
 *    puis retour dans l'app par le lien toietmoi://auth/callback.
 * Les fournisseurs doivent être activés dans Supabase (Authentication › Providers) : voir SETUP.md.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as ExpoCrypto from 'expo-crypto';
import { friendlyAuthError, parseAuthCallback } from '../authFlow';
import { BackendError } from './types';
import { t as tr } from '@/i18n';

/** Adresse de retour des liens : schéma de l'app (toietmoi://…) sur téléphone, URL du site sur le web. */
export function authRedirect(path: '/auth/callback' | '/auth/reset'): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return `${window.location.origin}${path}`;
  return Linking.createURL(path);
}

/** Erreur particulière : l'utilisatrice a fermé la fenêtre de connexion (rien à afficher). */
export const CANCELLED = 'cancelled';

function fail(err: { message?: string; code?: string; status?: number } | null): void {
  if (err) throw new BackendError(friendlyAuthError(err), err.code, undefined, err.status);
}

async function appleNative(client: SupabaseClient) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Apple = require('expo-apple-authentication') as typeof import('expo-apple-authentication');
  if (!(await Apple.isAvailableAsync())) throw new BackendError(tr('l2.auth.appleUnavailable'));
  const rawNonce = Array.from(ExpoCrypto.getRandomBytes(16), (b) => b.toString(16).padStart(2, '0')).join('');
  const hashed = await ExpoCrypto.digestStringAsync(ExpoCrypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let cred: import('expo-apple-authentication').AppleAuthenticationCredential;
  try {
    cred = await Apple.signInAsync({ requestedScopes: [Apple.AppleAuthenticationScope.FULL_NAME, Apple.AppleAuthenticationScope.EMAIL], nonce: hashed });
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') throw new BackendError('', CANCELLED);
    throw new BackendError(tr('l2.auth.appleFailed'));
  }
  if (!cred.identityToken) throw new BackendError(tr('l2.auth.appleNoId'));
  const { error } = await client.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken, nonce: rawNonce });
  fail(error);
}

async function browserOAuth(client: SupabaseClient, provider: 'apple' | 'google') {
  const redirectTo = authRedirect('/auth/callback');
  if (Platform.OS === 'web') {
    const { error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo } });
    fail(error); // la page part chez le fournisseur puis revient sur /auth/callback
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const WebBrowser = require('expo-web-browser') as typeof import('expo-web-browser');
  const { data, error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
  fail(error);
  if (!data?.url) throw new BackendError(tr('l2.auth.unavailable'));
  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== 'success') throw new BackendError('', CANCELLED);
  const url = new URL(res.url.replace(/^[a-z]+:\/\//i, 'https://x/'));
  const parsed = parseAuthCallback(Object.fromEntries(url.searchParams), url.hash);
  if (parsed.kind === 'code') {
    const { error: e2 } = await client.auth.exchangeCodeForSession(parsed.code);
    fail(e2);
    return;
  }
  throw new BackendError(parsed.kind === 'error' ? parsed.message : parsed.kind === 'expired' ? friendlyAuthError({ code: 'otp_expired' }) : tr('l2.auth.interrupted'));
}

export async function socialSignIn(client: SupabaseClient, provider: 'apple' | 'google'): Promise<void> {
  if (provider === 'apple' && Platform.OS === 'ios') return appleNative(client);
  return browserOAuth(client, provider);
}
