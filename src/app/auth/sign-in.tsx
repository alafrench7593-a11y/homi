import React, { useRef, useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Field } from '@/components/ui';
import { SocialButtons } from '@/features/auth';
import { backend, isDemo } from '@/lib/backend';
import { fieldErrors, signInSchema } from '@/lib/validation';
import { t as tr } from '@/i18n';

export default function SignIn() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);

  async function submit() {
    if (inFlight.current) return; // bouton et touche Entrée : un seul envoi
    const parsed = signInSchema.safeParse(form);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    inFlight.current = true;
    setLoading(true);
    try {
      await backend.auth.signIn(parsed.data.email, parsed.data.password);
      router.replace('/');
    } catch (e) {
      setErrors({ _: e instanceof Error && e.message ? e.message : tr('auth.signIn.failed') });
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <Screen back title={tr('auth.signIn.title')}>
      {errors._ ? <Banner tone="danger">{errors._}</Banner> : null}
      <Field label={tr('auth.email')} value={form.email} onChangeText={(email) => setForm((f) => ({ ...f, email }))} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="username" error={errors.email} returnKeyType="next" />
      <Field label={tr('auth.password')} value={form.password} onChangeText={(password) => setForm((f) => ({ ...f, password }))} secureTextEntry revealable autoComplete="current-password" textContentType="password" error={errors.password} onSubmitEditing={submit} returnKeyType="go" />
      <Button label={tr('auth.signIn')} size="lg" loading={loading} disabled={loading} onPress={submit} />
      <Button label={tr('auth.forgot')} variant="ghost" onPress={() => router.push('/auth/forgot')} />
      <SocialButtons onError={(m) => setErrors({ _: m })} disabled={loading} />
      <Button label={tr('auth.signUp')} variant="ghost" onPress={() => router.replace('/auth/sign-up')} />
      {isDemo ? <Banner tone="demo">{tr('auth.signIn.demoNote')}</Banner> : null}
    </Screen>
  );
}
