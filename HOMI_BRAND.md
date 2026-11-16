# HOMI — Marque

Nom de travail : **HOMI — Your Family, One Home**. Disponibilité (INPI, EUIPO, stores, domaines) **non vérifiée** : à faire avant tout investissement marketing.

## Logo — v5 « encre » (16/11/2026)

**Décision de la propriétaire (16/11/2026) : le logo officiel de HOMI est SON logo, en ENCRE.** Il remplace
complètement le logo maison violet (maison + deux parents + deux enfants, v5 du 14/11/2026) et, avant lui, le logotype
« lentille » v4. Le violet disparaît de la marque.

Le logo : un **symbole « M » formé de deux personnes** (l'une avec un chignon : deux têtes rondes posées sur un corps
en « M ») et le **mot-symbole « HOMI »** arrondi (point du i rond). Assemblage officiel : symbole à gauche, mot à droite,
bases alignées (`homi-logo-encre.svg`, rapport 1402 × 430).

| Variante | Couleur | Fond |
|---|---|---|
| encre (`light`) | `#1F1B1A` | fonds clairs : ivoire rosé `#FBF4F2` (app), `#EFE2DA` (icône) |
| ivoire (`dark`) | `#F7F1E8` | fonds sombres : prune-anthracite `#1A1217`, nuit `#0E0A0C` |
| monochrome (`mono`) | `currentColor` | cas techniques (éclat, icône monochrome Android en blanc) |

Même dessin dans les deux couleurs ; aucune autre couleur, aucun dégradé, aucun effet.

### Sources et fichiers

