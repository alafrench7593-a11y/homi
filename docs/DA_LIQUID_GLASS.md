# HOMI — Direction artistique « Liquid Glass » : verre minéral et mouvement (20/11/2026)

Branche `homi/da-liquid-glass`. Complète `HOMI_DESIGN_SYSTEM.md` (§ 10, verre et repli) et `MOTION_SYSTEM.md` ; ne
touche ni au paywall ni aux achats (`src/features/premium*`, `src/lib/purchases.ts`, `src/features/credits/*`,
onboarding de vente, `src/features/firstWin/*` : ils héritent seulement des composants partagés, API inchangées).

## 1. Audit de départ (captures AVANT, export web, 390 × 844 et 320 × 568, clair et sombre)

Méthode : skill `impeccable` (audit natif iOS + plancher de finition), skill `emil-animate-expo` (gestes, ressorts,
retours tactiles), captures de l'app réelle (`e2e/da_liquid_glass.py`).

| Constat | Où | Décision |
|---|---|---|
| Outils sans identité : pictogramme au trait nu sur un aplat pâle ; à 28 pt, un outil ne se distingue pas d'un autre | rangées, catalogue, recherche, en-têtes | **logos d'outils façon icône d'app** (§ 3) |
| Grille de cartes identiques « pictogramme + titre » (motif générique, cartes de verre posées sur la page) | « Pour ma grossesse », favoris, recherche, accueil | **mini-apps** : le logo posé sur la page, nom dessous, plus de carte (§ 4) |
| Gabarit « trois chiffres dans trois cartes » répété en tête de chaque outil | `TodaySummary` (≈ 60 écrans) | **une** surface de lecture opaque à filets, grille 3 ou 2 × 2, première valeur à la couleur de l'outil |
| Sélection de la barre d'onglets portée surtout par la graisse : pastille blanche sur verre blanc | `GlassTabBar` | **goutte liquide teintée** qui glisse et s'étire (§ 5) |
| Aura sans signature : bulle de discussion au trait, même langage qu'un outil ; attente = squelette gris | `/ask` | **lentille à trois lumières** qui réagit à l'ouverture et pendant la préparation (§ 6) |
| Icône d'app : symbole à plat sur ivoire, aucune matière | `assets/icon.png` | **icône verre minéral** claire / sombre / teintée (§ 2) |
| Entrée « Mes outils » : pastille générique | accueil | trois logos des outils de la personne |
| Doublon du symbole dans « À propos » (mot-symbole + logo complet) | Réglages | symbole de verre animé + mot seul |

## 2. Deux directions comparées, une retenue

Planche : `scripts/da/directions.cjs` (données fictives ; capture dans le dossier de travail) — mêmes éléments :
icône d'app (180/60/40), trois logos (sommeil, allaitement, croissance) en 64/40/28, accueil, barre, Aura.

| | A « Verre minéral » (retenue) | B « Verre clair » |
|---|---|---|
| Identité | plaque teintée par catégorie : 9 teintes + Aura + urgence, reconnaissable sans lire | plaques claires presque identiques ; seule la couleur du trait varie |
| Petite taille (28 pt) | glyphe blanc ≥ 3,2:1 garanti, silhouette nette | trait coloré fin sur blanc : se perd |
| Contraste en sombre | plaque plus profonde, arête discrète, lisible | plaque grise boueuse |
| Fluidité | la plaque est opaque : rien à recalculer pendant le défilement | translucide : flou à chaque rangée (coût) |

**Choix : A**, parce que le verre doit rester là où il sert (ce qui flotte : barre, recherche, feuilles, boutons) et
que les logos ont besoin d'être des objets solides. Le « verre » des logos est un éclairage (reflet, arête, ombre
interne), pas une transparence (principe repris de Solid Glass).

## 3. Logos d'outils (`src/brand/toolLogo/`)

