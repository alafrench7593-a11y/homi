# HOMI — Système « motion » (décisions et règles, 24/11/2026)

Suivi outil par outil : `HOMI_MOTION_TRACKER.md`. Ce fichier-ci : ce qui est décidé, ce qui existe, comment l'utiliser.

## Dépendances

| Rôle | Choix | État |
|---|---|---|
| Animations natives | React Native Reanimated 4.7 | déjà installé |
| Dessin (courbes, jauges) | react-native-svg 15 · Skia 2.6 (courbes de mesure) | déjà installés |
| Graphiques interactifs | Victory Native 42 | déjà installé (peu utilisé : lot 3) |
| Gestes | Gesture Handler 3.3 | déjà installé |
| Illustrations animées | Lottie | **non installé** : seulement si une vraie animation est fournie |

**Aucune dépendance ajoutée.** Les 18 dépôts cités (Remotion, Motion Canvas, Manim, Motion, Anime.js, Ola, Shifty,
Two.js, Lottie-web, TweenJS, LUME, gifenc, Konva, Blender, Three.js, Godot, Babylon.js, Proton) restent **hors de
l'application** : vidéos marketing (Remotion, Motion Canvas, Manim, gifenc), création d'illustrations exportées en SVG
(Blender, Three.js, Babylon, Two.js, Konva) ou simple inspiration (le reste). Interpolations de valeurs : Reanimated
suffit (Ola, Shifty, TweenJS inutiles). Licences : à vérifier au moment où l'un d'eux serait réellement utilisé.

## Budget de poids (mesuré)

Paquet JavaScript iOS (`expo export --platform ios`, bytecode Hermes) :

| Version | Taille | Écart |
|---|---|---|
| Avant la refonte (`addfcbe`) | 50,15 Mo | — |
| Après lot 2 (`3e55e19`) | 50,17 Mo | **+0,038 %** |

Poids de l'application installée et démarrage à froid : **non mesurables ici** (aucun build, aucun iPhone).

## Composants partagés

| Composant | Fichier | Rôle |
|---|---|---|
| `AnimatedProgressRing` | `src/components/motion/AnimatedProgressRing.tsx` | anneau 0–1 animé par ressort, couleurs au choix |
| `AnimatedBottle` | `src/components/motion/AnimatedBottle.tsx` | biberon gradué, niveau = ml exacts |
| `SleepRing24` | `src/features/napLive/SleepRing24.tsx` | cadran 24 h du sommeil noté, relié à la frise |
| `ChildDashboard` | `src/features/childDash/ChildDashboard.tsx` | onglet Enfant : qui, 8 accès, aujourd'hui, synthèse |
| Existants réutilisés | `src/motion/*` (23), `Charts.tsx`, `DayBars`, `NapDayBand`, `SessionBand`, `MeasureCurveSkia`, `StageHero` | — |

Logique pure testée : `sleepRing.ts`, `bottleScale.ts`, `childDash.ts`.

## Règles

1. La donnée est la vérité ; l'animation la rejoint (ressort `doux`), jamais l'inverse. « Réduire les animations » →
   état final immédiat (`useMotion`).
2. Jamais de phase de sommeil, de « qualité », de « bon rythme » ni de seuil médical déduits d'un minuteur.
3. Ce qui n'est pas noté s'appelle « rien de noté », jamais « éveil » ni « zéro ».
4. Couleurs uniquement via le thème (`useTheme`, `tint`) — un test bloque les couleurs en dur.
5. Textes en 5 langues (`src/i18n/*/motion.ts`), aucune clé brute.
6. Minuteurs : heures enregistrées (séances), jamais un compteur JavaScript comme source de vérité.
7. Tout composant visuel : Chromium 390 / 375 / 320 px, texte 130 %, aucune erreur JS ; iPhone : à valider sur appareil.
