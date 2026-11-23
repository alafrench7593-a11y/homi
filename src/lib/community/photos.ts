/**
 * Photos de la communauté : choisies par la personne, recompressées et RÉ-ENCODÉES depuis les pixels avant l'envoi.
 * Le ré-encodage ne garde que l'image : aucune métadonnée (géolocalisation GPS, appareil, date…) ne quitte
 * l'appareil. Taille réduite (1600 px au plus, JPEG qualité 82) sans dégradation visible pour un fil social.
 */
import { Platform } from 'react-native';
import { bytesToBase64, decodeForScan, encodeJpeg, readBytes } from '@/lib/documents/io';
import { discardLocalImage } from '@/lib/cycleAnalysis/privacy';
import type { RGBAImage } from '@/lib/cycleAnalysis/image';

export const COMMUNITY_MAX_SIDE = 1600;
export const COMMUNITY_MAX_BYTES = 3 * 1024 * 1024; // comme le stockage « community »
/** Poids visé : nettement sous la limite du stockage (une photo d'iPhone de 12 Mpx ramenée à 1600 px pèse 300 à 700 Ko). */
export const COMMUNITY_TARGET_BYTES = 1_500_000;
export const COMMUNITY_MIME = 'image/jpeg';
export const MAX_PHOTOS = 4;

/** Échec lisible : l'écran affiche un message traduit selon le code, jamais un échec muet. */
export class CommunityPhotoError extends Error {
  constructor(public code: 'unreadable' | 'too_large') { super(`photo_${code}`); }
}

/** Dossier de la personne en premier : c'est exactement ce qu'exige la règle d'envoi du stockage (split_part(name,'/',1) = auth.uid()). */
export function communityPhotoPath(userId: string, id: string, kind: 'post' | 'avatar' | 'album' = 'post'): string {
  return `${userId}/${kind === 'post' ? '' : `${kind}-`}${id}.jpg`;
}

export interface PreparedPhoto { bytes: Uint8Array; width: number; height: number; previewUri: string }

/**
 * Vrai si un JPEG contient des segments de métadonnées (APP1 Exif/XMP, APP13 IPTC, commentaires).
 * Sert à vérifier que rien ne sort de l'appareil.
 */
export function jpegHasMetadata(bytes: Uint8Array): boolean {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return false;
  let i = 2;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff) return false;
    const marker = bytes[i + 1];
    if (marker === 0xda || marker === 0xd9) return false; // début des données image
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    if (isMetadataSegment(bytes, i, marker)) return true;
    i += 2 + len;
  }
  return false;
}

/** Profil de couleurs (APP2 « ICC_PROFILE ») : décrit l'espace colorimétrique, rien de personnel ; on le garde. */
function isIccProfile(bytes: Uint8Array, at: number): boolean {
  const tag = 'ICC_PROFILE';
  for (let k = 0; k < tag.length; k++) if (bytes[at + 4 + k] !== tag.charCodeAt(k)) return false;
  return true;
}
function isMetadataSegment(bytes: Uint8Array, at: number, marker: number): boolean {
  if (marker === 0xe2 && isIccProfile(bytes, at)) return false;
  return marker === 0xfe || (marker >= 0xe1 && marker <= 0xef && marker !== 0xee);
}

/**
 * Retire d'un JPEG tous les segments de métadonnées (Exif dont la position GPS, XMP, IPTC, commentaires, notes du
 * fabricant) sans toucher aux pixels. Les encodeurs du téléphone écrivent toujours un petit bloc Exif : on l'enlève.
 */
export function stripJpegMetadata(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new CommunityPhotoError('unreadable');
  const keep: [number, number][] = [[0, 2]];
  let i = 2;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff) throw new CommunityPhotoError('unreadable');
    const marker = bytes[i + 1];
    if (marker === 0xda || marker === 0xd9) break; // données image : tout le reste est gardé tel quel
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    if (len < 2) throw new CommunityPhotoError('unreadable');
    if (!isMetadataSegment(bytes, i, marker)) keep.push([i, i + 2 + len]);
    i += 2 + len;
  }
  keep.push([i, bytes.length]);
  const out = new Uint8Array(keep.reduce((n, [a, b]) => n + (b - a), 0));
  let o = 0;
  for (const [a, b] of keep) { out.set(bytes.subarray(a, b), o); o += b - a; }
  return out;
}

