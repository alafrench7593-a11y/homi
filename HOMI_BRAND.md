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

## Palette v2 « Lumière sur graphite » (13/11/2026, verrouillée par `src/__tests__/contrast.test.ts`)

Décision de la propriétaire : remplace la palette perle / prune / lilas / champagne. Détails, Auto et règles d'usage :
`HOMI_DESIGN_SYSTEM.md`.

| Rôle | Clair « Ivoire » | Sombre « Graphite » | Nuit (soins nocturnes) |
|---|---|---|---|
| Fond | `#F4F1EB` ivoire chaud | `#0D0E11` graphite (neutre, pas violet) | `#09090C` |
| Texte | `#1C1B20` | `#F3F2F5` | `#D9D6DE` |
| Texte secondaire | `#55525C` | `#A9A8B3` | `#9B98A5` |
| Primaire / accent 2 | encres de la palette | lueurs de la palette | lueurs mêlées de gris (35 %) |
| Succès · attention · erreur · info | `#1B6234` · `#7E4800` · `#A51F2B` · `#1D5AA6` | `#8BE0A6` · `#F7C770` · `#FF9A93` · `#9CC4FF` | `#94C29E` · `#D9B577` · `#E8A3A0` · `#9EB6D8` |

| Palette | Encres (clair) | Lueurs (sombre) |
|---|---|---|
| Aurore (cyan + violet, signature) | `#0A6176` · `#5E36C4` | `#6FE3F5` · `#C4B2FF` |
| Crépuscule (corail + ambre) | `#A63A1C` · `#8A4D00` | `#FF9C84` · `#FFC56E` |
| Menthe (turquoise + vert) | `#0A6459` · `#256A28` | `#5EE6D0` · `#93E89A` |
| Iris (indigo + rose) | `#4540C8` · `#A11F60` | `#A9B2FF` · `#F7A4CF` |

Auto : Menthe dès 6 h, Aurore dès 11 h, Crépuscule dès 17 h, Iris dès 21 h (fondu d'une heure par paliers de 5 min).
Contraste : texte, texte secondaire, liens, accent 2 et statuts ≥ 4,5:1 (WCAG AA) sur fond, dégradé, cartes, verre et
teintes, pour les 4 palettes × 3 modes **et** les 288 instants de l'Auto, sans exception tolérée. Le rouge reste
réservé aux urgences et erreurs, toujours avec icône et libellé.

## Fonds

Le fond vidéo d'Au fil de nous (ciel rose et pêche, fil doré) est retiré de la coque de l'application et remplacé par le fond vectoriel `PowderSky` : v2, ivoire ou graphite avec les lueurs de la palette affichée (moins de batterie ; immobile avec « Réduire les animations » ou en économie d'énergie). Restent à remplacer : fonds vidéo propres à certains écrans (Suivi, histoire de l'enfant), vidéo d'introduction cinématique, captures store.

## Typographie

Inchangée pour l'instant : Space Grotesk (titres), Manrope (texte), Instrument Serif italique (voix éditoriale). Revue prévue avec le design system.
