/** Inscription : validation en direct, règles du mot de passe, 18 ans et CGU, confirmation par e-mail. */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Field, Row, Text } from '@/components/ui';
import { CheckRow, hasSocialSignIn, LegalLink, PasswordRules, ResendButton, SocialButtons } from '@/features/auth';
import { backend, isDemo } from '@/lib/backend';
import { LEGAL_VERSIONS, peekPendingInvite, savePendingConsents } from '@/lib/authFlow';
import { emailSchema, fieldErrors, issueText, signUpSchema } from '@/lib/validation';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function SignUp() {
  const [form, setForm] = useState({ email: '', password: '', confirm: '', adult: false, terms: false });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);
  const [sent, setSent] = useState(false);
  const [invited, setInvited] = useState(false);
  const set = (k: keyof typeof form) => (v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const touch = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));

  useEffect(() => { peekPendingInvite().then((c) => setInvited(!!c)); }, []);

  // Validation en direct (affichée dès qu'un champ a été quitté une fois)
  const live: Record<string, string | undefined> = {
    email: touched.email ? (emailSchema.safeParse(form.email).success ? undefined : issueText(emailSchema.safeParse(form.email).error?.issues[0].message)) : undefined,
    confirm: touched.confirm && form.confirm && form.confirm !== form.password ? tr('v.password.mismatch') : undefined,
  };
  const err = (k: string) => errors[k] ?? live[k];

  async function submit() {
    if (inFlight.current) return; // pas de double inscription (bouton ou touche Entrée)
    const parsed = signUpSchema.safeParse(form);
    if (!parsed.success) {
      setTouched({ email: true, password: true, confirm: true });
      return setErrors(fieldErrors(parsed.error));
    }
    setErrors({});
    inFlight.current = true;
    setLoading(true);
    try {
      const acceptedAt = new Date().toISOString();
      const { needsConfirmation } = await backend.auth.signUp(parsed.data.email, parsed.data.password, {
        adult_confirmed: true, terms_version: LEGAL_VERSIONS.terms, privacy_version: LEGAL_VERSIONS.privacy, consents_accepted_at: acceptedAt,
      });
      if (isDemo) {
        // Pas de déclencheur serveur en démonstration : consentements enregistrés tout de suite
        await backend.rpc('record_signup_consents', { p_terms_version: LEGAL_VERSIONS.terms, p_privacy_version: LEGAL_VERSIONS.privacy, p_is_adult: true });
      } else {
        await savePendingConsents(parsed.data.email, acceptedAt); // trace locale en plus du serveur
      }
      if (needsConfirmation) setSent(true);
      else router.replace('/');
    } catch (e) {
      setErrors({ _: e instanceof Error && e.message ? e.message : tr('auth.signUp.failed') });
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Screen back title={tr('auth.check.title')}>
        <Banner tone="success" title={tr('auth.check.bannerTitle')}>
          {tr('auth.check.body', { email: form.email })}
        </Banner>
        <Text variant="small" muted>{tr('auth.check.nothing')}</Text>
        <ResendButton onResend={() => backend.auth.resendConfirmation(form.email.trim())} />
        <Button label={tr('auth.check.confirmed')} onPress={() => router.replace('/auth/sign-in')} />
        <Button label={tr('auth.check.changeEmail')} variant="ghost" onPress={() => setSent(false)} />
      </Screen>
    );
  }

  return (
    <Screen back title={tr('auth.signUp.title')} subtitle={tr('auth.signUp.subtitle')}>
      {invited ? <Banner tone="info" title={tr('auth.signUp.invitedTitle')}>{tr('auth.signUp.invitedBody')}</Banner> : null}
      {errors._ ? <Banner tone="danger">{errors._}</Banner> : null}
      <Field label={tr('auth.email')} value={form.email} onChangeText={set('email')} onBlur={touch('email')} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" error={err('email')} returnKeyType="next" />
      <Field label={tr('auth.password')} value={form.password} onChangeText={set('password')} onBlur={touch('password')} secureTextEntry revealable autoComplete="new-password" textContentType="newPassword" error={errors.password} />
      <PasswordRules value={form.password} />
      <Field label={tr('auth.signUp.confirmPassword')} value={form.confirm} onChangeText={set('confirm')} onBlur={touch('confirm')} secureTextEntry revealable autoComplete="new-password" error={err('confirm')} onSubmitEditing={submit} returnKeyType="done" />

      <View style={{ gap: spacing.xs }}>
        <CheckRow label={tr('auth.signUp.adultA11y')} checked={form.adult} onChange={set('adult')} error={errors.adult}>
          <Text variant="small">{tr('auth.signUp.adult')}</Text>
        </CheckRow>
        <CheckRow label={tr('auth.signUp.termsA11y')} checked={form.terms} onChange={set('terms')} error={errors.terms}>
          <Text variant="small">{tr('auth.signUp.terms')}</Text>
        </CheckRow>
        <Row wrap style={{ paddingLeft: 34 }}>
          <LegalLink doc="terms">{tr('auth.signUp.readTerms')}</LegalLink>
          <LegalLink doc="privacy">{tr('auth.signUp.readPrivacy')}</LegalLink>
        </Row>
      </View>

      <Button label={tr('auth.signUp.create')} size="lg" loading={loading} disabled={loading} onPress={submit} />
      <SocialButtons onError={(m) => setErrors({ _: m })} disabled={loading} />
      {hasSocialSignIn() ? <Text variant="caption" muted center>{tr('auth.signUp.socialNote')}</Text> : null}
      <Button label={tr('auth.signUp.haveAccount')} variant="ghost" onPress={() => router.replace('/auth/sign-in')} />
    </Screen>
  );
}
