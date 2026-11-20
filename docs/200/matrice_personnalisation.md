# Matrice de personnalisation — profils A–G × 10 premiers outils

Générée par `src/__tests__/personalizationMatrix.test.ts` à partir du moteur réel (`src/lib/personalization`), date de référence 2026-11-20, langue française.
Ne pas modifier à la main : `WRITE_MATRIX=1 npx jest src/__tests__/personalizationMatrix --testPathIgnorePatterns /node_modules/`.
Colonnes : rang, outil (nom affiché), identifiant stable, raison affichée en petit sur l’accueil, règle déclarative.

## A — Femme enceinte (24 SA), en couple

| # | Outil | Identifiant | Raison affichée | Règle |
|---|---|---|---|---|
| 1 | Ma grossesse semaine par semaine | `preg_evolution` | Parce que vous êtes enceinte (24 SA) | pregnancy-mine |
| 2 | Calendrier de grossesse | `preg_calendar` | Parce que vous êtes enceinte (24 SA) | pregnancy-mine |
| 3 | Mes symptômes de grossesse | `preg_feel` | Parce que vous êtes enceinte (24 SA) | pregnancy-mine |
| 4 | Rendez-vous et examens | `appointments` | Parce que vous voulez gérer les rendez-vous | prio-appointments |
| 5 | Mouvements de bébé | `preg_moves` | Parce que vous êtes enceinte (24 SA) | pregnancy-mine |
| 6 | Agenda familial | `family_calendar` | Parce que vous partagez le quotidien à deux | partner |
| 7 | Mes questions pour le rendez-vous | `consult_questions` | Parce que vous voulez gérer les rendez-vous | prio-appointments |
| 8 | Bien manger enceinte | `preg_eat` | Parce que vous êtes enceinte (24 SA) | pregnancy-mine |
| 9 | Tâches du foyer | `family_tasks` | Parce que vous partagez le quotidien à deux | partner |
| 10 | Répartition de la charge mentale | `mental_load` | Parce que vous partagez le quotidien à deux | partner |

## B — Maman d’un bébé de 2 mois allaité

| # | Outil | Identifiant | Raison affichée | Règle |
|---|---|---|---|---|
| 1 | Sommeil de l’enfant | `kid_sleep` | Parce que Lina a 2 mois | age-0-6 |
| 2 | Allaitement | `baby_breastfeed` | Parce que vous allaitez | feeding-breast |
| 3 | Ma récupération après la naissance | `pp_recovery` | Parce que vous venez d’avoir un bébé | postpartum |
| 4 | Mon sommeil | `sleep` | Parce que vous venez d’avoir un bébé | postpartum |
| 5 | Couches | `baby_diaper` | Parce que Lina a 2 mois | age-0-6 |
| 6 | Suivi des symptômes après l’accouchement | `h200_52` | Parce que vous venez d’avoir un bébé | postpartum |
| 7 | Suivi de la journée | `baby_daily` | Parce que Lina a 2 mois | age-0-6 |
| 8 | Suivi du sein gauche et droit | `h200_67` | Parce que vous allaitez | feeding-breast |
| 9 | Agenda familial | `family_calendar` | Parce que vous partagez le quotidien à deux | partner |
| 10 | Relais de nuit | `family_nights` | Parce que vous voulez suivre le sommeil | prio-sleep |

« Ton enfant » — Lina (2 mois) : Allaitement (Parce que vous allaitez) · Sommeil de l’enfant (Parce que Lina a 2 mois) · Couches (Parce que Lina a 2 mois) · Suivi de la journée (Parce que Lina a 2 mois) · Suivi du sein gauche et droit (Parce que vous allaitez) · Suivi du poids de bébé (Parce que Lina a 2 mois)

## C — Papa d’un bébé de 8 mois (co-parent)

