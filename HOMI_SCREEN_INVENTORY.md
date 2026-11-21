# HOMI — Inventaire des écrans et grille de couverture par outil

> Fichier GÉNÉRÉ par `node scripts/homi/inventory.mjs` (vérification : `--check`). Ne pas modifier à la main :
> les statuts se saisissent dans `scripts/homi/inventory-status.json`, puis on relance le script.
> Données brutes : `HOMI_SCREEN_INVENTORY.csv` (lignes `ecran` puis lignes `outil`).

**299 routes** réelles (`src/lib/routes.generated.ts`) portées par **300 fichiers** d’écran (la route `/` a deux fichiers : l’aiguillage de lancement `src/app/index.tsx` et l’Accueil `src/app/(tabs)/index.tsx`). **127 outils** du catalogue (`MATRICE_OUTILS.csv`).

## Colonnes

- **rôle** (heuristique sur la route et le code) : liste · formulaire · détail · résultat · historique · réglage · scène.
- **outils** : clés du catalogue dont l’adresse mène à cet écran (`/child/c1` → `/child/[id]`, requête ignorée).
- **composants** : composants partagés utilisés DIRECTEMENT dans le fichier (ceux d’un module `src/features/**` importé ne sont pas comptés).
- **couleurs en dur** : littéraux `#hex`, `rgb[a]()`, `hsl[a]()`, `white/black` dans le fichier (commentaires exclus). Objectif refonte : 0 (tout passe par `useTheme()`).
- **Animated RN** : l’écran utilise encore l’API `Animated` de React Native (à migrer vers `src/motion/**`).
- **statut refonte** : à faire · tranche (refonte partielle) · fait.

## Synthèse par zone

| Zone | Fichiers | À faire | Tranche | Fait | Couleurs en dur | Animated RN |
|---|---:|---:|---:|---:|---:|---:|
| Autres | 39 | 39 | 0 | 0 | 0 | 0 |
| Auth / entrée | 10 | 0 | 2 | 8 | 0 | 0 |
| Admin | 7 | 7 | 0 | 0 | 0 | 0 |
| Réglages | 24 | 24 | 0 | 0 | 0 | 0 |
| Accueil | 22 | 19 | 0 | 3 | 4 | 1 |
| Santé | 30 | 22 | 0 | 8 | 7 | 0 |
| Cycle et fertilité | 46 | 46 | 0 | 0 | 15 | 1 |
| Grossesse et post-partum | 23 | 23 | 0 | 0 | 1 | 0 |
| Bébé et enfant | 37 | 33 | 0 | 4 | 50 | 1 |
| Famille | 44 | 44 | 0 | 0 | 6 | 0 |
| Communauté | 18 | 18 | 0 | 0 | 4 | 0 |
| **Total** | **300** | **275** | **2** | **23** | **87** | **3** |

Rôles : détail 55 · formulaire 58 · historique 18 · liste 119 · réglage 30 · résultat 13 · scène 7.

## Pilotes proposés (à valider en premier)

Choisis dans l’inventaire réel pour couvrir les trois formes d’outil ; chacun valide les surfaces, commandes et transitions avant la généralisation.

| Pilote | Outil (clé) | Pourquoi | Routes du parcours |
|---|---|---|---|
| Saisie | Mon humeur (`mood`) | bilan court à choix (humeur, énergie, note facultative), privé, avec relais d’aide : valide champs mats, puces, bouton principal au-dessus du clavier et feuille de confirmation | `/me/mood` → `/me/diary` |
| Données | Biberon (`baby_bottle_timer`) | minuteur en direct + saisie rapide + historique et compteur de mesurettes : valide chiffres animés, carte d’état, transition liste → détail et lisibilité de nuit | `/bottle` → `/bottle/[childId]` → `/bottle/history` → `/bottle/scoops` |
| Plusieurs étapes | Scanner un produit (`scan_product`) | caméra ou saisie du code → fiche résultat → historique et comparaison : valide transitions entre écrans, états chargement / erreur réseau / introuvable | `/scanner` → `/scanner/product` → `/scanner/result/[id]` → `/scanner/history` → `/scanner/compare` |

## Écrans par zone

### Autres

