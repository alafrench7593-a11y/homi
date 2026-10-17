/**
 * Confidentialité renforcée des photos de glaire et de tests.
 *
 *  - Par défaut, l'image est SUPPRIMÉE de l'appareil juste après l'analyse.
 *  - Si l'utilisatrice choisit de la garder : chiffrement AES-256-GCM SUR L'APPAREIL, clé stockée
 *    dans le trousseau du téléphone (Keychain / Keystore), puis envoi dans un espace privé
 *    (dossier propre à l'utilisatrice). Le serveur ne voit jamais l'image en clair.
 *  - Aucun enregistrement dans la galerie, aucune publication, aucune image dans les journaux.
 *
 * Ce fichier n'importe volontairement ni la galerie (expo-media-library), ni le forum, ni de module de statistiques.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { gcm } from '@noble/ciphers/aes.js';
import * as ExpoCrypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import { backend } from '../backend';
import { uuid } from '../uuid';

export const CYCLE_BUCKET = 'cycle-private';
const KEY_NAME = 'toi-et-moi.cycle-photo-key.v1';
const NONCE_BYTES = 12;

/** Aléa cryptographique : générateur natif du téléphone (jamais Math.random). */
function randomBytes(n: number): Uint8Array {
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues) return c.getRandomValues(new Uint8Array(n));
  return ExpoCrypto.getRandomBytes(n);
}

/**
 * Le web n'a pas de trousseau sécurisé, et le mode démonstration n'a pas d'espace de stockage privé :
 * dans ces deux cas on ne conserve jamais de photo.
 */
export function canKeepPhotos(): boolean {
  return Platform.OS !== 'web' && backend.mode === 'supabase';
}

// ------------------------------------------------------------------ chiffrement
export function encryptBytes(key: Uint8Array, plain: Uint8Array): Uint8Array {
  const nonce = randomBytes(NONCE_BYTES);
  const sealed = gcm(key, nonce).encrypt(plain);
  const out = new Uint8Array(NONCE_BYTES + sealed.length);
  out.set(nonce, 0);
  out.set(sealed, NONCE_BYTES);
  return out;
}

export function decryptBytes(key: Uint8Array, blob: Uint8Array): Uint8Array {
  if (blob.length <= NONCE_BYTES + 16) throw new Error('Fichier chiffré invalide');
  return gcm(key, blob.subarray(0, NONCE_BYTES)).decrypt(blob.subarray(NONCE_BYTES));
}

const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
const fromHex = (s: string) => new Uint8Array((s.match(/../g) ?? []).map((h) => parseInt(h, 16)));

/** Clé propre à cet appareil (créée au premier usage). Perdre l'appareil = perdre l'accès aux photos gardées. */
async function deviceKey(): Promise<Uint8Array> {
  if (!canKeepPhotos()) throw new Error('Conservation des photos indisponible sur cette plateforme');
  const existing = await SecureStore.getItemAsync(KEY_NAME);
  if (existing && existing.length === 64) return fromHex(existing);
  const key = randomBytes(32);
  await SecureStore.setItemAsync(KEY_NAME, toHex(key), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  return key;
}

// ------------------------------------------------------------------ image locale
/**
 * Supprime l'image temporaire (copie faite par l'appareil photo ou le sélecteur dans le cache de l'app).
 * Sur le web, libère l'URL de l'objet en mémoire. Ne touche jamais à la galerie de l'utilisatrice.
 */
export async function discardLocalImage(uri: string | null | undefined): Promise<void> {
  if (!uri) return;
  try {
    if (uri.startsWith('blob:')) {
      globalThis.URL?.revokeObjectURL?.(uri);
      return;
    }
    if (Platform.OS !== 'web' && uri.startsWith('file:')) {
      const f = new File(uri);
      if (f.exists) f.delete();
    }
  } catch {
    // Silencieux : on ne journalise jamais le chemin d'une image sensible.
  }
}

// ------------------------------------------------------------------ conservation chiffrée
/** Chiffre puis envoie la photo ; renvoie le chemin privé. Le fichier temporaire chiffré est supprimé ensuite. */
export async function keepEncryptedPhoto(userId: string, uri: string): Promise<string> {
  const key = await deviceKey();
  const plain = await new File(uri).bytes();
  const sealed = encryptBytes(key, plain);
  const tmp = new File(Paths.cache, `${uuid()}.enc`);
  try {
    tmp.create();
    tmp.write(sealed);
    const path = `${userId}/${uuid()}.enc`;
    await backend.storage.upload(CYCLE_BUCKET, path, { uri: tmp.uri, mimeType: 'application/octet-stream', size: sealed.length });
    return path;
  } finally {
    try { if (tmp.exists) tmp.delete(); } catch { /* rien */ }
  }
}

/** Télécharge et déchiffre une photo gardée ; renvoie une URI data: affichable (jamais écrite sur le disque). */
export async function loadEncryptedPhoto(path: string): Promise<string> {
  const key = await deviceKey();
  const url = await backend.storage.signedUrl(CYCLE_BUCKET, path, 60);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Photo introuvable');
  const plain = decryptBytes(key, new Uint8Array(await res.arrayBuffer()));
  let bin = '';
  for (let i = 0; i < plain.length; i += 0x8000) bin += String.fromCharCode(...plain.subarray(i, i + 0x8000));
  return `data:image/jpeg;base64,${globalThis.btoa(bin)}`;
}

/** Suppression immédiate et définitive d'une photo gardée. */
export async function deleteEncryptedPhoto(path: string | null | undefined): Promise<void> {
  if (!path) return;
  await backend.storage.remove(CYCLE_BUCKET, [path]);
}

// ------------------------------------------------------------------ journaux
/**
 * Nettoie un objet avant tout journal ou statistique : retire images, URI de fichiers et données base64.
 * À utiliser si une erreur doit être remontée (aucun outil de statistiques n'est branché aujourd'hui).
 */
export function redactForLogs(value: unknown): unknown {
  const SENSITIVE_KEY = /image|photo|base64|uri|path|blob|bytes|data/i;
  const scrub = (v: unknown, depth: number): unknown => {
    if (depth > 4) return '[…]';
    if (typeof v === 'string') {
      if (/^(data:|file:|blob:|content:|ph:)/.test(v) || (v.length > 200 && /^[A-Za-z0-9+/=\s]+$/.test(v))) return '[retiré]';
      return v.length > 300 ? `${v.slice(0, 300)}…` : v;
    }
    if (v instanceof Uint8Array || v instanceof ArrayBuffer) return '[retiré]';
    if (Array.isArray(v)) return v.slice(0, 20).map((x) => scrub(x, depth + 1));
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[k] = SENSITIVE_KEY.test(k) ? '[retiré]' : scrub(x, depth + 1);
      return out;
    }
    return v;
  };
  return scrub(value, 0);
}
