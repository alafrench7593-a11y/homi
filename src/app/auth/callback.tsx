/**
 * Retour d'un lien e-mail ou d'une connexion Apple/Google : toietmoi://auth/callback?code=…
 * Gère aussi le lien expiré (error_code=otp_expired) avec un renvoi possible.
 */
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Banner, Button, Field, Loading, Text } from '@/components/ui';
import { ResendButton } from '@/features/auth';
import { EntryHero, EntryScreen, MattePanel } from '@/features/entry/EntryKit';
import { backend } from '@/lib/backend';
import { isExpiredLinkError, parseAuthCallback } from '@/lib/authFlow';
import { hasSession, waitForSession } from '@/lib/authSession';
import { t as tr } from '@/i18n';

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
        if (Platform.OS === 'web') {
          // Échange déjà fait (ou tenté) par le client : session présente, sinon lien plus valable
          if (!(await waitForSession())) {
            if (!cancelled) setState('expired');
            return;
          }
        } else {
          try {
            await backend.auth.exchangeCode(r.code);
          } catch (e) {
            if (!(await hasSession())) {
              if (cancelled) return;
              setMessage(e instanceof Error ? e.message : '');
              return setState(isExpiredLinkError(e) ? 'expired' : 'error');
            }
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

  if (state === 'loading') {
    return (
      <EntryScreen back={false}>
        <EntryHero icon="check" title={tr('auth.callback.title')} testID="entry-hero" />
        <Loading label={tr('auth.callback.activating')} />
      </EntryScreen>
    );
  }
  if (state === 'expired') {
    return (
      <EntryScreen back={false} footer={<Button label={tr('auth.signIn')} variant="secondary" full onPress={() => router.replace('/auth/sign-in')} />}>
        <EntryHero icon="link" title={tr('auth.callback.expiredTitle')} testID="entry-hero" />
        <Banner tone="warning" title={tr('auth.link.invalidTitle')}>{tr('auth.callback.expiredBody')}</Banner>
        <MattePanel>
          <Field label={tr('auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <ResendButton label={tr('auth.link.newLink')} initialSentAt={null} onResend={async () => {
            if (!email.trim()) throw new Error(tr('v.email.required'));
            await backend.auth.resendConfirmation(email.trim());
          }} />
        </MattePanel>
        <Text variant="small" muted>{tr('auth.callback.alreadyConfirmed')}</Text>
      </EntryScreen>
    );
  }
  return (
    <EntryScreen back={false} footer={<Button label={tr('auth.signIn')} size="lg" full onPress={() => router.replace('/auth/sign-in')} />}>
      <EntryHero icon="alert-triangle" title={tr('auth.callback.title')} testID="entry-hero" />
      <Banner tone="danger">{message || tr('auth.callback.unusable')}</Banner>
      <Button label={tr('auth.forgot')} variant="ghost" onPress={() => router.replace('/auth/forgot')} />
    </EntryScreen>
  );
}