| Route | Rôle | Outils | Composants | Couleurs | Animated RN | Statut |
|---|---|---|---|---:|:-:|---|
| `/assistant` | détail | — | — | 0 |  | à faire |
| `/dev/aura-bot` | liste | — | Button | 0 |  | à faire |
| `/dev/glass` | liste | — | Field | 0 |  | à faire |
| `/dev/icons` | liste | — | — | 0 |  | à faire |
| `/dev/paywall` | liste | — | — | 0 |  | à faire |
| `/discover` | détail | — | — | 0 |  | à faire |
| `/discover/tool/[id]` | détail | — | — | 0 |  | à faire |
| `/discover/tools` | détail | — | — | 0 |  | à faire |
| `/feeding/difficulties` | liste | — | Screen, Card, Field, Button, Banner, Chip, Segmented, ListRow, EmptyState, Skeleton | 0 |  | à faire |
| `/feeding/formula` | formulaire | — | Screen, Card, Field, Button, Banner, Chip, ListRow, EmptyState, Skeleton | 0 |  | à faire |
| `/feeding/milk-stock` | formulaire | — | Screen, Card, Field, Button, Banner, Chip, ListRow, EmptyState, Skeleton | 0 |  | à faire |
| `/garde` | liste | childcare | Screen, Card, Field, Button, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/garde/[id]` | détail | — | Screen, Card, Button, Banner, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/garde/[id]/acces` | liste | — | Screen, Card, Field, Button, Banner, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/garde/[id]/ajouter` | formulaire | — | Screen, Card, Sheet, Field, Button, Chip, EmptyState, Skeleton | 0 |  | à faire |
| `/garde/[id]/journee` | liste | — | Screen, Card, Button, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/garde/[id]/messages` | liste | — | Screen, Card, Field, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/garde/[id]/photo` | liste | — | Screen, Card, Field, Button, Banner, Chip, EmptyState, Skeleton | 0 |  | à faire |
| `/garde/[id]/photos` | liste | — | Screen, Card, Button, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/garde/prep` | détail | — | Screen, Card, Banner, ListRow, EmptyState, Skeleton | 0 |  | à faire |
| `/garde/prep/absences` | formulaire | — | Screen, Field, Button, Banner, Chip, ListRow, EmptyState, Skeleton | 0 |  | à faire |
| `/garde/prep/budget` | liste | — | Screen, Card, Button, Banner, EmptyState, Skeleton | 0 |  | à faire |
| `/garde/prep/candidats` | liste | — | Screen, Card, Chip, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/garde/prep/entretien` | détail | — | — | 0 |  | à faire |
| `/garde/prep/fiche` | liste | — | Screen, Card, Button, Chip, ListRow, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/garde/prep/heures` | formulaire | — | Screen, Card, Field, Button, IconButton, Banner, Chip, ListRow, EmptyState, Skeleton | 0 |  | à faire |
| `/garde/prep/modes` | liste | — | Screen, Card, Banner | 0 |  | à faire |
| `/garde/prep/planning` | formulaire | — | Screen, Card, Field, Button, IconButton, Banner, Chip, ListRow, EmptyState, Skeleton | 0 |  | à faire |
| `/garde/prep/visite` | détail | — | — | 0 |  | à faire |
| `/garde/rejoindre` | détail | — | Screen, Card, Button | 0 |  | à faire |
| `/guide` | liste | guides | Screen, ListRow, EmptyState | 0 |  | à faire |
| `/reading` | liste | — | Screen, Card, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/reading/stories` | liste | — | Screen, Chip, ListRow | 0 |  | à faire |
| `/reading/story/[id]` | détail | — | Screen, Button, Chip, EmptyState | 0 |  | à faire |
| `/start` | formulaire | — | — | 0 |  | à faire |
| `/start/done` | détail | — | — | 0 |  | à faire |
| `/start/offers` | détail | — | — | 0 |  | à faire |
| `/start/sample` | détail | — | Button | 0 |  | à faire |
| `/tools/[category]` | détail | — | Screen, EmptyState, VirtualList | 0 |  | à faire |

### Auth / entrée

| Route | Rôle | Outils | Composants | Couleurs | Animated RN | Statut |
|---|---|---|---|---:|:-:|---|
| `/ (index.tsx)` | scène | — | — | 0 |  | fait |
| `/auth/callback` | détail | — | Field, Button, Banner, EntryHero, EntryScreen, MattePanel | 0 |  | fait |
| `/auth/forgot` | formulaire | — | Field, Button, Banner, EntryHero, EntryScreen, MattePanel | 0 |  | fait |
| `/auth/reset` | formulaire | — | Field, Button, Banner, EntryHero, EntryScreen, MattePanel | 0 |  | fait |
| `/auth/sign-in` | formulaire | — | Field, Button, Banner, EntryHero, EntryScreen, MattePanel | 0 |  | fait |
| `/auth/sign-up` | formulaire | — | Field, Button, Banner, EntryHero, EntryScreen, MattePanel | 0 |  | fait |
| `/cinematic` | scène | — | — | 0 |  | fait |
| `/intro` | scène | — | — | 0 |  | tranche |
| `/onboarding` | formulaire | — | Screen, Button, IconButton, Banner | 0 |  | tranche |
| `/welcome` | scène | — | Button, IconButton | 0 |  | fait |

### Admin

| Route | Rôle | Outils | Composants | Couleurs | Animated RN | Statut |
|---|---|---|---|---:|:-:|---|
| `/admin` | réglage | — | Screen, Card, Field, Button, Banner, SectionTitle, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/admin/feedback` | réglage | — | Screen, Card, Chip, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/admin/import-recipes` | réglage | — | Screen, Card, Field, Button, Banner, Chip, EmptyState, Skeleton | 0 |  | à faire |
| `/admin/languages` | réglage | — | Screen, Card, Banner, EmptyState | 0 |  | à faire |
| `/admin/products` | réglage | — | Screen, Card, Field, Button, Banner, Chip, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/admin/recipes` | réglage | — | Screen, Card, Field, Button, Banner, Chip, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/admin/resources` | réglage | — | Screen, Card, Field, Button, Chip, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |

### Réglages

| Route | Rôle | Outils | Composants | Couleurs | Animated RN | Statut |
|---|---|---|---|---:|:-:|---|
| `/feedback` | liste | — | Screen, Card, Field, Button, IconButton, Banner, Chip, SectionTitle | 0 |  | à faire |
| `/journeys` | liste | — | Screen, Card, Sheet, Button, Banner, ListRow, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/journeys/[id]` | détail | — | Screen, Card, Button, Banner, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/journeys/answers` | détail | — | Screen, Button, Skeleton | 0 |  | à faire |
| `/journeys/blocked` | réglage | — | Screen, Button, Banner, EmptyState | 0 |  | à faire |
| `/legal/[doc]` | détail | — | Screen, Card | 0 |  | à faire |
| `/notifications` | liste | — | Screen, IconButton, Chip, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/premium` | détail | — | IconButton | 0 |  | à faire |
| `/profile` | liste | — | Screen, Card, Button, Chip, ListRow, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/profiles/new` | formulaire | — | Screen, Card, Button, Banner, Segmented, ErrorView, Skeleton | 0 |  | à faire |
| `/settings` | réglage | — | Screen, Card, Field, Button, Banner, Toggle, ListRow, SectionTitle | 0 |  | à faire |
| `/settings/account` | réglage | — | Screen, Card, Sheet, Field, Button, Banner, ListRow, SectionTitle | 0 |  | à faire |
| `/settings/appearance` | réglage | — | Screen, Card, GlowCard, Button, Banner, Chip, Segmented, Toggle, ListRow, SectionTitle, CompletionCheck | 0 |  | à faire |
| `/settings/credits` | réglage | — | Screen, Card, Button, Banner, SectionTitle | 0 |  | à faire |
| `/settings/family` | réglage | — | Screen, Card, Field, Button, Banner, Chip, Segmented, ListRow, SectionTitle | 0 |  | à faire |
| `/settings/home` | réglage | — | Screen, Card, Button, Chip, Toggle, Cascade | 0 |  | à faire |
| `/settings/iphone-calendar` | réglage | — | Screen, Card, Button, Banner, Toggle, SectionTitle | 0 |  | à faire |
| `/settings/language` | réglage | — | Screen, Card, Banner, SectionTitle | 0 |  | à faire |
| `/settings/notifications` | réglage | — | Screen, Card, Button, Banner, Chip, ListRow, SectionTitle | 0 |  | à faire |
| `/settings/privacy` | réglage | — | Screen, Card, Sheet, Field, Button, Banner, Chip, Toggle, SectionTitle | 0 |  | à faire |
| `/settings/reminders` | réglage | reminders | Screen, Card, Sheet, Field, Button, Banner, Chip, Segmented, Toggle, SectionTitle | 0 |  | à faire |
| `/settings/services` | réglage | — | Screen, Card, Banner, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/settings/subscription` | réglage | — | Screen, Card, Button, Banner, SectionTitle, Cascade | 0 |  | à faire |
| `/settings/sync` | réglage | — | Screen, Card, Button, IconButton, Banner, ListRow, SectionTitle, EmptyState | 0 |  | à faire |

### Accueil

| Route | Rôle | Outils | Composants | Couleurs | Animated RN | Statut |
|---|---|---|---|---:|:-:|---|
| `/ ((tabs)/index.tsx)` | liste | — | Screen, Button, Banner, ErrorView, Cascade | 0 |  | à faire |
| `/agenda` | détail | — | — | 0 |  | à faire |
| `/ask` | détail | ask | — | 0 |  | à faire |
| `/assistant/chat` | liste | — | Screen, Card, Button, IconButton, Chip, Toggle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/assistant/history` | historique | — | Screen, Card, Field, Button, IconButton, Banner, Chip, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/assistant/local` | liste | local_ai | Screen, GlassSurface, IconButton, Banner, Chip, Skeleton | 4 |  | à faire |
| `/calendar` | formulaire | family_calendar | Screen, Card, Sheet, Field, Button, IconButton, Banner, Chip, Segmented, Toggle, SectionTitle, ErrorView, Skeleton | 0 | oui | à faire |
| `/health` | détail | — | — | 0 |  | à faire |
| `/household` | détail | — | — | 0 |  | à faire |
| `/journal` | historique | journal | Screen, Card, Field, Button, IconButton, Chip, Segmented, ListRow, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/me` | liste | — | Screen, Card, Banner, ListRow, SectionTitle | 0 |  | à faire |
| `/me/diary` | historique | me_diary | Screen, Field, Button, Segmented, EmptyState, ErrorView, Skeleton | 0 |  | fait |
| `/me/mood` | liste | mood | Screen, Field, Chip, Toggle, SectionTitle, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | fait |
| `/me/mood/[id]` | détail | — | Screen, Chip, EmptyState, ErrorView, Skeleton | 0 |  | fait |
| `/me/sleep` | liste | sleep | Screen, Card, Sheet, Field, Button, IconButton, Banner, Chip, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/moi` | liste | — | Screen, Card, Sheet, Button, Banner, Segmented, ListRow, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/story` | scène | — | Screen, Button | 0 |  | à faire |
| `/summary` | résultat | summary | Screen, Button, Banner, Chip, SectionTitle | 0 |  | à faire |
| `/today` | liste | — | Screen, Card, Button, Segmented | 0 |  | à faire |
| `/tools` | liste | — | Screen, Button, ErrorView | 0 |  | à faire |
| `/track` | liste | baby_daily | Screen, Card, Button, Banner, Segmented, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/track/[kind]` | formulaire | baby_breastfeed, baby_bottle, baby_diaper | Screen, Field, Button, Banner, Chip, Segmented, EmptyState, ErrorView, Skeleton | 0 |  | à faire |

