import React, { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Field, Icon, Text } from '@/components/ui';
import { backend } from '@/lib/backend';
import { fieldErrors, signUpSchema } from '@/lib/validation';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function SignUp() {
  const t = useTheme();
  const [form, setForm] = useState({ email: '', password: '', confirm: '', terms: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof form) => (v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    const parsed = signUpSchema.safeParse(form);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setLoading(true);
    try {
      const { needsConfirmation } = await backend.auth.signUp(parsed.data.email, parsed.data.password);
      if (needsConfirmation) setSent(true);
      else router.replace('/onboarding');
    } catch (e) {
      setErrors({ _: e instanceof Error ? e.message : 'Inscription impossible.' });
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Screen back title="Vérifiez vos e-mails">
        <Banner tone="success" title="Plus qu’une étape">
          {`Nous avons envoyé un lien de confirmation à ${form.email}. Ouvrez-le depuis ce téléphone pour activer votre compte.`}
        </Banner>
        <Button label="J’ai confirmé, me connecter" onPress={() => router.replace('/auth/sign-in')} />
      </Screen>
    );
  }

  return (
    <Screen back title="Créer mon compte" subtitle="Quelques secondes, et un espace rien qu’à vous.">
      {errors._ ? <Banner tone="danger">{errors._}</Banner> : null}
      <Field label="Adresse e-mail" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" error={errors.email} />
      <Field label="Mot de passe" value={form.password} onChangeText={set('password')} secureTextEntry autoComplete="new-password" textContentType="newPassword" hint="10 caractères minimum, avec majuscule, minuscule et chiffre." error={errors.password} />
      <Field label="Confirmer le mot de passe" value={form.confirm} onChangeText={set('confirm')} secureTextEntry autoComplete="new-password" error={errors.confirm} />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: form.terms }}
        onPress={() => set('terms')(!form.terms)}
        style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', paddingVertical: spacing.xs }}
      >
        <View style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, borderColor: errors.terms ? t.colors.danger : t.colors.primary, backgroundColor: form.terms ? t.colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {form.terms && <Icon name="check" size={16} color={t.colors.primaryText} />}
        </View>
        <Text variant="small" style={{ flex: 1 }}>
          J’accepte les conditions d’utilisation et la politique de confidentialité. Je comprends que l’application informe mais ne remplace pas un professionnel de santé.
        </Text>
      </Pressable>
      {errors.terms ? <Text variant="small" color={t.colors.danger}>{errors.terms}</Text> : null}
      <Text variant="small" color={t.colors.primary} accessibilityRole="link" onPress={() => Linking.openURL('https://www.cnil.fr/fr/reglement-europeen-protection-donnees')}>
        Vos droits sur vos données (CNIL)
      </Text>

      <Button label="Créer mon compte" size="lg" loading={loading} onPress={submit} />
      <Button label="J’ai déjà un compte" variant="ghost" onPress={() => router.replace('/auth/sign-in')} />
    </Screen>
  );
}
