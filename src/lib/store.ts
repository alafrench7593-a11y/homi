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
  themePreference: 'auto' | 'system' | 'light' | 'dark' | 'night';
  /** Aperçu d'une phase du ciel (réglages > apparence) ; null = heure réelle */
  skyOverride: 'dawn' | 'day' | 'dusk' | 'night' | null;
  setSkyOverride: (p: UiState['skyOverride']) => void;
  nightMode: boolean;
  nightVibrations: boolean;
  householdId: string | null;
  subject: ActiveSubject | null;
  hapticsEnabled: boolean;
  /** Suggestions « pour alléger » masquées par la personne (organisation familiale). */
  overloadTipsOff: boolean;
  setOverloadTipsOff: (on: boolean) => void;
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
      themePreference: 'auto', // le ciel de la famille : suit l'heure réelle
      skyOverride: null,
      setSkyOverride: (skyOverride) => set({ skyOverride }),
      nightMode: false,
      nightVibrations: false,
      householdId: null,
      subject: null,
      hapticsEnabled: true,
      overloadTipsOff: false,
      setOverloadTipsOff: (overloadTipsOff) => set({ overloadTipsOff }),
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
