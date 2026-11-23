/** Connexion (HOMI, entrée Keynote) : un point focal, champs sur surface mate, « Se connecter » au-dessus du clavier. */
import React, { useRef, useState } from 'react';
import { router } from 'expo-router';
import { Banner, Button, Field } from '@/components/ui';
import { SocialButtons } from '@/features/auth';
import { EntryHero, EntryScreen, MattePanel } from '@/features/entry/EntryKit';
import { backend, isDemo } from '@/lib/backend';
import { entryErrorMessage } from '@/features/entry/authError';
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
      // Réseau coupé : message traduit « hors ligne » ; sinon le message du service (déjà traduit) ou générique
      setErrors({ _: entryErrorMessage(e, tr('auth.signIn.failed')) });
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <EntryScreen
      footer={
        <>
          {/* Erreur (identifiants, réseau) juste au-dessus de l'action : visible même clavier ouvert */}
          {errors._ ? <Banner tone="danger">{errors._}</Banner> : null}
          <Button label={tr('auth.signIn')} size="lg" full loading={loading} disabled={loading} onPress={submit} testID="signin-submit" />
        </>
      }
    >
      <EntryHero logo wordmark title={tr('auth.signIn.title')} lead={tr('entry.signIn.lead')} testID="entry-hero" />
      <MattePanel testID="signin-panel">
        <Field label={tr('auth.email')} value={form.email} onChangeText={(email) => { setForm((f) => ({ ...f, email })); setErrors(({ email: _e, ...r }) => r); }} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="username" error={errors.email} returnKeyType="next" />
        <Field label={tr('auth.password')} value={form.password} onChangeText={(password) => { setForm((f) => ({ ...f, password })); setErrors(({ password: _p, ...r }) => r); }} secureTextEntry revealable autoComplete="current-password" textContentType="password" error={errors.password} onSubmitEditing={submit} returnKeyType="go" />
        <Button label={tr('auth.forgot')} variant="ghost" onPress={() => router.push('/auth/forgot')} />
      </MattePanel>
      <SocialButtons onError={(m) => setErrors({ _: m })} disabled={loading} />
      <Button label={tr('auth.signUp')} variant="ghost" onPress={() => router.replace('/auth/sign-up')} />
      {isDemo ? <Banner tone="demo">{tr('auth.signIn.demoNote')}</Banner> : null}
    </EntryScreen>
  );
}
