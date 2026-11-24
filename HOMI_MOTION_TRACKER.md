# HOMI — Refonte « motion » des outils : inventaire et suivi (24/11/2026)

Inventaire généré depuis le code (écran de l'outil + composants qu'il importe directement). « Aujourd'hui » = composants
de visualisation réellement rendus. La cible est une proposition à valider, pas un engagement ; « aucun graphique
utile » est un choix assumé (ne pas forcer un graphique).

Bibliothèques : **déjà installées** Reanimated 4.7, Skia 2.6, Victory Native 42, Gesture Handler, SVG + système
d'animation maison (`src/motion`, 23 composants). **Aucune dépendance ajoutée.** Écartées pour l'application :
Three.js, Babylon, Godot, Blender, Konva, Two.js, Anime.js, Motion, TweenJS, Shifty, Ola, Proton, Lume (poids sans
gain face à Reanimated + Skia) ; Remotion, Motion Canvas, Manim, gifenc = vidéos marketing, hors application ;
Lottie seulement si une vraie animation est fournie.

Kit partagé créé (src/components/motion) : AnimatedBottle, AnimatedProgressRing ; SleepRing24 (src/features/napLive) ;
logique pure testée : src/lib/domain/sleepRing.ts, bottleScale.ts.

Lots : 2 = sommeil / biberon / allaitement · 3 = courbes et barres interactives (kit unifié) · 4 = grossesse et cycle ·
5 = listes, agenda, étapes, budget · 6 = sans graphique (soin des transitions seulement).
Répartition : lot 2 : 11 · lot 3 : 10 · lot 4 : 28 · lot 5 : 18 · lot 6 : 61


