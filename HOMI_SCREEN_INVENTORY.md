# HOMI — Inventaire des écrans et grille de couverture par outil

> Fichier GÉNÉRÉ par `node scripts/homi/inventory.mjs` (vérification : `--check`). Ne pas modifier à la main :
> les statuts se saisissent dans `scripts/homi/inventory-status.json`, puis on relance le script.
> Données brutes : `HOMI_SCREEN_INVENTORY.csv` (lignes `ecran` puis lignes `outil`).

**229 routes** réelles (`src/lib/routes.generated.ts`) portées par **230 fichiers** d’écran (la route `/` a deux fichiers : l’aiguillage de lancement `src/app/index.tsx` et l’Accueil `src/app/(tabs)/index.tsx`). **155 outils** du catalogue (`MATRICE_OUTILS.csv`).

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
| Auth / entrée | 10 | 0 | 2 | 8 | 0 | 1 |
| Admin | 7 | 7 | 0 | 0 | 0 | 0 |
| Réglages | 21 | 21 | 0 | 0 | 2 | 0 |
| Accueil | 20 | 20 | 0 | 0 | 9 | 1 |
| Santé | 29 | 29 | 0 | 0 | 16 | 0 |
| Cycle et fertilité | 46 | 46 | 0 | 0 | 15 | 1 |
| Grossesse et post-partum | 19 | 19 | 0 | 0 | 6 | 0 |
| Bébé et enfant | 32 | 32 | 0 | 0 | 70 | 1 |
| Famille | 30 | 30 | 0 | 0 | 6 | 0 |
| Communauté | 16 | 16 | 0 | 0 | 4 | 0 |
| **Total** | **230** | **220** | **2** | **8** | **128** | **4** |

Rôles : détail 35 · formulaire 46 · historique 17 · liste 85 · réglage 27 · résultat 13 · scène 7.

## Pilotes proposés (à valider en premier)

Choisis dans l’inventaire réel pour couvrir les trois formes d’outil ; chacun valide les surfaces, commandes et transitions avant la généralisation.

| Pilote | Outil (clé) | Pourquoi | Routes du parcours |
|---|---|---|---|
| Saisie | Mon humeur (`mood`) | bilan court à choix (humeur, énergie, note facultative), privé, avec relais d’aide : valide champs mats, puces, bouton principal au-dessus du clavier et feuille de confirmation | `/me/mood` → `/me/diary` |
| Données | Biberon (`pp_bottle`) | minuteur en direct + saisie rapide + historique et compteur de mesurettes : valide chiffres animés, carte d’état, transition liste → détail et lisibilité de nuit | `/bottle` → `/bottle/[childId]` → `/bottle/history` → `/bottle/scoops` |
| Plusieurs étapes | Scanner un produit (`scan_product`) | caméra ou saisie du code → fiche résultat → historique et comparaison : valide transitions entre écrans, états chargement / erreur réseau / introuvable | `/scanner` → `/scanner/product` → `/scanner/result/[id]` → `/scanner/history` → `/scanner/compare` |

## Écrans par zone

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
| `/intro` | scène | — | Button | 0 | oui | tranche |
| `/onboarding` | formulaire | — | Screen, Card, Field, Button, IconButton, Banner, Chip, Toggle, FocalMark | 0 |  | tranche |
| `/welcome` | scène | — | Button, IconButton, FocalMark | 0 |  | fait |

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
| `/journeys` | liste | journeys | Screen, Card, Sheet, Button, Banner, ListRow, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/journeys/[id]` | détail | — | Screen, Card, Button, Banner, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/journeys/blocked` | réglage | — | Screen, Button, Banner, EmptyState | 0 |  | à faire |
| `/legal/[doc]` | détail | — | Screen, Card | 0 |  | à faire |
| `/notifications` | liste | notifications | Screen, IconButton, Chip, SectionTitle, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/premium` | détail | — | Screen | 0 |  | à faire |
| `/profile` | liste | — | Screen, Card, Button, Chip, ListRow, SectionTitle, ErrorView, Skeleton | 1 |  | à faire |
| `/profiles/new` | formulaire | — | Screen, Card, Button, Banner, Segmented, ErrorView, Skeleton | 0 |  | à faire |
| `/settings` | réglage | settings | Screen, Card, Field, Button, Banner, Toggle, ListRow, SectionTitle | 0 |  | à faire |
| `/settings/account` | réglage | — | Screen, Card, Sheet, Field, Button, Banner, ListRow, SectionTitle | 0 |  | à faire |
| `/settings/appearance` | réglage | — | Screen, GlowCard, Button, Banner, Chip, Segmented, Toggle, SectionTitle, CompletionCheck | 1 |  | à faire |
| `/settings/family` | réglage | — | Screen, Card, Field, Button, Banner, Chip, Segmented, ListRow, SectionTitle | 0 |  | à faire |
| `/settings/home` | réglage | home_settings | Screen, Card, Button, IconButton, Chip, Toggle, SectionTitle, Cascade | 0 |  | à faire |
| `/settings/language` | réglage | — | Screen, Card, Banner, SectionTitle | 0 |  | à faire |
| `/settings/notifications` | réglage | — | Screen, Card, Button, Banner, Chip, ListRow, SectionTitle | 0 |  | à faire |
| `/settings/privacy` | réglage | — | Screen, Card, Sheet, Field, Button, Banner, Chip, Toggle, SectionTitle | 0 |  | à faire |
| `/settings/reminders` | réglage | reminders | Screen, Card, Sheet, Field, Button, Banner, Chip, Segmented, Toggle, SectionTitle | 0 |  | à faire |
| `/settings/services` | réglage | — | Screen, Card, Banner, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/settings/subscription` | réglage | — | Screen, Card, Button, Banner, SectionTitle | 0 |  | à faire |
| `/settings/sync` | réglage | — | Screen, Card, Button, IconButton, Banner, ListRow, SectionTitle, EmptyState | 0 |  | à faire |

### Accueil

