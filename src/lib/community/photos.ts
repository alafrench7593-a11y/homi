/**
 * Photos de la communauté : choisies par la personne, recompressées et RÉ-ENCODÉES depuis les pixels avant l'envoi.
 * Le ré-encodage ne garde que l'image : aucune métadonnée (géolocalisation GPS, appareil, date…) ne quitte
 * l'appareil. Taille réduite (1600 px au plus, JPEG qualité 82) sans dégradation visible pour un fil social.
 */
import { bytesToBase64, decodeForScan, encodeJpeg } from '@/lib/documents/io';
import type { RGBAImage } from '@/lib/cycleAnalysis/image';

export const COMMUNITY_MAX_SIDE = 1600;
export const COMMUNITY_MAX_BYTES = 3 * 1024 * 1024; // comme le stockage « community »
export const MAX_PHOTOS = 4;

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
    if (marker === 0xe1 || marker === 0xed || marker === 0xfe || (marker >= 0xe2 && marker <= 0xef)) return true;
    i += 2 + len;
  }
  return false;
}

/** Encode les pixels en JPEG ; réduit encore si le fichier dépasse la limite. */
export function encodeForCommunity(img: RGBAImage): Uint8Array {
  let bytes = encodeJpeg(img, 82);
  if (bytes.length > COMMUNITY_MAX_BYTES) bytes = encodeJpeg(img, 65);
  return bytes;
}

/** Photo choisie → JPEG propre (sans métadonnées), dimensions et aperçu local. */
export async function prepareCommunityPhoto(uri: string): Promise<PreparedPhoto> {
  let img = await decodeForScan(uri, COMMUNITY_MAX_SIDE);
  let bytes = encodeForCommunity(img);
  if (bytes.length > COMMUNITY_MAX_BYTES) {
    img = await decodeForScan(uri, 1200);
    bytes = encodeForCommunity(img);
  }
  if (bytes.length > COMMUNITY_MAX_BYTES) throw new Error('photo_too_large');
  return { bytes, width: img.width, height: img.height, previewUri: `data:image/jpeg;base64,${bytesToBase64(bytes)}` };
}
