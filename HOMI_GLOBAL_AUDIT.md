# HOMI — Audit global de l'existant (Phase 1, lecture seule)

Établi le 13/11/2026 sur `homi/fondations` (commit `d25a79d`). Aucun fichier de code modifié.
Légende : **VÉRIFIÉ** = lu dans le code/schéma ou exécuté ici · **REPRIS** = chiffre d'`AUDIT_SOURCE.md` / `INVENTAIRE_TRANSFERT.md` non recompté · **SUPPOSÉ** = déduit, non lu en détail.
Compagnon : `HOMI_FEATURE_MATRIX.md` (statut fonctionnalité par fonctionnalité de la nouvelle spécification).

## Synthèse en 8 lignes

1. Le socle « foyer » existe et est sérieux : `households` / `household_members` (rôles `owner` / `coparent` / `caregiver`) + droits **par domaine** (`can_view[]`, `can_edit[]`) appliqués en RLS par `can_access_household()` sur 52 tables via `_apply_household_policies`. VÉRIFIÉ.
2. Les « missions » ont un ancêtre solide : `family_tasks` + historique serveur `family_task_events` + demandes `care_requests` (accepter/décliner, « Peux-tu prendre cette tâche ? » transfère la tâche) + récurrence + notifications serveur. VÉRIFIÉ.
3. Hors ligne et temps réel existent, mais **partiellement** : file d'attente d'**insertions** idempotentes (`client_id`) avec conflits visibles ; aucune mise à jour/suppression hors ligne, aucune résolution de conflit d'édition (dernier qui écrit gagne). Realtime publié sur 16 tables seulement. VÉRIFIÉ.
4. **Absents du schéma** : animaux, budget/dépenses, stocks/inventaire, contrats de garde, pointage d'heures, carnet de liaison, candidatures/recherche de garde, modes de communication, journal d'audit générique, événements métier. VÉRIFIÉ (aucune table, aucun écran).
5. Le rôle `caregiver` (nounou) existe mais ses droits sont **par foyer, pas par enfant** : impossible aujourd'hui de restreindre une nounou à un enfant ou à des documents précis. VÉRIFIÉ.
6. **Risque bloquant** : avec `premium_policy.strict = true`, toute saisie dans `family_tasks`, `care_shifts`, suivi bébé… est refusée à un compte sans Premium — or un `caregiver` ne reçoit **jamais** le Premium du foyer (`_premium_of`). Une nounou invitée ne pourrait rien écrire. VÉRIFIÉ (lecture SQL).
7. Les heures calmes existent **sur l'appareil** (notifications locales), pas côté serveur : les push serveur (`send-push`) les ignorent. VÉRIFIÉ.
8. Tests : 1 525 assertions SQL REPRIS + réexécution ici (voir § 19) ; Jest 129 suites REPRIS ; aucun test appareil.

---

## 1. Stack — VÉRIFIÉ (`package.json`, `INVENTAIRE_TRANSFERT.md` § 2)

- Expo SDK `~57.0.30`, expo-router `~57.0.28`, React Native 0.86.3, React 19.2.3, TypeScript ~6.0.3 strict.
- Données : `@supabase/supabase-js ^2.118`, `@tanstack/react-query ^5.104` + `react-query-persist-client` (AsyncStorage), `zustand ^5`.
- Achats : `react-native-purchases ^10.14` (RevenueCat). Erreurs : Sentry (opt-in). `expo-location 57.0.20` présent (sorties uniquement).
- Serveur : 98 migrations, 17 fonctions Deno (`supabase/functions`), Gemini derrière `ASSISTANT_ENABLED`.
- **Limites** : Reanimated 4.7 / Gesture Handler non déclarés, **0 import** de `react-native-reanimated` dans `src/` (VÉRIFIÉ, grep) ; ESLint non configuré (REPRIS) ; pas de Google Play.

## 2. Architecture — VÉRIFIÉ

- Couches : `src/app` (routes) → `src/features/*` (blocs UI) → `src/lib/data/hooks-*.ts` (≈ 38 fichiers de hooks React Query) → `src/lib/backend` (abstraction `backend.insert/update/remove/subscribeChanges`, implémentations `supabase.ts` et **`demo.ts`** = mode démo sans serveur).
- Logique métier serveur en **déclencheurs plpgsql `security definer`** (ex. `family_tasks_before/after`, `care_requests_guard/after`, `care_shifts_guard`) : bonne base pour « source de vérité unique » et « permissions serveur ».
- Domaine pur testable dans `src/lib/domain/*` (ex. `autoNotifs.ts`, `toolCatalog.ts`).
- **Limites** : pas de couche « événements métier » (bus/outbox) — chaque synchronisation inter-modules est codée en dur dans un déclencheur (ex. demande acceptée → `update family_tasks`). Pas de RPC transactionnelles multi-tables pour les flux composites (courses → stock → dépense). Clés de cache persistées préfixées `toietmoi.*` (héritage).

