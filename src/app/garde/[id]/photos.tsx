/**
 * Album privé de la garde : galerie chronologique (image, date, heure, auteur, légende), agrandissement, ajout aux
 * souvenirs de l'enfant (même fichier, aucune copie), téléchargement dans la photothèque du PARENT si le réglage
 * l'autorise (autorisation d'AJOUT seule), suppression selon les droits (ligne ET fichier). Liens signés de quelques
 * minutes, demandés à l'affichage.
 */
import React, { useMemo, useState } from 'react';
import { Modal, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { confirm, useToast } from '@/components/Overlays';
import { Button, Card, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { useUserId } from '@/lib/auth';
import { formatDateFr, formatTime } from '@/lib/domain/dates';
import { CARE_PHOTO_BUCKET, CARE_SIGNED_URL_SECONDS } from '@/lib/domain/nounou';
import { backend } from '@/lib/backend';
import { friendlyError } from '@/lib/data/hooks-settings';
import {
  useCareChild, useCareMemberNames, useCarePhotoUrl, useCarePhotos, useCareSettings, useDeleteCarePhoto, usePhotoToMemories, type CarePhoto,
} from '@/lib/data/hooks-nounou';
import { CarePhotoThumb, useAuthorLabel } from '@/features/nounou/CareUI';
import { MotionItem, MotionList } from '@/motion/ListMotion';

/** Enregistre la photo dans la photothèque du parent (ajout seulement), puis efface la copie temporaire. */
async function saveToParentLibrary(path: string): Promise<'saved' | 'denied'> {
  const url = await backend.storage.signedUrl(CARE_PHOTO_BUCKET, path, CARE_SIGNED_URL_SECONDS);
  if (Platform.OS === 'web') {
    const a = document.createElement('a');
    a.href = url; a.download = 'homi-photo.jpg'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    return 'saved';
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ML = require('expo-media-library') as typeof import('expo-media-library');
  const perm = await ML.requestPermissionsAsync(true, ['photo']);
  if (!perm.granted) return 'denied';
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { File, Paths } = require('expo-file-system') as typeof import('expo-file-system');
  const tmp = new File(Paths.cache, `homi-${Date.now()}.jpg`);
  const file = await File.downloadFileAsync(url, tmp, { idempotent: true });
  try { await ML.Asset.create(file.uri); } finally { try { if (file.exists) file.delete(); } catch { /* déjà effacé */ } }
  return 'saved';
}

function Viewer({ photo, onClose, canDownload, canMemories, canDelete, author }: {
  photo: CarePhoto; onClose: () => void; canDownload: boolean; canMemories: boolean; canDelete: boolean; author: string;
}) {
  const t = useTheme();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const url = useCarePhotoUrl(photo.storage_path);
  const del = useDeleteCarePhoto();
  const mem = usePhotoToMemories();
  const [saving, setSaving] = useState(false);
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} transparent={false}>
      <ScrollView style={{ flex: 1, backgroundColor: t.colors.background }} contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingTop: spacing.xxl }}>
        {url.data ? (
          <Image source={{ uri: url.data }} style={{ width: width - spacing.md * 2, aspectRatio: photo.width && photo.height ? photo.width / photo.height : 3 / 4, alignSelf: 'center' }} contentFit="contain" accessibilityLabel={photo.caption ?? tr('nn.kind.photo')} testID="care-photo-large" />
        ) : url.isError ? <ErrorView error={url.error} onRetry={() => void url.refetch()} /> : <Skeleton kind="card" rows={1} />}
        <Text weight="bold">{formatDateFr(photo.taken_at.slice(0, 10))} · {formatTime(photo.taken_at)}</Text>
        <Text variant="small" muted>{tr('nn.by', { name: author })}</Text>
        {photo.caption ? <Text>{photo.caption}</Text> : null}
        {canDownload ? (
          <Button label={tr('nn.album.download')} icon="download" variant="secondary" loading={saving} testID="care-photo-download" onPress={async () => {
            setSaving(true);
            try { const r = await saveToParentLibrary(photo.storage_path); toast(r === 'saved' ? tr('nn.album.downloaded') : tr('nn.album.downloadDenied'), r === 'saved' ? 'success' : 'error'); }
            catch (e) { toast(friendlyError(e), 'error'); } finally { setSaving(false); }
          }} />
        ) : null}
        {canMemories ? (
          photo.memory_photo_id ? <Text variant="small" muted testID="care-photo-in-memories">{tr('nn.album.inMemories')}</Text> : (
            <Button label={tr('nn.album.toMemories')} icon="heart" variant="secondary" loading={mem.isPending} testID="care-photo-memories"
              onPress={() => mem.mutateAsync(photo.id).then(() => toast(tr('nn.album.addedMemories'), 'success')).catch((e) => toast(friendlyError(e), 'error'))} />
          )
        ) : null}
        {canDelete ? (
          <Button label={tr('common.delete')} icon="trash-2" variant="destructive" loading={del.isPending} testID="care-photo-delete" onPress={async () => {
            if (!(await confirm(tr('nn.album.deleteTitle'), tr(photo.memory_photo_id ? 'nn.album.deleteBodyMemories' : 'nn.album.deleteBody'), tr('common.delete')))) return;
            try { await del.mutateAsync(photo); toast(tr('nn.album.deleted'), 'success'); onClose(); } catch (e) { toast(friendlyError(e), 'error'); }
          }} />
        ) : null}
        <Button label={tr('common.close')} variant="ghost" onPress={onClose} testID="care-photo-close" />
      </ScrollView>
    </Modal>
  );
}