| Outil | Adresse | Aujourd'hui | Minuteur | Cible | Lot | État |
|---|---|---|---|---|---|---|
| Repas et recettes | `/meals?for=avoid&child=:id` | HmHero | — | barres interactives + moyenne / min / max par période | 3 | à faire |
| Menu de la semaine | `/meals/menu` | HmHero | — | frise des semaines et trimestres, compte à rebours | 4 | à faire |
| Cuisiner avec ce que j’ai | `/meals/pantry` | HmHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Scanner un aliment | `/scanner/food` | — | — | frise d’étapes / carte (existant), animation de validation | 5 | à faire |
| Mon sommeil | `/me/sleep` | DayBars, StageHero | — | anneau 24 h + frise jour/nuit modifiable au doigt + semaine | 2 | à faire |
| Scanner un produit | `/scanner/product` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Produits scannés | `/scanner/history` | HmHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Comparer deux produits | `/scanner/compare` | VerdictHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Rendez-vous et examens | `/appointments?child=:id` | — | — | calendrier / frise des rendez-vous (existant) | 5 | à faire |
| Mes questions pour le rendez-vous | `/consult/questions?child=:id` | HmHero | — | calendrier / frise des rendez-vous (existant) | 5 | à faire |
| Documents de santé | `/documents?child=:id` | HmHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Carnet de santé | `/documents/book` | HmHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Médicaments | `/medications` | DayBars | oui | barres interactives + moyenne / min / max par période | 3 | à faire |
| Mon humeur | `/me/mood` | — | oui | barres interactives + moyenne / min / max par période | 3 | à faire |
| Mon journal intime | `/me/diary` | HmHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Point sur ma fatigue | `/family/exhausted` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Produits à éviter | `/scanner/avoid` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Alertes de rappel de produits | `/scanner/recalls` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Urgences | `/emergency` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Assistant | `/(tabs)/ask` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Assistant hors ligne | `/assistant/local` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Bibliothèque | `/library` | — | oui | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Guides pratiques | `/guide` | — | oui | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Vidéos et tutos | `/videos` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Sources et références | `/sources` | — | oui | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Mon cycle | `/cycle?all=1` | CycleRing, GoldCycleRing | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Calendrier du cycle | `/cycle/calendar` | — | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Symptômes du cycle | `/cycle/symptoms` | — | — | barres interactives + moyenne / min / max par période | 3 | à faire |
| Douleurs | `/cycle/pain` | — | — | barres interactives + moyenne / min / max par période | 3 | à faire |
| Pertes vaginales | `/cycle/discharge` | — | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Saignements inhabituels | `/cycle/bleeding` | — | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Statistiques du cycle | `/cycle/stats` | TouchBars | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Mes conseils du cycle | `/cycle/advice` | — | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Résumé du mois | `/cycle/month` | TouchBars | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Exporter mon suivi du cycle | `/cycle/export` | — | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Guides du cycle | `/cycle/guides` | — | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Trousse de règles | `/cycle/kit` | — | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Ma contraception | `/contraception` | BarChart | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Comparer les contraceptions | `/contraception/methods` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Contraception d’urgence | `/contraception/emergency` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Rappels de contraception | `/contraception/reminders` | BarChart | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Préparer ma consultation de contraception | `/contraception/consultation` | BarChart | — | liste à cocher animée + progression | 5 | à faire |
| Journal de ma contraception | `/contraception/journal` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Rapports | `/cycle/intimacy` | — | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Démarrer ma grossesse | `/pregnancy/start` | — | — | frise des semaines et trimestres, compte à rebours | 4 | à faire |
| Répartition de la charge mentale | `/family/load` | HmHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Confier un domaine | `/family/domains` | HmHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Point de couple | `/family/couple` | HmHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Se comprendre | `/family/understand` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Temps pour soi | `/family/me-time` | HmHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Je décroche | `/family/offduty` | HmHero | oui | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Journée difficile | `/family/difficult` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Parent solo | `/family/solo` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Agenda familial | `/calendar` | BriefStrip, CalendarHero, DayTimeline, HmHero | — | calendrier / frise des rendez-vous (existant) | 5 | à faire |
| Tâches du foyer | `/family` | — | — | liste à cocher animée + progression | 5 | à faire |
| Missions familiales | `/family/missions` | HmHero | — | liste à cocher animée + progression | 5 | à faire |
| Ma place dans la famille | `/family/my-place` | HmHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Routines du foyer | `/family/routines` | HmHero | — | liste à cocher animée + progression | 5 | à faire |
| Vider ma tête | `/family/brain-dump` | HmHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| 3 choses aujourd’hui | `/family/focus` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Échéances à préparer | `/family/prep` | HmHero | — | liste à cocher animée + progression | 5 | à faire |
| Liste de courses | `/meals/shopping` | — | — | liste à cocher animée + progression | 5 | à faire |
| Stocks du foyer | `/family/stocks` | StockHero | — | liste à cocher animée + progression | 5 | à faire |
| Carnet de la maison | `/family/notebook` | HmHero, NoteHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Papiers de la famille | `/family/papers` | HmHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Rappels | `/settings/reminders` | HmHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Sorties en famille | `/outings` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Communauté | `/(tabs)/community?space=eviter-grossesse` | — | — | frise des semaines et trimestres, compte à rebours | 4 | à faire |
| Cycle et période fertile | `/fertility` | BarChart | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Tests d’ovulation et de grossesse | `/fertility/log` | BarChart | — | frise des semaines et trimestres, compte à rebours | 4 | à faire |
| Glaire cervicale | `/fertility/mucus` | BarChart | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Température au réveil | `/fertility/body` | BarChart, MeasureCurve | — | barres interactives + moyenne / min / max par période | 3 | à faire |
| Examens de fertilité | `/fertility/exams` | — | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Comprendre mon cycle | `/fertility/understand` | BarChart | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Préparer ma consultation de fertilité | `/fertility/consultation` | BarChart | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Rappels du projet bébé | `/fertility/reminders` | BarChart | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Suivi de PMA | `/fertility/pma` | — | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Idées de prénoms | `/names` | HmHero, NamesHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Journal du cycle | `/cycle/journal` | — | — | calendrier du cycle (existant) + barres de durée | 4 | à faire |
| Guide des produits pour enfants | `/products` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Bien manger enceinte | `/pregnancy/eat` | — | — | frise des semaines et trimestres, compte à rebours | 4 | à faire |
| Relais de nuit | `/family/nights` | RelayStrip | — | anneau 24 h + frise jour/nuit modifiable au doigt + semaine | 2 | à faire |
| Résumés | `/summary` | BriefStrip | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Ma grossesse semaine par semaine | `/pregnancy` | WeekHero | — | frise des semaines et trimestres, compte à rebours | 4 | à faire |
| Mon poids pendant la grossesse | `/pregnancy/weight` | MeasureCurve | — | courbe interactive (infobulle au doigt, périodes, sans interprétation) | 3 | à faire |
| Mes symptômes de grossesse | `/pregnancy/feel` | DayBars | oui | barres interactives + moyenne / min / max par période | 3 | à faire |
| Mouvements de bébé | `/pregnancy/moves` | DayBars | — | frise des contractions + barres d’espacement (aucun seuil médical) | 4 | à faire |
| Calendrier de grossesse | `/pregnancy/calendar` | — | — | frise des semaines et trimestres, compte à rebours | 4 | à faire |
| Listes de préparation | `/lists` | — | — | liste à cocher animée + progression | 5 | à faire |
| Allaitement | `/track/breastfeed?child=:id` | DayStrip, ProgressRing | oui | minuteur par sein + anneau de séance + frise des tétées | 2 | **fait** : anneau par sein (AnimatedProgressRing), chronomètre au centre · Chromium ✅ (bascule G→D vérifiée) · iPhone — |
| Journée des biberons | `/bottle/:id` | BottleClock, BottleDayTimeline, DayTimeline, StageHero | oui | biberon gradué animé (préparé / bu / reste) + barres du jour | 2 | **fait** : biberon gradué animé (AnimatedBottle) dans « Noter un biberon » · Chromium ✅ · iPhone — |
| Compteur de mesurettes | `/bottle/scoops` | — | — | biberon gradué animé (préparé / bu / reste) + barres du jour | 2 | à faire |
| Ma récupération après la naissance | `/postpartum` | HmHero, PostpartumHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Mon point du jour | `/postpartum/checkin` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Mon évolution | `/postpartum/history` | — | oui | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Cicatrisation et rééducation | `/postpartum/recovery` | — | oui | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Baby blues et dépression du post-partum | `/postpartum/understand` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Trouver de l’aide | `/postpartum/support` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Espace du co-parent | `/postpartum/partner` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Mode urgence du foyer | `/family/urgent` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Je craque | `/family/sos` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Noter un biberon | `/track/bottle?child=:id` | DayStrip, ProgressRing | oui | biberon gradué animé (préparé / bu / reste) + barres du jour | 2 | à faire |
| Historique des biberons | `/bottle/history?child=:id` | BarChart, BriefStrip | oui | biberon gradué animé (préparé / bu / reste) + barres du jour | 2 | à faire |
| Diversification alimentaire | `/child/:id/discoveries` | MeasureCurve | — | frise d’étapes / carte (existant), animation de validation | 5 | à faire |
| Classement des recettes | `/meals/rankings` | HmHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Sommeil de l’enfant | `/night?child=:id` | BreastHero, SessionBand, StageHero, WeekBars | oui | anneau 24 h + frise jour/nuit modifiable au doigt + semaine | 2 | à faire |
| Planning de sommeil | `/sleep/:id` | BarChart, NapDayBand, NapHero, StageHero | oui | anneau 24 h + frise jour/nuit modifiable au doigt + semaine | 2 | **fait** : anneau 24 h (SleepRing24), relié à la frise · Chromium ✅ · iPhone — |
| Aide au sommeil | `/sleep/help/:id` | — | — | anneau 24 h + frise jour/nuit modifiable au doigt + semaine | 2 | à faire |
| Bilan de la nuit | `/night/help?child=:id` | MiniBars | oui | anneau 24 h + frise jour/nuit modifiable au doigt + semaine | 2 | à faire |
| Suivi de la journée | `/(tabs)/track` | ActionsStrip, BarChart | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Couches | `/track/diaper?child=:id` | DayStrip, ProgressRing | oui | barres interactives + moyenne / min / max par période | 3 | à faire |
| Dents | `/teeth?child=:id` | HmHero, TeethHero | — | frise d’étapes / carte (existant), animation de validation | 5 | à faire |
| Journal complet | `/journal` | HmHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Fiche de l’enfant | `/child/:id` | MeasureCurve | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Étapes du développement | `/child/:id/grow` | MeasureCurve | — | frise d’étapes / carte (existant), animation de validation | 5 | à faire |
| Humeur et émotions de l’enfant | `/child/:id/wellbeing` | MeasureCurve | — | barres interactives + moyenne / min / max par période | 3 | à faire |
| Album photo | `/child/:id/album` | MeasureCurve | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Vaccins | `/child/:id/vaccines` | MeasureCurve | — | frise d’étapes / carte (existant), animation de validation | 5 | à faire |
| Suivi de santé de l’enfant | `/child/:id/health-tracking` | MeasureCurve | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Traitements de l’enfant | `/child/:id/needs?tab=treatments` | MeasureCurve | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| École ou mode de garde | `/child/:id/school` | MeasureCurve | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Fiche à transmettre | `/child/:id/card` | MeasureCurve | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Garde alternée | `/family/custody` | HmHero | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Garde et nounou | `/garde` | — | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Démarches de l’enfant | `/child/:id/steps` | MeasureCurve | — | aucun graphique utile (contenu, scanner, réglage) : transitions et états vides soignés | 6 | à faire |
| Routines en images | `/family/kid-routines` | HmHero | — | liste à cocher animée + progression | 5 | à faire |
| Bilan de la semaine | `/family/review` | HmHero | — | frise des semaines et trimestres, compte à rebours | 4 | à faire |
| Historique des tâches | `/family/history` | HmHero | — | liste à cocher animée + progression | 5 | à faire |
