# Audit 09 — UX, accessibilité et mouvement (13/11/2026)

Périmètre : composants partagés (`Screen`, `ui.tsx`, `controls/**`, `Overlays`/`Sheet`, `Dock`, `DemoBar`, `States`,
`motion/**`, `theme/**`) et ~30 écrans représentatifs. Seul le **web** (export Expo, Chromium) est exécutable ici.

Contrôle rejouable : `e2e/audit_ux.py` (+ détecteur `e2e/audit_ux_detect.js`), tests Jest
`src/__tests__/audit09Layout.test.tsx`. Règles du design system : `HOMI_DESIGN_SYSTEM.md` § 6 ter.

## 1. Méthode

### Détecteur de débordement (pourquoi les E2E des pilotes disaient « aucun débordement »)

Les pilotes mesuraient `document.scrollWidth`. Or tous les conteneurs de l'app (ScrollView, cartes arrondies,
en-tête) ont `overflow: hidden` : un texte qui dépasse est **rogné**, la page ne s'élargit jamais. Le détecteur
compare, pour chaque texte VISIBLE de l'écran actif :

1. sa boîte au **viewport** (texte hors écran à gauche / à droite) ;
2. sa boîte à **chaque ancêtre qui rogne** (overflow hidden/clip ; axe vertical ignoré au-delà d'une zone qui
   défile, axe horizontal ignoré dans un carrousel qui défile) → `texte_rogne` ;
3. sa propre boîte (`scrollWidth > clientWidth`, mot plus large que la ligne) ;
4. les troncatures `…` / line-clamp non déclarées volontaires (`intentionalTruncation` → `data-truncate`) ;
5. les **mots coupés** (rectangles d'un même mot sur deux lignes ; la césure typographique `hyphens:auto` est admise
   dans le texte courant, jamais dans un titre, un onglet, un choix ou le bouton principal) ;
6. libellé hors de son bouton, bouton hors écran, bouton principal sur 2 lignes, cible tactile < 24 px (bloquant,
   WCAG 2.5.8) / < 44 px (signalé) ;
7. au clavier : champ focalisé visible et non recouvert (test de point), zone qui défile ≥ 96 px.

Les textes d'un autre écran de la pile (recouverts) sont ignorés.

### Simulation fidèle du texte agrandi

React Native multiplie la taille ET l'interligne de chaque texte par `min(fontScale, maxFontSizeMultiplier)` ;
react-native-web ignore ce plafond. Simulation retenue (documentée dans le détecteur) :
- `Text` (ui.tsx) et les commandes partagées publient leur plafond (`data-fsmax`) sur le web ;
- `__homiTextScale(1.3)` agrandit chaque texte de `min(1,3, plafond le plus proche)` (texte imbriqué qui hérite :
  non agrandi deux fois ; champs agrandis aussi), réappliqué après chaque rendu ;
- la police racine du navigateur est fixée à 16 × 1,3 px : l'application la lit (`useFontScale`, comme `fontScale`
  sur téléphone) pour ses choix de mise en page (titre, orbes, sélecteur).
L'ancienne simulation des pilotes (×1,3 partout, sans plafond, sans que l'app le sache) surestimait les titres et ne
déclenchait aucune adaptation.

### Clavier simulé

Fenêtre réduite de 568 à 308 px (clavier iPhone SE + suggestions = 260 px) APRÈS le focus du premier champ, comme
un navigateur mobile ; `useKeyboardVisible()` le reconnaît désormais sur le web (zone visible réduite ≥ 120 px
pendant une saisie).

### Configurations (×33 écrans)

clair Turquoise texte 1 · clair Turquoise 1,3 · sombre Crépuscule 1,3 · clavier sombre Turquoise 1 ·
clavier clair Crépuscule 1,3 ; 320 × 568, deviceScaleFactor 2. Écrans : 5 onglets (`/`, `/health`, `/baby`,
`/household`, `/community`), missions (liste, nouvelle), stocks (liste, nouveau), courses, humeur (entrée, choix
fait), journal, scanner (accueil, assistant, produit inconnu, historique), biberon (accueil, historique), réglages
(accueil, apparence, compte, notifications), onboarding, aujourd'hui, notifications, agenda, moi, famille, et
publics : `/welcome`, `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot`.

## 2. Résultats chiffrés

| | Avant (base 6827ebe) | Après |
|---|---|---|
| Écrans en défaut (constats bloquants) | 20 / 33 | voir § 5 (fin de rapport) |
| Constats bloquants | 91 | voir § 5 |

Captures (deviceScaleFactor 2, regardées) : avant `/tmp/audit9/before-full/`, `/tmp/homi-p1/shots/zoom13-*`,
`/tmp/homi-p3/shots/05-preciser-clavier.png` ; après `/tmp/audit9/shots/` et `/tmp/audit9/apres/`.

## 3. Constats et corrections (composants partagés)

Format : **écran — étapes** · attendu · observé · cause · correction · test.

### Critiques (contenu inaccessible)