## 3. Navigation — VÉRIFIÉ

- Expo Router, **217 routes** (`src/lib/routes.generated.ts`, `scripts/gen-routes.js --check`), 218 fichiers d'écran (REPRIS).
- Onglets (`src/app/(tabs)/_layout.tsx`) : `index` (Accueil), `agenda`, `track` (Suivi), `tools`, `community`, `ask`, `profile` ; `moi` masqué (`href: null`).
- Catalogue d'outils : `src/lib/domain/toolCatalog.ts`, référence `MATRICE_OUTILS.csv` (155 lignes, 17 thèmes non vides).
- **Limites** : aucun espace « Famille / Foyer » de premier niveau ; les outils famille sont sous `/family/*` (22 écrans) et `/settings/family`. Aucun espace professionnel invité, aucun sélecteur de foyer (voir § 6).

## 4. Authentification — VÉRIFIÉ (fichiers) / NON VÉRIFIÉ (fournisseurs réels)

- Écrans `src/app/auth/` : `sign-in`, `sign-up`, `forgot`, `reset`, `callback` ; `src/lib/auth.tsx`, `authFlow.ts`, `authSession.ts`, `backend/socialAuth.ts`, `backend/secureStorage.ts`.
- Apple / Google affichés seulement si `EXPO_PUBLIC_AUTH_APPLE=1` / `EXPO_PUBLIC_AUTH_GOOGLE=1` (`src/lib/socialProviders.ts`).
- Comptes : `handle_new_user()` (foundation), `account_bootstrap`, consentements datés `consents` (purpose `terms`, `health_data`, `ai_assistant`…), suppression `functions/delete-account` + migration `account_deletion_qa` (transfert de propriété ; la nounou ne devient plus propriétaire).
- File hors ligne rattachée au compte (`setQueueOwner`) : rien n'est renvoyé sous un autre compte.
- **Limites** : rôles applicatifs `user_roles` (`admin/moderator/editor`) ≠ rôles du foyer. Aucun compte « professionnel » distinct ; fournisseurs sociaux non testés sur appareil.

## 5. Tables et relations — VÉRIFIÉ (grep des `create table` : 190 tables)

Groupes utiles à HOMI :
- **Foyer** : `households`, `household_members` (PK `household_id,user_id`), `household_invitations` (jeton haché SHA-256, expiration 7 j, `revoked_at`).
- **Enfants & suivi** : `children` (+ `allergies_declared`, `habits`, `enabled_tracking`), `bottles`, `breastfeeds`, `pumpings`, `diapers`, `sleeps`, `meals`, `child_observations`, `child_measurements`, `child_milestones`, `child_vaccinations`, `child_treatments`, `child_health_*`, `child_needs`, `child_steps`, `child_photos`, `kid_routines`.
- **Organisation** : `family_tasks`, `family_task_events`, `care_requests`, `care_shifts`, `routines`, `family_events`, `family_domains`, `family_prep`, `offduty_periods`, `house_notes`, `couple_checkins`, `family_papers`, `custody_plans`, `custody_exceptions`, `checklists`, `checklist_items`.
- **Courses/repas** : `shopping_lists`, `shopping_items` (`at_home`, `checked_by`), `meal_plans`, `meal_plan_items`, `recipes*`, `ingredient_prices`, `product_prices`, `kid_products`.
- **Services** : `notifications`, `push_devices`, `reminders`, `daily_digest_prefs`, `community_notification_prefs`, `calendar_feeds`, `documents`, `document_extractions`, `subscriptions`, `entitlement_grants`, `premium_policy`, `plan_limits`, `paid_tools`.
- **Absentes** (VÉRIFIÉ par grep des noms et mots-clés) : animaux, dépenses/budget, stocks/inventaire, contrats, pointages, carnet de liaison, candidatures de garde, préférences de communication du couple, `audit_log` générique, `domain_events`.
- **Limites** : la plupart des tables n'ont ni `updated_at` versionné ni `client_id` (seules les tables de suivi bébé en ont, `client_id uuid unique`) ; pas de suppression logique (`deleted_at`) → pas d'historique des suppressions.

