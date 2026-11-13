# HOMI — Courses et stocks (phase 6)

Établi le 15/11/2026. Migrations `20261115000100_courses_stocks_types.sql`, `20261115000200_courses_stocks.sql`.
Tests : SQL `supabase/tests/sql/98s_courses_stocks.sql` (73 vérifications) · Jest `src/__tests__/stocks.test.ts` (15) · E2E `e2e/courses_stocks_scenarios.py` (scénarios A complet et F).
Compagnons : `HOMI_SYNC_ARCHITECTURE.md` § 2 ter, `HOMI_MISSIONS_SPEC.md`, `HOMI_COUPLE_MISSIONS.md`, `HOMI_FEATURE_MATRIX.md` § E.

## 1. Décisions

| Sujet | Décision | Pourquoi |
|---|---|---|
| Liste de courses | `shopping_items` **complétée** (pas de seconde table) | Une seule liste, déjà liée aux menus, aux recettes et aux missions |
| Inventaire | Nouvelle table `household_stocks` (domaine de droits `lists`) | Le garde-manger n'existait que dans l'appareil (Zustand) : ni partagé, ni serveur |
| Quantité | `qty_estimate` **estimée par la famille**, `NULL` = non renseignée | HOMI n'invente jamais une quantité ; sans quantité, aucun « stock bas » |
| Réapprovisionnement | HOMI **suggère** ; une mission n'existe qu'après confirmation explicite | Pas d'automatisme qui assigne du travail à quelqu'un |
| Mise à jour du stock | Seulement par `stock_validate_purchase` (validation explicite) | Cocher un article ne prouve pas la quantité achetée |
| Synchronisations | Toutes par `household_events` (émission idempotente + consommateur unique) | Même modèle que les missions ; anti-boucle commun |
| Budget | Fait `stock.purchase_confirmed` publié, **sans montant, sans écran**, laissé `pending` | Le module Budget le consommera (`claim_household_events`) |

## 2. Liste de courses (`shopping_items` complétée)

| Champ | Colonne | Remarque |
|---|---|---|
| ajout rapide | `label` | champ unique + « Ajouter » ; détails facultatifs repliés |
| quantité, unité | `qty`, `unit` | unités culinaires existantes + `paquet`, `boite`, `bouteille`, `rouleau`, `sac`, `kg`, `l` |
| marque, taille | `brand` (≤ 60), `size` (≤ 40) | « Couches » + « taille 4 » |
| catégorie | `category` | mêmes catégories que les stocks |
| photo | `document_id` → `documents` | **prévu** : stockage existant (documents du foyer, sous leurs propres droits) ; pas de téléversement depuis la liste dans cette phase, l'écran l'annonce |
| responsable | `assignee_id` | membre ayant accès aux listes (contrôlé par `shopping_items_guard`) |
| statut | `checked`, `at_home` | « à acheter » / « dans le panier » / « déjà à la maison » ; auteur et heure de la coche posés **par le serveur** |
| stock lié | `stock_id` → `household_stocks` | posé par le consommateur des missions (même produit) |
| auteur, date | `created_by`, `created_at` | figés après création |
| historique | journal d'audit (`_attach_audit('shopping_items')`) + « Achetés récemment » (qui a coché, quand) | |
| temps réel | publication `supabase_realtime` + `HOUSEHOLD_TABLES` | `shopping_lists`, `shopping_items`, `household_stocks` |
| hors ligne | `client_id` (`useAddShoppingItem` → `insertOrQueue`) | modifications : `update_if_version` (liste blanche étendue) |

**Doublons** (`findDuplicate`, `duplicateGroups`, `mergedQty` ; serveur `merge_shopping_items`) :
- avant l'ajout : même produit (libellé normalisé, même taille si les deux en ont une) **non coché** → alerte « déjà sur la liste » avec « Ajouter à l'existant » (quantité additionnée) ou « Ajouter quand même » ; jamais de fusion silencieuse ;
- doublons déjà présents (ajouts simultanés sur deux téléphones, file hors ligne) → bandeau « apparaît 2 fois » + « Fusionner » : `merge_shopping_items(garder, retirer)` additionne les quantités (même unité), reprend les liens **mission** et **stock** de l'article retiré, puis l'efface (journalisé).

## 3. Inventaire du foyer (`household_stocks`)

Produits : couches, lingettes, lait, lessive, papier toilette, produits ménagers, croquettes, épicerie (garde-manger migré), autres.

