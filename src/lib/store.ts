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

/** Apparence choisie : Système, Clair, Sombre. `auto` (ancien : clair/sombre selon l'heure) et `night` (thème des soins
 *  nocturnes) restent acceptés à l'exécution pour les données déjà enregistrées et les scénarios de test. */
export type ThemePreference = 'auto' | 'system' | 'light' | 'dark' | 'night';
/** Palette : Auto (selon l'heure locale) ou fixe. */
export type PalettePreference = 'auto' | 'turquoise' | 'aurore' | 'crepuscule' | 'menthe' | 'iris';
export interface AppearancePrefs { theme: ThemePreference; palette: PalettePreference }

interface UiState {
  themePreference: ThemePreference;
  palettePreference: PalettePreference;
  setPalette: (p: PalettePreference) => void;
  /**
   * Préférences d'apparence PAR COMPTE sur cet appareil (identifiant utilisateur → choix). Ce qu'un membre choisit ne
   * change rien pour les autres ; `themePreference` / `palettePreference` sont les valeurs du compte actif.
   */
  appearanceByUser: Record<string, AppearancePrefs>;
  /** Compte dont les préférences d'apparence sont actuellement chargées. */
  appearanceOwner: string | null;
  /** Change de compte : enregistre les choix courants et charge ceux du nouveau compte (Système + Auto par défaut). */
  switchAppearanceOwner: (userId: string) => void;
  /** Aperçu d'une phase du ciel (réglages > apparence) ; null = heure réelle */
  skyOverride: 'dawn' | 'day' | 'dusk' | 'night' | null;
  setSkyOverride: (p: UiState['skyOverride']) => void;
  nightMode: boolean;
  nightVibrations: boolean;
  householdId: string | null;
  /** Foyers dont cet appareil a déjà lu les données (purge du cache local après un retrait ou un départ). */
  knownHouseholds: string[];
  setKnownHouseholds: (ids: string[]) => void;
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
  /** « Mes actions du jour » : raccourcis choisis par profil (4 au maximum ; absent = ceux du profil). */
  dailyActionFavorites: Record<string, string[]> | null;
  setDailyActionFavorites: (profile: string, keys: string[] | null) => void;
  /** « Je grandis » : questions préparées pour un rendez-vous, par enfant (sur cet appareil). */
  growQuestions: Record<string, string[]> | null;
  setGrowQuestions: (childId: string, questions: string[]) => void;
  /** « Près de chez moi » : dernière commune choisie (jamais une adresse) et types de lieux affichés. */
  nearbyTown: { label: string; lat: number; lon: number } | null;
  setNearbyTown: (town: { label: string; lat: number; lon: number } | null) => void;
  /** Carte « Mon cycle » de l'accueil : éléments affichés (dans l'ordre) et raccourcis (null = par défaut). */
  cycleCardItems: string[] | null;
  cycleCardShortcuts: string[] | null;
  setCycleCard: (p: { items?: string[] | null; shortcuts?: string[] | null }) => void;
  /** Conseils du cycle déjà vus (signatures) : un conseil n'est signalé « nouveau » qu'une fois, sauf si une information change. */
  adviceSeen: string[];
  markAdviceSeen: (signatures: string[]) => void;
  /** Outils favoris (identifiants stables du catalogue), dans l'ordre choisi. */
  toolFavorites: string[];
  /**
   * ANCIEN garde-manger local (avant le 15/11/2026). Ce n'est plus une source de vérité : les ingrédients sont dans
   * l'inventaire du foyer (household_stocks). Ce champ ne sert qu'à la migration douce à la première synchronisation
   * (usePantryMigration), puis il est vidé.
   */
  pantry: string[];
  setPantry: (keys: string[]) => void;
  /** Foyers dont le garde-manger local a déjà été migré vers le serveur (jamais deux fois). */
  pantryMigrated: string[];
  setPantryMigrated: (householdId: string) => void;
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
  /** Introduction cinématique vue (ou passée) : jouée une seule fois, à la première ouverture. */
  cinematicSeen: boolean;
  setCinematicSeen: (v: boolean) => void;
  setOverloadTipsOff: (on: boolean) => void;
  setTheme: (t: UiState['themePreference']) => void;
  setNightMode: (on: boolean) => void;
  setNightVibrations: (on: boolean) => void;
  setHousehold: (id: string | null) => void;
  setSubject: (s: ActiveSubject | null) => void;
  setHaptics: (on: boolean) => void;
  reset: () => void;
}

