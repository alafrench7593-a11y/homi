# Couverture du tracking — catalogue « Mes apps » (généré le 22/11/2026, registre src/lib/journeys/tools.ts)

Légende statut : FAIT = observé dans l’aperçu web Chromium (vraie app, démo locale) ; Deno = fonction `assistant` avec modèle simulé. Rien n’est encore vérifié sur simulateur iOS ni sur iPhone.

Synthèse (mise à jour après la vague 2, 22/11/2026) : FAIT 51, PARTIEL 15, SANS SUIVI 30, À FAIRE 40 — total 136

| Mini-app (id) | Profils | Catégorie | Famille de geste | Donnée suivie | Remontée accueil / catégorie | Aura · prix | Test / statut |
|---|---|---|---|---|---|---|---|
| baby_breastfeed | baby, postpartum | feeding | Temps et sessions | tétées (breastfeeds, côté) | accueil : tétée en cours / dernière | — | FAIT · Chromium (migration `segments` non déployée) |
| baby_bottle | baby | feeding | Mesures et quantités | biberons (ml) | accueil : dernier biberon ; catégorie Alimentation : ml/jour | analyse biberons existante · 3 crédits | FAIT · Chromium |
| baby_bottle_timer | baby, postpartum | feeding | Temps et sessions | minuteur biberon | accueil : dernier biberon | — | PARTIEL : minuteur existant conservé, saisie à une main ajoutée à côté |
| baby_bottle_history | baby | feeding | Mesures et quantités | historique biberons | catégorie Alimentation | analyse existante · 3 crédits | FAIT · Chromium |
| bottle_scoops | baby, postpartum | feeding | Journaux | repas / menus | catégorie Alimentation | — | À FAIRE |
| baby_foods | bébé, enfant | feeding | Journaux | dégustations par aliment | catégorie Alimentation : aliments découverts | — | FAIT · Chromium |
| meals | MEAL_SCOPES | feeding | Journaux | repas / menus | catégorie Alimentation | — | À FAIRE |
| meal_menu | ...MEAL_SCOPES, pregnancy, family | feeding | Journaux | repas / menus | catégorie Alimentation | — | PARTIEL : donnée principale seulement |
| meal_pantry | ...MEAL_SCOPES, pregnancy, family | feeding | Journaux | repas / menus | catégorie Alimentation | — | PARTIEL : donnée principale seulement |
| meal_rankings | ...KID, family | feeding | Journaux | repas / menus | catégorie Alimentation | — | PARTIEL : donnée principale seulement |
| preg_eat | pregnancy | feeding | Journaux | repas / menus | catégorie Alimentation | — | À FAIRE |
| scan_food | tous | feeding | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | À FAIRE (favoris/reprise) |
| kid_sleep | bébé, enfant | sleep | Temps et sessions | sessions de sommeil (mode nuit /night) | idem Sommeil (même table) | — | PARTIEL : même donnée, écran nuit non refait |
| kid_sleep_rhythm | bébé, enfant | sleep | Temps et sessions | sessions de sommeil (table sleeps) | accueil : sieste en cours / dernière ; catégorie Sommeil : jour + 7 jours | fenêtre indicative + analyse d’une session · 3 crédits | FAIT · Chromium + Deno |
| sleep_help | bébé, enfant | sleep | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | À FAIRE (favoris/reprise) |
| baby_night_help | baby | sleep | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | À FAIRE (favoris/reprise) |
| family_nights | baby, child, family, postpartum, pregnancy | sleep | Foyer et relais | tours de nuit + transmission de la journée (/family/relay) | accueil : « Relais parent » ; brouillon = mêmes tables | — | FAIT (transmission) · Chromium ; tours de nuit inchangés |
| sleep | ADULT | sleep | Temps et sessions | sommeil de la mère | — | — | À FAIRE |
| baby_daily | baby | care | Journaux | journal santé / soins | — | — | FAIT · Chromium (journal du jour mixte, planche 2) |
| baby_diaper | baby | care | Journaux | couches | catégorie Soins : nombre/jour | — | FAIT · Chromium |
| kid_teeth | bébé, enfant | care | Journaux | journal santé / soins | — | — | À FAIRE |
| scan_product | tous | care | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | À FAIRE (favoris/reprise) |
| scan_history | tous | care | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | À FAIRE (favoris/reprise) |
| scan_compare | tous | care | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | À FAIRE (favoris/reprise) |
| kid_products | ...KID, family, pregnancy, none | care | Journaux | journal santé / soins | — | — | À FAIRE |
| journal | ...KID, family | care | Journaux | journal santé / soins | — | — | À FAIRE |
| kid_profile | bébé, enfant | care | Journaux | journal santé / soins | — | — | À FAIRE |
| kid_grow | bébé, enfant | care | Mesures et quantités | mesures datées (child_measurements) | dernière mesure | — | FAIT · Chromium |
| kid_mood | bébé, enfant | care | Journaux | journal santé / soins | — | — | FAIT · Chromium (vague 2) |
| kid_album | bébé, enfant | care | Journaux | journal santé / soins | — | — | À FAIRE |
| appointments | tous | health | Journaux et rendez-vous | rendez-vous | accueil : prochain rendez-vous | — | FAIT · Chromium |
| consult_questions | tous | health | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | À FAIRE (favoris/reprise) |
| documents | tous | health | Journaux | journal santé / soins | — | — | À FAIRE |
| health_book | tous | health | Journaux | journal santé / soins | — | — | À FAIRE |
| kid_vaccines | bébé, enfant | health | Journaux | journal santé / soins | — | — | PARTIEL : calendrier prévu / fait / reporté existant, non refait |
| kid_health | bébé, enfant | health | Journaux | journal santé / soins | — | — | FAIT · Chromium (vague 2) |
| kid_treatments | bébé, enfant | health | Journaux | journal santé / soins | — | — | À FAIRE |
| medications | tous | health | Journaux | journal santé / soins | — | — | FAIT · Chromium (vague 2) |
| kid_steps | child | health | Journaux | journal santé / soins | — | — | À FAIRE |
| summary | ...KID, pregnancy, family | health | Journaux | journal santé / soins | — | — | À FAIRE |
| mood | ADULT | health | Journaux | journal santé / soins | — | — | FAIT · Chromium (vague 2) |
| me_diary | ADULT | health | Journaux | journal santé / soins | — | — | À FAIRE |
| exhaustion_check | foyer, couple | health | Journaux | journal santé / soins | — | — | À FAIRE |
| scan_avoid | tous | health | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | À FAIRE (favoris/reprise) |
| recall_alerts | tous | health | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | À FAIRE (favoris/reprise) |
| emergency | tous | health | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | À FAIRE (favoris/reprise) |
| ask | tous | health | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | À FAIRE (favoris/reprise) |
| local_ai | tous | health | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | À FAIRE (favoris/reprise) |
| library | tous | health | Journaux | journal santé / soins | — | — | À FAIRE |
| guides | tous | health | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | À FAIRE (favoris/reprise) |
| videos | tous | health | Journaux | journal santé / soins | — | — | À FAIRE |
| sources | tous | health | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | À FAIRE (favoris/reprise) |
| cycle_home | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| cycle_calendar | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| cycle_symptoms | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| cycle_pain | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| cycle_discharge | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| cycle_bleeding | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| cycle_journal | cycle | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| cycle_stats | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | PARTIEL : écran inchangé (pas de bulle sur les barres) |
| cycle_advice | CYCLE | cycle | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| cycle_month | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | PARTIEL : écran inchangé (pas de bulle sur les barres) |
| cycle_export | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | SANS SUIVI (export) |
| cycle_guides | CYCLE | cycle | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | FAIT · Chromium (vague 2) · favoris + reprise |
| cycle_kit | CYCLE | cycle | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI (réglages) |
| avoid_contraception | avoid | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| avoid_methods | avoid | cycle | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| avoid_emergency | avoid | cycle | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| avoid_reminders | avoid | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | SANS SUIVI (réglages) |
| avoid_consult | avoid | cycle | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| contraception_journal | avoid | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| ttc_cycle | ttc | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| ttc_tests | ttc | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| ttc_mucus | ttc | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| ttc_temperature | ttc | cycle | Mesures et quantités | température basale | — | — | FAIT · Chromium |
| ttc_intimacy | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| ttc_exams | ttc | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | SANS SUIVI (informatif) |
| ttc_understand | ttc | cycle | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| ttc_consult | ttc | cycle | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| ttc_reminders | ttc | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | SANS SUIVI (réglages) |
| pma_tracker | ttc | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| ttc_start_pregnancy | ME | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | SANS SUIVI (formulaire de création de grossesse) |
| preg_evolution | pregnancy | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | À FAIRE |
| preg_weight | pregnancy | pregnancy | Mesures et quantités | poids de grossesse | dernière mesure | — | FAIT · Chromium |
| preg_feel | pregnancy | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | FAIT · Chromium (vague 2) |
| preg_moves | pregnancy | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | FAIT · Chromium (vague 2) |
| preg_calendar | pregnancy | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | FAIT · Chromium (vague 2) |
| preg_names | pregnancy, ttc | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | À FAIRE |
| preg_lists | pregnancy | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | FAIT · Chromium (vague 2) |
| pp_recovery | postpartum, baby, none | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | À FAIRE |
| pp_checkin | postpartum, baby, none | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | FAIT · Chromium (vague 2) |
| pp_history | postpartum, baby, none | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | FAIT · Chromium (vague 2) |
| pp_body | postpartum, baby, none | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | À FAIRE |
| pp_mental | postpartum, baby, none | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| pp_support | postpartum, baby, none | pregnancy | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| pp_partner | postpartum, baby | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| kid_school | bébé, enfant | school | Foyer et relais | données du foyer | accueil foyer | — | PARTIEL : exploré (semaine), correction dans l’app Devoirs |
| kid_card | bébé, enfant | school | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| kid_routines | child, family | school | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| custody | ...KID, family | school | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| childcare | ...KID, family | school | Foyer et relais | données du foyer | accueil foyer | — | À FAIRE |
| mental_load | foyer, couple | couple | Foyer et relais | données du foyer | accueil foyer | — | PARTIEL : lecture seule, correction dans Tâches |
| family_domains | foyer, couple | couple | Foyer et relais | données du foyer | accueil foyer | — | À FAIRE |
| couple_week | foyer, couple | couple | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| couple_understand | foyer, couple | couple | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| family_review | family | couple | Foyer et relais | données du foyer | accueil foyer | — | PARTIEL : donnée principale seulement |
| family_metime | foyer, couple | couple | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| offduty | foyer, couple | couple | Foyer et relais | données du foyer | accueil foyer | — | PARTIEL : donnée principale seulement |
| family_difficult | foyer, couple | couple | Foyer et relais | données du foyer | accueil foyer | — | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| family_urgent | baby, child, family, postpartum | couple | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI (urgence, écran volontairement inchangé) |
| family_sos | baby, child, family, postpartum | couple | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI (urgence, écran volontairement inchangé) |
| solo_parent | tous | couple | Foyer et relais | données du foyer | accueil foyer | — | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| family_calendar | foyer, couple | family | Foyer et relais | données du foyer | accueil foyer | — | PARTIEL : vue et jour gardés dans l’adresse |
| family_tasks | foyer, couple | family | Foyer et relais | tâches | accueil foyer : tâches ouvertes | — | FAIT · Chromium |
| family_missions | foyer, couple | family | Foyer et relais | données du foyer | accueil foyer | — | À FAIRE |
| family_my_place | foyer, couple | family | Foyer et relais | données du foyer | accueil foyer | — | PARTIEL : carte Foyer posée |
| family_routines | foyer, couple | family | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| family_history | family | family | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) · lecture seule |
| brain_dump | foyer, couple | family | Foyer et relais | données du foyer | accueil foyer | — | PARTIEL : donnée principale seulement |
| family_prep | foyer, couple | family | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | FAIT · Chromium (vague 2) |
| family_shopping | foyer, couple | family | Foyer et relais | courses | — | — | FAIT · Chromium |
| family_stocks | foyer, couple | family | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| house_notebook | foyer, couple | family | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| family_papers | tous | family | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| reminders | tous | family | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| nearby | tous | family | Foyer et relais | données du foyer | accueil foyer | — | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| community | tous | community | À classer | — | — | — | À FAIRE |
| settings | tous | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
| notifications | tous | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
| journeys | tous | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
| home_settings | tous | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
| account_delete | tous | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
| sign_out | tous | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
| my_info | foyer, couple | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
| preg_edit | pregnancy | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
| preg_end | pregnancy | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