### Santé

| Route | Rôle | Outils | Composants | Couleurs | Animated RN | Statut |
|---|---|---|---|---:|:-:|---|
| `/appointments` | formulaire | appointments | Screen, Card, GlassSurface, Sheet, Field, Button, Banner, Chip, Segmented, Toggle, SectionTitle, ErrorView | 1 |  | à faire |
| `/article/[slug]` | détail | — | Screen, Card, Button, Banner, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/consult/questions` | formulaire | consult_questions | Screen | 0 |  | à faire |
| `/documents` | liste | documents | Screen, Card, GlassSurface, Sheet, Field, Button, Banner, Chip, SectionTitle, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/documents/[id]` | formulaire | — | Screen, Card, Sheet, Field, Button, IconButton, Banner, Segmented, Toggle, SectionTitle, EmptyState, ErrorView, Skeleton | 2 |  | à faire |
| `/documents/book` | liste | health_book | Screen, Card, Banner, Chip, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/documents/export` | résultat | — | Screen, Card, Button, Banner, Toggle, SectionTitle, Skeleton | 0 |  | à faire |
| `/documents/labs` | formulaire | — | Screen, Card, Field, Button, Banner, Chip, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/documents/scan` | formulaire | — | Screen, Card, Field, Button, IconButton, Banner, Segmented, Toggle | 3 |  | à faire |
| `/emergency` | détail | emergency | Screen, Card, Banner | 0 |  | à faire |
| `/guide/[topic]` | détail | — | Screen, Card, Banner, ListRow, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/library` | liste | library | Screen, Card, GlassSurface, Field, Chip, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/medications` | liste | medications | Screen, Card, Banner, Chip, SectionTitle | 1 |  | à faire |
| `/nearby` | détail | — | — | 0 |  | à faire |
| `/outings` | liste | nearby | Screen, GlassSurface, Button, Banner, Chip, Segmented, SectionTitle, Skeleton | 0 |  | à faire |
| `/products` | liste | kid_products | Screen, Field, Button, Banner, Chip, EmptyState, Skeleton | 0 |  | à faire |
| `/products/[id]` | détail | — | Screen, Card, Button, Banner, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/products/compare` | résultat | — | Screen, Card, Chip, EmptyState | 0 |  | à faire |
| `/scanner` | liste | — | Screen, Card, Banner, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | fait |
| `/scanner/avoid` | formulaire | scan_avoid | Screen, Field, Banner, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | fait |
| `/scanner/compare` | résultat | scan_compare | Screen, Banner, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | fait |
| `/scanner/food` | détail | scan_food | — | 0 |  | fait |
| `/scanner/history` | historique | scan_history | Screen, Chip, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | fait |
| `/scanner/product` | détail | scan_product | — | 0 |  | fait |
| `/scanner/recalls` | liste | recall_alerts | Screen, Banner, Toggle, ListRow, SectionTitle, ErrorView, Skeleton | 0 |  | fait |
| `/scanner/result/[id]` | résultat | — | Screen, EmptyState, ErrorView, Skeleton | 0 |  | fait |
| `/sources` | liste | sources | Screen, Card, Field, Button, Banner, Chip, EmptyState, Skeleton | 0 |  | à faire |
| `/teeth` | liste | kid_teeth | Screen, Sheet, Field, Button, Banner, Chip, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/tutos` | détail | — | — | 0 |  | à faire |
| `/videos` | liste | videos | Screen, Card, Chip, Segmented, ListRow, SectionTitle | 0 |  | à faire |

### Cycle et fertilité

| Route | Rôle | Outils | Composants | Couleurs | Animated RN | Statut |
|---|---|---|---|---:|:-:|---|
| `/contraception` | liste | avoid_contraception | Screen, Card, Button, Banner, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 2 |  | à faire |
| `/contraception/consultation` | formulaire | avoid_consult | Screen | 0 |  | à faire |
| `/contraception/emergency` | liste | avoid_emergency | Screen, Card, Button, Banner | 0 |  | à faire |
| `/contraception/history` | historique | — | Screen | 0 |  | à faire |
| `/contraception/journal` | historique | contraception_journal | Screen, Card, Field, Button, Banner, Chip, ListRow, SectionTitle, EmptyState | 0 |  | à faire |
| `/contraception/log` | historique | — | Screen, Banner, SectionTitle | 0 |  | à faire |
| `/contraception/methods` | liste | avoid_methods | Screen, Card, Button, Banner | 0 |  | à faire |
| `/contraception/reminders` | réglage | avoid_reminders | Screen, Card, Sheet, Field, Button, Chip, Toggle, ListRow, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/cycle` | formulaire | cycle_home | Screen, Field, Button, Chip, Segmented, ErrorView, Skeleton | 0 |  | à faire |
| `/cycle/advice` | liste | cycle_advice | Screen, Banner, Skeleton | 0 |  | à faire |
| `/cycle/bleeding` | liste | cycle_bleeding | Screen, Field, Button, Banner | 0 |  | à faire |
| `/cycle/calendar` | liste | cycle_calendar | Screen, Sheet, Button, IconButton, ListRow, ErrorView, Skeleton | 0 | oui | à faire |
| `/cycle/discharge` | liste | cycle_discharge | Screen, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/cycle/discharge/[id]` | formulaire | — | Screen, Field, Button, Banner, EmptyState, Skeleton | 0 |  | à faire |
| `/cycle/emergency` | détail | — | Screen | 0 |  | à faire |
| `/cycle/export` | résultat | cycle_export | Screen, Button, Banner | 0 |  | à faire |
| `/cycle/guides` | liste | cycle_guides | Screen | 0 |  | à faire |
| `/cycle/guides/[slug]` | détail | — | Screen, Button, EmptyState | 0 |  | à faire |
| `/cycle/home-card` | réglage | — | Screen, Button, IconButton | 0 |  | à faire |
| `/cycle/intimacy` | formulaire | ttc_intimacy | Screen, Field, Button, Banner, ErrorView, Skeleton | 0 |  | à faire |
| `/cycle/journal` | historique | cycle_journal | Screen, Field, Button, Banner | 0 |  | à faire |
| `/cycle/kit` | liste | cycle_kit | Screen, Card, Button, Banner, ListRow | 0 |  | à faire |
| `/cycle/month` | résultat | cycle_month | Screen, Card, Button, IconButton | 0 |  | à faire |
| `/cycle/pain` | liste | cycle_pain | Screen, Field, Button, Banner | 0 |  | à faire |
| `/cycle/privacy` | réglage | — | Screen, Button, Banner, Chip | 0 |  | à faire |
| `/cycle/professional` | liste | — | Screen, Button | 0 |  | à faire |
| `/cycle/recap` | historique | — | Screen, Button, Skeleton | 0 |  | à faire |
| `/cycle/risk` | résultat | — | Screen, Button | 0 |  | à faire |
| `/cycle/share` | résultat | — | Screen, Card, Button, Banner, Toggle, Skeleton | 0 |  | à faire |
| `/cycle/stats` | résultat | cycle_stats | Screen, Skeleton | 0 |  | à faire |
| `/cycle/symptoms` | liste | cycle_symptoms | Screen, Field, Button | 0 |  | à faire |
| `/fertility` | liste | ttc_cycle | Screen, Card, Button, Banner, SectionTitle, ErrorView, Skeleton | 2 |  | à faire |
| `/fertility/body` | formulaire | ttc_temperature | Screen, Card, Field, IconButton, Banner, Chip, ListRow, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/fertility/calendar` | liste | — | Screen, Card, Button, Banner, SectionTitle, ErrorView, Skeleton | 2 |  | à faire |
| `/fertility/compatible` | liste | — | Screen, Card, Banner, SectionTitle | 1 |  | à faire |
| `/fertility/consultation` | formulaire | ttc_consult | Screen, Button | 0 |  | à faire |
| `/fertility/exams` | liste | ttc_exams | Screen, Card, Button, Banner, Chip, SectionTitle | 0 |  | à faire |
| `/fertility/history` | historique | — | Screen | 0 |  | à faire |
| `/fertility/intimacy` | détail | — | — | 0 |  | à faire |
| `/fertility/log` | historique | ttc_tests | Screen, SectionTitle | 0 |  | à faire |
| `/fertility/mucus` | liste | ttc_mucus | Screen, Card, Field, Button, IconButton, Banner, Chip, ListRow, SectionTitle, ErrorView, Skeleton | 7 |  | à faire |
| `/fertility/pma` | formulaire | pma_tracker | Screen, Card, Sheet, Field, Button, Banner, Chip, Toggle, ListRow, SectionTitle, EmptyState | 0 |  | à faire |
| `/fertility/reminders` | réglage | ttc_reminders | Screen | 0 |  | à faire |
| `/fertility/test/[kind]` | formulaire | — | Screen, Card, Field, Button, Banner, Chip, Segmented, SectionTitle | 1 |  | à faire |
| `/fertility/understand` | liste | ttc_understand | Screen, Card, Banner, Toggle, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/partner/cycle` | liste | — | Screen, Card, Button, Chip, EmptyState, Skeleton | 0 |  | à faire |

