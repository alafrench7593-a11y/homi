/**
 * Photo de profil (07/11/2026) — règles pures, testées (src/__tests__/profilePhoto.test.ts).
 * Espace PRIVÉ « profile-photos », chemin <user_id>/<uuid>.jpg (imposé aussi par la base), carré 512 px, JPEG sans métadonnées.
 */
export const PROFILE_PHOTO_BUCKET = 'profile-photos';
export const PROFILE_PHOTO_SIDE = 512;
export const PROFILE_PHOTO_QUALITY = 0.82;
export const PROFILE_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

const UUID = /^[0-9a-f-]{36}$/;

export function profilePhotoPath(userId: string, fileId: string): string {
  if (!UUID.test(userId) || !UUID.test(fileId)) throw new Error('Identifiant invalide');
  return `${userId}/${fileId}.jpg`;
}

/** Le chemin appartient-il bien à cette personne ? (évite d'effacer le fichier de quelqu'un d'autre) */
export function isOwnPhotoPath(userId: string, path: string | null | undefined): boolean {
  return !!path && /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/.test(path) && path.startsWith(`${userId}/`);
}

/** Recadrage carré centré (si l'image n'a pas déjà été recadrée par l'appareil). */
export function centerSquare(width: number, height: number): { originX: number; originY: number; width: number; height: number } {
  const side = Math.max(1, Math.min(width, height));
  return { originX: Math.floor((width - side) / 2), originY: Math.floor((height - side) / 2), width: side, height: side };
}

// ---------------------------------------------------------------- photo de profil d'un enfant (espace « avatars » du foyer)
export const CHILD_AVATAR_BUCKET = 'avatars';

/** Chemin dans l'espace « avatars » du foyer : <foyer>/children/<enfant>/<uuid>.jpg (nouveau fichier à chaque changement). */
export function childAvatarPath(householdId: string, childId: string, fileId: string): string {
  const U = /^[0-9a-f-]{36}$/;
  if (!U.test(householdId) || !U.test(childId) || !U.test(fileId)) throw new Error('Identifiant invalide');
  return `${householdId}/children/${childId}/${fileId}.jpg`;
}
/** Le fichier est-il bien une photo de CET enfant de CE foyer ? (ancien format <enfant>.jpg compris) */
export function isChildAvatarPath(householdId: string, childId: string, path: string | null | undefined): boolean {
  return !!path && (path === `${householdId}/children/${childId}.jpg` || new RegExp(`^${householdId}/children/${childId}/[0-9a-f-]{36}\\.jpg$`).test(path));
}

