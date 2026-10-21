/**
 * Un album : photos (nettoyées avant l'envoi), ajout et retrait (propriétaire, Premium pour ajouter),
 * partage avec des membres choisis (Premium), arrêt d'un partage et suppression (toujours possibles).
 * Une personne avec qui l'album est partagé peut le consulter, et se retirer du partage.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Button, Card, Chip, Field, IconButton, Row, SectionTitle, Text } from '@/components/ui';
import { PhotoGrid, PhotoViewer } from '@/features/community';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { useAlbumAction, useAlbumPhotos, useAlbums } from '@/lib/data/hooks-social';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { friendlyError } from '@/lib/data/hooks-settings';
import { pickPhotos } from '@/lib/documents/io';
import { isPremiumRequired } from '@/lib/premium/features';
import { useInvalidate } from '@/lib/data/hooks';
import { spacing } from '@/theme/tokens';

export default function AlbumScreen() {
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : null;
  const albums = useAlbums();
  const photos = useAlbumPhotos(id);
  const act = useAlbumAction();
  const access = usePremiumAccess('community_albums');
  const [viewer, setViewer] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const album = (albums.data ?? []).find((a) => a.id === id) ?? null;

  async function run(a: Parameters<typeof act.mutateAsync>[0], ok?: string) {
    try { await act.mutateAsync(a); if (ok) toast(ok); return true; }
    catch (e) { if (isPremiumRequired(e)) access.showPreview(); else toast(friendlyError(e), 'error'); return false; }
  }
  async function addPhotos() {
    if (!album) return;
    if (!access.require()) return;
    const res = await pickPhotos(true);
    if (res === 'denied') { toast('Autorisez l’accès aux photos dans les réglages du téléphone.', 'error'); return; }
    setBusy(true);
    try { for (const r of res.slice(0, 20)) if (!(await run({ kind: 'addPhoto', albumId: album.id, uri: r.uri }))) break; }
    finally { setBusy(false); }
  }

  if (albums.isLoading && !albums.data) return <Screen back title="Album"><Skeleton kind="card" rows={2} /></Screen>;
  if (!album) return <Screen back title="Album"><EmptyState icon="image" title="Album introuvable" body="Il a peut-être été supprimé, ou n’est plus partagé avec vous." /></Screen>;
  const list = photos.data ?? [];

  return (
    <Screen back title={album.title} subtitle={album.is_mine ? (album.shared_with?.length ? `Partagé avec ${album.shared_with.length} membre${album.shared_with.length > 1 ? 's' : ''}` : 'Album privé') : `Partagé par @${album.owner_handle}`}>
      {album.is_mine ? (
        <Row gap={6} wrap>
          <Button label="Ajouter des photos" icon="image" size="sm" loading={busy} onPress={() => void addPhotos()} testID="album-add" />
          <Button label="Partager" icon="user-plus" size="sm" variant="secondary" onPress={() => (access.require() ? setSharing(true) : undefined)} testID="album-share" />
        </Row>
      ) : null}
      {photos.isLoading && !photos.data ? <Skeleton kind="card" rows={1} /> : list.length ? (
        <View testID="album-photos">
          <PhotoGrid photos={list.map((p) => ({ path: p.path, width: p.width, height: p.height }))} onOpen={setViewer} />
          {album.is_mine ? (
            <Row wrap gap={6} style={{ marginTop: spacing.xs }}>
              {list.map((p, i) => <Chip key={p.id} label={`Retirer la photo ${i + 1}`} icon="x" onPress={async () => { if (await confirm('Retirer cette photo ?', 'Elle sera supprimée définitivement.', 'Retirer')) void run({ kind: 'removePhoto', id: p.id, path: p.path }, 'Photo retirée.'); }} />)}
            </Row>
          ) : null}
        </View>
      ) : <EmptyState icon="image" title="Aucune photo pour l’instant" body={album.is_mine ? 'Les photos sont nettoyées de leurs métadonnées (position GPS comprise) avant l’envoi.' : undefined} />}
      {album.is_mine && album.shared_with?.length ? (
        <>
          <SectionTitle title="Partagé avec" />
          <Card>
            {album.shared_with.map((h) => (
              <Row key={h}><Text style={{ flex: 1 }}>{`@${h}`}</Text><IconButton icon="x" label={`Arrêter le partage avec @${h}`} onPress={() => void run({ kind: 'unshare', albumId: album.id, handle: h }, `Partage avec @${h} arrêté.`)} /></Row>
            ))}
          </Card>
        </>
      ) : null}
      {album.is_mine ? (
        <Button label="Supprimer l’album" icon="trash-2" variant="ghost" onPress={async () => {
          if (!(await confirm('Supprimer définitivement cet album ?', 'Ses photos seront effacées pour vous et pour les personnes avec qui il est partagé.', 'Supprimer'))) return;
          if (await run({ kind: 'delete', id: album.id, paths: list.map((p) => p.path) }, 'Album supprimé.')) router.back();
        }} testID="album-delete" />
      ) : (
        <Button label="Ne plus voir cet album" variant="ghost" icon="eye-off" onPress={async () => {
          try { await backend.remove('album_shares', [eq('album_id', album.id), eq('user_id', userId)]); inv('community_albums'); router.back(); }
          catch (e) { toast(friendlyError(e), 'error'); }
        }} />
      )}
      <PhotoViewer photos={list.map((p) => ({ path: p.path, width: p.width, height: p.height }))} index={viewer} onClose={() => setViewer(null)} />
      <Sheet visible={sharing} onClose={() => setSharing(false)} title="Partager l’album">
        <View style={{ gap: spacing.sm }}>
          <Field label="Identifiant du membre" value={handle} onChangeText={setHandle} placeholder="@pseudo" autoCapitalize="none" autoCorrect={false} testID="album-share-handle" />
          <Text variant="caption" muted>Seules les personnes choisies voient l’album. Vous pouvez arrêter un partage à tout moment.</Text>
          <Button label="Partager" icon="send" disabled={handle.trim().replace(/^@/, '').length < 3} onPress={async () => { if (await run({ kind: 'share', albumId: album.id, handle }, `Album partagé avec ${handle.startsWith('@') ? handle : `@${handle}`}.`)) { setHandle(''); setSharing(false); } }} testID="album-share-send" />
        </View>
      </Sheet>
    </Screen>
  );
}
