# HOMI — connaissance produit (générée le 2026-11-27, ne pas éditer à la main)

Source : code de l'app (catalogue `homiTools`, `src/lib/aura/intents.ts`) et du site (`web/site/*.mjs`). Régénérer : `node scripts/web/gen-knowledge.mjs`.
Règle : ne présenter sur le site QUE ce qui figure ici. Le contenu santé de la bibliothèque est « à vérifier » : jamais publié sans relecture professionnelle.

## Outils de l'app (121)
### Alimentation et allaitement (12)
- `meals` Repas et recettes — Trouve des idées de repas et des recettes adaptées au profil, à l’âge et aux allergies.
- `meal_menu` Menu de la semaine — Compose un menu sur plusieurs jours selon ton budget, puis génère la liste de courses.
- `meal_pantry` Cuisiner avec ce que j’ai — Coche les ingrédients que tu as à la maison pour voir les recettes possibles.
- `scan_food` Scanner un aliment — Scanne le code-barres d’un aliment pour savoir s’il convient au profil affiché.
- `preg_eat` Bien manger enceinte — Vérifie ce que tu peux manger enceinte et pourquoi certains aliments sont déconseillés.
- `baby_breastfeed` Allaitement — Chronomètre chaque tétée et note le sein donné pour savoir où tu en es à la suivante.
- `baby_bottle_timer` Journée des biberons — Suis les biberons de la journée et l’heure prévue du prochain, avec un rappel au besoin.
- `bottle_scoops` Compteur de mesurettes — Compte les mesurettes de lait en poudre une à une pour ne plus perdre le fil du biberon.
- `baby_bottle` Noter un biberon — Enregistre un biberon en un geste et vois le total bu par bébé dans la journée.
- `baby_bottle_history` Historique des biberons — Compare les quantités bues ces derniers jours pour repérer une baisse ou une hausse.
- `baby_foods` Diversification alimentaire — Note les aliments que ton enfant découvre, ses réactions, et des idées pour la suite.
- `meal_rankings` Classement des recettes — Trie les recettes par note, par prix ou par rapidité pour choisir plus vite.

### Sommeil et réveils (6)
- `sleep` Mon sommeil — Note tes nuits pour suivre ta fatigue et voir ce qui change d’une semaine à l’autre.
- `family_nights` Relais de nuit — Organise les tours de nuit entre les parents pour mieux partager les réveils du bébé.
- `kid_sleep` Sommeil de l’enfant — Note les siestes, les nuits et les réveils de ton enfant pour voir comment il dort vraiment.
- `kid_sleep_rhythm` Planning de sommeil — Vois l’heure estimée de la prochaine sieste et du coucher, et les tendances récentes.
- `sleep_help` Aide au sommeil — Fais le point sur sept jours de sommeil et reçois des pistes douces pour les nuits.
- `baby_night_help` Bilan de la nuit — Retrouve le résumé de la nuit de bébé, des repères selon son âge et tes questions au médecin.

### Soins, quotidien et croissance (12)
- `scan_product` Scanner un produit — Scanne le code-barres d’une crème, de lingettes ou d’une lessive pour lire sa composition.
- `scan_history` Produits scannés — Retrouve les produits déjà scannés et ceux que tu as mis de côté.
- `scan_compare` Comparer deux produits — Mets deux produits scannés côte à côte pour comparer leur composition avant d’acheter.
- `kid_products` Guide des produits pour enfants — Parcours un catalogue de produits pour enfants : composition, âge indiqué, prix relevés.
- `baby_daily` Suivi de la journée — Vois toute la journée de bébé sur un seul fil : repas, sommeil et changes.
- `baby_diaper` Couches — Note chaque change, mouillé ou selles, pour vérifier que bébé élimine bien.
- `kid_teeth` Dents — Note la date d’apparition de chaque dent de lait sur un schéma de la bouche.
- `journal` Journal complet — Retrouve tout ce qui a été noté dans une chronologie à filtrer ou à exporter.
- `kid_profile` Fiche de l’enfant — Retrouve sur une seule page la croissance, les étapes et les souvenirs de ton enfant.
- `kid_grow` Étapes du développement — Suis les acquisitions de ton enfant, à son rythme, avec des repères par âge.
- `kid_mood` Humeur et émotions de l’enfant — Décris l’humeur et les émotions de ton enfant jour après jour pour repérer ce qui revient.
- `kid_album` Album photo — Range les photos de ton enfant mois par mois, visibles du foyer ou de toi seul.

