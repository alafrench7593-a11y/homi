/**
 * Mémoire de lecture commune (bibliothèque, guides, aide pour la nuit, sources) : favoris et « Reprendre la lecture »
 * PAR PROFIL, sur CET appareil. État d'interface non sensible : identifiant, titre et adresse du contenu, position
 * de défilement — jamais une saisie. Les fiches « pertes » du cycle gardent leur propre magasin
 * (src/features/cycleTrack/readingStore.ts), inchangé.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { EMPTY_READING, opened, savePosition, toggleFav, type ProfileReading, type ReadKind, type ReadRef } from '@/lib/domain/readTrack';

interface ReadingState {
  byProfile: Record<string, ProfileReading>;
  toggle: (profile: string, ref: ReadRef) => void;
  open: (profile: string, ref: ReadRef) => void;
  position: (profile: string, kind: ReadKind, id: string, y: number) => void;
}

const get = (s: ReadingState, k: string) => s.byProfile[k] ?? EMPTY_READING;

export const useReadingStore = create<ReadingState>()(persist((set) => ({
  byProfile: {},
  toggle: (profile, ref) => set((s) => ({ byProfile: { ...s.byProfile, [profile]: toggleFav(get(s, profile), ref, new Date()) } })),
  open: (profile, ref) => set((s) => ({ byProfile: { ...s.byProfile, [profile]: opened(get(s, profile), ref, new Date()) } })),
  position: (profile, kind, id, y) => set((s) => {
    const cur = get(s, profile);
    const next = savePosition(cur, kind, id, y, new Date());
    return next === cur ? s : { byProfile: { ...s.byProfile, [profile]: next } };
  }),
}), { name: 'homi.reading.v1', storage: createJSONStorage(() => AsyncStorage), partialize: (s) => ({ byProfile: s.byProfile }) }));