## 6. Foyer et rôles — VÉRIFIÉ

- Rôles : `household_members.role in ('owner','coparent','caregiver')` (`20261015000100_foundation.sql` l. 112). Domaines de droits : `daily`, `health`, `documents`, `pregnancy`, `lists`, `names`, `profile`.
- `can_access_household(household, domain, write)` : propriétaire = tout ; sinon `domain = any(can_view|can_edit)`.
- `_apply_household_policies(table, domain)` (`20261015000200_journeys_tracking.sql` l. 11) : 4 politiques RLS standard ; appliquée à 52 tables (liste extraite). `_apply_owner_policies` pour les tables strictement personnelles.
- Invitations : `create_household_invitation` (propriétaire seul), `accept_household_invitation`, révocation via `revoked_at`. UI `src/app/settings/family.tsx` : rôle `coparent`/`caregiver`, préréglage nounou `view: daily, health, lists / edit: daily` (l. 223), édition des droits, retrait d'un membre, « Quitter ce foyer » (propriétaire ne peut pas partir).
- Oracle d'appartenance corrigé (`is_member_of`, `20261109000100_audit_acces.sql`).
- `couple_checkins` réservé `owner/coparent` (exemple de politique par rôle).
- **Limites** : (a) droits par foyer, **pas par enfant ni par document** ; (b) préréglage nounou donne `health` en lecture ; (c) aucun rôle « professionnel invité » ni « grand-parent » distinct, aucune date d'expiration d'accès ; (d) invitation du coparent réservée au Premium (`usePremiumAccess('coparent_invite')`) ; (e) **plusieurs foyers par compte possibles en base**, mais aucun sélecteur dans l'UI (`useHouseholdId` prend le premier ou le mémorisé) — bloquant pour une nounou qui garde plusieurs familles ; (f) pas d'enfants partagés entre deux foyers (garde alternée = un seul foyer).

## 7. Profils enfants — VÉRIFIÉ

- `children` + écrans `src/app/child/[id].tsx` et `child/[id]/` (album, card, discoveries, foods, grow, growth, health-tracking, needs, school, steps, vaccines, wellbeing) ; avatars/photos (`child_photos`, `20261107000600`).
- `child/[id]/school.tsx` : « École ou mode de garde » (établissement, contacts, aménagements, notes datées) via `child_need_entries`.
- `child/[id]/card.tsx` : fiche à transmettre (allergies, habitudes).
- **Limites** : pas de lien enfant ↔ mode de garde structuré (type, adresse, horaires, contrat) ; pas de « adultes autorisés » ; limite gratuite 3 enfants (`plan_limits`).

## 8. Calendriers — VÉRIFIÉ