### Santé, rendez-vous et conseils (22)
- `appointments` Rendez-vous et examens — Garde tous les rendez-vous médicaux et les examens au même endroit, avec leurs rappels.
- `consult_questions` Mes questions pour le rendez-vous — Note tes questions dès qu’elles te viennent pour ne rien oublier le jour de la consultation.
- `documents` Documents de santé — Range comptes rendus, échographies et ordonnances pour les retrouver et les partager.
- `health_book` Carnet de santé — Consulte une vue organisée des documents de santé enregistrés, profil par profil.
- `medications` Médicaments — Coche les prises de médicaments de toute la famille et reçois un rappel à l’heure prévue.
- `mood` Mon humeur — Note ton humeur en un geste et repère ce qui l’influence au fil des jours.
- `me_diary` Mon journal intime — Écris tes pages du jour dans un journal privé, visible de toi seul.
- `exhaustion_check` Point sur ma fatigue — Situe ta fatigue ressentie en six questions et vois des pistes concrètes, sans diagnostic.
- `scan_avoid` Produits à éviter — Tiens la liste des produits et des ingrédients à éviter, ajoutés à la main ou après un scan.
- `recall_alerts` Alertes de rappel de produits — Sois prévenu si un produit que tu as scanné fait l’objet d’un rappel officiel.
- `emergency` Urgences — Appelle le bon numéro d’urgence en un geste : 15, 112 ou 3114.
- `ask` Assistant — Pose ta question à l’assistant et retrouve tes conversations et des suggestions.
- `local_ai` Assistant hors ligne — Obtiens des réponses tirées des articles de HOMI, même sans connexion internet.
- `library` Bibliothèque — Lis des articles sourcés sur la santé, la grossesse et l’enfant, selon ton parcours.
- `guides` Guides pratiques — Parcours des fiches rangées par besoin : maladies, premiers secours, sommeil, école, droits.
- `videos` Vidéos et tutos — Regarde des vidéos officielles et des tutos qui montrent les gestes pas à pas.
- `sources` Sources et références — Consulte les institutions et les publications sur lesquelles s’appuient les contenus de HOMI.
- `summary` Résumés — Obtiens un résumé du jour, de la semaine ou d’avant rendez-vous à partir de ce qui a été noté.
- `kid_vaccines` Vaccins — Vois les prochaines échéances du calendrier vaccinal et note les vaccins faits.
- `kid_health` Suivi de santé de l’enfant — Note la température et les symptômes de ton enfant pour les montrer au médecin.
- `kid_treatments` Traitements de l’enfant — Suis les traitements prescrits à ton enfant : prise notée, reportée ou ignorée, avec rappel.
- `kid_steps` Démarches de l’enfant — Suis les rendez-vous, les bilans et les dossiers à déposer pour ton enfant.

### Cycle et fertilité (22)
- `cycle_home` Mon cycle — Note tes règles et retrouve tout le suivi de ton cycle, avec les prochaines dates estimées.
- `cycle_calendar` Calendrier du cycle — Vois mois par mois tes règles, la période fertile estimée et les symptômes notés.
- `cycle_symptoms` Symptômes du cycle — Note crampes, fatigue ou humeur pour les relier aux moments de ton cycle.
- `cycle_pain` Douleurs — Décris tes douleurs, leur intensité et leur zone pour suivre leur évolution au fil des cycles.
- `cycle_discharge` Pertes vaginales — Note l’aspect de tes pertes pour repérer un changement et savoir quand demander un avis.
- `cycle_bleeding` Saignements inhabituels — Note un saignement en dehors des règles et vois tout de suite s’il faut consulter.
- `cycle_stats` Statistiques du cycle — Consulte la durée de tes cycles et de tes règles, et leurs variations dans le temps.
- `cycle_advice` Mes conseils du cycle — Lis les conseils calculés à partir de tes saisies récentes, du plus pressant au plus léger.
- `cycle_month` Résumé du mois — Relis les faits notés ce mois-ci, règles, symptômes et humeurs, et garde-les en PDF.
- `cycle_export` Exporter mon suivi du cycle — Crée un PDF de ton suivi, sur la période choisie, pour toi ou pour une consultation.
- `cycle_guides` Guides du cycle — Lis des guides clairs sur le cycle, les règles et leurs troubles.
- `cycle_kit` Trousse de règles — Reçois un rappel deux jours avant tes règles estimées et prépare la liste de ton sac.
- `ttc_cycle` Cycle et période fertile — Suis ton cycle et vois la période fertile estimée quand tu as un projet de bébé.
- `ttc_tests` Tests d’ovulation et de grossesse — Enregistre le résultat de tes tests d’ovulation et de grossesse, avec une photo au besoin.
- `ttc_mucus` Glaire cervicale — Note l’aspect de ta glaire cervicale pour repérer l’approche de la période fertile.
- `ttc_temperature` Température au réveil — Relève ta température au réveil, si tu le souhaites, pour suivre sa courbe sur le cycle.
- `ttc_intimacy` Rapports — Note tes rapports dans un journal privé, visible de toi seule.
- `ttc_exams` Examens de fertilité — Suis les examens demandés pour ton bilan de fertilité et range leurs résultats.
- `ttc_understand` Comprendre mon cycle — Comprends les phases du cycle et l’ovulation avec des explications simples.
- `ttc_consult` Préparer ma consultation de fertilité — Arrive à la consultation de fertilité avec tes cycles, examens et questions déjà notés.
- `ttc_reminders` Rappels du projet bébé — Programme tes rappels de tests, de traitements ou de rendez-vous liés au projet de bébé.
- `pma_tracker` Suivi de PMA — Suis les traitements, les prises et les étapes de ton protocole de procréation assistée.

