# Au Fil de Nous — Iconography System

Bibliothèque de pictogrammes SVG **originaux** de l'application « Au fil de nous » : 47 symboles (femme, bébé,
famille) dessinés à la main en chemins SVG, inspirés du logo officiel (`assets/brand/logo-transparent.png`, non
modifié) : un fil doré continu, délicat, aux extrémités arrondies, des feuilles à nervure centrale, des courbes
souples et des boucles.

| Fichier | Rôle |
|---|---|
| `src/components/icons/MaternityIcon.tsx` | Composant `MaternityIcon` (rendu react-native-svg, accessibilité, état actif, animation du fil) |
| `src/components/icons/maternityPaths.ts` | Tracés des 47 symboles, groupes, noms typés (`MaternityIconName`) |
| `src/components/icons/geometry.ts` | Primitives de dessin (cercle, arc, goutte, cœur, feuille, rectangle arrondi) et calcul de longueur de tracé |
| `src/components/icons/index.ts` | Point d'entrée (`import { MaternityIcon } from '@/components/icons'`) |
| `scripts/icon-sheet.mjs` | Planche de contrôle HTML (aucune route ajoutée à l'application) |
| `src/__tests__/maternityIcons.test.tsx` | Tests Jest (tracés, absence de texte, grille, accessibilité, état actif, animation, réduire les animations) |

## Utilisation

```tsx
import { MaternityIcon } from '@/components/icons';

<MaternityIcon name="echographie" />                       // 24 pt, couleur principale du thème, décorative
<MaternityIcon name="sein_gauche" active size={32} />      // côté sélectionné, trait renforcé + teinte
<MaternityIcon name="regles" label={tr('…')} />            // annoncée aux lecteurs d'écran avec ce libellé
<MaternityIcon name="femme_enceinte" size={64} animate />  // le fil se dessine une fois à l'apparition
```

Props : `name` (obligatoire), `size` (défaut 24), `color` (défaut `theme.colors.primary`), `active`, `label`,
`animate`, `style`, `testID`.

## Grille et construction

- **Grille** : `viewBox 0 0 24 24`. Les tracés n'utilisent que des coordonnées absolues comprises entre 0 et 24
  (vérifié par test).
- **Zone de sécurité** : le dessin tient dans le carré 2 → 22 (2 unités de marge) ; seules de petites touches
  (mèche du nouveau-né, orteils, épaules du couple) s'en approchent jusqu'à 1,6 unité du bord, jamais au-delà.
- **Épaisseur** : trait de **1,6** unité, mis à l'échelle avec la taille (1,33 px à 20 px ; 2,13 px à 32 px ;
  4,27 px à 64 px). État actif : **2,0**.
- **Extrémités et jonctions** : `strokeLinecap="round"` et `strokeLinejoin="round"` partout — c'est le fil du logo.
- **Rayons** : coins de cadre 2,6 à 3,4 (cartes, calendrier, valise, carnet) ; petits éléments 1,2 à 1,4
  (bague du biberon, fenêtre photo) ; points pleins de 0,75 à 1,6 de rayon.
- **Courbes** : béziers cubiques souples ; les feuilles sont toutes produites par la même primitive `leaf()`
  (bombé 0,24 à 0,32, nervure optionnelle) pour garder la signature végétale du logo ; les cœurs par `heart()`,
  les gouttes par `drop()`, les mèches de bébé par `babyHead()` (boucle reprise de la boucle basse du logo).
- **Aucun texte** : ni lettre, ni chiffre, ni `<Text>` dans les SVG (test : seuls des caractères de commande de
  chemin et des nombres sont présents). Pas d'emoji.

## Couleurs (jetons existants uniquement)

| Contexte | Couleur du trait | Jeton |
|---|---|---|
| Jour (fond rose poudré / ivoire) | cuivre doré `#804F3C` | `theme.colors.primary` (thème `light`) |
| Soir / nuit (bleu nuit) | champagne `#E7C08F` | `theme.colors.primary` (thème `dark`) |
| Accents possibles | `lavender`, `gold`, `heart`, `success` | via la prop `color` |

Aucune nouvelle couleur n'est introduite. La teinte de l'état actif est la couleur du trait à 20 % d'opacité ;
les éléments « en retrait » (`muted`) sont à 40 % (par ex. le sein non sélectionné, les pilules à prendre).

## États

