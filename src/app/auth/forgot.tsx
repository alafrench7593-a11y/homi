import React, { useState } from 'react';
import { Screen } from '@/components/Screen';
import { Banner, Button, Field, Text } from '@/components/ui';
import { ResendButton } from '@/features/auth';
import { backend, isDemo } from '@/lib/backend';
import { emailSchema, issueText } from '@/lib/validation';
import { t as tr } from '@/i18n';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) return setError(issueText(parsed.error.issues[0].message));
    setError(null);
    setLoading(true);
    try {
      await backend.auth.resetPassword(parsed.data);
      setSent(true); // même réponse que le compte existe ou non (pas d'énumération des comptes)
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : tr('auth.sendFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen back title={tr('auth.forgot.title')} subtitle={tr('auth.forgot.subtitle')}>
      {sent ? (
        <>
          <Banner tone="success" title={tr('auth.forgot.sentTitle')}>
            {isDemo ? tr('auth.forgot.sentDemo') : tr('auth.forgot.sent', { email })}
          </Banner>
          {!isDemo ? <ResendButton onResend={() => backend.auth.resetPassword(email.trim())} /> : null}
        </>
      ) : (
        <>
          <Field label={tr('auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={error} onSubmitEditing={submit} />
          <Button label={tr('auth.forgot.getLink')} size="lg" loading={loading} disabled={loading} onPress={submit} />
          <Text variant="small" muted>{tr('auth.forgot.spam')}</Text>
        </>
      )}
    </Screen>
  );
}
