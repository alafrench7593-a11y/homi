# HOMI — Règles de mouvement (permanentes)

Détail du système : `HOMI_MOTION_SYSTEM.md`, `MOTION_SYSTEM.md`, `src/motion/`, `src/theme/motion.ts`.
Principes issus du skill **animate-expo** (Emil Kowalski), appliqués aux valeurs réelles de HOMI.

## Dans l'ordre
1. **Faut-il animer ?** Une animation explique un changement d'état, une continuité ou un retour au toucher. Sinon : rien.
2. **Fil d'exécution** : Reanimated (worklets, fil UI). Pas de `setState` dans un `onScroll` ou un geste ; pas de lecture
   d'une valeur partagée pendant le rendu ; `scheduleOnRN`/`runOnJS` seulement en fin de geste.
3. **Propriétés** : `transform` et `opacity`. Pas de `width`/`height`/`margin`/`top` animés (sauf élément absolu sans
   enfant, ex. barre de progression). Jamais `scale(0)` : partir de 0,9–0,97 + opacité 0. Ne pas animer l'intensité d'un flou.
4. **Courbes** (`src/motion/curves.ts`) : entrée = `decelerate` (0.16, 1, 0.3, 1) ; changement d'état = `standard` ;
   sortie = `accelerate`, plus courte que l'entrée. Jamais d'ease-in sur une entrée.
5. **Durées** (`duration` de `src/theme/motion.ts`) : micro 120–180 ms, panneaux 220–320 ms, scènes 320–450 ms.
6. **Toucher** : retour à l'appui (pas au relâchement), échelle ≈ 0,97 (`usePress`), interruptible.
7. **Haptique** : une par événement réel (validation, cran, envoi), dans la même image que le visuel, jamais au défilement ni sur une entrée non provoquée, jamais seule.
8. **Réduire les animations** livré avec l'animation : `useReduceMotion()` → état final immédiat, même information.
9. **Vérité** : la sensation se juge sur un build de production sur l'iPhone le plus lent visé ; le web n'est qu'un indice.

## Interdits
Animation qui bloque une interaction ou retarde un contenu déjà prêt ; délai artificiel pour masquer un bug ;
entrée en cascade sur chaque section ; requête IA pour une animation ou une action déterministe.
