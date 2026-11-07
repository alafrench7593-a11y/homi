/**
 * Vidéos OFFICIELLES lues dans l'appli (07/11/2026).
 *
 * Chaque vidéo a été vérifiée le 07/11/2026 via l'oEmbed de YouTube : elle existe, elle est publiée par la chaîne
 * indiquée (`by`) et son auteur autorise l'intégration (oEmbed 200). Aucune vidéo n'est copiée : elles sont lues
 * avec le lecteur YouTube (mode sans cookie), chargé seulement quand la personne appuie sur « Lire ».
 *
 * Les fichiers MP4 de 1000-premiers-jours.fr ne sont PAS utilisés : leurs mentions légales soumettent toute reprise
 * à l'accord de Santé publique France et excluent l'usage commercial.
 */
import { toolArticleScore } from '@/lib/domain/toolArticles';

export const VIDEOS_CHECKED_ON = '2026-11-07';

export type VideoChannel = 'spf' | 'has' | 'ameli' | 'min' | 'crf';
export type VideoTopic = 'cycle' | 'contraception' | 'fertility' | 'pregnancy' | 'birth' | 'baby' | 'sleep' | 'feeding' | 'meals' | 'health' | 'firstaid' | 'admin' | 'couple' | 'me';
/** « tuto » : un geste ou une démarche pas à pas (section Tutos) ; « info » : comprendre, témoignages, conseils. */
export type VideoKind = 'tuto' | 'info';
export type VideoJourney = 'avoid' | 'ttc' | 'pregnant' | 'newborn' | 'child';
export interface OfficialVideo {
  /** Identifiant YouTube (11 caractères). */
  id: string;
  by: VideoChannel;
  topic: VideoTopic;
  /** Titre court affiché (clé sol.v.<key>) ; le titre exact de la chaîne reste visible sur YouTube. */
  key: string;
  /** Mots-clés pour relier les articles de la bibliothèque (les 3 premiers comptent double). Par défaut : ceux du thème. */
  words?: string[];
  kind?: VideoKind;
  /** Durée en secondes, relevée pendant la vérification. */
  dur?: number;
  cats?: string[];
  /** Mots qui écartent un article (titre). */
  not?: string[];
  journeys?: VideoJourney[];
}

