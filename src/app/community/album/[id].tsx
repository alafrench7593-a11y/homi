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
import { t as tr } from '@/i18n';
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
  async function removePhoto(p: { id: string; path: string }) {
    if (await confirm(tr('cm3.album.removePhotoConfirm'), tr('cm3.album.removePhotoBody'), tr('cm3.album.remove'))) void run({ kind: 'removePhoto', id: p.id, path: p.path }, tr('cm3.album.photoRemoved'));
  }
  async function addPhotos() {
    if (!album) return;
    if (!access.require()) return;
    const res = await pickPhotos(true);
    if (res === 'denied') { toast(tr('cm3.album.photosDenied'), 'error'); return; }
    setBusy(true);
    try { for (const r of res.slice(0, 20)) if (!(await run({ kind: 'addPhoto', albumId: album.id, uri: r.uri }))) break; }
    finally { setBusy(false); }
  }

  if (albums.isLoading && !albums.data) return <Screen back title={tr('cm3.album.title')}><Skeleton kind="card" rows={2} /></Screen>;
  if (!album) return <Screen back title={tr('cm3.album.title')}><EmptyState icon="image" title={tr('cm3.album.notFoundTitle')} body={tr('cm3.album.notFoundBody')} /></Screen>;
  const list = photos.data ?? [];

  return (
    <Screen back title={album.title} subtitle={album.is_mine ? (album.shared_with?.length ? tr('cm3.album.sharedWithCount', { count: album.shared_with.length }) : tr('cm3.album.private')) : tr('cm3.album.sharedBy', { handle: album.owner_handle ?? '' })}>
      {album.is_mine ? (
        <Row gap={6} wrap>
          <Button label={tr('cm3.album.addPhotos')} icon="image" size="sm" loading={busy} onPress={() => void addPhotos()} testID="album-add" />
          <Button label={tr('cm3.album.share')} icon="user-plus" size="sm" variant="secondary" onPress={() => (access.require() ? setSharing(true) : undefined)} testID="album-share" />
        </Row>
      ) : null}
      {photos.isLoading && !photos.data ? <Skeleton kind="card" rows={1} /> : list.length ? (
        <View testID="album-photos">
          <PhotoGrid photos={list.map((p) => ({ path: p.path, width: p.width, height: p.height }))} onOpen={setViewer} />
          {album.is_mine ? (
            <Row wrap gap={6} style={{ marginTop: spacing.xs }}>
              {list.map((p, i) => <Chip key={p.id} label={tr('cm3.album.removePhoto', { number: i + 1 })} icon="x" onPress={() => void removePhoto(p)} />)}
            </Row>
          ) : null}
        </View>
      ) : <EmptyState icon="image" title={tr('cm3.album.noPhotos')} body={album.is_mine ? tr('cm3.albums.metadata') : undefined} />}
      {album.is_mine && album.shared_with?.length ? (
        <>
          <SectionTitle title={tr('cm3.album.sharedWith')} />
          <Card>
            {album.shared_with.map((h) => (
              <Row key={h}><Text style={{ flex: 1 }}>{`@${h}`}</Text><IconButton icon="x" label={tr('cm3.album.unshareA11y', { handle: h })} onPress={() => void run({ kind: 'unshare', albumId: album.id, handle: h }, tr('cm3.album.unshared', { handle: h }))} /></Row>
            ))}
          </Card>
        </>
      ) : null}
      {album.is_mine ? (
        <Button label={tr('cm3.album.delete')} icon="trash-2" variant="ghost" onPress={async () => {
          if (!(await confirm(tr('cm3.album.deleteConfirm'), tr('cm3.album.deleteBody'), tr('cm3.album.deleteAction')))) return;
          if (await run({ kind: 'delete', id: album.id, paths: list.map((p) => p.path) }, tr('cm3.album.deleted'))) router.back();
        }} testID="album-delete" />
      ) : (
        <Button label={tr('cm3.album.hide')} variant="ghost" icon="eye-off" onPress={async () => {
          try { await backend.remove('album_shares', [eq('album_id', album.id), eq('user_id', userId)]); inv('community_albums'); router.back(); }
          catch (e) { toast(friendlyError(e), 'error'); }
        }} />
      )}
      <PhotoViewer photos={list.map((p) => ({ path: p.path, width: p.width, height: p.height }))} index={viewer} onClose={() => setViewer(null)} />
      <Sheet visible={sharing} onClose={() => setSharing(false)} title={tr('cm3.album.shareTitle')}>
        <View style={{ gap: spacing.sm }}>
          <Field label={tr('cm3.album.handleLabel')} value={handle} onChangeText={setHandle} placeholder={tr('cm3.album.handlePlaceholder')} autoCapitalize="none" autoCorrect={false} testID="album-share-handle" />
          <Text variant="caption" muted>{tr('cm3.album.shareHint')}</Text>
          <Button label={tr('cm3.album.share')} icon="send" disabled={handle.trim().replace(/^@/, '').length < 3} onPress={async () => { if (await run({ kind: 'share', albumId: album.id, handle }, tr('cm3.album.shared', { handle: handle.startsWith('@') ? handle : `@${handle}` }))) { setHandle(''); setSharing(false); } }} testID="album-share-send" />
        </View>
      </Sheet>
    </Screen>
  );
}