| Fichier | Rôle |
|---|---|
| `geometry.ts` | grille 64 ; squircle (superellipse n = 5) ; zone du glyphe 36 (détaillé) / 38 (compact) ; reflet, arête |
| `families.ts` | identifiant → glyphe (manifeste `src/brand/icons/manifest.ts`), teinte, **famille d'animation** |
| `ToolLogo.tsx` | composant : 3 rendus, animations, pression, minuteur |
| `svg.ts` | même dessin en SVG statique (exports, planches, tests) |
| `src/theme/toolLogo.ts` | matière : teintes par catégorie, plaque claire / sombre / nuit, contraste RÉSOLU |
| `assets/brand/tool-logos/<id>.svg` | 134 sources éditables (un par outil du registre), `node scripts/da/brand-export.cjs` |

**Trois rendus** : `detailed` (≥ 48 pt : en-tête d'outil, raccourcis — halo de la teinte et rayonnement du glyphe depuis le § 3 bis), `compact`
(< 48 pt : listes, catalogue, recherche — trait plus franc), **animé** (`play`, `running`, `pressed`). Une seule
source : `ToolGlyph` (utilisé par toutes les rangées, tuiles, résultats, en-têtes `Screen`) rend `ToolLogo` → même
logo dans l'accueil, les favoris, la recherche, le catalogue et l'écran de l'outil.

**Familles** (jouées seulement lors d'une interaction réelle ; dans une liste, seule la tuile touchée s'anime) :

| Famille | Outils (exemples) | Déclencheur réel | Mouvement |
|---|---|---|---|
| `moon` | sommeil de l'enfant, mon sommeil, relais de nuit | ouverture du journal | le croissant se pose (−28° → 0, descente), deux étoiles |
| `ring` | tétée, minuteur biberon, tire-lait, contractions | **minuteur démarré** (`Screen toolRunning`, `/track/[kind]`) | anneau qui tourne tant que le minuteur tourne, s'arrête avec lui |
| `curve` | croissance, poids, graphiques | affichage des données (ouverture) | une courbe se trace (520 ms), pause, retour stable |
| `check` | tâches, routines, checklists | **tâche confirmée par le serveur** (`/family`, `Screen toolPlay`) | pastille + coche dessinée |
| `meal` | repas, aliments, courses, portions | **ajout confirmé** (`/meals/portions`) | rebond du glyphe (1,16) |
| `glint` | tous les autres | ouverture | soulèvement de 2 pt + reflet qui traverse |

Couverture (test `src/__tests__/toolLogos.test.tsx`, nombres réels) : **394 entrées distinctes, 394 avec logo
(100 %)** — 134 outils du registre, 26 sous-accès, 129 fonctions nommées `h200_<n>`, 198 numéros utilisables de la
liste des 200 (sur 200 ; 2 absents n'ont pas d'écran), 27 raccourcis de l'accueil, 9 catégories ; 189 glyphes
distincts ; familles : glint 265, meal 38, curve 33, check 23, moon 21, ring 14. Urgences : plaque rouge, jamais
animée.

## 3 bis. Logos d'outils — matière « verre sombre » (21/11/2026)

Évolution demandée par la propriétaire d'après sa référence (icône d'app de verre teinté profond), **en code**
(react-native-svg, aucune image générée). Inchangés : symbole HOMI, `HomiGlassMark`, icône de l'app (export lancé avec
`--logos-only`), `AuraMark` et le robot Aura. Même API, mêmes trois rendus, mêmes six familles d'animation.

