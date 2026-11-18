# HOMI — Design system v6 : cinq palettes + Adaptatif (17/11/2026), sur la base v5 « Lumière corail »

Décision de la propriétaire : **refonte du système visuel** (pas un simple changement de couleurs). HOMI ressemblait
trop à « Au Fil de Nous » : beige, terracotta, paysages en fond, boutons capsules à dégradé marron, cartes empilées
partout. La v5 remplace la v4 « Lumière minérale » (palettes au choix, scènes d'espace, verre, lentille).

Direction (transposée d'une référence, rien n'est copié) : lumière corail et rose chaud, touches de lilas, grands
espaces, profondeur par PLANS et par LUMIÈRE, une illustration forte en haut, titre aéré, action principale évidente.

| Fichier | Rôle |
|---|---|
| `src/theme/tokens.ts` | **`PALETTE_SPECS`** (5 palettes), `themeFor`, `ADAPTIVE_PALETTE`, `resolvePalette`, `IDENTITY`, `NEUTRALS`, `buildTheme` (clair / sombre / nuit), `typography`, `radius`, ombres très légères, `migratePalette` |
| `src/theme/AdaptiveProfileSync.tsx` | mode Adaptatif : profil affiché → `adaptiveProfile` |
| `src/theme/ThemeProvider.tsx` | apparence Système / Clair / Sombre (+ nuit interne), `resolveThemeName`, préférences par compte |
| `src/components/CoralHalo.tsx` | **halo corail** (seule lumière décorative) |
| `src/components/ui.tsx` | `Button` (+ `buttonColors`), `ListGroup` / `ListRow`, `Card`, `Chip`, `Toggle`, `Field`, `Banner`… |
| `src/components/Dock.tsx` | barre d'onglets pleine largeur + action rapide centrale |
| `src/components/DemoBar.tsx` | pastille « Démo » compacte + « Quitter la démo » |
| `src/app/settings/appearance.tsx` | apparence, palettes avec aperçu réel, Adaptatif, « Rétablir par défaut » + vitrine des composants (vérification visuelle) |
| Tests | `contrast.test.ts` (5 palettes, verrou de la palette par défaut), `hardcodedColors.test.ts` (garde-fou), `designSystem.test.ts`, `homiV2.test.tsx` (préférences, migration), `homiV3.test.tsx` (halo, mouvement), `interface.test.tsx` (bouton), `homiNavigation.test.ts` (barre) |

## 1. Thèmes : cinq palettes + Adaptatif (v6, 17/11/2026)

> Remplace « une seule identité » (v5). L'identité v5 « Lumière corail » **n'a pas changé** : c'est la palette par
> défaut, « Rose poudré et pêche ». Les sections 2 à 9 décrivent toujours cette palette par défaut ; les quatre autres
> suivent exactement la même structure de jetons.

| Réglage (Réglages → Apparence et couleurs) | Valeurs | Défaut |
|---|---|---|
| Apparence | Système, Clair, Sombre | Système |
| Palette | 5 palettes, ou **Adaptatif** | Rose poudré et pêche |

Chaque choix montre un **aperçu réel** (pastilles + mini-carte et mini-bouton dessinés avec les jetons de la palette,
dans l'apparence en cours). Application immédiate ; fondu sobre (voile du fond 400 ms, contenu 0,55 → 1 en 220 ms),
**immédiat avec Réduire les animations**. « Rétablir par défaut » = Système + Rose poudré et pêche. Préférence par
compte. `migratePalette` : toute ancienne préférence (v3, v4, Auto, inconnue) devient la palette par défaut — **les
utilisateurs existants ne voient aucun changement** ; un choix v6 est conservé.

### Architecture (une seule source : `src/theme/tokens.ts`)

`PALETTE_SPECS[palette]` → `{ decor, wash, light, dark, night }` → `buildTheme(apparence, palette)` → `useTheme()`.
**Aucun composant ne connaît le nom d'une palette** (testé : `hardcodedColors.test.ts`) : seuls `src/theme`, le store
et l'écran d'apparence manipulent `PaletteName`. Les **neutres sont paramétrés par palette** (fond, surfaces, creux,
traits, texte : tous légèrement teintés). La nuit (écran /night) est dérivée du sombre de la palette, très tamisée.

Jetons (`theme.tokens`) : `surface` (fond, carte, élevée, creux, `thumb`, `veil`) · `text` (`primary`, `secondary`,
`onAccent`, `onDecor`) · `accent` (encre lisible en clair, lueur en sombre ; `lilac` = accent rare) · `action`
(`fill`, `text`, **`pressed`**, **`disabledFill`**, `disabledText`) · `onHero` · `inverse` (scène sombre posée sur la
page : carte nuit, pastille hors connexion) · `border` · `halo` · `status` + `statusSoft` (succès, attention, alerte,
info, harmonisés) · `decor` (teintes pures `a`/`b`/`c`, `ring`, `wash` : **décor uniquement**) · `chart` (6 séries) ·
`focus` · `shadowColor`. Les rôles historiques `theme.colors.*` et `theme.material.*` en sont des alias.

### Les cinq palettes (clair · sombre)

| Palette (`id`) | Fond | Carte | Texte / secondaire | Accent lisible (a, b) | Accent rare | Action | Décor (a, b, c) |
|---|---|---|---|---|---|---|---|
| **Rose poudré et pêche** (`homi`, défaut) | `#FBF4F2` · `#1A1217` | `#FFFFFF` · `#241A20` | `#2A1621`/`#6E5562` · `#F6ECEF`/`#C2AFB8` | `#B5452F`, `#A8365F` · `#FFA08A`, `#F4A3C0` | `#6A4FB8` · `#C9B6FF` | `#3B1D2C` · `#FFA08A` | `#F2826F` `#EC7E9C` `#B9A6F2` |
| **Lavande et violet profond** (`lavande`) | `#F7F4FB` · `#15121D` | `#FFFFFF` · `#1E1A29` | `#1F1730`/`#5F5672` · `#EFEBF8`/`#B9B1C9` | `#6A45B8`, `#96397F` · `#BDA7FF`, `#E5A9EE` | `#3F58A8` · `#A9BEFF` | `#2E1F52` · `#BDA7FF` | `#A48BEA` `#CF93D9` `#93A9F0` |
| **Bleu nuit et cyan doux** (`nuit`) | `#F2F6FA` · `#0F1622` | `#FFFFFF` · `#17202E` | `#0F1F33`/`#4C5B70` · `#E9F0F8`/`#AAB7C8` | `#0E6A80`, `#2D50A6` · `#8ADCE8`, `#A6C0FF` | `#6A4FB8` · `#C9B6FF` | `#14294A` · `#8ADCE8` | `#62C6D8` `#7394E4` `#A9B8F5` |
| **Sauge et vert minéral** (`sauge`) | `#F4F6F1` · `#111713` | `#FFFFFF` · `#1A221D` | `#17241D`/`#54625A` · `#EAF1EC`/`#AFBCB2` | `#3C6A50`, `#256868` · `#A9D6B6`, `#94D4CC` | `#8A5638` · `#E8D0A2` | `#1F3A2D` · `#A9D6B6` | `#A3BFA6` `#84BAB3` `#DCCAA4` |
| **Champagne et beige chaleureux** (`champagne`) | `#F9F5EE` · `#181410` | `#FFFFFF` · `#221C16` | `#2A2118`/`#695C4D` · `#F6EFE6`/`#C5B8A7` | `#7E5F19`, `#8A5140` · `#EBCB8E`, `#EFBBA4` | `#765374` · `#DCC0DF` | `#3A2A1C` · `#EBCB8E` | `#E4C892` `#EBBDA4` `#D3C0AC` |

Statuts harmonisés par palette (succès · attention · **alerte** · info, clair) : `homi` `#1B6B3A` `#8A4B00` `#B3111B`
`#1D5AA6` ; `lavande` `#1C6846` `#85490A` `#B01030` `#2456A4` ; `nuit` `#156A4A` `#874A04` `#B3111B` `#1D5AA6` ;
`sauge` `#1B6B3A` `#8A4B00` `#B3111B` `#22599E` ; `champagne` `#2A6A32` `#9A4700` `#B3111B` `#2A5A9C`. En sombre :
versions lumineuses (voir `tokens.ts`). Le rouge d'alerte reste distinct des accents de chaque palette (écart de
teinte testé). Graphiques (`tokens.chart`) : accent a, accent b, accent rare, info, succès, or — 6 couleurs distinctes.

### Mode Adaptatif

**Choix : la palette suit le profil affiché (et non le moment de la journée)**, parce que le profil est déjà un état
synchrone et fiable du store (`subject`, résolu par `useActiveSubject`, la source de `useScope()`), alors qu'une
palette qui change avec l'heure modifierait l'interface sans aucun geste de l'utilisatrice. Correspondance **fixe**
(`ADAPTIVE_PALETTE`, testée) :

| Profil affiché | Palette |
|---|---|
| Moi | Rose poudré et pêche |
| Grossesse | Lavande et violet profond |
| Enfant | Sauge et vert minéral |
| Post-partum | Champagne et beige chaleureux |
| Famille | Bleu nuit et cyan doux |

`AdaptiveProfileSync` (monté dans `src/app/_layout.tsx`) recopie le type du profil résolu dans `adaptiveProfile` ; le
fournisseur de thème reste pur (`resolvePalette(choix, profil)`). Sans session : « Moi ». Avec une palette fixe, le
profil est ignoré.

### Contraste (WCAG 2.1 AA, `src/__tests__/contrast.test.ts` — 5 palettes × clair, sombre, nuit)

- **≥ 4,5:1** : texte, texte secondaire, lien, accent rare et les 4 statuts sur le fond et CHAQUE surface (carte,
  élevée, creux, teintes, indicateur de sélection, pastille d'icône, tuiles teintées, fonds doux de statut) ; texte
  posé sur un accent ; libellé de chaque variante de bouton, au repos **et pendant l'appui** ; bandeaux ; texte sur
  les fonds pâles (`decor.wash`).
- **≥ 3:1** : pictogrammes (or, cœur), anneau de focus, séries de graphiques.
- Les seuils ne se baissent pas : on ajuste les teintes.

### Couleurs en dur (`src/__tests__/hardcodedColors.test.ts`)

Garde-fou : le nombre de couleurs d'interface écrites en dur (hex et `rgba(`), hors `src/theme`, ne peut plus
remonter. Liste blanche explicite pour les illustrations, le logo et les couleurs sémantiques d'un contenu (aliments,
catégories de suivi, données de cycle codifiées, cartes, PDF). État : 324 hex + 211 rgba (80 fichiers) avant la v6 →
**229 hex + 129 rgba (63 fichiers)** ; liste blanche : 642 hex, 25 rgba, 25 fichiers. Restent surtout
`features/cycle3/ui.tsx` (calendrier du cycle), `features/cocoon/Cocoon.tsx` (scène illustrée de l'accueil enfant) et
les écrans de sommeil. La palette du cycle (`useCyclePalette`) est désormais dérivée du thème.

Vérification visuelle : `e2e/apparence_v6.py` (sélecteur, persistance, migration, Adaptatif, Réduire les animations,
captures de l'accueil dans chaque palette, clair et sombre, 390 × 844).

## 2. Couleurs de la palette par défaut (verrouillées par `contrast.test.ts`)

Identité (`IDENTITY`) — teintes pures = **décor uniquement** (halo, illustrations, pastilles), jamais un texte :

| Ton | Décor | Encre (clair, texte) | Lueur (sombre, texte) |
|---|---|---|---|
| Corail (accent principal) | `#F2826F` | `#B5452F` | `#FFA08A` |
| Rose chaud | `#EC7E9C` | `#A8365F` | `#F4A3C0` |
| Lilas (accent secondaire **rare**) | `#B9A6F2` | `#6A4FB8` | `#C9B6FF` |
| Prune (encre, action) | — | texte `#2A1621`, action `#3B1D2C` | — |

| Rôle | Clair | Sombre | Nuit |
|---|---|---|---|
| Fond (uni) | ivoire rosé `#FBF4F2` | prune-anthracite `#1A1217` | `#0E0A0C` |
| Surface (carte) | `#FFFFFF` | `#241A20` | `#17111A` |
| Surface élevée / creux | `#FFFFFF` / `#F6EBE8` | `#2E2229` / `#140E12` | `#1E171B` |
| Séparateur / liseré | `rgba(84,40,60,.08)` / `.10` | `rgba(255,220,232,.08)` / `.10` | `#2A2126` |
| Texte / secondaire | `#2A1621` / `#6E5562` | `#F6ECEF` / `#C2AFB8` | `#D9CDD2` / `#A0939A` |
| Lien, accent (`primary`) | corail `#B5452F` | corail `#FFA08A` | atténué |
| **Action principale** (`tokens.action`) | prune `#3B1D2C` + texte blanc | corail `#FFA08A` + texte prune | atténuée |
| Sur le halo (`tokens.onHero`) | blanc opaque + texte prune | `#F6ECEF` + texte prune | — |
| Succès · attention · **alerte** · info | `#1B6B3A` · `#8A4B00` · **`#B3111B`** · `#1D5AA6` | `#8BE0A6` · `#F7C770` · **`#FF6B6B`** · `#9CC4FF` | `#94C29E` · `#D9B577` · `#F08C8C` · `#9EB6D8` |

- **Rouge d'alerte santé distinct du corail** : rouge franc (≈ 357°) contre corail (≈ 12°) et rose (≈ 337°) — écart de
  teinte testé ; jamais la couleur de l'action principale ; toujours **icône + libellé** (`BANNER_ICON`, testé). Les
  urgences gardent leur priorité visuelle.
- **Contraste** (testé) : texte, secondaire, lien, lilas et 4 statuts ≥ 4,5:1 sur le fond et CHAQUE surface (carte,
  élevée, creux, teintes, indicateur de sélection, tuiles teintées) en clair, sombre et nuit ; libellé de CHAQUE
  variante de bouton ≥ 4,5:1 sur son aplat (posé sur le fond et sur une carte) ; bandeaux lisibles.

### Halo corail (`tokens.halo`, `CoralHalo`)

Dégradé radial **localisé** : cœur corail → rose chaud → bord lilas, éteint avant le bord du cadre, avec un foyer
décalé (volume sculpté). Intensité 0,55 (clair), 0,32 (sombre), 0 (nuit). **Réservé à l'accueil, à l'entrée et à
l'onboarding, derrière l'illustration** — jamais derrière un contenu à lire, jamais sur un écran de suivi.
Respiration très lente (7 s aller-retour, échelle 1 → 1,04, opacité 0,9 → 1, Reanimated sur le fil UI), **figée** avec
Réduire les animations, en économie d'énergie et la nuit. Le bouton posé dessus est `variant="onHero"`.

```tsx
<View style={{ alignItems: 'center', justifyContent: 'center' }}>
  <CoralHalo size={280} style={{ position: 'absolute' }} />
  <Image source={require('@/../assets/illustrations/famille.webp')} … />
</View>
```

## 3. Fond, surfaces, ombres

- **Fond UNI partout** (`colors.gradient` = trois fois le fond, testé). Supprimés : `SpaceScene` / `DesertScene`
  (paysages, maison, collines, mesas, monolithes), ambiances par espace (`theme/ambiance.ts`), `PowderSky`, `Aurora`,
  `StarField`, `ChildBackdrop`, ciel du jour (`daySky`), lueur derrière les titres de `Screen`.
- **Profondeur par plans** : fond → surface (carte) → surface élevée (feuille du bas, menus). Les anciens noms de
  matières (`optical`, `frosted`, `matte`, `GlassSurface`, `LiquidGlass`) restent pour compatibilité mais sont des
  surfaces **opaques**, sans flou, sans reflet, sans ombre colorée (testé).
- **Ombres très légères** (encre prune, jamais noire) : `physicalShadow` low ≤ 0,035 / mid ≤ 0,05 / high ≤ 0,08 en
  clair ; contenu sans ombre ; nuit : aucune.

## 4. Typographie — une seule famille : Manrope

Déjà chargée, humaniste, chiffres nets. Retirés du chargement : Space Grotesk et Instrument Serif (plus d'italique
éditoriale « ensemble »). Les anciens noms (`fonts.display*`, `fonts.serifItalic`, `typography.editorial*`)
pointent sur des graisses de Manrope, droites.

| Rôle (`typography`) | Graisse | Corps / interligne | Usage |
|---|---|---|---|
| `display` | 800 | 36 / 42 (−1,1) | titre d'accueil, d'entrée, d'onboarding (une fois) |
| `headingXL` (titre) | 800 | 28 / 34 | titre d'écran |
| `headingM` (section) | 700 | 19 / 25 | titre de section |
| `bodyM` (corps) | 500 | 16 / 24 | texte courant |
| `label` (libellé) | 600 | 14 / 20 | champ, groupe, rangée |
| `caption` (métadonnée) | 500 | 12,5 / 17 | heure, source, compteur |
| `numeric` (chiffres) | 700 | 28 / 34, `tabular-nums` | mesures, durées, compteurs |

## 5. Rayons

`radius.control` **14** (boutons, champs, sélecteurs : rectangle aux angles souples, **pas une capsule**) ·
`md` 16 · `lg` **20** (cartes) · `xl` 24 · `sheet` 28 · `pill` **réservé aux filtres et statuts** (`Chip`, pastilles).

## 6. Composants

### Bouton (`Button`, ui.tsx)

| Variante | Rendu | Usage |
|---|---|---|
| `primary` | aplat profond (`tokens.action`), texte clair, rayon 14, hauteur 52 (sm 44, lg 56) | UNE action principale par écran |
| `onHero` | surface claire opaque + texte prune, ombre de contact légère | action posée sur le halo corail |
| `secondary` | teinte légère (creux) + texte encre | action secondaire |
| `outline` | contour fin + texte corail | alternative discrète |
| `ghost` / `link` | texte corail (lien souligné, cible ≥ 44) | actions tertiaires |
| `icon` | icône + libellé visible dessous, tuile 72 px | actions à pictogramme |
| `danger` (= `destructive`) | rouge d'alerte + texte blanc | suppression (via `SensitiveButton`) |

Pas de dégradé, pas d'ombre épaisse, **pas d'icône décorative par défaut**. États : pressé (échelle 0,98 + teinte,
ressort Reanimated sur le fil UI, haptique légère à l'action) · survol web (teinte) · **focus visible** (anneau
2 px de `tokens.focus`, écart 3 px ; + anneau CSS global sur le web) · chargement (indicateur, taille stable,
libellé conservé pour l'accessibilité, appuis suivants ignorés) · succès (coche 900 ms) · échec (tremblement +
message) · désactivé (fondu 0,48). Les `onPressIn/Out`, `onHoverIn/Out`, `onFocus/onBlur` de l'appelant sont
**composés** avec ceux du bouton (ils n'écrasent plus l'animation). Libellé trop long : sans icône, puis `shortLabel`.

### Listes : `ListGroup` / `ListRow` (remplacent les cartes empilées)

```tsx
<ListGroup title="Outils">
  <ListRow icon="calendar" title="Agenda" subtitle="3 rendez-vous cette semaine" onPress={…} />
  <ListRow icon="shopping-cart" title="Courses" value="12 articles" onPress={…} />
  <ListRow icon="bell" title="Rappels" right={<Toggle … />} />
</ListGroup>
```

Une surface (rayon 20, liseré), rangées de 60 px min., **icône cohérente** (pastille ronde corail pâle, icône
corail), titre, sous-titre, valeur (chiffres tabulaires) et/ou chevron, **filets fins** alignés sur le texte. Hors
groupe, `ListRow` garde son ancien rendu. `Card` : réservée aux **informations isolées**. `Chip` : **filtres et
statuts** uniquement (au repos : surface + contour ; choisie : aplat de l'action ; `tone="lavender"` : teinte lilas
+ coche). `GlowCard` (sélection) : contour corail 1,5 px + teinte corail pâle (plus de halo ni de faisceau).

### Navigation (`Dock`) — refonte du 17/11/2026, verre le 18/11/2026

Cinq besoins : **Aujourd'hui · Moi · [action centrale] · Enfant · Famille**, et « Outils » (entrée fixe en tête
d'Aujourd'hui + dans la feuille de l'action centrale). Rendue par **`GlassTabBar`** (§ 10) : capsule de verre
**flottante** dès 360 pt de large, barre de verre **pleine largeur** collée en bas en dessous (à 320 pt les marges de la
capsule feraient passer les libellés en icônes seules). Le contenu défile SOUS la barre translucide. Onglet actif :
indicateur qui **glisse** d'un onglet à l'autre (ressort « panneau ») + libellé gras + petite réaction de l'icône ;
haptique « sélection » ; changement d'onglet lui-même immédiat (fondu bref de 160 ms de l'écran d'arrivée, rien avec
« Réduire les animations »). Fond de chaque onglet défini dès le premier rendu (`sceneStyle`).

- **4 onglets + bouton central** (et non 5 + bouton) : à 320 pt, trois onglets à droite d'un bouton centré ne laissent
  que 128 pt → icônes seules (cibles de 43 pt) ; avec 4 onglets, libellés entiers à 12 px à 320 et 390 pt, y compris
  « Grossesse » (`dockLayout`, testé ; capture `comparaison_barres_5_vs_4_onglets.png`).
- **Action centrale** (52 pt, 48 pt sous 360 pt ; nom accessible « Ajouter ») : feuille du bas de 4 à 6 actions du
  profil affiché (`features/quickActions`), choisies par la personne, + « Tous mes outils ». Un écran peut la remplacer
  (`useDockAction` : Communauté → Publier).
- **Onglet « Enfant » adaptatif** (`childTabMode`) : « Enfant », « Grossesse » (grossesse sans enfant), ou proposition
  d'ajouter un enfant / une grossesse.
- **Communauté** : hors de la barre ; bouton en haut à droite de tous les écrans d'onglet (`AccountActions`).
- **Sélecteur de profil universel** (`components/ProfileSwitcher`) : rangée d'avatars, anneau corail + nom en gras,
  indicateur de pages ; `ProfileSwipe` : glisser à gauche / à droite change de profil (bord gauche et carrousels exclus).
- Écrans d'onglet : `TAB_SCREEN_INSET` en bas (= capsule 68 pt + 8 + 8) : le DERNIER élément d'une page remonte
  toujours au-dessus de la barre flottante (`glassScreens.test.tsx` ; e2e « défiler jusqu'en bas » sur l'accueil,
  Mes outils, les trois onglets, à 390 et 320 pt).
- **Compte qui n'est que nounou** (`isCaregiverOnly`) : les écrans du foyer le renvoient vers « Mes gardes »
  (`/garde`) ; sur ceux qui lui restent (Profil, Communauté), la barre ne montre que « Mes gardes » + l'action centrale
  « Ajouter un événement » (enfant gardé), et aucun sélecteur de profil. Parents : entrée « Garde et nounou » dans
  l'onglet Enfant (`/garde/<enfant>` si une nounou a un accès confirmé). Onglet Famille : l'action centrale propose
  d'abord « Confier une mission » et « Créer une tâche ». Co-parent : accueil « Co-parent » sur « Moi » / « couple ».
- **Changement de profil coordonné** (`profileTransition`) : l'anneau glisse tout de suite vers l'avatar choisi ; un
  voile frère à la couleur du fond recouvre le contenu du profil précédent (110 ms) ; le magasin change ENSUITE ; les
  zones `ProfileStage` (tableau de bord de l'accueil, onglets, « Pour <profil> » de Mes outils) sont rendues sous une
  clé par profil (vraies données du nouveau profil, jamais un mélange) et entrent en cascade (220 ms).

### Outils : une seule source (18/11/2026)

Le registre `src/lib/journeys/tools.ts` est LA source de vérité d'un outil : identifiant stable, catégorie principale
(9 catégories), raccourcis contextuels (`also`), profils, route ; son nom, sa phrase et ses mots de recherche sont dans
`src/i18n/<langue>/toolhub.ts` (`th.<id>`). Aucun écran ne recopie un nom, une icône ou une route d'outil.

- **`ToolLinks`** (`features/toolHub/ToolLinks.tsx`) : tout menu qui propose des outils (Mon cycle, Ma grossesse, Moi
  aussi, suivi du jour, profil, onglets Moi / Enfant / Famille) passe une liste d'identifiants (`ids`) ou une
  catégorie ; il ne choisit que le CHOIX et l'ORDRE. La rangée est `ToolRow`, la même que dans « Mes outils »
  (pictogramme, nom, description entière jusqu'à 4 lignes, état réel éventuel, favori).
- **Accès nommé** à la catégorie complète (`allOf` : « Tous les outils de sommeil », « Explorer les outils de santé »)
  → `/tools/<catégorie>`. Jamais « Voir les N autres », jamais de liste repliée.
- **Nom d'un outil dans un texte ou un titre d'écran** : `toolName(id)` / `toolBlurb(id)` (`lib/domain/toolCatalog`).
- **Action propre à un écran** (réglage, sous-page, saisie du jour) : bouton ou puce, pas une rangée d'outil.
- **Communauté** : un espace à part (catégorie `community`, hors des 9), bloc distinct en bas de « Mes outils ».
- Descriptions : 100 caractères au plus dans chaque langue (test) ; garde-fous `toolSingleSource.test.ts`.

### Pastille « Démo » (`DemoBar`, `demoInset.ts`)

Petite pastille discrète (28 px, surface + liseré, point corail, « Démo ») + **« Quitter la démo »** en lien corail,
toujours visible, nom accessible « Quitter la démonstration », cible ≥ 48 px. Place réservée en haut :
`useDemoInset()` = 42 px en démo, 0 sinon ; `useTopInset()` = zone sûre + réserve.

## 7. Mouvement (détails : `MOTION_SYSTEM.md` ; primitives « Liquid Glass » : § 10)

Animé : pression des boutons (ressort, fil UI), sélection (pastille, contour de `GlowCard`, indicateur de sélecteur
en ressort « panneau »), apparition des fiches (`Appear`, `Reveal`, `Cascade`), halo (respiration lente, accueil /
entrée / onboarding seulement). **Rien ne bouge pendant la lecture des écrans de suivi** (aucun décor animé, aucun
fond animé). Changement d'onglet : immédiat (l'écran d'arrivée apparaît en 160 ms par un voile frère). Réduire les animations / économie d'énergie : états finaux immédiats,
halo figé ; nuit : fondus courts, halo éteint.

## 8. Petit écran, texte agrandi, clavier

Règles de l'audit 09 inchangées (`layoutFit.ts`, `fontScale.ts`, `e2e/audit_ux.py`) : rien n'est coupé à 320 × 568,
texte 1,3, clavier ouvert ; titres 32 → 21 px sans couper de mot ; bouton pleine largeur sans icône puis libellé court.

## 9. Non vérifié ici

Rendu iOS / Android natifs (Reanimated sur appareil, haptique, VoiceOver / TalkBack), FPS. Les écrans eux-mêmes
(accueil, hubs, outils) ne sont pas encore recomposés avec `ListGroup` / le halo / les illustrations 3D
(`assets/illustrations/`) : c'est l'étape suivante, écran par écran. Vérifié : TypeScript, Jest, export web,
captures Chromium 390 × 844 et 320 × 568, clair et sombre.

## 10. Liquid Glass et mouvement (17/11/2026)

Bibliothèque centralisée : `src/components/glass/` (un seul point d'entrée, `@/components/glass`), jetons dans
`src/theme/glass.ts`, primitives de mouvement dans `src/motion/` (`@/motion`). Galerie de contrôle visuel :
`/dev/glass` (Réglages → « Galerie Liquid Glass », en mode développeur ou en démonstration seulement).

### Où le verre est branché (18/11/2026)

| Surface | Composant | Verre ? |
|---|---|---|
| Barre du bas | `Dock` → `GlassTabBar` (capsule flottante ≥ 360 pt, pleine largeur en dessous) | oui (`chrome`) ; bouton central : aplat opaque (pas de verre dans le verre) |
| Feuille de l'action centrale | `GlassSheet` (+ `GlassButton` primaire / tertiaire) | oui (`sheet`) ; tuiles d'action opaques |
| Fiche d'un outil (premier appui) | `ToolSheet` → `GlassSheet` ; « Commencer » = `GlassButton` primaire, AVANT les détails | oui (`sheet`) |
| Sélecteur de profil | `ProfileSwitcher` → `GlassProfileSwitcher` (anneau qui glisse) | oui (`chrome`) |
| Recherche « Mes outils » / feuille de recherche des onglets | `GlassSearchBar` (la feuille de recherche reste OPAQUE : jamais de verre dans du verre) | oui |
| Favoris, récents, « Pour <profil> » | `ToolTile` (tuile compacte : pictogramme + nom) | oui (`card`) |
| Icônes d'en-tête (urgences, notifications, Communauté, Réglages) | `GlassIconButton` (40 pt, cible 44) | oui |
| Toasts (favori, réorganisation…) | `ToastProvider view={GlassToast}` à la racine | oui (`chrome`) |
| Rangées d'outils (Mes outils, catégories, `ToolLinks`, onglets), résultats de recherche | `ToolRow` : carte OPAQUE + liseré + ombre légère, même pression que `GlassToolCard` | **non** : texte sur 4 lignes |
| Liste des catégories, éditeur de l'accueil, cartes de l'accueil | surfaces opaques | **non** |

Entrées sans opacité sur un ancêtre du verre : l'écran apparaît par un **voile frère** à la couleur du fond
(`useFocusCover`) ; les tuiles de verre entrent par `transform` seul ; le changement de profil recouvre le contenu
d'un voile frère (`ProfileStage`). Le reste de l'application garde `Button` (pas de remplacement en masse).

### Quand utiliser le verre — et quand NE PAS l'utiliser

| Oui | Non |
|---|---|
| Ce qui FLOTTE au-dessus du contenu : barre d'onglets, barre du haut, bouton flottant, recherche, sélecteur, menu, toast | Une zone riche en texte : article, formulaire long, liste de données, tableau — elle reste une surface OPAQUE (`Card`, `ListGroup`, `Surface`) |
| Une PETITE surface posée sur un fond vivant (photo, halo, illustration) : carte d'outil, résumé de trois lignes | Une carte dans une liste de vingt (coût du flou, lecture ralentie) |
| Une feuille ou une fenêtre courte (`GlassSheet`, `GlassModal`) | Du verre sur du verre (deux flous empilés : illisible et coûteux) — une barre de verre contient des contrôles NUS (`GlassIconButton plain`) |
| | Le mode nuit (soins de nuit) : rien ne brille, tout est opaque — c'est automatique |
| | Un « verre » sans flou : un fond blanc translucide n'est pas du verre, la bibliothèque ne le rend jamais |

Règles d'intégration : (1) ne jamais animer ni régler l'**opacité d'un ancêtre** d'un verre (le flou et le verre natif
se figent ou disparaissent) — animer `transform`, estomper le CONTENU, ou fondre un calque frère ; (2) le libellé
`tertiary` (sans surface) est réservé au fond uni ; (3) une seule action `primary` par écran.

### Les trois niveaux de repli (`useGlassTier`, décision pure `resolveGlassTier`, testée)

| Niveau | Quand | Rendu |
|---|---|---|
| `native` | iOS 26+, `isLiquidGlassAvailable()` **et** `isGlassEffectAPIAvailable()` (`expo-glass-effect` 57.0.5, `surfaces/nativeGlass.ts`) | `GlassView` (`glassEffectStyle="regular"`, `colorScheme` imposé par le thème de l'app, teinte de palette pour `card` et `sheet`) |
| `blur` | iOS < 26, web ; Android 12+ seulement si l'écran publie une cible (`GlassBlurTarget` + `BlurTargetView`) | flou RÉEL (`expo-blur` 57.0.3, déjà dans `package.json` : UIVisualEffectView / `backdrop-filter`) + voile de contraste teinté + liseré clair + reflet du haut |
| `opaque` | « Réduire la transparence » (iOS ; web : `prefers-reduced-transparency`), mode nuit, Android sans cible de flou | surface du thème (`surface.raised` / `surface`), même forme, liseré du thème |

L'accessibilité passe avant tout : « Réduire la transparence » l'emporte même sur le verre natif et sur un niveau
imposé (`GlassTierProvider`, réservé à la galerie et aux tests).

### Variantes et voile de contraste (`glassSpec(theme, variante)`)

| Variante | Usage | Encres garanties | Opacité du voile (résolue) |
|---|---|---|---|
| `chrome` | barres, boutons flottants, recherche, sélecteurs, toast | texte, secondaire renforcé ≥ 4,5:1 ; accent renforcé ≥ 3:1 | clair ≈ 0,69–0,71 · sombre ≈ 0,81–0,82 |
| `card` | petites surfaces (carte d'outil) | idem | idem |
| `sheet` | feuille, fenêtre, menu : contenu libre | TOUTES les encres du thème (texte, secondaire, primaire, 4 statuts) ≥ 4,5:1 | clair 0,86–0,95 · sombre 0,93–0,97 |

Ce qu'il y a sous un verre est inconnu. Un flou ne sort jamais de l'enveloppe des couleurs qu'il mélange : le pire
fond est donc un **noir ou un blanc uni**. `solveVeilAlpha` cherche la plus petite opacité du voile pour laquelle
chaque encre promise tient sur ces deux fonds, y compris sous le reflet, l'indicateur de sélection et le voile
d'appui. Les encres du verre (`spec.inks`) sont plus denses que celles des surfaces opaques. En sombre, la teinte du
voile est le FOND de la palette (verre fumé). `src/__tests__/glassContrast.test.ts` refait le calcul pour les 5
palettes en clair et en sombre (104 vérifications) ; les seuils ne se baissent pas.

### Composants (`@/components/glass`)

| Composant | Rôle | Props essentielles |
|---|---|---|
| `Glass` / `GlassMaterial` | surface de verre / sous-couche seule | `variant`, `radius`, `edges` (`all` \| `top`), `shadow`, `contentStyle`, `tier` |
| `GlassButton` | bouton | `label`, `variant` (`primary` \| `secondary` \| `tertiary` \| `destructive`), `size` (`sm` 44 \| `md` 52 \| `lg` 56), `icon`, `iconRight`, `state` (`idle` \| `loading` \| `success` \| `error`), `disabled`, `full`, `onPress` (une promesse enchaîne chargement → succès / erreur) |
| `GlassIconButton` | icône seule, 44 pt | `icon`, `label` (obligatoire), `onPress`, `plain`, `selected`, `disabled` |
| `GlassFab` | bouton flottant | `icon`, `label`, `showLabel`, `tone` (`action` \| `glass`), `size` |
| `GlassCard` | petite carte | `children`, `onPress?`, `accessibilityLabel`, `padded`, `radius` |
| `GlassToolCard` (+ `GlassToolCardSkeleton`) | carte d'outil | `title`, `description`, `icon` ou `glyph`, `profile`, `favorite` + `onToggleFavorite`, `onPress`, `disabled`, `descriptionLines` |
| `GlassSheet` | feuille du bas | même API que `Sheet` (`visible`, `onClose`, `title`, `children`) — c'est `Sheet` avec un panneau de verre |
| `GlassTabBar` | barre d'onglets | `tabs` (`key`, `label`, `icon`, `accessibilityLabel?`, `width?`), `activeKey`, `onChange`, `onLongPress?`, `center` + `centerAfter`, `floating`, `bottomInset`, `labelSize`, `iconsOnly` |
| `GlassSearchBar` | recherche | `value`, `onChangeText`, `placeholder`, `label`, `right`, + props de `TextInput` |
| `GlassProfileSwitcher` | rangée d'avatars (présentation pure) | `profiles` (`key`, `label`, `accessibilityLabel?`, `avatar`), `activeKey`, `onChange`, `onAdd?` + `addLabel`, `size`, `glass` |
| `GlassSegmentedControl` | sélecteur segmenté | `options` (`value`, `label`, `icon?`), `value`, `onChange`, `label` |
| `GlassMenu` (+ `useMenuAnchor`) | menu déroulant / contextuel | `visible`, `onClose`, `items` (`key`, `label`, `icon?`, `destructive?`, `disabled?`, `selected?`, `onPress`), `anchor` |
| `GlassModal` | fenêtre | `visible`, `onClose`, `title`, `message?`, `children?`, `actions` (`label`, `onPress`, `variant?`), `dismissable` |
| `GlassToast` / `GlassToastProvider` | toast | le `ToastProvider` existant avec une vue de verre : `useToast()` inchangé |

Tous : jetons du thème uniquement (aucune couleur en dur dans `src/components/glass`), cibles ≥ 44 pt (`hitSlop`
quand le visuel est plus petit), rôle + nom + état annoncés, texte qui suit la taille du téléphone (plafonds de
`typography`), sélection jamais portée par la couleur seule. Points d'extension ajoutés à l'existant, sans changement
de comportement : `Sheet({ panel })` et `ToastProvider({ view })` (Overlays.tsx).

### Primitives de mouvement et durées (`@/motion`, détails dans `MOTION_SYSTEM.md`)

| Primitive | Geste | Valeurs |
|---|---|---|
| `usePress` | pression | compression 0,97 (ressort `vif`), retour `doux`, haptique léger au contact ; publie `progress` (voile, ombre) |
| `StaggerList` | apparition échelonnée | fondu + 10 px, 45 ms par rang, plafond 360 ms |
| `ContentSwap` | transition de contenu partagée (profil, onglet) | sortie 110 ms `accelerate`, entrée 220 ms `decelerate`, glissé de 10 px |
| `useItemLayouts` + `useIndicator` | déplacement d'indicateur | ressort `panneau` (≈ 300 ms), première pose sans trajet |
| `FavoriteStar` / `useFavoritePop` | favori | saut 1,28 → 1 (`rebondLeger`), onde 420 ms, haptique « sélection » |
| `useShake` | secousse d'erreur | 5 pas décroissants de 55 ms (≈ 275 ms), haptique « erreur » |
| `SuccessCheck` | coche de succès | 0,6 → 1 (`rebondLeger`), tracé 240 ms |
| `SkeletonPulse` + `SkeletonBone` | squelettes | respiration 1 → 0,45, 900 ms par demi-cycle, un seul nœud animé par groupe |
| `ReorderList` + `useReorderScroll` | glisser-déposer vertical | appui long 220 ms, soulèvement 1,03, voisines en ressort `panneau`, haptique à chaque rang, défilement automatique (zone de 72 px, 720 px/s) |

Tout tourne sur le fil UI et passe par `useMotion()` : « Réduire les animations » et l'économie d'énergie donnent
l'état final immédiat ; la nuit, des fondus courts sans ressort. Familles de durées inchangées : micro 120–180 ms,
panneaux 220–320 ms, scènes 320–450 ms.

### Non vérifié ici (iPhone requis)

Le web ne montre que le niveau `blur` (flou CSS) et le repli opaque. À vérifier sur iPhone : le rendu du verre natif
d'iOS 26 (lisibilité sur photo, teinte, comportement pendant une compression) ; le flou UIVisualEffectView d'iOS < 26 ;
« Réduire la transparence » en conditions réelles ; les haptiques ; le glisser-déposer (appui long face au défilement,
défilement automatique, 120 Hz) ; la fluidité sur un appareil lent. Android : opaque tant qu'aucun écran ne publie de
cible de flou.
