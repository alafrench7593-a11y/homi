/**
 * Album photo d'un enfant : lecture, ajout (photo compressée sur le téléphone puis envoyée dans l'espace
 * privé « child-photos »), modification de la légende, de la date ou de la visibilité, suppression.
 * Les droits sont vérifiés par la base (RLS) : l'interface ne fait que refléter ce que le serveur autorise.
 */
import { t as tr } from '@/i18n';
import { Platform } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { File } from 'expo-file-system';
import { backend, eq } from '../backend';
import { useAuth } from '../auth';
import { uuid } from '../uuid';
import { discardLocalImage } from '../cycleAnalysis/privacy';
import { useInvalidate, useMyMembership, useRows } from './hooks';
import {
  CHILD_PHOTO_BUCKET, CHILD_PHOTO_MAX_BYTES, CHILD_PHOTO_QUALITY, childPhotoPath, fitWithin,
  type ChildPhoto, type PhotoVisibility,
} from '../domain/childPhotos';
import type { Child } from '../types';

export function useChildPhotos(childId: string | null | undefined) {
  return useRows<ChildPhoto>(['child_photos', childId ?? ''], childId ? {
    table: 'child_photos', filters: [eq('child_id', childId)],
    order: [{ col: 'taken_on', asc: false }, { col: 'created_at', asc: false }],
  } : null);
}

/** Lien signé temporaire (1 h), redemandé avant expiration ; jamais d'adresse publique. */
export function usePhotoUrl(path: string | null | undefined) {
  const { session } = useAuth();
  return useQuery({
    queryKey: [session?.userId, 'child-photo-url', path ?? ''],
    queryFn: () => backend.storage.signedUrl(CHILD_PHOTO_BUCKET, path!, 3600),
    enabled: !!path,
    staleTime: 50 * 60_000,
    gcTime: 55 * 60_000,
  });
}

/** Droit d'ajouter une photo : propriétaire, ou domaine « profile » en écriture (la base vérifie aussi l'enfant). */
export function useCanAddPhotos(): boolean {
  const m = useMyMembership();
  if (!m) return backend.mode === 'demo';
  return m.role === 'owner' || (m.can_edit ?? []).includes('profile');
}

export class PhotoError extends Error {
  constructor(public code: 'too_large' | 'unreadable') { super(code); }
}

/** Compression sur le téléphone : côté le plus long 1600 px, JPEG 80 %, sans métadonnées (pas de GPS). */
async function compress(uri: string): Promise<{ uri: string; width: number; height: number }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { manipulateAsync, SaveFormat } = require('expo-image-manipulator') as typeof import('expo-image-manipulator');
  let probe: { uri: string; width: number; height: number };
  try {
    probe = await manipulateAsync(uri, [], { compress: 1, format: SaveFormat.JPEG });
  } catch {
    throw new PhotoError('unreadable');
  }
  const target = fitWithin(probe.width, probe.height);
  const out = await manipulateAsync(probe.uri, target.width < probe.width ? [{ resize: { width: target.width } }] : [], { compress: CHILD_PHOTO_QUALITY, format: SaveFormat.JPEG });
  if (probe.uri !== out.uri) await discardLocalImage(probe.uri);
  return out;
}

function fileSize(uri: string): number {
  if (Platform.OS === 'web') return 1;
  try { return new File(uri).size ?? 0; } catch { return 0; }
}

/**
 * A-14 (QA 02/11/2026) : photo prête à l'envoi — ré-encodée en JPEG (sans métadonnées EXIF, dont la position),
 * redimensionnée, refusée au-delà de maxBytes. À appeler avant tout envoi d'une photo d'enfant.
 */
export async function preparePhotoUpload(uri: string, maxBytes = CHILD_PHOTO_MAX_BYTES): Promise<{ uri: string; size: number; dispose: () => Promise<void> }> {
  const img = await compress(uri);
  const size = fileSize(img.uri);
  if (size > maxBytes) { await discardLocalImage(img.uri); throw new PhotoError('too_large'); }
  return { uri: img.uri, size: size || 1, dispose: async () => { await discardLocalImage(img.uri); } };
}

export function useAddChildPhoto() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { child: Pick<Child, 'id' | 'household_id'>; uri: string; takenOn: string; caption: string | null; visibility: PhotoVisibility }) => {
      const img = await compress(v.uri);
      try {
        const size = fileSize(img.uri);
        if (size > CHILD_PHOTO_MAX_BYTES) throw new PhotoError('too_large');
        const id = uuid();
        const path = childPhotoPath(v.child.household_id, v.child.id, id);
        await backend.storage.upload(CHILD_PHOTO_BUCKET, path, { uri: img.uri, mimeType: 'image/jpeg', size: size || 1, name: `${id}.jpg` });
        try {
          await backend.insert('child_photos', {
            id, household_id: v.child.household_id, child_id: v.child.id, storage_path: path,
            taken_on: v.takenOn, caption: v.caption, visibility: v.visibility, width: img.width, height: img.height,
          });
        } catch (e) {
          // la ligne est refusée : on retire le fichier pour ne laisser aucune photo orpheline
          await backend.storage.remove(CHILD_PHOTO_BUCKET, [path]).catch(() => undefined);
          throw e;
        }
      } finally {
        await discardLocalImage(img.uri);
        if (img.uri !== v.uri) await discardLocalImage(v.uri);
      }
    },
    onSuccess: () => inv('child_photos'),
  });
}

export function useUpdateChildPhoto() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id: string; takenOn: string; caption: string | null; visibility: PhotoVisibility }) => {
      const rows = await backend.update<ChildPhoto>('child_photos', { taken_on: v.takenOn, caption: v.caption, visibility: v.visibility }, [eq('id', v.id)]);
      if (Array.isArray(rows) && rows.length === 0 && backend.mode !== 'demo') throw new Error(tr('l3.photos.edit_forbidden'));
    },
    onSuccess: () => inv('child_photos'),
  });
}

export function useDeleteChildPhoto() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (photo: Pick<ChildPhoto, 'id' | 'storage_path'>) => {
      await backend.remove('child_photos', [eq('id', photo.id)]);
      // fichier effacé ensuite (si la ligne est refusée, le fichier reste protégé par la base)
      await backend.storage.remove(CHILD_PHOTO_BUCKET, [photo.storage_path]).catch(() => undefined);
    },
    onSuccess: () => inv('child_photos', 'child-photo-url'),
  });
}

/** Avant de supprimer le profil d'un enfant : efface les fichiers de son album (les lignes partent en cascade). */
export async function removeChildPhotoFiles(childId: string): Promise<void> {
  const rows = await backend.select<Pick<ChildPhoto, 'storage_path'>>({ table: 'child_photos', columns: 'storage_path', filters: [eq('child_id', childId)] }).catch(() => []);
  const paths = rows.map((r) => r.storage_path);
  for (let i = 0; i < paths.length; i += 100) {
    await backend.storage.remove(CHILD_PHOTO_BUCKET, paths.slice(i, i + 100)).catch(() => undefined);
  }
}
