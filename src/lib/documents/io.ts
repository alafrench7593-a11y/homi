/**
 * Entrées/sorties des documents sur l'appareil : capture, import, décodage, encodage, lecture locale.
 * Les autorisations (appareil photo, photos) ne sont demandées qu'au moment du geste.
 * Les copies temporaires (photos de la caméra, redimensionnements, fichiers de lecture) sont effacées après usage.
 */
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import type { RGBAImage } from '@/lib/cycleAnalysis/image';
import { discardLocalImage } from '@/lib/cycleAnalysis/privacy';
import { localTextRecognitionAvailable } from '@/lib/scanner/localRecognition';
import { uuid } from '@/lib/uuid';

export const MAX_BYTES = 26_214_400; // 25 Mo, comme le stockage
export const SCAN_MAX_SIDE = 1600; // assez pour lire un document, assez léger pour rester fluide
/** Formats réellement traités : PDF et images. Les autres sont refusés avec un message clair. */
export const ACCEPTED: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/heic': 'heic', 'image/webp': 'webp' };

export interface PickedFile { uri: string; name: string; mimeType: string; size: number }
export type PickError = 'format' | 'too_large' | 'empty';

export function normalizeMime(mime: string | null | undefined, name: string): string | null {
  const m = (mime ?? '').toLowerCase();
  if (m === 'image/jpg') return 'image/jpeg';
  if (ACCEPTED[m]) return m;
  const ext = name.split('.').pop()?.toLowerCase();
  const byExt: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', heic: 'image/heic', heif: 'image/heic', webp: 'image/webp' };
  return ext ? byExt[ext] ?? null : null;
}

async function sizeOf(uri: string, known?: number | null): Promise<number> {
  if (known && known > 0) return known;
  try { return (await (await fetch(uri)).blob()).size; } catch { return 0; }
}

/** Vérifie format et taille ; renvoie le fichier prêt ou l'erreur à afficher. */
export async function checkFile(p: { uri: string; name: string; mimeType?: string | null; size?: number | null }): Promise<PickedFile | PickError> {
  const mime = normalizeMime(p.mimeType, p.name);
  if (!mime) return 'format';
  const size = await sizeOf(p.uri, p.size);
  if (size > MAX_BYTES) return 'too_large';
  if (size === 0 && Platform.OS !== 'web') return 'empty';
  return { uri: p.uri, name: p.name, mimeType: mime, size: Math.max(1, size) };
}

/** Photo avec l'appareil photo (autorisation demandée à ce moment-là). null = annulé ; 'denied' = refusé. */
export async function capturePhoto(): Promise<string | null | 'denied'> {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return 'denied';
  }
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.92, exif: false });
  if (res.canceled || !res.assets?.[0]) return null;
  return res.assets[0].uri;
}

export async function pickPhotos(multiple: boolean): Promise<{ uri: string; name: string; mimeType?: string | null; size?: number | null }[] | 'denied'> {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return 'denied';
  }
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.92, allowsMultipleSelection: multiple, selectionLimit: multiple ? 20 : 1, exif: false });
  if (res.canceled) return [];
  return res.assets.map((a) => ({ uri: a.uri, name: a.fileName ?? `photo-${Date.now()}.jpg`, mimeType: a.mimeType ?? 'image/jpeg', size: a.fileSize }));
}

export async function pickFiles(multiple: boolean) {
  const res = await DocumentPicker.getDocumentAsync({ type: Object.keys(ACCEPTED), copyToCacheDirectory: true, multiple });
  if (res.canceled) return [];
  return res.assets.map((a) => ({ uri: a.uri, name: a.name, mimeType: a.mimeType, size: a.size }));
}

// ---------------------------------------------------------------- pixels
async function decodeWeb(uri: string, maxSide: number): Promise<RGBAImage> {
  // Navigateur uniquement (canvas) : sur téléphone, decodeNative
  if (Platform.OS !== 'web') throw new Error('unreadable_image');
  const img = new (globalThis as unknown as { Image: new () => HTMLImageElement }).Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error('unreadable_image')); img.src = uri; });
  const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * s)), h = Math.max(1, Math.round(img.naturalHeight * s));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('unreadable_image');
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  canvas.width = 0;
  return { width: w, height: h, data };
}

