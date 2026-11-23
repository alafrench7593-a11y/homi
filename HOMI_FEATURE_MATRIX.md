# HOMI — Matrice des fonctionnalités (spécification « système d'exploitation du foyer »)

Établie le 13/11/2026 sur `homi/fondations` (`d25a79d`), en lecture seule. Détail des preuves : `HOMI_GLOBAL_AUDIT.md`.
**Statuts** : EF = Existante et fonctionnelle · EI = Existante mais incomplète · AB = Absente · AC = À corriger.
**Preuve** : V = VÉRIFIÉ (lu/exécuté ici) · R = REPRIS des audits précédents · S = SUPPOSÉ.
Priorités : P0 = socle sans lequel le reste est faux ou dangereux · P1 = valeur principale · P2 = confort / extension.
Abréviations : `mig/` = `supabase/migrations/`, `app/` = `src/app/`, `hooks/` = `src/lib/data/`.

## A. Architecture familiale commune

| Fonctionnalité | Statut | À réutiliser | Dépendances | Prio | Risques techniques | Preuve |
|---|---|---|---|---|---|---|
| Utilisateurs / comptes | EF | `auth.users`, `profiles`, `handle_new_user`, `app/auth/*`, `delete-account` | — | P0 | Fournisseurs sociaux non testés sur appareil | V |
| Foyers (multi-foyers) | EI | `households`, `household_members`, `useHouseholdId` (`hooks/hooks.ts` l. 65) | Sélecteur de foyer UI | P0 | Base multi-foyers OK, UI mono-foyer (aucun sélecteur) | V |
| Membres, invitations, retrait, départ | EF | `create_household_invitation`, `accept_household_invitation`, `app/settings/family.tsx` (leave/revoke) | — | P0 | Invitation coparent sous Premium (`coparent_invite`) | V |
| Rôles et permissions serveur (RLS) | EI | `can_access_household`, `_apply_household_policies` (52 tables), `_apply_owner_policies` | Portée par enfant/document | P0 | Granularité foyer × domaine seulement | V |
| Enfants | EF | `children`, `app/child/[id]*` | — | P0 | Pas d'enfant partagé entre 2 foyers | V |
| Animaux | AB | — (modèle à calquer sur `children` + `_apply_household_policies`) | Nouveau domaine de droits | P1 | Nouveau domaine = révision UI des droits | V |
| Professionnels invités (rôle Nounou restreint) | EI | rôle `caregiver`, préréglage `settings/family.tsx` l. 223 | Portée par enfant, exemption Premium, espace dédié | P0 | Préréglage donne `health` ; voit tous les enfants ; `_premium_of` exclut caregiver → écriture bloquée si strict | V |
| Révocation immédiate | EI | `members_delete` RLS, `revoked_at` invitations | Purge cache local, coupure Realtime | P0 | Cache persistant garde les données déjà lues | V (RLS) / S (cache) |
| Modes de garde | EI | `custody_plans` (garde alternée), `child/[id]/school.tsx` (texte libre) | Table `care_arrangements` | P1 | Rien de structuré pour nounou/crèche | V |
| Contrats | AB | — | Documents à permissions, audit | P1 | Données sensibles (salaire) | V |
| Plannings | EI | `care_shifts` (nuit / temps pour soi, ≤ 24 h), `custody_plans` | Planning de garde | P1 | `care_shifts.kind` limité à `night/me_time` | V |
| Événements calendrier | EF | `family_events`, `app/calendar.tsx`, `calendar-feed` | — | P0 | Garde alternée non affichée dans l'agenda | V |
| Transmissions | EI | `house_notes` (carnet de la maison), `child/[id]/card.tsx` | Carnet de liaison | P1 | Pas d'horodatage par entrée ni d'auteur affiché par note (S) | V |
| Pointages | AB | — | Audit, validation, export (`src/lib/csv.ts`) | P1 | Valeur légale (Pajemploi) | V |
| Missions | EI | `family_tasks`, `family_task_events`, `care_requests` | Statuts étendus, liens objets | P0 | Statuts répartis sur 2 tables | V |
| Responsabilités | EI | `family_domains` (clé libre), `app/family/domains.tsx` | Référentiel de domaines | P1 | Clé libre non contrainte à une liste | V |
| Listes de courses / articles | EF (15/11) | `shopping_items` complétée (marque, taille, catégorie, responsable, stock, photo prévue), `app/meals/shopping.tsx` refondu, liste libre | — | P1 | Photo : colonne prête, pas de téléversement | V |
| Stocks | EF (15/11) | `household_stocks` (RLS foyer, audit, `client_id`/`version`), `app/family/stocks/*` ; garde-manger migré du local vers le serveur | — | P1 | Fréquence informative (pas de prévision de rupture) | V |
| Dépenses | AB | prix vérifiés `ingredient_prices`, `product_prices` (référentiel) | Table dépenses | P1 | Montants, devise, arrondis | V |
| Documents | EI | `documents` (`private_to_uploader`), `family_papers`, `app/documents/*` | Partage par document | P0 | Domaine entier ou privé, rien entre les deux | V |
| Notifications | EI | `notifications`, `push_devices`, `send-push`, `src/lib/notifications.ts` | Prefs serveur | P0 | Heures calmes non appliquées côté serveur | V |
| Préférences de communication | AB | `daily_digest_prefs`, prefs locales `autoNotifs` | Table prefs par membre | P1 | — | V |
| Événements métier | AB | modèle `family_task_events` | Table `domain_events` / outbox | P0 | Synchronisations codées en déclencheurs | V |
| Journaux d'audit | EI | `family_task_events` (tâches seulement), `moderation_actions` (communauté) | Audit générique append-only | P0 | Rien pour documents, droits, heures | V |
| Source de vérité unique | EI | logique serveur en déclencheurs `security definer` | Événements métier | P0 | Garde-manger et prefs notif dupliqués localement | V |
| Transactions | EI | déclencheurs (une transaction par écriture) | RPC multi-tables | P0 | Flux composites (courses→stock→dépense) inexistants | V |
| Temps réel | EI | `useRealtimeSync` (`src/lib/sync.ts`), publication `20261019001000` (16 tables) + courses et stocks (15/11 : 19) | Ajout des nouvelles tables | P0 | Liste à maintenir à 2 endroits (SQL + `HOUSEHOLD_TABLES`) | V |
| Conflits simultanés | AB | — | Colonne version / `updated_at` conditionnel | P0 | `backend.update` = dernier qui écrit gagne | V |
| Hors ligne + résolution de conflits | EI | `src/lib/offline.ts` (`insertOrQueue`, conflits visibles `settings/sync.tsx`), cache persistant | Mises à jour hors ligne | P0 | File = insertions seulement | V |
| Idempotence / anti-doublons | EI | `client_id uuid unique` (tables de suivi), upsert `ignoreDuplicates`, récurrence sans doublon | `client_id` sur missions/courses | P0 | `family_tasks`, `care_requests`, `shopping_items` sans `client_id` | V |
| Historique des modifications sensibles | EI | `family_task_events` (non falsifiable, test `40_family_load.sql`) | Audit générique | P0 | Droits, documents, heures non historisés | V |