- **Inactif** (par défaut) : trait 1,6, formes vides, points de repère pleins.
- **Actif** (`active`) : trait 2,0 et formes fermées marquées `tint` remplies à 20 %. Utilisé pour un choix
  sélectionné (côté du sein, onglet, puce).
- **Désactivé** : non porté par l'icône ; le conteneur applique `feedback.disabledOpacity` (0,48) comme le reste
  de l'application.

## Tailles

| Taille | Usage | Remarque |
|---|---|---|
| 20 pt | listes denses, puces, légendes | tous les symboles ont été vérifiés lisibles à 20 px sur la planche |
| 24 pt | taille par défaut (lignes de liste, boutons) | |
| 32 pt | cartes, en-têtes de section, choix (sein G/D) | |
| 48–64 pt | états vides, illustrations d'accueil de module | `animate` recommandé ici seulement |

## Accessibilité

- `label` fourni → `accessible`, `accessibilityRole="image"`, `accessibilityLabel={label}` (libellé traduit, à
  passer avec `t(...)`).
- Sans `label` → icône décorative : `accessible={false}`, `accessibilityElementsHidden`,
  `importantForAccessibility="no-hide-descendants"`. C'est le cas normal quand un texte voisin porte le sens.
- Le sens ne repose jamais sur la couleur seule : l'état actif change aussi l'épaisseur et le remplissage ; les
  deux côtés du sein se distinguent par la position du point plein et l'arc repère, pas par la couleur.
- Contraste : `primary` est ≥ 4,5:1 sur tout le dégradé clair (voir `tokens.ts`) et le champagne sur bleu nuit.

## Animation (« le fil se dessine »)

- `animate` : chaque élément du tracé se dessine une fois au montage via `strokeDasharray` / `strokeDashoffset`
  animés avec `Animated.timing` (720 ms, courbe `easing.reveal`, décalage 70 ms entre éléments). Les remplissages
  apparaissent dans les 40 % finaux.
- Propriétés SVG : pilote JavaScript (le pilote natif ne gère pas les props SVG) ; animation marquée
  `isInteraction: false` pour ne pas retarder les tâches après interaction. Jamais en boucle.
- La longueur de chaque tracé est calculée par `pathLength()` (react-native-svg n'offre pas `getTotalLength()`
  partout) et mémorisée.
- **Réduire les animations** (`useReduceMotion()`) : état final immédiat, aucun tiret, aucune animation lancée
  (vérifié par test). À la fin du tracé, les tirets sont retirés (rendu identique à la version statique).
- Pas de Reanimated.

## Liste des symboles et usage prévu

Intégration : **aucun écran n'a été modifié** dans cette mission (voir « Intégration » plus bas) ; la colonne
« Où l'utiliser » est la recommandation pour le coordinateur.

### Femme (16)