async function decodeNative(uri: string, maxSide: number): Promise<RGBAImage> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { manipulateAsync, SaveFormat } = require('expo-image-manipulator') as typeof import('expo-image-manipulator');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const jpeg = require('jpeg-js') as typeof import('jpeg-js');
  const probe = await manipulateAsync(uri, [], { compress: 1, format: SaveFormat.JPEG });
  const s = Math.min(1, maxSide / Math.max(probe.width, probe.height));
  const resized = await manipulateAsync(probe.uri, s < 1 ? [{ resize: { width: Math.round(probe.width * s) } }] : [], { base64: true, compress: 0.95, format: SaveFormat.JPEG });
  try {
    if (!resized.base64) throw new Error('unreadable_image');
    const out = jpeg.decode(base64ToBytes(resized.base64), { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 256 });
    return { width: out.width, height: out.height, data: out.data };
  } finally {
    await discardLocalImage(probe.uri);
    await discardLocalImage(resized.uri);
  }
}

export function decodeForScan(uri: string, maxSide = SCAN_MAX_SIDE): Promise<RGBAImage> {
  return Platform.OS === 'web' ? decodeWeb(uri, maxSide) : decodeNative(uri, maxSide);
}

export function encodeJpeg(img: RGBAImage, quality = 82): Uint8Array {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const jpeg = require('jpeg-js') as typeof import('jpeg-js');
  const data = img.data instanceof Uint8Array ? img.data : new Uint8Array(img.data.buffer, img.data.byteOffset, img.data.byteLength);
  // jpeg-js termine par « Buffer.from(octets) », absent du web et de React Native : équivalent minimal le temps de l'encodage
  const g = globalThis as { Buffer?: unknown };
  const shim = typeof g.Buffer === 'undefined';
  if (shim) g.Buffer = { from: (a: ArrayLike<number>) => Uint8Array.from(a) };
  try {
    return new Uint8Array(jpeg.encode({ width: img.width, height: img.height, data }, quality).data);
  } finally {
    if (shim) delete g.Buffer;
  }
}

// ---------------------------------------------------------------- octets
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1] ?? 0, c = bytes[i + 2] ?? 0;
    out += B64[a >> 2] + B64[((a & 3) << 4) | (b >> 4)] + (i + 1 < bytes.length ? B64[((b & 15) << 2) | (c >> 6)] : '=') + (i + 2 < bytes.length ? B64[c & 63] : '=');
  }
  return out;
}
export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n = (B64.indexOf(clean[i]) << 18) | (B64.indexOf(clean[i + 1]) << 12) | ((B64.indexOf(clean[i + 2]) & 63) << 6) | (B64.indexOf(clean[i + 3]) & 63);
    out[o++] = (n >> 16) & 255;
    if (clean[i + 2] !== undefined) out[o++] = (n >> 8) & 255;
    if (clean[i + 3] !== undefined) out[o++] = n & 255;
  }
  return out.slice(0, o);
}
export const dataUri = (bytes: Uint8Array, mime: string) => `data:${mime};base64,${bytesToBase64(bytes)}`;

export async function readBytes(uri: string): Promise<Uint8Array> {
  if (Platform.OS !== 'web' && uri.startsWith('file:')) return new File(uri).bytes();
  return new Uint8Array(await (await fetch(uri)).arrayBuffer());
}

/** Fichier temporaire (mobile) pour les modules natifs qui lisent une adresse de fichier ; à effacer après usage. */
export function writeTemp(bytes: Uint8Array, ext: string): string {
  const f = new File(Paths.cache, `${uuid()}.${ext}`);
  f.create();
  f.write(bytes);
  return f.uri;
}

// ---------------------------------------------------------------- lecture du texte sur l'appareil
export const deviceReadingAvailable = () => localTextRecognitionAvailable();

/** Lecture locale (ML Kit) d'une page déjà traitée ; le fichier temporaire est effacé aussitôt. */
export async function readPageOnDevice(jpegBytes: Uint8Array): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { readTextFromImage } = require('@/lib/scanner/localRecognition') as typeof import('@/lib/scanner/localRecognition');
  const uri = writeTemp(jpegBytes, 'jpg');
  try {
    return (await readTextFromImage(uri)).text;
  } finally {
    await discardLocalImage(uri);
  }
}
