/**
 * Intentions prédéfinies de la recherche d'outils (FR et EN) — locales, déterministes, sans IA.
 * Une intention reconnaît une TOURNURE PARLÉE (texte normalisé : sans accents ni ponctuation, minuscules, entouré
 * d'espaces) et nomme les outils qu'elle vise, dans l'ordre. Elle complète les mots-clés (th.<id>.k, h2.<n>.k) là où
 * un mot isolé ne suffit pas : « il tète », « 39 de fièvre », « baby wont sleep », « mon mari ne comprend pas ».
 * Les fautes de frappe courantes sont absorbées par des variantes dans l'expression.
 * Test : src/__tests__/toolSearch200.test.ts (plus de 100 formulations réelles).
 */
export interface SearchIntent { id: string; re: RegExp; ids: string[] }

const w = (alts: string) => new RegExp(`(?:^| )(?:${alts})(?= |$)`);

export const SEARCH_INTENTS: SearchIntent[] = [
  // allaitement : « il tète », « prend le sein », « nursing »
  { id: 'breastfeed', re: w('tete|tetent|tetee|tetees|tetes|tettee|tetter|teter|prend le sein|prends le sein|donne le sein|donner le sein|au sein|allaite|allaites|allaitement|allaitemnet|alaitement|allaitment|breastfeed\\w*|breast feed\\w*|breast feeding|nursing|nurse|latch\\w*|on the breast'), ids: ['baby_breastfeed'] },
  { id: 'side', re: w('quel sein|which side|which breast|sein gauche|sein droit|left breast|right breast'), ids: ['h200_67', 'baby_breastfeed'] },
  { id: 'pump', re: w('tire lait|tirer mon lait|tire mon lait|pump\\w*|breast pump|exprimer|expressed milk'), ids: ['h200_71'] },
  { id: 'bottle', re: w('biberon|biberons|bib|bibs|bottle|bottles|formula|lait infantile|lait en poudre'), ids: ['baby_bottle', 'baby_bottle_timer'] },
  { id: 'scoops', re: w('mesurette\\w*|scoop\\w*|combien de mesures'), ids: ['bottle_scoops'] },
  // sommeil de l'enfant : « il ne dort pas », « suivre ses nuits », « baby wont sleep »
  { id: 'kidSleep', re: w('ne dort pas|dort pas|ne dor pas|dor pas|ne dors pas|bebe dors|ne domr pas|dort mal|ne dort jamais|dort plus|ses nuits|sa nuit|nuits de bebe|fait pas ses nuits|fait ses nuits|sommeil de bebe|sommeil de mon bebe|sommeil de l enfant|endormir|endort|dodo|sieste|siestes|won t sleep|wont sleep|will not sleep|doesn t sleep|doesnt sleep|not sleeping|baby sleep|sleep schedule|nap|naps|night wakings|wakes up at night|wakes at night|se reveille|reveils'), ids: ['kid_sleep', 'kid_sleep_rhythm'] },
  { id: 'mySleep', re: w('je dors mal|je dors pas|mon sommeil|insomnie|i can t sleep|i cant sleep|my sleep'), ids: ['sleep'] },
  // fièvre et santé : « 39 de fièvre », « il a chaud »
  { id: 'fever', re: w('fievre|fivre|fiever|fever|feverish|temperature|temp|thermometre|thermometer|3[7-9]|40|3[7-9] [0-9]|38 5|39 5|de la temperature|il est chaud|elle est chaude|high temp'), ids: ['h200_102', 'kid_health', 'medications'] },
  { id: 'sick', re: w('malade|rhume|toux|tousse|vomit|vomi|diarrhee|gastro|sick|ill|cough|vomiting|cold|symptomes|symptoms'), ids: ['kid_health', 'h200_102'] },
  { id: 'teeth', re: w('dent|dents|dentaire|poussee dentaire|percee dentaire|fait ses dents|perce ses dents|teething|teeth|tooth|teethin|teeting|molaire'), ids: ['kid_teeth'] },
  { id: 'meds', re: w('medicament|medicaments|doliprane|paracetamol|ibuprofene|antibiotique|medicine|medication|meds|dose'), ids: ['medications', 'kid_treatments'] },
  { id: 'vaccine', re: w('vaccin|vaccins|vaccination|vaccine|vaccines|shot|shots|jab|jabs|rappel de vaccin'), ids: ['kid_vaccines'] },
  { id: 'weight', re: w('poids|pese|pesee|combien il pese|combien elle pese|weigh|weight|how much does'), ids: ['h200_92', 'kid_profile'] },
  { id: 'growth', re: w('courbe|courbes|croissance|taille|mesure|grandit|growth|height|percentile'), ids: ['kid_profile', 'h200_95', 'h200_93'] },
  { id: 'diaper', re: w('couche|couches|caca|pipi|selles|change|changes|diaper|diapers|nappy|nappies|poop|poo|stool'), ids: ['baby_diaper'] },
  { id: 'pediatre', re: w('pediatre|pediatrician|paediatrician|doctor|medecin|docteur|rdv|rendez vous|appointment|appointments'), ids: ['appointments', 'consult_questions'] },
  // diversification et repas
  { id: 'solids', re: w('diversification|diversif|diversificaton|premiers aliments|commencer les purees|puree|purees|solids|starting solids|weaning|first foods|blw|dme'), ids: ['baby_foods', 'h200_111'] },
  { id: 'allergy', re: w('allergie|allergies|allergene|allergenes|allergy|allergic|allergen|allergens|arachide|peanut'), ids: ['h200_114', 'scan_avoid'] },
  { id: 'refuse', re: w('refuse de manger|mange rien|mange pas|ne mange pas|won t eat|wont eat|picky'), ids: ['meals', 'baby_foods'] },
  { id: 'menu', re: w('quoi manger|quoi cuisiner|menu|menus|repas de la semaine|planning repas|meal plan|what to eat|what to cook'), ids: ['meal_menu', 'meals'] },
  { id: 'shopping', re: w('courses|liste de courses|shopping|groceries|grocery'), ids: ['family_shopping'] },
  // garde
  { id: 'nannyBudget', re: w('budget de garde|cout de la garde|combien coute une creche|combien coute une nounou|coute une creche|prix de la creche|tarif nounou|tarif de la creche|childcare cost|childcare budget|nanny rates|how much does daycare cost'), ids: ['h200_147', 'h200_146'] },
  { id: 'nannyHours', re: w('heures de garde|pointage|childcare hours|nanny hours'), ids: ['h200_149'] },
  { id: 'nannyContract', re: w('contrat de la nounou|contrat nounou|contrat de garde|contrat de la creche|nanny contract|childcare contract'), ids: ['h200_151'] },
  { id: 'daycareSignup', re: w('inscription a la creche|inscrire a la creche|inscription creche|inscription a l ecole|school registration'), ids: ['kid_school'] },
  { id: 'nanny', re: w('nounou|nounous|nouno|nanny|nannies|nany|babysitter|baby sitter|babysitting|garde d enfant|garde d enfants|mode de garde|creche|assistante maternelle|ass mat|childcare|child care|childminder|daycare|day care|nursery'), ids: ['h200_141', 'h200_142', 'childcare'] },
  { id: 'liaison', re: w('carnet de liaison|cahier de liaison|journee chez la nounou|journee de garde|daily log|care diary'), ids: ['h200_153', 'childcare'] },
  // couple : « je suis épuisée et mon mari ne comprend pas »
  { id: 'understand', re: w('ne comprend pas|comprend pas|ne me comprend|comprend rien|m ecoute pas|n ecoute pas|se comprendre|on se dispute|dispute|disputes|conflit|engueulade|doesn t understand|doesnt understand|does not understand|we argue|we fight|argument|arguing|communication|communiquer'), ids: ['couple_understand', 'couple_week'] },
  { id: 'exhausted', re: w('epuise|epuisee|epuises|crevee|creve|a bout|n en peux plus|j en peux plus|burn out|burnout|exhausted|worn out|drained|overwhelmed'), ids: ['exhaustion_check', 'family_nights', 'couple_understand', 'family_sos'] },
  { id: 'intimacy', re: w('intimite|libido|desir|sexualite|intimacy|sex life|libido'), ids: ['couple_understand'] },
  { id: 'load', re: w('qui fait quoi|repartition|partage des taches|charge mentale|mental load|who does what|chores split'), ids: ['mental_load', 'family_domains', 'family_tasks'] },
  { id: 'tasks', re: w('taches|tache|menage|chores|housework|to do|todo'), ids: ['family_tasks'] },
  { id: 'nights', re: w('qui se leve|tour de nuit|relais de nuit|night shift|whose turn'), ids: ['family_nights'] },
  { id: 'invite', re: w('inviter mon mari|inviter ma femme|inviter le papa|inviter la maman|inviter l autre parent|invite my partner|invite my husband|invite my wife'), ids: ['h200_162'] },
  // grossesse, cycle
  { id: 'pregnancy', re: w('enceinte|grossesse|pregnant|pregnancy|semaine de grossesse|sa'), ids: ['preg_evolution', 'preg_calendar'] },
  { id: 'kicks', re: w('bebe bouge|bouge|coups de pied|kicks|kick count|movements'), ids: ['preg_moves'] },
  { id: 'nausea', re: w('nausee|nausees|vomissements|morning sickness|nausea'), ids: ['h200_36', 'preg_feel'] },
  { id: 'names', re: w('prenom|prenoms|baby name|baby names'), ids: ['preg_names'] },
  { id: 'bag', re: w('valise|valise maternite|hospital bag'), ids: ['h200_45', 'preg_lists'] },
  { id: 'periods', re: w('regles|regle|period|periods|menstruation|menstrual'), ids: ['cycle_home', 'cycle_calendar'] },
  { id: 'ovulation', re: w('ovulation|ovule|ovulate|fertile|fertility|fertilite|ovulating'), ids: ['h200_17', 'ttc_cycle', 'ttc_tests'] },
  { id: 'pillForgot', re: w('oublie ma pilule|oublie la pilule|oubli de pilule|oubli pilule|forgot my pill|missed my pill|missed pill'), ids: ['avoid_emergency', 'avoid_reminders'] },
  { id: 'pill', re: w('pilule|pill|contraception|contraceptif|birth control'), ids: ['h200_9', 'avoid_contraception'] },
  // enfant plus grand, communauté
  { id: 'homework', re: w('devoirs|lecons|cahier de textes|homework'), ids: ['h200_137'] },
  { id: 'school', re: w('ecole|maternelle|devoirs|cartable|school|homework'), ids: ['kid_school', 'kid_routines'] },
  { id: 'activities', re: w('que faire avec|occuper|activite|activites|jeux|jouer|activities|what to do with|play ideas'), ids: ['h200_131', 'nearby'] },
  { id: 'community', re: w('autres parents|autres mamans|autres papas|rencontrer|forum|communaute|other parents|other mums|other moms|community|meet parents'), ids: ['community'] },
  { id: 'firsts', re: w('premiers pas|premier mot|premiere fois|first steps|first word|first time'), ids: ['journal', 'kid_grow'] },
  { id: 'calendar', re: w('agenda|calendrier familial|planning de la famille|family calendar|shared calendar'), ids: ['family_calendar'] },
  { id: 'custody', re: w('garde alternee|separes|separation|coparentalite|shared custody|separated|divorced'), ids: ['custody'] },
  // HOMI Aura : « aide », « assistant », « IA » SEULS (sinon « aide pour le sommeil » chercherait le sommeil), et
  // « je ne sais pas par où commencer » → l'assistante et la découverte
  { id: 'aura', re: /^ (?:aide|de l aide|besoin d aide|j ai besoin d aide|l aide|aidez moi|aide moi|assistant|assistante|l assistant|l assistante|assistant ia|assistante ia|ia|l ia|intelligence artificielle|homi aura|aura|help|i need help|assistant ai|ai assistant|ai|artificial intelligence) $/, ids: ['h200_197', 'h200_200'] },
  { id: 'start', re: w('par ou commencer|par quoi commencer|je ne sais pas quoi faire|je suis perdue|je suis perdu|where do i start|where to start|don t know where to start|dont know where to start|i m lost'), ids: ['h200_200', 'h200_197'] },
  // DE / ES / IT (20/11/2026) : tournures parlées des besoins les plus fréquents, dans les trois autres langues de l'app
  { id: 'breastfeedIntl', re: w('stillen|stillt|gestillt|an der brust|trinkt an der brust|amamantar|amamanto|da el pecho|toma el pecho|lactancia|teta|allattare|allatto|allattamento|prende il seno|al seno|poppata|poppate'), ids: ['baby_breastfeed'] },
  { id: 'kidSleepIntl', re: w('schlaft nicht|schlaeft nicht|schlafen|einschlafen|nickerchen|mittagsschlaf|no duerme|duerme mal|siesta|siestas|dormir al bebe|non dorme|dorme male|nanna|pisolino|sonnellino|addormentare'), ids: ['kid_sleep', 'kid_sleep_rhythm'] },
  { id: 'bottleIntl', re: w('flasche|flaschchen|flaeschchen|biberon|biberones|mamadera|biberon di latte|latte artificiale|pulvermilch|leche de formula'), ids: ['baby_bottle', 'baby_bottle_timer'] },
  { id: 'diaperIntl', re: w('windel|windeln|wickeln|panal|panales|cambiar el panal|pannolino|pannolini|cambio pannolino'), ids: ['baby_diaper'] },
  { id: 'feverIntl', re: w('fieber|hat fieber|fiebre|tiene fiebre|febbre|ha la febbre'), ids: ['h200_102', 'kid_health', 'medications'] },
  { id: 'growthIntl', re: w('wachstum|wachstumskurve|gewicht|groesse|crecimiento|curva de crecimiento|peso|altura|crescita|curva di crescita|altezza'), ids: ['kid_profile', 'h200_95', 'h200_93'] },
  { id: 'mealsIntl', re: w('essen|mahlzeit|mahlzeiten|rezepte|kochen|comida|comidas|recetas|que cocinar|pasto|pasti|ricette|cosa cucinare|svezzamento|beikost|alimentacion complementaria'), ids: ['meals', 'baby_foods'] },
  { id: 'tasksIntl', re: w('aufgaben|haushalt|wer macht was|tareas|tareas de casa|quien hace que|faccende|compiti di casa|chi fa cosa'), ids: ['family_tasks', 'mental_load'] },
  { id: 'solo', re: w('parent solo|maman solo|papa solo|seule avec|seul avec|single mum|single mom|single dad|single parent'), ids: ['solo_parent'] },
];