## B. Nounou & crèche (12 outils)

| Fonctionnalité | Statut | À réutiliser | Dépendances | Prio | Risques techniques | Preuve |
|---|---|---|---|---|---|---|
| Recherche de garde (fiches, candidatures, statuts, liste d'attente, visites, relances) | AB | guide `guide/school` (contenu), `reminders` pour relances, `trusted_contacts(kind='professional')` | Tables candidats/candidatures | P2 | Données de tiers non inscrits (RGPD) | V |
| Comparateur | AB | composants de comparaison `products/compare`, `scanner/compare` (UI) | Recherche de garde, budget | P2 | — | V (écrans) |
| Journal d'adaptation | AB | `child_observations` (journal quotidien par enfant, domaine `daily`) | Mode de garde | P2 | — | V |
| Carnet de liaison (repas, biberons, siestes, changes, activités, incidents, consignes, messages, photos ; auteur, horodatage, historique) | EI | suivi bébé `bottles`, `meals`, `sleeps`, `diapers`, `child_observations`, `child_photos` (avec `client_id`, hors ligne, Realtime) ; `house_notes` | Rôle nounou restreint, historique d'édition, messages | P0 | Pas d'historique d'édition sur ces tables ; photos = Premium strict | V |
| Planning de garde (habituel/exceptionnel, congés, fermetures, dépôts/récupérations, adultes autorisés) ↔ calendrier | AB | modèle `custody_plans` + `custody_exceptions` (cycle + exceptions), `calendar.tsx` | Mode de garde, agenda | P1 | Récurrences + fuseaux | V |
| Pointage des heures (prévu/réalisé/écarts/corrections/validations/export, audit) | AB | `src/lib/csv.ts`, `exportData.ts` | Planning, audit, contrat | P1 | Double validation parent/nounou, valeur légale | V |
| Contrats & documents à permissions | AB | `documents`, stockage privé | Partage par document | P1 | — | V |
| Assistant administratif (CAF, CMG, Pajemploi, Urssaf, RPE, Service-Public) | EI | `family/papers.tsx` (démarches CAF/école), articles, liens officiels `external_resources` | Contrat, heures | P2 | Exactitude réglementaire, mises à jour | V |
| Budget de garde (réel/saisi/estimé) | AB | — | Dépenses, pointage, contrat | P1 | Calcul CMG à ne pas promettre | V |
| Garde de secours (proposer, demander après confirmation, attendre réponse explicite) | EI | `care_requests` (kind `help_today`/`relay`, réponse explicite réservée au destinataire, `to_user` ciblé), `support_circle` (cercle hors app) | Contacts externes invités | P1 | Destinataires hors foyer impossibles (`is_member_of`) | V |
| Fin de contrat | AB | — | Contrat, documents, révocation | P2 | — | V |
| Espace professionnel invité | AB | rôle `caregiver`, `settings/family.tsx` | Portée par enfant, sélecteur multi-foyers, exemption Premium | P0 | Premium strict bloque l'écriture | V |

## C. Missions familiales et responsabilités

| Fonctionnalité | Statut | À réutiliser | Dépendances | Prio | Risques techniques | Preuve |
|---|---|---|---|---|---|---|
| Demande entre membres (« Confier à… ») | EF | `family_tasks.assignee_id` + notification serveur, `care_requests(kind='take_task')` ; libellé `cf.give` « Confier à : {name} » (`i18n/fr/moodSupport.ts`) | — | P0 | — | V |
| Statuts À accepter / Acceptée / En cours / Terminée / Refusée / Reportée / Annulée | EI | `family_tasks.status todo/done/cancelled` + `care_requests open/accepted/declined/cancelled/done` + événement `postponed` | Machine d'états unique | P0 | Migration des 2 modèles sans perte | V |
| Historique | EF | `family_task_events`, `app/family/history.tsx` | — | P0 | Pas d'historique pour `care_requests` hors colonnes `responded_*` | V |
| Réponses rapides | EI | `care_requests` kinds, notifications interactives tâche `TASK_DONE/TASK_SNOOZE` (locales) | Actions sur push serveur | P1 | Réponse depuis notification serveur absente | V |
| Récurrence | EF | `family_tasks.recurrence` + occurrence suivante sans doublon (test SQL) | — | P1 | Pas de fin de récurrence / exceptions | V |
| Produit / enfant / animal associés | AB | — (ajouter `child_id`, `shopping_item_id`, `pet_id`) | Animaux, stocks | P1 | Contrôle d'appartenance au foyer à ajouter | V |
| Notifications interactives | EI | `src/lib/notifications.ts` catégories `task`, `reminder` ; `_layout.tsx` `handleDoneResponse` | Push serveur avec catégories | P1 | Envoi réel non testé | V / R |
| Responsabilités par domaine (courses, repas, bébé, crèche, animaux, ménage, administratif, santé) | EI | `family_domains` + `family/domains.tsx`, « Qui y pense » `family/load.tsx`, catégories `family_tasks` | Référentiel de domaines | P1 | Catégories de tâches ≠ domaines HOMI (pas `pets`, `childcare`) | V |

## D. Modes de communication du couple

| Fonctionnalité | Statut | À réutiliser | Dépendances | Prio | Risques techniques | Preuve |
|---|---|---|---|---|---|---|
| Modes Normal / Besoin d'espace / Coordination / Concentration | AB | « Je décroche » `offduty_periods` (pause des rappels non médicaux, ≤ 24 h) | Table de modes par membre | P1 | Filtrage des notifications serveur requis | V |
| Chacun contrôle uniquement les siens | EI | politique `offduty_own` (`user_id = auth.uid()`), `care_shifts_guard` (temps pour soi personnel) | — | P0 | — | V |
| Heures silencieuses | EI | heures calmes locales (`settings/notifications.tsx`, `autoNotifs.ts`, testé) | Application dans `send-push` | P1 | Serveur ignore les heures calmes | V |
| Regroupement | EI | `batcher` Realtime (UI), `daily_digest_prefs` (résumé) | Regroupement serveur des push | P2 | — | V |
| Confidentialité écran verrouillé | EI | textes neutres (`care_requests_after`, `send-push` communauté/rappels) | Réglage par membre | P1 | Titres de tâches envoyés en clair (`left(new.title,120)`) | V |
| « Proposer un moment pour discuter » | EI | `couple_checkins` (point de couple, owner/coparent seuls), `family/couple.tsx` | Proposition datée + réponse | P2 | — | V |
| Pas de surveillance cachée / pas de géoloc sans consentement | EF | aucune géoloc hors `outings` sur demande ; « Qui y pense » sans score | — | P0 | À préserver dans les nouveaux modules | V |
| Pas de lecture obligatoire (pas d'accusé de lecture imposé) | EF (S) | `notifications.read_at` personnel, non exposé aux autres (S) | — | P1 | Ne pas ajouter d'accusés de lecture aux missions | S |
| Blocage | EI | `user_blocks` (communauté uniquement) | Blocage intra-foyer | P1 | Bloquer un membre du foyer = conflit avec RLS partagée | V |
| Départ sécurisé d'un foyer | EI | « Quitter ce foyer » (`settings/family.tsx` l. 269), données perso conservées, transfert propriétaire (`account_deletion_qa`) | Purge cache, révocation flux .ics | P0 | Propriétaire ne peut pas partir ; flux calendrier existants restent actifs (S) | V / S |

## E. Courses et stocks

| Fonctionnalité | Statut | À réutiliser | Dépendances | Prio | Risques techniques | Preuve |
|---|---|---|---|---|---|---|
| Liste partagée | EF (15/11) | `shopping_items` complétée, Realtime, ajout hors ligne (`client_id`), doublons (alerte + `merge_shopping_items`), historique (audit + « Achetés récemment ») | — | P1 | Cocher hors ligne : toujours pas en file (§ 8 synchro) | V (SQL 98s, Jest, E2E) |
| Inventaire avec seuils | EF (15/11) | `household_stocks`, `/family/stocks` (+ `/baby`), quantité estimée jamais inventée, seuil, fréquence, responsable, rappel, enfant ; animal prévu (`pet_id`) | — | P1 | Module animaux absent | V (SQL 98s, Jest, E2E) |
| Réapprovisionnement → mission → courses → stock après validation | EF (15/11) | `stock.low` → suggestion → `stock_restock` → `create_mission` → article lié → `shopping.item_checked` → `stock_validate_purchase` ; `stock.purchase_confirmed` pour le Budget | Budget (consommateur) | P1 | Passage planifié non déployé | V (SQL 98s, Jest, E2E scénarios A et F) |

## F. Synchronisations inter-modules

| Synchronisation | Statut | À réutiliser | Prio | Risques | Preuve |
|---|---|---|---|---|---|
| nounou ↔ calendrier | AB | `calendar.tsx` agrégateur | P1 | — | V |
| nounou ↔ missions | AB | `family_tasks.assignee_id` (une nounou membre peut déjà recevoir une tâche si `lists` en édition) | P1 | Premium strict | V |
| nounou ↔ budget | AB | — | P2 | — | V |
| nounou ↔ profil enfant | EI | tables de suivi bébé partagées (domaine `daily`) | P0 | Tous les enfants visibles | V |
| missions ↔ courses | EF (14–15/11) | `mission.accepted` → article ; `mission.completed` → coché ; `shopping.item_checked` → mission terminée si le destinataire coche | P1 | — | V |
| courses ↔ stocks | EF (15/11) | `shopping.item_checked` → stock « à valider » ; quantité après `stock_validate_purchase` seulement | P1 | — | V |
| missions ↔ calendrier | EF | tâches datées affichées dans `calendar.tsx` | P1 | — | V |
| missions ↔ notifications | EF | `family_tasks_after` → `notifications` ; `autoNotifs` locales | P0 | Heures calmes serveur | V |
| animaux ↔ missions | AB | — | P2 | — | V |
| ménage ↔ missions | EI | catégorie `housework` | P2 | — | V |
| budget ↔ achats | EI (15/11) | `stock.purchase_confirmed` publié et documenté (sans montant), consommateur Budget absent | P2 | Module Budget absent | V |
| communication ↔ notifications | EI | `offduty_periods` pause rappels locaux | P1 | Serveur non filtré | V |
| mode Imprévu ↔ tous | EI | `family/urgent.tsx` (mode urgence organisation, UI minimale), `family/sos.tsx`, `help_today` | P1 | Pas d'état global « imprévu » propagé | V |

## G. Autres modules

| Fonctionnalité | Statut | À réutiliser | Dépendances | Prio | Risques techniques | Preuve |
|---|---|---|---|---|---|---|
| Budgets (foyer) | AB | — | Dépenses | P1 | — | V |
| Documents | EI | voir A | Partage par document | P0 | — | V |
| Notifications | EI | voir A | Prefs serveur | P0 | — | V |
| Outils animaux (santé, vaccins, nourriture, garde) | AB | modèles `child_vaccinations`, `reminders`, `appointments` | Table animaux | P2 | — | V |
| Santé | EF | vaccins, traitements, suivi santé, urgences, croissance OMS | — | P1 | Domaine `health` non cloisonné par enfant | V |
| Assistant HOMI | EI | `functions/assistant` (coupé), `localAI` | Clé IA, outils d'action | P2 | Coût, sécurité santé | V / R |
| Abonnements (Premium strict, RevenueCat) | AC | `src/lib/premium/*`, `revenuecat-webhook`, `premium_policy` | Catalogue HOMI, règle invités | P0 | IDs `aufildenous_*` ; caregiver exclu | V / R |
| Animations | EI | `Animated`, `Motion.tsx`, `MotionKit.tsx`, Reduce Motion | Reanimated | P2 | 0 Reanimated | V |
| Tests existants | EF | 1 525 SQL (exécutés ici, 0 échec), Jest 129 suites (R) | — | P0 | Aucun test appareil | V / R |
| Navigation | EI | Expo Router 217 routes, onglets `(tabs)` | Espace Famille / Pro | P0 | Refonte sans casser les routes (`gen-routes --check`) | V |
| Authentification | EF | voir A | — | P0 | — | V |

---

## Réutilisables par chantier (inventaire précis)

**Missions**
- Tables : `family_tasks` (`mig/20261019000300_family_load.sql`), `family_task_events` (historique écrit par déclencheur, lecture seule), `care_requests` (demandes + réponse explicite, transfert `take_task` / `swap_slot`), `routines` (gabarits → tâches), `family_domains` (domaine confié → assigné par défaut).
- Fonctions : `family_tasks_before/after`, `care_requests_guard/after`, `is_member_of` (corrigée `mig/20261109000100`).
- Écrans : `app/family/index.tsx`, `history.tsx`, `routines.tsx`, `brain-dump.tsx`, `domains.tsx`, `load.tsx`, `review.tsx` ; `src/features/familyLoad.tsx`.
- Hooks : `hooks/hooks-family-load.ts` (`useFamilyTasks`, `useSaveTask`, `useBatchTasks`, `useTaskEvents`, `useCareRequests`, `useCreateRequest`, `useRespondRequest`).
- « Confier à… » : `cf.give` (`src/i18n/fr/moodSupport.ts`). Relais : `care_shifts` + `family/nights.tsx`, `me-time.tsx`, `offduty.tsx`, `care_shifts_notify` (`mig/20261019000700`).
- Tests : `supabase/tests/sql/40_family_load.sql`, `44_relay_notifications.sql`, `83_charge_mentale.sql`.

**Courses (listes)** : `shopping_lists`, `shopping_items` (`mig/20261020000100_recipes.sql`), `checklists`/`checklist_items` ; `app/meals/shopping.tsx`, `meals/[slug].tsx` (ajout depuis recette), `app/lists.tsx` ; `hooks/hooks-recipes.ts` (`useLatestShoppingList`, `useAddShoppingItem`, `useToggleShoppingItem`). Test : `51_recipes.sql`.

**Stocks** : rien côté serveur. Seuls `shopping_items.at_home` et le garde-manger local `useUiStore.pantry` (`app/meals/pantry.tsx`, `src/lib/store.ts`). Logique de rayons `AISLE_ORDER` (`src/lib/recipes/engine.ts`).

**Budget** : rien. Référentiels de prix `ingredient_prices`, `product_prices` (`mig/20261020000500`), coût par portion des recettes ; export CSV `src/lib/csv.ts`.

**Animaux** : rien. Gabarits à copier : `children` + `_apply_household_policies`, `child_vaccinations`, `appointments`, `reminders`.

**Documents** : `documents` (`private_to_uploader`, `child_id`), `document_extractions`, fonctions `document-extract` / `document-read` / `storage-cleanup`, `family_papers` ; écrans `app/documents/*`, `app/family/papers.tsx` ; `hooks/hooks-documents.ts`. Tests `47_documents_v2.sql`, `69_documents_path_consent.sql`.

**Notifications (heures calmes)** : serveur `notifications` (+ catégorie `family`), `push_devices`, `send-push`, `notifications_actor` (`mig/20261104001500`) ; appareil `src/lib/notifications.ts` (catégories interactives `reminder`, biberon, traitement, `task`), `src/lib/domain/autoNotifs.ts` (`inQuiet`, `afterQuiet`), `app/settings/notifications.tsx` (heures calmes 20–23 h → 6–9 h, locales), `offduty_periods` ; `daily_digest_prefs`. Tests Jest `autoNotifs.test.ts`, `doneNotifications.test.ts`.

**Rôles du foyer** : `household_members.role` (`owner`/`coparent`/`caregiver`), `can_view[]`/`can_edit[]`, `can_access_household`, `is_household_member`, `is_household_owner`, `_apply_household_policies` (52 tables, domaines `daily/health/documents/pregnancy/lists/names/profile`), invitations hachées ; co-parent invité via `settings/family.tsx` (Premium `coparent_invite`) ; politique par rôle `couple_checkins` (owner/coparent) ; Premium partagé owner↔coparent seulement (`_premium_of`). Tests `10_security.sql`, `20_family_community_account.sql`, `66_membership_oracles.sql`, `67_household_quota_owner.sql`.

**Hors ligne** : `PersistQueryClientProvider` + `createAsyncStoragePersister` (`app/_layout.tsx`, exclusions `PRIVATE_KEYS`), file `src/lib/offline.ts` (`insertOrQueue`, `flushQueue`, conflits, propriétaire de file), écran `app/settings/sync.tsx`, pastille `components/OfflinePill.tsx`. Tests `offlineQueue.test.ts`, `medNotifsOffline.test.ts`.

**Temps réel** : publication `mig/20261019001000_realtime_sync.sql` (16 tables), `useRealtimeSync` + `batcher` + `wireFocusAndOnline` (`src/lib/sync.ts`), `backend.subscribeChanges` (`src/lib/backend/supabase.ts` l. 108).

**Audit** : `family_task_events` (seul historique métier inviolable), `moderation_actions` (communauté), `storage_deletions`, consentements datés `consents` ; mécanisme de garde `pg_trigger_depth()` dans `_require_premium_write`. Aucun journal d'audit générique.
