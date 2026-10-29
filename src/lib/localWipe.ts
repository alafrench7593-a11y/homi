/**
 * Effacement des données gardées sur CE téléphone, après suppression du compte :
 * cache des écrans, file hors ligne, brouillons, rappels programmés, clé des photos chiffrées.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { cancelAllLocal } from './notifications';
import { purgeExportFiles } from './exportData';

export async function wipeLocalData(): Promise<void> {
  await cancelAllLocal().catch(() => undefined);
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter((k) => k.startsWith('toietmoi.') && k !== 'toietmoi.demo-without-account.v1');
    if (mine.length) await AsyncStorage.multiRemove(mine);
  } catch { /* rien d'autre à faire */ }
  if (Platform.OS !== 'web') {
    // clé de chiffrement des photos du cycle (nom réel dans cycleAnalysis/privacy.ts) + ancien nom
    for (const k of ['toi-et-moi.cycle-photo-key.v1', 'toietmoi.cycle-photo-key.v1']) await SecureStore.deleteItemAsync(k).catch(() => undefined);
  }
  purgeExportFiles();
}
