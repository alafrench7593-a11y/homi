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
          if (!(await backend.auth.getSession())) {
            if (cancelled) return;
            setMessage(e instanceof Error ? e.message : '');
            return setState(/expiré/.test(e instanceof Error ? e.message : '') ? 'expired' : 'error');
          }
        }
        if (!cancelled) router.replace('/');
        return;
      }
      if (r.kind === 'expired') return setState('expired');
      if (await backend.auth.getSession()) return router.replace('/');
      setMessage(r.kind === 'error' ? r.message : 'Lien incomplet. Ouvrez à nouveau le lien reçu par e-mail, en entier.');
      setState('error');
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === 'loading') return <Screen title="Connexion"><Loading label="Activation de votre compte…" /></Screen>;
  if (state === 'expired') {
    return (
      <Screen title="Lien expiré">
        <Banner tone="warning" title="Ce lien n’est plus valable">Il a expiré ou a déjà été utilisé. Recevez un nouveau lien de confirmation :</Banner>
        <Field label="Adresse e-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <ResendButton label="Recevoir un nouveau lien" initialSentAt={null} onResend={async () => {
          if (!email.trim()) throw new Error('Indiquez votre adresse e-mail.');
          await backend.auth.resendConfirmation(email.trim());
        }} />
        <Text variant="small" muted>Si votre compte est déjà confirmé, connectez-vous simplement.</Text>
        <Button label="Se connecter" variant="secondary" onPress={() => router.replace('/auth/sign-in')} />
      </Screen>
    );
  }
  return (
    <Screen title="Connexion">
      <Banner tone="danger">{message || 'Ce lien ne peut pas être utilisé.'}</Banner>
      <Button label="Se connecter" onPress={() => router.replace('/auth/sign-in')} />
      <Button label="Mot de passe oublié ?" variant="ghost" onPress={() => router.replace('/auth/forgot')} />
    </Screen>
  );
}