| # | Outil | Identifiant | Raison affichée | Règle |
|---|---|---|---|---|
| 1 | Sommeil de l’enfant | `kid_sleep` | Parce que vous voulez suivre le sommeil | prio-sleep |
| 2 | Relais de nuit | `family_nights` | Parce que vous êtes papa ou coparent | dad |
| 3 | Missions familiales | `family_missions` | Parce que vous voulez partager les tâches | prio-tasks |
| 4 | Tâches du foyer | `family_tasks` | Parce que vous voulez partager les tâches | prio-tasks |
| 5 | Planning de sommeil | `kid_sleep_rhythm` | Parce que vous voulez suivre le sommeil | prio-sleep |
| 6 | Agenda familial | `family_calendar` | Parce que vous partagez le quotidien à deux | partner |
| 7 | Répartition de la charge mentale | `mental_load` | Parce que vous voulez partager les tâches | prio-tasks |
| 8 | Ma place dans la famille | `family_my_place` | Parce que vous êtes papa ou coparent | dad |
| 9 | Calendrier de diversification alimentaire | `h200_111` | Pour préparer la diversification de Lina | diversif-soon |
| 10 | Dents | `kid_teeth` | Parce que Lina a 8 mois | age-6-12 |

« Ton enfant » — Lina (8 mois) : Sommeil de l’enfant (Parce que Lina a 8 mois) · Calendrier de diversification alimentaire (Pour préparer la diversification de Lina) · Planning de sommeil (Parce que Lina a 8 mois) · Dents (Parce que Lina a 8 mois) · Étapes du développement (Parce que Lina a 8 mois) · Vaccins (Parce que Lina a 8 mois)

## D — Parent d’un enfant de 6 ans

| # | Outil | Identifiant | Raison affichée | Règle |
|---|---|---|---|---|
| 1 | École ou mode de garde | `kid_school` | Parce que vous voulez organiser l’école | prio-school |
| 2 | Routines en images | `kid_routines` | Parce que vous voulez organiser l’école | prio-school |
| 3 | Tableau des responsabilités de l’enfant | `h200_139` | Parce que Noé a 6 ans | age-6-10 |
| 4 | Sorties en famille | `nearby` | Parce que vous voulez découvrir des activités | prio-activities |
| 5 | Suggestions d’activités selon l’âge | `h200_131` | Parce que vous voulez découvrir des activités | prio-activities |
| 6 | Agenda familial | `family_calendar` | Parce que vous partagez le quotidien à deux | partner |
| 7 | Tâches du foyer | `family_tasks` | Parce que vous partagez le quotidien à deux | partner |
| 8 | Répartition de la charge mentale | `mental_load` | Parce que vous partagez le quotidien à deux | partner |
| 9 | Se comprendre | `couple_understand` | Parce que vous partagez le quotidien à deux | partner |
| 10 | Liste de courses | `family_shopping` | Parce que vous partagez le quotidien à deux | partner |

« Ton enfant » — Noé (6 ans) : Routines en images (Parce que Noé a 6 ans) · École ou mode de garde (Parce que Noé a l’âge d’aller à l’école) · Tableau des responsabilités de l’enfant (Parce que Noé a 6 ans) · Journal complet (Parce que Noé a 6 ans) · Sorties en famille (Parce que Noé a 6 ans) · Suivi de santé de l’enfant (Parce que Noé a 6 ans)

## E — Nounou autorisée (compte garde seulement)

| # | Outil | Identifiant | Raison affichée | Règle |
|---|---|---|---|---|
| 1 | Garde et nounou | `childcare` | Pour la garde de Lina | caregiver |
| 2 | Carnet de liaison numérique | `h200_153` | Pour la garde de Lina | caregiver |
| 3 | Appareil photo intégré pour la nounou | `h200_157` | Pour la garde de Lina | caregiver |
| 4 | Messagerie sécurisée parents–nounou | `h200_159` | Pour la garde de Lina | caregiver |
| 5 | Suivi des repas et biberons chez la nounou | `h200_154` | Pour la garde de Lina | caregiver |
| 6 | Suivi des siestes et changes chez la nounou | `h200_155` | Pour la garde de Lina | caregiver |
| 7 | Journal des activités et observations | `h200_156` | Pour la garde de Lina | caregiver |
| 8 | Album privé des photos de garde | `h200_158` | Pour la garde de Lina | caregiver |