Sources fournies par la propriétaire (vectorielles, propres, **utilisées telles quelles, jamais redessinées**) :
`assets/brand/source-v5/` — `homi-logo-{encre,ivoire}.svg`, `homi-motsymbole-{encre,ivoire}.svg`,
`homi-symbole-{encre,ivoire}.svg`, `homi-icone-monochrome.png` (icône d'app 1024, encre sur ivoire rosé `#EFE2DA`).

Source unique : `node scripts/homi/brand.mjs` (`--planche` : planche 16 → 256 px dans `assets/brand/preview/`, non
versionnée) lit ces sources et génère :

| Fichier | Usage |
|---|---|
| `assets/brand/homi-symbole-{encre,ivoire,mono}.svg` | le symbole « M » seul |
| `assets/brand/homi-motsymbole-{encre,ivoire,mono}.svg` | le mot « HOMI » seul |
| `assets/brand/homi-logo-{encre,ivoire,mono}.svg` | le logo complet (assemblage officiel) |
| `assets/brand/homi-app-icon.svg` | tuile d'icône vectorielle (même rendu que l'icône PNG de la propriétaire) |
| `assets/icon.png` | icône iOS / principale = `homi-icone-monochrome.png` (symbole à 70 % de la hauteur, sans transparence) |
| `assets/android-icon-{foreground,background,monochrome}.png` | adaptatif : symbole encre à 50 % (zone sûre), fond `#EFE2DA`, monochrome blanc |
| `assets/splash-icon.png`, `splash-icon-dark.png` | écran de lancement : symbole encre / ivoire (fonds `#FBF4F2` / `#1A1217`, `app.config.ts`) |
| `assets/favicon.png` | favicon 48 px (tuile d'icône) |
| `src/brand/homiMarkSvg.ts` | mêmes tracés pour l'application : SVG complets (`HOMI_SVG`), couleurs (`HOMI_INK`), assemblage (`HOMI_LOCKUP`), pièces du logo animé (`HOMI_PARTS` : têtes, corps, lettres, point du i — sous-tracés exacts de la source) |

Test : `src/__tests__/homiLogo.test.tsx` (SVG livrés = module de l'app, tracés = sources, encre / ivoire seulement,
aucune police, anciennes sources retirées).

### Règles d'usage

- **Zone de protection** : autour du logo (symbole seul ou logo complet), un espace libre au moins égal à la **hauteur
  du point du i** (≈ 20 % de la hauteur du logo complet, ≈ 20 % de celle du symbole) ; aucun texte, bord ou image dedans.
- **Taille minimale** : symbole **16 px** de haut (favicon, onglets) ; logo complet **16 px** de haut (le mot reste
  lisible), 20 px conseillés en en-tête.
- **Couleurs** : encre sur fond clair, ivoire sur fond sombre. **Interdit** : toute autre couleur (violet, corail,
  dégradé, contour, ombre portée), un fond qui réduit le contraste, la **déformation** (étirer, incliner, faire
  pivoter, changer les proportions ou l'espacement symbole / mot), redessiner ou recomposer les lettres, remplacer le
  mot-symbole par une police.

### Composants (`src/components/BrandLogo.tsx`)

- `BrandLogo` (API inchangée `size`, `style` ; `tone` facultatif) : le **symbole** ; `BrandMono`, `BrandShine`, `BrandLine`.
- `BrandName` : le **mot-symbole** « HOMI » seul (dessin, aucune police).
- `BrandWordmark` (`height`, `tone`, `color`, `decorative`, `header`, `testID`) : le **logo complet** (largeur ≈ 3,26 × hauteur).
- `BrandStack` (`width`) : le logo complet à une largeur donnée — image finale du logo animé, écran de chargement, introduction.
- `useBrandTone` : `auto` = encre en clair, ivoire en sombre. Accessibilité : le logo est annoncé « HOMI ».
- `HomiLogoAnimated` : le logo animé — voir `MOTION_SYSTEM.md` › « Logo animé ».

Où : accueil sans compte (/welcome, petit logo en tête), connexion et inscription (petit logo en tête), introduction
(/intro : logo complet), écran de chargement, Réglages › À propos, ouverture de « Découvrir HOMI » (logo animé),
introduction de lancement (logo animé), écran de lancement natif et icônes (symbole). Les illustrations 3D
(`assets/illustrations`) ne changent pas.

***À faire** : disponibilité juridique du nom (voir plus haut).

Historique : v1–v3 (13/11/2026) maison lumineuse + famille ; v4 (14/11/2026) logotype « lentille » — abandonné ;
v5 « maison » (14/11/2026) maison violette — remplacée le 16/11/2026 par le logo de la propriétaire (v5 « encre »).

## Palette v3 « Désert sci-fi » (13/11/2026, verrouillée par `src/__tests__/contrast.test.ts`)

Décision du propriétaire : remplace la v2 « Lumière sur graphite ». Direction : Apple Keynote × Black Mirror × Liquid
Glass, désert sci-fi de nuit — obsidienne, sable minéral, turquoise néon, astre géant, maison de verre. Détails, Auto,
matières et règles : `HOMI_DESIGN_SYSTEM.md`.

| Rôle | Clair « ivoire minéral » | Sombre « obsidienne » | Nuit (soins nocturnes) |
|---|---|---|---|
| Fond | `#F1EEE7` | `#06090B` (froid, presque neutre) | `#060708` |
| Texte | `#13181A` | `#EDF3F2` | `#D6DADB` |
| Texte secondaire | `#4A5154` | `#A9B3B4` | `#979EA1` |
| Primaire / accent 2 | encres de la palette | lueurs de la palette | lueurs mêlées de gris (35 %) |
| Succès · attention · erreur · info | `#1B6234` · `#7A4600` · `#A51F2B` · `#1D5AA6` | `#8BE0A6` · `#F7C770` · `#FF9A93` · `#9CC4FF` | `#94C29E` · `#D9B577` · `#E8A3A0` · `#9EB6D8` |

| Palette | Encres (clair) | Lueurs (sombre) |
|---|---|---|
| **Turquoise** (signature : turquoise néon + sable minéral) | `#00646A` · `#7A4E12` | `#46E3D6` · `#E9C58C` |
| Aurore (cyan + violet) | `#0A6176` · `#5E36C4` | `#6FE3F5` · `#C4B2FF` |
| Crépuscule (corail + ambre) | `#A63A1C` · `#8A4D00` | `#FF9C84` · `#FFC56E` |
| Menthe (vert d'eau + sauge) | `#0A6459` · `#256A28` | `#5EE6D0` · `#93E89A` |
| Iris (indigo + rose) | `#4540C8` · `#A11F60` | `#A9B2FF` · `#F7A4CF` |

Auto : Menthe dès 6 h, **Turquoise** dès 11 h, Crépuscule dès 17 h, Iris dès 21 h (fondu d'une heure par paliers de
5 min). Contraste ≥ 4,5:1 (WCAG AA), sans exception tolérée, sur le fond, chaque couleur de la scène et chaque matière.
Le rouge reste réservé aux urgences et erreurs, toujours avec icône et libellé.

## Fonds

v3 : la coque de l'application affiche la scène vectorielle originale « désert sci-fi » (`DesertScene` : astre,
arche de pierre, dunes minérales, maison de verre à la fenêtre allumée, eau qui reflète), immersive à l'ouverture et
sur l'accueil, calme ailleurs ; parallaxe légère, image fixe avec Réduire les animations, en économie d'énergie, en
arrière-plan et la nuit. Les particules décoratives (« étoiles ») sont supprimées. `PowderSky` reste un alias. Restent
à remplacer : fonds vidéo propres à certains écrans (Suivi, histoire de l'enfant), vidéo d'introduction cinématique,
captures store.

## Typographie

Space Grotesk (titres ; chiffres des tuiles de données en 500, grands et fins, tabulaires), Manrope (texte), Instrument Serif italique (voix éditoriale).