### Grossesse et post-partum

| Route | Rôle | Outils | Composants | Couleurs | Animated RN | Statut |
|---|---|---|---|---:|:-:|---|
| `/lists` | liste | preg_lists | Screen, Card, Sheet, Field, Button, IconButton, Banner, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 1 |  | à faire |
| `/names` | liste | preg_names | Screen, Card, Field, Button, IconButton, Banner, Chip, Segmented, SectionTitle, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/postpartum` | liste | pp_recovery | Screen, Card, Field, Button, Banner, Toggle, ListRow, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/postpartum/checkin` | formulaire | pp_checkin | Screen, Card, Field, Button, Chip, Toggle, SectionTitle | 0 |  | à faire |
| `/postpartum/healing` | liste | — | Screen, Field, Button, Banner, Chip, ListRow, EmptyState, Skeleton | 0 |  | à faire |
| `/postpartum/history` | historique | pp_history | Screen, Card, Button, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/postpartum/partner` | liste | pp_partner | Screen, Card, Banner, ListRow, SectionTitle, Skeleton | 0 |  | à faire |
| `/postpartum/pelvic` | liste | — | Screen, Field, Button, Banner, ListRow, EmptyState, Skeleton | 0 |  | à faire |
| `/postpartum/recovery` | liste | pp_body | Screen, Card, Banner, ListRow | 0 |  | à faire |
| `/postpartum/sharing` | liste | — | Screen, Card, Field, Button, Banner, Chip, Toggle, ListRow, SectionTitle, Skeleton | 0 |  | à faire |
| `/postpartum/support` | formulaire | pp_support | Screen, Card, Sheet, Field, Button, IconButton, Banner, Chip, Segmented, ListRow, SectionTitle, Skeleton | 0 |  | à faire |
| `/postpartum/understand` | liste | pp_mental | Screen, Banner | 0 |  | à faire |
| `/pregnancy` | liste | preg_evolution | Screen, Card, Field, Button, Banner, Chip, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/pregnancy/birth-plan` | liste | — | Screen, Card, Field, Button, Banner, Chip, Segmented, EmptyState, Skeleton | 0 |  | à faire |
| `/pregnancy/calendar` | liste | preg_calendar | Screen, Card, Button, Banner, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/pregnancy/contractions` | liste | — | Screen, Card, Button, Banner, ListRow, Skeleton | 0 |  | à faire |
| `/pregnancy/eat` | liste | preg_eat | Screen, Card, Button, Banner, Chip, SectionTitle, Skeleton | 0 |  | à faire |
| `/pregnancy/edit` | formulaire | — | Screen, Card, Button, Banner, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/pregnancy/end` | formulaire | — | Screen, Card, Field, Button, Banner, Chip, EmptyState | 0 |  | à faire |
| `/pregnancy/feel` | formulaire | preg_feel | Screen, Card, Field, Button, Banner, Chip, Toggle, SectionTitle, EmptyState | 0 |  | à faire |
| `/pregnancy/moves` | liste | preg_moves | Screen, Card, Field, Button, Banner, Chip, ListRow, SectionTitle, EmptyState | 0 |  | à faire |
| `/pregnancy/start` | formulaire | ttc_start_pregnancy | Screen, Card, Field, Button, Banner, Segmented | 0 |  | à faire |
| `/pregnancy/weight` | liste | preg_weight | Screen, Card, Field, Button, Banner, Toggle, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |

### Bébé et enfant

