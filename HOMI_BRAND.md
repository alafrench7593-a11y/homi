# HOMI — Marque

Nom de travail : **HOMI — Your Family, One Home**. Disponibilité (INPI, EUIPO, stores, domaines) **non vérifiée** : à faire avant tout investissement marketing.

## Logo — v4 « lentille » (14/11/2026)

Décision du propriétaire : le pictogramme maison + famille, détaché du nom, est **remplacé** par un **logotype
complet** : les quatre lettres H · O · M · I sont dessinées ensemble, et le **O est une lentille de verre** sertie
dans un anneau — un reflet (croissant, en haut à gauche) capte la lumière ; une caustique pêche (en bas à droite) la
transmet au reste du mot (lueur lilas portée sur le M et le I). Dessin vectoriel ORIGINAL : capitales construites sur
une grille de 100 (fût de 20, angles arrondis de 3,2 / 1,6), O à dépassement optique (rayon 52), aucune police rendue
en texte — le logo est identique sur iOS, Android, web et dans les PNG. Ce n'est la copie d'aucun logo existant.

### Deux pistes explorées (`assets/brand/explorations/`)

| Piste | Idée | Fichiers |
|---|---|---|
| 1 — **lentille** (retenue) | le O devient une lentille de verre qui capte et transmet un reflet au mot | `piste1-lentille-{wordmark,sign}-{light,dark,mono}.svg` |
| 2 — foyer & lien | le H porte un toit (pignon : le foyer), le O est fait de deux anneaux entrelacés (le lien), M et I liés par une ligature en pied | `piste2-foyer-{wordmark,sign}-{light,dark,mono}.svg` |

Planche comparative en tailles réelles (mot à 16 / 24 / 32 / 48 / 96 px de haut, signe à 16–48 px ; clair, sombre,
monochrome) : `explorations/planche-pistes.png`. Mesures (monochrome noir sur blanc, `explorations/mesures.json`,
régénérées par `node scripts/homi/brand.mjs --explorations`) :

| Hauteur du mot | Lecture du nom — piste 1 | piste 2 | Contreformes (trous) — piste 1 | piste 2 |
|---|---|---|---|---|
| 16 px | **91,3 %** | 74,9 % | 1 | 5 |
| 24 px | **94,2 %** | 76,4 % | 1 | 7 |
| 32 px | **95,0 %** | 76,2 % | 1 | 13 |
| 48 px | **96,5 %** | 76,7 % | 1 | 9 |
| 96 px | 97,3 % | 76,0 % | 1 | 11 |

- *Lecture du nom* : corrélation entre le mot rendu en petit (agrandi) et des capitales canoniques H · O · M · I
  tracées sur la même grille. Biais assumé : la piste 1 garde ces capitales et n'ajoute que le reflet, elle part donc
  favorite ; la mesure répond à la seule question qui compte en petit format — **le nom HOMI se lit-il encore ?** La
  piste 2 plafonne à ≈ 76 % : le double anneau se lit « OO » (« HOOMI ») et la ligature MI se lit « Ш ».
- *Contreformes* : la lentille garde exactement la même contreforme de 16 à 96 px (aucune fusion) ; la piste 2 passe de
  5 à 13 trous selon la taille — les anneaux entrelacés se bouchent ou se fragmentent.
- *Distinction du signe* (signe comparé à sa forme générique : anneau sans reflet / H à traverse droite) : piste 1
  1,8 → 3,4 points de 16 à 48 px, piste 2 2,0 → 3,9. Le toit du H se distingue un peu plus d'un H ordinaire ; mais un
  H seul ne dit pas HOMI, alors que l'anneau + reflet est le O du mot, et le verre en couleur le rend immédiatement
  identifiable (icône).

**Choix : piste 1**, la plus reconnaissable en petit format et en monochrome (nom lisible, dessin stable, un seul
détail signature qui survit jusqu'à 16 px : le reflet dans le O).

### Fichiers (piste retenue)

| Fichier | Usage |
|---|---|
| `assets/brand/homi-wordmark-light.svg` | mot-symbole, version **claire** (fond ivoire : encre bleu brume, verre bleu brume / pêche, reflet lilas) |
| `assets/brand/homi-wordmark-dark.svg` | version **sombre** (fond obsidienne : lettres nacrées éclairées de haut à gauche, verre fumé, lumière directionnelle) |
| `assets/brand/homi-wordmark-mono.svg` | **monochrome** (`currentColor`) : anneau + reflet plein ; impression, gravure, petits formats |
| `assets/brand/homi-sign-{light,dark,mono}.svg` | **signe compact** = la lentille du O (même tracé, recadré) |
| `assets/brand/homi-app-icon.svg` | tuile d'icône : la lentille sur obsidienne, halo bleu brume |
| `assets/icon.png`, `android-icon-{foreground,background,monochrome}.png`, `splash-icon.png` (clair), `splash-icon-dark.png`, `favicon.png` | générés pour Expo (`app.config.ts` : fond adaptatif `#06090B`, écran de lancement ivoire `#F1EEE7` / obsidienne `#06090B`) |
| `assets/brand/preview/icon-{24,48,1024}.png` | aperçus de l'icône (`--preview`) |
| `src/brand/homiMarkSvg.ts` | mêmes tracés pour l'application (SVG complets, lettres, lentille, calques de l'animation, couleurs) |

Source unique : `node scripts/homi/brand.mjs` régénère tout ; `--explorations` ajoute les pistes, la planche et les
mesures ; `--preview` les aperçus d'icône. Test : `src/__tests__/homiLogo.test.tsx` (SVG livrés = module de l'app,
aucune police, calques = mot-symbole).

### Composants

- `BrandWordmark` (`src/components/BrandLogo.tsx`) : mot-symbole fixe — `height`, `tone` (`auto` | `light` | `dark` |
  `mono` + `color`), annoncé « HOMI » (en-tête par défaut, `header={false}` ou `decorative`).
- `BrandLogo` (API inchangée `size`, `style`) : le signe compact (lentille) ; `BrandMono`, `BrandShine`, `BrandLine`.
- `HomiLogoAnimated` (`src/components/HomiLogoAnimated.tsx`) : le logo animé comme un seul objet — voir
  `MOTION_SYSTEM.md` › « Logotype animé ».

Où : en-tête de l'accueil sans compte, connexion et inscription (lentille + mot-symbole au-dessus du titre),
onboarding, introduction (/cinematic : logo animé ; diapositives : mot-symbole), écran de chargement, Réglages › À
propos, écran de lancement natif. Le Paywall garde le signe compact.

***À faire** : validation par la propriétaire ; disponibilité juridique du nom (voir plus haut).

Historique : v1–v3 (13/11/2026) maison lumineuse + deux parents et deux enfants (dessin retiré le 14/11/2026).

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