| Route | Rôle | Outils | Composants | Couleurs | Animated RN | Statut |
|---|---|---|---|---:|:-:|---|
| `/ ((tabs)/index.tsx)` | liste | — | Screen, IconButton, Banner, ErrorView, Skeleton, Cascade | 0 |  | à faire |
| `/agenda` | détail | — | — | 0 |  | à faire |
| `/ask` | liste | ask | Screen, Card, Field, Button, IconButton, Banner, Chip, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/assistant/chat` | liste | — | Screen, Card, Button, IconButton, Chip, Toggle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/assistant/local` | liste | local_ai | Screen, GlassSurface, IconButton, Banner, Chip, Skeleton | 4 |  | à faire |
| `/calendar` | formulaire | family_calendar | Screen, Card, Sheet, Field, Button, IconButton, Banner, Chip, Segmented, Toggle, SectionTitle, ErrorView, Skeleton | 0 | oui | à faire |
| `/health` | détail | — | — | 0 |  | à faire |
| `/household` | détail | — | — | 0 |  | à faire |
| `/journal` | historique | — | Screen, Card, Field, Button, IconButton, Chip, Segmented, ListRow, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/me` | liste | — | Screen, Card, GlassSurface, Banner, ListRow, SectionTitle | 0 |  | à faire |
| `/me/diary` | historique | — | Screen, Card, Field, Button, Banner, Chip, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/me/mood` | liste | mood | Screen, Card, Field, Button, Banner, Chip, Toggle, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/me/sleep` | liste | sleep | Screen, Card, Sheet, Field, Button, IconButton, Banner, Chip, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/moi` | liste | — | Screen, Card, Sheet, Button, Banner, Segmented, ListRow, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/story` | scène | — | Screen, Button | 0 |  | à faire |
| `/summary` | résultat | summary, family_summary | Screen, Card, Button, Banner, Chip, SectionTitle | 0 |  | à faire |
| `/today` | liste | — | Screen, Card, Button, Segmented | 0 |  | à faire |
| `/tools` | liste | — | Screen, Field, Button, Chip, EmptyState, ErrorView, Skeleton, ToolCard | 0 |  | à faire |
| `/track` | liste | baby_daily | Screen, Card, Button, Banner, Segmented, ListRow, SectionTitle, ErrorView, Skeleton | 5 |  | à faire |
| `/track/[kind]` | formulaire | pp_feeding, baby_bottle, baby_diaper | Screen, Field, Button, Banner, Chip, Segmented, EmptyState, ErrorView, Skeleton | 0 |  | à faire |

### Santé

| Route | Rôle | Outils | Composants | Couleurs | Animated RN | Statut |
|---|---|---|---|---:|:-:|---|
| `/appointments` | formulaire | appointments | Screen, Card, GlassSurface, Sheet, Field, Button, Banner, Chip, Segmented, Toggle, SectionTitle, ErrorView | 1 |  | à faire |
| `/article/[slug]` | détail | — | Screen, Card, Button, Banner, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/consult/questions` | formulaire | consult_questions | Screen | 0 |  | à faire |
| `/documents` | liste | documents | Screen, Card, GlassSurface, Sheet, Field, Button, Banner, Chip, SectionTitle, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/documents/[id]` | formulaire | — | Screen, Card, Sheet, Field, Button, IconButton, Banner, Segmented, Toggle, SectionTitle, EmptyState, ErrorView, Skeleton | 2 |  | à faire |
| `/documents/book` | liste | — | Screen, Card, Banner, Chip, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/documents/export` | résultat | — | Screen, Card, Button, Banner, Toggle, SectionTitle, Skeleton | 0 |  | à faire |
| `/documents/scan` | formulaire | — | Screen, Card, Field, Button, IconButton, Banner, Segmented, Toggle | 3 |  | à faire |
| `/emergency` | détail | emergency | Screen, Card, Banner | 0 |  | à faire |
| `/guide/[topic]` | détail | guide_loss, guide_couple, guide_pma, guide_work, guide_firstaid, guide_neonat, guide_kidfood, guide_kidsleep, guide_hygiene, guide_activities, guide_toddler, guide_illnesses, guide_school, guide_sport, guide_behaviour | Screen, Card, Banner, ListRow, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/library` | liste | library, ttc_articles, preg_birth_prep, preg_articles, preg_intimacy | Screen, Card, GlassSurface, Field, Chip, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/medications` | liste | — | Screen, Card, Banner, Chip, SectionTitle | 1 |  | à faire |
| `/nearby` | détail | — | — | 0 |  | à faire |
| `/outings` | liste | nearby | Screen, GlassSurface, Button, Banner, Chip, Segmented, SectionTitle, Skeleton | 9 |  | à faire |
| `/products` | liste | kid_products | Screen, Field, Button, Banner, Chip, EmptyState, Skeleton | 0 |  | à faire |
| `/products/[id]` | détail | — | Screen, Card, Button, Banner, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/products/compare` | résultat | — | Screen, Card, Chip, EmptyState | 0 |  | à faire |
| `/scanner` | liste | — | Screen, Card, GlassSurface, Button, Banner, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/scanner/avoid` | formulaire | scan_avoid | Screen, Card, Field, IconButton, Banner, ListRow, EmptyState, Skeleton | 0 |  | à faire |
| `/scanner/compare` | résultat | scan_compare | Screen, Card, Button, Banner, Chip, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/scanner/food` | détail | scan_food | Screen | 0 |  | à faire |
| `/scanner/history` | historique | scan_history | Screen, Button, IconButton, Chip, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/scanner/product` | détail | scan_product | Screen | 0 |  | à faire |
| `/scanner/recalls` | liste | recall_alerts | Screen, Card, Button, Banner, Toggle, ListRow, SectionTitle | 0 |  | à faire |
| `/scanner/result/[id]` | résultat | — | Screen, Card, Button, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/sources` | liste | sources | Screen, Card, Field, Button, Banner, Chip, EmptyState, Skeleton | 0 |  | à faire |
| `/teeth` | liste | kid_teeth | Screen, Card, Sheet, Field, Button, Banner, Chip, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/tutos` | détail | video_tutos | — | 0 |  | à faire |
| `/videos` | liste | official_videos | Screen, Card, Chip, Segmented, ListRow, SectionTitle | 0 |  | à faire |

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
| `/cycle` | formulaire | avoid_cycle | Screen, Field, Button, Chip, Segmented, ErrorView, Skeleton | 0 |  | à faire |
| `/cycle/advice` | liste | — | Screen, Banner, Skeleton | 0 |  | à faire |
| `/cycle/bleeding` | liste | — | Screen, Field, Button, Banner | 0 |  | à faire |
| `/cycle/calendar` | liste | avoid_fertile | Screen, Sheet, Button, IconButton, ListRow, ErrorView, Skeleton | 0 | oui | à faire |
| `/cycle/discharge` | liste | — | Screen, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/cycle/discharge/[id]` | formulaire | — | Screen, Field, Button, Banner | 0 |  | à faire |
| `/cycle/emergency` | détail | — | Screen | 0 |  | à faire |
| `/cycle/export` | résultat | — | Screen, Button, Banner | 0 |  | à faire |
| `/cycle/guides` | liste | cycle_guides | Screen | 0 |  | à faire |
| `/cycle/guides/[slug]` | détail | — | Screen, Button, EmptyState | 0 |  | à faire |
| `/cycle/home-card` | réglage | — | Screen, Button, IconButton | 0 |  | à faire |
| `/cycle/intimacy` | formulaire | — | Screen, Field, Button, Banner, ErrorView, Skeleton | 0 |  | à faire |
| `/cycle/journal` | historique | cycle_journal | Screen, Field, Button, Banner | 0 |  | à faire |
| `/cycle/kit` | liste | cycle_kit | Screen, Card, Button, Banner, ListRow | 0 |  | à faire |
| `/cycle/month` | résultat | — | Screen, Card, Button, IconButton | 0 |  | à faire |
| `/cycle/pain` | liste | — | Screen, Field, Button, Banner | 0 |  | à faire |
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
| `/fertility/intimacy` | détail | ttc_intimacy | — | 0 |  | à faire |
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
| `/postpartum/history` | historique | — | Screen, Card, Button, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/postpartum/partner` | liste | pp_partner | Screen, Card, Banner, ListRow, SectionTitle, Skeleton | 0 |  | à faire |
| `/postpartum/recovery` | liste | pp_body | Screen, Card, Banner, ListRow | 0 |  | à faire |
| `/postpartum/sharing` | liste | — | Screen, Card, Field, Button, Banner, Chip, Toggle, ListRow, SectionTitle, Skeleton | 0 |  | à faire |
| `/postpartum/support` | formulaire | pp_support | Screen, Card, Sheet, Field, Button, IconButton, Banner, Chip, Segmented, ListRow, SectionTitle, Skeleton | 0 |  | à faire |
| `/postpartum/understand` | liste | pp_mental | Screen, Banner | 0 |  | à faire |
| `/pregnancy` | liste | preg_evolution | Screen, Card, GlassSurface, Field, Button, Banner, Chip, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 5 |  | à faire |
| `/pregnancy/calendar` | liste | preg_calendar | Screen, Card, Button, Banner, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/pregnancy/eat` | liste | preg_eat | Screen, Card, Button, Banner, Chip, SectionTitle, Skeleton | 0 |  | à faire |
| `/pregnancy/edit` | formulaire | preg_edit | Screen, Card, Button, Banner, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/pregnancy/end` | formulaire | preg_end | Screen, Card, Field, Button, Banner, Chip, EmptyState | 0 |  | à faire |
| `/pregnancy/feel` | formulaire | preg_feel | Screen, Card, Field, Button, Banner, Chip, Toggle, SectionTitle, EmptyState | 0 |  | à faire |
| `/pregnancy/moves` | liste | preg_moves | Screen, Card, Field, Button, Banner, Chip, ListRow, SectionTitle, EmptyState | 0 |  | à faire |
| `/pregnancy/start` | formulaire | ttc_start_pregnancy | Screen, Card, Field, Button, Banner, Segmented | 0 |  | à faire |
| `/pregnancy/weight` | liste | preg_weight | Screen, Card, Field, Button, Banner, Toggle, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |

