# HOMI — Design system v3 « Désert sci-fi » (13/11/2026)

Décision du propriétaire : **remplace « Lumière sur graphite » (v2)**. Direction : *Apple Keynote × Black Mirror ×
Liquid Glass* — « futuristic glassmorphism UI blending modern interface with a surreal sci-fi desert landscape,
floating glass panels, neon teal accents, immersive environment, premium dashboard aesthetics », en restant
accueillante pour une famille.

Références (décrites, aucune image copiée) : (1) désert sci-fi de nuit — obsidienne, sable minéral, turquoise néon,
astre géant, arche de pierre, eau qui reflète, panneaux de verre épais flottants aux bords clairs, capsule turquoise
lumineuse ; (2) « Liquid Glass Kit » — verre épais, reflets concentrés sur les arêtes, translucidité modulée,
capsules, ombres colorées douces ; (3) tableau de bord sombre — tuiles très arrondies, couleur qui éclaire la surface
DE L'INTÉRIEUR, chiffres grands et fins, micrographiques fins ; (4) carte de verre ambré sur fond flou, capsule
d'action pâle dans une barre de verre ; (5) « Lightly » — verre givré, typographie grande et légère, barre d'onglets
capsule flottante à bouton rond actif, boutons ronds, lumière diffuse derrière l'option active, choix qui se
rapprochent quand on sélectionne.

| Fichier | Rôle |
|---|---|
| `src/theme/tokens.ts` | neutres, 5 palettes, Auto, `buildTheme` → `tokens` / `material` (verre, **surfaces**, **scène**, **lumière**) / `colors` ; `surfaceShadow`, `innerLight`, rayons |
| `src/theme/ThemeProvider.tsx` | apparence × palette, préférences par compte, Auto, **changement de palette interpolé** (`PALETTE_TWEEN`) |
| `src/components/surfaces/` | `Surface`, `OpticalGlass`, `FrostedGlass`, `MatteSurface`, `SurfaceLight`, détection Liquid Glass natif |
| `src/components/controls/` | `PrimaryButton`, `SecondaryButton`, `SensitiveButton`, `IconOrb`, `ChoiceGroup`, `DataTile`, `Sparkline` |
| `src/components/scene/DesertScene.tsx` | scène vectorielle immersive / calme, parallaxe, `backdropVariant` |
| `src/components/Overlays.tsx` | `Sheet` gestuel (`sheetSnaps`, `sheetRelease`) |
| `src/motion/Morph.tsx` | transition carte → détail (`MorphSource`, `useMorphSource`, `MorphTarget`, `MorphHost`) |
| `src/components/ui.tsx`, `Glass.tsx`, `GlowCard.tsx`, `Dock.tsx` | composants historiques alignés sur la v3 (API inchangée) |
| `src/app/settings/appearance.tsx` | réglages + **écran de vérification** (matières, commandes, panneau, scène) |
| Tests | `contrast.test.ts` (verrou v3), `designSystem.test.ts`, `homiV2.test.tsx`, `homiV3.test.tsx` ; E2E `e2e/apparence_v3.py` |

## 1. Réglages (Réglages → Apparence et couleurs)

| Réglage | Valeurs | Défaut | Stockage |
|---|---|---|---|
| Apparence | Système, Clair, Sombre | Système | `themePreference` |
| Palette | **Auto, Turquoise**, Aurore, Crépuscule, Menthe, Iris | Auto | `palettePreference` |

- **Turquoise = signature** : premier choix manuel, palette des exports statiques (`themes`, `DEFAULT_PALETTE`,
  `SIGNATURE_PALETTE`) et repli de toute valeur inconnue.
- Aperçu en direct (tout l'écran + carte d'aperçu) ; persistance par compte inchangée (`appearanceByUser`, pas de
  synchronisation serveur — `src/lib/backend/**` et `supabase/**` hors périmètre).
- **Changement de palette** : lumière (scène, halo, reflets), sélections, confirmations et accents sont calculés
  d'un SEUL mélange de palettes (`blendAccents`) et passent ensemble de l'ancienne à la nouvelle en 4 paliers sur
  ≈ 360 ms (famille « scène »). Réduire les animations / économie d'énergie / nuit : immédiat. Chaque palier
  intermédiaire est testé (contraste).
- Mode nuit (écran `/night`) : obsidienne très tamisée, palette mêlée de gris (35 %), ni flou, ni reflet, ni halo,
  ni scène animée.

### Auto (heure LOCALE)

