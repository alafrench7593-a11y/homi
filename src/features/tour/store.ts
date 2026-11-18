/**
 * État de la visite guidée : progression PAR COMPTE sur l'appareil (AsyncStorage, `homi.tour`) + état d'exécution
 * (non persisté : compte affiché, exercice en cours, fin de visite à fêter, aide contextuelle affichée).
 * Toute la logique d'enchaînement est dans le réducteur pur (`model.ts`).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { router } from 'expo-router';
import { beginPractice } from '@/lib/practice';
import { freshProgress, tourReducer, TOUR_STEPS, type TourAction, type TourEvent, type TourProgress } from './model';

export interface ToolHintState { id: string; title: string; body: string }

interface TourState {
  /** Progression par compte (identifiant du compte → progression). */
  byUser: Record<string, TourProgress>;
  /** Aides contextuelles désactivées (Réglages), pour cet appareil. */
  hintsOff: boolean;
  /** Outils dont l'aide de première ouverture a déjà été montrée. */
  hintsSeen: string[];
  // ---- exécution (non persisté)
  owner: string | null;
  /** Exercice choisi à l'étape « Enregistrer une action » (rien n'est écrit). */
  practice: boolean;
  /** La visite vient de se terminer dans cette session : carte de fin. */
  finished: boolean;
  hint: ToolHintState | null;
  /** Une action vient d'être choisie dans la feuille « Ajouter » : le prochain écran hors onglets est son formulaire. */
  pendingQuick: boolean;
  setOwner: (id: string | null) => void;
  dispatch: (a: TourAction) => void;
  setPractice: (on: boolean) => void;
  closeFinished: () => void;
  setHintsOff: (off: boolean) => void;
  showHint: (h: ToolHintState) => void;
  closeHint: () => void;
}

let endPractice: (() => void) | null = null;
function syncPractice(on: boolean) {
  if (on && !endPractice) endPractice = beginPractice();
  if (!on && endPractice) { endPractice(); endPractice = null; }
}

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      byUser: {},
      hintsOff: false,
      hintsSeen: [],
      owner: null,
      practice: false,
      finished: false,
      hint: null,
      pendingQuick: false,
      setOwner: (owner) => { if (get().owner !== owner) { syncPractice(false); set({ owner, practice: false, finished: false, hint: null }); } },
      dispatch: (a) => {
        const { owner, byUser, practice } = get();
        if (!owner) return;
        const prev = byUser[owner] ?? freshProgress();
        const next = tourReducer(prev, a);
        if (next === prev) return;
        // L'exercice ne vit que pendant l'étape « Enregistrer une action » de la visite en cours
        const keepPractice = practice && next.status === 'running' && TOUR_STEPS[next.step]?.id === 'quick';
        if (!keepPractice) syncPractice(false);
        set({
          byUser: { ...byUser, [owner]: next },
          practice: keepPractice,
          finished: next.status === 'done' && prev.status === 'running' ? true : next.status === 'running' ? false : get().finished,
        });
      },
      setPractice: (on) => { syncPractice(on); set({ practice: on }); },
      closeFinished: () => set({ finished: false }),
      setHintsOff: (hintsOff) => set({ hintsOff, hint: hintsOff ? null : get().hint }),
      showHint: (hint) => set((s) => ({ hint, hintsSeen: s.hintsSeen.includes(hint.id) ? s.hintsSeen : [...s.hintsSeen, hint.id].slice(-400) })),
      closeHint: () => set({ hint: null }),
    }),
    {
      name: 'homi.tour',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ byUser, hintsOff, hintsSeen }) => ({ byUser, hintsOff, hintsSeen }),
      // Une visite « en cours » au moment où l'application a été fermée reprend comme une visite remise à plus tard
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<TourState>;
        const byUser = Object.fromEntries(Object.entries(p.byUser ?? {}).map(([k, v]) => [k, { ...freshProgress(), ...v, status: v.status === 'running' ? 'paused' as const : v.status }]));
        return { ...current, ...p, byUser };
      },
    },
  ),
);

/** Progression du compte affiché. */
export function useTourProgress(): TourProgress {
  return useTourStore((s) => (s.owner ? s.byUser[s.owner] : undefined) ?? FRESH);
}
const FRESH = freshProgress();

/** Signale un événement réel de l'application à la visite (sans effet si aucune visite n'est en cours). */
export function tourEvent(e: TourEvent) {
  useTourStore.getState().dispatch({ type: 'event', event: e });
}
export const tourDispatch = (a: TourAction) => useTourStore.getState().dispatch(a);

/** Appel d'urgence lancé (écran Urgences) : ni visite ni aide contextuelle pendant `EMERGENCY_QUIET_MS`. */
let emergencyCallAt: number | null = null;
export function markEmergencyCall() {
  emergencyCallAt = Date.now();
  tourDispatch({ type: 'later' });
  useTourStore.getState().closeHint();
}
export const lastEmergencyCall = () => emergencyCallAt;

/** Choix d'une action dans la feuille « Ajouter » (tâche : feuille locale, aucun écran ne s'ouvre). */
export function tourQuickChosen(key: string, opensScreen: boolean) {
  tourEvent({ type: 'quickChosen', key });
  if (opensScreen) useTourStore.setState({ pendingQuick: true });
}

/** Nombre de profils du sélecteur (un seul : l'étape « Changer de profil » avance au bouton « Suivant »). */
let profileCount = 0;
export function setTourProfileCount(n: number) { profileCount = n; }
export const tourProfileCount = () => profileCount;

/** Lance (ou reprend) la visite et emmène sur l'écran de l'étape courante : Réglages, feuille de l'avatar, accueil. */
export function startTour() {
  tourDispatch({ type: 'start' });
  const st = useTourStore.getState();
  const p = st.owner ? st.byUser[st.owner] : null;
  const step = TOUR_STEPS[p?.step ?? 0];
  router.navigate((step?.goTo ?? '/') as never);
}