### Bébé et enfant

| Route | Rôle | Outils | Composants | Couleurs | Animated RN | Statut |
|---|---|---|---|---:|:-:|---|
| `/baby` | détail | — | — | 0 |  | à faire |
| `/bottle` | liste | — | Screen, Button, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/bottle/[childId]` | détail | pp_bottle | Screen, Card, Sheet, Field, Button, Banner, Chip, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/bottle/history` | historique | baby_bottle_history | Screen, Card, Sheet, Button, IconButton, Chip, Segmented, SectionTitle, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/bottle/scoops` | détail | bottle_scoops | Screen, Card, Field, Button, Banner | 0 |  | à faire |
| `/child/[id]` | détail | kid_profile, kid_milestones | Screen, Button, IconButton, EmptyState, ErrorView, Skeleton | 1 |  | à faire |
| `/child/[id]/album` | historique | — | Screen, Card, Sheet, Field, Button, Banner, Segmented, SectionTitle, EmptyState, ErrorView, Skeleton | 2 |  | à faire |
| `/child/[id]/card` | résultat | kid_card | Screen, Card, Field, Button, Banner, ListRow, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/child/[id]/discoveries` | formulaire | baby_foods | Screen, GlassSurface, Sheet, Field, Button, IconButton, Banner, Chip, SectionTitle, EmptyState, ErrorView, Skeleton | 25 | oui | à faire |
| `/child/[id]/foods` | détail | — | — | 0 |  | à faire |
| `/child/[id]/grow` | liste | kid_grow | Screen, GlassSurface, Sheet, Field, Button, Banner, Chip, SectionTitle, EmptyState, ErrorView, Skeleton | 13 |  | à faire |
| `/child/[id]/growth` | détail | kid_growth | — | 0 |  | à faire |
| `/child/[id]/health-tracking` | formulaire | kid_health | Screen, Card, Sheet, Field, Button, Banner, Chip, Segmented, Toggle, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/child/[id]/needs` | formulaire | kid_treatments, kid_needs | Screen, Card, Sheet, Field, Button, Banner, Chip, Segmented, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/child/[id]/school` | liste | — | Screen, Card, Field, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/child/[id]/steps` | liste | kid_steps | Screen, Card, Button, Banner, EmptyState, Skeleton | 0 |  | à faire |
| `/child/[id]/vaccines` | formulaire | kid_vaccines | Screen, Card, GlassSurface, Sheet, Field, Button, IconButton, Banner, Chip, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/child/[id]/wellbeing` | liste | kid_mood | Screen, Card, Field, Button, Chip, ListRow, EmptyState, Skeleton | 0 |  | à faire |
| `/meals` | liste | meals | Screen, Field, Button, Banner, Chip, EmptyState, Skeleton | 0 |  | à faire |
| `/meals/[slug]` | détail | — | Screen, Card, Sheet, Button, IconButton, Banner, Chip, SectionTitle, EmptyState, Skeleton | 1 |  | à faire |
| `/meals/menu` | liste | — | Screen, Card, Sheet, Button, IconButton, Banner, Chip, SectionTitle | 0 |  | à faire |
| `/meals/new` | formulaire | — | Screen, Card, Field, IconButton, Banner, Chip, SectionTitle | 0 |  | à faire |
| `/meals/pantry` | liste | — | Screen, Field, Button, Chip, SectionTitle, EmptyState | 0 |  | à faire |
| `/meals/rankings` | résultat | meal_rankings | Screen, Button, Chip, EmptyState, Skeleton | 0 |  | à faire |
| `/meals/settings` | réglage | — | Screen, Card, Field, Banner, Chip, ListRow, EmptyState, Skeleton | 0 |  | à faire |
| `/meals/shopping` | formulaire | — | Screen, Card, Field, Button, Banner, Chip, SectionTitle, EmptyState, Skeleton, Cascade | 1 |  | à faire |
| `/night` | scène | kid_sleep | Button, Chip, Toggle, ErrorView, Skeleton | 8 |  | à faire |
| `/night/help` | liste | baby_night_help | Screen, Card, Field, Button, Banner, Chip, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/sleep/[childId]` | formulaire | kid_sleep_rhythm | Screen, Card, Field, Button, IconButton, Banner, Chip, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/sleep/difficult/[childId]` | détail | — | EmptyState, ErrorView, Skeleton | 9 |  | à faire |
| `/sleep/help/[childId]` | détail | — | Screen, Card, Button, Banner, Chip, SectionTitle, EmptyState, ErrorView, Skeleton | 4 |  | à faire |
| `/sleep/tonight` | scène | — | Chip | 6 |  | à faire |

