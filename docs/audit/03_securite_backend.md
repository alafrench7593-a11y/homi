# Audit n°3 — Sécurité backend et permissions

Établi le 16/11/2026 sur `homi/fondations` (≥ `8c2ef14`). Périmètre : Postgres + RLS (`supabase/migrations`, 112 migrations après correctif), stockage, Realtime, fonctions Deno (`supabase/functions`).
Correctif : `supabase/migrations/20261117000100_audit_securite_backend.sql`.
Tests : `supabase/tests/sql/98x_audit_securite_failles.sql` (reproductions S1–S9, rouges avant le correctif) et `supabase/tests/sql/98z_securite_generique.sql` (vérifications génériques, exécutées après tous les autres fichiers).

## 1. Méthode et identités

Postgres 16 éphémère (émulation `supabase_shim.sql`), toutes les migrations + `seed.sql` + les 70 fichiers de tests existants (pour peupler presque toutes les tables avec des dizaines de foyers), puis requêtes croisées sous ces identités :

| Identité | Rôle Postgres | Particularité |
|---|---|---|
| Propriétaire du foyer A | `authenticated` | foyer créé à l'inscription + foyer de test |
| Co-parent complet / co-parent limité au quotidien | `authenticated` | `can_view` / `can_edit` restreints |
| Nounou (`caregiver`) | `authenticated` | `child_scope` = un seul enfant, `pregnancy_access` faux, documents non partagés |
| Membre révoqué | `authenticated` | ligne `household_members` supprimée, jeton encore valide |
| Autre foyer | `authenticated` | propriétaire d'un foyer neuf, aucun lien |
| Visiteur sans compte | `anon` | — |
| `service_role` | — | jamais utilisé côté application (aucune clé dans `src/`, `app.json`, `eas.json`) |

## 2. Inventaire

| Élément | Nombre | Résultat |
|---|---|---|
| Tables publiques | 195 | RLS activée sur **toutes** (test « catalogue ») |
| Tables à `household_id` / `user_id` | 141 | lecture, modification, effacement et insertion croisés automatiques pour 4 identités (test générique B) |
| Tables sans foyer ni personne (catalogues, communauté) | 54 | un compte ordinaire ne modifie/efface aucune ligne d'autrui (test générique D) |
| Politiques RLS `public` / `storage` | 519 / 18 | aucune écriture permissive `true`, aucune écriture ouverte à `anon` |
| Fonctions `public` / dont `security definer` | 304 / 258 | `search_path` fixé partout ; 24 exécutables par `anon` avant correctif, 6 après (S9) |
| Vues | 2 (`forum_feed`, `comment_feed`) | `security_barrier`, propriétaire (anonymat des publications) : filtre explicite `auth.uid() is not null`, groupes, blocages ; illisibles par `anon` |
| Espaces de stockage | 6 | aucun public (liens signés), aucune politique UPDATE (pas de remplacement de fichier), lecture des documents = relecture de `documents` sous RLS |
| Publication Realtime | 19 tables | toutes sous RLS et rattachées à un foyer ou une personne |
| Fonctions Deno | 17 | revue de code (voir § 5) |

## 3. Failles confirmées

| # | Gravité | Sujet | État |
|---|---|---|---|
| S1 | **Critique** | Export RGPD : la nounou / un co-parent limité exporte tout le foyer | Corrigé |
| S2 | **Critique** | Inscription forcée de n'importe quel compte dans un foyer | Corrigé |
| S3 | Haute | Flux d'agenda externe sans périmètre d'enfants ni de grossesse | Corrigé |
| S4 | Haute | Porteuse d'une grossesse modifiable par un co-parent | Corrigé |
| S5 | Haute | Auteur d'une tâche / mission falsifiable → mission détournée | Corrigé |
| S6 | Moyenne | Déposant d'un document modifiable | Corrigé |
| S7 | Basse | Auteurs falsifiables sur ~40 tables de saisie du foyer | Corrigé |
| S8 | Basse | `create_mission` rejouée révèle une mission invisible | Corrigé |
| S9 | Basse | 18 fonctions `security definer` exécutables sans compte sans nécessité | Corrigé (6 conservées) |
| N1 | Basse | Realtime : événements DELETE (clé primaire seule) non filtrés par la RLS | Non corrigé (limite Supabase) |
| N2 | Basse | Nounou : lit les lignes `household_members` des autres professionnels du foyer (identifiant, rôle, droits) | Non corrigé (décision produit) |

