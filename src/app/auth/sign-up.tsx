/** Inscription : validation en direct, règles du mot de passe, 18 ans et CGU, confirmation par e-mail. */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Field, Row, Text } from '@/components/ui';
import { CheckRow, LegalLink, PasswordRules, ResendButton, SocialButtons } from '@/features/auth';
import { backend, isDemo } from '@/lib/backend';
import { LEGAL_VERSIONS, peekPendingInvite, savePendingConsents } from '@/lib/authFlow';
import { emailSchema, fieldErrors, signUpSchema } from '@/lib/validation';
import { spacing } from '@/theme/tokens';

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
    email: touched.email ? (emailSchema.safeParse(form.email).success ? undefined : emailSchema.safeParse(form.email).error?.issues[0].message) : undefined,
    confirm: touched.confirm && form.confirm && form.confirm !== form.password ? 'Les deux mots de passe ne correspondent pas.' : undefined,
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
      setErrors({ _: e instanceof Error && e.message ? e.message : 'Inscription impossible. Réessayez.' });
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Screen back title="Vérifiez vos e-mails">
        <Banner tone="success" title="Plus qu’une étape">
          {`Nous avons envoyé un lien de confirmation à ${form.email}. Ouvrez-le depuis ce téléphone : l’application s’ouvrira et votre compte sera activé.`}
        </Banner>
        <Text variant="small" muted>Rien reçu ? Vérifiez vos courriers indésirables, puis renvoyez l’e-mail. Le lien est valable 24 heures.</Text>
        <ResendButton onResend={() => backend.auth.resendConfirmation(form.email.trim())} />
        <Button label="J’ai confirmé, me connecter" onPress={() => router.replace('/auth/sign-in')} />
        <Button label="Modifier l’adresse e-mail" variant="ghost" onPress={() => setSent(false)} />
      </Screen>
    );
  }

  return (
    <Screen back title="Créer mon compte" subtitle="Quelques secondes, et un espace rien qu’à vous.">
      {invited ? <Banner tone="info" title="Vous avez été invité·e">Créez votre compte : vous rejoindrez ensuite le foyer qui vous a invité·e.</Banner> : null}
      {errors._ ? <Banner tone="danger">{errors._}</Banner> : null}
      <Field label="Adresse e-mail" value={form.email} onChangeText={set('email')} onBlur={touch('email')} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" error={err('email')} returnKeyType="next" />
      <Field label="Mot de passe" value={form.password} onChangeText={set('password')} onBlur={touch('password')} secureTextEntry revealable autoComplete="new-password" textContentType="newPassword" error={errors.password} />
      <PasswordRules value={form.password} />
      <Field label="Confirmer le mot de passe" value={form.confirm} onChangeText={set('confirm')} onBlur={touch('confirm')} secureTextEntry revealable autoComplete="new-password" error={err('confirm')} onSubmitEditing={submit} returnKeyType="done" />

      <View style={{ gap: spacing.xs }}>
        <CheckRow label="J’ai 18 ans ou plus" checked={form.adult} onChange={set('adult')} error={errors.adult}>
          <Text variant="small">J’ai 18 ans ou plus.</Text>
        </CheckRow>
        <CheckRow label="J’accepte les conditions d’utilisation et la politique de confidentialité" checked={form.terms} onChange={set('terms')} error={errors.terms}>
          <Text variant="small">J’accepte les conditions d’utilisation et la politique de confidentialité. Je comprends que l’application informe mais ne remplace pas un professionnel de santé.</Text>
        </CheckRow>
        <Row wrap style={{ paddingLeft: 34 }}>
          <LegalLink doc="terms">Lire les conditions d’utilisation</LegalLink>
          <LegalLink doc="privacy">Lire la politique de confidentialité</LegalLink>
        </Row>
      </View>

      <Button label="Créer mon compte" size="lg" loading={loading} disabled={loading} onPress={submit} />
      <SocialButtons onError={(m) => setErrors({ _: m })} disabled={loading} />
      <Text variant="caption" muted center>Avec Apple ou Google, l’âge et l’accord aux conditions vous seront demandés juste après.</Text>
      <Button label="J’ai déjà un compte" variant="ghost" onPress={() => router.replace('/auth/sign-in')} />
    </Screen>
  );
}