### Famille

| Route | Rôle | Outils | Composants | Couleurs | Animated RN | Statut |
|---|---|---|---|---:|:-:|---|
| `/family` | liste | family_tasks | Screen, Card, Field, Button, IconButton, Banner, Chip, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/family/brain-dump` | formulaire | brain_dump | Screen, Card, Field, Button, IconButton, Banner, Chip | 0 |  | à faire |
| `/family/couple` | formulaire | couple_week | Screen, Card, Field, Button, ListRow, SectionTitle | 0 |  | à faire |
| `/family/custody` | formulaire | custody | Screen, Card, Sheet, Field, Button, Banner, Chip, ListRow, SectionTitle, EmptyState | 4 |  | à faire |
| `/family/difficult` | liste | family_difficult | Screen, Card, Button, Banner, ListRow, SectionTitle | 0 |  | à faire |
| `/family/domains` | liste | family_domains | Screen, Card, Button, Banner, Chip | 0 |  | à faire |
| `/family/exhausted` | liste | exhaustion_check | Screen, Card, Button, Banner, Chip | 0 |  | à faire |
| `/family/history` | historique | family_history | Screen, Card, ListRow, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/family/kid-routine/[id]` | détail | — | Button | 0 |  | à faire |
| `/family/kid-routines` | liste | kid_routines | Screen, Card, Sheet, Field, Button, IconButton, Banner, Chip, SectionTitle, EmptyState | 0 |  | à faire |
| `/family/load` | liste | mental_load | Screen, Card, Button, Banner, EmptyState | 0 |  | à faire |
| `/family/me-time` | formulaire | family_metime | Screen, Card, Field, Button, Segmented, ListRow, SectionTitle, EmptyState | 0 |  | à faire |
| `/family/missions` | liste | — | Screen, Button, Segmented, EmptyState, ErrorView, Skeleton, Cascade | 0 |  | à faire |
| `/family/missions/[id]` | formulaire | — | Screen, Card, Field, Button, Banner, Chip, EmptyState, Skeleton, Cascade, DetailEnter | 0 |  | à faire |
| `/family/missions/new` | formulaire | — | Screen, Card, Field, Button, Banner, Chip, Segmented, Cascade | 0 |  | à faire |
| `/family/missions/responsibilities` | liste | — | Screen, Card, Button, Chip, Skeleton, Cascade | 0 |  | à faire |
| `/family/nights` | formulaire | family_nights | Screen, Card, GlassSurface, Field, Button, Banner, Chip, Segmented, ListRow, SectionTitle, EmptyState, ErrorView, Skeleton | 0 |  | à faire |
| `/family/notebook` | liste | house_notebook | Screen, Card, Sheet, Field, Button, Banner, Chip, ListRow, SectionTitle, EmptyState | 0 |  | à faire |
| `/family/offduty` | liste | offduty | Screen, Card, Field, Button, Banner, Chip | 0 |  | à faire |
| `/family/papers` | liste | family_papers | Screen, Card, Sheet, Field, Button, Banner, Chip, ListRow, SectionTitle | 0 |  | à faire |
| `/family/prep` | liste | family_prep | Screen, Card, Button, Banner, EmptyState | 0 |  | à faire |
| `/family/review` | résultat | family_review | Screen, Card, ListRow, SectionTitle, Skeleton | 0 |  | à faire |
| `/family/routines` | formulaire | family_routines | Screen, Card, Sheet, Field, Button, Chip, ListRow, SectionTitle, EmptyState, Skeleton | 0 |  | à faire |
| `/family/solo` | formulaire | solo_parent | Screen, Card, Sheet, Field, Button, Banner, Chip, Segmented, ListRow, SectionTitle | 0 |  | à faire |
| `/family/sos` | liste | family_sos | — | 2 |  | à faire |
| `/family/stocks` | détail | — | — | 0 |  | à faire |
| `/family/stocks/[id]` | détail | — | Screen, Card, Button, Banner, Chip, EmptyState, Skeleton, Cascade, DetailEnter | 0 |  | à faire |
| `/family/stocks/baby` | détail | — | — | 0 |  | à faire |
| `/family/stocks/new` | formulaire | — | Screen | 0 |  | à faire |
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
| `/community/new` | formulaire | — | Screen, Card, Field, Button, Banner, Chip, Segmented, ErrorView, Skeleton | 4 |  | à faire |
| `/community/notifications` | liste | — | Screen, Card, Button, Chip, ListRow, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/community/post/[id]` | détail | — | Screen, Card, Sheet, Field, Button, Banner, Chip, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/community/profile` | formulaire | — | Screen, Card, Field, Button, Banner, Chip, Segmented, Toggle, SectionTitle, ErrorView, Skeleton | 0 |  | à faire |
| `/community/rules` | réglage | — | Screen, Card, Button, Banner | 0 |  | à faire |
| `/community/saved` | historique | — | Screen, EmptyState, ErrorView, Skeleton, VirtualList | 0 |  | à faire |
| `/community/u/[handle]` | détail | — | Screen, Button, Banner, EmptyState, ErrorView, Skeleton | 0 |  | à faire |

