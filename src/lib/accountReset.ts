/**
 * Changement de compte sur le MÊME téléphone (déconnexion, session expirée, autre compte) : rien du compte précédent
 * ne doit rester visible ni réutilisable (audit de confidentialité du 23/11/2026, M1–M2, m1, m3).
 *
 * Effacé : état « ui » propre au compte (favoris, outils épinglés / masqués, raccourcis, commune, questions de santé
 * notées, garde-manger, réglages de la carte cycle…), outils récemment ouverts, lecture des guides du cycle, brouillons
 * de relais, visite guidée, brouillons « Se comprendre », file d'envoi de la nounou (et ses photos), file des
 * statistiques, mémoire de lecture, cache disque des images.
 * Gardé (réglages de l'APPAREIL, aucune donnée personnelle) : apparence par compte (déjà indexée), langue, réglages du
 * verre, identifiant d'installation, simulateurs de la démonstration.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useUiStore } from './store';
import { useRecentTools } from '@/features/hubs/recentTools';
import { useGuideReading } from '@/features/cycleTrack/readingStore';
import { useRelayStore } from '@/features/relay/relayStore';
import { useTourStore } from '@/features/tour/store';

/** Clés `homi.*` de l'APPAREIL, conservées au changement de compte. */
export const DEVICE_KEYS = new Set(['homi.install-id', 'homi.liquidLens.v1', 'homi.demo.purchase-sim', 'homi.demo.catalog-sim']);

/** Clés de l'appareil à effacer au changement de compte (pur, testé). */
export function accountKeys(all: readonly string[]): string[] {
  return all.filter((k) => k.startsWith('homi.') && !DEVICE_KEYS.has(k));
}

type Resettable = { setState: (s: never, replace: true) => void; getInitialState: () => unknown };
const STORES = [useRecentTools, useGuideReading, useRelayStore, useTourStore] as unknown as Resettable[];

export async function resetAccountState(): Promise<void> {
  // 1) en mémoire d'abord : la prochaine écriture persistée ne réécrit pas l'ancien compte
  for (const s of STORES) { try { s.setState(s.getInitialState() as never, true); } catch { /* magasin absent */ } }
  useUiStore.getState().resetAccount();
  // 2) sur le disque
  try {
    const keys = accountKeys(await AsyncStorage.getAllKeys());
    if (keys.length) await AsyncStorage.multiRemove(keys);
  } catch { /* rien d'autre à faire */ }
  if (Platform.OS !== 'web') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Directory, Paths } = require('expo-file-system') as typeof import('expo-file-system');
      const dir = new Directory(Paths.document, 'childcare-outbox');
      if (dir.exists) dir.delete();
    } catch { /* déjà absent */ }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Image } = require('expo-image') as typeof import('expo-image');
      await Image.clearDiskCache();
      await Image.clearMemoryCache();
    } catch { /* module absent (tests) */ }
  }
}
