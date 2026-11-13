# HOMI — Revue de sécurité du foyer (permissions, rôles, enfants, documents)

Établi le 13/11/2026. Migrations : `20261113000100_caregiver_premium.sql` à `20261113000700_fondations_export.sql`.
Tests SQL : `95_foyer_caregiver_droits.sql`, `96_journal_audit.sql`, `97_evenements_foyer.sql`, `98_hors_ligne_notifications.sql` (positifs et négatifs) + tests génériques existants (`92_audit_acces.sql` : toute nouvelle table avec `household_id`/`user_id` est vérifiée automatiquement contre un autre foyer, un visiteur sans compte et un compte supprimé).

## 1. Modèle de permissions

Chaque accès est le **ET** de couches indépendantes, toutes appliquées par la RLS Postgres :

1. **Appartenance au foyer** : une ligne `household_members (household_id, user_id)`. Pas de ligne = rien.
2. **Domaine** (`can_view[]` / `can_edit[]`) : `daily`, `health`, `documents`, `pregnancy`, `lists`, `names`, `profile` — `can_access_household(foyer, domaine, écriture)`. La propriétaire a tout.
3. **Enfant** (politiques RESTRICTIVES `<table>_child_id_scope`, `children_scope`) : `_member_child_allowed(rôle, child_scope, enfant)` — une seule règle pour `can_access_child()` et `_row_child_access()`.
4. **Document** (politique RESTRICTIVE `documents_caregiver_share`) : une nounou ne voit que ses dépôts et les documents partagés explicitement (`document_shares`).
5. **Règles propres à une table** : documents privés au déposant, rendez-vous privés, bilan du couple réservé owner/coparent, réponses aux demandes réservées au destinataire, etc. (inchangées).
6. **Abonnement** (Premium strict, actuellement désactivé en production) : ne décide que de la possibilité d'**écrire**, jamais de lire ; jamais pour une saisie de garde par une nounou active (§ 3).

## 2. Rôles

