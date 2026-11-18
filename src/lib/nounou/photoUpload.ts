/**
 * Espace Nounou — envoi d'une photo prise DANS HOMI (jamais de la photothèque de la nounou).
 *
 * 1. Préparation sur le téléphone : ré-encodage JPEG (expo-image-manipulator), grand côté 1600 px au plus, puis
 *    suppression de TOUT segment de métadonnées restant (EXIF dont GPS, XMP, commentaires) par stripJpegMetadata,
 *    vérifiée par jpegMetadataReport avant l'envoi. La photo d'origine (fichier temporaire de la caméra) et le fichier
 *    intermédiaire sont effacés tout de suite. Rien n'est jamais enregistré dans la photothèque.
 * 2. File d'envoi locale CONFINÉE au répertoire privé de l'application (Documents/childcare-outbox, non partagé,
 *    jamais dans Photos) : la photo prête y attend si le réseau coupe, puis repart ; effacée dès l'envoi réussi
 *    ou l'annulation. Sur le web (substitut de test), la file reste en mémoire.
 * 3. Envoi idempotent : le chemin de l'objet et la ligne portent le même identifiant client ; un fichier déjà déposé
 *    (reprise) n'est pas une erreur, et la ligne est insérée « sans doublon » (on conflict client_id do nothing).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { backend } from '../backend';
import { uuid } from '../uuid';
import { discardLocalImage } from '../cycleAnalysis/privacy';
import {
  CARE_PHOTO_BUCKET, CARE_PHOTO_MAX_BYTES, CARE_PHOTO_QUALITY, carePhotoPath, fitCarePhoto, isAlreadyUploaded,
  jpegMetadataReport, stripJpegMetadata,
} from '../domain/nounou';

export type PhotoStep = 'preparing' | 'uploading' | 'saving' | 'done';
export class CarePhotoError extends Error {
  constructor(public code: 'unreadable' | 'too_large' | 'metadata' | 'offline') { super(code); }
}

export interface PreparedPhoto { bytes: Uint8Array; width: number; height: number }

async function readBytes(uri: string): Promise<Uint8Array> {
  if (Platform.OS === 'web') {
    // Web : adresse blob:/data: du fichier choisi (substitut de la caméra)
    return new Uint8Array(await (await fetch(uri)).arrayBuffer());
  }
  // iOS / Android : lecture directe du fichier (et non fetch(file://).blob(), peu fiable avec React Native)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { File } = require('expo-file-system') as typeof import('expo-file-system');
  return new File(uri).bytes();
}

/** Photo prête à l'envoi : JPEG, ≤ 1600 px, sans métadonnées. Les fichiers temporaires sont effacés. */
export async function prepareCarePhoto(uri: string): Promise<PreparedPhoto> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { manipulateAsync, SaveFormat } = require('expo-image-manipulator') as typeof import('expo-image-manipulator');
  let probe: { uri: string; width: number; height: number };
  try {
    probe = await manipulateAsync(uri, [], { compress: 1, format: SaveFormat.JPEG });
  } catch {
    await discardLocalImage(uri);
    throw new CarePhotoError('unreadable');
  }
  const target = fitCarePhoto(probe.width, probe.height);
  const out = await manipulateAsync(probe.uri, target.width < probe.width ? [{ resize: { width: target.width } }] : [], { compress: CARE_PHOTO_QUALITY, format: SaveFormat.JPEG });
  try {
    const raw = await readBytes(out.uri);
    const bytes = stripJpegMetadata(raw);
    const meta = jpegMetadataReport(bytes);
    if (meta.exif || meta.gps || meta.xmp || meta.comment) throw new CarePhotoError('metadata');
    if (bytes.length > CARE_PHOTO_MAX_BYTES) throw new CarePhotoError('too_large');
    return { bytes, width: out.width, height: out.height };
  } catch (e) {
    if (e instanceof CarePhotoError) throw e;
    throw new CarePhotoError('unreadable');
  } finally {
    // aucune copie ne reste : ni la photo de la caméra, ni les fichiers intermédiaires
    await discardLocalImage(out.uri);
    if (probe.uri !== out.uri) await discardLocalImage(probe.uri);
    if (uri !== probe.uri && uri !== out.uri) await discardLocalImage(uri);
  }
}

// ---------------------------------------------------------------- file d'envoi locale
export interface OutboxItem {
  clientId: string;
  owner: string;
  householdId: string;
  childId: string;
  takenAt: string;
  caption: string | null;
  width: number;
  height: number;
  queuedAt: string;
  error?: string | null;
}