| Couche | Rendu |
|---|---|
| Plaque | verre teinté PROFOND (dégradé vertical haut → milieu → bas à 50 % de noir), plus clair au centre-haut (cœur radial de la lumière du thème), reflet doux en diagonale depuis le coin haut-gauche, ombre interne en bas — opaque : sombre et lumineuse sur fond crème comme sur fond nuit |
| Liseré | contour intérieur fin (1,1 / 64), blanc teinté net en haut et à gauche, une lueur de la teinte en bas à droite |
| Halo | ombre colorée diffuse de la boîte (`logoShadow`), **rendu détaillé seulement** (en-têtes, raccourcis) ; compact (listes, recherche, catalogue dense) : ombre de contact seule ; nuit : aucun |
| Glyphe | pictogramme HOMI rendu PLEIN : aplat + trait en dégradé blanc → pâle de la teinte ; traits intérieurs à l'aplat (et points) à la couleur de la plaque = 1–2 détails ; trait 1,95 (détaillé) / 2,15 (compact) |
| Rayonnement | sans filtre de flou (coût mobile) : traits élargis superposés de la lumière du thème — 3 couches en détaillé, 1 en compact, 0 la nuit |
| Animations | anneau, courbe, étoiles : encre claire du glyphe ; coche : couleur de la plaque sur pastille claire ; reflet qui traverse : blanc teinté |

