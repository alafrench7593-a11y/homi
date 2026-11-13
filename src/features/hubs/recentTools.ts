/**
 * Outils récemment ouverts depuis la recherche universelle et les onglets hub (identifiants stables du catalogue,
 * sans donnée personnelle). Persistés sur l'appareil ; 8 au plus, le plus récent en premier.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const RECENT_MAX = 8;

/** Ajoute un outil en tête, sans doublon, en gardant au plus RECENT_MAX entrées. */
export function pushRecent(ids: string[], id: string, max = RECENT_MAX): string[] {
  return [id, ...ids.filter((x) => x !== id)].slice(0, max);
}

interface RecentState {
  recentTools: string[];
  addRecent: (id: string) => void;
  clearRecent: () => void;
}

export const useRecentTools = create<RecentState>()(
  persist(
    (set) => ({
      recentTools: [],
      addRecent: (id) => set((s) => ({ recentTools: pushRecent(s.recentTools, id) })),
      clearRecent: () => set({ recentTools: [] }),
    }),
    { name: 'homi.recentTools', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
