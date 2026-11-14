# HOMI — Marque

Nom de travail : **HOMI — Your Family, One Home**. Disponibilité (INPI, EUIPO, stores, domaines) **non vérifiée** : à faire avant tout investissement marketing.

## Logo — v5 « maison » (14/11/2026)

**Décision du propriétaire (14/11/2026) : le logotype « lentille » v4 (commit `a76b511`, O lentille de verre) est
ABANDONNÉ.** Retour au logo MAISON, logo officiel : une maison violette aux contours lumineux, deux parents et deux
enfants au centre (silhouettes blanc → lavande ; parents identiques, aucun stéréotype de genre). Dessin d'origine (v1–v3,
13/11/2026) inchangé ; seules les couleurs sont accordées aux fonds actuels :

| Variante | Fond | Maison | Contour | Silhouettes | Nom « HOMI » |
|---|---|---|---|---|---|
| claire | ivoire `#F1EEE7` | violet `#7A52E6` → `#3F2196` | `#F4EFFF` → `#C3B0FA` → `#8C6FEA` sur un liseré `#2E1872` (net sur ivoire) | `#FFFFFF` → `#D9CCFF` | `#2A1A66` |
| sombre | obsidienne `#06090B` | violet `#7C55EA` → `#3B1E8E` | `#FFFFFF` → `#D6C8FF` → `#9F86F2` | `#FFFFFF` → `#D6C8FF` | `#F2EEFF` |
| monochrome | — | contour épais (14 u) | — | pleines | couleur du texte |

Lisibilité vérifiée de 16 à 1024 px (planche en tailles réelles : `node scripts/homi/brand.mjs --planche` →
`assets/brand/preview/planche-maison.png`) : la maison et ses quatre silhouettes restent distinctes dès 24 px ; à 16 px
la maison violette au contour clair reste identifiable (favicon, onglets).

### Fichiers

| Fichier | Usage |
|---|---|
| `assets/brand/homi-mark-{light,dark,mono}.svg` | la maison : claire (ivoire), sombre (obsidienne), monochrome (`currentColor`) ; `homi-mark.svg` = claire |
| `assets/brand/homi-app-icon.svg` | tuile d'icône : la maison sur obsidienne, halo violet |
| `assets/icon.png`, `android-icon-{foreground,background,monochrome}.png`, `splash-icon.png` (claire), `splash-icon-dark.png`, `favicon.png` | générés pour Expo (`app.config.ts` : fond adaptatif `#06090B`, écran de lancement ivoire `#F1EEE7` / obsidienne `#06090B`) |
| `src/brand/homiMarkSvg.ts` | mêmes tracés pour l'application (SVG complets, maison, longueur du contour, silhouettes, couleurs) |

Source unique : `node scripts/homi/brand.mjs`. Test : `src/__tests__/homiLogo.test.tsx`.

### Composants (`src/components/BrandLogo.tsx`)

- `BrandLogo` (API inchangée `size`, `style` ; `tone` facultatif) : la maison ; `BrandMono`, `BrandShine`, `BrandLine`.
- `BrandName` : le nom « HOMI » dans la typographie de l'app (Space Grotesk 700), couleur de la marque, taille fixe.
- `BrandWordmark` (`height`, `tone`, `color`, `decorative`, `header`, `testID`) : maison + nom HOMI à côté.
- `BrandStack` : maison + nom dessous (composition du logo animé, écran de chargement, introduction).
- `HomiLogoAnimated` : le logo animé — voir `MOTION_SYSTEM.md` › « Logo animé ».

Où : en-tête de l'accueil sans compte (maison + nom) et point focal (maison) ; connexion, inscription, onboarding
(maison en point focal + nom HOMI) ; introduction (/cinematic : logo animé ; diapositives : maison + nom) ; écran de
chargement ; Réglages › À propos ; Paywall (maison) ; écran de lancement natif ; « Découvrir HOMI ».

***À faire** : disponibilité juridique du nom (voir plus haut).

Historique : v1–v3 (13/11/2026) maison lumineuse + famille ; v4 (14/11/2026) logotype « lentille » — abandonné le
14/11/2026 par décision du propriétaire, fichiers supprimés (`homi-wordmark-*`, `homi-sign-*`, `explorations/`) ;
v5 (14/11/2026) retour à la maison, couleurs accordées à ivoire / obsidienne, animation full motion.

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
