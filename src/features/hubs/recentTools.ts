/**
 * Outils récemment ouverts depuis la recherche universelle et les onglets hub (identifiants stables du catalogue,
 * sans donnée personnelle). Persistés sur l'appareil ; 8 au plus, le plus récent en premier.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { migrateToolIds } from '@/lib/domain/toolFavorites';

export const RECENT_MAX = 8;

/** Ajoute un outil en tête, sans doublon, en gardant au plus RECENT_MAX entrées. */
export function pushRecent(ids: string[], id: string, max = RECENT_MAX): string[] {
  return [id, ...ids.filter((x) => x !== id)].slice(0, max);
}

interface RecentState {
  recentTools: string[];
  /** Outils déjà ouverts au moins une fois sur cet appareil : un outil connu s'ouvre directement, sans repasser par sa fiche. */
  knownTools: string[];
  addRecent: (id: string) => void;
  clearRecent: () => void;
}

export const useRecentTools = create<RecentState>()(
  persist(
    (set) => ({
      recentTools: [],
      knownTools: [],
      addRecent: (id) => set((s) => ({ recentTools: pushRecent(s.recentTools, id), knownTools: s.knownTools.includes(id) ? s.knownTools : [...s.knownTools, id] })),
      clearRecent: () => set({ recentTools: [] }),
    }),
    {
      name: 'homi.recentTools', storage: createJSONStorage(() => AsyncStorage),
      // anciennes clés « thème:adresse » → identifiant stable de l'outil (17/11/2026)
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<RecentState>;
        const recentTools = migrateToolIds(p.recentTools).slice(0, RECENT_MAX);
        return { ...current, ...p, recentTools, knownTools: migrateToolIds([...(p.knownTools ?? []), ...recentTools]) };
      },
    },
  ),
);