| Dès | Palette | Pourquoi |
|---|---|---|
| 06:00 | Menthe | matin frais et calme |
| 11:00 | **Turquoise** | pleine journée : la signature prend la plus longue plage active. Elle remplace Aurore dans l'Auto : cyan et turquoise sont trop proches pour qu'on perçoive deux plages ; Aurore reste au choix manuel |
| 17:00 | Crépuscule | fin de journée, chaleur (école, repas, bain) |
| 21:00 | Iris | soir et nuit, indigo apaisé |

Fondu de 60 min centré sur chaque bascule, paliers de 5 min, déterministe, continu à minuit. Aperçu sans changer
l'heure : puces Matin / Journée / Fin de journée / Soir (`skyOverride`, `PHASE_PALETTE`).

## 2. Couleurs (verrouillées par `contrast.test.ts`)

| Rôle | Clair « ivoire minéral » | Sombre « obsidienne » | Nuit |
|---|---|---|---|
| Fond | `#F1EEE7` (dégradé `#F8F6F1 → #E8E3D9`) | `#06090B` (dégradé `#0C1215 → #040607`) | `#060708` |
| Texte / secondaire | `#13181A` / `#4A5154` | `#EDF3F2` / `#A9B3B4` | `#D6DADB` / `#979EA1` |
| Statuts (succès · attention · erreur · info) | `#1B6234` · `#7A4600` · `#A51F2B` · `#1D5AA6` | `#8BE0A6` · `#F7C770` · `#FF9A93` · `#9CC4FF` | `#94C29E` · `#D9B577` · `#E8A3A0` · `#9EB6D8` |

| Palette | Encres (clair) a / b | Lueurs (sombre) a / b |
|---|---|---|
| **Turquoise** (turquoise néon + sable minéral) | `#00646A` / `#7A4E12` | `#46E3D6` / `#E9C58C` |
| Aurore (cyan + violet) | `#0A6176` / `#5E36C4` | `#6FE3F5` / `#C4B2FF` |
| Crépuscule (corail + ambre) | `#A63A1C` / `#8A4D00` | `#FF9C84` / `#FFC56E` |
| Menthe (vert d'eau + sauge) | `#0A6459` / `#256A28` | `#5EE6D0` / `#93E89A` |
| Iris (indigo + rose) | `#4540C8` / `#A11F60` | `#A9B2FF` / `#F7A4CF` |

**Contraste** : texte, secondaire, primaire, accent 2 et les 4 statuts ≥ 4,5:1 pour 5 palettes × clair / sombre /
nuit, les 288 instants de l'Auto, les 20 transitions de palette (3 étapes chacune), sur **toutes les couleurs de la
scène** (ciel, horizon, astre, dunes, arche, maison de verre, fenêtre, eau) et sur **chaque matière posée sur chacune
d'elles** (verre optique + lumière interne + reflet spéculaire, verre givré / fumé, mate, creux, teintes, tuiles
éclairées de l'intérieur aux couleurs de la palette et des statuts). Exclus : traits ≤ 2 px (liseré de l'astre, arête
de l'arche, reflets de l'eau). Bouton principal : texte ≥ 4,5:1 sur chaque arrêt de son dégradé.

## 3. Matières (`theme.material.surfaces`, `src/components/surfaces`)

| Matière | Usage | Couches | Clair | Sombre |
|---|---|---|---|---|
| **Verre optique** `optical` | scène principale, commande flottante (barre d'onglets, capsule d'action, carte de tête) | flou 48 (ou `GlassView` iOS 26+) → remplissage → lumière interne teintée (haut-gauche → bas-droite) → reflet spéculaire du coin éclairé → arête haute claire (concentrée côté lumière) + arête gauche qui s'éteint + contre-reflet coloré en bas → ombre physique `high` + **ombre colorée** de l'accent | blanc teinté 7 %, 66 % | fumée teintée 8 %, 76 % |
| **Verre givré / fumé** `frosted` | navigation, panneaux, filtres, commandes | flou 32 → remplissage → reflet doux → arête haute fine → ombre `mid` | blanc 80 % | fumée 82 % |
| **Surface mate** `matte` | longues listes, formulaires, textes, données | opaque, aucun flou, liseré à peine visible, ombre `low` — **jamais de verre** | `#FCFBF9` | obsidienne relevée (≈ `#121618`) |

- `Card` (ui.tsx) et `GlassSurface` (≈ 30 écrans) : remplissage opaque ⇒ **mate** automatiquement, sans flou
  (lecture rapide, coût de rendu nul) ; un remplissage translucide devient du verre givré ; les anciens remplissages
  violets codés en dur (`rgba(40,32,70,…)`) sont remplacés par le verre fumé du thème.