**C1. En-tête qui mange l'écran au clavier** — `/me/mood` (choisir une humeur, toucher « Mon journal »),
`/scanner/product` (« Préciser »), `/family/missions/new`, `/family/stocks/new`, 320 × 568 clavier ouvert.
Attendu : le champ actif visible au-dessus du clavier. Observé : le champ entièrement caché (« visible : −109 px »),
seul l'en-tête géant (glyphe + titre 3 lignes + sous-titre) reste (`05-preciser-clavier.png`).
Cause : l'en-tête de `Screen` était fixe, haut de ~260 px à 320 px, jamais replié ; `useKeyboardVisible` valait
toujours `false` sur le web ; les listes (`VirtualList`) n'avaient aucune portée clavier, le champ n'était donc
jamais ramené en vue. Correction : écran qui défile → grand titre DANS le contenu (titre large iOS) + titre compact
dans l'en-tête ; écran `scroll={false}` → grand titre fixe qui se replie au clavier / sous 520 px / au défilement
(hystérésis) ; `useKeyboardVisible` web ; `VirtualList` = zone qui défile inscrite (champ ramené en vue, en-tête
replié, `useScreenScroll`) ; réapparition du champ à l'ouverture du clavier web. Tests : `headerMode`,
`nextInnerScrolled`, `webKeyboardOpen` (Jest) ; `champ_masque` / `zone_saisie_etroite` (E2E).

**C2. Barre d'onglets par-dessus le champ actif** — `/` (assistant IA), toutes les pages à onglets, clavier ouvert.
Observé : le `Dock` recouvrait le champ. Cause : barre jamais masquée. Correction : `Dock` hors mise en page quand
le clavier est ouvert (`display: none`, reste monté). Test : E2E `champ_masque`.

**C3. Bouton « Envoyer » de l'assistant hors de l'écran** — `/` à 320 px. Observé : bouton à x = 310–358.
Cause : un `<input>` web garde sa largeur intrinsèque (~20 caractères) malgré `flex: 1`. Correction : règle web
globale `input,textarea{min-width:0}` (WebInteractionStyles). Test : Jest (règle CSS) + E2E `bouton_hors_ecran`.

**C4. Paywall : « Enfant » hors de l'écran** — tout écran Premium sans abonnement, 320 px. Cause : frise des étapes
en 5 colonnes fixes de 62 px (310 px pour 272 disponibles). Correction : colonnes souples (`flex: 1`,
`src/features/Paywall.tsx`). Test : E2E `texte_hors_ecran`.

### Majeurs (texte coupé / illisible)

**M1. Libellés d'humeur coupés « Très diffi-… », « Diffici/le »** — `/me/mood`, `/me/diary`, texte 1,3.
Cause : `ChoiceGroup` orbes = 5 colonnes égales (51 px) + `numberOfLines={2}`. Correction : libellé entier (3 lignes,
sans césure) ; si un mot ne tient pas, rangées équilibrées 3 + 2 (`orbLayout`, chasse des polices mesurée).
Tests : `orbLayout` (Jest), `texte_tronque` / `mot_coupe` (E2E).

**M2. Titres géants sur 3-4 lignes, glyphe trop large** — tous les écrans d'outil à 320 px / 1,3. Correction :
`fitTitleSize` (32 → 28 → 24 → 21, ≤ 2 lignes, aucun mot coupé), glyphe 40 px sous 360 px ou > 1,15, pas de césure.
Test : `fitTitleSize` (Jest).

**M3. Bouton principal sur 2 lignes « Enregistrer : Plu-tôt bien »** — `/me/mood`, `/scanner`, `/bottle`,
`/calendar`, texte 1,3. Correction : `Button` pleine largeur ou `lg` : sans icône + marges réduites, puis
`shortLabel`, puis −2 px ; jamais de césure dans un libellé de bouton ; plafond `typography.button.maxScale` (1,4)
enfin appliqué ; `Screen.action.shortLabel` ; humeur : `shortLabel = « Enregistrer »`. Test : `nextLabelStep` (Jest),
`bouton_principal_2_lignes` (E2E).

**M4. Sélecteur à segments coupé** — libellés longs (langues, texte agrandi). Correction : `pills` bascule
d'elle-même en **cartes** (`variant="cards"`, aussi publique, avec `description`) quand un libellé ne tient pas en
2 lignes (`pillsFit`). Tests : Jest (logique + rendu).