| Nom | Dessin | Où l'utiliser |
|---|---|---|
| `regles` | goutte élégante et petite goutte pleine | saisie et calendrier du cycle (jour de règles), filtres du journal du cycle |
| `cycle` | fil circulaire ouvert, point du jour | entrée « Mon cycle », résumé du cycle |
| `ovulation` | ovocyte (noyau) et couronne en 4 arcs | jour d'ovulation estimée dans le calendrier du cycle |
| `fertilite` | pousse aux trois feuilles du logo | fenêtre de fertilité (sans promesse de conception) |
| `contraception` | plaquette, pilules prises / à prendre | rappel de contraception |
| `symptomes` | fiche d'observations, onde douce | saisie des symptômes (cycle, grossesse, post-partum) |
| `temperature` | thermomètre arrondi | courbe de température |
| `test_ovulation` | bâtonnet, fenêtre à deux traits | saisie d'un test d'ovulation |
| `grossesse` | ventre arrondi de profil, cœur | entrée « Grossesse », semaine en cours |
| `femme_enceinte` | silhouette au fil continu, main sous le ventre (écho au logo) | en-tête / état vide du module grossesse (64 pt, `animate`) |
| `echographie` | sonde et éventail, petit profil | rendez-vous « Échographie » (remplace l'icône générique `radio`) |
| `rdv_prenatal` | calendrier et cœur | rendez-vous prénataux |
| `valise_maternite` | valise, poignée, cœur | liste « Valise de maternité » |
| `naissance` | nouveau-né emmailloté, petit cœur | jour de naissance, passage grossesse → bébé |
| `post_partum` | maman de face, cœur sur la poitrine | module post-partum, rendez-vous postnatal (remplace `heart`) |
| `retour_des_regles` | cycle fléché, goutte au centre | retour de couches dans le suivi post-partum |

### Bébé (18)

| Nom | Dessin | Où l'utiliser |
|---|---|---|
| `nouveau_ne` | visage rond, mèche en boucle, yeux fermés | profil de l'enfant, rendez-vous pédiatrique |
| `allaitement` | maman berçant le bébé contre son sein | journal d'allaitement, ajout rapide « Tétée » |
| `sein_gauche` / `sein_droit` | vue de la maman (elle regarde vers le bas) : le côté choisi est plein, l'autre en retrait, un petit arc le signale | choix du côté pendant la tétée (32 pt, `active` sur le côté en cours) |
| `tire_lait` | téterelle, flacon gradué, levier | séances de tire-lait |
| `biberon` | tétine, bague, corps gradué | biberons |
| `lait_maternel` | goutte portant un cœur | quantités de lait tiré (jamais déduites d'une durée de tétée) |
| `reserve_lait` | sachets de conservation empilés | stock / banque de lait |
| `sommeil` | croissant de lune, deux étoiles | sommeil, siestes |
| `couche` | couche de face | changes |
| `croissance` | courbe qui monte jusqu'à une feuille | courbes de croissance (sans comparaison entre enfants) |
| `repas` | bol et cuillère | repas |
| `diversification` | carotte et fanes | diversification alimentaire |
| `vaccination` | seringue sobre en diagonale | carnet de vaccination, rendez-vous « Vaccination » (remplace `shield`) |
| `premiers_pas` | deux petites empreintes | jalons moteurs |
| `developpement` | cubes empilés, cœur | jalons de développement |
| `jumeaux` | deux petites têtes décalées | profil multiple / naissance gémellaire |
| `sevrage` | tasse d'apprentissage à bec | sevrage |

### Famille (13)

| Nom | Dessin | Où l'utiliser |
|---|---|---|
| `maman` | buste de face, cheveux longs | profil maman |
| `papa` | buste de face, cheveux courts | espace Papa |
| `couple` | deux bustes, petit cœur | « Notre histoire à deux », espace couple |
| `famille` | deux parents et un enfant | foyer, membres de la famille |
| `partage` | deux personnes reliées par le fil | « Ce que je partage avec mon partenaire » |
| `calendrier_familial` | calendrier, jours partagés | agenda familial |
| `taches` | liste, deux faites, une à faire | tâches partagées |
| `soutien` | cœur porté par des mains en coupe | soutien, ressources d'aide (à côté des numéros 15, 112, 3114 — jamais à leur place) |
| `souvenirs` | photo instantanée | album, souvenirs |
| `journal` | carnet relié, signet | « Mon journal » |
| `bien_etre` | lotus aux pétales-feuilles | moments pour soi |
| `fatigue` | batterie presque vide | humeur / énergie (sans score culpabilisant) |
| `humeur` | visage serein | humeur du jour |

Le symbole des **règles** est volontairement abstrait (deux gouttes, une courbe intérieure) : élégant, discret,
compris immédiatement, jamais figuratif. Aucun dessin n'affirme une information médicale (pas de dose, pas de
graduation chiffrée, pas de « normal / anormal »).

## Planche de contrôle

```bash
node scripts/icon-sheet.mjs /chemin/planche.html     # génère la planche (47 symboles × 20, 32, 64 px + actif)
# puis capture Playwright (Python), deviceScaleFactor 2, une section par fond :
#   ivoire #F8F4EE, rose poudré #F2DDD8, bleu nuit #1F2344
```

Planches de la mission V6 (dossier de travail du coordinateur, pas dans le dépôt) : `icones/planche_avant.png`
(premier jet) et `icones/planche_apres.png` = `icones/planche.png` (après corrections).

Corrections faites entre les deux planches :

| Symbole | Problème du premier jet | Correction |
|---|---|---|
| `grossesse` | le fœtus enroulé se lisait comme « @ » / « e » | ventre arrondi de profil avec cœur |
| `echographie` | triangle « danger » contenant un « 8 » | sonde arrondie au-dessus de l'éventail, fœtus réduit à une tête pleine et une courbe |
| `naissance`, `sommeil` | l'étincelle à 4 branches se lisait comme un « + » à 20 px | petit cœur plein ; deux étoiles-points |
| `post_partum` / `allaitement` | deux dessins presque identiques et confus | allaitement = maman berçant le bébé ; post-partum = maman avec un cœur |
| `diversification` | la cuillère ressemblait à une sucette | carotte et fanes |
| `repas` | la « vapeur » se lisait comme une seconde cuillère | courbe intérieure du bol |
| `jumeaux` | deux cercles alignés = lunettes / soutien-gorge | têtes décalées en diagonale |
| `couple` | forme centrale illisible | petit cœur plein au-dessus |
| `journal` | signet sorti de la zone de sécurité (y = 23) | signet en haut du carnet |
| `premiers_pas` | orteils collés à l'empreinte | empreintes affinées, orteils espacés |

## Recherche de ressources et licences

| Bibliothèque | Licence vérifiée en ligne (13/11/2026) | Utilisation ici |
|---|---|---|
| Lucide (`github.com/lucide-icons/lucide`, fichier LICENSE) | **ISC** — « Copyright (c) 2026 Lucide Icons and Contributors » ; certaines icônes dérivées de Feather restent sous **MIT** (« Copyright (c) 2013-present Cole Bemis ») ; obligation de conserver la mention de copyright et de licence dans les copies | **aucun tracé repris** |
| Phosphor (`github.com/phosphor-icons/core`, fichier LICENSE) | **MIT** — « Copyright (c) 2023 Phosphor Icons » ; obligation de conserver la mention dans les copies substantielles | **aucun tracé repris** |

Pourquoi ne pas partir de ces bibliothèques, bien que leurs licences le permettent :

1. **Identité** : leur trait géométrique (Lucide 2 px, Phosphor « regular » 16/256) est neutre et technique ; la
   marque demande un fil souple, organique, avec feuilles et boucles du logo. Adapter leurs tracés aurait donné un
   mélange de deux écritures.
2. **Couverture** : aucune des deux n'a les symboles propres au parcours maternel (règles, test d'ovulation,
   tire-lait, sein gauche / droit, réserve de lait, échographie, valise de maternité, post-partum…).