const KEY = 'homi.childcare.outbox.v1';
const memoryBytes = new Map<string, Uint8Array>();

function outboxFile(clientId: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Directory, File, Paths } = require('expo-file-system') as typeof import('expo-file-system');
  const dir = new Directory(Paths.document, 'childcare-outbox');
  if (!dir.exists) dir.create({ idempotent: true, intermediates: true });
  return new File(dir, `${clientId}.jpg`);
}

async function readItems(): Promise<OutboxItem[]> {
  try { return JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]') as OutboxItem[]; } catch { return []; }
}
async function writeItems(items: OutboxItem[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}
const listeners = new Set<() => void>();
export function onOutboxChange(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }
const emit = () => listeners.forEach((l) => l());

export async function outboxItems(owner: string | null | undefined): Promise<OutboxItem[]> {
  if (!owner) return [];
  return (await readItems()).filter((i) => i.owner === owner);
}

async function putBytes(clientId: string, bytes: Uint8Array) {
  if (Platform.OS === 'web') { memoryBytes.set(clientId, bytes); return; }
  outboxFile(clientId).write(bytes);
}
async function getBytes(clientId: string): Promise<Uint8Array | null> {
  if (Platform.OS === 'web') return memoryBytes.get(clientId) ?? null;
  const f = outboxFile(clientId);
  return f.exists ? f.bytes() : null;
}
async function dropBytes(clientId: string) {
  memoryBytes.delete(clientId);
  if (Platform.OS === 'web') return;
  try { const f = outboxFile(clientId); if (f.exists) f.delete(); } catch { /* déjà effacé */ }
}

/** Ajoute une photo préparée à la file (avant le premier essai d'envoi : rien n'est perdu si le réseau coupe). */
export async function enqueueCarePhoto(p: PreparedPhoto, meta: Omit<OutboxItem, 'clientId' | 'queuedAt' | 'width' | 'height'>): Promise<OutboxItem> {
  const item: OutboxItem = { ...meta, clientId: uuid(), width: p.width, height: p.height, queuedAt: new Date().toISOString() };
  await putBytes(item.clientId, p.bytes);
  await writeItems([...(await readItems()), item]);
  emit();
  return item;
}

/** Retire une photo de la file et efface son fichier local (annulation ou envoi réussi). */
export async function removeFromOutbox(clientId: string) {
  await dropBytes(clientId);
  await writeItems((await readItems()).filter((i) => i.clientId !== clientId));
  emit();
}

/**
 * Envoie une photo de la file. Idempotent : relancé après une coupure, il ne crée ni second fichier ni seconde ligne.
 * `onStep` : étapes réelles (pas de pourcentage inventé).
 */
export async function sendOutboxItem(item: OutboxItem, onStep?: (s: PhotoStep) => void): Promise<void> {
  const bytes = await getBytes(item.clientId);
  if (!bytes) { await removeFromOutbox(item.clientId); throw new CarePhotoError('unreadable'); }
  const path = carePhotoPath(item.householdId, item.childId, item.clientId);
  onStep?.('uploading');
  try {
    await backend.storage.upload(CARE_PHOTO_BUCKET, path, { uri: '', bytes, mimeType: 'image/jpeg', size: bytes.length, name: `${item.clientId}.jpg` });
  } catch (e) {
    if (!isAlreadyUploaded(e)) throw e;
  }
  onStep?.('saving');
  await backend.insert('childcare_photos', {
    client_id: item.clientId, household_id: item.householdId, child_id: item.childId, storage_path: path,
    taken_at: item.takenAt, caption: item.caption, only_this_child: true, width: item.width, height: item.height,
  }, { onConflict: 'client_id', ignoreDuplicates: true });
  await removeFromOutbox(item.clientId);
  onStep?.('done');
}

let flushing = false;
/** Renvoie ce qui attend (retour du réseau, retour au premier plan). Une photo à la fois, dans l'ordre. */
export async function flushCareOutbox(owner: string | null | undefined): Promise<number> {
  if (flushing || !owner || backend.mode === 'demo') return 0;
  flushing = true;
  let sent = 0;
  try {
    for (const item of await outboxItems(owner)) {
      try { await sendOutboxItem(item); sent++; } catch (e) {
        const x = e as { isNetwork?: boolean; message?: string };
        if (x?.isNetwork) break; // réseau toujours absent : on réessaiera
        await writeItems((await readItems()).map((i) => (i.clientId === item.clientId ? { ...i, error: x?.message ?? 'error' } : i)));
        emit();
      }
    }
  } finally { flushing = false; }
  return sent;
}
