# Prompts ChatGPT — icônes HOMI

Inventaire réel du dépôt : 1 icône d'app, 1 logo, 1 symbole Aura, 22 pictogrammes d'interface et **134 logos d'outils** (registre `src/lib/journeys/tools.ts`). Les autres entrées du catalogue (fonctions `h200_*`, raccourcis) réutilisent ces logos.

Conseils : générer d'abord 3 outils tests (Allaitement, Sommeil, Calendrier de grossesse) pour valider le style, puis le reste. Demander toujours « même style que les précédentes ». Renvoyer chaque PNG avec son identifiant comme nom de fichier (ex. `baby_breastfeed.png`).

Style commun (à coller une seule fois en début de conversation ChatGPT, puis envoyer les prompts un par un) :

> Tu crées une famille d'icônes pour HOMI, une app iPhone française qui accompagne les familles de la grossesse aux 10 ans de l'enfant. Chaque icône ressemble à une icône d'app iOS premium (style iOS 26 « Liquid Glass ») : carré aux coins continus (squircle) de 1024 × 1024 px, fond uni de la couleur de catégorie indiquée avec un léger dégradé vertical (plus clair en haut), un symbole UNIQUE, simple et original au centre, en blanc cassé #FFF8F2 avec un second ton translucide, épaisseur de trait régulière, silhouette lisible à 40 px, marges de 18 % autour du symbole, un reflet doux en haut à gauche, une fine arête lumineuse sur le bord et une ombre interne légère. Pas de texte, pas de lettre, pas de visage réaliste, pas de cadre supplémentaire, pas de fond transparent, pas d'ombre portée hors du carré. Même éclairage, mêmes proportions et même niveau de détail pour toute la famille. Livre un PNG 1024 × 1024.

## 1. Icône de l'app