## Vue par outil

Types : humeur/journal · tâches/planning · suivi/mesures · minuteur/session · formulaire/assistant · famille/partage/communauté · autre. Parcours : entrée → saisie → résultat → historique, d’après les routes sœurs qui existent (« feuille dans l’écran » : la saisie se fait dans une feuille du même écran). Les quatre dernières colonnes se remplissent au fil de la refonte (`scripts/homi/inventory-status.json` › `tools`).

### autre (32)

| Outil | Clé | Entrée | Saisie | Résultat | Historique | Écrans refondus | Commandes | Transition | Parcours vérifié |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|
| Après une perte | `guide_loss` | `/guide/[topic]` | — | — | — | non | non | non | non |
| Contraception | `avoid_contraception` | `/contraception` | `/contraception/consultation` | — | `/contraception/emergency /contraception/history /contraception/journal /contraception/log /contraception/methods` | non | non | non | non |
| Sorties près de chez moi | `nearby` | `/outings` | — | — | — | non | non | non | non |
| Bibliothèque | `library` | `/library` | — | — | — | non | non | non | non |
| Sources et lectures | `sources` | `/sources` | — | — | — | non | non | non | non |
| Guides | `cycle_guides` | `/cycle/guides` | — | — | — | non | non | non | non |
| Tutos vidéo | `video_tutos` | `/tutos` | — | — | — | non | non | non | non |
| Vidéos & articles | `official_videos` | `/videos` | — | — | — | non | non | non | non |
| Comprendre mon cycle | `ttc_understand` | `/fertility/understand` | — | — | — | non | non | non | non |
| Parcours PMA | `guide_pma` | `/guide/[topic]` | — | — | — | non | non | non | non |
| Articles sur la conception | `ttc_articles` | `/library` | — | — | — | non | non | non | non |
| Mes droits au travail | `guide_work` | `/guide/[topic]` | — | — | — | non | non | non | non |
| Urgences et premiers secours | `guide_firstaid` | `/guide/[topic]` | — | — | — | non | non | non | non |
| Produits enfants | `kid_products` | `/products` | — | `/products/[id] /products/compare` | — | non | non | non | non |
| Bien manger enceinte | `preg_eat` | `/pregnancy/eat` | `/pregnancy/edit /pregnancy/end /pregnancy/feel /pregnancy/start` | — | `/pregnancy/calendar /pregnancy/moves /pregnancy/weight` | non | non | non | non |
| Préparation à l’accouchement | `preg_birth_prep` | `/library` | — | — | — | non | non | non | non |
| Résumés | `summary` | `/summary` | — | — | — | non | non | non | non |
| Articles et vidéos | `preg_articles` | `/library` | — | — | — | non | non | non | non |
| Sexualité pendant la grossesse | `preg_intimacy` | `/library` | — | — | — | non | non | non | non |
| Mon bébé en néonat | `guide_neonat` | `/guide/[topic]` | — | — | — | non | non | non | non |
| Baby blues et dépression du post-partum | `pp_mental` | `/postpartum/understand` | `/postpartum/checkin /postpartum/support` | — | `/postpartum/history /postpartum/partner /postpartum/recovery /postpartum/sharing` | non | non | non | non |
| Santé mentale : trouver de l’aide | `pp_support` | `/postpartum/support` | `/postpartum/checkin` | — | `/postpartum/history /postpartum/partner /postpartum/recovery /postpartum/sharing /postpartum/understand` | non | non | non | non |
| Classements des recettes | `meal_rankings` | `/meals/rankings` | `/meals/new /meals/shopping` | `/meals/[slug]` | `/meals/menu /meals/pantry` | non | non | non | non |
| Alimentation 1–10 ans | `guide_kidfood` | `/guide/[topic]` | — | — | — | non | non | non | non |
| Sommeil de l’enfant | `guide_kidsleep` | `/guide/[topic]` | — | — | — | non | non | non | non |
| Hygiène et soins | `guide_hygiene` | `/guide/[topic]` | — | — | — | non | non | non | non |
| Activités par âge | `guide_activities` | `/guide/[topic]` | — | — | — | non | non | non | non |
| Grandir de 1 à 3 ans | `guide_toddler` | `/guide/[topic]` | — | — | — | non | non | non | non |
| Maladies de l’enfance | `guide_illnesses` | `/guide/[topic]` | — | — | — | non | non | non | non |
| Crèche, nounou, école | `guide_school` | `/guide/[topic]` | — | — | — | non | non | non | non |
| Sport et activité | `guide_sport` | `/guide/[topic]` | — | — | — | non | non | non | non |
| Émotions et comportement | `guide_behaviour` | `/guide/[topic]` | — | — | — | non | non | non | non |

### famille/partage/communauté (19)