### Grossesse et post-partum (15)
- `ttc_start_pregnancy` Démarrer ma grossesse — Tu as un test positif : démarre le suivi de ta grossesse avec la date de tes règles.
- `preg_names` Idées de prénoms — Garde tes idées de prénoms et choisissez-les à deux en comparant vos préférences.
- `preg_evolution` Ma grossesse semaine par semaine — Suis la semaine en cours, le terme et l’évolution de ton bébé pendant la grossesse.
- `preg_weight` Mon poids pendant la grossesse — Note ton poids au fil de la grossesse et suis sa courbe, sans pression.
- `preg_feel` Mes symptômes de grossesse — Note ce que tu ressens aujourd’hui pour en parler à ton prochain rendez-vous.
- `preg_moves` Mouvements de bébé — Note les moments où tu sens bébé bouger pour connaître ses habitudes.
- `preg_calendar` Calendrier de grossesse — Vois les périodes indicatives des trois échographies et ajoute tes vrais rendez-vous.
- `preg_lists` Listes de préparation — Coche la valise de maternité, les achats et les démarches à faire avant la naissance.
- `pp_recovery` Ma récupération après la naissance — Retrouve ton espace après l’accouchement : ta forme, tes soins, tes repères.
- `pp_checkin` Mon point du jour — Note chaque jour ton humeur, ton sommeil et tes douleurs depuis la naissance.
- `pp_history` Mon évolution — Suis sur deux semaines l’évolution de ton humeur, de ton sommeil et de tes douleurs.
- `pp_body` Cicatrisation et rééducation — Suis ta cicatrisation et les étapes de la rééducation du périnée et des abdominaux.
- `pp_mental` Baby blues et dépression du post-partum — Lis des repères pour distinguer baby blues et dépression du post-partum, sans diagnostic.
- `pp_support` Trouver de l’aide — Trouve à qui parler et les numéros utiles quand le moral flanche après la naissance.
- `pp_partner` Espace du co-parent — Aide l’autre parent à comprendre le post-partum et à te soutenir, selon ce que tu partages.

### Couple et foyer (11)
- `mental_load` Répartition de la charge mentale — Vois qui pense à quoi et qui fait quoi dans le foyer pour rééquilibrer à deux.
- `family_domains` Confier un domaine — Confie un domaine entier du foyer à une personne, qui en reçoit alors les tâches par défaut.
- `couple_week` Point de couple — Prends dix minutes à deux pour préparer la semaine à venir et vous dire ce qui compte.
- `couple_understand` Se comprendre — Dis à l’autre parent ce que tu ressens, avec des mots préparés et sans reproche.
- `family_metime` Temps pour soi — Réserve un moment pour toi dans l’agenda pendant que l’autre parent prend le relais.
- `offduty` Je décroche — Décroche quelques heures : l’autre parent est prévenu et tes rappels non médicaux s’arrêtent.
- `family_difficult` Journée difficile — Garde l’essentiel de la journée, reporte le reste et demande de l’aide en un geste.
- `solo_parent` Parent solo — Retrouve les aides, les gestes et les relais utiles quand tu élèves seul tes enfants.
- `family_urgent` Mode urgence du foyer — Passe à un écran minimal, avec seulement l’essentiel, quand la surcharge est trop forte.
- `family_sos` Je craque — Quand les pleurs ne s’arrêtent plus : pose bébé en sécurité, respire, appelle quelqu’un.
- `family_review` Bilan de la semaine — Regarde ce qui a été fait cette semaine dans le foyer, et par qui.

