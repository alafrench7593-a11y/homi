/**
 * Place réservée en haut de l'écran pour la pastille « Démonstration » (`DemoBar`).
 *
 * La pastille flotte en position absolue au-dessus de la navigation : sans réserve, elle recouvre la première ligne
 * des en-têtes (date de l'Accueil, avatar et Réglages des onglets, bouton retour). Tout écran qui calcule son haut
 * à partir de la zone sûre utilise `useTopInset()` (ou ajoute `useDemoInset()`) au lieu de `insets.top` seul :
 * la place est réservée uniquement quand la pastille est réellement affichée (démonstration ET session ouverte),
 * l'inset vaut 0 sinon — aucun décalage hors démo.
 */
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBackendMode } from '@/lib/demoMode';
import { useAuth } from '@/lib/auth';

/** Hauteur visible de la pastille et de son bouton ; la cible tactile du bouton est complétée à 48 px par `hitSlop`. */
export const DEMO_PILL_HEIGHT = 34;
export const DEMO_LEAVE_HEIGHT = DEMO_PILL_HEIGHT - 6;
/** Écart entre la zone sûre et le haut de la pastille. */
export const DEMO_PILL_TOP = 4;
/** Place réservée sous la zone sûre quand la pastille est affichée : écart + pastille + respiration. */
export const DEMO_INSET = DEMO_PILL_TOP + DEMO_PILL_HEIGHT + 4;

/** Vrai quand la pastille « Démonstration » est affichée (même condition que `DemoBar`). */
export function useDemoPillVisible(): boolean {
  const { isDemo } = useBackendMode();
  const { session } = useAuth();
  return isDemo && !!session;
}

/** Place à réserver sous la zone sûre pour la pastille : `DEMO_INSET` en démonstration, 0 sinon. */
export function useDemoInset(): number {
  return useDemoPillVisible() ? DEMO_INSET : 0;
}

/** Haut utilisable d'un écran : zone sûre + place de la pastille de démonstration. */
export function useTopInset(): number {
  return useSafeAreaInsets().top + useDemoInset();
}
