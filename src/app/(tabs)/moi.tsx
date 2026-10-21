/**
 * Onglet « Moi » : deux espaces clairement séparés.
 *  · Mon profil communautaire : ce que les autres membres peuvent voir (pseudonyme, @identifiant, présentation…),
 *    et mes contenus (publications, réponses, photos, enregistrés et aimés).
 *  · Mon compte privé : profils de grossesse et d'enfants, abonnement, notifications, confidentialité, personnes
 *    bloquées, sécurité, aide, export, suppression du compte, déconnexion. Rien de cet espace n'est jamais public.
 */
import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ErrorView, Skeleton } from '@/components/States';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, ListRow, Row, Segmented, SectionTitle, Text } from '@/components/ui';
import { ProfileHeader, ProfileTabs } from '@/features/communityProfile';
import { backend } from '@/lib/backend';
import { useAuth } from '@/lib/auth';
import { useActivePregnancy, useChildren, useCommunityProfile, usePremium, useProfile } from '@/lib/data/hooks';
import { useMyBlocks } from '@/lib/data/hooks-community';
import { friendlyError } from '@/lib/data/hooks-settings';
import { childAge } from '@/lib/domain/child';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { cancelAllLocal } from '@/lib/notifications';
import { BRAND } from '@/config/brand';
import { spacing } from '@/theme/tokens';

type Space = 'community' | 'account';

export default function Moi() {
  const params = useLocalSearchParams<{ tab?: Space }>();
  const [space, setSpace] = useState<Space>(params.tab === 'account' ? 'account' : 'community');
  return (
    <View style={{ flex: 1 }}>
      <Screen account title="Moi" bottomInset={96}>
        <Segmented label="Espace" value={space} onChange={setSpace} options={[{ value: 'community', label: 'Profil communautaire' }, { value: 'account', label: 'Compte privé' }]} />
        {space === 'community' ? <MyCommunity /> : <PrivateAccount />}
      </Screen>
    </View>
  );
}

function MyCommunity() {
  const q = useCommunityProfile();
  const me = q.data;
  if (q.isLoading && !me) return <Skeleton kind="card" rows={2} />;
  if (q.isError && !me) return <ErrorView error={q.error} onRetry={() => void q.refetch()} />;
  if (!me) {
    return (
      <Card testID="moi-no-profile">
        <Text variant="heading">Rejoindre la communauté</Text>
        <Text variant="small" muted style={{ marginTop: 4 }}>Choisissez un pseudonyme, un identifiant « @ », un avatar et, si vous le souhaitez, une courte présentation. Vos informations de suivi ne sont jamais affichées.</Text>
        <Button label="Créer mon profil communautaire" icon="user-plus" style={{ marginTop: spacing.sm }} onPress={() => router.push('/community/profile')} testID="moi-create-profile" />
      </Card>
    );
  }
  return (
    <View style={{ gap: spacing.md }} testID="moi-community">
      <ProfileHeader
        p={{ pseudonym: me.pseudonym, handle: me.handle, bio: me.bio, journey_label: me.journey_label, avatar_path: me.avatar_path, avatar_preset: me.avatar_preset, joined: me.created_at?.slice(0, 7), posts: me.posts_count, comments: me.comments_count, photos: me.photos_count }}
        actions={<Button label="Modifier" size="sm" variant="secondary" icon="edit-3" onPress={() => router.push('/community/profile')} testID="moi-edit-profile" />}
      />
      <Text variant="caption" muted testID="moi-visibility">
        {me.visibility === 'minimal' ? 'Profil discret : les autres membres voient seulement votre pseudonyme, votre identifiant et votre avatar.' : 'Les membres connectés voient votre présentation, votre parcours (si indiqué), votre date d’inscription et vos chiffres.'}
        {` ${me.likes_count ?? 0} publication(s) aimée(s), ${me.saved_count ?? 0} enregistrée(s).`}
      </Text>
      {me.suspended_until && me.suspended_until > new Date().toISOString() ? <Banner tone="warning">{`Votre compte communauté est suspendu jusqu’au ${new Date(me.suspended_until).toLocaleDateString('fr-FR')}.`}</Banner> : null}
      <ProfileTabs handle={me.handle ?? null} mine />
    </View>
  );
}

