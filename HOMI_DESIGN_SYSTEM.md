# HOMI — Design system v4 « Lumière minérale » (14/11/2026)

Décision du propriétaire : **remplace la v3 « désert sci-fi » turquoise**. Constat sur la v3 : arcs décoratifs répétés
(l'astre en haut à droite de chaque écran), dominante turquoise uniforme, compositions trop semblables d'un espace à
l'autre. Direction v4 :

- **Clair** : panneau ivoire lumineux, bleu brume, pêche, reflets lilas ; formes MINÉRALES et lumière douce pour la
  profondeur.
- **Sombre** : obsidienne, verre fumé, lumière DIRECTIONNELLE (Black Mirror × désert sci-fi).
- **Chaque espace a son ambiance** (composition, lumière, accent secondaire), sans changer le sens des statuts.
- Références de composants (décrites, aucune image copiée) : « Lightly » (disques givrés, sélecteurs, navigation
  flottante) et tableau de mesures (tuiles à lumière intérieure, valeurs lisibles, micrographiques).
- La **lentille** : la sélection est une lentille de verre clair qui glisse sous l'option active — même matière que le
  « O » du futur logo (une lentille de verre). Le logo lui-même n'est PAS modifié ici (agent logo).

| Fichier | Rôle |
|---|---|
| `src/theme/tokens.ts` | neutres v4, 4 palettes + Auto, `migratePalette` (v3 → v4), `sceneColors`, `buildTheme` → `tokens` / `material` (verre, surfaces, **lentille**, scène, lumière) / `colors` |
| `src/theme/ambiance.ts` | **ambiances par espace** : `AMBIANCES`, `spaceOf(adresse)`, `spaceScene(theme, espace)` |
| `src/theme/ThemeProvider.tsx` | apparence × palette, préférences par compte, Auto, changement de palette interpolé (`PALETTE_TWEEN`) |
| `src/lib/store.ts` | préférences par compte ; `migrateAppearance` à chaque restauration (palette v3 → la plus proche) |
| `src/components/scene/SpaceScene.tsx` | **scène de chaque espace**, immersive / calme (`DesertScene.tsx` = alias de compatibilité) |
| `src/components/controls/Lens.tsx` | **`Lens`**, `useLensSlide`, `LENS` |
| `src/components/surfaces/` | `Surface`, `OpticalGlass`, `FrostedGlass`, `MatteSurface`, détection Liquid Glass natif |
| `src/components/controls/` | `PrimaryButton`, `SecondaryButton`, `SensitiveButton`, `IconOrb`, `ChoiceGroup`, `DataTile`, `Lens` |
| `src/components/Dock.tsx`, `Overlays.tsx`, `ui.tsx` | barre d'onglets à lentille, panneau du bas en verre optique, bouton à 8 états |
| `src/app/settings/appearance.tsx` | réglages + écran de vérification (matières, lentille, états, panneau, scène de chaque espace) |
| Tests | `contrast.test.ts` (verrou v4), `homiV2.test.tsx` (préférences, migration), `homiV3.test.tsx` (scènes, espaces, mouvement) ; E2E `e2e/apparence_v3.py` (adapté v4), `e2e/audit_ux.py` |

## 1. Réglages (Réglages → Apparence et couleurs)

| Réglage | Valeurs | Défaut | Stockage |
|---|---|---|---|
| Apparence | Système, Clair, Sombre | Système | `themePreference` |
| Palette | **Auto, Brume pêche, Aurore lilas, Lagune turquoise, Ambre minéral** | Auto | `palettePreference` |

- **Brume pêche = signature** (`SIGNATURE_PALETTE`, exports statiques `themes`, repli de toute valeur inconnue).
- Aperçu en direct (tout l'écran + carte d'aperçu) ; mémorisé **par compte** (`appearanceByUser`), aucune
  synchronisation serveur (`supabase/**` hors périmètre).
- **Migration** : les palettes v3 sont retirées ; toute préférence enregistrée (compte actif ET autres comptes de
  l'appareil) passe à la palette v4 la plus proche — distance RVB cumulée des deux encres et des deux lueurs, vérifiée
  par le test : Turquoise → Lagune, Menthe → Lagune, Aurore (cyan) → Lagune, Iris → Aurore lilas, Crépuscule → Ambre
  minéral. Appliquée à la restauration (`persist.merge` → `migrateAppearance`), à l'écriture (`setPalette`), au
  changement de compte et à la lecture (`ThemeProvider`, réglages).
- Changement de palette : lumière de la scène, reflets du verre, caustiques, sélections et accents passent ensemble
  de l'ancienne à la nouvelle palette (4 paliers, ≈ 360 ms) ; le contenu ne bouge pas. Réduire les animations,
  économie d'énergie, nuit : immédiat.

### Auto (heure LOCALE) — chaque palette a son moment

| Dès | Palette |
|---|---|
| 06:00 | Brume pêche (aube) |
| 11:00 | Lagune turquoise (journée) |
| 17:00 | Ambre minéral (fin de journée) |
| 21:00 | Aurore lilas (soir et nuit) |

Fondu de 60 min centré sur chaque bascule, paliers de 5 min, déterministe, continu à minuit. Aperçu sans changer
l'heure : puces Matin / Journée / Fin de journée / Soir.

## 2. Couleurs (verrouillées par `contrast.test.ts`)

| Rôle | Clair « ivoire lumineux » | Sombre « obsidienne » | Nuit |
|---|---|---|---|
| Fond | `#F6F3EE` (dégradé `#FBFAF7 → #ECE7E0`) | `#07080B` (dégradé `#0F1116 → #030405`) | `#060708` |
| Lumières du clair | bleu brume `#D3DEEA` · pêche `#F4D6C4` · lilas `#E0D8F3` | — | — |
| Texte / secondaire | `#15171C` / `#4A4E58` | `#EEF0F4` / `#A9AEB9` | `#D6DADB` / `#979EA1` |
| Statuts (succès · attention · erreur · info) — **inchangés depuis la v3** | `#1B6234` · `#7A4600` · `#A51F2B` · `#1D5AA6` | `#8BE0A6` · `#F7C770` · `#FF9A93` · `#9CC4FF` | `#94C29E` · `#D9B577` · `#E8A3A0` · `#9EB6D8` |

| Palette | Encres (clair) a / b | Lueurs (sombre) a / b |
|---|---|---|
| **Brume pêche** (pêche + bleu brume) | `#9A4122` / `#3A5878` | `#FFB08E` / `#A9C4E8` |
| Aurore lilas (lilas + rose d'aurore) | `#5B3DB0` / `#8A3866` | `#C8B5FF` / `#F4B4D2` |
| Lagune turquoise (turquoise + bleu profond) | `#00636A` / `#2D5786` | `#55DCD2` / `#A4C4F0` |
| Ambre minéral (ambre + terre minérale) | `#7C4A0C` / `#7A4030` | `#F0BC6C` / `#E6A890` |

Ambre minéral est proche de la couleur « attention » : un statut est TOUJOURS couleur + icône + libellé (testé :
`BANNER_ICON`), jamais la couleur seule ; l'accent n'est jamais égal à un statut (testé).

**Contraste** : texte, secondaire, primaire, accent 2 et les 4 statuts ≥ 4,5:1 pour 4 palettes × clair / sombre /
nuit × **6 scènes d'espace** (ciel, lumière, brume, 3 pierres, face éclairée, sol, fenêtre), chaque mélange de l'Auto,
chaque étape des 12 transitions de palette, et **chaque matière posée sur chacune de ces couleurs** (verre optique +
lumière interne + reflet, verre givré / fumé, mate, creux, **lentille sur rail et sur verre**, teintes, tuiles
éclairées de l'intérieur). Exclus : traits ≤ 2 px (arêtes éclairées, reflets). Bouton principal : texte ≥ 4,5:1 sur
chaque arrêt de son dégradé.

## 3. Matières et lentille (`theme.material`, `src/components/surfaces`, `controls/Lens`)

| Matière | Réservée à | Clair | Sombre |
|---|---|---|---|
| **Verre optique** `optical` | **navigation** (barre d'onglets), **sélections**, **panneaux principaux** (panneau du bas, carte de tête) | blanc aux reflets lilas teintés de la palette, 70 %, flou 48, lumière interne palette → lilas, ombre colorée | fumée teintée 7 %, 76 % |
| **Verre givré / fumé** `frosted` | **commandes secondaires** (bouton secondaire, filtres, disques d'icône) | blanc 80 %, flou 32 | fumée 82 % |
| **Surface mate** `matte` | **listes longues, formulaires, résultats denses**, textes | `#FFFEFD` opaque | obsidienne relevée opaque |
| **Lentille** `lens` | l'option ACTIVE d'un sélecteur ou de la barre d'onglets | blanc 94 % (plus clair que le rail), liseré encre 14 %, reflet de réfraction haut, ombre interne basse, caustique de la palette au pied | `#252932` teinté 10 %, 92 % |

- La lentille **grossit sans colorer** : l'option reste en couleur de texte, en gras, avec une coche à la couleur
  d'accent ; une seule action colorée (le bouton principal) reste identifiable par écran.
- `Card` / `GlassSurface` : remplissage opaque ⇒ mate automatiquement. Plateformes : iOS 26+ `GlassView` (détection
  protégée inchangée) + voile de lisibilité ; iOS ancien / web : `BlurView` ; Android : remplissage seul ; Réduire la
  transparence et nuit : opaque (**alternative lisible au verre** : le remplissage seul est testé).

```tsx
import { Lens, LENS, useLensSlide } from '@/components/controls';
const slide = useLensSlide(x, width);                // première pose immédiate, puis ressort « panneau »
<Lens slide={slide} top={LENS.inset} height={44} hue={accentDeLEspace?} testID="choice-indicator" />
```

## 4. Scènes d'espace et ambiances (`SpaceScene`, `src/theme/ambiance.ts`)

Création originale 100 % SVG, **aucun astre, aucun cercle, aucun arc décoratif** (galets = courbes irrégulières,
testé). Chaque espace est reconnaissable à sa composition, sa lumière et son accent secondaire (décoratif, jamais un
texte, jamais une couleur de statut — testé) :

| Espace (routes, `spaceOf`) | Composition | Lumière | Accent secondaire |
|---|---|---|---|
| Accueil (`/`, défaut) | « Seuil » : chaîne de plateaux, mesa portant la maison de verre à la fenêtre allumée | haut gauche (0,12 ; 0,08) | celui de la palette |
| Santé (`/health`, cycle, grossesse, santé, questions…) | « Cairn » : galets empilés en équilibre, à droite | haut droite (0,92 ; 0,06) | lilas `#B9A8F0` |
| Bébé (`/baby`, enfant, biberon, sommeil, suivi…) | « Nid » : dunes rondes et galets lovés, à gauche | zénith (0,5 ; 0) | pêche `#F6B89C` |
| Famille (`/household`, famille, repas, listes, agenda…) | « Strates » : terrasses de roche en paliers, à droite | rasante depuis la gauche (0 ; 0,32) | ambre `#EDB66C` |
| Communauté (`/community`) | « Monolithes » : pierres dressées ensemble, reflets au sol | contre-jour (0,55 ; 0,3) | bleu brume `#97B6E0` |
| Réglages (`/settings`, premium, mentions…) | « Prisme » : cristal à facettes qui décompose un rayon | haut gauche, rayons fins (0,08 ; 0,04) | gris minéral `#B8BFCC` |

- Clair : ciel bleu brume → ivoire → pêche, halo de lumière blanche, brume d'horizon, pierres pâles (brume, lilas,
  pêche) teintées par l'espace, sol aux reflets lilas. Sombre : obsidienne, pierres presque noires lues par leur arête
  éclairée, **faisceau directionnel** depuis la source de lumière de l'espace, sol qui reflète. Nuit : même scène très
  tamisée, fixe.
- **Variantes** : `immersive` à l'ouverture et à la RACINE de chaque espace (`/`, `/health`, `/baby`, `/household`,
  `/community`, `/settings`) — la composition se pose dans l'en-tête (cadre rogné `STAGE_TOP`), au-dessus d'un sol ;
  `calm` sur les écrans internes — même lumière et même accent, composition réduite posée en bas, à une place propre à
  chaque espace (`CALM_X`). Vignette (aperçu plus large que haut) : composition entière à l'échelle.
- Fond de coque : `<SpaceScene space={spaceOf(pathname)} variant={backdropVariant(pathname)} />` (`_layout.tsx`).
- Parallaxe légère (lumière 3 px, composition 6 px, 22 s) ; image fixe avec Réduire les animations, économie
  d'énergie, nuit, arrière-plan, hors écran. Web : animation CSS (aucun calcul JS par image).

## 5. Famille de commandes (`src/components/controls`)

| Commande | Repos | Pression | Focus | Sélection | Chargement | Succès / erreur | Désactivé |
|---|---|---|---|---|---|---|---|
| `PrimaryButton` (= `Button` primary) — **verre teinté** de la palette, l'action principale de l'écran | dégradé de la palette, arête fine, libellé ≥ 4,5:1, ombre colorée | 0,98 + reflet qui traverse | anneau (web) | — | indicateur à la place du libellé, largeur stable, appuis suivants ignorés, `busy` annoncé | **coche 900 ms** + respiration / tremblement + message | fondu ; en sombre verre neutre |
| `SecondaryButton` — **verre givré** | givré / fumé, reflet discret | 0,98 + voile | anneau | — | idem | idem | idem |
| `IconOrb` — **bouton rond à icône** (disque givré) | 40 / 48 / 56 px, reflet du coin éclairé ; nom accessible obligatoire ; cible ≥ 48 px | 0,92 ressort | anneau | lumière diffuse + `selected` | — | — | 0,45 |
| `ChoiceGroup` pills / `Segmented` — **sélecteur à lentille** | rail en creux | haptique « sélection » | anneau | **LENTILLE qui glisse** sous l'option + gras + coche accent | — | — | — |
| `ChoiceGroup` orbes, cartes | inchangés (v3) | | | | | | |
| `DataTile` — **tuile à lumière intérieure** | mate, foyer radial (palette ou statut), valeur grande et fine, unité, contexte ; micrographique seulement avec ≥ 2 valeurs réelles | 0,98 | anneau | — | — | — | état vide explicite |
| `SensitiveButton` | libellé explicite, couleur « erreur », confirmation | 0,98 sans reflet | anneau | — | idem | idem | idem |
| `Dock` — **navigation flottante** | capsule de verre optique, bouton rond d'action à droite | 0,9 | anneau | **lentille** couvrant l'onglet actif (icône accent + libellé gras), caustique à l'accent de l'espace | — | — | — |

Une seule action principale colorée par écran ; statuts = couleur + icône + libellé ; doubles pressions ignorées
pendant le chargement ; libellés et zones tactiles ≥ 44–48 px (audit 09 inchangé).

## 6. Mouvement (détails : `MOTION_SYSTEM.md`)

Familles : micro 120–180 ms · panneaux 220–320 ms (lentille, panneau du bas, sélecteurs) · scènes 320–450 ms
(changement de palette, carte → détail, fondu de mode). Interruptibles. Réduire les animations / économie d'énergie :
états finaux ; nuit : fondus courts. Le panneau du bas (`Sheet`, verre optique en v4) et le morph carte → détail sont
inchangés.

## 6 bis. Haut d'écran et pastille « Démonstration » (`src/components/demoInset.ts`)

La pastille de démonstration (`DemoBar`, montée une fois dans `_layout.tsx`) flotte en position absolue au centre,
sous la zone sûre. Pour qu'elle ne recouvre **jamais** la première ligne d'un en-tête (date de l'Accueil, avatar et
Réglages des hubs, bouton retour), la place est **réservée** plutôt que la pastille déplacée dans chaque en-tête :

- `useDemoInset()` → `DEMO_INSET` (42 px : 4 d'écart + 34 de pastille + 4 de respiration) quand la pastille est
  affichée (démonstration **et** session ouverte), **0 sinon** — aucun décalage hors démo ;
- `useTopInset()` → `insets.top + useDemoInset()` ; c'est le haut à utiliser partout au lieu de `insets.top` seul.

`Screen` l'applique à son en-tête (ou au contenu s'il n'a pas d'en-tête) : tous les onglets, hubs, réglages et
écrans internes en héritent. Les écrans plein cadre qui calculent eux-mêmes leur haut (nuit, sommeil, urgence, SOS,
routine enfant, onboarding, accueil sans compte, `PremiumGate`, toasts) ajoutent `useDemoInset()`.
Nouvel écran : utiliser `Screen`, ou `useTopInset()` pour un écran plein cadre — jamais une pastille dupliquée dans
une rangée d'en-tête. La pastille garde sa sortie visible (« Quitter la démo », cible ≥ 48 px via `hitSlop`, nom
accessible « Quitter la démonstration ») ; son `hitSlop` (jusqu'à 45 px sous la zone sûre) ne mord pas sur les
boutons d'en-tête, qui commencent à 50 px. Test : `src/__tests__/demoInset.test.tsx`.

## 6 ter. Petit écran, texte agrandi, clavier (audit 09, `docs/audit/09_ux_accessibilite.md`)

Règle : **rien n'est coupé, rien ne sort de l'écran, aucun mot n'est cassé** à 320 × 568, texte 1,3, clavier ouvert.
Les décisions de place sont prises AVANT le rendu (`src/components/layoutFit.ts`, chasse des polices mesurée) avec la
taille de texte réelle (`useFontScale()`, `src/theme/fontScale.ts` : `fontScale` du téléphone ; sur le web, police
racine du navigateur / 16).

- **En-tête de `Screen`** : écran qui défile → le grand titre (glyphe + titre + sous-titre) DÉFILE avec le contenu
  (titre large iOS) et un **titre compact** d'une ligne apparaît à côté du retour quand il passe sous l'en-tête.
  Écran `scroll={false}` → grand titre fixe qui **se replie** au clavier, sous 520 px de haut ou quand sa zone de
  contenu défile (hystérésis, `nextInnerScrolled`). Fixe au plus : zone sûre + pastille démo + rangée de 48 px.
- **Titre** : 32 → 28 → 24 → 21 px pour tenir en **2 lignes sans couper de mot** (`fitTitleSize`), glyphe de
  40 px sous 360 px de large ou au-delà de 1,15 ; jamais de césure dans un titre ou un bouton.
- **`ChoiceGroup` orbes** : libellé ENTIER sous l'orbe (3 lignes max, plus de `numberOfLines`) ; s'il ne tient pas,
  les orbes passent sur **plusieurs rangées équilibrées** (5 → 3 + 2), chacune garde sa lumière (`orbLayout`).
- **`ChoiceGroup` pills → cartes** : si un libellé ne tient pas en 2 lignes dans son segment (`pillsFit`), le
  sélecteur devient une **liste de cartes** (`variant="cards"`, aussi utilisable directement, avec `description`).
- **Bouton pleine largeur** (`Button full`, `Screen.action`) : si le libellé passe à la ligne, l'icône part, puis
  `shortLabel` s'affiche (le lecteur d'écran lit toujours `label`). `Screen.action.onPress` peut renvoyer une
  promesse (chargement, double appui ignoré) ; `action.loading` force le chargement.
- **Barre d'onglets (`Dock`)** : libellés entiers (12 → 10 px) ; si à 10 px ils ne tiennent pas avec 44 px par onglet
  (320 px + texte agrandi, langue longue), **icônes seules**, onglets égaux ≥ 44 px, nom accessible = libellé
  complet (`tabLayout().iconsOnly`). Jamais de libellé abrégé ni d'onglet de moins de 44 px.
- **Rangée texte + actions** (fil du jour, cartes) : le texte reste entier ; les actions passent dessous quand il
  tomberait sous ~150 px (`flexWrap`), jamais l'inverse. Une pastille d'état passe sous son libellé.
- **Écran plein écran sans `Screen`** : « Fermer » = `goUp(pathname)` (`src/lib/links.ts`) : retour, sinon l'écran
  parent (`parentRoute`), jamais l'Accueil par défaut.
- **Désactivé en sombre** : bouton plein → verre neutre + texte secondaire (la couleur vive atténuée semblait active).
- **Clavier** : `useKeyboardVisible()` vaut aussi sur le web (zone visible réduite ≥ 120 px pendant une saisie) ;
  la barre d'onglets (`Dock`) s'efface, l'en-tête se replie, le champ actif est ramené en vue à l'ouverture.
- **Défilement** : `useScreenScroll()` (`scrollToTop`, `scrollToNode`, `ensureVisible`) agit sur la zone de `Screen`
  ou sur la zone qu'un écran `scroll={false}` inscrit (toute zone passée à `useKeyboardScopeFor`).
- **`Reveal`** (`@/motion`) : section qui apparaît après un choix, fondu + 12 px, `scrollIntoView` si elle est sous le pli.
- **`ConfirmationCard`** (`@/components/controls`) : `saved` / `offline` / `error` (+ « Réessayer »), annoncée,
  ramenée en vue ; toujours après le résultat réel.
- **`DataTile.contextLines`** (défaut 3, +1 avec texte agrandi, `0` = jamais abrégé ; texte complet lu).
- **Graphiques** : nombres au format de la langue (`chartNumber` : « 62,7 ») ; `BarChart` lisible jusqu'à 30 barres.
- **Web** : `input` rétrécissables (`min-width: 0`), un seul anneau de focus par champ (halo de `Field`).

Contrôle rejouable : `e2e/audit_ux.py` (détecteur `e2e/audit_ux_detect.js` : boîte de chaque texte comparée à
l'écran ET à ses conteneurs qui rognent, mots coupés, troncatures non déclarées, cibles < 24 px, champ masqué au
clavier) ; tests Jest `src/__tests__/audit09Layout.test.tsx`.

## 7. Non vérifié ici

Rendu iOS natif (GlassView, flou réel, lentille sur GlassView), Android (boxShadow coloré, absence de flou), largeur
animée de la lentille sur appareil bas de gamme, VoiceOver / TalkBack, FPS / ProMotion. Vérifié : TypeScript, Jest,
export web, E2E Chromium (`e2e/apparence_v3.py` adapté v4, dont `reducedMotion: 'reduce'` et la migration v3 → v4 ;
`e2e/audit_ux.py`), captures deviceScaleFactor 2 de chaque espace en clair et sombre (Brume pêche, Lagune turquoise).
