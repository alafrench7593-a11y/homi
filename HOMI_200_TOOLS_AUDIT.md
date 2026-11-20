# HOMI — Audit des 200 outils

## État au 30/11/2026 (après branchement des numéros complétés)

Source : `docs/200/correspondance_200.csv` (colonne `statut` ; un numéro livré après l'audit porte « OPÉRATIONNEL (route) ») et la table `HOMI_200` (`src/lib/journeys/homi200.ts`), vérifiées par `src/__tests__/homi200.test.ts` et `src/__tests__/branchement200.test.ts`.

| Statut (correspondance) | Nombre |
|---|---|
| OPÉRATIONNEL (131 à l'audit du 18/11 + 61 livrés depuis, avec leur route) | 192 |
| PARTIEL : 178 Planification des moments à deux ; 196 Recherche universelle en langage naturel | 2 |
| ABSENT : 135 Créateur d'histoires personnalisées (IA centrale) | 1 |
| DOUBLON_LISTE (13 = 3 ; 16 = 1 ; 22 = 11 ; 35 = 13 ; 187 = 163) | 5 |
| Total | 200 |

Dans l'application (`HOMI_200`) : 63 numéros sont un outil du registre, 129 une fonction nommée (sous-accès avec son nom, sa phrase, son pictogramme et sa route exacte), 5 des doublons, 2 partiels et 1 absent : **197 numéros disponibles** dans le catalogue, la recherche et les recommandations. Les 11 entrées HOMI Aura (29, 49, 64, 82, 110, 124, 140, 174, 190, 197, 200) ouvrent `/assistant?theme=…` (IA centrale, sauf 174 et 200 qui ont un repli local), avec la règle d'accès de l'assistant (Premium ou offre « Assistant IA »).

Le reste de ce document est l'audit initial du 18/11/2026, conservé tel quel.

---

Fichiers détaillés : [correspondance numéro par numéro](docs/200/correspondance_200.csv) · [outils existants](docs/200/matrice_outils_existants.csv) · [liste de référence](docs/200/liste_200.md) · [IA, crédits, profils](docs/200/audit_ia_credits_profils.md).

Établi le 18/11/2026 sur la branche `homi/fondations` (HEAD `6bfc374`), en lecture seule (aucun fichier suivi modifié, rien committé).
Livrables (même dossier, UTF-8 avec BOM, séparateur virgule) : ce fichier ; `A_matrice_outils.csv` (160 lignes : 127 outils + 33 sous-accès et entrées de compte) ; `A_correspondance_200.csv` (200 lignes, liste de la propriétaire).

## Synthèse de la liste des 200 outils de la propriétaire (liste_200.md, 18/11/2026)

Détail ligne à ligne : `A_correspondance_200.csv` (200 lignes : numero, nom_liste, groupe, correspondance, nature, statut, ce_qui_manque, tables, taille, besoin_ia, risque). Beaucoup de numéros sont des FONCTIONS d'un outil existant (88 sur 131 couverts) : ils ne sont pas comptés absents.

| Statut | Nombre |
|---|---|
| OPÉRATIONNEL (outil existant : 43 ; fonction d'un outil existant : 88) | 131 |
| PARTIEL (36 : 30 de taille S pour compléter, 6 de taille M) | 36 |
| ABSENT | 28 |
| DOUBLON_LISTE (13 = 3 ; 16 = 1 ; 22 = 11 ; 35 = 13 ; 187 = 163) | 5 |
| Total | 200 |

Le chiffre honnête : sur 200 numéros, 195 désignent des fonctions distinctes ; 131 existent déjà, 36 existent en partie, 28 seulement manquent vraiment. Les 5 doublons sont à fusionner dans la liste (les fonctions de 13 et 35 sont couvertes par cycle_symptoms et preg_feel).

### ABSENTS (28) groupés par taille
- S (12) : 48 Préparation du coparent à l'accouchement ; 58 Rééducation périnéale prescrite ; 60 Cicatrisation ; 74 Rappels de conservation du lait ; 76 Difficultés d'allaitement ; 77 Douleurs pendant les tétées ; 79 Changements de lait infantile ; 122 Portions préparées ; 133 Habitudes de lecture ; 144 Entretiens nounou ; 145 Checklist visite de crèche ; 150 Absences et congés.
- M (13) : 39 Chronomètre des contractions ; 44 Projet de naissance ; 73 Stock de lait maternel ; 134 Bibliothèque d'histoires ; 142 Comparateur nounous et crèches ; 143 Fiches de candidature ; 146 Comparateur de tarifs ; 147 Budget de garde ; 149 Heures de garde ; 172 Mode Embrouille (fonction non définie) ; 179 Missions de reconnexion ; 186 Dépenses familiales ; 189 Animaux.
- L (3) : 135 Créateur d'histoires (IA centrale) ; 141 Recherche de modes de garde (données externes absentes) ; 161 Espace Papa.

Les blocs les plus vides : Nounou et garde (9 absents sur 20 : tout ce qui précède et encadre la garde ; le carnet de liaison, les photos et la messagerie existent), Allaitement et biberons (5), Grossesse (3), Développement (3), Couple (3), Maison (2). Les blocs Cycle, Fertilité, Sommeil/croissance/santé, Communauté sont couverts à plus de 90 %.

Points de vigilance (colonne `risque`) : données de référence médicales à sourcer (courbes : OMS 2006 en code, carnet français AFPA-CRESS 2018 ; calendriers vaccinaux hors France ; conservation du lait ; seuils de contractions ; durées) ; données externes indisponibles (141 : aucune base de nounous ou de crèches) ; fonction non définie (172 « Mode Embrouille », introuvable dans le dépôt) ; réglementaire (147 : le CMG ne doit pas être promis ; 149 : valeur légale du pointage) ; IA (197 et 135 centrales, 13 autres optionnelles, tout le reste fonctionne sans IA ; l'assistant en ligne est éteint, `src/config/features.ts:10`).

Exigences transverses : le registre `ToolDef` (`src/lib/journeys/tools.ts`) porte id, category, theme, icon, scopes, href, when, aliases, subs ; nom, description, mots de recherche et « problème résolu » sont dans l'i18n. Il ne porte pas `ageRange`, `requiredData`, `requiredPermissions`, `recommendationRules` (le moteur déterministe est à part, `lib/journeys/relevance.ts`), `isAvailable` ni `aiMode`. Le moteur de recommandation, l'accueil à 6-10 outils, l'onboarding en 6 étapes et les profils de test A-G n'ont pas été audités ici.

---

## 0. Méthode et limites (à lire d'abord)

- Source des 127 outils : `MATRICE_OUTILS.csv` (127 lignes), recoupée avec le registre `src/lib/journeys/tools.ts` (145 entrées : 127 outils + 7 entrées de compte + `community` comptée dans les 127 ; plus 26 sous-accès : 4 filtres de bibliothèque, 15 guides, 1 tutos, 2 onglets enfant, 1 besoins, 1 responsabilités, 1 missions terminées, 1 messages), `src/lib/domain/toolCatalog.ts`, `src/i18n/fr/toolhub.ts` (noms, synonymes, « problème résolu ») et `src/lib/routes.generated.ts` (259 lignes ; les 127 routes d'outils correspondent chacune à un fichier de `src/app`).
- `node scripts/homi/inventory.mjs --check` : « 256 routes, 257 fichiers, 127 outils · fait 23, tranche 2, à faire 232 ». `scripts/homi/inventory-status.json` ne suit que 10 outils (mood, scan_*, recall_alerts, baby_bottle_timer, bottle_scoops, baby_bottle_history) et 25 écrans : la refonte visuelle n'est suivie que pour ces derniers, pas pour les 117 autres outils.
- Le statut fonctionnel vient de la LECTURE du code (écran, hooks, composants partagés). Je n'ai ni lancé l'application ni exécuté les tests : un statut OPÉRATIONNEL signifie « la chaîne saisie, base, relecture existe dans le code », pas « testé de bout en bout aujourd'hui ». Les rejeux antérieurs (`docs/audit/MATRICE_OUTILS_VERIFIEE.csv`, 13-14/11 : 106 validés, 36 corrigés, 13 « bloqués » faute de rejeu de la saisie) précèdent la refonte du centre d'outils du 17-18/11.
- « Premium oui/non » est repris de `MATRICE_OUTILS.csv` (calculé depuis `src/lib/premium/access.ts`, non revérifié) : 119 Premium, 8 gratuits.
- Définitions. OPÉRATIONNEL = saisie + enregistrement en base + relecture (liste, historique ou vue dérivée). PARTIEL = écran présent mais un maillon manque. STATIQUE = guide, lecture ou calculateur sans enregistrement, légitime. Colonne `type` du CSV : saisie, dérivé (vue calculée sur des saisies existantes), historique, action, guide, catalogue, calcul, assistant.
- La colonne `tests_refs` du CSV compte les fichiers de `src/__tests__` et `e2e` qui citent la route : indicatif seulement, elle sous-compte les écrans à identifiant (`/child/:id/...`).

## 1. Chiffres clés

| | Outils (127) | + sous-accès et compte (33) |
|---|---|---|
| OPÉRATIONNEL | 106 | 13 |
| PARTIEL | 1 (`ask`) | 0 |
| STATIQUE | 20 | 20 |
| Doublons | 52 outils concernés dans 19 groupes de recouvrement, dont 5 vrais doublons à traiter (§ 5) | |

Le seul outil PARTIEL est l'assistant `ask` : interrupteur `aiAssistantOnline: false` (`src/config/features.ts:10`), l'onglet n'affiche que « Bientôt disponible » (`src/app/(tabs)/ask.tsx:69`, `src/app/assistant/chat.tsx:61`), mais l'outil reste listé comme outil Premium. Le message est expliqué, ce n'est pas un bouton mort.

Les 20 STATIQUES (tous légitimes) : meal_rankings, preg_eat, bottle_scoops (calculateur), baby_night_help, kid_products (catalogue), emergency, local_ai, library, guides, videos, sources, cycle_advice, cycle_guides, avoid_methods, avoid_emergency, ttc_exams, ttc_understand, pp_body, pp_mental, pp_partner.

## 2. Spécification des « 200 outils » : introuvable dans le dépôt, fournie ensuite par la propriétaire

Recherché dans tous les `.md` de la racine, `docs/`, `docs/audit/`, `scripts/homi`, les CSV, le code et `git log --all` : aucune liste de 200 entrées ni de « 20 extensions candidates ». La liste a été transmise séparément (`liste_200.md`) et traitée dans `A_correspondance_200.csv`. À ne pas confondre : HOMI_FEATURE_MATRIX.md (« système d'exploitation du foyer », dont « Nounou & crèche (12 outils) » avec les mêmes manques : recherche, comparateur, pointage, budget de garde marqués AB = absents) ; les « scripts de vie » numérotés (script 8, 53, 66, 80, 92, 93) cités dans le code, dont la source n'est pas dans le dépôt ; FONCTIONNALITES.md:364 (communauté en 14 catégories).

## 3. Couverture par thème (127 outils + sous-accès)

| Thème | Outils existants (ids) | Couverture | Manques notables |
|---|---|---|---|
| Grossesse | ttc_start_pregnancy, preg_evolution, preg_weight, preg_feel, preg_moves, preg_calendar, preg_names, preg_lists, preg_eat, scan_food ; sous-accès library.pregnancy/birth, guides.work/loss | bonne | pas de suivi tension, glycémie ni minuteur de contractions |
| Post-partum | pp_recovery, pp_checkin, pp_history, pp_body, pp_support, pp_partner, sleep | bonne | reprise de l'intimité et rééducation absentes en suivi (lecture seule) |
| Santé mentale | mood, me_diary, exhaustion_check, pp_mental, pp_support, family_metime, offduty, family_sos | bonne | sans diagnostic, par construction (me/diary.tsx:4) |
| Sommeil | kid_sleep, kid_sleep_rhythm, sleep_help, baby_night_help, family_nights, sleep, guides.kidsleep | bonne | doublons internes (§ 5) |
| Jumeaux/triplés | aucun outil dédié ; modèle multi-enfants (§ 6.1) | partielle | pas de saisie groupée, pas de vue comparée |
| Allaitement | baby_breastfeed (kinds `breastfeed` et `pumping` de `track/[kind].tsx`) | partielle | AGENT_WORKBOARD annonce chronomètre, banque de lait, historique mixte (lot A) : aucune route `/feeding` n'existe, à revérifier |
| Biberons | baby_bottle, baby_bottle_timer, baby_bottle_history, bottle_scoops | bonne | 4 entrées pour 1 donnée |
| Diversification et repas | baby_foods, meals, meal_menu, meal_pantry, meal_rankings, guides.kidfood, scan_food | bonne | |
| Crises et urgences | emergency, family_sos, family_urgent, family_difficult, guides.firstaid | bonne | crises de l'enfant (colères, pleurs) : guides.behaviour seulement |
| Émotions | kid_mood, guides.behaviour | partielle | pas de suivi de colères/émotions par épisode |
| TDAH/TSA/DYS | kid_treatments.needs, kid_steps, kid_school, kid_treatments, articles neuro | bonne en suivi, sans diagnostic (§ 6.2) | |
| Crèche/nounou/école | childcare, kid_school, custody, kid_card, kid_routines, guides.school | bonne | refus scolaire, devoirs : lecture seule |
| Couple/intimité | couple_week, couple_understand, mental_load, family_domains, ttc_intimacy, guides.couple | bonne | intimité hors projet bébé : lecture |
| Père | pp_partner (lecture), family_my_place, couple_*, family_domains | partielle | aucun outil « papa » ; « espace Papa » (AGENT_WORKBOARD, lot C) : aucune route `family/papa*` |
| Parent solo | solo_parent, family_sos, family_urgent | partielle (1 outil riche : cercle de soutien, aides) | |
| Coparentalité | custody, family_calendar, family_tasks, family_missions | partielle | pas de journal d'échanges ni de frais partagés |
| Santé | appointments, consult_questions, documents, health_book, kid_vaccines, kid_health, medications, kid_treatments, summary, scan_*, recall_alerts | bonne | |
| Foyer | family_* (14), reminders, house_notebook, family_papers | bonne | doublons internes |
| Finances | aucun (seul budget de menu dans meal_menu) | absente | budget, dépenses, aides CAF : `guides.work`, `solo_parent` en lecture |
| Autonomie et apprentissage jusqu'à 10 ans | kid_grow, kid_routines, kid_steps, journal, guides.toddler/activities/sport | partielle | pas de tâches/argent de poche par enfant ; routines oui |
| Cycle et fertilité (hors liste demandée) | 28 outils (cycle_*, avoid_*, ttc_*, pma_tracker) | très bonne | |

## 4. Extensions candidates (secondaire : une ligne chacune ; les 10 autres ne sont pas précisées)

La propriétaire n'a nommé que : constipation, énurésie, tétine, prématurité, PMA, deuil périnatal, difficultés de langage, refus scolaire, sécurité numérique, retour d'hospitalisation, « etc. ». Les 10 restantes ne figurent nulle part.

| Extension | État | Taille si à ajouter, réutilisation |
|---|---|---|
| Constipation | partiellement couvert : selles, couleur, consistance (`baby_diaper`, `track/[kind].tsx:18,144-146`), observations (`OBS_VALUES`, ligne 44), suivis personnalisés `kid_health`, guides.illnesses | S : préréglage de suivi dans `kid_health` + fiche, pas d'outil neuf |
| Énurésie | absent (articles `guide/enfant.ts`, `guides.ts`) | S : préréglage `kid_health` (nuits sèches) |
| Tétine / sevrage | absent (articles seulement) | S : préréglage `kid_health` + jalon (`child_milestones`) |
| Prématurité | partiel : guides.neonat (lecture), mention d'âge corrigé dans `sleep/[childId].tsx` et `vaccines.ts` (à vérifier) | M : âge corrigé dans croissance et étapes (`kid_grow`) |
| PMA | couvert : `pma_tracker` + guides.pma | aucun ajout |
| Deuil périnatal | lecture seule : guides.loss ; `pp_support` | S : fiche d'aide dans `pp_support`, pas de suivi (volontairement) |
| Difficultés de langage | couvert : catégorie « langage » de `needs.tsx` + articles neuro | aucun ajout |
| Refus scolaire | absent (guide seulement) | S : guide + observations `kid_school` |
| Sécurité numérique | absent | S : guide ; utilité faible, à ne pas compter |
| Retour d'hospitalisation | absent comme outil ; documents, rendez-vous, `kid_steps` couvrent des morceaux | S : liste de démarches sur le modèle de `kid_steps` |

Ajouts réellement utiles identifiés (hors liste de 200, sans gonfler) : 12 environ. S (8) : constipation, énurésie, tétine/sevrage, deuil périnatal, refus scolaire, retour d'hospitalisation, sécurité numérique (faible), reprise de l'intimité post-partum. M (4) : prématurité/âge corrigé, finances du foyer (budget, dépenses, aides), saisie groupée jumeaux, banque de lait/tirages (si absent après vérification). L (1) : espace Papa. Pour atteindre 200 depuis 127 il faudrait +73 ; seuls ~12 me semblent utiles, le reste serait des doublons ou des préréglages d'un même suivi. Si la liste de la propriétaire se compte en préréglages du suivi générique (`track/[kind].tsx`, `kid_health`), le chiffre 200 devient atteignable sans nouvel écran : c'est à trancher avec sa liste.

## 5. Doublons restants

Vrais doublons (même donnée ou même geste, plusieurs entrées) :
1. D1 : `mood` et `me_diary`, même table `mood_checkins` (`me/diary.tsx:2-4`).
2. D3 : `sleep_help` (`/sleep/help/:id`) et `baby_night_help` (`/night/help`) : deux aides au sommeil.
3. D4 : `family_urgent`, `family_difficult`, `family_sos` créent chacun une demande d'aide (`useCreateRequest`).
4. D9 : règles et symptômes saisissables depuis `/fertility/log` (`ttc_tests`) et `/cycle` (mêmes composants `PeriodLogger`, `SymptomLogger`).
5. D8 : `kid_treatments` et `medications` affichent les mêmes prises (`needs.tsx`, `medications.tsx`).

Recouvrements à surveiller (un geste, plusieurs portes) : D2 biberon ×3 (`/track/bottle`, `/bottle/:id`, `/bottle/history`) ; D5 six listes de choses à faire ; D6 cinq vues de la répartition ; D7 quatre coffres de documents ; D10 quatre écrans de rappels ; D11 trois agendas ; D12 deux journaux de cycle ; D13 assistant IA vs assistant local ; D14 courses vs menu, stocks vs catalogue ; D15 onglet croissance vs « Je grandis » ; D16 résumés. Le groupe de chaque outil est dans la colonne `doublon_groupe` du CSV.

## 6. Spécificités

### 6.1 Jumeaux et triplés : le modèle les supporte, sans outil dédié
- À la création : `multiplicity` `twins`/`triplets` (`lib/journeys/model.ts:116`), `babiesFor` (ligne 134) crée 2 ou 3 lignes `expected_babies` (ligne 150) ; modifiable (`pregnancy/edit.tsx:78-89`) ; suggestions de prénoms (`names.tsx:78`), semaine de grossesse (`pregnancy/index.tsx:109,120`).
- Après la naissance : un profil enfant par bébé, chaque saisie est rattachée à `child_id`. Sessions parallèles réelles : minuteurs de biberon par enfant (`hooks-bottle.ts:18-25`, `bottle/index.tsx:2` « un enfant par ligne (jumeaux, triplés…) ») ; sommeil ouvert par enfant (`hooks.ts:241-244`). Séparation par enfant déclarée testée (FONCTIONNALITES.md:344 ; QA-2026-11-02.md:35, profils de jumeaux).
- Limites : `track/[kind].tsx:416-418` bascule d'un enfant à l'autre par pastilles, sans « noter pour tous » ; pas de vue comparée ni de synchronisation des tétées. Communauté : catégorie « Jumeaux et triplés ».

### 6.2 TDAH, TSA, DYS : présent, sans diagnostic
`child/[id]/needs.tsx` (catégories TDAH, TSA, DYS, langage, TDC, tics, sensoriel, diagnostic en cours ; rendez-vous, bilans, professionnels, observations, école, traitements recopiés de l'ordonnance, aucune dose calculée, en-tête lignes 1-12) ; `child/[id]/steps.tsx` (« Mes démarches », « Aucun diagnostic ici ») ; `child/[id]/school.tsx` ; articles `content/articles/neuro.ts` (TDAH, autisme, dys). Statut OPÉRATIONNEL. Manque : suivi comportemental par épisode (émotions), aménagements scolaires (PAP/PPS) en liste dédiée.

### 6.3 Père et parent solo
Père : aucun outil propre ; `pp_partner` est une lecture (`postpartum/partner.tsx:2-4`, ne lit que ce que la mère partage) ; l'« espace Papa » du plan (AGENT_WORKBOARD, lot C) n'existe pas dans `src/app/family`. Parent solo : `solo_parent` (`family/solo.tsx` 233 lignes : cercle de soutien, aides, gestes) + `family_sos` ; le profil « solo » est un rôle, pas un parcours.

### 6.4 Finances
Absentes comme outil. Seul `meal_menu` gère un budget de repas. Pas de dépenses, de frais partagés, d'aides CAF suivies (lecture dans `solo_parent` et guides.work).

## 7. Boutons visibles sans action et mentions « bientôt »

Recherche de `onPress={() => {}}`, `undefined`, TODO, FIXME, « bientôt », `disabled` dans `src` (hors tests) : aucun bouton mort dans les écrans d'outils. Restes :
- `ask` : écran « Bientôt disponible », interrupteur coupé (§ 1) ; `settings/subscription.tsx:106` « Achats bientôt disponibles » (bannière).
- Mentions « bientôt » de sous-fonctions : `family/missions/new.tsx:247` (animal, `mis.form.pet`) ; `features/stocks/StockForm.tsx:89` (animal associé) ; `meals/shopping.tsx:160` (photo du produit) ; `components/Fertility.tsx:472` (« Articles bientôt disponibles », état vide).
- `onPress={() => undefined}` + `disabled` : uniquement dans `app/dev/glass.tsx:231` et `features/discover/DemoKinds.tsx:136`, `DemoCustom.tsx:260` (démos, voulu).
- `src/features/scene/controls.tsx:5-8` : 3 TODO de design system (sans effet sur l'utilisateur).
- Orphelin : `/community/saved` n'est référencé nulle part ; l'onglet « Enregistrés » de `(tabs)/community.tsx:35-40` couvre le besoin.

## 8. Constats principaux
1. La spécification « 200 outils » n'existe pas dans le dépôt ; confrontée à la liste de la propriétaire : 131 numéros OPÉRATIONNELS, 36 PARTIELS, 28 ABSENTS, 5 DOUBLON_LISTE. L'existant compte 127 outils (+7 compte, +26 sous-accès).
2. 106 outils sur 127 sont OPÉRATIONNELS dans le code, 20 STATIQUES légitimes, 1 PARTIEL (`ask`).
3. L'assistant IA est éteint (`config/features.ts:10`) mais encore listé : décision produit à expliciter.
4. Aucun bouton mort ; quatre « bientôt » de sous-fonctions (animal ×2, photo produit, articles).
5. 5 vrais doublons (humeur/journal, deux aides sommeil, trois modes surcharge, saisies de cycle, traitements).
6. Jumeaux : modèle correct et sessions parallèles par enfant ; pas de saisie groupée.
7. TDAH/TSA/DYS : couvert, sans diagnostic ; manque le suivi par épisode.
8. Père : pas d'outil ; « espace Papa » prévu au plan, absent. Allaitement : une seule entrée ; banque de lait à vérifier.
9. Finances : thème entièrement absent ; autonomie jusqu'à 10 ans seulement partielle.
10. Suivi de la refonte : `inventory-status.json` ne couvre que 10 outils sur 127 ; les rejeux de saisie de novembre (13 « bloqués ») sont antérieurs à la refonte du 17-18/11 : une non-régression complète reste à rejouer sur l'application, ce que cette lecture de code ne remplace pas.