| Outil | Clé | Entrée | Saisie | Résultat | Historique | Écrans refondus | Commandes | Transition | Parcours vérifié |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|
| Confier un domaine | `family_domains` | `/family/domains` | — | — | — | non | non | non | non |
| À deux | `guide_couple` | `/guide/[topic]` | — | — | — | non | non | non | non |
| Qui y pense ? | `mental_load` | `/family/load` | — | — | — | non | non | non | non |
| Point de couple | `couple_week` | `/family/couple` | dans l’écran | — | — | non | non | non | non |
| Communauté | `community` | `/community` | — | — | — | non | non | non | non |
| Maman solo | `solo_parent` | `/family/solo` | feuille dans l’écran | — | — | non | non | non | non |
| Communauté | `community` | `/community` | — | — | — | non | non | non | non |
| Communauté | `community` | `/community` | — | — | — | non | non | non | non |
| Communauté | `community` | `/community` | — | — | — | non | non | non | non |
| Relais de nuit | `family_nights` | `/family/nights` | dans l’écran | — | — | non | non | non | non |
| Communauté | `community` | `/community` | — | — | — | non | non | non | non |
| Espace du conjoint | `pp_partner` | `/postpartum/partner` | `/postpartum/checkin /postpartum/support` | — | `/postpartum/history /postpartum/recovery /postpartum/sharing /postpartum/understand` | non | non | non | non |
| Communauté | `community` | `/community` | — | — | — | non | non | non | non |
| Garde alternée | `custody` | `/family/custody` | feuille dans l’écran | — | — | non | non | non | non |
| Communauté | `community` | `/community` | — | — | — | non | non | non | non |
| Communauté | `community` | `/community` | — | — | — | non | non | non | non |
| Résumé familial du jour | `family_summary` | `/summary` | — | — | — | non | non | non | non |
| Bilan de la semaine | `family_review` | `/family/review` | — | — | — | non | non | non | non |
| Communauté | `community` | `/community` | — | — | — | non | non | non | non |

### formulaire/assistant (31)

| Outil | Clé | Entrée | Saisie | Résultat | Historique | Écrans refondus | Commandes | Transition | Parcours vérifié |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|
| Documents | `documents` | `/documents` | `/documents/[id] /documents/scan` | `/documents/export` | `/documents/book` | non | non | non | non |
| Urgences | `emergency` | `/emergency` | — | — | — | non | non | non | non |
| Mes questions pour le rendez-vous | `consult_questions` | `/consult/questions` | dans l’écran | — | — | non | non | non | non |
| Je suis à bout | `exhaustion_check` | `/family/exhausted` | — | — | — | non | non | non | non |
| J’ai un test positif | `ttc_start_pregnancy` | `/pregnancy/start` | `/pregnancy/edit /pregnancy/end /pregnancy/feel` | — | `/pregnancy/calendar /pregnancy/eat /pregnancy/moves /pregnancy/weight` | non | non | non | non |
| Comparer les moyens | `avoid_methods` | `/contraception/methods` | `/contraception/consultation` | — | `/contraception/emergency /contraception/history /contraception/journal /contraception/log` | non | non | non | non |
| Contraception d’urgence | `avoid_emergency` | `/contraception/emergency` | `/contraception/consultation` | — | `/contraception/history /contraception/journal /contraception/log /contraception/methods` | non | non | non | non |
| Préparer une consultation | `avoid_consult` | `/contraception/consultation` | dans l’écran | — | `/contraception/emergency /contraception/history /contraception/journal /contraception/log /contraception/methods` | non | non | non | non |
| Scanner un produit | `scan_product` | `/scanner/product` | `/scanner/avoid` | `/scanner/compare /scanner/food /scanner/result/[id]` | `/scanner/history /scanner/recalls` | non | non | non | non |
| Scanner un aliment | `scan_food` | `/scanner/food` | `/scanner/avoid` | `/scanner/compare /scanner/product /scanner/result/[id]` | `/scanner/history /scanner/recalls` | non | non | non | non |
| Comparer deux produits | `scan_compare` | `/scanner/compare` | `/scanner/avoid` | `/scanner/food /scanner/product /scanner/result/[id]` | `/scanner/history /scanner/recalls` | non | non | non | non |
| Journée difficile | `family_difficult` | `/family/difficult` | — | — | — | non | non | non | non |
| Personnaliser l’accueil | `home_settings` | `/settings/home` | — | — | — | non | non | non | non |
| Réglages | `settings` | `/settings` | — | — | — | non | non | non | non |
| Modifier mon parcours | `journeys` | `/journeys` | feuille dans l’écran | `/journeys/[id]` | — | non | non | non | non |
| Assistant | `ask` | `/ask` | — | — | — | non | non | non | non |
| Assistant des articles | `local_ai` | `/assistant/local` | — | — | `/assistant/chat` | non | non | non | non |
| Papiers de la famille | `family_papers` | `/family/papers` | feuille dans l’écran | — | — | non | non | non | non |
| Préparer une consultation | `ttc_consult` | `/fertility/consultation` | dans l’écran | — | — | non | non | non | non |
| Documents | `documents` | `/documents` | `/documents/[id] /documents/scan` | `/documents/export` | `/documents/book` | non | non | non | non |
| Mes questions pour le rendez-vous | `consult_questions` | `/consult/questions` | dans l’écran | — | — | non | non | non | non |
| Modifier la grossesse | `preg_edit` | `/pregnancy/edit` | `/pregnancy/end /pregnancy/feel /pregnancy/start` | — | `/pregnancy/calendar /pregnancy/eat /pregnancy/moves /pregnancy/weight` | non | non | non | non |
| Terminer la grossesse | `preg_end` | `/pregnancy/end` | `/pregnancy/edit /pregnancy/feel /pregnancy/start` | — | `/pregnancy/calendar /pregnancy/eat /pregnancy/moves /pregnancy/weight` | non | non | non | non |
| Mode urgence organisation | `family_urgent` | `/family/urgent` | — | — | — | non | non | non | non |
| Je craque | `family_sos` | `/family/sos` | — | — | — | non | non | non | non |
| Sa fiche | `kid_profile` | `/child/[id]` | — | — | — | non | non | non | non |
| Documents | `documents` | `/documents` | `/documents/[id] /documents/scan` | `/documents/export` | `/documents/book` | non | non | non | non |
| Mes questions pour le rendez-vous | `consult_questions` | `/consult/questions` | dans l’écran | — | — | non | non | non | non |
| Fiche de mon enfant | `kid_card` | `/child/[id]/card` | — | — | — | non | non | non | non |
| Mon enfant a un besoin particulier | `kid_needs` | `/child/[id]/needs` | feuille dans l’écran | — | — | non | non | non | non |
| Mes démarches | `kid_steps` | `/child/[id]/steps` | — | — | — | non | non | non | non |