| Donnée | Colonne | Règle |
|---|---|---|
| produit, catégorie, marque, taille | `label`, `category`, `brand`, `size` | |
| quantité estimée, unité | `qty_estimate`, `unit` | facultative, jamais déduite |
| seuil minimum | `threshold` | facultatif ; sans seuil, HOMI ne propose rien |
| fréquence | `frequency_days` (1–365) | information (pas de calcul automatique de consommation) |
| responsable, rappel | `responsible_id`, `reminder` | le rappel = notification neutre de suggestion |
| enfant / animal associés | `child_id` (périmètre nounou restrictif), `pet_id` (**sans clé étrangère**, module animaux absent — comme pour les missions) | |
| garde-manger | `ingredient_key` (unique par foyer), `source = 'pantry'` | voir § 5 |
| état serveur | `restock_state` (`ok` · `suggested` · `dismissed` · `ordered` · `bought`), `low_since`, `restock_task_id`, `restock_item_id`, `last_purchase_at`, `last_validated_by` | **jamais** posés par l'appareil (`household_stocks_guard`) |
| hors ligne / conflits | `client_id` (unique par foyer), `version` (`_bump_version`), `update_if_version` | |
| audit | `_attach_audit('household_stocks', 'lists')` | |
| droits | `_apply_household_policies('household_stocks', 'lists')` + enfant restrictif | autre foyer : rien ; nounou : selon `lists` (lecture / édition) et enfants confiés ; membre retiré : plus rien (`not_found`) ; Premium strict avec exemption nounou |

Niveau (`stockLevel`, miroir du garde) : `unknown` (quantité non saisie) · `ok` · `low` (quantité ≤ seuil) · `out` (0). L'écran met en tête « À prévoir » (« Rien d'alarmant : ce sont simplement les prochains achats. »), sans rouge ni reproche ; libellés « Bientôt à racheter », « Suggestion de HOMI », « Acheté, à valider ».

## 4. Réapprovisionnement (boucle complète)

| # | Fait | Qui | Serveur | État du stock |
|---|---|---|---|---|
| 1 | La famille saisit une estimation ≤ seuil | membre (édition des listes) | `household_stocks_guard` pose `low_since` ; `stock.low` émis (clé `stock.low:<stock>:<début de période>`) → consommateur : `suggested` + notification neutre au responsable (sinon au responsable du domaine « courses ») si le rappel est actif. **Aucune mission** | `suggested` |
| 1 bis | « Pas maintenant » | membre autorisé | `stock_restock('dismiss')` → `stock.restock_dismissed` | `dismissed` (jusqu'à la remontée au-dessus du seuil ; une nouvelle période basse = nouvelle suggestion) |
| 2–3 | « Créer la mission » | membre autorisé (édition des listes, enfant autorisé) | `stock_restock('confirm')` → `create_mission` (catégorie : croquettes → `pets`, couches / lingettes / lait → `diapers`, sinon `shopping` ; destinataire : choisi, sinon **responsable du domaine** via `family_domains`, sinon responsable du stock, sinon « à prendre » ; `client_id = md5('restock:'‖stock‖période)` → rejouer = même mission) → `stock.restock_confirmed` → consommateur : `restock_task_id`, `family_tasks.stock_id` | `ordered` |
| 4 | Mission acceptée | destinataire | consommateur des missions (existant) : article créé ou rattaché **sans doublon**, relié au stock (`stock_id` de la mission, ou stock du même produit `_stock_match`) | `ordered` |
| 5 | Article coché (ou mission terminée) | qui que ce soit | `shopping.item_checked` → consommateur : stock « acheté, à valider », `restock_item_id`. **Quantité inchangée** | `bought` |
| 6 | « Valider l'achat » (quantité achetée, ou nouvelle estimation) | membre autorisé | `stock_validate_purchase` (version attendue → un rejeu donne `conflict`, rien d'ajouté deux fois) : quantité mise à jour, état remis à `ok`, `stock.purchase_confirmed` publié | `ok` |

