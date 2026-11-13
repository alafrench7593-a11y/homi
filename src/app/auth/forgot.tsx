/** Mot de passe oublié (HOMI, entrée Keynote) : un champ sur surface mate, « Recevoir le lien » au-dessus du clavier. */
import React, { useRef, useState } from 'react';
import { router } from 'expo-router';
import { Banner, Button, Field, Text } from '@/components/ui';
import { ResendButton } from '@/features/auth';
import { EntryHero, EntryScreen, MattePanel } from '@/features/entry/EntryKit';
import { backend, isDemo } from '@/lib/backend';
import { entryErrorMessage } from '@/features/entry/authError';
import { emailSchema, issueText } from '@/lib/validation';
import { t as tr } from '@/i18n';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);

  async function submit() {
    if (inFlight.current) return; // bouton et touche Entrée : un seul envoi
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) return setError(issueText(parsed.error.issues[0].message));
    setError(null);
    inFlight.current = true;
    setLoading(true);
    try {
      await backend.auth.resetPassword(parsed.data);
      setSent(true); // même réponse que le compte existe ou non (pas d'énumération des comptes)
    } catch (e) {
      setError(entryErrorMessage(e, tr('auth.sendFailed')));
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <EntryScreen footer={<Button label={tr('auth.signIn')} size="lg" full onPress={() => router.replace('/auth/sign-in')} />}>
        <EntryHero icon="mail" title={tr('auth.forgot.sentTitle')} testID="entry-hero" />
        <Banner tone="success">
          {isDemo ? tr('auth.forgot.sentDemo') : tr('auth.forgot.sent', { email })}
        </Banner>
        <Text variant="small" muted>{tr('auth.forgot.spam')}</Text>
        {!isDemo ? <ResendButton onResend={() => backend.auth.resetPassword(email.trim())} /> : null}
      </EntryScreen>
    );
  }

  return (
    <EntryScreen footer={<Button label={tr('auth.forgot.getLink')} size="lg" full loading={loading} disabled={loading} onPress={submit} testID="forgot-submit" />}>
      <EntryHero icon="key" title={tr('auth.forgot.title')} lead={tr('auth.forgot.subtitle')} testID="entry-hero" />
      <MattePanel>
        <Field label={tr('auth.email')} value={email} onChangeText={(v) => { setEmail(v); setError(null); }} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={error} onSubmitEditing={submit} returnKeyType="send" />
      </MattePanel>
      <Text variant="small" muted center>{tr('auth.forgot.spam')}</Text>
    </EntryScreen>
  );
}
