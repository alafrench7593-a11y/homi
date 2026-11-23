/**
 * Nouveau mot de passe, depuis le lien « mot de passe oublié » : toietmoi://auth/reset?code=…
 * Sans lien valide (ni code, ni session), l'écran le dit et propose un nouveau lien.
 */
import React, { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Banner, Button, Field, Loading } from '@/components/ui';
import { PasswordRules } from '@/features/auth';
import { EntryHero, EntryScreen, MattePanel } from '@/features/entry/EntryKit';
import { entryErrorMessage } from '@/features/entry/authError';
import { Platform } from 'react-native';
import { backend } from '@/lib/backend';
import { waitForSession } from '@/lib/authSession';
import { issueText, passwordSchema } from '@/lib/validation';
import { useToast } from '@/components/Overlays';
import { t as tr } from '@/i18n';

/** Session présente ? Une erreur de lecture compte comme « lien invalide » : l'écran ne reste pas sur « Vérification… ». */
async function hasSession(): Promise<boolean> {
  try {
    return !!(await backend.auth.getSession());
  } catch {
    return false;
  }
}

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
      if (code && Platform.OS === 'web') {
        // A-09 : sur le web, le client a déjà échangé le code au chargement
        return setState((await waitForSession()) ? 'ready' : 'invalid');
      }
      if (code) {
        try {
          await backend.auth.exchangeCode(code);
          return setState('ready');
        } catch {
          /* sur le web, le code peut déjà avoir été échangé : on vérifie la session */
        }
      }
      setState((await hasSession()) ? 'ready' : 'invalid');
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
      setError(entryErrorMessage(e, tr('auth.reset.failed')));
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  if (state === 'checking') {
    return (
      <EntryScreen back={false}>
        <EntryHero icon="key" title={tr('auth.reset.title')} testID="entry-hero" />
        <Loading label={tr('auth.reset.checking')} />
      </EntryScreen>
    );
  }
  if (state === 'invalid') {
    return (
      <EntryScreen footer={<Button label={tr('auth.link.newLink')} size="lg" full onPress={() => router.replace('/auth/forgot')} />}>
        <EntryHero icon="link" title={tr('auth.link.invalidTitle')} lead={tr('auth.reset.invalidBody')} testID="entry-hero" />
        <Button label={tr('auth.signIn')} variant="ghost" onPress={() => router.replace('/auth/sign-in')} />
      </EntryScreen>
    );
  }
  return (
    <EntryScreen footer={<Button label={tr('common.save')} size="lg" full loading={loading} disabled={loading} onPress={submit} testID="reset-submit" />}>
      <EntryHero icon="key" title={tr('auth.reset.title')} testID="entry-hero" />
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <MattePanel>
        <Field label={tr('auth.reset.newPassword')} value={password} onChangeText={setPassword} secureTextEntry revealable autoComplete="new-password" textContentType="newPassword" />
        <PasswordRules value={password} />
        <Field label={tr('auth.signUp.confirmPassword')} value={confirm} onChangeText={setConfirm} secureTextEntry revealable autoComplete="new-password" onSubmitEditing={submit} />
      </MattePanel>
    </EntryScreen>
  );
}
