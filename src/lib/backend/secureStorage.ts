/**
 * Stockage de la session d'authentification.
 * Mobile : Keychain / Keystore via expo-secure-store, découpé en morceaux
 * (une entrée SecureStore est limitée à ~2 Ko). Web : localStorage.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ensureFreshInstallHandled } from './freshInstall';

const CHUNK = 1800;

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    // Réinstallation : le trousseau survit à la suppression de l'appli → la session y est effacée au premier démarrage
    await ensureFreshInstallHandled(() => removeChunks(key));
    const count = await SecureStore.getItemAsync(`${key}.n`);
    if (!count) return null;
    const parts: string[] = [];
    for (let i = 0; i < Number(count); i++) {
      const p = await SecureStore.getItemAsync(`${key}.${i}`);
      if (p == null) return null;
      parts.push(p);
    }
    return parts.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await this.removeItem(key);
    const n = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < n; i++) {
      await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK), {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    }
    await SecureStore.setItemAsync(`${key}.n`, String(n));
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await removeChunks(key);
  },
};

async function removeChunks(key: string): Promise<void> {
  const count = Number((await SecureStore.getItemAsync(`${key}.n`)) ?? 0);
  for (let i = 0; i < count; i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
  await SecureStore.deleteItemAsync(`${key}.n`);
}