Palette (`src/theme/toolLogo.ts`, `LOGO_HUES` = verre, `LOGO_GLOWS` = lumière ; même verre en clair et en sombre ;
le milieu est RÉSOLU : assombri par pas de 4 % jusqu'à ≥ 4,5:1). Contraste = point le plus sombre du glyphe contre
point le plus clair de la plaque (haut + cœur lumineux + reflet) ; détail = couleur de la plaque sur le glyphe.

| Thème | Verre résolu | Lumière | Glyphe (haut → bas) | Glyphe/plaque | Détail/glyphe | Nuit (glyphe/plaque) |
|---|---|---|---|---|---|---|
| alimentation (`feeding`) | #842C1A corail profond | #FFA383 | #FFFBFA → #FFF0EB | 4,52:1 | 9,25:1 | 5,79:1 |
| sommeil (`sleep`) | #2D2E86 indigo nuit | #A6ABFF | #FBFCFF → #F1F2FF | 5,34:1 | 11,41:1 | 6,73:1 |
| soins / croissance (`care`) | #234B3A vert sauge profond | #9FE3BF | #FBFEFC → #F0FBF5 | 4,56:1 | 10,51:1 | 5,80:1 |
| santé (`health`) | #8A1E4C framboise | #FF94BD | #FFFBFC → #FFEEF4 | 4,62:1 | 9,20:1 | 6,33:1 |
| cycle (`cycle`) | #792373 rose profond (orchidée) | #F4A8FF | #FFFCFF → #FDF1FF | 4,57:1 | 9,62:1 | 6,33:1 |
| grossesse (`pregnancy`) | #52248A prune-violet | #CDA9FF | #FDFCFF → #F7F1FF | 5,08:1 | 10,80:1 | 6,69:1 |
| école (`school`) | #6B370C ambre brûlé | #FFC87A | #FFFDFA → #FFF6EA | 4,56:1 | 10,31:1 | 5,84:1 |
| couple (`couple`) | #741430 rubis | #FF8FA6 | #FFFBFB → #FFEDF1 | 5,42:1 | 11,06:1 | 6,84:1 |
| foyer / famille (`family`) | #0C4C55 bleu lagon | #7FE2E8 | #FAFEFE → #EBFAFB | 4,50:1 | 10,22:1 | 5,90:1 |
| communauté (`community`) | #1D4486 bleu ouvert | #93C2FF | #FBFDFF → #EEF5FF | 4,56:1 | 9,81:1 | 6,26:1 |
| compte (`account`) | #36404E ardoise | #C9D4E3 | #FDFDFE → #F6F8FB | 4,71:1 | 11,11:1 | 6,47:1 |
| Aura (`aura`) | #1B2B4C bleu de nuit | #F5C26B ambre | #FFFDF9 → #FDF5E7 | 5,97:1 | 13,88:1 | 7,21:1 |
| urgence (`urgent`) | #A1111E rouge d'urgence | #FF8A80 | #FFFAFA → #FFECEB | 4,59:1 | 8,26:1 | 6,28:1 |

Garde-fous (`src/__tests__/toolLogos.test.tsx`) : par teinte et par apparence (clair, sombre, nuit), glyphe ≥ 4,5:1 et
détails ≥ 3:1 ; verre profond (luminance < 0,1) identique en clair et en sombre ; halo seulement en détaillé, jamais la
nuit ; verres et lumières tous distincts. Rapport : `node scripts/da/contrast.cjs`. Planches :
`node scripts/da/brand-export.cjs <dossier> --logos-only --png` → `tool-logos.png` (134 logos, crème et nuit) et
`tool-themes.png` (une icône par thème en 120, 60 et 40 px, clair / sombre / nuit, contrastes mesurés).

## 4. Icône d'app, symbole, logo animé

- Source unique `src/brand/toolLogo/appIcon.ts` → `assets/brand/homi-app-icon-{light,dark,tinted}.svg` et
  `assets/icon-ios-{light,dark,tinted}.png` (1024, clair et sombre sans canal alpha) → `app.config.ts`
  `ios.icon: { light, dark, tinted }` (Android garde `icon` et l'icône adaptative existante).
- Composition : fond ivoire rosé (sombre : prune nuit), deux halos (corail, lilas), **lentille de verre** (voile,
  arête éclairée, ombre interne, reflet en croissant) qui « tient » le symbole de la propriétaire (deux personnes
  formant un M, tracé EXACT de `assets/brand/source-v5`, non redessiné, encre ou ivoire). Idée : la famille,
  accompagnée et protégée. Vérifiée dans le masque iOS aux tailles 1024/180/120/87/60/40, sur fonds clair, sombre,
  coloré, et en teinté (`scripts/da/brand-export.cjs` écrit la planche).
- `HomiGlassMark` (`src/components/HomiGlassMark.tsx`) : symbole dans sa tuile de verre, statique ou **signature
  animée** (≈ 1,1 s : la tuile se pose, le corps « M » monte, les têtes se posent, le reflet de la lentille s'allume
  puis se stabilise, état final = statique). Joué dans Réglages › À propos (moment de marque interne, ne retarde
  rien) et dans `/dev/icons`. Statique avec Réduire les animations / économie d'énergie.
- Le logo animé de lancement existant (`HomiLogoAnimated`, `LaunchIntro`) est inchangé.

## 5. Navigation, boutons, mouvement

- **Barre d'onglets** : `useLiquidIndicator` (`src/motion/Indicator.ts`) — la goutte glisse (ressort `panneau`)
  et s'étire dans le sens du trajet (`liquidIndicator` : ≤ 22 %, écrasement ≤ 8 %), teintée de l'accent (`glass.ts` :
  l'indicateur entre dans le calcul du voile, les encres restent garanties) ; sélection = goutte + graisse + petit
  saut du pictogramme + `aria-selected`. Changement d'écran d'onglet : pas de glissé (onglets = pairs).
- **Tuiles** (`ToolTile`) : compression 0,97 au contact, plaque qui s'enfonce (0,94, ressort `vif`), haptique léger,
  animation de famille à l'ouverture.
- **Boutons** (`GlassButton`, `Button`) : états normal / pressé / chargement / succès / erreur / désactivé déjà en
  place (succès seulement après la promesse) — conservés.
- Jetons ajoutés à `src/motion/curves.ts` : `logoMotion`, `liquidIndicator`, `auraMotion`. Règles worklets
  respectées (aucun paramètre par défaut lisant la fermeture, aucune fonction locale vers `scheduleOnRN`, aucune ref
  dans un worklet — test `workletDefaults`).

## 6. Aura

`AuraOrb` / `AuraThinkingDots` (`src/features/aura/AuraMark.tsx`) : lentille de verre bleu de nuit à trois
lumières (corail, ambre, lagon) autour d'un éclat blanc à quatre branches — d'abord violette, recolorée après le
scan App Designer (§ 10 : « dégradé violet = signe IA générique »). Ouverture : pose + quart de tour de l'éclat (une fois).
Préparation d'une réponse : rotation lente des lumières + respiration, trois points de lumière tour à tour (motif
« status glyph » de Solid Glass) ; s'arrête à l'arrivée de la réponse. L'en-tête d'Aura n'affiche plus de logo
d'outil (`tool={false}`) : une seule signature. Couleurs `AURA` (`src/theme/toolLogo.ts`).

## 7. Règles Liquid Glass (rappel appliqué)

Verre = ce qui flotte et permet d'agir (barre, recherche, filtres, sélecteurs, boutons flottants, feuilles, toasts).
Surfaces OPAQUES = lecture (formulaires, journaux, graphiques, santé, textes longs, résumé du jour). Les logos sont
opaques et éclairés. Repli : natif iOS 26 → flou → opaque (Réduire la transparence, nuit) — `useGlassTier`.

## 8. Références → décision visible

| Référence | Accès | Décision visible |
|---|---|---|
| Impeccable (skill `impeccable`, impeccable.style) | skill chargé ; lanceur `scripts/impeccable` absent → contexte lu à la main | audit : grille de cartes identiques, trio de cartes chiffrées, doublon du symbole → tuiles mini-apps, résumé à filets, À propos |
| Emil Kowalski (skills `emil-animate-expo`, `expo-animation`, aiforui.dev) | skill chargé, page lue | pression 0,97 au contact, ressorts interruptibles, pas de glissé entre onglets, une haptique par action, Réduire les animations = état final |
| Meng To (github.com/MengTo/skills) | README lu | « specs beat vibes » : grille 64, zones de glyphe et éclairage écrits comme une spec commune à 134 logos |
| Stageshow (github.com/benjitaylor/skills) | README lu (skill non installé) | démos filmées de l'app réelle (`e2e/da_liquid_glass.py`, enregistreur CDP + ffmpeg), hors runtime |
| Open Design (github.com/nexu-io/open-design) | README lu (outil non installé) | comparaison de deux prototypes sur données fictives (`scripts/da/directions.cjs`) |
| Solid Glass (github.com/deeplethe/solid-glass) | README lu | verre « solide » : arête claire, épaisseur, ombre douce sur plaques opaques ; trois points de lumière d'Aura |

## 10. Méthode « App Designer » (skill fourni par la propriétaire), appliquée à Expo

| Étape du skill | Appliquée ainsi | Décision visible |
|---|---|---|
| 0. Brief | brief de la propriétaire (refonte d'une app existante) ; section « Current app » = audit § 1 | — |
| Redesign : audit, keep / lose, décisions | captures AVANT réelles (export web) ; tout est gardé (données, droits, traductions, parcours) ; rien de supprimé | liste des décisions laissées à la propriétaire ci-dessous |
| 1. Pièges (`slop.md`) | lus ; tells trouvés dans l'app : grille de cartes identiques, trio de chiffres en cartes, dégradé violet (Aura), en-tête de salutation, « + » central | tuiles mini-apps, résumé à filets, Aura recolorée ; salutation et « + » listés comme décisions |
| 2. Directions par exploration | DEUX directions (demande de la propriétaire) sur les mêmes éléments, sol clair ET sombre, matières différentes (plaques opaques teintées / verre clair) ; pas de troisième : la marque (symbole encre, palettes, Manrope) est fixée par la propriétaire, une 3ᵉ typographie ou un 3ᵉ sol n'étaient pas des options honnêtes | A « verre minéral » retenue (§ 2) |
| Défaut de catégorie refusé | apps parentales : pastel crème + illustrations de bébés + cartes empilées | plaques de couleur franche par catégorie, logos-objets, une surface de lecture par outil |
| Richesse | matière et couleur (plaques de verre minéral, lentille de l'icône, halos) — pas de gris sur papier | logos sur tout l'accueil, le catalogue et les en-têtes |
| Signature | storyboard : (1) appui sur une tuile → la plaque s'enfonce (0,94, ressort vif, haptique léger) ; (2) ouverture → le logo joue sa famille (lune / anneau / courbe / coche / rebond / reflet) ; (3) action confirmée → le logo de l'en-tête rejoue (coche, rebond) ; Réduire les animations : état final immédiat | § 3, vidéo `4-outil.mp4` |
| 4. Écrans | écrans RÉELS de l'app (pas de maquette) : accueil, catalogue, outil, tâches, Aura, réglages, sombre, 320 pt | captures `apres/` |
| 5. Shoot, scan, critique | `shoot.mjs` adapté pour scanner l'app réelle (copie hors dépôt : `shoot-live.mjs`, scratchpad) sur 5 routes à 402 × 874 | voir résultats ci-dessous |
| 6. Itération | r1 → corrections : Aura sans violet, initiale d'avatar ≥ 11 pt ; (avant le scan, 2 tours de captures : goutte de sélection teintée, grille 2 × 2, doublon du symbole) | commit « Aura recolorée » |
| 7. Build / ship | NON exécuté (consigne) | — |

**Scan r1 (app réelle)** — FAIL réels corrigés : dégradé violet (Aura), texte < 11 pt (initiale d'avatar 10 px).
FAIL expliqués (faux positifs du scan sur une app RN-web) : « plus de deux familles » = Manrope chargée par graisse
(4 noms) + police d'icônes Feather ; « texte qui se chevauche / coupé » = contenu qui défile SOUS la barre de verre
et le pied d'action (voulu : défilement sous le verre), libellés coupés par le cadre 874 du scan ; contraste 3,85:1
sur « » = pictogramme 20 px (seuil graphique 3:1). Avertissements répondus : 10 tailles de texte (dette connue de
`typography`, non traitée ici), 4 teintes sur /family (statuts sémantiques : fait, en retard, à faire), éléments
dans la zone du témoin d'accueil (barre de verre, par conception).

**Scan r2 → r3** : r2 trouvait encore des dégradés violets sur l'accueil — l'origine était le dégradé des avatars à
initiale (corail → rose → LILAS) ; corrigé (deux teintes chaudes). r3 (accueil, Aura, catalogue) : **plus aucun
dégradé violet, plus de texte < 11 pt**. Restent des FAIL d'outillage (familles = graisses de Manrope + Feather ;
« texte coupé / hors écran » : le banc d'essai réduit `#root` à 306 px alors que l'app est mise en page à 402 — les
captures réelles à 320 et 390 pt ne débordent pas, `rapport.json` : 0 débordement) et deux constats de structure de
l'accueil non traités ici (cartes imbriquées × 3 : carte du rendez-vous et de la mission ; 7 teintes = avatars des
membres, statuts et logos) → décisions ci-dessous.

**Décisions laissées à la propriétaire** (changements de structure que le skill classe comme décisions) :
1. l'en-tête de salutation de l'accueil (« Douce nuit, Camille ») — tell n° 1 du skill : le remplacer par la date et
   la prochaine chose à faire ?
2. le bouton central « + » de la barre (tell « FAB centré ») : le garder (choix documenté du 17/11) ou le déplacer
   dans le contexte de chaque écran ?
3. Manrope comme unique famille (police par défaut selon le skill) : la garder (identité actuelle) ou choisir une
   display pour les grands titres ?
4. la réduction de l'échelle typographique à 6 tailles.

## 9. Non vérifiable ici

Vrai rendu Liquid Glass d'iOS 26 (`GlassView`), VoiceOver réel, haptique, « Réduire la transparence » système,
icône sur l'écran d'accueil iOS (masque réel, icône teintée appliquée par iOS), fluidité 120 Hz sur appareil.
Le web ne montre que le niveau « flou » du verre.
