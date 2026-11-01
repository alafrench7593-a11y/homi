/**
 * Retour d'un lien e-mail ou d'une connexion Apple/Google : toietmoi://auth/callback?code=…
 * Gère aussi le lien expiré (error_code=otp_expired) avec un renvoi possible.
 */
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Field, Loading, Text } from '@/components/ui';
import { ResendButton } from '@/features/auth';
import { backend } from '@/lib/backend';
import { parseAuthCallback } from '@/lib/authFlow';
import { t as tr } from '@/i18n';

/** Session présente ? Une erreur de lecture compte comme « pas de session » : l'écran passe alors à l'état d'erreur au lieu de rester sur « Activation… ». */
async function hasSession(): Promise<boolean> {
  try {
    return !!(await backend.auth.getSession());
  } catch {
    return false;
  }
}

export default function AuthCallback() {
  const params = useLocalSearchParams<Record<string, string>>();
  const [state, setState] = useState<'loading' | 'expired' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const hash = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.hash : '';
    const r = parseAuthCallback(params, hash);
    let cancelled = false;
    (async () => {
      if (r.kind === 'code') {
        try {
          await backend.auth.exchangeCode(r.code);
        } catch (e) {
          // Sur le web, le code a pu être échangé automatiquement : une session suffit
          if (!(await hasSession())) {
            if (cancelled) return;
            setMessage(e instanceof Error ? e.message : '');
            return setState(/expiré/.test(e instanceof Error ? e.message : '') ? 'expired' : 'error');
          }
        }
        if (!cancelled) router.replace('/');
        return;
      }
      if (r.kind === 'expired') return setState('expired');
      if (await hasSession()) return router.replace('/');
      if (cancelled) return;
      setMessage(r.kind === 'error' ? r.message : tr('auth.callback.incomplete'));
      setState('error');
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === 'loading') return <Screen title={tr('auth.callback.title')}><Loading label={tr('auth.callback.activating')} /></Screen>;
  if (state === 'expired') {
    return (
      <Screen title={tr('auth.callback.expiredTitle')}>
        <Banner tone="warning" title={tr('auth.link.invalidTitle')}>{tr('auth.callback.expiredBody')}</Banner>
        <Field label={tr('auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <ResendButton label={tr('auth.link.newLink')} initialSentAt={null} onResend={async () => {
          if (!email.trim()) throw new Error(tr('v.email.required'));
          await backend.auth.resendConfirmation(email.trim());
        }} />
        <Text variant="small" muted>{tr('auth.callback.alreadyConfirmed')}</Text>
        <Button label={tr('auth.signIn')} variant="secondary" onPress={() => router.replace('/auth/sign-in')} />
      </Screen>
    );
  }
  return (
    <Screen title={tr('auth.callback.title')}>
      <Banner tone="danger">{message || tr('auth.callback.unusable')}</Banner>
      <Button label={tr('auth.signIn')} onPress={() => router.replace('/auth/sign-in')} />
      <Button label={tr('auth.forgot')} variant="ghost" onPress={() => router.replace('/auth/forgot')} />
    </Screen>
  );
}
