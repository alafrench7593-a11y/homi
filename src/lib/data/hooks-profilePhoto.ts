/**
 * Photo de profil : choix (appareil photo ou galerie, recadrage carré), réduction à 512 px en JPEG sans métadonnées
 * (pas de position GPS), envoi dans l'espace privé « profile-photos », enregistrement sur le profil, suppression de
 * l'ancienne photo. Affichage par lien signé temporaire, pour soi et pour les membres des foyers partagés.
 */
import { Platform } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { backend, eq } from '../backend';
import { useAuth, useUserId } from '../auth';
import { uuid } from '../uuid';
import { discardLocalImage } from '../cycleAnalysis/privacy';
import { useInvalidate, useProfile } from './hooks';
import { CHILD_AVATAR_BUCKET, PROFILE_PHOTO_BUCKET, PROFILE_PHOTO_MAX_BYTES, PROFILE_PHOTO_QUALITY, PROFILE_PHOTO_SIDE, centerSquare, childAvatarPath, isChildAvatarPath, isOwnPhotoPath, profilePhotoPath } from '../domain/profilePhoto';
import { t as tr } from '@/i18n';

export class ProfilePhotoError extends Error {
  constructor(public code: 'permission_camera' | 'permission_library' | 'unreadable' | 'too_large') { super(code); }
}

/** Ouvre l'appareil photo ou la galerie (recadrage carré proposé par le téléphone). null = annulé. */
export async function pickProfilePhoto(source: 'camera' | 'library'): Promise<string | null> {
  const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new ProfilePhotoError(source === 'camera' ? 'permission_camera' : 'permission_library');
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.9, exif: false, allowsEditing: Platform.OS !== 'web', aspect: [1, 1], base64: false };
  const r = source === 'camera' ? await ImagePicker.launchCameraAsync({ ...opts, cameraType: ImagePicker.CameraType.front }) : await ImagePicker.launchImageLibraryAsync({ ...opts, allowsMultipleSelection: false });
  if (r.canceled || !r.assets?.[0]?.uri) return null;
  return r.assets[0].uri;
}

/** Carré centré, 512 px, JPEG ré-encodé (les métadonnées EXIF, dont la position, ne sont pas recopiées). */
export async function toSquareJpeg(uri: string): Promise<{ uri: string }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { manipulateAsync, SaveFormat } = require('expo-image-manipulator') as typeof import('expo-image-manipulator');
  let probe: { uri: string; width: number; height: number };
  try { probe = await manipulateAsync(uri, [], { compress: 1, format: SaveFormat.JPEG }); } catch { throw new ProfilePhotoError('unreadable'); }
  const crop = centerSquare(probe.width, probe.height);
  const actions = [
    ...(crop.width !== probe.width || crop.height !== probe.height ? [{ crop }] : []),
    ...(crop.width > PROFILE_PHOTO_SIDE ? [{ resize: { width: PROFILE_PHOTO_SIDE, height: PROFILE_PHOTO_SIDE } }] : []),
  ];
  const out = await manipulateAsync(probe.uri, actions, { compress: PROFILE_PHOTO_QUALITY, format: SaveFormat.JPEG });
  if (probe.uri !== out.uri) await discardLocalImage(probe.uri);
  return out;
}

export function fileSize(uri: string): number {
  if (Platform.OS === 'web') return 1;
  try { return new File(uri).size ?? 0; } catch { return 0; }
}

