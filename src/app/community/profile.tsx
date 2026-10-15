/** Profil communauté : pseudonyme (jamais le nom ni l'e-mail), zone générale, mes publications, personnes bloquées. */
import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Field, Row, SectionTitle, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { PostCard } from '@/features/community';
import { useAuth } from '@/lib/auth';
import { useCommunityProfile, useForums, useProfile } from '@/lib/data/hooks';
import { pseudonymError, useMyBlocks, useMyPosts, useSaveCommunityProfile, useUnblock } from '@/lib/data/hooks-community';

export default function CommunityProfileScreen() {
  const toast = useToast();
  const { session } = useAuth();
  const { data: me } = useCommunityProfile();
  const { data: profile } = useProfile();
  const { data: forums } = useForums();
  const { data: myPosts } = useMyPosts();
  const { data: blocks } = useMyBlocks();
  const saveM = useSaveCommunityProfile();
  const unblock = useUnblock();
  const [pseudo, setPseudo] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (me) {
      setPseudo(me.pseudonym);
      setArea(me.area_label ?? '');
    }
  }, [me]);

  async function save() {
    const e = pseudonymError(pseudo, { displayName: profile?.display_name, email: session?.email });
    if (e) return setError(e);
    setError(null);
    try {
      await saveM.mutateAsync({ pseudonym: pseudo, areaLabel: area, exists: !!me });
      toast('Profil communauté enregistré.');
      if (router.canGoBack()) router.back();
    } catch (err) {
      setError(err instanceof Error && /duplicate|existe/.test(err.message) ? 'Ce pseudonyme est déjà pris.' : err instanceof Error ? err.message : 'Enregistrement impossible.');
    }
  }

  return (
    <Screen back title="Mon pseudonyme" subtitle="Seul votre pseudonyme est visible des autres membres.">
      {me?.suspended_until && new Date(me.suspended_until) > new Date() && (
        <Banner tone="warning">{`Votre participation est suspendue jusqu’au ${new Date(me.suspended_until).toLocaleDateString('fr-FR')}.`}</Banner>
      )}
      <Field label="Pseudonyme" value={pseudo} onChangeText={setPseudo} maxLength={24} autoCapitalize="none" autoCorrect={false} error={error} hint="Ni votre prénom, ni votre nom, ni votre adresse e-mail." />
      <Field label="Zone générale" optional value={area} onChangeText={setArea} maxLength={60} placeholder="ex. Bretagne" hint="Utile pour les rencontres locales. Jamais d’adresse." />
      <Button label="Enregistrer" size="lg" loading={saveM.isPending} onPress={save} />
      <Text variant="caption" muted>Vous pouvez supprimer chacune de vos publications. La suppression du compte efface toutes vos contributions.</Text>

      {me ? (
        <>
          <SectionTitle title="Mes publications" />
          {myPosts?.length ? myPosts.map((p) => <PostCard key={p.id} post={p} forumTitle={forums?.find((f) => f.id === p.forum_id)?.title} />) : (
            <Text variant="small" muted>Vous n’avez encore rien publié.</Text>
          )}

          <SectionTitle title="Personnes bloquées" />
          {blocks?.length ? (
            <Card>
              {blocks.map((b) => (
                <Row key={b.userId} style={{ justifyContent: 'space-between', minHeight: 44 }}>
                  <Text style={{ flex: 1 }}>{b.pseudonym}</Text>
                  <Button label="Débloquer" size="sm" variant="ghost" disabled={unblock.isPending} onPress={() => unblock.mutate(b.userId, { onSuccess: () => toast(`${b.pseudonym} est débloqué·e.`) })} />
                </Row>
              ))}
            </Card>
          ) : (
            <Text variant="small" muted>Personne. Depuis une publication, « Signaler » permet aussi de bloquer quelqu’un : vous ne verrez plus ses contenus.</Text>
          )}
        </>
      ) : null}
    </Screen>
  );
}
