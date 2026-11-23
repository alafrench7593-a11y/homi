/**
 * Double appui sur « Enregistrer » (audit 05, 13/11/2026) : quand un appui remplace ce qui est sous le doigt (le
 * résultat s'affiche, le bouton principal change de rôle), le second appui du double appui ne doit pas déclencher
 * l'action qui a pris la place (quitter le résultat, masquer les cartes de sécurité, afficher une fausse erreur).
 * `arm()` ouvre une courte fenêtre pendant laquelle les actions passées par `guard()` sont ignorées.
 */
import { useCallback, useRef } from 'react';

export const TAP_SHIELD_MS = 700;

export function useTapShield(ms = TAP_SHIELD_MS) {
  const until = useRef(0);
  const arm = useCallback(() => { until.current = Date.now() + ms; }, [ms]);
  const shielded = useCallback(() => Date.now() < until.current, []);
  const guard = useCallback(<A extends unknown[], R>(fn: (...a: A) => R) => (...a: A): R | undefined => (Date.now() < until.current ? undefined : fn(...a)), []);
  return { arm, shielded, guard };
}
