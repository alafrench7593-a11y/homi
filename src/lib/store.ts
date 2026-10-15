/** État d'interface (non sensible) persisté sur l'appareil. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ActiveSubject =
  | { type: 'pregnancy'; id: string }
  | { type: 'child'; id: string }
  | { type: 'family' }
  | { type: 'me' };

interface UiState {
  themePreference: 'system' | 'light' | 'dark';
  nightMode: boolean;
  nightVibrations: boolean;
  householdId: string | null;
  subject: ActiveSubject | null;
  hapticsEnabled: boolean;
  setTheme: (t: UiState['themePreference']) => void;
  setNightMode: (on: boolean) => void;
  setNightVibrations: (on: boolean) => void;
  setHousehold: (id: string | null) => void;
  setSubject: (s: ActiveSubject | null) => void;
  setHaptics: (on: boolean) => void;
  reset: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      themePreference: 'system',
      nightMode: false,
      nightVibrations: false,
      householdId: null,
      subject: null,
      hapticsEnabled: true,
      setTheme: (themePreference) => set({ themePreference }),
      setNightMode: (nightMode) => set({ nightMode }),
      setNightVibrations: (nightVibrations) => set({ nightVibrations }),
      setHousehold: (householdId) => set({ householdId }),
      setSubject: (subject) => set({ subject }),
      setHaptics: (hapticsEnabled) => set({ hapticsEnabled }),
      reset: () => set({ householdId: null, subject: null, nightMode: false }),
    }),
    {
      name: 'toietmoi.ui',
      storage: createJSONStorage(() => AsyncStorage),
      // Le mode nuit n'est jamais restauré au lancement : il ne vit que pendant l'écran Nuit
      partialize: ({ nightMode: _n, ...rest }) => rest, // eslint-disable-line @typescript-eslint/no-unused-vars
    },
  ),
);
