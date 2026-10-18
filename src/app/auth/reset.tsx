/**
 * Nouveau mot de passe, depuis le lien « mot de passe oublié » : toietmoi://auth/reset?code=…
 * Sans lien valide (ni code, ni session), l'écran le dit et propose un nouveau lien.
 */
import React, { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Field, Loading } from '@/components/ui';
import { PasswordRules } from '@/features/auth';
import { backend } from '@/lib/backend';
import { passwordSchema } from '@/lib/validation';
import { useToast } from '@/components/Overlays';

export default function ResetPassword() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const toast = useToast();
  const [state, setState] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    (async () => {
      if (code) {
        try {
          await backend.auth.exchangeCode(code);
          return setState('ready');
        } catch {
          /* sur le web, le code peut déjà avoir été échangé : on vérifie la session */
        }
      }
      setState((await backend.auth.getSession()) ? 'ready' : 'invalid');
    })();
  }, [code]);

  async function submit() {
    if (inFlight.current) return;
    const p = passwordSchema.safeParse(password);
    if (!p.success) return setError(p.error.issues[0].message);
    if (password !== confirm) return setError('Les deux mots de passe ne correspondent pas.');
    setError(null);
    inFlight.current = true;
    setLoading(true);
    try {
      await backend.auth.updatePassword(password);
      toast('Mot de passe modifié.');
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Modification impossible. Réessayez.');
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  if (state === 'checking') return <Screen title="Nouveau mot de passe"><Loading label="Vérification du lien…" /></Screen>;
  if (state === 'invalid') {
    return (
      <Screen back title="Nouveau mot de passe">
        <Banner tone="warning" title="Ce lien n’est plus valable">Il a expiré ou a déjà été utilisé. Demandez un nouveau lien : il arrive en quelques minutes.</Banner>
        <Button label="Recevoir un nouveau lien" onPress={() => router.replace('/auth/forgot')} />
        <Button label="Se connecter" variant="ghost" onPress={() => router.replace('/auth/sign-in')} />
      </Screen>
    );
  }
  return (
    <Screen back title="Nouveau mot de passe">
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <Field label="Nouveau mot de passe" value={password} onChangeText={setPassword} secureTextEntry revealable autoComplete="new-password" textContentType="newPassword" />
      <PasswordRules value={password} />
      <Field label="Confirmer le mot de passe" value={confirm} onChangeText={setConfirm} secureTextEntry revealable autoComplete="new-password" onSubmitEditing={submit} />
      <Button label="Enregistrer" size="lg" loading={loading} disabled={loading} onPress={submit} />
    </Screen>
  );
}
