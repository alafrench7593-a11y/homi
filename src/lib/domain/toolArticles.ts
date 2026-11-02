/**
 * « Pour aller plus loin » : chaque outil de l'app a ses articles. Pour chaque outil, des mots-clés (cherchés au début
 * des mots du titre et des étiquettes) et des catégories proches. Un test vérifie que chaque outil en trouve au moins 3.
 */
import type { ArticleSummary, Category } from '@/lib/types';
import { localized } from '@/i18n/localized';

export interface ToolTopic {
  /** Début de mots cherchés dans le titre et les étiquettes (sans accents, en minuscules). */
  words: string[];
  /** Catégories proches (départage, ne suffisent pas seules). */
  cats?: string[];
  /** Parcours à privilégier. */
  journeys?: string[];
  /** Articles à écarter (cas particuliers qui prendraient la place des articles de fond). */
  not?: string[];
  /** Question proposée à l'assistant local. */
  ask: string;
}

const BABY = ['newborn', 'parents_sleep'];
const KID = ['newborn', 'child', 'parents_sleep'];
const PREG = ['pregnant'];
const CYCLE = ['avoid', 'ttc'];

const TOOL_TOPICS_FR: Record<string, ToolTopic> = {
  // Scanner et produits
  scan_product: { words: ['etiquet', 'nutri-score', 'nutriscore', 'additif', 'ultra-transform', 'rappel', 'label', 'cosmet', 'perturbateur', 'bien choisir'], cats: ['materiel', 'alimentation'], ask: 'Comment lire une étiquette ?' },
  scan_food: { words: ['etiquet', 'nutri-score', 'nutriscore', 'additif', 'ultra-transform', 'petits pots', 'plats prepar', 'sucre', 'sel'], cats: ['alimentation'], ask: 'Comment lire le Nutri-Score ?' },
  scan_history: { words: ['etiquet', 'nutri-score', 'nutriscore', 'rappel', 'ultra-transform'], cats: ['alimentation'], ask: 'Que faire d’un produit rappelé ?' },
  scan_compare: { words: ['etiquet', 'nutri-score', 'nutriscore', 'comparer', 'bien choisir', 'petits pots'], cats: ['alimentation', 'materiel'], ask: 'Comment comparer deux produits ?' },
  scan_avoid: { words: ['allerg', 'intoleran', 'eviter', 'additif', 'cœliaq', 'coeliaq', 'gluten', 'arachide'], cats: ['alimentation'], ask: 'Quels aliments éviter en cas d’allergie ?' },
  kid_products: { words: ['bien choisir', 'jouet', 'poussette', 'siege auto', 'lit', 'porte-bebe', 'chaise haute', 'rappel', 'norme', 'materiel'], cats: ['materiel', 'securite'], journeys: KID, ask: 'Comment bien choisir un siège auto ?' },
  // Ressources
  nearby: { words: ['sortie', 'parc', 'square', 'piscine', 'musee', 'voyage', 'vacances', 'aire de jeux', 'balade', 'mode de garde', 'creche'], cats: ['activites-eveil', 'vie-pratique'], ask: 'Quelles sorties avec un jeune enfant ?' },
  emergency: { words: ['urgence', 'premiers secours', 'etouffement', 'brulure', 'chute', 'intoxication', 'noyade', 'convulsion', 'fievre', 'appeler le 15', 'malaise'], cats: ['premiers-secours'], ask: 'Mon enfant s’étouffe, que faire ?' },
  appointments: { words: ['examen', 'consultation', 'rendez-vous', 'suivi', 'echograph', 'visite', 'bilan', 'entretien'], cats: ['suivi-grossesse'], ask: 'Quels examens sont obligatoires ?' },
  documents: { words: ['carnet de sante', 'demarche', 'declaration', 'etat civil', 'mutuelle', 'rembourse', 'dossier', 'certificat', 'caf', 'droit'], cats: ['droits-demarches'], ask: 'Quelles démarches après la naissance ?' },
  // Humeur et sommeil
  mood: { words: ['moral', 'stress', 'anxi', 'depression', 'epuisement', 'charge mentale', 'solitude', 'emotion', 'baby blues', 'burn', 'culpabil'], cats: ['sante-mentale'], ask: 'Je me sens épuisée, que faire ?' },
  kid_mood: { words: ['emotion', 'colere', 'peur', 'angoisse', 'anxi', 'jalousie', 'pleur', 'harcelement', 'tristesse', 'confiance'], cats: ['education'], journeys: KID, ask: 'Comment aider mon enfant à gérer sa colère ?' },
  sleep: { words: ['sommeil', 'fatigue', 'insomnie', 'nuit', 'epuisement', 'repos', 'sieste'], cats: ['sommeil'], ask: 'Comment mieux dormir avec un bébé ?' },
  kid_sleep: { words: ['sommeil', 'nuit', 'reveil', 'endormi', 'coucher', 'cauchemar', 'terreur', 'doudou', 'cododo', 'sieste'], cats: ['sommeil'], journeys: KID, ask: 'Mon bébé se réveille la nuit' },
  kid_sleep_rhythm: { words: ['sommeil', 'sieste', 'rythme', 'nuit', 'coucher', 'reveil'], cats: ['sommeil'], journeys: KID, ask: 'Combien de siestes à quel âge ?' },
  baby_night_help: { words: ['pleur', 'coliques', 'nuit', 'reveil', 'sommeil', 'bout', 'secou', 'calmer'], cats: ['sommeil', 'sante-bebe'], journeys: BABY, ask: 'Comment calmer un bébé qui pleure la nuit ?' },
  family_nights: { words: ['nuit', 'sommeil', 'relais', 'relayer', 'fatigue', 'epuisement'], cats: ['sommeil', 'sante-mentale'], ask: 'Comment s’organiser la nuit à deux ?' },
  // Alimentation
  meals: { words: ['repas', 'aliment', 'menu', 'equilibre', 'legume', 'fruit', 'gouter', 'petit-dejeuner', 'cantine', 'cuisine', 'diversification'], cats: ['alimentation', 'alimentation-bebe'], ask: 'Comment équilibrer les repas ?' },
  meal_rankings: { words: ['repas', 'aliment', 'refus', 'neophob', 'petit mangeur', 'gout', 'legume', 'equilibre'], cats: ['alimentation'], journeys: KID, ask: 'Mon enfant refuse les légumes' },
  baby_foods: { words: ['diversification', 'aliment', 'texture', 'morceau', 'allerg', 'legume', 'fruit', 'premiers'], cats: ['alimentation-bebe'], journeys: KID, ask: 'Quand commencer la diversification ?' },
  preg_eat: { words: ['aliment', 'manger', 'fromage', 'poisson', 'sushi', 'toxoplasm', 'listeri', 'cafe', 'alcool', 'vitamine', 'fer', 'nausee', 'repas'], cats: ['alimentation-grossesse'], journeys: PREG, ask: 'Quels aliments éviter enceinte ?' },
  // Allaitement et biberon
  pp_feeding: { words: ['allait', 'sein', 'tetee', 'lait maternel', 'crevasse', 'mastite', 'engorgement', 'tire-lait', 'tirer'], cats: ['alimentation-bebe'], journeys: BABY, ask: 'Comment savoir si mon bébé boit assez ?' },
  baby_breastfeed: { words: ['allait', 'sein', 'tetee', 'lait maternel', 'crevasse', 'mastite', 'engorgement', 'tire-lait', 'tirer'], cats: ['alimentation-bebe'], journeys: BABY, ask: 'J’ai mal en allaitant' },
  pp_bottle: { words: ['biberon', 'lait infantile', 'preparation', 'sterilis', 'tetine', 'regurgit'], cats: ['alimentation-bebe'], journeys: BABY, ask: 'Comment préparer un biberon ?' },
  baby_bottle_timer: { words: ['biberon', 'lait infantile', 'preparation', 'sterilis', 'tetine', 'regurgit', 'rythme'], cats: ['alimentation-bebe'], journeys: BABY, ask: 'Comment préparer un biberon ?' },
  baby_bottle: { words: ['biberon', 'lait infantile', 'preparation', 'sterilis', 'tetine', 'regurgit'], cats: ['alimentation-bebe'], journeys: BABY, ask: 'Combien de temps se conserve un biberon ?' },
  baby_bottle_history: { words: ['biberon', 'lait infantile', 'croissance', 'poids', 'regurgit', 'appetit'], cats: ['alimentation-bebe'], journeys: BABY, ask: 'Mon bébé boit moins que d’habitude' },
  // Couches et quotidien
  baby_diaper: { words: ['couche', 'selle', 'erytheme', 'fesse', 'diarrhee', 'constipation', 'urine', 'pipi', 'proprete'], cats: ['sante-bebe'], journeys: BABY, ask: 'Quelle couleur de selles doit inquiéter ?' },
  baby_daily: { words: ['soins', 'bain', 'couche', 'cordon', 'quotidien', 'premieres semaines', 'pleur', 'peau'], cats: ['bebe', 'sante-bebe'], journeys: BABY, ask: 'Comment donner le bain à bébé ?' },
  // Croissance et santé de l'enfant
  kid_profile: { words: ['developpement', 'etape', 'langage', 'motricite', 'eveil', 'croissance'], cats: ['developpement'], journeys: KID, ask: 'Que sait faire un enfant à cet âge ?' },
  kid_growth: { words: ['croissance', 'courbe', 'poids', 'taille', 'imc', 'perimetre', 'surpoids', 'petit mangeur'], cats: ['developpement', 'sante-enfant'], journeys: KID, ask: 'Comment lire la courbe de croissance ?' },
  kid_grow: { words: ['developpement', 'eveil', 'motricite', 'langage', 'jeu', 'autonomie', 'activite'], cats: ['developpement', 'activites-eveil'], journeys: KID, ask: 'Quelles activités pour son âge ?' },
  kid_milestones: { words: ['developpement', 'etape', 'marche', 'langage', 'parole', 'motricite', 'premiers mots', 'repere', 'retard'], cats: ['developpement', 'neurodeveloppement'], journeys: KID, ask: 'À quel âge marche un enfant ?' },
  kid_vaccines: { words: ['vaccin', 'rougeole', 'coqueluche', 'meningo', 'hpv', 'bronchiolite', 'rappel'], cats: ['sante-bebe', 'sante-enfant'], journeys: KID, ask: 'Quels vaccins sont obligatoires ?' },
  kid_teeth: { words: ['dent', 'brossage', 'carie', 'dentiste', 'poussee dentaire', 'tetine', 'pouce', 'fluor'], cats: ['sante-enfant', 'sante-bebe'], journeys: KID, ask: 'Comment soulager les poussées dentaires ?' },
  kid_health: { words: ['fievre', 'rhume', 'toux', 'otite', 'gastro', 'bronchiolite', 'varicelle', 'angine', 'temperature', 'maladie', 'eruption'], cats: ['sante-enfant', 'sante-bebe'], journeys: KID, ask: 'Mon enfant a de la fièvre' },
  kid_needs: { words: ['tdah', 'autis', 'tsa', 'dys', 'handicap', 'mdph', 'aesh', 'pai', 'trouble', 'neuro', 'haut potentiel'], cats: ['neurodeveloppement', 'maladies-chroniques'], journeys: KID, ask: 'Comment obtenir une AESH ?' },
  kid_treatments: { words: ['traitement', 'medicament', 'asthme', 'eczema', 'allerg', 'pai', 'chronique', 'diabete', 'epilep'], cats: ['maladies-chroniques', 'sante-enfant'], journeys: KID, ask: 'Comment mettre en place un PAI ?' },
  // Famille
  family_tasks: { words: ['charge mentale', 'organisation', 'partage', 'couple', 'taches', 'quotidien', 'routine', 'autonomie'], cats: ['vie-pratique'], ask: 'Comment mieux partager les tâches ?' },
  family_routines: { words: ['routine', 'rituel', 'coucher', 'matin', 'organisation', 'ecran', 'autonomie', 'rythme'], cats: ['vie-pratique', 'education'], ask: 'Comment installer une routine du soir ?' },
  family_history: { words: ['charge mentale', 'organisation', 'couple', 'partage'], cats: ['vie-pratique'], ask: 'Comment répartir la charge mentale ?' },
  family_calendar: { words: ['organisation', 'rentree', 'vacances', 'mode de garde', 'ecole', 'periscolaire', 'retour au travail', 'conge'], cats: ['vie-pratique', 'ecole-garde'], ask: 'Comment s’organiser pour la rentrée ?' },
  family_metime: { words: ['temps pour soi', 'repos', 'epuisement', 'couple', 'charge mentale', 'stress', 'solitude', 'sport', 'moral'], cats: ['sante-mentale'], ask: 'Comment trouver du temps pour moi ?' },
  family_difficult: { words: ['colere', 'crise', 'limite', 'conflit', 'bout', 'epuisement', 'pleur', 'secou', 'violence', 'opposition', 'fessee'], cats: ['education', 'sante-mentale'], ask: 'Je suis à bout avec mon enfant' },
  family_urgent: { words: ['urgence', 'premiers secours', 'enfant en danger', '119', 'chute', 'intoxication', 'etouffement', 'secou'], cats: ['premiers-secours', 'securite'], ask: 'Que faire en cas d’urgence ?' },
  family_review: { words: ['charge mentale', 'organisation', 'epuisement', 'partage', 'couple'], cats: ['vie-pratique', 'sante-mentale'], ask: 'Comment faire le point à deux ?' },
  // Cycle et contraception
  avoid_cycle: { not: ['ivg', 'fausse couche', 'veut un enfant', 'adolescence', 'menopause'], words: ['duree, abondance', 'douleurs de regles', 'syndrome premenstruel', 'regles', 'cycle', 'spm', 'retard', 'saignement', 'ovulation'], cats: ['regles', 'cycle', 'cycle-ages'], journeys: CYCLE, ask: 'Pourquoi j’ai mal au ventre pendant mes règles ?' },
  avoid_contraception: { not: ['urgence', 'arreter sa contraception'], words: ['choisir sa contraception', 'consultation de contraception', 'methodes de contraception', 'contracep', 'pilule', 'sterilet', 'diu', 'implant', 'preservatif', 'patch', 'anneau'], cats: ['contraception'], journeys: CYCLE, ask: 'Comment choisir ma contraception ?' },
  avoid_methods: { not: ['urgence', 'arreter sa contraception'], words: ['methodes de contraception', 'choisir sa contraception', 'changer de contraception', 'contracep', 'pilule', 'sterilet', 'diu', 'implant', 'preservatif', 'patch', 'anneau', 'methode'], cats: ['contraception'], journeys: CYCLE, ask: 'Quelle contraception est la plus efficace ?' },
  avoid_emergency: { words: ['contraception d', 'pilule du lendemain', 'urgence', 'oubli', 'ivg', 'rapport non protege'], cats: ['contraception'], journeys: CYCLE, ask: 'J’ai oublié ma pilule' },
  avoid_fertile: { words: ['ovulation', 'periode fertile', 'fertil', 'cycle', 'calendrier', 'glaire', 'temperature'], cats: ['cycle', 'cycle-ages', 'fertilite'], journeys: CYCLE, ask: 'Quand a lieu l’ovulation ?' },
  cycle_symptoms: { words: ['regles', 'spm', 'premenstruel', 'douleur', 'migraine', 'humeur', 'pertes', 'seins', 'ballonn', 'fatigue'], cats: ['regles', 'cycle'], journeys: CYCLE, ask: 'Comment soulager le syndrome prémenstruel ?' },
  avoid_consult: { words: ['consultation', 'gyneco', 'sage-femme', 'frottis', 'depistage', 'contracep', 'premiere'], cats: ['sante-intime', 'contraception'], journeys: CYCLE, ask: 'Comment se passe une consultation gynécologique ?' },
  cycle_home: { not: ['ivg', 'fausse couche', 'veut un enfant', 'adolescence', 'menopause'], words: ['duree, abondance', 'retard de regles', 'regles abondantes', 'regles', 'cycle', 'spm', 'ovulation', 'retard', 'abondant'], cats: ['regles', 'cycle', 'cycle-ages'], journeys: CYCLE, ask: 'J’ai du retard dans mes règles' },
  cycle_calendar: { words: ['cycle', 'regles', 'ovulation', 'irregul', 'calendrier', 'retard'], cats: ['regles', 'cycle'], journeys: CYCLE, ask: 'Mes cycles sont irréguliers' },
  cycle_journal: { words: ['cycle', 'regles', 'humeur', 'spm', 'symptome', 'suivre'], cats: ['regles', 'cycle'], journeys: CYCLE, ask: 'Que noter pour suivre son cycle ?' },
  cycle_stats: { words: ['cycle', 'irregul', 'duree', 'regles', 'retard', 'abondant'], cats: ['regles', 'cycle'], journeys: CYCLE, ask: 'Quelle durée de cycle doit faire consulter ?' },
  cycle_guides: { words: ['pertes', 'glaire', 'mycose', 'vaginose', 'infection', 'demangeaison', 'odeur'], cats: ['sante-intime'], journeys: CYCLE, ask: 'Mes pertes ont changé' },
  // Projet bébé
  ttc_start_pregnancy: { words: ['test de grossesse', 'declarer sa grossesse', 'la premiere consultation', 'debut de grossesse', 'premier trimestre', 'declaration'], cats: ['suivi-grossesse', 'fertilite'], journeys: ['ttc', 'pregnant'], ask: 'Quand faire un test de grossesse ?' },
  ttc_cycle: { words: ['ovulation', 'fertil', 'concevoir', 'cycle', 'conception'], cats: ['fertilite', 'preparer-grossesse'], journeys: ['ttc'], ask: 'Quand ai-je le plus de chances de concevoir ?' },
  ttc_calendar: { words: ['ovulation', 'fertil', 'cycle', 'calendrier', 'periode fertile'], cats: ['fertilite'], journeys: ['ttc'], ask: 'Quelle est ma période fertile ?' },
  ttc_periods: { words: ['regles', 'cycle', 'irregul', 'retard', 'absentes'], cats: ['fertilite', 'regles'], journeys: ['ttc'], ask: 'Mes cycles sont irréguliers' },
  ttc_tests: { words: ['test d', 'test de grossesse', 'ovulation', 'lh'], cats: ['fertilite'], journeys: ['ttc'], ask: 'Comment utiliser un test d’ovulation ?' },
  ttc_mucus: { not: ['fausse couche'], words: ['glaire', 'ovulation', 'pertes', 'col'], cats: ['fertilite', 'cycle-ages'], journeys: ['ttc'], ask: 'À quoi ressemble la glaire fertile ?' },
  ttc_temperature: { words: ['temperature', 'courbe', 'ovulation', 'signes'], cats: ['fertilite', 'cycle-ages'], journeys: ['ttc'], ask: 'Comment lire une courbe de température ?' },
  ttc_intimacy: { not: ['endometriose'], words: ['rythme avoir des rapports', 'rapport', 'sexualite', 'desir', 'couple', 'fertil', 'stress'], cats: ['sexualite', 'fertilite'], journeys: ['ttc'], ask: 'À quelle fréquence avoir des rapports pour concevoir ?' },
  ttc_exams: { words: ['examen', 'bilan', 'spermogramme', 'echograph', 'hormon', 'fertilite', 'amh'], cats: ['fertilite', 'difficultes-conception'], journeys: ['ttc'], ask: 'Quels examens de fertilité ?' },
  ttc_understand: { words: ['cycle', 'hormon', 'ovulation', 'fertil', 'conception', 'sopk', 'endometriose'], cats: ['fertilite', 'cycle-ages'], journeys: ['ttc'], ask: 'Comment fonctionne le cycle ?' },
  ttc_consult: { words: ['consulter', 'consultation', 'pma', 'infertil', 'bilan', 'preconception', 'vaccin'], cats: ['difficultes-conception', 'preparer-grossesse'], journeys: ['ttc'], ask: 'Quand consulter si la grossesse tarde ?' },
  // Grossesse
  preg_evolution: { words: ['semaine', 'trimestre', 'developpement', 'fœtus', 'foetus', 'mouvements', 'echograph', 'evolution'], cats: ['suivi-grossesse', 'grossesse'], journeys: PREG, ask: 'Comment évolue bébé ce mois-ci ?' },
  preg_weight: { words: ['poids', 'prise de poids', 'kilos', 'alimentation', 'diabete', 'activite physique'], cats: ['alimentation-grossesse', 'corps-grossesse'], journeys: PREG, ask: 'Combien de kilos prendre pendant la grossesse ?' },
  preg_feel: { words: ['nausee', 'fatigue', 'mal', 'douleur', 'crampe', 'reflux', 'brulure', 'constipation', 'jambes', 'dos', 'sommeil', 'contraction', 'saignement'], cats: ['corps-grossesse', 'sante-grossesse'], journeys: PREG, ask: 'J’ai des nausées enceinte' },
  preg_calendar: { words: ['suivi de grossesse', 'echograph', 'examen', 'consultation', 'rendez-vous', 'calendrier', 'monitoring', 'prise de sang', 'depistage'], cats: ['suivi-grossesse'], journeys: PREG, ask: 'Quand ont lieu les échographies ?' },
  preg_intimacy: { words: ['sexualite', 'rapport', 'desir', 'couple', 'libido'], cats: ['sexualite'], journeys: PREG, ask: 'Peut-on avoir des rapports enceinte ?' },
  preg_names: { words: ['prenom', 'nom de famille', 'declaration de naissance', 'etat civil', 'filiation', 'reconnaissance'], cats: ['droits-demarches'], ask: 'Comment choisir et déclarer le prénom ?' },
  preg_lists: { words: ['valise', 'liste de naissance', 'materiel', 'trousseau', 'chambre', 'preparer', 'budget'], cats: ['materiel', 'vie-pratique'], journeys: PREG, ask: 'Que mettre dans la valise de maternité ?' },
  preg_end: { words: ['fausse couche', 'deuil', 'perte', 'interruption', 'arret de grossesse', 'imG', 'mort'], cats: ['sante-mentale', 'sante-grossesse'], ask: 'Où trouver de l’aide après une perte de grossesse ?' },
  // Post-partum
  pp_recovery: { words: ['post-partum', 'apres l', 'apres la naissance', 'suites de couches', 'retour de couches', 'cicatrice', 'perinee', 'reeducation'], cats: ['post-partum', 'reeducation'], journeys: BABY, ask: 'Combien de temps durent les suites de couches ?' },
  pp_checkin: { words: ['moral', 'baby blues', 'depression', 'post-partum', 'fatigue', 'entretien postnatal', 'anxi'], cats: ['sante-mentale', 'post-partum'], journeys: BABY, ask: 'Je me sens triste depuis la naissance' },
  pp_body: { words: ['perinee', 'reeducation', 'abdomin', 'diastasis', 'cicatrice', 'reprise', 'sport', 'fuites'], cats: ['reeducation', 'post-partum'], journeys: BABY, ask: 'Quand reprendre le sport après l’accouchement ?' },
  pp_mental: { words: ['baby blues', 'depression', 'moral', 'anxi', 'psych', 'epuisement', 'post-partum'], cats: ['sante-mentale'], journeys: BABY, ask: 'Baby blues ou dépression ?' },
  pp_support: { words: ['aide', 'soutien', 'pmi', 'sage-femme', 'entretien postnatal', 'solitude', 'association', 'tisf', 'aide a domicile'], cats: ['sante-mentale', 'droits-demarches'], journeys: BABY, ask: 'Qui peut m’aider après la naissance ?' },
  pp_partner: { not: ['deuil'], words: ['second parent', 'pere', 'conge de paternite', 'couple', 'conge de naissance', 'partenaire'], cats: ['sante-mentale', 'droits-demarches'], journeys: BABY, ask: 'Comment le second parent peut-il aider ?' },
};

