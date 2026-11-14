/**
 * Enchaînement de « Découvrir HOMI » (pur, testé) : étapes de la présentation et sortie (« Passer », « Commencer »).
 *  - première ouverture (sans compte) : présentation une seule fois (`cinematicSeen`, même règle que l'ancienne
 *    introduction /cinematic), puis la dernière scène de l'introduction (langue, créer un compte, se connecter,
 *    découvrir sans compte) — ou l'accueil sans compte si l'introduction a déjà été vue ;
 *  - relance depuis Réglages (`replay`) : retour à l'écran précédent (Réglages).
 */
import { CHAPTER_KEYS, type ChapterKey } from './model';

export type KeynoteStep = { kind: 'opening' } | { kind: 'chapter'; chapter: ChapterKey; index: number } | { kind: 'end' };

export const KEYNOTE_STEPS: KeynoteStep[] = [
  { kind: 'opening' },
  ...CHAPTER_KEYS.map((chapter, index) => ({ kind: 'chapter' as const, chapter, index })),
  { kind: 'end' },
];
export const LAST_STEP = KEYNOTE_STEPS.length - 1;
export const clampStep = (n: number) => Math.max(0, Math.min(LAST_STEP, Math.round(Number.isFinite(n) ? n : 0)));

/** Geste horizontal relâché → étape suivante / précédente / aucune (seuil 60 px ou lancer > 600 px/s). */
export function swipeStep(step: number, dx: number, vx = 0, rtl = false): number {
  const d = rtl ? -dx : dx;
  const v = rtl ? -vx : vx;
  if (d < -60 || v < -600) return clampStep(step + 1);
  if (d > 60 || v > 600) return clampStep(step - 1);
  return step;
}

/** `dismissTo` : revient à Réglages en refermant toute la présentation (catalogue et démos compris). */
export type DiscoverExit = { kind: 'dismissTo'; href: string } | { kind: 'replace'; href: string };
export function discoverExit(o: { replay: boolean; session: boolean; introSeen: boolean; canGoBack: boolean }): DiscoverExit {
  if (o.replay) return o.canGoBack ? { kind: 'dismissTo', href: '/settings' } : { kind: 'replace', href: '/settings' };
  if (!o.session) return { kind: 'replace', href: o.introSeen ? '/welcome' : '/intro?scene=start' };
  return { kind: 'replace', href: '/' };
}