const DEFAULT_APPEARANCE: AppearancePrefs = { theme: 'system', palette: 'auto' };
/** Copie des choix d'apparence du compte actif (rien si aucun compte n'est encore connu). */
function withOwner(st: UiState, patch: Partial<AppearancePrefs>): Record<string, AppearancePrefs> {
  if (!st.appearanceOwner) return st.appearanceByUser;
  const cur = st.appearanceByUser[st.appearanceOwner] ?? { theme: st.themePreference, palette: st.palettePreference };
  return { ...st.appearanceByUser, [st.appearanceOwner]: { ...cur, ...patch } };
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      themePreference: 'system', // v2 : suit le réglage clair / sombre du téléphone
      palettePreference: 'auto', // v2 : palette selon l'heure locale
      setPalette: (palettePreference) => set((st) => ({ palettePreference, appearanceByUser: withOwner(st, { palette: palettePreference }) })),
      appearanceByUser: {},
      appearanceOwner: null,
      switchAppearanceOwner: (userId) => set((st) => {
        if (st.appearanceOwner === userId) return {};
        // Premier compte vu sur cet appareil : il garde les choix déjà faits (aucune réinitialisation surprise)
        if (st.appearanceOwner === null && !st.appearanceByUser[userId]) {
          return { appearanceOwner: userId, appearanceByUser: { ...st.appearanceByUser, [userId]: { theme: st.themePreference, palette: st.palettePreference } } };
        }
        const saved = st.appearanceByUser[userId] ?? DEFAULT_APPEARANCE;
        return { appearanceOwner: userId, themePreference: saved.theme, palettePreference: saved.palette };
      }),
      skyOverride: null,
      setSkyOverride: (skyOverride) => set({ skyOverride }),
      nightMode: false,
      nightVibrations: false,
      householdId: null,
      knownHouseholds: [],
      setKnownHouseholds: (knownHouseholds) => set({ knownHouseholds }),
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
      growQuestions: null,
      setGrowQuestions: (childId, questions) => set((st) => ({ growQuestions: { ...(st.growQuestions ?? {}), [childId]: questions.slice(0, 20) } })),
      nearbyTown: null,
      setNearbyTown: (nearbyTown) => set({ nearbyTown }),
      dailyActionFavorites: null,
      setDailyActionFavorites: (profile, keys) => set((st) => {
        const next = { ...(st.dailyActionFavorites ?? {}) };
        if (keys && keys.length) next[profile] = keys.slice(0, 4); else delete next[profile];
        return { dailyActionFavorites: next };
      }),
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
      pantryMigrated: [],
      setPantryMigrated: (id) => set((st) => ({ pantryMigrated: st.pantryMigrated.includes(id) ? st.pantryMigrated : [...st.pantryMigrated, id] })),
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
      cinematicSeen: false,
      setCinematicSeen: (cinematicSeen) => set({ cinematicSeen }),
      setOverloadTipsOff: (overloadTipsOff) => set({ overloadTipsOff }),
      setTheme: (themePreference) => set((st) => ({ themePreference, appearanceByUser: withOwner(st, { theme: themePreference }) })),
      setNightMode: (nightMode) => set({ nightMode }),
      setNightVibrations: (nightVibrations) => set({ nightVibrations }),
      setHousehold: (householdId) => set({ householdId }),
      setSubject: (subject) => set({ subject }),
      setHaptics: (hapticsEnabled) => set({ hapticsEnabled }),
      setCycleWidgetDetailed: (cycleWidgetDetailed) => set({ cycleWidgetDetailed }),
      reset: () => set({ householdId: null, knownHouseholds: [], subject: null, nightMode: false }),
    }),
    {
      name: 'toietmoi.ui',
      storage: createJSONStorage(() => AsyncStorage),
      // Le mode nuit n'est jamais restauré au lancement : il ne vit que pendant l'écran Nuit
      partialize: ({ nightMode: _n, ...rest }) => rest, // eslint-disable-line @typescript-eslint/no-unused-vars
    },
  ),
);