export function useSetProfilePhoto() {
  const inv = useInvalidate();
  const userId = useUserId();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: async (uri: string) => {
      if (!userId) throw new Error(tr('pphoto.errLogin'));
      const img = await toSquareJpeg(uri);
      try {
        const size = fileSize(img.uri);
        if (size > PROFILE_PHOTO_MAX_BYTES) throw new ProfilePhotoError('too_large');
        const path = profilePhotoPath(userId, uuid());
        await backend.storage.upload(PROFILE_PHOTO_BUCKET, path, { uri: img.uri, mimeType: 'image/jpeg', size: size || 1, name: path.split('/')[1] });
        try {
          await backend.update('profiles', { avatar_path: path }, [eq('id', userId)]);
        } catch (e) {
          await backend.storage.remove(PROFILE_PHOTO_BUCKET, [path]).catch(() => undefined);
          throw e;
        }
        // l'ancienne photo ne sert plus : effacée (seulement si c'est bien la mienne)
        const old = profile?.avatar_path;
        if (old && old !== path && isOwnPhotoPath(userId, old)) await backend.storage.remove(PROFILE_PHOTO_BUCKET, [old]).catch(() => undefined);
      } finally {
        await discardLocalImage(img.uri);
        if (img.uri !== uri) await discardLocalImage(uri);
      }
    },
    onSuccess: () => inv('profile', 'member_avatars'),
  });
}

export function useRemoveProfilePhoto() {
  const inv = useInvalidate();
  const userId = useUserId();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const old = profile?.avatar_path;
      await backend.update('profiles', { avatar_path: null }, [eq('id', userId)]);
      if (old && isOwnPhotoPath(userId, old)) await backend.storage.remove(PROFILE_PHOTO_BUCKET, [old]);
    },
    onSuccess: () => inv('profile', 'member_avatars'),
  });
}

/** Photos des membres de mes foyers (moi compris) : { user_id → chemin }. */
export function useMemberAvatars() {
  const { session } = useAuth();
  return useQuery({
    queryKey: [session?.userId, 'member_avatars'],
    queryFn: async () => {
      const rows = (await backend.rpc<{ user_id: string; avatar_path: string }[]>('member_avatars', {})) ?? [];
      return Object.fromEntries(rows.map((r) => [r.user_id, r.avatar_path])) as Record<string, string>;
    },
    enabled: !!session,
    staleTime: 5 * 60_000,
  });
}

/** Lien signé temporaire (1 h) vers une photo de profil ; jamais d'adresse publique. */
export function useProfilePhotoUrl(path: string | null | undefined) {
  const { session } = useAuth();
  return useQuery({
    queryKey: [session?.userId, 'profile-photo-url', path ?? ''],
    queryFn: () => backend.storage.signedUrl(PROFILE_PHOTO_BUCKET, path!, 3600),
    enabled: !!path,
    staleTime: 50 * 60_000,
    gcTime: 55 * 60_000,
  });
}

// ---------------------------------------------------------------- photo de profil d'un enfant
export function useSetChildPhoto() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { child: { id: string; household_id: string; photo_path: string | null }; uri: string }) => {
      const img = await toSquareJpeg(v.uri);
      try {
        const size = fileSize(img.uri);
        if (size > PROFILE_PHOTO_MAX_BYTES) throw new ProfilePhotoError('too_large');
        const path = childAvatarPath(v.child.household_id, v.child.id, uuid());
        await backend.storage.upload(CHILD_AVATAR_BUCKET, path, { uri: img.uri, mimeType: 'image/jpeg', size: size || 1, name: path.split('/').pop() });
        try {
          await backend.update('children', { photo_path: path }, [eq('id', v.child.id)]);
        } catch (e) {
          await backend.storage.remove(CHILD_AVATAR_BUCKET, [path]).catch(() => undefined);
          throw e;
        }
        const old = v.child.photo_path;
        if (old && old !== path && isChildAvatarPath(v.child.household_id, v.child.id, old)) await backend.storage.remove(CHILD_AVATAR_BUCKET, [old]).catch(() => undefined);
      } finally {
        await discardLocalImage(img.uri);
        if (img.uri !== v.uri) await discardLocalImage(v.uri);
      }
    },
    onSuccess: () => inv('children', 'child'),
  });
}

export function useRemoveChildPhoto() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (child: { id: string; household_id: string; photo_path: string | null }) => {
      const old = child.photo_path;
      await backend.update('children', { photo_path: null }, [eq('id', child.id)]);
      if (old && isChildAvatarPath(child.household_id, child.id, old)) await backend.storage.remove(CHILD_AVATAR_BUCKET, [old]);
    },
    onSuccess: () => inv('children', 'child'),
  });
}
