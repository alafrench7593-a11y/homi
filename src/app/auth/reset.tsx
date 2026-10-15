/** Lien de réinitialisation : toietmoi://auth/reset?code=… puis nouveau mot de passe. */
import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Field, Loading } from '@/components/ui';
import { backend } from '@/lib/backend';
import { passwordSchema } from '@/lib/validation';
import { useToast } from '@/components/Overlays';

export default function ResetPassword() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const toast = useToast();
  const [ready, setReady] = useState(!code);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (code) backend.auth.exchangeCode(code).then(() => setReady(true)).catch(() => setError('Ce lien a expiré. Demandez-en un nouveau.'));
  }, [code]);

  async function submit() {
    const p = passwordSchema.safeParse(password);
    if (!p.success) return setError(p.error.issues[0].message);
    setLoading(true);
    try {
      await backend.auth.updatePassword(password);
      toast('Mot de passe modifié.');
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Modification impossible.');
    } finally {
      setLoading(false);
    }
  }

  if (!ready && !error) return <Screen title="Nouveau mot de passe"><Loading /></Screen>;
  return (
    <Screen back title="Nouveau mot de passe">
      {error && !ready ? <Banner tone="danger">{error}</Banner> : (
        <>
          <Field label="Nouveau mot de passe" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" error={error} hint="10 caractères minimum, avec majuscule, minuscule et chiffre." />
          <Button label="Enregistrer" size="lg" loading={loading} onPress={submit} />
        </>
      )}
    </Screen>
  );
}
