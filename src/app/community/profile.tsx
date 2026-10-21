/**
 * Créer ou modifier mon profil communautaire : avatar (illustration ou photo sans métadonnées), pseudonyme,
 * identifiant unique « @ », courte présentation, parcours facultatif, visibilité du profil, règles de la communauté.
 * Jamais le prénom, le nom, l'adresse e-mail, ni aucune donnée de suivi.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, Row, SectionTitle, Segmented, Text, Toggle } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { Avatar, PresetAvatar } from '@/features/community';
import { useAuth } from '@/lib/auth';
import { useCommunityProfile, useProfile } from '@/lib/data/hooks';
import { pseudonymError, useSaveCommunityProfile, useSetAvatarPhoto } from '@/lib/data/hooks-community';
import { friendlyError } from '@/lib/data/hooks-settings';
import { AVATAR_PRESETS, handleBase, handleError, JOURNEY_LABELS, normalizeHandle } from '@/lib/domain/communityRules';
import { pickPhotos } from '@/lib/documents/io';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function CommunityProfileScreen() {
  const t = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ next?: string }>();
  const { session } = useAuth();
  const meQ = useCommunityProfile();
  const me = meQ.data;
  const { data: profile } = useProfile();
  const saveM = useSaveCommunityProfile();
  const avatarM = useSetAvatarPhoto();
  const [pseudo, setPseudo] = useState('');
  const [handle, setHandle] = useState('');
  const [handleTouched, setHandleTouched] = useState(false);
  const [bio, setBio] = useState('');
  const [journey, setJourney] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'members' | 'minimal'>('members');
  const [preset, setPreset] = useState<string>('moon');
  const [rules, setRules] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handleErr, setHandleErr] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    setPseudo(me.pseudonym); setHandle(me.handle ?? ''); setHandleTouched(true); setBio(me.bio ?? ''); setJourney(me.journey_label ?? null);
    setVisibility(me.visibility ?? 'members'); setPreset(me.avatar_preset ?? 'moon');
  }, [me?.user_id, me?.handle]); // eslint-disable-line react-hooks/exhaustive-deps
  // Identifiant proposé d'après le pseudonyme tant que la personne ne l'a pas modifié
  useEffect(() => { if (!handleTouched && pseudo.trim()) setHandle(handleBase(pseudo)); }, [pseudo, handleTouched]);
  const bioLeft = 280 - bio.length;
  const creating = !me;
  const preview = useMemo(() => normalizeHandle(handle), [handle]);

  async function save() {
    if (saveM.isPending) return;
    const e = pseudonymError(pseudo, { displayName: profile?.display_name, email: session?.email });
    const he = handleError(handle);
    setError(e); setHandleErr(he);
    if (e || he) return;
    if (creating && !rules) { setError('Acceptez les règles de la communauté pour continuer.'); return; }
    try {
      await saveM.mutateAsync({ pseudonym: pseudo, handle: preview, bio, journeyLabel: journey, visibility, avatarPreset: preset, acceptRules: creating, exists: !creating, areaLabel: me?.area_label ?? null });
      toast(creating ? 'Bienvenue dans la communauté !' : 'Profil enregistré.');
      if (params.next === 'new') router.replace('/community/new');
      else if (router.canGoBack()) router.back();
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      const msg = friendlyError(err, 'Enregistrement impossible. Réessayez dans un instant.');
      if (/handle|identifiant/i.test(raw)) setHandleErr(/duplicate|pris|unique/i.test(raw) ? 'Cet identifiant est déjà pris.' : raw);
      else setError(/existe|duplicate|unique/i.test(raw) ? 'Ce pseudonyme est déjà pris.' : msg);
    }
  }

  async function pickPhoto() {
    const res = await pickPhotos(false);
    if (res === 'denied') { toast('Autorisez l’accès aux photos dans les réglages du téléphone.', 'error'); return; }
    if (!res.length) return;
    try {
      await avatarM.mutateAsync({ uri: res[0].uri, previous: me?.avatar_path ?? null });
      toast('Photo de profil mise à jour (sans localisation ni métadonnées).');
    } catch (e) { toast(friendlyError(e, 'Photo impossible à envoyer.'), 'error'); }
  }
  async function removePhoto() {
    if (!(await confirm('Retirer la photo de profil ?', 'Elle sera supprimée définitivement ; votre illustration sera affichée.', 'Retirer'))) return;
    try { await avatarM.mutateAsync({ uri: null, previous: me?.avatar_path ?? null }); toast('Photo supprimée.'); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  if (meQ.isLoading && !me) return <Screen back title="Profil communautaire"><Skeleton kind="detail" rows={4} /></Screen>;
  if (meQ.isError && !me) return <Screen back title="Profil communautaire"><ErrorView error={meQ.error} onRetry={() => void meQ.refetch()} /></Screen>;

  return (
    <Screen back title={creating ? 'Créer mon profil' : 'Modifier mon profil'} subtitle="Visible par les membres connectés. Vos données de suivi restent privées.">
      {me?.suspended_until && new Date(me.suspended_until) > new Date() ? <Banner tone="warning">{`Votre participation est suspendue jusqu’au ${new Date(me.suspended_until).toLocaleDateString('fr-FR')}.`}</Banner> : null}

      <SectionTitle title="Avatar" />
      <Card>
        <Row style={{ alignItems: 'center' }}>
          <Avatar path={me?.avatar_path} preset={preset} size={72} label="Aperçu de l’avatar" />
          <View style={{ flex: 1, gap: 6 }}>
            {me ? (
              <Row wrap>
                <Button label={me.avatar_path ? 'Changer la photo' : 'Choisir une photo'} size="sm" variant="secondary" icon="image" loading={avatarM.isPending} onPress={pickPhoto} testID="profile-photo-pick" />
                {me.avatar_path ? <Button label="Retirer la photo" size="sm" variant="ghost" icon="trash-2" onPress={removePhoto} testID="profile-photo-remove" /> : null}
              </Row>
            ) : <Text variant="small" muted>Vous pourrez ajouter une photo après avoir créé votre profil. Pensez à une image qui ne montre ni votre visage ni celui de vos enfants.</Text>}
          </View>
        </Row>
        <Text variant="small" weight="bold" style={{ marginTop: spacing.sm }}>Ou une illustration</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }} testID="profile-presets">
          {AVATAR_PRESETS.map((p) => (
            <Tappable key={p} accessibilityRole="radio" accessibilityState={{ selected: preset === p }} accessibilityLabel={`Illustration ${p}`} onPress={() => setPreset(p)} testID={`preset-${p}`}
              style={{ borderRadius: 28, padding: 2, borderWidth: 2, borderColor: preset === p ? t.colors.primary : 'transparent' }}>
              <PresetAvatar preset={p} size={44} />
            </Tappable>
          ))}
        </View>
        {me?.avatar_path ? <Text variant="caption" muted style={{ marginTop: 4 }}>La photo est prioritaire sur l’illustration.</Text> : null}
      </Card>

      <SectionTitle title="Identité dans la communauté" />
      <Card>
        <Field label="Pseudonyme" value={pseudo} onChangeText={setPseudo} maxLength={24} autoCorrect={false} error={error ?? undefined} hint="Ni votre prénom, ni votre nom, ni votre adresse e-mail." testID="profile-pseudo" />
        <Field label="Identifiant unique" value={handle} onChangeText={(v) => { setHandle(v); setHandleTouched(true); setHandleErr(null); }} maxLength={21} autoCapitalize="none" autoCorrect={false}
          error={handleErr ?? undefined} hint={`Il apparaîtra ainsi : @${preview || 'identifiant'} — lettres minuscules sans accent, chiffres, « _ ».`} testID="profile-handle" />
        <Field label="Présentation" optional value={bio} onChangeText={(v) => setBio(v.slice(0, 280))} multiline maxLength={280} placeholder="Quelques mots sur vous, sans information qui permette de vous retrouver." hint={`${bioLeft} caractère${bioLeft > 1 ? 's' : ''} restant${bioLeft > 1 ? 's' : ''}`} testID="profile-bio-input" />
        <Text variant="small" weight="bold" style={{ marginTop: spacing.xs }}>Mon parcours (facultatif)</Text>
        <Row wrap>
          <Chip label="Ne pas afficher" selected={!journey} onPress={() => setJourney(null)} />
          {Object.entries(JOURNEY_LABELS).map(([k, l]) => <Chip key={k} label={l} selected={journey === k} onPress={() => setJourney(k)} testID={`journey-${k}`} />)}
        </Row>
      </Card>

      <SectionTitle title="Visibilité du profil" />
      <Card>
        <Segmented label="Visibilité du profil" value={visibility} onChange={setVisibility} options={[{ value: 'members', label: 'Membres' }, { value: 'minimal', label: 'Discret' }]} />
        <Text variant="small" muted style={{ marginTop: 6 }} testID="profile-visibility-help">
          {visibility === 'members'
            ? 'Les membres connectés voient votre présentation, votre parcours (si indiqué), votre mois d’inscription et le nombre de vos publications.'
            : 'Les membres voient seulement votre pseudonyme, votre identifiant et votre avatar. Vos publications restent visibles dans les fils.'}
        </Text>
        <Text variant="caption" muted style={{ marginTop: 6 }}>Jamais visibles : votre nom, votre adresse e-mail, vos enfants, votre grossesse, vos médicaments, votre sommeil, vos documents, vos conversations avec l’assistant.</Text>
      </Card>

      {creating ? (
        <Card tone="soft">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ flex: 1 }}><Text weight="medium">J’accepte les règles de la communauté</Text></View>
            <Toggle label="J’accepte les règles de la communauté" value={rules} onChange={setRules} />
          </View>
          <Button label="Lire les règles" size="sm" variant="ghost" icon="book-open" style={{ alignSelf: 'flex-start' }} onPress={() => router.push('/community/rules' as never)} />
        </Card>
      ) : null}
      <Button label={creating ? 'Créer mon profil' : 'Enregistrer'} size="lg" loading={saveM.isPending} onPress={save} testID="profile-save" />
      {!creating ? <Button label="Voir mon profil public" variant="ghost" icon="eye" onPress={() => router.push(`/community/u/${me!.handle}` as never)} testID="profile-view-public" /> : null}
    </Screen>
  );
}
