/** État d'interface (non sensible) persisté sur l'appareil. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_PALETTE, migratePalette, OFFERED_PALETTES, PALETTE_NAMES, type PaletteChoice, type PaletteName, type ProfileKind } from '@/theme/tokens';
import { migrateToolIds } from '@/lib/domain/toolFavorites';

export type ActiveSubject =
  | { type: 'pregnancy'; id: string }
  | { type: 'child'; id: string }
  | { type: 'postpartum' }
  | { type: 'family' }
  | { type: 'me' };

/** Apparence choisie : Système, Clair, Sombre. `auto` (ancien : clair/sombre selon l'heure) et `night` (thème des soins
 *  nocturnes) restent acceptés à l'exécution pour les données déjà enregistrées et les scénarios de test. */
export type ThemePreference = 'auto' | 'system' | 'light' | 'dark' | 'night';
/** Thème : un des huit thèmes v7, ou « adaptive » (suit le profil affiché). Anciennes valeurs migrées à la restauration. */
export type PalettePreference = PaletteChoice;
export interface AppearancePrefs { theme: ThemePreference; palette: PalettePreference }

interface UiState {
  themePreference: ThemePreference;
  palettePreference: PalettePreference;
  setPalette: (p: PalettePreference) => void;
  /**
   * APERÇU du sélecteur « Personnaliser l'accueil » (jamais enregistré) : le thème touché s'affiche partout, tout de
   * suite ; « Appliquer le thème » l'enregistre (`applyThemePreview`), fermer le panneau rétablit le thème confirmé
   * (`cancelThemePreview`). Un relancement repart toujours du thème confirmé.
   */
  themePreview: PaletteName | null;
  previewTheme: (p: PaletteName) => void;
  applyThemePreview: () => void;
  cancelThemePreview: () => void;
  /** Rétablir par défaut : Système + palette par défaut, pour le compte actif. */
  resetAppearance: () => void;
  /** Présentation d'Aura déjà vue, PAR COMPTE (identifiant → vrai) : elle ne s'affiche qu'une fois par personne. */
  auraIntroSeen: Record<string, boolean>;
  /** Introduction « Bienvenue dans Mes outils » passée, par compte (ticket 3) ; revoyable depuis Mes outils. */
  toolsIntroSeen: Record<string, boolean>;
  setToolsIntroSeen: (userId: string, seen: boolean) => void;
  markAuraIntroSeen: (userId: string) => void;
  /** Relance demandée (réglages d'Aura, aide) — jamais persistée. */
  auraIntroRequested: boolean;
  requestAuraIntro: () => void;
  clearAuraIntroRequest: () => void;
  /**
   * Profil affiché, résolu (moi, grossesse, enfant, post-partum, famille) : écrit par `AdaptiveProfileSync` à partir du
   * sélecteur de profil ; lu par le thème en mode Adaptatif. Conservé pour éviter un changement de couleurs au lancement.
   */
  adaptiveProfile: ProfileKind;
  setAdaptiveProfile: (p: ProfileKind) => void;
  /**
   * Préférences d'apparence PAR COMPTE sur cet appareil (identifiant utilisateur → choix). Ce qu'un membre choisit ne
   * change rien pour les autres ; `themePreference` / `palettePreference` sont les valeurs du compte actif.
   */
  appearanceByUser: Record<string, AppearancePrefs>;
  /** Compte dont les préférences d'apparence sont actuellement chargées. */
  appearanceOwner: string | null;
  /** Change de compte : enregistre les choix courants et charge ceux du nouveau compte (Système par défaut). */
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
  /** Widgets iOS : masquer prénoms et intitulés (tâches, rendez-vous). Réglage propre à cet appareil. */
  widgetsPrivate: boolean;
  setWidgetsPrivate: (v: boolean) => void;
  /** Live Activities iOS (écran verrouillé, Dynamic Island) pendant un suivi en cours. Réglage propre à cet appareil. */
  liveActivitiesEnabled: boolean;
  setLiveActivitiesEnabled: (v: boolean) => void;
  /** Chrono de séance de tire-lait lancé sur cet appareil (la table ne garde pas de durée) ; null sinon. */
  pumpRun: { childId: string; since: number } | null;
  setPumpRun: (v: { childId: string; since: number } | null) => void;
  /** Widgets iOS : enfant affiché par les widgets (réglage de cet appareil) ; null = celui de l'accueil. */
  widgetChildId: string | null;
  setWidgetChildId: (id: string | null) => void;
  /** Mode simple (par défaut) : l'essentiel seulement ; les fonctions avancées apparaissent si on le désactive. */
  simpleMode: boolean;
  setSimpleMode: (on: boolean) => void;
  /** « 3 choses aujourd'hui » : choix gardés sur l'appareil (aucun effet sur la tâche partagée). */
  focusPicks: { day: string; ids: string[] };
  setFocusPicks: (v: { day: string; ids: string[] }) => void;
  /** Suggestions « pour alléger » masquées par la personne (organisation familiale). */
  overloadTipsOff: boolean;
  /** Accueil personnalisé : ordre et cartes masquées. */
  homeOrder: string[];
  homeHidden: string[];
  setHomeLayout: (order: string[], hidden: string[]) => void;
  /**
   * Accueil personnalisé PAR SITUATION (grossesse, nouveau-né, enfant, couple, famille…) : ordre complet des modules et
   * modules masqués. Absent : la configuration par défaut de la situation (`HOME_PRESETS`).
   */
  homeLayouts: Record<string, { order: string[]; hidden: string[] }>;
  setHomeLayoutFor: (situation: string, layout: { order: string[]; hidden: string[] } | null) => void;
  /** Module « Infos d'un enfant » de l'accueil : l'enfant choisi (null : le premier enfant suivi). */
  homeChildId: string | null;
  setHomeChildId: (id: string | null) => void;
  /** Action rapide centrale : actions choisies par profil (4 à 6 ; absent = celles du profil). */
  quickActionFavorites: Record<string, string[]>;
  setQuickActionFavorites: (profile: string, keys: string[] | null) => void;
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
  /** « Pour toi aujourd'hui » (20/11/2026) : outils épinglés (toujours visibles) et masqués (jamais recommandés). Rien n'est supprimé. */
  toolPinned: string[];
  toolHidden: string[];
  setToolPinned: (ids: string[]) => void;
  setToolHidden: (ids: string[]) => void;
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
  /** Changement de compte : tout ce qui appartient au compte précédent (src/lib/accountReset.ts) */
  resetAccount: () => void;
}

