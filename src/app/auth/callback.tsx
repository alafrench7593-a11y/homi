/** Lien de confirmation d'e-mail : toietmoi://auth/callback?code=… */
import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Loading } from '@/components/ui';
import { backend } from '@/lib/backend';

export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!code) return setError('Lien incomplet. Ouvrez à nouveau le lien reçu par e-mail.');
    backend.auth.exchangeCode(code).then(() => router.replace('/')).catch((e) => setError(e instanceof Error ? e.message : 'Lien expiré.'));
  }, [code]);
  return (
    <Screen title="Confirmation">
      {error ? (
        <>
          <Banner tone="danger">{error}</Banner>
          <Button label="Se connecter" onPress={() => router.replace('/auth/sign-in')} />
        </>
      ) : (
        <Loading label="Activation de votre compte…" />
      )}
    </Screen>
  );
}