// Toutes vérifiées le 07/11/2026 : chaîne officielle (oEmbed), intégration autorisée et LECTURE réelle constatée.
export const OFFICIAL_VIDEOS: OfficialVideo[] = [
  // Grossesse
  { id: 'FeYcx3fvO_Y', by: 'spf', topic: 'pregnancy', key: 'first_1000', words: ['attachement', '1000 premiers jours', 'lien', 'developpement du cerveau', 'eveil'], journeys: ['pregnant', 'newborn'] },            // L'impact des 1 000 premiers jours : un pédiatre nous explique
  { id: 'd2yk55Qsg4k', by: 'spf', topic: 'pregnancy', key: 'small_ailments', words: ['petits maux', 'nausees', 'grossesse', 'fatigue', 'brulures'], cats: ['corps-grossesse', 'sante-grossesse'], journeys: ['pregnant'] }, // [Des pros à votre écoute] Les petits maux ne sont pas si petits que ça !
  { id: 'K_BgbOrgiQM', by: 'spf', topic: 'pregnancy', key: 'play_before_birth', words: ['haptonomie', 'lien', 'bebe in utero', 'grossesse', 'attachement'], journeys: ['pregnant'] },                // Jouer avec bébé avant la naissance : un pédiatre réagit
  // Bébé au quotidien
  { id: '-9O4Go_lidQ', by: 'has', topic: 'baby', key: 'shaken_parents', words: ['bebe secoue', 'pleurs', 'colere', 'epuisement'], journeys: ['newborn'] },        // HAS - Bébé secoué : Ce que savent les jeunes parents
  { id: 'IscZPl8f4oU', by: 'has', topic: 'baby', key: 'shaken_doctor', words: ['bebe secoue', 'pleurs', 'signes d alerte', 'coliques'], not: ['psychose'], journeys: ['newborn'] },          // HAS - Bébé secoué : Les réponses du médecin
  { id: 'HhtKdT4FtHk', by: 'spf', topic: 'baby', key: 'connection', words: ['attachement', 'lien', 'eveil', 'jeu', 'interactions'], cats: ['developpement', 'activites-eveil'], journeys: ['newborn'] }, // L'importance des moments de connexion parent-bébé
  { id: '5c97SHGXZU8', by: 'spf', topic: 'baby', key: 'screens', words: ['ecrans', 'ecran', 'telephone', 'television'], journeys: ['newborn', 'child'] },                // Parents sans écran : un pédiatre nous explique les bienfaits
  { id: '1RNL6FgQFK4', by: 'spf', topic: 'baby', key: 'compare', words: ['developpement', 'etapes', 'comparer', 'marche', 'langage'], cats: ['developpement'], journeys: ['newborn'] }, // [Des pros à votre écoute] Ce n'est pas faute de savoir qu'il ne faut pas comparer son enfant…
  // Sommeil
  { id: 'qG88EmGtSPQ', by: 'spf', topic: 'sleep', key: 'sleep_routine', words: ['sommeil', 'endormir', 'coucher', 'rituel', 'nuit'], cats: ['sommeil'], journeys: ['newborn', 'child'] }, // Une routine miracle pour endormir bébé : un pédiatre nous répond
  // Allaitement et biberon
  { id: 'O2IzhSBA0OI', by: 'spf', topic: 'feeding', key: 'breastfeeding', words: ['allaitement', 'sein', 'tetee', 'lactation'], journeys: ['newborn'] },         // [Des pros à votre écoute] Ma fille n'arrivait plus à prendre le sein
  { id: '3Ug8vL9cLJs', by: 'spf', topic: 'feeding', key: 'weight', words: ['prise de poids', 'poids', 'courbe', 'croissance'], journeys: ['newborn'] },                // [Des pros à votre écoute] La prise de poids de bébé me stresse énormément
  // Repas de l'enfant
  { id: 'RMvvJ2Qd2c0', by: 'spf', topic: 'meals', key: 'portions', words: ['portions', 'quantites', 'repas', 'alimentation'], journeys: ['child'] },             // Petit à petit, les portions de votre enfant augmentent
  { id: 'o_CEPpC5MIo', by: 'spf', topic: 'meals', key: 'appetite', words: ['appetit', 'refuse de manger', 'repas', 'alimentation'], journeys: ['child'] },             // Comment aider votre enfant à écouter son appétit ?
  { id: '0SY_8YtfaCc', by: 'spf', topic: 'meals', key: 'veggies', words: ['legumes', 'fruits', 'neophobie', 'repas'], journeys: ['child'] },              // Comment faire manger plus de fruits et légumes à votre enfant ?
  // Couple
  { id: 'TMqX-8Mo2Vc', by: 'spf', topic: 'couple', key: 'couple_second', words: ['couple', 'charge mentale', 'sexualite apres', 'communication'], journeys: ['pregnant', 'newborn'] }, // [Des pros à votre écoute] Notre couple est passé en second, c'est bébé en priorité
  // Prendre soin de soi
  { id: 'cF5O8Mkz-Is', by: 'spf', topic: 'me', key: 'forget_myself', words: ['post-partum', 'baby blues', 'fatigue', 'retour a la maison'], cats: ['post-partum', 'sante-mentale'] },          // [Des pros à votre écoute] Quand on a accouché… on s'oublie soi
  { id: 'YgmlqgbahtU', by: 'spf', topic: 'me', key: 'pmi_home', words: ['pmi', 'sage-femme', 'visite a domicile', 'retour a la maison'] },                // [Des pros à votre écoute] Des visites à domicile peuvent être proposées par la PMI
  { id: 'IBnkBB46TG0', by: 'ameli', topic: 'me', key: 'not_alone', words: ['sante mentale', 'depression', 'anxiete', 'epuisement'], cats: ['sante-mentale'] },             // Santé mentale : Ne restez pas seul.e avec votre mal-être !
  { id: '3fu2O22bN2c', by: 'ameli', topic: 'me', key: 'psy', words: ['psychologue', 'soutien psy', 'sante mentale', 'depression'], cats: ['sante-mentale'] },                   // Mon soutien psy | L'essentiel
  { id: 'a54dG9wg5uw', by: 'ameli', topic: 'me', key: 'psy_session', words: ['psychologue', 'soutien psy', 'depression du post-partum', 'anxiete', 'sante mentale'], cats: ['sante-mentale'] },        // Mon soutien psy | Entretien avec une psychologue conventionnée
];