const DEFAULT_APPEARANCE: AppearancePrefs = { theme: 'system', palette: DEFAULT_PALETTE };

/** Préférences d'apparence enregistrées : anciennes palettes (v3, v4, v6) → thème le plus proche, choix v7 conservés, par compte ; le choix
 *  Système / Clair / Sombre est conservé tel quel (pur, testé). */
export function migrateAppearance<S extends Pick<UiState, 'palettePreference' | 'appearanceByUser'>>(st: S): S {
  const byUser: Record<string, AppearancePrefs> = {};
  for (const [id, p] of Object.entries(st.appearanceByUser ?? {})) byUser[id] = { theme: p?.theme ?? 'system', palette: migratePalette(p?.palette) };
  return { ...st, palettePreference: migratePalette(st.palettePreference), appearanceByUser: byUser };
}
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
      palettePreference: DEFAULT_PALETTE, // Blanc nacré pour une nouvelle installation (Olive retirée le 22/11/2026) (les choix existants sont migrés)
      setPalette: (p) => set((st) => { const palettePreference = migratePalette(p); return { palettePreference, themePreview: null, appearanceByUser: withOwner(st, { palette: palettePreference }) }; }),
      themePreview: null,
      previewTheme: (p) => set((st) => ((OFFERED_PALETTES as string[]).includes(p) && st.themePreview !== p ? { themePreview: p } : {})),
      applyThemePreview: () => set((st) => {
        if (!st.themePreview) return {};
        const palettePreference: PalettePreference = st.themePreview;
        return { palettePreference, themePreview: null, appearanceByUser: withOwner(st, { palette: palettePreference }) };
      }),
      cancelThemePreview: () => set((st) => (st.themePreview ? { themePreview: null } : {})),
      auraIntroSeen: {},
      toolsIntroSeen: {},
      setToolsIntroSeen: (userId, seen) => set((st) => ({ toolsIntroSeen: { ...st.toolsIntroSeen, [userId]: seen } })),
      markAuraIntroSeen: (userId) => set((st) => (st.auraIntroSeen[userId] && !st.auraIntroRequested ? {} : { auraIntroSeen: { ...st.auraIntroSeen, [userId]: true }, auraIntroRequested: false })),
      auraIntroRequested: false,
      requestAuraIntro: () => set({ auraIntroRequested: true }),
      clearAuraIntroRequest: () => set((st) => (st.auraIntroRequested ? { auraIntroRequested: false } : {})),
      resetAppearance: () => set((st) => ({ themePreference: DEFAULT_APPEARANCE.theme, palettePreference: DEFAULT_APPEARANCE.palette, appearanceByUser: withOwner(st, DEFAULT_APPEARANCE) })),
      adaptiveProfile: 'me',
      setAdaptiveProfile: (adaptiveProfile) => set((st) => (st.adaptiveProfile === adaptiveProfile ? {} : { adaptiveProfile })),
      appearanceByUser: {},
      appearanceOwner: null,
      switchAppearanceOwner: (userId) => set((st) => {
        if (st.appearanceOwner === userId) return {};
        // Premier compte vu sur cet appareil : il garde les choix déjà faits (aucune réinitialisation surprise)
        if (st.appearanceOwner === null && !st.appearanceByUser[userId]) {
          return { appearanceOwner: userId, appearanceByUser: { ...st.appearanceByUser, [userId]: { theme: st.themePreference, palette: migratePalette(st.palettePreference) } } };
        }
        const saved = st.appearanceByUser[userId] ?? DEFAULT_APPEARANCE;
        return { appearanceOwner: userId, themePreference: saved.theme, palettePreference: migratePalette(saved.palette), themePreview: null };
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
      widgetsPrivate: false,
      liveActivitiesEnabled: true,
      pumpRun: null,
      widgetChildId: null,
      simpleMode: true,
      setSimpleMode: (simpleMode) => set({ simpleMode }),
      focusPicks: { day: '', ids: [] },
      setFocusPicks: (focusPicks) => set({ focusPicks }),
      overloadTipsOff: false,
      homeOrder: [],
      homeHidden: [],
      setHomeLayout: (homeOrder, homeHidden) => set({ homeOrder, homeHidden }),
      homeLayouts: {},
      setHomeLayoutFor: (situation, layout) => set((st) => {
        const next = { ...st.homeLayouts };
        if (layout) next[situation] = layout; else delete next[situation];
        return { homeLayouts: next };
      }),
      homeChildId: null,
      setHomeChildId: (homeChildId) => set({ homeChildId }),
      quickActionFavorites: {},
      setQuickActionFavorites: (profile, keys) => set((st) => {
        const next = { ...st.quickActionFavorites };
        if (keys && keys.length) next[profile] = keys.slice(0, 6); else delete next[profile];
        return { quickActionFavorites: next };
      }),
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
      toolPinned: [],
      toolHidden: [],
      setToolPinned: (toolPinned) => set({ toolPinned }),
      setToolHidden: (toolHidden) => set({ toolHidden }),
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
      setWidgetsPrivate: (widgetsPrivate) => set({ widgetsPrivate }),
      setLiveActivitiesEnabled: (liveActivitiesEnabled) => set({ liveActivitiesEnabled }),
      setPumpRun: (pumpRun) => set({ pumpRun }),
      reset: () => set({ householdId: null, knownHouseholds: [], subject: null, nightMode: false, pumpRun: null }),
      setWidgetChildId: (widgetChildId) => set({ widgetChildId }),
      resetAccount: () => set({
        householdId: null, knownHouseholds: [], subject: null, nightMode: false, homeChildId: null, widgetChildId: null,
        quickActionFavorites: {}, quickShortcuts: null, cocoonFavorites: null, dailyActionFavorites: null,
        growQuestions: null, nightQuestions: {}, nearbyTown: null, cycleCardItems: null, cycleCardShortcuts: null,
        adviceSeen: [], toolFavorites: [], toolPinned: [], toolHidden: [], pantry: [], pantryMigrated: [], toolFilter: '',
        homeLayouts: {}, pumpRun: null,
      }),
    }),
    {
      name: 'toietmoi.ui',
      storage: createJSONStorage(() => AsyncStorage),
      // Le mode nuit n'est jamais restauré au lancement : il ne vit que pendant l'écran Nuit ; l'aperçu de thème non
      // confirmé non plus (un relancement restaure exactement le thème APPLIQUÉ)
      partialize: ({ nightMode: _n, themePreview: _p, auraIntroRequested: _a, ...rest }) => rest, // eslint-disable-line @typescript-eslint/no-unused-vars
      // À CHAQUE restauration, les choix enregistrés (compte actif et autres comptes de l'appareil) passent par
      // `migratePalette` : anciennes palettes (v3, v4, Auto) → palette par défaut, choix v6 conservés ; l'apparence est conservée
      // Favoris d'outils (17/11/2026) : les anciennes clés « thème:adresse » deviennent l'identifiant stable de l'outil
      merge: (persisted, current) => {
        const next = { ...migrateAppearance({ ...current, ...(persisted as Partial<UiState>) }), themePreview: null, auraIntroRequested: false };
        return { ...next, toolFavorites: migrateToolIds(next.toolFavorites), toolPinned: migrateToolIds(next.toolPinned), toolHidden: migrateToolIds(next.toolHidden) };
      },
    },
  ),
);
