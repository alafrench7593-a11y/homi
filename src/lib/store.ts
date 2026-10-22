/** État d'interface (non sensible) persisté sur l'appareil. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ActiveSubject =
  | { type: 'pregnancy'; id: string }
  | { type: 'child'; id: string }
  | { type: 'postpartum' }
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
  /** Widget iOS du cycle : contenu détaillé (sinon discret). Réglage propre à cet appareil. */
  cycleWidgetDetailed: boolean;
  setCycleWidgetDetailed: (v: boolean) => void;
  /** Mode simple (par défaut) : l'essentiel seulement ; les fonctions avancées apparaissent si on le désactive. */
  simpleMode: boolean;
  setSimpleMode: (on: boolean) => void;
  /** Suggestions « pour alléger » masquées par la personne (organisation familiale). */
  overloadTipsOff: boolean;
  /** Accueil personnalisé : ordre et cartes masquées. */
  homeOrder: string[];
  homeHidden: string[];
  setHomeLayout: (order: string[], hidden: string[]) => void;
  /** Raccourcis choisis (null = automatiques selon le parcours). */
  quickShortcuts: string[] | null;
  setQuickShortcuts: (keys: string[] | null) => void;
  /** « Le cocon du jour » : les 4 actions favorites de « + Ajouter » (null = selon l'âge). */
  cocoonFavorites: string[] | null;
  setCocoonFavorites: (keys: string[] | null) => void;
  /** Carte « Mon cycle » de l'accueil : éléments affichés (dans l'ordre) et raccourcis (null = par défaut). */
  cycleCardItems: string[] | null;
  cycleCardShortcuts: string[] | null;
  setCycleCard: (p: { items?: string[] | null; shortcuts?: string[] | null }) => void;
  /** Conseils du cycle déjà vus (signatures) : un conseil n'est signalé « nouveau » qu'une fois, sauf si une information change. */
  adviceSeen: string[];
  markAdviceSeen: (signatures: string[]) => void;
  /** Outils favoris (identifiants stables du catalogue), dans l'ordre choisi. */
  toolFavorites: string[];
  /** Ingrédients que j'ai à la maison (« Que puis-je cuisiner ? ») : préférence de l'appareil. */
  pantry: string[];
  setPantry: (keys: string[]) => void;
  /** Questions préparées pour le médecin ou la PMI (aide pour la nuit), par enfant : préférence de l'appareil. */
  nightQuestions: Record<string, string[]>;
  setNightQuestions: (childId: string, list: string[]) => void;
  setToolFavorites: (ids: string[]) => void;
  /** Dernier filtre choisi dans « Outils » (état conservé au retour). */
  toolFilter: string;
  setToolFilter: (f: string) => void;
  /** Langue d'affichage choisie (null : jamais choisie → la langue du téléphone est proposée). */
  locale: string | null;
  setLocalePref: (code: string) => void;
  /** Pays de résidence (indépendant de la langue) : urgences et contenus de santé. */
  region: string | null;
  setRegion: (code: string) => void;
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
      cycleWidgetDetailed: false,
      simpleMode: true,
      setSimpleMode: (simpleMode) => set({ simpleMode }),
      overloadTipsOff: false,
      homeOrder: [],
      homeHidden: [],
      setHomeLayout: (homeOrder, homeHidden) => set({ homeOrder, homeHidden }),
      quickShortcuts: null,
      setQuickShortcuts: (quickShortcuts) => set({ quickShortcuts }),
      cocoonFavorites: null,
      setCocoonFavorites: (cocoonFavorites) => set({ cocoonFavorites }),
      cycleCardItems: null,
      cycleCardShortcuts: null,
      setCycleCard: (p) => set((st) => ({
        cycleCardItems: p.items === undefined ? st.cycleCardItems : p.items,
        cycleCardShortcuts: p.shortcuts === undefined ? st.cycleCardShortcuts : p.shortcuts,
      })),
      adviceSeen: [],
      markAdviceSeen: (sigs) => set((st) => {
        const next = [...new Set([...st.adviceSeen, ...sigs])];
        return { adviceSeen: next.slice(-400) };
      }),
      toolFavorites: [],
      pantry: [],
      setPantry: (pantry) => set({ pantry }),
      nightQuestions: {},
      setNightQuestions: (childId, list) => set((st) => ({ nightQuestions: { ...st.nightQuestions, [childId]: list } })),
      setToolFavorites: (toolFavorites) => set({ toolFavorites }),
      toolFilter: 'all',
      setToolFilter: (toolFilter) => set({ toolFilter }),
      locale: null,
      setLocalePref: (locale) => set({ locale }),
      region: null,
      setRegion: (region) => set({ region }),
      introSeen: false,
      setIntroSeen: (introSeen) => set({ introSeen }),
      setOverloadTipsOff: (overloadTipsOff) => set({ overloadTipsOff }),
      setTheme: (themePreference) => set({ themePreference }),
      setNightMode: (nightMode) => set({ nightMode }),
      setNightVibrations: (nightVibrations) => set({ nightVibrations }),
      setHousehold: (householdId) => set({ householdId }),
      setSubject: (subject) => set({ subject }),
      setHaptics: (hapticsEnabled) => set({ hapticsEnabled }),
      setCycleWidgetDetailed: (cycleWidgetDetailed) => set({ cycleWidgetDetailed }),
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