// Ajout du 07/11/2026 (2e lot) : 78 vidéos, chacune vérifiée (oEmbed : chaîne officielle) et LUE réellement dans le
// lecteur intégré sur le Mac (état « lecture », durée relevée). Chaînes : Santé publique France, Assurance Maladie,
// HAS, Ministère chargé de la Santé, Croix-Rouge française (premiers secours, « Mes Infos Bébé »).
const T = (id: string, by: VideoChannel, topic: VideoTopic, key: string, dur: number, extra: Partial<OfficialVideo> = {}): OfficialVideo => ({ id, by, topic, key, dur, ...extra });
export const MORE_VIDEOS: OfficialVideo[] = [
  // Cycle et règles
  T('gR1i0SFNGCs', 'min', 'cycle', 'period_pain', 60, { words: ['regles douloureuses', 'douleurs de regles', 'dysmenorrhee', 'endometriose'] }),
  T('cbbS7tO2e7s', 'min', 'cycle', 'endo_symptoms', 62, { words: ['endometriose', 'regles douloureuses', 'douleurs'] }),
  T('gsuyePiQm4E', 'min', 'cycle', 'endo_living', 57, { words: ['endometriose', 'douleurs', 'fertilite'] }),
  T('ZtvRI65PvHY', 'min', 'cycle', 'endo_treatment', 52, { words: ['endometriose', 'traitement', 'douleurs'] }),
  T('bRbNNLT7BuU', 'has', 'cycle', 'endo_has', 2735, { words: ['endometriose', 'regles', 'diagnostic'] }),
  // Contraception et IVG
  T('jdcH_aA9Hwk', 'min', 'contraception', 'contra_gyneco', 82),
  T('4FRjPMr48SU', 'spf', 'contraception', 'contra_spf', 1561),
  T('EL7SJrnP-e4', 'min', 'contraception', 'ivg_hotline', 98, { words: ['ivg', 'interruption volontaire', 'contraception', 'sexualite'] }),
  T('F_vpnIDReeQ', 'min', 'contraception', 'ivg_what_to_do', 84, { words: ['ivg', 'interruption volontaire', 'grossesse non prevue'] }),
  T('V7kECXgeLbk', 'min', 'contraception', 'ivg_steps', 127, { words: ['ivg', 'interruption volontaire', 'grossesse non prevue'] }),
  T('IylsgIVdQ54', 'min', 'contraception', 'ivg_after_contra', 63, { words: ['ivg', 'contraception', 'pilule', 'sterilet'] }),
  // Envie de bébé
  T('cxfCFJJpiyY', 'has', 'fertility', 'fertility_reflexes', 44),
  T('OaZc4Ervgfw', 'min', 'fertility', 'fertility_gyneco', 86),
  T('VK_c9V9hEXs', 'spf', 'fertility', 'smoking_baby', 145, { words: ['tabac', 'arreter de fumer', 'fertilite', 'grossesse'] }),
  // Grossesse
  T('vjPzsPBjGPI', 'ameli', 'pregnancy', 'preg_journey', 1615, { words: ['suivi de grossesse', 'examens', 'echographie', 'consultations'] }),
  T('p31ubvzaIds', 'ameli', 'pregnancy', 'preg_work', 1747, { words: ['travail', 'conge maternite', 'grossesse', 'droits'] }),
  T('Kp-sjt-p5E8', 'ameli', 'pregnancy', 'preg_parenting', 1813, { words: ['preparation a la naissance', 'parentalite', 'entretien prenatal'] }),
  T('kL-F2NzRfJI', 'spf', 'pregnancy', 'preg_vaccines', 151, { words: ['vaccin', 'vaccination', 'grippe', 'coqueluche'] }),
  T('yGBs4odBqmk', 'min', 'pregnancy', 'preg_vaccines_pr', 69, { words: ['vaccin', 'vaccination', 'grippe', 'coqueluche'] }),
  T('jPU65DQ0rXk', 'spf', 'pregnancy', 'preg_alcohol', 176, { words: ['alcool', 'grossesse', 'zero alcool'] }),
  T('Xvmx0Hc1gIY', 'spf', 'pregnancy', 'preg_addiction', 206, { words: ['addiction', 'alcool', 'tabac', 'cannabis'] }),
  // Accouchement et post-partum
  T('37WSz7em-mg', 'ameli', 'birth', 'birth_day', 2198, { words: ['accouchement', 'jour j', 'maternite', 'sejour'] }),
  T('GZFR685wYg0', 'ameli', 'birth', 'birth_costs', 96, { kind: 'tuto', words: ['accouchement', 'remboursement', 'frais', 'maternite'] }),
  T('2QkmBtGyXkQ', 'ameli', 'birth', 'pp_ask_help', 77, { words: ['post-partum', 'baby blues', 'aide', 'fatigue'] }),
  T('Oi_iGdG_28c', 'min', 'birth', 'pp_depression_story', 98, { words: ['depression du post-partum', 'baby blues', 'post-partum'] }),
  T('YSCLBd-S-bQ', 'ameli', 'birth', 'parents_health', 2039, { words: ['post-partum', 'reeducation', 'perinee', 'sante des parents'] }),
  // Bébé au quotidien
  T('jz8rEXB2pYo', 'ameli', 'baby', 'child_checkups', 2379, { words: ['examens obligatoires', 'carnet de sante', 'suivi', 'pediatre'] }),
  T('fL96vxtd8SA', 'min', 'baby', 'newborn_screening', 135, { words: ['depistage neonatal', 'nouveau-ne', 'maternite'] }),
  T('E-FNTOqfZdg', 'spf', 'baby', 'baby_vaccines', 142, { words: ['vaccin', 'vaccination', 'calendrier vaccinal'] }),
  T('9PvOwdsIK5Y', 'crf', 'baby', 'first_steps', 121, { words: ['premiers pas', 'marche', 'motricite', 'developpement moteur'] }),
  T('rP_BRamp5rs', 'crf', 'baby', 'tummy_mat', 125, { kind: 'tuto', words: ['tapis d eveil', 'motricite libre', 'eveil', 'sur le ventre'] }),
  // Sommeil
  T('6fYsGVAdAME', 'ameli', 'sleep', 'sleep_parents', 1974, { words: ['sommeil', 'nuits', 'fatigue', 'reveils nocturnes'] }),
  // Repas et diversification (tutos Santé publique France)
  T('ycahEaDwjEY', 'min', 'meals', 'div_anticipate', 111, { words: ['diversification', 'premiers aliments', 'purees'] }),
  T('65uF1BUXTHc', 'spf', 'meals', 'div_when_how', 72, { kind: 'tuto', words: ['diversification', 'nouveaux aliments', 'allergenes'] }),
  T('8IFRjvqbePo', 'spf', 'meals', 'div_position', 37, { kind: 'tuto', words: ['diversification', 'chaise haute', 'repas', 'fausse route'] }),
  T('_oBp2G-gwYQ', 'spf', 'meals', 'div_textures', 52, { kind: 'tuto', words: ['diversification', 'textures', 'morceaux'] }),
  T('_xUH2tl9Tl8', 'spf', 'meals', 'div_lumps', 94, { kind: 'tuto', words: ['morceaux', 'textures', 'diversification'] }),
  T('eh5n9kaZnKM', 'spf', 'meals', 'div_enough', 55, { kind: 'tuto', words: ['quantites', 'appetit', 'diversification'] }),
  T('9JZGbDKsz_E', 'spf', 'meals', 'div_refuses', 51, { kind: 'tuto', words: ['refuse de manger', 'neophobie', 'diversification'] }),
  T('dZvzDIfjjaQ', 'spf', 'meals', 'div_picky', 77, { kind: 'tuto', words: ['neophobie', 'refuse de manger', 'selectivite'], not: ['dyscalculie'] }),
  T('zG5G5KvlG1E', 'spf', 'meals', 'div_play_food', 42, { kind: 'tuto', words: ['manger avec les doigts', 'diversification', 'autonomie'] }),
  T('qKQmvHsmLcQ', 'spf', 'meals', 'div_sugar', 64, { kind: 'tuto', words: ['sucre', 'produits sucres', 'gouter'], not: ['grossesse'] }),
  T('dWpm378gGFM', 'spf', 'meals', 'beyond_pasta', 49, { words: ['repas', 'legumes', 'idees repas', 'neophobie'] }),
  // Santé de l'enfant : problèmes courants
  T('T1UwtFW3TxM', 'min', 'health', 'winter_viruses', 132, { words: ['bronchiolite', 'rhume', 'virus', 'lavage de nez'] }),
  T('NTrKUiqu_hA', 'min', 'health', 'bronchiolitis_myth', 90, { words: ['bronchiolite', 'respiration', 'nourrisson'] }),
  T('2ndX85b1M_I', 'min', 'health', 'bronchiolitis', 20, { words: ['bronchiolite', 'respiration', 'nourrisson'] }),
  T('nGH1QPCWEds', 'spf', 'health', 'bronchiolitis_avoid', 25, { words: ['bronchiolite', 'lavage des mains', 'virus'] }),
  T('fT3r-W0GhJ0', 'spf', 'health', 'measles', 28, { words: ['rougeole', 'vaccin', 'ror'] }),
  T('0EnNZjfC4Hg', 'min', 'health', 'hpv', 126, { words: ['hpv', 'papillomavirus', 'vaccin'], journeys: ['child'] }),
  T('uYUHWkkHD3A', 'has', 'health', 'button_battery', 103, { words: ['pile bouton', 'ingestion', 'accidents domestiques'] }),
  T('Wv1cz9rvZlE', 'has', 'health', 'adhd_turbulent', 150, { words: ['tdah', 'hyperactivite', 'attention', 'agitation'] }),
  T('gK6xGJrO-fk', 'has', 'health', 'adhd_parents', 81, { words: ['tdah', 'hyperactivite', 'attention'], not: ['sieste'] }),
  T('lMluBkjBixE', 'has', 'health', 'teen_depression', 112, { words: ['adolescent', 'depression', 'sante mentale'], not: ['grossesse', 'pere', 'post-partum'] }),
  T('wBh0O57_x98', 'has', 'health', 'child_weight', 115, { words: ['surpoids', 'obesite', 'courbe de corpulence'], not: ['grossesse'] }),
  T('487mpBSaONY', 'spf', 'health', 'heatwave', 75, { words: ['canicule', 'chaleur', 'deshydratation'] }),
  T('SGgH9R0_I-Q', 'spf', 'health', 'heat_home', 65, { kind: 'tuto', words: ['canicule', 'chaleur', 'temperature'] }),
  T('uS6pXrxpAVA', 'crf', 'health', 'punishment', 109, { words: ['punition', 'violences educatives', 'colere', 'crie'], not: ['conge'], journeys: ['child'] }),
  // Premiers secours (tutos Croix-Rouge française)
  T('XsaXjXMFMXw', 'crf', 'firstaid', 'fa_baby_choking', 361, { kind: 'tuto', words: ['etouffement', 'fausse route', 'premiers secours'] }),
  T('D4P2pbjKgGo', 'crf', 'firstaid', 'fa_baby_cpr', 360, { kind: 'tuto', words: ['arret cardiaque', 'massage cardiaque', 'inconscient', 'premiers secours'], not: ['grossesse'] }),
  T('N0WvrneAY2Q', 'crf', 'firstaid', 'fa_choking', 178, { kind: 'tuto', words: ['etouffement', 'fausse route', 'premiers secours'] }),
  T('H_QkQnklspw', 'crf', 'firstaid', 'fa_burn', 234, { kind: 'tuto', words: ['brulure', 'premiers secours', 'accidents domestiques'] }),
  T('RkRv6hIxQ14', 'crf', 'firstaid', 'fa_bleeding', 55, { kind: 'tuto', words: ['plaie', 'saignement', 'premiers secours'], not: ['grossesse', 'ivg', 'regles'] }),
  T('HEeQboKlGgM', 'crf', 'firstaid', 'fa_nosebleed', 18, { kind: 'tuto', words: ['saignement de nez', 'epistaxis', 'premiers secours'], not: ['grossesse'] }),
  T('H-Y1pEBS4Es', 'crf', 'firstaid', 'fa_drowning', 59, { kind: 'tuto', words: ['noyade', 'piscine', 'premiers secours'] }),
  T('3jLtqhl_12g', 'crf', 'firstaid', 'fa_alert', 44, { kind: 'tuto', words: ['appeler le 15', 'urgence', 'premiers secours'] }),
  T('fx1YLnubMBU', 'crf', 'firstaid', 'fa_4_steps', 25, { kind: 'tuto', words: ['premiers secours', 'appeler le 15', 'inconscient', 'accidents domestiques'], not: ['contraception', 'testicule'] }),
  // Démarches (tutos Assurance Maladie)
  T('CkNVCLUUpLQ', 'ameli', 'admin', 'adm_newborn', 199, { kind: 'tuto', words: ['declaration de naissance', 'medecin traitant', 'carte vitale', 'premieres demarches'], not: ['jaunisse', 'nuits', 'deuil'] }),
  T('SRVo3_EqEM4', 'ameli', 'admin', 'adm_gp_child', 31, { kind: 'tuto', words: ['medecin traitant', 'declaration de naissance', 'carnet de sante'], not: ['coleres', 'ecrans', 'deuil'] }),
  T('kdL-ZFnYTAI', 'ameli', 'admin', 'adm_mes_child', 52, { kind: 'tuto', words: ['mon espace sante', 'carnet de sante', 'dossier medical'] }),
  T('RIDlo2rrajc', 'ameli', 'admin', 'adm_ameli_account', 105, { kind: 'tuto', words: ['compte ameli', 'demarches', 'remboursement'], not: ['deuil', 'ivg'] }),
  T('6MuLsu67XAo', 'ameli', 'admin', 'adm_vitale', 132, { kind: 'tuto', words: ['carte vitale', 'demarches', 'compte ameli'], not: ['deuil'] }),
  T('ozG82YWHd3c', 'ameli', 'admin', 'adm_vaccine_cert', 87, { kind: 'tuto', words: ['attestation', 'vaccination', 'compte ameli'] }),
  T('wHGenyaiEl8', 'min', 'admin', 'adm_psy', 149, { kind: 'tuto', words: ['soutien psy', 'psychologue', 'depression'], not: ['amp', 'coeliaque', 'ceam'] }),
  // Prendre soin de soi
  T('WYXMz1tMAWk', 'crf', 'me', 'parental_burnout', 92, { words: ['epuisement parental', 'burn-out parental', 'fatigue'] }),
  T('1qal7GQuWBA', 'crf', 'me', 'entrust_baby', 188, { words: ['faire garder', 'confier', 'temps pour soi', 'relais'] }),
  T('a-eSmB10Iuo', 'ameli', 'me', 'mind_care', 2311, { words: ['sante mentale', 'anxiete', 'grossesse', 'depression'] }),
  T('EjbXcazvNHs', 'ameli', 'me', 'stress', 75, { words: ['stress', 'anxiete', 'relaxation'] }),
  T('xWO7zMmE8-c', 'ameli', 'me', 'violence_women', 1087, { words: ['violences conjugales', 'violences sexuelles', 'violences'], not: ['confiance', 'fertilite', 'educatives'] }),
];