| Route | Rôle | Outils | Composants | Couleurs | Animated RN | Statut |
|---|---|---|---|---:|:-:|---|
| `/baby` | détail | — | Screen, Button | 0 |  | à faire |
| `/bottle` | liste | — | Screen, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | fait |
| `/bottle/[childId]` | détail | baby_bottle_timer | Screen, Sheet, Field, Banner, Chip, EmptyState, ErrorView, Skeleton | 0 |  | fait |
| `/bottle/history` | historique | baby_bottle_history | Screen, Sheet, IconButton, Chip, SectionTitle, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | fait |
| `/bottle/scoops` | détail | bottle_scoops | Screen, Field, Banner | 0 |  | fait |
| `/child/[id]` | détail | kid_profile | Screen, Button, IconButton, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/child/[id]/activities` | formulaire | — | Screen, Card, Field, Button, IconButton, Banner, Chip, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/child/[id]/album` | historique | kid_album | Screen, Card, Sheet, Field, Button, Banner, Segmented, SectionTitle, EmptyState, ErrorView, Skeleton | 2 |  | à faire |
| `/child/[id]/card` | résultat | kid_card | Screen, Card, Field, Button, Banner, ListRow, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/child/[id]/discoveries` | formulaire | baby_foods | Screen, GlassSurface, Sheet, Field, Button, IconButton, Banner, Chip, SectionTitle, EmptyState, ErrorView, Skeleton | 20 | oui | à faire |
| `/child/[id]/foods` | détail | — | — | 0 |  | à faire |
| `/child/[id]/games` | liste | — | Screen, GlassSurface, Button, Banner, Chip, ListRow, ErrorView, Skeleton | 0 |  | à faire |
| `/child/[id]/grow` | liste | kid_grow | Screen, GlassSurface, Sheet, Field, Button, Banner, Chip, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 5 |  | à faire |
| `/child/[id]/growth` | détail | — | — | 0 |  | à faire |
| `/child/[id]/health-tracking` | formulaire | kid_health | Screen, Card, Sheet, Field, Button, Banner, Chip, Segmented, Toggle, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/child/[id]/homework` | formulaire | — | Screen, Card, Field, Button, IconButton, Banner, Chip, Toggle, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/child/[id]/language` | réglage | — | Screen, Card, Field, Button, Banner, Chip, ListRow, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/child/[id]/needs` | formulaire | kid_treatments | Screen, Card, Sheet, Field, Button, Banner, Chip, Segmented, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/child/[id]/school` | liste | kid_school | Screen, Card, Field, Button, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/child/[id]/steps` | liste | kid_steps | Screen, Card, Button, Banner, EmptyState, Skeleton | 0 |  | à faire |
| `/child/[id]/vaccines` | formulaire | kid_vaccines | Screen, Card, GlassSurface, Sheet, Field, Button, IconButton, Banner, Chip, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/child/[id]/wellbeing` | liste | kid_mood | Screen, Card, Field, Button, Chip, ListRow, EmptyState, Skeleton | 0 |  | à faire |
| `/meals` | liste | meals | Screen, Field, Button, Banner, Chip, EmptyState, Skeleton | 0 |  | à faire |
| `/meals/[slug]` | détail | — | Screen, Card, Sheet, Button, IconButton, Banner, Chip, SectionTitle, EmptyState, Skeleton | 1 |  | à faire |
| `/meals/menu` | liste | meal_menu | Screen, Card, Sheet, Button, IconButton, Banner, Chip, SectionTitle | 0 |  | à faire |
| `/meals/new` | formulaire | — | Screen, Card, Field, IconButton, Banner, Chip, SectionTitle | 0 |  | à faire |
| `/meals/pantry` | liste | meal_pantry | Screen, Field, Button, Chip, SectionTitle, EmptyState | 0 |  | à faire |
| `/meals/portions` | formulaire | — | Screen, Field, Button, Banner, Chip, Segmented, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/meals/rankings` | résultat | meal_rankings | Screen, Button, Chip, EmptyState, Skeleton | 0 |  | à faire |
| `/meals/settings` | réglage | — | Screen, Card, Field, Banner, Chip, ListRow, EmptyState, Skeleton | 0 |  | à faire |
| `/meals/shopping` | formulaire | family_shopping | Screen, Card, Field, Button, Banner, Chip, SectionTitle, EmptyState, Skeleton, Cascade | 1 |  | à faire |
| `/night` | scène | kid_sleep | Button, Chip, Toggle, ErrorView, Skeleton | 2 |  | à faire |
| `/night/help` | liste | baby_night_help | Screen, Card, Field, Button, Banner, Chip, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/sleep/[childId]` | formulaire | kid_sleep_rhythm | Screen, Card, Field, Button, IconButton, Banner, Chip, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/sleep/difficult/[childId]` | détail | — | EmptyState, ErrorView, Skeleton | 9 |  | à faire |
| `/sleep/help/[childId]` | détail | sleep_help | Screen, Card, Button, Banner, Chip, SectionTitle, EmptyState, ErrorView, Skeleton | 4 |  | à faire |
| `/sleep/tonight` | scène | — | Chip | 6 |  | à faire |

### Famille

| Route | Rôle | Outils | Composants | Couleurs | Animated RN | Statut |
|---|---|---|---|---:|:-:|---|
| `/family` | liste | family_tasks | Screen, Card, Field, Button, IconButton, Banner, Chip, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/family/birth-partner` | liste | — | Screen, Card, Field, Button, Banner, EmptyState, Skeleton | 0 |  | à faire |
| `/family/brain-dump` | formulaire | brain_dump | Screen, Card, Field, Button, IconButton, Banner, Chip | 0 |  | à faire |
| `/family/calm` | liste | — | Screen, Card, Button, Banner, Chip, ListRow, EmptyState, Skeleton | 0 |  | à faire |
| `/family/couple` | formulaire | couple_week | Screen, Card, Field, Button, ListRow, SectionTitle | 0 |  | à faire |
| `/family/custody` | formulaire | custody | Screen, Card, Sheet, Field, Button, Banner, Chip, ListRow, SectionTitle, EmptyState | 4 |  | à faire |
| `/family/difficult` | liste | family_difficult | Screen, Card, Button, Banner, ListRow, SectionTitle | 0 |  | à faire |
| `/family/domains` | liste | family_domains | Screen, Card, Button, Banner, Chip | 0 |  | à faire |
| `/family/exhausted` | liste | exhaustion_check | Screen, Card, Button, Banner, Chip | 0 |  | à faire |
| `/family/expenses` | formulaire | — | Screen, Field, Button, IconButton, Banner, Chip, Segmented, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/family/history` | historique | family_history | Screen, Card, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/family/kid-routine/[id]` | détail | — | Button | 0 |  | à faire |
| `/family/kid-routines` | liste | kid_routines | Screen, Card, Sheet, Field, Button, IconButton, Banner, Chip, SectionTitle, EmptyState | 0 |  | à faire |
| `/family/load` | liste | mental_load | Screen, Card, Button, Banner, EmptyState | 0 |  | à faire |
| `/family/me-time` | formulaire | family_metime | Screen, Card, Field, Button, Segmented, ListRow, SectionTitle, EmptyState | 0 |  | à faire |
| `/family/member/[id]` | détail | — | Screen, ListRow, SectionTitle, EmptyState | 0 |  | à faire |
| `/family/missions` | liste | family_missions | Screen, Button, Segmented, ListRow, EmptyState, ErrorView, Skeleton, Cascade | 0 |  | à faire |
| `/family/missions/[id]` | formulaire | — | Screen, Field, Button, EmptyState, ErrorView, Skeleton, Cascade | 0 |  | à faire |
| `/family/missions/done` | liste | — | Screen, Button, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/family/missions/new` | formulaire | — | Screen, Field, Button, Banner, Chip, Segmented | 0 |  | à faire |
| `/family/missions/responsibilities` | liste | — | Screen, ListRow, ErrorView, Skeleton, Cascade | 0 |  | à faire |
| `/family/moments` | liste | — | Screen, Card, Button, Banner, Chip, ListRow, EmptyState, Skeleton | 0 |  | à faire |
| `/family/my-info` | liste | — | Screen, Card, Field, Button, SectionTitle | 0 |  | à faire |
| `/family/my-place` | liste | family_my_place | Screen, ListRow, SectionTitle | 0 |  | à faire |
| `/family/nights` | formulaire | family_nights | Screen, Card, GlassSurface, Field, Button, Banner, Chip, Segmented, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/family/notebook` | liste | house_notebook | Screen, Card, Sheet, Field, Button, Banner, Chip, ListRow, SectionTitle, EmptyState | 0 |  | à faire |
| `/family/offduty` | liste | offduty | Screen, Card, Field, Button, Banner, Chip | 0 |  | à faire |
| `/family/papers` | liste | family_papers | Screen, Card, Sheet, Field, Button, Banner, Chip, ListRow, SectionTitle | 0 |  | à faire |
| `/family/pets` | liste | — | Screen, Banner, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/family/pets/[id]` | détail | — | Screen, Button, Banner, Chip, ListRow, EmptyState, Skeleton | 0 |  | à faire |
| `/family/prep` | liste | family_prep | Screen, Card, Button, Banner, EmptyState | 0 |  | à faire |
| `/family/review` | résultat | family_review | Screen, Card, ListRow, SectionTitle, Skeleton | 0 |  | à faire |
| `/family/routines` | formulaire | family_routines | Screen, Card, Sheet, Field, Button, Chip, ListRow, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/family/solo` | formulaire | solo_parent | Screen, Card, Sheet, Field, Button, Banner, Chip, Segmented, ListRow, SectionTitle | 0 |  | à faire |
| `/family/sos` | liste | family_sos | — | 2 |  | à faire |
| `/family/stocks` | détail | family_stocks | — | 0 |  | à faire |
| `/family/stocks/[id]` | détail | — | Screen, Card, Button, Banner, Chip, EmptyState, Skeleton, Cascade, DetailEnter | 0 |  | à faire |
| `/family/stocks/baby` | détail | — | — | 0 |  | à faire |
| `/family/stocks/new` | formulaire | — | Screen | 0 |  | à faire |
| `/family/understand` | liste | couple_understand | Screen, Field, Button, Chip, ListRow, SectionTitle, Cascade | 0 |  | à faire |
| `/family/understand/compose` | liste | — | Screen, Field, Button, Banner | 0 |  | à faire |
| `/family/understand/inbox` | liste | — | Screen, Sheet, Field, Button, IconButton, Chip, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/family/understand/request` | liste | — | Screen, Field, Banner, ListRow | 0 |  | à faire |
| `/family/urgent` | liste | family_urgent | — | 0 |  | à faire |

