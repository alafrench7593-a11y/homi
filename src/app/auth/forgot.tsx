import React, { useState } from 'react';
import { Screen } from '@/components/Screen';
import { Banner, Button, Field, Text } from '@/components/ui';
import { backend, isDemo } from '@/lib/backend';
import { emailSchema } from '@/lib/validation';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setError(null);
    setLoading(true);
    try {
      await backend.auth.resetPassword(parsed.data);
      setSent(true); // même réponse que le compte existe ou non (pas d'énumération des comptes)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Envoi impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen back title="Mot de passe oublié" subtitle="Recevez un lien pour choisir un nouveau mot de passe.">
      {sent ? (
        <Banner tone="success" title="C’est envoyé">
          {isDemo ? 'En mode démonstration, aucun e-mail n’est envoyé. Créez un nouveau compte local si besoin.' : `Si un compte existe pour ${email}, vous allez recevoir un e-mail dans quelques minutes.`}
        </Banner>
      ) : (
        <>
          <Field label="Adresse e-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={error} />
          <Button label="Recevoir le lien" size="lg" loading={loading} onPress={submit} />
          <Text variant="small" muted>Pensez à vérifier vos courriers indésirables.</Text>
        </>
      )}
    </Screen>
  );
}