export const VIDEO_TOPICS: VideoTopic[] = ['cycle', 'contraception', 'fertility', 'pregnancy', 'birth', 'baby', 'sleep', 'feeding', 'meals', 'health', 'firstaid', 'admin', 'couple', 'me'];

/** Toutes les vidéos (1er lot + 2e lot). */
export const ALL_VIDEOS: OfficialVideo[] = [...OFFICIAL_VIDEOS, ...MORE_VIDEOS];
export const TUTOS: OfficialVideo[] = ALL_VIDEOS.filter((v) => v.kind === 'tuto');

/** Mots-clés par thème, quand une vidéo n'a pas les siens. */
export const TOPIC_WORDS: Record<VideoTopic, string[]> = {
  cycle: ['regles', 'cycle', 'endometriose'], contraception: ['contraception', 'pilule', 'sterilet', 'preservatif'],
  fertility: ['fertilite', 'concevoir', 'ovulation', 'preconceptionnelle'], pregnancy: ['grossesse', 'enceinte'],
  birth: ['accouchement', 'post-partum', 'maternite'], baby: ['bebe', 'nourrisson'], sleep: ['sommeil', 'nuit'],
  feeding: ['allaitement', 'biberon'], meals: ['repas', 'diversification', 'alimentation'], health: ['fievre', 'maladie', 'vaccin'],
  firstaid: ['premiers secours', 'urgence', 'accidents domestiques'], admin: ['demarches', 'droits', 'caf', 'ameli'],
  couple: ['couple', 'charge mentale'], me: ['sante mentale', 'fatigue', 'epuisement'],
};

