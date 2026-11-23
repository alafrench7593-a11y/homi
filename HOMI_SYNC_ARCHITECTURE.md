# HOMI — Architecture de synchronisation (source de vérité)

Établi le 13/11/2026 (fondations du foyer, avant les modules Missions / Nounou / Courses).
Migrations : `20261113000300_journal_audit.sql`, `20261113000400_evenements_foyer.sql`, `20261113000500_hors_ligne_versions.sql`.
Tests : `supabase/tests/sql/96_journal_audit.sql`, `97_evenements_foyer.sql`, `98_hors_ligne_notifications.sql` ; Jest `src/__tests__/foyerFondations.test.ts`.

## 1. Source de vérité

- **Le serveur Postgres fait foi.** Les droits (RLS), les champs posés par le serveur (`done_by`, `done_at`, `version`, `household_id` recopié, `shared_by`…) et les règles métier vivent dans des déclencheurs `security definer`. L'application n'accorde jamais un droit seule.
- L'appareil garde : un **cache** React Query persistant (lecture hors ligne ; données sensibles exclues, `PRIVATE_KEYS`) et une **file d'attente** des saisies (`src/lib/offline.ts`). Ni l'un ni l'autre ne fait foi : au retour du réseau, le serveur tranche.
- Le mode démo (`src/lib/backend/demo.ts`) émule les mêmes règles (Premium de la nounou, `update_if_version`, `child_safety_card`, version) pour que l'app et ses tests restent cohérents.

## 2. Événements métier (`household_events`, « outbox »)

Objectif : remplacer les couplages directs « déclencheur A met à jour la table B » par des **faits typés** publiés une fois, consommés par les modules intéressés.

| Colonne | Rôle |
|---|---|
| `type` (`household_event_type`, énuméré) | `task.completed`, `task.reopened`, `care_request.accepted`, `shopping.item_checked`, `timesheet.submitted`, `contract.updated`, `expense.recorded`, `stock.low`… (20 valeurs ; ajout par `alter type … add value` dans une migration dédiée) |
| `household_id`, `actor_id` (NULL = serveur), `entity_table`, `entity_id` | Qui, où, sur quoi |
| `payload` (objet JSON ≤ 8 Ko) | Données utiles au consommateur, jamais de document ni de texte de santé complet |
| `idempotency_key` **UNIQUE** | Même fait rejoué = même événement (voir § 3) |
| `status` | `pending` → `processing` → `done` / `failed` (après 5 tentatives) / `skipped` (anti-boucle) |
| `attempts`, `available_at`, `last_error`, `processed_at` | Réessais avec délai croissant (2, 4, 8… min) |
| `depth`, `origin_event_id`, `root_event_id` | Chaîne de causalité (anti-boucle) |

- **Émission** : `_emit_household_event(foyer, type, table, id, payload, clé)` — réservée au serveur (déclencheurs, `service_role`). Aucun client ne peut émettre, modifier ni effacer un événement (privilèges retirés + RLS).
- **Consommation** : `claim_household_events(limite, types)` réserve des événements `pending` avec `FOR UPDATE SKIP LOCKED` (plusieurs consommateurs sans double traitement), puis `finish_household_event(id, ok, erreur)`. Le consommateur déclare l'événement traité dans **sa** transaction : `select _begin_event_processing(id)`.
- **Lecture** : propriétaire et co-parents du foyer (tableau de bord, débogage) ; jamais une nounou, jamais un autre foyer.
- **Exemple branché** : `family_tasks` passe à `done` → `task.completed` (clé `task.completed:<tâche>:<horodatage de fin>`) ; réouverture → `task.reopened`. Une tâche terminée, rouverte puis terminée de nouveau produit deux faits distincts ; une modification sans changement de statut n'en produit aucun.
- **Non branché** (volontairement) : les 13 synchronisations inter-modules. Chacune deviendra un consommateur : par ex. `task.completed` (catégorie courses) → cocher l'article lié ; `shopping.item_checked` → stock ; `expense.recorded` → budget ; `timesheet.validated` → contrat/budget. Le déclencheur existant « demande acceptée → tâche transférée » (`care_requests_after`) reste en place jusqu'à sa migration vers un consommateur.

## 2 bis. Premier consommateur branché : missions familiales (14/11/2026)

