# HOMI — Inventaire QA des outils (24/11/2026)

Environnement : **export web de l'application (Chromium 390 × 844), moteur de démonstration local avec Premium actif**.
Ce n'est **pas** un test sur iPhone. ✅ = prouvé par une écriture relue dans les données de l'appareil (ou absence
d'erreur pour l'ouverture) ; — = non vérifié ; ❌ = échec constaté.

- Ouverture : chaque outil ouvert depuis son adresse du catalogue ; échec si écran Premium, page introuvable, erreur
  JavaScript ou clé de traduction brute.
- Création / persistance : nombre de lignes des tables avant / après, puis rechargement de la page.
- Parcours ciblés : 34 outils (détail dans la colonne Preuve).

## Totaux

| Mesure | Résultat |
|---|---|
| Outils inventoriés | 128 |
| Ouverture sans erreur | 128 / 128 |
| Création prouvée | 48 |
| Modification prouvée | 7 |
| Suppression prouvée | 6 |
| Persistance prouvée | 45 |
| Saisie non vérifiée (formulaire spécifique) | 23 |
| Écrans de consultation (pas de saisie) | 56 |

## Détail

| Outil | Adresse | Ouverture | Création | Modification | Suppression | Persistance | Preuve |
|---|---|---|---|---|---|---|---|
| Repas et recettes | `/meals?for=avoid&child=:id` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Menu de la semaine | `/meals/menu` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Cuisiner avec ce que j’ai | `/meals/pantry` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Scanner un aliment | `/scanner/food` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Mon sommeil | `/me/sleep` | ✅ | — | ✅ | — | ✅ | nuit existante modifiée (coucher 22:40) et retrouvée après rechargement |
| Scanner un produit | `/scanner/product` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Produits scannés | `/scanner/history` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Comparer deux produits | `/scanner/compare` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Rendez-vous et examens | `/appointments?child=:id` | ✅ | ✅ | — | — | ✅ | rendez-vous (intitulé, heure) + rappel créés, après rechargement |
| Mes questions pour le rendez-vous | `/consult/questions?child=:id` | ✅ | ✅ | — | — | ✅ | banc automatique : bouton «  » → consultation_questions:1 ; saisie visible après rechargement |
| Documents de santé | `/documents?child=:id` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Carnet de santé | `/documents/book` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Médicaments | `/medications` | ✅ | ✅ | ✅ | ✅ | ✅ | traitement + rappel créés, renommé, supprimé (rappel retiré), après rechargement ; heure obligatoire signalée |
| Mon humeur | `/me/mood` | ✅ | ✅ | — | — | ✅ | bilan « Plutôt bien » enregistré, après rechargement |
| Mon journal intime | `/me/diary` | ✅ | ✅ | — | — | ✅ | humeur puis page écrite, retrouvée après rechargement |
| Point sur ma fatigue | `/family/exhausted` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Produits à éviter | `/scanner/avoid` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Alertes de rappel de produits | `/scanner/recalls` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Urgences | `/emergency` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Assistant | `/(tabs)/ask` | ✅ | ✅ | — | — | ✅ | « Lina vient de boire 120 ml » → une confirmation → biberon enregistré (bug corrigé : Aura demandait l’enfant) |
| Assistant hors ligne | `/assistant/local` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Bibliothèque | `/library` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Guides pratiques | `/guide` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Vidéos et tutos | `/videos` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Sources et références | `/sources` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Mon cycle | `/cycle?all=1` | ✅ | ✅ | — | — | — | « Noter mes règles » crée l’entrée |
| Calendrier du cycle | `/cycle/calendar` | ✅ | ✅ | — | — | ✅ | banc automatique : bouton « Mes règles commencent ce jour » → period_entries:1 ; saisie non affichée avec le texte de test (valeurs numériques ou liste ailleurs) |
| Symptômes du cycle | `/cycle/symptoms` | ✅ | ✅ | ❌ | ❌ | ✅ | banc automatique : saisie en ligne → symptom_logs:1 ; saisie visible après rechargement |
| Douleurs | `/cycle/pain` | ✅ | ✅ | — | — | ✅ | intensité réglée (bouton Augmenter) puis enregistrée ; sans intensité : message |
| Pertes vaginales | `/cycle/discharge` | ✅ | ✅ | — | — | ✅ | observation en 3 étapes enregistrée |
| Saignements inhabituels | `/cycle/bleeding` | ✅ | ✅ | — | — | ✅ | saignement « entre les règles » enregistré ; type obligatoire |
| Statistiques du cycle | `/cycle/stats` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Mes conseils du cycle | `/cycle/advice` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Résumé du mois | `/cycle/month` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Exporter mon suivi du cycle | `/cycle/export` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Guides du cycle | `/cycle/guides` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Trousse de règles | `/cycle/kit` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Ma contraception | `/contraception` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Comparer les contraceptions | `/contraception/methods` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Contraception d’urgence | `/contraception/emergency` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Rappels de contraception | `/contraception/reminders` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Préparer ma consultation de contraception | `/contraception/consultation` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Journal de ma contraception | `/contraception/journal` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Rapports | `/cycle/intimacy` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Démarrer ma grossesse | `/pregnancy/start` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Répartition de la charge mentale | `/family/load` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Confier un domaine | `/family/domains` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Point de couple | `/family/couple` | ✅ | ✅ | — | — | ✅ | banc automatique : bouton « Enregistrer » → couple_checkins:1 ; saisie non affichée avec le texte de test (valeurs numériques ou liste ailleurs) |
| Se comprendre | `/family/understand` | ✅ | ✅ | — | — | ✅ | message à Sam envoyé après confirmation « Oui, envoyer » |
| Temps pour soi | `/family/me-time` | ✅ | ✅ | — | — | — | prochain créneau réservé (garde planifiée) |
| Je décroche | `/family/offduty` | ✅ | ✅ | — | — | — | « Je décroche » crée la période et la demande de relais |
| Journée difficile | `/family/difficult` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Parent solo | `/family/solo` | ✅ | ✅ | — | — | ✅ | personne du cercle d’entraide ajoutée (nom, téléphone, aide « nuits ») |
| Agenda familial | `/calendar` | ✅ | ✅ | — | — | ✅ | banc automatique : bouton «  » → family_events:1 ; saisie visible après rechargement |
| Tâches du foyer | `/family` | ✅ | ✅ | — | — | ✅ | tâche rapide ajoutée, après rechargement |
| Missions familiales | `/family/missions` | ✅ | ✅ | — | — | ✅ | mission en 3 étapes envoyée (notification à l’autre parent) |
| Ma place dans la famille | `/family/my-place` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Routines du foyer | `/family/routines` | ✅ | ✅ | ✅ | ✅ | ✅ | banc automatique : bouton «  » → routines:1 ; saisie visible après rechargement |
| Vider ma tête | `/family/brain-dump` | ✅ | ✅ | — | — | ✅ | 2 idées triées puis 2 tâches créées après vérification |
| 3 choses aujourd’hui | `/family/focus` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Échéances à préparer | `/family/prep` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Liste de courses | `/meals/shopping` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Stocks du foyer | `/family/stocks` | ✅ | ✅ | — | — | ✅ | banc automatique : bouton «  » → household_stocks:1 household_events:1 ; saisie visible après rechargement |
| Carnet de la maison | `/family/notebook` | ✅ | ✅ | — | — | ✅ | banc automatique : bouton «  » → house_notes:1 ; saisie visible après rechargement |
| Papiers de la famille | `/family/papers` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Rappels | `/settings/reminders` | ✅ | ✅ | — | — | ✅ | banc automatique : bouton « Ajouter » → reminders:1 ; saisie non affichée avec le texte de test (valeurs numériques ou liste ailleurs) |
| Sorties en famille | `/outings` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Communauté | `/(tabs)/community?space=eviter-grossesse` | ✅ | ✅ | — | — | ✅ | publication (catégorie, titre, texte) retrouvée après rechargement |
| Cycle et période fertile | `/fertility` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Tests d’ovulation et de grossesse | `/fertility/log` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Glaire cervicale | `/fertility/mucus` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Température au réveil | `/fertility/body` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Examens de fertilité | `/fertility/exams` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Comprendre mon cycle | `/fertility/understand` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Préparer ma consultation de fertilité | `/fertility/consultation` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Rappels du projet bébé | `/fertility/reminders` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Suivi de PMA | `/fertility/pma` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Idées de prénoms | `/names` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Journal du cycle | `/cycle/journal` | ✅ | ✅ | — | ❌ | ✅ | banc automatique : saisie en ligne → cycle_journal:1 ; saisie visible après rechargement |
| Guide des produits pour enfants | `/products` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Bien manger enceinte | `/pregnancy/eat` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Relais de nuit | `/family/nights` | ✅ | ✅ | — | — | ✅ | banc automatique : bouton « Noter le biberon » → bottles:1 bottle_timers:1 ; saisie non affichée avec le texte de test (valeurs numériques ou liste ailleurs) |
| Résumés | `/summary` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Ma grossesse semaine par semaine | `/pregnancy` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Mon poids pendant la grossesse | `/pregnancy/weight` | ✅ | ✅ | — | — | ✅ | pesée ajoutée en un appui |
| Mes symptômes de grossesse | `/pregnancy/feel` | ✅ | ✅ | — | — | ✅ | symptôme « Fatigue » enregistré ; enregistrement vide refusé avec message |
| Mouvements de bébé | `/pregnancy/moves` | ✅ | ✅ | — | — | ✅ | mouvements « habituels » enregistrés |
| Calendrier de grossesse | `/pregnancy/calendar` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Listes de préparation | `/lists` | ✅ | ✅ | — | — | ✅ | banc automatique : bouton «  » → checklists:1 ; saisie visible après rechargement |
| Allaitement | `/track/breastfeed?child=:id` | ✅ | ✅ | — | — | ✅ | départ / arrêt ; jumeaux : deux tétées simultanées indépendantes, arrêt de l’une sans toucher l’autre, après rechargement |
| Journée des biberons | `/bottle/:id` | ✅ | ✅ | ✅ | ✅ | ✅ | biberon rapide ; correction 180 → 190 ml ; suppression ; historique ouvert sans saisie |
| Compteur de mesurettes | `/bottle/scoops` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Ma récupération après la naissance | `/postpartum` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Mon point du jour | `/postpartum/checkin` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Mon évolution | `/postpartum/history` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Cicatrisation et rééducation | `/postpartum/recovery` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Baby blues et dépression du post-partum | `/postpartum/understand` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Trouver de l’aide | `/postpartum/support` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Espace du co-parent | `/postpartum/partner` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Mode urgence du foyer | `/family/urgent` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Je craque | `/family/sos` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Noter un biberon | `/track/bottle?child=:id` | ✅ | ✅ | ✅ | ✅ | ✅ | même saisie que le minuteur (écran de modification /track/bottle) |
| Historique des biberons | `/bottle/history?child=:id` | ✅ | ✅ | ✅ | ✅ | ✅ | historique accessible directement ; boutons Modifier / Supprimer testés |
| Diversification alimentaire | `/child/:id/discoveries` | ✅ | ✅ | ✅ | — | ✅ | dégustation ajoutée ; note modifiée et retrouvée après rechargement |
| Classement des recettes | `/meals/rankings` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Sommeil de l’enfant | `/night?child=:id` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Planning de sommeil | `/sleep/:id` | ✅ | ✅ | — | — | ✅ | sieste démarrée, en cours après rechargement, arrêtée (début et fin enregistrés) |
| Aide au sommeil | `/sleep/help/:id` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Bilan de la nuit | `/night/help?child=:id` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Suivi de la journée | `/(tabs)/track` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Couches | `/track/diaper?child=:id` | ✅ | ✅ | — | — | ✅ | couche « pipi » en un appui, après rechargement |
| Dents | `/teeth?child=:id` | ✅ | ✅ | — | — | ✅ | dent notée depuis le schéma |
| Journal complet | `/journal` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Fiche de l’enfant | `/child/:id` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Étapes du développement | `/child/:id/grow` | ✅ | ✅ | — | — | ✅ | étape « marche » notée, après rechargement |
| Humeur et émotions de l’enfant | `/child/:id/wellbeing` | ✅ | ✅ | — | — | — | humeur de l’enfant en un appui |
| Album photo | `/child/:id/album` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Vaccins | `/child/:id/vaccines` | ✅ | ✅ | — | — | ✅ | vaccin ajouté (nom, date du jour), après rechargement |
| Suivi de santé de l’enfant | `/child/:id/health-tracking` | ✅ | ✅ | — | — | ✅ | température 38,6 (virgule) enregistrée ; 48 °C refusé avec message |
| Traitements de l’enfant | `/child/:id/needs?tab=treatments` | ✅ | ✅ | — | — | ✅ | traitement + rappel de l’enfant créés (même composant que Médicaments, modifié / supprimé là-bas) |
| École ou mode de garde | `/child/:id/school` | ✅ | ✅ | — | ✅ | ✅ | banc automatique : saisie en ligne → child_need_entries:1 ; saisie visible après rechargement |
| Fiche à transmettre | `/child/:id/card` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Garde alternée | `/family/custody` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Garde et nounou | `/garde` | ✅ | — | — | — | — | saisie NON vérifiée par le banc (formulaire spécifique) : à tester |
| Démarches de l’enfant | `/child/:id/steps` | ✅ | ✅ | — | — | ✅ | banc automatique : bouton «  » → checklists:1 checklist_items:10 ; saisie non affichée avec le texte de test (valeurs numériques ou liste ailleurs) |
| Routines en images | `/family/kid-routines` | ✅ | ✅ | — | — | ✅ | banc automatique : bouton «  » → kid_routines:1 ; saisie visible après rechargement |
| Bilan de la semaine | `/family/review` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
| Historique des tâches | `/family/history` | ✅ | — | — | — | — | écran de consultation / contenu : ouverture seule vérifiée |
