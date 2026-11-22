/**
 * Verre liquide — réglages en cours (persistés sur l'appareil) et état du laboratoire. La barre de l'Accueil lit
 * `params` ; le laboratoire les modifie en direct. Hors laboratoire, ce sont les réglages validés (préréglage HOMI tant
 * que rien n'est recollé).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { LENS_HOMI, normalizeLens, type LensParams } from './params';

interface LensState {
  params: LensParams;
  setParam: <K extends keyof LensParams>(k: K, v: LensParams[K]) => void;
  setAll: (p: LensParams) => void;
  reset: () => void;
  /** Panneau du laboratoire affiché par-dessus l'Accueil */
  labOpen: boolean;
  /** Panneau replié (juger le rendu en plein écran) */
  labCollapsed: boolean;
  setLab: (open: boolean) => void;
  setCollapsed: (c: boolean) => void;
}

export const useLensStore = create<LensState>()(
  persist(
    (set) => ({
      params: LENS_HOMI,
      setParam: (k, v) => set((s) => ({ params: normalizeLens({ ...s.params, [k]: v }) })),
      setAll: (p) => set({ params: normalizeLens(p) }),
      reset: () => set({ params: LENS_HOMI }),
      labOpen: false,
      labCollapsed: false,
      setLab: (labOpen) => set({ labOpen, labCollapsed: false }),
      setCollapsed: (labCollapsed) => set({ labCollapsed }),
    }),
    {
      name: 'homi.liquidLens.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ params: s.params }),
      merge: (persisted, current) => ({ ...current, params: normalizeLens(((persisted as { params?: object })?.params ?? {}) as Record<string, unknown>) }),
    },
  ),
);