/** Questions proposées à l'assistant, en anglais (les mots-clés de recherche, eux, cherchent dans les titres des articles et restent tels quels). */
const ASK_EN: Record<string, string> = {
  'scan_product': 'How do I read a label?',
  'scan_food': 'How do I read the Nutri-Score?',
  'scan_history': 'What should I do with a recalled product?',
  'scan_compare': 'How do I compare two products?',
  'scan_avoid': 'Which foods should I avoid in case of allergy?',
  'kid_products': 'How do I choose a car seat?',
  'nearby': 'What outings are there with a young child?',
  'emergency': 'My child is choking, what should I do?',
  'appointments': 'Which check-ups are compulsory?',
  'documents': 'What paperwork is needed after the birth?',
  'mood': 'I feel exhausted, what can I do?',
  'kid_mood': 'How can I help my child manage their anger?',
  'sleep': 'How can I sleep better with a baby?',
  'kid_sleep': 'My baby wakes up at night',
  'kid_sleep_rhythm': 'How many naps at what age?',
  'baby_night_help': 'How do I soothe a baby who cries at night?',
  'family_nights': 'How can we share the nights between two of us?',
  'meals': 'How do I balance meals?',
  'meal_rankings': 'My child refuses vegetables',
  'baby_foods': 'When should I start introducing solids?',
  'preg_eat': 'Which foods should I avoid when pregnant?',
  'pp_feeding': 'How can I tell if my baby is drinking enough?',
  'baby_breastfeed': 'It hurts when I breastfeed',
  'pp_bottle': 'How do I prepare a bottle?',
  'baby_bottle_timer': 'How do I prepare a bottle?',
  'baby_bottle': 'How long can a bottle be kept?',
  'baby_bottle_history': 'My baby is drinking less than usual',
  'baby_diaper': 'Which stool colours should be a concern?',
  'baby_daily': 'How do I bathe a baby?',
  'kid_profile': 'What can a child do at this age?',
  'kid_growth': 'How do I read the growth chart?',
  'kid_grow': 'Which activities suit their age?',
  'kid_milestones': 'At what age does a child walk?',
  'kid_vaccines': 'Which vaccines are compulsory?',
  'kid_teeth': 'How can I ease teething?',
  'kid_health': 'My child has a fever',
  'kid_needs': 'How do I get a school aide (AESH)?',
  'kid_treatments': 'How do I set up an individual health plan at school (PAI)?',
  'family_tasks': 'How can we share tasks better?',
  'family_routines': 'How do I set up an evening routine?',
  'family_history': 'How can we share the mental load?',
  'family_calendar': 'How do we organise ourselves for the new school year?',
  'family_metime': 'How can I find time for myself?',
  'family_difficult': 'I am at the end of my tether with my child',
  'family_urgent': 'What should I do in an emergency?',
  'family_review': 'How can we take stock together?',
  'avoid_cycle': 'Why do I have tummy pain during my period?',
  'avoid_contraception': 'How do I choose my contraception?',
  'avoid_methods': 'Which contraception is the most effective?',
  'avoid_emergency': 'I forgot my pill',
  'avoid_fertile': 'When does ovulation happen?',
  'cycle_symptoms': 'How can I ease premenstrual syndrome?',
  'avoid_consult': 'What happens at a gynaecological appointment?',
  'cycle_home': 'My period is late',
  'cycle_calendar': 'My cycles are irregular',
  'cycle_journal': 'What should I note to track my cycle?',
  'cycle_stats': 'What cycle length should lead me to seek advice?',
  'cycle_guides': 'My discharge has changed',
  'ttc_start_pregnancy': 'When should I take a pregnancy test?',
  'ttc_cycle': 'When am I most likely to conceive?',
  'ttc_calendar': 'When is my fertile window?',
  'ttc_periods': 'My cycles are irregular',
  'ttc_tests': 'How do I use an ovulation test?',
  'ttc_mucus': 'What does fertile mucus look like?',
  'ttc_temperature': 'How do I read a temperature chart?',
  'ttc_intimacy': 'How often should we have sex to conceive?',
  'ttc_exams': 'Which fertility tests are there?',
  'ttc_understand': 'How does the cycle work?',
  'ttc_consult': 'When should I seek advice if pregnancy is taking a while?',
  'preg_evolution': 'How is my baby developing this month?',
  'preg_weight': 'How much weight should I gain during pregnancy?',
  'preg_feel': 'I have nausea in pregnancy',
  'preg_calendar': 'When are the scans?',
  'preg_intimacy': 'Is it fine to have sex when pregnant?',
  'preg_names': 'How do I choose and register a first name?',
  'preg_lists': 'What should I pack in my maternity bag?',
  'preg_end': 'Where can I find help after a pregnancy loss?',
  'pp_recovery': 'How long does postpartum recovery last?',
  'pp_checkin': 'I have felt sad since the birth',
  'pp_body': 'When can I start exercising again after giving birth?',
  'pp_mental': 'Baby blues or depression?',
  'pp_support': 'Who can help me after the birth?',
  'pp_partner': 'How can the other parent help?'
};
const TOOL_TOPICS_EN: Record<string, ToolTopic> = Object.fromEntries(
  Object.entries(TOOL_TOPICS_FR).map(([k, v]) => [k, { ...v, ask: ASK_EN[k] ?? v.ask }]),
);
export const TOOL_TOPICS: Record<string, ToolTopic> = localized(TOOL_TOPICS_FR, TOOL_TOPICS_EN);