`20261114000300_missions.sql` — voir `HOMI_MISSIONS_SPEC.md`.
- Types : `mission.requested`, `mission.accepted`, `mission.declined`, `mission.postponed`, `mission.started`, `mission.completed`, `mission.cancelled`, `mission.question`, `mission.reminded` (migration dédiée `20261114000200`).
- Émission : par les RPC `create_mission` / `mission_respond` (jamais par un client, jamais par un déclencheur ad hoc). Clé : `mission.<fait>:<tâche>:<entrée d'historique>` (création : `…:created`) — un fait = une entrée d'historique, donc un rejeu ne produit rien de neuf.
- **Un seul consommateur** `_consume_mission_event` : (a) notification neutre au bon destinataire (idempotente : `payload.event_id`) ; (b) mission d'achat acceptée/commencée → article de courses lié dans la liste la plus récente du foyer (créée « Courses » si aucune), rattaché à un article identique non coché s'il existe, sinon créé avec `client_id = md5('mission-item:'||tâche)` + `on conflict do nothing` → **jamais de doublon, même rejoué** ; (c) mission terminée → article coché une fois.
- Exécution : `_dispatch_household_event(id)` juste après l'émission (même transaction, bloc d'erreur isolé : en cas d'échec l'événement redevient `pending` avec `last_error`, la réponse métier n'est jamais annulée) + `process_household_events(limite)` pour un passage planifié (serveur, `service_role`, à planifier avec pg_cron ou une fonction — non déployé). Anti-boucle : le consommateur s'exécute sous `_begin_event_processing` ; il n'émet rien.
- Agenda : rien à synchroniser — une mission datée est une tâche datée, déjà lue par l'agenda (missions refusées/annulées masquées).
- Tests : `98m_missions.sql` (consommateur rejoué deux fois, clé rejouée, `process_household_events` → 0, anti-doublon d'article).

## 2 ter. Courses et stocks (15/11/2026)

`20261115000100_courses_stocks_types.sql`, `20261115000200_courses_stocks.sql` — voir `HOMI_SHOPPING_STOCKS_SPEC.md`.
- Nouveaux types : `stock.restock_confirmed`, `stock.restock_dismissed`, `stock.purchase_confirmed` (en plus de `stock.low` et `shopping.item_checked`, déjà dans l'énuméré, désormais **émis**).
- Émission : `stock.low` et `shopping.item_checked` par des déclencheurs d'**émission seule** (comme `task.completed`) ; `stock.restock_*` et `stock.purchase_confirmed` par les RPC `stock_restock` / `stock_validate_purchase`. Clés : `stock.low:<stock>:<début de période basse>`, `shopping.item_checked:<article>:<version>` (décocher puis recocher = nouveau fait), `stock.restock_confirmed:<stock>:<mission>`, `stock.purchase_confirmed:<stock>:<version>`.
- Consommateur `_consume_stock_event` (répartiteur commun `_dispatch_household_event`, même transaction, erreur isolée ; passage planifié `process_household_events` étendu) :
  - `stock.low` → stock « suggested » + notification neutre au responsable ; **aucune mission** ;
  - `stock.restock_confirmed` → liens mission ↔ stock (« ordered ») ; `stock.restock_dismissed` → « dismissed » ;
  - `shopping.item_checked` → **boucle fermée** : la mission liée passe « Terminée » seulement si c'est son destinataire qui coche (`mission_respond('complete')`, mêmes règles) ; sinon notification de proposition, aucune transition forcée ; stock lié « bought » (quantité inchangée).
- `stock.purchase_confirmed` n'a **pas encore de consommateur** : il reste `pending` pour le futur module Budget (contrat du `payload` : spec § 6).
- Consommateur des missions étendu : l'article créé à l'acceptation porte le stock de la mission (ou du même produit) ; la fin de mission coche l'article, ce qui publie `shopping.item_checked` (profondeur 1) sans rien rejouer.
- Répartiteur : il ne réserve plus que les types qui ont un consommateur, et **restaure le contexte de l'événement parent** après un traitement imbriqué (un fait émis ensuite garde sa chaîne d'origine).

Boucles (chaque flèche = un fait typé, chaque fait une seule fois) :

```
stock bas ─stock.low→ suggestion ─(confirmation)→ create_mission ─stock.restock_confirmed→ mission ↔ stock
mission acceptée ─mission.accepted→ article lié au stock
article coché ─shopping.item_checked→ (destinataire) mission_respond('complete') ─mission.completed→ article déjà coché : fin
mission terminée ─mission.completed→ article coché ─shopping.item_checked→ mission déjà terminée : fin ; stock « à valider »
validation d'achat ─stock.purchase_confirmed→ (futur Budget)
```

## 3. Idempotence

| Niveau | Mécanisme |
|---|---|
| Saisie hors ligne (insertion) | `client_id` uuid généré sur l'appareil ; tables de suivi : `unique(client_id)` ; **tâches, demandes, articles de courses, stocks : `unique(household_id, client_id)`** (garde-manger migré : `client_id` déterministe) ; envoi `on conflict … do nothing` (`conflictTarget()` dans `src/lib/offlineConflicts.ts`) |
| Événements | `idempotency_key` unique ; une émission répétée renvoie l'événement existant (même en cas de course : `on conflict do nothing` puis relecture) |
| Notifications push | Réservation atomique `pushed_at` avant l'envoi (deux exécutions de `send-push` n'envoient jamais deux fois) |
| Tâches récurrentes | Occurrence suivante créée sans doublon (existant, `40_family_load.sql`) |