- `src/app/calendar.tsx` (`FamilyCalendarScreen`, réutilisé par l'onglet `agenda`) : agrège `family_events`, `appointments`, tâches datées, `care_shifts` (relais, temps pour soi) ; vues jour/semaine/mois/agenda ; export `.ics`.
- `family_events` (types `activity/routine/shopping/important/school/custom`, récurrence jsonb, fuseau) — domaine `lists`.
- Abonnement iCalendar à sens unique : `functions/calendar-feed` + `calendar_feeds` (jeton haché, révocable, 60 req/h).
- Garde alternée : `custody_plans` / `custody_exceptions`, écran `family/custody.tsx` (cycle A/B, passation).
- Calendrier de grossesse / vaccins : `pregnancy/calendar`, `vaccine_calendars`.
- **Limites** : `calendar.tsx` **n'affiche pas** la garde alternée (0 occurrence de `custody`) ; pas d'import d'agenda externe ; pas de planning de garde nounou/crèche (habituel/exceptionnel, fermetures, congés) ; pas de détection de conflits d'horaires.

## 9. Tâches ménagères / organisation — VÉRIFIÉ

- `family_tasks` : catégories `feeding, diapers, sleep, shopping, packing, appointments, housework, admin, organization, parent_rest, other` ; `assignee_id` contrôlé membre du foyer ; `priority`, `essential`, `recurrence` (daily/weekly/monthly ×1–12, occurrence suivante créée sans doublon) ; `status todo/done/cancelled` ; `done_by/done_at` posés par le serveur.
- `family_task_events` (lecture seule, écrite par déclencheur : created/assigned/unassigned/done/reopened/postponed/updated/cancelled) → écran `family/history.tsx`.
- `care_requests` (`relay, taking_over, rest, take_task, available, swap_slot, help_today` ; `open/accepted/declined/cancelled/done`) : réponse réservée au destinataire, transfert automatique de tâche/créneau.
- Écrans : `family/index.tsx`, `routines`, `brain-dump` (tri local sans IA), `domains` (« Confier un domaine »), `load` (« Qui y pense »), `nights`, `me-time`, `offduty`, `review`, `urgent`, `sos`, `difficult`, `kid-routines`, `notebook`.
- Tests SQL : `40_family_load.sql` (21 assertions : hors foyer refusé, historique non falsifiable, récurrence sans doublon, transfert, cloisonnement), `44_relay_notifications.sql`, `83_charge_mentale.sql`.
- **Limites** : pas de statuts « À accepter / En cours / Reportée / Refusée » sur la tâche elle-même (ils vivent dans `care_requests`) ; pas de lien tâche → enfant / animal / produit / article de courses ; pas de responsabilité « par domaine » au sens HOMI au-delà de `family_domains` (clé libre `^[a-z_]{2,40}$`).

## 10. Listes de courses — VÉRIFIÉ

- `shopping_lists` / `shopping_items` (domaine `lists`) : rayon, quantité/unité, `at_home`, `checked_by/checked_at`, lien `meal_plans`. Écrans `src/app/meals/shopping.tsx` (liste partagée avec le coparent), ajout depuis une recette `meals/[slug].tsx`, menus `meals/menu.tsx`.
- `checklists` / `checklist_items` (valise maternité, achats, démarches…) : `src/app/lists.tsx`.
- **Limites** : liste de courses **liée aux recettes** (unités culinaires `g/ml/u/cs/cc/pincee`), pas de liste libre multi-magasins ; `shopping_items` **absent de la publication Realtime** ; pas de prix ni de montant ; une seule liste « la plus récente » utilisée (`useLatestShoppingList`).

## 11. Budgets — VÉRIFIÉ (absence)

- Aucune table de dépenses/budget. Existant tangent : `ingredient_prices` / `product_prices` (prix vérifiés datés, Open Prices) et « coût par portion » des recettes (`/meals/rankings`), filtre budget de recettes.
- **Limite** : tout le module budget (garde, achats, réel/saisi/estimé) est à construire.

## 12. Documents — VÉRIFIÉ

- `documents` (domaine `documents`, `private_to_uploader`, lien `child_id` / `pregnancy_id`, quota `documents_count` 15 en gratuit, stockage privé) ; `document_extractions` + fonctions `document-extract` / `document-read` (IA, consentement `document_reading`) ; écrans `src/app/documents/` (`index`, `[id]`, `scan`, `book`, `export`).
- `family_papers` (papiers de la famille, date d'expiration, démarches CAF/école/identité) : `family/papers.tsx`.
- Documents exclus du cache persistant (`PRIVATE_KEYS`, `src/app/_layout.tsx`).
- **Limites** : partage = tout le domaine `documents` ou « privé à moi » ; **pas de partage document par document** avec un invité ; pas de catégories contrat/attestation/bulletin de salaire ; pas de versionnage.

## 13. Notifications — VÉRIFIÉ

- Serveur : `notifications` (catégories dont `family`, `payload`, `read_at`, `pushed_at`), `push_devices` (jetons Expo, réclamation d'appareil `20261104000900`), fonction `send-push` (webhook sur INSERT ; titres neutres pour communauté et rappels produits). Déclencheurs qui notifient : tâche confiée, demande créée/acceptée/déclinée (texte neutre « Ouvrez l'application pour répondre »), relais de nuit modifié par un autre (`care_shifts_notify`).
- Appareil : `src/lib/notifications.ts` (809 l.) — catégories interactives `reminder` (snooze/done), biberon, traitement, **tâche** (`TASK_DONE`, `TASK_SNOOZE`) ; `src/lib/domain/autoNotifs.ts` (rendez-vous, tâches, échéances, papiers) ; **heures calmes** 20–23 h → 6–9 h (`settings/notifications.tsx`, `inQuiet`/`afterQuiet`, testé `autoNotifs.test.ts`) ; « Je décroche » met en pause les rappels non médicaux.
- Préférences : `daily_digest_prefs` (résumé matin/soir), `community_notification_prefs`.
- **Limites** : heures calmes **locales au téléphone**, non appliquées par `send-push` ; pas de regroupement serveur ; pas de préférences par catégorie/émetteur ; pas d'action interactive sur les notifications **serveur** (accepter une demande depuis la notification) ; envoi réel jamais testé sur appareil (REPRIS).

## 14. Animaux — VÉRIFIÉ (absence)

- Aucune table, aucun écran, aucun outil (grep `pet|animal|animaux|vétérin` : seulement articles/illustrations). À construire entièrement.

## 15. Santé — VÉRIFIÉ (structure) / REPRIS (contenus)

- Enfant : vaccins (`child_vaccinations`, calendriers par pays, reports), traitements (`child_treatments`, `treatment_logs`), suivi santé (`child_health_trackers/entries/items`), besoins particuliers, croissance (courbes OMS hors ligne), rendez-vous (`appointments`, rendez-vous privés `20261019000200`), questions pour la consultation, urgences (`/emergency`, 15/112/3114).
- Parent : humeur, sommeil parent, post-partum, cycle, grossesse, traitements personnels (`my_treatments`).
- Sécurité : aucune dose calculée, réponses structurées (REPRIS `AUDIT_SOURCE.md` § 4).
- **Limites** : données de santé de l'enfant toutes sous le domaine `health` → une nounou avec `health` voit tout (traitements, besoins) de **tous** les enfants ; pas de « consignes santé » ciblées à transmettre à la garde.

## 16. Assistant — VÉRIFIÉ (code) / NON VÉRIFIÉ (en service)

- `functions/assistant` (Gemini côté serveur, SSE, orientation urgente, refus), coupé si `ASSISTANT_ENABLED != 'true'` ; quota `consume_assistant_quota()` / `_plan_limit_of('assistant_questions_per_month')` ; payant (`premium_policy.assistant_paid`, `20261110000200`). `assistant-demo`, `community-ai`, `scan-explain`.
- Assistant local hors ligne sur les articles : `src/lib/localAI/`, écran `assistant/local.tsx` ; tri « Vider ma tête » local.
- **Limites** : l'assistant ne lit pas le foyer (tâches, agenda) et n'écrit rien ; aucun outil d'action (« crée une mission ») ; clé Gemini à recréer (REPRIS).

## 17. Abonnements — VÉRIFIÉ (code) / REPRIS (catalogue store)

- `src/lib/premium/` (`access.ts` avec `STRICT_TABLES`, `entitlement.ts`, `offers.ts`, `plans.ts`, `customerSync.ts`), `functions/revenuecat-webhook`, `functions/subscription-sync`, tables `subscriptions`, `entitlement_grants`, `premium_policy`, `plan_limits`, `paid_tools`.
- Verrou strict : déclencheur `_require_premium_write()` sur les tables listées (dont **`family_tasks`, `family_task_events`, `care_requests`, `care_shifts`, `family_events`, `shopping_lists`, `shopping_items`**). Interrupteur en production : `strict = false` (`20261110000100`).
- `_premium_of(user)` : Premium propre ou partagé entre `owner/coparent` uniquement — **jamais pour `caregiver`** (`20261105000100_subscription_v2.sql` l. 91–106).
- **Limites** : identifiants `aufildenous_*` / `AU_FIL_DE_NOUS_*` (REPRIS) ; Premium Famille dans une branche non intégrée ; conflit Premium strict × invité professionnel (voir Synthèse 6).

## 18. Animations — VÉRIFIÉ

- API `Animated` (pilote natif) dans 56 fichiers `.tsx` ; kits internes `src/components/Motion.tsx`, `MotionKit.tsx`, `src/features/motionViz.tsx` (rubans 24 h, relais) ; Reduce Motion pris en compte (`ThemeProvider.tsx`, `LaunchIntro.tsx`, test `motionSystem.test.tsx`).
- **Limites** : 0 Reanimated / Skia ; pas de transitions partagées.

## 19. Tests — VÉRIFIÉ / REPRIS

- SQL/RLS : 69 fichiers `supabase/tests/sql` (dont `10_security`, `20_family_community_account` 52 assertions, `40_family_load`, `41_family_calendar`, `44_relay_notifications`, `65_security_audit`, `66_membership_oracles`, `90_premium_strict`, `92_audit_acces`). **Réexécuté ici** : voir résultat ci-dessous.
- Jest : 130 fichiers dans `src/__tests__` (VÉRIFIÉ, `ls`) ; 129 suites / 1 436 tests réussis (REPRIS). Exemples pertinents : `offlineQueue.test.ts`, `autoNotifs.test.ts`, `doneNotifications.test.ts`, `medNotifsOffline.test.ts`, `homiToolMatrix.test.ts`.
- E2E : 51 fichiers dans `e2e/` (Playwright web, Python) NON exécutés ; aucun test sur appareil ni Maestro.
- Fonctions Deno : `supabase/functions/_tests/` (NON exécutés ici).

Résultat SQL de cette session (`PGPORT_TEST=54377 bash supabase/tests/run-local.sh`, PostgreSQL 16, 98 migrations appliquées) : **1 525 réussis, 0 échoué**, code de sortie 0. VÉRIFIÉ.

## 20. Synchronisation, hors ligne, temps réel — VÉRIFIÉ

- **Cache persistant** : `PersistQueryClientProvider` + `createAsyncStoragePersister` (clé `toietmoi.cache.v1`, `src/app/_layout.tsx` l. 64), données sensibles exclues (`PRIVATE_KEYS`).
- **File hors ligne** (`src/lib/offline.ts`) : `insertOrQueue`, `enqueue`, `flushQueue`, `retryConflict`, `discardConflict` ; envoi en `upsert … onConflict client_id|id, ignoreDuplicates` → **idempotent** ; erreurs passagères gardées dans l'ordre, refus serveur → « conflits » visibles (`settings/sync.tsx`), jamais supprimés en silence ; `premium_required` reconnu. Utilisée par ≈ 15 écrans de suivi (cycle, humeur, enfant, dents…).
- **Temps réel** : `useRealtimeSync` (`src/lib/sync.ts`) abonné aux 15 tables foyer + `notifications` (publication `20261019001000_realtime_sync.sql`), invalidation React Query regroupée (400 ms) ; focus/réseau via `focusManager`/`onlineManager`.
- **Limites** : (a) la file ne gère **que des insertions** — les mises à jour (cocher une tâche, accepter une demande, cocher un article) échouent hors ligne ; (b) **aucune détection de conflit d'édition** (pas de colonne version, `backend.update` = dernier qui écrit gagne) ; (c) `family_tasks`, `care_requests`, `shopping_items` sans `client_id` → pas d'idempotence sur ces flux ; (d) Realtime absent pour `shopping_items`, `shopping_lists`, `custody_*`, `house_notes`, `family_domains`, `documents` ; (e) déconnexion d'un membre retiré : RLS bloque les lectures suivantes, mais le cache persistant local conserve les données déjà lues (SUPPOSÉ : aucune purge ciblée trouvée hors `localWipe.ts` à la déconnexion).

---

## Risques majeurs (classés)

1. **Premium strict × nounou** : un `caregiver` ne peut rien écrire si `strict = true`. À régler avant tout espace professionnel (exemption par rôle ou Premium du foyer pour les invités).
2. **Granularité des droits** : modèle « domaine × foyer » insuffisant pour « pas d'accès aux autres enfants / documents non partagés ». Exige une table de portée (membre × enfant, membre × document) et la réécriture de `can_access_household` pour les tables portant `child_id` — touche ≈ 30 politiques et leurs tests.
3. **Hors ligne en écriture** limité aux insertions ; les missions, courses et validations d'heures demandent des mises à jour hors ligne + versionnage + résolution de conflits.
4. **Absence de journal d'audit générique** : seul `family_task_events` historise. Pointage d'heures, contrats et documents exigent un audit inviolable.
5. **Couplages par déclencheurs** : chaque synchronisation inter-modules ajoutée en dur (ex. demande → tâche) ; à 13 synchronisations visées, risque de cascades et de récursion (`pg_trigger_depth` déjà utilisé comme garde-fou dans le verrou Premium).
6. **Héritage AFDN** : identifiants RevenueCat, clés de stockage `toietmoi.*`, textes serveur (REPRIS `AUDIT_SOURCE.md` § 1).

## Non vérifié

- Comportement réel sur appareil (push, notifications interactives, achats, Realtime sous réseau instable).
- Contenu des branches `source/v6-*` (non présentes dans ce dépôt local : `git branch -a` ne liste que `main` et `homi/fondations`).
- `calendar_feed_data` (contenu exact du flux .ics) et fonctions `document-*`, `delete-account` lues en surface seulement.
- E2E Playwright, tests Deno, Jest (non relancés ici).
