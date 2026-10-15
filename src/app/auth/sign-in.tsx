import React, { useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Field } from '@/components/ui';
import { backend, isDemo } from '@/lib/backend';
import { fieldErrors, signInSchema } from '@/lib/validation';

export default function SignIn() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function submit() {
    const parsed = signInSchema.safeParse(form);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setLoading(true);
    try {
      await backend.auth.signIn(parsed.data.email, parsed.data.password);
      router.replace('/');
    } catch (e) {
      setErrors({ _: e instanceof Error ? e.message : 'Connexion impossible.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen back title="Bon retour parmi nous">
      {errors._ ? <Banner tone="danger">{errors._}</Banner> : null}
      <Field label="Adresse e-mail" value={form.email} onChangeText={(email) => setForm((f) => ({ ...f, email }))} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="username" error={errors.email} />
      <Field label="Mot de passe" value={form.password} onChangeText={(password) => setForm((f) => ({ ...f, password }))} secureTextEntry autoComplete="current-password" textContentType="password" error={errors.password} onSubmitEditing={submit} />
      <Button label="Se connecter" size="lg" loading={loading} onPress={submit} />
      <Button label="Mot de passe oublié ?" variant="ghost" onPress={() => router.push('/auth/forgot')} />
      {isDemo ? <Banner tone="demo">{'En mode démonstration, les comptes sont créés uniquement sur cet appareil.'}</Banner> : null}
    </Screen>
  );
}