**M5. Pastille « Démo · Camille · voir comme Sam » hors de l'écran** — missions, stocks. Cause : `alignSelf:
flex-start` sans `maxWidth`. Correction : `maxWidth: '100%'` + passage à la ligne (`DemoPerson.tsx`).

**M6. Graphiques (signalés par l'audit 06)** — `LineChart` affichait « 62.7 » ; `BarChart` tronqué à 7 barres,
« 30 jours » sans effet (onglet Suivi). Correction : `chartNumber` (format de la langue, axes, valeurs et lecteur
d'écran) ; décision : **30 barres quotidiennes** (pas d'agrégation par semaine, pour que « 30 jours » montre chaque
jour) avec barres fines, numéro du jour une barre sur 5 + la dernière, valeurs sur la dernière et la plus haute,
toutes les valeurs lues ; `track.tsx` suit la période et l'affiche sous chaque titre. Tests : `chartNumber`,
`barChartLayout` (Jest).

### Mineurs

- **m1. Double anneau de focus dans les champs** (rectangle noir décalé dans le cadre arrondi, journal) : un seul
  anneau (halo de `Field`), anneau du thème pour les autres champs.
- **m2. Bouton principal désactivé trop lumineux en sombre** : verre neutre + texte secondaire (opacité 0,8).
- **m3. Contraste** : initiale d'avatar blanche sur nacre **1,6:1** → encre sombre (`UserAvatar`) ; libellé blanc du
  bouton principal en clair 4,0–4,3:1 sous le reflet de verre → reflet réduit et cantonné au haut du bouton.
- **m4. « Lire la suite » des bandeaux : cible 90 × 26 px** → 44 px de haut ; aperçu replié déclaré volontaire.
- **m5. « Quitter » de la pastille démo : 28 px de haut sur le web** (hitSlop ignoré) → zone de 44 px, pilule visible
  inchangée.
- **m6. Interrupteurs « ajouter aux raccourcis » (ToolCard) sans `aria-checked`** → annoncés cochés / non cochés.
- **m7. Bouton Fermer des feuilles** : `testID="sheet-close"` (tests).

### Demandes des pilotes remontées au design system

`Reveal` (`@/motion`), `ConfirmationCard` (`saved` / `offline` / `error` + « Réessayer »), `useScreenScroll()`
(`scrollToTop`, `scrollToNode`, `ensureVisible`), `ChoiceGroup` qui passe à la ligne + `variant="cards"`,
`DataTile.contextLines` (défaut 3, +1 texte agrandi), `Screen.action` (promesse, `loading`, `shortLabel`),
`PrimaryButton` désactivé en sombre. Le pilote Humeur a son propre `Reveal` (`MoodJournalUI.tsx`) : à remplacer par
celui de `@/motion` (non fait : écran pilote stable).

## 4. Hors de ma zone — à corriger par les propriétaires (constats rejoués)

| Gravité | Écran | Constat | Piste |
|---|---|---|---|
| **Critique** | toute adresse profonde (`/me/mood`, `/settings`, …) rechargée en démo | renvoie à `/welcome` (l'Accueil `/` rechargé garde la session) ; casse les liens profonds et TOUTES les suites E2E qui font `goto` | probablement `9ea0ccc` (auth : session appliquée après `useIsRestoring`) — **agent auth** |
| Majeur | hubs `/health`, `/baby`, `/household` à 1,3 | « Rechercher un outil », « Ma grossesse » tronqués sans accès au texte complet | **agent navigation** : `numberOfLines` + `intentionalTruncation`, ou passage à la ligne |
| Majeur | `/`, `/family`, `/community` clavier + 1,3 | champ de l'assistant, « Ajout rapide », « Rechercher » hors de la zone visible (écrans à défilement propre, sans `useKeyboardScopeFor` / `useRevealOnFocus`) | **agent navigation** : brancher la portée clavier |
| Majeur | `/onboarding`, `/settings/account` clavier + 1,3 | champ visible sur 2–34 px seulement | **agent auth / onboarding** : `Screen` ou portée clavier |
| Majeur | `/scanner/product` (produit inconnu) | « Revenir à l'étape 1 » : cible 65 × 20 px ; « Continuer avec ce nom » encore sur 2 lignes si l'adaptation ne suffit pas | **pilote Scanner** : `minHeight: 44` sur `StepProgress`, `shortLabel` (« Continuer ») |
| Mineur | `/family` clavier | tâches tronquées « Donner le bain… » | **agent navigation** |
| Mineur | onglets du `Dock` à 1,3 | onglets de 35–40 px de large (≥ 24 px, < 44 px) | `Dock` / `hubMap` : libellés plus courts ou icônes seules sous 360 px |
| Mineur | `ToolCard` | libellé d'interrupteur en dur en français (« ajouter aux raccourcis ») | i18n (non détecté par `i18n-scan`) |
| Info | ordre du focus (Tab) | `/me/mood`, `/settings/appearance` : 1–3 retours en arrière (grilles 2 colonnes, tuiles de semaine) | à revoir écran par écran |

## 5. Résultats finaux

Voir la fin de ce fichier (complétée après la dernière exécution).

## 6. Limites

- Natif non exécuté : `fontScale` réel, `adjustsFontSizeToFit`, clavier iOS/Android (événements `Keyboard`),
  `KeyboardAvoidingView`, geste du `Sheet` au doigt, Liquid Glass, ProMotion.
- Aucun lecteur d'écran réel (VoiceOver, TalkBack) : rôles et noms vérifiés dans le DOM uniquement.
- Contraste mesuré sur captures web (fond réel sous le texte, glyphes masqués) : le flou natif peut différer.
- La largeur des mots est estimée (table de chasse mesurée, +4 %) : une langue à mots très longs peut encore
  passer à la ligne plus tôt que prévu (jamais couper un mot).
