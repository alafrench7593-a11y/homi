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
import { issueText, passwordSchema } from '@/lib/validation';
import { useToast } from '@/components/Overlays';
import { t as tr } from '@/i18n';

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
    if (!p.success) return setError(issueText(p.error.issues[0].message));
    if (password !== confirm) return setError(tr('auth.reset.mismatch'));
    setError(null);
    inFlight.current = true;
    setLoading(true);
    try {
      await backend.auth.updatePassword(password);
      toast(tr('auth.reset.done'));
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : tr('auth.reset.failed'));
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  if (state === 'checking') return <Screen title={tr('auth.reset.title')}><Loading label={tr('auth.reset.checking')} /></Screen>;
  if (state === 'invalid') {
    return (
      <Screen back title={tr('auth.reset.title')}>
        <Banner tone="warning" title={tr('auth.link.invalidTitle')}>{tr('auth.reset.invalidBody')}</Banner>
        <Button label={tr('auth.link.newLink')} onPress={() => router.replace('/auth/forgot')} />
        <Button label={tr('auth.signIn')} variant="ghost" onPress={() => router.replace('/auth/sign-in')} />
      </Screen>
    );
  }
  return (
    <Screen back title={tr('auth.reset.title')}>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <Field label={tr('auth.reset.newPassword')} value={password} onChangeText={setPassword} secureTextEntry revealable autoComplete="new-password" textContentType="newPassword" />
      <PasswordRules value={password} />
      <Field label={tr('auth.signUp.confirmPassword')} value={confirm} onChangeText={setConfirm} secureTextEntry revealable autoComplete="new-password" onSubmitEditing={submit} />
      <Button label={tr('common.save')} size="lg" loading={loading} disabled={loading} onPress={submit} />
    </Screen>
  );
}