### Communauté

| Route | Rôle | Outils | Composants | Couleurs | Animated RN | Statut |
|---|---|---|---|---:|:-:|---|
| `/community` | liste | community | Screen, Card, Field, Button, IconButton, Banner, Chip, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/community/activity` | historique | — | Screen, Chip, EmptyState, Skeleton | 0 |  | à faire |
| `/community/album/[id]` | détail | — | Screen, Card, Sheet, Field, Button, IconButton, Chip, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/community/albums` | historique | — | Screen, Card, Sheet, Field, Button, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/community/blocked` | réglage | — | Screen, Card, Button, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/community/events` | liste | — | Screen, Card, Button, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/community/following` | liste | — | Screen, Card, Chip, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/community/group/[id]` | détail | — | Screen, Card, Sheet, Field, Button, IconButton, Banner, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/community/groups` | liste | — | Screen, Card, Sheet, Field, Button, ListRow, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/community/messages` | liste | — | Screen, Card, Button, Banner, Segmented, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/community/messages/[id]` | détail | — | Screen, Sheet, Button, IconButton, Banner, Chip, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/community/new` | formulaire | — | Screen, Card, Field, Button, Banner, Chip, Segmented, ErrorView, Skeleton | 4 |  | à faire |
| `/community/notifications` | liste | — | Screen, Card, Button, Chip, ListRow, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/community/post/[id]` | détail | — | Screen, Card, Sheet, Field, Button, Banner, Chip, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/community/profile` | formulaire | — | Screen, Card, Field, Button, Banner, Chip, Segmented, Toggle, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/community/rules` | réglage | — | Screen, Card, Button, Banner | 0 |  | à faire |
| `/community/saved` | historique | — | Screen, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/community/u/[handle]` | détail | — | Screen, Button, Banner, EmptyState, ErrorView, Skeleton | 0 |  | à faire |

## Vue par outil

Types : humeur/journal · tâches/planning · suivi/mesures · minuteur/session · formulaire/assistant · famille/partage/communauté · autre. Parcours : entrée → saisie → résultat → historique, d’après les routes sœurs qui existent (« feuille dans l’écran » : la saisie se fait dans une feuille du même écran). Les quatre dernières colonnes se remplissent au fil de la refonte (`scripts/homi/inventory-status.json` › `tools`).

### autre (16)

| Outil | Clé | Entrée | Saisie | Résultat | Historique | Écrans refondus | Commandes | Transition | Parcours vérifié |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|
| Bibliothèque | `library` | `/library` | — | — | — | non | non | non | non |
| Guides pratiques | `guides` | `/guide` | — | `/guide/[topic]` | — | non | non | non | non |
| Vidéos et tutos | `videos` | `/videos` | — | — | — | non | non | non | non |
| Sources et références | `sources` | `/sources` | — | — | — | non | non | non | non |
| Guides du cycle | `cycle_guides` | `/cycle/guides` | — | — | — | non | non | non | non |
| Ma contraception | `avoid_contraception` | `/contraception` | `/contraception/consultation` | — | `/contraception/emergency /contraception/history /contraception/journal /contraception/log /contraception/methods` | non | non | non | non |
| Missions familiales | `family_missions` | `/family/missions` | — | — | — | non | non | non | non |
| Liste de courses | `family_shopping` | `/meals/shopping` | `/meals/new /meals/portions` | `/meals/[slug] /meals/rankings` | `/meals/menu /meals/pantry` | non | non | non | non |
| Stocks du foyer | `family_stocks` | `/family/stocks` | — | — | — | non | non | non | non |
| Sorties en famille | `nearby` | `/outings` | — | — | — | non | non | non | non |
| Comprendre mon cycle | `ttc_understand` | `/fertility/understand` | — | — | — | non | non | non | non |
| Guide des produits pour enfants | `kid_products` | `/products` | — | `/products/[id] /products/compare` | — | non | non | non | non |
| Bien manger enceinte | `preg_eat` | `/pregnancy/eat` | — | — | — | non | non | non | non |
| Baby blues et dépression du post-partum | `pp_mental` | `/postpartum/understand` | `/postpartum/checkin /postpartum/support` | — | `/postpartum/healing /postpartum/history /postpartum/partner /postpartum/pelvic /postpartum/recovery /postpartum/sharing` | non | non | non | non |
| Trouver de l’aide | `pp_support` | `/postpartum/support` | `/postpartum/checkin` | — | `/postpartum/healing /postpartum/history /postpartum/partner /postpartum/pelvic /postpartum/recovery /postpartum/sharing /postpartum/understand` | non | non | non | non |
| Classement des recettes | `meal_rankings` | `/meals/rankings` | `/meals/new /meals/portions /meals/shopping` | `/meals/[slug]` | `/meals/menu /meals/pantry` | non | non | non | non |

### famille/partage/communauté (12)

| Outil | Clé | Entrée | Saisie | Résultat | Historique | Écrans refondus | Commandes | Transition | Parcours vérifié |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|
| Répartition de la charge mentale | `mental_load` | `/family/load` | — | — | — | non | non | non | non |
| Confier un domaine | `family_domains` | `/family/domains` | — | — | — | non | non | non | non |
| Point de couple | `couple_week` | `/family/couple` | dans l’écran | — | — | non | non | non | non |
| Se comprendre | `couple_understand` | `/family/understand` | — | — | — | non | non | non | non |
| Parent solo | `solo_parent` | `/family/solo` | feuille dans l’écran | — | — | non | non | non | non |
| Communauté | `community` | `/community` | — | — | — | non | non | non | non |
| Relais de nuit | `family_nights` | `/family/nights` | dans l’écran | — | — | non | non | non | non |
| Résumés | `summary` | `/summary` | — | — | — | non | non | non | non |
| Espace du co-parent | `pp_partner` | `/postpartum/partner` | `/postpartum/checkin /postpartum/support` | — | `/postpartum/healing /postpartum/history /postpartum/pelvic /postpartum/recovery /postpartum/sharing /postpartum/understand` | non | non | non | non |
| Garde alternée | `custody` | `/family/custody` | feuille dans l’écran | — | — | non | non | non | non |
| Garde et nounou | `childcare` | `/garde` | — | — | — | non | non | non | non |
| Bilan de la semaine | `family_review` | `/family/review` | — | — | — | non | non | non | non |

### formulaire/assistant (24)