3. **Simplicité juridique** : des dessins entièrement originaux n'imposent aucune mention de licence tierce dans
   l'application ni dans le dépôt.

Inspiration limitée aux **métaphores** universelles, communes à toute iconographie (et non protégeables en
elles-mêmes) : un calendrier pour un rendez-vous, une lune pour le sommeil, une batterie pour l'énergie, une liste
cochée pour les tâches. Tous les tracés ont été construits ici, coordonnée par coordonnée, à partir des primitives
de `geometry.ts`.

L'application garde par ailleurs Feather (via `@expo/vector-icons`, déjà présent) pour les icônes d'interface
génériques (flèches, plus, fermer) : `MaternityIcon` est réservé aux sujets du parcours (femme, bébé, famille).

## Intégration (état et recommandations)

Aucun écran n'a été modifié dans cette mission : la vérification visuelle réelle (export web + Playwright),
obligatoire pour toute modification d'écran, n'a pas pu être faite car le disque de la machine de travail était
plein (moins de 20 Mo libres, un export web en demande ≈ 65 Mo). Intégrations sûres proposées au coordinateur, par
ordre de bénéfice :

1. `src/app/appointments.tsx` (non réservé) : icône des cartes de rendez-vous (`NextCard`, `renderAppt`) —
   `ultrasound` → `echographie` (aujourd'hui `radio`, sans rapport), `vaccination` → `vaccination` (aujourd'hui
   `shield`), `postnatal` → `post_partum`, `pediatric` → `nouveau_ne`. Les puces de choix (`Chip`) attendent un nom
   Feather : les laisser telles quelles ou ajouter à `Chip` une prop `leading?: ReactNode`.
2. Côté du sein pendant la tétée (périmètre de l'agent Allaitement, `src/app/track/**`, `src/features/feeding/**`) :
   `sein_gauche` / `sein_droit` à 32 pt avec `active` sur le côté en cours.
3. Écrans vides des modules (grossesse, cycle) : symbole à 64 pt avec `animate`.
4. `ToolGlyph` / `toolGlyphIcons.ts` : à terme, remplacer le symbole MaterialCommunityIcons par `MaternityIcon`
   pour les outils correspondants (biberon, sommeil, couche, croissance, grossesse) — à faire avec une planche de
   contrôle des glyphes (`GLYPH_THEMES`).
