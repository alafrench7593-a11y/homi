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
  /** Accueil personnalisé : ordre et cartes masquées. */
  homeOrder: string[];
  homeHidden: string[];
  setHomeLayout: (order: string[], hidden: string[]) => void;
  /** Raccourcis choisis (null = automatiques selon le parcours). */
  quickShortcuts: string[] | null;
  setQuickShortcuts: (keys: string[] | null) => void;
  /** Introduction vue (ou passée) : ne se relance pas toute seule. */
  introSeen: boolean;
  setIntroSeen: (v: boolean) => void;
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
      homeOrder: [],
      homeHidden: [],
      setHomeLayout: (homeOrder, homeHidden) => set({ homeOrder, homeHidden }),
      quickShortcuts: null,
      setQuickShortcuts: (quickShortcuts) => set({ quickShortcuts }),
      introSeen: false,
      setIntroSeen: (introSeen) => set({ introSeen }),
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
