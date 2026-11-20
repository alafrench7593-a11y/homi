# HOMI — Système de mouvement

Nouveau code : **Reanimated 4.7.1** (`react-native-worklets` 0.13.0), primitives dans `src/motion/**`.
Jetons partagés avec l'API `Animated` historique : `src/theme/motion.ts`.

## Primitives « Liquid Glass » (17/11/2026) — `src/motion/`, pour `@/components/glass`

Neuf primitives NOMMÉES, réutilisables hors du verre. Chacune décide d'abord si elle doit jouer (`useMotion()`), tourne
sur le fil UI et n'anime que `transform` et `opacity` (exceptions assumées : la largeur d'un indicateur en position
absolue et sans enfant ; un seul petit tracé SVG pour la coche).

| Primitive | Fichier | Mouvement complet | `off` (Réduire les animations, économie d'énergie) | `minimal` (nuit) |
|---|---|---|---|---|
| `usePress({ scale, haptic, disabled })` | `Press.ts` | 0,97 en `vif` au contact, retour `doux` ; `progress` 0 → 1 ; haptique léger | aucune échelle ; `progress` saute (le voile d'appui reste) | fondu court |
| `StaggerList` | `Stagger.tsx` | `Cascade` par rang : +45 ms, plafond 360 ms | tout visible d'emblée | fondu sans déplacement ni décalage |
| `ContentSwap({ swapKey, direction, axis })` | `ContentSwap.tsx` | sortie 110 ms `accelerate` (l'ancien contenu reste monté), entrée 220 ms `decelerate`, 10 px | échange immédiat | fondu sans glissement |
| `useItemLayouts()` + `useIndicator(layout)` | `Indicator.ts` | `translateX` + `width` en ressort `panneau` | pose immédiate | 160 ms sans ressort |
| `FavoriteStar` / `useFavoritePop(active)` | `Favorite.tsx` | 1,28 → 1 en `rebondLeger`, onde 420 ms, quand la DONNÉE passe à vrai | rien | rien |
| `useShake()` | `Shake.ts` | 7, −6, 4, −2, 0 px × 55 ms, haptique « erreur » | aucune secousse (haptique conservé) | aucune secousse |
| `SuccessCheck({ visible })` | `SuccessCheck.tsx` | 0,6 → 1 en `rebondLeger`, tracé 240 ms après 60 ms | coche complète | fondu 180 ms |
| `SkeletonPulse` + `SkeletonBone` | `SkeletonPulse.tsx` | opacité 1 ↔ 0,45, 900 ms, un nœud animé par groupe | immobile | immobile |
| `ReorderList` + `useReorderScroll()` | `Reorder.tsx` | voir ci-dessous | la carte suit le doigt, sans soulèvement ; voisines sans trajet | glissement 160 ms sans ressort |

### Glisser-déposer (`ReorderList`)

Reanimated + Gesture Handler (API `Gesture.Pan()` déjà éprouvée en production par `Sheet`), aucune dépendance ajoutée.
Lignes en position absolue dans un conteneur de hauteur connue ; leur place = ordre (valeur partagée) + hauteurs
mesurées (hauteurs variables acceptées). Appui long 220 ms → la carte se soulève (1,03 + ombre en fondu) ; le rang
visé est calculé sur le fil UI (`reorderOrder`, pur, sans oscillation : les seuils ne dépendent pas de l'ordre
courant) ; UN aller-retour vers le fil JS par changement de rang (haptique « sélection »), jamais par image ;
défilement automatique par `useFrameCallback`, actif seulement pendant un glisser (`autoScrollSpeed`) ; au dépôt,
`onReorder(keys)` une fois. Lecteurs d'écran : actions « monter » / « descendre » (`info.a11y`).

### Règles worklets (trois plantages iOS venaient de là) — gardées par `src/__tests__/workletDefaults.test.ts`

1. aucun paramètre par défaut lisant la fermeture dans un worklet (test sur le code réellement envoyé au fil UI) ;
2. aucune fonction déclarée DANS un worklet confiée à `scheduleOnRN` : elle est déclarée dans le composant (test
   ajouté le 17/11/2026 : analyse de l'arbre syntaxique, avec exemples fautifs et corrects) ;
3. aucune ref React lue dans un worklet (valeurs partagées, `useAnimatedRef`) ;
4. pas de `width` / `height` animés avec le pilote natif d'`Animated` (les primitives ci-dessus sont en Reanimated).

### Visite guidée dans l'application (`src/features/tour/`, 18/11/2026)

Sept étapes sur les VRAIS écrans (accueil, profil, Mes outils, « Ajouter », favori, agenda, personnaliser), qui avancent
sur un événement réel (profil changé dans le magasin, outil ouvert, favori, navigation, éditeur ouvert). Ancres :
`useTourAnchor(id)` (mesure `measureInWindow`, défilement jusqu'à l'élément). Superposition montée une fois dans
`_layout.tsx` (`TourHost`), sans modale : voile + découpe = UNE vue sans enfant en position absolue (bordure géante) dont
position et taille passent d'une cible à l'autre en ressort `panneau` sur le fil UI (exception assumée « vue absolue sans
enfant ») ; bandes transparentes qui arrêtent les touchers hors de la cible ; bulle de verre `sheet` (bandeau d'une
ligne quand la place manque) ; MAIN dessinée (`TourHand`, 20/11/2026 : trait d'encre, ombre légère ; toucher = appui + onde, glisser = trajectoire courbe, faire glisser) en `withRepeat` sur le fil UI. `off` :
découpe posée sans trajet, aucun doigt ; `minimal` : fondus courts. Aucun `scheduleOnRN`, aucune ref lue dans un
worklet. Mode exercice (`src/lib/practice.ts`) : aucune écriture ne part (testé). Détails et règles : en tête de
`src/features/tour/model.ts` et `TourOverlay.tsx` ; tests `tour.test.ts`, `tourScreens.test.tsx`, e2e
`e2e/visite_guidee.py`. À vérifier sur iPhone : VoiceOver, haptique, gestes natifs, écrans présentés en modale iOS
(la pastille de la visite passe sous eux ; le bandeau « exercice » est dans l'écran lui-même).

### Reprise de la visite (20/11/2026) — mesurée dans `e2e/visite_guidee.py`

Avant : 409 ms entre l'appui sur « Reprendre la visite » et la découpe posée, 3 sauts (le trou grandissait depuis le
centre de l'écran, voile plein dès la première image), mesures `measureInWindow` des ancres les unes après les autres,
toutes les 280 ms, deux états React (découpe, zone touchable) mis à jour l'un après l'autre. Après : 160 ms, aucun saut,
aucun clignotement ; animations réduites : 79 ms. Causes corrigées : la découpe NAÎT sur l'élément (agrandie de 10 px,
resserrée en 160 ms ease-out, voile en fondu) ; la bulle n'apparaît qu'avec sa découpe ; mesures en parallèle (origine
mémorisée), à chaque image pendant 700 ms après une étape ou un défilement puis toutes les 450 ms ; un seul état
`geo` ; d'une étape à l'autre l'ancienne découpe reste posée 400 ms au plus le temps de trouver la nouvelle cible.

### Introduction « Je suis… » (20/11/2026) — `src/features/intro/`

Une valeur partagée `pos` (page, réel) pilote tout sur le fil UI : glissement + fondu des pages, cascade des éléments
(`Layer` : décalage `(page − pos) × profondeur × 34 px` + fondu), pastille de progression (vue absolue sans enfant)
qui suit le doigt. Balayage `Gesture.Pan()` (résistance ×0,25 aux bords et sur « Je suis… » sans profil), relâche en
ressort `panneau` avec la vitesse du geste, un `scheduleOnRN(settle)` par geste. `off` : pages posées, aucune
cascade ni boucle. Tests : `introProfiles.test.tsx`, e2e `e2e/intro_profils.py`.

### Skia, Rive, Lottie : évalués, non installés

Poids ci-dessous : ordres de grandeur donnés de mémoire, à mesurer sur un build avant toute décision.

- **Skia** (`@shopify/react-native-skia`) — apport réel pour HOMI : réfraction / reflets procéduraux du verre et
  graphiques très denses ; rien dans la bibliothèque actuelle n'en a besoin (flou natif + dégradés suffisent). Poids :
  ≈ 4 Mo par architecture (iOS) et ≈ 6 Mo (Android), plus un binaire WebAssembly (CanvasKit, ≈ 3 Mo compressé) pour le
  web. Maintenu activement (Shopify), compatible Nouvelle Architecture ; version à faire résoudre par
  `npx expo install` au moment de l'adopter, build de développement obligatoire. **Non installé.**
- **Rive** (`rive-react-native`) — apport : illustrations interactives à machine d'états (mascotte, onboarding) ; HOMI
  n'a aucun fichier `.riv` ni graphiste Rive, et le logo animé existe déjà en SVG + Reanimated. Poids : moteur natif
  ≈ 2–3 Mo par plateforme ; le web demande un autre paquet (`@rive-app/react-canvas`), donc deux intégrations.
  Maintenu, mais hors du jeu de modules Expo (plugin de configuration, build de développement). **Non installé.**
- **Lottie** (`lottie-react-native`) — apport : célébrations et illustrations d'états vides livrées par un motion
  designer ; aujourd'hui la coche, le favori et les squelettes sont des primitives de quelques lignes, sans fichier
  JSON à maintenir. Poids : ≈ 1 Mo natif + chaque animation (50–300 Ko) ; web via `@lottiefiles/dotlottie-react`.
  Maintenu, pris en charge par `npx expo install` pour le SDK 57. **Non installé** — le premier candidat si une
  illustration animée de célébration est commandée.

### Tests

`src/__tests__/motionGlass.test.tsx` (25) : chaque primitive en mouvement complet puis en état final immédiat
(Réduire les animations / économie d'énergie), logique pure du glisser-déposer, actions d'accessibilité.
`glassComponents.test.tsx` (53), `glassNative.test.tsx` (3), `glassContrast.test.ts` (104).

## v4 « lumière minérale » (14/11/2026)

Les familles et ressorts v3 ci-dessous sont CONSERVÉS. Changements v4 :

| Geste | Où | Mouvement | Réduire les animations / nuit |
|---|---|---|---|
| **Lentille qui glisse** (changement d'onglet) | `Dock` → `Lens` (`src/components/controls/Lens.tsx`) | position ET largeur de la lentille en ressort `panneau` (`useLensSlide`), première pose sans trajet, interruptible ; la caustique prend l'accent de l'espace | pose immédiate / sans reflet ni caustique |
| **Lentille du sélecteur** | `ChoiceGroup` pills, `Segmented` | même lentille, même ressort ; gras + coche en plus | idem |
| **Confirmation** | `Button` (et `PrimaryButton` / `SecondaryButton`) | promesse résolue : respiration 1 → 1,03 + COCHE qui remplace le libellé 900 ms (`BUTTON.successMs`), largeur stable ; échec : tremblement + message ; double appui ignoré pendant le chargement | coche sans fondu, sans respiration |
| **Panneaux** | `Sheet` (verre OPTIQUE en v4) | inchangé (geste, crans, fermeture 280 ms) | inchangé |
| **Changement de palette** | `ThemeProvider` | lumière de la scène, reflets du verre, caustiques et accents interpolés ENSEMBLE (4 × 90 ms) ; le contenu ne bouge pas (aucune mise en page ne dépend de la palette) | immédiat |
| **Scène d'espace** | `SpaceScene` | parallaxe de la lumière (3 px) et de la composition (6 px), 22 s ; passer d'un espace à l'autre change la composition avec le fondu de l'écran | image fixe |

Alternative lisible au verre : le remplissage seul garantit le contraste (testé) ; « Réduire la transparence » (iOS)
et la nuit rendent toutes les matières opaques ; la lentille reste plus claire que son rail même sans reflet.

## v3 « désert sci-fi » (13/11/2026) — trois familles, quatre gestes signature

| Famille | Bornes | Jeton | Exemples |
|---|---|---|---|
| Micro-interactions | 120–180 ms | `duration.micro` 150, ressorts `vif` / `rebondLeger` | pression (0,98 bouton, 0,92 orbe), coche, pastille, haptique |
| Panneaux | 220–320 ms | `duration.panel` 280, ressort `panneau` (30 / 280 / 1, ζ ≈ 0,9) | panneau du bas (crans, fermeture), indicateur qui glisse (sélecteur, barre d'onglets), reflet de bouton 320 ms |
| Scènes | 320–450 ms | `duration.scene` 400 | carte → détail (400 / retour 340), changement de palette (4 × 90 ms), fondu clair ↔ sombre du fond (400) |

Tout est **interruptible** (ressorts et `withTiming` repartent de la valeur courante ; un nouveau choix de palette
annule la transition en cours et repart de la couleur affichée ; une nouvelle ouverture de morph repart de la géométrie
courante). **Réduire les animations / économie d'énergie** (`off`) : états finaux immédiats, ou fondus simples (fond de
coque) ; **nuit** (`minimal`) : fondus courts, pas de parallaxe, pas de fantôme de morph.

### Panneau du bas gestuel (`Sheet`, `src/components/Overlays.tsx`, API inchangée)

- react-native-gesture-handler 3.3 (déclaré dans `package.json`) : `Gesture.Pan()` sur la poignée et l'en-tête,
  `GestureHandlerRootView` dans la modale (et à la racine, `_layout.tsx`). Le panneau suit le doigt sur le fil UI ;
  au-dessus du grand cran, résistance élastique (×0,18).
- Crans (`sheetSnaps`, testé) : contenu court → un cran ; contenu haut (> 62 % de l'écran) → cran moyen (≈ 58 % visible)
  + grand cran. Relâcher (`sheetRelease`, testé) : lancer > 900 px/s → cran suivant dans le sens du geste ; sinon le
  plus proche ; au-delà de 40 % sous le plus petit cran, ou lancer vers le bas depuis ce cran → fermeture.
- Pose : ressort `panneau` avec la vitesse du doigt. Fermeture : 280 ms `accelerate` — la MÊME pour le geste, le voile,
  le bouton Fermer, le retour Android et `visible={false}` ; démontage via `scheduleOnRN` à la fin seulement.
- Clavier : zone qui évite le clavier (KeyboardAvoidingView) + passage au grand cran à l'ouverture du clavier ; fermer
  le panneau ferme le clavier ouvert par un de ses champs.
- Lecteurs d'écran : poignée « réglable » (agrandir / réduire ou fermer) + bouton Fermer.
- Tests : `src/__tests__/homiV3.test.tsx` (crans, relâcher) ; E2E `e2e/apparence_v3.py` (ouvrir, le panneau suit le
  doigt, retour au cran, saisie au clavier, fermeture glissée / voile / bouton, Réduire les animations).

### Morph carte → détail (`src/motion/Morph.tsx`) — pour l'agent « Accueil »

```tsx
// carte (source) — la surface s'agrandit vers l'écran détail
<MorphSource id={`mission-${m.id}`} onOpen={() => router.push(`/family/missions/${m.id}`)} radius={radius.lg} tint={accent?} accessibilityLabel={…}>…</MorphSource>
// ou sur une surface existante
const src = useMorphSource(`mission-${m.id}`, { radius: radius.lg });
<View ref={src.ref} collapsable={false}>…</View>  … onPress={() => src.open(() => router.push(…))}
// écran détail — le contenu apparaît sous la surface ; au retour (démontage), la surface revient vers la carte
<MorphTarget id={`mission-${id}`}>…</MorphTarget>
```

Un fantôme de surface mate (lumière interne de la palette ou `tint`) est animé par `<MorphHost />` (monté une fois au
dessus de la navigation) : rectangle de la carte → plein écran en 400 ms `decelerate`, la navigation part dès la
première image (rien n'attend), fondu 160 ms qui révèle le détail ; retour 340 ms vers le rectangle RE-MESURÉ de la
carte (seulement pour l'élément réellement ouvert : `morphRegistry.lastOpened`). `off` : navigation immédiate, aucun
fantôme ; `minimal` : fondu court du contenu. `DataTile morphId` l'utilise directement. `LiftCard` / `DetailEnter`
restent disponibles (élévation sans fantôme).

### Changement de palette

`ThemeProvider` : un seul mélange de palettes alimente accents, sélections, confirmations, halo, reflets ET scène ;
4 paliers × 90 ms (`PALETTE_TWEEN`), courbe « décélération ». L'Auto garde ses paliers de 5 min (pas de seconde
transition). Fond : changement clair ↔ sombre par un voile qui s'efface en 400 ms (immédiat avec Réduire les
animations). Chaque palier intermédiaire est lisible (contrast.test.ts, « changement de palette animé »).

### Scène (`SpaceScene`, v4 ; `DesertScene` = alias de l'Accueil)

Parallaxe légère : lumière 3 px, composition 6 px (constantes `SCENE.parallax`), 22 s aller-retour en sinus, `withRepeat` sur le fil UI. Image fixe
(`sceneAnimates`, testé) : `off`, `minimal`, application en arrière-plan (`AppState`), `active={false}` (hors écran),
`still`. Annulée (`cancelAnimation`) dès qu'une de ces conditions apparaît.

### « Découvrir HOMI » (`/discover`, `src/features/discover/**`, 14/11/2026)

Remplace l'introduction de première ouverture (`/cinematic` redirige ; même règle « une fois » `cinematicSeen`),
relançable depuis Réglages → Découvrir HOMI (`?replay=1`). Ouverture : le LOGO HOMI se pose (animé) puis son symbole s'ouvre en
premier panneau de verre (reflet qui longe son bord), caméra dans le panneau (gros plan sur grossesse, biberons,
mission, puis recul). Caméra (450 ms `decelerate`, avancée + glissement) réservée à l'ouverture et aux changements de
chapitre ; geste horizontal interruptible. Catalogue : chaque tuile s'ouvre depuis sa position (`MorphSource sheen` :
reflet sur le bord haut du fantôme) et revient à sa place. Démos : moteur `DemoPlayer` / `DemoTarget` (doigt fantôme
qui approche et appuie, puis résultat ; un vrai toucher l'interrompt) — 12 types génériques + 9 démos sur mesure.
`off` : état final, aucun doigt, « Rejouer » attend le geste ; `minimal` : fondus seuls.
**Branchement du logo animé** : `setDiscoverOpening(HomiLogoAnimated)` (ou `<DiscoverKeynote logo=…>`) ; la
présentation passe `width`, `tone`, `still`, `onHousePanel` (= `onLensPanel`), `onDone` et fait elle-même grandir le
panneau depuis le symbole mesuré (pas de `deployTo`). Sans logo injecté : logo fixe (`BrandStack`) en fondu, provisoire.
Tests : `src/__tests__/discoverHomi.test.tsx` ; E2E `e2e/decouvrir_homi.py`, vidéo `e2e/decouvrir_homi_video.js`.

## Principes

1. **Calme et intentionnel.** Le mouvement explique (d'où vient un écran, ce qui vient de changer), il ne décore pas. Jamais d'agressivité, jamais d'attente imposée : l'action part tout de suite, l'animation suit.
2. **Compositeur uniquement.** On anime `transform` et `opacity`, sur le fil UI (valeurs partagées et worklets). Seules exceptions : le panneau issu du symbole du logo (un seul tracé `d`, `useAnimatedProps`) et le `d` des icônes morphables (≤ 72 points, petites icônes).
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
| `reveal` | 0.45, 0, 0.25, 1 | tracés et révélations |

Courbes = worklets autonomes (solveur de Bézier), identiques iOS / Android / web / Jest.

Durées (ms, `theme/motion.ts`) : `instant` 90 · `fast` 160 · `base` 240 · `screen` 280 · `slow` 380 · `entrance` 520 ; v3 : `micro` 150 · `panel` 280 · `scene` 400 (familles `durationFamilies`, testées).

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
| `HomiLogoAnimated` / `LaunchIntro` (`src/components`) | logo v5 « encre » : corps → têtes → nom → point du i → panneau ; lancement | voir ci-dessous |
| `PressSheen` / `usePressSheen` (v2) | reflet bref qui glisse sur un bouton capsule à la pression (bouton principal, bouton d'action de la barre) | bande de lumière inclinée −18°, une traversée de 320 ms `decelerate` (v3), opacité en sinus (0 au repos et à la fin) ; `off` et `minimal` : rien n'est rendu |
| `GlowCard` (v2, `src/components`) | carte sélectionnée / action importante / validation | activation : halo 0 → 1 en ressort `doux` + échelle 0,97 → 1 ; filet en fondu 240 ms `standard` ; faisceau unique 720 ms `decelerate`. Repos : statique. `still` (listes) : aucun mouvement. `minimal` : fondu court, ni halo ni faisceau |
| `CompletionCheck` + `CompletionGlow` (v2) | passage d'une tâche à « terminé » | disque 0,6 → 1 en `rebondLeger`, coche tracée 240 ms (`strokeDashoffset`, 80 ms après), anneau 520 ms, haptique « succès » ; halo de ligne 180 ms + 720 ms ; décocher : fondu 200 ms. `off` : état final immédiat ; `minimal` : fondus seuls |
| `Reveal` (audit 09) | section qui apparaît après un choix (divulgation progressive) | entrée : fondu + 12 px, 240 ms `decelerate` ; sortie : 160 ms `accelerate` puis démontage ; `pointerEvents="none"` pendant la sortie (aucun fantôme) ; `scrollIntoView` : défile si la section est sous le pli (`useScreenScroll().ensureVisible`) ; `off` : immédiat |
| `Screen` — en-tête (audit 09) | titre compact qui apparaît / grand titre fixe qui se replie | 160 ms (compact) / 200 ms (repli en hauteur), `timeTo` : immédiat avec « Réduire les animations » |
| `Sheet` (v2, `components/Overlays.tsx`) | panneau du bas | ouverture : ressort `doux` (interruptible, repart de la position courante) ; fermeture : 240 ms `accelerate`, démontage via `scheduleOnRN` |

### Logo animé (`src/components/HomiLogoAnimated.tsx`, v5 « encre », 16/11/2026)

Décision de la propriétaire (16/11/2026) : le logo officiel est SON logo en encre (symbole « M » formé de deux
personnes + mot-symbole « HOMI », voir `HOMI_BRAND.md`) ; le logo maison violet et son animation (tracé, illumination,
reflets, quatre silhouettes) sont retirés. Le logo s'anime comme UN SEUL objet, **sobrement et vite (logo complet en
1,32 s)**, sur une seule horloge (valeur partagée, fil UI). Constantes nommées : `src/brand/logoMotion.ts`
(`LOGO_MOTION`, `logoBox`, `logoTimeline`, `backOut`, `houseMeasureAt`, `housePanelFrame`, `housePanelPath`, testés).
Composition : l'assemblage officiel (symbole à gauche, mot à droite ; hauteur `logoBox(width).height` ≈ 0,31 × largeur).
Pièces : sous-tracés EXACTS de la source (`HOMI_PARTS` : tête au chignon, seconde tête, corps « M », lettres, point du
i), encre en clair, ivoire en sombre. **Transform et opacité uniquement** (aucun tracé animé hors panneau).

| Étape | Temps (mouvement complet) | Mécanique |
|---|---|---|
| le corps « M » monte du sol | 120 → 560 ms, `decelerate` | fenêtre qui se lève (la fenêtre glisse vers le haut, le contenu en sens inverse) + montée de 10 % de sa hauteur, fondu rapide |
| les deux têtes se posent | chignon 340 → 760 ms, seconde tête 430 → 850 ms | tombent de 45 % de leur hauteur, échelle 0,6 → 1 autour de leur centre, back-out (s = 1,7, ≈ 10 % de ressort) |
| « HOMI » se révèle | 640 → 1 080 ms, `decelerate` | fenêtre qui glisse de gauche à droite + contre-glissement, montée de 6 % |
| le point du i se pose | 980 → 1 320 ms | même ressort que les têtes, sans chute |
| ensemble | 120 → 1 320 ms | échelle 0,97 → 1 (`decelerate`) |
| déploiement en panneau (si `deployTo`) | 1 380 → 1 940 ms, `decelerate` | UN tracé SVG sous le logo : la boîte du symbole (angles arrondis) grandit jusqu'au panneau cible, déjà en verre |

API (stable) : `<HomiLogoAnimated width tone? still? clock? timeline? deployTo? panel? onHousePanel? onLensPanel? onDone? />`
— `tone` : `light` = encre, `dark` = ivoire (défaut : thème) ; `deployTo` : panneau cible en coordonnées FENÊTRE
(`{ x, y, width, height, radius, fill, edge? }`) ; `panel` : valeur partagée 0 → 1 écrite sur le fil UI pendant le
déploiement ; `onHousePanel(house, target)` (nom historique ; alias `onLensPanel`, un seul appel si la même fonction
est passée aux deux) : une seule fois, au début du déploiement — ou, sans `deployTo`, quand le logo est complet
(1 320 ms, `target` = null) — avec la mesure FENÊTRE du symbole `{ x, y, width, height, cx, cy, r }` ; `onDone` : une
fois, fin de l'horloge interne ; `clock` + `timeline` : horloge externe. Retours vers JS par `scheduleOnRN`, jamais à
chaque image ; `cancelAnimation` au démontage.
Niveaux : `off` (Réduire les animations, économie d'énergie) → état final (logo complet, panneau posé) avec un simple
fondu d'opacité de 180 ms, rappels immédiats ; `minimal` (nuit) → fondu 160 ms, aucun déplacement ; version FIXE
(`still` ou largeur < 120 px) → `BrandStack`. Image finale = `BrandStack` (mêmes tracés : `HOMI_SVG.logo`).

Branchements : « Découvrir HOMI » (`/discover`, et `/cinematic` qui y redirige) — `setDiscoverOpening(HomiLogoAnimated)`
dans `src/app/_layout.tsx`, sans `deployTo` : la présentation fait grandir son panneau de verre à partir de la mesure
`onHousePanel` (passage de relais à 1 350 ms, juste après le logo complet) ; `LaunchIntro` (sans déploiement) ;
`HomiIntro` (`src/features/entry`, avec `deployTo` : le symbole se déploie en panneau où se pose l'accroche, 1,94 s +
420 ms de pose). Captures image par image et vidéo : `e2e/logotype.py` (+ `e2e/logotype_video.js`).

### Introduction de lancement (`src/components/LaunchIntro.tsx`)

Une horloge partagée (0 → ≈ 2 040 ms, linéaire) : logo animé (`logoTimeline('full')`, sans panneau, 1 320 ms) · pose
240 ms · fondu du calque 480 ms avec avancée 1 → 1,06. Règles conservées : une fois par lancement à froid ; absente à
la première ouverture (`/cinematic` joue ce rôle) ; `off` → aucune intro, calque retiré à durée 0 ; `minimal` (nuit)
ou lancement déjà lent (> 2 s) → version abrégée (logo complet, 260 ms de pose, 320 ms de fondu). Calque
`pointerEvents="none"`, masqué aux lecteurs d'écran ; l'accueil se charge dessous. L'ouverture de l'onboarding
(`OpeningStep`) ne rejoue pas le logo après l'introduction (`launchLogoState`) : jamais deux logos d'affilée.

### Morphs entre modules (`src/motion/MorphIcon.tsx`, `morphShapes.ts`)

goutte → allaitement · lune → sommeil · cercle → cycle · ventre → grossesse · maison → calendrier · cœur → souvenirs.
Méthode fiable : chaque forme est un contour fermé unique rééchantillonné à 72 points équidistants, sens horaire, départ au point situé au-dessus du centre ; interpolation point à point (pas de bibliothèque de chemins, pas de commandes incompatibles).
Démonstration : **Réglages → Mon accueil** (`src/app/settings/home.tsx`), carte en tête : choisir un module transforme l'icône.

## Branchements (13/11/2026, complétés par la v2 puis la v3)

| Où | Primitive | Effet |
|---|---|---|
| Barre d'onglets (`components/Dock.tsx`) | `usePressScale` (0,9, sans haptique : la navigation a déjà la sienne) + pastille active en `translateX` (`m.spring(x, 'doux')`) | la pastille lilas glisse d'un onglet à l'autre ; première position posée sans animation ; fondu `standard` si aucun onglet n'est actif |
| Bouton d'action de la barre (« + », Publier, Ajouter) | `usePressScale` (0,92) | enfoncement en ressort |
| Cartes d'outils (`components/ToolCard.tsx`) | `usePressScale` (0,965) + `useCardLift` | enfoncement, puis élévation 140 ms avant l'ouverture (urgences : immédiat) ; survol web −3 px en `timing` |
| Accès directs et rappel communauté des hubs | `LiftCard` | élévation avant navigation |
| Sections des hubs (`features/hubs/HubScreen.tsx`) | `Cascade` (rangs 1…) | accès directs, favoris, puis chaque thème |
| Cartes de l'accueil (`app/(tabs)/index.tsx`) | `Cascade` (rangs 0…) | profil, fil HOMI, cartes dans l'ordre choisi, « Tous les outils » |
| Bouton principal (`ui.tsx` `Button variant="primary"`) | `PressSheen` | reflet qui glisse à chaque appui (en plus de l'enfoncement existant) |
| Bouton d'action de la barre (`Dock.tsx`) | `usePressScale` + `PressSheen` | enfoncement + reflet |
| `Card selected` / `Card emphasis` (`ui.tsx`) | `GlowCard` | halo qui grandit, filet, faisceau unique |
| Feuilles du bas (`Overlays.tsx` `Sheet`) | gesture-handler + `useMotion` (`springs.panneau`, `timing 'accelerate'`) | v3 : gestuel (voir plus haut) |
| Barre d'onglets (v4) | ressort `panneau` | LENTILLE de verre clair qui glisse (position + largeur) |
| Sélecteurs (`ChoiceGroup`, `Segmented`) | ressort `panneau` | lentille qui glisse (v4) ; orbes qui grandissent / se resserrent |
| Fond de coque (`DesertScene`) | `withRepeat` + `cancelAnimation` | parallaxe légère, image fixe sinon |
| Assistant du scanner (`features/scanner/WizardChrome.tsx`) | `m.timing` 280 ms `decelerate` (nuit : fondu 160 ms ; `off` : immédiat) | l'étape glisse de 16 px dans le sens du geste + fondu ; les segments de progression se remplissent / se vident en `translateX` au même moment ; chaque étape repart en haut |
| Historique / dernier scan → fiche (`features/scanner/components.tsx`) | `useMorphSource('scan-<id>')` + `MorphTarget` | la surface mate de la ligne s'agrandit vers la fiche résultat, retour vers la même ligne |
| Biberon (`features/bottleSession.tsx`, `bottleStats.tsx`, `bottleList.tsx`, `bottleClock.tsx`, `bottleDay.tsx`, `app/bottle/**`) | `useMotion` (`rebondLeger`, `vif`, `timing` 150 / 400), `MorphSource` / `MorphTarget`, `Sheet` | commande ronde : souffle + fondu de l'icône au changement d'état ; coche du résultat en ressort ; ligne → enfant et tuile → historique en morph ; aiguille du cadran posée une fois (400 ms) ; doseur : chiffre qui « tape » et arc qui avance ; AUCUNE boucle (chronomètre à l'écran) ; `off` : états finaux |
| Réglages → Apparence (`app/settings/appearance.tsx`) | `GlowCard` (sélecteur, `role="radio"`), `CompletionCheck`, `CompletionGlow`, `PressSheen` | démonstration vivante ; palette Auto : couleurs interpolées par paliers de 5 min (pas d'animation, voir `HOMI_DESIGN_SYSTEM.md`) |

Tout passe par `useMotion` : `off` (Réduire les animations, économie d'énergie) → état final immédiat, `minimal` (nuit) → fondus courts sans déplacement ni élévation. Transform et opacité uniquement.

## Accessibilité

- « Réduire les animations » (iOS, Android, `prefers-reduced-motion` web) **et** économie d'énergie → état final immédiat, jamais un écran vide ou à moitié apparu.
- Thème nuit → animations minimales, aucun mouvement permanent ; haptique la nuit seulement si « vibrations de nuit » est autorisé.
- Calques décoratifs (intro, icônes morphables) masqués aux lecteurs d'écran ; compteurs : seule la valeur finale est annoncée.
- Aucune animation ne retarde une action ni ne capte de toucher.

## Tests

`src/__tests__/homiV2.test.tsx` (v2) : reflet absent et coche posée sans ressort ni halo avec Réduire les animations
et en économie d'énergie ; ressort puis état final en mouvement complet ; halo de validation éteint à la fin.
`e2e/apparence_v2.py` : mêmes vérifications dans Chromium avec `reducedMotion: 'reduce'` / `'no-preference'`.

`src/__tests__/motionReanimated.test.tsx` (22 tests) : niveaux, durée 0 et valeur finale en `off`, ressorts, courbes, cascade / détail / pression / compteur / morph en économie d'énergie et Réduire les animations, pièces du logo identiques au SVG, chorégraphie de l'intro, intro jouée une seule fois et retirée à la fin.
Jest : Reanimated tourne dans son implémentation JS officielle grâce au résolveur `react-native-reanimated/jest/resolver` (config `jest.resolver` de `package.json`) ; sans lui, le module natif des worklets ne se charge pas sous Jest. Le mock `react-native-reanimated/mock` n'est pas utilisé (il rend toutes les animations instantanées et ne permettrait pas de vérifier la différence `off` / `full`).

## Inventaire `Animated` (React Native) restant — 53 fichiers hors tests

- **Socle partagé (à migrer en premier, gain maximal)** : `components/ui.tsx` (le reflet du bouton principal est déjà en Reanimated), `Motion.tsx`, `MotionKit.tsx`, `Appear.tsx`, `Tappable.tsx`, `Screen.tsx`, `Overlays.tsx` (toasts ; la feuille `Sheet` est migrée), `States.tsx`, `Glass.tsx` (reflet au curseur), `ToolCard.tsx`, `AccountActions.tsx`, `theme/motion.ts` (helpers `springTo`, `timeTo`, `shakeX`, `successPulse`).
- **Navigation / coque** : `app/_layout.tsx` (`components/Dock.tsx` migré le 13/11/2026, voir « Branchements »).
- **Fonds et décors en boucle** (`Animated.loop`) : `Aurora.tsx` (`PowderSky.tsx` et `StarField.tsx` : retirés en v3), `VideoBackdrop.tsx`, `DayClock.tsx`, `FetusArt.tsx`, `FetusOrb.tsx`, `ToolGlyph.tsx`, `features/motionViz.tsx`, `story/FamilyStoryArt.tsx`, `goldTimeline.tsx`, `pregnancyThread.tsx`, `dayThread.tsx`, `dayStrip/DayStrip.tsx`, `cycle/GuideArt.tsx`, `cycle/GoldCycleRing.tsx`, `cocoon/Cocoon.tsx`.
- **Instruments et chronomètres** : `childCare.tsx` (biberon migré le 13/11/2026 : `bottleInstrument.tsx` retiré, `bottleClock.tsx` et `bottleDay.tsx` sur Reanimated / sans boucle).
- **Écrans et modules** : `app/intro.tsx`, `app/calendar.tsx`, `app/cycle/calendar.tsx`, `app/child/[id]/discoveries.tsx`, `Paywall.tsx`, `subscription.tsx`, `community.tsx`, `namesSwipe.tsx`, `familyLoad.tsx`, `postpartum.tsx`, `cycle/Bars.tsx`, `cycle/PainKit.tsx`, `cycle/kit.tsx`, `cycle3/CycleCalendar.tsx`, `cycle3/ui.tsx`, `Charts.tsx`, `GrowthChart.tsx`.

## Plan de migration

1. **Socle** : réécrire `usePressMotion`, `StaggerItem`, `usePop`, `Appear` sur `usePressScale` / `useCascade` en gardant leurs signatures → tous les écrans en profitent sans modification (coordonner avec les propriétaires de `ui.tsx`).
2. **Décors en boucle** : passer sur `useMotion` (`off` et `minimal` → immobiles), puis `withRepeat` ; vérifier qu'aucun ne tourne près d'un chronomètre.
3. **Instruments** (biberon, soins) : migrer en dernier, avec tests de non-régression des chronomètres ; aucune animation permanente pendant le suivi nocturne.
4. **Transitions de carte** : fait pour les cartes d'outils (`ToolCard`) et les accès directs des hubs ; reste : `DetailEnter` côté écran détail, cartes propres à chaque module de l'accueil.
5. **Morphs** : à faire — utiliser `MorphIcon` dans les en-têtes de module lors de la navigation entre modules, et icônes de module dédiées (`src/components/icons/**`, agent Iconographie). Le Dock n'en utilise pas (icônes Feather, pastille glissante).
6. **Gestes** : react-native-gesture-handler 3.3 est déclaré (v3) et utilisé par le panneau du bas ; prochains : tri à la main, glisser une ligne de tâche.
7. Une fois `Animated` absent de `src/`, retirer les helpers `Animated` de `theme/motion.ts` (garder les jetons).

## Non vérifié

Appareils réels iOS / Android, ProMotion 120 Hz, FPS mesurés (aucun profilage natif possible ici). Vérifié : export web et rendu image par image dans Chromium, Jest, TypeScript.
