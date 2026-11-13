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

**À faire** : états animés du logo (splash maison → silhouettes, Reanimated) ; mot-symbole « HOMI » vectorisé (aujourd'hui texte de l'app) ; validation par la propriétaire.

## Palette (verrouillée par `src/__tests__/contrast.test.ts`)

| Rôle | Clair « Perle » | Sombre « Minuit » | Nuit (soins nocturnes) |
|---|---|---|---|
| Fond | `#F4F0FA` perle lilas | `#16112B` midnight violet | `#0F0B1E` |
| Texte | `#1C1533` | `#F7F4FB` perle | `#DDD0EC` |
| Texte secondaire | `#584D72` | `#C3B8DD` | `#A598C0` |
| Primaire (liens, boutons) | `#5B2A86` prune | `#CDBEFA` lilas | `#B9A6EA` |
| Accent | `#E9CFA4` champagne | `#E9CFA4` | `#CDB48A` |
| Urgences | `#A3243A` | `#FF97A6` | `#F0A0AA` |

Contraste : tous les textes ≥ 4,5:1 (WCAG AA) sur fond, carte et carte secondaire, dans les trois thèmes, **sans exception tolérée** (41 tests). Le rouge reste réservé aux urgences.

## Fonds

Le fond vidéo d'Au fil de nous (ciel rose et pêche, fil doré) est retiré de la coque de l'application et remplacé par le ciel vectoriel `PowderSky` aux couleurs HOMI (moins de batterie ; immobile avec « Réduire les animations » ou en économie d'énergie). Restent à remplacer : fonds vidéo propres à certains écrans (Suivi, histoire de l'enfant), vidéo d'introduction cinématique, captures store.

## Typographie

Inchangée pour l'instant : Space Grotesk (titres), Manrope (texte), Instrument Serif italique (voix éditoriale). Revue prévue avec le design system.
