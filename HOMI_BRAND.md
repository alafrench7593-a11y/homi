# HOMI — Marque

Nom de travail : **HOMI — Your Family, One Home**. Disponibilité (INPI, EUIPO, stores, domaines) **non vérifiée** : à faire avant tout investissement marketing.

## Logo

Maison lumineuse aux bords arrondis, deux parents et deux enfants au centre. Dessin original inspiré de la référence fournie (maison violette, famille lavande/blanc), pas une copie. Les deux parents ont la même silhouette : aucun stéréotype de genre.

| Fichier | Usage |
|---|---|
| `assets/brand/homi-mark.svg` | Marque couleur, fond transparent |
| `assets/brand/homi-mark-mono.svg` | Monochrome (`currentColor`) : petits formats, impression, gravure |
| `assets/brand/homi-app-icon.svg` | Tuile d'icône (fond midnight + halo) |
| `assets/icon.png`, `android-icon-*.png`, `splash-icon.png`, `favicon.png` | Générés pour Expo |
| `src/brand/homiMarkSvg.ts` | Même tracé, utilisé par `BrandLogo`, `BrandShine`, `BrandMono` |

Source unique : `node scripts/homi/brand.mjs` régénère tout (`--preview` ajoute des aperçus 24/32/48/96 px dans `assets/brand/preview/`).
Lisibilité vérifiée visuellement : maison + famille identifiables de 96 à 32 px ; à 24 px la maison et les quatre têtes restent lisibles, les silhouettes se simplifient.

***À faire** : mot-symbole « HOMI » vectorisé (aujourd'hui texte de l'app) ; validation par la propriétaire.

**v2 (13/11/2026)** : dessin et couleurs du logo **inchangés** (maison violette, famille lavande / blanche). Vérifié
visuellement sur graphite `#0D0E11` et sur ivoire `#F4F1EB` (écran d'accueil sans compte, captures web) : la maison
violette et la famille claire restent lisibles et contrastées sur les deux fonds ; le violet du logo s'accorde avec la
palette Aurore (`#5E36C4` / `#C4B2FF`). Aucune régénération des icônes n'a été nécessaire (`scripts/homi/brand.mjs`
non relancé).

**v3 (13/11/2026)** : dessin et couleurs du logo **inchangés** ; il se pose sur l'obsidienne `#06090B` et l'ivoire
minéral `#F1EEE7` (vérification visuelle sur les captures web de l'écran d'accueil sans compte à refaire par l'agent
« entrée / onboarding », propriétaire de cet écran). Le violet du logo reste accordé à la palette Aurore ; une variante
turquoise du logo pour la palette signature est **à décider** (non faite : `scripts/homi/brand.mjs` non relancé).

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