### humeur/journal (12)

| Outil | Clé | Entrée | Saisie | Résultat | Historique | Écrans refondus | Commandes | Transition | Parcours vérifié |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|
| Mon humeur | `mood` | `/me/mood` | — | — | `/me/diary /me/sleep` | non | non | non | non |
| Journal de ma contraception | `contraception_journal` | `/contraception/journal` | `/contraception/consultation` | — | `/contraception/emergency /contraception/history /contraception/log /contraception/methods` | non | non | non | non |
| Vider ma tête | `brain_dump` | `/family/brain-dump` | dans l’écran | — | — | non | non | non | non |
| Carnet de la maison | `house_notebook` | `/family/notebook` | feuille dans l’écran | — | — | non | non | non | non |
| Idées de prénoms | `preg_names` | `/names` | — | — | — | non | non | non | non |
| Journal du cycle | `cycle_journal` | `/cycle/journal` | — | — | `/cycle/journal` | non | non | non | non |
| Comment je me sens aujourd’hui ? | `preg_feel` | `/pregnancy/feel` | `/pregnancy/edit /pregnancy/end /pregnancy/start` | — | `/pregnancy/calendar /pregnancy/eat /pregnancy/moves /pregnancy/weight` | non | non | non | non |
| Point du jour | `pp_checkin` | `/postpartum/checkin` | `/postpartum/support` | — | `/postpartum/history /postpartum/partner /postpartum/recovery /postpartum/sharing /postpartum/understand` | non | non | non | non |
| Ses découvertes | `baby_foods` | `/child/[id]/discoveries` | feuille dans l’écran | — | — | non | non | non | non |
| Je grandis | `kid_grow` | `/child/[id]/grow` | feuille dans l’écran | — | — | non | non | non | non |
| Journal | `kid_milestones` | `/child/[id]` | — | — | — | non | non | non | non |
| Humeur et émotions | `kid_mood` | `/child/[id]/wellbeing` | — | — | — | non | non | non | non |

### minuteur/session (9)

| Outil | Clé | Entrée | Saisie | Résultat | Historique | Écrans refondus | Commandes | Transition | Parcours vérifié |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|
| Je décroche | `offduty` | `/family/offduty` | — | — | — | non | non | non | non |
| Mouvements de bébé | `preg_moves` | `/pregnancy/moves` | `/pregnancy/edit /pregnancy/end /pregnancy/feel /pregnancy/start` | — | `/pregnancy/calendar /pregnancy/eat /pregnancy/weight` | non | non | non | non |
| Allaitement | `pp_feeding` | `/track/[kind]` | dans l’écran | — | — | non | non | non | non |
| Biberon | `pp_bottle` | `/bottle/[childId]` | feuille dans l’écran | `/bottle/scoops` | `/bottle/history` | non | non | non | non |
| Compteur de mesurettes | `bottle_scoops` | `/bottle/scoops` | — | `/bottle/[childId]` | `/bottle/history` | non | non | non | non |
| Biberons | `baby_bottle` | `/track/[kind]` | dans l’écran | — | — | non | non | non | non |
| Sommeil | `kid_sleep` | `/night` | — | — | `/night/help` | non | non | non | non |
| Aide pour la nuit | `baby_night_help` | `/night/help` | — | — | — | non | non | non | non |
| Couches | `baby_diaper` | `/track/[kind]` | dans l’écran | — | — | non | non | non | non |

### suivi/mesures (28)

| Outil | Clé | Entrée | Saisie | Résultat | Historique | Écrans refondus | Commandes | Transition | Parcours vérifié |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|
| Mon sommeil | `sleep` | `/me/sleep` | feuille dans l’écran | — | `/me/diary /me/mood` | non | non | non | non |
| Cycle et règles | `avoid_cycle` | `/cycle` | dans l’écran | — | — | non | non | non | non |
| Calendrier du cycle | `avoid_fertile` | `/cycle/calendar` | feuille dans l’écran | — | — | non | non | non | non |
| Symptômes | `cycle_symptoms` | `/cycle/symptoms` | — | — | — | non | non | non | non |
| Statistiques du cycle | `cycle_stats` | `/cycle/stats` | — | — | — | non | non | non | non |
| Historique et favoris | `scan_history` | `/scanner/history` | `/scanner/avoid` | `/scanner/compare /scanner/food /scanner/product /scanner/result/[id]` | `/scanner/recalls` | non | non | non | non |
| Produits à éviter | `scan_avoid` | `/scanner/avoid` | dans l’écran | `/scanner/compare /scanner/food /scanner/product /scanner/result/[id]` | `/scanner/history /scanner/recalls` | non | non | non | non |
| Alertes produits rappelés | `recall_alerts` | `/scanner/recalls` | `/scanner/avoid` | `/scanner/compare /scanner/food /scanner/product /scanner/result/[id]` | `/scanner/history` | non | non | non | non |
| Examens | `ttc_exams` | `/fertility/exams` | — | — | — | non | non | non | non |
| Cycle et période fertile | `ttc_cycle` | `/fertility` | — | — | — | non | non | non | non |
| Tests d’ovulation et de grossesse | `ttc_tests` | `/fertility/log` | — | — | `/fertility/log` | non | non | non | non |
| Glaire cervicale | `ttc_mucus` | `/fertility/mucus` | — | — | — | non | non | non | non |
| Température (facultatif) | `ttc_temperature` | `/fertility/body` | dans l’écran | — | — | non | non | non | non |
| Rapports (facultatif, privé) | `ttc_intimacy` | `/fertility/intimacy` | — | — | — | non | non | non | non |
| Suivi PMA | `pma_tracker` | `/fertility/pma` | feuille dans l’écran | — | — | non | non | non | non |
| Évolution du bébé | `preg_evolution` | `/pregnancy` | `/pregnancy/edit /pregnancy/end /pregnancy/feel /pregnancy/start` | — | `/pregnancy/calendar /pregnancy/eat /pregnancy/moves /pregnancy/weight` | non | non | non | non |
| Suivi du poids | `preg_weight` | `/pregnancy/weight` | `/pregnancy/edit /pregnancy/end /pregnancy/feel /pregnancy/start` | — | `/pregnancy/calendar /pregnancy/eat /pregnancy/moves` | non | non | non | non |
| Récupération | `pp_recovery` | `/postpartum` | `/postpartum/checkin /postpartum/support` | — | `/postpartum/history /postpartum/partner /postpartum/recovery /postpartum/sharing /postpartum/understand` | non | non | non | non |
| Cicatrisation et rééducation | `pp_body` | `/postpartum/recovery` | `/postpartum/checkin /postpartum/support` | — | `/postpartum/history /postpartum/partner /postpartum/sharing /postpartum/understand` | non | non | non | non |
| Historique des biberons | `baby_bottle_history` | `/bottle/history` | feuille dans l’écran | `/bottle/[childId] /bottle/scoops` | `/bottle/history` | non | non | non | non |
| Planning de sommeil | `kid_sleep_rhythm` | `/sleep/[childId]` | dans l’écran | `/sleep/difficult/[childId] /sleep/help/[childId]` | — | non | non | non | non |
| Suivi de la journée | `baby_daily` | `/track` | `/track/[kind]` | — | — | non | non | non | non |
| Dents | `kid_teeth` | `/teeth` | feuille dans l’écran | — | — | non | non | non | non |
| Croissance | `kid_growth` | `/child/[id]/growth` | — | — | — | non | non | non | non |
| Vaccins | `kid_vaccines` | `/child/[id]/vaccines` | feuille dans l’écran | — | — | non | non | non | non |
| Suivi santé | `kid_health` | `/child/[id]/health-tracking` | feuille dans l’écran | — | — | non | non | non | non |
| Traitements prescrits | `kid_treatments` | `/child/[id]/needs` | feuille dans l’écran | — | — | non | non | non | non |
| Planning de sommeil | `kid_sleep_rhythm` | `/sleep/[childId]` | dans l’écran | `/sleep/difficult/[childId] /sleep/help/[childId]` | — | non | non | non | non |