- `LiquidGlass` → `Surface` (`kind` : `optical` par défaut en `floating`, `frosted` pour les panneaux).
- Plateformes : iOS 26+ `GlassView` (détection protégée inchangée : `isLiquidGlassAvailable()` ET
  `isGlassEffectAPIAvailable()`) + voile de lisibilité ; iOS ancien / web : `BlurView` (le flou porte lui-même ses
  coins — le web ignore l'arrondi du parent) ; Android : remplissage seul ; Réduire la transparence et nuit : opaque.
- Lumière : `theme.material.light` (direction haut-gauche → bas-droite, arête, reflet) — une seule source.
- Rayons v3 : `sm 12 · md 18 · lg 26 · xl 34 · tile 30 · sheet 34 · orb 24 · pill`.

```tsx
import { OpticalGlass, FrostedGlass, MatteSurface, Surface } from '@/components/surfaces';
<OpticalGlass radius={radius.xl} padded={spacing.md} tint={statusColor?}>…</OpticalGlass>
<Surface kind="frosted" edges="top" contentStyle={…}>…</Surface>
```

## 4. Scène « désert sci-fi » (`DesertScene`)

Création originale, 100 % SVG + dégradés en couches (aucune image générée ni copiée) : ciel, lueur d'horizon, astre
géant éclairé d'en haut à gauche (bandes atmosphériques, liseré), arche de pierre, dunes minérales, **maison de verre à
la fenêtre allumée** (le foyer HOMI), eau calme qui reflète l'astre et la fenêtre. Couleurs : `theme.material.scene`,
calculées depuis les lueurs de la palette (`sceneColors`).

| Variante | Où | Contenu |
|---|---|---|
| `immersive` | ouverture, accueil, états vides importants (`backdropVariant` : `/`, `/welcome`, `/intro`, `/onboarding`) | scène complète |
| `calm` | tous les autres écrans (denses) | ciel, petit astre dans le coin, horizon et eau très bas : rien sous le contenu |

- Fond de coque (`Backdrop`, `src/app/_layout.tsx`) : remplace `PowderSky` (conservé comme alias). **Particules
  décoratives (« étoiles ») supprimées** (`StarField` ne rend plus rien).
- Parallaxe légère (Reanimated, fil UI) : 4 plans, 3 → 12 px, 22 s aller-retour. **Image fixe** (`sceneAnimates`) :
  Réduire les animations, économie d'énergie, nuit, application en arrière-plan, scène hors écran (`active={false}`).
- Vignette : dans une boîte plus large que haute (aperçu, état vide), la scène entière est montrée à l'échelle et
  les bandes (ciel, dunes, eau) débordent pour remplir. `<DesertScene variant="immersive" active={focused} />`.
- Web : three.js / React Three Fiber **non installés** — évolution possible derrière ce même composant (réfraction du
  verre, eau animée sur ordinateur), à ne faire qu'avec un repli identique à la version SVG.

## 5. Famille de commandes (`src/components/controls`)

Une seule source pour courbes (`src/motion`), reflets (`theme.material.light`), teintes, ombres et opacités.

| Commande | Repos | Pression | Focus | Sélection | Chargement | Succès / erreur | Désactivé |
|---|---|---|---|---|---|---|---|
| `PrimaryButton` (= `Button` primary) | verre teinté de la palette (dégradé + lumière interne), arête fine, libellé contrasté, ombre colorée | s'enfonce 0,98 + reflet qui traverse (320 ms) | anneau global (web) | — | indicateur à la place du libellé, **largeur stable**, appuis suivants **ignorés** (pas de double soumission), `busy` annoncé | respiration 1 → 1,03 / tremblement + message | fondu 0,48, sans ombre |
| `SecondaryButton` | verre givré / fumé, reflet discret | 0,98 + voile | anneau | — | idem | idem | idem |
| `IconOrb` (ajouter, fermer, options) | disque optique 40 / 48 / 56 px, reflet du coin éclairé, arête claire ; **nom accessible obligatoire** ; cible ≥ 48 px (`hitSlop`) | 0,92 en ressort `vif`, retour `rebondLeger` | anneau | lumière diffuse derrière + `selected` | — | — | 0,45, sans lumière ni haptique |
| `ChoiceGroup` `pills` (segmented, durée, catégorie, membre) — `Segmented` y délègue | rail en creux | haptique « sélection » | anneau | **indicateur de verre teinté qui GLISSE** (ressort `panneau`) + lumière diffuse + **gras + coche** (≥ 92 px par option) | — | — | — |
| `ChoiceGroup` `orbs` (humeur) | orbes givrés + libellé | idem | anneau | l'orbe choisi grandit (1,08) avec lumière diffuse, les autres se resserrent (0,94) ; pastille à coche ; gras | — | — | — |
| `DataTile` | surface mate `tile` (30), lumière INTERNE radiale (palette ou statut), valeur grande et fine (Space Grotesk 500, 40, chiffres tabulaires), unité, contexte (période) ; micrographique `Sparkline` **seulement avec ≥ 2 valeurs réelles** | 0,98 (si appuyable) ; avec `morphId` : transition carte → détail | anneau | — | — | — | **état vide explicite** (« — » + texte) |
| `SensitiveButton` | libellé explicite, couleur sémantique (erreur) | 0,98, **sans reflet** (mouvement sobre) | anneau | — | idem bouton | idem | idem |

- `ChoiceGroup variant="orbs" light="travel"` (ajout rétro-compatible, pilote Humeur → journal) : UNE lumière diffuse
  glisse vers l'orbe choisi (ressort `panneau`) au lieu de s'allumer sous chacun ; les autres orbes glissent vers lui
  (`CHOICE.orbGather`, réduit à la place libre : 0 à 320 px). Défaut `each` inchangé.
- Statuts : couleur + icône + libellé, jamais la couleur seule.
- **Un seul point focal lumineux par écran** : l'action principale OU la sélection active (GlowCard, indicateur,
  capsule d'action). Les listes restent mates (`GlowCard still`, pas de faisceau).
- `Chip` : choisi plein = verre teinté (reflet haut) ; choisi « lavande » = coche en plus de la teinte.
- `Toggle` : capsule allumée au dégradé de la palette ; `Field` : creux qui s'éclaire au focus (liseré + halo).
- `Dock` : capsule de **verre optique** flottante, indicateur de verre teinté qui **glisse** vers l'onglet actif
  (ressort `panneau`, lumière diffuse), bouton rond d'action à droite (capsule turquoise lumineuse, reflet à la
  pression).

