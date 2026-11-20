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

**Trois rendus** : `detailed` (≥ 48 pt : en-tête d'outil, raccourcis — ombre du glyphe, ombre portée), `compact`
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

`AuraOrb` / `AuraThinkingDots` (`src/features/aura/AuraMark.tsx`) : lentille de verre à trois lumières (lilas,
corail, lagon) autour d'un éclat blanc à quatre branches. Ouverture : pose + quart de tour de l'éclat (une fois).
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

## 9. Non vérifiable ici

Vrai rendu Liquid Glass d'iOS 26 (`GlassView`), VoiceOver réel, haptique, « Réduire la transparence » système,
icône sur l'écran d'accueil iOS (masque réel, icône teintée appliquée par iOS), fluidité 120 Hz sur appareil.
Le web ne montre que le niveau « flou » du verre.