## F — Parent de trois enfants (4 mois, 4 ans, 7 ans)

| # | Outil | Identifiant | Raison affichée | Règle |
|---|---|---|---|---|
| 1 | Garde et nounou | `childcare` | Parce qu’une nounou garde Léa | nanny |
| 2 | Carnet de liaison numérique | `h200_153` | Parce qu’une nounou garde Léa | nanny |
| 3 | Noter un biberon | `baby_bottle` | Parce que Léa prend du lait infantile | feeding-formula |
| 4 | École ou mode de garde | `kid_school` | Parce que Zoé a l’âge d’aller à l’école | school-age |
| 5 | Routines en images | `kid_routines` | Parce que Zoé a 7 ans | age-6-10 |
| 6 | Sommeil de l’enfant | `kid_sleep` | Parce que Léa a 4 mois | age-0-6 |
| 7 | Ma récupération après la naissance | `pp_recovery` | Parce que vous venez d’avoir un bébé | postpartum |
| 8 | Journée des biberons | `baby_bottle_timer` | Parce que Léa prend du lait infantile | feeding-formula |
| 9 | Couches | `baby_diaper` | Parce que Léa a 4 mois | age-0-6 |
| 10 | Suivi des symptômes après l’accouchement | `h200_52` | Parce que vous venez d’avoir un bébé | postpartum |

« Ton enfant » — Léa (4 mois) : Noter un biberon (Parce que Léa prend du lait infantile) · Garde et nounou (Parce qu’une nounou garde Léa) · Sommeil de l’enfant (Parce que Léa a 4 mois) · Journée des biberons (Parce que Léa prend du lait infantile) · Couches (Parce que Léa a 4 mois) · Carnet de liaison numérique (Parce qu’une nounou garde Léa)

« Ton enfant » — Tom (4 ans) : Garde et nounou (Parce qu’une nounou garde Tom) · Carnet de liaison numérique (Parce qu’une nounou garde Tom) · Album privé des photos de garde (Parce qu’une nounou garde Tom) · École ou mode de garde (Parce que Tom a l’âge d’aller à l’école) · Suggestions d’activités selon l’âge (Parce que Tom a 4 ans) · Étapes du développement (Parce que Tom a 4 ans)

« Ton enfant » — Zoé (7 ans) : Routines en images (Parce que Zoé a 7 ans) · École ou mode de garde (Parce que Zoé a l’âge d’aller à l’école) · Tableau des responsabilités de l’enfant (Parce que Zoé a 7 ans) · Journal complet (Parce que Zoé a 7 ans) · Sorties en famille (Parce que Zoé a 7 ans) · Suivi de santé de l’enfant (Parce que Zoé a 7 ans)

## G — Sans aucune information

| # | Outil | Identifiant | Raison affichée | Règle |
|---|---|---|---|---|
| 1 | Agenda familial | `family_calendar` | Pour découvrir HOMI | discover |
| 2 | Tâches du foyer | `family_tasks` | Pour découvrir HOMI | discover |
| 3 | Rendez-vous et examens | `appointments` | Pour découvrir HOMI | discover |
| 4 | Communauté | `community` | Pour découvrir HOMI | discover |
| 5 | Liste de courses | `family_shopping` | Pour découvrir HOMI | discover |
| 6 | Bibliothèque | `library` | Pour découvrir HOMI | discover |
| 7 | Repas et recettes | `meals` | Pour découvrir HOMI | discover |
| 8 | Vider ma tête | `brain_dump` | Pour découvrir HOMI | discover |
| 9 | Mon sommeil | `sleep` | Pour découvrir HOMI | discover |
| 10 | Sorties en famille | `nearby` | Pour découvrir HOMI | discover |