```tsx
import { PrimaryButton, SecondaryButton, SensitiveButton, IconOrb, ChoiceGroup, DataTile } from '@/components/controls';
<PrimaryButton label={t('save')} onPress={() => save()} />            // promesse → chargement, double appui bloqué
<IconOrb icon="plus" label={t('add')} tone="accent" onPress={open} />
<ChoiceGroup label={t('duration')} value={d} onChange={setD} options={[{ value: '15', label: '15 min' }, …]} />
<ChoiceGroup variant="orbs" label={t('mood')} value={m} onChange={setM} options={[{ value: 'calm', label, icon: 'feather' }, …]} />
<DataTile label={t('sleep')} value={formatNumber(7.4)} unit="h" context={t('week')} series={real} morphId={`sleep-${id}`} onPress={() => router.push(…)} />
<SensitiveButton label={t('leaveHousehold')} confirmMessage={…} onPress={leave} />
```

## 6. Mouvement (détails : `MOTION_SYSTEM.md`)

Familles : **micro 120–180 ms** (pression, coche, pastille) · **panneaux 220–320 ms** (panneau du bas, sélecteur,
indicateur) · **scènes 320–450 ms** (carte → détail, palette, fondu de mode). Interruptibles (ressorts et `withTiming`
repartent de la valeur courante). Réduire les animations / économie d'énergie → états finaux ou fondus simples.

- **Panneau du bas gestuel** (`Sheet`, API inchangée) : suit le doigt, crans moyen + grand, fermeture cohérente,
  clavier → grand cran.
- **Morph carte → détail** : `MorphSource` / `useMorphSource(id).open(navigate)` côté carte, `MorphTarget id` côté
  détail, `MorphHost` monté une fois dans `_layout.tsx`. Retour vers le même élément (rectangle re-mesuré).

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

Rendu iOS natif (GlassView, flou réel), Android (boxShadow coloré, absence de flou), geste du panneau au doigt sur
appareil, VoiceOver / TalkBack, FPS / ProMotion, coût de la parallaxe sur appareil bas de gamme. Vérifié : TypeScript,
Jest, export web, E2E Chromium (`e2e/apparence_v3.py`, dont `reducedMotion: 'reduce'`), captures deviceScaleFactor 2.