/** Thèmes à proposer en premier selon les parcours actifs (les autres restent accessibles). */
export const TOPICS_BY_JOURNEY: Record<VideoJourney, VideoTopic[]> = {
  avoid: ['cycle', 'contraception', 'me'], ttc: ['fertility', 'cycle', 'me'], pregnant: ['pregnancy', 'birth', 'admin', 'me'],
  newborn: ['baby', 'sleep', 'feeding', 'health', 'firstaid', 'me'], child: ['meals', 'health', 'firstaid', 'sleep', 'me'],
};

/** Thème à ouvrir en premier selon le moment de vie de la personne. */
export function defaultTopic(journeys: string[]): VideoTopic {
  if (journeys.includes('pregnant')) return 'pregnancy';
  if (journeys.includes('newborn')) return 'baby';
  if (journeys.includes('child')) return 'meals';
  if (journeys.includes('ttc')) return 'fertility';
  if (journeys.includes('avoid')) return 'cycle';
  return 'me';
}

/** Ordre des thèmes : ceux du moment de vie d'abord, puis les autres. */
export function orderedTopics(journeys: string[]): VideoTopic[] {
  const first = journeys.flatMap((j) => TOPICS_BY_JOURNEY[j as VideoJourney] ?? []);
  return [...new Set([...first, ...VIDEO_TOPICS])];
}

