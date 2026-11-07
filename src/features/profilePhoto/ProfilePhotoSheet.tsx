/**
 * Fenêtres « Photo de profil » (la mienne, ou celle d'un enfant) : prendre une photo, choisir dans la galerie,
 * supprimer. Rappelle qui la voit et que la photo est réduite, sans position GPS, dans un espace privé.
 */
import React from 'react';
import { View } from 'react-native';
import { Sheet, confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Text } from '@/components/ui';
import { UserAvatar } from '@/components/UserAvatar';
import { avatarInitial } from '@/components/AccountActions';
import { ChildAvatar } from '@/features/childAvatar';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/data/hooks';
import { ProfilePhotoError, pickProfilePhoto, useRemoveChildPhoto, useRemoveProfilePhoto, useSetChildPhoto, useSetProfilePhoto } from '@/lib/data/hooks-profilePhoto';
import { friendlyError } from '@/lib/data/hooks-settings';
import type { Child } from '@/lib/types';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

function AvatarPhotoSheet({ visible, onClose, title, preview, has, hint, privacy, busy, onPicked, onRemove, removeQ }: {
  visible: boolean; onClose: () => void; title: string; preview: React.ReactNode; has: boolean; hint: string; privacy: string;
  busy: { set: boolean; remove: boolean }; onPicked: (uri: string) => Promise<void>; onRemove: () => Promise<void>; removeQ: string;
}) {
  const toast = useToast();
  async function choose(source: 'camera' | 'library') {
    try {
      const uri = await pickProfilePhoto(source);
      if (!uri) return;
      await onPicked(uri);
      toast(tr('pphoto.saved'));
      onClose();
    } catch (e) {
      toast(e instanceof ProfilePhotoError ? tr(`pphoto.err.${e.code}` as TKey) : friendlyError(e), 'error');
    }
  }
  async function drop() {
    if (!(await confirm(tr('pphoto.removeTitle'), removeQ, tr('pphoto.remove')))) return;
    try { await onRemove(); toast(tr('pphoto.removed')); onClose(); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        {preview}
        <Text variant="small" muted style={{ textAlign: 'center' }}>{hint}</Text>
      </View>
      <Button label={tr('pphoto.camera')} icon="camera" loading={busy.set} onPress={() => void choose('camera')} testID="pp-camera" />
      <Button label={tr('pphoto.library')} icon="image" variant="secondary" disabled={busy.set} onPress={() => void choose('library')} testID="pp-library" />
      {has ? <Button label={tr('pphoto.remove')} icon="trash-2" variant="ghost" loading={busy.remove} onPress={() => void drop()} testID="pp-remove" /> : null}
      <Banner tone="info" icon="lock">{privacy}</Banner>
    </Sheet>
  );
}

export function ProfilePhotoSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const set = useSetProfilePhoto();
  const remove = useRemoveProfilePhoto();
  const has = !!profile?.avatar_path;
  return (
    <AvatarPhotoSheet visible={visible} onClose={onClose} title={tr('pphoto.title')} has={has}
      preview={<UserAvatar path={profile?.avatar_path} initial={avatarInitial(profile?.display_name, session?.email)} size={112} label={tr('pphoto.current')} testID="pp-preview" />}
      hint={has ? tr('pphoto.hasPhoto') : tr('pphoto.noPhoto')} privacy={tr('pphoto.privacy')} removeQ={tr('pphoto.removeQ')}
      busy={{ set: set.isPending, remove: remove.isPending }} onPicked={(uri) => set.mutateAsync(uri)} onRemove={() => remove.mutateAsync()} />
  );
}

export function ChildPhotoSheet({ child, visible, onClose }: { child: Pick<Child, 'id' | 'household_id' | 'first_name' | 'photo_path'>; visible: boolean; onClose: () => void }) {
  const set = useSetChildPhoto();
  const remove = useRemoveChildPhoto();
  const has = !!child.photo_path;
  return (
    <AvatarPhotoSheet visible={visible} onClose={onClose} title={tr('pphoto.childTitle', { name: child.first_name })} has={has}
      preview={<ChildAvatar child={child} size={112} />}
      hint={has ? tr('pphoto.childHas', { name: child.first_name }) : tr('pphoto.childNone', { name: child.first_name })}
      privacy={tr('pphoto.childPrivacy')} removeQ={tr('pphoto.childRemoveQ', { name: child.first_name })}
      busy={{ set: set.isPending, remove: remove.isPending }}
      onPicked={(uri) => set.mutateAsync({ child, uri })} onRemove={() => remove.mutateAsync(child)} />
  );
}
