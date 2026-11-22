/**
 * Fiches « pertes » (cycle_guides) : favoris et reprise de lecture, sur CET appareil (état d'interface non sensible :
 * seulement l'identifiant des fiches, jamais une saisie du cycle).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { toggleFavorite } from '@/lib/domain/cycleTrack';

interface GuideReadingState {
  favorites: string[];
  last: { slug: string; at: string } | null;
  toggle: (slug: string) => void;
  opened: (slug: string, at?: Date) => void;
}

export const useGuideReading = create<GuideReadingState>()(persist((set) => ({
  favorites: [],
  last: null,
  toggle: (slug) => set((s) => ({ favorites: toggleFavorite(s.favorites, slug) })),
  opened: (slug, at = new Date()) => set({ last: { slug, at: at.toISOString() } }),
}), { name: 'homi.cycleGuides', storage: createJSONStorage(() => AsyncStorage) }));
