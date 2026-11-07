/**
 * Fenêtre « Photo de profil » : prendre une photo, choisir dans la galerie, supprimer.
 * Rappelle qui la voit (les membres du foyer) et que la photo est réduite, sans position GPS, dans un espace privé.
 */
import React from 'react';
import { View } from 'react-native';
import { Sheet, confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Text } from '@/components/ui';
import { UserAvatar } from '@/components/UserAvatar';
import { avatarInitial } from '@/components/AccountActions';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/data/hooks';
import { ProfilePhotoError, pickProfilePhoto, useRemoveProfilePhoto, useSetProfilePhoto } from '@/lib/data/hooks-profilePhoto';
import { friendlyError } from '@/lib/data/hooks-settings';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

export function ProfilePhotoSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const toast = useToast();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const set = useSetProfilePhoto();
  const remove = useRemoveProfilePhoto();
  const has = !!profile?.avatar_path;

  async function choose(source: 'camera' | 'library') {
    try {
      const uri = await pickProfilePhoto(source);
      if (!uri) return;
      await set.mutateAsync(uri);
      toast(tr('pphoto.saved'));
      onClose();
    } catch (e) {
      toast(e instanceof ProfilePhotoError ? tr(`pphoto.err.${e.code}` as TKey) : friendlyError(e), 'error');
    }
  }
  async function drop() {
    if (!(await confirm(tr('pphoto.removeTitle'), tr('pphoto.removeQ'), tr('pphoto.remove')))) return;
    try { await remove.mutateAsync(); toast(tr('pphoto.removed')); onClose(); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={tr('pphoto.title')}>
      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        <UserAvatar path={profile?.avatar_path} initial={avatarInitial(profile?.display_name, session?.email)} size={112} label={tr('pphoto.current')} testID="pp-preview" />
        <Text variant="small" muted style={{ textAlign: 'center' }}>{has ? tr('pphoto.hasPhoto') : tr('pphoto.noPhoto')}</Text>
      </View>
      <Button label={tr('pphoto.camera')} icon="camera" loading={set.isPending} onPress={() => void choose('camera')} testID="pp-camera" />
      <Button label={tr('pphoto.library')} icon="image" variant="secondary" disabled={set.isPending} onPress={() => void choose('library')} testID="pp-library" />
      {has ? <Button label={tr('pphoto.remove')} icon="trash-2" variant="ghost" loading={remove.isPending} onPress={() => void drop()} testID="pp-remove" /> : null}
      <Banner tone="info" icon="lock">{tr('pphoto.privacy')}</Banner>
    </Sheet>
  );
}
