/**
 * Libellés de la galerie du robot d'Aura (/dev/aura-bot) — écran de QA réservé au mode développeur et à la
 * démonstration. Textes de QA en français uniquement (ce ne sont pas des textes de l'application).
 */
import type { AuraBotState } from '@/features/aura/useAuraBot';

export const B = {
  title: 'Robot d’Aura',
  lead: 'Personnage du chat d’Aura, dessiné en code. États, tailles (32 → 160), apparences, poses statiques.',
  back: 'Retour',
  states: 'États (animés)',
  sizes: 'Tailles',
  appearances: 'Apparences',
  still: 'Réduire les animations : poses statiques',
  scene: 'Scénario',
  play: 'Enchaîner coucou → écoute → réflexion → réponse',
  light: 'Clair',
  dark: 'Sombre',
  night: 'Nuit',
  names: { idle: 'Repos', greet: 'Coucou', listening: 'Écoute', thinking: 'Réflexion', answer: 'Réponse', concern: 'Inquiétude' } as Record<AuraBotState, string>,
};
