import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Field, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { backend, eq } from '@/lib/backend';
import { useCommunityProfile, useInvalidate } from '@/lib/data/hooks';
import { useUserId } from '@/lib/auth';

export default function CommunityProfileScreen() {
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const { data: me } = useCommunityProfile();
  const [pseudo, setPseudo] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me) {
      setPseudo(me.pseudonym);
      setArea(me.area_label ?? '');
    }
  }, [me]);

  async function save() {
    if (!/^[A-Za-zÀ-ÿ0-9_.\- ]{3,24}$/.test(pseudo.trim())) return setError('3 à 24 caractères : lettres, chiffres, espace, point, tiret.');
    setSaving(true);
    setError(null);
    try {
      if (me) await backend.update('community_profiles', { pseudonym: pseudo.trim(), area_label: area.trim() || null }, [eq('user_id', userId)]);
      else await backend.insert('community_profiles', { user_id: userId, pseudonym: pseudo.trim(), area_label: area.trim() || null });
      inv('community_profiles', 'forum_feed');
      toast('Profil communauté enregistré.');
      router.back();
    } catch (e) {
      setError(e instanceof Error && /duplicate|existe/.test(e.message) ? 'Ce pseudonyme est déjà pris.' : e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen back title="Mon profil communauté" subtitle="Seul votre pseudonyme est visible.">
      {me?.suspended_until && new Date(me.suspended_until) > new Date() && (
        <Banner tone="warning">{`Votre participation est suspendue jusqu’au ${new Date(me.suspended_until).toLocaleDateString('fr-FR')}.`}</Banner>
      )}
      <Field label="Pseudonyme" value={pseudo} onChangeText={setPseudo} maxLength={24} autoCapitalize="none" error={error} hint="N’utilisez pas votre nom complet." />
      <Field label="Zone générale" optional value={area} onChangeText={setArea} maxLength={60} placeholder="ex. Bretagne" hint="Utile pour les rencontres locales. Jamais d’adresse." />
      <Button label="Enregistrer" size="lg" loading={saving} onPress={save} />
      <Text variant="caption" muted>Vous pouvez supprimer chacune de vos publications. La suppression du compte efface toutes vos contributions.</Text>
    </Screen>
  );
}