Validation sans mission possible (« J'ai racheté ce produit ») : même RPC, même fait.

## 5. Garde-manger local → serveur (migration douce)

- Avant : `useUiStore.pantry` (clés d'ingrédients, appareil seulement).
- `usePantryMigration()` (monté à la racine) : à la première synchronisation d'un foyer, une ligne `household_stocks` par ingrédient **absent** du serveur, `qty_estimate = NULL` (jamais inventée), `client_id = pantryClientId(foyer, ingrédient)` **déterministe** + index unique `(household_id, ingredient_key)` → deux appareils ou une file rejouée ne créent jamais de doublon ; succès → copie locale vidée et foyer marqué migré (`pantryMigrated`) ; échec → copie gardée, nouvel essai plus tard (aucune perte).
- Après : « Que puis-je cuisiner ? », menus et scanner lisent `usePantry()` (serveur, partagé, temps réel). La copie locale n'est plus une source de vérité.

## 6. Événements (voir `HOMI_SYNC_ARCHITECTURE.md` § 2 ter)

| Type | Émis par | Clé | Consommateur |
|---|---|---|---|
| `stock.low` | déclencheur d'émission de `household_stocks` (période basse) | `stock.low:<stock>:<low_since>` | `_consume_stock_event` : suggestion + notification |
| `stock.restock_confirmed` | `stock_restock('confirm')` | `stock.restock_confirmed:<stock>:<mission>` | liens mission ↔ stock |
| `stock.restock_dismissed` | `stock_restock('dismiss')` | `stock.restock_dismissed:<stock>:<période>` | état `dismissed` |
| `shopping.item_checked` | déclencheur d'émission de `shopping_items` (passage à coché) | `shopping.item_checked:<article>:<version>` | mission liée terminée **si c'est son destinataire qui coche**, sinon proposition neutre ; stock `bought` |
| `stock.purchase_confirmed` | `stock_validate_purchase` | `stock.purchase_confirmed:<stock>:<version>` | **aucun pour l'instant** : reste `pending` pour le futur module Budget |

**Contrat `stock.purchase_confirmed` (futur Budget)** — `payload` : `stock_id`, `label`, `category`, `mode` (`add`/`set`), `qty_added` (si `add`), `qty_before`, `qty_after`, `unit`, `task_id` (mission de réapprovisionnement, si elle existe), `item_id` (article coché), `validated_by`, `validated_at`. Pas de prix ni de montant : le Budget les demandera lui-même. Consommation : `claim_household_events(…, array['stock.purchase_confirmed'])` puis `finish_household_event`.

## 7. Boucle « article coché → mission terminée »

- Cocher un article lié publie `shopping.item_checked`. Si la personne qui coche est **le destinataire** de la mission liée encore ouverte, le consommateur appelle `mission_respond('complete')` (mêmes règles, même historique, même notification « Mission terminée »). Sinon : rien n'est forcé ; le destinataire reçoit « Article coché : … — si la mission est faite, vous pouvez la terminer » et le détail de mission l'affiche.
- Anti-boucle : mission terminée → article coché → `shopping.item_checked` (profondeur 1, origine `mission.completed`) → la mission est déjà terminée, rien ne se rejoue ; l'autre sens donne `mission.completed` de profondeur 1 dont le consommateur trouve l'article déjà coché. `_dispatch_household_event` restaure désormais le contexte de l'événement parent après un traitement imbriqué. Vérifié en SQL (une seule fin, un seul `mission.completed`, aucun fait `skipped`).

## 8. Écrans et points d'entrée

| Route | Rôle |
|---|---|
| `/meals/shopping` | refonte : ajout rapide + détails (quantité, unité, marque, taille, catégorie, responsable), alerte doublon, fusion, icônes mission / stock liés, « Achetés récemment », liste libre « Commencer une liste » |
| `/family/stocks` | inventaire : résumé, « À prévoir » (suggestions avec confirmation, missions en cours, achats à valider), stocks par catégorie |
| `/family/stocks/baby` | même écran limité à couches, lingettes, lait (onglet Bébé) |
| `/family/stocks/new` | ajout |
| `/family/stocks/[id]` | détail, suggestion, mission en cours, validation d'achat, modification, historique des faits |
| `/family/missions/[id]` | lien « Voir le stock », mention « coché par … » ; « Pour vous » / « Demandée par vous » |

Points d'entrée : hub Famille (« Courses », « Stocks »), hub Bébé (« Couches et lait »), ajout rapide du Dock (« Ajouter aux courses »), catalogue d'outils (`family_shopping`, `family_stocks`, garde-fou `homiToolMatrix` vert). DA : `Card`, `Chip`, `Segmented`, `Banner`, `Field` (`ui.tsx`), `LiftCard`, `Cascade`, `DetailEnter` (`src/motion`). i18n 5 langues (`src/i18n/*/stocks.ts`), `node scripts/i18n-scan.js` = 0.

Démo : `src/lib/backend/demoStocks.ts` émule garde, suggestion, RPC, consommateur et `household_events` ; `demoMissions.ts` relie l'article au stock et publie la coche.

## 9. Limites

- Photo d'article : colonne `document_id` prête, pas de téléversement depuis la liste (choix d'un document à brancher).
- Consommation estimée (fréquence → date probable de rupture) : non calculée ; `frequency_days` est informatif.
- `shopping.item_checked` traité plus tard par `process_household_events` (passage planifié, sans session) : la mission n'est jamais terminée à la place du destinataire (il faut sa session) ; seule la proposition est envoyée. Le traitement immédiat (même transaction) couvre le cas normal.
- Modifications hors ligne de la liste (cocher sans réseau) : toujours non mises en file (limite existante, `HOMI_SYNC_ARCHITECTURE.md` § 8).
- Notifications serveur en français (comme les missions) ; la démo les traduit.
- Module Budget et module Animaux absents : seulement préparés (`stock.purchase_confirmed`, `pet_id`).