### S1 — Export RGPD hors droits (critique)
- **Reproduction** : nounou du foyer (un seul enfant confié, grossesse fermée) → `select public.export_my_data()`.
- **Attendu** : uniquement ce qu'elle peut lire (enfant confié, saisies de garde, ses propres données).
- **Observé** : prénom et suivi de l'enfant **non confié** (biberons…), titres et métadonnées des documents **non partagés**, grossesse fermée, rendez-vous santé, tâches et événements de tout le foyer. Un co-parent limité au quotidien exportait enfants, documents, rendez-vous et organisation.
- **Cause** : `export_my_data()` et ses 29 versions emboîtées sont `security definer` et recopient les tables par `household_id`, sans domaine, sans `child_scope`, sans `document_shares` ni `pregnancy_access`.
- **Correction** : l'export brut devient `_export_my_data_raw()` (appel direct refusé : réglage `homi.export_filter` posé seulement par l'enveloppe) ; `export_my_data()` devient `security invoker` : elle calcule sous la RLS de la personne la liste des lignes de foyer lisibles et retire (`_export_prune`) toute ligne `id + household_id` non lisible, sauf si la personne en est l'autrice (`user_id`, `created_by`, `uploaded_by`, `actor_id`…). Toute table future est couverte sans rien écrire.
- **Tests** : 98x S1 (nounou, co-parent limité, propriétaire inchangée, brut non appelable) ; 98z E (générique : export ⊆ lignes lisibles, pour 4 profils).

