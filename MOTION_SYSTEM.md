# HOMI — Système de mouvement

Nouveau code : **Reanimated 4.7.1** (`react-native-worklets` 0.13.0), primitives dans `src/motion/**`.
Jetons partagés avec l'API `Animated` historique : `src/theme/motion.ts`.

## Principes

1. **Calme et intentionnel.** Le mouvement explique (d'où vient un écran, ce qui vient de changer), il ne décore pas. Jamais d'agressivité, jamais d'attente imposée : l'action part tout de suite, l'animation suit.
2. **Compositeur uniquement.** On anime `transform` et `opacity`, sur le fil UI (valeurs partagées et worklets). Seules exceptions : le tracé du contour de la maison au lancement (`strokeDashoffset`, un seul chemin) et le `d` des icônes morphables (≤ 72 points, petites icônes).
3. **Interruptible.** Ressorts et `withTiming` repartent de la valeur courante ; le morph d'icône repart de la forme réellement affichée. Les séquences figées sont réservées aux one-shots (intro).
4. **Un seul hook.** Toute primitive passe par `useMotion()` (voir ci-dessous). Aucune durée, courbe ou ressort en dur dans un écran.
5. **Rien de permanent qui gêne.** Pas de boucle décorative près d'un chronomètre ou pendant les soins de nuit.
6. **Nettoyage.** `cancelAnimation` au démontage ; fins d'animation renvoyées vers JS avec `scheduleOnRN` uniquement à la fin, jamais à chaque image.

## Niveaux de mouvement (`src/motion/useMotion.ts`)

| Niveau | Quand | Effet |
|---|---|---|
| `off` | « Réduire les animations » (système, `useReduceMotion`) **ou** mode économie d'énergie (`useLowPower`) | durée 0, valeur finale renvoyée directement (aucune animation créée), rappel de fin synchrone ; pas d'intro |
| `minimal` | thème `night` (soins nocturnes) | pas de ressort ni rebond (fondu `standard` ≤ 160 ms), pas de cascade, pas de déplacement ; intro abrégée |
| `full` | sinon | ressorts, cascades, tracés |

API : `const m = useMotion()` → `m.level`, `m.off`, `m.minimal`, `m.timing(to, ms?, curve?, cb?)`, `m.spring(to, name?, cb?)`, `m.delay(ms, anim)`, `m.duration(ms)`.
Depuis un geste (fil UI) : `motionTiming(level, …)` / `motionSpring(level, …)` sont des worklets.
`ReduceMotion.Never` est passé à Reanimated : la décision est prise une seule fois par `useMotion` (réglage + économie d'énergie), pas deux fois.

## Courbes, durées, ressorts (`src/motion/curves.ts`)

| Courbe | Bézier | Usage |
|---|---|---|
| `decelerate` | 0.16, 1, 0.3, 1 | entrées, apparitions (signature) |
| `standard` | 0.2, 0, 0, 1 | changements d'état, fondus de nuit |
| `accelerate` | 0.3, 0, 1, 1 | sorties |
| `reveal` | 0.45, 0, 0.25, 1 | tracés (contour de la maison) |

Courbes = worklets autonomes (solveur de Bézier), identiques iOS / Android / web / Jest.

Durées (ms, `theme/motion.ts`) : `instant` 90 · `fast` 160 · `base` 240 · `screen` 280 · `slow` 380 · `entrance` 520.

| Ressort | damping / stiffness / mass | ζ | Usage |
|---|---|---|---|
| `doux` | 20 / 140 / 1 | 0,85 | cartes, panneaux, retour au repos |
| `vif` | 34 / 420 / 1 | 0,83 | enfoncement, sélection |
| `rebondLeger` | 19 / 260 / 1 | 0,59 (≈ 10 % de dépassement) | relâchement, validation |

## Primitives (`import … from '@/motion'`)

| Primitive | Rôle | Valeurs |
|---|---|---|
| `Cascade` / `useCascade(index)` | apparition en cascade | fondu + 10 px, 520 ms `decelerate`, +45 ms par rang (plafond 360 ms) |
| `PressableScale` / `usePressScale()` | pression | 0,97 en `vif`, retour en `rebondLeger`, haptique légère (`motionHaptic` : jamais sur le web, réglage « Vibrations », nuit seulement avec accord) |
| `LiftCard` + `DetailEnter` | transition carte → écran détail « shared-element-like » | source : échelle 1,03, −4 px, ombre de contact en fondu, `onOpen` après 140 ms ; destination : 0,94 / +14 px → 1 / 0 en `doux` |
| `AnimatedNumber` | compteur numérique | 700 ms `decelerate` ; natif : texte mis à jour sur le fil UI (TextInput non éditable) ; web : re-rendu seulement quand la chaîne change ; lecteurs d'écran : valeur finale uniquement ; chiffres tabulaires |
| `MorphIcon` | icône de module morphable | 520 ms `decelerate` + souffle d'échelle 0,94 ; `minimal` : 160 ms sans souffle |
| `LaunchIntro` (`src/components`) | lancement maison → silhouettes → accueil | voir ci-dessous |

### Introduction de lancement (`src/components/LaunchIntro.tsx`)

Une horloge partagée (0 → 2 280 ms, linéaire), chaque pièce applique sa courbe à son étape :
tracé du contour 120–820 ms (`reveal`) · illumination (remplissage + lueur) 600–1 000 ms · halo bref 600–1 800 ms · parent, parent, enfant, enfant à 900 / 1 000 / 1 100 / 1 200 ms (360 ms chacun : fondu, +10 unités, 0,9 → 1 autour des pieds) · pose 240 ms · fondu du calque 1 800–2 280 ms avec avancée 1 → 1,06.
Image finale = `BrandLogo` (mêmes tracés, mêmes dégradés). Tracés séparés générés par `scripts/homi/brand.mjs` → `src/brand/homiMarkSvg.ts` (`HOMI_HOUSE_PATH`, `HOMI_HOUSE_LENGTH`, `HOMI_FAMILY`, `HOMI_COLORS`) ; dessin inchangé (SVG et PNG régénérés identiques).
Règles conservées : une fois par lancement à froid ; absente à la première ouverture (l'intro cinématique joue) ; `off` → aucune intro, calque retiré à durée 0 ; `minimal` (nuit) ou lancement déjà lent (> 2 s) → version abrégée (logo complet, 260 ms de pose, 320 ms de fondu). Calque `pointerEvents="none"`, masqué aux lecteurs d'écran ; l'accueil se charge dessous.

### Morphs entre modules (`src/motion/MorphIcon.tsx`, `morphShapes.ts`)

goutte → allaitement · lune → sommeil · cercle → cycle · ventre → grossesse · maison → calendrier · cœur → souvenirs.
Méthode fiable : chaque forme est un contour fermé unique rééchantillonné à 72 points équidistants, sens horaire, départ au point situé au-dessus du centre ; interpolation point à point (pas de bibliothèque de chemins, pas de commandes incompatibles).
Démonstration : **Réglages → Mon accueil** (`src/app/settings/home.tsx`), carte en tête : choisir un module transforme l'icône.

## Branchements (13/11/2026)

| Où | Primitive | Effet |
|---|---|---|
| Barre d'onglets (`components/Dock.tsx`) | `usePressScale` (0,9, sans haptique : la navigation a déjà la sienne) + pastille active en `translateX` (`m.spring(x, 'doux')`) | la pastille lilas glisse d'un onglet à l'autre ; première position posée sans animation ; fondu `standard` si aucun onglet n'est actif |
| Bouton d'action de la barre (« + », Publier, Ajouter) | `usePressScale` (0,92) | enfoncement en ressort |
| Cartes d'outils (`components/ToolCard.tsx`) | `usePressScale` (0,965) + `useCardLift` | enfoncement, puis élévation 140 ms avant l'ouverture (urgences : immédiat) ; survol web −3 px en `timing` |
| Accès directs et rappel communauté des hubs | `LiftCard` | élévation avant navigation |
| Sections des hubs (`features/hubs/HubScreen.tsx`) | `Cascade` (rangs 1…) | accès directs, favoris, puis chaque thème |
| Cartes de l'accueil (`app/(tabs)/index.tsx`) | `Cascade` (rangs 0…) | profil, fil HOMI, cartes dans l'ordre choisi, « Tous les outils » |

Tout passe par `useMotion` : `off` (Réduire les animations, économie d'énergie) → état final immédiat, `minimal` (nuit) → fondus courts sans déplacement ni élévation. Transform et opacité uniquement.

## Accessibilité

- « Réduire les animations » (iOS, Android, `prefers-reduced-motion` web) **et** économie d'énergie → état final immédiat, jamais un écran vide ou à moitié apparu.
- Thème nuit → animations minimales, aucun mouvement permanent ; haptique la nuit seulement si « vibrations de nuit » est autorisé.
- Calques décoratifs (intro, icônes morphables) masqués aux lecteurs d'écran ; compteurs : seule la valeur finale est annoncée.
- Aucune animation ne retarde une action ni ne capte de toucher.

## Tests

`src/__tests__/motionReanimated.test.tsx` (22 tests) : niveaux, durée 0 et valeur finale en `off`, ressorts, courbes, cascade / détail / pression / compteur / morph en économie d'énergie et Réduire les animations, pièces du logo identiques au SVG, chorégraphie de l'intro, intro jouée une seule fois et retirée à la fin.
Jest : Reanimated tourne dans son implémentation JS officielle grâce au résolveur `react-native-reanimated/jest/resolver` (config `jest.resolver` de `package.json`) ; sans lui, le module natif des worklets ne se charge pas sous Jest. Le mock `react-native-reanimated/mock` n'est pas utilisé (il rend toutes les animations instantanées et ne permettrait pas de vérifier la différence `off` / `full`).

## Inventaire `Animated` (React Native) restant — 53 fichiers hors tests

- **Socle partagé (à migrer en premier, gain maximal)** : `components/ui.tsx`, `Motion.tsx`, `MotionKit.tsx`, `Appear.tsx`, `Tappable.tsx`, `Screen.tsx`, `Overlays.tsx`, `States.tsx`, `Glass.tsx`, `ToolCard.tsx`, `AccountActions.tsx`, `theme/motion.ts` (helpers `springTo`, `timeTo`, `shakeX`, `successPulse`).
- **Navigation / coque** : `app/_layout.tsx` (`components/Dock.tsx` migré le 13/11/2026, voir « Branchements »).
- **Fonds et décors en boucle** (`Animated.loop`) : `Aurora.tsx`, `PowderSky.tsx`, `StarField.tsx`, `VideoBackdrop.tsx`, `DayClock.tsx`, `FetusArt.tsx`, `FetusOrb.tsx`, `ToolGlyph.tsx`, `features/motionViz.tsx`, `story/FamilyStoryArt.tsx`, `goldTimeline.tsx`, `pregnancyThread.tsx`, `dayThread.tsx`, `dayStrip/DayStrip.tsx`, `cycle/GuideArt.tsx`, `cycle/GoldCycleRing.tsx`, `cocoon/Cocoon.tsx`.
- **Instruments et chronomètres** : `bottleClock.tsx`, `bottleDay.tsx`, `bottleInstrument.tsx`, `childCare.tsx`.
- **Écrans et modules** : `app/intro.tsx`, `app/calendar.tsx`, `app/cycle/calendar.tsx`, `app/child/[id]/discoveries.tsx`, `cinematicIntro/CinematicIntro.tsx`, `Paywall.tsx`, `subscription.tsx`, `community.tsx`, `namesSwipe.tsx`, `familyLoad.tsx`, `postpartum.tsx`, `cycle/Bars.tsx`, `cycle/PainKit.tsx`, `cycle/kit.tsx`, `cycle3/CycleCalendar.tsx`, `cycle3/ui.tsx`, `Charts.tsx`, `GrowthChart.tsx`.

## Plan de migration

1. **Socle** : réécrire `usePressMotion`, `StaggerItem`, `usePop`, `Appear` sur `usePressScale` / `useCascade` en gardant leurs signatures → tous les écrans en profitent sans modification (coordonner avec les propriétaires de `ui.tsx`).
2. **Décors en boucle** : passer sur `useMotion` (`off` et `minimal` → immobiles), puis `withRepeat` ; vérifier qu'aucun ne tourne près d'un chronomètre.
3. **Instruments** (biberon, soins) : migrer en dernier, avec tests de non-régression des chronomètres ; aucune animation permanente pendant le suivi nocturne.
4. **Transitions de carte** : fait pour les cartes d'outils (`ToolCard`) et les accès directs des hubs ; reste : `DetailEnter` côté écran détail, cartes propres à chaque module de l'accueil.
5. **Morphs** : à faire — utiliser `MorphIcon` dans les en-têtes de module lors de la navigation entre modules, et icônes de module dédiées (`src/components/icons/**`, agent Iconographie). Le Dock n'en utilise pas (icônes Feather, pastille glissante).
6. **Gestes** : react-native-gesture-handler 3.3 est présent mais non déclaré ; à déclarer avant tout geste (glisser pour fermer, tri à la main).
7. Une fois `Animated` absent de `src/`, retirer les helpers `Animated` de `theme/motion.ts` (garder les jetons).

## Non vérifié

Appareils réels iOS / Android, ProMotion 120 Hz, FPS mesurés (aucun profilage natif possible ici). Vérifié : export web et rendu image par image dans Chromium, Jest, TypeScript.