| Outil | Clé | Entrée | Saisie | Résultat | Historique | Écrans refondus | Commandes | Transition | Parcours vérifié |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|
| Scanner un aliment | `scan_food` | `/scanner/food` | `/scanner/avoid` | `/scanner/compare /scanner/product /scanner/result/[id]` | `/scanner/history /scanner/recalls` | oui | oui | oui | oui |
| Scanner un produit | `scan_product` | `/scanner/product` | `/scanner/avoid` | `/scanner/compare /scanner/food /scanner/result/[id]` | `/scanner/history /scanner/recalls` | oui | oui | oui | oui |
| Comparer deux produits | `scan_compare` | `/scanner/compare` | `/scanner/avoid` | `/scanner/food /scanner/product /scanner/result/[id]` | `/scanner/history /scanner/recalls` | oui | oui | oui | oui |
| Mes questions pour le rendez-vous | `consult_questions` | `/consult/questions` | dans l’écran | — | — | non | non | non | non |
| Documents de santé | `documents` | `/documents` | `/documents/[id] /documents/labs /documents/scan` | `/documents/export` | `/documents/book` | non | non | non | non |
| Point sur ma fatigue | `exhaustion_check` | `/family/exhausted` | — | — | — | non | non | non | non |
| Urgences | `emergency` | `/emergency` | — | — | — | non | non | non | non |
| Assistant | `ask` | `/ask` | — | — | — | non | non | non | non |
| Assistant hors ligne | `local_ai` | `/assistant/local` | — | — | `/assistant/chat /assistant/history` | non | non | non | non |
| Mes conseils du cycle | `cycle_advice` | `/cycle/advice` | — | — | — | non | non | non | non |
| Comparer les contraceptions | `avoid_methods` | `/contraception/methods` | `/contraception/consultation` | — | `/contraception/emergency /contraception/history /contraception/journal /contraception/log` | non | non | non | non |
| Contraception d’urgence | `avoid_emergency` | `/contraception/emergency` | `/contraception/consultation` | — | `/contraception/history /contraception/journal /contraception/log /contraception/methods` | non | non | non | non |
| Préparer ma consultation de contraception | `avoid_consult` | `/contraception/consultation` | dans l’écran | — | `/contraception/emergency /contraception/history /contraception/journal /contraception/log /contraception/methods` | non | non | non | non |
| Démarrer ma grossesse | `ttc_start_pregnancy` | `/pregnancy/start` | dans l’écran | — | — | non | non | non | non |
| Journée difficile | `family_difficult` | `/family/difficult` | — | — | — | non | non | non | non |
| Papiers de la famille | `family_papers` | `/family/papers` | feuille dans l’écran | — | — | non | non | non | non |
| Préparer ma consultation de fertilité | `ttc_consult` | `/fertility/consultation` | dans l’écran | — | — | non | non | non | non |
| Mode urgence du foyer | `family_urgent` | `/family/urgent` | — | — | — | non | non | non | non |
| Je craque | `family_sos` | `/family/sos` | — | — | — | non | non | non | non |
| Aide au sommeil | `sleep_help` | `/sleep/help/[childId]` | — | — | — | non | non | non | non |
| Fiche de l’enfant | `kid_profile` | `/child/[id]` | — | — | — | non | non | non | non |
| École ou mode de garde | `kid_school` | `/child/[id]/school` | — | — | — | non | non | non | non |
| Fiche à transmettre | `kid_card` | `/child/[id]/card` | — | — | — | non | non | non | non |
| Démarches de l’enfant | `kid_steps` | `/child/[id]/steps` | — | — | — | non | non | non | non |

### humeur/journal (13)

| Outil | Clé | Entrée | Saisie | Résultat | Historique | Écrans refondus | Commandes | Transition | Parcours vérifié |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|
| Mon humeur | `mood` | `/me/mood` | — | `/me/mood/[id]` | `/me/diary /me/sleep` | oui | oui | oui | oui |
| Mon journal intime | `me_diary` | `/me/diary` | — | `/me/mood/[id]` | `/me/mood /me/sleep` | non | non | non | non |
| Journal de ma contraception | `contraception_journal` | `/contraception/journal` | `/contraception/consultation` | — | `/contraception/emergency /contraception/history /contraception/log /contraception/methods` | non | non | non | non |
| Vider ma tête | `brain_dump` | `/family/brain-dump` | dans l’écran | — | — | non | non | non | non |
| Carnet de la maison | `house_notebook` | `/family/notebook` | feuille dans l’écran | — | — | non | non | non | non |
| Idées de prénoms | `preg_names` | `/names` | — | — | — | non | non | non | non |
| Journal du cycle | `cycle_journal` | `/cycle/journal` | — | — | `/cycle/journal` | non | non | non | non |
| Mes symptômes de grossesse | `preg_feel` | `/pregnancy/feel` | dans l’écran | — | — | non | non | non | non |
| Mon point du jour | `pp_checkin` | `/postpartum/checkin` | `/postpartum/support` | — | `/postpartum/healing /postpartum/history /postpartum/partner /postpartum/pelvic /postpartum/recovery /postpartum/sharing /postpartum/understand` | non | non | non | non |
| Diversification alimentaire | `baby_foods` | `/child/[id]/discoveries` | feuille dans l’écran | — | — | non | non | non | non |
| Étapes du développement | `kid_grow` | `/child/[id]/grow` | feuille dans l’écran | — | — | non | non | non | non |
| Humeur et émotions de l’enfant | `kid_mood` | `/child/[id]/wellbeing` | — | — | — | non | non | non | non |
| Album photo | `kid_album` | `/child/[id]/album` | feuille dans l’écran | — | `/child/[id]/album` | non | non | non | non |

### minuteur/session (9)

| Outil | Clé | Entrée | Saisie | Résultat | Historique | Écrans refondus | Commandes | Transition | Parcours vérifié |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|
| Je décroche | `offduty` | `/family/offduty` | — | — | — | non | non | non | non |
| Mouvements de bébé | `preg_moves` | `/pregnancy/moves` | — | — | — | non | non | non | non |
| Allaitement | `baby_breastfeed` | `/track/[kind]` | dans l’écran | — | — | non | non | non | non |
| Journée des biberons | `baby_bottle_timer` | `/bottle/[childId]` | feuille dans l’écran | `/bottle/scoops` | `/bottle/history` | oui | oui | oui | oui |
| Compteur de mesurettes | `bottle_scoops` | `/bottle/scoops` | — | `/bottle/[childId]` | `/bottle/history` | oui | oui | oui | oui |
| Noter un biberon | `baby_bottle` | `/track/[kind]` | dans l’écran | — | — | non | non | non | non |
| Sommeil de l’enfant | `kid_sleep` | `/night` | — | — | `/night/help` | non | non | non | non |
| Bilan de la nuit | `baby_night_help` | `/night/help` | — | — | — | non | non | non | non |
| Couches | `baby_diaper` | `/track/[kind]` | dans l’écran | — | — | non | non | non | non |

### suivi/mesures (35)

