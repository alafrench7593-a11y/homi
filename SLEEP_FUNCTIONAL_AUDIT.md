# Audit fonctionnel — Sommeil de l'enfant (V6, agent B « sommeil », 13/11/2026)

Périmètre : sommeil de l'ENFANT. Le sommeil du parent (`src/app/me/sleep.tsx`) n'est pas concerné.

État relevé AVANT tout développement, sur la branche `premium-experience` (60275d7), puis ce qui a été fait.

| # | Besoin | État initial | Où (existant) | Ce qui a été fait |
|---|--------|--------------|---------------|-------------------|
| 1 | Chronomètre (horodatages réels, persistant, un seul enregistrement par session) | **existe** | `useSleepActions` (`src/lib/data/hooks-sleepPlanner.ts`) : insertion `sleeps` avec `started_at` réel, refus d'un 2e sommeil ouvert (« already »), index SQL `sleeps_one_open_per_child` ; état « Endormi depuis 35 min » recalculé toutes les 30 s (`planLines`) | Ajout d'un chronomètre à la seconde (h:mm:ss) en tête de l'historique, recalculé depuis l'heure enregistrée (`runningSleep`, `stopwatch`), signalement d'un éventuel sommeil ouvert en trop. Rien de reconstruit. |
| 2 | Journal des réveils de nuit | **partiel** | `wake_events` (réveil / rendormi / durée) enregistrés par `nightWaking` / `backToSleep` ; seul le **nombre** de réveils était affiché | Chronologie de chaque nuit : heure de chaque réveil, rendormissement, durée, réveils notés sans heure (`nightHistory`). |
| 3 | Siestes distinctes des nuits | **existe** | `sleeps.kind` (`nap`/`night`), `sleepKind`, choix sieste/nuit dans `track/[kind].tsx` et `SleepEditSheet` | Onglet « Siestes » séparé dans l'historique (`napHistory`, `splitSleeps`). |
| 4 | Historique des nuits | **partiel** | Résumé de la dernière nuit (`lastNightReport`), lignes des 7 derniers jours (onglet Tendances, Premium) | Liste des nuits sur 7/14/30 jours, dépliable, avec lien « Modifier les horaires ». |
| 5 | Graphiques 7 / 14 / 30 jours | **partiel** | `BarChart` 7/14 jours (onglet Tendances, Premium), animation SVG de hauteur ; pas de 30 jours | Nouveau `SleepBars` (nuit + siestes empilées, barres simples) 7/14/30 jours, apparition `Animated` translateY + opacity (pilote natif), immédiate avec « Réduire les animations », alternative textuelle complète (`SleepBarsText`) + libellé d'accessibilité ; moyennes des seuls jours notés, aucune note de sommeil. |
| 6 | Routines du coucher | **existe** | `BedtimeRoutine` (table `bedtime_routines`, Premium) dans l'onglet Profil de `sleep/[childId].tsx` ; routines enfant `family/kid-routines` | Réutilisées : lien depuis l'historique (onglet Profil). |
| 7 | Relais Papa/Maman | **existe** | `src/app/family/nights.tsx` (care_shifts), non relié aux écrans de sommeil | Relié : liens depuis l'écran Sommeil (Aujourd'hui) et l'historique. Rien refait. |
| 8 | Journal des difficultés | **partiel** | Liste non datée `sleep_profiles.difficulties` ; guide « La nuit est difficile » (`sleep/difficult`) non enregistré | Journal daté (table `sleep_notes`, sorte `difficulty`, étiquettes = liste existante + « Autre », texte libre). |
| 9 | Résumé pour le pédiatre (imprimable / exportable) | **partiel** | `proSheet` (texte copiable/partageable, onglet Sécurité) : moyennes 7 jours seulement | `pediatricSummary` : période 7/14/30 jours, nuits détaillées (réveils, repas notés), siestes, journal, question de la famille ; export en fichier HTML imprimable via `exportTextFile` existant + copie/partage du texte. `proSheet` conservé. |
| 10 | Mode nuit lisible | **partiel** | Thème `night` (`tokens.ts`), écrans « Aide pour cette nuit » / « La nuit est difficile » déjà en bleu nuit ; liens de sources en `palette.lavenderInk` (#7A5CE0) peu lisibles sur fond sombre | Nouvel écran entièrement sur les couleurs du thème ; liens de sources de l'onglet Sécurité en `colors.lavender` en thème sombre/nuit. Contrôle visuel : voir rapport. |
| 11 | Lien avec les repas | **partiel** | Nombre et heure du dernier repas de nuit (`lastNightReport`, `tonightInfo`), biberons + tétées seulement | Biberons, tétées ET repas notés affichés sur la chronologie de chaque nuit, avec la mention « pour information, sans aucune conclusion ». |
| 12 | Jumeaux / plusieurs enfants | **partiel** | Tout est filtré par `child_id` (`ownSleeps`) ; sélecteur dans `track/[kind]` et `sleep/tonight` ; **pas** de sélecteur sur `sleep/[childId]` | Sélecteur d'enfant (puces) sur `sleep/[childId]` et sur l'historique, ligne « Enfant concerné : … » ; journal filtré par enfant côté client ET côté serveur (RLS `can_access_child`). |
| 13 | Notes sur les changements de routine | **absent** | seulement `sleep_profiles.routine_note` (texte unique, non daté) | `sleep_notes` sorte `routine_change`, datée (aujourd'hui / hier). |
| 14 | Notifications facultatives | **existe** | Onglet « Notifications » (`notify.enabled = false` par défaut, plage silencieuse, jours, arrêt complet), rappel de routine facultatif | Réutilisées : lien depuis l'historique. Aucune nouvelle notification. |
| 15 | Informations validées sur le sommeil sûr | **existe** | `src/content/safeSleep.ts` (Santé.fr, ameli.fr, datés), `SafeSleepCard`, bibliothèque `cat=sommeil` | Réutilisées : liens « Couchage en sécurité » et « Articles sur le sommeil ». Aucun conseil nouveau écrit. |

## Garde-fous
- Aucune note de sommeil, aucune comparaison à une norme ou entre enfants, aucune promesse (« fera ses nuits »), aucune pratique recommandée, aucun diagnostic. Bandeau d'orientation : pédiatre, médecin, sage-femme, 15, 112.
- Repas : affichés seulement, jamais de lien de cause tiré ; aucune quantité déduite d'une durée de tétée.
- Un jour sans saisie n'est jamais compté comme « zéro » dans les moyennes.

## Fichiers
- Domaine : `src/lib/domain/sleepJournal.ts` ; données : `src/lib/data/hooks-sleepJournal.ts`
- Écran : `src/app/sleep/history/[childId].tsx` ; graphique : `src/features/sleepBars.tsx`
- Modifiés : `src/app/sleep/[childId].tsx` (liens, sélecteur d'enfant, contraste), `src/lib/backend/demo.ts`, `src/lib/backend/demoSample.ts`
- Migration : `supabase/migrations/20261113000200_sommeil.sql` ; test SQL : `supabase/tests/sql/95_sommeil_journal.sql`
- Tests : `src/__tests__/sleepJournal.test.ts`
- Traductions : `src/i18n/{fr,en,es,de,it}/sleepJournal.ts`
