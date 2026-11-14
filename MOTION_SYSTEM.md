# HOMI — Système de mouvement

Nouveau code : **Reanimated 4.7.1** (`react-native-worklets` 0.13.0), primitives dans `src/motion/**`.
Jetons partagés avec l'API `Animated` historique : `src/theme/motion.ts`.

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
| `LaunchIntro` (`src/components`) | lancement maison → silhouettes → accueil | voir ci-dessous |
| `PressSheen` / `usePressSheen` (v2) | reflet bref qui glisse sur un bouton capsule à la pression (bouton principal, bouton d'action de la barre) | bande de lumière inclinée −18°, une traversée de 320 ms `decelerate` (v3), opacité en sinus (0 au repos et à la fin) ; `off` et `minimal` : rien n'est rendu |
| `GlowCard` (v2, `src/components`) | carte sélectionnée / action importante / validation | activation : halo 0 → 1 en ressort `doux` + échelle 0,97 → 1 ; filet en fondu 240 ms `standard` ; faisceau unique 720 ms `decelerate`. Repos : statique. `still` (listes) : aucun mouvement. `minimal` : fondu court, ni halo ni faisceau |
| `CompletionCheck` + `CompletionGlow` (v2) | passage d'une tâche à « terminé » | disque 0,6 → 1 en `rebondLeger`, coche tracée 240 ms (`strokeDashoffset`, 80 ms après), anneau 520 ms, haptique « succès » ; halo de ligne 180 ms + 720 ms ; décocher : fondu 200 ms. `off` : état final immédiat ; `minimal` : fondus seuls |
| `Reveal` (audit 09) | section qui apparaît après un choix (divulgation progressive) | entrée : fondu + 12 px, 240 ms `decelerate` ; sortie : 160 ms `accelerate` puis démontage ; `pointerEvents="none"` pendant la sortie (aucun fantôme) ; `scrollIntoView` : défile si la section est sous le pli (`useScreenScroll().ensureVisible`) ; `off` : immédiat |
| `Screen` — en-tête (audit 09) | titre compact qui apparaît / grand titre fixe qui se replie | 160 ms (compact) / 200 ms (repli en hauteur), `timeTo` : immédiat avec « Réduire les animations » |
| `Sheet` (v2, `components/Overlays.tsx`) | panneau du bas | ouverture : ressort `doux` (interruptible, repart de la position courante) ; fermeture : 240 ms `accelerate`, démontage via `scheduleOnRN` |

### Introduction de lancement (`src/components/LaunchIntro.tsx`)

Une horloge partagée (0 → 2 280 ms, linéaire), chaque pièce applique sa courbe à son étape :
tracé du contour 120–820 ms (`reveal`) · illumination (remplissage + lueur) 600–1 000 ms · halo bref 600–1 800 ms · parent, parent, enfant, enfant à 900 / 1 000 / 1 100 / 1 200 ms (360 ms chacun : fondu, +10 unités, 0,9 → 1 autour des pieds) · pose 240 ms · fondu du calque 1 800–2 280 ms avec avancée 1 → 1,06.
Image finale = `BrandLogo` (mêmes tracés, mêmes dégradés). Tracés séparés générés par `scripts/homi/brand.mjs` → `src/brand/homiMarkSvg.ts` (`HOMI_HOUSE_PATH`, `HOMI_HOUSE_LENGTH`, `HOMI_FAMILY`, `HOMI_COLORS`) ; dessin inchangé (SVG et PNG régénérés identiques).
Règles conservées : une fois par lancement à froid ; absente à la première ouverture (l'introduction HOMI de `/cinematic` — `src/features/entry/HomiIntro.tsx`, même chorégraphie suivie du nom, ≈ 2,2 s, sans vidéo — joue déjà ce rôle) ; `off` → aucune intro, calque retiré à durée 0 ; `minimal` (nuit) ou lancement déjà lent (> 2 s) → version abrégée (logo complet, 260 ms de pose, 320 ms de fondu). Calque `pointerEvents="none"`, masqué aux lecteurs d'écran ; l'accueil se charge dessous.

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