### S2 — Inscription forcée d'un compte (critique)
- **Reproduction** : propriétaire → `update household_members set user_id = '<compte visé>' where user_id = '<un de ses membres>'`. L'identifiant d'un compte est lisible par tout compte connecté (`community_profiles.user_id`).
- **Observé** : le compte visé devient membre sans invitation : son prénom et sa photo de profil deviennent lisibles (`household_member_names`, politique `profile photos read` via `shares_household_with`), il reçoit missions et notifications, et son Premium peut être partagé à la propriétaire (`_premium_partner_of`, règle b).
- **Cause** : `members_owner_update` ne protège que le rôle ; `user_id`, `household_id`, `joined_at` restaient modifiables.
- **Correction** : déclencheur `household_members_identity_guard` (refus pour toute écriture directe d'un client ; les fonctions serveur ne modifient pas ces colonnes). L'application ne modifie que `can_view` / `can_edit`.
- **Tests** : 98x S2.

### S3 — Flux d'agenda d'une nounou (haute)
- **Reproduction** : nounou → `create_calendar_feed(foyer)`, puis la fonction `calendar-feed` (ici `calendar_feed_data(jeton)` côté serveur).
- **Observé** : titres des tâches, événements et rendez-vous de l'enfant non confié, et rendez-vous de grossesse alors que `pregnancy_access` est faux.
- **Cause** : `calendar_feed_data` (`security definer`) ne vérifiait que le domaine (`can_access_household`).
- **Correction** : filtres `can_access_child(child_id)` (événements, rendez-vous, tâches) et `can_access_pregnancy(pregnancy_id)` (rendez-vous).
- **Tests** : 98x S3 (nounou filtrée, propriétaire inchangée).

### S4 — Porteuse de la grossesse (haute)
- **Reproduction** : co-parent avec accès grossesse → `update pregnancies set carrier_user_id = '<nounou>'`.
- **Observé** : la nounou voit la grossesse (`_row_pregnancy_access` : porteuse = soi) sans l'accord explicite de la propriétaire (contournement de `20261114000100_grossesse_nounou_fermee`) ; la vraie porteuse (co-parent sans `pregnancy_access`) perd l'accès à sa propre grossesse. Même chose à la création.
- **Correction** : `pregnancies_carrier_guard` : chacun peut se désigner soi-même ; seule la propriétaire désigne un autre **membre** ; changer une porteuse existante = propriétaire ou porteuse.
- **Tests** : 98x S4.

### S5 — Mission détournée par son destinataire (haute)
- **Reproduction** : destinataire → `update family_tasks set created_by = auth.uid() where id = <mission>` puis `mission_respond(<mission>, 'cancel')`.
- **Observé** : la mission est annulée par son destinataire (règle « seul le créateur annule / réattribue / modifie » contournée) ; à la création, `created_by` d'un autre membre était accepté (« demandé par » usurpé, notifications des réponses détournées).
- **Cause** : `family_tasks_mission_guard` ne compare pas `created_by` ; aucune garde sur l'auteur.
- **Correction** : déclencheur générique `_keep_author` (security invoker) : pour une écriture **directe** d'un client (`current_user = authenticated`), l'auteur vaut la personne connectée à la création et ne change plus ensuite ; le code serveur (`security definer`, service, occurrence suivante d'une tâche récurrente) garde la main.
- **Tests** : 98x S5.

### S6 — Déposant d'un document (moyenne)
- **Reproduction** : propriétaire → `update documents set uploaded_by = auth.uid(), private_to_uploader = true where id = <document non privé d'un co-parent>`.
- **Observé** : le document devient privé à la propriétaire, invisible pour son vrai déposant ; `document-read` / `document-extract` ne demandent plus l'accord « lecture automatique » du vrai déposant (contrôle fondé sur `uploaded_by`).
- **Correction** : `_keep_author('uploaded_by')` ; la combinaison ci-dessus est désormais refusée par la RLS existante.
- **Tests** : 98x S6.

### S7 — Auteurs des saisies (basse)
`created_by` / `logged_by` / `done_by` (routines) modifiables sur ~40 tables (biberons, traitements donnés, vaccins, garde…) : traçabilité faussable entre membres. Corrigé par `_keep_author` sur toute table à `household_id` portant ces colonnes ; test générique 98x S7.

### S8 — Rejeu de `create_mission` (basse)
Un `client_id` déjà utilisé renvoyait la ligne complète (security definer) même pour une mission d'un enfant non confié. Il faut connaître l'uuid (aléatoire, ou dérivé d'un stock invisible) : exploitation peu probable. Rejeu désormais refusé si l'enfant n'est pas accessible. Test 98x S8.

### S9 — Fonctions exécutables par `anon` (basse, défense en profondeur)
18 fonctions `security definer` (dont `admin_stats`, `moderate`, `accept_household_invitation`, `is_household_member`…) restaient exécutables sans compte (privilèges par défaut de Supabase). Aucune n'était exploitable (contrôle interne de `auth.uid()` / du rôle), mais une future fonction sans contrôle l'aurait été. Retrait de `anon`/`PUBLIC` sauf `has_role`, `has_premium` (politiques publiques des articles, vidéos, ressources d'urgence), `premium_strict`, `assistant_paid`, `premium_article_teasers`, `is_blocked_between` (répond « faux » sans compte, contrat du test 66). Test 98x S9 : toute nouvelle fonction exposée à `anon` doit être ajoutée explicitement à la liste.

### Non corrigé
- **N1 (basse)** : Supabase Realtime ne peut pas appliquer la RLS aux événements DELETE ; un abonné reçoit la clé primaire (uuid) des lignes supprimées des 19 tables publiées, sans contenu. Acceptable ; à défaut, retirer les DELETE de la publication (`publish = 'insert, update'`) si l'app n'en a pas besoin.
- **N2 (basse)** : `members_select` laisse une nounou lire les lignes `household_members` des autres professionnels (identifiant, rôle, droits) alors que `household_member_names` les lui masque. À trancher côté produit.

## 4. Vérifié sans faille

Rejeu `idempotency_key` / `client_id` (97, 98, 98m, 98s), transitions de missions côté serveur (hors S5), stocks (`stock_restock`, `stock_validate_purchase`, `merge_shopping_items` : appartenance + domaine `lists` + périmètre d'enfant), journal d'audit en ajout seul (y compris serveur, `TRUNCATE`), événements non émissibles par un client, prénoms des membres (5 colonnes), partages de documents, `update_if_version` (invoker), stockage (lecture des fichiers = relecture de la ligne sous RLS ; chemins liés au foyer, immuables ; un ex-membre ne peut plus effacer ses anciens fichiers), vues de la communauté.

## 5. Fonctions Deno (revue de code ; Deno absent de l'environnement : ni `deno check` ni `deno test`)

| Point | Constat |
|---|---|
| JWT | `verify_jwt = true` (config.toml) pour toutes les fonctions appelées par l'app, plus `requireUser` (`auth.getUser`) ; `storage-cleanup` non déclarée → JWT par défaut + secret |
| Sans JWT | `revenuecat-webhook` (Bearer secret, comparaison à temps constant, refus si secret absent), `send-push` (`x-webhook-secret`, refus si absent), `auth-email` (signature Standard Webhooks HMAC + horodatage ± 5 min), `calendar-feed` (jeton 256 bits, empreinte SHA-256, 60 req/h), `assistant-demo` (articles publiés seulement, limites par appareil/IP/jour) |
| CORS | `withCors` : origine renvoyée seulement si listée dans `ALLOWED_ORIGINS` (défaut : serveurs Expo locaux), jamais de credentials |
| `service_role` | utilisé après vérification : documents relus d'abord **sous RLS** de la personne (`document-read`, `document-extract`) ; conversation de l'assistant vérifiée sous RLS avant écriture ; quotas, consentements, caches, abonnements (serveur) |
| Entrées | uuid validés (`document-extract`, `assistant`), tailles plafonnées (10 Mo), types MIME en liste blanche, `confirm: "SUPPRIMER"` |

## 6. Ce qui ne se vérifie qu'en production

1. Supabase réel : `auth.role()` / `auth.uid()` lus du JWT (l'émulation lit des réglages de session), privilèges par défaut du projet, politiques et hachage du **service Storage** (l'émulation n'a que `storage.objects`), URL signées et leur durée.
2. Realtime : filtrage RLS effectif des abonnements `postgres_changes` (N1).
3. Fonctions Deno : `deno check`, secrets présents (`PUSH_WEBHOOK_SECRET`, `REVENUECAT_WEBHOOK_SECRET`, `SEND_EMAIL_HOOK_SECRET`, `STORAGE_CLEANUP_SECRET`, `ALLOWED_ORIGINS`), `verify_jwt` appliqué au déploiement.
4. Migration `20261117000100` : à appliquer sur une copie de la base de production avant déploiement (rien n'a été déployé).

## 7. Résultats des tests (16/11/2026)

- SQL (`PGPORT_TEST=54403 bash supabase/tests/run-local.sh`) : **1 906 réussis, 0 échec** (référence avant l'audit : 1 844 / 0). Avant le correctif : 19 vérifications rouges dans 98x, 2 dans 98z (export).
- Jest : 143 suites, 1 667 tests verts ; `tsc --noEmit` : 0 erreur (aucun fichier TypeScript modifié).