/** Durée lisible : « 1 min », « 45 min ». */
export function durationMinutes(sec?: number): number | null {
  return sec ? Math.max(1, Math.round(sec / 60)) : null;
}

const ID = /^[A-Za-z0-9_-]{11}$/;

/** Lecteur YouTube sans cookie (youtube-nocookie.com), lancé à la demande, vidéos proposées limitées à la chaîne. */
export function embedUrl(id: string, opts: { origin?: string; lang?: string } = {}): string {
  if (!ID.test(id)) throw new Error('Identifiant vidéo invalide');
  const p = new URLSearchParams({ autoplay: '1', playsinline: '1', rel: '0', modestbranding: '1', hl: opts.lang ?? 'fr', cc_lang_pref: opts.lang ?? 'fr' });
  if (opts.origin) p.set('origin', opts.origin);
  return `https://www.youtube-nocookie.com/embed/${id}?${p.toString()}`;
}

/** Lien pour ouvrir la vidéo sur YouTube (secours si le lecteur intégré ne charge pas). */
export function watchUrl(id: string): string {
  if (!ID.test(id)) throw new Error('Identifiant vidéo invalide');
  return `https://www.youtube.com/watch?v=${id}`;
}

export function videoById(id: string): OfficialVideo | undefined {
  return ALL_VIDEOS.find((v) => v.id === id);
}

/** Articles de la bibliothèque qui prolongent une vidéo (mêmes règles que les articles des outils). */
export function articlesForVideo<T extends { id: string; title: string; slug: string; tags?: string[]; journeys?: string[]; category_id?: string | null }>(
  video: OfficialVideo, articles: T[], slugOf: Map<string, string | null | undefined>, n = 3,
): T[] {
  const topic = { words: video.words ?? TOPIC_WORDS[video.topic], cats: video.cats, journeys: video.journeys, not: video.not };
  return articles
    .map((a) => ({ a, s: toolArticleScore(topic as never, a as never, slugOf.get(a.category_id ?? '') ?? undefined) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s || x.a.title.length - y.a.title.length)
    .slice(0, n)
    .map((x) => x.a);
}
