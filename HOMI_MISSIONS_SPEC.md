# HOMI — Missions familiales (phase 4)

Établi le 14/11/2026. Migrations `20261114000200_missions_types.sql`, `20261114000300_missions.sql`.
Tests : SQL `supabase/tests/sql/98m_missions.sql` (75 vérifications) · Jest `src/__tests__/missions.test.ts` (17) · E2E `e2e/missions_scenario_a.py` (22 contrôles, scénario A).
Compagnons : `HOMI_RESPONSIBILITIES.md`, `HOMI_COUPLE_MISSIONS.md`, `HOMI_SYNC_ARCHITECTURE.md` § 2 bis, `HOMI_NOTIFICATION_RULES.md` § 7.

## 1. Décision : une mission EST une `family_task` enrichie

Pas de nouvelle table. Raisons : une seule source de vérité pour l'agenda (tâches datées déjà lues par `calendar.tsx` et le flux iCalendar), l'historique (`family_task_events`), la récurrence, le hors ligne (`client_id`, `version`, `update_if_version`), le journal d'audit, le bus d'événements et l'export RGPD. Une tâche ordinaire a `mission_state = NULL` ; une mission a un état fin. `status` (todo/done/cancelled, lu par tous les écrans existants) reste cohérent par contrainte (`family_tasks_mission_status_ck`).

`care_requests` (« Peux-tu prendre cette tâche ? ») reste en place pour les demandes de relais ; une mission n'en crée pas (les deux modèles ne sont plus en concurrence : la réponse d'une mission vit sur la tâche).

## 2. Champs

