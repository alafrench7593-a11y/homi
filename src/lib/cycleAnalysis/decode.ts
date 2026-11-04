/**
 * Décodage d'une photo en pixels, SUR L'APPAREIL, à une taille réduite (640 px max).
 * Web : canvas. Mobile : redimensionnement natif (expo-image-manipulator) puis décodage JPEG en JavaScript.
 * L'image réduite n'existe qu'en mémoire ; le fichier intermédiaire du redimensionnement est supprimé.
 */
import { Platform } from 'react-native';
import { t as tr } from '@/i18n';
import type { RGBAImage } from './image';
import { discardLocalImage } from './privacy';

export const ANALYSIS_MAX_SIDE = 640;

async function decodeWeb(uri: string): Promise<RGBAImage> {
  // Navigateur uniquement (canvas) : sur téléphone, decodeNative
  if (Platform.OS !== 'web') throw new Error(tr('l8.dec.unreadable'));
  const img = new (globalThis as unknown as { Image: new () => HTMLImageElement }).Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(tr('l8.dec.unreadable')));
    img.src = uri;
  });
  const scale = Math.min(1, ANALYSIS_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error(tr('l8.dec.noCanvas'));
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  canvas.width = 0; // libère la mémoire
  return { width: w, height: h, data };
}

async function decodeNative(uri: string): Promise<RGBAImage> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { manipulateAsync, SaveFormat } = require('expo-image-manipulator') as typeof import('expo-image-manipulator');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const jpeg = require('jpeg-js') as typeof import('jpeg-js');
  const resized = await manipulateAsync(uri, [{ resize: { width: ANALYSIS_MAX_SIDE } }], { base64: true, compress: 0.95, format: SaveFormat.JPEG });
  try {
    if (!resized.base64) throw new Error(tr('l8.dec.unreadable'));
    const bin = globalThis.atob(resized.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const out = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 64 });
    return { width: out.width, height: out.height, data: out.data };
  } finally {
    await discardLocalImage(resized.uri);
  }
}

export function decodeImage(uri: string): Promise<RGBAImage> {
  return Platform.OS === 'web' ? decodeWeb(uri) : decodeNative(uri);
}

/** Version JPEG réduite en base64, pour l'envoi CONSENTI d'une photo de glaire au serveur. */
export async function jpegBase64ForUpload(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const img = await decodeWeb(uri);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), 0, 0);
    const url = canvas.toDataURL('image/jpeg', 0.85);
    canvas.width = 0;
    return url.slice(url.indexOf(',') + 1);
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { manipulateAsync, SaveFormat } = require('expo-image-manipulator') as typeof import('expo-image-manipulator');
  const r = await manipulateAsync(uri, [{ resize: { width: 1024 } }], { base64: true, compress: 0.85, format: SaveFormat.JPEG });
  await discardLocalImage(r.uri);
  if (!r.base64) throw new Error(tr('l8.dec.unreadable'));
  return r.base64;
}
