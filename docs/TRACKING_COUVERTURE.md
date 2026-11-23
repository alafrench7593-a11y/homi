# Couverture du tracking — catalogue « Mes apps » (généré le 22/11/2026, registre src/lib/journeys/tools.ts)

Légende statut : FAIT = observé dans l’aperçu web Chromium (vraie app, démo locale) ; Deno = fonction `assistant` avec modèle simulé. « FAIT · Jest » = livré et couvert par les tests Jest (backend de démonstration), pas encore ouvert dans Chromium. Rien n’est encore vérifié sur simulateur iOS ni sur iPhone.

Synthèse (mise à jour le 23/11/2026, après la vague 3, l’audit et les finitions) : FAIT 98, PARTIEL 0, SANS SUIVI 38, À FAIRE 0 — total 136. « FAIT (vague 3) » = livré et ouvert sans erreur dans Chromium, pas rejoué de bout en bout ; « FAIT · Jest » = testé avec le backend de démonstration, pas encore ouvert dans Chromium (sauf mention).

| Mini-app (id) | Profils | Catégorie | Famille de geste | Donnée suivie | Remontée accueil / catégorie | Aura · prix | Test / statut |
|---|---|---|---|---|---|---|---|
| baby_breastfeed | baby, postpartum | feeding | Temps et sessions | tétées (breastfeeds, côté) | accueil : tétée en cours / dernière | — | FAIT · Chromium (migration `segments` non déployée) |
| baby_bottle | baby | feeding | Mesures et quantités | biberons (ml) | accueil : dernier biberon ; catégorie Alimentation : ml/jour | analyse biberons existante · 3 crédits | FAIT · Chromium |
| baby_bottle_timer | baby, postpartum | feeding | Temps et sessions | minuteur biberon | accueil : dernier biberon | — | FAIT · Jest : minuteur conservé ; une fois arrêté, « Corriger ce biberon » ouvre la MÊME fiche Tray que la saisie à une main (table bottles, useEditLog / guardedLogUpdate) ; heure, quantité ET durée bue corrigeables (début/fin recalculés, pauses gardées) ; historique animé (finishTrack.test.ts, finishTrackScreens.test.tsx) |
| baby_bottle_history | baby | feeding | Mesures et quantités | historique biberons | catégorie Alimentation | analyse existante · 3 crédits | FAIT · Chromium |
| bottle_scoops | baby, postpartum | feeding | Journaux | repas / menus | catégorie Alimentation | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| baby_foods | bébé, enfant | feeding | Journaux | dégustations par aliment | catégorie Alimentation : aliments découverts | — | FAIT · Chromium |
| meals | MEAL_SCOPES | feeding | Journaux | repas / menus | catégorie Alimentation | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| meal_menu | ...MEAL_SCOPES, pregnancy, family | feeding | Journaux | repas / menus | catégorie Alimentation : repas du menu prévus aujourd’hui (seulement s’il y en a) | — | FAIT · Jest (23/11) : repas en grand, jours datés (date en colonne fixe, « Rien de prévu » jamais 0), jour choisi `?day=` et repas ouvert `?slot=` dans l’adresse, fiche Tray personnes / note (provisoire, Annuler, double appui verrouillé ; ligne enregistrée écrite via `useCareEdit` / editGuards) ; non rejoué dans Chromium |
| meal_pantry | ...MEAL_SCOPES, pregnancy, family | feeding | Journaux | repas / menus | catégorie Alimentation : ingrédients cochés ou corrigés aujourd’hui (seulement s’il y en a) | — | FAIT · Jest (23/11) : ingrédients à la maison datés (colonne fixe), fiche Tray `?item=` quantité / note (provisoire, Annuler, verrouillé ; écrite par `useUpdateStock`, gardée par version), « Retirer de la maison » ; non rejoué dans Chromium |
| meal_rankings | ...KID, family | feeding | Journaux | repas / menus | — (aucune donnée datée propre : score éditorial) | — | FAIT · Jest (fonctions pures) (23/11) : rang en colonne fixe, liste animée, classement / tranche / recette ouverte `?recipe=` dans l’adresse, fiche Tray score + « Corriger ma préférence » (favorite / neutre / écartée ; rien d’écrit si changée entre-temps) ; non rejoué dans Chromium |
| preg_eat | pregnancy | feeding | Journaux | repas / menus | catégorie Alimentation | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| scan_food | tous | feeding | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| kid_sleep | bébé, enfant | sleep | Temps et sessions | sessions de sommeil (mode nuit /night) | idem Sommeil (même table) | — | FAIT · Jest : mode nuit refait dans le patron sommeil (thème nuit, aucun son, luminosité inchangée) : état et durée depuis le dernier changement en grand, bouton « Lina s’endort », saisies des 12 dernières heures en liste datée (heure en colonne fixe, animée), une ligne ouvre sa fiche Tray existante (sommeil, tétée, biberon, couche) (finishTrackScreens.test.tsx) |
| kid_sleep_rhythm | bébé, enfant | sleep | Temps et sessions | sessions de sommeil (table sleeps) | accueil : sieste en cours / dernière ; catégorie Sommeil : jour + 7 jours | fenêtre indicative + analyse d’une session · 3 crédits | FAIT · Chromium + Deno |
| sleep_help | bébé, enfant | sleep | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| baby_night_help | baby | sleep | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| family_nights | baby, child, family, postpartum, pregnancy | sleep | Foyer et relais | tours de nuit + transmission de la journée (/family/relay) | accueil : « Relais parent » ; brouillon = mêmes tables | — | FAIT (transmission) · Chromium ; tours de nuit inchangés |
| sleep | ADULT | sleep | Temps et sessions | sommeil de la mère | — | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| baby_daily | baby | care | Journaux | journal santé / soins | — | — | FAIT · Chromium (journal du jour mixte, planche 2) |
| baby_diaper | baby | care | Journaux | couches | catégorie Soins : nombre/jour | — | FAIT · Chromium |
| kid_teeth | bébé, enfant | care | Journaux | journal santé / soins | — | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| scan_product | tous | care | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI : action de lecture : le résultat va dans l’historique du scanner (ouvert sans erreur dans Chromium, 23/11) |
| scan_history | tous | care | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| scan_compare | tous | care | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI : action de lecture : le résultat va dans l’historique du scanner (ouvert sans erreur dans Chromium, 23/11) |
| kid_products | ...KID, family, pregnancy, none | care | Journaux | journal santé / soins | — | — | SANS SUIVI : liste de lecture, aucune saisie (ouvert sans erreur dans Chromium, 23/11) |
| journal | ...KID, family | care | Journaux | journal santé / soins | — | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| kid_profile | bébé, enfant | care | Journaux | journal santé / soins | — | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| kid_grow | bébé, enfant | care | Mesures et quantités | mesures datées (child_measurements) | dernière mesure | — | FAIT · Chromium |
| kid_mood | bébé, enfant | care | Journaux | journal santé / soins | — | — | FAIT · Chromium (vague 2) |
| kid_album | bébé, enfant | care | Journaux | journal santé / soins | — | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| appointments | tous | health | Journaux et rendez-vous | rendez-vous | accueil : prochain rendez-vous | — | FAIT · Chromium |
| consult_questions | tous | health | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| documents | tous | health | Journaux | journal santé / soins | — | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| health_book | tous | health | Journaux | journal santé / soins | — | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| kid_vaccines | bébé, enfant | health | Journaux | journal santé / soins | catégorie Santé : vaccin noté / rendez-vous de vaccination du jour (seulement s’il y en a) | — | FAIT · Jest (23/11) : vaccins notés en grand (doses faites / prévues / reportées), registre daté (colonne fixe), visite `?visit=` et ligne `?vax=` dans l’adresse, fiche Tray date / dose / lot / par qui / source / note (date jamais future ni avant la naissance ; `useCareEdit` / editGuards), calendrier prévu / fait / reporté conservé ; non rejoué dans Chromium |
| kid_health | bébé, enfant | health | Journaux | journal santé / soins | — | — | FAIT · Chromium (vague 2) |
| kid_treatments | bébé, enfant | health | Journaux | journal santé / soins | — | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| medications | tous | health | Journaux | journal santé / soins | — | — | FAIT · Chromium (vague 2) |
| kid_steps | child | health | Journaux | journal santé / soins | — | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| summary | ...KID, pregnancy, family | health | Journaux | journal santé / soins | — | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| mood | ADULT | health | Journaux | journal santé / soins | — | — | FAIT · Chromium (vague 2) |
| me_diary | ADULT | health | Journaux | journal santé / soins | — | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| exhaustion_check | foyer, couple | health | Journaux | journal santé / soins | — | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| scan_avoid | tous | health | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI : liste de lecture, aucune saisie (ouvert sans erreur dans Chromium, 23/11) |
| recall_alerts | tous | health | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| emergency | tous | health | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI : numéros et marche à suivre, aucune saisie (ouvert sans erreur dans Chromium, 23/11) |
| ask | tous | health | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI : Aura : cartes d’action locales vérifiées (7/7) (ouvert sans erreur dans Chromium, 23/11) |
| local_ai | tous | health | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI : assistant des articles, aucune saisie (ouvert sans erreur dans Chromium, 23/11) |
| library | tous | health | Journaux | journal santé / soins | — | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| guides | tous | health | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| videos | tous | health | Journaux | journal santé / soins | — | — | SANS SUIVI : lecture (ouvert sans erreur dans Chromium, 23/11) |
| sources | tous | health | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| cycle_home | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| cycle_calendar | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| cycle_symptoms | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| cycle_pain | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| cycle_discharge | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| cycle_bleeding | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| cycle_journal | cycle | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Chromium (vague 2) |
| cycle_stats | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Jest : longueurs de cycle en barres tactiles (bulle valeur + date, doigt / clavier / lecteur d’écran), période `?n=` et cycle `?cycle=` dans l’adresse, « Ouvrir la fiche » → correction des règles existante (`/cycle?all=1&period=`) (finishTrack.test.ts, finishTrackScreens.test.tsx) |
| cycle_advice | CYCLE | cycle | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| cycle_month | CYCLE | cycle | Journaux (cycle) | saisies du cycle | accueil cycle | analyse cycle existante · 3 crédits | FAIT · Jest : mois `?m=` et jour `?day=` dans l’adresse, jours du mois en barres tactiles (bulle valeur + date) ; « Ouvrir la fiche » → correction des règles existante, sinon journal des symptômes du jour (finishTrack.test.ts) |
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
| preg_evolution | pregnancy | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| preg_weight | pregnancy | pregnancy | Mesures et quantités | poids de grossesse | dernière mesure | — | FAIT · Chromium |
| preg_feel | pregnancy | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | FAIT · Chromium (vague 2) |
| preg_moves | pregnancy | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | FAIT · Chromium (vague 2) |
| preg_calendar | pregnancy | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | FAIT · Chromium (vague 2) |
| preg_names | pregnancy, ttc | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| preg_lists | pregnancy | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | FAIT · Chromium (vague 2) |
| pp_recovery | postpartum, baby, none | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 (parcours bloqué en démo : pas de post-partum actif) ; créer → corriger → persister non rejoué |
| pp_checkin | postpartum, baby, none | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | FAIT · Chromium (vague 2) |
| pp_history | postpartum, baby, none | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | FAIT · Chromium (vague 2) |
| pp_body | postpartum, baby, none | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 (parcours bloqué en démo : pas de post-partum actif) ; créer → corriger → persister non rejoué |
| pp_mental | postpartum, baby, none | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| pp_support | postpartum, baby, none | pregnancy | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| pp_partner | postpartum, baby | pregnancy | Journaux et rendez-vous | suivi grossesse / post-partum | accueil grossesse | — | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| kid_school | bébé, enfant | school | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Jest : un devoir s’ouvre dans sa fiche Tray sur l’écran École (`?hw=`) : cocher, matière, consigne, échéance ; écriture par la mutation de l’app Devoirs (`useUpdateHomework`, partagée avec la case à cocher), formulaire complet dans Devoirs (finishTrackScreens.test.tsx) |
| kid_card | bébé, enfant | school | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| kid_routines | child, family | school | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| custody | ...KID, family | school | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| childcare | ...KID, family | school | Foyer et relais | données du foyer | accueil foyer | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| mental_load | foyer, couple | couple | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Jest : « Qui porte quoi » — domaine ou tâche ouvert dans l’adresse (?domain=, ?task=), porteur changé dans une fiche Tray (useSetDomain / useSaveTask réutilisés, fiche partagée avec Domaines) ; lecture seule sans droit d’édition ; non rejoué dans Chromium |
| family_domains | foyer, couple | couple | Foyer et relais | données du foyer | accueil foyer | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| couple_week | foyer, couple | couple | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| couple_understand | foyer, couple | couple | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| family_review | family | couple | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Jest (fonctions pures) : semaine dans l’adresse (?week=), tâches faites en grand + demandes / nuits / temps pour soi chacun dans sa case, liste datée (jour en colonne), fiche Tray d’une tâche (?task=), lecture seule sans droit ; non rejoué dans Chromium |
| family_metime | foyer, couple | couple | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| offduty | foyer, couple | couple | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Jest : semaine dans l’adresse, mes heures de pause en grand, pauses datées (5 semaines), fiche d’une pause (?pause=) ; fin de MA pause en cours corrigée (≤ début + 24 h), rappels en pause recalés ; non rejoué dans Chromium |
| family_difficult | foyer, couple | couple | Foyer et relais | données du foyer | accueil foyer | — | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| family_urgent | baby, child, family, postpartum | couple | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI (urgence, écran volontairement inchangé) |
| family_sos | baby, child, family, postpartum | couple | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | SANS SUIVI (urgence, écran volontairement inchangé) |
| solo_parent | tous | couple | Foyer et relais | données du foyer | accueil foyer | — | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| family_calendar | foyer, couple | family | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Jest (fonctions pures) : vue et jour dans l’adresse, moments de la période en grand (rdv / tâches / événements), événement ouvert dans l’adresse (?event=) et fiche Tray (titre, heures, lieu ; formulaire complet), lecture seule sans droit ; non rejoué dans Chromium |
| family_tasks | foyer, couple | family | Foyer et relais | tâches | accueil foyer : tâches ouvertes | — | FAIT · Chromium |
| family_missions | foyer, couple | family | Foyer et relais | données du foyer | accueil foyer | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| family_my_place | foyer, couple | family | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Jest (fonctions pures) : mes tâches à faire en grand (en retard / semaine / missions), liste datée (échéance en colonne), tâche ouverte dans l’adresse et fiche Tray (porteur, intitulé, échéance), carte Foyer conservée ; non rejoué dans Chromium |
| family_routines | foyer, couple | family | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| family_history | family | family | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) · lecture seule |
| brain_dump | foyer, couple | family | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Jest (fonctions pures) : « Noté par toi » — jour dans l’adresse, semaine touchable, tâches notées du jour en grand, heure en colonne, fiche Tray (?task=) ; tri provisoire animé ; non rejoué dans Chromium |
| family_prep | foyer, couple | family | Lecture et conseils | favoris / reprise de lecture | — | Aura : explication à la demande · 1 crédit (question) | FAIT · Chromium (vague 2) |
| family_shopping | foyer, couple | family | Foyer et relais | courses | — | — | FAIT · Chromium |
| family_stocks | foyer, couple | family | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| house_notebook | foyer, couple | family | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| family_papers | tous | family | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| reminders | tous | family | Foyer et relais | données du foyer | accueil foyer | — | FAIT · Chromium (vague 2) |
| nearby | tous | family | Foyer et relais | données du foyer | accueil foyer | — | SANS SUIVI (lecture courte : ni favoris ni reprise, brief) |
| community | tous | community | À classer | — | — | — | FAIT (vague 3) · ouvert sans erreur dans Chromium le 23/11 ; créer → corriger → persister non rejoué |
| settings | tous | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
| notifications | tous | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
| journeys | tous | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
| home_settings | tous | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
| account_delete | tous | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
| sign_out | tous | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
| my_info | foyer, couple | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
| preg_edit | pregnancy | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
| preg_end | pregnancy | account | Compte et réglages | — | — | — | SANS SUIVI (réglages) |