### tâches/planning (24)

| Outil | Clé | Entrée | Saisie | Résultat | Historique | Écrans refondus | Commandes | Transition | Parcours vérifié |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|
| Repas et recettes | `meals` | `/meals` | `/meals/new /meals/shopping` | `/meals/[slug] /meals/rankings` | `/meals/menu /meals/pantry` | non | non | non | non |
| Rendez-vous et examens | `appointments` | `/appointments` | feuille dans l’écran | — | — | non | non | non | non |
| Agenda familial | `family_calendar` | `/calendar` | feuille dans l’écran | — | — | non | non | non | non |
| Échéances préparées | `family_prep` | `/family/prep` | — | — | — | non | non | non | non |
| Organisation familiale | `family_tasks` | `/family` | — | — | — | non | non | non | non |
| Routines | `family_routines` | `/family/routines` | feuille dans l’écran | — | — | non | non | non | non |
| Temps pour soi | `family_metime` | `/family/me-time` | dans l’écran | — | — | non | non | non | non |
| Rappels | `reminders` | `/settings/reminders` | feuille dans l’écran | — | — | non | non | non | non |
| Notifications | `notifications` | `/notifications` | — | — | — | non | non | non | non |
| Rappels de contraception | `avoid_reminders` | `/contraception/reminders` | `/contraception/consultation` | — | `/contraception/emergency /contraception/history /contraception/journal /contraception/log /contraception/methods` | non | non | non | non |
| Trousse règles | `cycle_kit` | `/cycle/kit` | — | — | — | non | non | non | non |
| Repas et recettes | `meals` | `/meals` | `/meals/new /meals/shopping` | `/meals/[slug] /meals/rankings` | `/meals/menu /meals/pantry` | non | non | non | non |
| Rappels | `ttc_reminders` | `/fertility/reminders` | — | — | — | non | non | non | non |
| Repas et recettes | `meals` | `/meals` | `/meals/new /meals/shopping` | `/meals/[slug] /meals/rankings` | `/meals/menu /meals/pantry` | non | non | non | non |
| Repas et recettes | `meals` | `/meals` | `/meals/new /meals/shopping` | `/meals/[slug] /meals/rankings` | `/meals/menu /meals/pantry` | non | non | non | non |
| Rendez-vous et examens | `appointments` | `/appointments` | feuille dans l’écran | — | — | non | non | non | non |
| Listes | `preg_lists` | `/lists` | feuille dans l’écran | — | — | non | non | non | non |
| Mon calendrier de grossesse | `preg_calendar` | `/pregnancy/calendar` | `/pregnancy/edit /pregnancy/end /pregnancy/feel /pregnancy/start` | — | `/pregnancy/eat /pregnancy/moves /pregnancy/weight` | non | non | non | non |
| Repas et recettes | `meals` | `/meals` | `/meals/new /meals/shopping` | `/meals/[slug] /meals/rankings` | `/meals/menu /meals/pantry` | non | non | non | non |
| Repas et recettes | `meals` | `/meals` | `/meals/new /meals/shopping` | `/meals/[slug] /meals/rankings` | `/meals/menu /meals/pantry` | non | non | non | non |
| Rendez-vous et examens | `appointments` | `/appointments` | feuille dans l’écran | — | — | non | non | non | non |
| Repas et recettes | `meals` | `/meals` | `/meals/new /meals/shopping` | `/meals/[slug] /meals/rankings` | `/meals/menu /meals/pantry` | non | non | non | non |
| Routines en images | `kid_routines` | `/family/kid-routines` | feuille dans l’écran | — | — | non | non | non | non |
| Historique des tâches | `family_history` | `/family/history` | — | — | `/family/history` | non | non | non | non |

## Limites

- Rôle, zone et type d’outil sont calculés par règles (fichier `scripts/homi/inventory.mjs`, tables `ZONES`, `ROLE_RULES`, `TYPE_BY_KEY`) : à corriger dans ces tables plutôt qu’à la main.
- Les composants et couleurs sont comptés dans le fichier de route seul ; un écran qui délègue à `src/features/**` peut afficher 0 tout en contenant des couleurs en dur dans son module.
- Un même outil peut figurer dans plusieurs parcours (même écran, paramètre différent) : une ligne par identifiant du catalogue.