> Icône d'app iOS premium 1024 × 1024 pour HOMI, app familiale chaleureuse. Symbole original identifiable sans texte qui évoque une famille qui s'accompagne (deux silhouettes abstraites qui se protègent, ou une maison douce formée par deux arcs qui s'enlacent). Fond crème rosé #FBF1EA avec halo corail et lavande très doux, symbole en prune profond #3A1F2B avec une lentille de verre Liquid Glass translucide, reflet en haut à gauche, arête lumineuse fine. Lisible à 40 px. Livre aussi une variante sombre (fond prune nuit #1C1218, symbole crème) et une variante monochrome teintable (symbole blanc sur fond noir). Pas de texte.

## 2. Logo HOMI (symbole + mot)

> Logo horizontal pour HOMI : le symbole de l'icône à gauche, puis le mot « HOMI » en capitales, typographie sans empattement géométrique et chaleureuse (proche de Manrope ExtraBold), lettrage légèrement resserré, couleur prune #3A1F2B, fond transparent. Variantes : sur fond clair, sur fond sombre (crème), et monochrome. SVG ou PNG 2048 px de large.

## 3. Aura (assistante IA)

> Symbole pour « Aura », l'assistante IA de HOMI : une lentille de verre bleu nuit #1E2A4A, ronde, avec trois points de lumière intérieurs (corail #F08A6C, ambre #F2B65A, lagon #4FB3BF) qui donnent une impression de présence calme et bienveillante. Style Liquid Glass, reflet doux, pas de visage, pas de robot, pas d'étincelles génériques d'IA. PNG 1024 × 1024 sur fond transparent, plus une version dans un squircle bleu nuit.

## 4. Pictogrammes d'interface (boutons, barre d'onglets)

Style commun pictogrammes :

> Pictogramme d'interface iOS, trait arrondi 2 px sur une grille 24 × 24, coins arrondis, style cohérent avec SF Symbols mais original, couleur unie #3A1F2B sur fond transparent, plus une version « active » remplie. Lisible à 20 px. SVG.

| Usage | Prompt |
|---|---|
| Onglet Aujourd'hui | Pictogramme : un soleil simple avec 8 rayons courts. |
| Onglet Moi | Pictogramme : une silhouette de buste ronde. |
| Bouton central Ajouter | Pictogramme : un plus épais aux extrémités arrondies. |
| Onglet Enfant | Pictogramme : un visage d'enfant souriant très simplifié (cercle, deux points, sourire). |
| Onglet Famille | Pictogramme : une maison aux angles doux avec un cœur à l'intérieur. |
| Urgences | Pictogramme : une bouée de sauvetage. |
| Notifications | Pictogramme : une cloche. |
| Communauté | Pictogramme : deux bulles de dialogue qui se chevauchent. |
| Retour | Pictogramme : une flèche vers la gauche. |
| Fermer | Pictogramme : une croix. |
| Rechercher | Pictogramme : une loupe. |
| Filtrer | Pictogramme : trois curseurs horizontaux. |
| Favori | Pictogramme : une étoile (contour) et étoile pleine pour l'état actif. |
| Partager | Pictogramme : un carré avec une flèche vers le haut. |
| Modifier | Pictogramme : un crayon. |
| Supprimer | Pictogramme : une corbeille. |
| Valider | Pictogramme : une coche dans un cercle. |
| Réglages | Pictogramme : un engrenage simple. |
| Calendrier / agenda | Pictogramme : une page de calendrier avec un point. |
| Rappel | Pictogramme : un réveil. |
| Mes outils | Pictogramme : une grille de 4 carrés arrondis. |
| Aura (petit) | Pictogramme : un cercle avec trois points de lumière. |

## 5. Logos des outils (134 outils)

Envoie chaque ligne comme un prompt (après le style commun). Le pictogramme actuel est donné comme indice, pas comme modèle à copier.

### Compte et réglages — fond gris ardoise #6B7280 (7)

| Fichier | Outil | Prompt |
|---|---|---|
| `my_info.png` | Mes informations | Icône HOMI pour l'outil « Mes informations », fond gris ardoise #6B7280. Symbole original et simple qui fait comprendre la fonction « mes informations » au premier regard (indice : smartphone). Même style que les précédentes. |
| `preg_edit.png` | Modifier la grossesse | Icône HOMI pour l'outil « Modifier la grossesse », fond gris ardoise #6B7280. Symbole original et simple qui fait comprendre la fonction « modifier la grossesse » au premier regard (indice : edit-2). Même style que les précédentes. |
| `journeys.png` | Modifier mon parcours | Icône HOMI pour l'outil « Modifier mon parcours », fond gris ardoise #6B7280. Symbole original et simple qui fait comprendre la fonction « modifier mon parcours » au premier regard (indice : refresh-cw). Même style que les précédentes. |
| `notifications.png` | Notifications | Icône HOMI pour l'outil « Notifications », fond gris ardoise #6B7280. Symbole original et simple qui fait comprendre la fonction « notifications » au premier regard (indice : inbox). Même style que les précédentes. |
| `home_settings.png` | Personnaliser l’accueil | Icône HOMI pour l'outil « Personnaliser l’accueil », fond gris ardoise #6B7280. Symbole original et simple qui fait comprendre la fonction « personnaliser l’accueil » au premier regard (indice : layout). Même style que les précédentes. |
| `settings.png` | Réglages | Icône HOMI pour l'outil « Réglages », fond gris ardoise #6B7280. Symbole original et simple qui fait comprendre la fonction « réglages » au premier regard (indice : settings). Même style que les précédentes. |
| `preg_end.png` | Terminer la grossesse | Icône HOMI pour l'outil « Terminer la grossesse », fond gris ardoise #6B7280. Symbole original et simple qui fait comprendre la fonction « terminer la grossesse » au premier regard (indice : flag). Même style que les précédentes. |

### Soins et croissance — fond vert sauge #5E9E86 (12)

| Fichier | Outil | Prompt |
|---|---|---|
| `kid_album.png` | Album photo | Icône HOMI pour l'outil « Album photo », fond vert sauge #5E9E86. Symbole original et simple qui fait comprendre la fonction « album photo » au premier regard (indice : image). Même style que les précédentes. |
| `scan_compare.png` | Comparer deux produits | Icône HOMI pour l'outil « Comparer deux produits », fond vert sauge #5E9E86. Symbole original et simple qui fait comprendre la fonction « comparer deux produits » au premier regard (indice : columns). Même style que les précédentes. |
| `baby_diaper.png` | Couches | Icône HOMI pour l'outil « Couches », fond vert sauge #5E9E86. Symbole original et simple qui fait comprendre la fonction « couches » au premier regard (indice : wind). Même style que les précédentes. |
| `kid_teeth.png` | Dents | Icône HOMI pour l'outil « Dents », fond vert sauge #5E9E86. Symbole original et simple qui fait comprendre la fonction « dents » au premier regard (indice : circle). Même style que les précédentes. |
| `kid_profile.png` | Fiche de l’enfant | Icône HOMI pour l'outil « Fiche de l’enfant », fond vert sauge #5E9E86. Symbole original et simple qui fait comprendre la fonction « fiche de l’enfant » au premier regard (indice : user). Même style que les précédentes. |
| `kid_products.png` | Guide des produits pour enfants | Icône HOMI pour l'outil « Guide des produits pour enfants », fond vert sauge #5E9E86. Symbole original et simple qui fait comprendre la fonction « guide des produits pour enfants » au premier regard (indice : gift). Même style que les précédentes. |
| `kid_mood.png` | Humeur et émotions de l’enfant | Icône HOMI pour l'outil « Humeur et émotions de l’enfant », fond vert sauge #5E9E86. Symbole original et simple qui fait comprendre la fonction « humeur et émotions de l’enfant » au premier regard (indice : sun). Même style que les précédentes. |
| `journal.png` | Journal complet | Icône HOMI pour l'outil « Journal complet », fond vert sauge #5E9E86. Symbole original et simple qui fait comprendre la fonction « journal complet » au premier regard (indice : align-left). Même style que les précédentes. |
| `scan_history.png` | Produits scannés | Icône HOMI pour l'outil « Produits scannés », fond vert sauge #5E9E86. Symbole original et simple qui fait comprendre la fonction « produits scannés » au premier regard (indice : rotate-ccw). Même style que les précédentes. |
| `scan_product.png` | Scanner un produit | Icône HOMI pour l'outil « Scanner un produit », fond vert sauge #5E9E86. Symbole original et simple qui fait comprendre la fonction « scanner un produit » au premier regard (indice : maximize). Même style que les précédentes. |
| `baby_daily.png` | Suivi de la journée | Icône HOMI pour l'outil « Suivi de la journée », fond vert sauge #5E9E86. Symbole original et simple qui fait comprendre la fonction « suivi de la journée » au premier regard (indice : layers). Même style que les précédentes. |
| `kid_grow.png` | Étapes du développement | Icône HOMI pour l'outil « Étapes du développement », fond vert sauge #5E9E86. Symbole original et simple qui fait comprendre la fonction « étapes du développement » au premier regard (indice : chevrons-up). Même style que les précédentes. |

### Communauté — fond pêche #E89A6B (1)

| Fichier | Outil | Prompt |
|---|---|---|
| `community.png` | Communauté | Icône HOMI pour l'outil « Communauté », fond pêche #E89A6B. Symbole original et simple qui fait comprendre la fonction « communauté » au premier regard (indice : globe). Même style que les précédentes. |

### Couple — fond rouge rubis #B8475E (11)

| Fichier | Outil | Prompt |
|---|---|---|
| `family_review.png` | Bilan de la semaine | Icône HOMI pour l'outil « Bilan de la semaine », fond rouge rubis #B8475E. Symbole original et simple qui fait comprendre la fonction « bilan de la semaine » au premier regard (indice : percent). Même style que les précédentes. |
| `family_domains.png` | Confier un domaine | Icône HOMI pour l'outil « Confier un domaine », fond rouge rubis #B8475E. Symbole original et simple qui fait comprendre la fonction « confier un domaine » au premier regard (indice : users). Même style que les précédentes. |
| `family_sos.png` | Je craque | Icône HOMI pour l'outil « Je craque », fond rouge rubis #B8475E. Symbole original et simple qui fait comprendre la fonction « je craque » au premier regard (indice : pause). Même style que les précédentes. |
| `offduty.png` | Je décroche | Icône HOMI pour l'outil « Je décroche », fond rouge rubis #B8475E. Symbole original et simple qui fait comprendre la fonction « je décroche » au premier regard (indice : power). Même style que les précédentes. |
| `family_difficult.png` | Journée difficile | Icône HOMI pour l'outil « Journée difficile », fond rouge rubis #B8475E. Symbole original et simple qui fait comprendre la fonction « journée difficile » au premier regard (indice : cloud-off). Même style que les précédentes. |
| `family_urgent.png` | Mode urgence du foyer | Icône HOMI pour l'outil « Mode urgence du foyer », fond rouge rubis #B8475E. Symbole original et simple qui fait comprendre la fonction « mode urgence du foyer » au premier regard (indice : zap). Même style que les précédentes. |
| `solo_parent.png` | Parent solo | Icône HOMI pour l'outil « Parent solo », fond rouge rubis #B8475E. Symbole original et simple qui fait comprendre la fonction « parent solo » au premier regard (indice : anchor). Même style que les précédentes. |
| `couple_week.png` | Point de couple | Icône HOMI pour l'outil « Point de couple », fond rouge rubis #B8475E. Symbole original et simple qui fait comprendre la fonction « point de couple » au premier regard (indice : message-square). Même style que les précédentes. |
| `mental_load.png` | Répartition de la charge mentale | Icône HOMI pour l'outil « Répartition de la charge mentale », fond rouge rubis #B8475E. Symbole original et simple qui fait comprendre la fonction « répartition de la charge mentale » au premier regard (indice : pie-chart). Même style que les précédentes. |
| `couple_understand.png` | Se comprendre | Icône HOMI pour l'outil « Se comprendre », fond rouge rubis #B8475E. Symbole original et simple qui fait comprendre la fonction « se comprendre » au premier regard (indice : mail). Même style que les précédentes. |
| `family_metime.png` | Temps pour soi | Icône HOMI pour l'outil « Temps pour soi », fond rouge rubis #B8475E. Symbole original et simple qui fait comprendre la fonction « temps pour soi » au premier regard (indice : headphones). Même style que les précédentes. |

### Cycle — fond rose poudré #D9708F (29)

| Fichier | Outil | Prompt |
|---|---|---|
| `cycle_calendar.png` | Calendrier du cycle | Icône HOMI pour l'outil « Calendrier du cycle », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « calendrier du cycle » au premier regard (indice : grid). Même style que les précédentes. |
| `avoid_methods.png` | Comparer les contraceptions | Icône HOMI pour l'outil « Comparer les contraceptions », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « comparer les contraceptions » au premier regard (indice : sliders). Même style que les précédentes. |
| `ttc_understand.png` | Comprendre mon cycle | Icône HOMI pour l'outil « Comprendre mon cycle », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « comprendre mon cycle » au premier regard (indice : book). Même style que les précédentes. |
| `avoid_emergency.png` | Contraception d’urgence | Icône HOMI pour l'outil « Contraception d’urgence », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « contraception d’urgence » au premier regard (indice : alert-circle). Même style que les précédentes. |
| `ttc_cycle.png` | Cycle et période fertile | Icône HOMI pour l'outil « Cycle et période fertile », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « cycle et période fertile » au premier regard (indice : target). Même style que les précédentes. |
| `cycle_pain.png` | Douleurs | Icône HOMI pour l'outil « Douleurs », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « douleurs » au premier regard (indice : cloud-lightning). Même style que les précédentes. |
| `ttc_exams.png` | Examens de fertilité | Icône HOMI pour l'outil « Examens de fertilité », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « examens de fertilité » au premier regard (indice : file-plus). Même style que les précédentes. |
| `cycle_export.png` | Exporter mon suivi du cycle | Icône HOMI pour l'outil « Exporter mon suivi du cycle », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « exporter mon suivi du cycle » au premier regard (indice : printer). Même style que les précédentes. |
| `ttc_mucus.png` | Glaire cervicale | Icône HOMI pour l'outil « Glaire cervicale », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « glaire cervicale » au premier regard (indice : eye). Même style que les précédentes. |
| `cycle_guides.png` | Guides du cycle | Icône HOMI pour l'outil « Guides du cycle », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « guides du cycle » au premier regard (indice : info). Même style que les précédentes. |
| `contraception_journal.png` | Journal de ma contraception | Icône HOMI pour l'outil « Journal de ma contraception », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « journal de ma contraception » au premier regard (indice : pen-tool). Même style que les précédentes. |
| `cycle_journal.png` | Journal du cycle | Icône HOMI pour l'outil « Journal du cycle », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « journal du cycle » au premier regard (indice : edit-3). Même style que les précédentes. |
| `avoid_contraception.png` | Ma contraception | Icône HOMI pour l'outil « Ma contraception », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « ma contraception » au premier regard (indice : umbrella). Même style que les précédentes. |
| `cycle_advice.png` | Mes conseils du cycle | Icône HOMI pour l'outil « Mes conseils du cycle », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « mes conseils du cycle » au premier regard (indice : compass). Même style que les précédentes. |
| `cycle_home.png` | Mon cycle | Icône HOMI pour l'outil « Mon cycle », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « mon cycle » au premier regard (indice : rotate-cw). Même style que les précédentes. |
| `cycle_discharge.png` | Pertes vaginales | Icône HOMI pour l'outil « Pertes vaginales », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « pertes vaginales » au premier regard (indice : cloud-drizzle). Même style que les précédentes. |
| `avoid_consult.png` | Préparer ma consultation de contraception | Icône HOMI pour l'outil « Préparer ma consultation de contraception », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « préparer ma consultation de contraception » au premier regard (indice : user-check). Même style que les précédentes. |
| `ttc_consult.png` | Préparer ma consultation de fertilité | Icône HOMI pour l'outil « Préparer ma consultation de fertilité », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « préparer ma consultation de fertilité » au premier regard (indice : user-plus). Même style que les précédentes. |
| `avoid_reminders.png` | Rappels de contraception | Icône HOMI pour l'outil « Rappels de contraception », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « rappels de contraception » au premier regard (indice : watch). Même style que les précédentes. |
| `ttc_reminders.png` | Rappels du projet bébé | Icône HOMI pour l'outil « Rappels du projet bébé », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « rappels du projet bébé » au premier regard (indice : clock). Même style que les précédentes. |
| `ttc_intimacy.png` | Rapports | Icône HOMI pour l'outil « Rapports », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « rapports » au premier regard (indice : lock). Même style que les précédentes. |
| `cycle_month.png` | Résumé du mois | Icône HOMI pour l'outil « Résumé du mois », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « résumé du mois » au premier regard (indice : file). Même style que les précédentes. |
| `cycle_bleeding.png` | Saignements inhabituels | Icône HOMI pour l'outil « Saignements inhabituels », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « saignements inhabituels » au premier regard (indice : alert-triangle). Même style que les précédentes. |
| `cycle_stats.png` | Statistiques du cycle | Icône HOMI pour l'outil « Statistiques du cycle », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « statistiques du cycle » au premier regard (indice : bar-chart-2). Même style que les précédentes. |
| `pma_tracker.png` | Suivi de PMA | Icône HOMI pour l'outil « Suivi de PMA », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « suivi de pma » au premier regard (indice : crosshair). Même style que les précédentes. |
| `cycle_symptoms.png` | Symptômes du cycle | Icône HOMI pour l'outil « Symptômes du cycle », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « symptômes du cycle » au premier regard (indice : activity). Même style que les précédentes. |
| `ttc_temperature.png` | Température au réveil | Icône HOMI pour l'outil « Température au réveil », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « température au réveil » au premier regard (indice : sunrise). Même style que les précédentes. |
| `ttc_tests.png` | Tests d’ovulation et de grossesse | Icône HOMI pour l'outil « Tests d’ovulation et de grossesse », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « tests d’ovulation et de grossesse » au premier regard (indice : check-circle). Même style que les précédentes. |
| `cycle_kit.png` | Trousse de règles | Icône HOMI pour l'outil « Trousse de règles », fond rose poudré #D9708F. Symbole original et simple qui fait comprendre la fonction « trousse de règles » au premier regard (indice : briefcase). Même style que les précédentes. |

### Foyer et famille — fond bleu lagon #2F8FA0 (14)

| Fichier | Outil | Prompt |
|---|---|---|
| `family_calendar.png` | Agenda familial | Icône HOMI pour l'outil « Agenda familial », fond bleu lagon #2F8FA0. Symbole original et simple qui fait comprendre la fonction « agenda familial » au premier regard (indice : table). Même style que les précédentes. |
| `house_notebook.png` | Carnet de la maison | Icône HOMI pour l'outil « Carnet de la maison », fond bleu lagon #2F8FA0. Symbole original et simple qui fait comprendre la fonction « carnet de la maison » au premier regard (indice : key). Même style que les précédentes. |
| `family_history.png` | Historique des tâches | Icône HOMI pour l'outil « Historique des tâches », fond bleu lagon #2F8FA0. Symbole original et simple qui fait comprendre la fonction « historique des tâches » au premier regard (indice : rewind). Même style que les précédentes. |
| `family_shopping.png` | Liste de courses | Icône HOMI pour l'outil « Liste de courses », fond bleu lagon #2F8FA0. Symbole original et simple qui fait comprendre la fonction « liste de courses » au premier regard (indice : shopping-cart). Même style que les précédentes. |
| `family_my_place.png` | Ma place dans la famille | Icône HOMI pour l'outil « Ma place dans la famille », fond bleu lagon #2F8FA0. Symbole original et simple qui fait comprendre la fonction « ma place dans la famille » au premier regard (indice : navigation-2). Même style que les précédentes. |
| `family_missions.png` | Missions familiales | Icône HOMI pour l'outil « Missions familiales », fond bleu lagon #2F8FA0. Symbole original et simple qui fait comprendre la fonction « missions familiales » au premier regard (indice : send). Même style que les précédentes. |
| `family_papers.png` | Papiers de la famille | Icône HOMI pour l'outil « Papiers de la famille », fond bleu lagon #2F8FA0. Symbole original et simple qui fait comprendre la fonction « papiers de la famille » au premier regard (indice : paperclip). Même style que les précédentes. |
| `reminders.png` | Rappels | Icône HOMI pour l'outil « Rappels », fond bleu lagon #2F8FA0. Symbole original et simple qui fait comprendre la fonction « rappels » au premier regard (indice : bell). Même style que les précédentes. |
| `family_routines.png` | Routines du foyer | Icône HOMI pour l'outil « Routines du foyer », fond bleu lagon #2F8FA0. Symbole original et simple qui fait comprendre la fonction « routines du foyer » au premier regard (indice : list). Même style que les précédentes. |
| `nearby.png` | Sorties en famille | Icône HOMI pour l'outil « Sorties en famille », fond bleu lagon #2F8FA0. Symbole original et simple qui fait comprendre la fonction « sorties en famille » au premier regard (indice : map-pin). Même style que les précédentes. |
| `family_stocks.png` | Stocks du foyer | Icône HOMI pour l'outil « Stocks du foyer », fond bleu lagon #2F8FA0. Symbole original et simple qui fait comprendre la fonction « stocks du foyer » au premier regard (indice : package). Même style que les précédentes. |
| `family_tasks.png` | Tâches du foyer | Icône HOMI pour l'outil « Tâches du foyer », fond bleu lagon #2F8FA0. Symbole original et simple qui fait comprendre la fonction « tâches du foyer » au premier regard (indice : check-square). Même style que les précédentes. |
| `brain_dump.png` | Vider ma tête | Icône HOMI pour l'outil « Vider ma tête », fond bleu lagon #2F8FA0. Symbole original et simple qui fait comprendre la fonction « vider ma tête » au premier regard (indice : download). Même style que les précédentes. |
| `family_prep.png` | Échéances à préparer | Icône HOMI pour l'outil « Échéances à préparer », fond bleu lagon #2F8FA0. Symbole original et simple qui fait comprendre la fonction « échéances à préparer » au premier regard (indice : fast-forward). Même style que les précédentes. |

### Alimentation — fond corail chaud #E8735A (12)

| Fichier | Outil | Prompt |
|---|---|---|
| `baby_breastfeed.png` | Allaitement | Icône HOMI pour l'outil « Allaitement », fond corail chaud #E8735A. Symbole original et simple qui fait comprendre la fonction « allaitement » au premier regard (indice : droplet). Même style que les précédentes. |
| `preg_eat.png` | Bien manger enceinte | Icône HOMI pour l'outil « Bien manger enceinte », fond corail chaud #E8735A. Symbole original et simple qui fait comprendre la fonction « bien manger enceinte » au premier regard (indice : thumbs-up). Même style que les précédentes. |
| `meal_rankings.png` | Classement des recettes | Icône HOMI pour l'outil « Classement des recettes », fond corail chaud #E8735A. Symbole original et simple qui fait comprendre la fonction « classement des recettes » au premier regard (indice : award). Même style que les précédentes. |
| `bottle_scoops.png` | Compteur de mesurettes | Icône HOMI pour l'outil « Compteur de mesurettes », fond corail chaud #E8735A. Symbole original et simple qui fait comprendre la fonction « compteur de mesurettes » au premier regard (indice : hash). Même style que les précédentes. |
| `meal_pantry.png` | Cuisiner avec ce que j’ai | Icône HOMI pour l'outil « Cuisiner avec ce que j’ai », fond corail chaud #E8735A. Symbole original et simple qui fait comprendre la fonction « cuisiner avec ce que j’ai » au premier regard (indice : archive). Même style que les précédentes. |
| `baby_foods.png` | Diversification alimentaire | Icône HOMI pour l'outil « Diversification alimentaire », fond corail chaud #E8735A. Symbole original et simple qui fait comprendre la fonction « diversification alimentaire » au premier regard (indice : feather). Même style que les précédentes. |
| `baby_bottle_history.png` | Historique des biberons | Icône HOMI pour l'outil « Historique des biberons », fond corail chaud #E8735A. Symbole original et simple qui fait comprendre la fonction « historique des biberons » au premier regard (indice : bar-chart). Même style que les précédentes. |
| `baby_bottle_timer.png` | Journée des biberons | Icône HOMI pour l'outil « Journée des biberons », fond corail chaud #E8735A. Symbole original et simple qui fait comprendre la fonction « journée des biberons » au premier regard (indice : pause-circle). Même style que les précédentes. |
| `meal_menu.png` | Menu de la semaine | Icône HOMI pour l'outil « Menu de la semaine », fond corail chaud #E8735A. Symbole original et simple qui fait comprendre la fonction « menu de la semaine » au premier regard (indice : menu). Même style que les précédentes. |
| `baby_bottle.png` | Noter un biberon | Icône HOMI pour l'outil « Noter un biberon », fond corail chaud #E8735A. Symbole original et simple qui fait comprendre la fonction « noter un biberon » au premier regard (indice : plus-circle). Même style que les précédentes. |
| `meals.png` | Repas et recettes | Icône HOMI pour l'outil « Repas et recettes », fond corail chaud #E8735A. Symbole original et simple qui fait comprendre la fonction « repas et recettes » au premier regard (indice : coffee). Même style que les précédentes. |
| `scan_food.png` | Scanner un aliment | Icône HOMI pour l'outil « Scanner un aliment », fond corail chaud #E8735A. Symbole original et simple qui fait comprendre la fonction « scanner un aliment » au premier regard (indice : search). Même style que les précédentes. |

### Santé — fond rouge framboise #C8455A (22)

| Fichier | Outil | Prompt |
|---|---|---|
| `recall_alerts.png` | Alertes de rappel de produits | Icône HOMI pour l'outil « Alertes de rappel de produits », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « alertes de rappel de produits » au premier regard (indice : alert-octagon). Même style que les précédentes. |
| `ask.png` | Assistant | Icône HOMI pour l'outil « Assistant », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « assistant » au premier regard (indice : message-circle). Même style que les précédentes. |
| `local_ai.png` | Assistant hors ligne | Icône HOMI pour l'outil « Assistant hors ligne », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « assistant hors ligne » au premier regard (indice : cpu). Même style que les précédentes. |
| `library.png` | Bibliothèque | Icône HOMI pour l'outil « Bibliothèque », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « bibliothèque » au premier regard (indice : book-open). Même style que les précédentes. |
| `health_book.png` | Carnet de santé | Icône HOMI pour l'outil « Carnet de santé », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « carnet de santé » au premier regard (indice : folder-plus). Même style que les précédentes. |
| `documents.png` | Documents de santé | Icône HOMI pour l'outil « Documents de santé », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « documents de santé » au premier regard (indice : folder). Même style que les précédentes. |
| `kid_steps.png` | Démarches de l’enfant | Icône HOMI pour l'outil « Démarches de l’enfant », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « démarches de l’enfant » au premier regard (indice : check-square). Même style que les précédentes. |
| `guides.png` | Guides pratiques | Icône HOMI pour l'outil « Guides pratiques », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « guides pratiques » au premier regard (indice : bookmark). Même style que les précédentes. |
| `consult_questions.png` | Mes questions pour le rendez-vous | Icône HOMI pour l'outil « Mes questions pour le rendez-vous », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « mes questions pour le rendez-vous » au premier regard (indice : help-circle). Même style que les précédentes. |
| `mood.png` | Mon humeur | Icône HOMI pour l'outil « Mon humeur », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « mon humeur » au premier regard (indice : smile). Même style que les précédentes. |
| `me_diary.png` | Mon journal intime | Icône HOMI pour l'outil « Mon journal intime », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « mon journal intime » au premier regard (indice : edit). Même style que les précédentes. |
| `medications.png` | Médicaments | Icône HOMI pour l'outil « Médicaments », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « médicaments » au premier regard (indice : plus-square). Même style que les précédentes. |
| `exhaustion_check.png` | Point sur ma fatigue | Icône HOMI pour l'outil « Point sur ma fatigue », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « point sur ma fatigue » au premier regard (indice : battery). Même style que les précédentes. |
| `scan_avoid.png` | Produits à éviter | Icône HOMI pour l'outil « Produits à éviter », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « produits à éviter » au premier regard (indice : slash). Même style que les précédentes. |
| `appointments.png` | Rendez-vous et examens | Icône HOMI pour l'outil « Rendez-vous et examens », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « rendez-vous et examens » au premier regard (indice : calendar). Même style que les précédentes. |
| `summary.png` | Résumés | Icône HOMI pour l'outil « Résumés », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « résumés » au premier regard (indice : file-text). Même style que les précédentes. |
| `sources.png` | Sources et références | Icône HOMI pour l'outil « Sources et références », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « sources et références » au premier regard (indice : link). Même style que les précédentes. |
| `kid_health.png` | Suivi de santé de l’enfant | Icône HOMI pour l'outil « Suivi de santé de l’enfant », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « suivi de santé de l’enfant » au premier regard (indice : thermometer). Même style que les précédentes. |
| `kid_treatments.png` | Traitements de l’enfant | Icône HOMI pour l'outil « Traitements de l’enfant », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « traitements de l’enfant » au premier regard (indice : clipboard). Même style que les précédentes. |
| `emergency.png` | Urgences | Icône HOMI pour l'outil « Urgences », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « urgences » au premier regard (indice : life-buoy). Même style que les précédentes. |
| `kid_vaccines.png` | Vaccins | Icône HOMI pour l'outil « Vaccins », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « vaccins » au premier regard (indice : shield). Même style que les précédentes. |
| `videos.png` | Vidéos et tutos | Icône HOMI pour l'outil « Vidéos et tutos », fond rouge framboise #C8455A. Symbole original et simple qui fait comprendre la fonction « vidéos et tutos » au premier regard (indice : play-circle). Même style que les précédentes. |

### Grossesse — fond lavande #7B63C9 (15)

| Fichier | Outil | Prompt |
|---|---|---|
| `pp_mental.png` | Baby blues et dépression du post-partum | Icône HOMI pour l'outil « Baby blues et dépression du post-partum », fond lavande #7B63C9. Symbole original et simple qui fait comprendre la fonction « baby blues et dépression du post-partum » au premier regard (indice : cloud-rain). Même style que les précédentes. |
| `preg_calendar.png` | Calendrier de grossesse | Icône HOMI pour l'outil « Calendrier de grossesse », fond lavande #7B63C9. Symbole original et simple qui fait comprendre la fonction « calendrier de grossesse » au premier regard (indice : map). Même style que les précédentes. |
| `pp_body.png` | Cicatrisation et rééducation | Icône HOMI pour l'outil « Cicatrisation et rééducation », fond lavande #7B63C9. Symbole original et simple qui fait comprendre la fonction « cicatrisation et rééducation » au premier regard (indice : move). Même style que les précédentes. |
| `ttc_start_pregnancy.png` | Démarrer ma grossesse | Icône HOMI pour l'outil « Démarrer ma grossesse », fond lavande #7B63C9. Symbole original et simple qui fait comprendre la fonction « démarrer ma grossesse » au premier regard (indice : heart). Même style que les précédentes. |
| `pp_partner.png` | Espace du co-parent | Icône HOMI pour l'outil « Espace du co-parent », fond lavande #7B63C9. Symbole original et simple qui fait comprendre la fonction « espace du co-parent » au premier regard (indice : share-2). Même style que les précédentes. |
| `preg_names.png` | Idées de prénoms | Icône HOMI pour l'outil « Idées de prénoms », fond lavande #7B63C9. Symbole original et simple qui fait comprendre la fonction « idées de prénoms » au premier regard (indice : tag). Même style que les précédentes. |
| `preg_lists.png` | Listes de préparation | Icône HOMI pour l'outil « Listes de préparation », fond lavande #7B63C9. Symbole original et simple qui fait comprendre la fonction « listes de préparation » au premier regard (indice : shopping-bag). Même style que les précédentes. |
| `preg_evolution.png` | Ma grossesse semaine par semaine | Icône HOMI pour l'outil « Ma grossesse semaine par semaine », fond lavande #7B63C9. Symbole original et simple qui fait comprendre la fonction « ma grossesse semaine par semaine » au premier regard (indice : aperture). Même style que les précédentes. |
| `pp_recovery.png` | Ma récupération après la naissance | Icône HOMI pour l'outil « Ma récupération après la naissance », fond lavande #7B63C9. Symbole original et simple qui fait comprendre la fonction « ma récupération après la naissance » au premier regard (indice : battery-charging). Même style que les précédentes. |
| `preg_feel.png` | Mes symptômes de grossesse | Icône HOMI pour l'outil « Mes symptômes de grossesse », fond lavande #7B63C9. Symbole original et simple qui fait comprendre la fonction « mes symptômes de grossesse » au premier regard (indice : meh). Même style que les précédentes. |
| `preg_weight.png` | Mon poids pendant la grossesse | Icône HOMI pour l'outil « Mon poids pendant la grossesse », fond lavande #7B63C9. Symbole original et simple qui fait comprendre la fonction « mon poids pendant la grossesse » au premier regard (indice : trending-up). Même style que les précédentes. |
| `pp_checkin.png` | Mon point du jour | Icône HOMI pour l'outil « Mon point du jour », fond lavande #7B63C9. Symbole original et simple qui fait comprendre la fonction « mon point du jour » au premier regard (indice : check). Même style que les précédentes. |
| `pp_history.png` | Mon évolution | Icône HOMI pour l'outil « Mon évolution », fond lavande #7B63C9. Symbole original et simple qui fait comprendre la fonction « mon évolution » au premier regard (indice : git-commit). Même style que les précédentes. |
| `preg_moves.png` | Mouvements de bébé | Icône HOMI pour l'outil « Mouvements de bébé », fond lavande #7B63C9. Symbole original et simple qui fait comprendre la fonction « mouvements de bébé » au premier regard (indice : radio). Même style que les précédentes. |
| `pp_support.png` | Trouver de l’aide | Icône HOMI pour l'outil « Trouver de l’aide », fond lavande #7B63C9. Symbole original et simple qui fait comprendre la fonction « trouver de l’aide » au premier regard (indice : phone-call). Même style que les précédentes. |

### École et activités — fond ambre #E0A23A (5)

| Fichier | Outil | Prompt |
|---|---|---|
| `kid_card.png` | Fiche à transmettre | Icône HOMI pour l'outil « Fiche à transmettre », fond ambre #E0A23A. Symbole original et simple qui fait comprendre la fonction « fiche à transmettre » au premier regard (indice : credit-card). Même style que les précédentes. |
| `custody.png` | Garde alternée | Icône HOMI pour l'outil « Garde alternée », fond ambre #E0A23A. Symbole original et simple qui fait comprendre la fonction « garde alternée » au premier regard (indice : home). Même style que les précédentes. |
| `childcare.png` | Garde et nounou | Icône HOMI pour l'outil « Garde et nounou », fond ambre #E0A23A. Symbole original et simple qui fait comprendre la fonction « garde et nounou » au premier regard (indice : trello). Même style que les précédentes. |
| `kid_routines.png` | Routines en images | Icône HOMI pour l'outil « Routines en images », fond ambre #E0A23A. Symbole original et simple qui fait comprendre la fonction « routines en images » au premier regard (indice : toggle-right). Même style que les précédentes. |
| `kid_school.png` | École ou mode de garde | Icône HOMI pour l'outil « École ou mode de garde », fond ambre #E0A23A. Symbole original et simple qui fait comprendre la fonction « école ou mode de garde » au premier regard (indice : type). Même style que les précédentes. |

### Sommeil — fond bleu nuit #3B4A8C (6)

| Fichier | Outil | Prompt |
|---|---|---|
| `sleep_help.png` | Aide au sommeil | Icône HOMI pour l'outil « Aide au sommeil », fond bleu nuit #3B4A8C. Symbole original et simple qui fait comprendre la fonction « aide au sommeil » au premier regard (indice : navigation). Même style que les précédentes. |
| `baby_night_help.png` | Bilan de la nuit | Icône HOMI pour l'outil « Bilan de la nuit », fond bleu nuit #3B4A8C. Symbole original et simple qui fait comprendre la fonction « bilan de la nuit » au premier regard (indice : star). Même style que les précédentes. |
| `sleep.png` | Mon sommeil | Icône HOMI pour l'outil « Mon sommeil », fond bleu nuit #3B4A8C. Symbole original et simple qui fait comprendre la fonction « mon sommeil » au premier regard (indice : cloud). Même style que les précédentes. |
| `kid_sleep_rhythm.png` | Planning de sommeil | Icône HOMI pour l'outil « Planning de sommeil », fond bleu nuit #3B4A8C. Symbole original et simple qui fait comprendre la fonction « planning de sommeil » au premier regard (indice : sunset). Même style que les précédentes. |
| `family_nights.png` | Relais de nuit | Icône HOMI pour l'outil « Relais de nuit », fond bleu nuit #3B4A8C. Symbole original et simple qui fait comprendre la fonction « relais de nuit » au premier regard (indice : repeat). Même style que les précédentes. |
| `kid_sleep.png` | Sommeil de l’enfant | Icône HOMI pour l'outil « Sommeil de l’enfant », fond bleu nuit #3B4A8C. Symbole original et simple qui fait comprendre la fonction « sommeil de l’enfant » au premier regard (indice : moon). Même style que les précédentes. |

## 6. Après génération

Dépose les PNG dans un dossier (noms = identifiants ci-dessus) et envoie-les moi : je les intègre (versions détaillée, compacte et animée), je vérifie la lisibilité à petite taille et le contraste, puis je relance les tests.