function PrivateAccount() {
  const toast = useToast();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const pregnancy = useActivePregnancy();
  const { data: children } = useChildren();
  const premium = usePremium();
  const blocks = useMyBlocks();
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState(false);

  async function signOut() {
    if (!(await confirm('Se déconnecter ?', 'Vos données restent enregistrées dans votre compte.', 'Se déconnecter'))) return;
    setBusy(true);
    try {
      await cancelAllLocal().catch(() => undefined);
      await backend.auth.signOut(false);
      router.replace('/welcome');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }

  return (
    <View style={{ gap: spacing.sm }} testID="moi-account">
      <Card>
        <Text weight="bold">{profile?.display_name || 'Mon compte'}</Text>
        <Text variant="small" muted>{session?.email ?? ''}</Text>
        <Text variant="caption" muted style={{ marginTop: 4 }}>Espace privé : rien de ce qui suit n’apparaît sur votre profil communautaire.</Text>
      </Card>

      <SectionTitle title="Profils de grossesse et d’enfants" />
      <Card>
        {pregnancy ? <ListRow icon="moon" title="Ma grossesse" subtitle={pregnancyProgress(pregnancy.due_date).label} onPress={() => router.push('/pregnancy')} /> : null}
        {(children ?? []).map((c) => <ListRow key={c.id} icon="smile" title={c.first_name} subtitle={childAge(c.birth_date).label} onPress={() => router.push(`/child/${c.id}`)} />)}
        <ListRow icon="plus" title="Ajouter un profil" onPress={() => router.push('/profiles/new')} />
        <ListRow icon="compass" title="Mes parcours" subtitle="Changer, terminer ou ajouter un parcours" onPress={() => router.push('/journeys')} />
        <ListRow icon="heart" title="Moi aussi" subtitle="Mon humeur, mon sommeil, ma récupération" onPress={() => router.push('/me')} />
      </Card>

      <SectionTitle title="Réglages" />
      <Card>
        <ListRow icon="star" title="Abonnement" subtitle={premium ? 'Premium actif' : 'Version gratuite'} onPress={() => router.push('/settings/subscription')} />
        <ListRow icon="bell" title="Notifications" subtitle="Rappels et notifications de la communauté" onPress={() => router.push('/community/notifications' as never)} testID="moi-notifications" />
        <ListRow icon="lock" title="Confidentialité" subtitle="Consentements, données, visibilité" onPress={() => router.push('/settings/privacy')} />
        <ListRow icon="slash" title="Personnes bloquées" subtitle={blocks.data?.length ? `${blocks.data.length} personne(s)` : 'Aucune'} onPress={() => router.push('/community/blocked' as never)} testID="moi-blocked" />
        <ListRow icon="shield" title="Sécurité" subtitle="Adresse e-mail, mot de passe" onPress={() => router.push('/settings/account')} />
        <ListRow icon="settings" title="Apparence et autres réglages" onPress={() => router.push('/settings')} />
      </Card>

      <SectionTitle title="Aide et données" />
      <Card>
        <ListRow icon="help-circle" title="Aide" subtitle="Nous écrire, règles de la communauté, urgences" onPress={() => setHelp(true)} />
        <ListRow icon="download" title="Exporter mes données" subtitle="Toutes vos données, à tout moment" onPress={() => router.push('/settings/account')} />
        <ListRow icon="trash-2" title="Supprimer mon compte" subtitle="Suppression définitive des données et photos" danger onPress={() => router.push('/settings/account')} />
      </Card>
      <Button label="Se déconnecter" variant="ghost" icon="log-out" loading={busy} onPress={signOut} testID="moi-sign-out" />

      <Sheet visible={help} onClose={() => setHelp(false)} title="Aide">
        <ListRow icon="mail" title="Nous écrire" subtitle={BRAND.supportEmail} onPress={() => Linking.openURL(`mailto:${BRAND.supportEmail}`).catch(() => toast(`Écrivez-nous à ${BRAND.supportEmail}`, 'info'))} />
        <ListRow icon="book-open" title="Règles de la communauté" onPress={() => { setHelp(false); router.push('/community/rules' as never); }} />
        <ListRow icon="life-buoy" title="Urgences" subtitle="15 · 112 · 3114" danger onPress={() => { setHelp(false); router.push('/emergency'); }} />
        <Row><Text variant="caption" muted>Toi & Moi ne remplace pas l’avis d’un professionnel de santé.</Text></Row>
      </Sheet>
    </View>
  );
}