Construction des clés : `<type>:<entité>:<instant ou version du fait>` — jamais un horodatage de réception (il change à chaque rejeu).

**Envois directs (audit 08, `src/lib/idempotency.ts`)** : rendez-vous, demandes d'aide, traitements, listes de courses
générées, tâches en lot, et aussi les créations de tâches / articles / stocks passant par la file : l'identifiant (`id`
ou `client_id`) est **stable tant que la même saisie (même contenu) n'a pas abouti** (`withIdempotentId`), puis oublié.
« Réessayer » après une réponse perdue, ou une double pression, renvoie donc le même identifiant → `on conflict … do
nothing` → une seule ligne. Lignes d'un lot : `derivedId(lot, position)`. Les requêtes de données ont un délai maximal
(30 s, `timedFetch`) : au-delà, erreur « timeout » (message clair, erreur passagère → la file la garde).

## 4. Conflits d'édition

Avant : « le dernier qui écrit gagne » sans le savoir. Maintenant, sur `family_tasks`, `care_requests`, `shopping_items`, `household_stocks` (15/11/2026) :

1. `version integer` posée par le serveur (`_bump_version`) : 1 à la création, +1 à chaque modification, **impossible à forcer** par l'appareil ; `client_id` figé ; `updated_at` mis à jour.
2. `update_if_version(table, id, version_lue, modifications)` (RPC, `security invoker` : RLS et déclencheurs métier s'appliquent) renvoie :
   - `ok` + ligne : écrit ;
   - `conflict` + ligne actuelle : quelqu'un a modifié entre-temps, **rien n'est écrasé** ;
   - `forbidden` : ligne visible mais non modifiable par cette personne ;
   - `not_found` : absente **ou invisible** (rien n'est révélé à un autre foyer ou à un membre retiré).
   Colonnes modifiables : liste blanche par table (jamais `household_id`, `client_id`, `version`, auteurs).
3. Côté app : `updateIfVersion()` et `conflictingFields()` (`src/lib/offlineConflicts.ts`). Stratégie de résolution recommandée par champ :
   - **booléens « fait / coché »** : la valeur du serveur l'emporte si elle va dans le même sens ; sinon on montre les deux (ex. coché par l'un, décoché par l'autre) ;
   - **texte** (titre, notes) : jamais de fusion automatique ; l'écran propose « garder la mienne / garder la sienne » ;
   - **assignation, échéance** : la plus récente côté serveur l'emporte, l'autre est proposée en un geste.
   L'écran de résolution reste à construire (agent interface) ; la détection serveur est en place et testée.
4. **Branché sur les tâches (audit 08)** : `useSaveTask` passe par `mergeUpdate` (`offlineConflicts.ts`) avec la tâche
   lue à l'ouverture du formulaire : seuls les champs réellement modifiés partent ; si la tâche a changé entre-temps, un
   champ que l'autre n'a pas touché est reporté sur la nouvelle version, un champ déjà à la même valeur est ignoré (« fait »
   des deux côtés), un champ changé différemment des deux côtés est **refusé** (`code: 'conflict'`, message
   `rel.task.conflict`, liste relue). Cache d'avant la colonne `version` : la ligne est relue avant d'écrire.
   Achat validé dont la réponse s'est perdue : le « conflict » renvoyé au nouvel essai est reconnu comme notre propre
   achat (`isOwnReplayedPurchase`) — jamais compté deux fois, jamais affiché comme une erreur.

## 5. Hors ligne

- **Insertions** : file existante (`insertOrQueue`, `flushQueue`), ordre conservé, erreurs passagères gardées, refus serveur → « conflits » visibles dans Réglages > Synchronisation, jamais supprimés en silence. Désormais aussi pour les **tâches** (`useSaveTask`) et les **articles de courses** (`useAddShoppingItem`) avec `client_id` par foyer. Les demandes d'aide gardent un envoi direct (une demande « SOS » ne doit pas paraître envoyée alors qu'elle attend) mais portent un `client_id`.
- **Nouvel essai automatique (audit 08)** : après une erreur passagère alors que le réseau est présent (500, 503,
  délai dépassé), la file réessaie seule à 5 s, 15 s, 30 s, 1 min, 2 min puis toutes les 5 min (`RETRY_DELAYS_MS`),
  dans l'ordre, sans jamais rien perdre ; avant, elle attendait un changement de réseau ou un retour au premier plan.
- **Déconnexion avec file non vide (audit 08)** : dernier essai d'envoi, puis avertissement explicite (les saisies
  partent à la prochaine connexion du même compte, et sont effacées si un autre compte se connecte — jamais envoyées
  sous lui).