| Spécification | Colonne | Remarque |
|---|---|---|
| titre, description | `title` (≤ 120), `notes` (≤ 1000) | existants |
| responsable | `assignee_id` | NULL = mission « à prendre » (premier qui accepte) |
| catégorie | `category` | + `pets`, `childcare`, `health` |
| priorité | `priority` | libellés neutres : « Quand c'est possible / Normale / Importante » |
| date, heure | `due_at`, `all_day` | « dans la journée » si pas d'heure |
| récurrence | `recurrence` | occurrence suivante = mission « À accepter », sans notification |
| photo / pièce jointe | `document_id` → `documents` | stockage existant (documents du foyer) ; visible seulement sous les droits du document (nounou : partage explicite) ; pas de téléversement depuis la mission (choix d'un document existant) |
| produit associé | `product_label`, `shopping_item_id` → `shopping_items` | article créé à l'acceptation, coché à la fin ; **cocher l'article termine la mission si c'est son destinataire qui coche** (15/11/2026) |
| stock réapprovisionné | `stock_id` → `household_stocks` | posé par le serveur seulement (`stock_restock`, garde `family_tasks_stock_guard`) ; l'article de la mission est relié au stock (ou au stock du même produit) |
| enfant associé | `child_id` → `children` | politique restrictive `family_tasks_child_id_scope` (périmètre nounou) |
| animal associé | `pet_id` | **colonne prévue, nullable, sans clé étrangère** : le module animaux n'existe pas ; l'écran l'annonce « bientôt » |
| foyer | `household_id` | existant |
| responsabilité | `domain_key` | déduite de la catégorie (`_mission_domain_of`) |
| réponses | `responded_at`, `last_reminded_at` | posées par le serveur |

## 3. États et transitions (serveur : `mission_respond`, miroir `src/lib/domain/missions.ts`)

| Action | Qui | Depuis | Vers |
|---|---|---|---|
| `accept` « J'accepte » | destinataire (ou n'importe qui sauf l'autrice si « à prendre ») | À accepter, Reportée | Acceptée |
| `start` « Je m'en occupe » | destinataire | À accepter, Acceptée, Reportée | En cours |
| `complete` « C'est terminé » | destinataire | À accepter, Acceptée, En cours, Reportée | Terminée |
| `decline` « Je ne peux pas » | destinataire | À accepter, Acceptée, En cours, Reportée | Refusée — **justification facultative** (≤ 300) |
| `postpone` « Je propose un autre horaire » | destinataire | idem | Reportée (nouvelle échéance, jamais passée) |
| `ask` « Besoin de précision » | destinataire | non finale | inchangé (question à l'autrice) |
| `cancel` | autrice | toute non finale + Refusée | Annulée |
| `reassign` « Proposer à quelqu'un d'autre » | autrice | À accepter, Refusée | À accepter |
| `remind` « Petit rappel » | autrice | À accepter, Acceptée, Reportée | inchangé — **1 par 24 h** |

Terminée et Annulée sont finales. La matrice complète (7 × 9) est vérifiée à l'identique en SQL et en Jest.
Rejeu (double appui, file hors ligne) : même réponse → `{status: ok, unchanged: true}`, sans nouvel historique ni événement. `p_expected_version` → `conflict` si la mission a changé entre-temps. Ce qu'une personne ne peut pas voir (autre foyer, ex-membre, enfant non confié) → `not_found`.

Garde `family_tasks_mission_guard` : aucune insertion directe d'une mission, aucun changement direct d'état / statut / destinataire (y compris via `update_if_version`) ; seule l'autrice modifie le contenu. Les anciens chemins « cocher la tâche » (liste, agenda, notification locale « C'est fait ») passent par `mission_respond` pour une mission.

## 4. Historique (`family_task_events`)

Nouveaux types : `accepted`, `declined`, `started`, `question`, `reminded` (+ `done`, `cancelled`, `postponed`, `assigned` existants). **Ajout seul** : `UPDATE`/`DELETE`/`TRUNCATE` refusés même pour le serveur (exceptions : suppression de la tâche ou du foyer, anonymisation d'un compte supprimé). Historique d'une mission invisible = invisible (politique restrictive).

## 5. Réponses rapides et notifications interactives

Les 6 réponses rapides sont des boutons de l'écran Détail. `expo-notifications` gère les catégories d'actions dans ce dépôt (`setNotificationCategoryAsync`) : catégorie `mission` = « J'accepte » / « Je ne peux pas », jointe par `send-push` **uniquement** à une nouvelle mission **et** si la personne a choisi le détail sur l'écran verrouillé (`pushCategory`) ; traitée par `handleDoneResponse` → `mission_respond`. Non vérifiable ici (push réel).

## 6. Modèles neutres

`MISSION_TEMPLATES` (11) : couches taille 4, lait avant 18 h, courses de la semaine, sac de crèche, récupérer les enfants, sortir le chien, croquettes, lessive, poubelles, vérifier un document, prendre un rendez-vous. Garde-fou `isNeutralText` (5 langues : pas de « encore », « oublié », « toujours », « il faut », « urgent », « ! »…) testé sur les modèles et les notifications.

## 7. Écrans

| Route | Rôle |
|---|---|
| `/family/missions` | Reçues / Envoyées (onglets), « Nouvelle mission », « Responsabilités » |
| `/family/missions/new` (`?template=`) | Création : modèles, destinataire (ou responsable du domaine), catégorie, date / heure, priorité, répétition, produit, enfant, pièce jointe, précisions |
| `/family/missions/[id]` | Détail, état, liste de courses liée, réponses rapides, actions de l'autrice, historique |
| `/family/missions/responsibilities` | Les 8 responsabilités (voir `HOMI_RESPONSIBILITIES.md`) |

Détail : « Pour vous » / « Demandée par vous » quand la personne est concernée (correctif 15/11/2026 : « Vous » n'a plus de majuscule au milieu de la phrase, 5 langues) ; lien « Voir le stock » et mention « coché par … » pour une mission de réapprovisionnement.

Points d'entrée : onglet Famille (accès direct « Missions », `HUB_ENTRIES.family`), ajout rapide du Dock (« Nouvelle mission »), recherche d'outils (outils `family_missions` et `family_responsibilities`, catalogue porté à 150+ outils, garde-fou `homiToolMatrix` respecté). i18n 5 langues (`src/i18n/*/missions.ts`), DA : `Card`/`Chip`/`Segmented`/`Banner` de `ui.tsx`, `LiftCard`, `Cascade`, `DetailEnter` de `src/motion`.

## 8. Démonstration

`src/lib/backend/demoMissions.ts` émule `create_mission`, `mission_respond` et le consommateur (mêmes règles, mêmes textes). Démo seulement : `demo_mission_partner` ajoute « Sam » (co-parent) au foyer et `demo_switch_person` bascule la session pour essayer les deux côtés sur un appareil (bandeau « Voir comme … »). Le Premium d'une propriétaire abonnée couvre désormais son co-parent dans la démo, comme `_premium_of`.

## 9. Limites

- Création non mise en file hors ligne (RPC directe, comme les demandes d'aide) ; un nouvel essai réutilise le même `client_id`.
- ~~Sens inverse « article coché → mission terminée »~~ : **branché le 15/11/2026** (`shopping.item_checked`, voir `HOMI_SHOPPING_STOCKS_SPEC.md` § 7) — seulement si c'est le destinataire qui coche ; sinon proposition, jamais de transition forcée ; anti-boucle vérifié.
- ~~Stock~~ : **branché le 15/11/2026** — une mission de réapprovisionnement naît d'une suggestion confirmée (`stock_restock`), jamais automatiquement.
- Pas de téléversement de photo depuis la mission (choix d'un document existant).
- Passage planifié `process_household_events` non déployé (pg_cron / fonction planifiée) : l'appel immédiat suffit tant qu'aucune erreur ne survient.