const norm = (s: string) => ` ${s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`]/g, ' ').replace(/[^a-z0-9œ\- ]+/g, ' ').replace(/\s+/g, ' ')} `;

/** Score d'un article pour un outil (0 = aucun mot-clé trouvé ; les catégories seules ne suffisent pas). */
export function toolArticleScore(topic: ToolTopic, a: { title: string; tags?: string[]; journeys?: string[] }, catSlug?: string): number {
  const title = norm(a.title);
  const tags = norm((a.tags ?? []).join(' '));
  if (topic.not?.some((w) => title.includes(` ${norm(w).trim()}`))) return 0;
  let s = 0;
  topic.words.forEach((w, i) => {
    const k = ` ${norm(w).trim()}`;
    // les 3 premiers mots-clés désignent le cœur de l'outil
    if (title.includes(k)) s += i < 3 ? 4.5 : 3;
    else if (tags.includes(k)) s += 1.5;
  });
  if (!s) return 0;
  // parcours : un article réservé à un autre moment de vie (ex. « Anxiété pendant la grossesse » pour l'humeur de l'enfant) est écarté
  if (topic.journeys?.length && a.journeys?.length) {
    if (!a.journeys.some((j) => topic.journeys!.includes(j))) return 0;
    s += 1;
  }
  if (catSlug && topic.cats?.includes(catSlug)) s += 2;
  return s;
}

/** Les meilleurs articles pour un outil. */
export function articlesForTool<T extends ArticleSummary>(toolId: string, articles: T[], categories: Category[] | undefined, n = 3): T[] {
  const topic = TOOL_TOPICS[toolId];
  if (!topic) return [];
  const slugOf = new Map((categories ?? []).map((c) => [c.id, c.slug]));
  return articles
    .map((a) => ({ a, s: toolArticleScore(topic, a as never, slugOf.get(a.category_id ?? '')) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s || x.a.title.length - y.a.title.length)
    .slice(0, n)
    .map((x) => x.a);
}