| Outil | Clé | Entrée | Saisie | Résultat | Historique | Écrans refondus | Commandes | Transition | Parcours vérifié |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|
| Mon sommeil | `sleep` | `/me/sleep` | feuille dans l’écran | `/me/mood/[id]` | `/me/diary /me/mood` | non | non | non | non |
| Produits scannés | `scan_history` | `/scanner/history` | `/scanner/avoid` | `/scanner/compare /scanner/food /scanner/product /scanner/result/[id]` | `/scanner/recalls` | oui | oui | oui | oui |
| Carnet de santé | `health_book` | `/documents/book` | `/documents/[id] /documents/labs /documents/scan` | `/documents/export` | — | non | non | non | non |
| Médicaments | `medications` | `/medications` | — | — | — | non | non | non | non |
| Produits à éviter | `scan_avoid` | `/scanner/avoid` | dans l’écran | `/scanner/compare /scanner/food /scanner/product /scanner/result/[id]` | `/scanner/history /scanner/recalls` | oui | oui | partiel | partiel |
| Alertes de rappel de produits | `recall_alerts` | `/scanner/recalls` | `/scanner/avoid` | `/scanner/compare /scanner/food /scanner/product /scanner/result/[id]` | `/scanner/history` | oui | oui | partiel | oui |
| Mon cycle | `cycle_home` | `/cycle` | dans l’écran | — | — | non | non | non | non |
| Calendrier du cycle | `cycle_calendar` | `/cycle/calendar` | feuille dans l’écran | — | — | non | non | non | non |
| Symptômes du cycle | `cycle_symptoms` | `/cycle/symptoms` | — | — | — | non | non | non | non |
| Douleurs | `cycle_pain` | `/cycle/pain` | — | — | — | non | non | non | non |
| Pertes vaginales | `cycle_discharge` | `/cycle/discharge` | — | — | — | non | non | non | non |
| Saignements inhabituels | `cycle_bleeding` | `/cycle/bleeding` | — | — | — | non | non | non | non |
| Statistiques du cycle | `cycle_stats` | `/cycle/stats` | — | — | — | non | non | non | non |
| Résumé du mois | `cycle_month` | `/cycle/month` | — | — | — | non | non | non | non |
| Exporter mon suivi du cycle | `cycle_export` | `/cycle/export` | — | — | — | non | non | non | non |
| Rapports | `ttc_intimacy` | `/cycle/intimacy` | dans l’écran | — | — | non | non | non | non |
| Cycle et période fertile | `ttc_cycle` | `/fertility` | — | — | — | non | non | non | non |
| Tests d’ovulation et de grossesse | `ttc_tests` | `/fertility/log` | — | — | `/fertility/log` | non | non | non | non |
| Glaire cervicale | `ttc_mucus` | `/fertility/mucus` | — | — | — | non | non | non | non |
| Température au réveil | `ttc_temperature` | `/fertility/body` | dans l’écran | — | — | non | non | non | non |
| Examens de fertilité | `ttc_exams` | `/fertility/exams` | — | — | — | non | non | non | non |
| Suivi de PMA | `pma_tracker` | `/fertility/pma` | feuille dans l’écran | — | — | non | non | non | non |
| Ma grossesse semaine par semaine | `preg_evolution` | `/pregnancy` | — | — | — | non | non | non | non |
| Mon poids pendant la grossesse | `preg_weight` | `/pregnancy/weight` | — | — | — | non | non | non | non |
| Ma récupération après la naissance | `pp_recovery` | `/postpartum` | — | — | — | non | non | non | non |
| Mon évolution | `pp_history` | `/postpartum/history` | `/postpartum/checkin /postpartum/support` | — | `/postpartum/healing /postpartum/partner /postpartum/pelvic /postpartum/recovery /postpartum/sharing /postpartum/understand` | non | non | non | non |
| Cicatrisation et rééducation | `pp_body` | `/postpartum/recovery` | `/postpartum/checkin /postpartum/support` | — | `/postpartum/healing /postpartum/history /postpartum/partner /postpartum/pelvic /postpartum/sharing /postpartum/understand` | non | non | non | non |
| Historique des biberons | `baby_bottle_history` | `/bottle/history` | feuille dans l’écran | `/bottle/[childId] /bottle/scoops` | `/bottle/history` | oui | oui | oui | oui |
| Planning de sommeil | `kid_sleep_rhythm` | `/sleep/[childId]` | dans l’écran | `/sleep/difficult/[childId] /sleep/help/[childId]` | — | non | non | non | non |
| Suivi de la journée | `baby_daily` | `/track` | `/track/[kind]` | — | — | non | non | non | non |
| Dents | `kid_teeth` | `/teeth` | feuille dans l’écran | — | — | non | non | non | non |
| Journal complet | `journal` | `/journal` | — | — | `/journal` | non | non | non | non |
| Vaccins | `kid_vaccines` | `/child/[id]/vaccines` | feuille dans l’écran | — | — | non | non | non | non |
| Suivi de santé de l’enfant | `kid_health` | `/child/[id]/health-tracking` | feuille dans l’écran | — | — | non | non | non | non |
| Traitements de l’enfant | `kid_treatments` | `/child/[id]/needs` | feuille dans l’écran | — | — | non | non | non | non |

### tâches/planning (18)

| Outil | Clé | Entrée | Saisie | Résultat | Historique | Écrans refondus | Commandes | Transition | Parcours vérifié |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|
| Repas et recettes | `meals` | `/meals` | `/meals/new /meals/portions /meals/shopping` | `/meals/[slug] /meals/rankings` | `/meals/menu /meals/pantry` | non | non | non | non |
| Menu de la semaine | `meal_menu` | `/meals/menu` | `/meals/new /meals/portions /meals/shopping` | `/meals/[slug] /meals/rankings` | `/meals/pantry` | non | non | non | non |
| Cuisiner avec ce que j’ai | `meal_pantry` | `/meals/pantry` | `/meals/new /meals/portions /meals/shopping` | `/meals/[slug] /meals/rankings` | `/meals/menu` | non | non | non | non |
| Rendez-vous et examens | `appointments` | `/appointments` | feuille dans l’écran | — | — | non | non | non | non |
| Trousse de règles | `cycle_kit` | `/cycle/kit` | — | — | — | non | non | non | non |
| Rappels de contraception | `avoid_reminders` | `/contraception/reminders` | `/contraception/consultation` | — | `/contraception/emergency /contraception/history /contraception/journal /contraception/log /contraception/methods` | non | non | non | non |
| Temps pour soi | `family_metime` | `/family/me-time` | dans l’écran | — | — | non | non | non | non |
| Agenda familial | `family_calendar` | `/calendar` | feuille dans l’écran | — | — | non | non | non | non |
| Tâches du foyer | `family_tasks` | `/family` | — | — | — | non | non | non | non |
| Ma place dans la famille | `family_my_place` | `/family/my-place` | — | — | — | non | non | non | non |
| Routines du foyer | `family_routines` | `/family/routines` | feuille dans l’écran | — | — | non | non | non | non |
| Échéances à préparer | `family_prep` | `/family/prep` | — | — | — | non | non | non | non |
| Rappels | `reminders` | `/settings/reminders` | feuille dans l’écran | — | — | non | non | non | non |
| Rappels du projet bébé | `ttc_reminders` | `/fertility/reminders` | — | — | — | non | non | non | non |
| Calendrier de grossesse | `preg_calendar` | `/pregnancy/calendar` | — | — | — | non | non | non | non |
| Listes de préparation | `preg_lists` | `/lists` | feuille dans l’écran | — | — | non | non | non | non |
| Routines en images | `kid_routines` | `/family/kid-routines` | feuille dans l’écran | — | — | non | non | non | non |
| Historique des tâches | `family_history` | `/family/history` | — | — | `/family/history` | non | non | non | non |

## Limites

- Rôle, zone et type d’outil sont calculés par règles (fichier `scripts/homi/inventory.mjs`, tables `ZONES`, `ROLE_RULES`, `TYPE_BY_KEY`) : à corriger dans ces tables plutôt qu’à la main.
- Les composants et couleurs sont comptés dans le fichier de route seul ; un écran qui délègue à `src/features/**` peut afficher 0 tout en contenant des couleurs en dur dans son module.
- Un même outil peut figurer dans plusieurs parcours (même écran, paramètre différent) : une ligne par identifiant du catalogue.