### Organisation familiale (15)
- `family_calendar` Agenda familial — Réunis dans un agenda commun les rendez-vous, l’école, les gardes et les relais.
- `family_tasks` Tâches du foyer — Répartis les tâches du foyer et suis ce qui reste à faire aujourd’hui.
- `family_missions` Missions familiales — Demande un coup de main à un membre du foyer et suis la mission jusqu’au bout.
- `family_my_place` Ma place dans la famille — Retrouve tes enfants, tes missions et l’organisation partagée du foyer sur une seule page.
- `family_routines` Routines du foyer — Crée les routines qui reviennent chaque jour ou chaque semaine, partagées et rappelées.
- `brain_dump` Vider ma tête — Note en vrac tout ce qui te trotte dans la tête ; HOMI le range en tâches et en échéances.
- `focus_day` 3 choses aujourd’hui — Trois priorités au plus et dix minutes pour démarrer ; le reste attend.
- `family_prep` Échéances à préparer — Prépare à l’avance la rentrée, les vacances, les anniversaires et les papiers à rendre.
- `family_shopping` Liste de courses — Tiens une liste de courses partagée avec le foyer, mise à jour en temps réel.
- `family_stocks` Stocks du foyer — Suis ce qu’il reste de couches, de lait ou de lessive et ajoute-le aux courses à temps.
- `house_notebook` Carnet de la maison — Rassemble codes, contacts, tailles et habitudes du foyer pour qu’ils soient à portée de tous.
- `family_papers` Papiers de la famille — Photographie tes papiers et constitue des dossiers prêts pour tes démarches.
- `reminders` Rappels — Programme les rappels utiles au foyer et choisis l’heure à laquelle ils arrivent.
- `nearby` Sorties en famille — Trouve des lieux publics adaptés aux familles près de chez toi.
- `family_history` Historique des tâches — Retrouve qui a fait quoi dans le foyer, semaine après semaine.

### Communauté (1)
- `community` Communauté — Échange avec d’autres parents dans le forum conseillé pour ton parcours.

### École, crèche et garde (5)
- `kid_school` École ou mode de garde — Note l’établissement, la classe, les contacts et les aménagements décidés pour ton enfant.
- `kid_card` Fiche à transmettre — Prépare une fiche avec les allergies et les habitudes de ton enfant pour qui le garde.
- `custody` Garde alternée — Vois chez qui est l’enfant aujourd’hui et prépare la prochaine passation entre les foyers.
- `childcare` Garde et nounou — Suis la journée de ton enfant chez la nounou : carnet de liaison, photos et messages.
- `kid_routines` Routines en images — Routines du matin et du soir en images, à imprimer et afficher, sans écran.

## Aura : actions reconnues sans IA (26)
`open_tool`, `fix_sleep_end`, `prepare_relay`, `add_measure`, `switch_child`, `profile_tools`, `log_sleep`, `log_bottle`, `sleep_today`, `add_appointment`, `assign_task`, `start_breastfeed`, `med_check`, `bottles_today`, `last_diaper`, `feeds_today`, `print_support`, `routine_help`, `vision`, `log_diaper`, `log_sleep_for`, `log_feed_for`, `multi`, `start_sleep`, `end_sleep`, `open_story`
Limites : pas professionnelle de santé, aucun diagnostic, aucune dose ; rien n'est enregistré sans validation.

## Pages du site
- Piliers : /telecharger, /grossesse-bebe, /couple-charge-mentale, /communaute, /a-propos, /presse, /tarifs
- Univers (SEO) : /application-grossesse, /application-suivi-bebe, /application-sommeil-bebe, /application-biberon-allaitement, /application-diversification-alimentaire, /application-carnet-sante-bebe, /application-post-partum, /application-cycle-fertilite, /application-organisation-familiale, /application-charge-mentale-couple, /application-coparentalite, /application-garde-nounou-creche, /scanner-produits-bebe, /fatigue-parentale, /album-photo-bebe
- Outils gratuits : /outils/checklist-naissance, /outils/repartition-charge-mentale
- Aussi : /, /aura, /fonctionnalites, /blog (215 articles non médicaux), /ambassadeurs, /contact, pages légales