export default function CarePhotos() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useUserId();
  const { child, role, loading } = useCareChild(id);
  const photos = useCarePhotos(child ? id : null);
  const { settings } = useCareSettings(role === 'parent' ? id : null);
  const names = useCareMemberNames(child?.household_id);
  const authorOf = useAuthorLabel(names.data);
  const [open, setOpen] = useState<CarePhoto | null>(null);
  const groups = useMemo(() => {
    const m = new Map<string, CarePhoto[]>();
    for (const p of photos.data ?? []) { const d = p.taken_at.slice(0, 10); m.set(d, [...(m.get(d) ?? []), p]); }
    return [...m.entries()];
  }, [photos.data]);

  if (loading) return <Screen back title={tr('nn.album.title')} tool={false}><Skeleton rows={3} /></Screen>;
  if (!child || !role) return <Screen back title={tr('nn.album.title')} tool={false}><EmptyState icon="lock" title={tr('nn.space.noAccess')} body={tr('nn.space.noAccessBody')} /></Screen>;
  return (
    <Screen back title={tr('nn.album.title')} subtitle={child.first_name} tool={false}>
      <Text variant="small" muted>{role === 'parent' ? tr('nn.album.introParent') : tr('nn.album.introCaregiver')}</Text>
      {photos.isLoading && !photos.data ? <Skeleton rows={3} /> : photos.isError && !photos.data ? (
        <ErrorView error={photos.error} onRetry={() => void photos.refetch()} />
      ) : !groups.length ? (
        <EmptyState icon="image" title={tr('nn.album.empty')} body={role === 'parent' ? tr('nn.album.emptyParent') : tr('nn.album.emptyCaregiver')} />
      ) : groups.map(([d, list]) => (
        <Card key={d}>
          <Text weight="bold" style={{ marginBottom: spacing.xs }}>{formatDateFr(d)}</Text>
          <MotionList style={{ gap: spacing.sm }}>
            {list.map((p) => (
              <MotionItem key={p.id}><View key={p.id} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }} testID="care-album-item">
                <CarePhotoThumb path={p.storage_path} size={96} onPress={() => setOpen(p)} label={tr('nn.album.openA11y', { time: formatTime(p.taken_at) })} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text weight="bold">{formatTime(p.taken_at)}</Text>
                  <Text variant="small" muted>{tr('nn.by', { name: authorOf(p.author_id, p.origin) })}</Text>
                  {p.caption ? <Text variant="small">{p.caption}</Text> : null}
                </View>
              </View></MotionItem>
            ))}
          </MotionList>
        </Card>
      ))}
      {open ? (
        <Viewer photo={open} onClose={() => setOpen(null)} author={authorOf(open.author_id, open.origin)}
          canDownload={role === 'parent' && !!settings?.allow_download} canMemories={role === 'parent'}
          canDelete={role === 'parent' || open.author_id === me} />
      ) : null}
    </Screen>
  );
}
