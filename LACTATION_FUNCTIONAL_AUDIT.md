# Audit fonctionnel — allaitement, tirage, biberons (mission V6, lot A)

Audit réalisé le 13/11/2026 sur la branche `premium-experience` (commit 60275d7), AVANT tout code.
Objectif : savoir ce qui existe réellement, ce qui manque, et ce qu'on réutilise au lieu de reconstruire.

## 1. Données (Supabase)

| Table | Où | Colonnes utiles | Droits |
|---|---|---|---|
| `breastfeeds` | `20261015000200_journeys_tracking.sql` | `child_id`, `household_id` (recopié depuis l'enfant par `set_household_from_child`), `side` ∈ left/right/both, `started_at`, `ended_at` (≥ début), `note`, `client_id` unique, `created_by` | `_apply_household_policies('breastfeeds','daily')` : lecture si `daily` ∈ `can_view`, écriture si `daily` ∈ `can_edit`, propriétaire toujours ; + politique restrictive `breastfeeds_child_id_scope` (`can_access_child`, 20261021000500_premium.sql) ; + garde Premium en écriture (20261108000300) ; publiée en temps réel (20261019001000) |
| `pumpings` | idem | `at`, `amount_ml` NOT NULL (0–1000), `side` (facultatif), `note`, `client_id` | mêmes règles que `breastfeeds` |
| `bottles` | idem + `20261016000700_bottle_timers.sql` | `at`, `prepared_ml`, `consumed_ml`, `milk_type` (texte libre ≤ 80), `planned_next_ml`, `note`, `created_by` ; colonnes de biberon « en cours » ajoutées ensuite | mêmes règles |
| `bottle_timers` | `20261016000700_bottle_timers.sql` | rappel par enfant (un seul actif) | mêmes règles |

Constats :
- **Une tétée = une ligne avec un seul côté.** Rien ne relie les lignes d'une même tétée (gauche puis droite) ; aucune notion de pause.
- **Tirage** : un seul volume (`amount_ml`) et un seul côté. Pas de quantité par sein, pas de durée, pas de confort.
- **Biberon** : le type de lait est un texte libre (« Lait 2e âge »…), il n'existe pas de champ « lait maternel / préparation ».
- **Réserve de lait** : aucune table, aucun écran.
- Export RGPD : `breastfeeds`, `pumpings`, `bottles` exportés (fonction `export_my_data`, chaînée version après version) ; le test SQL `70_export_complete.sql` exige que toute nouvelle table liée au foyer y figure ; `68_fk_indexes.sql` exige un index sur chaque clé étrangère et la RLS sur toute table.

## 2. Écrans

| Écran | Ce qu'il fait réellement | Limites constatées |
|---|---|---|
| `src/app/track/[kind].tsx` (`breastfeed`) | Résumé du jour (nombre, dernière, **somme des durées**), carte « Dernier sein » (`LastSideCard`), frise du jour, chronomètre simple, saisie a posteriori (heure + durée), modification / suppression | Chronomètre en **mémoire** (`useState(Date)`) : perdu si on change d'écran ou ferme l'app ; pas de pause, pas de changement de sein (un seul côté par chrono), pas de correction de l'heure avant enregistrement ; double appui sur « Arrêter » protégé seulement par l'état `saving` |
| `src/app/track/[kind].tsx` (`pumping`) | Heure, côté (gauche/droite/les deux), quantité (Stepper, 80 ml présélectionnés), note ; édition | Pas de quantité par sein, pas de durée, pas de confort ; pas d'historique ni de graphique dédiés |
| `src/app/bottle/**`, `src/features/bottle*.tsx` | Minuteurs biberon par enfant, instrument de biberon en cours (pause/reprise), journée biberons, historique `/bottle/history`, doses (`/bottle/scoops`) | Soignés : **réutilisés tels quels** (liens) |
| `src/app/journal.tsx` | Journal unifié multi-catégories (vues jour/semaine/mois, filtres, CSV) | Tétées/tirages/biberons noyés parmi toutes les catégories ; pas de filtre « lait maternel / préparation » ; une tétée en deux seins apparaît en deux lignes |
| `src/features/tracking.tsx` | `KIND_META`, `TimePicker`, `Stepper`, `Timeline`, `describeLog` | Réutilisés |
| `src/features/child.tsx` | Tuiles rapides (biberon, tétée, couche…) vers `/track/[kind]` | Pas d'accueil « alimentation » |
| `src/app/(tabs)/track.tsx` | Post-partum : ligne « Allaitement » → `/track/breastfeed` | idem |
| Catalogue d'outils `src/lib/journeys/tools.ts` | `baby_breastfeed` → `/track/breastfeed`, `pp_feeding` (post-partum), `baby_bottle*` | Pas d'outil d'accueil alimentation |

Contenus existants réutilisables (déjà sourcés, aucun nouveau contenu médical à écrire) :
- Bibliothèque : `allaitement-crevasses-douleurs-mamelons`, `allaitement-engorgement-mastite`, `muguet-et-allaitement-soigner-maman-et-bebe`, `allaitement-debuter`, `allaitement-mixte-en-pratique`, `allaiter-ou-tirer-son-lait-reprise-du-travail-droits-organisation-conservation` (ce dernier traite aussi de la conservation : on y renvoie au lieu d'afficher des durées).
- Annuaires sourcés `DIRECTORIES` (`src/lib/domain/nearby.ts`) : réunions de soutien La Leche League, PMI (annuaire officiel), aide à domicile (Santé.fr) — en 5 langues.
- `/emergency` (numéros d'urgence, jamais derrière l'abonnement).

## 3. Ce qui manque (et sera livré)

1. Accueil « L'alimentation de mon bébé » (`/feeding?child=`) : dernière session, action principale déduite des saisies récentes, résumé du jour **sans additionner durées et volumes**, accès directs.
2. Chronomètre de tétée persistant (survit au changement d'écran et à la fermeture), pause / reprise / changement de sein, correction des heures avant enregistrement, **un seul enregistrement par session** (identifiants de lignes déterministes dérivés d'un `session_id` créé au démarrage → la file hors ligne et le serveur ignorent un renvoi).
   - Évolution de schéma : `breastfeeds.session_id` (facultatif) pour regrouper les segments d'une même tétée ; une ligne par segment (le schéma garde un seul côté par ligne, aucune donnée existante n'est touchée).
3. Tirage détaillé : `pumpings.left_ml`, `right_ml`, `duration_min`, `comfort` (facultatifs ; `amount_ml` reste le total), historique et barres 7 / 30 jours avec équivalent textuel.
4. Réserve de lait : nouvelle table `milk_stash` (même modèle de droits que `pumpings`), écran stock / ajout / utiliser / jeter / historique, **aucune date limite affichée**.
5. Historique unifié tétées + tirages + biberons par jour, filtres (dont lait maternel / autre lait d'après le type de lait saisi), ouverture des écrans d'édition existants.
6. Démo (`demo.ts`), temps réel (`sync.ts`), export RGPD, 5 langues, tests Jest + SQL + contrôle visuel.

## 4. Hors périmètre (autres lots, noté comme restant)

Jumeaux en simultané (une session par enfant est possible, mais pas deux bébés au sein dans le même chronomètre), régurgitations, sevrage, retour au travail, espace Papa.

## 5. Règles appliquées

- Aucune durée cible, aucune quantité « normale », aucune déduction de lait à partir d'une durée, aucun score.
- Aucune durée de conservation : renvoi aux recommandations des professionnels et à l'article sourcé existant.
- Le confort de tirage est une échelle en mots (pas de note chiffrée) ; « douloureux » propose les ressources d'aide et les professionnels, sans diagnostic.