- **Modifications hors ligne** : pas encore mises en file. Prochaine étape : mettre en file `{table, id, version_lue, modifications}` et rejouer via `update_if_version` ; un `conflict` va dans « à vérifier » avec les deux versions.
- **Suppressions** : directes uniquement (pas de suppression logique) ; le journal d'audit garde la trace (« avant » résumé).
- **Révocation** : un membre retiré ne lit plus rien côté serveur à la seconde (RLS). **Depuis le 14/11/2026**, l'appareil purge aussi son cache : `useHouseholdRevocationGuard` (`src/lib/householdPurge.ts`, monté à la racine) compare la liste **fraîche** des appartenances (lue au serveur pendant la session, jamais le cache restauré) aux foyers déjà connus de l'appareil (`knownHouseholds`) ; pour un foyer disparu il retire du cache React Query toutes les requêtes dont la clé contient ce foyer ou dont les lignes portent son `household_id` (la persistance réécrit le cache sans elles), puis les saisies et refus de ce foyer dans la file hors ligne (`purgeQueueForHousehold`). Test Jest `householdPurge.test.ts`.

## 6. Anti-boucle

- Tout événement émis **pendant** le traitement d'un autre (contexte `homi.event_id` posé par `_begin_event_processing`, local à la transaction) hérite de `origin_event_id`, `root_event_id` et d'une profondeur +1.
- Profondeur > 3 → enregistré `skipped` (« anti-boucle : profondeur maximale »), jamais traité.
- Même `(type, table, entité)` déjà présent dans la chaîne d'origine → `skipped` (« même fait déjà présent »).
- `skipped` ne bloque jamais la saisie métier qui l'a provoqué et laisse une trace lisible.
- Les déclencheurs existants gardent leur garde-fou `pg_trigger_depth()` (verrou Premium, cascades).

## 7. Journal d'audit commun (`household_audit_log`)

- Ajout seul : écriture uniquement par le déclencheur `_audit_row` ; `UPDATE`, `DELETE` direct et `TRUNCATE` refusés **même pour le serveur** ; seule la suppression du foyer (cascade) efface son journal.
- Contenu : foyer, instant, acteur (NULL = serveur), origine `client`/`server`, table, ligne, action, **avant/après résumés** (colonnes modifiées seulement, textes tronqués à 120 caractères, jamais d'empreinte de jeton, de chemin de fichier ni de champ technique).
- Tables suivies : `household_members` (rôle, droits, enfants autorisés), `household_invitations`, `documents`, `document_shares`, `family_tasks`, `care_requests`, et depuis le 15/11/2026 `shopping_lists`, `shopping_items`, `household_stocks` (domaine `lists`). Brancher une table future : `select public._attach_audit('pointages', 'daily');` dans sa migration.
- Lecture : propriétaire (tout), co-parent (membres/invitations + domaines qu'il peut voir) ; jamais une nounou ; plus rien après un retrait.

## 8. Ce qui reste

1. File hors ligne des **modifications** (rejeu via `update_if_version`) et écran de résolution des conflits.
2. Planifier `process_household_events` (pg_cron / fonction) ; consommateur Budget de `stock.purchase_confirmed` (module absent) ; migrer `care_requests_after`. (« Article coché → mission terminée » et stocks : **faits** le 15/11/2026.)
3. Realtime : `shopping_items`, `shopping_lists` et `household_stocks` publiés le 15/11/2026 ; reste `document_shares` si un écran en a besoin.
4. Suppression logique (`deleted_at`) pour les modules où l'historique compte (pointages, contrats).