/** Encode les pixels en JPEG ; réduit encore si le fichier dépasse la limite. */
export function encodeForCommunity(img: RGBAImage): Uint8Array {
  let bytes = encodeJpeg(img, 82);
  if (bytes.length > COMMUNITY_MAX_BYTES) bytes = encodeJpeg(img, 65);
  return bytes;
}

/** Paliers de réduction : on descend tant que le fichier dépasse le poids visé. */
const NATIVE_STEPS: [number, number][] = [[COMMUNITY_MAX_SIDE, 0.82], [1280, 0.72], [1024, 0.62], [800, 0.5]];

/**
 * iPhone / Android : réduction et encodage JPEG par le téléphone (rapide, quelle que soit l'origine : HEIC, PNG, photo
 * de 48 Mpx), lecture des octets du fichier (jamais « fetch(uri).blob() », peu fiable sur iOS), puis retrait des
 * métadonnées. L'ancien passage par un décodeur JPEG en JavaScript figeait l'application de longues secondes par photo.
 */
async function prepareNative(uri: string, dims?: { width?: number | null; height?: number | null }): Promise<PreparedPhoto> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { manipulateAsync, SaveFormat } = require('expo-image-manipulator') as typeof import('expo-image-manipulator');
  let w = dims?.width ?? 0, h = dims?.height ?? 0;
  let last: Uint8Array | null = null;
  for (const [side, quality] of NATIVE_STEPS) {
    const big = Math.max(w, h);
    // dimensions inconnues : la largeur est bornée, puis les vraies dimensions servent aux paliers suivants
    const resize = !big ? [{ resize: { width: side } }] : big > side ? [{ resize: w >= h ? { width: side } : { height: side } }] : [];
    let out: { uri: string; width: number; height: number };
    try { out = await manipulateAsync(uri, resize, { compress: quality, format: SaveFormat.JPEG }); } catch { throw new CommunityPhotoError('unreadable'); }
    try {
      const raw = await readBytes(out.uri);
      if (!raw.length) throw new CommunityPhotoError('unreadable');
      const bytes = stripJpegMetadata(raw);
      if (bytes.length <= COMMUNITY_TARGET_BYTES) return { bytes, width: out.width, height: out.height, previewUri: `data:${COMMUNITY_MIME};base64,${bytesToBase64(bytes)}` };
      last = bytes; w = out.width; h = out.height;
    } catch (e) {
      throw e instanceof CommunityPhotoError ? e : new CommunityPhotoError('unreadable');
    } finally {
      if (out.uri !== uri) await discardLocalImage(out.uri).catch(() => undefined);
    }
  }
  if (last && last.length <= COMMUNITY_MAX_BYTES) return { bytes: last, width: w, height: h, previewUri: `data:${COMMUNITY_MIME};base64,${bytesToBase64(last)}` };
  throw new CommunityPhotoError('too_large');
}

/** Photo choisie → JPEG propre (sans métadonnées), dimensions et aperçu local. */
export async function prepareCommunityPhoto(uri: string, dims?: { width?: number | null; height?: number | null }): Promise<PreparedPhoto> {
  if (Platform.OS !== 'web') return prepareNative(uri, dims);
  let img: RGBAImage;
  try { img = await decodeForScan(uri, COMMUNITY_MAX_SIDE); } catch { throw new CommunityPhotoError('unreadable'); }
  let bytes = encodeForCommunity(img);
  if (bytes.length > COMMUNITY_TARGET_BYTES) {
    img = await decodeForScan(uri, 1200);
    bytes = encodeForCommunity(img);
  }
  if (bytes.length > COMMUNITY_MAX_BYTES) throw new CommunityPhotoError('too_large');
  return { bytes, width: img.width, height: img.height, previewUri: `data:${COMMUNITY_MIME};base64,${bytesToBase64(bytes)}` };
}

/** Message traduit pour un échec de préparation ou d'envoi d'une photo. */
export function photoErrorKey(e: unknown): 'cm2.photo.tooLarge' | 'cm2.photo.unreadable' | null {
  if (e instanceof CommunityPhotoError) return e.code === 'too_large' ? 'cm2.photo.tooLarge' : 'cm2.photo.unreadable';
  return null;
}
