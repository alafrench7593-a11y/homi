/**
 * Pilotage de l'état du robot d'Aura (`AuraBot`).
 *
 * `auraBotStateFor` (pur, testé) choisit l'état à montrer à partir de ce qui se passe dans le chat, par priorité :
 *   thinking (réponse en préparation) > listening (champ actif avec du texte) > concern (dernière réponse : sécurité
 *   ou erreur — jamais joyeux sur un message de détresse) > answer (réponse arrivée, passager) > greet (ouverture,
 *   passager) > idle.
 * `useAuraBot` ajoute les états PASSAGERS : coucou à l'ouverture (une fois) et sursaut à l'arrivée d'une réponse,
 * chacun revient seul au repos après sa durée (`auraBotMotion.greetMs` / `answerMs`).
 */
import { useEffect, useRef, useState } from 'react';
import { auraBotMotion } from '@/motion/curves';

export type AuraBotState = 'idle' | 'greet' | 'listening' | 'thinking' | 'answer' | 'concern';
export const AURA_BOT_STATES: readonly AuraBotState[] = ['idle', 'greet', 'listening', 'thinking', 'answer', 'concern'];

export interface AuraBotSignals {
  thinking?: boolean;
  listening?: boolean;
  concern?: boolean;
  /** passagers (gérés par useAuraBot) */
  answering?: boolean;
  greeting?: boolean;
}

export function auraBotStateFor(s: AuraBotSignals): AuraBotState {
  if (s.thinking) return 'thinking';
  if (s.listening) return 'listening';
  if (s.concern) return 'concern';
  if (s.answering) return 'answer';
  if (s.greeting) return 'greet';
  return 'idle';
}

/**
 * Hook du chat : `greet` (coucou à l'ouverture si `greet` est vrai au montage), `answerKey` (change à chaque nouvelle
 * réponse d'Aura : déclenche le sursaut ; `null` = aucune réponse).
 */
export function useAuraBot(o: { thinking: boolean; listening: boolean; concern: boolean; answerKey: string | null; greet?: boolean }): AuraBotState {
  const [greeting, setGreeting] = useState(o.greet !== false);
  const [answering, setAnswering] = useState(false);
  const lastKey = useRef(o.answerKey);
  useEffect(() => {
    if (!greeting) return;
    const id = setTimeout(() => setGreeting(false), auraBotMotion.greetMs);
    return () => clearTimeout(id);
  }, [greeting]);
  useEffect(() => {
    if (o.answerKey === lastKey.current) return;
    lastKey.current = o.answerKey;
    if (!o.answerKey) return;
    setGreeting(false);
    setAnswering(true);
    const id = setTimeout(() => setAnswering(false), auraBotMotion.answerMs);
    return () => clearTimeout(id);
  }, [o.answerKey]);
  return auraBotStateFor({ thinking: o.thinking, listening: o.listening, concern: o.concern, answering, greeting });
}