| Rôle | Enfants sans choix (`child_scope` NULL) | Documents | Journal d'audit / événements | Premium |
|---|---|---|---|---|
| `owner` (propriétaire) | tous (toujours) | tous (sauf privés d'un autre) | tout lire | le sien, partagé avec un co-parent |
| `coparent` | **tous** (inchangé) | domaine `documents` | lire selon ses domaines | partagé par la propriétaire abonnée (`_premium_of`) |
| `caregiver` (nounou, pro invité) | **AUCUN** tant que la famille n'a pas choisi | **seulement** partagés un par un (+ ses dépôts) ; papiers de la famille invisibles | jamais | jamais accordé ; saisies de garde exemptées |

- Préréglage d'invitation « nounou » (`src/app/settings/family.tsx`) : voir `daily` + `lists`, modifier `daily` ; **plus la santé** ; aucun enfant ni grossesse coché ; l'invitation exige au moins un enfant.
- **Informations critiques de sécurité** : une nounou voit la fiche de base des enfants qui lui sont confiés (prénom, âge, allergies déclarées, habitudes) même sans le domaine `profile` (`children_caregiver_sel`), et `child_safety_card(enfant)` lui donne allergies, traitements en cours (nom), contacts et façons d'apaiser — sans ouvrir tout le domaine `health`. Refusée pour un enfant non confié, d'un autre foyer, ou après révocation.
- Changement de rôle co-parent → nounou : le périmètre « tous » ne suit pas (remis à vide par `household_members_role_guard`).
- Migration sans perte : les nounous et invitations « nounou » existantes avec `child_scope` NULL ont reçu la liste explicite des enfants actuels de leur foyer (même accès qu'avant, mais un enfant ajouté plus tard ne leur est plus ouvert automatiquement).

## 3. Nounou et Premium strict

- `_require_premium_write()` : une saisie sur une ligne dont `household_id` est un foyer où la personne est `caregiver` passe, **quel que soit l'abonnement** (la famille paie, la nounou ne paie jamais pour travailler). La RLS décide toujours si elle a le droit d'écrire (domaine, enfant).
- Ne change pas : `_premium_of()` ne donne jamais le Premium à une nounou (ses données personnelles, la communauté, ses outils restent soumis à l'offre) ; un co-parent sans Premium reste bloqué en mode strict.
- `my_access()` renvoie `caregiver: true` ; l'application ouvre alors les écrans de garde (`CAREGIVER_ROUTES`, `src/lib/premium/access.ts`) sans ouvrir le reste.
- Non couvert par l'exemption (fonctions Premium du foyer, à la charge de la famille) : `require_premium` sur `meal_plans`, `bedtime_routines`, `sleep_feedback`, et les quotas de la version gratuite (`documents_count`, `children_count`, découvertes alimentaires).

## 4. Révocation et départ du foyer

| Action | Effet serveur (immédiat, testé) |
|---|---|
| Retrait d'un membre par la propriétaire (`delete household_members`) | Plus aucune lecture ni écriture (enfants, suivi, documents, tâches, courses, journal, événements) ; ses partages de documents effacés (`household_members_cleanup`) ; plus d'exemption Premium ; `child_safety_card` refusée ; `update_if_version` → `not_found` ; retrait journalisé |
| Départ volontaire (« Quitter ce foyer ») | Identique (même suppression de ligne) ; la propriétaire ne peut pas partir (existant) |
| Retrait d'un enfant du périmètre (`set_member_scope`) | Plus rien sur cet enfant à la seconde (lecture, écriture, fiche de sécurité, fichiers) ; changement journalisé |
| Suppression de compte (`delete_user_account`) | Retiré de tous les foyers ; jeton encore valide inutilisable (test générique 92) |
| Suppression du foyer | Données, journal et événements effacés (cascade) |

Pas de « suspension temporaire » d'un membre : la révocation passe par le retrait (une nouvelle invitation rétablit l'accès).

## 5. Menaces et contre-mesures

| Menace | Contre-mesure | Preuve |
|---|---|---|
| Nounou qui lit les autres enfants | Politiques restrictives par enfant sur **toutes** les tables à `child_id` (7 tables récentes ajoutées) et les tables filles (`treatment_logs`, `kid_routine_checks`, `custody_exceptions`) | 95 |
| Nounou sans choix qui voit tout | `child_scope` NULL = aucun enfant pour `caregiver` | 95 |
| Nounou qui élargit ses droits | `set_member_scope` réservé à la propriétaire ; `update household_members` sans effet (politique propriétaire) | 95, 92 |
| Nounou qui lit un document non partagé (ou son fichier) | `documents_caregiver_share` restrictive ; la lecture du stockage relit `documents` sous RLS | 95 |
| Partage d'un document à un tiers / par un tiers | `document_shares_guard` (destinataire membre du foyer, foyer recopié du document) ; partage réservé au déposant ou à la propriétaire | 95 |
| Falsification du journal | Privilèges retirés, déclencheur « ajout seul » même pour le serveur, `TRUNCATE` refusé | 96 |
| Lecture du journal par une nounou / un autre foyer / un ex-membre | `_audit_readable` (owner/coparent selon domaines) | 96 |
| Fuite de secrets via le journal | Résumés sans `token_hash`, `storage_path`, `*_hash`, `*_token`, `*_secret`, textes tronqués | 96 |
| Événement forgé par un client | Émission et consommation réservées au serveur ; table en lecture seule | 97 |
| Rejeu d'une saisie / d'un événement | `client_id` unique par foyer, `idempotency_key` unique | 97, 98 |
| Boucle entre modules | Profondeur ≤ 3, détection de cycle, statut `skipped` | 97 |
| Écrasement silencieux d'une modification | `version` + `update_if_version` (`conflict`) | 98 |
| Notification forgée « urgente » ou marquée envoyée | Aucun client n'insère de notification ; `urgent`, `pushed_at`, `deliver_after` figés pour un client | 98 |
| Détail sensible sur l'écran verrouillé | Texte générique par défaut côté serveur | Jest `pushRules` |

## 6. Ce qui reste (avant Missions / Nounou / Courses)

1. ~~Cache local après révocation~~ **Fait le 14/11/2026** : `src/lib/householdPurge.ts` purge les requêtes et la file hors ligne d'un foyer qui disparaît de la liste fraîche des appartenances (test `householdPurge.test.ts`). La RLS renvoie des listes vides (pas de 403) : c'est la disparition du foyer qui sert de signal. Limite : l'appareil doit être en ligne pour constater le retrait.
2. ~~Grossesse et nounou~~ **Fait le 14/11/2026** (`20261114000100_grossesse_nounou_fermee.sql`, test `98p_grossesse_nounou.sql`) : insertion d'un membre ou d'une invitation `caregiver` → `pregnancy_access` faux sauf accord explicite de la propriétaire (paramètre de `create_household_invitation`, recopié à l'acceptation, ou `set_member_scope`) ; co-parent → nounou referme la grossesse ; `set_member_scope(…, NULL)` ne l'ouvre plus. Co-parents inchangés ; nounous déjà membres : valeur conservée (visible et modifiable par la propriétaire).
3. **Partage de document par l'interface** : la table et les règles existent ; l'écran « Partager avec… » est à faire (agent interface), ainsi que l'écran « Journal du foyer ».
4. **Durée d'accès** : aucune date d'expiration d'un accès professionnel ; pas de rôle distinct « grand-parent ».
5. **Plusieurs foyers par nounou** : possible en base, mais pas de sélecteur de foyer dans l'app.
6. **Export RGPD** : inclut désormais réglages de notification, partages, entrées d'audit et événements dont la personne est l'auteur ; l'identifiant d'un ex-membre reste dans le journal du foyer (pseudonyme, nécessaire à la preuve) — à mentionner dans la politique de confidentialité.
7. **Fonctions Deno** : `deno check` non exécuté (Deno absent de l'environnement de travail) ; logique pure testée par Jest.
